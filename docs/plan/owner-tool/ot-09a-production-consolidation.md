# OT09A - Production Consolidation

- **Status:** done; `FIX-1` closed by the closure-focused re-review on 2026-11-08; phase 10A boundary committed
- **Depends on:** OT09 phase-10 boundary commit `652c891`
- **Blocks:** OT10 only through its existing release/handoff gate
- **External gate:** none for consolidation; OT10 keeps the PHP/staging and
  remaining answer-key gates
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Reduce the developer handoff from the phase-10 file set to a cohesive
12-production-file deployment set plus two ops files, without changing behavior
or invalidating saved owner-tool state. The phase-10 review is closed and its
findings are not reopened by this package.

## Gate 1

- Package base: `652c891` (2026-11-08 phase-10 boundary commit). The fix
  session inherits this base and does not reset its counters.
- Measurement basis: the complete per-file base deltas, final lines/LF bytes,
  hashes, responsibility, deployment inclusion, and direct production-path
  tests are recorded in the [externalize-first measurement table](#externalize-first-measurements).
- Worktree at Gate 1: clean.
- No live site, staging database, browser write, or production cleanup is in
  scope.
- PHP 8.3 verification uses the local Laragon binary when `php` is not on PATH;
  OT10 still owns target-runtime and staging proof.
- `PARSER_VERSION` stays `2.3.2`. Changed shared asset filenames receive a new
  cache-bust token only.

## Consolidation map

| Final production file | Source files absorbed |
|---|---|
| `deployed/context_lib.php` | `context_input_validation.php`, `context_activation_validation.php` |
| `deployed/admin_context.php` | `admin_context_actions.php`, `admin_context_data.php`, `admin_context_management.php`, `admin_question_context_fields.php`, `admin_question_mutations.php` |
| `deployed/cbt_candidate.php` | `cbt_candidate_selection.php`, `cbt_candidate_repository.php` |
| `src/parser/core.js` | `comprehension.js`, `cloze.js` |
| `src/owner-tool/render.js` | `src/cbt/context-render.js` |
| `src/owner-tool/owner-tool.js` | `state.js`, `contexts.js`, `context-form.js`, `context-card.js`, `context-panel.js`, `controller.js` |
| `src/owner-tool/owner-tool.css` | `style.css`, `context-workflow.css`, `src/cbt/context.css` |

The remaining production files are `deployed/admin_questions.php`,
`deployed/cbt.php`, `deployed/answer_details.php`, `deployed/render.php`, and
`deployed/sql/01-context-migration.sql`.

Ops handoff: `deployed/sql/README.md` and
`deployed/sql/02-context-rollback.sql`.

Repo-only migration support, not deployment files:
`deployed/sql/base-schema.working.sql`,
`tools/context-migration-preflight.php`,
`tools/context-migration-contract.php`, and
`tools/context-migration-inspector.php`.

## Preserved behavior

- Existing public functions, selectors, field names, form actions, flash text,
  CSRF/PRG flow, and stored state keys/shapes.
- Exact underline rendering, comprehension/cloze parsing, duplicate-cloze
  keep-first behavior, context lifecycle, candidate group delivery, and
  answer-details rendering.
- `deployed/cbt_practice.php`, `src/parser/parser.js`, `src/ui/ui.js`, and
  `src/bookmarklet.js` are unchanged.

## Acceptance

| Check | Expected |
|---|---|
| Node suites | runner, unit, owner-tool, context-migration, and cbt-context all PASS |
| PHP suites | context-lib, context-admin, context-preflight, php-render, and cbt-candidate all PASS on PHP 8.3 |
| PHP lint | Every changed `deployed/*.php` passes |
| Live-origin additions | Per-file additions against `archive/live-sources/*` are 100 or fewer |
| Manifest | The 12 production files exist; every absorbed split file is gone |
| Assets | Admin and CBT load only the consolidated files in the required order |
| State | `cbtOwnerTool:v1` keys and parser version `2.3.2` are unchanged |
| Safety | No live write, no destructive action, no commit |

## Handoff

Implementation is complete on `owner-tool-integration` from base `652c891`.
No commit was made. The independent review remains a separate session and may
write only `docs/plan/reviews/`.

### Production handoff (12 files + 2 ops)

The 12 production files and 2 ops files are measured below.

#### Externalize-first measurements

Base `652c891`. Line counts are `wc -l`; bytes are LF-normalized UTF-8 bytes
(`wc -c` after removing `\r`); SHA-256 is over the LF-normalized content. Five
production files carry CRLF on the Windows working tree (`admin_questions.php`,
`cbt.php`, `answer_details.php`, `render.php`, `render.js`), so their on-disk
byte counts are larger by the `\r` count; the values below are the LF basis. New
files have no blob at `652c891`, so their additions equal their final line count
and their deletions are 0.

Every number reproduces `git diff --numstat 652c891`,
`git diff --no-index --numstat <archive-live-snapshot> <file>` for live-origin
files, LF byte counting, and `sha256sum` on the LF-normalized content.

| File | Δ vs `652c891` | Final lines / LF bytes | SHA-256 (LF) | Responsibility | Deployment inclusion | Direct production-path test |
|---|---:|---:|---|---|---|---|
| `deployed/admin_questions.php` | +10 / −35 | 1064 / 62659 | `3afcaf64da0c568ebeb3909366c30c189d7cd41b1d5eb2c4ec9ed357f129d419` | Admin entry point; narrow include and renderer/asset wiring | `require_once admin_context.php`; render call sites `:816,:925`; loads `owner-tool.css`, `core.js`, `render.js`, `owner-tool.js` | `node tests/context-migration.js`; `node tests/owner-tool.js` asset-order; `php -l` |
| `deployed/cbt.php` | +3 / −4 | 1008 / 44515 | `358c9926833465d4fdf8eb6746a328f0a12f1fa0e6d7d7165b0438192433923e` | CBT delivery page; candidate include and assets | `require_once cbt_candidate.php`; loads `owner-tool.css`, `render.js` | `node tests/context-migration.js`; `php -l` |
| `deployed/answer_details.php` | 0 / 0 | 251 / 12157 | `b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c` | Answer-details rendering | unchanged entry point; loads `render.php` | `node tests/owner-tool.js` static sink probe; `php -l` |
| `deployed/render.php` | 0 / 0 | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` | Shared server text renderer | included by detail/admin pages | `php tests/php-render.php`; `php -l` |
| `deployed/context_lib.php` | +270 / −2 | 480 / 19401 | `bc86d26e70451aeddc8dc95ad789ccdd611d0cb3053917f83df281d121189c02` | Side-effect-free context validation and queries | included by `admin_context.php` | `php tests/context-lib.php`; `php -l` |
| `deployed/admin_context.php` | new +833 / −0 | 833 / 38568 | `1ac928a7c3aabbef59eafe2446b3a081c453da2b62666e2ef9b5c74214a9f8d1` | Admin context request handling, rendering, and question-link mutations | `require_once` by `admin_questions.php` | `php tests/context-admin.php`; `php -l` |
| `deployed/cbt_candidate.php` | new +423 / −0 | 423 / 16714 | `8d1383ef11bd2963af521af62d20c123663642f0149702714620a5a516463dc6` | Candidate unit selection and repository queries | `require_once` by `cbt.php` | `php tests/cbt-candidate.php`; `php -l` |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 250 / 17870 | `e963b739a26f20e5b12db6525266b580c0472d494fd29a6fb44a3a3f076b55f7` | Forward migration | OT10 migration run on a disposable database | `node tests/context-migration.js` |
| `src/parser/core.js` | +430 / −4 | 1426 / 48965 | `4c64b8715ad4de72b23fe4340b75ca6e34c860035f95d8e9ba5b814f096ac501` | Parser core plus internal comprehension/cloze engines | loaded by `admin_questions.php` | `node tests/runner.js`; `node tests/unit.js` |
| `src/owner-tool/render.js` | +97 / −3 | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` | Shared text renderer plus context-card renderer | admin, CBT, and practice pages | `node tests/cbt-context.js`; `node tests/owner-tool.js` |
| `src/owner-tool/owner-tool.js` | new +1613 / −0 | 1613 / 59846 | `fd54358616d099e57aa3fa5f48ebb190b3b49b29686d581892b5bae198941405` | Owner-tool state, context model/form/card/panel, and controller | loaded by `admin_questions.php` | `node tests/owner-tool.js` |
| `src/owner-tool/owner-tool.css` | new +257 / −0 | 257 / 3952 | `bc2a0c8a179f3385d2cd7e229f0d17b560fa04479eb6fbcc8f227943f91f6871` | Owner-tool, context-workflow, and CBT context styles | admin and CBT pages | `node tests/owner-tool.js` style probes |
| `deployed/sql/README.md` (ops) | 0 / 0 | 172 / 8065 | `7f474ffe65523a957b656db380e01520e30cc7a7373309754274700f5789e861` | Runbook and preflight gate | OT10 ops handoff | `node tests/context-migration.js` |
| `deployed/sql/02-context-rollback.sql` (ops) | 0 / 0 | 64 / 2512 | `047e11005acf8194c66151ebcc1a6510fd6983aab5643552ab9d3d064dbde694` | Guarded rollback | OT10 ops handoff | `node tests/context-migration.js` |

Live-origin additions against the archived live snapshots reproduce as:
`admin_questions.php` +95/−77 vs `admin_questions-2026-10-31.php`; `cbt.php`
+53/−89 vs `cbt-2026-10-31.php`; `cbt_practice.php` +20/−2 vs
`cbt_practice-2026-10-31.php`; `answer_details.php` +2/−1 vs
`answer_details-2026-11-02.php`. All four are within the 100-addition limit; no
owner approval is claimed.

#### Excluded artifacts

Reported separately from the 12 production files and 2 ops files above:

- Supplied root SQL (`questions.sql`, `questions1.sql`, `subjects.sql`,
  `exam_category.sql`) and their unchanged archive copies.
- `db_conn.php` (connection contract).
- `archive/` migration docs and live-source snapshots.
- Supplied sample text files (`sample-passages.txt`, `sample-underline.txt`,
  `admin-needs.txt`) and their archived copies.
- `deployed/cbt_practice.php`: retained OT04 evidence and outside the 12-file
  handoff; its only change is the shared renderer cache token (+1/−1).
- Repo-only migration support: `deployed/sql/base-schema.working.sql`,
  `tools/context-migration-preflight.php`,
  `tools/context-migration-contract.php`, and
  `tools/context-migration-inspector.php`; do not deploy these as handoff files.
- Unchanged legacy parser/UI/bookmarklet sources (`src/parser/parser.js`,
  `src/ui/ui.js`, `src/bookmarklet.js`) and any untracked local
  `src/bookmarklet.min.js`.
- Unchanged `ocr_helper.js` copies.

### Consolidation result

- `context_lib.php` now owns the input and activation validation functions.
- `admin_context.php` owns the five admin context/mutation modules plus
  `cbt_admin_load_context_page`, `cbt_admin_render_question_context_fields`, and
  `cbt_admin_render_context_management`. `admin_questions.php` requires it and
  calls the renderers with `get_defined_vars()`.
- `cbt_candidate.php` owns selection and repository behavior; `cbt.php` requires
  it directly.
- `core.js` owns the comprehension and cloze engines as internal IIFEs and still
  exposes `window.OCRComprehension`, `window.OCRCloze`, and the existing
  `comprehensionEngine()`/`clozeEngine()` API. `PARSER_VERSION` remains `2.3.2`.
- `render.js` owns the shared text renderer and context-card renderer; CommonJS
  exports the text API with `createCard`/`renderForQuestion` attached, while the
  browser gets `window.CBTText` and `window.CBTContext`.
- `owner-tool.js` owns state, contexts, context form/card/panel, and the
  controller. It exports the module APIs for Node tests, assigns the browser
  globals, and starts the controller only when a document exists.
- `owner-tool.css` owns the former owner-tool, context-workflow, and CBT context
  styles.

All absorbed split files are deleted. Admin loads
`owner-tool.css`, `core.js`, `render.js`, and `owner-tool.js` in that order. CBT
loads `owner-tool.css` and `render.js`. The shared asset cache token is
`?v=2.3.2c`; `cbtOwnerTool:v1` and parser version `2.3.2` are unchanged.

### Verification

- `node tests/runner.js`: 59 fixtures, 59 PASS, 0 FAIL, 0 PENDING.
- `node tests/unit.js`: 162 PASS.
- `node tests/owner-tool.js`: 53 PASS.
- `node tests/context-migration.js`: 14 PASS.
- `node tests/cbt-context.js`: 5 PASS.
- `php tests/context-lib.php`: 13 PASS.
- `php tests/context-admin.php`: 19 PASS.
- `php tests/context-preflight.php`: 6 PASS.
- `php tests/php-render.php`: 9 renderer vectors PASS.
- `php tests/cbt-candidate.php`: 7 PASS.
- `php -l` passes on every changed `deployed/*.php`; `node --check` passes on
  `core.js`, `render.js`, and `owner-tool.js`.
- `node tools/cloze-probe.js` exits 0 and keeps the first colliding cloze group
  with the naming warning.
- `node tools/extract-bank.js --check` still stops at the known pre-existing
  Windows/CRLF `bank-pre-2026` output-hash mismatch; the source and the unchanged
  fixture inputs were not edited by OT09A.

No live site write, staging database action, browser save, or cleanup was
performed.

### Phase 10A fix note — FIX-1 (2026-11-08)

`FIX-1` in `docs/plan/reviews/owner-tool-2026-11-phase-10a.md` is a
documentation-only evidence gap. This handoff now records, for all 12 production
files and 2 ops files, the additions/deletions from `652c891`, final lines and
LF bytes with the CRLF basis, SHA-256, responsibility, deployment inclusion, and
direct production-path test, plus a separate excluded-artifact list. Every number
reproduces `git diff --numstat 652c891`,
`git diff --no-index --numstat <archive-live-snapshot> <file>`, LF byte counting,
and `sha256sum`. No source, test, fixture, parser version, state key, file set,
or deployment order changed. `Commit: deferred`. The closure-focused re-review
returned `PASS` and closed `FIX-1` on 2026-11-08; phase 10A is review-settled and
included in the 2026-11-08 boundary commit.
