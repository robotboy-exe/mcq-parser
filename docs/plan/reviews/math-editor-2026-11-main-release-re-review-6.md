# Main Release Re-review 6 - `math-editor-2026-11`

- **Date:** 2026-11-23
- **Reviewer:** independent re-review session
- **Mode:** closure-focused re-review of `BLOCK-1`
- **Finding record:**
  [`math-editor-2026-11-main-release-review.md`](math-editor-2026-11-main-release-review.md)
- **Prior review and requested source:**
  [`math-editor-2026-11-main-release-re-review-5.md`](math-editor-2026-11-main-release-re-review-5.md)
- **Owner disposition and fix handoff:**
  [`../regions/rm-01-region-model.md`](../regions/rm-01-region-model.md)
- **Original package base:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Prior reviewed candidate:**
  `36082298c161a61d2eec0656025f79f4420835da`
- **Exact reviewed merge target:**
  `ea872d0fa7653cee72c40fce08b82ad7d2ce67d6`
- **Current branch tip:**
  `140b0211f4c7babbc1049682027ef256cca030cd`
- **Files written:** this re-review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, browser,
  or live record was changed.

## 1. Scope and exact tree

This review freezes `BLOCK-1` exactly as recorded at
`math-editor-2026-11-main-release-review.md:407-436` and retained by the owner
disposition at `../regions/rm-01-region-model.md:423-465`:

1. Establish an owner-authorized target containing current `main`, every
   accepted product fix, and the integration history without rebase, force-push,
   or history rewriting.
2. Make `git merge-base --is-ancestor main <target>` succeed.
3. Keep `session-ses_e35a.md` and every other unrelated artifact out of that
   exact target.
4. Re-run the release review against the exact final target rather than an
   inferred future merge.

The owner-authorized implementation is also frozen: merge current
`origin/main` at `4d68b28` into the mature `owner-tool-integration` line using
one `--no-ff` merge commit, keep both histories and the accepted release bytes,
then run the full Node/PHP baseline and independently re-review that merge.

The worktree began clean on `owner-tool-integration` at `140b021`, equal to its
local and authenticated remote-tracking ref. The exact target remains the merge
commit `ea872d0`; current tip `140b021` is its one docs-only child. The child
changes only `AGENTS.md`, root `README.md`, `docs/STATUS.md`, the coordinator,
the phase map, and the RM01 handoff. These paths are byte-identical between the
exact target and current tip:

```text
deployed/
fixtures/
ocr_helper.js
src/
tests/
tools/
docs/DEPLOYMENT.md
```

The executable baseline run in this clean worktree therefore executes the exact
target's production, test, fixture, and tool bytes. All commit-graph, tree,
measurement, and artifact checks below name `ea872d0` directly. This review does
not silently redefine `140b021` as the frozen merge target.

This re-review does not reopen withdrawn `BLOCK-2`, `BLOCK-3`, or `BLOCK-9`,
closed `BLOCK-4` through `BLOCK-8`, closed `BLOCK-10`, original `NOTE-13`, or
corrected `NOTE-14`.

## 2. Disposition summary

| Finding | Disposition | Reason |
|---|---|---|
| `BLOCK-1` | **CLOSED** | The exact authorized merge has the reviewed candidate and current `main` as its two parents, contains both histories without another bundled history, has the exact reviewed candidate tree, makes current `main` an ancestor, contains no merge-added artifact, and passes the complete baseline |
| `NOTE-15` | **RECORDED (new, non-blocking)** | Current-facing workflow text says the merge was not pushed or is not yet run, while the authenticated remote is already at the docs child `140b021`; several lower coordinator sections also still prescribe the completed `BLOCK-10` review |

`BLOCK-1` closes because every frozen criterion passes. `NOTE-15` is a
bookkeeping inconsistency and neither changes the exact target nor blocks its
fast-forward ancestry.

## 3. Commands and observed evidence

Node was v26.13.0. All PHP suites and all seven deployed PHP lints used the
pre-existing static PHP 8.3.32 AArch64 CLI at
`$HOME/tmp/php83-review/php`; no handoff result was trusted.

| Command or probe | Result |
|---|---|
| `git status --porcelain=v2 --branch` before this record | clean `owner-tool-integration` at `140b021`, tracking `origin/owner-tool-integration` with `+0 -0` |
| `git ls-remote origin refs/heads/main refs/heads/owner-tool-integration` | authenticated remote `main=4d68b28`; `owner-tool-integration=140b021` |
| `git rev-list --parents -n 1 ea872d0` | exact parents `3608229` and `4d68b28` |
| pre-merge `git merge-base 4d68b28 3608229` | `002483b` |
| pre-merge `git rev-list --left-right --count 4d68b28...3608229` | `2 123` |
| post-merge `git rev-list --left-right --count 4d68b28...ea872d0` | `0 124` |
| `git merge-base --is-ancestor 4d68b28 ea872d0` | exit 0 |
| target tree IDs for `3608229` and `ea872d0` | both `fe1358504658a0002789b29671c4c6b9c70bec10` |
| main tree IDs for `002483b` and `4d68b28` | both `25a207a63945f2b25f6a23f0b1657b980b981013` |
| `git diff --raw 3608229 ea872d0` | empty; no content, mode, rename, or deletion change |
| `git diff --raw 002483b 4d68b28` | empty; the two newer main commits are tree-net-zero |
| parent-loss probes | `git rev-list 3608229 --not ea872d0` and the equivalent `4d68b28` probe are both empty |
| adversarial extra-history probe | `git rev-list ea872d0 ^3608229 ^4d68b28` returns exactly `ea872d0`, so the target adds only the merge commit to the union of its parents |
| exact-target artifact probe | `session-ses_e35a.md`, `session-*`, and `src/bookmarklet.min.js` are absent; target tree equals the already reviewed candidate tree |
| `git diff --quiet ea872d0..140b021 -- deployed ocr_helper.js src tests fixtures tools` | exit 0; current executable/test tree equals the exact target |
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
| `git diff --check 455ea54..ea872d0` and `3608229..ea872d0` | PASS |
| deployment-manifest verifier | 20 hash-bearing rows / 0 line, byte, or hash mismatches |
| exact-object production measurement | all nine package production paths match the table in section 6 |

No live URL, browser, database, MySQL operation, deployment, save, delete, or
cleanup was used. The frozen fix changes no product or test byte, so it does not
require a new browser, staging, or live acceptance dimension.

## 4. Frozen closure and acceptance coverage

### Criterion 1 - PASS

The owner disposition explicitly keeps `owner-tool-integration` as the mature,
authoritative release line and authorizes one merge of current `origin/main`
`4d68b28` without losing or regressing either side.

`ea872d0` has exactly the authorized topology:

```text
ea872d0
|- 3608229  reviewed release candidate and integration history
`- 4d68b28  frozen current origin/main
```

Both parents are ancestors. The adversarial set-difference probe finds no commit
from either parent missing from the target and finds only `ea872d0` beyond the
union of those parent histories. This independently rejects a squash, rebase,
substituted parent, hidden third history, or dropped integration commit.

The merge tree ID is exactly its first parent's tree ID. Thus every accepted
product fix remains byte-for-byte the reviewed release content, and the
tree-net-zero main commits contribute history without overriding a file.

### Criterion 2 - PASS

Before the fix, `4d68b28...3608229` was `2 123`, its merge base was `002483b`,
and the ancestor command failed. Against exact target `ea872d0`, the count is
`0 124`, the merge base is `4d68b28`, and:

```text
git merge-base --is-ancestor 4d68b28 ea872d0
exit 0
```

Current authenticated remote `main` still resolves to that exact frozen commit.
It can therefore be advanced to the reviewed release line by fast-forward; no
history rewrite is needed.

### Criterion 3 - PASS

`git diff --raw 3608229 ea872d0` is empty, so the merge introduces no path,
content, mode, rename, or deletion. `session-ses_e35a.md` is absent from the
exact target, as are other `session-*` paths and the untracked-only
`src/bookmarklet.min.js`. Because the target tree is exactly the prior reviewed
candidate tree, it cannot contain a new merge-bundled artifact.

### Criterion 4 - PASS

This record reviews exact commit `ea872d0`, not a hypothetical merge. It checks
its parents, pre/post ancestry, complete tree identity, artifact set, release
measurements, production responsibilities, deployment paths, direct-path tests,
fixture provenance, manifest, and full Node/PHP baseline.

All four frozen criteria pass, so `BLOCK-1` closes.

## 5. New non-blocking finding

### `NOTE-15` - Current-facing workflow and remote-state text is stale

The authenticated remote currently resolves `owner-tool-integration` to
`140b021`, a descendant containing `ea872d0` and its docs-only fix handoff.
Current-facing records do not consistently report that state:

- `docs/plan/regions/rm-01-region-model.md:4` says there was no push of the
  merge.
- `docs/plan/README.md:300` says the authorized `BLOCK-1` fix has not yet run in
  the status cell, while the same row's external-gate cell says it is
  implemented.
- `docs/plan/README.md:343-350` still describes the old branch tip and failed
  2026-11-22 merge as the current branch strategy.
- `docs/plan/README.md:425-466` still says `BLOCK-10` needs re-review and
  `BLOCK-1` has no disposition, and its terminal command requests the already
  completed fifth re-review.

The local remote-ref reflog shows `3608229` was previously pushed and
`140b021` arrived by a local `pull --ff-only`; the authenticated remote query
confirms `140b021`. The repository does not record whether the later remote
update had separate owner authorization, so this review does not infer or
rewrite that decision. It records only the factual mismatch.

This is non-blocking because remote `main` remains untouched at `4d68b28`, the
remote integration ref contains rather than drops its prior history, and the
exact reviewed merge/tree remains unchanged. Correct these current-facing
sections in the next authorized closure bookkeeping update. No product fix or
another re-review is required for this note.

## 6. Independent production measurements

The table uses exact Git objects at original package base `455ea54` and target
`ea872d0`, `git diff --numstat`, and LF line/byte/SHA-256 measurements. The
merge itself has an empty production delta from `3608229`.

| Production file | Base lines / bytes | Add / delete | Final lines / bytes | Final SHA-256 | Responsibility, deployment, and direct evidence |
|---|---:|---:|---:|---|---|
| `deployed/admin_questions.php` | 1056 / 62818 | +4 / -3 | 1057 / 62877 | `0b9eb5b2673b72ffed7c03b9737f4c60fbc42118f63225251bdaada3d731ae3b` | native authenticated admin entry and narrow asset wiring; site root; helper browser branch, store tests, token and source inspection |
| `deployed/cbt.php` | 1085 / 47092 | +2 / -2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery, subject grouping/alias, and shape paint; site root; real ordering/wiring and renderer tests |
| `deployed/answer_details.php` | 268 / 13671 | +1 / -1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | answer-detail delivery and shape paint; site root; PHP renderer and source/style evidence |
| `deployed/render.php` | 248 / 8161 | +64 / -1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | server six-marker renderer; site root; real PHP shared vectors |
| `ocr_helper.js` | 160 / 6284 | +40 / -73 | 127 / 4917 | `b83835b798c3d650dfe590892adc0a6058180eb3ec86c7dcc76765de0d49b6f7` | thin queue/form adapter over the canonical core; site root; exported-helper and real Load/DOM suite |
| `src/parser/core.js` | 1432 / 49296 | +329 / -28 | 1733 / 60722 | `c9ac52b3a715a1d1e082cc0f5f73090e17bd4375ca1635ee017ff118dc19a3ae` | pure canonical parser 2.5.4; site-root `src/`; runner, unit, exported-helper, and real Load paths |
| `src/owner-tool/render.js` | 408 / 13764 | +59 / -18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser six-marker renderer; served `src/owner-tool/`; real JS vectors and preview tests |
| `src/question-preview.css` | 117 / 2069 | +1 / -1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview and shape paint; served `src/`; real declaration/parity tests |
| `deployed/cbt_practice.php` | 886 / 37246 | +0 / -886 | absent | - | retired from this release by owner disposition; not deployed; live file remains untouched |

The nine paths above are the complete production delta under `deployed/`,
`ocr_helper.js`, and `src/` from `455ea54` to `ea872d0`. The merge adds no new
module, responsibility, wiring exception, or copied-path test claim. Core
remains pure, helper remains the 127-line adapter, and the admin page loads core
`?v=2.5.4` before helper `?v=2.4.5`.

Live-origin additions remain inside the hard cap:

| Live-origin file | Add / delete | Result |
|---|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | PASS, additions <=100 |
| `deployed/cbt.php` | +78 / -37 | PASS, additions <=100 |
| `deployed/answer_details.php` | +21 / -3 | PASS, additions <=100 |
| `ocr_helper.js` | +51 / -47 | PASS, additions <=100 |
| retired `deployed/cbt_practice.php` against its live snapshot | +0 / -868 | PASS, absent from release |

The deployment manifest has 20 hash-bearing rows and all 20 match current lines,
LF bytes, and hashes. No Gate 1 line-limit exception or owner approval is
required.

## 7. Provenance, approvals, and exclusions

The two restored expected files remain byte-identical to their authored pre-RM
Git objects:

```text
sample-comprehension-ambiguous.json  e448b1a4753b0bd8c3716337cc5267bc2ebd6207
sample-comprehension-incomplete.json 49271d9ae56557d0d8bef3a35949a2bd924e10e8
```

The eight RM01 input hashes independently reproduce the handoff:

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

The owner approval is exact: `fix` `BLOCK-1` by merging `4d68b28` into the
authoritative release line without loss or rewrite. It grants no deployment,
live action, destructive operation, or line-limit exception.

Excluded from production limits and deployment evidence:

- `archive/live-sources/*` and `archive/owner-tool-2026-11/*` evidence/history;
- root supplied `admin_questions.php`, `answer_details.php`, `cbt.php`, and
  `cbt_practice.php`, which remain evidence only and are not deployment files;
- supplied SQL snapshots and `deployed/sql/base-schema.working.sql`;
- generated `src/bookmarklet.js` and absent/untracked
  `src/bookmarklet.min.js`;
- fixtures, tests, and review/package documents as non-production evidence;
- the static PHP CLI under `$HOME/tmp/php83-review` and transient process state;
- unavailable live includes, live database/browser state, and every live write
  path.

Deployment, the owner's post-deployment browser re-paste, production English
Lexis operation, and every live save remain external and unauthorized.

## 8. Verdict and next action

**Verdict: PASS WITH ACCEPTED FINDINGS.** `BLOCK-1` is closed. Every original
main-release blocker is now closed or withdrawn, and `NOTE-15` is non-blocking
current-facing documentation cleanup.

- **Commit readiness:** ready. The exact release content is committed at the
  reviewed merge; this session changes only its review record.
- **Main-release readiness:** ready for an explicitly owner-authorized
  fast-forward. Remote `main` at `4d68b28` is an ancestor of the reviewed
  release line; no force-push, rebase, or merge on `main` is required.
- **Review status:** requested `BLOCK-1` re-review complete; the finding closes
  on all four frozen criteria and needs no further review round.
- **Residual work:** correct `NOTE-15` while recording closure in current-facing
  status, then commit the review boundary. Deployment and live checks remain
  separate owner actions.
- **Recommended next action:** record `BLOCK-1` closed in RM01 and the
  coordinator, correct `NOTE-15`, commit the review boundary, and only then
  perform the separately owner-authorized `main` fast-forward. Do not deploy.

NEXT COMMAND: Record BLOCK-1 closure in RM01 and the coordinator, correct NOTE-15, commit the reviewed release boundary, and fast-forward main; do not deploy
