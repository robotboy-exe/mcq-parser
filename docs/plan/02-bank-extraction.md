# P02 — Deterministic per-year bank extraction

Status: not started. Depends on: P01. Blocks: P03, P04, P05, P06.

## Self-contained context

The parser is designed for **one exam year per paste**. The bank
`archive/live-sources/IMPROVISED C.docx.txt` contains five exam-year sections:
2021–2025. The bank must never be pasted whole: the section splitter and
numbering guard would pair one year's questions with another year's key.
Extraction is therefore an explicit pre-parse step, not parser behavior.

Source facts:

- File: `archive/live-sources/IMPROVISED C.docx.txt`
- SHA-256: `96ed3af8fb53e3ba3f2bf355a5f8094db54587996f1c8112e088dae5347c5a5c`
- 35,546 bytes; UTF-8 with BOM; CRLF line endings. Split on `/\r\n|\n|\r/` to
  get 1,456 logical lines.
- The five extracted years contain 184 question numbers (40/40/40/24/40). Do not
  use a global marker count: inline options and key lines also match the marker
  regex.
- The 2024 section is incomplete: it starts at Q17 and has no 2024 **questions**
  header (only a 2024 answers header).
- The bank is a modified working-tree file. If its hash differs from the one
  above, stop and re-derive this manifest; do not reuse these line numbers.

## Goal

Add a deterministic extractor and five verbatim per-year inputs. Add PENDING
expected specs so the runner stays green and every input has a pair. Do not
write confirmed expectations in this package; that is P03–P06.

## Slice manifest

Line numbers are 1-based logical lines after decoding the file and splitting on
`/\r\n|\n|\r/`. Slices are inclusive. Preserve the original newline sequence:
do not re-join with a fixed separator. The 2021 slice starts with a BOM;
preserve it. Preserve blank lines and leading spaces.

| Year | Start | End | Answer header | First-line anchor | Last-line anchor | Questions | Key entries |
|---|---:|---:|---:|---|---|---:|---:|
| 2021 | 1 | 297 | 291 | `IMPROVISED C. R. K. QUESTIONS FOR 2021 (P.M. Onoriode, Unilag)` | `36. D  37. B  38. B  39. D  40. A` | 40 | 40 |
| 2022 | 303 | 606 | 600 | `IMPROVISED C. R. K. QUESTIONS FOR 2022` | `36. D  37. E  38. D  39. C  40. A` | 40 | 40 |
| 2023 | 612 | 909 | 903 | `STRUCTURED C. R. K QUESTIONS 2023` | `36. B  37. A  38. A  39. A  40. C` | 40 | 40 |
| 2024 | 915 | 1127 | 1087 | `17. Daniel could not be harmed by the lions because` | `40. B` | 24 | 40 |
| 2025 | 1133 | 1456 | 1416 | `STRUCTURED C. R. K. 2025 OBJECTIVE QUESTIONS` | `40. D` | 40 | 39 |

Notes:

- 2021–2023 keys are inline, multiple entries per line. 2024–2025 keys are one
  entry per line.
- Count question markers only in `start .. answer_header-1`; otherwise inline
  key lines also match `^\s*\d{1,3}\.\s` and inflate the count to 46.
- 2025 line 1442 is `26. [Missing from source text]`; `parseKey` must produce
  no entry for 26, hence 39 entries.
- 2024 starts at Q17. Do not invent Q1–16 and do not add a synthetic 2024
  header. The slice has no year in its first three lines; its fixture must not
  assert `header.year`.
- Leave out the `---`/`—` separators before the headers.

## Steps

1. Create `tools/extract-bank.js` (plain Node, no dependencies).
2. Encode the table above in a manifest. Suggested shape:
   `tools/bank-slices.json` with `{year, start, end, answer_header, first, last,
   questions, key_entries, sha256}` per slice. The extractor reads this file.
3. The extractor must:
   - verify the source SHA-256 before doing anything;
   - decode UTF-8 and split into `{text, separator}` records on
     `/\r\n|\n|\r/`; slice records inclusively and re-join each line with its
     own original separator;
   - verify the first/last anchors after trimming the BOM and whitespace;
   - count question markers with `/^\s*\d{1,3}\.\s/` only before
     `answer_header`;
   - count key entries independently (regex over the key lines, not the parser);
   - write `fixtures/inputs/bank-YYYY.txt`;
   - print and record each output's SHA-256 in the manifest;
   - support `--check`, which verifies the manifest, source hash, first/last and
     answer-header anchors, counts, and every existing output's hash without
     rewriting files.
4. Run the extractor once (without `--check`) to create the five inputs, then
   fill the output hashes into `tools/bank-slices.json`.
5. Create five PENDING specs:
   `fixtures/expected/bank-2021.json` … `bank-2025.json`.
   Each must have:
   - `schema_version: 1`
   - `id` = `bank-YYYY`
   - `input_origin: "bank"`
   - `status: "PENDING"`
   - `kind: "questions"`
   - `input_file: "fixtures/inputs/bank-YYYY.txt"`
   - `source` citing the bank path and slice lines
   - `provenance` describing the slice
   - `expected: {}`
6. Run the acceptance commands.

## Acceptance

| Command | Expected |
|---|---|
| `node tools/extract-bank.js --check` | exits 0, all five hashes/anchors/counts match |
| `node tests/runner.js` | 19 PASS, 0 FAIL, 5 PENDING; exit 0; 0 orphan inputs |
| `sha256sum fixtures/inputs/bank-*.txt` | matches the manifest |
| inspect `bank-2021.txt` bytes | starts with the BOM and 2021 header, preserves CRLF, includes lines 1–297 |
| inspect `bank-2024.txt` | starts at `17.` and includes the 2024 answer block |
| `git status --short` | only new tool, manifest, five inputs, five PENDING specs |

## Guardrails

- This package does not change parser or UI code.
- Do not normalize whitespace, strip blank lines, or remove the BOM. The bank's
  real line endings are part of the input being tested.
- Do not create `bank-all.txt` or any multi-year fixture.
- Do not derive `expected` from the parser; PENDING is an intentional placeholder.

## Handoff note (append when done)

```text
Date:
Result: 19 PASS / 0 FAIL / 5 PENDING
Output hashes:
Files changed:
Open questions:
```
