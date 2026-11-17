# EL01 — English Lexis Subject and Constant-Text Grouping

- **Status:** done; phase-4 review-settled 2026-11-17 (PASS WITH ACCEPTED FINDINGS; `NOTE-1`–`NOTE-4` corrected)
- **Depends on:** the current branch/worktree baseline, preserving all unrelated
  math-editor and candidate-form changes; ME02's owner Brave/Android recheck
  remains a separate cycle-close gate and does not block this server-side package
- **Blocks:** cycle close
- **External gate:** execute the subject operation and rollback on disposable
  MySQL 8.0.41 before deployment; no production write in this package
- **Intent:** owner request dated 2026-11-17 and the EL01 amendment in
  [`INTENT.md`](../../INTENT.md)

## Goal

Add an active subject named exactly `English (Lexis & Structure)`. In
`cbt.php`, keep selected questions with the same non-empty Constant Text
adjacent for that subject and randomize the resulting groups rather than the
individual display rows.

## Settled Behavior

1. The subject operation uses the auto-increment ID. It never assumes or
   overwrites an ID, preserves an existing exact row, and leaves exactly one
   exact active subject after a successful run.
2. A rollback deactivates the exact subject and never deletes the subject,
   questions, or attempts.
3. The normal candidate pool, active/category/year filters, row-level random
   selection, and 50-question limit remain unchanged. Grouping happens only
   after the existing limited row selection.
4. Only the trusted database subject name exactly equal to
   `English (Lexis & Structure)` enables grouped ordering. Posted labels and a
   numeric subject ID do not enable it.
5. Selected rows with the same exact, non-empty `constant_text` string form one
   display group. `NULL` and the empty string each produce independent
   one-question groups. Case, whitespace, underline markers, and line breaks
   remain significant.
6. Display groups are shuffled. Inside a group, members are restored to their
   original question order (ascending `id`), independently of the random row
   order returned by the earlier selection. Flattening must not add, drop,
   duplicate, or mutate a question row.
7. Every other subject returns the selected rows in their existing order.
8. Constant Text continues to render on every member of a group so direct
   question navigation never hides the passage.

The grouping contract applies to the selected exam rows. It does not make all
database rows sharing a passage atomic during the earlier random selection.

## Production Plan

| File | Planned change | Responsibility / deployment | Direct evidence |
|---|---|---|---|
| `deployed/cbt_question_order.php` | New focused ordering helper, expected under 70 lines | Deploy beside `cbt.php`; exact-subject grouped ordering only | `php tests/cbt-question-order.php` requires the real module |
| `deployed/cbt.php` | One include and one post-fetch ordering call, expected under 6 additions | Existing candidate page; preserve current user edits | PHP lint, wiring assertion, disposable staging POST |
| `deployed/sql/03-english-lexis-structure.sql` | Rerunnable exact-name insert/reactivation with no fixed ID | Owner-run data operation after backup | Disposable MySQL absent/inactive/active/rerun probes |
| `deployed/sql/04-english-lexis-structure-rollback.sql` | Rerunnable exact-name deactivation, never deletion | Owner-run rollback operation | Disposable MySQL rollback/rerun probes |

`deployed/cbt.php` is live-origin and must remain within the cycle-wide
100-addition cap against
`archive/live-sources/cbt-2026-10-31.php`. The new focused PHP module has no
fixed line cap. SQL operations, tests, docs, staging files, and archived
snapshots are excluded artifacts and must be reported separately.

## Tests First

Add `tests/cbt-question-order.php` against the real production module. Cover:

- exact target activation and near-name rejection;
- deterministic group-level reorder through an injected test shuffler;
- repeated exact Constant Text becoming contiguous;
- `NULL` and empty Constant Text remaining singleton groups;
- case, trailing-space, and newline differences remaining separate;
- stable original order within each group (ascending `id`, despite random rows);
- unchanged row count, ID multiset, and field values;
- unchanged order for every non-target subject;
- vectors of 50, 60, and 100 selected rows and a group larger than 50 rows.

Add a production-wiring assertion that reads the real `deployed/cbt.php` and a
disposable staging check that starts an EL01 exam, verifies contiguous repeated
passages in the embedded question array, and confirms the existing count,
filters, rendering, and attempt insertion.

## Acceptance

| Check | Expected |
|---|---|
| Subject operation | Exact active name, generated ID, rerunnable, preserves existing fields |
| Rollback | Exact row becomes inactive; no row, question, or attempt is deleted |
| Target ordering | Every selected exact non-empty Constant Text group is contiguous |
| Randomization | Display units, not their member rows, are shuffled |
| Blank values | `NULL` and `''` are independent singleton units |
| Selection | Existing SQL filters, `ORDER BY RAND()`, limit, and selected ID multiset stay unchanged |
| Isolation | Other subjects and `cbt_practice.php` are unchanged |
| Rendering | Every grouped member still renders its own safe Constant Text block |
| Limits | New subject follows the existing default of 50 questions |
| Executable evidence | Tests require the real ordering module and exercise actual `cbt.php` wiring |
| Baseline | All existing Node/PHP suites, bank hashes, PHP lint, and `git diff --check` pass |
| Live safety | No production migration, subject write, question write, deploy, or cleanup |

## Non-Goals

- No fixed subject ID and no change to the 100/60/50 limit policy.
- No all-or-nothing database-pool selection for a Constant Text group.
- No Constant Text grouping for other subjects.
- No change to `cbt_practice.php`, attempt schema, admin question storage,
  `ocr_helper.js`, parser inference, rendering rules, or result-sheet content.
- No live migration or browser write without separate, exact owner approval.

## Stop Conditions

- A collation-equivalent but byte-different subject row exists.
- The target database lacks the expected unique `subjects.subject_name`
  contract.
- Grouping would require changing the selected ID multiset or nominal limit.
- The existing uncommitted `cbt.php` edits conflict with the narrow include or
  ordering call.
- Disposable MySQL 8.0.41 evidence is unavailable at release time.

## Handoff Template

```text
Date:
Result:
Package base:
Subject operation evidence:
Ordering test result:
Existing-suite results:
Externalize-first measurements:
Disposable staging evidence:
Files changed:
Open questions/known limits:
Review: pending rigorous review
Commit: deferred
Next: rigorous EL01 review, then any fix/re-review rounds
```

## Handoff — 2026-11-17

**Date:** 2026-11-17

**Result:** Implementation and every acceptance path pass on the exact Gate 1
worktree baseline, including the real `03`/`04` operation harness on isolated
Oracle MySQL Community Server 8.0.41 ARM64. EL01 is marked done. The earlier
MariaDB 13.0.2 run stayed preliminary only. No production or live-site action
occurred.

**Package base:** `owner-tool-integration` HEAD
`3f5d2eaa941333dfc2b9ffad5027951f090aee7e`, equal to the remote tip at Gate 1,
plus the owner-requested dirty worktree recorded there. The tracked Gate 1 diff
fingerprint was
`9778579933525d4dbe46434b4240ef32a78d064b7cc058994ec9afd3ec1dab06`.
The package preserved the existing candidate phone/email removal, math/underline
work, ME02 staging correction, and every other owner change. The production
`cbt.php` baseline was 1063 lines / 45512 bytes,
`560318c6c1d022e681b1d081f5d58dc2ec15e1152821c38ba805e72bac75817c`.

### Production files

| File | Package diff | Final lines / bytes | SHA-256 | Responsibility | Deployment / direct evidence |
|---|---:|---:|---|---|---|
| `deployed/cbt.php` | +5 / −0 | 1068 / 45755 | `5bdc353273b391a64634d46732dd3ea859ad215c5d7d62ac3878346876704e2a` | one helper include and one post-fetch/pre-attempt ordering call; existing owner candidate-form edits preserved | site root; PHP lint; real-source assertions; disposable HTTP POST |
| `deployed/cbt_question_order.php` | +48 / −0 | 48 / 1215 | `560e869fe7debecc95dfc43b2b1d98390b367fbca444f56980a89aa14ae72418` | exact trusted-subject grouped display ordering only | site root beside `cbt.php`; required directly by 10-check module/wiring suite and actual staging page |

The live-origin comparison against
`archive/live-sources/cbt-2026-10-31.php` is **+59 / −35**, within the
100-addition cap. Gate 1 expected at most +60. No limit exception or approval is
needed. The new helper is under the planned 70 lines and has one responsibility.

### Subject operation evidence

- `deployed/sql/03-english-lexis-structure.sql`: 82 / 2728,
  `b7653537170f6e631c8d5715cf9db18052483ea2515d4386bf86c5dd56ce981f`.
- `deployed/sql/04-english-lexis-structure-rollback.sql`: 69 / 2204,
  `519021bc96c886c39e39a54e6a2db214c2949fc5bb1e0891ead931f1a2740a07`.
- `bash tests/english-lexis-sql.sh` executes those real files. On 2026-11-17 the
  harness passed all 8 checks (generated ID, forward rerun, rollback rerun/no
  deletes, inactive and active row preservation, forward and rollback collision
  refusal, and incompatible-index refusal) against an isolated Oracle MySQL
  Community Server 8.0.41 ARM64 instance on `127.0.0.1:3307`, with no
  `EL01_ALLOW_NON_TARGET` override. The harness dropped its unique disposable
  databases and the server was stopped after the run with no PID or socket left.
- A fresh native disposable MariaDB 13.0.2 server had passed the same 8 checks
  earlier as preliminary signal only; it is not the acceptance evidence.
- INV-142 is `VERIFIED`, EC-144 is `CONFIRMED`, and the package is `done` on the
  MySQL 8.0.41 evidence.

### Ordering and staging evidence

- Failing-first evidence: `php tests/cbt-question-order.php` initially stopped
  with `[FAIL] production ordering module is missing` before production bytes
  were added.
- Pre-fix `php tests/cbt-question-order.php`: **10 PASS, 0 FAIL** (historical).
  It requires the
  real module and reads real `cbt.php`; it covers exact/near subject names,
  deterministic group shuffling, repeated contiguity, stable members, exact
  case/space/newline/underline distinctions, blank singletons, unchanged rows
  and ID multiset, non-target isolation, 50/60/100 arrays, and a 55-row group.
- Isolated local phone staging on port 3007 copied the real helper and page.
  `php tests/cbt-staging.php`: **6 PASS, 0 FAIL** through an actual HTTP POST:
  default 50, active/category/year filters, unmutated payloads, contiguous
  repeated passages, one attempt insert with the existing blank contact fields,
  and per-row safe Constant Text rendering. The server was stopped by its PID.
- `cbt_practice.php` is byte-untouched and the static isolation assertion passes.

### Existing baseline

```text
node tests/runner.js                 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                   163 PASS
node tests/ocr-helper.js             11 PASS
node tests/underline-toolbar.js      10 PASS
node tests/question-preview.js       4 PASS
node tests/math-tool.js              20 PASS
php tests/cbt-question-order.php     10 PASS (pre-fix; current count 11)
php tests/php-render.php             9 PASS
php tests/admin-question-store.php   8 PASS
node tools/extract-bank.js --check   source, anchors, counts, 7 hashes OK
php -l                               7 deployed files + 2 EL01 tests PASS on PHP 8.5.12
bash -n                              staging and SQL harness PASS
git diff --check                     PASS
```

Target PHP 8.3 lint remains a deployment check; the local runtime was PHP
8.5.12. No local result is represented as target-runtime evidence.

### Excluded artifacts

Excluded from the live-origin cap but included in the package evidence:
`deployed/sql/03-english-lexis-structure.sql`,
`04-english-lexis-structure-rollback.sql`, `deployed/sql/README.md`,
`tests/cbt-question-order.php`, `tests/cbt-staging.php`,
`tests/english-lexis-sql.sh`, the one staging-copy-list addition in
`tools/start-phone-staging.sh`, and current-facing docs. The immutable live
snapshot, supplied SQL archives, generated bookmarklet, `cbt_practice.php`,
dirty experiments worktree, main-worktree `.playwright-mcp/`, and local
disposable database/log/PID files were not modified or bundled.

Evidence artifact SHA-256: `tests/cbt-question-order.php`
`6a11546b0b0579f4fce51b2a3e69e31b97236f8536868d08446b5a5c1e8209f2`,
`tests/cbt-staging.php`
`b4c0ad43ad9510213d1fa9240c2adb99a70e7579e49df105413aaaebd04b1ee9`,
`tests/english-lexis-sql.sh`
`2bb96850e5a682438b8d6c5a28791571632c11989ba20a6c9559228e24234c1c`,
`tools/start-phone-staging.sh`
`0cd8770be3ec8d392c5869ccce67033399a0079fcc758c1110fa86a3d82d29bd`,
and `deployed/sql/README.md`
`1f731a668bbd1f17435949d8e5888c15f06b4bc51bd35f8c73383be356871b5c`.

**Files changed by EL01:** `deployed/cbt.php`,
`deployed/cbt_question_order.php`, `deployed/sql/03-english-lexis-structure.sql`,
`deployed/sql/04-english-lexis-structure-rollback.sql`,
`deployed/sql/README.md`, `tests/cbt-question-order.php`,
`tests/cbt-staging.php`, `tests/english-lexis-sql.sh`,
`tools/start-phone-staging.sh`, `AGENTS.md`, `docs/AGENTS.md`, `docs/SPEC.md`,
`docs/DECISIONS.md`, `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`,
`docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md`, `docs/STATUS.md`,
`docs/plan/README.md`, `docs/plan/prompts/phase-map.md`, the ME01/ME02 package
records, and this handoff. `INTENT.md` and the initial EL01 plan were already present in
the authorized Gate 1 baseline.

**Staging-shim classification (`NOTE-4`):** `tools/phone-staging/cbt_db.php`,
`tools/phone-staging/header.php`, and `tools/phone-staging/footer.php` are
pre-existing owner staging corrections outside EL01's product scope; the owner
confirmed they were requested extra work on 2026-11-17. The phase-4 boundary
commit includes them as authorized staging support because the 6-check HTTP
staging harness depends on them. They are never deployed.

**Owner update:** the owner accepted ME02's Brave/Android check on 2026-11-17;
ME02 is now done. The owner also confirmed the pre-existing dirty files were
from requested extra work and asked for one holistic review after EL01 is done.

**Open question / known limit:** none for package acceptance. Production
execution of the subject operations still needs the deployment backup,
target-contract preflight, and explicit owner authorization; this package is not
deploy authorization. Target PHP 8.3 lint remains a deployment check.

**Review:** phase-4 review settled 2026-11-17:
`PASS WITH ACCEPTED FINDINGS` in
[`reviews/math-editor-2026-11-phase-4.md`](reviews/math-editor-2026-11-phase-4.md).
No `BLOCK` or `FIX`. `NOTE-1`–`NOTE-4` were corrected as docs/scope changes.

**Commit:** phase-4 boundary commit authorized by the owner on 2026-11-17; this
record is part of that commit.

**Next:** cycle close via `docs/plan/prompts/cycle-close.md`; the optional `main`
fast-forward and archiving each need separate explicit owner authorization.

## Fix — 2026-11-17

**Clarified requirement (owner):** (A) a passage's questions are shuffled as
one unit, and (B) the questions inside a group keep *their own* order.

**Defect:** the helper preserved the order produced by `ORDER BY RAND()`, so
members inside a group were reordered on every draw. That satisfied neither a
stable authored order nor the owner's part B.

**Fix:** after grouping, and before shuffling the groups,
`cbt_order_selected_questions` sorts each group's members by ascending
original `id` (the authored order). Group-level shuffling, the selected ID
multiset, blank singletons, exact Constant Text matching, the SQL filters,
limit, and `cbt_practice.php` isolation are unchanged.

**Evidence:** `php tests/cbt-question-order.php` is now **11 PASS, 0 FAIL**; the
new check feeds deliberately out-of-order rows and asserts the group flattens
to ascending `id`. `php -l deployed/cbt_question_order.php` passes. The module
is now 56 lines / 1444 bytes,
`5c0a9b8c125b4a1d72737b3e9a532d6e386c50b7455ba8e1f1df39c122547fb7`;
the previous `48 / 1215` hash above is superseded. The earlier `10 PASS` counts
in this handoff are historical; current counts are 11.

**Files changed by this fix:** `deployed/cbt_question_order.php`,
`tests/cbt-question-order.php`, `AGENTS.md`, `docs/AGENTS.md`, `docs/SPEC.md`,
`docs/DECISIONS.md`, `docs/INVARIANTS.md`, `docs/DEVELOPER-GUIDE.md`,
`docs/DEPLOYMENT.md`, and this package record.

**Commit:** deferred (current-phase work).
