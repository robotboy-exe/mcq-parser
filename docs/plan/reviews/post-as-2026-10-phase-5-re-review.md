# Review — post-as-2026-10 phase 5 (AS-12) — re-review

Date: 2026-10-27
Reviewer: independent review session
Verdict: PASS
Commit readiness: yes
Review status: re-review-pass
Scope: AS-12 / `docs/plan/18-auto-dry-run-and-status.md` and the fix note for
FIX-1, NOTE-1, and NOTE-2 from
`docs/plan/reviews/post-as-2026-10-phase-5.md`. P11, P12, AS-10, and AS-11 were
re-checked only as settled dependencies. No product file, test, fixture, build
output, package status, phase map, or commit was changed by this session.

## Evidence

Baseline commands in the shared worktree:

- `node tests/runner.js` → 41 PASS, 0 FAIL, 0 PENDING, exit 0, no orphan.
- `node tests/unit.js` → 115 PASS, 0 FAIL, exit 0 (108 at the first review).
- `node tools/extract-bank.js --check` → `OK: source, anchors, counts, and 7
  output hashes match`, exit 0.
- `src/bookmarklet.js` → 1 line, 81,284 bytes on disk (81,283 content bytes as
  the build reports), no `%`, body parses.
- Build reproduction: copied `src/` to a temp directory, ran
  `node <tmp>/src/build/build.js`, and got SHA-256
  `f110322ec435c8bcf3ac1e39feffb4cc92b0ca76d16bc1c95ac23d2e6c9d081d`, byte-for-byte
  equal to the checked-in bookmarklet. The repo copy was not rewritten.
- Handoff hashes verified: parser `f337e7f2ea29…`, UI `62f8e3398469…`,
  bookmarklet `f110322ec435…`, unit tests `0947fdb73a41…`, UI harness
  `6faf128c4a5e…`.
- Diff matches the fix note: `src/ui/ui.js`, rebuilt `src/bookmarklet.js`,
  `tests/ui-harness.js`, `tests/unit.js`, and the named docs. No fixture,
  minified-build, storage-key, PHP/server, `splitQuestions`, `splitSections`, or
  `splitOptionMarks` change.
- Co-resident uncommitted files are still the live-safety/process docs from
  NOTE-4 (root `AGENTS.md`, `docs/AGENTS.md`,
  `docs/plan/prompts/{README,phase-session,cycles/README}.md`,
  `docs/LIVE-SAFETY.md`, `docs/plan/prompts/cycle-close.md`) plus the prior
  review record. They are not AS-12 code.

Directed probes (independent of the checked-in tests):

- A dry run completed teal, then Start live; the dry panel was not cleared and
  moved to `STALE — a save advanced the queue`, while the live panel reached
  green `COMPLETE`.
- Stop before the final save: `STOPPED — Stopped.`, 1 POST, `ocrQueue.i=1`;
  reload showed amber `INCOMPLETE — queue resumed at 2 of 2`.
- Reset during the post-save 1,500 ms wait: live stayed `IDLE`, the queue was
  empty, and 1 POST had run. The old loop did not write `STOPPED`/`COMPLETE`
  over the reset state (live token, ui.js:837,852,858,875,1013).
- Metadata change while a dry run was in flight: result ended
  `STALE — the metadata changed`, not `COMPLETE` (invalidateDry while running,
  ui.js:512-525).
- Live idle text/color is `IDLE`/`#6b7280`; dry and live color maps match D-58.

Implementation traced: `runAuto` token checks and error fallback
(`src/ui/ui.js:835-881`), `runDry` stale handling (`:765-834`), Load/Reset token
increments (`:933`, `:1013`), `invalidateDry` (`:512-525`), and
`deriveLiveState` (`src/parser/parser.js:611-615`). The browser smoke (steps
1-8) and rows #3841-#3846 remain handoff-only; this session ran no live check
and performed no live write, delete, or cleanup.

## Acceptance coverage

| Check | Result |
|---|---|
| Runner 41 PASS, 0 FAIL, 0 PENDING, no orphan | PASS |
| `deriveLiveState` and all prior unit tests | PASS (115) |
| Full Load auto dry; no POST; teal | PASS (unit + prior probes) |
| Key-only Load auto dry with the new key | PASS (test) |
| Missing metadata or key still dries, amber blocker | PASS (tests + prior probe) |
| Live Start keeps the dry panel; live panel blue | PASS (probe: dry went `STALE`, not cleared) |
| Dry while live blocked does not clear live status | PASS (test) |
| Stop after the last save shows `COMPLETE` | PASS (2-save Stop-during-final-POST test + 1-save test) |
| Reload mid-batch amber `INCOMPLETE — queue resumed at X of N` | PASS (test + probe) |
| Reload after finish green `COMPLETE` | PASS (test) |
| Metadata/key/mode/queue change marks dry `STALE` | PASS (metadata/key/mode/Skip/Reset tests + in-flight probe) |
| Dry writes no queue/marker/log/history/lock and sends no POST | PASS (test) |
| Build one line, no `%`, body parses | PASS (reproduced in temp) |
| Live loop survives multiple saves; Load/Reset token; escaped error | PASS (3 new fix tests + probes) |
| Browser smoke steps 1-8 | Handoff-only; not independently reproduced |

## Findings

NOTE-3 (carried, accepted at the first review) — `dryStamp` is still dead state.
It is written at `src/ui/ui.js:824` and never read; invalidation is entirely
event-driven through `invalidateDry` (`:512-525`). D-58 says a finished dry
result "stores an in-memory stamp … and becomes `STALE` when any of those inputs
changes", which reads as if the stamp drives detection. Behavior matches D-58
through the callbacks, so this stays documentation/residual risk, not a defect.
Reproduction: `grep -n dryStamp src/ui/ui.js` shows one write and no read.

NOTE-4 (carried, accepted at the first review) — Scope and commit context. The
live-safety/process docs listed above are still uncommitted and are not AS-12
code; the cycle-close commit must decide whether they are committed with this
phase or separately. Live rows #3841-#3846 remain for owner-only cleanup and
#3795-#3800 need owner-side restore. Neither is an AS-12 acceptance step.

## Findings closed (re-review only)

- FIX-1 — closed. `tests/ui-harness.js:351-354` now schedules long timers (with
  an optional `onLongTimeout` hook) instead of dropping them. The new 2-save
  test (`tests/unit.js:922-935`) requests Stop from inside the final POST and
  asserts 2 POSTs and `COMPLETE`; the earlier Stop-after-`COMPLETE` test remains.
  New `STALE` tests cover key clear, mode change, Skip, and Reset
  (`tests/unit.js:982-1004`). Probes above confirm multi-save behavior, Reset
  during the wait, and in-flight invalidation.
- NOTE-1 — closed. `runAuto` captures a run token (`src/ui/ui.js:837`) and
  returns at `:852`/`:858` when a full Load or Reset increments `liveToken`
  (`:933`, `:1013`); the `finally` at `:875` only writes a terminal state for
  the current token. The new Load-during-wait test
  (`tests/unit.js:937-956`) asserts a fresh `IDLE`, one POST, and queue index 0;
  the Reset probe above showed the same.
- NOTE-2 — closed. An error escaping the live loop is caught by `finally`
  (`src/ui/ui.js:872-879`), which sets `BLOCKED` with
  `The run stopped after an unexpected error…` unless a terminal state or stale
  token is already present. The new throw test (`tests/unit.js:958-973`)
  asserts `BLOCKED`, the text, and one POST.

## Recommended next action

Accept the re-review and proceed to cycle close. NOTE-3 and NOTE-4 remain as
accepted residual notes and do not block commit; the cycle-close session still
owns the live-safety-doc commit-scope decision.

Next action required:
- User decision: pending
- Recommended: accept
- After decision: attach `docs/plan/prompts/cycle-close.md` and send
  `cycle close`.
