# AGENTS.md

## Read first

- `docs/AGENTS.md` is the detailed contract: dangerous regexes, behavior to preserve, evidence policy. Read it before editing `src/parser/parser.js` or `src/ui/ui.js`.
- Behavior spec: `docs/SPEC.md`; rationale: `docs/DECISIONS.md`; test status: `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`.
- Work tracker and session protocol: `docs/plan/README.md`. Read it before starting a work package; update its status row and the package handoff when done.
- The archived migration docs and live PHP/HTML are the source of truth (not prose guesses): `archive/migration-docs/`, `archive/live-sources/`.

## Commands

- Test: `node tests/runner.js`. There is no watch, filter, or single-fixture mode; it runs every fixture and exits 1 on failure or an orphan input. Currently 20/20 PASS.
- Parser probe: `node -e "const p=require('./src/parser/parser.js'); console.log(p.splitQuestions('1. Hello world'))"`.
- Build: `node src/build/build.js`. Then `wc -l src/bookmarklet.js` must print `1`, and the body (leading `javascript:` stripped) must pass `node --check`; exact snippet in `docs/BUILD.md`.
- No root `package.json`, lint, typecheck, CI, or test framework. `.opencode/package.json` is only the OpenCode notification plugin; do not `npm install` for project work.
- Termux has no `/tmp`; use `$HOME/tmp` for temp files.

## Editing rules

- `src/bookmarklet.js` is generated; never edit it by hand. Edit the two modules, then rebuild.
- Never add `//` comments to the source modules: the build flattens everything onto one `javascript:` line, where `//` truncates the rest. Do not rely on indentation in multiline template literals; the build trims every line.
- Do not modify the PHP, database, `ocr_helper.js`, or server contract: CSRF, PRG flow, field names, four-option rule, and success flash text are fixed.
- Do not change `localStorage` key names/shapes: `ocrQueue`, `ocrMeta`, `ansKey`. Do not read/write `ocrSubmitted`.
- Preserve deliberate quirks: E/F→D collapse, `splitQuestions` numbering guard, advisory-only flags, blank options, `FIXES` order. Do not refactor for style.
- Highest-risk code: `OPTION`, the blank-option whitespace class, `LOOSE` E/F, `splitSections`, `splitQuestions`, and the paired `fillForm`/`tick` logic. See `docs/AGENTS.md` before changing these.

## Fixtures

- `fixtures/expected/*.json` were transcribed from docs, never generated from the parser. Do not regenerate or weaken assertions to make a test pass; mark doc-unsupported fields/inputs `PENDING` instead.
- Every `fixtures/inputs/*.txt` needs an expected spec or the runner fails it as `[ORPHAN]`. Schema is `schema_version: 1`; kinds are `questions`, `question`, `key`; statuses are `CONFIRMED`, `PENDING`. Unknown keys or wrong types fail.
- The harness is parser-only: it does not exercise DOM, storage, `fillForm`, `tick`, or save behavior. No browser test suite exists.
- Subject assertions use the archived live `<select>` at `archive/live-sources/subjects-select-2026-10-23.html`.

## Known gaps

- No live browser run, no live `questions` schema check, and no real OCR paste beyond the documented S1 sample. Stale `ocrQueue` data has no version marker; reset and re-paste after parser/UI changes.
- Do not promote `UNVERIFIED`/`AT_RISK`/`CONFLICTED` items to defects without reproduction; see `docs/EDGE_CASES.md` and `docs/INVARIANTS.md`.
