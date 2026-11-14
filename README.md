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
  cbt_practice.php       practice page (out of ST01 scope)
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

- Root `ocr_helper.js` accepts `N.` question markers (1–3 digits) and options
  A–D, including `a)`, `(a)`, `(A).`, `A)`, `(A)`, and `A.`.
- The canonical parser core still supports options A–F, dotted or
  dotless-after-newline, inline options, header inference, answer-key splitting,
  and the documented E/F collapse.
- Folds OCR wrap lines in stems while preserving blank-line paragraphs; options
  remain single-line.
- Formats only balanced exact lowercase `<u>...</u>` markers through the browser
  and PHP renderers; every other tag or malformed marker stays literal and
  escaped.
- One exam year per paste. Multi-year bank text is split with
  `tools/extract-bank.js`, not pasted whole.
- Root helper flags are advisory and never block saving.
- The admin form supports an optional full-width Constant Text passage. It is
  stored as nullable `questions.constant_text`, prefills the next new question
  from the browser session after a successful save, and clears on login/logout.
- Constant Text appears above the question in the `cbt.php` exam view and in
  `answer_details.php`, not in the result sheet or `cbt_practice.php`.
- The Underline button wraps or unwraps the last-focused Constant Text, question,
  or option field with exact lowercase tags and refuses partial marker overlap.
- A read-only admin preview renders Constant Text and Question with the same safe
  exact-tag renderer and preserves blank-line paragraphs.
- The OCR helper never reads or writes `constant_text`; passage/cloze-shaped
  input can only follow its ordinary-question path and may be flagged for review.
- Saves stay manual through the existing PRG flow; the four-option rule, CSRF,
  field names, and success flash text are unchanged.

Full details: `docs/SPEC.md`. Rationale and risks: `docs/DECISIONS.md`.

## Status

Current test counts and live-test state are in [`docs/STATUS.md`](docs/STATUS.md).
Current work state, package gates, and branch strategy are in
[`docs/plan/README.md`](docs/plan/README.md). ST01 is implemented in the
`WIP pending st01 review` checkpoint. The active cycle is
`math-editor-2026-11`: ST01
(Constant Text reset), then ME01 (math palette and editor byte counter), then
ME02 (release and handoff).

Active work happens on `owner-tool-integration`. `main` is the published
baseline and the remote default; do not start new implementation there. The
fixture runner is the regression gate. After changing the helper, press Reset
and re-paste rather than trusting old `ocrQueue` state. Live deletes and cleanup
are owner-only; see [`docs/LIVE-SAFETY.md`](docs/LIVE-SAFETY.md).
