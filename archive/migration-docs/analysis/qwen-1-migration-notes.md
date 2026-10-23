# qwen-1-migration.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/qwen-1-migration.md` (19530 bytes).

## Code snapshots

| # | Location | Bytes | SHA-256 | Identity |
|---|---|---|---|---|
| 1 | Section 1, javascript fenced block | 10395 | e081d842…2d361a6b | Distinct two-textarea version, earlier than trusted-variant-B |

This snapshot is the only copy of the "V1 bulletproof" regex version in the
archive. It is not byte-identical to any trusted variant.

## Relationship to trusted variants

Diff against `trusted-variant-A.js` (10318 bytes) is limited to the option
regex and option slicing:

- `OPTION` changes from A's lookbehind form
  `/(?<![A-Z])([A-F])\s*[.)]\s*/g` to the dual-branch form
  `/(?:^\s*([A-F])\s*[.)]\s*|\n\s*([A-F])(?:\s*[.)]\s*|\s+(?=\d))\s*/g`.
- `parseQuestion` uses `const letter = m[1] || m[2]` and collapses whitespace
  per extracted slice instead of collapsing the whole text first.

This matches the version that `qwen-2-reconciled.md` labels **V1
("bulletproof")** and later supersedes (V1 failed inline Q20 options).

## Context

- Presents this as "the most stable and complete version from the conversation"
  and instructs pasting it as a bookmark.
- Two separate textareas: question OCR text and answer key.
- Includes a parser behavior spec, edge case table, invariants, risks, samples,
  decision log and handoff notes.

## Spec claims (doc, not independently verified)

- Section splitting regex `/(?:^|\n)\s*(\d{1,3})\.\s+/g`.
- Dual-condition option regex: dotted/parenthesised at chunk start or after a
  newline; dotless accepted after a newline only when followed by a digit.
- Answer key regex `/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g`.
- Header: first 4-digit `20\d\d` year; CRK→CRS alias; otherwise fuzzy subject
  overlap scoring.
- Edge cases claimed "Handled": lowercase start, header false positive,
  missing-dot OCR, 5/6 options with and without key, late key load, no scroll,
  duplicate UI.
- Invariants: backend accepts exactly 4 options; ≤500 chars; activation only on
  Add-a-New-Question; must remove `ocr_helper.js`; `#ans_res` injected after
  submit.
- Risks: dual-condition regex, subject overlaps, success string, 500-char
  overflow when appending E/F.
- Samples S1–S5 (quotes/capitals, C.R.K. header, 5 options, missing dot,
  question starting with "A").

## Known limitations noted

- 5/6-option handling is lossy; appending E/F to D can exceed 500 chars.
- Images/videos must be uploaded manually.
- Fuzzy subject matching is uncertain for abbreviations/similar names.

## Notes

No trusted variant matches this snapshot, so it is evidence for the lineage but
not a baseline candidate.
