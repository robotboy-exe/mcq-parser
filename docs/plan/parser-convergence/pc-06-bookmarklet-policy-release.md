# PC06 — Bookmarklet Policy and Scratch Release

- **Status:** not started
- **Package base:** record the review-settled PC05 boundary at Gate 1
- **Implementation branch:** short-lived `scratch/pc06-bookmarklet-policy-release`
- **Depends on:** PC05 done and rigorous review settled
- **Blocks:** cycle-wide review and any owner-authorized real-branch integration
- **Review level:** rigorous package review plus rigorous cycle-wide review
- **External gate:** desktop and Brave/Android checks for both installed bookmarklets
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Apply only bookmarklet-specific P20/P22 policy, prove the final three-product
matrix, and prepare a reviewed scratch release. No real branch changes in this
package.

## Scope

1. Stimulus bookmarklet: keep selected files in memory for the documented plan
   lifetime, pause before every image-required question, require a manual save,
   and resume only after a new Start.
2. Stimulus bookmarklet: block pending missing-text cases before POST; repair the
   bulk-picker stale-file and labelling behavior with direct tests.
3. Key bookmarklet: Gate 1 must obtain the owner's explicit choice for a
   `needsImage` question because this product has no image plan. The safe default
   offered at Gate 1 is a hard stop with no POST.
4. Deployed helper: remain manual and ignore bookmarklet-only image/autosave
   policy while retaining the shared clean parser fields and advisory metadata.
5. Produce exact generated artifacts, manifests, version decisions, full test
   evidence, and a real-branch integration/rollback plan for later owner action.

## Non-goals

- No parser, PHP, schema, database, deployment, live save/delete, or real-branch
  merge/push.
- Do not merge the bookmarklets or force identical UI/policy.
- Do not persist image files or introduce new shared storage shapes without an
  explicit package amendment.

## Acceptance

| Check | Expected |
|---|---|
| No unintended POST | Image pause, missing-text stop, stale state, hidden tab, and ambiguous-save paths perform no retry/duplicate POST |
| Manual resume | Stimulus bookmarklet pauses, owner saves manually, then a new Start resumes the correct next queue item |
| Image plan | Range edits cannot bypass pause; files remain tab-memory only; plan lifetime and Reset/Load clearing are exact |
| Bulk picker | One block hides bulk UI; multiple blocks label order clearly; partial selection cannot reuse stale files |
| Key product | Owner-approved `needsImage` policy is exact and tested; no stimulus UI leaks into it |
| Deployed product | Still manual; no key/autosave/image-plan controls or network loop |
| Builds | Both bookmarklets install and run on desktop and Brave/Android; one-line/syntax/determinism/size reports pass |
| Full release evidence | Complete Node/PHP baseline, bank extractor, build-output probes, storage cross-product tests, hashes, manifest, and rollback plan pass |
| Review | PC06 rigorous review and cycle-wide review settle with no open blocker before any real-branch proposal |
| Safety | No deploy, live action, or real-branch change |

## Handoff

Not started. Record the owner policy choice, exact files, measurements, hashes,
all test/browser evidence, generated artifacts, integration/rollback plan,
review targets, and `Commit: deferred`.
