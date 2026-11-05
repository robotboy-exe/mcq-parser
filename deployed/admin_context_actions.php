<?php
declare(strict_types=1);

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
