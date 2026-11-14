# Owner Tool 2026-11 — Archived

Archived on 2026-11-14 during ST01, the Constant Text reset. These files are
kept as evidence of the completed `owner-tool-2026-11` cycle; they are not part
of the production path and must not be loaded or executed.

The owner reset the scope: the root `ocr_helper.js` is the shipping OCR helper,
the shared-text/context subsystem is retired, and one optional
`questions.constant_text` passage replaces it. The production context migration
was never executed.

## Archived files

| Path | Former purpose |
|---|---|
| `deployed/admin_shared.php` | Shared Texts administration page. |
| `deployed/admin_context.php` | Shared-context request/render/transaction layer. |
| `deployed/context_lib.php` | Context validation and persistence helpers. |
| `deployed/cbt_candidate.php` | Candidate category/year/pool/delivery queries and context grouping. |
| `deployed/sql/01-context-migration.sql` | OT05 forward schema migration. |
| `deployed/sql/02-context-rollback.sql` | OT05 guarded rollback. |
| `src/owner-tool/owner-tool.js` | Owner-tool state, paste/parse/fill, and controller. |
| `src/owner-tool/shared-texts.js` | Shared-text context APIs. |
| `src/owner-tool/shared-paste.js` | Shared-text paste parsing. |
| `src/owner-tool/owner-tool.css` | Owner-tool and context styles. |
| `tests/owner-tool.js` | Owner-tool/context DOM and storage tests. |
| `tests/context-admin.php` | Context request, transaction, and render tests. |
| `tests/context-lib.php` | Context helper-behavior tests. |
| `tests/context-preflight.php` | Real migration preflight tests. |
| `tests/context-migration.js` | Static context migration probes. |
| `tests/cbt-context.js` | CBT context delivery tests. |
| `tests/standalone-admin.php` | Standalone admin guard tests. |
| `tests/cbt-candidate.php` | Candidate query tests. |
| `tools/context-migration-contract.php` | Canonical migration contract. |
| `tools/context-migration-inspector.php` | Schema metadata inspector. |
| `tools/context-migration-preflight.php` | Migration preflight CLI. |

`src/owner-tool/render.js`, `src/parser/*`, the bookmarklet build, and the core
parser tests remain in the active tree. The supplied SQL exports remain under
`archive/sql/`.
