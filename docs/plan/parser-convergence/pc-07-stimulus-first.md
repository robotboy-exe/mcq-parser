# PC07 — Stimulus-First Convergence

- **Status:** in progress (Phase 7 fix session for `BLOCK-12`–`BLOCK-22` complete; `Commit: deferred`; awaiting independent Phase 7 re-review)
- **Phase:** 7
- **Depends on:** PC01–PC03 settled (`scratch/parser-convergence-cycle`) and Gate 1 `go` approved (2026-11-26)
- **Package base:** `9afe4f8` (settled `scratch/parser-convergence-cycle` tip)
- **Implementation branch:** `scratch/pc07-stimulus-first` (isolated worktree `/data/data/com.termux/files/home/projects/ocr-parser-pc07`)
- **Donor snapshot ref:** `ed96b11` (owner-confirmed `D1` 2026-11-26: tracked/rebuilt `ed96b11:src/bookmarklet.js` is `119,555 B` LF SHA-256 `dcde1c25172a59506281d46d3d21d0d0d8750bd8b646f8bc453d5a1dc061c1cc`, `119,554 B` URL without LF `3d8d4ca47917fdc1ece5e2845125e0715de143e6825c610149300a76d9fb3632`, superseding the stale `4fa7d907…` prefix; plus `ed14323` cross-verified PC04 candidate)
- **Rollback reference:** `9afe4f8:src/bookmarklets/key/bookmarklet.js` (also retained built on this branch at `src/bookmarklets/key/bookmarklet.js` until desktop + owner Brave/Android verification and a separate reviewed retirement diff)
- **External gate:** desktop + owner Brave/Android check of installed `src/bookmarklet.js` before any key-only retirement diff
- **Start:** [scratch session prompt](../prompts/stimulus-convergence-scratch.md)

## Approved cycle amendment and row mapping

Per the 2026-11-26 Gate 1 `go` approval under `docs/plan/prompts/stimulus-convergence-scratch.md`:

- Converge on two supported products over single canonical `src/parser/core.js` (`2.5.8`):
  1. deployed manual helper (`ocr_helper.js?v=2.4.11` loaded after `src/parser/core.js?v=2.5.8` by `deployed/admin_questions.php`) — manual paste Load/fill/POST only;
  2. one supported stimulus-first bookmarklet (`src/bookmarklet.js`, built from `core.js` + `src/bookmarklets/stimulus/autosave.js` + `src/bookmarklets/stimulus/image-plan.js` + `src/bookmarklets/stimulus/save-flight.js` + `src/ui/ui.js`) preserving all working features of `ed96b11` (Constant Text routing/clearing, RAM-cached PNG upload, ready-image autosave within an attached row's range, `PAUSED (IMAGE)` pause when uncovered/unranged, `[missing text]` block, single/bulk image picker, key-only load, diagnostics `#ans_diag`, anchored `[diagram]`/`constantText`/leading stimulus extraction, gap recovery) alongside PC01 concurrency/storage/provenance hardening.
- `PC01`–`PC03` stay `done` on `scratch/parser-convergence-cycle`. Unfinished `PC04`–`PC06` stay preserved under `docs/plan/parser-convergence/` and `docs/plan/reviews/` as historical evidence and are mapped below to PC07 gates and carried open findings.

| Unfinished item | Mapping in PC07 | Status at handoff |
|---|---|---|
| `PC04` `BLOCK-10` (`V10`: `25 in the table is the cash deposit.` → `[20, 21, 22]`) | Implemented in `stimulusIntroRangeText` locator termination (`core.js`); frozen check + controls verified across core, helper, key comparator, stimulus, and 3-surface staging Load | **Closed** by Phase 7 review (`5711f96`) |
| `PC04` `BLOCK-11` (`V11`: `25 in the same section.` → `[20, 21, 22, 25]`) | Implemented in `stimulusIntroRangeText` (`same` locator added); frozen check + `V11-ctrl` verified across core, helper, key comparator, stimulus, and 3-surface staging Load | **Closed** by Phase 7 review (`5711f96`) |
| `PC04` `BLOCK-1`–`BLOCK-9` & `[diagram]` marker | Implemented (`[diagram]` / `[[diagram]]`, balanced bracket checks, `N1`–`N5`/`V6`/`V9`/`adv-bank`/`S1`–`S5`/`G1`–`G4`/`V8`/`A1`–`A3`/`R1`, Q18–Q23 explicit precedence) | Covered by unit/runner/staging suites |
| `PC05` anchored inter-question stimulus, leading stimulus, gap recovery, wrap safety | Implemented (`extractAnchoredInterQuestionBlocks`, `extractLeadingStimuli`, `applyStimulusFlags`, `inStimulusBlock`, `inferMissingGapNums`, `MISSING_TEXT_RE` / `MISSING_TEXT_FLAG`); `new-edge-inter-question-{text,diagram}` & `new-edge-image-intro-marker` fixtures | Covered by unit/runner/staging suites |
| `PC06` stimulus image/missing policy & PC01 concurrency/provenance | Implemented in `src/bookmarklets/stimulus/autosave.js` and `src/ui/ui.js` (`constantText`, `constant-long`, `missing-text`, `cacheFileInMemory`, `Text block`/`Image block`, `form.__ocrStimulusCleanup()`, `owner.inFlight`, defensive `ocrSubmitted` delete, corrupted storage normalization, `keyAppliesForQueue()`) | Covered by unit Track 2 & real Chromium staging |
| `PC06` key-only retirement & release bundle | Explicitly **deferred**: `src/bookmarklets/key/bookmarklet.js` remains built (`2.5.8` pin) as comparator & rollback reference until Phase 7 settles, owner accepts desktop + Brave/Android checks, and a separate reviewed retirement diff lands | Open external / follow-up gate |

## Failing-first summary

Before `src/parser/core.js` changes on `9afe4f8`:
- `ed14323` failed `V10` (`[20, 21, 22, 25]` instead of `[20, 21, 22]`) and `V11` (`[20, 21, 22]` instead of `[20, 21, 22, 25]`), leaked PC05 inter-question tails (`new-edge-inter-question-text` Q19 option D contained `Use the information below...` with `ct=false`), left `new_sample.txt` Q17–Q18 unextracted, and left Q38 unflagged (`[missing text] placeholder`).
- `9afe4f8` failed `new-edge-image-intro-marker` (`nums=[]`) and had no `[diagram]`, `constantText`, `cacheFileInMemory`, ready-image autosave, or PC05 anchored extraction.

## Implementation changes

- `src/parser/core.js` (`PARSER_VERSION = '2.5.7'`, `2,312 L / 85,791 B`, SHA-256 `f9e88c31…`, `+513/-56` vs `9afe4f8`):
  - `compactExamAcronyms`, balanced `[diagram]`/`[[diagram]]` marker support, `REGION_OPTION`, `inStimulusBlock` (`splitRegions` state preserving multi-line stimulus dialogue such as `Mr. Ganaba:`/`Mr. Katoun:` without false unnumbered splits), `stimulusIntroRangeText` verb-predicate termination (`V10`) and `same` locator (`V11`).
  - Anchored-only `extractAnchoredInterQuestionBlocks` (never deleting unanchored tails such as wrapped Option D `leaders`, skipping malformed brackets and bare `[missing text]` lines without a marker or non-placeholder body), `extractLeadingStimuli`, `applyStimulusFlags(items, leadingStimuli)` (`constantText` vs `needsImage`), `inferMissingGapNums`, and `MISSING_TEXT_RE`/`MISSING_TEXT_FLAG` (`'[missing text] placeholder'`).
- `src/bookmarklets/stimulus/autosave.js` (`593 L`, `+12/-11` vs `9afe4f8`):
  - `formMatchesQuestion` compares `constantText`, `autosaveBlockers` checks `missing-text` and `constant-long` (>60,000 B), labels `Text block` vs `Image block`, and defers ready/uncovered `needsImage` control to per-question pause in `ui.js` (while retaining `HELPER_NAMES` single-source parity).
- `src/ui/ui.js` (`1,650 L`, `+314/-95` vs `9afe4f8`):
  - Preserves donor `ed96b11` `fillForm` `#constant_text` write & clear, RAM-cached File upload (`cacheFileInMemory`), ready-image autosave within attached range, `PAUSED (IMAGE)` per-question pause & resume, bulk picker (>=2 image stimuli), `#ans_diag` failure diagnostics, and full/key-only Load.
  - Adds PC01 hardening: `form.__ocrStimulusCleanup()` (cleans `pollId`, `autoHeartbeat`, `visibilitychange`, `submit`, and `FIELDS` listeners on reinjection), shared `owner.inFlight` disabling concurrent Start/manual Save across reinjections to prevent double-POSTs, defensive `store.del('ocrSubmitted')`, corrupted `localStorage` normalization (`isPlainObject`), and `keyAppliesForQueue()` proving `ansKeyBatch === queue.batchId` before ticking radios.
- `ocr_helper.js` (`127 L / 4,917 B`, SHA-256 `75671c2e…`, `+1/-1` vs `9afe4f8`, cumulative `+51/-45` vs `archive/live-sources/ocr_helper.js`): rotates `EXPECTED_CORE_VERSION = '2.5.7'`; manual Load/fill/POST only, zero `constant_text` reference.
- `src/bookmarklets/key/entry.js` (`596 L`, `+1/-1` vs `9afe4f8`): rotates `EXPECTED_CORE_VERSION = '2.5.7'` on the retained comparator/rollback build.
- `deployed/admin_questions.php` (`1,057 L / 62,878 B`, SHA-256 `33165c0b…`, `+2/-2` vs `9afe4f8`, cumulative `+96/-85` vs `archive/live-sources/admin_questions-2026-10-31.php`): rotates `<script>` tokens to `src/parser/core.js?v=2.5.7` and `ocr_helper.js?v=2.4.10`.
- Generated artifacts (1 line, `%HH`-free, deterministic `--check` + `node --check`):
  - `src/bookmarklet.js`: `1 L / 162,516 B` (`162,515` chars), SHA-256 `803a7c55b985148131c0df8f38f25ea0b748056e1a742590847221960651a437`.
  - `src/bookmarklets/key/bookmarklet.js` (comparator/rollback): `1 L / 93,110 B` (`93,109` chars), SHA-256 `0de81329c44a920f163182dd8241abfa87c4c25ee356a5db3ee171c5c9bef5a7`.
- Fixtures & tests:
  - Added `fixtures/{inputs,expected}/new-edge-image-intro-marker.{txt,json}`, `new-edge-inter-question-text.{txt,json}`, `new-edge-inter-question-diagram.{txt,json}`.
  - Updated `tests/ui-harness.js`, `tests/ocr-helper.js`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and `tests/unit.js`.

## Verification evidence

- Automated Node suites (executed after final code/test edits):
  - `node src/build/build.js --check` & `node src/bookmarklets/key/build.js --check` & `node --check`: PASS (1 line each)
  - `node tests/runner.js`: 76 fixtures — 76 PASS, 0 FAIL, 0 PENDING
  - `node tests/unit.js`: 187 PASS, 0 FAIL
  - `node tests/ocr-helper.js`: 42 vectors PASS
  - `node tests/key-bookmarklet.js`: 43 vectors PASS
  - `node tests/single-source.js`: 15 checks PASS (core/facade identity + real-artifact parity)
  - `node tests/underline-toolbar.js`: 10 vectors PASS
  - `node tests/question-preview.js`: 7 vectors PASS
  - `node tests/math-tool.js`: 26 vectors PASS
  - `node tests/render-markup.js`: 69 checks PASS
  - `node tools/extract-bank.js --check`: OK (7 output hashes match)
- Automated PHP suites (both Termux PHP `8.5.12` and static PHP `8.3.32` at `$HOME/tmp/php83-review/php`):
  - `php -l deployed/*.php`: 7/7 clean syntax on both PHP 8.5.12 and PHP 8.3.32
  - `php tests/php-render.php`: 33 vectors PASS on both
  - `php tests/admin-question-store.php`: 8 checks PASS on both
  - `php tests/cbt-question-order.php`: 14 checks PASS on both (`php tests/cbt-staging.php` requires live/staging MYQL env vars and did not run separately because phone staging runs SQLite shim)
- Disposable Chromium CDP + PHP/SQLite phone staging (`http://127.0.0.1:3027/admin_questions.php`, stopped and wiped afterwards):
  - Script load order verified (`src/parser/core.js?v=2.5.7` before `ocr_helper.js?v=2.4.10`), served bytes SHA-256 matched workspace files, zero page/console errors (`appErrors: []`).
  - 3-surface Load parity (`ocr_helper.js`, real `src/bookmarklets/key/bookmarklet.js`, real `src/bookmarklet.js`) matched on all 10 vectors (`V9`, `V9-ctrl`, `V6`, `V10`, `V11`, `V11-ctrl`, `adv-bank`, `new-edge-image-intro-marker`, `new-edge-inter-question-text`, `new-edge-inter-question-diagram`); manual helper & key comparator left `#constant_text` untouched; stimulus bookmarklet attached PNG -> `Ready`, populated `#constant_text` on `Text block` Q20, and cleared `#constant_text` on standalone questions.
  - End-to-end stimulus autosave PNG multipart upload (`new-edge-image-intro-marker`, Q18–Q23): persisted `#111`–`#116` (`#113`–`#115` Q20–Q22 stored uploaded PNG under `uploads/question-images/*.png`, HTTP 200 GET matched uploaded 69-byte PNG SHA-256 `c17acf9f…`; `#111` Q18, `#112` Q19, `#116` Q23 stayed image-free).
  - End-to-end `constant_text` autosave (`new-edge-inter-question-text`, Q19–Q21): persisted `#117` (NULL), `#118`–`#119` (`Opening stock 4,000\nClosing stock 12,000\nPurchases 17,000`), and loading a subsequent standalone paste cleared `#constant_text` (`""`).
  - Pre-POST gating & concurrency: `[missing text]` disabled Start with 0 POSTs; uncovered `needsImage` saved Q1 (`#120`) and paused before Q2 as `PAUSED (IMAGE)` with 0 POSTs for Q2; delayed in-flight POST + immediate reinjection + concurrent resubmit issued `slowPosts = 1` and settled once (`#121`).

## Handoff

- **Commit:** deferred
- **Closed carried findings:** `BLOCK-10` (`V10`) and `BLOCK-11` (`V11`) closed by Phase 7 initial review ([record](../reviews/parser-convergence-2026-11-phase-7.md)).
- **Open Phase 7 findings (`BLOCK-12`–`BLOCK-22`, fixed below awaiting independent Phase 7 re-review):**

## Phase 7 Fix Note (`BLOCK-12`–`BLOCK-22`, 2026-11-26)

- **Owner Gate 1 decisions (`go, approve D1 D2 D3 D4 D5`):**
  - `D1` (`BLOCK-21`): Owner confirmed `ed96b11` (`src/bookmarklet.js` `119,555 B` LF SHA-256 `dcde1c25172a59506281d46d3d21d0d0d8750bd8b646f8bc453d5a1dc061c1cc`, `119,554 B` URL without LF `3d8d4ca47917fdc1ece5e2845125e0715de143e6825c610149300a76d9fb3632`) is the exact donor artifact, replacing the stale `4fa7d907…` prefix.
  - `D2` (`BLOCK-21`): Owner confirmed `bugs.txt:293–307` (Q34 dotless inline labels leaving the list in Q34's stem rather than extracting onto Q35–Q36) is intentionally excluded under the complete-option precondition so wrapped-option safety stays intact.
  - `D3` (`BLOCK-18`): Stimulus bookmarklet stores `how: 'key-paste'` on `ocrQueue` (matching `key/entry.js`) on deliberate key-only Load of an unbatched manual-helper queue while keeping `batchId` unset so autosave stays blocked (`batch-missing`).
  - `D4` (`BLOCK-15`): Partial bulk Attach associates only the explicitly picked files (`picked[pickIdx]`) and leaves omitted rows as `No image`, never adopting an unattached single-file pending selection.
  - `D5` (`BLOCK-22` & test wiring): Updated `tests/ui-harness.js` and `tests/single-source.js` for the two extracted stimulus modules in exact build order, and rotated core/helper version checks (`2.5.8` / `?v=2.4.11`).

### Failing-first reproduction on `5711f96` (`348e5e1` + review)

- `BLOCK-12`: `node tests/unit.js` failed `transport: pending ocrSaving marker kept` (`ocrSaving` deleted on `Failed to fetch`).
- `BLOCK-13`: `node tests/unit.js` failed after delayed save + reinjection (`status shows Q2 book number 2` — gen-2 queue/UI remained stale at Q1).
- `BLOCK-14`: `node tests/unit.js` failed `leading block preserves sourceNum null` (`1 !== null`).
- `BLOCK-15`: `node tests/unit.js` failed `omitted second block stays No image` (`'Ready' !== 'No image'`).
- `BLOCK-16`: `node tests/unit.js` failed `Q1 carries missing-text flag` (leading shared body missed `MISSING_TEXT_FLAG`).
- `BLOCK-17`: `node tests/unit.js` failed `Q19.D preserves leaders` (`'Undergoing mentorship under prominent political'` !== `'Undergoing mentorship under prominent political leaders'`).
- `BLOCK-18`: `node tests/unit.js` failed `deliberate key Load ticks Q1 Option D` (`false !== true`).
- `BLOCK-19`: `node tests/unit.js`, `tests/ocr-helper.js`, and `tests/key-bookmarklet.js` failed `BLOCK-19 neg excludes cash 25` (`[20, 21, 22, 25] !== [20, 21, 22]`).
- `BLOCK-20`: direct core probe on `…questions 20 to 2023.\n[image]` returned `nums: [20], needsImage: true` instead of `nums: []`.
- `BLOCK-21` & `BLOCK-22`: verified in Gate 1 (`ed96b11:src/bookmarklet.js` SHA-256 `dcde1c25…`, `src/ui/ui.js` 1,650 L with inline image-plan and save-flight state).

### Frozen closure mapping (`BLOCK-12`–`BLOCK-22`)

- `BLOCK-12`: `src/bookmarklets/stimulus/save-flight.js` keeps `ocrSaving` on both transport errors and `AbortError` timeouts, classifies them `ambiguous` (`Unknown. It may have saved. Check the list.`), logs nothing, and prevents manual/Start retries until explicitly cleared; real PHP rejection (`pc07-review-invalid.png`) clears `ocrSaving` and permits valid PNG retry. Verified in `tests/unit.js` (harness + real `src/bookmarklet.js`) and staging (`#102` 1 DB row on 302+reset; `#103` after invalid-PNG rejection control).
- `BLOCK-13`: `src/bookmarklets/stimulus/save-flight.js` + `src/ui/ui.js` suppress stale gen-1 DOM mutations once `owner.gen !== flight.gen`, persist storage advancement against live `ocrQueue`/`ocrSavedLog`, and have gen-2 `attachObserver` sync `queue`, `savedLog`, `batchHistory`, form fields, radio tick, and `#ocr_status` from storage upon settlement. Verified in `tests/unit.js` (harness + real artifact) and staging (`#104` Q1 + `#105` Q2 book 2; delayed-rejection control kept `i=0`, `logLen=0`, Q1 radio `0`).
- `BLOCK-14`: `src/parser/core.js` `applyStimulusFlags` keeps `sourceNum: null` on leading stimuli; `unRangedImageBoundary` pauses dry run and Start at Q1 (`0` POSTs). Verified in `tests/unit.js` (harness + real artifact, including supplied range `1` + PNG and trailing Q2–Q3 controls) and staging (`#106`–`#107`).
- `BLOCK-15`: `src/bookmarklets/stimulus/image-plan.js` `applyBulkPick` reads `picked[pickIdx]` only (`D4`), never adopting `imagePending`. Verified in `tests/unit.js` and staging (partial bulk kept block 2 `No image`, saved `#108`–`#109` with Q2 PNG SHA-256 matching `pc07-bulk-picked.png`, paused at Q3; 2-file control saved `#110`–`#112` with exact distinct PNG SHA-256s).
- `BLOCK-16`: `src/parser/core.js` `applyStimulusFlags` propagates `MISSING_TEXT_FLAG` to affected target items (and owner when unranged) whenever stimulus text matches `MISSING_TEXT_RE`. Verified in `tests/unit.js` (harness + real artifact), `tests/ocr-helper.js` (manual helper writes no `constant_text` and keeps manual flags advisory), and staging (`startDisabled: true`, `posts: 0`, manual `#constant_text` empty).
- `BLOCK-17`: `src/parser/core.js` `extractAnchoredInterQuestionBlocks` stops `extractEnd` at `nextMarker` (plus only trailing markers/intros/tables/captions) so trailing wrapped Option D prose (`leaders`) remains in Option D. Verified by new fixture `fixtures/{inputs,expected}/new-edge-anchored-option-wrap.{txt,json}`, `tests/unit.js`, `tests/ocr-helper.js`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and staging 3-surface Load.
- `BLOCK-18`: `src/ui/ui.js` records `queue.how = 'key-paste'` on deliberate key-only Load of an unbatched queue (`D3`), preserves `how` in `normalizeStoredQueue`, clears `how` on `ans_clear`, keeps `keyAppliesForQueue` false when `how` and `batchId` are absent, and leaves `batchId` unset so `autosaveBlockers` keeps `batch-missing`. Verified in `tests/unit.js` (harness + real artifact) and staging (`initialChecked: false`, `q1Checked: "3"`, `q2Checked: "2"`, `afterSecondReplace: false`, Start blocked with `postsAfterStart: 0`).
- `BLOCK-19`: `src/parser/core.js` `stimulusIntroRangeText` requires clause termination or list continuation after trailing directional words (`below`/`above`/`following`/`only`/`respectively`) following `in <location>`, excluding `…25 in the table above is the cash deposit.` while keeping `…25 in the table above.`. Verified across `tests/unit.js`, `tests/ocr-helper.js`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and staging 3-surface Load.
- `BLOCK-20`: `src/parser/core.js` `stimulusSingleQuestionRef` rejects `questions N` immediately followed by a range/list connector (`to`, `-`, `–`, `—`, `and`, `&`, `,`) before digits, yielding `nums: []` on `…20 to 2023.` while keeping `…20.` (`[20]`) and explicit `[image: 21]`. Verified across `tests/unit.js`, `tests/ocr-helper.js`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and staging 3-surface Load + default Attach.
- `BLOCK-21`: Reconciled `ed96b11` artifact SHA-256 (`D1`) and `bugs.txt` Q34–Q36 (`D2`). Donor feature delta (`d5a62f0..ed96b11`: `core.js` acronym/table/gap/stimulus rules, `ui.js` `#constant_text` write/clear, `cacheFileInMemory`, ready-image autosave, bulk picker, `#ans_diag`) and retained `key`-comparator features (`ansKey`, `how: 'key-paste'`, dry run, active/draft verification, `ocrBatchHistory`, `ocrSavedLog`, `autoLock`, PC01 `owner.inFlight`) are all mapped into `core.js`, `autosave.js`, `image-plan.js`, `save-flight.js`, and `ui.js` and tested across `tests/unit.js`, `tests/runner.js`, `tests/single-source.js`, `tests/key-bookmarklet.js`, and staging; desktop + Brave/Android installation checks remain the explicit post-review external gate before any key-only retirement diff.
- `BLOCK-22`: Extracted `src/bookmarklets/stimulus/image-plan.js` (`394 L / 14,990 B`) and `src/bookmarklets/stimulus/save-flight.js` (`358 L / 15,275 B`), wired into `src/build/build.js` (`276 L / 8,377 B`), reducing `src/ui/ui.js` from `1,650 L` back to `1,196 L / 50,830 B` (DOM mounting/painting and event wiring only). `autosave.js` stays pure policy-only (`single-source.js` 15 checks).

### Externalize-first measurements (base `9afe4f8`) & final artifact hashes

| Production file | `9afe4f8` base L / B | `+/-` vs `9afe4f8` | Final L / B / SHA-256 | Responsibility, build/deploy path & direct test |
|---|---:|---:|---|---|
| `src/parser/core.js` | 1,855 / 65,965 | `+538/-56` | 2,337 / 86,964 / `cf55f29681df927aaf9d5ab9b74fbc82e6a5be557a08b6dec40065745d3f270c` | Canonical pure parser `2.5.8`; site root `src/` & both bookmarklets; `runner.js`, `unit.js`, `ocr-helper.js`, `key-bookmarklet.js`, `single-source.js`, staging. |
| `src/bookmarklets/stimulus/autosave.js` | 592 / 24,853 | `+12/-11` | 593 / 25,277 / `6c5e64eed2cdb0eae541f0fe61e51cd355c77c41c7ae826baf04c70b155a94ee` | Pure autosave/log/blocker policy; inlined by `src/build/build.js`; `unit.js`, `single-source.js`. |
| `src/bookmarklets/stimulus/image-plan.js` | — *(new)* | `+394/-0` | 394 / 14,990 / `4f20509856ba6131bc9a776829021cc969bfe1fc3ee52b35dbc1b498ab71464c` | Image-plan state, RAM File cache, single/bulk picker; inlined by `src/build/build.js`; `ui-harness.js` (`unit.js`), `single-source.js`, staging. |
| `src/bookmarklets/stimulus/save-flight.js` | — *(new)* | `+358/-0` | 358 / 15,275 / `93ee22a25d5a6416f4a2adf6669bb13e278e42338fe9912f9da6aa7ed99c0c3e` | Save transport, `ocrSaving` marker lifetime, `owner.inFlight` & cross-activation settlement; inlined by `src/build/build.js`; `ui-harness.js` (`unit.js`), `single-source.js`, staging. |
| `src/ui/ui.js` | 1,431 / 61,701 | `+254/-489` | 1,196 / 50,830 / `a0882761aee772409cbb0fb8f57e209623e23fc09c33ab29ee9c93afba74c96e` | Stimulus DOM mounting/painting & event dispatch; inlined by `src/build/build.js`; `ui-harness.js` (`unit.js`), real artifact + staging. |
| `ocr_helper.js` | 127 / 4,917 | `+1/-1` *(live `+51/-45`)* | 127 / 4,917 / `ed3c6f2999d5dacf2d3ad97b77e05b1fc370b42ba73a565680dbc6885d6f98ca` | Thin manual adapter (`EXPECTED_CORE_VERSION = '2.5.8'`); site root; `ocr-helper.js`, staging. |
| `src/bookmarklets/key/entry.js` | 596 / 24,700 | `+1/-1` | 596 / 24,700 / `862ae2b6758e2816acbb99922116d5170aff09986416b9e7886786eb733eba4e` | Retained comparator entry (`EXPECTED_CORE_VERSION = '2.5.8'`); inlined by `key/build.js`; `key-bookmarklet.js`, staging. |
| `src/build/build.js` | 272 / 8,028 | `+5/-1` | 276 / 8,377 / `f8a0c2942986686253470e4b67a39884ada906c7f7340af7b79327ef2d9a65e9` | Stimulus bookmarklet builder (not deployed); `single-source.js`, `build.js --check`. |
| `deployed/admin_questions.php` | 1,057 / 62,877 | `+2/-2` *(live `+96/-85`)* | 1,057 / 62,878 / `0601928575893882fd776c244eec5c5653743ef455aff96fe67f6bc1a7794c44` | Site-root native page (`?v=2.5.8` / `?v=2.4.11`); PHP 8.5.12 & 8.3.32 lint, `math-tool.js`, staging. |

- **Excluded generated artifacts:**
  - `src/bookmarklet.js`: `1 L / 170,678 B` (`170,677` B without LF), SHA-256 `9d42d5be3ca9ca8726a941e1a1e906a1ffb4b0abf8323a0db7227d0175887c57`.
  - `src/bookmarklets/key/bookmarklet.js`: `1 L / 94,131 B` (`94,130` B without LF), SHA-256 `b482ec789433f792c905cbe94ae804167e95ecca135082341955f76a52ba015f`.
- **Re-verified baseline & staging after final code/test edits:**
  - `node src/build/build.js --check`, `node src/bookmarklets/key/build.js --check`, `node --check` (both stripped bodies), `wc -l` (`1` each): PASS.
  - Node: `runner.js` **77 PASS** (0 fail/pending), `unit.js` **196 PASS**, `ocr-helper.js` **42 PASS**, `key-bookmarklet.js` **43 PASS**, `single-source.js` **15 PASS**, `underline-toolbar.js` **10 PASS**, `question-preview.js` **7 PASS**, `math-tool.js` **26 PASS**, `render-markup.js` **69 PASS**, `extract-bank.js --check` **OK (7 hashes)**.
  - PHP (8.5.12 & 8.3.32 CLI): `php -l deployed/*.php` **7/7**, `php-render.php` **33 PASS**, `admin-question-store.php` **8 PASS**, `cbt-question-order.php` **14 PASS**.
  - Disposable Chromium 157 CDP + PHP/SQLite staging (`http://127.0.0.1:3031/admin_questions.php`, stopped and wiped afterwards): served `core.js?v=2.5.8` and `ocr_helper.js?v=2.4.11` SHA-256 verified, `BLOCK-12`–`BLOCK-20` + controls + 3-surface parity + served PNG SHA-256s verified (`#102`–`#112`, 0 `pageErrors`).
- **Authorized/next external steps:** independent Phase 7 re-review (`@docs/plan/prompts/review-session.md review phase 7`), then owner desktop and Brave/Android checks of `src/bookmarklet.js` before any separate key-only retirement diff.
