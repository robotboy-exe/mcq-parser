# Review — post-as-2026-10 phase 2 (P12)

Date: 2026-10-27
Reviewer: independent review session
Verdict: PASS WITH ACCEPTED FINDINGS
Commit readiness: after user accepts findings
Review status: independent-pass-with-accepted-findings
Scope: P12 / `docs/plan/15-option-boundary-selection.md` (phase 2 of
`post-as-2026-10`). P11 checked only as the dependency.

## Evidence

Baseline commands, run in the shared worktree:

- `node tests/runner.js` → 41 PASS, 0 FAIL, 0 PENDING; no orphan reported.
- `node tests/unit.js` → 70 PASS, 0 FAIL.
- `node tools/extract-bank.js --check` → `OK: source, anchors, counts, and 7
  output hashes match` (exit 0).
- `wc -l src/bookmarklet.js` → 1; `wc -c` → 67309 bytes; no `%`;
  `new Function(body)` parses. The handoff's "67308" is the build's
  `bookmarklet.length` (without the trailing newline), not a discrepancy.
- Reproducibility: copied `src/` to `$HOME/tmp/p12build`, ran
  `node src/build/build.js` there, and `cmp` matched the checked-in
  `src/bookmarklet.js` byte-for-byte. `src/bookmarklet.min.js` was not rebuilt.
- Worktree: P12's handoff file list matches the diff (parser, unit tests, three
  fixture pairs, rebuilt bookmarklet, DECISIONS/SPEC/INVARIANTS/EDGE_CASES/
  README). The co-resident P11/P0/review-workflow files (`header-crs-ssce-*`,
  `INTENT.md`, `docs/plan/13`–`18`, `prompts/`, `reviews/`, root `AGENTS.md`,
  `NEW_EDGE_CASES.txt`) are the approved catch-up set, not P12 changes.

Directed probes (not only the new fixtures):

- Q46 fixture → `a Siaka Stevens / b K. A. Gbedemah / c E. F. Small /
  d Oladipo Solanke`, `flags []`.
- Single-initial fixture → `a Bello / b Dr. A. Adebayo / c Prof. E. Smith /
  d Danjuma`, `flags []`.
- Duplicate-label fixture → 1 item, `a letter appears twice (merged questions?)`.
- Inline number:
  `1. First question\nA. one B. two C. three D. four 2. Second question...`
  → `splitQuestionItems` returns 1 item and `parseQuestion` flags `[]`.
  A boundary without the required space (`2.Second`) still warns, as specified.
- Hostile order `A. Italy D. Britain B. Germany C. France` → A Italy,
  B Germany, C France, D Britain (marks sorted by text position).
- Prefix hazard probe: an initial that precedes the real A–D labels is still
  selected as the earliest letter; this is the residual risk already stated in
  D-55, not a new regression.

Implementation traced: `optionLabelMatches` (`src/parser/parser.js:159`),
`bestOptionCandidate` (`:199`), `hasUnnumberedDuplicateSet` (`:218`),
`QUESTION_BOUNDARY` (`:157`). It preserves `OPTION`, slash normalization,
`isOptionAbbreviation`, the D-45/D-47 repair, blank options, E/F collapse, and
`LOOSE` E/F; `splitQuestions`/`splitSections`, storage keys, the server
contract, and `src/bookmarklet.min.js` are untouched.

Fixtures: Q46 input is verbatim from `docs/NEW_EDGE_CASES.txt` Q46 and the
expected options are transcribed from that block. The single-initial and
duplicate-label inputs are labelled `synthetic` and their provenance says so.

## Acceptance coverage

| Check | Result |
|---|---|
| runner 41 PASS, 0 FAIL, 0 PENDING, no orphans | PASS |
| unit: prior tests + Q46, single-initial, inline-number | PASS (70) |
| Q46: four options correct, no flags | PASS (fixture + probe) |
| Single initials: outer A–D correct, no flags | PASS (fixture + probe) |
| Duplicate labels: one item, warning present | PASS (fixture) |
| Inline number: one item, no warning, no inline split | PASS (manual probe; automated test asserts only the warning — see NOTE-2) |
| extractor `--check` unchanged, green | PASS |
| build one line, no `%`, body parses | PASS (reproduced from source) |

Deviation decision: the handoff's earliest-per-letter selection is behaviourally
accepted and is documented in D-55, SPEC §3.7, and INV-86; an ordered-chain-only
scan regresses out-of-order `anomaly-block2` labels. The package Work text was
not rewritten, so the package itself still describes the rejected algorithm
(FIX-2); this is a wording reconciliation, not a behaviour defect.

## Findings

FIX-1 — Stale duplicate-flag documentation contradicts D-55.
`docs/INVARIANTS.md:40` (INV-17) still says every duplicate option letter must
be flagged, `docs/INVARIANTS.md:41` (INV-18) still lists "duplicate letters",
and `docs/AGENTS.md:74` still says "flagged with the pre-dedup count (INV-17)".
The implementation now flags only a boundary-less second complete A–D set, and
the count no longer exists. Reproduction:
`parseQuestion({num:1,text:'1. Duplicate D label\nA. one B. two C. three D.
four D. five'}).flags` → `[]`. D-55, SPEC's flag table, and INV-87 are correct;
these three older lines were not reconciled. Repair the wording (no code
change) before AS-10.

FIX-2 — Recorded deviation not reconciled into the package Work section.
`docs/plan/15-option-boundary-selection.md:39` still requires "the candidate
with the most required letters first ... then the earliest start, then the
shortest span", while the handoff (`:112`) and D-55 (`docs/DECISIONS.md:698`)
describe earliest-per-letter. The handoff is honest and the behaviour is
justified, but the package's own Work text is now stale. Update that item to
name the implemented selection (or explicitly mark it superseded) so the
package and docs agree.

NOTE-1 — Hybrid-set residual risk is under-described. A block with an
incomplete first A–D set and a later complete set can blend them:
`A. one B. two C. three\nA. four B. five C. six D. seven` gives
`c = "three A. four B. five C. six"` and `d = "seven"`, with only the short-stem
flag. This is inherent to the chosen selection (the package's candidate scan
would do the same) and is outside INTENT's stated cases, but D-55's risk note
only mentions prefix initials. Worth one sentence or a future fixture.

NOTE-2 — The inline-number unit test (`tests/unit.js:111`) calls
`parseQuestion` directly and asserts the warning only; it does not assert that
the paste stays one queue item. The probe above confirms one item, but the
acceptance row "one item; no inline split" has no automated regression guard.

NOTE-3 — `fixtures/expected/new-edge-initials-q46.json:3` uses
`input_origin: "anomaly"`. P01 defines `anomaly` as a slice of
`ANOMALIES.txt`, and this input comes from `docs/NEW_EDGE_CASES.txt`. It matches
the earlier real-user `new-edge-*` fixtures, so this is a taxonomy-wording
ambiguity, not a P12-only defect.

NOTE-4 — Q46 is now a fixture but remains in `docs/NEW_EDGE_CASES.txt`, whose
header calls itself an inbox for cases "not yet fixtures". That file is already
in the co-resident P0 change set, so cleanup is a separate follow-up rather than
a P12 edit.

## Findings closed (re-review only)

Not applicable; this is the first review.

## Recommended next action

User accepts FIX-1 and FIX-2 (both wording-only). A separate fix session updates
`docs/AGENTS.md`, INV-17/INV-18, and the P12 Work item, re-runs the three
baseline commands, and updates the P12 handoff. Then phase 3 commits the
approved catch-up plan in order, starting with the docs/workflow commit that
includes this record.
