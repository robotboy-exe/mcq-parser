# OT01 — Evidence and Fixtures

- **Status:** not started
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
