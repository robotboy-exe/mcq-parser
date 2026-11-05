<?php
declare(strict_types=1);

// Shared context validation and query helpers for the owner tool.
//
// This file is side-effect-free: including it only declares constants and
// functions. It never connects to the database, starts a session, reads input,
// writes output, or performs a write query. Callers pass their PDO handle.

const CBT_CONTEXT_TYPE_COMPREHENSION = 'comprehension';
const CBT_CONTEXT_TYPE_CLOZE = 'cloze';
const CBT_CONTEXT_MAX_MEMBERS = 500;
const CBT_CONTEXT_MAX_TEXT_LENGTH = 60000;

function cbt_context_types(): array
{
    return [CBT_CONTEXT_TYPE_COMPREHENSION, CBT_CONTEXT_TYPE_CLOZE];
}

function cbt_context_type_is_valid(string $type): bool
{
    return in_array($type, cbt_context_types(), true);
}

function cbt_context_text_length(string $text): int
{
    if (function_exists('mb_strlen')) {
        return (int) mb_strlen($text, 'UTF-8');
    }
    return strlen($text);
}

/**
 * Return the distinct numeric cloze slots written as [[gap:N]] in a context.
 * Only the exact lowercase token is recognized; anything else stays literal.
 */
function cbt_context_slot_tokens(string $text): array
{
    preg_match_all('/\[\[gap:([0-9]{1,3})\]\]/', $text, $matches);
    $slots = array_map('intval', $matches[1] ?? []);
    $slots = array_values(array_unique($slots));
    sort($slots, SORT_NUMERIC);
    return $slots;
}

function cbt_context_fetch(PDO $pdo, int $contextId, bool $forUpdate = false): ?array
{
    if ($contextId < 1) {
        return null;
    }

    $sql = 'SELECT id, context_type, title, context_text, subject_id, exam_category_id,
                   exam_year, expected_member_count, is_active, created_at, updated_at,
                   activated_at, idempotency_token
            FROM question_contexts
            WHERE id = :id';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $contextId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row === false ? null : $row;
}

function cbt_context_members(PDO $pdo, int $contextId, bool $forUpdate = false): array
{
    $sql = 'SELECT id, question_text, subject_id, exam_category_id, exam_year,
                   option_a, option_b, option_c, option_d, correct_option,
                   context_id, context_position, context_slot, is_active
            FROM questions
            WHERE context_id = :context_id
            ORDER BY context_position ASC, id ASC';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':context_id' => $contextId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function cbt_context_list(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT c.id, c.context_type, c.title, c.subject_id,
                c.exam_category_id, c.exam_year, c.expected_member_count,
                c.is_active, c.created_at, c.updated_at, c.activated_at,
                s.subject_name, ec.category_name,
                (SELECT COUNT(*) FROM questions q WHERE q.context_id = c.id) AS member_count
         FROM question_contexts c
         LEFT JOIN subjects s ON s.id = c.subject_id
         LEFT JOIN exam_category ec ON ec.id = c.exam_category_id
         ORDER BY c.id DESC'
    );
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function cbt_context_member_count(PDO $pdo, int $contextId): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM questions WHERE context_id = :id');
    $stmt->execute([':id' => $contextId]);
    return (int) $stmt->fetchColumn();
}

/**
 * Validate a question-to-context link using the question's pool fields. A null
 * context means "not linked"; then position and slot must be null.
 *
 * @return string[] Human-readable validation errors.
 */
function cbt_context_question_link_errors(PDO $pdo, array $question, ?array $context, ?int $position, ?int $slot): array
{
    if ($context === null) {
        if ($position !== null || $slot !== null) {
            return ['A context position or cloze slot requires a selected context.'];
        }
        return [];
    }

    $errors = [];
    $contextId = (int) $context['id'];
    $questionId = (int) ($question['id'] ?? 0);

    if ((int) $context['subject_id'] !== (int) ($question['subject_id'] ?? 0)
        || (int) $context['exam_category_id'] !== (int) ($question['exam_category_id'] ?? 0)
        || (int) $context['exam_year'] !== (int) ($question['exam_year'] ?? 0)) {
        $errors[] = 'The question does not match the context subject, exam category, and year pool.';
    }

    if ($position === null || $position < 1 || $position > CBT_CONTEXT_MAX_MEMBERS) {
        $errors[] = 'Enter a context position between 1 and ' . CBT_CONTEXT_MAX_MEMBERS . '.';
    }

    $type = (string) $context['context_type'];
    if ($type === CBT_CONTEXT_TYPE_COMPREHENSION) {
        if ($slot !== null) {
            $errors[] = 'A comprehension member must not have a cloze slot.';
        }
    } elseif ($type === CBT_CONTEXT_TYPE_CLOZE) {
        if ($slot === null || $slot < 1 || $slot > 999) {
            $errors[] = 'Enter a cloze slot between 1 and 999.';
        } else {
            $tokens = cbt_context_slot_tokens((string) $context['context_text']);
            if (!in_array($slot, $tokens, true)) {
                $errors[] = 'The cloze slot [[gap:' . $slot . ']] is not present in the context text.';
            }
        }
    } else {
        $errors[] = 'The context type is invalid.';
    }

    $expected = (int) $context['expected_member_count'];
    $countSql = 'SELECT COUNT(*) FROM questions WHERE context_id = :context_id';
    $countParams = [':context_id' => $contextId];
    if ($questionId > 0) {
        $countSql .= ' AND id <> :question_id';
        $countParams[':question_id'] = $questionId;
    }
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $currentMembers = (int) $countStmt->fetchColumn();
    if ($expected > 0 && $currentMembers >= $expected) {
        $errors[] = 'The context already has its expected number of members.';
    }

    if ($position !== null) {
        $duplicateSql = 'SELECT id FROM questions WHERE context_id = :context_id AND context_position = :position';
        $duplicateParams = [':context_id' => $contextId, ':position' => $position];
        if ($questionId > 0) {
            $duplicateSql .= ' AND id <> :question_id';
            $duplicateParams[':question_id'] = $questionId;
        }
        $duplicateStmt = $pdo->prepare($duplicateSql . ' LIMIT 1');
        $duplicateStmt->execute($duplicateParams);
        if ($duplicateStmt->fetchColumn()) {
            $errors[] = 'Another question already uses that context position.';
        }
    }

    if ($slot !== null) {
        $slotSql = 'SELECT id FROM questions WHERE context_id = :context_id AND context_slot = :slot';
        $slotParams = [':context_id' => $contextId, ':slot' => $slot];
        if ($questionId > 0) {
            $slotSql .= ' AND id <> :question_id';
            $slotParams[':question_id'] = $questionId;
        }
        $slotStmt = $pdo->prepare($slotSql . ' LIMIT 1');
        $slotStmt->execute($slotParams);
        if ($slotStmt->fetchColumn()) {
            $errors[] = 'Another question already uses that cloze slot.';
        }
    }

    return array_values(array_unique($errors));
}

function cbt_context_status_label(array $context, int $memberCount, bool $valid = false): string
{
    $expected = (int) ($context['expected_member_count'] ?? 0);
    if ((int) ($context['is_active'] ?? 0) === 1) {
        return $valid ? 'Active' : 'Active (needs review)';
    }
    if ($memberCount !== $expected) {
        return 'Incomplete (' . $memberCount . ' of ' . $expected . ')';
    }
    return $valid ? 'Ready to activate' : 'Needs review (' . $memberCount . ' of ' . $expected . ')';
}

require_once __DIR__ . '/context_input_validation.php';
require_once __DIR__ . '/context_activation_validation.php';
