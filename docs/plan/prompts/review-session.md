# Review Session — Independent Evidence Check

Argument: `$ARGUMENTS`

Review completed work independently. Do not fix findings, edit product files,
update package status, or commit. The only file this session may write is its
review record under `docs/plan/reviews/`.

## Scope

- Resolve `review phase N`, a package ID, or an explicitly approved phase range
  through the active map.
- Read the intent, coordinator, package, handoff, implementation, tests, and
  prior review records.
- Stop if the package is not done or the target record already exists without
  an explicit re-review request.

## Evidence

1. Treat the handoff as an untrusted claim.
2. Run the baseline and every package acceptance probe.
3. Inspect implementation paths, not only test names.
4. Confirm fixture provenance and manually transcribed expectations.
5. Check documentation, package guardrails, storage/server contracts, and
   deployment claims for consistency.
6. Add at least one adversarial probe near a boundary not already asserted.
7. Identify unrelated worktree changes rather than attributing them to scope.

## Findings

- `BLOCK-N`: unmet acceptance, material regression, guardrail breach, or unsafe
  behavior. Verdict `BLOCK`; not commit-ready.
- `FIX-N`: real defect or missing evidence with core behavior present. Verdict
  `PASS WITH ACCEPTED FINDINGS`; user decides accept, accept-and-fix, or reject.
- `NOTE-N`: documentation issue or residual risk that does not invalidate the
  package.

Write `docs/plan/reviews/owner-tool-2026-11-phase-N.md`. A re-review uses
`-re-review.md`, explicitly closes prior finding IDs, and never overwrites the
original record.

The record must include date, scope, commands, acceptance coverage, numbered
findings with file/line evidence, verdict, commit readiness, review status, and
the exact recommended next action.
