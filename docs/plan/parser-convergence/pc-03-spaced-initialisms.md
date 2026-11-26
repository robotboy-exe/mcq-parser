# PC03 — Spaced Initialism Option Boundaries

- **Status:** in progress — implemented 2026-11-26 on
  `scratch/pc03-spaced-initialisms`; awaiting rigorous review
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
| `src/parser/core.js` | 1,733 L / 60,722 B `c9ac52b3…` | 1,769 L / 61,942 B `9597948d…` | `+38/-2` | canonical parser; site-root `src/`, loaded by the admin page and inlined by both builders | five new fixtures, `tests/unit.js`, `tests/ocr-helper.js` Load, real-artifact parity |
| `ocr_helper.js` | 127 L / 4,917 B `b83835b7…` | same size `86497f4d…` | `+1/-1` | deployed adapter's `EXPECTED_CORE_VERSION` `2.5.5`; site root | `tests/ocr-helper.js` (real module) |
| `src/bookmarklets/key/entry.js` | `2.5.4` guard | `2.5.5` guard `34e78c3e…` | `+1/-1` | key product core-version guard; inlined into the key artifact only | `tests/key-bookmarklet.js` (42 vectors, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B `0b9eb5b2…` | same size `d212cf84…` | `+1/-1` | core query token `?v=2.5.5`; site root | token check in `docs/DEPLOYMENT.md`; no PHP behavior change |

Live-origin caps: `deployed/admin_questions.php` moves from +94 to +95 recorded
cumulative additions and `ocr_helper.js` from +57 to +58; both stay inside the
100-addition cap with no exception.

**Excluded generated artifacts (rebuilt, never hand-edited).**
`src/bookmarklet.js` 1 L / 132,235 B `ce8fbef5…` (base 131,268 B);
`src/bookmarklets/key/bookmarklet.js` 1 L / 72,389 B `a7b61d24…` (base 71,422 B).
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
| `node tests/unit.js` | 176 PASS, 0 FAIL |
| `node tests/ocr-helper.js` | 39 PASS |
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

**Review status.** Product candidate committed at the owner's explicit request as
`186d27e` on `origin/scratch/pc03-spaced-initialisms` (product tree the same as
measured above); this handoff-only child records the pushed ref the rigorous
review must target. Nothing is merged. `Commit: 186d27e`.
