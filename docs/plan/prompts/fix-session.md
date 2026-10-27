# Fix Session — Resolve Review Findings

Fix argument (supplied with this prompt; it may replace `$ARGUMENTS` or appear as
the text the user added alongside this attachment):

    $ARGUMENTS

This is a write session for one review record. It fixes the open findings in
that record; naming finding IDs narrows the scope. It is not a phase session: it
does not start the next phase and does not commit. The first reply is a
read-only Gate 1 and waits for an explicit `go`.

## 1. Resolve the scope

- `fix <review-record> [finding IDs...]` means that record, for example
  `fix docs/plan/reviews/post-as-2026-10-phase-3.md NOTE-2`.
- `fix phase N [finding IDs...]` means the latest review record for phase N of
  the active cycle.
- `fix <cycle-id> phase N [finding IDs...]` means that named cycle.
- `fix <package-id> [finding IDs...]` means that package's latest review record.
- `fix <review-record> all` means every open finding in that record, including
  NOTEs.
- `fix all` means every open finding in the latest review record of the active
  cycle, including NOTEs.
- If the argument is missing, unknown, or ambiguous, stop and ask.

Read `AGENTS.md`, `docs/AGENTS.md`, `docs/plan/README.md`, `INTENT.md`, the
phase map, the package file, the package handoff, and the review record.

The latest review record must exist. It must be `PASS WITH ACCEPTED FINDINGS`
with user decision `accept and fix`, or `BLOCK`/a rejected `FIX`. If it is
missing, the user has not accepted the findings, or the decision is `accept`
(commit as-is), stop and report it. If a sibling `-re-review.md` record exists
for the resolved record, it is authoritative; findings it does not explicitly
close still block. Treat the package handoff as a claim and check the current
files.

## 2. Findings in scope

- Read the record's Findings, Findings closed, and Next action required
  sections. A finding is open unless a later package fix note explicitly closes
  it.
- Default scope: every open finding in the record. `BLOCK` and `FIX` findings
  are mandatory repairs. A `NOTE` is limited to documentation, wording, or
  test-only changes; if it is a residual-risk acknowledgement or would require a
  behavior change, report it and skip it unless the user explicitly asks for
  that behavior change.
- If the user names IDs, only those findings are in scope.
- If the user names a closed finding, report it and skip it.
- If no open finding is in scope, report that and stop.
- If the record's findings lack stable IDs, stop and ask for a corrected record;
  do not invent IDs.
- If the verdict is `BLOCK` or the user chose `reject`, a separate `re-review`
  is mandatory after the fix. State that in the final report.
- Never edit the review record. The fix note and the handoff record what was
  repaired.

## 3. Gate 1 — read-only

1. Re-read each in-scope finding and the package acceptance and guardrails it
   touches.
2. Map each finding to the exact files and planned change.
3. Run the baseline commands:
   - `node tests/runner.js`
   - `node tests/unit.js`
   - `node tools/extract-bank.js --check` when parser, fixtures, extractor, or
     build output is involved.
4. Decide whether the fix is behavior-changing or docs/tests only. A behavior
   change requires `re-review`; docs/tests only do not.
5. State commit readiness. A fix session never commits; the next phase commits
   after the review settles.
6. Do not edit files in this gate. Reply with the scope, mapping, baseline,
   behavior-change decision, and stop.

End Gate 1 with exactly:

```text
WAITING FOR GO. No files changed.
```

## 4. Gate 2 — after `go`

- Fix only the in-scope findings. Do not refactor for style or repair unrelated
  NOTEs. Preserve every guardrail in `AGENTS.md` and `docs/AGENTS.md`.
- Add or update tests for the finding. Never weaken an assertion or regenerate
  fixtures from parser output.
- If a finding cannot be repaired without changing behavior, stop and ask.
- If source or UI changed: rebuild only `src/bookmarklet.js`; `wc -l` must print
  `1`, the body must parse, and it must contain no `%`. Do not rebuild
  `src/bookmarklet.min.js`; it is untracked and outside the workspace contract.
- Re-run the package acceptance commands and the baseline. Do not mark the fix
  complete on a partial pass.
- Append a fix note to the package handoff: date, result, findings addressed,
  files, relevant hashes, tests, behavior-change decision, review status, and
  `Commit: deferred to phase N+1 start`.
- Update the README status row, review checkpoint, and history snapshot only
  where the fix changes them. Do not rewrite unrelated rows.
- Do not commit. Do not start the next phase. Do not archive the cycle.
- Stop after the handoff.

## 5. Output

Reply with:

- Cycle:
- Phase/package:
- Review record:
- Findings addressed:
- Findings already closed/skipped:
- Behavior changed: yes/no
- Tests:
- Files:
- Re-review required: yes/no
- Commit: deferred
- Next action:

If a re-review is required, end with exactly:

```text
FIX COMPLETE. Handoff updated. Re-review required.
```

Otherwise end with exactly:

```text
FIX COMPLETE. Handoff updated. No commit.
```
