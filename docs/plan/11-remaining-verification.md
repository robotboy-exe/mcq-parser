# Remaining verification queue

Status: V1-V3 recorded 2026-10-25; V4 open (optional). Implementation is
complete through P10 and AS-09. This document lists only the checks that still
need live state or an explicit decision; it does not propose parser or UI
changes.

Current baseline (2026-10-26): `node tests/runner.js` 30 PASS / 0 FAIL / 0
PENDING; `node tests/unit.js` 65 PASS; `node tools/extract-bank.js --check`
green; build one line, no `%`, body parses.

## Why this exists

The fixture harness is parser-only and all expectations come from archived
sources. Green tests do not prove that the live admin page, the live `questions`
table, or an old stored queue behaves as documented. Those are the remaining
items. Do not promote an `UNVERIFIED`/`AT_RISK` row to a defect without a
reproduction (see `docs/EDGE_CASES.md` and `docs/INVARIANTS.md`).

## V1 — Live parser/OCR/bank run

- **What:** rebuild the bookmarklet, paste it into the live admin page, then
  paste one bank year and one anomaly block. Exercise Fill/Load and inspect the
  split, options, key, and flags against the recorded expectations.
- **Why:** no live browser run exists for the parser/OCR/bank changes. The
  harness never exercises the DOM, storage, `fillForm`, `tick`, or save flow.
- **Preconditions:** admin login, current `src/bookmarklet.js` installed, queue
  reset before pasting.
- **Done when:** the date, test question numbers/IDs, observed counts, and any
  discrepancy are recorded. A mismatch needs a minimal reproduction before any
  code change.
- **Evidence:** `README.md` status, `AGENTS.md` known gaps, `docs/AGENTS.md`
  test limits.
- **Result (2026-10-25):** PASS on `skymenupake.com/admin_questions.php` with
  the current `src/bookmarklet.js`, after Reset. `bank-2021` loaded 40 items,
  year 2021, subject `CRS`; E options were on Q1 and Q21/Q31-Q35; all 40 key
  answers matched; Q40 text/options matched; the forbidden merged-question flag
  was absent; the form showed Q1 with Option A ticked. The header has no exam
  category, so the category select stayed unset (the fixture does not require
  it). `anomaly-block2` loaded 12 chunks with nums
  `[null,2,3,4,7,8,9,12,13,14,15,16]`, showed `OCR boundaries repaired`, kept
  its required flag, and did not show the forbidden short-stem flag. No
  discrepancy against the recorded fixture assertions.

## V2 — Live `questions` schema check

- **What:** make one controlled save and confirm the live `questions` table
  accepts the archived PHP's INSERT columns, especially `practice_title`.
- **Why:** the only schema evidence is a `questions1` dump; if live `questions`
  requires `practice_title`, every save would fail (EC-63/INV-57).
- **Preconditions:** V1 login; a disposable question; use the normal save path.
- **Done when:** a saved ID is visible in the admin list with no schema error,
  or the failure is captured and EC-63/INV-57 are updated.
- **Evidence:** `docs/EDGE_CASES.md` EC-63; `docs/INVARIANTS.md` INV-57;
  `archive/live-sources/admin_questions.php`.
- **Result (2026-10-25):** PASS. A disposable four-option question using
  `CRS JAMB / UTME 2024` was saved through the normal manual path as #1785;
  the page reported `Saved as question #1785.` and the edit page loaded the
  question text, year 2024, category 3, and `Active`. The filtered admin list
  (`subject_id=14&exam_year_filter=2024&category_filter=3`) showed #1785 at the
  top with `CRS / JAMB / UTME / 2024`, so the live `questions` table accepts the
  INSERT columns and does not require `practice_title`. The row was deleted;
  the flash was `Question #1785 was deleted successfully` and `edit=1785` then
  reported not found. No test rows remain. The unfiltered `?page=1` list
  continued to show top ID 1765 and not the new rows, while the filtered list
  showed them; the site owner confirmed this is intended list behavior, so it is
  not a defect and no code change was made.

## V3 — Stale `ocrQueue` behavior

- **What:** load a queue written by an older variant after updating the
  bookmarklet; confirm the failure mode, then reset and re-paste. Record whether
  a version marker or migration check is worth adding.
- **Why:** `ocrQueue` has no version marker, so old items may lack `e`/`f` or
  contain old misparses (EC-62/INV-56).
- **Preconditions:** a preserved old queue sample or a controlled synthetic one.
- **Done when:** the stale-queue behavior is observed, or the operational rule
  (reset and re-paste) is explicitly reaffirmed. A version marker would be a new
  code package with a product decision, not part of this checklist.
- **Evidence:** `docs/EDGE_CASES.md` EC-62; `docs/INVARIANTS.md` INV-56;
  `archive/migration-docs/claude-gaps.md` item 6.
- **Result (2026-10-25):** CONFIRMED. A synthetic old-shape queue (one item, no
  `e`/`f`, no `batchId`, old flag) loaded after injection and filled the form
  with its stale text. The batch box said `This queue has no batch identity.
  Paste the questions again.`; after the confirmation tick, Start was enabled
  but produced `Cannot auto-save: This queue has no batch identity. Paste the
  questions again.` with no POST and no saved-log entry. Reset Queue produced
  `{items:[],i:0}` and deleted `ansKey`; re-pasting `anomaly-block2` loaded 12
  items with a new `batchId` and no legacy warning. The operational rule
  (reset and re-paste) is reaffirmed; no version marker or migration was added.

## V4 — Optional evidence gaps (no live login needed)

- **Direct `splitSections` fixture:** setup gap #4 is still partial; decide
  whether a dedicated fixture adds value over the bank/anomaly coverage.
- **Threshold provenance:** the Auto-Save thresholds are documented but their
  origin is unknown (WORKSPACE_SETUP gap #11); record evidence or leave as is.
- **New live OCR paste:** no fresh paste beyond the archived bank/anomaly
  blocks; V1 can cover this if the user supplies one.
- **Decision (2026-10-25):** no direct `splitSections` fixture was added. The
  bank slices already exercise inline keys, header boundaries, and the salvage
  path (`anomaly-block2` plus the unit no-op/insert checks), so a separate
  fixture would duplicate existing coverage. Threshold provenance remains
  unknown and is left as-is; changing it needs a product decision. No new live
  OCR paste was supplied, so this item stays open.

## Suggested order

1. V1 (live parser/OCR/bank) — highest value, exercises the whole pipeline.
2. V2 (schema) — one controlled save; can follow V1 in the same session.
3. V3 (stale queue) — needs an old sample; may be operational only.
4. V4 — optional and can be closed by decision.

## Session notes

- These are evidence tasks: do not change parser/UI code unless a mismatch is
  reproduced and documented.
- Doc-only updates from a session do not require tests. Run the suite only if
  `src/`, `tests/`, `fixtures/`, or `tools/` change.
- Record results in the relevant EC/INV rows and, when a live run happens, in
  `docs/plan/README.md` as a dated handoff note.
- Close this queue when V1–V3 are recorded and the affected rows are updated or
  deliberately upheld; V4 can remain open without blocking.

## Handoff (2026-10-25)

- V1-V3 closed. The session used the real admin page, the current built
  bookmarklet, and disposable data only. #1783, #1784, and #1785 were created
  and deleted; `edit=<id>` reports not found for all three and no marker rows
  remained in the filtered list.
- No parser/UI/fixture/tool change. `src/bookmarklet.js` was rebuilt from the
  unchanged sources and remains one line, no `%`, body parses.
- The unfiltered admin list did not show newly saved rows during the test while
  the filtered list did. The site owner confirmed this is intended list behavior,
  so it is not a defect and does not block the schema check (the edit page and
  filtered list both showed #1785). No code change.
- Browser cleanup: logged out, cleared the OCR `localStorage` keys, removed the
  temporary credentials file, and stopped `chromium-cdp`.
