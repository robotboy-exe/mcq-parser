# Owner Tool 2026-11 Phase 10A Re-review — FIX-1 Closure

- **Date:** 2026-11-08
- **Reviewer:** OpenCode, independent review session
- **Package:** OT09A — Production Consolidation
- **Scope:** read-only `owner-tool-integration` at package base `652c891`
  (`fix: keep first cloze group on duplicate numbering`) plus the uncommitted
  OT09A tree after the documentation-only `FIX-1` fix. This is a
  closure-focused re-review of `FIX-1` from
  `docs/plan/reviews/owner-tool-2026-11-phase-10a.md`; the original record is
  immutable and unchanged.
- **Record:** first phase-10A re-review. It disposes only `FIX-1`. `NOTE-1` and
  `NOTE-2` remain non-blocking and were not part of the fix.

## Independence And Frozen Scope

This session treated the OT09A package handoff, the fix note, and the
coordinator summary as untrusted claims. It read the coordinator, active map,
`INTENT.md`, `AGENTS.md`, `docs/AGENTS.md`, the OT09A package, the original
phase-10A review, the implementation, the touched tests/tools, and the recorded
live snapshots. It ran the package baseline and acceptance probes, independently
recomputed every per-file measurement in the new externalize-first table, and
reproduced the manifest and deployment-inclusion claims.

`FIX-1`'s frozen closure contract was extracted from the original review
(`docs/plan/reviews/owner-tool-2026-11-phase-10a.md:131-175`) and the fix note
(`docs/plan/owner-tool/ot-09a-production-consolidation.md:198-209`). It is not
broadened or repurposed here.

No product file, test, fixture, package status, handoff, or coordinator file was
edited. The only file written is this record. No branch was created, switched,
merged, or moved; no commit was made. No live site, browser, staging database,
or production write exists or was used.

### Scope observations

- The package base is `652c891`, and the coordinator, package, and original
  review agree on it. `git status --porcelain` shows only the expected OT09A
  new/deleted/modified files and package docs; no unrelated user work is
  present.
- The fix session changed documentation only. Files with a modification time
  after the original review record are exactly `docs/STATUS.md`,
  `docs/plan/README.md`, `docs/plan/prompts/phase-map.md`,
  `docs/plan/owner-tool/next-steps.md`, and the OT09A package. Every test/tool
  file predates the original review.
- All 14 production/ops SHA-256 values reproduce the original review's table
  exactly, independently proving that the fix changed no production file.
- The two documented owner-requirement edits (`INTENT.md` and the
  externalize-first contract in `docs/plan/README.md`) plus `D-71` were already
  accepted in the original review and are not reopened.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD`, `git rev-parse HEAD`, `git status --porcelain` | On `owner-tool-integration`; HEAD `652c891`; expected uncommitted OT09A tree; no unrelated changes |
| `node tests/runner.js` | 59 fixtures: 59 PASS, 0 FAIL, 0 PENDING; no orphan input |
| `node tests/unit.js` | 162 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 53 PASS, 0 FAIL (real consolidated `owner-tool.js` executed in the VM harness); state fixture prints `cbtOwnerTool:v1 v1` |
| `node tests/context-migration.js` | 14 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 5 PASS, 0 FAIL (real consolidated `render.js` context API plus browser globals) |
| `php 8.3.16 -v` / `php -l` on every changed `deployed/*.php` | PHP 8.3.16; clean lint on `admin_questions`, `cbt`, `answer_details`, `render`, `context_lib`, `admin_context`, `cbt_candidate`, `cbt_practice` |
| `node --check` on `core.js`, `render.js`, `owner-tool.js` | Clean on all three |
| `php tests/context-lib.php` | 13 PASS, 0 FAIL (real `deployed/context_lib.php`) |
| `php tests/context-admin.php` | 19 PASS, 0 FAIL (real `deployed/admin_context.php`) |
| `php tests/context-preflight.php` | 6 PASS, 0 FAIL |
| `php tests/php-render.php` | 9 renderer vectors PASS (real `deployed/render.php`) |
| `php tests/cbt-candidate.php` | 7 PASS, 0 FAIL (real `deployed/cbt_candidate.php`) |
| `node tools/cloze-probe.js` | exit 0; keeps the first colliding cloze group with the "duplicate cloze group for gaps 71-72 ignored" warning |
| `git diff --numstat 652c891 -- <modified production files>` | Reproduced +10/−35, +3/−4, +270/−2, +97/−3, +430/−4 exactly |
| New-file deltas via a throwaway `GIT_INDEX_FILE` + `git add -N` | `admin_context.php` +833/−0, `cbt_candidate.php` +423/−0, `owner-tool.css` +257/−0, `owner-tool.js` +1613/−0 (matches the handoff; untracked files need intent-to-add) |
| `git diff --no-index --numstat NUL <new-file>` | Same +lines/−0 for the four new files |
| LF-normalized byte count, `wc -l`, and an independent .NET SHA-256 over all 14 files | Every final-lines, LF-bytes, and SHA-256 value matches the handoff table exactly |
| CRLF-basis probe | Exactly five production files carry CRLF on every line (`admin_questions.php`, `cbt.php`, `answer_details.php`, `render.php`, `render.js`); `context_lib.php` is LF. Matches the handoff's stated basis |
| `git diff --no-index --numstat <archive> <file>` | Reproduced the four live-origin deltas: +95/−77 (admin), +53/−89 (cbt), +20/−2 (practice), +2/−1 (answer details), all ≤ 100 |
| Manifest probe | All 12 production files and 2 ops files exist; all 21 absorbed split files are absent; the 4 repo-only migration-support files remain |
| Deployment-inclusion grep | `admin_questions.php` requires `admin_context.php` (`:7`), calls the renderers at `:816,:925`, and loads `owner-tool.css` → `core.js` → `render.js` → `owner-tool.js` (`:1060-1061`); `cbt.php` requires `cbt_candidate.php` (`:4`) and loads `owner-tool.css` (`:176`) + `render.js` (`:732`); `answer_details.php` requires `render.php` (`:6`); `admin_context.php` requires `context_lib.php` (`:4`) |
| Parser/state identity | `PARSER_VERSION = "2.3.2"`; `KEY = 'cbtOwnerTool:v1'`; `STATE_VERSION = 1` |

## FIX-1 Disposition — CLOSED

`FIX-1` (missing externalize-first per-file measurement record) is closed against
its frozen checklist:

| Frozen closure criterion | Re-review evidence | Result |
|---|---|---|
| Table covers all 12 production files and 2 ops files | `docs/plan/owner-tool/ot-09a-production-consolidation.md:104-119` lists exactly 12 + 2 | PASS |
| (a) additions/deletions from `652c891` | Reproduced for every tracked file; new files reproduce +final-lines/−0 via intent-to-add | PASS |
| (b) final lines and bytes, CRLF basis stated | Every value matches independent recomputation; CRLF basis confirmed | PASS |
| (c) responsibility | One responsibility stated per row; consistent with the consolidation map | PASS |
| (d) deployment inclusion | Every row names a real include/asset path; verified in the entry points | PASS |
| (e) direct production-path test or probe | Every row names a suite/probe that executes the real module; all suites pass | PASS |
| Separate excluded-artifact list | `:128-147` lists supplied SQL, `db_conn.php`, archives, samples, `cbt_practice.php`, repo-only migration support, legacy sources, and `ocr_helper.js` copies | PASS |
| Numbers reproduce the named commands | `git diff --numstat 652c891`, archive `--no-index`, LF byte counting, and independent SHA-256 all match | PASS |
| No product/test/fixture/behavior change | All 14 hashes equal the original review; only five docs changed after the original review; suites reproduce the same counts | PASS |

No new defect was found in the claimed fix. The handoff's statement that
"new files have no blob at `652c891`" is correct: `git diff --numstat 652c891`
does not list untracked files by itself, but the stated +lines/−0 equivalence is
reproducible with intent-to-add and does not affect the measurement's validity.

## Acceptance Coverage

| Acceptance check | Re-review result |
|---|---|
| Node suites | **PASS**: runner 59/0/0, unit 162, owner-tool 53, context-migration 14, cbt-context 5 |
| PHP suites | **PASS**: context-lib 13, context-admin 19, context-preflight 6, php-render 9, cbt-candidate 7 on PHP 8.3.16 |
| PHP lint | **PASS** on every changed `deployed/*.php` |
| Live-origin additions | **PASS**: +95, +53, +20, +2, all ≤ 100 against the designated OT01 snapshots |
| Manifest | **PASS**: 12 production + 2 ops exist; all 21 absorbed files gone; repo-only support stays |
| Assets | **PASS**: admin, CBT, and practice load only consolidated files in the required order |
| State | **PASS**: `cbtOwnerTool:v1`, `STATE_VERSION 1`, `PARSER_VERSION 2.3.2` unchanged |
| Behavior preservation | **PASS**: original equivalence probes stand; no production file changed since the original review |
| Safety | **PASS**: no live write, destructive action, staging action, or commit |

## Per-File Measurements (Independently Reproduced)

Base `652c891`; lines are `wc -l`, bytes are LF-normalized UTF-8 bytes, hashes
are SHA-256 over LF-normalized content. All values match the handoff table.

| File | Δ vs `652c891` | Final lines / LF bytes | SHA-256 (LF) |
|---|---:|---:|---|
| `deployed/admin_questions.php` | +10 / −35 | 1064 / 62659 | `3afcaf64da0c568ebeb3909366c30c189d7cd41b1d5eb2c4ec9ed357f129d419` |
| `deployed/cbt.php` | +3 / −4 | 1008 / 44515 | `358c9926833465d4fdf8eb6746a328f0a12f1fa0e6d7d7165b0438192433923e` |
| `deployed/answer_details.php` | 0 / 0 | 251 / 12157 | `b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c` |
| `deployed/render.php` | 0 / 0 | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` |
| `deployed/context_lib.php` | +270 / −2 | 480 / 19401 | `bc86d26e70451aeddc8dc95ad789ccdd611d0cb3053917f83df281d121189c02` |
| `deployed/admin_context.php` | new +833 / −0 | 833 / 38568 | `1ac928a7c3aabbef59eafe2446b3a081c453da2b62666e2ef9b5c74214a9f8d1` |
| `deployed/cbt_candidate.php` | new +423 / −0 | 423 / 16714 | `8d1383ef11bd2963af521af62d20c123663642f0149702714620a5a516463dc6` |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 250 / 17870 | `e963b739a26f20e5b12db6525266b580c0472d494fd29a6fb44a3a3f076b55f7` |
| `src/parser/core.js` | +430 / −4 | 1426 / 48965 | `4c64b8715ad4de72b23fe4340b75ca6e34c860035f95d8e9ba5b814f096ac501` |
| `src/owner-tool/render.js` | +97 / −3 | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` |
| `src/owner-tool/owner-tool.js` | new +1613 / −0 | 1613 / 59846 | `fd54358616d099e57aa3fa5f48ebb190b3b49b29686d581892b5bae198941405` |
| `src/owner-tool/owner-tool.css` | new +257 / −0 | 257 / 3952 | `bc2a0c8a179f3385d2cd7e229f0d17b560fa04479eb6fbcc8f227943f91f6871` |
| `deployed/sql/README.md` (ops) | 0 / 0 | 172 / 8065 | `7f474ffe65523a957b656db380e01520e30cc7a7373309754274700f5789e861` |
| `deployed/sql/02-context-rollback.sql` (ops) | 0 / 0 | 64 / 2512 | `047e11005acf8194c66151ebcc1a6510fd6983aab5643552ab9d3d064dbde694` |

**Approvals:** none required. All four live-origin files are within 100 additions
on their designated snapshots; D-71 records the owner requirement change that
removed the former new-module line cap. No exception is claimed.

**Deployment inclusion:** every consolidated module has a real include/asset
path; no module is orphaned and no deployed entry point references a deleted
split file.

**Direct production-path tests:** the Node suites execute the real consolidated
`core.js`, `render.js`, and `owner-tool.js`; the PHP suites execute the real
consolidated `context_lib.php`, `admin_context.php`, `cbt_candidate.php`, and
`render.php`. No copied SQL or reimplemented behavior is claimed as evidence.

## Findings

### FIX-1 — CLOSED

The documentation-only fix records the complete externalize-first table and the
separate excluded-artifact list, and every value reproduces the named commands.
All frozen closure criteria pass.

### NOTE-1 — Remains non-blocking

The consolidated render functions add one trailing newline to the two context
fragments (HTML whitespace only). Not part of `FIX-1`; unchanged.

### NOTE-2 — Remains non-blocking

`deployed/admin_questions.php` must be measured against the OT01-designated
`archive/live-sources/admin_questions-2026-10-31.php` (+95), not the older
`archive/live-sources/admin_questions.php` (+191). The handoff uses the correct
snapshot.

### New findings

None.

## Verdict

**PASS.**

`FIX-1` is closed against its frozen closure contract. The OT09A consolidation
remains behavior-preserving and within the externalize-first limits: all
Node/PHP suites pass on the real consolidated modules; the four live-origin
files are at +95/+53/+20/+2 (≤100); the manifest and asset-order checks pass;
`PARSER_VERSION` 2.3.2 and `cbtOwnerTool:v1` are unchanged; and all 14
production/ops measurements independently reproduce the handoff table. `NOTE-1`
and `NOTE-2` remain non-blocking.

**Review status:** first phase-10A re-review complete; the original record is
immutable and unchanged.

**Commit readiness:** the phase-10A product findings are settled and the package
is commit-ready, pending explicit owner authorization. This review does not
commit and does not advance `main`. OT10 remains blocked on local PHP/staging
execution and final answer-key coverage; this package does not change those
gates.

**Findings closed by this re-review:** `FIX-1`.

**Pending user decision:** accept this PASS and authorize the phase-10A boundary
commit. Status propagation (recording `FIX-1` closed in the package, coordinator,
active map, and `docs/STATUS.md`) still requires a non-review session, because
this session may write only its review record.

## Excluded Artifacts

Supplied root SQL (`questions.sql`, `questions1.sql`, `subjects.sql`,
`exam_category.sql`) and their unchanged archive copies; `db_conn.php`;
`archive/` migration docs and live sources; the supplied sample text files
(`sample-passages.txt`, `sample-underline.txt`, `admin-needs.txt`) and their
archived copies; `deployed/cbt_practice.php` (outside the 12-file handoff); the
repo-only migration support (`deployed/sql/base-schema.working.sql`,
`tools/context-migration-{preflight,contract,inspector}.php`); the unchanged
legacy parser/UI/bookmarklet sources (`src/parser/parser.js`, `src/ui/ui.js`,
`src/bookmarklet.js`) and any untracked local `src/bookmarklet.min.js`; and the
unchanged `ocr_helper.js` copies.

## Exact Recommended Next Action

Accept this PASS, record `FIX-1` closed in the OT09A package, coordinator, active
map, and `docs/STATUS.md`, and commit the phase-10A boundary only when the owner
explicitly authorizes it. Do not commit from a review session, do not rewrite
the immutable review records, and do not reopen the closed phase-10 findings.
OT10 Gate 1 remains blocked on owner-supplied local PHP/staging execution and
final answer-key coverage.

`NEXT COMMAND: Commit the Phase 10A boundary, then run @docs/plan/prompts/phase-session.md phase 11`
