# Phase 1 Review — ST01 Constant Text Reset

- **Date:** 2026-11-14
- **Reviewer:** independent review session (read-only), Freebuff cloud worktree
- **Scope:** phase 1 / `ST01` — `docs/plan/owner-tool/st-01-constant-text-reset.md`
- **Reviewed commit:** `6e301bb` `WIP pending st01 review` (parent/package base `e64513f`)
- **Cycle:** `math-editor-2026-11` ([`../prompts/phase-map.md`](../prompts/phase-map.md))
- **Mode:** original review (no prior ST01 review record exists); exploratory across
  the full package acceptance and production boundary
- **Worktree:** clean (`git status --porcelain` empty); no branch was created,
  switched, merged, or moved; nothing was committed and no product file was edited
- **Record path:** written as `math-editor-2026-11-phase-1.md`; see `NOTE-3` for why
  this departs from the stale `owner-tool-2026-11-phase-N.md` naming rule

## 1. Inputs read

`INTENT.md`, `docs/plan/README.md`, `docs/plan/prompts/phase-map.md`,
`docs/plan/prompts/review-session.md`, `docs/plan/reviews/README.md`, the ST01
package including its handoff, `AGENTS.md`, `docs/AGENTS.md`, `docs/SPEC.md`,
`docs/INVARIANTS.md`, `docs/PENDING.md`, `docs/DEPLOYMENT.md`,
`docs/STATUS.md`, plus every changed production file, test, SQL artifact and
staging tool.

## 2. Commands and observed evidence

The cloud VM has no system PHP and no root; the declared PHP 8.3 target was
supplied by the static PHP 8.3.32 CLI build from `dl.static-php.dev`
(`php -v` → `PHP 8.3.32 (cli)`), with `pdo_sqlite`, `pdo_mysql`, `mbstring`,
`fileinfo`. No `mysqld` is available, so the MySQL engine could not be exercised
(see `NOTE-2`).

### Node suites

```text
node tests/runner.js            # fixtures 60, PASS 60, FAIL 0, PENDING 0
node tests/unit.js              # PASS 163, FAIL 0
node tests/ocr-helper.js        # PASS 7 ocr-helper vectors
node tests/underline-toolbar.js # PASS 9 underline-toolbar vectors
node tests/question-preview.js  # PASS 4 question-preview vectors
node tools/extract-bank.js --check # OK: source, anchors, counts, 7 output hashes
```

### PHP suites and lint (`php` = static PHP 8.3.32 CLI)

```text
php tests/php-render.php            # PASS: 9 PHP renderer vectors
php tests/admin-question-store.php  # PASS: 8 admin-question-store checks
php -l deployed/admin_questions.php       # No syntax errors
php -l deployed/admin_question_store.php  # No syntax errors
php -l deployed/cbt.php                   # No syntax errors
php -l deployed/answer_details.php        # No syntax errors
php -l deployed/render.php                # No syntax errors
php -l tools/phone-staging/cbt_db.php     # No syntax errors
```

These reproduce the handoff's reported counts exactly.

### Git base and diff

```text
git log --format='%h %p %s' -2
6e301bb e64513f WIP pending st01 review
e64513f a3b93b7 3a0fe4d Merge branch 'ot12-shared-text-isolation'
git diff --numstat e64513f HEAD   # 61 files; source deltas listed in §4
git status --porcelain            # empty
```

The package base `e64513f` claimed in the package is confirmed as the commit's
parent. The commit contains only ST01's reset, its tests/tools/docs, and the
`git mv` archives; no unrelated user work is bundled.

### Direct production-path execution (disposable SQLite phone staging)

`tools/start-phone-staging.sh` was run unmodified with
`PATH=$HOME/phpbin:$PATH OCR_PHONE_STAGING_TMP=$HOME/tmp
OCR_PHONE_STAGING_PORT=8099 bash tools/start-phone-staging.sh`. It copies the real
`deployed/admin_questions.php`, `deployed/admin_question_store.php`,
`deployed/render.php`, root `ocr_helper.js` and the staging `cbt_db.php`, links the
real `src/` tree, and serves it with `php -S`. Every request below therefore hits
the production admin page and the production store module, not a copy.

| Probe | Result |
|---|---|
| Login (`action=login`) | 302 → admin page |
| Admin GET | `constant_text` textarea present; `context_refs=0` (no `owner-tool.js`, `admin_shared`, `admin_context`, context filter); loads `owner-tool/render.js`, `underline-toolbar.js`, `question-preview.js`, preview CSS |
| Save with multiline passage + `<u>`/`<b>` text | 302 PRG; flash `Question saved successfully (Question ID: 102).` (unchanged contract text) |
| Session prefill on the redirected new-question GET | exact passage, blank-line paragraph and `<u>`/`</u>` preserved byte-for-byte |
| `?edit=102` | row value loaded in the textarea, not the session value |
| Update with empty passage | 302; flash `Question #102 updated successfully.`; DB `constant_text IS NULL` (len null) |
| Whitespace-only passage (`"   "`) | 302 saved; DB `constant_text IS NULL` |
| Second cookie-isolated session after save | prefills its own (empty) value, not session A's passage |
| Delete `#102` | 302; flash `Question #102 was deleted successfully.`; row removed |
| Logout | 302; session key cleared |

Boundary probes on the same production page:

| Probe | Result |
|---|---|
| `constant_text` = 60,001 bytes | 200 error page, `The Constant Text is too long`; no row inserted |
| `constant_text` = 60,000 bytes | 302 saved; stored length 60,000 |
| One empty option (four-option rule) | 200, `Please fill in all four answer options`; no row inserted |

All probe rows were deleted through the page's own delete form; the staging DB was
left with its single seeded row. The staging server was stopped by its recorded PID
(`kill 4712`, then a 000 response), not by pattern.

## 3. Acceptance coverage

| # | Acceptance row | Evidence | Status |
|---|---|---|---|
| 1 | `new-edge.txt` = 50 questions × 4 options, six label forms, bank-2021 = 40 | `node tests/ocr-helper.js` (7 vectors) | PASS, with `FIX-1` on a shipped form the six-form list omits |
| 2 | Admin create/update/delete with Constant Text on a disposable DB; PRG flash and four-option rule unchanged | `php tests/admin-question-store.php` + the staging run in §2 | PASS |
| 3 | Passage survives save/edit; new-question GET prefills; login/logout clears; second session isolated | staging run in §2 | PASS |
| 4 | Underline wraps/unwraps the last-focused field, refuses partial overlap | `node tests/underline-toolbar.js` (9 vectors); `src/underline-toolbar.js` inspected | PASS (pure function and wiring; DOM button not exercised in a browser) |
| 5 | `cbt.php` shows Constant Text above the question in the exam view only; underlined options in exam and result | `deployed/cbt.php:221,319,803-807,842-884,985-1010` inspected; `php tests/php-render.php` exercises the shared renderer | PASS by inspection + renderer test; no browser runtime render (see `NOTE-2`) |
| 6 | `answer_details.php` shows Constant Text above the question and renders underlined options | `deployed/answer_details.php:26,185-196` inspected; `php tests/php-render.php` | PASS by inspection + renderer test; no browser runtime render (see `NOTE-2`) |
| 7 | All current suites pass; `php -l` on every changed deployed PHP | §2 commands | PASS |
| 8 | Capped live-origin files measured and within 100 additions | §4 measurements, reproduced independently | PASS |
| 9 | Phone staging loads the admin page with the root helper and without the context files | staging GET in §2 (`context_refs=0`, helper/preview/underline present) | PASS |

## 4. Independently reproduced measurements

Baseline snapshots and their SHA-256 (verified):

```text
archive/live-sources/admin_questions-2026-10-31.php  b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028
archive/live-sources/cbt-2026-10-31.php              9ca5f7b462fe4ec0931ab590645a83bbfa0c069891c14e223ebbbb2fce0f1435
archive/live-sources/answer_details-2026-11-02.php   680cfd697ba61b3c21e07c0f9e2cb4d6780ea2100ceae8e78fd4e492aa7368bf
archive/live-sources/ocr_helper-2026-11-01.js        f51a643685b6ccbb8ccd674ba182d299992fc6fb25a0cd0e4fc6339eff4e0e49
```

`git diff --numstat --no-index <live snapshot> <production file>`:

| File | Live snapshot (lines / bytes) | Final (lines / bytes) | Additions / deletions | Cap |
|---|---|---|---|---|
| `deployed/admin_questions.php` | 1046 / 62273 | 1053 / 62540 | **+87 / −80** | ≤100 ✓ |
| `deployed/cbt.php` | 1044 / 45990 | 1085 / 47287 | **+49 / −8** | ≤100 ✓ |
| `deployed/answer_details.php` | 250 / 12103 | 255 / 12617 | **+8 / −3** | ≤100 ✓ |
| `ocr_helper.js` | 123 / 5085 | 143 / 5612 | **+38 / −18** | ≤100 ✓ |

These match the package table and `docs/STATUS.md` exactly. The older
`archive/live-sources/admin_questions.php` (972 / 55694) would give +182 / −101, but
it is not the OT01-designated baseline (`owner-tool-2026-11-phase-10a.md`,
`-phase-10a-re-review.md:167-168`, `-phase-11.md:92` all name the 2026-10-31 copy),
so the package measured against the correct origin.

New production modules (no fixed cap; cohesive; explicit deployment path):

| File | Lines / bytes | Responsibility | Deployment path | Direct production-path test |
|---|---|---|---|---|
| `deployed/admin_question_store.php` | 113 / 4918 | standalone save/delete transaction with explicit columns | site root | `php tests/admin-question-store.php` (real module, in-memory DB) + staging run |
| `src/underline-toolbar.js` | 128 / 3898 | one runtime Underline button and pure `wrapSelection` | site root `src/` | `node tests/underline-toolbar.js` |
| `src/question-preview.js` | 104 / 3759 | read-only Constant Text/Question preview via `window.CBTText` | site root `src/` | `node tests/question-preview.js` |
| `src/question-preview.css` | 37 / 711 | preview layout, `white-space: pre-wrap` | site root `src/` | inspected; loaded by the admin page |
| `deployed/sql/01-constant-text.sql` | 49 / 1719 | guarded, rerunnable forward migration | ops directory | static inspection only (`NOTE-2`) |
| `deployed/sql/02-constant-text-rollback.sql` | 38 / 1169 | non-destructive rollback refusing non-empty data | ops directory | static inspection only (`NOTE-2`) |

Every SHA-256 in the `docs/DEPLOYMENT.md` manifest (11 files) was recomputed and
matches the working tree byte-for-byte, including `src/owner-tool/render.js`.
`docs/DEPLOYMENT.md` also lists the four `src/` assets, the site-root PHP files and
the ops SQL, so deployment inclusion is documented and complete.

Module responsibility check: `admin_questions.php` keeps only session/CSRF,
validation, upload handling, dispatch, the PRG redirects and markup; the database
transaction moved to `admin_question_store.php`. `cbt.php` and `answer_details.php`
render through the pre-existing shared `deployed/render.php`. No monolithic new
module and no generic dumping-ground helper was added; the change does not game the
cap (the diff deletes more than it adds in `admin_questions.php`).

Grep confirmations: the admin page has no remaining `admin_shared`, `admin_context`,
`core.js`, `owner-tool.js` or `owner-tool.css` reference; `ocr_helper.js` never
mentions `constant_text`; the context tables/columns are absent from
`tools/phone-staging/cbt_db.php`, and `tools/start-phone-staging.sh` copies the root
helper and drops `admin_context.php`/`context_lib.php`.

### Fixture provenance

- `tests/fixtures/ocr-helper-civic-2026.txt` is byte-identical to the tracked root
  `new-edge.txt` (`sha256 0c7b881b…aee2`), i.e. owner-supplied OCR evidence, not
  parser output.
- `tests/fixtures/ocr-helper-option-labels.txt` is a hand-written six-form vector.
- No `fixtures/expected/*.json` was regenerated; the 60 fixtures still carry their
  own `input_origin` and no orphan remains.

### Approvals and excluded artifacts

No cap exception exists or is needed (maximum +87); the former D-82 +229 exception
is retired in the package and in `docs/STATUS.md`. Excluded artifacts identified
separately: `archive/` (R100 `git mv` moves plus its README), root `new-edge.txt`,
the supplied SQL exports under `archive/sql/`, generated `src/bookmarklet.js`, and
`tests/fixtures/` inputs. `src/bookmarklet.min.js` does not exist in this clone.

## 5. Adversarial probes (new, beyond the package's own assertions)

1. **Spaced option terminator** — `1. Which is it? A . One B . Two C . Three D . Four`:
   current helper yields 0 options and four `option X missing` flags; the shipped
   live regex matches all four labels. → `FIX-1`.
2. **Lowercase references in a stem** — `12. Refer to items (a) and (b) below` followed
   by real `(a)`–`(d)` options: the stem is preserved, options parse correctly, and the
   row carries the advisory `a letter appears twice` flag. → `NOTE-4`.
3. **Mixed label styles and `(A).`** — `(A). One (b) Two (C) Three d) Four` parses
   `a`–`d` correctly with the letters normalized to uppercase.
4. **CRLF + blank-line paragraph** — `Line one\r\nwrapped\r\n\r\nPara` with `(a)`–`(d)`:
   stem becomes `Line one wrapped\n\nPara`, options single-line, no flags. Preserved
   multiline rendering confirmed.
5. **Cloze-shaped paste** — passage text plus a numbered cloze row parses through the
   ordinary fallback only; no `constant_text` interaction (D-89).
6. **Constant Text boundaries on the live page** — whitespace-only ⇒ `NULL`,
   60,000 bytes saved, 60,001 bytes refused, four-option rule intact (§2).
7. **Session isolation** — two cookie jars; B never sees A's prefilled passage.

## 6. Findings

### FIX-1 — Option-label regex drops the shipped whitespace tolerance before the period

- **Defect.** `ocr_helper.js:8` now requires the terminator immediately after the
  label letter:
  `/(?<![A-Za-z])(?:\(([A-Da-d])\)|([A-Da-d])[.)])[.)]*\s*/g`. The shipping helper
  (`archive/live-sources/ocr_helper-2026-11-01.js:12`,
  `/(?<![A-Z])([A-D])\s*\.\s*/g`) accepted `A .` — uppercase label, optional
  whitespace (including a line break), then the period. `INTENT.md` parser intent says
  the added forms must keep "the existing uppercase forms working". Reproduced: probe
  #1 above parses zero options; the live regex matches `A . `, `B . `, `C . `, `D . `.
  No current fixture contains the spaced form, so the corpus does not currently expose
  it; the regression is in accepted-input surface, not in observed data.
- **Supported operating preconditions.** An OCR paste whose A–D labels carry a space or
  newline before the period. No other condition; nothing else is required.
- **Finite closure criteria.** (a) `OPTION` accepts optional whitespace between the
  label letter and its `.` terminator for uppercase and lowercase A–D (`A .`, `a .`,
  `A\n.`), while keeping all six added forms, the left boundary, and uppercase
  normalization; (b) `A)`/`(A)`/`(A).`/`A.` and the `a)`/`(a)` forms still parse
  identically; (c) `splitQuestions`, `FIXES`, `cleanBlock`/`cleanLine`, queue, storage
  and fill behavior are untouched.
- **Required evidence.** New `tests/ocr-helper.js` vectors for the spaced form and its
  uppercase/lowercase siblings (asserting options parse and no `option X missing`
  flag); re-run of `node tests/ocr-helper.js`, `node tests/runner.js` (60/60),
  `node tests/unit.js` (163), and the `ocr_helper.js` numstat against
  `archive/live-sources/ocr_helper-2026-11-01.js` showing the file still within
  100 cumulative additions.
- **Non-goals / deferred.** No E/F label support, no change to the E/F→D collapse, no
  `A -`/`(A -` handling, no Constant Text integration, no change to the +5 numbering
  guard.

### FIX-2 — Current-facing docs misstate the root helper's storage behavior

- **Defect.** `docs/SPEC.md:137-141` (rewritten by ST01) says the production root
  helper "does not read or write `ansKey`, `ocrSubmitted`, `cbtOwnerTool:v1`", and
  `docs/DEVELOPER-GUIDE.md:60` repeats it for `ocrSubmitted`. The shipped
  `ocr_helper.js:134` writes `ocrSubmitted` on submit and `:138-139` reads and deletes
  it at boot to advance the queue — identical to the live helper ST01 restored.
  `AGENTS.md:45` likewise still states "Do not read/write `ocrSubmitted`", so the
  coordinator contract and the shipped production file disagree. The package requires
  "current-facing docs match implemented behavior"; three current-facing documents do
  not.
- **Supported operating preconditions.** None; this is a statement about shipped code.
  Any admin submit with a loaded queue writes the key, and any page load reads it.
- **Finite closure criteria.** (a) `docs/SPEC.md` §3.4 and `docs/DEVELOPER-GUIDE.md`
  describe the actual production keys (`ocrQueue`, `ocrMeta`, and the legacy
  `ocrSubmitted` submit-write / boot-delete), or the helper is changed to match the
  docs — exactly one of the two, consistently across all three documents; (b)
  `AGENTS.md`/`docs/AGENTS.md` distinguish the archived bookmarklet's D-22/D-27 rule
  from the restored root helper so the instruction is executable; (c) any
  `docs/INVARIANTS.md` statement that covers helper storage is corrected to the same
  description.
- **Required evidence.** The edited doc lines plus a `grep -n ocrSubmitted ocr_helper.js`
  transcript showing the documented behavior matches the file; docs-only edits need no
  test run, and any code choice instead must keep the suites green.
- **Non-goals / deferred.** No key renaming or reshaping, no queue-format change, no
  bookmarklet rebuild, no removal of the legacy boot advance unless that is the chosen
  branch of (a) and is covered by evidence.

### NOTE-1 — Handoff excluded-artifact list is stale

The handoff lists "root untracked `new-edge.txt`" and "untracked
`src/bookmarklet.min.js`" as excluded artifacts. `new-edge.txt` is tracked in
`6e301bb` (301 lines, and copied to `tests/fixtures/ocr-helper-civic-2026.txt`), and
`src/bookmarklet.min.js` does not exist in this clone. Neither affects any cap or test;
the handoff should say "tracked evidence outside the cap" and drop the absent file.

### NOTE-2 — Runtime evidence gaps to close before a live release

(a) Nothing exercises `cbt.php` or `answer_details.php` in a browser: rows 5 and 6 of
the acceptance table are satisfied by source inspection plus the shared-renderer
vectors (`php tests/php-render.php`, 9 vectors) and by the admin-side preview test.
The exam/result/answer-detail DOM rendering of Constant Text and underlined options is
therefore unverified at runtime. (b) `deployed/sql/01-constant-text.sql` and
`02-constant-text-rollback.sql` have no execution evidence on MySQL 8.0.41 — only
static inspection. The handoff sentence "has been run only against the disposable
SQLite staging schema, not MySQL 8.0.41" reads as though it ran somewhere; a MySQL
`DELIMITER`/procedure script cannot run on SQLite, so the accurate statement is "not
executed on any engine yet". The package records both as deferred checks, and ME01/ME02
own them (owner Brave/Android check, disposable MySQL run at deployment time), so this
is recorded risk rather than a defect. The owner must not treat ST01 as release
evidence for either path until those runs exist.

### NOTE-3 — Review-record naming rule still points at the archived cycle

`docs/plan/reviews/README.md:6,9` and `docs/plan/prompts/review-session.md:81` still
require `owner-tool-2026-11-phase-N.md`, which is the archived cycle's namespace (its
phase 1 is OT00). Writing this ST01 record there would mislabel it as archived-cycle
phase 1 and risk a collision, so this record uses the active cycle's name,
`math-editor-2026-11-phase-1.md`. Update the naming rule with the next coordinator edit.

### NOTE-4 — Lowercase label support makes parenthesised prose references option markers

D-87 requires `(a)`/`a)`, so a stem that references "items (a) and (b)" has those
references consumed as option markers (probe #2). The stem text itself is preserved and
the row carries the advisory `a letter appears twice` flag, so the admin sees the
warning before saving; likewise a line beginning `a.k.a.` could be read as option A.
This follows directly from the required label forms and is advisory-only; no change is
requested, but it belongs in the risk record for ME01.

## 7. Non-findings / observations

- `deployed/cbt.php:721` pre-renders `count($dbQuestions)` where the live file printed
  the hardcoded 50/60/100. `:812,831` immediately overwrite `totalNo` with
  `Math.min(questions.length, MAX_QUESTIONS)`, so the runtime display is identical;
  this is a cosmetic pre-render change with no behavioral effect.
- The success flash strings, CSRF handling, PRG shape, field names and the four-option
  rule are unchanged and were exercised on the staging page (§2).
- `questions.practice_title` and `cbt_practice.php` are untouched, as required.
  `cbt_practice.php` still loads `src/owner-tool/render.js`, consistent with the owner
  decision to keep that path.
- No generated file was hand-edited; `src/bookmarklet.js` is absent from the diff.

## 8. Verdict

**PASS WITH ACCEPTED FINDINGS.**

- No acceptance row is unmet in a way that blocks the package, no guardrail is
  breached, no cap is exceeded (+87 maximum), no monolithic addition was made, and no
  test claim rests on copied control flow: the store test requires the real
  `deployed/admin_question_store.php`, the renderer test requires the real
  `deployed/render.php`, and the admin flows were reproduced against the real
  `deployed/admin_questions.php` on disposable staging.
- `FIX-1` and `FIX-2` are first-round findings. They route to a fix session against
  their frozen closure contracts and do not escalate to owner disposition yet.
- **Commit readiness:** not commit-ready. `FIX-1`/`FIX-2` remain open, the commit is
  deferred (`AGENTS.md`: commit only at a phase boundary and only with explicit owner
  authorization), and ME01 must not start before the ST01 review settles.
- **Review status:** original review complete; no re-review of these findings exists yet.
- **Recommended next action:** a fix session for `FIX-1` and `FIX-2`, then a
  closure-focused re-review of the same two IDs.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 1 FIX-1 FIX-2
