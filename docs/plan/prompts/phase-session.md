# Phase Session — One Package Per Session

Argument: `$ARGUMENTS`

This protocol executes one package from the active map. It never silently
continues into the next package.

## Gate 1 — read-only

1. Resolve `phase N` or the package ID through `phase-map.md`.
2. Read `AGENTS.md`, `docs/AGENTS.md`, `INTENT.md`, `docs/STATUS.md`,
   `docs/plan/README.md`, the active map, and the package file.
3. Confirm the coordinator and package statuses agree.
4. Stop if the package is done, blocked, ambiguous, or already in progress.
5. Verify every dependency from its status row, handoff, actual files, and
   three to five acceptance probes. Never trust a handoff without evidence.
6. Check required review records and ensure no unresolved `BLOCK` or rejected
   finding remains.
7. Inspect both worktrees and identify unrelated changes. Never modify or clean
   the dirty experiments worktree.
8. Run the package's baseline commands. Before OT00 establishes the integration
   baseline, run only commands that exist on the current line and report both
   lines separately.
9. State commit readiness, but do not stage or commit. A commit requires an
   explicit user request separate from this protocol.
10. State scope, non-goals, acceptance, external gates, live actions, and stop
    conditions.

End Gate 1 with exactly:

```text
WAITING FOR GO. No files changed.
```

## Gate 2 — after explicit `go`

1. Stop unless Gate 1 completed in this session and the user explicitly said
   `go` afterward.
2. Execute only the resolved package. Do not begin the next package.
3. Preserve unrelated worktree changes and every package guardrail.
4. Add failing evidence before behavior changes when the package requires it.
5. Run every acceptance command and map each acceptance row to a test, probe,
   or explicitly recorded gap.
6. If package wording must change, stop and ask before implementing the
   deviation.
7. Do not substitute a local claim for a required PHP, browser, staging, or
   production check.
8. Update the coordinator status and active map only after acceptance passes.
9. Append the package handoff with date, result, exact files, tests, hashes,
   open questions, review status, and `Commit: deferred`.
10. Do not commit unless the user explicitly requests a commit.

End with `STOPPED` and name the next phase without starting it.
