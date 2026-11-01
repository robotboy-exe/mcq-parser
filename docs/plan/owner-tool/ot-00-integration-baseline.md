# OT00 — Integration Baseline

- **Status:** done
- **Depends on:** none
- **Blocks:** OT01-OT10
- **External gate:** explicit approval before creating the integration merge
  commit
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Create one clean, verified integration line that contains both histories and the
file-based owner-tool plan, without modifying the dirty experiments worktree or
importing its blocked P20-P22 changes.

## Fixed decisions

- The parser/test baseline is clean experiments commit `d5a62f0`.
- The dirty experiments worktree remains untouched and uncommitted.
- Join `main` into an integration branch based on `d5a62f0` so both histories
  remain reachable.
- Prefer clean experiments parser/tests/planning infrastructure on overlap.
- Preserve main-only approved P24/PENDING plans and the supplied live sources.
- Record, but do not port, the read-only P20-P22 review findings.
- New decisions begin at D-66.

## Gate 1 preconditions

1. Record `git status`, branch, HEAD, and worktree path for both existing
   worktrees.
2. Confirm `experiments` still points at `d5a62f0` plus uncommitted changes.
3. Confirm `main` still contains the materialized owner-tool planning files.
4. Verify no command will reset, clean, stash, or switch either existing dirty
   worktree.
5. Independently establish the exact clean-commit test baseline; do not trust
   the 43/140 handoff claim.
6. Present the proposed merge/conflict policy and request explicit approval for
   any commit.

## Work

1. Create a third clean worktree and branch named for the owner-tool
   integration, rooted at `d5a62f0`.
2. Merge `main` so both histories are joined.
3. Resolve source/parser/test overlaps in favor of the clean experiments
   baseline unless a main-only fix has direct evidence.
4. Resolve planning/docs overlaps by preserving historical P01-P09 records,
   importing the experiments methodology, and keeping this active owner-tool
   cycle authoritative.
5. Bring the newly supplied untracked PHP/OCR files into the integration
   worktree without editing their contents.
6. Add a concise shelved-cycle record stating that dirty P20-P22 was reviewed
   `BLOCK` and excluded.
7. Run the merged baseline and inspect every conflict resolution.
8. Commit the integration only if the user explicitly authorizes the merge
   commit. Otherwise keep this package `in progress`; do not claim completion
   with an unresolved merge.

## Acceptance

| Check | Expected |
|---|---|
| Existing main worktree | Unchanged except its pre-existing planning/source files |
| Existing experiments worktree | Byte-for-byte worktree state unchanged |
| New integration worktree | Clean after an explicitly authorized merge commit |
| History | Both `main` and `d5a62f0` are ancestors of the integration line |
| Blocked work | No dirty P20-P22 parser/UI/test hunk imported |
| Tests | Clean experiments baseline and merged baseline pass with exact counts recorded |
| Bank extractor | `node tools/extract-bank.js --check` passes |
| Planning | OT00-OT10 links resolve; active cycle remains `owner-tool-2026-11` |
| Product behavior | No intentional production behavior change |

## Guardrails

- Never use `git reset --hard`, `git clean`, checkout-based reversion, or stash
  on either existing worktree.
- Do not resolve a conflict by copying the current dirty experiments file.
- Do not import P20-P22 source, tests, fixtures, or claims from uncommitted
  state.
- Do not start OT01.
- Do not commit without explicit user authorization.

## Handoff template

```text
Date:
Result:
Integration branch/worktree:
Parents/ancestors:
Baselines before and after merge:
Conflict-resolution manifest:
Dirty experiments state verified unchanged:
Files changed:
Open questions:
Review: pending rigorous OT00 review
Commit: deferred | <explicitly authorized SHA>
Next: OT01 not started
```

## Handoff

```text
Date: 2026-10-31
Result: PASS
Integration branch/worktree: owner-tool-integration at /data/data/com.termux/files/home/projects/ocr-parser-integration
Parents/ancestors:
  - d5a62f06314454a556898318ead403702f8cecfa (clean experiments commit)
  - cb7f9b2c34cb8f343a419c8f000c01a931dc3bdf (main containing owner-tool-2026-11 intent/plan and deployed sources)
Baselines before and after merge:
  - main (e5dec50): 25/25 runner PASS, 5 bank slices OK
  - clean experiments (d5a62f0): 43/43 runner PASS, 140/140 unit PASS, 7 bank slices OK
  - merged integration line: 43/43 runner PASS, 140/140 unit PASS, 7 bank slices OK
Conflict-resolution manifest:
  - Code/tests/runner/fixtures (src/, tests/, fixtures/, tools/): resolved to clean experiments d5a62f0.
  - Active cycle docs/plans (INTENT.md, docs/plan/prompts/*, docs/plan/reviews/*, docs/plan/owner-tool/*, docs/plan/history.md, deployed/*, sample-*): resolved to main / owner-tool-2026-11.
  - Coordinator (docs/plan/README.md): resolved to main owner-tool coordinator.
  - Core reference docs (AGENTS.md, README.md, docs/AGENTS.md, docs/DECISIONS.md, docs/EDGE_CASES.md, docs/INVARIANTS.md, docs/SPEC.md): resolved to d5a62f0 baseline.
  - Blocked experiments work (P20-P22): excluded byte-for-byte; uncommitted experiments worktree untouched.
Dirty experiments state verified unchanged:
  - Checked git status --porcelain on /data/data/com.termux/files/home/projects/ocr-parser-experiments; exact 21 modified and 11 untracked files preserved byte-for-byte.
Files changed:
  - Integration merge commit d66f96b created with joined histories.
  - Documentation status updates in phase-map.md, README.md, STATUS.md, ot-00-integration-baseline.md.
Open questions: None.
Review: pending rigorous OT00 review
Commit: d66f96b (merge authorized by user)
Next: OT01 not started
```
