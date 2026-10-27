# Review Session — Independent Evidence Check

Review argument (supplied with this prompt; it may replace `$ARGUMENTS` or
appear as the text the user added alongside this attachment):

    $ARGUMENTS

This is an independent review. Do not modify source, tests, fixtures, build
output, package status, or the phase map. Do not commit or fix findings. A
separate fix session handles findings; then the user requests a re-review. The
only file you write is the review record in `docs/plan/reviews/`. The review
exists to test the work, not to trust the handoff.

## 1. Resolve the scope

- `review phase N` means phase N of the active cycle in
  `docs/plan/prompts/phase-map.md`.
- `review P12`, `review AS-10`, and similar IDs mean that package in the active
  map.
- `review phases N-M` means that inclusive phase range.
- `review cycle` means every done phase in the active cycle whose checkpoint
  requires a rigorous review and that has not been independently reviewed.
- `re-review ...` is allowed only when the user explicitly asks for a second
  review after a fix.
- If the argument is missing, unknown, or ambiguous, stop and ask.

Read `AGENTS.md`, `docs/AGENTS.md`, `docs/plan/README.md`, `INTENT.md`, the map,
the package file, the README status row, and the handoff note. If a package is
not done, stop and report it; review only completed work. If it is already
independently reviewed, report that and stop unless the user asked for a
re-review. If the target review record already exists and this is not an
explicit re-review, stop and ask.

## 2. Verify, do not trust

For every package in scope:

1. Re-read the package's acceptance table, guardrails, and the `INTENT.md`
   sections it implements.
2. Treat the handoff as a claim. Verify its file list, test counts, build
   claims, docs IDs, and open questions.
3. Run the baseline commands yourself:
   - `node tests/runner.js`
   - `node tests/unit.js`
   - `node tools/extract-bank.js --check` when the package touches parser,
     fixtures, the bank extractor, or build output.
4. Re-run the package's acceptance probes directly. Do not accept a test name or
   handoff sentence as evidence that the acceptance item was checked.
5. Inspect the implementation, not only the tests. For parser/UI/storage work,
   read the relevant function and trace the acceptance cases through it.
6. Check that tests assert behavior and are not snapshots generated from parser
   output. Check fixtures for `input_origin`, source, status, and expected
   values transcribed from the cited source.
7. Check docs consistency: decision numbers, SPEC rules, invariants, edge cases,
   README status, and package wording must agree with the implementation.
8. Check guardrails: no forbidden changes to `splitQuestions`, `splitSections`,
   storage keys, the server contract, or the minified build.
9. Add at least one adversarial probe that is not already in the tests. Choose
   a nearby boundary or regression case, not the happy path.
10. If the handoff records a deviation, decide explicitly whether the package
    and docs were reconciled. A deviation is a finding until accepted.

Because phases share one uncommitted worktree until the next phase starts, use
the handoff file list and `git diff -- <files>` to inspect the cited files. The
README catch-up plan names expected co-resident files; treat those as out of
scope, not as package changes. If the worktree contains other unrelated changes,
say so rather than attributing them to the package.

## 3. Findings and verdict

Report findings with severity:

- `BLOCK` — unmet acceptance, guardrail breach, material test gap, or behavior
  that conflicts with `INTENT.md`. Not commit-ready.
- `FIX` — real defect or missing evidence that should be repaired before the
  next phase, but the package's core behavior is present.
- `NOTE` — documentation, wording, or residual risk that does not invalidate
  the package.

Use one verdict:

- `PASS` — no BLOCK or FIX findings; acceptance is covered by evidence.
- `PASS WITH ACCEPTED FINDINGS` — no BLOCK; FIX findings are listed. The user
  chooses `accept` (commit as-is), `accept and fix` (fix first, then commit; no
  re-review if behavior is unchanged), or `reject` (fix and re-review).
- `BLOCK` — at least one BLOCK finding; fix and re-review; do not commit.

State `Commit readiness: yes`, `Commit readiness: after user accepts findings`,
or `Commit readiness: no`.

Suggested review status for the handoff:
`independent-pass`, `independent-pass-with-accepted-findings`,
`independent-blocked`, or `re-review-pass`.

For `PASS WITH ACCEPTED FINDINGS`, make the next action explicit: name the
recommended choice and the exact next session/command. Do not leave the user to
infer whether “accepted” means commit as-is or fix first.

## 4. Write the review record

Write one file per reviewed package:

```text
docs/plan/reviews/<cycle-id>-phase-<N>.md
```

For a re-review, use `<cycle-id>-phase-<N>-re-review.md`. Do not overwrite an
existing record. A re-review is authoritative for the current verdict; list
which earlier findings it explicitly closes, because anything it does not close
still blocks. A range or `review cycle` writes one record per phase. Include:

```markdown
# Review — <cycle-id> phase <N> (<package-id>)

Date:
Reviewer: independent review session
Verdict:
Commit readiness:
Review status:
Scope:
Evidence:
Acceptance coverage:
Findings:
Findings closed (re-review only):
Recommended next action:
Next action required:
- User decision: pending | accept | accept and fix | reject
- Recommended: accept | accept and fix | reject and fix
- After decision: <exact command or session>
```

Keep the record concise but reproducible: commands, observed results, and
`file:line` for findings. Do not edit the package or README.

## 5. Output

Reply with:

- Cycle:
- Scope:
- Packages reviewed:
- Commands and evidence:
- Findings (BLOCK/FIX/NOTE, with file:line and reproduction):
- Acceptance coverage:
- Verdict:
- Commit readiness:
- Review status:
- Review record: `<path or paths>`
- Recommended next action:
- Next action required:
- Product files changed: none

End with exactly:

```text
REVIEW COMPLETE. Review record written.
```
