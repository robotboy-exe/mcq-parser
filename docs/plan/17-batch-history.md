# AS-11 — Recent batch history

Status: not started. Depends on: AS-10 (done). Blocks: AS-12.

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
Date:
Result:
Files:
Hashes:
Acceptance coverage:
Build:
Docs:
Review: light verification pending at phase 5 Gate 1.
Commit: deferred to phase 5 start.
Open questions:
```
