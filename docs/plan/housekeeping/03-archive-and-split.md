# H3 — Archive historical docs and split the tracker

Status: done (2026-10-27)
Depends on: H2

## Goal

Separate current operations from setup-era history and reduce the size of the
main plan tracker.

## Scope

- Move `WORKSPACE_SETUP.md`, `phase-plan.md`, and `docs/phase-1..6.md` to
  `archive/workspace-setup/`.
- Add a provenance README there.
- Update the live references in `README.md` and `docs/AGENTS.md`.
- Mark `docs/Active.md` historical without breaking old package links.
- Split `docs/plan/README.md` into an operational tracker plus
  `docs/plan/history.md`.

The old cycle map was already archived in H1; verify it is present.

## Steps

1. Create `archive/workspace-setup/` and move the setup-era files.
2. Add `archive/workspace-setup/README.md` with dates and provenance.
3. Update `README.md` and `docs/AGENTS.md` to point at the archive or
   `docs/STATUS.md`.
4. Add a "historical, superseded" banner to `docs/Active.md`.
5. Move the current snapshot and change log out of `docs/plan/README.md` into
   `docs/plan/history.md`; deduplicate overlapping entries.
6. Keep the work-package table, cycle workflow, dependency graph, and commands
   in `docs/plan/README.md`.

## Acceptance

| Check | Expected |
|---|---|
| Link check | no broken relative links |
| `docs/plan/README.md` size | materially smaller than 52 KB |
| `archive/workspace-setup/` | contains the setup files and provenance README |
| `docs/plan/prompts/cycles/post-as-2026-10.md` | present and unchanged |
| `git diff --check` | clean |

No commit.

## Handoff

Result: done 2026-10-27. Moved `WORKSPACE_SETUP.md`, `phase-plan.md`, and
`docs/phase-1..6.md` to `archive/workspace-setup/` with a provenance README;
the files are unchanged apart from their paths. Updated the live `WORKSPACE_SETUP`
references in `docs/AGENTS.md` and `docs/plan/11`. Added a historical banner to
`docs/Active.md` without moving it, so old package links still resolve. Split the
tracker: `docs/plan/README.md` keeps the cycle workflow, work-package table,
dependency graph, commands, and current counts; `docs/plan/history.md` now holds
the archived checkpoints, deduplicated snapshot notes, removed-file audit, and
change log. Updated the phase/cycle/fix prompts to refer to the history snapshot.
Also corrected the remaining prompt references to rebuilding the untracked
minified file.

Files: `archive/workspace-setup/` (nine files including the provenance README),
`docs/Active.md`, `docs/AGENTS.md`, `docs/STATUS.md`, `docs/plan/README.md`,
`docs/plan/history.md`, `docs/plan/11-remaining-verification.md`,
`docs/plan/prompts/{phase-session,fix-session,cycle-close}.md`,
`docs/plan/housekeeping/03-archive-and-split.md`.
Open questions: none.
Review: independent-pass (docs/plan/reviews/housekeeping-2026-10-phase-3.md).
Commit: committed in cycle-close catch-up.

Verification: link check 0 broken; `docs/plan/README.md` is 24,937 bytes, down
from 54,108; `archive/workspace-setup/` contains the setup files and README;
`docs/plan/prompts/cycles/post-as-2026-10.md` is present (SHA-256
`6b093f1b7101cec0e453c79ac66323c72eba34b759431b64dd5269ef7164d41e`);
`git diff --check` clean. No tests run because no source, test, fixture, tool,
or build output changed.
