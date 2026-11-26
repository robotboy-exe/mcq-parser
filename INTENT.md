# Parser Convergence Intent

Approved: 2026-11-14; owner-amended 2026-11-15 (D-91), 2026-11-17
(EL01, D-103, D-104), 2026-11-18 (D-105, D-106), and 2026-11-19
(D-108), 2026-11-24 (one parser source, scratch-only cycle workflow), and
2026-11-26 (PC07 two-surface convergence: deployed manual helper plus one
supported stimulus-first bookmarklet; key-only retained only through
comparator/rollback checks until a separate reviewed retirement diff). Supersedes
the `owner-tool-2026-11` product intent while preserving every review-settled
shipped behavior below.

This file is the behavior tie-breaker for the `parser-convergence-2026-11`
cycle. The package files own implementation detail. If a package conflicts with
this file, stop and ask instead of silently changing the product direction.

## Product intent

- Root `ocr_helper.js`, loaded by `admin_questions.php`, is the shipping OCR
  helper. The shared-text/context subsystem is retired and archived.
- Keep one paste box. Fill the native PHP form one question at a time so the
  administrator can edit every parsed value before saving.
- Use the existing native form submit and Post/Redirect/Get flow. Keep saving
  manual; do not ship auto-save, dry run, batch history, or automatic image
  injection.
- When a logged-in administrator's save reaches a database error, show the
  escaped PDO message with the existing failure lead-in so an owner without
  server-log access can diagnose the target schema. Do not expose it to
  logged-out visitors or render it as HTML.
- Add one optional Constant Text passage per question. It survives the native
  save, prefills the next new question in the same browser session, and clears
  on login/logout. It never crosses browser sessions.
- Show Constant Text above the question in the `cbt.php` exam view and in
  `answer_details.php`; do not show it in the result sheet.
- In the `cbt.php` exam view, keep both Constant Text and the question stem bold:
  Constant Text uses weight 800 and the question stem keeps weight 700, while
  their existing sizes preserve the question hierarchy.
- Keep `practice_title` out of scope.

## Product surface intent

- Converge on two supported products over one canonical parser source:
  1. the deployed manual helper (`ocr_helper.js`, loaded by
     `admin_questions.php` after `src/parser/core.js`), which must not acquire
     answer-key loading, dry run, autosave, batch history, Constant Text
     writing, or image-plan behavior;
  2. one supported stimulus-first bookmarklet (`src/bookmarklet.js`, built from
     `src/parser/core.js` + `src/bookmarklets/stimulus/autosave.js` +
     `src/ui/ui.js`) combining answer-key load/fill, dry run, autosave, image
     plan (RAM-cached upload + ready-image autosave within range + pause when
     uncovered/unranged), Constant Text routing/clearing, `[missing text]`
     blocking, and PC01 concurrency/storage/provenance hardening.
- Retain `src/bookmarklets/key/` (`src/bookmarklets/key/bookmarklet.js`) only as
  a frozen comparator during verification and as a rollback reference through
  desktop + owner Brave/Android acceptance; retire it only in a separate,
  owner-authorized, reviewed diff.
- Product-specific behavior belongs in focused surface modules and entry points.
  Do not fork the parser to obtain product differences.
- A generated bookmarklet may inline the canonical parser; generated copies are
  artifacts, never editable parser sources.

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
- `src/parser/core.js` is the only parser implementation and the exact parser
  used by all three products. No adapter, helper, entry point, or bookmarklet
  source may carry a second implementation of its regexes or split logic.
- Shared text-boundary correctness and parser metadata belong in the canonical
  core. What a product does with metadata (manual review, key fill, image pause,
  autosave, or display) belongs outside the core.
- Parser changes require failing-first, manually transcribed evidence and parity
  through the deployed helper and both real bookmarklet build paths.
- P20-P23 are not accepted by preservation alone. The old stimulus worktree is
  evidence of problems and attempted solutions; each active package must
  revalidate its raw samples and address the prior review findings independently.

## English Lexis exam intent

- Add one active subject named exactly `English (Lexis & Structure)` without a
  fixed database ID. It follows the existing default limit of 50 questions.
- Display that exact row as `English (Comprehension Pages / Lexis & Structure)`
  throughout `admin_questions.php` and `cbt.php`. Keep the stored name and
  subject ID unchanged and require no SQL operation.
- Keep the existing active/category/year filters and random limited row
  selection. For this subject only, reorder the selected rows so equal,
  non-empty exact Constant Text values stay contiguous and shuffle at that
  group level. Empty or `NULL` Constant Text questions remain independent.
- Preserve the selected question set and each group's internal order. Every
  grouped question still renders its own Constant Text block.
- Do not change other subjects, attempt storage, parser inference, or the
  Constant Text rendering boundary.

## Process intent

- One `docs/plan/` package per session unless the user explicitly asks to
  continue. Stop after the package handoff.
- Product implementation runs on the owner's VM on a short-lived
  `scratch/pcNN-*` branch from the reviewed `scratch/parser-convergence-cycle`
  tip. The VM pushes an exact candidate ref; a separate session in this
  environment reviews that ref without product edits.
- Only a review-settled phase may be merged into the scratch cycle branch. No
  cycle work modifies `main`, `owner-tool-integration`, `experiments`, or
  `experiments-alt` before the final cycle-wide review and a separate explicit
  owner authorization.
- `scratch/stimulus-followups` preserves the old uncommitted work as evidence.
  The pre-package `scratch/single-core-port` diff and its external backup are
  quarantined exploration, not acceptance evidence and not a cherry-pick source.
- This cycle is externalize-first. For each live-origin production file, the
  cumulative additions from its archived live snapshot must not exceed 100 by
  `git diff --numstat`, or the owner must approve the excess. New production
  modules have no fixed line cap but stay cohesive and have an explicit
  deployment path.
- Acceptance evidence must execute the real production modules and paths.
- Do not commit unless the user explicitly asks.
- Do not edit archived source snapshots.
- New parser-convergence decisions begin at D-110. D-73–D-82 describe the
  superseded context cycle; D-83–D-109 remain the shipped baseline/history.
- Product PHP verification begins on the user's local PHP machine. Production
  cleanup and destructive live tests are owner-only.
