# OCR Question Importer & Parser

Tools and pure parsing engines for importing OCR exam questions into the CBT
admin "Add a New Question" interface.

> **Architecture:** Root `ocr_helper.js` is the shipping OCR helper loaded by
> `admin_questions.php`. The shared-text/context subsystem is archived under
> `archive/owner-tool-2026-11/` and is not loaded. `src/parser/core.js` remains
> the pure canonical parser and is retained for historical parser tests; the
> legacy bookmarklet is evidence, not a production deliverable.

The parser core is kept strictly pure and free of DOM, storage, or network code
so it can be tested without a browser and reused across browser and server
contexts.

## Quick start

```sh
# Core parser and root-helper checks
node tests/runner.js
node tests/unit.js
node tests/ocr-helper.js
node tests/underline-toolbar.js
node tests/question-preview.js

# PHP renderer and admin store checks
php tests/php-render.php
php tests/admin-question-store.php

# Verify the archived bank slices and their hashes
node tools/extract-bank.js --check

# Run the canonical parser core directly
node -e "const p=require('./src/parser/core.js'); console.log(p.parsePaste('1. Who was the father of faith? A. Abraham B. Moses C. David D. Joseph'))"
```

## Project layout

```text
ocr_helper.js            production OCR helper (root, loaded by admin_questions.php)
deployed/
  admin_questions.php    native question form and dispatch
  admin_question_store.php  standalone save/delete transaction
  cbt.php                CBT exam delivery and result sheet
  answer_details.php     answer explanation and media page
  render.php             server exact-<u> renderer
  sql/                   Constant Text schema and rollback
src/
  parser/core.js         canonical pure parser (historical parser tests)
  owner-tool/render.js   browser exact-<u> renderer used by cbt.php
  underline-toolbar.js   runtime Underline button for the admin form
  question-preview.js    read-only Constant Text/question preview
  question-preview.css   preview layout and multiline rendering
  bookmarklet.js         legacy generated bookmarklet artifact
tools/
  extract-bank.js        deterministic bank slicer and verifier
  start-phone-staging.sh disposable phone-staging server
archive/
  owner-tool-2026-11/    retired shared-text/context modules, tests, tools, SQL
  live-sources/          admin PHP/HTML, ocr_helper.js, OCR text bank
fixtures/
  inputs/                archived doc, bank, and anomaly samples
  expected/              documented expected outputs (CONFIRMED/PENDING)
tests/
  runner.js              pure-Node fixture harness
  unit.js                pure-Node parser and legacy auto-save tests
  ocr-helper.js          root helper civic/label/regression checks
  underline-toolbar.js   pure wrap/unwrap checks
  question-preview.js    read-only preview behavior checks
  admin-question-store.php  save/delete transaction checks
```

## Behavior summary

- D-91 requires root `ocr_helper.js` to accept A-D option labels
  case-insensitively with optional whitespace after `(`, before `)`, and before
  `.`, while preserving every unspaced form. A repeated label-like occurrence
  of an already selected letter must remain option text. The review-settled
  phase-1 implementation enforces that selected-boundary rule.
- The canonical parser core still supports options A–F, dotted or
  dotless-after-newline, inline options, header inference, answer-key splitting,
  and the documented E/F collapse.
- Folds OCR wrap lines in stems while preserving blank-line paragraphs; options
  remain single-line.
- Formats only the six balanced exact lowercase marker pairs: `<u>`, `<frac>`,
  `<sup>`, `<sub>`, `<sqrt>`, and `<matrix>`. Every other tag or malformed
  marker stays literal and escaped.
- One exam year per paste. Multi-year bank text is split with
  `tools/extract-bank.js`, not pasted whole.
- Root helper flags are advisory and never block saving.
- The admin form supports an optional full-width Constant Text passage. It is
  stored as nullable `questions.constant_text`, prefills the next new question
  from the browser session after a successful save, and clears on login/logout.
- Constant Text appears above the question in the `cbt.php` exam view and in
  `answer_details.php`, not in the result sheet.
- The Underline button wraps or unwraps the last-focused Constant Text, question,
  or option field with exact lowercase tags and refuses partial marker overlap.
- A read-only admin preview renders Constant Text and Question with the same safe
  exact-tag renderer and preserves blank-line paragraphs. Its Constant Text box
  matches the input's default 150px height and scrolls longer passages.
- The OCR helper never reads or writes `constant_text`; passage/cloze-shaped
  input can only follow its ordinary-question path and may be flagged for review.
- Saves stay manual through the existing PRG flow; the four-option rule, CSRF,
  field names, and success flash text are unchanged.

Full details: `docs/SPEC.md`. Rationale and risks: `docs/DECISIONS.md`.

## Status

Current test counts and live-test state are in [`docs/STATUS.md`](docs/STATUS.md).
Current work state, package gates, and branch strategy are in
[`docs/plan/README.md`](docs/plan/README.md). All five phases of the active
`math-editor-2026-11` cycle are done and review-settled. MS01's D-103/D-104
visual corrections passed focused review and the owner desktop/Brave recheck and
are committed at `120a5db`. The owner's later request to restore the palette's
non-shape content is D-105: a `More symbols` drawer brings back the Greek, set
theory and logic, and geometry and vectors grids while exponents, subscripts,
fractions, and square root stay with the visual editors. It is committed at
`23a406c`, and the cycle-wide review of phases 1–5 plus D-105
([record](docs/plan/reviews/math-editor-2026-11-cycle-review.md)) passed with
accepted findings; the owner accepted its desktop/Brave drawer check on
2026-11-18.

The 2026-11-21 main-release review and its 2026-11-22 re-review rounds are
recorded: `BLOCK-7`/`BLOCK-8` are closed; the owner's `fix` disposition for
`BLOCK-4`/`BLOCK-5`/`BLOCK-6` is implemented and closed by re-review 2.
`BLOCK-10` was then assigned and fixed, but re-review 3 kept it open because a
complete mixed-case parenthesized set with an opposite-case repeat of the
selected A label still moved the intended Option A prefix into the question.
Re-review 4 showed the follow-up guard covered only A and that selected B/C/D
repeats still failed 15/16. The 2026-11-23 session replaces the per-letter guard
with the general first-occurrence rule, so the first occurrence of every letter
is the boundary and every later repeat stays text; the opposite-case
selected-repeat matrix is A/B/C/D 16/16 through core, exported helper, and real
Load at core `?v=2.5.4` / helper `?v=2.4.5`. Independent re-review must accept
the closure before `BLOCK-10` is closed. `BLOCK-1` (current-`main` ancestry)
remains undisposed, so `main` is not ready to advance.

Active work happens on `owner-tool-integration`. `main` is the published
baseline and the remote default; do not start new implementation there. The
fixture runner is the regression gate. After changing the helper, press Reset
and re-paste rather than trusting old `ocrQueue` state. Live deletes and cleanup
are owner-only; see [`docs/LIVE-SAFETY.md`](docs/LIVE-SAFETY.md).
