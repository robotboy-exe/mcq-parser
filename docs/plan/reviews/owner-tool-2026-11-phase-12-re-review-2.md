# Second re-review — owner-tool-2026-11 phase 12 (OT11) `FIX-3`

- **Date:** 2026-11-13
- **Mode:** closure-focused second review round, run in a fresh session. It
  covers only `FIX-3`. The frozen contract comes from
  `owner-tool-2026-11-phase-12-re-review.md` (the first round that recorded it)
  and the OT11 handoff "Fix note — phase 12 `FIX-3` (2026-11-13)".
- **Scope:** `owner-tool-integration` at `origin/owner-tool-integration`
  `27242fa`. That commit holds the `FIX-3` fix, committed with the first
  re-review at the owner's checkpoint request.
- **Verdict:** PASS (`FIX-3` closed; no new findings)
- **Commit readiness:** phase 12 product and evidence findings are settled
  (`FIX-1`, `FIX-2`, `FIX-3` closed; `NOTE-1`–`NOTE-4` from the original review
  and `NOTE-1` from the first re-review are non-blocking). The phase-12 work
  already sits in owner-requested checkpoint commits. This review does not
  commit.
- **Review status:** complete. Earlier phase-12 records are immutable and
  unchanged.

## Worktree state (read-only)

At session start the local `owner-tool-integration` was at `056eb22`, three
docs-only commits behind origin (`0cb45c0`, `0748c09`, `27242fa`). The review
did not move the branch. It ran `git fetch` only, read the tip through
`git show origin/owner-tool-integration:<path>`, and extracted a scratch copy
with `git archive` for tests. `git diff --name-only 056eb22 27242fa` lists only
`*.md` files, so product files are identical at both commits. The local worktree
had no other changes. This record is the only file written. It is untracked
locally until the branch is fast-forwarded.

## Commands

```text
git fetch origin owner-tool-integration          056eb22..27242fa
git diff 0748c09 27242fa -- docs/plan/owner-tool/ot-09-cloze-ocr.md docs/EDGE_CASES.md
git diff --name-only 0748c09 27242fa | grep -v '\.md$'        (empty: docs only)
git diff --name-only 056eb22 27242fa | grep -v '\.md$'        (empty)
git archive 27242fa | tar -x -C <scratch>/tip
sha256sum sample-passages.txt    f0640b5f1aae796442f8eeb159042a3f93dbaca41f5ed8d16a3ea1e64edb32b7
grep -rnE 'Q11[-– ]*(Q)?12|Q11 and Q12|Q13[-–]Q15|1[12] (remain|are) (missing|pending)|not cover|only Q13' --include='*.md'
grep -rnE 'Q11|Q12' --include='*.md' | grep -iE 'miss|pend|lack|absent|not (yet )?(supplied|cover)|uncover|partial'
   (both outside docs/plan/reviews/ and archive/)
node -e parsePaste(sample-passages.txt).key[11..15]
git diff --numstat 79a6a57 27242fa -- <7 production files>
worktree: node tests/runner.js 60 PASS; unit.js 163 PASS; owner-tool.js 81 PASS;
          context-migration.js 14 PASS
scratch tip: cbt-context FAIL 0; extract-bank --check OK (7 hashes);
          php context-lib, context-admin, context-preflight, cbt-candidate FAIL 0;
          php-render 9 PASS; context-migration 13/1 (see below)
```

In the scratch copy, `context-migration.js` fails one probe: the
`git check-attr` byte-preservation check. The `git archive` extract has no
`.git`, so the failure comes from the environment. The same suite passes 14/14
in the real worktree, whose product and test files are identical.

## Closure of the frozen finding

### `FIX-3` — closed

| Criterion | Result | Evidence |
|---|---|---|
| `ot-09-cloze-ocr.md` passage states that the revised Q11-Q15 key (Q11 B, Q12 C, Q13 A→D) was owner-confirmed 2026-11-13 and leaves final coverage with OT10 | pass | `ot-09-cloze-ocr.md:347-352` at `27242fa`: "On 2026-11-13 the owner confirmed the revised comprehension key (Q11 B, Q12 C, Q13 A→D), so it covers Q11-Q15; OT10 still confirms whether the supplied sample satisfies final OT08 acceptance." The old "does not cover Q11-Q12" sentence is removed |
| `EDGE_CASES.md` passage states the same | pass | `EDGE_CASES.md:235-238`: "…confirmed the revised Q11-Q15 key (Q11 B, Q12 C, Q13 A→D) on 2026-11-13; OT10 confirms final coverage." The old "Q11-Q12 remain missing" is removed |
| Probe grep repeat finds no contradicting non-review statement | pass | The remaining hits are historical 2026-11-08 supply statements (`README.md:153-154`, `AGENTS.md:14`, `docs/plan/README.md:45`, `:382`, `STATUS.md:41`, `next-steps.md:175`, `ot-08…md:7`, `phase-map.md:25`). Each is either followed by the 2026-11-13 confirmation or only records the earlier supply, like `AGENTS.md:14` in the first re-review. `docs/plan/README.md:406` is an OT10 to-do ("Q11-Q12 comprehension-key coverage note"), not a claim that the key is missing. `ot-11…md:517` is the fix note's own grep list |
| Non-goals | held | `sample-passages.txt` SHA-256 still `f0640b5f…`. The fix diff `0748c09..27242fa` touches only `*.md`. No review record changed, and the fix commit adds only the first re-review file |

## Adversarial probe (derived from the closure criteria)

The closure claim is that the docs now agree with the actual file, so the probe
checked the file and the parser, not just the prose.

- `sample-passages.txt:38-42` reads `11. B`, `12. c`, `13. d`, `14. B`, `15. A`.
- `parsePaste(sample-passages.txt).key` returns
  `{"11":"B","12":"C","13":"D","14":"B","15":"A"}`, matching the documented
  Q11 B, Q12 C, Q13 A→D.
- A broader sweep of `Q11`/`Q12` near missing/pending/absent/partial wording
  found only unrelated text. `09-docs-cleanup.md:81` is about anomaly-block
  question numbers, and `ot-01-evidence-and-fixtures.md:97` is about passage
  structure. Neither concerns the key.

No contradiction remains. The probe found no new defect.

## Findings

No new findings. `FIX-3` is closed. `NOTE-1` from the first re-review still
applies: `AGENTS.md:14`, the OT11 header, the coordinator status rows, the
phase-12 review checkpoint (`docs/plan/README.md:341`), and the workflow stop
(`:420`) still describe phase 12 as review-pending. A later non-review session
must record phase 12 as settled.

## Per-file measurements, deployment, and production-path evidence

No production file changed after the original review.
`git diff --numstat 79a6a57 27242fa` matches the original table: `core.js`
+9/−3, `owner-tool.js` +1231/−278, `owner-tool.css` +85/−51,
`admin_context.php` +211/−48, `context_lib.php` +34/−9, `admin_questions.php`
+7/−6, `cbt.php` +2/−2. The original review's responsibilities, manifest
inclusion, and direct production-path suites (`tests/owner-tool.js` evaluates
the real `owner-tool.js` in `vm`; the PHP suites run the real `deployed/` files)
all still hold and pass. Live-origin `admin_questions.php` stays at +100/−81, at
the cap, with no exception requested or needed.

## Approvals and excluded artifacts

- **Approvals:** the owner chose for `FIX-1` (keep and confirm the key) on
  2026-11-13. `FIX-3` needed no new approval. No limit exception exists.
- **Excluded artifacts (not deployment files):** `sample-passages.txt`,
  `new-sample.txt`, `session-ses_e35a.md`, the `sample-cloze-left-drift`
  fixture and spec, `tools/phone-staging/cbt_db.php`,
  `tools/start-phone-staging.sh`, `tools/stop-phone-staging.sh`, untracked
  `deployed/cbt_db.php` and `deployed/cbt_admin_config.php`, the local staging
  tree, database, and Chromium profiles, and this review's scratch `git archive`
  copy.
- **Unrelated worktree changes:** none. The local branch lags origin by three
  docs-only commits (see above).

## Exact recommended next action

Phase 12 is review-settled. A non-review session should fast-forward the local
branch to `27242fa`, then record phase 12 as settled (`FIX-1`–`FIX-3` closed) in
the OT11 package, coordinator, active map, `STATUS.md`, and `AGENTS.md`. That
session must not rewrite these immutable records. The next coordinator step is
"Remaining path to cycle close" step 2, the OT10 external gate. This is an owner
decision: supply the live `cbt_db.php`, `header.php`, `footer.php`, and the
`cbt_exam_attempts` DDL, or record a `defer`/`accept risk` disposition. OT10
cannot resume or be marked done without it. No safe prompt command can make that
choice for the owner.

`NEXT COMMAND: NONE - phase 12 is settled; the owner must record phase 12 closure and decide the OT10 external gate (supply live cbt_db.php/header.php/footer.php/cbt_exam_attempts DDL, or defer/accept risk) before OT10 resumes`
