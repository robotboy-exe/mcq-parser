# RM01 — Durable Region Model and One Shipped Parser

- **Status:** done locally (fix session 2026-11-22); acceptance passes; re-review required
- **Commit:** deferred
- **Original base:** `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Depends on:** the `owner-tool-integration` line (D-106/D-108 preserved)
- **Blocks:** nothing; supersedes the narrow-patch alternative for EC-20/-21/-23
- **External gate:** owner browser re-paste on `admin_questions.php` after deployment
- **Intent:** owner request 2026-11-19, recorded in
  [`INTENT.md`](../../../INTENT.md) and in the EC-155–EC-159 rows of
  [`docs/EDGE_CASES.md`](../../EDGE_CASES.md)
- **Review:** [`../reviews/math-editor-2026-11-main-release-review.md`](../reviews/math-editor-2026-11-main-release-review.md)

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
   `ocrQueue`/`ocrMeta`/`ocrSubmitted` contract. The helper's own bytes do not
   change in this fix session; its token stays `?v=2.4.1`.

## Adapter guard (2026-11-20)

Review follow-up: the new production dependency on `src/parser/core.js` was
untested in a browser, and a missing or stale core made the adapter return
silently (no paste panel, no error). `ocr_helper.js` now:

- holds the core to `EXPECTED_CORE_VERSION`, now `2.5.0` for this fix;
- logs `OCR helper disabled: …` and renders a `#ocr_error`
  `admin-alert admin-error` banner above the form, then throws, when
  `window.OCRParser` is missing or mismatched;
- on a page without the add-question form (list view, `?edit=`) logs the reason
  and returns without throwing, so unrelated admin pages are unaffected.

## Fix note — 2026-11-22 (`BLOCK-1`, `BLOCK-4`, `BLOCK-5`, `BLOCK-6`, `BLOCK-7`, `BLOCK-8`)

Scope came from the main-release review, restricted by the owner dispositions in
its §12/§13: `BLOCK-2`, `BLOCK-3`, and `BLOCK-9` are withdrawn;
`BLOCK-4` is narrowed to the mid-stream orphan and trailing-heading layouts.
Owner decisions for this fix: `BLOCK-1` option (a) — carry `origin/main`'s root
supplied copies as evidence — and EC-97/EC-98 outrank the global
parenthesized-lowercase reading.

### Frozen closure matrix

| ID | Criterion | Implementation | Evidence |
|---|---|---|---|
| `BLOCK-4` 1 | `[24,null,25]`; Q24 D stays `old-d`; orphan is `lump` + `plump/lamp/jump/limber` | `src/parser/core.js` `splitRegions`: a `text` line after a completed option block starts a `num: null` chunk when at least two option lines follow before the next structural line | `region-midstream-orphan` (was `[24,25]` with merged D; now PASS), `tests/ocr-helper.js` Load vector |
| `BLOCK-4` 2 | `SECTION 2:`, `SECTION 2.`, `According to Matthew, choose the correct answer.` after complete inline/vertical A–D leave D `Four` and govern the next stem | `regionHeading` accepts `SECTION/PART/PAPER <n>` with an optional trailing `:` or `.` before the terminal-punctuation rejection; the instruction line already binds forward | `region-midstream-heading` (was `Four SECTION 2:`; now PASS), Load vector |
| `BLOCK-4` 3 | Advisory flag if a structural line reaches an option | `structuralOptionText` now also classifies an embedded `SECTION/PART/PAPER <n>` line and an instruction sentence | `parseQuestion flags a structural line that reaches an option` in `tests/unit.js`; flag text `option X contains section heading or instruction` |
| `BLOCK-4` 4 | Direct core and real-helper regressions; guard/keys/dividers/blank options preserved | new helper Load vectors plus the existing fixtures | 68 runner PASS, 163 unit PASS, numbering-guard vectors unchanged |
| `BLOCK-5` 1 | Restore the two pre-RM doc-backed expectations in substance | both expected files restored byte-for-byte to the pre-RM content | `sample-comprehension-ambiguous`, `sample-comprehension-incomplete` PASS |
| `BLOCK-5` 2 | Canonical parser passes them without weakening D-91 controls | lowercase `(a)`-`(d)` counts as options only as one complete ordered set (`ABCD`), and a `PASSAGE`/`COMPREHENSION`/`EXTRACT` heading that did not link a context keeps them as text; parenthesized forms are excluded from the loose inline fallback | complete lowercase `(L)` D-91 matrix, `A) … A ) … B)`, and every standalone helper vector still pass |
| `BLOCK-5` 3 | Record any correction with source authority; no regeneration | expectations restored from `ff3896d^`, not derived from parser output; provenance unchanged | expected-file diff in this handoff |
| `BLOCK-5` 4 | Full baselines, no pending/orphan fixture | 68 fixtures, 0 PENDING, 0 ORPHAN | runner summary |
| `BLOCK-6` 1 | Helper vectors call the real `helper.parseAll`; no duplicated orchestration | local `parseAll` removed from `tests/ocr-helper.js`; every vector calls `helper.parseAll` | `grep 'function parseAll' tests/ocr-helper.js` → none; new source assertion |
| `BLOCK-6` 2 | Browser/DOM test executes the real helper, clicks Load, asserts `ocrQueue`, status, and native form values | `loadThroughForm` runs the real `ocr_helper.js` source in a `vm` DOM stub with the real core; asserts queue, index, form fields, status and Skip walking | 8 new Load vectors over the four region fixtures plus the `BLOCK-2`/`BLOCK-3`/`BLOCK-4` probes |
| `BLOCK-6` 3 | Completed handoff at base `455ea54` | this file | per-file table below |
| `BLOCK-6` 4 | Correct the EC citation; auditable source for the two user-sample transcriptions | citation corrected to EC-155–EC-159; fixture inputs and hashes recorded below; the owner confirmed both documents parse correctly (review §12) | provenance table |
| `BLOCK-6` 5 | PHP suites and `php -l` on PHP 8.3 at the final tip | PHP 8.3.9 CLI provisioned in `$HOME/php83` (static-php-cli); all suites and lint run on it | numbers below |
| `BLOCK-7` 1 | Bar spans the wider term for `<frac>123456/7</frac>` and `<frac>3/765432</frac>` on all three surfaces | `align-items: stretch` on `.cbt-frac` with `text-align: center` on the terms, in `src/question-preview.css`, `deployed/cbt.php`, `deployed/answer_details.php` | computed geometry below; three-surface parity assertion |
| `BLOCK-7` 2 | Numerator above denominator, terms centered, inline alignment kept | column flex, `vertical-align: middle`, per-term `text-align: center` | geometry: numerator above, both terms centered |
| `BLOCK-7` 3 | Strengthened stylesheet test fails on the denominator-only rule | `tests/question-preview.js` parses each surface's real declarations and rejects `align-items: center` / `flex-start` / a missing bar | 7 preview vectors |
| `BLOCK-7` 4 | Desktop and narrow geometry plus the full marker baseline | 1280px and 360px viewports | 33 PHP + 69 JS marker checks |
| `BLOCK-8` 1 | JS and PHP `format` return `&lt;u&gt;&lt;sup&gt;x&lt;/u&gt;&lt;/sup&gt;` | `markerInteriorIsClean` rejects a marker whose interior would cross another marker | shared vector, 69 JS checks |
| `BLOCK-8` 2 | JS and PHP `strip` preserve `<u><sup>x</u></sup>` | same | shared vector |
| `BLOCK-8` 3 | Add the case to the shared vector table and prove the old code fails first | vector `crossed marker pairs stay literal`; the pre-fix renderer returned `<u><sup>x&lt;/u&gt;</sup></u>` / strip `x</u>` | failing-first probe below |
| `BLOCK-8` 4 | Preserve valid nesting, repeated-own-open, unmatched, uppercase, attributed, encoded, and injection vectors | all 32 previous vectors unchanged and passing; no `innerHTML` in the renderer | 69 checks, injection probe unchanged |

`BLOCK-1` was completed after the fix session on the owner's instruction: merge
commit `df82512` merges `origin/main` into the release line with `--no-ff`, so
`git merge-base --is-ancestor origin/main HEAD` is now true while `main` keeps
its history. `origin/main`'s only unique commit (`002483b`, "provided more
deployment files") added seven root files; the three `.sql` files were already
byte-identical, so the merge added exactly the four supplied PHP snapshots. Per
the owner decision (option a) those root copies are carried as evidence and stay
out of the deployment manifest; the working copies in `deployed/` remain the
release files. The pre-merge release tip `4cb4a91` is still the code under
re-review; the merged tree `df82512` is the target for the release review.

### Per-production-file handoff (base `455ea54` → this worktree)

| File | Add / delete | Final lines / bytes | SHA-256 | Responsibility | Deployment inclusion | Direct production-path test |
|---|---:|---:|---|---|---|---|
| `src/parser/core.js` | +291 / −28 | 1695 / 58770 | `73cb7218c8800229cb5b4b3c386cd0d15eaf2eace7fdd353cc1873c3d3d01fd7` | canonical pure parser, version `2.5.0`: region stages A–D, D-91 grammar, scoped lowercase `(a)`-`(d)`, structural-option flag, comprehension/cloze engines | site root `src/`, loaded before the helper as `?v=2.5.0` | `tests/runner.js` (68 fixtures), `tests/unit.js` (164), Load vectors |
| `ocr_helper.js` | +40 / −73 | 127 / 4917 | `e799abba51d7446b4301612de1d04bfa73b814e2e5926c153f868516a8451b91` | thin adapter; holds the core to `2.5.0`; queue panel, `fillForm`, `parseAll` | site root, `?v=2.4.1` (bytes unchanged this session) | `tests/ocr-helper.js` (27 checks incl. real Load) |
| `deployed/admin_questions.php` | +4 / −3 | 1057 / 62877 | `574c0cb01aea52abc6c053ee3ac0d78e89ca1435b774b781ce7326cdea6f5f94` | native admin page; core `?v=2.5.0`, renderer `?v=2.3.4`, preview CSS `?v=1.1.3` | site root | wiring assertions in `tests/math-tool.js`, helper Load stub |
| `deployed/cbt.php` | +2 / −2 | 1085 / 47093 | `29d734ba18e0737d19a4326e9c0fa2f63b047291935b0a8426f9aff55bde0c96` | exam delivery; full-width fraction rule; renderer `?v=2.3.4` | site root | three-surface CSS parity, marker vectors |
| `deployed/answer_details.php` | +1 / −1 | 268 / 13672 | `f8b812f278c2f1982b04a18d150ea50a2fd779d8be818338641d4e67f075e6ea` | details delivery; full-width fraction rule | site root | three-surface CSS parity |
| `deployed/render.php` | +64 / −1 | 311 / 10208 | `3deed214787b76038158e29d0c97ad1dfd406da4e7b4f22cc8658697c64e8e82` | PHP marker renderer with the crossing guard | site root | `php tests/php-render.php` (33 vectors) |
| `src/owner-tool/render.js` | +59 / −18 | 449 / 15377 | `d930aab35a4f6b3e14e4329af280a1f46ef487f44d40bd2f475f65ecc386fb51` | browser marker renderer with the crossing guard | served `src/`; `?v=2.3.4` | `tests/render-markup.js` (69 checks) |
| `src/question-preview.css` | +1 / −1 | 117 / 2070 | `dbc136ea6bd26be1363b9ca7f5374e2ae75b68639a1a6bb02107ee672c155ee5` | admin preview and shape paint; full-width fraction rule | served `src/`; `?v=1.1.3` | `tests/question-preview.js` (7 vectors) |

Live-origin caps (unchanged by this session, all within 100 additions):

| File | Add / delete vs archived live snapshot |
|---|---:|
| `deployed/admin_questions.php` | +96 / −85 |
| `deployed/cbt.php` | +78 / −37 |
| `deployed/answer_details.php` | +21 / −3 |
| `ocr_helper.js` | +51 / −47 |

`deployed/cbt_practice.php` is deleted for this release (owner disposition
`BLOCK-9`) and is absent from the deployment set.

### Test and fixture artifacts (excluded from production limits)

| File | Add / delete | Purpose |
|---|---:|---|
| `tests/ocr-helper.js` | +254 / −10 | real `helper.parseAll`, real Load/DOM vectors (27 checks) |
| `tests/question-preview.js` | +70 / −0 | three-surface full-width fraction contract (7 vectors) |
| `tests/fixtures/render-markup.json` | +6 / −0 | crossed-marker shared vector (33 cases) |
| `tests/unit.js` | +19 / −2 | parser version `2.5.0`; structural-option flag vector |
| `tests/math-tool.js` | +6 / −8 | refreshed asset tokens, stale-token rejection |
| `fixtures/expected/sample-comprehension-ambiguous.json` | restored | pre-RM CONFIRMED expectation |
| `fixtures/expected/sample-comprehension-incomplete.json` | restored | pre-RM CONFIRMED expectation |

### Fixture provenance

| Fixture | Input | SHA-256 | Authority |
|---|---|---|---|
| `region-lowercase-stems` | `fixtures/inputs/region-lowercase-stems.txt` | `fadb5a79e9988ecc9a6f359943f27390d6158615ac5fa5cc21dcfec12fe41265` | user-supplied `ec20` paste, hand-transcribed; owner confirmed the real paste parses (review §12) |
| `region-orphan-number` | `fixtures/inputs/region-orphan-number.txt` | `2d546a9a0ead0367149325be8620ebe8ba58e65ee3db08330c51b0d84c1039e8` | user-supplied `ec20b` paste, hand-transcribed; owner confirmed |
| `real-ec20` | `fixtures/inputs/real-ec20.txt` | `84dc32e2714ba5c41250162941135e093af7ebba615aed9c531104409889624a` | owner `ec20` document, tracked in-repo at `d20c939` |
| `real-ec20b` | `fixtures/inputs/real-ec20b.txt` | `c4210b8d1f24aa4c1075e8b5765f7ae28c0487fb92f47a6b9896757cb37b354f` | owner `ec20b` document, tracked in-repo at `d20c939` |
| `region-midstream-orphan` | `fixtures/inputs/region-midstream-orphan.txt` | `5c7425267d6742542fe5e8fd1b01fa7d89c72d3dd2e9295c8304d42be303a95c` | synthetic, built from the owner's `ec20b` pattern |
| `region-midstream-heading` | `fixtures/inputs/region-midstream-heading.txt` | `6042c65f4ff6f2b85dc5a75e204d7554c85ed916c4e059070fff1f0ded9531b7` | synthetic, built from the owner's `ec20` section pattern |
| `region-preamble-paragraphs` | `fixtures/inputs/region-preamble-paragraphs.txt` | `c8d02ba71156826105b2b358efc5048150c3e37d01a398d754a1a65ec6be2bc5` | synthetic |
| `region-footer-instruction` | `fixtures/inputs/region-footer-instruction.txt` | `cc309dbe12e7689eab2660f7f3ee0fe01d30ec154007066ceae4cc7efbe89dbf` | synthetic |

The owner's original `ec20`/`ec20b` attachments are not archived in this
repository. The in-repo `real-ec20`/`real-ec20b` fixtures are the tracked copies
at `d20c939`; the earlier two hand transcriptions keep their own input files and
hashes above. All expectations are hand-written, never generated from parser
output.

### Acceptance (2026-11-22, PHP 8.3.9 CLI, Node v26.13.1)

```text
node tests/runner.js              68 fixtures: 68 PASS / 0 FAIL / 0 PENDING
node tests/unit.js                164 PASS / 0 FAIL
node tests/ocr-helper.js          27 PASS
node tests/underline-toolbar.js   10 PASS
node tests/question-preview.js    7 PASS
node tests/math-tool.js           26 PASS
node tests/render-markup.js       69 PASS
php tests/php-render.php          33 PASS
php tests/admin-question-store.php 8 PASS
php tests/cbt-question-order.php  14 PASS / 0 FAIL
php -l deployed/*.php             7/7 PASS
node tools/extract-bank.js --check 7 hashes OK
git diff --check                  clean
```

Computed fraction geometry (real stylesheet rules, cloud browser):

```text
surface                  vector              numerator   denominator (bar)
src/question-preview.css 123456/7             62.64px     62.64px
src/question-preview.css 3/765432             64.09px     64.09px
deployed/cbt.php         123456/7             62.64px     62.64px
deployed/cbt.php         3/765432             64.09px     64.09px
deployed/answer_details  123456/7             62.64px     62.64px
deployed/answer_details  3/765432             64.09px     64.09px
1280px and 360px viewports agree; numerator above denominator; text-align center
pre-fix rule (align-items: center): numerator 62.64px, denominator 15.83px
```

Failing-first crossed marker (`<u><sup>x</u></sup>`, pre-fix renderer object):

```text
old format: "<u><sup>x&lt;/u&gt;</sup></u>"      old strip: "x</u>"
new format: "&lt;u&gt;&lt;sup&gt;x&lt;/u&gt;&lt;/sup&gt;"  new strip: "<u><sup>x</u></sup>"
```

### Excluded artifacts

`archive/live-sources/*`, `archive/owner-tool-2026-11/*`, the root supplied
copies `admin_questions.php`, `answer_details.php`, `cbt.php`, and
`cbt_practice.php` taken from `main` in the release-line merge (evidence only,
never deployed), `deployed/sql/base-schema.working.sql`, generated
`src/bookmarklet.js`, untracked
`src/bookmarklet.min.js`, all fixtures/tests as non-production evidence,
`tools/phone-staging/*`, the local staging root/database/log/PID, browser
profile/output files, the local PHP 8.3.9 CLI under `$HOME/php83`, and every file
under `$HOME/tmp`.

## Non-goals

- No change to the PHP server contract, storage keys, or `fillForm`.
- No restructuring or extension of the native form; E/F, shared stimulus, and
  key parsing stay out of the root helper (D-109, owner disposition `BLOCK-2`/
  `BLOCK-3`).
- No regeneration of existing fixture expectations from parser output.
- No removal of the legacy bookmarklet copy of the parser in this package.
- No live paste, live save, deployment, or MySQL operation.

## Continuation checklist

1. Re-review this handoff against the frozen matrix in
   [`../reviews/math-editor-2026-11-main-release-review.md`](../reviews/math-editor-2026-11-main-release-review.md).
2. Owner action for `BLOCK-1`: create the main-integrable release target
   (merge `origin/main`, carrying the root supplied copies per option a), then
   re-review that exact target.
3. Deployment and the owner's browser re-paste remain external.

## Stop conditions

- An existing CONFIRMED fixture depends on structural text staying inside an
  option or stem in a way this package cannot preserve without an owner
  decision.
- A fix would need to change the scoped-option requirement; only the owner may
  do that.
