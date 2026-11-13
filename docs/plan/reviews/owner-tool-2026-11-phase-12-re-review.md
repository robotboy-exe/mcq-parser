# Re-review — owner-tool-2026-11 phase 12 (OT11) `FIX-1`, `FIX-2`

- **Date:** 2026-11-13
- **Mode:** closure-focused first re-review of `FIX-1` and `FIX-2` from
  `owner-tool-2026-11-phase-12.md`; frozen contracts taken from that record and
  the 2026-11-13 fix Gate 1/handoff (owner chose to keep and confirm the revised
  key for `FIX-1`)
- **Scope:** uncommitted docs-only worktree on `owner-tool-integration` at
  `0748c09` plus the fix-session edits (8 `*.md` files)
- **Independence caveat:** this re-review ran in the same conversation as the fix
  session. Every criterion below was re-checked from the files, not from the fix
  handoff, but the owner may want a fresh-session spot check.
- **Verdict:** PASS WITH ACCEPTED FINDINGS (`FIX-1`, `FIX-2` closed; new
  first-round `FIX-3`)
- **Commit readiness:** not ready; `FIX-3` routes to a fix session
- **Review status:** open on `FIX-3` only

## Commands

```text
git status --short; git diff --name-only | grep -v '\.md$'     (empty: docs only)
git diff 79a6a57 -- sample-passages.txt                         (one hunk: -13. A; +11. B, +12. c, +13. d)
git diff HEAD --quiet -- sample-passages.txt                    (unchanged by the fix)
sha256sum sample-passages.txt docs/DEPLOYMENT.md docs/DEVELOPER-GUIDE.md
wc -lc docs/DEPLOYMENT.md
grep -rn for stale key-coverage statements across *.md (adversarial probe)
grep -n phone-staging / FOR UPDATE; head of both staging scripts
git diff --numstat 79a6a57 -- <7 production files>
node tests/runner.js 60 PASS; unit.js 163 PASS; owner-tool.js 81 PASS;
context-migration, cbt-context FAIL 0; extract-bank --check OK (7 hashes);
php context-lib, context-admin, context-preflight, cbt-candidate FAIL 0;
php-render 9 PASS
```

## Closure of frozen findings

### `FIX-1` — closed

| Criterion | Result | Evidence |
|---|---|---|
| 1. Owner confirmation recorded: date, Q11/Q12 added, Q13 A→D, new SHA-256 | pass | OT11 fix note (`ot-11-owner-workflow-refinements.md`, "Fix note — phase 12"): 2026-11-13, Q11 `B`, Q12 `c`, Q13 `A`→`d`, old `d286f77a…`, new `f0640b5f1aae796442f8eeb159042a3f93dbaca41f5ed8d16a3ea1e64edb32b7` — matches `sha256sum` and the 79a6a57 diff |
| 2. Cited statements match the file | pass | `docs/plan/README.md:45-47`, `:270`, `:382-385`; `docs/STATUS.md:41-43`, `:183`; `next-steps.md:175-177`; `ot-08-comprehension-ocr.md:3`, `:7-8`; all now state the revised Q11-Q15 key was owner-confirmed 2026-11-13. Active map `phase-map.md:25`, `:56` agree |
| 3. Handoff "Files changed" names the file | pass | OT11 handoff `Files changed` lists `sample-passages.txt` |
| Non-goals | held | no parser/test/fixture change; `sample-passages.txt` untouched by the fix; OT10 coverage step (`README.md:406`) left to OT10 |

### `FIX-2` — closed

| Criterion | Result | Evidence |
|---|---|---|
| 1. Handoff "Files changed" and excluded list name all three paths and purpose | pass | `ot-11…md:408-413` (excluded paragraph, purposes) and `:426-427` (Files changed). Purposes match the files: `cbt_db.php:8` strips `FOR UPDATE`; the start/stop scripts manage the `$HOME/tmp` phone-staging server/PID |
| 2. `DEPLOYMENT.md` says not to deploy them | pass | `docs/DEPLOYMENT.md:16-21` |
| Manifest hash refreshed in OT10 handoff | pass | actual `121a2653…0352`, 179 lines / 11612 bytes = `ot-10-release-and-handoff.md:162`. `DEVELOPER-GUIDE.md` unchanged (`7e342a7d…` still matches) |
| Non-goals | held | `git diff HEAD -- tools` empty; scripts not deleted |

## Adversarial probe (derived from `FIX-1` criterion 2)

Searched all non-review `*.md` for any surviving claim that the key covers only
Q13-Q15 or that Q11-Q12 are missing. Every cited location is fixed, but two
uncited statements still contradict the confirmed file:

- `docs/plan/owner-tool/ot-09-cloze-ocr.md:347-350`: "The comprehension key does
  not cover Q11-Q12, so OT10 must confirm…"
- `docs/EDGE_CASES.md:236-237`: "comprehension keys for Q13-Q15 … Q11-Q12 remain
  missing."

These were not in `FIX-1`'s frozen list, so they do not reopen it (new ID below).
`AGENTS.md:14` says "keys … supplied … on 2026-11-08 (comprehension Q13-Q15 …)",
which is historically true and not contradictory; its "rigorous review pending"
wording is a settlement-time status update (`NOTE-1`).

## New findings

### `FIX-3` — Two uncited docs still say the Q11-Q12 key is missing

- **Defect:** `ot-09-cloze-ocr.md:347-350` and `EDGE_CASES.md:236-237` state the
  comprehension key does not cover Q11-Q12, contradicting the owner-confirmed
  `sample-passages.txt` (SHA-256 `f0640b5f…`).
- **Preconditions:** repository evidence read for the OT10 key-coverage gate.
- **Closure criteria:** both passages state the revised Q11-Q15 key
  (Q11 B, Q12 C, Q13 A→D) was owner-confirmed 2026-11-13, leaving OT10's final
  coverage confirmation with OT10.
- **Required evidence:** the two edited passages and a repeat of this probe's
  grep returning no contradicting non-review statement.
- **Non-goals:** no change to `sample-passages.txt`, parser, tests, fixtures, or
  historical review records.

### `NOTE-1` — Status lines to settle later

`AGENTS.md:14` and the OT11 header/coordinator say the review is pending or a
re-review is pending. Update them when phase 12 settles.

## Per-file measurements, deployment, and production-path evidence

No production file changed in this fix. `git diff --numstat 79a6a57` for the
seven production files is identical to the original review table
(`core.js` +9/−3, `owner-tool.js` +1231/−278, `owner-tool.css` +85/−51,
`admin_context.php` +211/−48, `context_lib.php` +34/−9, `admin_questions.php`
+7/−6, `cbt.php` +2/−2); responsibilities, manifest inclusion, and the direct
production-path suites are unchanged and still pass (counts above). Live-origin
`admin_questions.php` stays +100/−81 (at cap, no exception).

## Approvals and excluded artifacts

- **Approvals:** owner choice for `FIX-1` (keep and confirm the key), 2026-11-13.
  No limit exception requested or needed.
- **Excluded artifacts (not deployment files):** `sample-passages.txt`,
  `new-sample.txt`, `session-ses_e35a.md`, the `sample-cloze-left-drift`
  fixture/spec, `tools/phone-staging/cbt_db.php`, `tools/start-phone-staging.sh`,
  `tools/stop-phone-staging.sh`, untracked `deployed/cbt_db.php` and
  `deployed/cbt_admin_config.php`, and local staging tree/database/Chromium
  profiles.
- **Unrelated worktree changes:** none; all 8 modified files belong to the fix.

## Recommended next action

Run a fix session for the first-round `FIX-3`, then a closure-focused
second re-review.

`NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 12 OT11 FIX-3`
