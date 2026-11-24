# PC05 — Inter-Question Stimulus Boundaries

- **Status:** not started
- **Package base:** record the review-settled PC04 boundary at Gate 1
- **Implementation branch:** short-lived `scratch/pc05-stimulus-boundaries`
- **Depends on:** PC04 done and rigorous review settled
- **Blocks:** PC06
- **Review level:** rigorous
- **External gate:** none; parser and real-surface executable evidence
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Safely cover the P21 anchored shared-stimulus tails and P22 missing-text
classification without reviving the blocked blanket-deletion algorithm. The
review-settled RM01 structural-heading/instruction cases remain closed.

## Scope

- Revalidate the supplied text and diagram samples and write failing-first,
  manually transcribed core fixtures.
- Define an anchored boundary only after a complete selected A-D set and only
  when a supported marker or explicit ranged stimulus intro identifies the tail.
- Preserve the entire anchored stimulus as metadata and keep it out of all
  saveable fields.
- Detect `[...missing...]` before any supported extraction so cleanup cannot
  erase its advisory classification.
- Add adversarial controls derived from the prior BLOCK review.

## Non-goals

- No unanchored-tail deletion, nearest-boundary guessing, generic table capture,
  image-plan/UI/autosave policy, or broad range parsing.
- No claim that the old green 46/155 suites settle the prior BLOCK findings.

## Acceptance

| Check | Expected |
|---|---|
| Supplied samples | Revalidated text and diagram tails become complete metadata; preceding Option D remains exact |
| Prior blockers | Canonical-bank lead-ins, valid next-line option text, incomplete sets, duplicate A-D sets, and loose E/F continuations are never deleted |
| Range safety | Dates, years, amounts, account numbers, and figure labels do not expand target ranges |
| Missing text | Pending `[...missing...]` is classified before extraction and remains advisory in deployed/manual parsing |
| Closed RM01 behavior | SECTION headings, ordinary instructions, inline A-D ownership, regions, and `sectionInstruction` fixtures remain unchanged |
| Surfaces | Core outputs are identical through deployed, key, and stimulus products; product policy is still untouched |
| Safety | Full baseline/build checks and an independent adversarial review pass; no deploy, live action, or real-branch change |

## Handoff

Not started. Record prior-review closure coverage, fixture provenance,
failing-first output, exact boundary rule, measurements, hashes, commands,
review target, and `Commit: deferred`.
