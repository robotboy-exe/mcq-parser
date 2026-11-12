# AGENTS.md

## Read first

- **Live site safety:** read `docs/LIVE-SAFETY.md` before any live/browser check. By default, the agent does not delete or clean up live records; cleanup is owner-only.
- `docs/AGENTS.md` is the detailed contract: dangerous regexes, behavior to preserve, evidence policy. Read it before editing `src/parser/parser.js` or `src/ui/ui.js`.
- Behavior spec: `docs/SPEC.md`; rationale: `docs/DECISIONS.md`; test status: `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`.
- Work tracker and session protocol: `docs/plan/README.md`. Read it before starting a work package; update its status row and the package handoff when done.
- The archived migration docs and live PHP/HTML are the source of truth (not prose guesses): `archive/migration-docs/`, `archive/live-sources/`.

## Session scope

- Execute one `docs/plan/` package per session unless the user explicitly asks to continue. Stop after the package handoff.
- Active work happens on `owner-tool-integration`; `main` is the published baseline and the remote default. See `docs/plan/README.md` for branch strategy. The accepted Phase 6 fixes and third re-review are complete; `BLOCK-3`/`BLOCK-6` are closed under the frozen lifecycle, and the owner rejected `BLOCK-8` on 2026-11-05 because authoritative `questions.sql` and the corroborating `questions1.sql` export are unpartitioned and partitioning requires an out-of-contract schema change. `NOTE-4` is non-blocking. Phase 6 is review-settled and included in the 2026-11-05 boundary commit. OT06 passed its light review at OT07 Gate 1. OT07 is implemented; its rigorous Release B review returned PASS WITH ACCEPTED FINDINGS, and `FIX-1` (handoff hash/byte accuracy) was fixed and closed by the closure-focused re-review on 2026-11-06, so phase 8 is review-settled and included in the 2026-11-06 boundary commit; `cbt_practice.php` and `practice_title` are outside the remaining cycle scope. OT08 passed its light review at OT09 Gate 1, and OT09 cloze OCR is implemented with parser 2.3.2; its rigorous Release C review returned `BLOCK` on 2026-11-07 (`BLOCK-1`, `FIX-1`), the owner authorized `fix` for both, and the fix was applied on 2026-11-07 (`cloze.js` 242 lines; colliding groups refused); the re-review closed both and recorded `FIX-2` in its first review round; the owner changed the `FIX-2` requirement on 2026-11-07 (keep the first group and drop later colliding groups with a naming warning), the 2026-11-07 fix session applied that rule (parser 2.3.2), and the closure-focused second re-review returned `PASS` and closed `FIX-2` on 2026-11-08, so phase 10 is review-settled and included in the 2026-11-08 boundary commit. Same-paste answer keys were supplied in `sample-passages.txt` on 2026-11-08 (comprehension Q13-Q15, cloze Q71-Q80) for OT10 validation. OT10 local PHP/DB/desktop execution passed and the Brave/Android phone check passed on 2026-11-09; OT10 remains blocked on the independent final review and live deployment artifacts. The phone check surfaced three owner-workflow refinements, routed to OT11 (phase 12); OT11 is implemented and its local tests pass, with the owner phone re-check and rigorous review pending.
- OT11's 2026-11-12 consolidation is implemented locally: one stacked page
  with no tabs, authoritative full-paste clearing, full passage identity,
  advisory duplicates, next-free links, Show/Hide, and 10-row Shared Texts
  pagination with an unpaginated question selector. The latest owner follow-up
  moves the collapsible Edit Shared Text editor directly below the paste panel
  and prevents stored paste state from overwriting an explicit shared-text edit;
  focused desktop/mobile-width Chromium passes. The latest phone re-check fixes
  keep the next unsaved shared text open and parse a corroborated one-character
  cloze row drift with parser 2.3.3. Final owner phone confirmation and rigorous
  review remain pending.
- Do not archive the active phase map when the last phase stops; archive only when the user confirms the cycle is complete or asks to shelve it.
- Commit only at a phase boundary: at the start of a new phase, after the previous phase's review settles. Do not commit current-phase work; commit the final phase before archiving the cycle.
- Rigorous reviews are separate sessions using `docs/plan/prompts/review-session.md`; they may write only `docs/plan/reviews/` and never commit.

## Live site safety

- By default, the agent does not delete or clean up live questions, media, or users. Live test cleanup is owner-only; use a staging environment when possible.
- A live write requires per-action user approval naming the exact records and fields. A package acceptance row, a successful test, or "run the live check" does not authorize a destructive live write.
- If a live delete is ever explicitly authorized: preflight the exact ID list, match exactly one `action=delete_question` form whose `question_id` is that ID, click that row's Delete button (never `.submit()` or `.requestSubmit()`), assert the confirmation names the exact ID, and require the exact success flash. Stop on the first mismatch.
- Live-created test rows need a unique marker and a local manifest of exact IDs; leave them for the owner.
- No staging copy or verified backup means no destructive live test. Full rules: `docs/LIVE-SAFETY.md`.

## Commands

- Test: `node tests/runner.js`. There is no watch, filter, or single-fixture mode; it runs every fixture and exits 1 on failure or an orphan input. Currently 60 fixtures: 60 PASS, 0 PENDING; `node tests/unit.js` is 163 PASS; `node tests/owner-tool.js` is 79 PASS; `node tests/context-migration.js` is 14 static context probes; `php tests/context-lib.php` is 14 helper-behavior tests; `php tests/context-admin.php` is 23 context request/real-transaction/render tests; `php tests/context-preflight.php` is 6 real contract/inspector/CLI-failure tests when PHP 8.3 is available.
- PHP renderer check: `php tests/php-render.php`; also run `php -l` on every changed file under `deployed/` on the target PHP runtime.
- Context migration artifacts: `tools/context-migration-preflight.php` and `deployed/sql/01-context-migration.sql` are executed only against a disposable database in OT10. Do not run them against production.
- Docs-only edits (`*.md`) do not require tests. Run tests only when `src/`, `tests/`, `fixtures/`, or `tools/` change.
- Bank extractor: `node tools/extract-bank.js --check` verifies the source, slices, counts, and output hashes.
- Parser probe: `node -e "const p=require('./src/parser/parser.js'); console.log(p.splitQuestions('1. Hello world'))"`.
- Build: `node src/build/build.js` rebuilds only `src/bookmarklet.js`. Then `wc -l src/bookmarklet.js` must print `1`, and its body (leading `javascript:` stripped) must pass `node --check`; exact snippet in `docs/BUILD.md`. Do not add `--min`.
- `src/bookmarklet.min.js` is not tracked. It may exist locally from an older build; do not edit, rely on, or rebuild it.
- No root `package.json`, lint, typecheck, CI, or test framework. `.opencode/package.json` is only the OpenCode notification plugin; do not `npm install` for project work.
- Termux has no `/tmp`; use `$HOME/tmp` for temp files.

## Editing rules

- `src/bookmarklet.js` is generated; never edit it by hand. Edit the two modules, then rebuild. `src/bookmarklet.min.js` is an untracked local artifact; do not edit, rely on, or rebuild it.
- Full-line `//` comments are stripped by the build; never add inline `//` comments, because the build flattens everything onto one `javascript:` line and an inline `//` truncates the rest. Do not rely on indentation in multiline template literals; the build trims every line.
- Do not modify the PHP, database, `ocr_helper.js`, or server contract: CSRF, PRG flow, field names, four-option rule, and success flash text are fixed.
- Do not change `localStorage` key names/shapes: `ocrQueue`, `ocrMeta`, `ansKey`. Do not read/write `ocrSubmitted`.
- Preserve deliberate quirks: E/F→D collapse, `splitQuestions` numbering guard, advisory-only flags, blank options, `FIXES` order. Do not refactor for style.
- Treat divider-only runs of three or more equals signs (`========`) as section separators (D-46). A partial section, even one question, is its own paste; do not attach an unheaded section to the previous or next year.
- Highest-risk code: `OPTION`, the blank-option whitespace class, `LOOSE` E/F, `splitSections`, `splitQuestions`, and the paired `fillForm`/`tick` logic. See `docs/AGENTS.md` before changing these.

## Fixtures

- `fixtures/expected/*.json` were transcribed from docs, never generated from the parser. Do not regenerate or weaken assertions to make a test pass; mark doc-unsupported fields/inputs `PENDING` instead.
- Every expected spec needs `input_origin`: `bank`, `anomaly`, `doc`, `synthetic`, or `user_sample`. Every `fixtures/inputs/*.txt` needs an expected spec or the runner fails it as `[ORPHAN]`. Schema is `schema_version: 1`; kinds are `questions`, `question`, `key`; statuses are `CONFIRMED`, `PENDING`. Unknown keys or wrong types fail.
- The harness is parser-only: it does not exercise DOM, storage, `fillForm`, `tick`, or save behavior. No browser test suite exists.
- Subject assertions use the archived live `<select>` at `archive/live-sources/subjects-select-2026-10-23.html`; category assertions use the `exam_category_id` select in `archive/live-sources/admin_questions.html`.

## Known gaps

- 2026-10-27 incident: a live AS-12 test cleanup deleted six Active Accounting questions (#3795-#3800). A first-match delete selector submitted the Recent Questions form instead of the edited row and bypassed the confirm dialog. Only truncated stems were recovered from a Playwright snapshot; options and answers were not. Test rows #3841-#3846 remain. See `docs/LIVE-SAFETY.md`; do not attempt live deletion.
- Live V1-V3 checks ran on 2026-10-25: the current bookmarklet parsed `bank-2021` and `anomaly-block2` on the admin page, a controlled manual save was accepted and deleted (no `practice_title` schema error), and a stale queue without a batch identity loaded but auto-save was blocked. There is still no new live OCR paste beyond the archived bank/anomaly blocks. The unfiltered admin list did not show the new rows while a filtered list did; the site owner confirmed this is intended list behavior. `ocrQueue` still has no version marker; reset and re-paste after parser/UI changes.
- Do not promote `UNVERIFIED`/`AT_RISK`/`CONFLICTED` items to defects without reproduction; see `docs/EDGE_CASES.md` and `docs/INVARIANTS.md`.
- OT05 context schema is written but not executed: the forward migration, rollback, and successful preflight run only in OT10 on a disposable production-shaped database. `questions.practice_title` remains `NOT NULL` with no default while the admin INSERT omits it; it is an out-of-scope legacy field and must not be changed or used as an OT06 gate in this cycle. The admin context PRG flow and OT07 owner workflow have no browser runtime test; helper behavior is covered by `php tests/context-lib.php`, real question/context transactions and rendering by `php tests/context-admin.php`, exact metadata plus connector failure behavior by `php tests/context-preflight.php`, and the owner DOM/storage/PRG path by `node tests/owner-tool.js`.
