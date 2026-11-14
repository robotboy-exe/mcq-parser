# Deployment Manifest — Constant Text Reset (ST01)

Recorded: 2026-11-14. Target: PHP 8.3, MySQL 8.0.41, InnoDB,
`utf8mb4_unicode_ci`. This manifest covers ST01: root `ocr_helper.js`,
optional `questions.constant_text`, the underline toolbar, and the read-only
multiline preview. It does **not**
authorize a production deploy. A deploy needs a separate explicit owner
instruction. See [`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) for the architecture
and [`plan/owner-tool/st-01-constant-text-reset.md`](plan/owner-tool/st-01-constant-text-reset.md)
for the package contract.

## 1. Before you start

1. Confirm the target runtime: PHP 8.3.x, MySQL 8.0.41, InnoDB,
   `utf8mb4_unicode_ci`.
2. Confirm the target already has the live `cbt_db.php`, `header.php`,
   `footer.php`, and `cbt_exam_attempts` table. They are live-site artifacts and
   are not part of this release. Do **not** deploy the phone-staging tooling
   (`tools/phone-staging/`, `tools/start-phone-staging.sh`,
   `tools/stop-phone-staging.sh`) or its SQLite shim.
3. Confirm the connection collation. On MySQL 8.0.41 a PDO
   `charset=utf8mb4` connection alone reports `utf8mb4_general_ci`. The target
   `cbt_db.php`/server must set the session collation
   (`SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` or equivalent).
4. Confirm `questions.practice_title` accepts the admin INSERT. The supplied DDL
   is `NOT NULL` with no default, while the admin INSERT omits it (known
   out-of-scope mismatch). On a strict target a native save fails with
   `Field 'practice_title' doesn't have a default value`. Verify with a
   disposable row, or confirm the live column already has a default. Do not
   change the column as part of this release.
5. Take a verified backup:

   ```sh
   mysqldump --single-transaction --routines --triggers \
     --default-character-set=utf8mb4 <database> > st01-backup.sql
   ```

6. Put the site in maintenance mode and stop every web worker, importer, cron
   job, and CLI process that can write `questions`.

## 2. File manifest (10 production files + 3 ops)

Line counts are `wc -l`; bytes are LF-normalized UTF-8; SHA-256 is over the
LF-normalized content. Deploy PHP/JS assets to the site root preserving relative
paths. Deploy the SQL ops files to the ops directory, not the public web root.

| File | Lines / LF bytes | SHA-256 (LF) | Deploy to | Notes |
|---|---:|---|---|---|
| `deployed/admin_questions.php` | 1053 / 62540 | `7677a0bcb920dd932be4462be0f838adf8935a1681effeba118c5272ad1ce4ff` | site root | native form, Constant Text, session prefill; loads helper, underline, safe renderer, and read-only preview; context code removed |
| `deployed/admin_question_store.php` | 113 / 4918 | `ff93f0c924159662f843ec83ed9e78c3815dc1549805a8c79a631f702577dc1b` | site root | extracted save/delete transaction; explicit columns; `constant_text` |
| `deployed/cbt.php` | 1085 / 47287 | `b969b52549067929982620cc5f994b432010492cc5d00a43754dc635cd3bb483` | site root | standalone delivery; Constant Text block; exact-`<u>` options; loads `src/owner-tool/render.js?v=2.3.2g` |
| `deployed/answer_details.php` | 255 / 12617 | `570bf960d21ab69c8a6c575e2c9410dfbef322d54c81f00b288b4e59e788deb3` | site root | Constant Text block; `cbt_format_text` options |
| `deployed/render.php` | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` | site root | server exact-marker renderer; unchanged |
| `ocr_helper.js` | 143 / 5612 | `0649b01eff825456db6c52b44d396dd9190775dbf4ad0144002c998ecd72eba8` | site root | production helper; new `a)`/`(a)` label parsing; no Constant Text integration; keeps blank-line paragraphs and folds single wraps |
| `src/underline-toolbar.js` | 128 / 3898 | `3953bc960fbcc58d285c863c2cb049fbfc8ff82a1c4ff884b7c135b83fe0f017` | site root `src/` | runtime Underline button for Constant Text, question, and options |
| `src/question-preview.js` | 104 / 3759 | `472c69fedda6353f5ee1f527b8f5b0591774cd7fd8c837bad1c910268020bec9` | site root `src/` | read-only Constant Text/Question preview; uses `window.CBTText` |
| `src/question-preview.css` | 37 / 711 | `cbcfc88582c8095bd9a75c7a96b21cb5a0d696069ef8d4c931354f6d6cc5f8e3` | site root `src/` | preview layout and `white-space: pre-wrap` |
| `src/owner-tool/render.js` | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` | site root `src/owner-tool/` | browser exact-`<u>` renderer; unchanged path |
| `deployed/sql/01-constant-text.sql` (ops) | 49 / 1719 | `7c3666af857f976f444013055e94b2599b85fabf1e050ae08ebda153c5d0cba4` | ops directory | guarded, rerunnable `constant_text` migration |
| `deployed/sql/02-constant-text-rollback.sql` (ops) | 38 / 1169 | `09b4293d88f8a4436839ccef740d70e00bbc085c8f49ec60fcc184bfca861d45` | ops directory | rollback; refuses non-empty data |
| `deployed/sql/README.md` (ops) | 81 / 3105 | `968f7178ad0db1024c7731fa8a85b728bdd8a33aaecf9b7bb50dc376c57cd1a6` | ops directory | runbook |

Do **not** deploy `deployed/sql/base-schema.working.sql`; it is repo-only test
support. Do not deploy any file under `archive/`.

## 3. Upload order

1. Back up files and the database.
2. Upload the four `src/` assets: `src/underline-toolbar.js`,
   `src/question-preview.js`, `src/question-preview.css`, and
   `src/owner-tool/render.js` (unchanged bytes, same path).
3. Upload root `ocr_helper.js` and the PHP files: `render.php`,
   `admin_question_store.php`, `admin_questions.php`, `cbt.php`,
   `answer_details.php`.
4. Leave `cbt_practice.php` unchanged; it is outside ST01 scope and keeps its
   current `render.js?v=2.3.2c` token.
5. Cache-busting: `admin_questions.php` loads root `ocr_helper.js`, the preview
   assets, and `src/underline-toolbar.js` without query tokens. `cbt.php` keeps
   `src/owner-tool/render.js?v=2.3.2g`. ME02 must assign final tokens before any
   upload and update every page that loads a changed asset.
6. Run the Constant Text migration:
   - `php -l` every changed PHP file;
   - `mysql --default-character-set=utf8mb4 <database> < deployed/sql/01-constant-text.sql`;
   - confirm `SHOW COLUMNS FROM questions LIKE 'constant_text';` shows `text`,
     `YES` null, no default, `utf8mb4_unicode_ci`;
   - rerun `01-constant-text.sql`; it must be a no-op.
7. Run the smoke checks. Exit maintenance mode only after they pass.

## 4. Migration and rollback commands

The forward migration is rerunnable and performs no data change. The rollback
refuses to drop a column containing data.

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/01-constant-text.sql
mysql --default-character-set=utf8mb4 <database> -e \
  "SHOW COLUMNS FROM questions LIKE 'constant_text';"

# Rollback only after confirming every constant_text is NULL.
mysql --default-character-set=utf8mb4 <database> -e \
  "SELECT COUNT(*) FROM questions WHERE constant_text IS NOT NULL AND constant_text <> '';"
mysql --default-character-set=utf8mb4 <database> < deployed/sql/02-constant-text-rollback.sql
```

`01-constant-text.sql` creates `cbt_assert_constant_text_compatible`, checks the
column type, nullability, default, extra, charset/collation, and comment, and
faults if an existing column disagrees. `02-constant-text-rollback.sql` creates
`cbt_drop_empty_constant_text` and faults if any row has content. Never use
`mysql --force`.

## 5. Smoke checks

| Area | Check | Expected |
|---|---|---|
| Migration | run `01-constant-text.sql`, inspect, rerun | column exists as nullable `TEXT`; second run is a no-op |
| Admin | log in, open Add a New Question | Constant Text textarea present; empty by default; no context fields |
| Admin | enter a passage, question, four options, then Save | exact flash `Question saved successfully (Question ID: …).`; one new row with the passage |
| Admin | open a new Add page in the same session | the last successfully saved passage prefills; question/options are empty |
| Admin | open the saved row's Edit page | the row's passage appears; formatting is exact `<u>` |
| Admin | log out and back in | Constant Text on a new Add page is empty |
| Underline | select text in Constant Text, question, or an option; click Underline twice | first wraps in exact lowercase tags; second unwraps |
| Preview | type multiline Constant Text and Question with exact `<u>` markers | read-only panel preserves blank lines, safely underlines exact markers, and has no editable controls |
| Helper | paste 4 questions using `a)`, `(a)`, `(A).`, and `A.` | all load; no missing-option flags |
| Helper isolation | prefill Constant Text, then load passage/cloze-shaped OCR | Constant Text remains byte-for-byte unchanged; any ordinary-question interpretation stays in Question/options with review flags |
| CBT | open delivered questions with preserved constant text | passage renders above the question; `<u>` is real underline |
| Answer details | open an active question with constant text | passage renders above the question; stored `<script>`/`<img onerror>` stay text |
| Security | stored-XSS probe | no injected script runs; only exact underline markup renders |

Local disposable SQLite staging passed login, save with multiline Constant
Text, prefill, edit, update to `NULL`, logout clear, delete, and two-session
isolation. Disposable Chromium at 390px also passed preview rendering,
read-only/no-overflow checks, and OCR/Constant-Text isolation. That is local
evidence only; the MySQL migration and owner Brave/Android check remain required
before any live deploy.

## 6. Rollback order

1. Re-enter maintenance mode and stop every writer.
2. Take a fresh verified backup.
3. If any `constant_text` is non-empty, do **not** run the automatic rollback.
   Restore the verified backup and the previous code, then investigate.
4. If no content exists, run `02-constant-text-rollback.sql`; confirm the column
   is gone.
5. Restore the previous `src/`, root `ocr_helper.js`, and `deployed/` files in
   reverse upload order.
6. Exit maintenance mode only after the post-rollback smoke checks pass.

## 7. Stop conditions

Stop and do not continue on the first mismatch:

- the column type, nullability, default, extra, or collation differs from the
  expected contract;
- the forward migration or rerun faults;
- any PHP fatal error, parse error, or unexpected warning appears;
- the native save flash is not the exact success text, or the row count does not
  increase by exactly one;
- the session prefill leaks across sessions, survives logout, or overwrites an
  edit row;
- any stored-XSS probe executes script or creates an attribute;
- constant-text data exists when a rollback is attempted;
- the target lacks a verified backup, the live `cbt_db.php`, `header.php`,
  `footer.php`, or `cbt_exam_attempts`;
- the required Brave/Android check has not been performed on the final tree.

## 8. Known limitations and open gates

- `practice_title` is `NOT NULL` with no default in the supplied DDL, and the
  admin INSERT omits it. This is a known out-of-scope mismatch. Verify the
  target before deploying; do not change the column in this release.
- The connection collation is a deployment prerequisite. PDO `charset=utf8mb4`
  alone is not sufficient on MySQL 8.0.41.
- `header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts,
  not supplied. Do not deploy inferred local shims.
- `cbt_practice.php` does not render Constant Text in ST01 and remains
  intentionally untouched.
- The ST01 schema migration has not been executed against a MySQL server in this
  phase; it was exercised only through the disposable SQLite phone-staging
  store. Run it against a disposable MySQL database first when one is available.
- There is no automated browser suite. ST01 behavior is covered by Node/PHP
  checks, static assertions, one disposable Chromium check, and the required
  owner Brave/Android check.
- The `bank-2021` final question still raises a duplicate-C flag from its OCR
  answer-key text; this is pre-existing and not a missing-option regression.
- This package does not deploy to production, clean live data, or archive the
  cycle. Those need explicit owner instructions.
