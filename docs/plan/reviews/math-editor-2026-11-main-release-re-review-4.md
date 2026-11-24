# Main Release Re-review 4 - `math-editor-2026-11`

- **Date:** 2026-11-23
- **Reviewer:** independent re-review session
- **Mode:** closure-focused re-review of `BLOCK-10`
- **Finding record:**
  [`math-editor-2026-11-main-release-re-review-2.md`](math-editor-2026-11-main-release-re-review-2.md)
- **Prior closure review:**
  [`math-editor-2026-11-main-release-re-review-3.md`](math-editor-2026-11-main-release-re-review-3.md)
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Prior reviewed target:**
  `60f585dc62e6a7a3e6b72c0a962ce82ee475d120`
- **Current checkpoint:**
  `323c9df35f1ea788512f3beb422b37806c54e395`
- **Exact reviewed candidate:** checkpoint `323c9df` plus the pre-review
  14-file unstaged patch whose binary-diff SHA-256 is
  `0096c1a1d396d4509f8972875c02b6e8e9371eda40ba09c045a3c9f21f31a9f4`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, browser,
  or live record was changed.

## 1. Scope and exact tree

This review freezes `BLOCK-10` exactly as recorded at
`math-editor-2026-11-main-release-re-review-2.md:199-259`, carried through
`math-editor-2026-11-main-release-re-review-3.md:22-28`, and accepted by the
owner disposition at `docs/plan/regions/rm-01-region-model.md:198-229`. The
supported path is one ordinary numbered question with one complete
parenthesized A-D set whose labels mix case. A later occurrence of an already
selected label may appear in that option's text. The finite checklist is the
exact three-path vector, all 16 no-repeat case combinations, preservation of
the D-91 spacing and selected-repeat behavior, the scoped refusals and restored
fixtures, and failing-first/full-baseline/token/manifest evidence.

The worktree began on `owner-tool-integration` with no staged or untracked
file. `HEAD` was `323c9df`, one local checkpoint ahead of
`origin/owner-tool-integration` at the prior reviewed target `60f585d`. The
existing unstaged fix/handoff patch had exactly these 14 paths:

```text
AGENTS.md
deployed/admin_questions.php
docs/DEPLOYMENT.md
docs/DEVELOPER-GUIDE.md
docs/EDGE_CASES.md
docs/INVARIANTS.md
docs/STATUS.md
docs/plan/README.md
docs/plan/prompts/phase-map.md
docs/plan/regions/rm-01-region-model.md
ocr_helper.js
src/parser/core.js
tests/ocr-helper.js
tests/unit.js
```

The full binary delta from `60f585d`, including the committed review-3
checkpoint and this unstaged fix, had SHA-256
`188efd56a62ccd87600c3a2e626fc30b5f5bd8e14cc84cc7ee266a680449b657`.
No unrelated worktree change was found or attributed to the fix.

This review does not reopen closed `BLOCK-4` through `BLOCK-8`, withdrawn
`BLOCK-2`/`BLOCK-3`/`BLOCK-9`, or original `NOTE-13`. It does not dispose
inherited `BLOCK-1`. `origin/main` remains `4d68b28`, its merge base with
`HEAD` is `002483b`, the left/right count is `2 121`, and it is not an ancestor
of `HEAD`. That remains a separate undisposed release blocker.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-10` | **OPEN** | The named A-repeat vector, A-repeat matrix, no-repeat matrix, baselines, tokens, and manifest pass, but the same later-boundary defect remains for selected B, C, and D; each opposite-case repeat matrix passes only 15/16, and real Load silently moves the intended B prefix into Option A |
| `BLOCK-1` | **OPEN (inherited, not re-reviewed)** | Current `origin/main` is still not an ancestor of the release checkpoint |

No new finding ID is assigned. The failing probe changes only which selected
letter is repeated. The frozen supported precondition explicitly permits a
later repeat of an already selected label, and frozen criterion 3 requires
case-insensitive selected-repeat behavior for the complete mixed-case
parenthesized set. This is the same later-repeat-replaces-first-boundary defect,
not a substitute vector or an unrelated parser dimension.

## 3. Commands and observed evidence

Node was v26.13.0. All PHP suites and all seven deployed PHP lints used the
pre-existing static PHP 8.3.32 AArch64 CLI at
`$HOME/tmp/php83-review/php`; no prior result was trusted.

| Command or probe | Result |
|---|---|
| `git status --short --branch` | `owner-tool-integration` ahead of its remote by one; the 14 pre-existing unstaged paths above and no untracked file |
| `git rev-parse HEAD origin/owner-tool-integration origin/main` | `323c9df`, `60f585d`, `4d68b28` |
| `git merge-base HEAD origin/main` | `002483b` |
| `git rev-list --left-right --count origin/main...HEAD` | `2 121` |
| `git merge-base --is-ancestor origin/main HEAD` | exit 1; inherited `BLOCK-1` unchanged |
| `node tests/runner.js` | 68 PASS / 0 FAIL / 0 PENDING / 0 ORPHAN |
| `node tests/unit.js` | 171 PASS / 0 FAIL |
| `node tests/ocr-helper.js` | 34 PASS |
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
| `git diff --check 455ea54` and worktree `git diff --check` | PASS |
| deployment-manifest verifier | 20 hash-bearing rows / 0 line, byte, or hash mismatches |
| prior-target review-3 vector | core, exported helper, and real Load reproduce the wrong question/A boundary |
| current review-3 vector | core, exported helper, and real Load return the five exact values and no flags |
| exact original `BLOCK-10` vector | direct core, exported helper, and real Load regressions PASS |
| exact no-repeat case matrix | current core 16/16; exported helper 16/16 |
| opposite-case selected-A repeat matrix | prior core 15/16; current core 16/16; current exported helper 16/16 |
| parenthesized spacing adversary | current core and helper pass all 13 D-91 parenthesized spacing forms with an opposite-case selected-A repeat |
| opposite-case repeat matrix by selected letter | A 16/16; B 15/16; C 15/16; D 15/16 in both current core and exported helper |
| selected-B real Load adversary | wrong A/B boundary in queue and native form, with no advisory flag |
| restored expected-file object comparison | both files byte-identical to their authored pre-RM Git objects |
| eight RM01 input hashes | all match the handoff provenance table |

No live URL, database, MySQL operation, deployment, save, delete, cleanup, or
real browser session was used. The Load probes execute the actual browser
branch of root `ocr_helper.js` in a repository VM DOM harness, click its Load
handler, and inspect its storage, status, radios, and native form fields.

## 4. Frozen closure verification

### Criterion 1 - PASS

The original finding vector remains:

```text
1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta
```

Current `core.parseQuestion`, exported `helper.parseAll`, and real Load return
Question `Which is correct?`, A `Alpha (a) notation stays in option A`, B
`Bravo`, C `Charlie`, D `Delta`, and no flags. The direct regressions remain at
`tests/unit.js:200-209`, `tests/ocr-helper.js:135-175`, and
`tests/ocr-helper.js:458-482`.

The exact failure carried from review 3 is:

```text
1. Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta
```

At prior target `60f585d`, direct core, exported helper, and real Load all
return Question `Which is correct? (a) Alpha`, A
`notation stays in option A`, B `Bravo`, C `Charlie`, D `Delta`, and no flags.
The current three paths instead return the intended Question `Which is
correct?`, A `Alpha (A) notation stays in option A`, exact B-D, and no flags.

### Criterion 2 - PASS

All 16 uppercase/lowercase combinations of one unspaced parenthesized A-D set
produce the same clean five values and no flags in direct core and exported
helper probes. The direct core matrix at `tests/unit.js:240-250` also passes.

The closure fix's selected-A repeat matrix now passes 16/16 in direct core and
exported helper, compared with 15/16 at `60f585d`. The exact real Load vector
also passes. A closure-derived spacing challenge independently combines the
lowercase-A/uppercase-B-C-D case with an opposite-case A repeat across all 13
supported parenthesized D-91 forms, including internal spaces, optional dots,
and the multiline form; core and helper pass all 13.

### Criterion 3 - FAIL

The named existing controls pass:

- the 17-form uppercase/lowercase spacing matrix;
- the exact bare-label `A) ... A ) ... B)` selected boundary;
- the all-lowercase repeated `(a)` parenthesized set;
- the incomplete lowercase `(a)`-`(c)` refusal;
- the unlinked `PASSAGE` fallback;
- both restored CONFIRMED comprehension fixtures.

The required closure-focused adversarial probe changes only the selected letter
whose opposite-case repeat appears in its option text:

```text
1. Which is correct? (A) Alpha (b) Bravo (B) notation stays in option B (C) Charlie (D) Delta
```

This is one complete intended set `(A)`, `(b)`, `(C)`, `(D)`, with a later
case-insensitive repeat `(B)` inside Option B. D-91 requires the first selected
B boundary to remain authoritative. The pre-RM production helper at package
base `455ea54` returns:

```text
question  Which is correct?
A         Alpha
B         Bravo (B) notation stays in option B
C         Charlie
D         Delta
flags     none
```

The current core, exported helper, and real Load path instead return:

```text
question  Which is correct?
A         Alpha (b) Bravo
B         notation stays in option B
C         Charlie
D         Delta
flags     none
status    Question 1 of 1 (book number 1)
```

The native form therefore silently places the intended B label and `Bravo` in
Option A and starts Option B at the later `(B)`. Equivalent finite matrices
show the remaining boundary shape precisely:

| Selected repeated letter | Core | Exported helper | Sole failing intended-label mask |
|---|---:|---:|---|
| A | 16/16 | 16/16 | none |
| B | 15/16 | 15/16 | `AbCD` |
| C | 15/16 | 15/16 | `ABcD` |
| D | 15/16 | 15/16 | `ABCd` |

For each failure, the intended selected label is lowercase, every other
intended label is uppercase, and the later repeat is uppercase. The pre-RM
helper keeps the intended B, C, and D prefixes in their proper fields for all
three exact failure vectors.

The implementation cause is at `src/parser/core.js:838-856`. For the B vector,
`upperParenSet` becomes `ABCD` from intended `(A)`, later repeated `(B)`, and
intended `(C)`/`(D)`. `firstParenA` is uppercase, so the uppercase-only branch
at `:846-852` runs and removes intended lowercase `(b)`. The correct global
first-occurrence set in `allParenSet` is never allowed to decide. The new guard
protects only a lowercase first A; the same branch still promotes later B, C,
or D repeats.

The added tests assert only the selected-A composition at
`tests/unit.js:211-238`, `tests/ocr-helper.js:156-175`, and
`tests/ocr-helper.js:471-482`. The B/C/D adversary is directly derived from the
frozen selected-repeat criterion and remains inside the same supported one-set
path. Criterion 3 therefore fails and `BLOCK-10` cannot close.

### Criterion 4 - PASS as evidence

The fix added direct core, exported-helper, and real Load regressions for the
review-3 A vector. Executing that vector against prior target `60f585d` fails
through all three paths, while the current tests and independent probes pass.
The complete Node/PHP baseline is green.

Because production bytes changed, the deployment pins rotate consistently:

- `src/parser/core.js` reports `2.5.3` and is loaded as `?v=2.5.3`;
- `ocr_helper.js` requires core `2.5.3` and is loaded as `?v=2.4.4`;
- `deployed/admin_questions.php:1050-1051` loads core before helper;
- stale `2.5.2`/`2.4.3` tokens are absent from deployed PHP;
- all 20 hash-bearing deployment rows match current lines, LF bytes, and hashes.

Passing criterion 4 does not override the criterion 3 native-field boundary
failure.

## 5. Independent production measurements

The table uses `git diff --numstat 455ea54` for each path, exact base Git
objects, and current LF line/byte/SHA-256 measurements.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `src/parser/core.js` | 1432 / 49296 | +332 / -28 | 1736 / 60902 | `8b91ebe580b63379783812d0d7a4c69d00241e344a6d50fdeb139d9db3a5bae7` | pure canonical parser 2.5.3; site-root `src/` at `?v=2.5.3`; runner, unit, exported-helper, and real Load paths |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `dfa541361a5931a4d96cefb891b9f0d50f7db666c9689bd138ec281626f57b34` | thin queue/form adapter; site root at `?v=2.4.4`; real source/Load helper suite |
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `cae9d0850df23e7fa53ace99f4703d81ff5b7a799927caa7eae119d38cc0ae55` | native admin entry and narrow asset wiring; site root; token/wiring inspection and helper browser branch |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery and fraction paint; site root; marker and CBT suites |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | detail delivery and fraction paint; site root; stylesheet and PHP renderer evidence |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; PHP shared vectors |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; JS vectors and preview tests |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview/shape paint; served `src/`; real declaration tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | practice delivery retired from this release by owner disposition; not deployed; live file untouched; no release runtime path remains |

The exact production delta contains the same nine files as the handoff. Relative
to prior reviewed target `60f585d`, the fix changes only three production byte
streams: parser behavior in `src/parser/core.js`, the adapter's core pin in
`ocr_helper.js`, and the admin page's two cache tokens. The core has no DOM,
storage, form, network, or UI API; its browser global is only the module export.
The helper remains a 127-line adapter whose parser entry points are direct core
references at `ocr_helper.js:10-25`; it has no copied parser or Constant Text
path. No new module, entry-point responsibility exception, or copied-path test
claim was found.

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
current parser output, and no fixture differs from prior target `60f585d`.

Relevant authority remains unchanged:

- The owner chose `fix` for `BLOCK-10` without changing the requirement and
  scoped it to the frozen review-2 criteria plus the review-3 failing evidence.
- D-91 remains case-insensitive and keeps a later occurrence of any already
  selected letter inside that option's text.
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

**Verdict: BLOCK.** `BLOCK-10` remains open because frozen criterion 3 still
fails on supported selected B/C/D repeats through the production Load path. The
green A-specific fix, exact vectors, baseline, token, and manifest evidence do
not override silent native-field boundary changes for the other selected
letters. Inherited `BLOCK-1` also remains open and undisposed.

- **Commit readiness:** not ready for a release boundary.
- **Main-release readiness:** not ready; three supported mixed-case selected
  boundaries remain wrong, and current `origin/main` is not an ancestor.
- **Review status:** requested `BLOCK-10` re-review complete.
- **Finding lifecycle:** `BLOCK-10` already reached owner disposition, and the
  owner-authorized fix has now failed independent closure review on its frozen
  criterion. Another fix, risk acceptance, rejection, deferral, or requirement
  change cannot be inferred by this review session.
- **Recommended next action:** record the owner's next disposition for
  `BLOCK-10`. Do not run another fix session, commit the current fix, advance
  `main`, deploy, or perform a live paste/save before that decision. `BLOCK-1`
  still requires its separate owner release action.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md disposition math-editor-2026-11 main release BLOCK-10 from docs/plan/reviews/math-editor-2026-11-main-release-re-review-4.md
