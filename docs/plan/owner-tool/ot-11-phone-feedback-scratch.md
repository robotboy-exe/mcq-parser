# OT11 Phone Feedback Scratch

Date: 2026-11-11
Status: follow-ups and latest re-check fixes implemented; owner Brave/Android
confirmation accepted 2026-11-13; rigorous review pending

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
6. Place the candidate preview next to the legacy/native **Question Text**
   field for every loaded question, including normal MCQs and shared-context
   questions.

## Verification

- Add focused regression tests for each behavior.
- Re-run the local JS/PHP suites and syntax checks required by OT11.
- Re-check the full flow in Brave on Android without a live write.
- Staging Apache and MySQL were stopped after this phone session; ports 80,
  443, and 3306 were confirmed closed.

Local implementation evidence is recorded in
[`ot-11-owner-workflow-refinements.md`](ot-11-owner-workflow-refinements.md).

## Final Follow-up (2026-11-12)

1. Move the collapsible shared-text editor directly below the paste box and
   above the light-blue shared-text link group.
2. Name that editor **Edit Shared Text**.
3. Fix explicit shared-text Edit so the latest stored paste cannot replace the
   server-loaded record.

Implemented as tool 1.5.1. A focused local Chromium check reproduced context
#11 being replaced by stored context #6 before the fix, then confirmed #11's
server values, the new order, and the 390px mobile layout after the fix. The
owner accepted the final Brave/Android re-check on 2026-11-13.

## Latest Re-check Fixes (2026-11-12)

1. Full `sample-passages.txt` could save a shared-text POST, but after the first
   passage was adopted or saved the editor returned to the current reading
   question and hid the unsaved `SECTION 6` cloze text. Tool 1.5.2 labels the
   selector and keeps the first unsaved text selected/open, including after an
   already-saved member is skipped.
2. `new-sample.txt` reached cloze detection but gap 75 was refused as missing D:
   two later row starts were one character left of the table modes. Parser 2.3.3
   accepts only this corroborated two-anchor, one-character row drift and keeps
   all existing whole-group refusals.

Local evidence: 60 runner, 163 unit, and 81 owner-tool PASS; full PHP/context
suites PASS; exact cloze probe emits 15 items and zero warnings; focused staging
Chromium shows the unsaved second context open after adoption/member skip. The
owner accepted the final Brave/Android confirmation on 2026-11-13 without a new
live write.

## After These Fixes

1. Run the independent rigorous OT11 review.
2. Settle any review findings.
3. Complete the OT10 final review and live deployment artifacts.
4. Run the cycle-close procedure after OT10 is review-settled.
