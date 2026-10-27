# Decisions

Why the unusual implementation choices exist. Each entry is evidence-based
(`archive/migration-docs/*.md`, `src/parser/parser.js`, `src/ui/ui.js`); no
new rationale is invented. Where sources disagree, the disagreement is stated.

## D-01 — Reuse the existing form instead of a separate importer

**Choice.** Inject a UI into `admin_questions.php` and save through its form.
**Why.** The documented project is a paste-and-fill helper on the existing
Add-a-New-Question page. The migration docs repeatedly state not to change the
PHP or field names.
**Risk.** Depends on page classes (`admin-field`, `admin-btn`, `admin-alert`,
`admin-error`), the `save_question` action, `correct_option` radios, and the
exact success flash text.

## D-02 — Remove the live helper and legacy panels first

**Choice.** Remove `script[src*="ocr_helper.js"]`, the old `#ocr_input` panel,
and `#ans_panel` on injection.
**Why.** This lets the bookmarklet override the deployed helper without
redeploying server files (qwen-2 D01).
**Risk.** Removing the script tag does not unregister listeners it already
attached; repeated injection can create another interval and DOM (claude §8
issue 9; qwen-2 R12).

## D-03 — Refuse `edit=` pages

**Choice.** Alert and return unless the add form exists and the URL has no
`edit=`.
**Why.** Automation targets only `save_question`; editing existing records is
out of scope (qwen-2 D02).
**Risk.** None documented beyond the tool being unavailable for edits.

## D-04 — Keep the option regex permissive instead of a lookbehind

**Choice.** `OPTION = /(?:^|\n|\s)([A-F])[^\S\n]*[.)][^\S\n]*|\n\s*([A-F])\s+(?=\d)/g`
with dual capture groups.
**Why.** A lookbehind version produced false positives on prose letters
(`A 5 year old`, `A good example`). The strict newline-only dotless branch
stops leading articles becoming options (qwen-2 D03, D07). Branch 1 keeps
inline options working after an initial over-strict version broke them
(qwen-2 D06).
**Risk.** The dotless exception is newline-only and digit-only. Adding `^`
back to that branch previously caused the duplicate-A regression; removing the
whitespace-prefixed dotted branch breaks inline questions. The trailing
whitespace-consumption interaction is the mechanism behind blank-`C.`
absorption (qwen-2 R01).

## D-05 — Preserve newlines in `raw`

**Choice.** Normalize line endings and horizontal runs but do not collapse all
whitespace before option matching: `raw = text.replace(/\r\n?/g,'\n')
.replace(/[^\S\n]+/g,' ').replace(/\n{3,}/g,'\n\n')`.
**Why.** The dotless branch depends on a newline. A blanket `\s+ → ' '` before
matching previously broke it (qwen-2 D05, R03; INV-09).
**Risk.** Extracted slices are still collapsed later by `clean`, so newlines
inside option text are lost.

## D-06 — `[^\S\n]*` after the option label

**Choice.** Consume horizontal whitespace, not line breaks, after a label.
**Why.** With `\s*`, a blank `C.` line swallowed the following `D.` label,
producing a misleading "option D missing" (claude §5.2, §9).
**Risk.** Option text on the following line only attaches because slicing runs
to the next marker; changing this interaction can resurrect the blank-option
bug.

## D-07 — No absorbed-option post-processor

**Choice.** The baseline C has only the `[^\S\n]*` regex; the earlier
post-processor is absent.
**Why.** It was removed because it barely matched with its escaping and would
have split `Vitamin C.` incorrectly if fixed. The main splitter already handles
A–F, and `[^\S\n]*` fixes the blank-`C.` case (claude §5.4, §9).
**Risk.** Arbitrary absorbed-label repair is intentionally given up. A
reintroduced post-processor must be rewritten with correct escaping and tested
against `Vitamin C.` and `Vitamin B-12` (INV-22, INV-25).

## D-08 — Loose E/F fallback

**Choice.** If E is missing and D exists, accept a line after D that starts
with lone `E` + whitespace + text; F similarly after E.
**Why.** OCR often writes `E Abraham` without a dot. Without fallback, D went
blank when the key said E, or the E text stuck to D when the key said A–D
(claude §9).
**Risk.** A continuation line in D starting with `E ` or `F ` (for example
`F = ma`) can be mistaken for a new option. Limited to after D/E, which
reduces but does not remove the risk (claude §5.3).

## D-09 — Always merge E/F into Option D

**Choice.** With a key, E/F replaces D and ticks D. Without a key, E/F is
appended to D as labeled text; nothing is ticked.
**Why.** The page has exactly four option fields and `correct_option` 0–3.
There are no E/F radios (claude §9; qwen-2 D10; INV-27, INV-30). The original
PHP (`admin_questions.php`) confirms the four-option rule and 0–3 range, so this
is recorded as a hard server constraint; the lossy overwrite of D is a side
effect, not the framing.
**Risk.** Lossy: D's original text is overwritten when E/F is the key answer;
appended E/F text can make D exceed 500 characters; `option_d` is a single-line
input, so the `\n\n` separator is stripped (confirmed by the archived form).

## D-10 — Never pre-tick an answer

**Choice.** Clear all `correct_option` radios on every fill; tick only when the
key supplies an answer.
**Why.** The form defaults to Option A. An unkeyed question must be answered
manually, not accidentally saved as A (claude §4; INV-29).
**Risk.** None documented; `tick()` can still override a manual selection when
the queue index changes.

## D-11 — Numbering guard `n > last && n <= last + 5`

**Choice.** Keep a marker only if it advances the sequence by 1–5.
**Why.** OCR text contains years, page numbers, and verse numbers that look
like question markers. The +5 window allows minor OCR numbering errors (qwen-1
gaps §5; qwen-2 D-log).
**Risk.** Real gaps larger than 5, restarts at 1, or OCR digit errors cause
markers to be skipped and text to merge into the previous question. The docs
require gap/repeat *flags*; the code only skips (INV-24, qwen-2 R08).

## D-12 — Section split order: divider → key-only → header → structure → none

**Choice.** Stop at the first matching heuristic; the boundary line is included
only if it is key-like or has ≥2 inline pairs.
**Why.** It covers the observed key layouts: explicit divider, all-key paste,
`ANSWERS`-style header, and a structural run after the last question. It was
judged better than B3's alternative algorithm (claude §9).
**Risk.** The order is fragile. A false divider/header can split a question;
a missed header can leave key lines in the question stream (claude §5.9;
INV-25 is about the post-processor, not this order).

## D-13 — Key is replaced or cleared by each questions paste

**Choice.** A paste with questions replaces the old key; with no detected key
it deletes the old key. A key-only paste keeps the queue.
**Why.** The user's stated rule: an answer key is relevant only in the moment.
Mid-queue correction is supported by pasting only the key (claude §9, §7).
**Risk.** A questions paste with a missed key section silently clears a good
key. Key persistence across reloads is resolved: the key is read from `ansKey`
and survives reloads (user decision, D-25). (INV-32, INV-33.)

## D-14 — Reset Queue leaves the key intact

**Choice.** `queue = { items: [], i: 0 }`; `ansKey` is untouched.
**Why.** This is the implemented behavior and the resolved product decision
(user decision, D-26): Reset is queue-only, and "Clear saved key" remains the
explicit key-clearing action (claude §8 issue 4; INV-34).
**Risk.** A user who expects Reset to clear everything may be surprised; the two
buttons are deliberately separate.

**Superseded by D-30 (Auto-Save).** Reset now also clears `ansKey`,
`ansKeyBatch`, `ansKeyConflicts`, and `queue.batchId`.

## D-15 — Header limited to first 3 lines; first `20\d\d` wins

**Choice.** Join the first 3 lines, uppercase them, take the first `20\d\d`,
and infer the subject from that header.
**Why.** It matches the documented OCR header layout, e.g.
`IMPROVISED C. R. K. QUESTIONS FOR 2021` (qwen-2 D13).
**Risk.** A copyright/reference year in the header can be written as
`exam_year`; a header longer than 3 lines or a typo like `2O21` yields no year.
The UI does not validate the 1900–2100 range (EC-44, EC-61; qwen-2 R14).

## D-16 — Subject fuzzy matching, with a CRK→CRS alias

**Choice.** Try the CRK/`C.R.K.`/`CHRISTIAN RELIGIOUS` alias first; otherwise
score options by containment then word overlap.
**Why.** The paper label and the database subject name differ; the fuzzy path
handles headers that do not use an alias (qwen-2 D13).
**Risk.** Containment/overlap can still pick the wrong subject for names that
share words. On the current list, `English (Oral)` and `English Language`
resolve correctly, and CRK selects `CRS` (id 14); new or renamed subjects can
reintroduce collisions (EC-41/INV-43; qwen-2 R13).

## D-17 — `FIXES` for three OCR typos only

**Choice.** Correct `govemment`, `persidential`, `resposible` in the question
part before parsing.
**Why.** These were recurring OCR errors observed during development
(qwen-2 D-log).
**Risk.** The list is not general. Other misspellings (`convenant`, `Raphel`,
`centirion`, etc.) are deliberately not repaired; adding fixes changes question
text and must be intentional (qwen-2 §7).

## D-18 — Save via `fetch` + success-text match, not a page reload

**Choice.** Intercept submit in the capture phase, POST `FormData(form)` to
`location.href`, and detect success by
`/Question saved successfully \(Question ID: (\d+)\)/`.
**Why.** It keeps the queue state on the page, preserves the CSRF token and
action, and advances automatically (qwen-2 D12; claude §9).
**Risk.** Coupled to the exact flash wording. The archived PHP confirms the PRG
flow: it stores `cbt_admin_flash`, redirects with `Location`, and renders the
flash in the redirected page, so the fetched response does contain the success
text (INV-49 resolved; `admin_questions.php`). Still do not change the detector
without updating the server contract (qwen-2 H07).

## D-19 — 600 ms polling of the queue index

**Choice.** Re-run `tick()` whenever the persisted queue index changes.
**Why.** It re-ticks after Skip/save without requiring an event from the form.
**Risk.** It can overwrite a manual radio choice when the index changes. It
does not clean itself up on repeated injection (claude §9; qwen-2 R12).

## D-20 — Flags are advisory

**Choice.** Show all flags in `#ocr_status` but never block load, queue
advance, or save.
**Why.** Human review is expected; the operator can skip or correct a question
(qwen-2 D09).
**Risk.** A malformed question can be saved if the operator ignores the flag;
server-side validation then decides.

## D-21 — Shared `localStorage` key names

**Choice.** Use `ocrQueue`, `ocrMeta`, and `ansKey` with the documented shapes.
`ocrSubmitted` remains a shared key name but the bookmarklet no longer touches
it (D-22).
**Why.** They enable reload-safe bulk entry and a key keyed by printed book
number (qwen-2 D11).
**Risk.** Storage is origin-wide and shared with the live `ocr_helper.js`;
renaming or reshaping these keys can affect both tools (INV-55; qwen-2 R15).

## D-22 — `ocrSubmitted` is no longer handled

**Choice.** The bookmarklet does not read, write, or delete `ocrSubmitted`.
**Why.** Its writer is not in any supplied code. The deployed helper shares the
same queue storage, so a stale flag could have advanced the bookmarklet's queue
unexpectedly. The user decided the bookmarklet should be self-contained
(D-27).
**Risk.** If the deployed helper relies on the bookmarklet to consume its flag,
that handoff no longer happens. No supplied code writes the flag.

## D-23 — Build produces a single-line `javascript:` URL

**Choice.** Concatenate parser + UI + bootstrap, strip blank lines, trim each
line, join with spaces, wrap in `javascript:(function(){try{...}catch(e){...}})();`.
**Why.** It runs from a bookmark, so it must be one line and contain no `//`
comments that would truncate the URL (claude §10; INV-05).
**Risk.** Trimming lines is only safe because the source has no meaningful
leading/trailing whitespace inside template literals; a future multi-line string
could be altered by the build. Always edit the modules, not the generated file.

## D-24 — Force `is_active` on

**Choice.** Check the `is_active` box in `fillForm` and again immediately before
submit, so every imported question is saved active.
**Why.** User decision: imports should go live immediately rather than depending
on the form's remembered state.
**Risk.** An unreviewed question is visible to students as soon as it is saved.
The server records `is_active` from the checkbox (`admin_questions.php`), so the
forced state is authoritative.

**Superseded by D-31 (Auto-Save) for auto saves and by D-39 for active mode.**
Manual saves remain active; draft auto saves remove `is_active`, active auto
saves set it, and both verify the result.

## D-25 — The key persists across reloads

**Choice.** Read `ansKey` at boot; do not clear it on load.
**Why.** User decision: a reload mid-queue must not lose the key.
**Risk.** A stale key remains until a questions paste replaces it or the user
presses "Clear saved key".

## D-26 — Reset Queue kept the key (superseded by D-30)

**Choice.** Reset clears only the queue; the key stays.
**Why.** User decision: key clearing is the separate "Clear saved key" action.
**Risk.** Users who expect a full reset must use both controls.

**Superseded by D-30 (Auto-Save).** Reset now clears the key and batch identity.

## D-27 — Do not consume the legacy `ocrSubmitted` flag

**Choice.** Remove the boot-time read/delete/advance block.
**Why.** User decision: both tools share queue storage, so an old/stale flag
could skip a question. Nothing in the bookmarklet writes it.
**Risk.** Any external helper that relied on this bookmarklet to consume its
flag no longer gets that behavior.

## D-28 — B1/B2/B3 mapping

**Choice.** Treat the supplied root files as B1 = `first.js`, B2 = `third.js`,
B3 = `second.js`; archive them as `archive/legacy-bookmarklets/b1.js`,
`b2.js`, and `b3.js`.
**Why.** B3 is the only file with `splitCombinedText` and no key-only path; B2
has `splitSections`, "Show paste box", and the Reset bug; B1 has no "Show paste
box" and the weaker `splitCombined` splitter with correctly escaped
option-splitting. The original filenames did not encode this order.
**Risk.** None for the baseline: `trusted-variant-C.js` remains the merged
artifact built from B2, and the archived B files are reference-only.

## D-29 — Numbering-gap flags go on the following question

**Choice.** After parsing, if a kept marker jumps by more than 1, add
`question N missing (numbering gap)` (or a range) to the later question's flags.
**Why.** The operator sees the warning when the queue reaches the question
after the gap, which is where the missing sequence becomes relevant. It keeps
the advisory-only rule: nothing is blocked.
**Risk.** A real restart or OCR digit error can produce a false gap flag; a
repeat, backwards marker, or jump greater than 5 is still silently skipped and
does not produce this flag.

## D-30 — Reset Queue also clears the key and batch identity

**Choice.** Reset sets `queue = {items:[], i:0}`, deletes `ansKey`,
`ansKeyBatch`, and `ansKeyConflicts`, and therefore removes `batchId`.
**Why.** Auto-Save treats a key as relevant only to the batch it was loaded
with. A leftover key with no queue is a legacy state that must not be
auto-saved. Supersedes D-14 and D-26.
**Risk.** A user who expected Reset to preserve the key must re-paste it. The
separate "Clear saved key" action still exists.

## D-31 — Draft auto saves inactive; manual stays active

**Choice.** `fillForm`/`showOCR` tick `is_active` only on the manual path. The
manual submit ensures `is_active=1`. Draft auto deletes `is_active` from the
`FormData`, sets `autosave=1`, and verifies the edit page after a save; active
mode is D-39.
**Why.** Auto-save creates drafts for review; the ordinary manual import remains
immediately active. Supersedes D-24 and the forced-on half of INV-50, and is
superseded in part by D-39 for active mode.
**Risk.** Auto depends on the browser verification to catch a server or form
that changes the state; the verification result can be unknown.

## D-32 — Batch identity and legacy blocking

**Choice.** A questions load creates `queue.batchId` and, when a key is present,
`ansKeyBatch = queue.batchId`. A key-only paste attaches to the current queue's
batch id or deletes `ansKeyBatch`. A queue without `batchId`, or a key whose
`ansKeyBatch` does not match, is legacy: manual use works, auto is blocked.
**Why.** It prevents an old key from being paired with a new queue and gives the
saved log a batch scope.
**Risk.** Existing stored queues become manual-only until the user re-pastes the
questions. Adding `batchId` is additive but changes the `ocrQueue` shape.

## D-33 — Auto-save is opt-in, gated, and never retries

**Choice.** Auto-save starts only from a click after the batch confirmation is
ticked. It re-checks every gate before each save, writes `ocrSaving` before the
request, clears it only on a definite result, and treats an unknown result as
ambiguous and stops.
**Why.** A draft save must not duplicate questions or silently continue after an
uncertain response.
**Risk.** An interrupted save leaves a marker that blocks Start until the user
checks the list and clears it. A hidden tab or a second tab pauses the run.

## D-34 — Duplicate safeguards stop the run

**Choice.** If the question number is already in this batch's saved log, or a
recent table row has the same normalized subject, exam year, category and
question text, auto stops and shows the reason. It does not silently skip. A
long row is the server's first 139 characters plus `…`; a truncated row of at
least 40 characters matches by prefix, an untruncated row only on the full
text. A row with an unreadable year or category is treated as unknown for that
field and falls back to subject and text.
**Why.** The user chose visibility over speed. A silent skip can hide a real
duplicate. Scoping by year and category allows deliberate cross-year and
cross-category copies.
**Risk.** The check only covers this run/log and the loaded 20-row page; it
cannot catch a duplicate saved long ago. A missing row year or category makes
the check broader, not narrower.

## D-35 — Full-line comments, no `%` in the bookmarklet

**Choice.** Full-line `//` comments are allowed in the modules and stripped by
`build.js`. Inline `//` comments remain forbidden. The build fails if the final
bookmarklet contains `%`; the one inline `width:100%` was removed because the
admin page CSS already sets it.
**Why.** The spec asks for readable commented source, but `//` truncates a
`javascript:` URL and `%` can be decoded by a bookmark manager.
**Risk.** A future template literal with a line starting `//` would be stripped;
keep template literals single-line or avoid a leading `//`.

## D-36 — `parseKeyDetailed` shares the key matcher

**Choice.** Add `parseKeyDetailed(text)` returning `{key, conflicts}`. `parseKey`
returns only `key`, built by the same matcher. Conflicts are repeated numbers
with differing letters; identical repeats are not conflicts.
**Why.** Existing readers and fixtures keep the plain map, while auto-save can
block an ambiguous key.
**Risk.** Conflicts are cached in `ansKeyConflicts` so a reload cannot hide
them; that is an additive storage key.

## D-37 — Parser flags E/F options

**Choice.** `parseQuestion` adds `E/F options present` when `q.e` or `q.f` is
non-empty.
**Why.** Auto-save must not send an E/F question through the four-option form;
the flag makes the reason visible to the user and lets the gate block it.
**Risk.** Every E/F question now shows an advisory flag in manual mode. The
existing E/F fixtures must expect it.

## D-38 — The uploader owns the media decision

**Choice.** Remove the `NEEDS_PICTURE` word list, the `needs-media` blocker,
and its test. Keep the `file-attached` blocker. Diagram, figure, graph, table,
passage and similar words no longer block auto-save.
**Why.** The uploader decides whether a batch needs images. Guessing from words
is redundant and causes false stops. A future media feature must use an
explicit uploader signal, not text guessing.
**Risk.** A batch that genuinely needs an image can be auto-saved without one
if the uploader does not attach it. The explicit file check still refuses when
a file is already chosen.

## D-39 — Active mode is fixed per run

**Superseded in part by D-51.** The default is now active and the two
confirmations have collapsed to one mode-aware tick. The rest of this decision
stands.

**Choice.** The active choice is an in-memory checkbox that is never persisted.
The selected mode is captured in `runMode` at Start and a change during a run is
a blocker. Active auto saves set `is_active=1` and `autosave=1` and verify that
the edit page is active; draft auto saves keep deleting `is_active` and verify
that it is inactive. Manual saves are unchanged and remain active. The saved log
records `mode`, and the saved-list suffix names active, inactive, mixed,
wrong-state, and unverified results. The AS-07 two-consecutive-unverified stop
still applies in both modes.
**Why.** Canonical replication needs batches live immediately, but the mode must
not change under a running loop. The mode is client-side only; it adds no server
change and no new storage key (the `ocrSavedLog` entry gains `mode`).
**Risk.** Active questions are visible to students as soon as each save lands;
a wrong-state check stops the run but cannot undo a save. Old saved-log entries
have no `mode`; they are treated as manual when `inactive === false`, otherwise
draft, so an old verified-active auto save shows as active/manual.

## D-40 — Guarded boundary salvage before question split

**Choice.** Add `salvageNormalize` and `splitSectionsWithSalvage`. The repair
only inserts missing question and option boundaries (a mid-line `N.` before a
capital/quote/paren, a spaced numbered start before a capitalized word, and a
fused `A.`–`F.` label after lowercase text or punctuation). It runs on a copy,
compares against the strict result, and is accepted only with at least 2
inserts and strictly more question chunks. Accepted items get the advisory
`OCR boundaries repaired; verify question and option split` flag.
**Why.** The archived hostile block fused most question numbers into preceding
prose, so the strict parser produced 2 chunks instead of 12. The user otherwise
had to repair the paste by hand. A gated second pass recovers the boundaries
without changing clean bank text; all five bank slices are byte-identical with
zero inserts.
**Risk.** The insert heuristics can split prose that merely looks like a
numbered item or option label. The two-part gate and the visible flag limit the
damage, but the split still needs human review; the flag is not a confirmation.
Do not run salvage on bank text or remove the gate to force a repair.

## D-41 — Bullet mode is a separate, numberless path

**Choice.** `splitQuestionItems` uses numbered mode whenever a line-start `N.`
marker exists. If none exists and at least 2 `*` bullets are present,
`splitBulletQuestions` splits on the bullet markers, consumes them, keeps
`num: null`, and injects `question number missing`. Bullet and numbered chunks
are never mixed.
**Why.** The archived block has 19 bullet questions and no numbers. Running the
numbered splitter merged them into one chunk; inventing numbers would corrupt
keys and queue positions. Keeping `num: null` preserves the source and makes
the missing numbering explicit.
**Risk.** A non-question bulleted list of 2+ items will be treated as questions
and flagged. The queue can hold `num: null`, but the user must assign numbers
before saving; the parser does not guess them.

## D-42 — Bank extraction is external and fixtures are one year each

**Choice.** Add `tools/extract-bank.js` and `tools/bank-slices.json` to verify
the archived bank source by SHA-256, extract each year by anchors, and write
`fixtures/inputs/bank-YYYY.txt` plus PENDING specs. One exam year per paste is
the supported contract. Every expected fixture declares `input_origin`
(`bank`, `anomaly`, `doc`, or `synthetic`), and expected values are transcribed
from sources rather than generated from parser output.
**Why.** A five-year paste mixes key years and makes year attribution
ambiguous; the parser has no year-pairing model and the source contains fused
headings. Deterministic extraction gives reproducible inputs and counts
(40/40/40/40/39 keys) without adding a browser feature or changing the paste
contract.
**Risk.** The extractor is tied to the archived source hash; a changed or
re-OCR'd source fails `--check` by design. Users still have to split multi-year
text themselves; the UI does not detect or warn about a multi-year paste.

## D-43 — Auto-save has no run cap

**Choice.** Remove the 10-save cap from the Auto-Save loop. A run continues
until Stop, a blocker, or the end of the queue. Dry run still previews the whole
queue.
**Why.** The user reviewed the paste and accepted the dry-run preview plus the
per-question gate as sufficient; the cap interrupted legitimate batches.
**Risk.** A misconfigured batch or an undetected duplicate can save more rows
before stopping. The per-question gate, confirmations, duplicate checks, lock,
visibility pause, and two-unverified stop remain; do not reintroduce a cap
without a new decision.

## D-44 — Drop a title block above a pure answer heading

**Choice.** When `splitSections` picks a pure answer heading (for example
`OBJECTIVE ANSWERS`), it also drops the immediately preceding non-empty title
block from the question part. The block must contain a `20\d\d` year and an
exam/subject word, must not start with a question or option marker, and must be
bounded by a blank line (or the start of the paste). The dropped block is
prepended to the returned `boundary` text so header metadata still sees the
year.

**Why.** The 2026 section uses a two-line answer heading, repeating the section
title above the pure heading:

```
WASSCE C. R. K. 2026
OBJECTIVE ANSWERS
```

The boundary line (`OBJECTIVE ANSWERS`) has no year, so `splitSections` dropped
only that line. The title above it stayed in Q48. Its `C.` matched the option
regex, so Q48 became `A / B+C / R. K. 2026 / D+WASSCE` and gained
`a letter appears twice (merged questions?)`. Q48 is the evidence; the key
itself was correct (48 entries).

**Risk.** This adds a narrow title-shaped exception to the fragile section
splitter. A final option line that contains a year plus an exam word and sits
directly above an answer heading, with only a blank line between it and the
previous question content, could be dropped. The title must also be a
standalone block, so ordinary option lines are not affected. Re-run the bank
fixtures and the 2026 fixture when touching `splitSections`.

## D-45 — Repair a missing dot on option A before dotted B–D

**Choice.** If the option parser finds `B`, `C`, and `D` but no `A`, it looks
for a line after the start of the question text that begins `A ` followed by a
lowercase word (for example `A stay with them`). If that line lies before `B`,
it becomes option A. The repair is not applied at the start of the chunk, and it
does not change the main `OPTION` regex or its newline-plus-digit exception.

**Why.** The unheaded single-question section between 2025 and 2026 has
`A stay with them` with no dot. The main regex correctly refuses dotless labels
unless a digit follows (`A 75 years`), so Q29 lost option A and the stem
absorbed the line: `... begged Jesus to A stay with them`. The source has dotted
`B.`/`C.`/`D.` labels, so the case is unambiguous. It stays a separate fixture
because it is its own divider-delimited section with no answer-key entry and
cannot share the 2025 or 2026 queue.

**Risk.** This adds a second, narrower dotless path. It is limited to `A` when
`B`–`D` already exist, to a lowercase word, and to a line that is not the chunk
start, which preserves the `A 5 ...` / `A good ...` article cases. Do not widen
it to other letters or to the start of the chunk without a failing fixture.
D-47 extends this repair to B and C using the new-edge fixtures; D-49 handles
slash labels.

## D-46 — Divider-only lines are section separators

**Choice.** `splitSections` blanks a line that contains only equals signs (three
or more). This happens before line slicing, so a section paste may include its
surrounding `========` dividers without the divider becoming question or option
text. The parser still expects one section per paste; stripping does not make a
multi-section paste supported.

**Why.** The bank now uses `========` between sections. The unheaded pre-2026
section is followed by `========`; without stripping, Q29's option D became
`heal their sick. ========`. The divider is a boundary, not content. The same
rule keeps a leading divider out of the question head. The predicate is
equals-only so stem punctuation remains question text (EC-19).

**Risk.** A prose line consisting only of equals signs would be dropped. Keep
the predicate to equals-only lines; do not expand it to arbitrary punctuation.
Do not interpret stripping as section splitting: extraction remains external,
and one-section-per-paste remains the contract.

## D-47 — Extend the missing-dot repair to B and C

**Choice.** After the normal option scan, repair a missing A, B, or C from a
line beginning with that letter, whitespace, and a lowercase word. The line must
be after the start of the chunk and between the nearest existing option labels.
A still requires B, C, and D; B requires C and D; C requires D. D is not
repaired because it has no following option marker to bound the candidate.

**Why.** The new 2020 edge case has `C spoke to him.` between dotted B and D.
The A-only repair did not run, so B absorbed the line, C stayed empty, and the
`option C missing` flag stopped Auto-Save. The shape is the same OCR defect as
the pre-2026 Q29 dotless A, just on another letter.

**Risk.** A continuation line beginning `B ` or `C ` could still be absorbed.
The between-neighbor, lowercase, and not-at-chunk-start conditions keep the
repair narrow. Any further widening needs a failing fixture.

## D-48 — Ignore dotted abbreviations when matching options

**Choice.** Skip an option-like match when the label dot has no trailing
whitespace and the next text begins with an uppercase letter followed by `.`,
whitespace, or the end of the chunk. For example, the `B.` in `597 B.C.` is not
an option label.

**Why.** The Q18 edge case contains a year in the stem. The `B.` in `B.C.`
incremented the option-B match count before the real B was found. The later B
overwrote the position, but the count stayed at two, producing the false
`a letter appears twice (merged questions?)` flag and stopping Auto-Save.

**Risk.** A genuine option whose text starts immediately with an uppercase
dotted abbreviation and no space after the label could be skipped. Normal option
text has whitespace after the label; keep the no-space condition narrow.

## D-49 — Normalize spaced slash option labels before matching

**Choice.** Before the main `OPTION` scan, replace a slash with a dot when an
A–F label is preceded by start, newline, or whitespace and the slash is followed
by whitespace. The replacement preserves character offsets, so the normal option
scan and all later text slicing still use the original raw text. This works for
any label A–F, inline or at line start.

**Why.** Q17 has `A/ books of the prophets` between dotted labels. Slash labels
appeared only on A in the observed text, but the user asked for full slash
support across all options. Normalizing only the separator keeps the option
regex and duplicate-letter logic unchanged.

**Risk.** A prose `A/ B` shape would be treated as an option because it is
indistinguishable from a slash label. Requiring whitespace after the slash keeps
`A/B`, `and/or`, fractions, and dates out. A slash label without a following
space remains unsupported.

## D-50 — Add a clipboard paste button

**Choice.** Add a "Paste clipboard" button next to the load box. On click it
calls `navigator.clipboard.readText()` and replaces the box with the clipboard
text, then focuses the box. It does not load or parse automatically. If the API
is unavailable, denied, or the clipboard is empty, it focuses the box and shows
a short alert telling the user to long-press and paste.

**Why.** The user works on a phone and wants to avoid the long-press paste step.
The browser clipboard read needs a user gesture, so a button is the narrowest
way to do it without changing the paste/load contract.

**Risk.** Clipboard access requires a secure context and may ask for permission;
there is no reliable silent fallback. The button replaces any text already in
the box rather than appending, so a second click cannot duplicate a paste.

## D-51 — Active is the default; one batch confirmation

**Choice.** The `Save as active` box starts ticked for each new batch; unticking
it selects draft. Replace `These are correct.` and `I understand these go live to
students now.` with one confirmation tick whose label depends on the mode:
`I checked the batch and understand these save live.` or
`I checked the batch details.` Both boxes start ticked on a new paste. A change
to subject/category/year, the key, or the mode clears the confirmation but
leaves the active choice as it was. New paste and Reset restore both defaults.
The confirmation snapshots the metadata; a mismatch still blocks the run.
**Why.** The user wants live saves to be opt-out, and two warnings plus a wall of
batch text was too much friction. One mode-labelled confirmation keeps an
explicit live-save checkpoint without a second box.
**Risk.** A valid batch can be started immediately after load. The active state
is visible in red, the confirmation clears on any change, and the existing key,
flag, duplicate, marker, and option gates still apply. The checkbox state is
still not persisted.

## D-52 — Compact status, progress, and saved summary

**Choice.** Show one status line plus a progress bar for auto-save and dry run.
Dry run reports only a summary such as `Dry run: all 40 would save as ACTIVE.`
or `Dry run: 12 of 40 checked; stops at #13: Option C is empty.` Auto-save
reports `Auto-save ACTIVE: 12/40 done · 12 saved this run.` The green saved box
names the batch (`Batch: Subject / Category / Year — N questions (#first to
#last)`) and shows only `Saved this batch: ...`; per-question detail stays behind
`Copy saved list`. Add no separate dry-run report or copy control.
**Why.** The per-question dry-run lines and appended saved details were a wall of
text on a phone. The user asked for a summary and a visual progress cue.
**Risk.** The dry run no longer lists every passing question; after fixing the
first blocker, run it again to see the next. The detailed saved data is still
available through the existing Copy button.

## D-53 — Paused warning links to the filtered Recently Added list

**Choice.** Snapshot the form's subject, category, and year into the `ocrSaving`
marker before each POST. The paused warning gets an `Open filtered list` link to
`location.pathname` with `subject_id`, `exam_year_filter`, and `category_filter`
from that snapshot, so the user can check whether the ambiguous save inserted a
row. Old markers without the snapshot fall back to `ocrMeta`; the link stays
hidden when neither source has valid numeric metadata.
**Why.** The unfiltered list intentionally omits new rows, and the user asked
for a direct route to the page where the check happens instead of navigating
manually.
**Risk.** The link is only as accurate as the metadata captured at save time.
If the form metadata changes after an ambiguous save, the marker keeps the
original values and the link still points at the attempted question's scope.

## D-54 — Normalize period-separated exam acronyms for category inference

**Choice.** Before the category rules, `pickCategoryIndex` normalizes a local
copy of the header with `compactExamAcronyms`: dotted runs such as `S.S.C.E.`,
`W.A.S.S.C.E.`, `W.A.E.C.`, `N.E.C.O.`, `G.C.E.`, `J.A.M.B.`, `U.T.M.E.`, and
`P.O.S.T. U.T.M.E.` collapse to their letters, and `POSTUTME` becomes
`POST UTME`. The header text returned by `parseHeader` is not rewritten, and
`pickSubjectIndex` does not use the helper.
**Why.** The live list has one `WASCE / NECO / GCE` option, so the period forms
must resolve to the same category as bare `SSCE`/`WASSCE`. The OCR bank uses
both dotted and bare forms, and a dotted header previously left the category
unset.
**Risk.** The normalization is category-only and local. It cannot select a
separate SSCE/WASSCE category because none exists, and it does not change the
stored header or subject inference. A dotted run outside the known category
words still leaves the category unset.

## D-55 — Select one option set and warn only on a boundary-less duplicate

**Choice.** `parseQuestion` builds the option marks from the accepted label
matches instead of letting the last occurrence of a letter overwrite earlier
ones. It takes the earliest occurrence of each required letter A, B, C, and D,
then accepts E and F only after the selected D. The chosen marks are sorted by
text position before slicing, so an out-of-order OCR block such as `A. Italy
D. Britain B. Germany C. France` still maps each letter to its own text. Inner
initials (`C. E. F. Small`, `A. Adebayo`, `E. Smith`) stay inside the option
text because they are never selected as the outer A–D labels.
The duplicate-letter flag is computed separately from all accepted matches: it
fires only when a second complete A–D set starts after the first set's D and no
`1–3 digit + . + whitespace` question-number boundary lies between them. A
visible number suppresses the warning and is not split inline.

**Why.** Replacing each label with its last occurrence broke Q46, where the
initials inside `K. A. Gbedemah` and `E. F. Small` appeared later in the text
than the real labels. An ordered A→B→C→D-only scan fixes Q46 but drops the
out-of-order labels in `anomaly-block2`; selecting the earliest occurrence per
letter keeps both the hostile block and the bank fixtures intact. The old
any-repeat warning was too broad for inner initials and did not distinguish a
real merged paste from a visible next question number.

**Risk.** A lone inner initial that appears before the real A–D set would still
be the earliest occurrence of that letter. The guardrail and fixtures cover
initials inside option text, not a label-like title before the options. The
warning is advisory only; the parser never splits inline, so a genuine merged
paste still needs manual attention.

## D-56 — Prior-batch duplicates use a saved-log fingerprint

**Choice.** A verified save may store an additive `fp` object on its
`ocrSavedLog` entry: `v: 1`, the posted subject/category IDs and year as
strings, the selected labels for display, and `normalizeAnswer(question_text)`
from the form at request time. `makeSavedFingerprint` omits `fp` (making the
entry legacy) when a required value is empty or the canonical question is over
4,000 characters. Before auto-save, `autosaveBlockers` checks the log in this
order: current-batch saved number (`saved-log`), then the prior-batch
fingerprint (`duplicate`), then the loaded 20-row table (`duplicate`). A prior
match needs a complete `fp.v === 1`, a different `batchId`, equal subject,
category and year IDs, and equal normalized question text. Labels never decide a
match. The newest match by `at`, then numeric `id`, is reported with the saved
ID, year and category. Legacy, partial and unknown-version entries are skipped;
there is no backfill, new key, server lookup, override, or intra-batch check.
Dry run and Start call the same gate.

**Why.** After Reset and a re-paste, a new `batchId` made every earlier saved
entry invisible to the number check, while the 20-row table saw only the
currently rendered rows. Re-saving the same question was possible. The retained
log already survives Reset, so an additive fingerprint closes the gap without a
server or storage-schema change.

**Risk.** The check sees only the retained 200 log entries; once an entry is
dropped by the cap it can be saved again. Old entries have no fingerprint and
are never matched. A question over 4,000 characters is stored as legacy, so a
later re-paste is not caught. Matching depends on the IDs and year being stable;
a label-only change does not affect it. The UI hook that writes `fp` is covered
by the test-only deterministic DOM/storage/fetch shim in `tests/ui-harness.js`
(FIX-1); it is not a browser test.

## D-57 — Batch history is an additive 15-batch one-line log

**Choice.** `ocrBatchHistory` stores at most 15 entries, newest first, one per
batch: `{batchId, at, subject, category, year, ids, count, mode}`. `ids` are the
unique saved IDs, sorted ascending. `mode` is the display suffix from
`savedModeSuffix` with its leading comma removed, so it can be `active`,
`inactive`, `2 active, 1 inactive`, `status not verified`, or a `MISMATCH`
string. `makeBatchHistoryEntry` builds an entry from the current batch's saved
entries and returns `null` without a batch ID or saved IDs. `upsertBatchHistory`
replaces the same `batchId`, moves the entry to the front, and caps the array at
15. A verified save updates the history after `ocrSavedLog`; rejected and
ambiguous saves do not. Reset Queue keeps the history. The UI renders one line
per entry with `textContent`, explicit month abbreviations, `–` between
contiguous first/last IDs, a comma list when IDs have gaps, and no suffix when
`mode` is empty. The storage read and write are wrapped: a failure never sets a
blocker, stops a run, or changes a save result.

**Why.** The saved box and its copy text are scoped to the current batch, so
Reset or a new paste hides earlier batches. The retained log still has the data,
but the user cannot see a compact recent history. This additive key shows the
last 15 batches without changing `ocrSavedLog`, its merge/cap behavior, the
current-batch saved box, or Reset semantics.

**Risk.** History is display-only and can lag behind the log if a history write
fails; the next verified save rebuilds the current batch entry from the log. The
key is capped at 15 batches, so older batches disappear even though the log may
still retain them. Labels are snapshots from the save time; a later label rename
does not rewrite them. There is no per-question detail in history by design.

## Auto-Save verification notes

- **2026-10-25, mock browser (Chromium 152, local copy of
  `admin_questions.html`):** the five dry-run scenarios reported the expected
  would-save or stop reason, and the queue, marker, saved log, and lock stayed
  unchanged. A run hidden mid-save finished exactly one POST, paused, and did
  not start another. A locked queue refused Start. These checks support
  D-30…D-37 but do not replace the live acceptance test.
- **Boot fill regression found during AS-06:** the new paused-warning and flag
  nodes both carry `.admin-error`, so the old “is there a server error?” check
  at the end of injection matched the tool's own UI and skipped `showOCR()`.
  The check now runs before the panel is injected, preserving EC-48 while
  restoring EC-47 (queue refill after reload). Rebuilt and re-checked.
- **Live findings (2026-10-25, real admin page, Samuel watching):**
  #1516–#1518 saved and appeared Inactive. A network cut during the second save
  left #1519 saved once and question 2 ambiguous, with the marker kept and no
  retry. A server rejection (exam year 1800) was classified `NOT saved` while a
  stale #1520 success was still visible. The browser's `required` attribute
  blocks a blank option before the manual save runs, so the server-side blank
  option error can only be reached by bypassing native validation or by
  auto-save; this is now an edge-case note, not a defect.
- **Two-tab limitation:** on one phone browser, switching to tab 2 hides tab 1,
  which pauses it and releases `autoLock` before tab 2 can Start. The live
  observation was tab 1 paused and tab 2 saved (no concurrent saves), not the
  lock message. The lock reason remains covered by `tests/unit.js` and the
  mock-browser check. Separate browsers cannot stand in because `autoLock` is
  per-profile `localStorage`.
- **Cosmetic follow-up (fixed 2026-10-25):** the blocked-reason line near the
  controls now turns red and bold when it has text, matching the rejection
  styling of `#ans_res`. It resets when the reason is cleared.

## Open decisions (not resolved by this phase)

None. B1/B2/B3 were supplied and matched in Phase 8 (D-28).

Everything previously listed here is resolved by D-14, D-18, D-22, D-24–D-28.

Sources: `claude-migration.md` §8–§9, `qwen-2-reconciled.md` U02/U03/R11–R15,
`qwen-2-gaps.md`, `archive/live-sources/admin_questions.php`,
`archive/live-sources/subjects-select-2026-10-23.html`, and the recorded user
decisions.
