# Phase 4 Review — EL01 English Lexis Subject and Constant-Text Grouping

- **Date:** 2026-11-17
- **Reviewer:** independent review session
- **Scope:** original rigorous review of phase 4 / `EL01`, complete package
  acceptance and production boundary
- **Package:** [`el-01-english-lexis-grouping.md`](../el-01-english-lexis-grouping.md)
- **Coordinator:** [`plan/README.md`](../README.md); map:
  [`prompts/phase-map.md`](../prompts/phase-map.md)
- **Prior records:** none for phase 4. The phase-1/2/3 records were read for
  conventions and settled context; none was modified.
- **Reviewed state:** `HEAD` `3f5d2eaa941333dfc2b9ffad5027951f090aee7e`
  (`fix: render custom fractions as fraction glyphs`) on
  `owner-tool-integration`, plus the dirty EL01 worktree and the pre-existing
  owner changes the handoff names. `HEAD` and the remote tracking branch were
  equal at the start. This session moved no branch, staged nothing, committed
  nothing, and wrote only this record.
- **Mode:** original review, exploratory across the package acceptance and the
  production boundary. No frozen fix contract existed for this package, so
  nothing was closed or reopened.
- **Naming:** the active cycle's records use
  `math-editor-2026-11-phase-N.md` (phase 1–3); the older
  `owner-tool-2026-11-phase-N.md` template in the reviews README is stale for
  this cycle.

## 1. Authority and package claims

The map resolves phase 4 to `EL01`. The package asks for a rerunnable exact-name
subject operation and rollback, a focused post-selection ordering helper, real
module/wiring and disposable HTTP staging evidence, a real MySQL 8.0.41
operation run, invariant/edge-case updates, deployment/runbook updates, and this
review.

Coordinator, status, and package agree that ST01, ME01, and ME02 are
review-settled and that the owner accepted ME02's Brave/Android check on
2026-11-17. EL01's implementation, all acceptance evidence, and the real
8-check MySQL 8.0.41 run are recorded as passing; the holistic review was the
only remaining step.

The handoff's central measurements are accurate: the `cbt.php` EL01 delta is
+5/−0 on the reconstructed package base, the final file is 1068 lines / 45755
bytes, the live-origin delta is +59/−35 (under the +60 cap), the helper is 56
lines, the manifest is 18/18, and the ordering/staging/MySQL harnesses reproduce.

The handoff has four documentation/scope defects, recorded as `NOTE-1` to
`NOTE-4`; none is a product defect, unmet acceptance row, guardrail breach, or
unsafe supported path.

## 2. Repository and change scope

```text
git rev-parse HEAD                                        3f5d2eaa941333dfc2b9ffad5027951f090aee7e
git branch --show-current                                 owner-tool-integration
git status -sb                                            clean tracking line, then the EL01 dirty set
git diff --check                                          clean
```

The worktree is dirty by design. The EL01-related changes are the new helper,
the two SQL operations, the SQL README, the three test/tool files, the
`cbt.php` wiring, and the current-facing docs. The pre-existing owner work is
`INTENT.md`, the candidate-phone/email removal inside `cbt.php`, and the
staging-shim correction (`tools/phone-staging/cbt_db.php` plus the untracked
`header.php`/`footer.php`). The owner update at
`el-01-english-lexis-grouping.md:257-260` confirms those dirty files were
requested extra work; this review did not attribute them to EL01.

**Package base reconstruction.** Removing the single
`require_once __DIR__ . '/cbt_question_order.php';` line and the four-line
`cbt_order_selected_questions(...)` call from the current file leaves:

```text
$HOME/tmp/el01-review/cbt-base.php   1063 lines / 45512 bytes
SHA-256                              560318c6c1d022e681b1d081f5d58dc2ec15e1152821c38ba805e72bac75817c
git diff --no-index --numstat base deployed/cbt.php    5  0
deployed/cbt.php                     1068 lines / 45755 bytes
SHA-256                              5bdc353273b391a64634d46732dd3ea859ad215c5d7d62ac3878346876704e2a
```

The `HEAD` diff for `deployed/cbt.php` is +10/−27; the extra changes are the
pre-existing candidate-phone/email removal, not EL01. The package-base diff is
the authoritative EL01 measurement.

**Live origin.**

```text
archive/live-sources/cbt-2026-10-31.php   1044 lines / 45990 bytes
git diff --no-index --numstat live deployed/cbt.php    59  35
```

+59 additions is within the Gate 1 +60 cap. No approval or exception exists or
is needed. The helper's readable line count is 56, under the 70-line module
ceiling.

**Per-file measurements, responsibility, and deployment path.**

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and production-path evidence |
|---|---:|---:|---|---|---|
| `deployed/cbt.php` | +5 / −0 | 1068 / 45755 | `5bdc3532…` | narrow wiring only: one `require_once` (line 4) and one post-`fetchAll()` call (lines 184-187) | site root; manifest row; `php tests/cbt-question-order.php` reads the real file; `php tests/cbt-staging.php` renders it over HTTP |
| `deployed/cbt_question_order.php` | new | 56 / 1444 | `5c0a9b8c…` | exact-subject post-selection grouping; ascending `id` inside a group; blank singletons | site root beside `cbt.php`; required by the real `cbt.php`; 11-check module/wiring suite |
| `deployed/sql/03-english-lexis-structure.sql` | new | 82 / 2728 | `b7653537…` | guarded exact-name insert/reactivation; generated ID; no deletes | ops directory; manifest row; 8-check MySQL 8.0.41 harness |
| `deployed/sql/04-english-lexis-structure-rollback.sql` | new | 69 / 2204 | `519021bc…` | exact-name deactivation only; no deletes | ops directory; manifest row; 8-check MySQL 8.0.41 harness |
| `deployed/sql/README.md` | modified | 125 / 5103 | `1f731a66…` | schema and subject-operation runbook | ops directory; not loaded at runtime |
| `tests/cbt-question-order.php` | new | 260 / 8836 | `6a11546b…` | real-module ordering and real-`cbt.php` wiring | not deployed; 11/11 PASS |
| `tests/cbt-staging.php` | new | 203 / 7077 | `b4c0ad43…` | disposable HTTP staging path | not deployed; 6/6 PASS |
| `tests/english-lexis-sql.sh` | new | 146 / 6478 | `2bb96850…` | disposable MySQL 8.0.41 operation harness | not deployed; 8/8 PASS |
| `tools/start-phone-staging.sh` | modified | 100 / 3848 | `0cd8770b…` | staging copy-list addition | not deployed; used to reproduce the 6-check run |
| `AGENTS.md` | +4 / −3 | 67 / 10483 | `92f01c0d…` | project instruction counts and staging note | not deployed |
| `tools/phone-staging/cbt_db.php` | +13 / −0 vs `HEAD` | 135 / 5096 | — | pre-existing staging schema shim; required by the 6-check run | not deployed; classified in `NOTE-4` |
| `tools/phone-staging/header.php` | new | 8 / 277 | — | pre-existing staging viewport shim | not deployed; classified in `NOTE-4` |
| `tools/phone-staging/footer.php` | new | 2 / 16 | — | pre-existing staging footer shim | not deployed; classified in `NOTE-4` |

Docs changed in EL01 scope (measurements from the worktree):
`docs/AGENTS.md` 317/24497, `docs/SPEC.md` 776/44839, `docs/DECISIONS.md`
1602/90413, `docs/INVARIANTS.md` 241/50621, `docs/EDGE_CASES.md` 282/44856,
`docs/DEPLOYMENT.md` 266/20002, `docs/DEVELOPER-GUIDE.md` 269/16275,
`docs/STATUS.md` 240/26034, `docs/plan/README.md` 392/22053,
`docs/plan/prompts/phase-map.md` 24/887, the ME01/ME02 records, and the EL01
package 304/16167. `INTENT.md` 86/4699 was pre-existing owner work.

## 3. Acceptance coverage

### Baseline and static checks

```text
node tests/runner.js                 PASS 60 / FAIL 0 / PENDING 0
node tests/unit.js                   PASS 163 / FAIL 0
node tests/ocr-helper.js             PASS 11
node tests/underline-toolbar.js      PASS 10
node tests/question-preview.js       PASS 4
node tests/math-tool.js              PASS 20
node tools/extract-bank.js --check   OK (source, anchors, counts, 7 output hashes)
php tests/php-render.php             PASS 9
php tests/admin-question-store.php   PASS 8
php tests/cbt-question-order.php     PASS 11 / FAIL 0
bash -n tests/english-lexis-sql.sh tools/start-phone-staging.sh   OK
php -l deployed/*.php tests/cbt-question-order.php tests/cbt-staging.php \
       tools/phone-staging/{cbt_db,header,footer}.php              OK
git diff --check                     clean
```

No fixture is orphaned and no baseline changed.

### Ordering and production wiring — 11/11

```text
php tests/cbt-question-order.php
```

The real module and the real `deployed/cbt.php` are required. The eleven checks
cover: group shuffling with member order preserved; ascending-`id` restoration
after random rows; exact trusted-name activation; case/whitespace/line-break/
underline-marker separation; `NULL`/empty singletons; no add/drop/mutate;
50/60/100-row and 55-row-group scale; production shuffle contiguity; the real
include/call ordering; the preserved filters/`ORDER BY RAND()`/limit/trusted
name source; and per-row Constant Text rendering with `cbt_practice.php`
isolation.

### Disposable HTTP staging — 6/6

```text
OCR_PHONE_STAGING_TMP="$HOME/tmp/el01-review" OCR_PHONE_STAGING_PORT=3007 \
  OCR_PHONE_STAGING_HOST=127.0.0.1 bash tools/start-phone-staging.sh
curl -s -o /dev/null http://127.0.0.1:3007/cbt.php
EL01_STAGING_DB="$HOME/tmp/el01-review/ocr-phone-staging.sqlite" \
  EL01_STAGING_URL="http://127.0.0.1:3007" php tests/cbt-staging.php
```

Result: `PASS: 6`, `FAIL: 0`. The checks cover the existing default 50 limit,
the active subject/category/year filters, no row mutation, contiguous repeated
passages in the embedded array, exactly one attempt inserted with the current
candidate fields, and the trusted subject plus safe per-question Constant Text
rendering. The server was stopped by PID after the run.

### Real SQL operations — 8/8 on Oracle MySQL 8.0.41

```text
EL01_DISPOSABLE_MYSQL=1 MYSQL_BIN=mysql MYSQL_HOST=127.0.0.1 \
  MYSQL_PORT=3307 MYSQL_USER=root bash tests/english-lexis-sql.sh
```

Result: `PASS: 8 SQL operation checks on 8.0.41`. The server was an isolated
Oracle MySQL Community Server 8.0.41 ARM64 instance (disposable proot Ubuntu
rootfs, port 3307, socket `/root/el01-mysql8041.sock`). The checks cover:
generated active ID for an absent target; forward rerun; rollback and rerun
without deletes; inactive-row reactivation preserving fields; active-row
reruns; forward and rollback collation-collision refusal; and forward
missing-unique-name refusal. The server was shut down with `SHUTDOWN;` and the
port was closed; the databases were dropped.

### Manifest and deployment boundary

The deployment manifest is **18/18** exact: every hash-bearing row in
`docs/DEPLOYMENT.md` matches the current line count, UTF-8 byte count, and
SHA-256. The new module is included by `cbt.php`; both SQL files are in the ops
directory; `cbt_practice.php` is unchanged and does not include the helper. The
production subject operation still needs the deployment backup, target-contract
preflight, and explicit owner authorization; this review ran only disposable
databases and made no live write, migration, deploy, or cleanup.

## 4. Independent adversarial probes

**Probe A — trailing-space collation collision.** Loaded the working schema,
inserted `English (Lexis & Structure) ` (trailing space), and ran both
operations. `03` refused with
`English Lexis operation refused: a collation-equivalent byte-different subject exists`
(exit 1); `04` refused with the rollback equivalent (exit 1). The row remained
active and byte-exact. This is a boundary the supplied harness does not assert;
it passes.

**Probe B — rollback with no unique-name index.** Created the unique-index
contract, inserted the exact active row, dropped `uq_subjects_subject_name`, and
ran `04`. It refused
`English Lexis rollback refused: subjects requires a single-column unique subject_name index.`
(exit 1) and left the row active. The rollback's unique-name guard is real, not
only the forward guard.

**Probe C — rollback with no auto-increment ID.** Loaded the schema, changed
`subjects.id` to `int UNSIGNED NOT NULL` without `AUTO_INCREMENT`, inserted the
exact active row, and ran both operations. `03` refused
`English Lexis operation refused: subjects requires an auto-increment id and a single-column unique subject_name index.`
(exit 1); `04` did **not** refuse and deactivated the row (exit 0). This is the
evidence for `NOTE-1`.

**Probe D — grouping boundary values.** Called the real helper with
`'0'`, `'00'`, `' '`, `'text:A'`, `NULL`, `''`, and `'A'`, with string and
integer IDs, and with a near-name subject (`'English (Lexis & Structure) '`).
Distinct non-empty exact values stayed separate; `NULL`/`''` stayed singletons;
members sorted ascending by `id`; every row field was preserved; the near-name
subject returned the input unchanged and no shuffle callback ran. Pass.

**Probe E — result-sheet alignment after grouping.** Inspected the rendered
path. `$questionsForBrowser` is built from the already-grouped `$dbQuestions`,
and the client answer map, option rendering, scoring loop, result rows, and
`answer_details.php?id=` all use that same array and each row's `id`. Grouping
does not shift answers or the correct-option index. No browser result-sheet
automation exists, so this is code-path inspection, not a new browser test.

## 5. Contract and documentation consistency

The production wiring is narrow: one include and one call, both inside the
attempt branch after the existing filtered/random/limited fetch and before the
attempt insert. The query, `ORDER BY RAND()`, the 60/50 limit, the selected ID
set, and `cbt_practice.php` are unchanged. The helper has one responsibility,
uses the trusted database subject name (not request input), compares Constant
Text byte-exactly, and never writes storage or the database.

The four findings below are documentation/scope issues. They do not invalidate
the package or change its code, tests, or measured evidence.

### `NOTE-1` — D-95/INV-142 overstate the rollback ID contract

- **Evidence.** `docs/DECISIONS.md:1567-1569` says "Both operations require the
  auto-increment ID and single-column unique `subject_name` contracts".
  `docs/INVARIANTS.md:211` (INV-142) says the operations refuse an "incompatible
  ID/unique-name contract". `deployed/sql/03-english-lexis-structure.sql:13-38`
  checks both contracts. `deployed/sql/04-english-lexis-structure-rollback.sql:9-31`
  checks only the unique-name index; it has no `id_contract_rows` query. On the
  disposable MySQL 8.0.41 server, a non-auto-increment `subjects.id` made `03`
  refuse but `04` deactivate the exact row (Probe C).
- **Why it matters.** The rollback never inserts a row and never omits an ID;
  its safety depends on the unique-name and collation guards. The missing ID
  guard is therefore not a rollback safety defect, but the decision text and the
  invariant claim a refusal the implementation does not provide. A reader can
  reasonably expect `04` to stop on that schema.
- **Requested correction (docs/decision preferred).** Either narrow D-95 and
  INV-142 to the forward operation (and clarify that `04` requires the
  unique-name/collation contract only), or, if the owner intends the rollback to
  require the ID contract too, add the same `id_contract_rows` check to `04` and
  a harness case. Only the owner may change the requirement; a code change
  without an owner decision would broaden the package.
- **Non-goals.** No change to `03`, the deactivation behavior, the selected
  subject, or the 8-check result. No product change in this review.

### `NOTE-2` — Current-facing docs still say 10 ordering/wiring checks

- **Evidence.** The fix made the real-module/wiring suite 11 checks
  (`tests/cbt-question-order.php`; `docs/DEVELOPER-GUIDE.md:198`;
  `AGENTS.md:29`; `docs/INVARIANTS.md:212`). `docs/DEPLOYMENT.md:251` still says
  "EL01 adds 10 real-module/wiring checks"; `docs/plan/README.md:264` still says
  "10 module/wiring checks". The package's production table at
  `el-01-english-lexis-grouping.md:161` also says "10-check", and its older
  evidence block says 10 PASS, but the fix note at `:296` explicitly labels
  those earlier counts historical and records 11 as current.
- **Why it matters.** The current deployment/runbook reader sees a count that no
  longer matches the suite. The package's historical block is covered by the fix
  note; the two current-facing docs are not.
- **Requested correction (docs only).** Change the current-facing counts at
  `docs/DEPLOYMENT.md:251` and `docs/plan/README.md:264` to 11. Leave the
  dated historical 10 PASS logs as historical. No code, test, or measurement
  change.
- **Non-goals.** No test edit to force a 10-check count.

### `NOTE-3` — Handoff evidence hash for the ordering test is stale

- **Evidence.** `docs/plan/el-01-english-lexis-grouping.md:236-237` records
  `tests/cbt-question-order.php` as
  `10140174ec7b47b3b4414c9f730887cac2a23ee50c9a052f92f395756045be4e`. The
  current file is 260 lines / 8836 bytes with SHA-256
  `6a11546b0b0579f4fce51b2a3e69e31b97236f8536868d08446b5a5c1e8209f2`. The fix
  note at `:291-297` updates the module hash and the 11 count but not this test
  hash.
- **Why it matters.** The evidence block is the copy-paste provenance record for
  the exact test that produced the 11-check result. A stale hash prevents a
  reader from tying the recorded result to the reviewed file.
- **Requested correction (docs only).** Replace the test hash with
  `6a11546b…` and, if the block is retained as current evidence, update its count
  to 11; otherwise label the block historical. No test or product change.
- **Non-goals.** No test rewrite and no re-run needed for the correction.

### `NOTE-4` — Staging-shim files are not classified in the handoff

- **Evidence.** `git status --porcelain` shows `M tools/phone-staging/cbt_db.php`,
  `?? tools/phone-staging/header.php`, and `?? tools/phone-staging/footer.php`.
  `tools/start-phone-staging.sh` copies the shim set, and the 6-check
  `tests/cbt-staging.php` run needs the resulting page. The handoff's
  "Excluded artifacts" (`el-01-english-lexis-grouping.md:224-233`) and "Files
  changed by EL01" (`:247-253`) lists do not name these three files. The owner
  update at `:257-260` says the pre-existing dirty files were requested extra
  work.
- **Why it matters.** The staging evidence is reproducible in this worktree, but
  a phase-boundary commit that includes only the listed EL01 files would omit
  the shims the 6-check harness depends on. Conversely, bundling them silently
  would mix owner work into EL01. The commit scope needs an explicit decision.
- **Requested correction (scope/docs).** Name the three paths, classify them as
  pre-existing owner staging work outside EL01's product scope, and state
  whether the phase-4 commit includes them as authorized staging correction or
  leaves them for a separate owner commit. Do not silently bundle unrelated
  work.
- **Non-goals.** No product change, no staging rewrite, and no live write.

## 6. Verdict and next action

**PASS WITH ACCEPTED FINDINGS** — no `BLOCK`, no `FIX`; `NOTE-1` to `NOTE-4`.

- The package's acceptance rows reproduce: the 11 ordering/wiring checks, 6
  staging checks, 8 real SQL checks on MySQL 8.0.41, 18/18 manifest, all
  baselines, lint, syntax, and the live-origin +59/+60 boundary. The narrow
  wiring, the helper's single responsibility, the trusted-name activation, the
  ascending-`id` member restore, the blank singletons, and the exact Constant
  Text comparison are all present.
- **Commit readiness:** review-clean for EL01's product scope. The four findings
  are documentation/scope-only. Before the phase-boundary commit, record
  `NOTE-4`'s staging-shim classification and correct `NOTE-2`/`NOTE-3`; these do
  not require a fix session, and `NOTE-1` may be handled as a docs/decision
  correction or owner disposition. No live write, migration, deploy, or cleanup
  was performed.
- **Review status:** complete for the package acceptance and production
  boundary. The coordinator's phase-4 row and "holistic review next" text still
  need the normal post-review status update; this session wrote only this
  record.
- **Recommended next action:** commit the phase-4 boundary, then run cycle close
  with the owner's explicit authorization. The commit session must resolve the
  `NOTE-4` staging-shim scope and may fold in the docs-only corrections; cycle
  close still needs its own `go`.

NEXT COMMAND: Commit the phase-4 boundary, then run @docs/plan/prompts/cycle-close.md
