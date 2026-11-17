# AGENTS.md

## Read first

- **Live site safety:** read `docs/LIVE-SAFETY.md` before any live/browser check. By default, the agent does not delete or clean up live records; cleanup is owner-only.
- `docs/AGENTS.md` is the detailed contract: dangerous regexes, behavior to preserve, evidence policy. Read it before editing `src/parser/parser.js` or `src/ui/ui.js`.
- Behavior spec: `docs/SPEC.md`; rationale: `docs/DECISIONS.md`; test status: `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`.
- Work tracker and session protocol: `docs/plan/README.md`. Read it before starting a work package; update its status row and the package handoff when done.
- The archived migration docs and live PHP/HTML are the source of truth (not prose guesses): `archive/migration-docs/`, `archive/live-sources/`.

## Session scope

- Execute one `docs/plan/` package per session unless the user explicitly asks to continue. Stop after the package handoff.
- Active work happens on `owner-tool-integration`; `main` is the published baseline and the remote default. The `owner-tool-2026-11` cycle is archived (map: `docs/plan/prompts/cycles/owner-tool-2026-11.md`). The active cycle is `math-editor-2026-11`: phase 1 is ST01, phase 2 is ME01, phase 3 is ME02, and phase 4 is EL01 (English Lexis subject and post-selection Constant Text grouping). ST01 returns the production path to root `ocr_helper.js`, retires the shared-text/context subsystem, adds optional `questions.constant_text`, and adds exact lowercase `<u>` underlining to Constant Text, question text, and options.
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

- Test: `node tests/runner.js`. There is no watch, filter, or single-fixture mode; it runs every fixture and exits 1 on failure or an orphan input. Currently 60 fixtures: 60 PASS, 0 PENDING; `node tests/unit.js` is 163 PASS; `node tests/ocr-helper.js` is 11 checks; `node tests/underline-toolbar.js` is 10 checks; `node tests/question-preview.js` is 4 checks; `node tests/math-tool.js` is 20 checks; `php tests/cbt-question-order.php` is 11 checks; `php tests/php-render.php` is 9 renderer vectors; `php tests/admin-question-store.php` is 8 store checks. `php tests/cbt-staging.php` runs 6 checks only against disposable local staging.
- PHP renderer check: `php tests/php-render.php`; also run `php -l` on every changed file under `deployed/` on the target PHP runtime.
- Constant Text migration: `deployed/sql/01-constant-text.sql` and `02-constant-text-rollback.sql` run only against a disposable database. Do not run them against production.
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
- The production OCR helper is root `ocr_helper.js`, loaded directly by `admin_questions.php`. Do not modify the PHP server contract: CSRF, PRG flow, field names, four-option rule, and success flash text are fixed.
- Do not change `localStorage` key names/shapes: `ocrQueue`, `ocrMeta`, `ansKey`. Root `ocr_helper.js` keeps the legacy `ocrSubmitted` marker (written on submit, deleted on the next load); do not add that key to new modules, and the archived bookmarklet must not touch it.
- Preserve deliberate quirks: E/F→D collapse, `splitQuestions` numbering guard, advisory-only flags, blank options, `FIXES` order. Do not refactor for style.
- Preserve multiline rendering: root helper folds single wraps but keeps blank-line paragraphs (`\n\n`), options stay single-line, and Constant Text/question stems use `white-space: pre-wrap` in the CBT pages.
- `src/question-preview.js` is read-only: it renders Constant Text and Question through `window.CBTText`, writes no form values, and has no storage/network behavior. Root `ocr_helper.js` must not reference or fill `constant_text`.
- `src/math-tool.js` is the admin symbol palette and advisory byte counter for `#question_text`. It writes no storage, network, form submit, underline marker, or `constant_text` behavior; the server's 60,000-byte check and the native `maxlength` stay authoritative.
- `deployed/cbt_question_order.php` reorders only the already-selected rows for the trusted exact subject name `English (Lexis & Structure)`. Keep the SQL filters, `ORDER BY RAND()`, limit, ID multiset, original-order members (ascending `id` inside each group), blank singleton behavior, and per-row Constant Text rendering unchanged. `cbt_practice.php` stays out of scope.
- D-91 is the root-helper option-label contract: A-D is case-insensitive; whitespace is optional after `(`, before `)`, and before `.`, while unspaced forms remain valid. A later label-like repeat of an already selected letter stays in that option's text. The review-settled phase-1 implementation includes the exact `A) ... A ) ... B)` regression.
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
- ST01 and ME01 are review-settled, and the owner accepted ME02's Brave/Android check on 2026-11-17. EL01 implementation and all acceptance evidence pass, including the real 8-check operation harness on isolated Oracle MySQL Community Server 8.0.41 ARM64, and its phase-4 review settled on 2026-11-17 with `PASS WITH ACCEPTED FINDINGS`; `NOTE-1`–`NOTE-4` are corrected. The production context migration was never executed; removed context modules/tests/tools/SQL are under `archive/owner-tool-2026-11/`. `questions.practice_title` remains `NOT NULL` with no default while the admin INSERT omits it; it is an out-of-scope legacy field and must not be changed.
