# OT11 — Owner Workflow Refinements

- **Status:** in progress; owner accepted the final Brave/Android re-check on
  2026-11-13; 60 runner, 163 unit, 81 owner-tool and full local suites pass;
  independent rigorous review pending
- **Depends on:** OT10 phone check (recorded 2026-11-09) and the OT09A boundary
- **Blocks:** OT10 final review and cycle close
- **External gate:** owner Brave/Android re-check satisfied 2026-11-13 without a
  new live write; independent rigorous review remains
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
  `context_type`, normalized `title`, and normalized full passage text. Soft
  gate: `expected_member_count`
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

### 4. Follow-up phone feedback (2026-11-11)

- A question linked to a new, unsaved shared context must not post. Tapping
  **Save Question** must show the exact message **Save the shared context
  first.** Safe standalone and saved-context submissions remain native.
- A selected saved context or linked local context owns the question form's
  Subject, Exam Category, and Exam Year values.
- A context editor collapses after an exact create/update success flash. A
  **Show** button reopens it; new drafts, failed saves, and explicit context edit
  pages stay open.
- The native question form has two clear visual groups: the three context-link
  fields, and all remaining question fields.
- Owner-facing labels, help, states, flags, and warnings use short plain words.
  Parser evidence strings and fixed server-contract flashes remain unchanged;
  presentation text is translated only at the owner UI boundary.
- The one safe candidate preview is placed beside **Question Text** for normal,
  linked, Add, and Edit flows.

### 5. Final owner follow-up (2026-11-12)

- Move the collapsible native shared-text editor directly below the paste panel
  and above the light-blue question-link group.
- Name the section **Edit Shared Text**.
- Opening `?edit_context=N` must keep the server-loaded record even when
  `cbtOwnerTool:v1` contains a linked context from the latest paste. An explicit
  **Use Paste** does not replace those fields.

### 6. Latest phone re-check fixes (2026-11-12)

- For a multi-context paste, visibly label the editor selector and keep the
  first unsaved shared text selected/open on initial adoption and after an exact
  save. A saved-member skip must not return the editor to a saved first passage.
- Parse the exact `new-sample.txt` cloze table without weakening strict refusal:
  gap 75 may use a one-character local left correction only when at least two
  row-derived starts corroborate it.

### 7. Saved-edit isolation and visible modes (2026-11-13)

- **Use Paste** may fill or replace only a new shared-text draft. It must never
  alter fields, action, or context ID while the native form is editing a saved
  context.
- Make the modes unmistakable on the form: amber **New Shared Text** / **New
  text - draft mode** for drafts, and blue **Edit Saved Shared Text** / **Saved
  text #N - edit mode** for saved edits.

## Decisions

- **D-OT11-1 — Automatic matching is optional; manual selection is first-class.**
  A failed, ambiguous, or incomplete fingerprint never blocks the save. The
  owner selects an existing context from `#context_id` (or creates one) and the
  selected server context is authoritative.
- **D-OT11-2 — Hard and soft gates.** Auto-match uses `subject_id`,
  `exam_category_id`, `exam_year`, `context_type`, normalized `title`, and
  normalized full passage text as hard gates. `expected_member_count` is a
  warning-only soft gate. The full-text addition supersedes the earlier
  title-only wording.
- **D-OT11-3 — Inferred metadata is a prefill, not a gate.** If the paste header
  does not identify the pool, the card stays editable and the manual path is
  used. The tool never auto-binds on empty or ambiguous gates.
- **D-OT11-4 — Manual selection survives prepare.** `prepare` must not overwrite
  a manual `#context_id` choice, and `linkInfo` must accept a selected server
  context without requiring a local card `serverId`.
- **D-OT11-5 — Member dedupe.** Already-saved members are matched by context ID,
  position (or cloze slot), and normalized question text, then auto-skipped with
  a visible notice. A position-only mismatch warns instead of skipping.
- **D-OT11-6 — Cancel only blocked linked submits.** The native question PRG
  remains untouched when the form is safe. A linked-question blocker cancels
  that submit and shows its reason; a new context uses the exact required text.
- **D-OT11-7 — Context metadata owns linked questions.** Manual saved-context
  selection wins first, then the linked local context, then paste metadata for
  standalone questions. Context values do not overwrite global standalone
  metadata.
- **D-OT11-8 — Collapse is presentation state.** Saved context editors default
  closed after confirmation and reopen only on **Show**. No storage shape or
  server action changes.
- **D-OT11-9 — Plain copy is a display rule.** Translate parser flags and
  warnings when displayed rather than changing parser outputs or fixture
  contracts. Keep exact question/context PRG success flashes unchanged.
- **D-OT11-10 — One preview node.** Move the existing safe preview beside the
  native Question Text field; do not create a second renderer or preview.
- **D-OT11-11 — One stacked page.** Add Question, Shared Texts, and All
  Questions are full-width sections in that order. There is no tab shell or
  active-tab state. Question Edit server-hides the latter two sections.
- **D-OT11-12 — Full paste replaces paste memory.** A new full paste clears
  native question/link/context values before applying the new parse; empty
  inference clears metadata. Key-only paste keeps the queue and contexts.
- **D-OT11-13 — Duplicate evidence is advisory.** Latest-20 normal-question
  identity and full shared-text identity show notices only. They never disable
  Save, submit, skip, overwrite, or add a server rejection.
- **D-OT11-14 — Independent shared-text paging.** The management table uses
  `context_page` at 10 rows while the question selector remains unpaginated.
  Manual selection fills the next unused position/gap when one is absent.
- **D-OT11-15 — Saved shared-text Edit owns the editor.** The shared-text editor
  is placed between the paste panel and native question form. Neither automatic
  queue restoration nor Use Paste can fill it in `update_context` mode; Use
  Paste fills only `save_context` drafts. Saved Shared Texts stays in its
  paginated section below. Amber draft and blue edit treatments identify the
  current mode without relying on button text alone.
- **D-OT11-16 — Unsaved text selection outranks question-following.** Initial
  preparation and exact save success open the first remaining unsaved card. A
  selected unsaved card cannot be hidden by automatic question preparation;
  every write remains an explicit native submit.
- **D-OT11-17 — Cloze drift repair is local and corroborated.** Keep modal
  row-derived starts. Shift one row's non-exact boundaries left one character
  only when at least two starts occur at modal-minus-one; preserve every D-68
  whole-group refusal and word-safe right snap.

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
| Fingerprint adoption | Full pool/type/title/text identity binds the existing context; Save enabled; no create step |
| Soft gate | Different expected count warns but does not block |
| Native selection | Manual `#context_id` selection survives prepare and links the current item |
| Member skip | Already-saved members are skipped with a notice; no duplicate save |
| Context edit | Pasting into `?edit_context=N` cross-checks that context's members |
| Unsaved context stop | Save Question remains tappable, cancels the post, and says exactly `Save the shared context first.` |
| Context metadata | Selecting or linking a context fills Subject, Exam Category, and Exam Year from that context |
| Saved-card collapse | Exact context create/update success collapses the editor; Show reopens it without a write |
| Form boundaries | Context ID/position/slot are one visible group and all other question fields are another |
| Plain copy | Owner panel and native-form labels, help, states, flags, and warnings use the recorded short vocabulary; fixed flashes stay exact |
| Preview placement | The single preview is beside Question Text for standalone and linked questions in Add/Edit flows |
| Page shape | Add Question, Shared Texts, and All Questions are stacked full width; no tabs; Edit shows formatting/preview only |
| Editor placement | The shared-text editor is directly below paste and above the light-blue question-link group |
| Shared-text form modes | Draft mode is amber and says New Shared Text / New text - draft mode; saved edit mode is blue and says Edit Saved Shared Text / Saved text #N - edit mode |
| Explicit shared-text edit | Server values, action, and ID survive stored state and every Use Paste click; only a new draft is paste-filled |
| Full re-paste | Prior metadata, link values, and context-editor values clear before the new parse; empty inference stays empty |
| Duplicate notice | Latest-20 normal and full-identity shared notices are visible and non-blocking |
| Shared-text paging | 10 rows per `context_page`; the question selector still contains every saved context |
| Manual next free | Missing passage number/gap uses the first unused saved value; existing values stay |
| Next unsaved text | Initial adoption/save selects and opens the first unsaved card under a visible `Shared text to edit` label, including after a saved-member skip |
| One-character cloze drift | Exact `new-sample.txt` yields 15 items, Q75 `confession/suggestion/permission/complaint`, two contexts, and no warning |
| No auto-write | No automatic context/question write in any path |
| Tests | `node tests/owner-tool.js`, PHP context tests, lint/syntax, and the phone re-check pass |
| Docs | Status, decisions, invariants, edge cases, developer guide, deployment manifest updated |

## Guardrails

- Preserve the exact success flash and PRG flow.
- Preserve parser warning/flag values and translate them only for display.
- Do not weaken `linkInfo` validation; extend it to accept a matched or selected
  server context.
- Do not reuse a server context ID for a different local context.
- Do not skip an item without a visible notice and a deterministic rule.
- Do not turn the one-character, two-anchor cloze correction into nearest-column
  guessing or weaken true missing-column refusal.
- Do not start OT10 final review or cycle close.

## Provisional externalize-first plan

Gate 1 records exact baselines. Expected production files:

- `src/owner-tool/owner-tool.js`: controller, panel, underline, context
  model/form.
- `src/parser/core.js`: pure bounded cloze row-drift correction and parser
  version.
- `src/owner-tool/owner-tool.css`: merged card and toolbar styles.
- `deployed/admin_questions.php`: read-only context/member payload and asset
  cache-bust; no contract change.
- `deployed/cbt.php`: shared owner CSS/render cache-bust only.
- `deployed/admin_context.php` and `deployed/context_lib.php`: only a read-only
  helper, semantic link group, and owner-facing labels/statuses; no mutation
  change.
- `tests/owner-tool.js`, `tests/context-admin.php`, and `tests/context-lib.php`:
  adoption, selector, member skip, phone-feedback behavior, payload, rendering,
  and status coverage.
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
  `context_type`, normalized `title`, normalized full passage text) adopts
  exactly one saved context.
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
  and two-context selector switching. The owner accepted the final
  Brave/Android re-check on 2026-11-13.

## Follow-up implementation notes (2026-11-11)

- Tool version `1.4.0` and shared cache token `2.3.2f` implement the six
  follow-up requirements without a parser/state/database change.
- A new linked context leaves Save Question tappable. Its button click stops
  before native validation and its submit path is also guarded; both show the
  exact required sentence. Safe native submits still run normally.
- Question metadata uses manual saved context, linked local context, then paste
  metadata. A saved-member skip now fills the next question before another save.
- Exact context create/update success collapses the editor. Show follows the
  selected card; error or ambiguity reopens the exact pending card, including a
  non-first card.
- The context-link PHP fragment is one semantic fieldset. The owner tool groups
  the remaining native fields separately, translates owner-facing copy without
  changing parser evidence/fixed flashes, and moves the existing safe preview
  beside Question Text.
- A focused implementation review found stale-form, stale-Show, and ambiguous
  multi-context paths; all were fixed and its closure recheck reports no open
  findings. The independent rigorous OT11 review is still pending.

## Consolidation implementation notes (2026-11-12)

- Tool version `1.5.0` and shared cache token `2.3.2g` implement the approved
  no-tab consolidation without a parser, schema, storage-key, or write-contract
  change.
- The page renders Add Question, Shared Texts, and All Questions as stacked
  full-width sections. Add Shared Text is moved with its controls into Shared
  Texts. Question Edit server-hides Shared Texts and All Questions and keeps the
  formatting/preview-only helper.
- A full paste first replaces the owner state and clears native question,
  metadata, link, and context-editor values. Empty inferred pool values remain
  empty. Key-only paste behavior is unchanged.
- Saved-context adoption now includes normalized full passage text. The
  read-only payload carries normalized identity keys and cloze tokens; exact
  lowercase underline markers and whitespace do not affect identity.
- Latest-20 question duplicates and full-identity shared-text duplicates show
  non-blocking notices. Correct answer, explanation, and media are excluded from
  normal identity.
- Saved Shared Texts uses 10-row `context_page` pagination. A separate
  unpaginated option query keeps every context available in `#context_id`.
- Manual saved-context selection preserves existing position/gap values or
  fills the first unused position and cloze token. Standalone questions hide
  the link group; reading passages hide Gap number. Saved editors now toggle
  Show/Hide without arming a write.
- Focused and full suites pass: 59 runner, 162 unit, 77 owner-tool, 14
  context-migration, 5 cbt-context, 14 context-lib, 23 context-admin, 6
  context-preflight, 9 PHP renderer, and 7 cbt-candidate. Cloze probe, 7 bank
  hashes, PHP lint, JS syntax, and `git diff --check` pass.

## Final follow-up implementation notes (2026-11-12)

- Tool version `1.5.1`; the changed admin `owner-tool.js` cache token is
  `2.3.2h`. Unchanged parser, renderer, CSS, and CBT assets remain `2.3.2g`.
- The native editor is moved after the injected paste panel and before the
  question form, so its collapsed controls precede the light-blue link group at
  desktop and 390px mobile width. At this checkpoint its heading was **Edit
  Shared Text**; the 2026-11-13 mode-specific headings supersede it.
- A stored-paste regression now includes a current item linked to a stale local
  context. On `?edit_context=N`, automatic `fillQuestion` preparation leaves the
  server editor untouched until Use Paste explicitly selects a new local card.
- Local Chromium reproduced shared text #11 being replaced by stored context #6
  before the fix and confirmed #11's full server values after it. No server
  write was made; the only console error was the staging favicon 404.

## Latest re-check implementation notes (2026-11-12)

- At this checkpoint, tool version `1.5.3` and cache token `2.3.3d` applied;
  the 2026-11-13 mode correction supersedes both.
  Multi-context preparation chooses the first unsaved card, exact save success
  advances to the next unsaved card, and question preparation cannot hide that
  draft. The selector is labelled **Shared text to edit**.
- Parser `2.3.3`; changed `core.js` uses cache token `2.3.3`. A row needs two
  independent segment starts at modal-minus-one before non-exact local
  boundaries move left one character. Existing rightward word snapping and all
  strict refusals are unchanged.
- The exact `new-sample.txt` fixture produces comprehension Q11-Q15 and cloze
  Q71-Q80, including Q75's four source options and zero warnings. The full
  `sample-passages.txt` owner regression creates both shared texts and permits
  Q71 with context position 1/slot 71; another regression covers an adopted
  first context plus saved-member skip.
- Focused staging Chromium confirms parser 2.3.3/Q75 and the adopted context #6
  path selecting/opening unsaved `SECTION 99`; no live write was used. One
  disposable local staging context (#12) was created during pre-fix PRG
  reproduction and left in the local staging database.

## Handoff package verification (2026-11-13)

- The owner clarified the original mode boundary: **Use Paste** fills only new
  drafts and never saved edits. Tool `1.5.4` enforces that rule for restored,
  explicit-route, and currently saved form states. Amber draft and blue edit
  headings, badges, borders, and backgrounds identify the modes.
- The changed tool uses cache token `2.3.3e`; changed CSS uses `2.3.3a`. The
  packaged production copies match their repository sources byte-for-byte. The
  full local suites, PHP/JavaScript syntax, and handoff manifest pass.
- Local staging at desktop and 390px confirms saved context #6 remains visible
  and unchanged through Use Paste; Add Shared Text then switches the same form
  to the amber draft heading, badge, hint, action, and empty ID without a write.

## Correction measurements

Package base remains `79a6a57`. Counts and hashes use LF-normalized UTF-8.

| Production file | Base delta +/− | Final lines / bytes | SHA-256 | Responsibility / deployment | Direct evidence |
|---|---:|---:|---|---|---|
| `src/parser/core.js` | +9 / −3 | 1432 / 49296 | `1321d95f046151e202c44eb8a18f9b1c9df39e2d31e001a73b639e49b4a71f67` | Parser 2.3.3 and bounded row-local cloze drift; deploy to `src/parser/` | 60 runner, 163 unit, exact `new-sample.txt` cloze probe, staging Chromium |
| `src/owner-tool/owner-tool.js` | +1231 / −278 | 2566 / 106477 | `c8f86b8f6ca61cb7b2f73750e442c564c07ecdb7f409fcdc9b2a1434b067818d` | State/controller, next-unsaved selection, draft-only paste filling, reachable saved-edit isolation, synchronized dynamic mode labels/hints, full-paste reset, full identity, next-free links, advisory duplicates, Show/Hide; deploy to `src/owner-tool/` | `node tests/owner-tool.js` 81 PASS |
| `src/owner-tool/owner-tool.css` | +85 / −51 | 291 / 4606 | `405a769288849033451e1a9f06cecedc4d7d29a6a90a10bccae89a411a5c1b8c` | Owner/context/CBT styling, stacked section boundaries, amber draft and blue saved-edit modes, duplicate notices, native form boundaries; deploy to `src/owner-tool/` | production stylesheet assertions; owner-tool tests |
| `deployed/admin_context.php` | +211 / −48 | 996 / 46688 | `0c5e1b83c30bb29b0892b2d3f00be36d1faca9f50e4aed68368dde649bcbf5c2` | Native shared-text draft/edit modes, pagination, semantic link group, identity/recent payloads; deploy to site root | `php tests/context-admin.php` 23 PASS; PHP lint; real rendered fragments |
| `deployed/context_lib.php` | +34 / −9 | 505 / 20353 | `0b1051a97708b9e8fddce9ec10b2637eee1b2b236ed10aae3d2c0f6a82a78673` | Context validation/query contract, paginated management list, unpaginated selector options; deploy to site root | `php tests/context-lib.php` 14 PASS; PHP lint |
| `deployed/admin_questions.php` | +7 / −6 | 1065 / 62892 | `7ec150d924cb834627745ac4d9c8f989276421e6ce36dc77b6b8081bf76817cb` | Narrow stacked-section/payload wiring; parser/tool/CSS use `2.3.3`/`2.3.3e`/`2.3.3a`; deploy to site root | context-migration and owner-tool tests; PHP lint |
| `deployed/cbt.php` | +2 / −2 | 1008 / 44515 | `697407e6022ce9f543a271664f69bc27816b52170389c0381544aa2b170b2de9` | Owner CSS `2.3.3a` and unchanged renderer `2.3.2g`; deploy to site root | PHP lint; prior OT10 candidate/runtime evidence remains applicable |

Live-origin cumulative additions remain within the contract:
`admin_questions.php` +100/−81 and `cbt.php` +53/−89 against their archived
2026-10-31 snapshots. The local `mcq-staging` copy, test-only DB/config shims,
`mcq_ot10_browser` rows/title labels, and temporary Chromium profile/probe are
excluded test artifacts and are not deployment files. The unrelated
`session-ses_e35a.md` owner/session note in the earlier WIP checkpoint is also
excluded from this package and deployment. The supplied root
`new-sample.txt`, local phone-staging tree/database (including context #12), and
temporary Chromium profile/probes are evidence/test artifacts, not deployment
files; the tracked `sample-cloze-left-drift` fixture is test input.

## Handoff

```text
Date: 2026-11-13
Result: draft-only Use Paste, visibly distinct saved-edit mode, next-unsaved shared-text selection, and parser 2.3.3 row-drift handling implemented; full local suites pass; owner accepted the final Brave/Android re-check; independent rigorous review pending
Files changed: src/parser/core.js, src/owner-tool/owner-tool.js, src/owner-tool/owner-tool.css,
  deployed/admin_questions.php, deployed/admin_context.php, deployed/context_lib.php,
  deployed/cbt.php, tests/unit.js, tests/owner-tool.js, tests/context-admin.php,
  tests/context-lib.php, fixtures/inputs/sample-cloze-left-drift.txt,
  fixtures/expected/sample-cloze-left-drift.json, AGENTS.md, docs/AGENTS.md,
  docs/SPEC.md, docs/DECISIONS.md,
  docs/STATUS.md, docs/INVARIANTS.md, docs/EDGE_CASES.md,
  docs/DEVELOPER-GUIDE.md, docs/DEPLOYMENT.md,
  docs/plan/README.md, docs/plan/prompts/phase-map.md,
  docs/plan/owner-tool/ot-10-release-and-handoff.md,
  docs/plan/owner-tool/next-steps.md,
  docs/plan/owner-tool/ot-11-phone-feedback-scratch.md,
  docs/plan/owner-tool/ot-11-owner-refinement-plan-2026-11-12.md, this file
Tests: node tests/owner-tool.js 81 PASS; node tests/runner.js 60 PASS;
  node tests/unit.js 163 PASS; context-migration 14 PASS; cbt-context 5 PASS;
  PHP context-lib 14 PASS; context-admin 23 PASS; context-preflight 6 PASS;
  php-render 9 PASS; cbt-candidate 7 PASS; extract-bank PASS; PHP/JS syntax and
  git diff check PASS; focused Chromium blocked/safe submit, group, preview,
  desktop/390px editor order, context #11/#6 edit-isolation, exact Q75, and
  adopted-member/next-unsaved probes PASS
Phone-feedback evidence: exact click/submit stop, metadata precedence, saved-card
  Show/Hide/error retention, semantic groups, plain copy, normal/context/edit
  preview placement, full-paste clearing, full identity, advisory duplicates,
  next-free links, independent pagination, multi-context ambiguity, editor
  placement, stored-paste edit isolation, next-unsaved selection, and bounded
  one-character cloze drift covered
Phone re-check: owner accepted the final Brave/Android confirmation on 2026-11-13 without a new live write
Review: focused implementation review findings closed; independent rigorous review pending
Commit: owner-authorized checkpoint commit/push requested 2026-11-13
Next: independent rigorous OT11 review
```
