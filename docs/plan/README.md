# OCR Owner Tool Work Plan — Coordinator

This is the operational source of truth for the active owner-tool cycle. Read
this file, [`../../INTENT.md`](../../INTENT.md), the active
[`phase-map.md`](prompts/phase-map.md), and the one package being executed.

Last updated: 2026-11-03.

## Current state

- Active cycle: `owner-tool-2026-11`.
- Product work: OT00-OT04 implementation complete; Brave/Android staging
  verification is owner-deferred to OT10.
- Next action: OT05 Gate 1. It is blocked only until the exact supplied SQL DDL
  bytes for `questions`, `subjects`, and `exam_category` are placed in the
  workspace. No `.sql` export exists in the worktree or Git history; do not start
  OT05 implementation without those bytes.
- Working branch: `owner-tool-integration` is the authoritative integration and
  implementation line. `main` is the published baseline, not the current work
  branch. See [Branch strategy](#branch-strategy).
- Current `main` parser baseline at `58af90e`: 47 PASS, 0 FAIL, 2 PENDING
  runner; 5 bank slices. That line has no `tests/unit.js` or
  `tests/owner-tool.js`.
- OT04 merged code baseline on `owner-tool-integration` at `405439b`: 47 runner PASS
  + 2 PENDING, 145 unit PASS, 38 owner-tool PASS, 7 bank slices OK;
  staging/mobile verification is in OT10.
- Selected clean experiments base: `d5a62f0`; verified by OT00 at 43 runner and
  140 unit passes.
- Dirty experiments P20-P22: reviewed `BLOCK`, shelved, and excluded.
- Current status summary: [`../STATUS.md`](../STATUS.md).
- Continuation checklist: [`owner-tool/next-steps.md`](owner-tool/next-steps.md).
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
| 1 | OT00 | [Integration Baseline](owner-tool/ot-00-integration-baseline.md) | none | done | explicit approval before merge commit |
| 2 | OT01 | [Evidence and Fixtures](owner-tool/ot-01-evidence-and-fixtures.md) | OT00 | done | none |
| 3 | OT02 | [Production Parser Core](owner-tool/ot-02-production-parser-core.md) | OT01 | done | none |
| 4 | OT03 | [Owner Tool Replacement](owner-tool/ot-03-owner-tool-replacement.md) | OT02 | done | satisfied (helper archived 2026-11-01) |
| 5 | OT04 | [Underline and Multiline](owner-tool/ot-04-underline-and-multiline.md) | OT03 | done | none; staging/mobile deferred to OT10 |
| 6 | OT05 | [Context Schema and Admin](owner-tool/ot-05-context-schema-and-admin.md) | OT04 review (settled) | blocked | exact SQL DDL bytes; no `.sql` files in workspace or history |
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
| Exact DDL bytes for `questions`, `subjects`, `exam_category` | Supplies exact types, keys, engine, and charset for migration; the three exports named in the checklist are not in the workspace or Git history |
| `answer_details.php` | Supplied and archived 2026-11-02; integrated in OT04 and independently verified again in OT10 |
| PHP and database versions | Satisfied: PHP 8.3 application target; MySQL 8.0.41 from schema exports |
| Practice-question writer/importer | Preserves the existing `practice_title` contract |
| Search list for question readers/writers | Finds every affected output and persistence path |

The connection contract is settled by root `db_conn.php` (charset `utf8mb4`,
PDO exceptions, associative fetches, native prepares). Do not request a redacted
or full `cbt_db.php`.

The `exam_category2` → `exam_category` correction is settled. Keep the original
export as evidence and apply the correction only to the working DDL copy.

The checklist says `questions.sql`, `subjects.sql`, and `exam_category.sql` were
supplied, but no `.sql` file exists in the worktree or anywhere in Git history.
Treat this as one missing-artifact problem, not multiple blockers. If no DDL file
exists, request only:

```sql
SELECT VERSION();
SHOW CREATE TABLE questions;
SHOW CREATE TABLE subjects;
SHOW CREATE TABLE exam_category;
```

Secrets, credentials, cookies, and production data are not required.

`answer_details.php` arrived before OT04 handoff. The supplied bytes are archived,
its deployed working copy uses OT04's shared renderer, and OT10 independently
verifies the detail path with the rest of Release A.

## Branch strategy

- `owner-tool-integration` is the authoritative work branch. It contains `main`
  and all owner-tool work through OT04. Start OT05 and later implementation here.
- `main` is the published baseline and the remote default. It is not the current
  work branch. Advance it only at a reviewed release boundary or cycle close, by
  fast-forwarding it to the reviewed `owner-tool-integration` tip. Never rewrite
  its history.
- Do not create a long-lived branch per phase. If a risky experiment needs
  isolation, use a short-lived topic branch off `owner-tool-integration` and merge
  or delete it in the same package.
- `ot04-fix` and `ot04-review` are merged into `owner-tool-integration` and
  retired. Their commits remain reachable through history; do not base new work
  on them.
- Reviews are read-only sessions against `owner-tool-integration`. A review
  session may write only its record under [`reviews/`](reviews/README.md); it
  never commits or moves branches.
- Implementation changes land on `owner-tool-integration`. The rigorous review at
  a release boundary verifies that tip; only then may `main` be advanced.

## Review checkpoints

| Checkpoint | Scope | Level | Status |
|---|---|---|---|
| phase 1 close | OT00 integration baseline | rigorous | pending |
| phases 2-4 | OT01-OT03 | light at next Gate 1 | pending |
| phase 5 close | OT04 Release A implementation and detail-source integration | rigorous | pass |
| phases 6-7 | OT05-OT06 | light at next Gate 1 | pending |
| phase 8 close | OT07 Release B | rigorous | pending |
| phase 9 | OT08 | light at OT09 Gate 1 | pending |
| phase 10 close | OT09 Release C | rigorous | pending |
| phase 11 close | OT10 final release | rigorous | pending |

The pending rows above are historical process debt; they do not block OT05.
OT05's only start gate is the exact SQL DDL artifact.

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

Owner-tool integration line adds:

```sh
node tests/unit.js
node tests/owner-tool.js
```

OT05 writes the migration, preflight, and rollback artifacts. OT10 runs the PHP
and migration commands on the user's local PHP environment; exact runtime
commands are defined from the supplied DDL and target environment. Do not make
OT05 completion depend on those runtime checks.

## Branch and worktree safety

- Work in the current worktree and keep it on `owner-tool-integration`. For a
  read-only baseline check of another line, use a detached temporary worktree;
  do not switch the working tree to `main` to implement or to refresh a status
  count.
- The old dirty experiments worktree is not present in this clone. Do not
  recreate it or import its uncommitted P20-P22 files.
- Never reset, clean, stash, switch, or rewrite a worktree with unexpected user
  changes. Preserve them unless they directly block the package; then stop and
  ask.
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
