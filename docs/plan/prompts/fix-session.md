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
and explicit non-goals or deferred checks. Once a fix is authorized, neither the
fix session nor re-review may broaden that contract. A newly noticed defect
requires a separate review ID; in its first and second review rounds it routes
to a fix session like any other finding.

For findings written before this rule, use only the concrete reproduced defect,
named vectors, requested fix, and required evidence in the accepted review and
fix request. Stop for owner clarification rather than inferring more from a broad
title.

## Gate 1

1. Read the review record, package, handoff, intent, coordinator, and active map.
   Confirm the VM is on the same `scratch/pcNN-*` package branch and exact
   reviewed candidate history, with the published review record pulled.
2. Require stable finding IDs and extract each frozen closure contract. Stop if
   an ID, criterion, precondition, or deferred boundary is ambiguous.
3. Confirm the fix authority: the accepted review or re-review record's
   recommended fix for a finding in its first or second review round, or a
   recorded `fix` disposition for a finding that survived three review rounds.
   Neither authorizes broadening the frozen closure contract.
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
8. Verify the evidence environment. List every tool, runtime, and service the
   required evidence needs (test runtimes, language interpreters, browsers,
   staging servers) and actually check each one now, by running a version
   command or a short start-and-stop probe, and report the output. A tool
   missing at session start is normal: provision it during Gate 1. Never assume
   a tool is unavailable or cannot be provisioned, and never predict that
   provisioning might fail. Report a tool as unavailable only after an actual
   provisioning attempt has failed, quoting the exact commands and errors; Gate
   1 has then not passed, so stop. Never plan to record required evidence as
   "not run".
9. List every planned change to an existing test, assertion, fixture, or
   expected output, with the acceptance row or rule it touches and why the
   closure criteria require it. Each one needs explicit owner approval.
10. List every planned change beyond the literal closure criteria: a new stored
    field or changed storage shape, a new user-facing behavior, control, or
    message, or a changed public interface. Each one needs explicit owner
    approval. If a closure criterion cannot be met without one, say so.
11. Do not edit or commit.

## Owner decisions

Collect every item from steps 6, 9, and 10 into a numbered `Owner decisions`
section at the end of Gate 1, as `D1`, `D2`, and so on. Write each decision for
a non-technical owner: one or two plain sentences on what will change, what
happens if approved, and what happens if declined. Give your recommendation.
Do not ask the owner to judge code.

End a passed Gate 1 with no owner decisions with exactly:

```text
WAITING FOR GO. No files changed.
NEXT COMMAND: go
```

End a passed Gate 1 with owner decisions with exactly (listing every decision):

```text
WAITING FOR GO AND OWNER DECISIONS. No files changed.
NEXT COMMAND: go, approve D1 D2
```

The owner may instead reply `go, approve D1, decline D2`. A declined item is not
implemented; if a finding cannot close without it, stop after Gate 1 and report
that the finding needs owner disposition.

## After `go`

1. Fix only the accepted findings and their frozen closure criteria, plus the
   owner decisions approved with `go`. Stop before changing adjacent behavior
   that has no separately accepted finding ID. If implementation reveals a new
   item of the kind Gate 1 steps 9 or 10 require approval for, stop and ask for
   it as a new numbered decision in the same plain-language form.
2. Reproduce before fixing. For every finding, first add or strengthen its
   regression evidence and run it against the unfixed code. Record the exact
   failing output in the fix handoff, per finding ID. The attempt must follow
   the review record's own reproduction steps and named vectors, not a weaker
   substitute. If a finding's evidence still cannot be made to fail on the
   unfixed code, do not fix that finding: stop work on it, report it as
   `NOT REPRODUCED` and continue only with the reproduced findings. For each
   `NOT REPRODUCED` finding, the handoff records the review's reproduction
   steps, the exact commands and vectors attempted, the observed output, and
   any difference in environment or preconditions from the review. The fix
   session never closes or rejects such a finding itself; it goes to owner
   disposition.
3. Keep cohesive behavior in focused production modules/includes and stay
   within the approved cumulative file limits.
4. Rerun package acceptance and the current baseline. Executable evidence must
   run the real production modules and paths, not copied SQL, control flow, or
   reimplemented behavior.
5. Update the package header, coordinator, current status, active map, and
   continuation checklist with the accepted finding and its status. Append a fix
   note to the package handoff and keep `Commit: deferred`. Map every frozen
   closure criterion to the exact implementation and evidence, and report per
   production file additions/deletions from the original package base, final
   lines/bytes, responsibility, deployment inclusion, and direct
   production-path test evidence; list excluded artifacts separately.
6. Do not edit the review record, start another package, or commit.
7. Require re-review after a fixed `BLOCK` or behavior change. A rejected,
   risk-accepted, or deferred finding follows its recorded owner disposition
   instead. Re-review verifies the frozen matrix and regressions; it does not
   expand the accepted IDs.
8. End the fix handoff with the exact re-review command, or the exact safe next
   command dictated by the review record, as the terminal `NEXT COMMAND:` line.
   If any finding is `NOT REPRODUCED`, the terminal line is instead
   `finding-disposition.md` with the phase and every `NOT REPRODUCED` ID; state
   the pending re-review command for the fixed findings in the handoff body.
9. A fix commit/push requires a separate explicit owner request and targets only
   the same package branch. Never merge it into the scratch cycle line before
   re-review settles.
