# AS-12 — Automatic dry run and separate run status

Status: done (2026-10-27); re-review passed; NOTE-3 docs fixed; NOTE-4 accepted (separate docs commit); committed at cycle close. Depends on: AS-11 (done). Blocks: none.

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
- Live-created test rows need a unique marker and an exact ID manifest. Do not
  delete them; cleanup is owner-only under `docs/LIVE-SAFETY.md`.
- A required live delete or cleanup is a stop-and-ask condition, not an
  acceptance step.

## Handoff note (append when done)

```text
Date: 2026-10-27
Result: done. Dry and live have separate state, status, progress, and blocker
text. A full Load or key-only Load schedules one automatic dry run; a load
token cancels an older scheduled run. Missing metadata/key still starts dry and
stops at the first blocker. Dry writes nothing and sends no POST, uses the same
gate and prior-batch duplicate check as Start, and becomes STALE on metadata,
key, mode, queue-position, Reset, or queue-advancing live-save changes. Live
checks queue completion before Stop, so the final save shows COMPLETE. Reload
reads deriveLiveState(queue, savedLog) and shows COMPLETE or
INCOMPLETE — queue resumed at X of N; there is no run-state key and no
auto-resume.
Files: src/parser/parser.js; src/ui/ui.js; src/bookmarklet.js (rebuilt);
tests/unit.js; docs/DECISIONS.md; docs/SPEC.md; docs/Auto-Save-Spec.md;
docs/INVARIANTS.md; docs/AGENTS.md; docs/plan/README.md; this file.
Hashes (SHA-256): src/parser/parser.js
  f337e7f2ea296c2d8577f6fbd60c6957ecadcf67633cfbd8b63a7e95abd8abed;
  src/ui/ui.js
  9c20f5455df16749dd188576d1efb7ec2477e49c3d7346060a6a8e98149f8f5f;
  src/bookmarklet.js
  769078f5a19c16822761b021797e5fb053cec292993efab1e75de699d869de52;
  tests/unit.js
  1e4628997e7b6f2e2f36c218519acf275d32b2353be3fbb27f2dd0eb31e19a55.

Acceptance coverage:
- runner 41 PASS, 0 FAIL, 0 PENDING, no orphan: command run 2026-10-27.
- deriveLiveState: unit test covers null/empty queue, no batch log, different
  batch, incomplete, complete and overrun.
- UI dry/live: 7 harness tests cover full Load auto dry, key-only Load auto dry,
  missing-metadata blocked dry, dry not clearing a blocked live panel, reload
  incomplete/complete, completion beating Stop, and manual dry writing nothing.
- Browser smoke steps 1-8 passed on the live admin page: full Load auto dry with
  no POST; key-only Load auto dry; metadata change STALE; Stop after penultimate
  save COMPLETE; Stop before final save STOPPED then reload INCOMPLETE; finished
  reload COMPLETE; dry does not clear blocked live; no per-question dry lines
  and separate progress. Evidence was recorded in the session; no browser test
  suite exists.
- Build: node src/build/build.js wrote src/bookmarklet.js (80,904 chars,
  80,927 bytes); wc -l prints 1; no %; body parses. src/bookmarklet.min.js was
  not rebuilt.
Docs: D-58 added; SPEC §7.2/§7.5, Auto-Save-Spec §4-6/9, INV-90/INV-91,
docs/AGENTS.md, and README updated. The separate live-safety policy is also
uncommitted in docs/LIVE-SAFETY.md and the agent/phase docs.
Browser smoke: passed steps 1-8; live test rows #3841-#3846 remain.
Live writes/cleanup: test rows #3841-#3846 were created for the smoke and are
left for owner-only cleanup. No live delete or cleanup was performed by the
agent after the incident; #3795-#3800 were already deleted and are not part of
this package.
Review: rigorous review passed with accepted findings; FIX-1/NOTE-1/NOTE-2
fixed; re-review passed; NOTE-3 docs fixed; NOTE-4 accepted (separate
safety/process docs commit).
Commit: committed at cycle close; SHA reported by the cycle-close session.
Open questions: none for commit scope. The six deleted questions need owner-side
restore, and test rows #3841-#3846 remain for owner-only cleanup.
```

## Fix note — 2026-10-27

Result: fixed FIX-1, NOTE-1, and NOTE-2 from
`docs/plan/reviews/post-as-2026-10-phase-5.md`.

Findings addressed:
- FIX-1: the UI harness now schedules the shortened live-loop sleep, so a
  second auto-save can run. Added a 2-save test that requests Stop during the
  final POST and asserts `COMPLETE`, plus `STALE` tests for key clear, mode
  change, Skip, and Reset.
- NOTE-1: `runAuto` now uses a live run token; a full Load or Reset increments
  it and the old loop returns without writing status, so a fresh `IDLE` is not
  overwritten by `STOPPED` or `COMPLETE`.
- NOTE-2: an error escaping the live loop now ends `BLOCKED` with text instead
  of leaving the panel `RUNNING`; a terminal state or stale token is untouched.

Files: src/ui/ui.js; src/bookmarklet.js (rebuilt); tests/ui-harness.js;
tests/unit.js; docs/DECISIONS.md; docs/SPEC.md; docs/Auto-Save-Spec.md;
docs/INVARIANTS.md; docs/AGENTS.md; docs/plan/README.md; this file.

Hashes (SHA-256): src/ui/ui.js
  62f8e339846927dc1ed78e88c4844d542f0ef35b366e26f69698170af594dfac;
  src/bookmarklet.js
  f110322ec435c8bcf3ac1e39feffb4cc92b0ca76d16bc1c95ac23d2e6c9d081d;
  tests/unit.js
  0947fdb73a41eb6e795cac57942b1d4d3a266c81d497f63f2bb36dbed4a570ed;
  tests/ui-harness.js
  6faf128c4a5e9d0020cb3979a20871b91555f558835f3876cd1490422585ea40.
  src/parser/parser.js is unchanged
  (f337e7f2ea296c2d8577f6fbd60c6957ecadcf67633cfbd8b63a7e95abd8abed).

Tests: runner 41 PASS, 0 FAIL, 0 PENDING; unit 115 PASS, 0 FAIL; extractor OK
with 7 output hashes; bookmarklet 1 line, 81,283 bytes, no `%`, body parses.

Behavior changed: yes (NOTE-1 and NOTE-2). FIX-1 is tests/harness only.

Review status: fixes applied; re-review is required before cycle close.

Commit: deferred to cycle close (no phase N+1).

## Fix note — 2026-10-27 (NOTE-3)

Result: fixed NOTE-3 from
`docs/plan/reviews/post-as-2026-10-phase-5-re-review.md` (carried from the
first review). NOTE-2 was already closed by the earlier fix note and the
re-review; it is not reopened.

Findings addressed:
- NOTE-3: documentation now states that dry-result invalidation is event-driven
  through `invalidateDry`; the `dryStamp` snapshot is recorded but never read
  back. No code, test, fixture, or build change.

Files: docs/DECISIONS.md; docs/SPEC.md; docs/Auto-Save-Spec.md;
docs/INVARIANTS.md; docs/AGENTS.md; docs/plan/README.md; this file.

Hashes (SHA-256): docs/DECISIONS.md
  a56c1b06556c9a4b510f5d73f7eeec6e52af020485597a3eca47bfbc3f3ad120;
  docs/SPEC.md
  d9018c853bc10c9dfc736d04534689968aa7c5f2a4f1fe274e7216fa95d7c356;
  docs/Auto-Save-Spec.md
  c6264cc904b64ef233a1d31409c230dc7703395825a36f1c69c997e1bfde27cd;
  docs/INVARIANTS.md
  caa4731aa93fcf0447e706a9932d5f04dd1827ea5437c2b36b16c5ca2972676a;
  docs/AGENTS.md
  9a5fc6639cc41b11e21a288332679580edd556e152718d413056de1443dcb6a2;
  docs/plan/README.md
  6b19624b6683cab6c2162f3387357ca6d584c73356d07367f3492f9d9c55856d.
  This package file is omitted because this note changes it. No source, test,
  fixture, or build artifact changed.

Tests: runner 41 PASS, 0 FAIL, 0 PENDING; unit 115 PASS, 0 FAIL; extractor OK
with 7 output hashes. No build run; `src/bookmarklet.js` is unchanged.

Behavior changed: no (documentation only).

Review status: NOTE-3 closed; NOTE-4 (commit scope and owner-only live rows)
remains for cycle close. No re-review required for a docs-only change.

Commit: deferred to cycle close (no phase N+1).
