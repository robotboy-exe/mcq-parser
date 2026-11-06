# Owner Tool 2026-11 Phase 8 Review

- **Date:** 2026-11-05
- **Reviewer:** Buffy (Codebuff), independent review session
- **Package:** OT07 — Owner Context Workflow (Release B), with the OT06
  candidate-delivery dependency included in the same tip
- **Scope:** read-only `owner-tool-integration` at `b23d7dd`
  (`feat: add context delivery and owner workflow`) against the OT07 per-file
  package base `8f1d7e5`. OT06 was light-reviewed at OT07 Gate 1 and is
  re-checked here as the Release B production boundary. The worktree was clean
  at review start except the pre-existing untracked `.cloud-attachments/`,
  which was not read, changed, or attributed to scope.
- **Record:** original phase-8 review. No earlier phase-8 record existed to
  overwrite, close, or re-review.

## Independence And Scope

This session treated the OT07 and OT06 handoffs as untrusted claims and read the
active phase map, coordinator, `INTENT.md`, `docs/AGENTS.md`, both package
contracts, the OT06 reader/writer audit, the implementation, the tests, the review
register, and the relevant prior phase-5/phase-6 record excerpts. It ran the available
baseline and package probes, inspected the production modules and their
deployment path, and added adversarial probes at the state, link-assignment,
and numbering boundaries.

No product file, test, fixture, package status, handoff, or coordinator file was
edited. The only file written is this record. No branch was created, switched,
merged, or moved; no commit was made. No browser, live site, staging database,
production write, delete, or cleanup action was used. The existing `b23d7dd`
checkpoint commit was not created by this session and was not changed.

OT06 files (`deployed/cbt.php`, `deployed/cbt_candidate_selection.php`,
`deployed/cbt_candidate_repository.php`, `src/cbt/context-render.js`,
`src/cbt/context.css`, `tests/cbt-candidate.php`, `tests/cbt-context.js`) are
dependency scope, not OT07 production additions. OT07 adds the owner-tool
context modules, the controller/state/admin wiring, and their tests.

### Scope observations

- `INTENT.md` requires comprehension/cloze parsing, but OT02 explicitly defers
  it ("Do not implement comprehension or cloze parsing yet"), and OT08/OT09 own
  the `parsePaste()` context orchestration. Parser `2.1.0` has no context
  recognition, so Release B's context flow is the intended manual card workflow;
  the missing paste recognition is not an OT07 defect.
- The OT07 package's "State extension" prose says the state gains `contexts[]`
  (`docs/plan/owner-tool/ot-07-owner-context-workflow.md:17`), but
  `src/owner-tool/state.js` at the `8f1d7e5` base already requires
  `contexts[]`; OT07 adds context validation and item link-field validation.
  This is wording, not behavior.
- A stored state written before `contexts[]` was required (the pre-OT05 tool)
  is rejected as `corrupt` and only recoverable by Reset or a full re-paste.
  That behavior is in the `8f1d7e5` base, not this diff, and no owner-tool state
  is deployed on the published `main` baseline. It matters only if Release A is
  deployed and used before Release B; OT10 should deploy the context migration
  and Release B together or accept that a pre-OT05 local queue must be
  re-pasted.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD`, `git rev-parse --short HEAD`, `git status --porcelain` | On `owner-tool-integration` at `b23d7dd`; only `?? .cloud-attachments/` |
| `git log --oneline -12` | `b23d7dd feat: add context delivery and owner workflow` on top of `8f1d7e5`; OT07 per-file base confirmed |
| `git diff --stat 8f1d7e5..b23d7dd` and `git diff --numstat` | 29 files, +2827/−193; OT07 production additions reproduce the Gate 1 plan exactly |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 47 PASS, 0 FAIL (real `state.js`, `controller.js`, and the four context modules executed in a VM harness) |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 4 PASS, 0 FAIL (real `src/cbt/context-render.js`) |
| `node tools/extract-bank.js --check` | PASS: source, anchors, counts, and 7 output hashes match |
| `php tests/context-lib.php`, `context-admin.php`, `context-preflight.php`, `php-render.php`, `cbt-candidate.php`; `php -l` | **Not run**: `php: command not found` (exit 127) on this host. The handoff's PHP 8.3.16 results are not independently reproduced here |
| `git show 8f1d7e5:<file> \| wc -lc` | Base lines/bytes match the Gate 1 plan: controller 548/20185, state 149/4914, admin 1089/63495 |
| `wc -lc` and `sha256sum` on final files | Verified final lines/bytes and hashes in the table below; four OT07 handoff hashes and three handoff byte counts do not reproduce (FIX-1) |
| CRLF-vs-LF hash probe | The claimed controller, state, and `tests/owner-tool.js` hashes reproduce only after converting the committed LF bytes to CRLF; the claimed `admin_questions.php` hash matches neither form |
| `grep` for `.submit()`, `requestSubmit`, `activate_context`, `delete_context` in `src/owner-tool/` | No matches (no automatic POST or activation path) |
| Adversarial link probe: two cards claim question 2 | `syncLinks` reports conflict `[2]`; the linked item is blocked with the duplicate-target message |
| Adversarial cloze probe: 2 targets, 1 `[[gap:5]]` token | First target gets slot `5`; second target is blocked with the missing-slot message |
| Adversarial non-sequential numbering: items 11–14, targets `13,11,12` | Positions `2,3,1` per typed order; item 14 standalone and cleared |
| Adversarial standalone-before/between: items 1–4, targets `2,3` | Only items 2 and 3 linked, positions `1,2`; items 1 and 4 cleared |
| Stray-target probe: targets `1,9,2`, item 9 absent | Items 1 and 2 get positions `1,2`; the stray target is silently ignored. Server activation still rejects a member-count mismatch, so this is a residual usability risk, not a data-integrity defect |
| Pre-`contexts[]` stored state probe | `readState` returns `corrupt` / `contexts is not a list`; behavior is inherited from the `8f1d7e5` base |
| `grep`/inspection of server flash text | `Context #N created. Link its members, then activate it.` and `Context #N updated. It is inactive until revalidated.` match the JS patterns exactly (`deployed/admin_context_actions.php:82,105`; `src/owner-tool/context-panel.js:8-9`) |

The owner-tool harness uses a hand-authored DOM/form fixture, not a real browser;
the form field names and IDs it binds are the same names and IDs rendered by
`deployed/admin_question_context_fields.php` and
`deployed/admin_context_management.php`. No browser runtime check was available
here, and browser/staging verification remains OT10 as the package states.

## Acceptance Coverage

| Acceptance check | Review result |
|---|---|
| Singular context | **PASS**: one card created, filled, submitted, bound to ID 77, linked through `contexts[0]`, and saved (`tests/owner-tool.js:702-735`) |
| Multiple contexts | **PASS**: two cards bind IDs 77/78 and keep their own members and positions (`tests/owner-tool.js:737-760`); non-sequential source numbers also map correctly in the adversarial probe |
| Standalone item | **PASS**: `context_id`, `context_position`, and `context_slot` are cleared for untargeted items (`tests/owner-tool.js:762-776`; `src/owner-tool/context-form.js:118-129`); before/between/after all verified |
| Context edit | **PASS**: editing a saved card sets `stale`, disables the native question save button, and refuses submission until a successful context update clears it (`tests/owner-tool.js:778-800`; `src/owner-tool/context-panel.js:100-125`; `src/owner-tool/controller.js:552-555`) |
| Native context success | **PASS**: exact create flash binds the returned ID once; a repeated flash cannot bind again; near-miss and duplicate IDs do not bind (`src/owner-tool/context-panel.js:175-224`) |
| Native question success | **PASS**: exact question flash advances one item and the context card remains; the next member keeps the context (`tests/owner-tool.js:702-735`) |
| Error/ambiguous reload | **PASS**: rejected save clears the marker without binding or advancing; ambiguous reload clears the marker with a check-before-retry warning (`tests/owner-tool.js:802-834`; `src/owner-tool/controller.js:301-340`) |
| Key-only paste | **PASS**: queue, queue identity, position, edits, and context cards are retained; only the answer key and tick change (`tests/owner-tool.js:538-553,836-852`) |
| Reset | **PASS**: new state replaces queue, contexts, metadata, key, pending marker, native question fields, and context link fields; `ocrQueue`, `ocrMeta`, and `ansKey` are untouched (`tests/owner-tool.js:670-700`; `src/owner-tool/controller.js:493-503`) |
| Activation | **PASS by inspection and server contract**: no JS activation path exists; activation is a separate native form action that validates completeness (`deployed/admin_context_actions.php:135-147`; `deployed/context_activation_validation.php:26-110`). The PHP activation suite was not runnable here |
| Excluded behavior | **PASS**: no auto-create, auto-save, auto-activate, `fetch`, or `.submit()` path in the shipping owner-tool sources; the native submit is never intercepted (`tests/owner-tool.js:1159-1170`) |

## Per-File Measurements, Responsibility, And Deployment

| File | Base lines/bytes | Additions/deletions | Final lines/bytes | SHA-256 (committed LF) | Responsibility | Deployment / direct test |
|---|---:|---:|---:|---|---|---|
| `src/owner-tool/controller.js` | 548 / 20185 | +46 / −9 | 585 / 21753 | `48e75ed8893186b2ebd770ffc2eec4d4a0649f1366d3398f686c4fe3bd964c73` | Panel creation, pending resolution, linked-save guard, full Reset | Loaded by `deployed/admin_questions.php:1086`; `node tests/owner-tool.js` |
| `src/owner-tool/state.js` | 149 / 4914 | +48 / −0 | 197 / 7517 | `5dc67c62a265d62a4f4818018dda409cb30d7edbbd3941356c53f6ed19add0c1` | Additive context and item-link validation | Loaded by `deployed/admin_questions.php:1084`; `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | 1089 / 63495 | +5 / −5 | 1089 / 63814 | `d24391548bd8d2191b202b84daec57a6ec8421d316d8d1cc626cda8cef57eb15` | Asset includes and `2.2.0` cache-bust only | Includes the context CSS/modules at lines 1083–1086; static include check and `node tests/owner-tool.js`; `php -l` not rerun here |
| `src/owner-tool/contexts.js` | new | +244 / −0 | 244 / 9038 | `06c37d066dee3b4e565ebc25cd6b81e5bcae1e8a006f2251a7dce294eb702191` | Pure context model, targets, slots, fingerprints, link/conflict/validation rules | Loaded by the panel path; `node tests/owner-tool.js` |
| `src/owner-tool/context-form.js` | new | +187 / −0 | 187 / 6648 | `a32294ce742c3fdf8344decffd41282bde61b25b80651dcd99d695402ab8e7df` | Native context-form prefill/read/prepare/reset adapter | Loaded at `admin_questions.php:1085`; `node tests/owner-tool.js` |
| `src/owner-tool/context-card.js` | new | +110 / −0 | 110 / 4449 | `80813a847d2edc731e3ecb1320c9f4df94dc289b7808206f5b60f21fbf76ee3e` | Editable context card DOM | Loaded at `admin_questions.php:1085`; `node tests/owner-tool.js` |
| `src/owner-tool/context-panel.js` | new | +249 / −0 | 249 / 9239 | `5eec3d8eb8fc57779155c1808064e0655239e40e1f5545577167f7f912cdebe6` | Review/create/update orchestration and pending context resolution | Loaded at `admin_questions.php:1086`; `node tests/owner-tool.js` |
| `src/owner-tool/context-workflow.css` | new | +94 / −0 | 94 / 1411 | `850d5b1409a530c7575adb0364488c1c535fff3505408ec5d06e3bdc082b82a9` | Panel/card styling | Loaded at `admin_questions.php:1083`; visual check deferred to OT10 |
| `tests/owner-tool.js` | 906 / 38315 | +284 / −3 | 1187 / 53609 | `c82e419fea382bd560607f365727cbd272c11a723ce50e51913533d03132722b` | Release B owner-tool evidence | Executes the real modules; not production |
| `tests/context-migration.js` | 361 / 19735 | +5 / −3 | 363 / 19934 | `18815e2cc3a957ceaa243129d7879c1174025c81d93074c779a617f4d1fd89f7` | Static Release B delivery checks | Static; not production |

All existing files are within the 100-addition limit; every new production
module is at or below 250 readable lines (the largest, `context-panel.js`, is
249). No Gate 1 line-limit exception is required. The Gate 1 plan at
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:74-104` anticipated exactly
these files and the form/card split. The deployment path includes every module
and the stylesheet, and no module is orphaned.

**Approvals:** the Gate 1 externalize-first plan at
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:74-104` covers this file
set and the form/card split; no line-limit exception is required or claimed.
The `b23d7dd` checkpoint commit is documented as owner-requested in the package
handoff; this review neither created nor amended it.

### Release B dependency measurements (OT06, light-reviewed at Gate 1)

| File | Final lines/bytes | SHA-256 (committed LF) |
|---|---:|---|
| `deployed/cbt.php` | 1009 / 44564 | `8b08b6e5656a8d6bda60a6f3051bd452520e50fdbdf87c32dfbb2fcfadfce35f` |
| `deployed/cbt_candidate_selection.php` | 214 / 8099 | `8786578a817998a7955562e87ec72dd0feb58f214c42cc407bc258ee5727ce6f` |
| `deployed/cbt_candidate_repository.php` | 213 / 8702 | `21254c1c38f1a86bac0b821666eaa116ee782fecb316bd4f03800d3d2cb9c450` |
| `src/cbt/context-render.js` | 97 / 3271 | `5a01e8cbd79e7fd5388966751a9f7eb8c895128bfaafbfd264e69f9008f4096d` |
| `src/cbt/context.css` | 71 / 1166 | `429fb27e8c9c727f34d9003142f69800d1f4c6ad064dd0e935edca642eab8a82` |

The OT06 selection/repository PHP suite (7 PASS claimed) could not be executed
here. Inspection confirms whole-unit selection, position order, pool matching,
inactive-member delivery, snapshot revalidation, safe DOM rendering, the
context map emitted once, and suppression of the dead detail link for linked
rows. The audit's constraint that every one of the seven `cbt.php` availability
and selection reads must become context-aware is met: the AJAX categories/years
branches, the page-load category/year lists, the exact pool probe, and the exam
payload all delegate to the repository, and the POST category/year validation
maps are built from those same lists. No availability path remains
context-blind. (`deployed/cbt_candidate_selection.php:5-214`;
`deployed/cbt_candidate_repository.php:7-213`; `deployed/cbt.php:164-176,733-738,806,908,933-937`).
`node tests/cbt-context.js` passes 4/4 against the real renderer.

## Findings

### FIX-1 — The OT07 handoff hashes and two byte counts do not reproduce from the committed tree

**Exact defect.** The OT07 handoff records final sizes and SHA-256 values that do
not match the committed blobs:

| File | Handoff value | Committed value |
|---|---|---|
| `src/owner-tool/controller.js` | 585 / 22338, `098352d9…` | 585 / 21753, `48e75ed8…` |
| `src/owner-tool/state.js` | 197 / 7714, `3c1e40f6…` | 197 / 7517, `5dc67c62…` |
| `deployed/admin_questions.php` | 1089 / 64807, `da502da3…` | 1089 / 63814, `d2439154…` |
| `tests/owner-tool.js` | `38b05a93…` | `c82e419f…` |

The handoff references are
`docs/plan/owner-tool/ot-07-owner-context-workflow.md:97-99` (sizes) and
`:136-145` (hashes). The controller, state, and test hashes reproduce only after
converting the committed LF bytes to CRLF, so those are line-ending artifacts,
not a claim about different content. The `admin_questions.php` hash matches
neither LF (`63814` bytes) nor a full CRLF conversion (`64903` bytes); the
recorded `64807` bytes also lies between those two values, so that value is not
explainable as a simple line-ending transform. The OT06 handoff's `cbt.php`
hash likewise reproduces only from the CRLF form
(`docs/plan/owner-tool/ot-06-candidate-group-delivery.md:113`).

**Supported operating preconditions.** A read-only checkout of the reviewed
commit; no line-ending conversion is applied by the reviewer; the handoff is the
record used to verify artifact identity before commit/release.

**Closure criteria.** Every final line/byte count and SHA-256 recorded in the
OT07 handoff's measurement and hash blocks, and the OT06 `cbt.php` hash, must
equal `wc -lc` and `sha256sum` output from the committed `b23d7dd` blobs (or the
handoff must state both the LF value and the exact line-ending basis of any
alternate value).

**Required evidence.** The fix handoff must include the command output
(`git show b23d7dd:<path> | wc -lc`, `sha256sum` on the committed working-tree
files) and the corrected lines in both handoffs.

**Non-goals / deferred checks.** No product, test, behavior, or acceptance
change; no repository-wide line-ending normalization or `.gitattributes` change;
no re-review of OT06 behavior; no target-runtime PHP/staging work, which remains
OT10.

**Severity rationale.** The handoff is required evidence, but the reviewed
content and behavior are correct and independently measured above. This is not
a commit-blocking behavior defect; it requires an owner disposition because a
required evidence artifact is inaccurate.

### NOTE-1 — Entry-point command lists omit the two new Release B suites

`AGENTS.md:29` lists the runner, unit, owner-tool, context-migration,
context-lib, context-admin, and context-preflight suites, and `README.md:15-25`
lists the same set in its quick start, but neither lists
`node tests/cbt-context.js` (4 PASS) or `php tests/cbt-candidate.php` (7 PASS
claimed), both added in `b23d7dd`. `docs/AGENTS.md:182-192` does list them, so
the detailed contract is current while the entry-point commands are not.
Documentation only; no behavior impact. It may be corrected in the same
documentation pass as FIX-1 without a separate disposition.

## Verdict

**PASS WITH ACCEPTED FINDINGS.**

No behavior blocker, acceptance failure, regression, guardrail breach, unsafe
path, line-limit breach, monolithic production addition, or copied-path test
claim was found. The OT07 acceptance rows are covered by executable owner-tool
tests that run the real shipping modules, and the release-critical server flash
contract matches exactly. The OT06 dependency remains behaviorally consistent
with its Gate 1 light review by inspection and by the passing renderer suite;
its PHP suite could not be executed on this host.

**Review status:** original rigorous Release B review complete; no re-review was
requested or written.

**Commit readiness:** The reviewed tip is the owner-requested machine-transfer
checkpoint commit `b23d7dd`; it is not ready to be treated as the phase-8 close
baseline or advanced to `main` until FIX-1 is dispositioned. NOTE-1 does not
block. This review did not commit, and the immutable record does not change the
existing commit.

**Findings closed by a re-review:** none; this is the original phase-8 record.

**Pending user decision:** disposition of FIX-1 (`fix`, `reject`, `accept risk`,
`defer`, or `change requirement`). No dependent package (OT08) may start while
the phase-8 review has an unresolved `FIX` without that disposition.

## Excluded Artifacts

Supplied root SQL (`questions.sql`, `subjects.sql`, `exam_category.sql`,
`questions1.sql`) and their unchanged archive copies; `db_conn.php`; the
`archive/` migration docs and live sources; unchanged fixtures; the legacy
`bookmarklet` sources and generated `src/bookmarklet.js` (not touched; no
untracked `src/bookmarklet.min.js` exists); `deployed/cbt_practice.php` and
`practice_title` (outside the remaining cycle scope); OT06 delivery files listed
above as dependency scope; and the untracked `.cloud-attachments/` directory.

## Recommended Next Action

Record the owner's disposition for FIX-1 before any phase-8 commit-readiness
change or OT08 start. NOTE-1 is documentation-only and may be fixed with FIX-1
or accepted separately.

`NEXT COMMAND: @docs/plan/prompts/finding-disposition.md phase 8 OT07 FIX-1`
