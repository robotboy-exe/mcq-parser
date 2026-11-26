# Review Records

Independent reviews write one record per reviewed package:

```text
docs/plan/reviews/<active-cycle-id>-phase-N.md
```

For the active cycle this is
`parser-convergence-2026-11-phase-N.md`. The first re-review appends
`-re-review.md`. Later
records append a sequence (`-re-review-2.md`, `-re-review-3.md`, and so on).
No review record overwrites an earlier record.

Each record includes:

- date, reviewer, scope, and package;
- commands and observed evidence;
- acceptance coverage;
- findings numbered `BLOCK-N`, `FIX-N`, or `NOTE-N` with file/line references;
- for every `BLOCK` and `FIX`, the exact defect, supported operating
  preconditions, finite closure criteria, required evidence, and explicit
  non-goals or deferred checks;
- verdict and commit readiness;
- findings closed by a re-review;
- new defects found during re-review under the next unused ID in that severity
  namespace across the package's records, rather than broadened prior IDs;
- recommended next action and pending user decision.

Once a fix is authorized, its closure contract is frozen. Re-review closes that
finding when the frozen criteria pass. A finding requires owner disposition only
after three review rounds without resolution: it was recorded in round 1, stayed
open (or needed another fix) in round 2 after fix round 1, and still stays open
(or needs another fix) in round 3 after fix round 2. A finding in its first or
second review round, including one newly recorded in a re-review, routes to a
fix session instead (unless reported `NOT REPRODUCED`). The immutable record
remains unchanged whichever disposition is chosen; record the choice through
`../prompts/finding-disposition.md`.

Review sessions may change only their review record. They never edit source,
tests, fixtures, package state, handoffs, or commits.
