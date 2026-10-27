# Cycle Close — Commit the Final Phase

Argument (supplied with this prompt; it may replace `$ARGUMENTS` or appear as
the text the user added alongside this attachment):

    $ARGUMENTS

This session closes the active build cycle after its final phase and rigorous
review have settled. It commits the final phase and review record(s), updates
the final status/checkpoint/handoff/snapshot, and stops. It executes no package
and does not archive the cycle.

The first reply is a read-only Gate 1 and waits for an explicit `go`.

## 1. Resolve the scope

- `cycle close` or `cycle-close` means the active cycle in
  `docs/plan/prompts/phase-map.md`.
- `cycle close <cycle-id>` means that cycle only if it is the active map; an
  archived cycle cannot be closed here.
- If the argument is missing, stop and ask. If it names a cycle different from
  the active one, stop and report.
- The final phase is the last row in the active map. Do not infer a different
  final phase from package IDs or handoffs.

Read `AGENTS.md`, `docs/AGENTS.md`, `docs/plan/README.md`, `INTENT.md`, the
active map, the final package file, its handoff, and every review record for the
final phase. Read `docs/LIVE-SAFETY.md` before any live/browser check.

## 2. Gate 1 — read-only

1. Confirm the final phase is `done` in the README status row and package file.
   If it is `not started`, `in progress`, or `blocked`, stop and report.
2. Find the latest review record for the final phase. If none exists, stop and
   ask for `review-session.md` first.
3. Require a settled verdict:
   - `PASS` — proceed.
   - `PASS WITH ACCEPTED FINDINGS` — the record must show the user's decision
     (`accept`, or `accept and fix` with the fix completed). If it is pending,
     ask; an explicit `accept` or `accept and fix` in this session is enough.
     Record the decision in the README checkpoint and handoff, not the review
     record.
   - `BLOCK`, `reject`, or unresolved findings — stop; a fix and `re-review`
     are required first.
4. Treat the handoff as a claim. Verify its file list, test counts, build
   claims, docs IDs, and open questions against the worktree.
5. Run the baseline commands:
   - `node tests/runner.js`
   - `node tests/unit.js`
   - `node tools/extract-bank.js --check` when parser, fixtures, extractor, or
     build output changed.
6. If parser/UI changed, verify the build rather than rebuilding blindly:
   `wc -l src/bookmarklet.js` must print `1`, the body must parse, and the file
   must contain no `%`. Do not rebuild `src/bookmarklet.min.js`; it is untracked
   and outside the workspace contract.
7. Check the worktree for changes outside the final phase's handoff file list,
   its review record(s), and any explicitly approved safety-doc commit. List
   them. Do not attribute unrelated changes to the package.
8. Resolve the live-safety state without touching the site:
   - no live deletes or cleanup;
   - record any live-created test rows and whether they remain owner-only;
   - do not treat live cleanup as a package acceptance item.
9. Decide commit scope. If the worktree contains uncommitted live-safety docs
   or other files not named by the final handoff, ask the user for one decision:
   `bundle` (include them in the final-phase commit), `separate` (commit the
   final phase first, then a separate docs commit), or `stop`.
10. Do not edit files, update status, stage, or commit in this gate.

Reply with:
- Cycle: `<id>`
- Final phase: `<N>`
- Package: `<ID> — <title>`
- Package file: `<path>`
- Review record: `<path>`
- Verdict: `<PASS/PASS WITH ACCEPTED FINDINGS>`
- User decision: `<accept/accept and fix/not recorded>`
- Baseline: runner `<N>` PASS / `<N>` FAIL; unit `<N>` PASS / `<N>` FAIL
- Build: `<verified/not applicable/problem>`
- Commit scope: `<final phase + review; plus safety docs if approved>`
- Unrelated changes: `<none or exact files>`
- Live actions: `<none; test rows left owner-only>`
- Commit readiness: `<yes/no; reason>`
- Next action: `<cycle-close commit or stop>`

End with exactly:

```text
WAITING FOR GO. No files changed.
```

## 3. Gate 2 — after `go`

- Stop if the review is not settled, any finding is unresolved, or the user has
  not made the commit-scope decision for unrelated files.
- Do not run a package acceptance, start a phase, or use `phase-session.md`.
- Update only:
  - the final README status row, adding the review result and commit status;
  - the cycle-end review checkpoint row;
  - the final handoff `Review:` line and `Commit:` line;
  - the history snapshot in `docs/plan/history.md` if it still calls the review
    or commit pending.
- Do not edit the review record.
- Run `git diff --check`.
- Stage only the files for the approved commit scope. For a separate safety-doc
  commit, make the final-phase commit first, then the docs commit; never bundle
  without the user's explicit `bundle`.
- Run `git diff --cached --check` and inspect the staged diff for secrets,
  credentials, or live artifacts.
- Use the repository's message style, for example
  `feat: add automatic dry run and separate status (AS-12)`.
- Do not amend, rebase, force-push, or create an empty commit.
- Commit the final phase and its review record(s). If the user chose
  `separate`, commit the approved safety docs separately and report both SHAs.
- Re-run the baseline checks if the last run was not in this session.
- Leave the cycle active. Do not archive, copy the map, create a new cycle, or
  start phase 1.
- Stop and report.

## 4. Output

Reply with:
- Cycle:
- Final phase/package:
- Review record:
- Verdict:
- User decision:
- Commits: `<SHA(s) or none>`
- Tests:
- Build:
- Files committed:
- Live writes/cleanup:
- Review status:
- Cycle state: active, not archived
- Next action: `<archive decision or remaining blocker>`

End with exactly:

```text
CYCLE CLOSE COMPLETE. Final phase committed. Cycle not archived.
```
