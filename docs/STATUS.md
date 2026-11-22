# Current Status

Last updated: 2026-11-22.

## Active cycle

- Cycle: `math-editor-2026-11` (created 2026-11-14). Phase 1 is ST01, the
  Constant Text reset: return production to root `ocr_helper.js`, archive the
  shared-text/context subsystem, add optional `questions.constant_text`, and add
  exact lowercase `<u>` underlining.
- Map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md) — ST01, ME01,
  ME02, EL01, MS01. Statuses live in [`plan/README.md`](plan/README.md).
- Packages: [`ST01`](plan/owner-tool/st-01-constant-text-reset.md) (done and
  review-settled; the third phase-1 re-review closed D-91 `FIX-1`, `FIX-2`
  remains closed, and all 11 helper checks pass),
  [`ME01`](plan/math-editor/me-01-math-palette.md) (done and review-settled;
  the phase-2 re-review passed and closed `FIX-1` and both notes; 17 module
  vectors),
  [`ME02`](plan/math-editor/me-02-release-and-handoff.md) (done; handoff,
  rigorous review, and owner-accepted Brave/Android recheck recorded), and
  [`EL01`](plan/el-01-english-lexis-grouping.md) (done and phase-4
  review-settled; implementation, local evidence, and the real 8-check
  operation harness on isolated Oracle MySQL Community Server 8.0.41 ARM64
  pass; review `PASS WITH ACCEPTED FINDINGS`, `NOTE-1`–`NOTE-4` corrected).
- [`MS01`](plan/math-editor/ms-01-visual-math-shapes.md) — phase 5 visual math
  shapes: `done`; the original review and `FIX-1` closure re-review
  passed and boundary `c6a81fb` was committed/pushed. The owner visual gate then
  requested D-103: remove the duplicate bare `√` operator and join the radical
  vinculum, then D-104: fix the Constant Text preview at 150px and scroll long
  passages. Both follow-ups are committed at `120a5db`; their focused review
  passed with no `BLOCK`/`FIX`, `NOTE-7`/`NOTE-8` are corrected, and the owner
  accepted the desktop/Brave recheck on 2026-11-17.
- D-105 palette restoration (owner request 2026-11-18): a `More symbols` drawer
  returns only the Greek, set theory and logic, and geometry and vectors grids;
  exponents, subscripts, fractions, and square root stay with the visual shape
  editors. Committed at `23a406c` and pushed; cycle-reviewed at `596fb31`
  (`PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`, `NOTE-9`–`NOTE-12`), and the
  owner accepted the desktop/Brave drawer check on 2026-11-18.
- D-106 save diagnostics (owner request 2026-11-18): authenticated question
  save/update PDO failures keep the existing lead-in and append the exact error
  through `h()`, so the owner can diagnose the target schema without server-log
  access. The production file is changed locally; no deployment or live save was
  performed.
- D-108 display alias (owner request 2026-11-19): the exact stored
  `English (Lexis & Structure)` subject displays as
  `English (Comprehension Pages / Lexis & Structure)` on all admin subject selects
  and rows and on the CBT setup/exam views, without changing IDs, the grouping
  key or SQL. CBT Constant Text is weight 800 and the
  question stem remains weight 700. Local static, disposable HTTP, and
  desktop/390px browser checks pass; deployment and the owner's live check remain
  external.
- The owner reported on 2026-11-19 that the production Constant Text migration
  completed successfully. The temporary pre-migration compatibility work was
  reverted before deployment; the application again uses the migrated column
  directly. This does not confirm the separate English Lexis operation `03`.
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
- Planning constraint: the measured live-origin diffs are
  `admin_questions.php` +94/−84 (ST01, ME01/ME02, MS01, D-106, and D-108),
  `cbt.php` +78/−37 (MS01, the renderer token, and D-108),
  `answer_details.php` +21/−3 (MS01 shape rules), and `ocr_helper.js` +57/−20 —
  all within the 100-addition externalize-first cap. No cap exception remains.
- Last review-settled packages: ST01 (`PASS`, third closure-focused re-review),
  ME01 (`PASS`, phase-2 closure re-review), ME02 (`PASS WITH ACCEPTED
  FINDINGS`; owner phone gate accepted 2026-11-17), EL01 (`PASS WITH ACCEPTED
  FINDINGS`; `NOTE-1`–`NOTE-4` corrected 2026-11-17), and MS01 (original
  `FIX-1` closure re-review `PASS`; D-103/D-104 focused review `PASS WITH
  ACCEPTED FINDINGS`, both notes corrected, owner visual gate accepted), plus the
  cycle-wide review at `596fb31` (`PASS WITH ACCEPTED FINDINGS`; `NOTE-9`–`NOTE-12`,
  `NOTE-10`/`NOTE-11` corrected, D-105 owner-accepted 2026-11-18).
  Archived cycle close `45807ea`, archive commit `134305c`.
- Cycle close for `math-editor-2026-11` completed 2026-11-17 at phase-4
  boundary commit `e08b922` and cycle-close docs `0410ecb`; every earlier package
  is done and review-settled, no `BLOCK` or required `FIX` remains, and no live
  write occurred. On 2026-11-17 the owner reopened the cycle (it was never
  archived) and added phase 5, [`MS01`](plan/math-editor/ms-01-visual-math-shapes.md)
  (visual math shapes), whose phase-5 review recorded `PASS WITH ACCEPTED
  FINDINGS`, whose `FIX-1` cache-key fix passed closure re-review, and whose
  boundary is committed at `c6a81fb`. The D-103/D-104 corrections on top of that
  boundary are review-settled and owner-accepted; their commit is pending.
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
| ME01 `FIX-1` fix (2026-11-15, same base `cdbff2b`, uncommitted) | failing-first new vector, `node tests/math-tool.js`, full Node/PHP baseline, PHP lint, syntax, extractor, and measurements | 17 math-tool vectors PASS (the new one failed `neutral !== red` before the change); 60 runner, 163 unit, 11 helper, 9 underline, 4 preview, 9 renderer, 8 store; PHP 8.3.32 lint PASS; `src/math-tool.js` 432 / 13974 and `tests/math-tool.js` 387 / 14947; `admin_questions.php` unchanged at **+89/−80**; no browser, MySQL, staging, or live check |
| ME02 implementation handoff (2026-11-16, base `7f5b4aa`, uncommitted) | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `tests/math-tool.js`, `php tests/php-render.php`, `tests/admin-question-store.php`, `php -l` (PHP 8.3.32, outside the workspace), `extract-bank --check`, `node --check`, `git diff --check`, `--no-index` live-origin numstat, and a disposable SQLite staging run in Chrome 156.0.0.0 | 60 runner, 163 unit, 11 helper, 9 underline, 4 preview, 17 math-tool, 9 renderer, 8 store; PHP lint 7/7 PASS; extractor 7 hashes OK; `admin_questions.php` 1055 / 62646 at **+89/−80** (tokens added in place); `src/math-tool.js` 432 / 13974 and `.css` 133 / 2028 unchanged; palette, drawer, keyboard, undo, thresholds, reset refresh, and native PRG save PASS in the browser; no MySQL, live, or deploy check; rigorous release review pending |
| ME01 closure re-review (2026-11-15, base `cdbff2b`, uncommitted) | closure-focused re-review: full Node/PHP baseline, six closure-derived probes, measurements, and doc reconciliation | 17 math-tool, 60 runner, 163 unit, 11 helper, 9 underline, 4 preview, 9 renderer, 8 store; PHP 8.3.32 lint PASS; `FIX-1` and both notes closed, PASS; module 432 / 13974, tests 387 / 14947, admin **+89/−80** unchanged; browser/MySQL/live not run |
| ME01 implementation (2026-11-15, base `cdbff2b`, uncommitted) | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `tests/math-tool.js`, `php tests/php-render.php`, `tests/admin-question-store.php`, `php -l`, `node --check`, `extract-bank --check`, and `git diff --numstat` against the designated live snapshot | 60 PASS, 0 FAIL, 0 PENDING runner; 163 unit; 11 helper; 9 underline; 4 preview; 16 math-tool; 9 PHP renderer; 8 admin store; PHP 8.3.32 lint and JS syntax PASS; bank extractor 7 hashes OK; `admin_questions.php` 1055 / 62630 at **+89/−80** live-origin additions; no browser, MySQL, staging, or live check in this session |
| EL01 implementation handoff (2026-11-17, dirty base at `3f5d2ea`) | failing-first real-module test; `php tests/cbt-question-order.php`; disposable HTTP `cbt.php` POST; real `03`/`04` operation harness on disposable MariaDB; full Node/PHP baseline, PHP lint, bank extractor, syntax, and live-origin measurement | 10 ordering/wiring and 6 HTTP staging checks PASS; 8 SQL operation checks PASS preliminarily on MariaDB 13.0.2; 60 runner, 163 unit, 11 helper, 10 underline, 4 preview, 20 math-tool, 9 renderer, 8 store PASS; `cbt.php` package `+5/−0`, final 1068 / 45755 and **+59/−35** from live; exact MySQL 8.0.41 run pending at that checkpoint (closed by the next row); no live write |
| EL01 MySQL 8.0.41 acceptance (2026-11-17, dirty base at `3f5d2ea`) | real `tests/english-lexis-sql.sh` against an isolated Oracle MySQL Community Server 8.0.41 ARM64 instance (`127.0.0.1:3307`), no non-target override; server stopped and disposable databases dropped by the harness | 8 SQL operation checks PASS on `8.0.41`: absent, rerun, rollback/no-delete, reactivation, active rerun, forward collision refusal, rollback collision refusal, and schema-contract refusal; external EL01 gate closed; no live write |
| EL01 phase-4 rigorous review (2026-11-17, reviewed `HEAD` `3f5d2ea` plus the EL01 worktree) | independent original review: acceptance reproduction, per-file externalize-first measurements, real module/wiring, HTTP staging, and MySQL 8.0.41 harnesses, manifest, PHP lint, syntax, `git diff --check`, and five adversarial probes | `PASS WITH ACCEPTED FINDINGS`; no `BLOCK` or `FIX`; `NOTE-1`–`NOTE-4` were docs/scope-only and are corrected; 11 ordering/wiring, 6 HTTP staging, 8 MySQL 8.0.41, 18/18 manifest, live-origin `cbt.php` +59 within the +60 cap; no live write |
| MS01 implementation (2026-11-17, base `0410ecb`, uncommitted) | `node tests/runner.js`, `unit.js`, `ocr-helper.js`, `underline-toolbar.js`, `question-preview.js`, `math-tool.js`, `render-markup.js`, `extract-bank --check`, and the PHP 8.3.32 suites plus `php -l` | 60 runner; 163 unit; 11 helper; 10 underline; 5 preview; 25 math-tool; 67 shared marker vectors in JS and 32 in PHP; store 8; ordering 11; bank 7 hashes; lint PASS; live-origin +89/−80, +74/−35, +21/−3; no browser, MySQL, or live check |
| MS01 phase-5 review (2026-11-17, reviewed `0410ecb` plus the MS01 worktree) | independent original review: acceptance reproduction, per-file measurements, 409-input JS/PHP parity fuzz, injection and strip probes, three-surface CSS parity, manifest re-hash, and `git diff --check` | `PASS WITH ACCEPTED FINDINGS`; `FIX-1` (stale cache keys on three consumers) plus `NOTE-1`–`NOTE-6`; no `BLOCK`; manifest 18/18; all suites and counts reproduced; no live write |
| MS01 `FIX-1` fix (2026-11-17, base `0410ecb`, uncommitted) | strengthened asset vector in `tests/math-tool.js`, `node tests/math-tool.js`, full Node/PHP baseline, PHP lint, `git diff --check`, manifest re-hash, and `--no-index` live numstat | 25 math-tool vectors PASS with the new token assertions; 60 runner, 163 unit, 11 helper, 10 underline, 5 preview, 67 JS + 32 PHP marker vectors, 8 store, 11 ordering; lint PASS; `admin_questions.php` 1055 / 62662 at **+89/−80**; no browser, MySQL, staging, or live check |
| MS01 D-103 owner-visual correction (2026-11-17, base `c6a81fb`, uncommitted) | failing-first `node tests/math-tool.js`, full Node/PHP baseline, PHP lint, local Chromium radical geometry at 16–48px, asset/hash refresh, and live-origin numstat | legacy bare `√` operator removed; visual Root editor remains; joined `.06em` vinculum passes all three-surface assertions and local Arial/system-font checks; 25 math-tool vectors and full baseline pass; caps remain +89/+74/+21/+20; focused review and owner desktop/Brave recheck pending |
| MS01 D-104 owner-preview correction (2026-11-17, base `c6a81fb`, uncommitted with D-103) | failing-first `node tests/question-preview.js`, focused preview/palette checks, full Node/PHP baseline, PHP lint, cache/hash refresh, and live-origin numstat | Constant Text preview is a fixed 150px border-box with vertical overflow; Question preview stays content-sized; 6 preview and 25 math-tool vectors plus the full baseline pass; caps remain +89/+74/+21/+20; focused review and owner desktop/Brave recheck pending |
| MS01 D-103/D-104 focused review and owner acceptance (2026-11-17) | independent real-path suites, manifest/cap measurements, disposable Chromium at 900px/320px and 48 radical font/size combinations, then owner desktop/Brave checklist | `PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`; `NOTE-7` regression guard and `NOTE-8` stale docs corrected; owner reported PASS for the sole Root control, joined vinculum, fixed scrollable Constant Text preview, and content-sized Question preview; no agent live action |
| Math palette grid restoration (2026-11-18, dirty base at `120a5db`, owner request) | `node tests/math-tool.js` with new drawer, toggle, category and shape-exclusion vectors, the full Node baseline, `node --check`, `extract-bank --check`, `git diff --check`, hash/line measurements, then the PHP 8.3.32 suites and `php -l` on every `deployed/` file after provisioning the CLI into `$HOME/php83` | 26 math-tool vectors PASS; 60 runner, 163 unit, 11 helper, 10 underline, 6 preview, 67 renderer checks, 7 bank hashes; PHP renderer 32, admin store 8, ordering 11, lint 7/7 PASS; `src/math-tool.js` 660 / 21427, `.css` 255 / 4118, `tests/math-tool.js` 660 / 28485; `admin_questions.php` 1055 / 62662 with both palette tokens rotated in place; a re-review found and fixed the toggle rule sitting before the shared button rule (proved by mutating the order: the assertion fails, then passes when restored); browser, MySQL, staging, live, and deploy checks not run |
| Math-editor cycle review (2026-11-18, reviewed `HEAD` `596fb31`, clean worktree) | independent cycle-wide review of phases 1–5 plus D-105: all Node/PHP suites, PHP 8.3.32 lint, bank extractor, manifest re-hash, live-origin numstat, 513-input JS/PHP parity fuzz, asset-token audit, D-105 drawer probe, D-104 mutation re-challenge, and an authenticated fetch of the authoritative ref | `PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`; 60 runner, 163 unit, 11 helper, 10 underline, 6 preview, 26 math-tool, 67 renderer, 32 PHP renderer, 8 store, 11 ordering, lint 0 failures; manifest 13/13; parity mismatches 0; caps +89/+74/+21/+20/+57; remote `owner-tool-integration` = `HEAD`; `NOTE-9`–`NOTE-12`, owner D-105 drawer check accepted 2026-11-18; no live, deploy, MySQL, staging, or browser action by the agent |
| D-106 authenticated save diagnostics (2026-11-18, direct owner request) | full Node/PHP baseline, `php -l deployed/admin_questions.php`, bank extractor, `git diff --check`, deployment hash/size refresh, and live-origin numstat | 60 runner, 163 unit, 11 helper, 10 underline, 6 preview, 26 math-tool, 67 JS renderer, 32 PHP renderer, 8 store, and 11 ordering checks PASS; extractor and PHP lint PASS; admin remains 1055 lines and +89/−80, now 62631 bytes with manifest hash `429d25f2…deed6f`; no browser, database, live, or deployment action |
| D-108 subject display alias and CBT weight hierarchy (2026-11-19, direct owner request) | failing-first 14-check production ordering/alias suite; disposable HTTP staging through the real `cbt.php`; authenticated admin page and CBT exam view in Chromium at 1280px and 390px; full Node/PHP baseline, PHP lint, deployment hash/size refresh, and live-origin numstat | 60 runner, 163 unit, 11 helper, 10 underline, 6 preview, 26 math-tool, 67 JS renderer, 32 PHP renderer, 8 store, 14 ordering/alias, and 7 HTTP staging checks PASS; PHP lint 8/8; admin alias appears in all three selects and table cells; CBT metadata is aliased with Constant Text/question weights 800/700, exact underline, and no overflow; live-origin caps +94/−84 and +78/−37; no live write or deployment |
| RM01 region model and single-parser collapse (2026-11-19, direct owner request) | four hand-transcribed fixtures written first; `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `tests/math-tool.js`, `tests/render-markup.js`, `node tools/extract-bank.js --check`, `node --check` on the changed JS, and `git diff --check` | 64 runner, 163 unit, 15 helper, 10 underline, 6 preview, 26 math-tool, and 67 markup checks PASS; bank extractor 7 hashes OK; `src/parser/core.js` is 1656 / 57118 with region stages A–D, `regions`, and the D-91 label grammar at version 2.4.0; `ocr_helper.js` was 105 / 3951 and parser-free at that checkpoint (now 127 / 4917 with the core guard below); `deployed/admin_questions.php` is 1057 / 62877 and loads `src/parser/core.js?v=2.4.0` before the helper; PHP lint, browser, database, live, and deployment checks not run |
| OCR helper core guard (2026-11-20, direct owner request) | failing-first browser-branch vectors added to `node tests/ocr-helper.js` via a `vm` DOM stub; `node tests/ocr-helper.js`, `tests/runner.js`, `tests/unit.js`; disposable HTTP staging from `tools/start-phone-staging.sh` (PHP 8.3.6 with `pdo_sqlite`, real `deployed/admin_questions.php`, repo `src/` served over HTTP); desktop cloud-browser session on the staging origin | 19 helper, 64 runner, 163 unit PASS; `ocr_helper.js` 127 / 4917 holds the core to version `2.4.0` and renders a `#ocr_error` banner plus rethrows when `window.OCRParser` is missing or version-mismatched; live staging: paste panel rendered, `region-lowercase-stems` queued 5 items with clean options and section `sectionInstruction`, `region-orphan-number` produced `num: null` plus 25; with `src/parser/core.js` removed the page showed the banner instead of vanishing; the helper cache token is bumped to `?v=2.4.1` on `admin_questions.php` so the guard reaches browsers; no live write and no deployment |
| RM01 main-release fix session (2026-11-22, review `BLOCK-1`/`4`/`5`/`6`/`7`/`8`, owner `go` with BLOCK-1 option a and EC-97/EC-98 precedence) | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `tests/math-tool.js`, `tests/render-markup.js`, `php tests/php-render.php`, `tests/admin-question-store.php`, `tests/cbt-question-order.php`, `php -l deployed/*.php` on PHP 8.3.9, `extract-bank --check`, `git diff --check`, and cloud-browser geometry at 1280px/360px | 68 runner, 164 unit, 27 helper, 10 underline, 7 preview, 26 math-tool, 69 JS marker, 33 PHP marker, 8 store, 14 ordering checks PASS; lint 7/7; two pre-RM comprehension expectations restored; mid-stream orphan/heading fixtures now PASS; fraction bar spans the wider term on all three surfaces (62.64/62.64 and 64.09/64.09px; pre-fix 62.64/15.83px); crossed markers stay literal in JS and PHP; `src/parser/core.js` 1695 / 58770 at version `2.5.0`, `ocr_helper.js` unchanged at 127 / 4917, live-origin caps +96/+78/+21/+51; `BLOCK-1` remains an owner release action; no commit, deploy, or live action |
| RM01 main-release re-review and closure fix (2026-11-22, re-reviewed `4cb4a91` at merge `a3c4533`; owner `fix` disposition for `BLOCK-4`/`5`/`6`, no disposition for `BLOCK-1`) | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/underline-toolbar.js`, `tests/question-preview.js`, `tests/math-tool.js`, `tests/render-markup.js`, `php tests/php-render.php`, `tests/admin-question-store.php`, `tests/cbt-question-order.php`, `$HOME/php83/php -l deployed/*.php` on static PHP 8.3.9, `extract-bank --check`, `git diff --check`, and the 6-combination inline/vertical structural matrix | 68 runner, 166 unit, 28 helper, 10 underline, 7 preview, 26 math-tool, 69 JS marker, 33 PHP renderer, 8 store, 14 ordering, and 7/7 lint PASS; a complete inline A–D set now owns a following `SECTION 2:`/`SECTION 2.`/instruction line, and a repeated lowercase `(a)` stays inside Option A without weakening D-91; the real Load suite now covers the inline layout and the RM01 handoff lists all nine production files including the retired `cbt_practice.php`; core 1717 / 59759 at `?v=2.5.1`, helper 127 / 4917 at `?v=2.4.2`, admin 1057 / 62877; `BLOCK-1` is undisposed and still fails current-`main` ancestry, so commit and `main`-release readiness remain blocked pending an independent re-review; no commit, deploy, or live action |
| dirty experiments worktree after `d5a62f0` | read-only review | BLOCK; P20-P22 must remain uncommitted and excluded |

The dirty experiments review found parser data loss and image-plan/Auto-Save
defects despite its green 46/155 suites. The owner selected the clean
`d5a62f0` baseline and a manual-review replacement tool, so those dirty changes
are shelved rather than repaired in this cycle.

## Supplied evidence

- `deployed/admin_questions.php` (OT03 replaced the helper include here)
- `deployed/cbt.php`
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
| Owner Brave/Android Constant Text/underline/preview check | ST01/ME01/ME02 | Satisfied by explicit owner acceptance 2026-11-17; no live write |
| Brave/Android and desktop Chromium math-editor checks | ME01/ME02 | Satisfied: desktop Chrome 156 staging recorded and owner accepted the final Brave/Android recheck 2026-11-17; no live write |
| Owner desktop/Brave correction recheck | MS01 D-103/D-104 | Satisfied 2026-11-17: owner reported PASS for the sole Root control, joined vinculum, fixed-height scrollable Constant Text preview, and content-sized Question preview; no agent live action |
| Owner desktop/Brave drawer check | D-105 | Satisfied 2026-11-18: owner reported PASS for the `More symbols` drawer, the three restored grids, insertion at the remembered caret, 38px phone targets, and no second square-root control; no agent live action |
| Disposable MySQL 8.0.41 English Lexis operation/rollback | EL01 | Satisfied 2026-11-17: 8-check harness PASS on isolated Oracle MySQL Community Server 8.0.41 ARM64; MariaDB 13.0.2 stayed preliminary only |
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
  script-tag wiring on the ST01 tree. Implemented and handed off:
  `src/math-tool.js` + `src/math-tool.css`, +2 admin asset lines, 17 module
  vectors; review-settled 2026-11-15 by the phase-2 closure re-review.
- ME02: token/version (`?v=1.0.0`, D-94), decisions, invariants/edge cases,
  deployment manifest and developer guide refresh, desktop browser evidence, and
  the handoff. Done; owner accepted the Brave/Android recheck 2026-11-17.
- EL01: exact-name subject operation plus target-only, post-selection Constant
  Text group ordering in `cbt.php`. Done; the real 8-check harness passed on
  isolated Oracle MySQL Community Server 8.0.41 ARM64, and the phase-4 review
  settled on 2026-11-17 with `PASS WITH ACCEPTED FINDINGS` and `NOTE-1`–`NOTE-4`
  corrected.
- MS01: visual math shapes. Replace the palette's symbol grids with five freeform
  shape editors (fraction, exponent, subscript, root, 2×2 matrix), store shapes
  as exact `<frac>`, `<sup>`, `<sub>`, `<sqrt>`, `<matrix>` markers, and paint the
  fraction divider and radical vinculum as horizontal rules in the admin preview,
  exam page, and details page. The original boundary is review-settled and
  committed at `c6a81fb`; D-103 removes the duplicate bare-root operator and
  visibly joins the radical bar, while D-104 fixes the Constant Text preview at
  150px with vertical overflow. Both follow-ups are review-settled,
  owner-accepted, and committed at `120a5db`.
- D-105 palette grid restoration (owner request 2026-11-18, direct work without a
  package): a `More symbols` drawer restores only the Greek, set theory and
  logic, and geometry and vectors grids. Exponents, subscripts, fractions, and
  square root stay out because the visual editors cover them. Committed at
  `23a406c` and pushed to `owner-tool-integration`; reviewed by the cycle-wide
  record at `596fb31` (`PASS WITH ACCEPTED FINDINGS`, `NOTE-9`–`NOTE-12`) and
  owner-accepted 2026-11-18.
- D-106 authenticated save diagnostics (owner request 2026-11-18, direct work
  without a package): replace the misleading migration-only save failure with
  the same lead-in plus the exact escaped PDO message for logged-in
  administrators. Implemented locally; no deployment or live save was run.
- The temporary D-107 pre-migration compatibility work was reverted on
  2026-11-19 after the owner reported the production Constant Text migration
  successful. No D-107 runtime file remains.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state, review cadence, and branch strategy: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/math-editor/` (active) and
  `docs/plan/owner-tool/` (archived cycle)
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
