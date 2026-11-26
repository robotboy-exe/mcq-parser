# Parser Convergence 2026-11 Phase 3 Review

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 3
- **Package:** PC03, Spaced Initialism Option Boundaries ([`pc-03-spaced-initialisms.md`](../parser-convergence/pc-03-spaced-initialisms.md))
- **Mode:** original rigorous review (review round 1)
- **Candidate:** pushed `origin/scratch/pc03-spaced-initialisms` at exact commit `37ea241b91f55442865ca2aa5fb030eff8c1bb24` (handoff-only child of pushed implementation commit `186d27e`; `git diff 186d27e..37ea241 --stat` modifies only `docs/plan/parser-convergence/pc-03-spaced-initialisms.md`, `+4/-3`)
- **Package base:** `331e81f1bb77dfad74c6a0822c0bafd781c17e67` (`origin/scratch/parser-convergence-cycle`)
- **Review environment:** clean detached worktree `$HOME/tmp/pc03-review` at `37ea241b91f55442865ca2aa5fb030eff8c1bb24`; Node.js `v26.13.0`, PHP `8.5.12` CLI. Temporary worktree removed after verification; no repository branch or product file was modified.

## Verdict

**BLOCK.** Not commit-ready and not merge-ready for `scratch/parser-convergence-cycle`. Two blocking code defects (`BLOCK-1`, `BLOCK-2`), one deployment-token defect (`FIX-1`), and one non-blocking handoff/measurement note (`NOTE-1`) are recorded.

While the five added fixtures, baseline suites, and build/surface parity checks pass on `37ea241`, `spacedInitialismSpans(raw)` (`src/parser/core.js:373-399`) joins `[A-Z]\.` tokens across **any** whitespace (`/^\s*$/`, line 389), including a newline or blank line that separates a trailing initial in the stem or an option from a following real option boundary `A.`–`D.`. As a result:

1. **`BLOCK-1` (material regression):** when a stem or option ends with a single initial or initialism (for example `John F.`, `U. S.`, `Vitamin C.`, `John D.`) before `\nA.` or `\nB.` and a later option body mentions that letter (`option A. wrong)`, `(see B. note)`), `spacedInitialismSpans` swallows the real line-start option label into the span, `hasCompleteOptionSet(narrowed)` still succeeds via the later internal mention, and `parseQuestion` deletes the real option boundary.
2. **`BLOCK-2` (unmet acceptance):** when a spaced dotted initialism (`C. I. F.`, `A. D.`, `B. C.`, or wrapped `C. I.\nF.`) sits at the end of the stem immediately before `\nA.` (or `\n\nA.` / inline `A.`), `spacedInitialismSpans` merges the initialism with the real `A.` option boundary, `hasCompleteOptionSet(narrowed)` fails because `A` was dropped, and the `D-111` filter aborts — leaving the stem initialism to split the question as an option boundary.
3. **`FIX-1`:** `ocr_helper.js` bytes changed (`EXPECTED_CORE_VERSION` `'2.5.4'` -> `'2.5.5'`), but `deployed/admin_questions.php:1051` left `ocr_helper.js?v=2.4.7` unbumped, and `docs/DEPLOYMENT.md:61, 100, 189` still documents `ocr_helper.js?v=2.4.5`.

## Acceptance Coverage

| Acceptance Row (`pc-03-spaced-initialisms.md:36-43`) | Result | Independent Evidence |
|---|---|---|
| Failing first | **PASS (on 4 named base-failing vectors)** | Re-executed `331e81f:src/parser/core.js` against the 5 new inputs: `spaced-initialism-cif-stem`, `-ad-stem`, `-bc-stem`, and `-wrapped` all failed on `331e81f` for the documented reason; `spaced-initialism-inner-option` passed on `331e81f` as the Gate 1-approved must-stay-passing control. |
| Correctness | **FAIL (`BLOCK-2`)** | The 5 added fixtures pass on `37ea241`, **but** trailing-stem spaced initialisms immediately before `\nA.` (e.g., `1. Which refers to C. I. F.\nA. ...`, `1. This happened in A. D.\nA. ...`, `1. Babylon fell in 539 B. C.\nA. ...`, wrapped `1. The goods were shipped C. I.\nF.\nA. ...`, blank-line `C. I. F.\n\nA. ...`, inline `C. I. F. A. ...`) still split the stem into options and displace `A`/`B`/`C`. |
| Controls | **FAIL (`BLOCK-1`)** | Existing 68 fixtures and `new-edge-initials-q46` / `C. E. F. Small` pass, **but** adversarial probes `17`, `18`, `1`, `5`, `6` show a material regression vs `331e81f`: a trailing initial (`F.`, `U. S.`, `C.`, `D.`) followed by `\nA.`/`\nB.` with a later repeat (`A.`/`B.`) in option text drops the real line-start option boundary and corrupts stem/option boundaries. |
| Surfaces | **PASS (parity)** | Independently executed `core.js`, `ocr_helper.js`, `src/bookmarklet.js`, and `src/bookmarklets/key/bookmarklet.js` (`vm` sandboxes): all four surfaces return identical parsed fields on the 5 new vectors (and consistently reproduce `BLOCK-1`/`BLOCK-2` on the adversarial vectors). |
| Baseline | **PASS** | All Node suites (`73`/`176`/`39`/`42`/`15`/`10`/`7`/`26`/`69`), `tools/extract-bank.js --check` (`7` hashes), both `--check` builds (`132,234` / `72,388` B stripped), PHP `8.5.12` CLI (`33`/`8`/`14`), and `7/7` `php -l` pass. `php tests/cbt-staging.php` requires a disposable MySQL URL and was not run (no PHP logic changed). |
| Safety | **PASS (with `FIX-1` cache token gap)** | No deploy, live action, or real-branch change. However, `deployed/admin_questions.php:1051` left `ocr_helper.js?v=2.4.7` unbumped after `ocr_helper.js` changed bytes (`FIX-1`). |

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc03-review` at `37ea241`:

| Command | Result |
|---|---|
| `node tests/runner.js` | `73` fixtures: `73 PASS`, `0 FAIL`, `0 PENDING` |
| `node tests/unit.js` | `176 PASS`, `0 FAIL` |
| `node tests/ocr-helper.js` | `39 PASS` |
| `node tests/key-bookmarklet.js` | `42 PASS` |
| `node tests/single-source.js` | `15 PASS` |
| `node tests/underline-toolbar.js` | `10 PASS` |
| `node tests/question-preview.js` | `7 PASS` |
| `node tests/math-tool.js` | `26 PASS` |
| `node tests/render-markup.js` | `69 PASS` |
| `node tools/extract-bank.js --check` | `OK: source, anchors, counts, and 7 output hashes match` |
| `node src/build/build.js --check` | exit `0` (`132234 bytes`) |
| `node src/bookmarklets/key/build.js --check` | exit `0` (`72388 bytes`) |
| `php tests/php-render.php` | `PASS: 33 PHP renderer vectors` (PHP `8.5.12`) |
| `php tests/admin-question-store.php` | `PASS: 8 admin-question-store checks` (PHP `8.5.12`) |
| `php tests/cbt-question-order.php` | `PASS: 14`, `FAIL: 0` (PHP `8.5.12`) |
| `php -l deployed/*.php` | `7/7` (`No syntax errors detected`) |

## Independent Adversarial Investigation

### 1. State inventory and production workflow traced

- **Canonical state & mutation path (`src/parser/core.js`):**
  1. `parseQuestion(chunk)` (`832-960`) normalizes `\r\n`, collapses horizontal runs to `' '` (`834`), extracts stimuli into `raw` (`835-836`), normalizes slash labels into `scanRaw` (`854`), and collects candidate option matches via `optionLabelMatches(raw, scanRaw)` (`405-436`, using `OPTION`, `REGION_PAREN`, `REGION_LABEL`, and `isOptionAbbreviation`).
  2. Parenthesized `(a)-(d)` and unlinked-passage filters run at `856-889`.
  3. **PC03 addition (`373-399`, `890-897`):** `spacedInitialismSpans(raw)` scans `raw` for every `[A-Z]\.` not preceded by `[A-Za-z0-9]` and coalesces adjacent tokens whenever `raw.slice(runEnd, token.start)` matches `/^\s*$/`, keeping spans with `runEnd - runStart > 2`. Any match in `matches` overlapping a span is removed into `narrowed`; if `narrowed.length !== matches.length && hasCompleteOptionSet(narrowed)` (`818-820`, requiring at least one `A`, `B`, `C`, and `D` anywhere in `narrowed`), `matches` becomes `narrowed`.
  4. `bestOptionCandidate(matches)` (`467-484`) picks the **earliest** remaining match for each of `A`, `B`, `C`, `D`, then `E`/`F` after `D`.
- **Consumers across surfaces:**
  - Deployed helper (`ocr_helper.js:4, 20-26`): enforces `EXPECTED_CORE_VERSION === '2.5.5'` in the browser (`31-35`) and delegates `parseAll` directly to `core.splitQuestions` + `core.parseQuestion`. `deployed/admin_questions.php:1050-1051` loads `src/parser/core.js?v=2.5.5` before `ocr_helper.js?v=2.4.7`.
  - Key bookmarklet (`src/bookmarklets/key/entry.js:6` -> `src/bookmarklets/key/bookmarklet.js`): enforces `EXPECTED_CORE_VERSION === '2.5.5'` and delegates `parsePaste` to `window.OCRParser`.
  - Stimulus bookmarklet (`src/bookmarklet.js`): inlines `core.js` directly (`PARSER_VERSION = "2.5.5"`).

### 2. Scenario matrix (executed in Node against `331e81f` and `37ea241`)

All scenarios below were executed directly against `src/parser/core.js` (`331e81f` vs `37ea241`), and key failure/pass vectors were verified across `ocr_helper.js`, `src/bookmarklet.js`, and `src/bookmarklets/key/bookmarklet.js`:

| Scenario / Interaction | Base `331e81f` | Candidate `37ea241` | Status |
|---|---|---|---|
| Mid-stem `C. I. F.`, `A. D.`, `B. C.`, wrapped `C. I.\nF.` | Split at `C.` / `A.` / `B.` | Clean stem + A–D, no flags | Executed (PASS) |
| Inner-option `C. I. F.` (`spaced-initialism-inner-option`) & `C. E. F. Small` (EC-85 / Q46) | Pass | Identical to base | Executed (PASS) |
| Initialism separated by blank line (`A.\n\nB.`) in stem | Split at `A.` / `B.` | Clean stem (`A.\n\nB.`) + A–D | Executed (PASS) |
| Initialism + inline options (`...C. I. F. Lagos terms A. ... D. ...`) | Clean | Clean | Executed (PASS) |
| Initialism + `(a)-(d)` / `(A)-(D)` paren set or merged duplicate set | Split at `C.` | Clean stem + expected flags | Executed (PASS) |
| Stem trailing `C. I. F.` / `A. D.` / `B. C.` immediately before `\nA.` (`Probe 7, 7b, 7c`) | Fails (`C.`/`A.`/`B.` split) | **Still fails** (`C. I. F.\nA.` merges `A.` into span -> guard aborts) | Executed (**FAIL — `BLOCK-2`**) |
| Stem trailing wrapped `C. I.\nF.` immediately before `\nA.` (`Probe 19`) | Fails | **Still fails** (`"c": "I. F."`) | Executed (**FAIL — `BLOCK-2`**) |
| Stem trailing `C. I. F.` + `\n\nA.` or inline `C. I. F. A. ...` | Fails | **Still fails** (`"c": "I. F."` / `"a": ""`) | Executed (**FAIL — `BLOCK-2`**) |
| Stem trailing `John F.` / `U. S.` before `\nA.` when Option B has `A.` (`Probe 17, 18`) | **Pass** (`a: "Kennedy"`, `a: "dollar"`) | **Regressed** (`F.\nA.` / `U. S.\nA.` drops real `A.`, selects `A.` inside Option B) | Executed (**FAIL — `BLOCK-1`**) |
| Option A trailing `Vitamin C.` / `John D.` / `Group D.` before `\nB.` when Option B/C has `B.` (`Probe 1, 5, 6`) | Incomplete (`C` or `D` missing) | **Regressed differently** (`C.\nB.` / `D.\nB.` drops real `B.`, selects `B.` inside B/C) | Executed (**FAIL — `BLOCK-1`**) |
| Blank Option A/C after stem `A.`/`C.` (`Probe 2, 3, 4`) | Same as cur | Same as base | Executed (SAME) |
| Initialism in stem with dotless `A one` (`Probe 11`) | Fails | Same as base (no complete set in `narrowed` before `optionInlineMatches`) | Executed (SAME) |
| Single-letter options `A. A.\nB. B.\nC. C.\nD. D.` (`Probe 9`) | Clean | Clean | Executed (PASS) |
| Lowercase `9 a. m.` (`Probe 8`), `597 B. C.` with E/F (`Probe 15`) | Clean / E/F flagged | Clean / E/F flagged | Executed (PASS) |

### 3. Highest-risk interactions and unverified items

- **Highest-risk interactions examined:** interaction between `spacedInitialismSpans(raw)`'s unrestricted `/^\s*$/` gap rule and line-start real option labels (`\nA.`, `\nB.`); interaction between `hasCompleteOptionSet(narrowed)` and secondary label-like tokens inside later options (`option A. wrong)`, `(see B. note)`); and browser cache compatibility between `deployed/admin_questions.php` query tokens and `ocr_helper.js`'s `EXPECTED_CORE_VERSION` mismatch throw.
- **Unverified material scenarios:** `php tests/cbt-staging.php` (requires disposable MySQL URL; no PHP logic changed in PC03) and live production site execution (prohibited by `docs/LIVE-SAFETY.md` and PC03 scope).

## Findings

### `BLOCK-1` — Material regression: `spacedInitialismSpans` absorbs a real line-start option (`A.`/`B.`) after a trailing initial when a later option mentions that letter

- **Evidence:** `src/parser/core.js:373-399` (`if (/^\s*$/ .test(raw.slice(runEnd, token.start)))` at line 389), `src/parser/core.js:890-897`.
- **Quoted rule violated (`docs/plan/parser-convergence/pc-03-spaced-initialisms.md:39-40` & `docs/plan/prompts/review-session.md:95-96`):**
  > `Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag`
  > `Controls | D-91 repeat matrices, Q46, complete duplicate sets, incomplete sets, blank options, E/F, slash labels, and bank/anomaly fixtures remain unchanged`
  > `BLOCK-N: unmet acceptance, material regression, guardrail breach, or unsafe behavior on a supported path under documented operating preconditions.`
- **Exact defect:** Because `spacedInitialismSpans(raw)` coalesces any `[A-Z]\.` tokens separated by `/^\s*$/` — including a newline before a real line-start option label — a stem ending with a single initial or spaced initialism (`1. Who is John F.\nA. Kennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe`, or `1. Currency of U. S.\nA. dollar\nB. pound (not A. dollar)\nC. euro\nD. yen`) forms a span ending at the real `A.` boundary (`"F.\nA."`, `"U. S.\nA."`). Filtering out matches overlapping that span removes the genuine `A.` label, yet `hasCompleteOptionSet(narrowed)` still returns `true` because of the `A.` inside Option B. `parseQuestion` therefore drops real `A.` (`"a": "Kennedy"` / `"a": "dollar"` on `331e81f`) and produces `question: "1. Who is John F. A. Kennedy"`, `a: "wrong)"`, `b: "Adams (option"` (and similarly corrupts Option B when Option A ends in `C.`/`D.` before `\nB.` and Option B/C mentions `B.`).
- **Supported operating preconditions:** Single numbered question parsed through `core.js` / `ocr_helper.js` / either bookmarklet where a stem or option ends with `[A-Z]\.` before a real newline-delimited option `A.`–`D.` and a later option contains a label-like mention of that letter.
- **Closure criteria:**
  1. A real line-start option label (`A.`–`D.`) that begins an option line after a stem/option ending in `[A-Z]\.` is never absorbed into a `spacedInitialismSpans` run or discarded by the `D-111` filter.
  2. `1. Who is John F.\nA. Kennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe` and `1. Currency of U. S.\nA. dollar\nB. pound (not A. dollar)\nC. euro\nD. yen` parse identically to `331e81f` for `A.`/`B.`/`C.`/`D.`, keeping the trailing `F.` and `U. S.` in the stem (`question: "1. Who is John F."` / `"1. Currency of U. S."`, `a: "Kennedy"` / `"dollar"`).
  3. All existing PC03 vectors (`-cif-stem`, `-ad-stem`, `-bc-stem`, `-wrapped`, `-inner-option`) and all baseline controls (`runner.js`, `unit.js`, `ocr-helper.js`, `key-bookmarklet.js`, `single-source.js`) continue to pass with identical output across all four surfaces.
- **Required evidence:** Failing-first reproduction on `37ea241`, regression tests covering the exact `John F.` / `U. S.` vectors (and trailing option `C.`/`D.` before `\nB.`) in `tests/unit.js` (and/or fixtures), full Node/PHP baseline, `--check` builds, and 4-surface parity verification.
- **Non-goals / deferred checks:** Unchanged handling of `A.`–`D.` inside option text when no complete A–D option set survives without it, and live/browser staging checks beyond PC03's scope.

### `BLOCK-2` — Unmet acceptance: trailing-stem spaced initialisms immediately before `\nA.` still split the question

- **Evidence:** `src/parser/core.js:373-399`, `890-897`.
- **Quoted rule violated (`docs/plan/parser-convergence/pc-03-spaced-initialisms.md:39`):**
  > `Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag`
- **Exact defect:** When a spaced dotted initialism (`C. I. F.`, `A. D.`, `B. C.`, or wrapped `C. I.\nF.`) sits at the end of the question stem immediately before `\nA.` (or `\n\nA.` or inline `A.`) — e.g.:
  - `1. Which refers to C. I. F.\nA. cost insurance freight\nB. free on board\nC. carriage paid\nD. cash on delivery`
  - `1. This happened in A. D.\nA. 70\nB. 80\nC. 90\nD. 100`
  - `1. Babylon fell in 539 B. C.\nA. true\nB. false\nC. maybe\nD. unknown`
  - `1. The goods were shipped C. I.\nF.\nA. one\nB. two\nC. three\nD. four`
  `spacedInitialismSpans` includes the real `A.` label in the same span (`"C. I. F.\nA."`, `"A. D.\nA."`, `"B. C.\nA."`, `"C. I.\nF.\nA."`). Dropping all matches overlapping that span removes `A.`, so `hasCompleteOptionSet(narrowed)` returns `false`, the `D-111` filter is bypassed, and `parseQuestion` still splits on the stem's `C.`, `A.`, or `B.` (`c: "I. F."`, `a: "D. A. 70"`, `b: "C."`).
- **Supported operating preconditions:** Valid question whose stem ends with a spaced dotted initialism (`C. I. F.`, `A. D.`, `B. C.`, or OCR-wrapped `C. I.\nF.`) followed by a real A–D option block starting with `\nA.` (or `\n\nA.` / inline `A.`).
- **Closure criteria:**
  1. Trailing-stem `C. I. F.`, `A. D.`, `B. C.`, and wrapped `C. I.\nF.` followed by `\nA.` (and `\n\nA.`) remain in `question` and no longer split options or raise false structural/duplicate flags.
  2. Inline `1. Which refers to C. I. F. A. cost insurance freight B. free on board C. carriage paid D. cash on delivery` either also keeps `C. I. F.` in the stem with real `A.`–`D.` intact, or — if inline `C. I. F. A.` without a line break is explicitly excluded as an ambiguous 4-token run — is explicitly bounded and documented if unfixable without breaking `C. E. F. Small`; note that `\nA.` and `\n\nA.` MUST pass cleanly.
  3. Existing `C. E. F. Small` (`new-edge-initials-q46`) and `spaced-initialism-inner-option` remain unchanged.
- **Required evidence:** Failing-first reproduction on `37ea241` for the trailing-stem `C. I. F.`, `A. D.`, `B. C.`, and wrapped `C. I.\nF.` vectors before `\nA.`, added tests/fixtures, full baseline, `--check` builds, and 4-surface parity.
- **Non-goals / deferred checks:** Incomplete option sets lacking a full A–D set; lowercase `a. d.` / `a. m.` forms (already safe).

### `FIX-1` — Stale `ocr_helper.js` cache-busting query token in `deployed/admin_questions.php` and conflicting token documentation in `docs/DEPLOYMENT.md`

- **Evidence:** `ocr_helper.js:4` (`EXPECTED_CORE_VERSION = '2.5.5'`, sha256 changed `b83835b798c3` -> `86497f4d0686`), `deployed/admin_questions.php:1051` (`<script src="ocr_helper.js?v=2.4.7"></script>` unchanged), `docs/DEPLOYMENT.md:61, 100, 189` (`ocr_helper.js?v=2.4.5`).
- **Quoted rule violated (`docs/DEPLOYMENT.md:61` & `docs/plan/README.md:618`):**
  > `the helper token is bumped whenever the helper bytes change` (`docs/DEPLOYMENT.md:61`)
  > `current-facing docs match implemented behavior` (`docs/plan/README.md:618`)
- **Severity justification:** Core parsing behavior is present and the package acceptance table has no explicit helper-token row (`pc-03-spaced-initialisms.md:36-43`), so this does not meet `BLOCK`; however, because `ocr_helper.js` changed bytes (`EXPECTED_CORE_VERSION` `'2.5.4'` -> `'2.5.5'`) while `deployed/admin_questions.php:1051` kept `?v=2.4.7`, a browser holding cached `ocr_helper.js?v=2.4.7` alongside fresh `src/parser/core.js?v=2.5.5` will throw the version-mismatch error (`ocr_helper.js:31-48`) and disable the helper, and `docs/DEPLOYMENT.md` cites `?v=2.4.5` instead of the live tag.
- **Supported operating preconditions:** Production deployment of `deployed/admin_questions.php`, `src/parser/core.js`, and `ocr_helper.js` to browsers with an existing `ocr_helper.js?v=2.4.7` cache entry.
- **Closure criteria:**
  1. Bump the `ocr_helper.js` query token in `deployed/admin_questions.php:1051` (e.g., `?v=2.4.8`, since `?v=2.4.7` is already published on `331e81f`).
  2. Update `docs/DEPLOYMENT.md` (manifest row line 61, upload step line 100, smoke check line 189, and stale-token exclusion list) so every reference to the `ocr_helper.js` token and sha256 matches `deployed/admin_questions.php` and `ocr_helper.js` exactly (and likewise refresh `src/parser/core.js` / `deployed/admin_questions.php` sha256 hashes after the `BLOCK-1`/`BLOCK-2` fix).
  3. Update `pc-03-spaced-initialisms.md` handoff measurements and `php -l deployed/admin_questions.php`.
- **Required evidence:** Exact `grep`/line inspection of `deployed/admin_questions.php` and `docs/DEPLOYMENT.md`, updated sha256 verification, and `php -l`.
- **Non-goals / deferred checks:** Actual server deploy or CDN purge (owner-only external step).

### `NOTE-1` — Non-blocking handoff measurement and clone-reference discrepancies

- **Evidence:** `docs/plan/parser-convergence/pc-03-spaced-initialisms.md:72-97, 130-132`.
- **Quoted rule (`docs/plan/README.md:275-276, 298-301`):**
  > `For each live-origin production file, the cumulative additions from its archived live snapshot must not exceed 100 by git diff --numstat.`
  > `The handoff reports, per production file, additions/deletions from the package base, final lines/bytes, responsibility, deployment inclusion...`
- **Severity justification:** The actual files stay safely inside the 100-addition cap and all product/artifact bytes in `37ea241` match the measured hashes, so this documentation discrepancy does not invalidate correctness (`NOTE`, not `BLOCK` or `FIX`).
- **Details:**
  1. The handoff lists `deployed/admin_questions.php` base sha256 as `0b9eb5b2…`, whereas actual `331e81f:deployed/admin_questions.php` has sha256 `e4e013f78e80` (1,057 L / 62,877 B; already carrying `ocr_helper.js?v=2.4.7`).
  2. Independently reproduced live-origin `git diff --no-index --numstat` counts are `+96/-85` (`archive/live-sources/admin_questions-2026-10-31.php => deployed/admin_questions.php`) and `+51/-45` (`archive/live-sources/ocr_helper.js => ocr_helper.js`, or `+51/-47` vs `ocr_helper-2026-11-01.js`), versus the handoff's `+95` / `+58`. Both remain under the 100-addition cap.
  3. The handoff notes `no scratch/stimulus-followups ref` in the VM clone; `scratch/stimulus-followups` (`f3f5957`) exists in this repository, though PC03's `synthetic` fixture provenance (`pc-03-spaced-initialisms.md:99-102`) remains properly disclosed (`input_origin: "synthetic"`).

## Externalize-First Verification

### Production files (`331e81f` -> `37ea241`)

| Production path | Package base (`331e81f`) | Diff vs `331e81f` | Final (`37ea241`) | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,733 L / 60,722 B / `c9ac52b3a715` | `+38/-2` | 1,769 L / 61,942 B / `9597948d15fe` | Canonical pure parser `2.5.5` (one new helper `spacedInitialismSpans` + one filter in `parseQuestion`); site root `src/`, loaded by `admin_questions.php` and inlined by both bookmarklet builds | `tests/runner.js` (73), `tests/unit.js` (176), `tests/ocr-helper.js`, `tests/single-source.js` |
| `ocr_helper.js` | 127 L / 4,917 B / `b83835b798c3` | `+1/-1` | 127 L / 4,917 B / `86497f4d0686` | Thin deployed adapter (`EXPECTED_CORE_VERSION = '2.5.5'`); site root; `+51/-45` vs `archive/live-sources/ocr_helper.js` (cap <= 100) | `tests/ocr-helper.js` (39 checks, real module) |
| `src/bookmarklets/key/entry.js` | 596 L / 24,700 B / `14c33a5dc88a` | `+1/-1` | 596 L / 24,700 B / `34e78c3e1e89` | Key bookmarklet entry (`EXPECTED_CORE_VERSION = '2.5.5'`); inlined only into key artifact | `tests/key-bookmarklet.js` (42 checks, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B / `e4e013f78e80` | `+1/-1` | 1,057 L / 62,877 B / `d212cf8468ed` | Bumps `core.js?v=2.5.5` (`ocr_helper.js?v=2.4.7` left unbumped -> `FIX-1`); site root; `+96/-85` vs `archive/live-sources/admin_questions-2026-10-31.php` (cap <= 100) | `php -l deployed/admin_questions.php` (PASS); token consistency (`FIX-1`) |

### Test and fixture files (`331e81f` -> `37ea241`)

- New fixtures (`input_origin: "synthetic"`, manually transcribed, never parser-generated):
  - `fixtures/inputs/spaced-initialism-cif-stem.txt` (`+5/-0`) + `fixtures/expected/spaced-initialism-cif-stem.json` (`+36/-0`)
  - `fixtures/inputs/spaced-initialism-ad-stem.txt` (`+5/-0`) + `fixtures/expected/spaced-initialism-ad-stem.json` (`+37/-0`)
  - `fixtures/inputs/spaced-initialism-bc-stem.txt` (`+5/-0`) + `fixtures/expected/spaced-initialism-bc-stem.json` (`+36/-0`)
  - `fixtures/inputs/spaced-initialism-wrapped.txt` (`+6/-0`) + `fixtures/expected/spaced-initialism-wrapped.json` (`+36/-0`)
  - `fixtures/inputs/spaced-initialism-inner-option.txt` (`+5/-0`) + `fixtures/expected/spaced-initialism-inner-option.json` (`+35/-0`)
- Test updates:
  - `tests/fixtures/ocr-helper-spaced-initialism.txt` (`+5/-0`)
  - `tests/ocr-helper.js` (`+12/-1`): updates core mismatch assertion to `2.5.5` and adds real `loadThroughForm` Load vector
  - `tests/key-bookmarklet.js` (`+3/-3`): updates core version strings to `2.5.5`
  - `tests/single-source.js` (`+9/-6`): adds `spaced-initialism-cif-stem.txt` and `spaced-initialism-wrapped.txt` to real-artifact parity
  - `tests/unit.js` (`+29/-1`): adds 3 unit tests for spaced initialisms and updates `parsed.version` to `'2.5.5'`

### Excluded generated and archived artifacts

- `src/bookmarklet.js`: generated stimulus artifact (`1` L / `132,235` B / `132,234` B stripped / sha256 `ce8fbef5e150`; base `131,268` B / `445f9235b7e0`; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/single-source.js`, and `vm` parity.
- `src/bookmarklets/key/bookmarklet.js`: generated key artifact (`1` L / `72,389` B / `72,388` B stripped / sha256 `a7b61d24f08f`; base `71,422` B / `8d8c1a33c7c0`; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and `vm` parity.
- `src/bookmarklet.min.js`: absent/untracked, untouched.
- `archive/live-sources/*`: unchanged reference snapshots used only for cap verification.
- Docs (`331e81f..37ea241`): `AGENTS.md` (`+2/-2`), `docs/AGENTS.md` (`+1/-1`), `docs/DECISIONS.md` (`+24/-0`), `docs/DEPLOYMENT.md` (`+6/-6`), `docs/DEVELOPER-GUIDE.md` (`+2/-2`), `docs/EDGE_CASES.md` (`+3/-0`), `docs/INVARIANTS.md` (`+1/-0`), `docs/SPEC.md` (`+7/-1`), `docs/STATUS.md` (`+20/-3`), `docs/plan/README.md` (`+20/-8`), `docs/plan/parser-convergence/pc-03-spaced-initialisms.md` (`+97/-6`), `docs/plan/prompts/phase-map.md` (`+5/-3`).

## Approvals, Commit Readiness, and Next Action

- **Approvals:** Gate 1 amendment rejecting `spaced-initialism-inner-option` as a failing-first vector (keeping it as a must-stay-passing control) is owner-confirmed 2026-11-26 in `pc-03-spaced-initialisms.md:38`. `D-111` is recorded in `docs/DECISIONS.md:1847-1870`. No live-origin line-cap exception is needed (`+96/-85` and `+51/-45` stay below `+100`).
- **Commit readiness:** **not ready** to mark `done` or merge into `scratch/parser-convergence-cycle`.
- **Review status:** Phase 3 original rigorous review (round 1) complete with verdict **`BLOCK`**: `BLOCK-1`, `BLOCK-2`, and `FIX-1` are open in review round 1 (plus non-blocking `NOTE-1`). All open findings route directly to `fix-session.md` against their frozen closure contracts above.

NEXT COMMAND: @[docs/plan/prompts/fix-session.md] phase 3 BLOCK-1 BLOCK-2 FIX-1
