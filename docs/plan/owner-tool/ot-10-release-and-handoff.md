# OT10 — Release and Handoff

- **Status:** open (ready to finish): local PHP/DB/desktop checks pass;
  Brave/Android phone check passed 2026-11-09; live-artifact gate deferred to
  deployment time by the owner 2026-11-14; handoff refresh and final rigorous
  review pending
- **Depends on:** OT09 and its settled rigorous review
- **Blocks:** cycle close
- **External gate:** live `cbt_db.php`, `header.php`, `footer.php`, and
  `cbt_exam_attempts` (owner disposition 2026-11-14: `defer` to deployment time;
  verify under the `docs/DEPLOYMENT.md` stop conditions, including the
  `utf8mb4_unicode_ci` session-collation prerequisite, since the supplied
  `db_conn.php` sets `charset=utf8mb4` only); independent final review. The Brave/Android phone check
  passed on 2026-11-09; the owner accepted OT11's expanded follow-up and latest
  cloze/save-flow fixes in the final phone re-check on 2026-11-13.
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Audit the complete owner-tool/context release, prove its migration and rollback
on production-shaped local data, verify the supported browsers, and produce a
concise human-developer deployment and maintenance handoff.

OT05 wrote the migration, preflight, and rollback artifacts. This package
executes and proves them on the target runtime. Do not make OT05 completion
depend on PHP, migration, or staging checks owned here.

## Work

1. Audit every changed PHP/JS/CSS/SQL file for readability, duplication, dead
   bookmarklet/Auto-Save code, stable selectors, and narrowly scoped comments.
2. Run all Node parser/UI tests, fixture runner, bank extractor, link checks,
   syntax checks, and security/adversarial probes.
3. On the local PHP machine, run `php -l` on every PHP file and apply migration
   preflight/forward/rerun/rollback tests against a disposable production-shaped
   DB. Include wrong connection collation, wrong column type, extra/trailing,
   wrongly ordered, or descending indexes, unexpected enforced checks,
   extra/cascading FKs, position-only data, slot-only data, rollback writer
   contention across the `ALTER TABLE` lock-release/reacquisition boundary under
   the required maintenance freeze, and two-connection context/question mutation
   vectors.
4. Verify OT04's supplied-detail integration and Release A behavior
   independently: owner tool, native PRG, underline, paragraphs, result/detail
   rendering, and legacy-state warning.
5. Verify Release B behavior independently: context CRUD, activation safety,
   complete-group random selection in `cbt.php`, and rollback hiding. Do not add
   `cbt_practice.php` or `practice_title` to the release gate.
6. Verify Release C behavior independently: singular/multiple comprehension,
   cloze, standalone mixing, same-paste key, ambiguity fallback, and zero
   automatic writes.
7. Run desktop Chromium and Brave/Android checks on staging, including a context
   textarea whose stored value starts with LF; record exact browser versions,
   fixtures, and outcomes.
8. Prepare a deployment manifest with upload order, file hashes, DB backup,
   migration command, smoke checks, cache-busting step, rollback order, and
   explicit stop conditions.
9. Prepare the human-developer guide: architecture map, source of truth, state
   schema, parser extension rules, context lifecycle, security renderer,
   testing commands, and known limitations.
10. Update current docs, status, decisions D-66+, invariants, edge cases, and
    plan history. Mark legacy bookmarklet docs historical without deleting
    evidence.
11. Run an independent final review; do not deploy to production or clean live
    data as part of this package.

## Acceptance

| Check | Expected |
|---|---|
| Node/fixture suites | All PASS; exact counts recorded |
| PHP lint | Every PHP file passes on target PHP version |
| Migration | Preflight, forward, rerun behavior, backup, and rollback proven |
| Release A | Independent acceptance complete |
| Answer details | Supplied page uses the shared safe renderer and passes formatting/XSS probes |
| Release B | Independent acceptance complete |
| Release C | Independent acceptance complete |
| Security | Stored-XSS probes remain text; only exact underline/gap markup renders |
| Desktop/mobile | Chromium and Brave/Android staging checks pass |
| Deployment manifest | Exact files, hashes, order, smoke, and rollback documented |
| Maintainability | Shared helpers documented; no duplicated group-selection/renderer logic |
| Live safety | No destructive production action; cleanup remains owner-only |
| Review | Rigorous OT10 record settled before cycle close |

## Guardrails

- Do not deploy production from this package without a separate explicit owner
  instruction.
- Do not run migration first on production.
- Do not delete production questions, contexts, media, or users.
- Do not mark acceptance complete when a required local/staging/browser check
  was skipped.
- Do not replace the archived supplied `answer_details.php` or close Release A
  without testing its OT04 deployed integration.
- Do not archive or close the cycle automatically.

## Handoff template

```text
Date:
Result:
Node/fixture/PHP results:
Migration/rollback evidence:
Release A/B/C acceptance:
Deferred source integrations:
Desktop/mobile staging evidence:
Security evidence:
Deployment manifest path/hash:
Developer guide path/hash:
Files changed:
Open questions/known limits:
Review: pending rigorous final review
Commit: deferred
Next: cycle close only after settled review and explicit authorization
```

## Handoff

Date: 2026-11-08
Result: blocked — local release proof and all owner Brave/Android checks pass;
independent final review and live deployment artifacts remain open.

Node/fixture/PHP results: runner 59 PASS / 0 PENDING; unit 162; owner-tool 53;
context-migration 14; cbt-context 5; context-lib 13; context-admin 19;
context-preflight 6; php-render 9; cbt-candidate 7; `php -l` 10 files PASS;
`node --check` 15 files PASS; `cloze-probe` exit 0. `extract-bank --check` exits
1 at the known Windows/CRLF `bank-pre-2026` mismatch (pre-existing).

Migration/rollback evidence: on a disposable production-shaped MySQL 8.0.41
database, preflight `not applied (ready)` → forward → `already applied (rerun
safe)`; rerun no-op; adversarial extra CHECK, wrong `context_id` type, extra FK,
cascading FK, descending index, extra context index, wrong `title` type, and
extra context column all exit 1 SQLSTATE 45000; rollback guards refuse
context/position-only/slot-only rows; empty rollback exit 0; post-rollback
preflight `not applied (ready)`. Post-`ALTER` writer-contention probe (30k
questions, background `cbt_writer_loop`) exited 1 with `Rollback refused:
context data appeared during rollback; the context table was preserved.` and
preserved 400 context rows.

Release A/B/C acceptance: desktop Chromium 155.0.8059.40 local harness 33/33
PASS — admin login + owner tool; comprehension context card/passage/options/
correct tick/no auto-write; underline + `\n\n` preserved in form and preview;
metadata mapping; native PRG flash `Question saved successfully (Question ID:
103).` +1 row; edit page `#owner_format_tool`; cloze context card; answer-details
XSS (no `window.__xss`, exact `<u>`, escaped script/img, explanation plain);
CBT setup AJAX options; CBT complete context group, title, passage, total 4,
attempt recorded.

Deferred source integrations: live `cbt_db.php`, `header.php`, `footer.php`, and
`cbt_exam_attempts` are not supplied. The local smoke used test-only
`deployed/cbt_db.php`, `deployed/cbt_admin_config.php`, and an inferred
`cbt_exam_attempts` table; do not deploy them. `cbt_practice.php` and
`practice_title` remain outside scope.

Desktop/mobile staging evidence: desktop Chromium 155.0.8059.40 PASS 33/33.
Brave/Android phone check executed 2026-11-09; passed. It surfaced three
owner-workflow refinements, routed to OT11. A later phone session recorded six
additional workflow requirements; the 2026-11-12 no-tab consolidation and full
local suites pass. The final placement/edit-isolation follow-up passes focused
desktop and 390px Chromium without a write; the owner accepted the final
Brave/Android re-check on 2026-11-13.

Security evidence: PHP 8.3.16 `tests/php-render.php` 9 PASS; desktop XSS probes
show no execution, exact `<u>` only, and plain options/explanations.

Current post-OT11 deployment manifest path/hash: `docs/DEPLOYMENT.md`
`121A265382A46AB29E8FA72E067DEECD863D79F35AF47E1C1A998634BB860352` (179 lines;
refreshed 2026-11-13 by the phase 12 `FIX-2` fix)

Current post-OT11 developer guide path/hash: `docs/DEVELOPER-GUIDE.md`
`7E342A7D79BEDAD2DC5085E71767A49632444E341A7D760B038E4B97F22EF1AB` (234 lines)

Files changed: `docs/DEPLOYMENT.md` (new), `docs/DEVELOPER-GUIDE.md` (new),
`docs/STATUS.md`, `docs/DECISIONS.md` (D-72), `docs/INVARIANTS.md` (INV-97,
counts), `docs/EDGE_CASES.md`, `docs/AGENTS.md` (consolidated module names),
`docs/plan/README.md`, `docs/plan/prompts/phase-map.md`,
`docs/plan/owner-tool/next-steps.md`, this file. Test-only local files (excluded
via `.git/info/exclude`, not committed): `deployed/cbt_db.php`,
`deployed/cbt_admin_config.php`.

Open questions/known limits: OT11 rigorous review;
connection collation (`utf8mb4_unicode_ci` vs PDO `utf8mb4_general_ci`);
`practice_title` `NOT NULL` without a default vs the admin INSERT; missing live
header/footer/attempts artifacts; `extract-bank` pre-existing CRLF mismatch;
final rigorous review pending.

Review: pending rigorous final review
Commit: owner-requested OT11 acceptance checkpoint; OT10 final boundary deferred
Next: run the independent OT11/OT10 final review; cycle close only after a
settled review and explicit authorization.
