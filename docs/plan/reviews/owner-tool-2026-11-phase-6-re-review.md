# Owner Tool 2026-11 Phase 6 Re-Review

- **Date:** 2026-11-04
- **Reviewer:** OpenCode, independent re-review session
- **Package:** OT05 - Context Schema and Admin, including OT05-EXT-01 and the
  accepted Phase 6 fixes
- **Scope:** `owner-tool-integration` at `cd2e6c9` plus the current uncommitted
  OT05 worktree, compared with the exact pre-implementation package base
  `cd2e6c9`
- **Original record:** `owner-tool-2026-11-phase-6.md`; it was not overwritten
- **Requested closers:** BLOCK-1 through BLOCK-5 and FIX-1 through FIX-5

## Independence And Scope

The implementation and fix handoffs were treated as untrusted claims. This
session inspected the current PHP modules, entry-point wiring, migration and
rollback SQL, real preflight contract and inspector, tests, supplied DDL
provenance, current documentation, and Git history. It ran the complete local
baseline and every available OT05 acceptance command.

No product, test, fixture, package-status, or handoff file was edited. The only
file written is this re-review record. No branch was created, switched, merged,
or moved, and no commit was made. No browser, live site, production database,
write, delete, or cleanup action was used.

Git history and reflog independently establish `cd2e6c9` as the checked-out
commit before the supplied DDL was copied and before OT05 Gate 1 began.
`405439b` is the earlier OT04 code baseline, not the exact OT05 package base.
The `405439b..cd2e6c9` range changes documentation only, so the production
numstats happen to be the same from either ref, but the externalize-first record
must still name the exact base.

The staged root SQL files are supplied inputs copied from `main:002483b`, not
OT05 production changes. The dirty worktree also contains pre-existing process
and history documentation, including `INTENT.md`, the OT04 package, and generic
prompt changes. No unrelated application change was attributed to OT05.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch` | `owner-tool-integration...origin/owner-tool-integration`; OT05 files remain uncommitted, supplied root SQL remains staged, and only the original Phase 6 review existed before this record |
| `git rev-parse HEAD`, `git log --oneline --decorate -15`, and `git reflog --date=iso -30` | HEAD is `cd2e6c9`; the reflog and history place the DDL copy and OT05 work after that ref |
| `git diff --name-status 405439b..cd2e6c9` | Documentation only; no production file differs between the code baseline and exact package base |
| `git diff --numstat cd2e6c9 -- deployed/admin_questions.php` | 94 additions, 61 deletions |
| `git diff --no-index --numstat -- /dev/null <new-production-file>` plus a read-only Node raw-byte/line counter | Reproduced every new-file addition count and every final line/byte count in the measurement table below |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 38 PASS, 0 FAIL |
| `node tests/context-migration.js` | 12 PASS, 0 FAIL; this suite explicitly provides static SQL/wiring evidence only |
| PHP 8.3.16 `tests/context-lib.php` | 13 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-admin.php` | 19 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-preflight.php` | 5 PASS, 0 FAIL |
| PHP 8.3.16 `tests/php-render.php` | 9 PASS |
| PHP 8.3.16 `-l` on all 12 OT05 production/tool PHP files and all 3 context test PHP files | PASS |
| `git diff --check` | PASS for unstaged tracked changes; line-ending conversion warnings only |
| `git diff --cached --check` | FAIL on every line of the three staged supplied CRLF SQL snapshots; this is excluded source evidence but is relevant to BLOCK-7 |
| `node tools/extract-bank.js --check` | Source hashes, anchors, and counts pass; only the documented pre-existing Windows/CRLF `pre-2026` output-hash mismatch remains |
| Root/archive/manifest/`main:002483b` SHA-256, byte, and blob comparison | Current worktree bytes agree for all three supplied SQL files |
| Production preflight-validator adversarial probe | An extra index, an extra differently named cascading foreign key, and a wrong connection collation each returned `already applied (rerun safe)` with zero errors |
| Git clean-filter adversarial probe using `git hash-object --no-filters` and `git hash-object --path=<archive-path>` | Raw and filtered blob IDs differ for every untracked archive SQL file because `core.autocrlf=true` and no `.gitattributes` rule preserves those bytes |
| Strict optional-link adversarial probe | Blank omission and positive integers pass; malformed scalars, decimals, zero, negatives, arrays, floats, and booleans are rejected without writes |

The bare `php` command was not on this PowerShell PATH, so the PHP commands
used the available PHP 8.3.16 executable at
`C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe`.

## Prior Findings

### BLOCK-1 - CLOSED

Context update begins a transaction before locking the context and member rows
and before validation (`deployed/admin_context_actions.php:46-64`). Context
delete likewise locks the context and members before checking or deleting it
(`deployed/admin_context_actions.php:181-200`).

Question mutations sort and lock affected context IDs before locking the
question row, retry a stale former-context hint, validate the target under the
same transaction, and deactivate the actual former and target contexts before
commit (`deployed/admin_question_mutations.php:5-23,87-160`). Question deletion
uses the same stale-hint retry and atomic deactivation pattern
(`deployed/admin_question_mutations.php:163-205`). The production entry point
calls these functions at `deployed/admin_questions.php:405-440,531-551`.

`tests/context-admin.php:467-559` executes the real mutation module for
link/move/unlink/delete, stale hints, deactivation failures, and rollback. SQLite
strips `FOR UPDATE`, so two-connection MySQL lock behavior remains OT10 evidence,
but the original stale pre-transaction control flow is removed.

### BLOCK-2 - CLOSED

`cbt_admin_optional_positive_int()` distinguishes omission from invalid input
and rejects non-string/non-integer values and non-positive whole-number syntax
(`deployed/admin_context_data.php:24-51`). The real mutation path refuses parsed
errors before a write (`deployed/admin_question_mutations.php:80-83`), and linked
questions cannot retain active publication state
(`deployed/admin_context_data.php:63-96`). The real admin tests cover malformed
context, position, and slot values (`tests/context-admin.php:402-420`).

### BLOCK-3 - OPEN

The repair now compares every expected column and each expected named index and
foreign key in detail, but it still does not establish the exact supplied or
applied shape claimed by the handoff and runbook.

The production validator collects `connection_collation` but validates only the
connection/database charset and database collation
(`tools/context-migration-contract.php:155-165`). It iterates expected index
and foreign-key names without comparing the actual name sets
(`tools/context-migration-contract.php:220-240`). The adversarial production
validator probe therefore accepted a wrong connection collation, an extra index,
and an extra cascading foreign key as rerun-safe.

The forward SQL assertion also remains incomplete. Its named-index checks count
only matching expected rows, so an expected two-column index with a trailing
third column still yields the expected count and is then skipped
(`deployed/sql/01-context-migration.sql:59-92,190-209`). Its existing
`question_contexts` check can count the 13 expected-looking columns while
ignoring extra columns and several exact metadata properties before
`CREATE TABLE IF NOT EXISTS` skips the table
(`deployed/sql/01-context-migration.sql:31-47,144-165`). This does not satisfy
the handoff claim that incompatible existing objects are rejected before every
guarded skip (`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:369-371`)
or the exact preflight acceptance contract
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:89-92`).

`tests/context-preflight.php:171-199` verifies malformed expected named objects,
but not extra objects or connection collation. `tests/context-migration.js` is a
static string/order check and cannot prove the SQL assertion behavior.

### BLOCK-4 - CLOSED

The rollback now checks non-null `context_id`, `context_position`, and
`context_slot` independently before removal
(`deployed/sql/02-context-rollback.sql:20-63`). Guard and removal are in the same
procedure, with one top-level call (`deployed/sql/02-context-rollback.sql:65-102`),
so the original missing-column guard and client `--force` continuation vectors
are repaired. BLOCK-6 records a separate concurrent-write defect.

### BLOCK-5 - CLOSED

Failed request values remain in the action result before validation or PDO work
(`deployed/admin_context_actions.php:33-44,109-115`). Page preparation preserves
POST values (`deployed/admin_context_data.php:107-165`), and the view compares
both pool IDs as strings (`deployed/admin_context_management.php:39,48`). The
real view regression confirms both selected options after failure
(`tests/context-admin.php:654-672`).

### FIX-1 - CLOSED

Context normalization records non-scalar errors without casting arrays to
strings (`deployed/context_input_validation.php:4-11,15-60`). Question link
fields use the strict optional-positive parser above. The real helper/admin tests
cover non-scalar and malformed values without conversion warnings or writes.

### FIX-2 - CLOSED

The context textarea emits one sacrificial LF before escaped stored content
(`deployed/admin_context_management.php:66-69`). The production view regression
checks the emitted two-LF boundary for a genuine leading newline
(`tests/context-admin.php:654-672`). Browser parsing remains deferred to OT10.

### FIX-3 - CLOSED

`tests/context-admin.php` requires the deployed mutation module directly
(`tests/context-admin.php:7-10`) and invokes its real link, move, unlink, delete,
stale-hint, deactivation, and rollback paths (`tests/context-admin.php:467-559`).
The test no longer substitutes copied mutation SQL/control flow for the
production function. Entry-point inclusion and calls are separately checked by
`tests/context-migration.js:160-180`.

### FIX-4 - CLOSED

The production CLI registers its failure shutdown guard before loading
`db_conn.php` and changes the guard state only after receiving a PDO instance
(`tools/context-migration-preflight.php:11-28`). The real CLI connector-failure
probe returns nonzero and never prints `PREFLIGHT OK`
(`tests/context-preflight.php:230-247`).

### FIX-5 - CLOSED

All context listing and activation-status queries now run inside page-data
preparation's PDO boundary (`deployed/admin_context_data.php:107-167`), called
before output at `deployed/admin_questions.php:703-724`. The rendered management
view consumes prepared `status_label` values and performs no query
(`deployed/admin_context_management.php:78-101`). The failure regression is
`tests/context-admin.php:449-465`.

## New Findings

### BLOCK-6 - Rollback can race a concurrent writer and drop newly committed data

The rollback reads ordinary unlocked counts in separate statements
(`deployed/sql/02-context-rollback.sql:20-57`), evaluates them once
(`deployed/sql/02-context-rollback.sql:59-63`), and then executes multiple DDL
statements (`deployed/sql/02-context-rollback.sql:65-97`). There is no write
freeze, table lock, or other exclusion covering the guard through the final
drop. A context or membership write can commit after its count was read and
before the corresponding column/table is dropped.

The runbook promises that populated context data is never silently dropped but
does not require a maintenance/write freeze
(`deployed/sql/README.md:118-136`). Keeping guard and removal in one procedure
solves client continuation, not concurrent DML. This breaches the package's
non-destructive rollback requirement
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:71-72,92`).

### BLOCK-7 - Normal staging would corrupt the byte-exact SQL archive evidence

The current root and archive SQL worktree bytes match `main:002483b`, the
manifest, and the recorded SHA-256 values. However, the archive files are
untracked, `core.autocrlf=true`, and no `.gitattributes` rule marks the supplied
SQL as byte-preserved. For all three archive files, `git hash-object --path`
produced a different blob from `git hash-object --no-filters`. A normal
`git add` would therefore store normalized bytes rather than the exact supplied
bytes claimed by `archive/sql/2026-11-03-supplied/manifest.json:3-4` and asserted
by `tests/context-migration.js:70-83`.

This is a commit-readiness guardrail breach, not a current worktree hash
mismatch. The archive must be made Git-safe without rewriting the supplied
files, and the test must prove repository/blob preservation rather than passing
only because this Windows checkout restores CRLF.

### FIX-6 - The cumulative externalize-first record uses the wrong base and omits a production module

The exact package base is `cd2e6c9`, but the fix handoff labels `405439b` as the
original base (`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:395`) and
the persistent entry-size test hardcodes that ref
(`tests/context-migration.js:201-208`). Production counts are unchanged only
because the intervening commits are documentation-only.

The cumulative measurement and responsibility tables also omit
`deployed/admin_question_context_fields.php`, a 28-line, 2,141-byte production
view included by `deployed/admin_questions.php:838` and rendered directly by
`tests/context-admin.php:591-640`. It is mentioned only as unchanged by the
latest fix (`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:485-490`).
This is missing required handoff evidence with no current line-limit breach.

## Acceptance Coverage

| Acceptance check | Re-review result |
|---|---|
| Migration preflight | **FAIL**; BLOCK-3 shows exact connection/index/FK shape is not established |
| Migration artifacts | **FAIL**; BLOCK-3 leaves incompatible guarded-skip cases and BLOCK-6 leaves rollback data loss under concurrent writes |
| Existing questions | PASS by static design: forward migration performs no DML and adds nullable columns; runtime proof remains OT10 scope |
| Context create/edit | PASS locally through real normalization, dispatch, transaction, failed-state, and rendered-field tests |
| Link validation | PASS; malformed IDs/position/slot, wrong pool, duplicate position/slot, missing context, and member limits are rejected |
| Incomplete context | PASS for real helper/dispatcher behavior; activation rejects incomplete or invalid groups |
| Complete context | PASS for sequential real helper/dispatcher behavior; MySQL lock semantics remain OT10 evidence |
| Member mutation | PASS for real production mutation functions, stale hints, atomic deactivation, and rollback under SQLite; two-connection MySQL proof remains deferred |
| Delete | PASS for sequential context and question deletion paths with restrictive behavior and rollback evidence |
| Legacy rollback safety | PASS for publication design: linked rows are forced inactive and unchanged candidate queries still select only `is_active = 1` |
| PHP syntax | PASS locally on PHP 8.3.16 for every changed/new OT05 PHP source and test file |
| Migration execution | Correctly deferred to OT10; no MySQL or production operation was attempted, but static design defects BLOCK-3/BLOCK-6 must be fixed first |

## Externalize-First Verification

The independently verified package base is `cd2e6c9`. New files were measured
against an empty file because ordinary `git diff <base>` excludes untracked
files. Lines are readable physical source lines; bytes are current raw file
bytes.

| Production file | Base lines/bytes | Add/del | Final lines/bytes | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1056 / 62915 | 94 / 61 | 1089 / 64488 | Deployed web entry and narrow wiring; includes/calls are checked statically and the called production modules are executed by `context-admin.php` |
| `deployed/admin_context_actions.php` | 0 / 0 | 244 / 0 | 244 / 9860 | Context dispatch, transactions, and PRG result; required at entry line 9 and executed by `context-admin.php` |
| `deployed/admin_context_data.php` | 0 / 0 | 167 / 0 | 167 / 6495 | Strict link parsing and pre-render data; required at entry line 8 and executed by `context-admin.php` |
| `deployed/admin_context_management.php` | 0 / 0 | 134 / 0 | 134 / 9708 | Query-free context view; included at entry line 947 and rendered directly by `context-admin.php` |
| `deployed/admin_question_context_fields.php` | 0 / 0 | 28 / 0 | 28 / 2141 | Question-link view; included at entry line 838 and rendered directly by `context-admin.php` |
| `deployed/admin_question_mutations.php` | 0 / 0 | 206 / 0 | 206 / 8833 | Atomic question writes/deletes and context deactivation; required at entry line 10 and executed by `context-admin.php` |
| `deployed/context_lib.php` | 0 / 0 | 212 / 0 | 212 / 7970 | Shared context query/link helpers; required at entry line 7 and executed by `context-lib.php` and `context-admin.php` |
| `deployed/context_input_validation.php` | 0 / 0 | 137 / 0 | 137 / 5744 | Input normalization/validation; included by `context_lib.php:211` and executed by both context PHP suites |
| `deployed/context_activation_validation.php` | 0 / 0 | 138 / 0 | 138 / 5867 | Activation readiness validation; included by `context_lib.php:212` and executed by both context PHP suites |
| `deployed/sql/01-context-migration.sql` | 0 / 0 | 223 / 0 | 223 / 13058 | Forward/rerun migration deployed through the SQL runbook; local evidence is static and direct MySQL execution remains OT10 scope |
| `deployed/sql/02-context-rollback.sql` | 0 / 0 | 102 / 0 | 102 / 4507 | Guarded rollback deployed through the SQL runbook; local evidence is static and direct MySQL execution remains OT10 scope |
| `tools/context-migration-preflight.php` | 0 / 0 | 33 / 0 | 33 / 1146 | CLI preflight entry invoked by the runbook; its real connector-failure path is executed by `context-preflight.php` |
| `tools/context-migration-contract.php` | 0 / 0 | 243 / 0 | 243 / 11971 | Canonical metadata validator; required by the CLI and executed by `context-preflight.php` |
| `tools/context-migration-inspector.php` | 0 / 0 | 175 / 0 | 175 / 8020 | Metadata collection/grouping/reporting; required by the CLI and its real grouping path is executed by `context-preflight.php` |

The existing production entry stays below 100 additions. Every new readable
production module stays below 250 lines; the closest are 244 and 243 lines. No
line-limit exception was requested or needed. The owner's acceptance of
OT05-EXT-01 and the ten original review fixes was scope approval, not an
externalize-first exception. No exact Gate 1 exception approval exists because
none is required.

Each module has one focused responsibility and an explicit include, CLI, or
runbook deployment path. The full web entry point, authentication, upload, HTTP
redirect, and browser behavior are not executed by the local harness. SQLite
tests strip `FOR UPDATE`, so they execute production control flow and rollback
but do not prove MySQL lock semantics. The SQL suite is explicitly static; it
does not claim copied SQL as runtime migration proof.

## Provenance, Fixtures, And Excluded Artifacts

- The three staged root SQL files are supplied source evidence from
  `main:002483b`, excluded from production line limits.
- The three archive SQL copies and `manifest.json` are evidence snapshots,
  excluded from production line limits; BLOCK-7 prevents commit readiness.
- `deployed/sql/base-schema.working.sql` is an 89-line, 4,140-byte derived
  disposable-database fixture, not a deployed migration module.
- `deployed/sql/README.md` is the migration/backup/rollback runbook, not
  production code.
- `tests/context-admin.php`, `tests/context-lib.php`,
  `tests/context-migration.js`, and `tests/context-preflight.php` are test
  evidence. Their SQLite schemas and preflight snapshots are hand-authored,
  while the tests call the real production PHP functions.
- No parser fixture changed. `git diff --name-status cd2e6c9 -- fixtures` is
  empty, so no generated expectation or provenance change is present.
- `db_conn.php` is unchanged. The preflight wrapper accommodates its fixed web
  exit behavior without editing it.
- No generated artifact changed; `src/bookmarklet.js` remains outside OT05.
- Pre-existing process/history dirt includes `INTENT.md`, the OT04 package, and
  generic prompt files. No unrelated application change was found.

The original NOTE-1 direct-request hardening issue remains unchanged. NOTE-2's
dirty-worktree attribution concern remains, with its production-measurement
portion now captured by FIX-6. NOTE-3 also remains: `docs/plan/history.md:170-192`
still describes the pre-externalization entry point and old test counts. These
notes were outside the owner's accepted ten-finding fix scope and remain
non-blocking.

## Deferred Evidence And Residual Risk

MySQL 8.0.41 successful preflight, forward migration, rerun, incompatible-object
rejection, guarded rollback, and two-connection locking remain assigned to OT10
on a disposable production-shaped database. Browser PRG/textarea checks,
target-host PHP lint, Chromium, and Brave/Android staging also remain OT10 work.
No deferred runtime check excuses the static defects in BLOCK-3 or BLOCK-6.

The unaudited practice writer/readers and `questions.practice_title` contract
remain the existing OT06 external gate. OT06 must not start from this verdict.

## Verdict

- **Verdict:** `BLOCK`
- **Commit readiness:** not commit-ready; BLOCK-3 remains open, and BLOCK-6 and
  BLOCK-7 are new blockers
- **Review status:** complete; BLOCK-1, BLOCK-2, BLOCK-4, BLOCK-5, and FIX-1
  through FIX-5 are closed; BLOCK-3, BLOCK-6, BLOCK-7, and FIX-6 require a
  focused fix and another re-review
- **Findings closed by re-review:** BLOCK-1, BLOCK-2, BLOCK-4, BLOCK-5, FIX-1,
  FIX-2, FIX-3, FIX-4, FIX-5
- **Pending user decision:** run the named Phase 6 fix session; do not commit the
  phase or start OT06

## Exact Recommended Next Action

Run a focused Phase 6 fix session for BLOCK-3, BLOCK-6, BLOCK-7, and FIX-6. Add
failing evidence first, retain `cd2e6c9` as the exact cumulative package base,
do not rewrite supplied SQL bytes, keep successful MySQL/browser execution in
OT10, do not commit, and do not start OT06. Then re-review Phase 6 again.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 6 BLOCK-3 BLOCK-6 BLOCK-7 FIX-6
