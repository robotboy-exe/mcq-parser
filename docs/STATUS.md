# Current Status

Last updated: 2026-11-05.

## Active cycle

- Cycle: `owner-tool-2026-11`
- Active map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md)
- Coordinator: [`plan/README.md`](plan/README.md)
- Intent: [`../INTENT.md`](../INTENT.md)
- Last review-settled package: OT05, Context Schema and Admin, including the accepted
  Phase 6 repairs. The third re-review is complete. Its repaired direction/CHECK
  and post-`ALTER` relock vectors close `BLOCK-3` and `BLOCK-6` under the frozen
  lifecycle. On 2026-11-05 the owner rejected `BLOCK-8`: authoritative
  `questions.sql` and the corroborating `questions1.sql` export are
  unpartitioned, and partitioning requires an out-of-contract schema change
  rather than a supported admin-form write. Reconnect after failure of the
  mandatory write freeze remains non-blocking `NOTE-4`.
- Phase 6 is review-settled and included in the 2026-11-05 boundary commit.
  OT06's OT05 dependency is satisfied. The owner removed `cbt_practice.php` and
  `practice_title` from the remaining cycle scope. The available-source
  reader/writer audit passed on 2026-11-05. OT06 passed its light review at OT07
  Gate 1. OT07 is implemented on the branch and awaits the rigorous
  Release B review. Target-runtime migration/preflight/rollback execution and
  browser/admin PRG checks remain deferred to OT10.
- Product implementation: parser 2.1.0, exact underline rendering, multiline
  stems, Add/Edit formatting, native PRG preservation, shared-context
  schema/admin/candidate delivery, and the manual owner context workflow are in
  place.
- Working branch: `owner-tool-integration`; `main` is the published baseline.
  See [`plan/README.md`](plan/README.md#branch-strategy).

## Confirmed facts (not gates)

- Application target: PHP 8.3.
- Database: MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`.
- Connection contract: root `db_conn.php` supplies the PDO connection
  (charset `utf8mb4`, exception mode, associative fetches, native prepares). The
  full credential-bearing `cbt_db.php` is no longer required.
- The phpMyAdmin PHP 8.4.27 export header describes the exporter, not the website
  runtime.
- The supplied export's `exam_category2` identifier is corrected to
  `exam_category` when building the working DDL copy; the original export remains
  evidence.
- Runtime/staging verification (PHP lint, renderer vectors, migration execution,
  Chromium, Brave/Android) belongs to OT10, not OT05.

## Known baselines

| Line | Evidence | Status |
|---|---|---|
| `main` at `002483b` (parser baseline measured at `58af90e`; `002483b` adds supplied SQL/PHP files only) | `node tests/runner.js` and `node tools/extract-bank.js --check` on 2026-11-03 | 47 PASS, 0 FAIL, 2 PENDING runner; 5 bank slices OK. This line has no `tests/unit.js` or `tests/owner-tool.js`. |
| clean experiments commit `d5a62f0` | recorded `node tests/runner.js` and `tests/unit.js` | 43 PASS runner, 140 PASS unit |
| `owner-tool-integration` code baseline at `405439b` (OT04 merged; docs-only commits follow) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, and `node tools/extract-bank.js --check` on 2026-11-03 | 47 PASS, 0 FAIL, 2 PENDING runner; 145 unit; 38 owner-tool; 7 bank slices OK |
| OT05 working tree after the focused `BLOCK-3`/`BLOCK-6` fix (uncommitted, exact package base `cd2e6c9`) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `php tests/context-lib.php`, `php tests/context-admin.php`, `php tests/context-preflight.php`, `php tests/php-render.php`, and `php -l` on 2026-11-04 | 47 PASS, 0 FAIL, 2 PENDING runner; 145 unit; 38 owner-tool; 13 context-migration; 13 context-lib; 19 context-admin; 6 context-preflight; 9 PHP renderer; PHP lint PASS |
| OT06 implementation snapshot (base `8f1d7e5`) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `php tests/context-lib.php`, `php tests/context-admin.php`, `php tests/context-preflight.php`, `php tests/php-render.php`, `php tests/cbt-candidate.php`, `node tests/cbt-context.js`, isolated Chromium/CDP, and `php -l` on 2026-11-05 | 47 PASS, 0 FAIL, 2 PENDING runner; 145 unit; 38 owner-tool; 13 context-migration; 13 context-lib; 19 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; 4 cbt-context; browser PASS; PHP lint PASS |
| OT07 implementation snapshot (base `8f1d7e5`) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `node tests/cbt-context.js`, `php tests/context-lib.php`, `php tests/context-admin.php`, `php tests/context-preflight.php`, `php tests/php-render.php`, `php tests/cbt-candidate.php`, and `php -l deployed/admin_questions.php` on 2026-11-05 | 47 PASS, 0 FAIL, 2 PENDING runner; 145 unit; 47 owner-tool; 13 context-migration; 4 cbt-context; 13 context-lib; 19 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; PHP lint PASS |
| dirty experiments worktree after `d5a62f0` | read-only review | BLOCK; P20-P22 must remain uncommitted and excluded |

The dirty experiments review found parser data loss and image-plan/Auto-Save
defects despite its green 46/155 suites. The owner selected the clean
`d5a62f0` baseline and a manual-review replacement tool, so those dirty changes
are shelved rather than repaired in this cycle.

## Supplied evidence

- `deployed/admin_questions.php` (OT03 replaced the helper include here)
- `deployed/cbt.php`
- `deployed/cbt_practice.php` (retained OT04 evidence; no remaining cycle work)
- `db_conn.php` (PDO connection contract; added in commit `405439b`)
- `questions.sql`, `subjects.sql`, `exam_category.sql` (exact DDL supplied in
  `main` commit `002483b`; copied to `owner-tool-integration` 2026-11-03)
- `questions1.sql` (older corroborating `questions1` export with the same column,
  index, engine, and collation shape as `questions.sql`; also unpartitioned;
  `questions.sql` remains authoritative)
- `admin-needs.txt`
- `sample-underline.txt`
- `sample-passages.txt`
- `ocr_helper.js` (current production helper, archived by OT03)
- `answer_details.php` (archived byte-identically on 2026-11-02 and integrated)
- Runtime baseline: PHP 8.3 application target and MySQL 8.0.41. The PHP 8.4.27
  schema-export header describes phpMyAdmin's runtime, not the website runtime.

OT01/OT04/OT05 recorded archival hashes and provenance; `deployed/` is the
working copy. The Phase 6 fixes add focused input/activation validation and real
question-mutation modules, keep `deployed/admin_questions.php` as narrow wiring,
split exact preflight contract/inspection from its CLI wrapper, reject extra
schema objects, descending index parts, and unexpected checks, and reacquire the
context-table lock after rollback's `ALTER TABLE` boundary. Local PHP 8.3.16
checks pass; target-runtime execution is still deferred to OT10.

The supplied SQL exports are archived unchanged at
`archive/sql/2026-11-03-supplied/` with hashes. `exam_category.sql` still uses
`exam_category2` in its `CREATE TABLE` and `ALTER TABLE` statements; the original
file remains unchanged, and only `deployed/sql/base-schema.working.sql` applies
the settled rename.

Supplied DDL SHA-256:

- `questions.sql` `e12e4d9fcb2a15b13bd2fff6885ca8c286006b80e58cfa62c91b434fc4c8834e`
- `subjects.sql` `bd0e1a11c0371ddb1fd0252ebc55bcb949c605a858a33e59c917bfddc10449af`
- `exam_category.sql` `05720e31e2365cfe2500222e9f615962e769ff06466eeeaf1512e605c4357cb1`

## External gates

| Artifact | Required by | Reason |
|---|---|---|
| Main-question reader/writer inventory | OT06 | Satisfied 2026-11-05; see [`plan/owner-tool/ot-06-reader-writer-audit.md`](plan/owner-tool/ot-06-reader-writer-audit.md) |
| Representative context paste with answer key | OT08/OT09 final acceptance | Prove the one-box key workflow on the new families |

OT05 implementation, accepted fixes, third re-review, and `BLOCK-8` owner
disposition are complete. The owner rejected `BLOCK-8` for the authoritative,
unpartitioned target contract; the unsupported out-of-band partition case
remains visible in immutable review evidence. OT05 has no remaining external
gate and Phase 6 is included in the authorized 2026-11-05 boundary commit. The
exact DDL was supplied in `main` commit `002483b` and copied to
`owner-tool-integration` on 2026-11-03.

These were **not** OT05 gates: a redacted or full `cbt_db.php` (the connection
contract is supplied by `db_conn.php`), another PHP/database/engine/charset
confirmation (settled above), or another `exam_category` export for the
`exam_category2` naming question (correction rule settled).

The OT06 audit accounts for every direct `questions` SQL site in the available
production source. OT10 must still verify the deployment manifest contains the
current context-aware admin writer and no alternate legacy writer. OT06
suppresses the dead `answer_details.php` link for inactive linked members and
passed its light review at OT07 Gate 1. OT07 now supplies the manual context
card/native-form workflow and awaits the rigorous Release B review.

`header.php`, `footer.php`, and `cbt_exam_attempts` are not requested up front.
The supplied detail page is part of OT04; OT10 repeats Release A acceptance
instead of performing first-time integration.

## Deferred to OT10

OT05 wrote the migration, preflight, and rollback artifacts, and the local
static/helper checks pass. OT10 executes and proves them on the target runtime.
OT10 also owns:

- `php -l` on every changed/new PHP file;
- `php tests/php-render.php`;
- migration preflight, forward, rerun, and rollback on a disposable
  production-shaped database;
- desktop Chromium and Brave/Android staging checks; and
- the deployment manifest and final human-developer handoff.

These checks are not OT05 completion gates.

## Delivery stages

- Release A: OT03-OT04 implement the owner-tool replacement, underline/multiline,
  and detail-page formatting; OT10 independently verifies the release.
- Release B: OT05-OT07, manual shared-context persistence and delivery in
  `cbt.php`; `cbt_practice.php` and `practice_title` are excluded.
- Release C: OT08-OT09, comprehension and cloze OCR automation.
- OT10 performs final release verification, target-PHP checks, Brave/Android
  staging smoke, and human-developer handoff.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state, review cadence, and branch strategy: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/owner-tool/`
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
