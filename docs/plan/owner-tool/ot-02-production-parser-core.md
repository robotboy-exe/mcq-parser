# OT02 — Production Parser Core

- **Status:** not started
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
