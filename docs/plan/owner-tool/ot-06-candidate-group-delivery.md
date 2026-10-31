# OT06 — Candidate Group Delivery

- **Status:** blocked
- **Depends on:** OT05
- **Blocks:** OT07, OT10
- **External gate:** practice-question writer/importer and search results for
  every `question_text`, `INSERT INTO questions`, and `UPDATE questions`
  consumer
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Deliver complete shared-context groups safely in both candidate paths without
abandoning random selection or duplicating rendering/selection logic.

## Selection rule

1. Filter eligible standalone questions and validated active contexts by the
   selected pool dimensions.
2. Represent each standalone question and each complete context group as one
   random unit.
3. Shuffle units.
4. Add a unit only when its full size fits the remaining limit.
5. Keep context members ordered by saved position.
6. Permit a lower total when no complete remaining unit fits; report the actual
   total everywhere.

## Work

1. Audit every current question reader/writer and the practice-title authoring
   path before changing queries.
2. Add a shared, small PHP selection helper used by both CBT pages; do not copy
   group-selection code between pages.
3. Query lightweight eligibility fields, assemble/shuffle units in PHP, then
   fetch full selected rows in final order.
4. Preserve main-CBT limits and practice-title filters.
5. Update subject/category/year/practice option lookups so active contexts make
   their pools available.
6. Send contexts once in a browser context map and reference them by ID from
   question objects.
7. Render an open, collapsible context card above every linked question on
   desktop and mobile using OT04's safe formatter.
8. Highlight only the current cloze slot; keep all other slots readable.
9. Keep context questions consecutive in navigation and results without
   repeating full context text in every JSON question object.
10. Add deterministic unit tests for random unit selection and local browser
   tests for both candidate pages.

## Acceptance

| Check | Expected |
|---|---|
| Standalone pool | Existing random behavior and limits preserved |
| Context inclusion | Whole active group or none; never partial/scattered |
| Internal order | Saved positions remain consecutive |
| Mixed pool | Standalone and groups both vary between seeded runs |
| Limit boundary | Oversize group skipped; actual total shown consistently |
| Main CBT | Subject/category/year filtering works |
| Practice CBT | `practice_title` and category behavior preserved |
| Context UI | Open/collapsible above every linked question; mobile usable |
| Cloze | Active slot highlighted accessibly |
| Payload | Context text emitted once per context |
| Rollback probe | Legacy query cannot see inactive linked member rows |

## Guardrails

- Do not return to `ORDER BY RAND() LIMIT N` for grouped rows.
- Do not select one member as a proxy for a whole group.
- Do not match a special subject by display name.
- Do not duplicate helper logic across both candidate pages.
- Do not expose correct-answer or context data beyond existing application
  behavior without documenting the impact.
- Do not start OT07.

## Handoff template

```text
Date:
Result:
Reader/writer audit:
Selection helper/API:
Deterministic selection tests:
Main/practice browser evidence:
Rollback probe:
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT07 Gate 1
Commit: deferred
Next: OT07 not started
```
