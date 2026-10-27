# AS-10 — Prior-batch duplicate fingerprints

Status: not started. Depends on: P12 (stable option parsing); AS-09 (done).
Blocks: AS-11.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

`docs/plan/13-duplicate-fingerprint-spec.md` is the authoritative spec, with
the decision number corrected to D-56. Implement prior-batch duplicate
detection without a new storage key, without a server query, and without
changing the existing saved-log or recent-table semantics.

P0 inbox cleanup is done. P12 must be green before this package starts so the
duplicate check is not built on unstable option parsing.

## Preconditions

- `node tests/runner.js` → 41 PASS, 0 FAIL; `node tests/unit.js` → prior tests
  PASS.
- P12 is done, its rigorous review record is `PASS` or accepted, and P11/P12
  are committed.
- Read `docs/plan/13-duplicate-fingerprint-spec.md` §§5–11.
- `src/parser/parser.js` `normalizeAnswer`, `savedLogHasNum`,
  `recentDuplicate`, `mergeSavedLog`, `commitSave`, `autosaveBlockers` and
  `src/ui/ui.js` `saveCurrentQuestion` are understood.
- Existing gate order is preserved: current-batch number, then the new
  prior-batch check, then recent-table.

## Work

1. Add a pure `makeSavedFingerprint(posted, labels)` helper. It returns `null`
   unless `question_text` is non-empty, `subject_id`, `exam_category_id` and
   `exam_year` are non-empty, and the canonical question is at most 4,000
   characters. Otherwise return:
   ```js
   {
     v: 1,
     subjectId: '<posted subject_id>',
     categoryId: '<posted exam_category_id>',
     year: '<posted exam_year>',
     subject: '<selected label>',
     category: '<selected label>',
     question: '<normalizeAnswer(question_text)>'
   }
   ```
2. Add a pure `savedLogPriorDuplicate(log, currentBatchId, fingerprint)`
   helper. Return the newest matching entry by `at`, then numeric `id`.
   A match requires a complete `fp.v === 1`, a different `batchId`, equal
   subject/category/year IDs, and equal `normalizeAnswer(fp.question)`.
   Legacy, partial, unknown-version, same-batch, and incomplete current
   fingerprints do not match.
3. In `saveCurrentQuestion`, snapshot the posted form values and labels before
   the `fetch`. After a verified save, attach `fp` to the log entry. Do not
   attach it to rejected or ambiguous saves. Do not change `mergeSavedLog`.
4. In `autosaveBlockers`, after `savedLogHasNum` and before `recentDuplicate`,
   build the current fingerprint from `q.question` plus the current metadata
   IDs/year and call the helper. On a match add the existing `duplicate` code
   with detail:
   `This looks like question #<id> saved in an earlier batch (<year>, <category>).`
   Use `meta.subjectText`/`meta.categoryText` for display when available.
5. Dry run already calls `autosaveBlockers`; verify it writes no `fp`, no log,
   no queue, and no lock. Start and dry run must show the same message.
6. Add unit tests for spec §10 items 1–17. At minimum: prior match, cross-year,
   cross-category, cross-subject, different text, legacy, partial/unknown `fp`,
   same-batch exclusion, newest match, label differences ignored, whitespace
   normalization, cap/merge unchanged, manual save writes `fp`, over-4,000
   question writes none, form text at request time, current-batch check first,
   recent-table check still runs.
7. Mock/integration: save one question, Reset, re-paste, dry run stops before
   POST with the earlier-batch message; change year/category and dry run does
   not stop; real Start sends no POST; no new network request or storage key.
8. Correct stale references in `docs/plan/13-duplicate-fingerprint-spec.md`:
   decision `D-44` → `D-56`; “existing 30 runner fixtures” → “existing runner
   fixtures”; keep the spec’s §11 decisions.
9. Update `docs/DECISIONS.md` D-56, `docs/SPEC.md` §7.5,
   `docs/Auto-Save-Spec.md` §§5 and 9, `docs/INVARIANTS.md` INV-66/INV-69 plus
   a fingerprint-scope invariant, `docs/AGENTS.md` Auto-Save gate row, and the
   README.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | spec §10 tests PASS |
| Same batch, saved log | current-batch number check still runs first |
| Prior batch, same triple and text | `duplicate` stop in dry run and Start; no POST |
| Prior batch, changed year/category/subject | allowed |
| Legacy/partial `fp` | never matches |
| Multiple matches | newest by `at`, then `id` |
| Manual save | writes a complete `fp` |
| Rejected/ambiguous save | writes no `fp` |
| Over-4,000 question | no `fp`; entry is legacy |
| Storage | same `ocrSavedLog` key, 200 cap, merge-by-ID unchanged |
| Build | `src/bookmarklet.js` one line, no `%`, body parses |

## Guardrails

- Do not add a new `localStorage` key, a server lookup, a hash, an override, or
  a “save anyway” button.
- Do not check two items in the same paste; skip every entry whose `batchId`
  equals the current batch.
- Do not change `mergeSavedLog`, the saved-log key shape, the 200-entry cap, or
  Reset semantics.
- Do not use labels for matching. IDs and year are exact; labels are display
  only.
- Keep `blockerText` and the stop path unchanged; reuse `duplicate`.
- Manual save remains ungated.
- If log write fails, keep the existing stop-and-do-not-retry path.
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
Review: rigorous review pending after completion.
Commit: deferred to phase 4 start.
Open questions:
```
