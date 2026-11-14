# OT12 — Shared-Text Page Isolation

- **Status:** not started; Gate 1 pending; phase 1 of `math-editor-2026-11`
  (lead-in remediation before ME01)
- **Package base:** `a3b93b7` (`owner-tool-integration`, 2026-11-14, after the
  `owner-tool-2026-11` cycle close and archive)
- **Branch:** `ot12-shared-text-isolation`, short-lived topic branch off
  `owner-tool-integration`; merge or delete in the package that closes it
- **Depends on:** archived `owner-tool-2026-11` cycle close (satisfied at
  `a3b93b7`)
- **Blocks:** ME01 (phase 2)
- **External gate:** none; local/disposable-database evidence only, no live write
- **Review level:** light at ME01 Gate 1
- **Release:** post-cycle remediation of the shipped shared-text integration
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Branch route (required, owner-directed)

This package explicitly requires isolation under the phase-session Gate 1 rule:
implement OT12 **only** on `ot12-shared-text-isolation`, never on
`owner-tool-integration`. The branch exists on `origin`; on the implementation
machine:

```text
git fetch origin
git switch ot12-shared-text-isolation
```

If the branch is missing, recreate it from the package base and push it:

```text
git switch --create ot12-shared-text-isolation a3b93b7
git push -u origin ot12-shared-text-isolation
```

Before the OT12 handoff and the ME01 Gate 1 light review, merge the topic branch
back into `owner-tool-integration` (fast-forward if possible), push that branch,
and delete the topic branch locally and remotely. Do not base ME01 or later
packages on it.

## Why this is phase 1

The `math-editor-2026-11` packages were planned before the first live deployment
showed that deploying the shared-text code before its migration fails every
question save. The owner decided on 2026-11-14 that the isolation must happen
first, so OT12 leads the active cycle and ME01/ME02 follow it.

Evidence for the failure: `deployed/admin_questions.php:7` includes
`admin_context.php`; every save is routed through `cbt_admin_mutate_question`
(`deployed/admin_context.php:625`), whose `INSERT`/`UPDATE` always name
`context_id`, `context_position`, and `context_slot` (`:686-701`). If the code is
deployed before `deployed/sql/01-context-migration.sql`, MySQL raises
`1054 Unknown column 'context_id'`, the save handler sets the migration message
(`deployed/admin_questions.php:582`), and the owner tool masks it with
`The question did not save. Fix it and try again.`
(`src/owner-tool/owner-tool.js:2157`).

The immediate live break is fixed by importing the migration. This package is
the code-level isolation that prevents a recurrence.

## Ownership boundary

- `questions.context_id IS NULL` belongs to `admin_questions.php` (standalone
  question management).
- `questions.context_id IS NOT NULL` belongs to the new `admin_shared.php`
  (shared-text management and its member questions).
- Each page refuses to edit or delete the other page's rows, in the UI and
  server-side.
- The old page must not require any file that the new feature changes. The new
  page may read `subjects`/`exam_category` and the `questions` table.

Full blast-radius isolation is not a goal and is not promised: the database,
connection, auth/session, `questions` constraints (including the known
`practice_title` mismatch), shared reference data, and the CBT read path remain
shared. This package only stops the observed class of failure: shared-text code
or schema making plain question saves fail.

## Scope

### 1. Restore the legacy question page

- Surgically remove the context integration from `deployed/admin_questions.php`:
  the `admin_context.php` include, context action dispatch, context-aware delete,
  context-aware save, `context_id` in the edit `SELECT`, context form defaults,
  context fieldset render, and context payload wiring.
- Keep every non-context improvement made after `8f1d7e5^` (paging, payload
  scripts, owner-tool asset includes, upload handling, PRG/flash behavior).
- The resulting save path uses the legacy `INSERT`/`UPDATE` with an explicit
  column list that contains no context columns.
- Filter or reject context-linked rows so the old page cannot edit/delete them.

### 2. Add `admin_shared.php`

- New entry point that reuses the existing admin auth/session/CSRF config and
  `cbt_db.php` connection.
- Shared-text CRUD and 10-row pagination.
- Member question management for one group: list by `context_position`, add with
  the next free position, edit content/options/answer/slot, delete, and
  revalidate/activate/deactivate.
- Reuse the context-aware, atomic mutation and delete helpers moved out of
  `admin_context.php` (`cbt_admin_mutate_question`, `cbt_admin_delete_question`,
  `cbt_admin_question_params`, `cbt_admin_prepare_question_context`, and their
  validation helpers) so context activation rules stay in one place.
- Member question forms need the same fields and upload handling as the legacy
  form. Gate 1 must choose: duplicate the form/upload helpers in the new page
  (keeps the old page untouched) or extract a shared `question_form` include
  (one source, but a new shared failure domain). Default: duplicate, because the
  package's purpose is isolation.

### 3. Move the context UI out of the owner tool

- The shared-text/member editor currently lives in
  `src/owner-tool/owner-tool.js` and assumes the paste panel and question form.
- Add a dedicated shared-texts script loaded only by `admin_shared.php`.
- Keep parse/fill/underline behavior on `admin_questions.php`.
- Remove the context workflow from the old page's script path, or leave it
  dormant only if Gate 1 proves the removal is riskier; dormant code must never
  execute on the old page.

### 4. Navigation and deployment

- Add a link between the two admin pages.
- Document the deploy order: old-page revert may ship before the migration; the
  new page stays disabled with a plain message until its schema is present.
- No CBT file changes. No new or changed SQL; `01-context-migration.sql` stays
  byte-identical (SHA-256 `e963b7…b55f7`).

## Decisions

- Keep the existing additive schema and the three nullable context columns. Do
  not introduce a membership table and do not change CBT read queries.
- Reuse the existing context-aware mutation helpers for member questions rather
  than writing a second context transaction path.
- The legacy page is the authority for standalone questions; the new page is the
  authority for grouped questions. No row has two editors.
- Revert by surgical diff, not by checking out an old file, to preserve later
  non-context changes.

## Non-goals

- No change to `deployed/sql/01-context-migration.sql`,
  `02-context-rollback.sql`, or the context schema.
- No CBT candidate/delivery changes.
- No parser, cloze, fixture, or owner-tool paste behavior change.
- No change to CSRF, PRG, field names, four-option rule, or success flash text.
- No live deployment, live write, or test-row cleanup.
- No claim of total failure-domain isolation.
- No ME01 palette/byte-counter work; that follows this package.

## Gate 1 questions

1. Which non-context changes in `admin_questions.php` post-date `8f1d7e5^` and
   must be preserved in the surgical revert?
2. Duplicate vs extract the question form/upload helpers for the new page.
3. How much of `owner-tool.js` must be extracted for a shared-texts-only script,
   and which existing owner-tool tests cover it?
4. Does the old page filter context rows from its list, reject them on submit, or
   both? Both is preferred.
5. Does `admin_context.php` become a library with no entry point, or fold into
   `admin_shared.php` and `context_lib.php`?
6. Exact externalize-first measurements for each changed production file.

## Acceptance

1. On a disposable database **without** the context migration, the legacy page
   can create, update, and delete a plain MCQ with no unknown-column error, and
   the success flash is exact.
2. On a disposable database with the migration, the legacy page behaves the same
   and never reads or writes context columns.
3. The legacy page cannot edit or delete a `context_id NOT NULL` row, in UI and
   server-side.
4. `admin_shared.php` can create/update a shared text, add/edit/delete its member
   questions with correct positions/slots, and activate only a valid complete
   group; it refuses standalone and other groups' rows.
5. Member edits/deletes deactivate the context as today's context-aware path
   requires.
6. No CBT file changed; CBT complete-group delivery remains covered by its
   existing suite.
7. All suites pass: runner, unit, owner-tool (old + new), context-migration,
   cbt-context, context-lib, context-admin, context-preflight, PHP render,
   cbt-candidate, PHP/JS syntax.
8. Deploy order and rollback notes are recorded in the package handoff and
   `docs/DEPLOYMENT.md`.

## Guardrails

- PHP, database, `ocr_helper.js`, and server contract are fixed; CSRF/PRG, field
  names, the four-option rule, and flash text do not change.
- Never hand-edit generated bookmarklet output; no parser change is expected.
- Live writes follow `docs/LIVE-SAFETY.md`; this package uses a disposable DB
  only. Test rows are owner-only.
- Externalize-first: `admin_questions.php` is a live-origin file; the revert is
  deletions and must not exceed the +100 cumulative addition cap. The new page is
  a new module with no fixed cap, but it must be cohesive and have one
  responsibility and an explicit deployment path.
- No commit in this session unless the owner explicitly asks.

## Provisional externalize-first plan

| File | Baseline lines / bytes | Expected change | Responsibility | Production path test |
|---|---:|---|---|---|
| `deployed/admin_questions.php` | 1065 / 62892 | remove context integration (deletions; keep later non-context changes) | standalone question management | new legacy-save regression test on a no-migration DB |
| `deployed/admin_shared.php` | new | shared-text CRUD + member question CRUD | grouped questions | new PHP page/handler tests |
| `deployed/admin_context.php` | 996 / 46688 | split: context library + page handlers; retire the old entry-point wiring | context helpers | context-admin/context-lib tests re-pointed |
| `deployed/context_lib.php` | 505 / 20353 | unchanged unless the split requires moving only page-level code | validation/queries | existing suites |
| `src/owner-tool/owner-tool.js` | 2566 / 106477 | remove/move context workflow | parse/fill/underline on old page | owner-tool suite |
| `src/owner-tool/shared-texts.js` | new | shared-text/member UI | new page client | new DOM/PRG-shim tests |
| `src/owner-tool/shared-texts.css` or existing CSS | existing/new | scoped styles | new page | render check |
| `docs/DEPLOYMENT.md`, plan docs | docs | deploy order, manifest | handoff | docs review |

Excluded artifacts: `archive/` snapshots, supplied SQL, and the existing
`01-context-migration.sql` (unchanged) are not production edits in this package.

## Handoff

Not started. Populate after Gate 1 and implementation with per-file
additions/deletions from the package base, final lines/bytes, SHA-256,
responsibility, deployment inclusion, and direct production-path test evidence.
