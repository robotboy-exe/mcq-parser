# AS-05 — UI and loop

Status: done (code + mock-browser checks, 2026-10-25; hide-pause verified in
AS-06). Depends on: AS-04. Blocks: AS-06.

## Self-contained context

AS-04 provides the save function and the crash marker. This package adds the
opt-in controls and the loop. Auto-save never starts on page load, never uses
`setInterval` as the engine, and never clicks the form's submit/skip buttons.

The user is on a phone; keep the panel compact and the messages plain.

## Goal

Add the batch confirmation, Start/Stop/Dry run, status, blocked reason, saved
list with Copy, and paused-run warning. Add the lock, heartbeat, visibility
pause, run cap, and dry run.

## UI

Add to the existing panel, before or beside the paste controls:

- `ocr_auto_start`, `ocr_auto_stop`, `ocr_auto_dry`.
- `ocr_batch_confirm`: subject, category, year, question count, key count,
  first and last question numbers, and one tick-box `These are correct.`
  Start is disabled until the tick is set.
- `ocr_auto_status`: counts such as `Saved 4 of 10 this run.`
- `ocr_auto_blocked`: the first blocker in plain words.
- `ocr_saved_list` and `ocr_saved_copy`.
- `ocr_paused`: the interrupted-save message and `I checked. Clear warning.`

Rules:

- Start, Stop and the dry-run tick are never persisted; auto never starts on
  load.
- The confirmation tick resets on a questions paste, key-only paste, Reset,
  Clear key, and a change to subject/category/year.
- Start is disabled while `ocrSaving` exists or confirmation is not ticked.
- Server-derived text (subject/category option text, IDs, error text) uses
  `textContent`.
- Copy uses `navigator.clipboard.writeText` when available, otherwise a
  temporary textarea and `execCommand('copy')`.

## Loop

1. On Start, re-check every gate with `autosaveBlockers`.
2. Acquire `autoLock`; refuse if another tab's lock is under 15 seconds old.
   Heartbeat every 5 seconds with a recursive `setTimeout`.
3. Loop: gate → save → 1500 ms sleep.
4. Stop on Stop, any blocker, any non-`saved` result, the run cap, or the end of
   the queue. Start again resets the run count and continues.
5. On hide, finish the current save, then pause; never start a save while
   hidden. No auto-resume when visible.
6. Release the lock on stop, pause, cap, blocker, and end. Do not release it
   while a save is still finishing.
7. Dry run uses a copy of the queue and the current form metadata. It logs
   `Would save #n: subject/category/year, A to D, answer X.` It writes nothing
   to `ocrQueue`, `ocrSaving`, `ocrSavedLog`, or `autoLock`.
8. Run cap: 3 for the first live test; AS-06 raised it to 10 after sign-off.
9. No `MutationObserver`, `button.click()`, `requestSubmit()`, or `setInterval`
   engine.

## Steps

1. Add the DOM block to the injected panel; keep the static HTML in `innerHTML`
   only. Render dynamic values with `textContent` or created nodes.
2. Add `resetConfirm()`, `renderAuto()`, `renderSavedList()`, `renderPaused()`.
3. Add the state variables and the async loop.
4. Add the lock helpers and heartbeat.
5. Add the visibility listener.
6. Add copy behavior.
7. Stop any running auto on Load, key-only Load, Reset, Clear key, Skip, Go to,
   and manual submit.
8. Add tests for the pure pieces already in AS-02/AS-03; add a small state test
   for `formatSavedRange` if not already covered.
9. Run the five dry-run scenarios with Chromium against a locally served copy of
   `archive/live-sources/admin_questions.html`:
   - clean batch;
   - gap in the middle;
   - stem containing `diagram`;
   - one E key letter in the middle;
   - legacy queue without `batchId`.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0 |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds; `1` |
| `rg -n '%' src/bookmarklet.js` | no matches |
| Dry-run scenarios | each stops or continues for the documented reason; no save, no log write |
| Two-tab dry run | second Start shows the lock reason |
| Hide tab during dry run | no new would-save starts; status says paused |

## Guardrails

- Do not auto-start on load or after a reload.
- Do not persist button or tick state.
- Do not mutate the real queue during dry run.
- Do not retry after ambiguous.
- Do not let a blocker be silent; show the first reason.
- Do not add a server dependency.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 34 PASS / 0 FAIL
Files: src/ui/ui.js (auto panel, confirm, loop, lock, dry run, saved list,
  pause warning, visibility listener), tests/unit.js.
Mock-browser evidence (local server on 8767; no PHP):
- 3 clean questions saved #900-#902, all inactive; posts had autosave=1 and no is_active.
- 5-question batch stopped at cap 3; Start again saved the last two.
- Ambiguous reply left ocrSaving, did not advance, disabled Start, showed warning; Clear warning worked.
- Rejected reply cleared the marker, did not advance, showed the server error.
- Active result showed SAVED AS ACTIVE, stopped, logged and advanced the question.
- A fresh other-tab autoLock blocked Start with the lock reason.
- Dry run: clean, gap, diagram, E-key-in-middle, and legacy queue all reported the expected reason; queue, log, marker, and lock were unchanged.
- Manual submit posted is_active, saved #902, and advanced.
Open questions: hide-pause was verified in AS-06 on 2026-10-25 with a slow mock
(one in-flight POST finished, the run paused, and no second POST started) and
by the live two-tab test. The live 3-question test passed in AS-06; the lock
reason itself could not be shown live on one browser (hide-pause releases
first). No open AS-05 item remains.
```
