# Owner Tool 2026-11 Phase 6 Second Re-Review

- **Date:** 2026-11-04
- **Reviewer:** OpenCode, independent second re-review session
- **Package:** OT05 - Context Schema and Admin, including OT05-EXT-01 and both
  accepted Phase 6 fix handoffs
- **Scope:** `owner-tool-integration` at `cd2e6c9` plus the current uncommitted
  OT05 worktree, compared with the exact pre-implementation package base
  `cd2e6c9`
- **Earlier records:** `owner-tool-2026-11-phase-6.md` and
  `owner-tool-2026-11-phase-6-re-review.md`; neither was overwritten
- **Record name:** this is `-re-review-2.md` because the required `-re-review.md`
  record already exists and review evidence must remain immutable
- **Requested closers:** `BLOCK-3`, `BLOCK-6`, `BLOCK-7`, and `FIX-6`

## Independence And Scope

The latest fix handoff was treated as an untrusted claim. This session inspected
the complete Phase 6 production inventory, current entry-point wiring, PHP
transactions and validation, forward and rollback SQL, preflight contract and
inspector, supplied DDL provenance, tests, current documentation, Git history,
and both earlier review records. It ran the full local baseline and every
available OT05 acceptance command.

No product, test, fixture, package-status, handoff, or earlier review file was
edited. The only file written is this second re-review record. No branch was
created, switched, merged, or moved, and no commit was made. No browser, live
site, production database, database write, delete, or cleanup action was used.

Git history and reflog independently establish `cd2e6c9` as the checked-out
commit before the supplied SQL was copied and before OT05 implementation. The
`405439b..cd2e6c9` range contains documentation changes only, so production
counts happen to be identical from both refs, but all measurements below retain
the exact package base `cd2e6c9`.

The staged root SQL files are supplied inputs copied from `main:002483b`, not
OT05 production additions. The dirty worktree also contains pre-existing
process/history changes, including `INTENT.md`, the OT04 package, history, and
generic prompt files. No unrelated application change was attributed to OT05.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch` | On `owner-tool-integration...origin/owner-tool-integration`; OT05 remains uncommitted, supplied root SQL is staged, and both earlier Phase 6 records are untracked and unchanged |
| `git log --oneline --decorate --all -20` and `git reflog --date=iso -30` | Independently confirmed `cd2e6c9` as the OT05 package base and current HEAD |
| `git diff --name-status cd2e6c9` and cached/unstaged numstats | Accounted for the supplied staged SQL, OT05 implementation/evidence, review records, and pre-existing process documentation |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 38 PASS, 0 FAIL |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL; this suite is explicitly static for SQL and wiring |
| PHP 8.3.16 `tests/context-lib.php` | 13 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-admin.php` | 19 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-preflight.php` | 6 PASS, 0 FAIL |
| PHP 8.3.16 `tests/php-render.php` | 9 PASS |
| PHP 8.3.16 `-l` on all 12 OT05 production/tool PHP files and all 3 context test PHP files | PASS |
| `git diff --check` and `git diff --cached --check` | PASS; ordinary LF/CRLF worktree warnings only |
| `node tools/extract-bank.js --check` | Source hashes, anchors, and counts pass; only the documented pre-existing Windows/CRLF `pre-2026` output-hash mismatch remains |
| Independent raw line/byte/SHA-256 counter plus `git diff --numstat cd2e6c9` | Reproduced every production measurement and current hash in the table below |
| `git check-attr text diff merge` and raw/path-filtered `git hash-object` for all six supplied SQL paths | Every path has `text`, `diff`, and `merge` unset; every filtered blob equals its raw blob |
| Root index blob comparison with `main:002483b` | All three staged root SQL blob IDs are unchanged from the supplied commit |
| Adversarial production-validator probe | A valid applied snapshot with descending index parts and one with an enforced context-blocking `CHECK` in real `SHOW CREATE TABLE` data both returned `already applied (rerun safe)` with zero errors |
| Adversarial rollback-test probe | Inserting `UNLOCK TABLES` between the asserted lock and procedure call still satisfies the current static order predicate, showing that the test does not establish an uninterrupted lock interval |
| MySQL 8.0 reference inspection | The target manual states that `ALTER TABLE` on a transactional table unlocks a table acquired with `LOCK TABLES`; explicit table locks are released together |

The bare `php` command is not on this PowerShell PATH. PHP probes used
`C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe`. The installed MySQL
client reports 8.4.3, not the 8.0.41 target, so this review did not substitute a
local database execution for the OT10 target-runtime work.

## Requested Finding Disposition

### BLOCK-3 - OPEN

The latest repair correctly adds connection-collation validation, exact column
name/order checks, exact index and foreign-key name sets, index row counts,
visibility, and foreign-key actions. The original wrong-collation, extra-index,
extra-foreign-key, and trailing-key-part vectors are repaired. The preflight and
forward assertion still do not establish the exact schema they claim, however.

The inspector's index query omits `information_schema.statistics.COLLATION`,
which is MySQL's ascending/descending key-part field
(`tools/context-migration-inspector.php:104-110`). Its grouped index structure
therefore retains no direction (`tools/context-migration-inspector.php:26-47`),
and the production validator compares uniqueness, type, visibility, prefixes,
expressions, and ordered names but not direction
(`tools/context-migration-contract.php:218-234`). The forward assertion likewise
omits index-part direction from every predicate
(`deployed/sql/01-context-migration.sql:67-143`). The adversarial validator probe
added descending direction to an otherwise exact expected index and still
received `already applied (rerun safe)` with zero errors.

More materially, the inspector collects real `SHOW CREATE TABLE` text
(`tools/context-migration-inspector.php:125-138`), but the validator never reads
the snapshot's `creates` data and never queries or validates `CHECK` constraints
(`tools/context-migration-contract.php:143-150,179-247`). The forward assertion
checks columns, indexes, and foreign keys only
(`deployed/sql/01-context-migration.sql:31-173`). An enforced check such as
`CHECK (context_id IS NULL)` on `questions` therefore yields literal
`PREFLIGHT OK`, survives the compatibility assertion, and prevents every shared
context link after the named columns/indexes/foreign key are skipped. The
adversarial probe reproduced that production-contract acceptance with zero
errors.

This contradicts the runbook's exact metadata and guarded-skip promises
(`deployed/sql/README.md:53-65,97-103`) and still permits an incompatible target
schema to pass the package's migration-preflight acceptance row
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:89-92`). Existing tests
cover connection collation and extra named indexes/foreign keys
(`tests/context-preflight.php:202-223`) but not index direction or table checks.
`BLOCK-3` remains open.

### BLOCK-6 - OPEN

The new rollback correctly requires a maintenance/write freeze, obtains `WRITE`
locks before its only procedure call, combines the question teardown in one
`ALTER TABLE`, and guards every populated context column. That does not make the
claimed lock interval cover the full guard/removal sequence.

Inside the locked procedure, the script alters the transactional InnoDB
`questions` table (`deployed/sql/02-context-rollback.sql:30-37`), then separately
recounts and drops `question_contexts`
(`deployed/sql/02-context-rollback.sql:39-44`). The MySQL 8.0 `LOCK TABLES`
reference and its linked `Problems with ALTER TABLE` section state that
`ALTER TABLE` on a transactional table unlocks a table previously locked with
`LOCK TABLES`; explicit table locks are released together. The outer lock/call
order at `deployed/sql/02-context-rollback.sql:48-50` therefore does not retain
exclusive protection through the second count and final drop.

An overlooked or blocked context writer can resume after the question `ALTER`,
commit a new `question_contexts` row after the count at line 39, and have that row
silently removed by the drop at line 44. A perfectly enforced external outage
reduces this risk, but it does not make the script's claimed lock-backed
exclusion true. The SQL header and runbook explicitly claim that the write locks
make the sequence exclusive and that populated context data is never silently
dropped (`deployed/sql/02-context-rollback.sql:3-5`;
`deployed/sql/README.md:130-145`). This remains a static design defect before the
deferred OT10 contention test, not merely missing runtime evidence.

The static test checks only that lock, call, and unlock strings occur in order
(`tests/context-migration.js:152-170`). The adversarial in-memory mutation showed
that an explicit unlock inserted before the call still passes that predicate; it
cannot detect the actual implicit unlock inside the procedure. The package
requires a rollback that never destroys populated context data silently
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:71-72,92`). `BLOCK-6`
remains open.

### BLOCK-7 - CLOSED

`.gitattributes:1-4` now applies path-specific `-text -diff -merge` rules to all
three root and all three archived supplied SQL paths. With `core.autocrlf=true`,
independent `git hash-object --no-filters` and `git hash-object --path` results
are identical for all six paths. The three staged root blob IDs also exactly
match `main:002483b`.

`tests/context-migration.js:96-115` executes the real Git attribute/blob probe,
not a copied hash calculation. The working bytes, archive bytes, manifest hashes,
and prospective repository blobs agree. Normal staging no longer corrupts the
byte-exact source evidence. `BLOCK-7` is closed.

### FIX-6 - CLOSED

The exact package base `cd2e6c9` is now persistent in the entry-size test
(`tests/context-migration.js:220-243`) and in the latest cumulative handoff
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:523,548-565`). The
cumulative inventory now includes `deployed/admin_question_context_fields.php`
with its 28 lines, 2,141 bytes, hash, focused responsibility, entry-point include,
and direct production-fragment rendering evidence
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:554,576-577,608-609`).

The independent measurements below reproduce the complete inventory. No module
is omitted, no limit is breached, and no exception approval is needed. `FIX-6`
is closed.

## Earlier Finding Regression Check

The latest fix changes migration/preflight/rollback/configuration paths, not the
admin context/question PHP behavior that closed the other findings. Inspection
and the real helper/admin suites found no regression in those paths.

- `BLOCK-1`, `BLOCK-2`, `BLOCK-4`, and `BLOCK-5` remain closed.
- `FIX-1`, `FIX-2`, `FIX-3`, `FIX-4`, and `FIX-5` remain closed.
- `NOTE-1`, `NOTE-2`, and `NOTE-3` remain non-blocking and outside the accepted
  latest-fix scope. In particular, history still describes the earlier
  monolithic/8-probe state at `docs/plan/history.md:170-192`.

## Acceptance Coverage

| Acceptance check | Second re-review result |
|---|---|
| Migration preflight | **FAIL**; `BLOCK-3` shows incompatible index direction and enforced checks can still produce `PREFLIGHT OK` |
| Migration artifacts | **FAIL**; forward/rerun structure is present, but `BLOCK-3` leaves exact guarded-skip gaps and `BLOCK-6` leaves the final rollback guard/drop outside the claimed lock interval |
| Existing questions | PASS by static design: the forward migration performs no DML and adds nullable columns; target execution remains OT10 evidence |
| Context create/edit | PASS locally through real normalization, dispatch, transaction, failed-state, and rendered-field tests |
| Link validation | PASS; malformed IDs/position/slot, wrong pool, duplicate position/slot, missing context, and member limits are rejected |
| Incomplete context | PASS for real helper/dispatcher behavior; incomplete or invalid groups cannot activate |
| Complete context | PASS for sequential real helper/dispatcher behavior; MySQL lock semantics remain OT10 evidence |
| Member mutation | PASS for real production mutation functions, stale hints, atomic deactivation, and rollback under SQLite; two-connection MySQL proof remains deferred |
| Delete | PASS for sequential context and question deletion paths with restrictive behavior and rollback evidence |
| Legacy rollback safety | PASS for publication design: linked rows are forced inactive and unchanged candidate queries still select only `is_active = 1` |
| PHP syntax | PASS locally on PHP 8.3.16 for every OT05 production/tool PHP file and context test file |
| Migration execution | Correctly deferred to OT10; no MySQL or production operation was attempted, but the static defects in `BLOCK-3` and `BLOCK-6` must be repaired first |

## Externalize-First Verification

The independently verified package base is `cd2e6c9`. New files were counted
against an empty file because ordinary `git diff <base>` excludes untracked
files. Lines are readable physical source lines; bytes are current raw bytes.

| Production file | Base lines/bytes | Add/del | Final lines/bytes | Responsibility, deployment, and production-path evidence |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1056 / 62915 | 94 / 61 | 1089 / 64488 | Deployed web entry and narrow wiring; includes/calls are checked statically, and its called production modules execute in `context-admin.php` |
| `deployed/admin_context_actions.php` | 0 / 0 | 244 / 0 | 244 / 9860 | Context dispatch, transactions, and PRG result; required by the entry and executed by `context-admin.php` |
| `deployed/admin_context_data.php` | 0 / 0 | 167 / 0 | 167 / 6495 | Strict link parsing and pre-render data; required by the entry and executed by `context-admin.php` |
| `deployed/admin_context_management.php` | 0 / 0 | 134 / 0 | 134 / 9708 | Query-free context-management view; included by the entry and rendered directly by `context-admin.php` |
| `deployed/admin_question_context_fields.php` | 0 / 0 | 28 / 0 | 28 / 2141 | Question-link fields view; included by the entry and rendered directly by `context-admin.php` |
| `deployed/admin_question_mutations.php` | 0 / 0 | 206 / 0 | 206 / 8833 | Atomic question writes/deletes and context deactivation; required by the entry and executed by `context-admin.php` |
| `deployed/context_lib.php` | 0 / 0 | 212 / 0 | 212 / 7970 | Shared context queries/link checks; required by the entry and executed by `context-lib.php` and `context-admin.php` |
| `deployed/context_input_validation.php` | 0 / 0 | 137 / 0 | 137 / 5744 | Context normalization/validation; included by `context_lib.php` and executed by both context PHP suites |
| `deployed/context_activation_validation.php` | 0 / 0 | 138 / 0 | 138 / 5867 | Activation-readiness validation; included by `context_lib.php` and executed by both context PHP suites |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 250 / 0 | 250 / 17423 | Guarded forward migration deployed through the SQL runbook; local test reads the real artifact, while direct MySQL execution is deferred to OT10 |
| `deployed/sql/02-context-rollback.sql` | 0 / 0 | 51 / 0 | 51 / 2026 | Guarded rollback deployed through the SQL runbook; local test reads the real artifact, while direct contention/execution is deferred to OT10 |
| `tools/context-migration-preflight.php` | 0 / 0 | 33 / 0 | 33 / 1146 | CLI preflight entry invoked by the runbook; its real connector-failure path executes in `context-preflight.php` |
| `tools/context-migration-contract.php` | 0 / 0 | 248 / 0 | 248 / 12433 | Canonical metadata validator; required by the CLI and executed with valid/adversarial snapshots by `context-preflight.php` |
| `tools/context-migration-inspector.php` | 0 / 0 | 175 / 0 | 175 / 8020 | Real metadata collector/reporter; required by the CLI and its grouping behavior executes in `context-preflight.php` |

`deployed/admin_questions.php` remains below the existing-file limit of 100
additions. Every new readable production file is at or below 250 lines; the
forward migration is exactly 250 lines, the contract is 248, and context actions
are 244. No Gate 1 exception was requested or used. Acceptance of review fixes
is scope approval, not a line-limit exception. Any further fix must retain
`cd2e6c9` and the cumulative counters; the two near-limit files have no practical
headroom for unstructured additions.

Each module has one focused responsibility and an explicit entry include, CLI,
or SQL-runbook deployment path. The PHP helper, dispatcher, mutation, and view
tests execute the real production modules. The full authenticated web entry,
browser PRG, successful database collector, MySQL DDL, and MySQL lock behavior
are not locally executed. Those gaps are reported as deferred evidence rather
than represented by copied control flow.

## Provenance, Fixtures, And Excluded Artifacts

- `.gitattributes` is repository byte-preservation configuration, not production
  application code.
- `questions.sql` is an exact supplied source snapshot from `main:002483b`.
- `subjects.sql` is an exact supplied source snapshot from `main:002483b`.
- `exam_category.sql` is an exact supplied source snapshot from `main:002483b`.
- `archive/sql/2026-11-03-supplied/questions.sql` is the byte-identical archive
  of the supplied questions DDL.
- `archive/sql/2026-11-03-supplied/subjects.sql` is the byte-identical archive of
  the supplied subjects DDL.
- `archive/sql/2026-11-03-supplied/exam_category.sql` is the byte-identical
  archive of the supplied category DDL.
- `archive/sql/2026-11-03-supplied/manifest.json` records source provenance,
  byte counts, SHA-256 values, and settled runtime facts.
- `deployed/sql/base-schema.working.sql` is the derived disposable-database
  fixture with only the settled `exam_category2` rename.
- `deployed/sql/README.md` is the migration/backup/rollback runbook.
- `tests/context-migration.js` is static artifact/wiring evidence.
- `tests/context-lib.php` executes the real helper modules against hand-authored
  SQLite infrastructure.
- `tests/context-admin.php` executes the real admin modules and renders the real
  view fragments against hand-authored SQLite infrastructure.
- `tests/context-preflight.php` executes the real contract/inspector grouping
  and CLI connector-failure path with hand-authored snapshots.
- `docs/plan/reviews/owner-tool-2026-11-phase-6.md` is immutable prior evidence.
- `docs/plan/reviews/owner-tool-2026-11-phase-6-re-review.md` is immutable prior
  evidence.
- No generated artifact changed; `src/bookmarklet.js` remains outside OT05.
- No parser source or fixture changed. `git diff --name-status cd2e6c9 -- fixtures src`
  is empty, so no expected-output generation or provenance change is present.
- `db_conn.php` is unchanged. The preflight wrapper accommodates its fixed web
  exit behavior without editing it.

The archive/root/manifest SHA-256 and byte comparisons pass, and the new Git
attribute check closes the prospective-blob gap. The two parser PENDING fixtures
and the bank extractor's Windows/CRLF output-hash mismatch predate OT05 and are
not attributed to this package.

## Deferred Evidence And Residual Risk

Successful MySQL 8.0.41 preflight, forward migration, rerun, incompatible-object
rejection, rollback, and two-connection locking remain assigned to OT10 on a
disposable production-shaped database. Browser context PRG and leading-LF checks,
target-host PHP lint, Chromium, and Brave/Android staging also remain OT10 work.
Those explicit deferrals do not excuse the static defects in `BLOCK-3` and
`BLOCK-6`.

The unaudited practice writer/readers and `questions.practice_title` contract
remain the existing OT06 external gate. OT06 must not start from this verdict.

## Verdict

- **Verdict:** `BLOCK`
- **Commit readiness:** not commit-ready; `BLOCK-3` and `BLOCK-6` remain open
- **Review status:** complete; `BLOCK-7` and `FIX-6` are closed, while `BLOCK-3`
  and `BLOCK-6` require another focused fix and re-review
- **Findings closed by this re-review:** `BLOCK-7`, `FIX-6`
- **Findings still open:** `BLOCK-3`, `BLOCK-6`
- **Pending user decision:** run the named Phase 6 fix session; do not commit the
  phase or start OT06

## Exact Recommended Next Action

Run a focused Phase 6 fix session for `BLOCK-3` and `BLOCK-6`. Add failing
evidence first for enforced checks/index direction and the target MySQL
`ALTER TABLE` lock-release boundary, retain `cd2e6c9` and all cumulative line
counters, keep successful MySQL/browser execution in OT10, do not commit, and do
not start OT06. Then re-review Phase 6 again without overwriting any prior record.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 6 BLOCK-3 BLOCK-6
