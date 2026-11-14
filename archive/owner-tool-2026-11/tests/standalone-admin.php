<?php
declare(strict_types=1);

// OT12: the standalone question page must work without the context columns and
// must refuse rows that belong to a shared text.

// The owner approved inlining the save path, so the page itself defines these
// functions. Include it without a login, a database, or rendered output.
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['SCRIPT_NAME'] = '/admin_questions.php';
$_SESSION = [];
ob_start();
require dirname(__DIR__) . '/deployed/admin_questions.php';
ob_end_clean();

$passed = 0;
$failed = 0;

function standalone_test(string $name, callable $fn): void
{
    global $passed, $failed;
    try {
        $fn();
        $passed++;
        echo '[PASS] ' . $name . PHP_EOL;
    } catch (Throwable $error) {
        $failed++;
        echo '[FAIL] ' . $name . ' - ' . $error->getMessage() . PHP_EOL;
    }
}

function standalone_check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function standalone_same(mixed $actual, mixed $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException(
            $message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
}

function standalone_db(bool $withContext): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $contextColumns = $withContext
        ? ', context_id INTEGER, context_position INTEGER, context_slot INTEGER'
        : '';
    $pdo->exec(
        'CREATE TABLE subjects (id INTEGER PRIMARY KEY, subject_name TEXT, is_active INTEGER);
         CREATE TABLE exam_category (id INTEGER PRIMARY KEY, category_name TEXT, is_active INTEGER);
         CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER, exam_category_id INTEGER,
            exam_year INTEGER, question_text TEXT, option_a TEXT, option_b TEXT, option_c TEXT,
            option_d TEXT, correct_option INTEGER, answer_explanation TEXT,
            answer_video_path TEXT, question_image_path TEXT, is_active INTEGER' . $contextColumns . ');'
    );
    $pdo->exec("INSERT INTO subjects (id, subject_name, is_active) VALUES (1, 'English', 1)");
    $pdo->exec("INSERT INTO exam_category (id, category_name, is_active) VALUES (1, 'UTME', 1)");
    return $pdo;
}

function standalone_values(array $overrides = []): array
{
    return array_merge([
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
        'question_text' => "2<x<5 and <u>underlined</u>\nsecond line",
        'option_a' => 'A',
        'option_b' => 'B',
        'option_c' => 'C',
        'option_d' => 'D',
        'correct_option' => 2,
        'answer_explanation' => null,
        'answer_video_path' => null,
        'question_image_path' => null,
        'is_active' => 1,
    ], $overrides);
}

standalone_test('a database without the context columns is detected', function (): void {
    $pdo = standalone_db(false);
    standalone_same(cbt_standalone_has_context_column($pdo), false, 'missing column detected as absent');
    standalone_same(cbt_standalone_question_is_grouped($pdo, 1), false, 'no row is grouped');
});

standalone_test('a plain insert saves markers, unicode text, and the active flag', function (): void {
    $pdo = standalone_db(false);
    $result = cbt_standalone_save_question($pdo, 'save_question', 0, standalone_values([
        'question_text' => "2<x<5 and <u>underlined</u> and x²\nsecond line",
    ]));
    standalone_check($result['question_id'] > 0, 'insert returned an id');
    $row = $pdo->query('SELECT * FROM questions')->fetch(PDO::FETCH_ASSOC);
    standalone_same($row['question_text'], "2<x<5 and <u>underlined</u> and x²\nsecond line", 'text stored verbatim');
    standalone_same((int) $row['is_active'], 1, 'active flag stored');
    standalone_same((int) $row['correct_option'], 2, 'answer stored');
});

standalone_test('a plain update changes only the standalone columns', function (): void {
    $pdo = standalone_db(false);
    $id = cbt_standalone_save_question($pdo, 'save_question', 0, standalone_values())['question_id'];
    cbt_standalone_save_question($pdo, 'update_question', $id, standalone_values([
        'question_text' => 'edited', 'is_active' => 0,
    ]));
    $row = $pdo->query('SELECT * FROM questions')->fetch(PDO::FETCH_ASSOC);
    standalone_same($row['question_text'], 'edited', 'update wrote the new text');
    standalone_same((int) $row['is_active'], 0, 'update cleared the active flag');
});

standalone_test('delete returns media paths and removes the row', function (): void {
    $pdo = standalone_db(false);
    $id = cbt_standalone_save_question($pdo, 'save_question', 0, standalone_values([
        'answer_video_path' => 'uploads/question-videos/' . str_repeat('a', 32) . '.mp4',
        'question_image_path' => 'uploads/question-images/' . str_repeat('b', 32) . '.png',
    ]))['question_id'];
    $result = cbt_standalone_delete_question($pdo, $id);
    standalone_same($result['deleted_rows'], 1, 'one row deleted');
    standalone_check(is_string($result['answer_video_path']), 'video path returned');
    standalone_check(is_string($result['question_image_path']), 'image path returned');
    standalone_same((int) $pdo->query('SELECT COUNT(*) FROM questions')->fetchColumn(), 0, 'table is empty');
});

standalone_test('a migrated database reports grouped rows and refuses to save them', function (): void {
    $pdo = standalone_db(true);
    $pdo->exec("INSERT INTO questions (subject_id, exam_category_id, exam_year, question_text,
        option_a, option_b, option_c, option_d, correct_option, is_active, context_id, context_position)
        VALUES (1, 1, 2024, 'grouped stem', 'A', 'B', 'C', 'D', 0, 0, 7, 1)");
    standalone_same(cbt_standalone_has_context_column($pdo), true, 'column detected');
    standalone_same(cbt_standalone_question_is_grouped($pdo, 1), true, 'grouped row detected');

    try {
        cbt_standalone_save_question($pdo, 'update_question', 1, standalone_values());
        throw new RuntimeException('grouped update was not refused');
    } catch (RuntimeException $error) {
        standalone_check(
            str_contains($error->getMessage(), 'belongs to a shared text'),
            'refusal names the shared text: ' . $error->getMessage()
        );
    }
    standalone_same((int) $pdo->query('SELECT COUNT(*) FROM questions')->fetchColumn(), 1, 'row still present');
    standalone_same(
        $pdo->query('SELECT question_text FROM questions')->fetchColumn(),
        'grouped stem',
        'grouped row unchanged'
    );
});

standalone_test('a migrated database still saves and deletes standalone rows', function (): void {
    $pdo = standalone_db(true);
    $id = cbt_standalone_save_question($pdo, 'save_question', 0, standalone_values())['question_id'];
    standalone_same(cbt_standalone_question_is_grouped($pdo, $id), false, 'new standalone row is not grouped');
    $result = cbt_standalone_delete_question($pdo, $id);
    standalone_same($result['deleted_rows'], 1, 'standalone row deleted');
});

standalone_test('delete refuses a grouped row', function (): void {
    $pdo = standalone_db(true);
    $pdo->exec("INSERT INTO questions (subject_id, exam_category_id, exam_year, question_text,
        option_a, option_b, option_c, option_d, correct_option, is_active, context_id, context_position)
        VALUES (1, 1, 2024, 'grouped stem', 'A', 'B', 'C', 'D', 0, 0, 9, 2)");
    try {
        cbt_standalone_delete_question($pdo, 1);
        throw new RuntimeException('grouped delete was not refused');
    } catch (RuntimeException $error) {
        standalone_check(str_contains($error->getMessage(), 'belongs to a shared text'), 'refusal names the shared text');
    }
    standalone_same((int) $pdo->query('SELECT COUNT(*) FROM questions')->fetchColumn(), 1, 'row still present');
});

standalone_test('the standalone page no longer includes the context library', function (): void {
    $source = file_get_contents(dirname(__DIR__) . '/deployed/admin_questions.php');
    standalone_check(!str_contains($source, 'admin_context.php'), 'no admin_context include');
    standalone_check(!str_contains($source, 'admin_question_save.php'), 'no separate save module');
    standalone_check(!str_contains($source, 'cbt_admin_mutate_question'), 'no context mutation call');
    standalone_check(!str_contains($source, 'cbt_admin_render_context_management'), 'no context management markup');
});

standalone_test('the shared page uses the context library and the context mutators', function (): void {
    $source = file_get_contents(dirname(__DIR__) . '/deployed/admin_shared.php');
    standalone_check(str_contains($source, 'admin_context.php'), 'context library included');
    standalone_check(str_contains($source, 'cbt_admin_mutate_question'), 'member saves use the context mutator');
    standalone_check(str_contains($source, 'admin_questions.php'), 'navigation link present');
});

echo PHP_EOL . 'PASS: ' . $passed . PHP_EOL . 'FAIL: ' . $failed . PHP_EOL;
exit($failed === 0 ? 0 : 1);
