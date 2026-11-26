# PC07 — Stimulus-First Convergence

- **Status:** in progress (implementation handoff complete; `Commit: deferred`)
- **Phase:** 7
- **Depends on:** PC01–PC03 settled (`scratch/parser-convergence-cycle`) and Gate 1 `go` approved (2026-11-26)
- **Package base:** `9afe4f8` (settled `scratch/parser-convergence-cycle` tip)
- **Implementation branch:** `scratch/pc07-stimulus-first` (isolated worktree `/data/data/com.termux/files/home/projects/ocr-parser-pc07`)
- **Donor snapshot ref:** `ed96b11` (owner-confirmed `src/bookmarklet.js` SHA-256 `4fa7d907…`; plus `ed14323` cross-verified PC04 candidate)
- **Rollback reference:** `9afe4f8:src/bookmarklets/key/bookmarklet.js` (also retained built on this branch at `src/bookmarklets/key/bookmarklet.js` until desktop + owner Brave/Android verification and a separate reviewed retirement diff)
- **External gate:** desktop + owner Brave/Android check of installed `src/bookmarklet.js` before any key-only retirement diff
- **Start:** [scratch session prompt](../prompts/stimulus-convergence-scratch.md)

## Approved cycle amendment and row mapping

Per the 2026-11-26 Gate 1 `go` approval under `docs/plan/prompts/stimulus-convergence-scratch.md`:

- Converge on two supported products over single canonical `src/parser/core.js` (`2.5.7`):
  1. deployed manual helper (`ocr_helper.js?v=2.4.10` loaded after `src/parser/core.js?v=2.5.7` by `deployed/admin_questions.php`) — manual paste Load/fill/POST only;
  2. one supported stimulus-first bookmarklet (`src/bookmarklet.js`, built from `core.js` + `src/bookmarklets/stimulus/autosave.js` + `src/ui/ui.js`) preserving all working features of `ed96b11` (Constant Text routing/clearing, RAM-cached PNG upload, ready-image autosave within an attached row's range, `PAUSED (IMAGE)` pause when uncovered/unranged, `[missing text]` block, single/bulk image picker, key-only load, diagnostics `#ans_diag`, anchored `[diagram]`/`constantText`/leading stimulus extraction, gap recovery) alongside PC01 concurrency/storage/provenance hardening.
- `PC01`–`PC03` stay `done` on `scratch/parser-convergence-cycle`. Unfinished `PC04`–`PC06` stay preserved under `docs/plan/parser-convergence/` and `docs/plan/reviews/` as historical evidence and are mapped below to PC07 gates and carried open findings.

| Unfinished item | Mapping in PC07 | Status at handoff |
|---|---|---|
| `PC04` `BLOCK-10` (`V10`: `25 in the table is the cash deposit.` → `[20, 21, 22]`) | Implemented in `stimulusIntroRangeText` locator termination (`core.js`); frozen check + controls added to `unit.js`, `ocr-helper.js`, `key-bookmarklet.js`, and 3-surface staging Load | Implemented; **carried OPEN** for independent Phase 7 verification |
| `PC04` `BLOCK-11` (`V11`: `25 in the same section.` → `[20, 21, 22, 25]`) | Implemented in `stimulusIntroRangeText` (`same` locator added); frozen check + `V11-ctrl` added across core, helper, key comparator, and 3-surface staging Load | Implemented; **carried OPEN** for independent Phase 7 verification |
| `PC04` `BLOCK-1`–`BLOCK-9` & `[diagram]` marker | Implemented (`[diagram]` / `[[diagram]]`, balanced bracket checks, `N1`–`N5`/`V6`/`V9`/`adv-bank`/`S1`–`S5`/`G1`–`G4`/`V8`/`A1`–`A3`/`R1`, Q18–Q23 explicit precedence) | Covered by unit/runner/staging suites |
| `PC05` anchored inter-question stimulus, leading stimulus, gap recovery, wrap safety | Implemented (`extractAnchoredInterQuestionBlocks`, `extractLeadingStimuli`, `applyStimulusFlags`, `inStimulusBlock`, `inferMissingGapNums`, `MISSING_TEXT_RE` / `MISSING_TEXT_FLAG`); `new-edge-inter-question-{text,diagram}` & `new-edge-image-intro-marker` fixtures | Covered by unit/runner/staging suites |
| `PC06` stimulus image/missing policy & PC01 concurrency/provenance | Implemented in `src/bookmarklets/stimulus/autosave.js` and `src/ui/ui.js` (`constantText`, `constant-long`, `missing-text`, `cacheFileInMemory`, `Text block`/`Image block`, `form.__ocrStimulusCleanup()`, `owner.inFlight`, defensive `ocrSubmitted` delete, corrupted storage normalization, `keyAppliesForQueue()`) | Covered by unit Track 2 & real Chromium staging |
| `PC06` key-only retirement & release bundle | Explicitly **deferred**: `src/bookmarklets/key/bookmarklet.js` remains built (`2.5.7` pin) as comparator & rollback reference until Phase 7 settles, owner accepts desktop + Brave/Android checks, and a separate reviewed retirement diff lands | Open external / follow-up gate |

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
- **Open carried findings:** `BLOCK-10` (`V10`) and `BLOCK-11` (`V11`) remain open until verified independently by Phase 7 review (`@docs/plan/prompts/review-session.md review phase 7` writing `docs/plan/reviews/parser-convergence-2026-11-phase-7.md`).
- **Authorized/next external steps:** owner review of local working tree on `scratch/pc07-stimulus-first`, commit/push when owner authorizes, independent Phase 7 review on the pushed ref, then owner desktop and Brave/Android checks of `src/bookmarklet.js` before any separate key-only retirement diff.
