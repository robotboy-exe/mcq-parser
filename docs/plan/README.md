# OCR Parser Work Plan — Coordinator

This is the entry point for all remaining parser, fixture, and Auto-Save work.
Read this file, then read the one work-package file you are executing. Each
package document is self-contained; you should not need any other package
document to finish it.

For P11–P12/AS-10–AS-12, the user's intent is in
[`INTENT.md`](../../INTENT.md) at the project root. Read it before those
packages. Package prose owns implementation detail; `INTENT.md` is the
tie-breaker for behavior.

Last updated: 2026-10-27.

## Auto-Save track (AS-01…AS-06)

`docs/Auto-Save-Spec.md` is the feature source of truth. The AS packages below
turn it into shippable, tested phases. They do not replace P01–P09; the parser
and fixture packages remain valid and independent. AS-01 records the contract
changes and build hygiene, AS-02/AS-03 add pure foundations and the gate,
AS-04/AS-05 add the save pipeline and the opt-in loop, and AS-06 closes docs and
live acceptance.

Auto-Save deliberately changes three earlier decisions. These changes are
recorded in AS-01 and supersede the old rows:

- Reset Queue now clears `ansKey`, `ansKeyBatch`, and `queue.batchId`.
- Auto-save saves inactive; manual saves stay active.
- Full-line `//` comments are allowed in the modules and stripped by the build;
  the generated bookmarklet must still be one line and contain no `%`.

## Auto-Save follow-up track (AS-07…AS-09)

`docs/Active.md` is the merged review for the work after AS-06. Its phases map
to three plan packages so the status table, acceptance gates, and handoff notes
stay in one place. `docs/Active.md` remains the authoritative detailed spec;
the package files add preconditions, acceptance, and handoff.

The one sequencing change: **Fix 2 moves from Phase 3 into AS-07**. Active.md
§2 forbids live active saves until Fix 1 and Fix 2 are both done, and AS-08
contains the live active test. Shipping active mode before Fix 2 would put a
hidden possible duplicate in front of students.

Decisions recorded 2026-10-25:

- Cross-category copies stay allowed; category remains part of the duplicate
  identity.
- `ocrSavedLog` is not cleared on Reset.
- The key-letter preview is deferred.
- The saved list must name each question whose active status is unverified,
  and the run stops after two consecutive unverified saves. Both are in AS-07;
  AS-08 must preserve them.
- `NEEDS_PICTURE` is removed. The uploader decides whether a batch needs
  images; text guessing is out of scope. `file-attached` stays. A future media
  feature needs an explicit uploader signal, not a word list.

`tests/build-check.js` exists only in `review-packet/` and is pinned to the
packet's artifact hash. It is not a workspace test; use the BUILD.md checks.

## Post-AS follow-up track (P11–P12, AS-10–AS-12)

User request 2026-10-27. The intent is recorded in
[`INTENT.md`](../../INTENT.md); the five packages below continue the same track
style and add implementation detail:

- **P11** normalizes period-separated exam acronyms for category inference
  (D-54).
- **P12** selects one ordered A–D option sequence, keeps inner initials in
  option text, and warns on a second A–D set only when no visible question
  number separates it (D-55). It does not split inline questions.
- **AS-10** adds prior-batch duplicate fingerprints from the retained saved log
  (D-56; `13-duplicate-fingerprint-spec.md` is authoritative).
- **AS-11** adds the additive `ocrBatchHistory` key with 15 one-line batch
  summaries (D-57).
- **AS-12** starts a dry run after Load/key-only Load and separates dry/live
  state, progress, and blockers; live completion beats Stop, and reload shows
  incomplete or complete from the queue and saved log (D-58).

P0 is a one-off inbox cleanup, done 2026-10-27. It has no package row:
`docs/NEW_EDGE_CASES.txt` regained its original header/rules, the agent-written
`Promoted 2026-10-26` block was removed, and the raw Q46 case was kept for P12.

The sequence is linear: P10 → P11 → P12 → AS-10 → AS-11 → AS-12, with AS-10
also depending on AS-09. For this track, rebuild only `src/bookmarklet.js`; do
not rebuild `src/bookmarklet.min.js` unless the user explicitly asks for the
minified release artifact. Commits follow the phase-boundary rule below.

## Build cycles and phase sessions

Phases are local to a build cycle. [`prompts/phase-map.md`](prompts/phase-map.md)
is the only active map; `phase N` means that map's phase N. Package statuses
stay in the work-package table above, not in the map.

One session executes one phase. Attach
[`prompts/phase-session.md`](prompts/phase-session.md) once and pass
`phase N`. Its first reply is read-only: resolve the phase, verify dependencies
and their probes, run baseline tests, state review and commit readiness, and
wait for `go`. After `go`, it first commits the previous settled work (using the
approved catch-up plan when more than one phase is settled), then executes only
the current package, updates the status row and handoff, and stops. The current
phase is never committed by its own session.

### Reviews

Every phase gets light dependency verification in Gate 1: actual probes, file
list, build claims, fixture origins, docs claims, and guardrails. A rigorous
independent review is a separate session using
[`prompts/review-session.md`](prompts/review-session.md). It may write only its
review record(s) in [`reviews/`](reviews/README.md), never product files or
commits. It is required at these checkpoints, not after every phase:

| Checkpoint | Scope | Level |
|---|---|---|
| phase 2 close | P12 | rigorous |
| phase 3 close | AS-10 | rigorous |
| cycle end | AS-12 | rigorous |
| every other phase | previous package | light |

A pending rigorous review or unresolved finding blocks both commit and the next
phase. Review sessions never edit product files or commit. `BLOCK` prevents
commit; accepted findings are recorded in the review record, handoff, and
checkpoint table.

For `PASS WITH ACCEPTED FINDINGS`, the user chooses:

| Decision | Action |
|---|---|
| `accept` | Commit as-is; start the next phase. |
| `accept and fix` | Attach `prompts/fix-session.md` and pass the phase or record (IDs optional); update the handoff, then start the next phase. No re-review if behavior is unchanged. |
| `reject` | Attach `prompts/fix-session.md` and pass the phase or record (IDs optional), then `re-review`; the original record stays. |

For `BLOCK` or a rejected `FIX`, the fix session and `re-review` are mandatory.
With no IDs, a fix session addresses every open finding in the record; `NOTE`
findings are limited to documentation, wording, or test-only changes. A fix
session updates the package handoff files/tests and appends a fix note. It has a
read-only Gate 1, waits for `go`, and does not commit or start the next phase.

### Commits

Commits happen only at a phase boundary. Do not commit during a phase. At the
start of the next phase, after the previous phase's review settles, commit the
previous phase's files before editing the new phase. At cycle end, commit the
final phase before archiving. For a catch-up, make each plan commit in order and
stage only the files named for that commit; for a single phase, stage the
handoff plus review record. Stop on unrelated changes. Use the repository's
message style.

Do not amend, rebase, force-push, or create an empty commit.

At cycle end, a separate cycle-close session commits the final phase. It verifies
the final phase is done and its latest review is `PASS` or accepted, updates the
final status row, checkpoint row, handoff `Review:` and `Commit:` lines, and
current snapshot. Then it stages the handoff plus review record(s), runs the
checks, and commits. It executes no package and does not archive. Do not use a
normal phase session for this, because the final package is already `done`.

Do not archive automatically when the last phase stops. Archive only when the
user confirms the cycle is complete or satisfied, or explicitly asks to shelve
it. Then copy the active map to `prompts/cycles/<old-cycle-id>.md`, replace
`phase-map.md` with the new cycle, and leave `phase-session.md` unchanged. The
new-cycle checklist and map template are in
[`prompts/cycles/README.md`](prompts/cycles/README.md). Use
`cycle <id> phase N` only for an archived map.

### Current review checkpoints

| Checkpoint | Scope | Level | Review | Commit |
|---|---|---|---|---|
| phase 2 close | P12 | rigorous | independent-pass-with-accepted-findings; fixes applied | committed 2ad3fa9 |
| phase 3 close | AS-10 | rigorous | independent-pass-with-accepted-findings; user accepted 2026-10-27; FIX-1/NOTE-1/NOTE-2 fixed | committed ef0883f |
| phase 4 close | AS-11 | light | light-verified (2026-10-27) | committed at phase 5 start |
| cycle end | AS-12 | rigorous | planned | before archive |
| phase 3 Gate 1 | P11 | light | light-verified (2026-10-27) | committed in catch-up |

Rigorous review records live in [`reviews/`](reviews/README.md), named
`<cycle-id>-phase-<N>.md`, with an optional `<...>-re-review.md` after a fix.
The latest re-review is authoritative for the current verdict; earlier findings
it does not explicitly close still block. P12's record is
`reviews/post-as-2026-10-phase-2.md`; a missing record blocks phase 3.

Current catch-up plan, approved 2026-10-27: after the P12 review settles, the
phase 3 session commits

1. `docs: add phase review workflow and post-AS plans` — `AGENTS.md`,
   `INTENT.md`, `docs/NEW_EDGE_CASES.txt`, `docs/plan/README.md`,
   `docs/plan/prompts/`, `docs/plan/reviews/README.md`, the P12 review
   record(s), and `docs/plan/13`–`18`.
2. `feat: add P11-P12 parser fixes and fixtures` — parser, tests, fixtures,
   rebuilt bookmarklet, implementation docs, and `docs/AGENTS.md`.

## Current snapshot

- Current test status: `node tests/runner.js` → 41 PASS, 0 FAIL, 0 PENDING;
  `node tests/unit.js` → 100 PASS, 0 FAIL; `node tools/extract-bank.js --check`
  exits 0 for seven slices.
- 2026-10-27: AS-11 done. `ocrBatchHistory` stores up to 15 newest-first batch
  summaries built from the current batch's saved entries after a verified save;
  `makeBatchHistoryEntry` and `upsertBatchHistory` are pure helpers, the Recent
  batches box renders one `textContent` line per batch, and Reset Queue keeps
  the key (D-57, INV-89). Rejected/ambiguous saves write nothing, and a history
  read/write failure cannot block or change a save. Runner 41 PASS; unit 100
  PASS; extractor green; build one line, no `%`, body parses. `src/bookmarklet.min.js`
  was not rebuilt. Review light-verified at phase 5 Gate 1 (2026-10-27); committed
  at phase 5 start.
- 2026-10-27: AS-10 done. Verified saves may now store an additive `fp`
  fingerprint taken from the posted form at request time; `autosaveBlockers`
  checks the current-batch number first, then a prior-batch fingerprint, then
  the recent table (D-56). Legacy, partial, unknown-version, same-batch,
  label-only and over-4,000-character cases do not match; the newest match is
  reported with its saved ID, year and category. No new key or network request.
  Runner 41 PASS; unit 89 PASS; extractor green; build one line, no `%`, body
  parses. The rigorous review passed with accepted findings; FIX-1 added the
  UI save-path harness, NOTE-1 corrected the test count, and NOTE-2 made the
  prior-match detail use the matched entry's stored labels. Committed as
  ef0883f at phase 4 start.
- 2026-10-27: P12 done. Option parsing selects the earliest occurrence of each
  required letter A–D, then E/F only after D, and sorts the marks by position;
  inner initials stay in option text and out-of-order hostile labels still map
  correctly (D-55). The duplicate warning now fires only for a second complete
  A–D set with no visible question-number boundary. Added Q46, single-initial,
  duplicate-label fixtures, plus an inline-number parse test. Runner 41
  PASS; unit 70 PASS; extractor green; build one line, no `%`, body parses.
  The rigorous P12 review passed with accepted findings; FIX-1/FIX-2 are fixed
  (wording only). AS-10 followed after the catch-up commits landed.
- 2026-10-27: P11 done. `compactExamAcronyms` normalizes period-separated exam
  acronyms on a local header copy inside `pickCategoryIndex` (D-54); the
  stored header and subject inference are unchanged. Added
  `header-crs-ssce-periods` and unit coverage. Runner 38 PASS; unit 67 PASS;
  build one line, no `%`, body parses. P12 is next.
- 2026-10-27: post-AS follow-up planned as P11–P12/AS-10–AS-12 (D-54–D-58);
  `13-duplicate-fingerprint-spec.md` references were corrected to D-56 and the
  current runner context. P0 inbox cleanup restored the original header/rules,
  removed the agent-written Promoted block, and retained the raw Q46 case for
  P12. Docs-only; runner 37 PASS and unit 66 PASS are unchanged.
- 2026-10-27: the paused warning gained `Open filtered list`, built from the
  `ocrSaving` marker's subject/category/year snapshot (or `ocrMeta` for old
  markers). It targets the filtered Recently Added list so the user can check
  an ambiguous save directly (D-53, INV-85). Runner 37 PASS; unit 66 PASS;
  `src/bookmarklet.js` rebuilt, one line, no `%`, body parses.
- 2026-10-26: the build now writes both `src/bookmarklet.js` (unminified,
  63054 bytes) and the standalone `src/bookmarklet.min.js` (minified, 56340
  bytes). The minifier drops comments and whitespace only; no renaming. The
  build refuses minified output over 65536 UTF-8 bytes. Parser fixtures and
  unit tests are unchanged, and both built bodies parse.
- 2026-10-26: the bank source gained the WASSCE 2026 section and a 2026 slice
  (`bank-2026`, 48 questions/48 key entries). Its two-line answer heading left
  `WASSCE C. R. K. 2026` inside Q48 and produced the duplicate-letter flag;
  `splitSections` now drops a title block above a pure answer heading (D-44,
  EC-76, INV-77). The unheaded 29 section between 2025 and 2026 is its own
  divider-delimited section, not a stray part of either year; it is extracted as
  `bank-pre-2026` (1 question/0 key entries). D-45 repairs its dotless A and
  D-46 strips the surrounding dividers (EC-77/EC-78, INV-78/INV-79). The 2025
  slice hash changed only by gaining a trailing newline because 2025 is no
  longer the end of the source file.
- V1-V3 of the remaining verification queue closed on 2026-10-25: live
  `bank-2021`/`anomaly-block2` matched their fixtures; controlled save #1785
  was accepted (filtered list + edit page) and deleted; a stale no-batch queue
  loaded with auto-save blocked and Reset + re-paste worked. V4 remains open.
  The unfiltered admin list did not show the new rows while the filtered list
  did; the site owner confirmed this is intended list behavior, not a defect.
- Auto-Save AS-01 through AS-09 are done. AS-06 closed on 2026-10-25 with the
  five dry-run scenarios, hide-pause, mock lock, and the live 3-question test;
  the cap was raised to 10 at that point and later removed (D-43). Two-tab live
  testing is limited by hide-pause on one browser; the lock reason is covered
  by unit + mock.
- AS-07 closed on 2026-10-25: Fix 1 (scoped duplicate check), Fix 2 (manual
  marker refusal), the per-question unverified list, the two-consecutive stop,
  and removal of `needs-media`. Runner 25 PASS; unit 49 PASS; build one line,
  no `%`, body parses. Live checks on the real admin page passed: #1754 was
  139 + `…`; Start stopped a same-year/category repeat with 0 POST; a 2022
  repeat and a different long question dry-ran as saves; the manual-marker
  refusal made 0 POST and the cleared marker let one POST reach the server
  (rejected with exam year 1800, so no row was inserted). Mock checks cover the
  unverified list/stop and media/file-attached. AS-08 may start.
- AS-08 closed on 2026-10-25: opt-in active mode, mode gate/suffix, and the
  mode-aware save path are implemented. Runner 25 PASS; unit 52 PASS; build one
  line, no `%`, body parses. Mock active/draft runs and the AS-07 draft
  regression pass. Live (Accounting / JAMB / UTME / 2024, Samuel watching):
  #1766 and #1767 saved Active with list `, active`; draft regression #1768
  saved Inactive with list `, inactive`; #1766-#1768 were deleted and no test
  rows remained. Logged out; cookies and the temporary credentials file were
  removed. AS-09 is next.
- AS-09 closed on 2026-10-25: Fix 3 (confirmed-save log/advance faults keep the
  marker and stop), Fix 4 (saved log re-read/merged by id, mode kept, cap 200),
  Fix 5 (`has-explanation`), Fix 6 (confirmed metadata snapshot +
  `meta-changed`), Fix 7 (heartbeat write failure stops and releases the lock),
  the `out`/`add` order nit, and the Phase 3 doc corrections. Runner 25 PASS;
  unit 59 PASS; build one line, no `%`, body parses. The UI paths for Fixes 3
  and 7 are covered by injected pure helpers (`commitSave`, `heartbeatTick`);
  the DOM wiring itself has no browser test.
- P01 closed on 2026-10-25: `input_origin` is required and validated by the
  runner, and all 25 current fixtures carry it (7 bank, 1 doc, 17 synthetic).
  The package was written for 19; P03's `bank-2021` and the 2026-10-24 header
  and gap fixtures were classified too. `gap-q10-missing` is a real user paste
  marked synthetic because the taxonomy has no user-paste value. Runner 25
  PASS; negative missing/unknown checks reproduced and restored.
- P02 closed on 2026-10-25: `tools/extract-bank.js` and `tools/bank-slices.json`
  produce the year slices, verify the source hash, anchors, question and key
  counts, and output hashes (`--check`). 2022-2025 inputs and PENDING specs
  were added; `bank-2021` already existed from P03 and matches the slice
  byte-for-byte. Runner 25 PASS / 4 PENDING; unit 59 PASS. P04-P06 can confirm
  the four PENDING bank specs. The manifest was extended with 2026 on
  2026-10-26.
- P04 closed on 2026-10-25: `bank-2022` is confirmed with the 40-entry inline
  key, 13 E-option questions, the bank Q3 `C. punish them`, and the real
  dotless Q35 (`A 75 years` parsed as option A with no flags). No parser change
  was needed. Runner 26 PASS / 3 PENDING; unit 59 PASS.
- P05 closed on 2026-10-25: `bank-2023` is confirmed with the 40-entry inline
  key, eight E-option questions (Q33-Q40), Q1 option boundaries, and Q33/Q40
  option text. No parser change was needed. Runner 27 PASS / 2 PENDING; unit
  59 PASS.
- P06 closed on 2026-10-25: `bank-2024` is confirmed as the partial Q17-Q40
  slice with its 40-entry key and no asserted header; `bank-2025` is confirmed
  with 40 questions and 39 key entries (26 absent). No parser change was
  needed. Runner 29 PASS / 0 PENDING; unit 59 PASS. P07 is next.
- P07 closed on 2026-10-25: guarded `salvageNormalize` pre-pass repairs fused
  OCR boundaries only when it yields more questions; block 2 parses as 12
  chunks `[null,2,3,4,7,8,9,12,13,14,15,16]` with 50 inserts. The UI and runner
  use the shared result and add `OCR boundaries repaired; verify question and
  option split`; the runner also asserts the `nums` sequence. All five bank
  inputs are byte-identical no-ops (0 inserts). Runner 30 PASS; unit 59 PASS;
  build one line, no `%`, body parses. P08 is next.
- P08 closed on 2026-10-25: unnumbered `*` blocks parse in bullet mode only when
  there are no line-start `N.` markers. Block 1 yields 19 items, all
  `num: null`, with `question number missing`; block 2 stays at 12 and the bank
  stays unchanged. Runner 31 PASS; unit 59 PASS; build one line, no `%`, body
  parses.
- P09 closed on 2026-10-25: docs now match the P01–P08 code and fixtures. The
  retirement premise was stale: `bank-2021` did not initially assert all of
  `qwen2-s1`'s coverage, so the missing Q1/Q9/Q23/Q24/Q25/Q31/Q36/Q38 and
  `questions_with_e` assertions were ported first, then the pair was deleted.
  Runner 30 PASS; unit 59 PASS; extractor check green. No source or build
  change; no live checks added.
- Parser/UI commands are unchanged; AS phases add `node tests/unit.js`.
- `IMPROVISED C.docx.txt` is the priority-1 source; `ANOMALIES.txt` is priority-2.
- `ANOMALIES.txt` and the duplicate-file removals are committed.
- P02 pins the current bank hash; re-audit the manifest if the source changes.
- The former `merged_bookmarklet.txt` duplicate has been deleted. The canonical
  archived copy is `archive/trusted-variants/trusted-variant-C.js`.
- P03 is done: inline multi-pair keys are detected, and `bank-2021` is confirmed.
  P01 and P02 are done; historically, the 2021 input was sliced manually before
  the extractor existed.

## Source hierarchy and priority

1. **`archive/live-sources/IMPROVISED C.docx.txt`** — priority 1, canonical OCR
   bank. Contains six exam-year sections (2021–2026) plus one unheaded
   single-question section between 2025 and 2026. SHA-256:
   `270878b7980372c893f9396afa8fb128de23d37c65f4bfceb8429c85f0e8f809`.
2. **`archive/live-sources/ANOMALIES.txt`** — priority 2. SHA-256:
   `718ca1e70f84fcdc84280710394cdeb73e5ff62183e7b09d14e8ffc7d22e8321`.
   Block 2 (`STURCTURED GOVERNMENT QUESTIONS 2025`) is the original block that
   started the project. Block 1 is the `*`-bulleted, unnumbered family.
3. **`archive/migration-docs/`** — historical evidence and corroboration only.
4. **Synthetic fixtures** — explicit exceptions. Allowed only where no bank or
   anomaly input covers the documented behavior. They must be labelled.

## Non-negotiable rules

- The parser receives **one exam year per paste**. A paste can be a partial
  divider-delimited section, even a single question. Extracting a section from
  the bank is an external, deterministic step; multi-section parsing is out of
  scope.
- Add or change behavior only with a failing fixture first. Never regenerate an
  expected fixture from parser output.
- Do not weaken the strict `OPTION`, `splitSections`, or `splitQuestions` rules
  globally to accommodate anomalies. The bank fixtures are the regression wall.
- Do not edit `src/bookmarklet.js` or `src/bookmarklet.min.js`. Edit
  `src/parser/parser.js` or `src/ui/ui.js`, then run `node src/build/build.js`.
- Full-line `//` comments are allowed in parser/UI modules; `build.js` strips
  them before flattening. Inline `//` comments remain forbidden. Both generated
  bookmarklets must be one line and contain no `%`; the build fails on `%`.
- Do not change PHP, `ocr_helper.js`, existing storage keys/shapes, or the
  server contract. Auto-Save may add the new keys named in its spec; the
  existing `ocrQueue`, `ocrMeta`, and `ansKey` shapes stay compatible.
- Commit only at a phase boundary, after the previous phase's review settles.
  Do not commit current-phase work; commit the final phase before archiving.
- Keep the deliberate quirks: E/F → D collapse, advisory-only flags, blank
  options, `FIXES` order, the `+5` numbering guard, no absorbed-option
  post-processor.

## Fixture origins

Every `fixtures/expected/*.json` must eventually carry one of:

| `input_origin` | Meaning |
|---|---|
| `bank` | Slice or documented excerpt of `IMPROVISED C.docx.txt` (whitespace changes allowed; truncation noted) |
| `anomaly` | Slice of `ANOMALIES.txt` |
| `doc` | Real sample transcribed in a migration doc, not present in the bank |
| `synthetic` | Assistant-written input covering a behavior absent from the sources |

`P01` enforces this field. The free-text `provenance`/`source` fields still carry
the detailed evidence.

## Work packages

Status values: `not started`, `in progress`, `blocked`, `done`.

| ID | Document | Goal | Depends on | Status |
|---|---|---|---|---|
| P01 | [01-origin-taxonomy.md](01-origin-taxonomy.md) | Add and enforce `input_origin`; label the 25 current fixtures | — | done (2026-10-25) |
| P02 | [02-bank-extraction.md](02-bank-extraction.md) | Deterministic per-year extractor + 5 bank inputs + PENDING specs | P01 | done (2026-10-25) |
| P03 | [03-bank-2021-inline-key.md](03-bank-2021-inline-key.md) | 2021 fixture + first parser fix: detect inline keys | P02 (done) | done |
| P04 | [04-bank-2022.md](04-bank-2022.md) | 2022 fixture: inline key, real dotless option, 13 E-option questions | P03 | done (2026-10-25) |
| P05 | [05-bank-2023.md](05-bank-2023.md) | 2023 fixture: inline key + 8 E-option questions | P03 | done (2026-10-25) |
| P06 | [06-bank-2024-2025.md](06-bank-2024-2025.md) | 2024 partial-year fixture + 2025 fixture with missing key entry | P03 | done (2026-10-25) |
| P07 | [07-anomaly-block2-salvage.md](07-anomaly-block2-salvage.md) | Guarded salvage normalizer + block-2 fixture | P06 | done (2026-10-25) |
| P08 | [08-anomaly-block1-bullets.md](08-anomaly-block1-bullets.md) | Unnumbered `*` question mode | P07 | done (2026-10-25) |
| P09 | [09-docs-cleanup.md](09-docs-cleanup.md) | Docs updates, retire superseded fixtures, final audit | all | done (2026-10-25) |
| P10 | [10-post-p09-audit.md](10-post-p09-audit.md) | Fix post-P09 audit findings: salvage abbreviations, stale docs, flag/insert coverage | P09 | done (2026-10-25) |
| AS-01 | [as-01-contract-and-harness.md](as-01-contract-and-harness.md) | Contract changes, build comment/`%` guard, unit harness | — | done |
| AS-02 | [as-02-primitives-and-batch.md](as-02-primitives-and-batch.md) | `parseKeyDetailed`, E/F flag, batch/storage primitives | AS-01 | done |
| AS-03 | [as-03-gate-and-dedup.md](as-03-gate-and-dedup.md) | `autosaveBlockers`, duplicate safeguards, scenario tests | AS-02 | done |
| AS-04 | [as-04-save-pipeline.md](as-04-save-pipeline.md) | Shared `saveCurrentQuestion`, classification, marker/log | AS-03 | done (code; live smoke in AS-06) |
| AS-05 | [as-05-ui-and-loop.md](as-05-ui-and-loop.md) | Opt-in UI, loop, lock, visibility, dry run | AS-04 | done (code + mock; hide-pause verified 2026-10-25) |
| AS-06 | [as-06-verification-and-docs.md](as-06-verification-and-docs.md) | Docs close-out, dry-run/live acceptance, cap 3→10 | AS-05 | done |
| AS-07 | [as-07-duplicate-scope-and-marker.md](as-07-duplicate-scope-and-marker.md) | Fix 1 scoped duplicate check, Fix 2 marker guard, unverified list + stop, remove media guess | AS-06 | done (live checks passed 2026-10-25) |
| AS-08 | [as-08-active-mode.md](as-08-active-mode.md) | Opt-in active save mode, mode gate/suffix, live 2-question test | AS-07 | done (live 2-question test 2026-10-25) |
| AS-09 | [as-09-remaining-fixes-and-docs.md](as-09-remaining-fixes-and-docs.md) | Fixes 3–7, nit, Phase 3 doc corrections | AS-08 | done (2026-10-25) |
| P11 | [14-exam-category-period-acronyms.md](14-exam-category-period-acronyms.md) | Map `S.S.C.E.`/`W.A.S.S.C.E.` and period exam acronyms to the live category | P10 | done (2026-10-27); light-verified |
| P12 | [15-option-boundary-selection.md](15-option-boundary-selection.md) | Select one ordered A–D sequence; warn on a boundary-less second set | P11 | done (2026-10-27); reviewed, fixes applied |
| AS-10 | [16-duplicate-fingerprints.md](16-duplicate-fingerprints.md) | Prior-batch duplicate fingerprints in the retained saved log | P12; AS-09 | done (2026-10-27); reviewed, fixes applied, accepted |
| AS-11 | [17-batch-history.md](17-batch-history.md) | Additive 15-batch one-line history that survives Reset | AS-10 | done (2026-10-27); light-verified |
| AS-12 | [18-auto-dry-run-and-status.md](18-auto-dry-run-and-status.md) | Auto dry run after Load; separate dry/live status and reload states | AS-11 | not started |

## Dependency graph

```text
P01 ──> P02 ──> P03 ──┬──> P04
                      ├──> P05
                      └──> P06 ──> P07 ──> P08
                                             │
P01 ─────────────────────────────────────────┴──> P09
```

P04, P05, and P06 can run in parallel after P03. P07 requires the whole bank
suite to be green. P09 is last.

The AS track is linear and independent of P01–P09:

```text
AS-01 ──> AS-02 ──> AS-03 ──> AS-04 ──> AS-05 ──> AS-06
                                                     │
AS-07 <──────────────────────────────────────────────┘
  │
  └──> AS-08 ──> AS-09
```

Do not start AS-02 until AS-01's build and harness checks pass. Do not deliver
AS-06 without the 3-question live test. AS-07 must pass its live check before
AS-08; AS-08's live active test must pass before AS-09.

The post-AS follow-up track is linear and joins the completed AS track at
AS-10:

```text
P10 ──> P11 ──> P12 ──┐
                       ├──> AS-10 ──> AS-11 ──> AS-12
AS-09 ─────────────────┘
```

## Remaining verification queue

All historical work packages through AS-11 are done. AS-12 is planned, not
part of V1–V4. The remaining verification agenda is
live/evidence-only and is outlined in
[11-remaining-verification.md](11-remaining-verification.md):
live parser/OCR/bank run, live `questions` schema check, stale `ocrQueue`
behavior, and optional evidence gaps. It is not a work package and proposes no
parser/UI changes.

V1-V3 were recorded on 2026-10-25: the live admin page parsed `bank-2021` and
`anomaly-block2` against the fixtures, a controlled save was accepted as #1785
and deleted, and a stale queue without a batch identity loaded but auto-save
blocked. V4 stays open by decision (optional).

## Session protocol

1. Start one package per session. Attach
   [`prompts/phase-session.md`](prompts/phase-session.md) and pass `phase N`;
   the prompt resolves [`prompts/phase-map.md`](prompts/phase-map.md). Do not
   attach the package plan; attach only the phase prompt.
2. Verify the package, the README status row, every dependency's status,
   handoff, and actual probes, plus any earlier uncommitted settled phase in the
   catch-up plan. Stop if one is not done, has no handoff, has open questions,
   or fails verification.
3. Run `node tests/runner.js` and `node tests/unit.js`; record both counts.
   Docs-only packages follow the repository's docs-only test rule.
4. Report the read-only scope, dependency verification, review status, and
   commit readiness, then wait for an explicit `go`. Do not edit or commit in
   this gate.
5. After `go`, commit the previous settled work first, using the approved
   catch-up plan when more than one phase is settled. Stop if a required review
   is pending or findings are unresolved, or if unrelated changes are present.
   Update each phase's review checkpoint row and handoff `Review:` line from the
   record or light check; update the status-row review suffix too, and if the
   record is conditional on acceptance, record the user's acceptance there.
   Update the current snapshot if it still calls that review pending. Then make
   each approved catch-up commit in order, staging only that commit's named
   files; for a single phase, stage the handoff plus review record.
6. Execute only the current package. Keep parser and fixture changes separate
   where practical. Do not commit the current phase; its handoff defers commit
   to the next phase start.
7. Run the package's acceptance commands. Do not mark the package done on a
   partial pass. If a required browser or live check cannot be done, stop and
   ask.
8. Update the status row above and append a handoff note to the package file
   (date, result, files changed, open questions, hashes, review status, and
   `Commit: deferred`).
9. Stop after the handoff. Do not start the next phase. Leave the working tree
   resumable: no orphan inputs, no failing fixtures, and a note explaining
   anything left for the next session.

## Definition of done (every package)

- `node tests/runner.js` exits 0 with the expected PASS/PENDING counts.
- `node tests/unit.js` exits 0 for any package that touches parser, UI, storage,
  or tests; record both counts.
- No orphan inputs.
- New expectations were transcribed from the cited source and spot-checked; they
  were not copied from parser output.
- The package's own acceptance table is fully satisfied, with each row mapped to
  a test, probe, or explicit gap.
- Status and handoff notes are updated, including file hashes, review status,
  and `Commit: deferred`.
- No commit was made during the phase.
- If parser or UI changed: `node src/build/build.js` ran, `wc -l
  src/bookmarklet.js` prints `1`, its body passes `node --check`, and it
  contains no `%`. Do not rebuild `src/bookmarklet.min.js` unless the user
  explicitly asks for the minified release artifact; if it is rebuilt, it must
  meet the same checks and stay at or below 65536 bytes.
- Auto-Save packages also record their dry-run or live evidence in the package
  handoff. A partial dry run does not mark the package done.

## Shared commands

```sh
node tests/runner.js
node tests/unit.js
node tools/extract-bank.js --check
node -e "const p=require('./src/parser/parser.js'); console.log(p.splitQuestions('1. Hello'))"
node src/build/build.js
wc -l src/bookmarklet.js
rg -n '%' src/bookmarklet.js
```

Build syntax check (same rule as `docs/BUILD.md`):

```sh
node -e "const fs=require('fs');new Function(fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,''));console.log('OK')"
```

For a minified build explicitly requested by the user, run the same checks on
`src/bookmarklet.min.js`.

## Current expected fixture counts

| After package | PASS | PENDING | Notes |
|---|---|---|---|
| baseline (after P01/P02) | 25 | 4 | P03's bank-2021 already confirmed; 2022-2025 PENDING |
| P04 (done) | 26 | 3 | bank-2022 confirmed |
| P05 (done) | 27 | 2 | bank-2023 confirmed |
| P06 (done) | 29 | 0 | bank-2024 and bank-2025 confirmed |
| P07 (done) | 30 | 0 | anomaly block 2 added |
| P08 (done) | 31 | 0 | anomaly block 1 added |
| P09 (done) | 30 | 0 | `qwen2-s1` retired after porting its assertions to bank-2021 |
| P11 (done) | 38 | 0 | + `header-crs-ssce-periods` |
| P12 (done) | 41 | 0 | + Q46, single initials, duplicate labels |
| AS-10 (done) | 41 | 0 | no new runner fixtures; +19 unit tests (14 AS-10, 4 FIX-1 UI, 1 NOTE-2) |
| AS-11 (done) | 41 | 0 | no new runner fixtures; +11 unit tests (6 helpers, 5 UI history) |
| AS-12 (planned) | 41 | 0 | no new runner fixtures |

Planned rows are acceptance targets, not current results.

P01/P02 are reflected in the baseline. P03 ran before P02, so the 2021 slice is
already confirmed and P02 adds PENDING specs only for 2022-2025.

AS packages do not add or delete fixtures. AS-02 updates the existing
E/F fixtures to expect the new `E/F options present` flag; it does not add or
delete a fixture. AS unit tests live in `tests/unit.js` and are not part of the
runner summary.

AS-06 raised the auto-save run cap from 3 to 10 after the live sign-off and
rebuilt. The two-tab lock reason could not be shown live on one phone browser
because hide-pause releases the lock when tab 1 becomes hidden; the lock itself
is covered by `tests/unit.js` and the mock-browser check.

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
  and `NEEDS_PICTURE` removed. `tests/build-check.js` is a
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
