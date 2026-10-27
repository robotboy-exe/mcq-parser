# Review Records

Independent reviews write one record here:

```text
docs/plan/reviews/<cycle-id>-phase-<N>.md
```

The review record is the only file a review session may write. It must not
modify source, tests, fixtures, build output, package status, or the phase map.

## Required fields

```text
# Review — <cycle-id> phase <N> (<package-id>)

Date:
Reviewer: independent review session
Verdict: PASS | PASS WITH ACCEPTED FINDINGS | BLOCK
Commit readiness: yes | after user accepts findings | no
Review status: independent-pass | independent-pass-with-accepted-findings | independent-blocked | re-review-pass | re-review-blocked
Scope:
Evidence:
Acceptance coverage:
Findings:
Findings closed (re-review only):
Recommended next action:
Next action required:
- User decision: pending | accept | accept and fix | reject
- Recommended: accept | accept and fix | reject and fix
- After decision: <exact command or session>
```

The next phase reads this record before committing the reviewed work. A missing
record, a `BLOCK` verdict, or unresolved findings stops the phase. If a
re-review is needed, write a second record with `-re-review` in the name. The
re-review is authoritative for the current verdict; it does not erase the
original, and any earlier finding it does not explicitly close still blocks.
