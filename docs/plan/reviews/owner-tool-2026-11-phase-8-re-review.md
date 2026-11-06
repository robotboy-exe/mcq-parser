# Owner Tool 2026-11 Phase 8 Re-Review — FIX-1 Closure

- **Date:** 2026-11-06
- **Reviewer:** Buffy (Codebuff), independent re-review session
- **Package:** OT07 — Owner Context Workflow (Release B), phase 8
- **Scope:** read-only `owner-tool-integration` worktree at `b23d7dd` plus the
  uncommitted FIX-1 documentation changes. Closure-focused review of `FIX-1`
  from [`owner-tool-2026-11-phase-8.md`](owner-tool-2026-11-phase-8.md).
- **Record:** first re-review (`-re-review.md`). The original phase-8 record is
  unchanged and not overwritten. No earlier phase-8 re-review exists.

## Frozen Closure Contract

Extracted verbatim in substance from the accepted phase-8 record
(`:159-215`) and the owner disposition at
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:161-203`; neither was
broadened or repurposed by this session.

- **Exact defect.** The OT07 handoff recorded final sizes and SHA-256 values
  that did not match the committed `b23d7dd` blobs: `controller.js`
  585 / 22338 / `098352d9…`; `state.js` 197 / 7714 / `3c1e40f6…`;
  `admin_questions.php` 1089 / 64807 / `da502da3…`; `tests/owner-tool.js`
  `38b05a93…`; and the OT06 `cbt.php` hash reproduced only from CRLF.
- **Supported preconditions.** Read-only checkout of `b23d7dd`, no line-ending
  conversion applied by the reviewer, handoff used as the identity artifact
  before commit/release.
- **Closure criteria.** Every final line/byte count and SHA-256 recorded in the
  OT07 handoff's measurement and hash blocks, and the OT06 `cbt.php` hash, must
  equal `wc -lc` and `sha256sum` output from the committed `b23d7dd` blobs, or
  the handoff must state both the LF value and the exact line-ending basis of
  any alternate value.
- **Required evidence.** A fix handoff containing the command output
  (`git show b23d7dd:<path> | wc -lc`, `sha256sum` on the committed working-tree
  files) and the corrected lines in both handoffs.
- **Non-goals.** No product, test, behavior, or acceptance change; no
  repository-wide line-ending normalization or `.gitattributes` change; no
  re-review of OT06 behavior; no target-runtime PHP or staging work (OT10).

## Independence And Scope

The fix handoff and both package handoffs were treated as untrusted claims. This
session read the accepted phase-8 record, the OT07 and OT06 packages, the owner
disposition and fix handoff, the coordinator, phase map, `docs/STATUS.md`, and
the full documentation diff, then independently re-measured every recorded value
from the committed objects.

No product file, test, fixture, package status, handoff, coordinator file, or
earlier review record was edited. The only file written is this record. No
branch was created, switched, merged, or moved; no commit was made. No browser,
live site, staging database, or production write was used.

The worktree carried eight modified documentation files (`AGENTS.md`,
`README.md`, `docs/STATUS.md`, `docs/plan/README.md`,
`docs/plan/owner-tool/next-steps.md`, both package files, and
`docs/plan/prompts/phase-map.md`), the untracked original phase-8 record, and
the pre-existing untracked `.cloud-attachments/` directory (not read, changed,
or attributed). `git diff b23d7dd -- src deployed tests` is empty, so the entire
uncommitted change set is documentation; it is the FIX-1 fix plus its status
propagation, not unrelated drift.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD`, `git rev-parse --short HEAD`, `git status --porcelain` | `owner-tool-integration` at `b23d7dd`; 8 modified docs, untracked phase-8 record, untracked `.cloud-attachments/` |
| `git log --oneline -6` | `b23d7dd` on top of `8f1d7e5`; package base unchanged |
| `git diff --quiet b23d7dd -- src deployed tests` | No output: production and test files identical to the reviewed commit |
| `git show b23d7dd:<path> \| wc -lc` (11 files) | Reproduces every recorded line/byte count below |
| `git show b23d7dd:<path> \| sha256sum` (15 files) | Reproduces every recorded hash in both handoffs |
| `git cat-file -s b23d7dd:<path>` (15 files) | Independent byte sizes equal every recorded `wc -c` value |
| `git diff --numstat 8f1d7e5..b23d7dd -- <files>` | `admin 5/5`, `context-card 110/0`, `context-form 187/0`, `context-panel 249/0`, `context-workflow.css 94/0`, `contexts 244/0`, `controller 46/9`, `state 48/0`, `context-migration 5/3`, `owner-tool 284/3`; matches the handoff table |
| `git show 8f1d7e5:<file> \| wc -lc` | Base sizes match the Gate 1 plan (controller 548/20185, state 149/4914, admin 1089/63495, owner-tool 906/38315, context-migration 361/19735) |
| `grep -c $'\r'` on the committed-checkout copies | `0` for controller, state, `admin_questions.php`, `tests/owner-tool.js`, `cbt.php`: the checked-out content is LF, so the recorded LF basis is truthful |
| CRLF reconstruction probe (`sed 's/$/\r/'`) | Reproduces the stated prior values: controller 585/22338/`098352d9…`, state 197/7714/`3c1e40f6…`, owner-tool 1187/54796/`38b05a93…`, cbt.php 1009/45573/`1e093cc4…`; admin CRLF is 1089/64903/`8b75b331…`, so the fix's claim that the prior admin value matched neither LF nor CRLF is accurate |
| Exhaustive 64-hex sweep of both handoff documents | OT07 doc: 11 unique hashes, all resolving to committed files; OT06 doc: 5 unique hashes, all resolving. No orphan or unexplained hash |
| Sweep for the superseded values (`098352d9`, `3c1e40f6`, `38b05a93`, `1e093cc4`, `da502da3`, 22338, 7714, 64807, 54796, 45573) | Surviving occurrences are confined to explicitly labelled prior/replaced statements in the fix handoff and OT06 basis note; no current claim uses them |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 47 PASS, 0 FAIL |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 4 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | PASS: source, anchors, counts, and 7 output hashes match |
| `php -v` and the PHP suites | **Not run**: `php: command not found` on this host, reproducing the original review's limitation. Documentation-only fix, so this is not a closure gate |
| `deployed/admin_questions.php:1083-1086` inspection | Still includes the context stylesheet and all four context modules plus `controller.js` at cache-bust `2.2.0`; deployment path intact and unchanged |

## FIX-1 Closure Verification

**Closure criteria: met.** Every measurement in the OT07 handoff blocks
(`ot-07-owner-context-workflow.md:97-104` sizes, `:136-150` hashes) and the OT06
`cbt.php` hash (`ot-06-candidate-group-delivery.md:113`) equals the committed
`b23d7dd` output, on a stated LF basis.

| File | Base lines/bytes | + / − | Recorded final lines/bytes | Measured | Recorded SHA-256 | Measured |
|---|---:|---:|---:|---:|---|---|
| `src/owner-tool/controller.js` | 548 / 20185 | +46 / −9 | 585 / 21753 | 585 / 21753 | `48e75ed8…` | match |
| `src/owner-tool/state.js` | 149 / 4914 | +48 / −0 | 197 / 7517 | 197 / 7517 | `5dc67c62…` | match |
| `deployed/admin_questions.php` | 1089 / 63495 | +5 / −5 | 1089 / 63814 | 1089 / 63814 | `d2439154…` | match |
| `src/owner-tool/contexts.js` | new | +244 / −0 | 244 / 9038 | 244 / 9038 | `06c37d06…` | match |
| `src/owner-tool/context-form.js` | new | +187 / −0 | 187 / 6648 | 187 / 6648 | `a32294ce…` | match |
| `src/owner-tool/context-card.js` | new | +110 / −0 | 110 / 4449 | 110 / 4449 | `80813a84…` | match |
| `src/owner-tool/context-panel.js` | new | +249 / −0 | 249 / 9239 | 249 / 9239 | `5eec3d8e…` | match |
| `src/owner-tool/context-workflow.css` | new | +94 / −0 | 94 / 1411 | 94 / 1411 | `850d5b14…` | match |
| `tests/owner-tool.js` | 906 / 38315 | +284 / −3 | 1187 / 53609 | 1187 / 53609 | `c82e419f…` | match |
| `tests/context-migration.js` | 361 / 19735 | +5 / −3 | 363 / 19934 | 363 / 19934 | `18815e2c…` | match |

Release B dependency values also reproduce: `deployed/cbt.php` 1009 / 44564 /
`8b08b6e5…`, `cbt_candidate_selection.php` `8786578a…`,
`cbt_candidate_repository.php` `21254c1c…`, `src/cbt/context-render.js`
`5a01e8cb…`, `src/cbt/context.css` `429fb27e…`.

The recorded LF basis is present in both handoffs, is factually correct (zero CR
bytes in the checked-out files, verified hashes equal the committed blobs), and
the prior-value disclosure matches the CRLF reconstruction exactly. No alternate
value is being asserted in place of a committed value; the alternate-value clause
is therefore unused rather than used to mask a mismatch.

**Required evidence: present.** The fix handoff
(`ot-07-owner-context-workflow.md:205-257`) contains the `wc -lc` and `sha256sum`
command output, the corrected lines in both handoffs, and the corrected value
mapping. The corrections in the diff are limited to the three wrong sizes, the
four wrong hashes, the basis statements, and status text; no other recorded
measurement was altered.

**Non-goals honoured.** `git diff b23d7dd -- src deployed tests` is empty and no
`.gitattributes` change or line-ending normalization exists in the diff. OT06
behavior was not re-reviewed. No PHP/staging work was attempted.
`NOTE-1` was not changed, as the disposition required.

## Adversarial Probe (derived from the closure criteria)

The frozen contract is a measurement-identity claim, so the probe attacks the
identity claim rather than unrelated behavior:

1. **Independent byte-size tool.** `git cat-file -s` reports the blob size from
   Git's own object header, bypassing `wc -c` entirely. It equals every recorded
   byte count, including the three corrected values and all previously correct
   values (controller 21753, state 7517, admin 63814, contexts 9038,
   context-form 6648, context-card 4449, context-panel 9239, css 1411,
   owner-tool 53609, context-migration 19934, cbt.php 44564). Result: **pass**.
2. **Line-ending basis falsification attempt.** Reconstructing the CRLF form from
   the committed LF blob reproduces the exact prior wrong values the disposition
   named for controller, state, owner-tool, and `cbt.php`, and does not reproduce
   the prior admin value (64807 / `da502da3…`), matching the fix's own account.
   This confirms the LF basis is the real cause rather than a plausible story.
   Result: **pass**.
3. **Orphan-claim sweep.** Every 64-hex string in either handoff resolves to a
   committed file; no hash is left unattributed, and no recorded size lacks a
   corresponding file. Result: **pass**.
4. **Regression probe from the fix.** Because the fix is documentation-only, any
   behavioral drift would appear as a non-empty production diff or changed
   baseline counts. Both are absent: `src/deployed/tests` are byte-identical to
   `b23d7dd`, and runner 47 + 2 PENDING, unit 145, owner-tool 47,
   context-migration 13, cbt-context 4, and the 7 extract-bank hashes all
   reproduce the reviewed values. Result: **pass**.

## Acceptance Coverage

OT07 acceptance was established by the original phase-8 review against content
that is now proven byte-identical to the reviewed commit, so no acceptance row
changes state. This session re-executed the JS baseline and Release B suites
listed above (all PASS), re-confirmed the deployment include path
(`admin_questions.php:1083-1086`), and re-confirmed the production modules are
unmodified. The PHP server suites and real-browser run remain unavailable here
(`php` absent; no browser check), exactly as recorded in the original review and
deferred to OT10; the fix is documentation-only, so they are not closure gates.

## Per-File Measurements, Responsibility, And Deployment

Responsibilities were re-read in the unmodified production modules, deployment
inclusion was re-read in `deployed/admin_questions.php:1082-1086`, and no module
is orphaned.

| File | Verified responsibility | Deployment inclusion | Production-path test evidence |
|---|---|---|---|
| `src/owner-tool/controller.js` | Narrow panel creation, pending resolution, linked-save guard, full Reset | `admin_questions.php:1086` | `node tests/owner-tool.js` exercises the real module in the VM harness |
| `src/owner-tool/state.js` | Additive context and item-link validation | `admin_questions.php:1084` | `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | Asset includes and `2.2.0` cache-bust only | the page itself | `node tests/context-migration.js`, `node tests/owner-tool.js`; `php -l` not runnable here |
| `src/owner-tool/contexts.js` | Pure context model, targets, slots, fingerprints, link/validation rules | `admin_questions.php:1085` | `node tests/owner-tool.js` |
| `src/owner-tool/context-form.js` | Native context-form prefill/read/prepare/reset adapter | `admin_questions.php:1085` | `node tests/owner-tool.js` |
| `src/owner-tool/context-card.js` | Editable context card DOM | `admin_questions.php:1085` | `node tests/owner-tool.js` |
| `src/owner-tool/context-panel.js` | Review/create/update orchestration and pending context resolution | `admin_questions.php:1086` | `node tests/owner-tool.js` |
| `src/owner-tool/context-workflow.css` | Panel/card styling | `admin_questions.php:1083` | static include check; visual check deferred to OT10 |

**Approvals.** The Gate 1 externalize-first plan at
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:74-104` covers exactly this
file set and the form/card split. No line-limit exception is claimed or
required: every existing file is within 100 additions (largest 48 on `state.js`)
and every new module is at or below 250 readable lines
(`context-panel.js` 249). The `b23d7dd` checkpoint remains owner-requested and
was neither created nor amended by this session.

**Excluded artifacts.** Supplied root SQL (`questions.sql`, `subjects.sql`,
`exam_category.sql`, `questions1.sql`) and their unchanged archive copies;
`db_conn.php`; `archive/` migration docs and live sources; unchanged fixtures;
legacy bookmarklet sources and generated `src/bookmarklet.js`; untracked
`src/bookmarklet.min.js` (absent); `deployed/cbt_practice.php` and
`practice_title` (outside remaining cycle scope); the seven OT06 delivery files
as dependency scope; the untracked `.cloud-attachments/` directory (not read or
attributed); and both phase-8 review records themselves (evidence, not
production).

## Findings

### FIX-1 — CLOSED

The exact defect is corrected. The three wrong byte counts and four wrong hashes
named in the disposition now equal the committed `b23d7dd` output, the OT06
`cbt.php` hash equals the committed LF value, both handoffs state the LF basis,
and the fix handoff carries the required command output. Every other value in
both measurement/hash blocks was independently re-measured and is correct.
Closed under every clause of the frozen contract; not broadened, and no new
vector substituted.

### NOTE-1 — Remains open, non-blocking, outside this authorization

`AGENTS.md` and `README.md` still omit `node tests/cbt-context.js` and
`php tests/cbt-candidate.php` from their command lists (`grep` finds neither
name). The disposition explicitly excluded `NOTE-1` from the FIX-1
authorization and the fix handoff correctly left it untouched, so this re-review
neither closes nor extends it. It remains a documentation-only note the owner may
fold into any later documentation pass.

### New findings

None. No unmet acceptance requirement, regression from the fix, or
security/data-loss risk on a supported path was found.

## Verdict

- **Verdict:** `PASS`
- **Commit readiness:** commit-ready for a user-authorized phase-8 boundary
  commit. The only uncommitted changes are the FIX-1 documentation corrections,
  the status propagation, and the two phase-8 review records; `main` must still
  not advance except by an authorized release boundary, and it is not advanced by
  this record.
- **Review status:** closure-focused re-review complete. `FIX-1` is closed;
  `NOTE-1` remains open and non-blocking; no new finding was raised.
- **Findings closed by this re-review:** `FIX-1`.
- **Findings still open:** `NOTE-1` (documentation only, no disposition
  required, not a commit gate).
- **Previously closed findings:** none affected.
- **Status propagation still pending:** the package, coordinator, phase map,
  `AGENTS.md`, `README.md`, and `docs/STATUS.md` currently read "`FIX-1` fixed,
  pending closure-focused re-review". This read-only session may not edit them;
  the next non-review session must record the closure and set the phase-8 review
  checkpoint before OT08 work proceeds.
- **Pending user decision:** accept this PASS and authorize the phase-8
  boundary commit; `NOTE-1` may be fixed then or later.

## Exact Recommended Next Action

Accept this PASS, authorize the phase-8 boundary commit of the documentation
changes plus both phase-8 review records, and update the package, coordinator,
phase map, and entry-point status lines to record `FIX-1` closed. Do not commit
from a review session, do not rewrite the immutable review records, and do not
begin OT08 implementation; OT08 Gate 1 may start once the boundary state is
recorded.

NEXT COMMAND: Commit the Phase 8 boundary, then run @docs/plan/prompts/phase-session.md phase 9
