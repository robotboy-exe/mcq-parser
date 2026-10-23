# qwen-2-reconciled.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/qwen-2-reconciled.md` (57209 bytes).

## Code snapshots

| # | Location | Bytes | SHA-256 | Identity |
|---|---|---|---|---|
| 1 | Section 1.1, javascript fenced block | 11065 | a6336790…3df3be9 | Same code as `trusted-variant-B.js` (apart from trailing newline) |
| 2 | Section 1.2, javascript fenced block | 2332 | a3cf2545…db2857d23 | Readable `parseQuestion` companion only, not standalone |

The readable companion matches the V4 `parseQuestion` including the
absorbed-option post-processor. `OPTION` must be taken from 1.1.

## Version lineage recorded

| ID | OPTION regex | Superseded because |
|---|---|---|
| V0 | `/(?<![A-Z])([A-F])\s*[.)]\s*/g` | Matches trusted-variant-A; prose false positives, one capture |
| V1 | `/(?:^\s*([A-F])\s*[.)]\s*\|\n\s*([A-F])(?:\s*[.)]\s*\|\s+(?=\d))\s*)/g` | Matches qwen-1-migration snapshot; failed Q20 inline options |
| V2 | `/(?:^\n\|\s)([A-F])\s*[.)]\s*\|(?:^\|\n)\s*([A-F])\s+(?=\d)/g` | `^` in dotless branch caused false duplicate A on Q35 |
| V3 | dotless `^` removed, no post-processor | Empty `C.` absorbed `D.` |
| V4 | V3 + absorbed-option post-processor | Active FINAL (trusted-variant-B) |

Note: the V1/V2 regex strings in the lineage table are shown with an escaped
`\|`; treat them as historical illustrations. The exact V1 code is preserved
in `qwen-1-migration.md`.

## Context

- Reconciles two earlier migration bundles (Variant 1 = qwen-1, Variant 2 =
  qwen-2) into one document.
- Declares the active artifact "most complete / final accepted version" with
  the user's post-version remark "damn I think we did it".
- Actively resolves some uncertainties using the `admin_questions.php` source
  (the companion `qwen-2-gaps.md` corrections: PRG success is guaranteed,
  E/F merge is a hard constraint, flags precede hard server rejection).

## Spec claims (doc, not independently verified)

- Same parser behavior as B: dual capture, absorbed-option post-processor,
  `clean` per slice, E/F loose only in C (not B).
- E/F with key replaces D and sets index 3; without key appends to D.
- Server constraints: exactly 4 non-empty options, ≤500 chars each,
  `correct_option` 0–3, `exam_year` 1900–2100, categories `id <= 10`,
  question/explanation ≤60000 chars, CSRF token, PRG flash success text.
- `exam_category_id` never inferred.
- `ocrSubmitted` is read/deleted but never written by this bookmarklet.
- 30 edge cases (E01–E30), 28 invariants, 15 regression risks.

## Samples

- S1: full 40-question CRK 2021 block with header, E options, inline Q20,
  underscores, quoted stems, and the Q11/Q12 continuation line.
- S2: truncated stem `A 5 year old...` + dotless `A 75 years`.
- S3: empty option C followed by `D. seek revenge`.
- S4: assistant-constructed micro-examples (explicitly not user OCR).
- S5: answer key string `1.B 2.C 3.A`.

## Known uncertainties (doc)

- Post-processor can false-positive; does not update count/pos/marks.
- `pos` last-write-wins for duplicate letters.
- Numbering gaps > 5 merge questions.
- E/F collapse is lossy (framed later as a hard server constraint by
  `qwen-2-gaps.md`).
- `tick()` for E/F uses radio value 4/5 in B (fixed in trusted-variant-C).
- Fetch success-string coupling (claimed guaranteed by qwen-2-gaps).
- Repeated injection creates new intervals.
- Subject fuzziness; year first-match.
- `ocr_helper.js` source never supplied.

## Relationship to other sources

V4 (this document's active artifact) is the last two-textarea version. The
later merged one-box successor is documented in `claude-migration.md` and
identical to `trusted-variant-C.js`.
