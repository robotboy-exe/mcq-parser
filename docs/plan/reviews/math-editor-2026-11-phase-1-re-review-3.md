# Phase 1 Re-review 3 - ST01 Constant Text Reset (`FIX-1`)

- **Date:** 2026-11-15
- **Reviewer:** independent review session (OpenCode)
- **Scope:** closure-focused re-review of phase 1 / `ST01` `FIX-1` after the
  owner's recorded `change requirement` disposition and the replacement D-91
  implementation
- **Package:**
  `docs/plan/owner-tool/st-01-constant-text-reset.md`
- **Prior records:** original review
  [`math-editor-2026-11-phase-1.md`](math-editor-2026-11-phase-1.md), first
  re-review
  [`math-editor-2026-11-phase-1-re-review.md`](math-editor-2026-11-phase-1-re-review.md),
  and second re-review
  [`math-editor-2026-11-phase-1-re-review-2.md`](math-editor-2026-11-phase-1-re-review-2.md)
- **Reviewed state:** `owner-tool-integration` at `84be892` plus the uncommitted
  replacement fix; implementation checkpoint `6e301bb`; unchanged package base
  `e64513f`
- **Mode:** closure-focused. The owner replaced the earlier dot-only contract
  with D-91; this review tests that recorded replacement and does not broaden it
- **Worktree:** the replacement fix had 19 tracked modified files and the prior
  immutable second re-review as an untracked record. This session changed only
  this new review record, did not edit product/test/package/status files, did not
  move a branch, and did not commit

## 1. Authority and Frozen Closure Contract

The accepted second re-review demonstrated that `84be892` did not preserve the
selected `A)` boundary. The owner then explicitly chose `change requirement` and
recorded D-91 in `INTENT.md`, `docs/DECISIONS.md`, the coordinator, and the ST01
package before authorizing the replacement fix. The resulting closure contract
is finite and unambiguous:

| Criterion | Frozen requirement and evidence |
|---|---|
| Grammar | A-D labels are case-insensitive in bare dotted, bare closing-parenthesis, parenthesized, and parenthesized-plus-dot forms. Whitespace is optional after `(`, before `)`, and before `.`, and every unspaced form remains valid. Exercise all positions in uppercase and lowercase against the real root helper. |
| Selected boundaries | Once a letter's boundary is selected, a later label-like occurrence of that letter remains option text and does not replace or resplit the selected boundary. The exact `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` vector must produce the named Question/A-D values. |
| Diagnostics | An internal selected-letter repeat alone must not raise `a letter appears twice (merged questions?)`. A boundary-less second complete ordered A-D set must still warn; a visible numbered boundary must suppress that merged-paste warning. |
| Preservation | The question splitter, `FIXES`, multiline cleanup, uppercase normalization, queue/storage/fill behavior, Constant Text isolation, civic and bank behavior, and unrelated parser behavior remain unchanged. Run the full package baseline and preserve the cumulative live-origin cap. |

Required direct evidence is `node tests/ocr-helper.js` against the real
`ocr_helper.js`, the fixture/unit baselines, a closure-derived adversarial probe,
the production admin-page path, and cumulative measurements from package base
and the designated live snapshot.

Explicit non-goals remain E/F support or its E/F-to-D behavior, `A -`, changes
to `splitQuestions` numbering, Constant Text inference, parser-core/bookmarklet
work, PHP/server/database behavior, and ME01.

## 2. Repository and Change Scope

```text
git rev-parse --abbrev-ref HEAD              owner-tool-integration
git rev-parse HEAD                           84be89271cb295dae279c20efe3bd83167f80878
git merge-base e64513f HEAD                  e64513f2f36ebe8b2073cea0d893f891066b16b6
git show -s e64513f 6e301bb 84be892          confirms the package base and two-commit sequence
git diff --check                             PASS
```

Relative to committed `84be892`, the replacement changes one production file:

```text
ocr_helper.js       +22 / -5
tests/ocr-helper.js +74 / -0
```

The remaining tracked changes are current-facing D-91 authority, package,
status, manifest, and handoff documentation. No fixture input/expected file,
canonical parser module, legacy UI/bookmarklet source, generated bookmarklet,
PHP file, SQL file, or other production module changed in this replacement.
The browser/storage section of `ocr_helper.js` is byte-unchanged from
`84be892`; only `OPTION` and option-boundary/duplicate-set logic inside the pure
parser changed.

Implementation inspection confirms:

- `ocr_helper.js:8` composes the three optional whitespace positions and keeps
  the non-letter left boundary plus case-insensitive A-D captures;
- `ocr_helper.js:42-48` records every match for diagnostics but keeps the first
  accepted boundary for each letter;
- `ocr_helper.js:53-67` detects a later ordered A-D set after the selected set
  while honoring a visible numbered boundary;
- `ocr_helper.js:79-81` exports the real production parser for the Node suite;
- `ocr_helper.js:84-160` retains the existing DOM, queue, storage, fill, and
  submit path, with no `constant_text` reference;
- `deployed/admin_questions.php:1047-1050` loads the real root helper alongside
  the renderer, underline control, and read-only preview.

## 3. Commands and Results

Runtime versions in this environment were Node `v26.13.0` and PHP `8.5.12`.
The current PHP CLI is not the declared PHP 8.3 target; the original independent
review ran PHP 8.3.32, and no PHP byte changed in the D-91 replacement.

```text
node tests/runner.js                  60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                    163 PASS, 0 FAIL
node tests/ocr-helper.js              11 PASS
node tests/underline-toolbar.js       9 PASS
node tests/question-preview.js        4 PASS
node tools/extract-bank.js --check    source, anchors, counts, 7 hashes OK
php tests/php-render.php              9 PASS
php tests/admin-question-store.php    8 PASS
node --check ocr_helper.js            PASS
php -l deployed/admin_questions.php
php -l deployed/admin_question_store.php
php -l deployed/cbt.php
php -l deployed/answer_details.php
php -l deployed/render.php
php -l tools/phone-staging/cbt_db.php all report no syntax errors
```

The helper suite executes `require('../ocr_helper.js')`, not copied behavior.
Its D-91 matrix covers 17 structural spacing formats in both cases across A-D,
the exact selected-boundary vector, later A/B/C/D repeats, a clean and
interleaved second complete set, a numbered boundary, and an out-of-order
control. Existing civic, six-form, spaced-period, bank, multiline, no-stem,
normalization, and Constant Text isolation checks also pass.

### Closure-derived adversarial probes

The exact required vector independently returned:

```json
{"num":1,"question":"Which is correct?","a":"The notation A ) stays in option A","b":"Two","c":"Three","d":"Four","flags":[]}
```

A new mixed-case/newline probe combines every relevant boundary property in one
numbered production-path input:

```text
1. Which mixed labels work? ( A ) . Alpha a
) stays b
) Bravo ( b ) . stays C . Charlie ( c ) stays (d
)
. Delta d . stays
```

It returned one question with:

```text
Question: Which mixed labels work?
A: Alpha a ) stays
B: Bravo ( b ) . stays
C: Charlie ( c ) stays
D: Delta d . stays
Flags: none
```

This probe is derived directly from the frozen spacing and first-boundary
criteria: it mixes case, whitespace/newlines at each supported punctuation
position, and later label-like repeats of every selected letter. A separate
mixed-spacing second-set probe still raised the merged-question warning, while
the same later set behind `2. Second question` did not.

### Direct production-page path

The unmodified `tools/start-phone-staging.sh` copied the current real
`deployed/admin_questions.php`, `deployed/admin_question_store.php`,
`deployed/render.php`, and root `ocr_helper.js`, linked the real `src/` tree,
and served a fresh disposable SQLite database at `127.0.0.1:8101`. Managed local
Chromium verified:

- the protected Add page loaded root `ocr_helper.js`, the underline control,
  safe renderer, and read-only preview with no retired context/controller
  assets;
- OCR Load of the exact required vector filled Question and A-D exactly, wrote
  an unflagged `ocrQueue` item, and left the prefilled multiline Constant Text
  byte-for-byte unchanged;
- after Clear, OCR Load of the mixed-case/newline adversarial vector produced
  the exact values above in the native form and queue, again with no flags and
  no Constant Text change;
- a native save created disposable row `#102` and returned exact flash
  `Question saved successfully (Question ID: 102).`; the next GET retained the
  multiline Constant Text, advanced `ocrQueue.i` from 0 to 1, and deleted the
  legacy `ocrSubmitted` marker;
- `?edit=102` loaded the stored passage and exact parsed fields; an empty update
  returned exact flash `Question #102 updated successfully.` and the redirected
  Add form was empty;
- the one exact local delete form for `#102` was clicked, its dialog said
  `Delete question #102? This cannot be undone.`, the exact success flash
  appeared, and `?edit=102` then reported that the question was not found;
- the only console error was the expected missing local `favicon.ico`.

The staging server and Chromium CDP process were stopped through their managed
commands, and the port was confirmed closed. No live site or production
database was opened or written.

## 4. Finding Disposition

### `FIX-1` - CLOSED

- **Grammar passes.** The real helper parses the full case-insensitive D-91
  structural/spacing matrix, including newline whitespace, while every prior
  unspaced form remains green.
- **Selected boundaries pass.** The exact prior failure now keeps the first A
  boundary and the internal `A )` in Option A. The combined A/B/C/D repeat test
  and independent mixed-case/newline browser probe keep every later
  selected-letter marker in its option text.
- **Diagnostics pass.** Internal repeats alone have no duplicate warning; clean,
  mixed-spacing, and interleaved later ordered A-D sets warn; a visible numbered
  boundary suppresses that warning; the out-of-order control does not invent a
  second set.
- **Preservation passes.** Only the pure root-helper option grammar/boundary and
  duplicate-set logic changed. The splitter, fixes, cleanup, queue/storage/fill,
  Constant Text isolation, canonical parser, bookmarklet, PHP, SQL, E/F, and
  numbering behavior are unchanged. All baseline and package suites pass.
- **Cap passes.** `ocr_helper.js` is 160 lines / 6,284 bytes and **+57/-20**
  from the designated live snapshot, within the 100-addition cap. Package-base
  counters were not reset.

No new `BLOCK`, `FIX`, or `NOTE` is introduced. Existing immutable notes remain
outside this closure target, including original `NOTE-2` (no target-MySQL
migration execution and no CBT/answer-detail browser runtime release evidence)
and first re-review `NOTE-5` (the non-blocking `uses only` wording).

## 5. Acceptance Coverage

| # | ST01 acceptance | Re-review result |
|---|---|---|
| 1 | Civic 50 x 4; bank-2021 40; D-91 grammar, selected boundary, and warning behavior | **PASS.** Eleven real-helper checks, exact independent vector, closure-derived Node probes, and the real local browser path pass. |
| 2 | Disposable admin create/update/delete; unchanged PRG flash and four-option rule | **PASS.** Real store suite plus current disposable native save/update/exact-row delete lifecycle. |
| 3 | Constant Text save/edit/prefill/login/logout/session isolation | **PASS.** Current save/prefill/edit/empty-update path passed; unchanged login/logout/session branches retain the original independent staging evidence and were inspected byte-for-byte outside the D-91 diff. |
| 4 | Underline wrap/unwrap/last-focus/refusal | **PASS.** Nine real-module vectors; module and wiring unchanged. |
| 5 | CBT exam-only Constant Text and formatted exam/result options | **PASS by unchanged source path plus nine real renderer vectors.** The previously recorded browser-runtime release gap remains. |
| 6 | Answer details Constant Text and formatted options | **PASS by unchanged source path plus nine real renderer vectors.** Same runtime gap. |
| 7 | Current suites and PHP lint | **PASS**, with the PHP-version caveat in section 3. |
| 8 | Capped live-origin files within 100 additions or explicitly approved | **PASS.** Maximum is +87; no exception exists or is needed. |
| 9 | Phone staging loads root helper without context files | **PASS** on fresh disposable staging and the current browser production path. |

## 6. Independent Measurements and Deployment

### Live-origin caps

`git diff --numstat --no-index <designated snapshot> <current file>` and
`wc -lc` independently reproduce:

| File | Live snapshot lines / bytes | Final lines / bytes | Additions / deletions | Cap |
|---|---:|---:|---:|---|
| `deployed/admin_questions.php` | 1046 / 62273 | 1053 / 62540 | **+87 / -80** | pass |
| `deployed/cbt.php` | 1044 / 45990 | 1085 / 47287 | **+49 / -8** | pass |
| `deployed/answer_details.php` | 250 / 12103 | 255 / 12617 | **+8 / -3** | pass |
| `ocr_helper.js` | 123 / 5085 | 160 / 6284 | **+57 / -20** | pass |

The four designated snapshot SHA-256 values match the original review:
`b47e6f6e...6028`, `9ca5f7b4...f1435`, `680cfd69...a7368`, and
`f51a6436...0e49`. The current helper SHA-256 is
`c3e8e96eb2a295eb3ef0a8c0e87089b233cd026afe7fec664c7db16b17732193`,
matching `docs/DEPLOYMENT.md`.

### Package-base production and ops files

The original package base remains `e64513f`. Additions/deletions are cumulative
from that base; final lines/bytes are current working-tree values.

| File | Base -> final lines / bytes | Package diff | Responsibility | Deployment and direct production-path evidence |
|---|---|---:|---|---|
| `deployed/admin_questions.php` | 1196 / 68152 -> 1053 / 62540 | +25 / -168 | native admin form, validation, session, narrow store dispatch | site root; real disposable page, store suite, PHP lint |
| `deployed/admin_question_store.php` | absent -> 113 / 4918 | +113 / -0 | standalone save/delete transaction | site root; real PHP store suite and disposable page |
| `deployed/cbt.php` | 1008 / 44515 -> 1085 / 47287 | +113 / -36 | standalone CBT selection, delivery, exam/result rendering | site root; real shared-renderer suite, source path, PHP lint; browser release check deferred |
| `deployed/answer_details.php` | 251 / 12157 -> 255 / 12617 | +6 / -2 | detail read and formatted Constant Text/options | site root; real shared-renderer suite, source path, PHP lint; browser release check deferred |
| `ocr_helper.js` | 123 / 5085 -> 160 / 6284 | +57 / -20 | production OCR split/parse/queue/fill helper | site root; real Node module and disposable production page |
| `src/underline-toolbar.js` | absent -> 128 / 3898 | +128 / -0 | exact-marker Underline control | site root `src/`; real module vectors and existing runtime evidence |
| `src/question-preview.js` | absent -> 104 / 3759 | +104 / -0 | read-only Constant Text/Question preview | site root `src/`; real module vectors and current production page |
| `src/question-preview.css` | absent -> 37 / 711 | +37 / -0 | preview layout and `pre-wrap` | site root `src/`; loaded by current production page |
| `deployed/sql/01-constant-text.sql` | absent -> 49 / 1719 | +49 / -0 | guarded forward migration | ops directory; static inspection only, target MySQL deferred |
| `deployed/sql/02-constant-text-rollback.sql` | absent -> 38 / 1169 | +38 / -0 | non-empty-data rollback refusal | ops directory; static inspection only, target MySQL deferred |
| `deployed/sql/README.md` | 172 / 8065 -> 81 / 3105 | +41 / -132 | migration/deployment runbook | ops directory; manifest and static checks |

The new modules remain cohesive and have explicit deployment paths. The admin
entry point contains narrow includes/wiring and local transaction hooks; the
database mutation is in `admin_question_store.php`. The replacement fix adds no
new module or monolithic entry-point behavior.

All 13 production/ops rows in `docs/DEPLOYMENT.md` were independently checked:
line counts, bytes, and SHA-256 values match the current files. Unchanged
dependencies `deployed/render.php` (78 / 2447) and
`src/owner-tool/render.js` (209 / 6339) are included and exercised by the PHP
renderer and browser preview paths. No deployment module is orphaned, and no
copied SQL or reimplemented control flow is claimed as executable evidence.

### Provenance, approvals, and exclusions

- `new-edge.txt` and `tests/fixtures/ocr-helper-civic-2026.txt` are
  byte-identical owner-supplied evidence, SHA-256
  `0c7b881b0b1f85e646f55f184e417ef6aed1cb639aaffcca353d288ba797aee2`.
- `tests/fixtures/ocr-helper-option-labels.txt` is the hand-written six-form
  fixture. The D-91 matrix and selected-boundary controls are explicit test
  vectors, not generated parser output.
- No fixture or expected JSON changed from `84be892`; the fixture runner reports
  all 60 manually expected fixtures and no orphan.
- No line-limit approval exists or is needed. The maximum live-origin addition
  count is +87; the retired D-82 exception is not reused.
- Excluded separately: archived R100 context/owner-tool moves under
  `archive/owner-tool-2026-11/`, root `new-edge.txt`, `tests/fixtures/`, supplied
  SQL under `archive/sql/`, generated `src/bookmarklet.js`, local staging
  state/browser output, and repository-only
  `deployed/sql/base-schema.working.sql` (89 / 4140 -> 90 / 4224, +2/-1).
  `src/bookmarklet.min.js` is absent.
- No unrelated worktree change was attributed to or modified by this review.

## 7. Verdict and Exact Next Action

**PASS.** The owner-amended D-91 `FIX-1` closes on every frozen criterion. The
replacement executes through the real helper in Node and the disposable native
admin page, the exact prior failure and a new closure-derived adversarial probe
pass, diagnostics are preserved, all current baselines are green, and every
live-origin file remains within its cap.

- **Review status:** third closure-focused re-review complete; `FIX-1` closed,
  `FIX-2` remains closed, no new finding exists, and ST01 is review-settled.
- **Commit readiness:** the phase-1 replacement is review-ready for the owner's
  explicit phase-boundary decision. This review made no commit; current
  instructions still require explicit authorization.
- **Dependency readiness:** the ST01 review dependency is satisfied. ME01 may
  proceed to its read-only Gate 1, which must reconcile current status, retain
  this reviewed working-tree baseline, and remeasure `admin_questions.php`
  before offering `go`.
- **Residual release evidence:** target MySQL migration execution and final
  CBT/answer-detail/Brave runtime evidence remain assigned to the later release
  path and do not reopen this closure.

NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 2
