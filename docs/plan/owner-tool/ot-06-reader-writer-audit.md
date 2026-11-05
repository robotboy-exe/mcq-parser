# OT06 Reader/Writer Audit

- **Date:** 2026-11-05
- **Audited ref:** `8f1d7e5`
- **Result:** PASS for all production source available in this repository
- **Effect:** the OT06 external gate is satisfied; product work has not started

## Scope

The audit covered every direct `questions` SQL reference in current deployment
working copies under `deployed/`, then compared those paths with the immutable
production snapshots under `archive/live-sources/`. It also traced helper call
sites, context publication checks, the OT05 migration constraints, and the
downstream result-detail link from `cbt.php`.

`cbt_practice.php` was included in the search inventory but excluded from OT06
behavior changes by `INTENT.md`. Tests, schemas, and documentation were used as
corroborating evidence, not counted as production readers or runtime row writers.

Searches accounted for direct `FROM`, `JOIN`, `INSERT INTO`, `UPDATE`, and
`DELETE FROM` references to `questions`, plus the question-mutation helper call
sites. No available PHP source contains `TRUNCATE`, `REPLACE INTO`, or `MERGE`
against `questions`.

## Current Source Inventory

The current `deployed/*.php` source has 30 direct `questions` SQL sites: 27
reads and three row mutations.

| File | Direct sites | Role |
|---|---:|---|
| `deployed/cbt.php` | 7 reads | Main candidate pool availability, validation, and payload selection |
| `deployed/cbt_practice.php` | 3 reads | Practice candidate path; searched but outside remaining cycle scope |
| `deployed/answer_details.php` | 3 reads | Result-linked question detail and adjacent navigation |
| `deployed/admin_questions.php` | 6 reads | Admin pre-read, list, edit, and media lookups |
| `deployed/context_lib.php` | 6 reads | Context members, counts, position, and cloze-slot checks |
| `deployed/admin_question_mutations.php` | 2 locked reads, 3 writes | The only current direct question row writer |

`deployed/context_activation_validation.php`,
`deployed/context_input_validation.php`, and
`deployed/admin_context_actions.php` read linked rows through
`cbt_context_members()` and related `context_lib.php` helpers. Context actions
write `question_contexts`; they do not directly mutate `questions` rows.

## Main CBT Read Path

The seven `cbt.php` question reads are unchanged from the archived production
snapshot. The 20 additions and two deletions between
`archive/live-sources/cbt-2026-10-31.php` and `deployed/cbt.php` are OT04 safe
text-rendering and multiline changes below the SQL path.

| Lines | Read | Existing behavior |
|---|---|---|
| `deployed/cbt.php:34-44` | AJAX categories | Active questions for the subject; active category; category ID at most 10 |
| `deployed/cbt.php:51-60` | AJAX years with category | Active questions for the exact subject/category; active category; ID at most 10 |
| `deployed/cbt.php:62-68` | AJAX years without category | Active-question years for the subject |
| `deployed/cbt.php:95-104` | POST category validation map | Same category eligibility as the AJAX category read |
| `deployed/cbt.php:106-113` | POST year validation map | Active-question years for the subject |
| `deployed/cbt.php:145-159` | Exact pool probe | At least one active question for subject/category/year |
| `deployed/cbt.php:168-183` | Exam payload | Individual active rows, `ORDER BY RAND()`, subject limit 100/60/50 |

`cbt.php` does not mutate `questions`. Its only write is the attempt insert into
`cbt_exam_attempts` at lines 188-204.

The payload mapping at lines 218-231 preserves selected row order, limits image
paths to the uploader namespace, and sends question text, four options, and the
correct answer to the existing browser exam. Navigation and results retain
array order. The PHP metadata uses the actual row count at line 703, while the
initial top bar prints the nominal subject limit at line 709 and JavaScript
replaces it with the actual total at line 819.

## Current Question Writers

`deployed/admin_questions.php:360-599` is the only available current question
write entry point. It dispatches all three actions through the OT05 mutation
module included at line 10.

| Action | SQL | Linked-row behavior |
|---|---|---|
| `save_question` | `deployed/admin_question_mutations.php:137-148` | Inserts standalone or linked fields; a linked row is forced inactive and its context is deactivated |
| `update_question` | `deployed/admin_question_mutations.php:92-152` | Locks the row and affected contexts; supports link, edit, move, or unlink; deactivates actual old and target contexts |
| `delete_question` | `deployed/admin_question_mutations.php:163-205` | Locks the row and actual context; hard-deletes the row and deactivates its context in one transaction |

The helper locks context IDs in numeric order, retries a stale former-context
hint, and commits the row mutation with context deactivation. A failure rolls
both changes back. `deployed/admin_context_data.php:89-95` forces every linked
member to `is_active = 0`.

Context activation performs the authoritative locked validation in
`deployed/context_activation_validation.php:10-137`: exact member count,
contiguous positions, pool equality, complete options and answer, inactive
members, and exact cloze-slot coverage. The migration adds unique context
position/slot indexes and a restrictive context foreign key at
`deployed/sql/01-context-migration.sql:208-245`.

No available current production source performs a bulk question mutation,
status-only update, import, cron/CLI row write, or direct linked-member
activation.

## Archived Writer Risk

The two immutable admin snapshots contain the former context-unaware direct
INSERT, UPDATE, and DELETE implementation:

- `archive/live-sources/admin_questions.php:374-539`
- `archive/live-sources/admin_questions-2026-10-31.php:384-549`

Those files are evidence, not current includes. If either implementation were
reachable after the context migration, it could update or delete a linked row
without deactivating its context, and an update could set the member active.
Release deployment must therefore install the current admin entry point and
`admin_question_mutations.php` together and must not expose an archived or
alternate legacy writer.

## OT06 Consequences

1. Every availability path above must recognize active, validated context units;
   changing only the final payload query would leave category/year validation
   context-blind.
2. Standalone eligibility must explicitly require `context_id IS NULL` and keep
   `is_active = 1`. Linked eligibility must require an active context while its
   member rows remain inactive.
3. Group members must be fetched completely in `context_position` order. A
   second `WHERE id IN (...)` query cannot be relied on for final order.
4. The lightweight eligibility read and full-row fetch introduce a race with
   admin deactivation. OT06 must use a consistent read or revalidate context
   activation, exact membership, and positions before emitting a group.
5. Main-CBT category activity, the category-ID-at-most-10 boundary, subject
   limits, image filtering, and existing standalone random behavior must remain.
6. The actual selected total must be used everywhere, including the initial
   top-bar markup, because complete-unit fitting may return fewer rows.
7. `cbt.php:986-993` always emits `answer_details.php?id=N`, but
   `answer_details.php:25-39` accepts only individually active rows. A linked
   member would therefore produce a dead link. Under the current `cbt.php`-only
   scope, OT06 must suppress that link for linked members while preserving it
   for standalone rows; widening detail-page scope requires a separate owner
   decision.

## Completeness Boundary

This is a complete audit of the production source available in the repository.
The connection wrapper `cbt_db.php`, shared `header.php`/`footer.php`, a live
webroot manifest, and any out-of-repository worker, importer, cron/CLI process,
or database routine are not available. Root `db_conn.php` settles the PDO
connection contract but does not prove the absence of external writers.
Rendered snapshots also reference unavailable `search_processor.php` and
`practice.php`; neither is an available main-CBT or question-mutation source.

These gaps do not block OT06 Gate 1 because the requested available-source read
and mutation paths are accounted for. They remain release preconditions: OT10's
deployment manifest and write-freeze preflight must verify that the current
writer set is complete. Discovery of any additional question writer is a stop
condition until it follows the same linked-context deactivation protocol.

## Verification

- Read-only source search and trace; no database, browser, or live action.
- No product source changed.
- Tests not run because this audit changes documentation only.
