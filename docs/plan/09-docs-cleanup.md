# P09 — Docs, fixture retirement, final audit

Status: done (2026-10-25). Depends on: P01–P08. Blocks: none.

## Self-contained context

P01–P08 add a fixture-origin field, five bank fixtures, a guarded salvage
pre-pass for hostile OCR, and a bullet mode for the unnumbered `*` family. This
package makes the written contract match the code, retires only fixtures whose
coverage is genuinely duplicated, and leaves a clean audit trail.

The suite was already at 31 PASS / 0 FAIL / 0 PENDING when this package started,
not the 26 the first draft assumed; P08 added two fixtures after the draft. The
bank extractor check was green. The user explicitly asked for separate commits.

## Goal

- Update the project contract and test documentation.
- Retire `qwen2-s1-crk-2021-full` only, after proving `bank-2021` covers its
  header, questions, and key. The original premise that it already did was
  stale: `bank-2021` lacked Q1 is E, the Q9/Q23/Q24/Q25/Q31/Q36/Q38 stem
  assertions, and the `questions_with_e` set. Those were ported first.
- Run a final audit and record the state.

## Fixture retirement decision

| Fixture | Action | Reason |
|---|---|---|
| `qwen2-s1-crk-2021-full` | **deleted input + expected** | `bank-2021` uses the same 40-question input; after porting its missing assertions it covers the header, questions, `questions_with_e`, and key |
| `qwen1-sample1-quotes-before-capitals` | keep | bank-2021 does not assert the exact Q36 option texts |
| `qwen1-sample2-crk-header` | keep | truncated-header micro-case |
| `qwen1-sample3-five-options` | keep | exact five-option Q33 assertion |
| `qwen1-sample4-dotless-option-a` | keep | exact 2021 dotless Q35 assertion |
| `qwen1-sample5-question-starting-a` | keep | exact Q30 assertion |
| `claude-s1-joseph-blank-c` | keep | synthetic blank-C variant; bank has C populated |
| `qwen2-s2-article-vs-option` | keep | `doc` origin, not in bank |
| `qwen2-s4-*`, `qwen2-s5-answer-key` | keep | synthetic micro-cases |

If you want to retire a `qwen1-sample*` too, first add its exact assertions to
`bank-2021`, run the suite, and only then delete it. Never trade away coverage
for a smaller fixture count.

## Steps

1. **Port, verify, then delete the superseded pair.**
   - Added Q1 is E, Q9/Q23/Q24/Q25/Q31/Q36/Q38 stem assertions, and
     `questions_with_e: [1,21,31,32,33,34,35]` to `bank-2021`; suite green.
   - Deleted `fixtures/inputs/qwen2-s1-crk-2021-full.txt` and
     `fixtures/expected/qwen2-s1-crk-2021-full.json`.
2. **`AGENTS.md` (root).** Update:
   - test count to `30/30` and unit count `59/59`;
   - add `node tools/extract-bank.js --check` to Commands;
   - document the four `input_origin` values and that every input needs an
     expected spec;
   - link `docs/plan/README.md` as the work tracker;
   - keep the existing build, storage, and PHP guardrails.
3. **`docs/AGENTS.md`.** Add to the danger-zone list:
   - `salvageNormalize` / `splitSectionsWithSalvage`: never run on bank text;
     the `after > before` gate and `inserts >= 2` trigger are mandatory;
   - `splitBulletQuestions` / `splitQuestionItems`: bullet mode only when no
     line-start numbered marker exists; never invent numbers;
   - one exam year per paste; multi-year input is unsupported.
   Update the fixture section: `input_origin`, bank/anomaly/doc/synthetic
   taxonomy, the fact that `bank-*` fixtures include keys, and the mandatory
   regression set (bank-2021 replaces the old S1; S2/S3 remain).
4. **`docs/SPEC.md`.** State the contract explicitly:
   - one year per paste; use `tools/extract-bank.js` for the bank;
   - strict parse first; salvage only on multiple fused boundaries and only if
     it increases the chunk count;
   - salvaged chunks carry
     `OCR boundaries repaired; verify question and option split`;
   - unnumbered `*` input is a separate mode and yields `num: null`;
   - key detection includes inline multi-pair lines.
5. **`docs/INVARIANTS.md`.** Add invariants:
   - bank inputs produce zero salvage inserts;
   - `bank-2021/2022/2023/2024` keys parse to 40 entries; 2025 parses to 39;
     the 2024 question slice is partial (24 questions);
   - block 2 yields 12 chunks; block 1 yields 19;
   - no parser-generated expectations.
6. **`docs/EDGE_CASES.md`.** Mark the block-1 and block-2 families as covered
   with their known limits (Q4/Q9 merged, Q5/Q6/Q10/Q11 absent, Q1 unnumbered,
   Q16 missing C/D). Keep the historical notes but make the current status
   unambiguous.
7. **`docs/DECISIONS.md`.** Record:
   - why salvage is a pre-pass rather than loosening `OPTION`/`splitQuestions`;
   - why block 1 is a separate bullet mode;
   - why extraction is external to the parser.
8. **`README.md` and `WORKSPACE_SETUP.md`.** Read them first; update every
   current-status fixture count (`19`, `19/19`, `19 PASS`), new paths
   (`tools/extract-bank.js`, `tools/bank-slices.json`,
   `fixtures/inputs/bank-*.txt`), and the test command. `WORKSPACE_SETUP.md` has
   several current-status claims plus historical phase narratives; update the
   current ones and label anything historical. Do not rewrite unrelated sections.
9. **`docs/plan/README.md`.** Mark P01–P09 done, update the current snapshot,
   confirm the expected-count table at 30 PASS after the retirement, and append a
   final change-log entry.
10. **Final audit** (commands below). Fix anything that fails before declaring
    done.

## Acceptance

| Check | Expected |
|---|---|
| `node tools/extract-bank.js --check` | exits 0 |
| `node tests/runner.js` | 30 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | 59 PASS, 0 FAIL; exit 0 |
| `git diff --check -- . ':(exclude)archive/live-sources/IMPROVISED C.docx.txt'` | no whitespace errors in our edits; the CRLF bank source is excluded |
| `git status --short` | only intended docs/fixtures/tool changes; no stray temp files. The pre-existing modified bank source and untracked `.opencode/` are expected and must not be staged |
| `rg -n "qwen2-s1" AGENTS.md README.md WORKSPACE_SETUP.md docs --glob '!docs/plan/**'` | no matches; historical references remain only in `docs/plan/` (the untracked `review-packet/` is outside the workspace contract) |
| `rg -n "\S[^\n]*//" src/parser/parser.js src/ui/ui.js` | no inline `//` comments; full-line comments are allowed and stripped by the build (INV-05) |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds, prints `1` (no source change; run as a final audit) |
| bookmarklet `new Function(...)` check | exits 0 |
| `rg -n "19/19|19 PASS|19 fixtures|25/25|26 PASS|31 PASS" AGENTS.md README.md WORKSPACE_SETUP.md docs --glob '!docs/plan/**'` | no stale current-status claims (historical notes are fine if labelled) |

## Guardrails

- Do not regenerate fixtures from parser output.
- Do not delete a fixture without first proving equivalent assertions exist.
- Do not edit `src/bookmarklet.js`, PHP, `ocr_helper.js`, or storage keys.
- Do not add `//` comments to source modules.
- The user asked for separate commits; stage only intended docs/fixtures. Never
  stage the modified bank source or unrelated untracked files; it is user-owned
  input.
- Do not rewrite `docs/phase-*.md` or `phase-plan.md`; they are historical.

## Handoff note (2026-10-25)

```text
Date: 2026-10-25
Result: 30 PASS / 0 FAIL / 0 PENDING; unit 59 PASS; extractor --check green
Fixtures retired: qwen2-s1-crk-2021-full (input + expected), after porting
  its assertions into bank-2021
Docs changed: AGENTS.md, docs/AGENTS.md, docs/SPEC.md, docs/INVARIANTS.md,
  docs/EDGE_CASES.md, docs/DECISIONS.md, README.md, WORKSPACE_SETUP.md,
  docs/plan/README.md, this package
Audit command results: runner 30/30; unit 59/59; extractor check 0; build
  one line, no %, body parses; git diff --check clean for edited files
Remaining risks: no live browser run, no live questions schema, no new live
  OCR paste, and the salvage/bullet heuristics still need human review when
  their flags appear
Deviation: the draft's 26-PASS precondition and 25-PASS acceptance were stale;
  P08 ended at 31 PASS and the retirement leaves 30. The retirement premise was
  also stale (bank-2021 did not yet cover all qwen2-s1 assertions), so coverage
  was ported and verified before deletion.
```
