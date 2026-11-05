<?php
declare(strict_types=1);

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
