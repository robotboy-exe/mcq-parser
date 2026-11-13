# OT09 — Cloze OCR

- **Status:** done 2026-11-06; parser 2.3.2; rigorous Release C review returned `BLOCK` 2026-11-07 (`BLOCK-1`, `FIX-1`), both fixed and closed by the first re-review; `FIX-2` recorded in that re-review, the owner changed its requirement on 2026-11-07 (keep the first group, drop later duplicates), the 2026-11-07 fix applied it, and the closure-focused second re-review returned `PASS` and closed `FIX-2` on 2026-11-08; phase 10 boundary committed 2026-11-08
- **Depends on:** OT08
- **Blocks:** OT10
- **External gate:** same-paste cloze answer key supplied 2026-11-08 in
  `sample-passages.txt` (Q71-Q80); OT10 validates final coverage
- **Release:** C
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Parse the evidenced numbered-gap passage and A-D fixed-column option family into
one shared cloze context plus one editable linked MCQ per gap.

## Recognition rule

- Require an instruction describing numbered gaps and A-D options.
- Require at least two numbered gaps in context text.
- Require an evidenced A-D table header and at least two sequential numbered
  option rows.
- Infer four data-column starts from repeated row alignment, not the visual
  header alone.
- Validate every row produces four non-empty options within server limits.
- Require row numbers and context gap numbers to correspond; otherwise warn and
  refuse the cloze interpretation.

## Work

1. Promote OT01 cloze expectations through a failing parser test.
2. Detect and isolate the cloze context before numbered rows reach the ordinary
   question splitter.
3. Normalize each evidenced source gap to `[[gap:N]]` while preserving
   paragraphs and original gap numbering.
4. Derive stable column boundaries from multiple clean rows, then slice and
   trim every row without collapsing alignment first.
5. Generate an editable stem such as `Choose the option that best fills gap
   71.` and assign context position/slot.
6. Parse same-paste keys by printed row number and preserve manual correction.
7. Render all slots safely and highlight only the current slot in `cbt.php`.
8. Add adversarial fixtures: wrapped multiword cells, long cells, missing
   column, mismatched gaps/rows, tabs/spaces, and a table-like non-cloze block.
9. Integrate output with OT07's manual context/question workflow; save nothing
   automatically.
10. Run full parser, owner-tool, PHP, and candidate regressions.

## Acceptance

| Check | Expected |
|---|---|
| Supplied Q71-Q80 table | Ten linked questions with four transcribed options each |
| Multiword Q78 cells | `a vow`, `an oath`, `an allegiance`, `a pledge` remain distinct |
| Context | Gap 71-80 tokens present with paragraph structure retained |
| Generated stems | Editable and mapped to matching slot/order |
| Same-paste key | Correct rows ticked by printed number |
| Candidate | Shared context on every member; active slot highlighted |
| Multiple contexts | Cloze may coexist with comprehension/standalone groups |
| Singular paste | One cloze group works independently |
| Ambiguous table | Warning and no guessed options/context links |
| Limits | Empty/overlong option rows refused before native save |
| Regression | Clean bank/anomaly/context/owner-tool suites pass |

## Guardrails

- Do not parse columns after global whitespace collapse.
- Do not trust header positions without row evidence.
- Do not create partial cloze groups from a mismatched table.
- Do not interpret arbitrary numbered tables as cloze exercises.
- Do not auto-save or auto-activate.
- Do not start OT10.

## Handoff

Externalize-first handoff (base: `224957e` plus the uncommitted OT08 tree):

| Production file | Additions/deletions | Final lines/bytes | Responsibility | Deployment/test evidence |
|---|---:|---:|---|---|
| `src/parser/cloze.js` | +274 / -0 (247 readable lines) | 274 / 8785 | Gap/table recognition, `[[gap:N]]` normalization, row-derived column starts, word-safe slicing, refusal warnings, synthesized items | Loaded before `core.js`; `node tests/runner.js`; `node tests/unit.js` |
| `src/parser/core.js` | +42 / -0 | 948 / 32267 | Compose cloze before comprehension, merge synthesized items in number order, renumber contexts, guard comprehension linking | `node tests/runner.js`; `node tests/unit.js` |
| `src/owner-tool/controller.js` | +1 / -1 | 620 / 23208 | Map parsed context type so cloze cards and slots are created | `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | +5 / -5 | 1089 / 63924 | Load `cloze.js` before `core.js`; asset query version 2.3.0 | `node tests/owner-tool.js` static load-order probe; `php -l` unavailable on this host |

`src/owner-tool/contexts.js` was not changed; its existing `clozeSlots`/`syncLinks`
path fills `contextSlot` from the token order. `src/parser/parser.js`,
`src/ui/ui.js`, `src/bookmarklet.js`, `deployed/cbt.php`, the SQL/migration
files, and `ocr_helper.js` are unchanged. All production additions are within
the 100-addition limit and the new module is within 250 readable lines.

```text
Date: 2026-11-06
Result: implemented; every local check PASS; pending rigorous Release C review
Recognition/column algorithm: all four evidences required (instruction naming
  numbered gaps and A-D options, two or more dotted gap runs, A B C D header,
  two or more sequential numbered rows). Tabs expand to 8-column stops. Rows are
  split on runs of two or more spaces; each column start is the mode of the row
  segment starts and must cover at least half the rows; the header indent is
  never used. A boundary inside a word snaps right, so row 78 keeps
  an allegiance | a pledge. Every gap becomes exactly [[gap:N]] with the source
  numbering and single blank-line paragraphs; the block is removed before
  splitSections and one item per row is synthesized with the stem
  "Choose the option that best fills gap N.". Any empty cell, option over 500
  characters, unstable alignment, unmatched row/gap numbers, or fewer than two
  gaps refuses the whole group with a warning and leaves the rows on the legacy
  path; a table without gap markers is never cloze.
Fixture and adversarial coverage: sample-cloze-section6 promoted to CONFIRMED
  (43 checks: ten items, exact tokens, two paragraphs, Q78 multiword cells);
  sample-cloze-tabs (34); sample-cloze-mixed (48, comprehension + cloze as
  ctx-1/ctx-2); sample-cloze-missing-column, -mismatch, -not-cloze, and
  -long-cell (5 checks each) assert the refusals and their warnings.
Same-paste key evidence: synthetic only. `tests/owner-tool.js` appends
  "71. B / 72. C" and proves the printed-number tick and zero submits; the real
  same-paste cloze key sample is still missing (external gate open).
Candidate slot rendering evidence: src/cbt/context-render.js already renders
  every [[gap:N]] safely and highlights only the active slot; node
  tests/cbt-context.js is 4 PASS and cbt.php already emits contexts/contextSlot.
  No PHP runtime exists on this host, so the candidate page was not executed.
Full regression counts: runner 59 fixtures = 59 PASS / 0 FAIL / 0 PENDING;
  unit 158 PASS; owner-tool 53 PASS; context-migration 13 PASS; cbt-context 4
  PASS; extract-bank 7 hashes OK; node --check clean on every changed JS file.
Files changed: src/parser/cloze.js (new), src/parser/core.js,
  src/owner-tool/controller.js, deployed/admin_questions.php, tests/runner.js,
  tests/unit.js, tests/owner-tool.js, fixtures/expected/sample-cloze-section6.json
  (promoted), five new synthetic inputs and six new expected specs, plus
  AGENTS.md, README.md, docs/AGENTS.md, DECISIONS.md, SPEC.md, EDGE_CASES.md,
  INVARIANTS.md, STATUS.md, plan/README.md, next-steps.md, phase-map.md,
  ot-08-comprehension-ocr.md, and this package.
Hashes: cloze.js 2bc5e166f6ec9f68; core.js a39fbbe40f34c5ed; controller.js
  ac59e004c85bcb34; admin_questions.php c28fe6834fc194be; unit.js
  3a0057d0c953da32; owner-tool.js ff0687c5675ddaf3; runner.js
  66d6b842e919c6f2 (first 16 hex of sha256; recompute after later doc edits).
Open questions: (1) representative real same-paste answer-key samples for
  OT08 and OT09 final acceptance; (2) PHP 8.3 lint/suites and php-render;
  (3) browser verification of the owner cloze card and candidates at OT10.
Review: pending rigorous Release C review
Commit: deferred
Next: OT10 blocked/not started
```

## Disposition (2026-11-07)

Owner decision: `fix` for `BLOCK-1` and `FIX-1`, recorded against the immutable
record [`../reviews/owner-tool-2026-11-phase-10.md`](../reviews/owner-tool-2026-11-phase-10.md)
(original rigorous Release C review, 2026-11-07). The review record is unchanged
and this decision closes neither finding.

- **`BLOCK-1` — unapproved new-module line-limit breach.** The record's defect
  stands unchanged: `src/parser/cloze.js` is 274 lines (`wc -l`; 247 non-blank,
  non-comment lines) against the 250-line cap in [`../README.md`](../README.md)
  (externalize-first contract), and per the record "no Gate 1 plan or owner
  approval for this file exists anywhere in the package or coordinator"; "the
  excess is 24 lines over the cap."
  **Authorized closure route: the record's route 1 only** — reduce
  `src/parser/cloze.js` to **≤ 250 lines by `wc -l`** with detection behavior
  unchanged, every suite green, and the handoff measurement corrected. The
  record's other admissible routes (owner approval of the 24-line excess; a
  `change requirement` redefining "readable lines") are **not** invoked and
  would each need their own disposition. If 250 lines cannot be reached without
  a behavior change, the fix session stops and returns for disposition instead
  of treating the excess as approved.
- **`FIX-1` — duplicate numbering produces a silent partial cloze group.** The
  record's defect stands unchanged: `src/parser/core.js:792` drops a synthesized
  cloze item whose number already exists, `src/parser/cloze.js:242-243` keys
  items by printed row number, and `src/owner-tool/contexts.js` `syncLinks` then
  links the unrelated optionless item with no conflict — "The owner therefore
  receives a partial cloze group: gap 71's four transcribed options are lost,
  and an unrelated optionless question is presented as gap-71's member."
  **Authorized closure:** refuse the colliding cloze group as a whole with a
  distinct warning naming the colliding number(s), leave those rows on the
  legacy path (no synthesized item, no context, no silent drop), keep zero
  automatic posts and activation, and prove it with a parser probe or unit test
  plus full runner/unit/owner-tool results and a handoff note.
- **Not authorized:** `NOTE-1`, `NOTE-2`, and `NOTE-3` scope; any other behavior
  change; and the same-paste answer-key external gate, which stays open and
  untouched.
- **Effect on readiness:** unchanged. Phase 10 is not commit-ready, OT10 stays
  blocked, and a `fix` disposition authorizes one fix session only. An
  independent re-review must settle both findings after the fix; no phase-10
  boundary commit may happen before that.

## Fix note (2026-11-07)

Frozen findings `BLOCK-1` and `FIX-1` fixed by the authorized `fix` session.
Parser API `2.3.1` (D-66: changed output bumps the version). The review record
is unchanged and neither finding is closed until the independent re-review.

| Production file | Additions/deletions (package base) | Final lines/bytes | Responsibility | Deployment / direct test |
|---|---:|---:|---|---|
| `src/parser/cloze.js` | +242 / -0 | 242 / 8639 | Gap/table recognition, column inference, synthesis, optional `blocked` skip so a refused group stays in the source text | sha256 `b9304a7d6ea1b2978c093354c15a7a2af1eff0c76e6fe62340d82271e75d2069`; loaded before `core.js`; `node tests/runner.js`; `node tests/unit.js` |
| `src/parser/core.js` | +76 / -4 cumulative | 978 / 33465 | `parseBody`/`detectContexts` composition, collision refusal, `PARSER_VERSION` 2.3.1 | sha256 `d0417835e9ce79748fd022c0ef1da621296ece65f54f4cabf6d3b71abd728d38`; `tests/runner.js`; `tests/unit.js`; `tests/owner-tool.js` |
| `deployed/admin_questions.php` | +5 / -5 cumulative | 1089 / 63924 | Load order unchanged (`comprehension.js` → `cloze.js` → `core.js`); asset query `2.3.1` | sha256 `b3e7f9218e7b30a67a4b89395771991b8157b1ad7a519288605a9409b27c8c15`; load-order probe; `php -l` unavailable on this host |
| `src/owner-tool/controller.js` | +1 / -1 (unchanged in the fix) | 620 / 23208 | Context type map only | `node tests/owner-tool.js` |

**`BLOCK-1` closure.** `src/parser/cloze.js` is **242 lines** (`wc -l`) against
the 250-line cap, down from 274; the reduction is behavior-preserving
compaction (cell-edge array, one-line row/item literals, guard-clause refusals
with identical warning strings, `matchAll` segmentation) plus the optional
`blocked` argument. Evidence: all 59 fixtures and the pre-fix unit/owner-tool
expectations pass unchanged; the only moved assertion is the parser-version
string.

**`FIX-1` closure.** `cloze.detect(raw, blocked)` skips a blocked table without
removing its lines, so the rows stay in the text handed to `splitSections`.
`parsePaste` compares every synthesized number with the ordinary item numbers,
re-detects with the colliding group blocked, re-parses, and pushes one warning:
`numbered gap rows 71 collide with an ordinary question; read as ordinary
questions.` A second-order collision blocks every remaining cloze group instead
of emitting a partial one. Evidence: two new `tests/unit.js` cases — the
collision yields zero contexts, no `contextRef`, the named warning, and both
rows still parsed; a second group (81-82) keeps its context and both links.

**Version bump.** Changed output required `2.3.1` per D-66: `core.js:2,5`, the
five asset lines in `admin_questions.php:1082-1086`, and the assertions at
`tests/unit.js:255` and `tests/owner-tool.js:523`.

**Regression.** runner 59 PASS / 0 FAIL / 0 PENDING; unit 160 PASS; owner-tool
53 PASS; context-migration 13 PASS; cbt-context 4 PASS; extract-bank 7 hashes
OK; `node --check` clean on every changed JS file.

**Limitations.** PHP is absent on this host, so `php -l`, the PHP suites, and
any dynamic candidate check did not run; OT10 still owns them.
**Observed, out of scope:** two cloze groups that share numbering with each
other (no ordinary question) still merge silently through the same mechanism;
that vector is reported for a separate owner disposition, not fixed here.
`NOTE-1`–`NOTE-3` and the same-paste answer-key external gate are untouched.

`Commit: deferred`. Next: independent re-review of the frozen closure matrix.

## Lifecycle Routing Correction - 2026-11-07

The first phase-10 re-review is complete and immutable: it closes `BLOCK-1` and
`FIX-1` and records `FIX-2` with a finite closure contract. The fix note's
"separate owner disposition" note above was written under the superseded
first-round escalation rule. Under the corrected two-round finding lifecycle,
`FIX-2` is in its first review round, so it routes to a fix session instead of
owner disposition. No review record is edited. Phase 10 stays not commit-ready
and OT10 stays blocked until `FIX-2` is fixed and settled by re-review.

`Commit: deferred`. Next: `@docs/plan/prompts/fix-session.md phase 10 OT09 FIX-2`

## Owner Requirement Change - 2026-11-07 (`FIX-2`)

The owner changed the `FIX-2` requirement before its fix session. This is an
owner requirement change, not an escalation disposition: the immutable
[`../reviews/owner-tool-2026-11-phase-10-re-review.md`](../reviews/owner-tool-2026-11-phase-10-re-review.md)
record is unchanged, `FIX-2` remains unresolved, and phase 10 stays not
commit-ready with OT10 blocked.

**Replacement requirement (option A: keep first, drop later duplicates).**
When two or more fully evidenced cloze groups share any gap number:

- Keep the first group in paste order with its context and every member.
- Drop every later colliding group as a whole: no cloze context, no synthesized
  items, and its source rows are removed rather than re-parsed as ordinary
  questions. Leaving those rows as ordinary questions would make them collide
  with the kept group and trigger the `FIX-1` refusal.
- Emit a warning naming the dropped group's gap numbers, for example
  `duplicate cloze group for gaps 71-80 ignored; kept the first occurrence.`
  The warning is what tells the administrator that the duplicate paste was
  ignored.
- No zero-member context may be emitted, and zero automatic posts or activation
  remain mandatory.

**Why option A.** The owner's realistic case is different passages or exam
categories carrying the same number range in one paste, not identical text. The
owner declined option B (keep the group with the most gap rows) as unnecessary
engineering: every accepted cloze group already requires all four options per
row, so option A keeps the first occurrence and the warning lets the
administrator re-paste the other passage separately.

**Effect.** The review's `FIX-2` "refuse the later group" criterion is replaced
by this deduplication rule. The fix session must implement and evidence the
replacement rule, then an independent re-review must settle `FIX-2`. `FIX-1`'s
ordinary-question collision refusal is unchanged. `NOTE-1`-`NOTE-3` and the
same-paste answer-key external gate are untouched.

`Commit: deferred`. Next: `@docs/plan/prompts/fix-session.md phase 10 OT09 FIX-2`

## `FIX-2` Fix Note - 2026-11-07

Frozen finding `FIX-2` fixed under the owner's 2026-11-07 replacement
requirement (keep the first evidenced group, drop later colliding groups whole
with a naming warning). Parser API `2.3.2` (D-66: changed output bumps the
version). The review record is unchanged and `FIX-2` is not closed until the
independent re-review.

| Production file | Additions/deletions (package base) | Final lines/bytes | Responsibility | Deployment / direct test |
|---|---:|---:|---|---|
| `src/parser/core.js` | +98 / -4 (OT09 package base; OT08 +76, `FIX-2` +22) | 1000 / 34520 | `parsePaste` composition, `FIX-1` collision refusal, keep-first cloze dedupe, `PARSER_VERSION` 2.3.2 | sha256 `12ee80337f3551e83ff0f3018f26ef360654ae54c618097a6edf0c4f307dbba9`; `tests/runner.js`; `tests/unit.js`; `tests/owner-tool.js` |
| `deployed/admin_questions.php` | +5 / -5 cumulative | 1089 / 63924 | Load order unchanged; asset query `2.3.2` | sha256 `c41ca9d306d1e1ca943c18ae20a559d5e12b87b0eb9aba2e2af2dbe79f32ff49`; load-order probe; `php -l` unavailable on this host |
| `src/parser/cloze.js` | +242 / -0 (unchanged by `FIX-2`) | 242 / 8639 | Recognition, columns, synthesis, blocked skip | sha256 `b9304a7d6ea1b2978c093354c15a7a2af1eff0c76e6fe62340d82271e75d2069`; runner; unit |
| `src/owner-tool/controller.js` | +1 / -1 (unchanged by `FIX-2`) | 620 / 23208 | Context type map | sha256 `ac59e004c85bcb349bb8e814ee9b449bf4b9d790dfc6bebebc2da1fcaaf02c7b`; owner-tool 53 PASS |

**Closure mapping.** `dedupeCloze` in `parsePaste` walks contexts in paste
order, tracks every gap number claimed by a kept cloze context, and drops a
later cloze context that shares any number with that set. A dropped group adds
no context and no synthesized items (`clozeItems` are filtered by the dropped
context id); its source rows were already removed from the legacy text by
`cloze.detect`, so they do not return as ordinary questions. The warning is
`duplicate cloze group for gaps 71-72 ignored; kept the first occurrence.` The
first group keeps its context, `linkedCount`, and every member; no zero-member
context is emitted. Groups with distinct numbering are untouched, and the
`FIX-1` ordinary-question refusal path is unchanged.

**Evidence.** New `tests/unit.js` cases:
`two cloze groups that share numbering keep the first and drop the later`
(one context, members 71-72, first group's options, warning names 71-72, no
ordinary 71/72) and `two cloze groups with distinct numbering both survive`
(two contexts, four members, zero warnings). `node tools/cloze-probe.js` on
`tools/cloze-two-groups.txt` now exits 0: one card with two members and the
naming warning, replacing the previous zero-member card. Version assertions at
`tests/unit.js:255` and `tests/owner-tool.js:523` are `2.3.2`.

**Regression.** runner 59 PASS / 0 FAIL / 0 PENDING; unit 162 PASS; owner-tool
53 PASS; context-migration 13 PASS; cbt-context 4 PASS; `node --check` clean on
the changed JS. `node tools/extract-bank.js --check` reproduces the known
Windows/CRLF on-disk fixture mismatch, but all seven source/slice/extracted
hashes match the manifest (verified independently), so it is the recorded
pre-existing host artifact, not a regression.

**Limitations.** PHP is absent on this host, so `php -l`, the PHP suites, and
any dynamic candidate check did not run; OT10 still owns them. `NOTE-1`-`NOTE-3`
and the same-paste answer-key external gate are untouched.

**Excluded artifacts (separate list).** Supplied root SQL and archive copies;
`db_conn.php`; `archive/`; the supplied sample text files except as fixture
provenance; `deployed/cbt_practice.php` and `practice_title` (out of scope);
legacy parser/UI/bookmarklet sources and the generated `src/bookmarklet.js`;
OT06/OT07 delivery files; the OT08 tree files; `.cloud-attachments/`.

`Commit: deferred`. Next: independent closure-focused re-review of `FIX-2`.

## `FIX-2` Re-Review Closure - 2026-11-08

The closure-focused second re-review
[`../reviews/owner-tool-2026-11-phase-10-re-review-2.md`](../reviews/owner-tool-2026-11-phase-10-re-review-2.md)
returned `PASS` and closed `FIX-2` against the owner's 2026-11-07 keep-first
requirement. It reproduced 59 runner, 162 unit, 53 owner-tool, 13
context-migration, and 4 cbt-context PASS, the cloze probe, and the zero-member
sweep. No new finding was recorded; `NOTE-1`-`NOTE-3` remain non-blocking. The
original review and first re-review are immutable and unchanged.

The review measured HEAD `adaeb7c` plus the uncommitted fix. `core.js` is
+98/-4 from the OT09 package base (1000 lines / 34520 LF bytes), `cloze.js` is
242 lines, and no file exceeds the externalize-first limit. Its Windows checkout
bytes are larger only by the CRLF line count; the LF hashes match.

The owner supplied same-paste answer keys in `sample-passages.txt` on
2026-11-08: comprehension Q13-Q15 and cloze Q71-Q80. On 2026-11-13 the owner
confirmed the revised comprehension key (Q11 B, Q12 C, Q13 A→D), so it covers
Q11-Q15; OT10 still confirms whether the supplied sample satisfies final OT08
acceptance. The OT09 cloze key is complete. Parser mechanics remain
proven synthetically by the fixtures and unit suite.

`Commit: included in the 2026-11-08 phase 10 boundary commit.` Next: OT10 after
the owner authorizes phase 11.
