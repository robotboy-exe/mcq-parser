# H4 — Local artifact cleanup

Status: done (2026-10-27)
Depends on: H1

## Goal

Remove ignored generated clutter without touching live data or the workspace
contract.

## Scope

- Delete `review-packet/` and `review-packet.zip`.
- Prune `.playwright-mcp` logs, snapshots, and old mock scripts.
- Keep `delete-3018-3053-backup.json` in place; it is ignored and contains live
  question records.
- Leave `.opencode/node_modules` and `$HOME/tmp` alone.

## Steps

1. Delete the review packet directory and zip.
2. Delete `.playwright-mcp/*.log`, `page-*.yml`, and `as0*-mock*.js`.
3. Confirm `delete-3018-3053-backup.json` still exists.
4. Confirm no tracked file references the deleted review packet.
5. Run `git status --short` and `du -sh .playwright-mcp`.

## Acceptance

| Check | Expected |
|---|---|
| `test -e review-packet` | false |
| `test -e review-packet.zip` | false |
| `test -f .playwright-mcp/delete-3018-3053-backup.json` | true |
| `git status --short` | only intended tracked changes |
| `git diff --check` | clean |

No live action. No commit.

## Handoff

Result: done 2026-10-27. Deleted `review-packet/` and `review-packet.zip`. Pruned
89 files from `.playwright-mcp` (`*.log`, `page-*.yml`, and `as0*-mock*.js`);
the directory now contains only `delete-3018-3053-backup.json` and is 24 KB,
down from 828 KB. Updated the current `tests/build-check.js` references in
`docs/plan/README.md` and `docs/Active.md` to past tense, and removed the stale
`review-packet` ignore entries from `.gitignore`. Historical package notes still
mention `review-packet`; no live code, test, or command depends on it.

Files: `.gitignore`, `docs/plan/README.md`, `docs/Active.md`,
`docs/plan/history.md`, `docs/plan/housekeeping/04-local-cleanup.md`.
Open questions: none.
Review: independent-pass (docs/plan/reviews/housekeeping-2026-10-phase-4.md).
Commit: committed in cycle-close catch-up.

Verification: `review-packet` and `review-packet.zip` absent; backup file
present; `.playwright-mcp` contains one file; `git status --short` shows only
the intended housekeeping changes; `git diff --check` clean. No tests run
because no source, test, fixture, tool, or build output changed. No live action.
