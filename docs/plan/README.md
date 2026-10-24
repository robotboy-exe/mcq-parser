# OCR Parser Work Plan — Coordinator

This is the entry point for all remaining parser/fixture work. Read this file,
then read the one work-package file you are executing. Each package document is
self-contained; you should not need any other package document to finish it.

Last updated: 2026-10-24.

## Current snapshot

- Current test status: `node tests/runner.js` → 25 PASS, 0 FAIL, 0 PENDING.
- `IMPROVISED C.docx.txt` is the priority-1 source; `ANOMALIES.txt` is priority-2.
- `ANOMALIES.txt` and the duplicate-file removals are committed.
- P02 pins the current bank hash; re-audit the manifest if the source changes.
- The former `merged_bookmarklet.txt` duplicate has been deleted. The canonical
  archived copy is `archive/trusted-variants/trusted-variant-C.js`.
- P03 is done: inline multi-pair keys are detected, and `bank-2021` is confirmed.
  P01/P02 are still pending; the 2021 input was sliced manually.

## Source hierarchy and priority

1. **`archive/live-sources/IMPROVISED C.docx.txt`** — priority 1, canonical OCR
   bank. Contains five exam-year sections: 2021–2025. SHA-256:
   `96ed3af8fb53e3ba3f2bf355a5f8094db54587996f1c8112e088dae5347c5a5c`.
2. **`archive/live-sources/ANOMALIES.txt`** — priority 2. SHA-256:
   `718ca1e70f84fcdc84280710394cdeb73e5ff62183e7b09d14e8ffc7d22e8321`.
   Block 2 (`STURCTURED GOVERNMENT QUESTIONS 2025`) is the original block that
   started the project. Block 1 is the `*`-bulleted, unnumbered family.
3. **`archive/migration-docs/`** — historical evidence and corroboration only.
4. **Synthetic fixtures** — explicit exceptions. Allowed only where no bank or
   anomaly input covers the documented behavior. They must be labelled.

## Non-negotiable rules

- The parser receives **one exam year per paste**. Extracting a year from the
  bank is an external, deterministic step; multi-year parsing is out of scope.
- Add or change behavior only with a failing fixture first. Never regenerate an
  expected fixture from parser output.
- Do not weaken the strict `OPTION`, `splitSections`, or `splitQuestions` rules
  globally to accommodate anomalies. The bank fixtures are the regression wall.
- Do not edit `src/bookmarklet.js`. Edit `src/parser/parser.js` or
  `src/ui/ui.js`, then run `node src/build/build.js`.
- Do not add `//` comments to parser/UI modules; the build produces one line.
- Do not change PHP, `ocr_helper.js`, storage keys/shapes, or the server
  contract.
- Do not commit unless the user explicitly asks.
- Keep the deliberate quirks: E/F → D collapse, advisory-only flags, blank
  options, `FIXES` order, the `+5` numbering guard, no absorbed-option
  post-processor.

## Fixture origins

Every `fixtures/expected/*.json` must eventually carry one of:

| `input_origin` | Meaning |
|---|---|
| `bank` | Slice or documented excerpt of `IMPROVISED C.docx.txt` (whitespace changes allowed; truncation noted) |
| `anomaly` | Slice of `ANOMALIES.txt` |
| `doc` | Real sample transcribed in a migration doc, not present in the bank |
| `synthetic` | Assistant-written input covering a behavior absent from the sources |

`P01` introduces and enforces this field. Until then, provenance lives in the
free-text `provenance`/`source` fields.

## Work packages

Status values: `not started`, `in progress`, `blocked`, `done`.

| ID | Document | Goal | Depends on | Status |
|---|---|---|---|---|
| P01 | [01-origin-taxonomy.md](01-origin-taxonomy.md) | Add and enforce `input_origin`; label the 19 existing fixtures | — | not started |
| P02 | [02-bank-extraction.md](02-bank-extraction.md) | Deterministic per-year extractor + 5 bank inputs + PENDING specs | P01 | not started; needed before P04–P06 |
| P03 | [03-bank-2021-inline-key.md](03-bank-2021-inline-key.md) | 2021 fixture + first parser fix: detect inline keys | P02 (deferred) | done |
| P04 | [04-bank-2022.md](04-bank-2022.md) | 2022 fixture: inline key, real dotless option, 13 E-option questions | P03 | not started |
| P05 | [05-bank-2023.md](05-bank-2023.md) | 2023 fixture: inline key + 8 E-option questions | P03 | not started |
| P06 | [06-bank-2024-2025.md](06-bank-2024-2025.md) | 2024 partial-year fixture + 2025 fixture with missing key entry | P03 | not started |
| P07 | [07-anomaly-block2-salvage.md](07-anomaly-block2-salvage.md) | Guarded salvage normalizer + block-2 fixture | P06 | not started |
| P08 | [08-anomaly-block1-bullets.md](08-anomaly-block1-bullets.md) | Unnumbered `*` question mode | P07 | not started |
| P09 | [09-docs-cleanup.md](09-docs-cleanup.md) | Docs updates, retire superseded fixtures, final audit | all | not started |

## Dependency graph

```text
P01 ──> P02 ──> P03 ──┬──> P04
                      ├──> P05
                      └──> P06 ──> P07 ──> P08
                                             │
P01 ─────────────────────────────────────────┴──> P09
```

P04, P05, and P06 can run in parallel after P03. P07 requires the whole bank
suite to be green. P09 is last.

## Session protocol

1. Run `node tests/runner.js`; record the starting result.
2. Read the package document completely before editing anything.
3. Confirm its preconditions (status of dependencies, source hashes, test count).
4. Execute the steps. Keep parser changes and fixture changes in separate
   commits/diffs when possible, but do not commit unless asked.
5. Run the package's acceptance commands. Do not mark the package done on a
   partial pass.
6. Update the status row above and append a handoff note to the package file
   (date, result, files changed, open questions, new hashes).
7. Leave the working tree in a resumable state: no orphan inputs, no failing
   fixtures, and a note explaining anything left for the next session.

## Definition of done (every package)

- `node tests/runner.js` exits 0 with the expected PASS/PENDING counts.
- No orphan inputs.
- New expectations were transcribed from the cited source and spot-checked; they
  were not copied from parser output.
- The package's own acceptance table is fully satisfied.
- Status and handoff notes are updated.
- If parser or UI changed: `node src/build/build.js` ran, `wc -l
  src/bookmarklet.js` prints `1`, and the body passes `node --check`.

## Shared commands

```sh
node tests/runner.js
node tools/extract-bank.js --check
node -e "const p=require('./src/parser/parser.js'); console.log(p.splitQuestions('1. Hello'))"
node src/build/build.js
wc -l src/bookmarklet.js
```

Build syntax check (same rule as `docs/BUILD.md`):

```sh
node -e "const fs=require('fs');const s=fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,'');new Function(s);console.log('OK')"
```

## Current expected fixture counts

| After package | PASS | PENDING | Notes |
|---|---|---|---|
| baseline | 19 | 0 | before P03 |
| P03 (done) | 20 | 0 | inline-key fix + bank-2021; P02 extractor deferred |
| P04 | 21 | 0 | bank-2022 confirmed |
| P05 | 22 | 0 | bank-2023 confirmed |
| P06 | 24 | 0 | bank-2024 and bank-2025 confirmed |
| P07 | 25 | 0 | anomaly block 2 added |
| P08 | 26 | 0 | anomaly block 1 added |
| P09 | 25 | 0 | `qwen2-s1` retired; bank-2021 covers it |

P01/P02 are not reflected above. If P02 is executed later, it adds five PENDING
specs; the 2021 one is already confirmed.

## Removed duplicates (for the audit trail)

The following 10 byte-identical duplicates were removed; the `archive/` copy is
authoritative:

- `docs/claude-migration.md`
- `docs/qwen-1-gaps.md`
- `docs/qwen-1-gaps2.md`
- `docs/qwen-1-migration.md`
- `docs/qwen-2-gaps.md`
- `docs/qwen-2-reconciled.md`
- `trusted-variant-A.js`
- `trusted-variant-B.js`
- `trusted-variant-C.js`
- `archive/live-sources/admin_questions-live-2026-10-23.html`

## Change log

- 2026-10-24 — numbering gaps are flagged on the following question
  (`gap-q10-missing`); 25 fixtures.
- 2026-10-24 — header inference extended: answer-key headers fill the form,
  exam category is inferred, CRS alias added; four synthetic header fixtures.
- 2026-10-24 — plan created; duplicates removed; ANOMALIES.txt received.
