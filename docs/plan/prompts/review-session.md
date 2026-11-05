# Review Session — Independent Evidence Check

Argument: `$ARGUMENTS`

Review completed work independently. Do not fix findings, edit product files,
update package status, or commit. The only file this session may write is its
review record under `docs/plan/reviews/`.

Apply the coordinator's externalize-first and response contracts. Every review
or early-stop response must end with the exact terminal `NEXT COMMAND:` line,
with nothing after it.

## Scope

- Resolve `review phase N`, a package ID, or an explicitly approved phase range
  through the active map.
- Review the read-only `owner-tool-integration` worktree. Do not create, switch,
  merge, or move branches in a review session.
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

## Findings

- `BLOCK-N`: unmet acceptance, material regression, guardrail breach, or unsafe
  behavior on a supported path under documented operating preconditions. An
  unapproved line-limit breach, monolithic production addition, or copied-path
  test claim is always a `BLOCK`. A scenario requiring violation of a mandatory
  precondition is normally a `FIX` or `NOTE` unless protection after violation
  is promised or the precondition cannot realistically be enforced. Verdict
  `BLOCK`; not commit-ready.
- `FIX-N`: real defect or missing evidence with core behavior present. Verdict
  `PASS WITH ACCEPTED FINDINGS`; the owner records a lifecycle disposition.
- `NOTE-N`: documentation issue or residual risk that does not invalidate the
  package.

Write `docs/plan/reviews/owner-tool-2026-11-phase-N.md`. The first re-review uses
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
- If a re-review discovers a new `BLOCK`, or a second or later re-review would
  recommend another fix session, the exact next action is owner disposition:
  `fix`, `reject`, `accept risk`, `defer` to a named package, or
  `change requirement`. Hand off to `finding-disposition.md` with the exact
  phase/package and finding IDs; do not automatically prescribe another fix
  session.
- Owner disposition never edits immutable review evidence. It is recorded in
  the package and coordinator before dependent work or commit readiness changes.
- These rules do not force a pass. A genuinely unresolved blocker remains
  visible until the owner records a disposition.

The final review response must use that recommended action as an exact
copy-paste `NEXT COMMAND:`. Every `BLOCK` or `FIX` requiring an owner choice names
the disposition-session prompt with every exact finding ID. Only a recorded
`fix` disposition may lead to `fix-session.md`; a review recommendation alone is
not that disposition. Never offer a dependent package while an unresolved
blocker remains.
