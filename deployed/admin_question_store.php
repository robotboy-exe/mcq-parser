<?php
declare(strict_types=1);

/**
 * Delete one standalone question and return the media paths to remove.
 *
 * @return array{deleted_rows: int, answer_video_path: ?string, question_image_path: ?string}
 */
function cbt_standalone_delete_question(PDO $pdo, int $questionId): array
{
    $pdo->beginTransaction();
    try {
        $lookup = $pdo->prepare('SELECT answer_video_path, question_image_path FROM questions WHERE id = :id');
        $lookup->execute([':id' => $questionId]);
        $row = $lookup->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            $pdo->commit();
            return ['deleted_rows' => 0, 'answer_video_path' => null, 'question_image_path' => null];
        }
        $delete = $pdo->prepare('DELETE FROM questions WHERE id = :id');
        $delete->execute([':id' => $questionId]);
        $deletedRows = $delete->rowCount();
        $pdo->commit();
        return [
            'deleted_rows' => $deletedRows,
            'answer_video_path' => $row['answer_video_path'] !== null ? (string) $row['answer_video_path'] : null,
            'question_image_path' => $row['question_image_path'] !== null ? (string) $row['question_image_path'] : null,
        ];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

/**
 * Save one standalone question with an explicit column list.
 *
 * @param array<string, mixed> $values subject_id, exam_category_id, exam_year,
 *        question_text, constant_text, option_a..option_d, correct_option,
 *        answer_explanation, answer_video_path, question_image_path, is_active
 * @return array{question_id: int}
 */
function cbt_standalone_save_question(PDO $pdo, string $action, int $questionId, array $values): array
{
    if (!in_array($action, ['save_question', 'update_question'], true)) {
        throw new InvalidArgumentException('Unsupported standalone question action.');
    }

    $pdo->beginTransaction();
    try {
        if ($action === 'update_question') {
            $update = $pdo->prepare(
                'UPDATE questions SET subject_id = :subject_id,
                    exam_category_id = :exam_category_id, exam_year = :exam_year,
                    question_text = :question_text, constant_text = :constant_text,
                    option_a = :option_a, option_b = :option_b, option_c = :option_c,
                    option_d = :option_d, correct_option = :correct_option,
                    answer_explanation = :answer_explanation,
                    answer_video_path = :answer_video_path, question_image_path = :question_image_path,
                    is_active = :is_active
                 WHERE id = :id'
            );
        } else {
            $update = $pdo->prepare(
                'INSERT INTO questions
                    (subject_id, exam_category_id, exam_year, question_text, constant_text,
                     question_image_path, option_a, option_b, option_c, option_d,
                     correct_option, answer_explanation, answer_video_path, is_active)
                 VALUES
                    (:subject_id, :exam_category_id, :exam_year, :question_text, :constant_text,
                     :question_image_path, :option_a, :option_b, :option_c, :option_d,
                     :correct_option, :answer_explanation, :answer_video_path, :is_active)'
            );
        }

        $constantText = $values['constant_text'] !== null && (string) $values['constant_text'] !== ''
            ? (string) $values['constant_text']
            : null;

        $params = [
            ':subject_id' => (int) $values['subject_id'],
            ':exam_category_id' => (int) $values['exam_category_id'],
            ':exam_year' => (int) $values['exam_year'],
            ':question_text' => (string) $values['question_text'],
            ':constant_text' => $constantText,
            ':option_a' => (string) $values['option_a'],
            ':option_b' => (string) $values['option_b'],
            ':option_c' => (string) $values['option_c'],
            ':option_d' => (string) $values['option_d'],
            ':correct_option' => (int) $values['correct_option'],
            ':answer_explanation' => $values['answer_explanation'],
            ':answer_video_path' => $values['answer_video_path'],
            ':question_image_path' => $values['question_image_path'],
            ':is_active' => (int) $values['is_active'],
        ];
        if ($action === 'update_question') {
            $params[':id'] = $questionId;
        }
        $update->execute($params);
        if ($action === 'save_question') {
            $questionId = (int) $pdo->lastInsertId();
        }
        $pdo->commit();
        return ['question_id' => $questionId];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}
