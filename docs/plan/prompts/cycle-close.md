# Cycle Close — owner-tool-2026-11

Cycle close runs only after OT10 is done and its rigorous review is settled. It
executes no package and does not archive the cycle automatically.

Apply the coordinator's externalize-first and response contracts. Every
cycle-close Gate 1, early-stop, and final response must end with the exact
terminal `NEXT COMMAND:` line, with nothing after it.

## Gate 1 — read-only

1. Read the coordinator, active map, every package/handoff, every review and
   re-review record, and every recorded owner disposition, including OT10.
2. Require OT10 status `done` and a settled `PASS` or findings with explicit
   recorded lifecycle dispositions.
3. Verify the handoff, baseline, deployment manifest, migration/rollback
   evidence, local PHP results, and required browser/staging checks.
4. Verify that every package and fix has settled externalize-first measurements,
   approvals, deployment inclusion, and direct production-path evidence.
5. Verify every `BLOCK` and required `FIX` cycle-wide. A fixed finding must pass
   its frozen closure re-review; any other disposition must name the exact ID,
   rationale, destination or accepted boundary, and readiness effect in the
   package and coordinator. Stop for every unresolved or undispositioned finding.
6. Confirm that every changed requirement is implemented and independently
   verified, or remains explicitly not-ready. A documentation-only requirement
   change never proves acceptance.
7. Identify unrelated worktree files and secrets. Never bundle them.
8. State the exact proposed commit scope. Do not stage or commit.

End a passed Gate 1 with exactly:

```text
WAITING FOR GO. No files changed.
NEXT COMMAND: go
```

An early stop follows the response contract and does not offer `go`.

## After explicit `go`

- Update only final status, review checkpoint, handoff, and history fields.
- Commit only if the user explicitly authorized it and only the approved scope.
- Do not amend, rebase, force-push, or create an empty commit.
- Leave the cycle active after commit. Archive it only after a separate explicit
  owner decision.
- End with the exact safe owner-decision or archive command as the terminal
  `NEXT COMMAND:` line. Use `NEXT COMMAND: NONE - <reason>` only when no safe
  command exists.
