# Parser Convergence 2026-11 Phase 1 Re-Review 2

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 1
- **Package:** PC01, Product Surface Separation ([`pc-01-product-separation.md`](../parser-convergence/pc-01-product-separation.md))
- **Mode:** closure-focused re-review of `BLOCK-2` (owner `fix` disposition) and `FIX-3` (first-round finding)
- **Prior review records:**
  - [`parser-convergence-2026-11-phase-1.md`](parser-convergence-2026-11-phase-1.md) (candidate `d98d6ad9282a6f89527f6952e38b5bc8988e8335`, combined round 1)
  - [`parser-convergence-2026-11-phase-1-re-review.md`](parser-convergence-2026-11-phase-1-re-review.md) (candidate `b7b18cd33302faf100b0be7c6fa67ad9c3b68d3e`, re-review 1)
- **Candidate:** pushed `origin/scratch/pc01-product-separation` at exact commit `6e28e8272097e8e9998578672db978e92c8535b1`
- **Package base:** `bb78c57f8106e7375883e5b9bf1ef35bc80f18b8`
- **Product baseline:** `793cb8ffa754740749b05271e8fa4af717fa661a`
- **Published baseline:** `94a759338211476b2a3aa738b7a1159ff56be73e`
- **Review environment:** clean detached worktree (`$HOME/tmp/pc01-re-review-2-wt`) at `6e28e8272097e8e9998578672db978e92c8535b1`; Node v26.13.0, PHP 8.5.12 CLI, and headless Chromium via `chromium-cdp` (port 9225) + Playwright CDP against disposable SQLite staging (`127.0.0.1:3021`, `tools/start-phone-staging.sh`). All temporary staging files, `.playwright-mcp/`, probe scripts, and the detached worktree were removed after verification; no repository branch or product file was modified.

## Verdict

**BLOCK.** PC01 is not commit-ready or scratch-cycle merge-ready.

- **Closed:** `BLOCK-2` (all 5 frozen closure criteria pass across Node `vm` and disposable Chromium staging), `FIX-3` (all 3 frozen closure criteria pass across Node `vm` and disposable Chromium staging).
- **New first-round `BLOCK-5`:** Material regression introduced by `6e28e82` and reproducible silent data loss on a supported path. After an in-place `Save Question` request starts, reinjecting the bookmarklet displays `'A save was already in progress; Start autosave attaches to it instead of posting again.'` (`src/bookmarklets/key/entry.js:583-585`). Clicking `Start autosave` adopts that `kind: 'inplace'` record (`entry.js:382-395`), but `settleSave()` (`entry.js:290`) dispatches on `entry.kind === 'inplace'` (`settleInPlace()`) rather than attached autosave state. When Q1 settles, `auto.running` and `auto.inFlight` stay `true` with no `autoTimer` scheduled (autosave is wedged on `'Stop autosave'` / `'1 of 2 saved · saving question 2...'`), and clicking `Stop autosave` then `Start autosave` wraps Q1's already-resolved `auto.request` into a new unsettled `pendingSave` for Q2 (`entry.js:244-252`), marking Q2 saved (`ocrQueue.i = 2`, `'Autosave complete: 2 of 2 saved.'`) **without ever POSTing Q2** (verified in Node `vm`, Chromium staging, and staging SQLite).
- **New first-round `FIX-4`:** Same-instance `Save Question` followed by `Start autosave` while the in-place save is in flight ignores `savingInPlace` / `owner.inFlight` (`entry.js:382-386`, `543-554`) and sends a second simultaneous POST for the same question (verified in Node `vm`, Chromium staging, and staging SQLite).

## Prior Finding Dispositions

| Finding | Prior Status | Re-review 2 Disposition | Summary |
|---|---|---|---|
| `BLOCK-2` | `OPEN` (after round 2; owner chose `fix`) | **CLOSED** | Frozen criteria 1–5 pass: shared `form.__ocrKeyOwner.inFlight` survives double reinjection (`B2-C`), `saveInPlace` blocks when `owner.inFlight` matches current `batch`/`index` (`B2-A`, `B2-B`), unstarted replacement panel settles inherited save once (`B2-D`), failure settlement keeps `i = 0` once, idle reinjection/Stop-Start intact, and Q2 posts once after `autoStep` Q1 settles. |
| `FIX-3` | `OPEN` (round 1) | **CLOSED** | Frozen criteria 1–3 pass: `settleSave()` checks `retired()`, `claimSave(entry)` (once-only), and `entry.batch !== owner.batch` (`entry.js:284-292`) before `settleInPlace()` (`entry.js:346-347`) checks identity `savingInPlace === entry`; failing-first regression (`tests/key-bookmarklet.js:706-724`) and staging probe pass (`posts = 2`, `i = 1` on Batch 2). |

### Frozen Closure Criterion Mapping

1. **`BLOCK-2`** ([`parser-convergence-2026-11-phase-1.md:176-191`](parser-convergence-2026-11-phase-1.md#L176-L191)):
   - Criterion 1 (no second POST on reinjection during in-flight key save): verified for `autoStep` -> reinject -> `Start` (`tests/key-bookmarklet.js:561-585`), `autoStep` -> double reinject -> `Start` (`B2-C`, `tests/key-bookmarklet.js:659-679` & Chromium `postsBeforeRelease = 1`), `autoStep` -> reinject -> `Save Question` (`B2-A`, `tests/key-bookmarklet.js:609-631` & Chromium `blockedPosts = 1`), and `saveInPlace` -> reinject -> `Save Question` (`B2-B`, `tests/key-bookmarklet.js:635-655` & Chromium `blockedPosts = 1`).
   - Criterion 2 (settle once on success and failure): verified for `Start` success (`i = 1`), failure (`tests/key-bookmarklet.js:587-605`, `i = 0`), unstarted success (`B2-D`, `tests/key-bookmarklet.js:683-702` & Chromium `queueI = 1`), and unstarted failure (`Probe 4`, `qAfterFail = 0`).
   - Criterion 3 (replacement UI shows or safely blocks): startup status displays `'A save was already in progress; Start autosave attaches to it instead of posting again.'` (`entry.js:583-585`); `Save Question` blocks with `'A save for this question is already in progress; it will settle on its own.'` (`entry.js:416-421`); `B2-D` updates status to `'The save that was already in progress finished: question 1 is saved.'` (`entry.js:308-310`).
   - Criterion 4 (idle second-click & Stop/restart intact): verified by `tests/key-bookmarklet.js` (`38` PASS, including listener-count and Stop->Start reuse vectors).
   - Criterion 5 (next item posts once after first settles): verified by `B2-C` (`finalPosts = 2`, `Autosave complete: 2 of 2 saved.`, SQLite rows 104 & 105) and `B2-D` (`qText = 'Second browser autosave question?'`).
2. **`FIX-3`** ([`parser-convergence-2026-11-phase-1-re-review.md:109-113`](parser-convergence-2026-11-phase-1-re-review.md#L109-L113)):
   - Criterion 1 (`retired()` / `batch` guard before `savingInPlace` release): `settleSave()` (`entry.js:284-292`) gates on `retired()`, `claimSave(entry)`, and `entry.batch !== owner.batch` before calling `settleInPlace()`, which releases `savingInPlace` only when `savingInPlace === entry` (`entry.js:346-347`).
   - Criterion 2 (failing-first regression): `tests/key-bookmarklet.js:706-724` (`an abandoned in-place save does not unlock the replacement batch`) executes the real artifact (`calls === 2`); verified on Chromium staging with and without reinjection (`Probe 3` and staging `FIX_3`: `postsAfterResubmit = 2`, `finalPosts = 2`, SQLite rows 107 & 108).
   - Criterion 3 (rebuilt artifact & baselines): verified below.

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc01-re-review-2-wt` (`6e28e82`):

| Command | Result |
|---|---|
| `node tests/runner.js` | `68` fixtures: `68` PASS, `0` FAIL, `0` PENDING |
| `node tests/unit.js` | `173` PASS, `0` FAIL |
| `node tests/ocr-helper.js` | `38` PASS (`ocr-helper` vectors) |
| `node tests/key-bookmarklet.js` | `38` PASS (`key-bookmarklet` vectors; executes and deterministically rebuilds `src/bookmarklets/key/bookmarklet.js`) |
| `node tests/underline-toolbar.js` | `10` PASS |
| `node tests/question-preview.js` | `7` PASS |
| `node tests/math-tool.js` | `26` PASS |
| `node tests/render-markup.js` | `69` PASS |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and `7` output hashes match |
| `php tests/php-render.php` | `33` PASS (PHP 8.5.12 CLI) |
| `php tests/admin-question-store.php` | `8` PASS (PHP 8.5.12 CLI) |
| `php tests/cbt-question-order.php` | `14` PASS, `0` FAIL (PHP 8.5.12 CLI) |
| `for f in deployed/*.php; do php -l "$f"; done` | `7/7` syntax checks pass (PHP 8.5.12 CLI) |
| `node src/build/build.js` | Rebuilt `src/bookmarklet.js` (`101,336` B reported by script / `101,337` B on disk with trailing newline, sha256 `bf5837e48f30942096f877d4c40fc81e2d6e44604f786369f6013a2fde85f2ae`, clean worktree) |
| `node src/bookmarklets/key/build.js` | Rebuilt `src/bookmarklets/key/bookmarklet.js` (`1` line, `71,179` B on disk, `new Function` syntax check OK, no `%XX`, sha256 `fc96fdb8b21b47a4c17ffc838d5e83c0d11333d9b5c0609b612f87e2390e0cab`, clean worktree) |

## Re-Review Scenario Matrix (Frozen Closure Scope + Derived Adversarial Probes)

| Action / Flow | State | Node `vm` (Real Artifact) | Chromium Staging (Real Page + Artifact) | Outcome |
|---|---|---|---|---|
| `autoStep` in flight -> reinject -> `Save Question` (`B2-A`) | 1st `autoStep` POST hanging | Executed (`tests/key-bookmarklet.js:609-631`) | Executed (1 POST, `queueI = 1`, SQLite row 102) | **PASS (`BLOCK-2`)**: blocked with `'already in progress'`, settles once. |
| `saveInPlace` in flight -> reinject -> `Save Question` (`B2-B`) | 1st `saveInPlace` POST hanging | Executed (`tests/key-bookmarklet.js:635-655`) | Executed (1 POST, `queueI = 1`, SQLite row 103) | **PASS (`BLOCK-2`)**: blocked with `'already in progress'`, settles once. |
| `autoStep` in flight -> double reinject -> `Start autosave` (`B2-C`) | 1st `autoStep` POST hanging across 2 reinjections | Executed (`tests/key-bookmarklet.js:659-679`) | Executed (1 POST before release, 2 total, `2 of 2 saved`, SQLite rows 104–105) | **PASS (`BLOCK-2`)**: 3rd instance adopts request, Q1 & Q2 each post once. |
| `autoStep` in flight -> reinject -> wait without Start (`B2-D`) | 1st `autoStep` POST hanging, user waits | Executed (`tests/key-bookmarklet.js:683-702`) | Executed (1 POST, `queueI = 1`, Q2 loaded, SQLite row 106) | **PASS (`BLOCK-2`)**: settles once on replacement panel and moves to Q2. |
| `autoStep` in flight -> reinject -> wait without Start -> fail -> `Start` (`Probe 4`) | 1st `autoStep` POST fails (`Duplicate question.`) | Executed (`Probe 4`: `qAfterFail = 0`, `callsAfterRetry = 2`, `qAfterRetrySave = 1`) | Inspected (same `settleAuto` path) | **PASS (`BLOCK-2`)**: failure keeps Q1 queued once; retry posts once and saves. |
| `saveInPlace` #1 -> `Clear` -> `Load` Batch 2 -> `saveInPlace` #2 -> #1 resolves -> submit (`FIX-3`) | Batch 1 & Batch 2 `saveInPlace` overlapping | Executed (`tests/key-bookmarklet.js:706-724` & `Probe 3` with reinjection) | Executed (`postsAfterResubmit = 2`, `finalPosts = 2`, SQLite rows 107–108) | **PASS (`FIX-3`)**: #1 cannot clear `savingInPlace` for Batch 2; re-submit blocked. |
| `saveInPlace` in flight -> reinject -> `Start autosave` -> Q1 resolves -> `Stop` -> `Start` (`ADV_1`) | `saveInPlace` Q1 hanging on 2-question keyed batch | Executed (`Probe 1`: `callsAfterTimers = 1`, `callsAfterRestart = 1`, `qAfterRestart = 2`) | Executed (`postsAfterWait = 1`, wedged on `Stop autosave`, `afterStopStart.posts = 1`, `queueI = 2`, SQLite has ONLY Q1 row 109) | **FAIL (`BLOCK-5`)**: autosave wedges after Q1; `Stop`->`Start` reuses Q1's settled promise for Q2 and silently drops Q2. |
| Same instance `saveInPlace` in flight -> `Start autosave` (`ADV_2`) | `saveInPlace` Q1 hanging, no reinjection | Executed (`Probe 2`: `callsDuringInFlight = 2`) | Executed (`simultaneousPosts = 2`, duplicate SQLite rows 110–111) | **FAIL (`FIX-4`)**: `autoStep()` ignores `savingInPlace` / `owner.inFlight` and sends simultaneous duplicate POST. |

### Highest-Risk Interactions Examined & Residual Scope

- **Highest-risk interactions examined:** Cross-mode handoff and shared ownership (`form.__ocrKeyOwner`) between `saveInPlace()` (`kind: 'inplace'`) and `autoStep()` / `stopAuto()` (`kind: 'auto'`), multi-activation retirement (`owner.gen`), and batch-scoped lock release (`owner.batch` + `savingInPlace` object identity).
- **Scenarios executed:** All 6 `BLOCK-2` / `FIX-3` closure scenarios and both derived adversarial scenarios (`ADV_1`, `ADV_2`) in Node `vm` against the real generated `src/bookmarklets/key/bookmarklet.js` and in real Chromium against `deployed/admin_questions.php` on disposable SQLite staging.
- **Material unverified / deferred scenarios:** `php tests/cbt-staging.php` (requires EL01 MySQL URL gate; no PHP changed), mobile Brave/Android visual check (PC02/PC06 gate), and live deployment / live DB writes (prohibited by PC01 and `docs/LIVE-SAFETY.md`). Note also that in `ADV_1`, the behavior when `saveInPlace` -> reinject -> `Start autosave` settles as **failed** (instead of saved) was inspected on the same `settleInPlace()` code path (`entry.js:359-364`) rather than separately executed: `settleInPlace` leaves `auto.running === true` and `auto.inFlight === true` there as well.

## Findings

### `BLOCK-5` — Reinjecting during an in-place save and clicking `Start autosave` wedges autosave and can silently skip question 2 on Stop/Start

- **Severity justification:** `pc-01-product-separation.md:63` requires: *"Real key entry preserves answer-key fill, Stop behavior, in-flight-save settlement, and the existing key/autosave tests from `793cb8f`."* Under `review-session.md`, a new `BLOCK` during re-review is permitted for a material regression introduced by the fix and a reproducible data-loss defect on a supported path. This meets `BLOCK` on both counts: prior candidate `b7b18cd` attached `autoStep`'s continuation and continued to Q2, whereas `6e28e82`'s `entry.kind` split wedges autosave when the user follows the panel's own prompt (`'Start autosave attaches to it instead of posting again.'`) and causes `Stop` -> `Start` to mark Question 2 saved without ever sending its POST.
- **Exact defect:**
  1. When `saveInPlace()` starts an in-place POST (`entry.js:433-442`), `entry.kind` is `'inplace'`.
  2. Upon reinjection, `pendingSave` adopts that record (`entry.js:158`), `watchSave(pendingSave)` runs (`entry.js:166`), and `entry.js:583-585` prints `'A save was already in progress; Start autosave attaches to it instead of posting again.'`.
  3. Clicking `Start autosave` sets `auto.running = true` (`entry.js:551`) and `autoStep()` reuses `pendingSave` (`entry.js:382-395`) with `auto.inFlight = true; auto.request = entry.request;` while `entry.kind` remains `'inplace'`.
  4. When Q1 resolves, `settleSave()` (`entry.js:290`) dispatches on `entry.kind === 'inplace'` (`settleInPlace()`) instead of checking whether `auto && auto.running` adopted the save. `settleInPlace()` (`entry.js:343-365`) advances `queue.i` to `1`, leaves `auto.running === true` and `auto.inFlight === true` with button `'Stop autosave'` and progress `'1 of 2 saved · saving question 2...'`, and never schedules `autoTimer = setTimeout(autoStep, 600)`.
  5. Clicking `Stop autosave` then enters `stopAuto()` (`entry.js:244-252`), sees `auto.inFlight === true` and `owner.inFlight === null`, and constructs a synthetic `{ index: queue.i, request: auto.request, batch: owner.batch, kind: 'auto', settled: false }` from Q1's already-resolved `auto.request`. Clicking `Start autosave` reuses that resolved Q1 response for Q2 (`index === 1`), sets `ocrQueue.i = 2`, and reports `'Autosave complete: 2 of 2 saved.'` while Q2 was never POSTed (`ADV_1`: `posts = 1`, SQLite has only row `109`).
- **Supported operating preconditions:** Authenticated Add Question page with `src/bookmarklets/key/bookmarklet.js` loaded and a multi-question keyed queue; user submits `Save Question` (`saveInPlace`), reinjects the bookmarklet while the POST is in flight, and clicks `Start autosave` as instructed by the panel.
- **Finite closure criteria:**
  1. When `autoStep()` adopts an in-flight `pendingSave` (including one originated by `saveInPlace`), settling that request must route through autosave settlement (`auto.inFlight = false`, `auto.request = null`, and if `auto.running`, schedule the next question via `autoTimer` on success or call `stopAuto` on failure) rather than wedging `auto`.
  2. `stopAuto()` must never create an unsettled `pendingSave` from an `auto.request` whose record has already settled (or whose `owner.inFlight` is no longer active for that request).
  3. Add a failing-first executable regression in `tests/key-bookmarklet.js` executing the real generated `src/bookmarklets/key/bookmarklet.js` that reproduces `saveInPlace` Q1 -> reinject -> `Start autosave` -> Q1 resolves -> `autoTimer` fires -> Q2 is posted once (`calls === 2`, `ocrQueue.i === 2`), plus a failure-settlement variant (Q1 fails -> stops cleanly at `i === 0`, retry posts Q1 once).
  4. Rebuild `src/bookmarklets/key/bookmarklet.js` (`1` line, `node --check` / `new Function` passes, deterministic, no `%XX`), verify on disposable browser staging that Q1 and Q2 both save to the DB once (`posts === 2`), and pass the full Node/PHP baselines.
- **Required evidence:** Failing-first before/after test output on the rebuilt `src/bookmarklets/key/bookmarklet.js`, passing `node tests/key-bookmarklet.js`, full Node/PHP baselines, and a disposable-browser probe confirming `saveInPlace` -> reinject -> `Start autosave` completes a 2-question batch with 2 real POSTs and 2 saved rows.
- **Non-goals / deferred checks:** No changes to `ocr_helper.js`, parser modules, `src/ui/ui.js`, `src/bookmarklet.js`, or `deployed/*.php`.

### `FIX-4` — Clicking `Start autosave` on the same panel while `Save Question` (`saveInPlace`) is in flight sends a simultaneous duplicate POST

- **Severity justification:** `pc-01-product-separation.md:63` requires: *"Real key entry preserves answer-key fill, Stop behavior, in-flight-save settlement, and the existing key/autosave tests from `793cb8f`."* This is a `FIX` rather than a `BLOCK` because `saveInPlace()`'s own single-panel double-submit lock (`entry.js:404-408`) and reinjection adoption both work, `793cb8f` already lacked a `savingInPlace` guard in `ocr_auto.onclick` (so `6e28e82` did not introduce this defect), and triggering it requires clicking `Start autosave` on the same panel immediately after submitting `Save Question` while the status already reads `'Saving question 1 of N...'`.
- **Exact defect:** `saveInPlace()` (`entry.js:440-441`) records the active request in `savingInPlace` and `owner.inFlight`, leaving closure-local `pendingSave` as `null`. `ocr_auto.onclick` (`entry.js:543-554`) and `autoStep()` (`entry.js:382-386`) inspect only `pendingSave` and never check `owner.inFlight` (or `savingInPlace`), so clicking `Start autosave` on the same panel while `saveInPlace` is in flight immediately calls `postSave()` a second time for the same question (`ADV_2`: `callsDuringInFlight = 2` in Node `vm`; `simultaneousPosts = 2` and duplicate SQLite rows `110`–`111` in Chromium staging).
- **Supported operating preconditions:** Authenticated Add Question page with `src/bookmarklets/key/bookmarklet.js` loaded and a dry-run-ready keyed queue; user submits `Save Question` (`saveInPlace`) and clicks `Start autosave` before the POST resolves.
- **Finite closure criteria:**
  1. `ocr_auto.onclick` / `autoStep()` must check `owner.inFlight` (for the active `batch` and `index`) in addition to `pendingSave` — either attaching autosave to that outstanding `owner.inFlight` record without calling `postSave()` again (consistent with `BLOCK-5`) or blocking `Start autosave` cleanly until the in-place save settles — so `calls === 1`.
  2. Add a failing-first executable regression in `tests/key-bookmarklet.js` executing the real generated `src/bookmarklets/key/bookmarklet.js` for same-panel `saveInPlace` -> `Start autosave`, proving `calls === 1` and single settlement.
  3. Rebuild `src/bookmarklets/key/bookmarklet.js` and pass full Node/PHP baselines.
- **Required evidence:** Failing-first before/after test output on rebuilt `src/bookmarklets/key/bookmarklet.js`, passing `node tests/key-bookmarklet.js`, and full baselines.
- **Non-goals / deferred checks:** No changes to `ocr_helper.js`, parser modules, `src/ui/ui.js`, `src/bookmarklet.js`, or `deployed/*.php`.

## Externalize-First Independent Verification

### Ref and Boundary Checks

- `git merge-base --is-ancestor bb78c57f8106e7375883e5b9bf1ef35bc80f18b8 HEAD` → exit `0`.
- `git diff --exit-code bb78c57..HEAD -- src/parser/core.js src/parser/parser.js src/ui/ui.js src/bookmarklet.js deployed fixtures tests/fixtures` → exit `0` (all listed protected paths byte-identical to package base).
- `git diff --exit-code 94a7593:ocr_helper.js HEAD:ocr_helper.js` → exit `0` (deployed helper byte-identical to published baseline `94a7593`).
- Live-origin diff against archived snapshots: `+51/-47` (`archive/live-sources/ocr_helper-2026-11-01.js`), `+51/-45` (`archive/live-sources/ocr_helper.js` and `archive/live-sources/ocr_helper_deployed.js`) — within the 100-addition cap; no Gate 1 exception required.

### Per-File Measurements (from package base `bb78c57` and re-review 1 `b7b18cd`)

| Path | Diff vs `bb78c57` | Fix diff vs `b7b18cd` | Final lines / bytes / sha256 | Responsibility & Deployment | Direct Production-Path Test |
|---|---|---|---|---|---|
| `ocr_helper.js` | `+16/-316` | `0/0` | `127` L / `4,917` B / `b83835b7...` | Deployed manual helper only; loaded by `deployed/admin_questions.php:1050-1051` after `core.js` | `node tests/ocr-helper.js` (`38` PASS) |
| `src/bookmarklets/key/entry.js` | `+586/-0` | `+152/-91` | `586` L / `24,045` B / `a6a51249...` | Key/autosave entry (key fill, dry run, autosave, Stop, in-place save, run ownership, storage normalization); inlined only by `build.js` | Real generated artifact executed by `tests/key-bookmarklet.js` (`38` PASS) + `runKeyEntry` `vm` + Chromium staging |
| `src/bookmarklets/key/boot.js` | `+12/-0` (moved) | `0/0` | `12` L / `589` B / `52432cd4...` | Key-product panel handover; prepended by `build.js` | Same artifact suite + Chromium staging |
| `src/bookmarklets/key/build.js` | `+44/-0` (moved) | `0/0` | `44` L / `1,364` B / `74753557...` | Deterministic `core.js` + `boot.js` + `entry.js` key bookmarklet builder; repo tool | `tests/key-bookmarklet.js` executes `build.js` and checks determinism |
| `tests/ocr-helper.js` | `+40/-328` | `0/0` | `658` L / `30,476` B / `162d63ce...` | Deployed-helper and parser test suite | `node tests/ocr-helper.js` |
| `tests/key-bookmarklet.js` | `+941/-0` | `+119/-0` | `941` L / `43,370` B / `8edcdc66...` | Key-bookmarklet suite executing real artifact and `entry.js` | `node tests/key-bookmarklet.js` |

### Excluded / Unchanged Artifacts

- `src/bookmarklets/key/bookmarklet.js`: generated artifact (`1` L / `71,179` B / sha256 `fc96fdb8...`; `1` L diff vs `b7b18cd`), excluded from source line limits and executed directly by `tests/key-bookmarklet.js` and Chromium staging.
- `src/bookmarklet.js`: unchanged generated stimulus artifact (`1` L / `101,337` B / sha256 `bf5837e4...`), rebuilt deterministically to the same hash.
- `src/parser/core.js` (`1,733` L / `60,722` B / `c9ac52b3...`), `src/parser/parser.js` (`1,337` L / `50,419` B / `0a9bff5f...`), `src/ui/ui.js` (`1,431` L / `61,701` B / `1e1f8007...`), `deployed/*.php`, `fixtures/`, `tests/fixtures/`: byte-identical to `bb78c57`.
- `experiments/key-bookmarklet/{boot.js,build.js,bookmarklet.js}`: removed in PC01 (moved/replaced by `src/bookmarklets/key/`).
- `src/bookmarklet.min.js`: absent/untracked, not built or used.
- `docs/plan/prompts/fix-session.md` (`+58/-5` vs `bb78c57`) and docs updates (`AGENTS.md`, `README.md`, `docs/STATUS.md`, `docs/plan/README.md`, `docs/plan/parser-convergence/pc-01-product-separation.md`): docs-only process/handoff edits in `6e28e82`/`e0a83bc`.
- Temporary staging files (`$HOME/tmp/pc01-staging-tmp`, `$HOME/tmp/pc01-re-review-2-wt`, `$HOME/tmp/pc01-re-review-2-probes.js`, `.playwright-mcp/`): removed after verification.

## Commit Readiness and Review Status

- **Verdict:** `BLOCK`
- **Commit readiness:** no
- **Scratch-cycle merge readiness:** no
- **Review status:** phase 1 re-review 2 complete; `BLOCK-2` and `FIX-3` closed; new first-round `BLOCK-5` and `FIX-4` recorded.
- **Dependent work:** PC02 remains blocked until `BLOCK-5` and `FIX-4` are fixed and settled by independent re-review.

## Recommended Next Action

Both `BLOCK-5` and `FIX-4` are first-round findings recorded for the first time in this re-review, so neither escalates to owner disposition. Route `BLOCK-5` and `FIX-4` to `fix-session.md` against their frozen closure contracts above, then submit the pushed candidate for independent re-review. Do not start PC02, merge `scratch/pc01-product-separation`, or edit real branches.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 1 BLOCK-5 FIX-4
