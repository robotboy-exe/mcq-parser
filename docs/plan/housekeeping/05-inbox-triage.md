# H5 — Inbox triage

Status: done (2026-10-27)
Depends on: H3

## Goal

Park the untriaged 2020 WASSCE paper without adding a low-value fixture, and
remove inbox entries that are already fixtures.

## Scope

- Move the raw 2020 paper to `archive/inbox/2020-wassce-crs.txt`.
- Add a short triage note.
- Replace the block in `docs/NEW_EDGE_CASES.txt` with a pointer.
- Remove the two trailing cases already promoted to fixtures.

Do not add a fixture in this phase. Do not change the parser.

## Why no fixture

The block parses as 50 questions, 50 key entries, and 0 flags. Full-year WASSCE
CRS coverage already exists for 2021-2026, `bank-2026` already covers the
vertical key format, and the block's distinctive cases are already fixtures:
`new-edge-dotless-c` is Q2, `new-edge-slash-option-a` is Q17, and fused/slash
behavior is covered elsewhere.

## Steps

1. Create `archive/inbox/` and save the raw block verbatim.
2. Add `archive/inbox/README.md` with source, date, parse result, and the
   no-fixture rationale.
3. Replace the inbox block with a short entry pointing at the archive file.
4. Remove the two trailing cases that already have fixtures.
5. Run the runner and unit suite to confirm no fixture/orphan change.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 115 PASS, 0 FAIL |
| `archive/inbox/2020-wassce-crs.txt` | present and verbatim |
| `docs/NEW_EDGE_CASES.txt` | no duplicate promoted cases |
| `git diff --check` | clean |

No commit.

## Handoff

Result: done 2026-10-27. Created `archive/inbox/` and saved the 2020 WASSCE C.R.S.
block verbatim as `2020-wassce-crs.txt` (245 lines); added a triage README with
source, park date, 50/50/0 parse result, and the no-fixture rationale. Replaced
the block in `docs/NEW_EDGE_CASES.txt` with a pointer to the archive, and removed
the two trailing cases already covered by `new-edge-year-abbreviation` and
`new-edge-initials-q46`. No parser or fixture change.

Files: `archive/inbox/2020-wassce-crs.txt`, `archive/inbox/README.md`,
`docs/NEW_EDGE_CASES.txt`, `README.md`, `docs/plan/README.md`,
`docs/plan/history.md`, `docs/plan/housekeeping/05-inbox-triage.md`.
Open questions: none.
Review: independent-pass (docs/plan/reviews/housekeeping-2026-10-phase-5.md);
NOTE-1/3/4/5 fixed; NOTE-6 catch-up approved.
Commit: committed at cycle close.

Verification: runner 41 PASS / 0 FAIL / 0 PENDING; unit 115 PASS / 0 FAIL;
archived block matches the pre-edit source slice byte-for-byte; no promoted
Johoiachin/WASU cases remain in `docs/NEW_EDGE_CASES.txt`; `git diff --check`
clean. No live action.

## Fix note — cycle-level NOTEs (2026-10-27)

Result: fixed NOTE-1, NOTE-3, NOTE-4, and NOTE-5 from the housekeeping cycle
reviews. NOTE-2 needed no action (the archived map's one relative link is
correct for its new location). NOTE-6 is a cycle-close commit decision, not a
fix-session item.

Findings addressed:

- NOTE-1: `docs/plan/prompts/phase-map.md` package references are now relative
  Markdown links to `../housekeeping/`; all five resolve.
- NOTE-3: `docs/plan/README.md` now describes `docs/Active.md` as historical,
  matching its superseded banner.
- NOTE-4: `docs/Active.md` no longer tells the reader to run the removed
  `tests/build-check.js`.
- NOTE-5: `archive/inbox/README.md` and `docs/NEW_EDGE_CASES.txt` now qualify
  "0 flags" with the 3 inline-text `parseKeyDetailed` conflicts (Q3-Q5) and the
  correct last-wins key.

Files: `docs/plan/prompts/phase-map.md`, `docs/plan/README.md`,
`docs/Active.md`, `archive/inbox/README.md`, `docs/NEW_EDGE_CASES.txt`,
`docs/plan/history.md`, `docs/plan/housekeeping/05-inbox-triage.md`.

Hashes: `src/bookmarklet.js` unchanged at
`f110322ec435c8bcf3ac1e39feffb4cc92b0ca76d16bc1c95ac23d2e6c9d081d`.
Edited docs: phase-map `41f3867d...`, plan README `7f9db2aa...`,
`docs/Active.md` `0655e5ba...`, inbox README `cda503bd...`,
`docs/NEW_EDGE_CASES.txt` `29441353...`.

Tests: runner 41 PASS / 0 FAIL / 0 PENDING; unit 115 PASS / 0 FAIL;
`git diff --check` clean. No extractor or build run; docs-only.

Behavior changed: no. Review status: original review records are unchanged
(PASS); cycle-close catch-up approved 2026-10-27. No re-review required.
Commit: committed at cycle close.
