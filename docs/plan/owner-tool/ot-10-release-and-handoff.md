# OT10 — Release and Handoff

- **Status:** blocked
- **Depends on:** OT09 and its settled rigorous review
- **Blocks:** cycle close
- **External gate:** user's local PHP machine, staging environment, and all
  prior source-contract artifacts
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Audit the complete owner-tool/context release, prove its migration and rollback
on production-shaped local data, verify the supported browsers, and produce a
concise human-developer deployment and maintenance handoff.

## Work

1. Audit every changed PHP/JS/CSS/SQL file for readability, duplication, dead
   bookmarklet/Auto-Save code, stable selectors, and narrowly scoped comments.
2. Run all Node parser/UI tests, fixture runner, bank extractor, link checks,
   syntax checks, and security/adversarial probes.
3. On the local PHP machine, run `php -l` on every PHP file and apply migration
   preflight/forward/rollback tests against a disposable production-shaped DB.
4. Verify Release A behavior independently: owner tool, native PRG, underline,
   paragraphs, result/detail rendering, and legacy-state warning.
5. Verify Release B behavior independently: context CRUD, activation safety,
   complete-group random selection, both CBT paths, and rollback hiding.
6. Verify Release C behavior independently: singular/multiple comprehension,
   cloze, standalone mixing, same-paste key, ambiguity fallback, and zero
   automatic writes.
7. Run desktop Chromium and Brave/Android checks on staging; record exact
   browser versions, fixtures, and outcomes.
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
- Do not archive or close the cycle automatically.

## Handoff template

```text
Date:
Result:
Node/fixture/PHP results:
Migration/rollback evidence:
Release A/B/C acceptance:
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
