# AS-09 — Remaining review fixes and doc corrections

Status: done (2026-10-25). Depends on: AS-08.

## Source and scope

`docs/Active.md` Fixes 3–7, the Nit, and Phase 3 docs are authoritative. Fix 2
is already in AS-07 and must not be repeated here.

Read the named sections completely. Keep each fix minimal; do not refactor.

## Preconditions

- AS-07 and AS-08 are done; the live active-mode test passed.
- `node tests/runner.js` → 25 PASS; `node tests/unit.js` green; build one line
  with no `%`.

## Work

1. **Fix 3 — confirmed-save logging/advance errors.** Write the log entry in
   its own try/catch; show `Saved as #N but could not be logged. Do not retry.`;
   keep the marker and stop the run. Wrap `saveQ()` the same way.
2. **Fix 4 — saved log across tabs.** Re-read `ocrSavedLog` before appending,
   merge by `id`, keep each entry's `mode`, and cap at 200.
3. **Fix 5 — explanation field.** Add a `has-explanation` blocker when
   `answer_explanation` has text.
4. **Fix 6 — pinned metadata.** Snapshot subject, category, and year when the
   batch tick is set; add `meta-changed` when they differ at save time; clear
   the snapshot in `resetConfirm()`.
5. **Fix 7 — heartbeat errors.** Wrap the heartbeat `store.set` in try/catch;
   on failure set `stopAuto = true` and release the lock.
6. **Nit.** Declare `out` before `add` in `autosaveBlockers`.
7. Add `has-explanation` and `meta-changed` to the blocker table,
   `blockerText`, and the all-codes test (Active.md §C).
8. Tests: Active.md Fixes 3–7 tests (storage faults, cross-tab merge, cap,
   explanation, metadata snapshot, heartbeat lock release) plus a regression
   check that the gate still returns the expected first blocker.
9. Docs: Active.md §D **Phase 3** — Auto-Save-Spec §9 says stop, not skip;
   SPEC §2 uses `location.href` for the POST and `location.pathname` for the
   edit-page check. Refresh INV-62, INV-65, INV-66, and INV-67 where these
   fixes change their claims.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | exit 0; every fix test passes and `has-explanation` / `meta-changed` are in the all-codes test |
| Build | one line, no `%`, body parses |
| Docs | Active.md §D Phase 3 updated and affected invariants refreshed |
| `git diff --stat` | only intended files; no PHP, database, helper, or storage-shape changes |

## Guardrails

- Preserve marker semantics: clear only on a definite Saved/Rejected result.
- Do not clear `ocrSavedLog` on Reset.
- Do not retry an ambiguous save.
- Do not change the run cap, lock age, or heartbeat interval.
- Do not add `ocrSubmitted` or any new persistent key.
- Commit only at the phase boundary as `docs/Active.md` §1 directs.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 59 PASS / 0 FAIL.
Fixes: 3 confirmed-save log and queue-advance failures now keep the marker,
  show "Saved as #N but could not be logged. Do not retry.", and stop the run;
  4 saved log is re-read from storage and merged by id before appending, each
  entry's mode is kept, cap 200; 5 has-explanation blocks text in the
  Answer Explanation box; 6 subject/category/year are snapshotted when the
  batch tick is set, meta-changed blocks a later difference, resetConfirm
  clears the snapshot; 7 a heartbeat write failure sets the stop flag and
  releases the lock; nit out is declared before add.
Files: src/parser/parser.js, src/ui/ui.js, src/bookmarklet.js (rebuilt),
  tests/unit.js, docs/Auto-Save-Spec.md, docs/SPEC.md, docs/INVARIANTS.md,
  docs/plan/README.md, this file.
Build: one line / no % / body parses.
Docs: Auto-Save-Spec §3/§6/§9 corrected (stop not skip, POST to location.href,
  edit check location.pathname + ?edit=); SPEC §7.4 records both targets and
  the log merge/fault behavior; INV-62/65/66/67 refreshed for the new blockers,
  merge, and heartbeat failure.
Open questions: none for the §2 item. The review's section numbers came from
  the packet; SPEC §7.4 was confirmed as the right place, and SPEC §2 (Input
  format) was correctly left alone. Fixes 3 and 7 remain UI/DOM wiring; their
  fault decisions are unit-tested through commitSave and heartbeatTick, but
  there is still no browser harness for the click path.
```
