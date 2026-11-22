<?php
$page_title = "Online CBT Examination | Skymenu";
require_once __DIR__ . '/cbt_db.php';

$subjects = [];
$examCategories = [];
$examYears = [];
$practiceTitles = [];
$dbQuestions = [];
$questionsForBrowser = [];
$examStarted = false;
$setupError = '';
$selectedSubjectId = 0;
$selectedCategoryId = 0;
$selectedExamYear = 0;
$selectedPracticeTitle = '';
$selectedSubjectName = '';
$selectedCategoryName = '';
$candidateName = '';
$candidatePhone = '';
$candidateEmail = '';
$practice_title = '';
$attemptId = 0;

try {
    // Load active subjects and exam categories for the setup form.
    $subjects = $pdo->query(
        "SELECT id, subject_name FROM subjects WHERE is_active = 1 ORDER BY subject_name"
    )->fetchAll();
    $examCategories = $pdo->query(
        "SELECT id, category_name FROM exam_category WHERE is_active = 1 and id >= 11 ORDER BY category_name"
    )->fetchAll();
    // Only offer years that currently have active questions.
    $examYears = array_map('intval', $pdo->query(
        "SELECT DISTINCT exam_year FROM questions WHERE is_active = 1 ORDER BY exam_year DESC"
    )->fetchAll(PDO::FETCH_COLUMN));

    // Load available practice titles from active questions.
    $practiceTitles = $pdo->query(
        "SELECT DISTINCT practice_title
         FROM questions
         WHERE is_active = 1
           AND practice_title IS NOT NULL
           AND TRIM(practice_title) <> ''
         ORDER BY practice_title"
    )->fetchAll(PDO::FETCH_COLUMN);
    $practiceTitles = array_map('strval', $practiceTitles);

    $subjectsById = [];
    foreach ($subjects as $subject) {
        $subjectsById[(int) $subject['id']] = $subject;
    }

    $categoriesById = [];
    foreach ($examCategories as $category) {
        $categoriesById[(int) $category['id']] = $category;
    }

    // Collect candidate details and validate the setup form before loading questions.
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['start_exam'])) {
        $candidateName = trim((string) ($_POST['candidate_name'] ?? ''));
        $candidatePhone = trim((string) ($_POST['candidate_phone'] ?? ''));
        $candidateEmail = trim((string) ($_POST['candidate_email'] ?? ''));

        $subjectValue = filter_var($_POST['subject_id'] ?? '', FILTER_VALIDATE_INT);
        $categoryValue = filter_var($_POST['exam_category_id'] ?? '', FILTER_VALIDATE_INT);
        $yearValue = filter_var($_POST['exam_year'] ?? '', FILTER_VALIDATE_INT);
        $selectedPracticeTitle = trim((string) ($_POST['practice_title'] ?? ''));
        $selectedSubjectId = ($subjectValue !== false && $subjectValue !== null) ? (int) $subjectValue : 0;
        $selectedCategoryId = ($categoryValue !== false && $categoryValue !== null) ? (int) $categoryValue : 0;
        $selectedExamYear = ($yearValue !== false && $yearValue !== null) ? (int) $yearValue : 0;

        
        
       if (!isset($subjectsById[$selectedSubjectId]) || !isset($categoriesById[$selectedCategoryId])) {
            $setupError = 'Please select a valid subject and exam category.';
        } elseif (!in_array($selectedExamYear, $examYears, true)) {
            $setupError = 'Please select a valid exam year that has active questions.';
        } elseif (!in_array($selectedPracticeTitle, $practiceTitles, true)) {
            $setupError = 'Please select a valid practice topic or title.';
        } else {
            $stmt = $pdo->prepare(
                "SELECT id, question_text, question_image_path, option_a, option_b, option_c, option_d, correct_option
                 FROM questions
                 WHERE is_active = 1
                   AND subject_id = :subject_id
                   AND exam_category_id = :exam_category_id
                   AND exam_year = :exam_year
                    AND practice_title = :practice_title
                 ORDER BY RAND()
                 LIMIT 50"
            );
            $stmt->execute([
                ':subject_id' => $selectedSubjectId,
                ':exam_category_id' => $selectedCategoryId,
                ':exam_year' => $selectedExamYear,
                ':practice_title' => $selectedPracticeTitle,
            ]);
            $dbQuestions = $stmt->fetchAll();

            if (!$dbQuestions) {
                $setupError = 'There are no active questions for this subject and exam category yet. Please choose another combination.';
            } else {
                // Save the candidate and selected exam in MySQL before showing the test.
                // Each start creates a separate attempt record, even for repeat candidates.
                $saveAttempt = $pdo->prepare(
                    "INSERT INTO cbt_exam_attempts
" .
                    " (candidate_name, candidate_phone, candidate_email, subject_id, exam_category_id)
" .
                    " VALUES (:candidate_name, :candidate_phone, :candidate_email, :subject_id, :exam_category_id)"
                );
                $saveAttempt->execute([
                    ':candidate_name' => $candidateName,
                    ':candidate_phone' => $candidatePhone,
                    ':candidate_email' => $candidateEmail,
                    ':subject_id' => $selectedSubjectId,
                    ':exam_category_id' => $selectedCategoryId,
                ]);
                $attemptId = (int) $pdo->lastInsertId();

                $examStarted = true;
                $selectedSubjectName = $subjectsById[$selectedSubjectId]['subject_name'];
                $selectedCategoryName = $categoriesById[$selectedCategoryId]['category_name'];
            }
        }
    }
} catch (PDOException $e) {
    error_log('CBT setup or question loading failed: ' . $e->getMessage());
    http_response_code(500);
    exit('The examination setup could not be loaded. Please contact the site administrator.');
}

$questionsForBrowser = array_map(static function (array $row): array {
    return [
        'id' => (int) $row['id'],
        'question' => $row['question_text'],
        // Only expose image paths generated by the question-image uploader.
        'image' => (isset($row['question_image_path'])
            && is_string($row['question_image_path'])
            && preg_match('~^uploads/question-images/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp|gif)$~i', $row['question_image_path']) === 1
                ? $row['question_image_path']
                : ''),
        'options' => [$row['option_a'], $row['option_b'], $row['option_c'], $row['option_d']],
        'answer' => (int) $row['correct_option'],
    ];
}, $dbQuestions);

include __DIR__ . '/header.php';
?>

<style>
/* =========================================================
   SKYMENU ONLINE CBT
   Self-contained page styles
========================================================= */
.cbt-page {
    background: #f4f7fb;
    padding: 35px 16px 55px;
    min-height: 650px;
}
.cbt-container {
    max-width: 1100px;
    margin: 0 auto;
}
.cbt-intro {
    background: linear-gradient(135deg, #0d3b66, #1769aa);
    color: #fff;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 8px 25px rgba(13,59,102,.15);
}
.cbt-intro h1 { margin: 0 0 8px; font-size: clamp(25px,4vw,36px); }
.cbt-intro p { margin: 0; opacity: .92; line-height: 1.6; }

.cbt-topbar {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    align-items: center;
    background: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 18px;
    box-shadow: 0 3px 14px rgba(0,0,0,.07);
}
.cbt-progress-wrap { flex: 1; }
.cbt-progress-text { font-weight: 700; margin-bottom: 7px; }
.cbt-progress {
    height: 9px;
    background: #e6ebf2;
    border-radius: 99px;
    overflow: hidden;
}
.cbt-progress-bar {
    width: 2%;
    height: 100%;
    background: #1769aa;
    border-radius: inherit;
    transition: width .25s ease;
}
.cbt-timer {
    min-width: 105px;
    text-align: center;
    font-weight: 800;
    font-size: 18px;
    background: #fff3cd;
    color: #795600;
    padding: 10px 14px;
    border-radius: 9px;
}
.cbt-timer.warning { background: #ffe0e0; color: #a40000; }

.cbt-layout {
    display: grid;
    grid-template-columns: 1fr 245px;
    gap: 18px;
}
.cbt-card {
    background: #fff;
    border-radius: 14px;
    padding: 26px;
    box-shadow: 0 3px 14px rgba(0,0,0,.07);
}
.question-number {
    display: inline-block;
    background: #eaf3fb;
    color: #0d3b66;
    padding: 7px 11px;
    border-radius: 7px;
    font-weight: 800;
    margin-bottom: 15px;
}
.question-text {
    font-size: 20px;
    line-height: 1.55;
    font-weight: 700;
    margin: 0 0 22px;
}
.question-diagram-wrap {
    margin: 0 0 22px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #dce3eb;
    border-radius: 10px;
    text-align: center;
}
.question-diagram {
    display: block;
    max-width: 100%;
    max-height: 420px;
    height: auto;
    margin: 0 auto;
    object-fit: contain;
}
.question-diagram-caption {
    margin: 7px 0 0;
    color: #536273;
    font-size: 13px;
}
.result-question-image {
    display: block;
    max-width: 220px;
    max-height: 150px;
    height: auto;
    margin-top: 8px;
    border: 1px solid #dce3eb;
    border-radius: 6px;
}
.options {
    display: grid;
    gap: 12px;
}
.option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border: 1px solid #dce3eb;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: .2s;
}
.option:hover { border-color: #1769aa; background: #f7fbff; }
.option.selected { border-color: #1769aa; background: #eaf4fc; }
.option input { margin-top: 4px; accent-color: #1769aa; }
.option span { line-height: 1.45; }

.cbt-actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 25px;
}
.cbt-btn {
    border: 0;
    border-radius: 9px;
    padding: 12px 20px;
    font-weight: 700;
    cursor: pointer;
}
.cbt-btn:disabled { opacity: .45; cursor: not-allowed; }
.cbt-prev { background: #e9edf2; color: #273444; }
.cbt-next { background: #1769aa; color: #fff; }
.cbt-submit { background: #138a4b; color: #fff; display:none; }

.question-nav h3 { margin-top: 0; }
.number-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
}
.q-number {
    border: 1px solid #d8e0e8;
    background: #fff;
    border-radius: 7px;
    min-height: 37px;
    cursor: pointer;
    font-weight: 700;
}
.q-number.current { background: #1769aa; color:#fff; border-color:#1769aa; }
.q-number.answered { background: #dff5e8; color:#126b3c; border-color:#b8e5ca; }
.q-number.current.answered { background:#1769aa; color:#fff; }

.legend {
    font-size: 12px;
    margin-top: 15px;
    line-height: 1.8;
}
.dot {
    display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px;
    background:#fff; border:1px solid #d8e0e8;
}
.dot.a { background:#dff5e8; border-color:#b8e5ca; }
.dot.c { background:#1769aa; border-color:#1769aa; }

.cbt-result {
    display:none;
    text-align:left;
    padding:30px 24px;
}
.result-sheet-header { text-align:center; border-bottom:2px solid #0d3b66; padding-bottom:18px; margin-bottom:20px; }
.result-sheet-header h2 { margin:0 0 7px; color:#0d3b66; font-size:clamp(22px,3vw,30px); }
.result-sheet-header p { margin:0; color:#536273; }
.result-meta-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
.result-meta-item { background:#f7f9fc; border:1px solid #e2e8f0; border-radius:8px; padding:11px 13px; min-width:0; overflow-wrap:anywhere; }
.result-meta-item strong { display:block; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:#536273; margin-bottom:5px; }
.result-meta-item span { color:#1f2d3d; font-weight:700; }
.result-summary { display:flex; align-items:center; gap:20px; flex-wrap:wrap; border-bottom:1px solid #e2e8f0; padding:0 0 20px; margin-bottom:20px; }
.score-circle { flex:0 0 105px; width:105px; height:105px; border-radius:50%; margin:0; display:flex; align-items:center; justify-content:center; background:#eaf4fc; color:#1769aa; font-size:27px; font-weight:900; border:5px solid #d5eafb; box-sizing:border-box; }
.result-summary-details { flex:1; min-width:200px; }
.result-summary-details h3 { margin:0 0 7px; color:#0d3b66; }
.result-message { line-height:1.6; margin:0 0 10px; }
.result-stats { display:flex; gap:8px; flex-wrap:wrap; }
.result-stat { padding:6px 10px; border-radius:7px; background:#f1f5f9; font-size:13px; font-weight:700; }
.result-stat.correct { background:#e3f7eb; color:#12633a; }
.result-stat.incorrect { background:#ffe8e8; color:#8e1717; }
.result-stat.unanswered { background:#fff3cd; color:#795600; }
.result-table-heading { color:#0d3b66; margin:0 0 12px; }
.result-table-wrap { overflow-x:auto; }
.result-table { border-collapse:collapse; width:100%; font-size:14px; }
.result-table th,.result-table td { border:1px solid #dce3eb; padding:10px 11px; text-align:left; vertical-align:top; }
.result-table th { background:#edf4fb; color:#0d3b66; }
.result-table tbody tr:nth-child(even) { background:#fafcff; }
.result-pill { display:inline-block; border-radius:5px; padding:4px 7px; font-size:12px; font-weight:800; white-space:nowrap; }
.result-pill.correct { background:#dff5e8; color:#126b3c; }
.result-pill.incorrect { background:#ffe0e0; color:#a40000; }
.result-pill.unanswered { background:#fff3cd; color:#795600; }
.answer-details-btn { display:inline-block; padding:7px 10px; border-radius:7px; background:#1769aa; color:#fff; text-decoration:none; font-weight:700; white-space:nowrap; }
.answer-details-btn:hover { background:#0d3b66; }
.result-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; }
.print-result-btn { background:#138a4b; color:#fff; }
.restart-btn { background:#1769aa; color:#fff; }
@media (max-width:600px) { .result-meta-grid { grid-template-columns:1fr; } .cbt-result { padding:20px 14px; } .result-table { font-size:12px; } .result-table th,.result-table td { padding:8px; } }
@media print {
    @page { size:auto; margin:12mm; }
    body * { visibility:hidden !important; }
    #resultArea, #resultArea * { visibility:visible !important; }
    #resultArea { display:block !important; position:absolute !important; inset:0 auto auto 0 !important; width:100% !important; max-width:none !important; margin:0 !important; padding:0 !important; box-shadow:none !important; border-radius:0 !important; }
    .result-actions { display:none !important; }
    .result-meta-item,.result-table th,.result-table tr { break-inside:avoid; }
    .result-table { font-size:10pt; }
}
.cbt-selection { max-width: 760px; margin: 0 auto 18px; }
.cbt-selection h2 { margin-top: 0; color: #0d3b66; }
.cbt-selection p { line-height: 1.6; }
.cbt-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 22px 0; }
.cbt-field label { display: block; font-weight: 700; margin-bottom: 8px; color: #273444; }
.cbt-field select,
.cbt-field input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #d8e0e8; border-radius: 9px; background: #fff; color: #273444; font: inherit; }
.cbt-field input:focus,
.cbt-field select:focus { outline: 2px solid #1769aa; outline-offset: 1px; }
.cbt-start { background: #138a4b; color: #fff; }
.cbt-start:hover { background: #0f743f; }
.cbt-start:disabled { opacity: .5; cursor: not-allowed; }
.cbt-alert { background: #fff3cd; color: #795600; border: 1px solid #f0d98a; border-radius: 9px; padding: 12px 14px; margin: 15px 0; line-height: 1.5; }
.cbt-exam-meta { background: #eaf4fc; color: #0d3b66; border-radius: 10px; padding: 13px 16px; margin-bottom: 18px; line-height: 1.6; font-weight: 700; }

@media (max-width: 800px) {
    .cbt-layout { grid-template-columns: 1fr; }
    .question-nav { order: 2; }
}
@media (max-width: 600px) {
    .cbt-page { padding: 20px 10px 40px; }
    .cbt-intro, .cbt-card { padding: 20px; }
    .cbt-form-grid { grid-template-columns: 1fr; }
    .cbt-topbar { align-items: stretch; flex-direction: column; }
    .cbt-timer { width: auto; }
    .question-text { font-size: 18px; }
    .cbt-actions { flex-wrap: wrap; }
    .cbt-btn { flex: 1; }
}
</style>

<main class="cbt-page">
<div class="cbt-container">

    <section class="cbt-intro">
        <h1><font color = "white">CBT Exam Practice</font></h1>
        <p>Enter your details, then choose the subject, practice topic/title, practice category, and exam year. Up to 50 matching active questions will be selected randomly.</p>
    </section>

    <?php if (!$examStarted): ?>
        <section class="cbt-card cbt-selection">
            <h2>Choose Your Examination</h2>
            <p>Select the subject and exam category you want to practise. Up to 50 matching questions will be loaded for your test.</p>

            <?php if ($setupError !== ''): ?>
                <div class="cbt-alert" role="alert"><?php echo htmlspecialchars($setupError, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>

            <?php if (!$subjects || !$examCategories || !$examYears): ?>
                <div class="cbt-alert" role="alert">
                    No active subjects, exam categories, or exam years with active questions were found. Please ask the administrator to add and activate the required data first.
                </div>
            <?php endif; ?>

            <form method="post">
                <div class="cbt-form-grid">
                   
                    
                    
                    <input type="hidden" id="candidate_name" name="candidate_name"
                               value="practice"
                               maxlength="150" autocomplete="name" >
                   
                    
                    
                    <div class="cbt-field">
                        <label for="subject_id">Subject</label>
                        <select id="subject_id" name="subject_id" required>
                            <option value="">-- Select Subject --</option>
                            <?php foreach ($subjects as $subject): ?>
                                <option value="<?php echo (int) $subject['id']; ?>" <?php echo ((int) $subject['id'] === $selectedSubjectId) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($subject['subject_name'], ENT_QUOTES, 'UTF-8'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    
                   
                    <div class="cbt-field">
                        <label for="practice_title">Practice Topic / Title</label>
                        <select id="practice_title" name="practice_title" required>
                            <option value="">-- Select Practice Topic / Title --</option>
                            <?php foreach ($practiceTitles as $title): ?>
                                <option value="<?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>" <?php echo ($title === $selectedPracticeTitle) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="cbt-field">
                        <label for="exam_category_id">Practice Category</label>
                        <select id="exam_category_id" name="exam_category_id" required>
                            <option value="">-- Select Exam Category --</option>
                            <?php foreach ($examCategories as $category): ?>
                                <option value="<?php echo (int) $category['id']; ?>" <?php echo ((int) $category['id'] === $selectedCategoryId) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($category['category_name'], ENT_QUOTES, 'UTF-8'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                     <div class="cbt-field">
                        <label for="exam_year">Exam Year</label>
                        <select id="exam_year" name="exam_year" required>
                            <option value="">-- Select Exam Year --</option>
                            <?php foreach ($examYears as $year): ?>
                                <option value="<?php echo (int) $year; ?>" <?php echo ((int) $year === $selectedExamYear) ? 'selected' : ''; ?>>
                                    <?php echo (int) $year; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    
                    
                </div>
                <button type="submit" name="start_exam" value="1" class="cbt-btn cbt-start" <?php echo (!$subjects || !$examCategories || !$examYears) ? 'disabled' : ''; ?>>Start Examination</button>
            </form>
        </section>
    <?php else: ?>
        <div class="cbt-exam-meta">
            Attempt Reference: #<?php echo (int) $attemptId; ?><br>
            Candidate: <?php echo htmlspecialchars($candidateName, ENT_QUOTES, 'UTF-8'); ?>
            <span aria-hidden="true"> | </span>
            Phone: <?php echo htmlspecialchars($candidatePhone, ENT_QUOTES, 'UTF-8'); ?>
            <span aria-hidden="true"> | </span>
            Email: <?php echo htmlspecialchars($candidateEmail, ENT_QUOTES, 'UTF-8'); ?><br>
            Subject: <?php echo htmlspecialchars($selectedSubjectName, ENT_QUOTES, 'UTF-8'); ?>
            <span aria-hidden="true"> | </span>
            Practice Topic / Title: <?php echo htmlspecialchars($selectedPracticeTitle, ENT_QUOTES, 'UTF-8'); ?>
            <span aria-hidden="true"> | </span>
            Exam Category: <?php echo htmlspecialchars($selectedCategoryName, ENT_QUOTES, 'UTF-8'); ?>
            <span aria-hidden="true"> | </span>
            Exam Year: <?php echo (int) $selectedExamYear; ?>
            <span aria-hidden="true"> | </span>
            Questions: <?php echo count($dbQuestions); ?>
        </div>

        <div class="cbt-topbar">
            <div class="cbt-progress-wrap">
                <div class="cbt-progress-text">
                    Question <span id="currentNo">1</span> of <span id="totalNo">50</span>
                </div>
                <div class="cbt-progress">
                    <div class="cbt-progress-bar" id="progressBar"></div>
                </div>
            </div>
            <div class="cbt-timer" id="timer"><?php $initialTimerSeconds = (int) ceil(count($dbQuestions) * 0.8 * 60); echo sprintf('%02d:%02d', intdiv($initialTimerSeconds, 60), $initialTimerSeconds % 60); ?></div>
        </div>

        <div class="cbt-layout" id="examArea">
            <section class="cbt-card">
                <div id="questionArea"></div>

                <div class="cbt-actions">
                    <button type="button" class="cbt-btn cbt-prev" id="prevBtn">Previous</button>
                    <button type="button" class="cbt-btn cbt-next" id="nextBtn">Next</button>
                    <button type="button" class="cbt-btn cbt-submit" id="submitBtn">Submit Test</button>
                </div>
            </section>

            <aside class="cbt-card question-nav">
                <h3>Questions</h3>
                <div class="number-grid" id="questionNumbers"></div>
                <div class="legend">
                    <div><span class="dot a"></span> Answered</div>
                    <div><span class="dot c"></span> Current</div>
                    <div><span class="dot"></span> Not answered</div>
                </div>
            </aside>
        </div>

        <section class="cbt-card cbt-result" id="resultArea">
            <div class="result-sheet-header">
                <h2>SKYMENU CBT EXAMINATION RESULT SHEET</h2>
                <p>Candidate performance and answer review</p>
            </div>

            <div class="result-meta-grid">
                <div class="result-meta-item"><strong>Candidate Name</strong><span><?php echo htmlspecialchars($candidateName, ENT_QUOTES, 'UTF-8'); ?></span></div>
                <div class="result-meta-item"><strong>Attempt Reference</strong><span>#<?php echo (int) $attemptId; ?></span></div>
                <div class="result-meta-item"><strong>Phone Number</strong><span><?php echo htmlspecialchars($candidatePhone !== '' ? $candidatePhone : 'Not provided', ENT_QUOTES, 'UTF-8'); ?></span></div>
                <div class="result-meta-item"><strong>Email Address</strong><span><?php echo htmlspecialchars($candidateEmail !== '' ? $candidateEmail : 'Not provided', ENT_QUOTES, 'UTF-8'); ?></span></div>
                <div class="result-meta-item"><strong>Subject</strong><span><?php echo htmlspecialchars($selectedSubjectName, ENT_QUOTES, 'UTF-8'); ?></span></div>
                <div class="result-meta-item"><strong>Exam Category</strong><span><?php echo htmlspecialchars($selectedCategoryName, ENT_QUOTES, 'UTF-8'); ?></span></div>
                <div class="result-meta-item"><strong>Exam Year</strong><span><?php echo (int) $selectedExamYear; ?></span></div>
                <div class="result-meta-item"><strong>Completion Date &amp; Time</strong><span id="completedAt">Will be shown after submission</span></div>
            </div>

            <div class="result-summary">
                <div class="score-circle" id="scoreCircle">0%</div>
                <div class="result-summary-details">
                    <h3>Examination Result</h3>
                    <p class="result-message" id="resultMessage"></p>
                    <div class="result-stats">
                        <span class="result-stat correct" id="correctStat">Correct: 0</span>
                        <span class="result-stat incorrect" id="incorrectStat">Incorrect: 0</span>
                        <span class="result-stat unanswered" id="unansweredStat">Unanswered: 0</span>
                    </div>
                </div>
            </div>

            <h3 class="result-table-heading">Candidate Choices and Correct Answers</h3>
            <div class="result-table-wrap">
                <table class="result-table">
                    <thead>
                        <tr><th>No.</th><th>Question</th><th>Candidate's Choice</th><th>Correct Answer</th><th>Result</th><th>Answer Details</th></tr>
                    </thead>
                    <tbody id="resultDetails"></tbody>
                </table>
            </div>

            <div class="result-actions">
                <button type="button" class="cbt-btn print-result-btn" onclick="window.print()">Print Result Sheet</button>
                <button type="button" class="cbt-btn restart-btn" onclick="location.reload()">Take Test Again</button>
            </div>
        </section>
    <?php endif; ?>

</div>
</main>

<?php if ($examStarted): ?>
<script>
// Questions are randomly selected from MySQL for the chosen subject/category.
// JSON_HEX_* prevents question text from breaking the script context.
const questions = <?php echo json_encode($questionsForBrowser, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;

const MAX_QUESTIONS = 50;
const MINUTES_PER_QUESTION = 0.8; // 0.8 minutes = 48 seconds per question
const total = Math.min(questions.length, MAX_QUESTIONS);
const EXAM_DURATION_SECONDS = Math.ceil(total * MINUTES_PER_QUESTION * 60);
const WARNING_THRESHOLD_SECONDS = Math.max(1, Math.ceil(EXAM_DURATION_SECONDS * 0.2));

let current = 0;
let answers = new Array(total).fill(null);
let timeLeft = EXAM_DURATION_SECONDS;
let submitted = false;

const questionArea = document.getElementById("questionArea");
const questionNumbers = document.getElementById("questionNumbers");
const currentNo = document.getElementById("currentNo");
const totalNo = document.getElementById("totalNo");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const timer = document.getElementById("timer");

totalNo.textContent = total;

function renderQuestion() {
    if (!total) {
        questionArea.innerHTML = "<p>No questions have been added yet.</p>";
        return;
    }

    const q = questions[current];
    currentNo.textContent = current + 1;
    progressBar.style.width = (((current + 1) / total) * 100) + "%";

    let html = `
        <div class="question-number">Question ${current + 1}</div>
        <p class="question-text">${escapeHtml(q.question)}</p>
    `;

    // The diagram is optional, so questions without one remain unchanged.
    if (q.image) {
        html += `
            <figure class="question-diagram-wrap">
                <img class="question-diagram" src="${escapeHtml(q.image)}"
                     alt="Diagram for question ${current + 1}" loading="eager">
                <figcaption class="question-diagram-caption">Question diagram</figcaption>
            </figure>
        `;
    }

    html += `<div class="options">`;

    q.options.forEach((option, index) => {
        const selected = answers[current] === index ? "selected" : "";
        html += `
            <label class="option ${selected}">
                <input type="radio" name="answer" value="${index}"
                    ${answers[current] === index ? "checked" : ""}>
                <span><strong>${String.fromCharCode(65 + index)}.</strong> ${escapeHtml(option)}</span>
            </label>
        `;
    });

    html += "</div>";
    questionArea.innerHTML = html;

    document.querySelectorAll('input[name="answer"]').forEach(input => {
        input.addEventListener("change", function() {
            answers[current] = Number(this.value);
            renderQuestion();
            renderQuestionNumbers();
        });
    });

    prevBtn.disabled = current === 0;
    nextBtn.style.display = current === total - 1 ? "none" : "block";
    submitBtn.style.display = current === total - 1 ? "block" : "none";
}

function renderQuestionNumbers() {
    questionNumbers.innerHTML = "";
    for (let i = 0; i < total; i++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "q-number";
        if (i === current) button.classList.add("current");
        if (answers[i] !== null) button.classList.add("answered");
        button.textContent = i + 1;
        button.addEventListener("click", () => {
            current = i;
            renderQuestion();
            renderQuestionNumbers();
        });
        questionNumbers.appendChild(button);
    }
}

prevBtn.addEventListener("click", () => {
    if (current > 0) {
        current--;
        renderQuestion();
        renderQuestionNumbers();
    }
});

nextBtn.addEventListener("click", () => {
    if (current < total - 1) {
        current++;
        renderQuestion();
        renderQuestionNumbers();
    }
});

submitBtn.addEventListener("click", submitTest);

function submitTest(forceSubmit = false) {
    if (submitted) return;

    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0 && !forceSubmit) {
        const proceed = confirm(
            `You have ${unanswered} unanswered question(s). Do you want to submit anyway?`
        );
        if (!proceed) return;
    }

    submitted = true;
    let score = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const resultBody = document.getElementById("resultDetails");
    resultBody.innerHTML = "";

    for (let i = 0; i < total; i++) {
        const q = questions[i];
        const chosenIndex = answers[i];
        const correctIndex = Number(q.answer);
        const isUnanswered = chosenIndex === null;
        const isCorrect = !isUnanswered && chosenIndex === correctIndex;

        if (isCorrect) {
            score++;
        } else if (isUnanswered) {
            unansweredCount++;
        } else {
            incorrectCount++;
        }

        const optionLetter = index => String.fromCharCode(65 + index);
        const choiceText = isUnanswered
            ? "Not answered"
            : `${optionLetter(chosenIndex)}. ${q.options[chosenIndex]}`;
        const correctText = `${optionLetter(correctIndex)}. ${q.options[correctIndex]}`;
        const statusText = isCorrect ? "Correct" : (isUnanswered ? "Unanswered" : "Incorrect");
        const statusClass = isCorrect ? "correct" : (isUnanswered ? "unanswered" : "incorrect");

        const row = document.createElement("tr");
        const numberCell = document.createElement("td");
        numberCell.textContent = String(i + 1);
        row.appendChild(numberCell);

        const questionCell = document.createElement("td");
        const questionLabel = document.createElement("div");
        questionLabel.textContent = q.question;
        questionCell.appendChild(questionLabel);
        if (q.image) {
            const questionImage = document.createElement("img");
            questionImage.className = "result-question-image";
            questionImage.src = q.image;
            questionImage.alt = `Diagram for question ${i + 1}`;
            questionImage.loading = "lazy";
            questionCell.appendChild(questionImage);
        }
        row.appendChild(questionCell);

        [choiceText, correctText].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        const statusCell = document.createElement("td");
        const statusPill = document.createElement("span");
        statusPill.className = `result-pill ${statusClass}`;
        statusPill.textContent = statusText;
        statusCell.appendChild(statusPill);
        row.appendChild(statusCell);

        // Show explanation/video links on the result sheet after submission.
        const detailsCell = document.createElement("td");
        const detailsLink = document.createElement("a");
        detailsLink.className = "answer-details-btn";
        detailsLink.href = "answer_details.php?id=" + encodeURIComponent(String(q.id));
        detailsLink.textContent = "View Explanation & Video";
        detailsCell.appendChild(detailsLink);
        row.appendChild(detailsCell);

        resultBody.appendChild(row);
    }

    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    document.getElementById("examArea").style.display = "none";
    document.querySelector(".cbt-topbar").style.display = "none";
    document.getElementById("resultArea").style.display = "block";

    document.getElementById("scoreCircle").textContent = percent + "%";
    document.getElementById("resultMessage").innerHTML =
        `You scored <strong>${score}</strong> out of <strong>${total}</strong> questions ` +
        `(${percent}%).`;
    document.getElementById("correctStat").textContent = `Correct: ${score}`;
    document.getElementById("incorrectStat").textContent = `Incorrect: ${incorrectCount}`;
    document.getElementById("unansweredStat").textContent = `Unanswered: ${unansweredCount}`;
    document.getElementById("completedAt").textContent = new Date().toLocaleString();
    const candidateFullName = <?php echo json_encode($candidateName, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE); ?>;
    document.title = "CBT Result Sheet - " + candidateFullName;
}

function updateTimer() {
    if (submitted) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timer.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    if (timeLeft <= WARNING_THRESHOLD_SECONDS) timer.classList.add("warning");

    if (timeLeft <= 0) {
        timer.textContent = "00:00";
        alert("Time is up. Your test will now be submitted.");
        submitTest(true);
        return;
    }

    timeLeft--;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

renderQuestion();
renderQuestionNumbers();
updateTimer();
setInterval(updateTimer, 1000);
</script>
<?php endif; ?>

<?php include __DIR__ . '/footer.php'; ?>
