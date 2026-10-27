# Current status

Last verified: 2026-10-27 on branch `experiments` at `490f60a`.

## Checks

| Check | Result |
|---|---|
| `node tests/runner.js` | 41 fixtures: 41 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 115 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and 7 output hashes match |
| `src/bookmarklet.js` | 1 line, no `%`, body parses |
| `src/bookmarklet.js` size | 81,284 bytes |
| `src/bookmarklet.js` SHA-256 | `f110322ec435c8bcf3ac1e39feffb4cc92b0ca76d16bc1c95ac23d2e6c9d081d` |

The fixture runner is the regression gate. It is parser-only; it does not
exercise the DOM, storage, `fillForm`, `tick`, or save path. `tests/ui-harness.js`
covers some UI save and dry-run paths without a browser. There is no checked-in
browser test suite.

## Build policy

`src/bookmarklet.js` is the only tracked build output. Rebuild it with
`node src/build/build.js` after editing `src/parser/parser.js` or
`src/ui/ui.js`.

`src/bookmarklet.min.js` is not tracked and is ignored. A stale local copy may
exist; do not edit, rely on, or rebuild it. The legacy `--min` build currently
exceeds the 65,536-byte guard. See `docs/BUILD.md`.

## Live site

Live V1-V3 checks passed on 2026-10-25: `bank-2021` and `anomaly-block2` parsed
on the admin page, a controlled manual save was accepted and deleted, and a
stale queue without a batch identity loaded but auto-save was blocked. There is
still no new live OCR paste beyond the archived bank and anomaly blocks.

On 2026-10-27 a live AS-12 test cleanup deleted six Active Accounting questions
(#3795-#3800). Only truncated stems were recovered. Test rows #3841-#3846
remain. Live deletes and cleanup are owner-only; the agent must not delete or
clean up live records. See `docs/LIVE-SAFETY.md`.

## Source of truth

- Behavior: `docs/SPEC.md`
- Decisions: `docs/DECISIONS.md`
- Edge cases and invariants: `docs/EDGE_CASES.md`, `docs/INVARIANTS.md`
- Build and verification: `docs/BUILD.md`
- Remaining live checks: `docs/plan/11-remaining-verification.md`
- Work tracker: `docs/plan/README.md`
- Dated history: `docs/plan/history.md`
