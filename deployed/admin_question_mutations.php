<?php
declare(strict_types=1);

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
