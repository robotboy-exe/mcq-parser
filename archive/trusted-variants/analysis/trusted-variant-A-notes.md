# trusted-variant-A.js — Inspection Notes (Phase 2)

Source: `archive/trusted-variants/trusted-variant-A.js` (10318 bytes, SHA-256
59b2a7b9…402fe). Inspection only; not executed.

## Snapshot / context

Single self-contained bookmarklet (`javascript:(function(){...})()`). Two
separate textareas: question OCR text (`#ocr_text`) and answer key
(`#ans_text`). This is the pre-merge UI.

## Structure

- Bootstrap / guards: removes prior `script[src*="ocr_helper.js"]`, prior
  `#ocr_input` `.admin-field`, and `#ans_panel`; requires the
  `save_question` form plus `input[name=correct_option]`; refuses pages whose
  query contains `edit=`.
- Constants:
  - `FIXES` — three OCR typo corrections (`govemment`, `persidential`, `resposible`).
  - `FIELDS` — `subject_id`, `exam_category_id`, `exam_year`.
  - `OPTION = /(?<![A-Z])([A-F])\s*[.)]\s*/g` — option label must be followed
    by `.` or `)`.
- Storage wrapper: `store.get/set/del` over `localStorage` with `JSON`.
- UI injection: one panel with question textarea, Load, Clear text, Skip, Reset
  Queue, answer-key textarea, Save key, Clear key, status nodes.
- Save button augmentation: `#ans_res` inserted after submit button.
- Meta persistence: `saveMeta` stores FIELDS values to `ocrMeta`.
- `parseHeader(text)`: first 3 lines joined/uppercased; year = first `20\d\d`.
- `applyHeaderInfo(text)`: sets exam_year; subject selection via a CRK/CRS
  alias map, then heuristic subject matching (direct substring, reverse
  substring, word overlap with length > 2).
- `splitQuestions(text)`: detects question starts with
  `/(?:^|\n)\s*(\d{1,3})\.\s+/g`; rejects numbers that go backwards or jump
  more than 5 (`n <= last || n > last + 5`). Leading head block is added as a
  number-less chunk only if it contains >= 2 option markers.
- `parseQuestion({num,text})`: collapses whitespace; finds all OPTION matches;
  slices question text and each option up to the next marker; builds flags.
- Flags: `question number missing`, `question text missing or very short`
  (<10 chars), `option X missing` for missing a–d, `option X over 500
  characters`, `a letter appears twice (merged questions?)`.
- `fillForm(q)`: applies stored meta, writes question/options; for key answers
  E/F, maps to Option D field with `correctIndex = 3`; otherwise ABCD index.
  Without key, leftover `q.e`/`q.f` are appended to option D as `E. ...`/`F. ...`.
- Queue: `ocrQueue = {items, i}` in localStorage; `renderOCR`, `showOCR`;
  skip/reset handlers.
- Key handling: `parseKey` regex `/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g`;
  `tick(ask)` ticks the radio for the current question number, prompts for a
  book number if the chunk has none.
- Submit interception: capture-phase listener with `preventDefault` +
  `stopImmediatePropagation`; POSTs `FormData` via `fetch` to `location.href`;
  looks for `Question saved successfully (Question ID: N)`; clears
  `question_image`, `answer_video`, `answer_explanation`; advances queue on
  success; reports login/logout/server errors. 600 ms `setInterval` re-ticks
  on queue change. `ocrSubmitted` flag handling on page reload.
- Top-level `try/catch` alerts `Bookmarklet Error: ...`.

## Parsing behavior (code inspection only)

- Option recognition requires `.` or `)` immediately after A–F (whitespace
  allowed between letter and punctuation).
- Labels preceded by an uppercase letter are excluded by negative lookbehind.
- Two textareas: question text and answer key are loaded independently.

## Known issues (from `trusted-variant-A-KNOWN_ISSUES.md`)

- Options without a period after the label are not recognized; the label and
  option text are absorbed into the question field.
- User's recollection incomplete; other bugs may exist.
- Predates merged question/answer-key textarea.

## Notes / limitations observed in code

- `OPTION` does not tolerate bare `A ` labels, so OCR output lacking a dot or
  parenthesis fails.
- `splitQuestions` accepts only dotted question numbers.
- Key-only pastes cannot be applied without a loaded queue via the normal
  Load flow (key is parsed only from the separate `#ans_text` box).
- No E/F loose-label recovery.
