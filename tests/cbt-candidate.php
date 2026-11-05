<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/deployed/cbt_candidate_selection.php';
require_once dirname(__DIR__) . '/deployed/cbt_candidate_repository.php';

$passed = 0;
$failed = 0;

function ot06_test(string $name, callable $test): void
{
    global $passed, $failed;
    try {
        $test();
        $passed++;
        echo '[PASS] ' . $name . PHP_EOL;
    } catch (Throwable $error) {
        $failed++;
        echo '[FAIL] ' . $name . ' - ' . $error->getMessage() . PHP_EOL;
    }
}

function ot06_check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function ot06_same($actual, $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException(
            $message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
}

function ot06_db(): PDO
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
            expected_member_count INTEGER, is_active INTEGER DEFAULT 0
         )
         ;CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER, exam_category_id INTEGER,
            exam_year INTEGER, question_text TEXT, question_image_path TEXT,
            option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT,
            correct_option INTEGER, context_id INTEGER, context_position INTEGER,
            context_slot INTEGER, is_active INTEGER
         )'
    );
    $pdo->exec("INSERT INTO subjects VALUES (1, 'English', 1), (2, 'Mathematics', 1)");
    $pdo->exec(
        "INSERT INTO exam_category VALUES
         (1, 'UTME', 1), (2, 'WASSCE', 1), (3, 'Inactive', 0), (11, 'Hidden', 1)"
    );
    return $pdo;
}

function ot06_question(PDO $pdo, array $overrides = []): int
{
    $row = array_merge([
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
        'question_text' => 'Standalone question',
        'question_image_path' => null,
        'option_a' => 'A',
        'option_b' => 'B',
        'option_c' => 'C',
        'option_d' => 'D',
        'correct_option' => 0,
        'context_id' => null,
        'context_position' => null,
        'context_slot' => null,
        'is_active' => 1,
    ], $overrides);
    $stmt = $pdo->prepare(
        'INSERT INTO questions
            (subject_id, exam_category_id, exam_year, question_text, question_image_path,
             option_a, option_b, option_c, option_d, correct_option,
             context_id, context_position, context_slot, is_active)
         VALUES
            (:subject_id, :exam_category_id, :exam_year, :question_text, :question_image_path,
             :option_a, :option_b, :option_c, :option_d, :correct_option,
             :context_id, :context_position, :context_slot, :is_active)'
    );
    $stmt->execute($row);
    return (int) $pdo->lastInsertId();
}

function ot06_context(PDO $pdo, array $overrides = []): int
{
    $row = array_merge([
        'context_type' => 'comprehension',
        'title' => 'Reading passage',
        'context_text' => "First paragraph.\n\nSecond paragraph.",
        'subject_id' => 1,
        'exam_category_id' => 2,
        'exam_year' => 2025,
        'expected_member_count' => 2,
        'is_active' => 1,
    ], $overrides);
    $stmt = $pdo->prepare(
        'INSERT INTO question_contexts
            (context_type, title, context_text, subject_id, exam_category_id,
             exam_year, expected_member_count, is_active)
         VALUES
            (:context_type, :title, :context_text, :subject_id, :exam_category_id,
             :exam_year, :expected_member_count, :is_active)'
    );
    $stmt->execute($row);
    return (int) $pdo->lastInsertId();
}

function ot06_member(PDO $pdo, int $contextId, int $position, array $overrides = []): int
{
    return ot06_question($pdo, array_merge([
        'exam_category_id' => 2,
        'exam_year' => 2025,
        'question_text' => 'Context question ' . $position,
        'context_id' => $contextId,
        'context_position' => $position,
        'is_active' => 0,
    ], $overrides));
}

function ot06_complete_context(PDO $pdo, array $contextOverrides = []): array
{
    $contextId = ot06_context($pdo, $contextOverrides);
    $type = $contextOverrides['context_type'] ?? 'comprehension';
    $first = ot06_member($pdo, $contextId, 1, [
        'context_slot' => $type === 'cloze' ? 71 : null,
    ]);
    $second = ot06_member($pdo, $contextId, 2, [
        'context_slot' => $type === 'cloze' ? 72 : null,
    ]);
    return [$contextId, $first, $second];
}

function ot06_unit_fixture(): array
{
    return [
        'standalone' => [['id' => 1], ['id' => 2]],
        'contexts' => [[
            'id' => 10,
            'expected_member_count' => 2,
            'members' => [
                ['id' => 101, 'context_position' => 1, 'is_active' => 0],
                ['id' => 102, 'context_position' => 2, 'is_active' => 0],
            ],
        ]],
    ];
}

ot06_test('seeded unit ordering is deterministic and varies across seeds', function (): void {
    $units = cbt_candidate_build_units(ot06_unit_fixture());
    $first = cbt_candidate_fit_units($units, 4, 'same-seed');
    $second = cbt_candidate_fit_units($units, 4, 'same-seed');
    ot06_same($second, $first, 'same seed order');

    $orders = [];
    $firstKinds = [];
    for ($i = 1; $i <= 80; $i++) {
        $ordered = cbt_candidate_fit_units($units, 4, 'seed-' . $i);
        $orders[implode(',', array_column($ordered, 'key'))] = true;
        $firstKinds[substr($ordered[0]['key'], 0, 1)] = true;
    }
    ot06_check(count($orders) > 1, 'different seeds should vary unit order');
    ot06_check(isset($firstKinds['q'], $firstKinds['c']), 'standalone and context units should both lead seeded runs');
});

ot06_test('whole-unit fitting skips oversize groups and permits a lower total', function (): void {
    $units = [
        ['key' => 'c:9', 'context_id' => 9, 'question_ids' => [91, 92, 93]],
        ['key' => 'q:1', 'context_id' => null, 'question_ids' => [1]],
        ['key' => 'c:8', 'context_id' => 8, 'question_ids' => [81, 82]],
    ];
    $selected = cbt_candidate_fit_units($units, 2, 'fit-seed');
    $ids = array_merge(...array_column($selected, 'question_ids'));
    ot06_check(!in_array(91, $ids, true), 'oversize group must be skipped');
    ot06_check(count($ids) <= 2, 'limit must not be exceeded');
    foreach ($selected as $unit) {
        ot06_check($unit['question_ids'] !== [91, 92] && $unit['question_ids'] !== [92, 93], 'group must not be partial');
    }
});

ot06_test('availability includes complete active contexts and excludes incomplete ones', function (): void {
    $pdo = ot06_db();
    ot06_question($pdo);
    ot06_complete_context($pdo);
    $incomplete = ot06_context($pdo, [
        'exam_category_id' => 1,
        'exam_year' => 2026,
        'expected_member_count' => 2,
    ]);
    ot06_member($pdo, $incomplete, 1, ['exam_category_id' => 1, 'exam_year' => 2026]);

    $categories = cbt_candidate_categories($pdo, 1);
    ot06_same(array_map('intval', array_column($categories, 'id')), [1, 2], 'available categories');
    ot06_same(cbt_candidate_years($pdo, 1, 2), [2025], 'context-only year');
    ot06_same(cbt_candidate_years($pdo, 1, null), [2025, 2024], 'incomplete year excluded');
    ot06_check(cbt_candidate_pool_has_unit($pdo, 1, 2, 2025), 'context-only pool should be valid');
    ot06_check(!cbt_candidate_pool_has_unit($pdo, 1, 1, 2026), 'incomplete active context must not validate a pool');
});

ot06_test('delivery keeps context members consecutive and emits context text once', function (): void {
    $pdo = ot06_db();
    $standalone = ot06_question($pdo, ['question_text' => 'Independent']);
    [$contextId, $first, $second] = ot06_complete_context($pdo);
    $delivery = cbt_candidate_delivery($pdo, 1, 2, 2025, 10, 'delivery-seed');

    $ids = array_map('intval', array_column($delivery['questions'], 'id'));
    $firstAt = array_search($first, $ids, true);
    $secondAt = array_search($second, $ids, true);
    ot06_check($firstAt !== false && $secondAt === $firstAt + 1, 'members must be consecutive in saved order');
    ot06_check(isset($delivery['contexts'][$contextId]), 'selected context should be in the context map');
    ot06_same(count($delivery['contexts']), 1, 'one context map entry');
    foreach ($delivery['questions'] as $question) {
        ot06_check(!array_key_exists('context_text', $question), 'question payload row must not repeat context text');
        ot06_check(!array_key_exists('context_title', $question), 'question payload row must not repeat context title');
    }
    ot06_check(!in_array($standalone, $ids, true), 'different category standalone is excluded');
});

ot06_test('mixed standalone and context units vary while internal order stays fixed', function (): void {
    $pdo = ot06_db();
    $standalone = ot06_question($pdo, ['exam_category_id' => 2, 'exam_year' => 2025]);
    [, $first, $second] = ot06_complete_context($pdo);
    $orders = [];
    for ($i = 1; $i <= 30; $i++) {
        $delivery = cbt_candidate_delivery($pdo, 1, 2, 2025, 3, 'mixed-' . $i);
        $ids = array_map('intval', array_column($delivery['questions'], 'id'));
        $orders[implode(',', $ids)] = true;
        $firstAt = array_search($first, $ids, true);
        ot06_check($firstAt !== false && ($ids[$firstAt + 1] ?? null) === $second, 'context order changed');
        ot06_check(in_array($standalone, $ids, true), 'standalone missing from mixed delivery');
    }
    ot06_check(count($orders) > 1, 'seeded mixed delivery should vary unit order');
});

ot06_test('full-row revalidation drops a context changed after eligibility', function (): void {
    $pdo = ot06_db();
    $standalone = ot06_question($pdo, ['exam_category_id' => 2, 'exam_year' => 2025]);
    [$contextId, $first, $second] = ot06_complete_context($pdo);
    $eligibility = cbt_candidate_eligibility($pdo, 1, 2, 2025);
    $units = cbt_candidate_fit_units(cbt_candidate_build_units($eligibility), 3, 'race-seed');

    $pdo->exec('UPDATE question_contexts SET is_active = 0 WHERE id = ' . $contextId);
    $rows = cbt_candidate_hydrate($pdo, $units);
    $delivery = cbt_candidate_reconcile($units, $rows, 1, 2, 2025);
    $ids = array_map('intval', array_column($delivery['questions'], 'id'));

    ot06_same($ids, [$standalone], 'only unchanged standalone survives');
    ot06_check(!in_array($first, $ids, true) && !in_array($second, $ids, true), 'changed context leaked partially');
    ot06_same($delivery['contexts'], [], 'changed context map should be empty');
});

ot06_test('legacy active-row query cannot see linked members', function (): void {
    $pdo = ot06_db();
    $standalone = ot06_question($pdo);
    [, $first, $second] = ot06_complete_context($pdo);
    $legacy = array_map('intval', $pdo->query('SELECT id FROM questions WHERE is_active = 1')->fetchAll(PDO::FETCH_COLUMN));
    ot06_same($legacy, [$standalone], 'legacy query result');
    ot06_check(!in_array($first, $legacy, true) && !in_array($second, $legacy, true), 'linked member reached legacy query');
});

echo PHP_EOL . 'Summary' . PHP_EOL;
echo '  PASS: ' . $passed . PHP_EOL;
echo '  FAIL: ' . $failed . PHP_EOL;
exit($failed > 0 ? 1 : 0);
