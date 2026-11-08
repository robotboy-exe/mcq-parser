# OT08 — Comprehension OCR

- **Status:** done 2026-11-06; light review PASS at OT09 Gate 1; same-paste key partially supplied 2026-11-08 (Q13-Q15; Q11-Q12 pending OT10 confirmation)
- **Depends on:** OT07 and its settled rigorous review
- **Blocks:** OT09, OT10
- **External gate:** representative same-paste answer-key evidence required for
  final package acceptance; supplied for Q13-Q15 in `sample-passages.txt` on
  2026-11-08
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Add a pure, fixture-backed `parsePaste()` orchestration layer that extracts one
or several comprehension contexts before strict legacy question parsing and
fills the OT07 manual review workflow.

## Parser contract

Return a structure equivalent to:

```text
metadata
contexts[]
items[]
answerKey
keyConflicts
sectionEvidence
warnings[]
```

Each linked item carries a local context reference and ordered position. A paste
with no recognized context follows the clean legacy parser path unchanged.

## Recognition rule

- Require strong passage heading/instruction evidence and at least two linked
  question candidates.
- Bound passage text before question splitting so dotted initials, years, and
  prose cannot become options or pseudo-questions.
- Stop at an evidenced next context, section boundary, or answer-key section.
- Accept wrapped `(a)`-`(d)` only when a complete ordered option sequence exists
  within one linked question.
- Do not globally accept bare lowercase `a)` labels.
- Preserve paragraph breaks through OT04's block-text cleanup.

## Work

1. Promote OT01 comprehension expectations from PENDING through a failing
   parser test.
2. Implement pure `parsePaste()` orchestration shared by the runner and owner
   tool; remove duplicated parse pipelines from UI code.
3. Segment multiple explicit contexts and preserve standalone items around
   them.
4. Add the scoped complete-sequence parenthesized-option parser.
5. Associate source question numbers, context order, and expected member count.
6. Parse the answer key from the same paste using the existing key rules; retain
   key-only correction behavior.
7. Add visible warnings for incomplete ranges, missing key entries, ambiguous
   boundaries, and unsupported second families.
8. Fill editable OT07 context cards and native question fields; do not save.
9. Run the entire clean regression wall and bank extractor.

## Acceptance

| Check | Expected |
|---|---|
| Supplied comprehension | One context linked to Q11-Q15 with transcribed options |
| Dotted initials/A.D. | Remain context prose; no pseudo-question/options |
| `(a)`-`(d)` | Parsed only as one complete ordered set |
| Multiple passages | Separate context records and member ranges |
| Singular passage | Same workflow with one context card |
| Mixed paste | Standalone items retain no context reference |
| Same-paste key | Printed numbers tick correct linked items |
| Key-only correction | Existing queue/contexts retained |
| No-context bank/anomaly | Behavior and assertions unchanged |
| Ambiguous passage | Warning/fallback; no invented relationship |
| Manual workflow | Context/questions editable; zero automatic POSTs |

## Guardrails

- Do not run shared-image stimulus extraction before readable context extraction.
- Do not weaken global `OPTION`, `splitQuestions`, or the numbering guard.
- Do not invent passage ranges or synthetic question numbers.
- Do not save or activate from the parser.
- Do not start OT09.

## Handoff

Externalize-first handoff (base `224957e`):

| Production file | Additions/deletions | Final lines/bytes | Responsibility | Deployment/test evidence |
|---|---:|---:|---|---|
| `src/parser/comprehension.js` | +190 / -0 | 190 / 6208 | Heading/link recognition, prose bounding, scoped `(a)`-`(d)` split | Loaded before `core.js` by `admin_questions.php`; `node tests/runner.js`; `node tests/unit.js` |
| `src/parser/core.js` | +76 / -6 | 906 / 30777 | `parsePaste` orchestration and additive `contexts`, `keyConflicts`, `sectionEvidence`, `warnings` | Same deployment page; `node tests/runner.js`; `node tests/unit.js` |
| `src/owner-tool/controller.js` | +36 / -1 | 620 / 23171 | Map parsed contexts to editable draft cards, show warnings, keep zero automatic POST | `node tests/owner-tool.js` |
| `src/owner-tool/context-panel.js` | +1 / -1 | 249 / 9244 | Panel hint now reflects pasted cards (unplanned one-line copy fix; declared) | `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | +1 / -1 | 1089 / 63873 | Load `comprehension.js` before `core.js` | `node tests/owner-tool.js` static load-order probe; `php -l` unavailable on this host |

`src/owner-tool/contexts.js`, `state.js`, `src/parser/parser.js`, `src/ui/ui.js`, and the bookmarklet build are unchanged. All production additions are within the 100-addition limit and the new module is within 250 readable lines.

```text
Date: 2026-11-06
Result: implemented; every local check PASS; light review PASS at OT09 Gate 1 (all five handoff hashes/byte counts reproduced; budgets and declared deviation confirmed)
parsePaste API/version: 2.2.0. Returns version, sections, header, contexts[],
  items[], key, keyConflicts[], sectionEvidence{how,boundary,contexts[]},
  warnings[]; existing field names and the legacy result are unchanged when no
  context is recognized. Linked items add contextRef/contextPosition/
  contextSlot.
Recognition/fallback rules: heading line matching PASSAGE/COMPREHENSION/
  COMPREHENSION PASSAGE/EXTRACT plus a Roman or 1-3 digit label, with at least
  two question stems before the block boundary (next heading, divider-only
  ===, key heading, or two consecutive key lines). Prose between heading and
  first stem is removed before splitQuestions and keeps single blank-line
  paragraphs. One candidate, no prose, or OCR-damaged headings warn and fall
  back to the legacy parse with no invented context. A complete ordered
  (a)-(d) set is accepted only inside a linked question; bare a) labels and
  partial sets are never parsed. answer key: existing rules; keyConflicts and
  missing linked entries are warnings only.
Fixture assertions and full regression counts: node tests/runner.js 53 fixtures,
  52 PASS, 1 PENDING (cloze, OT09); node tests/unit.js 151 PASS; node
  tests/owner-tool.js 51 PASS; node tests/context-migration.js 13 PASS; node
  tests/cbt-context.js 4 PASS; node tools/extract-bank.js --check 7 hashes OK.
  Promoted sample-comprehension-passage3 (PENDING -> 43 checks) plus new
  sample-comprehension-multi (55), -incomplete (26), -key (27), -ambiguous (11).
  The 47 pre-OT08 fixtures pass through the same parsePaste path unchanged.
Same-paste key evidence: mechanics proven by the synthetic
  sample-comprehension-key fixture and the owner-tool tick test (21.B and 22.C
  tick the linked members). The external gate is NOT met: sample-passages.txt
  has no answer key, so a representative real same-paste key sample is still
  required for final package acceptance.
Owner-tool zero-POST proof: load and skip only write localStorage; the
  owner-tool submit counter stays 0 and pendingSubmission stays null after
  load, and parsed cards are drafts with serverId null until the owner submits
  the native form.
Files changed: src/parser/comprehension.js (new), src/parser/core.js,
  src/owner-tool/controller.js, src/owner-tool/context-panel.js,
  deployed/admin_questions.php, tests/runner.js, tests/unit.js,
  tests/owner-tool.js, fixtures/expected/sample-comprehension-passage3.json,
  four new synthetic fixture inputs and their expected specs, and docs
  (DECISIONS D-67, SPEC 3c, EDGE_CASES EC-95-99, INVARIANTS INV-101-103,
  AGENTS, STATUS, README, package/coordinator/phase-map)
Hashes (SHA-256, LF working tree, no conversion): comprehension.js
  2228ce28fa0e755aeb11ec9a08fdfd272cf96c848b01eb25110d571b3dab231a;
  core.js e734798b04672c11bd8126f8c137a2b0735733b0644f6e362876690b8ac43df8;
  controller.js 7557b0181811b474099b0e767b81949c434176f14f5d2e23c7a933a869b463b3;
  context-panel.js cef4dc994d92c2094f2901f39ab3ea87012ba097687b821d786fb59489935bca;
  admin_questions.php 6f32ce9f4c5c5b1bd9fc8db86e058f76a1131b1d903e5fd8efdf13123318fb52;
  runner.js 66d6b842e919c6f227bc4b6a938704de5f5c81acfa601bc6a7908cd8fcfb538e;
  unit.js 0ad855626103a2083c8ed387510f92dd8463f6f8703332800a847ca3e7a1f0b9;
  owner-tool.js 07dd6e84890b5bf245dc6a1d27ac5e4b34c705f424cb2d1d2189670abbc4bbc1
Hash basis: working-tree files measured with `wc -c` and `sha256sum`; all are
  LF. The boundary commit must be re-measured from the committed blobs.
Open questions: (1) external same-paste key sample outstanding; (2) PHP lint
  and PHP suites could not run on this host (php absent) - unchanged from
  phases 5-8 and deferred to OT10; (3) no browser runtime check was run.
Review: pending light verification at OT09 Gate 1
Commit: deferred
Next: OT09 not started
```
