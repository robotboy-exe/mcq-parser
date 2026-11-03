# OT05 — Context Schema and Admin

- **Status:** blocked
- **Depends on:** OT04 and its settled rigorous review (satisfied)
- **Blocks:** OT06, OT07
- **External gate:** exact SQL DDL bytes for `questions`, `subjects`, and
  `exam_category`, placed unchanged in the workspace. No `.sql` export currently
  exists in the worktree or Git history.
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Gate

Confirmed facts, not blockers:

- Application target is PHP 8.3; database is MySQL 8.0.41 with InnoDB and
  `utf8mb4_unicode_ci`.
- Root `db_conn.php` supplies the connection contract: charset `utf8mb4`, PDO
  exception mode, associative fetches, and native prepares. The full
  credential-bearing `cbt_db.php` is not required.
- The supplied export's `exam_category2` identifier is corrected to
  `exam_category` when building the working DDL copy. Keep the original export as
  evidence.
- OT04's rigorous review passed and `ot04-fix` is merged into
  `owner-tool-integration`.

Outstanding dependency:

- The exact supplied DDL bytes. The checklist names `questions.sql`,
  `subjects.sql`, and `exam_category.sql`, but none exists in the worktree or
  anywhere in Git history. This is one missing-artifact problem, not several
  independent blockers.

Deferred to OT10:

- PHP lint, `php tests/php-render.php`, migration preflight/forward/rerun/rollback
  execution, Chromium checks, and Brave/Android staging checks.

Do not start OT05 implementation until the exact DDL bytes are present. Do not
substitute the archived migration docs or `db_conn.php` for the DDL.

## Goal

Add a maintainable, rollback-safe server contract for manual shared-context
creation, linking, validation, activation, and deactivation.

## Provisional model

The exact SQL types must be copied from the supplied DDL. The intended model is:

- `question_contexts`: ID, context type, title, context text, subject/category/
  year pool metadata, optional practice dimension if required, expected member
  count, activation state, timestamps, and optional idempotency token.
- `questions`: nullable context ID, context position, and nullable cloze slot.
- Unique context position per context; unique non-null slot where the database
  supports the intended constraint.
- Restrictive deletion while linked questions exist.

## Publication safety

- New linked question rows remain inactive under the legacy `questions` flag.
- A context's validated activation state is the publication switch for linked
  members.
- Old candidate code, which selects only active question rows, therefore cannot
  expose a linked question without its context.
- Editing, moving, unlinking, deactivating, or deleting a member deactivates its
  context until revalidated.

## Work

1. Archive the supplied exact DDL bytes unchanged with hashes, record the
   confirmed server versions/engine/charset, and apply the settled
   `exam_category2` → `exam_category` correction only to the working copy.
2. Write forward migration, preflight checks, backup instructions, and a safe
   rollback procedure that never destroys populated context data silently.
3. Add a side-effect-free shared PHP helper for context validation and queries.
4. Add CSRF-protected native PRG actions for create, update, activate,
   deactivate, and permitted delete.
5. Add a separate, readable manual context form and context listing in admin;
   do not nest forms.
6. Add question-form link, position, and slot fields with server validation.
7. Enforce metadata compatibility between context and linked questions.
8. Validate activation atomically: expected count, unique order, required slots,
   four options/correct answer on every member, and matching pool metadata.
9. Add clear status labels and audit-friendly server messages.
10. Write the migration preflight, forward migration, rerun behavior, backup
    instructions, and non-destructive rollback; OT10 executes them on the target
    runtime.

## Acceptance

| Check | Expected |
|---|---|
| Migration preflight | Exact target schema/version/engine/charset confirmed from the supplied DDL |
| Migration artifacts | Forward migration, preflight, rerun behavior, backup instructions, and non-destructive rollback written and reviewed |
| Existing questions | Remain unchanged and selectable by reviewed design |
| Context create/edit | Native CSRF + PRG flow; fields round-trip exactly |
| Link validation | Wrong pool, duplicate position, invalid slot/ID rejected |
| Incomplete context | Cannot activate or reach candidate queries by design review |
| Complete context | Activates atomically after full validation by design review |
| Member mutation | Context deactivates and requires review |
| Delete | Restricted with linked members; no cascade surprise |
| Legacy rollback safety | Linked rows remain hidden from the old candidate query |
| PHP syntax | Deferred to OT10: every changed/new PHP file passes `php -l` on the target runtime |
| Migration execution | Deferred to OT10: preflight, forward, rerun, and rollback proven on a disposable production-shaped database |

## Guardrails

- Do not start OT05 until the exact DDL bytes are present in the workspace.
- Do not treat `cbt_db.php`, the PHP/database/engine/charset versions, or the
  `exam_category2` naming question as open gates; they are settled.
- Do not guess SQL types, foreign keys, charset, or `practice_title` behavior.
- Do not use subject display text as a capability switch.
- Do not allow incomplete groups to become active.
- Do not duplicate context text into every question row.
- Do not add context media in this package.
- Do not run or require PHP, migration, or staging verification in OT05; that is
  OT10's scope.
- Do not start OT06.

## Handoff template

```text
Date:
Result:
Exact DDL files and hashes:
Confirmed schema/version/engine/charset:
Migration and rollback paths:
Context/question contract:
Activation validation:
Runtime verification: deferred to OT10
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT06 Gate 1
Commit: deferred
Next: OT06 blocked/not started
```
