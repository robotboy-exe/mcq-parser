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

One exam year per paste. A section can be partial or even a single question; it
is still its own paste. The parser does not pair one section's questions with
another section's key, so multi-section bank text is unsupported. Split the bank
with `node tools/extract-bank.js`; the outputs are
`fixtures/inputs/bank-YYYY.txt` plus `bank-pre-2026.txt` for the unheaded
single-question section.

One plain-text paste containing any combination of:

- Optional header: first 3 lines may carry a subject name and a `20\d\d` year.
  Example: `IMPROVISED C. R. K. QUESTIONS FOR 2021`.
- Divider-only lines of dashes (`---`, `-----`, `—--`, or a single `—`) separate
  sections. They are stripped before question parsing, so a trailing divider is
  not absorbed into the last option. They do not make a multi-section paste
  supported.
- Questions, each starting a line with `N.` (1–3 digits) followed by
  whitespace. The `N)` form is **not** a question marker.
- Unnumbered OCR bullets: a block where every question starts with `*` and no
  line-start `N.` marker exists. These are a separate mode; each item keeps
  `num: null` and the `question number missing` flag.
- Options A–F, dotted (`A.`, `A)`) or dotless only after a newline when followed
  by a digit (`\nA 75 years`). Options may be inline (`A. love B. mercy ...`).
- A missing `A` label after a newline is also repaired when followed by a
  lowercase word and `B`, `C`, and `D` are present (`A stay with them`). The
  repair is not used at the start of the chunk, preserving leading articles
  such as `A 5 ...` and `A good ...`.
- Option text may be on the line after the label.
- Optional answer-key section, introduced by:
  - a divider line such as `=== ANSWER KEY ===`;
  - a header line containing `ANSWER(S)/KEY/SCHEME/SOLUTION(S)`;
  - a structural run of key-like lines after the last question;
  - or no separator at all (heuristics apply).
- Key entries such as `1.B`, `2 C`, `3) A`, `4. (D)`, or several per line
  (`1.A 2.B 3.C`). Inline multi-pair lines count as key lines when sections are
  split. Placeholders such as `5. [missing]` are recognized but produce no key
  entry.
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
or `-1`. `pickCategoryIndex` returns the index of the matching
`exam_category_id` option for POST UTME, JAMB/UTME, WASSCE/WASCE/WAEC/SSCE/
NECO/GCE, or General Practice, or `-1`.

### 3.4 UI state

- `localStorage.ocrQueue`: `{ items: [question...], i: number, batchId?: string }`.
  There is no version marker, so a queue written by an older variant can outlive
  a parser update; reset and re-paste after updating (EC-62/INV-56).
- `localStorage.ocrMeta`: `{ subject_id, exam_category_id, exam_year }`.
- `localStorage.ansKey`: the parsed key map.
- `localStorage.ocrSubmitted`: a legacy shared key. The bookmarklet no longer
  reads, writes, or deletes it (decision D-22).
- Auto-Save additions (see §7): `ansKeyBatch`, `ansKeyConflicts`, `ocrSaving`,
  `ocrSavedLog`, and `autoLock`. The existing key names and the `ansKey` shape
  stay compatible (INV-36).

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
dropped). If that pure heading is directly preceded by a title block (a
non-empty run containing a `20\d\d` year and an exam/subject word, bounded by a
blank line), the title block is dropped from the question part too. For example,
`WASSCE C. R. K. 2026` above `OBJECTIVE ANSWERS` must not become part of the
last question's options. `splitSections` also returns the dropped `boundary`
text, including any dropped title lines, so the UI can infer header metadata
from it.

### Stage 1b — Guarded salvage (`splitSectionsWithSalvage`)

Hostile OCR sometimes fuses a question number or option label into the previous
word or option. The UI and the runner call `splitSectionsWithSalvage(raw)`:

- `salvageNormalize` repairs only boundary shapes: a mid-line `N.` followed by
  a capital/quote/paren or end of line, a spaced `N.` followed by a capitalized
  word, and a fused `A.`–`F.` label preceded by lowercase text or punctuation.
  It does not rewrite option text, apply `FIXES`, or normalize whitespace.
- The repair is used only when it made at least 2 inserts **and** the repaired
  text yields more question chunks than the strict result. Otherwise the strict
  `splitSections` result is used byte-for-byte.
- When the repair is accepted, every parsed item gets
  `OCR boundaries repaired; verify question and option split` and the UI shows
  `OCR boundaries repaired (N inserts); verify the split.`
- Bank inputs must produce zero inserts (INV-72).

### Stage 2 — Question split (`splitQuestions` / `splitQuestionItems`)

- Marker regex: `/(?:^|\n)\s*(\d{1,3})\.\s+/g`.
- Sequence guard: the first marker is always kept; later markers are kept only
  when `n > last` and `n <= last + 5`. Repeats, backwards numbers, and jumps
  greater than 5 are silently skipped, so their text stays with the previous
  chunk.
- After parsing, `flagNumberingGaps` flags a kept jump greater than 1 on the
  later question.
- Text before the first marker becomes a `num: null` chunk only when it has ≥2
  option matches.
- `splitQuestionItems` chooses the mode. A line-start `N.` marker anywhere in
  the text selects numbered mode. With none, `splitBulletQuestions` splits on
  `(?:^|\n)[^\S\n]*\*[^\S\n]+`; fewer than 2 bullets returns `null` and the
  numbered splitter runs. Bullet markers are consumed, every chunk keeps
  `num: null`, and mixing bullet and numbered questions in one paste is
  unsupported: numbered markers take precedence and may absorb bullet text.

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

- The UI reads three header sources in order: the question part, the dropped
  section boundary, and the answer section. The question header wins; later
  sources fill only fields it did not set. A key-only paste uses the boundary
  and answer-section header.
- Year: first `20\d\d` in the 3-line header → `exam_year`.
- Subject step 1: a CRK / CRS / `C.R.K.` / `C.R.S.` / `CHRISTIAN RELIGIOUS
  [STUDIES]` header selects the first option containing `CRS` or
  `CHRISTIAN RELIGIOUS`.
- Subject step 2: otherwise strip the year, the stopwords `THE AND FOR ANSWERS
  QUESTIONS STRUCTURED IMPROVISED PAPER OBJECTIVE SECTION OF IN A`, and
  punctuation; score options by containment in either direction, then by
  overlap of words longer than 2 chars. Highest score wins; ties keep the first.
- Category: `pickCategoryIndex` maps POST UTME, JAMB/UTME,
  WASSCE/WASCE/WAEC/SSCE/NECO/GCE, and General Practice to the archived live
  `exam_category_id` options. POST UTME is checked before JAMB/UTME; a bare
  `UTME` selects `JAMB / UTME`, and SSCE maps to `WASCE / NECO / GCE` because
  the live list has no SSCE entry.
- No match leaves the subject/category untouched.
- The current live subject list is archived in
  `archive/live-sources/subjects-select-2026-10-23.html`: it contains `CRS`
  (id 14), `English (Oral)` (id 12), and `English Language` (id 6). The parser
  matches option text, not IDs. A CRK header therefore selects `CRS`; an
  English (Oral) header selects `English (Oral)`, not English Language.

### Stage 5 — Fill (`fillForm`)

- Restore `ocrMeta`; set `question_text`; set `option_a`–`option_d`.
- On the manual path, tick `is_active` so a hand-saved question stays active
  (D-31, superseding D-24). Auto-save passes `auto=true` and never ticks it;
  the save pipeline removes the field and verifies inactivity (§7).
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
  Reset Queue clears the queue, the key, `ansKeyBatch`, `ansKeyConflicts`, and
  `batchId` (D-30, superseding D-14/D-26); "Clear saved key" clears the key.
  The key is read from `ansKey` at boot and therefore survives reloads (D-13).
- "Go to question" prompts for a printed book number (falling back to the
  1-based list position when no book number matches), sets the queue index, and
  refills the form.
- Save: capture-phase `submit` listener, `preventDefault` +
  `stopImmediatePropagation`, then the shared `saveCurrentQuestion({auto:false})`
  described in §7. Manual saves tick `is_active`; draft auto saves remove it and
  active auto saves set `is_active=1`.
- Success: the PHP writes `cbt_admin_flash`, redirects, and the redirected GET
  renders it as `.admin-success`; the fetched response matches
  `/Question saved successfully \(Question ID: (\d+)\)/`. On success: show the
  ID, refresh meta, clear `question_image`, `answer_video`,
  `answer_explanation`, advance the queue (or `form.reset()`), tick the next
  answer.
- Failure: `.admin-error` text from a parsed reply, a logged-out message when
  the reply contains `Administrator Login`, an unexpected-reply message with the
  status code, or the ambiguous-save warning described in §7.

## 5. Flags and warnings

All flags are advisory. They are rendered as `Check this one: ...` in
`#ocr_status` inside `.admin-alert.admin-error`, and duplicated in
`#ocr_save_flag` under the submit button (after `#ans_res`). They never block
loading, queueing, or saving.

| Flag | Trigger |
|---|---|
| `question number missing` | `num === null` |
| `question text missing or very short` | stem length < 10 |
| `option A/B/C/D missing` | that option is empty (E/F are never flagged missing) |
| `option X over 500 characters` | any A–F option length > 500 |
| `a letter appears twice (merged questions?)` | any option letter matched more than once (pre-dedup count) |
| `question N missing (numbering gap)` | a kept marker jumps by more than 1 after a known question number; attached to the later question. A run of missing numbers uses `questions N-M missing (numbering gap)` |
| `E/F options present` | `q.e` or `q.f` is non-empty (D-37); the auto-save gate also blocks this question |

Not implemented: repeat/backwards/large-jump flags, empty/missing
correct-answer flag. (Source: `claude-migration.md` §2; numbering-gap and E/F
flags added at user request.)

## 6. Server contract the UI depends on

From the archived live source (`archive/live-sources/admin_questions.php`) and
the current rendered page (`archive/live-sources/admin_questions.html`):

- Exactly 4 non-empty options, each ≤500 characters.
- `correct_option` integer 0–3 (no E/F radios).
- `exam_year` 1900–2100.
- `subject_id` / `exam_category_id` must exist and be active; categories are
  limited to `id <= 10`.
- Success text is rendered after a Post/Redirect/Get as
  `Question saved successfully (Question ID: N).`
- CSRF is carried by the form's hidden `csrf_token`; the bookmarklet posts the
  form as-is.

The PHP inserts into `questions`. The only schema evidence supplied is a
`questions1` dump with a required `practice_title`; whether live `questions` has
that requirement is unverified (EC-63/INV-57). If it does, every save would
fail even though the bookmarklet and PHP agree.

## 7. Auto-Save (opt-in)

Auto-Save is a separate, click-started loop over the existing queue. It never
starts on page load, never auto-resumes after a reload, and does not change the
manual path. The feature source of truth is `docs/Auto-Save-Spec.md`; this
section records the contract as implemented.

### 7.1 Storage

| Key | Shape | Written when |
|---|---|---|
| `ocrQueue.batchId` | UUID string (random/Date fallback) | A questions paste |
| `ansKeyBatch` | the matching `batchId` | Key loaded with the questions; a key-only paste attaches to the current queue |
| `ansKeyConflicts` | `[{num, letters}]` | Key loaded; identical repeats are not conflicts |
| `ocrSaving` | `{num, at}` crash marker | Immediately before a save request |
| `ocrSavedLog` | `[{num, id, at, batchId, inactive, mode}]`, capped at 200 | Only after a verified save; `inactive` is `true`/`false`/`null` (confirmed, active/manual, or unverified); `mode` is `draft`, `active`, or `manual` |
| `autoLock` | `{tabId, at}` heartbeat | While a run is active |

A queue without `batchId`, or a key whose `ansKeyBatch` does not match it, is
legacy: manual use is unchanged and auto-save is blocked. Reset Queue clears the
queue, key, conflicts, and both batch ids (D-30).

### 7.2 Confirmation and controls

The panel adds Start, Stop, a Dry run button, and a `Save as active (live
immediately)` checkbox, none of which is persisted. Draft is the default.
Before Start, a batch block shows Subject, Category, Year, question count, key
count, the first/last question numbers, and the selected mode. It shows
`Mode: ACTIVE. Saved questions go live immediately.` in red bold, or
`Mode: draft (inactive).` Start stays disabled until `These are correct.` is
ticked and, in active mode, `I understand these go live to students now.` is
also ticked. The ticks reset on a new paste, a key-only paste, Reset, Clear
saved key, or a change to subject/category/year. Start is also disabled while
`ocrSaving` exists or the queue is finished, and the mode box is disabled while
a run is active.

### 7.3 Gate

`autosaveBlockers(state)` returns every blocking reason; the loop shows the
first one and stops. An empty list means safe. It checks:

1. `queue.batchId` exists and `ansKeyBatch === queue.batchId`.
2. Queue numbers are consecutive integers with no gap, repeat, null, or
   out-of-order entry (checked over the whole queue).
3. The key has an entry for every queue number and no extra numbers; only
   letters A–F are accepted.
4. The key has no recorded conflict.
5. This question's key letter is A–D; E/F blocks only this question.
6. The checked radio equals the key letter.
7. Parser flags are empty; `q.e`/`q.f` are empty; `E/F options present` is
   handled as a blocker rather than a generic flag.
8. Detected option letters are exactly `ABCD`.
9. Options A–D are non-empty, distinct after case/whitespace normalization, and
   each ≤500 UTF-8 bytes; the stem is at least 10 characters.
10. Subject, category, and year are set and the confirmation is ticked. In
    active mode the live-save confirmation is also ticked.
11. The selected mode did not change since Start.
12. No file is selected in `question_image` or `answer_video`. Diagram/table
    words do not block; the uploader decides whether a batch needs images
    (D-38).
13. No `ocrSaving` marker, no save in progress, Stop is off, and this tab holds
    `autoLock` (another tab is refused while its lock is under 15 seconds old).
14. The page is visible; a hidden tab finishes the current save and pauses.

The form is also compared with the loaded question before each save; an edited
form stops the run with `form no longer matches`.

### 7.4 Save classification and marker

The manual submit and the auto loop both call
`saveCurrentQuestion({auto, active})`. It writes `ocrSaving`, posts
`FormData(form)` to `location.href` with same-origin credentials and a
30-second abort timeout, then classifies the reply:

- **Rejected** — `Administrator Login`, or `.admin-error` with no redirect.
  Show the server text, clear the marker, do not advance.
- **Saved** — the reply redirected, has no error, matches the success regex, and
  its ID is greater than every ID in `ocrSavedLog`. A stale flash is not a save.
- **Ambiguous** — anything else, including a timeout or network error. Keep the
  marker, show `Unknown. It may have saved. Check the list.`, and never retry.

On Saved: auto-only state verification (`location.pathname + '?edit=<id>'`),
re-read `ocrSavedLog` and merge by `id` (keeping each entry's `mode`, capped at
200), advance the queue directly, clear the marker, clear the media and
explanation fields, refresh meta, and tick the next answer. A storage failure
while logging or advancing keeps the marker, stops the run, and shows
`Saved as #N but could not be logged. Do not retry.` Draft auto removes
`is_active` and sets `autosave=1`; active auto sets `is_active=1` and
`autosave=1`; manual keeps the active tick. Draft expects the edit page to show
inactive and active expects it checked. A mismatch stops the run with a red
warning (`SAVED AS ACTIVE` in draft, `SAVED AS INACTIVE` in active) but the save
is still logged and advanced so it cannot repeat. An unverified check is logged
as `inactive: null`; two consecutive unverified auto saves stop the run and are
named in the saved list. The log records the mode, and the saved-list suffix
distinguishes `inactive`, `active`, a mixed batch, a wrong-state mismatch, and
`status not verified`. Old entries without `mode` fall back to manual when
`inactive === false`, otherwise draft.

Queue-mutating controls (Load, Go to, Skip, Reset, Clear saved key) refuse while
a save is in flight, and a successful save only advances the queue if it still
points at the same batch/index/item it started with.

The manual submit refuses while an `ocrSaving` marker exists: it makes no POST
and shows `An earlier save is unconfirmed. Check the list, then tap 'I checked.
Clear warning.'`. After the marker is cleared, the same manual save proceeds
normally (Fix 2).

### 7.5 Lock, dry run, duplicates

- `autoLock` is refreshed every 5 seconds by a recursive `setTimeout`; a lock
  older than 15 seconds is stale. Stop, pause, blocker, and end release it.
- A normal Stop or the end of the queue is shown in the status line, not as a
  red blocked reason; only an actual blocker makes the reason line red.
- There is no save-count cap. A run continues until Stop, a blocker, or the end
  of the queue (D-43).
- Dry run copies the queue and uses the current form metadata. It logs
  `Would save #n as draft: subject/category/year, A to D, answer X.` or
  `Would save #n as ACTIVE: ...` and writes nothing to the queue, marker, saved
  log, or lock.
- Duplicate safeguards stop (not skip) the run when the number is already in
  this batch's saved log, or a recent admin-table row has the same normalized
  subject, exam year, category and question text. A long row is the server's
  first 139 characters plus `…`; a truncated row of at least 40 characters
  matches by prefix, and an untruncated row matches only the full text. A row
  whose year or category cannot be read falls back to subject and text. This
  covers this run/log and the loaded 20 rows; it cannot see older saves.

All server-derived text is rendered with `textContent` or created nodes, never
`innerHTML`. Option sizes are compared in UTF-8 bytes.

See `docs/INVARIANTS.md` for the full rule list and which items are unverified.
