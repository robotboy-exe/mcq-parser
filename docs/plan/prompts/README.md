# Plan Session Protocols

The active cycle is defined in [`phase-map.md`](phase-map.md). Package state,
external gates, review checkpoints, and the next action are maintained in
[`../README.md`](../README.md).

## Build session

Use [`phase-session.md`](phase-session.md) with `phase N` or a package ID. The
first response is read-only and ends with `WAITING FOR GO`. After an explicit
`go`, execute only that package and stop after its handoff.

## Review session

Use [`review-session.md`](review-session.md) with `review phase N`, a package ID,
or an approved range. A review changes only its review record and never fixes or
commits product work.

## Fix session

Use [`fix-session.md`](fix-session.md) with a review record or finding IDs. It
repairs only accepted findings, reruns package acceptance, updates the handoff,
and stops without committing.

## Cycle close

Use [`cycle-close.md`](cycle-close.md) only after OT10 is done and its rigorous
review is settled. Cycle close may commit only with explicit user approval and
does not archive the cycle automatically.

## Commit rule

No protocol authorizes a commit by itself. A commit occurs only after the user
explicitly requests it. Never amend, rebase, force-push, or bundle unrelated
worktree changes.
