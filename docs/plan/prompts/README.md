# Plan Prompts

## Build sessions

Attach `phase-session.md` once and add `phase N`:

```text
phase 3
```

The first reply is read-only: it verifies the previous phase with probes, states
review and commit readiness, and waits for `go`. After `go`, it commits the
previous settled work first (using the approved catch-up plan when needed), then
executes only the current phase and stops after the handoff even if more phases
remain.

For current state, review checkpoints, and whether the next session is a build
or review, see `docs/plan/README.md`.

## Review sessions

Attach `review-session.md` and add the scope:

```text
review P12
```

Review sessions do not modify product files. They inspect code, tests,
fixtures, docs, and handoffs, run their own probes, return findings and a
verdict, and write one record per reviewed package under
`docs/plan/reviews/`. They never fix or commit. A `BLOCK` verdict prevents the
next phase; fix findings in a separate session, then request `re-review`.

## Fix sessions

If a review returns `BLOCK` or you reject a `FIX`, start a separate fix
session, then request `re-review`. If you accept a `FIX` and want it fixed,
the same fix session updates the handoff; no re-review is needed when behavior
is unchanged. A fix session re-runs the package acceptance and baseline tests,
updates the handoff, and stops without committing. If you accept findings
as-is, skip the fix and go to the next phase.

## Cycle close

After the final rigorous review settles, start a separate cycle-close session
and follow `docs/plan/README.md`. It commits the final phase and review
record(s), executes no package, and does not archive. Archive only after the
user confirms completion or asks to shelve the cycle.

## Commit boundary

Do not commit during a phase. At the start of the next phase, after the previous
phase's review settles, commit the previous phase's files before editing the
new phase. At cycle end, commit the final phase before archiving. Review
sessions never commit.

## Current cycle

The active map is [`phase-map.md`](phase-map.md). Review checkpoints are in
`docs/plan/README.md`. Shelve the old cycle only when the user confirms it is
complete or asks; then follow [`cycles/README.md`](cycles/README.md) and replace
`phase-map.md`. `phase-session.md` stays unchanged.
