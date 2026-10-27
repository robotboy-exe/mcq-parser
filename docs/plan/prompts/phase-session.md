# Phase Session — One Package Per Chat

Phase argument (supplied with this prompt; it may replace `$ARGUMENTS` or
appear as the text the user added alongside this attachment):

    $ARGUMENTS

The attached file is this prompt template, not the package plan. Resolve the
package yourself; do not ask the user to attach it.

This chat is for one phase only. The first reply is a read-only scope,
dependency, and commit-readiness check. Do not edit or commit until the user
sends an explicit `go`. If the phase message also says `go`, still complete
Gate 1 first and wait for a separate `go` before writing.

## Gate 1 — read-only

1. Resolve the phase:
   - `phase N` or `N` means phase N of the active cycle in
     `docs/plan/prompts/phase-map.md`.
   - A package ID such as `P12` or `AS-10` means that package in the active map.
   - `cycle <id> phase N` means phase N of
     `docs/plan/prompts/cycles/<id>.md`.
   - If the argument is missing, unknown, or ambiguous, stop and ask.
2. Resolve the package file from the map. If it does not exist, stop and ask.
3. Read `AGENTS.md`, `docs/AGENTS.md`, `docs/plan/README.md`, `INTENT.md`, the
   map, and the package file.
4. Read the package's README status row. If it is `done`, stop and report the
   next not-started phase. If it is `blocked`, stop and report the blocker. If
   it is `in progress`, stop and ask before resuming.
5. Verify dependencies; do not trust the handoff:
   - Read the package's `Depends on` list.
   - For phase N > 1, also verify phase N−1 even if it is not listed.
   - Check the README review checkpoint table for a `phase N Gate 1` row. If it
     assigns a light verification, perform that verification too, and record it
     as `light-verified`.
   - Verify any earlier settled phase that is still uncommitted in the catch-up
     plan, even if it is not a direct dependency.
   - For each dependency and any earlier settled phase, read its README status
     and handoff, then verify the actual work:
     - Re-run 3–5 acceptance probes from the package.
     - Compare the handoff file list with `git status`; check hashes if present.
     - Verify build, fixture, and doc claims that the handoff makes.
     - Check the package guardrails for forbidden changes.
   - If a dependency or earlier settled phase is not done, has no handoff, has
     open questions, has a failing probe, or has unreconciled discrepancies,
     stop and report the blocker.
6. Determine review status from the README review cadence:
   - If this phase's dependency requires a rigorous review, read
     `docs/plan/reviews/<cycle-id>-phase-<dependency-phase>.md` and, if present,
     the latest `-re-review.md` record. The latest record is authoritative for
     the current verdict; an earlier finding it does not explicitly close still
     blocks. If neither exists, ask the user to run `review-session.md` first.
     If the latest record says `BLOCK`, `Commit readiness: no`, or
     `Commit readiness: after user accepts findings`, stop and ask for an
     explicit decision: `accept`, `accept and fix`, or `reject`. For `accept`,
     proceed. For `accept and fix`, do not start until a fix session updates the
     handoff with a fix note; then proceed without re-review if behavior is
     unchanged. For `reject` or `BLOCK`, require a fix session and `re-review`;
     do not start this phase.
   - If the dependency, or an earlier settled phase named in the checkpoint
     table, only requires light verification, this Gate 1 check is that
     verification; record it as `light-verified`.
7. Run the baseline commands and record the result:
   - `node tests/runner.js`
   - `node tests/unit.js`
8. Determine commit readiness, but do not commit in this gate:
   - List all previous settled phase files and review records that are still
     uncommitted, including the catch-up plan when more than one phase is
     settled.
   - If a rigorous review is pending or findings are unresolved, commit is
     blocked.
   - If the previous phase was already committed, say `none`.
9. Do not edit files, update status, append a handoff, or commit in this gate.

Reply with:
- Cycle: `<id>`
- Phase: `<N>`
- Package: `<ID> — <title>`
- Package file: `<path>`
- Status: `<not started/done/in progress>`
- Dependencies verified: `<list, status, handoff, probes, result>`
- Discrepancies: `<none or details>`
- Review status: `<light-verified/pending/independent-pass/etc.>`
- Baseline: runner `<N>` PASS / `<N>` FAIL; unit `<N>` PASS / `<N>` FAIL
- Commit due: `<previous phase files or none>`
- Commit blocked by: `<pending review/findings/unrelated changes/none>`
- Scope:
- Non-goals:
- Acceptance:
- Stop condition: after acceptance, README status update, package handoff, and
  `Commit: deferred`.
- Next phase I will not start: `<phase N+1 or none>`
- Intent conflicts: `<none or details>`

End with exactly:

```text
WAITING FOR GO. No files changed.
```

## Gate 2 — after `go`

If Gate 1 did not complete in this chat, or the user has not explicitly said
`go`, stop and ask.

### First action: commit the previous settled work

Do this before editing the current phase.

- Stop if a required review is pending or any finding is unresolved.
- Stop if the worktree contains unrelated changes. Do not bundle them.
- If this is the first phase of a new cycle, the previous cycle's final phase
  must already be committed. If not, stop and ask.
- Run `git diff --check` and the tests again if the last run was not in this
  session.
- Before staging, update each settled package's README status-row review suffix
  (for example `reviewed` or `light-verified`), its review checkpoint row, and
  its handoff `Review:` line from the review record or Gate 1 light check. If
  the record says `after user accepts findings` and the user accepted in this
  chat, record that acceptance in the row and handoff; do not edit the review
  record. If the README current snapshot still calls the settled phase's review
  pending, update it to the result. Leave the handoff's `Commit:` line as
  deferred; the commit is recorded in git.
- If multiple settled phases are uncommitted, follow the approved catch-up plan
  in `docs/plan/README.md`: make each listed commit in order, staging only the
  files named for that commit. The plan overrides the per-handoff staging rule.
  Otherwise stage the settled phase handoff files plus its review record if one
  exists.
- Run `git diff --cached --check` before each commit.
- Use each catch-up commit message, or the repository's message style for a
  single phase, for example `feat: add option boundary selection (P12)`.
- Do not amend, rebase, force-push, or create an empty commit.
- Record the resulting commit SHA or SHAs in the final report.

### Then execute the current phase

Execute only the resolved package. Follow `docs/plan/README.md` Session protocol
and Definition of done, plus the package's own acceptance table.

- Do not start, preview, or update the next phase.
- Do not commit the current phase. Its handoff must say
  `Commit: deferred to phase N+1 start`; at cycle end, a separate cycle-close
  session commits it before archiving the cycle.
- Do not archive the cycle or create a new map. The cycle stays active until the
  user confirms it is complete or asks to shelve it.
- Rebuild only `src/bookmarklet.js`. Do not rebuild
  `src/bookmarklet.min.js` unless the user explicitly asks.
- If acceptance fails, stop and report. Do not mark the package done.
- If the implementation must deviate from the package wording, stop and ask.
  Do not silently mark the package done.
- If a required browser or live check cannot be done, stop and ask; do not
  substitute a claim.
- Use `INTENT.md` as the behavior tie-breaker. If the package conflicts with it,
  stop and ask.
- Record acceptance coverage: every acceptance row maps to a test, probe, or
  explicit gap.
- Update the README status row only after acceptance passes.
- Append the handoff note with file hashes, review status, and
  `Commit: deferred`.
- Stop after that. Do not proceed to the next phase.

End with:
- Cycle:
- Phase:
- Package:
- Status:
- Previous commit(s):
- Tests:
- Files:
- Build:
- Docs:
- Review status:
- Commit (current phase): deferred
- Next phase (not started):
- Cycle state: active until you confirm completion
- `STOPPED. Start a new session for <next phase or none>.`
