# OCR Parser Work Plan — Coordinator

This is the entry point for all remaining parser, fixture, and Auto-Save work.
Read this file, then read the one work-package file you are executing. Each
package document is self-contained; you should not need any other package
document to finish it.

Last updated: 2026-10-25.

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

## Current snapshot

- Current test status: `node tests/runner.js` → 25 PASS, 0 FAIL, 0 PENDING;
  `node tests/unit.js` → 49 PASS, 0 FAIL.
- Auto-Save AS-01 through AS-07 are done. AS-06 closed on 2026-10-25 with the
  five dry-run scenarios, hide-pause, mock lock, and the live 3-question test;
  the run cap is now 10. Two-tab live testing is limited by hide-pause on one
  browser; the lock reason is covered by unit + mock.
- AS-07 closed on 2026-10-25: Fix 1 (scoped duplicate check), Fix 2 (manual
  marker refusal), the per-question unverified list, the two-consecutive stop,
  and removal of `needs-media`. Runner 25 PASS; unit 49 PASS; build one line,
  no `%`, body parses. Live checks on the real admin page passed: #1754 was
  139 + `…`; Start stopped a same-year/category repeat with 0 POST; a 2022
  repeat and a different long question dry-ran as saves; the manual-marker
  refusal made 0 POST and the cleared marker let one POST reach the server
  (rejected with exam year 1800, so no row was inserted). Mock checks cover the
  unverified list/stop and media/file-attached. AS-08 may start.
- Parser/UI commands are unchanged; AS phases add `node tests/unit.js`.
- `IMPROVISED C.docx.txt` is the priority-1 source; `ANOMALIES.txt` is priority-2.
- `ANOMALIES.txt` and the duplicate-file removals are committed.
- P02 pins the current bank hash; re-audit the manifest if the source changes.
- The former `merged_bookmarklet.txt` duplicate has been deleted. The canonical
  archived copy is `archive/trusted-variants/trusted-variant-C.js`.
- P03 is done: inline multi-pair keys are detected, and `bank-2021` is confirmed.
  P01/P02 are still pending; the 2021 input was sliced manually.

## Source hierarchy and priority

1. **`archive/live-sources/IMPROVISED C.docx.txt`** — priority 1, canonical OCR
   bank. Contains five exam-year sections: 2021–2025. SHA-256:
   `96ed3af8fb53e3ba3f2bf355a5f8094db54587996f1c8112e088dae5347c5a5c`.
2. **`archive/live-sources/ANOMALIES.txt`** — priority 2. SHA-256:
   `718ca1e70f84fcdc84280710394cdeb73e5ff62183e7b09d14e8ffc7d22e8321`.
   Block 2 (`STURCTURED GOVERNMENT QUESTIONS 2025`) is the original block that
   started the project. Block 1 is the `*`-bulleted, unnumbered family.
3. **`archive/migration-docs/`** — historical evidence and corroboration only.
4. **Synthetic fixtures** — explicit exceptions. Allowed only where no bank or
   anomaly input covers the documented behavior. They must be labelled.

## Non-negotiable rules

- The parser receives **one exam year per paste**. Extracting a year from the
  bank is an external, deterministic step; multi-year parsing is out of scope.
- Add or change behavior only with a failing fixture first. Never regenerate an
  expected fixture from parser output.
- Do not weaken the strict `OPTION`, `splitSections`, or `splitQuestions` rules
  globally to accommodate anomalies. The bank fixtures are the regression wall.
- Do not edit `src/bookmarklet.js`. Edit `src/parser/parser.js` or
  `src/ui/ui.js`, then run `node src/build/build.js`.
- Full-line `//` comments are allowed in parser/UI modules; `build.js` strips
  them before flattening. Inline `//` comments remain forbidden. The generated
  bookmarklet must be one line and contain no `%`; the build fails on `%`.
- Do not change PHP, `ocr_helper.js`, existing storage keys/shapes, or the
  server contract. Auto-Save may add the new keys named in its spec; the
  existing `ocrQueue`, `ocrMeta`, and `ansKey` shapes stay compatible.
- Do not commit unless the user explicitly asks.
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

`P01` introduces and enforces this field. Until then, provenance lives in the
free-text `provenance`/`source` fields.

## Work packages

Status values: `not started`, `in progress`, `blocked`, `done`.

| ID | Document | Goal | Depends on | Status |
|---|---|---|---|---|
| P01 | [01-origin-taxonomy.md](01-origin-taxonomy.md) | Add and enforce `input_origin`; label the 19 existing fixtures | — | not started |
| P02 | [02-bank-extraction.md](02-bank-extraction.md) | Deterministic per-year extractor + 5 bank inputs + PENDING specs | P01 | not started; needed before P04–P06 |
| P03 | [03-bank-2021-inline-key.md](03-bank-2021-inline-key.md) | 2021 fixture + first parser fix: detect inline keys | P02 (deferred) | done |
| P04 | [04-bank-2022.md](04-bank-2022.md) | 2022 fixture: inline key, real dotless option, 13 E-option questions | P03 | not started |
| P05 | [05-bank-2023.md](05-bank-2023.md) | 2023 fixture: inline key + 8 E-option questions | P03 | not started |
| P06 | [06-bank-2024-2025.md](06-bank-2024-2025.md) | 2024 partial-year fixture + 2025 fixture with missing key entry | P03 | not started |
| P07 | [07-anomaly-block2-salvage.md](07-anomaly-block2-salvage.md) | Guarded salvage normalizer + block-2 fixture | P06 | not started |
| P08 | [08-anomaly-block1-bullets.md](08-anomaly-block1-bullets.md) | Unnumbered `*` question mode | P07 | not started |
| P09 | [09-docs-cleanup.md](09-docs-cleanup.md) | Docs updates, retire superseded fixtures, final audit | all | not started |
| AS-01 | [as-01-contract-and-harness.md](as-01-contract-and-harness.md) | Contract changes, build comment/`%` guard, unit harness | — | done |
| AS-02 | [as-02-primitives-and-batch.md](as-02-primitives-and-batch.md) | `parseKeyDetailed`, E/F flag, batch/storage primitives | AS-01 | done |
| AS-03 | [as-03-gate-and-dedup.md](as-03-gate-and-dedup.md) | `autosaveBlockers`, duplicate safeguards, scenario tests | AS-02 | done |
| AS-04 | [as-04-save-pipeline.md](as-04-save-pipeline.md) | Shared `saveCurrentQuestion`, classification, marker/log | AS-03 | done (code; live smoke in AS-06) |
| AS-05 | [as-05-ui-and-loop.md](as-05-ui-and-loop.md) | Opt-in UI, loop, lock, visibility, dry run | AS-04 | done (code + mock; hide-pause verified 2026-10-25) |
| AS-06 | [as-06-verification-and-docs.md](as-06-verification-and-docs.md) | Docs close-out, dry-run/live acceptance, cap 3→10 | AS-05 | done |
| AS-07 | [as-07-duplicate-scope-and-marker.md](as-07-duplicate-scope-and-marker.md) | Fix 1 scoped duplicate check, Fix 2 marker guard, unverified list + stop, remove media guess | AS-06 | done (live checks passed 2026-10-25) |
| AS-08 | [as-08-active-mode.md](as-08-active-mode.md) | Opt-in active save mode, mode gate/suffix, live 2-question test | AS-07 | not started |
| AS-09 | [as-09-remaining-fixes-and-docs.md](as-09-remaining-fixes-and-docs.md) | Fixes 3–7, nit, Phase 3 doc corrections | AS-08 | not started |

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

## Session protocol

1. Run `node tests/runner.js`; for AS-01 onward also run `node tests/unit.js`.
   Record the starting result.
2. Read the package document completely before editing anything.
3. Confirm its preconditions (status of dependencies, source hashes, test count).
4. Execute the steps. Keep parser changes and fixture changes in separate
   commits/diffs when possible, but do not commit unless asked. The exception
   is AS-07…AS-09: `docs/Active.md` §1 explicitly asks for one commit at each
   phase boundary, so that is the only commit instruction for those packages.
5. Run the package's acceptance commands. Do not mark the package done on a
   partial pass.
6. Update the status row above and append a handoff note to the package file
   (date, result, files changed, open questions, new hashes).
7. Leave the working tree in a resumable state: no orphan inputs, no failing
   fixtures, and a note explaining anything left for the next session.

## Definition of done (every package)

- `node tests/runner.js` exits 0 with the expected PASS/PENDING counts.
- For AS packages, `node tests/unit.js` exits 0.
- No orphan inputs.
- New expectations were transcribed from the cited source and spot-checked; they
  were not copied from parser output.
- The package's own acceptance table is fully satisfied.
- Status and handoff notes are updated.
- If parser or UI changed: `node src/build/build.js` ran, `wc -l
  src/bookmarklet.js` prints `1`, the body passes `node --check`, and
  `src/bookmarklet.js` contains no `%`.
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
node -e "const fs=require('fs');const s=fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,'');new Function(s);console.log('OK')"
```

## Current expected fixture counts

| After package | PASS | PENDING | Notes |
|---|---|---|---|
| baseline | 19 | 0 | before P03 |
| P03 (done) | 20 | 0 | inline-key fix + bank-2021; P02 extractor deferred |
| P04 | 21 | 0 | bank-2022 confirmed |
| P05 | 22 | 0 | bank-2023 confirmed |
| P06 | 24 | 0 | bank-2024 and bank-2025 confirmed |
| P07 | 25 | 0 | anomaly block 2 added |
| P08 | 26 | 0 | anomaly block 1 added |
| P09 | 25 | 0 | `qwen2-s1` retired; bank-2021 covers it |

P01/P02 are not reflected above. If P02 is executed later, it adds five PENDING
specs; the 2021 one is already confirmed.

AS packages normally leave the fixture count at 25. AS-02 updates the existing
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
- 2026-10-25 — Auto-Save phased as AS-01…AS-06; build gains full-line comment
  stripping and a no-`%` guard; unit harness planned.
- 2026-10-24 — numbering gaps are flagged on the following question
  (`gap-q10-missing`); 25 fixtures.
- 2026-10-24 — header inference extended: answer-key headers fill the form,
  exam category is inferred, CRS alias added; four synthetic header fixtures.
- 2026-10-24 — plan created; duplicates removed; ANOMALIES.txt received.
