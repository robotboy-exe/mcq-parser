# AS-11 — Recent batch history

Status: done (2026-10-27); light-verified at phase 5 Gate 1.
Depends on: AS-10 (done). Blocks: AS-12.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

User request 2026-10-27. After a batch is finished or reset, the saved-log view
is scoped to the current batch, so earlier batches disappear from the tool. Add
a compact, additive history of the last 15 batches. It must never block a save
and must survive Reset Queue.

This is a display/history feature only. Do not change `ocrSavedLog`,
`mergeSavedLog`, the 200-entry cap, the current-batch saved box, or Reset
semantics.

## Preconditions

- AS-10 is done, its rigorous review record is `PASS` or accepted, and AS-10 is
  committed. It writes complete `fp` objects on verified saves.
- `ocrSavedLog` entries still have `{num,id,at,batchId,inactive,mode,fp?}`.
- `savedForBatch`, `formatSavedRange`, `savedModeSuffix`, `currentMeta`,
  `batchLabel`, and the save flow are understood.

## Work

1. Add the additive key `ocrBatchHistory`. It stores an array of at most 15
   entries, newest first. Entry shape:
   ```js
   {
     batchId: '<id>',
     at: 1234567890,
     subject: '<subject label>',
     category: '<category label>',
     year: '<year>',
     ids: [1785, 1786, 1787],
     count: 3,
     mode: 'active'
   }
   ```
   `ids` are the unique saved IDs for the batch, sorted ascending. `mode` is
   the display suffix derived from `savedModeSuffix` with its leading comma
   removed; it may be `active`, `inactive`, `2 active, 1 inactive`,
   `status not verified`, or a `MISMATCH` string.
2. Add pure helpers in `src/parser/parser.js`:
   - `makeBatchHistoryEntry({batchId, subject, category, year, entries, at})`
     returns `null` without a batch ID or saved entries; otherwise computes
     `ids`, `count`, and `mode`.
   - `upsertBatchHistory(history, entry, cap)` removes the same `batchId`,
     puts the new entry first, and slices to `cap` (15). It accepts only an
     array and ignores malformed entries.
3. In `src/ui/ui.js`, after a verified save and after `savedLog` is updated,
   rebuild the current batch entry from `savedForBatch(savedLog, queue.batchId)`
   and upsert it into `ocrBatchHistory`. Wrap the read/write in `try/catch`;
   a history failure must not set a blocker, stop the run, or change the save
   result. Do not record rejected or ambiguous saves.
4. Add a `Recent batches` box after the saved box:
   `<div id="ocr_batch_history" hidden><div id="ocr_batch_history_list"></div></div>`.
   Render one line per entry, using `textContent`:
   `27 Oct 14:05 · CRS / JAMB / UTME / 2021 · 8 saved (#1785–#1792) · active`
   Use `–` between a contiguous first/last ID. If IDs have gaps, list them:
   `3 saved (#1785, #1787, #1788)`. Use `1 saved (#1785)` for one. Omit the
   mode suffix when empty. Format the date with explicit month abbreviations,
   not a locale-dependent string.
5. Render the stored history on initial load and after each save. Reset Queue
   must not clear it. If the history key is absent or malformed, show nothing.
6. Update `docs/DECISIONS.md` D-57, `docs/SPEC.md` saved/history section,
   `docs/Auto-Save-Spec.md` saved-summary section, `docs/INVARIANTS.md` (new
   history invariant), `docs/AGENTS.md` Auto-Save storage row, and the README.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL |
| `node tests/unit.js` | `makeBatchHistoryEntry` and `upsertBatchHistory` tests PASS |
| History line | matches the approved one-line format |
| Batch with 1 ID | `1 saved (#1785)` |
| Batch with gaps | lists IDs instead of an inclusive range |
| 16th batch | oldest entry dropped; 15 remain |
| Same batch saved again | one entry, updated count/range/mode, moved to front |
| Reset Queue | history remains |
| History storage failure | save still succeeds; no stop, no blocker |
| Rejected/ambiguous save | no history entry |
| Build | `src/bookmarklet.js` one line, no `%`, body parses |

## Guardrails

- Do not change `ocrSavedLog` shape, `mergeSavedLog`, the 200-entry cap, or the
  saved-box copy text.
- Do not clear `ocrBatchHistory` on Reset Queue.
- Do not record per-question history or more than 15 batches.
- Do not use `innerHTML` for batch labels or question text.
- Do not make history a save blocker. If storage is unavailable, ignore the
  history write and keep the existing save result.
- Do not rebuild `src/bookmarklet.min.js`.

## Handoff note (append when done)

```text
Date: 2026-10-27
Result: done. Added the additive ocrBatchHistory key and two pure helpers.
makeBatchHistoryEntry returns null without a batch ID or saved IDs; otherwise it
stores the batch id, timestamp, subject/category/year labels, unique ascending
IDs, their count, and savedModeSuffix without the leading comma.
upsertBatchHistory accepts an array, ignores malformed entries, replaces the
same batch ID, moves the entry to the front, and caps the array at 15. A
verified save rebuilds the current batch entry from
savedForBatch(savedLog, queue.batchId) after the saved-log write; rejected and
ambiguous saves return before the history hook. Reset Queue leaves the key and
the rendered box alone. The Recent batches box is after the saved box and
renders one textContent line per entry with explicit month abbreviations, an en
dash for a contiguous first/last ID, a comma list for gaps, 1 saved (#N) for one
ID, and no suffix for an empty mode. An absent or malformed key hides the box.
The history read and write are wrapped in try/catch and never add a blocker,
stop a run, or change a save result.

Files: src/parser/parser.js; src/ui/ui.js; src/bookmarklet.js (rebuilt);
tests/unit.js; tests/ui-harness.js; AGENTS.md; docs/AGENTS.md;
docs/Auto-Save-Spec.md; docs/DECISIONS.md; docs/INVARIANTS.md; docs/SPEC.md;
docs/plan/README.md; this file.
Hashes (SHA-256): src/parser/parser.js
  0158b2bd9c40b6e1a475ad55d8f9c1d368d6c1c8acae3ae96177b377e2ad7d36;
  src/ui/ui.js
  ccbcbda3b32bec00f188011e0c95e585416114004d503d595efda1fa774f73ab;
  src/bookmarklet.js
  543ad8a95fd57811bfbe77b4ef7b055743b03d8d66500227bce6e782044a7676;
  tests/unit.js
  7c1e8c681b81a1ff787f54f51ce937b78518b14b86360bb06cf1ea24f54d7694;
  tests/ui-harness.js
  4cd59d7ab0e07e270c8b3a1bc298bd912aabdf0c894064de07823c2fb4d97246.

Acceptance coverage:
- runner 41 PASS, 0 FAIL, 0 PENDING, no orphan: command run 2026-10-27.
- makeBatchHistoryEntry and upsertBatchHistory: 6 unit tests cover null
  guards, sorted unique IDs, count, mode (uniform/mixed/unverified/MISMATCH),
  same-batch replacement, newest-first order, the 15 cap, non-array input and
  malformed entries.
- Approved line, 1-ID line, gap list, contiguous range, empty mode, and initial
  load: UI harness test with fixed local timestamps and stored entries.
- Same batch saved again and 16th batch: helper tests above.
- Reset Queue keeps history: UI harness test clicks Reset and compares the key
  and visible box.
- History storage failure: the harness fails reads/writes for
  ocrBatchHistory; the save still posts, logs, advances, clears the marker, and
  shows no blocker. The key is absent.
- Rejected/ambiguous saves: the existing UI save tests now also assert that
  ocrBatchHistory is absent.
- Build: src/bookmarklet.js is one line, 74506 bytes plus newline, contains no
  %, and its body passes new Function. A temp-copy rebuild reproduced the
  checked-in hash. src/bookmarklet.min.js was not rebuilt.

Build: node src/build/build.js wrote src/bookmarklet.js (74488 chars, 74506
bytes); wc -l prints 1; no %; body parses. Extractor --check green for seven
slices.
Docs: D-57 added; SPEC §7.1 storage and the saved summary updated;
Auto-Save-Spec keys, save steps and saved-list UI updated; INV-89 added and the
stale INVARIANTS total corrected (88/79 to 89/80 after the new row);
docs/AGENTS.md storage rule updated; README status, snapshot, fixture-count
table, verification queue, review checkpoint and changelog updated. Also
corrected the stale D-56 sentence that said there was no DOM harness.
Review: light-verified at phase 5 Gate 1 (2026-10-27).
Commit: deferred to phase 5 start.
Open questions: none. AS-12 was not started.
```
