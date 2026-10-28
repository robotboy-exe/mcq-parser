# Current status

Last verified: 2026-10-28 on branch `experiments` at `490f60a` plus uncommitted P13 work.

## Checks

| Check | Result |
|---|---|
| `node tests/runner.js` | 43 fixtures: 43 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 126 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and 7 output hashes match |
| `src/bookmarklet.js` | 1 line, no `%`, body parses |
| `src/bookmarklet.js` size | 91,460 bytes |
| `src/bookmarklet.js` SHA-256 | `516155b759ea5ea4a1a0a94af35be2157bfdf0e0d403522ab829d49ff11b6fc7` |

The fixture runner is the regression gate. It is parser-only; it does not
exercise the DOM, storage, `fillForm`, `tick`, or save path. `tests/ui-harness.js`
covers some UI save and dry-run paths without a browser. There is no checked-in
browser test suite.

P13 adds the stimulus gate but not the image-plan UI. Until AS-13, auto-save is
intentionally blocked for any queue with a detected stimulus because no plan
can be assigned; manual use is unchanged.

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
