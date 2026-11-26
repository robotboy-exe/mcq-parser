# PC03 — Spaced Initialism Option Boundaries

- **Status:** in progress — the phase-3 review returned `BLOCK` (`BLOCK-1`,
  `BLOCK-2`, `FIX-1`); the authorized fix is applied 2026-11-26 on
  `scratch/pc03-spaced-initialisms`; awaiting re-review
- **Package base:** `331e81f` (the reconciled PC02 boundary; product tree and
  review records match `55afe15`)
- **Implementation branch:** short-lived `scratch/pc03-spaced-initialisms`
- **Depends on:** PC02 done and rigorous review settled
- **Blocks:** PC04
- **Review level:** rigorous
- **External gate:** none; parser and real-surface executable evidence
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Investigate and, only with failing-first evidence, prevent spaced dotted
initialisms such as `C. I. F.` and `A. D.` from becoming option boundaries in
the canonical core.

## Scope

- Revalidate P23's raw examples against the review-settled core; do not trust the
  old proposed patch or infer expected fields from parser output.
- Add manually transcribed fixtures for initials in stems, inside options, and
  across OCR wraps before changing code.
- Make the narrowest core-only selector change that passes those fixtures and
  every existing D-91/option-boundary control through all three surfaces.

## Non-goals

- No stimulus, image, header-contamination, multi-paper, missing-label, UI,
  autosave, or storage change.
- No broad abbreviation dictionary or nearest-label guessing.
- No source reuse from the blocked stimulus worktree without independent proof.

## Acceptance

| Check | Expected |
|---|---|
| Failing first | C.I.F., A.D., B.C., and wrapped-initial vectors fail on package base for the documented reason. Inner-option already passes on package base and is a must-stay-passing control (Gate 1 amendment, owner-confirmed 2026-11-26), not a failing-first vector |
| Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag |
| Controls | D-91 repeat matrices, Q46, complete duplicate sets, incomplete sets, blank options, E/F, slash labels, and bank/anomaly fixtures remain unchanged |
| Surfaces | Core, deployed helper, key bookmarklet, and stimulus bookmarklet return identical parsed fields |
| Baseline | Full Node/PHP baseline, build checks, bank extractor, and adversarial review probe pass |
| Safety | No deploy, live action, or real-branch change |

## Handoff

**2026-11-26 — implemented, awaiting rigorous review.**

**Package base.** `331e81f` on `scratch/pc03-spaced-initialisms`, cut from the
reconciled PC02 cycle tip.

**Failing first (before any code change).** On the package base
`node tests/runner.js` reported 73 fixtures, 69 PASS, 4 FAIL:
`spaced-initialism-cif-stem`, `-ad-stem`, `-bc-stem`, and `-wrapped`.
`spaced-initialism-inner-option` passed on the base and is kept as the approved
must-stay-passing control. Observed base failures: the stem `C.` bound Option C
to `I. F. Lagos terms` and pushed the real label into Option B; the stem `A. D.
70` truncated the question to `The second temple was destroyed in` and put
`D. 70 by A. the Persians` into Option A; spaced `B. C.` truncated the stem and
made `C. in order to` Option B; the wrapped `C. I.` / `F.` run made `two C.
three` Option B and `I. F. Lagos by the firm` Option C.

**Root cause.** `OPTION` consumes trailing horizontal whitespace, so
`isOptionAbbreviation`'s `/\s$/` short-circuit returned false and the D-48 skip
never applied to a spaced dotted form.

**Selector change (frozen as D-111).** `spacedInitialismSpans(raw)` collects
maximal runs of at least two single uppercase `X.` tokens separated only by
whitespace (one OCR wrap counts). After the D-91/paren and unlinked-passage
filters, and immediately before selection, accepted labels overlapping such a
run are discarded only when `hasCompleteOptionSet` still holds on the remaining
labels; otherwise the matches are left untouched. One new helper plus one filter
in `src/parser/core.js`; `OPTION`, `LOOSE`, `FIXES`, `splitQuestions`, regions,
E/F collapse, and product policy are unchanged.

**Files (package base → final).**

| File | Base | Final | Change | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,733 L / 60,722 B `c9ac52b3…` | 1,829 L / 64,452 B `42739697…` | `+98/-2` | canonical parser; site-root `src/`, loaded by the admin page and inlined by both builders | five new fixtures, `tests/unit.js`, `tests/ocr-helper.js` Load, real-artifact parity |
| `ocr_helper.js` | 127 L / 4,917 B `b83835b7…` | same size `86497f4d…` | `+1/-1` | deployed adapter's `EXPECTED_CORE_VERSION` `2.5.5`; site root | `tests/ocr-helper.js` (real module) |
| `src/bookmarklets/key/entry.js` | `2.5.4` guard | `2.5.5` guard `34e78c3e…` | `+1/-1` | key product core-version guard; inlined into the key artifact only | `tests/key-bookmarklet.js` (42 vectors, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B `0b9eb5b2…` | same size `388d3853…` | `+2/-2` | core token `?v=2.5.5` and helper token `?v=2.4.8`; site root | token check in `docs/DEPLOYMENT.md`; `php -l`; no PHP behavior change |

Live-origin caps: `deployed/admin_questions.php` moves from +94 to +95 recorded
cumulative additions and `ocr_helper.js` from +57 to +58; both stay inside the
100-addition cap with no exception.

**Excluded generated artifacts (rebuilt, never hand-edited).**
`src/bookmarklet.js` 1 L / 132,235 B `ce8fbef5…` (base 131,268 B);
`src/bookmarklets/key/bookmarklet.js` 1 L / 74,341 B `dbed22f1…` (base 71,422 B).
`src/bookmarklet.min.js` stays untracked and untouched.

**Tests and fixtures.** New `fixtures/inputs` + `fixtures/expected` pairs:
`spaced-initialism-cif-stem`, `-ad-stem`, `-bc-stem`, `-wrapped`, and the
`-inner-option` control (all `input_origin: synthetic`, package-derived). New
`tests/fixtures/ocr-helper-spaced-initialism.txt` for the deployed helper Load
path. `tests/unit.js` adds three vectors; `tests/single-source.js` now compares
both real generated artifacts against `core.js` on `bank-2021` plus the CIF and
wrapped vectors.

**Commands and results (package tip).**

| Command | Result |
|---|---|
| `node tests/runner.js` | 73 fixtures: 73 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 181 PASS, 0 FAIL |
| `node tests/ocr-helper.js` | 40 PASS |
| `node tests/key-bookmarklet.js` | 42 PASS |
| `node tests/underline-toolbar.js` / `question-preview` / `math-tool` / `render-markup` | 10 / 7 / 26 / 69 PASS |
| `node tests/single-source.js` | 15 PASS (parity now includes the initialism vectors) |
| `node src/build/build.js --check` / key `--check` | exit 0 (132,234 / 72,388 B stripped) |
| `node tools/extract-bank.js --check` | 7 hashes OK |
| PHP 8.3.9 CLI: `php-render` / `admin-question-store` / `cbt-question-order` | 33 / 8 / 14 PASS |
| `php -l deployed/*.php` | 7/7 |

The PHP runtime used is a static PHP 8.3.9 CLI build at
`$HOME/toolchain/php/php`, downloaded for this workspace; it is not a system
package and does not survive archiving.

**Surfaces.** Core and both real generated artifacts return identical
`parsePaste` output on the new vectors; the deployed helper's real `parseAll`
plus `fillForm` Load path keeps the stem initialism out of every native field;
the key artifact suite passes on the real generated bookmarklet. No browser
install gate is part of PC03.

**Open questions.** P23's original raw samples are absent from this clone (no
`scratch/stimulus-followups` ref, no P23 commit, no doc copy), so provenance is
recorded as package-derived `synthetic`; the package goal's two named examples
are covered. `php tests/cbt-staging.php` still needs a disposable MySQL URL and
did not run (no PHP changed). PC02's `NOTE-2` residual is unaffected. Deployment
tokens are rotated in the reviewed files, but no deploy or live action was
performed.

**2026-11-26 — phase-3 review fix (`BLOCK-1`, `BLOCK-2`, `FIX-1`).** Authorized
by the phase-3 review ([record](../reviews/parser-convergence-2026-11-phase-3.md))
in its first review round; no closure contract was broadened.

**Failing first (before the core change).** `node tests/unit.js` reported
177 PASS / 3 FAIL on the three new boundary tests, e.g.
`+ actual '1. Who is John F. A. Kennedy'` vs expected `'1. Who is John F.'`, and
`node tests/ocr-helper.js` aborted at the real Load path with
`+ actual 'Who is John F. A. Kennedy'` vs expected `'Who is John F.'`. The same
defects were observed directly on `37ea241` (`BLOCK-1`) and on `331e81f`
(`BLOCK-2`: `c: "I. F."`, `a: "D. A. 70"`, `b: "C."`).

**Fix.** In `src/parser/core.js` only, inside the existing D-111 guard:
`orderedOptionCompletion`, `isOptionLineStart`, and `isRealOptionBoundary` end a
run before a token that starts an option line and is followed by the ordered
rest of the set (`initialismTokens` shares the token scan), and the filter
restores the earliest covered label for each letter an otherwise complete set
still needs. `OPTION`, `LOOSE`, `FIXES`, `splitQuestions`, regions, E/F collapse,
and product policy are unchanged; core stays `2.5.5` because that version is
unreleased, and `ocr_helper.js` bytes and `EXPECTED_CORE_VERSION` are unchanged.

**Closure mapping.**

| Finding | Frozen criterion | Implementation | Evidence |
|---|---|---|---|
| `BLOCK-1` | a real line-start `A.`–`D.` after `[A-Z].` is never absorbed or discarded; both named stem vectors match `331e81f`; controls unchanged | `isRealOptionBoundary` ends the run; the restore keeps a needed label | `tests/unit.js` "…real option line after a trailing stem initial" (`John F.`, `U. S.`), "…after an option ending in an initialism" (`terms C. I. F.` before `B.`), "…after a single trailing initial" (`Vitamin C.`/`John D.` before `B.`); runner/unit/helper/key/single-source green |
| `BLOCK-2` | trailing `C. I. F.`, `A. D.`, `B. C.`, wrapped `C. I.\nF.` before `\nA.` and `\n\nA.` stay in `question`; inline `C. I. F. A. …` also passes; `C. E. F. Small` and inner-option unchanged | boundary split plus covered-label restore | `tests/unit.js` six-vector boundary test (line, blank-line, wrapped, inline); `spaced-initialism-inner-option` and `new-edge-initials-q46` fixtures green |
| `FIX-1` | helper token bumped; every DEPLOYMENT token/hash matches; package measurements and lint updated | `deployed/admin_questions.php:1051` `?v=2.4.8`; `docs/DEPLOYMENT.md` rows, upload step, smoke row, stale list, hashes | `grep` shows `core.js?v=2.5.5` before `ocr_helper.js?v=2.4.8`; `sha256sum` `388d3853…` (admin), `42739697…` (core), `86497f4d…` (helper); `php -l` 7/7 |

**Final measurements (package base `331e81f`).** `src/parser/core.js`
1,733 L / 60,722 B → 1,829 L / 64,452 B (`+98/-2`, `42739697…`);
`ocr_helper.js` unchanged (`86497f4d…`, live-origin `+51/-45`);
`src/bookmarklets/key/entry.js` `+1/-1` (`34e78c3e…`);
`deployed/admin_questions.php` 1,057 L / 62,877 B (`+2/-2`, `388d3853…`,
live-origin `+96/-85`); both live-origin files stay inside the 100-addition cap
with no exception. Generated artifacts: `src/bookmarklet.js` 1 L / 134,187 B
`ba4a79ae…` (base 131,268 B) and `src/bookmarklets/key/bookmarklet.js`
1 L / 74,341 B `dbed22f1…` (base 71,422 B); both `--check` guards exit 0 and
`src/bookmarklet.min.js` is untouched.

**New regression files.** `tests/fixtures/ocr-helper-spaced-initialism-boundaries.txt`
(two questions loaded through the real form; the deployed helper's Load path
keeps `John F.` and `C. I. F.` out of every option field), new `tests/unit.js`
blocks (four tests, six BLOCK-2 vectors, and the blank-line `A.\n\nB.` stem
control), and two inline parity vectors added to `tests/single-source.js`.
`tests/ocr-helper.js` gains one real Load test; no existing assertion was
weakened or removed. The required 4-surface parity (core, deployed helper, both
real generated artifacts) is green on 12 boundary vectors.

**Commands and results (fix tip).**

| Command | Result |
|---|---|
| `node tests/runner.js` | 73 fixtures: 73 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 181 PASS, 0 FAIL |
| `node tests/ocr-helper.js` | 40 PASS |
| `node tests/key-bookmarklet.js` | 42 PASS |
| `node tests/underline-toolbar.js` / `question-preview` / `math-tool` / `render-markup` | 10 / 7 / 26 / 69 PASS |
| `node tests/single-source.js` | 15 PASS |
| `node src/build/build.js --check` / key `--check` | exit 0 (134,122 / 74,295 B stripped) |
| `node tools/extract-bank.js --check` | 7 hashes OK |
| PHP 8.3.9 CLI: `php-render` / `admin-question-store` / `cbt-question-order` / `php -l` | 33 / 8 / 14 PASS, 7/7 lint |

**Review status.** The phase-3 review record is at
[`reviews/parser-convergence-2026-11-phase-3.md`](../reviews/parser-convergence-2026-11-phase-3.md)
(`BLOCK`, review round 1). This fix is committed on
`scratch/pc03-spaced-initialisms` at the owner's explicit request; re-review of
that exact candidate is required. Nothing is merged. `Commit: pending`.
