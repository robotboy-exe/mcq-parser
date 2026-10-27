# H1 — Untrack the minified build

Status: done (2026-10-27)
Depends on: none

## Goal

Stop tracking `src/bookmarklet.min.js` and make `src/bookmarklet.js` the only
tracked build output.

## Scope

- Untrack the minified file but keep the local copy.
- Ignore it locally.
- Update current-facing build rules in `AGENTS.md`, `docs/AGENTS.md`,
  `docs/BUILD.md`, and `docs/plan/README.md`.
- Bootstrap the housekeeping cycle: archive the old phase map, add this cycle's
  map, and add the five lightweight package files.

Do not change parser, UI, tests, fixtures, or the build script. Do not rebuild
the minified file.

## Steps

1. Copy the old map to `docs/plan/prompts/cycles/post-as-2026-10.md`, then
   replace `docs/plan/prompts/phase-map.md` with the housekeeping map.
2. Add `docs/plan/housekeeping/01-untrack-min.md` through
   `05-inbox-triage.md`.
3. Run `git rm --cached src/bookmarklet.min.js`; keep the working-tree file.
4. Add `/src/bookmarklet.min.js` to `.gitignore`.
5. Update the current-facing min rules. Historical handoffs and change-log
   entries stay untouched.
6. Add the housekeeping status table to `docs/plan/README.md`.

## Acceptance

| Check | Expected |
|---|---|
| `git ls-files src/bookmarklet.min.js` | empty |
| `test -f src/bookmarklet.min.js` | true; local copy kept |
| `git check-ignore src/bookmarklet.min.js` | prints the path |
| `git diff -- src/bookmarklet.js` | empty |
| Map links | all five package files resolve |
| `git diff --check` | clean |

No tests are required for this docs/index-only phase. No commit.

## Handoff

Result: done 2026-10-27. The old map is archived at
`docs/plan/prompts/cycles/post-as-2026-10.md`; the housekeeping map and five
package files are present. `src/bookmarklet.min.js` is untracked, still exists
locally (57,880 bytes), and is ignored. Current-facing build rules now describe
`src/bookmarklet.js` as the only tracked output and the minified file as an
untracked local artifact. `src/bookmarklet.js` is unchanged.
Files: `.gitignore`, `AGENTS.md`, `docs/AGENTS.md`, `docs/BUILD.md`,
`docs/plan/README.md`, `docs/plan/prompts/phase-map.md`,
`docs/plan/prompts/cycles/post-as-2026-10.md`, and the five files under
`docs/plan/housekeeping/`.
Open questions: none.
Review: independent-pass (docs/plan/reviews/housekeeping-2026-10-phase-1.md).
Commit: committed in cycle-close catch-up.

Verification: `git ls-files src/bookmarklet.min.js` empty; local file present;
`git check-ignore` matches; `git diff -- src/bookmarklet.js` empty; link check
0 broken; `git diff --check` clean. No tests run because no source, test,
fixture, or tool changed.
