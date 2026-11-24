# PC01 — Product Surface Separation

- **Status:** in progress — implementation and every acceptance check complete
  (Node, PHP, disposable browser smoke); independent rigorous review pending
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
schema operation, or real-branch change. `Commit: deferred`.

### Files (measured from package base `bb78c57`)

| File | Diff | Final | Responsibility | Deployment | Production-path test |
|---|---|---|---|---|---|
| `ocr_helper.js` | +16/−316 | 127 L / 4,917 B, sha256 `b83835b7…` | deployed manual helper: one paste box, native fill, manual PRG save, `ocrQueue`/`ocrMeta`/`ocrSubmitted` | loaded by `deployed/admin_questions.php` after `src/parser/core.js` | `node tests/ocr-helper.js` (38 vectors; `require` + real browser `vm` path) |
| `src/bookmarklets/key/entry.js` | new | 398 L / 16,539 B | key load, answer fill, dry run, autosave, Stop settlement, in-place save, duplicate-listener guard | never a page asset; inlined into the key bookmarklet | `node tests/key-bookmarklet.js` runs the generated artifact |
| `src/bookmarklets/key/boot.js` | new (moved) | 12 L / 589 B | sets `__ocrBookmarklet`, removes the deployed panel and error banner | key bundle only | same suite |
| `src/bookmarklets/key/build.js` | new (moved) | 44 L / 1,364 B | core + boot + entry → one-line key artifact | repo tool | determinism/syntax test in the same suite |
| `tests/ocr-helper.js` | +40/−328 | 658 L / 30,476 B | deployed-helper and parser assertions only | — | `node tests/ocr-helper.js` |
| `tests/key-bookmarklet.js` | new | 540 L / 24,672 B | key/autosave assertions on the real artifact | — | `node tests/key-bookmarklet.js` |

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
- `node tests/key-bookmarklet.js` → 22 vectors PASS
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
| Key bookmarklet | 18 ported key/autosave vectors plus 4 isolation/artifact vectors run the generated artifact |
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

### Review status

Independent rigorous review pending. Review target: the pushed
`scratch/pc01-product-separation` tip. No review record exists yet.
