# Main Release Re-review 3 - `math-editor-2026-11`

- **Date:** 2026-11-22
- **Reviewer:** independent re-review session
- **Mode:** closure-focused re-review of `BLOCK-10`
- **Finding record:**
  [`math-editor-2026-11-main-release-re-review-2.md`](math-editor-2026-11-main-release-re-review-2.md)
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Prior reviewed target:**
  `533852b26dfc633822a33887fba9dd914ffa9dfb`
- **Fix commit:**
  `60f585dc62e6a7a3e6b72c0a962ce82ee475d120`
- **Exact reviewed target:**
  `60f585dc62e6a7a3e6b72c0a962ce82ee475d120`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, browser,
  or live record was changed.

## 1. Scope and exact tree

This review freezes `BLOCK-10` exactly as recorded at
`math-editor-2026-11-main-release-re-review-2.md:199-259`. The supported path is
one ordinary numbered question with one complete parenthesized A-D set whose
labels mix case; a later repeat of an already selected label may occur in its
option text. The finite checklist is the exact three-path vector, all 16 case
combinations, preservation of D-91 selected-repeat and scoped refusal behavior,
and failing-first/full-baseline/token/manifest evidence.

The worktree began clean on `owner-tool-integration`. `HEAD` and
`origin/owner-tool-integration` both resolved to `60f585d`. The prior review
record is committed at `8dcd5c2`; `60f585d` contains the requested fix and its
handoff. No reviewed path differed from that exact target before this record.

This review does not reopen closed `BLOCK-4` through `BLOCK-8`, withdrawn
`BLOCK-2`/`BLOCK-3`/`BLOCK-9`, or original `NOTE-13`. It does not dispose
inherited `BLOCK-1`. Current `origin/main` is still `4d68b28`, its merge base
with the target is `002483b`, the left/right count is `2 120`, and it is not an
ancestor of the target. That remains a separate undisposed release blocker.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-10` | **OPEN** | The exact vector, 16 no-repeat case combinations, full baseline, tokens, and manifest pass, but a complete mixed-case set with an opposite-case repeat selects the later `(A)` boundary and moves the intended Option A prefix into the question |
| `BLOCK-1` | **OPEN (inherited, not re-reviewed)** | Current `origin/main` is still not an ancestor of the release target |

No new finding ID is assigned. The adversarial failure is directly inside
`BLOCK-10`'s frozen supported preconditions and criterion 3: case-insensitive
selected-repeat behavior for one complete mixed-case parenthesized set. It is
not a substitute vector or an unrelated parser dimension.

## 3. Commands and observed evidence

Node was v26.13.0. PHP checks and all seven deployed PHP lints used the
pre-existing static PHP 8.3.32 AArch64 CLI at
`$HOME/tmp/php83-review/php`; no prior result was trusted.

| Command or probe | Result |
|---|---|
| `git status --short --branch` | clean `owner-tool-integration...origin/owner-tool-integration` before this record |
| `git rev-parse HEAD origin/owner-tool-integration origin/main` | `60f585d`, `60f585d`, `4d68b28` |
| `git merge-base HEAD origin/main` | `002483b` |
| `git rev-list --left-right --count origin/main...HEAD` | `2 120` |
| `git merge-base --is-ancestor origin/main HEAD` | exit 1; inherited `BLOCK-1` unchanged |
| `node tests/runner.js` | 68 PASS / 0 FAIL / 0 PENDING / 0 ORPHAN |
| `node tests/unit.js` | 169 PASS / 0 FAIL |
| `node tests/ocr-helper.js` | 31 PASS |
| `node tests/underline-toolbar.js` | 10 PASS |
| `node tests/question-preview.js` | 7 PASS |
| `node tests/math-tool.js` | 26 PASS |
| `node tests/render-markup.js` | 69 PASS |
| `node tools/extract-bank.js --check` | source, anchors, counts, and 7 hashes PASS |
| PHP 8.3.32 `tests/php-render.php` | 33 PASS |
| PHP 8.3.32 `tests/admin-question-store.php` | 8 PASS |
| PHP 8.3.32 `tests/cbt-question-order.php` | 14 PASS / 0 FAIL |
| PHP 8.3.32 `-l deployed/*.php` | 7/7 PASS |
| `node --check` on core, helper, and browser renderer | PASS |
| `git diff --check 455ea54..HEAD` | PASS |
| deployment-manifest verifier | 20 hash-bearing rows / 0 line, byte, or hash mismatches |
| prior-target exact vector | core, exported helper, and real Load reproduce empty A/C and both missing-option flags |
| current exact vector | core, exported helper, and real Load return the five exact values and no flags |
| exact unspaced case matrix | prior target 2/16; current target 16/16 |
| opposite-case selected-repeat matrix | current core 15/16; exported helper 15/16 |
| opposite-case selected-repeat real Load | wrong question/A boundary, no advisory flag |
| restored expected-file object comparison | both files byte-identical to their authored pre-RM Git objects |
| eight RM01 input hashes | all match the handoff provenance table |

No live URL, database, MySQL operation, deployment, save, delete, cleanup, or
real browser session was used. The Load probes execute the real browser branch
of root `ocr_helper.js` in the repository VM DOM harness, click its actual Load
handler, and inspect its storage, status, radios, and native form fields.

## 4. Frozen closure verification

### Criterion 1 - PASS

The exact finding vector is:

```text
1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta
```

At prior target `533852b`, direct core, exported-helper, and real Load probes
independently reproduce Question
`Which is correct? (a) Alpha (a) notation stays in option A`, empty A/C,
B `Bravo (c) Charlie`, D `Delta`, and the two missing-option flags.

At `60f585d`, `core.parseQuestion`, exported `helper.parseAll`, and the real
Load path all return Question `Which is correct?`, A
`Alpha (a) notation stays in option A`, B `Bravo`, C `Charlie`, D `Delta`, and
no flags. The direct regressions are at `tests/unit.js:200-209`,
`tests/ocr-helper.js:135-154`, and `tests/ocr-helper.js:437-448`.

### Criterion 2 - PASS

All 16 uppercase/lowercase combinations of one unspaced parenthesized A-D set
produce the same clean five values and no flags. The direct matrix at
`tests/unit.js:211-222` passes. An independent probe reproduces the prior
target's 2/16 result and the current target's 16/16 result.

### Criterion 3 - FAIL

The named existing controls pass:

- the 17-form uppercase/lowercase spacing matrix;
- the exact bare-label `A) ... A ) ... B)` selected boundary;
- the all-lowercase repeated `(a)` parenthesized set;
- the incomplete lowercase `(a)`-`(c)` refusal;
- the unlinked `PASSAGE` fallback;
- both restored CONFIRMED comprehension fixtures.

The required closure-focused adversarial probe combines only the frozen
case-insensitive mixed-set and selected-repeat dimensions:

```text
1. Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta
```

This is one complete intended set `(a)`, `(B)`, `(C)`, `(D)`, with a later
case-insensitive repeat `(A)` inside Option A. D-91 requires the first selected
A boundary to remain authoritative. The pre-RM production helper at package
base `455ea54` returns:

```text
question  Which is correct?
A         Alpha (A) notation stays in option A
B         Bravo
C         Charlie
D         Delta
flags     none
```

The current core, exported helper, and real Load path instead return:

```text
question  Which is correct? (a) Alpha
A         notation stays in option A
B         Bravo
C         Charlie
D         Delta
flags     none
status    Question 1 of 1 (book number 1)
```

The native form therefore silently assigns the intended first A label and
`Alpha` to `question_text` and starts `option_a` at the repeated `(A)`. This is
a material D-91 boundary regression on the exact supported production path.

The implementation cause is at `src/parser/core.js:838-852`. For this vector,
`lowerParenSet` is `A`, `upperParenSet` becomes `ABCD` from the later repeated
`(A)` plus `(B)`/`(C)`/`(D)`, and `allParenSet` is the correct first-occurrence
`ABCD`. The uppercase-only branch at `:845-848` runs before the global
first-occurrence branch at `:849-852`, discards the original lowercase `(a)`,
and promotes the repeated `(A)` to the boundary.

An independent matrix that adds the opposite-case selected-A repeat to each of
the same 16 label combinations passes only 15/16 in both core and exported
helper; the failing mask is exactly lowercase A plus uppercase B/C/D. This
probe is finite and derived from `BLOCK-10`'s explicit supported precondition
that a later selected-label repeat may occur. Criterion 3 therefore fails and
`BLOCK-10` cannot close.

### Criterion 4 - PASS as evidence

The fix added direct core, exported-helper, and real Load regressions. Running
their exact vector against prior target `533852b` fails through all three paths,
and the current tests pass. The complete Node/PHP baseline is green.

Because production bytes changed, the deployment pins rotate consistently:

- `src/parser/core.js` reports `2.5.2` and is loaded as `?v=2.5.2`;
- `ocr_helper.js` requires core `2.5.2` and is loaded as `?v=2.4.3`;
- `deployed/admin_questions.php:1050-1051` loads core before helper;
- all 20 hash-bearing deployment rows match current lines, LF bytes, and hashes.

Passing criterion 4 does not override the criterion 3 production-path failure.

## 5. Independent production measurements

The table uses `git diff --numstat 455ea54..60f585d`, exact base Git objects,
and current LF line/byte/SHA-256 measurements.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `src/parser/core.js` | 1432 / 49296 | +328 / -28 | 1732 / 60653 | `2a0a34150c7ebcf96b356afba3397b774212de58064634c2bb66619889285214` | pure canonical parser 2.5.2; site-root `src/` at `?v=2.5.2`; runner, unit, exported-helper, and real Load paths |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `a02adf0f87930dac83aa870150abbfd9ea7cb7f3a2f6da41b6c4d4ccdd554b01` | thin queue/form adapter; site root at `?v=2.4.3`; real source/Load helper suite |
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `870074b6af9f4f3b13fcec130e2b64c186fb5594b2a41e02ddf3fbfec1482f96` | native admin entry and narrow asset wiring; site root; token/wiring assertions and helper browser branch |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery and fraction paint; site root; marker and CBT suites |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | detail delivery and fraction paint; site root; stylesheet and PHP renderer evidence |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; PHP shared vectors |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; JS vectors and preview tests |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview/shape paint; served `src/`; real declaration tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | practice delivery retired from this release by owner disposition; not deployed; live file untouched; no release runtime path remains |

The exact production delta contains the same nine files as the handoff. The
`BLOCK-10` fix changes only three production byte streams: parser behavior in
the core, the helper's core pin, and the admin page's two cache tokens. The core
contains no DOM, storage, form, or network behavior; its browser global is only
the module export. The helper remains a 127-line adapter whose parser entry
points are direct core references at `ocr_helper.js:10-25` and whose local work
is `parseAll`, queue, storage, status, and native form fill. No new module,
monolithic entry-point addition, copied parser path, or responsibility exception
was found.

Live-origin additions remain within the hard cap:

| Live-origin file | Add / delete | Result |
|---|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | PASS, additions <=100 |
| `deployed/cbt.php` | +78 / -37 | PASS, additions <=100 |
| `deployed/answer_details.php` | +21 / -3 | PASS, additions <=100 |
| `ocr_helper.js` | +51 / -47 | PASS, additions <=100 |

The deployment manifest has 20 hash-bearing rows and all 20 match. No line-limit
exception or Gate 1 owner approval is required.

## 6. Provenance, approvals, and exclusions

The restored expected files remain byte-identical to their authored pre-RM Git
objects:

```text
sample-comprehension-ambiguous.json  e448b1a4753b0bd8c3716337cc5267bc2ebd6207
sample-comprehension-incomplete.json 49271d9ae56557d0d8bef3a35949a2bd924e10e8
```

The eight RM01 input hashes independently reproduce:

| Input | SHA-256 |
|---|---|
| `region-lowercase-stems.txt` | `fadb5a79e9988ecc9a6f359943f27390d6158615ac5fa5cc21dcfec12fe41265` |
| `region-orphan-number.txt` | `2d546a9a0ead0367149325be8620ebe8ba58e65ee3db08330c51b0d84c1039e8` |
| `real-ec20.txt` | `84dc32e2714ba5c41250162941135e093af7ebba615aed9c531104409889624a` |
| `real-ec20b.txt` | `c4210b8d1f24aa4c1075e8b5765f7ae28c0487fb92f47a6b9896757cb37b354f` |
| `region-midstream-orphan.txt` | `5c7425267d6742542fe5e8fd1b01fa7d89c72d3dd2e9295c8304d42be303a95c` |
| `region-midstream-heading.txt` | `6042c65f4ff6f2b85dc5a75e204d7554c85ed916c4e059070fff1f0ded9531b7` |
| `region-preamble-paragraphs.txt` | `c8d02ba71156826105b2b358efc5048150c3e37d01a398d754a1a65ec6be2bc5` |
| `region-footer-instruction.txt` | `cc309dbe12e7689eab2660f7f3ee0fe01d30ec154007066ceae4cc7efbe89dbf` |

The first two inputs remain identified as hand transcriptions; `real-ec20` and
`real-ec20b` remain tracked owner copies. No expected value was regenerated from
current parser output.

Relevant authority remains unchanged:

- The first-round `BLOCK-10` record authorized one fix against its frozen
  closure contract; it did not authorize a requirement change.
- D-91 remains case-insensitive and keeps a later occurrence of an already
  selected letter inside option text.
- EC-97/EC-98 still require incomplete lowercase refusal and unlinked-passage
  fallback; both continue to pass.
- `BLOCK-4` through `BLOCK-8` retain their prior dispositions and are not
  reopened.
- `BLOCK-1` has no owner disposition and remains outside this requested
  re-review.

Excluded from production limits and deployment evidence:

- `archive/live-sources/*` and `archive/owner-tool-2026-11/*` evidence/history;
- root supplied `admin_questions.php`, `answer_details.php`, `cbt.php`, and
  `cbt_practice.php`, which remain evidence only and are not deployment files;
- supplied root SQL snapshots and `deployed/sql/base-schema.working.sql`;
- generated `src/bookmarklet.js` and absent/untracked
  `src/bookmarklet.min.js`;
- fixtures, tests, and review/package documents as non-production evidence;
- the static PHP CLI under `$HOME/tmp/php83-review` and all transient VM state;
- unavailable live includes, live database/browser state, and every live write
  path.

Deployment, the owner's post-deployment browser re-paste, production English
Lexis operation, and every live save remain external and unauthorized.

## 7. Verdict and next action

**Verdict: BLOCK.** `BLOCK-10` remains open because its frozen selected-repeat
criterion fails on the supported real Load path. The green exact vector, matrix,
baseline, and deployment evidence do not override the silent native-field
boundary regression. Inherited `BLOCK-1` also remains open and undisposed.

- **Commit readiness:** not ready for a release boundary.
- **Main-release readiness:** not ready; one supported mixed-case selected
  boundary is still wrong, and current `origin/main` is not an ancestor.
- **Review status:** requested `BLOCK-10` re-review complete.
- **Finding lifecycle:** `BLOCK-10` was recorded open in the prior review and
  remains open in this next review round. Under the two-round rule, only the
  owner may now choose `fix`, `reject`, `accept risk`, `defer` to a named
  package, or `change requirement`.
- **Recommended next action:** record the owner's disposition for `BLOCK-10`.
  Do not run another fix session, advance `main`, deploy, or perform a live
  paste/save before that decision. `BLOCK-1` still requires its separate owner
  release action.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md disposition math-editor-2026-11 main release BLOCK-10 from docs/plan/reviews/math-editor-2026-11-main-release-re-review-3.md
