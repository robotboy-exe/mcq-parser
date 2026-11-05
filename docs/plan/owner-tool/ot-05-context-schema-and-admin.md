# OT05 — Context Schema and Admin

- **Status:** done; `BLOCK-8` rejected, review/disposition settled and commit-ready; `NOTE-4` non-blocking
- **Release:** B implementation (schema/admin); runtime execution deferred to OT10
- **Depends on:** OT04 and its settled rigorous review (satisfied)
- **Blocks:** OT06, OT07
- **External gate:** none. The exact SQL DDL bytes for `questions`, `subjects`,
  and `exam_category` were supplied in `main` commit `002483b` and copied to
  `owner-tool-integration` on 2026-11-03.
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Gate

Confirmed facts, not blockers:

- Application target is PHP 8.3; database is MySQL 8.0.41 with InnoDB and
  `utf8mb4_unicode_ci`.
- Root `db_conn.php` supplies the connection contract: charset `utf8mb4`, PDO
  exception mode, associative fetches, and native prepares. The full
  credential-bearing `cbt_db.php` is not required.
- `questions.sql`, `subjects.sql`, and `exam_category.sql` are present at the
  repository root. `exam_category.sql` still uses `exam_category2`; the working
  DDL copy must rename it to `exam_category` while the original stays unchanged
  as evidence.
- OT04's rigorous review passed and `ot04-fix` is merged into
  `owner-tool-integration`.

Outstanding dependency: none. The former DDL gate is satisfied; proceed at Gate
1.

Deferred to OT10:

- PHP lint, `php tests/php-render.php`, migration preflight/forward/rerun/rollback
  execution, Chromium checks, and Brave/Android staging checks.

The DDL is present. Do not substitute the archived migration docs or
`db_conn.php` for it.

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

- Do not treat the DDL as missing; the three supplied files are at the repository
  root and the gate is satisfied.
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

## Handoff — 2026-11-04 (implementation complete)

```text
Date: 2026-11-04
Result: OT05 schema, migration artifacts, helper, and admin workflow are
  implemented and statically/helper verified. Target-runtime migration and
  browser checks remain OT10 evidence.

Exact DDL files and hashes:
  - archive/sql/2026-11-03-supplied/questions.sql
    e12e4d9fcb2a15b13bd2fff6885ca8c286006b80e58cfa62c91b434fc4c8834e (2615 bytes)
  - archive/sql/2026-11-03-supplied/subjects.sql
    bd0e1a11c0371ddb1fd0252ebc55bcb949c605a858a33e59c917bfddc10449af (1670 bytes)
  - archive/sql/2026-11-03-supplied/exam_category.sql
    05720e31e2365cfe2500222e9f615962e769ff06466eeeaf1512e605c4357cb1 (1711 bytes)
  - archive/sql/2026-11-03-supplied/manifest.json records the hashes, byte
    counts, and settled runtime facts. The root supplied exports are unchanged
    and remain staged; the archive copies are the evidence.

Confirmed schema/version/engine/charset:
  - PHP 8.3 application target.
  - MySQL 8.0.41, InnoDB, utf8mb4, utf8mb4_unicode_ci.
  - The working DDL renames the supplied exam_category2 identifier to
    exam_category; no exam_category2 reference remains in the working copy.

Migration and rollback paths:
  - deployed/sql/base-schema.working.sql — disposable production-shaped build.
  - deployed/sql/01-context-migration.sql — rerunnable forward migration.
  - deployed/sql/02-context-rollback.sql — guarded non-destructive rollback.
  - deployed/sql/README.md — preflight, backup, forward, rerun, rollback, and
    publication-safety runbook.
  - tools/context-migration-preflight.php — real session/table/schema reporter.
  - None of these has been executed against MySQL in this workspace. OT10 runs
    them only on a disposable database, never production.

Context/question contract:
  - question_contexts stores type, title, shared text, subject/category/year
    pool, expected member count, activation state, timestamps, and an optional
    unique idempotency token.
  - questions gains nullable context_id, context_position, and context_slot.
  - Unique (context_id, context_position) and (context_id, context_slot) keys;
    the context slot key tolerates NULL for comprehension members.
  - Restricted question_contexts foreign keys; question deletion is restricted
    while a member still references the context, and the admin refuses context
    deletion while members exist.
  - Linked questions are forced is_active = 0. The context is_active flag is the
    publication switch for OT06; legacy is_active = 1 candidate queries are
    unchanged and therefore cannot expose linked rows without context delivery.

Activation validation:
  - exactly the expected member count;
  - unique contiguous positions 1..N;
  - cloze: unique member slots exactly equal the distinct [[gap:N]] tokens, and
    tokens must be 1..999;
  - comprehension: no cloze gap tokens and no member slots;
  - every member has question text, four non-empty options, and a valid correct
    answer 0..3;
  - every member matches the context subject/category/year pool and stays
    inactive;
  - context title/text and pool metadata remain valid.
  - Activation runs inside a transaction with FOR UPDATE row locks; editing,
    moving, linking, unlinking, or deleting a member deactivates every affected
    context until it is revalidated.

Runtime verification:
  - Local Windows PHP 8.3.16 lint PASS for deployed/admin_questions.php,
    deployed/context_lib.php, tools/context-migration-preflight.php, and
    tests/context-lib.php.
  - php tests/php-render.php -> 9 PASS.
  - php tests/context-lib.php -> 12 PASS (real helper functions against an
    in-memory SQLite schema; not a MySQL or browser test).
  - node tests/context-migration.js -> 8 PASS.
  - node tests/runner.js -> 49 fixtures: 47 PASS, 0 FAIL, 2 PENDING.
  - node tests/unit.js -> 145 PASS.
  - node tests/owner-tool.js -> 38 PASS.
  - git diff --check -> PASS.
  - Known pre-existing Windows/CRLF artifact: node tools/extract-bank.js --check
    reports the pre-2026 output hash mismatch (LF index vs CRLF worktree). Source
    hashes/anchors/counts pass; this is not an OT05 regression.
  - Deferred to OT10: MySQL preflight/forward/rerun/rollback execution, target
    PHP lint/vectors, admin PRG browser checks, Chromium, and Brave/Android
    staging.

Files changed:
  - archive/sql/2026-11-03-supplied/questions.sql
  - archive/sql/2026-11-03-supplied/subjects.sql
  - archive/sql/2026-11-03-supplied/exam_category.sql
  - archive/sql/2026-11-03-supplied/manifest.json
  - deployed/sql/base-schema.working.sql
  - deployed/sql/01-context-migration.sql
  - deployed/sql/02-context-rollback.sql
  - deployed/sql/README.md
  - deployed/context_lib.php
  - deployed/admin_questions.php
  - tools/context-migration-preflight.php
  - tests/context-migration.js
  - tests/context-lib.php
  - AGENTS.md, README.md, docs/STATUS.md
  - docs/plan/README.md, docs/plan/prompts/phase-map.md, docs/plan/history.md,
    docs/plan/owner-tool/next-steps.md, this package

Hashes:
  - deployed/sql/base-schema.working.sql a83304f9e9bc5276509f8fbbbe48bb7f16c584915dfc6217fa1300fd7a8fcdac
  - deployed/sql/01-context-migration.sql 2741229fe3e0cfb0cd6b508a78218dcc37c83471d16990ea8000ea4b9df9de9f
  - deployed/sql/02-context-rollback.sql b77c00a857a5734e54f338b7fa944c46633a6b76add53d1ed43153eabee94f70
  - deployed/sql/README.md ff863ec2261467f696dea4d856413fd44b73dfdbd78b2265f1cde23cc71c965c
  - deployed/context_lib.php ea71d3c8d35732722598cbf44399d2df3a71324d8cfb940b04276b7688000ece
  - deployed/admin_questions.php 16c11ecef017c302cc1b77ce53c204248269a5cf9504abb482e054172894a08d
  - tools/context-migration-preflight.php e8d1ffe2aeb6a7540b3c229b8a03b5792d5b6c2612ea840b292560254d06e986
  - tests/context-migration.js cf3ab9dd4c61bffcf39caa65398fc52e36ffc5c56a90cf847d062434e2fa0b97
  - tests/context-lib.php 9d37789086a632521fc6b880638c866bcf40caf495d562a00b65541632a3c43c

Open questions:
  - questions.practice_title is NOT NULL with no default while the supplied and
    deployed admin INSERT omits it. Recorded only; do not change until the
    practice writer/importer contract is known. OT10 can exercise linking by
    editing existing questions instead of inserting.
  - The admin context PRG flow has no browser/runtime test in this workspace;
    helper behavior is covered by tests/context-lib.php, and OT10 owns the
    browser/staging check.
  - The MySQL migration, rerun, and rollback have not been executed here; OT10
    owns the disposable-database proof.
  - The pre-existing extract-bank CRLF hash mismatch is unrelated to OT05 and was
    not "fixed" by regenerating fixtures or changing configuration.

Review: pending light verification at OT06 Gate 1
Commit: deferred; the current working tree also contains pre-existing Gate 1
  documentation changes and the supplied root SQL files. Do not commit without
  explicit authorization.
Next: OT06 Gate 1 remains blocked on the practice writer/reader-writer audit.
  Do not start OT06 product work until that gate clears.
```

## Remediation Handoff — 2026-11-04 (OT05-EXT-01)

```text
Date: 2026-11-04
Finding: OT05-EXT-01 (accepted by owner)
Result: PASS. Context request actions, context/question data preparation,
  question-context fields, and context-management markup were moved into focused
  PHP includes. admin_questions.php now retains narrow integration hooks and the
  unavoidable question mutation transaction changes. No schema, migration,
  action name, field name, selector, CSRF, authentication, PRG, flash,
  publication-safety, or live behavior was changed.

Evidence added before control-flow movement:
  - php tests/context-admin.php initially failed because the focused includes did
    not exist; node tests/context-migration.js failed for the same reason.
  - tests/context-admin.php executes create/update/activate/deactivate/delete
    success, validation rejection, PDO failure handling, activation rollback,
    failed-request state, question link/move/unlink/delete deactivation and
    rollback, and rendered form structure/selectors against SQLite.
  - tests/context-migration.js statically verifies externalization, the persistent
    entry-size ceiling, and transaction/deactivation ordering.

Before/after admin entry diff against HEAD (OT04 baseline):
  - Baseline: 1,056 lines; 62,915 bytes.
  - Before remediation: 476 insertions, 8 deletions; 1,524 lines; 94,963 bytes;
    net +468 lines (+44.3%).
  - After remediation: 98 insertions, 8 deletions; 1,146 lines; 68,254 bytes;
    net +90 lines (+8.5%).
  - Reduction: 378 fewer entry-file insertions (79.4%); target <=100 satisfied.

Files changed for remediation:
  - deployed/admin_questions.php
  - deployed/admin_context_actions.php
  - deployed/admin_context_data.php
  - deployed/admin_question_context_fields.php
  - deployed/admin_context_management.php
  - tests/context-admin.php
  - tests/context-migration.js
  - AGENTS.md, docs/STATUS.md, docs/plan/README.md
  - docs/plan/prompts/phase-map.md
  - docs/plan/owner-tool/next-steps.md
  - this package handoff

SHA-256:
  - deployed/admin_questions.php 0860c316d690cb926aca83825d46354c17e455b7cfc87f7cfd9029b4bfe4f6f7
  - deployed/admin_context_actions.php 8b34d9e65072aa51a0d565e8daa541b33a4daaf4b1992dbbb7a3723d77bb8975
  - deployed/admin_context_data.php a2577702a74096598dd0a3c6a5ac39d4136e626c06af31b3fda94ec4e6927fee
  - deployed/admin_question_context_fields.php 8af2d7931939167866b1da62d2b242914398c8aa8d4cfbd2071bc326fec90a9b
  - deployed/admin_context_management.php 9bb806cb5874ba1d47676c4214118be059feccd8ae91c4ed41aea60d62acaa21
  - tests/context-admin.php 30ce31043463d6cb4f6cff5f56d8c1b5f873d74581bd35677fa1ef890173355c
  - tests/context-migration.js 34c370d00605731603efc2103ebb3b563ea09d89be1078c5621b71fd9dcbc1b2

Acceptance:
  - node tests/runner.js -> 47 PASS, 0 FAIL, 2 PENDING (49 fixtures).
  - node tests/unit.js -> 145 PASS, 0 FAIL.
  - node tests/owner-tool.js -> 38 PASS, 0 FAIL.
  - node tests/context-migration.js -> 10 PASS, 0 FAIL.
  - php tests/context-lib.php -> 12 PASS, 0 FAIL.
  - php tests/context-admin.php -> 14 PASS, 0 FAIL.
  - php tests/php-render.php -> 9 PASS.
  - Local PHP 8.3.16 lint -> PASS for every remediation PHP file plus the
    unchanged OT05 helper/preflight PHP files.
  - git diff --check -> PASS (the Git CRLF warning is informational).
  - node tools/extract-bank.js --check -> the known pre-existing pre-2026 output
    hash mismatch only; source hashes, anchors, counts, and all parser fixtures
    remain unchanged.

Open questions:
  - MySQL migration execution and browser/admin PRG checks remain deferred to
    OT10. The new dispatcher evidence uses production PHP with SQLite, not a
    browser or MySQL.
  - questions.practice_title remains the existing OT06 external gate; this
    remediation did not change it.

Review: required. Production request handling was reorganized; run a separate
  OT05 rigorous re-review before another implementation package.
Commit: deferred
Next: OT06 remains blocked on the existing practice writer/reader-writer audit.
  Do not start OT06.
```

## Phase 6 Fix Handoff — 2026-11-04

```text
Date: 2026-11-04
Accepted findings: BLOCK-1 through BLOCK-5 and FIX-1 through FIX-5 from
  docs/plan/reviews/owner-tool-2026-11-phase-6.md.
Result: PASS locally. The accepted findings are repaired with failing evidence
  added first. MySQL execution and browser/staging checks remain OT10 evidence.

Finding resolution:
  - BLOCK-1: context update/delete and question insert/update/delete now validate
    and mutate under transactions and FOR UPDATE locks. Contexts lock in numeric
    order before member rows. A stale former-context hint rolls back and retries,
    then deactivates the actual former and target contexts atomically.
  - BLOCK-2: supplied malformed, decimal, zero, negative, array, and otherwise
    non-positive context/position/slot values are rejected instead of becoming
    an omitted standalone link; rejected input cannot preserve active publication.
  - BLOCK-3: the preflight now compares exact supplied/applied column metadata,
    ordered index definitions, and FK references/actions. The forward migration
    rejects incompatible existing objects before any guarded skip.
  - BLOCK-4: rollback checks non-null context_id, context_position, and
    context_slot independently. Guard and removal share one procedure.
  - BLOCK-5: failed context forms compare normalized pool IDs as strings and
    retain the selected subject/category.
  - FIX-1: context normalization records and rejects non-scalar values without
    Array-to-string warnings; optional question link fields use strict parsing.
  - FIX-2: the context textarea emits a sacrificial LF before stored content.
  - FIX-3: tests execute deployed/admin_question_mutations.php for real
    link/move/unlink/delete, stale-hint, deactivation, and rollback behavior.
  - FIX-4: the real CLI preflight uses a shutdown exit guard, so db_conn.php's
    string exit on connector failure cannot return status 0.
  - FIX-5: all context status queries run during page-data preparation inside a
    PDO boundary; the rendered view performs no database query.

Evidence added before behavior:
  - php tests/context-lib.php failed on Array-to-string conversion.
  - php tests/context-admin.php failed because the real mutation module did not
    exist.
  - node tests/context-migration.js failed because the split production modules
    did not exist.
  - php tests/context-preflight.php failed because the production contract and
    inspector did not exist.

Production measurements from exact original OT05 package base cd2e6c9:
  File                                             Add/Del  Lines  Bytes
  deployed/admin_questions.php                    94/61     1089  64488
  deployed/admin_context_actions.php              244/0      244   9860
  deployed/admin_context_data.php                 167/0      167   6495
  deployed/admin_context_management.php           134/0      134   9708
  deployed/admin_question_context_fields.php       28/0       28   2141
  deployed/admin_question_mutations.php           206/0      206   8833
  deployed/context_lib.php                        212/0      212   7970
  deployed/context_input_validation.php           137/0      137   5744
  deployed/context_activation_validation.php      138/0      138   5867
  deployed/sql/01-context-migration.sql            223/0      223  13058
  deployed/sql/02-context-rollback.sql             102/0      102   4507
  tools/context-migration-preflight.php             33/0       33   1146
  tools/context-migration-contract.php             243/0      243  11971
  tools/context-migration-inspector.php            175/0      175   8020
  Every existing-file addition count is <=100 and every new readable production
  module is <=250 lines. No exception was requested or used.

Responsibilities, deployment, and direct evidence:
  - admin_questions.php is the deployed entry wiring; context-migration.js checks
    includes/calls and context-admin.php executes the called production functions.
  - admin_context_actions.php owns native context dispatch/transactions and is
    included by admin_questions.php; context-admin.php executes its dispatcher.
  - admin_context_data.php owns strict link parsing and pre-render data; it is
    included by admin_questions.php and directly exercised by context-admin.php.
  - admin_context_management.php is the query-free deployed view; context-admin.php
    renders the real include for selected values, LF bytes, forms, and status data.
  - admin_question_context_fields.php owns the deployed question-link fields; it
    is included by admin_questions.php and rendered directly by context-admin.php.
  - admin_question_mutations.php owns lock-aware question transactions; it is
    included by admin_questions.php and directly executes against SQLite in
    context-admin.php, including stale former context and forced rollback probes.
  - context_lib.php owns core queries/link checks and includes the focused input
    and activation declaration modules; context-lib.php and context-admin.php
    execute all three deployed paths.
  - context-migration-preflight.php is the deployed CLI entry and includes the
    contract/inspector. context-preflight.php executes their real validator,
    metadata grouping, and CLI connector-failure path.
  - The forward/rollback SQL files deploy through deployed/sql/README.md.
    context-migration.js checks the actual artifacts locally; direct MySQL 8.0.41
    forward/rerun/wrong-shape/rollback execution remains explicitly deferred to
    OT10's disposable production-shaped database.

SHA-256:
  - deployed/admin_questions.php 47f14cdf5557516fc2876ef9682348448824d1dd805e53237e6fc1ecca15d5e9
  - deployed/admin_context_actions.php 9304e70d5df7c8d74b2512bc01a1a0e708778fcc9333fd20ebd24bb4baae41f3
  - deployed/admin_context_data.php 719da0d639aea1ef22cfb2e5d55df24a3c4e2bfd0eb5751d8d6540342e53587c
  - deployed/admin_context_management.php f66da14685702f969d1d9a55b792198f42b04b092a1d465edcf23e9aa866a77d
  - deployed/admin_question_context_fields.php 8af2d7931939167866b1da62d2b242914398c8aa8d4cfbd2071bc326fec90a9b
  - deployed/admin_question_mutations.php 3882efda43edd63cf8a4f8b5eeb8786fb67282377bc3a1fbd6a7173f3e863575
  - deployed/context_lib.php 9c2e7922dc7754c957b9d93f513d98b254bacec135b5dccaed8c7fd1ef96667b
  - deployed/context_input_validation.php e00fd7745207fb0dc4b3875ce1f789f8c264837e43b90e5b10dd2771c213a14d
  - deployed/context_activation_validation.php 7578315a8d909dd861db22cc8605766d0770c42b400b90fcf574cb725a6fa9c4
  - deployed/sql/01-context-migration.sql 864cc8c79619c6fceefb9acd781f5b4a6ccce07a6ad165aa620d28af972de3f4
  - deployed/sql/02-context-rollback.sql b0e2a6d4135f87576763a4c7d0761a8183541cb9c21606a63507c806a9f65728
  - tools/context-migration-preflight.php babc5f32082a12ead64fdbfa0361b295a0c8022af91af97a73d8585596cfad44
  - tools/context-migration-contract.php 45d95dfbef36907f889aaa3f2ea80a3dd13dafec077f6b755a17bbc5098c4cb3
  - tools/context-migration-inspector.php 23ad82ada354d1e7e04c4d80c60e81c192df15d063ac29814a7b44687837f521
  - tests/context-admin.php 1250bda8a9ca8e5fb3203db10bb94514c4e813e9db08aea2f3a750ad19e4e287
  - tests/context-lib.php 0e85aa179a0b45ad80ef9af840fe6d1fb9a58240bc352732b56d12fe21b204cf
  - tests/context-migration.js ecd25531711b279ce57e12b74713f1701a5b706f448c6d607aa6072f2151e66c
  - tests/context-preflight.php 5500e9e9d1696c2bf63d5b005ef8d4a42d0e84d4c3ab8573724fb7b37e351bb6
  - deployed/sql/README.md fc582487cf3650e7be21de31e69c167bb9dbc7b2b22e3d5c6ffc381d3c2c9168

Non-production files changed by this fix:
  - tests/context-admin.php
  - tests/context-lib.php
  - tests/context-migration.js
  - tests/context-preflight.php
  - deployed/sql/README.md
  - AGENTS.md
  - README.md
  - docs/STATUS.md
  - docs/plan/README.md
  - docs/plan/prompts/phase-map.md
  - docs/plan/owner-tool/next-steps.md
  - docs/plan/owner-tool/ot-10-release-and-handoff.md
  - this package handoff

Acceptance:
  - node tests/runner.js -> 47 PASS, 0 FAIL, 2 PENDING (49 fixtures).
  - node tests/unit.js -> 145 PASS, 0 FAIL.
  - node tests/owner-tool.js -> 38 PASS, 0 FAIL.
  - node tests/context-migration.js -> 12 PASS, 0 FAIL.
  - php tests/context-lib.php -> 13 PASS, 0 FAIL.
  - php tests/context-admin.php -> 19 PASS, 0 FAIL.
  - php tests/context-preflight.php -> 5 PASS, 0 FAIL.
  - php tests/php-render.php -> 9 PASS.
  - PHP 8.3.16 lint -> PASS for every changed production/test PHP file.
  - git diff --check -> PASS; CRLF conversion warnings are informational.
  - node tools/extract-bank.js --check -> only the documented pre-existing
    Windows/CRLF pre-2026 output-hash mismatch.

Excluded/unchanged artifacts:
  - db_conn.php is unchanged; the CLI wrapper compensates for its fixed web exit
    contract without changing it.
  - deployed/admin_question_context_fields.php and
    deployed/sql/base-schema.working.sql are unchanged by this fix.
  - Root supplied SQL and archive/sql copies remain byte-identical and unchanged.
  - The original Phase 6 review record was not edited.
  - Pre-existing dirty prompt/history/OT04 documentation and staged supplied SQL
    remain outside this fix; no unrelated change was reverted or attributed.
  - NOTE-1 through NOTE-3 were not accepted in the user's named finding scope.
  - No browser, live site, production database, write, delete, or cleanup action
    was performed.

Open/deferred:
  - OT10 executes successful preflight, forward, rerun, incompatible-object,
    position-only/slot-only rollback, and two-connection locking vectors on
    disposable MySQL 8.0.41, plus the real browser leading-LF check.
  - questions.practice_title and the OT06 practice writer/search gate are unchanged.

Review: required. The prior verdict was BLOCK and behavior changed; the re-review
  must explicitly close all ten accepted finding IDs.
Commit: deferred
Next: @docs/plan/prompts/review-session.md re-review phase 6
```

## Phase 6 Re-Review Fix Handoff — 2026-11-04

```text
Date: 2026-11-04
Accepted findings: BLOCK-3, BLOCK-6, BLOCK-7, and FIX-6 from
  docs/plan/reviews/owner-tool-2026-11-phase-6-re-review.md.
Result: PASS locally. The exact-schema, rollback-concurrency, Git-byte-safety,
  and cumulative-record defects are repaired. Successful MySQL execution remains
  OT10 evidence; no database or live-site operation was performed.
Exact package base: cd2e6c9. All cumulative counters below retain that base.

Evidence added before behavior:
  - node tests/context-migration.js -> 10 PASS, 3 FAIL: missing byte-preserving
    Git attributes, rollback table locks, and exact forward-migration checks.
  - php tests/context-preflight.php -> 5 PASS, 1 FAIL: wrong connection
    collation was still accepted before the extra-index/FK vectors could pass.

Finding resolution:
  - BLOCK-3: the real PHP validator now requires connection collation
    utf8mb4_unicode_ci and exact index/FK name sets. The forward SQL verifies the
    exact question_contexts column count/order/metadata, exact index row counts,
    visibility and ordered definitions, exact FK sets/actions, and trailing rows
    before any guarded skip.
  - BLOCK-6: rollback is now an outage-only operation requiring a verified
    maintenance/write freeze. It obtains WRITE locks on questions and
    question_contexts before the only guard/removal call, collapses question
    teardown into one ALTER, and rechecks question_contexts before dropping it.
  - BLOCK-7: path-specific .gitattributes rules disable text conversion, textual
    diff, and textual merge for both root and archived supplied SQL. The test
    proves raw and path-filtered Git blob IDs are identical for all six paths.
  - FIX-6: cd2e6c9 is now the persistent test and handoff base. The cumulative
    inventory includes deployed/admin_question_context_fields.php with its
    responsibility, deployment include, direct render test, size, and hash.

Cumulative production measurements from cd2e6c9:
  File                                             Add/Del  Lines  Bytes
  deployed/admin_questions.php                    94/61     1089  64488
  deployed/admin_context_actions.php              244/0      244   9860
  deployed/admin_context_data.php                 167/0      167   6495
  deployed/admin_context_management.php           134/0      134   9708
  deployed/admin_question_context_fields.php       28/0       28   2141
  deployed/admin_question_mutations.php           206/0      206   8833
  deployed/context_lib.php                        212/0      212   7970
  deployed/context_input_validation.php           137/0      137   5744
  deployed/context_activation_validation.php      138/0      138   5867
  deployed/sql/01-context-migration.sql            250/0      250  17423
  deployed/sql/02-context-rollback.sql              51/0       51   2026
  tools/context-migration-preflight.php             33/0       33   1146
  tools/context-migration-contract.php             248/0      248  12433
  tools/context-migration-inspector.php            175/0      175   8020
  admin_questions.php remains below 100 additions. Every new readable production
  file is at or below 250 lines. No exception was requested or used.

Responsibility, deployment, and direct evidence by production file:
  - deployed/admin_questions.php: web entry wiring; deployed directly;
    context-migration.js checks its hooks and context-admin.php executes targets.
  - deployed/admin_context_actions.php: context PRG transactions; required by
    the entry; context-admin.php executes the real dispatcher.
  - deployed/admin_context_data.php: strict link/page preparation; required by
    the entry; context-admin.php executes preparation and failure boundaries.
  - deployed/admin_context_management.php: query-free management view; included
    by the entry; context-admin.php renders the real fragment.
  - deployed/admin_question_context_fields.php: question-link view; included by
    the entry; context-admin.php renders the real fragment.
  - deployed/admin_question_mutations.php: atomic question writes/deletes;
    required by the entry; context-admin.php executes mutation/rollback paths.
  - deployed/context_lib.php: shared context queries/link checks; required by the
    entry; context-lib.php and context-admin.php execute it.
  - deployed/context_input_validation.php: input normalization/validation;
    included by context_lib.php; both context PHP suites execute it.
  - deployed/context_activation_validation.php: activation readiness;
    included by context_lib.php; both context PHP suites execute it.
  - deployed/sql/01-context-migration.sql: exact guarded forward migration;
    deployed by the SQL runbook; context-migration.js reads the real artifact,
    while direct MySQL execution remains OT10.
  - deployed/sql/02-context-rollback.sql: locked non-destructive rollback;
    deployed by the SQL runbook; context-migration.js reads the real lock/guard
    path, while direct two-connection MySQL execution remains OT10.
  - tools/context-migration-preflight.php: CLI entry; invoked by the runbook;
    context-preflight.php executes its real connector-failure path.
  - tools/context-migration-contract.php: exact metadata validator; required by
    the CLI; context-preflight.php executes valid and adversarial snapshots.
  - tools/context-migration-inspector.php: metadata collector/reporter; required
    by the CLI; context-preflight.php executes real grouping behavior.

Changed implementation/evidence SHA-256:
  - deployed/sql/01-context-migration.sql 8ad1a93a98ba1c4b9e1db61fcb31b1e3310c5d227249ac0e280c41b27561e2a6
  - deployed/sql/02-context-rollback.sql 23296969a92fa7b702392ef6394982f88046f6872baf7dc0185d92c268f1a6f0
  - tools/context-migration-contract.php cc86f5a2cfd9a48a58476a96fba155272972eed8b82271b60787b1fc28aa5936
  - .gitattributes 262c079ec11a5f49d4d20b107fb4dadf65422ab2f6f6610ad237859e6e31d715
  - deployed/sql/README.md dc2a4935123f0ede794fc83a3656610b98fdae793fe3ddabade141d4d2153eab
  - tests/context-migration.js 3028546c0ff49336dd830caf632fbcf1aeb67eed959c596d9f7558904abe0b29
  - tests/context-preflight.php 2981131bbfebe5076739a97d321843186d9b20a9099e50bf582d410dae3ab272
  - Unchanged production hashes remain those recorded in the preceding handoff;
    admin_question_context_fields.php is
    8af2d7931939167866b1da62d2b242914398c8aa8d4cfbd2071bc326fec90a9b.

Acceptance:
  - node tests/runner.js -> 47 PASS, 0 FAIL, 2 PENDING (49 fixtures).
  - node tests/unit.js -> 145 PASS, 0 FAIL.
  - node tests/owner-tool.js -> 38 PASS, 0 FAIL.
  - node tests/context-migration.js -> 13 PASS, 0 FAIL.
  - php tests/context-lib.php -> 13 PASS, 0 FAIL.
  - php tests/context-admin.php -> 19 PASS, 0 FAIL.
  - php tests/context-preflight.php -> 6 PASS, 0 FAIL.
  - php tests/php-render.php -> 9 PASS.
  - PHP 8.3.16 lint -> PASS for all 12 OT05 production/tool PHP files and all
    three context test PHP files.
  - git diff --check and git diff --cached --check -> PASS; ordinary line-ending
    conversion warnings remain informational for unrelated text files.
  - node tools/extract-bank.js --check -> only the documented pre-existing
    Windows/CRLF pre-2026 output-hash mismatch.

Excluded/supporting artifacts:
  - .gitattributes is repository configuration, not production code.
  - deployed/sql/README.md is the runbook; tests/context-migration.js and
    tests/context-preflight.php are evidence, not production modules.
  - Root supplied SQL, archive/sql snapshots, and manifest remain byte-identical
    and unchanged; their raw/path-filtered prospective repository blobs match.
  - deployed/sql/base-schema.working.sql remains the unchanged disposable fixture.
  - Both Phase 6 review records are unchanged. Pre-existing dirty prompt/history/
    OT04 documentation and staged supplied SQL remain outside this fix.
  - NOTE-1 through NOTE-3 remain outside the accepted finding scope.
  - No browser, live site, production database, write, delete, or cleanup action
    was performed.

Open/deferred:
  - OT10 executes successful preflight, forward/rerun, extra/trailing object
    rejection, and locked rollback contention on disposable MySQL 8.0.41.
  - questions.practice_title and the OT06 practice writer/search gate are unchanged.

Review: required. The prior verdict was BLOCK and migration/rollback behavior
  changed; re-review must explicitly close BLOCK-3, BLOCK-6, BLOCK-7, and FIX-6.
Commit: deferred
Next: @docs/plan/prompts/review-session.md re-review phase 6
```

## Phase 6 Second Re-Review Fix Handoff — 2026-11-04

```text
Date: 2026-11-04
Accepted findings: BLOCK-3 and BLOCK-6 from
  docs/plan/reviews/owner-tool-2026-11-phase-6-re-review-2.md.
Result: PASS locally. Exact index direction and CHECK metadata are now enforced,
  and rollback reacquires a write lock after MySQL's documented InnoDB ALTER
  lock-release boundary before its final guard/drop. Successful MySQL execution
  remains OT10 evidence; no database or live-site operation was performed.
Exact package base: cd2e6c9. All cumulative counters below retain that base.

Evidence added before behavior:
  - node tests/context-migration.js -> 10 PASS, 3 FAIL: missing post-ALTER
    rollback lock, CHECK inspection, and ascending-index predicates.
  - PHP 8.3.16 tests/context-preflight.php -> 4 PASS, 2 FAIL: descending index
    direction was accepted and inspector grouping discarded direction/checks.

Finding resolution:
  - BLOCK-3: the inspector now queries information_schema.statistics.COLLATION
    and TABLE_CONSTRAINTS/CHECK_CONSTRAINTS. The production contract requires
    every expected BTREE part to be ascending and rejects every unexpected CHECK
    constraint. The forward assertion applies the same direction and CHECK
    guards before CREATE TABLE IF NOT EXISTS or any named-object skip.
  - BLOCK-6: rollback now uses two guarded procedures. The first WRITE-lock phase
    guards and removes the question columns. Because that ALTER releases all
    explicit InnoDB table locks, the script then reacquires question_contexts
    WRITE before recounting and dropping that table. A writer that commits in
    the gap is detected and its table is preserved; a writer arriving after the
    second lock cannot commit data that the final drop silently removes.

Cumulative production measurements from cd2e6c9:
  File                                             Add/Del  Lines  Bytes
  deployed/admin_questions.php                    94/61     1089  64488
  deployed/admin_context_actions.php              244/0      244   9860
  deployed/admin_context_data.php                 167/0      167   6495
  deployed/admin_context_management.php           134/0      134   9708
  deployed/admin_question_context_fields.php       28/0       28   2141
  deployed/admin_question_mutations.php           206/0      206   8833
  deployed/context_lib.php                        212/0      212   7970
  deployed/context_input_validation.php           137/0      137   5744
  deployed/context_activation_validation.php      138/0      138   5867
  deployed/sql/01-context-migration.sql            250/0      250  17870
  deployed/sql/02-context-rollback.sql              64/0       64   2512
  tools/context-migration-preflight.php             33/0       33   1146
  tools/context-migration-contract.php             250/0      250  12720
  tools/context-migration-inspector.php            198/0      198   9050
  admin_questions.php remains below 100 additions. Every new readable production
  file remains at or below 250 lines. No exception was requested or used.

Responsibility, deployment, and direct evidence by production file:
  - deployed/admin_questions.php: web entry wiring; deployed directly;
    context-migration.js checks hooks and context-admin.php executes targets.
  - deployed/admin_context_actions.php: context PRG transactions; required by
    the entry; context-admin.php executes the real dispatcher.
  - deployed/admin_context_data.php: strict link/page preparation; required by
    the entry; context-admin.php executes preparation and failure boundaries.
  - deployed/admin_context_management.php: query-free management view; included
    by the entry; context-admin.php renders the real fragment.
  - deployed/admin_question_context_fields.php: question-link view; included by
    the entry; context-admin.php renders the real fragment.
  - deployed/admin_question_mutations.php: atomic question writes/deletes;
    required by the entry; context-admin.php executes mutation/rollback paths.
  - deployed/context_lib.php: shared context queries/link checks; required by the
    entry; context-lib.php and context-admin.php execute it.
  - deployed/context_input_validation.php: input normalization/validation;
    included by context_lib.php; both context PHP suites execute it.
  - deployed/context_activation_validation.php: activation readiness; included
    by context_lib.php; both context PHP suites execute it.
  - deployed/sql/01-context-migration.sql: exact guarded forward migration;
    deployed by the SQL runbook; context-migration.js reads the real artifact,
    while direct MySQL execution remains OT10.
  - deployed/sql/02-context-rollback.sql: two-phase guarded rollback; deployed by
    the SQL runbook; context-migration.js reads the real lock/guard path, while
    direct contention and execution remain OT10.
  - tools/context-migration-preflight.php: CLI entry; invoked by the runbook;
    context-preflight.php executes its real connector-failure path.
  - tools/context-migration-contract.php: exact metadata validator; required by
    the CLI; context-preflight.php executes valid and adversarial snapshots.
  - tools/context-migration-inspector.php: metadata collector/reporter; required
    by the CLI; context-preflight.php executes real direction/check grouping.

Changed implementation/evidence SHA-256:
  - deployed/sql/01-context-migration.sql e963b739a26f20e5b12db6525266b580c0472d494fd29a6fb44a3a3f076b55f7
  - deployed/sql/02-context-rollback.sql 047e11005acf8194c66151ebcc1a6510fd6983aab5643552ab9d3d064dbde694
  - tools/context-migration-contract.php 0030a46baed0eb6a62a94a0f1a22135e4c5964a7e35a3fdaa78c27bac2300427
  - tools/context-migration-inspector.php 619ed1bc57e51c1f1e48cecb54ecf878c32011b8b0610e180cd9fd343c134ef2
  - deployed/sql/README.md 7f474ffe65523a957b656db380e01520e30cc7a7373309754274700f5789e861
  - tests/context-migration.js c583f391c4669aa6833573f2fc018e05e1966265066680fad8e392b78a963212
  - tests/context-preflight.php af46ebb38e10c8d56add1e15671f7fa6c2659dc44b45677afa68f63547063c82

Acceptance:
  - node tests/runner.js -> 47 PASS, 0 FAIL, 2 PENDING (49 fixtures).
  - node tests/unit.js -> 145 PASS, 0 FAIL.
  - node tests/owner-tool.js -> 38 PASS, 0 FAIL.
  - node tests/context-migration.js -> 13 PASS, 0 FAIL.
  - php tests/context-lib.php -> 13 PASS, 0 FAIL.
  - php tests/context-admin.php -> 19 PASS, 0 FAIL.
  - php tests/context-preflight.php -> 6 PASS, 0 FAIL.
  - php tests/php-render.php -> 9 PASS.
  - PHP 8.3.16 lint -> PASS for all 12 OT05 production/tool PHP files and all
    three context test PHP files.
  - node tools/extract-bank.js --check -> only the documented pre-existing
    Windows/CRLF pre-2026 output-hash mismatch.

Excluded/supporting artifacts:
  - deployed/sql/README.md is the runbook; tests/context-migration.js and
    tests/context-preflight.php are evidence, not production modules.
  - Root supplied SQL, archive/sql snapshots, manifest, .gitattributes, and
    deployed/sql/base-schema.working.sql remain unchanged by this fix.
  - All three Phase 6 review records are unchanged. Pre-existing dirty prompt,
    history, OT04 documentation, and staged supplied SQL remain outside this fix.
  - BLOCK-7 and FIX-6 remain closed. NOTE-1 through NOTE-3 remain outside scope.
  - No browser, live site, production database, write, delete, or cleanup action
    was performed.

Open/deferred:
  - OT10 executes successful preflight, forward/rerun, descending-index and
    enforced-CHECK rejection, and rollback contention across the ALTER/relock
    boundary on disposable MySQL 8.0.41.
  - questions.practice_title and the OT06 practice writer/search gate are unchanged.

Review: required. The prior verdict was BLOCK and migration/rollback behavior
  changed; re-review must explicitly close BLOCK-3 and BLOCK-6.
Commit: deferred
Next: @docs/plan/prompts/review-session.md re-review phase 6
```

## Finding Lifecycle Correction - 2026-11-05

The third re-review remains immutable evidence, but it reused existing finding
IDs for defects outside the accepted fix scope. Applying the frozen finding
lifecycle prospectively and to current-facing state:

- `BLOCK-3` is closed. Its latest accepted closure contract was rejection of
  descending expected indexes and unexpected CHECK constraints in both the real
  preflight contract and the forward assertion. The third re-review confirms
  those vectors are repaired.
- `BLOCK-6` is closed. Its latest accepted closure contract was reacquiring the
  `question_contexts` write lock after MySQL's `ALTER TABLE` lock-release
  boundary and recounting before drop. The third re-review confirms that vector
  is repaired.
- The newly discovered partition defect is reassigned to `BLOCK-8`, the next
  unused blocker ID. Supported precondition: preflight and forward migration run
  against a MySQL 8.0.41 target whose otherwise supplied-shape `questions` table
  is partitioned. Closure criteria, if the owner chooses `fix`: inspect and
  reject partitioning in the real preflight snapshot/contract; reject it in the
  forward compatibility assertion before any DDL; add direct contract and real
  SQL-artifact evidence for the partitioned vector; retain the original package
  base and cumulative line limits. Successful target MySQL execution remains an
  OT10 non-goal for this local fix.
- The reconnect concern is reassigned to `NOTE-4`, the next unused note ID. It
  requires failure or violation of the runbook's mandatory verified
  maintenance/write freeze, so it does not invalidate rollback on the supported
  path. An exact `--skip-reconnect` invocation or server-side connection
  sentinel remains optional defense-in-depth hardening.

No review record was edited. At this correction point, `BLOCK-8` required
explicit owner disposition before commit readiness could change. `NOTE-4` is
non-blocking. OT06 remains independently blocked on the practice writer/importer
and reader/writer audit. The later owner disposition is recorded below.

## BLOCK-8 Owner Disposition - 2026-11-05

- **Finding:** `BLOCK-8`
- **Choice:** `reject`
- **Rationale:** Authoritative `questions.sql` defines an unpartitioned InnoDB
  `questions` table. The older root `questions1.sql` export independently shows
  the same column, index, engine, and collation shape under the table name
  `questions1`, also without partitioning. The supported `admin_questions.php`
  form performs row-level writes; partitioning requires explicit schema DDL, and
  no supported package path performs that out-of-contract change. The third
  re-review's partitioned-target precondition therefore does not describe the
  authoritative migration target, so it is not an unmet OT05 acceptance path.
- **Immutable evidence and residual risk:** No review record is changed. If an
  operator modifies a target out of band so that its otherwise supplied-shape
  `questions` table is partitioned, the current preflight and forward assertion
  do not reject that property before DDL, and the migration can fail after
  earlier DDL has committed. Such a target is outside the supported contract;
  this technical risk remains visible in the third re-review.
- **Effect:** The `BLOCK-8` workflow issue is closed. OT05 and Phase 6 are
  review-settled and commit-ready, but no commit was made. OT06's OT05 dependency
  is satisfied; OT06 remains independently blocked on the practice
  writer/importer and reader/writer search audit. Runtime migration execution
  remains deferred to OT10.
- **Destination:** none; this is a rejection, not a deferral.
- **Tests:** not run; this disposition changes documentation only.
- **Commit:** deferred.
- **Next:** none until the OT06 external gate is supplied.

## Remaining-Scope Correction And Commit Authorization - 2026-11-05

- The owner removed `cbt_practice.php` and `practice_title` from the remaining
  owner-tool cycle scope. Existing behavior stays unchanged; OT06 shared-context
  delivery targets `cbt.php` only.
- The former practice writer/importer requirement is no longer an OT06 gate.
  OT06 remains blocked only on the main-question reader/writer audit.
- The owner explicitly authorized the Phase 6 boundary commit. This package,
  its settled reviews/disposition, and the scope correction are included in that
  commit.
- No product behavior changed for this scope correction; documentation-only
  tests were not run.
- Next: audit the available production question readers and writers for OT06.
