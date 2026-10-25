# AS-07 — Duplicate scope, marker, and unverified status

Status: not started. Depends on: AS-06. Blocks: AS-08.

## Source and scope

`docs/Active.md` is the merged review and the authoritative change-and-test
list. This package covers:

- **Fix 1 (Phase 1)** — the year/category-scoped duplicate check.
- **Fix 2 (from Phase 3)** — a manual save must not erase an unconfirmed-save
  marker.
- **Unverified-status list (user decision 2026-10-25)** — name each question
  whose active status could not be verified; a batch-level suffix is not
  enough.
- **Two-consecutive-unverified stop (user decision 2026-10-25)** — after two
  consecutive `inactive === null` auto saves, stop the run. The saves stay
  logged and named. A verified save resets the count; manual saves do not
  participate.
- **Remove the media guess (user decision 2026-10-25)** — the uploader decides
  whether a batch needs images. Remove `NEEDS_PICTURE` and the `needs-media`
  blocker; keep the `file-attached` blocker.

Fix 2 is deliberately moved forward. `docs/Active.md` §2 says draft mode only
until Fix 1 **and** Fix 2 are done. AS-08 includes a live active-mode test, so
Fix 2 must ship before AS-08, not after it.

Read `docs/Active.md` Fix 1 and Fix 2 completely before editing; use their
exact change list, test list, and live check. Do not rewrite the review.

## Preconditions

- AS-06 is done. Baseline: `node tests/runner.js` → 25 PASS, 0 FAIL, 0
  PENDING; `node tests/unit.js` → 35 PASS, 0 FAIL.
- **Live gate:** open a Recently Added row that ends in `…` and count it.
  Confirm it is 139 characters plus `…`. If the count differs, update the
  constant and the affected tests in `docs/Active.md` before writing code.
- Build baseline: one line, no `%`, body parses.
- Workspace note: `tests/build-check.js` exists only inside `review-packet/`.
  It is pinned to the review packet's artifact hash and is not a workspace
  test. Use the build checks below, not that script.

## Work

1. Apply Fix 1 exactly as `docs/Active.md` §Phase 1 steps 1–9:
   header-based `recentRows()`, the five-argument `recentDuplicate`, the
   truncated-row rule, the safe unknown-category/year fallback, the updated
   blocker message, the batch-confirmation year line, and the unchanged dry
   run.
2. Apply Fix 2 exactly as `docs/Active.md` §Fix 2: a manual submit refuses
   while `ocrSaving` exists, makes no POST, and points at
   `I checked. Clear warning.`; after clearing, the manual save works.
3. Add the per-question unverified list:
   - Add an exported pure helper that selects saved-log entries whose
     `inactive` is `null` or missing.
   - `renderSaved()` names each one as
     `Question N (#ID): active status not verified` using `textContent`.
   - `savedCopyText()` carries the same per-question status.
   - Keep this separate from the batch suffix. AS-08 replaces the suffix with
     `savedModeSuffix` and must preserve this list.
4. Add the two-consecutive-unverified stop:
   - Track a counter for consecutive auto saves whose verification is `null`.
     Reset it on any verified save and at the start of each run.
   - After the second consecutive `null`, log the save as usual, name it in the
     saved list, set `stopAuto = true`, and show
     `Stopped after 2 unverified checks. Check the saved list before continuing.`
   - Do not retry, and do not clear the entries. Release the lock on the normal
     stop path. Manual saves do not increment the counter.
5. Remove the media guess:
   - Delete the `NEEDS_PICTURE` regex, its parser export, the `media` check in
     `autosaveBlockers`, the `needs-media` blocker, and its `blockerText` case.
   - Keep `file-attached`: auto still refuses when a file is already chosen.
   - Remove the media case from the all-codes test and the existing
     stem-containing-`diagram` test. Replace it with a check that `diagram`
     does **not** block.
6. Tests:
   - Replace the old `140 characters + …` duplicate test with Active.md Fix 1
     tests 1–12.
   - Add Active.md Fix 2 tests 1–3.
   - Keep the existing duplicate scenario in `autosaveBlockers`, updated to
     the real 139+… row shape and carrying year and category.
   - Unit-test the unverified helper: none, one, mixed with verified entries,
     and a missing `inactive` field.
   - Mock-test: `null`, `null` stops after the second save; `null`, verified
     continues and resets the count; a new run starts the count at zero.
   - Check that a question containing `diagram` or `table` returns `[]` when
     the rest of the state is clean, and that an attached file still returns
     `file-attached`.
7. Docs:
   - `docs/Active.md` §D **Phase 1** entries (INV-69, D-34,
     Auto-Save-Spec §9, SPEC §7.5).
   - `docs/Active.md` §D **AS-07 extra**: remove the media lines from
     Auto-Save-Spec §5/§8, SPEC §7.3, INV-62, and the AGENTS auto-save gate
     row; add decision D-38.
   - Record Fix 2's manual-save refusal where SPEC §7 describes manual saving,
     if the current text implies a manual save can proceed with a pending
     marker.
   - After the live check passes, retire `docs/Active.md` §3 (manual duplicate
     check) as that section directs.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0; all old and new tests pass; count > 35 |
| Build | `node src/build/build.js`; `wc -l src/bookmarklet.js` prints `1`; body passes `new Function`; `rg -n '%' src/bookmarklet.js` is empty |
| Fix 1 live check | Active.md §Fix 1 live check 1–4 all pass |
| Fix 2 live check | With an ambiguous save marker present, a manual submit makes no POST and shows the refusal; clearing the marker lets the same manual save proceed |
| Unverified list | a batch with an unverified check names the queue number and saved ID; copy text includes it; verified entries are not listed |
| Unverified stop | two consecutive `null` checks stop the run after the second save; a verified save resets the count; nothing is retried |
| Media guess removed | `diagram`/`table` text no longer blocks; an attached file still returns `file-attached`; `rg -n 'NEEDS_PICTURE|needs-media' src tests` finds no live use |
| Docs | §D Phase 1 and AS-07 extra updated; §3 retired; §E decisions updated |

## Guardrails

- Do not change the duplicate rule beyond Active.md: same normalized subject,
  category, year, and text. A category/year mismatch is not a duplicate.
- Do not silently skip a duplicate. The run stops and shows the reason.
- Do not weaken the truncation rule or compare the `…` itself.
- Do not change manual save's active/tick behaviour.
- Keep the per-question unverified list independent of the batch suffix; a
  batch with one active result must still show every `null` entry.
- Stop only on **consecutive** unverified results. One `null` followed by a
  verified save is not a stop.
- Remove only the text guess. Do not remove `file-attached` or add an
  automatic media/attachment feature.
- Do not touch PHP, the server contract, or storage key names/shapes.
- `docs/Active.md` §1 explicitly asks for a commit at each phase boundary.
  Treat that as the only commit instruction; do not commit at other times.

## Handoff note (append when done)

```text
Date:
Result: runner ...; unit ...
Live: 139-char row count = ...; Fix 1 checks ...; Fix 2 manual-marker check ...
Unverified list: ... (question numbers/ids; verified entries excluded)
Unverified stop: null/null stopped after #...; null/verified continued; rerun reset
Media: diagram/table no longer blocks; file-attached still blocks
Files:
Build: one line / no % / body parses
Docs: ...
Open questions:
```

## Handoff note (2026-10-25, done)

```text
Status: done.
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 49 PASS / 0 FAIL.
Build: one line / no % / body parses.
Live gate: live row #1754 was 140 characters: 139 + '…'
  (Accounting / JAMB / UTME / 2024).

Fix 1 live checks (real admin_questions.php):
1. Picked #1754, the only truncated row on page 1; 139 + '…'.
2. Start with a repeat of #1754 at 2024 / JAMB / UTME stopped at #1 with
   "Cannot auto-save: This looks like question #1754 (2024, JAMB / UTME) already
   in the recent list." 0 POST, queue index unchanged, no saved log, no marker,
   no lock. Dry run showed the same message.
3. Same question at 2022 / JAMB / UTME dry-ran
   "Would save #1: Accounting / JAMB / UTME / 2022, A to D, answer A."
4. A different 179-character question at 2024 / JAMB / UTME dry-ran
   "Would save #1: Accounting / JAMB / UTME / 2024, A to D, answer A."

Fix 2 live check (real admin_questions.php):
- With ocrSaving present, manual submit made 0 POST and showed
  "An earlier save is unconfirmed. Check the list, then tap 'I checked. Clear
  warning.'"; marker kept.
- After Clear warning, the same manual form posted once. Exam year was set to
  1800 on purpose, so the server rejected it:
  "NOT saved: Please enter a valid exam year between 1900 and 2100."; marker
  cleared; no row created (row count stayed 20).
- The invalid year proves the POST proceeded without inserting a live question.

Unverified list/stop (mock evidence, not live): 3-question unverified run saved
  #900/#901, stopped after the second, list read "Question 1 (#900): active
  status not verified; Question 2 (#901): active status not verified", lock
  released, 2 POSTs.
Reset/mixed (mock evidence, not live): 6-question mix saved null, verified,
  null, null and stopped after #4; Start again saved #5 null and #6 verified and
  finished. List named #900/#902/#903/#904, not verified #901/#905.
Media (mock evidence, not live): "diagram"/"table" question saved #900 with no
  blocker; an attached file stopped with "A file is already attached to this
  question." and no POST.
Files: src/parser/parser.js, src/ui/ui.js, src/bookmarklet.js (rebuilt),
  tests/unit.js, docs/INVARIANTS.md, docs/DECISIONS.md, docs/SPEC.md,
  docs/Auto-Save-Spec.md, docs/EDGE_CASES.md, docs/AGENTS.md, docs/Active.md,
  docs/plan/README.md.
Docs: Phase 1 (INV-69, D-34, Auto-Save-Spec §9, SPEC §7.5), AS-07 extra
  (Auto-Save-Spec §5/§8, SPEC §7.3, INV-62, AGENTS gate row, D-38), Fix 2 in
  SPEC §7.4, INV-66 unverified list/stop. Active.md §3 retired.
Open questions: none for AS-07. AS-08 may start.
```
