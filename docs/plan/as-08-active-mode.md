# AS-08 — Active Mode

Status: not started. Depends on: AS-07. Blocks: AS-09.

## Source and scope

`docs/Active.md` Part A (A1–A7) is the authoritative change-and-test list. This
package adds the opt-in active save mode. Draft stays the default.

Read A1–A7 completely. The non-goals are binding: no bulk activation, no change
to manual saves, no parser change, and no change to existing gates beyond
adding the two mode codes.

## Preconditions

- AS-07 is done, including its Fix 1 live check and Fix 2 manual-marker check.
  The draft-only barrier in `docs/Active.md` §2 is now cleared.
- Baseline after AS-07: runner 25; unit green; build one line / no `%`.
- Plan the live test with Samuel watching; two questions; delete the test rows
  afterward.

## Work

1. A2 state: in-memory `activeMode`, `activeConfirmed`, and `runMode`; reset
   them in `resetConfirm()`; add `mode` to new `ocrSavedLog` entries with the
   documented legacy fallback.
2. A3 UI: `#ocr_active_mode`, `#ocr_active_tick`, the mode line, Start
   conditions, running status, and dry-run wording. Disable the mode box while
   running.
3. A4 gate: add `activeMode`, `activeConfirmed`, `mode`, and `runMode`; add
   `mode-unconfirmed` and `mode-changed` in the documented order.
4. A5 save: `saveCurrentQuestion({auto, active})`; auto sets or deletes
   `is_active`; `autosave=1` stays; the `verifyInactive` expectation follows
   the mode; a mismatch stops with the mode-specific message; log
   `{num,id,at,batchId,inactive,mode}`. Preserve AS-07's stop after two
   consecutive `null` checks; the mode only changes what counts as a match.
5. A6 suffix: replace `savedInactiveSuffix` with exported `savedModeSuffix`;
   implement the four ordered rules; keep `formatSavedRange` range formatting.
   Preserve AS-07's per-question unverified list; the suffix is batch-level and
   must not replace the named entries.
6. A7 tests: unit, dry run, mock browser, plus the two-question live test and
   the draft regression.
7. Blocker table: add `mode-unconfirmed` and `mode-changed` to `blockerText`
   and the all-codes test (Active.md §C).
8. Docs: Active.md §D **Phase 2** (SPEC §7, D-39, INV-71, Auto-Save-Spec §9).

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | exit 0; all suffix, blocker, and code-table tests pass |
| Dry run | a clean batch in each mode uses the correct wording; Start stays disabled until the needed ticks are set |
| Mock browser | an active run posts `is_active=1` and `autosave=1`; a draft run posts no `is_active`; the mode box cannot change mid-run |
| Build | one line, no `%`, body parses |
| Live, 2 questions | both Active in Recently Added; the list reads `, active`; a draft run still saves 1 Inactive; test rows deleted |
| Unverified list | an unverified save still names its question number and ID after the suffix change |
| Unverified stop | two consecutive `null` checks still stop the run in either mode |
| Docs | §D Phase 2 updated |

## Guardrails

- Draft remains the default; active is opt-in and never persisted.
- Manual saves remain active and unchanged.
- Both ticks are required for active Start; a mode change during a run is a
  blocker.
- Do not remove the per-question unverified list or the two-consecutive-null
  stop when replacing the suffix and changing the expected state.
- Do not change `classifySaveResponse`, the retry rules, the crash marker, or
  the lock.
- Do not touch PHP, the server contract, or existing storage keys.
- Commit only at the phase boundary as `docs/Active.md` §1 directs.

## Handoff note (append when done)

```text
Date:
Result: runner ...; unit ...
Dry run: active wording ...; draft wording ...; Start gating ...
Mock: active FormData ...; draft FormData ...; mid-run toggle ...
Live: 2 active rows ..., draft regression ..., rows deleted ...
Files:
Build: one line / no % / body parses
Docs: ...
Open questions:
```
