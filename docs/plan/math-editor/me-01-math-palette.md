# ME01 — Math Symbol Palette and Byte Counter

- **Status:** not started
- **Depends on:** OT12 review settled (phase 1); shipped underline, preview, and
  renderer behavior (OT04, OT11)
- **Blocks:** ME02
- **External gate:** explicit owner approval for a **+1 addition over the
  externalize-first 100-addition cap** in `deployed/admin_questions.php` (one
  script-tag line; cumulative +101 against
  `archive/live-sources/admin_questions-2026-10-31.php`) **only if the post-OT12
  re-measurement still exceeds 100**; plus the manual Brave/Android and desktop
  Chromium checks in the acceptance table.
- **Baseline note:** plan against the post-OT12 `deployed/` working copies. OT12
  removes the context integration from `admin_questions.php`, so ME01's Gate 1
  must re-measure its cumulative additions; the +1 request may no longer be
  needed.
- **Intent:** [`docs/24-question-underline-and-math.md`](../../24-question-underline-and-math.md)
  as amended by the owner's 2026-11-14 answers (see "Resolved spec delta")

## Goal

Add a curated Tier 1 Unicode symbol palette and a UTF-8 byte counter to the
shipped owner tool. Reuse the existing question preview and the shipped exact
`<u>` renderers. No server, schema, parser, or renderer change.

## Resolved spec delta (owner answers, 2026-11-14)

| P24 section | Disposition |
|---|---|
| §1 underline need | Already shipped: exact `<u>`/`</u>` markers, escape-first renderers, multiline, preview, edit-page tool |
| §3A inline toolbar HTML in `admin_questions.php` | Replaced by a module-generated toolbar; no PHP markup change |
| §3B inline `<style>` block | Appended to the existing `src/owner-tool/owner-tool.css` (not live-origin, no cap) |
| §3C inline page `<script>` | New focused module `src/owner-tool/math-tool.js` |
| §3D `strip_underline_tags()` helper | Already covered by `cbt_strip_formatting()` at `deployed/admin_questions.php:977`; no change |
| §3E `render_candidate_question()` | Already shipped as `deployed/render.php` + `src/owner-tool/render.js`; candidate pages unchanged |
| §4 bookmarklet fill and preview dispatch | Legacy path, not production; no change |
| `<U>text</U>` case-insensitive rendering | **Dropped.** D-66 and the reviewed exact-lowercase boundary stay; a new decision records the rejection |
| `cbt_practice.php` scope | **Excluded**, unchanged from the archived cycle |
| 60,000-**byte** server limit | Editor-side byte counter only; `strlen() > 60000` remains authoritative (`deployed/admin_questions.php:466`) |
| `maxlength="60000"` UTF-16 mismatch | Documented limitation; native `maxlength` is left in place |

## Deliverables

1. **`src/owner-tool/math-tool.js` (new).** One responsibility: the symbol
   palette plus the byte counter. Exports for tests and a self-mounting UI.
   - Pure helpers: `insertAtCaret(value, start, end, insertion)`,
     `wrapSelection(value, start, end, open, close)`, `utf8ByteLength(text)`,
     `byteStatus(bytes, limit)`, and the symbol tables.
   - UI: builds the toolbar, drawer, and counter with `createElement` /
     `textContent` only; no `innerHTML` with data, no network, no storage, no
     form submit, no auto-write.
   - Mounts only when `#question_text` exists, in the add and edit forms alike,
     and is idempotent (a `data-math-tool-mounted` marker). It does not add a
     second Underline button — `#owner_tool_underline` already ships.
2. **`src/owner-tool/owner-tool.css`.** Palette, drawer, and counter styles.
3. **`deployed/admin_questions.php`.** Exactly one added line: a
   `<script src="src/owner-tool/math-tool.js?v=…"></script>` next to the
   existing owner-tool script tags. This is the +1 that needs owner approval.
4. **`tests/math-tool.js` (new).** Node harness asserting the pure helpers and
   the module's structural contracts (no storage keys, no fetch, no writes).

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
  `document.execCommand('insertText', false, insertion)` first (undo-preserving
  on the target browsers); otherwise `setRangeText` plus a manual `input` event;
  otherwise set `.value`. Then restore the caret and remember it again.
- **Underline wrap.** Keep the shipped behavior; the palette never rewrites
  underline markers. The new module's wrap helper exists for tests and is not
  wired to a second button.
- **Preview.** Dispatching `input` on `#question_text` feeds the shipped
  `#owner_tool_preview` (`src/owner-tool/owner-tool.js:2446`) and the native
  validation; the `reset` listener already refreshes it. No second preview box.
- **Byte counter.** `TextEncoder` byte length, shown as `N / 60 000 bytes`
  immediately below the textarea: neutral below 57,000, amber at 57,000–59,999,
  red at 60,000 or more with plain copy that the server may reject the save.
  It never truncates, never disables the native Save button, and never changes
  `maxlength`.
- **Placement.** Toolbar immediately above `#question_text`, drawer between
  toolbar and textarea, counter immediately below the textarea. Do not reorder
  the OT11 sections (paste, shared-text editor, link group, question form).
- **Accessibility.** Every generated button is `type="button"`, focus-visible,
  labelled (`aria-label` from the symbol name, `aria-expanded` on the toggle);
  targets are at least 38px at ≤650px width.

## Non-goals

- Reworking underline, the preview, `render.php`/`render.js`, or D-66.
- Case-insensitive `<U>`/`</U>` rendering or attribute acceptance.
- `cbt_practice.php`, answer-details, CBT delivery, or parser changes.
- Changing the 60,000-byte server limit, error text, `maxlength`, or schema.
- Counters for `answer_explanation` or `context_text` (same limit, later scope).
- LaTeX/MathML/rich text, toolbar for options, images, or a bookmarklet path.
- Any new dependency, build step, or storage key.

## Externalize-first plan (base `134305c`)

| File | Responsibility | Expected additions | Deployment | Direct production-path test |
|---|---|---:|---|---|
| `src/owner-tool/math-tool.js` (new) | palette + byte counter | new module, no cap; keep cohesive | site root `src/owner-tool/` | `node tests/math-tool.js` |
| `src/owner-tool/owner-tool.css` | palette/counter styles | ~60–90 lines; existing phase-cycle module, no cap | site root `src/owner-tool/` | `node tests/math-tool.js` structural asserts |
| `deployed/admin_questions.php` | one script tag | **+1 (100 → 101)**: requires owner approval naming this file and the measured +1 | site root | `node tests/owner-tool.js` asset-order check; `php -l` |
| `tests/math-tool.js` (new) | test harness | new file | not deployed | self |

Excluded artifacts (not deployment files): the spec's inline HTML/CSS/script
blocks, `cbt_practice.php`, `src/ui/ui.js`/`ocr_helper.js`, the archived live
sources, and any local browser profile.

No database, migration, PSR/CSRF, field-name, or flash-text change. No
`questions` schema dependency is added; `question_text` already stores the
markers and Unicode bytes as UTF-8.

## Acceptance

| Check | Expected |
|---|---|
| Node suites | runner 60 PASS / 0 PENDING, unit 163, owner-tool 81 unchanged; `tests/math-tool.js` all PASS |
| PHP suites | All five unchanged and PASS; `php -l` on 8 deployed files plus `db_conn.php` |
| Quick symbols | Each inserts at the remembered caret without re-selecting the textarea |
| Drawer | Toggles with correct `aria-expanded`; every category inserts |
| Mobile tap | Brave/Android: selection retained, symbol lands at the caret, target ≥38px |
| Keyboard | Every palette control is focusable and activates with Enter/Space |
| Undo | `Ctrl+Z` reverts on the `execCommand` path; fallback behavior recorded in the handoff |
| Preview | Palette insertions and bookmarklet-free owner-tool fills refresh `#owner_tool_preview` |
| Byte counter | Neutral/amber/red thresholds exact; multi-byte text counts bytes, not characters; no truncation |
| Admin table summary | `2<x<5` intact, no raw `<u>` tags (regression of `cbt_strip_formatting`) |
| Renderers | `php tests/php-render.php` 9 PASS; `<script>`, `<u onclick>`, `<U>`, and `&lt;u&gt;` remain text |
| Native save | Add and Edit still PRG-save the text with tags and symbols |
| Live safety | No live read or write; no deploy |
