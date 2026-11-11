# OT11 Phone Feedback Scratch

Date: 2026-11-11
Status: WIP handoff; not implemented

The owner tested the current staging build in Brave on Android. It works well
enough for now, but the following changes are required before the final OT11
phone acceptance.

## Requested Changes

1. If a pasted shared context is still new, pressing **Save Question** must stop
   and say: **Save the shared context first.** Do not leave the failed save
   unexplained.
2. Choosing or linking a shared context must fill the legacy question form's
   Subject, Exam Category, and Exam Year fields from that context.
3. After a shared context is confirmed saved, collapse its card. Add a **Show**
   button so the owner can open it and make changes.
4. Add clear visual boundaries inside the legacy form card. Group the three
   shared-context link fields (`context_id`, `context_position`, and
   `context_slot`) together. Put the rest of the question fields in a separate
   group.
5. Rewrite all owner-tool text in and around the form so a six-year-old can
   understand it. Keep it short. This includes tool statuses, notices, flags,
   warnings, field help, hints, and explainers around both the owner panel and
   the legacy/native form. It is not limited to the Shared Context card. Keep
   fixed server-contract text, including the exact question success flash,
   unchanged.

## Verification

- Add focused regression tests for each behavior.
- Re-run the local JS/PHP suites and syntax checks required by OT11.
- Re-check the full flow in Brave on Android without a live write.
- Staging Apache and MySQL were stopped after this phone session; ports 80,
  443, and 3306 were confirmed closed.

## After These Fixes

1. Run the independent rigorous OT11 review.
2. Settle any review findings.
3. Complete the OT10 final review and live deployment artifacts.
4. Run the cycle-close procedure after OT10 is review-settled.
