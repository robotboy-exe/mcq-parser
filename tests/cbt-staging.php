<?php
declare(strict_types=1);

$databasePath = getenv('EL01_STAGING_DB') ?: '';
$baseUrl = rtrim(getenv('EL01_STAGING_URL') ?: '', '/');
$urlParts = parse_url($baseUrl);
if ($databasePath === '' || !is_file($databasePath)) {
    fwrite(STDERR, "FAIL: EL01_STAGING_DB must name the disposable SQLite database.\n");
    exit(1);
}
if (!is_array($urlParts) || !in_array($urlParts['host'] ?? '', ['127.0.0.1', 'localhost'], true)) {
    fwrite(STDERR, "FAIL: EL01_STAGING_URL must be a local disposable server.\n");
    exit(1);
}

$pdo = new PDO('sqlite:' . $databasePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('PRAGMA foreign_keys = ON');

$subjectLookup = $pdo->prepare('SELECT id FROM subjects WHERE subject_name = :name');
$subjectLookup->execute([':name' => 'English (Lexis & Structure)']);
$existingSubjectId = $subjectLookup->fetchColumn();
$subjectLookup->closeCursor();
$subjectId = $existingSubjectId === false ? 42 : (int) $existingSubjectId;
$categoryId = 3;
$examYear = 2032;
$candidateName = 'EL01 staging candidate';
$pdo->prepare(
    'INSERT INTO subjects (id, subject_name, description, is_active)
     VALUES (:id, :name, :description, 1)
     ON CONFLICT(id) DO UPDATE SET
         subject_name = excluded.subject_name,
         description = excluded.description,
         is_active = excluded.is_active'
)->execute([
    ':id' => $subjectId,
    ':name' => 'English (Lexis & Structure)',
    ':description' => 'Disposable EL01 staging subject',
]);

$pdo->prepare('DELETE FROM questions WHERE subject_id = :subject_id')
    ->execute([':subject_id' => $subjectId]);
$pdo->prepare('DELETE FROM cbt_exam_attempts WHERE candidate_name = :candidate_name')
    ->execute([':candidate_name' => $candidateName]);

$insert = $pdo->prepare(
    'INSERT INTO questions
        (id, subject_id, exam_category_id, exam_year, question_text, constant_text,
         option_a, option_b, option_c, option_d, correct_option, is_active, practice_title)
     VALUES
        (:id, :subject_id, :category_id, :exam_year, :question_text, :constant_text,
         :option_a, :option_b, :option_c, :option_d, :correct_option, :is_active, :practice_title)'
);
$expectedById = [];
for ($offset = 0; $offset < 55; $offset++) {
    $id = 2000 + $offset;
    $constantText = $offset < 25
        ? "Passage A\n<u>Exact</u>"
        : ($offset < 50 ? "Passage B \nSecond line" : null);
    $values = [
        ':id' => $id,
        ':subject_id' => $subjectId,
        ':category_id' => $categoryId,
        ':exam_year' => $examYear,
        ':question_text' => 'EL01 question ' . $id,
        ':constant_text' => $constantText,
        ':option_a' => 'A' . $id,
        ':option_b' => 'B' . $id,
        ':option_c' => 'C' . $id,
        ':option_d' => 'D' . $id,
        ':correct_option' => $offset % 4,
        ':is_active' => 1,
        ':practice_title' => '',
    ];
    $insert->execute($values);
    $expectedById[$id] = [
        'id' => $id,
        'question' => $values[':question_text'],
        'constant' => $constantText ?? '',
        'image' => '',
        'options' => [
            $values[':option_a'],
            $values[':option_b'],
            $values[':option_c'],
            $values[':option_d'],
        ],
        'answer' => $values[':correct_option'],
    ];
}

foreach ([
    [3001, $categoryId, $examYear, 0],
    [3002, $categoryId, $examYear + 1, 1],
    [3003, 4, $examYear, 1],
] as [$id, $controlCategory, $controlYear, $active]) {
    $insert->execute([
        ':id' => $id,
        ':subject_id' => $subjectId,
        ':category_id' => $controlCategory,
        ':exam_year' => $controlYear,
        ':question_text' => 'Filtered control ' . $id,
        ':constant_text' => 'Filtered passage',
        ':option_a' => 'A',
        ':option_b' => 'B',
        ':option_c' => 'C',
        ':option_d' => 'D',
        ':correct_option' => 0,
        ':is_active' => $active,
        ':practice_title' => '',
    ]);
}

$setupHtml = file_get_contents($baseUrl . '/cbt.php');
$setupStatusLine = $http_response_header[0] ?? '';

$postBody = http_build_query([
    'candidate_name' => $candidateName,
    'subject_id' => $subjectId,
    'exam_category_id' => $categoryId,
    'exam_year' => $examYear,
    'start_exam' => '1',
]);
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n"
            . 'Content-Length: ' . strlen($postBody) . "\r\n",
        'content' => $postBody,
        'ignore_errors' => true,
        'timeout' => 10,
    ],
]);
$html = file_get_contents($baseUrl . '/cbt.php', false, $context);
$statusLine = $http_response_header[0] ?? '';
if (!is_string($html) || !str_contains($statusLine, ' 200 ')) {
    fwrite(STDERR, "FAIL: disposable cbt.php POST did not return HTTP 200.\n");
    exit(1);
}
if (!preg_match('/const questions = (.*?);\s*const SUBJECT_ID/s', $html, $match)) {
    fwrite(STDERR, "FAIL: cbt.php did not embed the selected question array.\n");
    exit(1);
}
$questions = json_decode($match[1], true, 512, JSON_THROW_ON_ERROR);

$passed = 0;
$failed = 0;
$check = static function (bool $condition, string $label) use (&$passed, &$failed): void {
    if ($condition) {
        $passed++;
        echo "[PASS] {$label}\n";
        return;
    }
    $failed++;
    echo "[FAIL] {$label}\n";
};

$check(
    is_string($setupHtml)
        && str_contains($setupStatusLine, ' 200 ')
        && str_contains($setupHtml, 'English (Comprehension Pages / Lexis &amp; Structure)'),
    'actual CBT setup form uses the English Lexis display label'
);

$ids = array_map(static fn(array $question): int => (int) $question['id'], $questions);
$check(
    count($questions) === 50 && count(array_unique($ids)) === 50,
    'actual cbt.php applies the existing default limit of 50'
);
$check(
    count(array_diff($ids, array_keys($expectedById))) === 0
        && !in_array(3001, $ids, true)
        && !in_array(3002, $ids, true)
        && !in_array(3003, $ids, true),
    'actual selection keeps the active subject/category/year filters'
);

$payloadUnchanged = true;
foreach ($questions as $question) {
    $payloadUnchanged = $payloadUnchanged
        && isset($expectedById[(int) $question['id']])
        && $question === $expectedById[(int) $question['id']];
}
$check($payloadUnchanged, 'ordering does not mutate any selected question field');

$positions = [];
foreach ($questions as $position => $question) {
    if ($question['constant'] !== '') {
        $positions['text:' . $question['constant']][] = $position;
    }
}
$contiguous = count($positions) === 2;
foreach ($positions as $groupPositions) {
    $contiguous = $contiguous
        && max($groupPositions) - min($groupPositions) + 1 === count($groupPositions);
}
$check($contiguous, 'actual embedded array keeps every selected repeated passage contiguous');

$attempt = $pdo->query(
    "SELECT candidate_phone, candidate_email, subject_id, exam_category_id
     FROM cbt_exam_attempts
     WHERE candidate_name = 'EL01 staging candidate'"
)->fetchAll();
$check(
    $attempt === [[
        'candidate_phone' => '',
        'candidate_email' => '',
        'subject_id' => $subjectId,
        'exam_category_id' => $categoryId,
    ]],
    'actual start path inserts exactly one attempt with the current candidate fields'
);
$check(
    str_contains($html, 'Subject: English (Comprehension Pages / Lexis &amp; Structure)')
        && str_contains($html, 'src/owner-tool/render.js?v=2.3.3')
        && str_contains($html, 'renderQuestionText(questionArea.querySelector(\'.constant-text\'), q.constant)')
        && preg_match('/\.constant-text\s*\{[^}]*font-weight:\s*800\s*;/s', $html) === 1
        && preg_match('/\.question-text\s*\{[^}]*font-weight:\s*700\s*;/s', $html) === 1,
    'actual page keeps aliased subject output and the bold Constant Text hierarchy'
);

echo "\nPASS: {$passed}\nFAIL: {$failed}\n";
exit($failed === 0 ? 0 : 1);
