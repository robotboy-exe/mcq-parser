# P07 — Anomaly block 2 and guarded salvage

Status: done. Depends on: P06. Blocks: P08.

## Self-contained context

`archive/live-sources/ANOMALIES.txt` (SHA-256
`718ca1e70f84fcdc84280710394cdeb73e5ff62183e7b09d14e8ffc7d22e8321`) contains a
hostile OCR block after the `==================================` separator (line 97).
The block is 17 lines (99–115), starts with `STURCTURED GOVERNMENT QUESTIONS
2025`, and ends with `202.`.

The current strict parser produces **4 chunks** (`null, 2, 7, 8`). The original
deployed helper produced **12 chunks** (`null, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15,
16`) because it tokenized mid-line markers and fused option labels. Those
tolerant rules are exactly what break the bank (the `C.` in the 2021 header
`C. R. K.` becomes a spurious head chunk), so they must not replace the strict
parser.

The agreed design is a **guarded pre-pass**: normalize OCR boundaries only when
the text shows multiple fused boundaries, then parse with the strict parser. If
the pre-pass does not produce more questions, discard it and use the strict
result byte-for-byte.

## Goal

Recover the recoverable block-2 questions, flag the salvaged chunks, and prove
the bank is unchanged.

## Source facts (do not invent)

Recoverable question markers in block 2: `null, 2, 3, 4, 7, 8, 9, 12, 13, 14,
15, 16`.

Known damage that must stay visible:

- Q1 has no stem and no number; its four options are on line 100. The head
  chunk (`num: null`) carries the header text as its question.
- Q4 absorbs the unnumbered Q5 and Q6 text (`Constitutionalism...`,
  `Citizenship can be acquired by...`). There is no `5.` or `6.` marker.
- `for.9.Which` is repaired to a newline before `9.`, so Q9 exists. Q9 then
  absorbs Q10's option block because there is no `10.` marker.
- Q11 is empty (`11. 12.`); do not create Q11. Q12 starts after the repair.
- Q16 only has A and B; C and D are absent in the source.
- The trailing `202.` is not a question and must be dropped by the existing
  `+5` numbering guard.

Target output is therefore 12 chunks. If a correct implementation yields a
different count, stop and document the discrepancy before changing the target.

## Design

Add to `src/parser/parser.js` (export both functions):

```js
function salvageNormalize(raw) {
  let inserts = 0;
  let text = raw.replace(/([^\s\d])(\d{1,3})\.(\s*)(?=[A-Z"'(]|$)/gm, (m, pre, n, sp) => {
    inserts++;
    return pre + '\n' + n + '.' + (sp || ' ');
  });
  text = text.replace(/([^\r\n])([ \t]+)(\d{1,3})\.(\s*)(?=[A-Z][a-z])/g, (m, pre, ws, n, sp) => {
    inserts++;
    return pre + '\n' + n + '.' + (sp || ' ');
  });
  text = text.replace(/([^A-Za-z\s]|[a-z])([A-F])\./g, (m, pre, letter) => {
    inserts++;
    return pre + ' ' + letter + '.';
  });
  return { text, inserts };
}

function splitSectionsWithSalvage(raw) {
  const strict = splitSections(raw);
  const repair = salvageNormalize(raw);
  if (repair.inserts < 2) return { parts: strict, salvaged: false, inserts: 0 };
  const repaired = splitSections(repair.text);
  const before = splitQuestions(strict.questions).length;
  const after = splitQuestions(repaired.questions).length;
  if (after <= before) return { parts: strict, salvaged: false, inserts: 0 };
  return { parts: repaired, salvaged: true, inserts: repair.inserts };
}
```

Rules:

- Insert a newline before a mid-line `N.` when the number is followed by a
  capital letter, quote, opening paren, or end of line. Add a single space after
  the dot if the source omitted it (`14.The` → `14. The`). This is the old
  helper's tolerant marker rule, applied as a boundary repair.
- Also repair a marker that follows an inline run of spaces when the next word
  is capitalized (`people11. 12. In a federal...`). This is the only way Q12 is
  recovered; the lookahead requires a multi-letter capitalized word so inline
  key lines such as `1. A   2. B` are not split.
- Insert a space before a fused `X.` label when it is preceded by a lowercase
  letter or punctuation/digit (`inA.Italy` → `in A.Italy`,
  `disenfranchised.D.the` → `disenfranchised. D.the`). Do not match an uppercase
  letter before the label, so `A.B` sequences are left alone.
- These exact rules were simulated against both sources: 0 inserts on the whole
  bank and 12 chunks on block 2. Treat that as the expected baseline.
- Do not rewrite option text, do not apply `FIXES` here, and do not normalize
  whitespace.
- Trigger only at `inserts >= 2` **and** only if the repaired text yields more
  question chunks. Otherwise the strict result is used and the input is
  untouched.
- Do not add `//` comments to the module; the build flattens it to one line.

Integrate:

1. `src/ui/ui.js` `ocr_load`: replace `const parts = splitSections(raw);` with
   the `splitSectionsWithSalvage` result. Use `parts` exactly as before. When
   `salvaged`, append the flag below to every parsed item and add a short note to
   `ocr_status` such as `OCR boundaries repaired (N inserts); verify the split.`
2. `tests/runner.js` `parseFixture` for `kind: "questions"`: use
   `splitSectionsWithSalvage`; when `salvaged`, append the same flag to every
   item. This keeps the harness and the bookmarklet on one code path.
3. Flag text (exact):
   `OCR boundaries repaired; verify question and option split`.

## Fixture

1. Create `fixtures/inputs/anomaly-block2.txt` from lines 99–115 of
   `ANOMALIES.txt`, preserving the bytes and blank lines (no separator line).
2. Create `fixtures/expected/anomaly-block2.json`:
   - `schema_version: 1`, `id: "anomaly-block2"`, `kind: "questions"`,
     `input_origin: "anomaly"`, `status: "CONFIRMED"`.
   - `queue_count: 12`.
   - `questions` entries with `num` (or `index: 0` for the null chunk):
     - `index: 0`: `question_contains: ["STURCTURED GOVERNMENT QUESTIONS 2025"]`,
       `a: "socialism"`, `b: "totalitarianism"`, `c: "capitalism"`,
       `d: "feudalism"`.
     - Q2: `question_contains: ["Fascism as a system of government originated
       in"]`, `a: "Italy"`, `b: "Germany"`, `c: "France"`, `d: "Britain"`.
     - Q3: `question_contains: ["A country is said to be democratic if"]`,
       `b: "there are free and fair elections"`.
     - Q7: `question_contains: ["An organization whose ultimate aim is to gain
       the"]`, `a: "pressure group"`, `b: "political"`,
       `c: "trade union"`, `d: "professional association"`. Do not put
       `govemment` in the needle: `FIXES` corrects it before parsing.
     - Q12: `question_contains: ["In a federal system of government, the center
       is"]`, `a: "superior to the other components"`.
     - Q16: `a: "parliamentary system 202."`, `b: "unitary system"` (source
       order is `B.unitary systemA.parliamentary system202.`; the page number
       remains attached to option A because the `+5` guard drops Q202).
   - Assert the number sequence exactly with a new `nums` key:
     `nums: [null, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16]`.
     Add `nums` to `ASSERTED_KEYS.questions`; validate it as an array whose
     entries are integers or `null`; compare it with
     `actual.items.map(item => item.num)` using `deepEqual`. Asserting each
     `num` individually does **not** prove order.
   - Do not assert Q4/Q9 exact flags; they are known-merged chunks. Assert their
     stems only (`Constitutionalism is synonymous with`; `Which of the following
     protect the rights of the individual in a State?`).
   - `forbidden_flags`: `["question text missing or very short"]` only if the
     head chunk's header text is long enough to avoid it; verify before adding.
3. Add a bank non-regression probe test. Simplest: a `node -e` command in the
   handoff/acceptance, not a new fixture:
   - `salvageNormalize` on each `fixtures/inputs/bank-YYYY.txt` returns
     `inserts === 0` and `text === input`.
   If any bank input triggers an insert, stop and narrow the regex; do not
   accept a bank change.

## Steps

1. Add the two functions and exports.
2. Update UI and runner integration.
3. Add `nums` support to `tests/runner.js` (schema validation and comparison).
4. Add the block-2 input and fixture.
5. Run the runner; expect `anomaly-block2` to pass and the bank suite to stay
   green. If the block-2 count is not 12, stop and report.
6. Rebuild and syntax-check the bookmarklet.
7. Run the bank no-op probe and record the result.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| block-2 probe | 12 items; nums `[null,2,3,4,7,8,9,12,13,14,15,16]` |
| bank no-op probe | `inserts === 0` for all five bank inputs |
| `git diff src/parser/parser.js` | only the two new functions/exports |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds, prints `1` |
| bookmarklet `new Function(...)` check | exits 0 |

## Guardrails

- Do not replace `OPTION`, `splitSections`, or `splitQuestions` with the old
  helper's regexes. The salvage pre-pass is additive.
- Do not invent Q5, Q6, Q10, or Q11, and do not split the merged Q4/Q9 chunks by
  guessing.
- Do not let salvage run on clean text. The `after > before` gate is mandatory.
- Do not add `//` comments to source modules.
- Do not change the PHP or the server contract.

## Handoff note (append when done)

```text
Date: 2026-10-24
Result: 25 PASS / 0 FAIL / 0 PENDING
Block-2 nums: [null, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16] (12 chunks)
Inserts on block 2: 50 (triggered; after=12 > before=4)
Bank no-op result: inserts 0 and text unchanged for all five bank inputs
Files changed: src/parser/parser.js (two functions + exports), src/ui/ui.js
  (salvage integration + status note), tests/runner.js (salvage integration,
  nums schema/compare), fixtures/inputs/anomaly-block2.txt,
  fixtures/expected/anomaly-block2.json, rebuilt src/bookmarklet.js.
Open questions: none. Q4/Q9 remain merged and Q13/Q16 keep missing-option
  flags, as the source dictates; only stems are asserted for Q4/Q9.
```
