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

## D-25 — The key persists across reloads

**Choice.** Read `ansKey` at boot; do not clear it on load.
**Why.** User decision: a reload mid-queue must not lose the key.
**Risk.** A stale key remains until a questions paste replaces it or the user
presses "Clear saved key".

## D-26 — Reset Queue keeps the key

**Choice.** Reset clears only the queue; the key stays.
**Why.** User decision: key clearing is the separate "Clear saved key" action.
**Risk.** Users who expect a full reset must use both controls.

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

## Open decisions (not resolved by this phase)

None. B1/B2/B3 were supplied and matched in Phase 8 (D-28).

Everything previously listed here is resolved by D-14, D-18, D-22, D-24–D-28.

Sources: `claude-migration.md` §8–§9, `qwen-2-reconciled.md` U02/U03/R11–R15,
`qwen-2-gaps.md`, `archive/live-sources/admin_questions.php`,
`archive/live-sources/subjects-select-2026-10-23.html`, and the recorded user
decisions.
