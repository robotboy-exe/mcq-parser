# Cycle Review — `math-editor-2026-11` (Phases 1–5 and D-105)

- **Date:** 2026-11-18
- **Reviewer:** independent review session
- **Scope:** the whole active cycle as explicitly authorized by the owner
  ("full cycle"): phase 1 `ST01`, phase 2 `ME01`, phase 3 `ME02`, phase 4
  `EL01`, phase 5 `MS01` including D-103/D-104, and the unreviewed D-105
  palette restoration at `23a406c`. Complete package acceptance and the
  production boundary at the cycle tip.
- **Map:** [`prompts/phase-map.md`](../prompts/phase-map.md); coordinator
  [`README.md`](../README.md); intent [`INTENT.md`](../../../INTENT.md)
- **Reviewed state:** `HEAD` `596fb31eb60706516f4a9b04f80b68671016c688`
  (clean worktree, chat branch `freebuff/315e99e596074b6dca64aedc`). An
  authenticated fetch shows the remote `owner-tool-integration` tip at the same
  commit (`FETCH_HEAD` `596fb31`, also containing `23a406c`, `120a5db`,
  `c6a81fb`).
- **Cycle base:** `134305c` (archived-cycle close; cycle planned at `a3b93b7`),
  independently established from `docs/STATUS.md`, the coordinator, and
  `git log 134305c..HEAD`.
- **Mode:** cycle-wide original review. Every phase already has its own settled
  record; this record adds the missing cycle-level review and disposes the
  previously unreviewed D-105 commit. No prior record was modified, no finding
  ID was reused, and no prior finding was broadened.
- **Record name:** `math-editor-2026-11-cycle-review.md`. The per-phase naming
  rule in [`README.md`](README.md) has no cycle-wide form; this name cannot
  collide with an existing or future `-phase-N` record.
- **Files written:** this record only. No product, test, fixture, package,
  coordinator, status, or prior review file was changed; no branch was created,
  switched, or moved; nothing was staged, committed, pushed, deployed, or run
  against a live site or a database.

## 1. Authority and resolution

The active cycle resolves to `math-editor-2026-11`, phases 1–5 as above. The
coordinator, phase map, `docs/STATUS.md`, and the package files agree: phases 1–4
are `done` and review-settled, phase 5 is `done` and review-settled through
`FIX-1` closure and the focused D-103/D-104 review, and D-105 (owner request
2026-11-18) is committed at `23a406c` **without** a package row or rigorous
review. That last gap is what this review closes; it also re-establishes the
cycle-wide production boundary and guardrails at the tip.

No `BLOCK` or required `FIX` is open anywhere in the cycle: every phase-1 to
phase-5 record ends `PASS` or `PASS WITH ACCEPTED FINDINGS`, with its `FIX`
findings closed by a later re-review.

## 2. Repository and change scope

```text
git rev-parse HEAD                     596fb31eb60706516f4a9b04f80b68671016c688
git status --porcelain=v1             (empty; clean worktree)
git diff --check                      clean
git merge-base --is-ancestor HEAD FETCH_HEAD   true (remote tip = HEAD)
local owner-tool-integration ref      e64513f   (stale clone copy, pre-cycle)
local origin/owner-tool-integration   a3b93b7   (stale clone copy, pre-cycle)
```

The local refs are stale copies in this clone; the authenticated fetch resolves
the authoritative remote tip to `596fb31`. The phase-5 `NOTE-5` bookkeeping
concern (chat branch vs authoritative ref) is therefore satisfied at the remote,
not merely asserted: the cycle history is on `owner-tool-integration`.

Cycle commits (`134305c..HEAD`): `a3b93b7` plan, `6ceaaff`, `73009ac`,
`3a0fe4d`, `e64513f` merge, `6e301bb` ST01 WIP, `84be892`, `7a93342`,
`a20e324`, `cdbff2b` reverts, `7f5b4aa` ME01, `691626f` ME02, `1488da4`,
`8bd5410`, `3f5d2ea`, `e08b922` EL01, `0410ecb` cycle-close docs, `c6a81fb`
MS01 boundary, `120a5db` D-103/D-104, `23a406c` D-105, `596fb31` docs
reconciliation.

Cycle-wide non-doc numstat (`git diff --numstat 134305c..HEAD`) contains only
the cycle's own production files, tests, fixtures, ops SQL, the ST01 archive
moves under `archive/owner-tool-2026-11/`, the ST01/EL01 staging harness under
`tools/phone-staging/`, and the ST01 evidence files (`new-edge.txt`,
`docs/NEW_EDGE_CASES.txt`, `tests/fixtures/ocr-helper-*`). Every one of those is
attributed to a reviewed package in the phase-1 to phase-4 records; no unrelated
or owner-owned change is present, and none was reverted.

### Live-origin externalize-first caps

`git diff --no-index --numstat` against the designated archived live snapshots:

| File | Live snapshot | Additions / deletions | Cap |
|---|---|---:|---:|
| `deployed/admin_questions.php` | `admin_questions-2026-10-31.php` | **+89 / −80** | ≤100 |
| `deployed/cbt.php` | `cbt-2026-10-31.php` | **+74 / −35** | ≤100 |
| `deployed/answer_details.php` | `answer_details-2026-11-02.php` | **+21 / −3** | ≤100 |
| `deployed/cbt_practice.php` | `cbt_practice-2026-10-31.php` | **+20 / −2** | ≤100 |
| `ocr_helper.js` | `ocr_helper-2026-11-01.js` | **+57 / −20** | ≤100 |

All five are inside the 100-addition cap; no deletion offsets an excess and no
owner exception exists or is needed. (The older `archive/live-sources/
ocr_helper.js` snapshot measures +61/−22; the designated 2026-11-01 snapshot is
the one the phase-1 records use.) `deployed/cbt.php` sits exactly at its phase-5
Gate 1 planning ceiling; D-103/D-104/D-105 did not raise it.

## 3. Baselines and acceptance coverage

Node was run on v26.13.0; PHP on a static **PHP 8.3.32** CLI provisioned outside
the workspace (`$HOME/php83`, excluded artifact), matching the PHP 8.3
application target.

```text
node tests/runner.js                PASS 60 / FAIL 0 / PENDING 0
node tests/unit.js                  PASS 163 / FAIL 0
node tests/ocr-helper.js            PASS 11
node tests/underline-toolbar.js     PASS 10
node tests/question-preview.js      PASS 6
node tests/math-tool.js             PASS 26
node tests/render-markup.js         PASS 67
node tools/extract-bank.js --check  OK (source, anchors, counts, 7 hashes)
php tests/php-render.php            PASS 32
php tests/admin-question-store.php  PASS 8
php tests/cbt-question-order.php    PASS 11 / FAIL 0
php -l (every tracked deployed/*.php)  PASS, 0 failures
node --check (6 changed JS files)   PASS
git diff --check                    clean
deployment manifest                 13 hash-bearing rows / 0 mismatches
```

The deployment manifest was re-verified independently: every hash-bearing row in
`docs/DEPLOYMENT.md` was re-read from disk and compared for lines, bytes, and
SHA-256 — 13 rows, 0 mismatches.

Per-phase acceptance reproduced at the tip:

| Phase | Reproduced evidence |
|---|---|
| 1 `ST01` | root helper is the production path (`admin_questions.php:1049`), 11 helper vectors cover D-91's exact `A) … A ) … B)` boundary; Constant Text field and session prefill present; underline toolbar 10 vectors; helper live-origin **+57/−20** |
| 2 `ME01` | counter thresholds (`56999` neutral / `57000` amber / `60000` red), refresh after `ocr_load`, `ocr_skip`, and form reset, UTF-8 byte counting, no `maxlength` write; admin loads palette after preview |
| 3 `ME02` | release tokens and manifest: `question-preview.css?v=1.1.2`, `math-tool.css?v=1.1.1`, `math-tool.js?v=1.1.2`, `render.js?v=2.3.3`; no untokened or stale key on any changed shared asset; manifest 13/13 |
| 4 `EL01` | `deployed/cbt.php:4` requires `cbt_question_order.php`; 11 ordering/wiring checks pass over the real module, including ID-multiset, ascending-`id` member order, blank singletons, and `cbt_practice.php` isolation; `cbt_practice.php` renderer at `2.3.3` |
| 5 `MS01` | operator row exactly `± × ÷ ≠ ≈ ° π`; five shape ids with field counts `[2,2,2,1,4]`; exact `<frac>`/`<sup>`/`<sub>`/`<sqrt>`/`<matrix>` builders; sole visual Root control; joined radical rule identical on preview, CBT, and details; 67 shared JS/PHP vectors |
| D-103/D-104 | Constant Text preview is the only `150px` border-box scroller; base Question preview has no height/max-height/overflow-y (assertion proves both invalid mutations fail); `math-tool.js`/`question-preview.css` tokens rotated |
| D-105 | `More symbols` drawer exists with exactly three restored grids; 38 characters, none shape-covered, all named; toggle rule after the shared button rule; `[hidden]` rule present and no base `display` that could defeat it |

Not run in this review: real browser rendering, mobile viewports, native
form save/PRG, MySQL, HTTP staging, deployment, and any live read or write. Those
remain external owner/deployment gates; the phase records and this record state
them as deferred rather than passed.

## 4. Measurements, responsibility, and deployment inclusion

Final `wc -l -c` at the tip; cycle diff from `134305c`; hashes verified against
the manifest where listed.

| File | Cycle diff | Final lines / bytes | Responsibility | Deployment inclusion |
|---|---:|---:|---|---|
| `src/math-tool.js` | +660 | 660 / 21427 | operator row, five shape editors, restored symbol drawer, advisory counter | `admin_questions.php:1052` (`?v=1.1.2`), once |
| `src/math-tool.css` | +255 | 255 / 4118 | toolbar, drawer, panels, preview, counter, mobile targets | `admin_questions.php:695` (`?v=1.1.1`), once |
| `src/owner-tool/render.js` | +264 / −65 | 408 / 13764 | six-marker scanner and DOM renderer | `admin_questions.php:1048`, `cbt.php:801`, `cbt_practice.php:616`, all `?v=2.3.3` |
| `deployed/render.php` | +213 / −43 | 248 / 8161 | PHP parity scanner, `cbt_format_text`, `cbt_strip_formatting` | required by `answer_details.php:6`; admin list summary via `cbt_strip_formatting` (`admin_questions.php:965`, `h()`-escaped) |
| `deployed/cbt.php` | +140 / −65 | 1083 / 46953 | exam delivery, Constant Text block, EL01 post-selection ordering call, inline shape rules, renderer token | site root; requires `cbt_db.php` and `cbt_question_order.php` |
| `deployed/answer_details.php` | +19 / −2 | 268 / 13671 | detail delivery plus inline shape rules | site root; requires `render.php` |
| `deployed/admin_questions.php` | +44 / −54 | 1055 / 62662 | native form, Constant Text/session prefill, asset inclusion | site root; requires `admin_question_store.php` |
| `deployed/cbt_practice.php` | +1 / −1 | 886 / 37246 | practice delivery, renderer token only | site root |
| `ocr_helper.js` | +57 / −20 | 160 / 6284 | production OCR helper (D-91 grammar), no Constant Text | `admin_questions.php:1049`, untokened (see `NOTE-9`) |
| `src/underline-toolbar.js` | +136 | 136 / 4288 | runtime Underline button | `admin_questions.php:1050`, untokened (new URL) |
| `src/question-preview.js` | +104 | 104 / 3759 | read-only preview | `admin_questions.php:1051`, untokened (new URL) |
| `src/question-preview.css` | +117 | 117 / 2069 | preview viewport and shape paint | `admin_questions.php:694` (`?v=1.1.2`), once |
| `deployed/cbt_question_order.php` | +56 | 56 / 1444 | EL01 grouped ordering only | required by `cbt.php:4` |
| `deployed/admin_question_store.php` | +113 | 113 / 4918 | extracted save/delete transaction | required by `admin_questions.php:7` |
| `tests/math-tool.js` | +660 | 660 / 28485 | palette/editor/counter/asset harness | not deployed |
| `tests/question-preview.js` | +230 | 230 / 8301 | preview contract harness | not deployed |
| `tests/render-markup.js` | +103 | 103 / 3614 | JS parity runner over the shared vectors | not deployed |
| `tests/fixtures/render-markup.json` | +197 | 197 / 7362 | authored JS/PHP vector table | not deployed |

Entry points stay narrow: `admin_questions.php` carries one store include and six
asset tags, `cbt.php` one ordering include, one inline style block, one token,
and `answer_details.php` one renderer include and one inline style block. No
cycle file is monolithic, and no module has more than one responsibility.
New-cycle modules have no line cap and each has a verified deployment path.

## 5. Production-path and fixture provenance

Every claimed harness executes the real artifact, not a copy:

- `tests/math-tool.js` `require`s `src/math-tool.js`, mounts it in a DOM shim,
  and reads the real `deployed/admin_questions.php`, `deployed/cbt.php`,
  `deployed/cbt_practice.php`, `src/math-tool.css`, and `src/question-preview.css`.
- `tests/render-markup.js` `require`s the real `src/owner-tool/render.js`;
  `tests/php-render.php` `require_once`s the real `deployed/render.php`; both
  consume the same authored 32-case table (67 assertions including the two
  structural vectors).
- `tests/question-preview.js` runs the real `src/question-preview.js` with the
  real renderer and parses the real stylesheet.
- `tests/cbt-question-order.php` requires the real ordering module and asserts
  the real `cbt.php` include line; `tests/admin-question-store.php` requires the
  real store module; `tests/ocr-helper.js` and `tests/underline-toolbar.js` run
  the real root helper and toolbar.

Fixture provenance: `tests/fixtures/render-markup.json` is authored from the
stated marker contract (case names state the rule: "script tag stays text",
"attributes stay text", "encoded markers stay text", "uppercase markers stay
text"), not generated from renderer output. The one disclosed correction
(phase-5 `NOTE-4`) was independently re-derived and agrees with the contract.
The parser fixtures are untouched by this cycle and `extract-bank --check`
reports 7 matching hashes.

## 6. Independent adversarial probes

**A — JS/PHP renderer parity fuzz, 513 inputs.** 500 deterministic pseudo-random
strings from a marker-heavy alphabet (`<u>`, `<frac>`, `<sup>`, `<sub>`,
`<sqrt>`, `<matrix>`, uppercase/attribute/encoded/unclosed/stray forms, `/`, `|`,
`<`, `>`, `<script>`, quotes, emoji, NUL) plus 13 hand-built boundary cases
(nested root/fraction, matrix with three cells, adjacent roots, doubled
matrices):

```text
PARITY inputs=513 mismatches=0 unexpected_tags=0
```

Every `format()`/`strip()` result is byte-identical between
`src/owner-tool/render.js` and `deployed/render.php`, and no output contains a
tag outside the allowed element set. Stored `<script>` stays escaped text in
`format()` and is escaped again by `h()` on the admin list path, so the
`strip()` text view is not an injection path.

**B — cache-key audit (the phase-5 `FIX-1` boundary).** Every reference to a
cycle-changed shared asset was enumerated across all four pages:

```text
src/question-preview.css  v=1.1.2  (admin, once)
src/math-tool.css         v=1.1.1  (admin, once)
src/math-tool.js          v=1.1.2  (admin, once)
src/owner-tool/render.js  v=2.3.3  (admin, cbt, cbt_practice; once each)
untokened changed asset   0 of the four; no 2.3.2c anywhere
```

The two untokened scripts are `ocr_helper.js` and the new URL
`src/underline-toolbar.js`; the first is a documented residual risk in
`NOTE-9`, the second is a new URL that cannot have a stale cached copy.

**C — D-105 drawer probe (the newly reviewed boundary).** Independent of the
package tests:

```text
drawer_chars=38  shape_covered=[]  unnamed=[]  internal_dupes=[]
categories=[["Greek",17],["Set theory and logic",12],["Geometry and vectors",9]]
operators=["±","×","÷","≠","≈","°","π"]
toggle_rule_after_shared_rule=true
drawer_[hidden]_rule=true  drawer_base_display_rule=false
forbidden_writes (localStorage|fetch(|innerHTML|<u>|constant_text|.submit())=false
```

The drawer cannot reintroduce a shape-covered character, every restored button
has an accessible name, the toggle's size/colour rule cannot be overridden by
the shared button rule, and the `hidden` attribute is not defeated by a base
`display` declaration — the classic failure mode for a toggled drawer.

**D — D-104 viewport contract re-challenge.** The corrected assertion was
re-run against both invalid mutations (`height` → `xheight`, and a fixed
150px/`overflow-y: auto` block on the base Question preview); both fail, and the
real stylesheet passes.

## 7. Findings

The cycle's highest used note ID is `NOTE-8` (phase-5 D-103/D-104 record), so
this record continues that namespace. No `BLOCK` and no `FIX` were found: the
cycle's acceptance rows, live-origin caps, guardrails, module boundaries,
deployment paths, and cross-runtime marker contract all reproduce at the tip.

### NOTE-9 — The primary helper reaches a returning admin browser only after the manual cache step

**Issue.** `src/`-side changes carry fresh tokens, but root `ocr_helper.js` — the
cycle's largest behavioral change (+57/−20, the D-91 label grammar) — is loaded
by `deployed/admin_questions.php:1049` as the untokened URL
`<script src="ocr_helper.js"></script>`, the same URL the live page already used
(`archive/live-sources/admin_questions-2026-10-31.php:1043`). A returning admin
browser that cached that URL can keep the pre-cycle helper and silently paste
options under the old grammar.

**Supported preconditions.** A standalone deployment, an admin browser with a
cached copy of the pre-deploy URL, and no cache purge. `docs/DEPLOYMENT.md` step
5 already makes cache purging and hash verification mandatory and states that
the helper is intentionally untokened (D-94's token policy covers the
math-editor pair only; D-102 covers the MS01 shared assets).

**Why this is a note, not a fix.** The package promises no post-violation
protection for the helper and documents both the untokened choice and the
mitigation, so the defect exists only when the stated deployment precondition is
skipped. It stays visible as residual risk.

**Finite closure criteria, if the owner later chooses a fix.**
1. `deployed/admin_questions.php` loads `ocr_helper.js` with a query token that
   differs from the live URL, exactly once, and `INV-141` gains the helper.
2. `tests/math-tool.js` (or an equivalent asset vector) asserts that exact token
   and the exactly-once count, and refuses the untokened URL.
3. `docs/DEPLOYMENT.md` step 5 and the manifest row for `ocr_helper.js` record
   the token; the full baseline and `php -l` pass; live-origin additions stay
   ≤100 (`admin_questions.php` must remain **+89**).

**Required evidence.** Before/after tag lines, test output, refreshed manifest
row. **Non-goals.** No helper behavior change, no new file, no `cbt.php` token
rotation, no live action.

### NOTE-10 — `INTENT.md` does not record the 2026-11-18 amendment

**Issue.** `INTENT.md` is declared the behavior tie-breaker, but its amendment
header still reads "owner-amended 2026-11-15 (D-91) and 2026-11-17 (EL01, D-103,
D-104)", and its formatting/palette intent still ends at "Defer the math-symbol
palette and editor byte counter to ME01" plus the sole-Root rule. D-105 (the
restored Greek, set-theory/logic, and geometry/vector grids) appears in
`docs/DECISIONS.md` D-105, `docs/SPEC.md`, `INV-139`, `EC-152`,
`docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md`, and `AGENTS.md`, but not in the
intent file.

**Closure criteria.** Add the 2026-11-18 (D-105) amendment to the `INTENT.md`
header and one palette bullet stating that the drawer restores only the three
non-shape grids. **Evidence.** The edited lines. **Non-goals.** No product,
test, or other documentation change.

### NOTE-11 — The MS01 package's design sections still describe the pre-D-105 palette

**Issue.** `docs/plan/math-editor/ms-01-visual-math-shapes.md:96` ("One toolbar
row, no "More symbols" drawer") and `:123` ("remove the drawer and its toggle")
state the opposite of the implemented palette, and the coordinator notes that
D-105 has no package row. The 2026-11-18 follow-up section at the end of the same
file does record the change, so a reader who starts at the design section sees a
contradiction.

**Closure criteria.** One "superseded by D-105 (2026-11-18)" pointer at `:96`
and `:123`, and either a D-105 row in the coordinator status table or an explicit
statement that D-105 is reviewed as a direct owner request without a package
row. **Evidence.** The edited lines. **Non-goals.** No product or test change;
no change to the package's historical acceptance records.

### NOTE-12 — D-105 has no browser or accessibility evidence, and the drawer region is unlabelled

**Issue.** D-105 is the only cycle change with no real-browser evidence at all:
its verification is source- and DOM-shim-level (`NOTE` in the package follow-up:
"Not run: browser visual check"). Nothing in this cycle has observed the drawer
render, the mobile 38px targets, or the toggle on a device, and the drawer
container carries no `role`/`aria-label` of its own (the toggle supplies
`aria-controls`/`aria-expanded`).

**Closure criteria.** Owner desktop and Brave/Android check recording: the drawer
opens and closes from `More symbols`, shows only the Greek, set theory and logic,
and geometry and vectors grids, inserts at the remembered caret, keeps ≥38px
targets on the phone viewport, and shows no second square-root control. A
follow-up a11y polish (labelled region) is optional and not required to close.

**Evidence.** The owner's pass/fail report, or a recorded disposable-browser
check with computed layout. **Non-goals.** No live read/write, no deploy, no
schema or save-path change.

## 8. Prior findings and approvals

- Phase 1 `ST01`: settled — `FIX-1` closed by the third re-review, `FIX-2`
  closed. `NOTE-1` (stale handoff list) is historical.
- Phase 2 `ME01`: settled — `FIX-1` and both notes closed by the phase-2
  re-review.
- Phase 3 `ME02`: settled — `PASS WITH ACCEPTED FINDINGS`, owner phone gate
  accepted 2026-11-17.
- Phase 4 `EL01`: settled — `PASS WITH ACCEPTED FINDINGS`, `NOTE-1`–`NOTE-4`
  corrected, MySQL 8.0.41 gate satisfied.
- Phase 5 `MS01`: settled — `FIX-1` closed; `NOTE-1`–`NOTE-6` accepted
  (super-linear scan cost, duplicate panel accessible names, old INV-141
  citation now rewritten, disclosed fixture correction, chat-branch bookkeeping
  now resolved by the remote tip, ASCII `2x2 matrix` label); D-103/D-104 focused
  review `PASS WITH ACCEPTED FINDINGS`, `NOTE-7`/`NOTE-8` corrected, owner
  visual recheck accepted 2026-11-17.
- D-105 was unreviewed before this record; it is now reviewed under section 6C
  and findings `NOTE-9`–`NOTE-12`. No owner disposition is required: no finding
  reaches a second unresolved review round.
- No line-cap exception, deployment approval, live access, or destructive action
  is requested or inferred by this review.

## 9. Verdict

**PASS WITH ACCEPTED FINDINGS.** No `BLOCK`, no `FIX`. The cycle's production
boundary reproduces end to end at `596fb31`: all Node and PHP suites at their
documented counts, every live-origin file inside the 100-addition cap, the
manifest at 13/13, both renderer runtimes byte-identical over 513 independent
inputs, and every changed shared asset carrying a fresh token. D-105 is accepted
as implemented: it restores only the three non-shape grids, cannot reintroduce a
shape-covered character, and cannot be defeated by CSS ordering or the `hidden`
attribute.

- **Commit readiness:** ready. The cycle is committed and pushed at `596fb31`
  (remote `owner-tool-integration` = `HEAD`); nothing is uncommitted. The four
  notes are documentation/evidence items and do not gate the commit.
- **Review status:** complete for the full cycle, including D-105. Phases 1–5
  remain settled; no re-review round is required.
- **Accepted residual risk:** `NOTE-9` (helper token), plus the phase-5 accepted
  notes carried forward.
- **Deferred checks:** the D-105 owner desktop/Brave check (`NOTE-12`), native
  save/PRG, MySQL, HTTP staging, deployment, and every live action.
- **Excluded artifacts, separately:** `archive/live-sources/*`,
  `archive/owner-tool-2026-11/*`, `deployed/sql/base-schema.working.sql`,
  generated `src/bookmarklet.js`, untracked `src/bookmarklet.min.js`,
  `src/parser/core.js`, `tools/phone-staging/*` staging shims, and the static
  PHP 8.3.32 CLI installed under `$HOME` outside the workspace. None supplied
  production-path evidence for this review.

**Recommended next action:** record the owner desktop/Brave confirmation of the
reviewed D-105 drawer (the only missing evidence for the newly reviewed commit);
the coordinator bookkeeping in `NOTE-10`/`NOTE-11` follows in the same handoff
update, and no fix session is authorized by this review.

NEXT COMMAND: Run the owner desktop/Brave check for the reviewed D-105 More symbols drawer, then report pass or fail
