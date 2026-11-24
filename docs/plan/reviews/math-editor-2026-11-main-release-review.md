# Main Release Review - `math-editor-2026-11`

- **Date:** 2026-11-21
- **Reviewer:** independent review session
- **Requested scope:** phase 5 plus D-108 and RM01 at `ff3896d` for the
  `main` release boundary
- **Resolved scope:** phase 5 `MS01` including D-103/D-104, D-105, D-106,
  D-108, and RM01 including the parser-core guard. D-105 is an ancestor of the
  target, and D-106 shares commit `455ea54` with D-108, so neither can be
  omitted from a release of `ff3896d`.
- **Logical phase-5 base:**
  `0410ecbc65eaf1434de50a5ccf9adadaf217967b`
- **Last previously reviewed/owner-accepted tree:**
  `91430475b95b40dff22c3eb6f346d60418b0196e`
- **D-106/D-108 boundary:**
  `455ea5450c50f660ee2cf5f992677a1823a76603`
- **Reviewed target:**
  `ff3896d9d7ed483b6b60c695e5bd63e54ef35883`
- **Mode:** original cumulative release-boundary review. This is not a phase-5
  closure re-review and does not broaden any prior phase-5 finding.
- **Record name:** `math-editor-2026-11-main-release-review.md`; it does not
  overwrite or repurpose a phase record.
- **Files written:** this review record only. No product, test, fixture,
  package, coordinator, status, branch, commit, database, deployment, or live
  record was changed by the review.

## 1. Authority, eligibility, and exact tree

The active map resolves phase 5 to `MS01`. Its original review, `FIX-1`
closure, D-103/D-104 focused review, and D-105 cycle review are settled. The
owner's desktop/Brave checks for D-103/D-104 and D-105 are recorded as passed.
D-106 and D-108 are direct owner requests. The coordinator records RM01 as done
locally, although its package file remains an implementation plan rather than a
complete handoff; that discrepancy is part of `BLOCK-6` rather than a reason to
silently trust the package claim.

The worktree was on `owner-tool-integration`, clean before this record, at
`fea878fb59be88505a2501797d6ea25c1883c8c9`. The sole change after the requested
target is deletion of `session-ses_e35a.md`; every reviewed product, test,
fixture, tool, and documentation path is byte-identical between `ff3896d` and
the current tip:

```text
git diff --name-status ff3896d..HEAD
D  session-ses_e35a.md

git diff --quiet ff3896d..HEAD -- AGENTS.md INTENT.md README.md \
  deployed docs fixtures ocr_helper.js src tests tools
reviewed product/test/docs paths identical to ff3896d
```

The target is not a valid fast-forward boundary for current `main`:

```text
main                         4d68b2813d309a9d22f1c21c5bef21984d2170b3
target                       ff3896d9d7ed483b6b60c695e5bd63e54ef35883
merge base                   58af90efaf138cc5548eed698a6a006da742d492
git rev-list --left-right --count main...ff3896d   3 111
git merge-base --is-ancestor main ff3896d        false
```

This conflicts with the fast-forward-only release rule in
`docs/plan/README.md:269-290` and is `BLOCK-1`.

## 2. Commands and baseline results

Node was v26.13.0. The available PHP CLI was 8.5.12, not the documented PHP
8.3 target. Prior phase-5 evidence used PHP 8.3.32, but no PHP 8.3 binary was
available for the newly reviewed D-106/D-108/RM01 tip. Exact-target PHP 8.3
evidence is therefore included in `BLOCK-6`'s closure criteria rather than
misreported as run.

```text
node tests/runner.js                 PASS 64 / FAIL 0 / PENDING 0
node tests/unit.js                   PASS 163 / FAIL 0
node tests/ocr-helper.js             PASS 19
node tests/underline-toolbar.js      PASS 10
node tests/question-preview.js       PASS 6
node tests/math-tool.js              PASS 26
node tests/render-markup.js          PASS 67
node tools/extract-bank.js --check   PASS, source/anchors/counts/7 hashes
php tests/php-render.php             PASS 32 (PHP 8.5.12)
php tests/admin-question-store.php   PASS 8 (PHP 8.5.12)
php tests/cbt-question-order.php     PASS 14 / FAIL 0 (PHP 8.5.12)
php -l deployed/*.php                PASS 8/8 (PHP 8.5.12)
git diff --check                     PASS
deployment manifest                 PASS 20/20 hash-bearing rows
```

Disposable local HTTP evidence used the real `deployed/admin_questions.php`,
root `ocr_helper.js`, and symlinked real `src/` tree:

```text
tools/start-phone-staging.sh
EL01_STAGING_DB="$HOME/tmp/ocr-phone-staging.sqlite" \
  EL01_STAGING_URL="http://127.0.0.1:8080" \
  php tests/cbt-staging.php
PASS 7 / FAIL 0
tools/stop-phone-staging.sh
```

The seven staging checks covered the real D-108 setup label, 50-question
selection, filters, unchanged payload, contiguous exact Constant Text groups,
attempt insertion with numeric subject/category IDs, exam label, and effective
800/700 weight declarations.

For D-106, a disposable SQLite trigger aborted one local insert with the exact
message `review <b>db</b>`. The authenticated production page rendered:

```text
text: The question could not be saved. Database error: SQLSTATE[23000]:
      Integrity constraint violation: 19 review <b>db</b>
html: ... review &lt;b&gt;db&lt;/b&gt;
injected <b> elements: 0
```

The trigger was removed immediately. No question was inserted. This directly
confirms the server log/generic lead-in/escaped authenticated-message behavior
at `deployed/admin_questions.php:563-574,729-730`; no D-106 implementation
finding remains.

No live URL, live database, production deployment, or destructive action was
used.

## 3. Independently reproduced measurements

### Cumulative phase-5-to-target production delta

`git diff --numstat 0410ecb..ff3896d` and `wc -l -c` over the exact Git objects:

| Production file | Add / delete | Base lines / bytes | Target lines / bytes |
|---|---:|---:|---:|
| `deployed/admin_questions.php` | +12 / -10 | 1055 / 62646 | 1057 / 62877 |
| `deployed/answer_details.php` | +13 / -0 | 255 / 12617 | 268 / 13671 |
| `deployed/cbt.php` | +21 / -4 | 1068 / 45755 | 1085 / 47092 |
| `deployed/cbt_practice.php` | +1 / -1 | 886 / 37247 | 886 / 37246 |
| `deployed/render.php` | +213 / -43 | 78 / 2447 | 248 / 8161 |
| `deployed/subject_display.php` | +12 / -0 | absent | 12 / 386 |
| `ocr_helper.js` | +40 / -73 | 160 / 6284 | 127 / 4917 |
| `src/parser/core.js` | +252 / -28 | 1432 / 49296 | 1656 / 57118 |
| `src/math-tool.css` | +109 / -54 | 200 / 3317 | 255 / 4118 |
| `src/math-tool.js` | +327 / -221 | 554 / 17436 | 660 / 21427 |
| `src/owner-tool/render.js` | +264 / -65 | 209 / 6339 | 408 / 13764 |
| `src/question-preview.css` | +80 / -0 | 37 / 711 | 117 / 2069 |

The complete logical range is 52 files, +5391/-822. The newly unreviewed
`9143047..ff3896d` range is 34 files, +1397/-216. Its production delta is:

| Production file | Add / delete | Prior-reviewed lines / bytes | Target lines / bytes |
|---|---:|---:|---:|
| `deployed/admin_questions.php` | +8 / -6 | 1055 / 62662 | 1057 / 62877 |
| `deployed/cbt.php` | +4 / -2 | 1083 / 46953 | 1085 / 47092 |
| `deployed/subject_display.php` | +12 / -0 | absent | 12 / 386 |
| `ocr_helper.js` | +40 / -73 | 160 / 6284 | 127 / 4917 |
| `src/parser/core.js` | +252 / -28 | 1432 / 49296 | 1656 / 57118 |

The D-106/D-108 commit accounts for admin +6/-5, CBT +4/-2, and the new
12-line alias module. RM01 accounts for admin +2/-1, helper +40/-73, and core
+252/-28.

### Live-origin limits

Exact `git diff --no-index --numstat` measurements against the designated
archived live snapshots:

| Live-origin file | Add / delete | Limit | Result |
|---|---:|---:|---|
| `deployed/admin_questions.php` | +96 / -85 | additions <=100 | PASS |
| `deployed/cbt.php` | +78 / -37 | additions <=100 | PASS |
| `deployed/answer_details.php` | +21 / -3 | additions <=100 | PASS |
| `deployed/cbt_practice.php` | +20 / -2 | additions <=100 | PASS |
| `ocr_helper.js` | +51 / -47 | additions <=100 | PASS |

No cap exception exists or is needed. The coordinator/status values for admin
and helper are stale, but the exact target remains within the hard limit.

### Hashes and manifest

All 20 hash-bearing `docs/DEPLOYMENT.md` rows match target line counts, LF byte
counts, and SHA-256 values. Relevant independently reproduced hashes:

| File | SHA-256 |
|---|---|
| `deployed/admin_questions.php` | `41e3ce7e01e111ca4515ae5ce83afdb383c3bb1b3b08256830b7a1936c91e5d6` |
| `deployed/cbt.php` | `01e3f90ac4618a634c8440aad5562de605b1df763d3f530fd89f72192e7ca806` |
| `deployed/subject_display.php` | `3f8ce0e86787a66d90b8d87fcd0295ac3c7629f899202443068dfd019b044537` |
| `ocr_helper.js` | `856b77685b49f20edd5c2726f80676ac3ca1a2eeda20a1e5b97d6192e5fb0993` |
| `src/parser/core.js` | `49a465ecfe0ab1f8da8272bf2f9dbcf669c786f7748001efed133dff80b93868` |
| `src/owner-tool/render.js` | `216ebb513ef48ee82c71e6d0af4e8657e6a0579ac674b2e0e5a6c6d55ad87933` |
| `deployed/cbt_practice.php` | `eae473a55ffa046be9e1ec8c94c51d40f9065ebeb60bee7d04741e75e75159cc` |

`cbt_practice.php` is changed production code but is not one of the manifest's
hash-bearing rows; that documentation/deployment gap is included in `NOTE-13`.

## 4. Responsibilities, deployment, and direct evidence

| File/module | One responsibility | Deployment inclusion | Direct production-path evidence |
|---|---|---|---|
| `src/math-tool.js` | operator row, five shape editors, non-shape drawer, advisory counter | admin script `?v=1.1.2` | real module mounted by `tests/math-tool.js`; prior owner browser acceptance |
| `src/math-tool.css` | math-tool layout and controls | admin stylesheet `?v=1.1.1` | real stylesheet assertions and prior browser acceptance |
| `src/owner-tool/render.js` | six-marker browser renderer | admin, CBT, and CBT Practice at `?v=2.3.3` | real JS vectors and disposable browser probes |
| `deployed/render.php` | six-marker PHP renderer/stripper | root include for server-rendered paths | real PHP include over shared vectors |
| `src/question-preview.css` | admin preview viewport and shape paint | admin stylesheet `?v=1.1.2` | real stylesheet plus computed browser geometry |
| `deployed/answer_details.php` | answer-detail delivery and shape styles | site root | PHP lint, renderer vectors, source inclusion |
| `deployed/cbt.php` | exam selection/delivery, grouping call, alias output, shape styles | site root | real 7-check HTTP staging and browser evidence |
| `deployed/cbt_practice.php` | practice delivery; phase scope changed its renderer token | site root manual patch | source/runtime probe exposes `BLOCK-9` |
| `deployed/subject_display.php` | exact-name display alias only | required by admin and CBT | real helper tests, source wiring, HTTP/browser output |
| `deployed/admin_questions.php` | authenticated native admin entry point and narrow asset/module wiring | site root | real disposable login, parser Load, D-106 failed save, D-108 output |
| `src/parser/core.js` | pure canonical parser | admin loads `?v=2.4.0` before helper | runner/unit suites; direct root-path gaps are `BLOCK-2` through `BLOCK-6` |
| `ocr_helper.js` | parser adapter, queue panel, native form fill | admin loads `?v=2.4.1` | real disposable page; current automated claim is incomplete (`BLOCK-6`) |

Entry points remain narrow in line count and wiring shape. `subject_display.php`
is cohesive. Promoting `src/parser/core.js` from excluded historical code to a
57,118-byte production dependency is architecturally coherent as one pure
parser module, but it requires the direct-path and preserved-behavior evidence
that is currently missing.

## 5. Acceptance coverage

### Phase 5, D-103/D-104, and D-105

The existing module suites, asset keys, sole Root control, joined radical rule,
fixed 150px Constant Text preview, content-sized Question preview, five shape
builders, three restored non-shape grids, byte counter, and JS/PHP parity all
reproduce. Prior owner desktop/Brave acceptance remains valid for the exact
controls it observed.

Three separate acceptance failures were found outside those happy-path vectors:
the fraction rule is not full-width for unequal terms (`BLOCK-7`), crossed
markers do not remain literal (`BLOCK-8`), and CBT Practice loads the structural
renderer without shape CSS and corrupts visible math meaning (`BLOCK-9`). These
are new first-round findings; no prior finding ID is reopened or repurposed.

### D-106

PASS on the direct authenticated failure path. The exact PDO message is still
logged, appended only in the authenticated save/update branch, and escaped once
through `h()`. Login, CSRF, success text, and PRG code were not changed. The
disposable HTML-marker error produced text, not an element.

### D-108

PASS. `deployed/subject_display.php:4-11` maps only the exact stored name.
Admin values remain numeric at `deployed/admin_questions.php:783,924,935`; all
three selects and list rows call the escaped display helper at
`:783,924,935,967`. CBT grouping receives the unmodified database name at
`deployed/cbt.php:185-188`, while visible setup/exam/result output uses the alias
at `:208,573,711,763`. CBT Practice neither requires nor calls the helper.
Constant Text/question styles remain 17px/800 and 20px/700 at
`deployed/cbt.php:321-341`.

The 14 real-module checks and seven real HTTP checks pass. The exact/near-name
implementation is byte-strict; no ID, SQL, grouping key, or CBT Practice alias
change was found. Deployment and the owner's live read remain external and were
not inferred from local evidence.

### RM01 and adapter guard

The supplied lowercase-stem, leading orphan, preamble, and exact unpunctuated
footer fixtures pass. Static wiring is correct:
`deployed/admin_questions.php:1050-1051` loads core `2.4.0` before helper
`2.4.1`, and the missing/wrong-version banner vectors pass.

Complete acceptance does not pass. Direct production-browser probes reproduce
silent source loss, E/F loss, mid-stream orphan merging, and structural text in
Option D. Two prior CONFIRMED comprehension expectations were rewritten rather
than preserved. The helper suite copies `parseAll` orchestration instead of
executing the exported production function. These are `BLOCK-2` through
`BLOCK-6`.

## 6. Fixture provenance and expectation integrity

The four new RM01 specs have valid schema/status/origin fields and handwritten
expectations. `region-preamble-paragraphs` and `region-footer-instruction` are
clearly synthetic. `region-lowercase-stems` and `region-orphan-number` name
user-supplied `ec20`/`ec20b` documents, but no archived source path or hash is
provided, so exact transcription could not be independently checked.

More materially, commit `ff3896d` changes two existing CONFIRMED specs:

```text
sample-comprehension-ambiguous:
  old: complete (a)-(d) stayed in the stem with four missing-option flags
  new: (a)-(d) become options with no flags

sample-comprehension-incomplete:
  old: partial (a)-(c) stayed in the stem
  new: (a)-(c) become partial options with only D missing
```

The old expectations are backed by `INV-102` and EC-97/EC-98. The RM01 package
does not record owner authority for changing them and explicitly states that
existing expectations are not to be regenerated and that a dependency on the
old behavior is a stop condition (`docs/plan/regions/rm-01-region-model.md:107-116`).
This is `BLOCK-5`.

The package also cites EC-127-EC-131 at lines 7-9, while RM01 is actually
EC-155-EC-159 at `docs/EDGE_CASES.md:286-290`.

## 7. Independent adversarial probes

### A. Root helper shared-stimulus loss

On the real disposable admin page, Load was given:

```text
1. Which option is right?
A. One
B. Two
C. Three
D. Four
Use the information below to answer questions 2 and 3
Total: 5
Balance: 3
2. Which option comes next?
A. Five
B. Six
C. Seven
D. Eight
3. Which option is last?
A. Nine
B. Ten
C. Eleven
D. Twelve
```

The visible native form contained only `Which option is right?` and A-D. The
marker/table existed only in `ocrQueue.items[0].stimuli`; the status had no flag.
A manual save would omit all three lines. The same behavior reproduces with the
CONFIRMED `new-edge-shared-stimulus` fixture. See `BLOCK-2`.

### B. E/F form loss

Input:

```text
1. Which option is right? A. One B. Two C. Three D. Four E. Five F. Six
```

Queue output had `e: "Five"`, `f: "Six"`, and the advisory flag. The native
form wrote only A-D and displayed D as `Four`; `Five` and `Six` had no editable
or saveable field. See `BLOCK-3`.

### C. Mid-stream orphan and structural ownership

A numbered Q24, an unnumbered `lump` plus A-D block, then Q25 produced only
`[24,25]`. Q24 Option D became:

```text
old-d lump A. plump B. lamp C. jump D. limber
```

No `num:null` item was emitted. Separately, inline A-D followed by `SECTION 2:`
and `According to Matthew, choose the correct answer.` left both lines in the
preceding Option D, with no invariant flag or region. See `BLOCK-4`.

### D. Fraction geometry

The real admin preview rendered `<frac>123456/7</frac>` with these computed
widths:

```text
fraction wrapper   68.109375px, no border
numerator          68.109375px, no border
denominator        17.21875px, 1px top border
```

The claimed full-width bar spans only the one-character denominator. The same
denominator-border rule is present on all three supported paint surfaces. See
`BLOCK-7`.

### E. Crossed markers

Both real renderers return the same incorrect result:

```text
input   <u><sup>x</u></sup>
format  <u><sup>x&lt;/u&gt;</sup></u>
strip   x</u>
```

The input stays escaped and does not execute HTML, but it does not remain
literal as INV-97 requires. See `BLOCK-8`.

### F. CBT Practice shape semantics

The exact production browser renderer was loaded with no shape CSS, matching
`cbt_practice.php`. Results:

```text
<frac>3/7</frac>          visible text "37", all spans inline
<sqrt>2x+1</sqrt>        visible text "√2x+1", no vinculum
<matrix>a|b|c|d</matrix> visible text "[abcd]", no grid
shape CSS rules          0
```

`cbt_practice.php:616,686,786,870-877` invokes the renderer for both current and
result questions, while its style block ends at line 420 with no fraction/root/
matrix rules. See `BLOCK-9`.

## 8. Findings

The phase/cycle records have used `FIX-1` and `NOTE-1` through `NOTE-12`, but no
`BLOCK` ID. This original boundary review starts `BLOCK-1` and continues notes
at `NOTE-13`.

### BLOCK-1 - `ff3896d` is not a valid current-`main` fast-forward boundary

**Exact defect.** Current `main` is not an ancestor of `ff3896d`; the histories
have three main-only and 111 target-only commits. Advancing `main` to the exact
target therefore cannot follow the mandatory fast-forward-only strategy.
Furthermore, exact `ff3896d` tracks unrelated `session-ses_e35a.md` (880 lines,
26,239 bytes, SHA-256 `b156cbf3afcc301bfe09438868743653b63b64a295ccd5b1f3c84f34721ff1d7`),
which the next commit removes.

**Supported operating preconditions.** The owner attempts the requested main
release from current `main` under `docs/plan/README.md:269-290`, without history
rewriting or silently bundling unrelated material.

**Finite closure criteria.**

1. Establish an owner-authorized release target containing current `main`, all
   accepted product fixes, and the integration history without force-push,
   rebase, or history rewriting.
2. Make `git merge-base --is-ancestor main <target>` return true.
3. Ensure `session-ses_e35a.md` and every other unrelated artifact are absent
   from that exact target.
4. Re-run the release review against the exact final target, not `ff3896d` plus
   an inferred future merge.

**Required evidence.** Exact refs, merge-base/ancestor output, target status,
target tree diff, and re-review record.

**Non-goals/deferred.** This review does not merge, move, fast-forward, commit,
push, deploy, or authorize `main`; it does not prescribe a history-rewriting
shortcut.

### BLOCK-2 - RM01 silently removes shared-stimulus source from the saveable form

**Exact defect.** `src/parser/core.js:761-765,849-850` extracts a standard
intro/table into `q.stimuli`, while root `ocr_helper.js:65-70` fills only the
question and A-D. The exact probe above leaves the table only in hidden queue
metadata and emits no flag. This violates the ordinary-question fallback at
`docs/SPEC.md:29-32` and RM01's unchanged form/fill boundary.

**Supported operating preconditions.** A logged-in admin uses the shipping Add
Question page, pastes an ordinary numbered question whose completed A-D block is
followed by the exact standard intro/table probe, then manually saves the
visible form. No unsupported multi-section paste, stale asset, or violated
deployment precondition is required.

**Finite closure criteria.**

1. For the exact `Use the information...` / `Total: 5` / `Balance: 3` probe,
   retain every source line in a visible editable native field that participates
   in manual save; none may survive only in `q.stimuli`.
2. If assignment is uncertain, display an advisory review flag rather than
   silently omitting text.
3. Add a real root-helper production-path regression that clicks Load and
   asserts the visible form and queue, not only core `parsePaste` output.
4. Keep all existing 64 fixtures, stimulus parser tests, storage keys, and
   native server fields passing.

**Required evidence.** Failing-first direct browser/DOM test, exact before/after
form values, full Node/PHP baseline, disposable production-page Load probe, and
updated handoff measurements.

**Non-goals/deferred.** Do not populate Constant Text, add an image plan,
restore Auto-Save, change the PHP save contract, or add storage/network behavior.

### BLOCK-3 - RM01 parses E/F into fields that the native form discards

**Exact defect.** `src/parser/core.js:801-848` emits separate `e`/`f` values,
but `ocr_helper.js:65-70` writes only A-D. The exact A-F probe displays Option D
as `Four` and makes `Five`/`Six` unsaveable. Before RM01, the root helper matched
only A-D, so later E/F text remained visibly appended to D. EC-37 and the agent
contract preserve that no-key E/F-to-D behavior.

**Supported operating preconditions.** A logged-in admin pastes the exact A-F
probe on the shipping Add Question page and reviews/saves manually. The native
four-option server contract is unchanged.

**Finite closure criteria.**

1. The exact probe must place visible `E. Five` and `F. Six` text in native
   Option D after `Four`, with no source text retained only in hidden `e`/`f`.
2. No correct-answer radio is preselected without a key.
3. Add a direct Load/form regression over the real helper and retain the
   existing advisory behavior.
4. Preserve the four-option PHP contract and all D-91 A-D controls.

**Required evidence.** Failing-first real-helper test, disposable page form
values/status, full baseline, and handoff mapping.

**Non-goals/deferred.** Do not add native Option E/F inputs, change server
validation, invent an answer key, or alter the E/F contract beyond the exact
no-key loss reproduced here.

### BLOCK-4 - RM01 Stage B/C rules do not handle the mid-stream cases they promise

**Exact defect.** `splitRegions` creates an orphan only from the pre-first-stem
`headText` at `src/parser/core.js:255-264`; an unnumbered A-D block after a
numbered question is merged into the preceding Option D. Also,
`regionHeading` rejects terminal punctuation at `:131-136`, and `sawOption` is
set only by a whole-line option at `:236-250`. Consequently the exact
`SECTION 2:` / `SECTION 2.` and inline-option instruction probes remain in the
preceding Option D without the Stage-D flag. This reproduces RM01's stated
problem and contradicts `INV-152` and EC-23/EC-156/EC-157.

**Supported operating preconditions.** A single supported paste contains a
normal numbered question, a clearly delimited unnumbered A-D block before the
next numbered stem, or a common section heading/instruction after a complete
inline or vertical option block. Numbering otherwise obeys the existing guard.

**Finite closure criteria.**

1. The exact Q24/orphan/Q25 probe returns nums `[24,null,25]`; Q24 D remains
   `old-d`, and the orphan is `lump` with `plump/lamp/jump/limber`.
2. Exact `SECTION 2:`, `SECTION 2.`, and `According to Matthew, choose the
   correct answer.` probes after complete inline and vertical A-D sets leave the
   preceding D as `Four` and govern the following stem through
   `sectionInstruction`/`regions`.
3. If one of those exact structural lines ever reaches an option, emit the
   documented `option X contains section heading or instruction` flag.
4. Add direct core and real-helper regressions while preserving the numbering
   guard, keys, dividers, blank options, and supplied region fixtures.

**Required evidence.** Failing-first vectors for every named input/layout,
browser Load/form output, full baseline, and no fixture weakening.

**Non-goals/deferred.** Do not replace the numbering guard, infer arbitrary
natural-language headings, split ordinary continuation prose, or broaden beyond
the exact reproduced structures without owner authority.

### BLOCK-5 - RM01 rewrites CONFIRMED scoped-option expectations without authority

**Exact defect.** `ff3896d` changes the two existing CONFIRMED expected files at
`fixtures/expected/sample-comprehension-ambiguous.json:16-31` and
`sample-comprehension-incomplete.json:25-57` to match new global parsing. The
pre-RM assertions are backed by `docs/INVARIANTS.md:165-167` and
`docs/EDGE_CASES.md:45-46`. RM01 neither records an owner requirement change nor
acknowledges the correction, despite its explicit no-regeneration rule and stop
condition at `docs/plan/regions/rm-01-region-model.md:107-116`.

**Supported operating preconditions.** The historical `parsePaste` API processes
the exact supplied PASSAGE IV single-candidate fixture or PASSAGE V partial
`(a)`-`(c)` fixture. These remain supported CONFIRMED fixtures in the required
baseline.

**Finite closure criteria.**

1. Restore the two pre-RM doc-backed expected behaviors and their `must_not`
   assertions byte-for-byte in substance.
2. Make the canonical parser pass them without weakening the ordinary root
   D-91 complete spacing/selected-boundary controls.
3. Record any legitimate fixture correction with source authority in the
   package handoff; do not derive expectations from current parser output.
4. Run the complete fixture/unit/helper baselines with no pending or orphan
   fixture.

**Required evidence.** Failing-first output against the restored expectations,
the final expected-file diff/provenance, all parser/helper suites, and the exact
D-91 regression.

**Non-goals/deferred.** Do not revive the archived context UI/database system.
Only the owner may change the scoped-option requirement; a fix or re-review may
not infer such a change from RM01's implementation.

### BLOCK-6 - RM01 lacks the required direct production-path proof and final handoff

**Exact defect.** `tests/ocr-helper.js:18-21` defines a duplicate `parseAll`
instead of invoking exported `helper.parseAll`; its browser VM checks at
`:225-313` mount the panel but never click Load or inspect storage/form output.
The fixture runner exercises core `parsePaste`, while production uses
`splitQuestions(...).map(parseQuestion)` at `ocr_helper.js:20-22`. This copied
or bypassed orchestration cannot prove the production path and missed
`BLOCK-2` through `BLOCK-4`. The RM01 package also has no exact Git base, final
per-file handoff, exclusions, hashes, terminal command, or allowed final status;
its line 3 still says `implementation package`. A copied-path test claim is an
externalize-first blocker under `docs/plan/README.md:139-157`.

**Supported operating preconditions.** RM01 is claimed done and promoted to the
shipping admin path at the release target; the release relies on its package and
helper suite as direct evidence.

**Finite closure criteria.**

1. Make helper parser vectors call the real exported `helper.parseAll`; remove
   the duplicated orchestration.
2. Add a browser/DOM test that executes the real helper source, clicks Load,
   then asserts `ocrQueue`, status, and native form values for all four supplied
   region fixtures and the exact `BLOCK-2` through `BLOCK-4` probes.
3. Complete the RM01 handoff at original base `455ea54` with every production
   file's additions/deletions, final lines/bytes/hash, responsibility,
   deployment inclusion, direct test, approvals, and excluded artifacts; set an
   allowed status only after all acceptance passes.
4. Correct the EC citation and attach an auditable source path/hash or explicit
   owner confirmation for the two user-sample transcriptions.
5. Run all PHP suites and lint every deployed PHP file on the documented PHP
   8.3 target at the final exact tip, in addition to Node and browser evidence.

**Required evidence.** Test diff proving no copied `parseAll`, failing-first and
passing direct form vectors, completed handoff tables, PHP 8.3 outputs, full
baseline, and exact-target measurements.

**Non-goals/deferred.** No live paste, live save, deploy, MySQL operation,
parser refactor for style, or unrelated fixture expansion is required.

### BLOCK-7 - Phase-5 fraction bars are not full-width

**Exact defect.** `src/question-preview.css:44-63`,
`deployed/cbt.php:522-524`, and `deployed/answer_details.php:168-170` put the
border only on an independently sized denominator while centering both terms.
For `<frac>123456/7</frac>` the rule is 17.21875px under a 68.109375px
numerator. This fails the explicit full-width rendering contract in
`docs/plan/math-editor/ms-01-visual-math-shapes.md:65-68,212`.

**Supported operating preconditions.** A valid exact fraction marker has terms
with unequal rendered widths on any of the three supported paint surfaces.

**Finite closure criteria.**

1. On preview, CBT, and answer-details surfaces, the horizontal rule spans the
   width of the wider term for both `<frac>123456/7</frac>` and
   `<frac>3/765432</frac>`.
2. Keep numerator above denominator, center both terms, and retain inline
   vertical alignment.
3. Strengthen the real stylesheet test so the existing denominator-only rule
   fails; do not assert only that some border exists.
4. Re-run computed browser geometry on desktop and a narrow viewport plus the
   full JS/PHP marker baseline.

**Required evidence.** Failing-first style assertion, exact three-surface CSS
parity, computed term/bar widths for both vectors, full baseline, and refreshed
hashes/tokens if bytes change.

**Non-goals/deferred.** No marker syntax, renderer split logic, schema, stored
text, palette builder, or non-fraction geometry change.

### BLOCK-8 - Crossed marker pairs format instead of remaining literal

**Exact defect.** Both scanners accept an outer pair merely because its closing
token exists later (`src/owner-tool/render.js:52-75` and
`deployed/render.php:35-66`). The crossed input `<u><sup>x</u></sup>` becomes
partially formatted and `strip` loses opening markers. INV-97 explicitly says
overlapping markers remain literal. The output remains escaped, so this is a
contract defect, not an XSS claim.

**Supported operating preconditions.** Stored manually edited text contains the
exact crossed marker input and is rendered or stripped on any shared surface.

**Finite closure criteria.**

1. JS and PHP `format` return the whole exact source as escaped literal text:
   `&lt;u&gt;&lt;sup&gt;x&lt;/u&gt;&lt;/sup&gt;`.
2. JS and PHP `strip` preserve the exact literal source
   `<u><sup>x</u></sup>`.
3. Add the case to the shared authored vector table so both real renderers run
   it; prove the current implementation fails that vector first.
4. Preserve all valid nesting, repeated-own-open, unmatched, uppercase,
   attributed, encoded, and injection vectors.

**Required evidence.** Failing-first shared vector, 0 JS/PHP parity mismatches,
full marker suites, injection probe, PHP lint, and manifest/hash refresh.

**Non-goals/deferred.** No permissive HTML, no new marker, no rich-text parser,
and no requirement change for valid differently nested markers.

### BLOCK-9 - CBT Practice removes fraction/matrix separators without shape styles

**Exact defect.** `cbt_practice.php:616,686,786,870-877` loads and invokes the
new structural renderer for current and result questions, but its CSS ends at
line 420 with no `.cbt-frac`, `.cbt-sqrt`, or `.cbt-matrix` rules. The renderer
removes `/` and `|` into structural nodes, so valid stored math displays as
`37`, `[abcd]`, and a bare-root expression. This is a material candidate-path
regression introduced by the required D-102 renderer-token change, even though
feature work inside CBT Practice was otherwise a package non-goal.

**Supported operating preconditions.** A normal active question containing an
exact phase-5 shape marker is selected by the existing CBT Practice path. No
Constant Text, English Lexis alias, unsupported storage, or stale cache is
required.

**Finite closure criteria.**

1. On both the current-question and result-question CBT Practice surfaces,
   `<frac>3/7</frac>` visibly retains numerator, full bar, and denominator;
   `<sqrt>2x+1</sqrt>` has a joined vinculum; and
   `<matrix>a|b|c|d</matrix>` remains a bracketed 2x2 grid.
2. Add direct CBT Practice style/render evidence using the real renderer and
   production page, including computed layout rather than source-token checks
   alone.
3. Add `deployed/cbt_practice.php` to exact deployment hash/measurement
   coverage and retain its fresh renderer token.
4. Keep its filters, selection, attempt/result behavior, raw subject display,
   and absence of Constant Text unchanged.

**Required evidence.** Failing-first practice rendering probe, desktop/narrow
computed geometry, strengthened automated test, full baseline, PHP lint, and
manifest/hash refresh.

**Non-goals/deferred.** No D-108 alias in CBT Practice, no Constant Text there,
and no change to its SQL, question selection, options, answers, timing, or
attempt storage.

### NOTE-13 - Current-facing release documentation is internally stale

`docs/SPEC.md:3-7,34-36` still calls `src/parser/core.js` historical and
non-production. `docs/DEPLOYMENT.md:1-14` omits RM01 from its stated scope;
its hash table omits changed `cbt_practice.php`; and stop conditions at
`:234-236` reject the actual accepted `math-tool.js?v=1.1.2` and
`math-tool.css?v=1.1.1` tokens. Coordinator/status prose still includes older
tip, uncommitted-state, and +94/+57 measurements despite exact target values of
+96/+51. These are documentation defects, not additional product findings.
They should be reconciled in the fix handoff without editing this immutable
record.

## 9. Approvals, prior findings, and external gates

- Phase 5 `FIX-1` remains closed for the cache-key vectors it named.
- Phase-5 `NOTE-1` through `NOTE-8` and cycle `NOTE-9` through `NOTE-12`
  retain their recorded dispositions; this review does not reuse them.
- D-103/D-104 owner desktop/Brave acceptance from 2026-11-17 remains recorded.
- D-105 owner desktop/Brave acceptance from 2026-11-18 remains recorded.
- D-106 and D-108 have direct owner-request authority. This review confirms
  their implemented paths locally and adds no finding against either behavior.
- RM01 has owner `go` recorded in its package, but authority to implement it did
  not authorize source loss, fixture weakening, copied-path evidence, or a
  release branch-policy exception.
- Production deployment, D-108 live display verification, RM01 owner browser
  re-paste after deployment, the English Lexis production operation, and any
  live save remain external. None was run or marked passed here.

## 10. Excluded and unrelated artifacts

Excluded from production limits/deployment evidence:

- `archive/live-sources/*` and `archive/owner-tool-2026-11/*` (source snapshots
  and history; live snapshots were used only for numstat);
- `deployed/sql/base-schema.working.sql` and all disposable SQL/database state;
- generated `src/bookmarklet.js` and untracked `src/bookmarklet.min.js`;
- tests and fixtures as non-production evidence artifacts;
- `tools/phone-staging/*`, the local staging root/database/log/PID, and browser
  profile/output files;
- the local PHP 8.5.12 CLI and every file under `$HOME/tmp`;
- unavailable live `cbt_db.php`, `header.php`, `footer.php`, and
  `cbt_exam_attempts` artifacts.

`src/parser/core.js` is **not** excluded: RM01 promotes it to production.
`deployed/cbt_practice.php` is **not** excluded: its renderer token is a release
byte. `session-ses_e35a.md` is unrelated and non-deployable, but it is tracked
by exact `ff3896d`; that Git-boundary contamination cannot be hidden by calling
it a deployment exclusion (`BLOCK-1`).

## 11. Verdict and next action

**Verdict: BLOCK.** The exact target is not a valid `main` fast-forward, RM01
causes four reproduced production-path behavior failures and violates fixture
and evidence guardrails, and phase 5 misses three explicit rendering contracts.
Green baseline suites do not override the direct browser and renderer
reproductions.

- **Commit readiness:** not ready. The review record itself is the only allowed
  session change; no product fix or release commit is authorized here.
- **Main-release readiness:** not ready. `BLOCK-1` through `BLOCK-9` must close
  against one exact main-integrable target before `main` can advance.
- **Review status:** original review complete; all nine BLOCK findings are in
  their first review round and have frozen closure contracts above.
- **Recommended next action:** run one Gate-1 fix session for the remaining
  findings after the owner dispositions in section 12. The fix session must stop
  for owner clarification rather than broaden any criterion, especially the
  scoped-parenthesized-option conflict and the branch reconciliation.

## 12. Owner dispositions (2026-11-22)

The owner reviewed the nine findings and set the release scope:

- **BLOCK-2 withdrawn.** Parser scope is the question stem, options, and
  headers. Constant Text is filled manually, and answer-key parsing is not
  required. Removing a shared intro/table is intended; the experiments branch
  owns Constant Text and key parsing.
- **BLOCK-3 withdrawn.** The owner accepts dropping E/F in the root helper. The
  documented E/F-to-D behavior remains out of scope for this release.
- **BLOCK-4 retained, narrowed.** The motivating `ec20.txt` (23 clean items with
  section instructions) and `ec20b.txt` (null-number orphan plus 25-27) parse
  correctly. Only the mid-stream orphan and trailing-heading layouts still merge
  into Option D.
- **BLOCK-9 withdrawn.** `cbt_practice.php` is not part of this release and was
  removed from the repository (`git rm`), with `tests/math-tool.js`,
  `tests/cbt-question-order.php`, and `docs/DEPLOYMENT.md` updated to match.

Remaining findings: `BLOCK-1`, `BLOCK-4` (narrowed), `BLOCK-5`, `BLOCK-6`,
`BLOCK-7`, and `BLOCK-8`. The field contract is now written into
`docs/SPEC.md` §3.5 and `D-109`, with `INV-154`/`INV-155`. Four fixtures were
added: `real-ec20` and `real-ec20b` pass; `region-midstream-orphan` and
`region-midstream-heading` are failing-first for `BLOCK-4`, so the runner is
intentionally red (66 PASS, 2 FAIL) until the fix session.

NEXT COMMAND: @docs/plan/prompts/fix-session.md fix math-editor-2026-11 main release BLOCK-1 BLOCK-4 BLOCK-5 BLOCK-6 BLOCK-7 BLOCK-8 from docs/plan/reviews/math-editor-2026-11-main-release-review.md
