# Developer Guide — Constant Text Reset (ST01)

Recorded: 2026-11-14. This is the human-developer handoff for ST01 in the
`math-editor-2026-11` cycle. It covers the production architecture, source of
truth, stored state, parser extension rules, Constant Text lifecycle, the
security renderer, testing commands, and known limitations. Deployment steps are
in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## 1. Architecture map

| File | Responsibility |
|---|---|
| `deployed/admin_questions.php` | Question entry point: session/CSRF, login, native question form, Constant Text, PRG dispatch, and asset wiring. Requires `admin_question_store.php`; loads root `ocr_helper.js`, the underline tool, and the read-only preview. |
| `deployed/admin_question_store.php` | Extracted standalone save/delete transaction with explicit column lists and `constant_text` null-when-empty. |
| `deployed/cbt.php` | Standalone CBT delivery: subject/category/year queries, exam UI, Constant Text block, exact-`<u>` questions/options, result panel. Loads `src/owner-tool/render.js`. |
| `deployed/answer_details.php` | Answer explanation page. Uses `render.php` for Constant Text, questions, options, and explanations. |
| `deployed/render.php` | Server-side safe renderer: escape first, restore only exact `<u>`/`</u>`. |
| `ocr_helper.js` | Shipping OCR helper. Parses pasted OCR into the native form, preserves blank-line paragraphs, fills `ocrQueue`/`ocrMeta`, and never submits. |
| `src/underline-toolbar.js` | Runtime Underline button for Constant Text, question text, and options A–D. |
| `src/question-preview.js` / `.css` | Read-only Constant Text/Question preview, rendered with `window.CBTText` and `white-space: pre-wrap`; no form, storage, or network writes. |
| `src/owner-tool/render.js` | Browser safe renderer (`window.CBTText`) used by `cbt.php`. The legacy context-card helpers remain in the file but no page calls them. |
| `src/parser/core.js` | Pure parser 2.3.3, retained for the historical parser fixture suite. Not loaded by the production admin page. |
| `deployed/sql/base-schema.working.sql` | Working schema copy, now including `constant_text`. |
| `deployed/sql/01-constant-text.sql` | Guarded, rerunnable forward migration. |
| `deployed/sql/02-constant-text-rollback.sql` | Guarded rollback that refuses non-empty data. |
| `deployed/sql/README.md` | Migration/rollback runbook. |

**Ownership.** The production path is root `ocr_helper.js` plus the native
admin form. The shared-text/context subsystem and the legacy bookmarklet are
archived under `archive/owner-tool-2026-11/`; do not load or extend them. The
`src/owner-tool/context*` helper functions inside `render.js` are inert and
kept only because that file is shared with `cbt_practice.php`.

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
- The helper does not read or write `ansKey`, `ocrSubmitted`, `cbtOwnerTool:v1`,
  or any Auto-Save key.
- Loading, parsing, and filling write no server row. Only the native form submit
  saves.
- Constant Text is server-side session state, not `localStorage`.
- The OCR helper never reads or writes `constant_text`; the preview reads that
  field but never changes it.

## 4. Parser extension rules

- Root `ocr_helper.js` must stay usable both as a browser script and as a Node
  module. Keep the pure exports `{ FIXES, OPTION, splitQuestions, parseQuestion }`
  above the DOM guard.
- Multiline rule: fold single wrapped stem lines to one space, preserve real
  blank-line paragraphs as `\n\n`, and keep options single-line. Never replace
  this with a blanket whitespace collapse; `tests/ocr-helper.js` guards it.
- Option labels accept `A.`, `A)`, `(A)`, `(A).`, `a)`, `(a)`, and `(A).`; the
  captured letter is normalized to uppercase. The question splitter's lookahead
  is unchanged: a number followed immediately by a label is not a numbered
  boundary. The legacy unnumbered fallback can still queue such text with review
  flags, but it never writes Constant Text (D-89).
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
node tools/extract-bank.js --check
php tests/php-render.php
php tests/admin-question-store.php
```

Current local evidence (2026-11-14, PHP 8.3.32 and the owner's 8.3.16 gave the
same results):

- runner: 60 fixtures, 60 PASS, 0 FAIL, 0 PENDING;
- unit: 163 PASS;
- root helper: 7 PASS;
- underline toolbar: 9 PASS;
- read-only preview: 4 PASS;
- PHP renderer: 9 PASS; admin store: 8 PASS;
- `php -l` on every changed PHP file: PASS;
- `node tools/extract-bank.js --check`: PASS with all 7 source, slice, and
  output hashes matching;
- civic fixture: 50/50 questions, no flags;
- option-label fixture: 6 forms, no flags;
- multiline helper vector: single wraps fold, blank-line paragraph remains;
- local SQLite phone-staging: login, save with multiline `<u>` Constant Text,
  new-question prefill, edit row load, update with empty value to `NULL`, logout
  clear, delete, and two-session isolation all PASS.
- disposable Chromium at 390px: preview has no editable controls or overflow,
  both blocks use `pre-wrap`, exact underlines render, and a passage/cloze OCR
  paste leaves the prefilled Constant Text unchanged.

No live site, production database, or production cleanup was used. The schema
migration has been exercised only through the disposable SQLite phone-staging
store, not MySQL.

## 8. Known limitations and open gates

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
- There is no browser test suite. ST01 behavior is covered by Node/PHP checks,
  static source assertions, and the required owner Brave/Android check.
- This cycle does not deploy to production, clean live data, or archive itself
  without explicit owner instructions.

## 9. References

- Deployment: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Package plan: [`plan/README.md`](plan/README.md)
- ST01 contract:
  [`plan/owner-tool/st-01-constant-text-reset.md`](plan/owner-tool/st-01-constant-text-reset.md)
- Migration runbook: [`../deployed/sql/README.md`](../deployed/sql/README.md)
