# PC03 — Spaced Initialism Option Boundaries

- **Status:** not started
- **Package base:** record the review-settled PC02 boundary at Gate 1
- **Implementation branch:** short-lived `scratch/pc03-spaced-initialisms`
- **Depends on:** PC02 done and rigorous review settled
- **Blocks:** PC04
- **Review level:** rigorous
- **External gate:** none; parser and real-surface executable evidence
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Investigate and, only with failing-first evidence, prevent spaced dotted
initialisms such as `C. I. F.` and `A. D.` from becoming option boundaries in
the canonical core.

## Scope

- Revalidate P23's raw examples against the review-settled core; do not trust the
  old proposed patch or infer expected fields from parser output.
- Add manually transcribed fixtures for initials in stems, inside options, and
  across OCR wraps before changing code.
- Make the narrowest core-only selector change that passes those fixtures and
  every existing D-91/option-boundary control through all three surfaces.

## Non-goals

- No stimulus, image, header-contamination, multi-paper, missing-label, UI,
  autosave, or storage change.
- No broad abbreviation dictionary or nearest-label guessing.
- No source reuse from the blocked stimulus worktree without independent proof.

## Acceptance

| Check | Expected |
|---|---|
| Failing first | C.I.F., A.D., inner-option, and wrapped-initial vectors fail on package base for the documented reason |
| Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag |
| Controls | D-91 repeat matrices, Q46, complete duplicate sets, incomplete sets, blank options, E/F, slash labels, and bank/anomaly fixtures remain unchanged |
| Surfaces | Core, deployed helper, key bookmarklet, and stimulus bookmarklet return identical parsed fields |
| Baseline | Full Node/PHP baseline, build checks, bank extractor, and adversarial review probe pass |
| Safety | No deploy, live action, or real-branch change |

## Handoff

Not started. Record provenance, failing-first output, exact selector change,
surface parity, measurements, hashes, commands, review target, and
`Commit: deferred`.
