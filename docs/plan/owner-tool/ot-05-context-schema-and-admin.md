# OT05 — Context Schema and Admin

- **Status:** blocked
- **Depends on:** OT04 and its settled rigorous review
- **Blocks:** OT06, OT07
- **External gate:** redacted `cbt_db.php`, DDL for `questions`, `subjects`, and
  `exam_category`, plus PHP and database versions
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

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

1. Archive the redacted DB contract and record server versions/charset/engine.
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
10. Test on a disposable database using the user's local PHP machine.

## Acceptance

| Check | Expected |
|---|---|
| Migration preflight | Exact target schema/version/engine/charset confirmed |
| Migration | Applies once to a disposable production-shaped database |
| Existing questions | Remain unchanged and selectable |
| Context create/edit | Native CSRF + PRG flow; fields round-trip exactly |
| Link validation | Wrong pool, duplicate position, invalid slot/ID rejected |
| Incomplete context | Cannot activate or reach candidate queries |
| Complete context | Activates atomically after full validation |
| Member mutation | Context deactivates and requires review |
| Delete | Restricted with linked members; no cascade surprise |
| Legacy rollback safety | Linked rows remain hidden from old candidate query |
| PHP | Every changed/new PHP file passes `php -l` locally |

## Guardrails

- Do not guess SQL types, foreign keys, charset, or `practice_title` behavior.
- Do not use subject display text as a capability switch.
- Do not allow incomplete groups to become active.
- Do not duplicate context text into every question row.
- Do not add context media in this package.
- Do not start OT06.

## Handoff template

```text
Date:
Result:
Production schema/version evidence:
Migration and rollback paths:
Context/question contract:
Activation validation:
Local PHP/DB tests:
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT06 Gate 1
Commit: deferred
Next: OT06 blocked/not started
```
