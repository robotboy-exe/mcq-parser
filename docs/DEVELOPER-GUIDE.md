# Developer Guide — Owner Tool, Context Schema, and CBT Delivery

Recorded: 2026-11-08; updated for OT11 on 2026-11-13; suite evidence re-run
2026-11-14 at `f84518e`. This is the human-developer handoff for the
`owner-tool-2026-11` cycle. It covers the shipped architecture, source of truth,
stored state, parser extension rules, the context lifecycle, the security
renderer, testing commands, and known limitations. Deployment steps are in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## 1. Architecture map

| File | Responsibility |
|---|---|
| `deployed/admin_questions.php` | Standalone-question entry point: session/CSRF, login, native question form, PRG dispatch, renderer/asset wiring, and an inlined context-free save/delete behind a column probe. Includes `render.php` only; it must not include `admin_context.php`. |
| `deployed/admin_shared.php` | Shared-text entry point: login/CSRF/PRG, shared-text CRUD via `admin_context.php`, member questions with duplicated media uploads, combined recent-questions table, and the paste-to-draft panel. |
| `deployed/admin_context.php` | Admin context request handling, context CRUD/question-link mutations, paginated management rendering, and read-only owner payloads. |
| `deployed/context_lib.php` | Side-effect-free context validation and queries (slot tokens, member checks, link errors, status labels, paginated lists, and unpaginated selector options). |
| `deployed/cbt_candidate.php` | Complete-group candidate selection and repository queries for `cbt.php`. |
| `deployed/cbt.php` | Candidate setup, AJAX subject/category/year options, complete-group delivery, exam UI, result panel. Loads `render.js`. |
| `deployed/answer_details.php` | Supplied answer-details page. Uses `render.php` for question text. |
| `deployed/render.php` | Server-side safe renderer: escape first, restore only exact `<u>`/`</u>`. |
| `src/parser/core.js` | Pure parser 2.3.3. Owns the comprehension and cloze engines as internal IIFEs; exposes the parser API and `comprehensionEngine()`/`clozeEngine()`. |
| `src/owner-tool/render.js` | Shared client renderer and context-card renderer (`window.CBTText`, `window.CBTContext`). |
| `src/owner-tool/owner-tool.js` | Owner-tool state, paste/parse/fill, preview, underline, and controller. Reads the context APIs from `window` and runs without them. |
| `src/owner-tool/shared-texts.js` | The four context APIs (`window.CBTOwnerContexts`, `…Form`, `…Card`, `…Panel`) split out of `owner-tool.js`; loaded by `admin_shared.php`. |
| `src/owner-tool/shared-paste.js` | Shared-page paste client: parses a paste, queues drafts under `cbtSharedPaste:v1`, fills the native shared-text editor, refuses to touch a saved text. |
| `src/owner-tool/owner-tool.css` | Owner-tool, context-workflow, and CBT context styles. |
| `deployed/sql/01-context-migration.sql` | Rerunnable forward migration. |
| `deployed/sql/02-context-rollback.sql` | Guarded, non-destructive rollback. |
| `deployed/sql/README.md` | Migration/rollback runbook. |

**Ownership split (OT12).** `questions.context_id IS NULL` belongs to
`admin_questions.php`; everything else belongs to `admin_shared.php`. Each page
hides and refuses the other page's rows. The standalone page may read the
`context_id` column existence for its probe but must never write a context
column; the only shared schema it depends on is `questions` itself.

The owner tool is the production delivery path. `src/parser/parser.js`,
`src/ui/ui.js`, `src/bookmarklet.js`, and `src/bookmarklet.min.js` are legacy
evidence/test artifacts; do not extend them for product work.

## 2. Source of truth

- Product intent: `INTENT.md`.
- Behavior spec: `docs/SPEC.md`; rationale: `docs/DECISIONS.md`.
- Test status: `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`, `docs/STATUS.md`.
- Detailed agent contract: `docs/AGENTS.md`.
- Live safety: `docs/LIVE-SAFETY.md`.
- Archived migration docs and live sources: `archive/migration-docs/`,
  `archive/live-sources/`.
- Supplied SQL is archived unchanged at `archive/sql/2026-11-03-supplied/`; the
  only working-copy correction is `exam_category2` → `exam_category` in
  `deployed/sql/base-schema.working.sql`.

## 3. Stored state (`cbtOwnerTool:v1`)

The owner tool uses one versioned key. Do not read, migrate, or delete the
legacy `ocrQueue`, `ocrMeta`, or `ansKey` values.

```text
cbtOwnerTool:v1 = {
  version: 1,
  parserVersion: "2.3.3",
  queueId: string,
  metadata: { subject_id, exam_category_id, exam_year },
  contexts: [{
    localId, contextType, title, text, targets, expectedCount,
    subjectId, examCategoryId, examYear, serverId, stale
  }],
  items: [{
    num, stem, options, answer, flags, contextRef, contextPosition, contextSlot, ...
  }],
  answerKey: { "<question number>": "<letter>" },
  currentIndex: number,
  pendingSubmission: null | {
    queueId, index, fingerprint, kind, localId?
  }
}
```

Rules:

- A stored state with a different `parserVersion` is read-only until a full
  re-paste or explicit Reset. Never stamp it with the current version.
- `pendingSubmission` binds one native PRG request to the current queue and
  fingerprint. It prevents a stale response from being treated as a save.
- Loading, parsing, previewing, and filling the native form write no server row.
  Only the native form submit saves.
- Reset replaces the state with `emptyState` and clears the key/batch state.
- A new full paste also replaces every paste-derived native/context value before
  applying the parse. A key-only paste keeps the queue and contexts.

## 4. Parser extension rules

- Keep `src/parser/core.js` pure: no DOM, storage, network, or UI references.
- Bump `PARSER_VERSION` and the relevant asset token (`?v=…`) for any behavior
  change. The current parser version is `2.3.3`; `core.js` uses `2.3.3` and
  `owner-tool.js` uses `2.3.3e`, `owner-tool.css` uses `2.3.3a`, and the
  unchanged renderer uses `2.3.2g`.
- Add doc-backed fixtures in `fixtures/inputs/` and
  `fixtures/expected/*.json`. Never generate expected output from the parser;
  mark doc-unsupported fields `PENDING`.
- Comprehension: a bounded heading/passage becomes one context; each linked
  question carries one complete `(a)`–`(d)` set. Do not cross the passage
  boundary or merge two sets.
- Cloze: a gap passage plus an A–D table becomes one shared context. A gap token
  is exactly `[[gap:N]]` with the source number. Column starts are row-derived;
  boundaries stay word-safe. A local one-character left correction requires at
  least two row-derived starts at modal-minus-one. Refuse the whole group on an
  empty cell, an option over 500 characters, unmatched row/gap numbers, fewer
  than two gaps, or unstable alignment. Keep the first evidenced group and drop
  later colliding groups as a whole with a warning naming the shared gap numbers.
- Preserve the deliberate quirks and dangerous-area rules in `docs/AGENTS.md`
  (E/F→D, `splitQuestions` numbering guard, advisory flags, blank options,
  `FIXES` order, divider-only section separators, exact renderer markers).

## 5. Context lifecycle

1. The administrator loads a paste. The parser produces local context state and
   linked-question items; nothing is posted. The native Shared Context card is
   the only editor and is filled by the paste; Add Context reveals that same
   card for manual entry. Multiple contexts switch through one selector. When
   exactly one saved context matches pool, type, normalized title, and
   normalized full passage text, the card adopts it; a count mismatch only
   warns. A manual `#context_id` selection is authoritative and always
   available.
   The card sits directly below the paste controls, before the light-blue
   question-link group. A new draft is labelled **New Shared Text** with an
   amber draft badge; a saved edit is labelled **Edit Saved Shared Text** with a
   blue edit badge.
2. The administrator saves a draft context with the native form. The server
   validates input and returns a PRG flash. The owner tool embeds a read-only
   context/member payload for matching and member dedupe; it never writes a
   context or question automatically. A linked question cannot post first: its
   click/submit says `Save the shared context first.` Exact context-save success
   collapses the saved editor; **Show/Hide** toggles it without a write, while
   failed or ambiguous saves keep the pending card open. In a multi-text paste,
   the labelled selector opens the first unsaved text initially and after an
   exact success.
3. The administrator links questions with a unique position (comprehension) or
   a unique cloze slot (cloze). The selected saved context, then the linked
   local context, fills Subject, Exam Category, and Exam Year so the pool
   matches. Missing positions/gaps use the next unused saved value. Standalone
   questions hide the link group; reading passages hide Gap number. The three
   link fields are visually separate from Question details.
4. Activation validates the complete group atomically: expected member count,
   contiguous unique positions, required cloze slots, four options and a correct
   answer, matching pool metadata, and every member staying inactive.
5. An active context is delivered by `cbt.php` as a complete group. Its members
   remain `is_active = 0`, so legacy `is_active = 1` queries cannot expose a
   linked question alone.
6. Editing, deleting, moving, or unlinking a member deactivates its context
   until it is revalidated.
7. The rollback script refuses populated context data. If context data exists,
   restore the backup; do not run the automatic rollback.

The admin page has no tab shell. Add Question contains the paste controls, Edit
Shared Text, and the question form in that order. Saved Shared Texts and All
Questions follow as full-width sections. Saved Shared Texts uses `context_page`
at 10 rows; All Questions keeps `page` at 20. The question selector is
deliberately unpaginated. Duplicate notices are browser-only review hints and
never block a native save. **Use Paste** may fill `save_context` drafts, but it
must not change any shared-text field, action, or ID while the form is in
`update_context` saved-edit mode.

## 6. Security renderer

- Escape first; only exact lowercase `<u>` and `</u>` pairs are formatting.
  Everything else, including attributes, other tags, and encoded markers, stays
  text.
- `deployed/render.php` and `src/owner-tool/render.js` are behaviorally paired.
  Question and context text use the renderer; options and explanations stay
  plain text.
- Cloze gaps render as `<span class="cbt-context-gap">` or
  `<mark class="cbt-context-gap cbt-context-gap-active">`; the token text is
  escaped.
- Never use permissive `strip_tags` or raw `innerHTML` for stored question,
  option, explanation, or context text.

## 7. Testing commands

```sh
node tests/runner.js
node tests/unit.js
node tests/owner-tool.js
node tests/context-migration.js
node tests/cbt-context.js
node tools/cloze-probe.js
node tools/extract-bank.js --check
php tests/context-lib.php
php tests/context-admin.php
php tests/context-preflight.php
php tests/php-render.php
php tests/cbt-candidate.php
php tests/standalone-admin.php
```

Current local evidence, re-run 2026-11-14 on PHP 8.3.32 (the 8.3 target line;
the owner's 8.3.16 runs gave the same results) plus the recorded MySQL 8.0.41
migration run of 2026-11-08; the OT12 split was measured after commit `73009ac`:

- runner: 60 fixtures, 60 PASS, 0 FAIL, 0 PENDING;
- unit: 163 PASS; owner-tool: 81 PASS; context-migration: 14 PASS;
  cbt-context: 5 PASS;
- context-lib: 14 PASS; context-admin: 23 PASS; context-preflight: 6 PASS;
  php-render: 9 PASS; cbt-candidate: 7 PASS; standalone-admin: 9 PASS;
- `php -l` on every PHP file in this release (9 under `deployed/`,
  `db_conn.php`, the 3 `tools/context-migration-*.php`, and the 6
  `tests/*.php`) and `node --check` on the four changed owner-tool sources:
  PASS;
- `node tools/cloze-probe.js`: exit 0;
- `node tools/extract-bank.js --check`: PASS with all 7 source, slice, and
  output hashes matching on the LF checkout; the recorded Windows/CRLF
  `bank-pre-2026` mismatch remains a pre-existing target-worktree artifact;
- `parsePaste(sample-passages.txt)`: key `Q11 B, Q12 C, Q13 D, Q14 B, Q15 A` and
  `Q71-Q80`, with one 5-member comprehension context and one 10-member cloze
  context;
- desktop Chromium 155.0.8059.40 local harness: 33/33 checks passed (admin
  login, comprehension/cloze load, underline/paragraph preview, native PRG save,
  edit formatting tool, CBT complete-group delivery, answer-details XSS probes).
- focused Chromium 155 no-write check at desktop and 390px mobile width: Edit
  Shared Text appears between paste and the light-blue link group, and explicit
  edit #11 keeps its server values despite stored paste context #6.

No live site, staging database, or production cleanup was used.

## 8. Known limitations and open gates

- `questions.practice_title` is `NOT NULL` with no default in the supplied DDL,
  while the admin INSERT omits it. This is a known out-of-scope mismatch.
  Verify the target before deploying; do not change the column in this release.
- The migration preflight requires `utf8mb4_unicode_ci`. PDO `charset=utf8mb4`
  alone reports `utf8mb4_general_ci` on MySQL 8.0.41; the target connector/server
  must set the session collation.
- `header.php`, `footer.php`, and `cbt_exam_attempts` are live-site artifacts and
  are not supplied. The local smoke used an inferred test-only
  `cbt_exam_attempts` table and no header. Do not deploy either.
- `cbt_practice.php` and `practice_title` behavior remain outside the remaining
  cycle scope.
- The Brave/Android staging check was performed on 2026-11-09 and passed.
  Desktop Chromium passed. The owner accepted the final OT11 Brave/Android
  re-check on 2026-11-13; the phase-11 release review returned PASS WITH
  ACCEPTED FINDINGS on 2026-11-14.
- The `extract-bank` Windows/CRLF `bank-pre-2026` mismatch is pre-existing.
- This cycle does not deploy to production, clean live data, or archive itself
  without explicit owner instructions.

## 9. References

- Deployment: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Package plan: [`plan/README.md`](plan/README.md)
- Consolidation measurements:
  [`plan/owner-tool/ot-09a-production-consolidation.md`](plan/owner-tool/ot-09a-production-consolidation.md)
- Migration runbook: [`../deployed/sql/README.md`](../deployed/sql/README.md)
