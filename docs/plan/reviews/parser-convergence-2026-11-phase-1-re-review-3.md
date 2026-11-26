# Parser Convergence 2026-11 Phase 1 Re-Review 3

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 1
- **Package:** PC01, Product Surface Separation ([`pc-01-product-separation.md`](../parser-convergence/pc-01-product-separation.md))
- **Mode:** closure-focused re-review of `BLOCK-5` (first-round `BLOCK`) and `FIX-4` (first-round `FIX`)
- **Prior review records:**
  - [`parser-convergence-2026-11-phase-1.md`](parser-convergence-2026-11-phase-1.md) (candidate `d98d6ad9282a6f89527f6952e38b5bc8988e8335`, combined round 1)
  - [`parser-convergence-2026-11-phase-1-re-review.md`](parser-convergence-2026-11-phase-1-re-review.md) (candidate `b7b18cd33302faf100b0be7c6fa67ad9c3b68d3e`, re-review 1)
  - [`parser-convergence-2026-11-phase-1-re-review-2.md`](parser-convergence-2026-11-phase-1-re-review-2.md) (candidate `6e28e8272097e8e9998578672db978e92c8535b1`, re-review 2)
- **Candidate:** pushed `origin/scratch/pc01-product-separation` at exact commit `cc72e3bb6c44aeac9008be886480759bebdcf30d`
- **Package base:** `bb78c57f8106e7375883e5b9bf1ef35bc80f18b8`
- **Product baseline:** `793cb8ffa754740749b05271e8fa4af717fa661a`
- **Published baseline:** `94a759338211476b2a3aa738b7a1159ff56be73e`
- **Review environment:** clean detached worktree (`$HOME/tmp/pc01-re-review-3-wt`) at `cc72e3bb6c44aeac9008be886480759bebdcf30d`; Node v26.13.0, PHP 8.5.12 CLI, and headless Chromium via `chromium-cdp` (port 9225) + Playwright CDP against disposable SQLite staging (`127.0.0.1:3022`, `tools/start-phone-staging.sh`). All temporary staging files, `.playwright-mcp/`, probe scripts, and the detached worktree were removed after verification; no repository branch or product file was modified.

## Verdict

**PASS.** Both `BLOCK-5` and `FIX-4` pass every frozen closure criterion across Node `vm`, the real generated key bookmarklet artifact, and real Chromium + SQLite staging, with zero new `BLOCK`, `FIX`, or `NOTE` findings in the re-review scope. Together with the earlier closed findings (`BLOCK-1`–`BLOCK-4` and `FIX-1`–`FIX-3`, plus non-blocking `NOTE-1`–`NOTE-7` from round 1), PC01 is review-settled.

- **Closed:** `BLOCK-5`, `FIX-4`.
- **Previously closed (unchanged):** `BLOCK-1`, `BLOCK-2`, `BLOCK-3`, `BLOCK-4`, `FIX-1`, `FIX-2`, `FIX-3`.
- **New findings:** none.

## Prior Finding Dispositions

| Finding | Prior Status | Re-review 3 Disposition | Summary |
|---|---|---|---|
| `BLOCK-5` | `OPEN` (round 1, recorded in re-review 2) | **CLOSED** | Frozen criteria 1–4 pass: `settleSave()` (`src/bookmarklets/key/entry.js:291-300`) routes an adopted `kind: 'inplace'` record (`auto && auto.request === entry.request`) through `settleAuto()` after releasing `savingInPlace` and deleting `ocrSubmitted`; `stopAuto()` (`entry.js:244-253`) retains `pendingSave` only when `owner.inFlight` matches `auto.request` and `!record.settled`; all three real-artifact regressions (`tests/key-bookmarklet.js:933-1022`), 7 derived adversarial Node `vm` probes, and 4 real Chromium staging scenarios (`B5_run`, `B5_stop`, `B5_fail`, `ADV_stop_early`) pass with no skipped question and no duplicate POST. |
| `FIX-4` | `OPEN` (round 1, recorded in re-review 2) | **CLOSED** | Frozen criteria 1–3 pass: `autoStep()` (`entry.js:391-405`) inspects `[pendingSave, owner.inFlight]` for an unsettled record matching active `queue.i` and `owner.batch`, adopting same-panel `saveInPlace` without calling `postSave()` again; `tests/key-bookmarklet.js:1026-1050` and Chromium staging `F4_same` confirm `1` POST for Q1 and `2` total POSTs (`Autosave complete: 2 of 2 saved.`) with SQLite rows `118`–`119`. |

### Frozen Closure Criterion Mapping

1. **`BLOCK-5`** ([`parser-convergence-2026-11-phase-1-re-review-2.md:97-102`](parser-convergence-2026-11-phase-1-re-review-2.md#L97-L102)):
   - Criterion 1 (adopted request settles through autosave rather than wedging `auto`): verified by inspection (`entry.js:291-300`), Node `vm` (`tests/key-bookmarklet.js:933-964`, `999-1022`, plus `ADV-2`, `ADV-3`, `ADV-6`, `ADV-7`), and Chromium staging (`B5_run` shows `afterQ1.i = 1`, `autoBtn = 'Stop autosave'`, `prog = '1 of 2 saved · saving question 2...'`, then Q2 posts once to `'Autosave complete: 2 of 2 saved.'`, SQLite rows `112`–`113`; `B5_fail` rejects bad CSRF with `'Autosave stopped at question 1: Your session token is invalid or expired...'`, `i = 0`, `autoBtn = 'Start autosave'`, then retries Q1 + Q2 cleanly to SQLite rows `116`–`117`).
   - Criterion 2 (`stopAuto()` never creates an unsettled `pendingSave` from a settled or inactive `auto.request`): verified by inspection (`entry.js:244-253`), Node `vm` (`tests/key-bookmarklet.js:967-995`, plus `ADV-1`), and Chromium staging (`B5_stop`: `Stop` after Q1 settles waits `750` ms with `postsWhileStopped = 1`, `iWhileStopped = 1`, then `Start` posts Q2 once to SQLite rows `114`–`115`; `ADV_stop_early`: `Start` -> `Stop` while Q1 is still in flight keeps `postsAfterSettleWhileStopped = 1` past `750` ms after Q1 settles, then `Start` posts Q2 once to SQLite rows `120`–`121`).
   - Criterion 3 (failing-first executable regression in `tests/key-bookmarklet.js` executing real generated `src/bookmarklets/key/bookmarklet.js`, plus failure variant): `tests/key-bookmarklet.js:933-1022` executes `src/bookmarklets/key/bookmarklet.js` in `vm` for success (`calls === 2`, `i === 2`), Stop/Start (`calls === 2`, `i === 2`), and failure (`i === 0`, retry `calls === 2`, `i === 1`). Handoff records the `38 passed, 4 failed` pre-fix reproduction ([`pc-01-product-separation.md:572-593`](../parser-convergence/pc-01-product-separation.md#L572-L593)).
   - Criterion 4 (rebuilt `src/bookmarklets/key/bookmarklet.js`, disposable browser staging, full Node/PHP baselines): verified below.
2. **`FIX-4`** ([`parser-convergence-2026-11-phase-1-re-review-2.md:110-114`](parser-convergence-2026-11-phase-1-re-review-2.md#L110-L114)):
   - Criterion 1 (`ocr_auto.onclick` / `autoStep()` checks `owner.inFlight` for active `batch` and `index` and attaches without calling `postSave()` again): verified (`entry.js:391-405`), Node `vm` (`tests/key-bookmarklet.js:1026-1050`), and Chromium staging (`F4_same`: `postsAfterSameStart = 1`, `autoBtnSame = 'Stop autosave'`, `finalPosts = 2`, `finalI = 2`, SQLite rows `118`–`119`).
   - Criterion 2 (failing-first executable regression in `tests/key-bookmarklet.js` executing real `src/bookmarklets/key/bookmarklet.js`): `tests/key-bookmarklet.js:1026-1050` (`calls === 1` during in-flight adoption, `calls === 2` after Q2).
   - Criterion 3 (rebuilt `src/bookmarklets/key/bookmarklet.js` and full Node/PHP baselines): verified below.

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc01-re-review-3-wt` (`cc72e3bb6c44aeac9008be886480759bebdcf30d`):

| Command | Result |
|---|---|
| `node tests/runner.js` | `68` fixtures: `68` PASS, `0` FAIL, `0` PENDING |
| `node tests/unit.js` | `173` PASS, `0` FAIL |
| `node tests/ocr-helper.js` | `38` PASS (`ocr-helper` vectors) |
| `node tests/key-bookmarklet.js` | `42` PASS (`key-bookmarklet` vectors; executes and deterministically rebuilds `src/bookmarklets/key/bookmarklet.js`) |
| `node tests/underline-toolbar.js` | `10` PASS |
| `node tests/question-preview.js` | `7` PASS |
| `node tests/math-tool.js` | `26` PASS |
| `node tests/render-markup.js` | `69` PASS |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and `7` output hashes match |
| `php tests/php-render.php` | `33` PASS (PHP 8.5.12 CLI) |
| `php tests/admin-question-store.php` | `8` PASS (PHP 8.5.12 CLI) |
| `php tests/cbt-question-order.php` | `14` PASS, `0` FAIL (PHP 8.5.12 CLI) |
| `for f in deployed/*.php; do php -l "$f"; done` | `7/7` syntax checks pass (PHP 8.5.12 CLI) |
| `node src/build/build.js` | Rebuilt `src/bookmarklet.js` (`101,336` B reported / `101,337` B on disk with trailing newline, sha256 `bf5837e48f30942096f877d4c40fc81e2d6e44604f786369f6013a2fde85f2ae`, clean worktree) |
| `node src/bookmarklets/key/build.js` | Rebuilt `src/bookmarklets/key/bookmarklet.js` (`1` line, `71,421` B reported / `71,422` B on disk with trailing newline, `new Function` and `node --check` pass, no `%XX`, sha256 `8d8c1a33c7c03a16d09c1d7fe5c7c9f3a47ad19ac1d69fc4f87a5c1c8b8b560e`, clean worktree) |

## Re-Review Scenario Matrix (Frozen Closure Scope + Derived Adversarial Probes)

| Action / Flow | State | Node `vm` (Real Artifact) | Chromium Staging (Real Page + Artifact) | Outcome |
|---|---|---|---|---|
| `saveInPlace` Q1 -> reinject -> `Start autosave` -> Q1 resolves -> Q2 (`B5_run`) | `saveInPlace` Q1 hanging on 2-question keyed batch | Executed (`tests/key-bookmarklet.js:933-964`) | Executed (`postsAfterStart = 1`, `afterQ1.i = 1`, `finalPosts = 2`, `Autosave complete: 2 of 2 saved.`, SQLite rows `112`–`113`) | **PASS (`BLOCK-5`)**: adopted save settles via `settleAuto`, Q2 posts once and saves. |
| `saveInPlace` Q1 -> reinject -> `Start` -> Q1 resolves -> `Stop` -> wait >600ms -> `Start` (`B5_stop`) | Q1 settled before `Stop` | Executed (`tests/key-bookmarklet.js:967-995`) | Executed (`postsWhileStopped = 1`, `iWhileStopped = 1`, `finalPosts = 2`, SQLite rows `114`–`115`) | **PASS (`BLOCK-5`)**: `Stop` keeps `pendingSave = null`; restart posts Q2 once. |
| `saveInPlace` Q1 (bad CSRF) -> reinject -> `Start` -> Q1 fails -> fix CSRF -> `Start` (`B5_fail`) | Adopted `saveInPlace` fails on server | Executed (`tests/key-bookmarklet.js:999-1022`) | Executed (`failMidState.i = 0`, `autoBtn = 'Start autosave'`, `finalPosts = 3`, `finalI = 2`, SQLite rows `116`–`117`) | **PASS (`BLOCK-5`)**: stops cleanly at `i = 0`; retry saves Q1 and Q2 once each. |
| Same-panel `saveInPlace` Q1 -> `Start autosave` -> Q1 resolves -> Q2 (`F4_same`) | Same-panel `saveInPlace` Q1 hanging | Executed (`tests/key-bookmarklet.js:1026-1050`) | Executed (`postsAfterSameStart = 1`, `autoBtnSame = 'Stop autosave'`, `finalPosts = 2`, SQLite rows `118`–`119`) | **PASS (`FIX-4`)**: attaches to `owner.inFlight` without a duplicate Q1 POST. |
| Same-panel `saveInPlace` Q1 -> `Start` -> `Stop` **before** Q1 settles -> Q1 settles -> `Start` (`ADV-1` / `ADV_stop_early`) | Adopted `saveInPlace` still hanging at `Stop` | Executed (`ADV-1`: `calls = 1` on settle, `calls = 2` after restart, `i = 2`) | Executed (`postsAfterEarlyStop = 1`, `postsAfterSettleWhileStopped = 1` past `750` ms, `finalPosts = 2`, SQLite rows `120`–`121`) | **PASS**: settles Q1 once while stopped without auto-advancing; restart posts Q2 once. |
| Same-panel `saveInPlace` -> `Start` -> `Stop` -> `Start` (all while Q1 hanging) -> Q1 settles -> Q2 (`ADV-2`) | Adopted save stopped and restarted while still in flight | Executed (`ADV-2`: `calls = 1` through Stop/Start, `autoBtn = 'Stop autosave'`, `calls = 2` for Q2) | Inspected (`reusable` adopts `owner.inFlight`, `auto.request` matches `entry.request`) | **PASS**: re-adopts without duplicate POST and continues to Q2. |
| `saveInPlace` -> reinject -> `Start` -> 3rd reinject (while hanging) -> `Start` -> Q1 settles -> Q2 (`ADV-3`) | Double reinjection mid-adopted-save | Executed (`ADV-3`: `calls = 1` across 3rd panel Start, `calls = 2` after Q1 settles) | Inspected (`owner.inFlight` persists across activations; `owner.gen` retires panel 2) | **PASS**: 3rd panel adopts and completes Q1 + Q2 once each. |
| `saveInPlace` -> `Start` -> `Save Question` (blocked), then `Stop` (while hanging) -> `Save Question` (`ADV-4`) | Overlapping manual submit during running and stopped-in-flight adopted save | Executed (`ADV-4`: `calls = 1`, `'Autosave is running'` then `'already in progress'`) | Inspected (`entry.js:415-431`) | **PASS**: manual submit blocked cleanly in both states. |
| `saveInPlace` -> `Start` -> `Skip` -> Q1 settles late (`ADV-5`) | Batch invalidated after adoption | Executed (`ADV-5`: `i = 1` unchanged on late settle, `calls = 2` only after manual Q2 Start) | Inspected (`abandonInFlight()` increments `owner.batch`) | **PASS**: stale Q1 settlement dropped by batch check. |
| Single-question `saveInPlace` -> reinject -> `Start` -> Q1 settles (`ADV-6`) | 1-question batch boundary | Executed (`ADV-6`: `i = 1`, `'Autosave complete: 1 of 1 saved.'`, `calls = 1`) | Inspected (`entry.js:342-347`) | **PASS**: completes cleanly without scheduling another step. |
| Same-panel `saveInPlace` -> `Start` -> Q1 fails -> manual `Save Question` retry (`ADV-7`) | `savingInPlace` lock release after adopted failure | Executed (`ADV-7`: `calls = 2`, `i = 1`, `'Saved question 1 of 2'`) | Inspected (`savingInPlace` cleared at adoption `entry.js:393` and settlement `entry.js:297`) | **PASS**: manual retry succeeds without stale lock. |

### Highest-Risk Interactions Examined & Residual Scope

- **Highest-risk interactions examined:** Cross-mode adoption (`saveInPlace` `kind: 'inplace'` adopted into `autoStep` on the same panel or after reinjection), early `Stop` before or after settlement of an adopted save, server error recovery on an adopted save, multi-activation retirement (`owner.gen`), and batch invalidation (`Skip` / `Clear` / `Load`) during an adopted save.
- **Scenarios executed:** All `BLOCK-5` and `FIX-4` closure scenarios (`B5_run`, `B5_stop`, `B5_fail`, `F4_same`), 7 derived adversarial Node `vm` scenarios (`ADV-1`–`ADV-7`), and 5 real-browser Chromium + SQLite staging scenarios (`B5_run`, `B5_stop`, `B5_fail`, `F4_same`, `ADV_stop_early`) with `pageErrors = []`.
- **Material unverified / deferred scenarios:** `php tests/cbt-staging.php` (requires EL01 MySQL URL gate; no PHP changed), mobile Brave/Android visual check (PC02/PC06 gate), and live deployment / live DB writes (prohibited by PC01 and `docs/LIVE-SAFETY.md`).

## Externalize-First Independent Verification

### Ref and Boundary Checks

- `git merge-base --is-ancestor bb78c57f8106e7375883e5b9bf1ef35bc80f18b8 HEAD` → exit `0`.
- `git merge-base --is-ancestor 6e28e8272097e8e9998578672db978e92c8535b1 HEAD` → exit `0`.
- `git diff --exit-code bb78c57..HEAD -- src/parser/core.js src/parser/parser.js src/ui/ui.js src/bookmarklet.js deployed fixtures tests/fixtures` → exit `0` (all protected paths byte-identical to package base).
- `git diff --exit-code 94a7593:ocr_helper.js HEAD:ocr_helper.js` → exit `0` (deployed helper byte-identical to published baseline `94a7593`).
- Live-origin diff against archived snapshots: `+51/-47` (`archive/live-sources/ocr_helper-2026-11-01.js`), `+51/-45` (`archive/live-sources/ocr_helper.js` and `archive/live-sources/ocr_helper_deployed.js`) — within the 100-addition cap; no Gate 1 exception required.

### Per-File Measurements (from package base `bb78c57` and re-review 2 `6e28e82`)

| Path | Diff vs `bb78c57` | Fix diff vs `6e28e82` | Final lines / bytes / sha256 | Responsibility & Deployment | Direct Production-Path Test |
|---|---|---|---|---|---|
| `ocr_helper.js` | `+16/-316` | `0/0` | `127` L / `4,917` B / `b83835b7...` | Deployed manual helper only; loaded by `deployed/admin_questions.php:1050-1051` after `core.js` | `node tests/ocr-helper.js` (`38` PASS) |
| `src/bookmarklets/key/entry.js` | `+596/-0` | `+19/-9` | `596` L / `24,700` B / `14c33a5d...` | Key/autosave entry (key fill, dry run, autosave, Stop, in-place save, run ownership, storage normalization); inlined only by `build.js` | Real generated artifact executed by `tests/key-bookmarklet.js` (`42` PASS) + 7 adversarial `vm` probes + Chromium staging |
| `src/bookmarklets/key/boot.js` | `+12/-0` (moved) | `0/0` | `12` L / `589` B / `52432cd4...` | Key-product panel handover; prepended by `build.js` | Same artifact suite + Chromium staging |
| `src/bookmarklets/key/build.js` | `+44/-0` (moved) | `0/0` | `44` L / `1,364` B / `74753557...` | Deterministic `core.js` + `boot.js` + `entry.js` key bookmarklet builder; repo tool | `tests/key-bookmarklet.js` executes `build.js` and checks determinism |
| `tests/ocr-helper.js` | `+40/-328` | `0/0` | `658` L / `30,476` B / `162d63ce...` | Deployed-helper and parser test suite | `node tests/ocr-helper.js` |
| `tests/key-bookmarklet.js` | `+1,062/-0` | `+121/-0` | `1,062` L / `48,885` B / `8f161f5e...` | Key-bookmarklet suite executing real artifact and `entry.js` | `node tests/key-bookmarklet.js` |

### Excluded / Unchanged Artifacts

- `src/bookmarklets/key/bookmarklet.js`: generated artifact (`1` L / `71,422` B / sha256 `8d8c1a33...`; `+1/-1` vs `6e28e82`), excluded from source line limits and executed directly by `tests/key-bookmarklet.js`, Node `vm` probes, and Chromium staging.
- `src/bookmarklet.js`: unchanged generated stimulus artifact (`1` L / `101,337` B / sha256 `bf5837e4...`), rebuilt deterministically to the same hash.
- `src/parser/core.js` (`1,733` L / `60,722` B / `c9ac52b3...`), `src/parser/parser.js` (`1,337` L / `50,419` B / `0a9bff5f...`), `src/ui/ui.js` (`1,431` L / `61,701` B / `1e1f8007...`), `deployed/*.php`, `fixtures/`, `tests/fixtures/`: byte-identical to `bb78c57`.
- `experiments/key-bookmarklet/{boot.js,build.js,bookmarklet.js}`: removed in PC01 (moved/replaced by `src/bookmarklets/key/`).
- `src/bookmarklet.min.js`: absent/untracked, not built or used.
- `AGENTS.md` (`+2/-2` vs `6e28e82`), `docs/STATUS.md` (`+17/-2` vs `6e28e82`), `docs/plan/README.md` (`+16/-2` vs `6e28e82`), `docs/plan/parser-convergence/pc-01-product-separation.md` (`+137/-2` vs `6e28e82`), `docs/plan/prompts/phase-map.md` (`+6/-0` vs `6e28e82`), and `docs/plan/reviews/parser-convergence-2026-11-phase-1-re-review-2.md` (`+159/-0` vs `6e28e82`): process/handoff/review docs from `2696c42`/`cc72e3b`.
- Temporary staging files (`$HOME/tmp/pc01-staging-tmp`, `$HOME/tmp/pc01-re-review-3-wt`, `$HOME/tmp/pc01-re-review-3-probes.js`, `.playwright-mcp/`): removed after verification.

## Commit Readiness and Review Status

- **Verdict:** `PASS`
- **Commit readiness:** candidate `cc72e3bb6c44aeac9008be886480759bebdcf30d` is already committed on `origin/scratch/pc01-product-separation`. This review record remains uncommitted per review protocol.
- **Scratch-cycle merge readiness:** yes, upon explicit owner authorization to publish this review record, mark PC01 `done` in coordinator/map, and merge `scratch/pc01-product-separation` (`cc72e3b`) into `scratch/parser-convergence-cycle` (without touching `main`, `owner-tool-integration`, `experiments`, or `experiments-alt`).
- **Review status:** phase 1 re-review 3 complete; `BLOCK-5` and `FIX-4` closed; PC01 rigorous review settled.
- **Dependent work:** PC02 Gate 1 may now proceed once the VM publishes this review record and merges PC01 into `scratch/parser-convergence-cycle`.

## Recommended Next Action

PC01 is review-settled with no open `BLOCK` or `FIX`. Have the owner authorize publishing this review record to `scratch/pc01-product-separation` and merging that reviewed branch into `scratch/parser-convergence-cycle` (reconciling PC01 status to `done`), then start phase 2 (`PC02`).

NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 2
