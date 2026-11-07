# Finding Disposition Session - Owner Decision

Argument: `$ARGUMENTS`

Resolve the named phase/package and finding IDs through the immutable review
records. This is a documentation-only owner-decision session. It does not review
again, change product code or tests, overwrite review evidence, start another
package, or commit.

Apply the coordinator's response contract. Every decision request, early stop,
and disposition handoff must end with the exact terminal `NEXT COMMAND:` line,
with nothing after it.

## Read-only decision gate

1. Read the intent, coordinator, active map, package, all review/re-review
   records, accepted fix handoffs, and any package lifecycle correction for the
   named findings.
2. State each immutable finding, its frozen closure contract, current evidence,
   supported preconditions, and residual risk without adding new review scope.
3. Identify whether the finding is unresolved, fixed but not re-reviewed, or
   awaiting owner disposition after re-review escalation.
4. Confirm the finding has gone through two review rounds without resolution. If
   it has not, owner disposition is premature: record no choice and name
   `fix-session.md` with the exact finding ID as the next action.
5. If the owner has not explicitly selected a disposition, present exactly these
   choices and stop without editing:
   - `fix`: authorize only the frozen closure criteria;
   - `reject`: require a rationale showing why the finding is incorrect or out
     of contract;
   - `accept risk`: require the exact accepted risk and operating boundary;
   - `defer`: require a named destination package and its acceptance gate;
   - `change requirement`: require the exact replacement requirement and every
     authoritative document it changes.
6. Never infer a disposition from `go`, silence, frustration, package
   acceptance, or approval of a different finding.

When a choice is still required, end with:

```text
WAITING FOR OWNER DISPOSITION. No files changed.
NEXT COMMAND: NONE - reply with fix, reject, accept risk, defer, or change requirement for the named finding IDs; defer must name its destination
```

## Record an explicit disposition

After the owner explicitly chooses and supplies every required rationale or
destination:

1. Append a dated disposition note to the package. Do not edit any review record.
2. Update the package header, coordinator, current status, active map,
   continuation checklist, root `AGENTS.md`, and root `README.md` with the exact
   finding IDs, choice, rationale, destination, and effect on commit/dependency
   readiness wherever those files summarize the affected state.
3. Preserve unresolved risk verbatim. `accept risk`, `defer`, and
   `change requirement` are owner decisions, not evidence that the original
   review was wrong.
4. A `fix` disposition does not close the finding. It authorizes one fix session
   against the frozen checklist and ends with that exact fix-session command.
5. A `reject` disposition closes the workflow issue only when its rationale
   identifies a factual or contract error in the finding.
6. An `accept risk` or `defer` disposition may unblock current work only when the
   owner explicitly says so and every other dependency is satisfied.
7. A `change requirement` disposition updates `INTENT.md` or package acceptance
   only when the owner's replacement wording is unambiguous; otherwise stop for
   clarification. It never establishes readiness by itself. Verify whether the
   current implementation and evidence already satisfy the replacement
   requirement; if not, keep the package not-ready and route the required work
   through a package/fix session and independent review.
8. Do not run tests for documentation-only disposition edits. Do not commit.

End with the exact next command dictated by the recorded disposition. Never
offer a dependent package when another unresolved blocker or external gate
remains.
