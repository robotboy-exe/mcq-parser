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
# Run the fixture harness and unit tests
node tests/runner.js
node tests/unit.js

# Verify the archived bank slices and their hashes
node tools/extract-bank.js --check

# Run the canonical parser core directly
node -e "const p=require('./src/parser/core.js'); console.log(p.parsePaste('1. Who was the father of faith? A. Abraham B. Moses C. David D. Joseph'))"
```

## Project layout

```text
src/
  parser/
    core.js            canonical pure parser (dual Node/Browser export, v2.0.0)
    parser.js          legacy parser + auto-save helper module (re-exports core)
  ui/
    ui.js              legacy bookmarklet UI and DOM driver
  build/
    build.js           legacy bookmarklet bundler
  bookmarklet.js       legacy generated bookmarklet artifact
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
tools/extract-bank.js  deterministic bank slicer and verifier
tools/bank-slices.json source hash, anchors, counts, and output hashes
```

## Behavior summary

- Accepts `N.` question markers (1–3 digits) and options A–F, dotted or
  dotless-after-newline; inline options are supported.
- Reads the header from the questions or the answer key and fills the year,
  subject (including CRS/Christian Religious Studies), and exam category
  (JAMB/UTME, POST UTME, SSCE, and related names).
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
- Loaded queues can jump to a book question number with "Go to question".
- Persists the queue, header metadata, and key in `localStorage` under
  `ocrQueue`, `ocrMeta`, and `ansKey`; the key survives reloads.
- Draft auto-save is the default and saves inactive; active mode is opt-in and
  never persisted. Manual saves stay active.
- Does not read, write, or delete the legacy `ocrSubmitted` key.
- Never changes the PHP, the CSRF token, or the server field names.

Full details: `docs/SPEC.md`. Rationale and risks: `docs/DECISIONS.md`.

## Status

Current test counts, build hash and size, and live-test state are in
[`docs/STATUS.md`](docs/STATUS.md). The fixture runner is the regression gate;
remaining live checks are tracked in
[`docs/plan/11-remaining-verification.md`](docs/plan/11-remaining-verification.md).

The behavior baseline is `trusted-variant-C.js` (the merged one-box artifact);
see [`docs/BASELINE_COMPARISON.md`](docs/BASELINE_COMPARISON.md). After updating
the bookmarklet, press Reset Queue and re-paste rather than trusting an old
`ocrQueue` (EC-62/INV-56). Live deletes and cleanup are owner-only; see
[`docs/LIVE-SAFETY.md`](docs/LIVE-SAFETY.md).
