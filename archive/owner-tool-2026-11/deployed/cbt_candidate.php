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

/** SQL predicate for an active context whose inactive members still form 1..N. */
function cbt_candidate_complete_context_condition(): string
{
    return "
        AND c.expected_member_count BETWEEN 1 AND 500
        AND (SELECT COUNT(*) FROM questions cm WHERE cm.context_id = c.id) = c.expected_member_count
        AND NOT EXISTS (
            SELECT 1 FROM questions ci
            WHERE ci.context_id = c.id
              AND (COALESCE(ci.is_active, -1) <> 0
                OR ci.subject_id <> c.subject_id
                OR ci.exam_category_id <> c.exam_category_id
                OR ci.exam_year <> c.exam_year
                OR ci.context_position IS NULL)
        )
        AND (SELECT COUNT(DISTINCT cp.context_position) FROM questions cp WHERE cp.context_id = c.id)
            = c.expected_member_count
        AND (SELECT MIN(cn.context_position) FROM questions cn WHERE cn.context_id = c.id) = 1
        AND (SELECT MAX(cx.context_position) FROM questions cx WHERE cx.context_id = c.id)
            = c.expected_member_count";
}

/** Categories available from either active standalone rows or complete active contexts. */
function cbt_candidate_categories(PDO $pdo, int $subjectId): array
{
    $complete = cbt_candidate_complete_context_condition();
    $stmt = $pdo->prepare(
        "SELECT ec.id, ec.category_name
         FROM questions q
         INNER JOIN exam_category ec ON ec.id = q.exam_category_id
         WHERE q.is_active = 1 AND q.context_id IS NULL
           AND q.subject_id = :question_subject
           AND ec.is_active = 1 AND ec.id <= 10
         UNION
         SELECT ec.id, ec.category_name
         FROM question_contexts c
         INNER JOIN exam_category ec ON ec.id = c.exam_category_id
         WHERE c.is_active = 1 AND c.subject_id = :context_subject
           AND ec.is_active = 1 AND ec.id <= 10" . $complete . "
         ORDER BY category_name"
    );
    $stmt->execute([':question_subject' => $subjectId, ':context_subject' => $subjectId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/** Years available for the subject and optional category under existing filters. */
function cbt_candidate_years(PDO $pdo, int $subjectId, ?int $categoryId): array
{
    $complete = cbt_candidate_complete_context_condition();
    if ($categoryId !== null) {
        $stmt = $pdo->prepare(
            "SELECT q.exam_year
             FROM questions q
             INNER JOIN exam_category ec ON ec.id = q.exam_category_id
             WHERE q.is_active = 1 AND q.context_id IS NULL
               AND q.subject_id = :question_subject AND q.exam_category_id = :question_category
               AND ec.is_active = 1 AND ec.id <= 10
             UNION
             SELECT c.exam_year
             FROM question_contexts c
             INNER JOIN exam_category ec ON ec.id = c.exam_category_id
             WHERE c.is_active = 1 AND c.subject_id = :context_subject
               AND c.exam_category_id = :context_category
               AND ec.is_active = 1 AND ec.id <= 10" . $complete . "
             ORDER BY exam_year DESC"
        );
        $stmt->execute([
            ':question_subject' => $subjectId,
            ':question_category' => $categoryId,
            ':context_subject' => $subjectId,
            ':context_category' => $categoryId,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "SELECT exam_year FROM questions
             WHERE is_active = 1 AND context_id IS NULL AND subject_id = :question_subject
             UNION
             SELECT c.exam_year FROM question_contexts c
             WHERE c.is_active = 1 AND c.subject_id = :context_subject" . $complete . "
             ORDER BY exam_year DESC"
        );
        $stmt->execute([':question_subject' => $subjectId, ':context_subject' => $subjectId]);
    }
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function cbt_candidate_pool_has_unit(
    PDO $pdo,
    int $subjectId,
    int $categoryId,
    int $examYear
): bool {
    $standalone = $pdo->prepare(
        'SELECT 1 FROM questions
         WHERE is_active = 1 AND context_id IS NULL
           AND subject_id = :subject_id AND exam_category_id = :category_id AND exam_year = :exam_year
         LIMIT 1'
    );
    $params = [':subject_id' => $subjectId, ':category_id' => $categoryId, ':exam_year' => $examYear];
    $standalone->execute($params);
    if ($standalone->fetchColumn()) {
        return true;
    }
    $complete = cbt_candidate_complete_context_condition();
    $context = $pdo->prepare(
        "SELECT 1 FROM question_contexts c
         WHERE c.is_active = 1
           AND c.subject_id = :subject_id AND c.exam_category_id = :category_id AND c.exam_year = :exam_year"
        . $complete . ' LIMIT 1'
    );
    $context->execute($params);
    return (bool) $context->fetchColumn();
}

/** Read only IDs, positions, and publication fields before unit selection. */
function cbt_candidate_eligibility(PDO $pdo, int $subjectId, int $categoryId, int $examYear): array
{
    $params = [':subject_id' => $subjectId, ':category_id' => $categoryId, ':exam_year' => $examYear];
    $standalone = $pdo->prepare(
        'SELECT id FROM questions
         WHERE is_active = 1 AND context_id IS NULL
           AND subject_id = :subject_id AND exam_category_id = :category_id AND exam_year = :exam_year
         ORDER BY id'
    );
    $standalone->execute($params);
    $complete = cbt_candidate_complete_context_condition();
    $members = $pdo->prepare(
        "SELECT c.id AS context_id, c.expected_member_count,
                q.id, q.context_position, q.is_active
         FROM question_contexts c
         INNER JOIN questions q ON q.context_id = c.id
         WHERE c.is_active = 1
           AND c.subject_id = :subject_id AND c.exam_category_id = :category_id AND c.exam_year = :exam_year"
        . $complete . ' ORDER BY c.id, q.context_position, q.id'
    );
    $members->execute($params);
    $contexts = [];
    foreach ($members->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $contextId = (int) $row['context_id'];
        if (!isset($contexts[$contextId])) {
            $contexts[$contextId] = [
                'id' => $contextId,
                'expected_member_count' => (int) $row['expected_member_count'],
                'members' => [],
            ];
        }
        $contexts[$contextId]['members'][] = $row;
    }
    return [
        'standalone' => $standalone->fetchAll(PDO::FETCH_ASSOC),
        'contexts' => array_values($contexts),
    ];
}

/** Fetch all current full rows for selected IDs in one snapshot for revalidation. */
function cbt_candidate_hydrate(PDO $pdo, array $units): array
{
    $questionIds = [];
    $contextIds = [];
    foreach ($units as $unit) {
        if ($unit['context_id'] === null) {
            $questionIds[] = (int) $unit['question_ids'][0];
        } else {
            $contextIds[] = (int) $unit['context_id'];
        }
    }
    $conditions = [];
    $params = [];
    if ($questionIds) {
        $conditions[] = 'q.id IN (' . implode(',', array_fill(0, count($questionIds), '?')) . ')';
        array_push($params, ...$questionIds);
    }
    if ($contextIds) {
        $conditions[] = 'q.context_id IN (' . implode(',', array_fill(0, count($contextIds), '?')) . ')';
        array_push($params, ...$contextIds);
    }
    if (!$conditions) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT q.id, q.subject_id, q.exam_category_id, q.exam_year,
                q.question_text, q.question_image_path,
                q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
                q.context_id, q.context_position, q.context_slot, q.is_active,
                c.context_type, c.title AS context_title, c.context_text,
                c.expected_member_count, c.is_active AS context_is_active
         FROM questions q
         LEFT JOIN question_contexts c ON c.id = q.context_id
         WHERE ' . implode(' OR ', $conditions)
    );
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function cbt_candidate_delivery(
    PDO $pdo,
    int $subjectId,
    int $categoryId,
    int $examYear,
    int $limit,
    ?string $seed = null
): array {
    $eligibility = cbt_candidate_eligibility($pdo, $subjectId, $categoryId, $examYear);
    $units = cbt_candidate_build_units($eligibility);
    $selected = cbt_candidate_fit_units($units, $limit, $seed ?? bin2hex(random_bytes(16)));
    $rows = cbt_candidate_hydrate($pdo, $selected);
    return cbt_candidate_reconcile($selected, $rows, $subjectId, $categoryId, $examYear);
}
