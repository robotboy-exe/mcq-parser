# OT11 Owner Refinement Plan — 2026-11-12

- **Status:** implemented locally 2026-11-12; full suites pass; owner phone
  re-check and rigorous review remain pending
- **Applies to:** the uncommitted OT11 work on `owner-tool-integration`
- **Supersedes:** the in-page tab shell in the 2026-11-12 discussion and the
  title-only auto-match in D-73 / D-OT11-2
- **External gate:** owner Brave/Android re-check and the independent rigorous
  review after implementation
- **No change:** parser contract, database schema, CSRF/PRG field names, context
  activation contract, or the four-option rule

## Goal

Finish the owner-workflow refinements without adding tabs or another navigation
model. The logged-in page stays one page with three full-width sections shown in
order:

1. **Add Question**
2. **Shared Texts**
3. **All Questions**

Each section gets a clear heading and card boundary. There are no tab panels,
no hidden workspaces, and no second navigation path. On mobile the sections stay
full width and stack vertically.

## Locked decisions

1. **One page, stacked sections.** Add Question, Shared Texts, and All Questions
   are all visible in that order. Clear section headings and separators provide
   separation.
2. **Edit pages remain formatting-only.** The helper shows only underline and
   preview beside Question Text. No importer, shared-text editor, duplicate
   notice, tabs, or storage writes appear on edit pages.
3. **A full paste replaces all paste memory.** Before the new paste is applied,
   clear the native question fields, shared link fields, context editor, selected
   context, warnings, and pending submission. Saved server records remain.
4. **Empty inference clears fields.** When the new paste has no inferable
   subject, exam category, or year, clear those native fields. Do not leave a
   value from the previous paste or a manual context.
5. **Paste is the inference source.** The header supplies subject, exam category,
   and year. The parsed passage supplies type, title, text, target order, and
   expected count. The parsed order supplies passage number and cloze gap. The
   answer key supplies the correct answer. Saved shared texts only supply saved
   IDs and existing member positions/slots after the paste identifies the
   passage.
6. **Full shared-text identity.** Auto-match a parsed passage to a saved passage
   using subject, exam, year, type, normalized title, and normalized passage
   text. One match binds, multiple matches warn and remain manual, no match
   stays a draft. Member-count mismatch remains a warning.
7. **Manual selection stays authoritative.** A native shared-text selection
   supplies the question pool. It also chooses the next free passage number and,
   for cloze, the next free gap number unless the current question already has
   values.
8. **Edit Shared Text follows the paste.** Remove duplicate context controls from
   the question helper. Place the one native editor directly below the paste
   panel and above the light-blue question-link group; keep only the paginated
   saved table in the lower Shared Texts management area.
9. **Duplicate notices are advisory only.** Show a visible notice; never reject,
   disable Save, auto-skip, auto-overwrite, or change the server contract.
10. **Duplicate scope.** Shared text uses full identity above. Normal questions
    use subject, exam, year, normalized question text, and normalized options
    A-D against the latest 20 saved questions overall. Correct answer,
    explanation, and media are excluded.
11. **Copy.** Rename Start Over to Reset. Remove the expected-count note. Change
    the target note to `List question numbers in order.` Change `Change` to
    `Edit` and `Changing shared text #` to `Editing shared text #`. Keep the
    activation note unchanged.
12. **Show/Hide.** A saved shared-text editor toggles between Show and Hide
    without saving or marking the card stale.

## Implementation plan

### 1. Full-paste reset and metadata ownership

In `src/owner-tool/owner-tool.js`:

- Add one reset path used by a full paste before the new state is installed.
  It clears question fields, context link fields, the native context editor,
  selected/expanded context state, warnings, and pending submission.
- Keep key-only paste behavior unchanged: it replaces the answer key and leaves
  the existing question queue/contexts intact.
- Make `applyMetadata` authoritative: linked local context, then manual saved
  context, then new paste metadata for standalone questions. Empty standalone
  values clear the native fields.
- Keep `saveMetadata` limited to standalone questions so manual context values
  do not overwrite the paste metadata used when the owner returns to a
  standalone question.
- Keep `mapContexts` limited to contexts actually parsed from the paste. Do not
  create a blank editor card during a paste.

### 2. Links, positions, and gaps

- Keep `syncLinks` as the single source for `contextRef`, `contextPosition`, and
  `contextSlot`.
- On manual saved-context selection, fill the next free position from that
  context's saved members, and for cloze fill the next free `[[gap:N]]` token.
  Preserve the current position/gap when the current question is already linked.
- Hide the `Gap number` control for reading passages.
- Label the controls `Shared text`, `Passage question number`, and `Gap number`.
- Hide the shared-text block on Add when the current paste/context has no
  passage.

### 3. Page layout

In `deployed/admin_questions.php` and `src/owner-tool/owner-tool.css`:

- Wrap the logged-in workflow in one section stack:
  `Add Question` → `Shared Texts` → `All Questions`.
- Keep the owner paste panel and native question form in Add Question.
- Place the native shared-text editor below the paste panel and before the
  question form; keep the saved table in Shared Texts management below Add.
- Keep filters and the question list in All Questions.
- Stop moving the native shared-text section at runtime; it stays where the
  server rendered it.
- Add compact section headings, dividers, and scroll margins. Do not add tabs,
  tab buttons, hidden panels, or tab query state.
- Keep the existing safe-save block, preview placement, and form grouping.

### 4. Shared-text pagination and controls

In `deployed/context_lib.php`, `deployed/admin_context.php`, and
`deployed/admin_questions.php`:

- Paginate saved shared texts at 10 per page with a separate `context_page`
  query key. Keep question pagination on `page`.
- Add a context count helper, optional limit/offset to the context list, total
  pages, and page clamping.
- Preserve `context_page` in shared-text pagination links and edit/cancel links.
- Add Show/Hide for saved shared-text cards. Toggling is presentation-only.
- Remove the expected-count helper note.
- Change the target-order note to `List question numbers in order.`
- Rename the table action from `Change` to `Edit`.
- Change the editor status from `Changing shared text #` to
  `Editing shared text #`.
- Keep Add Shared Text inside the one native Edit Shared Text card.

### 5. Duplicate notices

- Add a read-only latest-20 question payload to Add Question. Include only the
  fields needed for comparison: question ID, subject, category, year, question
  text, and options A-D. Exclude correct answer, explanation, media, and edit
  payloads.
- Compare normalized question text and options against that payload. Show one
  non-blocking notice near Question Text.
- Add compact normalized identity keys to the shared-text payload, or compare
  normalized text directly if payload size remains acceptable. Do not send
  fields that are not needed for matching.
- Compare shared text by type, subject, exam, year, normalized title, and
  normalized text. Exclude the context currently being edited. Show one
  non-blocking notice near the shared-text form.
- Normalize consistently: trim, lowercase, collapse whitespace, ignore exact
  `<u>`/`</u>` markers, keep punctuation.
- Do not add duplicate detection to edit pages.

### 6. Tests and verification

- Owner-tool tests: full-paste reset, stale metadata clearing, no old context
  editor values, next free position/gap, full-identity adoption, shared-text
  duplicate notice, normal-question duplicate notice, Show/Hide, Reset copy,
  section layout, and hidden gap for reading passages.
- PHP tests: context list limit/offset and count, 10-per-page page data,
  clamping, identity keys, latest-20 payload, and copy changes.
- Static/contract tests: no tab shell; Add Shared Text absent from Add; edit
  pages remain formatting-only; no server duplicate rejection.
- Run at minimum:
  - `node tests/owner-tool.js`
  - `php tests/context-lib.php`
  - `php tests/context-admin.php`
  - `node tests/context-migration.js`
  - `php -l` on every changed file under `deployed/`
- Update `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/INVARIANTS.md`,
  `docs/EDGE_CASES.md`, `docs/DEVELOPER-GUIDE.md`, and the OT11 package record
  after implementation and verification.

## Acceptance

| Check | Expected |
|---|---|
| Page shape | Three full-width sections in order, clear headings/dividers, no tabs |
| Add section | Paste panel, Edit Shared Text, then question form and relevant shared-link block |
| Shared Texts section | Saved table, 10/page pagination; the editor's Show/Hide remains above the question form |
| All Questions section | Existing filters and 20/page list |
| New paste | Old native fields and context editor cleared before new values apply |
| Empty inference | Subject/category/year cleared, not left from the prior paste |
| Auto-fill | Paste supplies pool, passage fields, order/gap, and answer |
| Full identity | Saved passage binds only when title and text identity match; otherwise manual |
| Manual link | Saved context supplies pool and next free position/gap |
| Duplicate notice | Visible, non-blocking, latest-20 for normal, full identity for shared |
| Edit page | Formatting and preview only; other tool aspects invisible |
| Copy | Reset, target note, Edit/Editing, no expected-count note |
| No regressions | Exact flashes, CSRF/PRG, four-option rule, and activation contract unchanged |

## Risks and notes

- Full identity matching will bind fewer passages than title-only matching. This
  is intentional; manual selection remains the fallback.
- PHP and JS normalization must stay identical or shared-text duplicate/adoption
  comparisons drift.
- The latest-20 normal duplicate scope is global unless the owner later asks for
  a filtered scope.
- This plan does not change the parser, the bookmarklet build, or database
  schema. `src/bookmarklet.js` must not be edited.
- Current uncommitted OT11 work is the base; do not discard existing phone
  feedback changes while applying this plan.

## Implementation result

- Tool version `1.5.1`; changed `owner-tool.js` token `2.3.2h`; unchanged
  parser/renderer/style assets remain `2.3.2g`.
- All acceptance rows above are implemented. The paginated management list and
  unpaginated question selector use separate production queries so page two
  never removes valid link choices.
- Normal duplicate payload is capped at the latest 20 rows and excludes answer,
  explanation, and media fields. Shared identity payload includes normalized
  title/text keys and cloze slots.
- Production contracts remain unchanged: no schema/parser/bookmarklet change,
  no automatic write, and no duplicate server rejection.
- The final owner follow-up places Edit Shared Text directly below paste and
  prevents stored queue/context state from overwriting `?edit_context=N` before
  an explicit Use Paste.
- Verification: 59 runner, 162 unit, 77 owner-tool, 14 context-migration, 5
  cbt-context, 14 context-lib, 23 context-admin, 6 context-preflight, 9 PHP
  renderer, and 7 cbt-candidate tests pass. Cloze probe, seven bank hashes, PHP
  lint, JS syntax, and `git diff --check` pass.
- Live-origin limits remain satisfied: `admin_questions.php` is +100/−81 and
  `cbt.php` is +53/−89 against the archived 2026-10-31 sources.
