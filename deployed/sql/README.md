# OT05 Context Schema Runbook

Recorded: 2026-11-03. Target runtime: PHP 8.3, MySQL 8.0.41, InnoDB,
`utf8mb4_unicode_ci`.

This directory holds the migration artifacts for the owner-tool shared-context
schema. **Do not import the supplied exports directly into production.** Build a
disposable, production-shaped database for OT10, then run the forward migration
and rollback there.

## Files

| File | Purpose |
|---|---|
| `base-schema.working.sql` | Working disposable-database build derived from the supplied DDL. The only correction is `exam_category2` → `exam_category`. |
| `01-context-migration.sql` | Forward migration: `question_contexts`, question context columns, unique membership keys, restricted foreign keys. Rerunnable. |
| `02-context-rollback.sql` | Non-destructive rollback under a mandatory maintenance/write freeze and two guarded write-lock phases. Refuses populated data. |
| `../../tools/context-migration-preflight.php` | CLI wrapper; connector/query failures exit nonzero. |
| `../../tools/context-migration-contract.php` | Canonical supplied and applied column, index, and foreign-key definitions. |
| `../../tools/context-migration-inspector.php` | Collects real session and `information_schema` metadata and prints the report. |

The unchanged originals and their hashes are archived at
`archive/sql/2026-11-03-supplied/` (`manifest.json`). The working copy contains
no `exam_category2` reference.

## Confirmed runtime facts

- Application target: PHP 8.3.
- Database: MySQL 8.0.41.
- Engine: InnoDB.
- Charset/collation: `utf8mb4` / `utf8mb4_unicode_ci`.
- Connection contract: root `db_conn.php` (charset `utf8mb4`, PDO exceptions,
  associative fetches, native prepares). The phpMyAdmin PHP 8.4.27 export header
  describes the exporter, not the website runtime.

## Before any migration test

1. Use an isolated disposable database. Never point this at production.
2. Create the backup (for an existing database):

   ```sh
   mysqldump --single-transaction --routines --triggers \
     --default-character-set=utf8mb4 <database> > context-migration-backup.sql
   ```

3. Run the preflight with the documented connection environment:

   ```sh
   CBT_DB_HOST=... CBT_DB_NAME=... CBT_DB_USER=... CBT_DB_PASS=... \
     php tools/context-migration-preflight.php
   ```

   The preflight process must exit 0 **and** print literal `PREFLIGHT OK`. Any
   other exit status or output is a hard stop. It reports and validates:

   - server version and current database;
   - actual `@@session.sql_mode`;
   - exact connection and database charset/collation;
   - `SHOW CREATE TABLE` for the base tables and `question_contexts`;
   - exact column types, nullability, defaults, extras, character metadata, and
     the supplied `correct_option` comment;
   - the exact index name set, uniqueness, ordered columns and directions, type,
     visibility, prefixes, and expressions;
   - absence of unexpected `CHECK` constraints;
   - the exact foreign-key name set, local/reference columns, and exact
     `ON UPDATE RESTRICT` / `ON DELETE RESTRICT` actions;
   - whether the context migration is absent, partial, or already applied;
   - the recorded `questions.practice_title` mismatch.

   It does not ask for credentials interactively.

## Disposable build

Import in dependency order:

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/base-schema.working.sql
mysql --default-character-set=utf8mb4 <database> < deployed/sql/01-context-migration.sql
```

Then rerun the preflight; it must report the migration as already applied.

## Forward migration on an existing database

1. Complete the backup and preflight above.
2. Import `deployed/sql/01-context-migration.sql`.
3. Re-run the preflight and confirm `already applied (rerun safe)`.
4. Confirm existing questions are unchanged:

   ```sql
   SELECT COUNT(*) FROM questions;
   SELECT COUNT(*) FROM questions WHERE context_id IS NOT NULL;
   ```

   The second count must be 0 after migration; existing questions stay
   selectable through the legacy `is_active = 1` queries.

## Rerun behavior

`01-context-migration.sql` checks `information_schema` before each change:
`CREATE TABLE IF NOT EXISTS`, exact context column and object sets, index row
counts/order/direction/visibility, absence of unexpected `CHECK` constraints,
and foreign-key names/actions. Before any guarded skip, it signals an error for
an extra, missing, trailing, or incompatible context object. A second run
performs no destructive operation and no data change.

## Publication and rollback safety

- Linked questions are forced to `is_active = 0` by the admin.
- A context activates only after atomic validation of the expected member count,
  contiguous unique positions, required cloze slots, four options/correct answer,
  matching pool metadata, and every member staying inactive.
- The legacy candidate queries select `is_active = 1`, so they cannot expose a
  linked question without its context.
- `question_contexts` and `questions.context_id` use `ON DELETE RESTRICT`.
- Deleting, editing, moving, or unlinking a member deactivates its context until
  it is revalidated.

## Rollback

Rollback is an outage operation. Before opening the rollback client session:

1. Put the site in maintenance mode and stop every web worker, importer, cron
   job, and CLI process that can write `questions` or `question_contexts`.
2. Verify that no such writer remains. If a complete maintenance/write freeze
   cannot be established, do not run the rollback.
3. Run the exact-applied preflight and create the backup. A partial schema is a
   manual recovery case; do not use the automatic rollback for it.
4. Keep the write freeze in place until rollback finishes and the post-rollback
   preflight reports `not applied (ready)`.

Run `02-context-rollback.sql` in one uninterrupted MySQL client session with an
account that has `LOCK TABLES`, routine, `ALTER`, and `DROP` privileges. The
script uses two guarded removal procedures and two lock phases:

- if any `question_contexts` row exists, or any `questions.context_id`,
  `questions.context_position`, or `questions.context_slot` value is non-null,
  it raises SQLSTATE `45000` and stops;
- the first `WRITE` locks protect that guard through the single `questions`
  alteration;
- MySQL documents that `ALTER TABLE` releases the first explicit table locks on
  transactional InnoDB tables, so the script reacquires
  `question_contexts WRITE` immediately afterward;
- after the second lock is acquired, it checks `question_contexts` again before
  dropping that table;
- it never drops populated context data silently.

A writer that commits a context row after the `ALTER` releases the first locks
but before the second lock is acquired is caught by the second count, and the
table is preserved. A writer that reaches the table after the second lock waits
and cannot commit a row that the final drop silently removes. A second-guard
failure leaves a partial rollback with its context data intact; stop and restore
or investigate from the backup while maintenance mode remains active.

Do not use the MySQL client's `--force` option. Each removal and its data guard
share one stored procedure, and the corresponding table lock brackets that
call. If any statement fails, stop, retain the maintenance freeze, and restore
or investigate from the backup; do not continue manually with later statements.

If the guard passes, it drops the OT05 foreign key, indexes, and three context
columns, then drops `question_contexts`. It never drops `questions`, `subjects`,
`exam_category`, or the database.

If context data exists, export it for review first. Removing that live data is a
separate owner-authorized action; the automatic rollback does not do it.

## Deferred to OT10

OT05 writes these artifacts. OT10 executes the preflight, forward migration,
rerun, and rollback on a disposable production-shaped database, and runs PHP lint
and renderer checks on the target runtime. No OT05 completion gate depends on
those runtime executions.
