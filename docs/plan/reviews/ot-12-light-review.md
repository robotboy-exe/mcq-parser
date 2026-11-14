# OT12 light review — shared-text page isolation

Recorded: 2026-11-14. Scope: one light review of the OT12 implementation at
`73009ac` plus the deploy-doc rows written after it. This review writes only
`docs/plan/reviews/`.

## What was asked

1. Stop the shared-context code from breaking plain question saves.
2. Move shared-text management to its own admin page, with its own media uploads.
3. Give that page a combined recent-questions table (owner: 20 per page, same as
   the standalone list) so grouped rows are not reachable only through their own
   text.
4. Split the client: `shared-texts.js` extracted, paste panel ported to the
   shared page.
5. Deploy-doc rows for the split.

## Evidence

| Claim | Evidence |
|---|---|
| The standalone page cannot write a context column | Its two write statements are the original 13-column `UPDATE`/`INSERT`; no context column appears in either. `tests/standalone-admin.php` drives both against SQLite with and without the context schema. |
| The standalone page cannot reach a grouped row | List and count filter on `q.context_id IS NULL`; edit, save and delete refuse grouped rows with the shared-page pointer. Probe-guarded, so an unmigrated database behaves like the pre-context page. |
| One owner per row | `admin_shared.php` refuses nothing outside `context_id IS NOT NULL` by construction (every query is context-scoped), and `admin_questions.php` refuses the complement. |
| The shared page stores complete rows | Member save copies `subject_id`, `exam_category_id`, `exam_year` from the shared text and writes through `cbt_admin_mutate_question` (positions/slots included). |
| Media is duplicated, not shared | Four helpers plus three path guards copied with `admin_shared_` prefixes; new uploads land in the same `uploads/` directories; replaced/removed files unlink only after commit; `remove_member` deletes the row's files. |
| Client split is inert on the standalone page | `owner-tool.js` reads `window.CBTOwnerContext*` and guards every use; `#owner_context_panel` no longer exists there. |
| Paste panel is live on the shared page | Page loads `core.js`, `render.js`, `shared-texts.js`, `shared-paste.js` in that order; `shared-paste.js` fills through `CBTOwnerContextForm.create().fill()` and refuses in `update_context` mode. |
| Suites green | runner 60/0/0, unit 163, owner-tool 81, context-migration 14, cbt-context 5, standalone-admin 9, context-lib 14, context-admin 23, context-preflight 6, php-render 9, cbt-candidate 7, `php -l` 9 deployed files, `node --check` four owner-tool sources. |

Measurements: `admin_questions.php` 1196 / 68,152 B, **+229/−79** vs
`archive/live-sources/admin_questions-2026-10-31.php` (D-82 approval, 129 over
cap); `admin_shared.php` 874 / 49,259 B; `owner-tool.js` 1579 / 69,336 B;
`shared-texts.js` 1002 / 37,427 B; `shared-paste.js` 230 / 7,523 B.

## Findings

- **F1 — no browser evidence for the shared page.** The paste panel, member
  media uploads, and the combined table are covered by static probes plus one
  Node VM smoke run of the paste client (two passages filled, queue advanced,
  saved-mode guard refused). No real browser has rendered the page, so layout,
  the file inputs, and the upload round trip are unverified. Non-blocking for
  merge; blocking for a live deploy.
- **F2 — the paste queue has no reset control.** `cbtSharedPaste:v1` keeps drafts
  across reloads, which is what makes "Fill Next Draft" work, but the panel has
  no "start over" button; a new paste simply overwrites the queue. Accepted for
  this package; worth a control if the owner wants one.
- **F3 — the media helper duplication is intentional and unshared.** Per the
  owner's decision, the four upload helpers now exist twice (standalone and
  shared). A future upload-rule change must be made in both places. Recorded
  here so the duplication is not mistaken for drift.
- **F4 — the standalone page still reads one context column.** The probe and the
  grouped-row guard read `context_id`; that read is the price of one owner per
  row without a second table. Not a write path, and invisible on an unmigrated
  database.
- **F5 — suite counts in the docs are unchanged, but one assertion moved.** The
  context-flash detector check now reads `shared-texts.js`; counts stayed at 81
  because it replaced an existing assertion rather than adding one.

## Verdict

**PASS WITH NOTES.** The requested split is implemented, the standalone save path
no longer names a context column, the shared page owns grouped rows and can fill
drafts from a paste, and the deploy manifest carries the new files and order.
F1 remains the only gate before any live deploy; F2–F5 are accepted or
informational.

## Not done here

- No merge into `owner-tool-integration` (owner's next step).
- No deploy, no live write, no live test-row cleanup.
- No Brave/Android or desktop check of the shared page.
