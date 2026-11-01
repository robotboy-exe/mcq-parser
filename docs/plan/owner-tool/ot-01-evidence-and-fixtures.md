# OT01 — Evidence and Fixtures

- **Status:** done
- **Depends on:** OT00
- **Blocks:** OT02, OT04, OT08, OT09
- **External gate:** none
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Make the newly supplied PHP and OCR samples durable evidence before any parser
or deployed-file modification.

## Source inventory

- `deployed/admin_questions.php`
- `deployed/cbt.php`
- `deployed/cbt_practice.php`
- `admin-needs.txt`
- `sample-underline.txt`
- `sample-passages.txt`

## Work

1. Record byte size and SHA-256 for every supplied source.
2. Archive immutable, date-labelled copies under `archive/live-sources/` or a
   dedicated user-sample subdirectory; document which files are production
   snapshots and which are OCR samples.
3. Add a truthful fixture origin for owner-supplied real OCR, provisionally
   `user_sample`, and enforce it in the runner.
4. Split source-backed fixture excerpts without modifying the archived source:
   uppercase `A)` options, isolated underline stems, comprehension Q11-Q15, and
   cloze rows Q71-Q80.
5. Transcribe desired expected structures from the source. Mark behavior that
   the current parser cannot express as `PENDING`; never generate expected JSON
   from parser output.
6. Record that `sample-passages.txt` contains multiple evidenced families and
   that a singular group remains a supported paste.
7. Record the missing answer-key evidence for final OT08/OT09 acceptance.
8. Update fixture documentation and package counts.

## Acceptance

| Check | Expected |
|---|---|
| Archived files | Byte-identical to supplied sources; hashes recorded |
| Provenance | Every new fixture cites exact source lines and `user_sample` |
| Uppercase `A)` | Confirmed regression fixture; current support pinned |
| Underline | Literal `<u>` markers transcribed, not interpreted by expected generation |
| Comprehension | Context and linked Q11-Q15 expected structure recorded |
| Cloze | Context/gap numbers and four source options per row transcribed |
| Runner | No orphan input; confirmed/PENDING counts match the handoff |
| Product source | No parser, UI, PHP, SQL, or deployed asset changed |

## Guardrails

- Never edit the source samples to make parsing easier.
- Do not invent correct answers absent from the supplied OCR.
- Do not classify real owner-supplied OCR as `synthetic`.
- Do not implement parsing in this package.
- Do not start OT02.

## Handoff template

```text
Date:
Result:
Archived source hashes:
Fixture origin decision:
Fixtures and assertion counts:
PASS/PENDING baseline:
Missing evidence:
Files changed:
Open questions:
Review: pending light verification at OT02 Gate 1
Commit: deferred
Next: OT02 not started
```

## Handoff

```text
Date: 2026-10-31
Result: PASS
Archived source hashes:
  - deployed/admin_questions.php -> archive/live-sources/admin_questions-2026-10-31.php (62273 bytes, SHA-256: b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028)
  - deployed/cbt.php -> archive/live-sources/cbt-2026-10-31.php (45990 bytes, SHA-256: 9ca5f7b462fe4ec0931ab590645a83bbfa0c069891c14e223ebbbb2fce0f1435)
  - deployed/cbt_practice.php -> archive/live-sources/cbt_practice-2026-10-31.php (36666 bytes, SHA-256: 94588778186a2face2129eb149e36de4e79bbd6879b2ab635ac9506bf3f6f07d)
  - admin-needs.txt -> archive/user-samples/admin-needs-2026-10-31.txt (706 bytes, SHA-256: b142d02572b790715751036da21379d03c6551ba79342b8a6d8abbd4734caa9c)
  - sample-underline.txt -> archive/user-samples/sample-underline-2026-10-31.txt (4877 bytes, SHA-256: 204b7c914ef1c5c1628eb720a52dece9930f70e180e57fcb0d183b59bf51a632)
  - sample-passages.txt -> archive/user-samples/sample-passages-2026-10-31.txt (4570 bytes, SHA-256: 428970e982ba974261fccb40e3aff76b7593fb3f62417f36072157e01dc724e1)
Fixture origin decision:
  - Added 'user_sample' to INPUT_ORIGINS in tests/runner.js for owner-supplied real OCR samples.
Fixtures and assertion counts:
  - sample-uppercase-paren-q51 (CONFIRMED, 8 checks): uppercase A) options pinned and verified.
  - sample-underline-stems (CONFIRMED, 14 checks): literal <u> markers in stems preserved.
  - sample-comprehension-passage3 (PENDING): PASSAGE III and Q11-Q15 structure documented.
  - sample-cloze-section6 (PENDING): SECTION 6 cloze passage and gap table 71-80 documented.
PASS/PENDING baseline:
  - tests/runner.js: 47 fixtures: 45 PASS, 0 FAIL, 2 PENDING
  - tests/unit.js: 140 PASS, 0 FAIL
  - tools/extract-bank.js --check: 7 bank slices OK
Missing evidence:
  - Answer keys for sample-comprehension-passage3 and sample-cloze-section6 to prove one-box answer key parsing for new context families during OT08/OT09 final acceptance.
Files changed:
  - archive/live-sources/admin_questions-2026-10-31.php
  - archive/live-sources/cbt-2026-10-31.php
  - archive/live-sources/cbt_practice-2026-10-31.php
  - archive/user-samples/admin-needs-2026-10-31.txt
  - archive/user-samples/sample-underline-2026-10-31.txt
  - archive/user-samples/sample-passages-2026-10-31.txt
  - fixtures/inputs/sample-uppercase-paren-q51.txt
  - fixtures/expected/sample-uppercase-paren-q51.json
  - fixtures/inputs/sample-underline-stems.txt
  - fixtures/expected/sample-underline-stems.json
  - fixtures/inputs/sample-comprehension-passage3.txt
  - fixtures/expected/sample-comprehension-passage3.json
  - fixtures/inputs/sample-cloze-section6.txt
  - fixtures/expected/sample-cloze-section6.json
  - tests/runner.js
  - docs/STATUS.md
  - docs/plan/README.md
  - docs/plan/prompts/phase-map.md
  - docs/plan/owner-tool/ot-01-evidence-and-fixtures.md
Open questions:
  - None.
Review: pending light verification at OT02 Gate 1
Commit: deferred
Next: OT02 not started
```
