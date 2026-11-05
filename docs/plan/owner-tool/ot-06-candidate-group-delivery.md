# OT06 — Candidate Group Delivery

- **Status:** done 2026-11-05; light review PASS at OT07 Gate 1
- **Depends on:** OT05
- **Blocks:** OT07, OT10
- **External gate:** satisfied 2026-11-05 by the
  [available-source reader/writer audit](ot-06-reader-writer-audit.md)
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Deliver complete shared-context groups safely in the main `cbt.php` candidate
path without abandoning random selection. `cbt_practice.php` and
`practice_title` are outside this cycle's remaining scope.

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

1. Audit the main `cbt.php` question-read path and every writer that can mutate
   linked question rows before changing queries.
2. Add a small, focused PHP selection helper used by `cbt.php`.
3. Query lightweight eligibility fields, assemble/shuffle units in PHP, then
   fetch full selected rows in final order.
4. Preserve main-CBT limits and filters.
5. Update subject/category/year option lookups so active contexts make their
   pools available.
6. Send contexts once in a browser context map and reference them by ID from
   question objects.
7. Render an open, collapsible context card above every linked question on
   desktop and mobile using OT04's safe formatter.
8. Highlight only the current cloze slot; keep all other slots readable.
9. Keep context questions consecutive in navigation and results without
   repeating full context text in every JSON question object.
10. Add deterministic unit tests for random unit selection and local browser
    tests for `cbt.php`.

## Audit Constraints

- All seven current `cbt.php` question reads need context-aware eligibility, not
  only the final payload query.
- `deployed/admin_question_mutations.php` is the only current direct question
  row writer. Preserve its atomic member-mutation/context-deactivation protocol.
- Treat standalone questions as active rows with `context_id IS NULL`; never
  make linked member rows individually active.
- Revalidate complete active groups across the eligibility/full-row read
  boundary so a concurrent admin mutation cannot emit a partial group.
- The archived context-unaware admin writers must not be deployed after the
  migration. OT10 verifies the deployment manifest and absence of alternate
  production writers.
- `answer_details.php` rejects inactive linked members. Keep OT06 within the
  current `cbt.php`-only scope by suppressing the result-detail link for linked
  rows while preserving standalone links.

## Acceptance

| Check | Expected |
|---|---|
| Standalone pool | Existing random behavior and limits preserved |
| Context inclusion | Whole active group or none; never partial/scattered |
| Internal order | Saved positions remain consecutive |
| Mixed pool | Standalone and groups both vary between seeded runs |
| Limit boundary | Oversize group skipped; actual total shown consistently |
| Main CBT | Subject/category/year filtering works |
| Context UI | Open/collapsible above every linked question; mobile usable |
| Cloze | Active slot highlighted accessibly |
| Payload | Context text emitted once per context |
| Rollback probe | Legacy query cannot see inactive linked member rows |
| Result details | No dead detail link for linked members; standalone link unchanged |

## Guardrails

- Do not return to `ORDER BY RAND() LIMIT N` for grouped rows.
- Do not select one member as a proxy for a whole group.
- Do not match a special subject by display name.
- Do not modify `cbt_practice.php` or `practice_title`.
- Do not expose correct-answer or context data beyond existing application
  behavior without documenting the impact.
- Do not start OT07.

## Handoff template

```text
Date: 2026-11-05
Result: implemented; local PHP/JS/browser checks PASS; light review PASS
Reader/writer audit: PASS 2026-11-05 at 8f1d7e5
Selection helper/API: deployed/cbt_candidate_selection.php and
  deployed/cbt_candidate_repository.php; cbt.php delegates categories, years,
  availability, delivery, and hydration to the repository
Deterministic selection tests: php tests/cbt-candidate.php 7 PASS;
  node tests/cbt-context.js 4 PASS
Main CBT browser evidence: isolated temp harness (stub SQLite/header/footer,
  local Chrome 155 via CDP). Exam fixture: total 4, one open context card,
  one active cloze mark. Mixed result fixture: total 6, six rows, four open
  cards, two active cloze marks, two safe underlines, and detail links only for
  standalone ids 1 and 2. Payload: context text/title once; contextId on each
  question; no context_text field.
Rollback probe: PASS - legacy active-row query cannot see linked members
Files changed: deployed/cbt.php, deployed/cbt_candidate_selection.php,
  deployed/cbt_candidate_repository.php, src/cbt/context-render.js,
  src/cbt/context.css, tests/cbt-candidate.php, tests/cbt-context.js,
  tests/context-migration.js
Hashes: cbt.php 1e093cc44aaaa0b437b4f116b4bcc00c3aa57056357b233eea7a5f5efac9e409;
  selection 8786578a817998a7955562e87ec72dd0feb58f214c42cc407bc258ee5727ce6f;
  repository 21254c1c38f1a86bac0b821666eaa116ee782fecb316bd4f03800d3d2cb9c450;
  context-render 5a01e8cbd79e7fd5388966751a9f7eb8c895128bfaafbfd264e69f9008f4096d;
  context.css 429fb27e8c9c727f34d9003142f69800d1f4c6ad064dd0e935edca642eab8a82
Open questions: target MySQL/staging execution remains OT10; no live/staging DB
  or destructive live write was used
Review: light verification PASS at OT07 Gate 1; no material findings
Commit: included with OT07 in the owner-requested machine-transfer checkpoint
Next: OT07 implemented; pending rigorous Release B review
```
