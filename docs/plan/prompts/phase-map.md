# Current Phase Map

Current cycle: `parser-convergence-2026-11`
Updated: 2026-11-26

`phase N` means phase N of this cycle. Status lives in
`docs/plan/README.md`; this file only maps phase numbers to packages.

| Phase | Package | Status |
|---|---|---|
| 1 | `PC01` — `parser-convergence/pc-01-product-separation.md` | done (merged at `e6f34f8`) |
| 2 | `PC02` — `parser-convergence/pc-02-single-parser-source.md` | done (merged at `55afe15`) |
| 3 | `PC03` — `parser-convergence/pc-03-spaced-initialisms.md` | done (merged at `a4c6d53`) |
| 4 | `PC04` — `parser-convergence/pc-04-marker-range.md` | superseded by `PC07` (`BLOCK-10` & `BLOCK-11` carried open into Phase 7) |
| 5 | `PC05` — `parser-convergence/pc-05-stimulus-boundaries.md` | superseded by `PC07` |
| 6 | `PC06` — `parser-convergence/pc-06-bookmarklet-policy-release.md` | superseded by `PC07` |
| 7 | `PC07` — `parser-convergence/pc-07-stimulus-first.md` | in progress (implementation handoff complete; awaiting publish & Phase 7 review) |

Current gate: PC01, PC02, and PC03 remain `done` and settled on
`scratch/parser-convergence-cycle` (through `9afe4f8`). Unfinished PC04–PC06 are
superseded by Phase 7 (`PC07`, approved at Gate 1 on 2026-11-26) and implemented
on `scratch/pc07-stimulus-first` with `PC04` `BLOCK-10` and `BLOCK-11` carried
open for independent Phase 7 verification. Historical PC04–PC06 package specs
and `phase-4*` review records stay intact as evidence, and `src/bookmarklets/key/*`
stays retained as comparator and rollback reference until desktop + owner
Brave/Android acceptance and a separate reviewed retirement diff. No deploy or
live action is authorized.

## Starting a new cycle

See `cycles/README.md`.
