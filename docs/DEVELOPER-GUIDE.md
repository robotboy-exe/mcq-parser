# Developer Guide — Constant Text, Math Editor, and English Lexis

Recorded: 2026-11-14; amended through 2026-11-17 for D-91–D-96. This is the
human-developer handoff for ST01, the math editor, and EL01 in the
`math-editor-2026-11` cycle. It covers the production architecture, source of
truth, stored state, parser extension rules, Constant Text lifecycle, the math
palette and byte counter, English Lexis ordering, the security renderer,
testing commands, and known limitations. Deployment steps are in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## 1. Architecture map

| File | Responsibility |
|---|---|
| `deployed/admin_questions.php` | Question entry point: session/CSRF, login, native question form, Constant Text, PRG dispatch, and asset wiring. Requires `admin_question_store.php`; loads root `ocr_helper.js`, the underline tool, and the read-only preview. |
| `deployed/admin_question_store.php` | Extracted standalone save/delete transaction with explicit column lists and `constant_text` null-when-empty. |
| `deployed/cbt.php` | Standalone CBT delivery: subject/category/year queries, limited random selection, EL01 post-selection ordering call, exam UI, Constant Text block, exact-`<u>` questions/options, result panel. Loads `src/owner-tool/render.js`. |
| `deployed/cbt_question_order.php` | Focused exact-subject grouping of already-selected English Lexis rows; original-order members (ascending `id`), shuffled groups, blank singletons. |
| `deployed/answer_details.php` | Answer explanation page. Uses `render.php` for Constant Text, questions, options, and explanations. |
| `deployed/render.php` | Server-side safe renderer: escape first, restore only exact `<u>`/`</u>`. |
| `ocr_helper.js` | Shipping OCR helper. Parses pasted OCR into the native form, preserves blank-line paragraphs, fills `ocrQueue`/`ocrMeta`, and never submits. |
| `src/underline-toolbar.js` | Runtime Underline button for Constant Text, question text, and options A–D. |
| `src/question-preview.js` / `.css` | Read-only Constant Text/Question preview, rendered with `window.CBTText` and `white-space: pre-wrap`; no form, storage, or network writes. |
| `src/math-tool.js` | Math symbol palette and advisory UTF-8 byte counter around `#question_text`, mounted once in Add and Edit forms with `data-math-tool-mounted`; inserts only at the remembered caret and writes no storage, network, submit, underline marker, or `constant_text`. |
| `src/math-tool.css` | Palette, drawer, counter, focus, and mobile-target styles; all selectors are `.math-tool-*` (D-92). |
| `src/owner-tool/render.js` | Browser safe renderer (`window.CBTText`) used by `cbt.php`. The legacy context-card helpers remain in the file but no page calls them. |
| `src/parser/core.js` | Pure parser 2.3.3, retained for the historical parser fixture suite. Not loaded by the production admin page. |
| `deployed/sql/base-schema.working.sql` | Working schema copy, now including `constant_text`. |
| `deployed/sql/01-constant-text.sql` | Guarded, rerunnable forward migration. |
| `deployed/sql/02-constant-text-rollback.sql` | Guarded rollback that refuses non-empty data. |
| `deployed/sql/03-english-lexis-structure.sql` | Guarded, rerunnable exact-name subject insert/reactivation with a generated ID. |
| `deployed/sql/04-english-lexis-structure-rollback.sql` | Non-destructive exact-name subject deactivation. |
| `deployed/sql/README.md` | Migration/rollback runbook. |

**Ownership.** The production path is root `ocr_helper.js` plus the native
admin form. The shared-text/context subsystem and the legacy bookmarklet are
archived under `archive/owner-tool-2026-11/`; do not load or extend them. The
`src/owner-tool/context*` helper functions inside `render.js` are inert and
kept only because that file is shared with `cbt_practice.php`.

**Math editor (ME01/ME02, D-92–D-94).** One pair of assets serves the native
form. The module builds its toolbar, drawer, and counter from the curated
symbol tables with `createElement`/`textContent`, remembers the textarea
selection across toolbar focus loss, and inserts through
`execCommand('insertText')` then `setRangeText` then `.value`; it never rewrites
line breaks or underline markers. The quick row is 15 symbols and the drawer
has six categories; `½` intentionally appears in both. The Fractions category
also has a Custom row: enter a numerator and denominator, then press Insert
(or Enter) to insert the fraction at the remembered caret. Supported values use
the matching vulgar glyph (`1/2` → `½`); other values become a superscript
numerator, fraction slash, and subscript denominator (`3/7` → `³⁄₇`). The
Underline button sits at the far right of the Question label row on desktop and
mobile.
The counter is advisory
(neutral below 57,000 bytes, amber at 57,000–59,999, red at 60,000+) and
refreshes after typing, the page's OCR Load/Skip, and a native form reset. The
admin page loads both files with `?v=1.0.0`; no other page references them,
and `cbt.php`/`cbt_practice.php` keep their own `render.js` tokens.

**English Lexis (EL01, D-95–D-96).** The subject operation inserts
`English (Lexis & Structure)` without an ID or reactivates a byte-exact existing
row without changing its other fields. A collation-only collision is refused;
rollback only deactivates. In candidate delivery, the existing SQL still picks
the active filtered rows with `ORDER BY RAND()` and the default limit of 50.
Only then does `cbt_question_order.php` group equal non-empty exact
`constant_text`, shuffle groups, and restore each group's original question
order (ascending `id`). `NULL` and empty
values remain independent. Every selected row still carries and renders its own
passage; other subjects and `cbt_practice.php` are unchanged.

## 2. Source of truth

- Product intent: `INTENT.md`.
- Behavior spec: `docs/SPEC.md`; rationale: `docs/DECISIONS.md`.
- Test status: `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`, `docs/STATUS.md`.
- Detailed agent contract: `docs/AGENTS.md`.
- Live safety: `docs/LIVE-SAFETY.md`.
- Archived migration docs and live sources: `archive/migration-docs/`,
  `archive/live-sources/`.
- Supplied SQL is archived unchanged at `archive/sql/2026-11-03-supplied/`; the
  only working-copy correction is `exam_category2` → `exam_category` in
  `deployed/sql/base-schema.working.sql`.

## 3. Stored state

The production helper uses only:

```text
ocrQueue = { items: [question...], i: number }
ocrMeta  = { subject_id, exam_category_id, exam_year }
```

- There is no queue version marker. After changing the helper, press Reset and
  re-paste rather than trusting an old queue (EC-62/INV-56).
- Do not rename either key or change their shapes. They are shared with the live
  helper origin.
- The helper does not read or write `ansKey`, `cbtOwnerTool:v1`, or any
  Auto-Save key. It keeps the legacy `ocrSubmitted` marker: written on form
  submit, then deleted on the next load while the queue advances (live-helper
  parity).
- Loading, parsing, and filling write no server row. Only the native form submit
  saves.
- Constant Text is server-side session state, not `localStorage`.
- The OCR helper never reads or writes `constant_text`; the preview reads that
  field but never changes it. The palette and counter also write no storage,
  network request, form value, or submit, and add no grep-visible state key.

## 4. Parser extension rules

- Root `ocr_helper.js` must stay usable both as a browser script and as a Node
  module. Keep the pure exports `{ FIXES, OPTION, splitQuestions, parseQuestion }`
  above the DOM guard.
- Multiline rule: fold single wrapped stem lines to one space, preserve real
  blank-line paragraphs as `\n\n`, and keep options single-line. Never replace
  this with a blanket whitespace collapse; `tests/ocr-helper.js` guards it.
- D-91 requires A-D labels case-insensitively in bare dotted, bare
  closing-parenthesis, parenthesized, and parenthesized-plus-dot forms.
  Whitespace is optional after `(`, before `)`, and before `.`, while every
  unspaced form remains valid. A later label-like repeat of an already selected
  letter stays in that option's text and does not alone raise the duplicate
  warning. Keep uppercase normalization and the question splitter's lookahead;
  the legacy unnumbered fallback can still queue text with review flags but
  never writes Constant Text (D-89).
- The second phase-1 re-review showed that pre-fix `84be892` replaced the real A
  boundary in `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four`.
  The review-settled replacement keeps the first selected boundary and has
  direct regression coverage; the third re-review closed `FIX-1`.
- Keep `src/parser/core.js` pure: no DOM, storage, network, or UI references.
  Bump `PARSER_VERSION` and relevant asset tokens for a behavior change to the
  historical parser; the current version is `2.3.3`.
- Add doc-backed fixtures in `fixtures/inputs/` and `fixtures/expected/*.json`.
  Never generate expected output from the parser; mark doc-unsupported fields
  `PENDING`. Root helper checks live in `tests/ocr-helper.js` with inputs under
  `tests/fixtures/`.
- Preserve the deliberate quirks and dangerous-area rules in `docs/AGENTS.md`
  (E/F→D, `splitQuestions` numbering guard, advisory flags, blank options,
  `FIXES` order, divider-only section separators, exact renderer markers).

## 5. Constant Text lifecycle

1. The admin form always shows an optional full-width Constant Text textarea
   named `constant_text`; the native CSRF/PRG form and four-option rule are
   unchanged.
2. On a successful save/update, the server stores the trimmed passage (or
   `NULL`) and sets `$_SESSION['cbt_admin_constant_text']`.
3. A new-question GET prefills only that session value. An `?edit=` GET shows the
   row value and must not overwrite the session. Login and logout clear the
   session value.
4. Constant Text renders above the question in `cbt.php` and
   `answer_details.php`. It is not shown in the result sheet or
   `cbt_practice.php`.
5. Exact lowercase `<u>`/`</u>` formatting applies to Constant Text, question
   text, and options. The Underline button acts on the last-focused field and
   refuses partial marker overlap or nested pairs.
6. Blank-line paragraphs survive in Constant Text and question stems through
   `white-space: pre-wrap`; single wraps fold to one space, and options stay
   one line.

## 6. Security renderer

- Escape first; only exact lowercase `<u>` and `</u>` pairs are formatting.
  Everything else, including attributes, other tags, and encoded markers, stays
  text.
- `deployed/render.php` and `src/owner-tool/render.js` are behaviorally paired.
  Question, Constant Text, and options use the renderer; explanations stay plain
  text.
- Never use permissive `strip_tags` or raw `innerHTML` for stored question,
  Constant Text, option, explanation, or context text.
- The legacy cloze `[[gap:N]]` context helpers render only if a caller passes
  context data; production pages do not.

## 7. Testing commands

```sh
node tests/runner.js
node tests/unit.js
node tests/ocr-helper.js
node tests/underline-toolbar.js
node tests/question-preview.js
node tests/math-tool.js
node tools/extract-bank.js --check
php tests/php-render.php
php tests/admin-question-store.php
php tests/cbt-question-order.php
```

Current local evidence through 2026-11-17. The D-91 fix run used PHP 8.5.12 for
the unchanged PHP suites/lint; the original review separately passed PHP 8.3.32:

- runner: 60 fixtures, 60 PASS, 0 FAIL, 0 PENDING;
- unit: 163 PASS;
- root helper: 11 PASS, including the complete D-91 spacing grammar, selected
  boundaries, and duplicate-set warning controls;
- underline toolbar: 10 PASS;
- read-only preview: 4 PASS;
- math palette/byte counter: 20 PASS (real module and mount);
- PHP renderer: 9 PASS; admin store: 8 PASS;
- English Lexis ordering/wiring: 11 PASS against the real module and real
  `cbt.php`;
- `php -l` on every changed PHP file: PASS;
- `node tools/extract-bank.js --check`: PASS with all 7 source, slice, and
  output hashes matching;
- civic fixture: 50/50 questions, no flags;
- option-label fixture: 6 forms, no flags; the added spaced-period vector passes;
- multiline helper vector: single wraps fold, blank-line paragraph remains;
- local SQLite phone-staging: login, save with multiline `<u>` Constant Text,
  new-question prefill, edit row load, update with empty value to `NULL`, logout
  clear, delete, and two-session isolation all PASS.
- disposable Chromium at 390px: preview has no editable controls or overflow,
  both blocks use `pre-wrap`, exact underlines render, and a passage/cloze OCR
  paste leaves the prefilled Constant Text unchanged.
- ME02 disposable SQLite staging in Chrome 156.0.0.0: the palette mounts once on
  `#question_text`, quick-row, drawer, and keyboard insertion land at the
  remembered caret, `Ctrl+Z` reverts on the `execCommand` path, the preview
  refreshes, thresholds read neutral 32 / amber 57 000 / red 60 000 with the
  warning visible, a native reset refreshes the counter to `0 / 60 000 bytes`,
  and a native save flashed `Question saved successfully (Question ID: 102).`
  with the stored `<u>` markers and `x²` round-tripping through the edit page.
- EL01 disposable HTTP staging through the real `cbt.php`: 6 PASS for the
  default 50 limit, active/category/year filters, unchanged row payloads,
  contiguous repeated passages, one attempt insert, and per-row safe rendering.
- The real EL01 `03`/`04` operations pass 8 absent/inactive/active/rerun,
  collision, rollback, no-delete, and schema-contract probes on isolated Oracle
  MySQL Community Server 8.0.41 ARM64. An earlier MariaDB 13.0.2 run was
  preliminary only and is not the acceptance evidence.

No live site, production database, or production cleanup was used. The owner
accepted the ME02 Brave/Android check on 2026-11-17. The EL01 subject operation
passed its required disposable MySQL 8.0.41 run.

## 8. Known limitations and open gates

- Phase 1 is review-settled. The third re-review closed D-91 `FIX-1`, and
  `FIX-2` remains closed.
- `questions.practice_title` is `NOT NULL` with no default in the supplied DDL,
  while the admin INSERT omits it. This is a known out-of-scope mismatch.
  Verify the target before deploying; do not change the column in this release.
- PDO `charset=utf8mb4` alone reports `utf8mb4_general_ci` on MySQL 8.0.41; the
  target connector/server must set the session collation.
- `header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts and
  are not supplied. Do not deploy inferred local shims.
- `cbt_practice.php` does not render Constant Text in ST01 and remains
  intentionally untouched.
- `bank-2021` still raises a duplicate-C flag on its final question from OCR
  answer-key text; this is pre-existing and not a missing-option regression.
- The ST01 schema migration has not been run against MySQL in this phase.
- `maxlength="60000"` counts UTF-16 code units while the server checks UTF-8
  bytes; the editor counter is advisory and neither limit was changed (D-93).
- Palette undo is reliable only on the `execCommand` path; the
  `setRangeText`/`.value` fallbacks are browser-dependent (D-92).
- There is no browser test suite. ST01 behavior is covered by Node/PHP checks,
  static source assertions, and owner browser evidence. ME01/ME02 add 20 module
  vectors and disposable staging browser evidence; the owner accepted the
  Brave/Android check on 2026-11-17.
- EL01's `tests/english-lexis-sql.sh` passed 8 checks against an isolated
  disposable MySQL 8.0.41 server; production execution still needs the
  deployment backup, target preflight, and explicit owner authorization.
- This cycle does not deploy to production, clean live data, or archive itself
  without explicit owner instructions.

## 9. References

- Deployment: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Package plan: [`plan/README.md`](plan/README.md)
- ST01 contract:
  [`plan/owner-tool/st-01-constant-text-reset.md`](plan/owner-tool/st-01-constant-text-reset.md)
- EL01 contract:
  [`plan/el-01-english-lexis-grouping.md`](plan/el-01-english-lexis-grouping.md)
- Migration runbook: [`../deployed/sql/README.md`](../deployed/sql/README.md)
