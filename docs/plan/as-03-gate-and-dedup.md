# AS-03 — Gate and duplicate safeguards

Status: done (2026-10-25). Depends on: AS-02. Blocks: AS-04.

## Self-contained context

AS-02 gives the gate its primitives. This package turns Auto-Save-Spec §5 and
§9 into one pure function that answers: may this question be auto-saved now?

The function is pure so the browser loop and Node tests use the same rules.
DOM extraction stays in `runOCRBookmarklet`; the saved-log and recent-table
checks take plain arrays.

## Goal

Add `autosaveBlockers(state)` and a plain-text reason mapper. Add a recommended
form-versus-queue check so auto cannot save a manually edited form. Add scenario
tests for the five dry-run cases in the spec.

## State shape

The UI builds this object; tests build it directly.

```js
{
  queue: { items, i, batchId },
  key,
  keyBatch,
  keyConflicts,
  meta: { subject, category, year, subjectText },
  confirmed,
  radioLetter,          // 'A'..'D', or null
  hasImage, hasVideo,
  savingMarker,         // null or {num, at}
  saveInProgress,
  stopRequested,
  runCount, runCap,
  lock, tabId, now,
  visible,
  savedLog,
  recentRows,           // [{id, subject, question}]
  form                  // {question, options:[a,b,c,d]}
}
```

## Gate order

Return an array of `{code, detail}` in this order. The loop shows the first.

1. `batch-missing`, `batch-mismatch`.
2. `queue-number`: whole queue consecutive, no null/gap/repeat/out-of-order.
3. `key-coverage`: key numbers exactly equal queue numbers, every value A–F.
4. `key-conflict`: any conflict from `parseKeyDetailed`.
5. `key-letter`: this question's key is E or F.
6. `no-answer`, `answer-mismatch`: radio checked and equal to the key letter.
7. `ef-present`, `flags`: E/F fields present, or any other advisory flag.
8. `options-not-abcd`: detected letters are exactly A, B, C, D.
9. `option-empty`, `option-duplicate`, `option-long`, `question-short`:
   non-empty, normalized-distinct A–D, each ≤500 UTF-8 bytes, stem ≥10 chars.
10. `needs-media`: `NEEDS_PICTURE` matches the stem or an option.
11. `meta-missing`, `not-confirmed`.
12. `file-attached`: a file is chosen in `question_image` or `answer_video`.
13. `saving-marker`, `save-in-progress`, `stopped`, `run-cap`, `lock`.
14. `hidden`: `!document.hidden` must be true.
15. `saved-log`: this number is already in this batch's saved log.
16. `duplicate`: recent table row has the same subject and first 140 chars.
17. `form-edited`: the form question or options no longer match the queued
    question. This is a safety addition; a text edit goes to the manual path.

E/F takes precedence over the generic `flags` reason so the user sees a specific
message. The generic flags check excludes `E/F options present`.

## Steps

1. Add `NEEDS_PICTURE` if AS-02 did not; otherwise reuse it.
2. Add `autosaveBlockers(state)` to `src/parser/parser.js` and export it.
3. Add `blockerText(blocker)` mapping every code to one plain sentence. Include
   details for flags, key letter, duplicate id, and answer mismatch.
4. Add `formMatchesQuestion(form, q)` and export it.
5. Add `savedLogHasNum(log, batchId, num)` and export it.
6. Add scenario tests to `tests/unit.js`:
   - clean batch: no blockers, first question would save;
   - gap in the middle: `queue-number`;
   - stem containing `diagram`: `needs-media`;
   - one E key letter in the middle: `key-letter` at that question;
   - legacy queue without `batchId`: `batch-missing`.
7. Add direct tests for every gate, including ordering (for example a missing
   key plus a hidden page reports the key reason first) and the duplicate
   safeguards.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0; every gate and scenario passes |
| `node -e "const p=require('./src/parser/parser.js');console.log(p.autosaveBlockers({queue:{items:[],i:0}}))"` | an array with a blocker, no throw |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds; `1` |
| `rg -n '%' src/bookmarklet.js` | no matches |

## Guardrails

- Do not put DOM reads or `fetch` in the gate.
- Do not let the gate mutate the queue, key, or storage.
- Do not weaken the parser flags; the gate consumes them.
- Do not turn duplicate matches into silent skips; the user chose stop-and-show.
- Keep the spec's reason order; tests should not depend on incidental order.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 24 PASS / 0 FAIL
Files: src/parser/parser.js (autosaveBlockers, blockerText,
  formMatchesQuestion, savedLogHasNum), tests/unit.js
Checks: build OK; one line; no `%`; syntax OK; five scenarios covered.
Open questions: none.
```
