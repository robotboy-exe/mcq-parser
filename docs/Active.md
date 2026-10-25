# Auto-Save Follow-up Work (merged)

Replaces `Active-Mode-Spec.md`, `Review-Fixes.md` and `duplicate-check.md`. Work from this file only.

**Plan mapping (2026-10-25):** this file is the detailed spec for the
AS-07…AS-09 track in `docs/plan/README.md`. Phase 1 Fix 1, Fix 2, the
per-question unverified-status list and the two-consecutive-unverified stop are
AS-07; Part A is AS-08; Fixes 3–7, the nit, and Phase 3 docs are AS-09. Fix 2 moves forward because §2 forbids live
active saves until both safety fixes are done. `tests/build-check.js` exists only in `review-packet/`; use the BUILD.md
check in this workspace.

## 1. Rules for the agent
- Same rules as the original Auto-Save spec: one-line build, no `%`, no inline `//`, `textContent` only, pure functions at top level and exported with Node tests.
- Don't refactor for style. Don't change the deliberate quirks listed in the review brief.
- Do one phase at a time. After each phase, rebuild, run `tests/runner.js`, `tests/unit.js` and `tests/build-check.js`, and commit before starting the next.
- Every item gets the tests listed under it.

## 2. Order of work
1. **Phase 1:** Fix 1, the duplicate check with year and category scope.
2. **Phase 2:** Active Mode (Part A).
3. **Phase 3:** Fix 2, then Fixes 3 to 7, the doc corrections and the nit.

**Until Fix 1 and Fix 2 are both done, use draft mode only.** Active mode puts a duplicate or a wrong state in front of students immediately.

## 3. Manual duplicate check (only when needed, until Phase 1 ships)
Do this only if the batch's paper, subject and year may have been loaded before. Skip it for new material.
1. Open Recently Added Questions on `admin_questions.php` and filter by the batch's Subject, Exam Year and Exam Category.
2. Compare the opening words of the first few questions with the Question column.
3. If they're there, don't load the batch.

No check is needed after a batch. If the tool shows "Unknown. It may have saved", look at the list before doing anything else.

**Retire this section** when Fix 1 passes its tests and its live check.

**Limit that remains after Fix 1:** the automatic check only sees the 20 newest rows on the page. It can't catch a re-import of something loaded a while ago, so know what you have already loaded.

---

# Part B: Duplicate check and review fixes

## Phase 1

### Fix 1: Duplicate check (High)
**Where:** `recentDuplicate` in parser.js, `recentRows()` in ui.js, and the duplicate blocker in `autosaveBlockers`.

**Problem 1, long questions:** the server's `short_text` cuts each question at 140 characters, and the `…` counts toward that 140. A long question reaches the Recently Added table as the first 139 characters plus `…`. The code compares that with `===` against the first 140 characters of your question, so a long question never matches. Normalizing whitespace on one side but not the other causes further mismatches.

**Problem 2, scope:** the check compares only subject and text. The same question saved for a different year or category is flagged, so past-paper repeats are blocked.

**Rule:** a duplicate means the same subject, exam year, category and question text.

**Before changing anything:** open a long row in the live table (one ending in `…`) and count it. Confirm it is 139 characters plus `…`. If the count differs, use the real number below.

**Change:**
1. `recentRows()` finds the columns by header text (`ID`, `Question`, `Subject`, `Exam Category`, `Exam Year`) from the table's `thead`, not fixed positions. It returns `{id, question, subject, category, year}`. A header that can't be found gives an empty string for that field.
2. `recentDuplicate(rows, subject, questionText, category, year)`: normalize both sides (trim, collapse whitespace, lowercase). Strip a leading `[Subject] ` from the row text.
3. If the row ends in `…` or `...`, remove it and treat the row as truncated.
4. A truncated row of at least 40 characters matches when the normalized question starts with it.
5. An untruncated row matches only when it equals the full normalized question.
6. A row can match only when all of these hold: the normalized subject is equal; the category is equal after normalizing, or the row's category is empty; the year is equal as a number, or the row's year is empty; and steps 2 to 5 pass. An empty row category or year means "unknown", so that field is skipped. This is the safe fallback.
7. `autosaveBlockers` passes `meta.categoryText` and `meta.year`. The message reads "This looks like question #N (YEAR, CATEGORY) already in the recent list."
8. Batch confirmation adds the year on its own bold line, then: "Check the year. Duplicate checks only compare questions from the same year and category. They also only see this batch and the 20 newest rows on the page."
9. Dry run uses the same gate and needs no separate change.

**Tests:** delete the old test, which builds a row of 140 characters plus `…`, a shape the server never produces. Replace it with rows of 139 characters plus `…`:
1. Matching subject, category, year and first 139 characters: flagged.
2. A row of 139 characters plus `…` for a different question: not flagged.
3. A row under 140 characters with no `…`: matches only the exact same full question.
4. A row with double spaces or a line break in its first 140 characters still matches the same question.
5. A row with a `[Subject] ` prefix matches the same question without it.
6. Same text, different subject: not flagged.
7. Same text, different year: not flagged.
8. Same text, different category: not flagged.
9. A row with an empty year or category and matching subject and text: flagged.
10. A table with an extra column before Question still parses all five fields.
11. A table with a missing `Exam Year` header returns an empty year and falls back as in test 9.
12. Update the existing `autosaveBlockers` duplicate test so its rows use the real shape and carry year and category.

**Live check:**
1. Pick a real long question from Recently Added whose row ends in `…`, and note its year and category.
2. Load a batch containing a repeat of it, same year and category. Confirm the tool stops with the duplicate message naming that year and category, before saving.
3. Load a batch with the same question under a different year. Confirm the dry run says it would save.
4. Confirm a different long question in the batch doesn't trigger the stop.

---

# Part A: Active Mode (Phase 2)

## A1. Goal and scope
- Add an opt-in **Save as active** mode to Auto-Save. Each auto-saved question is live to students immediately. Draft (inactive) stays the default.
- Client-side only. No server change.
- **Non-goals for this phase:** bulk activation of existing drafts, changing manual saves, changing parsing, changing any existing gate. Phase 1 has already changed the duplicate gate, and Phase 3 changes others.
- Draft-mode behaviour must not change: it still deletes `is_active` and expects the edit page to show it unchecked. The no-retry rule, the crash marker and the lock stay as they are.

## A2. State (in memory only, never in localStorage)
- `activeMode` (default false), `activeConfirmed` (default false), and `runMode` (`'active'` or `'draft'`, set once when Start is clicked).
- `resetConfirm()` also sets `activeMode = false` and `activeConfirmed = false`. It is already called on a new paste, Reset, Clear key and any subject, category or year change.
- `ocrSavedLog` entries gain `mode`: `'draft'`, `'active'` or `'manual'`. `inactive` stays the measured result (`true`, `false` or `null`).
- Old entries have no `mode`. Treat them as `'manual'` if `inactive === false`, otherwise `'draft'`. (An old auto save that was verified active therefore shows as manual. Accepted.)

## A3. UI (phone-first)
- Add checkbox `#ocr_active_mode`: "Save as active (live immediately)", next to Start. Disabled while `autoRunning`.
- When ticked, `renderBatchConfirm` adds `#ocr_active_tick`: "I understand these go live to students now."
- `renderBatchConfirm` adds a mode line: "Mode: ACTIVE. Saved questions go live immediately." in red and bold, or "Mode: draft (inactive)."
- Start is disabled unless `confirmTicked` is true and (`!activeMode` or `activeConfirmed`).
- Running status: "Auto-save (ACTIVE) running: N of 10 saved this run" or the draft equivalent.
- Dry run prints "Would save #n as ACTIVE: …" or "as draft: …".

## A4. Gate
`gateState` adds `activeMode`, `activeConfirmed`, `mode` and `runMode`. New blocker codes are in the table in section C.

## A5. `saveCurrentQuestion({auto, active})`
- `runAuto` passes `active: runMode === 'active'`. Manual passes `active: false` and is unchanged.
- In the auto branch of building `FormData`: if `active`, `fd.set('is_active','1')`. Otherwise `fd.delete('is_active')`. Keep `fd.set('autosave','1')` in both.
- `classifySaveResponse` is unchanged.
- After Saved, `verifyInactive(id)` runs as before. Expected state is `inactive === false` in active mode, `inactive === true` in draft mode.
  - `null`: log it unverified, message "Saved as #N. Could not verify; check the list.", and continue (see open decisions).
  - Match: "Saved as question #N (active)." or "(inactive)."
  - Mismatch: set `stopAuto = true` and show red. Active mode: "SAVED AS INACTIVE: question #N is not live. Check the list." Draft mode: the existing "SAVED AS ACTIVE" text. The save is still logged and the queue still advances.
- Log entry: `{num, id, at, batchId, inactive, mode}`.

## A6. Saved list suffix
Replace `savedInactiveSuffix` with a pure, exported `savedModeSuffix(entries)`. Rules in order:
1. Any entry whose `inactive` is not null and does not match its `mode` (draft expects `true`, active expects `false`) gives ", MISMATCH: N saved in the wrong state".
2. Else any `inactive === null` gives ", status not verified".
3. Else all draft gives ", inactive". All active gives ", active". A mix gives ", N active, M inactive".
- `mode: 'manual'` expects active and never mismatches.
- `formatSavedRange` calls this function. Its range formatting is unchanged.

## A7. Tests
**Unit:**
- `savedModeSuffix`: all draft, all active, mixed, mismatch each way, null, manual-only, legacy entries with no `mode`.
- `autosaveBlockers`: `mode-unconfirmed` when active is ticked but not confirmed. `mode-changed` when `runMode` differs. A clean state with `activeMode` false returns `[]`.
- Both new codes appear in the `blockerText` all-codes test.

**Dry run:** clean batch in each mode with the right wording. Start disabled until both ticks are set.

**Mock browser:** an active run posts `is_active=1` and `autosave=1`. A draft run posts no `is_active`. The mode checkbox can't be toggled mid-run.

**Live test, 2 questions, Samuel watching:**
- Both appear as Active in Recently Added and the list reads "…, active".
- A draft run still saves 1 question as Inactive (regression check).
- Delete all test rows afterward.

---

# Part B continued: Phase 3

### Fix 2: Manual save erases the "may have saved" warning (Medium)
**Where:** the manual submit handler and `clearSavedMarker`.

**Problem:** an auto save of question N ends ambiguous and leaves the `ocrSaving` marker. If you then save N by hand and it succeeds, the marker is deleted because the numbers match. The first POST may also have inserted a row, so a possible duplicate is hidden.

**Change:** the submit handler refuses when `ocrSaving` exists. It shows: "An earlier save is unconfirmed. Check the list, then tap 'I checked. Clear warning.'" No POST is made.

**Tests:**
1. With a marker present, a manual submit makes no POST and shows that message.
2. After "I checked. Clear warning.", a manual submit saves normally.
3. With no marker, manual saving is unchanged (still saves active and advances).

### Fix 3: Exceptions after a confirmed save (Medium)
**Where:** `saveCurrentQuestion`, between the "saved" classification and `clearSavedMarker`.

**Problem:** a storage error while logging or advancing the queue is caught by the generic `catch` and reported as "Unknown. It may have saved." The log entry is lost, so a retry can save the same question again.

**Change:**
1. Write the log entry in its own try/catch immediately after "Saved".
2. On failure, show "Saved as #N but could not be logged. Do not retry." Keep the marker and stop the run.
3. Wrap `saveQ()` the same way.

**Tests:**
1. Make `store.set('ocrSavedLog')` throw and check the message, the kept marker and the stopped run.
2. Make `saveQ()` throw and check the same.

### Fix 4: Saved log overwritten across tabs (Medium-low)
**Where:** `savedLog` and `store.set('ocrSavedLog', savedLog)`.

**Problem:** the log is read once at boot and written back whole. A save in another tab, manual or auto, is lost the next time this tab writes. That weakens the stale-success ID guard and the `saved-log` check.

**Change:** before appending, re-read `ocrSavedLog` from storage and merge by `id`, keeping each entry's `mode`, then cap at 200.

**Tests:**
1. Two interleaved appends from different in-memory logs both survive.
2. The cap still keeps the newest 200.

### Fix 5: Explanation field not gated (Low-medium)
**Where:** `gateState` and `autosaveBlockers`.

**Problem:** the gate blocks an attached image or video but not text in `answer_explanation`. Whatever is in the box is saved with the question, and it is only cleared after a save.

**Change:** add a `has-explanation` blocker when the box has text.

**Test:** a state with explanation text returns `has-explanation`. A clean state returns `[]`.

### Fix 6: Subject, category and year not pinned (Low-medium)
**Where:** `fillForm` and the batch confirmation tick.

**Problem:** `fillForm` reapplies `ocrMeta` from storage for every question. `ocrMeta` is shared with other tabs and the old helper. Programmatic changes fire no `change` event, so the tick stays on and the subject or year could shift mid-run.

**Change:**
1. When the "These are correct." tick is ticked, snapshot subject, category and year.
2. Add a `meta-changed` blocker when the form values differ from the snapshot at save time.
3. Clear the snapshot in `resetConfirm()`.

**Tests:**
1. Changing `ocrMeta` after confirming stops the run with `meta-changed`.
2. Unchanged values return `[]`.

### Fix 7: Heartbeat has no error handling (Low)
**Where:** `heartbeat`.

**Problem:** `store.set` inside the `setTimeout` callback can throw and silently end the heartbeat. The run keeps saving while its lock goes stale after 15 seconds. The shared `ocrSaving` marker still stops another tab starting during an in-flight save.

**Change:** wrap the write in try/catch. On failure, set `stopAuto = true` and release the lock.

**Test:** make `store.set('autoLock')` throw inside the heartbeat and check the run stops and the lock is released.

### Nit
In `autosaveBlockers`, `add` is defined before `out` exists. It works today, but a reorder would break it. Declare `out` first.

---

# C. Blocker codes (one table)

Every code needs a `blockerText` entry and a place in the all-codes unit test. Each phase adds its own codes and removes none.

| Code | Added in | Text |
|---|---|---|
| `duplicate` | existing; message updated in Phase 1 (Fix 1) | This looks like question #N (YEAR, CATEGORY) already in the recent list. |
| `mode-unconfirmed` | Phase 2 | Tick the live-save confirmation before starting. |
| `mode-changed` | Phase 2 | The save mode changed during the run. |
| `has-explanation` | Phase 3 (Fix 5) | The Answer Explanation box has text. Clear it first. |
| `meta-changed` | Phase 3 (Fix 6) | Subject, category or year changed since you confirmed. |

# D. Docs to update (one list)

**Phase 1**
- INV-69: "subject, exam year, category and question text; unreadable year or category falls back to subject and text".
- D-34, Auto-Save-Spec §9 and SPEC §7.5: add the same scope.

**AS-07 extra (media blocker removal)**
- Auto-Save-Spec §5 item 10, §8 unit and dry-run media lines.
- SPEC §7.3 item 10.
- INV-62 and the AGENTS auto-save gate row: remove the media/passage block.
- Decision D-38: uploader owns the media decision; no text guessing.

**Phase 2**
- SPEC §7: mode, gate codes, suffix.
- New decision D-39 (Active Mode) and new invariant INV-71: "active mode needs both ticks and never changes mid-run".
- Auto-Save-Spec §9: "inactive is enforced" now applies to draft mode only.

**Phase 3**
- Auto-Save-Spec §9 says the tool "skips" a question. The code stops, per D-34. Edit the spec to say stops.
- SPEC §2: the POST uses `location.href`, and the edit-page check uses `location.pathname`.

# E. Decisions and open items

**Decided 2026-10-25:**
- **Cross-category copies:** allowed. Canonical replication of each year and its questions is the goal. The duplicate rule keeps category in the identity, so the same text in another category is not blocked.
- **Unverified status list:** the saved list must name every question whose `inactive` check was `null`. A batch-level "status not verified" is not enough. Added to AS-07, and AS-08 must preserve it.
- **Inconclusive checks:** stop the run after **two consecutive** unverified (`inactive === null`) auto saves. Both entries stay logged and are named in the saved list. The counter resets after a verified save. Manual saves are unaffected. Added to AS-07, and AS-08 must preserve it.
- **Reset and saved log:** do not clear `ocrSavedLog` on Reset. It is capped at 200 and supports the stale-success guard and batch-scoped checks.
- **Key trust:** deferred. The existing key coverage check is enough for now; do not add the key-letter preview.
- **`NEEDS_PICTURE`:** remove it. The uploader decides whether a batch needs images; guessing from words like "diagram" or "table" is redundant and causes false stops. Remove the regex, the `needs-media` blocker and its test. Keep the `file-attached` blocker. A future media feature must use an explicit uploader signal, not text guessing; that is out of scope now.

**Still open:** none for this track.

# F. Done when
- All unit tests above pass, along with the existing runner and unit tests.
- The Fix 1 live check and the Active Mode live test pass.
- The build check passes: one line, no `%`, body parses.
- The docs in section D are updated.