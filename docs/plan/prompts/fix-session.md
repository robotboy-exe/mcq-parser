# Fix Session — Accepted Review Findings Only

Argument: `$ARGUMENTS`

Resolve the latest review record for the named phase/package, or the explicitly
named finding IDs. The first response is read-only and waits for `go`.

Apply the coordinator's externalize-first and response contracts. Every Gate 1,
early-stop, and fix-handoff response must end with the exact terminal
`NEXT COMMAND:` line, with nothing after it.

## Frozen closure contract

Each accepted `BLOCK` or `FIX` has an immutable closure contract: exact defect,
supported operating preconditions, finite closure criteria, required evidence,
and explicit non-goals or deferred checks. Once the owner chooses `fix`, neither
the fix session nor re-review may broaden that contract. A newly noticed defect
requires a separate review ID and owner disposition.

For findings written before this rule, use only the concrete reproduced defect,
named vectors, requested fix, and required evidence in the accepted review and
fix request. Stop for owner clarification rather than inferring more from a broad
title.

## Gate 1

1. Read the review record, package, handoff, intent, coordinator, and active map.
2. Require stable finding IDs and extract each frozen closure contract. Stop if
   an ID, criterion, precondition, or deferred boundary is ambiguous.
3. Confirm the owner disposition is `fix`; an unresolved `BLOCK` alone does not
   authorize broadening its scope.
4. Restate a closure matrix mapping every finding ID to its exact criteria,
   planned production path, required evidence, and non-goals before offering
   `go`.
5. Retain the package's original base and cumulative line counters. Report every
   planned production file with baseline lines/bytes, current and expected
   additions, extraction boundary, responsibility, deployment path, and direct
   production-path test. Identify excluded artifacts separately.
6. If the cumulative fix would exceed a limit without prior approval, do not
   offer ordinary `go`; request explicit owner approval naming the exact file,
   measured excess, and justification.
7. State exact files, tests, behavior impact, and whether re-review is required.
8. Do not edit or commit.

End a passed Gate 1 with exactly:

```text
WAITING FOR GO. No files changed.
NEXT COMMAND: go
```

## After `go`

1. Fix only the accepted findings and their frozen closure criteria. Stop before
   changing adjacent behavior that has no separately accepted finding ID.
2. Add or strengthen evidence before changing behavior.
3. Keep cohesive behavior in focused production modules/includes and stay
   within the approved cumulative file limits.
4. Rerun package acceptance and the current baseline. Executable evidence must
   run the real production modules and paths, not copied SQL, control flow, or
   reimplemented behavior.
5. Append a fix note to the package handoff and keep `Commit: deferred`. Map
   every frozen closure criterion to the exact implementation and evidence, and
   report per production file additions/deletions from the original package base,
   final lines/bytes, responsibility, deployment inclusion, and direct
   production-path test evidence; list excluded artifacts separately.
6. Do not edit the review record, start another package, or commit.
7. Require re-review after a fixed `BLOCK` or behavior change. A rejected,
   risk-accepted, or deferred finding follows its recorded owner disposition
   instead. Re-review verifies the frozen matrix and regressions; it does not
   expand the accepted IDs.
8. End the fix handoff with the exact re-review command, or the exact safe next
   command dictated by the review record, as the terminal `NEXT COMMAND:` line.
