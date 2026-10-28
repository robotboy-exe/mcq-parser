# Work plan history

This file holds the dated record moved out of `docs/plan/README.md` during
housekeeping H3 (2026-10-27). Current status is in `docs/STATUS.md`; current
operations are in [`README.md`](README.md). Counts and paths below are
historical.

## Archived post-as-2026-10 review checkpoints

| Checkpoint | Scope | Level | Review | Commit |
|---|---|---|---|---|
| phase 2 close | P12 | rigorous | independent-pass-with-accepted-findings; fixes applied | committed 2ad3fa9 |
| phase 3 close | AS-10 | rigorous | independent-pass-with-accepted-findings; user accepted 2026-10-27; FIX-1/NOTE-1/NOTE-2 fixed | committed ef0883f |
| phase 4 close | AS-11 | light | light-verified (2026-10-27) | committed f3454af |
| cycle end | AS-12 | rigorous | independent-pass-with-accepted-findings; FIX-1/NOTE-1/NOTE-2 fixed; re-review passed; NOTE-3 docs fixed; NOTE-4 accepted (separate docs commit) | committed 7bbadee |
| cycle end docs | live-site safety and cycle-close workflow | docs | not reviewed (docs-only) | committed 490f60a |
| phase 3 Gate 1 | P11 | light | light-verified (2026-10-27) | committed 1cb6c7f + 2ad3fa9 |

## Housekeeping cycle checkpoints (housekeeping-2026-10)

| Checkpoint | Scope | Level | Review | Commit |
|---|---|---|---|---|
| phase 1 | H1 | independent | independent-pass (2026-10-27) | committed in cycle-close catch-up |
| phase 2 | H2 | independent | independent-pass (2026-10-27) | committed in cycle-close catch-up |
| phase 3 | H3 | independent | independent-pass (2026-10-27); NOTE-1/3 fixed | committed in cycle-close catch-up |
| phase 4 | H4 | independent | independent-pass (2026-10-27); NOTE-4 fixed | committed in cycle-close catch-up |
| cycle end | H5 | independent | independent-pass (2026-10-27); NOTE-5 fixed; NOTE-6 catch-up approved | committed at cycle close |

## Stimulus image cycle checkpoints (stimulus-images-2026-10)

| Checkpoint | Scope | Level | Review | Commit |
|---|---|---|---|---|
| phase 1 | P13 | light | light-verified (2026-10-28) | committed at phase 2 start |
| phase 2 | AS-13 | light | light-verified (2026-10-28) | committed at phase 3 start |

Rigorous review records live in [`reviews/`](reviews/README.md), named
`<cycle-id>-phase-<N>.md`, with an optional `<...>-re-review.md` after a fix.
The latest re-review is authoritative for the current verdict; earlier findings
it does not explicitly close still block. P12's record is
`reviews/post-as-2026-10-phase-2.md`; a missing record blocks phase 3.

Archived post-as-2026-10 catch-up plan, approved 2026-10-27: after the P12
review settles, the phase 3 session commits

1. `docs: add phase review workflow and post-AS plans` — `AGENTS.md`,
   `INTENT.md`, `docs/NEW_EDGE_CASES.txt`, `docs/plan/README.md`,
   `docs/plan/prompts/`, `docs/plan/reviews/README.md`, the P12 review
   record(s), and `docs/plan/13`–`18`.
2. `feat: add P11-P12 parser fixes and fixtures` — parser, tests, fixtures,
   rebuilt bookmarklet, implementation docs, and `docs/AGENTS.md`.


## Snapshot notes (deduplicated)

The old `## Current snapshot` entries were folded into the change log below.
Duplicate entries were removed; these notes preserve the unique details.

- 2026-10-26: the build wrote both `src/bookmarklet.js` (unminified, 63,054
  bytes) and `src/bookmarklet.min.js` (minified, 56,340 bytes). The minifier
  dropped comments and whitespace only; no renaming. The build refused minified
  output over 65,536 bytes. H1 later untracked the minified file.
- 2026-10-25: AS-08 closed with opt-in active mode, the mode gate/suffix, and the
  mode-aware save path. Runner 25 PASS; unit 52 PASS; live #1766/#1767 saved
  Active and draft regression #1768 saved Inactive; all three were deleted.
- 2026-10-25: P03 done: inline multi-pair keys are detected and `bank-2021` is
  confirmed.
- Source priority: `IMPROVISED C.docx.txt` is priority 1; `ANOMALIES.txt` is
  priority 2. The former `merged_bookmarklet.txt` duplicate was deleted; the
  canonical archived copy is `archive/trusted-variants/trusted-variant-C.js`.

## Removed duplicates (for the audit trail)

The following 10 byte-identical duplicates were removed; the `archive/` copy is
authoritative:

- `docs/claude-migration.md`
- `docs/qwen-1-gaps.md`
- `docs/qwen-1-gaps2.md`
- `docs/qwen-1-migration.md`
- `docs/qwen-2-gaps.md`
- `docs/qwen-2-reconciled.md`
- `trusted-variant-A.js`
- `trusted-variant-B.js`
- `trusted-variant-C.js`
- `archive/live-sources/admin_questions-live-2026-10-23.html`

## Change log

- 2026-10-28 — AS-13 adds the in-memory image plan and save injection: ordered
  detected-block rows, ranges, Attach/Replace/Remove, a generic row for
  uncovered `needsImage` questions, Start gating, 60-second image timeout, and
  no storage shape change. Live draft smoke saved #4142–#4144 (Q13 no image;
  Q14/Q15 image), left for owner cleanup. Runner 43 PASS; unit 140 PASS;
  bookmarklet rebuilt. Light-verified at phase 3 Gate 1; committed at phase 3
  start. The
  post-batch banner showed placeholders/2026 after the form reset; direct edit
  pages confirm 2024. Manifest: `$HOME/tmp/as13-live-manifest-2026-10-28.json`.
- 2026-10-28 — Stimulus image cycle started. P13 adds parser detection for a
  standard intro plus table, explicit `[image]`/`[[image]]` markers with
  optional ranges, ordered `stimuli` metadata, `needsImage` flags, and the
  `stimulus-unassigned`, `stimulus-range`, and `image-required` gate reasons.
  Two fixtures were added; runner 43 PASS and unit 126 PASS. The bookmarklet was
  rebuilt; no UI change. Light-verified at phase 2 Gate 1; committed at
  phase 2 start.
- 2026-10-27 — Housekeeping cycle archived: the active map was copied to
  `docs/plan/prompts/cycles/housekeeping-2026-10.md` with its relative links
  adjusted for the new location; `docs/plan/prompts/phase-map.md` now reports no
  active cycle. No new cycle was invented. Docs-only; no tests run. The archive
  change is uncommitted.
- 2026-10-27 — Housekeeping cycle closed: H1-H5 committed in order in the
  approved cycle-close catch-up; all five independent reviews PASS;
  NOTE-1/3/4/5 fixed and NOTE-6 resolved by the catch-up decision. No source,
  test, fixture, or build change; runner 41 PASS, unit 115 PASS, extractor
  green. Cycle remains active, not archived.
- 2026-10-27 — Housekeeping cycle NOTE fix: made the phase-map package
  references relative Markdown links, made the `docs/Active.md` plan wording
  historical, removed the removed `tests/build-check.js` from
  `docs/Active.md`'s phase commands, and qualified the 2020 inbox "0 flags"
  claim with the 3 inline-text key conflicts and last-wins key. Docs-only; no
  source, test, fixture, or build change; runner 41 PASS, unit 115 PASS.
  Committed at cycle close.
- 2026-10-27 — Housekeeping H5: parked the 2020 WASSCE C.R.S. paper in
  `archive/inbox/` with a triage README, replaced the inbox block with a
  pointer, and removed the two trailing cases already covered by
  `new-edge-year-abbreviation` and `new-edge-initials-q46`. No fixture or parser
  change; runner 41 PASS, unit 115 PASS. Committed at cycle close.
- 2026-10-27 — Housekeeping H4: deleted `review-packet/` and
  `review-packet.zip`, and pruned 89 `.playwright-mcp` logs, snapshots, and mock
  scripts. Kept `delete-3018-3053-backup.json`; the directory is now 24 KB.
  Updated the current `tests/build-check.js` references in the plan README and
  `docs/Active.md`, and removed the stale `review-packet` ignore entries.
  Historical package notes still mention the removed packet. No live action, no
  source or test change. Committed in cycle-close catch-up.
- 2026-10-27 — Housekeeping H3: moved the setup-era plan, phase prompts, and
  final report to `archive/workspace-setup/` with a provenance README; marked
  `docs/Active.md` historical; split dated snapshots, checkpoints, removed-file
  audit, and the change log into `docs/plan/history.md`; updated the prompts to
  point at the history snapshot. Docs-only; link check 0 broken; README reduced
  from 54,108 to about 25 KB. Committed in cycle-close catch-up.
- 2026-10-27 — Housekeeping H2: added `docs/STATUS.md`, replaced stale README
  status counts and layout claims, aligned the `AGENTS.md` comment rule, updated
  the verification baseline, marked the browser-harness spec unapproved, and
  recorded the cycle-end commit SHAs. Docs-only; runner 41 PASS, unit 115 PASS,
  extractor green; no source, test, fixture, or build change. Committed in
  cycle-close catch-up.
- 2026-10-27 — Housekeeping H1: archived the `post-as-2026-10` phase map, added
  the `housekeeping-2026-10` map and five lightweight package files, untracked
  `src/bookmarklet.min.js` (local copy kept and ignored), and updated the
  current-facing build rules. No source, test, fixture, or build change; no
  tests run. Committed in cycle-close catch-up.
- 2026-10-27 — AS-12 NOTE-3 docs fix: D-58, SPEC, Auto-Save-Spec, INVARIANTS,
  and AGENTS now state that dry-result invalidation is event-driven through
  `invalidateDry`; the `dryStamp` snapshot is recorded but never read back.
  NOTE-2 was already closed by the earlier fix. No source, test, fixture, or
  build change; runner 41 PASS, unit 115 PASS, extractor green. NOTE-4 (commit
  scope and owner-only live rows) remains for cycle close. Commit deferred.
- 2026-10-27 — AS-12 review fix: FIX-1 now schedules the shortened live-loop
  sleep and adds a 2-save Stop test plus key/mode/Skip/Reset `STALE` tests;
  NOTE-1 adds a live run token so a full Load or Reset cannot be overwritten by
  a finishing loop; NOTE-2 ends an escaped loop `BLOCKED` instead of leaving
  `RUNNING`. Runner 41 PASS; unit 115 PASS; extractor green; rebuilt
  `src/bookmarklet.js`; re-review required before cycle close. Commit deferred.
- 2026-10-27 — Added a live-safety stop rule after an AS-12 cleanup deleted six
  live Active Accounting questions (#3795-#3800). The cleanup selected the
  first `delete_question` form on the edit page and called `.submit()`, which
  bypassed the per-row confirm; only truncated stems survived in a Playwright
  snapshot. `docs/LIVE-SAFETY.md` now makes live cleanup owner-only and requires
  exact-ID scoping, confirm-text assertion, and success-flash verification for
  any owner-authorized delete. Test rows #3841-#3846 remain. Docs-only; no
  tests run.
- 2026-10-27 — AS-12 done: automatic dry run after a full or key-only Load,
  separate dry/live panels and state, stale invalidation, completion-before-
  Stop, and reload `INCOMPLETE`/`COMPLETE` from `deriveLiveState` with no
  run-state key (D-58; INV-90, INV-91). Added 8 unit tests (1 helper, 7 UI
  dry/live). Runner 41 PASS; unit 108 PASS; extractor green; build one line,
  80,927 bytes, no `%`, body parses; `src/bookmarklet.min.js` was not rebuilt.
  Live browser smoke passed steps 1-8 and left test rows #3841-#3846 for
  owner-only cleanup. Rigorous review is pending at cycle end; commit deferred
  to cycle close.
- 2026-10-27 — AS-11 done: added the additive `ocrBatchHistory` key (15
  newest-first batch summaries), `makeBatchHistoryEntry` and
  `upsertBatchHistory`, and the Recent batches box. History is written only
  after a verified save, survives Reset Queue, contains no per-question detail,
  and ignores storage failures. The line format uses explicit month
  abbreviations, `–` for contiguous ranges, and a comma list for gaps (D-57,
  INV-89). Also corrected the stale INVARIANTS total (88→89 including the new
  invariant) and a stale D-56 sentence about the DOM harness. Runner 41 PASS;
  unit 100 PASS; extractor green; build one line, no `%`, body parses.
  `src/bookmarklet.min.js` was not rebuilt. Review is pending at phase 5 Gate 1;
  commit is deferred to phase 5 start.
- 2026-10-27 — AS-10 NOTE-2 fix: the prior-batch duplicate detail now uses the
  matched entry's stored `fp.year`/`fp.category` when present, falling back to
  the current metadata labels. Matching is unchanged. Added one unit test
  (unit 89 PASS); runner 41 PASS; extractor green; build one line, no `%`, body
  parses. Display-only; no re-review required.
- 2026-10-27 — AS-10 fix session: closed the review's FIX-1 and NOTE-1.
  `tests/ui-harness.js` runs the real `src/ui/ui.js` save path against a small
  deterministic DOM/storage/fetch shim; new tests cover a manual save writing
  the request-time `fp`, rejected and ambiguous saves writing none, and
  Reset/re-paste dry run and Start stopping before POST. The fixture table
  counted 18 AS-10 unit tests (14 original, 4 FIX-1) instead of 13 at that
  point. Unit 88 PASS;
  runner 41 PASS; extractor green; build one line, no `%`, body parses. No
  save/gate behavior changed; `src/bookmarklet.min.js` was not rebuilt. Also
  added `docs/plan/prompts/fix-session.md`, made `fix phase N` default to every
  open finding, and required numbered review finding IDs (`BLOCK-1`, `FIX-1`,
  `NOTE-1`) in the review contract; docs-only.
- 2026-10-27 — AS-10 done: verified saves can store a D-56 fingerprint in the
  existing `ocrSavedLog` entry; the gate checks prior-batch fingerprints after
  the current-batch number and before the recent table. Legacy/partial/same-
  batch/label-only/over-4,000 cases are skipped; the newest match is reported.
  No new key, request, or override. Unit 84 PASS; runner 41 PASS; extractor
  green; build one line, no `%`, body parses. Rigorous review pending.
- 2026-10-27 — Added independent review checkpoints and a phase-boundary commit
  rule. Every phase verifies dependencies with probes, not just handoffs;
  rigorous reviews write one record under `reviews/` at P12 close, AS-10 close,
  and cycle end. Previous settled work is committed at the start of the next
  phase; current-phase work is deferred. P12 review is pending. Docs-only.
- 2026-10-27 — Cycle shelving is manual: archive only when the user confirms
  the cycle is complete/satisfied or explicitly asks. Added a new-cycle
  checklist and phase-map template in `prompts/cycles/README.md`; the last phase
  leaves the cycle active. Docs-only.
- 2026-10-27 — Replaced the two-step prompt files with one
  `phase-session.md` and a current-cycle `phase-map.md`. `phase N` is local to
  the active cycle; dependency status and handoffs are reviewed before editing;
  the README now owns the one-package-per-session workflow and stop rule. P11
  is done, so the next session starts at `phase 2`. Docs-only.
- 2026-10-27 — P12 done: option marks now use the earliest occurrence of each
  required A–D letter, then E/F only after D, sorted by text position (D-55).
  Q46 and single initials stay inside option text, out-of-order `anomaly-block2`
  labels still map correctly, and the duplicate warning is limited to a second
  complete A–D set with no visible `N.` boundary. Added Q46, single-initial,
  duplicate-label fixtures, plus an inline-number parse test. Runner 41
  PASS; unit 70 PASS; extractor green; build one line, no `%`, body parses.
  AS-10 is next.
- 2026-10-27 — P11 done: `compactExamAcronyms` maps period-separated exam
  acronyms (`S.S.C.E.`, `W.A.S.S.C.E.`, `W.A.E.C.`, `N.E.C.O.`, `G.C.E.`,
  `J.A.M.B.`, `U.T.M.E.`, `P.O.S.T. U.T.M.E.`) to the existing live categories
  on a local header copy (D-54, INV-45, EC-84). Header text and subject
  inference are unchanged. Added `header-crs-ssce-periods` and unit coverage.
  Runner 38 PASS; unit 67 PASS; extractor green; build one line, no `%`, body
  parses. P12 is next.
- 2026-10-27 — Planned post-AS follow-up P11–P12/AS-10–AS-12 from the user
  request: category period acronyms (D-54), option boundary selection (D-55),
  prior-batch duplicate fingerprints (D-56), 15-batch history (D-57), and
  automatic dry run plus separate dry/live status (D-58). P0 inbox cleanup is
  done separately: header/rules restored, agent Promoted block removed, raw Q46
  kept for P12. Spec 13 references corrected to D-56 and the current runner
  context. Added root `INTENT.md` as the behavior tie-breaker and linked it
  from this coordinator and the five packages. Docs-only; runner 37 PASS and
  unit 66 PASS unchanged.
- 2026-10-26 — Consolidated Auto-Save UI: active is the default with one
  mode-labelled confirmation, Start is visibly dimmed when disabled, status is
  one line plus a progress bar, dry run is summary-only, and the green saved box
  is summary-only (D-51/D-52, EC-82/EC-83, INV-71/INV-84). Runner 37 PASS; unit
  65 PASS; browser check and build verified.
- 2026-10-26 — Added a "Paste clipboard" button that reads the clipboard into
  the paste box on click (D-50/INV-83). Runner 37 PASS; unit 65 PASS; browser
  check passed; build verified.
- 2026-10-26 — Promoted new-edge anomalies: D-47 extends the missing-dot repair
  to B/C (EC-79/INV-80), D-48 ignores `B.`/`A.` in year abbreviations
  (EC-80/INV-81), and D-49 normalizes spaced slash labels for all options
  (EC-81/INV-82). These had blocked Auto-Save. Runner 37 PASS; unit 65 PASS;
  extractor seven slices green; build verified.
- 2026-10-26 — Added the 2026 bank slice and fixed the two-line answer heading
  (D-44/EC-76/INV-77); `bank-2026` covers Q1–Q48 and the 48-entry key. Also
  added the unheaded pre-2026 section as its own slice/fixture (`bank-pre-2026`,
  1/0), not a stray: D-45 repairs its missing A dot, D-46 strips divider-only
  lines (EC-77/EC-78, INV-78/INV-79). Runner 32 PASS; unit 65 PASS; extractor
  seven slices green; build verified.
- 2026-10-26 — Removed the 10-save auto-save cap (D-43); a run continues until
  Stop, a blocker, or the end of the queue. Dry run and the remaining gates are
  unchanged.
- 2026-10-25 — V1-V3 of the remaining verification queue closed on the live
  admin page: `bank-2021` and `anomaly-block2` matched their fixtures, a
  controlled save was accepted and deleted (no `practice_title` error), and a
  stale no-batch queue loaded with auto-save blocked. No code change; test rows
  cleaned up. V4 stays open. The unfiltered admin list did not show the new rows
  while a filtered list did; the site owner confirmed this is the site's intended
  list behavior, not a defect.
- 2026-10-25 — Auto-Save follow-up planned as AS-07…AS-09 from
  `docs/Active.md`; Fix 2 moved into AS-07 so the live active-mode test cannot
  run before the draft-only barrier clears. Decisions: cross-category copies
  allowed, saved log kept on Reset, key-letter preview deferred, per-question
  unverified status list and a two-consecutive-unverified stop added to AS-07,
  and `NEEDS_PICTURE` removed. `tests/build-check.js` was a
  review-packet-only script, not a workspace test.
- 2026-10-25 — Auto-Save review fixes: queue-mutating controls refuse during an
  in-flight save and a save only advances the queue it started with; normal Stop
  and queue completion are status text, not red blockers; `ocrSavedLog` records
  the inactivity check so the saved list cannot claim inactive for active or
  unverified saves; a rejected retry preserves an earlier unresolved marker; a
  storage failure aborts before the POST instead of stranding `saveInProgress`;
  POST target restored to `location.href`; unit tests 35 PASS.
- 2026-10-25 — live site cleaned: the AS test drafts (#1516-#1519, #1520,
  #1528 and lock-test rows) were deleted.
- 2026-10-25 — AS-06 done: docs close-out; five dry-run scenarios, hide-pause,
  mock lock, and the 3-question live test passed. Boot-fill regression fixed;
  cap raised to 10; blocked-reason color fixed. One-browser limit recorded for
  the two-tab lock message.
- 2026-10-25 — AS-07 done: live #1754 confirmed 139 + `…`; Start stopped a
  same-year/category repeat with 0 POST; 2022 repeat and a different long
  question dry-ran as saves; manual-marker refusal made 0 POST, then one POST
  with exam year 1800 was rejected so no row was inserted. Unverified
  list/stop and media removal covered by unit + mock. Active.md §3 retired;
  unit 49 PASS.
- 2026-10-25 — P01 done: `input_origin` is required and limited to
  bank/anomaly/doc/synthetic; all 25 fixtures labelled; missing and unknown
  values fail the runner. Runner 25 PASS.
- 2026-10-25 — P02 done: added `tools/extract-bank.js` and
  `tools/bank-slices.json`; the extractor verifies the bank hash, slice
  anchors, question/key counts, and output hashes. Added 2022-2025 inputs and
  PENDING specs; P03's bank-2021 input matches the slice byte-for-byte and
  stays confirmed. Runner 25 PASS / 4 PENDING; unit 59 PASS.
- 2026-10-25 — P04 done: `bank-2022` confirmed (40-entry inline key, 13
  E-option questions, bank Q3 `C. punish them`, dotless Q35 `A 75 years` parsed
  with no flags). No parser change. Runner 26 PASS / 3 PENDING; unit 59 PASS.
- 2026-10-25 — P05 done: `bank-2023` confirmed (40-entry inline key, eight
  E-option questions, Q1/Q33/Q40 option boundaries). No parser change. Runner
  27 PASS / 2 PENDING; unit 59 PASS.
- 2026-10-25 — P06 done: `bank-2024` confirmed (Q17-Q40, 40 key entries, no
  header asserted) and `bank-2025` confirmed (40 questions, 39 key entries, 26
  absent). No parser change. Runner 29 PASS / 0 PENDING; unit 59 PASS.
- 2026-10-25 — P07 done: guarded salvage pre-pass added; block 2 parses as 12
  chunks with 50 inserts, the salvage flag is appended in UI and runner, `nums`
  is asserted, and all bank inputs get 0 inserts. Runner 30 PASS; unit 59 PASS;
  build one line, no `%`, body parses.
- 2026-10-25 — P08 done: bullet mode added for unnumbered `*` blocks; block 1
  parses as 19 `num: null` items, block 2 and the bank are unchanged. Runner 31
  PASS; unit 59 PASS; build one line, no `%`, body parses.
- 2026-10-25 — P09 done: docs updated for bank extraction, salvage, bullet
  mode, `input_origin`, and the current counts; `qwen2-s1` assertions were ported
  to `bank-2021` before deleting the pair. Runner 30 PASS; unit 59 PASS;
  extractor `--check` green. No source change, no new live evidence.
- 2026-10-25 — P10 done: salvage preserves `Ph.D.`/`U.S.A.` while still
  repairing fused labels; block-2 stays at 12 chunks/50 inserts. Unit suite is
  64 PASS; runner adds `required_flags` and asserts it on every item. Stale
  docs corrected. Runner 30 PASS; extractor `--check` green; build one line,
  no `%`, body parses.
- 2026-10-25 — AS-09 done: confirmed-save log/advance faults keep the marker and
  stop without retry; saved log is re-read and merged by id with mode kept and
  capped at 200; `has-explanation` and `meta-changed` join the gate; the
  heartbeat write failure stops and releases the lock; Phase 3 docs corrected.
  Unit 59 PASS; build one line, no `%`, body parses.
- 2026-10-25 — Auto-Save phased as AS-01…AS-06; build gains full-line comment
  stripping and a no-`%` guard; unit harness planned.
- 2026-10-24 — numbering gaps are flagged on the following question
  (`gap-q10-missing`); 25 fixtures.
- 2026-10-24 — header inference extended: answer-key headers fill the form,
  exam category is inferred, CRS alias added; four synthetic header fixtures.
- 2026-10-24 — plan created; duplicates removed; ANOMALIES.txt received.
