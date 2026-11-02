<?php
declare(strict_types=1);

$page_title = 'Answer Explanation & Video | Skymenu CBT';
require_once __DIR__ . '/cbt_db.php';
require_once __DIR__ . '/render.php';
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function answer_h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$questionId = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT);
if ($questionId === false || $questionId === null || $questionId < 1) {
    http_response_code(400);
    $pageError = 'A valid question reference was not provided.';
    $question = null;
} else {
    $pageError = '';
    $question = null;
    try {
        $stmt = $pdo->prepare(
            'SELECT q.id, q.subject_id, q.exam_category_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                    q.correct_option, q.answer_explanation, q.answer_video_path, q.exam_year,
                    s.subject_name, ec.category_name
             FROM questions q
             INNER JOIN subjects s ON s.id = q.subject_id
             INNER JOIN exam_category ec ON ec.id = q.exam_category_id
             WHERE q.id = :id AND q.is_active = 1
             LIMIT 1'
        );
        $stmt->execute([':id' => $questionId]);
        $question = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if (!$question) {
            http_response_code(404);
            $pageError = 'The requested question was not found or is no longer available.';
        }
    } catch (PDOException $e) {
        error_log('CBT answer details load failed: ' . $e->getMessage());
        http_response_code(500);
        $pageError = 'Answer details could not be loaded. Please check that the answer explanation and illustration columns have been added to the questions table.';
    }
}

// Find adjacent active questions in the same subject, exam category, and exam year.
$previousQuestionId = null;
$nextQuestionId = null;
if ($question) {
    try {
        $navStmt = $pdo->prepare(
            'SELECT id
             FROM questions
             WHERE is_active = 1
               AND subject_id = :subject_id
               AND exam_category_id = :category_id
               AND exam_year = :exam_year
               AND id < :question_id
             ORDER BY id DESC
             LIMIT 1'
        );
        $navStmt->execute([
            ':subject_id' => (int) $question['subject_id'],
            ':category_id' => (int) $question['exam_category_id'],
            ':exam_year' => (int) $question['exam_year'],
            ':question_id' => (int) $question['id'],
        ]);
        $previousQuestionId = $navStmt->fetchColumn();
        if ($previousQuestionId === false) {
            $previousQuestionId = null;
        }

        $navStmt = $pdo->prepare(
            'SELECT id
             FROM questions
             WHERE is_active = 1
               AND subject_id = :subject_id
               AND exam_category_id = :category_id
               AND exam_year = :exam_year
               AND id > :question_id
             ORDER BY id ASC
             LIMIT 1'
        );
        $navStmt->execute([
            ':subject_id' => (int) $question['subject_id'],
            ':category_id' => (int) $question['exam_category_id'],
            ':exam_year' => (int) $question['exam_year'],
            ':question_id' => (int) $question['id'],
        ]);
        $nextQuestionId = $navStmt->fetchColumn();
        if ($nextQuestionId === false) {
            $nextQuestionId = null;
        }
    } catch (PDOException $e) {
        error_log('CBT answer details navigation failed: ' . $e->getMessage());
        $previousQuestionId = null;
        $nextQuestionId = null;
    }
}

$answerOptions = [];
$correctIndex = -1;
$correctLetter = '';
$illustrationUrl = '';
$illustrationType = '';
if ($question) {
    $answerOptions = [
        (string) $question['option_a'],
        (string) $question['option_b'],
        (string) $question['option_c'],
        (string) $question['option_d'],
    ];
    $correctIndex = (int) $question['correct_option'];
    if ($correctIndex >= 0 && $correctIndex <= 3) {
        $correctLetter = chr(65 + $correctIndex);
    }

    // Accept only generated filenames in the dedicated illustration upload directory.
    // Video files and image files are both supported.
    $storedPath = trim((string) ($question['answer_video_path'] ?? ''));
    if (preg_match('#^uploads/question-videos/[a-f0-9]{32}\.(mp4|webm|ogv|ogg|jpg|jpeg|png|gif|webp)$#i', $storedPath) === 1) {
        $illustrationFile = __DIR__ . '/' . $storedPath;
        if (is_file($illustrationFile)) {
            $illustrationUrl = $storedPath;
            $extension = strtolower(pathinfo($storedPath, PATHINFO_EXTENSION));
            $illustrationType = in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)
                ? 'image'
                : 'video';
        }
    }
}

if (is_file(__DIR__ . '/header.php')) {
    include __DIR__ . '/header.php';
}
?>
<style>
.answer-page{background:#f4f7fb;min-height:70vh;padding:32px 16px 50px;color:#263445}
.answer-wrap{max-width:900px;margin:0 auto}
.answer-hero{background:linear-gradient(135deg,#0d3b66,#1769aa);color:#fff;border-radius:15px;padding:24px;margin-bottom:20px}
.answer-hero h1{margin:0 0 8px;font-size:clamp(24px,4vw,34px)}
.answer-hero p{margin:0;line-height:1.6;opacity:.95}
.answer-card{background:#fff;border-radius:13px;padding:25px;box-shadow:0 3px 14px rgba(0,0,0,.07);margin-bottom:18px}
.answer-card h2{color:#0d3b66;margin-top:0}
.answer-meta{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 20px}
.answer-tag{background:#eaf4fc;color:#0d3b66;border-radius:7px;padding:7px 10px;font-size:13px;font-weight:700}
.answer-question{font-size:20px;line-height:1.6;font-weight:750;white-space:pre-wrap}
.answer-options{list-style:none;padding:0;margin:18px 0;display:grid;gap:10px}
.answer-options li{padding:12px 14px;border:1px solid #dce3eb;border-radius:9px;line-height:1.5}
.answer-options li.correct-option{background:#e3f7eb;border-color:#9ed9b7;color:#12633a;font-weight:700}
.correct-badge{display:inline-block;margin-left:8px;padding:3px 7px;border-radius:5px;background:#138a4b;color:#fff;font-size:12px}
.explanation-body{line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere}
.answer-video{display:block;width:100%;max-height:520px;background:#111;border-radius:10px}
.answer-image{display:block;width:100%;height:auto;max-height:650px;object-fit:contain;background:#f7f9fc;border-radius:10px}
.answer-alert{background:#fff3cd;color:#795600;border:1px solid #f0d98a;border-radius:9px;padding:14px;line-height:1.6}
.answer-actions{display:flex;gap:10px;flex-wrap:wrap}
.answer-btn{display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;background:#1769aa;color:#fff}
.answer-btn.secondary{background:#e9edf2;color:#263445}
.answer-btn:focus-visible{outline:3px solid #f0b429;outline-offset:3px}
.answer-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px}
.answer-nav .answer-btn[aria-disabled="true"]{opacity:.45;pointer-events:none}
@media(max-width:600px){.answer-page{padding:20px 10px 35px}.answer-card{padding:18px}.answer-question{font-size:18px}}
@media print{header,footer,.answer-actions{display:none!important}.answer-page{padding:0;background:#fff}.answer-card,.answer-hero{box-shadow:none;break-inside:avoid}}
</style>
<main class="answer-page">
<div class="answer-wrap">
    <section class="answer-hero">
        <h1><font color="white">Answer Explanation &amp; Video Illustration</font></h1>
        <p>Review the correct answer and learn how to solve the question.</p>
    </section>

    <?php if ($pageError !== ''): ?>
        <section class="answer-card"><div class="answer-alert" role="alert"><?php echo answer_h($pageError); ?></div></section>
    <?php elseif ($question): ?>
        <section class="answer-card">
            <h2>Question <?php echo (int) $question['id']; ?></h2>
            <div class="answer-meta">
                <span class="answer-tag"><?php echo answer_h($question['subject_name']); ?></span>
                <span class="answer-tag"><?php echo answer_h($question['category_name']); ?></span>
                <span class="answer-tag">Exam Year: <?php echo (int) $question['exam_year']; ?></span>
            </div>
            <div class="answer-question"><?php echo cbt_format_text((string) $question['question_text']); ?></div>
            <ul class="answer-options">
                <?php foreach ($answerOptions as $index => $option): ?>
                    <li class="<?php echo $index === $correctIndex ? 'correct-option' : ''; ?>">
                        <strong><?php echo chr(65 + $index); ?>.</strong>
                        <?php echo answer_h($option); ?>
                        <?php if ($index === $correctIndex): ?><span class="correct-badge">Correct Answer</span><?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </section>

        <section class="answer-card">
            <h2>Answer Explanation</h2>
            <?php if (trim((string) ($question['answer_explanation'] ?? '')) !== ''): ?>
                <div class="explanation-body"><?php echo answer_h($question['answer_explanation']); ?></div>
            <?php else: ?>
                <p class="answer-alert">An explanation has not been added for this question yet.</p>
            <?php endif; ?>
        </section>

        <section class="answer-card">
            <h2>Video / Image Illustration</h2>
            <?php if ($illustrationUrl !== '' && $illustrationType === 'image'): ?>
                <img
                    class="answer-image"
                    src="<?php echo answer_h($illustrationUrl); ?>"
                    alt="Answer illustration for question <?php echo (int) $question['id']; ?>"
                    loading="lazy"
                >
            <?php elseif ($illustrationUrl !== '' && $illustrationType === 'video'): ?>
                <video class="answer-video" controls preload="metadata" playsinline>
                    <source src="<?php echo answer_h($illustrationUrl); ?>" type="<?php
                        $extension = strtolower(pathinfo($illustrationUrl, PATHINFO_EXTENSION));
                        echo $extension === 'webm' ? 'video/webm' : (($extension === 'ogv' || $extension === 'ogg') ? 'video/ogg' : 'video/mp4');
                    ?>">
                    Your browser does not support HTML video playback.
                    <a href="<?php echo answer_h($illustrationUrl); ?>">Open the answer video</a>.
                </video>
            <?php else: ?>
                <p class="answer-alert">No image or video illustration has been uploaded for this question yet, or the uploaded file is missing.</p>
            <?php endif; ?>
        </section>
    <?php endif; ?>

    <?php if ($question && $pageError === ''): ?>
        <nav class="answer-nav" aria-label="Question navigation">
            <?php if ($previousQuestionId !== null): ?>
                <a class="answer-btn secondary" href="answer_details.php?id=<?php echo (int) $previousQuestionId; ?>" rel="prev">&larr; Previous Question</a>
            <?php else: ?>
                <span class="answer-btn secondary" aria-disabled="true"> &larr; Previous Question</span>
            <?php endif; ?>

            <?php if ($nextQuestionId !== null): ?>
                <a class="answer-btn" href="answer_details.php?id=<?php echo (int) $nextQuestionId; ?>" rel="next">Next Question &rarr;</a>
            <?php else: ?>
                <span class="answer-btn" aria-disabled="true">Next Question &rarr;</span>
            <?php endif; ?>
        </nav>
    <?php endif; ?>

    <div class="answer-actions">
        <a class="answer-btn" href="cbt.php">Return to CBT Page</a>
        <button class="answer-btn" type="button" onclick="window.print()" style="border:0;cursor:pointer">Print Explanation</button>
    </div>
</div>
</main>
<?php if (is_file(__DIR__ . '/footer.php')) { include __DIR__ . '/footer.php'; } ?>
