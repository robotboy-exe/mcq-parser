# Current Status

Last updated: 2026-11-15.

## Active cycle

- Cycle: `math-editor-2026-11` (created 2026-11-14). Phase 1 is ST01, the
  Constant Text reset: return production to root `ocr_helper.js`, archive the
  shared-text/context subsystem, add optional `questions.constant_text`, and add
  exact lowercase `<u>` underlining.
- Map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md) — ST01, ME01,
  ME02. Statuses live in [`plan/README.md`](plan/README.md).
- Packages: [`ST01`](plan/owner-tool/st-01-constant-text-reset.md) (done and
  review-settled; the third phase-1 re-review closed D-91 `FIX-1`, `FIX-2`
  remains closed, and all 11 helper checks pass),
  [`ME01`](plan/math-editor/me-01-math-palette.md) (not started),
  [`ME02`](plan/math-editor/me-02-release-and-handoff.md) (not started).
- Ordering: ST01 replaced OT12 because running the context migration was judged
  riskier and more complex than one optional passage per question. The owner
  chose the reset on 2026-11-14.
- Branch: `owner-tool-integration`; `main` is the published baseline.
- Owner decisions settled 2026-11-14: keep exact lowercase `<u>` only; archive
  the context/owner-tool files; keep `src/owner-tool/render.js` at its current
  path; put helper fixtures under `tests/fixtures/`; no live schema drop.
- Owner disposition 2026-11-15: `change requirement` for phase-1 `FIX-1`.
  Rationale: A-D OCR labels must work case-insensitively both with and without
  whitespace after `(`, before `)`, and before `.`, while a later label-like
  repeat of an already selected letter remains option text. The replacement fix
  passed the independent third re-review; ST01 is settled and the ME01 review
  dependency is satisfied.
- Planning constraint: after ST01, the measured live-origin diffs are
  `admin_questions.php` +87/−80, `cbt.php` +49/−8, `answer_details.php` +8/−3,
  and `ocr_helper.js` +57/−20 — all within the 100-addition externalize-first
  cap. No cap exception remains.
- Last review-settled package: ST01 (`PASS`, third closure-focused re-review,
  2026-11-15). Archived cycle close `45807ea`, archive commit `134305c`.
- Archived cycle: [`plan/prompts/cycles/owner-tool-2026-11.md`](plan/prompts/cycles/owner-tool-2026-11.md);
  summary in [`plan/history.md`](plan/history.md).

## Confirmed facts (not gates)

- Application target: PHP 8.3.
- Database: MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`.
- Local Laragon binaries: PHP 8.3.16 at
  `C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe` and MySQL 8.0.41 at
  `C:\laragon\bin\mysql\mysql-8.0.41-winx64\bin\mysql.exe` (not on PATH). Both
  were executed for OT10; the PHP 8.3 and MySQL 8.0.41 targets are satisfied.
- Connection collation finding: on MySQL 8.0.41, PDO `charset=utf8mb4` alone
  reports `utf8mb4_general_ci`, while the preflight requires
  `utf8mb4_unicode_ci`. The target connector/server must set the session
  collation. This is a deployment prerequisite, not a schema change.
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
| OT08 implementation snapshot (base `224957e`, uncommitted) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `node tests/cbt-context.js`, and `node tools/extract-bank.js --check` on 2026-11-06 | 52 PASS, 0 FAIL, 1 PENDING runner (cloze); 151 unit; 51 owner-tool; 13 context-migration; 4 cbt-context; 7 bank slices OK; PHP absent |
| OT09 implementation snapshot (same tree, uncommitted) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `node tests/cbt-context.js`, and `node tools/extract-bank.js --check` on 2026-11-06 | 59 PASS, 0 FAIL, 0 PENDING runner; 158 unit; 53 owner-tool; 13 context-migration; 4 cbt-context; 7 bank slices OK; PHP absent |
| OT09 `BLOCK-1`/`FIX-1` fix snapshot (same tree, uncommitted, parser 2.3.1) | the same six commands plus `node --check` on the changed JS and `wc -l src/parser/cloze.js` on 2026-11-07 | 59 PASS, 0 FAIL, 0 PENDING runner; 160 unit; 53 owner-tool; 13 context-migration; 4 cbt-context; 7 bank slices OK; cloze.js 242 lines; PHP absent |
| OT09 `FIX-2` fix and second re-review (phase 10 boundary, committed 2026-11-08, parser 2.3.2) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `tests/cbt-context.js`, `node tools/cloze-probe.js`, `node tools/extract-bank.js --check`, and `node --check` on 2026-11-07; independent re-review reproduced them on 2026-11-08 | 59 PASS, 0 FAIL, 0 PENDING runner; 162 unit; 53 owner-tool; 13 context-migration; 4 cbt-context; cloze probe exit 0; all 7 source/slice/extracted bank hashes match (the CLI still reports the known Windows/CRLF on-disk fixture mismatch); cloze.js 242 lines; PHP not executed |
| OT09A production consolidation (phase 10A boundary, committed 2026-11-08, base `652c891`, parser 2.3.2) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `tests/cbt-context.js`, `node tools/cloze-probe.js`, `php tests/context-lib.php`, `tests/context-admin.php`, `tests/context-preflight.php`, `tests/php-render.php`, `tests/cbt-candidate.php`, `php -l`, and `node --check` on 2026-11-08 | 59 PASS, 0 FAIL, 0 PENDING runner; 162 unit; 53 owner-tool; 14 context-migration; 5 cbt-context; 13 context-lib; 19 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; PHP/JS syntax PASS; 12 production files plus 2 ops; live-origin additions +95/+53/+20/+2; known Windows/CRLF `extract-bank` pre-2026 mismatch remains; `FIX-1` docs-only evidence closed by re-review 2026-11-08 |
| OT10 local execution (2026-11-08, base `79a6a57`) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, `tests/context-migration.js`, `tests/cbt-context.js`, `node tools/cloze-probe.js`, `php tests/context-lib.php`, `tests/context-admin.php`, `tests/context-preflight.php`, `tests/php-render.php`, `tests/cbt-candidate.php`, `php -l`, `node --check`, MySQL 8.0.41 migration/rollback probes, and a desktop Chromium 155 local harness on 2026-11-08 | 59 PASS, 0 FAIL, 0 PENDING runner; 162 unit; 53 owner-tool; 14 context-migration; 5 cbt-context; 13 context-lib; 19 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; PHP/JS syntax PASS; migration preflight/forward/rerun/rollback and adversarial probes PASS; desktop Chromium 33/33 PASS; initial Brave/Android check passed 2026-11-09; final OT11 re-check accepted 2026-11-13 |
| OT10 finish (2026-11-14, `f84518e`; docs-only refresh) | all Node suites, all PHP suites, `php -l` on 17 files, `node --check` on 25 JS files, `extract-bank --check`, `cloze-probe`, and the `sample-passages.txt` key probe | 60 PASS, 0 FAIL, 0 PENDING runner; 163 unit; 81 owner-tool; 14 context-migration; 5 cbt-context; 14 context-lib; 23 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; PHP 8.3.32 lint 17/17 PASS; JS syntax 25/25 PASS; bank extractor 7 hashes OK; key `Q11 B, Q12 C, Q13 D, Q14 B, Q15 A` with a 5-member comprehension and a 10-member cloze context; migration/rollback and browser checks not re-run in this docs session |
| OT11 owner-accepted checkpoint (2026-11-13) | full Node/PHP suite, syntax/lint, bank extractor, exact `new-sample.txt` cloze probe, and focused owner-flow probes | 60 PASS, 0 FAIL, 0 PENDING runner; 163 unit; 81 owner-tool; 14 context-migration; 5 cbt-context; 14 context-lib; 23 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; cloze probe and 7 bank hashes PASS; PHP/JS syntax PASS; draft-only paste filling, saved-edit reachability/adoption, and distinct draft/edit mode regressions PASS; live-origin additions remain at +100/+53; final owner phone confirmation accepted; independent rigorous review pending at checkpoint (settled 2026-11-13: PASS, FIX-1..FIX-3 closed) |
| Math-editor cycle start (2026-11-14, `134305c`) | full Node/PHP suite re-run at `f84518e` before the archive; no product byte changed since | 60 runner, 163 unit, 81 owner-tool, 14 context-migration, 5 cbt-context; PHP 8.3.32 suites and 17-file lint PASS; baseline for ME01 |
| ST01 implementation (2026-11-14, `WIP pending st01 review` checkpoint) | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `php tests/admin-question-store.php`, `php tests/php-render.php`, `node tools/extract-bank.js --check`, `php -l`, and disposable Chromium | 60 PASS, 0 FAIL, 0 PENDING runner; 163 unit; 7 helper checks; 9 underline vectors; 4 preview vectors; 8 admin-store checks; 9 PHP renderer vectors; bank extractor and PHP lint PASS; civic fixture 50/50 with no missing-option flags; SQLite staging lifecycle PASS; 390px preview and OCR/Constant-Text isolation PASS; live-origin diffs +87/−80, +49/−8, +8/−3, +38/−18; no live write |
| ST01 first fix and second re-review (2026-11-15, `84be892`) | immutable `math-editor-2026-11-phase-1-re-review-2.md` evidence: full Node/PHP baseline, PHP lint, extractor, disposable production-page browser path, and D-91 precursor adversarial probe | Existing suites pass: 60 runner, 163 unit, 8 helper, 9 underline, 4 preview, 9 renderer, 8 store. The helper checks cover positive spaced-period forms but omit the failing control: `A) ... A ) ... B)` is resplit because the last A match replaces the selected boundary. Owner changed the requirement after this review; no product test ran in the documentation-only disposition. `FIX-1` remains open; `FIX-2` is closed. |
| ST01 D-91 replacement fix and third re-review (2026-11-15) | failing-first complete spacing matrix and selected-boundary controls in the real root-helper suite; full Node/PHP baseline, PHP lint, extractor, syntax, live-origin cap rerun, and independent disposable production-page review | 60 runner, 163 unit, 11 helper, 9 underline, 4 preview, 9 renderer, 8 store; all pass. Exact `A) ... A ) ... B)` output and duplicate-set controls pass; helper is 160 lines / 6284 bytes and +57/−20 from live. `FIX-1` closed, `FIX-2` remains closed, ST01 review-settled; no live write. |
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
checks pass, and OT10 executed the target-runtime migration, rollback, and
desktop-browser checks on 2026-11-08.

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
| Owner Brave/Android Constant Text/underline/preview check | ST01/ME01/ME02 | Focused disposable desktop Chromium preview/OCR isolation passed 2026-11-14; owner-accepted phone check remains required on the final tree; no live write |
| Brave/Android and desktop Chromium math-editor checks | ME01/ME02 | Owner-accepted check required on the final tree; no live write |
| Main-question reader/writer inventory | OT06 | Satisfied 2026-11-05; see [`plan/owner-tool/ot-06-reader-writer-audit.md`](plan/owner-tool/ot-06-reader-writer-audit.md) |
| Representative context paste with answer key | Archived OT08/OT09 acceptance | Satisfied 2026-11-08 with `sample-passages.txt`; no longer a production requirement after D-83 |
| Brave/Android staging check | Archived OT10 final acceptance | Satisfied 2026-11-09 and 2026-11-13; archived with the owner-tool cycle |
| Live `cbt_db.php`, `header.php`, `footer.php`, `cbt_exam_attempts` | Deployment | Live-site artifacts, not supplied; owner deferred to deployment time |

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
production source. OT10 verified on 2026-11-14 that the deployment manifest
contains the current context-aware admin writer and no alternate legacy writer:
only `deployed/admin_context.php` contains `INSERT/UPDATE/DELETE` on `questions`,
and it is the manifest's writer. OT06
suppresses the dead `answer_details.php` link for inactive linked members and
passed its light review at OT07 Gate 1. OT07 now supplies the manual context
card/native-form workflow; its rigorous Release B review returned PASS WITH
ACCEPTED FINDINGS and `FIX-1` (handoff hash/byte accuracy) was fixed and closed
by the closure-focused re-review on 2026-11-06.

`header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts and
are not requested up front. OT10's local smoke used a test-only `cbt_db.php`,
`cbt_admin_config.php`, and an inferred `cbt_exam_attempts` table; do not deploy
those shims. The supplied detail page is part of OT04; OT10 repeats Release A
acceptance instead of performing first-time integration.

## Archived release evidence — owner-tool-2026-11

OT05 wrote the migration, preflight, and rollback artifacts. OT10 executed and
proved them on the target runtime on 2026-11-08:

- `php -l` on every changed/new PHP file: PASS on PHP 8.3.16;
- `php tests/php-render.php`: 9 PASS;
- migration preflight, forward, rerun, and rollback on a disposable
  production-shaped MySQL 8.0.41 database: PASS, including adversarial
  schema/rollback probes and the post-`ALTER` writer-contention boundary;
- desktop Chromium 155.0.8059.40 local harness: 33/33 PASS (admin owner tool,
  comprehension/cloze load, underline/paragraph preview, native PRG save, edit
  formatting tool, CBT complete-group delivery, answer-details XSS probes).

Settled: the phase-11 review returned PASS WITH ACCEPTED FINDINGS on 2026-11-14
(`NOTE-1`–`NOTE-3` non-blocking) and OT10 is done. Cycle close is in progress,
with the boundary commit awaiting explicit owner authorization. The only open
item is the owner-deferred live deployment artifact set (owner decision
2026-11-14), a deployment-time gate.
The Brave/Android staging phone check passed on 2026-11-09; the owner accepted
OT11's final follow-up re-check on 2026-11-13. The deployment manifest is
[`DEPLOYMENT.md`](DEPLOYMENT.md); the developer handoff is
[`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md). These checks are not OT05 completion
gates.

## Delivery stages

- ST01: return production to root `ocr_helper.js`, archive shared-text/context,
  add optional Constant Text plus admin session prefill, add the underline
  toolbar, and complete D-91 option-label parsing with its regression evidence.
  Done and review-settled; the ME01 dependency is satisfied.
- ME01: curated Tier 1 palette, insertion helpers, byte counter, and admin
  script-tag wiring on the ST01 tree.
- ME02: token/version, decisions, docs, deployment manifest and developer guide,
  browser evidence, and the rigorous release review.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state, review cadence, and branch strategy: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/math-editor/` (active) and
  `docs/plan/owner-tool/` (archived cycle)
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
