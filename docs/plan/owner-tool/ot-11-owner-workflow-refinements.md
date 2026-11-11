# OT11 — Owner Workflow Refinements

- **Status:** implementation corrected during the 2026-11-09 phone re-check;
  local tests and Chromium DOM check pass; owner Brave/Android re-check and
  rigorous review pending
- **Depends on:** OT10 phone check (recorded 2026-11-09) and the OT09A boundary
- **Blocks:** OT10 final review and cycle close
- **External gate:** owner Brave/Android re-check after implementation; no new
  server artifact
- **Release:** B/C owner workflow refinement
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Fix the three owner-workflow problems found during the 2026-11-09 Brave/Android
phone check without changing the native server contract or adding automatic
writes:

1. Put the Underline control next to the question text it formats.
2. Merge the JS "Shared contexts" card and the native "Create a Shared Context"
   card into one card that auto-fills from the paste and creates/updates directly.
3. Allow a linked question to be saved immediately against an existing shared
   context, matching the paste to saved contexts by fingerprint and skipping
   members that are already saved.

## Scope

### 1. Underline placement

- Move `#owner_tool_underline` and its hint from the owner panel to the
  `#question_text` field, adjacent to the textarea, in add and edit modes.
- Preserve Ctrl+U, the saved-selection handlers, one-step undo, and the exact
  underline renderer. No parser or storage change.

### 2. One context card

- Retire the JS multi-card "Shared contexts" panel as a separate card.
- On paste load, fill the native context card from the parsed context. Use a
  context selector when the paste contains more than one context.
- The card's native Create/Update button submits directly; remove the
  "Fill Context Form" step.
- Rename "Subject Pool / Exam Category Pool / Exam Year Pool" to "Subject /
  Exam Category / Exam Year" and add a note that every linked question must use
  the same values.
- Keep the existing manual native review; never auto-create, auto-update, or
  auto-activate.

### 3. Immediate linked save with fingerprint and member awareness

- Context fingerprint hard gates: `subject_id`, `exam_category_id`, `exam_year`,
  `context_type`, normalized `title`. Soft gate: `expected_member_count`
  (warning only).
- On paste load and on metadata edits, match the parsed context against the
  embedded server context list. Exactly one hard-gate match binds the existing
  `serverId` and enables Save without a create/update step. Multiple matches
  require an explicit selection. No match leaves the card as a draft.
- A native `#context_id` selection adopts that server context for the current
  item and is not overwritten by the next prepare.
- Embed a read-only context+member payload on `admin_questions.php` (or a
  read-only endpoint) built from `cbt_context_list` and `cbt_context_members`.
- When a context is selected or edited, compare parsed members to saved members
  by `context_id + context_position + normalized question text` (options confirm
  the match) and auto-skip already-saved items with a visible notice. A
  position-only match with different text is a warning, not a skip.
- The same cross-check runs on `?edit_context=N`.

## Decisions

- **D-OT11-1 — Automatic matching is optional; manual selection is first-class.**
  A failed, ambiguous, or incomplete fingerprint never blocks the save. The
  owner selects an existing context from `#context_id` (or creates one) and the
  selected server context is authoritative.
- **D-OT11-2 — Hard and soft gates.** Auto-match uses `subject_id`,
  `exam_category_id`, `exam_year`, `context_type`, and normalized `title` as hard
  gates. `expected_member_count` is a warning-only soft gate.
- **D-OT11-3 — Inferred metadata is a prefill, not a gate.** If the paste header
  does not identify the pool, the card stays editable and the manual path is
  used. The tool never auto-binds on empty or ambiguous gates.
- **D-OT11-4 — Manual selection survives prepare.** `prepare` must not overwrite
  a manual `#context_id` choice, and `linkInfo` must accept a selected server
  context without requiring a local card `serverId`.
- **D-OT11-5 — Member dedupe.** Already-saved members are matched by context ID,
  position (or cloze slot), and normalized question text, then auto-skipped with
  a visible notice. A position-only mismatch warns instead of skipping.

## Non-goals

- No change to CSRF, PRG, field names, the four-option rule, the success flash,
  uploads, or the context activation contract.
- No automatic context creation, update, activation, or question save.
- No change to `cbtOwnerTool:v1` key names or destructive state migration;
  additive fields only.
- No rework of `cbt_practice.php` or `practice_title`.
- No live writes or cleanup.

## Acceptance

| Check | Expected |
|---|---|
| Underline placement | Button/hint adjacent to `#question_text` in add and edit; Ctrl+U and selection behavior unchanged |
| One card | One native Shared Context editor; paste or Add Context reveals it; no duplicate JS fields, card-list toggle, or Fill step; direct Create/Update; named subject/category selects |
| Context selector | A multi-context paste can switch the card without duplicate cards |
| Fingerprint adoption | Hard-gate match binds the existing context; Save enabled; no create step |
| Soft gate | Different expected count warns but does not block |
| Native selection | Manual `#context_id` selection survives prepare and links the current item |
| Member skip | Already-saved members are skipped with a notice; no duplicate save |
| Context edit | Pasting into `?edit_context=N` cross-checks that context's members |
| No auto-write | No automatic context/question write in any path |
| Tests | `node tests/owner-tool.js`, PHP context tests, lint/syntax, and the phone re-check pass |
| Docs | Status, decisions, invariants, edge cases, developer guide, deployment manifest updated |

## Guardrails

- Preserve the exact success flash and PRG flow.
- Do not weaken `linkInfo` validation; extend it to accept a matched or selected
  server context.
- Do not reuse a server context ID for a different local context.
- Do not skip an item without a visible notice and a deterministic rule.
- Do not start OT10 final review or cycle close.

## Provisional externalize-first plan

Gate 1 records exact baselines. Expected production files:

- `src/owner-tool/owner-tool.js`: controller, panel, underline, context
  model/form.
- `src/owner-tool/owner-tool.css`: merged card and toolbar styles.
- `deployed/admin_questions.php`: read-only context/member payload and asset
  cache-bust; no contract change.
- `deployed/admin_context.php` and `deployed/context_lib.php`: only a read-only
  helper if the payload needs one; no mutation change.
- `tests/owner-tool.js` and `tests/context-admin.php`: adoption, selector,
  member skip, and payload coverage.
- Docs: this file, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/INVARIANTS.md`,
  `docs/EDGE_CASES.md`, `docs/DEVELOPER-GUIDE.md`, `docs/DEPLOYMENT.md`,
  `docs/plan/README.md`, and `docs/plan/prompts/phase-map.md`.

Excluded artifacts: the untracked local staging tree and test-only shims.

## Implementation notes (2026-11-09)

- Underline toolbar is moved next to `#question_text` at runtime; Ctrl+U,
  selection retention, and one-step undo are unchanged.
- The native Shared Context card is the only editor. Add/Remove/status controls
  live inside it; paste or Add Context reveals its fields. A multi-context paste
  gets one `#owner_context_select` selector that switches the same native form.
  The duplicate JS field set, numeric pool inputs, card-list toggle, and
  `Fill Context Form` action are removed. `Linked Question Numbers` is the only
  browser-only field and has no posted `name`. The native Create/Update button
  remains the only context write.
- `admin_questions.php` embeds a read-only `#owner_tool_context_data` payload
  from `cbt_context_list` and `cbt_context_members`; the payload is ignored if
  the context schema is unavailable.
- Hard-gate matching (`subject_id`, `exam_category_id`, `exam_year`,
  `context_type`, normalized `title`) adopts exactly one saved context.
  `expected_member_count` only warns. Manual `#context_id` selection is
  authoritative and survives `prepare`.
- Member dedupe matches context ID, position or cloze slot, and normalized
  question text; already-saved items are skipped with a visible notice.
- Native labels are now "Subject", "Exam Category", and "Exam Year", with a
  note that the owner tool matches those values.
- The first phone re-check exposed the still-duplicated JS/native editors. The
  owner's correction was applied immediately: tool version `1.3.0`, cache-bust
  token `2.3.2e`, and one merged native editor. Chromium 155 confirmed the
  merged parent, hidden-until-paste/Add behavior, no duplicate cards or Fill
  action, named English/JAMB selects, exact context #6 adoption/member skip,
  and two-context selector switching. The final Brave/Android re-check remains
  pending.

## Correction measurements

Package base remains `79a6a57`. Counts and hashes use LF-normalized UTF-8.

| Production file | Base delta +/− | Final lines / bytes | SHA-256 | Responsibility / deployment | Direct evidence |
|---|---:|---:|---|---|---|
| `src/owner-tool/owner-tool.js` | +458 / −199 | 1872 / 70250 | `f62e3fb759e8ebc64d49d2567934e4a6b6660e9f8dc516a09889ed620e74e9c5` | State, one native context editor, controller; deploy to `src/owner-tool/` | `node tests/owner-tool.js`; Chromium merged-card/adoption/selector probe |
| `src/owner-tool/owner-tool.css` | +14 / −64 | 207 / 3210 | `d5d1c981097e77a675c5d66153ccbc7df767a229eccc6c32f3c0a6729a4ed5fb` | Owner/context/CBT styling; deploy to `src/owner-tool/` | Chromium merged-card probe; loaded production stylesheet |
| `deployed/admin_context.php` | +44 / −5 | 872 / 40667 | `df0f690a9d8cc9e7860f6730baa11e3d5e797dba946856a23fff0a01836a2b59` | Native editor plus guarded payload helper; deploy to site root | `php tests/context-admin.php`; PHP lint; real admin Chromium route |
| `deployed/admin_questions.php` | +4 / −2 | 1066 / 62912 | `40c62a19ec37ac44a6eddcded17b1b279640ef3211843bf45071f905edb7f820` | Narrow entry wiring, payload emission, asset token; deploy to site root | `node tests/context-migration.js`; `node tests/owner-tool.js`; PHP lint; Chromium login/admin route |
| `deployed/cbt.php` | +2 / −2 | 1008 / 44515 | `43092c25f30284c8a45843766b9d8038c3be46a72719373e98c362edcc5042ae` | Owner CSS/render cache token only; deploy to site root | PHP lint; prior OT10 candidate/runtime evidence remains applicable |

Live-origin cumulative additions remain within the contract:
`admin_questions.php` +97/−77 and `cbt.php` +53/−89 against their archived
2026-10-31 snapshots. The local `mcq-staging` copy, test-only DB/config shims,
`mcq_ot10_browser` rows/title labels, and temporary Chromium profile/probe are
excluded test artifacts and are not deployment files.

## Handoff

```text
Date: 2026-11-09
Result: implementation corrected during phone re-check; local and Chromium checks pass; final phone re-check and rigorous review pending
Files changed: src/owner-tool/owner-tool.js, src/owner-tool/owner-tool.css,
  deployed/admin_questions.php, deployed/admin_context.php, deployed/cbt.php,
  tests/owner-tool.js, tests/context-admin.php, docs/DECISIONS.md, docs/STATUS.md, docs/INVARIANTS.md,
  docs/EDGE_CASES.md, docs/DEVELOPER-GUIDE.md, docs/DEPLOYMENT.md,
  docs/plan/README.md, docs/plan/prompts/phase-map.md,
  docs/plan/owner-tool/ot-10-release-and-handoff.md,
  docs/plan/owner-tool/next-steps.md, this file
Tests: node tests/owner-tool.js 61 PASS; node tests/runner.js 59 PASS;
  node tests/unit.js 162 PASS; context-migration 14 PASS; cbt-context 5 PASS;
  PHP context-lib 13 PASS; context-admin 20 PASS; context-preflight 6 PASS;
  php-render 9 PASS; cbt-candidate 7 PASS; php -l on changed deployed PHP files PASS; Chromium 155
  merged-card DOM/adoption/member-skip/multi-selector probe PASS
Fingerprint/member evidence: auto-adopt, manual selection, member skip, and
  count-mismatch warning covered by new tests/owner-tool.js cases
Phone re-check: first attempt found the duplicate-editor defect; correction deployed; final re-check pending
Review: pending
Commit: deferred
Next: owner Brave/Android re-check, then rigorous OT11 review
```
