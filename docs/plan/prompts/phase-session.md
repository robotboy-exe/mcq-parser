# Phase Session — One Package Per Session

Argument: `$ARGUMENTS`

This protocol executes one package from the active map. It never silently
continues into the next package.

Apply the coordinator's externalize-first and response contracts. Every Gate 1,
early-stop, and handoff response must use the exact terminal `NEXT COMMAND:`
line, with nothing after it.

## Gate 1 — read-only

1. Resolve `phase N` or the package ID through `phase-map.md`.
2. Read `AGENTS.md`, `docs/AGENTS.md`, `INTENT.md`, `docs/STATUS.md`,
   `docs/plan/README.md`, the active map, and the package file.
3. Confirm the coordinator and package statuses agree.
4. Stop if the package is done, blocked, ambiguous, or already in progress.
5. Verify every dependency from its status row, handoff, actual files, and
   three to five acceptance probes. Never trust a handoff without evidence.
6. Check required review records and ensure no unresolved `BLOCK` or
   undispositioned required finding remains. Treat a finding as
   owner-dispositioned only when the package and coordinator name its exact ID,
   disposition, rationale, and any deferred destination; never infer acceptance
   from `go` or silence.
7. Inspect the worktrees and identify unrelated changes. Never modify or clean
   the retired dirty experiments worktree.
8. Confirm the worktree is on `owner-tool-integration`, the authoritative work
   branch. Do not create a branch unless the package explicitly requires
   isolation; `main` is only for reviewed releases.
9. Run the package's baseline commands. Before OT00 establishes the integration
   baseline, run only commands that exist on the current line and report both
   lines separately.
10. Record the exact package base. Report every planned production file with
    baseline lines/bytes, expected additions, extraction boundary,
    responsibility, deployment path, and direct production-path test. Identify
    excluded snapshots, archives, and generated artifacts separately. If a
    limit would be exceeded, do not offer ordinary `go`; request explicit owner
    approval naming the exact file, measured excess, and justification.
11. State commit readiness, but do not stage or commit. A commit requires an
    explicit user request separate from this protocol.
12. State scope, non-goals, acceptance, external gates, live actions, and stop
    conditions.

End a passed Gate 1 with exactly:

```text
WAITING FOR GO. No files changed.
NEXT COMMAND: go
```

An early stop or unresolved exception uses the response contract instead of
offering `go`.

## Gate 2 — after explicit `go`

1. Stop unless Gate 1 completed in this session and the user explicitly said
   `go` afterward.
2. Execute only the resolved package. Do not begin the next package.
3. Preserve unrelated worktree changes and every package guardrail.
4. Add failing evidence before behavior changes when the package requires it.
5. Keep production changes within the approved externalize-first plan. Put
   cohesive behavior in focused modules/includes and keep entry points to
   includes/imports, dispatch, narrow wiring, and unavoidable local transaction
   hooks.
6. Run every acceptance command and map each acceptance row to a test, probe,
   or explicitly recorded gap. A test claim is executable evidence only when it
   runs the real production module and path; copied SQL, control flow, or
   behavior does not qualify.
7. If package wording must change, stop and ask before implementing the
   deviation.
8. Do not substitute a local claim for a required PHP, browser, staging, or
   production check.
9. Update the coordinator status and active map only after acceptance passes.
10. Append the package handoff with date, result, exact files, tests, hashes,
    open questions, review status, and `Commit: deferred`. For every production
    file report additions/deletions from the package base, final lines/bytes,
    responsibility, deployment inclusion, and production-path test evidence;
    list excluded artifacts separately.
11. Do not commit unless the user explicitly requests a commit.

End with `STOPPED`, name the next action without starting it, and make the final
line its exact copy-paste command under the response contract.
