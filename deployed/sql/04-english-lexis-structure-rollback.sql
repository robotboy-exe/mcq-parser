-- Non-destructive rollback: deactivate the exact English Lexis subject.
--
-- This operation never deletes a subject, question, or exam attempt.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_deactivate_english_lexis_structure`;

DELIMITER $$
CREATE PROCEDURE `cbt_deactivate_english_lexis_structure`()
BEGIN
  DECLARE unique_name_indexes INT DEFAULT 0;
  DECLARE collation_rows INT DEFAULT 0;
  DECLARE exact_rows INT DEFAULT 0;
  DECLARE exact_active_rows INT DEFAULT 0;

  SELECT COUNT(*) INTO unique_name_indexes
  FROM (
    SELECT index_name
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'subjects'
      AND non_unique = 0
    GROUP BY index_name
    HAVING COUNT(*) = 1
      AND MAX(column_name = 'subject_name') = 1
  ) AS subject_name_indexes;

  IF unique_name_indexes < 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis rollback refused: subjects requires a single-column unique subject_name index.';
  END IF;

  SELECT COUNT(*) INTO collation_rows
  FROM `subjects`
  WHERE `subject_name` = _utf8mb4'English (Lexis & Structure)';

  SELECT COUNT(*) INTO exact_rows
  FROM `subjects`
  WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)');

  IF collation_rows <> exact_rows THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis rollback refused: a collation-equivalent byte-different subject exists.';
  END IF;

  IF exact_rows > 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis rollback refused: duplicate exact subjects exist.';
  END IF;

  UPDATE `subjects`
  SET `is_active` = 0
  WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)');

  SELECT COUNT(*) INTO exact_active_rows
  FROM `subjects`
  WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)')
    AND `is_active` = 1;

  IF exact_active_rows <> 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis rollback failed: the exact subject remains active.';
  END IF;
END$$
DELIMITER ;

CALL `cbt_deactivate_english_lexis_structure`();
DROP PROCEDURE IF EXISTS `cbt_deactivate_english_lexis_structure`;
