# OT12 — Shared-Text Page Isolation

- **Status:** in progress; Gate 1 passed 2026-11-14; PHP isolation implemented,
  owner-tool script not yet split; phase 1 of `math-editor-2026-11`
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

### 2026-11-14 — implementation, partial

**Result:** the live break is fixed. The standalone page no longer includes the
context library or names a context column on an unmigrated database, and
`admin_shared.php` owns shared texts, activation, and member questions.

**Files (base `a3b93b7`, measured at `6ceaaff` + worktree):**

| File | Change | Final | Responsibility | Deployed | Production-path test |
|---|---|---:|---|---|---|
| `deployed/admin_questions.php` | removals + inlined context-free save/delete, probe, guard, visibility filter | 1196 lines / 68,152 B; **+229/−79, approved by D-82** | standalone questions | yes | `php tests/standalone-admin.php` |
| `deployed/admin_shared.php` | new | 874 lines / 49,259 B | shared texts, member questions with their own media uploads, combined recent-questions table (20 per page) | yes | context-admin/library suites |
| `src/owner-tool/shared-texts.js` | new | 1002 lines / 37,427 B | four context APIs moved out of the standalone page's payload; loaded by the shared page | yes | `node tests/owner-tool.js` |
| `src/owner-tool/shared-paste.js` | new | 230 lines / 7,523 B | paste-to-draft client for the shared page | yes | VM smoke run + static probes |
| `src/owner-tool/owner-tool.js` | context APIs removed | 1579 lines / 69,336 B | paste/parse/fill/underline/preview on the standalone page | yes | `node tests/owner-tool.js` |
| `deployed/admin_context.php` | unchanged 996 / 46,688 | — | context library | yes | context suites |
| `tests/standalone-admin.php` | new, 9 PASS | — | — | no | self |
| `tests/owner-tool.js`, `tests/context-migration.js` | retargeted OT11/OT05 assertions to the split | — | — | no | suites |

Owner decision (2026-11-14): grouped rows stay out of the standalone list, and
`admin_shared.php` gains its own combined "Recent shared questions" table —
every `context_id IS NOT NULL` row, newest first, 20 per page (matching the
standalone list), with Edit (opens
that shared text) and Remove. That makes the shared page's coverage explicit
rather than leaving grouped rows reachable only through their own text.

Member media: the four upload helpers (`admin_shared_save_answer_upload`,
`admin_shared_save_image_upload`, `admin_shared_delete_answer_file`,
`admin_shared_delete_image_file`) plus the path guards are duplicated from the
standalone page with `admin_shared_` prefixes, per the owner's decision to
duplicate rather than share an include. Both member forms are
`multipart/form-data` with answer-illustration and question-picture inputs,
their removal checkboxes, and previews; replaced or removed files are unlinked
only after the transaction commits, and `remove_member` deletes the media the
deleted row owned.

Client split: the four context APIs (`CBTOwnerContexts`, `CBTOwnerContextForm`,
`CBTOwnerContextCard`, `CBTOwnerContextPanel`) moved to
`src/owner-tool/shared-texts.js`; `owner-tool.js` keeps paste/parse/fill/underline
and reads the context APIs from `window` guarded by presence checks.
`admin_shared.php` now loads `src/parser/core.js`, `src/owner-tool/render.js`,
`src/owner-tool/shared-texts.js`, and `src/owner-tool/shared-paste.js` in that
order. It does not load `owner-tool.js`, which returns early without a
`save_question`/`update_question` form.

Paste panel port: `src/owner-tool/shared-paste.js` renders from the
`#owner_shared_paste` markup above the shared-text editor (draft mode only). Use
Paste parses with `OCRParser.parsePaste`, maps each parsed context to a draft
with the same field mapping the question page used, queues the drafts under the
new `cbtSharedPaste:v1` key, and fills the native editor through
`CBTOwnerContextForm.create().fill()`; Fill Next Draft advances the queue. A
saved text is never overwritten: when the editor is in `update_context` mode the
client refuses and says so. `node tests/owner-tool.js` still loads
`shared-texts.js` before `owner-tool.js`; the new client has a VM smoke run but
no committed test.

Externalize-first: `admin_questions.php` is at **+229/−79** against the live
snapshot, which is 129 additions over the cap. The owner approved that exact
file, excess and justification on 2026-11-14 (D-82), so the exception is
recorded rather than silent. No other capped file changed.

**Suites:** runner 60, unit 163, owner-tool 81, context-migration 14,
cbt-context 5, context-lib 14, context-admin 23, context-preflight 6, php-render
9, cbt-candidate 7, legacy-admin 9 — all PASS; `php -l` on 9 deployed files.

**Behavior:** on a database without the context columns the legacy page saves,
updates, and deletes normally; the probe caches per connection with a WeakMap.
On a migrated database it hides `context_id IS NOT NULL` rows from the list and
refuses to edit or delete them with a message pointing to the Shared Texts page.

**Not done yet (blocking `done`):**

1. The owner-tool context UI still lives in `src/owner-tool/owner-tool.js`. It is
   dormant on the legacy page (no `#owner_context_panel`, no context JSON
   payload), so it cannot execute there, but the Gate 1 plan was to move it to
   `src/owner-tool/shared-texts.js`. The shared page is pure PHP forms and does
   not load the owner tool, so the split has no runtime consumer yet; decide
   whether to extract it or record the dormancy.
2. Member questions have no media upload on the shared page (text, options,
   answer, position, slot only). Uploads remain on the standalone page before a
   question is linked.
3. `docs/DEPLOYMENT.md`/`docs/DEVELOPER-GUIDE.md` rows, decisions/invariants, and
   the rigorous/light review are outstanding.

**Live actions:** none. Disposable SQLite only; no deploy, no live write.
**Review:** light review at ME01 Gate 1 pending.
**Commit:** deferred.
