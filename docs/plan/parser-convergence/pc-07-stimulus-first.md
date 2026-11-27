# PC07 — Stimulus-First Convergence (Proposed)

- **Status:** not started; draft pending owner approval of the cycle amendment
- **Proposed phase:** 7, with its own first review and re-review records
- **Depends on:** PC03 settled and the exact scope and refs agreed at Gate 1
- **Package base:** the reviewed `scratch/parser-convergence-cycle` tip
  (`9afe4f8` at drafting); confirm at Gate 1
- **Implementation branch:** `scratch/pc07-stimulus-first` on the owner's VM
- **External gate:** installed replacement checked on desktop and by the owner
  on Brave/Android before the key-only release path can retire
- **Start:** [scratch session prompt](../prompts/stimulus-convergence-scratch.md)

## Proposed cycle amendment

Keep the deployed manual helper and converge on one supported bookmarklet with
the features of the owner's pinned working stimulus snapshot. Keep the single
canonical parser and the quality already proved on the convergence line. The
working ready-image autosave behavior replaces PC06's planned pause at every
image-required question. A ready attached image permits autosave within its
range; preserve the working pause when the image or its association is missing.

If the owner approves at Gate 1, register PC07 as the successor to unfinished
PC04–PC06 in the coordinator and phase map on the candidate branch. Preserve
PC01–PC03 as settled and the old package and review records as evidence. Map
every unfinished acceptance row to PC07 or a named, owner-approved release gate
before product changes. Record PC04 `BLOCK-10` and `BLOCK-11` as carried **open**
with their exact frozen checklists; the amendment does not dispose of findings
or settle any work. Retain the key-only build as a comparator through the frozen
checks and a rollback reference through owner acceptance. No active scope or
branch state changes simply because this draft exists.

## Acceptance

| Gate | Required evidence |
|---|---|
| Exact baseline and feature parity | Owner-confirmed stimulus SHA and artifact; enumerate each user-facing change and compare useful key-only outcomes. Map each to candidate code and evidence. Later donor commits do not move this target. |
| PC04 range inference | Plain OCR markers next to supported intros infer exact targets. Real Q18–Q23, explicit precedence, frozen `V10` and `V11` checks and their named controls pass, including the real three-surface replay and Attach where required. No date/amount/figure tail or following question becomes an invented target. |
| PC05 ownership and parser quality | Failing-first, source-backed anchored text/diagram and missing-text checks; preserve legitimate question/option content and prior parser invariants. Prove the same canonical parse through the actual stimulus Load and the key-only comparison; preserve the manual adapter contract. |
| PC06 stimulus and save behavior | Working features retained, including bookmarklet Constant Text, memory/mobile image handling, single/bulk picker, pause/resume, key workflows and diagnostics. Real disposable staging proves persisted image and correct answer on intended rows only; no duplicate or unintended POST on blocked or uncertain paths. |
| Build and release | Full baseline and real artifacts, version/pin, hashes, installability evidence and rollback ref. Deployed helper remains manual, with its existing storage and server contracts. Owner checks the installed replacement before release retirement. |
| Independent review | In a clean dedicated worktree, a reviewer other than the implementer checks the exact pushed ref against the owner's approved scope, including every scope amendment, code change, fixture, test and artifact. Independently close both carried blockers or keep PC07 blocked. Review each subsequent fix or retirement delta before merge or release. |

## Handoff and review

Record approved scope and exact candidate/base/donor refs, acceptance and
production-path evidence, externalize-first measurements, open findings, and
`Commit: deferred`. A complete implementation handoff makes the pushed
candidate reviewable; only independent settlement makes it merge-ready.
After separate publication, the reviewer runs:

```text
@docs/plan/prompts/review-session.md review phase 7
```

Use `docs/plan/reviews/parser-convergence-2026-11-phase-7.md` for the initial
record. Reference the PC04 findings by their original IDs and contracts; a
separate defect receives its own ID rather than broadening a carried one. A
settled candidate can move only to the scratch cycle line with separate owner
authorization. The cycle-wide gate still controls release readiness.
