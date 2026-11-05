# Work Plan History

Current package state is in [`README.md`](README.md) and current project state
is in [`../STATUS.md`](../STATUS.md). This file preserves completed and shelved
cycle history.

## Parser Evidence Cycle — P01-P09

Completed on 2026-10-24 and documented through 2026-10-30.

| ID | Result |
|---|---|
| P01 | Added and enforced fixture `input_origin` taxonomy |
| P02 | Added deterministic per-year bank extraction and source hashes |
| P03 | Added inline multi-pair key detection and confirmed bank 2021 |
| P04 | Confirmed bank 2022 expectations |
| P05 | Confirmed bank 2023 expectations |
| P06 | Confirmed bank 2024 and 2025 expectations |
| P07 | Added guarded fused-boundary salvage for anomaly block 2 |
| P08 | Added unnumbered bullet mode for anomaly block 1 |
| P09 | Reconciled docs, retired duplicate fixture coverage, and audited the suite |

Final `main` baseline: 25 fixtures PASS, 0 FAIL, 0 PENDING. The bank extractor
verifies five output slices. Package files remain in `docs/plan/01-*.md`
through `09-*.md`.

Catch-up verification on 2026-10-30 exercised all documented parser/browser
edge cases then open: a production bookmarklet save confirmed the native
question save/schema path, an old helper queue loaded, and the installed
bookmarklet opened in Brave/Android.

## Clean Experiments Baseline

The selected integration evidence base is commit `d5a62f0`. Its handoff claims
43 fixture passes and 140 unit/UI passes; OT00 must independently establish the
exact clean-commit baseline before merge.

The existing experiments worktree contains later uncommitted AS-14/P20-P22
work. A read-only review on 2026-10-31 returned `BLOCK` despite green 46/155
suites. Material findings included:

- post-option boundary logic deleted legitimate canonical-bank lead-in text and
  next-line option text;
- editable image-plan ranges could bypass the intended image pause;
- partial bulk image selection could attach a stale file;
- natural-language range parsing captured unrelated figure/year digits;
- package/review scope and source provenance were incomplete.

Owner decision: shelve those uncommitted changes, leave that worktree untouched,
and integrate only clean `d5a62f0`. OT00 must create a durable review/exclusion
record on the integration line without copying the dirty source changes.

## Owner Tool Planning — 2026-10-31

The owner supplied current copies of:

- `deployed/admin_questions.php`
- `deployed/cbt.php`
- `deployed/cbt_practice.php`
- `admin-needs.txt`
- `sample-underline.txt`
- `sample-passages.txt`

Product decisions recorded in [`../../INTENT.md`](../../INTENT.md):

- replace `ocr_helper.js`; do not ship a bookmarklet;
- use readable shared helper files;
- use a manual-review, native-PRG workflow with fresh versioned state;
- exclude experiments Auto-Save and image-plan features;
- ship underline/multiline first, manual shared contexts second, and OCR
  comprehension/cloze automation third;
- randomize complete context groups as units and show context above every linked
  question in both candidate pages;
- support multiple or singular contexts per paste and years 1900-2099.

The `owner-tool-2026-11` file-based cycle was materialized on 2026-10-31. This
was documentation-only: no parser, UI, PHP, SQL, fixture, generated build, or
deployed source was changed, and no commit was made.

## Owner Tool Initial Snapshot

| Package | Initial status |
|---|---|
| OT00 | not started |
| OT01 | not started |
| OT02 | not started |
| OT03 | blocked pending production helper |
| OT04 | blocked pending answer-details source |
| OT05 | blocked pending DB contract |
| OT06 | blocked pending practice writer/search audit |
| OT07 | not started |
| OT08 | not started |
| OT09 | not started |
| OT10 | blocked pending prior packages/local PHP/staging |

## OT04 Source Arrival and Fix — 2026-11-02

The owner supplied `answer_details.php` before OT04 handoff. Its SHA-256 is
`680cfd697ba61b3c21e07c0f9e2cb4d6780ea2100ceae8e78fd4e492aa7368bf`;
the byte-identical archive is
`archive/live-sources/answer_details-2026-11-02.php`.

An implementation handoff from another machine arrived as commits `83b11ba`
and `1c56b58`. Review found that stale package files had replaced the completed
OT03 handoff and that parser/state/PRG boundary cases were untested. The OT04 fix
session restored OT03 exactly, retained the useful Release A implementation,
added regression evidence, and assigned first-time detail integration to OT04.
OT10 now owns independent Release A, target-PHP, staging, and Brave/Android
verification. On 2026-11-02 the owner deferred the unavailable staging/mobile
smoke to OT10 and accepted OT04 implementation as complete. OT05 had not started and was then
blocked by the OT04 rigorous review plus its own database gate. That was the
2026-11-02 state; the 2026-11-03 reconciliation below narrowed the gate to the
missing exact DDL bytes, which arrived later that day (see below).

## OT05 Gate Reconciliation — 2026-11-03

A documentation and branch audit reconciled the active cycle with the agreed
rescope. No application code, parser behavior, PHP contract, or fixture changed.

Confirmed and removed from the blocker list:

- PHP 8.3 is the application target; MySQL 8.0.41, InnoDB, and
  `utf8mb4_unicode_ci` are settled.
- Root `db_conn.php` supplies the PDO connection contract. A redacted or full
  `cbt_db.php` is not required.
- Runtime/staging verification belongs to OT10, not OT05.
- The `exam_category2` → `exam_category` correction is settled.

At the time of the audit, the remaining OT05 dependency was one missing
artifact: the exact supplied SQL DDL bytes for `questions`, `subjects`, and
`exam_category`. No `.sql` file existed in the worktree or anywhere in Git
history then. OT05 was therefore blocked only on obtaining and placing those
bytes. Later on 2026-11-03 the owner supplied them; see below.

Branch decisions:

- `owner-tool-integration` is the authoritative work branch and contained `main`
  plus all owner-tool work through OT04 at that time.
- `main` remains the published baseline and remote default; it is advanced only
  at a reviewed release boundary or cycle close.
- `ot04-fix` and `ot04-review` are fully merged into
  `owner-tool-integration` and retired.
- Implementation returns to `owner-tool-integration`; review sessions stay
  read-only and write only their review records.

## OT05 DDL Arrival — 2026-11-03

The owner supplied the missing schema artifacts in `main` commit `002483b`
("provided more deployment files"). The commit adds `questions.sql`,
`subjects.sql`, `exam_category.sql`, plus root copies of the deployment PHP files.

The three SQL files were copied to `owner-tool-integration` without merging the
root PHP copies, because those root PHP files differ from the OT04 working copies
under `deployed/`. The SQL exports are the evidence OT05 needed; the root PHP
files are not part of this step.

`exam_category.sql` still uses `exam_category2` in its `CREATE TABLE` and
`ALTER TABLE` statements. The developer's settled instruction is to replace every
`exam_category2` identifier with `exam_category` in the working DDL copy while
keeping the supplied file unchanged as evidence.

OT05 then had no remaining external gate; its Gate 1 session began the next day
(see the 2026-11-04 implementation entry below).

The accompanying documentation duplicate audit found no exact or
whitespace-normalized duplicate Markdown files under `docs/`. Historical records
such as `Active.md`, `Auto-Save-Spec.md`, and the `plan/11-19` notes are retained
as evidence; no docs were deleted.

## OT05 Implementation Complete - 2026-11-04

OT05 was implemented on `owner-tool-integration` without committing. The working
tree now includes:

- `archive/sql/2026-11-03-supplied/` with unchanged supplied DDL and hashes;
- `deployed/sql/base-schema.working.sql`, forward migration, guarded rollback,
  and a disposable-database runbook;
- `deployed/context_lib.php` and context create/edit/link/activate/deactivate/
  delete actions in `deployed/admin_questions.php`;
- `tools/context-migration-preflight.php`;
- `tests/context-migration.js` and `tests/context-lib.php`; and
- updated `AGENTS.md`, package status/handoff, and continuation docs.

OT05 chose a separate `question_contexts` table with ordered membership columns
on `questions`. Linked questions are forced inactive; context activation is the
OT06 publication switch, while legacy candidate queries remain unchanged.

Local checks on PHP 8.3.16: 47 runner PASS + 2 PENDING, 145 unit PASS, 38
owner-tool PASS, 8 context-migration PASS, 12 context-lib PASS, 9 PHP renderer
PASS, and `php -l` PASS. The known Windows/CRLF `extract-bank` pre-2026 output
hash mismatch is pre-existing and not part of OT05. Target-runtime migration,
preflight, rollback, and browser/admin PRG checks remain deferred to OT10.

OT06 Gate 1 remains blocked on the practice writer/importer and reader/writer
search audit. No commit was made.

The earlier 2026-11-03 note that OT05 "remains not started" records the state
before this implementation session.

## OT06 — Candidate Group Delivery (2026-11-05)

Gate 1 passed on base `8f1d7e5`. Implemented whole-unit selection and context
hydration in `deployed/cbt_candidate_selection.php` and
`deployed/cbt_candidate_repository.php`, wired the `cbt.php` question reads to
the repository, and rendered open context cards with active-slot cloze
highlighting via `src/cbt/context-render.js` and `src/cbt/context.css`.

Local evidence: 7 `cbt-candidate` PASS, 4 `cbt-context` PASS, 47/0/2 runner,
145 unit, 38 owner-tool, 13 context-migration (the obsolete OT05 `cbt.php`
untouched guard was updated to the OT06 delegation boundary), 13 context-lib,
19 context-admin, 6 context-preflight, 9 PHP renderer, and PHP lint PASS. The
isolated Chromium/CDP harness showed an exam total of 4 with one open card and
one active mark, and mixed results with total 6, four open cards, two active
marks, two standalone detail links, and context text once in the payload.

Target MySQL/staging execution remains OT10. No live/staging DB write was used.
No commit was made; review is pending at OT07 Gate 1.

## OT07 — Owner Context Workflow (2026-11-05)

OT06 passed its light review at OT07 Gate 1 with no material findings. OT07 was
then implemented on package base `8f1d7e5` without committing. The owner tool
now keeps editable local context cards, prefills the native context form, binds
server IDs only after exact create/update PRG success, marks edited saved drafts
stale, fills linked question context fields, clears them for standalone items,
and leaves creation, question save, and activation as explicit native actions.

The additive `cbtOwnerTool:v1` state keeps `contexts[]`, per-item context links,
and pending action kinds without a version bump. Reset now creates a fresh empty
owner state and clears native form fields while leaving legacy `ocrQueue`,
`ocrMeta`, and `ansKey` untouched.

Local evidence: 47/0/2 runner, 145 unit, 47 owner-tool, 13 context-migration,
4 cbt-context, 13 context-lib, 19 context-admin, 6 context-preflight, 9 PHP
renderer, 7 cbt-candidate, and PHP 8.3 lint PASS. Every existing production file
stayed below 100 additions and every new JavaScript module stayed within 250
readable lines. No live/staging write or browser runtime check was used. The
known Windows/CRLF bank-extractor hash mismatch remains pre-existing. The owner
then requested a machine-transfer checkpoint commit before the rigorous Release
B review.
