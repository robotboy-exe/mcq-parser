# Instructions for Future Agents

Read this before changing any parser or UI code. It is derived from the archived
migration docs and the baseline in `src/`. It deliberately does not propose new
features.

## Working context

- The user works on a phone (Brave on Android); keep explanations plain and
  replies short.
- Do not add unused files, speculative features, or refactors for style.

## Canonical parser core

The pure, canonical parser implementation lives in `src/parser/core.js` (API
version `2.4.0`). It contains the pure comprehension and cloze engines,
including scoped `(a)`-`(d)` parsing, gap/table detection, column inference, and
synthesized cloze items. Node resolves this module through `require` for the
historical parser suite, and `deployed/admin_questions.php` loads it from
`src/parser/core.js` before `ocr_helper.js`, so the browser and the tests run
the same implementation. It exports:
- Pure regexes: `FIXES`, `OPTION`, `KEY_LINE`, `PLACEHOLDER`, `STEM_LINE`, `KEY_WORD`, `INLINE_PAIR`, `LOOSE`.
- Pure parsing & inference: `parseHeader`, `pickSubjectIndex`, `pickCategoryIndex`, `splitRegions`, `splitQuestions`, `splitBulletQuestions`, `splitQuestionItems`, `splitQuestionRegions`, `parseQuestion`, `parseStimulusRange`, `extractStimuli`, `applyStimulusFlags`, `flagNumberingGaps`, `splitSections`, `salvageNormalize`, `splitSectionsWithSalvage`, `keyPairs`, `parseKeyDetailed`, `parseKey`, `parsePaste`, `comprehensionEngine`, `linkComprehension`, `clozeEngine`, and `mergeClozeItems`.
- Browser & Node compatibility: Works in Node (`module.exports`) and Browser (`window.OCRParser`).
- Zero dependencies: No DOM, storage (`localStorage`), fetch, or UI/form references.

`src/parser/parser.js` is a thin Node compatibility facade: it exports the exact
core identities plus the named stimulus autosave helpers from
`src/bookmarklets/stimulus/autosave.js`, and defines no parser logic. The
stimulus bookmarklet inlines the canonical core, that autosave module, and
`src/ui/ui.js`; the facade is never inlined into a generated product.

Root `ocr_helper.js` is a thin adapter: Node resolves the core through
`require`, the browser reads `window.OCRParser`, and the adapter owns only
`FIXES` normalization, `parseAll`, the queue panel, and `fillForm`. Do not add
parser logic back to it.

The deployed helper and the key/autosave bookmarklet are separate products.
`ocr_helper.js` is the deployed manual product and is byte-aligned with the
reviewed published baseline; it must never regain answer-key load, dry run,
autosave, in-place save, image plan, batch history, or a bookmarklet title. That
behavior lives only in `src/bookmarklets/key/entry.js`, which the dedicated
build inlines with the canonical core and `boot.js` into
`src/bookmarklets/key/bookmarklet.js`.

### Region model (RM01)

`splitRegions(text)` classifies every line once as `blank`, `divider`, `key`,
`stem`, `option`, `heading`, `instruction`, or `text`, then applies three rules:

- Options bind to the nearest preceding stem; headings and instructions bind to
the nearest following stem. A heading or instruction after an option block is
removed from that option and carried forward.
- Splitting happens only on stems. Leftover text with at least two option
markers and no stem stays a `num: null` orphan item; leading prose becomes a
`passage` region instead of being dropped.
- No option value may contain a heading or instruction line; a violation raises
the advisory flag `option X contains section heading or instruction`.

`parsePaste` returns `regions` as `{kind, text, from, to}` and items may carry
`sectionInstruction` (the governing heading and instruction text). The
`question` field stays clean. The numbering guard is preserved.

Option labels follow the D-91 production contract in the canonical core too:
A–F, case-insensitive, with optional whitespace around `(`, `)`, and `.`, a
label alone on a line before its punctuation, and a later label-like repeat of
an already selected letter kept inside that option's text.

## Production path

Root `ocr_helper.js` is the shipping OCR helper loaded by `admin_questions.php`. It parses pasted OCR text into the native question form;
queue and metadata use `ocrQueue` and `ocrMeta`, and the legacy `ocrSubmitted`
marker is written on submit and deleted on the next load. Do not change those key
names or shapes. The deployed helper holds no answer key, no autosave, no dry
run, no `fetch`, and no session paste state.

`src/bookmarklets/key/` is the key/autosave product: `boot.js` removes the
deployed page's panel and error banner, `entry.js` owns key load/fill, dry run,
autosave, Stop settlement, and in-place save, and `build.js` generates the
bookmarklet. `entry.js` replaces its capture submit listener on a second click so
a second bookmarklet click does not stack handlers. It uses `ansKey`, the shared
`ocrQueue`/`ocrMeta` shapes, and `ocrPaste` in `sessionStorage`; it never writes
`constant_text` and never touches the deployed helper. It deletes the deployed
helper's stale `ocrSubmitted` marker before and after an in-place save so the
next page load cannot advance the queue twice; it never writes that key, and no
other new module may read or write it. It must never read that marker at startup:
a marker already present when the bookmarklet is injected is not evidence that
this product saved the current question, so it must not advance, rewrite, or
refill the queue. A queue's key provenance is its `how` string, which only the key
product writes; a key-only paste that confirms a page-helper list sets
`how: 'key-paste'`. Without a `how` string a retained `ansKey` stays inert.

`src/underline-toolbar.js` adds the runtime Underline button for Constant Text,
question text, and options A–D. `src/owner-tool/render.js` remains the browser
renderer used by `cbt.php`; `deployed/render.php` is its server-side twin and
adds `cbt_format_text` for the other server pages. Both escape first and restore
only the six exact lowercase marker pairs: `<u>`, `<frac>`, `<sup>`, `<sub>`,
`<sqrt>`, and `<matrix>`. Fractions split at their first top-level `/`, matrices
at their four top-level `|` cells, and everything malformed stays literal. Never
render stored question text with permissive `strip_tags` or unrestricted
`innerHTML`.

`src/question-preview.js` creates the read-only admin preview for Constant Text
and Question and uses `window.CBTText`; it must never write form values, storage,
or the network. Its Constant Text preview is a fixed 150px border-box with
vertical scrolling, while the Question preview stays content-sized.
`src/math-tool.js` mounts the operator row, the five freeform
shape editors (fraction, exponent, subscript, root, 2×2 matrix), the restored
`More symbols` drawer, and the advisory byte counter around `#question_text` in
the same Add and Edit forms; the basic operator row excludes `√`, so the visual
Root editor is the only square-root control, and the drawer restores only the
Greek, set theory and logic, and geometry and vectors grids because the visual
editors already cover exponents, subscripts, fractions, and square root. It
inserts only exact shape markers, has no storage,
network, submit,
underline-marker, or `constant_text` behavior, and the server's 60,000-byte check
plus the native `maxlength` remain authoritative.
Root `ocr_helper.js` has no `constant_text` integration. A
passage/cloze-shaped paste may follow the ordinary-question fallback and carry
review flags, but it must never populate Constant Text.

`deployed/admin_questions.php` logs every question save/update `PDOException`
and, under D-106, also appends its exact message to the existing failure lead-in
for the logged-in administrator. The page's `h()` helper must remain the sole
rendering path for that message; do not expose it outside the authenticated save
branch.

`deployed/cbt_question_order.php` is the focused EL01 candidate-ordering helper.
It runs only after `cbt.php` completes its existing filtered, random, limited
selection and only for the trusted exact database subject name
`English (Lexis & Structure)`. Equal non-empty exact Constant Text values form
groups whose members are restored to their original question order (ascending
`id`), not the random row order; blank values are singleton groups. It must never change
the selected ID multiset, row values, query, limit, or another subject.

`deployed/subject_display.php` maps only that exact stored subject name to
`English (Comprehension Pages / Lexis & Structure)` for visible output on
`admin_questions.php` and `cbt.php`. Form values stay numeric IDs, the ordering
helper still receives the unmodified database name. In the `cbt.php` exam view,
Constant Text remains weight 800
and the still-bold question stem remains weight 700 (D-108).

D-91 is the root-helper label contract. A-D is case-insensitive;
whitespace is optional after `(`, before `)`, and before `.`, and every unspaced
form remains valid. Once a letter's boundary is selected, a later label-like
repeat of that letter stays in the option text. The review-settled phase-1
implementation has direct regression evidence for that boundary rule.

The shared-text/context subsystem is archived under
`archive/owner-tool-2026-11/` and is not loaded. The bookmarklet sections below
describe the legacy artifact, retained as evidence and not a production
deliverable.

## Ground rules

1. **The migration docs are the contract.** Read
   `archive/migration-docs/claude-migration.md`,
   `archive/migration-docs/qwen-1-gaps*.md`,
   `archive/migration-docs/qwen-2-gaps.md`, and
   `archive/migration-docs/qwen-2-reconciled.md` before editing. Read
   `archive/migration-docs/claude-gaps.md` for the pre-workspace gap report and
   its Phase 9 triage. Server-side claims and the current subject list are
   corroborated by `archive/live-sources/` (`admin_questions.php`,
   `admin_questions.html`).
2. **Do not refactor for style.** The docs repeatedly say the code is a working
   baseline, not a refactor target (qwen-2 H08). Make only changes you can
   test.
3. **Do not modify the PHP server contract or the database.** The `deployed/`
   copies are working copies: a package may change rendering, asset includes,
   and style there only when that package says so, and never the contract below.
   CSRF handling, upload handling, the PRG flow, field names
   (`save_question`, `correct_option`, `option_a`–`option_d`), the four-option
   rule, and the success flash text are off-limits (qwen-2 H03; INV-06). Root
   `ocr_helper.js` is production code; change it only for a package with a
   regression test and preserve the queue/fill behavior.
4. **Do not change `localStorage` key names or shapes.** The production helper
   uses `ocrQueue` and `ocrMeta`, plus the legacy `ocrSubmitted` marker that it
   writes on submit and deletes on the next load (live-helper parity). `ansKey`
   and `ocrSubmitted` are legacy key names shared with old helpers; do not
   rename or reshape them. Auto-Save
   adds `batchId`, `ansKeyBatch`, `ansKeyConflicts`, `ocrSaving`, `ocrSavedLog`,
   `ocrBatchHistory`, and `autoLock` for the archived bookmarklet; `ocrQueue`
   items may add `stimuli`/`needsImage` (D-59/D-60). Additions are allowed,
   existing shapes must stay compatible (D-30, D-32, D-36, D-57). Reset Queue
   keeps `ocrBatchHistory`; it is display-only and must never block a save.
5. **Edit modules, not the build output.** `src/bookmarklet.js` and
   `src/bookmarklets/key/bookmarklet.js` are generated. Change
   `src/parser/core.js` + `src/bookmarklets/stimulus/autosave.js` +
   `src/ui/ui.js`, or `src/bookmarklets/key/boot.js` + `entry.js`, then rebuild
   the matching artifact. `src/parser/parser.js` is only a Node facade and is
   never inlined. `src/bookmarklet.min.js` is an untracked local artifact; do not
   edit, rely on, or rebuild it.
6. **The bookmarklet is a single line with no comments and no `%HH`.** Full-line
   `//` comments are allowed in the modules and stripped by `build.js`; inline
   `//` comments remain forbidden (INV-05). The build fails if the output
   contains a `%HH` percent-escape, because a bookmark manager may decode it
   (D-110; a bare `%` is allowed).
7. **Preserve behavior even when it looks wrong.** E/F→D, the +5 numbering
   guard, flags being advisory, and the absent post-processor are deliberate.
   Fix only with a failing fixture and a documented decision.
8. **Live site writes follow `docs/LIVE-SAFETY.md`.** By default, the agent
   does not delete or clean up live records. A live write needs per-action
   approval for the exact IDs and fields. If a delete is explicitly authorized,
   use the row's own form, click its button, assert the confirm names the exact
   ID, and require the exact success flash. Never submit a delete form directly
   or use a first-match selector.

## Dangerous areas

| Area | Why it is dangerous |
|---|---|
| `OPTION` regex | Tightly coupled to inline options, dotless-newline options, and leading prose articles. Three separate regressions already occurred here. Never add `^` to the dotless branch; never remove the whitespace-prefixed dotted branch; never pre-collapse newlines (qwen-2 H05; R01–R04). Keep the `B.C.` abbreviation skip (D-48), the spaced-initialism filter (D-111), the spaced-slash normalization (D-49), and the bounded missing-label repair (D-47) separate from the main regex. |
| Root-helper `OPTION` (D-91) | This is separate from canonical core `OPTION`. It must compose optional whitespace after `(`, before `)`, and before `.` across A-D uppercase/lowercase labels without letting a later repeat of an already selected letter replace that boundary. Do not treat a broad `\s*` before `[.)]` plus last-match selection as complete. The exact `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` regression must keep the internal `A )` in Option A without a duplicate warning. |
| Blank `C.` / `[^\S\n]*` | The horizontal-whitespace class is what keeps a blank option from consuming the next label. Changing it can resurrect the "option D missing" bug (INV-23). |
| Loose E/F (`LOOSE`) | Can mistake a continuation line such as `F = ma` for Option F. Do not broaden it (claude §5.3). |
| Cloze recognition and columns in `core.js` | Every refusal is deliberate. Column starts must stay row-derived (the header indent is shifted by the row labels), boundaries must stay word-safe, and no column work may follow a global whitespace collapse. A one-character local left shift requires at least two row-derived modal-minus-one anchors; do not broaden it into nearest-column guessing (INV-128, D-80). A gap token is exactly `[[gap:N]]` with the source number; never renumber rows or keep dotted runs. Refuse the whole group on an empty cell, an option over 500 characters, unmatched row/gap numbers, fewer than two gaps, or unstable alignment (INV-104–INV-107, D-68). A later cloze group that repeats an earlier group's gap numbers is dropped whole with a naming warning; keep the first group and never emit a zero-member context (INV-109, D-70). |
| `splitSections` | Rule order (divider → key-only → header → structure) is fragile. A false positive splits a question; a miss leaves key lines in the question stream (claude §5.9). Divider-only runs of three or more equals signs (`========`) are section separators and are blanked before line slicing. Keep that predicate narrow (D-46). |
| `splitQuestions` numbering guard | `n <= last || n > last + 5` drops repeats and large jumps. It can merge real questions after a restart or OCR digit error (INV-21, INV-24). |
| `salvageNormalize` / `splitSectionsWithSalvage` | The repair must stay a no-op on bank text. The `inserts >= 2` trigger and the `after > before` chunk gate are mandatory; a repair that does not add questions must be discarded and the strict result kept byte-for-byte (INV-72). |
| `splitBulletQuestions` / `splitQuestionItems` | Bullet mode is only for text with no line-start `N.` marker. Never invent numbers: bullet chunks keep `num: null` and the `question number missing` flag. Do not mix bullet and numbered chunks in one paste (INV-74). |
| `extractStimuli` / `applyStimulusFlags` | The block must stay inside one question chunk and must not remove a question or option line. Standard intro needs table evidence; `[missing text]` is not a marker; a marker with no valid block removes only itself. Preserve blank lines outside a removed block and remove those inside it, or paragraph cleanup will delete/invent structure. `applyStimulusFlags` must clear old `needsImage`, assign order by queue order, and keep out-of-paste targets in `missing` (D-59, D-66, INV-92, INV-93). |
| Exact-text renderers | `src/owner-tool/render.js` and `deployed/render.php` must remain behaviorally paired: escape first, format only balanced lowercase exact `<u>`, `<frac>`, `<sup>`, `<sub>`, `<sqrt>`, and `<matrix>` pairs, split fractions and matrices only at top-level separators, and keep every unsupported/malformed marker literal. Both run `tests/fixtures/render-markup.json`. Candidate paths use DOM nodes; options/explanations stay plain (D-66, D-97, INV-97–INV-99). |
| English Lexis ordering | Group only the rows already selected by `cbt.php`, activate only from the trusted exact subject name, keep `NULL`/empty rows independent, restore each group's members to ascending original `id` (authored order), preserve every row field, and never move grouping into the SQL selection (D-96, INV-143–INV-144). |
| English Lexis subject operation | `03` omits the ID and changes only `is_active` on an exact existing row; `04` deactivates and never deletes. Both refuse a collation-only collision or incompatible key contract. The real 8-check harness passes on isolated Oracle MySQL Community Server 8.0.41 ARM64 (D-95, INV-142). |
| English Lexis display alias | Keep `English (Lexis & Structure)` persisted and use `cbt_subject_display_name()` only on `admin_questions.php` and `cbt.php`. Do not pass the alias into grouping, change subject IDs, or add an SQL rename; preserve CBT weights 800/700 for Constant Text/question (D-108, INV-150–INV-151). |
| Owner parser-version refusal | A stale `cbtOwnerTool:v1` value is read-only. Key-only paste and native submit must not call a path that stamps it with the current parser version. Only full re-paste or explicit Reset replaces it (D-66, INV-95). |
| `fillForm` / `tick` | They must agree on the E/F→D mapping and on ticking nothing when E/F text is absent. `tick()` computes radio index 3 for E/F; radio values 4/5 do not exist (INV-27, INV-28, INV-30). |
| Save detector | Hard-coded to the exact success text. The archived PHP confirms the PRG flash flow, so the detector matches the server contract. Do not change one side without the other (INV-49; qwen-2 H07/H09). |
| Live delete/cleanup | The admin delete is a hard SQL `DELETE` that also removes media. Its only guard is the per-row `onsubmit` confirm, which `.submit()` bypasses. Never delete live records or use a first-match delete form. See `docs/LIVE-SAFETY.md`. |
| Header inference | First `19\d\d`/`20\d\d` in the first 3 lines can be a copyright/reference year; fuzzy subject matching can pick the wrong option for names that share words. Both are known risks (EC-61, EC-43; INV-44). EC-44 is confirmed by the PHP. |
| Auto-Save gate | `autosaveBlockers` is the safety wall. Do not weaken or reorder it to make a batch run; add a documented decision and a test first. It must block gaps, inexact key coverage, conflicts, E/F, flags, bad options, missing meta, an unticked confirmation, a changed confirmation snapshot or mode, markers, lock, hidden, current-batch saved-log, prior-batch fingerprints, recent duplicates, an edited form, unassigned detected stimuli, out-of-paste image ranges, and an uncovered `needsImage` question (D-33, D-34, D-39, D-51, D-56, D-59, D-60; SPEC §7.3). Diagram/table words alone do not block; the uploader owns the image plan (D-38). |
| Save marker/classification | `ocrSaving` is cleared only on definite Saved/Rejected. Ambiguous keeps it, disables Start, and never retries. Saved requires a redirect, no `.admin-error`, the success regex, and an ID above every logged ID (INV-64, INV-65). |
| Auto-Save lock/loop | Use the recursive `setTimeout` heartbeat and `autoLock`; never use `setInterval` as the engine, `MutationObserver` for success, or `button.click()`/`requestSubmit()` to advance. A hidden tab finishes the current save and pauses (INV-67). |
| Dry run | It must copy the queue, use current metadata, POST nothing, and write nothing to `ocrQueue`, `ocrSaving`, `ocrSavedLog`, `ocrBatchHistory`, or `autoLock` (INV-68). |
| Dry/live run state | Dry and live have separate state, panels, progress, and blockers and are mutually exclusive; auto dry runs after Load/key-only Load and becomes `STALE` when its inputs change (event-driven; no stored-stamp poll). Live `COMPLETE` beats Stop; a live run token stops an old loop from overwriting a new Load's idle state, and an unexpected run error ends `BLOCKED`; reload state comes only from `deriveLiveState(queue, savedLog)`, with no run-state key and no auto-resume (D-58; INV-90, INV-91). |

## Field contract

`docs/SPEC.md` §3.5 is authoritative for what each native form field accepts.
`question_text` and options A–D never receive section headings, instruction
lines, dividers, shared stimulus/table text, E/F options, the answer key, or
question numbers. Out-of-scope lines are dropped, never reassigned to the
nearest field. A heading or instruction after an option block must not become
Option D text. `sectionInstruction` and `regions` are internal metadata; the root
helper never surfaces them (D-109; INV-154, INV-155).

## What to preserve

- Multiline rendering stays: single OCR wraps fold to one space, real blank-line
  paragraphs remain as `\n\n`, Constant Text and question stems render with
  `white-space: pre-wrap`, and options stay single-line. Do not replace this
  with a blanket whitespace collapse or `innerHTML`.
- A key-only paste keeps the queue; a questions paste replaces or clears the
  key (INV-32, INV-33).
- Constant Text is optional per question. A successful save/update stores it and
  sets the session prefill; a new-question GET shows that session value; an edit
  GET shows the row value and must not overwrite the session. Login and logout
  clear the session value.
- The underline tool acts on the last-focused of Constant Text, question text,
  and options A–D. It writes exact lowercase `<u>`/`</u>` and refuses partial
  marker overlap or nested pairs.
- The root helper must satisfy D-91: A-D labels are case-insensitive; whitespace
  is optional after `(`, before `)`, and before `.`, unspaced forms remain valid,
  and a later repeat of an already selected letter remains option text. Keep
  uppercase normalization and queue/storage/fill behavior unchanged.
- Blank options stay blank; a later option is not pulled into their place
  (INV-16).
- A second complete A–D set with no visible question-number boundary is
  flagged as a possible merged paste; duplicate labels inside one selected set
  are not flagged solely for duplication (INV-17, D-55).
- A shared stimulus block is removed from the preceding question and attached
  as ordered metadata; target questions get `needsImage`. The image plan is
  in-memory and is never stored (D-59, D-60; INV-92–INV-94).
- Flags are advisory and never block load/queue/save (INV-20).
- Numbering gaps are flagged on the later question via `flagNumberingGaps`
  (D-29, INV-59); repeats and large jumps are still skipped.
- E/F collapse into Option D; with a key D is replaced and ticked, without a key
  E/F is appended and nothing is ticked (INV-27, INV-28).
- No radio is pre-ticked without a key; always clear the form default (INV-29).
- `FIXES` applies to the question part only, before parsing (INV-38).
- Reset Queue uses `{ items: [], i: 0 }` and also clears `ansKey`,
  `ansKeyBatch`, `ansKeyConflicts`, and `batchId` (INV-34, INV-41; D-30).
- The key is read from `ansKey` at boot and survives reloads (D-25).
- Manual saves keep `is_active` ticked during fill and submit. Draft auto saves
  remove it from the form and verify the edit page shows inactive; active auto
  saves set `is_active=1` and verify it shows active; both set `autosave=1`
  (D-31, D-39, INV-50).
- The success/error container `#ans_res` is inserted after the submit button
  (INV-03).

## What to avoid

- Reintroducing `new RegExp(` with template strings for option splitting; the
  escaping was wrong before and silently failed (claude §5.1, §10).
- Adding a post-processor without correct escaping and tests against
  `Vitamin C.` and `Vitamin B-12` (INV-22).
- Changing the key lifecycle (including Reset-vs-key) without an explicit
  product decision; D-30 now fixes Reset to clear the key and batch ids.
- Clearing `ocrSaving` on an ambiguous result, retrying an ambiguous save,
  writing `ocrSavedLog` before a verified save, or silently skipping a duplicate.
- Reintroducing an auto-save run cap without an explicit decision. The
  10-save cap was removed on 2026-10-26 (D-43); the per-question gate,
  confirmations, Stop, lock, hidden-tab pause, duplicate checks, and the
  two-unverified stop remain. Two-tab lock evidence is limited on one phone
  browser because hide-pause releases the lock when tab 1 becomes hidden; use
  the unit/mock evidence for the lock reason.
- Treating this bookmarklet as part of the PHP Bulk Import plan; no link
  between them was decided (claude §8 issue 10).
- Reading, writing, deleting, or relying on `ocrSubmitted` in the bookmarklet;
  it is deliberately self-contained (INV-40; D-27). Root `ocr_helper.js` is the
  one exception: it keeps the legacy submit-write/boot-delete for live parity.
- Submitting a live delete form directly, selecting the first
  `delete_question` form, or treating "clean up the test rows" as part of a
  browser check. Cleanup is owner-only; see `docs/LIVE-SAFETY.md`.
- Trusting an existing `ocrQueue` after changing parser/UI code. There is no
  version marker; reset and re-paste instead (EC-62; INV-56).

## Tests

The baseline conversation had no test runner (qwen-2 H01). This workspace now
has `tests/runner.js`, a pure-Node harness that loads every fixture, runs the
parser, compares only the fields present in `expected`, and reports PASS, FAIL,
or PENDING. Run it for the current status.

Commands:

```sh
node tests/runner.js
node tests/unit.js
node tests/ocr-helper.js
node tests/key-bookmarklet.js
node tests/underline-toolbar.js
node tests/question-preview.js
node tests/math-tool.js
node tests/single-source.js
node tools/extract-bank.js --check
php tests/php-render.php
php tests/admin-question-store.php
php tests/cbt-question-order.php
```

The fixture harness is parser-only; it does not execute DOM, storage,
`fillForm`, `tick`, or save behavior. `tests/unit.js` covers the legacy pure
auto-save helpers. `tests/ocr-helper.js` covers the deployed root helper;
`tests/key-bookmarklet.js` runs the real generated key bookmarklet artifact;
`tests/underline-toolbar.js` covers the pure wrap/unwrap logic;
`tests/question-preview.js` covers read-only preview mounting and refresh;
`tests/math-tool.js` covers the palette helpers, mount contracts, and byte
counter; and `php tests/admin-question-store.php` covers the extracted
save/delete transaction. `php tests/cbt-question-order.php` requires the real
EL01 module and checks the real `cbt.php` wiring; `php tests/cbt-staging.php`
executes the disposable local HTTP path when its database and URL are supplied.
None of these harnesses exercise the live admin page, its delete
forms, or the confirm dialog; live checks follow `docs/LIVE-SAFETY.md`.

The mandatory regression set is the three documented cases (qwen-2 H04):

1. S1 full: `bank-2021` covers 40 items, year 2021, Q20's four inline options,
   and the inline key.
2. S2: leading `A 5` stays in the stem; options `75/105/85/99 years`; no flags.
3. S3: `c === ''`, `d === 'seek revenge'`, flag `option C missing` and not
   `option D missing`.

Fixtures live in `fixtures/inputs/` and `fixtures/expected/`. Every expected
spec has an `input_origin` of `bank`, `anomaly`, `doc`, `synthetic`, or
`user_sample`. The `bank-*` fixtures are verbatim section slices; full years include their answer
keys, and `bank-pre-2026` is the unheaded single-question section with no key.
The `anomaly-*` fixtures are the hostile OCR blocks. One exam year (or one
divider-delimited section, even a partial one) per paste is the contract:
multi-section bank text must be split with `tools/extract-bank.js`, not pasted
whole. Expected outputs were transcribed from docs, never generated from
the parser. Do not regenerate
them just to make a test pass. If a field is not doc-backed, omit it (or mark
the fixture PENDING). Do not delete a doc-backed assertion to make a fixture
pass; an assertion may be removed only when it is shown not to be doc-backed,
and the correction must be recorded in the fixture spec or package handoff.
The current status page is `docs/STATUS.md`. The runner rejects
unknown `expected` keys, wrong-typed assertion values, unknown fixture kinds,
and any confirmed fixture that executes no assertions; it reports orphan inputs
and exits non-zero, so every `fixtures/inputs/*.txt` must have an expected spec.

You can also load the pure parser directly:

```sh
node -e "const p=require('./src/parser/parser.js'); console.log(p.splitQuestions('1. Hello world'))"
```

## Build

```sh
node src/build/build.js
node src/bookmarklets/key/build.js
```

The first reads `src/parser/core.js`, `src/bookmarklets/stimulus/autosave.js`,
and `src/ui/ui.js` and writes `src/bookmarklet.js`, the stimulus bookmarklet. The second reads
`src/parser/core.js`, `src/bookmarklets/key/boot.js`, and
`src/bookmarklets/key/entry.js` and writes
`src/bookmarklets/key/bookmarklet.js`, the key/autosave bookmarklet. Both wrap
the flattened body in a single `javascript:` IIFE. Do not add `--min`;
`src/bookmarklet.min.js` is an untracked local artifact outside the workspace
contract. See `docs/BUILD.md`.

Verification used during development: strip the leading `javascript:` and run
`node --check` on the remainder. The bookmarklet must stay on one line.

## When evidence is missing

Items marked UNVERIFIED, AT_RISK, or CONFLICTED in `docs/EDGE_CASES.md` and
`docs/INVARIANTS.md` were inferred from code or docs and were not observed in a
live session. Do not promote them to confirmed defects without reproduction
(qwen-2 H09). The save/PRG flow is now confirmed from the archived PHP, and the
current live subject list confirms CRK → CRS. On 2026-10-25 the live parser run
(V1), the live `questions` save/schema check (V2; EC-63/INV-57), and stale queue
behavior (V3; EC-62/INV-56) were exercised; see
`docs/plan/11-remaining-verification.md`. Remaining: no fresh live OCR paste
and any other UNVERIFIED/AT_RISK behaviors. The unfiltered admin list not
showing new rows is intended site behavior (confirmed by the site owner); the
filtered list does show them.
