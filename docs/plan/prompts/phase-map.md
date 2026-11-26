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

Current gate: PC01 is `done` and merged into
`scratch/parser-convergence-cycle`. PC02 is `in progress`: its candidate is
implemented on `scratch/pc02-single-parser-source` from base `0279e70` with one
parser source, current generated products, 15 single-source guards, and a green
Node/PHP baseline, and it awaits rigorous review. Brave installability is not
yet evidenced. No deploy or live action is authorized.

## Starting a new cycle

See `cycles/README.md`.
