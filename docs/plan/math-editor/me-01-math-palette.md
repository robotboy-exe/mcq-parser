# ME01 — Math Symbol Palette and Byte Counter

- **Status:** not started
- **Depends on:** ST01 handed off and its light review settled at this Gate 1
- **Blocks:** ME02
- **External gate:** none expected. `deployed/admin_questions.php` is at **+87**
  additions after ST01; the two new asset tags are expected to bring it to
  **+89**, still within the 100-addition cap. Gate 1 must re-measure.
- **Baseline note:** plan against the post-ST01 `deployed/` working copies. The
  owner-tool controller is archived, but ST01 restores a focused read-only
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
| Node suites | runner 60 PASS / 0 PENDING, unit 163, ocr-helper 7, underline 9, preview 4 unchanged; `tests/math-tool.js` all PASS |
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

- **D-91:** the palette is a new non-live-origin `src/math-tool.js` with
  `src/math-tool.css`; the admin page adds only one stylesheet link and one
  script tag. No archived owner-tool code returns.
- **D-92:** the byte counter is editor-side and advisory only; the server's
  60,000-byte check remains authoritative, and `maxlength` is unchanged.
