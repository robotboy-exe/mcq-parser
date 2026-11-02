# Current Status

Last updated: 2026-11-02.

## Active cycle

- Cycle: `owner-tool-2026-11`
- Active map: [`plan/prompts/phase-map.md`](plan/prompts/phase-map.md)
- Coordinator: [`plan/README.md`](plan/README.md)
- Intent: [`../INTENT.md`](../INTENT.md)
- Current package: OT04, Underline and Multiline, implementation complete.
  Brave/Android staging verification is owner-deferred to OT10 because no
  staging copy is currently available.
- Next action: rigorous OT04 review in a fresh session; OT05 remains gated.
- Product implementation: parser 2.1.0, exact underline rendering, multiline
  stems, Add/Edit formatting, and native PRG preservation are in place.

## Known baselines

| Line | Evidence | Status |
|---|---|---|
| `main` at `e5dec50` | `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING |
| clean experiments commit `d5a62f0` | `node tests/runner.js` & `tests/unit.js` | 43 PASS runner, 140 PASS unit |
| OT04 fix branch | `node tests/runner.js`, `tests/unit.js`, `tests/owner-tool.js` | 47 PASS, 0 FAIL, 2 PENDING runner; 143 unit; 33 owner-tool |
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
- `answer_details.php` (archived byte-identically on 2026-11-02 and integrated)
- Runtime baseline: PHP 8.3 application target and MySQL 8.0.41. The PHP 8.4.27
  schema-export header describes phpMyAdmin's runtime, not the website runtime.

OT01/OT04 recorded archival hashes and provenance; `deployed/` is the working
copy. Changed PHP has not been linted or executed in this workspace because PHP
is not installed; `tests/php-render.php` is ready for the target runtime.

## External gates

| Artifact | Required by | Reason |
|---|---|---|
| Redacted `cbt_db.php` | OT05 | Confirm charset, PDO mode, and transaction setup |
| DDL for `questions`, `subjects`, `exam_category` | OT05 | Define exact migration types, keys, engine, and charset |
| Practice-question writer/importer | OT06 | Preserve the `practice_title` contract |
| Search list for question readers/writers | OT06 | Find every affected renderer and write path |
| Representative context paste with answer key | OT08/OT09 final acceptance | Prove the one-box key workflow on the new families |

`header.php`, `footer.php`, and `cbt_exam_attempts` are not requested up front.
The supplied detail page is now part of OT04; OT10 repeats Release A acceptance
instead of performing first-time integration.

## Delivery stages

- Release A: OT03-OT04 implement the owner-tool replacement, underline/multiline,
  and detail-page formatting; OT10 independently verifies the release.
- Release B: OT05-OT07, manual shared-context persistence and delivery.
- Release C: OT08-OT09, comprehension and cloze OCR automation.
- OT10 performs final release verification, Brave/Android staging smoke, and
  human-developer handoff.

## Source of truth

- Product intent: `INTENT.md`
- Current work state: this file
- Package state and review cadence: `docs/plan/README.md`
- Active phase order: `docs/plan/prompts/phase-map.md`
- Package contracts: `docs/plan/owner-tool/`
- Historical parser packages: `docs/plan/01-*.md` through `09-*.md`
