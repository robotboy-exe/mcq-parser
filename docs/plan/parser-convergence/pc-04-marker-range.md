# PC04 — Marker-Adjacent Range Extraction

- **Status:** not started
- **Package base:** record the review-settled PC03 boundary at Gate 1
- **Implementation branch:** short-lived `scratch/pc04-marker-range`
- **Depends on:** PC03 done and rigorous review settled
- **Blocks:** PC05
- **Review level:** rigorous
- **External gate:** none; parser and real-surface executable evidence
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Extend the canonical stimulus parser for the narrow P20 case: an explicit image
or diagram marker adjacent to a ranged intro may use that intro's question range
even when there is no table. This does not reopen the settled RM01 structural
heading/instruction fix.

## Scope

- Revalidate the supplied Q18-Q23 raw sample and transcribe expectations before
  code changes.
- Recognize only the approved exact marker grammar.
- Keep explicit marker ranges authoritative; otherwise derive targets only from
  the qualifying adjacent ranged intro.
- Preserve marker-only behavior when no valid block/range exists.

## Non-goals

- No image-plan lifetime, pause policy, bulk picker, generic inter-question tail
  deletion, unrelated-number inference, or UI change.
- No claim that the blocked P20 implementation is accepted evidence.

## Acceptance

| Check | Expected |
|---|---|
| Failing first | Revalidated P20 fixture reproduces the exact missing range/Option D contamination on package base |
| Range | Q20-Q22 only are targets; explicit marker range wins over intro range |
| False positives | Dates, years, amounts, account numbers, figure labels, option lines, and following questions never become targets |
| Field contract | Intro/marker text reaches no question/option field; surrounding blank-line behavior stays correct |
| Controls | Existing marker-placement, table-stimulus, no-valid-block, regions, bank, and anomaly fixtures remain unchanged |
| Surfaces | All three products use the same core result; product UI remains unchanged |
| Safety | Full baseline/build checks pass; no deploy, live action, or real-branch change |

## Handoff

Not started. Record provenance, failing-first output, exact grammar/range rule,
controls, measurements, hashes, commands, review target, and
`Commit: deferred`.
