<?php
declare(strict_types=1);

// OT05 helper tests. These run the real deployed/context_lib.php against an
// in-memory SQLite database with a production-shaped subset of the tables.
// They do not replace the OT10 MySQL migration run or a browser check of the
// admin PRG flow.

require_once dirname(__DIR__) . '/deployed/context_lib.php';

$passed = 0;
$failed = 0;

function test(string $name, callable $fn): void
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

function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function same($actual, $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException(
            $message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
}

function contains(string $haystack, string $needle, string $message): void
{
    if (strpos($haystack, $needle) === false) {
        throw new RuntimeException($message . ': missing ' . var_export($needle, true));
    }
}

function newDb(): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec(
        'CREATE TABLE subjects (id INTEGER PRIMARY KEY, subject_name TEXT, is_active INTEGER)
         ;CREATE TABLE exam_category (id INTEGER PRIMARY KEY, category_name TEXT, is_active INTEGER)
         ;CREATE TABLE question_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, context_type TEXT, title TEXT, context_text TEXT,
            subject_id INTEGER, exam_category_id INTEGER, exam_year INTEGER,
            expected_member_count INTEGER, is_active INTEGER DEFAULT 0,
            created_at TEXT, updated_at TEXT, activated_at TEXT, idempotency_token TEXT
         )
         ;CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER, exam_category_id INTEGER,
            exam_year INTEGER, question_text TEXT, option_a TEXT, option_b TEXT, option_c TEXT,
            option_d TEXT, correct_option INTEGER, context_id INTEGER, context_position INTEGER,
            context_slot INTEGER, is_active INTEGER
         )'
    );
    $pdo->exec("INSERT INTO subjects (id, subject_name, is_active) VALUES (1, 'English', 1), (2, 'Maths', 1)");
    $pdo->exec("INSERT INTO exam_category (id, category_name, is_active) VALUES (1, 'UTME', 1), (2, 'Practice', 1)");
    return $pdo;
}

function contextValues(array $overrides = []): array
{
    return array_merge([
        'context_type' => CBT_CONTEXT_TYPE_COMPREHENSION,
        'title' => 'Reading passage',
        'context_text' => "First paragraph.\n\nSecond paragraph.",
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
        'expected_member_count' => 2,
    ], $overrides);
}

function insertContext(PDO $pdo, array $overrides = []): int
{
    $values = contextValues($overrides);
    $stmt = $pdo->prepare(
        'INSERT INTO question_contexts
            (context_type, title, context_text, subject_id, exam_category_id, exam_year, expected_member_count, is_active)
         VALUES
            (:context_type, :title, :context_text, :subject_id, :exam_category_id, :exam_year, :expected_member_count, 0)'
    );
    $stmt->execute([
        ':context_type' => $values['context_type'],
        ':title' => $values['title'],
        ':context_text' => $values['context_text'],
        ':subject_id' => $values['subject_id'],
        ':exam_category_id' => $values['exam_category_id'],
        ':exam_year' => $values['exam_year'],
        ':expected_member_count' => $values['expected_member_count'],
    ]);
    return (int) $pdo->lastInsertId();
}

function insertMember(PDO $pdo, int $contextId, int $position, array $overrides = []): int
{
    $values = array_merge([
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
        'question_text' => 'What is the answer?',
        'option_a' => 'A',
        'option_b' => 'B',
        'option_c' => 'C',
        'option_d' => 'D',
        'correct_option' => 0,
        'context_slot' => null,
        'is_active' => 0,
    ], $overrides);
    $stmt = $pdo->prepare(
        'INSERT INTO questions
            (subject_id, exam_category_id, exam_year, question_text, option_a, option_b, option_c, option_d,
             correct_option, context_id, context_position, context_slot, is_active)
         VALUES
            (:subject_id, :exam_category_id, :exam_year, :question_text, :option_a, :option_b, :option_c, :option_d,
             :correct_option, :context_id, :context_position, :context_slot, :is_active)'
    );
    $stmt->execute([
        ':subject_id' => $values['subject_id'],
        ':exam_category_id' => $values['exam_category_id'],
        ':exam_year' => $values['exam_year'],
        ':question_text' => $values['question_text'],
        ':option_a' => $values['option_a'],
        ':option_b' => $values['option_b'],
        ':option_c' => $values['option_c'],
        ':option_d' => $values['option_d'],
        ':correct_option' => $values['correct_option'],
        ':context_id' => $contextId,
        ':context_position' => $position,
        ':context_slot' => $values['context_slot'],
        ':is_active' => $values['is_active'],
    ]);
    return (int) $pdo->lastInsertId();
}

function questionValues(array $overrides = []): array
{
    return array_merge([
        'id' => 0,
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
    ], $overrides);
}

test('cloze tokens are exact, distinct, numeric, and sorted', function () {
    same(cbt_context_slot_tokens('[[gap:72]] x [[gap:71]] [[gap:72]] [[gap:abc]] [[gap:1000]]'), [71, 72], 'tokens');
});

test('context input normalizes CRLF, trims, and reports invalid integers', function () {
    $values = cbt_context_normalize_input([
        'context_type' => ' comprehension ',
        'title' => '  Passage  ',
        'context_text' => "Line one\r\n\r\nLine two\r",
        'subject_id' => '1',
        'exam_category_id' => 'x',
        'exam_year' => '2024',
        'expected_member_count' => '2',
    ]);
    same($values['context_type'], 'comprehension', 'type trimmed');
    same($values['title'], 'Passage', 'title trimmed');
    same($values['context_text'], "Line one\n\nLine two\n", 'newlines normalized without trimming');
    same($values['subject_id'], 1, 'subject id');
    same($values['exam_category_id'], 0, 'invalid category becomes 0');
    same($values['exam_year'], 2024, 'year');
    same($values['expected_member_count'], 2, 'count');
});

test('context input rejects non-scalar values without conversion warnings', function () {
    set_error_handler(static function (int $severity, string $message): never {
        throw new ErrorException($message, 0, $severity);
    });
    try {
        $values = cbt_context_normalize_input([
            'context_type' => ['comprehension'],
            'title' => ['Passage'],
            'context_text' => ['Text'],
            'subject_id' => ['1'],
            'exam_category_id' => '1',
            'exam_year' => '2024',
            'expected_member_count' => '1',
        ]);
    } finally {
        restore_error_handler();
    }

    check(count($values['_input_errors'] ?? []) === 4, 'every malformed field should be recorded');
    $errors = cbt_context_input_errors(newDb(), $values);
    contains(implode(' ', $errors), 'invalid submitted value', 'shape validation error');
    check(!in_array('Array', $values, true), 'array input must never become the string Array');
});

test('valid comprehension and cloze contexts pass input validation', function () {
    $pdo = newDb();
    same(cbt_context_input_errors($pdo, contextValues()), [], 'comprehension');
    same(cbt_context_input_errors($pdo, contextValues([
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'One [[gap:71]] two [[gap:72]]',
    ])), [], 'cloze');
});

test('input validation rejects type, token, pool, and limit mismatches', function () {
    $pdo = newDb();
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['context_type' => 'unknown']))), 'valid context type', 'type');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['context_text' => 'x [[gap:71]]']))), 'must not contain cloze gap tokens', 'comprehension tokens');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues([
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:71]] two [[gap:72]]',
        'expected_member_count' => 3,
    ]))), 'equal the number of distinct', 'cloze token count');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues([
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:0]]',
        'expected_member_count' => 1,
    ]))), 'numbers from 1 to 999', 'zero token');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['context_text' => "  \n  "]))), 'Please enter the shared context text', 'whitespace-only text');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['expected_member_count' => 0]))), 'between 1 and', 'count range');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['exam_year' => 1800]))), 'between 1900 and 2100', 'year range');
    contains(implode(' ', cbt_context_input_errors($pdo, contextValues(['subject_id' => 99]))), 'inactive or does not exist', 'subject pool');
});

test('context pool and type cannot change while members exist', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo);
    insertMember($pdo, $contextId, 1);
    $existing = cbt_context_fetch($pdo, $contextId);
    $errors = cbt_context_input_errors($pdo, contextValues(['subject_id' => 2]), $contextId, $existing);
    contains(implode(' ', $errors), 'pool cannot change', 'pool change');
    $errors = cbt_context_input_errors($pdo, contextValues(['context_type' => CBT_CONTEXT_TYPE_CLOZE]), $contextId, $existing);
    contains(implode(' ', $errors), 'type cannot change', 'type change');
});

test('link validation rejects wrong pools, duplicate positions, and invalid slots', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo);
    $context = cbt_context_fetch($pdo, $contextId);
    contains(implode(' ', cbt_context_question_link_errors($pdo, questionValues(['subject_id' => 2]), $context, 1, null)), 'does not match', 'wrong pool');
    same(cbt_context_question_link_errors($pdo, questionValues(), $context, 1, null), [], 'valid link');

    insertMember($pdo, $contextId, 1);
    contains(implode(' ', cbt_context_question_link_errors($pdo, questionValues(), $context, 1, null)), 'already uses that context position', 'duplicate position');

    $clozeId = insertContext($pdo, [
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:71]] two [[gap:72]]',
    ]);
    $cloze = cbt_context_fetch($pdo, $clozeId);
    contains(implode(' ', cbt_context_question_link_errors($pdo, questionValues(), $cloze, 1, 99)), 'not present in the context text', 'invalid slot token');
    contains(implode(' ', cbt_context_question_link_errors($pdo, questionValues(), $cloze, 1, null)), 'Enter a cloze slot', 'missing slot');
    same(cbt_context_question_link_errors($pdo, questionValues(), $cloze, 1, 71), [], 'valid cloze slot');
});

test('link validation rejects a context that already has its expected members', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo, ['expected_member_count' => 1]);
    insertMember($pdo, $contextId, 1);
    $context = cbt_context_fetch($pdo, $contextId);
    contains(implode(' ', cbt_context_question_link_errors($pdo, questionValues(), $context, 2, null)), 'expected number of members', 'full context');
});

test('incomplete and invalid contexts cannot activate', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo);
    $incomplete = cbt_context_validate_activation($pdo, $contextId);
    check(!$incomplete['ok'], 'empty context must not activate');
    contains(implode(' ', $incomplete['errors']), 'no linked questions', 'empty context error');

    insertMember($pdo, $contextId, 1);
    $oneOfTwo = cbt_context_validate_activation($pdo, $contextId);
    check(!$oneOfTwo['ok'], 'one of two must not activate');
    contains(implode(' ', $oneOfTwo['errors']), 'expects 2', 'count error');

    $pdo2 = newDb();
    $contextId = insertContext($pdo2);
    insertMember($pdo2, $contextId, 1, ['option_b' => '']);
    insertMember($pdo2, $contextId, 2);
    $missingOption = cbt_context_validate_activation($pdo2, $contextId);
    check(!$missingOption['ok'], 'missing option must not activate');
    contains(implode(' ', $missingOption['errors']), 'four options', 'option error');

    $pdo3 = newDb();
    $contextId = insertContext($pdo3);
    insertMember($pdo3, $contextId, 1, ['is_active' => 1]);
    insertMember($pdo3, $contextId, 2);
    $activeMember = cbt_context_validate_activation($pdo3, $contextId);
    check(!$activeMember['ok'], 'active member must not activate');
    contains(implode(' ', $activeMember['errors']), 'must stay inactive', 'active member error');

    $pdo4 = newDb();
    $contextId = insertContext($pdo4);
    insertMember($pdo4, $contextId, 1);
    insertMember($pdo4, $contextId, 3);
    $gap = cbt_context_validate_activation($pdo4, $contextId);
    check(!$gap['ok'], 'position gap must not activate');
    contains(implode(' ', $gap['errors']), 'run from 1 to 2', 'position error');
});

test('a complete comprehension context validates with inactive members', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo);
    insertMember($pdo, $contextId, 1);
    insertMember($pdo, $contextId, 2);
    $result = cbt_context_validate_activation($pdo, $contextId);
    check($result['ok'], 'complete context should validate: ' . implode(' ', $result['errors']));
    same($result['member_count'], 2, 'member count');
});

test('cloze slot validation requires exact matching tokens', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo, [
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:71]] two [[gap:72]]',
    ]);
    insertMember($pdo, $contextId, 1, ['context_slot' => 71]);
    insertMember($pdo, $contextId, 2, ['context_slot' => 72]);
    $result = cbt_context_validate_activation($pdo, $contextId);
    check($result['ok'], 'matching slots should validate: ' . implode(' ', $result['errors']));

    $pdo2 = newDb();
    $contextId = insertContext($pdo2, [
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:71]] two [[gap:72]]',
    ]);
    insertMember($pdo2, $contextId, 1, ['context_slot' => 71]);
    insertMember($pdo2, $contextId, 2, ['context_slot' => 73]);
    $mismatch = cbt_context_validate_activation($pdo2, $contextId);
    check(!$mismatch['ok'], 'mismatched slots must not validate');
    contains(implode(' ', $mismatch['errors']), 'must match the [[gap:N]] tokens', 'slot mismatch');

    $pdo3 = newDb();
    $contextId = insertContext($pdo3, [
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'one [[gap:0]]',
        'expected_member_count' => 1,
    ]);
    insertMember($pdo3, $contextId, 1, ['context_slot' => 1]);
    $zeroToken = cbt_context_validate_activation($pdo3, $contextId);
    check(!$zeroToken['ok'], 'zero token must not validate');
    contains(implode(' ', $zeroToken['errors']), 'numbers from 1 to 999', 'zero token error');
});

test('list, fetch, and member count return the expected context facts', function () {
    $pdo = newDb();
    $contextId = insertContext($pdo);
    insertMember($pdo, $contextId, 1);
    $list = cbt_context_list($pdo);
    same(count($list), 1, 'one context');
    same((int) $list[0]['id'], $contextId, 'context id');
    same((int) $list[0]['member_count'], 1, 'member count');
    same((int) cbt_context_member_count($pdo, $contextId), 1, 'member count helper');
    same(cbt_context_fetch($pdo, 999), null, 'missing context');
});

test('status labels distinguish active, incomplete, ready, and review states', function () {
    same(cbt_context_status_label(['is_active' => 1, 'expected_member_count' => 2], 2, true), 'Active', 'active');
    same(cbt_context_status_label(['is_active' => 0, 'expected_member_count' => 2], 1, false), 'Incomplete (1 of 2)', 'incomplete');
    same(cbt_context_status_label(['is_active' => 0, 'expected_member_count' => 2], 2, true), 'Ready to activate', 'ready');
    same(cbt_context_status_label(['is_active' => 0, 'expected_member_count' => 2], 2, false), 'Needs review (2 of 2)', 'review');
});

echo PHP_EOL . 'Summary' . PHP_EOL;
echo '  PASS: ' . $passed . PHP_EOL;
echo '  FAIL: ' . $failed . PHP_EOL;
exit($failed === 0 ? 0 : 1);
