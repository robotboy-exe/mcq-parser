<?php
declare(strict_types=1);

const CBT_GROUPED_SUBJECT_NAME = 'English (Lexis & Structure)';

/**
 * @param null|callable(array): array $shuffleGroups Test seam for group order.
 */
function cbt_order_selected_questions(
    array $questions,
    string $subjectName,
    ?callable $shuffleGroups = null
): array {
    if ($subjectName !== CBT_GROUPED_SUBJECT_NAME) {
        return $questions;
    }

    $groups = [];
    $groupIndexes = [];
    foreach ($questions as $question) {
        $constantText = $question['constant_text'] ?? null;
        if (!is_string($constantText) || $constantText === '') {
            $groups[] = [$question];
            continue;
        }

        $key = 'text:' . $constantText;
        if (!array_key_exists($key, $groupIndexes)) {
            $groupIndexes[$key] = count($groups);
            $groups[] = [];
        }
        $groups[$groupIndexes[$key]][] = $question;
    }

    foreach ($groups as $index => $group) {
        usort(
            $group,
            static fn(array $a, array $b): int => (int) ($a['id'] ?? 0) <=> (int) ($b['id'] ?? 0)
        );
        $groups[$index] = $group;
    }

    if ($shuffleGroups === null) {
        shuffle($groups);
    } else {
        $groups = $shuffleGroups($groups);
    }

    $ordered = [];
    foreach ($groups as $group) {
        foreach ($group as $question) {
            $ordered[] = $question;
        }
    }
    return $ordered;
}
