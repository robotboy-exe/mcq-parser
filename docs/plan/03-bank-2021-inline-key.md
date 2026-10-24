# P03 — Bank 2021 fixture and inline-key detection

Status: done. Depends on: P02 (deferred; the 2021 input was sliced manually). Blocks: P04, P05, P06.

## Self-contained context

`fixtures/inputs/bank-2021.txt` is the verbatim 2021 slice (lines 1–297 of
`archive/live-sources/IMPROVISED C.docx.txt`). It contains 40 questions and an
inline answer block:

```text
**ANSWERS C. R. K. 2021**
1. A   2. B   3. A   4. B   5. C   6. B   7. C
...
36. D  37. B  38. B  39. D  40. A
```

Before the fix, the parser returned `how: "none"` for this paste and dropped the key.
Reason: `KEY_LINE` does not match a line with several number-letter pairs, and
`STEM_LINE` matches the same line (`36. D  37. B ...`) as a question stem. The
structure detector therefore never sees key-like lines after the last stem.
2022 and 2023 use the same inline-key format, so this fix unblocks them too.

## Goal

Convert `bank-2021` from PENDING to CONFIRMED, make the runner assert the parsed
key for `kind: "questions"`, and fix inline-key detection in `splitSections`
only.

## Source-verified expectations

Key map (from bank lines 292–297):

```json
{"1":"A","2":"B","3":"A","4":"B","5":"C","6":"B","7":"C","8":"C","9":"C",
 "10":"D","11":"B","12":"A","13":"B","14":"A","15":"B","16":"A","17":"C",
 "18":"B","19":"B","20":"B","21":"C","22":"D","23":"D","24":"A","25":"B",
 "26":"C","27":"B","28":"D","29":"A","30":"C","31":"C","32":"B","33":"D",
 "34":"C","35":"A","36":"D","37":"B","38":"B","39":"D","40":"A"}
```

Other expected facts:

- `queue_count`: 40.
- Header: `year: 2021`; subject selects an option containing `CRS` or
  `CHRISTIAN RELIGIOUS` (CRK alias).
- `questions_with_e`: `[1, 21, 31, 32, 33, 34, 35]`.
- Q20 is fully inline: stem `The rainbow as the sign of God's convenant with
  Noah implies`, `a: "love"`, `b: "mercy"`, `c: "redemption"`,
  `d: "reconciliation"`, `flags: []`.
- Reuse the documented stem assertions from `qwen2-s1` for Q9, Q23, Q24, Q25,
  Q31, Q36, Q38.
- `forbidden_flags`: `["a letter appears twice (merged questions?)"]`.

## Steps

1. **Extend the runner for keys.** In `tests/runner.js`:
   - add `key` to `ASSERTED_KEYS.questions`;
   - in `runFixture` for `kind: "questions"`, when `expected.key` is present,
     compare `parser.parseKey(actual.sections.answers)` with it using the
     existing `deepEqual` helper.
   This is a harness assertion only; it does not change parser behavior.
2. **Write the fixture.** Replace the PENDING body of
   `fixtures/expected/bank-2021.json` with the facts above. Keep
   `input_origin: "bank"`, `kind: "questions"`, and the source/provenance text.
3. **Confirm the failure.** Run the runner. `bank-2021` must FAIL because the
   key is empty/not detected. If it passes, stop: the input or the runner
   change is wrong.
4. **Fix only `splitSections`.** In `src/parser/parser.js`:
   - move `pairs` above `isKey` if needed for clarity;
   - change `isKey` to
     `t => KEY_LINE.test(t) || PLACEHOLDER.test(t) || pairs(t) >= 2`;
   - leave `isStem` as `!isKey(t) && STEM_LINE.test(t)`.
   Rationale: a line with two or more `number + letter` pairs is a key line, not
   a question stem. `INLINE_PAIR` requires a number, so an option-only line such
   as `A. love B. mercy ...` is not affected.
5. Run the runner. `bank-2021` must pass and all previous fixtures must stay
   green.
6. Rebuild and syntax-check the bookmarklet (commands below).
7. Record the fix and the new test count in the handoff note.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 20 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node -e "const p=require('./src/parser/parser.js');const fs=require('fs');const s=p.splitSections(fs.readFileSync('fixtures/inputs/bank-2021.txt','utf8'));console.log(s.how,Object.keys(p.parseKey(s.answers)).length)"` | non-`none`, `40` |
| `git diff src/parser/parser.js` | only `splitSections`/`isKey` (and `pairs` ordering if moved) |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds, prints `1` |
| `node -e "const fs=require('fs');new Function(fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,''))"` | exits 0 |

## Guardrails

- Do not change `OPTION`, `splitQuestions`, `parseQuestion`, `parseKey`, `LOOSE`,
  or `FIXES`.
- Do not special-case 2021. The fix must be general inline-key recognition.
- Do not drop the key from the fixture to make it pass.
- If `pairs(t) >= 2` causes any existing fixture to fail, stop and report; do
  not widen or narrow the rule without a fixture that proves the need.

## Handoff note (append when done)

```text
Date: 2026-10-24
Result: 20 PASS / 0 FAIL / 0 PENDING
Parser diff summary: `isKey` now treats a line with two or more `INLINE_PAIR`s as a key; `pairs` moved above `isKey`.
Unexpected fixture changes: none; added `bank-2021` input/expected and runner `key` assertion.
Open questions: P02 extractor still pending; P04–P06 still need their bank inputs.
```
