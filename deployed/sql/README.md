# Constant Text Schema Runbook

Recorded: 2026-11-14. Target runtime: PHP 8.3, MySQL 8.0.41, InnoDB,
`utf8mb4_unicode_ci`.

This directory holds the ST01 migration artifacts for the optional
`questions.constant_text` passage. **Do not import the supplied exports directly
into production.** Build a disposable, production-shaped database, then run the
forward migration and rollback there.

## Files

| File | Purpose |
|---|---|
| `base-schema.working.sql` | Working disposable-database build derived from the supplied DDL. The only supplied-name correction is `exam_category2` → `exam_category`. It now includes nullable `questions.constant_text`. |
| `01-constant-text.sql` | Forward migration: add nullable `constant_text` after `question_text`. Rerunnable; refuses an incompatible existing column. |
| `02-constant-text-rollback.sql` | Non-destructive rollback under a maintenance/write freeze. Refuses to drop a column that contains data. |

The unchanged supplied originals and their hashes are archived at
`archive/sql/2026-11-03-supplied/` (`manifest.json`). The working copy contains
no `exam_category2` reference.

## Confirmed runtime facts

- Application target: PHP 8.3.
- Database: MySQL 8.0.41.
- Engine: InnoDB.
- Charset/collation: `utf8mb4` / `utf8mb4_unicode_ci`.
- Connection contract: root `db_conn.php` (charset `utf8mb4`, PDO exceptions,
  associative fetches, native prepares).

## Disposable build

Import in dependency order:

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/base-schema.working.sql
```

The base schema already contains `constant_text`. To test the forward migration
on a base without it, create a copy without that column, then run:

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/01-constant-text.sql
```

A second run must be a no-op.

## Forward migration on an existing database

1. Use an isolated disposable database. Never point this at production.
2. Back up an existing database:
   ```sh
   mysqldump --single-transaction --routines --triggers \
     --default-character-set=utf8mb4 <database> > constant-text-backup.sql
   ```
3. Import `deployed/sql/01-constant-text.sql`.
4. Confirm existing questions are unchanged:
   ```sql
   SELECT COUNT(*) FROM questions;
   SELECT COUNT(*) FROM questions WHERE constant_text IS NOT NULL;
   ```
   The second count is 0 after a fresh migration; existing rows are untouched.

## Rerun behavior

The script checks `information_schema` before changing anything. If
`constant_text` is absent it adds the nullable column. If it is present and
compatible, the `ALTER` is skipped. An incompatible existing column raises
SQLSTATE `45000` and stops.

## Rollback

Rollback is an outage operation. Put the site in maintenance mode and stop every
writer before running it. The script refuses to drop the column if any row has a
non-empty value; export and remove that data explicitly first. It never drops
`questions`, `subjects`, `exam_category`, or the database.

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/02-constant-text-rollback.sql
```
