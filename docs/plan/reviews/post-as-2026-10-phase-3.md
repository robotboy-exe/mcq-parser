# Review — post-as-2026-10 phase 3 (AS-10)

Date: 2026-10-27
Reviewer: independent review session
Verdict: PASS WITH ACCEPTED FINDINGS
Commit readiness: after user accepts findings
Review status: independent-pass-with-accepted-findings
Scope: AS-10 / `docs/plan/16-duplicate-fingerprints.md` (phase 3 of
`post-as-2026-10`), including the D-56 behavior in `docs/plan/13-duplicate-fingerprint-spec.md`.
P12 and AS-09 were checked only as dependencies and are complete.

## Evidence

Baseline commands, run in the shared worktree:

- `node tests/runner.js` → 41 PASS, 0 FAIL, 0 PENDING; no orphan reported.
- `node tests/unit.js` → 84 PASS, 0 FAIL.
- `node tools/extract-bank.js --check` → `OK: source, anchors, counts, and 7
  output hashes match` (exit 0).
- `wc -l src/bookmarklet.js` → 1; `wc -c` → 70306 bytes; no `%`;
  `new Function(body)` parses.
- Reproducibility: copied `src/` to `$HOME/tmp/as10-build`, ran
  `node src/build/build.js` there, and the SHA-256 matched the checked-in
  `src/bookmarklet.js`
  (`de0bedebd5bd57485c92e1d212e8d06629daea973f34b6e4dac5f83f542d06b8`).
  `src/bookmarklet.min.js` was not rebuilt.
- Handoff hashes verified: parser `5d605f96…`, UI `5f780e72…`, bookmarklet
  `de0bedeb…`, unit tests `3de3ec76…`.
- Worktree: the AS-10 file list matches the diff (`src/parser/parser.js`,
  `src/ui/ui.js`, rebuilt `src/bookmarklet.js`, `tests/unit.js`, and the named
  docs). No fixtures, minified build, or unrelated changes are present.

Directed probes (beyond the added tests):

- Same-batch exclusion is type-tolerant: a log entry with numeric
  `batchId: 123` is excluded by string current batch `'123'`.
- `fp.v: '1'` (string) does not match; the version check is strict.
- A raw question longer than 4,000 characters whose normalized form is exactly
  4,000 still writes an `fp`, matching the spec's canonical-text cap.
- With both a prior-batch fingerprint and a recent-table row matching, the gate
  returns the prior-batch `duplicate` first, as required.
- Prior entry matching ignores labels and case/whitespace via
  `normalizeAnswer`; the newest match wins on an `at` tie by numeric `id`.

Implementation traced: `makeSavedFingerprint` (`src/parser/parser.js:458`),
`completeFingerprint` (`:478`), `savedLogPriorDuplicate` (`:722`), and the gate
insertion after `savedLogHasNum` and before `recentDuplicate` (`:862`–`:869`).
The UI computes the fingerprint from `FormData` values and selected labels
before the POST (`src/ui/ui.js:496`), returns on rejected/ambiguous results
(`:509`, `:514`), and attaches `fp` only to the verified-save entry (`:521`).
`mergeSavedLog`, the 200-entry cap, Reset semantics, storage keys, the server
contract, `splitQuestions`, `splitSections`, and the minified build are
unchanged.

## Acceptance coverage

| Check | Result |
|---|---|
| runner 41 PASS, 0 FAIL, 0 PENDING, no orphans | PASS |
| unit tests for prior match, changed triple, text, legacy, partial/unknown v, same batch, newest, labels, normalization, first-check order, recent fallback, cap/merge | PASS (84) |
| Same batch: current-batch number check still first | PASS |
| Prior batch, same triple and text: `duplicate` stop | PASS (gate); UI no-POST path traced, not executed (FIX-1) |
| Prior batch, changed year/category/subject: allowed | PASS |
| Legacy/partial/unknown `fp`: never matches | PASS |
| Multiple matches: newest by `at`, then `id` | PASS |
| Manual save writes a complete `fp` | PASS by inspection only (FIX-1) |
| Rejected/ambiguous save writes no `fp` | PASS by inspection only (FIX-1) |
| Over-4,000 canonical question: no `fp`; legacy entry | PASS |
| Storage: same key, 200 cap, merge-by-ID unchanged | PASS |
| Build: one line, no `%`, body parses | PASS (reproduced from source) |

## Findings

FIX-1 — The UI write hook and mock/integration evidence are missing.
`src/ui/ui.js:496`–`:521` is traced as correct, but no automated test exercises
it. `tests/unit.js:662` only passes a pre-built entry through `commitSave`; it
does not show that a manual save writes `fp`, that a rejected/ambiguous save
writes none, or that the text comes from the request-time `FormData` rather than
the queue item. Package Work item 6 (spec §10 items 11, 12, 14) and Work item 7
(save, Reset, re-paste, dry-run/Start no-POST mock) were not executed. The
handoff discloses the absence of a DOM harness, but the package's required
evidence is still missing. Reproduction:
`grep -n "entry.fp" src/ui/ui.js` shows only the verified-save attachment, and
the only fingerprint entry-construction test takes a pre-built entry. Core
behavior is present; the gap is that a later regression could attach `fp` to an
ambiguous save or use queue text and go undetected until a false stop.

NOTE-1 — The README fixture table says AS-10 added 13 unit tests
(`docs/plan/README.md:556`), but the count went from 70 to 84 (+14) and the diff
adds 14 `test(...)` blocks. Update the row to `+14 unit tests`.

NOTE-2 — The prior-match detail uses the current metadata, not the matched
entry's stored labels: `src/parser/parser.js:869` prints `meta.year` and
`meta.categoryText || meta.category`. Year equality is guaranteed by matching
and labels are display-only, so behavior is unaffected, but `docs/DECISIONS.md:739`
says the saved year and category are reported. Using `prior.fp.year` /
`prior.fp.category` when present would make the message and wording exact.

## Findings closed (re-review only)

Not applicable; this is the first review.

## Recommended next action

User accepts the findings. Recommended: `accept and fix` — run a separate fix
session for FIX-1 (add automated evidence for the request-time fingerprint and
the no-write-on-rejected/ambiguous path, plus the reset/re-paste no-POST check)
and correct NOTE-1; then start phase 4. If the user chooses plain `accept`,
commit as-is and retain the FIX-1 evidence risk.

Next action required:
- User decision: accept and fix (recorded 2026-10-27)
- Recommended: accept and fix
- After decision: Run a fix session for AS-10 FIX-1/NOTE-1, then attach
  `docs/plan/prompts/phase-session.md` and pass `phase 4` (AS-11).
