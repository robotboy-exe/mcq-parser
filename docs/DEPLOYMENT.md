# Deployment Manifest — Constant Text, Math Editor, and English Lexis

Recorded: 2026-11-14; amended through 2026-11-19 for D-91–D-108. Target: PHP
8.3, MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`. This
manifest covers ST01 (root `ocr_helper.js`, optional `questions.constant_text`,
the underline toolbar, and the read-only multiline preview) plus ME01/ME02/MS01 (the
operator row, five freeform math-shape editors, the non-shape `More symbols`
drawer, and advisory UTF-8 byte counter on the admin form) and EL01
(the exact English Lexis subject operation and post-selection Constant Text
grouping). It does **not** authorize a production deploy.
A deploy needs a separate explicit owner instruction. See
[`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) for the architecture and
[`plan/owner-tool/st-01-constant-text-reset.md`](plan/owner-tool/st-01-constant-text-reset.md)
for the package contract.

**Supplied sources at the repository root are evidence only.** The release
line carries `admin_questions.php`, `answer_details.php`, `cbt.php`, and
`cbt_practice.php` at the repository root because `main` supplied them as the
byte-exact live snapshots; they are identical to
`archive/live-sources/*-2026-10-31.php`. They are not release files, are not in
the table below, and must not be uploaded. `deployed/` remains the deployment
set, and `cbt_practice.php` is still not part of this release.

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

## 2. File manifest (15 production files + 5 ops)

Line counts are `wc -l`; bytes are LF-normalized UTF-8; SHA-256 is over the
LF-normalized content. Deploy PHP/JS assets to the site root preserving relative
paths. Deploy the SQL ops files to the ops directory, not the public web root.

| File | Lines / LF bytes | SHA-256 (LF) | Deploy to | Notes |
|---|---:|---|---|---|
| `deployed/admin_questions.php` | 1057 / 62877 | `388d38532c83aece6944da1fddcad72bfa5b748f5231df38a92a73ad36771f99` | site root | native form, Constant Text, session prefill, authenticated exact PDO save diagnostics, and the D-108 subject display alias; the helper token is bumped whenever the helper bytes change or its core pin rotates (`2.4.8` carries the missing-core guard and the `2.5.5` core pin; the phase-3 review fix rotated it from `2.4.7`); loads `src/parser/core.js?v=2.5.5` before the thin `ocr_helper.js?v=2.4.8` adapter, underline, the renderer as `?v=2.3.4`, the read-only preview as `question-preview.css?v=1.1.3`, `math-tool.js?v=1.1.2`, and `math-tool.css?v=1.1.1`; context code removed |
| `deployed/admin_question_store.php` | 113 / 4918 | `ff93f0c924159662f843ec83ed9e78c3815dc1549805a8c79a631f702577dc1b` | site root | extracted save/delete transaction; explicit columns; `constant_text` |
| `deployed/cbt.php` | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | site root | standalone delivery; existing limited selection plus EL01 post-fetch ordering; aliased subject displays; Constant Text weight 800 and question weight 700; marker options; inline full-width fraction/connected-root/matrix rules; loads `src/owner-tool/render.js?v=2.3.4` |
| `deployed/cbt_question_order.php` | 56 / 1444 | `5c0a9b8c125b4a1d72737b3e9a532d6e386c50b7455ba8e1f1df39c122547fb7` | site root beside `cbt.php` | exact trusted-subject grouped display ordering only; members restored to ascending original `id`, shuffled groups, blank singletons |
| `deployed/subject_display.php` | 12 / 386 | `3f8ce0e86787a66d90b8d87fcd0295ac3c7629f899202443068dfd019b044537` | site root beside `admin_questions.php` and `cbt.php` | exact persisted-name to frontend-label mapping only; no database access or mutation |
| `deployed/answer_details.php` | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | site root | Constant Text block; `cbt_format_text` options; inline full-width fraction/connected-root/matrix rules |
| `deployed/render.php` | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | site root | server marker renderer for the six exact pairs, including the crossed-marker literal guard; consumed by the shared parity vectors |
| `ocr_helper.js` | 127 / 4917 | `86497f4d0686c745cb06639759f4e8f7f17bcc3dc8c5059cde3af0d5f8cfdf3b` | site root | thin adapter over `src/parser/core.js`; exports the core's `FIXES`, `OPTION`, `splitQuestions`, `splitRegions`, and `parseQuestion` and owns only `parseAll`, the queue panel, and `fillForm`; requires core version `2.5.5` and renders a visible `#ocr_error` banner plus an uncaught error when `window.OCRParser` is missing or mismatched; no parser implementation and no Constant Text integration |
| `src/parser/core.js` | 1829 / 64452 | `42739697bf82c10364c6d7d3d975bb786e575b650a0e581da013e955c03146f2` | site root `src/` | canonical pure parser, version 2.5.5: four-stage region model, D-91 option grammar, scoped complete-ordered `(a)`-`(d)` sets where one mixed-case parenthesized A-D set selects the first occurrence of every letter, spaced-initialism guard (D-111) that ends a run at a real option line and restores a covered label when its letter has no other candidate, structural-option flag, comprehension and cloze engines; no DOM, storage, network, or Constant Text write |
| `src/underline-toolbar.js` | 136 / 4288 | `55f3d7f4953e44aac7d911e902b6deb413897e56b35d8669d607e6bab4a47315` | site root `src/` | runtime Underline button for Constant Text, question, and options; sits at the far right of the Question label row |
| `src/question-preview.js` | 104 / 3759 | `472c69fedda6353f5ee1f527b8f5b0591774cd7fd8c837bad1c910268020bec9` | site root `src/` | read-only Constant Text/Question preview; uses `window.CBTText` |
| `src/question-preview.css` | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | site root `src/` | preview layout, fixed-height scrollable Constant Text box, `white-space: pre-wrap`, full-width fraction bar, joined radical, and 2×2 matrix grid; loaded as `?v=1.1.3` |
| `src/math-tool.js` | 660 / 21427 | `1cd92542ee44c9736ea06773478032faf3ab0df50f8263e366869dee1ff24719` | site root `src/` | seven basic operators, five freeform shape editors emitting exact markers, a `More symbols` drawer with only the Greek, set theory and logic, and geometry and vectors grids, and advisory byte counter for `#question_text`; the visual Root editor is the only square-root control; no storage, network, submit, underline-marker, or `constant_text` behavior |
| `src/math-tool.css` | 255 / 4118 | `fb87dbd9b0654140c3673c338b035a7ea8470274a6485374de8267f54129780f` | site root `src/` | operator row, symbol drawer, shape panels, 2×2 matrix input grid, preview, hint, counter, focus, and mobile-target styles; the toggle rule follows the shared button rule so its size and colour win |
| `src/owner-tool/render.js` | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | site root `src/owner-tool/` | browser renderer for the six exact marker pairs, including fraction/root/matrix nodes and the crossed-marker literal guard; unchanged path, loaded as `?v=2.3.4` |
| `deployed/sql/01-constant-text.sql` (ops) | 49 / 1719 | `7c3666af857f976f444013055e94b2599b85fabf1e050ae08ebda153c5d0cba4` | ops directory | guarded, rerunnable `constant_text` migration |
| `deployed/sql/02-constant-text-rollback.sql` (ops) | 38 / 1169 | `09b4293d88f8a4436839ccef740d70e00bbc085c8f49ec60fcc184bfca861d45` | ops directory | rollback; refuses non-empty data |
| `deployed/sql/03-english-lexis-structure.sql` (ops) | 82 / 2728 | `b7653537170f6e631c8d5715cf9db18052483ea2515d4386bf86c5dd56ce981f` | ops directory | guarded exact-name insert/reactivation; generated ID |
| `deployed/sql/04-english-lexis-structure-rollback.sql` (ops) | 69 / 2204 | `519021bc96c886c39e39a54e6a2db214c2949fc5bb1e0891ead931f1a2740a07` | ops directory | exact-name deactivation; no deletes |
| `deployed/sql/README.md` (ops) | 125 / 5103 | `1f731a668bbd1f17435949d8e5888c15f06b4bc51bd35f8c73383be356871b5c` | ops directory | schema and subject-operation runbook |

Do **not** deploy `deployed/sql/base-schema.working.sql`; it is repo-only test
support. Do not deploy any file under `archive/`.

## 3. Upload order

1. Back up files and the database.
2. Upload the seven `src/` assets: `src/parser/core.js`,
   `src/underline-toolbar.js`, `src/question-preview.js`,
   `src/question-preview.css`, `src/math-tool.js`, `src/math-tool.css`, and
   `src/owner-tool/render.js` (same paths; upload the current bytes). The core
   must be present before the page loads; without it the helper stays inert.
3. Upload root `ocr_helper.js` and the PHP files: `render.php`,
   `admin_question_store.php`, `subject_display.php`, `admin_questions.php`,
   `cbt_question_order.php`, `cbt.php`, `answer_details.php`. The helper must be
   present before the new `cbt.php` is served.
4. `cbt_practice.php` is not part of this release and is no longer tracked in
   the repository; leave the live file untouched.
5. Cache handling: `admin_questions.php` loads `src/parser/core.js?v=2.5.5`
   and `ocr_helper.js?v=2.4.8`, loads `src/underline-toolbar.js` without a
   query token, and loads
    `src/question-preview.css?v=1.1.3`, `src/math-tool.css?v=1.1.1`,
    `src/owner-tool/render.js?v=2.3.4`, and `src/math-tool.js?v=1.1.2` (D-94,
    D-102, D-103, D-104, D-105). A standalone deployment must purge server/CDN caches, clear the
   site's browser cache, and verify the live helper and palette hashes.
   `cbt.php` loads `src/owner-tool/render.js?v=2.3.4`; no page may keep
   `?v=2.3.2c`, `?v=2.3.3`, `?v=2.4.0`, or `?v=1.1.2` for these assets.
6. Run the Constant Text migration:
   - `php -l` every changed PHP file;
   - `mysql --default-character-set=utf8mb4 <database> < deployed/sql/01-constant-text.sql`;
   - confirm `SHOW COLUMNS FROM questions LIKE 'constant_text';` shows `text`,
     `YES` null, no default, `utf8mb4_unicode_ci`;
   - rerun `01-constant-text.sql`; it must be a no-op.
7. Run the English Lexis subject operation. Its disposable MySQL 8.0.41 harness
   passed on 2026-11-17; production still needs the verified backup,
   target-contract preflight, and explicit owner authorization:
   - `mysql --default-character-set=utf8mb4 <database> < deployed/sql/03-english-lexis-structure.sql`;
   - verify one byte-exact active row with a generated ID;
   - rerun `03`; the same row and non-activation fields must remain unchanged.
8. Run the smoke checks. Exit maintenance mode only after they pass.

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

The English Lexis operations are separately rerunnable:

```sh
mysql --default-character-set=utf8mb4 <database> < deployed/sql/03-english-lexis-structure.sql
mysql --default-character-set=utf8mb4 <database> -e \
  "SELECT id, subject_name, is_active FROM subjects WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');"

# Non-destructive subject rollback: deactivate, never delete.
mysql --default-character-set=utf8mb4 <database> < deployed/sql/04-english-lexis-structure-rollback.sql
```

Both operations refuse a collation-equivalent byte-different subject or a
missing unique-name contract. Full disposable commands are in
`deployed/sql/README.md`; never use `--force`.

D-108 is display-only. It adds no SQL operation and does not rename the exact
`English (Lexis & Structure)` database row.

## 5. Smoke checks

| Area | Check | Expected |
|---|---|---|
| Migration | run `01-constant-text.sql`, inspect, rerun | column exists as nullable `TEXT`; second run is a no-op |
| Admin | log in, open Add a New Question | Constant Text textarea present; empty by default; no context fields |
| Subject alias | inspect all three admin subject selects and the CBT setup subject select | the exact English Lexis row displays as `English (Comprehension Pages / Lexis & Structure)`; form values remain numeric IDs; CBT Practice remains unchanged |
| CBT weights | start an English Lexis exam with a Constant Text passage | Constant Text is weight 800 and the still-bold question stem is weight 700; the question remains larger, with no horizontal overflow |
| Admin | enter a passage, question, four options, then Save | exact flash `Question saved successfully (Question ID: …).`; one new row with the passage |
| Admin | open a new Add page in the same session | the last successfully saved passage prefills; question/options are empty |
| Admin | open the saved row's Edit page | the row's passage appears; formatting is exact `<u>` |
| Admin | log out and back in | Constant Text on a new Add page is empty |
| Underline | select text in Constant Text, question, or an option; click Underline twice | first wraps in exact lowercase tags; second unwraps; the button sits at the far right of the Question label row on desktop and narrow screens |
| Preview | type multiline Constant Text and Question with exact `<u>` markers, then enter a passage taller than the input | read-only panel preserves blank lines, safely underlines exact markers, has no editable controls, and keeps Constant Text at 150px with a vertical scroll while Question remains content-sized |
| Helper labels | paste A-D uppercase/lowercase labels with and without whitespace after `(`, before `)`, and before `.` | every D-91 structural form loads with the same four option values and no missing-option flags |
| Helper boundary | paste `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` | Question is `Which is correct?`; Option A keeps `The notation A ) stays in option A`; B-D are `Two`/`Three`/`Four`; no duplicate warning solely for the internal `A )` |
| Helper isolation | prefill Constant Text, then load passage/cloze-shaped OCR | Constant Text remains byte-for-byte unchanged; any ordinary-question interpretation stays in Question/options with review flags |
| Palette | open Add a New Question and inspect the toolbar, then pick an operator after placing the caret mid-text | the basic row is exactly `± × ÷ ≠ ≈ ° π`, the operator lands at the remembered caret, the visual Root button is the only square-root control, and no second Underline button appears |
| Symbol drawer | click `More symbols` and insert one character from each grid | the drawer opens with only Greek, Set theory and logic, and Geometry and vectors grids, holds no exponent, subscript, fraction, or square-root character, toggles `aria-expanded` back to `false`, and each symbol lands at the remembered caret |
| Shape editors | open each of the fraction, exponent, subscript, root, and 2×2 matrix panels | one panel opens at a time, the live preview matches the shape, and only one shape button reports `aria-expanded="true"` |
| Fraction | enter numerator `3` and denominator `7`, then Insert | `<frac>3/7</frac>` lands at the remembered caret, the preview shows `3` over a full horizontal rule above `7`, blank lines are unchanged, and Enter does not submit |
| Root | enter radicand `2x+1` | the preview shows one holistic radical: `√` visibly joined to a horizontal vinculum across the radicand |
| Matrix | enter `2`, `x`, `1`, `y` | the preview shows a bracketed 2×2 grid with that row-major order |
| Shape validation | submit an empty term or a value containing `<`, `>`, or the active separator | nothing inserts, the field is unchanged, and an inline hint names the requirement |
| Palette keyboard | Tab to a palette button and press Enter or Space | the focused symbol inserts; every control has an accessible name |
| Byte counter | paste or type multi-byte symbols and watch the counter | neutral below 57,000 bytes, amber at 57,000–59,999, red at 60,000+ with visible warning copy; nothing truncates and Save stays enabled |
| Byte counter refresh | click `Load questions`/`Skip` or reset the form | the counter matches the field's new UTF-8 byte count after the page's own fill, including red at 60,000+ |
| Tokens | view source of the admin page and `cbt.php` | exactly one `src/math-tool.css?v=1.1.1` link and one `src/math-tool.js?v=1.1.2` script on the admin page, script after the preview script; one `src/question-preview.css?v=1.1.3` link and one `src/owner-tool/render.js?v=2.3.4` script there too, plus `src/parser/core.js?v=2.5.5` before `ocr_helper.js?v=2.4.8`; `cbt.php` loads `src/owner-tool/render.js?v=2.3.4` exactly once, and stale preview `?v=1.1.1`/`?v=1.1.2`, renderer `?v=2.3.2c`/`?v=2.3.3`, helper `?v=2.4.5`/`?v=2.4.7`, and core `?v=2.4.0`/`?v=2.5.0`/`?v=2.5.1`/`?v=2.5.2`/`?v=2.5.3`/`?v=2.5.4` appear nowhere |
| CBT | open delivered questions with preserved constant text | passage renders above the question; `<u>` is real underline; Constant Text is bold at weight 800 and the larger question stem remains bold at weight 700 |
| English Lexis subject | inspect the active subject list after `03` and after a rerun | exactly one byte-exact active row; generated ID and existing description/timestamp remain unchanged |
| English Lexis ordering | start a 50-question exam containing repeated exact non-empty passages plus blank passages | selected IDs and filters are unchanged; repeated passages are contiguous; blank rows stay independent; every member renders its passage |
| Other CBT subjects | start the same existing subject/category/year checks | selected rows retain their existing order; no English Lexis grouping applies |
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
3. Run `04-english-lexis-structure-rollback.sql`; verify the exact subject row
   remains present and inactive and question/attempt counts are unchanged.
4. If any `constant_text` is non-empty, do **not** run the automatic rollback.
   Restore the verified backup and the previous code, then investigate.
5. If no content exists, run `02-constant-text-rollback.sql`; confirm the column
   is gone.
6. Restore the previous `src/`, root `ocr_helper.js`, and `deployed/` files in
   reverse upload order.
7. Exit maintenance mode only after the post-rollback smoke checks pass.

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
- the palette exposes a legacy bare `√` operator in addition to the visual Root
  editor, or the rendered radical has a visible gap before its vinculum;
- the byte counter disagrees with the field's UTF-8 byte count after typing,
  OCR Load/Skip, or a reset, or it truncates text or disables Save;
- `math-tool.js` is served without `?v=1.1.2`, `math-tool.css` without
  `?v=1.1.1`, `question-preview.css` without `?v=1.1.3`,
  `src/owner-tool/render.js` without `?v=2.3.4`, `src/parser/core.js` without
  `?v=2.5.5`, or any of those assets returns 404;
- constant-text data exists when a rollback is attempted;
- the exact English Lexis operation sees a collation-equivalent byte-different
  row, lacks the auto-increment/unique-name contract, changes an existing field
  other than `is_active`, or does not leave exactly one active exact row;
- English Lexis grouping changes the selected ID multiset, filters, nominal
  limit, row values, original member order (ascending `id`), per-row Constant
  Text rendering, or another subject;
- the target lacks a verified backup, the live `cbt_db.php`, `header.php`,
  `footer.php`, or `cbt_exam_attempts`;
- the English Lexis operations have not passed the disposable MySQL 8.0.41
  harness (passed 2026-11-17) or lack explicit owner authorization.

## 8. Known limitations and open gates

- Phase 1 is review-settled: the third re-review closed D-91 `FIX-1`, and
  `FIX-2` remains closed.
- `practice_title` is `NOT NULL` with no default in the supplied DDL, and the
  admin INSERT omits it. This is a known out-of-scope mismatch. Verify the
  target before deploying; do not change the column in this release.
- A failed authenticated save now shows the exact escaped PDO message after its
  generic lead-in (D-106). This can reveal SQLSTATE and database object names to
  logged-in administrators; it remains unavailable to logged-out visitors.
- The connection collation is a deployment prerequisite. PDO `charset=utf8mb4`
  alone is not sufficient on MySQL 8.0.41.
- `header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts,
  not supplied. Do not deploy inferred local shims.
- `cbt_practice.php` is not part of this release and is no longer tracked in the
  repository; leave the live file untouched.
- ST01 did not execute the schema migration in its implementation phase. The
  owner reported production operation `01` successful on 2026-11-19; no agent
  database action or independent production verification was performed.
- There is no automated browser suite. ST01 behavior is covered by Node/PHP
  checks, static assertions, and disposable Chromium evidence. ME01/ME02/MS01
  have 25 module vectors and local browser evidence; the owner accepted the
  original Brave/Android check on 2026-11-17. The D-103 joined radical passed a
  local and focused-review Chromium font/size check, D-104 has a strengthened
  CSS regression, and the owner accepted the D-103/D-104 desktop/Brave recheck
  on 2026-11-17.
- EL01 adds 11 real-module/wiring checks and a 6-check disposable HTTP staging
  run. Its 8-check real-script harness passed on isolated Oracle MySQL Community
  Server 8.0.41 ARM64; production execution still needs the deployment backup,
  target-contract preflight, and explicit owner authorization. A preliminary
  MariaDB 13.0.2 run is not the acceptance evidence.
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
