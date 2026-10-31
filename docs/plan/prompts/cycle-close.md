# Cycle Close — owner-tool-2026-11

Cycle close runs only after OT10 is done and its rigorous review is settled. It
executes no package and does not archive the cycle automatically.

## Gate 1 — read-only

1. Read the coordinator, active map, OT10 package/handoff, and all OT10 review
   records.
2. Require OT10 status `done` and a settled `PASS` or accepted findings.
3. Verify the handoff, baseline, deployment manifest, migration/rollback
   evidence, local PHP results, and required browser/staging checks.
4. Identify unrelated worktree files and secrets. Never bundle them.
5. State the exact proposed commit scope. Do not stage or commit.

End with `WAITING FOR GO. No files changed.`

## After explicit `go`

- Update only final status, review checkpoint, handoff, and history fields.
- Commit only if the user explicitly authorized it and only the approved scope.
- Do not amend, rebase, force-push, or create an empty commit.
- Leave the cycle active after commit. Archive it only after a separate explicit
  owner decision.
