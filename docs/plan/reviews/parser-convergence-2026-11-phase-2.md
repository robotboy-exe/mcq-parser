# Parser Convergence 2026-11 Phase 2 Review

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 2
- **Package:** PC02, Single Parser Source ([`pc-02-single-parser-source.md`](../parser-convergence/pc-02-single-parser-source.md))
- **Mode:** original rigorous review (review round 1)
- **Candidate:** pushed `origin/scratch/pc02-single-parser-source` at exact commit `01e2c02028053c9ae7d08e18e1bf1886efe7512c` (docs-only child recording pushed implementation commit `659299158e496e177c0f8c753b2d5e4eea744563`; `git diff --stat 6592991 01e2c02` touches only `pc-02-single-parser-source.md`)
- **Package base:** `0279e707757f31d753b98ea9e1f14239eb1ca62e` (`origin/scratch/parser-convergence-cycle`, whose product tree matches PC01 reviewed candidate `cc72e3bb6c44aeac9008be886480759bebdcf30d` with empty diff on `:!docs/` and `:!AGENTS.md`)
- **Review environment:** clean detached worktree (`$HOME/tmp/pc02-review-wt`) at `01e2c02028053c9ae7d08e18e1bf1886efe7512c`; Node v26.13.0, PHP 8.5.12 CLI, and headless Chromium `Chrome/157.0.8103.38` via `chromium-cdp` (port 9225) + Playwright CDP against disposable SQLite staging (`127.0.0.1:3023`, `tools/start-phone-staging.sh`). Temporary worktree, staging files, and `.playwright-mcp/` were removed after verification; no repository branch or product file was modified.

## Verdict

**PASS WITH ACCEPTED FINDINGS.** Zero `BLOCK` and zero `FIX` findings; two non-blocking documentation/coverage notes (`NOTE-1`, `NOTE-2`) are recorded. All PC02 code, build, facade, single-source guard, Node/PHP baseline, Node `vm`, and disposable desktop Chromium bookmarklet execution checks pass on `01e2c02`. The package remains `in progress` and is **not ready to mark `done` or merge into `scratch/parser-convergence-cycle`** until the external **Brave bookmarklet installability** gate (especially for the `131,268`-byte stimulus artifact under `D-110`) is executed and recorded by the owner.

## Acceptance Coverage

| Acceptance Row (`pc-02-single-parser-source.md:49-57`) | Result | Independent Evidence |
|---|---|---|
| Core identity | **PASS** | `src/parser/core.js` (`1,733` L / `60,722` B, sha256 `c9ac52b3…`) is byte-identical to package base `0279e70`. `node tests/runner.js` (`68` PASS / `0` FAIL / `0` PENDING) and `node tests/unit.js` (`173` PASS) pass; `tests/single-source.js` and `ADV-VM-1`/`ADV-VM-2` confirm exact `core.parsePaste` parity from both generated artifacts. |
| Facade | **PASS** | `src/parser/parser.js` (`7` L / `363` B, sha256 `b6fe5305…`) re-exports exact `core.js` identities (32 keys) plus only the 31 named helpers from `src/bookmarklets/stimulus/autosave.js` (`63` keys total, exact 1:1 match with `0279e70:src/parser/parser.js` exports; see enumeration below). |
| Source guard | **PASS** | `tests/single-source.js` (`15` PASS) plus independent `rg` scan across `src/`, `tools/`, `ocr_helper.js`, and `tests/` (excluding generated bookmarklets) confirm only `src/parser/core.js` defines `OPTION`, `splitQuestions`, `splitRegions`, `parseQuestion`, `extractStimuli`, `extractStimulusMarkers`, `extractStimulusIntros`, and all remaining parser functions. |
| Generated products | **PASS (desktop Chromium); PENDING (Brave)** | `src/bookmarklet.js` (`1` L / `131,268` B) and `src/bookmarklets/key/bookmarklet.js` (`1` L / `71,422` B) are one line, pass `new Function` and `node --check`, rebuild deterministically, carry one `PARSER_VERSION = "2.5.4"` and one `const OPTION`, contain zero `%HH` escapes, and install/execute via real `<a href="javascript:...">` links in headless Chromium (`Chrome/157.0.8103.38`) on staging `admin_questions.php`. Brave installability is not testable in this environment and remains the pending external gate. |
| Surface behavior | **PASS** | Real Chromium staging verified all three surfaces: stimulus bookmarklet (`src/bookmarklet.js`) replaced the deployed panel, ran Dry run (`COMPLETE — all 2 would save as ACTIVE.`), and autosaved 2 rows (`2` POSTs); key bookmarklet (`src/bookmarklets/key/bookmarklet.js`) replaced the deployed panel, kept `Bookmarklet paste`, and autosaved 2 rows (`2` POSTs); untouched deployed `ocr_helper.js` filled Q1 without ticking radios and saved 1 row via native submit (`1` POST). Zero page or console errors. |
| Tests | **PASS** | Full Node baseline (`68` / `173` / `38` / `42` / `10` / `7` / `26` / `69`), `tests/single-source.js` (`15`), `tools/extract-bank.js --check` (`7` hashes), both `--check` build guards, and PHP `8.5.12` CLI baseline (`33` / `8` / `14`, `7/7` `php -l`) all pass. |
| Safety | **PASS** | No deploy, live site request/write/delete, schema change, or real-branch change. |

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc02-review-wt` (`01e2c02028053c9ae7d08e18e1bf1886efe7512c`):

| Command | Result |
|---|---|
| `node tests/runner.js` | `68` fixtures: `68` PASS, `0` FAIL, `0` PENDING |
| `node tests/unit.js` | `173` PASS, `0` FAIL |
| `node tests/ocr-helper.js` | `38` PASS |
| `node tests/key-bookmarklet.js` | `42` PASS (rebuilds and exercises `src/bookmarklets/key/bookmarklet.js`) |
| `node tests/underline-toolbar.js` | `10` PASS |
| `node tests/question-preview.js` | `7` PASS |
| `node tests/math-tool.js` | `26` PASS |
| `node tests/render-markup.js` | `69` PASS |
| `node tests/single-source.js` | `15` PASS |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, and `7` output hashes match |
| `node src/build/build.js --check` | `Current: .../src/bookmarklet.js matches its sources (131267 bytes)` |
| `node src/bookmarklets/key/build.js --check` | `Current: .../src/bookmarklets/key/bookmarklet.js matches its sources (71421 bytes)` |
| `node --check` on stripped `src/bookmarklet.js` and `src/bookmarklets/key/bookmarklet.js` | Exit `0` on both |
| `php tests/php-render.php` | `33` PASS (PHP 8.5.12 CLI) |
| `php tests/admin-question-store.php` | `8` PASS (PHP 8.5.12 CLI) |
| `php tests/cbt-question-order.php` | `14` PASS, `0` FAIL (PHP 8.5.12 CLI) |
| `for f in deployed/*.php; do php -l "$f"; done` | `7/7` syntax checks pass (PHP 8.5.12 CLI) |

## Completeness Enumerations

### 1. Facade Export & Browser-Global Equivalence (`0279e70:src/parser/parser.js` vs `01e2c02:src/parser/parser.js` / `core.js + autosave.js`)

Executed in Node `vm` against `git show 0279e70:src/parser/parser.js` and candidate `01e2c02`:

- **Node `module.exports` count:** `63` in `0279e70:src/parser/parser.js`, `63` in `01e2c02:src/parser/parser.js` (`32` from `src/parser/core.js` + `31` from `src/bookmarklets/stimulus/autosave.js`). Missing in new facade: `[]`. Extra in new facade: `[]`.
  - **Core exports (`32`):** `version`, `FIXES`, `OPTION`, `KEY_LINE`, `PLACEHOLDER`, `STEM_LINE`, `KEY_WORD`, `INLINE_PAIR`, `LOOSE`, `parseHeader`, `pickSubjectIndex`, `pickCategoryIndex`, `splitRegions`, `splitQuestions`, `splitBulletQuestions`, `splitQuestionItems`, `splitQuestionRegions`, `parseQuestion`, `parseStimulusRange`, `extractStimuli`, `applyStimulusFlags`, `flagNumberingGaps`, `splitSections`, `salvageNormalize`, `splitSectionsWithSalvage`, `keyPairs`, `parseKeyDetailed`, `parseKey`, `parsePaste`, `comprehensionEngine`, `clozeEngine`, `linkComprehension`.
  - **Stimulus autosave exports (`31`):** `SAVE_SUCCESS`, `newBatchId`, `byteLength`, `normalizeAnswer`, `optionLetters`, `isConsecutiveQueue`, `keyCoversQueue`, `appendSavedLog`, `mergeSavedLog`, `commitSave`, `heartbeatTick`, `checkListUrl`, `sameMeta`, `maxSavedId`, `savedForBatch`, `deriveLiveState`, `makeSavedFingerprint`, `savedLogPriorDuplicate`, `unverifiedSaves`, `trackUnverified`, `savedModeSuffix`, `formatSavedRange`, `makeBatchHistoryEntry`, `upsertBatchHistory`, `recentRowsFromTable`, `recentDuplicate`, `savedLogHasNum`, `formMatchesQuestion`, `autosaveBlockers`, `blockerText`, `classifySaveResponse`.
- **Browser global equivalence (no `module.exports`):** running `core.js` + `autosave.js` defines every global previously defined by `0279e70:src/parser/parser.js` (missing: `[]`), plus `25` canonical `core.js` RM01/comprehension/cloze symbols (`regionHeading`, `regionInstruction`, `structuralOptionText`, `inlineOptionSet`, `regionLineKind`, `headRegionGroups`, `splitRegions`, `splitQuestionRegions`, `trimStimulusRun`, `hasCompleteOptionSet`, `optionInlineMatches`, `comprehensionEngine`, `clozeEngine`, `mergeClozeItems`, `renumberContexts`, `linkComprehension`, `keyWarnings`, `parseBody`, `detectContexts`, `collidingNumbers`, `dedupeCloze`, `parsePaste`, `OCRParser`, `OCRComprehension`, `OCRCloze`).
- **Verbatim extraction check:** `diff -u` of `0279e70:src/parser/parser.js` lines `746–1337` against `src/bookmarklets/stimulus/autosave.js` shows only the 3-line header comment at lines `1–3` and the removal of `require('./core.js')` + `...core` spread at lines `555–560`.

### 2. Single-Source Definition Scan

`rg` across `src/`, `tools/`, `ocr_helper.js`, and `tests/` (excluding generated `src/bookmarklet.js`, `src/bookmarklets/key/bookmarklet.js`, `src/bookmarklet.min.js`) for function/variable definitions of `OPTION`, `KEY_LINE`, `PLACEHOLDER`, `STEM_LINE`, `KEY_WORD`, `INLINE_PAIR`, `LOOSE`, `splitSections`, `splitSectionsWithSalvage`, `splitQuestionItems`, `splitQuestions`, `splitRegions`, `parseQuestion`, `parsePaste`, `parseKey`, `parseKeyDetailed`, `salvageNormalize`, `parseHeader`, `pickSubjectIndex`, `pickCategoryIndex`, `applyStimulusFlags`, `flagNumberingGaps`, `extractStimuli`, `extractStimulusMarkers`, `extractStimulusIntros`:

- Only `src/parser/core.js` defines any of these symbols.
- `ocr_helper.js:11–14` only binds local aliases from `window.OCRParser` / `require('./src/parser/core.js')`.
- `src/parser/parser.js:1–7` only spreads `require('./core.js')` and `require('../bookmarklets/stimulus/autosave.js')`.

### 3. Literal `%` Scan in Generated Artifacts

- `src/bookmarklet.js`: `1` occurrence of `%` (`le (out.length % 8 !== 0); } re`, modulo operator in `expandTabs`). Zero `%HH` matches.
- `src/bookmarklets/key/bookmarklet.js`: `2` occurrences of `%` (`le (out.length % 8 !== 0); } re` and `tyle="width:100%;height:10px"><`). Zero `%HH` matches.

## Adversarial Investigation & Scenario Matrix

### Highest-Risk Interactions Examined

1. **Stimulus bookmarklet parity with canonical `core.js` vs stale `0279e70:parser.js`:** Confirmed in Node `vm` (`sample-comprehension-multi.txt` previously leaked `PASSAGE I` / `PASSAGE II` into option D / stem under `0279e70:parser.js` and now uses canonical `core.js`; `sample-uppercase-paren-q51.txt` parses `(A) frank ... (C) evasive` identically to `core.js` inside the real `src/bookmarklet.js` UI).
2. **`javascript:` URL decoding with modulo `%` (`out.length % 8`) under `D-110`:** Real Chromium click on `<a href="javascript:...">` executed both `src/bookmarklet.js` (`131,202` chars) and `src/bookmarklets/key/bookmarklet.js` (`71,375` chars) and parsed `sample-cloze-tabs.txt` (which exercises `expandTabs` modulo `out.length % 8`) cleanly with zero errors.
3. **Stale-output and `%HH` build guards:** Verified in isolated temp copy (`ADV-VM-3`) that replacing `src/bookmarklet.js` with `0279e70:src/bookmarklet.js` or mutating `src/bookmarklets/key/bookmarklet.js` fails `--check` with `stale build`, rebuilding deterministically restores `--check`, and adding `%20` / `%2A` to source causes both builders to fail with `percent-escape`.
4. **Product isolation over deployed `admin_questions.php`:** Real Chromium staging verified `src/bookmarklet.js` and `src/bookmarklets/key/bookmarklet.js` each remove the deployed `#ocr_input` panel on click without interfering with untouched deployed `ocr_helper.js` behavior on fresh page load.

### Scenario Matrix

| Scenario / Action | State | Evidence Type | Outcome |
|---|---|---|---|
| `src/bookmarklet.js` clicked via `<a href="javascript:...">` over deployed `admin_questions.php`, Load `bank-2021` + `sample-uppercase-paren-q51` + `sample-cloze-tabs` (`ADV-VM-1`, `ADV-VM-2`) | Deployed page with `core.js?v=2.5.4` + `ocr_helper.js?v=2.4.7` | Executed (Node `vm` + Chromium staging) | **PASS:** deployed panel removed; `OCRParser.version === '2.5.4'`; `q51` options `frank`/`evasive`; `clozeTabs` `2` items |
| `src/bookmarklet.js` 2-question keyed paste -> Dry run -> Start auto-save | Fresh staging login + clean storage | Executed (Chromium staging) | **PASS:** `stimDryText = 'COMPLETE — all 2 would save as ACTIVE.'`, `2` POSTs, `2 saved` |
| `src/bookmarklets/key/bookmarklet.js` clicked via `<a href="javascript:...">` -> Load 2-question keyed paste -> Start autosave | Deployed page + selected metadata | Executed (Chromium staging) | **PASS:** `titleText = 'Bookmarklet paste'`, `2` POSTs, `'Autosave complete: 2 of 2 saved.'` |
| Untouched deployed `ocr_helper.js` Load -> manual radio tick -> native Submit | Clean storage on `admin_questions.php` | Executed (Chromium staging) | **PASS:** `checked = 0` after Load, `1` POST on Submit |
| `node src/build/build.js --check` against `0279e70:src/bookmarklet.js` and `key/build.js --check` against mutated key artifact (`ADV-VM-3`) | Stale generated artifact | Executed (isolated temp copy) | **PASS:** both exit non-zero (`stale build`); rebuild restores `--check` exit `0` |
| `%20` / `%2A` literal percent-escape injected in source (`ADV-VM-3`) | Source edit before build | Executed (isolated temp copy) | **PASS:** both builders throw `percent-escape` |
| Brave / Android installation of `src/bookmarklet.js` (`131,268` B) and `src/bookmarklets/key/bookmarklet.js` (`71,422` B) | Target mobile/desktop Brave bookmark manager | **UNVERIFIED (external gate)** | Pending owner check; no Brave/Android runtime in this environment |

- **Material unverified / deferred scenarios:** Brave/Android bookmarklet installability (owner external gate for `D-110` / `131,268`-byte stimulus artifact); `php tests/cbt-staging.php` (requires MySQL staging URL; no PHP changed); live site writes/deletes (prohibited).

## Findings

No `BLOCK` and no `FIX`.

### NOTE-1 — `AGENTS.md` command list lags `docs/AGENTS.md` for `tests/single-source.js` and `--check`

- **Evidence:** `docs/AGENTS.md:335` lists `node tests/single-source.js`, whereas `AGENTS.md:30` omits `node tests/single-source.js` from its inline test list and `AGENTS.md:36` omits `--check`.
- **Severity justification:** `pc-02-single-parser-source.md:49-57` requires single-source and stale-build guards in code and tests, and `docs/BUILD.md` and `docs/AGENTS.md` already document both; `AGENTS.md:30,36` is a developer-convenience summary omission that does not violate any acceptance row, code path, or safety guardrail. Correct when reconciling PC02 to `done`.

### NOTE-2 — `tests/single-source.js` does not mount the stimulus UI from `src/bookmarklet.js`, and `tests/ui-harness.js` injects `parser.js`

- **Evidence:** `tests/single-source.js:176-203` evaluates `src/bookmarklet.js` with `querySelector: () => null` (causing `runOCRBookmarklet()` in `src/ui/ui.js:7-12` to return early after `alert`), so it tests only `sandbox.OCRParser.parsePaste`, while `tests/ui-harness.js:9,371-373` mounts `src/ui/ui.js` with `require('../src/parser/parser.js')` rather than executing the generated `src/bookmarklet.js` artifact.
- **Severity justification:** `pc-02-single-parser-source.md:56` requires "real build-output VM probes, stale-build check, core/facade identity checks", which `tests/single-source.js` satisfies for `OCRParser.parsePaste` (`tests/single-source.js:176-203`), and this review independently verified full UI mounting and parsing of `src/bookmarklet.js` in both Node `vm` (`ADV-VM-1`/`ADV-VM-2`) and real Chromium staging; therefore this is a durable test-strength residual rather than missing current evidence.

## Externalize-First Independent Verification

### Ref and Boundary Checks

- `git diff --stat 6592991 01e2c02` → only `docs/plan/parser-convergence/pc-02-single-parser-source.md` (`+4/-2`, recording `Commit: 6592991`).
- `git diff --stat cc72e3b 0279e70 -- ':!docs/' ':!AGENTS.md'` → empty (base `0279e70` product tree equals reviewed PC01 candidate `cc72e3b`).
- `git diff --exit-code 0279e70..01e2c02 -- src/parser/core.js src/ui/ui.js ocr_helper.js src/bookmarklets/key/entry.js src/bookmarklets/key/boot.js src/bookmarklets/key/bookmarklet.js deployed fixtures tests/fixtures` → exit `0` (all protected paths byte-identical to package base `0279e70`).
- Live-origin cap: no live-origin PHP file changed; `src/parser/parser.js` shrunk (`+6/-1336`); no Gate 1 cap exception required.

### Per-File Measurements (`0279e70` → `01e2c02`)

| File | `numstat` vs `0279e70` | Base (L / B / sha256) | Final (L / B / sha256) | Responsibility & Deployment | Production-Path Test |
|---|---|---|---|---|---|
| `src/parser/parser.js` | `+6/-1336` | `1,337` L / `50,419` B / `0a9bff5f…` | `7` L / `363` B / `b6fe5305…` | Thin Node compatibility facade over `core.js` + `autosave.js`; never inlined into bookmarklets | `tests/single-source.js`, `tests/unit.js` |
| `src/bookmarklets/stimulus/autosave.js` | `+592/-0` | absent | `592` L / `24,853` B / `48b96bfb…` | Pure stimulus autosave, saved-log, duplicate, and save-classification helpers; inlined by `src/build/build.js` into `src/bookmarklet.js` and re-exported by `parser.js` | `tests/unit.js`, `tests/single-source.js`, Chromium staging on `src/bookmarklet.js` |
| `src/build/build.js` | `+21/-7` | `258` L / `7,232` B / `648e2fcb…` | `272` L / `8,028` B / `57416b3a…` | Builds `src/bookmarklet.js` from `core.js` + `autosave.js` + `ui.js`, enforces `%HH` guard (`D-110`), supports `--check` | `node src/build/build.js --check`, `tests/single-source.js`, `ADV-VM-3` |
| `src/bookmarklets/key/build.js` | `+13/-3` | `44` L / `1,364` B / `74753557…` | `54` L / `1,790` B / `e77ba1e7…` | Builds `src/bookmarklets/key/bookmarklet.js` from `core.js` + `boot.js` + `entry.js`, supports `--check` | `node src/bookmarklets/key/build.js --check`, `tests/key-bookmarklet.js`, `tests/single-source.js`, `ADV-VM-3` |
| `tests/single-source.js` | `+213/-0` | absent | `213` L / `9,193` B / `01b91378…` | Static second-source, facade identity, autosave policy, artifact, `%HH`, parity, and `--check` test suite (`15` checks) | `node tests/single-source.js` |

### Excluded / Unchanged Artifacts

- `src/bookmarklet.js`: generated artifact (`+1/-1` vs `0279e70`, `1,733`+`592`+`1,431` flattened -> `1` L / `131,268` B on disk, `131,267` B stripped, sha256 `445f9235…`; base `1` L / `101,337` B, `bf5837e4…`), excluded from source limits, verified via `new Function`, `node --check`, `tests/single-source.js`, `ADV-VM-1`/`ADV-VM-2`, and Chromium staging.
- `src/bookmarklets/key/bookmarklet.js`: unchanged generated artifact (`1` L / `71,422` B on disk, `71,421` B stripped, sha256 `8d8c1a33…`), verified by `--check`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and Chromium staging.
- `src/parser/core.js` (`1,733` L / `60,722` B, `c9ac52b3…`), `src/ui/ui.js` (`1,431` L / `61,701` B, `1e1f8007…`), `ocr_helper.js` (`127` L / `4,917` B, `b83835b7…`), `src/bookmarklets/key/{boot,entry}.js`, `deployed/*.php`, `fixtures/`, `tests/fixtures/`: byte-identical to package base `0279e70`.
- `src/bookmarklet.min.js`: absent/untracked, untouched.
- Docs (`0279e70..01e2c02`): `AGENTS.md` (`+3/-3`), `docs/AGENTS.md` (`+15/-11`), `docs/BUILD.md` (`+24/-11`), `docs/DECISIONS.md` (`+21/-0`), `docs/INVARIANTS.md` (`+1/-1`), `docs/STATUS.md` (`+22/-2`), `docs/plan/README.md` (`+27/-21`), `docs/plan/parser-convergence/pc-02-single-parser-source.md` (`+57/-5`), `docs/plan/prompts/phase-map.md` (`+6/-6`).

## Approvals, Commit Readiness, and Next Action

- **Approvals:** `D-110` (`%HH` build guard preserving `core.js` `out.length % 8`) is documented in `docs/DECISIONS.md:1826-1845` and `pc-02-single-parser-source.md:69-73`. No live-origin cap exception, deploy, live action, or real-branch change was requested or performed.
- **Commit readiness:** `01e2c02` (`6592991`) is already pushed on `origin/scratch/pc02-single-parser-source` and is review-clean for all local/desktop evidence; however, PC02 stays `in progress` and is **not ready to mark `done` or merge into `scratch/parser-convergence-cycle`** until the owner runs and records the external Brave bookmarklet installability check (and optionally clears `NOTE-1`/`NOTE-2` when recording the external gate).
- **Review status:** Phase 2 original rigorous review complete (`PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`, `NOTE-1`–`NOTE-2`); no fix session is required.

NEXT COMMAND: Run the owner Brave bookmarklet installability check for src/bookmarklet.js and src/bookmarklets/key/bookmarklet.js on origin/scratch/pc02-single-parser-source (01e2c02), then report pass or fail
