# P01 — Fixture origin taxonomy

Status: done (2026-10-25). Depends on: none. Blocks: P02.

## Self-contained context

The bookmarklet parses OCR text pasted into one admin box. Tests live in
`fixtures/inputs/*.txt` (raw paste) and `fixtures/expected/*.json` (assertions).
`tests/runner.js` pairs them by `input_file`, runs the pure parser, and fails on
unknown assertion keys, wrong types, missing inputs, or orphan inputs.

The project now has two real OCR sources:

1. `archive/live-sources/IMPROVISED C.docx.txt` — priority 1, the clean bank.
2. `archive/live-sources/ANOMALIES.txt` — priority 2, hostile OCR.

Existing fixtures mix real bank slices, doc samples, and assistant-written
examples. This package labels that honestly before any new fixtures are added.

## Goal

Make `input_origin` a required top-level field in every expected JSON and make
the runner reject a missing or unknown value. Apply it to all 25 current
fixtures without changing any assertion or input.

## Allowed values

`bank`, `anomaly`, `doc`, `synthetic`.

- `bank` — input is a bank slice, or a bank-derived subset/excerpt. Whitespace
  changes are allowed; any truncation or marker such as `qwen1-sample2`'s `...`
  must be stated in `provenance`. This is about provenance, not byte identity.
- `anomaly` — input comes from `ANOMALIES.txt`.
- `doc` — a real sample transcribed in a migration doc, not present in the bank.
- `synthetic` — assistant-written to cover a documented behavior the sources do
  not contain. These are kept deliberately; never delete one merely because it
  is synthetic.

## Classification of the 25 current fixtures

Bank (7):

| Fixture | Note |
|---|---|
| `bank-2021` | verbatim 2021 slice including the inline answer key (added by P03) |
| `qwen2-s1-crk-2021-full` | 2021 questions only; blank lines removed, no key |
| `qwen1-sample1-quotes-before-capitals` | exact bank 2021 Q36 block |
| `qwen1-sample2-crk-header` | truncated 2021 header/options slice (`...` line) |
| `qwen1-sample3-five-options` | exact bank 2021 Q33 block |
| `qwen1-sample4-dotless-option-a` | exact bank 2021 Q35 block |
| `qwen1-sample5-question-starting-a` | exact bank 2021 Q30 block |

Doc (1):

| Fixture | Note |
|---|---|
| `qwen2-s2-article-vs-option` | user-supplied partial sample in the qwen-2 doc; not in the bank |

Synthetic (17):

| Fixture | Why it stays |
|---|---|
| `claude-s1-joseph-blank-c` | bank 2022 Q3 has `C. punish them`; this variant blanks C to cover INV-16/23 |
| `gap-q10-missing` | real user paste; synthetic because the taxonomy has no user-paste value, and Q10 was omitted by OCR |
| `header-crs-jamb-utme` | synthetic CRS category-header fixture |
| `header-crs-post-utme` | synthetic POST UTME precedence fixture |
| `header-crs-ssce` | synthetic SSCE alias fixture |
| `header-crs-utme` | synthetic bare UTME alias fixture |
| `claude-s2-father-of-faith-e-dotted` | dotted E micro-case |
| `claude-s3-father-of-faith-e-dotless` | dotless E micro-case |
| `claude-s4-father-of-faith-four-options` | four-option control case |
| `claude-s5-option-text-next-line` | option text on the following line (EC-10) |
| `qwen2-s4-article-start` | leading `A 5` article-vs-option |
| `qwen2-s4-dotless-newline-a` | dotless option after newline |
| `qwen2-s4-dotted-newline-b` | dotted/newline micro-case |
| `qwen2-s4-dotted-start` | dotted option at chunk start |
| `qwen2-s4-inline-block` | inline option block |
| `qwen2-s4-vertical-block` | vertical option block |
| `qwen2-s5-answer-key` | key-format example from the UI label |

## Steps

1. In `tests/runner.js`, add an allowed-origins set and validate `spec.input_origin`
   for every expected file, before the `PENDING` early return. Use a clear error
   such as `missing input_origin` / `unknown input_origin: "..."`.
2. Add `"input_origin": "<value>"` at the top level of all 25
   `fixtures/expected/*.json` files, using the tables above.
3. For `claude-s1-joseph-blank-c`, extend `provenance` to say it is a synthetic
   blank-C variant of bank 2022 Q3 (the bank has `C. punish them`).
4. Do not change any `expected`, `status`, `kind`, `input_file`, or input text.
5. Run the acceptance commands.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `git diff --stat` | only `tests/runner.js` and `fixtures/expected/*.json` |
| Temporarily remove `input_origin` from one spec, run runner | FAIL with `missing input_origin`; restore |
| Temporarily set `"input_origin":"bogus"`, run runner | FAIL with `unknown input_origin`; restore |

## Guardrails

- This package is schema/workflow only. Do not change parser code, inputs, or
  assertions.
- Keep the field top-level. Do not put it under `expected`; the runner rejects
  unknown `expected` keys.
- Do not reclassify a fixture to `bank` unless it is genuinely bank-derived and
  the deviation is documented. `qwen2-s1` is a whitespace-only subset, which is
  why it is `bank`; `qwen1-sample2` is a documented truncation, also `bank`;
  `claude-s1` is an altered variant, which is why it is `synthetic`.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: 25 PASS / 0 FAIL / 0 PENDING; exit 0.
Files changed: tests/runner.js and all 25 fixtures/expected/*.json. No input,
  expected, status, kind, or input_file changed. claude-s1 provenance extended
  with the bank 2022 Q3 blank-C note.
Negative checks performed: removed input_origin from qwen2-s5-answer-key ->
  FAIL "missing input_origin" (24 PASS / 1 FAIL); set it to "bogus" -> FAIL
  "unknown input_origin: \"bogus\"" (24 PASS / 1 FAIL); both restored.
Open questions: the package was written for 19 fixtures, but P03 and the
  2026-10-24 header/gap work added six more. They are classified above:
  bank-2021 is bank; the four header-crs-* fixtures are synthetic; and
  gap-q10-missing is a real user paste, classified synthetic only because the
  four-value taxonomy has no user-paste value. If a fifth value is wanted,
  that needs a decision before P02 adds more fixtures.
```
