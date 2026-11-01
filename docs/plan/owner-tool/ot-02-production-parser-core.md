# OT02 — Production Parser Core

- **Status:** done
- **Depends on:** OT01
- **Blocks:** OT03, OT08, OT09
- **External gate:** none
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Create one readable parser module for the deployed owner tool and Node tests,
based only on clean `d5a62f0` behavior and source-backed integration fixtures.

## Scope

- Pure parsing, header inference, answer-key parsing, and parser diagnostics.
- Browser and Node exports from the same canonical implementation.
- Existing clean parser regressions retained.
- Bookmarklet and Auto-Save helpers excluded from the production parser API.

## Work

1. Inventory the clean parser exports and identify the minimal owner-tool API.
2. Move or extract those functions into a plainly formatted canonical module
   that can be loaded by the browser and the fixture runner without minifying.
3. Keep parser code free of DOM, storage, fetch, PHP-form, and save-loop logic.
4. Point the runner/unit tests at the canonical module; use a temporary adapter
   only when required to preserve historical test imports.
5. Preserve all clean fixtures and dangerous-regex behavior from `d5a62f0`.
6. Keep shared-image stimulus metadata only if it remains pure parsing and is
   useful as a manual warning; do not port image-plan or Auto-Save behavior.
7. Mark the bookmarklet build and `src/ui/ui.js` production path as legacy in
   current-facing docs without deleting historical evidence.
8. Document the parser API and version identifier used by owner-tool state.

## Acceptance

| Check | Expected |
|---|---|
| Purity | Canonical parser has no DOM, storage, fetch, or form access |
| Existing evidence | Every clean integration fixture remains unchanged and passes |
| Pending new fixtures | Stay PENDING; no expectation weakened |
| Browser export | Loads without build/minification and exposes only documented API |
| Node export | Runner and unit tests import the same implementation |
| Blocked cycle | No P20-P22 hard-tail-removal or Auto-Save code appears |
| Bookmarklet | Explicitly legacy and not a production deliverable |

## Guardrails

- Do not refactor dangerous regexes merely for style.
- Do not implement comprehension or cloze parsing yet.
- Do not add owner-tool state or DOM code to the parser.
- Do not delete archived or historical bookmarklet evidence.
- Do not start OT03.

## Handoff template

```text
Date:
Result:
Canonical parser path/API/version:
Compatibility adapter (if any):
Tests and fixture counts:
Legacy files retained:
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT03 Gate 1
Commit: deferred
Next: OT03 blocked/not started
```

## Handoff

```text
Date: 2026-10-31
Result: PASS
Canonical parser path/API/version:
  - Path: src/parser/core.js
  - Version: 2.0.0
  - API: { version, FIXES, OPTION, KEY_LINE, PLACEHOLDER, STEM_LINE, KEY_WORD, INLINE_PAIR, LOOSE, parseHeader, pickSubjectIndex, pickCategoryIndex, splitQuestions, splitBulletQuestions, splitQuestionItems, parseQuestion, parseStimulusRange, extractStimuli, applyStimulusFlags, flagNumberingGaps, splitSections, salvageNormalize, splitSectionsWithSalvage, keyPairs, parseKeyDetailed, parseKey, parsePaste }
  - Browser export: window.OCRParser
  - Node export: module.exports
Compatibility adapter:
  - src/parser/parser.js re-exports the canonical core while retaining legacy test/UI helpers for backward compatibility.
Tests and fixture counts:
  - tests/runner.js (points directly at src/parser/core.js): 47 fixtures: 45 PASS, 0 FAIL, 2 PENDING
  - tests/unit.js: 140 PASS, 0 FAIL
  - tools/extract-bank.js --check: 7 bank slices OK
Legacy files retained:
  - src/bookmarklet.js (legacy generated artifact)
  - src/ui/ui.js (legacy bookmarklet UI)
  - src/build/build.js (legacy bundler)
Files changed:
  - src/parser/core.js (new canonical pure parser module)
  - src/parser/parser.js (re-exports core)
  - src/bookmarklet.js (rebuilt legacy artifact after adapter update)
  - tests/runner.js (switched to src/parser/core.js)
  - README.md (architecture update & legacy notice)
  - docs/AGENTS.md (canonical parser core documented)
  - docs/STATUS.md
  - docs/plan/README.md
  - docs/plan/prompts/phase-map.md
  - docs/plan/owner-tool/ot-02-production-parser-core.md
Hashes:
  - src/parser/core.js SHA-256: 77217a126ccc6814368cb855153e6cdf2356bbf178e7290873a61970d7e92ab9
  - src/parser/parser.js SHA-256: 0a9bff5f4fd60c86a282752624d576e7104e01217bab2b988c80b180b6680961
  - src/bookmarklet.js SHA-256: bf5837e48f30942096f877d4c40fc81e2d6e44604f786369f6013a2fde85f2ae
Open questions:
  - None.
Review: pending light verification at OT03 Gate 1
Commit: deferred
Next: OT03 blocked: production helper required
```
