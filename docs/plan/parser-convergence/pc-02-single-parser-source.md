# PC02 — Single Parser Source

- **Status:** in progress — implemented 2026-11-26 on
  `scratch/pc02-single-parser-source` from package base `0279e70`; awaiting
  rigorous review. Brave installability is not yet evidenced.
- **Package base:** `0279e70` (the reconciled PC01 boundary; product tree
  byte-identical to the reviewed candidate `cc72e3b`)
- **Implementation branch:** short-lived `scratch/pc02-single-parser-source`
- **Depends on:** PC01 done and rigorous review settled
- **Blocks:** PC03
- **Review level:** rigorous
- **External gate:** desktop and Brave bookmarklet installability
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Make `src/parser/core.js` the only parser implementation. Both bookmarklets and
the deployed helper must consume that exact core; product policy remains in
surface-specific modules.

## Scope

1. Replace the inlined parser copy in `src/parser/parser.js` with a thin Node
   compatibility facade over `core.js` and the stimulus bookmarklet's pure
   autosave helpers.
2. Move non-parser autosave/saved-log helpers into a focused stimulus-bookmarklet
   module. Do not label product policy as parser code.
3. Build the stimulus bookmarklet from `core.js` plus its own helpers/UI. Keep
   the key bookmarklet on `core.js` plus its own entry.
4. Add static and executable guards proving no second source file defines the
   core parser API and each generated product includes one current core.
5. Add deterministic build checks for stale generated outputs.

## Non-goals

- No parser output, product UI, storage shape, autosave decision, or key grammar
  change.
- No P20-P23 behavior.
- No attempt to share bookmarklet policy merely because both products autosave.
- No deploy, PHP, schema, or real-branch change.

## Percent/build decision

`core.js` contains a modulo operator. Gate 1 must measure both generated sizes
and explicitly freeze one reviewed approach: either a semantics-preserving
source expression that keeps the existing no-`%` output rule, or the key
builder's narrower rejection of `%HH` escapes plus real desktop/Brave install
evidence. Do not silently weaken D-35.

## Acceptance

| Check | Expected |
|---|---|
| Core identity | Core bytes and all parser outputs are unchanged from package base |
| Facade | Node callers receive the exact core function identities plus only named stimulus autosave helpers |
| Source guard | Only `src/parser/core.js` defines `OPTION`, `splitQuestions`, `splitRegions`, `parseQuestion`, and stimulus extraction |
| Generated products | Both bookmarklets are one line, syntax-valid, deterministic, current-core, and separately installable |
| Surface behavior | Deployed, key bookmarklet, and stimulus bookmarklet behavior is unchanged from PC01 |
| Tests | Full baseline, real build-output VM probes, stale-build check, core/facade identity checks, and bank extractor pass |
| Safety | No deploy, live action, or real-branch change |

## Handoff

**2026-11-26 — implemented, awaiting rigorous review.**

**Package base.** `0279e70` on `scratch/pc02-single-parser-source`; product tree
identical to the reviewed PC01 candidate `cc72e3b`.

**Percent/build decision (frozen at Gate 1, recorded as D-110).** The canonical
core contains one `%`, `out.length % 8` in `expandTabs`. The stimulus build
adopts the key build's narrower `%HH` rejection instead of rewriting core bytes;
the key artifact already ships that same modulo with no `%HH`. Core bytes stay
unchanged, so the single-source and version evidence stays intact.

**Files (package base → final).**

| File | Base | Final | Change |
|---|---|---|---|
| `src/parser/core.js` | 1,733 L / 60,722 B `c9ac52b3…` | unchanged | none |
| `src/parser/parser.js` | 1,337 L / 50,419 B `0a9bff5f…` | 7 L / 363 B | inlined parser copy and 592-line helper block removed; Node facade only |
| `src/bookmarklets/stimulus/autosave.js` | absent | 592 L / 24,853 B | new: stimulus autosave/saved-log/classification helpers moved verbatim |
| `src/build/build.js` | 258 L / 7,232 B | 272 L / 8,028 B | inlines core + autosave + ui; `%HH` guard; `--check` |
| `src/bookmarklets/key/build.js` | 44 L / 1,364 B | 54 L / 1,790 B | `--check` only |
| `src/ui/ui.js` | 1,431 L / 61,701 B | unchanged | none |
| `src/bookmarklet.js` (generated) | 1 L / 101,337 B | 1 L / 131,268 B | regenerated from the core |
| `src/bookmarklets/key/bookmarklet.js` (generated) | 1 L / 71,422 B `8d8c1a33…` | unchanged | `--check` reproduces it byte-for-byte |
| `tests/single-source.js` | absent | new | 15 guards |

Unchanged: `ocr_helper.js` 127 L / 4,917 B `b83835b7…`, `src/bookmarklets/key/`
sources, `deployed/*.php`, `fixtures/`. No live-origin file approaches the
100-line cap; `src/parser/parser.js` shrinks by 1,330 lines.

**Acceptance.**

| Check | Evidence |
|---|---|
| Core identity | `core.js` bytes and hash unchanged; 68 runner fixtures and 173 unit checks unchanged; generated-artifact `vm` parity with `core.js` on `bank-2021` |
| Facade | `tests/single-source.js`: every core export is the same object/function; only the 31 named stimulus helpers are added; facade source has no parser definition |
| Source guard | Static scan of `src/**/*.js` plus `ocr_helper.js`: only `core.js` defines `OPTION`, `splitRegions`, `splitQuestions`, `parseQuestion`, `extractStimuli`, `extractStimulusMarkers`, `extractStimulusIntros`. Failing-first: the base `parser.js` tripped it |
| Generated products | One line, `new Function` parses, exactly one `PARSER_VERSION = "2.5.4"`, exactly one `const OPTION`, the flattened core is a substring, `--check` green; both executed from `javascript:` links in Cloud Chromium on real staging `admin_questions.php` |
| Stale guard | `--check` exits 1 against the base `src/bookmarklet.js` and 0 after rebuild |
| Surface behavior | Key artifact byte-identical and 42 key vectors pass; 38 helper, 10 underline, 7 preview, 26 math-tool, 69 render-markup vectors pass; stimulus panel mounted and a two-question paste filled the native form on the staging page |
| Tests | Full Node baseline (68/173/38/42/10/7/26/69, 7 bank hashes) and PHP 8.3.37 baseline (33/8/14, 7/7 lint); `tests/single-source.js` 15 checks |
| Safety | No deploy, live action, database operation, or real-branch change; only the package branch was pushed |

**Open questions.** Brave installability of the now 131 KB stimulus artifact is
unevidenced; only Chromium ran it. `php tests/cbt-staging.php` remains gated on a
disposable MySQL URL. The stimulus artifact size grew by 29,931 B because it now
carries the whole canonical core instead of a partial copy; mobile bookmarklet
limits are unchanged from the prior documented risk.

**Review status.** Awaiting independent rigorous review of
`origin/scratch/pc02-single-parser-source`. `Commit: deferred`.
