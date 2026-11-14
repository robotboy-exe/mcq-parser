# OCR Owner Tool Work Plan — Coordinator

This is the operational source of truth for the active owner-tool cycle. Read
this file, [`../../INTENT.md`](../../INTENT.md), the active
[`phase-map.md`](prompts/phase-map.md), and the one package being executed.

Last updated: 2026-11-14.

## Current state

- Active cycle: `math-editor-2026-11` (created 2026-11-14). The owner decided on
  2026-11-14 that it opens with the OT12 shared-text isolation remediation
  (phase 1), then the P24 mathematics-editor delta: a curated Tier 1 Unicode
  symbol palette and an editor-side UTF-8 byte counter in the shipped owner tool.
- Packages: OT12 (shared-text page isolation), then ME01 (palette, byte counter,
  integration), then ME02 (release evidence, manifest/guide, rigorous review).
  None has started.
- Resolved owner decisions (2026-11-14): keep the shipped underline and the
  exact lowercase `<u>` boundary (D-66); palette in a new owner-tool module; use
  the existing `#owner_tool_preview`; count bytes in the editor without changing
  the server limit; keep `cbt_practice.php` out of scope; plan against the
  current `deployed/` working copies.
- Ordering decision (2026-11-14): the math-editor packages were planned before
  the first live deployment showed that the integrated shared-text code fails
  every question save until the context migration runs. OT12 was therefore made
  phase 1, ahead of ME01/ME02, instead of being appended after them.
- Planning constraint: `deployed/admin_questions.php` now stands at **+229/−79**
  against its live snapshot. The owner approved that 129-addition excess on
  2026-11-14 for inlining the context-free save path (D-82). ME01 must still
  re-measure before adding its script tag, because no further headroom is
  assumed.
- Previous cycle: `owner-tool-2026-11` is archived (2026-11-14); its final
  summary is in [`history.md`](history.md) and its map in
  [`prompts/cycles/owner-tool-2026-11.md`](prompts/cycles/owner-tool-2026-11.md).
- Working branch: `owner-tool-integration`, except phase 1 (OT12), which
  implements on the required `ot12-shared-text-isolation` topic branch and
  merges back before the ME01 Gate 1 review; `main` is the published baseline.
  See [Branch strategy](#branch-strategy).
- Current status summary: [`../STATUS.md`](../STATUS.md).
- Continuation checklist: [`owner-tool/next-steps.md`](owner-tool/next-steps.md).

## Product direction

- The archived `owner-tool-2026-11` cycle shipped the readable owner tool,
  underline and multiline, shared-context persistence and complete-group
  delivery, and comprehension/cloze OCR; its evidence and limits are in
  [`history.md`](history.md) and [`../DEPLOYMENT.md`](../DEPLOYMENT.md).
- This cycle (`math-editor-2026-11`) adds a curated Tier 1 Unicode symbol
  palette and an advisory UTF-8 byte counter to the owner tool.
- Keep the native textarea and the native PRG save; no rich-text editor, no
  Auto-Save, no bookmarklet.
- Keep the exact lowercase `<u>`/`</u>` boundary (D-66) and the shared
  renderers; do not widen marker matching.
- Keep `cbt_practice.php` and `practice_title` outside scope.
- Keep the server's 60,000-byte limit authoritative; the editor count is
  advisory only.

`INTENT.md` is authoritative when package prose is ambiguous; P24 as amended on
2026-11-14 is the behavior source for this cycle.

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
| 1 | OT12 | [Shared-Text Page Isolation](owner-tool/ot-12-shared-text-page-isolation.md) | archived cycle close | implemented at `73009ac`, light review PASS WITH NOTES 2026-11-14; merge pending | none; disposable database only |
| 2 | ME01 | [Math Symbol Palette and Byte Counter](math-editor/me-01-math-palette.md) | OT12 review | not started | owner approval for +1 addition in `admin_questions.php`; Brave/Android and desktop checks |
| 3 | ME02 | [Release, Evidence, and Handoff](math-editor/me-02-release-and-handoff.md) | ME01 review | not started | owner-accepted Brave/Android check; deployment-time live artifacts |

Status lives only in this table; the active map maps phase numbers to these
packages. Update the table and the map in the same package handoff.

The archived cycle `owner-tool-2026-11` (OT00-OT11, all `done`, review-settled
2026-11-14) is summarized in [`history.md`](history.md); its map and final
status prose are preserved at
[`prompts/cycles/owner-tool-2026-11.md`](prompts/cycles/owner-tool-2026-11.md).

## External artifacts

The rows below are archived-cycle and deployment artifacts that still govern
the shipped baseline; they are not new gates for this cycle.

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
- `ot12-shared-text-isolation` is the short-lived OT12 topic branch off
  `owner-tool-integration` at `a3b93b7`. OT12 must be implemented only on this
  branch; it is the explicit isolation exception to the default work branch.
  Merge it back into `owner-tool-integration` (fast-forward if possible) and
  delete it locally and remotely before the OT12 handoff and the ME01 Gate 1
  light review. Do not make it long-lived or base later packages on it.
- `ot04-fix` and `ot04-review` are merged into `owner-tool-integration` and
  retired. Their commits remain reachable through history; do not base new work
  on them.
- Reviews are read-only sessions against `owner-tool-integration`. A review
  session may write only its record under [`reviews/`](reviews/README.md); it
  never commits or moves branches.
- Implementation changes land on `owner-tool-integration`, except OT12, which
  lands on `ot12-shared-text-isolation` and is merged back before review. The
  rigorous review at a release boundary verifies the `owner-tool-integration`
  tip; only then may `main` be advanced.

## Review checkpoints

| Checkpoint | Scope | Level | Status |
|---|---|---|---|
| phase 1 | OT12 shared-text page isolation | light at ME01 Gate 1 | light review recorded 2026-11-14 (`PASS WITH NOTES`); merge pending |
| phase 2 | ME01 palette, byte counter, and integration | light at ME02 Gate 1 | pending |
| phase 3 close | ME02 release, evidence, and handoff | rigorous | pending |

## Remaining path to cycle close

1. **OT12 Gate 1** — verify the shipped baseline and the isolation boundary,
   resolve the open Gate 1 questions, and confirm the externalize-first plan.
2. **OT12** — isolate shared-text/member-question management into
   `admin_shared.php`, restore the legacy page to a context-free save path, and
   hand off; light review at ME01 Gate 1.
3. **ME01 Gate 1** — verify the post-OT12 baseline, restate the resolved spec
   delta, and request the +1 externalize-first approval naming
   `deployed/admin_questions.php` and its measured excess.
4. **ME01** — implement, test, and hand off; light review at ME02 Gate 1.
5. **ME02** — tokens, decisions, docs, manifest/guide, and browser evidence.
6. **Rigorous release review** via
   [`prompts/review-session.md`](prompts/review-session.md), then any
   fix/re-review rounds.
7. **Cycle close** via [`prompts/cycle-close.md`](prompts/cycle-close.md); the
   commit, an optional `main` fast-forward, and archiving each need explicit
   owner authorization.

Current workflow stop:

```text
NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 1
```

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

- Work in the current worktree and keep it on `owner-tool-integration`, except
  while implementing OT12, which stays on `ot12-shared-text-isolation` until the
  package merges it back. For a read-only baseline check of another line, use a
  detached temporary worktree; do not switch the working tree to `main` to
  implement or to refresh a status count.
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
