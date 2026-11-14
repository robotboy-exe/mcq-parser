-- Forward migration: optional Constant Text passage for the owner tool (ST01).
--
-- Target: MySQL 8.0.41, InnoDB, utf8mb4_unicode_ci.
-- Rerun behavior: guarded with information_schema; a second run is a no-op.
-- Existing questions are not modified: constant_text is nullable.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_assert_constant_text_compatible`;

DELIMITER $$
CREATE PROCEDURE `cbt_assert_constant_text_compatible`()
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'questions'
        AND column_name = 'constant_text'
        AND NOT (COLUMN_TYPE = 'text'
          AND IS_NULLABLE = 'YES'
          AND COLUMN_DEFAULT IS NULL
          AND EXTRA = ''
          AND CHARACTER_SET_NAME = 'utf8mb4'
          AND COLLATION_NAME = 'utf8mb4_unicode_ci'
          AND COLUMN_COMMENT = '')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Constant Text migration refused: an existing constant_text column is incompatible.';
  END IF;
END$$
DELIMITER ;

CALL `cbt_assert_constant_text_compatible`();
DROP PROCEDURE IF EXISTS `cbt_assert_constant_text_compatible`;

SET @has_constant_text := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'questions'
    AND column_name = 'constant_text'
);
SET @constant_text_sql := IF(
  @has_constant_text = 0,
  'ALTER TABLE `questions` ADD COLUMN `constant_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `question_text`',
  'DO 0'
);
PREPARE constant_text_stmt FROM @constant_text_sql;
EXECUTE constant_text_stmt;
DEALLOCATE PREPARE constant_text_stmt;
