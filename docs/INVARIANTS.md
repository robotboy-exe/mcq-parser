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
| INV-05 | Must remain a single-line `javascript:` URL with no comments and no `%`. Full-line `//` comments are allowed in the source and stripped by the build; inline `//` is forbidden (D-35). | VERIFIED | claude-migration §4, §10; user decision 2026-10-25 |
| INV-06 | Do not modify the PHP/server: CSRF handling, upload handling, PRG flow, form field names, and the four-option contract are off-limits. | VERIFIED | qwen-2-reconciled H03; claude-migration §10 |
| INV-07 | Removing the `ocr_helper.js` script tag does not unregister listeners it already attached. | AT_RISK | claude-migration §8 (issue 9) |
| INV-08 | Repeated injection creates another interval and DOM; nothing cleans the interval. | AT_RISK | qwen-2-reconciled R12 |

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
| INV-18 | Flags must cover: missing question number, question under 10 chars, missing A–D, options over 500 chars, duplicate letters, numbering gaps between kept markers, and `E/F options present` (D-37). | VERIFIED | qwen-2-reconciled §2.8; claude-migration §2; user request 2026-10-24; `tests/unit.js` |
| INV-19 | E and F are never flagged as missing. They are instead reported as `E/F options present`. | VERIFIED | claude-migration §2; D-37 |
| INV-20 | Parser flags are advisory: they must not silently block loading, queueing, or manual saving. Auto-Save consumes them as explicit blockers and shows the reason (D-33). | VERIFIED | qwen-2-reconciled inv 16; D-33 |
| INV-21 | Question markers must keep the sequence guard `if (last && (n <= last \|\| n > last + 5)) continue;`. | VERIFIED | qwen-1-gaps §5; qwen-1-gaps2 high-risk 4 |
| INV-22 | The absorbed-option post-processor must stay removed unless rewritten with correct escaping and tested against "Vitamin C." and "Vitamin B-12". | VERIFIED | claude-migration §4 |
| INV-23 | `OPTION` must keep `[^\S\n]*` after the label so a blank `C.` does not consume the following `D.`. | VERIFIED | claude-migration §2, §4 |
| INV-24 | Repeats, backwards numbers, and jumps greater than 5 are silently skipped by the sequence guard; this can merge text into the previous question. | AT_RISK | claude-migration §4, §8 (issue 6); qwen-2-reconciled E13 |
| INV-25 | Removing the post-processor intentionally gives up arbitrary absorbed-label repair; the regex plus loose E/F are the only recovery. | AT_RISK | claude-migration §3 (case 16), §5 |
| INV-26 | Appending E/F to Option D can exceed the 500-character server limit; the code flags but does not truncate. | AT_RISK | qwen-1-migration §5 risk 4 |
| INV-59 | A gap between kept question markers (`cur > prev + 1`) adds `question N missing (numbering gap)` to the later question; a run uses `questions N-M missing (numbering gap)`. | VERIFIED | user request 2026-10-24; fixture `gap-q10-missing` |

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
| INV-34 | Reset Queue clears `ansKey`, `ansKeyBatch`, `ansKeyConflicts`, and `batchId` as well as the queue (D-30, superseding D-26). | VERIFIED | user decision; `src/ui/ui.js` |
| INV-35 | Answer-key lookup is by printed book question number, not queue position. | VERIFIED | qwen-2-reconciled inv 21 |
| INV-36 | `localStorage` keys are `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`; queue shape is `{items:[],i:0,batchId?}`; meta fields are `subject_id`, `exam_category_id`, `exam_year`. The bookmarklet no longer touches `ocrSubmitted` (D-22). Auto-Save adds `ocrSaving`, `ocrSavedLog`, `autoLock`, `ansKeyBatch`, and `ansKeyConflicts`; additions only (D-32, D-36). | VERIFIED | qwen-2-reconciled inv 17, 19, 20; `src/ui/ui.js`; `tests/unit.js` |
| INV-37 | Subject, category, and year persist between questions via `ocrMeta`. | VERIFIED | qwen-2-reconciled inv 18 |
| INV-38 | Apply `FIXES` (`govemment→government`, `persidential→presidential`, `resposible→responsible`) before parsing the question text. | VERIFIED | qwen-2-reconciled inv 22 |
| INV-39 | Clearing browser storage resets the tool's state. | VERIFIED | qwen-1-migration §10; claude-migration §10 |
| INV-40 | `ocrSubmitted` is not read, written, or deleted by the bookmarklet (D-27). | VERIFIED | user decision; `src/ui/ui.js` |
| INV-41 | Reset Queue must not throw; it uses `{items:[],i:0}` and deletes the key/batch additions (INV-34). | VERIFIED | claude-migration §4; `src/ui/ui.js` |
| INV-55 | `localStorage` is origin-wide and shared with the live `ocr_helper.js`; the key names and shapes are a de-facto contract, so changing them can affect both tools. | AT_RISK | qwen-2-reconciled R15, §2.9 |
| INV-56 | A stale `ocrQueue` from an older variant must not be trusted; reset and re-paste after updating until the queue has a version marker or migration check. The batch-missing blocker stops auto-save, but manual use of a stale item is still possible. | AT_RISK | `archive/migration-docs/claude-gaps.md` item 6; EC-62; live V3 2026-10-25 |

## Header metadata

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-42 | The header is the first three lines; year is the first `20\d\d` match; it is written to `exam_year`. | VERIFIED | qwen-2-reconciled §2.7 |
| INV-43 | Header CRK/CRS/C.R.K./C.R.S./CHRISTIAN RELIGIOUS [STUDIES] selects a subject containing `CRS` or `CHRISTIAN RELIGIOUS`; the current live list contains `CRS` (id 14), so the alias selects it. | VERIFIED | qwen-2-reconciled inv/E15; user request 2026-10-24; `archive/live-sources/subjects-select-2026-10-23.html`; fixture harness uses that list |
| INV-44 | Without an alias, subject selection uses containment then word-overlap scoring (words longer than 2 chars). | AT_RISK | qwen-2-reconciled E17/R13 |
| INV-45 | `exam_category_id` is inferred from the header: POST UTME first, then JAMB/UTME, then WASSCE/WASCE/WAEC/SSCE/NECO/GCE, then General Practice; a bare `UTME` selects `JAMB / UTME`, and SSCE maps to `WASCE / NECO / GCE`. | VERIFIED | user request 2026-10-24; `archive/live-sources/admin_questions.html`; fixtures `header-crs-*` |
| INV-58 | Header metadata is applied from the question part, then the dropped section boundary, then the answer section; the first source to set a field wins. A key-only paste uses the boundary/answer header. | VERIFIED | user request 2026-10-24; browser mock check 2026-10-24 |

## Saving and server contract

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-46 | Submit by posting `new FormData(form)` to `location.href` with same-origin credentials so the hidden `csrf_token` and action are preserved. | VERIFIED | qwen-1-gaps §1; qwen-2-reconciled inv 24 |
| INV-47 | Submit interception must stay in the capture phase, with `preventDefault()` and `stopImmediatePropagation()`, to avoid double submission. | VERIFIED | qwen-2-reconciled inv 23 |
| INV-48 | Success is detected by `/Question saved successfully \(Question ID: (\d+)\)/`; failure by `.admin-error` or `Administrator Login` in the reply. | VERIFIED | qwen-2-reconciled inv 26, 27 |
| INV-49 | The PRG flow guarantees the success flash appears in the fetched response (successful save always matches the regex). | VERIFIED | `admin_questions.php`: flash stored in session, redirect, rendered as `.admin-success`; qwen-2-gaps §1 |
| INV-50 | On success, clear `question_image`, `answer_video`, `answer_explanation`. Manual saves force `is_active` on (D-24); draft auto saves remove it, active auto saves set it, and both set `autosave=1` and verify the edit page (D-31, D-39). | VERIFIED | qwen-2-reconciled inv 25; qwen-1-gaps §3; user decision; `src/ui/ui.js`; mock check 2026-10-25 |
| INV-51 | Server limits: exactly 4 non-empty options, each ≤500 chars, `correct_option` 0–3, `exam_year` 1900–2100, categories `id <= 10`, question/explanation ≤60000 chars. | VERIFIED | `admin_questions.php` validation and category query; qwen-2-reconciled §2.10; qwen-2-gaps §5–6 |
| INV-52 | Media uploads are out of scope: the bookmarklet has no file-selection UI and clears image/video inputs. | VERIFIED | qwen-2-gaps §4 |
| INV-53 | Saving must not scroll the page to the top. | VERIFIED | qwen-1-migration §3, §9 |
| INV-54 | Appended E/F newlines in Option D are stripped because `option_d` is a single-line input. | VERIFIED | claude-migration §8 (issue 3); `admin_questions.html`, `admin_questions.php` |
| INV-57 | The live `questions` table must accept the archived PHP's INSERT columns; the `practice_title` requirement seen in `questions1` is unverified for `questions`. | VERIFIED | `archive/migration-docs/claude-gaps.md` item 7; `admin_questions.php` insert; EC-63; live controlled save 2026-10-25 |

## Auto-Save

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-60 | Auto-save is opt-in: it never starts on page load or reload, Start requires the batch confirmation tick, and Start/Stop/Dry-run/tick state is not persisted. | VERIFIED | D-33; AS-05 handoff; mock check 2026-10-25 |
| INV-61 | A questions paste creates `queue.batchId`; with a key it sets `ansKeyBatch`. A key-only paste attaches to the current batch or deletes it. A missing or mismatched batch blocks auto-save but not manual use. | VERIFIED | D-32; `tests/unit.js`; mock check 2026-10-25 |
| INV-62 | The per-question gate blocks a non-consecutive queue, inexact key coverage, key conflicts, E/F key letters, a mismatched or absent radio, E/F options, non-ABCD letters, empty/duplicate/over-500-byte options, a short stem, missing meta, an unticked confirmation, a changed save mode, metadata that differs from the confirmed snapshot, attached files, text in `answer_explanation`, a marker/save/stop/lock/visibility block, a saved-batch number, a recent duplicate, or an edited form. The first reason is shown. Diagram/table words no longer block; the uploader decides whether a batch needs images (D-38). | VERIFIED | D-33, D-34, D-38; `tests/unit.js`; SPEC §7.3 |
| INV-63 | Parser E/F detection is advisory (`E/F options present`) but auto-save consumes it as a blocker; an E/F key letter blocks only that question. | VERIFIED | D-37; `tests/unit.js`; mock check 2026-10-25 |
| INV-64 | A reply is Saved only when it redirected, has no `.admin-error`, matches the success regex, and its ID exceeds every logged ID. A validation error or logged-out page is Rejected. Everything else is Ambiguous and is never retried. | VERIFIED | D-33; `tests/unit.js`; AS-04 handoff; live stale-success rejection 2026-10-25 |
| INV-65 | `ocrSaving` is written before the request and cleared only on a definite Saved/Rejected result for the current attempt; a rejected retry restores any earlier unresolved marker. An ambiguous result keeps it, disables Start, and shows the paused warning until the user clears it. A storage failure before the POST aborts without sending and without stranding the in-progress flag. After a confirmed save, a failure while logging or advancing the queue keeps the marker, stops the run, shows `Saved as #N but could not be logged. Do not retry.`, and does not retry. | VERIFIED | D-33; mock check 2026-10-25; live network loss 2026-10-25 (no retry); review fixes 2026-10-25 |
| INV-66 | `ocrSavedLog` is appended only after a verified save, stores `{num,id,at,batchId,inactive,mode}`, and is capped at 200. Before appending it re-reads storage and merges by `id`, keeping each entry's `mode`, so a save from another tab is not overwritten. `inactive` records the edit-page check (`true`/`false`/`null`); `mode` is `draft`, `active`, or `manual`, and old entries without it fall back to manual when `inactive === false`, otherwise draft. The saved list is batch-scoped, states active/inactive/mixed/wrong-state/unverified results honestly, names every unverified question in both the list and the copy text, and supports a copy action. Two consecutive unverified auto saves stop the run after logging and naming the second; a verified save resets the count, and manual saves do not participate. | VERIFIED | D-32, D-34, D-39; `tests/unit.js`; mock + live 2026-10-25 |
| INV-67 | A run holds `autoLock` with a 5-second heartbeat and refuses another tab whose lock is under 15 seconds old. A hidden tab finishes the current save, pauses, and does not auto-resume. A heartbeat write failure sets the stop flag and releases the lock instead of silently ending the heartbeat. | VERIFIED | D-33; `tests/unit.js`; mock check 2026-10-25. Live two-tab test paused tab 1 on hide before the lock reason could be observed |
| INV-68 | Dry run copies the queue, uses the current metadata, logs intended saves, performs no POST, and writes nothing to `ocrQueue`, `ocrSaving`, `ocrSavedLog`, or `autoLock`. | VERIFIED | AS-05; mock check 2026-10-25 (five scenarios) |
| INV-69 | Duplicate safeguards stop the run when the number is in this batch's saved log or a recent admin-table row has the same subject, exam year, category and question text. A long row is the server's first 139 characters plus `…`; a truncated row of at least 40 characters matches by prefix, an untruncated row only on the full text. An unreadable row year or category falls back to subject and text. They cannot detect saves older than the loaded 20-row page. | AT_RISK | D-34; `tests/unit.js`; documented limit in Auto-Save-Spec §9 |
| INV-70 | While a save is in flight, Load, Go to, Skip, Reset, and Clear saved key refuse and stop the run instead of mutating the queue; a successful save advances only the batch/index/item it started with, and logs the batch it started with. A normal Stop or queue end is status text, not a red blocked reason. | VERIFIED | review fix 2026-10-25; `src/ui/ui.js` |
| INV-71 | Active mode is opt-in and never persisted. Start requires the batch confirmation and the live-save confirmation, the mode is captured at Start, and a mid-run change is a blocker. Active auto saves set `is_active=1` and expect the edit page checked; draft auto saves delete it and expect it unchecked. Manual saves stay active. The AS-07 unverified list and two-consecutive-null stop apply in both modes. | VERIFIED | D-39; `tests/unit.js`; mock + live 2-question test 2026-10-25 |

## Multi-year bank and hostile OCR

| ID | Rule | Status | Source |
|---|---|---|---|
| INV-72 | `splitSectionsWithSalvage` is a gated pre-pass. All five bank slices produce zero inserts and byte-identical strict results; hostile anomaly inputs may trigger the repair. The repair is accepted only with at least 2 inserts and a strictly larger question-chunk count; otherwise the strict result is kept. Every item from an accepted repair carries `OCR boundaries repaired; verify question and option split`. | VERIFIED | P07; `anomaly-block2`; bank no-op check 2026-10-25; `tests/unit.js` |
| INV-73 | The bank fixtures cover five consecutive years with the archived question/key counts: 2021 40/40, 2022 40/40, 2023 40/40, 2024 24/40 (the partial Q17-Q40 slice), 2025 40/39. Each year is extracted from its documented source slice, and the extractor `--check` verifies source hash, anchors, counts, and output hashes. | VERIFIED | P02/P04/P05/P06; `tools/bank-slices.json`; `tools/extract-bank.js --check` 2026-10-25 |
| INV-74 | Unnumbered bullet text is a separate mode: when no line-start `N.` marker exists and there are at least 2 `*` bullets, `splitBulletQuestions` returns chunks with `num: null`; each chunk is flagged `question number missing`, and no number is invented. The archived block contains 19 bullets. | VERIFIED | P08; `anomaly-block1` 2026-10-25; `tests/unit.js` |
| INV-75 | Every expected fixture declares an `input_origin` of `bank`, `anomaly`, `doc`, or `synthetic`. Expected values are transcribed from cited sources, never generated from parser output; the runner rejects missing/unknown origins and orphan inputs. | VERIFIED | P01/P09; `tests/runner.js`; fixture audit 2026-10-25 |
| INV-76 | Auto-save has no save-count cap. A run continues until Stop, a blocker, or the end of the queue; dry run previews the whole queue. | VERIFIED | D-43; `src/ui/ui.js`; `src/parser/parser.js`; `tests/unit.js` |

## Counts

- Total: 75
- VERIFIED: 65
- AT_RISK: 10
- CONFLICTED: 0

## Conflict summary

No invariant remains CONFLICTED. The former conflicts were closed by the
archived PHP/HTML sources and the recorded decisions:

1. **INV-31 (E/F framing)** — now VERIFIED as a hard server constraint; the PHP
   enforces four options and `correct_option` 0–3. The lossy overwrite of D is
   documented as a side effect.
2. **INV-43 (CRK/CRS alias)** — now VERIFIED against the current live subject
   list: CRK or CRS selects the `CRS` option, and the full
   `CHRISTIAN RELIGIOUS STUDIES` name matches through the same alias. The
   fixture harness now uses that list.
3. **INV-49 (PRG success)** — now VERIFIED: the PHP stores the flash in the
   session, redirects, and renders it in the redirected page, which is the
   response the bookmarklet fetches.

Remaining AT_RISK items are listed in the tables above; they are operational
risks (repeated injection, numbering gaps, heuristic boundary salvage, E/F size,
fuzzy subject matching, shared/stale storage, live schema), not unresolved
source conflicts.
