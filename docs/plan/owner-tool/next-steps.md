# Owner Tool Next Steps

Recorded: 2026-11-02.

## Confirmed Starting Point

- [x] OT04 implementation and rigorous re-review are complete on `ot04-fix` at
  `f3dd42a`.
- [x] Application target is PHP 8.3.
- [x] Database version is MySQL 8.0.41.
- [x] Tables use InnoDB and `utf8mb4_unicode_ci`.
- [x] The developer confirmed that `exam_category2` in the supplied export must
  be replaced with `exam_category`.
- [x] The phpMyAdmin PHP 8.4.27 export header is not the website PHP runtime.
- [x] PHP/staging/Brave verification is deferred to OT10.

## Immediate Phase Boundary

- [x] Rigorous OT04 review and re-review passed; records are under
  `docs/plan/reviews/owner-tool-2026-11-phase-5*.md`.
- [x] Merge `ot04-fix` into
  `owner-tool-integration` using the normal non-destructive Git workflow
  (fast-forward `83de4bc`..`ad84269`, 2026-11-02).
- [x] Do not start OT05 before that merge is complete.

## OT05 Database Preparation

- [ ] Archive the supplied `questions.sql`, `subjects.sql`, and
  `exam_category.sql` unchanged with hashes.
- [ ] Keep the original `exam_category.sql` as evidence. Create a separate
  working DDL copy that replaces every `exam_category2` identifier with
  `exam_category`.
- [ ] Verify the corrected DDL contains no remaining `exam_category2` reference.
- [ ] Never import the supplied exports directly into production.
- [ ] Build a disposable database from the corrected schema before testing any
  migration.
- [ ] Use these safe runtime assumptions unless direct evidence overrides them:
  PHP 8.3, MySQL 8.0.41, InnoDB, `utf8mb4`, PDO exceptions.
- [ ] Make migration preflight report the actual session SQL mode, connection
  charset, collation, and table definitions instead of asking for credentials.
- [ ] Record the existing mismatch: `questions.practice_title` is `NOT NULL`
  without a default, while the supplied admin INSERT omits it. Do not change it
  until the practice writer/importer contract is known.

## OT05 Context Schema And Admin

- [ ] Choose the least-invasive normalized design after loading the disposable
  schema: context columns on `questions`, or a separate membership table.
- [ ] Add `question_contexts` with subject/category/year pool metadata, expected
  member count, type, title, text, activation state, and timestamps.
- [ ] Add ordered question membership and optional cloze slot with uniqueness
  and restrictive deletion rules.
- [ ] Keep linked questions inactive until their complete context validates.
- [ ] Write migration preflight, forward migration, rerun behavior, backup
  instructions, and non-destructive rollback.
- [ ] Add native CSRF/PRG context create, edit, link, deactivate, activate, and
  restricted-delete actions.
- [ ] Run PHP lint, renderer vectors, and migration tests on a disposable
  PHP 8.3/MySQL 8.0.41 environment before marking OT05 done.

## OT06 And Later Inputs

- [ ] Obtain the real practice-question writer/importer, or a written statement
  explaining how `practice_title` is populated if no writer exists.
- [ ] Obtain a production-wide filename/search list for every reader and writer
  of `questions` and `practice_title`.
- [ ] Implement complete-group candidate delivery in OT06 only after OT05.
- [ ] Implement the manual owner context workflow in OT07 only after OT06.
- [ ] Obtain source-backed answer keys for comprehension Q11-Q15 and cloze
  Q71-Q80 before final OT08/OT09 acceptance.

## OT10 Deferred Verification

- [ ] Acquire an isolated staging environment when available. It must not use
  the production database or production media storage.
- [ ] Run `php -l` on every changed PHP file with PHP 8.3.
- [ ] Run `php tests/php-render.php`.
- [ ] Prove migration preflight, forward, rerun, and rollback on disposable
  production-shaped data.
- [ ] Run Chromium and Brave/Android checks for Add, Edit, native save, CBT,
  practice CBT, result, print, and answer-details rendering.
- [ ] Complete the deployment manifest, final rigorous review, and cycle close.

## Do Not Request Again

- [x] Do not request the full credential-bearing `cbt_db.php`.
- [x] Do not request another PHP version clarification.
- [x] Do not request another `exam_category` export solely because the supplied
  file says `exam_category2`; the developer supplied the correction rule.
