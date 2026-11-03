# Current Status

Last updated: 2026-11-03.

## Active cycle

- Cycle: `owner-tool-2026-11`
- Active map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md)
- Coordinator: [`plan/README.md`](plan/README.md)
- Intent: [`../INTENT.md`](../INTENT.md)
- Last completed package: OT04, Underline and Multiline, implementation complete
  and rigorous re-review PASS. Brave/Android staging verification is
  owner-deferred to OT10 because no staging copy is currently available.
- Next package: OT05, Context Schema and Admin. Gate 1 is **blocked only** until
  the exact supplied SQL DDL bytes for `questions`, `subjects`, and
  `exam_category` are placed in the workspace. No `.sql` export currently exists
  in the worktree or in Git history.
- Do not start OT05 implementation until that single artifact is available.
  Connection, runtime, and identifier questions are settled (see below).
- Product implementation: parser 2.1.0, exact underline rendering, multiline
  stems, Add/Edit formatting, and native PRG preservation are in place.
- Working branch: `owner-tool-integration`; `main` is the published baseline.
  See [`plan/README.md`](plan/README.md#branch-strategy).

## Confirmed facts (not gates)

- Application target: PHP 8.3.
- Database: MySQL 8.0.41, InnoDB, `utf8mb4_unicode_ci`.
- Connection contract: root `db_conn.php` supplies the PDO connection
  (charset `utf8mb4`, exception mode, associative fetches, native prepares). The
  full credential-bearing `cbt_db.php` is no longer required.
- The phpMyAdmin PHP 8.4.27 export header describes the exporter, not the website
  runtime.
- The supplied export's `exam_category2` identifier is corrected to
  `exam_category` when building the working DDL copy; the original export remains
  evidence.
- Runtime/staging verification (PHP lint, renderer vectors, migration execution,
  Chromium, Brave/Android) belongs to OT10, not OT05.

## Known baselines

| Line | Evidence | Status |
|---|---|---|
| `main` at `58af90e` | `node tests/runner.js` and `node tools/extract-bank.js --check` on 2026-11-03 | 47 PASS, 0 FAIL, 2 PENDING runner; 5 bank slices OK. This line has no `tests/unit.js` or `tests/owner-tool.js`. |
| clean experiments commit `d5a62f0` | recorded `node tests/runner.js` and `tests/unit.js` | 43 PASS runner, 140 PASS unit |
| `owner-tool-integration` code baseline at `405439b` (OT04 merged; docs-only commits follow) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js`, and `node tools/extract-bank.js --check` on 2026-11-03 | 47 PASS, 0 FAIL, 2 PENDING runner; 145 unit; 38 owner-tool; 7 bank slices OK |
| dirty experiments worktree after `d5a62f0` | read-only review | BLOCK; P20-P22 must remain uncommitted and excluded |

The dirty experiments review found parser data loss and image-plan/Auto-Save
defects despite its green 46/155 suites. The owner selected the clean
`d5a62f0` baseline and a manual-review replacement tool, so those dirty changes
are shelved rather than repaired in this cycle.

## Supplied evidence

- `deployed/admin_questions.php` (OT03 replaced the helper include here)
- `deployed/cbt.php`
- `deployed/cbt_practice.php`
- `db_conn.php` (PDO connection contract; added in commit `405439b`)
- `admin-needs.txt`
- `sample-underline.txt`
- `sample-passages.txt`
- `ocr_helper.js` (current production helper, archived by OT03)
- `answer_details.php` (archived byte-identically on 2026-11-02 and integrated)
- Runtime baseline: PHP 8.3 application target and MySQL 8.0.41. The PHP 8.4.27
  schema-export header describes phpMyAdmin's runtime, not the website runtime.

OT01/OT04 recorded archival hashes and provenance; `deployed/` is the working
copy. Changed PHP has not been linted or executed in this workspace because PHP
is not installed; that execution is deferred to OT10. `tests/php-render.php` is
ready for the target runtime.

The OT05 checklist names three SQL exports (`questions.sql`, `subjects.sql`,
`exam_category.sql`), but no `.sql` file exists in the worktree or anywhere in
Git history. That is one missing-artifact problem, not several independent
blockers.

## External gates

| Artifact | Required by | Reason |
|---|---|---|
| Exact SQL DDL bytes for `questions`, `subjects`, and `exam_category` | OT05 | Define exact migration types, keys, engine, and charset; currently absent from the worktree and Git history |
| Practice-question writer/importer | OT06 | Preserve the `practice_title` contract |
| Search list for question readers/writers | OT06 | Find every affected renderer and write path |
| Representative context paste with answer key | OT08/OT09 final acceptance | Prove the one-box key workflow on the new families |

These are **not** OT05 gates: a redacted or full `cbt_db.php` (the connection
contract is supplied by `db_conn.php`), another PHP/database/engine/charset
confirmation (settled above), or another `exam_category` export for the
`exam_category2` naming question (correction rule settled).

`header.php`, `footer.php`, and `cbt_exam_attempts` are not requested up front.
The supplied detail page is part of OT04; OT10 repeats Release A acceptance
instead of performing first-time integration.

## Deferred to OT10

OT05 writes the migration, preflight, and rollback artifacts. OT10 executes and
proves them. OT10 also owns:

- `php -l` on every changed/new PHP file;
- `php tests/php-render.php`;
- migration preflight, forward, rerun, and rollback on a disposable
  production-shaped database;
- desktop Chromium and Brave/Android staging checks; and
- the deployment manifest and final human-developer handoff.

None of these is an OT05 completion gate.

## Delivery stages

- Release A: OT03-OT04 implement the owner-tool replacement, underline/multiline,
  and detail-page formatting; OT10 independently verifies the release.
- Release B: OT05-OT07, manual shared-context persistence and delivery.
- Release C: OT08-OT09, comprehension and cloze OCR automation.
- OT10 performs final release verification, target-PHP checks, Brave/Android
  staging smoke, and human-developer handoff.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state, review cadence, and branch strategy: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/owner-tool/`
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
