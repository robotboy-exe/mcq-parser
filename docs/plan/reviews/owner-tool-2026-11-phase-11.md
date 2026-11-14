# Rigorous review — owner-tool-2026-11 phase 11 (OT10 final release)

- **Date:** 2026-11-14
- **Mode:** original rigorous review of the release package; read-only session.
- **Scope:** `owner-tool-2026-11` OT10 at `f84518e` plus the eight uncommitted
  documentation edits that constitute the 2026-11-14 handoff refresh. The
  product tree is identical to the independently reviewed phase-12 tip
  `27242fa` (`git diff --numstat 27242fa -- . ':!*.md'` is empty).
- **Verdict:** PASS WITH ACCEPTED FINDINGS (`NOTE-1` to `NOTE-3`; no `BLOCK`,
  no `FIX`).
- **Commit readiness:** the release is commit-ready under the externalize-first
  contract; committing remains owner-authorized and is not part of this review.
- **Review status:** complete. No earlier review record was modified.

## Worktree state (read-only)

`git rev-parse HEAD` = `f84518e245a367688372a9d10abebd58149cea3c` under
`freebuff/bccff37a35da923af591c85f`. Eight modified files, all `*.md`:
`AGENTS.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md`, `docs/STATUS.md`,
`docs/plan/README.md`, `docs/plan/owner-tool/next-steps.md`,
`docs/plan/owner-tool/ot-10-release-and-handoff.md`,
`docs/plan/prompts/phase-map.md` (+155/−87). No unrelated changes, no
untracked files in the tree, no product/test/fixture edits.

Environment constraint: this clone has no local `owner-tool-integration` ref
(only `freebuff-base` and the chat branch), so the review could not fetch or
switch to that branch. It reviewed the checked-out tip without moving any
branch. The phase-12 review recorded `27242fa` as the post-OT11 tip and this
HEAD differs from it only in `*.md`.

PHP was exercised with a standalone PHP 8.3.32 CLI installed for the session
(`$HOME/tools/php83`, non-root, not in the repo). MySQL is not installed, and
no staging site or browser session exists in this environment.

## Commands

```text
git status --porcelain; git rev-parse HEAD
git diff --numstat 27242fa -- . ':!*.md'                      (empty)
git diff --numstat --no-index archive/live-sources/admin_questions-2026-10-31.php deployed/admin_questions.php
git diff --numstat --no-index archive/live-sources/cbt-2026-10-31.php deployed/cbt.php
git diff --numstat --no-index archive/live-sources/answer_details-2026-11-02.php deployed/answer_details.php
git diff --numstat 79a6a57 HEAD -- <12 production files>
sha256sum archive/live-sources/*.php                          (baseline hashes)
node tests/runner.js                60 fixtures, 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  163 PASS
node tests/owner-tool.js            81 PASS
node tests/context-migration.js     14 PASS
node tests/cbt-context.js           5 PASS
node tools/cloze-probe.js           exit 0
node tools/extract-bank.js --check  OK, 7 source/slice/output hashes
php -l                             17/17 PASS on PHP 8.3.32
php tests/context-lib.php           14 PASS
php tests/context-admin.php         23 PASS
php tests/context-preflight.php     6 PASS
php tests/php-render.php            9 PASS
php tests/cbt-candidate.php         7 PASS
per-file wc -l / LF bytes / SHA-256 vs docs/DEPLOYMENT.md §2 (14/14 MATCH)
require/include graph of the three entry points vs the manifest
grep for INSERT/UPDATE/DELETE on `questions`
renderer parity probe (12 vectors, PHP vs JS)
node -e parsePaste(sample-passages.txt).key
```

## Acceptance coverage

| Package acceptance row | Result | Evidence |
|---|---|---|
| Node/fixture suites | PASS | 60 runner / 163 unit / 81 owner-tool / 14 context-migration / 5 cbt-context; `cloze-probe` exit 0; bank extractor 7 hashes |
| PHP lint | PASS | 17 files on PHP 8.3.32 (8 `deployed/*.php`, `db_conn.php`, 3 `tools/context-migration-*.php`, 5 `tests/*.php`) |
| Migration | NOT REPRODUCED HERE | No MySQL server in this environment. The 2026-11-08 record (preflight → forward → rerun → rollback, SQLSTATE 45000 adversarial probes, post-`ALTER` writer contention preserving 400 rows) is internally consistent and applies because no migration or product byte changed after it. See `NOTE-3` |
| Release A | PASS for executable parts | `php-render` 9 vectors, `owner-tool.js` 81 tests exercising the real tool, native PRG/underline/paragraph evidence recorded 2026-11-08; browser probes not re-run (`NOTE-3`) |
| Answer details | PASS | `deployed/answer_details.php` requires `render.php`; renderer vectors and the parity probe cover the formatting/XSS behavior |
| Release B | PASS | context-lib 14, context-admin 23 (real include, real transactions), context-preflight 6, cbt-candidate 7 |
| Release C | PASS | runner includes the comprehension and cloze fixtures; supplied sample parses to 5 comprehension + 10 cloze members and 15 items |
| Security | PASS | renderer probe: attributes, uppercase, encoded markers, script/img payloads, stray and nested markers all stay text; only exact `<u>`/`</u>` are restored; cloze gaps are DOM text nodes with `textContent` |
| Desktop/mobile | NOT REPRODUCED HERE | No staging site/browser in this environment. Owner-accepted Brave/Android re-check 2026-11-13 and desktop Chromium 155 33/33 are recorded and unchanged in product terms (`NOTE-3`) |
| Deployment manifest | PASS | `docs/DEPLOYMENT.md` `d5e1288f…` (190 lines); 14/14 file rows match measured lines/bytes/SHA; upload order accounts for all 12 production files plus the migration import; tokens match the files |
| Maintainability | PASS with `NOTE-1` | Shared renderer and candidate helpers are not duplicated; the architecture map's description of `admin_context.php` is incomplete |
| Live safety | PASS | no live read or write, no production deploy, no cleanup |
| Review | THIS RECORD | OT10 is `done`; the record is settled with three non-blocking notes |

## Externalize-first measurements

### Live-origin production files

Baseline identified from the evidence record, not guessed: OT01 maps
`deployed/admin_questions.php` to `archive/live-sources/admin_questions-2026-10-31.php`
(SHA-256 `b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028`)
and `deployed/cbt.php` to `archive/live-sources/cbt-2026-10-31.php`
(`9ca5f7b4…`). Both hashes match the archived files now. Note that
`archive/live-sources/admin_questions.php` (972 lines) is a different, earlier
evidence capture; measuring against it yields `+195/−102` and would be the
wrong baseline.

| File | Additions/deletions vs baseline | Final lines / LF bytes | SHA-256 (LF) | Limit |
|---|---|---:|---|---|
| `deployed/admin_questions.php` | +100 / −81 | 1065 / 62892 | `7ec150d924cb834627745ac4d9c8f989276421e6ce36dc77b6b8081bf76817cb` | at the 100 cap, no exception needed |
| `deployed/cbt.php` | +53 / −89 | 1008 / 44515 | `697407e6022ce9f543a271664f69bc27816b52170389c0381544aa2b170b2de9` | within |
| `deployed/answer_details.php` | +2 / −1 | 251 / 12157 | `b796fc097c0b6651590116e37d38c1d5c0632073f351a696fc40a7c8932d955c` | within |

An addition count of exactly 100 is within "must not exceed 100"; no owner
exception exists and none is required.

### Phase-cycle production modules (base `79a6a57`)

| File | Δ | Final lines / LF bytes | SHA-256 (LF) | Responsibility | Deployment inclusion | Direct production-path test |
|---|---|---|---:|---|---|---|
| `deployed/admin_context.php` | +211 / −48 | 996 / 46688 | `0c5e1b83…` | admin context request dispatch, context CRUD, ordinary question insert/update/delete, question-link mutations, management rendering, owner payloads | site root; required by `admin_questions.php:7` | `php tests/context-admin.php` (23; requires the real include and drives `cbt_admin_mutate_question`/`cbt_admin_delete_question`); `php -l` |
| `deployed/context_lib.php` | +34 / −9 | 505 / 20353 | `0b1051a9…` | side-effect-free validation/queries | site root; required by `admin_context.php:4` | `php tests/context-lib.php` (14) |
| `deployed/admin_questions.php` | +7 / −6 | see above | `7ec150d9…` | entry point: session/CSRF, login, native form, PRG dispatch, include and asset wiring, 0 SQL writes | site root | `node tests/owner-tool.js` (reads the real file for asset order/markup); `php -l` |
| `deployed/cbt.php` | +2 / −2 | see above | `697407e6…` | candidate setup, complete-group delivery, exam UI, attempt recording | site root | `node tests/cbt-context.js` (5); `node tests/owner-tool.js` asset checks; `php -l` |
| `src/parser/core.js` | +9 / −3 | 1432 / 49296 | `1321d95f…` | pure parser 2.3.3 | site root `src/parser/` | runner 60, unit 163 |
| `src/owner-tool/owner-tool.js` | +1231 / −278 | 2566 / 106477 | `c8f86b8f…` | state, merged native context editor, controller | site root `src/owner-tool/` | `node tests/owner-tool.js` (81; evaluates the real file in `vm`) |
| `src/owner-tool/owner-tool.css` | +85 / −51 | 291 / 4606 | `405a7692…` | owner/context/CBT styles | site root `src/owner-tool/` | `node tests/owner-tool.js` style assertions |
| `src/owner-tool/render.js` | unchanged since base | 209 / 6339 | `008325f4…` | shared client renderer and context cards | site root `src/owner-tool/` | `node tests/owner-tool.js`; parity probe |
| `deployed/render.php` | unchanged since base | 78 / 2447 | `205af869…` | server safe renderer | site root | `php tests/php-render.php` (9) + parity probe |
| `deployed/cbt_candidate.php` | unchanged since base | 423 / 16714 | `8d1383ef…` | complete-group candidate selection/repository | site root | `php tests/cbt-candidate.php` (7) |
| `deployed/sql/01-context-migration.sql` | unchanged since base | 250 / 17870 | `e963b739…` | rerunnable forward migration | ops directory | `node tests/context-migration.js` (14 static contract probes); execution deferred to deployment |
| `deployed/sql/02-context-rollback.sql` (ops) | unchanged since base | 64 / 2512 | `047e1100…` | guarded, non-destructive rollback | ops directory | same static probes; execution deferred |
| `deployed/sql/README.md` (ops) | new | 172 / 8065 | `7f474ffe…` | migration/rollback runbook | ops directory | documentation; no executable path (recorded gap) |

Entry points stay narrow: `admin_questions.php` contains no `INSERT`/`UPDATE`/
`DELETE` and dispatches through `cbt_admin_handle_context_request`,
`cbt_admin_mutate_question`, `cbt_admin_delete_question`, and
`cbt_admin_owner_payload_scripts`; `cbt.php` calls `cbt_candidate_delivery` and
its only write is the attempt record; `answer_details.php` only renders.
Shared helpers are single-sourced: group selection exists only in
`cbt_candidate.php`; the renderer pair is intentional server/client parity.

## Adversarial probe (package boundary: "only exact underline markup renders", server and client)

Twelve vectors through the real `deployed/render.php` and
`src/owner-tool/render.js`: plain text; `<u>under</u>`; uppercase `<U>`;
`<u class="x">`; encoded `&lt;u&gt;`; `<script>`; `<img onerror>`;
unterminated `<u>`; stray `</u>`; two adjacent underlined spans; nested
`<u><u>x</u></u>`; and multibyte `café —` inside markers.

Both implementations produced byte-identical HTML for every vector: only the
exact lowercase markers became tags, everything else (including attributes,
uppercase tags, encoded markers, unterminated opens, stray closes, and the
inner marker of a nest) was escaped as text, and `strip()` matches on all
vectors. The client `render()` path builds text nodes and `<u>` elements only,
and cloze gaps use `textContent`. No injection vector was found. The probe also
confirms the documented server/client pairing claim rather than trusting it.

## Supplied-sample coverage

`node -e parsePaste(sample-passages.txt)` returns
`key = {"11":"B","12":"C","13":"D","14":"B","15":"A","71":"A" … "80":"D"}`, two
contexts (`comprehension` expectedCount 5, `cloze` expectedCount 10) and 15
items. The owner-confirmed revised comprehension key Q11-Q15 is covered; the
handoff's coverage note is accurate.

## Findings

### `NOTE-1` — architecture map understates `admin_context.php`

`docs/DEVELOPER-GUIDE.md:15` describes the module as "context request handling,
context CRUD/question-link mutations, paginated management rendering, and
read-only owner payloads", and `docs/DEPLOYMENT.md:60` similarly as "context
handling/mutations …". The module also owns the ordinary question writer:
`cbt_admin_mutate_question` (`deployed/admin_context.php:625`, SQL at `:680`
and `:694`) and `cbt_admin_delete_question` (`:720`, SQL at `:742`), exercised
by `tests/context-admin.php:562-642`. The externalize-first handoff requires a
per-file responsibility statement, so the statement should name the question
insert/update/delete path. Non-blocking: behavior, deployment inclusion, and
tests are correct; only the maintenance map is incomplete.

### `NOTE-2` — `cbt_admin_config.php` is missing from the deployment prerequisites

`docs/DEPLOYMENT.md:17` requires the deployer to confirm `cbt_db.php`,
`header.php`, `footer.php`, and `cbt_exam_attempts`, and `:164` repeats that as
a stop condition, but `admin_questions.php:307` also loads
`cbt_admin_config.php` (or `CBT_ADMIN_USERNAME`/`CBT_ADMIN_PASSWORD_HASH`).
`:19` mentions the file only to forbid deploying the local shim. The page fails
safe with the explicit "Admin access has not been configured" message
(`:752`), and the live admin page already runs with a configured file, so this
is a checklist gap rather than a data or security risk. Recommended: add
"`cbt_admin_config.php` (or the two environment variables)" to §1 item 2 and
§7.

### `NOTE-3` — migration/rollback and browser matrix are recorded, not reproduced

This environment has no MySQL server and no staging site or browser, so the
migration preflight/forward/rerun/rollback probes and the desktop/Brave phone
checks could not be re-executed. The recorded evidence (2026-11-08 migration
session; desktop Chromium 155 33/33; owner-accepted Brave/Android re-check
2026-11-13) is complete and internally consistent, and the product and
migration files are byte-identical to the phase-12 tip that review examined.
Residual risk is therefore unchanged and is already assigned to the
deployment-time stop conditions in `docs/DEPLOYMENT.md` §7. No acceptance claim
was accepted on the reviewer's assertion; the gap is recorded here.

No `BLOCK` and no `FIX` were found. No finding is unresolved in a way that
blocks commit readiness.

## Approvals and excluded artifacts

- **Approvals:** no limit exception exists or is needed (`admin_questions.php`
  is exactly at +100). The owner deferred the live artifacts on 2026-11-14 and
  accepted the final Brave/Android re-check on 2026-11-13.
- **Excluded artifacts (not deployment files):** `sample-passages.txt`,
  `new-sample.txt`, `session-ses_e35a.md`, the `sample-cloze-left-drift`
  fixture and spec, `tools/phone-staging/` (including its SQLite `cbt_db.php`
  shim and start/stop scripts), the untracked `deployed/cbt_db.php` and
  `deployed/cbt_admin_config.php` (absent from this worktree),
  `deployed/sql/base-schema.working.sql`, `tools/context-migration-*.php`, the
  local staging tree/database/Chromium profiles, the session's `/tmp` probe
  script, and this review record.
- **Unrelated worktree changes:** none. The eight modified files are the OT10
  handoff refresh under review; they are documentation only.

## Exact recommended next action

The release review is settled with non-blocking notes; `NOTE-1`/`NOTE-2` may be
corrected in a later non-review session, and `NOTE-3` is already assigned to the
deployment gate. The cycle can close: run cycle close, which is read-only at
Gate 1 and commits only with explicit authorization.

```text
NEXT COMMAND: @docs/plan/prompts/cycle-close.md
```
