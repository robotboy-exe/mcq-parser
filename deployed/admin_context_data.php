<?php
declare(strict_types=1);

function cbt_admin_context_default_values(): array
{
    return [
        'context_type' => CBT_CONTEXT_TYPE_COMPREHENSION,
        'title' => '',
        'context_text' => '',
        'subject_id' => '',
        'exam_category_id' => '',
        'exam_year' => (string) date('Y'),
        'expected_member_count' => '1',
    ];
}

function cbt_admin_positive_int_or_null(mixed $value): ?int
{
    $filtered = filter_var($value, FILTER_VALIDATE_INT);
    return ($filtered !== false && $filtered !== null && $filtered > 0) ? (int) $filtered : null;
}

/** @return array{value: ?int, error: string} */
function cbt_admin_optional_positive_int(mixed $value, string $label): array
{
    if ($value === null || (is_string($value) && trim($value) === '')) {
        return ['value' => null, 'error' => ''];
    }
    if ((!is_string($value) && !is_int($value))
        || preg_match('/^[1-9][0-9]*$/D', trim((string) $value)) !== 1) {
        return ['value' => null, 'error' => $label . ' must be a positive whole number.'];
    }
    $filtered = filter_var($value, FILTER_VALIDATE_INT);
    if ($filtered === false || $filtered === null || $filtered < 1) {
        return ['value' => null, 'error' => $label . ' must be a positive whole number.'];
    }
    return ['value' => (int) $filtered, 'error' => ''];
}

/** @return array{context_id: ?int, context_position: ?int, context_slot: ?int, errors: string[]} */
function cbt_admin_parse_question_context(array $formValues): array
{
    $contextId = cbt_admin_optional_positive_int($formValues['context_id'] ?? null, 'Shared context');
    $position = cbt_admin_optional_positive_int($formValues['context_position'] ?? null, 'Context position');
    $slot = cbt_admin_optional_positive_int($formValues['context_slot'] ?? null, 'Cloze slot');
    return [
        'context_id' => $contextId['value'],
        'context_position' => $position['value'],
        'context_slot' => $slot['value'],
        'errors' => array_values(array_filter([$contextId['error'], $position['error'], $slot['error']])),
    ];
}

function cbt_admin_prepare_question_context(
    PDO $pdo,
    array $formValues,
    int $editingQuestionId,
    int $subjectId,
    int $categoryId,
    int $examYear,
    bool $forUpdate = false
): array {
    $parsed = cbt_admin_parse_question_context($formValues);
    $contextId = $parsed['context_id'];
    $contextPosition = $parsed['context_position'];
    $contextSlot = $parsed['context_slot'];
    $context = $contextId !== null ? cbt_context_fetch($pdo, $contextId, $forUpdate) : null;

    if ($parsed['errors']) {
        $error = implode(' ', $parsed['errors']);
    } elseif ($contextId !== null && $context === null) {
        $error = 'The selected context no longer exists. Refresh the page and try again.';
    } else {
        $errors = cbt_context_question_link_errors(
            $pdo,
            [
                'id' => $editingQuestionId,
                'subject_id' => $subjectId,
                'exam_category_id' => $categoryId,
                'exam_year' => $examYear,
            ],
            $context,
            $contextPosition,
            $contextSlot
        );
        $error = $errors ? implode(' ', $errors) : '';
    }

    return [
        'context_id' => $contextId,
        'context_position' => $contextPosition,
        'context_slot' => $contextSlot,
        'context' => $context,
        'is_active' => !$parsed['errors'] && $context === null && ($formValues['is_active'] ?? '') === '1' ? 1 : 0,
        'error' => $error,
    ];
}

function cbt_admin_question_context_edit_values(array $formValues, array $question): array
{
    foreach (['context_id', 'context_position', 'context_slot'] as $key) {
        $formValues[$key] = $question[$key] !== null ? (string) $question[$key] : '';
    }
    return $formValues;
}

function cbt_admin_context_page_data(
    PDO $pdo,
    array $categories,
    string $requestMethod,
    array $query,
    int $editingContextId,
    array $contextValues
): array {
    try {
        $contexts = cbt_context_list($pdo);
        foreach ($contexts as &$contextItem) {
            $memberCount = (int) ($contextItem['member_count'] ?? 0);
            $validation = cbt_context_validate_activation($pdo, (int) $contextItem['id']);
            $contextItem['status_label'] = cbt_context_status_label($contextItem, $memberCount, $validation['ok']);
        }
        unset($contextItem);
        $error = '';

        if ($requestMethod === 'GET' && isset($query['edit_context'])) {
            $editContextId = cbt_admin_positive_int_or_null($query['edit_context']);
            if ($editContextId === null) {
                $error = 'Invalid context selected for editing.';
            } else {
                $contextToEdit = cbt_context_fetch($pdo, $editContextId);
                if ($contextToEdit === null) {
                    $error = 'The selected context was not found.';
                } else {
                    $editingContextId = (int) $contextToEdit['id'];
                    $contextValues = [
                        'context_type' => (string) $contextToEdit['context_type'],
                        'title' => (string) $contextToEdit['title'],
                        'context_text' => (string) $contextToEdit['context_text'],
                        'subject_id' => (string) $contextToEdit['subject_id'],
                        'exam_category_id' => (string) $contextToEdit['exam_category_id'],
                        'exam_year' => (string) $contextToEdit['exam_year'],
                        'expected_member_count' => (string) $contextToEdit['expected_member_count'],
                    ];
                }
            }
        }
    } catch (PDOException $error) {
        error_log('Admin context page loading failed: ' . $error->getMessage());
        return [
            'contexts' => [],
            'context_categories' => $categories,
            'schema_available' => false,
            'editing_context_id' => $editingContextId,
            'context_values' => $contextValues,
            'error' => 'Shared contexts could not be loaded. Check that the context migration has been imported.',
        ];
    }

    return [
        'contexts' => $contexts,
        'context_categories' => $categories,
        'schema_available' => true,
        'editing_context_id' => $editingContextId,
        'context_values' => $contextValues,
        'error' => $error,
    ];
}
