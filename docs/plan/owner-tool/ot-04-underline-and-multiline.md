# OT04 — Underline and Multiline

- **Status:** done
- **Depends on:** OT03
- **Blocks:** OT06, OT08, OT09
- **External gate:** none; Brave/Android staging verification deferred to OT10 by owner
- **Release:** A implementation
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Ship safe underlining and deliberate multiline question/context presentation
without introducing a rich-text editor or the deferred math palette.

## Fixed behavior

- Keep `question_text` as a native textarea.
- Add one underline control and live candidate preview.
- Store exact `<u>` and `</u>` markers.
- Render only exact underline tags; arbitrary tags/attributes remain text.
- Preserve every manually entered newline.
- OCR collapses single wrap lines and preserves blank-line paragraphs.
- Question stems and contexts support formatting; options/explanations stay
  plain in this release.
- Expand year inference to 1900-2099.

## Work

1. Retain the source-backed underline and uppercase `A)` regressions; add failing
   fixtures for paragraph cleanup and 1994 inference.
2. Add a block-text cleaner that preserves paragraph boundaries after option
   positions are found and after stimulus removal; leave option cleaning
   single-line.
3. Add the minimal underline button, retained selection, keyboard shortcut,
   undo-safe edit, and preview to Add and formatting-only Edit paths.
4. Dispatch preview updates after programmatic owner-tool fills and native form
   resets; preserve server-rendered edits after validation errors and Show Paste.
5. Add one shared client renderer for candidate question/context text using DOM
   text nodes and exact underline markers.
6. Add a matching safe PHP renderer for server-rendered detail output where
   needed; do not use permissive `strip_tags`.
7. Apply rendering and `white-space: pre-wrap` to both CBT pages, result review,
   print output, and `answer_details.php`.
8. Archive the supplied detail source unchanged and keep options/explanations
   plain in its deployed working copy.
9. Strip only balanced exact underline markers from admin list summaries.
10. Bump the parser version and ensure stale owner-tool state cannot be rewritten
    as current without a full re-paste or explicit Reset.
11. Audit XSS, malformed-tag, encoded-tag, Unicode, mobile selection, undo,
    validation-error, and ambiguous-PRG behavior.

## Acceptance

| Check | Expected |
|---|---|
| Underline button/shortcut | Selected text is wrapped with exact `<u>` tags |
| Empty selection | Predictable caret placement; no malformed hidden markup |
| Add/Edit | Add gets the importer plus formatting; Edit gets formatting only and mutates no queue state |
| Undo/selection | Desktop undo is one step; toolbar focus retains the selected words |
| Preview | Typing, owner-tool fill, form reset, and edits update safely |
| Manual newlines | Stored and rendered exactly |
| OCR paragraphs | Single wraps fold; blank-line paragraphs remain |
| 1994 header | Year inferred as 1994; 20xx behavior unchanged |
| Candidate pages | Both CBT paths render underline and paragraphs |
| Result/detail/print | Same safe rendering rules; no literal supported tags |
| XSS probes | Scripts, attributes, other tags, and encoded tags render as text |
| Malformed markers | Unmatched, uppercase, attributed, nested, and overlapping markers remain safe/literal |
| Options/explanations | Remain plain text |
| State transition | Parser 2.0 state remains untouched until full re-paste or explicit Reset |
| PRG preservation | Validation errors keep posted edits; ambiguous reload is never mistaken for rejection |
| PHP baseline | Uses PHP 8.3-compatible syntax; runtime lint/vectors repeat in OT10 staging |
| Math palette | Absent and explicitly deferred |
| Browser | Desktop Chromium recorded; Brave/Android staging verification explicitly deferred to OT10 |

## Guardrails

- Never render stored question/context text as unrestricted `innerHTML`.
- Do not support arbitrary HTML, attributes, Markdown, or WYSIWYG content.
- Do not apply paragraph-preserving cleanup to option values.
- Do not interpolate stored question text into candidate `innerHTML`.
- Do not rewrite stale owner-tool state merely because the page loaded or a key
  was pasted.
- Do not bundle the P24 math palette.
- Do not start OT05.

## Handoff template

```text
Date:
Result:
Formatting syntax/security rule:
Parser fixtures and tests:
Candidate/result/detail/print outputs audited:
PHP renderer evidence:
Desktop/mobile evidence:
Files changed:
Hashes:
Open questions:
Review: pending rigorous Release A review
Commit: deferred
Next: OT05 blocked/not started
```

## Rescope history

On 2026-11-01 the owner moved unavailable `answer_details.php` integration from
the OT04 start/completion gate to OT10. That allowed the source-backed work to
start without inventing a replacement page.

On 2026-11-02 the source arrived before OT04 handoff. Its supplied bytes are
archived at `archive/live-sources/answer_details-2026-11-02.php`; OT04 now owns
the shared-renderer integration, while OT10 retains independent Release A
verification rather than first-time integration.

## Handoff

```text
Date: 2026-11-02
Result: PASS with owner-approved Brave/Android staging deferral to OT10
Formatting syntax/security rule:
  - Only balanced lowercase <u>...</u> pairs format text.
  - Every other tag, attribute, encoded marker, unmatched marker, or nested
    opener remains escaped/literal; options and explanations remain plain.
Parser/state evidence:
  - Parser API 2.1.0; 1900-2099 applies to header and answer-title consumers.
  - Stem paragraphs survive stimulus removal; options remain single-line.
  - Stale parser state cannot be re-versioned by key-only paste or native submit.
Parser fixtures and tests:
  - node tests/runner.js -> 49 fixtures: 47 PASS, 0 FAIL, 2 PENDING
  - node tests/unit.js -> 143 PASS, 0 FAIL
  - node tests/owner-tool.js -> 33 PASS, 0 FAIL
  - node tools/extract-bank.js --check -> 7 slices OK
  - node --check on changed JS/test files -> PASS
  - git diff --check -> PASS
Candidate/detail outputs audited:
  - Both CBT pages and result/print paths use the shared DOM renderer.
  - The supplied detail page uses the shared PHP renderer for question text.
  - Admin summaries strip only supported balanced markers before truncation.
Desktop/mobile evidence:
  - Headless Chromium 152.0.7977.82 local harness: underline, one-step undo,
    retained selection, Edit formatting-only mode, XSS vectors, ambiguous PRG,
    and validation-error preservation PASS; no console warning/error except the
    harness favicon request.
  - Brave/Android staging smoke: deferred to OT10 because no staging copy is
    currently available; this is no longer an OT04 completion gate.
PHP renderer evidence:
  - tests/php-render.php contains 9 parity/security vectors.
  - Safe application target: PHP 8.3. The phpMyAdmin PHP 8.4.27 export header is
    exporter metadata, not the application runtime.
  - Runtime lint/vector execution is deferred to OT10 staging because PHP is
    unavailable in this workspace; it is not an OT04 gate.
Files changed:
  - src/parser/core.js
  - src/owner-tool/controller.js, render.js, style.css
  - deployed/admin_questions.php, cbt.php, cbt_practice.php, render.php,
    answer_details.php
  - archive/live-sources/answer_details-2026-11-02.php
  - fixtures/inputs + fixtures/expected for format-paragraph-stem and
    header-year-1994
  - tests/unit.js, tests/owner-tool.js, tests/php-render.php
  - AGENTS.md, README.md, docs/AGENTS.md, docs/DECISIONS.md,
    docs/EDGE_CASES.md, docs/INVARIANTS.md, docs/SPEC.md, docs/STATUS.md
  - docs/plan/README.md, history.md, prompts/phase-map.md, OT03, OT04, OT10
Key hashes:
  - src/parser/core.js e12ce8eaf82eef40e25b83a3050ac9c502f381deef1cc2b53266442f86ff1df9
  - src/owner-tool/controller.js 100939e72657434e136ddadaf2b812ba94f21520dcb815ccfc38c70c64791ba7
  - src/owner-tool/render.js 567c51eef91828de5e964dd951b6055285be0199778c23024809e925efcf87cb
  - deployed/render.php 205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f
  - deployed/answer_details.php b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c
  - archived supplied answer_details.php 680cfd697ba61b3c21e07c0f9e2cb4d6780ea2100ceae8e78fd4e492aa7368bf
  - tests/owner-tool.js 53694310bcd9c4a51b7c6ae2b47aea57ca831309069303df5faa7ab97c6349e0
  - tests/php-render.php 78f6074e01745ded3ce6fa58e3ec605fbae36d965ce3aaf27f57050eb55c8494
Open questions:
  - None for OT04 implementation; OT10 retains staging/mobile verification.
Review: pending rigorous Release A implementation review
Commit: user-authorized and pushed on branch ot04-fix; see branch history
Next: rigorous OT04 review; OT05 remains blocked until that review settles and its DB gate clears
```
