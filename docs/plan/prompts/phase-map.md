# Current Phase Map

Current cycle: `parser-convergence-2026-11`
Updated: 2026-11-27

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
| 7 | `PC07` — `parser-convergence/pc-07-stimulus-first.md` | done (settled by Phase 7 re-review 3 of `984b2f0` at `3647783`; merged into `scratch/parser-convergence-cycle` from `9afe4f8`) |

Current gate: `PC01`, `PC02`, `PC03`, and `PC07` are `done` and settled on
`scratch/parser-convergence-cycle` (`PC07` fast-forward merged from
`scratch/pc07-stimulus-first` over `9afe4f8`, with `src/`, `ocr_helper.js`,
`deployed/`, `fixtures/`, and `tests/` byte-identical to reviewed candidate
`984b2f0`). Phase 7 review (`5711f96`) closed carried `BLOCK-10` and
`BLOCK-11`; Phase 7 re-review (`cf64cd1`) closed `BLOCK-12`–`BLOCK-14`,
`BLOCK-16`–`BLOCK-20`, and `BLOCK-22`; fix session 2 (`go, approve D1 D2`)
resolved `BLOCK-15`, `BLOCK-21`, and `BLOCK-23`; re-review 2 (`9585eb6`) closed
those and opened `BLOCK-24`/`BLOCK-25`, which fix session 3 resolved at
`d65177b`; re-review 3 of `984b2f0` (published `3647783`) returned `PASS WITH
ACCEPTED FINDINGS` and closed both (`NOTE-1` open documentation, `NOTE-2`
reconciled). Historical PC04–PC06 package specs and `phase-4*` review records
stay intact as evidence. The cycle-wide rigorous review on
`scratch/parser-convergence-cycle` is now the unblocked next step, while
`src/bookmarklets/key/*` stays retained as comparator and rollback reference
until desktop + owner Brave/Android acceptance and a separate reviewed key-only
retirement diff. No real-branch integration, deploy, or live action is
authorized.

## Starting a new cycle

See `cycles/README.md`.
