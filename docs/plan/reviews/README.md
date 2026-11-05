# Review Records

Independent reviews write one record per reviewed package:

```text
docs/plan/reviews/owner-tool-2026-11-phase-N.md
```

The first re-review writes `owner-tool-2026-11-phase-N-re-review.md`. Later
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

Once the owner authorizes a fix, its closure contract is frozen. Re-review
closes that finding when the frozen criteria pass. A newly discovered blocker or
a second-or-later re-review proposing another fix requires owner disposition;
the immutable record remains unchanged whichever disposition is chosen. Record
that choice through `../prompts/finding-disposition.md`.

Review sessions may change only their review record. They never edit source,
tests, fixtures, package state, handoffs, or commits.
