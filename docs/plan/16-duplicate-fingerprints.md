# AS-10 — Prior-batch duplicate fingerprints

Status: done (2026-10-27); rigorous review accepted with findings, FIX-1,
NOTE-1 and NOTE-2 fixed (2026-10-27). Depends on: P12 (stable option parsing);
AS-09 (done). Blocks: AS-11.

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
   Use the matched entry's stored `fp.year`/`fp.category` for display when
   present; otherwise use `meta.subjectText`/`meta.categoryText`.
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
Date: 2026-10-27
Result: done. Added pure makeSavedFingerprint(posted, labels) and
savedLogPriorDuplicate(log, currentBatchId, fingerprint). A verified save now
attaches an additive fp to its ocrSavedLog entry, built from the FormData values
and selected labels at request time; rejected/ambiguous saves never reach the
entry, and an empty required value or a canonical question over 4,000 characters
omits fp. The gate checks the current-batch number first, then the prior-batch
fingerprint, then the recent table, and reuses the duplicate code with
"This looks like question #<id> saved in an earlier batch (<year>, <category>)."
Matching uses IDs/year plus normalizeAnswer(text), never labels; legacy,
partial, unknown-version, same-batch and incomplete-current fingerprints skip.
The newest match is chosen by at then numeric id. Dry run and Start share the
gate. No new storage key, request, hash, override, or intra-batch check;
mergeSavedLog, the 200 cap and Reset semantics are unchanged.
Tests: runner 41 PASS, 0 FAIL, 0 PENDING, no orphans; unit 84 PASS, 0 FAIL
(+14 tests: 12 helper/gate/storage, 1 posted-text, 1 recent-table);
extractor --check green for seven slices.
Files: src/parser/parser.js; src/ui/ui.js; src/bookmarklet.js (rebuilt);
tests/unit.js; docs/DECISIONS.md; docs/SPEC.md; docs/Auto-Save-Spec.md;
docs/INVARIANTS.md; docs/AGENTS.md; docs/plan/README.md; this file.
Hashes (SHA-256): src/parser/parser.js
  5d605f966b5f8b1a7fa9eb553e150e0b0dae30ff9a578d55f275d28ebee537c7;
  src/ui/ui.js
  5f780e72dfe2c411f477f2c25d063c37c27d57b6b78444d75045f09db70175fe;
  src/bookmarklet.js
  de0bedebd5bd57485c92e1d212e8d06629daea973f34b6e4dac5f83f542d06b8;
  tests/unit.js
  3de3ec761d592c854b48db2124c4ddaf57dc04981aa8df8c1d831032384a2445.
Build: node src/build/build.js wrote src/bookmarklet.js at 70305 chars
(70306 bytes incl. newline); one line, no %, body passes new Function parse.
src/bookmarklet.min.js was not rebuilt.
Docs: D-56 added; SPEC §7.5 and Auto-Save-Spec §§3/5/9 updated; INV-66 and
INV-69 refreshed, INV-88 added; docs/AGENTS.md gate row updated; README status,
snapshot, fixture-count table, verification queue and changelog updated.
Plan 13 had no remaining D-44 or "30 runner" references.
Acceptance coverage: runner/unit/extractor/build and the acceptance table are
covered by tests or direct probes. Reset/re-paste, changed triple, newest match,
legacy/partial/same-batch, over-4,000, request-time text, first-check order and
recent-table fallback are unit-covered. The UI write hook (FormData snapshot
before fetch, fp only after a verified save) is traced in src/ui/ui.js; there is
no DOM/browser harness, so "manual save writes fp", "rejected/ambiguous writes
none", and "Start sends no POST" are inspection-level evidence. No new network
call or storage key is added.
Review: independent-pass-with-accepted-findings (`reviews/post-as-2026-10-phase-3.md`); user accepted 2026-10-27; FIX-1/NOTE-1/NOTE-2 applied; no re-review required.
Commit: deferred to phase 4 start.
Open questions: none. AS-11 was not started.
```

## Fix note (2026-10-27)

Result: closed review FIX-1 and NOTE-1. No save/gate behavior changed; no source
module or built bookmarklet changed, and `src/bookmarklet.min.js` was not
rebuilt.

FIX-1 evidence: added `tests/ui-harness.js`, a deterministic test-only
DOM/storage/fetch shim that evaluates the real `src/ui/ui.js` and drives its
form submit, Load, Reset, Dry run, and Start handlers. New async tests in
`tests/unit.js` cover:

- a manual save posting the form `FormData` and writing a complete `fp` whose
  question is the request-time form text, not the queue text;
- a rejected save leaving `ocrSavedLog` unchanged and writing no `fp`;
- an ambiguous save writing no `fp` and keeping the uncertain-save marker;
- Reset plus re-paste: Dry run stops before POST with the saved ID and
  earlier-batch text, a changed year no longer stops, and Start sends no POST
  while showing the same earlier-batch blocker. The scenario also asserts the
  storage key set stays unchanged.

NOTE-1 evidence: `docs/plan/README.md` now says AS-10 added 18 unit tests
(14 original plus 4 FIX-1 UI), replacing the incorrect 13 (the original count
was 14). The same doc's snapshot, status row, review checkpoint, and changelog
now record unit 88 PASS and the accepted-with-findings review.

Tests: runner 41 PASS, 0 FAIL, 0 PENDING, no orphans; unit 88 PASS, 0 FAIL
(+4 FIX-1 tests); extractor `--check` green for seven slices; build check on the
unchanged `src/bookmarklet.js` is one line, no `%`, body parses.

Files: tests/ui-harness.js (new); tests/unit.js; AGENTS.md; docs/AGENTS.md;
docs/INVARIANTS.md; docs/plan/README.md; docs/plan/prompts/README.md;
docs/plan/prompts/fix-session.md (new); docs/plan/prompts/review-session.md;
docs/plan/reviews/README.md; this file.
Hashes (SHA-256): tests/unit.js
  ee55a6a60a6353474fa7fbe1438a285ec3b86c4afc66359ea4fc8103fe9d7b9e;
  tests/ui-harness.js
  17bbd0ba718ff599311686df9e9b97535267c08eac8651896ff790d4ae121048;
  src/parser/parser.js
  5d605f966b5f8b1a7fa9eb553e150e0b0dae30ff9a578d55f275d28ebee537c7;
  src/ui/ui.js
  5f780e72dfe2c411f477f2c25d063c37c27d57b6b78444d75045f09db70175fe;
  src/bookmarklet.js
  de0bedebd5bd57485c92e1d212e8d06629daea973f34b6e4dac5f83f542d06b8.

Review: review record stays `reviews/post-as-2026-10-phase-3.md`
(independent-pass-with-accepted-findings). No re-review is required because
behavior is unchanged; the fix note and README checkpoint record the applied
fixes.
Commit: deferred to phase 4 start.

Workflow note: added `docs/plan/prompts/fix-session.md` (new) and updated
`docs/plan/prompts/README.md`, `docs/plan/README.md`, and the review contract
(`docs/plan/prompts/review-session.md`, `docs/plan/reviews/README.md`) so later
fix sessions attach a reusable prompt and can default to `fix phase N` without
listing findings. Reviews must now label findings `BLOCK-1`, `FIX-1`, `NOTE-1`,
and so on; a fix session addresses every open finding by default, with NOTEs
limited to docs/wording/test changes. Docs-only; no behavior or test change, so
no re-review is required. Those workflow files are part of this fix note's file
list; phase 4 should stage them with AS-10 rather than treating them as
unrelated changes.

## Fix note (2026-10-27, NOTE-2)

Result: closed review NOTE-2. The prior-batch duplicate detail now reports the
matched entry's stored `fp.year` and `fp.category` when present, falling back to
the current `meta.year` / `meta.categoryText` / `meta.category`. Matching is
unchanged: IDs/year and normalized text still decide it, and labels remain
display-only. No save, gate, storage, or stop-path behavior changed.

Files: `src/parser/parser.js`; `src/bookmarklet.js` (rebuilt);
`tests/unit.js`; `docs/plan/README.md`; this file.
Hashes (SHA-256): `src/parser/parser.js`
  c5adc3801b455f6536abff9d38494c418c7857a93bcbcd24053da01d81ccd528;
  `src/bookmarklet.js`
  bb76db3a23578790843b700f30aded99cfdaf1e29b4206bd4404157828b568a0;
  `tests/unit.js`
  3c2dcc12ed57367649017b3b91130eeec3e3941fcc08204d760939b489775cdf;
  `src/ui/ui.js` unchanged at
  5f780e72dfe2c411f477f2c25d063c37c27d57b6b78444d75045f09db70175fe.

Tests: runner 41 PASS, 0 FAIL, 0 PENDING, no orphans; unit 89 PASS, 0 FAIL
(+1 NOTE-2 regression test); extractor `--check` green for seven slices; build
one line, no `%`, body parses. `src/bookmarklet.min.js` was not rebuilt.

Behavior-change decision: display-only message detail; save and gate decisions
are unchanged, so no re-review is required.
Review: review record stays
`reviews/post-as-2026-10-phase-3.md` (independent-pass-with-accepted-findings).
Commit: deferred to phase 4 start.
