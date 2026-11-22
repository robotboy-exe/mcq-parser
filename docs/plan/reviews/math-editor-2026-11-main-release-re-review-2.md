# Main Release Re-review 2 - `math-editor-2026-11`

- **Date:** 2026-11-22
- **Reviewer:** independent re-review session
- **Mode:** closure-focused second re-review
- **Requested findings:** `BLOCK-4`, `BLOCK-5`, and `BLOCK-6`
- **Original review:**
  [`math-editor-2026-11-main-release-review.md`](math-editor-2026-11-main-release-review.md)
- **First re-review:**
  [`math-editor-2026-11-main-release-re-review.md`](math-editor-2026-11-main-release-re-review.md)
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Prior reviewed target:**
  `a3c45332a0640f3859b1393263756549be9139c4`
- **Closure fix:**
  `533852b26dfc633822a33887fba9dd914ffa9dfb`
- **Exact reviewed target:**
  `533852b26dfc633822a33887fba9dd914ffa9dfb`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, browser,
  or live record was changed.

## 1. Scope and exact tree

The owner chose `fix` for `BLOCK-4`, `BLOCK-5`, and `BLOCK-6` after the first
re-review. The package restates their frozen criteria at
`docs/plan/regions/rm-01-region-model.md:139-148`. This review disposes only
those requested findings and runs the required adversarial probe near their
claimed fixes. It does not re-review withdrawn `BLOCK-2`, `BLOCK-3`, or
`BLOCK-9`, reopen closed `BLOCK-7`/`BLOCK-8`, or dispose inherited `BLOCK-1`.

The worktree began clean on `owner-tool-integration`. `HEAD` and
`origin/owner-tool-integration` both resolved to `533852b`. The target's parent
`a045b0d` adds only the immutable first re-review record; `533852b` contains the
closure fix. No reviewed path differed from that exact target.

`origin/main` remains at `4d68b28`; its merge base with the target is
`002483b`, the left/right count is `2 118`, and the ancestor command still
exits 1. That is the inherited, undisposed `BLOCK-1`, not a finding being
re-reviewed here.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-4` | **CLOSED (fixed)** | The orphan case, all six exact inline/vertical structural layouts, advisory fallback, direct core evidence, and real Load evidence pass |
| `BLOCK-5` | **CLOSED (fixed)** | Both authored expectations, the exact repeated-lowercase `(a)` regression, the named uniform-case spacing matrix, provenance, and complete baselines pass |
| `BLOCK-6` | **CLOSED (fixed)** | The suite uses real `helper.parseAll`, real helper Load covers the omitted inline layout, the nine-file handoff is complete, provenance reproduces, and PHP 8.3 evidence passes |
| `BLOCK-10` | **OPEN (new first-round finding)** | The required closure-derived adversarial probe finds a distinct mixed-case parenthesized D-91 regression that loses Options A and C on the production Load path |
| `BLOCK-1` | **OPEN (inherited, not re-reviewed)** | Current `origin/main` is still not an ancestor of the target |

`BLOCK-5` is not kept open with a substitute vector. Every concrete vector and
required artifact frozen in the accepted review, first re-review, and owner fix
passes. The new mixed-case composition is therefore assigned the next unused
finding ID, `BLOCK-10`, under the re-review disposition rule.

## 3. Commands and observed evidence

Node was v26.13.0. The package's old `$HOME/php83/php` path was absent on this
machine. A pre-existing static PHP 8.3.32 AArch64 CLI at
`$HOME/tmp/php83-review/php` was executed afresh; no prior result was trusted.

| Command or probe | Result |
|---|---|
| `git status --short --branch` | clean `owner-tool-integration...origin/owner-tool-integration` before this record |
| `git rev-parse HEAD origin/owner-tool-integration origin/main` | `533852b`, `533852b`, `4d68b28` |
| `git merge-base HEAD origin/main` | `002483b` |
| `git rev-list --left-right --count origin/main...HEAD` | `2 118` |
| `git merge-base --is-ancestor origin/main HEAD` | exit 1, inherited `BLOCK-1` unchanged |
| `node tests/runner.js` | 68 PASS / 0 FAIL / 0 PENDING / 0 ORPHAN |
| `node tests/unit.js` | 166 PASS / 0 FAIL |
| `node tests/ocr-helper.js` | 28 PASS |
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
| exact structural matrix | 6/6 inline/vertical combinations PASS |
| exact mid-stream orphan probe | `[24,null,25]`, Q24 D `old-d`, orphan and A-D exact |
| expected-file object comparison | both restored blobs byte-identical to `ff3896d^` |
| eight RM01 input hashes | all match the handoff provenance table |
| mixed-case D-91 base/current probe | base PASS; target loses A/C and emits two missing-option flags |
| mixed-case real Load/DOM probe | queue and native form lose A/C; visible status reports both missing |

No live URL, database, MySQL operation, deployment, save, delete, cleanup, or
browser session was used. The direct Load checks execute the real browser branch
of `ocr_helper.js` in the repository VM DOM harness and inspect its actual
storage, status, radios, and native fields.

## 4. Requested finding verification

### `BLOCK-4` - CLOSED

Criterion 1 passes. `region-midstream-orphan` returns `[24,null,25]`; question
24 D is `old-d`; the orphan is `lump text` with
`plump/lamp/jump/limber`; and question 25 remains separate. The runner and the
real Load vector both execute this case.

Criterion 2 passes for all six frozen combinations:

| A-D layout | Structural line | First D | Next `sectionInstruction` | Region | Result |
|---|---|---|---|---|---|
| inline | `SECTION 2:` | `Four` | exact line | heading | PASS |
| inline | `SECTION 2.` | `Four` | exact line | heading | PASS |
| inline | `According to Matthew, choose the correct answer.` | `Four` | exact line | instruction | PASS |
| vertical | `SECTION 2:` | `Four` | exact line | heading | PASS |
| vertical | `SECTION 2.` | `Four` | exact line | heading | PASS |
| vertical | `According to Matthew, choose the correct answer.` | `Four` | exact line | instruction | PASS |

`src/parser/core.js:155-163` recognizes a complete inline A-D sequence, and
`:246-266` routes the following heading/instruction through the same forward
ownership path as whole-line options. `tests/unit.js:155-186` asserts D, flags,
next-stem ownership, region kind, and exact range for all six combinations.

Criterion 3 passes. `tests/unit.js:137-153` proves that either exact structural
form still reaching D emits
`option D contains section heading or instruction`, while a clean option set
does not.

Criterion 4 passes. `tests/ocr-helper.js:377-414` executes the real Load path
for the orphan, vertical heading/instruction fixture, and the previously omitted
inline heading/instruction layout. The full fixture/unit/helper baselines keep
the numbering guard, keys, dividers, blank options, and all supplied region
fixtures green. Every frozen criterion passes, so `BLOCK-4` closes.

### `BLOCK-5` - CLOSED

Criterion 1 passes. The restored expected files have these current and
pre-RM Git object IDs:

```text
sample-comprehension-ambiguous.json  e448b1a4753b0bd8c3716337cc5267bc2ebd6207
sample-comprehension-incomplete.json 49271d9ae56557d0d8bef3a35949a2bd924e10e8
```

`git diff --quiet ff3896d^..HEAD` exits 0 for both. Their CONFIRMED authored
provenance, substantive expectations, flags, and `must_not` assertions remain
intact, and both fixtures pass.

Criterion 2's frozen concrete vectors pass. The complete uppercase and complete
lowercase spacing matrix at `tests/ocr-helper.js:76-99`, the exact
`A) ... A ) ... B)` selected boundary at `:101-121`, and the exact all-lowercase
repeated `(a)` vector at `:123-132` all pass. The core version of the repeated
lowercase vector also passes at `tests/unit.js:188-198`. A closure-derived
all-lowercase repeated `(b)` probe independently passes and keeps the repeated
marker in Option B.

Criteria 3 and 4 pass. The expected files are restored from authored Git
objects rather than generated output, provenance is unchanged, and the complete
68-fixture, 166-unit, and 28-helper baselines have no pending or orphan fixture.

Those are the finite vectors and evidence used to keep `BLOCK-5` open in the
first re-review and authorized in the owner fix. They now all pass, so
`BLOCK-5` closes. The separately reproduced mixed-case composition receives
`BLOCK-10` below rather than moving this finding's target again.

### `BLOCK-6` - CLOSED

Criterion 1 passes. `tests/ocr-helper.js` contains no local `function parseAll`.
Its parser vectors call the exported `helper.parseAll`, and `:453-459` asserts
that the export is real, that no copied orchestration exists in the suite, and
that its orphan output equals the canonical core output. The adapter remains a
127-line queue/form module; its parser entry points are direct core references at
`ocr_helper.js:10-25`.

Criterion 2 passes. `tests/ocr-helper.js:231-343` executes the real helper
source in the browser branch, clicks the real Load handler, and reads
`ocrQueue`, status, radios, and native fields. Its vectors cover all four
supplied region fixtures, queue walking, the exact orphan, vertical structural
layout, the formerly omitted inline structural layout, and the withdrawn
shared-stimulus/E-F probes. The inline test additionally verifies that both
structural lines govern the next queued stem and neither reaches a native field.

Criterion 3 passes. The handoff at
`docs/plan/regions/rm-01-region-model.md:156-180` now lists all nine production
files in the exact base-to-target delta. It includes the numeric
`deployed/cbt_practice.php` deletion, its 886-line/37246-byte base, final
absence, retirement responsibility, non-deployment disposition, and lack of a
remaining runtime path. Independent measurements reproduce every row below.

Criterion 4 passes. The package cites EC-155 through EC-159, distinguishes the
two early hand transcriptions from the later tracked owner copies, and records
all eight source hashes. Every hash independently matches.

Criterion 5 passes on static PHP 8.3.32 at the exact target: all three PHP suites
and all seven deployed PHP lints are green. The complete Node baseline, JS
syntax checks, manifest verifier, and diff check also pass. Every frozen
criterion passes, so `BLOCK-6` closes.

## 5. New finding

### `BLOCK-10` - Mixed-case parenthesized D-91 sets lose lowercase options

**Exact defect.** The required adversarial probe changes only B and D in the
now-passing repeated-lowercase vector to uppercase:

```text
1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta
```

The pre-RM shipping helper at package base `455ea54` returns Question
`Which is correct?`, A `Alpha (a) notation stays in option A`, B `Bravo`, C
`Charlie`, D `Delta`, and no flags. The exact target instead returns:

```text
question  Which is correct? (a) Alpha (a) notation stays in option A
A         empty
B         Bravo (c) Charlie
C         empty
D         Delta
flags     option A missing; option C missing
```

The real Load/DOM path writes those same empty A/C values to the native form and
shows both missing-option flags in status. This is a material regression on the
supported production path, not a warning-only difference.

`src/parser/core.js:828-840` builds `lowerParenSet` only from lowercase
parenthesized matches and requires that lowercase-only sequence to equal
`ABCD`. For the mixed-case input it is `AC`; the code removes all lowercase
matches and leaves only uppercase B/D. The current uniform-case matrix does not
exercise mixed case even though `INTENT.md:62-71`, `docs/SPEC.md:41-60`, and
the pre-RM helper make each A-D label case-insensitive.

**Supported operating preconditions.** A logged-in administrator uses the
shipping Add Question helper on one ordinary numbered question with one complete
parenthesized A-D set whose labels mix uppercase and lowercase. A later repeat
of an already selected label may occur in that option text. There is no passage
wall, stale asset, malformed set, or unsupported multi-section paste.

**Finite closure criteria.**

1. The exact vector above produces the five expected native text values and no
   flags through `core.parseQuestion`, exported `helper.parseAll`, and the real
   helper Load/DOM path.
2. All 16 uppercase/lowercase combinations of the exact unspaced
   parenthesized A-D set parse to the same clean A-D boundaries.
3. Preserve the existing all-uppercase/all-lowercase spacing matrix, selected
   repeat behavior, incomplete lowercase `(a)`-`(c)` refusal, and unlinked
   PASSAGE fallback; do not weaken either restored CONFIRMED fixture.
4. Add failing-first direct core, exported-helper, and real Load regressions;
   run the complete Node/PHP baseline and refresh the core/helper token and
   manifest evidence if either production byte stream changes.

**Required evidence.** The review's failing output, the 16-case matrix, exact
native form output, both restored fixture blobs, the D-91 spacing/repeat suite,
full baseline, and exact-target measurements.

**Non-goals/deferred.** Do not broaden parenthesized lowercase parsing outside a
complete ordered A-D set, change EC-97/EC-98, alter the region model or form
contract, add new label syntax, refactor parser code for style, deploy, or use a
live save.

This is a new first-round `BLOCK`: it is a directly reproduced material D-91
regression on the production path and therefore prevents release readiness.

## 6. Independent production measurements

The table uses `git diff --numstat 455ea54..533852b`, exact base Git objects,
and current LF line/byte/SHA-256 measurements.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `src/parser/core.js` | 1432 / 49296 | +313 / -28 | 1717 / 59759 | `ab7cfed7eb7561a0170bc96d642682e998992d638da3b632429f7d4c0c1eccb6` | pure canonical parser 2.5.1; site-root `src/` at `?v=2.5.1`; runner, unit, exported-helper, and real Load paths |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `50e6cd728bd40f27b01c19e817ba19f5619969571fe90aeae2a5b50009b53ece` | thin queue/form adapter; site root at `?v=2.4.2`; real source/Load helper suite |
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `721f7059287d5a6fbd6b9249d7043af069c096607d41473792068a09485b140a` | native admin entry and narrow asset wiring; site root; token/wiring assertions and helper browser branch |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery and fraction paint; site root; style, marker, and CBT suites |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | detail delivery and fraction paint; site root; style and PHP renderer evidence |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; PHP shared vectors |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; JS vectors and preview tests |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview/shape paint; served `src/`; real declaration tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | practice delivery retired from this release by owner disposition; not deployed; live file untouched; no runtime path remains |

The exact production delta contains nine files, matching the handoff. The core
contains no DOM, storage, form, or network API. The helper owns only adapter,
queue, and form behavior, and `deployed/admin_questions.php:1050-1051` loads
core `2.5.1` before helper `2.4.2`. No module-responsibility or deployment-path
exception is needed.

Live-origin additions remain within the hard cap:

| Live-origin file | Add / delete | Result |
|---|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | PASS, additions <=100 |
| `deployed/cbt.php` | +78 / -37 | PASS, additions <=100 |
| `deployed/answer_details.php` | +21 / -3 | PASS, additions <=100 |
| `ocr_helper.js` | +51 / -47 | PASS, additions <=100 |

The deployment manifest has 20 hash-bearing rows and all 20 match. No new
production module, line-limit exception, copied parser orchestration, or
unlisted production deletion remains.

## 7. Provenance, approvals, and exclusions

The eight RM01 input hashes reproduce exactly. The two restored comprehension
expectations remain byte-identical to their authored pre-RM Git objects. The
early `region-lowercase-stems` and `region-orphan-number` files remain identified
as hand transcriptions; `real-ec20` and `real-ec20b` remain tracked owner-copy
fixtures. No expectation was regenerated from current output.

Relevant authority is preserved:

- The owner authorized `fix` for `BLOCK-4`, `BLOCK-5`, and `BLOCK-6` against
  their frozen criteria.
- `BLOCK-2`, `BLOCK-3`, and `BLOCK-9` remain withdrawn and are not reopened.
- `BLOCK-7` and `BLOCK-8` remain closed; their unchanged baselines pass.
- `BLOCK-1` has no owner disposition and remains outside this requested
  re-review.
- EC-97/EC-98 still outrank global lowercase-parenthesized parsing. `BLOCK-10`
  requires no change to either rule.

Excluded from production limits and deployment evidence:

- `archive/live-sources/*` and `archive/owner-tool-2026-11/*` evidence/history;
- root supplied `admin_questions.php`, `answer_details.php`, `cbt.php`, and
  `cbt_practice.php`, which remain evidence only and are not deployment files;
- supplied root SQL snapshots and `deployed/sql/base-schema.working.sql`;
- generated `src/bookmarklet.js` and absent/untracked
  `src/bookmarklet.min.js`;
- fixtures and tests as non-production evidence artifacts;
- the pre-existing static PHP CLI under `$HOME/tmp/php83-review`;
- unavailable live-only includes, database state, browser state, and every live
  write path.

Original `NOTE-13` was not requested and is not disposed or broadened here.
Deployment, the owner's post-deployment browser re-paste, production English
Lexis operation, and every live save remain external.

## 8. Verdict and next action

**Verdict: BLOCK.** Requested `BLOCK-4`, `BLOCK-5`, and `BLOCK-6` are closed.
New first-round `BLOCK-10` is open, and inherited `BLOCK-1` remains open and
undisposed outside this re-review.

- **Commit readiness:** not ready for a release boundary.
- **Main-release readiness:** not ready; the production helper still loses two
  supported mixed-case options, and current `origin/main` is not an ancestor.
- **Review status:** second re-review complete for the three requested findings.
- **Finding lifecycle:** `BLOCK-10` is in its first review round and therefore
  routes directly to one fix session against the finite closure contract above.
  It does not yet route to owner disposition.
- **Recommended next action:** fix only `BLOCK-10`, then independently re-review
  it. `BLOCK-1` still requires a separate explicit owner disposition/release
  action before any commit, fast-forward, or deployment.

NEXT COMMAND: @docs/plan/prompts/fix-session.md fix math-editor-2026-11 main release BLOCK-10 from docs/plan/reviews/math-editor-2026-11-main-release-re-review-2.md
