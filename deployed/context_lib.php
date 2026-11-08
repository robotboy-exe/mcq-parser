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

function cbt_context_scalar_input(array $input, string $key, string $label, array &$errors): string
{
    $value = $input[$key] ?? '';
    if (!is_scalar($value)) {
        $errors[] = 'The ' . $label . ' has an invalid submitted value.';
        return '';
    }
    return (string) $value;
}

/** Normalize raw context form input and retain malformed-field errors. */
function cbt_context_normalize_input(array $input): array
{
    $inputErrors = [];
    $type = trim(cbt_context_scalar_input($input, 'context_type', 'context type', $inputErrors));
    $title = trim(cbt_context_scalar_input($input, 'title', 'context title', $inputErrors));
    $text = str_replace(
        ["\r\n", "\r"],
        "\n",
        cbt_context_scalar_input($input, 'context_text', 'shared context text', $inputErrors)
    );
    $subjectId = filter_var(
        cbt_context_scalar_input($input, 'subject_id', 'context subject', $inputErrors),
        FILTER_VALIDATE_INT
    );
    $categoryId = filter_var(
        cbt_context_scalar_input($input, 'exam_category_id', 'context exam category', $inputErrors),
        FILTER_VALIDATE_INT
    );
    $examYear = filter_var(
        cbt_context_scalar_input($input, 'exam_year', 'context exam year', $inputErrors),
        FILTER_VALIDATE_INT
    );
    $expectedCount = filter_var(
        cbt_context_scalar_input($input, 'expected_member_count', 'expected member count', $inputErrors),
        FILTER_VALIDATE_INT
    );

    return [
        'context_type' => $type,
        'title' => $title,
        'context_text' => $text,
        'subject_id' => ($subjectId === false || $subjectId === null) ? 0 : (int) $subjectId,
        'exam_category_id' => ($categoryId === false || $categoryId === null) ? 0 : (int) $categoryId,
        'exam_year' => ($examYear === false || $examYear === null) ? 0 : (int) $examYear,
        'expected_member_count' => ($expectedCount === false || $expectedCount === null) ? 0 : (int) $expectedCount,
        '_input_errors' => $inputErrors,
    ];
}

/** @return string[] Human-readable validation errors. */
function cbt_context_input_errors(PDO $pdo, array $values, int $editingId = 0, ?array $existing = null): array
{
    $errors = array_values(array_filter(
        $values['_input_errors'] ?? [],
        static fn(mixed $error): bool => is_string($error) && $error !== ''
    ));
    $type = (string) ($values['context_type'] ?? '');
    if (!cbt_context_type_is_valid($type)) {
        $errors[] = 'Choose a valid context type (comprehension or cloze).';
    }

    $title = (string) ($values['title'] ?? '');
    if ($title === '') {
        $errors[] = 'Please enter a context title.';
    } elseif (cbt_context_text_length($title) > 200) {
        $errors[] = 'The context title must be 200 characters or fewer.';
    }

    $text = (string) ($values['context_text'] ?? '');
    if (trim($text) === '') {
        $errors[] = 'Please enter the shared context text.';
    } elseif (cbt_context_text_length($text) > CBT_CONTEXT_MAX_TEXT_LENGTH) {
        $errors[] = 'The shared context text is too long.';
    }

    $subjectId = (int) ($values['subject_id'] ?? 0);
    $categoryId = (int) ($values['exam_category_id'] ?? 0);
    $examYear = (int) ($values['exam_year'] ?? 0);
    $expected = (int) ($values['expected_member_count'] ?? 0);
    if ($subjectId < 1) {
        $errors[] = 'Choose a valid subject for the context pool.';
    } else {
        $stmt = $pdo->prepare('SELECT id FROM subjects WHERE id = :id AND is_active = 1');
        $stmt->execute([':id' => $subjectId]);
        if (!$stmt->fetchColumn()) {
            $errors[] = 'The context subject is inactive or does not exist.';
        }
    }
    if ($categoryId < 1) {
        $errors[] = 'Choose a valid exam category for the context pool.';
    } else {
        $stmt = $pdo->prepare('SELECT id FROM exam_category WHERE id = :id AND is_active = 1');
        $stmt->execute([':id' => $categoryId]);
        if (!$stmt->fetchColumn()) {
            $errors[] = 'The context exam category is inactive or does not exist.';
        }
    }
    if ($examYear < 1900 || $examYear > 2100) {
        $errors[] = 'Enter a context exam year between 1900 and 2100.';
    }
    if ($expected < 1 || $expected > CBT_CONTEXT_MAX_MEMBERS) {
        $errors[] = 'The expected member count must be between 1 and ' . CBT_CONTEXT_MAX_MEMBERS . '.';
    }

    $tokens = cbt_context_slot_tokens($text);
    if ($type === CBT_CONTEXT_TYPE_COMPREHENSION && $tokens) {
        $errors[] = 'A comprehension context must not contain cloze gap tokens.';
    }
    if ($type === CBT_CONTEXT_TYPE_CLOZE) {
        if (!$tokens) {
            $errors[] = 'A cloze context needs at least one [[gap:N]] token.';
        } else {
            if (in_array(0, $tokens, true)) {
                $errors[] = 'Cloze tokens must use numbers from 1 to 999.';
            }
            if ($expected > 0 && count($tokens) !== $expected) {
                $errors[] = 'The expected member count must equal the number of distinct [[gap:N]] tokens.';
            }
        }
    }

    if ($existing !== null && $editingId > 0 && cbt_context_member_count($pdo, $editingId) > 0) {
        if ((string) ($existing['context_type'] ?? '') !== $type) {
            $errors[] = 'The context type cannot change while linked questions exist.';
        }
        if ((int) ($existing['subject_id'] ?? 0) !== $subjectId
            || (int) ($existing['exam_category_id'] ?? 0) !== $categoryId
            || (int) ($existing['exam_year'] ?? 0) !== $examYear) {
            $errors[] = 'The context pool cannot change while linked questions exist.';
        }
    }
    return array_values(array_unique($errors));
}

/**
 * Validate a context for activation. This is read-only; the caller decides
 * whether to activate inside its own transaction.
 *
 * @return array{ok: bool, errors: string[], context: ?array, members: array, member_count: int}
 */
function cbt_context_validate_activation(PDO $pdo, int $contextId, bool $forUpdate = false): array
{
    $errors = [];
    $context = cbt_context_fetch($pdo, $contextId, $forUpdate);
    if ($context === null) {
        return [
            'ok' => false,
            'errors' => ['The context does not exist.'],
            'context' => null,
            'members' => [],
            'member_count' => 0,
        ];
    }

    $members = cbt_context_members($pdo, $contextId, $forUpdate);
    $memberCount = count($members);
    $expected = (int) $context['expected_member_count'];
    $type = (string) $context['context_type'];
    if (!cbt_context_type_is_valid($type)) {
        $errors[] = 'The context type is invalid.';
    }
    if (trim((string) $context['title']) === '') {
        $errors[] = 'The context has no title.';
    }
    if (trim((string) $context['context_text']) === '') {
        $errors[] = 'The context has no shared text.';
    }
    if ((int) $context['exam_year'] < 1900 || (int) $context['exam_year'] > 2100) {
        $errors[] = 'The context exam year is invalid.';
    }
    if ($expected < 1 || $expected > CBT_CONTEXT_MAX_MEMBERS) {
        $errors[] = 'The expected member count is invalid.';
    }

    $tokens = cbt_context_slot_tokens((string) $context['context_text']);
    if ($type === CBT_CONTEXT_TYPE_COMPREHENSION && $tokens) {
        $errors[] = 'A comprehension context must not contain cloze gap tokens.';
    }
    if ($type === CBT_CONTEXT_TYPE_CLOZE && !$tokens) {
        $errors[] = 'A cloze context needs at least one [[gap:N]] token.';
    }
    if ($type === CBT_CONTEXT_TYPE_CLOZE && in_array(0, $tokens, true)) {
        $errors[] = 'Cloze tokens must use numbers from 1 to 999.';
    }
    if ($memberCount < 1) {
        $errors[] = 'The context has no linked questions.';
    }
    if ($memberCount !== $expected) {
        $errors[] = 'The context has ' . $memberCount . ' linked question(s) but expects ' . $expected . '.';
    }

    $subjectStmt = $pdo->prepare('SELECT id FROM subjects WHERE id = :id AND is_active = 1');
    $subjectStmt->execute([':id' => (int) $context['subject_id']]);
    if (!$subjectStmt->fetchColumn()) {
        $errors[] = 'The context subject is inactive or does not exist.';
    }
    $categoryStmt = $pdo->prepare('SELECT id FROM exam_category WHERE id = :id AND is_active = 1');
    $categoryStmt->execute([':id' => (int) $context['exam_category_id']]);
    if (!$categoryStmt->fetchColumn()) {
        $errors[] = 'The context exam category is inactive or does not exist.';
    }

    $positions = [];
    $slots = [];
    foreach ($members as $member) {
        $memberId = (int) $member['id'];
        $position = $member['context_position'];
        if ($position === null || (int) $position < 1) {
            $errors[] = 'Question #' . $memberId . ' has no valid context position.';
        } else {
            $positions[] = (int) $position;
        }
        if (trim((string) $member['question_text']) === '') {
            $errors[] = 'Question #' . $memberId . ' has no question text.';
        }
        foreach (['option_a', 'option_b', 'option_c', 'option_d'] as $option) {
            if (trim((string) ($member[$option] ?? '')) === '') {
                $errors[] = 'Question #' . $memberId . ' is missing one of its four options.';
                break;
            }
        }
        $correct = filter_var($member['correct_option'] ?? null, FILTER_VALIDATE_INT);
        if ($correct === false || $correct === null || $correct < 0 || $correct > 3) {
            $errors[] = 'Question #' . $memberId . ' has no valid correct answer.';
        }
        if ((int) $member['subject_id'] !== (int) $context['subject_id']
            || (int) $member['exam_category_id'] !== (int) $context['exam_category_id']
            || (int) $member['exam_year'] !== (int) $context['exam_year']) {
            $errors[] = 'Question #' . $memberId . ' does not match the context pool.';
        }
        if ((int) $member['is_active'] === 1) {
            $errors[] = 'Question #' . $memberId . ' must stay inactive while linked to a context.';
        }
        if ($type === CBT_CONTEXT_TYPE_CLOZE) {
            if ($member['context_slot'] === null || (int) $member['context_slot'] < 1) {
                $errors[] = 'Question #' . $memberId . ' has no cloze slot.';
            } else {
                $slots[] = (int) $member['context_slot'];
            }
        } elseif ($member['context_slot'] !== null) {
            $errors[] = 'Question #' . $memberId . ' must not have a cloze slot in a comprehension context.';
        }
    }

    $sortedPositions = $positions;
    sort($sortedPositions, SORT_NUMERIC);
    $expectedPositions = $expected > 0 ? range(1, $expected) : [];
    if ($sortedPositions !== $expectedPositions) {
        $errors[] = 'Context positions must be unique and run from 1 to ' . $expected . '.';
    }
    if ($type === CBT_CONTEXT_TYPE_CLOZE) {
        $uniqueSlots = array_values(array_unique($slots));
        sort($uniqueSlots, SORT_NUMERIC);
        if (count($uniqueSlots) !== count($slots)) {
            $errors[] = 'Cloze slots must be unique.';
        }
        if ($uniqueSlots !== $tokens) {
            $errors[] = 'The linked cloze slots must match the [[gap:N]] tokens in the context text.';
        }
    }
    $errors = array_values(array_unique($errors));
    return [
        'ok' => $errors === [],
        'errors' => $errors,
        'context' => $context,
        'members' => $members,
        'member_count' => $memberCount,
    ];
}
