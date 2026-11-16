# Deployment Manifest — Constant Text Reset (ST01) and Math Editor (ME01/ME02)

Recorded: 2026-11-14; amended 2026-11-15 for D-91 and 2026-11-16 for ME02
(D-92–D-94). Target: PHP 8.3, MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`. This
manifest covers ST01 (root `ocr_helper.js`, optional `questions.constant_text`,
the underline toolbar, and the read-only multiline preview) plus ME01/ME02 (the
math symbol palette and advisory UTF-8 byte counter on the admin form). It does
**not** authorize a production deploy.
A deploy needs a separate explicit owner instruction. See
[`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) for the architecture and
[`plan/owner-tool/st-01-constant-text-reset.md`](plan/owner-tool/st-01-constant-text-reset.md)
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

## 2. File manifest (12 production files + 3 ops)

Line counts are `wc -l`; bytes are LF-normalized UTF-8; SHA-256 is over the
LF-normalized content. Deploy PHP/JS assets to the site root preserving relative
paths. Deploy the SQL ops files to the ops directory, not the public web root.

| File | Lines / LF bytes | SHA-256 (LF) | Deploy to | Notes |
|---|---:|---|---|---|
| `deployed/admin_questions.php` | 1055 / 62646 | `883b56ee2bdbdb1309cdf02ca2237ec2ff1ca587cb0af9b483640f9f89786611` | site root | native form, Constant Text, session prefill; loads helper, underline, safe renderer, read-only preview, and the palette pair with `?v=1.0.0`; context code removed |
| `deployed/admin_question_store.php` | 113 / 4918 | `ff93f0c924159662f843ec83ed9e78c3815dc1549805a8c79a631f702577dc1b` | site root | extracted save/delete transaction; explicit columns; `constant_text` |
| `deployed/cbt.php` | 1085 / 47287 | `b969b52549067929982620cc5f994b432010492cc5d00a43754dc635cd3bb483` | site root | standalone delivery; Constant Text block; exact-`<u>` options; loads `src/owner-tool/render.js?v=2.3.2g` |
| `deployed/answer_details.php` | 255 / 12617 | `570bf960d21ab69c8a6c575e2c9410dfbef322d54c81f00b288b4e59e788deb3` | site root | Constant Text block; `cbt_format_text` options |
| `deployed/render.php` | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` | site root | server exact-marker renderer; unchanged |
| `ocr_helper.js` | 160 / 6284 | `c3e8e96eb2a295eb3ef0a8c0e87089b233cd026afe7fec664c7db16b17732193` | site root | review-settled D-91 spacing grammar and selected boundaries; no Constant Text integration; keeps blank-line paragraphs and folds single wraps |
| `src/underline-toolbar.js` | 136 / 4288 | `55f3d7f4953e44aac7d911e902b6deb413897e56b35d8669d607e6bab4a47315` | site root `src/` | runtime Underline button for Constant Text, question, and options; sits at the far right of the Question label row |
| `src/question-preview.js` | 104 / 3759 | `472c69fedda6353f5ee1f527b8f5b0591774cd7fd8c837bad1c910268020bec9` | site root `src/` | read-only Constant Text/Question preview; uses `window.CBTText` |
| `src/question-preview.css` | 37 / 711 | `cbcfc88582c8095bd9a75c7a96b21cb5a0d696069ef8d4c931354f6d6cc5f8e3` | site root `src/` | preview layout and `white-space: pre-wrap` |
| `src/math-tool.js` | 491 / 16127 | `e8045216b3753cf6c28800349e5e7a9d05759d04d1f2285bf1ade47d3eb67998` | site root `src/` | math symbol palette, custom fraction builder, and advisory byte counter for `#question_text`; no storage, network, submit, underline-marker, or `constant_text` behavior |
| `src/math-tool.css` | 200 / 3263 | `4782f4890a4753eff5201efe78d69d1c56113d2fe6f3f9a77d726fa8778c3101` | site root `src/` | palette, custom fraction row, drawer, counter, focus, and mobile-target styles |
| `src/owner-tool/render.js` | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` | site root `src/owner-tool/` | browser exact-`<u>` renderer; unchanged path |
| `deployed/sql/01-constant-text.sql` (ops) | 49 / 1719 | `7c3666af857f976f444013055e94b2599b85fabf1e050ae08ebda153c5d0cba4` | ops directory | guarded, rerunnable `constant_text` migration |
| `deployed/sql/02-constant-text-rollback.sql` (ops) | 38 / 1169 | `09b4293d88f8a4436839ccef740d70e00bbc085c8f49ec60fcc184bfca861d45` | ops directory | rollback; refuses non-empty data |
| `deployed/sql/README.md` (ops) | 81 / 3105 | `968f7178ad0db1024c7731fa8a85b728bdd8a33aaecf9b7bb50dc376c57cd1a6` | ops directory | runbook |

Do **not** deploy `deployed/sql/base-schema.working.sql`; it is repo-only test
support. Do not deploy any file under `archive/`.

## 3. Upload order

1. Back up files and the database.
2. Upload the six `src/` assets: `src/underline-toolbar.js`,
   `src/question-preview.js`, `src/question-preview.css`,
   `src/math-tool.js`, `src/math-tool.css`, and `src/owner-tool/render.js`
   (same paths; upload the current bytes).
3. Upload root `ocr_helper.js` and the PHP files: `render.php`,
   `admin_question_store.php`, `admin_questions.php`, `cbt.php`,
   `answer_details.php`.
4. Leave `cbt_practice.php` unchanged; it is outside ST01 scope and keeps its
   current `render.js?v=2.3.2c` token.
5. Cache handling: `admin_questions.php` loads root `ocr_helper.js`, the preview
   assets, and `src/underline-toolbar.js` without query tokens, and loads
   `src/math-tool.css?v=1.0.0` and `src/math-tool.js?v=1.0.0` (D-94). A standalone
   deployment must purge server/CDN caches, clear the site's browser cache, and
   verify the live helper and palette hashes. `cbt.php` keeps the unchanged
   `src/owner-tool/render.js?v=2.3.2g`; `cbt_practice.php` keeps `?v=2.3.2c` and
   is out of scope.
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
| Underline | select text in Constant Text, question, or an option; click Underline twice | first wraps in exact lowercase tags; second unwraps; the button sits at the far right of the Question label row on desktop and narrow screens |
| Preview | type multiline Constant Text and Question with exact `<u>` markers | read-only panel preserves blank lines, safely underlines exact markers, and has no editable controls |
| Helper labels | paste A-D uppercase/lowercase labels with and without whitespace after `(`, before `)`, and before `.` | every D-91 structural form loads with the same four option values and no missing-option flags |
| Helper boundary | paste `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` | Question is `Which is correct?`; Option A keeps `The notation A ) stays in option A`; B-D are `Two`/`Three`/`Four`; no duplicate warning solely for the internal `A )` |
| Helper isolation | prefill Constant Text, then load passage/cloze-shaped OCR | Constant Text remains byte-for-byte unchanged; any ordinary-question interpretation stays in Question/options with review flags |
| Palette | open Add a New Question and pick a quick-row symbol after placing the caret mid-text | the symbol lands at the remembered caret and no second Underline button appears |
| Palette drawer | click `More symbols` | `aria-expanded` becomes `true`, six categories render, and each category inserts a symbol |
| Palette custom fraction | in the Fractions category, enter numerator `3` and denominator `7`, then press Insert or Enter | `3/7` lands at the remembered caret, surrounding text and blank lines are unchanged, and Enter does not submit the form |
| Palette keyboard | Tab to a palette button and press Enter or Space | the focused symbol inserts; every control has an accessible name |
| Byte counter | paste or type multi-byte symbols and watch the counter | neutral below 57,000 bytes, amber at 57,000–59,999, red at 60,000+ with visible warning copy; nothing truncates and Save stays enabled |
| Byte counter refresh | click `Load questions`/`Skip` or reset the form | the counter matches the field's new UTF-8 byte count after the page's own fill, including red at 60,000+ |
| Tokens | view source of the admin page | exactly one `src/math-tool.css?v=1.0.0` link and one `src/math-tool.js?v=1.0.0` script, script after the preview script |
| CBT | open delivered questions with preserved constant text | passage renders above the question; `<u>` is real underline |
| Answer details | open an active question with constant text | passage renders above the question; stored `<script>`/`<img onerror>` stay text |
| Security | stored-XSS probe | no injected script runs; only exact underline markup renders |

Local disposable SQLite staging passed login, save with multiline Constant
Text, prefill, edit, update to `NULL`, logout clear, delete, and two-session
isolation. Disposable Chromium at 390px also passed preview rendering,
read-only/no-overflow checks, and OCR/Constant-Text isolation. That is local
evidence only; the MySQL migration and owner Brave/Android check remain required
before any live deploy. The third phase-1 re-review independently passed the
D-91 helper checks and settled ST01.

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
- any D-91 spaced or unspaced label form fails, or a later label-like repeat of
  an already selected letter replaces/resplits that option or alone raises the
  duplicate warning;
- any stored-XSS probe executes script or creates an attribute;
- the palette does not mount once on `#question_text`, inserts outside the
  caret, writes storage/network/submit state, or adds a second Underline
  button;
- the byte counter disagrees with the field's UTF-8 byte count after typing,
  OCR Load/Skip, or a reset, or it truncates text or disables Save;
- either math-editor asset is served without `?v=1.0.0` or returns 404;
- constant-text data exists when a rollback is attempted;
- the target lacks a verified backup, the live `cbt_db.php`, `header.php`,
  `footer.php`, or `cbt_exam_attempts`;
- the required Brave/Android check has not been performed on the final tree.

## 8. Known limitations and open gates

- Phase 1 is review-settled: the third re-review closed D-91 `FIX-1`, and
  `FIX-2` remains closed.
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
  phase. SQLite phone staging tested the application store against a prepared
  schema, not the MySQL migration script. Run forward, rerun, and rollback
  against a disposable production-shaped MySQL database before production.
- There is no automated browser suite. ST01 behavior is covered by Node/PHP
  checks, static assertions, one disposable Chromium check, and the required
  owner Brave/Android check. ME01/ME02 add 20 module vectors, a local disposable
  SQLite staging run, and a desktop Chromium check; the owner Brave/Android check
  on the final tree is still required before any live deploy.
- `maxlength="60000"` counts UTF-16 code units while the server checks UTF-8
  bytes. The editor counter is advisory (D-93): it can show red before typing is
  blocked, or typing can stop before 60,000 bytes. Nothing was changed to
  reconcile the two limits.
- Palette insertion prefers `execCommand('insertText')` for undo support and
  falls back to `setRangeText` then `.value`; undo is browser-dependent on the
  fallback paths (D-92).
- The `bank-2021` final question still raises a duplicate-C flag from its OCR
  answer-key text; this is pre-existing and not a missing-option regression.
- This package does not deploy to production, clean live data, or archive the
  cycle. Those need explicit owner instructions.
