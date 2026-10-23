# Instructions for Future Agents

Read this before changing any parser or UI code. It is derived from the archived
migration docs and the baseline in `src/`. It deliberately does not propose new
features.

## Ground rules

1. **The migration docs are the contract.** Read
   `archive/migration-docs/claude-migration.md`,
   `archive/migration-docs/qwen-1-gaps*.md`,
   `archive/migration-docs/qwen-2-gaps.md`, and
   `archive/migration-docs/qwen-2-reconciled.md` before editing.
2. **Do not refactor for style.** The docs repeatedly say the code is a working
   baseline, not a refactor target (qwen-2 H08). Make only changes you can
   test.
3. **Do not modify the PHP, the database, `ocr_helper.js`, or the server
   contract.** CSRF handling, upload handling, the PRG flow, field names
   (`save_question`, `correct_option`, `option_a`–`option_d`), the four-option
   rule, and the success flash text are off-limits (qwen-2 H03; INV-06).
4. **Do not change `localStorage` key names or shapes.** `ocrQueue`,
   `ocrMeta`, `ansKey`, `ocrSubmitted` are shared with the live helper
   (INV-36, INV-55).
5. **Edit modules, not the build output.** `src/bookmarklet.js` is generated.
   Change `src/parser/parser.js` or `src/ui/ui.js`, then rebuild.
6. **The bookmarklet is a single line with no `//` comments.** A `//` comment
   truncates the `javascript:` URL (INV-05).
7. **Preserve behavior even when it looks wrong.** E/F→D, the +5 numbering
   guard, flags being advisory, and the absent post-processor are deliberate.
   Fix only with a failing fixture and a documented decision.

## Dangerous areas

| Area | Why it is dangerous |
|---|---|
| `OPTION` regex | Tightly coupled to inline options, dotless-newline options, and leading prose articles. Three separate regressions already occurred here. Never add `^` to the dotless branch; never remove the whitespace-prefixed dotted branch; never pre-collapse newlines (qwen-2 H05; R01–R04). |
| Blank `C.` / `[^\S\n]*` | The horizontal-whitespace class is what keeps a blank option from consuming the next label. Changing it can resurrect the "option D missing" bug (INV-23). |
| Loose E/F (`LOOSE`) | Can mistake a continuation line such as `F = ma` for Option F. Do not broaden it (claude §5.3). |
| `splitSections` | Rule order (divider → key-only → header → structure) is fragile. A false positive splits a question; a miss leaves key lines in the question stream (claude §5.9). |
| `splitQuestions` numbering guard | `n <= last || n > last + 5` drops repeats and large jumps. It can merge real questions after a restart or OCR digit error (INV-21, INV-24). |
| `fillForm` / `tick` | They must agree on the E/F→D mapping and on ticking nothing when E/F text is absent. `tick()` computes radio index 3 for E/F; radio values 4/5 do not exist (INV-27, INV-28, INV-30). |
| Save detector | Hard-coded to the exact success text. The live PRG response has not been observed in this workspace. Do not "fix" it without a live trace (INV-49; qwen-2 H07/H09). |
| Header inference | First `20\d\d` in the first 3 lines can be a copyright year; fuzzy subject matching can pick the wrong option. Both are known AT_RISK/UNVERIFIED (EC-44, EC-61, EC-43; INV-42–INV-44). |

## What to preserve

- A key-only paste keeps the queue; a questions paste replaces or clears the
  key (INV-32, INV-33).
- Blank options stay blank; a later option is not pulled into their place
  (INV-16).
- Duplicate option letters are flagged with the pre-dedup count (INV-17).
- Flags are advisory and never block load/queue/save (INV-20).
- E/F collapse into Option D; with a key D is replaced and ticked, without a key
  E/F is appended and nothing is ticked (INV-27, INV-28).
- No radio is pre-ticked without a key; always clear the form default (INV-29).
- `FIXES` applies to the question part only, before parsing (INV-38).
- Reset Queue uses `{ items: [], i: 0 }` and does not touch the key (INV-34,
  INV-41).
- The success/error container `#ans_res` is inserted after the submit button
  (INV-03).

## What to avoid

- Reintroducing `new RegExp(` with template strings for option splitting; the
  escaping was wrong before and silently failed (claude §5.1, §10).
- Adding a post-processor without correct escaping and tests against
  `Vitamin C.` and `Vitamin B-12` (INV-22).
- Changing the key lifecycle (including Reset-vs-key) without an explicit
  product decision; it is still open (claude §8 issue 4).
- Treating this bookmarklet as part of the PHP Bulk Import plan; no link
  between them was decided (claude §8 issue 10).
- Setting `ocrSubmitted` or relying on it; this code never writes it and its
  writer is unknown (INV-40).

## Tests

The baseline conversation had no test runner (qwen-2 H01). This workspace now
has `tests/runner.js`, a pure-Node harness that loads every fixture, runs the
parser, compares only the fields present in `expected`, and reports PASS, FAIL,
or PENDING. Run it for the current status.

Commands:

```sh
node tests/runner.js
```

The harness is parser-only; it does not execute DOM, storage, `fillForm`,
`tick`, or save behavior.

The mandatory regression set is the three documented cases (qwen-2 H04):

1. S1 full: 40 items, year 2021, Q20 has four inline options and no flags.
2. S2: leading `A 5` stays in the stem; options `75/105/85/99 years`; no flags.
3. S3: `c === ''`, `d === 'seek revenge'`, flag `option C missing` and not
   `option D missing`.

Fixtures live in `fixtures/inputs/` and `fixtures/expected/`. Expected outputs
were transcribed from docs, never generated by the parser. Do not regenerate
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
(qwen-2 H09). The highest-priority live check is the save response under the
PRG flow.
