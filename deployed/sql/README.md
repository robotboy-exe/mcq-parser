# Database Operations Runbook

Recorded: 2026-11-14; amended 2026-11-17 for EL01. Target runtime: PHP 8.3,
MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`.

This directory holds the ST01 migration artifacts for optional
`questions.constant_text` and the EL01 operation for the exact
`English (Lexis & Structure)` subject. **Do not import the supplied exports
directly into production.** Build a disposable, production-shaped database,
then run each forward operation and rollback there.

## Files

| File | Purpose |
|---|---|
| `base-schema.working.sql` | Working disposable-database build derived from the supplied DDL. The only supplied-name correction is `exam_category2` → `exam_category`. It now includes nullable `questions.constant_text`. |
| `01-constant-text.sql` | Forward migration: add nullable `constant_text` after `question_text`. Rerunnable; refuses an incompatible existing column. |
| `02-constant-text-rollback.sql` | Non-destructive rollback under a maintenance/write freeze. Refuses to drop a column that contains data. |
| `03-english-lexis-structure.sql` | Rerunnable exact-name subject insert/reactivation. Omits `id`, preserves an existing row's other fields, and refuses a collation-only collision or incompatible key contract. |
| `04-english-lexis-structure-rollback.sql` | Rerunnable rollback that deactivates only the byte-exact subject. It never deletes a subject, question, or attempt. |

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

## English Lexis subject operation

First execute the real operations against a disposable MySQL 8.0.41 server:

```sh
EL01_DISPOSABLE_MYSQL=1 \
MYSQL_BIN=mysql MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_USER=root \
bash tests/english-lexis-sql.sh
```

The harness refuses a non-8.0.41 server by default. It creates uniquely named
disposable databases, runs the real `03` and `04` files through absent,
inactive, active, rerun, collision, rollback, and incompatible-index cases,
then drops only those disposable databases.

After a verified backup, run the forward operation against the intended
database:

```sh
mysql --default-character-set=utf8mb4 <database> \
  < deployed/sql/03-english-lexis-structure.sql
mysql --default-character-set=utf8mb4 <database> -e \
  "SELECT id, subject_name, is_active FROM subjects WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');"
```

The result must contain exactly one active byte-exact row with a database-
generated ID. A case-, spacing-, or byte-different row that compares equal under
`utf8mb4_unicode_ci` is a stop condition; do not rename or overwrite it
automatically.

Rollback deactivates the exact row and is safe to rerun:

```sh
mysql --default-character-set=utf8mb4 <database> \
  < deployed/sql/04-english-lexis-structure-rollback.sql
```

Verify the row remains present with `is_active = 0`, and verify question and
attempt counts are unchanged. Never use either operation against production
without a separate owner instruction and a verified backup.
