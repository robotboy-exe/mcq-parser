# P02 — Deterministic per-year bank extraction

Status: done (2026-10-25). Depends on: P01. Blocks: P03, P04, P05, P06.

## Self-contained context

The parser is designed for **one exam year per paste**. A paste can also be a
divider-delimited partial section, even a single question. The bank
`archive/live-sources/IMPROVISED C.docx.txt` contains six exam-year sections
(2021–2026) plus one unheaded single-question section between 2025 and 2026.
The bank must never be pasted whole: the section splitter and numbering guard
would pair one section's questions with another section's key. Extraction is
therefore an explicit pre-parse step, not parser behavior.

Source facts:

- File: `archive/live-sources/IMPROVISED C.docx.txt`
- SHA-256: `1395c66b75b544f7313b47bab3f08b5d702ca7878e54c0929446c4cf2debbd7b`
- 47,157 bytes; UTF-8 with BOM; the 2021–2025 block uses CRLF and the appended
  2026 block uses LF. Split on `/\r\n|\n|\r/` to get 1,766 logical lines.
- The seven extracted sections contain 233 question numbers
  (40/40/40/24/40/1/48). Only the six headed years have keys. Do not use a
  global marker count: inline options and key lines also match the marker regex.
- The 2024 section is incomplete: it starts at Q17 and has no 2024 **questions**
  header (only a 2024 answers header).
- The pre-2026 section has no year header and no key. It is its own
  divider-delimited section, not a stray part of 2025 or 2026.
- The bank is a modified working-tree file. If its hash differs from the one
  above, stop and re-derive this manifest; do not reuse these line numbers.

## Goal

Add a deterministic extractor and verbatim per-section inputs. Add PENDING
expected specs so the runner stays green and every input has a pair. Do not
write confirmed expectations in this package; that is P03–P06.

P03 ran first and created `bank-2021` as a confirmed fixture. Its input is
byte-identical to the 2021 slice below (SHA-256 `8ae2657…bf0b83`), so this
package regenerates that file without changing it and leaves its confirmed spec
alone. Only 2022–2025 get new PENDING specs.

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
| pre-2026 | 1458 | 1466 | none | `-----` | `---` | 1 | 0 |
| 2026 | 1468 | 1766 | 1717 | `WASSCE C. R. K. 2026` | `48. B` | 48 | 48 |

Notes:

- 2021–2023 keys are inline, multiple entries per line. 2024–2026 keys are one
  entry per line; pre-2026 has no key.
- 2026's answer heading is two lines (`WASSCE C. R. K. 2026` then
  `OBJECTIVE ANSWERS`); `splitSections` must keep the title out of Q48's options.
- Count question markers only in `start .. answer_header-1`; otherwise inline
  key lines also match `^\s*\d{1,3}\.\s` and inflate the count to 46.
- 2025 line 1442 is `26. [Missing from source text]`; `parseKey` must produce
  no entry for 26, hence 39 entries.
- 2024 starts at Q17. Do not invent Q1–16 and do not add a synthetic 2024
  header. The slice has no year in its first three lines; its fixture must not
  assert `header.year`.
- Leave out the `---`/`—` separators before the year headers. The pre-2026
  slice is the exception: its two dividers are its only boundaries, so include
  them and let `splitSections` strip them (D-46).
- The pre-2026 slice is keyless: the manifest uses `answer_header: null`; the
  extractor counts question markers through the end and expects 0 key entries.

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
4. Run the extractor once (without `--check`) to create all inputs, then
   fill the output hashes into `tools/bank-slices.json`.
5. Create four PENDING specs:
   `fixtures/expected/bank-2022.json` … `bank-2025.json`.
   Leave the existing confirmed `bank-2021.json` unchanged.
   Each new spec must have:
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
| `node tools/extract-bank.js --check` | exits 0, all manifest hashes/anchors/counts match |
| `node tests/runner.js` | 25 PASS, 0 FAIL, 4 PENDING (29 fixtures); exit 0; 0 orphan inputs |
| `sha256sum fixtures/inputs/bank-*.txt` | matches the manifest |
| inspect `bank-2021.txt` bytes | unchanged, starts with the BOM and 2021 header, preserves CRLF, includes lines 1–297 |
| inspect `bank-2024.txt` | starts at `17.` and includes the 2024 answer block |
| `git status --short` | only new tool, manifest, four new inputs, four PENDING specs; `bank-2021` unchanged |

## Guardrails

- This package does not change parser or UI code.
- Do not normalize whitespace, strip blank lines, or remove the BOM. The bank's
  real line endings are part of the input being tested.
- Do not create `bank-all.txt` or any multi-year fixture.
- Do not derive `expected` from the parser; PENDING is an intentional placeholder.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: 25 PASS / 0 FAIL / 4 PENDING (29 fixtures, 0 orphan); unit 59 PASS.
Output hashes (also in tools/bank-slices.json):
  2021 8ae265713214c41625f637e1ee92b126dcf51b037d1ec82dd9a4239e54bf0b83
  2022 bfa5f9b71f4d7c41d9dac19229c83c39efc1c4ab0b9d6c2d9ed7a77825a99ca8
  2023 c416a7edc8aaf13886feacf2c603059b15811b7b7931ee632731183fcc8b52ab
  2024 a575fbbd134b5208b6e8da658bffc939b2eae1e61e9d1f3599ca0a2e5e5fdc4c
  2025 6391299f4c5052fa0bcc025791ebb77b448067979cc518c680e23c43664f310b
Files changed: tools/extract-bank.js, tools/bank-slices.json,
  fixtures/inputs/bank-2022.txt..bank-2025.txt, and
  fixtures/expected/bank-2022.json..bank-2025.json. bank-2021.txt was
  rewritten identically by the extractor and is not in the diff.
Open questions: this package was written when there were 19 fixtures and no
  bank-2021. P03 added bank-2021 first; its input matches the extractor slice
  byte-for-byte, so the confirmed spec was preserved instead of replaced by a
  PENDING one. The 2024 slice still starts at Q17 (no Q1-16), and the 2024 key
  has 40 entries for 24 questions. 2025 still has 39 key entries because Q26 is
  missing from the source text. P04-P06 can now confirm the four PENDING specs.
```

Addendum 2026-10-26: the source gained the 2026 section (lines 1468–1766, 48
questions/48 key entries) and an unheaded single-question section between 2025
and 2026 (lines 1458–1466, 1 question/0 key entries). The manifest now has seven
slices. The 2025 output hash changed only because a trailing newline was added
when 2025 stopped being the end of the file. `bank-2026` is confirmed, and D-44
fixes its two-line answer heading. `bank-pre-2026` is its own divider-delimited
section; D-45 repairs its dotless A and D-46 strips the surrounding dividers.
Runner 32 PASS; unit 65 PASS; extractor `--check` green for seven slices.
