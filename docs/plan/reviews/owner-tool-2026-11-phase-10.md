# Owner Tool 2026-11 Phase 10 Review

- **Date:** 2026-11-07
- **Reviewer:** Buffy (Codebuff), independent review session
- **Package:** OT09 — Cloze OCR (Release C)
- **Scope:** read-only `owner-tool-integration` at `224957e`
  (`docs: close phase 8 review and record FIX-1 verification`). The OT09 package
  base is `224957e` **plus the uncommitted OT08 tree**, because OT08 was never
  committed. At review start the worktree carried the OT08+OT09 changes
  (`?? src/parser/cloze.js`, `?? src/parser/comprehension.js`, ten new fixture
  pairs, and modified `core.js`, `controller.js`, `context-panel.js`,
  `admin_questions.php`, `tests/{runner,unit,owner-tool}.js`, two promoted
  expected specs, and docs). The pre-existing untracked `.cloud-attachments/`
  was not read, changed, or attributed to scope.
- **Record:** original phase-10 review. No earlier phase-10 record existed to
  overwrite, close, or re-review.

## Independence And Scope

This session treated the OT09 and OT08 handoffs as untrusted claims. It read the
coordinator, active map, `INTENT.md`, `AGENTS.md`, `docs/AGENTS.md`, the OT08 and
OT09 packages, the phase-8 record, the implementation
(`src/parser/cloze.js`, `src/parser/core.js`, `src/owner-tool/controller.js`,
`src/owner-tool/contexts.js`, `deployed/admin_questions.php`, `src/cbt/context-render.js`),
the fixtures and their provenance, and the touched tests. It ran every available
baseline and package probe, reproduced the per-file measurements and hashes,
and added adversarial probes at the collision, key-adjacency, header-indent, and
limit boundaries.

No product file, test, fixture, package status, handoff, or coordinator file was
edited. The only file written is this record. No branch was created, switched,
merged, or moved; no commit was made. No PHP runtime, browser, live site,
staging database, or production write exists or was used here.

### Scope observations

- OT09's per-file additions cannot be read from `git diff 224957e` directly,
  because that diff also contains OT08. The split below is derived from OT08's
  recorded final sizes and confirmed against three independent checks: the
  aggregate `git diff --numstat 224957e` totals, the OT08 hashes of the files
  OT09 left unchanged, and the OT09 handoff's claimed deltas.
- `src/owner-tool/context-panel.js` (+1/−1), `src/parser/comprehension.js`,
  the comprehension fixtures, and `fixtures/expected/sample-comprehension-passage3.json`
  belong to the uncommitted OT08 tree, not to OT09. OT09 adds only the cloze
  module, the `core.js` composition, the one-line controller context-type map,
  the admin include/cache-bust, and the cloze fixtures/tests.
- The supplied cloze sample is real user OCR (`sample-passages.txt` SECTION 6,
  lines 39–56). `fixtures/inputs/sample-cloze-section6.txt` is byte-identical to
  those supplied lines except CRLF→LF line endings (the supplied file has no
  trailing newline). Its expected options were not generated from parser output:
  every option string is the supplied table value, including the source's own
  defects (`twenty-fire`, capitalized `Last`/`In`/`Found` after a gap token,
  `an allegiance a pledge` on one source line).
- OT09's promotion rewrote the previously PENDING `sample-cloze-section6`
  expectation from raw dotted text into a `contexts[]` record with `[[gap:N]]`
  tokens. That is the package's specified normalization (OT09 work items 3–4),
  not a weakening: the promoted spec asserts ten items, ten exact tokens, two
  paragraphs, and the four distinct Q78 multiword cells.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD`, `git status --porcelain`, `git log --oneline -6` | On `owner-tool-integration`; HEAD `224957e`; OT08+OT09 uncommitted as listed above; only `?? .cloud-attachments/` outside scope |
| `node tests/runner.js` | 59 fixtures: 59 PASS, 0 FAIL, 0 PENDING; no orphan input |
| `node tests/unit.js` | 158 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 53 PASS, 0 FAIL (real `state.js`, `controller.js`, `contexts.js`, and the context modules executed in the VM harness) |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 4 PASS, 0 FAIL (real `src/cbt/context-render.js`) |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and 7 output hashes match |
| `node --check` on `cloze.js`, `comprehension.js`, `core.js`, `controller.js`, `runner.js`, `unit.js`, `owner-tool.js` | Clean on all seven |
| `php -v`, `php -l`, PHP suites | **Not run**: `php` is absent on this host (exit 127). No target-runtime PHP evidence is reproduced here |
| `wc -lc` + `sha256sum` on production files | Reproduce OT09's five recorded hashes and both size blocks exactly; only the "Files changed" attribution is wrong (NOTE-2) |
| `git diff --numstat 224957e` | `core.js` +118/−6, `controller.js` +36/−1, `admin_questions.php` +5/−5, `runner.js` +141/−14 (all OT08, see below) |
| Unchanged-file check (`git diff 224957e --` on `parser.js`, `ui.js`, `bookmarklet.js`, `cbt.php`, `deployed/sql`, `ocr_helper.js`, `contexts.js`, `cbt/context-render.js`) | Empty: every "unchanged" claim in the handoff holds |
| Fixture inventory | 59 inputs / 59 expected specs; every new spec has `schema_version: 1`, a valid `input_origin` (`synthetic`, or `user_sample` on the two promoted supplied samples), and `status: CONFIRMED` |
| `diff <(sed -n '39,56p' sample-passages.txt) fixtures/inputs/sample-cloze-section6.txt` | Identical apart from CRLF→LF and the supplied file's missing final newline |
| Adversarial P3: header `A B C D` indented 3 spaces, unrelated to row alignment | PASS: columns come from row evidence; 71=`aa/bb/cc/dd`, 72=`ee/ff/gg/hh`; header indent ignored |
| Adversarial P2: two cloze tables in one paste | PASS: `ctx-1` [71,72] and `ctx-2` [73,74], four items, no cross-linking |
| Adversarial P4: single-space columns | PASS (safe refusal): warning "has no stable four-column alignment; read as ordinary questions", no context, no guessed options |
| Adversarial P5b/P5c: 501 vs 500 character cell | PASS: 501 refused with "option longer than 500 characters at gap 71"; exactly 500 accepted with 500-character cells |
| Adversarial P6: three rows, two passage gaps | PASS (safe refusal): "does not match the passage gaps 71-72" |
| Adversarial P9/P10/P11: duplicate row numbers, `___71___` markers, wrapped row line | PASS (safe refusals with distinct warnings); no partial context in any case |
| Adversarial P7: table rows immediately followed by `71. B` / `72. C` with no blank line or heading | Refused: "does not match the passage gaps 71-72", no context, no key. NOTE-1 |
| Adversarial P8: same key lines after a blank line | PASS: context plus `key {71:"B",72:"C"}` |
| Adversarial P1: valid 71–72 cloze block plus an ordinary `71. Standalone question …` | **Defect**: cloze context [71,72] emitted, gap-71 options silently discarded; item 71 keeps empty `a`–`d`. Passing the parsed shape through the real `src/owner-tool/contexts.js` `syncLinks` binds item 71 to the cloze card at position 1/slot 71 with no conflict. FIX-1 |
| `grep` for `.submit()`, `requestSubmit`, `fetch(` in `src/owner-tool/*.js` | No matches: no automatic POST, fetch, or activation path |
| `grep` for cloze docs coverage | SPEC §3d (:308-334), D-68 (:963-1003), INV-104–107 (:158-161), EC-100–104 (:161-165), entry-point command lists | Documented consistently with the implemented behavior |

## Acceptance Coverage

| Acceptance check | Review result |
|---|---|
| Supplied Q71–Q80 table | **PASS**: ten linked items with four transcribed options each (`sample-cloze-section6`, 43 checks; `node tests/runner.js`) |
| Multiword Q78 cells | **PASS**: `a vow`, `an oath`, `an allegiance`, `a pledge` remain distinct; verified in the promoted spec and by direct parse |
| Context | **PASS**: `[[gap:71]]`–`[[gap:80]]` present with the two source paragraphs retained |
| Generated stems | **PASS**: `Choose the option that best fills gap N.`, `contextPosition` 1–10, editable card fields; slots assigned from token order by `contexts.js:125-165` (`tests/owner-tool.js:871`) |
| Same-paste key | **PASS for the evidenced shape only**: an `ANSWERS`-headed key ticks rows by printed number with zero submits (`tests/owner-tool.js:896-904`). Synthetic only; the real same-paste sample is the open external gate. See NOTE-1 for the adjacent-key shape |
| Candidate | **PASS by inspection plus renderer suite**: every `[[gap:N]]` renders as a `span`, only the active slot becomes `mark[aria-current]` (`src/cbt/context-render.js:17-51`); `node tests/cbt-context.js` 4 PASS. The PHP page was not executed here |
| Multiple contexts | **PASS**: `sample-cloze-mixed` (comprehension + cloze as `ctx-1`/`ctx-2`), and the two-table probe |
| Singular paste | **PASS**: the Section 6 block parses and links independently |
| Ambiguous table | **PASS**: every refusal probe produces a warning naming the cause, no guessed options, and no context link |
| Limits | **PASS for the documented 500-character rule** (501 refused, 500 accepted; empty/partial rows refused). See NOTE-3 for the code-unit vs byte measure |
| Regression | **PASS**: 59/59 runner, 158 unit, 53 owner-tool, 13 context-migration, 4 cbt-context, 7 bank hashes |

## Per-File Measurements, Responsibility, And Deployment

Base derivation: OT08's recorded finals plus `git diff --numstat 224957e`, as
explained in Scope observations. Line counts are `wc -l`, bytes are `wc -c`.

| File | OT09 base | Additions/deletions | Final lines/bytes | SHA-256 (working tree, LF) | Responsibility | Deployment / direct test |
|---|---:|---:|---:|---|---|---|
| `src/parser/cloze.js` | new | +274 / −0 | 274 / 8785 | `2bc5e166f6ec9f68bc9320fc0fca4f4afa03c53ade42da7da13f02bc80c2b405` | Gap/table recognition, `[[gap:N]]` normalization, row-derived column starts, word-safe slicing, refusal warnings, synthesized items | Loaded before `core.js` at `deployed/admin_questions.php:1084`; `node tests/runner.js`; `node tests/unit.js` |
| `src/parser/core.js` | 906 / 30777 | +42 / −0 | 948 / 32267 | `a39fbbe40f34c5ed9727ac7189524b208b3ad92845c7d11604e6d145487f4cc5` | Compose cloze before comprehension, merge synthesized items, renumber contexts, guard comprehension linking | Same page; `node tests/runner.js`; `node tests/unit.js` |
| `src/owner-tool/controller.js` | 620 / 23171 | +1 / −1 | 620 / 23208 | `ac59e004c85bcb349bb8e814ee9b449bf4b9d790dfc6bebebc2da1fcaaf02c7b` | Map parsed context type so cloze cards and slots are created | `admin_questions.php:1086`; `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | 1089 / 63873 | +5 / −5 | 1089 / 63924 | `c28fe6834fc194be0f283f7bd2631d810132b311f1b36b122c138c4f082c63f9` | Load `cloze.js` before `core.js`; asset query `2.3.0` | Static load-order probe (`tests/owner-tool.js:1174-1180`); `php -l` unavailable on this host |

Production additions are within the 100-addition limit for existing files
(`core.js` +42, `controller.js` +1, `admin_questions.php` +5). The numbers
reconcile with the aggregate diff: `core.js` 76 (OT08) + 42 = 118 additions and
6 deletions; `controller.js` and `admin_questions.php` each have one OT08-added
line replaced inside OT09's `+1/−1` and `+5/−5` spans, which is why the totals
are 36/1 and 5/5 rather than the sums of the two reports.

Non-production test files, final sizes only (the OT08/OT09 split is not
separable without the OT08 tree, and neither is production):
`tests/runner.js` 826 / 30078 (unchanged by OT09 — see NOTE-2),
`tests/unit.js` 2018 / 86864, `tests/owner-tool.js` 1311 / 60363.

**Approvals:** none. OT09 has no recorded Gate 1 plan table and no owner
approval of any kind; contrast the OT07 plan at
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:74-94`. The handoff asserts
compliance (`docs/plan/owner-tool/ot-09-cloze-ocr.md:87`) and self-reports
"247 readable lines" (`:78`), but no document names an exception for
`src/parser/cloze.js`. BLOCK-1 follows from that.

**Deployment inclusion:** every OT09 module is included by
`deployed/admin_questions.php:1084` in dependency order
(`comprehension.js` → `cloze.js` → `core.js`) at `?v=2.3.0`, matching
`PARSER_VERSION` `2.3.0` in `src/parser/core.js:4-7`. No module is orphaned.

## Findings

### BLOCK-1 — `src/parser/cloze.js` exceeds the 250-line new-module cap without an owner approval

**Exact defect.** The externalize-first contract caps a new production module at
250 readable lines in its final, unminified source form, with any excess needing
an explicit Gate 1 owner approval naming the file, the measured excess, and the
justification (`docs/plan/README.md:91-95`). `src/parser/cloze.js` measures
**274 lines** (`wc -l`) and 8785 bytes; it contains 18 blank lines and 9
comment-only lines, leaving 247 non-blank, non-comment lines. The operative
measure in this cycle counts total lines: the phase-8 review certified
`src/owner-tool/context-panel.js` as "249 readable lines"
(`docs/plan/reviews/owner-tool-2026-11-phase-8.md`, per-file section), and that
file is 249 total lines but only 244 non-blank/non-comment lines. OT09's handoff
reports the smaller 247 figure and concludes compliance
(`docs/plan/owner-tool/ot-09-cloze-ocr.md:78,87`), but no Gate 1 plan or owner
approval for this file exists anywhere in the package or coordinator. The
excess is 24 lines over the cap.

**Supported operating preconditions.** A read-only checkout of the reviewed
tree; the cap applied as written to the final unminified source; no approval
recorded in the package or coordinator that names `cloze.js`.

**Finite closure criteria.** One of the following, recorded before commit
readiness changes:

1. `src/parser/cloze.js` is reduced to **≤ 250 lines by `wc -l`** with detection
   behavior unchanged, and every suite below still passes; or
2. an owner Gate 1 approval is recorded in the OT09 package and the coordinator
   naming `src/parser/cloze.js`, the measured excess (24 lines; 274 vs 250), and
   the justification; or
3. the owner records a `change requirement` disposition that defines "readable
   lines" as excluding blank and comment-only lines, and that definition is
   written into the coordinator's externalize-first contract so it applies to
   every later module.

**Required evidence.** The `wc -l`/`wc -c`/`sha256sum` output for the final file,
the full suite results, the corrected handoff measurement line, and the exact
approval or disposition text with its file and line.

**Non-goals / deferred checks.** No change to the recognition or column
algorithm, no re-litigation of OT07/OT08 module counts, no change to the cap for
any other file, no PHP/browser/staging work (OT10), and no requirement to split
the module if the owner approves the excess.

### FIX-1 — A duplicate question number silently discards a cloze row and binds an unrelated question to the cloze card

**Exact defect.** `mergeClozeItems`
(`src/parser/core.js:787-798`) drops any synthesized cloze item whose number
already exists in the parsed items (`:792`, `if (seen.has(item.num)) continue;`)
without a warning, while `src/parser/cloze.js:242-243` creates one item per
table row keyed by the printed row number. A paste that satisfies all four cloze
evidences and also contains an ordinary question with the same number therefore
produces a cloze context whose member is not the table row:

- probe input: `71. Standalone question about something?` followed by a valid
  71–72 cloze block;
- parser result: `contexts: [{targets: [71,72]}]`, `items: [71, 72]`, item 71
  with empty `a`–`d` and no `contextRef`, item 72 carrying the cloze options;
- real model result: `src/owner-tool/contexts.js:125-165` `syncLinks` binds item
  71 to the cloze card at position `1` with `contextSlot` `71` and reports no
  conflict.

The owner therefore receives a partial cloze group: gap 71's four transcribed
options are lost, and an unrelated optionless question is presented as gap-71's
member. This contradicts INV-106's "no partial context" (`docs/INVARIANTS.md:160`)
and the package guardrail "Do not create partial cloze groups ..."
(`docs/plan/owner-tool/ot-09-cloze-ocr.md:69-70`), reached through a numbering
collision rather than a mismatched table.

**Supported operating preconditions.** A paste that meets the documented cloze
recognition preconditions and additionally contains an ordinary numbered
question whose number equals a cloze row number. This is realistic in
multi-section pastes where numbering repeats (a second cloze block numbered
71–80) and in pastes combining two independently numbered sections.

**Finite closure criteria.** When a cloze row number collides with an
already-parsed ordinary item, the cloze group must be **refused as a whole** with
a distinct warning naming the colliding number(s) and the rows left on the
legacy path — no synthesized item, no context, no silent drop — so that no
partial cloze group can reach the owner-tool model. Any mechanism with that
observable outcome is acceptable. Zero automatic POSTs must remain unchanged.

**Required evidence.** A parser probe or unit test that asserts the collision
produces the named warning and no cloze context for the colliding group, the
correct behavior for the non-colliding rows in the same paste, and full
runner/unit/owner-tool results; the handoff must record the new evidence.

**Non-goals / deferred checks.** No change to the gap/row matching rule, no new
global duplicate-number policy, no change to legacy numbering-gap flags for
ordinary questions, no change to the OT06/OT07 link contracts, and no browser or
PHP work.

### NOTE-1 — A same-paste key placed immediately after the table, with no blank line or heading, refuses the whole cloze group

`readRows` (`src/parser/cloze.js:120-127`) stops only at a blank line or a
non-row line, and the row pattern (`:7`) matches key lines such as `71. B`.
Probe: valid rows 71–72 immediately followed by `71. B` / `72. C` yields
"does not match the passage gaps 71-72", no context, and no parsed key; the same
block parses correctly when the key follows a blank line or an `ANSWERS`
heading, as the owner-tool test does (`tests/owner-tool.js:896-904`). The
degradation is safe — an explicit warning, no guessed options, rows left as
ordinary questions — so it does not invalidate the package, but a real paste
with an adjacent unheaded key block loses the cloze interpretation and the key.

### NOTE-2 — The handoff's "Files changed" list includes `tests/runner.js`, which OT09 did not change

`docs/plan/owner-tool/ot-09-cloze-ocr.md:120` lists `tests/runner.js` among the
files changed, and `:127` records its hash. The file is 826 / 30078 with SHA-256
`66d6b842e919c6f227bc4b6a938704de5f5c81acfa601bc6a7908cd8fcfb538e`, exactly the
hash OT08 recorded for it, and the worktree shows no OT09 change to it. Its 141
added lines belong to OT08. The hash itself is correct and the production
measurement table does not include `runner.js`, so this is an attribution error
in the evidence list, not a measurement error.

### NOTE-3 — The 500-option refusal is measured in JavaScript code units while the server enforces bytes

`src/parser/cloze.js:10,200` compares `String.length` against 500;
`deployed/admin_questions.php:475` rejects with
`max(array_map('strlen', $options)) > 500` (bytes) and the form inputs use
`maxlength="500"` (`:872-884`). An option of roughly 400 multibyte characters
passes both the parser and the form but is rejected by the server at save, so
EC-103's "refused before any native save" is exact only for ASCII. The
form/server mismatch predates OT09 and applies to every question, so this is a
residual risk, not an OT09 regression; PHP is absent on this host, so the server
side is inspection-only.

## Verdict

**BLOCK.**

BLOCK-1 is an unapproved new-module line-limit breach, which is always a
blocker. FIX-1 is a reproducible silent partial-cloze defect reached from the
documented recognition preconditions. The core Release C behavior is otherwise
sound: the supplied Section 6 table parses to ten correctly transcribed linked
items with exact gap tokens and preserved paragraphs, every refusal probe warns
and refuses rather than guessing, all four baseline suites and the bank
extractor reproduce the handoff, and every recorded production hash and size
reproduces.

**Review status:** original rigorous Release C review complete; no re-review was
requested or written.

**Commit readiness:** not commit-ready. The reviewed tree is uncommitted OT08+
OT09 work on `owner-tool-integration`; it may not be committed, treated as the
phase-10 close baseline, or advanced to `main` until BLOCK-1 and FIX-1 are
dispositioned. NOTE-1 through NOTE-3 do not block.

**Findings closed by a re-review:** none; this is the original phase-10 record.

**Pending user decision:** disposition of BLOCK-1 and FIX-1 (`fix`, `reject`,
`accept risk`, `defer`, or `change requirement`). OT10 remains blocked; no
dependent package may start while these are unresolved.

## Excluded Artifacts

Supplied root SQL (`questions.sql`, `subjects.sql`, `exam_category.sql`,
`questions1.sql`) and their unchanged archive copies; `db_conn.php`; the
`archive/` migration docs and live sources; `sample-passages.txt` and the other
supplied sample text files (read only as fixture provenance);
`deployed/cbt_practice.php` and `practice_title` (outside remaining cycle
scope); the unchanged legacy parser/UI/bookmarklet sources and the generated
`src/bookmarklet.js`; the unchanged OT06/OT07 delivery files
(`deployed/cbt.php`, `deployed/cbt_candidate_*.php`, `src/cbt/context-render.js`,
`src/cbt/context.css`, `src/owner-tool/contexts.js`, `state.js`, `context-form.js`,
`context-card.js`); the uncommitted OT08 tree files listed in Scope
observations; and the untracked `.cloud-attachments/` directory.

## Recommended Next Action

Record the owner's dispositions for BLOCK-1 and FIX-1 before any phase-10
commit-readiness change or OT10 start. NOTE-1 through NOTE-3 need no action for
commit readiness and may be folded into a fix session or accepted.

`NEXT COMMAND: @docs/plan/prompts/finding-disposition.md phase 10 OT09 BLOCK-1 FIX-1`
