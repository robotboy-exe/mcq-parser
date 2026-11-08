# Owner Tool Next Steps

Recorded: 2026-11-02. Reconciled: 2026-11-03. Updated: 2026-11-08.

## Confirmed Starting Point

- [x] OT04 implementation and rigorous re-review are complete on `ot04-fix` at
  `f3dd42a`.
- [x] `ot04-fix` is merged into `owner-tool-integration` using the normal
  non-destructive Git workflow (fast-forward `83de4bc`..`ad84269`, 2026-11-02;
  later integration commits are `f5566d7` and `405439b`; the 2026-11-03 docs
  reconciliation follows).
- [x] Application target is PHP 8.3.
- [x] Database version is MySQL 8.0.41.
- [x] Tables use InnoDB and `utf8mb4_unicode_ci`.
- [x] Root `db_conn.php` supplies the connection contract (`utf8mb4`, PDO
  exceptions, associative fetches, native prepares). The full credential-bearing
  `cbt_db.php` is not required.
- [x] The developer confirmed that `exam_category2` in the supplied export must
  be replaced with `exam_category`. Keep the original export as evidence and
  apply the correction only to the working DDL copy.
- [x] The phpMyAdmin PHP 8.4.27 export header is not the website PHP runtime.
- [x] PHP/staging/Brave verification is deferred to OT10.
- [x] `owner-tool-integration` is the authoritative work branch. `main` is the
  published baseline, not the current work branch.
- [x] The exact SQL DDL bytes were supplied in `main` commit `002483b` and copied
  to `owner-tool-integration` on 2026-11-03.

## Immediate Phase Boundary

- [x] Rigorous OT04 review and re-review passed; records are under
  `docs/plan/reviews/owner-tool-2026-11-phase-5*.md`.
- [x] Merge `ot04-fix` into `owner-tool-integration`.
- [x] Do not start OT05 before that merge is complete.
- [x] OT05 implementation, OT05-EXT-01, and accepted Phase 6 fixes are complete
  in the working tree; all handoffs are recorded in `ot-05-context-schema-and-admin.md`.
- [x] The first Phase 6 re-review closed `BLOCK-1`, `BLOCK-2`, `BLOCK-4`,
  `BLOCK-5`, and `FIX-1` through `FIX-5`; it opened `BLOCK-6`, `BLOCK-7`, and
  `FIX-6` while leaving `BLOCK-3` open.
- [x] Apply the accepted `BLOCK-3`, `BLOCK-6`, `BLOCK-7`, and `FIX-6` fixes.
- [x] The second Phase 6 re-review closed `BLOCK-7` and `FIX-6` but left
  `BLOCK-3` and `BLOCK-6` open.
- [x] Apply the focused `BLOCK-3` and `BLOCK-6` fixes with failing evidence first.
- [x] Complete the third Phase 6 re-review without overwriting prior records.
- [x] Apply the frozen finding lifecycle correction: close `BLOCK-3` and
  `BLOCK-6` against their accepted direction/CHECK and post-`ALTER` relock
  vectors; assign the new partition defect to `BLOCK-8` and reconnect hardening
  outside the mandatory write-freeze precondition to `NOTE-4`.
- [x] Record the owner's 2026-11-05 `reject` disposition for `BLOCK-8`.
  Authoritative `questions.sql` and the older corroborating `questions1.sql`
  export are unpartitioned; the supported admin form performs row writes, while
  partitioning requires an out-of-contract schema change. The immutable review
  retains the technical risk for a manually altered target. At disposition time,
  Phase 6 was review-settled and commit-ready but not yet committed.
- [x] Remove `cbt_practice.php` and `practice_title` from the remaining cycle
  scope. Preserve existing behavior unchanged; OT06 targets `cbt.php` only.
- [x] Authorize the 2026-11-05 Phase 6 boundary commit.
- [x] Audit every available main-question reader and writer. The 2026-11-05
  inventory covers all seven `cbt.php` question reads and the current atomic
  insert/update/delete helper; OT06 is ready for Gate 1.

## OT05 Database Preparation

- [x] Obtain the exact supplied DDL bytes for `questions`, `subjects`, and
  `exam_category` and place them in the workspace. `questions.sql`,
  `subjects.sql`, and `exam_category.sql` are now at the repository root.
- [x] Archive the supplied DDL files unchanged with hashes under
  `archive/sql/2026-11-03-supplied/`.
- [x] Keep the original `exam_category` export as evidence. The working copy
  `deployed/sql/base-schema.working.sql` replaces every `exam_category2`
  identifier with `exam_category`.
- [x] Verify the corrected DDL contains no remaining `exam_category2` reference.
- [x] Never import the supplied exports directly into production.
- [x] Write the disposable-database build and migration steps in
  `deployed/sql/README.md`; OT10 executes them before any migration test.
- [x] Use these confirmed runtime facts, not assumptions: PHP 8.3, MySQL 8.0.41,
  InnoDB, `utf8mb4`, PDO exceptions.
- [x] Make migration preflight report the actual session SQL mode, connection
  charset, collation, exact table/index/FK definitions and name sets, index
  directions, and unexpected checks instead of asking for credentials. OT10
  executes the preflight.
- [x] Preserve the supplied root/archive SQL as raw Git blobs with path-specific
  non-text attributes.
- [x] Record the existing mismatch: `questions.practice_title` is `NOT NULL`
  without a default, while the supplied admin INSERT omits it. Preserve it as an
  out-of-scope legacy field; do not change it or make it an OT06 gate.

## OT05 Context Schema And Admin

- [x] Choose the least-invasive normalized design: a separate
  `question_contexts` table plus ordered membership columns on `questions`.
- [x] Add `question_contexts` with subject/category/year pool metadata, expected
  member count, type, title, text, activation state, and timestamps.
- [x] Add ordered question membership and optional cloze slot with uniqueness
  and restrictive deletion rules.
- [x] Keep linked questions inactive until their complete context validates.
- [x] Write migration preflight, forward migration, rerun behavior, backup
  instructions, and a non-destructive rollback requiring a maintenance/write
  freeze plus a second context-table lock after `ALTER TABLE` releases the first
  lock set.
- [x] Add native CSRF/PRG context create, edit, link, deactivate, activate, and
  restricted-delete actions.
- [x] Add `tests/context-migration.js` and `tests/context-lib.php`; OT10 runs PHP
  lint, renderer vectors, and migration tests on the target runtime. Do not make
  those runtime checks OT05 completion gates.
- [x] Externalize context actions, data preparation, question-context fields, and
  context-management markup; keep the admin entry point at 100 or fewer OT05
  additions and add executable dispatch/transaction/render evidence.

## OT05 Completion Evidence

- `deployed/sql/base-schema.working.sql`, `01-context-migration.sql`,
  `02-context-rollback.sql`, and `README.md`.
- Focused context input/activation validation, context action/data/view includes,
  real `deployed/admin_question_mutations.php` transactions, and narrow wiring in
  `deployed/admin_questions.php`.
- Exact preflight contract/inspector modules and narrow CLI wrapper under `tools/`.
- `tests/context-migration.js` 13 PASS, `tests/context-lib.php` 13 PASS,
  `tests/context-admin.php` 19 PASS, and `tests/context-preflight.php` 6 PASS.
- Full local checks: 47 runner PASS + 2 PENDING, 145 unit PASS, 38 owner-tool
  PASS, 9 PHP renderer PASS, and PHP lint PASS.
- Package status is `done`; the third Phase 6 re-review and `BLOCK-8` rejection
  disposition are complete. Phase 6 is review-settled and included in the
  authorized 2026-11-05 boundary commit.

## OT06 And Later Inputs

- [x] Record the available-source filename/search inventory for the main
  `cbt.php` read path and every current writer that can mutate linked
  `questions` rows in `ot-06-reader-writer-audit.md`.
- [ ] At OT10, verify the deployment manifest installs the current context-aware
  admin writer and exposes no archived or alternate question writer.
- [x] Implement complete-group candidate delivery in OT06; light review passed
  at OT07 Gate 1.
- [x] Implement the manual owner context workflow in OT07; local acceptance
  passes and the rigorous Release B review returned PASS WITH ACCEPTED
  FINDINGS (`FIX-1` handoff hash/byte accuracy; `NOTE-1` docs).
- [x] Apply the authorized OT07 `FIX-1` correction and complete its
  closure-focused re-review (2026-11-06); `FIX-1` is closed and phase 8 is
  review-settled.
- [x] Implement OT08 comprehension OCR: parser 2.2.0 detects and bounds
  passages, parses one complete `(a)`-`(d)` set per linked question, and fills
  editable OT07 draft cards with zero automatic posts (2026-11-06). Its light
  review passed at OT09 Gate 1.
- [x] Implement OT09 cloze OCR: parser 2.3.2 recognizes the evidenced numbered
  gap passage and A-D table, emits one shared cloze context with `[[gap:N]]`
  tokens, and synthesizes ten editable linked questions with slots in the same
  zero-post draft workflow (2026-11-06).
- [x] Apply the owner-authorized OT09 `fix` for `BLOCK-1` and `FIX-1` under the
  frozen closure contracts in
  [`../reviews/owner-tool-2026-11-phase-10.md`](../reviews/owner-tool-2026-11-phase-10.md)
  (2026-11-07): `cloze.js` is 242 lines and a colliding cloze group is refused
  with a warning (parser 2.3.1). The re-review closed both findings.
- [x] Fix `FIX-2` under the owner's 2026-11-07 requirement change: keep the
  first evidenced cloze group and drop every later colliding group as a whole
  with a warning naming the shared gap numbers (recorded in
  [`ot-09-cloze-ocr.md`](ot-09-cloze-ocr.md)); the finding was recorded in its
  first review round by
  [`../reviews/owner-tool-2026-11-phase-10-re-review.md`](../reviews/owner-tool-2026-11-phase-10-re-review.md).
  The 2026-11-07 fix dedupes cloze contexts in `parsePaste` (parser 2.3.2), and
  the closure-focused second re-review returned `PASS` and closed `FIX-2` on
  2026-11-08; phase 10 is review-settled and included in the 2026-11-08 boundary
  commit.
- [ ] Confirm final OT08 coverage. The owner supplied same-paste keys in
  `sample-passages.txt` on 2026-11-08: comprehension Q13-Q15 and cloze Q71-Q80.
  The cloze key is complete; comprehension Q11-Q12 are still missing. Both
  same-paste mechanics are also proven synthetically.

## OT10 Deferred Verification

- [ ] Acquire an isolated staging environment when available. It must not use
  the production database or production media storage.
- [ ] Run `php -l` on every changed PHP file with PHP 8.3.
- [ ] Run `php tests/php-render.php`.
- [ ] Prove migration preflight, forward, rerun, and rollback on disposable
  production-shaped data.
- [ ] Run Chromium and Brave/Android checks for Add, Edit, native save, main CBT,
  result, print, and answer-details rendering.
- [ ] Complete the deployment manifest, final rigorous review, and cycle close.
- [x] OT10 is the sole owner of runtime/staging verification. No OT05 completion
  gate may require these checks.

## Do Not Request Again

- [x] Do not request the full credential-bearing `cbt_db.php`; `db_conn.php`
  supplies the connection contract.
- [x] Do not request another PHP version clarification.
- [x] Do not request another MySQL, InnoDB, or charset confirmation; settled.
- [x] Do not request another `exam_category` export solely because the supplied
  file says `exam_category2`; the developer supplied the correction rule.
- [x] Do not re-request the three `.sql` files; they are supplied and present on
  the working branch.
