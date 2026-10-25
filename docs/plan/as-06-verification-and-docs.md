# AS-06 — Verification, docs, live test

Status: done (2026-10-25). Depends on: AS-05.

## Starting state (2026-10-25)

- AS-01…AS-05 are implemented. `node tests/runner.js` is 25 PASS; `node
  tests/unit.js` is 34 PASS. Build is one line with no `%`.
- Mock-browser checks passed for auto save, cap, ambiguous/rejected/active,
  lock, dry run, and manual save. Evidence is in the AS-05 handoff.
- Not yet done: hide-pause check, real admin live test, docs close-out, cap 10.
- No test servers or Chromium are left running. A new chat can start at step 1.

## Self-contained context

The feature is implemented and dry-run tested. This package makes the docs
truthful, runs the live acceptance test, and changes the run cap from 3 to 10
only after the test passes.

The live test is manual because this workspace has no admin credentials and no
PHP runtime. The agent prepares the checklist; Samuel runs it on the phone with
the agent watching.

## Goal

Close the Auto-Save contract in the docs, run the spec's live checks, and leave
the working tree resumable. Phase 2 (bulk activation) stays out of scope.

## Steps

1. **Docs.**
   - `docs/SPEC.md`: add an Auto-Save section covering storage additions,
     confirmation, gate, save classification, lock, dry run, and duplicate
     safeguards.
   - `docs/INVARIANTS.md`: update INV-05, INV-34, INV-36, INV-41, INV-50,
     INV-55; add Auto-Save invariants with evidence status.
   - `docs/EDGE_CASES.md`: update EC-45; add auto-save cases (gap, E/F key,
     legacy queue, ambiguous save, stale success, active result, duplicate,
     lock, hidden tab).
   - `docs/DECISIONS.md`: finish D-30…D-37 and note any live findings.
   - `docs/AGENTS.md`: update commands, comment/`%` rule, is_active and Reset
     rules, and the auto-save risk areas.
   - `docs/BUILD.md`: document full-line comment stripping, the `%` guard, and
     the removed inline width.
   - `docs/plan/README.md`: mark AS packages done; update snapshot and change
     log.
2. **Dry-run close-out.** Re-run the five AS-05 scenarios and save the evidence
   (date, browser, result, blocked reason). Dry run must not write
   `ocrSavedLog` or advance the real queue.
3. **Live test, 3 questions, Samuel watching.**
   - Load a clean batch with a matching key; tick the confirmation; Start.
   - All three appear as Inactive in the Recently Added Questions list.
   - Turn the network off mid-save. The marker remains, Start is disabled, and
     no retry happens. Clear the warning only after checking the list.
   - Force a validation error (blank option) with a stale success message
     present. It must be classified Rejected, not Saved.
   - Open a second tab and try to Start; it must show the lock reason.
4. **Cap.** Only after the live test passes, change the run cap from 3 to 10 and
   rebuild.
5. **Final checks.** Run the full command set; record the results.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0 |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds; `1` |
| `rg -n '%' src/bookmarklet.js` | no matches |
| `node -e "const fs=require('fs');new Function(fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,''))"` | exits 0 |
| Live test | all four checks pass; evidence recorded |
| Dry-run scenarios | all five pass; no queue/log mutation |
| `git diff --stat` | only intended files; no PHP, database, or helper changes |

## Guardrails

- Do not raise the cap before the live test passes.
- Do not promote an `UNVERIFIED`/`AT_RISK` item to a defect without reproduction.
- Do not change the PHP, `ocr_helper.js`, or the server contract.
- Do not add the Phase 2 activation button.
- Do not leave an orphan fixture or a failing test.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 34 PASS / 0 FAIL
Dry-run evidence: Chromium 152 (headless), local copy of admin_questions.html
  on 127.0.0.1:8767. All five scenarios matched and left queue/key/log/marker/
  lock unchanged; no POST was made:
  - clean: would save #1, #2, #3 (CRS / JAMB / UTME / 2021, answers A, B, C)
  - gap (1,2,4): stop at #1, non-consecutive
  - diagram at #2: save #1, stop at #2, needs picture/passage
  - E key at #2: save #1, stop at #2, key is E, form has four options
  - legacy queue: stop at #1, no batch identity
  Hide-pause: one in-flight POST finished (inactive), queue advanced by 1, log
  length 1, status paused, no second POST. Fresh other-tab lock refused Start
  with "Another tab is auto-saving."
  Boot fill: reload restored the form and ticked the key answer. A pre-existing
  server .admin-error still suppressed the refill (EC-48 preserved).
Live evidence: real admin page, Samuel watching.
  1. #1516-#1518 saved, all three Inactive in Recently Added.
  2. #1519 saved once; question 2 network loss stayed ambiguous, marker kept,
     no retry; warning cleared after checking the list.
  3. Server rejection forced with exam year 1800 (a blank option is blocked by
     the browser's required field before the save function runs). With the old
     #1520 success still present, the result was
     "NOT saved: Please enter a valid exam year between 1900 and 2100."
     No new row, queue did not advance.
  4. Two tabs in one browser: tab 1 paused on hide and released, tab 2 saved;
     no concurrent saves. The lock reason was not observed live because hiding
     tab 1 pauses it. The lock reason is covered by unit + mock; two separate
     browsers are not valid evidence because autoLock is per-profile storage.
Cap: 10 (raised after sign-off; rebuilt to 45459 chars / 45468 bytes)
Open questions: none blocking. The blocked-reason line now turns red and bold
  like #ans_res (fixed 2026-10-25). Native `required` still means a blank option
   never reaches the server from the manual form. The AUTO-SAVE TEST / LOCK
   TEST drafts (#1516-#1519, #1520, #1528, and later lock-test rows) were
   deleted from the live site on 2026-10-25.
```
