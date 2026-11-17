# ME02 — Release, Evidence, and Handoff

- **Status:** done; implementation, handoff, rigorous review, and owner-accepted Brave/Android recheck recorded
- **Depends on:** ME01 review settled (light review at this Gate 1)
- **Blocks:** cycle close
- **External gate:** satisfied by owner acceptance on 2026-11-17; the 2026-11-14
  deployment-time artifact deferral still governs live deployment
- **Intent:** [`docs/24-question-underline-and-math.md`](../../24-question-underline-and-math.md)
  as amended for this cycle

## Goal

Turn the ME01 delta into a reviewable release: version and cache-busting
tokens, decisions, invariants and edge cases, the deployment manifest and
developer guide with fresh measurements, browser evidence, and a rigorous
review.

## Work

1. Set the asset token for `src/math-tool.js` and `src/math-tool.css`
   (`?v=1.0.0` unless a later consistent token is chosen) and update every page
   that references a changed asset.
2. Record the planned ME01 decisions as D-92/D-93 and any additional release
   decision from D-94 onward: the curated symbol set and insertion approach,
   the editor-side byte counter as advisory, and the dropped case-insensitive
   `<U>` requirement. D-91 belongs to ST01 `FIX-1`. No externalize-first
   approval is expected: `admin_questions.php` should stay at +89.
3. Update `docs/INVARIANTS.md` and `docs/EDGE_CASES.md` for the palette, the
   byte counter, and the unchanged exact-tag boundary.
4. Refresh `docs/DEPLOYMENT.md` and `docs/DEVELOPER-GUIDE.md`: new file row,
   hashes, cache-busting tokens, upload order, smoke checks, and the byte-limit
   limitation. Keep the 2026-11-14 live-artifact stop conditions intact.
5. Re-run every suite, `php -l`, and the bank extractor; record exact counts.
6. Run the desktop Chromium and owner Brave/Android checks on the final tree
   without a live write.
7. Run the rigorous release review and record it under `docs/plan/reviews/`.

## Acceptance

| Check | Expected |
|---|---|
| Node/PHP suites | All PASS; exact counts recorded, including the new `tests/math-tool.js` |
| Externalize-first | Every production file measured; `admin_questions.php` stays within the 100-addition cap (expected +89) |
| Tokens | Every page loads the current token for each changed asset |
| Manifest | File rows, lines/bytes, SHA-256, upload order, and smoke checks match the tree |
| Guide | Architecture map, state rules, and testing commands match the code |
| Docs | Status, map, package rows, invariants, edge cases, and decisions agree |
| Browser | Desktop Chromium and owner Brave/Android checks recorded with versions and outcomes |
| Live safety | No production deploy, no live write, cleanup owner-only |
| Review | Rigorous record settled before cycle close |

## Handoff template

```text
Date:
Result:
Node/fixture/PHP results:
Externalize-first measurements:
Approval record: none expected
Browser evidence:
Manifest/guide path/hash:
Files changed:
Open questions/known limits:
Review: pending rigorous release review
Commit: deferred
Next: cycle close only after a settled review and explicit authorization
```

## Handoff — 2026-11-16

**Date:** 2026-11-16
**Result:** ME02 implemented on the review-settled ME01 tree. Package base
`7f5b4aa` (identical to the remote `owner-tool-integration` tip). No commit and
nothing staged.

### Files and measurements

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and production-path evidence |
|---|---:|---:|---|---|---|
| `deployed/admin_questions.php` | +0 / −0 (2 lines edited in place) | 1055 / 62646 | `883b56ee2bdbdb1309cdf02ca2237ec2ff1ca587cb0af9b483640f9f89786611` | asset wiring only: `src/math-tool.css?v=1.0.0` and `src/math-tool.js?v=1.0.0` | site root; `tests/math-tool.js` asset vector; `php -l`; staging browser load |
| `src/math-tool.js` | unchanged | 432 / 13974 | `fee1d8b393e64e39457186a345e6e5d4227d21f79f885d44983554bdb69c6d14` | palette insertion and advisory byte counter | site root `src/`; `node tests/math-tool.js` (real module and mount) |
| `src/math-tool.css` | unchanged | 133 / 2028 | `09f30a164de075dbb3aaff1aed470dd3143f2ed12d5d15bf582132ea69f6a2ce` | presentation | site root `src/`; loaded once by the admin page |
| `tests/math-tool.js` | +0 / −0 (2 assertion strings) | 387 / 14963 | `ecbaec8d22c5ff8d3428d183f14c1906c9f40a9bde0408ee9551e90656d61db8` | harness; token-aware asset vector | not deployed |
| `docs/DECISIONS.md` | docs | 1560 / 88081 | — | new D-94 token decision; D-92/D-93 verified unchanged | not deployed |
| `docs/INVARIANTS.md` | docs | 238 / 49355 | — | INV-139–INV-141; counts 141/131/10 | not deployed |
| `docs/EDGE_CASES.md` | docs | 278 / 43744 | — | EC-138–EC-140; counts 140/136/4 | not deployed |
| `docs/DEPLOYMENT.md` | docs | 223 / 15901 (`61652a3a…`) | — | 12-file manifest, tokens, upload order, smoke checks, stop conditions, limitations | not deployed |
| `docs/DEVELOPER-GUIDE.md` | docs | 232 / 13694 (`a4b081de…`) | — | architecture map, math-editor rules, testing commands, counts, limitations | not deployed |
| `docs/STATUS.md` (231 / 24357), `docs/plan/README.md` (379 / 20790), `prompts/phase-map.md` (23 / 787), this package (181 / 10504) | docs | — | — | status, map, handoff | not deployed |

Live-origin cap against `archive/live-sources/admin_questions-2026-10-31.php`
(1046 / 62273): `deployed/admin_questions.php` is **+89 / −80**, unchanged by
the token edit and within the 100-addition cap. No exception exists or is needed.

**Excluded artifacts, separately:** `deployed/cbt.php` and
`deployed/cbt_practice.php` (their `render.js?2.3.2g`/`2.3.2c` tokens unchanged
and out of scope), `ocr_helper.js`, `src/owner-tool/render.js`,
`deployed/render.php`, `src/underline-toolbar.js`, `src/question-preview.js`,
`src/question-preview.css`, the SQL ops files, generated `src/bookmarklet.js`,
`archive/` snapshots, `docs/24-question-underline-and-math.md`, and the staging
SQLite database, log, and outside-workspace PHP CLI in `$HOME/tmp`.

### Commands and results

```sh
node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  # 163 PASS
node tests/ocr-helper.js            # 11 PASS
node tests/underline-toolbar.js     # 9 PASS
node tests/question-preview.js      # 4 PASS
node tests/math-tool.js             # 17 PASS
node tools/extract-bank.js --check  # source, anchors, counts, 7 hashes OK
php tests/php-render.php            # 9 PASS (PHP 8.3.32)
php tests/admin-question-store.php  # 8 PASS (PHP 8.3.32)
php -l                              # 6 deployed PHP files + staging cbt_db.php PASS
node --check src/math-tool.js tests/math-tool.js  # PASS
git diff --check                    # clean
```

PHP was absent from this VM; the declared PHP 8.3 target was exercised with a
static-php-cli PHP 8.3.32 binary kept outside the workspace in `$HOME/tmp`
(downloaded the same way as in the ST01/ME01 sessions). No MySQL, live, or
deployment check ran.

### Acceptance mapping

| Check | Result |
|---|---|
| Node/PHP suites; `tests/math-tool.js` | **PASS.** 60/163/11/9/4 + 17; renderer 9, store 8, lint 7/7 |
| Externalize-first | **PASS.** `admin_questions.php` **+89/−80**; module 432 / 13974 and CSS 133 / 2028 unchanged |
| Tokens | **PASS.** The admin page is the only reference and loads each file once with `?v=1.0.0`; `render.js` tokens elsewhere unchanged |
| Manifest | **PASS.** 12 production rows with current lines/bytes and SHA-256, upload order, cache note, smoke checks, stop conditions |
| Guide | **PASS.** Architecture rows, math-editor rules, stored-state boundary, testing commands, and counts match the code |
| Docs | **PASS.** Status, map, coordinator row, invariants, edge cases, and decisions agree at D-94 / INV-141 / EC-140 |
| Browser | **PASS.** Desktop Chrome 156.0.0.0 staging evidence recorded; owner accepted the Brave/Android recheck on 2026-11-17 |
| Live safety | **PASS.** No live read/write, no deploy, no cleanup; staging rows are local and disposable |
| Review | **PASS WITH ACCEPTED FINDINGS.** Rigorous phase-3 record complete; no `BLOCK` or `FIX` |

### Browser evidence (desktop Chromium, disposable staging)

Local `tools/start-phone-staging.sh` on port 3006 with a disposable SQLite
database and the `admin_questions.php` from this tree; login `staging`. Tested in
the cloud Chromium (`Chrome/156.0.0.0`) at 1280×800 and 400×649.

- Palette mounts exactly once on `#question_text` in Add and Edit forms; one
  Underline button remains.
- Quick-row `x²`, drawer Greek `α`, and keyboard `Enter` on `½` all land at the
  remembered caret; replacing a selection preserved the surrounding newline.
- Drawer toggles with `aria-expanded="true"`, six categories, 86 symbols;
  mobile-width targets measure 38 px.
- `Ctrl+Z` restored the replaced text on the `execCommand` path.
- Counter: 32 bytes neutral, 57 000 amber, 60 000 red with the warning visible;
  a native form reset refreshed it from 57 000 to `0 / 60 000 bytes`.
- The read-only preview refreshed after every insertion.
- Native save flashed `Question saved successfully (Question ID: 102).`; the list
  cell showed `Evaluate x² ± 3 exactly.` with no raw `<u>`, and the edit page
  restored `Evaluate x² ± 3 <u>exactly</u>.` plus the multiline Constant Text.
- Only network error was a missing `favicon.ico`; both math-editor assets
  returned 200 with `?v=1.0.0`.

The staging server was stopped (PID recorded, killed by PID) and its SQLite row
is local and disposable. No live site was contacted.

### Staging mobile-viewport correction (2026-11-16)

The owner phone check exposed a staging-only gap: `admin_questions.php` gets its
document shell and viewport metadata from the site's `header.php`, but
`tools/start-phone-staging.sh` had not supplied that include. Android therefore
used its desktop-width layout viewport and never activated the existing 650 px
mobile breakpoint. The live snapshot already contains the viewport metadata;
no production file or server contract changed.

The harness now copies minimal staging-only `header.php` and `footer.php` files.
The refreshed response contains the complete HTML shell and
`width=device-width, initial-scale=1.0`. A logged-in Chromium Android context at
390 x 844 reported `innerWidth=390`, `scrollWidth=390`, a matching mobile media
query, mobile padding, and one computed column for all three admin/question
grids. At 900 px the grids returned to their two-column layouts.

Verification passed: shell and PHP syntax checks, `git diff --check`, the 60
fixture suite, 163 unit checks, 11 helper checks, 10 underline checks, 4 preview
checks, 20 math-tool checks, 7 bank hashes, 9 renderer vectors, and 8 store
checks. Changed files are `tools/start-phone-staging.sh`,
`tools/phone-staging/header.php`, and `tools/phone-staging/footer.php`, plus this
handoff/status update. The disposable server remains available at the default
phone-staging URL for owner retesting. No live site was contacted. At that
point, the correction enabled the check but did not satisfy the external gate;
a fresh owner-accepted Brave/Android result was still required.

### Owner phone acceptance (2026-11-17)

The owner explicitly accepted the final ME02 Brave/Android recheck in the EL01
Gate 2 authorization. The acceptance covers the corrected mobile viewport and
the package's palette, drawer, remembered-caret insertion, Underline, preview,
counter, and native-save smoke boundary. No live write or cleanup was authorized
or performed. The owner did not supply a browser/device version string, and the
explicit acceptance closes the package gate without inventing one.

### Open questions and known limits

- MySQL and the schema migration were not exercised in this phase.
- Undo is browser-dependent on the `setRangeText`/`.value` fallbacks; only the
  `execCommand` path was observed.
- `maxlength="60000"` (UTF-16) versus the 60 000-byte server check remains a
  documented limitation; neither was changed.
- The desktop check used local staging, so it proves module/asset wiring and the
  native PRG round-trip, not production data behaviour.

**Review:** PASS WITH ACCEPTED FINDINGS in
[`../reviews/math-editor-2026-11-phase-3.md`](../reviews/math-editor-2026-11-phase-3.md);
the owner accepted the remaining phone gate on 2026-11-17. **Commit:** the
reviewed ME02 delta is recorded at `691626f`; later unrelated work is outside
that review. The package is done. **Next:** EL01 and its rigorous holistic
review; cycle close still requires explicit owner authorization.
