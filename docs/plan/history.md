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
smoke to OT10 and accepted OT04 implementation as complete. OT05 has not started
and remains blocked by the OT04 rigorous review plus its own database gate. This
was the 2026-11-02 state; the 2026-11-03 reconciliation below narrows the gate to
the missing exact DDL bytes.

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

The remaining OT05 dependency is one missing artifact: the exact supplied SQL DDL
bytes for `questions`, `subjects`, and `exam_category`. The checklist names
`questions.sql`, `subjects.sql`, and `exam_category.sql`, but no `.sql` file
exists in the worktree or anywhere in Git history. OT05 is therefore blocked
only on obtaining and placing those bytes.

Branch decisions:

- `owner-tool-integration` is the authoritative work branch and contains `main`
  plus all owner-tool work through OT04.
- `main` remains the published baseline and remote default; it is advanced only
  at a reviewed release boundary or cycle close.
- `ot04-fix` and `ot04-review` are fully merged into
  `owner-tool-integration` and retired.
- Implementation returns to `owner-tool-integration`; review sessions stay
  read-only and write only their review records.
