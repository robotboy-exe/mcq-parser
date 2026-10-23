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

# Run the parser directly
node -e "const p=require('./src/parser/parser.js'); console.log(p.parseQuestion({num:1,text:'Who was the father of faith? A. Abraham B. Moses C. David D. Joseph'}))"
```

To use it: open the admin Add-a-New-Question page, create a bookmark whose URL
is the full contents of `src/bookmarklet.js`, then click it. Paste the questions
and (optionally) the key into the injected box and press **Load questions + key**.

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
  EDGE_CASES.md        61 documented edge cases
  INVARIANTS.md        55 documented invariants
  BASELINE_COMPARISON.md  version comparison from Phase 2
fixtures/
  inputs/              raw samples copied from migration docs
  expected/            documented expected outputs (CONFIRMED/PENDING)
archive/
  migration-docs/      original migration documents (byte-identical copies)
  trusted-variants/    original bookmarklet variants A/B/C
tests/runner.js        pure-Node fixture harness (no browser)
```

## Behavior summary

- Accepts `N.` question markers (1–3 digits) and options A–F, dotted or
  dotless-after-newline; inline options are supported.
- Splits off an answer key by divider, header, structure, or key-only paste.
- Collapses E/F answers into Option D, because the page has only four options
  and radios 0–3.
- Shows advisory flags such as `option C missing`; it never blocks saving.
- Persists the queue, header metadata, and key in `localStorage` under
  `ocrQueue`, `ocrMeta`, and `ansKey`.
- Never changes the PHP, the CSRF token, or the server field names.

Full details: `docs/SPEC.md`. Rationale and risks: `docs/DECISIONS.md`.

## Status

Workspace setup phases 1–6 are complete. `tests/runner.js` runs every fixture
and reports PASS, FAIL, or PENDING; run it for the current status.
`WORKSPACE_SETUP.md` holds the final setup report and the human decisions still
needed. The baseline is `trusted-variant-C.js` (the merged one-box artifact);
see `docs/BASELINE_COMPARISON.md` for why.

Known open questions (do not silently resolve them):

- Should Reset Queue clear the key? (Current behavior: no.)
- Should the key survive page reloads?
- Should saves default to inactive?
- Does the live save flow return the expected success text?
- Does the deployed subject list contain a CRS/Christian Religious option?
- Who writes the legacy `ocrSubmitted` flag?
