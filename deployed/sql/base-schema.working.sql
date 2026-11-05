-- Working disposable-database schema for the owner-tool context migration.
--
-- Source: the exact DDL supplied in main commit 002483b and archived unchanged
-- under archive/sql/2026-11-03-supplied/.
--
-- The only correction is the settled rename of the supplied category identifier
-- to exam_category.
-- Do not import the archived exports directly into production. Use this file
-- only to build a disposable, production-shaped database for OT10.
--
-- Target runtime facts: PHP 8.3 application target, MySQL 8.0.41, InnoDB,
-- utf8mb4, utf8mb4_unicode_ci. The phpMyAdmin PHP 8.4.27 export header is not
-- the website runtime.

SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `subjects`
-- --------------------------------------------------------

CREATE TABLE `subjects` (
  `id` int UNSIGNED NOT NULL,
  `subject_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subjects_subject_name` (`subject_name`);

ALTER TABLE `subjects`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Table structure for table `exam_category`
-- Corrected from the supplied category identifier.
-- --------------------------------------------------------

CREATE TABLE `exam_category` (
  `id` int UNSIGNED NOT NULL,
  `category_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `exam_category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_exam_category_category_name` (`category_name`);

ALTER TABLE `exam_category`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Table structure for table `questions`
-- practice_title is intentionally NOT NULL without a default, matching the
-- supplied export. The practice writer/importer contract is still unknown; do
-- not change this column in OT05.
-- --------------------------------------------------------

CREATE TABLE `questions` (
  `id` int UNSIGNED NOT NULL,
  `subject_id` int UNSIGNED NOT NULL,
  `exam_category_id` int UNSIGNED NOT NULL,
  `exam_year` smallint UNSIGNED NOT NULL DEFAULT '2026',
  `question_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_image_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_a` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_b` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_c` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_d` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_option` tinyint UNSIGNED NOT NULL COMMENT '0=A, 1=B, 2=C, 3=D',
  `answer_explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `answer_video_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `practice_title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_questions_subject_id` (`subject_id`),
  ADD KEY `idx_questions_exam_category_id` (`exam_category_id`),
  ADD KEY `idx_questions_active` (`is_active`);

ALTER TABLE `questions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;
