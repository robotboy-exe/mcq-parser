# Owner Tool 2026-11 Phase 6 Third Re-Review

- **Date:** 2026-11-05
- **Reviewer:** OpenCode, independent third re-review session
- **Package:** OT05 - Context Schema and Admin, including OT05-EXT-01 and all
  accepted Phase 6 fix handoffs
- **Scope:** `owner-tool-integration` at `cd2e6c9` plus the current uncommitted
  OT05 worktree, compared with the exact pre-implementation package base
  `cd2e6c9`
- **Earlier records:** `owner-tool-2026-11-phase-6.md`,
  `owner-tool-2026-11-phase-6-re-review.md`, and
  `owner-tool-2026-11-phase-6-re-review-2.md`; none was overwritten
- **Record name:** this is `-re-review-3.md` because the prior immutable
  re-review names already exist
- **Requested closers:** `BLOCK-3` and `BLOCK-6`

## Independence And Scope

The latest fix handoff was treated as an untrusted claim. This session inspected
the current forward migration, rollback, preflight contract and inspector,
runbook, direct and static tests, complete production inventory, entry-point
wiring, earlier findings, supplied DDL provenance, current documentation, Git
history, and worktree attribution. It ran the full local baseline and every
available OT05 acceptance command.

No product, test, fixture, package-status, handoff, or earlier review file was
edited. The only file written is this third re-review record. No branch was
created, switched, merged, or moved, and no commit was made. No browser, live
site, production database, database write, delete, or cleanup action was used.

Git history and reflog independently establish `cd2e6c9` as the checked-out
commit before the supplied SQL was copied and before OT05 implementation. The
staged root SQL files are supplied inputs copied from `main:002483b`, not OT05
production additions. Pre-existing process/history changes, including
`INTENT.md`, the OT04 package, history, and generic prompt files, were not
attributed to OT05. No unrelated application change was found.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch`, `git log --oneline --decorate -15`, and `git reflog --date=iso -30` | On `owner-tool-integration...origin/owner-tool-integration`; HEAD and the exact OT05 package base are both `cd2e6c9`; OT05 remains uncommitted and the three supplied root SQL files remain staged |
| `git diff --numstat cd2e6c9 -- deployed/admin_questions.php` | 94 additions, 61 deletions |
| `git diff --no-index --numstat -- NUL <new-production-file>` plus a read-only raw-byte/line/SHA-256 counter | Reproduced every new-file addition count and every final line, byte count, and current hash in the measurement table below |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 38 PASS, 0 FAIL |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL; the suite identifies its SQL evidence as static |
| PHP 8.3.16 `tests/context-lib.php` | 13 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-admin.php` | 19 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-preflight.php` | 6 PASS, 0 FAIL |
| PHP 8.3.16 `tests/php-render.php` | 9 PASS |
| PHP 8.3.16 `-l` on all 12 OT05 production/tool PHP files and all 3 context test PHP files | PASS |
| `git diff --check` and `git diff --cached --check` | PASS; ordinary LF/CRLF worktree warnings only |
| `node tools/extract-bank.js --check` | Source hashes, anchors, and counts pass; only the documented pre-existing Windows/CRLF `pre-2026` output-hash mismatch remains |
| `git check-attr text diff merge` and raw/path-filtered blob checks for all six supplied SQL paths | `text`, `diff`, and `merge` are unset; filtered blobs equal raw blobs; the staged root `questions.sql` blob also equals `main:002483b` |
| Adversarial production-validator partition probe | An otherwise exact not-applied snapshot whose `SHOW CREATE TABLE questions` field ends in `PARTITION BY HASH (id) PARTITIONS 4` returned `not applied (ready)` with `[]` errors |
| Migration/contract partition search | The inspector records `SHOW CREATE TABLE`, but the validator, forward assertion, and tests contain no partition compatibility check |
| MySQL client/manual rollback probe | Installed MySQL 8.4.3 `mysql --help` reports `reconnect TRUE` by default; the MySQL 8.0 manual says reconnect loses all table locks without notifying the client and recommends disabling auto-reconnect for such sessions; the runbook and tests contain no `--skip-reconnect` or equivalent guard |

The available MySQL client is 8.4.3, not the 8.0.41 target. It was used only to
confirm the documented client default, not as target-runtime migration evidence.
The PHP commands used the available PHP 8.3.16 executable at
`C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe`.

## Requested Finding Disposition

### BLOCK-3 - OPEN

The latest repair correctly closes the two concrete sub-vectors from the second
re-review. The inspector now collects index-part direction and CHECK constraints
(`tools/context-migration-inspector.php:27-49,115-121,136-160`), the production
contract rejects descending expected indexes and every unexpected CHECK
(`tools/context-migration-contract.php:214-237`), and the forward assertion
applies corresponding guards before mutation
(`deployed/sql/01-context-migration.sql:65-145,177-180`). The real contract tests
exercise both vectors (`tests/context-preflight.php:180-211,244-269`).

The preflight still approves a materially incompatible exact-base shape. The
inspector stores each `SHOW CREATE TABLE` result in `creates`
(`tools/context-migration-inspector.php:147-160`), but the validator reads only
session, table, column, index, and foreign-key metadata and never reads
`creates` or partition metadata (`tools/context-migration-contract.php:140-147`).
Its table query also selects only name, engine, and collation
(`tools/context-migration-inspector.php:99-106`). The adversarial probe supplied
the exact expected base metadata plus a partitioned `questions` definition and
received `not applied (ready)` with no errors.

The forward compatibility procedure likewise has no partition guard before its
first mutation (`deployed/sql/01-context-migration.sql:20-177`). It creates
`question_contexts`, adds the three question columns, and only then adds the two
unique membership keys and foreign key
(`deployed/sql/01-context-migration.sql:180-245`). The MySQL 8.0 manual requires
every unique key on a partitioned table to include every partition expression
column and states that partitioned InnoDB tables cannot participate in foreign
keys. A valid supplied-shape table partitioned by `id` therefore passes this
preflight, then the migration can fail after earlier DDL has already committed
because the new unique keys omit `id`; the later foreign key is independently
incompatible.

This contradicts the runbook's exact preflight and before-any-skip guarantees
(`deployed/sql/README.md:53-67,98-105`) and the package's exact-schema and safe
migration-artifact acceptance rows
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:89-92`). Neither
`tests/context-preflight.php` nor the static migration checks at
`tests/context-migration.js:320-356` contain a partition vector. Successful
target MySQL execution remains OT10 evidence, but accepting a known incompatible
shape is a current static design defect. `BLOCK-3` remains open.

### BLOCK-6 - OPEN

The latest repair correctly handles MySQL's documented `ALTER TABLE` lock-release
boundary on a stable connection. The rollback takes the first write locks,
guards and removes the question objects, reacquires `question_contexts WRITE`,
recounts the table, and only then drops it
(`deployed/sql/02-context-rollback.sql:20-61`). A writer that commits in the
post-ALTER gap is now detected, which repairs the exact race described by the
second re-review.

The deployment path does not make the second lock interval connection-safe.
The runbook says to use one uninterrupted client session and forbids `--force`,
but gives no rollback command using `--skip-reconnect` and no equivalent
connection-identity guard (`deployed/sql/README.md:119-158`). The `mysql`
command-line client enables reconnect by default. The MySQL 8.0 `LOCK TABLES`
manual states that a disconnect releases every table lock, a reconnect starts a
new session without those locks, and with auto-reconnect the client is not
notified; it specifically advises disabling auto-reconnect when lock state must
survive.

If the connection drops after the second `LOCK TABLES` at
`deployed/sql/02-context-rollback.sql:60`, the client can reconnect and execute
the `CALL` at line 61 in a new, unlocked session. A writer can then commit
between the procedure's count and drop at lines 46-51, recreating the silent-data
loss vector. The mandatory external write freeze reduces the likelihood but
does not make the script's claimed lock-backed exclusion or “never” guarantee
true.

The static test checks ordering and only rejects a literal `UNLOCK TABLES`
between each lock and call (`tests/context-migration.js:152-185,292-297`). It
does not assert a non-reconnecting client invocation or a server-side reconnect
sentinel. This still violates the non-destructive rollback requirement at
`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:71-72,92`. Direct target
contention remains OT10 evidence, but this deployment-contract gap is already
demonstrable without running MySQL. `BLOCK-6` remains open.

## Earlier Finding Regression Check

The latest fix changes only migration, rollback, preflight, tests, and their
runbook. Current hashes for the admin/helper production paths match the prior
accepted fix handoff, and the real helper/admin suites pass unchanged.

- `BLOCK-1`, `BLOCK-2`, `BLOCK-4`, and `BLOCK-5` remain closed.
- `FIX-1` through `FIX-5` remain closed.
- `BLOCK-7` remains closed: Git attributes and real blob-filter probes preserve
  all supplied SQL bytes.
- `FIX-6` remains closed: the persistent base is `cd2e6c9`, and the cumulative
  production inventory remains complete.
- Prior `NOTE-1`, `NOTE-2`, and `NOTE-3` remain non-blocking and outside the
  latest accepted fix scope. Current-facing coordinator/status/package docs are
  aligned; history still preserves the earlier monolithic/8-probe state.

No new finding ID is opened. The adversarial vectors above keep the two requested
prior blocker IDs open under their existing exact-schema and non-destructive
rollback requirements.

## Acceptance Coverage

| Acceptance check | Third re-review result |
|---|---|
| Migration preflight | **FAIL**; `BLOCK-3` shows that a partitioned supplied-shape base can still produce `PREFLIGHT OK` |
| Migration artifacts | **FAIL**; `BLOCK-3` permits a partially applied forward migration, and `BLOCK-6` leaves the final rollback guard/drop vulnerable after transparent client reconnect |
| Existing questions | PASS by static normal-shape design: the intended migration performs no DML and adds nullable columns; target execution remains OT10 evidence |
| Context create/edit | PASS locally through real normalization, dispatch, transaction, failed-state, and rendered-field tests |
| Link validation | PASS; malformed IDs/position/slot, wrong pool, duplicate position/slot, missing context, and member limits are rejected |
| Incomplete context | PASS for real helper/dispatcher behavior; incomplete or invalid groups cannot activate |
| Complete context | PASS for sequential real helper/dispatcher behavior; target MySQL lock semantics remain OT10 evidence |
| Member mutation | PASS for real production mutation functions, stale hints, atomic deactivation, and rollback under SQLite; two-connection target proof remains deferred |
| Delete | PASS for sequential context and question deletion paths with restrictive behavior and rollback evidence |
| Legacy rollback safety | PASS for publication design: linked rows are forced inactive and unchanged candidate queries still select only `is_active = 1` |
| PHP syntax | PASS locally on PHP 8.3.16 for every OT05 production/tool PHP file and context test file |
| Migration execution | Correctly deferred to OT10; no MySQL or production operation was attempted, but the static defects in `BLOCK-3` and `BLOCK-6` must be repaired first |

No parser fixture changed. `git diff --name-status cd2e6c9 -- fixtures src` is
empty, so no expected-output generation or fixture-provenance change is present.
The migration snapshots in tests are hand-authored, and the supplied SQL source
bytes were independently matched to the archive manifest and `main:002483b`.

## Externalize-First Verification

The independently verified package base is `cd2e6c9`. New files were measured
against an empty file because ordinary Git diffs exclude untracked files. Lines
are readable physical source lines and bytes are current raw bytes.

| Production file | Base lines/bytes | Add/del | Final lines/bytes | Responsibility, deployment, and direct production-path evidence |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1056 / 62915 | 94 / 61 | 1089 / 64488 | Deployed web entry and narrow wiring; includes/calls are checked statically, and the called production modules execute in `context-admin.php` |
| `deployed/admin_context_actions.php` | 0 / 0 | 244 / 0 | 244 / 9860 | Context dispatch, transactions, and PRG result; required by the entry and executed by `context-admin.php` |
| `deployed/admin_context_data.php` | 0 / 0 | 167 / 0 | 167 / 6495 | Strict link parsing and pre-render data; required by the entry and executed by `context-admin.php` |
| `deployed/admin_context_management.php` | 0 / 0 | 134 / 0 | 134 / 9708 | Query-free context-management view; included by the entry and rendered directly by `context-admin.php` |
| `deployed/admin_question_context_fields.php` | 0 / 0 | 28 / 0 | 28 / 2141 | Question-link fields view; included by the entry and rendered directly by `context-admin.php` |
| `deployed/admin_question_mutations.php` | 0 / 0 | 206 / 0 | 206 / 8833 | Atomic question writes/deletes and context deactivation; required by the entry and executed by `context-admin.php` |
| `deployed/context_lib.php` | 0 / 0 | 212 / 0 | 212 / 7970 | Shared context query/link helpers; required by the entry and executed by `context-lib.php` and `context-admin.php` |
| `deployed/context_input_validation.php` | 0 / 0 | 137 / 0 | 137 / 5744 | Context normalization/validation; included by `context_lib.php` and executed by both context PHP suites |
| `deployed/context_activation_validation.php` | 0 / 0 | 138 / 0 | 138 / 5867 | Activation-readiness validation; included by `context_lib.php` and executed by both context PHP suites |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 250 / 0 | 250 / 17870 | Guarded forward migration deployed through the SQL runbook; local tests read the real artifact, while direct MySQL execution remains OT10 evidence |
| `deployed/sql/02-context-rollback.sql` | 0 / 0 | 64 / 0 | 64 / 2512 | Two-phase guarded rollback deployed through the SQL runbook; local tests read the real artifact, while direct contention/execution remains OT10 evidence |
| `tools/context-migration-preflight.php` | 0 / 0 | 33 / 0 | 33 / 1146 | CLI preflight entry invoked by the runbook; its real connector-failure path executes in `context-preflight.php` |
| `tools/context-migration-contract.php` | 0 / 0 | 250 / 0 | 250 / 12720 | Canonical metadata validator; required by the CLI and executed with valid/adversarial snapshots by `context-preflight.php` |
| `tools/context-migration-inspector.php` | 0 / 0 | 198 / 0 | 198 / 9050 | Real metadata collector/reporter; required by the CLI and its grouping behavior executes in `context-preflight.php` |

`deployed/admin_questions.php` remains below the existing-file limit of 100
additions. Every new readable production file is at or below 250 lines; the
forward migration and preflight contract are exactly 250 lines. No Gate 1
exception was requested or used. Acceptance of fix scope is not a line-limit
exception. A further fix must retain `cd2e6c9` and the cumulative counters and
must not game the two exact-limit modules with compressed statements.

Each module has one focused responsibility and an explicit entry include, CLI,
or SQL-runbook deployment path. The PHP helper, dispatcher, mutation, and view
tests execute the real production modules. The full authenticated web entry,
browser PRG, successful database collector, MySQL DDL, and MySQL lock behavior
are not locally executed. Those gaps remain explicit rather than being replaced
by copied control flow or static SQL claims.

## Provenance And Excluded Artifacts

- `.gitattributes` is repository byte-preservation configuration, not production
  application code.
- Root `questions.sql`, `subjects.sql`, and `exam_category.sql` are exact supplied
  snapshots from `main:002483b`, excluded from production line limits.
- The three `archive/sql/2026-11-03-supplied/*.sql` files and `manifest.json` are
  immutable source evidence, excluded from production line limits.
- `deployed/sql/base-schema.working.sql` is the derived disposable-database
  fixture with only the settled `exam_category2` rename.
- `deployed/sql/README.md` is the migration/backup/rollback deployment runbook,
  not a production module.
- `tests/context-migration.js`, `tests/context-lib.php`,
  `tests/context-admin.php`, and `tests/context-preflight.php` are test evidence;
  their schemas/snapshots are hand-authored, while the PHP suites call the real
  production modules.
- The three earlier Phase 6 records are immutable review evidence.
- `db_conn.php` is unchanged; the preflight wrapper accommodates its fixed web
  exit behavior without editing it.
- No parser source, fixture, or generated artifact changed; `src/bookmarklet.js`
  remains outside OT05.

The two parser PENDING fixtures and the bank extractor's Windows/CRLF output-hash
mismatch predate OT05 and are not attributed to this package.

## Deferred Evidence And Residual Risk

Successful MySQL 8.0.41 preflight, forward migration, rerun, incompatible-object
rejection, rollback, and two-connection locking remain assigned to OT10 on a
disposable production-shaped database. Browser context PRG and leading-LF checks,
target-host PHP lint, Chromium, and Brave/Android staging also remain OT10 work.
Those explicit deferrals do not excuse the known static defects in `BLOCK-3` and
`BLOCK-6`.

The full authenticated admin request path and a successful real-database
preflight collector are not exercised locally. SQLite strips `FOR UPDATE`, so it
executes production control flow but does not prove target lock semantics. The
question insert branch also remains constrained by the unresolved
`questions.practice_title` contract. The practice writer/readers audit remains
the independent OT06 external gate; OT06 must not start from this verdict.

## Verdict

- **Verdict:** `BLOCK`
- **Commit readiness:** not commit-ready; `BLOCK-3` and `BLOCK-6` remain open
- **Review status:** complete; both requested findings were explicitly
  re-evaluated, but neither can be closed
- **Findings closed by this re-review:** none
- **Findings still open:** `BLOCK-3`, `BLOCK-6`
- **Previously closed findings:** remain closed with no detected regression
- **Pending user decision:** run the named focused Phase 6 fix session; do not
  commit the phase or start OT06

## Exact Recommended Next Action

Run a focused Phase 6 fix session for `BLOCK-3` and `BLOCK-6`. Add failing
evidence first for a partitioned supplied-shape base and for loss of rollback
session state under the default reconnecting MySQL client. Reject incompatible
partitioning before any DDL, make the rollback deployment path fail closed on
reconnect, retain `cd2e6c9` and all cumulative line counters, keep successful
MySQL/browser execution in OT10, do not commit, and do not start OT06. Then
re-review Phase 6 again without overwriting any prior record.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 6 BLOCK-3 BLOCK-6
