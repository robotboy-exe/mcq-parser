# Current Phase Map

Current cycle: `parser-convergence-2026-11`
Updated: 2026-11-26

`phase N` means phase N of this cycle. Status lives in
`docs/plan/README.md`; this file only maps phase numbers to packages.

| Phase | Package |
|---|---|
| 1 | `PC01` — `parser-convergence/pc-01-product-separation.md` |
| 2 | `PC02` — `parser-convergence/pc-02-single-parser-source.md` |
| 3 | `PC03` — `parser-convergence/pc-03-spaced-initialisms.md` |
| 4 | `PC04` — `parser-convergence/pc-04-marker-range.md` |
| 5 | `PC05` — `parser-convergence/pc-05-stimulus-boundaries.md` |
| 6 | `PC06` — `parser-convergence/pc-06-bookmarklet-policy-release.md` |

Current gate: PC01, PC02, and PC03 are `done` and merged into
`scratch/parser-convergence-cycle`. PC04 is `in progress` — `BLOCK-1`–`BLOCK-8`
closed by re-reviews 1 and 2 and the `BLOCK-9` fix is implemented on
`scratch/pc04-marker-range` from package base `9afe4f8` (core `2.5.6`, D-112)
with full Node/PHP and 3-surface staging acceptance passing,
`Commit: deferred`, and awaiting rigorous phase-4 re-review 3. No deploy or
live action is authorized.

## Starting a new cycle

See `cycles/README.md`.
