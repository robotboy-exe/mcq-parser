# Constant Text Reset Intent

Approved: 2026-11-14; owner-amended 2026-11-15 (D-91), 2026-11-17
(EL01, D-103, D-104), and 2026-11-18 (D-105). Supersedes the
`owner-tool-2026-11` product intent.

This file is the behavior tie-breaker for the `math-editor-2026-11` cycle. The
package files own implementation detail. If a package conflicts with this file,
stop and ask instead of silently changing the product direction.

## Product intent

- Root `ocr_helper.js`, loaded by `admin_questions.php`, is the shipping OCR
  helper. The shared-text/context subsystem is retired and archived.
- Keep one paste box. Fill the native PHP form one question at a time so the
  administrator can edit every parsed value before saving.
- Use the existing native form submit and Post/Redirect/Get flow. Keep saving
  manual; do not ship auto-save, dry run, batch history, or automatic image
  injection.
- Add one optional Constant Text passage per question. It survives the native
  save, prefills the next new question in the same browser session, and clears
  on login/logout. It never crosses browser sessions.
- Show Constant Text above the question in the `cbt.php` exam view and in
  `answer_details.php`; do not show it in the result sheet or
  `cbt_practice.php`.
- Keep `cbt_practice.php`, `practice_title`, and the legacy bookmarklet out of
  scope.

## Formatting intent

- Underlining applies to Constant Text, question stems, and options A–D.
- Store exact `<u>` and `</u>` markers. Escape all content and restore only
  those exact tags when rendering; arbitrary HTML and attributes remain text.
- Preserve manually entered line breaks exactly.
- For OCR, fold single wrapped lines into spaces and retain blank-line paragraph
  breaks. The administrator can edit the resulting textarea before saving.
- Keep a read-only preview beside Question that safely renders Constant Text and
  Question with their blank-line paragraphs and exact lowercase underline tags.
- Keep the Constant Text preview at the input's default 150px height and scroll
  long passages vertically; the Question preview remains content-sized.
- Infer exam years from 1900 through 2099.
- Defer the math-symbol palette and editor byte counter to ME01.
- The visual Root editor is the only square-root control in the math palette.
  Its vinculum visibly joins the radical glyph instead of appearing as a
  separate horizontal line.
- The math palette keeps `± × ÷ ≠ ≈ ° π`, the five visual shape editors, and a
  `More symbols` drawer holding only the Greek, set theory and logic, and
  geometry and vectors grids. Exponent, subscript, fraction, and square-root
  characters stay out because the visual editors already cover them (D-105).

## Parser intent

- Keep the root helper's queue, storage, and fill behavior unchanged.
- Do not route OCR passage/cloze text into Constant Text. The root helper never
  reads or writes `constant_text`; that field remains manual/session-prefilled.
- For A-D option labels, match letters case-insensitively and keep the existing
  unspaced forms. In the bare-letter-plus-period, bare-letter-plus-closing-paren,
  parenthesized-letter, and parenthesized-letter-plus-period forms, whitespace is
  optional after `(`, before `)`, and before `.`. This includes `A.`, `A .`,
  `A)`, `A )`, `(A)`, `( A)`, `(A )`, `( A )`, and their dotted/lowercase
  combinations.
- A later label-like occurrence of an already selected option letter remains
  option text. For example, `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four`
  keeps `The notation A ) stays in option A` as Option A and raises no
  duplicate-letter warning solely for the internal `A )`.
- Keep `src/parser/core.js` as non-shipping history unless a future package
  explicitly targets it.

## English Lexis exam intent

- Add one active subject named exactly `English (Lexis & Structure)` without a
  fixed database ID. It follows the existing default limit of 50 questions.
- Keep the existing active/category/year filters and random limited row
  selection. For this subject only, reorder the selected rows so equal,
  non-empty exact Constant Text values stay contiguous and shuffle at that
  group level. Empty or `NULL` Constant Text questions remain independent.
- Preserve the selected question set and each group's internal order. Every
  grouped question still renders its own Constant Text block.
- Do not change other subjects, `cbt_practice.php`, attempt storage, parser
  inference, or the Constant Text rendering boundary.

## Process intent

- One `docs/plan/` package per session unless the user explicitly asks to
  continue. Stop after the package handoff.
- This cycle is externalize-first. For each live-origin production file, the
  cumulative additions from its archived live snapshot must not exceed 100 by
  `git diff --numstat`, or the owner must approve the excess. New production
  modules have no fixed line cap but stay cohesive and have an explicit
  deployment path.
- Acceptance evidence must execute the real production modules and paths.
- Do not commit unless the user explicitly asks.
- Do not edit archived source snapshots.
- New decisions begin at D-83; D-73–D-82 describe the superseded context cycle.
- Product PHP verification begins on the user's local PHP machine. Production
  cleanup and destructive live tests are owner-only.
