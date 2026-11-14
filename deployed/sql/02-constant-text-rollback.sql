-- Non-destructive rollback for the ST01 Constant Text column.
--
-- Run only under an externally enforced maintenance/write freeze. The guard
-- refuses to drop the column if any row has a non-empty value.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_drop_empty_constant_text`;

DELIMITER $$
CREATE PROCEDURE `cbt_drop_empty_constant_text`()
BEGIN
  DECLARE column_exists INT DEFAULT 0;
  DECLARE filled_rows INT DEFAULT 0;

  SELECT COUNT(*) INTO column_exists
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'questions'
    AND column_name = 'constant_text';

  IF column_exists > 0 THEN
    SELECT COUNT(*) INTO filled_rows
    FROM `questions`
    WHERE `constant_text` IS NOT NULL AND `constant_text` <> '';

    IF filled_rows > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Rollback refused: Constant Text data exists. Export it and remove it explicitly before rollback.';
    END IF;

    ALTER TABLE `questions` DROP COLUMN `constant_text`;
  END IF;
END$$
DELIMITER ;

CALL `cbt_drop_empty_constant_text`();
DROP PROCEDURE IF EXISTS `cbt_drop_empty_constant_text`;
