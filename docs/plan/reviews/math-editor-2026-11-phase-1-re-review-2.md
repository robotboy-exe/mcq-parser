# Phase 1 Re-review 2 - ST01 Constant Text Reset (`FIX-1`, `FIX-2`)

- **Date:** 2026-11-15
- **Reviewer:** independent review session (OpenCode)
- **Scope:** second closure-focused re-review of `FIX-1` and `FIX-2` from
  [`math-editor-2026-11-phase-1.md`](math-editor-2026-11-phase-1.md), after the
  first re-review in
  [`math-editor-2026-11-phase-1-re-review.md`](math-editor-2026-11-phase-1-re-review.md)
- **Package:** phase 1 / `ST01`,
  `docs/plan/owner-tool/st-01-constant-text-reset.md`
- **Reviewed state:** `owner-tool-integration` at `84be892` (`fix: restore
  spaced option labels and correct helper storage docs`); implementation
  checkpoint `6e301bb`; unchanged package base `e64513f`
- **Mode:** closure-focused. The frozen contracts below are unchanged; this
  review did not search unrelated parser dimensions. Existing `NOTE-5` is not a
  closure target.
- **Worktree:** clean at session start and at the end of evidence collection.
  This review writes only this record; it did not edit product, test, package,
  status, or coordinator files and did not commit or move a branch.

## 1. Frozen contracts

The original review supplied complete closure contracts. The first re-review
claimed both closed, but this requested second re-review independently tested
the contracts against the committed state rather than trusting that claim.

| ID | Frozen closure criteria |
|---|---|
| `FIX-1` | (a) `OPTION` accepts optional whitespace between an A-D label letter and its `.` terminator, upper and lower case, while preserving all six added forms, the left boundary, and uppercase normalization; (b) `A)` / `(A)` / `(A).` / `A.` and lowercase forms still parse identically; (c) `splitQuestions`, `FIXES`, `cleanBlock` / `cleanLine`, queue, storage, and fill behavior are untouched. Required evidence is the spaced-form vectors, helper/runner/unit suites, and the live-origin helper numstat. Non-goals remain E/F, `A -`, Constant Text integration, and numbering-guard changes. |
| `FIX-2` | (a) `docs/SPEC.md` and `docs/DEVELOPER-GUIDE.md` describe `ocrQueue`, `ocrMeta`, and the legacy `ocrSubmitted` submit-write / next-load-delete behavior, or code is changed consistently; (b) `AGENTS.md` and `docs/AGENTS.md` separate the archived bookmarklet rule from the root helper; (c) relevant invariants agree. No key rename, queue-shape change, bookmarklet rebuild, or unrelated storage change. |

The owner did not broaden either contract or replace either requirement.

## 2. Commands and observed evidence

### Repository and package base

```text
git rev-parse --abbrev-ref HEAD                    owner-tool-integration
git rev-parse HEAD                                 84be89271cb295dae279c20efe3bd83167f80878
git merge-base e64513f HEAD                        e64513f2f36ebe8b2073cea0d893f891066b16b6
git show -s --format='%H %P %s' 6e301bb            parent e64513f
git show -s --format='%H %P %s' HEAD               parent 6e301bb
git status --porcelain=v1                          empty
git diff --check e64513f HEAD                      pass
```

This independently confirms the package base and the two-commit ST01 sequence.
Between `6e301bb` and `84be892`, `ocr_helper.js` is the only production file
changed (`+1/-1`); `tests/ocr-helper.js` adds 20 test lines and the remaining
changes are review/fix documentation. No unrelated production or user-owned
change was found.

### Baseline and package checks

```text
node tests/runner.js                  60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                    163 PASS, 0 FAIL
node tests/ocr-helper.js              8 PASS
node tests/underline-toolbar.js       9 PASS
node tests/question-preview.js        4 PASS
node tools/extract-bank.js --check    source, anchors, counts, 7 hashes OK
php tests/php-render.php              9 PASS
php tests/admin-question-store.php    8 PASS
php -l deployed/admin_questions.php
php -l deployed/admin_question_store.php
php -l deployed/cbt.php
php -l deployed/answer_details.php
php -l deployed/render.php
php -l tools/phone-staging/cbt_db.php all report no syntax errors
```

The available CLI is PHP 8.5.12, not the declared PHP 8.3 target. The original
review separately ran PHP 8.3.32, but this session does not present that earlier
run as newly executed evidence. The installed database binary is MariaDB 13.0.2,
not MySQL 8.0.41, so the migration SQL was not executed on it. The existing
MySQL/browser release gap in original `NOTE-2` remains explicit.

### Direct production-path browser check

The unmodified `tools/start-phone-staging.sh` copied the current production
`deployed/admin_questions.php`, `deployed/admin_question_store.php`,
`deployed/render.php`, and root `ocr_helper.js`, linked the real `src/` tree,
and served a fresh disposable SQLite database at `127.0.0.1:8099`. A local
Chromium session at 390 px verified:

- login succeeded; the page loaded root `ocr_helper.js`, the Underline button,
  safe renderer, and read-only preview, with no retired context/controller
  references;
- preview had zero controls, both blocks used `white-space: pre-wrap`, exact
  lowercase `<u>` rendered, `<b>` stayed escaped, and body width stayed within
  the viewport;
- selecting `First` in Constant Text and clicking Underline wrapped and then
  unwrapped exact lowercase markers through the real runtime button;
- OCR Load left Constant Text byte-for-byte unchanged;
- native save created local row `#102` with the multiline passage and exact
  markers, returned `Question saved successfully (Question ID: 102).`, and the
  next GET prefilled the passage;
- `?edit=102` showed the row value; updating to an empty passage returned
  `Question #102 updated successfully.` and stored `NULL`;
- before submit, storage contained `ocrQueue` and `ocrMeta`; after the PRG load,
  `ocrSubmitted` was absent, the queue advanced from `i:0` to `i:1`, and
  `ocrMeta` held the submitted values, matching the inspected submit-write and
  boot-delete code;
- local row `#102` was deleted with its own row button after the exact
  `Delete question #102? This cannot be undone.` confirmation; the exact success
  flash appeared and the disposable database ended with seeded row `#101` only.

The only console error was a missing local `favicon.ico`. The staging server and
Chromium CDP process were stopped by their managed PID/profile commands. No live
site or production database was opened or written.

## 3. Finding disposition

### `FIX-1` - NOT CLOSED

Criterion (a) passes. `ocr_helper.js:8` accepts `A .`, `a .`, and a newline
before the period. The new vector at `tests/ocr-helper.js:60-78` and independent
positive probes parse all four options without flags. The existing six-form
fixture and mixed `(A). One (b) Two (C) Three d) Four` probe also pass, with
uppercase normalization intact.

Criterion (b) fails. The implementation is:

```js
const OPTION = /(?<![A-Za-z])(?:\(([A-Da-d])\)|([A-Da-d])\s*[.)])[.)]*\s*/g;
```

The inserted `\s*` applies to both characters in `[.)]`, not only to the frozen
`.` terminator. It therefore newly treats `A )` (and `A\n)`) as an option marker.
That changes an existing `A)`-labelled question rather than merely adding the
required dotted tolerance.

Contract-derived adversarial input:

```text
Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four
```

| State | Question | Option A | Flags |
|---|---|---|---|
| reviewed checkpoint `6e301bb` | `Which is correct?` | `The notation A ) stays in option A` | none |
| committed fix `84be892` | `Which is correct? A) The notation` | `stays in option A` | `a letter appears twice (merged questions?)` |

The same failure occurs through the production browser path: OCR Load writes the
second row above into the native Question/Option A fields and `ocrQueue`. This is
not an unsupported bare malformed question. Its real labels are the already
supported `A)`-`D)` form; `A )` occurs inside ordinary option text. The fix moves
stored text between fields and adds a false warning. It directly violates the
frozen requirement that the existing `A)` form parse identically.

Criterion (c) passes. `git diff 6e301bb -- ocr_helper.js` changes exactly the
one regex line. `splitQuestions`, `FIXES`, `cleanBlock`, `cleanLine`, queue,
storage, fill, and Constant Text isolation are byte-unchanged. The full baseline
passes, and the browser check confirms Constant Text stays untouched.

The required cap evidence also passes: `ocr_helper.js` is 143 lines / 5,615
bytes and remains `+38/-18` from the designated live snapshot, within the
100-addition cap. Passing positive vectors do not cure criterion (b):
`tests/ocr-helper.js:60-78` checks missing-option flags for the direct spaced-dot
cases but has no control proving whitespace was not also enabled before `)`.

This record does not assign a new ID. The reproduced failure is the exact
existing-form preservation criterion in `FIX-1`, not an unrelated parser
dimension or a replacement finding. The frozen closure contract and non-goals
remain unchanged. A later fix must make the dotted tolerance pass while making
the adversarial `A)` question above parse identically to `6e301bb`, add direct
regression evidence for that criterion, rerun the required suites, and preserve
the cumulative cap.

The original review left `FIX-1` open. The first re-review's positive probes did
not exercise `A )` inside a valid `A)`-labelled question and incorrectly claimed
criterion (b) closed. This second re-review demonstrates that the committed fix
never met the frozen contract. The finding has therefore completed the fix and
re-review cycle without resolution and now requires owner disposition before
another fix is authorized.

### `FIX-2` - CLOSED

- **(a) passes.** `ocr_helper.js:73-81,100-101,131-140` accesses `ocrQueue`,
  `ocrMeta`, and the legacy `ocrSubmitted` marker exactly as described by
  `docs/SPEC.md:132-149` and `docs/DEVELOPER-GUIDE.md:47-68`. The local PRG run
  independently observed queue advancement and next-load marker deletion.
- **(b) passes.** `AGENTS.md:44-48` and `docs/AGENTS.md:78-87,191-193` explicitly
  distinguish the root helper from the archived bookmarklet.
- **(c) passes.** `docs/INVARIANTS.md:80-86` scopes the bookmarklet claims and
  shared-key risk correctly; no invariant says the root helper avoids the
  marker. `INV-135` also matches the positive label checks.
- Storage behavior did not change in the fix commit, and no key name or shape,
  bookmarklet, or Constant Text path changed.

Existing `NOTE-5` remains accurate: `docs/DEVELOPER-GUIDE.md:49` says "uses
only" immediately before later documenting `ocrSubmitted`. The three-key
behavior is nevertheless stated correctly, so this wording issue does not
reopen `FIX-2` and is not a commit gate.

### New finding IDs

None. `FIX-1` remains unresolved on its own frozen criterion; `FIX-2` closes.
The original non-blocking notes and first re-review `NOTE-5` remain immutable
and outside this closure scope.

## 4. Acceptance coverage

| # | Package acceptance | Re-review result |
|---|---|---|
| 1 | Civic 50 x 4, listed label variants, bank-2021 40, existing forms preserved | **FAIL on frozen preservation criterion (`FIX-1`)**. All listed positive counts pass, but a supported `A)` question is corrupted by the fix-derived adversarial probe. |
| 2 | Admin create/update/delete with Constant Text; PRG and four-option rule | PASS: real store suite plus disposable production-page create/update/delete and exact flashes. |
| 3 | Save/edit/prefill/session behavior | PASS on the changed-tree path: save, next-GET prefill, edit row value, empty update to `NULL`, and login executed locally; the unchanged logout/two-session branches retain the original independent review evidence. |
| 4 | Underline last-focused field, exact wrap/unwrap/refusal | PASS: 9 pure vectors and real Constant Text runtime wrap/unwrap. |
| 5 | CBT exam-only Constant Text and formatted exam/result options | PASS by unchanged source inspection (`deployed/cbt.php:803-886,983-1016`) plus the real shared-renderer suite; no CBT browser runtime, as already recorded in `NOTE-2`. |
| 6 | Answer details Constant Text and formatted options | PASS by unchanged source inspection (`deployed/answer_details.php:185-196`) plus the real shared-renderer suite; same runtime gap. |
| 7 | Current suites and PHP lint | PASS with the PHP-version caveat in section 2. |
| 8 | Live-origin files within the 100-addition cap or approved | PASS; maximum remains +87 and no exception exists or is needed. |
| 9 | Phone staging loads root helper without context files | PASS on fresh disposable staging. |

## 5. Independent measurements, responsibilities, and deployment

### Live-origin caps

`git diff --numstat --no-index <designated live snapshot> <current file>` and
`wc -lc` reproduce:

| File | Live snapshot lines / bytes | Final lines / bytes | Additions / deletions | Cap |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1046 / 62273 | 1053 / 62540 | **+87 / -80** | pass |
| `deployed/cbt.php` | 1044 / 45990 | 1085 / 47287 | **+49 / -8** | pass |
| `deployed/answer_details.php` | 250 / 12103 | 255 / 12617 | **+8 / -3** | pass |
| `ocr_helper.js` | 123 / 5085 | 143 / 5615 | **+38 / -18** | pass |

The designated snapshot SHA-256 values reproduce the original review, and the
current helper SHA-256 is
`9d44b56139f485bf3c2b8242d1d614aa9712663837107a560020f9d9b254da60`.
No Gate 1 exception is required; the retired D-82 exception is not reused.

### Package-base production and ops files

Package-base additions/deletions below are from `e64513f`; the external cap for
live-origin files remains the separate live-snapshot table above.

| File | Base -> final lines / bytes | Package diff | Responsibility | Deployment and direct-path evidence |
|---|---|---:|---|---|
| `deployed/admin_questions.php` | 1196 / 68152 -> 1053 / 62540 | +25 / -168 | native admin form, validation, session and narrow store dispatch | site root; real disposable page, store suite, PHP lint |
| `deployed/admin_question_store.php` | 0 / 0 -> 113 / 4918 | +113 / -0 | standalone save/delete transaction | site root; real PHP store suite and disposable page |
| `deployed/cbt.php` | 1008 / 44515 -> 1085 / 47287 | +113 / -36 | standalone CBT selection, delivery, and exam/result rendering | site root; renderer suite and source path; runtime gap retained |
| `deployed/answer_details.php` | 251 / 12157 -> 255 / 12617 | +6 / -2 | detail read and formatted Constant Text/options | site root; renderer suite and source path; runtime gap retained |
| `ocr_helper.js` | 123 / 5085 -> 143 / 5615 | +38 / -18 | production OCR split/parse/queue/fill helper | site root; real Node module and browser page; `FIX-1` fails |
| `src/underline-toolbar.js` | 0 / 0 -> 128 / 3898 | +128 / -0 | exact-marker Underline control | site root `src/`; real module vectors and browser runtime |
| `src/question-preview.js` | 0 / 0 -> 104 / 3759 | +104 / -0 | read-only Constant Text/Question preview | site root `src/`; real module test and browser runtime |
| `src/question-preview.css` | 0 / 0 -> 37 / 711 | +37 / -0 | preview layout and `pre-wrap` | site root `src/`; browser computed-style/overflow probe |
| `deployed/sql/01-constant-text.sql` | 0 / 0 -> 49 / 1719 | +49 / -0 | guarded forward migration | ops directory; static inspection only, target MySQL deferred |
| `deployed/sql/02-constant-text-rollback.sql` | 0 / 0 -> 38 / 1169 | +38 / -0 | non-empty-data rollback refusal | ops directory; static inspection only, target MySQL deferred |
| `deployed/sql/README.md` | 172 / 8065 -> 81 / 3105 | +41 / -132 | migration/deployment runbook | ops directory; manifest and static checks |

`deployed/sql/base-schema.working.sql` changed from 89 / 4140 to 90 / 4224
(`+2/-1`) but is repository-only disposable test support, not a deployment file;
`docs/DEPLOYMENT.md:63-64` explicitly excludes it.

All 13 rows in the deployment manifest were independently parsed and checked:
line counts, LF bytes, and SHA-256 values match with zero failures. The unchanged
`deployed/render.php` and `src/owner-tool/render.js` dependencies are included in
that manifest and were exercised by the PHP renderer suite and local browser
preview respectively. Admin wiring at `deployed/admin_questions.php:6-7,694,
1047-1050` includes the store, renderer, helper, toolbar, and preview. No focused
module is orphaned, no copied control flow is claimed as executable evidence,
and the fix adds no new module or monolithic entry-point behavior.

### Fixture provenance

- Tracked `new-edge.txt` and
  `tests/fixtures/ocr-helper-civic-2026.txt` are byte-identical, SHA-256
  `0c7b881b0b1f85e646f55f184e417ef6aed1cb639aaffcca353d288ba797aee2`.
- `tests/fixtures/ocr-helper-option-labels.txt` is the hand-written six-form
  input. The spaced-dot vector is explicit test text in `tests/ocr-helper.js`,
  not generated parser output.
- The runner reports all 60 manually expected fixtures and no orphan input. No
  expected fixture was regenerated or weakened.
- The new adversarial probe was executed in Node and the browser only; this
  read-only review did not add a fixture or test.

### Approvals and excluded artifacts

- **Approvals:** no line-limit exception exists or is needed. No owner
  requirement change or risk acceptance applies to `FIX-1` or `FIX-2`.
- **Archived removals:** four context PHP files, two context SQL files, four
  owner-tool assets, eight context tests, and three context tools are R100 moves
  under `archive/owner-tool-2026-11/`; the archive and its README are historical
  evidence, not deployed ST01 modules.
- **Other excluded evidence/support:** root `new-edge.txt`, `tests/fixtures/`,
  supplied SQL under `archive/sql/`, phone-staging scripts/SQLite shim and the
  local disposable staging tree/database, repo-only
  `deployed/sql/base-schema.working.sql`, generated `src/bookmarklet.js`, and
  this review's browser profile/output. `src/bookmarklet.min.js` is absent.
- **Unrelated worktree changes:** none.

## 6. Verdict and exact next action

**PASS WITH ACCEPTED FINDINGS.** Core ST01 behavior and all baseline suites are
present, but phase 1 is not review-settled because `FIX-1` fails its frozen
existing-form preservation criterion. `FIX-2` is closed. No new finding ID is
introduced.

- **Commit readiness:** not ready for a reviewed phase boundary or publication.
  The fix already exists in committed checkpoint `84be892`, but this review does
  not approve advancing it. No commit was made here.
- **Dependency readiness:** ME01 remains blocked on the ST01 review dependency.
- **Review status:** second closure-focused re-review complete; `FIX-1`
  unresolved, `FIX-2` closed. Earlier records remain immutable.
- **Required next action:** `FIX-1` has completed its fix/re-review cycle without
  satisfying the frozen contract. The owner must use the disposition session to
  choose `fix`, `reject`, `accept risk`, `defer` to a named package, or `change
  requirement`. Another fix session is not authorized until that disposition is
  recorded.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md phase 1 FIX-1
