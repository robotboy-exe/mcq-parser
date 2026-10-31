# OT09 — Cloze OCR

- **Status:** not started
- **Depends on:** OT08
- **Blocks:** OT10
- **External gate:** representative same-paste answer-key evidence required for
  final package acceptance
- **Release:** C
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Parse the evidenced numbered-gap passage and A-D fixed-column option family into
one shared cloze context plus one editable linked MCQ per gap.

## Recognition rule

- Require an instruction describing numbered gaps and A-D options.
- Require at least two numbered gaps in context text.
- Require an evidenced A-D table header and at least two sequential numbered
  option rows.
- Infer four data-column starts from repeated row alignment, not the visual
  header alone.
- Validate every row produces four non-empty options within server limits.
- Require row numbers and context gap numbers to correspond; otherwise warn and
  refuse the cloze interpretation.

## Work

1. Promote OT01 cloze expectations through a failing parser test.
2. Detect and isolate the cloze context before numbered rows reach the ordinary
   question splitter.
3. Normalize each evidenced source gap to `[[gap:N]]` while preserving
   paragraphs and original gap numbering.
4. Derive stable column boundaries from multiple clean rows, then slice and
   trim every row without collapsing alignment first.
5. Generate an editable stem such as `Choose the option that best fills gap
   71.` and assign context position/slot.
6. Parse same-paste keys by printed row number and preserve manual correction.
7. Render all slots safely and highlight only the current slot in both CBT
   pages.
8. Add adversarial fixtures: wrapped multiword cells, long cells, missing
   column, mismatched gaps/rows, tabs/spaces, and a table-like non-cloze block.
9. Integrate output with OT07's manual context/question workflow; save nothing
   automatically.
10. Run full parser, owner-tool, PHP, and candidate regressions.

## Acceptance

| Check | Expected |
|---|---|
| Supplied Q71-Q80 table | Ten linked questions with four transcribed options each |
| Multiword Q78 cells | `a vow`, `an oath`, `an allegiance`, `a pledge` remain distinct |
| Context | Gap 71-80 tokens present with paragraph structure retained |
| Generated stems | Editable and mapped to matching slot/order |
| Same-paste key | Correct rows ticked by printed number |
| Candidate | Shared context on every member; active slot highlighted |
| Multiple contexts | Cloze may coexist with comprehension/standalone groups |
| Singular paste | One cloze group works independently |
| Ambiguous table | Warning and no guessed options/context links |
| Limits | Empty/overlong option rows refused before native save |
| Regression | Clean bank/anomaly/context/owner-tool suites pass |

## Guardrails

- Do not parse columns after global whitespace collapse.
- Do not trust header positions without row evidence.
- Do not create partial cloze groups from a mismatched table.
- Do not interpret arbitrary numbered tables as cloze exercises.
- Do not auto-save or auto-activate.
- Do not start OT10.

## Handoff template

```text
Date:
Result:
Cloze recognition/column algorithm:
Fixture and adversarial coverage:
Same-paste key evidence:
Candidate slot rendering evidence:
Full regression counts:
Files changed:
Hashes:
Open questions:
Review: pending rigorous Release C review
Commit: deferred
Next: OT10 blocked/not started
```
