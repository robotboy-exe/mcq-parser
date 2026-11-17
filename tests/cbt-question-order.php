<?php
declare(strict_types=1);

$modulePath = __DIR__ . '/../deployed/cbt_question_order.php';
if (!is_file($modulePath)) {
    fwrite(STDERR, "[FAIL] production ordering module is missing\n");
    exit(1);
}
require_once $modulePath;

$passed = 0;
$failed = 0;

function el_check(bool $condition, string $label): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$label}\n";
        return;
    }

    $failed++;
    echo "[FAIL] {$label}\n";
}

function el_ids(array $rows): array
{
    return array_map(static fn(array $row): int => (int) $row['id'], $rows);
}

function el_rows_by_id(array $rows): array
{
    $indexed = [];
    foreach ($rows as $row) {
        $indexed[(int) $row['id']] = $row;
    }
    ksort($indexed);
    return $indexed;
}

function el_non_empty_groups_are_contiguous(array $rows): bool
{
    $positions = [];
    foreach ($rows as $index => $row) {
        $constantText = $row['constant_text'] ?? null;
        if (!is_string($constantText) || $constantText === '') {
            continue;
        }
        $positions['text:' . $constantText][] = $index;
    }

    foreach ($positions as $groupPositions) {
        if (max($groupPositions) - min($groupPositions) + 1 !== count($groupPositions)) {
            return false;
        }
    }
    return true;
}

$rows = [
    ['id' => 1, 'constant_text' => 'Passage A', 'question_text' => 'A1', 'extra' => ['x' => 1]],
    ['id' => 2, 'constant_text' => '', 'question_text' => 'Blank'],
    ['id' => 3, 'constant_text' => 'Passage B', 'question_text' => 'B1'],
    ['id' => 4, 'constant_text' => 'Passage A', 'question_text' => 'A2'],
    ['id' => 5, 'constant_text' => null, 'question_text' => 'Null'],
    ['id' => 6, 'constant_text' => 'Passage B', 'question_text' => 'B2'],
];
$groupSizes = [];
$reverseGroups = static function (array $groups) use (&$groupSizes): array {
    $groupSizes = array_map('count', $groups);
    return array_reverse($groups);
};
$ordered = cbt_order_selected_questions(
    $rows,
    'English (Lexis & Structure)',
    $reverseGroups
);
el_check(
    el_ids($ordered) === [5, 3, 6, 2, 1, 4] && $groupSizes === [2, 1, 2, 1],
    'shuffles display groups while preserving order inside repeated passages'
);

$randomInput = [
    ['id' => 9, 'constant_text' => 'Passage A'],
    ['id' => 3, 'constant_text' => 'Passage B'],
    ['id' => 4, 'constant_text' => 'Passage A'],
    ['id' => 7, 'constant_text' => 'Passage B'],
];
$randomOrdered = cbt_order_selected_questions(
    $randomInput,
    'English (Lexis & Structure)',
    static fn(array $groups): array => $groups
);
el_check(
    el_ids($randomOrdered) === [4, 9, 3, 7],
    'restores the original question order inside a group despite random row selection'
);

$nearNames = [
    'English (Lexis & structure)',
    'English (Lexis and Structure)',
    'English (Lexis & Structure) ',
    'English Language',
];
$nearNameCalls = 0;
foreach ($nearNames as $nearName) {
    $result = cbt_order_selected_questions(
        $rows,
        $nearName,
        static function (array $groups) use (&$nearNameCalls): array {
            $nearNameCalls++;
            return array_reverse($groups);
        }
    );
    if ($result !== $rows) {
        $nearNameCalls++;
    }
}
el_check(
    $nearNameCalls === 0,
    'activates only for the exact trusted subject name'
);

$exactRows = [
    ['id' => 10, 'constant_text' => "Same\nText", 'question_text' => 'First'],
    ['id' => 11, 'constant_text' => "same\nText", 'question_text' => 'Case'],
    ['id' => 12, 'constant_text' => "Same\nText ", 'question_text' => 'Space'],
    ['id' => 13, 'constant_text' => "Same Text", 'question_text' => 'Line break'],
    ['id' => 14, 'constant_text' => "Same\nText", 'question_text' => 'Second'],
    ['id' => 15, 'constant_text' => "<u>Same</u>\nText", 'question_text' => 'Underline'],
];
$exactGroupIds = [];
$exactOrdered = cbt_order_selected_questions(
    $exactRows,
    'English (Lexis & Structure)',
    static function (array $groups) use (&$exactGroupIds): array {
        $exactGroupIds = array_map('el_ids', $groups);
        return $groups;
    }
);
el_check(
    $exactGroupIds === [[10, 14], [11], [12], [13], [15]]
        && el_ids($exactOrdered) === [10, 14, 11, 12, 13, 15],
    'keeps case, whitespace, line-break, and underline-marker differences separate'
);

$blankRows = [
    ['id' => 20, 'constant_text' => '', 'question_text' => 'Empty one'],
    ['id' => 21, 'constant_text' => '', 'question_text' => 'Empty two'],
    ['id' => 22, 'constant_text' => null, 'question_text' => 'Null one'],
    ['id' => 23, 'constant_text' => null, 'question_text' => 'Null two'],
];
$blankGroupSizes = [];
cbt_order_selected_questions(
    $blankRows,
    'English (Lexis & Structure)',
    static function (array $groups) use (&$blankGroupSizes): array {
        $blankGroupSizes = array_map('count', $groups);
        return $groups;
    }
);
el_check(
    $blankGroupSizes === [1, 1, 1, 1],
    'keeps every NULL and empty Constant Text row as a singleton group'
);

el_check(
    count($ordered) === count($rows)
        && el_ids($ordered) === [5, 3, 6, 2, 1, 4]
        && el_rows_by_id($ordered) === el_rows_by_id($rows),
    'does not add, drop, duplicate, or mutate selected rows'
);

$scalePass = true;
foreach ([50, 60, 100] as $size) {
    $scaleRows = [];
    for ($i = 1; $i <= $size; $i++) {
        $constantText = ($size === 100 && $i <= 55)
            ? 'Group larger than fifty'
            : 'Passage ' . ($i % 7);
        $scaleRows[] = [
            'id' => $i,
            'constant_text' => $constantText,
            'question_text' => 'Question ' . $i,
            'option_a' => 'A' . $i,
        ];
    }
    $scaleOrdered = cbt_order_selected_questions(
        $scaleRows,
        'English (Lexis & Structure)',
        static fn(array $groups): array => array_reverse($groups)
    );
    $beforeIds = el_ids($scaleRows);
    $afterIds = el_ids($scaleOrdered);
    sort($beforeIds);
    sort($afterIds);
    $scalePass = $scalePass
        && count($scaleOrdered) === $size
        && $beforeIds === $afterIds
        && el_non_empty_groups_are_contiguous($scaleOrdered)
        && el_rows_by_id($scaleOrdered) === el_rows_by_id($scaleRows);
}
el_check(
    $scalePass,
    'preserves 50, 60, and 100 selected rows including a 55-row group'
);

$randomized = cbt_order_selected_questions($rows, 'English (Lexis & Structure)');
$randomizedIds = el_ids($randomized);
$originalIds = el_ids($rows);
sort($randomizedIds);
sort($originalIds);
el_check(
    $randomizedIds === $originalIds
        && el_non_empty_groups_are_contiguous($randomized)
        && el_rows_by_id($randomized) === el_rows_by_id($rows),
    'production shuffle preserves the selected rows and passage contiguity'
);

$cbtPath = __DIR__ . '/../deployed/cbt.php';
$cbtSource = file_get_contents($cbtPath);
$practiceSource = file_get_contents(__DIR__ . '/../deployed/cbt_practice.php');
$includeNeedle = "require_once __DIR__ . '/cbt_question_order.php';";
$callNeedle = 'cbt_order_selected_questions(';
$fetchPosition = strpos($cbtSource, '$dbQuestions = $stmt->fetchAll();');
$callPosition = strpos($cbtSource, $callNeedle);
$attemptPosition = strpos($cbtSource, 'INSERT INTO cbt_exam_attempts');
el_check(
    substr_count($cbtSource, $includeNeedle) === 1
        && substr_count($cbtSource, $callNeedle) === 1
        && $fetchPosition !== false
        && $callPosition !== false
        && $attemptPosition !== false
        && $fetchPosition < $callPosition
        && $callPosition < $attemptPosition,
    'real cbt.php includes and calls the helper after selection and before attempt insertion'
);

el_check(
    str_contains($cbtSource, 'AND subject_id = :subject_id')
        && str_contains($cbtSource, 'AND exam_category_id = :exam_category_id')
        && str_contains($cbtSource, 'AND exam_year = :exam_year')
        && str_contains($cbtSource, 'ORDER BY RAND()')
        && str_contains($cbtSource, 'LIMIT " . (int) $questionLimit')
        && str_contains($cbtSource, '($selectedSubjectId === 12) ? 60 : 50')
        && str_contains($cbtSource, '$subjectsById[$selectedSubjectId][\'subject_name\']'),
    'real cbt.php preserves filters, random limited selection, default 50, and trusted name source'
);

el_check(
    str_contains($cbtSource, '\'constant\' => isset($row[\'constant_text\'])')
        && str_contains($cbtSource, 'renderQuestionText(questionArea.querySelector(\'.constant-text\'), q.constant)')
        && !str_contains($practiceSource, 'cbt_question_order.php')
        && !str_contains($practiceSource, $callNeedle),
    'every selected row keeps its Constant Text renderer and cbt_practice.php stays isolated'
);

echo "\nPASS: {$passed}\nFAIL: {$failed}\n";
exit($failed === 0 ? 0 : 1);
