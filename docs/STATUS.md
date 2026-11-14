# Current Status

Last updated: 2026-11-13.

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
  Gate 1. OT07 is implemented; its rigorous Release B review returned PASS WITH
  ACCEPTED FINDINGS, and `FIX-1` (handoff hash/byte accuracy) was fixed and
  closed by the closure-focused re-review on 2026-11-06. Phase 8 is
  review-settled and included in the 2026-11-06 boundary commit. OT08 is
  implemented with parser 2.2.0 and passed its light review at OT09 Gate 1. OT09
  cloze OCR is implemented with parser 2.3.2; its rigorous Release C review
  returned `BLOCK` on 2026-11-07 (`BLOCK-1`: unapproved 274-line new module;
  `FIX-1`: silent partial cloze group on duplicate numbering), the owner
  authorized `fix` for both under their frozen closure contracts, and the
  2026-11-07 fix applied both (`cloze.js` 242 lines; colliding groups refused;
  parser 2.3.1). The first independent re-review closed both findings and
  recorded `FIX-2` (two cloze groups sharing numbering lose the later group's
  options) in its first review round. On 2026-11-07 the owner changed the
  `FIX-2` requirement to keep the first evidenced group and drop later colliding
  groups with a warning naming the shared gap numbers; the 2026-11-07 fix
  applied that rule (parser 2.3.2), and the closure-focused second re-review
  returned `PASS` and closed `FIX-2` on 2026-11-08. Phase 10 is review-settled
  and included in the 2026-11-08 boundary commit. The owner supplied same-paste
  answer keys in `sample-passages.txt` on 2026-11-08 (comprehension Q13-Q15,
  cloze Q71-Q80); the owner confirmed on 2026-11-13 the revised comprehension key (Q11 B, Q12 C, Q13 A→D; phase 12 `FIX-1`), so it covers Q11-Q15; OT10 must
  confirm final OT08 coverage. OT09A records a 12-production-file plus 2-ops
  handoff; its documentation-only `FIX-1` was closed by the closure-focused
  re-review on 2026-11-08, with no behavior change, so phase 10A is review-settled
  and included in the 2026-11-08 boundary commit. OT10 local execution is in
  progress: PHP 8.3.16 lint/suites, MySQL 8.0.41 migration preflight/forward/
  rerun/rollback, adversarial schema/rollback probes, and a desktop Chromium 155
  harness all pass. The Brave/Android phone check was performed on 2026-11-09 and
  passed; it surfaced three owner-workflow refinements, routed by the owner to
  the independent OT11 package (phase 12). OT11's first re-check found that the
  JS and native context editors were still separate; the owner required one
  native editor and the correction was applied immediately. Local tests and a
  Chromium DOM check pass. A later phone session recorded six follow-up
  requirements; their implementation plus the 2026-11-12 consolidation now
  passes the full local suites. A final owner follow-up
  moves the collapsible shared-text editor below the paste panel and above
  the light-blue question-link group. A reproduced `?edit_context=11` defect no
  longer lets stored paste context #6 overwrite the server-loaded edit. Focused
  Chromium passes at desktop and 390px mobile width. Full paste clearing, full
  passage identity, advisory duplicates, next-free links, Show/Hide, and
  independent shared-text pagination remain covered. The latest phone re-check
  then found that a saved/adopted first passage hid the unsaved cloze passage
  and that `new-sample.txt` gap 75 was one character left of the modal columns.
  Tool 1.5.4 now keeps the first unsaved shared text selected/open and allows
  Use Paste to fill only new drafts, never saved edits. Amber draft and blue
  saved-edit labels and styling make the form mode explicit. Parser
  2.3.3 applies only a two-anchor one-character row correction. The full local
  suites and focused staging Chromium pass. The owner accepted the final
  Brave/Android re-check on 2026-11-13 and requested the checkpoint commit/push;
  the rigorous review returned PASS WITH ACCEPTED FINDINGS on 2026-11-13; its
  docs-only `FIX-1`/`FIX-2` were fixed and closed by re-review the same day; the
  re-review's docs-only `FIX-3` was closed by the second re-review (PASS) on
  2026-11-13, so phase 12 is review-settled. On 2026-11-14 the owner deferred the
  live deployment artifacts to deployment time. OT10 stays open for its handoff
  refresh and independent final review; it is not done.
- Product implementation: parser 2.3.3 (comprehension and cloze contexts), exact
  underline rendering, multiline stems, Add/Edit formatting, native PRG
  preservation, shared-context schema/admin/candidate delivery, and the manual
  owner context workflow are in place. OT11 adds one native Shared Context
  editor, the merged context selector, saved-context adoption, manual selection,
  member dedupe, an explained unsaved-context stop, context-owned metadata,
  saved-card Show/Hide, form boundaries, plain owner copy, one preview beside
  Question Text, full-paste replacement, full passage identity, advisory
  duplicate notices, next-free link values, 10-row Shared Texts pagination, the
  paste-adjacent shared-text editor placement, draft-only paste filling,
  explicit saved-edit isolation, visibly distinct draft/edit modes,
  next-unsaved multi-text selection, and bounded cloze row drift handling.
- Working branch: `owner-tool-integration`; `main` is the published baseline.
  See [`plan/README.md`](plan/README.md#branch-strategy).

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
| OT11 owner-accepted checkpoint (2026-11-13) | full Node/PHP suite, syntax/lint, bank extractor, exact `new-sample.txt` cloze probe, and focused owner-flow probes | 60 PASS, 0 FAIL, 0 PENDING runner; 163 unit; 81 owner-tool; 14 context-migration; 5 cbt-context; 14 context-lib; 23 context-admin; 6 context-preflight; 9 PHP renderer; 7 cbt-candidate; cloze probe and 7 bank hashes PASS; PHP/JS syntax PASS; draft-only paste filling, saved-edit reachability/adoption, and distinct draft/edit mode regressions PASS; live-origin additions remain at +100/+53; final owner phone confirmation accepted; independent rigorous review pending at checkpoint (settled 2026-11-13: PASS, FIX-1..FIX-3 closed) |
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
| Main-question reader/writer inventory | OT06 | Satisfied 2026-11-05; see [`plan/owner-tool/ot-06-reader-writer-audit.md`](plan/owner-tool/ot-06-reader-writer-audit.md) |
| Representative context paste with answer key | OT08/OT09 final acceptance | Supplied 2026-11-08 in `sample-passages.txt` (comprehension Q13-Q15, cloze Q71-Q80); revised comprehension key Q11-Q15 (Q11 B, Q12 C, Q13 A→D) owner-confirmed 2026-11-13; OT10 validates final coverage |
| Brave/Android staging check | OT10 final acceptance | Initial check satisfied 2026-11-09; desktop Chromium passed 33/33; owner accepted the final OT11 re-check on 2026-11-13 |
| Live `cbt_db.php`, `header.php`, `footer.php`, `cbt_exam_attempts` | OT10 deployment | Live-site artifacts, not supplied; owner deferred to deployment time 2026-11-14 (DEPLOYMENT stop conditions); the local smoke used test-only shims |

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
card/native-form workflow; its rigorous Release B review returned PASS WITH
ACCEPTED FINDINGS and `FIX-1` (handoff hash/byte accuracy) was fixed and closed
by the closure-focused re-review on 2026-11-06.

`header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts and
are not requested up front. OT10's local smoke used a test-only `cbt_db.php`,
`cbt_admin_config.php`, and an inferred `cbt_exam_attempts` table; do not deploy
those shims. The supplied detail page is part of OT04; OT10 repeats Release A
acceptance instead of performing first-time integration.

## Deferred to OT10

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

Still open: the independent final review. Deferred to deployment time (owner,
2026-11-14): the live deployment artifacts.
The Brave/Android staging phone check passed on 2026-11-09; the owner accepted
OT11's final follow-up re-check on 2026-11-13. The deployment manifest is
[`DEPLOYMENT.md`](DEPLOYMENT.md); the developer handoff is
[`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md). These checks are not OT05 completion
gates.

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
