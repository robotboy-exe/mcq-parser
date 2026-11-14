-- Forward migration: shared-context schema for the owner tool (OT05).
--
-- Target: MySQL 8.0.41, InnoDB, utf8mb4_unicode_ci.
-- Run only after the preflight in tools/context-migration-preflight.php passes.
--
-- Rerun behavior: every step is guarded with information_schema checks, so
-- running this file again is a no-op. Existing questions are not modified:
-- context_id, context_position, and context_slot are nullable additions.
--
-- Publication safety: linked questions stay is_active = 0. The context's
-- is_active flag is the publication switch for the new (OT06) delivery path;
-- the legacy candidate queries that select is_active = 1 therefore never
-- expose a linked question without its context.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_assert_context_migration_compatible`;

DELIMITER $$
CREATE PROCEDURE `cbt_assert_context_migration_compatible`()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND COLUMN_NAME = 'id'
        AND TABLE_NAME IN ('subjects','exam_category','questions')
        AND COLUMN_TYPE = 'int unsigned' AND IS_NULLABLE = 'NO'
        AND EXTRA = 'auto_increment') <> 3 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: a supplied base id column is incompatible.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'question_contexts')
     AND (EXISTS (SELECT 1 FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'question_contexts'
              AND (ENGINE <> 'InnoDB' OR TABLE_COLLATION <> 'utf8mb4_unicode_ci'))
       OR (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'question_contexts') <> 13
       OR (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'question_contexts' AND COLUMN_COMMENT = ''
             AND ((COLUMN_NAME = 'id' AND ORDINAL_POSITION = 1 AND COLUMN_TYPE = 'int unsigned' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = 'auto_increment' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'context_type' AND ORDINAL_POSITION = 2 AND COLUMN_TYPE = 'enum(''comprehension'',''cloze'')' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME = 'utf8mb4' AND COLLATION_NAME = 'utf8mb4_unicode_ci')
               OR (COLUMN_NAME = 'title' AND ORDINAL_POSITION = 3 AND COLUMN_TYPE = 'varchar(200)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME = 'utf8mb4' AND COLLATION_NAME = 'utf8mb4_unicode_ci')
               OR (COLUMN_NAME = 'context_text' AND ORDINAL_POSITION = 4 AND COLUMN_TYPE = 'mediumtext' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME = 'utf8mb4' AND COLLATION_NAME = 'utf8mb4_unicode_ci')
               OR (COLUMN_NAME IN ('subject_id','exam_category_id') AND ORDINAL_POSITION = FIELD(COLUMN_NAME,'subject_id','exam_category_id') + 4 AND COLUMN_TYPE = 'int unsigned' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME IN ('exam_year','expected_member_count') AND ORDINAL_POSITION = FIELD(COLUMN_NAME,'exam_year','expected_member_count') + 6 AND COLUMN_TYPE = 'smallint unsigned' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'is_active' AND ORDINAL_POSITION = 9 AND COLUMN_TYPE = 'tinyint(1)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = '0' AND EXTRA = '' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'created_at' AND ORDINAL_POSITION = 10 AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'CURRENT_TIMESTAMP' AND LOWER(EXTRA) = 'default_generated' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'updated_at' AND ORDINAL_POSITION = 11 AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'CURRENT_TIMESTAMP' AND LOWER(EXTRA) = 'default_generated on update current_timestamp' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'activated_at' AND ORDINAL_POSITION = 12 AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME IS NULL AND COLLATION_NAME IS NULL)
               OR (COLUMN_NAME = 'idempotency_token' AND ORDINAL_POSITION = 13 AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME = 'utf8mb4' AND COLLATION_NAME = 'utf8mb4_unicode_ci'))) <> 13) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: question_contexts has an unexpected column set or definition.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'questions'
        AND COLUMN_NAME IN ('context_id','context_position','context_slot')
        AND NOT (COLUMN_DEFAULT IS NULL AND EXTRA = '' AND CHARACTER_SET_NAME IS NULL
          AND COLLATION_NAME IS NULL AND COLUMN_COMMENT = ''
          AND ((COLUMN_NAME = 'context_id' AND ORDINAL_POSITION = 17 AND COLUMN_TYPE = 'int unsigned' AND IS_NULLABLE = 'YES')
            OR (COLUMN_NAME = 'context_position' AND ORDINAL_POSITION = 18 AND COLUMN_TYPE = 'smallint unsigned' AND IS_NULLABLE = 'YES')
            OR (COLUMN_NAME = 'context_slot' AND ORDINAL_POSITION = 19 AND COLUMN_TYPE = 'smallint unsigned' AND IS_NULLABLE = 'YES')))) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: an existing question context column is incompatible.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('subjects','exam_category','questions','question_contexts')
        AND CONSTRAINT_TYPE = 'CHECK') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: an unexpected CHECK constraint exists.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND INDEX_NAME = 'uq_questions_context_position')
     AND ((SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'uq_questions_context_position') <> 2
       OR (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'uq_questions_context_position' AND NON_UNIQUE = 0 AND INDEX_TYPE = 'BTREE'
              AND IS_VISIBLE = 'YES' AND COLLATION = 'A' AND SUB_PART IS NULL AND EXPRESSION IS NULL
             AND ((SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'context_id')
               OR (SEQ_IN_INDEX = 2 AND COLUMN_NAME = 'context_position'))) <> 2) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: uq_questions_context_position is incompatible.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND INDEX_NAME = 'uq_questions_context_slot')
     AND ((SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'uq_questions_context_slot') <> 2
       OR (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'uq_questions_context_slot' AND NON_UNIQUE = 0 AND INDEX_TYPE = 'BTREE'
              AND IS_VISIBLE = 'YES' AND COLLATION = 'A' AND SUB_PART IS NULL AND EXPRESSION IS NULL
             AND ((SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'context_id')
               OR (SEQ_IN_INDEX = 2 AND COLUMN_NAME = 'context_slot'))) <> 2) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: uq_questions_context_slot is incompatible.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND INDEX_NAME = 'idx_questions_context')
     AND ((SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'idx_questions_context') <> 1
       OR (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'questions'
             AND INDEX_NAME = 'idx_questions_context' AND NON_UNIQUE = 1 AND INDEX_TYPE = 'BTREE'
              AND IS_VISIBLE = 'YES' AND COLLATION = 'A' AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'context_id'
             AND SUB_PART IS NULL AND EXPRESSION IS NULL) <> 1) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: idx_questions_context is incompatible.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE() AND table_name = 'questions'
        AND CONSTRAINT_NAME = 'fk_questions_context')
     AND ((SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'questions'
             AND CONSTRAINT_NAME = 'fk_questions_context') <> 1
       OR (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE k
           INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS r
             ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
            AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
          WHERE k.CONSTRAINT_SCHEMA = DATABASE() AND k.TABLE_NAME = 'questions'
            AND k.CONSTRAINT_NAME = 'fk_questions_context' AND k.COLUMN_NAME = 'context_id'
             AND k.REFERENCED_TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME = 'question_contexts'
             AND k.REFERENCED_COLUMN_NAME = 'id' AND r.UPDATE_RULE = 'RESTRICT'
             AND r.DELETE_RULE = 'RESTRICT') <> 1) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: fk_questions_context is incompatible.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'question_contexts')
     AND ((SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'question_contexts') <> 7
       OR (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'question_contexts'
              AND SUB_PART IS NULL AND EXPRESSION IS NULL AND COLLATION = 'A' AND INDEX_TYPE = 'BTREE' AND IS_VISIBLE = 'YES'
            AND ((INDEX_NAME = 'PRIMARY' AND NON_UNIQUE = 0 AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'id')
              OR (INDEX_NAME = 'uq_context_idempotency_token' AND NON_UNIQUE = 0 AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'idempotency_token')
               OR (INDEX_NAME = 'idx_contexts_pool' AND NON_UNIQUE = 1 AND ((SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'subject_id') OR (SEQ_IN_INDEX = 2 AND COLUMN_NAME = 'exam_category_id') OR (SEQ_IN_INDEX = 3 AND COLUMN_NAME = 'exam_year')))
               OR (INDEX_NAME = 'idx_contexts_active' AND NON_UNIQUE = 1 AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'is_active')
               OR (INDEX_NAME = 'idx_contexts_exam_category_id' AND NON_UNIQUE = 1 AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'exam_category_id'))) <> 7) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: question_contexts has an unexpected index set or definition.';
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'questions')
     <> (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'questions'
           AND CONSTRAINT_NAME = 'fk_questions_context') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: questions has an unexpected foreign key set or definition.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'question_contexts')
     AND ((SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'question_contexts') <> 2
       OR (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'question_contexts'
             AND REFERENCED_TABLE_NAME IS NOT NULL) <> 2
       OR (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE k
          INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS r
             ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
            AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
          WHERE k.CONSTRAINT_SCHEMA = DATABASE() AND k.TABLE_NAME = 'question_contexts'
            AND k.REFERENCED_TABLE_SCHEMA = DATABASE() AND k.REFERENCED_COLUMN_NAME = 'id'
             AND r.UPDATE_RULE = 'RESTRICT' AND r.DELETE_RULE = 'RESTRICT'
             AND ((k.CONSTRAINT_NAME = 'fk_contexts_subject' AND k.COLUMN_NAME = 'subject_id' AND k.REFERENCED_TABLE_NAME = 'subjects')
               OR (k.CONSTRAINT_NAME = 'fk_contexts_exam_category' AND k.COLUMN_NAME = 'exam_category_id' AND k.REFERENCED_TABLE_NAME = 'exam_category'))) <> 2) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Context migration refused: question_contexts has an unexpected foreign key set or definition.';
  END IF;
END$$
DELIMITER ;

CALL `cbt_assert_context_migration_compatible`();
DROP PROCEDURE IF EXISTS `cbt_assert_context_migration_compatible`;

CREATE TABLE IF NOT EXISTS `question_contexts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `context_type` enum('comprehension','cloze') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `context_text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` int UNSIGNED NOT NULL,
  `exam_category_id` int UNSIGNED NOT NULL,
  `exam_year` smallint UNSIGNED NOT NULL,
  `expected_member_count` smallint UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activated_at` timestamp NULL DEFAULT NULL,
  `idempotency_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_context_idempotency_token` (`idempotency_token`),
  KEY `idx_contexts_pool` (`subject_id`,`exam_category_id`,`exam_year`),
  KEY `idx_contexts_active` (`is_active`),
  KEY `idx_contexts_exam_category_id` (`exam_category_id`),
  CONSTRAINT `fk_contexts_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_contexts_exam_category` FOREIGN KEY (`exam_category_id`) REFERENCES `exam_category` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS `cbt_apply_context_migration`;

DELIMITER $$
CREATE PROCEDURE `cbt_apply_context_migration`()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND column_name = 'context_id') = 0 THEN
    ALTER TABLE `questions` ADD COLUMN `context_id` int UNSIGNED NULL AFTER `practice_title`;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND column_name = 'context_position') = 0 THEN
    ALTER TABLE `questions` ADD COLUMN `context_position` smallint UNSIGNED NULL AFTER `context_id`;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'questions' AND column_name = 'context_slot') = 0 THEN
    ALTER TABLE `questions` ADD COLUMN `context_slot` smallint UNSIGNED NULL AFTER `context_position`;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions'
        AND index_name = 'uq_questions_context_position') = 0 THEN
    ALTER TABLE `questions` ADD UNIQUE KEY `uq_questions_context_position` (`context_id`,`context_position`);
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions'
        AND index_name = 'uq_questions_context_slot') = 0 THEN
    ALTER TABLE `questions` ADD UNIQUE KEY `uq_questions_context_slot` (`context_id`,`context_slot`);
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = 'questions'
        AND index_name = 'idx_questions_context') = 0 THEN
    ALTER TABLE `questions` ADD KEY `idx_questions_context` (`context_id`);
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = DATABASE() AND table_name = 'questions'
        AND constraint_name = 'fk_questions_context') = 0 THEN
    ALTER TABLE `questions` ADD CONSTRAINT `fk_questions_context` FOREIGN KEY (`context_id`) REFERENCES `question_contexts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
END$$
DELIMITER ;

CALL `cbt_apply_context_migration`();
DROP PROCEDURE IF EXISTS `cbt_apply_context_migration`;
