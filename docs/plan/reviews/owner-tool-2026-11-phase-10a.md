# Owner Tool 2026-11 Phase 10A Review

- **Date:** 2026-11-08
- **Reviewer:** OpenCode, independent review session
- **Package:** OT09A — Production Consolidation
- **Scope:** read-only `owner-tool-integration` at package base `652c891`
  (`fix: keep first cloze group on duplicate numbering`) plus the uncommitted
  OT09A tree. At review start the worktree carried four new consolidated
  production files (`deployed/admin_context.php`, `deployed/cbt_candidate.php`,
  `src/owner-tool/owner-tool.js`, `src/owner-tool/owner-tool.css`), the deleted
  split modules, modified `deployed/{admin_questions,cbt,cbt_practice,context_lib}.php`,
  `src/parser/core.js`, `src/owner-tool/render.js`, the touched tests/tools, and
  the OT09A package/coordinator/dossier updates.
- **Record:** original phase-10A review. No earlier phase-10A record existed to
  overwrite or re-review.

## Independence And Scope

This session treated the OT09A package handoff and the coordinator summary as
untrusted claims. It read the coordinator, active map, `INTENT.md`, `AGENTS.md`,
`docs/AGENTS.md`, the OT09A package, the phase-10 review, the implementation,
the touched tests/tools, and the recorded live snapshots. It ran every available
baseline and package probe, independently reproduced every per-file measurement,
and added adversarial probes at the consolidation boundary: old-vs-new parser
equivalence, old-vs-new render equivalence, old-vs-new PHP fragment equivalence,
and a verbatim function-body comparison of every absorbed module.

No product file, test, fixture, package status, handoff, or coordinator file was
edited. The only file written is this record. No branch was created, switched,
merged, or moved; no commit was made. No live site, browser, staging database,
or production write exists or was used.

### Scope observations

- The package base is `652c891`, and the coordinator/package agree on it. The
  uncommitted tree contains only OT09A changes plus the package docs; no
  unrelated user work was present (`git status --porcelain` shows only the
  expected new/deleted/modified package files).
- The two documented owner-requirement edits (`INTENT.md` and
  `docs/plan/README.md` externalize-first contract) plus `D-71` correctly
  replace the former 250-line new-module ceiling with "no fixed cap for new
  modules; live-origin files keep 100 cumulative additions". They are part of
  this package, not unrelated drift.
- The live-origin baseline for `deployed/admin_questions.php` is the
  OT01-designated `archive/live-sources/admin_questions-2026-10-31.php`
  (`docs/plan/owner-tool/ot-01-evidence-and-fixtures.md:86`). The older
  `archive/live-sources/admin_questions.php` is not that baseline (see NOTE-2).
- `deployed/cbt_practice.php` is deliberately outside the 12-file handoff; its
  only OT09A change is the shared renderer cache token (`?v=2.3.2c`).
- The known Windows/CRLF `extract-bank` pre-2026 output-hash mismatch is
  reproduced on this host and predates OT09A; `tools/extract-bank.js`, the bank
  source, and the fixture inputs are unchanged by OT09A.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD`, `git status --porcelain`, `git log --oneline -5` | On `owner-tool-integration`; HEAD `652c891`; expected uncommitted OT09A tree; no unrelated changes |
| `node tests/runner.js` | 59 fixtures: 59 PASS, 0 FAIL, 0 PENDING; no orphan input |
| `node tests/unit.js` | 162 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 53 PASS, 0 FAIL (real consolidated `owner-tool.js` executed in the VM harness) |
| `node tests/context-migration.js` | 14 PASS, 0 FAIL (manifest, live-origin additions, and static wiring probes) |
| `node tests/cbt-context.js` | 5 PASS, 0 FAIL (real consolidated `render.js` context API plus browser globals) |
| `php -v` / `php 8.3.16 -l` | PHP 8.3.16; clean lint on every changed `deployed/*.php` (`admin_questions`, `cbt`, `answer_details`, `render`, `context_lib`, `admin_context`, `cbt_candidate`, `cbt_practice`) |
| `node --check` on `core.js`, `render.js`, `owner-tool.js` | Clean on all three |
| `php tests/context-lib.php` | 13 PASS, 0 FAIL (real `deployed/context_lib.php`) |
| `php tests/context-admin.php` | 19 PASS, 0 FAIL (real `deployed/admin_context.php`) |
| `php tests/context-preflight.php` | 6 PASS, 0 FAIL |
| `php tests/php-render.php` | 9 renderer vectors PASS (real `deployed/render.php`) |
| `php tests/cbt-candidate.php` | 7 PASS, 0 FAIL (real `deployed/cbt_candidate.php`) |
| `node tools/cloze-probe.js` | exit 0; keeps the first colliding cloze group with the "duplicate cloze group for gaps 71-72 ignored" warning |
| `node tools/extract-bank.js --check` | Stops at the recorded pre-existing Windows/CRLF `bank-pre-2026` fixture-hash mismatch; source/anchors/slices unchanged by OT09A |
| `git diff --numstat 652c891` | Reproduced for every modified file (table below) |
| `git diff --no-index --numstat archive/live-sources/* deployed/*` | Reproduced the four live-origin deltas: +95/−77, +53/−89, +20/−2, +2/−1 |
| Manifest probe | All 12 production files and 2 ops files exist; all 21 absorbed split files are absent; the 4 repo-only migration-support files remain |
| Asset-order probe | Admin loads `owner-tool.css` → `core.js` → `render.js` → `owner-tool.js`; CBT loads `owner-tool.css` → `render.js`; practice loads `render.js`; no deleted asset is referenced |
| Adversarial P1: old `comprehension.js`/`cloze.js` (from `652c891`) vs consolidated `core.js` engines over all 12 comprehension/cloze fixture inputs and a blocked-set variant | **0 diffs** in `detect()` output |
| Adversarial P2: old `src/cbt/context-render.js` + old `render.js` vs consolidated `render.js` over 8 text vectors (`format`/`strip`/`segments`) and 3 context cards × 3 active-slot values plus `renderForQuestion` | **0 diffs** in DOM tree and text output |
| Adversarial P3: old `admin_question_context_fields.php` / `admin_context_management.php` includes vs the new render functions | Identical output for schema-present, schema-absent, create, edit, and no-schema vectors, except one trailing newline (NOTE-1) |
| Adversarial P4: verbatim function-body comparison, 118 functions across the 15 absorbed function-bearing modules | 117 byte-identical (whitespace-normalized); only `renderText` differs by local variable names and is behavior-equal under P2. The two template partials were checked by P3; the controller is exercised by `tests/owner-tool.js` |
| CSS concatenation probe | The three old CSS files' normalized content (3617 chars, both `@media` blocks) is fully contained in `owner-tool.css`; no dropped rule |

## Acceptance Coverage

| Acceptance check | Review result |
|---|---|
| Node suites | **PASS**: runner 59/0/0, unit 162, owner-tool 53, context-migration 14, cbt-context 5 |
| PHP suites | **PASS**: context-lib 13, context-admin 19, context-preflight 6, php-render 9, cbt-candidate 7 on PHP 8.3.16 |
| PHP lint | **PASS** on every changed `deployed/*.php` |
| Live-origin additions | **PASS**: +95 (admin_questions), +53 (cbt), +20 (cbt_practice), +2 (answer_details), all ≤ 100 against the designated OT01 snapshots |
| Manifest | **PASS**: the 12 production files exist; every absorbed split file is gone; repo-only migration support stays |
| Assets | **PASS**: admin, CBT, and practice load only consolidated files in the required order; no deleted asset is referenced |
| State | **PASS**: `cbtOwnerTool:v1`, `STATE_VERSION 1`, and `PARSER_VERSION 2.3.2` are unchanged; state-key fixture still prints `cbtOwnerTool:v1 v1` |
| Behavior preservation | **PASS**: parser/render/PHP equivalence probes and the verbatim-body check show no behavioral change; only one HTML trailing newline differs (NOTE-1) |
| Safety | **PASS**: no live write, destructive action, staging action, or commit |

## Per-File Measurements, Responsibility, And Deployment

Base `652c891`. Line counts are `wc -l`; bytes are LF-normalized UTF-8 bytes
(the Windows working tree carries CRLF for five files, so their on-disk byte
counts are larger by the `\r` count). Hashes are SHA-256 over LF-normalized
content.

| File | Base delta | Final lines / LF bytes | SHA-256 (LF) | Responsibility | Deployment / direct test |
|---|---:|---:|---|---|---|
| `deployed/admin_questions.php` | +10 / −35 | 1064 / 62659 | `3afcaf64da0c568ebeb3909366c30c189d7cd41b1d5eb2c4ec9ed357f129d419` | Entry point; narrow include and renderer/asset wiring | `require_once admin_context.php`; render call sites `:816,:925`; `tests/context-migration.js`; `tests/owner-tool.js` asset-order; `php -l` |
| `deployed/cbt.php` | +3 / −4 | 1008 / 44515 | `358c9926833465d4fdf8eb6746a328f0a12f1fa0e6d7d7165b0438192433923e` | CBT delivery page; consolidated candidate include and assets | `require_once cbt_candidate.php`; `render.js` + `owner-tool.css`; `tests/context-migration.js`; `php -l` |
| `deployed/answer_details.php` | 0 / 0 | 251 / 12157 | `b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c` | Answer-details rendering | unchanged from base; `tests/owner-tool.js` static sink probe; `php -l` |
| `deployed/render.php` | 0 / 0 | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` | Shared server text renderer | unchanged from base; `php tests/php-render.php`; `php -l` |
| `deployed/context_lib.php` | +270 / −2 | 480 / 19401 | `bc86d26e70451aeddc8dc95ad789ccdd611d0cb3053917f83df281d121189c02` | Side-effect-free context validation and queries | included by `admin_context.php`; `php tests/context-lib.php`; `php -l` |
| `deployed/admin_context.php` | new +833 / −0 | 833 / 38568 | `1ac928a7c3aabbef59eafe2446b3a081c453da2b62666e2ef9b5c74214a9f8d1` | Admin context request handling, rendering, and question-link mutations | `require_once` by `admin_questions.php`; `php tests/context-admin.php`; `php -l` |
| `deployed/cbt_candidate.php` | new +423 / −0 | 423 / 16714 | `8d1383ef11bd2963af521af62d20c123663642f0149702714620a5a516463dc6` | Candidate unit selection and repository queries | `require_once` by `cbt.php`; `php tests/cbt-candidate.php`; `php -l` |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 250 / 17870 | `e963b739a26f20e5b12db6525266b580c0472d494fd29a6fb44a3a3f076b55f7` | Forward migration | unchanged from base; `tests/context-migration.js` |
| `src/parser/core.js` | +430 / −4 | 1426 / 48965 | `4c64b8715ad4de72b23fe4340b75ca6e34c860035f95d8e9ba5b814f096ac501` | Parser core plus internal comprehension/cloze engines | `admin_questions.php`; `node tests/runner.js`; `node tests/unit.js` |
| `src/owner-tool/render.js` | +97 / −3 | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` | Shared text renderer plus context-card renderer | admin + CBT + practice pages; `node tests/cbt-context.js`; `node tests/owner-tool.js` |
| `src/owner-tool/owner-tool.js` | new +1613 / −0 | 1613 / 59846 | `fd54358616d099e57aa3fa5f48ebb190b3b49b29686d581892b5bae198941405` | Owner-tool state, context model/form/card/panel, and controller | `admin_questions.php`; `node tests/owner-tool.js` |
| `src/owner-tool/owner-tool.css` | new +257 / −0 | 257 / 3952 | `bc2a0c8a179f3385d2cd7e229f0d17b560fa04479eb6fbcc8f227943f91f6871` | Owner-tool, context-workflow, and CBT context styles | admin + CBT pages; `node tests/owner-tool.js` style probes |
| `deployed/sql/README.md` (ops) | 0 / 0 | 172 / 8065 | `7f474ffe65523a957b656db380e01520e30cc7a7373309754274700f5789e861` | Runbook / preflight gate | unchanged from base; `tests/context-migration.js` |
| `deployed/sql/02-context-rollback.sql` (ops) | 0 / 0 | 64 / 2512 | `047e11005acf8194c66151ebcc1a6510fd6983aab5643552ab9d3d064dbde694` | Guarded rollback | unchanged from base; `tests/context-migration.js` |

**Approvals:** none required. All four live-origin files are within 100 additions
on their designated snapshots; D-71 records the 2026-11-08 owner requirement
change that removed the former new-module line cap. No exception is claimed.

**Deployment inclusion:** every consolidated module has a real include/asset
path. No module is orphaned, and no deployed entry point references a deleted
split file.

## Findings

### FIX-1 — The OT09A Gate 1 and handoff omit the externalize-first per-file measurement record

**Exact defect.** The coordinator's externalize-first contract requires the Gate 1
plan to report every planned production file with baseline lines/bytes, expected
additions, extraction boundary, responsibility, deployment path, and direct test,
and requires the handoff to report per production file additions/deletions from
the package base, final lines/bytes, responsibility, deployment inclusion, and
the test evidence that executes its production path, plus a separate
excluded-artifact list (`docs/plan/README.md:103-140`; definition of done
`:377-397`). The OT09A package records only a `File | Lines` table
(`docs/plan/owner-tool/ot-09a-production-consolidation.md:82-100`) and a global
"Verification" command list (`:139-157`). It does **not** report:

- additions/deletions from the package base `652c891` for the 12 production
  files or the 2 ops files (only the four live-origin deltas are given);
- final byte counts or hashes;
- a per-file deployment-inclusion and direct-production-test mapping;
- an explicit excluded-artifact list (it names `cbt_practice.php` and the four
  repo-only migration-support files, but not the generated/unchanged legacy and
  supplied artifacts as a separate list).

The reviewed behavior and the file set are correct; this is missing required
evidence, not a product defect. The blank Gate 1 plan table is the same gap in
the package's own historical record.

**Supported operating preconditions.** A read-only checkout of the consolidated
tree at base `652c891`; the externalize-first contract applied as written; no
owner approval relaxing the reporting requirement.

**Finite closure criteria.** The OT09A package's Gate 1/handoff records, for all
12 production files and the 2 ops files, a table with: (a) additions/deletions
from `652c891`; (b) final lines and bytes (state the CRLF basis); (c)
responsibility; (d) deployment inclusion; and (e) the direct production-path
test or probe. It also records a separate excluded-artifact list. Every number
must reproduce `git diff --numstat 652c891`,
`git diff --no-index --numstat <archive> <file>`, `wc -lc`, and `sha256sum`.

**Required evidence.** The corrected package text plus the command output for
the base deltas, final lines/bytes, hashes, and the four live-origin deltas. No
product, test, fixture, or behavior change.

**Non-goals / deferred checks.** No change to source, tests, fixtures, parser
version, state key, file set, or deployment order; no reopening of the closed
phase-10 findings; no OT10 runtime/staging work; no requirement to preserve the
blank Gate 1 table as history (the handoff may carry the complete record).

### NOTE-1 — The consolidated render functions add one trailing newline to the two context fragments

The former `admin_question_context_fields.php` and `admin_context_management.php`
includes emitted one fewer trailing newline than
`cbt_admin_render_question_context_fields()` and
`cbt_admin_render_context_management()`. The probe found identical HTML for
schema-present, schema-absent, create, edit, and no-schema vectors, with the new
output ending in `\n\n` instead of `\n` after the closing `</div>`/`</section>`.
This is HTML whitespace only and does not affect rendering, selectors, or the PRG
flow. No action is required for commit readiness.

### NOTE-2 — Use the OT01 designated admin snapshot for the 100-addition rule

`deployed/admin_questions.php` is +95/−77 against the OT01-designated
`archive/live-sources/admin_questions-2026-10-31.php`, which is the correct
baseline. The older `archive/live-sources/admin_questions.php` copy yields
+191/−99 and must not be used for the limit or for OT10 re-validation. This is a
baseline-selection clarification, not a defect in OT09A.

## Verdict

**PASS WITH ACCEPTED FINDINGS.**

The consolidation is behavior-preserving and within the externalize-first
limits: all Node/PHP suites pass on the real consolidated modules; the four
live-origin files are at +95/+53/+20/+2 (≤100); the manifest and asset-order
checks pass; `PARSER_VERSION` 2.3.2 and `cbtOwnerTool:v1` are unchanged; and the
old-vs-new equivalence probes found no parser, renderer, or PHP-fragment
behavioral difference. The only accepted finding is FIX-1, a documentation
evidence gap; NOTE-1 and NOTE-2 are non-blocking.

**Review status:** original phase-10A review complete; no re-review was requested
or written.

**Commit readiness:** not commit-ready until FIX-1's handoff evidence is
recorded. No production change is required, and no other finding blocks the
phase-10A boundary or the OT10 gate.

**Findings closed by a re-review:** none; this is the original phase-10A record.

**Pending user decision:** none. A first-round FIX routes to a fix session, not
owner disposition.

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

## Recommended Next Action

Authorize the documentation-only fix session for FIX-1. It must add the complete
externalize-first measurement table and excluded-artifact list to the OT09A
Gate 1/handoff, reproduce the numbers from `652c891`, and leave all product and
test files untouched.

`NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 10A OT09A FIX-1`
