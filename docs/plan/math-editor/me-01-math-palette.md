# ME01 — Math Symbol Palette and Byte Counter

- **Status:** done; review-settled 2026-11-15 (phase-2 re-review PASS, `FIX-1`
  and both notes closed); ME02 later completed
- **Depends on:** ST01 D-91 implementation and light review (satisfied by the
  third phase-1 re-review)
- **Blocks:** ME02
- **External gate:** measured. `deployed/admin_questions.php` is at **+89**
  additions against the designated live snapshot (ST01 +87 plus the two asset
  tags), within the 100-addition cap. Desktop evidence and the owner-accepted
  Brave/Android check are recorded in ME02.
- **Baseline note:** plan against the review-settled post-D-91 ST01 `deployed/`
  working copies and phase boundary. The owner-tool controller is archived, but
  ST01 restores a focused read-only
  `#owner_tool_preview` through `src/question-preview.js`; there is no loaded
  `owner-tool.js` or owner-tool CSS.
- **Intent:** [`docs/24-question-underline-and-math.md`](../../24-question-underline-and-math.md)
  as amended by the owner's 2026-11-14 answers and the ST01 reset.

## Goal

Add a curated Tier 1 Unicode symbol palette and a UTF-8 byte counter to the
native `#question_text` field. Reuse the shipped exact-`<u>` renderers. No
server, schema, parser, or renderer change.

## Resolved spec delta (ST01 + owner answers, 2026-11-14)

| P24 section | Disposition |
|---|---|
| §1 underline need | Already shipped by ST01: exact `<u>`/`</u>`, escape-first renderers, multiline, runtime Underline button |
| §3A inline toolbar HTML | Replaced by a module-generated toolbar; no PHP markup change |
| §3B inline `<style>` block | New non-live-origin `src/math-tool.css` |
| §3C inline page `<script>` | New focused `src/math-tool.js` |
| §3D `strip_underline_tags()` | Covered by `cbt_strip_formatting()`; no change |
| §3E `render_candidate_question()` | Covered by `deployed/render.php` + `src/owner-tool/render.js`; no change |
| §4 bookmarklet fill and preview dispatch | Legacy path, not production; no change |
| `<U>text</U>` case-insensitive rendering | **Dropped.** D-66 and the exact-lowercase boundary stay |
| `cbt_practice.php` scope | **Excluded** |
| 60,000-**byte** server limit | Editor-side byte counter only; `strlen() > 60000` remains authoritative |
| `maxlength="60000"` UTF-16 mismatch | Documented limitation; native `maxlength` stays |
| Owner-tool preview | Replaced by ST01's focused read-only Constant Text/Question preview; preserve it and let palette `input` events refresh it |

## Deliverables

1. **`src/math-tool.js` (new).** One responsibility: the symbol palette plus the
   byte counter. Exports for tests and a self-mounting UI.
   - Pure helpers: `insertAtCaret(value, start, end, insertion)`,
     `utf8ByteLength(text)`, `byteStatus(bytes, limit)`, and the symbol tables.
   - UI: builds the toolbar, drawer, and counter with `createElement` /
     `textContent` only; no `innerHTML` with data, no network, no storage, no
     form submit, no auto-write.
   - Mounts only when `#question_text` exists, in Add and Edit forms alike, and
     is idempotent (`data-math-tool-mounted`). It does not add a second
     Underline button; ST01's `#owner_tool_underline` remains the only one.
   - Never rewrites line breaks, underline markers, or existing Unicode.
2. **`src/math-tool.css` (new).** Palette, drawer, counter, focus, and mobile
   target styles. Non-live-origin, so no addition cap.
3. **`deployed/admin_questions.php`.** Exactly two added lines next to the
   existing ST01 assets: one stylesheet link and one script tag. Expected
   cumulative additions **+89**.
4. **`tests/math-tool.js` (new).** Node harness asserting the pure helpers and
   the module's structural contracts (no storage keys, no fetch, no writes, no
   second underline button).

## Curated Tier 1 symbol set

Quick row (always visible): `x² x³ xⁿ x₁ x₂ ± √ × ÷ ≠ ≈ ° ½ π θ`.

Drawer categories:

- **Exponents:** `⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ⁿ ˣ ʸ`
- **Subscripts:** `₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ₊ ₋ ₐ ₑ ᵢ ₒ ᵤ ₓ`
- **Fractions:** `½ ⅓ ⅔ ¼ ¾ ⅕ ⅖ ⅗ ⅘ ⅙ ⅚ ⅛ ⅜ ⅝ ⅞`
- **Greek:** `α β γ δ ε θ λ μ π ρ σ τ φ ω Δ Ω Σ`
- **Set theory and logic:** `∈ ∉ ⊂ ⊆ ∪ ∩ ∅ ∧ ∨ ¬ ⇒ ⇔`
- **Geometry and vectors:** `∠ ⊥ ∥ △ → ← ↔ ↑ ↓`

The quick row reuses the drawer data (no second list). The spec's `∡` and the
duplicate `x²` button label are dropped; `½` appears once in the quick row and
once in the drawer category by design.

## Behavior detail

- **Insertion.** Remember the selection on `select`, `keyup`, `mouseup`,
  `touchend`, and `input`, because a toolbar tap blurs the textarea. On insert:
  `document.execCommand('insertText', false, insertion)` first
  (undo-preserving); otherwise `setRangeText` plus a manual `input` event;
  otherwise set `.value`. Then restore the caret and remember it again.
- **Underline.** Keep ST01's behavior; the palette never rewrites underline
  markers and never creates malformed pairs.
- **Multiline.** Do not collapse or rewrite line breaks. The native textarea
  and read-only preview keep them, and the CBT/answer-details
  `white-space: pre-wrap` paths still render them.
- **Byte counter.** `TextEncoder` byte length, shown as `N / 60 000 bytes`
  immediately below the textarea: neutral below 57,000, amber at 57,000–59,999,
  red at 60,000 or more with plain copy that the server may reject the save.
  It never truncates, disables the native Save button, or changes `maxlength`.
- **Placement.** Toolbar immediately above `#question_text`, drawer between
  toolbar and textarea, counter immediately below the textarea and before the
  read-only preview. Do not reorder the Constant Text, question, options, or
  answer sections.
- **Accessibility.** Every generated button is `type="button"`, focus-visible,
  labelled (`aria-label` from the symbol name, `aria-expanded` on the toggle);
  targets are at least 38px at ≤650px width.

## Non-goals

- Reworking underline, render.php/render.js, or D-66.
- Case-insensitive `<U>`/`</U>` rendering or attribute acceptance.
- Changing/removing the focused read-only preview or loading the archived owner
  tool controller.
- `cbt_practice.php`, answer-details, CBT delivery, or parser changes.
- Changing the 60,000-byte server limit, error text, `maxlength`, or schema.
- Counters for Constant Text, options, or `answer_explanation`.
- LaTeX/MathML/rich text, toolbar for options, images, or a bookmarklet path.
- Any new dependency, build step, or storage key.

## Externalize-first plan (post-ST01 baseline)

| File | Responsibility | Expected additions | Deployment | Direct production-path test |
|---|---|---:|---|---|
| `src/math-tool.js` (new) | palette + byte counter | new module, no cap; keep cohesive | site root `src/` | `node tests/math-tool.js` |
| `src/math-tool.css` (new) | palette/counter styles | new file, no cap | site root `src/` | `node tests/math-tool.js` structural asserts |
| `deployed/admin_questions.php` | one stylesheet link + one script tag | **+2** (87 → 89) | site root | `node tests/math-tool.js` asset-order source check; `php -l` |
| `tests/math-tool.js` (new) | test harness | new file | not deployed | self |

Excluded artifacts: the spec's inline HTML/CSS/script blocks, `cbt_practice.php`,
`src/ui/ui.js`/`ocr_helper.js`, the archived live sources, archived owner-tool
files, and any local browser profile.

No database, migration, PSR/CSRF, field-name, or flash-text change. No
`questions` schema dependency is added; `question_text` already stores the
markers and Unicode bytes as UTF-8.

## Acceptance

| Check | Expected |
|---|---|
| Node suites | runner 60 PASS / 0 PENDING, unit 163, and the reviewed post-D-91 ocr-helper count, underline 9, preview 4 unchanged; `tests/math-tool.js` all PASS |
| PHP suites | php-render 9 and admin-store 8 unchanged and PASS; `php -l` on changed deployed PHP |
| Quick symbols | Each inserts at the remembered caret without re-selecting the textarea |
| Drawer | Toggles with correct `aria-expanded`; every category inserts |
| Mobile tap | Brave/Android: selection retained, symbol lands at the caret, target ≥38px |
| Keyboard | Every palette control is focusable and activates with Enter/Space |
| Undo | `Ctrl+Z` reverts on the `execCommand` path; fallback behavior recorded in the handoff |
| Multiline | Existing line breaks and blank-line paragraphs are unchanged; no `\n` is added or removed by a symbol insert |
| Preview | Constant Text/Question preview stays read-only and refreshes after symbol insertion |
| Underline | ST01 button still wraps/unwraps only the last-focused field; no second Underline button appears |
| Byte counter | Neutral/amber/red thresholds exact; multi-byte text counts bytes, not characters; no truncation |
| Admin table summary | `2<x<5` intact, no raw `<u>` tags (regression of `cbt_strip_formatting`) |
| Renderers | `php tests/php-render.php` 9 PASS; `<script>`, `<u onclick>`, `<U>`, and `&lt;u&gt;` remain text |
| Native save | Add and Edit still PRG-save the text with tags and symbols |
| Live safety | No live read or write; no deploy |

## Decisions to record

- **D-92:** the palette is a new non-live-origin `src/math-tool.js` with
  `src/math-tool.css`; the admin page adds only one stylesheet link and one
  script tag. No archived owner-tool code returns.
- **D-93:** the byte counter is editor-side and advisory only; the server's
  60,000-byte check remains authoritative, and `maxlength` is unchanged.

## Handoff — 2026-11-15

**Result:** ME01 implemented on the review-settled ST01 tree. Package base
`cdbff2b`; no commit was made.

### Files and measurements

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and production-path evidence |
|---|---:|---:|---|---|---|
| `src/math-tool.js` (new) | +413 / -0 | 413 / 13335 | `8a8f48073da4c33dfbfb843121dcd00ea2099e14f6d0692ce7fb726bf99654bb` | palette insertion and advisory byte counter for `#question_text` | site root `src/`; `node tests/math-tool.js` requires the real module and mounts it in a DOM shim |
| `src/math-tool.css` (new) | +133 / -0 | 133 / 2028 | `09f30a164de075dbb3aaff1aed470dd3143f2ed12d5d15bf582132ea69f6a2ce` | palette, drawer, counter, focus, and mobile target styles | site root `src/`; loaded once by the admin page; structural asserts in `tests/math-tool.js` |
| `deployed/admin_questions.php` | +2 / -0 | 1055 / 62630 | `0a6276c3f5c0f9418062f6f356e8213af2a2e37fb84e2e2fc3dc19363cf8da9f` | one stylesheet link and one script tag beside the ST01 assets | site root; asset-order check in `tests/math-tool.js`; `php -l` |
| `tests/math-tool.js` (new) | +354 / -0 | 354 / 13729 | — | pure-helper and mount-contract harness | not deployed |

Live-origin cap against the designated snapshot
`archive/live-sources/admin_questions-2026-10-31.php` (1046 / 62273):
`deployed/admin_questions.php` is **+89 / -80**, within the 100-addition cap and
matching the Gate 1 estimate exactly. No exception exists or is needed.

Excluded artifacts, separately: the P24 inline HTML/CSS/script blocks
(`docs/24-question-underline-and-math.md` unchanged), `cbt_practice.php`,
`src/ui/ui.js`, `ocr_helper.js`, generated `src/bookmarklet.js`, `archive/`
snapshots, `deployed/sql/base-schema.working.sql`, `session-ses_e35a.md`, and
the static PHP CLI fetched into `$HOME` for local checks.

### Commands and results

```sh
node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  # 163 PASS
node tests/ocr-helper.js            # 11 PASS
node tests/underline-toolbar.js     # 9 PASS
node tests/question-preview.js      # 4 PASS
node tests/math-tool.js             # 16 PASS
node tools/extract-bank.js --check  # source, anchors, counts, 7 hashes OK
php tests/php-render.php            # 9 PASS (PHP 8.3.32)
php tests/admin-question-store.php  # 8 PASS (PHP 8.3.32)
php -l                              # 5 deployed PHP files and staging cbt_db.php PASS
node --check src/math-tool.js tests/math-tool.js  # PASS
git diff --check                    # clean
```

PHP was absent from this cloud VM; the declared PHP 8.3 target was exercised
with a static-php-cli PHP 8.3.32 binary kept outside the workspace. MySQL,
browser, staging, and live checks were not run.

### Acceptance mapping

| Check | Result |
|---|---|
| Node/PHP baselines unchanged | **PASS** (60/163/11/9/4, renderer 9, store 8) |
| Quick symbols insert at the remembered caret | **PASS** at module level: real `init` mount, button click, `setRangeText` fallback and `execCommand` path |
| Drawer toggles and `aria-expanded` | **PASS** at module level for both states |
| Keyboard activation | **PASS by construction**: every generated control is a native `type="button"` with `aria-label`; real browser focus order not exercised |
| Undo | **PASS on the `execCommand` path by design**; the `setRangeText`/`.value` fallbacks are browser-dependent and not exercised in a browser |
| Multiline preservation | **PASS**: insertion helper and mount test keep `\n\n` unchanged |
| Preview refresh after insertion | **PASS at event level**: the `setRangeText`/`.value` fallback dispatches a synthetic `input`, and the `execCommand` success path relies on the browser's native `input` event (corrected by review `NOTE-1`); not watched in a browser |
| Underline unchanged, no second button | **PASS**: source and mount asserts find no `owner_tool_underline` / `<u>` writes |
| Byte counter thresholds and multi-byte counting | **PASS**: 56,999 neutral, 57,000 amber, 59,999 amber, 60,000 red; `±`×30,000 = 60,000 bytes |
| No truncation, `maxlength` untouched, Save not disabled | **PASS** in the mount test |
| Admin table summary and renderers | **PASS by unchanged path** (renderer 9 vectors); no renderer/PHP logic changed |
| Native save | Not re-run: no PHP server, browser, or database is available in this VM; no server-side byte changed |
| Mobile tap, ≥38px targets, Brave/Android | **Not run**; owner Brave/Android and desktop checks remain ME02 evidence |

### Open questions and review status

- Real-browser undo and mobile selection retention on Brave/Android remain
owner-accepted checks; only the `execCommand` path is undo-preserving by design.
- `maxlength="60000"` (UTF-16) versus the 60,000-byte server check stays a
documented limitation; neither was changed.
- ME02 still owns the asset version tokens, `docs/DEPLOYMENT.md` and
`docs/DEVELOPER-GUIDE.md` rows for the two new files, and browser evidence.
- Review status: review-settled by the phase-2 closure re-review; `FIX-1` and
both notes are closed. The notes were handled as documentation corrections
without product change.

**Commit:** deferred. No file was staged or committed.

## Fix Note — 2026-11-15 (`FIX-1`)

**Authority:** phase-2 review record
[`math-editor-2026-11-phase-2.md`](../reviews/math-editor-2026-11-phase-2.md),
`FIX-1` in its first review round. The frozen closure contract is unchanged.

**Defect:** the counter kept an older reading after the page's own OCR Load or
Skip filled `#question_text` directly, and after a native form reset. It showed
`neutral | 1 / 60 000 bytes` while the field held 60 000 bytes.

**Failing-first evidence:** a new vector,
`counter refreshes after OCR load, OCR skip, and native form reset`, was added
to `tests/math-tool.js` before the module change. It failed at the load
assertion with `'neutral' !== 'red'`; the other 16 vectors passed.

**Change:** `src/math-tool.js` only, after the existing textarea listeners. It
now defers one existing `updateCounter` call on the owner form's `reset` event
(via `textarea.form`) and on `#ocr_load` / `#ocr_skip` clicks when those controls
exist, using `root.setTimeout(updateCounter, 0)` with an immediate fallback and
mirroring `src/question-preview.js:86-98`. No symbol, insertion, mounting,
counter-threshold, storage, network, submit, form-value, Underline, `maxlength`,
CSS, admin-page, PHP, or server behavior changed.

### Frozen closure matrix

| `FIX-1` criterion | Implementation | Evidence |
|---|---|---|
| 1. Fresh reading after load/skip and reset, red at ≥60 000 | deferred `updateCounter` on `#ocr_load`, `#ocr_skip`, and form `reset` | new vector asserts 60 000 bytes → `red`/`60 000 / 60 000 bytes` after load and reset, and a small skip fill → `neutral`; independent probe reproduced both |
| 2. Same update path, no adjacent behavior | reuses `updateCounter`; no new key, request, submit, value write, or control | source-boundary vector (no storage/fetch/submit/`innerHTML`/`constant_text`/`owner_tool_underline`) and mount vector still pass; `git diff` limited to the module and harness |
| 3. Existing vectors green; real-module refresh vector | 16 prior vectors untouched, one added | `node tests/math-tool.js`: 17 PASS; vectors require and mount the real module |

### Measurements

| File | Package diff | Previous → final lines / bytes | SHA-256 (LF) | Deployment |
|---|---:|---|---|---|
| `src/math-tool.js` | +432 / -0 | 413 / 13335 → 432 / 13974 | `fee1d8b393e64e39457186a345e6e5d4227d21f79f885d44983554bdb69c6d14` | site root `src/` |
| `tests/math-tool.js` | +387 / -0 | 354 / 13729 → 387 / 14947 | `239cda8712c875460fbddb4eb2cb255326d29802dfa87bf09e8c58c999fec13a` | not deployed |
| `deployed/admin_questions.php` | +2 / -0 | 1055 / 62630 (unchanged) | `0a6276c3f5c0f9418062f6f356e8213af2a2e37fb84e2e2fc3dc19363cf8da9f` | site root |

Live-origin cap remains **+89 / −80** against
`archive/live-sources/admin_questions-2026-10-31.php`; no exception is needed.
Excluded artifacts are unchanged from the handoff.

### Commands and results

```sh
node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  # 163 PASS
node tests/ocr-helper.js            # 11 PASS
node tests/underline-toolbar.js     # 9 PASS
node tests/question-preview.js      # 4 PASS
node tests/math-tool.js             # 17 PASS
node tools/extract-bank.js --check  # 7 hashes OK
php tests/php-render.php            # 9 PASS (PHP 8.3.32)
php tests/admin-question-store.php  # 8 PASS (PHP 8.3.32)
php -l                              # 5 deployed PHP files PASS
node --check src/math-tool.js tests/math-tool.js  # PASS
git diff --check                    # clean
```

**Review notes handled without product change:** `NOTE-1` corrected the
acceptance wording for the `execCommand` path above. `NOTE-2`: `QUICK_ROW`
remains its own 15-entry constant because eight quick characters
(`± √ × ÷ ≠ ≈ °`) are not in the drawer categories; the curated set matches the
package and the wording divergence is recorded here.

**Not run:** browser, mobile, undo, native save, MySQL, staging, or live checks;
re-review is required after this behavior change.

**Commit:** deferred. No file was staged or committed.

## Review Settlement — 2026-11-15

**Review:**
[`math-editor-2026-11-phase-2-re-review.md`](../reviews/math-editor-2026-11-phase-2-re-review.md)
returned `PASS`. It closed `FIX-1` on every frozen criterion, closed `NOTE-1`
(the `execCommand` preview wording) and `NOTE-2` (the quick-row constant), and
introduced no new finding. Independent probes covered a mount without the new
controls, a load → skip → load → reset sequence, deferred `setTimeout` ordering,
`execCommand`-false fallback, marker/newline preservation, and idempotent
mounting.

**Status:** ME01 is done and review-settled. ME02 may proceed to its read-only
Gate 1. Brave/Android, desktop, native-save, MySQL, and deployment evidence
remain ME02/release gates.

**Commit:** the owner explicitly requested the phase-boundary commit and push.
