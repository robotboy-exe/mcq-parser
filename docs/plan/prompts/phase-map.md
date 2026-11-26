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

Current gate: PC01 and PC02 are `done` and merged into
`scratch/parser-convergence-cycle`. PC02's 2026-11-26 rigorous review of
candidate `01e2c02` returned `PASS WITH ACCEPTED FINDINGS` with `NOTE-1`–`NOTE-2`
and no `BLOCK`/`FIX`; the owner confirmed that both generated bookmarklets from
that candidate load and run in the owner's browser, and the package was
fast-forward merged from `0279e70` to `55afe15` with a product tree matching
`6592991`. PC03 is the next package in sequence and is `in progress` on
`scratch/pc03-spaced-initialisms` from package base `331e81f`: the core's
spaced-initialism guard (D-111) keeps `C. I. F.`/`A. D.`/`B. C.` stem runs as
text. Its phase-3 review returned `BLOCK` with `BLOCK-1`/`BLOCK-2`/`FIX-1`; the
re-review of `74505ae` closed `BLOCK-2`/`FIX-1`, kept `BLOCK-1` open in round 2,
and recorded `BLOCK-3` (the restore picked a stem `A. D.`/`A. B.` label instead
of the trailing real `A.`). The authorized fix ends a run at a line-leading
(including wrapped) option label, counts only line-leading labels in the ordered
test, and restores the trailing real covered label. The full Node/PHP baseline
is green and it awaits re-review. No deploy or live action is authorized.

## Starting a new cycle

See `cycles/README.md`.
