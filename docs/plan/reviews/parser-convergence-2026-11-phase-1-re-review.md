# Parser Convergence 2026-11 Phase 1 Re-Review

- **Date:** 2026-11-25
- **Cycle / phase:** `parser-convergence-2026-11`, phase 1
- **Package:** PC01, Product Surface Separation ([`pc-01-product-separation.md`](../parser-convergence/pc-01-product-separation.md))
- **Mode:** closure-focused re-review of `BLOCK-1`, `BLOCK-2`, `BLOCK-3`, `BLOCK-4`, `FIX-1`, and `FIX-2`
- **Prior review record:** [`parser-convergence-2026-11-phase-1.md`](parser-convergence-2026-11-phase-1.md) (candidate `d98d6ad9282a6f89527f6952e38b5bc8988e8335`, combined round 1)
- **Candidate:** pushed `origin/scratch/pc01-product-separation` at exact commit `b7b18cd33302faf100b0be7c6fa67ad9c3b68d3e`
- **Package base:** `bb78c57f8106e7375883e5b9bf1ef35bc80f18b8`
- **Product baseline:** `793cb8ffa754740749b05271e8fa4af717fa661a`
- **Published baseline:** `94a759338211476b2a3aa738b7a1159ff56be73e`
- **Review environment:** clean detached worktree (`$HOME/tmp/pc01-re-review-wt`) at `b7b18cd33302faf100b0be7c6fa67ad9c3b68d3e`; Node v26.13.0, PHP 8.5.12 CLI, and headless Chrome 157 via Playwright CDP against disposable SQLite staging (`127.0.0.1:3020`, `tools/start-phone-staging.sh` layout). All temporary staging files, `.playwright-mcp/`, and the detached worktree were removed after verification; no repository branch or product file was modified.

## Verdict

**BLOCK.** PC01 is not commit-ready or scratch-cycle merge-ready.

- **Closed:** `BLOCK-1`, `BLOCK-3`, `BLOCK-4`, `FIX-1`, `FIX-2`.
- **Remains OPEN (survives round 2 — escalates to owner disposition):** `BLOCK-2`. Three distinct failure paths against `BLOCK-2`'s frozen closure criteria 1–3 were reproduced on the real generated `src/bookmarklets/key/bookmarklet.js` in both Node `vm` and real Chromium on disposable PHP staging.
- **New first-round finding:** `FIX-3` (stale `savingInPlace = false` reset before the `retired() || run !== autoRun` guard in `src/bookmarklets/key/entry.js:361` drops the double-submit lock for an active replacement batch when an abandoned prior `saveInPlace` request settles).

## Prior Finding Dispositions

| Finding | Round 1 | Re-review Disposition | Summary |
|---|---|---|---|
| `BLOCK-1` | `BLOCK` | **CLOSED** | `keyApplies()` (`typeof queue.how === 'string'`) keeps retained `ansKey` inert for manual-helper queues; dry run blocks Start; key-only paste sets `how: 'key-paste'` and survives reload; storage keys/shapes preserved. |
| `BLOCK-2` | `BLOCK` | **OPEN (escalates)** | Single reinjection + `Start autosave` works, but double reinjection (`B2-C`), reinjection followed by `Save Question` (`B2-A`/`B2-B`), and waiting after reinjection without clicking Start (`B2-D`) violate frozen closure criteria 1, 2, and 3. |
| `BLOCK-3` | `BLOCK` | **CLOSED** | Startup `ocrSubmitted` consumer removed (`entry.js:517-521`); `docs/AGENTS.md:82-90`, `docs/SPEC.md:206-210`, and PC01 fix handoff distinguish startup prohibition from in-place-save cleanup; real-artifact test added; helper PRG unchanged. |
| `BLOCK-4` | `BLOCK` | **CLOSED** | `abandonInFlight()` and `autoRun++` in `ocr_load`/`ocr_clear`/`ocr_skip` prevent stale `pendingSave`, `saveInPlace`, and `ocr_skip` continuations from mutating the queue or status; all three failing-first regressions pass; `Stop`->`Start` reuse preserved. |
| `FIX-1` | `FIX` | **CLOSED** | `store.get`, `normalizeQueue`, `normalizeKey`, and `fillForm` handle malformed JSON, non-plain-object/invalid-index `ocrQueue`, non-plain-object/array `ansKey`, and unknown `ocrMeta` fields without crashing; three executable real-artifact vectors pass. |
| `FIX-2` | `FIX` | **CLOSED** | `tests/key-bookmarklet.js:743-810` (`runKeyEntry`) executes `src/bookmarklets/key/entry.js` in `vm` for missing `window.OCRParser`, version `2.3.0`, and missing `parsePaste`, asserting thrown message, `console.error`, and `#ocr_error` banner. |

### Open Owner Question Resolution (`BLOCK-3` Criterion 4)

Independently checked all 54 `test(...)` entries in `793cb8f:tests/ocr-helper.js` against `tests/ocr-helper.js` (38 tests) and `tests/key-bookmarklet.js` (33 tests):

- Five tests were renamed when moved to `tests/key-bookmarklet.js` (e.g., `loads the whole civic paper with its answer key and ticks the option` → `fills the keyed civic paper and ticks the option`; `keeps the answer key in ansKey when the queue is replaced without one` → owner-approved update `keeps ansKey but does not apply it to a queue the page helper replaced`).
- One baseline vector (`793cb8f:tests/ocr-helper.js:434`, `'advances past a saved question after the submit reload and keeps ticking'`) has **no successor** in `tests/key-bookmarklet.js`. Review A's factual statement was correct. The fix session updated `docs/AGENTS.md:85-88`, `docs/SPEC.md:206-210`, and `docs/plan/parser-convergence/pc-01-product-separation.md:312` to explicitly forbid reading `ocrSubmitted` at startup while preserving the before/after in-place-save cleanup and without claiming that the submit-reload vector was ported. `BLOCK-3` criterion 4 passes.

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc01-re-review-wt` (`b7b18cd`):

| Command | Result |
|---|---|
| `node tests/runner.js` | `68` fixtures: `68` PASS, `0` FAIL, `0` PENDING |
| `node tests/unit.js` | `173` PASS, `0` FAIL |
| `node tests/ocr-helper.js` | `38` PASS (`ocr-helper` vectors) |
| `node tests/key-bookmarklet.js` | `33` PASS (`key-bookmarklet` vectors; executes and deterministically rebuilds `src/bookmarklets/key/bookmarklet.js`) |
| `node tests/underline-toolbar.js` | `10` PASS |
| `node tests/question-preview.js` | `7` PASS |
| `node tests/math-tool.js` | `26` PASS |
| `node tests/render-markup.js` | `69` PASS |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and 7 output hashes match |
| `php tests/php-render.php` | `33` PASS (PHP 8.5.12 CLI) |
| `php tests/admin-question-store.php` | `8` PASS (PHP 8.5.12 CLI) |
| `php tests/cbt-question-order.php` | `14` PASS, `0` FAIL (PHP 8.5.12 CLI) |
| `for f in deployed/*.php; do php -l "$f"; done` | `7/7` syntax checks pass (PHP 8.5.12 CLI) |
| `node src/build/build.js` | Rebuilt `src/bookmarklet.js` (101,337 B, sha256 `bf5837e4...`, clean worktree) |
| `node src/bookmarklets/key/build.js` | Rebuilt `src/bookmarklets/key/bookmarklet.js` (1 line, 69,784 B, `new Function` syntax check OK, no `%XX`, sha256 `e62a66e7...`, clean worktree) |

## Re-Review Scenario Matrix (Frozen Closure Scope)

| Action / Flow | State | Node `vm` (Real Artifact) | Chromium Staging (Real Page + Artifact) | Outcome |
|---|---|---|---|---|
| Key injection after manual-helper Load | Stale `ansKey` in `localStorage`, no `how` in `ocrQueue` | Executed (`tests/key-bookmarklet.js:305-328`) | Executed | **PASS (`BLOCK-1`)**: no radio ticked, status explains stored key not used, Start alerts with 0 POSTs. |
| Key-only paste + reload after manual Load | `ansKey` retained, manual `ocrQueue` loaded | Executed (`tests/key-bookmarklet.js:332-348`) | Executed | **PASS (`BLOCK-1`)**: stamps `how: 'key-paste'`, ticks option, survives reinjection/reload. |
| Key injection with `ocrSubmitted='true'` | Manual reload marker set after page helper init | Executed (`tests/key-bookmarklet.js:608-619`) | Executed | **PASS (`BLOCK-3`)**: `i` stays `0`, form unchanged, 0 POSTs, `ocrSubmitted` preserved. |
| Single reinjection during in-flight autosave -> click `Start autosave` | 1st `postSave()` hanging, 1st panel retired | Executed (`tests/key-bookmarklet.js:561-605`) | Executed | **PASS (`BLOCK-2` happy path)**: 1 POST on Start, settles once, Q2 posts once, `2 of 2 saved`. |
| Reinjection during in-flight autosave -> click `Save Question` (`saveInPlace`) | 1st `autoStep` POST hanging, user submits native form on replacement panel | Executed (`Probe B2-A`) | Executed | **FAIL (`BLOCK-2` criteria 1, 3)**: `saveInPlace` ignores `pendingSave`, sends **2nd simultaneous POST** (`posts = 2`). |
| Reinjection during in-flight `saveInPlace` -> click `Save Question` (`saveInPlace`) | 1st `saveInPlace` POST hanging, replacement panel has `savingInPlace=false` | Executed (`Probe B2-B`) | Inspected (same path) | **FAIL (`BLOCK-2` criteria 1, 3)**: replacement `saveInPlace` sends **2nd simultaneous POST** (`posts = 2`). |
| Double reinjection during in-flight autosave -> click `Start autosave` | `inst1` POST hanging -> `inst2` clears `owner.inFlight = null` -> `inst3` gets `pendingSave = null` | Executed (`Probe B2-C`) | Executed | **FAIL (`BLOCK-2` criterion 1)**: clicking Start on 3rd panel sends **2nd simultaneous POST** (`posts = 2`). |
| Reinjection during in-flight autosave -> wait without clicking Start | `inst1` retired (`owner.gen !== myGen`), `inst2` does not attach to `inherited.request` | Executed (`Probe B2-D`) | Executed | **FAIL (`BLOCK-2` criteria 2, 3)**: server returns `Question saved successfully`, but `ocrQueue.i` stays `0` and UI never settles. |
| `Stop` -> `Clear` -> `Load` Batch 2 -> `Start` | Batch 1 `autoStep` POST hanging | Executed (`tests/key-bookmarklet.js:622-642`) | Executed | **PASS (`BLOCK-4`)**: Batch 2 posts immediately; Batch 1 settling does not advance Batch 2. |
| `saveInPlace` -> `Clear` / `Load` Batch 2 | `saveInPlace` POST hanging | Executed (`tests/key-bookmarklet.js:645-678`) | Executed | **PASS (`BLOCK-4`)**: Batch 1 settling leaves cleared/new queue and status untouched. |
| `Skip` during in-flight autosave | `autoStep` POST hanging | Executed (`tests/key-bookmarklet.js:681-693`) | Executed | **PASS (`BLOCK-4`)**: `ocr_skip` advances once (`i = 1`), late resolve does not double-advance. |
| `saveInPlace` #1 -> `Clear` -> `Load` Batch 2 -> `saveInPlace` #2 -> #1 resolves -> submit again | Batch 1 & Batch 2 `saveInPlace` overlapping | Executed (`Probe B4-A`) | Executed | **FAIL (`FIX-3`)**: `#1` sets `savingInPlace = false` before `run !== autoRun` guard; re-submit sends duplicate POST for Batch 2 (`posts = 3`). |
| Startup with malformed JSON / incompatible `ocrQueue`, `ansKey`, `ocrMeta` | `{bad json`, `{}`, `[]`, `{"items":null,"i":0}`, `["A"]`, `bogus` meta | Executed (`tests/key-bookmarklet.js:696-741`) | Executed | **PASS (`FIX-1`)**: no alert/error, panel renders, handlers work, queue/key normalized, `bogus` ignored. |
| Core refusal path execution | Missing `window.OCRParser`, version `2.3.0`, missing `parsePaste` | Executed (`tests/key-bookmarklet.js:785-810`) | Inspected | **PASS (`FIX-2`)**: `#ocr_error` banner, `console.error`, and thrown refusal verified in `vm`. |
| Unmocked clean 2-question autosave on disposable staging | Clean `localStorage` | Executed (`tests/key-bookmarklet.js:428-449`) | Executed | **PASS**: `Autosave complete: 2 of 2 saved.`, SQLite rows 102 (`correct_option=0`) and 103 (`correct_option=1`), no `ocrSubmitted`. |

## Findings

### `BLOCK-2` — Reinjection during an in-flight save fails closure criteria 1–3 on double reinjection, `saveInPlace`, and unstarted settlement

**Status:** Remains **OPEN** after round 2; escalates to **owner disposition**.

**Violated frozen closure criteria** ([`parser-convergence-2026-11-phase-1.md:176-181`](parser-convergence-2026-11-phase-1.md#L176-L181)):
> 1. Reinjecting while a key save is in flight must not allow a second POST for the same batch/index/question.
> 2. The already-started request must settle exactly once. A confirmed success advances and persists the queue once; a failure leaves the item queued once.
> 3. The replacement UI must show or safely block on the outstanding result rather than presenting an independently startable run with stale closure state.

**Reproduced defects on `b7b18cd` (`src/bookmarklets/key/entry.js` & rebuilt `src/bookmarklets/key/bookmarklet.js`):**

1. **Double reinjection loses `owner.inFlight` (`entry.js:155-156`):**
   `const inherited = owner.inFlight; owner.inFlight = null;` clears `owner.inFlight` upon the second activation, moving the promise only into the second instance's closure-local `pendingSave`. If the user activates the bookmarklet a third time before that request settles, `inherited` is `null` and `pendingSave` is `null`, so clicking `Start autosave` issues a duplicate POST (`Probe B2-C`: `calls = 2` in Node `vm`; `posts = 2` in Chromium).
2. **`saveInPlace` ignores `pendingSave` / `inherited` (`entry.js:328-358`):**
   When an autosave or `saveInPlace` POST is in flight and the user reinjects, `savingInPlace` starts as `false` and `auto` is `null`. Submitting the native form (`Save Question`) passes `if (savingInPlace)` and `if (auto && auto.running)` and immediately calls `postSave()`, issuing a duplicate POST for the same question (`Probe B2-A` & `B2-B`: `calls = 2` in Node `vm`; `Probe B2-A`: `posts = 2` in Chromium).
3. **Unstarted settlement is lost (`entry.js:289`, `entry.js:155-160`, `entry.js:522-524`):**
   Retiring Instance 1 returns early at `if (retired() || !auto || run !== autoRun) return;` (`entry.js:289`) without calling `queue.i++` or `save()`, while Instance 2 attaches no `.then()` handler to `inherited.request` unless the user later clicks `Start autosave`. When the in-flight request resolves as saved without a Start click, `ocrQueue.i` stays `0` in `localStorage` and the replacement panel stays idle on Question 1 (`Probe B2-D`: `queue.i = 0` in Node `vm` and Chromium after `Question saved successfully` resolved).

**Required closure contract (unchanged from round 1):** Frozen criteria 1–5 and non-goals in `parser-convergence-2026-11-phase-1.md:174-196` remain authoritative unless explicitly modified by owner disposition.

### `FIX-3` — Stale `savingInPlace = false` reset before `retired() || run !== autoRun` guard allows duplicate POST on replacement batch

- **Severity justification:** `pc-01-product-separation.md:59` requires: *"Real key entry preserves answer-key fill, Stop behavior, in-flight-save settlement, and the existing key/autosave tests from `793cb8f`."* This does not meet `BLOCK` because core single-batch `savingInPlace` locking and `BLOCK-4`'s cross-batch queue/status isolation both work; the duplicate POST occurs only when an abandoned `saveInPlace` request from a prior batch settles while a replacement batch's `saveInPlace` is simultaneously in flight and the user triggers `Save Question` a second time before the replacement request completes.
- **Exact defect:** In `src/bookmarklets/key/entry.js:361`, `savingInPlace = false;` executes unconditionally before `if (retired() || run !== autoRun) return;` (`entry.js:364`). If `saveInPlace` #1 starts (`run = 0`), the user clicks `Clear list` and `Load questions` (`autoRun` becomes `2`, `savingInPlace` reset to `false`), and starts `saveInPlace` #2 (`savingInPlace = true`), then when #1 resolves before #2, line `361` resets `savingInPlace = false` even though #2 is still in flight. A subsequent form submit sends a duplicate POST for Batch 2 (`Probe B4-A`: `calls = 3` in Node `vm`, `posts = 3` in Chromium).
- **Supported operating preconditions:** Authenticated Add Question page with `src/bookmarklets/key/bookmarklet.js` loaded, one slow/hanging `saveInPlace` request followed by `Clear list` / `Load questions` and a second `saveInPlace` request on the new list.
- **Finite closure criteria:**
  1. In `src/bookmarklets/key/entry.js`, `saveInPlace()`'s `.then()` continuation must check `if (retired() || run !== autoRun) return;` (or match the exact in-flight token) **before** setting `savingInPlace = false`.
  2. Add a failing-first executable regression in `tests/key-bookmarklet.js` running the rebuilt `src/bookmarklets/key/bookmarklet.js` that reproduces `Probe B4-A` (`saveInPlace` #1 -> `Clear` -> `Load` -> `saveInPlace` #2 -> #1 resolves -> submit again) and proves `calls === 2`.
  3. Rebuild `src/bookmarklets/key/bookmarklet.js` and pass full Node/PHP baselines.
- **Required evidence:** Failing-first before/after test output on rebuilt `src/bookmarklets/key/bookmarklet.js`, passing `node tests/key-bookmarklet.js` and full baselines.
- **Non-goals / deferred checks:** No changes to `ocr_helper.js`, parser modules, `src/ui/ui.js`, `src/bookmarklet.js`, or `deployed/*.php`.

## Externalize-First Independent Verification

### Ref and Boundary Checks

- `git merge-base --is-ancestor bb78c57 HEAD` → exit `0`.
- `git diff --exit-code bb78c57..HEAD -- src/parser/core.js src/parser/parser.js src/ui/ui.js src/bookmarklet.js deployed fixtures tests/fixtures` → exit `0` (zero changes).
- `git diff --exit-code 94a7593:ocr_helper.js HEAD:ocr_helper.js` → exit `0` (deployed helper byte-identical to published baseline `94a7593`).
- Live-origin diff against archived snapshots: `+51/-47` (`archive/live-sources/ocr_helper-2026-11-01.js`), `+51/-45` (`archive/live-sources/ocr_helper.js` and `archive/live-sources/ocr_helper_deployed.js`) — within the 100-addition cap, no Gate 1 exception required.

### Per-File Measurements (from package base `bb78c57` and round-1 `88daa73`)

| Path | Diff vs `bb78c57` | Fix diff vs `88daa73` | Final lines / bytes / sha256 | Responsibility & Deployment | Direct Production-Path Test |
|---|---|---|---|---|---|
| `ocr_helper.js` | `+16/-316` | `0/0` | `127` L / `4,917` B / `b83835b7...` | Deployed manual helper only; loaded by `deployed/admin_questions.php:1050-1051` after `core.js` | `node tests/ocr-helper.js` (`38` PASS); Chromium staging verified |
| `src/bookmarklets/key/entry.js` | `+525/-0` | `+163/-36` | `525` L / `21,600` B / `62d1945e...` | Key/autosave entry (key fill, dry run, autosave, Stop, in-place save, storage normalization); inlined only by `build.js` | Real generated artifact executed by `tests/key-bookmarklet.js` (`33` PASS) + `runKeyEntry` `vm` + Chromium staging |
| `src/bookmarklets/key/boot.js` | `+12/-0` (moved) | `0/0` | `12` L / `589` B / `52432cd4...` | Key-product panel handover; prepended by `build.js` | Same artifact suite + Chromium staging |
| `src/bookmarklets/key/build.js` | `+44/-0` (moved) | `0/0` | `44` L / `1,364` B / `74753557...` | Deterministic `core.js` + `boot.js` + `entry.js` key bookmarklet builder; repo tool | `tests/key-bookmarklet.js` executes `build.js` and checks determinism |
| `tests/ocr-helper.js` | `+40/-328` | `0/0` | `658` L / `30,476` B / `162d63ce...` | Deployed-helper and parser test suite | `node tests/ocr-helper.js` |
| `tests/key-bookmarklet.js` | `+822/-0` | `+288/-6` | `822` L / `37,840` B / `c757ff49...` | Key-bookmarklet suite executing real artifact and `entry.js` | `node tests/key-bookmarklet.js` |

### Excluded / Unchanged Artifacts

- `src/bookmarklets/key/bookmarklet.js`: generated artifact (`1` L / `69,784` B / sha256 `e62a66e7...`; `1` L diff vs `88daa73`), excluded from source line limits and executed directly by `tests/key-bookmarklet.js` and Chromium staging.
- `src/bookmarklet.js`: unchanged generated stimulus artifact (`1` L / `101,337` B / sha256 `bf5837e4...`), rebuilt deterministically to the same hash.
- `src/parser/core.js` (`1,733` L / `60,722` B / `c9ac52b3...`), `src/parser/parser.js` (`1,337` L / `50,419` B / `0a9bff5f...`), `src/ui/ui.js` (`1,431` L / `61,701` B / `1e1f8007...`), `deployed/*.php`, `fixtures/`, `tests/fixtures/`: byte-identical to `bb78c57`.
- `experiments/key-bookmarklet/{boot.js,build.js,bookmarklet.js}`: removed in PC01 (moved/replaced by `src/bookmarklets/key/`).
- `src/bookmarklet.min.js`: absent/untracked, not built or used.
- `tools/phone-staging/*` and disposable SQLite staging root: test infrastructure only; staging files and `.playwright-mcp/` removed.
- **Unverified / deferred:** `php tests/cbt-staging.php` (requires EL01 MySQL URL gate; no PHP changed), mobile Brave/Android visual check (PC02/PC06 gate), and live deployment / live DB writes (prohibited by PC01 and `docs/LIVE-SAFETY.md`).

## Commit Readiness and Review Status

- **Verdict:** `BLOCK`
- **Commit readiness:** no
- **Scratch-cycle merge readiness:** no
- **Review status:** phase 1 re-review complete; `BLOCK-1`, `BLOCK-3`, `BLOCK-4`, `FIX-1`, and `FIX-2` closed; `BLOCK-2` remains open after two review rounds and escalates to owner disposition; new first-round `FIX-3` recorded.
- **Dependent work:** PC02 remains blocked until `BLOCK-2` is disposed/resolved and `FIX-3` is settled.

## Recommended Next Action

Because `BLOCK-2` has now survived two review rounds (`parser-convergence-2026-11-phase-1.md` and this re-review), route `BLOCK-2` to owner disposition via `finding-disposition.md`. Once `BLOCK-2` receives its owner disposition, address `FIX-3` (and `BLOCK-2` if the owner chooses `fix`) in `fix-session.md` before re-reviewing. Do not start PC02, merge `scratch/pc01-product-separation`, or edit real branches.

NEXT COMMAND: @docs/plan/prompts/finding-disposition.md phase 1 BLOCK-2
