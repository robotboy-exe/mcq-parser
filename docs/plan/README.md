# OCR Owner Tool Work Plan — Coordinator

This is the operational source of truth for the active owner-tool cycle. Read
this file, [`../../INTENT.md`](../../INTENT.md), the active
[`phase-map.md`](prompts/phase-map.md), and the one package being executed.

Last updated: 2026-11-13.

## Current state

- Active cycle: `owner-tool-2026-11`.
- Product work: OT00-OT07 implementation is complete; Brave/Android staging is
  owner-deferred to OT10, and OT10 executed the target-runtime migration checks
  on 2026-11-08. OT07's
  rigorous Release B review returned PASS WITH ACCEPTED FINDINGS; the owner
  authorized `FIX-1`, which was applied and then closed by the closure-focused
  re-review on 2026-11-06, so phase 8 is review-settled and OT08 is next.
- Phase 6 review and disposition are settled. The 2026-11-05 lifecycle
  correction closes `BLOCK-3`/`BLOCK-6` against their frozen vectors and assigns
  the newly discovered partition scenario to `BLOCK-8`. The owner rejected
  `BLOCK-8` on 2026-11-05 because authoritative `questions.sql` and the older
  corroborating `questions1.sql` export are unpartitioned, while partitioning
  requires an out-of-contract schema change rather than a supported admin-form
  write. The immutable review's out-of-band partition risk remains recorded.
- `NOTE-4` remains non-blocking. OT05 is review-settled and included in the
  authorized 2026-11-05 boundary commit. OT06's OT05 dependency is satisfied.
  The owner removed `cbt_practice.php` and `practice_title` from the remaining
  cycle scope. The available-source main-question reader/writer audit passed on
  2026-11-05. OT06 passed its light review at OT07 Gate 1. OT07 is implemented;
  its rigorous Release B review returned PASS WITH ACCEPTED FINDINGS and the
  owner authorized `FIX-1`, which was applied and closed by re-review on
  2026-11-06. Phase 8 is review-settled and included in the 2026-11-06 boundary
  commit. OT08 passed its light review at OT09 Gate 1, and OT09 cloze OCR is
  implemented (parser 2.3.2). Its rigorous Release C review returned `BLOCK` on
  2026-11-07 (`BLOCK-1`, `FIX-1`), the owner authorized `fix` for both, and the
  2026-11-07 fix applied both under their frozen closure contracts. The first
  independent re-review closed `BLOCK-1` and `FIX-1` and recorded one new
  finding, `FIX-2`, in its first review round. On 2026-11-07 the owner changed
  the `FIX-2` requirement: keep the first evidenced group and drop every later
  colliding group as a whole with a warning naming the shared gap numbers,
  instead of refusing the later group. The 2026-11-07 fix session implemented
  that replacement rule (parser 2.3.2), and the closure-focused second re-review
  returned `PASS` and closed `FIX-2` on 2026-11-08. Phase 10 is review-settled
  and included in the 2026-11-08 boundary commit. Same-paste answer keys were
  supplied in `sample-passages.txt` on 2026-11-08 (comprehension Q13-Q15, cloze
  Q71-Q80); OT10 validates the remaining coverage. OT09A production
  consolidation is done and recorded; it changes the handoff file set, not the
  OT10 gates. Its `FIX-1` documentation evidence gap was fixed and closed by the
  closure-focused re-review on 2026-11-08, so phase 10A is review-settled and
  included in the 2026-11-08 boundary commit. OT10 local execution is in
  progress: PHP 8.3.16 lint/suites, MySQL 8.0.41 migration preflight/forward/
  rerun/rollback, adversarial schema/rollback probes, and a desktop Chromium 155
  harness pass. The Brave/Android phone check was performed on 2026-11-09 and
  passed; it surfaced owner-workflow refinements routed to the independent OT11
  package (phase 12). A later phone session recorded six follow-up requirements;
  their local implementation now passes all suites. The owner accepted the final
  OT11 Brave/Android re-check and requested the checkpoint commit/push on
  2026-11-13. OT10 remains blocked on the independent final review and the live
  deployment artifacts; it is not done.
- Working branch: `owner-tool-integration` is the authoritative integration and
  implementation line. `main` is the published baseline, not the current work
  branch. See [Branch strategy](#branch-strategy).
- Current `main` parser baseline at `002483b` (measured at `58af90e` before the
  supplied SQL/PHP files were added): 47 PASS, 0 FAIL, 2 PENDING runner; 5 bank
  slices. That line has no `tests/unit.js` or `tests/owner-tool.js`.
- OT04 merged code baseline on `owner-tool-integration` at `405439b`: 47 runner PASS
  + 2 PENDING, 145 unit PASS, 38 owner-tool PASS, 7 bank slices OK;
  staging/mobile verification is in OT10.
- OT05 evidence recorded after the latest focused Phase 6 fix and before the
  boundary commit: 47 runner PASS + 2
  PENDING, 145 unit PASS, 38 owner-tool PASS, 13 context-migration PASS, 13
  context-lib PASS, 19 context-admin PASS, 6 context-preflight PASS, 9 PHP renderer PASS; local PHP 8.3.16
  lint PASS. The known Windows/CRLF
  `extract-bank` pre-2026 output-hash mismatch remains a pre-existing baseline
  artifact, not an OT05 regression. Target-runtime migration execution is OT10.
- OT07 evidence: 47 runner PASS + 2 PENDING, 145 unit PASS, 47 owner-tool PASS,
  13 context-migration PASS, 4 cbt-context PASS, 13 context-lib PASS, 19
  context-admin PASS, 6 context-preflight PASS, 9 PHP renderer PASS, 7
  cbt-candidate PASS, and PHP 8.3 lint PASS. No live/staging write was used.
- OT08 evidence (uncommitted, base `224957e`): 52 runner PASS + 1 PENDING
  (cloze), 151 unit PASS, 51 owner-tool PASS, 13 context-migration PASS, 4
  cbt-context PASS, 7 bank slices OK. PHP is absent on this host, so no PHP
  lint/suite ran; no live/staging or browser write was used. The external
  same-paste key sample remains open.
- OT09A evidence (uncommitted, base `652c891`): 59 runner PASS, 0 PENDING; 162
  unit PASS; 53 owner-tool PASS; 14 context-migration PASS; 5 cbt-context PASS;
  13 context-lib PASS; 19 context-admin PASS; 6 context-preflight PASS; 9 PHP
  renderer PASS; 7 cbt-candidate PASS; PHP 8.3 lint PASS. Handoff is 12
  production files plus 2 ops; live-origin additions are +95, +53, +20, and +2.
  The known Windows/CRLF `extract-bank` pre-2026 mismatch remains pre-existing.
  No live/staging or browser write was used, and no commit was made.
- OT09A `FIX-1` (2026-11-08, documentation only): the package handoff now
  records the complete externalize-first table (base deltas, final lines and LF
  bytes, SHA-256, responsibility, deployment inclusion, direct production-path
  test) and a separate excluded-artifact list, reproduced from `652c891`. No
  product, test, fixture, parser-version, state-key, or deployment change. The
  closure-focused re-review returned `PASS` and closed `FIX-1` on 2026-11-08;
  phase 10A is review-settled and included in the 2026-11-08 boundary commit.
- OT10 local evidence (uncommitted, base `79a6a57`, 2026-11-08): 59 runner PASS,
  0 PENDING; 162 unit PASS; 53 owner-tool PASS; 14 context-migration PASS; 5
  cbt-context PASS; 13 context-lib PASS; 19 context-admin PASS; 6
  context-preflight PASS; 9 PHP renderer PASS; 7 cbt-candidate PASS; PHP 8.3.16
  and JS syntax PASS. MySQL 8.0.41 migration preflight/forward/rerun/rollback
  passed on a disposable production-shaped database, including extra/wrong-type/
  descending/cascading schema probes, position-only/slot-only/context-row
  rollback guards, and the post-`ALTER` writer-contention boundary. Desktop
  Chromium 155.0.8059.40 local harness: 33/33 PASS (admin login, owner tool,
  comprehension/cloze load, underline/paragraph preview, native PRG save, edit
  formatting tool, CBT complete-group delivery, answer-details XSS probes). The
  local smoke used test-only `cbt_db.php`, `cbt_admin_config.php`, and an
  inferred `cbt_exam_attempts` table; do not deploy them. The Brave/Android
  phone check passed on 2026-11-09; the independent final review and live
  artifacts remain open. The known Windows/CRLF `extract-bank` pre-2026
  mismatch remains pre-existing. No live write and no commit.
- OT11 owner-accepted checkpoint evidence (2026-11-13): 60 runner PASS; 163 unit PASS; 81
  owner-tool PASS; 14 context-migration PASS; 5 cbt-context PASS; 14 context-lib
  PASS; 23 context-admin PASS; 6 context-preflight PASS; 9 PHP renderer PASS; 7
  cbt-candidate PASS; PHP/JS syntax PASS. The first phone re-check found that the JS/native
  context editors were still separate; the owner required one native editor and
  the correction removed the duplicate fields, numeric pool inputs, toggle, and
  Fill action. Chromium 155 then passed the merged-card DOM, Add reveal,
  one-match adoption/member skip, and multi-context selector probes. The six
  later requirements add an exact unsaved-context stop, context-owned metadata,
  saved-card Show/Hide, native form boundaries, plain owner copy, and one
  preview beside Question Text. The 2026-11-12 consolidation adds stacked
  no-tab sections, authoritative full-paste clearing, full passage identity,
  advisory duplicate notices, next-free links, and 10-row shared-text paging
  without narrowing the question selector. The final owner follow-up places
  the shared-text editor below the paste panel and prevents restored context
  state from replacing `?edit_context=N`; desktop and 390px Chromium probes
  pass. The
  latest owner re-check found that an adopted/saved first passage hid the
  unsaved cloze passage and that `new-sample.txt` gap 75 was one character left
  of the table modes. Tool 1.5.4 now keeps the first unsaved text open, limits
  Use Paste to new drafts, preserves every saved edit, and visibly separates
  amber draft mode from blue edit mode; parser
  2.3.3 applies only a corroborated two-anchor local correction. Exact cloze and
  adopted-member Chromium probes pass. Focused review findings are closed. The
  owner accepted the final Brave/Android re-check and explicitly requested the
  checkpoint commit/push on 2026-11-13; the independent rigorous review remains
  open. No live write was used.
- Selected clean experiments base: `d5a62f0`; verified by OT00 at 43 runner and
  140 unit passes.
- Dirty experiments P20-P22: reviewed `BLOCK`, shelved, and excluded.
- Current status summary: [`../STATUS.md`](../STATUS.md).
- Continuation checklist: [`owner-tool/next-steps.md`](owner-tool/next-steps.md).
- Historical P01-P09 and shelved-cycle record: [`history.md`](history.md).

## Product direction

- Replace the deployed `ocr_helper.js` with a readable owner tool.
- Do not ship a bookmarklet or Auto-Save workflow.
- Fill the native form for human review and use native PRG saves.
- Use fresh versioned state; do not trust legacy queues.
- Release A: owner tool plus underline/multiline.
- Release B: manual shared-context persistence and complete-group delivery.
- Release C: comprehension and cloze OCR automation.
- Release B candidate delivery targets `cbt.php` only. Existing
  `cbt_practice.php`/`practice_title` behavior remains unchanged and outside the
  remaining cycle scope.

`INTENT.md` is authoritative when package prose is ambiguous.

## Externalize-first contract

This contract applies cycle-wide to every product package, fix session, review,
and cycle close.

- Record an exact package-base Git ref before implementation. A fix session
  inherits the original package base and does not reset its line counters.
- For each live-origin production file, the cumulative additions from its
  archived live snapshot must not exceed 100 by `git diff --numstat`. Deletions
  do not offset additions. This protects the original live files only.
- New phase-cycle production modules have no fixed line cap. They must remain
  cohesive, avoid unnecessary fragmentation, and have an explicit deployment
  path.
- A proposed live-origin excess requires explicit owner approval at Gate 1
  naming the exact file, measured excess, and justification. `go`, package
  acceptance, or approval of another file does not imply an exception.
- Cohesive new behavior belongs in focused modules/includes. Existing entry
  points retain only imports/includes, dispatch, narrow wiring, and unavoidable
  local transaction hooks.
- Each module has one clear responsibility and an explicit deployment path.
- Tests must execute the real production modules and paths. Copied SQL, copied
  control flow, or reimplemented production behavior does not count as
  executable evidence for that path.
- Do not game the limits with minification, compressed statements, generated
  code, generic dumping-ground helpers, or unnecessary file fragmentation.
- Supplied snapshots, archives, and generated artifacts are excluded from the
  limits, but every excluded file must be identified and reported separately.
- Gate 1 reports every planned production file, its baseline lines and bytes,
  expected additions, extraction boundary, and direct production-path test. It
  also identifies each excluded artifact separately.
- The handoff reports, per production file, additions/deletions from the package
  base, final lines/bytes, responsibility, deployment inclusion, and the test
  evidence that executes its production path. It reports excluded artifacts in
  a separate list.
- A review independently reproduces the measurements, verifies module
  responsibility and deployment inclusion, and confirms that claimed tests run
  the production paths. An unapproved limit breach, monolithic production
  addition, or copied-path test claim is a `BLOCK`.

## Finding lifecycle contract

Reviews are rigorous without creating a moving target:

- Every `BLOCK` and `FIX` records an exact defect, supported operating
  preconditions, a finite closure checklist, required evidence, and explicit
  non-goals or deferred checks. Broad labels such as "exact schema" or "safe
  rollback" are not closure criteria by themselves.
- Once the owner authorizes a fix, its closure contract is frozen. A fix Gate 1
  must restate it before offering `go`. Only the owner may broaden it or change
  the underlying requirement.
- An original review is exploratory. A re-review is closure-focused: it verifies
  the named closure checklist, tests regressions from the fix, and runs an
  adversarial probe derived from that checklist. It does not search unrelated
  dimensions merely to satisfy the adversarial-probe requirement.
- A named finding closes when its frozen checklist passes. A different defect
  discovered during re-review receives the next unused ID in its severity
  namespace across all package review records; it never keeps the old ID open.
- A new re-review finding is a `BLOCK` only when it demonstrates an unmet package
  acceptance requirement, a material regression introduced by the fix, or a
  reproducible security/data-loss risk on a supported path under documented
  preconditions. A scenario that requires violating a mandatory operating
  precondition is normally hardening or residual risk, not a blocker, unless
  the package explicitly promises protection after that violation or the
  precondition cannot realistically be verified or enforced.
- The owner disposition for a finding is one of: `fix`, `reject` with rationale,
  `accept risk`, `defer` to a named package, or `change requirement`. Record the
  exact finding IDs, rationale, and destination in the package and coordinator.
  No agent may infer a disposition from `go`, silence, or package acceptance.
- An unresolved `BLOCK` still prevents commit readiness and dependent work. A
  non-fix owner disposition resolves the workflow decision without rewriting
  immutable review evidence; a `fix` disposition remains unresolved until its
  frozen checklist passes re-review.
- Owner disposition is an escalation, not the first step. A review round is one
  recorded review or re-review. A finding escalates only after two review rounds
  without resolution: the review that recorded it left it open, and the next
  review round still leaves it open or prescribes another fix. A
  first-round `BLOCK` or `FIX` routes directly to
  [`prompts/fix-session.md`](prompts/fix-session.md) against its frozen closure
  contract; the review record, not an inferred owner disposition, authorizes
  that one fix.
- A defect recorded for the first time in a re-review is also in its first
  review round and routes to a fix session the same way; it escalates only if
  its own re-review leaves it unresolved. This is an escalation rule, not an
  automatic pass; genuine unresolved risk remains visible.
- Owner decisions use
  [`prompts/finding-disposition.md`](prompts/finding-disposition.md), which
  records the decision in current-facing package/coordinator documents without
  altering immutable review evidence.
- For review records written before this contract, the frozen checklist is the
  concrete reproduced defect, named vectors, required fix, and evidence stated
  in the accepted review and fix Gate 1. Any ambiguity stops for owner decision.

## Package states

Status values are `not started`, `in progress`, `blocked`, and `done`.

| Phase | ID | Package | Depends on | Status | External gate |
|---|---|---|---|---|---|
| 1 | OT00 | [Integration Baseline](owner-tool/ot-00-integration-baseline.md) | none | done | explicit approval before merge commit |
| 2 | OT01 | [Evidence and Fixtures](owner-tool/ot-01-evidence-and-fixtures.md) | OT00 | done | none |
| 3 | OT02 | [Production Parser Core](owner-tool/ot-02-production-parser-core.md) | OT01 | done | none |
| 4 | OT03 | [Owner Tool Replacement](owner-tool/ot-03-owner-tool-replacement.md) | OT02 | done | satisfied (helper archived 2026-11-01) |
| 5 | OT04 | [Underline and Multiline](owner-tool/ot-04-underline-and-multiline.md) | OT03 | done | none; staging/mobile deferred to OT10 |
| 6 | OT05 | [Context Schema and Admin](owner-tool/ot-05-context-schema-and-admin.md) | OT04 review (settled) | done; `BLOCK-8` rejected, review/disposition settled, boundary commit authorized | none; runtime migration deferred to OT10 |
| 7 | OT06 | [Candidate Group Delivery](owner-tool/ot-06-candidate-group-delivery.md) | OT05 | done; light review PASS at OT07 Gate 1 | satisfied: [reader/writer audit](owner-tool/ot-06-reader-writer-audit.md) |
| 8 | OT07 | [Owner Context Workflow](owner-tool/ot-07-owner-context-workflow.md) | OT06 | done; Release B review PASS WITH ACCEPTED FINDINGS; `FIX-1` closed by re-review 2026-11-06; phase 8 boundary committed; `NOTE-1` non-blocking | inherited server contract |
| 9 | OT08 | [Comprehension OCR](owner-tool/ot-08-comprehension-ocr.md) | OT07 review | done; parser 2.2.0; light review PASS at OT09 Gate 1 | key sample partially supplied 2026-11-08 (Q13-Q15; Q11-Q12 pending) |
| 10 | OT09 | [Cloze OCR](owner-tool/ot-09-cloze-ocr.md) | OT08 | done; parser 2.3.2; Release C `BLOCK-1`/`FIX-1` closed by re-review 2026-11-07; `FIX-2` closed by second re-review 2026-11-08; phase 10 boundary committed | cloze key supplied 2026-11-08 (OT10 validates) |
| 10A | OT09A | [Production Consolidation](owner-tool/ot-09a-production-consolidation.md) | OT09 boundary | done; 12 production files + 2 ops; no behavior change; `FIX-1` closed by re-review 2026-11-08; phase 10A boundary committed | none; OT10 gates unchanged |
| 11 | OT10 | [Release and Handoff](owner-tool/ot-10-release-and-handoff.md) | OT09 review | blocked: local PHP/DB/desktop checks pass; Brave/Android phone check passed 2026-11-09; final review and live artifacts pending | local PHP, staging, all prior artifacts |
| 12 | OT11 | [Owner Workflow Refinements](owner-tool/ot-11-owner-workflow-refinements.md) | OT10 phone check (2026-11-09) | done 2026-11-13; owner accepted the final Brave/Android re-check; 60 runner, 163 unit, 81 owner-tool and full suites pass; independent rigorous review pending | satisfied 2026-11-13 |

The active map duplicates these statuses for session resolution. Update both
files in the same package handoff; a mismatch blocks the next Gate 1.

## External artifacts

| Artifact | One-line justification |
|---|---|
| Current production `ocr_helper.js` | Defines the exact behavior and state being replaced |
| Exact DDL bytes for `questions`, `subjects`, `exam_category` | Supplied 2026-11-03 in `main` commit `002483b` and copied to `owner-tool-integration` |
| `answer_details.php` | Supplied and archived 2026-11-02; integrated in OT04 and independently verified again in OT10 |
| PHP and database versions | Satisfied: PHP 8.3 application target; MySQL 8.0.41 from schema exports |
| [Main-question reader/writer inventory](owner-tool/ot-06-reader-writer-audit.md) | Satisfied 2026-11-05; finds every available affected `cbt.php` read path and linked-question mutation path |

The connection contract is settled by root `db_conn.php` (charset `utf8mb4`,
PDO exceptions, associative fetches, native prepares). Do not request a redacted
or full `cbt_db.php`.

The `exam_category2` → `exam_category` correction is settled. Keep the original
export as evidence and apply the correction only to the working DDL copy.

The supplied SQL exports are archived unchanged at
`archive/sql/2026-11-03-supplied/` with recorded hashes. `exam_category.sql`
still uses `exam_category2`; the original stays unchanged, and only
`deployed/sql/base-schema.working.sql` applies the settled rename.

Secrets, credentials, cookies, and production data are not required.

`answer_details.php` arrived before OT04 handoff. The supplied bytes are archived,
its deployed working copy uses OT04's shared renderer, and OT10 independently
verifies the detail path with the rest of Release A.

## Branch strategy

- `owner-tool-integration` is the authoritative work branch. It contains `main`
  and all owner-tool work through OT07. Continue later implementation here only
  after the required review gates pass.
- `main` is the published baseline and the remote default. It is not the current
  work branch. Advance it only at a reviewed release boundary or cycle close, by
  fast-forwarding it to the reviewed `owner-tool-integration` tip. Never rewrite
  its history.
- Do not create a long-lived branch per phase. If a risky experiment needs
  isolation, use a short-lived topic branch off `owner-tool-integration` and merge
  or delete it in the same package.
- `ot04-fix` and `ot04-review` are merged into `owner-tool-integration` and
  retired. Their commits remain reachable through history; do not base new work
  on them.
- Reviews are read-only sessions against `owner-tool-integration`. A review
  session may write only its record under [`reviews/`](reviews/README.md); it
  never commits or moves branches.
- Implementation changes land on `owner-tool-integration`. The rigorous review at
  a release boundary verifies that tip; only then may `main` be advanced.

## Review checkpoints

| Checkpoint | Scope | Level | Status |
|---|---|---|---|
| phase 1 close | OT00 integration baseline | rigorous | pending |
| phases 2-4 | OT01-OT03 | light at next Gate 1 | pending |
| phase 5 close | OT04 Release A implementation and detail-source integration | rigorous | pass |
| phases 6-7 | OT05-OT06 | light at next Gate 1 | pass at OT07 Gate 1 |
| OT05 remediation | OT05-EXT-01 plus accepted Phase 6 fixes | rigorous | settled; `BLOCK-8` rejected by owner, boundary commit authorized |
| phase 8 close | OT07 Release B | rigorous | pass; review PASS WITH ACCEPTED FINDINGS, `FIX-1` closed by re-review 2026-11-06, boundary committed |
| phase 9 | OT08 | light at OT09 Gate 1 | pass at OT09 Gate 1 |
| phase 10 close | OT09 Release C | rigorous | pass; implementation done 2026-11-06; `BLOCK-1`/`FIX-1` closed by re-review 2026-11-07; `FIX-2` closed by second re-review 2026-11-08; phase 10 boundary committed |
| phase 11 close | OT10 final release | rigorous | pending; phone check passed 2026-11-09 |
| phase 12 close | OT11 owner workflow refinements | rigorous | pending; package done 2026-11-13; next workflow step |

OT05 implementation and its accepted Phase 6 fixes are complete. The third
re-review remains immutable evidence. `BLOCK-3` and `BLOCK-6` are closed against
their frozen vectors; the owner rejected `BLOCK-8` because the authoritative and
corroborating supplied table shapes are unpartitioned and partitioning is outside
the supported target contract. The technical risk on an out-of-band partitioned
target remains recorded rather than rewriting the review. Reconnect hardening
remains non-blocking `NOTE-4`. OT06's OT05 dependency is satisfied. The owner subsequently removed
`cbt_practice.php`/`practice_title` from the remaining cycle scope and authorized
the Phase 6 boundary commit. The available-source reader/writer audit passed on
2026-11-05. OT06 passed its light review at OT07 Gate 1. OT07 is
implemented and its rigorous Release B review returned PASS WITH ACCEPTED
FINDINGS; `FIX-1` (handoff hash/byte accuracy) was fixed and closed by the
closure-focused re-review on 2026-11-06. Phase 8 is review-settled and
included in the 2026-11-06 boundary commit. OT08 is implemented: parser 2.2.0
recognizes bounded comprehension contexts, parses one complete `(a)`-`(d)` set
per linked question, returns `contexts`/`keyConflicts`/`sectionEvidence`/
`warnings`, and fills editable OT07 draft cards without posting. Its manual
context cards, native context-form adapter, exact PRG binding, stale draft
guard, linked question fields, and full Reset behavior have local JS/PHP
evidence. OT08's light review passed at OT09 Gate 1. Parser 2.3.0 added cloze
recognition: the supplied gap passage and A-D table become one shared cloze
context with `[[gap:N]]` tokens, ten editable linked questions, and the same
zero-post draft workflow. OT09's rigorous Release C review returned `BLOCK` on
2026-11-07: `BLOCK-1` is the unapproved 274-line `src/parser/cloze.js` against
the 250-line new-module cap, and `FIX-1` is a silent partial cloze group when a
cloze row number collides with an ordinary question. The owner authorized `fix`
for both; the 2026-11-07 fix reduced `cloze.js` to 242 lines and refuses a
colliding group instead of dropping its row (parser 2.3.1). The 2026-11-07
re-review closed both findings and recorded `FIX-2` (two cloze groups sharing
numbering silently lose the later group's options) as a new first-round
finding; under the two-round lifecycle it routes to a fix session, not owner
disposition. On 2026-11-07 the owner replaced the `FIX-2` closure criterion with
keep-first deduplication: keep the first evidenced group, drop every later
colliding group as a whole with a warning naming the shared gap numbers, and let
the administrator re-paste the other passage separately. The 2026-11-07 fix
session implemented that rule (parser 2.3.2) with a dedupe in `parsePaste`, and
the closure-focused second re-review returned `PASS` and closed `FIX-2` on
2026-11-08. The immutable review record is unchanged. Phase 10 is review-settled
and included in the 2026-11-08 boundary commit. The owner supplied same-paste
answer keys in `sample-passages.txt` on 2026-11-08: comprehension Q13-Q15 and
cloze Q71-Q80. The comprehension key does not cover Q11-Q12, so OT10 must
confirm final OT08 coverage; the OT09 key is complete. That phase 8 paragraph's
manual-card workflow is now fed by the parser; target-runtime execution remains
OT10. The audit carries forward the archived legacy-writer deployment check as
an OT10 constraint.

## Remaining path to cycle close (consolidated 2026-11-13)

Phase 11 (OT10) is intentionally still open. OT10 is the release package: its
final review must cover everything that ships, so it runs after phase 12 (OT11),
which was carved out of OT10's 2026-11-09 phone check. The phase numbers record
creation order, not execution order. Remaining steps, in order:

1. **Review phase 12 (OT11).** OT11 is done (owner phone re-check accepted
   2026-11-13). Run the rigorous review; any first-round `BLOCK`/`FIX` goes to a
   fix session and a closure re-review until settled.
2. **OT10 external gate (owner decision).** Live `cbt_db.php`, `header.php`,
   `footer.php`, and the `cbt_exam_attempts` DDL are not supplied. The owner
   either supplies them, or records a `defer`/`accept risk` disposition (for
   example, verify at deployment time under the `docs/DEPLOYMENT.md` stop
   conditions). Without one of these, OT10 cannot be marked done.
3. **Finish OT10.** Refresh the handoff against the post-OT11 tip (counts,
   manifest/guide hashes, Q11-Q12 comprehension-key coverage note) and mark it
   done.
4. **Review phase 11 (OT10 final release).** Rigorous review of the full
   release at the post-OT11 tip, then any fix/re-review rounds.
5. **Cycle close** via [`prompts/cycle-close.md`](prompts/cycle-close.md):
   final boundary commit, optional `main` fast-forward, and a separate owner
   archive decision.

New product scope (for example, the mathematics editor) belongs in a new cycle
started after cycle close, not in appended phases of this cycle.

Current workflow stop:

```text
NEXT COMMAND: @docs/plan/prompts/review-session.md review phase 12
```

OT10 is mid-package, not at a clean boundary. The Brave/Android phone check was
performed on 2026-11-09 and passed; its owner-workflow refinements are routed to
OT11 (phase 12). OT11's re-checks found the duplicate-editor workflow defect,
six follow-up requirements, a hidden unsaved cloze editor, and one-character
cloze row drift. The one-editor correction and all follow-up fixes now pass the
full local suites and focused Chromium checks. The owner accepted the final
Brave/Android re-check on 2026-11-13 and requested the checkpoint commit/push;
the independent rigorous review remains pending. OT10 remains
blocked on the independent final review and the live deployment artifacts. The
local PHP/DB/desktop evidence is recorded in the OT10 handoff and
[`../DEPLOYMENT.md`](../DEPLOYMENT.md).

Rigorous reviews use [`prompts/review-session.md`](prompts/review-session.md)
and write immutable records under [`reviews/`](reviews/README.md). A first-round
`BLOCK` or `FIX` requires a fix session and re-review; only a finding that
survives its first re-review requires a recorded owner disposition. The OT07
`FIX-1` fix (2026-11-06) satisfied its frozen closure checklist, and the
closure-focused re-review closed it. The OT09 `BLOCK-1`/`FIX-1` fix is
similarly closed, and the immutable phase-10 re-review's disposition
recommendation for `FIX-2` is superseded on routing by the two-round lifecycle.
The owner's 2026-11-07 requirement change replaced the review's `FIX-2`
refuse-later criterion with keep-first deduplication without altering the review
record; the 2026-11-07 fix applied that rule, and the second re-review settled
`FIX-2` on 2026-11-08. Explicit dispositions follow the finding lifecycle
contract above.

## Session protocol

1. Execute one package per session using
   [`prompts/phase-session.md`](prompts/phase-session.md).
2. Gate 1 is read-only. Resolve status, dependencies, external gates, review
   state, worktree scope, baseline evidence, and the externalize-first plan, then
   wait for explicit `go`.
3. A `blocked` package stops at Gate 1. Do not skip to dependent product work.
4. After `go`, execute only that package and do not preview/start the next one.
5. Add failing evidence before behavior changes where the package requires it.
6. Run every acceptance check. Never mark a package done on partial evidence.
7. Update this table, the active map, current status, package handoff, and
   history where required. Include the externalize-first handoff measurements.
8. Stop after the handoff with `Commit: deferred` and the required exact next
   command.
9. Commit only when the user explicitly asks. Never amend, rebase, force-push,
   or bundle unrelated changes.

## Response contract

Every workflow gate, early stop, handoff, review, fix, and cycle-close response
must end with exactly one final line in this form:

```text
NEXT COMMAND: <exact copy-paste command>
```

Nothing may follow that line. The command must be directly executable or
sendable, not a description or placeholder. Use
`NEXT COMMAND: NONE - <reason>` only when no safe command exists.

## Definition of done

Every package must satisfy all applicable items:

- dependencies and external gates are verified from files/evidence;
- every acceptance row maps to a test, probe, or explicit recorded gap;
- source-backed expectations were not generated from parser output;
- no unrelated or user-owned worktree change was reverted or bundled;
- current-facing docs match implemented behavior;
- package status and active-map status agree;
- the externalize-first Gate 1 plan and handoff measurements are complete, every
  production file is within its limit or has the exact Gate 1 owner approval,
  and each focused module has a verified deployment path;
- tests claimed as executable evidence run the real production modules and
  paths rather than copied SQL, control flow, or behavior;
- handoff records exact files, commands/results, hashes, open questions, review
  status, and deferred commit state;
- required PHP/browser/staging checks are not replaced with assumptions;
- no orphan fixture or failing baseline remains;
- the handoff response ends with the response contract's exact
  `NEXT COMMAND:` line.

## Baseline commands

Before OT00, run the commands available on each source line and report them
separately. After OT00, its handoff defines the authoritative merged baseline.

Current main:

```sh
node tests/runner.js
node tools/extract-bank.js --check
```

Owner-tool integration line adds:

```sh
node tests/unit.js
node tests/owner-tool.js
node tests/context-migration.js
php tests/context-lib.php
php tests/context-admin.php
php tests/context-preflight.php
php tests/php-render.php
```

OT05 wrote the migration, preflight, and rollback artifacts, and the local
static/helper checks pass. OT10 runs the MySQL migration and target-PHP commands
on the user's environment; exact runtime commands are defined from the supplied
DDL and target environment. Do not make OT05 completion depend on those runtime
checks.

## Branch and worktree safety

- Work in the current worktree and keep it on `owner-tool-integration`. For a
  read-only baseline check of another line, use a detached temporary worktree;
  do not switch the working tree to `main` to implement or to refresh a status
  count.
- The old dirty experiments worktree is not present in this clone. Do not
  recreate it or import its uncommitted P20-P22 files.
- Never reset, clean, stash, switch, or rewrite a worktree with unexpected user
  changes. Preserve them unless they directly block the package; then stop and
  ask.
- Live writes require explicit per-action approval. Destructive production
  cleanup is owner-only.

## Completed historical track

P01-P09 are done and retained under `docs/plan/01-*.md` through `09-*.md`.
They are evidence/history, not phases in the active owner-tool cycle. Their
summary and final counts live in [`history.md`](history.md).

## Cycle close

After OT10 and its rigorous review settle, use
[`prompts/cycle-close.md`](prompts/cycle-close.md). Cycle close executes no
package, commits only with explicit authorization, and leaves the cycle active
until the owner separately confirms archival.
