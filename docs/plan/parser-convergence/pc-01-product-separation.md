# PC01 — Product Surface Separation

- **Status:** done — review-settled. The 2026-11-26 re-review 3 of candidate
  `cc72e3b` ([record](../reviews/parser-convergence-2026-11-phase-1-re-review-3.md))
  returned `PASS` with no new findings, closing `BLOCK-5` and `FIX-4`, so every
  `BLOCK-1`–`BLOCK-5` and `FIX-1`–`FIX-4` is closed. The package is merged into
  `scratch/parser-convergence-cycle`, and PC02 is unblocked.
- **Product baseline:** `793cb8f`
- **Package base:** record the docs-only cycle-setup commit on
  `scratch/parser-convergence-cycle` at Gate 1; verify its product tree equals
  `793cb8f`
- **Implementation branch:** short-lived `scratch/pc01-product-separation`
- **Depends on:** parser-convergence cycle setup
- **Blocks:** PC02
- **Review level:** rigorous
- **External gate:** disposable local browser only; no deploy or live write
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Undo the accidental product coupling in the scratch merge without changing any
parser behavior. Root `ocr_helper.js` remains the small manually saved deployed
tool. The key/autosave bookmarklet becomes a first-class, self-contained source
tree. The existing stimulus bookmarklet remains byte-for-byte unchanged.

## Scope

1. Restore the reviewed manual root-helper behavior from the current published
   baseline: one paste box, native form fill, manual PRG save, and only its
   existing queue/meta/submitted state.
2. Move the scratch merge's key, answer-fill, dry-run, and autosave behavior into
   a focused key-bookmarklet entry under `src/bookmarklets/key/` with a dedicated
   build and generated output.
3. Split tests so deployed-helper assertions execute root `ocr_helper.js`, while
   key-bookmarklet assertions execute the real key entry/build.
4. Record exact product/storage ownership. Shared storage names keep their
   existing shapes; each product must refuse or safely reset stale incompatible
   state.

## Non-goals

- No parser regex, split, option, region, stimulus, key grammar, or flag change.
- No P20-P23 work and no stimulus-bookmarklet UI change.
- No PHP, schema, deployment token, generated stimulus bookmarklet, or live-site
  change.
- Do not merge the two bookmarklets.

## Gate 1 measurements

Gate 1 must name every source, test, build, and generated file; record baseline
lines/bytes and expected additions; prove `src/parser/core.js`,
`src/parser/parser.js`, `src/ui/ui.js`, and `src/bookmarklet.js` are outside the
behavioral diff; and identify generated outputs separately. No implementation
starts before those measurements and the exact extraction boundary are approved.

## Acceptance

| Check | Expected |
|---|---|
| Deployed helper | Real root helper has no key load, dry run, autosave, fetch loop, image plan, batch history, or bookmarklet title path |
| Manual workflow | Queue/fill/skip/clear/native-submit behavior and `ocrQueue`/`ocrMeta`/`ocrSubmitted` contracts match the reviewed published baseline |
| Key bookmarklet | Real key entry preserves answer-key fill, Stop behavior, in-flight-save settlement, and the existing key/autosave tests from `793cb8f` |
| Product isolation | Loading either bookmarklet over the deployed page removes/replaces only the intended panel and does not register duplicate listeners |
| Stimulus artifact | `src/bookmarklet.js` and its source modules are byte-identical to package base |
| Parser | `src/parser/core.js` and all parser outputs are byte-identical to package base |
| Build | Key output is one line, syntax-valid, deterministic, and contains no forbidden percent escape |
| Baseline | Full Node/PHP baseline and bank extractor pass; disposable browser smoke covers deployed and key surfaces |
| Safety | No deploy, live save, deletion, schema operation, or real-branch change |

## Handoff

Date: 2026-11-24. Result: **implementation complete; Node, PHP, and disposable
browser evidence green.**
Package base `bb78c57` on `scratch/pc01-product-separation` (created from the
reviewed `scratch/parser-convergence-cycle` tip). No deploy, live write,
schema operation, or real-branch change. `Commit:` the dedicated fix-round commit
on `scratch/pc01-product-separation` (that branch only; no merge).

### Files (measured from package base `bb78c57`)

| File | Diff | Final | Responsibility | Deployment | Production-path test |
|---|---|---|---|---|---|
| `ocr_helper.js` | +16/−316 | 127 L / 4,917 B, sha256 `b83835b7…` | deployed manual helper: one paste box, native fill, manual PRG save, `ocrQueue`/`ocrMeta`/`ocrSubmitted` | loaded by `deployed/admin_questions.php` after `src/parser/core.js` | `node tests/ocr-helper.js` (38 vectors; `require` + real browser `vm` path) |
| `src/bookmarklets/key/entry.js` | new (+398 at review target; fix session +163/−36) | 525 L / 21,600 B, sha256 `62d1945e…` | key load, answer fill, dry run, autosave, Stop settlement, in-place save, run ownership, storage normalization | never a page asset; inlined into the key bookmarklet | `node tests/key-bookmarklet.js` (33 vectors) runs the generated artifact |
| `src/bookmarklets/key/boot.js` | new (moved) | 12 L / 589 B | sets `__ocrBookmarklet`, removes the deployed panel and error banner | key bundle only | same suite |
| `src/bookmarklets/key/build.js` | new (moved) | 44 L / 1,364 B | core + boot + entry → one-line key artifact | repo tool | determinism/syntax test in the same suite |
| `tests/ocr-helper.js` | +40/−328 | 658 L / 30,476 B | deployed-helper and parser assertions only | — | `node tests/ocr-helper.js` |
| `tests/key-bookmarklet.js` | new (+540 at review target; fix session +288/−6) | 822 L / 37,840 B, sha256 `c757ff49…` | key/autosave assertions on the real artifact | — | `node tests/key-bookmarklet.js` (33 vectors) |

`ocr_helper.js` is now byte-identical to the reviewed published baseline
`94a7593:ocr_helper.js` (same sha256), so its live-origin additions are +51
against every archived snapshot (`ocr_helper-2026-11-01.js` +51/−47,
`ocr_helper.js` and `ocr_helper_deployed.js` +51/−45) — under the 100 cap with no
exception.

### Excluded / generated artifacts

- `src/bookmarklets/key/bookmarklet.js` — generated, 1 line / 66,711 B, sha256
  `f65f58ad…`; excluded from line limits and reported here separately.
- `src/bookmarklet.js` — untouched. sha256 `bf5837e4…` equals the package base,
  and re-running `node src/build/build.js` reproduces the same hash.
- `src/parser/core.js` `c9ac52b3…`, `src/parser/parser.js` `0a9bff5f…`,
  `src/ui/ui.js` `1e1f8007…` — byte-identical to the package base.
- `src/bookmarklet.min.js` — absent/untracked, untouched.
- Deleted `experiments/key-bookmarklet/{boot.js,build.js,bookmarklet.js}`
  because their generator inlined the root helper and would silently drop key
  and autosave behavior once the deployed helper was restored.

### Commands and results

- `node tests/runner.js` → 68 PASS / 0 FAIL / 0 PENDING
- `node tests/unit.js` → 173 PASS / 0 FAIL
- `node tests/ocr-helper.js` → 38 vectors PASS
- `node tests/key-bookmarklet.js` → 33 vectors PASS (22 reviewed + 11 fix-session vectors; one base vector changed with owner approval, see the fix note)
- `node tests/underline-toolbar.js` → 10 PASS; `node tests/question-preview.js`
  → 7 PASS; `node tests/math-tool.js` → 26 PASS; `node tests/render-markup.js`
  → 69 PASS
- `node tools/extract-bank.js --check` → 7 output hashes match
- `node src/bookmarklets/key/build.js` → one line, deterministic, `new Function`
  parses, no percent escape
- `node src/build/build.js` → stimulus artifact byte-identical
- `php tests/php-render.php` → 33 vectors PASS
- `php tests/admin-question-store.php` → 8 store checks PASS
- `php tests/cbt-question-order.php` → 14 PASS / 0 FAIL
- `php -l deployed/*.php` → 7/7 pass
- **Not run:** `php tests/cbt-staging.php`. It needs a disposable staging
  database and URL, and no PHP file changed, so the PHP baseline and that suite
  are unaffected by this package.

### Disposable browser smoke (2026-11-24)

Run against the real product files on a disposable local staging server, with a
cloud Chromium driven by Playwright. No deploy, live request, or live write.

- Staging: the repo's own `tools/start-phone-staging.sh` with
  `OCR_PHONE_STAGING_HOST=0.0.0.0 OCR_PHONE_STAGING_PORT=3017` on the static PHP
  8.3.9 CLI, a disposable SQLite database at `$HOME/tmp/ocr-phone-staging.sqlite`,
  the real `deployed/admin_questions.php` (which loads `src/parser/core.js?v=2.5.4`
  then `ocr_helper.js?v=2.4.7`), and a throwaway admin login. Confirmed the
  listener on `0.0.0.0:3017` and served the page through the workspace preview
  hostname.
- Deployed surface (real root `ocr_helper.js`): the panel rendered exactly
  `ocr_input`, `ocr_text`, `ocr_load`, `ocr_status`, `ocr_skip`, `ocr_clear`;
  every key/dry-run/autosave/batch/bookmarklet id (`ans_res`, `ocr_auto`,
  `ocr_title`, `ocr_progress`, `ocr_batch_confirm`, `ocr_saved_box`,
  `ocr_paused`, `ocr_confirm_tick`, `ocr_active_tick`, `ocr_auto_status`,
  `ocr_auto_blocked`, `ocr_auto_dry`) was absent. Loading
  `tests/fixtures/ocr-helper-civic-2026.txt` produced 50 queued items, meta
  `{subject_id:14, exam_category_id:3, exam_year:2021}`, a filled stem and
  option A, and four unticked radios; storage held only `ocrQueue` and
  `ocrMeta`. One native manual submit produced exactly one POST, a `302`, row
  `102` in the disposable database, the flash
  `Question saved successfully (Question ID: 102).`, and on the redirected page
  the helper consumed `ocrSubmitted`, deleted it, and advanced to
  `Question 2 of 50` with unticked radios. Skip advanced to question 3 with the
  next stem; Clear list emptied the queue, hid Skip/Clear, and revealed the
  paste box. No page or console errors.
- Key surface (generated `src/bookmarklets/key/bookmarklet.js` executed over
  that same deployed page): the deployed panel was removed and replaced by
  exactly one `#ocr_input` with `ocr_title` = `Bookmarklet paste` plus
  `ocr_auto`, `ocr_progress_wrap`, `ocr_progress`, and `ocr_progress_label`, no
  `#ocr_error`, and `form.__ocrKeySubmit` installed. Injecting the artifact a
  second time left one panel and one title. Loading
  `tests/fixtures/ocr-helper-civic-2026-key.txt` filled the first stem, set
  option D, ticked key `C`, reported `50 answers`, `Dry run OK: ready to
  autosave 50 questions`, `0 of 50 saved`, and wrote only
  `ansKey`/`ocrMeta`/`ocrQueue` with no POST and no `ocrSubmitted`; Skip ticked
  key `B` for question 2. A two-question paste then ran Start autosave to
  `Autosave complete: 2 of 2 saved.` with exactly two POSTs and rows `103`
  (key A → `correct_option` 0) and `104` (key B → 1), leaving no
  `ocrSaving`/`ocrSubmitted` marker. No page or console errors.
- Cleanup: staging stopped through `tools/stop-phone-staging.sh`, the
  disposable root/database/log/pid removed, and port 3017 confirmed free.

PHP runtime: the environment has no root, so the suites ran on the static-php.dev
PHP 8.3.9 CLI build (NTS, `pdo_sqlite`, `pdo_mysql`, `mbstring`, `json`) installed
at `$HOME/toolchain/php`, which matches the PHP 8.3 application target.

### Acceptance mapping

| Check | Evidence |
|---|---|
| Deployed helper | `ocr_helper.js` is byte-identical to `94a7593`; new test `deployed helper has no key, dry-run, autosave, or bookmarklet path` scans the source and the real rendered panel |
| Manual workflow | `deployed helper keeps the reviewed manual submit marker only`: Load → submit → reload advances the queue, consumes `ocrSubmitted`, ticks nothing |
| Key bookmarklet | 18 ported key/autosave vectors, 4 isolation/artifact vectors, and 11 fix-session vectors (`BLOCK-1`–`BLOCK-4`, `FIX-1`, `FIX-2`) run the generated artifact |
| Product isolation | `installs over the deployed page and removes only its stale panel` and `clicking the bookmarklet twice … does not stack listeners` |
| Stimulus artifact | sha256 equality for `src/bookmarklet.js` and its sources; build reproduces the hash |
| Parser | sha256 equality for `src/parser/core.js`, `src/parser/parser.js` |
| Build | one line, deterministic sha256, `new Function` parses, no percent escape |
| Baseline | Node and PHP green as listed; the disposable browser smoke covers the deployed and key surfaces in a real Chromium (see above) |
| Safety | No deploy, live save, deletion, schema operation, or real-branch change |

### Open questions

- `AGENTS.md` forbids adding `ocrSubmitted` to new modules. `entry.js` inherits
  one deliberate exception from `793cb8f`: it deletes the deployed helper's
  stale `ocrSubmitted` marker before and after an in-place save so the next page
  load cannot advance the queue twice. It never writes that key; the behavior and
  its two ported vectors are preserved rather than changed. Reviewers should
  confirm this is still the intended reading of the rule.
- `deployed/admin_questions.php` still asks for `ocr_helper.js?v=2.4.7`. The
  helper bytes changed back to the published baseline, so the cache token is
  stale by policy; PC01 forbids a deployment-token change, so this is deferred to
  PC06's release work.
- Only the key surface's panel/listener isolation was exercised. The stimulus
  bookmarklet is byte-identical, so its isolation behavior is unchanged rather
  than re-tested.

### Fix session — 2026-11-25 (first review round)

Authority: `docs/plan/reviews/parser-convergence-2026-11-phase-1.md`,
`Recommended next action`. All six findings are in their first review round, so
no contract was broadened. Base `bb78c57`, reviewed target `d98d6ad`, worktree
`freebuff/084ae01cd215d054b0222f43` (docs-only descendants of `d98d6ad`). No
review-record edit, no commit, no push, no deploy, and no live action during the
session; the owner then authorized committing and pushing this branch only.
`Commit:` the dedicated fix-round commit on `scratch/pc01-product-separation`.

#### Owner-approved exception (condition 1)

The reviewed acceptance row "the existing key/autosave tests from `793cb8f`" is
excepted to change in exactly one vector, because that vector asserted the
`BLOCK-1` defect. Recorded here as approved by the owner's `go`:

- Before: `keeps the answer key in ansKey when the queue is replaced without
  one` — installed a helper-shaped queue `{items, i: 1}` over a retained 50-answer
  `ansKey` and asserted `checkedRadios === ['1']` plus `key B` / `50 answers`.
- After: `keeps ansKey but does not apply it to a queue the page helper replaced`
  — same setup, asserts no ticked radio, `stored key (50 answers) not used`, no
  active `key B`, `ansKey` still present, and no POST with Start (alert instead).
- Every other base vector is unchanged, including `restores the paste and the
  current question after a reload` (a genuine key-product queue carrying `how`).

#### `BLOCK-1` stored-shape statement (condition 2)

No storage key is added or renamed, and no field name is new. `ocrQueue` already
carried the optional `how` string on key-product Loads; the deployed helper's
Load writes `{items, i}` and no `how`, so ownership is read as
`typeof queue.how === 'string'`. A key-only paste — existing behavior, already
covered by `attaches a key-only paste to the queue that is already loaded` — now
also stamps the existing `how` field with `key-paste` when the list has no
provenance, so a deliberate confirmation survives a reload. `ansKey` and
`ocrMeta` names and shapes are untouched.

#### `BLOCK-2` single settlement (condition 3)

Run ownership moved from the entry closure to the form (`form.__ocrKeyOwner`:
`gen` plus `inFlight`). Each activation increments `gen`; every continuation and
`autoStep` timer returns early when `owner.gen !== myGen`, so the retired
instance cannot settle, advance, or schedule. The replacement panel takes over
the outstanding `{index, request}` as its `pendingSave`, so Start attaches to the
same promise instead of calling `postSave()` again, and the adopting instance is
the only writer. Proven failing-first by
`reinjecting during an in-flight save posts the question exactly once`
(`calls 2 !== 1` before the fix) and by
`reinjection settles a failed in-flight save exactly once`.

#### Per-finding failing-first evidence (unfixed `entry.js`, rebuilt artifact)

Run before any product edit with a tolerant copy of the suite; the suite itself
is fail-fast.

```text
[FAIL] keeps ansKey but does not apply it to a queue the page helper replaced :: no radio is ticked from the retained key
+ actual: ['1']  expected: []
[FAIL] a key-only paste confirms the retained key for the page helper list :: still inert before the confirming paste
+ actual: ['1']  expected: []
[FAIL] reinjecting during an in-flight save posts the question exactly once :: the replacement panel must not post a second time
2 !== 1
[FAIL] reinjection settles a failed in-flight save exactly once :: no duplicate POST from the replacement panel
2 !== 1
[FAIL] ignores a legacy reload marker written after the page helper started :: the queue index does not advance
1 !== 0
[FAIL] does not reuse a discarded batch request after Stop, Clear, and a new Load :: Batch 2 is posted instead of reusing the discarded request
1 !== 2
[FAIL] an in-place save continues nothing after Clear list :: the cleared queue is not advanced
1 !== 0
[FAIL] an in-place save continues nothing into a replaced list :: the replacement queue is not advanced
1 !== 0
[FAIL] Skip during an in-flight autosave does not advance twice :: the hanging save cannot advance again
2 !== 1
[FAIL] mounts a working panel over malformed storage instead of crashing :: the bookmarklet must not alert on load
+ "Bookmarklet Error: Expected property name or '}' in JSON at position 1 (line 1 column 2)"
[FAIL] normalizes incompatible queue and key shapes :: the bookmarklet must not alert on load
+ "Bookmarklet Error: Cannot read properties of undefined (reading 'undefined')"
[FAIL] ignores unknown ocrMeta fields and fills only the known three :: an unknown meta field is never written
RESULT: 21 passed, 12 failed
```

`FIX-2` is a test-evidence defect, so its reproduction breaks the behavior the
old test claimed to cover: with `throw new Error(message)` removed from
`coreProblem()`'s branch, the reviewed suite still printed
`[PASS] refuses to run without the canonical core and never touches Constant
Text`, while the strengthened vector failed with `missing window.OCRParser: the
entry must throw`. `entry.js` was restored and the artifact rebuilt before any
fix was written.

#### Mapping every frozen criterion to implementation and evidence

| Finding / criterion | Implementation | Evidence |
|---|---|---|
| `BLOCK-1.1` no retained key merely by number | `keyApplies()` gates `keyOf()` and the dry run on `typeof queue.how === 'string'` | real-artifact vector + staging probe |
| `BLOCK-1.2` no tick, no ready dry run, no POST, clear path | status line `stored key (N answers) not used: paste the key for this list and press Load questions`; dry-run problem blocks Start; key-only paste confirms | vector asserts `calls === 0`, empty `checkedRadios`, alert text; staging probe |
| `BLOCK-1.3` genuine key reload unchanged | `how` preserved by `normalizeQueue`; reload vector still passes | `restores the paste and the current question after a reload`; staging re-injection ticks key D |
| `BLOCK-1.4` names/shapes unchanged | no new key or field name; `ocrQueue`/`ansKey`/`ocrMeta` kept | shape assertions in the vectors and probe (`helper queue keeps its documented {items, i} shape`) |
| `BLOCK-1.5` real generated artifact | rebuilt `src/bookmarklets/key/bookmarklet.js`, 1 L / 69,784 B | every vector executes the artifact; probe fetched the built file |
| `BLOCK-2.1` no second POST | `owner.gen` retirement + inherited `pendingSave` reuse | `calls 1` after reinjection and Start; staging probe `posts: 1` |
| `BLOCK-2.2` one settlement | retired continuations return before mutating; only the adopting instance writes | queue `i === 1` once; failure vector keeps `i === 0` and one stop message |
| `BLOCK-2.3` show/block, no stale startable run | inherited request plus ` A save was already in progress; Start autosave attaches to it instead of posting again.` | staging probe `already in progress`, `posts` stays 1 |
| `BLOCK-2.4` idle click unchanged | boot/handler replacement untouched | `clicking the bookmarklet twice … does not stack listeners`, `restarting after a stop …` |
| `BLOCK-2.5` next item once | `autoStep` timer re-armed only by the live instance | `calls === 2` for question 2; probe two-save completion `2 of 2 saved` |
| `BLOCK-3.1` no startup evidence | startup marker read/advance/deletion removed | marker vector; probe leaves index and fields |
| `BLOCK-3.2` index/fields unchanged, no POST | same removal | vector `i === 0`, same stem, `posts === 0`; probe identical |
| `BLOCK-3.3` suite covers the boundary | new `ignores a legacy reload marker written after the page helper started` | failing-first `1 !== 0`, passes after fix |
| `BLOCK-3.4` docs distinguish consumer from cleanup | `docs/AGENTS.md` production-path paragraph and `docs/SPEC.md` §3.4 now name the prohibited startup consumer separately from the before/after in-place-save deletes; no claim about a ported baseline vector | this note and those two edits |
| `BLOCK-3.5` helper PRG unchanged | `ocr_helper.js` byte-identical to `94a7593` | `git diff --exit-code` plus 38 helper vectors |
| `BLOCK-4.1` clear `pendingSave` | `abandonInFlight()` in `ocr_load`, `ocr_clear`, `ocr_skip` | vectors 4(a) |
| `BLOCK-4.2` `saveInPlace` cannot advance a changed queue | captured `run = autoRun` plus `retired()` check before any mutation, `savingInPlace` released in Clear/Load/Skip | both in-place vectors |
| `BLOCK-4.3` Skip invalidates the run | `autoRun++`, `abandonInFlight()`, `auto.running/inFlight` cleared, timer cleared | Skip vector `2 !== 1` before, `1 === 1` after |
| `BLOCK-4.4` Stop→Start reuse intact | `stopAuto` still stores `pendingSave` | `restarting after a stop reuses the unanswered save instead of posting it twice` |
| `BLOCK-4.5` three real-artifact regressions | the three vectors named in the contract | failing-first output above |
| `BLOCK-4.6` rebuild and baselines | one-line artifact, `node --check`, no `%XX`; full suites below | build output and baseline table |
| `FIX-1.1` safe parse/normalize | `store.get` try/catch returning `undefined` for malformed values; `normalizeQueue`; `normalizeKey`; `fillForm` restricted to `FIELDS` and existing elements | three FIX-1 vectors, all failing on the old build |
| `FIX-1.2` rebuilt artifact | deterministic one-line artifact | `artifact is one line, syntax-valid, percent-free, and deterministic` |
| `FIX-1.3` executable incompatible-storage vectors | malformed JSON for each key, `{}`, `[]`, `{"items":null,"i":0}`, `i` of `-1`/`"0"`, item without `flags`, array `ansKey`, unknown `ocrMeta` | the three FIX-1 vectors |
| `FIX-2.1` execute the refusal path | `runKeyEntry()` runs `entry.js` in `vm` for missing core, version `2.3.0`, missing `parsePaste`; asserts thrown `Key bookmarklet disabled`, `console.error`, `#ocr_error` banner | `refuses to run without the canonical core and never touches Constant Text` |

#### Measurements (from package base `bb78c57`)

| File | Package-base | Review target `d98d6ad` | Fix session | Final |
|---|---|---|---|---|
| `src/bookmarklets/key/entry.js` | absent | 398 L / 16,539 B | +163/−36 | 525 L / 21,600 B, sha256 `62d1945e…` |
| `tests/key-bookmarklet.js` | absent | 540 L / 24,672 B | +288/−6 | 822 L / 37,840 B, sha256 `c757ff49…` |
| `src/bookmarklets/key/bookmarklet.js` (generated) | absent | 1 L / 66,711 B | regenerated | 1 L / 69,784 B, sha256 `e62a66e7…` |

Unchanged, verified: `ocr_helper.js` 127 L / 4,917 B `b83835b7…` (byte-identical
to `94a7593:ocr_helper.js`), `boot.js` 589 B `52432cd4…`, `build.js` 1,364 B
`74753557…`, `src/parser/core.js` `c9ac52b3…`, `src/parser/parser.js`
`0a9bff5f…`, `src/ui/ui.js` `1e1f8007…`, `src/bookmarklet.js` `bf5837e4…`
(rebuilt to the same hash), `tests/ocr-helper.js` 658 L / 30,476 B. New
phase-cycle modules have no fixed line cap; `entry.js` stays one cohesive key
product entry inlined only by its own build.

#### Baselines and environment (condition 4)

- Node: 68 runner, 173 unit, 38 helper, **33 key-bookmarklet**, 10
  underline-toolbar, 7 question-preview, 26 math-tool, 69 render-markup, 7 bank
  hashes; `node src/bookmarklets/key/build.js` → 1 line, `new Function` parses,
  no percent escape.
- PHP 8.3.32 (static-php.dev CLI, NTS, `pdo_sqlite`/`pdo_mysql`/`mbstring`,
  installed at `$HOME/tmp/toolchain/php` because this workspace has no root and
  no system PHP): 33 renderer vectors, 8 store checks, 14 ordering checks, 0
  failures, and 7/7 `php -l` on `deployed/*.php`. No PHP file changed.
- Chromium: Playwright `chromium_headless_shell` 141.0.7390.37, with the 41
  Ubuntu 24.04 runtime `.deb` dependencies fetched from the archive and unpacked
  locally (`dpkg-deb -x`) because `sudo` is unavailable (`no new privileges`);
  `LD_LIBRARY_PATH` points at that prefix. `php tests/cbt-staging.php` still not
  run: it needs a disposable MySQL/EL01 URL gate and no PHP file changed.

#### Disposable browser probes (Cloud Chromium, real files)

The repo's own `tools/start-phone-staging.sh` served the real
`deployed/admin_questions.php` plus `src/parser/core.js?v=2.5.4` and
`ocr_helper.js?v=2.4.7` from `0.0.0.0:3018` on the static PHP 8.3.32 CLI, with a
throwaway SQLite database. A Cloud Chromium (141) drove the authorized workspace
preview origin; no live host was contacted. The reviewed and fixed artifacts were
both served from that disposable root, so each boundary was reproduced on the
old artifact and closed on the new one in the same session. 21/21 checks passed:

- `BLOCK-1`: the deployed helper loaded a 2-question manual list (`{items, i}`,
  no `how`); with `ansKey = {1:"D",2:"C"}` the reviewed artifact ticked D and
  reported `key D · 2 answers`, while the fixed artifact ticked nothing, said
  `stored key (2 answers) not used: paste the key for this list and press Load
  questions`, and Start produced 0 POSTs with the dry-run alert. A key-only
  paste then ticked D, wrote `how: "key-paste"`, reported 2 entries, and still
ticked D after a fresh injection.
- `BLOCK-2`: with a delayed `fetch`, the first panel posted question 1 once; a
  second injection left one panel, one `Bookmarklet paste` title and one
  `form.__ocrKeySubmit`, showed `A save was already in progress`, and Start kept
  the count at 1. Resolving the shared request advanced the queue once, question
  2 posted normally once, and the run ended at `Autosave complete: 2 of 2
  saved.`
- `BLOCK-3`: with `ocrSubmitted = true` written after the page helper started,
  the reviewed artifact deleted it and moved to index 1 with no POST; the fixed
  artifact kept index 0, kept the first stem, made 0 POSTs, and left the marker
  as `true` for the deployed helper.
- Cleanup: staging stopped, the disposable root/database/log (including the
  served old artifact) removed, and port 3018 confirmed free. No repository file
  was created by staging.

#### Preserved boundaries

No changes to `ocr_helper.js`, `src/parser/core.js`, `src/parser/parser.js`,
`src/ui/ui.js`, `src/bookmarklet.js`, `deployed/*.php`, fixtures, expected specs,
schema, storage key names, or deployment tokens
(`core.js?v=2.5.4`, `ocr_helper.js?v=2.4.7` stay stale until PC06). The key entry
still never references `constant_text`.

#### Open items

- `BLOCK-1`–`BLOCK-4` require independent re-review of this committed fix round;
  the findings stay open in this record. `FIX-1`/`FIX-2` also await
  re-review confirmation that their evidence is executable.
- `NOTE-1`, `NOTE-2`, `NOTE-4` (the broader storage-ownership lag), `NOTE-5`,
  `NOTE-6`, and `NOTE-7` were not fixed here; `NOTE-4` is only addressed to the
  extent `BLOCK-3` criterion 4 requires the startup-versus-cleanup distinction.

### Review status

Combined original review returned `BLOCK` on `d98d6ad` with `BLOCK-1`–`BLOCK-4`,
`FIX-1`, `FIX-2` open in their first round. The 2026-11-25 fix session above
addresses exactly those contracts. Its candidate `b7b18cd` was then re-reviewed
([record](../reviews/parser-convergence-2026-11-phase-1-re-review.md)): `BLOCK-1`,
`BLOCK-3`, `BLOCK-4`, `FIX-1`, and `FIX-2` closed, `BLOCK-2` stayed open after
two review rounds (`B2-A`–`B2-D`), and first-round `FIX-3` was recorded. The
fix round is committed and pushed to `scratch/pc01-product-separation` only; a
further fix session and its independent re-review are required before any
scratch-cycle merge. Nothing was deployed or merged.

### Finding disposition (2026-11-25) — `BLOCK-2`

- **Finding:** `BLOCK-2` — reinjection during an in-flight key save can POST the
  same question twice ([round-1 record](../reviews/parser-convergence-2026-11-phase-1.md)).
- **Review history:** recorded open by the round-1 combined review on
  `d98d6ad`, and still open after the round-2 closure re-review on `b7b18cd`
  ([record](../reviews/parser-convergence-2026-11-phase-1-re-review.md), probes
  `B2-A`–`B2-D`), which escalates it to owner disposition.
- **Owner choice (explicit, 2026-11-25):** `fix`.
- **Scope and rationale:** one further fix session against exactly the frozen
  closure criteria 1–5 and non-goals recorded in the round-1 review. The choice
  authorizes no broadening: criterion 3's show-or-safely-block requirement and
  the required real-artifact plus disposable-browser evidence are the whole
  scope. No substitute requirement is introduced.
- **Effect:** this disposition does not close `BLOCK-2`. It stays open until the
  fix session's handoff and an independent re-review of that exact candidate
  pass the frozen checklist. PC01 therefore stays `in progress`; commit
  readiness, scratch-cycle merge readiness, and PC02 all stay blocked. The
  first-round `FIX-3` shares the same run-ownership code and is fixed in the same
  session, without being merged into `BLOCK-2`'s contract.
- **Destination:** none. The finding is not deferred to another package.

### `BLOCK-2` / `FIX-3` fix session (2026-11-25)

Scope was exactly `BLOCK-2`'s frozen criteria 1–5 (owner `fix` disposition) and
`FIX-3`'s three criteria (first-round finding), plus the two owner decisions
approved with `go`: D1 blocks Save Question while that question's save is
unresolved, and D2 lets an inherited save settle on the replacement panel
without a Start click. Nothing else changed; no storage key, field, or shape was
added.

#### Implementation (run ownership only)

- The outstanding record stays on `form.__ocrKeyOwner` and is never cleared at
  activation, so a third activation still adopts it (`B2-C`).
- The record is shared, not copied: `{index, request, batch, kind, settled}`.
  `batch` is an in-memory owner counter, incremented by Load, Clear, and Skip,
  so a result from a discarded list can never settle the current one. Nothing
  is stored.
- `claimSave()` settles a record exactly once, and only a live instance may
  claim: retired continuations return first. `settleSave()` then drops any
  record whose batch is gone.
- `saveInPlace` refuses while an unsettled record exists for the current
  batch/index, and `savingInPlace` is now the record rather than a boolean, so
  an abandoned request cannot release a newer save (`FIX-3`).
- Start reuses the record only when both index and batch match; otherwise it
  posts normally (BLOCK-4 behavior retained).

#### Failing-first evidence (unfixed `entry.js`, previous artifact)

```text
[FAIL] reinjection during an in-flight autosave blocks Save Question instead of double-posting :: Save Question must not post a second time
[FAIL] reinjection during an in-flight in-place save blocks a second Save Question :: the replacement panel must not post a second time
[FAIL] a third activation does not lose the in-flight record :: the third panel adopts the outstanding request
[FAIL] reinjection without a Start click settles the inherited save once :: the inherited save is recorded once
[FAIL] an abandoned in-place save does not unlock the replacement batch :: the abandoned result must not unlock another POST
RESULT: 33 passed, 5 failed
```

#### Criterion mapping

| Finding / criterion | Implementation | Evidence |
|---|---|---|
| `BLOCK-2.1` no second POST | shared record retained; Start reuses it; `saveInPlace` blocks while it is unsettled | `B2-A`, `B2-B`, `B2-C` vectors and browser probes, each `1` save POST |
| `BLOCK-2.2` one settlement | `claimSave()` once-only claim by the live instance; batch check before any mutation | success advances `i` to 1 once; existing failure vector keeps `i === 0` |
| `BLOCK-2.3` show or safely block | panel message on injection; D1 block message; D2 settle message | `B2-A`/`B2-B` `/already in progress/`; `B2-D` `/already in progress finished/` |
| `BLOCK-2.4` idle click unchanged | boot and listener replacement untouched | existing `clicking the bookmarklet twice…`, `restarting after a stop…`; 38/38 vectors |
| `BLOCK-2.5` next item once | `autoStep` re-armed only by the live instance after settlement | `B2-C` vector posts question 2 once; two-question browser run |
| `FIX-3.1` guard before release | batch check precedes any `savingInPlace` release; release only by identity | `B4-A` vector `2` POSTs |
| `FIX-3.2` failing-first regression | new vector reproduces `saveInPlace` #1 → Clear → Load → #2 → settle → submit | failed `3 !== 2` before, passes after |
| `FIX-3.3` rebuild and baselines | one-line artifact, `node --check`, no percent escape | build output and suites below |

#### Evidence

- `node tests/key-bookmarklet.js` → `PASS: 38 key-bookmarklet vectors` (33 existing,
  5 new; every vector executes the rebuilt generated artifact).
- Full Node baseline: `runner` 68 PASS / 0 FAIL, `unit` 173, `ocr-helper` 38,
  `underline-toolbar` 10, `question-preview` 7, `math-tool` 26,
  `render-markup` 69, `extract-bank --check` 7 hashes OK.
- PHP 8.3.9 static CLI: renderer 33 PASS, store 8 PASS, ordering 14 PASS / 0 FAIL,
  `php -l` 7/7 on `deployed/*.php`. (`php tests/cbt-staging.php` still needs the
  EL01 MySQL URL gate and no PHP file changed.)
- Disposable staging browser probe (real `deployed/admin_questions.php`,
  `core.js?v=2.5.4`, `ocr_helper.js?v=2.4.7`, real generated artifact,
  Chromium 141, throwaway SQLite): **13/13 checks pass** — `B2-A` blocked Save
  with one POST and one settlement, `B2-D` settled without Start and moved to the
  next question, `B2-C` third activation adopted with one POST, `B2-B` blocked a
  second in-place POST, and an ordinary two-question run posted twice and ended
  at `Autosave complete: 2 of 2 saved.` Staging and its database were removed
  afterwards.
- Environment note for reproduction: PHP `8.3.9` static CLI at
  `$HOME/tmp/toolchain/php`; Playwright 1.56.1 with Chromium `141.0.7390.37`,
  runtime libraries unpacked with `dpkg-deb -x` and a fontconfig file pointing at
  an unpacked `fonts-dejavu-core` (without fonts the admin page renderer
  crashed, which was environment-only and unrelated to this fix).

#### Measurements (from package base `bb78c57`)

| File | Base | Before this session | Final | This session's diff |
|---|---|---|---|---|
| `src/bookmarklets/key/entry.js` | absent | 525 L / 21,600 B `62d1945e…` | 586 L / 24,045 B `a6a51249…` | `+152/−91` |
| `src/bookmarklets/key/bookmarklet.js` (generated) | absent | 1 L / 69,784 B `e62a66e7…` | 1 L / 71,179 B `fc96fdb8…` | regenerated |
| `tests/key-bookmarklet.js` | absent | 822 L / 37,840 B `c757ff49…` | 941 L / 43,370 B `8edcdc66…` | `+119/−0` |

Unchanged: `ocr_helper.js` 127 L / 4,917 B `b83835b7…` (byte-identical to
`94a7593:ocr_helper.js`), `boot.js`, `build.js`, `src/parser/core.js`,
`src/parser/parser.js`, `src/ui/ui.js`, `src/bookmarklet.js`, `deployed/*.php`,
`fixtures/`. Live-origin additions remain `+51/−47` of the 100 cap; no exception
is needed.

#### Status after this session

`BLOCK-2` is not closed by the fix: it needs an independent re-review of this
candidate against the frozen criteria. `FIX-3` likewise closes only through
re-review. PC01 stays `in progress`; commit readiness, scratch-cycle merge, and
PC02 stay blocked until the re-review settles. This fix round was committed and
pushed to `scratch/pc01-product-separation` on the owner's explicit request in
the same session; no merge, deployment, or live action was performed.

### Fix session — 2026-11-26 (`BLOCK-5`, `FIX-4`)

Authority: [`reviews/parser-convergence-2026-11-phase-1-re-review-2.md`](../reviews/parser-convergence-2026-11-phase-1-re-review-2.md),
`Recommended Next Action`. Both findings were recorded for the first time by
that re-review, so neither needed an owner disposition and no frozen closure
contract was broadened. Worktree branch `freebuff/pc01-fix-block5-fix4` at
`2696c42` (the pushed review-record child of reviewed candidate `6e28e82`; its
product tree is identical to `6e28e82`). No review-record edit, commit, push,
merge, deployment, or live action in this session. `Commit:` deferred.

#### Finding resolution

- `BLOCK-5` criterion 1: `autoStep()` now reuses an outstanding
  `owner.inFlight` record for the active `batch`/`index` in addition to
  `pendingSave`, so Start attaches to an in-place save without posting. An
  adopted `kind: 'inplace'` record now settles through `settleAuto()` — clearing
  `auto.inFlight`/`auto.request`, advancing the queue once, then arming the next
  question on success or calling `stopAuto()` on failure — instead of wedging the
  run. Only that same identity releases the manual `savingInPlace` lock and the
  page-helper marker.
- `BLOCK-5` criterion 2: `stopAuto()` keeps a `pendingSave` only when the record
  is genuinely unsettled and still `owner.inFlight`; a settled or abandoned
  request is never turned into a new unsettled save, so Stop/Start cannot reuse
  question 1's finished answer for question 2.
- `FIX-4`: the same `owner.inFlight` reuse makes same-panel `Save Question` →
  `Start autosave` attach with `calls === 1`. No new message, field, control,
  storage key, or storage shape is added.

#### Failing-first evidence (unfixed artifact `fc96fdb8…`, rebuilt from `a6a51249…`)

The four new real-artifact vectors were run first against the unfixed entry; the
suite was executed through a temporary tolerant copy that reports every vector
(it was removed afterwards; 38 previously passing vectors stayed green).

```text
[FAIL] reinjecting during an in-place save and starting autosave completes the batch :: question 2 posts once after the adopted save settles
1 !== 2

[FAIL] Stop after an adopted save does not skip question 2 :: question 2 posts exactly once after the restart
1 !== 2

[FAIL] an in-place save adopted by autosave stops cleanly when it fails :: The expression evaluated to a falsy value:

  assert(/Autosave stopped at question 1: Duplicate question/.test(second.field('ocr_status').innerHTML))

[FAIL] starting autosave during an in-place save does not post the question twice :: Start attaches to the in-place save instead of posting again
2 !== 1

RESULT: 38 passed, 4 failed
```

After the fix the same suite reports `PASS: 42 key-bookmarklet vectors`.

#### Frozen-criterion mapping

| Finding / criterion | Implementation | Evidence |
|---|---|---|
| `BLOCK-5.1` adopted request settles as autosave | `settleSave()` dispatches an `inplace` entry owned by the live `auto.request` to `settleAuto()` after releasing the matching `savingInPlace` lock and marker | `reinjecting during an in-place save and starting autosave completes the batch` (`calls === 2`, `i === 2`, `Autosave complete: 2 of 2 saved.`) plus staging probe |
| `BLOCK-5.2` no unsettled save from a settled/abandoned request | `stopAuto()` reuses only an unsettled `owner.inFlight` for the same request | `Stop after an adopted save does not skip question 2` (`calls === 2` only after the restart posts) plus the failure vector |
| `BLOCK-5.3` failing-first success and failure variants | the two vectors named above, executing the real generated artifact | failing-first output above; 42/42 after the fix |
| `BLOCK-5.4` rebuild, staging probe, baselines | `node src/bookmarklets/key/build.js`; real page probe; full Node/PHP baseline | artifact `8d8c1a33…`; staging `posts === 2` and two saved rows; baselines below |
| `FIX-4.1` one POST when Start follows an in-flight in-place save | `autoStep()` reuses `owner.inFlight` for the active batch/index | `starting autosave during an in-place save does not post the question twice` (`calls === 1`, then `2` only for question 2) plus staging probe |
| `FIX-4.2` failing-first real-artifact vector | the vector named above | failing-first output above |
| `FIX-4.3` rebuild and baselines | key build plus full baseline | rebuild and baseline table below |

#### Measurements (from package base `bb78c57`)

| File | Base | Review candidate `6e28e82` | Final | This session's diff |
|---|---|---|---|---|
| `src/bookmarklets/key/entry.js` | absent | 586 L / 24,045 B `a6a51249…` | 596 L / 24,700 B `14c33a5d…` | `+19/−9` (cumulative `+596/−0` from base) |
| `tests/key-bookmarklet.js` | absent | 941 L / 43,370 B `8edcdc66…` | 1,062 L / 48,885 B `8f161f5e…` | `+121/−0` (cumulative `+1,062/−0`) |
| `src/bookmarklets/key/bookmarklet.js` (generated) | absent | 1 L / 71,179 B `fc96fdb8…` | 1 L / 71,421 B `8d8c1a33…` | `+1/−1`, regenerated |

Unchanged and re-verified: `ocr_helper.js` 127 L / 4,917 B `b83835b7…`
(byte-identical to `94a7593:ocr_helper.js`; live-origin additions stay
`+51/−47` of the 100 cap, no exception needed), `boot.js` 12 L / 589 B,
`build.js` 44 L / 1,364 B, `src/parser/core.js`, `src/parser/parser.js`,
`src/ui/ui.js`, `src/bookmarklet.js`, `deployed/*.php`, and `fixtures/`. New
phase-cycle modules have no fixed line cap; `entry.js` remains one cohesive key
product entry inlined only by its own build.

#### Baselines and environment

- Node v24.22.1: `runner` 68 PASS / 0 FAIL / 0 PENDING; `unit` 173 PASS;
  `ocr-helper` 38 PASS; `key-bookmarklet` 42 PASS; `underline-toolbar` 10 PASS;
  `question-preview` 7 PASS; `math-tool` 26 PASS; `render-markup` 69 PASS;
  `extract-bank --check` OK, 7 output hashes match.
- PHP 8.3.32 static CLI provisioned in this session at
  `$HOME/tmp/toolchain/php` (`pdo_sqlite`, `pdo_mysql`, `mbstring`, `json`):
  renderer 33 PASS, store 8 PASS, ordering 14 PASS / 0 FAIL, `php -l` 7/7 on
  `deployed/*.php`. `php tests/cbt-staging.php` was not run: it needs the EL01
  MySQL URL gate and no PHP file changed.
- Build: `node src/bookmarklets/key/build.js` wrote one line
  (`71,421` B reported, `71,422` B on disk with the trailing newline), `new
  Function` parses it, no `%XX`, and the suite's determinism vector reproduces
  the same hash.

#### Disposable browser staging probe

The repo's own `tools/start-phone-staging.sh` served the real
`deployed/admin_questions.php` (loading `src/parser/core.js?v=2.5.4` then
`ocr_helper.js?v=2.4.7`) and the real generated
`src/bookmarklets/key/bookmarklet.js` from `0.0.0.0:3020` on the static PHP
8.3.32 CLI with a throwaway SQLite database. A Cloud Chromium (build mode)
drove the authenticated workspace preview origin; no live host was contacted.
Both POSTs were temporarily held in the page so the in-flight states could be
driven exactly, then released to the real server.

- `BLOCK-5`: in-place `Save Question` queued one POST; reinjecting showed
  `A save was already in progress; Start autosave attaches to it instead of
  posting again.`; `Start autosave` kept the count at one POST; question 1 then
  settled once (`i = 1`, still `Stop autosave`, progress
  `1 of 2 saved · saving question 2...`), question 2 posted once, and the run
  ended `Autosave complete: 2 of 2 saved.` (`i = 2`, button `Start autosave`).
  The disposable database gained exactly two rows for that run (`103` key A →
  `correct_option 0`, `104` key B → `1`).
- `FIX-4`: same-panel `Save Question` queued one POST and `Start autosave` sent
  no second POST; question 1 settled once and question 2 posted once, ending at
  `Autosave complete: 2 of 2 saved.`. The disposable database gained exactly two
  rows for that run (`105` key A, `106` key B); it did not gain a duplicate row
  for question 1.
- Cleanup: the staging server was stopped by its recorded PID, port 3020 was
  confirmed free, and the throwaway root, database, and log were removed.

#### Status after this session

The 2026-11-26 re-review 3 of candidate `cc72e3b`
([record](../reviews/parser-convergence-2026-11-phase-1-re-review-3.md)) returned
`PASS` and closed `BLOCK-5` and `FIX-4` with no new findings, so PC01 is
review-settled: every `BLOCK-1`–`BLOCK-5` and `FIX-1`–`FIX-4` is closed. The
package was fast-forward merged into `scratch/parser-convergence-cycle` from
`bb78c57` to the docs tip `e6f34f8`, whose product tree is byte-identical to the
reviewed candidate `cc72e3b`, and PC02 is unblocked. `Commit:` `cc72e3b`
(reviewed product candidate; package docs tip `e6f34f8`).
