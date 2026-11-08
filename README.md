# OCR Question Importer & Parser

Tools and pure parsing engines for importing OCR exam questions into the CBT
admin "Add a New Question" interface.

> **Note on Architecture:** The canonical parser implementation is
> `src/parser/core.js` (pure, dual Browser/Node export). The legacy bookmarklet
> build (`src/bookmarklet.js` and `src/ui/ui.js`) is retained for historical
> verification and evidence, but the production target is a direct, readable
> owner-tool integration (`owner-tool-2026-11` cycle) per `INTENT.md`.

The parser core is kept strictly pure and free of DOM, storage, or network code
so it can be tested without a browser and reused across browser and server contexts.

## Quick start

```sh
# Run the fixture harness, unit tests, and owner-tool harness
node tests/runner.js
node tests/unit.js
node tests/owner-tool.js
node tests/context-migration.js
php tests/context-lib.php
php tests/context-admin.php
php tests/context-preflight.php

# Verify the archived bank slices and their hashes
node tools/extract-bank.js --check

# Run the canonical parser core directly
node -e "const p=require('./src/parser/core.js'); console.log(p.parsePaste('1. Who was the father of faith? A. Abraham B. Moses C. David D. Joseph'))"
```

## Project layout

```text
src/
  parser/
    core.js            canonical pure parser (dual Node/Browser export, v2.3.2)
    comprehension.js   pure passage detection + scoped (a)-(d) options
    cloze.js           pure gap/table detection + generated cloze questions
    parser.js          legacy parser + auto-save helper module (re-exports core)
  ui/
    ui.js              legacy bookmarklet UI and DOM driver
  build/
    build.js           legacy bookmarklet bundler
  bookmarklet.js       legacy generated bookmarklet artifact
  owner-tool/
    controller.js      production owner-tool controller (native PRG saves)
    state.js           versioned cbtOwnerTool:v1 state store
    render.js          safe shared text renderer (exact <u> markers only)
    style.css          owner-tool panel styles
docs/
  STATUS.md            current checks, build hash, and live-test state
  SPEC.md              parser/UI behavior specification
  DECISIONS.md         why the unusual heuristics exist
  LIVE-SAFETY.md       live-write rules and incident record
  AGENTS.md            constraints for future agents
  BUILD.md             build and verification instructions
  EDGE_CASES.md        documented edge cases
  INVARIANTS.md        documented invariants
  BASELINE_COMPARISON.md  version comparison from Phase 2
  plan/                current work tracker and handoffs
  plan/history.md      dated snapshots, checkpoints, and change log
fixtures/
  inputs/              archived doc, bank, and anomaly samples
  expected/            documented expected outputs (CONFIRMED/PENDING)
archive/
  migration-docs/      original migration documents and claude-gaps.md
  trusted-variants/    original bookmarklet variants A/B/C
  legacy-bookmarklets/ supplied B1/B2/B3 (matched from first/second/third.js)
  live-sources/        admin PHP/HTML, ocr_helper.js, OCR text bank
  workspace-setup/     setup-era plan, phase prompts, and final report
  inbox/               parked raw inputs and triage notes
tests/runner.js        pure-Node fixture harness (no browser)
tests/unit.js          pure-Node unit tests for parser and auto-save helpers
tests/ui-harness.js    browser-free UI save/dry-run harness
tests/owner-tool.js    browser-free harness for the production owner-tool controller
tools/extract-bank.js  deterministic bank slicer and verifier
tools/bank-slices.json source hash, anchors, counts, and output hashes
```

## Behavior summary

- Accepts `N.` question markers (1–3 digits) and options A–F, dotted or
  dotless-after-newline; inline options are supported.
- Reads the header from the questions or the answer key and fills the year,
  subject (including CRS/Christian Religious Studies), and exam category
  (JAMB/UTME, POST UTME, SSCE, and related names).
- Accepts exam years 1900–2099 and keeps 19xx/20xx answer-title lines out of the
  final option.
- Folds OCR wrap lines in stems while preserving blank-line paragraphs; options
  remain single-line.
- Formats only balanced exact `<u>...</u>` markers through shared browser/PHP
  renderers; every other tag or malformed marker stays literal and escaped.
- Splits off an answer key by divider, header, structure, or key-only paste.
- One exam year per paste. Multi-year bank text is split with
  `tools/extract-bank.js`, not pasted whole.
- Recovers fused OCR question and option boundaries only when the repair adds
  questions, and flags the result for review.
- Parses an unnumbered `*` bullet block as questions with `num: null` and a
  `question number missing` flag; it never invents numbers.
- Collapses E/F answers into Option D, because the page has only four options
  and radios 0–3 (a hard server constraint).
- Shows advisory flags such as `option C missing` in the OCR panel and again
  under the Save button; it never blocks saving.
- Flags numbering gaps on the following question, e.g. `question 10 missing
  (numbering gap)` when the paste goes from Q9 to Q11.
- Fills the native Add form one question at a time; saves stay manual through
  the existing PRG flow and advance only on the exact success flash.
- Reviews shared contexts as editable local cards, prefills the native context
  form, binds returned IDs only on exact PRG success, and blocks linked saves
  while a saved context draft is stale.
- Keeps context creation, question saves, and final activation as separate
  explicit native administrator actions; none is posted automatically.
- Persists the queue, header metadata, and key in versioned `cbtOwnerTool:v1`
  state; legacy `ocrQueue`, `ocrMeta`, and `ansKey` are detected but never
  imported or deleted.
- Refuses a stale parser version or corrupt state without deleting it; only a
  full re-paste or explicit Reset replaces state.
- Never forces `is_active`; the administrator keeps the native checkbox.
- Uses the existing native form, CSRF token, and server field names; no
  Auto-Save, forced active saves, or `ocrSubmitted` access.

Full details: `docs/SPEC.md`. Rationale and risks: `docs/DECISIONS.md`.

## Status

Current test counts, build hash and size, and live-test state are in
[`docs/STATUS.md`](docs/STATUS.md). Current work state, package gates, and branch
strategy are in [`docs/plan/README.md`](docs/plan/README.md). OT05 and its latest
accepted Phase 6 fixes and third re-review are complete in the working tree. The
owner rejected `BLOCK-8` on 2026-11-05 because authoritative `questions.sql` and
the corroborating `questions1.sql` export are unpartitioned and no supported
application path changes table partitioning. Phase 6 is review-settled and
included in the 2026-11-05 boundary commit; `NOTE-4` is non-blocking. The owner
removed `cbt_practice.php` and `practice_title` from the remaining cycle scope.
The available-source reader/writer audit passed on 2026-11-05. OT06 targets
`cbt.php` and passed its light review at OT07 Gate 1. OT07 is implemented; its
rigorous Release B review returned PASS WITH ACCEPTED FINDINGS, and `FIX-1`
(handoff hash/byte accuracy) was closed by the 2026-11-06 closure-focused
re-review, so phase 8 is review-settled. OT08 is implemented and passed its
light review at OT09 Gate 1. OT09 cloze OCR is implemented with parser 2.3.2;
its rigorous Release C review returned `BLOCK` on 2026-11-07 (`BLOCK-1`,
`FIX-1`), the owner authorized `fix` for both, and the fix was applied on
2026-11-07 (`cloze.js` 242 lines; a colliding cloze group is refused with a
warning); the re-review closed both and recorded `FIX-2` in its first review
round, and the owner changed the `FIX-2` requirement on 2026-11-07 to keep the
first cloze group and drop later colliding groups with a naming warning. The
2026-11-07 fix session applied that rule (parser 2.3.2), and the closure-focused
second re-review returned `PASS` and closed `FIX-2` on 2026-11-08, so phase 10
is review-settled and included in the 2026-11-08 boundary commit. Same-paste
answer keys were supplied in `sample-passages.txt` on 2026-11-08 (comprehension
Q13-Q15, cloze Q71-Q80) for OT10 validation.
Runtime/staging verification is deferred to OT10.

Active work happens on `owner-tool-integration`. `main` is the published baseline
and the remote default; do not start new implementation there. The fixture runner
is the regression gate.

The behavior baseline is `trusted-variant-C.js` (the merged one-box artifact);
see [`docs/BASELINE_COMPARISON.md`](docs/BASELINE_COMPARISON.md). After changing
parser or owner-tool code, press Reset and re-paste rather than trusting old
`cbtOwnerTool:v1` state (EC-62/INV-56). Live deletes and cleanup are owner-only; see
[`docs/LIVE-SAFETY.md`](docs/LIVE-SAFETY.md).
