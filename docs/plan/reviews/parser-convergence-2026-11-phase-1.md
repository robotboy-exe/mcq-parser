# Parser Convergence 2026-11 Phase 1 Review — Combined Record

- **Date:** 2026-11-25
- **Record type:** owner-assembled combined original review. This is the single
  authoritative phase 1 review record; the fix session reads only this file.
- **Cycle / phase:** `parser-convergence-2026-11`, phase 1
- **Package:** PC01, Product Surface Separation
  ([`pc-01-product-separation.md`](../parser-convergence/pc-01-product-separation.md))
- **Mode:** original review (review round 1 for every finding)
- **Candidate:** pushed `origin/scratch/pc01-product-separation` at exact commit
  `d98d6ad9282a6f89527f6952e38b5bc8988e8335`
- **Package base:** `bb78c57f8106e7375883e5b9bf1ef35bc80f18b8`
- **Product baseline:** `793cb8ffa754740749b05271e8fa4af717fa661a`
- **Published baseline:** `94a759338211476b2a3aa738b7a1159ff56be73e`

## Provenance

Three independent original reviews of the same candidate commit were run and
merged into this one record. It is self-contained: every closure contract and
the supporting evidence are included here, and no other review file is needed.
The table below records which reviewer found what, for reviewer-quality
tracking only.

| Review | Reviewer | Its verdict |
|---|---|---|
| A | GPT-5.6 Sol (via OpenCode), with Chromium | `BLOCK` |
| B | Gemini 4 Hydrogen, Node `vm` first, Chromium added later in the same session (findings unchanged) | `PASS WITH ACCEPTED FINDINGS` |
| C | Gemini 4 Hydrogen, fresh session, revised review prompt, with Chromium | `BLOCK` |

### Who found what

| Finding | A (GPT) | B (Gemini run 1) | C (Gemini run 2) |
|---|---|---|---|
| `BLOCK-1` stale answer key trusted for a different manual queue | BLOCK | — | — |
| `BLOCK-2` reinjection during in-flight save double-POSTs | BLOCK | — | — |
| `BLOCK-3` startup consumes `ocrSubmitted` and skips an unsaved item | BLOCK | FIX | NOTE (part) |
| `BLOCK-4` stale in-flight save state settles across Clear/Load/Skip | — | — | BLOCK |
| `FIX-1` malformed/incompatible storage crashes key startup | — | FIX | FIX |
| `FIX-2` core-refusal test is static, not executed | — | FIX | — |
| `NOTE-1` stale core version in developer contract | NOTE | — | — |
| `NOTE-2` Clear / failed native submit not durable helper vectors | NOTE | — | — |
| `NOTE-3` stale `ocr_helper.js?v=2.4.7` cache token | — | NOTE | NOTE |
| `NOTE-4` storage-ownership docs lag `ocrPaste` / SPEC §3.4 | — | — | NOTE (part) |
| `NOTE-5` preview and byte counter not refreshed by key Load/Skip | — | — | NOTE |
| `NOTE-6` cross-bookmarklet and repeat-click listener stacking in frozen `ui.js` | — | NOTE | NOTE |
| `NOTE-7` review environment | — | NOTE | NOTE |

Cells show the severity each review gave the defect. Where reviews disagreed on
one defect's severity, the highest reproduced severity on a supported path was
adopted, together with that review's closure contract.

## Verdict

**BLOCK.** PC01 is not commit-ready or merge-ready. `BLOCK-1`–`BLOCK-4`,
`FIX-1`, and `FIX-2` are open in their first review round. The ordinary
deployed-helper workflow, clean key-bookmarklet workflow, builds, baselines,
line limits, parser boundary, and stimulus boundary pass in all three reviews.
PC02 remains blocked.

## Combined acceptance coverage

| PC01 acceptance | Result | Findings |
|---|---|---|
| Deployed helper | PASS | — |
| Manual workflow | PASS | `NOTE-2` |
| Key bookmarklet (answer-key fill, Stop, in-flight-save settlement) | **FAIL** | `BLOCK-2`, `BLOCK-4` |
| Product / storage isolation, stale incompatible state | **FAIL** | `BLOCK-1`, `BLOCK-3`, `FIX-1` |
| Key test evidence executes real paths | **PARTIAL** | `FIX-2` |
| Stimulus artifact | PASS | `NOTE-6` |
| Parser | PASS | — |
| Key build | PASS | — |
| Full baseline and bank extractor | PASS | — |
| Disposable browser smoke | **FAIL at adversarial boundaries** | `BLOCK-1`–`BLOCK-4`, `FIX-1` |
| Safety | PASS | — |

## Open owner question — resolve in fix Gate 1 before `go`

Two reviews contradict each other on one checkable fact:

- Review A (GPT), in `BLOCK-3`: "The old baseline submit-reload test was not ported to the key
  suite, so the handoff's claim that all key/autosave vectors were ported is not
  exact."
- Review C (Gemini run 2): "All 54 test cases from `793cb8f:tests/ocr-helper.js` were
  cross-checked against `tests/ocr-helper.js` (38) and `tests/key-bookmarklet.js`
  (22); none were dropped or weakened."

`BLOCK-3` closure criterion 4 depends on GPT's version being correct. **Fix
Gate 1 must perform this read-only check:** list every test case in
`793cb8f:tests/ocr-helper.js`, map each to its successor in `tests/ocr-helper.js`
or `tests/key-bookmarklet.js`, and report any with no successor, especially the
submit-reload vector. If GPT's premise is wrong, Gate 1 stops and asks the owner
how criterion 4 applies; it does not reinterpret the criterion itself. No other
part of `BLOCK-3` depends on this question.

## Findings

Each closure contract is the finding reviewer's own wording, unchanged.

> **Found by:** `BLOCK-1` and `BLOCK-2` review A only. `BLOCK-3` reviews A, B and C (B graded it `FIX`, C graded it `NOTE`); review A's `BLOCK` severity and closure contract are adopted.

### BLOCK-1 - A retained prior answer key is trusted for a different manual queue

**Defect.** The deployed helper correctly replaces only `ocrQueue` on Load
(`ocr_helper.js:104-110`) and, by product contract, never owns `ansKey`. The key
entry then independently trusts any stored queue and any object-valued `ansKey`
(`src/bookmarklets/key/entry.js:81-91`), maps answers only by printed number
(`:104-127`), ticks them (`:286-293`), and permits Start (`:357-368`). There is
no queue/key provenance check. A complete old key can therefore appear valid for
a new manual-helper queue with the same question numbers and can be autosaved as
wrong `correct_option` values.

The generated-artifact harness and real disposable page both reproduced the
defect. On the real page, an old `{1:"D",2:"C"}` key was retained while the
manual helper loaded visibly different questions. Key injection ticked D,
reported two usable answers, passed dry run, and attempted a POST.

**Supported operating preconditions.** The user has an `ansKey` from an earlier
key-bookmarklet batch, uses the deployed helper on the same origin to load a
different queue whose numbers are covered by that key, fills valid metadata,
then injects the key bookmarklet and presses Start. No documented mandatory
reset or invalid action is required.

**Finite closure criteria.**

1. A key-bookmarklet injection over a queue newly owned by the deployed manual
   helper must not apply a retained key merely because its numbers match.
2. The stale key must not tick a radio, make dry run ready, or permit a POST. The
   UI must give the user a clear path to load/confirm a matching key or full
   keyed paste.
3. A genuine key-product reload of the same queue must continue to restore its
   matching `ansKey`, current index, and answer ticks; the existing same-queue
   reload/in-place-save behavior must not be weakened.
4. Existing `ocrQueue`, `ocrMeta`, and `ansKey` names and compatible shapes must
   remain unchanged.
5. The real generated artifact must carry the behavior; a copied helper or
   source-only assertion is insufficient.

**Required closure evidence.** Add a failing-first real-artifact vector that
loads one batch/key, replaces the queue through the deployed-helper-compatible
shape with different question content and the same numbers, then proves no tick
and no POST. Keep the same-queue reload regression. Repeat the exact manual Load
to key injection boundary on disposable browser staging, and rerun all PC01
acceptance and the full baseline.

**Non-goals / deferred checks.** Do not add key behavior to root
`ocr_helper.js`, rename storage keys, change parser behavior, redesign autosave,
or modify the stimulus bookmarklet, PHP contract, schema, or deployment tokens.
This finding is limited to stale key/queue compatibility at the PC01 product
handover.

### BLOCK-2 - Reinjection during an in-flight save can POST the same question twice

**Defect.** Boot removes only the old panel (`src/bookmarklets/key/boot.js:7-11`).
Each entry instance owns closure-local `auto`, `pendingSave`, and `autoRun` state
(`src/bookmarklets/key/entry.js:92-99`). The second injection replaces the form
submit listener (`:384-390`) but does not invalidate or adopt the old autosave
loop or request. The replacement panel therefore presents Start while the old
POST is still unresolved. Starting it sends another POST for the same shared
queue index.

The real-artifact harness observed two calls. Disposable Chromium delayed the
first POST, reinjected the real artifact, confirmed one panel/title and one
`form.__ocrKeySubmit`, pressed Start on the replacement panel, and observed two
simultaneous POSTs for question 1. The current test at
`tests/key-bookmarklet.js:218-225` checks only idle reinjection, so its one-listener
assertion passes while this duplicate-save path remains open.

**Supported operating preconditions.** A valid keyed batch is autosaving, its
current POST is in flight, and the user activates the same bookmarklet again and
presses Start on the replacement panel. Second activation is explicitly
supported by PC01; no DOM manipulation or mandatory-precondition violation is
needed.

**Finite closure criteria.**

1. Reinjecting while a key save is in flight must not allow a second POST for
   the same batch/index/question.
2. The already-started request must settle exactly once. A confirmed success
   advances and persists the queue once; a failure leaves the item queued once.
3. The replacement UI must show or safely block on the outstanding result rather
   than presenting an independently startable run with stale closure state.
4. Idle second-click behavior must still leave one panel, one title, and one
   submit listener, and normal Stop/restart settlement must remain intact.
5. After the first item settles, the next item may be posted normally exactly
   once.

**Required closure evidence.** Add a failing-first test against the real
generated artifact with one shared form, DOM, storage map, and delayed request;
reinject and prove one POST and one queue transition for both success and
failure settlement. Add a disposable-browser delayed-POST reinjection probe and
rerun the 22 existing vectors, ordinary two-save browser run, and full baseline.

**Non-goals / deferred checks.** Do not abort a request that may already have
committed merely to satisfy the test, redesign the save protocol, change parser
or PHP behavior, or merge the key and stimulus products. This finding covers
run ownership across reinjection only.

### BLOCK-3 - The dedicated key entry consumes `ocrSubmitted` at startup and skips an unsaved item

**Defect.** The extracted entry still carries the old page-helper reload block:
on startup it reads and deletes `ocrSubmitted`, then increments and persists the
queue when no `.admin-error` exists
(`src/bookmarklets/key/entry.js:392-396`). This is independent of the narrowly
documented deletion immediately before and after the key entry's own in-place
save (`:262-271`). It makes a foreign/stale legacy marker count as proof that the
key product saved its current item.

Disposable Chromium set the marker after page initialization with a loaded key
queue at index 0, then reinjected the real artifact. With no POST or success
response, the marker disappeared, the queue moved to index 1, and the form
changed from question 1 to question 2. This also conflicts with the new-module
guard at `AGENTS.md:47`; the more specific package text at
`docs/AGENTS.md:82-85` describes only before/after in-place-save cleanup, not a
startup advance. The old baseline submit-reload test was not ported to the key
suite, so the handoff's claim that all key/autosave vectors were ported is not
exact.

**Supported operating preconditions.** The page and deployed helper have
already initialized, a stale or concurrently written legacy
`ocrSubmitted` value exists in same-origin storage, the key queue points at an
unsaved item, and the user injects or reinjects the key bookmarklet. Shared
same-origin storage and second activation are normal product conditions.

**Finite closure criteria.**

1. Key-bookmarklet startup must not treat `ocrSubmitted` as save evidence and
   must not advance, rewrite, or refill the queue because that marker exists.
2. With the marker present at injection, the queue index and current fields must
   remain on the same unsaved item and no POST may occur.
3. The dedicated real-artifact suite must directly cover this startup boundary.
4. Current-facing storage documentation and the PC01 handoff must distinguish
   this prohibited startup consumer from the already documented before/after
   in-place-save cleanup, without claiming that an untested baseline vector was
   ported.
5. The deployed helper's own native-submit write and next-page PRG consumption
   must remain unchanged.

**Required closure evidence.** Add a failing-first real-artifact vector that
sets `ocrSubmitted` after page-helper initialization, injects the key artifact,
and proves unchanged queue/index/form plus no request. Repeat it on disposable
browser staging and retain the deployed-helper PRG regression. Rerun every PC01
acceptance command and the full baseline.

**Non-goals / deferred checks.** This finding does not reopen the separate
before/after in-place-save cleanup policy, rename the legacy key, change root
helper PRG behavior, or require parser, PHP, schema, stimulus, or deployment
changes. It closes only the reproduced key-entry startup consumer and its exact
documentation/test claim.

> **Found by:** review C only. Its reproduction is probes A and B in the review C evidence section below.

### BLOCK-4 — Stale in-flight save state (`pendingSave`, `savingInPlace`, and `ocr_skip`) settles across queue clear/load/skip in `src/bookmarklets/key/entry.js`

- **Exact defect:**
  1. `stopAuto()` (`src/bookmarklets/key/entry.js:159`) stores `pendingSave = { index: queue.i, request: auto.request }` when stopped mid-POST. Neither `ocr_clear` (`entry.js:370-382`), `ocr_load` (`entry.js:314-355`), nor `ocr_skip` (`entry.js:356`) clears `pendingSave`. If the user stops a hanging autosave, clears or replaces the queue (`Clear list` -> `Load questions`), and clicks `Start autosave` at `queue.i === 0`, `autoStep()` (`entry.js:194`) sees `pendingSave.index === queue.i` and reuses the discarded batch's request instead of calling `postSave()`. The new batch's question is never sent to the server, yet when the discarded request settles as saved, the UI marks the new batch's question saved (`queue.i++`) and reports `Autosave complete: 1 of 1 saved.` (reproduced live on `src/bookmarklets/key/bookmarklet.js`).
  2. `saveInPlace()` (`entry.js:239-284`) attaches `postSave().then(...)` (`entry.js:269-278`) without checking whether the queue or batch changed while `savingInPlace` was true. Clicking `Clear list` or `Load questions` before the POST resolves causes the continuation to execute `queue.i++; save(); show();`, mutating an empty or newly loaded queue (observed `{ items: [], i: 1 }`) and overwriting `#ocr_status` with `"Saved question 1 of 1 using its answer key."`.
  3. `$('ocr_skip').onclick` (`entry.js:356`) increments `queue.i++` without stopping an active autosave run (`auto && auto.running`) or invalidating an in-flight autosave request, so a hanging POST resolving after `Skip` increments `queue.i++` a second time and silently skips the next question.
- **Supported operating preconditions:** Authenticated Add Question page (`deployed/admin_questions.php`) with `src/bookmarklets/key/bookmarklet.js` loaded and a valid queue in `ocrQueue`.
- **Closure criteria (finite):**
  1. `ocr_clear`, `ocr_load` (when loading a new question list), and `ocr_skip` clear `pendingSave = null`.
  2. `saveInPlace()` does not advance `queue.i`, overwrite `ocrQueue`, or overwrite `#ocr_status` for a queue that was cleared, replaced, or skipped while its `postSave()` was in flight (or those queue-mutating buttons refuse/defer cleanly while `savingInPlace` is active).
  3. `ocr_skip` stops an active autosave run / invalidates any in-flight autosave continuation before advancing `queue.i` so a hanging save cannot double-advance after a skip.
  4. Same-question `Stop` -> `Start autosave` reuse (`tests/key-bookmarklet.js:496-521`) continues to pass without posting twice.
  5. Failing-first regressions added to `tests/key-bookmarklet.js` run the rebuilt `src/bookmarklets/key/bookmarklet.js` artifact and prove (a) `Stop` while hanging -> `Clear list` -> `Load` Batch 2 -> `Start autosave` posts Batch 2's question, (b) `saveInPlace` while hanging -> `Clear list` / `Load` Batch 2 does not advance the cleared/new queue or overwrite status, and (c) `Skip` during an in-flight autosave does not double-advance `queue.i`.
  6. Rebuild `src/bookmarklets/key/bookmarklet.js` with `node src/bookmarklets/key/build.js` (`wc -l` = 1, `node --check` passes, no `%XX`) and re-run the full Node and PHP baselines.
- **Required evidence:** Failing-first before/after test output on the rebuilt `src/bookmarklets/key/bookmarklet.js`, full Node/PHP suite outputs, `wc -l`/`node --check` output, and updated per-file line/byte/sha256 measurements.
- **Non-goals / deferred:** No changes to `ocr_helper.js`, `src/parser/core.js`, `src/ui/ui.js`, `src/bookmarklet.js`, or `deployed/*.php`.

> **Found by:** reviews B and C. Review B's closure contract is adopted because it covers every vector review C names (`{}`, invalid JSON, invalid `queue.i`) plus array `ansKey` and unknown `ocrMeta` fields.

### `FIX-1` — Key bookmarklet crashes after removing the deployed panel on stale/incompatible `ocrQueue`, `ansKey`, or `ocrMeta` storage

- **Exact defect:** `pc-01-product-separation.md` Scope item 4 requires each product to refuse or safely reset stale incompatible state. In `src/bookmarklets/key/entry.js`:
  - `store.get` (`entry.js` L47) calls `JSON.parse(localStorage.getItem(k) || 'null')` without `try/catch`.
  - `entry.js` L81 (`let queue = store.get('ocrQueue') || { items: [], i: 0 };`) does not validate that `queue` is a plain object with `Array.isArray(queue.items)` and a non-negative integer `queue.i` (nor that rendered items have `flags` at L305).
  - `entry.js` L89–90 (`if (!key || typeof key !== 'object') key = {};`) treats arrays (`["A"]`) as valid `ansKey` objects.
  - `fillForm` (`entry.js` L287) assigns `$(id).value = v` for every entry in `ocrMeta` without restricting to `FIELDS` / non-null elements.
  Because `src/bookmarklets/key/boot.js` (L7–9) removes the deployed `#ocr_input` panel before `entry.js` runs, any malformed JSON or incompatible `ocrQueue`/`ansKey`/`ocrMeta` shape causes `entry.js` to throw into the outer `alert('Bookmarklet Error: ...')` wrapper (reproduced in Node `vm` and live Chromium with `ocrQueue = '{}'`), leaving the broken storage key intact and either removing the panel completely or leaving an unwired panel without click handlers. No test in `tests/key-bookmarklet.js` exercises these incompatible-state paths.
- **Supported operating preconditions:** Running `src/bookmarklets/key/bookmarklet.js` on the `admin_questions.php` Add Question form when `localStorage` contains stale, corrupted, or non-matching `ocrQueue`, `ansKey`, or `ocrMeta` values from prior tools/sessions.
- **Finite closure criteria:**
  1. `src/bookmarklets/key/entry.js` safely parses `localStorage` reads (catching malformed JSON) and normalizes/resets incompatible `ocrQueue` (missing/non-array `items`, non-object `queue`, invalid `i`), incompatible `ansKey` (non-plain-object or array), and incompatible `ocrMeta` (non-object or unknown field IDs outside `FIELDS`) without throwing or leaving the page without a working panel.
  2. `src/bookmarklets/key/bookmarklet.js` is rebuilt with `node src/bookmarklets/key/build.js` and passes all build checks (`1` line, deterministic, syntax-valid, no `%HH`).
  3. `tests/key-bookmarklet.js` adds executable vectors running the real generated `src/bookmarklets/key/bookmarklet.js` against malformed JSON `ocrQueue`/`ansKey`/`ocrMeta`, non-shape `ocrQueue` (`{}`, `[]`, `{"items":null,"i":0}`), array `ansKey`, and unknown `ocrMeta` key, verifying clean panel render, working handlers, and safe reset/normalization.
- **Required evidence:** Updated `tests/key-bookmarklet.js` run (`PASS`), rebuilt `src/bookmarklets/key/bookmarklet.js`, and full Node/PHP baseline output.
- **Explicit non-goals / deferred checks:** `ocr_helper.js` MUST remain byte-identical to `94a7593:ocr_helper.js` per Scope item 1 and Acceptance row 2; `src/ui/ui.js` and `src/bookmarklet.js` MUST remain byte-identical per PC01 Non-goals.

> **Found by:** review B only.

### `FIX-2` — `tests/key-bookmarklet.js` core-refusal test does not execute the refusal path

- **Exact defect:** `tests/key-bookmarklet.js` L523–528 is named `'refuses to run without the canonical core and never touches Constant Text'`, but its body performs only static `entry.includes(...)` string checks. Unlike `tests/ocr-helper.js` L320–342, it never executes `src/bookmarklets/key/entry.js` without `window.OCRParser`, with a mismatched `core.version`, or without `core.parsePaste` to verify the `#ocr_error` banner, `console.error`, and thrown error.
- **Supported operating preconditions:** Executing `src/bookmarklets/key/entry.js` in a browser `vm` stub on the Add Question form with missing or incompatible `window.OCRParser`.
- **Finite closure criteria:**
  1. Strengthen `tests/key-bookmarklet.js` so `coreProblem()` failure paths (missing `window.OCRParser`, version mismatch, missing `parsePaste`) are executed in `vm` against `src/bookmarklets/key/entry.js` and assert `#ocr_error` banner insertion, `console.error`, and the thrown `Key bookmarklet disabled` message (while keeping the existing Constant Text / `parsePaste` assertions).
- **Required evidence:** Passing `node tests/key-bookmarklet.js` showing executable refusal assertions on `src/bookmarklets/key/entry.js`.
- **Explicit non-goals / deferred checks:** Do not change `entry.js` `coreProblem()` behavior unless a defect is exposed by the new test.

### NOTE-1 — The developer contract names a stale core version

> **Found by:** review A.

`docs/AGENTS.md:15-16` calls the canonical core API version `2.4.0`, while
`src/parser/core.js:2-5`, `ocr_helper.js:4`, and the key entry all require
`2.5.4`. Runtime wiring and tests use `2.5.4`, so this is documentation drift,
not a runtime failure.

### NOTE-2 — Clear and failed native-submit behavior are not durable helper-suite vectors

> **Found by:** review A.

`tests/ocr-helper.js:385-400` covers a successful submit-marker reload, and
`:507-515` covers Skip, but the suite does not invoke the deployed Clear handler
or assert the `.admin-error` no-advance branch. Exact published-helper byte
identity plus the independent disposable browser covers Clear and the successful
native PRG path for this review. Keeping those checks only in handoff/browser
evidence leaves a residual regression gap; it does not independently invalidate
PC01.

### NOTE-3 — Stale `ocr_helper.js?v=2.4.7` cache token until PC06

> **Found by:** reviews B and C.

`deployed/admin_questions.php:1051` still loads `ocr_helper.js?v=2.4.7`, while
`ocr_helper.js` was restored to the `94a7593` bytes (`?v=2.4.5` at that
release). PC01 forbids deployment-token changes, so keeping `?v=2.4.7` is
compliant here; token rotation is deferred to PC06 and is required before
deployment, because a browser that cached the `793cb8f` helper under `?v=2.4.7`
would otherwise keep it.

### NOTE-4 — Storage-ownership documentation lags the key product

> **Found by:** review C (its `ocrSubmitted` startup part is `BLOCK-3`).

`docs/SPEC.md` §3.4 (`docs/SPEC.md:202-210`) still labels the key/autosave state
"the legacy bookmarklet contract" and omits `src/bookmarklets/key/` and
`sessionStorage.ocrPaste`.

### NOTE-5 — Preview and byte counter do not auto-refresh on key bookmarklet Load/Skip

> **Found by:** review C.

`src/question-preview.js:90-97` and `src/math-tool.js:620-625` bind click
listeners at page load to the deployed panel's `#ocr_load`/`#ocr_skip` nodes.
After `src/bookmarklets/key/boot.js` removes that panel and `entry.js` mounts
new buttons, programmatic `.value` updates in `entry.js:fillForm` dispatch no
`input`/`change` on `#question_text`, so `#owner_tool_preview` and the byte
counter stay stale until manual typing. This is pre-existing behavior shared
with the stimulus bookmarklet.

### NOTE-6 — Listener stacking involving the frozen stimulus bookmarklet

> **Found by:** reviews B and C.

- Key bookmarklet first, then stimulus bookmarklet on the same un-reloaded page:
  `src/ui/ui.js` L3 removes `#ocr_input` but not `form.__ocrKeySubmit`, leaving
  the key capture listener ahead of `ui.js`'s submit listener.
- Stimulus bookmarklet clicked twice: `src/ui/ui.js:1404,1421` registers an
  anonymous capture `submit` listener and a `setInterval` without removing prior
  instances.

`src/ui/ui.js` and `src/bookmarklet.js` are frozen in PC01; both are recorded for
later stimulus-bookmarklet phases.

### NOTE-7 — Review environment

> **Found by:** reviews B and C.

- Review PHP suites and lint ran on PHP 8.5.12; the package handoff ran PHP
  8.3.9, matching the PHP 8.3 target. No PHP file has a package diff.
- Review B could not hold a Chromium CDP listener in Termux; its browser
  evidence was added later in the same session and did not change its findings.
- Review C's workspace contained one unrelated uncommitted edit
  (`M docs/plan/prompts/review-session.md`, the revised review prompt); it was
  left untouched and is not PC01 scope.

## Primary evidence

Commands, measurements, and probes from the reviews that produced the findings above. Finding IDs use this record's numbering.

### Review A (GPT-5.6 Sol)

#### Scope And Ref Checks

- `docs/plan/prompts/phase-map.md` maps phase 1 to PC01.
- `HEAD`, the local package branch, and
  `origin/scratch/pc01-product-separation` all resolved to `d98d6ad` before the
  review. The worktree was clean before evidence collection and clean after all
  builds, tests, browser checks, and staging cleanup.
- `git merge-base --is-ancestor bb78c57 HEAD` exited 0.
- `git diff --name-only 793cb8f..bb78c57` contained only cycle-setup Markdown.
  No product file differs between the frozen product baseline and package base.
- No prior `parser-convergence-2026-11-phase-1*.md` review record existed.
- No real branch was switched or changed. No deployment or live request was
  made. Browser checks used a disposable local SQLite/PHP staging instance.

#### Commands And Results

##### Git, boundaries, and measurements

```text
git status --short --branch
git branch --show-current
git worktree list --porcelain
git rev-parse HEAD origin/scratch/pc01-product-separation
git merge-base --is-ancestor bb78c57 HEAD
git diff --name-status bb78c57..HEAD
git diff --numstat bb78c57..HEAD
git diff --numstat --find-renames bb78c57..HEAD -- ocr_helper.js experiments/key-bookmarklet src/bookmarklets/key
git diff --exit-code bb78c57..HEAD -- src/parser/core.js src/parser/parser.js src/ui/ui.js src/bookmarklet.js deployed
git diff --exit-code bb78c57..HEAD -- fixtures tests/fixtures
git diff --exit-code 94a7593:ocr_helper.js HEAD:ocr_helper.js
wc -l -c <production and test paths>
sha256sum <production paths>
git diff --no-index --numstat archive/live-sources/<helper snapshot> ocr_helper.js
```

All ref, boundary, no-diff, and exact-helper comparisons passed. Fixture and
expected-spec trees have no package change.

##### Full baseline and builds

| Command | Independent result |
|---|---|
| `node tests/runner.js` | 68 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 173 PASS, 0 FAIL |
| `node tests/ocr-helper.js` | 38 PASS |
| `node tests/key-bookmarklet.js` | 22 PASS; executes and rebuilds the real generated key artifact |
| `node tests/underline-toolbar.js` | 10 PASS |
| `node tests/question-preview.js` | 7 PASS |
| `node tests/math-tool.js` | 26 PASS |
| `node tests/render-markup.js` | 69 PASS |
| `node tools/extract-bank.js --check` | source, anchors, counts, and 7 hashes pass |
| `node src/build/build.js` | rebuilt stimulus artifact; hash remained `bf5837e...` |
| `php tests/php-render.php` | 33 PASS |
| `php tests/admin-question-store.php` | 8 PASS |
| `php tests/cbt-question-order.php` | 14 PASS, 0 FAIL |
| `for file in deployed/*.php; do php -l "$file"; done` | 7/7 syntax checks pass |

The independent shell had PHP 8.5.12. The package handoff separately records
its PHP 8.3.9 run; no PHP file has a package diff. `php tests/cbt-staging.php`
was not run because PC01 changes no PHP and its EL01 database/URL gate is not a
PC01 acceptance command.

Both generated bookmarklets are one physical line. The key suite confirms the
key output is deterministic, parses through `new Function`, and contains no
percent escape. Rebuilding left the Git worktree clean.

##### Direct adversarial artifact probes

An in-memory extension of the real `tests/key-bookmarklet.js` harness was run
without changing the test file. It continued to execute
`src/bookmarklets/key/bookmarklet.js`; the only harness adjustment shared the
same storage map across a second injection, matching browser `localStorage`.

```text
[PASS] REVIEW PROBE: stale prior key is accepted for a new manual queue
[PASS] REVIEW PROBE: reinjection during an in-flight save starts a duplicate POST
PASS: 24 key-bookmarklet vectors
```

These names describe reproduced defects, not desired behavior. The first probe
observed an unrelated retained key tick option D and start a POST. The second
observed two POST calls for queue index 0 while the existing one-panel and
one-listener assertion still passed.

##### Disposable browser evidence

The review started the repository's real `tools/start-phone-staging.sh` on
`127.0.0.1:3017`, logged into the real `deployed/admin_questions.php`, and drove
Chromium through Playwright. The page loaded the real
`src/parser/core.js?v=2.5.4` and `ocr_helper.js?v=2.4.7`. No live host was
contacted.

Ordinary acceptance passed:

- The deployed panel contained only `ocr_input`, `ocr_text`, `ocr_load`,
  `ocr_status`, `ocr_skip`, and `ocr_clear`; no key or autosave controls existed.
- A two-question manual paste loaded `{items, i: 0}`, left all radios unticked,
  Skip moved to question 2, and Clear wrote exactly `{items: [], i: 0}` and
  revealed the paste box.
- A native manual POST followed PRG, created disposable row 102, showed the exact
  success flash, consumed `ocrSubmitted`, and advanced the queue once.
- Injecting the real generated key artifact twice left exactly one panel, one
  title, and one `form.__ocrKeySubmit` function.
- A clean keyed two-question run made exactly two successful POST/302 requests,
  ended at `Autosave complete: 2 of 2 saved.`, and created rows 103 and 104 with
  keyed `correct_option` values 2 and 1. No `ocrSubmitted` or `ocrSaving` value
  remained.

Adversarial acceptance failed:

- With old `ansKey={1:"D",2:"C"}`, the deployed helper loaded a different
  two-question manual queue and correctly left all radios unticked. Injecting
  the key artifact immediately ticked D, reported `key D`, declared its dry run
  ready, and attempted one POST. The route was deliberately aborted before any
  row could be written.
- With key autosave question 1 held in flight, a second artifact injection left
  one panel and one key submit function. Starting from the replacement panel
  produced a second simultaneous POST for question 1.
- With a loaded key queue at index 0, setting `ocrSubmitted=true` after page
  initialization and reinjecting the artifact deleted the marker and moved the
  queue to index 1 without a POST or success response.

The only browser console errors were the staging favicon 404 and the deliberately
aborted adversarial POSTs. Staging was stopped, Chromium was stopped, and the
entire disposable `$HOME/tmp/pc01-review` root/database/log directory was
removed. The repository remained clean.

#### Externalize-First Verification

##### Production files

| Production path | Package-base measurement and diff | Final measurement | Responsibility and deployment inclusion | Direct production-path evidence |
|---|---|---|---|---|
| `ocr_helper.js` | 427 L / 17,473 B; `+16/-316` | 127 L / 4,917 B; sha256 `b83835b7...` | deployed manual helper only; loaded by `deployed/admin_questions.php:1050-1051` after the core | real source through `tests/ocr-helper.js`; disposable browser Load, Skip, Clear, native POST/PRG |
| `src/bookmarklets/key/entry.js` | absent; `+398/-0` | 398 L / 16,539 B; sha256 `3f4eff2b...` | one key-product entry: key load/fill, dry run, autosave, Stop settlement, and in-place save; inlined only by the key build | real generated artifact through `tests/key-bookmarklet.js`; disposable browser injection and save paths |
| `src/bookmarklets/key/boot.js` | moved from `experiments/key-bookmarklet/boot.js`, 12 L / 599 B; rename diff `+4/-4` | 12 L / 589 B; sha256 `52432cd4...` | key-product panel handover; included before the entry by the key build | real generated artifact double-injection tests and browser check |
| `src/bookmarklets/key/build.js` | moved from `experiments/key-bookmarklet/build.js`, 44 L / 1,372 B; rename diff `+5/-5` | 44 L / 1,364 B; sha256 `74753557...` | deterministic core + boot + entry assembler; repository build tool | key suite invokes this exact file and compares artifact hashes |
| `src/bookmarklets/key/bookmarklet.js` | generated artifact moved from experiments, 1 L / 67,469 B; one-line rename diff `+1/-1` | 1 L / 66,711 B; sha256 `f65f58ad...` | generated installable key bookmarklet; never a page asset | key suite executes this exact artifact; disposable browser fetches and executes it |

`ocr_helper.js` is byte-identical to `94a7593:ocr_helper.js`. Against the three
archived live-origin snapshots, its independently reproduced diffs are
`+51/-47`, `+51/-45`, and `+51/-45`. The additions stay below the 100-line cap;
no Gate 1 exception or owner excess approval is needed.

The 398-line entry remains cohesive around one product surface rather than
introducing another parser implementation. Boot and build each have one narrow
responsibility. Deployment inclusion is explicit and tests execute the real
source or generated product rather than copied behavior.

##### Test files

| Test path | Package-base measurement and diff | Final measurement | Production path exercised |
|---|---|---|---|
| `tests/ocr-helper.js` | 946 L / 44,747 B; `+40/-328` | 658 L / 30,476 B | requires real root helper and executes its real browser branch |
| `tests/key-bookmarklet.js` | absent; `+540/-0` | 540 L / 24,672 B | executes and deterministically rebuilds the real generated key artifact |

No fixture input or expected specification changed. The suites reuse unchanged
baseline fixtures and hand-authored test vectors; no parser output was used to
regenerate an expectation.

##### Unchanged boundaries and exclusions

| Path | Final lines / bytes | Verification |
|---|---:|---|
| `src/parser/core.js` | 1,733 / 60,722 | no package diff; sha256 `c9ac52b3...` |
| `src/parser/parser.js` | 1,337 / 50,419 | no package diff; sha256 `0a9bff5f...` |
| `src/ui/ui.js` | 1,431 / 61,701 | no package diff; sha256 `1e1f8007...` |
| `src/bookmarklet.js` | 1 / 101,337 | no package diff; rebuilt to the same sha256 `bf5837e4...` |
| `deployed/*.php` | unchanged | no package diff; full PHP baseline and 7/7 lint pass |

Excluded or separately classified artifacts:

- `src/bookmarklets/key/bookmarklet.js` is generated and therefore excluded from
  source line limits; it is measured and tested separately above.
- `src/bookmarklet.js` is the unchanged generated stimulus product.
- `experiments/key-bookmarklet/{boot.js,build.js,bookmarklet.js}` are removed
  superseded experiment paths; their responsibilities moved to the production
  key tree.
- `src/bookmarklet.min.js` is absent and was not built or used.
- Supplied snapshots and archives are unchanged and used only as comparison
  evidence.
- Phone-staging shims and the disposable staging root/database/log are test
  infrastructure, not deployment artifacts; the temporary review copy was
  removed.

The coordinator states that Gate 1 ran at `bb78c57`. No line-limit exception or
other approval-dependent deviation exists in this package, so there is no
exception approval to infer from `go` or from package acceptance.

### Review C (Gemini 4 Hydrogen run 2) — adversarial investigation

#### 4. Independent adversarial investigation

1. **State inventory & persistence boundaries:**
   - **Deployed helper (`ocr_helper.js`):** `localStorage.ocrQueue` (`{ items, i }`), `localStorage.ocrMeta` (`{ subject_id, exam_category_id, exam_year }`), `localStorage.ocrSubmitted` (set on native `submit`, consumed/deleted on next page load); reads `window.OCRParser` (`2.5.4`); attaches bubble `submit` listener on `form`.
   - **Key bookmarklet (`src/bookmarklets/key/boot.js` + `entry.js`):** sets `window.__ocrBookmarklet = true`; reads/writes `localStorage.ocrQueue` (`{ items, i, how }`, stripping legacy `queue.key`), `localStorage.ocrMeta`, `localStorage.ansKey`, `sessionStorage.ocrPaste`; deletes `localStorage.ocrSubmitted` before/after `saveInPlace` and consumes it on boot (`entry.js:393-396`); holds in-memory `auto`, `autoTimer`, `pendingSave`, `autoRun`, `savingInPlace`, and replaces `form.__ocrKeySubmit` capture `submit` listener.
   - **Stimulus bookmarklet (`src/ui/ui.js`):** reads/writes `localStorage.ocrQueue` (with `batchId`, `stimuli`, `needsImage`), `ocrMeta`, `ansKey`, `ansKeyBatch`, `ansKeyConflicts`, `ocrSaving`, `ocrSavedLog`, `ocrBatchHistory`, `autoLock`.
   - **Admin page (`deployed/admin_questions.php`):** loads `render.js?v=2.3.4`, `core.js?v=2.5.4`, `ocr_helper.js?v=2.4.7`, `underline-toolbar.js`, `question-preview.js`, `math-tool.js?v=1.1.2`.

2. **Highest-risk interactions examined and executed in real Chromium on disposable PHP staging (`127.0.0.1:3019/admin_questions.php`):**
   - **Deployed manual flow + key paste isolation:** Logged into staging admin, pasted keyed 2-question text into `ocr_helper.js`, verified `localStorage` held only `ocrMeta`/`ocrQueue` (no `ansKey`, no `ocrPaste`), radios unticked. Clicked Save Question -> real 302 PRG (`Question saved successfully (Question ID: 102).`), `ocrSubmitted` deleted, queue advanced to `Question 2 of 2`, radios unticked.
   - **Key bookmarklet installation & double-click over deployed page:** Evaluated real `src/bookmarklets/key/bookmarklet.js` over the deployed page -> replaced `#ocr_input` panel with `Bookmarklet paste`, added `#ocr_auto`/`#ocr_progress`, installed `form.__ocrKeySubmit`. Re-evaluated bookmarklet -> still 1 panel, 1 title, 1 `#ocr_auto`.
   - **Capture `saveInPlace` vs deployed helper's bubble submit listener:** Loaded keyed 2-question paste in key bookmarklet (`ansKey` + `ocrPaste` written, Q1 key C ticked), clicked real Save Question button -> `saveInPlace` intercepted in capture phase, `stopImmediatePropagation()` suppressed `ocr_helper.js`'s bubble listener, no page reload occurred, `ocrSubmitted` was NOT written, queue advanced in place to Q2 (`Key BM Q2?`) with key D ticked, then `Start autosave` completed Q2 (`Autosave complete: 2 of 2 saved.`, rows 103 and 104 persisted in SQLite).
   - **Adversarial Probe A — `Stop autosave` during hanging `POST` -> `Clear list` -> `Load` Batch 2 -> `Start autosave` (REPRODUCED `BLOCK-4`):** Intercepted `window.fetch` in Chromium on the real key bookmarklet: started autosave on Batch 1 (`POST` sent for `"Batch 1 Question?"`), clicked `Stop autosave`, clicked `Clear list`, loaded Batch 2 (`"Batch 2 DIFFERENT Question?"`), clicked `Start autosave`. `postedQuestions` stayed `["Batch 1 Question?"]` — **Batch 2's question was never POSTed**. When Batch 1's hanging request resolved, Batch 2 marked `queue.i = 1` and displayed `"Autosave complete: 1 of 1 saved."`.
   - **Adversarial Probe B — `saveInPlace` while hanging -> `Clear list` (REPRODUCED `BLOCK-4`):** Dispatched `submit` on the form (`savingInPlace = true`), clicked `Clear list` while POST was hanging, resolved the POST -> `ocrQueue` became `{ items: [], i: 1 }` and `#ocr_status` displayed `"Saved question 1 of 1 using its answer key."`.
   - **Adversarial Probe C — Stimulus bookmarklet over deployed page:** Clean reload, evaluated real `src/bookmarklet.js` -> replaced deployed panel with 1 `#ocr_input`, `#ocr_dry_panel`, `#ocr_live_panel`, `#ans_res`, `IDLE — Auto-save is idle.`.
   - **Adversarial Probe D — Stale/incompatible `localStorage.ocrQueue` (REPRODUCED `FIX-1`):** Tested key bookmarklet against (i) stimulus queue `{ items: [...needsImage/stimuli], i: 0, batchId }` + `ansKey: { 1: 'E' }` (mounts cleanly; `keyOf` yields `'E'`, radio index `-1`), (ii) `localStorage.ocrQueue = '{}'` -> threw alert `"Bookmarklet Error: Cannot read properties of undefined (reading 'undefined')"`, (iii) `localStorage.ocrQueue = '{bad json'` -> threw alert `"Bookmarklet Error: Expected property name or '}' in JSON..."`.

3. **Material scenarios remaining unverified:**
   - Live production deployment, live database writes/deletes (prohibited by `docs/LIVE-SAFETY.md` and `PC01`).
   - Interactive `Skip` clicked while `auto.inFlight === true` was verified by code inspection (`entry.js:356` lacks `autoStop` / in-flight guard) rather than a separate fetch-hooked browser click; its fix and test are included in `BLOCK-4`.
   - Mobile Brave/Android visual check (explicitly a `PC02`/`PC06` external gate, not `PC01`).

## Commit readiness and review status

- **Verdict:** `BLOCK`
- **Commit readiness:** no
- **Scratch-cycle merge readiness:** no
- **Review status:** combined original review complete; `BLOCK-1`, `BLOCK-2`,
  `BLOCK-3`, `BLOCK-4`, `FIX-1`, and `FIX-2` open in their first review round
- **Findings requiring a fix session:** `BLOCK-1`, `BLOCK-2`, `BLOCK-3`,
  `BLOCK-4`, `FIX-1`, `FIX-2`
- **Accepted non-blocking findings:** `NOTE-1`–`NOTE-7`
- **Dependent work:** PC02 remains blocked until every blocker is fixed and
  closed by independent re-review

## Recommended next action

Run the first-round fix session on the same package branch and exact reviewed
history, using only the frozen closure contracts above. Gate 1 must first
settle the open owner question on `BLOCK-3` criterion 4. Do not start PC02,
merge the package, or change a real branch.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 1 BLOCK-1 BLOCK-2 BLOCK-3 BLOCK-4 FIX-1 FIX-2
