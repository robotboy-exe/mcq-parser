<?php
declare(strict_types=1);

require_once __DIR__ . '/../deployed/admin_question_store.php';

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec(
    'CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        exam_category_id INTEGER NOT NULL,
        exam_year INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        constant_text TEXT,
        question_image_path TEXT,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option INTEGER NOT NULL,
        answer_explanation TEXT,
        answer_video_path TEXT,
        is_active INTEGER NOT NULL
    )'
);

$values = [
    'subject_id' => 14,
    'exam_category_id' => 3,
    'exam_year' => 2021,
    'question_text' => 'An elephant herd is usually led by',
    'constant_text' => "The elephant is the largest land animal.\nIt lives in herds.",
    'option_a' => 'the oldest male',
    'option_b' => 'an older female',
    'option_c' => 'the youngest calf',
    'option_d' => 'a lone bull',
    'correct_option' => 1,
    'answer_explanation' => 'The passage says an older female leads the herd.',
    'answer_video_path' => 'uploads/question-videos/abc.mp4',
    'question_image_path' => 'uploads/question-images/def.png',
    'is_active' => 1,
];

$saved = cbt_standalone_save_question($pdo, 'save_question', 0, $values);
if ($saved['question_id'] < 1) {
    throw new RuntimeException('insert did not return a question id');
}

$row = $pdo->query('SELECT * FROM questions WHERE id = ' . (int) $saved['question_id'])->fetch();
if ($row === false) {
    throw new RuntimeException('inserted question was not found');
}
if ($row['constant_text'] !== $values['constant_text']) {
    throw new RuntimeException('insert did not preserve Constant Text');
}
if ($row['question_text'] !== $values['question_text']) {
    throw new RuntimeException('insert changed the question text');
}

$values['constant_text'] = "Updated passage.\nSecond line.";
$values['is_active'] = 0;
$updated = cbt_standalone_save_question($pdo, 'update_question', $saved['question_id'], $values);
if ($updated['question_id'] !== $saved['question_id']) {
    throw new RuntimeException('update changed the question id');
}
$row = $pdo->query('SELECT * FROM questions WHERE id = ' . (int) $saved['question_id'])->fetch();
if ($row['constant_text'] !== $values['constant_text']) {
    throw new RuntimeException('update did not preserve Constant Text');
}
if ((int) $row['is_active'] !== 0) {
    throw new RuntimeException('update did not change is_active');
}

$values['constant_text'] = null;
cbt_standalone_save_question($pdo, 'update_question', $saved['question_id'], $values);
$row = $pdo->query('SELECT * FROM questions WHERE id = ' . (int) $saved['question_id'])->fetch();
if ($row['constant_text'] !== null) {
    throw new RuntimeException('update did not clear Constant Text');
}

$deleted = cbt_standalone_delete_question($pdo, $saved['question_id']);
if ($deleted['deleted_rows'] !== 1) {
    throw new RuntimeException('delete did not remove exactly one row');
}
if ($deleted['answer_video_path'] !== 'uploads/question-videos/abc.mp4') {
    throw new RuntimeException('delete did not return the answer media path');
}
if ($deleted['question_image_path'] !== 'uploads/question-images/def.png') {
    throw new RuntimeException('delete did not return the question image path');
}
if ($pdo->query('SELECT COUNT(*) FROM questions')->fetchColumn() !== 0) {
    throw new RuntimeException('delete left a row behind');
}

$missing = cbt_standalone_delete_question($pdo, 999);
if ($missing['deleted_rows'] !== 0 || $missing['answer_video_path'] !== null) {
    throw new RuntimeException('missing-row delete did not return an empty result');
}

try {
    cbt_standalone_save_question($pdo, 'unknown_action', 0, $values);
    throw new RuntimeException('invalid action was accepted');
} catch (InvalidArgumentException $expected) {
}

echo "PASS: 8 admin-question-store checks\n";
