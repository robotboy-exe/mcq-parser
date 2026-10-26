# Instructions for Future Agents

Read this before changing any parser or UI code. It is derived from the archived
migration docs and the baseline in `src/`. It deliberately does not propose new
features.

## Working context

- The user works on a phone (Brave on Android); keep explanations plain and
  replies short.
- Do not add unused files, speculative features, or refactors for style.

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
3. **Do not modify the PHP, the database, `ocr_helper.js`, or the server
   contract.** CSRF handling, upload handling, the PRG flow, field names
   (`save_question`, `correct_option`, `option_a`–`option_d`), the four-option
   rule, and the success flash text are off-limits (qwen-2 H03; INV-06).
4. **Do not change `localStorage` key names or shapes.** `ocrQueue`,
   `ocrMeta`, and `ansKey` are shared with the live helper; `ocrSubmitted`
   remains a shared key name but the bookmarklet no longer touches it
   (INV-36, INV-55; D-22). Auto-Save adds `batchId`, `ansKeyBatch`,
   `ansKeyConflicts`, `ocrSaving`, `ocrSavedLog`, and `autoLock`; additions are
   allowed, existing shapes must stay compatible (D-30, D-32, D-36).
5. **Edit modules, not the build output.** `src/bookmarklet.js` is generated.
   Change `src/parser/parser.js` or `src/ui/ui.js`, then rebuild.
6. **The bookmarklet is a single line with no comments and no `%`.** Full-line
   `//` comments are allowed in the modules and stripped by `build.js`; inline
   `//` comments remain forbidden (INV-05). The build fails if the output
   contains `%`, because a bookmark manager may decode it.
7. **Preserve behavior even when it looks wrong.** E/F→D, the +5 numbering
   guard, flags being advisory, and the absent post-processor are deliberate.
   Fix only with a failing fixture and a documented decision.

## Dangerous areas

| Area | Why it is dangerous |
|---|---|
| `OPTION` regex | Tightly coupled to inline options, dotless-newline options, and leading prose articles. Three separate regressions already occurred here. Never add `^` to the dotless branch; never remove the whitespace-prefixed dotted branch; never pre-collapse newlines (qwen-2 H05; R01–R04). Keep the `B.C.` abbreviation skip (D-48), the spaced-slash normalization (D-49), and the bounded missing-label repair (D-47) separate from the main regex. |
| Blank `C.` / `[^\S\n]*` | The horizontal-whitespace class is what keeps a blank option from consuming the next label. Changing it can resurrect the "option D missing" bug (INV-23). |
| Loose E/F (`LOOSE`) | Can mistake a continuation line such as `F = ma` for Option F. Do not broaden it (claude §5.3). |
| `splitSections` | Rule order (divider → key-only → header → structure) is fragile. A false positive splits a question; a miss leaves key lines in the question stream (claude §5.9). Divider-only runs of three or more equals signs (`========`) are section separators and are blanked before line slicing. Keep that predicate narrow (D-46). |
| `splitQuestions` numbering guard | `n <= last || n > last + 5` drops repeats and large jumps. It can merge real questions after a restart or OCR digit error (INV-21, INV-24). |
| `salvageNormalize` / `splitSectionsWithSalvage` | The repair must stay a no-op on bank text. The `inserts >= 2` trigger and the `after > before` chunk gate are mandatory; a repair that does not add questions must be discarded and the strict result kept byte-for-byte (INV-72). |
| `splitBulletQuestions` / `splitQuestionItems` | Bullet mode is only for text with no line-start `N.` marker. Never invent numbers: bullet chunks keep `num: null` and the `question number missing` flag. Do not mix bullet and numbered chunks in one paste (INV-74). |
| `fillForm` / `tick` | They must agree on the E/F→D mapping and on ticking nothing when E/F text is absent. `tick()` computes radio index 3 for E/F; radio values 4/5 do not exist (INV-27, INV-28, INV-30). |
| Save detector | Hard-coded to the exact success text. The archived PHP confirms the PRG flash flow, so the detector matches the server contract. Do not change one side without the other (INV-49; qwen-2 H07/H09). |
| Header inference | First `20\d\d` in the first 3 lines can be a copyright year; fuzzy subject matching can pick the wrong option for names that share words. Both are known risks (EC-61, EC-43; INV-44). EC-44 is confirmed by the PHP. |
| Auto-Save gate | `autosaveBlockers` is the safety wall. Do not weaken or reorder it to make a batch run; add a documented decision and a test first. It must block gaps, inexact key coverage, conflicts, E/F, flags, bad options, missing meta, an unticked confirmation, a changed confirmation snapshot or mode, markers, lock, hidden, saved-log, recent duplicates, and an edited form (D-33, D-34, D-39, D-51; SPEC §7.3). Diagram/table words do not block; the uploader owns the media decision (D-38). |
| Save marker/classification | `ocrSaving` is cleared only on definite Saved/Rejected. Ambiguous keeps it, disables Start, and never retries. Saved requires a redirect, no `.admin-error`, the success regex, and an ID above every logged ID (INV-64, INV-65). |
| Auto-Save lock/loop | Use the recursive `setTimeout` heartbeat and `autoLock`; never use `setInterval` as the engine, `MutationObserver` for success, or `button.click()`/`requestSubmit()` to advance. A hidden tab finishes the current save and pauses (INV-67). |
| Dry run | It must copy the queue, use current metadata, POST nothing, and write nothing to `ocrQueue`, `ocrSaving`, `ocrSavedLog`, or `autoLock` (INV-68). |

## What to preserve

- A key-only paste keeps the queue; a questions paste replaces or clears the
  key (INV-32, INV-33).
- Blank options stay blank; a later option is not pulled into their place
  (INV-16).
- Duplicate option letters are flagged with the pre-dedup count (INV-17).
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
- Reading, writing, deleting, or relying on `ocrSubmitted`; the bookmarklet is
  deliberately self-contained (INV-40; D-27).
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
node tools/extract-bank.js --check
```

The fixture harness is parser-only; it does not execute DOM, storage,
`fillForm`, `tick`, or save behavior. `tests/unit.js` covers the pure auto-save
helpers and does not touch the DOM either.

The mandatory regression set is the three documented cases (qwen-2 H04):

1. S1 full: `bank-2021` covers 40 items, year 2021, Q20's four inline options,
   and the inline key.
2. S2: leading `A 5` stays in the stem; options `75/105/85/99 years`; no flags.
3. S3: `c === ''`, `d === 'seek revenge'`, flag `option C missing` and not
   `option D missing`.

Fixtures live in `fixtures/inputs/` and `fixtures/expected/`. Every expected
spec has an `input_origin` of `bank`, `anomaly`, `doc`, or `synthetic`. The
`bank-*` fixtures are verbatim section slices; full years include their answer
keys, and `bank-pre-2026` is the unheaded single-question section with no key.
The `anomaly-*` fixtures are the hostile OCR blocks. One exam year (or one
divider-delimited section, even a partial one) per paste is the contract:
multi-section bank text must be split with `tools/extract-bank.js`, not pasted
whole. Expected outputs were transcribed from docs, never generated from
the parser. Do not regenerate
them just to make a test pass. If a field is not doc-backed, omit it (or mark
the fixture PENDING). Do not delete a doc-backed assertion to make a fixture
pass; an assertion may be removed only when it is shown not to be doc-backed,
and the correction must be recorded in `WORKSPACE_SETUP.md`. The runner rejects
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
```

This reads `src/parser/parser.js` and `src/ui/ui.js`, wraps them in a single
`javascript:` IIFE, and writes `src/bookmarklet.js`. See `docs/BUILD.md`.

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
