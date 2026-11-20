# RM01 — Durable Region Model and One Shipped Parser

- **Status:** implementation package; owner `go` recorded 2026-11-19
- **Depends on:** the current `owner-tool-integration` baseline (D-106/D-108 local work preserved)
- **Blocks:** nothing; supersedes the narrow-patch alternative for EC-20/-21/-23
- **External gate:** owner browser re-paste on `admin_questions.php` after deployment
- **Intent:** owner request 2026-11-19, recorded in
  [`INTENT.md`](../../../INTENT.md) and in the EC-127–EC-131 rows of
  [`docs/EDGE_CASES.md`](../../EDGE_CASES.md)

## Problem

Two attached OCR documents (`ec20`, `ec20b`) collapse into a single item in the
shipping helper because `ocr_helper.js` carried its own copied parser that
required an uppercase letter after the question number. The canonical core
parses them, but it also:

- drops a title/rubric head with no warning;
- appends a mid-stream section rubric to the previous question's option D;
- loses a question whose number was OCR'd away (it merges into the previous
  option D).

Both failures are structural: line roles are inferred by whichever regex runs
first, and leftover text is assigned to the nearest preceding chunk.

## Settled behavior

1. **Stage A — classify.** Every line is classified once, in one pass, as
   `blank`, `divider`, `key`, `stem`, `option`, `heading`, `instruction`, or
   `text`. A stem is a line-start `N.` marker with body text that is not a bare
   key letter; a stem whose body begins with an option label (a no-stem cloze
   row) is not a stem.
2. **Stage B — own.** Options bind to the nearest preceding stem. Headings and
   instructions bind to the nearest following stem. A heading/instruction line
   that appears after an option block is removed from that option's text and
   carried to the next stem or reported as an unowned trailing region.
3. **Stage C — split only on stems.** Leftover text with at least two option
   markers and no stem becomes a `num: null` orphan item, never merged into a
   neighbour. Leading prose becomes a `passage` region instead of being dropped.
4. **Stage D — invariant.** No option value may contain a heading or
   instruction line. A violation is reported as the advisory flag
   `option X contains section heading or instruction`.
5. `parsePaste` returns `regions` (`{kind, text, from, to}`) and each item may
   carry `sectionInstruction` (the governing heading and instruction text). The
   `question` field stays clean.
6. The numbering guard (`n <= last` or `n > last + 5` skips a marker) is
   preserved.
7. **One implementation ships.** Root `ocr_helper.js` becomes a thin adapter
   over `src/parser/core.js`; `admin_questions.php` loads the core before the
   helper. The adapter keeps `FIXES`, `OPTION`, `splitQuestions`,
   `splitRegions`, `parseQuestion`, and `parseAll`, and keeps the
   `ocrQueue`/`ocrMeta`/`ocrSubmitted` contract.

## Production plan

| File | Planned change | Responsibility / deployment | Direct evidence |
|---|---|---|---|
| `src/parser/core.js` | Region model (classify/own/split/invariant), D-91 option grammar, `splitRegions`, `regions` in `parsePaste`, version `2.4.0` | Served from `src/parser/`; loaded by the admin page before the helper | `node tests/runner.js`, `node tests/unit.js` |
| `ocr_helper.js` | Reduced to an adapter over the core | Root script tag, unchanged URL | `node tests/ocr-helper.js` |
| `deployed/admin_questions.php` | One extra `<script>` for the core before `ocr_helper.js` | Existing page; no server-contract change | PHP lint, source wiring assertion |
| `tests/runner.js` | `regions` and `section_instruction` assertions | Test harness | fixture suite |
| `tests/ocr-helper.js` | Adapter parity and region vectors | Test harness | helper suite |
| `fixtures/*` | Four hand-transcribed fixtures | Test data | fixture suite |

## Tests first

Fixtures were written before implementation, transcribed by hand from the two
supplied documents and the reported edge cases:

- `region-lowercase-stems` — lowercase stems, rubric before question 1 and
  again before question 4;
- `region-orphan-number` — a lost question number before questions 25–26;
- `region-preamble-paragraphs` — title and prose paragraphs before question 1;
- `region-footer-instruction` — trailing section heading that used to land in
  option D.

## Acceptance

| Check | Expected |
|---|---|
| Lowercase stems | Every question split; no 500-character option |
| Mid-stream rubric | Carried to the next item as `sectionInstruction`; option D unchanged |
| Orphan block | `num: null` item, never merged into a neighbour |
| Preamble | Regions reported; stem and options clean |
| Trailing structural text | Unowned region; option D unchanged |
| Single parser | `ocr_helper.js` exposes the core functions; helper suite passes |
| Baseline | `node tests/runner.js`, `tests/unit.js`, `tests/ocr-helper.js` pass; PHP lint on the changed page |

## Adapter guard (2026-11-20)

Review follow-up: the new production dependency on `src/parser/core.js` was
untested in a browser, and a missing or stale core made the adapter return
silently (no paste panel, no error). `ocr_helper.js` now:

- holds the core to `EXPECTED_CORE_VERSION = '2.4.0'`;
- logs `OCR helper disabled: …` and renders a `#ocr_error`
  `admin-alert admin-error` banner above the form, then throws, when
  `window.OCRParser` is missing or mismatched;
- on a page without the add-question form (list view, `?edit=`) logs the reason
  and returns without throwing, so unrelated admin pages are unaffected.

Evidence: four browser-branch vectors in `tests/ocr-helper.js` (19 helper
checks) plus a disposable-staging browser session on the real
`admin_questions.php` — panel renders and parses both region fixtures, and with
`src/parser/core.js` removed the banner appears instead of a silent no-op.

## Non-goals

- No change to the PHP server contract, storage keys, or `fillForm`.
- No regeneration of existing fixture expectations from parser output.
- No removal of the legacy bookmarklet copy of the parser in this package.

## Stop conditions

- An existing CONFIRMED fixture depends on structural text staying inside an
  option or stem in a way this package cannot preserve without an owner
  decision.
