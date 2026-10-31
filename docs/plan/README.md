# OCR Owner Tool Work Plan — Coordinator

This is the operational source of truth for the active owner-tool cycle. Read
this file, [`../../INTENT.md`](../../INTENT.md), the active
[`phase-map.md`](prompts/phase-map.md), and the one package being executed.

Last updated: 2026-10-31.

## Current state

- Active cycle: `owner-tool-2026-11`.
- Product work: not started.
- Next package: OT00, Integration Baseline.
- Current `main` parser baseline: 25 PASS, 0 FAIL, 0 PENDING.
- Selected clean experiments base: `d5a62f0`; OT00 must independently verify
  its claimed 43 fixture and 140 unit/UI passes.
- Dirty experiments P20-P22: reviewed `BLOCK`, shelved, and excluded.
- Current status summary: [`../STATUS.md`](../STATUS.md).
- Historical P01-P09 and shelved-cycle record: [`history.md`](history.md).

## Product direction

- Replace the deployed `ocr_helper.js` with a readable owner tool.
- Do not ship a bookmarklet or Auto-Save workflow.
- Fill the native form for human review and use native PRG saves.
- Use fresh versioned state; do not trust legacy queues.
- Release A: owner tool plus underline/multiline.
- Release B: manual shared-context persistence and complete-group delivery.
- Release C: comprehension and cloze OCR automation.

`INTENT.md` is authoritative when package prose is ambiguous.

## Package states

Status values are `not started`, `in progress`, `blocked`, and `done`.

| Phase | ID | Package | Depends on | Status | External gate |
|---|---|---|---|---|---|
| 1 | OT00 | [Integration Baseline](owner-tool/ot-00-integration-baseline.md) | none | not started | explicit approval before merge commit |
| 2 | OT01 | [Evidence and Fixtures](owner-tool/ot-01-evidence-and-fixtures.md) | OT00 | not started | none |
| 3 | OT02 | [Production Parser Core](owner-tool/ot-02-production-parser-core.md) | OT01 | not started | none |
| 4 | OT03 | [Owner Tool Replacement](owner-tool/ot-03-owner-tool-replacement.md) | OT02 | blocked | production `ocr_helper.js` |
| 5 | OT04 | [Underline and Multiline](owner-tool/ot-04-underline-and-multiline.md) | OT03 | blocked | `answer_details.php` |
| 6 | OT05 | [Context Schema and Admin](owner-tool/ot-05-context-schema-and-admin.md) | OT04 review | blocked | redacted DB config, DDL, versions |
| 7 | OT06 | [Candidate Group Delivery](owner-tool/ot-06-candidate-group-delivery.md) | OT05 | blocked | practice writer and reader/writer audit |
| 8 | OT07 | [Owner Context Workflow](owner-tool/ot-07-owner-context-workflow.md) | OT06 | not started | inherited server contract |
| 9 | OT08 | [Comprehension OCR](owner-tool/ot-08-comprehension-ocr.md) | OT07 review | not started | answer-key sample for final acceptance |
| 10 | OT09 | [Cloze OCR](owner-tool/ot-09-cloze-ocr.md) | OT08 | not started | answer-key sample for final acceptance |
| 11 | OT10 | [Release and Handoff](owner-tool/ot-10-release-and-handoff.md) | OT09 review | blocked | local PHP, staging, all prior artifacts |

The active map duplicates these statuses for session resolution. Update both
files in the same package handoff; a mismatch blocks the next Gate 1.

## External artifact request

| Artifact | One-line justification |
|---|---|
| Current production `ocr_helper.js` | Defines the exact behavior and state being replaced |
| Redacted `cbt_db.php` | Confirms charset, PDO mode, and transaction setup |
| DDL/migrations for `questions`, `subjects`, `exam_category` | Supplies exact types, keys, engine, and charset for migration |
| `answer_details.php` | Completes the safe question/context rendering audit |
| PHP and MySQL/MariaDB versions | Determines supported PHP and SQL syntax |
| Practice-question writer/importer | Preserves the existing `practice_title` contract |
| Search list for question readers/writers | Finds every affected output and persistence path |

If no DDL file exists, request only:

```sql
SELECT VERSION();
SHOW CREATE TABLE questions;
SHOW CREATE TABLE subjects;
SHOW CREATE TABLE exam_category;
```

Secrets, credentials, cookies, and production data are not required.

## Review checkpoints

| Checkpoint | Scope | Level | Status |
|---|---|---|---|
| phase 1 close | OT00 integration baseline | rigorous | pending |
| phases 2-4 | OT01-OT03 | light at next Gate 1 | pending |
| phase 5 close | OT04 Release A | rigorous | pending |
| phases 6-7 | OT05-OT06 | light at next Gate 1 | pending |
| phase 8 close | OT07 Release B | rigorous | pending |
| phase 9 | OT08 | light at OT09 Gate 1 | pending |
| phase 10 close | OT09 Release C | rigorous | pending |
| phase 11 close | OT10 final release | rigorous | pending |

Rigorous reviews use [`prompts/review-session.md`](prompts/review-session.md)
and write only one record per package under [`reviews/`](reviews/README.md).
`BLOCK` findings require a fix session and re-review. Accepted `FIX` findings
follow the review record's exact next action.

## Session protocol

1. Execute one package per session using
   [`prompts/phase-session.md`](prompts/phase-session.md).
2. Gate 1 is read-only. Resolve status, dependencies, external gates, review
   state, worktree scope, and baseline evidence, then wait for explicit `go`.
3. A `blocked` package stops at Gate 1. Do not skip to dependent product work.
4. After `go`, execute only that package and do not preview/start the next one.
5. Add failing evidence before behavior changes where the package requires it.
6. Run every acceptance check. Never mark a package done on partial evidence.
7. Update this table, the active map, current status, package handoff, and
   history where required.
8. Stop after the handoff with `Commit: deferred`.
9. Commit only when the user explicitly asks. Never amend, rebase, force-push,
   or bundle unrelated changes.

## Definition of done

Every package must satisfy all applicable items:

- dependencies and external gates are verified from files/evidence;
- every acceptance row maps to a test, probe, or explicit recorded gap;
- source-backed expectations were not generated from parser output;
- no unrelated or user-owned worktree change was reverted or bundled;
- current-facing docs match implemented behavior;
- package status and active-map status agree;
- handoff records exact files, commands/results, hashes, open questions, review
  status, and deferred commit state;
- required PHP/browser/staging checks are not replaced with assumptions;
- no orphan fixture or failing baseline remains.

## Baseline commands

Before OT00, run the commands available on each source line and report them
separately. After OT00, its handoff defines the authoritative merged baseline.

Current main:

```sh
node tests/runner.js
node tools/extract-bank.js --check
```

Clean experiments/integration is expected to add:

```sh
node tests/unit.js
```

OT05 onward also requires the user's local PHP environment. Exact commands are
defined after the target PHP/database versions and schema are supplied.

## Branch and worktree safety

- Never reset, clean, stash, switch, or rewrite the existing dirty experiments
  worktree.
- Never import its uncommitted P20-P22 files to resolve a conflict.
- Preserve unexpected user changes unless they directly block the package; then
  stop and ask.
- Live writes require explicit per-action approval. Destructive production
  cleanup is owner-only.

## Completed historical track

P01-P09 are done and retained under `docs/plan/01-*.md` through `09-*.md`.
They are evidence/history, not phases in the active owner-tool cycle. Their
summary and final counts live in [`history.md`](history.md).

## Cycle close

After OT10 and its rigorous review settle, use
[`prompts/cycle-close.md`](prompts/cycle-close.md). Cycle close executes no
package, commits only with explicit authorization, and leaves the cycle active
until the owner separately confirms archival.
