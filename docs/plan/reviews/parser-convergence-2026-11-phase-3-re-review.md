# Parser Convergence 2026-11 Phase 3 Re-Review

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 3
- **Package:** PC03, Spaced Initialism Option Boundaries ([`pc-03-spaced-initialisms.md`](../parser-convergence/pc-03-spaced-initialisms.md))
- **Mode:** closure-focused rigorous re-review (review round 2 for `BLOCK-1`, `BLOCK-2`, `FIX-1`; review round 1 for `BLOCK-3`)
- **Candidate:** pushed `origin/scratch/pc03-spaced-initialisms` at exact commit `74505aecc82da9acbc25623f4c8be018c664a291` (handoff-only child of pushed fix commit `adb3e2a`; `git diff adb3e2a..74505ae` updates only the package/cycle docs)
- **Package base:** `331e81f1bb77dfad74c6a0822c0bafd781c17e67` (`origin/scratch/parser-convergence-cycle`)
- **Prior review:** [`parser-convergence-2026-11-phase-3.md`](parser-convergence-2026-11-phase-3.md) (candidate `37ea241`, verdict `BLOCK`: `BLOCK-1`, `BLOCK-2`, `FIX-1`, `NOTE-1`)
- **Review environment:** clean detached worktree `$HOME/tmp/pc03-review-74505ae` at `74505aecc82da9acbc25623f4c8be018c664a291`; Node.js `v26.13.0`, PHP `8.5.12` CLI. Temporary worktree removed after verification; no repository branch or product file was modified, and this review record remains uncommitted.

## Verdict

**BLOCK.** Not commit-ready and not merge-ready for `scratch/parser-convergence-cycle`.

- **`BLOCK-2` is closed:** every frozen closure criterion passes on `74505ae`.
- **`FIX-1` is closed:** `deployed/admin_questions.php:1051` bumps `ocr_helper.js?v=2.4.8`, `docs/DEPLOYMENT.md` matches all 20 manifest file sizes/hashes/tokens, `pc-03-spaced-initialisms.md` is updated, and `php -l` passes `7/7`.
- **`BLOCK-1` remains open (review round 2):** while the two named `John F.` and `U. S.` exact vectors pass, `BLOCK-1` frozen closure criterion 1 fails on valid line-start options when `isOptionLineStart` or `orderedOptionCompletion` (`src/parser/core.js:373-398`) returns `false` — specifically when an OCR-wrapped option label has its text on the next line (`\nA.\nKennedy`) or when an option body contains an out-of-order letter mention (`A. Kennedy (see D. note)` or `B. two (see D. note) B. inside`). In both cases `spacedInitialismSpans` still absorbs the real line-start option label and the `D-111` filter discards it.
- **`BLOCK-3` is newly recorded (review round 1):** the `D-111` covered-label restore (`src/parser/core.js:948-949`) picks the **earliest** covered match via `Array.prototype.find`, so when an initialism containing `A.` (such as `A. D.` or `A. B.`) precedes a covered real `A.` boundary — including `1. This happened in A. D. A. 70 ...`, `1. This happened in A. D.\nA.\n70 ...`, `1. This happened in A. D.\nA. 70 (see C.) ...`, and `1. Compare A. B. with C. I. F. A. first ...` — `parseQuestion` restores the stem's `A.` instead of the real `A.` boundary and splits the stem at `A. D.` / `A. B.`.
- **`NOTE-2` (non-blocking):** minor handoff `--check` stripped-byte numbers (`134,122 / 74,295` vs actual `134,187 / 74,341` bytes) and a carried-over clone-ref sentence in `pc-03-spaced-initialisms.md`.

## Prior Finding Disposition

| Finding | Round | Frozen Criteria Check | Disposition |
|---|---|---|---|
| `BLOCK-1` | Round 2 | Criteria 2 (`John F.`, `U. S.`) & 3 (baselines, 4-surface parity) pass; **Criterion 1 fails** on wrapped line-start options (`\nA.\nKennedy`) and out-of-order internal mentions (`\nA. Kennedy (see D. note)`, `\nB. two (see D. note)`), where `spacedInitialismSpans` still absorbs the real line-start label and `D-111` drops it (`331e81f` kept it). | **STILL OPEN** (routes to `fix-session.md`) |
| `BLOCK-2` | Round 2 | Criteria 1–3 pass: trailing-stem `C. I. F.`, `A. D.`, `B. C.`, and wrapped `C. I.\nF.` before `\nA.` and `\n\nA.`, plus inline `C. I. F. A. ...`, keep the initialism in `question` with `A.`–`D.` intact and `flags: []`; `C. E. F. Small` (`new-edge-initials-q46`) and `spaced-initialism-inner-option` remain unchanged. | **CLOSED** |
| `FIX-1` | Round 2 | Criteria 1–3 pass: `deployed/admin_questions.php:1051` loads `ocr_helper.js?v=2.4.8`, `docs/DEPLOYMENT.md:61, 68, 69, 100, 189, 245` and all 20 manifest hashes/sizes match disk bytes, `pc-03-spaced-initialisms.md` measurements are updated, and `php -l deployed/*.php` passes `7/7`. | **CLOSED** |

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc03-review-74505ae` at `74505ae`:

| Command | Result |
|---|---|
| `node tests/runner.js` | `73` fixtures: `73 PASS`, `0 FAIL`, `0 PENDING` |
| `node tests/unit.js` | `181 PASS`, `0 FAIL` |
| `node tests/ocr-helper.js` | `40 PASS` |
| `node tests/key-bookmarklet.js` | `42 PASS` |
| `node tests/single-source.js` | `15 PASS` |
| `node tests/underline-toolbar.js` | `10 PASS` |
| `node tests/question-preview.js` | `7 PASS` |
| `node tests/math-tool.js` | `26 PASS` |
| `node tests/render-markup.js` | `69 PASS` |
| `node tools/extract-bank.js --check` | `OK: source, anchors, counts, and 7 output hashes match` |
| `node src/build/build.js --check` | exit `0` (`134187 bytes`) |
| `node src/bookmarklets/key/build.js --check` | exit `0` (`74341 bytes`) |
| `php tests/php-render.php` | `PASS: 33 PHP renderer vectors` (PHP `8.5.12`) |
| `php tests/admin-question-store.php` | `PASS: 8 admin-question-store checks` (PHP `8.5.12`) |
| `php tests/cbt-question-order.php` | `PASS: 14`, `FAIL: 0` (PHP `8.5.12`) |
| `php -l deployed/*.php` | `7/7` (`No syntax errors detected`) |
| `git diff --check 331e81f..74505ae` | exit `0` (clean) |

## Closure-Focused Adversarial Investigation

### 1. Implementation path traced (`src/parser/core.js`)

1. `spacedInitialismSpans(raw, matches)` (`410-441`) iterates over `initialismTokens(raw)` (`400-408`) and breaks the active run whenever `isRealOptionBoundary(raw, token, list)` (`392-398`) returns `true`.
2. `isRealOptionBoundary` requires **both**:
   - `isOptionLineStart(raw, token)` (`385-390`): leading horizontal-only whitespace on the line **and** `/[^\s]/` before the next `\n` (rejecting line-wrapped options such as `\nA.\nKennedy`); and
   - `orderedOptionCompletion(matches, index)` (`373-383`): starting from `matches[index]`, the first occurrence of each remaining distinct letter in `matches` must concatenate to `ABCD` (or `BCD`, `CD`, `D`), so any earlier out-of-order letter mention inside an option (e.g., `(see D. note)` before `\nB.`) makes `orderedOptionCompletion` return `false`.
3. In `parseQuestion` (`932-957`), if `narrowed` drops any match covered by `initialismSpans` and lacks a letter in `ABCD`, lines `945-952` restore one covered item per missing letter using:
   `matches.find(match => match.letter === letter && covered(match)) || tokens.find(token => token.letter === letter && covered(token))`
   Because `Array.prototype.find` scans left-to-right, whenever a stem initialism (`A. D.`, `A. B.`) and the real `A.` boundary are both covered, the stem initialism's `A.` is restored instead of the trailing real `A.` boundary.

### 2. Executed closure & adversarial scenario matrix (`331e81f` vs `74505ae`)

Executed directly in Node against `src/parser/core.js` (`331e81f`, `37ea241`, `74505ae`) plus 4-surface `vm` parity across `core.js`, `ocr_helper.js`, `src/bookmarklet.js`, and `src/bookmarklets/key/bookmarklet.js`:

| Scenario / Interaction | Base `331e81f` | Candidate `74505ae` | Status |
|---|---|---|---|
| `John F.` / `U. S.` before `\nA.` + `(option A. wrong)` | Clean (`a: "Kennedy"` / `"dollar"`) | Matches `331e81f` cleanly | Executed (PASS) |
| Option A `terms C. I. F.` before `\nB.` + `B.` inside B | `C. I. F.` split as C | Clean (`a: "terms C. I. F."`, `b: "Rich in B. vitamins"`) | Executed (PASS) |
| Option A `Vitamin C.` / `John D.` before `\nB.` + `B.` inside B | `a: "Vitamin"`, `b: "Rich in B. vitamins C. other"` | Matches `331e81f` (`BLOCK-1` single-initial control) | Executed (PASS) |
| Trailing-stem `C. I. F.`, `A. D.`, `B. C.`, wrapped `C. I.\nF.` before `\nA.` & `\n\nA.` | Split at `C.` / `A.` / `B.` | Clean stem + `A.`–`D.`, `flags: []` | Executed (PASS — closes `BLOCK-2`) |
| Inline `1. Which refers to C. I. F. A. cost insurance freight ...` | Split at `C.`, `a: ""` | Clean stem + `A.`–`D.`, `flags: []` | Executed (PASS — closes `BLOCK-2`) |
| Blank-line `A.\n\nB.` in stem + real `\nA.`–`\nD.` | Split at `A.`/`B.` | Clean (`q: "1. The sequence is A.\n\nB. followed by"`) | Executed (PASS) |
| `C. E. F. Small` (`Q46`) & `spaced-initialism-inner-option` | Clean | Identical to `331e81f` | Executed (PASS) |
| **`John F.\nA.\nKennedy\nB. Adams (option A. wrong)...`** (wrapped `\nA.`) | **Pass** (`q: "1. Who is John F."`, `a: "Kennedy"`) | **Regressed** (`q: "1. Who is John F. A. Kennedy"`, `a: "wrong)"`, `b: "Adams (option"`) | Executed (**FAIL — `BLOCK-1`**) |
| **`John F.\nA. Kennedy (see D. note)\nB. Adams (option A. wrong)...`** | **Pass** (`q: "1. Who is John F."`, `a: "Kennedy (see"`) | **Regressed** (`q: "1. Who is John F. A. Kennedy (see"`, `a: "wrong)"`, `b: "Adams (option"`) | Executed (**FAIL — `BLOCK-1`**) |
| **`Pick one\nA. value A. B.\nB. two (see D. note) B. inside\nC. three\nD. four`** | **Pass** (`a: "value A. B."`, `b: "two (see"`) | **Regressed** (`a: "value A. B. B. two (see"`, `b: "inside"`) | Executed (**FAIL — `BLOCK-1`**) |
| **`Pick one\nA. Vitamin C.\nB. Rich in B. vitamins (see D.)\nC. other\nD. none`** | `a: "Vitamin"`, `b: "Rich in B. vitamins (see"` | **Regressed** (`a: "Vitamin C. B. Rich in"`, `b: "vitamins (see"`) | Executed (**FAIL — `BLOCK-1`**) |
| **`This happened in A. D.\nA.\n70\nB. 80\nC. 90\nD. 100`** | Split at `A. D.` | **Still splits** (`q: "1. This happened in"`, `a: "D. A. 70"`, structural flag) | Executed (**FAIL — `BLOCK-3`**) |
| **`This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100`** | Split at `A. D.` | **Still splits** (`q: "1. This happened in"`, `a: "D. A. 70 (see"`, structural flag) | Executed (**FAIL — `BLOCK-3`**) |
| **`This happened in A. D. A. 70 B. 80 C. 90 D. 100`** (inline) | Split at `A. D.` | **Still splits** (`q: "1. This happened in"`, `a: "D. A. 70"`, structural flag) | Executed (**FAIL — `BLOCK-3`**) |
| **`Compare A. B. with C. I. F. A. first B. second C. third D. fourth`** | Split at `A. B.` / `C.` | **Restores `A.` from `A. B.`** (`q: "1. Compare"`, `a: "B. with C. I. F. A. first"`) | Executed (**FAIL — `BLOCK-3`**) |
| 4-surface `vm` parity across 12 boundary vectors | — | Identical across `core.js`, `ocr_helper.js`, `src/bookmarklet.js`, `src/bookmarklets/key/bookmarklet.js` | Executed (PASS) |

### 3. Highest-risk interactions and unverified items

- **Highest-risk interactions examined:** `isOptionLineStart` rejecting line-wrapped option labels (`\nA.\nKennedy`); `orderedOptionCompletion` misclassifying an out-of-order letter mention (`(see D. note)`) inside an option as an invalid option sequence; and left-to-right `matches.find` restoring an earlier stem `A.` (`A. D.` / `A. B.`) when the real `A.` boundary is also covered.
- **Unverified material scenarios:** `php tests/cbt-staging.php` (requires disposable MySQL URL; no PHP logic changed in PC03) and live production site execution (prohibited by `docs/LIVE-SAFETY.md` and PC03 scope).

## Findings

### `BLOCK-1` (remains open, review round 2) — `isRealOptionBoundary` still absorbs real line-start option labels (`A.`–`D.`) when wrapped onto the next line or followed by an out-of-order internal mention

- **Evidence:** `src/parser/core.js:373-398`, `419-425`, `932-957`.
- **Quoted rule violated (`docs/plan/reviews/parser-convergence-2026-11-phase-3.md:107` & `docs/plan/parser-convergence/pc-03-spaced-initialisms.md:40`):**
  > `1. A real line-start option label (A.–D.) that begins an option line after a stem/option ending in [A-Z]. is never absorbed into a spacedInitialismSpans run or discarded by the D-111 filter.`
  > `Controls | D-91 repeat matrices, Q46, complete duplicate sets, incomplete sets, blank options, E/F, slash labels, and bank/anomaly fixtures remain unchanged`
- **Exact defect:** `isRealOptionBoundary` (`src/parser/core.js:392-398`) requires both same-line non-whitespace after the label (`isOptionLineStart`, line 389) and strict first-occurrence `ABCD` ordering across all subsequent `matches` (`orderedOptionCompletion`, lines 373-383). When a real line-start option label is line-wrapped (`1. Who is John F.\nA.\nKennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe`) or an option body mentions an out-of-order letter (`1. Who is John F.\nA. Kennedy (see D. note)\nB. Adams (option A. wrong)\nC. Smith\nD. Doe`; `1. Pick one\nA. value A. B.\nB. two (see D. note) B. inside\nC. three\nD. four`; `1. Pick one\nA. Vitamin C.\nB. Rich in B. vitamins (see D.)\nC. other\nD. none`), `isRealOptionBoundary` returns `false`, `spacedInitialismSpans` absorbs the real `\nA.`/`\nB.` label into the trailing `[A-Z].` span, and `D-111` discards the real boundary whenever the later option repeats that letter. Every one of those vectors kept the real `\nA.`/`\nB.` boundary on package base `331e81f`.
- **Supported operating preconditions:** Single numbered question parsed through `core.js` / `ocr_helper.js` / either bookmarklet where a stem or option ends with `[A-Z].` before a real newline-delimited option `A.`–`D.` whose text starts on the next line or contains an out-of-order `[A-Z].` mention while a later option also repeats the boundary letter.
- **Closure criteria (unchanged frozen `BLOCK-1` contract, plus regression checks for these exact failure paths):**
  1. A real line-start option label (`A.`–`D.`) that begins an option line after a stem/option ending in `[A-Z]\.` (including a wrapped option `\nA.\nKennedy` and an option containing an out-of-order mention like `(see D. note)`) is never absorbed into a `spacedInitialismSpans` run or discarded by the `D-111` filter.
  2. `1. Who is John F.\nA. Kennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe`, `1. Currency of U. S.\nA. dollar\nB. pound (not A. dollar)\nC. euro\nD. yen`, `1. Who is John F.\nA.\nKennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe`, and `1. Who is John F.\nA. Kennedy (see D. note)\nB. Adams (option A. wrong)\nC. Smith\nD. Doe` keep the trailing `F.`/`U. S.` in `question` and select the real `\nA.` boundary (`a: "Kennedy"` / `"dollar"` / `"Kennedy"` / `"Kennedy (see"`).
  3. All existing PC03 vectors (`-cif-stem`, `-ad-stem`, `-bc-stem`, `-wrapped`, `-inner-option`), `1. The sequence is A.\n\nB. followed by\nA. one\nB. two\nC. three\nD. four`, and all baseline controls continue to pass with identical output across all four surfaces.
- **Required evidence:** Failing-first reproduction on `74505ae` for the wrapped and out-of-order-mention line-start vectors, added `tests/unit.js` assertions, full Node/PHP baseline, `--check` builds, and 4-surface parity.
- **Non-goals / deferred checks:** Unchanged handling of `A.`–`D.` inside option text when no complete A–D set survives without it; live/browser staging checks beyond PC03 scope.

### `BLOCK-3` (new finding, review round 1) — `D-111` covered-label restore picks the earliest stem `A.` (`A. D.` / `A. B.`) instead of the trailing real `A.` boundary

- **Evidence:** `src/parser/core.js:945-952`.
- **Quoted rule violated (`docs/plan/parser-convergence/pc-03-spaced-initialisms.md:42` & `docs/plan/prompts/review-session.md:135-137`):**
  > `Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag`
  > `During re-review, a new BLOCK is permitted only for a directly unmet package acceptance requirement, a material regression introduced by the fix, or a reproducible security/data-loss defect on a supported path.`
- **Exact defect:** When `spacedInitialismSpans` covers both an initialism containing `A.` (such as `A. D.` or `A. B.`) and the real `A.` option boundary (whether because `A.` is inline — `1. This happened in A. D. A. 70 B. 80 C. 90 D. 100` or `1. Compare A. B. with C. I. F. A. first B. second C. third D. fourth` — or because `isRealOptionBoundary` returned `false` on `1. This happened in A. D.\nA.\n70\nB. 80\nC. 90\nD. 100` or `1. This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100`), `matches.find(match => match.letter === letter && covered(match))` restores the **earliest** covered `A.` inside `A. D.` / `A. B.` rather than the trailing real `A.` boundary. `parseQuestion` consequently truncates `question` (`"1. This happened in"` / `"1. Compare"`) and pulls `D. A. 70` / `B. with C. I. F. A. first` into Option A.
- **Supported operating preconditions:** Valid question where a stem contains a spaced initialism with `A.` (`A. D.`, `A. B.`, `U. S. A.`) and the real `A.` option label is covered by a `spacedInitialismSpans` run (inline after an initialism or line-start without `isRealOptionBoundary` stopping the run).
- **Closure criteria:**
  1. When `D-111` restores a missing letter from covered matches, it never prefers an earlier stem initialism token over a trailing real option-boundary match; `1. This happened in A. D. A. 70 B. 80 C. 90 D. 100`, `1. This happened in A. D.\nA.\n70\nB. 80\nC. 90\nD. 100`, `1. This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100`, and `1. Compare A. B. with C. I. F. A. first B. second C. third D. fourth` all keep the stem initialisms in `question` (`"1. This happened in A. D."` / `"1. Compare A. B. with C. I. F."`) and put `"70"` / `"first"` in Option A.
  2. Existing `C. E. F. Small` (`new-edge-initials-q46`), `spaced-initialism-inner-option`, and incomplete option sets lacking a real `A`–`D` set remain unchanged (and the `tokens.find` fallback does not fabricate an option boundary from an unspaced `A.B.`/`A.D.` abbreviation that `isOptionAbbreviation` already rejected).
- **Required evidence:** Failing-first reproduction on `74505ae` for the `A. D. A. 70` and `A. B. ... C. I. F. A. first` vectors, added `tests/unit.js` assertions, full Node/PHP baseline, `--check` builds, and 4-surface parity.
- **Non-goals / deferred checks:** Incomplete option sets lacking a full `A`–`D` set; lowercase `a. d.` / `a. m.` forms.

### `NOTE-2` — Non-blocking handoff documentation typos

- **Evidence:** `docs/plan/parser-convergence/pc-03-spaced-initialisms.md:130-131, 197`.
- **Quoted rule (`docs/plan/README.md:618`):**
  > `current-facing docs match implemented behavior`
- **Severity justification:** Product files, `docs/DEPLOYMENT.md`, and `--check` builds all match actual disk hashes and byte counts; two stale numbers/notes inside `pc-03-spaced-initialisms.md` do not affect runtime behavior or deployment correctness (`NOTE`, not `FIX` or `BLOCK`).
- **Details:**
  1. `pc-03-spaced-initialisms.md:197` records `--check` stripped sizes as `(134,122 / 74,295 B stripped)`, whereas actual `build.js --check` reports `134187 bytes` (`src/bookmarklet.js` is `134,188` B with trailing `\n`) and `key/build.js --check` reports `74341 bytes` (`src/bookmarklets/key/bookmarklet.js` is `74,342` B with trailing `\n`).
  2. `pc-03-spaced-initialisms.md:130-131` (earlier handoff block) still states `(no scratch/stimulus-followups ref...)`, although `scratch/stimulus-followups` (`f3f5957`) exists in the repository.

## Externalize-First Verification

### Production files (`331e81f` -> `74505ae`)

| Production path | Package base (`331e81f`) | Diff vs `331e81f` | Final (`74505ae`) | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,733 L / 60,722 B / `c9ac52b3a715` | `+98/-2` | 1,829 L / 64,452 B / `42739697bf82` | Canonical pure parser `2.5.5` (D-111 initialism span helpers + filter/restore in `parseQuestion`); site root `src/`, loaded by `admin_questions.php` and inlined by both bookmarklet builds | `tests/runner.js` (73), `tests/unit.js` (181), `tests/ocr-helper.js` (40), `tests/single-source.js` (15) |
| `ocr_helper.js` | 127 L / 4,917 B / `b83835b798c3` | `+1/-1` | 127 L / 4,917 B / `86497f4d0686` | Thin deployed adapter (`EXPECTED_CORE_VERSION = '2.5.5'`); site root; `+51/-45` vs `archive/live-sources/ocr_helper.js` (cap <= 100) | `tests/ocr-helper.js` (40 checks, real module & Load path) |
| `src/bookmarklets/key/entry.js` | 596 L / 24,700 B / `14c33a5dc88a` | `+1/-1` | 596 L / 24,700 B / `34e78c3e1e89` | Key bookmarklet entry (`EXPECTED_CORE_VERSION = '2.5.5'`); inlined only into key artifact | `tests/key-bookmarklet.js` (42 checks, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B / `e4e013f78e80` | `+2/-2` | 1,057 L / 62,877 B / `388d38532c83` | Loads `src/parser/core.js?v=2.5.5` before `ocr_helper.js?v=2.4.8`; site root; `+96/-85` vs `archive/live-sources/admin_questions-2026-10-31.php` (cap <= 100) | `php -l deployed/admin_questions.php` (PASS); `docs/DEPLOYMENT.md` token/sha256 verified |

### Test and fixture files (`331e81f` -> `74505ae`)

- Fixtures (`input_origin: "synthetic"`, manually transcribed, carried from round 1):
  - `fixtures/inputs/spaced-initialism-{cif-stem,ad-stem,bc-stem,wrapped,inner-option}.txt` + matching `fixtures/expected/*.json`
- Test updates (`37ea241` -> `74505ae`):
  - `tests/fixtures/ocr-helper-spaced-initialism-boundaries.txt` (`+10/-0`, new 2-question real Load fixture)
  - `tests/ocr-helper.js` (`+19/-0` since `37ea241`, `+31/-1` vs `331e81f`): adds `Load keeps trailing stem initials out of every option field`
  - `tests/single-source.js` (`+7/-0` since `37ea241`, `+16/-6` vs `331e81f`): adds `John F.` and trailing `C. I. F.` parity vectors
  - `tests/unit.js` (`+60/-0` since `37ea241`, `+89/-1` vs `331e81f`): adds 5 new unit tests covering trailing initials and blank-line `A.\n\nB.` control

### Excluded generated and archived artifacts

- `src/bookmarklet.js`: generated stimulus artifact (`1` L / `134,188` B with `\n`, `134,187` B stripped / sha256 `ba4a79aea176`; base `131,268` B; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/single-source.js`, and `vm` parity.
- `src/bookmarklets/key/bookmarklet.js`: generated key artifact (`1` L / `74,342` B with `\n`, `74,341` B stripped / sha256 `dbed22f1c7f9`; base `71,422` B; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and `vm` parity.
- `src/bookmarklet.min.js`: absent/untracked, untouched.
- `archive/live-sources/*`: unchanged reference snapshots used only for cap verification.
- Docs (`331e81f..74505ae`): `AGENTS.md` (`+2/-2`), `docs/AGENTS.md` (`+1/-1`), `docs/DECISIONS.md` (`+35/-0`), `docs/DEPLOYMENT.md` (`+7/-7`), `docs/DEVELOPER-GUIDE.md` (`+2/-2`), `docs/EDGE_CASES.md` (`+4/-0`), `docs/INVARIANTS.md` (`+1/-0`), `docs/SPEC.md` (`+12/-1`), `docs/STATUS.md` (`+30/-3`), `docs/plan/README.md` (`+31/-8`), `docs/plan/parser-convergence/pc-03-spaced-initialisms.md` (`+163/-6`), `docs/plan/prompts/phase-map.md` (`+8/-3`), `docs/plan/reviews/parser-convergence-2026-11-phase-3.md` (`+199/-0`).

## Approvals, Commit Readiness, and Next Action

- **Approvals:** Gate 1 amendment keeping `spaced-initialism-inner-option` as a must-stay-passing control (`pc-03-spaced-initialisms.md:41`); `D-111` recorded in `docs/DECISIONS.md:1847-1880`. No live-origin line-cap exception is required (`+96/-85` and `+51/-45` stay below `+100`).
- **Commit readiness:** **not ready** to mark `done` or merge into `scratch/parser-convergence-cycle`.
- **Review status:** Phase 3 closure-focused re-review complete with verdict **`BLOCK`**: `BLOCK-2` and `FIX-1` are **closed**; `BLOCK-1` remains open in review round 2, and `BLOCK-3` is newly recorded in review round 1 (plus non-blocking `NOTE-2`). Both open findings have <= 2 review rounds and route directly to `fix-session.md` against their frozen closure contracts above.

NEXT COMMAND: @[docs/plan/prompts/fix-session.md] phase 3 BLOCK-1 BLOCK-3
