# Phase 2 Review — ME01 Math Symbol Palette and Byte Counter

- **Date:** 2026-11-15
- **Reviewer:** independent review session
- **Scope:** original light review of phase 2 / `ME01`, complete package acceptance
  and externalize-first boundary
- **Package:** [`math-editor/me-01-math-palette.md`](../math-editor/me-01-math-palette.md)
- **Coordinator:** [`plan/README.md`](../README.md); map:
  [`prompts/phase-map.md`](../prompts/phase-map.md)
- **Reviewed state:** package base `cdbff2b` plus the uncommitted ME01 working
  tree (`deployed/admin_questions.php` modified; `src/math-tool.js`,
  `src/math-tool.css`, `tests/math-tool.js` untracked)
- **Mode:** original review, exploratory across the package acceptance; no prior
  phase-2 record exists
- **Worktree:** chat worktree `freebuff/3e5eb1e45b814f45fbcbf953` at `cdbff2b`.
  This tree contains the `owner-tool-integration` ref `e64513f` as an ancestor
  and carries the phase-1 commits. The review made no branch move, no commit,
  and changed only this record

## 1. Authority and package claims

The package asks for one focused module pair, one admin wiring change of two
lines, and a Node harness. It also fixes the curated symbol set, insertion
behavior, counter thresholds, mount/idempotency rules, accessibility rules, and
the externalize-first table.

Coordinator and package agree that ME01 is done and its light review is due at
ME02 Gate 1. The map resolves phase 2 to ME01. ST01's dependency is settled by
the phase-1 re-review-3 record.

## 2. Repository and change scope

```text
git rev-parse HEAD                              cdbff2b58873244eb9b08c895544f69eceb00863
git diff --numstat HEAD -- deployed/admin_questions.php    2    0
git diff --numstat --no-index archive/live-sources/admin_questions-2026-10-31.php deployed/admin_questions.php   89   80
git diff --check                                clean
git status --porcelain                          8 docs/entry files modified, 3 new files
```

Only `deployed/admin_questions.php` changed among production files: one
stylesheet link at line 695 and one script tag at line 1052, beside the ST01
assets at lines 694 and 1051. `src/math-tool.js`, `src/math-tool.css`, and
`tests/math-tool.js` are new. The remaining modifications are current-facing
documentation (`AGENTS.md`, `docs/AGENTS.md`, `docs/DECISIONS.md`,
`docs/STATUS.md`, the coordinator, the map, and the package handoff). No
unrelated or user-owned file changed; no fixture, parser, PHP logic, SQL,
renderer, preview, underline, or bookmarklet byte changed.

## 3. Implementation inspection

- `src/math-tool.js` exports pure helpers plus one `init`. It builds the
  toolbar, drawer, and counter with `createElement`/`textContent`, mounts once
  under `data-math-tool-mounted`, and inserts the counter between the textarea
  and the ST01 preview (`src/math-tool.js:375-381`).
- Insertion remembers the selection on `select`/`keyup`/`mouseup`/`touchend`/
  `input` (`:383-385`), uses `execCommand('insertText')` first, then
  `setRangeText` with a manual `input` event, then `.value` (`:293-325`), and
  restores the caret afterward.
- Counter updates are wired only to the textarea's `input` and `change` events
  (`:386-387`) plus the mount-time call (`:389`) and palette insertion (`:312`).
- The module contains no `localStorage`, `fetch`, `XMLHttpRequest`,
  `innerHTML`, `.submit()`, `constant_text`, or `owner_tool_underline`
  reference (source grep: none).
- `src/math-tool.css` selectors are all `.math-tool-*` and one media query; no
  ST01 asset is restyled.
- `deployed/admin_questions.php` gained no inline markup, script, or style; the
  package's rejected P24 inline blocks are absent.
- `tests/math-tool.js` requires the real module and exercises it in a DOM shim;
  it does not copy production logic.

## 4. Commands and results

PHP 8.3.32 (static-php-cli, kept outside the workspace) was used; no local
`php` exists in this VM.

```text
node tests/runner.js                    60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                      163 PASS
node tests/ocr-helper.js                11 PASS
node tests/underline-toolbar.js         9 PASS
node tests/question-preview.js          4 PASS
node tests/math-tool.js                 16 PASS
node tools/extract-bank.js --check      source, anchors, counts, 7 hashes OK
php tests/php-render.php                9 PASS
php tests/admin-question-store.php      8 PASS
php -l                                 PASS on 5 deployed PHP files
node --check src/math-tool.js          PASS
```

## 5. Adversarial probes

Probes were run from a temporary file outside the repository against the real
module; no repository file was changed.

1. **Non-input value changes (new boundary).** Mount the real module, write
   60 000 bytes to `#question_text` exactly as `ocr_helper.fillForm()` does
   (`ocr_helper.js:97-99`), then click `#ocr_load`, then dispatch a form
   `reset`. Result: the counter still read `neutral | 1 / 60 000 bytes`. This
   reproduces `FIX-1`.
2. **Selected insertion across formatting.** `insertAtCaret('a\n<u>b</u>\n\nc',
   5, 6, '±')` returned `a\n<u>±</u>\n\nc` with exactly one `<u>`/`</u>` pair
   and the blank-line paragraph intact. PASS.
3. **`execCommand` returning false.** With a stub that reports failure, a quick
   symbol click inserted exactly once (`a±bc`) and fired exactly one `input`
   event. The fallback is single-shot. PASS.

## 6. Findings

### `FIX-1` — Byte counter is stale after OCR load/skip and after form reset

- **Exact defect.** The counter only refreshes on `input`/`change` from the
  textarea and on palette insertion. The page's own OCR helper fills
  `#question_text.value` directly on Load and Skip without dispatching an
  `input` event (`ocr_helper.js:97-99`, `:136-145`), and a native form reset
  restores the default value without one too. The counter therefore keeps an
  older reading — including a neutral reading while the field is already over
  the limit. The sibling ST01 preview already refreshes on both paths
  (`src/question-preview.js:86-98`), and the palette module is the only consumer
  added without that wiring.
- **Reproduced.** Probe 1: 60 000 bytes in the field, counter shows
  `neutral | 1 / 60 000 bytes` after `#ocr_load` and after `reset`.
- **Supported operating preconditions.** The module is mounted on the Add form;
  the shipped root helper is loaded; the administrator clicks Load or Skip (or
  an auto-advance fill occurs), or the native form is reset. No `input`/`change`
  event accompanies those writes.
- **Finite closure criteria.**
  1. After an `#ocr_load` or `#ocr_skip` click that changes `#question_text`,
     and after the form `reset` event settles, the counter text and
     `data-byte-status` equal the textarea's current UTF-8 byte count, including
     `red` at 60 000 or more.
  2. The refresh uses the existing update path. It adds no storage key, network
     request, form submit, form-value write, or Underline button, and does not
     change `maxlength` or the native Save control.
  3. The existing 16 vectors stay green, and at least one new real-module vector
     in `tests/math-tool.js` covers load/skip refresh and reset refresh,
     failing before the fix.
- **Required evidence.** Full package baseline rerun; the new vector executes
  the real `src/math-tool.js` mount; a rerun of probe 1 shows `red` and
  `60 000 / 60 000 bytes` after load and after reset; `php -l` unchanged.
- **Explicit non-goals.** Changing `ocr_helper.js`, `question-preview.js`, the
  underline toolbar, renderers, PHP, CSS tokens, the 60,000-byte server limit,
  `maxlength`, or any browser/MySQL claim. No new finding ID may be folded into
  this fix.

### `NOTE-1` — Handoff overstates the `execCommand` path's preview refresh

The ME01 acceptance table says "both insertion paths dispatch `input`". Only
the `setRangeText`/`.value` fallback dispatches a synthetic `input`
(`src/math-tool.js:311`); the `execCommand` success path relies on the browser's
native `input` event. The handoff should say so, and the fix session should not
change product behavior for this note alone.

### `NOTE-2` — Quick row is a separate constant, not literally drawer data

The package says the quick row "reuses the drawer data (no second list)", but
the quick set contains eight characters absent from the drawer categories
(`± √ × ÷ ≠ ≈ °`), so `QUICK_ROW` is necessarily its own list sharing only
`SYMBOL_NAMES`. Behavior matches the curated quick set. Record the wording
divergence in the handoff or decisions; no code change is required.

## 7. Acceptance coverage

| # | Package acceptance | Result |
|---|---|---|
| 1 | Node suites unchanged; `tests/math-tool.js` all PASS | **PASS.** 60/163/11/9/4 + 16, all green |
| 2 | PHP suites unchanged and PASS; `php -l` on changed PHP | **PASS.** 9 renderer, 8 store, 5 lint clean on PHP 8.3.32 |
| 3 | Quick symbols insert at the remembered caret | **PASS at module level.** Real mount, fallback and `execCommand` paths, single insertion |
| 4 | Drawer toggles with correct `aria-expanded`; every category inserts | **PASS at module level.** Both toggle states; all 86 drawer characters built with names |
| 5 | Mobile tap, target ≥38px | **Not run.** CSS sets 38px at ≤650px; no device or browser available |
| 6 | Keyboard focus and Enter/Space | **PASS by construction**, not exercised in a browser: native `type="button"` controls with labels |
| 7 | Undo | **PASS only on the `execCommand` path by design**; fallbacks are browser-dependent and unverified |
| 8 | Multiline unchanged by insertion | **PASS.** Probe 2 and the mount vector keep `\n\n` and markers exact |
| 9 | Preview stays read-only and refreshes after insertion | **PASS at event level** for the fallback path; the `execCommand` path depends on the native event (`NOTE-1`). Not watched in a browser |
| 10 | Underline unchanged, no second button | **PASS.** Source and mount asserts |
| 11 | Byte counter thresholds, multi-byte, no truncation | **PASS for typed/inserted values**; stale after OCR fill/reset (`FIX-1`) |
| 12 | Admin table summary and renderers | **PASS by unchanged path.** 9 renderer vectors; no renderer byte changed |
| 13 | Native save keeps tags and symbols | **Not run.** No PHP server, browser, database, or staging in this session; no server-side byte changed |
| 14 | Live safety: no live read/write, no deploy | **PASS.** None performed |

## 8. Independent measurements and deployment

Package base `cdbff2b`; live-origin snapshot
`archive/live-sources/admin_questions-2026-10-31.php` (1046 / 62273, SHA-256
`b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028`).

| File | Package diff | Base → final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and direct production-path evidence |
|---|---:|---|---|---|---|
| `src/math-tool.js` | +413 / -0 | absent → 413 / 13335 | `8a8f48073da4c33dfbfb843121dcd00ea2099e14f6d0692ce7fb726bf99654bb` | palette insertion and advisory byte counter for `#question_text` | site root `src/`; `node tests/math-tool.js` requires and mounts the real module |
| `src/math-tool.css` | +133 / -0 | absent → 133 / 2028 | `09f30a164de075dbb3aaff1aed470dd3143f2ed12d5d15bf582132ea69f6a2ce` | palette/counter presentation | site root `src/`; referenced once by the admin page; structural asserts |
| `deployed/admin_questions.php` | +2 / -0 | 1053 / 62540 → 1055 / 62630 | `0a6276c3f5c0f9418062f6f356e8213af2a2e37fb84e2e2fc3dc19363cf8da9f` | one stylesheet link and one script tag | site root; asset-order vector; `php -l` |
| `tests/math-tool.js` | +354 / -0 | absent → 354 / 13729 | — | pure-helper and mount-contract harness | not deployed; requires the real module |

Live-origin additions: **+89 / -80**, independently reproduced, within the
100-addition cap. No owner approval exists or is needed.

**Excluded artifacts, separately:** the P24 inline HTML/CSS/script blocks
(`docs/24-question-underline-and-math.md` unchanged), `cbt_practice.php`,
`src/ui/ui.js`, `ocr_helper.js`, generated `src/bookmarklet.js`, `archive/`
snapshots, `deployed/sql/base-schema.working.sql`, tracked `session-ses_e35a.md`,
and the temporary PHP/probe files outside the workspace. `docs/DEPLOYMENT.md`
and `docs/DEVELOPER-GUIDE.md` rows for the two new assets are assigned to ME02
and are not yet present.

## 9. Verdict and next action

**PASS WITH ACCEPTED FINDINGS** — two `NOTE`s and one `FIX`.

- The module responsibility, deployment path, live-origin cap, and real-module
  test evidence are sound; no `BLOCK` exists.
- `FIX-1` is a real defect on the shipped OCR fill path and must be fixed and
  re-reviewed before ME02. `NOTE-1` and `NOTE-2` are documentation corrections.
- Commit readiness: no cap breach and no unrelated change, but `FIX-1` is
  unresolved, so the package is not commit-ready. This review made no commit;
  `Commit: deferred`.
- Review status: first review round complete for phase 2. `FIX-1` routes to a
  fix session with the frozen contract in section 6.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 2 FIX-1
