# Plan Session Protocols

The active cycle is defined in [`phase-map.md`](phase-map.md); the current one
is `parser-convergence-2026-11`. Archived maps live under
[`cycles/`](cycles/README.md). Package state,
external gates, review checkpoints, and the next action are maintained in
[`../README.md`](../README.md).

## Build session

Use [`phase-session.md`](phase-session.md) with `phase N` or a package ID. The
first response is read-only, includes `WAITING FOR GO`, and ends with
`NEXT COMMAND: go` when the gate passes. After an explicit `go`, execute only
that package and stop after its handoff.

## Proposed stimulus-first successor

Use [stimulus-convergence-scratch.md](stimulus-convergence-scratch.md) to
preflight the pinned working stimulus bookmarklet and the proposed
[PC07](../parser-convergence/pc-07-stimulus-first.md) cycle amendment. The
draft does not change the active phase map. If approved, PC07 uses the existing
phase, independent review, and fix gates; the full exact candidate and all
carried PC04 findings need independent evidence before merge.

## Review session

Use [`review-session.md`](review-session.md) with `review phase N`, a package ID,
or an approved range. A review changes only its review record and never fixes or
commits product work. Original reviews are exploratory; re-reviews verify frozen
finding closure criteria and regressions. A new defect receives a new ID rather
than broadening an accepted finding.

## Fix session

Use [`fix-session.md`](fix-session.md) with a review record or finding IDs. It
repairs only accepted findings, reruns package acceptance, updates the handoff,
and stops without committing. Gate 1 restates the finite closure matrix and
waits for `go`; implementation and re-review may not expand it.

## Finding disposition

Use [`finding-disposition.md`](finding-disposition.md) with a phase/package and
exact finding IDs. It records an explicit owner decision without editing review
evidence or product files.

The owner explicitly chooses `fix`, `reject` with rationale, `accept risk`,
`defer` to a named package, or `change requirement`. A finding escalates to
owner disposition only after three review rounds without resolution: it was
recorded in round 1, remained open (or needed another fix) in round 2 after fix
round 1, and is still open (or needs another fix) in round 3 after fix round 2.
A finding in its first or second review round routes directly to a fix session
instead. The one exception is a finding the fix session reports as
`NOT REPRODUCED`: it goes straight to owner disposition. This does not force a
pass or hide unresolved risk.

## Cycle close

Use [`cycle-close.md`](cycle-close.md) only after the active cycle's final
package and rigorous cycle-wide review are settled. Cycle close may commit only
with explicit user approval and does not archive the cycle automatically.

## Response terminator

Every gate, early stop, handoff, review, fix, and cycle-close response must end
with exactly one final line:

```text
NEXT COMMAND: <exact copy-paste command>
```

Write nothing after it. Supply an exact command, not a description or
placeholder. Use `NEXT COMMAND: NONE - <reason>` only when no safe command
exists. This output rule does not authorize the command or bypass its gate.

## Commit rule

No protocol authorizes a commit by itself. A commit occurs only after the user
explicitly requests it. Never amend, rebase, force-push, or bundle unrelated
worktree changes.
