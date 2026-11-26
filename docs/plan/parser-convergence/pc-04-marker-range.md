# PC04 — Marker-Adjacent Range Extraction

- **Status:** in progress — `BLOCK-1`–`BLOCK-5` fixes implemented on
  `scratch/pc04-marker-range` at base `9afe4f8` (core `2.5.6`, D-112); awaiting
  rigorous phase-4 re-review
- **Package base:** `9afe4f806e1254ecf74c93f13f5ee73d1c4fd497` (reconciled PC03
  cycle tip on `scratch/parser-convergence-cycle`)
- **Implementation branch:** short-lived `scratch/pc04-marker-range`
- **Depends on:** PC03 done and rigorous review settled
- **Blocks:** PC05
- **Review level:** rigorous
- **External gate:** none; parser and real-surface executable evidence
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Extend the canonical stimulus parser for the narrow P20 case: an explicit image
or diagram marker adjacent to a ranged intro may use that intro's question range
even when there is no table. This does not reopen the settled RM01 structural
heading/instruction fix.

## Scope

- Revalidate the supplied Q18-Q23 raw sample and transcribe expectations before
  code changes.
- Recognize only the approved exact marker grammar.
- Keep explicit marker ranges authoritative; otherwise derive targets only from
  the qualifying adjacent ranged intro.
- Preserve marker-only behavior when no valid block/range exists.

## Non-goals

- No image-plan lifetime, pause policy, bulk picker, generic inter-question tail
  deletion, unrelated-number inference, or UI change.
- No claim that the blocked P20 implementation is accepted evidence.

## Acceptance

| Check | Expected |
|---|---|
| Failing first | Revalidated P20 fixture reproduces the exact missing range/Option D contamination on package base |
| Range | Q20-Q22 only are targets; explicit marker range wins over intro range |
| False positives | Dates, years, amounts, account numbers, figure labels, option lines, and following questions never become targets |
| Field contract | Intro/marker text reaches no question/option field; surrounding blank-line behavior stays correct |
| Controls | Existing marker-placement, table-stimulus, no-valid-block, regions, bank, and anomaly fixtures remain unchanged |
| Surfaces | All three products use the same core result; product UI remains unchanged |
| Safety | Full baseline/build checks pass; no deploy, live action, or real-branch change |

## Handoff

**2026-11-26 — implemented, awaiting rigorous review.**

**Package base.** `9afe4f806e1254ecf74c93f13f5ee73d1c4fd497` on
`scratch/pc04-marker-range` (cut from the reconciled PC03 cycle tip
`scratch/parser-convergence-cycle`).

**Provenance.** The Q18–Q23 raw OCR sample and matching Answer Key lines 18–23
were independently revalidated from `scratch/stimulus-followups`
(`scratch-file.txt` lines 107–146 and Answer Key, `docs/NEW_EDGE_CASES.txt`),
transcribed into `fixtures/inputs/new-edge-image-intro-marker.txt` and
`fixtures/expected/new-edge-image-intro-marker.json` (`input_origin: "doc"`,
`status: "CONFIRMED"`) before any parser code change.

**Failing first (before any core change).** On untouched base `9afe4f8`:
- `node tests/runner.js` reported `74` fixtures: `73 PASS`, `1 FAIL`
  (`new-edge-image-intro-marker`: `needs_image` `[]` vs `[20,21,22]`,
  `stimuli[0].nums` `[]` vs `[20,21,22]`, `stimuli[0].text` `""` vs
  `"Use the diagram below to answer questions 20 to 22."`, `Q19.d`
  `"trade discount Use the diagram below to answer questions 20 to 22."` vs
  `"trade discount"`, `Q19.flags` `["option D contains section heading or instruction"]`
  vs `[]`, `Q20-Q22.needs_image` `false` vs `true`).
- `node tests/unit.js` reported `185 PASS`, `4 FAIL` on the new PC04 tests.

**Exact grammar and range rule (frozen as D-112).**
- Marker grammar stays strictly `STIMULUS_MARKER_LINE` (`[image]`, `[[image]]`,
  `[image: ...]`, `[[image: ...]]`) and `STIMULUS_MARKER_INLINE` (`[[image]]`,
  `[[image: ...]]`); `[missing text]` and `[diagram]` are not markers.
- `STIMULUS_INTRO_RANGE` matches only `questions?` followed by at least two
  question numbers (`<= 3` digits, `(?!\d)`) joined by range/list connectors
  (`-`, `–`, `—`, `to`, `and`, `&`, `,`, `, and`, `, &`).
- `stimulusIntroRange(line)` checks `stimulusIntroLine(line)` and passes only
  the `STIMULUS_INTRO_RANGE` capture group to `parseStimulusRange`.
  `parseStimulusRange` ignores digit runs over 3 digits (so 4-digit years like
  `2023` are never chopped into `202` + `3`) and supports `Q14-Q16` ranges.
- `stimulusEvidence` treats a recognized `stimulusIntroLine` as `intro` only and
  never as weak `table` evidence, so an intro containing dates, years, amounts,
  account numbers, and figure labels cannot falsely qualify as a table.
- `stimulusOptionLine` also recognizes parenthesized `(A)`–`(F)` option lines
  as structural boundaries.
- In `extractStimulusMarkers`, a standalone marker accepts `trimmed =
  trimStimulusRun(lines, run)` when `validStimulusBlock` holds OR when
  `stimulusBlockIntroRange(lines, trimmed.start, trimmed.end)` is non-empty;
  otherwise `nearestStimulusBlock` still checks only table-evidenced blocks.
  `stimulusMarkerRange` returns explicit `parseStimulusRange(mk.range)` when
  non-empty and otherwise `stimulusBlockIntroRange` from `mk.block`.
  Surrounding blank lines stay intact (`if (removed.has(i)) continue`).
- In `extractStimulusIntros` (still table-gated), `nums` prefers
  `stimulusIntroRange(lines[i])` with a single-question `stimulusSingleQuestionRef`
  fallback only when table evidence is present.

**Controls.** Existing `stimulus-marker-placements`, `new-edge-shared-stimulus`,
`region-*`, `spaced-initialism-*`, `bank-*`, `anomaly-*`, D-91 repeat matrices,
and no-valid-block/un-ranged/prose-separated/inline-marker controls remain
unchanged.

**Production files (package base `9afe4f8` → final).**

| File | Base | Final | Change | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,855 L / 65,965 B `28172dfafcb3…` | 1,892 L / 67,351 B `41585b05ab8b…` | `+48/-11` | canonical parser `2.5.6` (D-112 marker-adjacent ranged intro extraction & range isolation); site-root `src/`, loaded by `admin_questions.php`, inlined by both builders | `tests/runner.js` (74), `tests/unit.js` (189), `tests/ocr-helper.js` (42), `tests/single-source.js` (15), 5-vector 4-surface parity |
| `ocr_helper.js` | 127 L / 4,917 B `86497f4d0686…` | 127 L / 4,917 B `5cdba5c3b7e9…` | `+1/-1` | deployed manual adapter (`EXPECTED_CORE_VERSION` `2.5.6`); site root; live-origin `+51/-45` (cap <= 100) | `tests/ocr-helper.js` (42 checks, real module & Load path) |
| `src/bookmarklets/key/entry.js` | 596 L / 24,700 B `34e78c3e1e89…` | 596 L / 24,700 B `ddbd8aebd10e…` | `+1/-1` | key/autosave entry (`EXPECTED_CORE_VERSION` `2.5.6`); inlined only into key artifact | `tests/key-bookmarklet.js` (42 checks, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B `388d38532c83…` | 1,057 L / 62,877 B `1e193d34f9d3…` | `+2/-2` | `core.js?v=2.5.6` before `ocr_helper.js?v=2.4.9`; site root; live-origin `+96/-85` (cap <= 100) | `php -l deployed/admin_questions.php`; `docs/DEPLOYMENT.md` manifest (`15/15` hashes/tokens) |

**Excluded generated and archived artifacts (never hand-edited).**
- `src/bookmarklet.js`: 1 L / 136,254 B (`136,253` B stripped, sha256
  `54470e3027cf…`, rebuilt via `node src/build/build.js`, `--check` exit 0).
- `src/bookmarklets/key/bookmarklet.js`: 1 L / 76,408 B (`76,407` B stripped,
  sha256 `429fdc194cae…`, rebuilt via `node src/bookmarklets/key/build.js`,
  `--check` exit 0).
- `src/bookmarklet.min.js`: untracked/absent, untouched.
- `archive/live-sources/*`: unchanged reference snapshots for cap verification.

**Fixtures and test files added/updated.**
- `fixtures/inputs/new-edge-image-intro-marker.txt` (`46 L / 831 B`, sha256 `a7fac4014c4c…`)
- `fixtures/expected/new-edge-image-intro-marker.json` (`99 L / 2,939 B`, sha256 `f861eddabe52…`)
- `tests/unit.js` (`+115/-1`): 5 new PC04 tests + `parsed.version` `'2.5.6'`
- `tests/ocr-helper.js` (`+18/-1`): Q19/Q20–Q22 Load test + version check `'2.5.6'`
- `tests/key-bookmarklet.js` (`+3/-3`): version assertions updated to `'2.5.6'`
- `tests/single-source.js` (`+3/-2`): `new-edge-image-intro-marker.txt` + noisy intro parity vector

**Commands and results.**

| Command | Result |
|---|---|
| `node src/build/build.js --check` / key `--check` | exit 0 (`136,253` / `76,407` B stripped); `wc -l` `1`; `node --check` PASS |
| `node tests/runner.js` | 74 fixtures: 74 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 189 PASS, 0 FAIL |
| `node tests/ocr-helper.js` | 42 PASS |
| `node tests/key-bookmarklet.js` | 42 PASS |
| `node tests/single-source.js` | 15 PASS |
| `node tests/underline-toolbar.js` / `question-preview` / `math-tool` / `render-markup` | 10 / 7 / 26 / 69 PASS |
| `node tools/extract-bank.js --check` | 7 hashes OK |
| 5-vector 4-surface `vm` parity (`core`, `ocr_helper`, `bookmarklet.js`, `key/bookmarklet.js`) | 5/5 PASS |
| PHP 8.5.12 CLI: `php-render` / `admin-question-store` / `cbt-question-order` / `php -l` | 33 / 8 / 14 PASS, 7/7 lint |
| `git diff --check` | exit 0 |

**Acceptance mapping.**
- Failing first: `new-edge-image-intro-marker` and 4 new unit tests failed on `9afe4f8` before core edits; all now pass.
- Range: Q20–Q22 only get `needsImage` (`needs_image: [20, 21, 22]`); `[image: 21]` and `[[image: 20, 22]]` override the intro range.
- False positives: dates, years, amounts, account numbers, figure labels, `(A)`–`(F)`/`A.`–`F.` option lines, `[diagram]`, un-ranged intros, and following questions never become targets.
- Field contract: Q19.D is `trade discount` with `flags: []` across `core`, `ocr_helper.js` Load, and both bookmarklets; surrounding blank lines are preserved.
- Controls & surfaces: all 74 fixtures and 189 unit vectors pass; `src/ui/ui.js` is untouched; 4-surface parity verified.
- Safety: no deploy, live write/delete, or real-branch change.

**Open questions / gaps.** `php tests/cbt-staging.php` requires a disposable MySQL URL and was not run (no PHP logic changed).

**Review status.** Implemented on `scratch/pc04-marker-range`; round 1 rigorous review ([record](../reviews/parser-convergence-2026-11-phase-4.md)) returned `BLOCK` (`BLOCK-1`–`BLOCK-5`, `NOTE-1`).

**2026-11-26 — phase-4 fix (`BLOCK-1`–`BLOCK-5`), awaiting rigorous re-review.**

**Failing-first reproduction (against unfixed candidate `b2cb897`).**
Five additive regression blocks in `tests/unit.js` and the PC04 Load suite in `tests/ocr-helper.js` were added and run before editing `src/parser/core.js`:
- `BLOCK-1` (`tests/unit.js`): `S1 stem` failed: `actual ''` vs `expected 'What does the diagram below, used for questions 20 to 22, show?'` (and `tests/ocr-helper.js` Q19 Load failed on `S1`: `actual ''` vs `expected 'What does the diagram below, used for questions 20 to 22, show?'`).
- `BLOCK-2` (`tests/unit.js`): `N1 nums` failed: `actual [20, 21, 22, 25]` vs `expected [20, 21, 22]`.
- `BLOCK-3` (`tests/unit.js`): `A1 empty nums` failed: `actual [20, 21, 22]` vs `expected []`.
- `BLOCK-4` (`tests/unit.js`): `R1 Q19 options` failed: `actual ['one', 'two', 'three', 'four Answer questions 20, 22 and 24.']` vs `expected ['one', 'two', 'three', 'four']`.
- `BLOCK-5` (`tests/unit.js`): `G1 no marker stimulus` failed: `actual [{ id: 'stim-1', marker: '[image]]', nums: [20, 21, 22], text: 'Use the diagram below to answer questions 20 to 22.', ... }]` vs `expected undefined`.
- `tests/unit.js` unfixed summary: `189 PASS, 5 FAIL`.

**Frozen closure mapping (implementation and evidence).**
- `BLOCK-1` (`S1–S5`, controls `D) "I"`, raw fixture, `P1`, `P2`): `REGION_OPTION` now recognizes `[A-F]\/[^\S\n]+` slash labels (`S3`), `splitRegions` preserves wrapped option text immediately after `isBareOptionLabel` (`S4`), `stimulusOptionLine` recognizes `[a-f]` bare/dotted/paren and `[A-Fa-f]/` labels (`S2`, `S3`), `stimulusStructuralLine` includes `inlineOptionSet(line)` (`S5`), `stimulusIntroLine` rejects interrogative `?$` stems (`S1`) and quoted sentences, and `rangedBlockConsumesStem` prevents a ranged-intro-only block from deleting the sole stem before options. Verified via `tests/unit.js`, `tests/ocr-helper.js` (real `Load` for `S1`, `S2`, `S5`, raw), `tests/single-source.js`, and real staging browser `Load` across all three products (`S1`, `S2`, `S5`, raw).
- `BLOCK-2` (`N1–N5`, controls `B6`, `P1`, `P2`, `questions 20, 22.`, `questions Q20-Q22.`): `stimulusIntroRangeText` isolates the `questions ...` range/list span, rejects thousands-grouped (`1,200`), decimal (`25.50`), slash-date, and multi-hyphen (`25-10-2023`) tokens, and rolls back `,`-introduced prose tails unless the tail ends cleanly (`validEnd` or `Q`-prefixed). Verified via `tests/unit.js` (`N1–N5` and controls), `tests/ocr-helper.js` (`N1`, `N2`), `tests/single-source.js` (`N2`), and real staging browser `Load` (`N1`, `N2` across all three products, with stimulus `#ocr_img_range_0` defaulting to `20-22` and accepting Attach as `Ready`).
- `BLOCK-3` (`A1`, `A2`, controls `A3`, raw fixture): `extractStimulusMarkers` sets `mk.adjacent = hasTableBlock || hasRangedIntro` and `stimulusMarkerRange` derives intro ranges only when `adjacent` is true (never from `nearestStimulusBlock`), while explicit `[image: 21]` (`A3`) remains authoritative. Verified via `tests/unit.js` (`A1–A3`), `tests/ocr-helper.js` (`A1`), `tests/single-source.js` (`A1`), and real staging browser `Load` (`A1` across all three products, with stimulus `#ocr_img_range_0` empty `""`).
- `BLOCK-4` (`R1`, `R2`, control raw fixture): `splitRegions` exempts an instruction line only when `stimulusIntroLine(line)` holds rather than checking raw `STIMULUS_INTRO_RANGE`, keeping `Answer questions 20, 22 and 24.` and `Answer questions Q20 to Q22.` out of Q19.D as a single `instruction` region across Q20–Q26 with `Q20.sectionInstruction` intact. Verified via `tests/unit.js` (`R1`, `R2`), `tests/ocr-helper.js` (`R1`), `tests/single-source.js` (`R1`), and real staging browser `Load` (`R1` pre-submit values across all three products).
- `BLOCK-5` (`G1–G4`, controls `[missing text]`, `[diagram]`, `[image]`, `[[image]]`, `P1`, `P2`, `H [[image: 21]]`): `STIMULUS_MARKER_LINE` requires paired single `[...]` or double `[[...]]` delimiters, rejecting `[image]]`, `[[image]`, `[image: 21]]`, and `[[image: 21]`. Verified via `tests/unit.js` (`G1–G4` and controls), `tests/ocr-helper.js` (`G1`), `tests/single-source.js` (`G1`), and real staging browser `Load` (`G1` across all three products with `#ocr_image_plan` hidden).

**Production files (cumulative from package base `9afe4f8` → post-fix).**

| File | Base (`9afe4f8`) | Final | Cumulative `+/-` | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,855 L / 65,965 B `28172dfafcb3…` | 1,965 L / 70,150 B `c28fc6303b55…` | `+129/-19` | canonical pure parser `2.5.6` (D-112 + `BLOCK-1`–`BLOCK-5` fixes); site-root `src/`, loaded by `admin_questions.php`, inlined by both builders | `tests/runner.js` (74), `tests/unit.js` (194), `tests/ocr-helper.js` (43), `tests/single-source.js` (15), `tests/key-bookmarklet.js` (42), 73-prior-input diff (0 diffs), staging Loads (27/27) |
| `ocr_helper.js` | 127 L / 4,917 B `86497f4d0686…` | 127 L / 4,917 B `5cdba5c3b7e9…` | `+1/-1` | deployed manual adapter (`EXPECTED_CORE_VERSION` `2.5.6`); site root; live-origin `+51/-45` (cap <= 100) | `tests/ocr-helper.js` (43 checks), staging manual `Load` (9/9) |
| `src/bookmarklets/key/entry.js` | 596 L / 24,700 B `34e78c3e1e89…` | 596 L / 24,700 B `ddbd8aebd10e…` | `+1/-1` | key/autosave entry (`EXPECTED_CORE_VERSION` `2.5.6`); inlined only into key artifact | `tests/key-bookmarklet.js` (42 checks), staging key `Load` (9/9) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B `388d38532c83…` | 1,057 L / 62,877 B `1e193d34f9d3…` | `+2/-2` | `core.js?v=2.5.6` before `ocr_helper.js?v=2.4.9`; site root; live-origin `+96/-85` (cap <= 100) | `php -l` (8.5.12 & 8.3.32), staging page, `docs/DEPLOYMENT.md` manifest (`15/15`) |

**Excluded generated and archived artifacts (never hand-edited).**
- `src/bookmarklet.js`: 1 L / 138,754 B (`138,753` B stripped, sha256 `226dd6df3c81…`, rebuilt via `node src/build/build.js`, `--check` exit 0, `node --check` pass, `%HH`-free, `tests/single-source.js` + staging stimulus `Load` 9/9 + `N1`/`N2` Attach `Ready`).
- `src/bookmarklets/key/bookmarklet.js`: 1 L / 78,908 B (`78,907` B stripped, sha256 `72478e694bd3…`, rebuilt via `node src/bookmarklets/key/build.js`, `--check` exit 0, `node --check` pass, `%HH`-free, `tests/key-bookmarklet.js` + `tests/single-source.js` + staging key `Load` 9/9).
- `src/bookmarklet.min.js`: untracked/absent, untouched.
- `archive/live-sources/*`, root `admin_questions.php` / `answer_details.php` / `cbt.php` / `cbt_practice.php`, and `docs/plan/reviews/parser-convergence-2026-11-phase-4.md`: excluded evidence/review records, untouched.

**Verification summary (post-fix).**
- `node src/build/build.js --check` / `node src/bookmarklets/key/build.js --check`: exit 0 (`138,753` / `78,907` B stripped); `wc -l`: `1` each; `node --check`: PASS.
- `node tests/runner.js`: 74 fixtures: 74 PASS, 0 FAIL, 0 PENDING.
- 73 prior inputs from `9afe4f8`: 0 diffs vs base `parsePaste` (ignoring `version`) and `ocr_helper.parseAll`.
- `node tests/unit.js`: 194 PASS, 0 FAIL.
- `node tests/ocr-helper.js`: 43 PASS.
- `node tests/key-bookmarklet.js`: 42 PASS.
- `node tests/single-source.js`: 15 PASS (including `S1`, `S5`, `N2`, `A1`, `R1`, `G1` parity).
- `node tests/underline-toolbar.js` / `question-preview.js` / `math-tool.js` / `render-markup.js`: 10 / 7 / 26 / 69 PASS; `node tools/extract-bank.js --check`: 7 hashes OK.
- PHP CLI `8.5.12` and `8.3.32` (`$HOME/tmp/php83-review/php`): `php-render` (33), `admin-question-store` (8), `cbt-question-order` (14), `php -l` on all 7 `deployed/*.php` files PASS.
- Disposable SQLite HTTP staging (`tools/start-phone-staging.sh`, Chromium `157.0.8103.38` via `chromium-cdp`): `coreVersion: "2.5.6"`, 0 `pageerror`, 0 POSTs across 27 real `Load` calls (`raw`, `S1`, `S2`, `S5`, `N1`, `N2`, `A1`, `R1`, `G1` on manual, key, and stimulus), plus real PNG Attach on `N1`/`N2` (`#ocr_img_range_0 = "20-22"`, status `"Ready"`), `A1` (`#ocr_img_range_0 = ""`), and `G1` (`#ocr_image_plan` hidden); staging and CDP stopped and cleaned afterwards.

**Review status.** `BLOCK-1`–`BLOCK-5` fixes implemented on `scratch/pc04-marker-range`; requires independent rigorous phase-4 re-review (`NOTE-1` documentation drift remains deferred/non-blocking).

`Commit: deferred`.
