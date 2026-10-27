## 1. Goal and scope

Add a click-started **Auto-save** mode to the existing merged bookmarklet (`bookmarklet.js`). Active is the default for a new batch, so clean questions matched to an answer key save live unless the user unticks `Save as active` for inactive drafts. Everything else stays manual.

- Client-side only. No server access. The site is `admin_questions.php`, which inserts into the table `questions`.
- **Non-goals:** media, passages, E/F questions, auto-retry, bulk activation of existing drafts (§10 is active mode, not bulk activation), any server change.
- The existing manual flow, parsing, and the "new paste replaces the key; no key clears it" rule must not change.

## 2. Rules for the code

- Keep a readable source file, e.g. `bookmarklet.src.js`, with comments. Generate `bookmarklet.js` from it: comments stripped, one line, no `%`, no `//` left, no external scripts or network calls beyond the admin page itself.
- Pure functions go at top level and are added to the existing `module.exports` block. They must be unit-tested in Node with fixtures. DOM and storage code lives inside `runOCRBookmarklet`.
- Show all server-derived text with `textContent`, never `innerHTML`.
- Compare option lengths in **UTF-8 bytes** (`new TextEncoder().encode(s).length`), not characters.

## 3. Data model (localStorage)

- `ocrQueue`: existing shape, plus `batchId` (a UUID, with a Date/random fallback). It is created in `ocr_load` when questions are loaded.
- `ansKey`: **unchanged shape** (a plain `{num: letter}` map), so every existing reader keeps working.
- `ansKeyBatch`: new. It is set to `queue.batchId` whenever a key is loaded together with questions. A key-only paste attaches to the current queue's `batchId`. Clearing the key, or loading questions with no key, deletes `ansKeyBatch`. **Reset Queue now also clears `ansKey`, `ansKeyBatch` and `queue.batchId`**, consistent with "key only relevant in the moment".
- `ocrSaving`: crash marker `{num, at, subject, category, year}`. The last three snapshot the form metadata at save time so the paused warning can link to the matching filtered Recently Added list. Old markers without them fall back to `ocrMeta` when available.
- `ocrSavedLog`: array of `{num, id, at, batchId, inactive, mode, fp?}`. Written only after a verified save; storage is re-read and merged by `id` before each append (keeping each entry's `mode`), and the log is capped at 200 entries. `inactive` is `true` when the edit-page check confirmed inactive, `false` for a manual save or a save verified active, and `null` when the check was inconclusive. `mode` is `draft`, `active`, or `manual`; old entries without `mode` are treated as manual when `inactive === false`, otherwise draft. `fp` is an optional D-56 fingerprint `{v:1, subjectId, categoryId, year, subject, category, question}` taken from the posted form at request time; it is omitted for rejected/ambiguous saves, for a missing required value, and for a canonical question over 4,000 characters. Entries without a complete `fp` are legacy and never match the prior-batch check.
- `autoLock`: `{tab, at}` heartbeat.
- A queue without `batchId`, or a key without a matching `ansKeyBatch`, is treated as legacy: manual use is unchanged, auto-save is blocked.

## 4. UI (add to the existing panel, phone-first)

- A **Start auto-save** button, a **Stop** button, a **Dry run** button, and a `Save as active (live immediately)` checkbox. These are never remembered across reloads, and auto-save **never starts on page load**.
- A **batch confirmation** block shown before Start. It lists Subject, Category, Year, number of questions, number of key entries, the first and last question numbers, and the mode. It has one tick-box, labelled `I checked the batch and understand these save live.` in active mode and `I checked the batch details.` in draft. Active is the default; both the active box and confirmation start ticked on a new batch. Metadata, key, or mode changes clear the confirmation but keep the active choice. New paste and Reset restore both defaults. Start is disabled until the confirmation is ticked.
- A concise status line such as `Auto-save ACTIVE: 12/40 done · 12 saved this run`, with a progress bar showing queue position. Dry run shows one summary line, not one line per question.
- A **blocked reason** line in plain words whenever auto-save stops.
- A **saved list** headed by the batch identity (`Batch: Subject / Category / Year — N questions (#first to #last)`) and then the summary ("Saved this batch: #901 to #910, inactive"), with a Copy button, built from `ocrSavedLog`. The copy text repeats the batch identity line. The suffix is honest: `active` or `inactive` for a uniform batch, `N active, M inactive` for a mix, `MISMATCH: N saved in the wrong state` first, or `status not verified` when any check was inconclusive. Per-question details stay behind Copy.
- A paused-run message: "A previous save may have been interrupted. Check the question list before continuing", with a button "I checked. Clear warning." and a link "Open filtered list" that opens `admin_questions.php?subject_id=<id>&exam_year_filter=<year>&category_filter=<id>` for the marker's subject, year, and category. The link is hidden when the marker and `ocrMeta` cannot supply valid numeric metadata.
- Start is disabled while the `ocrSaving` marker exists.

## 5. Per-question gate: `autosaveBlockers(q)`

It returns a list of reasons, and an empty list means safe. The loop stops on the first non-empty list and shows the first reason. It checks:

1. Queue has `batchId`, and `ansKeyBatch === queue.batchId`.
2. Queue numbers are consecutive, with no null, gap, repeat or out-of-order number. This is checked over the whole queue.
3. The key has an entry for **every** queue number (any letter A to F), and the key's numbers **exactly equal** the queue's numbers. Extra or missing entries block.
4. The key has no conflicts. `parseKey` is changed to also return duplicate numbers with differing letters, and any conflict blocks.
5. This question's key letter is A, B, C or D. An E or F letter blocks only this question.
6. The correct-answer radio is checked and equals the key letter. A different tick is a human override and goes to the manual path.
7. `q.flags` is empty. `q.e` and `q.f` are empty, and the parser pushes `'E/F options present'`.
8. Detected option letters are **exactly** `ABCD`.
9. Options A to D are non-empty, case- and whitespace-normalised distinct, and each is ≤ 500 **bytes**. The question text is ≥ 10 characters.
10. Subject, category and year are set, and the single batch confirmation is ticked.
11. The selected mode did not change since Start.
12. No file is chosen in `question_image` or `answer_video`. Diagram/table words do not block; the uploader decides whether a batch needs images (D-38).
13. No `ocrSaving` marker, no save in progress, the Stop flag is off, and this tab holds the lock.
14. The page is visible (`!document.hidden`). On hide, finish the current save and pause. Never start a save while hidden.
15. The number is not already in this batch's saved log; no retained entry from an earlier batch has a complete matching fingerprint (D-56); and no loaded 20-row table row is a recent duplicate. The order is current-batch number, prior-batch fingerprint, then the table. Dry run calls the same gate.

## 6. One save function: `saveCurrentQuestion({auto, active})`

The manual submit handler is rewritten to call this same function. It returns `'saved' | 'rejected' | 'ambiguous'`.

1. Set the guard flag. Write `ocrSaving`.
2. Build `FormData(form)`. If `auto`, draft mode calls `fd.delete('is_active')`, active mode calls `fd.set('is_active','1')`, and both set `fd.set('autosave','1')`. If manual, keep today's behaviour (Decision A). **Remove the two forced `is_active = true` lines** from `fillForm` and the submit handler, but keep manual saves active by leaving the checkbox ticked on the manual path only.
3. `fetch(location.href, {method:'POST', body: fd, credentials:'same-origin', signal})` with a 30-second `AbortController` timeout.
4. Classify the response:
   - **Rejected (definite, not saved):** the page contains `.admin-error` and `response.redirected` is false. Show the server's text. Clear `ocrSaving`.
   - **Session expired (definite, not saved):** the page contains "Administrator Login". Clear `ocrSaving`.
   - **Saved:** `response.redirected` is true, there is no `.admin-error`, the text matches `Question saved successfully \(Question ID: (\d+)\)`, and the ID is **greater than every ID in `ocrSavedLog`**. A stale flash fails the redirect or ID check.
   - **Anything else, a timeout, or a network error:** **ambiguous**. Keep `ocrSaving`. Tell the user: "Unknown. It may have saved. Check the list." Never retry.
5. After **Saved**, do these in order:
   1. Optionally verify state (auto only): GET `location.pathname + '?edit=<id>'`, parse the `is_active` checkbox, and compare it with the run mode. A draft run expects unchecked and an active run expects checked. A mismatch shows a red `SAVED AS ACTIVE` (draft) or `SAVED AS INACTIVE` (active) warning and stops the run. `null` is logged unverified; two consecutive unverified auto saves stop the run.
   2. Append to `ocrSavedLog`.
   3. Advance `queue.i` and call `saveQ()`.
   4. **Then** clear `ocrSaving`.
   5. Clear `question_image`, `answer_video` and `answer_explanation`.
   6. Store `ocrMeta`, call `showOCR()`, and then `tick()` or `form.reset()` if the queue is finished (as the manual code does today).
   7. Message: "Saved as question #N" plus "(inactive)" or "(active)" when step 5.1 verified the expected state, or "Could not verify; check the list" when it did not.
6. Clear the guard flag.

## 7. The loop

- Start is a user click. It re-checks every gate, then loops: `autosaveBlockers → saveCurrentQuestion → 1500 ms sleep`.
- It stops on: Stop, any blocker, any non-`'saved'` result, or the end of the
  queue. There is no save-count cap (D-43).
- It holds `autoLock` with a heartbeat every 5 seconds and refuses to start if another tab's lock is under 15 seconds old.
- **Dry run:** the whole loop runs, but the fetch is replaced by a stub that logs "Would save #n as draft: subject/category/year, A to D, answer X" or "as ACTIVE". It saves nothing and writes nothing to `ocrSavedLog`. A clean batch in either mode uses the selected wording; the tick gates do not block a dry run.
- Never use `setInterval` as the engine, a `MutationObserver` for success detection, or `button.click()` or `requestSubmit()`.

## 8. Acceptance tests (the agent must run these before delivery)

**Unit tests (Node)** for:

- consecutive numbers: gap, repeat, null, out of order;
- key coverage: missing entry, extra entry, conflict, E/F letter;
- option order exactly `ABCD`;
- duplicate options;
- the byte-length check;
- `parseKey` conflict output.

**Dry-run scenarios:**

- clean batch;
- a gap in the middle;
- one E key letter in the middle (the loop stops there, resumes after a manual save);
- a legacy queue with no `batchId`.

**Live test, 3 questions, with Samuel watching:**

- all three appear as Inactive in the list;
- turning the network off mid-save leaves the marker, blocks Start, and does not retry;
- a validation error (e.g. blank option) is classified Rejected even when a stale success message is present;
- two tabs cannot both run the loop.

## 9. No developer dependency

Nothing in this build requires a server change. The two safeguards the server would have provided are done in the browser instead:

- **Inactive is enforced and checked in the browser in draft mode.** The tool removes the "active" tick before saving. After each save it opens the question's edit page and checks that it is inactive. If any question comes back active, the run stops and shows a red warning. Active mode instead sets the tick, checks that the edit page is active, and stops with `SAVED AS INACTIVE` if it is not live.
- **Repeats are blocked in the browser.** Before each auto-save, the tool stops the run if its number is already in this batch's saved log. It also stops if any retained `ocrSavedLog` entry from an earlier batch has a complete D-56 fingerprint with the same subject, category and year IDs and the same normalized question text; the newest such entry (by `at`, then `id`) is reported with its saved ID, year and category. Finally it stops if the newest 20 questions on the admin page show the same normalized subject, exam year, category and question text. A long question reaches the table as its first 139 characters plus `…`; a truncated row matches by prefix once it is at least 40 characters, and an untruncated row matches only the full text. A row whose year or category cannot be read falls back to subject and text.

Known limits: this catches repeats from the same run, the retained 200-entry log, and the loaded 20-row table. It does not catch a repeat whose log entry was dropped by the cap, a legacy entry saved before fingerprints, or a question over 4,000 characters at save time. The batch confirmation screen should say so. The fingerprint check never matches the current batch, so two items in one paste are not checked against each other.

## 10. Phase 2: active mode (AS-08)

An in-memory checkbox selects active or draft; active is the default for a new
batch, and unticking it produces drafts. One mode-aware batch confirmation is
required. The mode is fixed for the run, and active saves set `is_active=1` and
verify that the edit page is active. A bulk "Activate this batch" button is
not part of this package and has no spec.
