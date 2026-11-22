# Main Release Re-review - `math-editor-2026-11`

- **Date:** 2026-11-22
- **Reviewer:** independent re-review session
- **Mode:** closure-focused first re-review
- **Original record:**
  [`math-editor-2026-11-main-release-review.md`](math-editor-2026-11-main-release-review.md)
- **Requested findings:** `BLOCK-1`, `BLOCK-4`, `BLOCK-5`, `BLOCK-6`,
  `BLOCK-7`, and `BLOCK-8`
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Fix commit:**
  `4cb4a914fa2f465f31df0e47ecd36fa4f26c0ba8`
- **Release-line merge:**
  `df82512609bd01e1a656cb0964f7f2a5eec6f7db`
- **Exact reviewed target:**
  `a3c45332a0640f3859b1393263756549be9139c4`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, or live
  record was changed.

## 1. Scope and exact tree

The frozen contracts are the six named findings in the original review, as
narrowed by its owner dispositions and restated in the RM01 fix note. This
re-review does not reopen withdrawn `BLOCK-2`, `BLOCK-3`, or `BLOCK-9`, broaden
an existing finding, or explore unrelated release dimensions.

The worktree began clean on `owner-tool-integration`; local and remote branch
tips both resolved to `a3c4533`. The reviewed production, test, fixture, and
tool paths are byte-identical between `4cb4a91` and `HEAD`. The later merge and
documentation commit add four owner-supplied root PHP snapshots as excluded
evidence and update three documents:

```text
git diff --quiet 4cb4a91..HEAD -- deployed ocr_helper.js src tests fixtures tools
exit 0

git diff --name-status 4cb4a91..HEAD
A  admin_questions.php
A  answer_details.php
A  cbt.php
A  cbt_practice.php
M  docs/DEPLOYMENT.md
M  docs/plan/README.md
M  docs/plan/regions/rm-01-region-model.md
```

The exact target is therefore appropriate for closure review, but its ancestry
claim is independently false. That keeps `BLOCK-1` open; it does not invalidate
the independent review of the other five fixes.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-1` | **OPEN** | `origin/main` is not an ancestor of the target; the merge used `002483b`, not current `origin/main` at `4d68b28` |
| `BLOCK-4` | **OPEN** | The exact inline-A-D instruction layout still puts the instruction in Option D |
| `BLOCK-5` | **OPEN** | The restored scoped expectations pass, but the fix regresses the frozen case-insensitive D-91 selected-boundary contract for a repeated lowercase `(a)` |
| `BLOCK-6` | **OPEN** | The real Load suite omits the exact inline `BLOCK-4` layout and therefore misses the reproduced production-path failure; the per-production-file table also omits the numeric `cbt_practice.php` deletion |
| `BLOCK-7` | **CLOSED (fixed)** | Both unequal-term fractions have a full-width bar, centered terms, and correct vertical layout on all three surfaces at desktop and narrow widths |
| `BLOCK-8` | **CLOSED (fixed)** | JS and PHP format/strip keep the exact crossed pair literal while all prior vectors remain green |

No new finding ID is needed. The failures above are direct failures of the
existing frozen criteria, not substitute defects. Original `NOTE-13` was not in
the requested re-review set and is not disposed here.

## 3. Commands and observed evidence

Node was v26.13.0. The documented PHP target was independently provisioned
outside the workspace as static PHP 8.3.32 AArch64; the handoff's removed local
binary and its results were not trusted.

| Command or probe | Result |
|---|---|
| `git status --short --branch` | clean `owner-tool-integration...origin/owner-tool-integration` before this record |
| `git rev-parse HEAD origin/owner-tool-integration origin/main` | `a3c4533`, `a3c4533`, `4d68b28` |
| `git merge-base HEAD origin/main` | `002483b` |
| `git rev-list --left-right --count origin/main...HEAD` | `2 116` |
| `git merge-base --is-ancestor origin/main HEAD` | exit 1 |
| `node tests/runner.js` | 68 PASS / 0 FAIL / 0 PENDING / 0 ORPHAN |
| `node tests/unit.js` | 164 PASS / 0 FAIL |
| `node tests/ocr-helper.js` | 27 PASS |
| `node tests/underline-toolbar.js` | 10 PASS |
| `node tests/question-preview.js` | 7 PASS |
| `node tests/math-tool.js` | 26 PASS |
| `node tests/render-markup.js` | 69 PASS |
| `node tools/extract-bank.js --check` | source, anchors, counts, and 7 hashes PASS |
| PHP 8.3.32 `tests/php-render.php` | 33 PASS |
| PHP 8.3.32 `tests/admin-question-store.php` | 8 PASS |
| PHP 8.3.32 `tests/cbt-question-order.php` | 14 PASS / 0 FAIL |
| PHP 8.3.32 `-l deployed/*.php` | 7/7 PASS |
| `node --check` on the three changed production JS files | PASS |
| `git diff --check` | PASS |
| deployment-manifest verifier | 20 hash-bearing rows / 0 line, byte, or hash mismatches |
| computed Chromium geometry at 1280px and 360px | PASS on preview, CBT, and answer-details rules for both required fractions |
| exact inline/vertical structural matrix | 5/6 pass; inline A-D plus the exact instruction fails |
| D-91 selected-boundary before/current probe | pre-fix passes; current lowercase repeated-`(a)` vector loses A-D |

No live URL, live database, MySQL operation, deploy, save, delete, or cleanup was
used. The Chromium check served repository files read-only from localhost and
used the real browser renderer.

## 4. Frozen finding verification

### `BLOCK-1` - OPEN

The owner-authorized option (a) permits carrying the supplied root copies as
evidence. It does not change the frozen requirement that the release target
contain current `main` history and make the ancestor command pass.

The merge commit has parents `4cb4a91` and `002483b`, while current
`origin/main` is `4d68b28` with parent `327fd56`. The two main-only commits are
net-zero at the tree level: `git diff --quiet 002483b..origin/main` exits 0.
They are nevertheless current `main` history, and neither is an ancestor of the
target:

```text
target                    a3c45332a0640f3859b1393263756549be9139c4
origin/main               4d68b2813d309a9d22f1c21c5bef21984d2170b3
merge base                002483b0dd73a53e541c00b4796e08ff9f957ea4
left/right count          2 116
ancestor command exit     1
```

This contradicts the claims at
`docs/plan/regions/rm-01-region-model.md:106-115` and
`docs/plan/README.md:283-290`. Frozen criteria 1 and 2 fail. Criterion 3 passes:
`session-ses_e35a.md` is absent from the exact target, and no other unrelated
session artifact was found. Criterion 4 is satisfied procedurally by this exact
target re-review, but it cannot close the failed ancestry requirements.

The four supplied root PHP snapshots are present and byte-identical to their
archived evidence sources. They remain absent from the deployment table:

| Root evidence copy | Lines / bytes | SHA-256 | Archived source |
|---|---:|---|---|
| `admin_questions.php` | 1046 / 62273 | `b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028` | `archive/live-sources/admin_questions-2026-10-31.php` |
| `answer_details.php` | 250 / 12103 | `680cfd697ba61b3c21e07c0f9e2cb4d6780ea2100ceae8e78fd4e492aa7368bf` | `archive/live-sources/answer_details-2026-11-02.php` |
| `cbt.php` | 1044 / 45990 | `9ca5f7b462fe4ec0931ab590645a83bbfa0c069891c14e223ebbbb2fce0f1435` | `archive/live-sources/cbt-2026-10-31.php` |
| `cbt_practice.php` | 868 / 36666 | `94588778186a2face2129eb149e36de4e79bbd6879b2ab635ac9506bf3f6f07d` | `archive/live-sources/cbt_practice-2026-10-31.php` |

### `BLOCK-4` - OPEN

The mid-stream orphan criterion passes. The fixture and real helper return
`[24,null,25]`; question 24 D is `old-d`; the orphan is `lump text` with
`plump/lamp/jump/limber`; and question 25 remains separate.

The six exact structural combinations do not all pass:

| A-D layout | Structural line | First Option D | Next `sectionInstruction` | Result |
|---|---|---|---|---|
| inline | `SECTION 2:` | `Four` | `SECTION 2:` | PASS |
| inline | `SECTION 2.` | `Four` | `SECTION 2.` | PASS |
| inline | `According to Matthew, choose the correct answer.` | `Four According to Matthew, choose the correct answer.` | empty | **FAIL** |
| vertical | `SECTION 2:` | `Four` | `SECTION 2:` | PASS |
| vertical | `SECTION 2.` | `Four` | `SECTION 2.` | PASS |
| vertical | `According to Matthew, choose the correct answer.` | `Four` | exact instruction | PASS |

The failure follows directly from `src/parser/core.js:213-268`.
`sawOption` becomes true only for a whole-line option at `:242-249`. An inline
A-D set stays part of the stem line, so the following instruction misses the
forward-binding condition at `:251-254` and is appended at `:268`.

The real browser helper source was then executed in a VM DOM, its real Load
button was clicked, and the native form/storage/status were inspected:

```text
queue nums          [1,2]
question 1 option D Four According to Matthew, choose the correct answer.
question 2 rubric   empty
status flag         option D contains section heading or instruction
correct radios      [false,false,false,false]
```

Criterion 3 passes because the fallback flag is emitted by
`src/parser/core.js:881-885`. Criterion 2 fails because the frozen contract
requires the line not to reach D in both inline and vertical layouts. Criterion
4 also remains incomplete: `tests/ocr-helper.js:338-383` covers the vertical
fixture but has no Load vector for the exact inline instruction layout.

### `BLOCK-5` - OPEN

The two expected files are restored byte-for-byte to `ff3896d^`:

```text
sample-comprehension-ambiguous.json  blob e448b1a4753b0bd8c3716337cc5267bc2ebd6207
sample-comprehension-incomplete.json blob 49271d9ae56557d0d8bef3a35949a2bd924e10e8
git diff --quiet ff3896d^..HEAD -- <both files>  exit 0
```

Both fixtures pass, their provenance remains authored rather than generated,
the complete lowercase spacing matrix passes, and the exact named
`A) ... A ) ... B)` selected-boundary regression passes.

The frozen criterion also forbids weakening D-91's case-insensitive
selected-boundary controls. The closure-derived vector below combines the
already required complete lowercase parenthesized set with a later selected
`(a)` marker inside Option A:

```text
1. Which is correct? (a) Alpha (a) notation stays in option A
   (b) Bravo (c) Charlie (d) Delta
```

At `ff3896d`, it produced A-D `Alpha (a) notation stays in option A`, `Bravo`,
`Charlie`, and `Delta`, with no flags. The exact reviewed target instead keeps
the whole option run in the question, leaves A-D empty, and emits all four
missing-option flags. `src/parser/core.js:815-819` requires the sequence of all
lowercase parenthesized matches to equal exactly `ABCD`; the internal repeated
`(a)` makes it `AABCD`, so the implementation removes every lowercase match.

This is a direct failure of frozen criterion 2, not a new option grammar. The
supported behavior is explicit at `INTENT.md:62-71` and `docs/SPEC.md:39-67`:
the label grammar is case-insensitive, and a later label-like occurrence of an
already selected letter remains option text. Criteria 1, 3, and 4 pass, but
criterion 2 does not.

### `BLOCK-6` - OPEN

Criterion 1 passes. `tests/ocr-helper.js` contains no local `function parseAll`,
calls the real exported `helper.parseAll`, and checks that the adapter delegates
the canonical entry points.

Criterion 2 does not pass. The VM harness executes the real `ocr_helper.js`,
clicks Load, and inspects `ocrQueue`, status, radios, and native fields. It covers
the four supplied region fixtures, the orphan fixture, one vertical heading
fixture, and the withdrawn `BLOCK-2`/`BLOCK-3` probes. It does not cover the
exact inline-instruction `BLOCK-4` layout, and that omitted production path
fails as shown above. A direct-path harness that misses an explicitly required
layout is not complete proof of that path.

Criterion 3 is also incomplete in the package handoff. Its production table at
`docs/plan/regions/rm-01-region-model.md:117-129` lists eight changed files, but
the exact base-to-target production delta contains nine. The owner-authorized
`deployed/cbt_practice.php` removal is mentioned only in prose at `:139-140`;
the per-file table omits its independently reproduced `+0/-886`, base
886-line/37246-byte measurement, final absence, retirement responsibility, and
deployment disposition. This review supplies that measurement below but cannot
rewrite the handoff that the frozen criterion requires.

Criteria 4 and 5 pass. The EC citation is corrected to EC-155-EC-159; all eight
fixture hashes match the provenance table; `real-ec20` and `real-ec20b` are
tracked copies; and all PHP suites plus all seven deployed PHP lints pass on PHP
8.3.32 at the exact target. The full baseline is green, but green existing tests
do not override the omitted and failing exact Load vector.

### `BLOCK-7` - CLOSED

All three real style sources use column flex, `align-items: stretch`, centered
terms, `vertical-align: middle`, and a 1px denominator top border:

- `src/question-preview.css:44-63`
- `deployed/cbt.php:522-524`
- `deployed/answer_details.php:168-170`

`tests/question-preview.js:239-289` parses the real declarations on every
surface and explicitly fails mutated `align-items: center`, `flex-start`, and
missing-border versions. It therefore detects the original denominator-only
rule rather than merely asserting that a border exists.

Computed Chromium geometry used the real `CBTText.render` DOM and each surface's
actual declarations. At both 1280px and 360px, all three surfaces produced the
same results:

| Marker | Fraction width | Numerator width | Denominator/bar width | Center delta | Layout |
|---|---:|---:|---:|---:|---|
| `<frac>123456/7</frac>` | 68.109375px | 68.109375px | 68.109375px | <=0.007813px | numerator above denominator |
| `<frac>3/765432</frac>` | 68.109375px | 68.109375px | 68.109375px | <=0.007813px | numerator above denominator |

The full 69-check JS and 33-vector PHP marker baselines pass. Every frozen
criterion is satisfied, so `BLOCK-7` closes.

### `BLOCK-8` - CLOSED

For the exact input `<u><sup>x</u></sup>`, both current real renderers return:

```text
format  &lt;u&gt;&lt;sup&gt;x&lt;/u&gt;&lt;/sup&gt;
strip   <u><sup>x</u></sup>
```

The shared authored table contains `crossed marker pairs stay literal`, and the
pre-fix JS object at `d20c939` independently reproduces the failing-first output:

```text
old format  <u><sup>x&lt;/u&gt;</sup></u>
old strip   x</u>
```

All 32 prior shared vectors remain unchanged and pass in JS and PHP, including
valid nesting, repeated-own-open, unmatched, uppercase, attributed, encoded,
and injection cases. The browser renderer still contains no `innerHTML`,
`outerHTML`, or `insertAdjacentHTML`. PHP lint passes. Every frozen criterion is
satisfied, so `BLOCK-8` closes.

## 5. Independent measurements and production paths

The table uses `git diff --numstat 455ea54..HEAD`, exact Git-object base counts,
and current LF line/byte/hash measurements. The deleted practice page is shown
because it is part of the exact production delta even though the owner removed
it from this release.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `src/parser/core.js` | 1432 / 49296 | +291 / -28 | 1695 / 58770 | `73cb7218c8800229cb5b4b3c386cd0d15eaf2eace7fdd353cc1873c3d3d01fd7` | pure canonical parser 2.5.0; site-root `src/`; runner, unit, and real-helper Load paths |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `e799abba51d7446b4301612de1d04bfa73b814e2e5926c153f868516a8451b91` | thin queue/form adapter; site root; real VM Load and helper suite |
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `574c0cb01aea52abc6c053ee3ac0d78e89ca1435b774b781ce7326cdea6f5f94` | native admin entry and narrow asset wiring; site root; token/wiring assertions |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery and fraction paint; site root; real style/browser and CBT tests |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | detail delivery and fraction paint; site root; real style/browser and PHP renderer paths |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; PHP shared-vector suite |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; JS vectors and computed browser DOM |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview/shape paint; served `src/`; declaration and computed-browser tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | owner-authorized retirement from this release; live file is left untouched and root supplied copy is evidence only |

There is no new production module or line-limit exception. Live-origin
measurements remain within the hard cap:

| Live-origin file | Add / delete | Result |
|---|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | PASS, additions <=100 |
| `deployed/cbt.php` | +78 / -37 | PASS, additions <=100 |
| `deployed/answer_details.php` | +21 / -3 | PASS, additions <=100 |
| `ocr_helper.js` | +51 / -47 | PASS, additions <=100 |

The deployment manifest has 20 hash-bearing rows and all 20 independently match
their current LF line counts, byte counts, and SHA-256 values. Production wiring
loads core `?v=2.5.0` before helper `?v=2.4.1`, preview CSS `?v=1.1.3`, and the
renderer `?v=2.3.4`; CBT also loads renderer `?v=2.3.4`. The modules remain
cohesive, and no copied parser orchestration remains in the helper suite.

## 6. Provenance, approvals, and exclusions

The package's eight recorded input hashes reproduce exactly. The two restored
expectations retain their original synthetic provenance and are byte-identical
to the pre-RM files. The owner-supplied `real-ec20` and `real-ec20b` inputs are
tracked; the two earlier hand transcriptions remain explicitly identified as
such rather than represented as archived originals.

The relevant owner authority is preserved exactly:

- `BLOCK-2`, `BLOCK-3`, and `BLOCK-9` are withdrawn.
- `BLOCK-4` is narrowed to the mid-stream orphan and trailing structural
  layouts; the exact inline instruction remains inside that retained scope.
- Option (a) authorizes carrying supplied root copies as evidence; it does not
  waive current-`main` ancestry or alter the frozen branch strategy.
- EC-97/EC-98 outrank global lowercase-parenthesized parsing, but the owner did
  not waive D-91's case-insensitive selected-boundary rule.
- D-109 keeps headings, instructions, shared stimuli, and E/F out of native
  fields. It does not authorize an instruction to remain in Option D with only
  a warning.

Excluded from production limits and deployment evidence:

- `archive/live-sources/*` and `archive/owner-tool-2026-11/*` evidence/history;
- root supplied `admin_questions.php`, `answer_details.php`, `cbt.php`, and
  `cbt_practice.php`, which are evidence only and must not be deployed;
- supplied root SQL snapshots and `deployed/sql/base-schema.working.sql`;
- generated `src/bookmarklet.js` and absent/untracked
  `src/bookmarklet.min.js`;
- fixtures and tests as non-production evidence artifacts;
- localhost HTTP/browser state and the PHP 8.3.32 CLI under `$HOME/tmp`;
- unavailable live `cbt_db.php`, `header.php`, `footer.php`, and
  `cbt_exam_attempts` artifacts.

Deployment, the owner's post-deployment browser re-paste, production English
Lexis operation, and every live save remain external. None is needed to
reproduce the four open local blockers, and none was marked passed here.

## 7. Verdict and next action

**Verdict: BLOCK.** `BLOCK-7` and `BLOCK-8` are closed. `BLOCK-1`, `BLOCK-4`,
`BLOCK-5`, and `BLOCK-6` remain open on their existing frozen criteria.

- **Commit readiness:** not ready for a release boundary.
- **Main-release readiness:** not ready; current `main` is not an ancestor, and
  two supported parser layouts still lose field ownership/option parsing.
- **Review status:** first re-review complete. The four open findings have now
  remained unresolved through the original review and one re-review.
- **Finding lifecycle:** under the two-round rule, the exact next action is owner
  disposition for `BLOCK-1`, `BLOCK-4`, `BLOCK-5`, and `BLOCK-6`. A re-review
  cannot authorize another fix round or change their requirements.
- **Recommended next action:** choose `fix`, `reject`, `accept risk`, `defer` to
  a named package, or `change requirement` for each of the four named findings
  through the disposition prompt. Do not fast-forward `main`, deploy, or start a
  dependent release action first.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md disposition math-editor-2026-11 main release BLOCK-1 BLOCK-4 BLOCK-5 BLOCK-6 from docs/plan/reviews/math-editor-2026-11-main-release-re-review.md
