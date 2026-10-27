# Review — post-as-2026-10 phase 5 (AS-12)

Date: 2026-10-27
Reviewer: independent review session
Verdict: PASS WITH ACCEPTED FINDINGS
Commit readiness: after user accepts findings
Review status: independent-pass-with-accepted-findings
Scope: AS-12 / `docs/plan/18-auto-dry-run-and-status.md` (phase 5 and the
cycle-end rigorous checkpoint). P11, P12, AS-10, and AS-11 were checked only as
dependencies; phases 2 and 3 have rigorous records and AS-11 was light-verified.

## Evidence

Baseline commands in the shared worktree:

- `node tests/runner.js` → 41 PASS, 0 FAIL, 0 PENDING, exit 0, no orphan.
- `node tests/unit.js` → 108 PASS, 0 FAIL, exit 0.
- `node tools/extract-bank.js --check` → `OK: source, anchors, counts, and 7
  output hashes match`, exit 0.
- `src/bookmarklet.js` → 1 line, 80,927 bytes, no `%`, body parses. The build
  transformation was replayed in memory (strip full-line comments, flatten,
  wrap) from `src/parser/parser.js` + `src/ui/ui.js` without writing; the
  result matched the checked-in file byte-for-byte.
- Handoff hashes verified: parser `f337e7f2ea29…`, UI `9c20f5455df1…`,
  bookmarklet `769078f5a19c…`, unit tests `1e4628997e7b…`.
- Diff matches the handoff file list: `src/parser/parser.js`, `src/ui/ui.js`,
  rebuilt `src/bookmarklet.js`, `tests/unit.js`, and the named docs plus
  `docs/plan/README.md` and the package. No fixtures, minified build, storage
  key, PHP/server, `splitQuestions`, or `splitSections` changes.
- Co-resident unrelated changes: root `AGENTS.md`, `docs/AGENTS.md`,
  `docs/plan/prompts/{README,phase-session,cycles/README}.md`, and untracked
  `docs/LIVE-SAFETY.md` / `docs/plan/prompts/cycle-close.md`. The handoff
  discloses these; they are not AS-12 code (NOTE-4).

Directed probes (beyond the added tests):

- Build reproduction in memory matched the artifact (80,927 bytes, no `%`).
- Dry completed with teal `#0f766e`; live idle gray `#6b7280`; a missing key
  produced `BLOCKED` at amber `#b45309` with the key-batch blocker text.
- A 2-question live run with the UI harness stops after one save: after 200 ms,
  `posts=1`, `ocrQueue.i=1`, and the live panel still reads `RUNNING`
  (FIX-1).
- `grep -n dryStamp src/ui/ui.js` shows a write at `:823` and no reader
  (NOTE-3).
- The live browser smoke (steps 1-8) and rows #3841-#3846 are handoff-only; no
  artifact was produced and this review ran no live check (LIVE-SAFETY). No
  live write, delete, or cleanup was performed.

## Acceptance coverage

| Check | Result |
|---|---|
| Runner 41 PASS, 0 FAIL, 0 PENDING, no orphan | PASS |
| `deriveLiveState` and all prior unit tests | PASS (108) |
| Full Load auto dry; no POST; teal | PASS (unit + color probe) |
| Key-only Load auto dry with the new key | PASS (unit) |
| Missing metadata or key still dries, amber blocker | PASS (metadata unit; missing-key probe) |
| Live Start keeps the dry panel; live panel blue | Code correct; color probe passes; no test for panel persistence |
| Dry while live blocked does not clear live status | PASS (unit) |
| Stop after the last save shows `COMPLETE` | Code order correct (`src/ui/ui.js:850-851`, `:864-865`); automated test does not exercise the race (FIX-1); live smoke is handoff-only |
| Reload mid-batch amber `INCOMPLETE — queue resumed at X of N` | PASS (unit) |
| Reload after finish green `COMPLETE` | PASS (unit) |
| Metadata/key/mode/queue change marks dry `STALE` | Metadata PASS (unit); key/mode/Skip/Reset inspection-only (FIX-1) |
| Dry writes no queue/marker/log/history/lock and sends no POST | PASS (unit) |
| Build one line, no `%`, body parses | PASS (reproduced in memory) |
| Browser smoke steps 1-8 | Handoff-only; not independently reproduced |

Implementation traced: `deriveLiveState` (`src/parser/parser.js:611-615`),
`runDry` (`src/ui/ui.js:766-834`), `scheduleAutoDry` (`:525-534`), `runAuto`
and the completion-before-Stop order (`:836-873`), `markLiveComplete` /
`markLiveStopped` (`:566-576`), `invalidateDry` (`:511-524`),
`syncLiveStateFromStorage` (`:496-510`), the Load/key-only/Skip/Go/Reset
handlers, and `gateState`/`autosaveBlockers`. Doc claims D-58, SPEC §7.2/§7.5,
Auto-Save-Spec §§4-6/9, INV-90/INV-91, the AGENTS UI rows, and the README
status/counts agree with the code. The dry run overrides only the marker, lock,
visibility, in-progress, stop, and form-state gates; it keeps the real
metadata, key, content, E/F, flag, and duplicate gates.

## Findings

FIX-1 — The UI harness never resolves the live-loop sleep, so multi-save live
evidence is missing. `tests/ui-harness.js:351` maps every `setTimeout(fn, ms)`
with `ms >= 1000` to `0` without scheduling `fn`; `runAuto` waits
`sleep(1500)` after each save (`src/ui/ui.js:866`). Reproduction: create a
2-question queue with `sampleStorage`, add a second item at `i: 1` with a
matching 2-entry key, `createUI({inactiveChecked:true})`, click
`ocr_auto_start`, and observe after 200 ms: `posts=1`, `ocrQueue.i=1`,
`live status = "RUNNING — ACTIVE: 1/2 done · 1 saved this run."` (the process
also stays alive on retry/heartbeat timers). No UI test can execute a second
auto-save, so `tests/unit.js:894-900` (1-question batch; Stop clicked only
after `COMPLETE`) does not exercise completion beating Stop; the Stop handler
returns immediately when `!liveRunning` (`src/ui/ui.js:1022-1024`), so the test
would pass even if the order were reversed. The same gap leaves the
key/mode/Skip/Go/Reset `STALE` paths and "dry panel remains after Start"
inspection-only. Fix: schedule the shortened timer with `SET_TIMEOUT(fn, 0)`
and add (a) a 2-save test that requests Stop during/after the penultimate save
(e.g. from the mock `reply` on the second POST) and asserts `COMPLETE`, and
(b) cheap `STALE` tests for key, mode, Skip, and Reset.

NOTE-1 — A full Load during the post-save wait can be overwritten back to
`STOPPED`. `src/ui/ui.js:876` sets `liveStop` and `:925` resets
`liveState='idle'`; when the old loop resumes it reaches `:851`/`:865` and
calls `markLiveStopped()` (`:572-576`), replacing the fresh IDLE with
`STOPPED — Stopped.` D-58 says stopped stays visible only until the next Start
or a new Load (`docs/DECISIONS.md:800-801`). The scheduler still waits and runs,
so this is status-only. A run/load token would close it. Trace verified
statically; FIX-1 prevents an automated reproduction.

NOTE-2 — A thrown `fetch` leaves the live panel `RUNNING`. `runAuto` has only
`finally` (`src/ui/ui.js:845-873`); if `saveCurrentQuestion` rejects (30 s
abort or offline), `liveRunning` is cleared but `liveState` remains
`'running'`, so the panel claims a run is active (previously it fell back to
idle). Set a stopped/blocked state in `finally` unless a terminal state is
already set.

NOTE-3 — `dryStamp` is dead state. It is written at `src/ui/ui.js:823` but
never read; stale detection is entirely event-driven through `invalidateDry`
(`:511-524`). Behavior matches D-58 through the callbacks, but either use the
stamp as a guard or document that invalidation is event-based.

NOTE-4 — Scope and commit context. Root `AGENTS.md`, `docs/AGENTS.md`,
`docs/plan/prompts/{README,phase-session,cycles/README}.md`,
`docs/LIVE-SAFETY.md`, and `docs/plan/prompts/cycle-close.md` are uncommitted
co-resident live-safety/process docs; the package handoff leaves the
cycle-close commit decision open. They are not AS-12 code and must not be
bundled without that decision. Live rows #3841-#3846 remain for owner cleanup;
#3795-#3800 need owner restore. Neither is an AS-12 acceptance step.

## Findings closed (re-review only)

Not applicable; this is the first review.

## Recommended next action

User accepts the findings. Recommended: `accept and fix` for FIX-1 only
(test-only), accepting NOTE-1–4 as residual risk; then run cycle close. No
re-review is needed if only the harness/test/doc wording changes. Fixing
NOTE-1 or NOTE-2 changes behavior and needs a re-review before cycle close.

Next action required:
- User decision: pending
- Recommended: accept and fix
- After decision: attach `docs/plan/prompts/fix-session.md` and pass
  `phase 5 FIX-1`; after the handoff update, attach
  `docs/plan/prompts/cycle-close.md` and send `cycle close`.
