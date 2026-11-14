# Plan Session Protocols

The active cycle is defined in [`phase-map.md`](phase-map.md); the current one
is `math-editor-2026-11`. Archived maps live under
[`cycles/`](cycles/README.md). Package state,
external gates, review checkpoints, and the next action are maintained in
[`../README.md`](../README.md).

## Build session

Use [`phase-session.md`](phase-session.md) with `phase N` or a package ID. The
first response is read-only, includes `WAITING FOR GO`, and ends with
`NEXT COMMAND: go` when the gate passes. After an explicit `go`, execute only
that package and stop after its handoff.

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
owner disposition only after two review rounds without resolution: it is still
open, or needs another fix, at the review round after the one that recorded it.
A first-round finding routes directly to a fix session instead. This does not
force a pass or hide unresolved risk.

## Cycle close

Use [`cycle-close.md`](cycle-close.md) only after OT10 is done and its rigorous
review is settled. Cycle close may commit only with explicit user approval and
does not archive the cycle automatically.

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
