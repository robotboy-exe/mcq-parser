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
