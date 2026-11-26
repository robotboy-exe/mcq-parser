# Review Session — Independent Evidence Check

Argument: `$ARGUMENTS`

Review completed work independently. Do not fix findings, edit product files,
update package status, or commit. The only file this session may write is its
review record under `docs/plan/reviews/`.

For the VM workflow, the review record remains uncommitted at session end. A
later explicit owner request may publish only that record to the package branch;
the review command itself never commits or pushes.

Apply the coordinator's externalize-first and response contracts. Every review
or early-stop response must end with the exact terminal `NEXT COMMAND:` line,
with nothing after it.

## Scope

- Resolve `review phase N`, a package ID, or an explicitly approved phase range
  through the active map.
- Review a clean dedicated worktree at the exact pushed `scratch/pcNN-*`
  candidate ref named by the package handoff. Do not create, switch, merge,
  pull, or move branches in a review session. Never review an unpushed VM
  working tree by description.
- Read the intent, coordinator, package, handoff, implementation, tests, and
  prior review records.
- Stop if the package is not done or the target record already exists without
  an explicit re-review request.

## Review modes and frozen scope

- An original review is exploratory across the complete package acceptance and
  production boundary.
- Every `BLOCK` and `FIX` must define a finite closure contract: exact defect,
  supported operating preconditions, closure criteria, required evidence, and
  explicit non-goals or deferred checks. Broad requirement prose alone is not a
  finite closure criterion.
- A re-review is closure-focused. Resolve the named findings and extract their
  frozen closure contracts from the accepted review and fix Gate 1/handoff.
  Stop for owner clarification if any contract is missing or ambiguous.
- Once the owner authorizes a fix, only the owner may broaden its closure
  contract or change the requirement. A re-review never broadens or repurposes
  an existing finding ID.
- For records created before this rule, freeze the concrete reproduced defect,
  named vectors, requested fix, and required evidence in the accepted review and
  fix Gate 1. Do not infer additional dimensions from a broad finding title.

## Evidence

1. Treat the handoff as an untrusted claim.
2. Run the baseline and every package acceptance probe.
3. Inspect implementation paths, not only test names.
4. Confirm fixture provenance and manually transcribed expectations.
5. Check documentation, package guardrails, storage/server contracts, and
   deployment claims for consistency.
6. For an original review, add at least one adversarial probe near a package
   boundary not already asserted. For a re-review, add at least one adversarial
   probe derived from the frozen closure criteria and aimed at the claimed fix.
   Do not search unrelated dimensions merely to satisfy this requirement.
7. Identify unrelated worktree changes rather than attributing them to scope.
8. Establish the package base independently. Reproduce `git diff --numstat`
   additions/deletions for every production file and verify baseline/final
   lines and bytes. Check new-module readable line counts and compare every
   exception with the exact Gate 1 owner approval.
9. Verify that each module has one responsibility, its deployment path includes
   it, and entry points contain only allowed narrow wiring and unavoidable local
   transaction hooks.
10. Execute or inspect the direct production-path tests. Copied SQL, control
    flow, or reimplemented behavior does not prove the production path. Identify
    excluded supplied snapshots, archives, and generated artifacts separately.
11. Any claim of completeness ("all ported", "none dropped", "every vector
    covered", "no other consumer") must include its enumeration in the record:
    the list or command output and the item-by-item mapping it rests on. A
    completeness claim without its enumeration is reported as unverified, not
    as PASS. This applies to the reviewer's own claims as well as the
    handoff's.

## Independent Adversarial Investigation

Before reaching a verdict, reconstruct the relevant production behavior across component boundaries.

1. Identify the important state variables, their sources of truth, initialization paths, mutation points, persistence boundaries, and consumers.
2. Trace complete supported workflows across entry points, modules, browser state, asynchronous operations, and server interactions. Do not treat individual functions as isolated units.
3. Identify operations that can overlap, repeat, fail, be interrupted, or execute against stale state. Examine their ordering and resulting state.
4. Construct adversarial scenarios from interactions between independently implemented behaviors. Prioritize scenarios where two individually valid operations can produce an invalid combined result.
5. Build a scenario matrix from the package itself and record it. List the user actions the package supports, including repeated or re-entered activation, and the states each can occur in: idle, mid-operation (a request, save, or other asynchronous step still pending), after a failure, and with state left behind by another component, product, or earlier session. Exercise each action in every state where the combination is reachable on a supported path, or record why it is unreachable. For shared or persisted state, test values that are well-formed and plausible but belong to a different context (an earlier batch, another product, another user flow), not only malformed or obviously invalid values. Mark each cell executed, inspected only, or unverified. In a re-review, limit the matrix to the actions and states touched by the frozen closure criteria and the fix.
6. Where browser behavior is relevant and browser tooling is available, exercise the real production path in a disposable environment. Observe actual state, DOM changes, network requests, and resulting server effects. A mocked or reimplemented path is not equivalent evidence.
7. Compare observed behavior against the package contract, not merely against existing tests or implementation intent.
8. Before issuing PASS, explicitly identify the highest-risk supported interactions examined, the scenarios actually executed, and material scenarios that remain unverified.

Do not manufacture findings to demonstrate effort. Distinguish reproducible defects from plausible risks and missing evidence. Do not claim a scenario was tested unless it was actually executed or directly verified.

## Findings

- `BLOCK-N`: unmet acceptance, material regression, guardrail breach, or unsafe
  behavior on a supported path under documented operating preconditions. An
  unapproved line-limit breach, monolithic production addition, or copied-path
  test claim is always a `BLOCK`. A scenario requiring violation of a mandatory
  precondition is normally a `FIX` or `NOTE` unless protection after violation
  is promised or the precondition cannot realistically be enforced. Verdict
  `BLOCK`; not commit-ready.
- `FIX-N`: real defect or missing evidence with core behavior present. Verdict
  `PASS WITH ACCEPTED FINDINGS`; it routes to a fix session in its first and
  second review rounds and escalates to owner disposition only under the
  three-round rule below.
- `NOTE-N`: documentation issue or residual risk that does not invalidate the
  package.

Severity justification: every `FIX` and `NOTE` must quote the exact package,
intent, or guardrail text it touches (file and line) and state in one or two
sentences why it does not meet the `BLOCK` definition above. A finding that
contradicts an explicit acceptance row, scope requirement, or guardrail on a
supported path is a `BLOCK`; if the reviewer cannot point to the precondition
or exception that lowers it, it stays a `BLOCK`. Every `BLOCK` quotes the text
it violates in the same way.

Write `docs/plan/reviews/parser-convergence-2026-11-phase-N.md`. The first re-review uses
`-re-review.md`; later records use `-re-review-2.md`, `-re-review-3.md`, and so
on. A re-review explicitly disposes every requested prior finding and never
overwrites an earlier record.

The record must include date, scope, commands, acceptance coverage, numbered
findings with file/line evidence, verdict, commit readiness, review status, and
the exact recommended next action. It must also include the independently
verified per-file measurements, responsibilities, deployment inclusion,
production-path test evidence, approvals, and excluded-artifact list.

## Re-review disposition

- Close a named finding when every frozen closure criterion passes, even if the
  re-review separately discovers a different issue.
- A different defect receives the next unused finding ID in its severity
  namespace across all package review records and its own finite closure
  contract. Never keep a prior ID open by substituting a new vector.
- During re-review, a new `BLOCK` is permitted only for a directly unmet package
  acceptance requirement, a material regression introduced by the fix, or a
  reproducible security/data-loss defect on a supported path. Other new concerns
  are `FIX`, `NOTE`, or explicitly deferred evidence.
- A finding reaches owner disposition only after **three review rounds**
  without resolution: the review that recorded it left it open (round 1), the
  re-review after fix round 1 still left it open or recommended another fix
  (round 2), and the re-review after fix round 2 still leaves it open or
  recommends another fix (round 3). The exact next action is then owner
  disposition: `fix`, `reject`, `accept risk`, `defer` to a named package, or
  `change requirement`. Hand off to `finding-disposition.md` with the exact
  phase/package and finding IDs.
- A first- or second-round finding never escalates (unless reported
  `NOT REPRODUCED`). Whether the original review or a re-review recorded it, in
  its first or second review round the exact next action is `fix-session.md`
  with its exact ID and frozen closure contract.
- Exception: a finding the fix session reported as `NOT REPRODUCED` goes to
  owner disposition immediately without waiting for three review rounds. A
  re-review does not treat it as fixed or open; it follows the recorded owner
  disposition. If no disposition is recorded yet, the re-review stops and names
  `finding-disposition.md` with the exact `NOT REPRODUCED` IDs.
- Owner disposition never edits immutable review evidence. It is recorded in
  the package and coordinator before dependent work or commit readiness changes.
- These rules do not force a pass. A genuinely unresolved blocker remains
  visible until it is fixed and settled by re-review, or the owner records a
  disposition after three review rounds.

The final review response must use that recommended action as an exact
copy-paste `NEXT COMMAND:`. A `BLOCK` or `FIX` in its first or second review
round names `fix-session.md` with every exact finding ID; only a finding that
has survived three review rounds (two fix rounds and their re-reviews, or was
reported `NOT REPRODUCED`) names the disposition-session prompt. Never offer a
dependent package while an unresolved blocker remains.
