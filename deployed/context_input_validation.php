<?php
declare(strict_types=1);

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
