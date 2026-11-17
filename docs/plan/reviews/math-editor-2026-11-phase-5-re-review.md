# Phase 5 Closure Re-review — `FIX-1`

- **Date:** 2026-11-17
- **Scope:** closure-focused re-review of `FIX-1` from
  [`math-editor-2026-11-phase-5.md`](math-editor-2026-11-phase-5.md), plus
  regression evidence for the frozen contract only. `NOTE-1`–`NOTE-6` were not
  reopened, broadened, or repurposed.
- **Reviewed state:** `HEAD` `0410ecbc65eaf1434de50a5ccf9adadaf217967b` plus the
  uncommitted worktree (23 modified files, 4 untracked), including the `FIX-1`
  fix note in the package.
- **Mode:** re-review. It verifies the six frozen closure criteria and settles
  the finding; it does not expand the accepted IDs.
- **Files written:** this record only. No product, test, package, coordinator,
  or prior review file was edited; no branch was created, switched, or moved;
  nothing was staged, committed, or deployed.

## 1. Disposition

**`FIX-1` — CLOSED (fixed).** Every frozen closure criterion passes on the real
production files, and the fix changed only the asset URLs named by the contract.

## 2. Frozen criteria and verification

| # | Criterion | Verification | Result |
|---|---|---|---|
| 1 | Admin carries a fresh key for both changed assets, each once | `deployed/admin_questions.php:694` `<link rel="stylesheet" href="src/question-preview.css?v=1.1.0">`; `:1048` `<script src="src/owner-tool/render.js?v=2.3.3"></script>`; exactly one occurrence of each path | PASS |
| 2 | `cbt_practice.php` fresh renderer key, page otherwise unchanged | `:616` `src/owner-tool/render.js?v=2.3.3`; `git diff -U0` shows one removed and one added line for that tag only; 886 lines / 37246 bytes (exactly one byte less than the pre-fix 37247) | PASS |
| 3 | `cbt.php` keeps `2.3.3`; admin keeps the `1.1.0` pair | `cbt.php:801` `?v=2.3.3`; `admin_questions.php:695` / `:1052` unchanged; asset assertions pass | PASS |
| 4 | Asset vector asserts every key, nothing weakened | `tests/math-tool.js:535-546` asserts the tokened admin preview link and renderer script, exactly-once counts, and the absence of both untokened URLs; `:569-575` asserts `cbt.php` and `cbt_practice.php` at `2.3.3`, one renderer reference each, and no `2.3.2c`. The pre-fix pages (reconstructed copies) fail all 6 new assertions | PASS |
| 5 | Docs and decision record | `DEPLOYMENT.md` row 52 bytes/hash and token note, row 61 token note, upload step 4, cache step 5, verification row 170, out-of-scope note; `INV-141`; `EC-140`; `DEVELOPER-GUIDE`; new `D-102` supersedes D-94's untokened clause | PASS |
| 6 | Baseline, caps, cleanliness | Full suites below; `php -l` 5/5; `git diff --check` clean; manifest 18/18; admin **+89/−80**, `cbt.php` **+74/−35**, `answer_details.php` **+21/−3**, `cbt_practice.php` **+20/−2** | PASS |

## 3. Adversarial probe derived from the closure contract

An asset-reference audit reads all four deployed pages and cross-checks every
`src`/`href` reference to a file MS01 changed against the seven pre-fix URLs.

```text
refs to MS01-changed assets=6 untokened=0 unchanged-key=1
key src/question-preview.css = ["v=1.1.0"]
key src/math-tool.css        = ["v=1.1.0"]
key src/owner-tool/render.js = ["v=2.3.3"]
key src/math-tool.js         = ["v=1.1.0"]
render.js key shared across consumers=true
```

Zero untokened references remain, and `render.js` uses one identical key on all
three consumers. The single `unchanged-key` hit is `cbt.php`, which is required
by criterion 3: its pre-MS01 key was `2.3.2g`, so `2.3.3` already busts its cache
and must not move again in this fix.

## 4. Regression evidence

The fix did not touch behavior: the production files outside the fix are
byte-identical to the originals reviewed in phase 5.

```text
216ebb51…  src/owner-tool/render.js     (unchanged)
7d93e107…  src/question-preview.css    (unchanged)
8e460c8a…  src/math-tool.js            (unchanged)
da630779…  src/math-tool.css           (unchanged)
f1152c54…  deployed/render.php         (unchanged)

node tests/runner.js                PASS 60 / FAIL 0 / PENDING 0
node tests/unit.js                  PASS 163
node tests/ocr-helper.js            PASS 11
node tests/underline-toolbar.js     PASS 10
node tests/question-preview.js      PASS 5
node tests/math-tool.js             PASS 25 (strengthened asset vectors)
node tests/render-markup.js         PASS 67
node tools/extract-bank.js --check  OK (7 hashes)
php tests/php-render.php            PASS 32
php tests/admin-question-store.php  PASS 8
php tests/cbt-question-order.php    PASS 11
php -l (5 changed/deployed PHP)     PASS
git diff --check                    clean
manifest                            18 rows / 0 mismatches
```

## 5. Measurements

Independently verified with `wc -l -c`, `sha256sum` (LF), `git diff --numstat`,
and `git diff --no-index --numstat` against `archive/live-sources/`:

| File | Package base delta | Final lines / LF bytes | Live-origin | Responsibility | Deployment / production-path evidence |
|---|---:|---:|---|---|---|
| `deployed/admin_questions.php` | 0 lines (two in-place tokens) | 1055 / 62662 | **+89/−80** | native form; loads helper, underline, renderer `?v=2.3.3`, preview `?v=1.1.0`, palette `?v=1.1.0` | site root; asset assertions read this file |
| `deployed/cbt_practice.php` | +1/−1 (one token) | 886 / 37246 | **+20/−2** | practice delivery; renderer `?v=2.3.3` | site root; asset assertions read this file |
| `deployed/cbt.php` | unchanged by the fix | 1083 / 46924 | **+74/−35** | exam delivery; inline shape rules; renderer `?v=2.3.3` | site root; asset assertions |
| `deployed/answer_details.php` | unchanged by the fix | 268 / 13644 | **+21/−3** | inline shape rules | site root; unaffected |
| `tests/math-tool.js` | +11 assertion lines | 577 / 23758 | not deployed | palette and asset harness | runs the real page files |
| `docs/DEPLOYMENT.md`, `INVARIANTS.md`, `EDGE_CASES.md`, `DEVELOPER-GUIDE.md`, `DECISIONS.md` | text only | — | not deployed | release and contract record | grep sweep |

No new module, no extraction, and no monolithic addition. No line-limit
exception exists or is needed.

## 6. Documentation consistency

The docs now state one rule: every consumer of a changed shared asset carries a
fresh key. `D-102` records why, and `D-94` remains untouched as the historical
decision it superseded. The only remaining `2.3.2c` mentions outside the fix
records are immutable history — `DECISIONS.md:1550` (D-94), the ME02 handoff
(`docs/plan/math-editor/me-02-release-and-handoff.md:96`), and the archived OT09
plan — none of which claims current page behavior. No page, test, or runbook
still describes the untokened admin tags or the stale `cbt_practice` key.

## 7. New findings

None. No new defect, missing evidence, or documentation error met the threshold
for a finding ID, and no regression was introduced by the fix.

Open items stay exactly as the accepted review recorded them: `NOTE-1`
(super-linear scan cost, residual), `NOTE-2` (duplicate accessible names),
`NOTE-3` (INV-141's old decision citation, now rewritten to D-94/D-102),
`NOTE-4` (fixture provenance, disclosed), `NOTE-5` (the reviewed tree is a chat
branch; the phase-boundary commit must reconcile the authoritative ref), and
`NOTE-6` (ASCII `2x2 matrix` label). None gates this closure.

## 8. Verdict and status

**PASS — `FIX-1` closed.** The package is commit-ready for phase 5 subject to
`NOTE-5` being reconciled in that commit and to owner authorization; this
re-review committed nothing. Excluded artifacts: `archive/`,
`deployed/sql/base-schema.working.sql`, `src/bookmarklet.js`, untracked
`src/bookmarklet.min.js`, `src/parser/core.js`, and the PHP CLI under `$HOME`.

Remaining external gate: the owner's desktop/Brave visual check of the five
editors and the two horizontal bars. This session ran no browser, MySQL,
staging, or live check.

**Recommended next action:** commit the phase-5 boundary (owner-authorized),
then archive the cycle only if the owner confirms it is complete.
