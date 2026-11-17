-- Forward operation: ensure the exact English Lexis subject is active.
--
-- Target: MySQL 8.0.41, InnoDB, utf8mb4_unicode_ci.
-- The insert omits id so subjects.id remains database-generated.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_ensure_english_lexis_structure`;

DELIMITER $$
CREATE PROCEDURE `cbt_ensure_english_lexis_structure`()
BEGIN
  DECLARE id_contract_rows INT DEFAULT 0;
  DECLARE unique_name_indexes INT DEFAULT 0;
  DECLARE collation_rows INT DEFAULT 0;
  DECLARE exact_rows INT DEFAULT 0;
  DECLARE exact_active_rows INT DEFAULT 0;

  SELECT COUNT(*) INTO id_contract_rows
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'subjects'
    AND column_name = 'id'
    AND is_nullable = 'NO'
    AND extra LIKE '%auto_increment%';

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

  IF id_contract_rows <> 1 OR unique_name_indexes < 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis operation refused: subjects requires an auto-increment id and a single-column unique subject_name index.';
  END IF;

  SELECT COUNT(*) INTO collation_rows
  FROM `subjects`
  WHERE `subject_name` = _utf8mb4'English (Lexis & Structure)';

  SELECT COUNT(*) INTO exact_rows
  FROM `subjects`
  WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)');

  IF collation_rows <> exact_rows THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis operation refused: a collation-equivalent byte-different subject exists.';
  END IF;

  IF exact_rows = 0 THEN
    INSERT INTO `subjects` (`subject_name`, `is_active`)
    VALUES (_utf8mb4'English (Lexis & Structure)', 1);
  ELSEIF exact_rows = 1 THEN
    UPDATE `subjects`
    SET `is_active` = 1
    WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)');
  ELSE
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis operation refused: duplicate exact subjects exist.';
  END IF;

  SELECT COUNT(*) INTO exact_active_rows
  FROM `subjects`
  WHERE HEX(`subject_name`) = HEX(_utf8mb4'English (Lexis & Structure)')
    AND `is_active` = 1;

  IF exact_active_rows <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'English Lexis operation failed: one exact active subject was not produced.';
  END IF;
END$$
DELIMITER ;

CALL `cbt_ensure_english_lexis_structure`();
DROP PROCEDURE IF EXISTS `cbt_ensure_english_lexis_structure`;
