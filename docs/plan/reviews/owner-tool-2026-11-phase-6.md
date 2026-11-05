# Owner Tool 2026-11 Phase 6 Review

- **Date:** 2026-11-04
- **Reviewer:** OpenCode, independent review session
- **Package:** OT05 - Context Schema and Admin, including OT05-EXT-01
- **Scope:** `owner-tool-integration` at `cd2e6c9` plus the uncommitted OT05 and
  OT05-EXT-01 worktree changes, compared with the OT04 code baseline at
  `405439b`
- **Record:** original phase-6 review; no earlier phase-6 record exists to
  overwrite or close

## Independence And Scope

This session treated both handoffs as untrusted claims. It inspected the
supplied and archived DDL, migration and rollback artifacts, preflight, context
helper, externalized request/data/view includes, admin integration paths, tests,
and current-facing documentation. It ran the available baseline and package
probes and added adversarial probes for malformed link values, failed-form
round trips, non-scalar input, preflight exit status, and transaction ordering.

No product, test, fixture, package-status, or handoff file was edited. The only
file written is this review record. No branch was created, switched, merged, or
moved; no commit was made. No browser, live site, production database, write,
delete, or cleanup action was used.

The staged root `questions.sql`, `subjects.sql`, and `exam_category.sql` files
are supplied inputs copied from `main` commit `002483b`, not OT05 implementation.
The context PHP/SQL files, preflight, context tests, archive manifest, modified
admin entry point, and associated documentation are OT05/OT05-EXT-01 scope.
The dirty documentation also includes pre-existing gate-reconciliation changes;
NOTE-2 records that the handoff does not attribute those files exactly. No
unrelated application change was identified or attributed to OT05.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch` | On `owner-tool-integration...origin/owner-tool-integration`; OT05/EXT files are uncommitted, the three supplied root SQL files are staged, and no phase-6 review record previously existed |
| `git diff --stat`, `git diff --name-status`, and cached equivalents | Modified admin/docs plus staged supplied SQL; untracked context PHP/SQL, archive, tests, and preflight accounted for above |
| `git diff --check` | PASS; CRLF conversion warnings only |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 38 PASS, 0 FAIL |
| `node tests/context-migration.js` | 10 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-lib.php` | 12 PASS, 0 FAIL |
| PHP 8.3.16 `tests/context-admin.php` | 14 PASS, 0 FAIL |
| PHP 8.3.16 `tests/php-render.php` | 9 PASS |
| PHP 8.3.16 `-l` on all OT05/EXT PHP source, tool, and test files | PASS |
| `node tools/extract-bank.js --check` | Source hashes, anchors, and counts pass; only the documented pre-existing Windows/CRLF `pre-2026` output-hash mismatch remains |
| Supplied SQL SHA-256/byte/blob comparison | Root and archive copies match each other, the manifest, the handoff, and the staged blobs from `main:002483b`; the working copy alone applies `exam_category2` to `exam_category` |
| Current handoff SHA-256 checks | Current OT05-EXT-01 PHP/test hashes and unchanged migration/helper/preflight hashes match their handoffs |
| In-memory malformed-link probe | `context_id=bogus`, `0`, `-1`, or `1.0` normalized to `null`, produced no validation error, and permitted `is_active=1`; malformed optional position/slot values were also discarded where absence is valid |
| In-memory failed-form rendering probe | Normalized subject/category IDs were integers, but the real view strictly compared them with string option values; neither matching option rendered `selected` after validation or write failure |
| In-memory non-scalar-input probe | Array title/context values emitted conversion warnings and normalized to the literal string `Array` |
| `php -r "exit('simulated failure');"` | Printed the message and returned exit status 0, reproducing the preflight connector-failure status problem without a database connection |
| Transaction-order adversarial analysis | Found stale pre-transaction reads that permit a linked member/pool mismatch and permit a moved member's actual former context to remain active under overlapping requests |

The context PHP tests execute the real helper, dispatcher, preparation, and
view includes against hand-authored SQLite tables. The migration test is static.
SQLite removes `FOR UPDATE`, and the question mutation cases reproduce SQL and
transaction calls in the test rather than executing the corresponding branches
of `deployed/admin_questions.php`. These limits are material to FIX-3 but do not
invalidate the genuine helper/dispatcher coverage.

## Acceptance Coverage

| Acceptance check | Review result |
|---|---|
| Migration preflight | **FAIL**; BLOCK-3 shows that incompatible types, indexes, and foreign-key actions can still produce `PREFLIGHT OK` |
| Migration artifacts | **FAIL**; forward/rerun structure is present, but BLOCK-4 violates the required non-destructive rollback contract |
| Existing questions | PASS by static design: the forward migration performs no DML and adds nullable columns; production-shaped runtime proof remains correctly deferred to OT10 |
| Context create/edit | **FAIL**; BLOCK-5 loses selected pool fields after a rejected request, and FIX-1/FIX-2 cover additional input-preservation defects |
| Link validation | **FAIL**; normal missing-ID, pool, position, and cloze-token cases are covered, but BLOCK-2 accepts malformed supplied IDs/optional link fields as omitted |
| Incomplete context | PASS for sequential helper/dispatcher behavior; activation rejects incomplete groups |
| Complete context | PASS for sequential SQLite/helper behavior; MySQL locking remains OT10 evidence, while BLOCK-1 prevents acceptance of the concurrent production contract |
| Member mutation | **FAIL**; sequential deactivation is present, but BLOCK-1 permits stale-context publication state and FIX-3 identifies missing production-path execution evidence |
| Delete | PASS for sequential dispatcher behavior and restrictive parent deletion; target MySQL proof remains OT10 evidence |
| Legacy rollback safety | PASS only for sequential reviewed paths; linked rows are forced inactive and old active-row queries are unchanged, but BLOCK-1 can leave an incomplete context active |
| PHP syntax | PASS locally on PHP 8.3.16; target-runtime repetition remains OT10 evidence |
| Migration execution | Correctly deferred to OT10; no MySQL or production operation was attempted in this review |

No OT05 parser fixture was added or changed. The supplied SQL provenance is
source-backed and byte-verified; SQLite schemas and expected messages are
hand-authored test infrastructure rather than generated production fixtures.
The two parser-suite PENDING fixtures and the extractor CRLF mismatch predate
OT05 and are not attributed to it.

## Findings

### BLOCK-1 - Request validation occurs before the transactions that must protect context invariants

Context update reads and validates the existing row before its write
(`deployed/admin_context_actions.php:63-77`). Question update reads the former
context and validates the target at `deployed/admin_questions.php:499-530`, then
processes uploads before beginning its transaction at
`deployed/admin_questions.php:533-573`. Question delete similarly reads the
context before starting its transaction (`deployed/admin_questions.php:413-420`).

The sequential checks are correct, but overlapping native requests can invalidate
their facts. One request can validate an English question against an empty
English context, another can change that still-empty context to Maths, and the
first can then commit the English member. More seriously, a stale move can read
former context A, another request can move the member to B and activate B, and
the stale request can then move it to C while deactivating only stale A and
target C at `deployed/admin_questions.php:608`. B remains active while missing a
member.

This breaches metadata compatibility, atomic activation/publication safety, and
member-mutation deactivation required by
`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:58-64,79-81,96-98`.
Validation and the affected context reads must occur under an appropriate
transaction/lock, with the actual former context re-established at write time.

### BLOCK-2 - Malformed link values are accepted as if the administrator omitted them

`cbt_admin_positive_int_or_null()` maps blank, malformed, zero, negative, and
decimal values to the same `null` (`deployed/admin_context_data.php:17-20`). An
absent context with absent position/slot is valid
(`deployed/context_lib.php:235-241`), and the prepared record can retain
`is_active=1` (`deployed/admin_context_data.php:31-60`). Consequently,
`context_id=bogus` is saved as an active standalone question rather than being
rejected as an invalid intended link. Malformed optional position/slot values
are likewise silently discarded in comprehension or unlinked branches where
absence is valid.

This directly fails the package's “invalid slot/ID rejected” acceptance row at
`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:95`. Existing tests at
`tests/context-admin.php:316-351` cover numeric missing IDs and ordinary link
validation but not malformed supplied link values.

### BLOCK-3 - The migration preflight can approve an incompatible target schema

The preflight retrieves details but largely validates object names rather than
their complete definitions (`tools/context-migration-preflight.php:106-145,
189-236`). The forward migration also skips named objects that already exist
(`deployed/sql/01-context-migration.sql:44-90`). For example, a `subjects.id`
with a wrong integer type passes the table/column-name checks, and a correctly
named `fk_questions_context` using `ON DELETE CASCADE` passes and is then skipped.

The runbook presents literal `PREFLIGHT OK` as the gate without requiring a
manual comparison to canonical definitions
(`deployed/sql/README.md:44-59,72-78`). This fails exact target
schema/version/engine/charset confirmation and can preserve a cascade surprise,
contrary to package acceptance
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:91-92,99`). Static green
tests only assert reporting/name patterns and do not cover wrong-shaped existing
objects (`tests/context-migration.js:238-248`).

### BLOCK-4 - Rollback can silently discard populated membership columns

The rollback guard checks only non-null `context_id`
(`deployed/sql/02-context-rollback.sql:33-45`) before dropping `context_id`,
`context_position`, and `context_slot` (`deployed/sql/02-context-rollback.sql:81-94`).
The migration defines nullable columns and unique indexes but no database check
that forbids a position or slot when `context_id` is null
(`deployed/sql/01-context-migration.sql:44-74`). Direct/imported data can
therefore contain membership values that pass the rollback guard and are then
destroyed.

The documented normal MySQL client stops after a signaled error, so importer
continuation is not the basis of this finding. The defect is the incomplete data
guard itself. It violates the explicit rollback requirement to never destroy
populated context data silently
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:71-72,92`).

### BLOCK-5 - Rejected context forms lose the selected subject and category

Context input normalization stores `subject_id` and `exam_category_id` as
integers (`deployed/context_lib.php:65-68`). Both validation and PDO failure
paths retain those normalized values
(`deployed/admin_context_actions.php:59-75,119-123,233-236`), but the view uses
strict comparisons against string option values
(`deployed/admin_context_management.php:39,48`). The real rendering probe showed
that neither matching option received `selected` after either failure class.

This is a reproduced failure of the “fields round-trip exactly” acceptance row
at `docs/plan/owner-tool/ot-05-context-schema-and-admin.md:94`.

### FIX-1 - Malformed non-scalar and optional link input is not rejected consistently

`cbt_context_normalize_input()` casts raw title/text values directly to strings
(`deployed/context_lib.php:52-59`). Array input emits warnings and becomes the
valid-looking literal `Array`; normalization also occurs before the dispatcher's
exception boundary (`deployed/admin_context_actions.php:59-63`). In addition to
BLOCK-2's publication-impacting ID case, malformed optional position/slot values
are silently converted to absence by `deployed/admin_context_data.php:17-20`.
The native question handler already demonstrates scalar discrimination at
`deployed/admin_questions.php:369-373`.

### FIX-2 - A leading context-text newline is not preserved on re-render

The context textarea emits the stored value immediately after its start tag
(`deployed/admin_context_management.php:68`). HTML textarea parsing ignores one
LF immediately after that tag, so one genuine leading newline is lost. The
question textarea uses a sacrificial LF to avoid the same problem
(`deployed/admin_questions.php:900`). The emitted bytes were confirmed locally;
a real browser vector remains appropriate in the fix evidence.

### FIX-3 - OT05-EXT-01 overstates executable question-mutation evidence

The remediation handoff claims executable link/move/unlink/delete deactivation
and rollback coverage
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:283-291`), and the
checklist requires executable transaction evidence
(`docs/plan/owner-tool/next-steps.md:80-82`). The context tests execute the real
dispatcher and helper, but mutation cases issue copied SQL and transaction calls
inside the test (`tests/context-admin.php:378-426`) rather than executing the
production branches at `deployed/admin_questions.php:404-654`. The static order
checks at `tests/context-migration.js:207-229` do not close that integration gap.

### FIX-4 - A connector failure can make the preflight exit successfully

The preflight contract says exit status 0 means ready
(`tools/context-migration-preflight.php:14-16`), but it requires `db_conn.php`
outside its `try` (`tools/context-migration-preflight.php:18-20`). The connector
uses `exit(string)` on failure (`db_conn.php:22-25`), which PHP returns as status
0. The no-database adversarial probe reproduced that PHP behavior. The runbook's
literal `PREFLIGHT OK` requirement reduces the operational impact but does not
make the exit contract correct.

### FIX-5 - Context status rendering has no PDO exception boundary

The management view performs database-backed activation validation for every
listed context after output has begun (`deployed/admin_context_management.php:92`).
Its include at `deployed/admin_questions.php:1004` is outside the earlier request
exception boundaries. A transient query failure or partial deployment can
therefore produce a partially rendered fatal response instead of the admin
error flow.

### NOTE-1 - View fragments have no direct-request guard

If `deployed/` files are directly web-addressable,
`deployed/admin_context_management.php` and
`deployed/admin_question_context_fields.php` can be requested without the entry
point and emit undefined-variable warnings or partial markup. No unauthenticated
write path or sensitive data disclosure was demonstrated, so this is a
hardening note rather than a release blocker.

### NOTE-2 - The handoff does not exactly attribute the full dirty worktree

The implementation handoff refers only to unspecified “pre-existing Gate 1
documentation changes”
(`docs/plan/owner-tool/ot-05-context-schema-and-admin.md:263-266`). Its file
lists at lines 221-237 and 301-312 do not explicitly account for the modified
OT04 and OT10 package files, contrary to the exact-file handoff requirement at
`docs/plan/README.md:171-172`. The pre-remediation 1,524-line source is also not
retained, so the current 98-addition admin diff and final hashes are
reproducible, but the claimed before-remediation reduction is not independently
reconstructable.

### NOTE-3 - History stops at the pre-externalization OT05 state

`docs/plan/history.md:170-192` still describes context actions in the monolithic
admin entry point and 8 migration probes. It does not record OT05-EXT-01's
focused includes or the final 10 migration and 14 admin test counts. The active
coordinator, map, status, package, next steps, and instructions are aligned, so
this is historical completeness rather than a current-state ambiguity.

## Deferred Evidence And Residual Risk

MySQL 8.0.41 preflight/forward/rerun/rollback execution, target-host PHP lint,
browser PRG checks, and Chromium/Brave staging remain correctly assigned to
OT10. This review did not turn those explicit deferrals into OT05 findings.
SQLite does not prove MySQL locking or constraint behavior, and the unaudited
practice writer/readers remain the existing OT06 external gate.

`questions.practice_title` remains `NOT NULL` without a default while the admin
insert omits it. The package correctly records this rather than changing an
unknown external contract. No destructive or live verification is appropriate
for closing any finding above.

## Verdict

- **Verdict:** `BLOCK`
- **Commit readiness:** not commit-ready; BLOCK-1 through BLOCK-5 are open
- **Review status:** complete; the original Phase 6 review includes the final
  OT05-EXT-01 structure, and no prior finding ID was closed
- **Pending user decision:** authorize or reject a focused OT05 fix session; do
  not accept the package, commit the phase, or start OT06 in its current state

## Exact Recommended Next Action

Authorize a Phase 6 fix session on `owner-tool-integration` that adds failing
evidence first and resolves BLOCK-1 through BLOCK-5 and FIX-1 through FIX-5.
That session should also reconcile NOTE-2 and NOTE-3; NOTE-1 may be accepted or
hardened explicitly. Keep MySQL/browser/staging execution deferred to OT10, do
not weaken the preflight or tests to pass, do not commit, and do not start OT06.
After the fix handoff, run an independent review that writes
`docs/plan/reviews/owner-tool-2026-11-phase-6-re-review.md` and explicitly closes
each accepted finding ID.
