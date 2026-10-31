# Review Records

Independent reviews write one record per reviewed package:

```text
docs/plan/reviews/owner-tool-2026-11-phase-N.md
```

A re-review writes `owner-tool-2026-11-phase-N-re-review.md` and never
overwrites the original.

Each record includes:

- date, reviewer, scope, and package;
- commands and observed evidence;
- acceptance coverage;
- findings numbered `BLOCK-N`, `FIX-N`, or `NOTE-N` with file/line references;
- verdict and commit readiness;
- findings closed by a re-review;
- recommended next action and pending user decision.

Review sessions may change only their review record. They never edit source,
tests, fixtures, package state, handoffs, or commits.
