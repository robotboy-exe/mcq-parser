-- Non-destructive rollback for the OT05 shared-context schema.
--
-- Requires an externally enforced maintenance/write freeze for the complete
-- client session. Each removal has its own locked guard because ALTER TABLE on
-- InnoDB releases every explicit table lock held by the session.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_remove_question_context_columns`;
DROP PROCEDURE IF EXISTS `cbt_drop_empty_context_table`;

DELIMITER $$
CREATE PROCEDURE `cbt_remove_question_context_columns`()
BEGIN
  DECLARE context_count INT DEFAULT 0;
  DECLARE context_id_count INT DEFAULT 0;
  DECLARE context_position_count INT DEFAULT 0;
  DECLARE context_slot_count INT DEFAULT 0;

  SELECT COUNT(*) INTO context_count FROM `question_contexts`;
  SELECT COUNT(*) INTO context_id_count FROM `questions` WHERE `context_id` IS NOT NULL;
  SELECT COUNT(*) INTO context_position_count FROM `questions` WHERE `context_position` IS NOT NULL;
  SELECT COUNT(*) INTO context_slot_count FROM `questions` WHERE `context_slot` IS NOT NULL;

  IF context_count > 0 OR context_id_count > 0
     OR context_position_count > 0 OR context_slot_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Rollback refused: context data exists. Export it and remove it explicitly before rollback.';
  END IF;

  ALTER TABLE `questions`
    DROP FOREIGN KEY `fk_questions_context`,
    DROP INDEX `uq_questions_context_slot`,
    DROP INDEX `uq_questions_context_position`,
    DROP INDEX `idx_questions_context`,
    DROP COLUMN `context_slot`,
    DROP COLUMN `context_position`,
    DROP COLUMN `context_id`;

END$$

CREATE PROCEDURE `cbt_drop_empty_context_table`()
BEGIN
  DECLARE context_count INT DEFAULT 0;

  SELECT COUNT(*) INTO context_count FROM `question_contexts`;
  IF context_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Rollback refused: context data appeared during rollback; the context table was preserved.';
  END IF;
  DROP TABLE IF EXISTS `question_contexts`;
END$$
DELIMITER ;

LOCK TABLES `questions` WRITE, `question_contexts` WRITE;
CALL `cbt_remove_question_context_columns`();

-- The preceding ALTER releases both InnoDB locks. A writer that wins this race
-- is visible to the second count, so its committed row is preserved.
LOCK TABLES `question_contexts` WRITE;
CALL `cbt_drop_empty_context_table`();
UNLOCK TABLES;
DROP PROCEDURE IF EXISTS `cbt_remove_question_context_columns`;
DROP PROCEDURE IF EXISTS `cbt_drop_empty_context_table`;
