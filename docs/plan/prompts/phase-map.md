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

Current gate: PC01 is `done`. The 2026-11-26 re-review 3 of candidate `cc72e3b`
returned `PASS` with no new findings, closing `BLOCK-5`/`FIX-4`; every
`BLOCK-1`–`BLOCK-5` and `FIX-1`–`FIX-4` is closed. `scratch/pc01-product-separation`
is merged into `scratch/parser-convergence-cycle`, and
`scratch/pc02-single-parser-source` is cut from that tip. PC02 is `not started`:
phase 2 Gate 1 is the next step. No deploy or live action is authorized.

## Starting a new cycle

See `cycles/README.md`.
