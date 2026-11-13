<?php
declare(strict_types=1);

require_once __DIR__ . '/context_lib.php';

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
    $contextPageSize = 10;
    $contextPage = 1;
    $contextTotal = 0;
    $contextTotalPages = 1;
    $contextOptions = [];
    try {
        $contextTotal = cbt_context_count($pdo);
        $contextOptions = cbt_context_option_list($pdo);
        $contextTotalPages = max(1, (int) ceil($contextTotal / $contextPageSize));
        $contextPageValue = filter_var($query['context_page'] ?? 1, FILTER_VALIDATE_INT);
        $contextPage = ($contextPageValue !== false && $contextPageValue !== null && $contextPageValue > 0)
            ? (int) $contextPageValue
            : 1;
        if ($contextPage > $contextTotalPages) {
            $contextPage = $contextTotalPages;
        }
        $contexts = cbt_context_list($pdo, $contextPageSize, ($contextPage - 1) * $contextPageSize);
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
            'context_options' => [],
            'context_categories' => $categories,
            'schema_available' => false,
            'editing_context_id' => $editingContextId,
            'context_values' => $contextValues,
            'context_page' => 1,
            'context_page_size' => $contextPageSize,
            'context_total' => 0,
            'context_total_pages' => 1,
            'error' => 'Shared text did not load. Ask for help.',
        ];
    }

    return [
        'contexts' => $contexts,
        'context_options' => $contextOptions,
        'context_categories' => $categories,
        'schema_available' => true,
        'editing_context_id' => $editingContextId,
        'context_values' => $contextValues,
        'context_page' => $contextPage,
        'context_page_size' => $contextPageSize,
        'context_total' => $contextTotal,
        'context_total_pages' => $contextTotalPages,
        'error' => $error,
    ];
}

function cbt_admin_owner_text_key($value): string
{
    $text = str_replace(['<u>', '</u>'], '', (string) $value);
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    $text = trim($text);
    return function_exists('mb_strtolower')
        ? mb_strtolower($text, 'UTF-8')
        : strtolower($text);
}

function cbt_admin_owner_context_payload(?PDO $pdo): array
{
    if ($pdo === null) {
        return [];
    }
    try {
        return array_map(static function (array $context) use ($pdo): array {
            return [
                'context_id' => (int) $context['id'],
                'context_type' => (string) $context['context_type'],
                'title' => (string) $context['title'],
                'title_key' => cbt_admin_owner_text_key($context['title']),
                'text_key' => cbt_admin_owner_text_key($context['context_text']),
                'subject_id' => (string) $context['subject_id'],
                'exam_category_id' => (string) $context['exam_category_id'],
                'exam_year' => (string) $context['exam_year'],
                'expected_member_count' => (int) $context['expected_member_count'],
                'member_count' => (int) $context['member_count'],
                'is_active' => (int) $context['is_active'],
                'slots' => cbt_context_slot_tokens((string) $context['context_text']),
                'members' => array_map(static function (array $member): array {
                    return [
                        'question_text' => (string) $member['question_text'],
                        'context_position' => (string) $member['context_position'],
                        'context_slot' => (string) $member['context_slot'],
                    ];
                }, cbt_context_members($pdo, (int) $context['id'])),
            ];
        }, cbt_context_list($pdo));
    } catch (Throwable $error) {
        return [];
    }
}

function cbt_admin_owner_recent_questions(?PDO $pdo): array
{
    if ($pdo === null) {
        return [];
    }
    try {
        $stmt = $pdo->query(
            'SELECT id, subject_id, exam_category_id, exam_year, question_text,
                    option_a, option_b, option_c, option_d
             FROM questions
             ORDER BY id DESC
             LIMIT 20'
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $error) {
        return [];
    }
}

function cbt_admin_owner_payload_scripts(?PDO $pdo, bool $enabled): string
{
    $contexts = $enabled ? cbt_admin_owner_context_payload($pdo) : [];
    $questions = $enabled ? cbt_admin_owner_recent_questions($pdo) : [];
    $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;
    $contextJson = json_encode($contexts, $flags) ?: '[]';
    $questionJson = json_encode($questions, $flags) ?: '[]';
    return '<script type="application/json" id="owner_tool_context_data">' . $contextJson . '</script>' . "\n"
        . '<script type="application/json" id="owner_tool_recent_questions">' . $questionJson . '</script>';
}

function cbt_admin_load_context_page(
    PDO $pdo,
    array $categories,
    string $method,
    array $query,
    int $editingContextId,
    array $contextValues
): array {
    try {
        $contextPage = cbt_admin_context_page_data(
            $pdo,
            $categories,
            $method,
            $query,
            $editingContextId,
            $contextValues
        );
        return [
            'contexts' => $contextPage['contexts'],
            'contextOptions' => $contextPage['context_options'],
            'contextCategories' => $contextPage['context_categories'],
            'contextSchemaAvailable' => $contextPage['schema_available'],
            'editingContextId' => $contextPage['editing_context_id'],
            'contextValues' => $contextPage['context_values'],
            'contextPage' => $contextPage['context_page'],
            'contextTotal' => $contextPage['context_total'],
            'contextTotalPages' => $contextPage['context_total_pages'],
            'contextPageSize' => $contextPage['context_page_size'],
            'contextError' => $contextPage['error'],
        ];
    } catch (PDOException $e) {
        error_log('Admin context page loading failed: ' . $e->getMessage());
        return [
            'contexts' => [],
            'contextOptions' => [],
            'contextCategories' => [],
            'contextSchemaAvailable' => false,
            'editingContextId' => $editingContextId,
            'contextValues' => $contextValues,
            'contextPage' => 1,
            'contextTotal' => 0,
            'contextTotalPages' => 1,
            'contextPageSize' => 10,
            'contextError' => '',
        ];
    }
}

function cbt_admin_context_actions(): array
{
    return ['save_context', 'update_context', 'activate_context', 'deactivate_context', 'delete_context'];
}

function cbt_admin_is_context_action(string $action): bool
{
    return in_array($action, cbt_admin_context_actions(), true);
}

function cbt_admin_context_action_result(): array
{
    return [
        'error' => '',
        'flash' => '',
        'redirect' => false,
        'editing_context_id' => 0,
        'context_values' => null,
    ];
}

function cbt_admin_dispatch_context_action(string $action, array $input, callable $connect): array
{
    if (!cbt_admin_is_context_action($action)) {
        throw new InvalidArgumentException('Unsupported admin context action.');
    }

    $result = cbt_admin_context_action_result();

    if ($action === 'save_context' || $action === 'update_context') {
        $contextIdInput = $action === 'update_context'
            ? cbt_admin_optional_positive_int($input['context_id'] ?? null, 'Context id')
            : ['value' => null, 'error' => ''];
        $editingContextId = $contextIdInput['value'] ?? 0;
        $contextValues = cbt_context_normalize_input($input);
        $result['editing_context_id'] = $editingContextId;
        $result['context_values'] = $contextValues;
        if ($contextIdInput['error'] !== '') {
            $result['error'] = $contextIdInput['error'];
            return $result;
        }

        try {
            $pdo = $connect();
            $pdo->beginTransaction();
            $existingContext = $editingContextId > 0 ? cbt_context_fetch($pdo, $editingContextId, true) : null;
            if ($action === 'update_context' && $existingContext === null) {
                $pdo->rollBack();
                $result['error'] = 'That context no longer exists. Refresh the page and try again.';
                return $result;
            }
            if ($action === 'update_context') {
                cbt_context_members($pdo, $editingContextId, true);
            }

            $contextErrors = cbt_context_input_errors($pdo, $contextValues, $editingContextId, $existingContext);
            if ($contextErrors) {
                $pdo->rollBack();
                $result['error'] = implode(' ', $contextErrors);
                return $result;
            }

            if ($action === 'update_context') {
                $updateContext = $pdo->prepare(
                    'UPDATE question_contexts SET
                        context_type = :context_type,
                        title = :title,
                        context_text = :context_text,
                        subject_id = :subject_id,
                        exam_category_id = :exam_category_id,
                        exam_year = :exam_year,
                        expected_member_count = :expected_member_count,
                        is_active = 0,
                        activated_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = :id'
                );
                $params = [':id' => $editingContextId];
                $result['flash'] = 'Context #' . $editingContextId . ' updated. It is inactive until revalidated.';
            } else {
                $updateContext = $pdo->prepare(
                    'INSERT INTO question_contexts
                        (context_type, title, context_text, subject_id, exam_category_id, exam_year, expected_member_count, is_active)
                     VALUES
                        (:context_type, :title, :context_text, :subject_id, :exam_category_id, :exam_year, :expected_member_count, 0)'
                );
                $params = [];
            }
            $updateContext->execute(array_merge([
                ':context_type' => $contextValues['context_type'],
                ':title' => $contextValues['title'],
                ':context_text' => $contextValues['context_text'],
                ':subject_id' => $contextValues['subject_id'],
                ':exam_category_id' => $contextValues['exam_category_id'],
                ':exam_year' => $contextValues['exam_year'],
                ':expected_member_count' => $contextValues['expected_member_count'],
            ], $params));

            if ($action === 'save_context') {
                $editingContextId = (int) $pdo->lastInsertId();
                $result['editing_context_id'] = $editingContextId;
                $result['flash'] = 'Context #' . $editingContextId . ' created. Link its members, then activate it.';
            }
            $pdo->commit();
            $result['redirect'] = true;
        } catch (PDOException $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Admin context insert/update failed: ' . $e->getMessage());
            $result['error'] = 'The context could not be saved. Check that the context migration has been imported and try again.';
        }
        return $result;
    }

    $contextId = filter_var($input['context_id'] ?? '', FILTER_VALIDATE_INT);
    if ($contextId === false || $contextId === null || $contextId < 1) {
        $verb = match ($action) {
            'activate_context' => 'activate',
            'deactivate_context' => 'deactivate',
            default => 'delete',
        };
        $result['error'] = 'Please select a valid context to ' . $verb . '.';
        return $result;
    }
    $contextId = (int) $contextId;

    if ($action === 'activate_context') {
        try {
            $pdo = $connect();
            $pdo->beginTransaction();
            $activation = cbt_context_validate_activation($pdo, $contextId, true);
            if (!$activation['ok']) {
                $pdo->rollBack();
                $result['error'] = 'Context #' . $contextId . ' cannot be activated: ' . implode(' ', $activation['errors']);
                return $result;
            }

            $activate = $pdo->prepare(
                'UPDATE question_contexts
                 SET is_active = 1, activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $activate->execute([':id' => $contextId]);
            $pdo->commit();
            $result['flash'] = 'Context #' . $contextId . ' activated successfully. Linked questions remain hidden from the legacy candidate list.';
            $result['redirect'] = true;
        } catch (PDOException $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Admin context activation failed: ' . $e->getMessage());
            $result['error'] = 'The context could not be activated. Please try again.';
        }
        return $result;
    }

    if ($action === 'deactivate_context') {
        try {
            $pdo = $connect();
            $deactivate = $pdo->prepare(
                'UPDATE question_contexts
                 SET is_active = 0, activated_at = NULL, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $deactivate->execute([':id' => $contextId]);
            $result['flash'] = $deactivate->rowCount() > 0
                ? 'Context #' . $contextId . ' deactivated.'
                : 'No context was deactivated; it may already be missing.';
            $result['redirect'] = true;
        } catch (PDOException $e) {
            error_log('Admin context deactivation failed: ' . $e->getMessage());
            $result['error'] = 'The context could not be deactivated. Please try again.';
        }
        return $result;
    }

    try {
        $pdo = $connect();
        $pdo->beginTransaction();
        $context = cbt_context_fetch($pdo, $contextId, true);
        $members = $context === null ? [] : cbt_context_members($pdo, $contextId, true);
        $memberCount = count($members);
        if ($memberCount > 0) {
            $pdo->rollBack();
            $result['error'] = 'Context #' . $contextId . ' cannot be deleted while '
                . $memberCount . ' linked question(s) exist. Unlink them first.';
            return $result;
        }

        $deleteContext = $pdo->prepare('DELETE FROM question_contexts WHERE id = :id');
        $deleteContext->execute([':id' => $contextId]);
        $pdo->commit();
        $result['flash'] = $deleteContext->rowCount() > 0
            ? 'Context #' . $contextId . ' was deleted successfully.'
            : 'No context was deleted; it may already have been removed.';
        $result['redirect'] = true;
    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Admin context delete failed: ' . $e->getMessage());
        $result['error'] = 'The context could not be deleted. It may still be referenced by linked questions.';
    }
    return $result;
}

function cbt_admin_handle_context_request(
    string $action,
    array $input,
    int &$editingContextId,
    array &$contextValues,
    string &$pageError,
    string $scriptName,
    ?callable $connect = null
): void {
    global $pdo;
    if ($connect === null) {
        $connect = static function () use (&$pdo): PDO {
            if (!$pdo instanceof PDO) {
                require_once __DIR__ . '/cbt_db.php';
            }
            return $pdo;
        };
    }
    $result = cbt_admin_dispatch_context_action(
        $action,
        $input,
        $connect
    );
    $editingContextId = $result['editing_context_id'];
    if ($result['context_values'] !== null) {
        $contextValues = $result['context_values'];
    }
    $pageError = $result['error'];
    if ($result['redirect']) {
        $_SESSION['cbt_admin_flash'] = $result['flash'];
        header('Location: ' . $scriptName);
        exit;
    }
}

/** @return int[] */
function cbt_admin_context_ids(array $contextIds): array
{
    $unique = [];
    foreach ($contextIds as $contextId) {
        if ($contextId !== null && (int) $contextId > 0) {
            $unique[(int) $contextId] = true;
        }
    }
    $ids = array_keys($unique);
    sort($ids, SORT_NUMERIC);
    return $ids;
}

/** Lock context rows in one stable order before locking their member rows. */
function cbt_admin_lock_contexts(PDO $pdo, array $contextIds): void
{
    foreach (cbt_admin_context_ids($contextIds) as $contextId) {
        cbt_context_fetch($pdo, $contextId, true);
    }
}

function cbt_admin_deactivate_contexts(PDO $pdo, array $contextIds): void
{
    $ids = cbt_admin_context_ids($contextIds);
    if (!$ids) {
        return;
    }
    $deactivate = $pdo->prepare(
        'UPDATE question_contexts
         SET is_active = 0, activated_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );
    foreach ($ids as $contextId) {
        $deactivate->execute([':id' => $contextId]);
    }
}

function cbt_admin_question_params(array $values, array $questionContext): array
{
    $contextId = $questionContext['context_id'];
    return [
        ':subject_id' => (int) $values['subject_id'],
        ':exam_category_id' => (int) $values['exam_category_id'],
        ':exam_year' => (int) $values['exam_year'],
        ':question_text' => (string) $values['question_text'],
        ':option_a' => (string) $values['option_a'],
        ':option_b' => (string) $values['option_b'],
        ':option_c' => (string) $values['option_c'],
        ':option_d' => (string) $values['option_d'],
        ':correct_option' => (int) $values['correct_option'],
        ':answer_explanation' => $values['answer_explanation'],
        ':answer_video_path' => $values['answer_video_path'],
        ':question_image_path' => $values['question_image_path'],
        ':is_active' => $questionContext['is_active'],
        ':context_id' => $contextId,
        ':context_position' => $contextId !== null ? $questionContext['context_position'] : null,
        ':context_slot' => $contextId !== null ? $questionContext['context_slot'] : null,
    ];
}

/**
 * Execute the real question insert/update and context deactivation atomically.
 * A stale former-context hint causes a rollback and one lock-order retry.
 */
function cbt_admin_mutate_question(
    PDO $pdo,
    string $action,
    int $questionId,
    array $values,
    array $contextInput,
    ?int $formerContextHint = null
): array {
    if (!in_array($action, ['save_question', 'update_question'], true)) {
        throw new InvalidArgumentException('Unsupported question mutation action.');
    }
    $parsed = cbt_admin_parse_question_context($contextInput);
    if ($parsed['errors']) {
        throw new RuntimeException(implode(' ', $parsed['errors']));
    }
    $targetContextId = $parsed['context_id'];
    $formerHint = $action === 'update_question' ? $formerContextHint : null;

    for ($attempt = 0; $attempt < 3; $attempt++) {
        $pdo->beginTransaction();
        try {
            cbt_admin_lock_contexts($pdo, [$formerHint, $targetContextId]);
            $actualFormerContextId = null;
            if ($action === 'update_question') {
                $existing = $pdo->prepare(
                    'SELECT id, context_id FROM questions WHERE id = :id FOR UPDATE'
                );
                $existing->execute([':id' => $questionId]);
                $row = $existing->fetch(PDO::FETCH_ASSOC);
                if ($row === false) {
                    throw new RuntimeException('That question no longer exists. Refresh the page and try again.');
                }
                $actualFormerContextId = $row['context_id'] !== null ? (int) $row['context_id'] : null;
                if ($actualFormerContextId !== $formerHint) {
                    $pdo->rollBack();
                    $formerHint = $actualFormerContextId;
                    continue;
                }
            }

            $questionContext = cbt_admin_prepare_question_context(
                $pdo,
                $contextInput,
                $questionId,
                (int) $values['subject_id'],
                (int) $values['exam_category_id'],
                (int) $values['exam_year'],
                true
            );
            if ($questionContext['error'] !== '') {
                throw new RuntimeException($questionContext['error']);
            }
            $params = cbt_admin_question_params($values, $questionContext);
            if ($action === 'update_question') {
                $update = $pdo->prepare(
                    'UPDATE questions SET subject_id = :subject_id,
                        exam_category_id = :exam_category_id, exam_year = :exam_year,
                        question_text = :question_text, option_a = :option_a,
                        option_b = :option_b, option_c = :option_c, option_d = :option_d,
                        correct_option = :correct_option, answer_explanation = :answer_explanation,
                        answer_video_path = :answer_video_path, question_image_path = :question_image_path,
                        is_active = :is_active, context_id = :context_id,
                        context_position = :context_position, context_slot = :context_slot
                     WHERE id = :id'
                );
                $params[':id'] = $questionId;
                $update->execute($params);
            } else {
                $insert = $pdo->prepare(
                    'INSERT INTO questions
                        (subject_id, exam_category_id, exam_year, question_text, question_image_path,
                         option_a, option_b, option_c, option_d, correct_option, answer_explanation,
                         answer_video_path, is_active, context_id, context_position, context_slot)
                     VALUES
                        (:subject_id, :exam_category_id, :exam_year, :question_text, :question_image_path,
                         :option_a, :option_b, :option_c, :option_d, :correct_option, :answer_explanation,
                         :answer_video_path, :is_active, :context_id, :context_position, :context_slot)'
                );
                $insert->execute($params);
                $questionId = (int) $pdo->lastInsertId();
            }
            cbt_admin_deactivate_contexts($pdo, [$actualFormerContextId, $targetContextId]);
            $pdo->commit();
            return ['question_id' => $questionId, 'context_id' => $targetContextId];
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }
    throw new RuntimeException('The question changed during this request. Refresh the page and try again.');
}

/** Delete a question and deactivate its actual locked context in one transaction. */
function cbt_admin_delete_question(PDO $pdo, int $questionId, ?int $formerContextHint = null): array
{
    for ($attempt = 0; $attempt < 3; $attempt++) {
        $pdo->beginTransaction();
        try {
            cbt_admin_lock_contexts($pdo, [$formerContextHint]);
            $lookup = $pdo->prepare(
                'SELECT answer_video_path, question_image_path, context_id
                 FROM questions WHERE id = :id FOR UPDATE'
            );
            $lookup->execute([':id' => $questionId]);
            $row = $lookup->fetch(PDO::FETCH_ASSOC);
            if ($row === false) {
                $pdo->commit();
                return ['deleted_rows' => 0, 'answer_video_path' => null, 'question_image_path' => null];
            }
            $actualContextId = $row['context_id'] !== null ? (int) $row['context_id'] : null;
            if ($actualContextId !== $formerContextHint) {
                $pdo->rollBack();
                $formerContextHint = $actualContextId;
                continue;
            }
            $delete = $pdo->prepare('DELETE FROM questions WHERE id = :id');
            $delete->execute([':id' => $questionId]);
            $deletedRows = $delete->rowCount();
            if ($deletedRows > 0) {
                cbt_admin_deactivate_contexts($pdo, [$actualContextId]);
            }
            $pdo->commit();
            return [
                'deleted_rows' => $deletedRows,
                'answer_video_path' => $row['answer_video_path'],
                'question_image_path' => $row['question_image_path'],
            ];
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }
    throw new RuntimeException('The question changed during deletion. Refresh the page and try again.');
}

function cbt_admin_render_question_context_fields(array $variables): string
{
    extract($variables, EXTR_SKIP);
    $contextOptions = $contextOptions ?? ($contexts ?? []);
    ob_start();
    ?><fieldset class="owner-form-group owner-link-fields" id="owner_context_link_fields">
    <legend>Shared text for this question</legend>
    <?php if (!$contextSchemaAvailable): ?>
        <div class="admin-alert admin-error">Shared text is not set up yet.</div>
    <?php endif; ?>
    <div class="admin-grid">
    <div class="admin-field">
        <label for="context_id">Shared text</label>
        <select id="context_id" name="context_id">
            <option value="">No shared text</option>
            <?php foreach ($contextOptions as $contextOption): ?>
                <option value="<?php echo (int) $contextOption['id']; ?>" <?php echo ((string) $contextOption['id'] === $formValues['context_id']) ? 'selected' : ''; ?>>
                    #<?php echo (int) $contextOption['id']; ?>: <?php echo h($contextOption['title']); ?> -
                    <?php echo h((string) ($contextOption['subject_name'] ?? 'unknown subject')); ?>, <?php echo h((string) ($contextOption['category_name'] ?? 'unknown exam')); ?>, <?php echo (int) $contextOption['exam_year']; ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="admin-note">The question and shared text must have the same subject, exam, and year.</p>
    </div>
    <div class="admin-field" id="owner_context_position_field">
        <label for="context_position">Passage question number</label>
        <input id="context_position" name="context_position" type="number" min="1" max="500" step="1" value="<?php echo h($formValues['context_position']); ?>" placeholder="Example: 1">
        <p class="admin-note">Use 1, 2, 3... Each number can be used once.</p>
    </div>
    <div class="admin-field" id="owner_context_slot_field">
        <label for="context_slot">Gap number</label>
        <input id="context_slot" name="context_slot" type="number" min="1" max="999" step="1" value="<?php echo h($formValues['context_slot']); ?>" placeholder="For gap text only">
        <p class="admin-note">Use the N from <code>[[gap:N]]</code>.</p>
    </div>
</div>
</fieldset>

<?php
    return (string) ob_get_clean();
}

function cbt_admin_render_context_management(array $variables): string
{
    extract($variables, EXTR_SKIP);
    ob_start();
    $contextEditMode = $editingContextId > 0;
    ?><div class="owner-workflow-section" id="owner-shared-texts"<?php echo (int) ($editingQuestionId ?? 0) > 0 ? ' hidden' : ''; ?>>
<section class="admin-card owner-context-editor owner-context-editor-<?php echo $contextEditMode ? 'edit' : 'draft'; ?>" id="shared_context_editor">
    <div class="admin-topline">
        <h2 id="owner_context_editor_heading"><?php echo $contextEditMode ? 'Edit Saved Shared Text' : 'New Shared Text'; ?></h2>
        <strong class="owner-context-mode owner-context-mode-<?php echo $contextEditMode ? 'edit' : 'draft'; ?>" id="owner_context_mode"><?php echo $contextEditMode ? 'Saved text #' . (int) $editingContextId . ' - edit mode' : 'New text - draft mode'; ?></strong>
        <span class="admin-note" id="owner_context_native_status"><?php echo $editingContextId > 0 ? 'Editing shared text #' . (int) $editingContextId : 'Paste shared text or tap Add.'; ?></span>
        <?php if ($editingContextId > 0): ?>
            <a class="admin-btn admin-btn-muted" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?context_page=<?php echo (int) ($contextPage ?? 1); ?>" style="display:inline-block;text-decoration:none">Cancel</a>
        <?php endif; ?>
    </div>
    <?php if (!$contextSchemaAvailable): ?>
        <div class="admin-alert admin-error">Shared text is not set up yet.</div>
    <?php else: ?>
        <form method="post" autocomplete="off">
            <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
            <input type="hidden" name="action" value="<?php echo $editingContextId > 0 ? 'update_context' : 'save_context'; ?>">
            <?php if ($editingContextId > 0): ?>
                <input type="hidden" name="context_id" value="<?php echo (int) $editingContextId; ?>">
            <?php endif; ?>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_type">Text type</label>
                    <select id="context_type" name="context_type" required>
                        <?php foreach (cbt_context_types() as $contextType): ?>
                            <option value="<?php echo h($contextType); ?>" <?php echo $contextValues['context_type'] === $contextType ? 'selected' : ''; ?>><?php echo $contextType === 'cloze' ? 'Gap passage' : 'Reading passage'; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="admin-field">
                    <label for="context_title">Name</label>
                    <input id="context_title" name="title" type="text" maxlength="200" value="<?php echo h($contextValues['title']); ?>" required>
                </div>
            </div>
            <p class="admin-note">These boxes help find the same saved text.</p>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_subject_id">Subject</label>
                    <select id="context_subject_id" name="subject_id" required>
                        <option value="">Choose a subject</option>
                        <?php foreach ($subjects as $subject): ?>
                            <option value="<?php echo (int) $subject['id']; ?>" <?php echo ((string) $subject['id'] === (string) $contextValues['subject_id']) ? 'selected' : ''; ?>><?php echo h($subject['subject_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="admin-field">
                    <label for="context_exam_category_id">Exam</label>
                    <select id="context_exam_category_id" name="exam_category_id" required>
                        <option value="">Choose an exam</option>
                        <?php foreach ($contextCategories as $category): ?>
                            <option value="<?php echo (int) $category['id']; ?>" <?php echo ((string) $category['id'] === (string) $contextValues['exam_category_id']) ? 'selected' : ''; ?>><?php echo h($category['category_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_exam_year">Year</label>
                    <input id="context_exam_year" name="exam_year" type="number" min="1900" max="2100" step="1" value="<?php echo h($contextValues['exam_year']); ?>" required>
                </div>
                <div class="admin-field">
                    <label for="expected_member_count">Number of questions</label>
                    <input id="expected_member_count" name="expected_member_count" type="number" min="1" max="500" step="1" value="<?php echo h($contextValues['expected_member_count']); ?>" required>
                </div>
            </div>

            <div class="admin-field" id="owner_context_targets_field" hidden>
                <label for="owner_context_targets">Questions using this text</label>
                <input id="owner_context_targets" type="text" autocomplete="off" placeholder="Example: 11, 12, 13">
                <p class="admin-note">List question numbers in order.</p>
            </div>

            <div class="admin-field">
                <label for="context_text">Shared text</label>
                <textarea id="context_text" name="context_text" maxlength="60000" required><?php echo "\n" . h($contextValues['context_text']); ?></textarea>
                <p class="admin-note">Use <code>&lt;u&gt;words&lt;/u&gt;</code> to underline. Use <code>[[gap:N]]</code> for each gap.</p>
            </div>

            <button class="admin-btn" type="submit"><?php echo $editingContextId > 0 ? 'Save Changes' : 'Save Shared Text'; ?></button>
            <p class="admin-note" style="margin-top:10px">This stays off until checked and turned on. Changes turn it off again.</p>
        </form>
    <?php endif; ?>
</section>

<section class="admin-card">
    <h2>Saved Shared Texts</h2>
    <?php if (!$contextSchemaAvailable): ?>
        <p class="admin-note">Saved shared texts are not ready yet.</p>
    <?php elseif (!$contexts): ?>
        <p class="admin-note">No shared text has been saved yet.</p>
    <?php else: ?>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Type</th><th>Name</th><th>Subject, Exam, Year</th><th>Questions</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                <?php foreach ($contexts as $contextItem): ?>
                    <?php
                        $contextMemberCount = (int) ($contextItem['member_count'] ?? 0);
                        $contextStatus = (string) ($contextItem['status_label'] ?? 'Please check');
                        $contextIsActive = (int) $contextItem['is_active'] === 1;
                    ?>
                    <tr>
                        <td><?php echo (int) $contextItem['id']; ?></td>
                        <td><?php echo $contextItem['context_type'] === 'cloze' ? 'Gap passage' : 'Reading passage'; ?></td>
                        <td><?php echo h((string) $contextItem['title']); ?></td>
                        <td><?php echo h((string) ($contextItem['subject_name'] ?? '—')); ?> / <?php echo h((string) ($contextItem['category_name'] ?? '—')); ?> / <?php echo (int) $contextItem['exam_year']; ?></td>
                        <td><?php echo $contextMemberCount; ?> of <?php echo (int) $contextItem['expected_member_count']; ?></td>
                        <td><span class="admin-status <?php echo $contextIsActive ? 'active' : 'inactive'; ?>"><?php echo h($contextStatus); ?></span></td>
                        <td>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                                <a class="admin-btn admin-btn-edit" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?edit_context=<?php echo (int) $contextItem['id']; ?>&amp;context_page=<?php echo (int) ($contextPage ?? 1); ?>" style="display:inline-block;text-decoration:none;padding:8px 11px">Edit</a>
                                <?php if ($contextIsActive): ?>
                                    <form method="post" style="margin:0">
                                        <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                        <input type="hidden" name="action" value="deactivate_context">
                                        <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                        <button class="admin-btn admin-btn-muted" type="submit" style="padding:8px 11px">Turn Off</button>
                                    </form>
                                <?php else: ?>
                                    <form method="post" style="margin:0">
                                        <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                        <input type="hidden" name="action" value="activate_context">
                                        <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                        <button class="admin-btn" type="submit" style="padding:8px 11px">Turn On</button>
                                    </form>
                                <?php endif; ?>
                                <form method="post" onsubmit="return confirm('Delete shared text #<?php echo (int) $contextItem['id']; ?>? Questions using it will stop this.');" style="margin:0">
                                    <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                    <input type="hidden" name="action" value="delete_context">
                                    <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                    <button class="admin-btn admin-btn-delete" type="submit" style="padding:8px 11px">Delete</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
            $contextPage = (int) ($contextPage ?? 1);
            $contextTotal = (int) ($contextTotal ?? count($contexts));
            $contextTotalPages = (int) ($contextTotalPages ?? 1);
            $contextPageSize = (int) ($contextPageSize ?? 10);
            $contextFirst = $contextTotal > 0 ? (($contextPage - 1) * $contextPageSize) + 1 : 0;
            $contextLast = min($contextFirst + count($contexts) - 1, $contextTotal);
            $contextWindowStart = max(1, $contextPage - 2);
            $contextWindowEnd = min($contextTotalPages, $contextPage + 2);
        ?>
        <div class="admin-pagination">
            <div class="admin-pagination-summary">
                Showing <?php echo $contextFirst; ?>–<?php echo $contextLast; ?> of <?php echo $contextTotal; ?> shared texts
                (<?php echo $contextPageSize; ?> per page)
            </div>
            <?php if ($contextTotalPages > 1): ?>
                <nav class="admin-pagination-links" aria-label="Shared text pages">
                    <?php if ($contextPage > 1): ?>
                        <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?context_page=<?php echo $contextPage - 1; ?>" aria-label="Previous shared text page">&laquo; Prev</a>
                    <?php else: ?>
                        <span class="admin-page-link" aria-disabled="true" style="opacity:.45">&laquo; Prev</span>
                    <?php endif; ?>

                    <?php for ($pageNumber = $contextWindowStart; $pageNumber <= $contextWindowEnd; $pageNumber++): ?>
                        <?php if ($pageNumber === $contextPage): ?>
                            <span class="admin-page-link active" aria-current="page"><?php echo $pageNumber; ?></span>
                        <?php else: ?>
                            <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?context_page=<?php echo $pageNumber; ?>"><?php echo $pageNumber; ?></a>
                        <?php endif; ?>
                    <?php endfor; ?>

                    <?php if ($contextPage < $contextTotalPages): ?>
                        <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?context_page=<?php echo $contextPage + 1; ?>" aria-label="Next shared text page">Next &raquo;</a>
                    <?php else: ?>
                        <span class="admin-page-link" aria-disabled="true" style="opacity:.45">Next &raquo;</span>
                    <?php endif; ?>
                </nav>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</section>
</div>

<?php
    return (string) ob_get_clean();
}
