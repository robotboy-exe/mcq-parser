# P08 — Anomaly block 1 (unnumbered `*` questions)

Status: not started. Depends on: P07. Blocks: P09.

## Self-contained context

The first 95 lines of `archive/live-sources/ANOMALIES.txt` are a different OCR
family from block 2: every question starts with `*` (sometimes indented by one
space), has **no number**, and has four indented options `A.`–`D.`. There are
exactly **19** bullets (lines 1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61,
66, 71, 76, 81, 86, 91). Line 96 is blank; line 97 is the separator.

The current parser sees no numbered markers. Because the whole text contains
many option matches, `splitQuestions` emits one head chunk for the entire block;
`parseQuestion` then finds duplicate letters and produces garbage. This family
needs an explicit bullet mode, not the numbered-mode heuristics.

## Goal

Parse the bullet family as 19 questions with `num: null`, preserving the
existing `question number missing` flag, and leave numbered behavior untouched.

## Design

Add to `src/parser/parser.js`:

```js
function splitBulletQuestions(text) {
  const marks = [...text.matchAll(/(?:^|\n)[^\S\n]*\*[^\S\n]+/g)];
  if (marks.length < 2) return null;
  return marks.map((m, i) => ({
    num: null,
    text: text.slice(m.index + m[0].length, marks[i + 1]?.index)
  }));
}

function splitQuestionItems(text) {
  if (/(?:^|\n)[^\S\n]*\d{1,3}\.\s+/.test(text)) return splitQuestions(text);
  const bullets = splitBulletQuestions(text);
  return bullets || splitQuestions(text);
}
```

Notes:

- The bullet marker and its following spaces are consumed, so the stem does not
  start with `*`.
- `splitBulletQuestions` returns `null` below two bullets, so a stray `*` in a
  normal paste does not switch modes.
- Numbered mode is selected whenever any line-start `N.` marker exists. Do not
  mix bullet and numbered chunks in one paste.
- `parseQuestion` already adds `question number missing` for `num: null` and
  already handles indented `A.`–`D.` options.
- Do not add comments to the module.

Integrate:

1. Export `splitBulletQuestions` and `splitQuestionItems`.
2. `src/ui/ui.js` `ocr_load`: replace
   `splitQuestions(text).map(parseQuestion)` with
   `splitQuestionItems(text).map(parseQuestion)`.
3. `tests/runner.js` `parseFixture` for `kind: "questions"`: same replacement.
4. Keep the P07 salvage flag behavior unchanged.

## Fixture

1. Create `fixtures/inputs/anomaly-block1.txt` from lines 1–95 of
   `ANOMALIES.txt` (exclude the blank line 96 and the separator). Preserve the
   bytes, indentation, and blank lines.
2. Create `fixtures/expected/anomaly-block1.json`:
   - `schema_version: 1`, `id: "anomaly-block1"`, `kind: "questions"`,
     `input_origin: "anomaly"`, `status: "CONFIRMED"`.
   - `queue_count: 19`.
   - Assertions (source-verified):
     - index 0: `question: "Profit maximization is characteristic of"`,
       `a: "capitalism"`, `b: "communism"`, `c: "communalism"`,
       `d: "feudalism"`, `flags: ["question number missing"]`.
     - index 3: `question_contains: ["The payment of tax by citizens as and
       when due is a"]`, `b: "duty and obligation"`.
     - index 11: `question_contains: ["In the Oyo Empire, the Are-Ona Kakanfo
       resided outside the capital city in order to"]`.
     - index 18: `question_contains: ["The Code Conduct Bureau requires public
       officials to"]`, `a: "declare their assets before taking office"`,
       `d: "be punished for malpractice"`, `flags: ["question number
       missing"]`.
   - `forbidden_flags`: `["a letter appears twice (merged questions?)",
     "question text missing or very short"]`.
3. Run the runner. The fixture must pass without touching block 2 or the bank.

## Steps

1. Add and export the two functions.
2. Update UI and runner to use `splitQuestionItems`.
3. Add the input and fixture.
4. Run the full suite, build, and syntax-check.
5. Record the exact bullet count and any flag differences.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 26 PASS, 0 FAIL, 0 PENDING; exit 0 |
| block-1 probe | 19 items, all `num === null` |
| block-2 probe | still 12 items, unchanged |
| bank probe | unchanged; no salvage inserts |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds, prints `1` |
| bookmarklet `new Function(...)` check | exits 0 |

## Guardrails

- Do not assign synthetic question numbers. `num` stays `null`; the flag is the
  honest signal.
- Do not run the bullet splitter when numbered markers exist.
- Do not merge this with the salvage normalizer; block 1 has no fused
  number/label boundaries.
- Do not alter the `+5` numbering guard, `OPTION`, or `parseQuestion` flags.
- Do not add `//` comments to source modules.

## Handoff note (append when done)

```text
Date:
Result: 26 PASS / 0 FAIL / 0 PENDING
Bullet count:
Flag differences:
Open questions:
```
