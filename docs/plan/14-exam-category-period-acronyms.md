# P11 — Exam-category period acronyms

Status: done (2026-10-27); light-verified, commit at phase 3 start. Depends on:
P10 (done). Blocks: P12.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

User request 2026-10-27. Bare `SSCE` and `WASSCE` already map to the single
live option `WASCE / NECO / GCE`, but period-separated headers such as
`S.S.C.E.` and `W.A.S.S.C.E.` do not match. The fix is category inference only;
do not change subject inference, section splitting, or the header text returned
by `parseHeader`.

P0 inbox cleanup is done. The raw Q46 case remains in
`docs/NEW_EDGE_CASES.txt` for P12.

## Preconditions

- `node tests/runner.js` → 37 PASS, 0 FAIL, 0 PENDING.
- `node tests/unit.js` → 66 PASS, 0 FAIL.
- `node tools/extract-bank.js --check` exits 0.
- No parser or fixture changes from P12 yet.

## Work

1. Add a pure `compactExamAcronyms(text)` helper in `src/parser/parser.js`.
   Collapse runs like `(?:[A-Z]\.\s*){2,}[A-Z]?` to letters only, then normalize
   `POSTUTME` to `POST UTME`. Leave the original header untouched.
2. Call the helper only inside `pickCategoryIndex` before the category rules.
   Do not apply it to `pickSubjectIndex`; the CRS alias already accepts
   `C.R.S.`.
3. Unit-test the helper through `pickCategoryIndex` against the archived live
   category list:
   - `SSCE` and `WASSCE` keep the existing mapping.
   - `S.S.C.E.`, `W.A.S.S.C.E.`, `W.A.S.C.E.`, `W.A.E.C.`, `N.E.C.O.`,
     `G.C.E.` map to `WASCE / NECO / GCE`.
   - `J.A.M.B.` and `U.T.M.E.` map to `JAMB / UTME`.
   - `P.O.S.T. U.T.M.E.` maps to `POST UTME`.
   - A non-exam header such as `GENERAL PRACTICE` is unchanged.
4. Add `fixtures/inputs/header-crs-ssce-periods.txt` and its expected spec.
   Header: `CRS S.S.C.E. 2023`. Expected category: `WASCE / NECO / GCE`.
   Copy the question/key shape from `header-crs-ssce`; transcribe the expected
   category from the archived live category list, not from parser output.
5. Update `docs/DECISIONS.md` D-54, `docs/SPEC.md` header inference,
   `docs/INVARIANTS.md` INV-45, the relevant `docs/EDGE_CASES.md` row, and the
   `docs/plan/README.md` status/changelog.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 38 PASS, 0 FAIL, 0 PENDING; no orphan inputs |
| `node tests/unit.js` | 66 plus the new acronym tests PASS |
| `node tools/extract-bank.js --check` | unchanged, green |
| `node src/build/build.js` | `src/bookmarklet.js` one line, no `%`, body parses |
| Docs | D-54, SPEC, INV-45, EC, README updated |
| `git diff --stat` | only intended source, fixture, and docs files |

## Guardrails

- `SSCE` and `WASSCE` must resolve to the same `WASCE / NECO / GCE` option.
  Do not create or prefer a separate SSCE/WASSCE category.
- Do not change the bare-acronym rules or the CRS subject alias.
- Do not rewrite header text stored in `parseHeader` output; normalize only the
  local copy used by `pickCategoryIndex`.
- No new storage keys and no Auto-Save gate changes.
- Do not rebuild `src/bookmarklet.min.js`.

## Handoff note (append when done)

```text
Date: 2026-10-27
Result: done. compactExamAcronyms normalizes period-separated exam acronyms on a
local header copy inside pickCategoryIndex; the header returned by parseHeader
and subject inference are unchanged. Bare SSCE/WASSCE keep the existing mapping.
Tests: runner 38 PASS, 0 FAIL, 0 PENDING, no orphans; unit 67 PASS; extractor
--check green for seven slices.
Files: src/parser/parser.js; tests/unit.js;
fixtures/inputs/header-crs-ssce-periods.txt;
fixtures/expected/header-crs-ssce-periods.json; src/bookmarklet.js (rebuilt);
docs/DECISIONS.md; docs/SPEC.md; docs/INVARIANTS.md; docs/EDGE_CASES.md;
docs/plan/README.md.
Build: node src/build/build.js wrote src/bookmarklet.js at 65011 bytes; one
line, no %, body passes new Function parse. src/bookmarklet.min.js was not
rebuilt.
Docs: D-54 added; SPEC 3.3 and header-inference rules updated; INV-45 updated;
EC-84 added and counts moved to 84/80/4/0; README status row, snapshot, and
changelog updated.
Acceptance coverage: runner/unit/build checks listed above. Light verification at
phase 3 Gate 1 (2026-10-27): SSCE/WASSCE and the period forms map to the live
categories, `GENERAL PRACTICE` is unchanged, and `header-crs-ssce-periods`
passes the runner; build one line, no %, body parses.
Review: light-verified at phase 3 Gate 1 (2026-10-27).
Commit: deferred to phase 3 start.
Open questions: none. P12 was not started at this handoff.
```
