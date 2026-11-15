# ST01 — Constant Text Reset

- **Status:** done (third re-review PASS; D-91 `FIX-1` closed, `FIX-2` remains
  closed, and 11 helper checks pass)
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

- Parse A-D labels case-insensitively in the bare-letter-plus-period,
  bare-letter-plus-closing-paren, parenthesized-letter, and
  parenthesized-letter-plus-period forms. Per D-91, whitespace is optional after
  `(`, before `)`, and before `.`, and every unspaced form remains valid.
- Once a letter's option boundary is selected, a later label-like occurrence of
  that letter remains option text and does not replace or resplit the selected
  option or alone raise the duplicate-letter warning.
- Move the pure parser above the DOM guard and export it for Node tests.
- Leave queue/storage/fill behavior unchanged.
- Do not read or write `constant_text`; passage/cloze-shaped input remains on
  the ordinary-question fallback and may carry advisory flags.

Original D-87 read-only evidence: the proposed regex parses `new-edge.txt` as 50
questions with 4 options each and 0 flags, the three label variants correctly,
and `fixtures/inputs/bank-2021.txt` as 40 questions with 0 flags. This is partial
evidence under D-91 and does not establish its selected-boundary requirement.

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
- **D-91:** owner replacement for phase-1 `FIX-1`. A-D labels are
  case-insensitive; whitespace is optional after `(`, before `)`, and before
  `.`, with all unspaced forms preserved. A later label-like occurrence of an
  already selected letter stays in that option's text. This supersedes D-87's
  exact spacing boundary, not its civic-label goal or D-89's scope limits.

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
| `ocr_helper.js` | 123 / 5,085 B | 160 / 6,284 | **+57/−20** |

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

1. `new-edge.txt` parses as 50 questions with 4 options each; bank-2021 still
   yields 40 questions with no missing options; every D-91 spaced and unspaced
   label form parses case-insensitively. The reviewed `A) ... A ) ... B)` vector
   keeps the internal `A )` in Option A and raises no duplicate-letter warning
   solely for that repeat.
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

**Status:** original implementation complete; second re-review completed
2026-11-15; `FIX-2` closed, `FIX-1` remains open under the owner-amended D-91
requirement recorded below.
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

## Fix Note — 2026-11-14 (`FIX-1`, `FIX-2`)

**Authority:** `docs/plan/reviews/math-editor-2026-11-phase-1.md` (original
review, 2026-11-14) recommended `fix-session.md phase 1 FIX-1 FIX-2`. Both
findings were in their first review round; no owner disposition was needed or
inferred, and the review record was not edited.

**Package base:** unchanged `e64513f`; reviewed checkpoint `6e301bb`. Line
counters were not reset.

### Frozen closure matrix

**`FIX-1` — option-label regex dropped the shipped `A .` tolerance**

| Criterion | Implementation | Evidence |
|---|---|---|
| (a) accept optional whitespace between an A–D letter and its `.` terminator, upper and lower case | `ocr_helper.js:8` `([A-Da-d])[.)])` → `([A-Da-d])\s*[.)])`; one line, no new lines | `node tests/ocr-helper.js` vector "accepts whitespace between an option letter and its period": `A . One B . Two C . Three D . Four` and `a . One` / `b\n. Two` parse to One/Two/Three/Four with no `option X missing` flag |
| (b) six added forms, left boundary and uppercase normalization unchanged | `(?<![A-Za-z])`, the `(a)` alternative, `[.)]*\s*` and `toUpperCase()` untouched | Existing vectors "accepts all six lowercase and uppercase label forms" and "normalizes parsed letters to uppercase" still pass; probe `(A). One (b) Two (C) Three d) Four` parses correctly |
| (c) `splitQuestions`, `FIXES`, `cleanBlock`/`cleanLine`, queue/storage/fill untouched | `git diff 6e301bb -- ocr_helper.js` shows exactly one changed line | `node tests/runner.js` 60/60 and `node tests/unit.js` 163/0 pass unchanged |

Non-goals were respected: no E/F labels, no E/F→D change, no `A -`/`(A -`
handling, no Constant Text integration, no numbering-guard change.

**`FIX-2` — current-facing docs misstated the root helper's storage behavior**

Branch (a) "docs describe actual behavior" was chosen, because ST01 requires
queue/storage/fill to stay at live parity and this fix changes no behavior.

| Criterion | Implementation | Evidence |
|---|---|---|
| (a) `docs/SPEC.md` §3.4 and `docs/DEVELOPER-GUIDE.md` §3 describe the real keys | Both now state that the helper uses `ocrQueue`/`ocrMeta` and still writes `ocrSubmitted` on submit, then deletes it on the next load while the queue advances; `ansKey`, `cbtOwnerTool:v1` and Auto-Save keys remain untouched | doc diff in §"Commands and results" |
| (b) `AGENTS.md`/`docs/AGENTS.md` separate the bookmarklet rule from the restored helper | `AGENTS.md` storage rule and `docs/AGENTS.md` items 4 and the "not allowed" bullet scope the `ocrSubmitted` prohibition to the archived bookmarklet and name the root helper as the one exception | doc diff |
| (c) any `docs/INVARIANTS.md` statement about helper storage | No invariant covers root-helper storage: `INV-36`/`INV-40` are bookmarklet claims evidenced by `src/ui/ui.js` and remain true, so none was rewritten. `INV-135` was synced to the `FIX-1` accepted forms and its check count | `docs/INVARIANTS.md:80,84,204` |

### Production files changed by this fix

| File | Change | Live snapshot | Final | Additions / deletions | Cap |
|---|---|---|---:|---:|---|
| `ocr_helper.js` | one regex line | 123 / 5085 | 143 / 5615 | **+38 / −18** | ≤100 ✓ |

Responsibility (OCR fill helper), deployment path (site root) and direct
test (`node tests/ocr-helper.js`) are unchanged; the deployment manifest row in
`docs/DEPLOYMENT.md` was refreshed to `143 / 5615` and SHA-256
`9d44b56139f485bf3c2b8242d1d614aa9712663837107a560020f9d9b254da60`. No new
module was added, so no new deployment row is required.

`tests/ocr-helper.js` grew from 93 to 113 lines (one new vector); test files are
not capped. No other production file or counter changed.

### Documentation files changed

`docs/SPEC.md` (§3.4), `docs/DEVELOPER-GUIDE.md` (§3), `AGENTS.md` (storage rule
and known-gaps line), `docs/AGENTS.md` (storage rule and prohibited-actions
bullet), `docs/INVARIANTS.md` (`INV-135` forms and check count),
`docs/DEPLOYMENT.md` (helper row), and the coordinator/status files listed below.

### Commands and results

```sh
node tests/ocr-helper.js   # PASS: 8 ocr-helper vectors
node tests/runner.js       # 60 fixtures: 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js         # 163 PASS, 0 FAIL
git diff --numstat --no-index archive/live-sources/ocr_helper-2026-11-01.js ocr_helper.js
                           # 38	18
```

Adversarial re-probes: `A . One B . Two C . Three D . Four` and the lowercase
spaced/newline form now parse all four options with no flags; `(A).` mixed
forms still parse; a stem containing `A.` prose is preserved and carries the
advisory duplicate-letter flag.

### Coordinator and status updates

`docs/plan/README.md` (current state, package table, remaining path, workflow
stop), `docs/STATUS.md` (packages line) and `AGENTS.md` (known gaps) now record
the review result and the pending re-review. `docs/plan/prompts/phase-map.md`
carries no status, so it is unchanged.

### Excluded artifacts

Unchanged from the handoff: `archive/`, root `new-edge.txt`, supplied SQL,
generated `src/bookmarklet.js`, and `tests/fixtures/` inputs. `src/bookmarklet.min.js`
does not exist in this clone.

### Deferred (not part of these findings)

`NOTE-2` from the review still stands: no browser runtime render of the CBT and
answer-detail Constant Text, and no MySQL execution of the migration SQL. Those
remain ME01/ME02 evidence.

**Commit:** deferred. No commit was made.

Historical next action completed: the first and second phase-1 re-reviews are
recorded under `docs/plan/reviews/`.

## Owner Disposition - 2026-11-15 (`FIX-1`)

**Authority:** the immutable second re-review
`docs/plan/reviews/math-editor-2026-11-phase-1-re-review-2.md` demonstrated that
the committed fix at `84be892` did not satisfy the original frozen preservation
criterion and escalated `FIX-1` after the fix/re-review cycle. `FIX-2` is closed.

**Choice:** `change requirement`.

The owner's earlier one-word `fix` reply was not recorded: before any file was
changed, the owner clarified that the dot-only closure contract was not the
intended product rule and explicitly confirmed `change requirement`.

**Owner rationale:** the parser must correctly parse OCR option labels both
with and without whitespace before `.` and `)`, including whitespace after an
opening `(`, case-insensitively. Supporting spaced OCR punctuation is required,
but an internal label-like repeat must not replace a boundary already selected
for that option.

**Replacement requirement:** for A-D, case-insensitively, retain the structural
forms bare letter plus `.`, bare letter plus `)`, parenthesized letter, and
parenthesized letter plus `.`. Whitespace is optional after `(`, before `)`, and
before `.`; the compositional rule includes `A.`, `A .`, `A)`, `A )`, `(A)`,
`(A )`, `( A)`, `( A )`, their dotted combinations, and lowercase equivalents.
All unspaced forms remain valid. In
`Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four`,
Question must be `Which is correct?`, Option A must be
`The notation A ) stays in option A`, B-D must be `Two`, `Three`, `Four`, and
the internal `A )` must not alone raise
`a letter appears twice (merged questions?)`.

**Authoritative documents changed:** `INTENT.md`, this package acceptance and
handoff, D-87/D-91 in `docs/DECISIONS.md`, `docs/SPEC.md`, `docs/INVARIANTS.md`,
`docs/EDGE_CASES.md`, `docs/AGENTS.md`, `docs/DEVELOPER-GUIDE.md`,
`docs/DEPLOYMENT.md`, `docs/NEW_EDGE_CASES.txt`, root `AGENTS.md`, root
`README.md`, the coordinator, current status, active phase map, and the
unstarted ME01/ME02 decision numbering.
Immutable review records and archived history are unchanged.

**Current evidence and residual risk:** the positive spaced-period and existing
six-form checks pass, but `84be892` uses the last regex match for each letter.
The second re-review reproduced the exact sample above in Node and the production
browser path: the later `A )` replaces the real A boundary, moves text between
Question and Option A, and adds a false duplicate warning. Therefore the current
implementation and eight helper checks do not satisfy D-91.

**Readiness and destination at that point:** this owner decision changed no
product or test file and established no readiness by itself. It was not deferred
to another package. ST01 therefore remained in progress and ME01 stayed blocked.
The destination was one phase-1 `FIX-1` fix session against D-91, followed by
independent closure-focused re-review.

### Continuation checklist

- [x] Preserve all immutable original review and re-review records.
- [x] Record the owner `change requirement` disposition and D-91 in every
  current-facing authority.
- [x] Run `@docs/plan/prompts/fix-session.md phase 1 FIX-1`; add failing evidence
  for the complete spacing grammar and the selected-boundary sample before code.
- [x] Re-run the frozen package baseline and cumulative live-origin cap evidence.
- [x] Run an independent closure-focused phase-1 re-review of `FIX-1`.
- [x] Keep ME01 blocked until that re-review settles ST01.

**Commit:** deferred. No commit was made by this documentation-only disposition.

Historical next action completed: the authorized replacement fix is handed off
below.

## Replacement `FIX-1` Handoff - 2026-11-15

**Authority:** the recorded owner `change requirement` disposition above and
D-91. The original review and both prior re-reviews remain immutable. `FIX-2`
remains closed.

**Status at handoff:** implementation and executable evidence were complete;
independent closure-focused re-review was still required, so ST01 remained in
progress and ME01 remained blocked.

### Frozen Closure Matrix

| Criterion | Implementation | Evidence |
|---|---|---|
| A-D labels are case-insensitive in bare dotted, bare closing-parenthesis, parenthesized, and parenthesized-plus-dot forms; whitespace is optional after `(`, before `)`, and before `.`; every unspaced form remains valid | `ocr_helper.js` `OPTION` composes the three optional whitespace positions while retaining the letter left boundary and uppercase normalization | `tests/ocr-helper.js` runs 17 structural spacing formats in uppercase and lowercase, using all A-D labels; the existing civic, six-form, spaced-period, normalization, and bank checks also pass |
| Once a letter's boundary is selected, a later label-like repeat stays in option text and does not replace or resplit that boundary | `parseQuestion` records every match for diagnostics but assigns `pos[letter]` only on that letter's first accepted match | The exact `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` vector produces the required Question and A-D values; one combined vector keeps later A, B, C, and D markers in their respective options |
| An internal selected-letter repeat alone raises no duplicate warning, while a boundary-less second complete A-D set still warns and a visible numbered boundary suppresses that warning | `parseQuestion` scans after the latest selected A-D boundary for a later ordered A-D subsequence and checks the intervening text for a visible `N.` boundary | The exact and combined-repeat vectors have no flags; clean and interleaved second sets warn; numbered and out-of-order single-set controls do not warn |
| Existing splitter, normalization, queue, storage, fill, Constant Text isolation, and unrelated parser behavior remain unchanged | Only `OPTION` and option-boundary/duplicate-set logic inside `parseQuestion` changed; the browser/storage section is byte-unchanged | `git diff 84be892 -- ocr_helper.js`; 60/60 fixture runner, 163 unit checks, paragraph/no-stem/Constant-Text helper controls, and every unchanged package suite pass |

The evidence was added first. Before the production edit,
`node tests/ocr-helper.js` failed at `( L)` because the stem retained `(`. The
separate exact-vector probe returned Question `Which is correct? A) The notation`,
Option A `stays in option A`, and the false duplicate warning. Both now pass.

### Files Changed by This Fix

- Production: `ocr_helper.js`.
- Executable evidence: `tests/ocr-helper.js` (113 lines / 4,573 B to 187 / 7,634;
  three added checks, 11 total).
- Current-facing docs: `AGENTS.md`, `README.md`, `docs/AGENTS.md`,
  `docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md`, `docs/EDGE_CASES.md`,
  `docs/INVARIANTS.md`, `docs/NEW_EDGE_CASES.txt`, `docs/SPEC.md`,
  `docs/STATUS.md`, the coordinator, active map, and this package handoff.

No fixture expected file was generated or weakened. `INTENT.md` and
`docs/DECISIONS.md` already contain the authoritative D-91 requirement and were
not changed by this fix. The dependent ME01/ME02 packages were not started.

### Production Measurements From Package Base `e64513f`

| File | Package diff | Final lines / bytes | Responsibility | Deployment and direct production-path evidence |
|---|---:|---:|---|---|
| `deployed/admin_questions.php` | +25 / -168 | 1053 / 62540 | native admin form, validation, session, narrow store dispatch | site root; real store suite, prior disposable page run, PHP lint |
| `deployed/admin_question_store.php` | +113 / -0 | 113 / 4918 | standalone save/delete transaction | site root; `php tests/admin-question-store.php` requires the real module |
| `deployed/cbt.php` | +113 / -36 | 1085 / 47287 | standalone CBT selection, delivery, exam/result rendering | site root; real shared-renderer suite, source path, PHP lint; browser runtime remains deferred |
| `deployed/answer_details.php` | +6 / -2 | 255 / 12617 | detail read and formatted Constant Text/options | site root; real shared-renderer suite, source path, PHP lint; browser runtime remains deferred |
| `ocr_helper.js` | +57 / -20 | 160 / 6284 | production OCR split/parse/queue/fill helper | site root; `node tests/ocr-helper.js` requires the real module; 11 PASS |
| `src/underline-toolbar.js` | +128 / -0 | 128 / 3898 | exact-marker Underline control | site root `src/`; `node tests/underline-toolbar.js`, 9 PASS |
| `src/question-preview.js` | +104 / -0 | 104 / 3759 | read-only Constant Text/Question preview | site root `src/`; `node tests/question-preview.js`, 4 PASS |
| `src/question-preview.css` | +37 / -0 | 37 / 711 | preview layout and `pre-wrap` | site root `src/`; loaded by the admin page; prior browser computed-style evidence |
| `deployed/sql/01-constant-text.sql` | +49 / -0 | 49 / 1719 | guarded forward migration | ops directory; static inspection only; target MySQL execution deferred |
| `deployed/sql/02-constant-text-rollback.sql` | +38 / -0 | 38 / 1169 | non-empty-data rollback refusal | ops directory; static inspection only; target MySQL execution deferred |
| `deployed/sql/README.md` | +41 / -132 | 81 / 3105 | migration/deployment runbook | ops directory; manifest and static checks |

Unchanged manifest dependencies remain `deployed/render.php` (78 / 2447) and
`src/owner-tool/render.js` (209 / 6339); their real paths are exercised by the
PHP renderer and preview suites. `deployed/sql/base-schema.working.sql` is
repository-only disposable support at +2/-1 and 90 / 4224; it is not deployed.

### Live-Origin Caps

| File | Live snapshot lines / bytes | Final lines / bytes | Additions / deletions | Cap |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1046 / 62273 | 1053 / 62540 | **+87 / -80** | pass |
| `deployed/cbt.php` | 1044 / 45990 | 1085 / 47287 | **+49 / -8** | pass |
| `deployed/answer_details.php` | 250 / 12103 | 255 / 12617 | **+8 / -3** | pass |
| `ocr_helper.js` | 123 / 5085 | 160 / 6284 | **+57 / -20** | pass |

No line-limit exception exists or is required. The helper SHA-256 is
`c3e8e96eb2a295eb3ef0a8c0e87089b233cd026afe7fec664c7db16b17732193`,
matching `docs/DEPLOYMENT.md`.

### Commands and Results

```sh
node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  # 163 PASS, 0 FAIL
node tests/ocr-helper.js            # 11 PASS
node tests/underline-toolbar.js     # 9 PASS
node tests/question-preview.js      # 4 PASS
node tools/extract-bank.js --check  # source, anchors, counts, 7 hashes PASS
php tests/php-render.php            # 9 PASS
php tests/admin-question-store.php  # 8 PASS
node --check ocr_helper.js          # PASS
php -l                              # PASS on five deployed PHP files and staging cbt_db.php
```

The available CLI was PHP 8.5.12; no PHP byte changed in this fix. The original
ST01 review separately ran the declared PHP 8.3 target. No browser, live site,
production database, or destructive operation was used in this fix session.

### Behavior and Non-Goals

Behavior changed only in the root helper's A-D label grammar, selected boundary,
and duplicate-set warning. E/F behavior, `A -`, `splitQuestions`, `FIXES`,
multiline cleanup, queue/storage/fill, Constant Text isolation, parser core,
bookmarklet, PHP/server contract, and database behavior are unchanged.

Excluded artifacts remain `archive/`, root `new-edge.txt`, `tests/fixtures/`,
supplied SQL under `archive/sql/`, generated `src/bookmarklet.js`, local staging
state, and `deployed/sql/base-schema.working.sql`. `src/bookmarklet.min.js` is
absent and was not created.

**Commit:** deferred. No commit was made.

Historical next action completed: the third re-review passed and closed
`FIX-1`.

## Review Settlement and Phase Boundary - 2026-11-15

**Review:**
[`math-editor-2026-11-phase-1-re-review-3.md`](../reviews/math-editor-2026-11-phase-1-re-review-3.md)
returned `PASS`. It closed D-91 `FIX-1`, confirmed `FIX-2` remains closed,
introduced no new finding, and satisfied the ST01 review dependency.

**Status:** ST01 is done and review-settled. ME01 may proceed to its read-only
Gate 1. The target-MySQL migration run and final CBT/answer-details/Brave runtime
evidence remain release checks; they do not reopen phase 1.

**Deployment handoff:** the external `~/projects/send/` folder was rebuilt as a
clean phase-1 bundle with the ten public production files, two private SQL
scripts, a private SQL runbook, checksums, and plain-language deployment and
rollback instructions. Retired context/shared-text files were removed from that
bundle. The guide starts from the owner's stated live condition: baseline root
`ocr_helper.js` and its single script tag on `admin_questions.php`. The bundle's
`SHA256SUMS` file hash is
`8d32969e0f754b0de27232f7c0bb9c0a828ee28f5917a1538acf8d363906b2dd`.

**Final verification:** the fixture runner passed 60/60 with no pending cases;
unit 163, helper 11, underline 9, preview 4, PHP renderer 9, and admin store 8
all passed. The bank extractor, `node --check ocr_helper.js`, `git diff --check`,
and PHP lint on all five deployed PHP files passed. `sha256sum -c SHA256SUMS`
passed for every bundle file, and each production/SQL payload hash matches its
authoritative repository source. No live site, browser, or database was opened;
the target-MySQL prerequisite remains explicit in the deployment guide.

**Commit:** the owner explicitly requested the phase-boundary commit and push in
the same request that authorized this deployment handoff refresh.

NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 2
