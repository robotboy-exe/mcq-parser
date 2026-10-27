# Prior-Batch Duplicate Fingerprints: Spec (revised after review)

Status: **accepted with the changes below**. This replaces the draft. The review's open questions are resolved in §11.

## 1. Problem

Auto-Save has two duplicate safeguards:

1. The saved log is checked by question number, but only inside the current batch (`savedLogHasNum`, scoped to `queue.batchId`).
2. The loaded `.admin-table` is checked by subject, year, category and question text (`recentDuplicate`). It sees only the 20 rows rendered on the page. Auto-Save's `fetch` calls do not update it, and the unfiltered list can omit newly saved rows.

`ocrSavedLog` keeps up to 200 entries across batches, but each entry holds only `{num,id,at,batchId,inactive,mode}`. That is not enough to check text or metadata.

Result: after Reset Queue and a re-paste, the new paste gets a new `batchId`, every earlier batch becomes invisible, and the same questions can be saved again.

## 2. Product decisions

- Check every entry still in `ocrSavedLog` (at most 200) that belongs to a different batch.
- A duplicate needs the same subject, category and year, plus the same normalized question text. Cross-year and cross-category copies stay allowed.
- Stop and show the duplicate. Never skip it silently.
- Do **not** add checks between two items in the same paste.
- Keep the current-batch number check and the 20-row table check unchanged.

## 3. Goals

1. Detect a prior save from any retained batch.
2. Stay local: no server query, no new network request, no new `localStorage` key.
3. Dry run and Start agree, because both use the same check.
4. Keep the stop-and-show behavior and the blocker order.
5. Old log entries must not cause false stops.
6. Keep the 200-entry cap, merge-by-ID behavior and Reset semantics.

## 4. Non-goals

- Duplicates between two unsaved items in the current queue.
- Looking anywhere beyond the retained log and the 20-row table.
- Backfilling old entries by fetching edit pages or the admin list.
- Comparing options, answers, explanations or media.
- A UI toggle. The check is always on.
- Any change to the `ocrSavedLog` key name or to `mergeSavedLog`.
- Adding an override or "save anyway" button for duplicates.

## 5. Definitions

- **Retained log:** the current `ocrSavedLog` array.
- **Current batch:** entries whose `batchId` equals `queue.batchId`.
- **Prior batch:** any retained entry whose `batchId` is absent or different.
- **Canonical question text:** `normalizeAnswer(text)`, which trims, collapses whitespace and lowercases. Use the existing function unchanged.
- **Complete fingerprint:** `fp.v === 1`, non-empty `subjectId`, `categoryId`, `year` and `question`.
- **Legacy entry:** any entry without a complete fingerprint.

## 6. Required behavior

### 6.1 Where the check runs

`autosaveBlockers` evaluates in this order:

1. Current-batch number check (`saved-log`), existing.
2. **New prior-batch check** (`duplicate`).
3. Recent-table check (`duplicate`), existing.

The new check skips every entry whose `batchId` equals `queue.batchId`. That is what keeps it from becoming an intra-batch check. If the queue has no `batchId`, the existing `batch-missing` blocker already stops auto-save, and the new check must not weaken it.

### 6.2 Fingerprint stored on each verified save

Add an `fp` object to the log entry. The change is additive only.

- `v`: `1`.
- `subjectId`, `categoryId`: the form values posted, as strings.
- `year`: the form value posted, as a string.
- `subject`, `category`: the selected option labels, stored as-is. They are for display and diagnostics only and are **never used for matching**.
- `question`: the canonical question text.

Rules:

- Store the full canonical text, not a hash. A hash is a possible later version.
- Write `fp` only for a verified save, at the same time as the log entry. Ambiguous or rejected saves write none.
- Manual and auto saves both write it.
- **Size cap:** if the canonical question is longer than 4,000 characters, or any required value is missing, omit `fp`. That entry is then legacy. Reason: the log shares browser storage with the queue, and a failed log write already stops the tool with "could not be logged. Do not retry."

### 6.3 What gets captured

The fingerprint must describe what was actually posted.

- Take the question text from the form's question box (`question_text`) at the moment the request body is built. Do not take it from the queue item, because a manual save can edit the form text.
- Take subject, category and year from the same moment, using the same values that go into the request.
- Attach the fingerprint to the log entry when the save is verified. If the user edits the form while the request is running, the fingerprint still belongs to the request that produced the row.

### 6.4 Matching

A retained entry is a prior-batch duplicate when all of these are true:

- It has a complete `fp` with `v: 1`.
- Its `batchId` differs from the current `queue.batchId`.
- `fp.subjectId` equals the current subject ID.
- `fp.categoryId` equals the current category ID.
- `fp.year` equals the current year as a string, exact.
- `normalizeAnswer(fp.question)` equals `normalizeAnswer(current question)`.

IDs and year are compared exactly. No label matching and no fallback. Label differences alone never cause or prevent a match.

If several entries match, report the newest by `at`, then by numeric `id`. A reverse loop over the log is acceptable if it gives the same result.

### 6.5 Reporting

Reuse the existing `duplicate` blocker code, so `blockerText` and the stop path stay unchanged. The detail text must include:

- the saved question ID;
- the year and category;
- a phrase saying it was saved in an earlier batch.

Example: `This looks like question #1785 saved in an earlier batch (2021, JAMB / UTME).`

### 6.6 Dry run

Dry run needs no separate code. It already calls `autosaveBlockers` with the log and its own copy of the queue, so it picks up the new check. Required behavior:

- It must not write `fp`, change the log, advance the queue or write the lock.
- It stops at the first prior-batch match with the same message Start would use.
- Legacy entries never match.
- With no match it previews unsaved items as before.

### 6.7 Legacy entries

Skip them in the new check. Do not backfill, clear the log or require a reset. Old bookmarklet versions may keep writing entries without `fp`; those stay legacy.

### 6.8 Reset and re-paste

Reset Queue still clears the queue, key and batch identity. `ocrSavedLog` still survives it.

- A new paste gets a new `batchId`, so all earlier entries count as prior batches.
- Same triple and same text: dry run and Start stop at the first match.
- Changed subject, category or year: no stop.

### 6.9 Getting past a confirmed duplicate

No override is added. The agent must confirm that the user can already move past a stopped duplicate (skip the question, or save it by hand), and must tell Samuel which of these exists. If neither exists, stop and report it instead of inventing a bypass. Manual save must stay ungated.

## 7. Storage and compatibility

- Same key, same 200-entry cap, same merge-by-ID code. Only one place writes log entries today, so `mergeSavedLog` stays as is.
- New code skips old entries. Old code ignores `fp`.
- Entries dropped by the cap are no longer checked.
- If the log write fails, keep today's behavior: stop honestly and do not retry.

## 8. Build constraints

The bookmarklet ships as one `javascript:` line.

- Edit the **source files**, never the built file.
- The build must stay one line, contain no `%` and parse. So no modulo operator, no `%` inside strings, and no `//` comments in code that ends up in the build.
- Expected size growth is small (roughly 1 to 2 KB).

## 9. Edge cases

| Case | Expected |
|---|---|
| Same text, same triple, prior batch | Block, report the saved ID |
| Same text, different year, category or subject | Allow |
| Different text, same triple | Allow |
| Same text, same triple, current batch | New check ignores it; number check still applies |
| Same text twice in one new paste | Allow (no intra-batch check) |
| Legacy entry, partial `fp`, or unknown `v` | Skip |
| Question over 4,000 characters at save time | No `fp` written; later re-paste is not caught |
| Multiple prior matches | Report newest by `at`, then `id` |
| Prior match from a manual or draft save | Block |
| Subject label changed but ID matches | Match |
| Category labels differ (`JAMB / UTME` vs `JAMB/UTME`) but IDs match | Match (labels are never used) |
| Question differs only by case or whitespace | Match |
| Log at 200 entries | Only retained entries are checked |
| Log write fails during save | Existing stop-and-do-not-retry path |

## 10. Tests and acceptance

**Unit tests** on a new pure helper, for example `savedLogPriorDuplicate(log, currentBatchId, fingerprint)`:

1. Same triple and normalized text in a prior batch returns that entry.
2. Different year, category or subject ID returns null.
3. Different text, same triple returns null.
4. Legacy entry returns null.
5. Partial or unknown-version `fp` returns null.
6. Current-batch entry is excluded even when text matches.
7. Same text twice in the current batch does not block.
8. Multiple matches return the newest by `at`, then `id`.
9. IDs decide the match; labels differing does not matter.
10. Normalization ignores case and whitespace.
11. Manual save writes a complete `fp`.
12. Ambiguous or rejected save writes none.
13. Question over 4,000 characters writes none.
14. `fp` holds the text from the form at request time, not the queue item's text.
15. Current-batch number check still runs first.
16. Recent-table check still runs when no prior entry matches.
17. Cap and merge behavior unchanged.

**Mock and integration:**

- Save one question, Reset, re-paste the same batch, dry run: stops before any POST with the earlier-batch message.
- Change year or category and dry run again: no prior-batch stop.
- Real Start on a duplicate: no POST is sent.
- No new network request and no new storage key.

**Acceptance:**

- The existing runner fixtures pass (41 after P12; 0 FAIL).
- The build is one line, has no `%` and parses.
- `tools/extract-bank.js --check` stays green.
- Reset plus re-paste of a saved batch stops on the first duplicate in both dry run and Start.
- Cross-year and cross-category copies still save.
- No intra-batch behavior, no new key, no new request.
- Legacy entries cause no false stops.
- Saved-batch display and copy text are unchanged.

**Docs to update:**

- New decision D-56 (D-54 category, D-55 options, D-56 duplicate).
- `docs/SPEC.md` §7.5.
- `docs/Auto-Save-Spec.md` §5 and §9.
- `docs/INVARIANTS.md`: INV-66 and INV-69, plus a new invariant for fingerprint scope.
- `docs/AGENTS.md`: Auto-Save gate row.
- `docs/plan/README.md`: change log.

## 11. Decisions on the review questions

1. **Identity:** IDs decide; labels are display only.
2. **Storage form:** full canonical text, with a 4,000-character cap.
3. **Blocker code:** reuse `duplicate`.
4. **Reported match:** newest.
5. **Manual saves:** write fingerprints.
6. **Legacy backfill:** none in v1.
7. **Normalization:** reuse `normalizeAnswer` only, with no `[Subject]` prefix stripping.
8. **Future hash:** if adopted, it is `fp.v: 2` with no migration of v1 entries.