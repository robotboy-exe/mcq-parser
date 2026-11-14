# ST01 — Constant Text Reset

- **Status:** done (implementation; light review pending at ME01 Gate 1)
- **Package base:** `e64513f` (`owner-tool-integration`, 2026-11-14)
- **Branch:** `owner-tool-integration` (no topic branch)
- **Depends on:** archived `owner-tool-2026-11` cycle close; owner reset direction
  of 2026-11-14
- **Blocks:** ME01 (phase 2)
- **External gate:** none; disposable database and local browser checks only, no
  live write
- **Review level:** light at ME01 Gate 1
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Why this package exists

The owner reset the owner-tool scope on 2026-11-14: return to the root
`ocr_helper.js` workflow, remove the shared-text/context subsystem, and add one
optional **Constant Text** passage per question. The passage must survive the
native PRG save, prefill the next new question in the same browser session, and
appear above the question on the CBT exam page and the answer-details page.

The same pass fixes the root `new-edge.txt` civic paper, whose `(a)`–`(d)`
options the root helper does not currently parse.

## Scope

### 1. Data

- Add nullable `questions.constant_text` (`TEXT`, `utf8mb4_unicode_ci`) after
  `question_text`.
- Add guarded `deployed/sql/01-constant-text.sql` and a non-destructive
  `02-constant-text-rollback.sql` that refuses to drop a non-empty column.
- Rewrite `deployed/sql/README.md` for the new migration.
- Remove the context tables/columns/seed from `tools/phone-staging/cbt_db.php`;
  add `constant_text` and one sample row.
- Update `tools/start-phone-staging.sh`: copy root `ocr_helper.js`, drop
  `admin_context.php`/`context_lib.php`.

### 2. Admin question page

- Extract `cbt_standalone_save_question` and `cbt_standalone_delete_question`
  into a focused `deployed/admin_question_store.php`; strip the context probe and
  grouped-row guards; add `constant_text`.
- Remove the context filter, grouped edit guard, `admin_shared.php` link,
  `core.js`, `owner-tool.js`, and `owner-tool.css` from this page. Keep
  `render.js` only for the read-only preview.
- Add the full-width Constant Text textarea, newline-preserving POST handling,
  `strlen > 60000` validation, save/update params, edit `SELECT`, and edit form
  value.
- Session key `cbt_admin_constant_text`: set only after a successful
  save/update, prefill new-question GETs, never override an edit row, clear on
  successful login and logout.
- Load `render.js`, `ocr_helper.js`, `src/underline-toolbar.js`, and the focused
  read-only preview assets.

### 3. Root helper

- Parse `a)`, `(a)`, `(A).`, `A)`, `(A)`, and `A.`, normalizing the letter to
  uppercase.
- Move the pure parser above the DOM guard and export it for Node tests.
- Leave queue/storage/fill behavior unchanged.
- Do not read or write `constant_text`; passage/cloze-shaped input remains on
  the ordinary-question fallback and may carry advisory flags.

Verified read-only evidence: the proposed regex parses `new-edge.txt` as 50
questions with 4 options each and 0 flags, the three label variants correctly,
and `fixtures/inputs/bank-2021.txt` as 40 questions with 0 flags.

### 4. Underline

- New `src/underline-toolbar.js`: one runtime-created button next to the Question
  label; acts on the last-focused of `constant_text`, `question_text`, and
  `option_a`–`option_d`.
- Exact lowercase `<u>`/`</u>`; refuse partial-marker overlap.
- Pure `wrapSelection` export for tests.

### 5. Read-only preview

- New `src/question-preview.js` and `.css`: preview Constant Text and Question
  beside the question textarea through `window.CBTText`.
- Preserve blank-line paragraphs with `white-space: pre-wrap`; expose no
  editable controls and perform no form-value, storage, network, or submit
  writes.

### 6. CBT exam page

- Remove `cbt_candidate.php`, `$contextsForBrowser`, `CBTContext`, context CSS,
  and context payload fields.
- Restore the standalone category/year/pool/delivery queries from
  `archive/live-sources/cbt-2026-10-31.php`; add `constant_text` to the delivery
  query and browser payload.
- Render the Constant Text block above the question in the exam view only.
- Render underlined options in the exam and result sheet; always show the
  evidence-details link.

### 7. Answer details

- Select and display `constant_text` above the question block.
- Render options through `cbt_format_text`.

### 8. Archive and docs

- Move the removed owner-tool/context modules, tests, tools, and SQL to
  `archive/owner-tool-2026-11/` with a README. Keep `src/owner-tool/render.js`,
  `src/parser/*`, the bookmarklet/build, and the core tests.
- Do not drop live context schema; the production context migration was never
  executed. The phone staging database is disposable and is recreated.
- Update the active docs, decisions, invariants, status, deployment, developer
  guide, intent, and plan map. Leave archived package/review records historical.

## Decisions

- **D-83:** reset to the legacy helper + singular Constant Text; the shared
  context subsystem is superseded and archived, not deleted.
- **D-84:** `constant_text` is optional per question; the admin form prefills it
  per browser session from `$_SESSION['cbt_admin_constant_text']`, set only on a
  successful save/update and cleared on login/logout. No global/DB last value.
- **D-85:** underline applies to Constant Text, question text, and options A–D;
  exact lowercase `<u>`/`</u>` only.
- **D-86:** Constant Text displays in the admin form, the `cbt.php` exam view,
  and `answer_details.php`; not in the result sheet or `cbt_practice.php`.
- **D-87:** the helper accepts `a)`, `(a)`, `(A).`, `A)`, `(A)`, and `A.`;
  evidence is the civic paper, the label variants, and the bank-2021 smoke test.
- **D-88:** removed shipped modules/tests/tools/SQL are archived, not deleted;
  no live schema drop; the disposable staging DB is recreated.
- **D-89:** root `ocr_helper.js` has no Constant Text or cloze-context path; a
  no-stem row is not a numbered boundary and any fallback result is review-only.
- **D-90:** restore one safe, read-only multiline preview without restoring the
  archived owner-tool controller.

D-73–D-82 describe the superseded context cycle. The D-82 +229 exception is
retired; ST01 re-measures the entry point.

## Non-goals

- No `cbt_practice.php` or `practice_title` change.
- No parser-core change; `src/parser/core.js` stays non-shipping history.
- No live deployment or live write.
- No ME01 palette/byte counter; that follows ST01.
- No rich text, LaTeX, auto-save, or bookmarklet work.
- No change to CSRF, PRG, field names, the four-option rule, or the success
  flash text.

## Externalize-first measurements (base `e64513f`)

Measured after implementation against the archived live snapshots (LF-normalized):

| File | Live snapshot | Current | Additions/deletions |
|---|---|---:|---:|
| `deployed/admin_questions.php` | 1046 lines / 62,273 B | 1053 / 62,540 | **+87/−80** |
| `deployed/cbt.php` | 1044 / 45,990 B | 1085 / 47,287 | **+49/−8** |
| `deployed/answer_details.php` | 250 / 12,103 B | 255 / 12,617 | **+8/−3** |
| `ocr_helper.js` | 123 / 5,085 B | 143 / 5,612 | **+38/−18** |

| File | Expected change | Responsibility | Deployment | Direct production-path test |
|---|---|---|---|---|
| `deployed/admin_question_store.php` | new, ~150 moved lines | standalone save/delete transaction | site root | `php tests/admin-question-store.php` |
| `deployed/admin_questions.php` | strip context/owner tool, add Constant Text/session; target ≤100 additions after extraction | admin form + dispatch | site root | store test + `php -l` + staging |
| `deployed/cbt.php` | restore standalone queries, Constant Text, underlined options; target ≤100 | CBT exam delivery/render | site root | `php tests/php-render.php` + local CBT smoke |
| `deployed/answer_details.php` | Constant Text block + option renderer | detail page | site root | `php tests/php-render.php` + local smoke |
| `ocr_helper.js` | option labels + Node export; target ≤100 | OCR fill helper | site root | `node tests/ocr-helper.js` |
| `src/underline-toolbar.js` | new | underline button | site root `src/` | `node tests/underline-toolbar.js` |
| `src/question-preview.js`, `.css` | new | read-only safe multiline preview | site root `src/` | `node tests/question-preview.js` + disposable Chromium |
| `deployed/sql/01-constant-text.sql`, `02-…` | new | schema migration | site root `sql/` | disposable DB / static probes |

Excluded artifacts: `archive/`, root `new-edge.txt`, supplied SQL, generated
bookmarklet output, and the untracked `src/bookmarklet.min.js`.

## Acceptance

1. `new-edge.txt` parses as 50 questions with 4 options each; the three label
   variants parse; bank-2021 still yields 40 questions with no missing options.
2. The admin page creates, updates, and deletes a question with Constant Text on
   a disposable DB; the PRG flash and four-option rule are unchanged.
3. Constant Text survives save/edit; new-question GET prefills it; login/logout
   clears it; a second browser session sees its own value.
4. The underline button wraps/unwraps the last-focused field with exact tags and
   refuses partial-marker overlap.
5. `cbt.php` shows the Constant Text block above the question only in the exam
   view, and renders underlined options in the exam and result.
6. `answer_details.php` shows the Constant Text above the question and renders
   underlined options.
7. All current suites pass; `php -l` passes on every changed deployed PHP file.
8. The capped live-origin files are measured and remain within 100 additions or
   have explicit owner approval.
9. Phone staging can load the admin page with the root helper and without the
   context files.

## Guardrails

- Live writes follow `docs/LIVE-SAFETY.md`; this package uses a disposable DB.
- No commit unless the owner explicitly asks.
- Preserve `new-edge.txt` and every unrelated worktree change.
- Do not hand-edit generated bookmarklet output.

## Handoff — 2026-11-14

**Status:** implementation complete; light review pending at ME01 Gate 1.
**Commit:** owner-requested WIP checkpoint, `WIP pending st01 review`.

### Files changed

- Data: `deployed/sql/base-schema.working.sql`, new
  `deployed/sql/01-constant-text.sql`, new
  `deployed/sql/02-constant-text-rollback.sql`, rewritten
  `deployed/sql/README.md`.
- Admin: `deployed/admin_questions.php`, new
  `deployed/admin_question_store.php`.
- Production helper/UI: `ocr_helper.js`, new `src/underline-toolbar.js`,
  `src/question-preview.js`, and `src/question-preview.css`.
- CBT/detail: `deployed/cbt.php`, `deployed/answer_details.php`.
- Staging: `tools/phone-staging/cbt_db.php`, `tools/start-phone-staging.sh`.
- Tests: new `tests/ocr-helper.js`, `tests/underline-toolbar.js`,
  `tests/question-preview.js`, `tests/admin-question-store.php`, and
  `tests/fixtures/` inputs.
- Docs: `AGENTS.md`, `INTENT.md`, `README.md`, `docs/AGENTS.md`,
  `docs/DECISIONS.md` (D-83–D-90), `docs/DEPLOYMENT.md`,
  `docs/DEVELOPER-GUIDE.md`, `docs/EDGE_CASES.md`, `docs/INVARIANTS.md`,
  `docs/NEW_EDGE_CASES.txt`, `docs/PENDING.md`, `docs/SPEC.md`,
  `docs/STATUS.md`, and the plan coordinator/map.
- Archived with `git mv` under `archive/owner-tool-2026-11/`: 4 deployed PHP
  files, 4 `src/owner-tool` files, 8 tests, 3 context tools, and 2 context SQL
  files, plus a new archive README.

### Excluded artifacts

`archive/`, root untracked `new-edge.txt`, supplied SQL, generated
`src/bookmarklet.js`, untracked `src/bookmarklet.min.js`, and all
`tests/fixtures/` inputs are evidence rather than capped production files.

### Measurements

All four capped live-origin files are within 100 additions. The former D-82
+229 exception for `admin_questions.php` is retired. New
`admin_question_store.php` is a focused module with an explicit site-root
deployment path; the underline and preview assets deploy under `src/`.

### Commands and results

```sh
node tests/runner.js            # 60 fixtures: 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js              # 163 PASS, 0 FAIL
node tests/ocr-helper.js        # 7 PASS (civic 50/50, labels, bank, multiline, scope)
node tests/underline-toolbar.js # 9 PASS
node tests/question-preview.js  # 4 PASS
php tests/php-render.php        # 9 PASS
php tests/admin-question-store.php # 8 PASS
node tools/extract-bank.js --check # 7 source/slice/output hashes PASS
php -l                          # PASS on every changed PHP file
```

Local disposable SQLite phone staging (`tools/start-phone-staging.sh`):

- admin login and protected GET returned 200 with the Constant Text textarea,
  root helper, underline tool, safe renderer, and read-only preview, with no
  context/owner-tool controller references;
- save created #102 with the multiline passage and exact `<u>` markers intact;
- the redirected new-question GET prefilled the passage;
- `?edit=102` loaded the row value;
- update succeeded and an empty passage stored `NULL`;
- logout/login cleared the prefill;
- delete removed #102;
- two cookie-isolated sessions kept separate prefill values.
- focused disposable Chromium at 390px showed zero preview controls/overflow,
  `pre-wrap` on both blocks, exact underlines, and a passage/cloze OCR load that
  left prefilled Constant Text byte-for-byte unchanged.

No live site or production database was touched.

### Acceptance mapping

1. Helper labels/civic/bank and no Constant Text integration:
   `node tests/ocr-helper.js`.
2. Admin create/update/delete with Constant Text: `php tests/admin-question-store.php`
   plus the SQLite staging save/update/delete run.
3. Prefill/edit/logout/isolation: SQLite staging checks above.
4. Underline wrap/unwrap/refusal: `node tests/underline-toolbar.js`.
5. Read-only preview/multiline/OCR isolation: `node tests/question-preview.js`
   plus disposable Chromium.
6. CBT Constant Text and underlined options: `php tests/php-render.php` plus
   static source checks; no browser runtime test.
7. Answer details Constant Text/options: same renderer vectors plus static
   source checks.
8. Suites and lint: commands above.
9. Live-origin cap: measurements above, maximum +87.
10. Staging loads the admin page without context files: SQLite staging GET.

### Open questions / deferred checks

- The MySQL migration has been run only against the disposable SQLite staging
  schema, not MySQL 8.0.41. Run it against a disposable MySQL database before a
  live deploy.
- No automated browser runtime suite exists; focused disposable Chromium passed,
  while the required owner Brave/Android check remains pending for ME01/ME02.
- `cbt_practice.php` intentionally does not render Constant Text.
- `practice_title` remains untouched.
- The `bank-2021` final-item duplicate-C flag from OCR key text is accepted as
  pre-existing.

**NEXT COMMAND:** `@docs/plan/prompts/phase-session.md phase 2`
