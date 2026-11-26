# PC04 — Marker-Adjacent Range Extraction

- **Status:** in progress — implemented on `scratch/pc04-marker-range` at base
  `9afe4f8` (core `2.5.6`, D-112); awaiting rigorous review
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

**Review status.** Implemented on `scratch/pc04-marker-range`; rigorous phase-4 review pending (requires separate explicit owner authorization to commit and push `scratch/pc04-marker-range` first).

`Commit: deferred`.
