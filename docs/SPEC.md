# Parser Specification

Evidence base: `src/parser/parser.js`, `src/ui/ui.js`, and the archived
migration docs (`archive/migration-docs/`). This describes the baseline as it
exists in this workspace; it does not propose changes.

## 1. Scope

The bookmarklet is injected into the existing "Add a New Question" admin page
(`admin_questions.php`). It:

1. Removes the legacy helper/UI (`script[src*="ocr_helper.js"]`, the old
   `#ocr_input` panel, `#ans_panel`).
2. Refuses to run unless the `save_question` form and a `correct_option` radio
   exist and the URL does not contain `edit=`.
3. Injects one paste box for questions + answer key, queue controls, and a
   result area after the submit button.
4. Parses the paste, fills the form one question at a time, ticks the answer
   from the key, and saves through the existing form POST (CSRF token intact).

It never edits the PHP, the database, or the live `ocr_helper.js`.

## 2. Input format

One plain-text paste containing any combination of:

- Optional header: first 3 lines may carry a subject name and a `20\d\d` year.
  Example: `IMPROVISED C. R. K. QUESTIONS FOR 2021`.
- Questions, each starting a line with `N.` (1–3 digits) followed by
  whitespace. The `N)` form is **not** a question marker.
- Options A–F, dotted (`A.`, `A)`) or dotless only after a newline when followed
  by a digit (`\nA 75 years`). Options may be inline (`A. love B. mercy ...`).
- Option text may be on the line after the label.
- Optional answer-key section, introduced by:
  - a divider line such as `=== ANSWER KEY ===`;
  - a header line containing `ANSWER(S)/KEY/SCHEME/SOLUTION(S)`;
  - a structural run of key-like lines after the last question;
  - or no separator at all (heuristics apply).
- Key entries such as `1.B`, `2 C`, `3) A`, `4. (D)`, or several per line
  (`1.A 2.B 3.C`). Placeholders such as `5. [missing]` are recognized but
  produce no key entry.
- A key-only paste (every non-empty line is a key line) is valid and keeps the
  existing queue.

Before question parsing, three OCR typo fixes are applied to the question part
only:

| From | To |
|---|---|
| `govemment` | `government` |
| `persidential` | `presidential` |
| `resposible` | `responsible` |

The key section is not spell-corrected.

## 3. Output format

### 3.1 Parsed question object

`parseQuestion` returns:

```js
{
  num: 12 | null,       // printed book number (null for a leading unnumbered chunk)
  question: "...",      // cleaned stem text
  a: "...", b: "...", c: "...", d: "...", e: "", f: "",
  flags: ["option C missing", "..."]
}
```

- `question` and each option are whitespace-collapsed and trimmed.
- `num` comes from the question marker, not from queue position.
- Options absent from the source remain `''`; E/F are not invented.
- A leading chunk before the first marker is returned with `num: null` only if
  it contains at least two option matches.

### 3.2 Parsed key

`parseKey` returns `{ [printedNumber]: 'A'..'F' }`. Last duplicate number wins.
Placeholder lines create no entry.

### 3.3 Header metadata

`parseHeader` returns `{ year, header }`, where `header` is the first 3 lines
joined, uppercased, and `year` is the first `\b20\d\d\b` match or `null`.
`pickSubjectIndex` returns the index of the best matching `subject_id` option,
or `-1`. `exam_category_id` is never inferred.

### 3.4 UI state

- `localStorage.ocrQueue`: `{ items: [question...], i: number }`.
- `localStorage.ocrMeta`: `{ subject_id, exam_category_id, exam_year }`.
- `localStorage.ansKey`: the parsed key map.
- `localStorage.ocrSubmitted`: read and deleted at boot; this bookmarklet never
  writes it.

## 4. Parsing stages

### Stage 1 — Section split (`splitSections`)

Rules are checked in this order; the first match wins:

1. **Divider** — a line with 3+ consecutive characters from
   `= - * _ ~ # > + @ |`, a key word, ≤120 chars, no `?`, not starting with
   `N.`/`N)`.
2. **Key-only** — every non-empty line is a key line or placeholder.
3. **Header** — a line ≤120 chars with a key word, no `?`, not starting with a
   number marker or an option label; accepted when the next 6 non-empty lines
   are all key lines, or the first is key-like and ≥2 of 6 are, or the line
   itself has ≥2 inline pairs.
4. **Structure** — after the last stem-like line (`N.` or `N)`, then whitespace
   and ≥12 further chars; key lines excluded), a line that is key-like or has
   ≥3 inline pairs, with ≥3 key-like or ≥3-inline-pair lines in that line plus
   the next 4 non-empty lines.
5. **None** — the whole paste is questions; no key.

The answer section starts at the boundary line if that line is key-like or has
≥2 inline pairs; otherwise it starts on the next line (a pure heading is
dropped).

### Stage 2 — Question split (`splitQuestions`)

- Marker regex: `/(?:^|\n)\s*(\d{1,3})\.\s+/g`.
- Sequence guard: the first marker is always kept; later markers are kept only
  when `n > last` and `n <= last + 5`. Repeats, backwards numbers, and jumps
  greater than 5 are silently skipped, so their text stays with the previous
  chunk.
- Text before the first marker becomes a `num: null` chunk only when it has ≥2
  option matches.

### Stage 3 — Option parse (`parseQuestion`)

1. Normalize: `\r\n?` → `\n`; runs of spaces/tabs → one space; 3+ newlines → 2.
   Newlines are preserved for option matching.
2. Match `OPTION`:
   - Branch 1 (group 1): A–F preceded by start, newline, or any whitespace,
     then `.`/`)`; horizontal whitespace (not newlines) is consumed between the
     letter and the punctuation and after it.
   - Branch 2 (group 2): A–F after a newline, whitespace, then a digit
     lookahead; no dot required. This branch is newline-only.
   - Letter = `m[1] || m[2]`.
3. Position map is last-write-wins for a repeated letter; match counts still
   record every occurrence.
4. Loose E/F fallback: if E is missing and D exists, a line after D starting
   with lone `E` + whitespace + text is accepted; F similarly after E.
5. Stem = text before the first mark. Each option = text from its mark to the
   next mark (last runs to end).
6. Compute flags (below).

The baseline has **no** absorbed-option post-processor. The `[^\S\n]*` after
the label is what prevents a blank `C.` from consuming `D.`.

### Stage 4 — Header inference

- Year: first `20\d\d` in the 3-line header → `exam_year`.
- Subject step 1: a CRK / `C.R.K.` / `CHRISTIAN RELIGIOUS` header selects the
  first option containing `CRS` or `CHRISTIAN RELIGIOUS`.
- Subject step 2: otherwise strip the year, the stopwords `THE AND FOR ANSWERS
  QUESTIONS STRUCTURED IMPROVISED PAPER OBJECTIVE SECTION OF IN A`, and
  punctuation; score options by containment in either direction, then by
  overlap of words longer than 2 chars. Highest score wins; ties keep the first.
- No match leaves the subject untouched.

### Stage 5 — Fill (`fillForm`)

- Restore `ocrMeta`; set `question_text`; set `option_a`–`option_d`.
- Clear all `correct_option` radios first.
- If the key has this question's number:
  - A–D → tick that radio (index 0–3).
  - E/F → replace Option D with that option's text and tick D (index 3).
    If the E/F text is missing, leave D alone and tick nothing.
  - Extra E/F content is dropped.
- If no key entry: append E/F to D as `\n\nE. text` / `\n\nF. text`; tick
  nothing.

### Stage 6 — Tick, queue, save

- `tick()` re-reads the key and current queue item; A–D tick directly, E/F tick
  D only when that text exists. A 600 ms interval re-ticks when the queue index
  changes. With no queued item and `ask=true`, it prompts for a book number.
- Key lifecycle: a paste with questions replaces the key; a paste with questions
  and no key clears it; a key-only paste replaces the key and keeps the queue;
  Reset Queue clears the queue but not the key; "Clear saved key" clears it.
- Save: capture-phase `submit` listener, `preventDefault` +
  `stopImmediatePropagation`, `fetch(location.href, { method:'POST', body:new
  FormData(form), credentials:'same-origin' })`.
- Success: response matches `/Question saved successfully \(Question ID:
  (\d+)\)/`. On success: show the ID, refresh meta, clear `question_image`,
  `answer_video`, `answer_explanation`, advance the queue (or `form.reset()`),
  tick the next answer.
- Failure: `.admin-error` text from a parsed reply, a logged-out message when
  the reply contains `Administrator Login`, an unexpected-reply message with the
  status code, or `NOT saved: network problem. Try again.`

## 5. Flags and warnings

All flags are advisory. They are rendered as `Check this one: ...` in
`#ocr_status` inside `.admin-alert.admin-error`, and they never block loading,
queueing, or saving.

| Flag | Trigger |
|---|---|
| `question number missing` | `num === null` |
| `question text missing or very short` | stem length < 10 |
| `option A/B/C/D missing` | that option is empty (E/F are never flagged missing) |
| `option X over 500 characters` | any A–F option length > 500 |
| `a letter appears twice (merged questions?)` | any option letter matched more than once (pre-dedup count) |

Not implemented: numbering-gap/repeat flags, empty/missing correct-answer flag,
E/F-specific flag. (Source: `claude-migration.md` §2.)

## 6. Server contract the UI depends on

From the migration docs, not from archived PHP (the PHP itself is not in this
workspace):

- Exactly 4 non-empty options, each ≤500 characters.
- `correct_option` integer 0–3 (no E/F radios).
- `exam_year` 1900–2100.
- `subject_id` / `exam_category_id` must exist and be active; categories are
  limited to `id <= 10`.
- Success text is rendered after a Post/Redirect/Get as
  `Question saved successfully (Question ID: N).`
- CSRF is carried by the form's hidden `csrf_token`; the bookmarklet posts the
  form as-is.

See `docs/INVARIANTS.md` for the full rule list and which items are unverified.
