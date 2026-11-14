# Constant Text Reset Intent

Approved: 2026-11-14. Supersedes the `owner-tool-2026-11` product intent.

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
- Infer exam years from 1900 through 2099.
- Defer the math-symbol palette and editor byte counter to ME01.

## Parser intent

- Keep the root helper's queue, storage, and fill behavior unchanged.
- Do not route OCR passage/cloze text into Constant Text. The root helper never
  reads or writes `constant_text`; that field remains manual/session-prefilled.
- Accept `a)`, `(a)`, `(A).`, `A)`, `(A)`, and `A.`, normalizing the letter to
  uppercase; keep the existing uppercase forms working.
- Keep `src/parser/core.js` as non-shipping history unless a future package
  explicitly targets it.

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
