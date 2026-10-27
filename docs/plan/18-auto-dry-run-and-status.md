# AS-12 — Automatic dry run and separate run status

Status: not started. Depends on: AS-11 (done). Blocks: none.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

User request 2026-10-27. Loading a batch currently leaves Dry run as a manual
button. Make a dry run start automatically after a successful Load, including a
key-only Load, and separate dry-run state from live auto-save state. The two
must not overwrite each other's status, progress, or blockers.

The live run also needs honest persistent states: complete beats Stop, a
mid-batch reload shows an incomplete batch, and a dry result becomes stale when
its inputs change.

No new storage key. Reload state is derived from `ocrQueue` and `ocrSavedLog`.

## Preconditions

- AS-11 is done, light verification passed, and AS-11 is committed; history and
  saved-box rendering are stable.
- AS-10 is done and committed; dry run and Start use the same prior-batch
  duplicate check.
- `runDry`, `runAuto`, `renderAuto`, `renderProgress`, `gateState`,
  `autosaveBlockers`, `showBlocked`, `markStopped`, and the Load/Reset/Skip/Go
  handlers are understood.
- `ocrSaving` remains the in-flight save marker; do not reuse it for run state.

## Work

1. Split the shared state. Keep `autoRunning` only as an `anyRunning()` helper
   (`dryRunning || liveRunning`) for mutual exclusion and busy checks. Add:
   ```js
   let dryRunning = false, dryStop = false, dryState = 'idle', dryStatus = '';
   let dryBlocked = '', dryStamp = null, dryChecked = 0, dryTotal = 0;
   let liveRunning = false, liveStop = false, liveState = 'idle', liveStatus = '';
   let liveBlocked = '', liveMode = null, liveRunCount = 0;
   ```
   Replace `stopAuto` with `dryStop`/`liveStop`; replace `autoStatus` with
   `dryStatus`/`liveStatus`; replace `lastBlocked` with
   `dryBlocked`/`liveBlocked`. `gateState` uses `stopRequested: liveStop`.
2. Add two panels in the injected markup:
   - Dry: `#ocr_dry_panel`, `#ocr_dry_status`, `#ocr_dry_blocked`,
     `#ocr_dry_progress`, `#ocr_dry_progress_bar`,
     `#ocr_dry_progress_text`, `#ocr_auto_dry` (start), and
     `#ocr_auto_dry_stop` (stop).
   - Live: keep `#ocr_auto_start` and `#ocr_auto_stop`; add
     `#ocr_live_panel`, `#ocr_live_status`, `#ocr_live_blocked`,
     `#ocr_live_progress`, `#ocr_live_progress_bar`, and
     `#ocr_live_progress_text`.
   Move the existing Start/Stop/active-mode/confirmation controls into the live
   panel. Keep the saved box, paused warning, and history outside both panels.
3. Render each panel independently. Dry uses a teal accent (`#0f766e`) and
   labels: `IDLE`, `RUNNING`, `STOPPING`, `COMPLETE`, `STOPPED`, `STALE`,
   `BLOCKED`. Live uses gray `#6b7280` for `IDLE`, blue `#1769aa` for
   `RUNNING`, amber `#b45309` for `STOPPING`/`STOPPED`/`PAUSED`/`INCOMPLETE`,
   green `#0d6b3f` for `COMPLETE`, and red `#b00020` for
   `BLOCKED`/`NEEDS-CHECK`. Always show the text label; color is not the only
   signal.
4. `runDry`:
   - Refuse to start when `liveRunning` (mutual exclusion).
   - Copy the queue and write nothing: no POST, no queue/log/key/lock/marker
     write.
   - Use the same gate and prior-batch duplicate check as Start.
   - Do not pre-block on missing metadata or key; let the first blocker show
     amber with its normal text.
   - Show only a summary and progress, never one line per question.
   - On completion set teal `COMPLETE`; on a blocker set amber `BLOCKED`; on
     Stop set amber `STOPPED`.
5. `runAuto`:
   - Refuse to start when `dryRunning`.
   - Keep the existing lock, confirmation, mode, save, and unverified rules.
   - `COMPLETE` wins over Stop: check `!queue.items[queue.i]` before
     `liveStop`, both at the top of the loop and immediately after a save.
   - On a blocker set red `BLOCKED`; on two unverified saves set red
     `NEEDS-CHECK`; on Stop set amber `STOPPED`; on hidden set amber `PAUSED`.
   - Do not clear the dry panel when live starts or blocks.
6. Automatic dry run:
   - After a successful full Load, and after a successful key-only Load when a
     queue exists, schedule one dry run.
   - If live is still stopping, wait until it finishes. If a previous dry run
     is still running, let it stop first.
   - Use a load token so a second Load invalidates the first scheduled dry run.
   - Do not auto-run on an arbitrary page load with an existing queue; only
     after a Load action.
   - If the queue is empty, do nothing.
7. Stale dry result:
   - Set `dryStamp` from batch ID, queue index, subject/category/year, key, and
     active mode when a dry run finishes.
   - Call `invalidateDry(reason)` on metadata change, active-mode change, key
     change, queue load, Skip, Go to, Reset, and any live save that advances
     the queue. If dry is running, stop it and mark `STALE`; otherwise replace
     its result with `STALE — <reason>`.
   - Never let dry invalidation change live status or blockers.
8. Persistent live states:
   - Add a pure `deriveLiveState(queue, savedLog)` helper in `parser.js`.
     Return `idle` when there is no queue or no saved entry for the batch,
     `complete` when `queue.i >= queue.items.length`, otherwise `incomplete`.
   - On initial render, show `COMPLETE` green for a finished batch and
     `INCOMPLETE — queue resumed at X of N` amber for a mid-batch batch, where
     `X = queue.i + 1`.
   - Keep `STOPPED`, `PAUSED`, `BLOCKED`, and `NEEDS-CHECK` visible until the
     next Start or a new Load. Do not auto-resume.
9. Update `docs/DECISIONS.md` D-58, `docs/SPEC.md` Auto-Save section,
   `docs/Auto-Save-Spec.md` §§4–6 and 9, `docs/INVARIANTS.md` (dry/live
   separation, stale, incomplete), `docs/AGENTS.md` Auto-Save UI row, and the
   README.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL |
| `node tests/unit.js` | `deriveLiveState` tests PASS; all prior tests PASS |
| Full Load | auto dry starts; no POST; teal panel |
| Key-only Load with queue | auto dry starts again with the new key |
| Missing key or metadata | auto dry still starts and stops amber with a blocker |
| Live Start | dry panel remains; live panel blue |
| Dry while live blocked | dry runs without clearing live status |
| Stop after last save | `COMPLETE`, not `STOPPED` |
| Reload mid-batch | amber `INCOMPLETE — queue resumed at X of N` |
| Reload after finish | green `COMPLETE` |
| Metadata/key/mode/queue change | dry result becomes `STALE` |
| Dry run writes | no `ocrQueue`, `ocrSaving`, `ocrSavedLog`, `ocrBatchHistory`, or `autoLock` change |
| Build | `src/bookmarklet.js` one line, no `%`, body parses |

Browser smoke on the admin page (no browser test suite exists):

1. Load a 3-question batch with key: auto dry completes, no row is created.
2. Load the same batch without a key: auto dry stops amber.
3. Change year: dry shows `STALE`.
4. Start live, press Stop after the penultimate save: final save completes and
   the panel shows `COMPLETE`.
5. Stop before the final save: amber `STOPPED`; reload shows `INCOMPLETE`.
6. Let a batch finish: reload shows green `COMPLETE`.
7. Block live with a duplicate, run dry: live red text remains.
8. Confirm the dry panel has no per-question lines and the live panel keeps its
   own progress.

## Guardrails

- Dry run must not write any storage key or send a POST.
- Do not add a run-state storage key. Derive reload state from the queue and
  saved log.
- Do not auto-start live saving.
- Do not use color alone; every state has a text label.
- Do not regress the saved box, paused warning, history box, lock, mode
  confirmation, unverified-stop, or duplicate gate.
- Do not split inline questions or change parser output.
- No `%` anywhere in the build.
- Do not rebuild `src/bookmarklet.min.js`.

## Handoff note (append when done)

```text
Date:
Result:
Files:
Hashes:
Acceptance coverage:
Build:
Docs:
Browser smoke:
Review: rigorous review pending at cycle end.
Commit: deferred to cycle close; commit before archiving.
Open questions:
```
