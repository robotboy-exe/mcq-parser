<?php
declare(strict_types=1);

require_once __DIR__ . '/cbt_candidate_selection.php';

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
