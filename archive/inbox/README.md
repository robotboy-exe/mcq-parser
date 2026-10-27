# Inbox archive

## 2020 WASSCE C.R.S. objective paper

- Source: 2020 WASSCE Christian Religious Studies objective paper, copied
  verbatim from `docs/NEW_EDGE_CASES.txt`; upstream source date not recorded.
- Parked: 2026-10-27 during housekeeping H5.
- Parse result: 50 questions, 50 key entries, 0 question flags.
- Key-only caveat: `parseKeyDetailed` reports 3 conflicts (Q3 D/B, Q4 C/B,
  Q5 B/C) from inline option text such as `A. 5 B. 4 C. 3 D. 2`, not from the
  answer-key lines. `parseKey` last-wins gives the correct key (Q3 B, Q4 B,
  Q5 C); "0 flags" is not a conflict-free key-only parse.
- Status: parked, not a defect and not a fixture.

No fixture was added. Full-year WASSCE CRS coverage already exists for 2021–2026,
`bank-2026` already covers the vertical answer-key format, and the block's
distinctive cases are already fixtures: `new-edge-dotless-c` is Q2,
`new-edge-slash-option-a` is Q17, and the fused/slash behavior is covered
elsewhere. Adding another full-year paper would duplicate coverage.

The raw text is [`2020-wassce-crs.txt`](2020-wassce-crs.txt). Do not place it in
`fixtures/inputs/` without an expected spec; the runner treats an unmatched
input as an orphan.
