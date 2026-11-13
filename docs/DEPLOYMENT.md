# Deployment Manifest — Owner Tool and Context Release

Recorded: 2026-11-08; updated for OT11 on 2026-11-13. Target: PHP 8.3, MySQL 8.0.41, InnoDB,
`utf8mb4_unicode_ci`. This manifest is the OT10 handoff for the
`owner-tool-2026-11` cycle. It does **not** authorize a production deploy. A
deploy needs a separate explicit owner instruction. See
[`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) for the architecture and
[`plan/owner-tool/ot-09a-production-consolidation.md`](plan/owner-tool/ot-09a-production-consolidation.md)
for the consolidation measurements.

## 1. Before you start

1. Confirm the target runtime: PHP 8.3.x, MySQL 8.0.41, InnoDB,
   `utf8mb4_unicode_ci`.
2. Confirm the target already has the live `cbt_db.php`, `header.php`,
   `footer.php`, and `cbt_exam_attempts` table. They are live-site artifacts and
   are not part of this release. Do **not** deploy the local test shims
   (`deployed/cbt_db.php`, `deployed/cbt_admin_config.php`), the tracked
   phone-staging tooling (`tools/phone-staging/`, including its SQLite
   `cbt_db.php` shim, `tools/start-phone-staging.sh`, and
   `tools/stop-phone-staging.sh`), or the inferred local `cbt_exam_attempts` table.
3. Confirm the connection collation. The migration preflight requires
   `utf8mb4_unicode_ci`. On MySQL 8.0.41 a PDO `charset=utf8mb4` connection alone
   reports `utf8mb4_general_ci`. The target `cbt_db.php`/server must set the
   session collation (`SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` or the
   equivalent). If the preflight reports another collation, stop.
4. Confirm `questions.practice_title` accepts the admin INSERT. The supplied DDL
   is `NOT NULL` with no default, while the admin INSERT omits it (known
   out-of-scope mismatch). On a strict target a native save fails with
   `Field 'practice_title' doesn't have a default value`. Verify with a
   disposable row, or confirm the live column already has a default. Do not
   change the column as part of this release.
5. Take a verified backup:

   ```sh
   mysqldump --single-transaction --routines --triggers \
     --default-character-set=utf8mb4 <database> > context-release-backup.sql
   ```

6. Put the site in maintenance mode and stop every web worker, importer, cron
   job, and CLI process that can write `questions` or `question_contexts`.

## 2. File manifest (12 production files + 2 ops)

Line counts are `wc -l`; bytes are LF-normalized UTF-8 bytes; SHA-256 is over the
LF-normalized content. The Windows working tree carries CRLF on five files; the
hashes below are the deployable LF basis. Deploy PHP files and `src/` assets to
the site root, preserving relative paths. Deploy the two SQL ops files to the
ops directory, not the public web root.

| File | Lines / LF bytes | SHA-256 (LF) | Deploy to | Notes |
|---|---:|---|---|---|
| `deployed/admin_questions.php` | 1065 / 62892 | `7ec150d924cb834627745ac4d9c8f989276421e6ce36dc77b6b8081bf76817cb` | site root | narrow admin entry point; stacked workflow sections, assets, and extracted read-only payload wiring |
| `deployed/cbt.php` | 1008 / 44515 | `697407e6022ce9f543a271664f69bc27816b52170389c0381544aa2b170b2de9` | site root | CBT delivery; loads `owner-tool.css`, `render.js` |
| `deployed/answer_details.php` | 251 / 12157 | `b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c` | site root | supplied detail page; loads `render.php` |
| `deployed/render.php` | 78 / 2447 | `205af86993d8bf2adcbcd262476e64fcc90fe9a2b3fd379cba9488c1d1450d2f` | site root | server safe renderer |
| `deployed/context_lib.php` | 505 / 20353 | `0b1051a97708b9e8fddce9ec10b2637eee1b2b236ed10aae3d2c0f6a82a78673` | site root | context validation/queries, 10-row paging, and unpaginated selector options |
| `deployed/admin_context.php` | 996 / 46688 | `0c5e1b83c30bb29b0892b2d3f00be36d1faca9f50e4aed68368dde649bcbf5c2` | site root | context handling/mutations, paginated Saved Shared Texts, identity/recent payloads, and visibly distinct native draft/edit modes |
| `deployed/cbt_candidate.php` | 423 / 16714 | `8d1383ef11bd2963af521af62d20c123663642f0149702714620a5a516463dc6` | site root | candidate selection/repository |
| `deployed/sql/01-context-migration.sql` | 250 / 17870 | `e963b739a26f20e5b12db6525266b580c0472d494fd29a6fb44a3a3f076b55f7` | ops directory | forward migration |
| `src/parser/core.js` | 1432 / 49296 | `1321d95f046151e202c44eb8a18f9b1c9df39e2d31e001a73b639e49b4a71f67` | site root `src/parser/` | parser 2.3.3 with internal comprehension/cloze engines and bounded row-local drift correction |
| `src/owner-tool/render.js` | 209 / 6339 | `008325f404e435747fe33d57aa84380b0977c8bed38e6c1bcff01515ff7129c3` | site root `src/owner-tool/` | shared renderer and context cards |
| `src/owner-tool/owner-tool.js` | 2566 / 106477 | `c8f86b8f6ca61cb7b2f73750e442c564c07ecdb7f409fcdc9b2a1434b067818d` | site root `src/owner-tool/` | tool 1.5.4; draft-only paste filling, reachable saved-edit isolation, synchronized dynamic mode labels/hints, next-unsaved selection, full-paste reset, full identity, next-free links, advisory duplicates, Show/Hide, and formatting-only Question Edit |
| `src/owner-tool/owner-tool.css` | 291 / 4606 | `405a769288849033451e1a9f06cecedc4d7d29a6a90a10bccae89a411a5c1b8c` | site root `src/owner-tool/` | owner/context/CBT styles, stacked section boundaries, amber draft and blue saved-edit treatments, form groups, and duplicate notices |
| `deployed/sql/README.md` (ops) | 172 / 8065 | `7f474ffe65523a957b656db380e01520e30cc7a7373309754274700f5789e861` | ops directory | runbook |
| `deployed/sql/02-context-rollback.sql` (ops) | 64 / 2512 | `047e11005acf8194c66151ebcc1a6510fd6983aab5643552ab9d3d064dbde694` | ops directory | guarded rollback |

Do **not** deploy `deployed/sql/base-schema.working.sql` or the
`tools/context-migration-*.php` support files; they are repo-only test support.

## 3. Upload order

1. Back up files and the database.
2. Upload the four `src/` assets.
3. Upload the four PHP includes: `render.php`, `context_lib.php`,
   `admin_context.php`, `cbt_candidate.php`.
4. Upload the three entry points: `admin_questions.php`, `cbt.php`,
   `answer_details.php`.
5. Leave `cbt_practice.php` unchanged; it is outside the remaining cycle scope.
6. Cache-busting: changed `core.js` uses `?v=2.3.3`, changed
   `owner-tool.js` uses `?v=2.3.3e`, and changed `owner-tool.css` uses
   `?v=2.3.3a` in `admin_questions.php`; `cbt.php` uses the same CSS token. The
   unchanged renderer remains `?v=2.3.2g`; `cbt_practice.php` remains on
   `?v=2.3.2c`.
   If any asset changes, bump its token in every page that loads it before
   upload.
7. Run the migration preflight. It must exit 0 and print literal
   `PREFLIGHT OK`.
8. Import `deployed/sql/01-context-migration.sql`.
9. Rerun the preflight; it must print `already applied (rerun safe)`.
10. Run the smoke checks. Exit maintenance mode only after they pass.

## 4. Migration commands

```sh
CBT_DB_HOST=... CBT_DB_NAME=... CBT_DB_USER=... CBT_DB_PASS=... \
  php tools/context-migration-preflight.php
mysql --default-character-set=utf8mb4 <database> \
  < deployed/sql/01-context-migration.sql
CBT_DB_HOST=... CBT_DB_NAME=... CBT_DB_USER=... CBT_DB_PASS=... \
  php tools/context-migration-preflight.php
```

The forward migration is rerunnable. The preflight must report
`not applied (ready)` before the first run and `already applied (rerun safe)`
after it. A second run performs no destructive operation and no data change.

## 5. Smoke checks

| Area | Check | Expected |
|---|---|---|
| Migration | preflight before/after | `PREFLIGHT OK`; `not applied (ready)` then `already applied (rerun safe)` |
| Admin | log in, paste a comprehension section, click Load | passage appears in a comprehension context card; preview keeps exact `<u>` and paragraphs; no automatic write |
| Admin | paste a cloze section, click Load | cloze context card with `[[gap:N]]` tokens; no automatic write |
| Admin | fill the native form and click Save Question | exact flash `Question saved successfully (Question ID: …).`; one new row |
| Admin | open the saved row's Edit page | formatting tool is present; no owner state is written |
| CBT | select subject/category/year, enter a candidate, start | complete context group renders with its passage; total is the complete-group count |
| Answer details | open an active legacy question | exact `<u>` renders; stored `<script>`/`<img onerror>` remain text |
| Security | stored-XSS probe | no injected script runs; only exact underline/gap markup renders |

## 6. Rollback order

1. Re-enter maintenance mode and stop every writer.
2. Take a fresh verified backup.
3. If any `question_contexts` row exists, or any `questions.context_id`,
   `context_position`, or `context_slot` is non-null, do **not** run the
   automatic rollback. Restore the verified backup and the previous code, then
   investigate.
4. If no context data exists, run the preflight, then
   `deployed/sql/02-context-rollback.sql`, then the preflight again; it must
   report `not applied (ready)`.
5. Restore the previous `src/` and `deployed/` files in reverse upload order.
6. Exit maintenance mode only after the post-rollback preflight and smoke checks
   pass.

The rollback script is a single uninterrupted client session. It uses two
guarded write-lock phases around the `ALTER TABLE` lock-release/reacquisition
boundary. Never use `mysql --force`. If any statement fails, stop, keep the
freeze, and restore or investigate from the backup.

## 7. Stop conditions

Stop and do not continue on the first mismatch:

- the preflight does not print `PREFLIGHT OK`;
- the connection or database collation is not `utf8mb4_unicode_ci`;
- the forward migration or rerun preflight exits nonzero or refuses;
- any PHP fatal error, parse error, or unexpected warning appears;
- the native save flash is not the exact success text, or the row count does not
  increase by exactly one;
- any stored-XSS probe executes script or creates an element;
- context data exists when a rollback is attempted;
- the target lacks a verified backup, the live `cbt_db.php`, `header.php`,
  `footer.php`, or `cbt_exam_attempts`;
- the required Brave/Android check has not been performed. The initial check
  passed on 2026-11-09, and the owner accepted the final OT11 re-check on
  2026-11-13.

## 8. Known limitations and open gates

- `practice_title` is `NOT NULL` with no default in the supplied DDL, and the
  admin INSERT omits it. This is a known out-of-scope mismatch. Verify the
  target before deploying; do not change the column in this release.
- The connection collation is a deployment prerequisite. PDO `charset=utf8mb4`
  alone is not sufficient on MySQL 8.0.41.
- `header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts,
  not supplied. The local browser smoke used an inferred test-only
  `cbt_exam_attempts` table and no header; do not deploy either.
- `cbt_practice.php` and `practice_title` behavior remain outside the remaining
  cycle scope.
- The Brave/Android staging check was performed on 2026-11-09 and passed.
  Desktop Chromium 155 passed 33/33 local checks. OT11's expanded follow-up and
  2026-11-12 consolidation pass local suites/focused Chromium checks; the owner
  accepted the final Brave/Android re-check on 2026-11-13. The independent
  rigorous review remains open.
- The Windows/CRLF `extract-bank` `bank-pre-2026` output-hash mismatch is a
  pre-existing baseline artifact, not a release regression.
- This package does not deploy to production, clean live data, or archive the
  cycle. Those need explicit owner instructions.
