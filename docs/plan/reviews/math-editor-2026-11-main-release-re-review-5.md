# Main Release Re-review 5 - `math-editor-2026-11`

- **Date:** 2026-11-23
- **Reviewer:** independent re-review session
- **Mode:** closure-focused re-review of `BLOCK-10`
- **Finding record:**
  [`math-editor-2026-11-main-release-re-review-2.md`](math-editor-2026-11-main-release-re-review-2.md)
- **Prior closure review:**
  [`math-editor-2026-11-main-release-re-review-4.md`](math-editor-2026-11-main-release-re-review-4.md)
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Prior reviewed tree, now checkpointed:**
  `552ee5cdd2ce4044485bba6f606fa5c9aa3d972b`
- **Current checkpoint:**
  `552ee5cdd2ce4044485bba6f606fa5c9aa3d972b`
- **Exact reviewed candidate:** checkpoint `552ee5c` plus the pre-review
  15-file unstaged patch whose binary-diff SHA-256 is
  `f703ecd9cdeed0cfa75063076e5795205f73bf6f87a28df68110aedc4630a057`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, browser,
  or live record was changed.

## 1. Scope and exact tree

This review freezes `BLOCK-10` exactly as recorded at
`math-editor-2026-11-main-release-re-review-2.md:199-259`, carried through
`math-editor-2026-11-main-release-re-review-4.md:23-81`, and accepted without a
requirement change in the RM01 handoff. The supported path is one ordinary
numbered question with one complete parenthesized A-D set whose labels mix
case. A later occurrence of an already selected label may appear in that
option's text. The finite checklist is the exact three-path vector, all 16
no-repeat case combinations, preservation of the D-91 spacing and
selected-repeat behavior, the scoped refusals and restored fixtures, and
failing-first/full-baseline/token/manifest evidence.

The worktree began on `owner-tool-integration` with no staged or untracked
file. `HEAD` was `552ee5c`, two local checkpoints ahead of
`origin/owner-tool-integration` at `60f585d`. The existing unstaged
fix/handoff patch had exactly these 15 paths:

```text
AGENTS.md
README.md
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

No unrelated worktree change was found or attributed to the fix. Relative to
the checkpoint, only three production byte streams change: parser behavior in
`src/parser/core.js`, the adapter's core pin in `ocr_helper.js`, and the two
admin cache tokens in `deployed/admin_questions.php`. The remaining changes are
the directly related tests and handoff/current-facing documentation.

This review does not reopen closed `BLOCK-4` through `BLOCK-8`, withdrawn
`BLOCK-2`/`BLOCK-3`/`BLOCK-9`, or original `NOTE-13`. It does not re-review or
dispose inherited `BLOCK-1`. `origin/main` remains `4d68b28`, its merge base
with `HEAD` is `002483b`, the left/right count is `2 122`, and it is not an
ancestor of `HEAD`. That remains a separate undisposed release blocker.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-10` | **CLOSED** | The exact vector, all 16 no-repeat case combinations, D-91 controls, scoped refusals, restored fixtures, full baseline, tokens, and manifest pass; the selected-repeat matrix is 16/16 for A, B, C, and D through direct core, exported helper, and real Load, and a new spaced/dotted selected-C challenge also passes all three paths |
| `BLOCK-1` | **OPEN (inherited, not re-reviewed)** | Current `origin/main` is still not an ancestor of the release checkpoint |
| `NOTE-14` | **RECORDED (new, non-blocking)** | Root `AGENTS.md` still states the older 166-unit/28-helper counts while this exact candidate independently runs 173/36 |

`BLOCK-10` closes because every frozen closure criterion passes. `NOTE-14`
does not substitute another defect for that finding and does not affect parser,
deployment, commit, or release behavior. Overall release readiness remains
blocked only by inherited `BLOCK-1`.

## 3. Commands and observed evidence

Node was v26.13.0. All PHP suites and all seven deployed PHP lints used the
pre-existing static PHP 8.3.32 AArch64 CLI at
`$HOME/tmp/php83-review/php`; no prior result was trusted.

| Command or probe | Result |
|---|---|
| `git status --short --branch` | `owner-tool-integration` ahead of its remote by two; the 15 pre-existing unstaged paths above and no staged or untracked file |
| `git rev-parse HEAD origin/owner-tool-integration origin/main` | `552ee5c`, `60f585d`, `4d68b28` |
| `git merge-base HEAD origin/main` | `002483b` |
| `git rev-list --left-right --count origin/main...HEAD` | `2 122` |
| `git merge-base --is-ancestor origin/main HEAD` | exit 1; inherited `BLOCK-1` unchanged |
| `node tests/runner.js` | 68 PASS / 0 FAIL / 0 PENDING / 0 ORPHAN |
| `node tests/unit.js` | 173 PASS / 0 FAIL |
| `node tests/ocr-helper.js` | 36 PASS |
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
| prior-checkpoint selected-repeat matrix | direct core and exported helper: A 16/16, B 15/16, C 15/16, D 15/16 |
| prior-checkpoint selected-B real Load | wrong A/B boundary reproduced with no advisory flag |
| current exact original `BLOCK-10` vector | direct core, exported helper, and real Load regressions PASS |
| current no-repeat case matrix | direct core 16/16; exported helper 16/16; real Load 16/16 |
| current opposite-case repeat matrix | direct core, exported helper, and real Load each A/B/C/D 16/16 |
| spaced/dotted selected-C adversary | direct core, exported helper, and real Load return the five exact values and no flags |
| restored expected-file object comparison | both files byte-identical to their authored pre-RM Git objects |
| eight RM01 input hashes | all match the handoff provenance table |

No live URL, database, MySQL operation, deployment, save, delete, cleanup, or
real browser session was used. The Load probes execute the actual browser
branch of root `ocr_helper.js` in an isolated VM DOM, click its Load handler,
and inspect its storage, status, radios, queue, and native form fields.

## 4. Frozen closure verification

### Criterion 1 - PASS

The original finding vector remains:

```text
1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta
```

Current `core.parseQuestion`, exported `helper.parseAll`, and real Load return
Question `Which is correct?`, A `Alpha (a) notation stays in option A`, B
`Bravo`, C `Charlie`, D `Delta`, and no flags. The direct regressions remain at
`tests/unit.js:200-209`, `tests/ocr-helper.js:135-154`, and
`tests/ocr-helper.js:477-488`.

The exact selected-B failure carried from re-review 4 is:

```text
1. Which is correct? (A) Alpha (b) Bravo (B) notation stays in option B (C) Charlie (D) Delta
```

At checkpoint `552ee5c`, direct core, exported helper, and real Load all return
A `Alpha (b) Bravo`, B `notation stays in option B`, exact C/D, and no flags.
The current three paths instead return Question `Which is correct?`, A
`Alpha`, B `Bravo (B) notation stays in option B`, C `Charlie`, D `Delta`, and
no flags. The corresponding selected C and D vectors also pass all three
paths.

### Criterion 2 - PASS

All 16 uppercase/lowercase combinations of one unspaced parenthesized A-D set
produce the same clean five values and no flags in direct core, exported helper,
and real Load probes. The direct core regression remains at
`tests/unit.js:281-292`. This preserves the complete no-repeat mixed-case set
that originally passed only 2/16.

### Criterion 3 - PASS

The named controls all pass:

- the 17-form uppercase/lowercase D-91 spacing matrix;
- the exact bare-label `A) ... A ) ... B)` selected boundary;
- the all-lowercase repeated `(a)` parenthesized set;
- the incomplete lowercase `(a)`-`(c)` refusal;
- the unlinked `PASSAGE` fallback;
- both restored CONFIRMED comprehension fixtures.

The finite opposite-case selected-repeat matrix now passes 16/16 for each of A,
B, C, and D in direct core, exported helper, and real Load. At checkpoint
`552ee5c`, the independently executed direct core/helper matrix is A 16/16 but
B/C/D 15/16, and the real Load selected-B vector reproduces the silent native
field error. This establishes the failing-first evidence against the actual
prior implementation.

The required new adversarial probe combines only the frozen selected-repeat and
parenthesized spacing dimensions:

```text
1. Which is correct? ( A ) . Alpha ( B ) . Bravo ( c ) . Charlie ( C ) . notation stays in option C ( D ) . Delta
```

Direct core, exported helper, and real Load all return Question `Which is
correct?`, A `Alpha`, B `Bravo`, C
`Charlie ( C ) . notation stays in option C`, D `Delta`, and no flags. This
challenges the general rule on selected C with optional spaces and the dotted
parenthesized form rather than repeating an added test vector.

Implementation inspection confirms the behavioral cause at
`src/parser/core.js:828-856`. `allParenSet` keeps the first occurrence of each
letter. When that complete first-occurrence set is ordered A-D, the branch at
`:845-849` runs before the uppercase-only fallback and retains only those exact
parenthesized boundaries. Every later parenthesized repeat is therefore text,
regardless of its case or letter. The complete lowercase branch remains first,
the complete-uppercase/out-of-order-lowercase fallback remains after it, and
the incomplete-lowercase and unlinked-passage refusals remain intact.

### Criterion 4 - PASS

The new direct core, exported-helper, and real Load B/C/D regressions fail on
checkpoint `552ee5c` and pass on the current candidate. The complete Node/PHP
baseline is green.

Because production bytes changed, the deployment pins rotate consistently:

- `src/parser/core.js` reports `2.5.4` and is loaded as `?v=2.5.4`;
- `ocr_helper.js` requires core `2.5.4` and is loaded as `?v=2.4.5`;
- `deployed/admin_questions.php:1050-1051` loads core before helper;
- stale `2.5.3`/`2.4.4` production tokens are absent from deployed PHP;
- all 20 hash-bearing deployment rows match current lines, LF bytes, and hashes.

Every frozen criterion passes, so `BLOCK-10` closes.

## 5. New non-blocking finding

### `NOTE-14` - Root agent instructions retain old test counts

`AGENTS.md:29` calls its counts current but still states 166 unit checks and 28
helper checks. This exact candidate independently runs 173 unit checks and 36
helper checks, matching the current RM01 handoff and status evidence. The stale
numbers can mislead later baseline comparisons, but they do not weaken a test,
change production behavior, or affect any `BLOCK-10` closure criterion.

This is a documentation-only note. Correct the two counts in the next
authorized current-facing documentation update; no product fix or re-review is
required for this note.

## 6. Independent production measurements

The table uses `git diff --numstat 455ea54` for each path, exact base Git
objects, and current LF line/byte/SHA-256 measurements.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `src/parser/core.js` | 1432 / 49296 | +329 / -28 | 1733 / 60722 | `c9ac52b3a715a1d1e082cc0f5f73090e17bd4375ca1635ee017ff118dc19a3ae` | pure canonical parser 2.5.4; site-root `src/` at `?v=2.5.4`; runner, unit, exported-helper, and real Load paths |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `b83835b798c3d650dfe590892adc0a6058180eb3ec86c7dcc76765de0d49b6f7` | thin queue/form adapter; site root at `?v=2.4.5`; real source/Load helper suite |
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `0b9eb5b2673b72ffed7c03b9737f4c60fbc42118f63225251bdaada3d731ae3b` | native admin entry and narrow asset wiring; site root; token/wiring inspection and helper browser branch |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery and fraction paint; site root; marker and CBT suites |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | detail delivery and fraction paint; site root; stylesheet and PHP renderer evidence |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; PHP shared vectors |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; JS vectors and preview tests |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview/shape paint; served `src/`; real declaration tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | practice delivery retired from this release by owner disposition; not deployed; live file untouched; no release runtime path remains |

The exact production delta contains the same nine files as the handoff. Relative
to checkpoint `552ee5c`, the fix changes only the three production streams
identified in section 1. The core contains no DOM, storage, form, network, or
Constant Text API. The helper remains a 127-line adapter whose parser entry
points are direct core references at `ocr_helper.js:10-25`; it has no copied
parser or Constant Text path. No new module, entry-point responsibility
exception, or copied-path test claim was found.

Live-origin additions remain within the hard cap:

| Live-origin file | Add / delete | Result |
|---|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | PASS, additions <=100 |
| `deployed/cbt.php` | +78 / -37 | PASS, additions <=100 |
| `deployed/answer_details.php` | +21 / -3 | PASS, additions <=100 |
| `ocr_helper.js` | +51 / -47 | PASS, additions <=100 |

The deployment manifest has 20 hash-bearing rows and all 20 match. No line-limit
exception or Gate 1 owner approval is required.

## 7. Provenance, approvals, and exclusions

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
`real-ec20b` remain tracked owner copies. No expected value was regenerated
from current parser output, and no fixture differs from checkpoint `552ee5c`.

Relevant authority remains unchanged:

- The owner retained `BLOCK-10`'s frozen closure contract and requested the
  general first-occurrence rule rather than another per-letter guard.
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

## 8. Verdict and next action

**Verdict: BLOCK, inherited `BLOCK-1` only.** The requested `BLOCK-10` closure
passes and that finding is closed. `NOTE-14` is non-blocking. The release still
cannot advance because current `origin/main` is not an ancestor and `BLOCK-1`
has no owner disposition.

- **Commit readiness:** not ready for a release boundary because `BLOCK-1`
  remains open.
- **Main-release readiness:** not ready; `BLOCK-10` is closed, but the reviewed
  fast-forward-only release rule still cannot be followed.
- **Review status:** requested `BLOCK-10` re-review complete.
- **Finding lifecycle:** `BLOCK-10` closes on its frozen checklist. `NOTE-14`
  needs only a later documentation correction. `BLOCK-1` already survived the
  original review and first re-review, so its exact next action remains owner
  disposition: `fix`, `reject`, `accept risk`, `defer` to a named package, or
  `change requirement`.
- **Recommended next action:** record the owner's disposition for `BLOCK-1`.
  Do not commit this release boundary, advance `main`, deploy, or perform a live
  paste/save before that decision.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md disposition math-editor-2026-11 main release BLOCK-1 from docs/plan/reviews/math-editor-2026-11-main-release-re-review-5.md
