# OT07 — Owner Context Workflow

- **Status:** done 2026-11-05; Release B review PASS WITH ACCEPTED FINDINGS; `FIX-1` closed by closure-focused re-review 2026-11-06; phase 8 boundary committed; `NOTE-1` non-blocking
- **Depends on:** OT06
- **Blocks:** OT08, OT09
- **External gate:** none beyond OT05/OT06 contracts
- **Release:** B
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Extend the manual owner tool so an administrator can review, create, link, and
activate one or several shared contexts without any automatic save.

## State extension

The versioned owner state gains `contexts[]`; each parsed question may carry a
local context reference, position, and slot. Each context records editable type,
title, text, target source numbers, expected count, server ID, and whether the
saved draft is stale after an edit.

## Work

1. Add a context review panel with one editable card per context; a one-context
   paste uses the same array shape as a multi-context paste.
2. Allow standalone questions before, between, and after context groups.
3. Prefill the native context form from the selected card and dispatch preview
   events.
4. Use explicit administrator clicks and the native PRG action to create or
   update each inactive context draft.
5. Extend the pending-submission state machine to distinguish context and
   question actions and bind the exact returned context ID once.
6. Mark a saved context draft stale whenever its local editable fields change;
   block linked question saves until the administrator updates it.
7. Fill context ID, position, and slot into the native question form for linked
   items and clear them for standalone items.
8. Advance question items only after exact native question success.
9. Keep final context activation a separate explicit native action after all
   members are saved and reviewed.
10. Add DOM/storage/PRG tests for reload, Reset, key-only paste, context edits,
    multiple groups, and standalone clearing.

## Acceptance

| Check | Expected |
|---|---|
| Singular context | Create/link/review path works through `contexts[0]` |
| Multiple contexts | Each receives its own server ID and correct members |
| Standalone item | Native context fields cleared before save |
| Context edit | Saved draft becomes stale and linked save is refused |
| Native context success | Exact pending card binds returned ID once |
| Native question success | Advances one item; context card remains |
| Error/ambiguous reload | No false ID binding or queue advance |
| Key-only paste | Queue and contexts retained; answer key replaced |
| Reset | New state cleared explicitly; legacy keys untouched |
| Activation | Separate administrator action; incomplete context rejected |
| Excluded behavior | No automatic context creation, activation, or question save |

## Guardrails

- Do not post a context or question automatically after parsing.
- Do not reuse one server context ID for a different local context.
- Do not leave context fields populated for standalone questions.
- Do not activate a context from JavaScript without the native human action.
- Do not start OT08.

## Gate 1 externalize-first plan

Package base: `8f1d7e5` for OT07 production files. The uncommitted OT06
worktree is a prerequisite, but OT07 does not change the OT06 candidate files.

| Production file | Base lines/bytes | Planned additions | Limit | Responsibility/direct test |
|---|---:|---:|---:|---|
| `src/owner-tool/controller.js` | 548 / 20185 | ≤100 | 100 additions | Narrow panel/pending/save wiring; `node tests/owner-tool.js` |
| `src/owner-tool/state.js` | 149 / 4914 | ≤100 | 100 additions | Additive context validation; `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | 1089 / 63495 | ≤100 | 100 additions | Asset includes/cache-bust; PHP lint and `node tests/context-migration.js` |
| `src/owner-tool/contexts.js` | new | — | 250 lines | Pure context model/links/validation; `node tests/owner-tool.js` |
| `src/owner-tool/context-form.js` | new | — | 250 lines | Native context-form adapter; `node tests/owner-tool.js` |
| `src/owner-tool/context-card.js` | new | — | 250 lines | Editable context card DOM; `node tests/owner-tool.js` |
| `src/owner-tool/context-panel.js` | new | — | 250 lines | Workflow orchestration; `node tests/owner-tool.js` |
| `src/owner-tool/context-workflow.css` | new | — | 250 lines | Panel/card styles; static include check, visual check deferred to OT10 |

The extraction boundary keeps pure context rules in `contexts.js`, native-form
adaptation in `context-form.js`, card DOM in `context-card.js`, and orchestration
in `context-panel.js`; existing files retain wiring, validation, and includes.
The split into form and card modules was required to keep every new production
module under the 250-line limit. No minification, generated source, or copied
production path is used. Excluded artifacts: none. The untracked legacy
`src/bookmarklet.min.js` is outside OT07 and was not touched.

## Handoff

Externalize-first handoff:

| Production file | Additions/deletions | Final lines/bytes | Responsibility | Deployment/test evidence |
|---|---:|---:|---|---|
| `src/owner-tool/controller.js` | +46 / -9 | 585 / 21753 | Load panel, resolve pending actions, guard linked saves, full Reset | Loaded by `admin_questions.php`; `node tests/owner-tool.js` |
| `src/owner-tool/state.js` | +48 / -0 | 197 / 7517 | Additive context state validation | Loaded by `admin_questions.php`; `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | +5 / -5 | 1089 / 63814 | Asset includes and `2.2.0` cache-bust | `php -l`; `node tests/context-migration.js`; `node tests/owner-tool.js` |
| `src/owner-tool/contexts.js` | +244 / -0 | 244 / 9038 | Pure context model, fingerprints, link/conflict/validation logic | Loaded by `context-panel.js`; `node tests/owner-tool.js` |
| `src/owner-tool/context-form.js` | +187 / -0 | 187 / 6648 | Native context-form prefill/read/reset adapter | Loaded by `context-panel.js`; `node tests/owner-tool.js` |
| `src/owner-tool/context-card.js` | +110 / -0 | 110 / 4449 | Editable context card DOM | Loaded by `context-panel.js`; `node tests/owner-tool.js` |
| `src/owner-tool/context-panel.js` | +249 / -0 | 249 / 9239 | Review/create/update orchestration and pending context resolution | Loaded by `controller.js`; `node tests/owner-tool.js` |
| `src/owner-tool/context-workflow.css` | +94 / -0 | 94 / 1411 | Panel/card styling | Loaded by `admin_questions.php`; visual check deferred to OT10 |

All existing production-file additions are within the 100-addition limit, and
every new production file is within 250 readable lines. Excluded artifacts:
none.

```text
Date: 2026-11-05
Result: implemented; local JS/PHP checks PASS; pending rigorous Release B review
State schema revision: cbtOwnerTool:v1 v1; additive contexts[], item
  contextRef/contextPosition/contextSlot, and optional pending kind/localId;
  no version bump
Context PRG lifecycle: explicit card edit/preview -> native context create or
  update form -> exact PRG flash binds the returned ID once; post-save edits
  mark the card stale; no automatic create or activation
Question-link lifecycle: linked items fill context_id/context_position/
  context_slot; standalone items clear them; only the exact question success
  flash advances one item; the context card remains
Single/multiple/standalone tests: node tests/owner-tool.js 47 PASS, including
  one context, multiple contexts, standalone clearing, stale refusal, near-miss
  no-bind, rejected context no-bind, key-only retention, cloze slot assignment,
  missing native context form, and full Reset
Local PHP/browser evidence: 47 runner PASS + 2 PENDING; 145 unit PASS; 47
  owner-tool PASS; 13 context-migration PASS; 4 cbt-context PASS; 13
  context-lib PASS; 19 context-admin PASS; 6 context-preflight PASS; 7
  cbt-candidate PASS; 9 PHP renderer PASS; PHP 8.3 lint PASS. No browser runtime
  check was run; browser/staging remains OT10.
Files changed: src/owner-tool/contexts.js, src/owner-tool/context-form.js,
  src/owner-tool/context-card.js, src/owner-tool/context-panel.js,
  src/owner-tool/context-workflow.css, src/owner-tool/controller.js,
  src/owner-tool/state.js, deployed/admin_questions.php, tests/owner-tool.js,
  tests/context-migration.js, and status/docs updates
Hashes (SHA-256): contexts.js
  06c37d066dee3b4e565ebc25cd6b81e5bcae1e8a006f2251a7dce294eb702191;
  context-form.js a32294ce742c3fdf8344decffd41282bde61b25b80651dcd99d695402ab8e7df;
  context-card.js 80813a847d2edc731e3ecb1320c9f4df94dc289b7808206f5b60f21fbf76ee3e;
  context-panel.js 5eec3d8eb8fc57779155c1808064e0655239e40e1f5545577167f7f912cdebe6;
  context-workflow.css 850d5b1409a530c7575adb0364488c1c535fff3505408ec5d06e3bdc082b82a9;
  controller.js 48e75ed8893186b2ebd770ffc2eec4d4a0649f1366d3398f686c4fe3bd964c73;
  state.js 5dc67c62a265d62a4f4818018dda409cb30d7edbbd3941356c53f6ed19add0c1;
  admin_questions.php d24391548bd8d2191b202b84daec57a6ec8421d316d8d1cc626cda8cef57eb15;
  owner-tool.js c82e419fea382bd560607f365727cbd272c11a723ce50e51913533d03132722b;
  context-migration.js 18815e2cc3a957ceaa243129d7879c1174025c81d93074c779a617f4d1fd89f7
Hash basis: values above are `git show b23d7dd:<path>` LF content measured with
  `wc -lc` and `sha256sum`; no line-ending conversion applied. FIX-1 replaced
  CRLF-derived values for controller.js, state.js, and owner-tool.js; the prior
  admin_questions.php value matched neither LF nor CRLF
Open questions: node tools/extract-bank.js --check still has the known
  pre-existing Windows/CRLF pre-2026 output-hash mismatch; target MySQL, browser,
  and staging verification remain OT10; no live/staging DB or destructive write
  was used
Review: PASS WITH ACCEPTED FINDINGS (phase 8); FIX-1 closed by re-review
  2026-11-06
Commit: owner-requested machine-transfer checkpoint before rigorous review
Next: OT08 Gate 1 (phase 9); NOTE-1 remains a non-blocking docs note
```

## FIX-1 Owner Disposition - 2026-11-06

- **Finding:** `FIX-1` from
  [`../reviews/owner-tool-2026-11-phase-8.md`](../reviews/owner-tool-2026-11-phase-8.md).
- **Choice:** `fix`.
- **Rationale:** The owner explicitly selected `fix`. This authorizes one fix
  session against the frozen closure criteria only; it is not a rejection, risk
  acceptance, deferral, or requirement change.
- **Frozen closure contract:** The exact defect is that the OT07 handoff records
  final sizes and SHA-256 values that do not match the committed `b23d7dd`
  blobs: `controller.js` 585 / 22338 / `098352d9...` versus 585 / 21753 /
  `48e75ed8...`; `state.js` 197 / 7714 / `3c1e40f6...` versus 197 / 7517 /
  `5dc67c62...`; `admin_questions.php` 1089 / 64807 / `da502da3...` versus
  1089 / 63814 / `d2439154...`; `tests/owner-tool.js` `38b05a93...` versus
  `c82e419f...`. The OT06 `cbt.php` hash likewise reproduces only from CRLF.
  Supported preconditions: a read-only checkout of `b23d7dd`, no line-ending
  conversion applied by the reviewer, and the handoff is the identity artifact
  used before commit or release. Closure criteria: every final line/byte count
  and SHA-256 recorded in the OT07 handoff's measurement and hash blocks, and
  the OT06 `cbt.php` hash, must equal `wc -lc` and `sha256sum` output from the
  committed `b23d7dd` blobs, or the handoff must state both the LF value and the
  exact line-ending basis of any alternate value. Required evidence: a fix
  handoff with the command output (`git show b23d7dd:<path> | wc -lc`,
  `sha256sum` on the committed working-tree files) and the corrected lines in
  both handoffs. Non-goals: no product, test, behavior, or acceptance change;
  no repository-wide line-ending normalization or `.gitattributes` change; no
  re-review of OT06 behavior; no target-runtime PHP or staging work, which
  remains OT10.
- **Immutable evidence and residual risk:** No review record is changed. The
  review's residual risk stands verbatim: "The handoff is required evidence,
  but the reviewed content and behavior are correct and independently measured
  above. This is not a commit-blocking behavior defect; it requires an owner
  disposition because a required evidence artifact is inaccurate."
- **Effect:** `FIX-1` remains open. One fix session is authorized against the
  frozen checklist; the finding closes only after the fix and a closure-focused
  re-review. OT07 is not commit-ready as the phase-8 close baseline and must
  not be advanced to `main`; OT08 must not start. `NOTE-1` is non-blocking and
  unaffected; it may ride with the same documentation pass but is not part of
  this authorization.
- **Destination:** none; `fix` is not a deferral.
- **Tests:** not run; this disposition changes documentation only.
- **Commit:** deferred.
- **Next:** run the authorized fix session.

## FIX-1 Fix Handoff - 2026-11-06

- **Authorization:** the `fix` disposition above; frozen closure criteria only.
- **Changes (documentation only):** corrected the handoff table sizes for
  `controller.js` (585 / 21753), `state.js` (197 / 7517), and
  `admin_questions.php` (1089 / 63814); corrected the hash block for
  `controller.js`, `state.js`, `admin_questions.php`, and
  `tests/owner-tool.js`; added the LF measurement basis. Every other recorded
  size, byte count, and hash was re-measured and left unchanged because it was
  already correct.
- **OT06 handoff:** corrected `cbt.php` to `8b08b6e5...` and stated the LF
  basis; the other four OT06 hashes were re-measured and are correct. No OT06
  behavior was re-reviewed.
- **Evidence:**

```text
$ git show b23d7dd:<path> | wc -lc
controller.js 585 21753; state.js 197 7517; admin_questions.php 1089 63814;
contexts.js 244 9038; context-form.js 187 6648; context-card.js 110 4449;
context-panel.js 249 9239; context-workflow.css 94 1411; owner-tool.js 1187
53609; context-migration.js 363 19934; cbt.php 1009 44564
$ git show b23d7dd:<path> | sha256sum
controller.js 48e75ed8893186b2ebd770ffc2eec4d4a0649f1366d3398f686c4fe3bd964c73
state.js 5dc67c62a265d62a4f4818018dda409cb30d7edbbd3941356c53f6ed19add0c1
admin_questions.php d24391548bd8d2191b202b84daec57a6ec8421d316d8d1cc626cda8cef57eb15
owner-tool.js c82e419fea382bd560607f365727cbd272c11a723ce50e51913533d03132722b
cbt.php 8b08b6e5656a8d6bda60a6f3051bd452520e50fdbdf87c32dfbb2fcfadfce35f
context-migration.js 18815e2cc3a957ceaa243129d7879c1174025c81d93074c779a617f4d1fd89f7
contexts.js 06c37d066dee3b4e565ebc25cd6b81e5bcae1e8a006f2251a7dce294eb702191
context-form.js a32294ce742c3fdf8344decffd41282bde61b25b80651dcd99d695402ab8e7df
context-card.js 80813a847d2edc731e3ecb1320c9f4df94dc289b7808206f5b60f21fbf76ee3e
context-panel.js 5eec3d8eb8fc57779155c1808064e0655239e40e1f5545577167f7f912cdebe6
context-workflow.css 850d5b1409a530c7575adb0364488c1c535fff3505408ec5d06e3bdc082b82a9
```

  The prior admin value (64807 / `da502da3...`) corresponded to no committed
  LF or CRLF form; the prior CRLF values were controller.js 22338 /
  `098352d9...`, state.js 7714 / `3c1e40f6...`, owner-tool.js 54796 /
  `38b05a93...`, and cbt.php 45573 / `1e093cc4...`.
- **Closure mapping:** all five corrected values equal the committed `b23d7dd`
  output above; every other value in the OT07 measurement and hash blocks
  equals the same output, so both clauses of the closure criterion are met.
- **Not changed:** no product, test, behavior, or acceptance change; no
  `NOTE-1` change; no review-record edit; no line-ending normalization or
  `.gitattributes`.
- **Regression check:** `node tests/runner.js` 47 PASS + 2 PENDING; unit 145
  PASS; owner-tool 47 PASS; context-migration 13 PASS; cbt-context 4 PASS;
  `node tools/extract-bank.js --check` 7 hashes PASS. PHP could not run on the
  fix host (`php: command not found`); this is not a gate for a docs-only fix,
  and the reviewed PASS results stand.
- **Tests:** no new tests; baseline rerun only.
- **Commit:** deferred.
- **Next:** closure-focused re-review of `FIX-1`; OT07 is not commit-ready and
  OT08 must not start until it closes.

## FIX-1 Re-review Closure - 2026-11-06

- **Record:** [`../reviews/owner-tool-2026-11-phase-8-re-review.md`](../reviews/owner-tool-2026-11-phase-8-re-review.md).
- **Verdict:** `PASS`; commit-ready for a user-authorized phase-8 boundary
  commit.
- **Criteria met:** every recorded final line/byte count and SHA-256 in the
  OT07 measurement and hash blocks, and the OT06 `cbt.php` hash, equal the
  committed `b23d7dd` blobs on the stated LF basis; the fix handoff carries the
  required command output. Independently reproduced, including `git cat-file
  -s` byte corroboration and CRLF reconstruction of the superseded values.
- **Findings:** `FIX-1` closed. `NOTE-1` remains open, non-blocking, and
  documentation-only; it was outside the FIX-1 authorization.
- **Regression:** none; production and test files are byte-identical to
  `b23d7dd`, and the baseline suites reproduce the reviewed counts.
- **Commit:** phase-8 boundary commit 2026-11-06 (documentation set plus both
  phase-8 review records).
- **Next:** OT08 Gate 1 (phase 9).
