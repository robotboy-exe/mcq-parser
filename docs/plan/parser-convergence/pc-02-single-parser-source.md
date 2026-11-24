# PC02 — Single Parser Source

- **Status:** not started
- **Package base:** record the review-settled PC01 boundary at Gate 1
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

Not started. Record exact base, files, measurements, hashes, generated artifacts,
percent decision/evidence, full acceptance mapping, review target, and
`Commit: deferred`.
