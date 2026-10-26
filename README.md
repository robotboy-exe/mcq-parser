# OCR Parser Bookmarklet

A single-file `javascript:` bookmarklet that helps enter OCR'd exam questions
into the existing CBT admin "Add a New Question" page. It parses a paste
containing questions and an optional answer key, fills the form one question at
a time, ticks answers from the key, and saves through the page's own form POST.

The parser is kept separate from the UI so it can be tested without a browser.

## Quick start

```sh
# Rebuild the bookmarklet from the modules
node src/build/build.js

# Run the fixture harness and unit tests
node tests/runner.js
node tests/unit.js

# Verify the archived bank slices and their hashes
node tools/extract-bank.js --check

# Run the parser directly
node -e "const p=require('./src/parser/parser.js'); console.log(p.parseQuestion({num:1,text:'Who was the father of faith? A. Abraham B. Moses C. David D. Joseph'}))"
```

To use it: open the admin Add-a-New-Question page, create a bookmark whose URL
is the full contents of `src/bookmarklet.js`, then click it. Press **Paste
clipboard** to fill the box from the clipboard, or paste manually, then press
**Load questions + key**.

Recommended key divider on its own line:

```text
=== ANSWER KEY ===
1.B 2.C 3.A
```

## Project layout

```text
src/
  parser/parser.js     pure parsing: sections, questions, options, key, header
  ui/ui.js             DOM injection, form fill, queue, storage, save
  build/build.js       concatenates modules into one javascript: URL
  bookmarklet.js       generated output (do not edit by hand)
docs/
  SPEC.md              parser/UI behavior specification
  DECISIONS.md         why the unusual heuristics exist
  AGENTS.md            constraints for future agents
  BUILD.md             build and verification instructions
  EDGE_CASES.md        83 documented edge cases
  INVARIANTS.md        84 documented invariants
  BASELINE_COMPARISON.md  version comparison from Phase 2
  plan/                work-package tracker and handoffs
fixtures/
  inputs/              archived doc, bank, and anomaly samples
  expected/            documented expected outputs (CONFIRMED/PENDING)
archive/
  migration-docs/      original migration documents and claude-gaps.md
  trusted-variants/    original bookmarklet variants A/B/C
  legacy-bookmarklets/ supplied B1/B2/B3 (matched from first/second/third.js)
  live-sources/        admin PHP/HTML, ocr_helper.js, OCR text bank
tests/runner.js        pure-Node fixture harness (no browser)
tests/unit.js          pure-Node unit tests for parser and auto-save helpers
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

Workspace setup phases 1–9 are complete. `tests/runner.js` runs every fixture
and reports PASS, FAIL, or PENDING; run it for the current status.
`WORKSPACE_SETUP.md` holds the final setup report and the human decisions still
needed. The baseline is `trusted-variant-C.js` (the merged one-box artifact);
see `docs/BASELINE_COMPARISON.md` for why.

Current status (2026-10-26): 37/37 fixtures PASS, 65/65 unit tests PASS, and
`tools/extract-bank.js --check` is green for seven slices. The bank now includes
the 2026 WASSCE section; its two-line answer heading no longer leaks into Q48's
options. The unheaded 29 section above it is its own divider-delimited section
(`bank-pre-2026`), not a stray part of 2025 or 2026. New anomalies are promoted
from `docs/NEW_EDGE_CASES.txt`; dotless C, slash separators on all options, and
the `B.C.`/`A.D.` year abbreviations now have fixtures.
Live verification on the real admin page parsed `bank-2021` (40 questions) and
`anomaly-block2` (12 chunks with the salvage flag), accepted a controlled manual
save (then deleted it), and showed
that a stale queue without a batch identity loads but auto-save is blocked.
Remaining gap: no new live OCR paste beyond the archived bank and anomaly blocks.
The unfiltered admin list did not show the new rows while a filtered list did;
the site owner confirmed this is intended list behavior, so it is not a defect.
After updating the bookmarklet, press Reset Queue and re-paste rather than
trusting an old `ocrQueue` (EC-62/INV-56).

Resolved decisions: Reset Queue clears the queue, key, and batch identity; the
key survives reloads; draft saves are inactive and active mode is opt-in; the
PRG success text is confirmed from the archived PHP; the legacy `ocrSubmitted`
flag is ignored; and CRK maps to the live `CRS` option (id 14). The current
subject list is archived in `archive/live-sources/`; English (Oral) is separate
from English Language.

B1, B2, and B3 were matched to the supplied root files and archived under
`archive/legacy-bookmarklets/`; the baseline remains `trusted-variant-C.js`.
`claude-gaps.md` was supplied in Phase 9 and archived under
`archive/migration-docs/`; its triage is in `WORKSPACE_SETUP.md` Phase 9.
