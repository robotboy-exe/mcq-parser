# OCR Parser Work Plan — Coordinator

This is the entry point for all remaining parser, fixture, Auto-Save, and
housekeeping work.
Read this file, then read the one work-package file you are executing. Each
package document is self-contained; you should not need any other package
document to finish it.

For P11–P12/AS-10–AS-12, the user's intent is in
[`INTENT.md`](../../INTENT.md) at the project root. Read it before those
packages. Package prose owns implementation detail; `INTENT.md` is the
tie-breaker for behavior.

Last updated: 2026-10-27.

Dated snapshots, archived checkpoints, and the change log are in
[`history.md`](history.md).

## Housekeeping cycle (housekeeping-2026-10)

The active map is [`prompts/phase-map.md`](prompts/phase-map.md). These phases
clean up docs, ignored artifacts, and the tracker; they do not change parser or
UI behavior and do not add fixtures. The archived `post-as-2026-10` review
checkpoints are in [`history.md`](history.md).

| Phase | Package | Status |
|---|---|---|
| 1 | [01-untrack-min.md](housekeeping/01-untrack-min.md) | done (2026-10-27); docs/index-only; reviewed PASS; committed in cycle-close catch-up |
| 2 | [02-truth-reset.md](housekeeping/02-truth-reset.md) | done (2026-10-27); docs-only; reviewed PASS; committed in cycle-close catch-up |
| 3 | [03-archive-and-split.md](housekeeping/03-archive-and-split.md) | done (2026-10-27); docs-only; reviewed PASS; committed in cycle-close catch-up |
| 4 | [04-local-cleanup.md](housekeeping/04-local-cleanup.md) | done (2026-10-27); local cleanup; reviewed PASS; committed in cycle-close catch-up |
| 5 | [05-inbox-triage.md](housekeeping/05-inbox-triage.md) | done (2026-10-27); docs/inbox-only; reviewed PASS; NOTE-1/3/4/5 fixed; NOTE-6 catch-up approved; committed at cycle close |

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

`docs/Active.md` is the historical merged review for the work after AS-06. Its
phases map to three plan packages so the status table, acceptance gates, and
handoff notes stay in one place. It was the authoritative detailed spec for
that track; the package files added preconditions, acceptance, and handoff.

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

The old `tests/build-check.js` lived only in the removed review packet and is
not a workspace test; use the BUILD.md checks.

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
also depending on AS-09. For this track, rebuild only `src/bookmarklet.js`.
`src/bookmarklet.min.js` is untracked and outside the workspace contract; do
not rebuild it. Commits follow the phase-boundary rule below.

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

At cycle end, attach [`prompts/cycle-close.md`](prompts/cycle-close.md) and
send `cycle close`. It has a read-only Gate 1, then verifies the final phase is
done and its latest review is `PASS` or accepted, updates the final status row,
checkpoint row, handoff `Review:` and `Commit:` lines, and the history snapshot.
Then it stages the handoff plus review record(s), runs the checks, and commits.
It executes no package and does not archive. Do not use a normal phase session
for this, because the final package is already `done`.

Do not archive automatically when the last phase stops. Archive only when the
user confirms the cycle is complete or satisfied, or explicitly asks to shelve
it. Then copy the active map to `prompts/cycles/<old-cycle-id>.md`, replace
`phase-map.md` with the new cycle, and leave `phase-session.md` unchanged. The
new-cycle checklist and map template are in
[`prompts/cycles/README.md`](prompts/cycles/README.md). Use
`cycle <id> phase N` only for an archived map.

### Historical checkpoints

The archived `post-as-2026-10` review checkpoints, catch-up commits, and dated
snapshots are in [`history.md`](history.md).

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
- Do not edit `src/bookmarklet.js`; it is generated. Edit
  `src/parser/parser.js` or `src/ui/ui.js`, then run `node src/build/build.js`.
  `src/bookmarklet.min.js` is untracked; do not edit, rely on, or rebuild it.
- Full-line `//` comments are allowed in parser/UI modules; `build.js` strips
  them before flattening. Inline `//` comments remain forbidden. The generated
  `src/bookmarklet.js` must be one line and contain no `%`; the build fails on
  `%`.
- Do not change PHP, `ocr_helper.js`, existing storage keys/shapes, or the
  server contract. Auto-Save may add the new keys named in its spec; the
  existing `ocrQueue`, `ocrMeta`, and `ansKey` shapes stay compatible.
- Commit only at a phase boundary, after the previous phase's review settles.
  Do not commit current-phase work; commit the final phase before archiving.
- By default, the agent does not delete or clean up live records. Live writes
  need per-action approval for exact IDs and fields; destructive checks use
  staging or owner-run cleanup. Read [`docs/LIVE-SAFETY.md`](../LIVE-SAFETY.md)
  before any live check.
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
| AS-12 | [18-auto-dry-run-and-status.md](18-auto-dry-run-and-status.md) | Auto dry run after Load; separate dry/live status and reload states | AS-11 | done (2026-10-27); reviewed; re-review passed; NOTE-3 docs fixed; NOTE-4 accepted (separate docs commit); committed at cycle close |

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

All historical work packages through AS-12 are done. AS-12 is not part of
V1–V4. The remaining verification agenda is
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
4. Report the read-only scope, dependency verification, review status, commit
   readiness, and any live actions (none/read-only/write, with exact IDs), then
   wait for an explicit `go`. Do not edit or commit in this gate.
5. After `go`, commit the previous settled work first, using the approved
   catch-up plan when more than one phase is settled. Stop if a required review
   is pending or findings are unresolved, or if unrelated changes are present.
   Update each phase's review checkpoint row and handoff `Review:` line from the
   record or light check; update the status-row review suffix too, and if the
   record is conditional on acceptance, record the user's acceptance there.
   Update the history snapshot if it still calls that review pending. Then make
   each approved catch-up commit in order, staging only that commit's named
   files; for a single phase, stage the handoff plus review record.
6. Execute only the current package. Keep parser and fixture changes separate
   where practical. Do not commit the current phase; its handoff defers commit
   to the next phase start.
7. Run the package's acceptance commands. Do not mark the package done on a
   partial pass. If a required browser or live check cannot be done, stop and
   ask. Before any live/browser check, read
   [`docs/LIVE-SAFETY.md`](../LIVE-SAFETY.md). Do not delete or clean up live
   records; a destructive live check requires staging or owner-run cleanup.
   Leave live-created test rows for the owner and record their exact IDs.
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
  contains no `%`. Do not rebuild `src/bookmarklet.min.js`; it is untracked.
- Auto-Save packages also record their dry-run or live evidence in the package
  handoff. A partial dry run does not mark the package done.
- Any live write is recorded with its exact IDs and fields. The agent performed
  no live delete/cleanup; created test rows are left for the owner or cleaned
  up under [`docs/LIVE-SAFETY.md`](../LIVE-SAFETY.md).

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

For a minified build, do not use the legacy `--min` path; `src/bookmarklet.min.js`
is untracked and outside the workspace contract.

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
| AS-12 (done) | 41 | 0 | no new runner fixtures; +8 unit tests (1 helper, 7 UI dry/live) |

Rows marked planned were acceptance targets, not results; no row is currently planned.

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
