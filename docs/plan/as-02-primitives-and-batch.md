# AS-02 — Parser and batch primitives

Status: done (2026-10-25). Depends on: AS-01. Blocks: AS-03.

## Self-contained context

AS-01 makes the build and unit harness ready. This package adds the pure
foundation the auto-save gate needs, plus the storage lifecycle for a batch. It
does not add the gate, the save function, or the auto-save UI.

The parser currently reports duplicate key numbers only as last-wins. It does
not report conflicts, and it does not flag E/F options. Both are needed before
the gate can be trusted.

## Goal

1. Add `parseKeyDetailed` without changing `parseKey`'s map result.
2. Add the `E/F options present` advisory flag.
3. Add and export the pure helpers used by AS-03/AS-04.
4. Add `batchId` and `ansKeyBatch` to the existing load/key lifecycle.
5. Make Reset Queue clear the queue, key, key batch, and batch id.
6. Cover the new helpers in `tests/unit.js`.

## Steps

1. **Key conflicts.** In `src/parser/parser.js`:
   - add one shared matcher, for example `keyPairs(text)`, returning
     `[{num, letter}]`;
   - implement `parseKeyDetailed(text)` returning `{key, conflicts}`;
   - `conflicts` is an array of `{num, letters}` for the same number seen with
     differing letters; repeated identical letters are not a conflict;
   - `key` keeps the last-wins behavior;
   - implement `parseKey(text)` as `parseKeyDetailed(text).key`;
   - export both.
2. **E/F flag.** After the existing option flags in `parseQuestion`, push
   `'E/F options present'` when `q.e` or `q.f` is non-empty. Update the
   expected `flags` in `claude-s2-father-of-faith-e-dotted.json` and
   `claude-s3-father-of-faith-e-dotless.json` before changing the parser. Add a
   note in each fixture that the flag comes from Auto-Save-Spec §5.7, not the
   earlier migration-doc "no flags" result.
3. **Pure helpers.** Add and export:
   - `newBatchId(cryptoObj)`: `crypto.randomUUID()` when available, otherwise a
     Date/random fallback; no `%` literal.
   - `byteLength(s)`: `new TextEncoder().encode(String(s)).length`.
   - `normalizeAnswer(s)`: trim, collapse whitespace, lowercase.
   - `optionLetters(q)`: letters A–F whose field is non-empty, in order.
   - `isConsecutiveQueue(items)`: non-empty, all integer non-null numbers, each
     next = previous + 1.
   - `keyCoversQueue(key, items)`: key numbers exactly equal queue numbers and
     every value is A–F.
   - `appendSavedLog(log, entry, cap=200)`: append and keep the newest `cap`.
   - `maxSavedId(log)`: highest numeric `id`, or 0.
   - `savedForBatch(log, batchId)`: entries whose `batchId` matches.
   - `formatSavedRange(entries)`: `Saved this batch: #901 to #910, inactive`,
     or a comma list when the ids are not contiguous.
   - `recentDuplicate(rows, subject, questionText)`: return the matching row or
     null. Compare normalized subject and the first 140 normalized characters;
     strip a trailing `…` or `...` from the row text.
   - `NEEDS_PICTURE`:
     `/diagram|figure|graph|picture|chart|table|passage|read the following|use the following|questions? \d+ (to|-)/i`.
4. **Storage lifecycle.** In `src/ui/ui.js`:
   - create `batchId` with `newBatchId()` on a questions load;
   - set `ansKeyBatch` to the queue `batchId` when a key is loaded with
     questions, or on a key-only paste when the current queue has a batchId;
   - delete `ansKeyBatch` when questions load with no key, when the key is
     cleared, and when a key-only paste has no batch to attach to;
   - persist conflicts in a new `ansKeyConflicts` key (additive) so a reload
     cannot hide a conflicting key; delete it with the key;
   - Reset Queue now clears `ansKey`, `ansKeyBatch`, `ansKeyConflicts`, and the
     queue (including `batchId`).
5. **Unit tests.** Fill `tests/unit.js` with cases for key conflicts, E/F
   parsing, byte length (ASCII, accented, emoji, 500-byte boundary), option
   letters, consecutive queues (gap, repeat, null, out of order), key coverage
   (missing, extra, E/F), log cap/order, range formatting, recent duplicate
   matching, and batch id fallback.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0; AS-02 cases all PASS |
| `node src/build/build.js` | writes one line |
| `wc -l src/bookmarklet.js` | `1` |
| `rg -n '%' src/bookmarklet.js` | no matches |
| `node -e "const p=require('./src/parser/parser.js');console.log(p.parseKeyDetailed('1.A 1.C 2.B'))"` | key `{1:'C',2:'B'}`, conflict for 1 with letters A and C |
| `rg -n 'E/F options present' fixtures/expected` | the two E/F fixtures updated |

## Guardrails

- Do not change `OPTION`, `LOOSE`, `splitSections`, `splitQuestions`, or the
  `+5` numbering guard.
- Do not add a new fixture for E/F; update the existing E/F fixtures. The runner
  count must stay 25.
- Do not change `ansKey` from a plain `{num: letter}` map.
- Do not write auto-save UI or call the gate from this package.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 14 PASS / 0 FAIL
Files: src/parser/parser.js (keyPairs, parseKeyDetailed, helpers, E/F flag),
  src/ui/ui.js (batchId, ansKeyBatch, ansKeyConflicts, Reset/Clear key),
  fixtures/expected/claude-s2… and claude-s3…
Checks: build OK; one line; no `%`; syntax OK; E/F flag in both fixtures.
Open questions: none.
```
