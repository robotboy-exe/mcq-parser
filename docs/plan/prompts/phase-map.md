# Current Phase Map

Current cycle: `math-editor-2026-11`
Updated: 2026-11-17

`phase N` means phase N of this cycle. Status lives in
`docs/plan/README.md`; this file only maps phase numbers to packages.

| Phase | Package |
|---|---|
| 1 | `ST01` — `owner-tool/st-01-constant-text-reset.md` |
| 2 | `ME01` — `math-editor/me-01-math-palette.md` |
| 3 | `ME02` — `math-editor/me-02-release-and-handoff.md` |
| 4 | `EL01` — `el-01-english-lexis-grouping.md` |
| 5 | `MS01` — `math-editor/ms-01-visual-math-shapes.md` |

Current gate: phase 4 implementation and all acceptance evidence are recorded,
including the real 8-check operation/rollback run on isolated Oracle MySQL
Community Server 8.0.41 ARM64. ME02 is done after the owner's 2026-11-17
Brave/Android acceptance. EL01 is done and phase-4 review-settled 2026-11-17
with `PASS WITH ACCEPTED FINDINGS`; `NOTE-1`–`NOTE-4` are corrected. Cycle close
completed 2026-11-17 at `0410ecb`. The owner reopened the cycle on 2026-11-17
for phase 5 (`MS01`, visual math shapes); its phase-5 review recorded `PASS WITH
ACCEPTED FINDINGS` on 2026-11-17 and its `FIX-1` cache-key fix is applied, with
the closure-focused re-review pending. The cycle was never archived. Status
lives in the coordinator.

## Starting a new cycle

See `cycles/README.md`.
