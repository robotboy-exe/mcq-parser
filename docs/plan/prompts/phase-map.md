# Current Phase Map

Current cycle: `post-as-2026-10`
Updated: 2026-10-27

`phase N` means phase N of this cycle. Status lives in
`docs/plan/README.md`; this file only maps phase numbers to packages.

| Phase | Package |
|---|---|
| 1 | P11 — 14-exam-category-period-acronyms.md |
| 2 | P12 — 15-option-boundary-selection.md |
| 3 | AS-10 — 16-duplicate-fingerprints.md |
| 4 | AS-11 — 17-batch-history.md |
| 5 | AS-12 — 18-auto-dry-run-and-status.md |

## Starting a new cycle

Do not archive automatically when the last phase stops. Archive only when the
user confirms the cycle is complete or satisfied, or explicitly asks to shelve
it. Follow the checklist in [`cycles/README.md`](cycles/README.md), then replace
this file with the new cycle and its phase 1..N mapping. Leave
`phase-session.md` unchanged.

Use `cycle <id> phase N` only when you need an archived cycle. The active cycle
does not need the prefix.
