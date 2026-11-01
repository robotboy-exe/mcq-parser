# Current Status

Last updated: 2026-11-01.

## Active cycle

- Cycle: `owner-tool-2026-11`
- Active map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md)
- Coordinator: [`plan/README.md`](plan/README.md)
- Intent: [`../INTENT.md`](../INTENT.md)
- Next package: OT04, Underline and Multiline (ready; `answer_details.php`
  integration is deferred to OT10)
- Product implementation: OT03 complete (readable owner tool loaded by
  `admin_questions.php`; native PRG saves; versioned `cbtOwnerTool:v1` state)

## Known baselines

| Line | Evidence | Status |
|---|---|---|
| `main` at `e5dec50` | `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING |
| clean experiments commit `d5a62f0` | `node tests/runner.js` & `tests/unit.js` | 43 PASS runner, 140 PASS unit |
| integration line (`owner-tool-integration`) | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js` | 45 PASS, 0 FAIL, 2 PENDING runner; 140 unit; 16 owner-tool |
| dirty experiments worktree after `d5a62f0` | read-only review | BLOCK; P20-P22 must remain uncommitted and excluded |

The dirty experiments review found parser data loss and image-plan/Auto-Save
defects despite its green 46/155 suites. The owner selected the clean
`d5a62f0` baseline and a manual-review replacement tool, so those dirty changes
are shelved rather than repaired in this cycle.

## Supplied evidence

- `deployed/admin_questions.php` (OT03 replaced the helper include here)
- `deployed/cbt.php`
- `deployed/cbt_practice.php`
- `admin-needs.txt`
- `sample-underline.txt`
- `sample-passages.txt`
- `ocr_helper.js` (current production helper, archived by OT03)

OT01 recorded archival hashes and provenance; `deployed/` is the working copy.
The `admin_questions.php` include change is HTML-only and has not been run in a
PHP runtime (no PHP installed in this workspace).

## External gates

| Artifact | Required by | Reason |
|---|---|---|
| `answer_details.php` | OT10 (not an OT04 gate) | Integrate and verify safe post-test rendering before final release |
| Redacted `cbt_db.php` | OT05 | Confirm charset, PDO mode, and transaction setup |
| DDL for `questions`, `subjects`, `exam_category` | OT05 | Define exact migration types, keys, engine, and charset |
| PHP and MySQL/MariaDB versions | OT05 | Select supported language and SQL features |
| Practice-question writer/importer | OT06 | Preserve the `practice_title` contract |
| Search list for question readers/writers | OT06 | Find every affected renderer and write path |
| Representative context paste with answer key | OT08/OT09 final acceptance | Prove the one-box key workflow on the new families |

`header.php`, `footer.php`, and `cbt_exam_attempts` are not requested up front.
OT04 proceeds against the supplied admin, CBT, result, and print paths and must
record the shared detail-page integration contract rather than guessing the
missing source.

## Delivery stages

- Release A: OT03-OT04 implement the owner-tool replacement plus
  underline/multiline; OT10 integrates the deferred detail-page source before
  final release acceptance.
- Release B: OT05-OT07, manual shared-context persistence and delivery.
- Release C: OT08-OT09, comprehension and cloze OCR automation.
- OT10 performs final release verification and human-developer handoff.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state and review cadence: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/owner-tool/`
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
