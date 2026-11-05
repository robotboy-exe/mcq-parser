# OT07 — Owner Context Workflow

- **Status:** done 2026-11-05; pending rigorous Release B review
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
| `src/owner-tool/controller.js` | +46 / -9 | 585 / 22338 | Load panel, resolve pending actions, guard linked saves, full Reset | Loaded by `admin_questions.php`; `node tests/owner-tool.js` |
| `src/owner-tool/state.js` | +48 / -0 | 197 / 7714 | Additive context state validation | Loaded by `admin_questions.php`; `node tests/owner-tool.js` |
| `deployed/admin_questions.php` | +5 / -5 | 1089 / 64807 | Asset includes and `2.2.0` cache-bust | `php -l`; `node tests/context-migration.js`; `node tests/owner-tool.js` |
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
  controller.js 098352d964296dc2747132cb98e71788bea4d121e74a666d0864e858d192d62e;
  state.js 3c1e40f697a1bf41e61664cd897a5d03aca670d664d89295846b50f6ef0fb38c;
  admin_questions.php da502da3c77ef53db56cc382ac0d50158a88ebb29fc9c06ef31c13bd6f62ca50;
  owner-tool.js 38b05a9396f9166336251ad1f5bd5b696dc3367d034bf108a688ea36d53d52e5;
  context-migration.js 18815e2cc3a957ceaa243129d7879c1174025c81d93074c779a617f4d1fd89f7
Open questions: node tools/extract-bank.js --check still has the known
  pre-existing Windows/CRLF pre-2026 output-hash mismatch; target MySQL, browser,
  and staging verification remain OT10; no live/staging DB or destructive write
  was used
Review: pending rigorous Release B review
Commit: owner-requested machine-transfer checkpoint before rigorous review
Next: OT08 not started; complete the OT07 rigorous review first
```
