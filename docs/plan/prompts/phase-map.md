# Current Phase Map

Current cycle: `math-editor-2026-11`
Updated: 2026-11-19

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
for phase 5 (`MS01`, visual math shapes); its original review and `FIX-1`
closure re-review passed, and boundary `c6a81fb` was committed/pushed. The
owner's visual gate then requested D-103: remove the duplicate bare-root
operator and join the radical vinculum, followed by D-104: keep the Constant
Text preview at 150px and scroll long passages. Both follow-ups are implemented
and uncommitted; their focused review passed with no `BLOCK`/`FIX`, its two notes
are corrected, and the owner accepted the desktop/Brave recheck on 2026-11-17.
MS01 is done and review-settled; the cycle was never archived. The owner then
asked for the palette's non-shape content back, which is implemented as D-105
(restored Greek, set theory and logic, and geometry and vectors grids; exponents,
subscripts, fractions, and square root stay with the visual editors) and
committed at `23a406c` and reviewed by the cycle-wide record
[`reviews/math-editor-2026-11-cycle-review.md`](../reviews/math-editor-2026-11-cycle-review.md)
(`PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`, `NOTE-9`–`NOTE-12`), with the
owner's desktop/Brave drawer check accepted on 2026-11-18. Status lives in the
coordinator. The owner's direct D-106 follow-up exposes exact escaped PDO save
errors only to logged-in administrators; it is implemented locally outside a
numbered phase, with no deployment or live save. Direct D-108 then aliases only
the exact stored `English (Lexis & Structure)` subject to
`English (Comprehension Pages / Lexis & Structure)` on `admin_questions.php` and
`cbt.php` without SQL, ID, grouping, or CBT Practice changes, and sets CBT
Constant Text/question weights to 800/700; static, disposable HTTP, and
desktop/390px browser checks pass locally. Temporary pre-migration compatibility
work was reverted after the owner reported migration `01` successful on
2026-11-19. The 2026-11-22 RM01 fix session (`BLOCK-4`/`5`/`6`/`7`/`8` of the
main-release review) and the second re-review's `BLOCK-10` mixed-case
parenthesized fix are implemented and green locally at core `?v=2.5.2` / helper
`?v=2.4.3`, but the closure re-review kept `BLOCK-10` open on a selected
opposite-case repeat that still moves the intended Option A prefix into the
question (15/16), and the owner chose `fix` for one further session against the
frozen contract. `BLOCK-1` (a main-integrable target) remains an owner release
action. No new phase was opened.

## Starting a new cycle

See `cycles/README.md`.
