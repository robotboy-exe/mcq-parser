# OT08 — Comprehension OCR

- **Status:** not started
- **Depends on:** OT07 and its settled rigorous review
- **Blocks:** OT09, OT10
- **External gate:** representative same-paste answer-key evidence required for
  final package acceptance
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Add a pure, fixture-backed `parsePaste()` orchestration layer that extracts one
or several comprehension contexts before strict legacy question parsing and
fills the OT07 manual review workflow.

## Parser contract

Return a structure equivalent to:

```text
metadata
contexts[]
items[]
answerKey
keyConflicts
sectionEvidence
warnings[]
```

Each linked item carries a local context reference and ordered position. A paste
with no recognized context follows the clean legacy parser path unchanged.

## Recognition rule

- Require strong passage heading/instruction evidence and at least two linked
  question candidates.
- Bound passage text before question splitting so dotted initials, years, and
  prose cannot become options or pseudo-questions.
- Stop at an evidenced next context, section boundary, or answer-key section.
- Accept wrapped `(a)`-`(d)` only when a complete ordered option sequence exists
  within one linked question.
- Do not globally accept bare lowercase `a)` labels.
- Preserve paragraph breaks through OT04's block-text cleanup.

## Work

1. Promote OT01 comprehension expectations from PENDING through a failing
   parser test.
2. Implement pure `parsePaste()` orchestration shared by the runner and owner
   tool; remove duplicated parse pipelines from UI code.
3. Segment multiple explicit contexts and preserve standalone items around
   them.
4. Add the scoped complete-sequence parenthesized-option parser.
5. Associate source question numbers, context order, and expected member count.
6. Parse the answer key from the same paste using the existing key rules; retain
   key-only correction behavior.
7. Add visible warnings for incomplete ranges, missing key entries, ambiguous
   boundaries, and unsupported second families.
8. Fill editable OT07 context cards and native question fields; do not save.
9. Run the entire clean regression wall and bank extractor.

## Acceptance

| Check | Expected |
|---|---|
| Supplied comprehension | One context linked to Q11-Q15 with transcribed options |
| Dotted initials/A.D. | Remain context prose; no pseudo-question/options |
| `(a)`-`(d)` | Parsed only as one complete ordered set |
| Multiple passages | Separate context records and member ranges |
| Singular passage | Same workflow with one context card |
| Mixed paste | Standalone items retain no context reference |
| Same-paste key | Printed numbers tick correct linked items |
| Key-only correction | Existing queue/contexts retained |
| No-context bank/anomaly | Behavior and assertions unchanged |
| Ambiguous passage | Warning/fallback; no invented relationship |
| Manual workflow | Context/questions editable; zero automatic POSTs |

## Guardrails

- Do not run shared-image stimulus extraction before readable context extraction.
- Do not weaken global `OPTION`, `splitQuestions`, or the numbering guard.
- Do not invent passage ranges or synthetic question numbers.
- Do not save or activate from the parser.
- Do not start OT09.

## Handoff template

```text
Date:
Result:
parsePaste API/version:
Recognition/fallback rules:
Fixture assertions and full regression counts:
Same-paste key evidence:
Owner-tool zero-POST proof:
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT09 Gate 1
Commit: deferred
Next: OT09 not started
```
