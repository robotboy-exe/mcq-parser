# Phase 1 Re-review — ST01 Constant Text Reset (`FIX-1`, `FIX-2`)

- **Date:** 2026-11-14
- **Reviewer:** independent review session (read-only), Freebuff cloud worktree
- **Scope:** closure of `FIX-1` and `FIX-2` from
  [`math-editor-2026-11-phase-1.md`](math-editor-2026-11-phase-1.md) (original
  review, 2026-11-14), package `docs/plan/owner-tool/st-01-constant-text-reset.md`,
  phase 1 of `math-editor-2026-11`
- **Reviewed state:** working tree over `6e301bb` (`WIP pending st01 review`);
  HEAD unchanged, no commit was made by the fix session
- **Mode:** closure-focused re-review; the frozen contracts were taken verbatim
  from the accepted record and were not broadened
- **Worktree:** the fix session left 11 modified files plus this cycle's review
  records; this session changed only this record

## 1. Frozen contracts resolved

| ID | Frozen closure criteria (from the accepted record) |
|---|---|
| `FIX-1` | (a) `OPTION` accepts optional whitespace between an A–D label letter and its `.` terminator, upper and lower case; (b) all six added forms, the left boundary and uppercase normalization unchanged; (c) `splitQuestions`, `FIXES`, `cleanBlock`/`cleanLine`, queue/storage/fill untouched |
| `FIX-2` | (a) `docs/SPEC.md` §3.4 and `docs/DEVELOPER-GUIDE.md` §3 describe the real keys (`ocrQueue`, `ocrMeta`, and the legacy `ocrSubmitted` submit-write / boot-delete), or the helper is changed to match — exactly one branch; (b) `AGENTS.md`/`docs/AGENTS.md` separate the bookmarklet rule from the restored helper; (c) any `INVARIANTS` statement covering helper storage is corrected |

Both IDs were in their first review round, so the accepted record itself
authorized this fix; no owner disposition was required or inferred.

## 2. Commands and observed evidence

`php` is the static PHP 8.3.32 CLI (the declared PHP 8.3 target); no system PHP
and no MySQL server exist in this VM.

```text
git log --format='%h %p %s' -2      # 6e301bb e64513f WIP pending st01 review; HEAD unchanged
git diff --stat 6e301bb            # 11 files: ocr_helper.js, tests/ocr-helper.js, docs only
git diff 6e301bb -- ocr_helper.js  # exactly one changed line
wc -lc ocr_helper.js               # 143 / 5615
git diff --numstat --no-index archive/live-sources/ocr_helper-2026-11-01.js ocr_helper.js
                                   # 38  18
sha256sum ocr_helper.js            # 9d44b56139f485bf3c2b8242d1d614aa9712663837107a560020f9d9b254da60
```

```text
node tests/runner.js            # fixtures 60, PASS 60, FAIL 0, PENDING 0
node tests/unit.js              # PASS 163, FAIL 0
node tests/ocr-helper.js        # PASS: 8 ocr-helper vectors
node tests/underline-toolbar.js # PASS: 9 underline-toolbar vectors
node tests/question-preview.js  # PASS: 4 question-preview vectors
node tools/extract-bank.js --check # OK: source, anchors, counts, 7 output hashes
php tests/php-render.php            # PASS: 9 PHP renderer vectors
php tests/admin-question-store.php  # PASS: 8 admin-question-store checks
php -l deployed/{admin_questions,admin_question_store,cbt,answer_details}.php  # all clean
```

The deployment manifest row now reads `ocr_helper.js` 143 / 5615 with SHA-256
`9d44b561…` (`docs/DEPLOYMENT.md:54`), which matches the file byte-for-byte.

## 3. Finding disposition

### `FIX-1` — CLOSED

- **(a) passes.** `ocr_helper.js:8` is
  `/(?<![A-Za-z])(?:\(([A-Da-d])\)|([A-Da-d])\s*[.)])[.)]*\s*/g`; the one-line
  diff against `6e301bb` adds `\s*` before the terminator and nothing else. The new
  vector "accepts whitespace between an option letter and its period" covers the
  uppercase spaced form and the lowercase spaced and newline-before-period forms,
  asserting all four options parse with no `option X missing` flag. Independent
  probes: `A . One B . Two C . Three D . Four` → One/Two/Three/Four, no flags;
  `a . One` / `b\n. Two` → same; `A .. One` (extra dots) → same.
- **(b) passes.** The existing "accepts all six lowercase and uppercase label
  forms" and "normalizes parsed letters to uppercase" vectors still pass, as does
  the mixed `(A). One (b) Two (C) Three d) Four` probe; `A. One …` without spaces
  is unchanged; a two-option paste still flags `option C missing` / `option D missing`,
  so the advisory path is intact.
- **(c) passes.** `git diff 6e301bb -- ocr_helper.js` contains exactly the regex
  line; `splitQuestions`, `FIXES`, `cleanBlock`/`cleanLine`, storage and fill are
  untouched, and 60/60 fixtures plus 163 unit checks pass unchanged.
- **Cap.** `ocr_helper.js` remains **+38 / −18** from
  `archive/live-sources/ocr_helper-2026-11-01.js` at 143 lines / 5615 bytes, inside
  the 100-addition limit; the package base is still `e64513f` and no counter was reset.
- **Residual, not a defect.** A stem that ends in a bare label letter followed by
  a period (`… grouping is A . One B . Two …`) now treats `A` as the option A
  marker. That is the direct consequence of the required spaced-label form and
  matches the shipped helper's behaviour, so it does not keep this finding open.

### `FIX-2` — CLOSED

- **(a) passes.** `docs/SPEC.md:141-146` now says `ocrSubmitted` is a legacy shared
  key the production helper still uses — written on submit, deleted on the next
  load while the queue advances — and that no other key is read or written.
  `docs/DEVELOPER-GUIDE.md:60-63` states the same behaviour. The claim matches
  `ocr_helper.js:130-142` (`store.set('ocrSubmitted', true)` on submit;
  `store.get`/`store.del` at boot). The documentation branch was chosen, so no
  behavior changed, as the frozen contract allows.
- **(b) passes.** `AGENTS.md:45` scopes the prohibition to new modules and the
  archived bookmarklet while naming the root helper's legacy marker;
  `docs/AGENTS.md:79-81` and `:191` make the same distinction.
- **(c) passes.** No invariant describes root-helper storage: `INV-36` and
  `INV-40` are bookmarklet claims evidenced by `src/ui/ui.js` and remain true, so
  none was rewritten. `INV-135` was additionally synced to the accepted label
  forms (`A .`, `a .`) and to 8 checks — consistent with the code and with
  `AGENTS.md:29`.
- `docs/DECISIONS.md:231` ("the bookmarklet does not read, write, or delete
  `ocrSubmitted`") is bookmarklet-scoped and remains true; no change is required.

### New finding

#### `NOTE-5` — `docs/DEVELOPER-GUIDE.md` §3 opens with "uses only:" above a third key

`docs/DEVELOPER-GUIDE.md:48` introduces the key block with "The production helper
uses only:" and lists `ocrQueue` and `ocrMeta`; the next bullet then documents the
legacy `ocrSubmitted` write/delete. The three-key behaviour is now stated
correctly, so `FIX-2`'s criterion is met, but the "only" wording contradicts the
bullet it introduces. Suggested polish: "The production helper reads and writes
these keys directly:" or drop "only". This is a documentation-only, non-blocking
wording issue; it does not invalidate the package and needs no evidence beyond the
edited sentence if the owner chooses to take it.

## 4. Regression and scope checks for the fix

- Full baseline re-run: 60/60 fixtures, 163 unit, 8 ocr-helper, 9 underline, 4
  preview, 9 PHP render, 8 store, bank-extractor hash check, PHP lint — all pass.
- `ocr_helper.js` still has no `constant_text` reference, so the helper/preview
  boundary is intact.
- Fix diff scope: 11 files. `ocr_helper.js` (FIX-1), `tests/ocr-helper.js` (FIX-1
  evidence), `docs/SPEC.md`, `docs/DEVELOPER-GUIDE.md`, `AGENTS.md`,
  `docs/AGENTS.md`, `docs/INVARIANTS.md` (FIX-2 plus the `INV-135` sync),
  `docs/DEPLOYMENT.md` (refreshed helper row), and the fix-session bookkeeping in
  `docs/STATUS.md`, `docs/plan/README.md` and the package fix note. No product
  behavior changed outside `FIX-1`; no unrelated or user-owned change was touched.
- The accepted review record is byte-intact (345 lines, original verdict,
  no re-review disposition appended). HEAD is still `6e301bb`; nothing was committed.
- Measurements, responsibility, deployment path and direct test binding for
  `ocr_helper.js` are unchanged: site root, `node tests/ocr-helper.js`.
- Excluded artifacts remain `archive/`, root `new-edge.txt`, supplied SQL,
  generated `src/bookmarklet.js`, and `tests/fixtures/` inputs.

## 5. Verdict

**PASS.** `FIX-1` and `FIX-2` close on every frozen criterion, with the required
evidence executed against the real production file and the current baseline
green; `NOTE-5` is non-blocking wording polish.

- **Review status:** closure-focused re-review complete; phase 1 is
  review-settled. This record disposes both requested findings and adds no
  blocking finding.
- **Commit readiness:** review-ready at the owner's explicit decision. No commit
  was made by this session, and `AGENTS.md` still requires an owner-requested
  commit at a phase boundary before the checkpoint can be advanced.
- **Outstanding, outside these findings:** the original review's `NOTE-2`
  (no browser runtime render of the CBT/answer-detail Constant Text; no MySQL run
  of the migration SQL) stays open as ME01/ME02 evidence, and `NOTE-1`, `NOTE-3`,
  `NOTE-4` were never claimed fixed and do not block phase 1.

NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 2
