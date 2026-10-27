# H2 — Truth reset

Status: done (2026-10-27)
Depends on: H1

## Goal

Make the current-facing docs match the worktree and give the project one
canonical status page.

## Scope

- Add `docs/STATUS.md`.
- Refresh `README.md`.
- Fix the `//` comment contradiction in `AGENTS.md`.
- Update current baselines in `docs/plan/11-remaining-verification.md`.
- Mark `docs/plan/12-browser-harness-spec.md` as an unapproved draft.
- Correct the cycle checkpoint SHAs in `docs/plan/README.md`.

Historical package handoffs and change-log entries stay as they are.

## Steps

1. Create `docs/STATUS.md` with the current date, runner/unit/extractor results,
   the `src/bookmarklet.js` hash and size, the untracked-min policy, and live
   test rows #3841-#3846 as owner-only.
2. Replace `README.md` status counts with a link to `docs/STATUS.md`; update the
   project layout and remove the stale "phases 1-9" claim.
3. Change the `AGENTS.md` comment rule to match `docs/AGENTS.md` and
   `src/build/build.js`: full-line comments are stripped, inline comments are
   forbidden.
4. Update the `docs/plan/11` baseline and `docs/plan/12` draft status.
5. Record the AS-12 and safety-doc commits in the archived checkpoint table.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 115 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | exit 0, seven slices |
| Link check | no broken relative links |
| Stale-count grep | no current-facing 37/65 or 83/84 claims |
| `git diff --check` | clean |

No commit. Update the status row and handoff when done.

## Handoff

Result: done 2026-10-27. Added `docs/STATUS.md` as the canonical status page and
replaced the stale README status counts with a link to it. The README layout now
lists `docs/STATUS.md`, `docs/LIVE-SAFETY.md`, and `tests/ui-harness.js` without
stale edge-case/invariant counts. `AGENTS.md` now allows full-line `//` comments
and forbids inline ones, matching `docs/AGENTS.md` and `build.js`. The
`docs/plan/11` baseline is 41/115 with the current build size and hash, and
`docs/plan/12` is marked an unapproved draft. The archived checkpoint table now
records `7bbadee` (AS-12), `490f60a` (safety/process docs), and `1cb6c7f` +
`2ad3fa9` (P11 catch-up).

Files: `README.md`, `AGENTS.md`, `docs/STATUS.md`,
`docs/plan/11-remaining-verification.md`,
`docs/plan/12-browser-harness-spec.md`, `docs/plan/README.md`.
Open questions: none.
Review: independent-pass (docs/plan/reviews/housekeeping-2026-10-phase-2.md).
Commit: committed in cycle-close catch-up.

Verification: runner 41 PASS / 0 FAIL / 0 PENDING; unit 115 PASS / 0 FAIL;
extractor exits 0 with seven slices; build one line, no `%`, body parses;
link check 0 broken; stale-count grep clean; `git diff --check` clean.
