<?php
declare(strict_types=1);

/** Build standalone and complete-context random units from lightweight rows. */
function cbt_candidate_build_units(array $eligibility): array
{
    $units = [];
    $seenQuestions = [];
    foreach ($eligibility['standalone'] ?? [] as $row) {
        $id = (int) ($row['id'] ?? 0);
        if ($id < 1 || isset($seenQuestions[$id])) {
            continue;
        }
        $seenQuestions[$id] = true;
        $units[] = ['key' => 'q:' . $id, 'context_id' => null, 'question_ids' => [$id]];
    }

    foreach ($eligibility['contexts'] ?? [] as $context) {
        $contextId = (int) ($context['id'] ?? 0);
        $expected = (int) ($context['expected_member_count'] ?? 0);
        $members = $context['members'] ?? [];
        usort($members, static function (array $left, array $right): int {
            return [(int) $left['context_position'], (int) $left['id']]
                <=> [(int) $right['context_position'], (int) $right['id']];
        });
        if ($contextId < 1 || $expected < 1 || count($members) !== $expected) {
            continue;
        }
        $ids = [];
        $valid = true;
        foreach ($members as $index => $member) {
            $id = (int) ($member['id'] ?? 0);
            if ($id < 1
                || (int) ($member['context_position'] ?? 0) !== $index + 1
                || (int) ($member['is_active'] ?? -1) !== 0
                || isset($seenQuestions[$id])) {
                $valid = false;
                break;
            }
            $ids[] = $id;
        }
        if (!$valid) {
            continue;
        }
        foreach ($ids as $id) {
            $seenQuestions[$id] = true;
        }
        $units[] = ['key' => 'c:' . $contextId, 'context_id' => $contextId, 'question_ids' => $ids];
    }
    return $units;
}

/** Deterministically shuffle units for a request seed, then fit only whole units. */
function cbt_candidate_fit_units(array $units, int $limit, string $seed): array
{
    if ($limit < 1) {
        return [];
    }
    usort($units, static function (array $left, array $right) use ($seed): int {
        $leftKey = (string) ($left['key'] ?? '');
        $rightKey = (string) ($right['key'] ?? '');
        $comparison = strcmp(
            hash('sha256', $seed . "\0" . $leftKey),
            hash('sha256', $seed . "\0" . $rightKey)
        );
        return $comparison !== 0 ? $comparison : strcmp($leftKey, $rightKey);
    });

    $selected = [];
    $remaining = $limit;
    foreach ($units as $unit) {
        $size = count($unit['question_ids'] ?? []);
        if ($size < 1 || $size > $remaining) {
            continue;
        }
        $selected[] = $unit;
        $remaining -= $size;
        if ($remaining === 0) {
            break;
        }
    }
    return $selected;
}

function cbt_candidate_matches_pool(array $row, int $subjectId, int $categoryId, int $examYear): bool
{
    return (int) ($row['subject_id'] ?? 0) === $subjectId
        && (int) ($row['exam_category_id'] ?? 0) === $categoryId
        && (int) ($row['exam_year'] ?? 0) === $examYear;
}

function cbt_candidate_context_member_is_complete(array $row): bool
{
    foreach (['question_text', 'option_a', 'option_b', 'option_c', 'option_d'] as $field) {
        if (trim((string) ($row[$field] ?? '')) === '') {
            return false;
        }
    }
    $correct = filter_var($row['correct_option'] ?? null, FILTER_VALIDATE_INT);
    return $correct !== false && $correct !== null && $correct >= 0 && $correct <= 3;
}

/** Remove repeated context metadata before rows reach the browser payload mapper. */
function cbt_candidate_public_question(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'question_text' => (string) $row['question_text'],
        'question_image_path' => $row['question_image_path'],
        'option_a' => (string) $row['option_a'],
        'option_b' => (string) $row['option_b'],
        'option_c' => (string) $row['option_c'],
        'option_d' => (string) $row['option_d'],
        'correct_option' => (int) $row['correct_option'],
        'context_id' => $row['context_id'] === null ? null : (int) $row['context_id'],
        'context_position' => $row['context_position'] === null ? null : (int) $row['context_position'],
        'context_slot' => $row['context_slot'] === null ? null : (int) $row['context_slot'],
    ];
}

/** Revalidate the full-row snapshot and flatten accepted units in selected order. */
function cbt_candidate_reconcile(
    array $units,
    array $rows,
    int $subjectId,
    int $categoryId,
    int $examYear
): array {
    $byId = [];
    $byContext = [];
    foreach ($rows as $row) {
        $id = (int) ($row['id'] ?? 0);
        if ($id < 1 || isset($byId[$id])) {
            continue;
        }
        $byId[$id] = $row;
        if ($row['context_id'] !== null) {
            $byContext[(int) $row['context_id']][] = $row;
        }
    }

    $questions = [];
    $contexts = [];
    foreach ($units as $unit) {
        $contextId = $unit['context_id'];
        if ($contextId === null) {
            $id = (int) ($unit['question_ids'][0] ?? 0);
            $row = $byId[$id] ?? null;
            if ($row !== null && $row['context_id'] === null
                && (int) $row['is_active'] === 1
                && cbt_candidate_matches_pool($row, $subjectId, $categoryId, $examYear)) {
                $questions[] = cbt_candidate_public_question($row);
            }
            continue;
        }

        $contextId = (int) $contextId;
        $members = $byContext[$contextId] ?? [];
        usort($members, static function (array $left, array $right): int {
            return [(int) $left['context_position'], (int) $left['id']]
                <=> [(int) $right['context_position'], (int) $right['id']];
        });
        $expectedIds = array_map('intval', $unit['question_ids'] ?? []);
        $actualIds = array_map('intval', array_column($members, 'id'));
        if (!$members || $actualIds !== $expectedIds) {
            continue;
        }

        $first = $members[0];
        $type = (string) ($first['context_type'] ?? '');
        $text = (string) ($first['context_text'] ?? '');
        $valid = (int) ($first['context_is_active'] ?? 0) === 1
            && (int) ($first['expected_member_count'] ?? 0) === count($members)
            && in_array($type, ['comprehension', 'cloze'], true)
            && trim((string) ($first['context_title'] ?? '')) !== ''
            && trim($text) !== '';
        $slots = [];
        foreach ($members as $index => $member) {
            $slot = $member['context_slot'];
            $valid = $valid
                && (int) $member['context_id'] === $contextId
                && (int) $member['context_position'] === $index + 1
                && (int) $member['is_active'] === 0
                && (int) $member['context_is_active'] === 1
                && (string) $member['context_type'] === $type
                && (string) $member['context_text'] === $text
                && cbt_candidate_matches_pool($member, $subjectId, $categoryId, $examYear)
                && cbt_candidate_context_member_is_complete($member);
            if ($type === 'cloze') {
                $slot = filter_var($slot, FILTER_VALIDATE_INT);
                $valid = $valid && $slot !== false && $slot !== null
                    && $slot >= 1 && $slot <= 999
                    && strpos($text, '[[gap:' . $slot . ']]') !== false
                    && !isset($slots[$slot]);
                $slots[$slot] = true;
            } else {
                $valid = $valid && $slot === null;
            }
        }
        if (!$valid) {
            continue;
        }
        $contexts[$contextId] = [
            'id' => $contextId,
            'type' => $type,
            'title' => (string) $first['context_title'],
            'text' => $text,
        ];
        foreach ($members as $member) {
            $questions[] = cbt_candidate_public_question($member);
        }
    }
    return ['questions' => $questions, 'contexts' => $contexts];
}
