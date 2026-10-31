# Fix Session — Accepted Review Findings Only

Argument: `$ARGUMENTS`

Resolve the latest review record for the named phase/package, or the explicitly
named finding IDs. The first response is read-only and waits for `go`.

## Gate 1

1. Read the review record, package, handoff, intent, coordinator, and active map.
2. Require stable finding IDs. Stop if scope is ambiguous.
3. Confirm the user accepted the fixes or a `BLOCK` requires them.
4. State exact files, tests, behavior impact, and whether re-review is required.
5. Do not edit or commit.

## After `go`

1. Fix only the accepted findings.
2. Add or strengthen evidence before changing behavior.
3. Rerun package acceptance and the current baseline.
4. Append a fix note to the package handoff and keep `Commit: deferred`.
5. Do not edit the review record, start another package, or commit.
6. Require re-review after a `BLOCK`, rejected finding, or behavior change.
