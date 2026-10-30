# Invariants

Extracted from the archived migration docs and cross-referenced against the
baseline code (`src/parser/parser.js`, `src/ui/ui.js`, derived from
`archive/trusted-variants/trusted-variant-C.js`).

Status definitions:

- **VERIFIED** — the baseline variant preserves the rule by inspection and
  matches the stated behavior.
- **AT_RISK** — the rule is stated but fragile, unimplemented, untestable in
  this workspace, or depends on external behavior.
- **CONFLICTED** — sources disagree.

## Activation, installation, and build

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-01 | Must keep overriding/removing `ocr_helper.js` and the legacy `#ocr_input` `.admin-field` / `#ans_panel`, so duplicate UI and conflicting logic cannot run. | VERIFIED | qwen-2-reconciled inv 1; qwen-1-migration inv 4; qwen-1-gaps |
| INV-02 | Must refuse to run unless the Add-a-New-Question form exists (`save_question` action + `correct_option` radios) and the URL does not contain `edit=`. | VERIFIED | qwen-2-reconciled inv 2–5; qwen-1-migration inv 3 |
| INV-03 | The success/error container (`#ans_res`) must be injected directly after the form's submit button, never hardcoded into the main panel HTML. | VERIFIED | qwen-1-migration inv 5 |
| INV-04 | The injected UI depends on backend CSS classes: `admin-field`, `admin-btn`, `admin-btn-muted`, `admin-note`, `admin-alert`, `admin-error`. | VERIFIED | qwen-1-gaps2 nice-to-have 2; confirmed in `archive/live-sources/admin_questions.php` and `.html` |
| INV-05 | Must remain a single-line `javascript:` URL with no `//` comments. | VERIFIED | claude-migration §4, §10 |
| INV-06 | Do not modify the PHP/server: CSRF handling, upload handling, PRG flow, form field names, and the four-option contract are off-limits. | VERIFIED | qwen-2-reconciled H03; claude-migration §10 |
| INV-07 | Removing the `ocr_helper.js` script tag does not unregister listeners it already attached. | AT_RISK | claude-migration §8 (issue 9) |
| INV-08 | Repeated injection creates another interval and DOM; nothing cleans the interval. | VERIFIED | qwen-2-reconciled R12; archived-page browser run 2026-10-30 |

## Parsing contract

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-09 | Newlines must survive normalization until option matching; a blanket `text.replace(/\s+/g,' ')` before matching is forbidden. | VERIFIED | qwen-2-reconciled inv 11 |
| INV-10 | Dual capture handling `const letter = m[1] \|\| m[2]` must remain. | VERIFIED | qwen-2-reconciled inv 12 |
| INV-11 | The dotless-letter exception is allowed only after a newline and only when followed by a digit; it must never be re-extended to `^`. | VERIFIED | qwen-2-reconciled inv 9 |
| INV-12 | Inline options (`... A. x B. y ...`) must remain supported. | VERIFIED | qwen-2-reconciled inv 10 |
| INV-13 | A leading article at the start of a chunk (`A 5 ...`, `A good ...`) must never be an option unless it has `.` or `)`. | VERIFIED | qwen-2-reconciled inv 8 |
| INV-14 | The main option regex recognizes uppercase A–F only; the page itself accepts only four options. | VERIFIED | qwen-2-reconciled inv 6 |
| INV-15 | Option text written to the form must not carry its own `A.`/`B.`/etc. label. | VERIFIED | qwen-2-reconciled inv 15 |
| INV-16 | An empty option must stay empty and be reported as that option missing; a later option must not be pulled into its place. | VERIFIED | qwen-2-reconciled inv 14; claude-migration §4 |
| INV-17 | Duplicate option letters must be flagged. | VERIFIED | claude-migration §4; qwen-2-reconciled inv 16 |
| INV-18 | Flags must cover: missing question number, question under 10 chars, missing A–D, options over 500 chars, duplicate letters. | VERIFIED | qwen-2-reconciled §2.8; claude-migration §2 |
| INV-19 | E and F are never flagged as missing. | VERIFIED | claude-migration §2 |
| INV-20 | Flags are advisory; they must not silently block loading, queueing, or saving. | VERIFIED | qwen-2-reconciled inv 16 |
| INV-21 | Question markers must keep the sequence guard `if (last && (n <= last \|\| n > last + 5)) continue;`. | VERIFIED | qwen-1-gaps §5; qwen-1-gaps2 high-risk 4 |
| INV-22 | The absorbed-option post-processor must stay removed unless rewritten with correct escaping and tested against "Vitamin C." and "Vitamin B-12". | VERIFIED | claude-migration §4 |
| INV-23 | `OPTION` must keep `[^\S\n]*` after the label so a blank `C.` does not consume the following `D.`. | VERIFIED | claude-migration §2, §4 |
| INV-24 | Numbering gaps and repeats should be flagged (HO requirement), but the code only skips them. | AT_RISK | claude-migration §4, §8 (issue 6) |
| INV-25 | Removing the post-processor intentionally gives up arbitrary absorbed-label repair; the regex plus loose E/F are the only recovery. | AT_RISK | claude-migration §3 (case 16), §5 |
| INV-26 | Appending E/F to Option D can exceed the 500-character server limit; the code flags but does not truncate. | AT_RISK | qwen-1-migration §5 risk 4 |

## E/F and correct answers

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-27 | E/F answers collapse into Option D (correct index 3); the page has no E/F radios. | VERIFIED | qwen-2-reconciled inv 13; claude-migration §2 |
| INV-28 | With a key, E/F goes to D or is removed if wrong. Without a key, E/F is appended to D. If the key says E but no E text exists, D is untouched and nothing is ticked. | VERIFIED | claude-migration §4 |
| INV-29 | No radio may be pre-ticked unless the key provides the answer; clear the form's default Option A on fill. | VERIFIED | claude-migration §4 |
| INV-30 | The correct-option value sent must be 0–3; radio value 4/5 does not exist. | VERIFIED | qwen-2-reconciled inv 7; qwen-1-gaps §4 |
| INV-31 | Four options are a hard server constraint, so E/F merging is required rather than an optional compromise. | VERIFIED | qwen-2-gaps §2; `admin_questions.php` enforces four non-empty options and `correct_option` 0–3 |

## Keys, queue, and persistence

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-32 | A key-only paste must not clear the question queue. | VERIFIED | claude-migration §4 |
| INV-33 | A paste with questions replaces the old key; a paste with no key clears it. | VERIFIED | claude-migration §4 |
| INV-34 | Reset Queue leaves the key intact (product decision D-26). | VERIFIED | user decision; `src/ui/ui.js` |
| INV-35 | Answer-key lookup is by printed book question number, not queue position. | VERIFIED | qwen-2-reconciled inv 21 |
| INV-36 | `localStorage` keys are `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`; queue shape is `{items:[],i:0}`; meta fields are `subject_id`, `exam_category_id`, `exam_year`. The bookmarklet no longer touches `ocrSubmitted` (D-22). | VERIFIED | qwen-2-reconciled inv 17, 19, 20; `src/ui/ui.js` |
| INV-37 | Subject, category, and year persist between questions via `ocrMeta`. | VERIFIED | qwen-2-reconciled inv 18 |
| INV-38 | Apply `FIXES` (`govemment→government`, `persidential→presidential`, `resposible→responsible`) before parsing the question text. | VERIFIED | qwen-2-reconciled inv 22 |
| INV-39 | Clearing browser storage resets the tool's state. | VERIFIED | qwen-1-migration §10; claude-migration §10 |
| INV-40 | `ocrSubmitted` is not read, written, or deleted by the bookmarklet (D-27). | VERIFIED | user decision; `src/ui/ui.js` |
| INV-41 | Reset Queue must not throw; it must use `{items:[],i:0}`. | VERIFIED | claude-migration §4 |
| INV-55 | `localStorage` is origin-wide and shared with the live `ocr_helper.js`; the key names and shapes are a de-facto contract, so changing them can affect both tools. | AT_RISK | qwen-2-reconciled R15, §2.9 |
| INV-56 | An old deployed-helper queue without `e`/`f` loads structurally, but stale parsed content is not repaired; reset and re-paste after updating until the queue has a version marker or migration check. | AT_RISK | `archive/migration-docs/claude-gaps.md` item 6; browser check 2026-10-30; EC-62 |

## Header metadata

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-42 | The header is the first three lines; year is the first `20\d\d` match; it is written to `exam_year`. | VERIFIED | qwen-2-reconciled §2.7 |
| INV-43 | Header CRK/C.R.K. selects a subject containing `CRS` or `CHRISTIAN RELIGIOUS`; the current live list contains `CRS` (id 14), so the alias selects it. | VERIFIED | qwen-2-reconciled inv/E15; `archive/live-sources/subjects-select-2026-10-23.html`; fixture harness uses that list |
| INV-44 | Without an alias, subject selection uses containment then word-overlap scoring (words longer than 2 chars). | AT_RISK | qwen-2-reconciled E17/R13 |
| INV-45 | `exam_category_id` is never inferred. | VERIFIED | qwen-2-reconciled §2.7; claude-migration §2 |

## Saving and server contract

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-46 | Submit by posting `new FormData(form)` to `location.href` with same-origin credentials so the hidden `csrf_token` and action are preserved. | VERIFIED | qwen-1-gaps §1; qwen-2-reconciled inv 24 |
| INV-47 | Submit interception must stay in the capture phase, with `preventDefault()` and `stopImmediatePropagation()`, to avoid double submission. | VERIFIED | qwen-2-reconciled inv 23 |
| INV-48 | Success is detected by `/Question saved successfully \(Question ID: (\d+)\)/`; failure by `.admin-error` or `Administrator Login` in the reply. | VERIFIED | qwen-2-reconciled inv 26, 27 |
| INV-49 | The PRG flow guarantees the success flash appears in the fetched response (successful save always matches the regex). | VERIFIED | `admin_questions.php`: flash stored in session, redirect, rendered as `.admin-success`; qwen-2-gaps §1 |
| INV-50 | On success, clear `question_image`, `answer_video`, `answer_explanation`; force `is_active` on during fill and submit (D-24). | VERIFIED | qwen-2-reconciled inv 25; qwen-1-gaps §3; user decision; `src/ui/ui.js` |
| INV-51 | Server limits: exactly 4 non-empty options, each ≤500 chars, `correct_option` 0–3, `exam_year` 1900–2100, categories `id <= 10`, question/explanation ≤60000 chars. | VERIFIED | `admin_questions.php` validation and category query; qwen-2-reconciled §2.10; qwen-2-gaps §5–6 |
| INV-52 | Media uploads are out of scope: the bookmarklet has no file-selection UI and clears image/video inputs. | VERIFIED | qwen-2-gaps §4 |
| INV-53 | Saving must not scroll the page to the top. | VERIFIED | qwen-1-migration §3, §9 |
| INV-54 | Appended E/F newlines in Option D are stripped because `option_d` is a single-line input. | VERIFIED | claude-migration §8 (issue 3); `admin_questions.html`, `admin_questions.php` |
| INV-57 | The live `questions` table accepts the archived PHP's INSERT columns without the `practice_title` field seen in the separate `questions1` dump. | VERIFIED | production bookmarklet save 5040 on 2026-10-30; `admin_questions.php` insert; EC-63 |

## Extraction, fixtures, and hostile OCR

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-58 | Salvage is a guarded pre-pass: bank inputs produce zero inserts, and the repaired text is used only when inserts ≥ 2 and it yields more chunks than the strict parse. Otherwise the strict result is returned unchanged. | VERIFIED | `src/parser/parser.js`; `tests/runner.js`; P07 |
| INV-59 | Bank key sizes: 2021, 2022, 2023, and 2024 parse to 40 entries; 2025 parses to 39 because entry 26 is absent from the source. | VERIFIED | `bank-2021`–`bank-2025` fixtures; `tools/extract-bank.js` |
| INV-60 | Anomaly block 2 yields 12 chunks (`null, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16`); Q4 and Q9 remain merged, Q5/Q6/Q10/Q11 do not exist, and Q16 has only A/B. | VERIFIED | `anomaly-block2` fixture; P07 |
| INV-61 | Anomaly block 1 (`*` bullets) yields 19 chunks, all with `num: null`, and only in bullet mode when no line-start numbered marker exists. | VERIFIED | `anomaly-block1` fixture; P08 |
| INV-62 | Expected fixtures are transcribed from sources/docs, never generated from parser output, and every spec declares one of `bank`, `anomaly`, `doc`, or `synthetic`. | VERIFIED | P01/P09; `tests/runner.js`; `AGENTS.md` |

## Counts

- Total: 62
- VERIFIED: 55
- AT_RISK: 7
- CONFLICTED: 0

## Conflict summary

No invariant remains CONFLICTED. The former conflicts were closed by the
archived PHP/HTML sources and the recorded decisions:

1. **INV-31 (E/F framing)** — now VERIFIED as a hard server constraint; the PHP
   enforces four options and `correct_option` 0–3. The lossy overwrite of D is
   documented as a side effect.
2. **INV-43 (CRK alias)** — now VERIFIED against the current live subject
   list: CRK selects the `CRS` option. The fixture harness now uses that list.
3. **INV-49 (PRG success)** — now VERIFIED: the PHP stores the flash in the
   session, redirects, and renders it in the redirected page, which is the
   response the bookmarklet fetches.

Remaining AT_RISK items are listed in the tables above; they are operational
risks (legacy helper listeners, numbering gaps, absorbed-label repair, E/F
size, fuzzy subject matching, and shared/stale storage), not unresolved source
conflicts.
