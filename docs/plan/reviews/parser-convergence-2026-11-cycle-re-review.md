# Parser Convergence 2026-11 — Cycle Re-review 1

**2026-11-27 · Verdict: `BLOCK` · Review complete; not merge- or integration-ready.**
Twelve of the fourteen requested findings close. `BLOCK-27` and `BLOCK-29`
remain open in round 2. `BLOCK-38`–`BLOCK-41` are new, round 1. In real staging,
a stale tab saved Q1 again and logged it as the unsaved Q2; a separate replay
locked the save controls. The automated baseline is green.

## Exact target and scope

- Reviewed **`c5bbbf0ae9886c7777751cf222a4a30ae015a64f`**, tree
  `5ff5c937cf237a04e328d987eabd1b9e539ce443`, in a clean detached worktree.
  `git ls-remote` initially and after testing placed this commit at
  `refs/heads/scratch/cycle-review-fixes`. `scratch/parser-convergence-cycle`
  is the integration line at its parent **`3adf0fec8e53640eb107daa57b8d6634b95dcfdb`**;
  that parent adds only the original review over **`ed2d071273c1a39f3e984278b9ee354f5ab83b78`**.
  Neither ref moved. The handoff's terminal command names the integration
  line; the tests and verdict here refer to the pushed fix commit.
- `git merge-base` confirms `793cb8ffa754740749b05271e8fa4af717fa661a`
  as cumulative cycle base and `3adf0fe` as the fix fork. `9afe4f8` is the
  independently verified PC07 base and an ancestor. `ed2d071..3adf0fe` has
  no product, test, tool, or fixture delta. No unrelated worktree change was
  carried into the review.
- Scope is the finite contracts in the [initial cycle review](parser-convergence-2026-11-cycle-review.md#findings-and-finite-closure-contracts),
  the [fix handoff](../parser-convergence/pc-07-stimulus-first.md#cycle-wide-review-fix-session-2026-11-27)
  (`:293–367`, `go, approve D1 D2 D3 D4`, none reported `NOT REPRODUCED`), and
  materially affected behavior. Settled phase records supply regression controls.
- Tested the real PHP Add route and generated `javascript:` URLs in Chromium
  157.0.8103.38 via Playwright CDP. Two fresh `tools/start-phone-staging.sh`
  instances on `127.0.0.1:18146` (candidate) and `:18147` (parent) used distinct
  disposable SQLite databases, PHP 8.5.12, and login over HTTP with session
  cookies. `#` IDs below are local to the stated database. Browser probes
  recorded the DOM, shared storage, network outcomes and read-only SQLite
  `SELECT`s. Interception only held a real request or delivered it to PHP and
  dropped its reply. Image payloads were verified by HTTP GET and byte hashes.
  No production requests or deployment. The test files and rows are disposable
  staging evidence; the only repository edit is this record.

## Disposition of the frozen findings

All browser Loads below use the actual deployed adapter or the named generated
artifact. Accounting `16` and JAMB / UTME `3` are native metadata values;
`correct_option` is zero-based. Line references are for the candidate unless
otherwise specified.

| Finding | Disposition and independent evidence |
|---|---|
| `BLOCK-26` | **Closed.** The original one-question sequential two-tab Start replay against the parent produced two Q1 POSTs/rows (`#3004`, `#3005` in parent). On the candidate A alone saved `#3004` (year 2075, A, inactive), shared `i=1`, single Q1 log, no marker/lock. B had activated and confirmed while Q1 was pending. It still displayed Q1 when brought forward, but Start was disabled and issued **0 POSTs**. A freshly reopened tab was `COMPLETE` and also issued **0**. With two questions, a current reloaded tab continued from `i=1` and saved the distinct Q2/C exactly once (`#3007`/`#3008` are the two normal rows). The `tests/unit.js:3583–3600` case uses actual source in a UI harness; the parent/candidate browser comparison independently executed both exact artifacts. The stale **manual** save path on a partial batch is a separate regression, `BLOCK-38`. |
| `BLOCK-27` | **Open, round 2.** The parent replay persisted A while D was in `ansKey`. With the candidate, B's key-only Load keeps the batch and `i=0`, ticks D, and clears B's confirmation. Stale A with A ticked shows “The ticked answer does not match the key” and makes **0 POSTs**. Reload/re-activate and explicitly confirm Draft → one D POST and draft `#3005`. But the same correction can proceed on A **without renewing confirmation**: with the original checkbox still checked, tick D directly in the native form and press Start. One D POST, `#3006`, was accepted. `adoptStoredProgress` replaces the key/conflicts without clearing confirmation (`src/ui/ui.js:243–273`); the same-tab handler clears it at `:958–976`. The frozen criterion expressly requires current D **and renewed confirmation** before posting, or a refusal pending reload and confirmation (`cycle-review.md:31`; `docs/SPEC.md:725–728`). Same-tab A→C turned confirmation off and sent zero; unbatched manual Load had no key tick, deliberate D handover set `how:'key-paste'`, and Start refused (no batch identity). Keep the existing contract: on that same A→D cross-tab correction, a matching radio alone must not let old confirmation authorize a POST. |
| `BLOCK-28` | **Closed.** On the parent, the literal `Administrator Login page` stem committed (`#3017`, POST 302) yet reported expired with `i=0` and no marker. On the candidate, the authenticated 302→GET included both that ordinary stem and the real success flash and no login form. One in-place Draft POST → `#3018`, A/inactive, `i=1`, one log entry; repeated Start and Save after reset sent no other POST. Genuine logout yielded the password form, real 200, definite rejection, no row/advance. Invalid PNG yielded a real 200 validation rejection, no row/advance, cleared marker, then one corrected native save `#3019`. A real forwarded POST whose 302 was discarded persisted only `#3020`; `i=0`, marker retained, no log, zero retries (native/Start before and after reactivation). `save-flight.js:222–248` checks reply DOM; `autosave.js:370–395` classifies it; `tests/unit.js:2123–2142` checks structural classification. |
| `BLOCK-29` | **Open, round 2.** Core and both builds give one `sourceNum:null` block `[20,21]` for both literal caption variants, clean fields, both placeholder flags. Actual PNG at default `20-21` was `Ready` in both missing variants; Start stayed disabled and produced **0 POSTs**. Plain non-missing caption with a valid PNG saved Q20/Q21 (`#3014`, `#3015`); both 88 B uploads matched SHA-256 `dbcd7886602cb77f6e93d68f37549ade02e7762de6ec7f1950cd9e51ca8a776b`. **Manual Load** for both literal captions still produces `flags=[[],[]]` and no advisory in `#ocr_status`, despite clean fields and the untouched manual Constant Text sentinel. `core.js:1280–1303,1340–1385` repairs extraction and annotates `parsePaste`; `ocr_helper.js:20–22,88–110` still runs the `splitQuestions(...).map(parseQuestion)` path without the leading diagnostic. Original `cycle-review.md:55` explicitly requires manual Load with an advisory and no Constant Text write (`pc-07-stimulus-first.md:39` maps the advisory-only control). The unmet criterion is the manual diagnostic for the two literal captions, with no save gate or extra product UI. |
| `BLOCK-30` | **Closed for the two separately anchored blocks.** Fixture, core, helper, and both loads keep Q19's stem and A–D (`Ninety / Eighty / Seventy (see B. note) / Sixty`) and `[20]`, then `[21]` with their own rubrics. The plan had two rows, `20` and `21`. With only red attached, exactly two real POSTs completed (Q19 `#3032`, Q20 `#3033`), `i=2`, `PAUSED (IMAGE)` before Q21. With both attached, one further POST saved Q21 `#3034`. Q19 had no image; Q20 and Q21 each returned their own exact 88 B PNG, red `137e9eaba386bc396578d4b09e42fe3aa4624d99582b47b7a29d4b9821363aba`, blue `7c8c024b23b3f8d72ed60d8ecc7e2c8c028bbaad1a88ee6fc67d1be2d8a30340`. Single-block Load has `[20]` only; the direct marker-only primitive control is unchanged (see below). `core.js:1144–1154,1233–1277`, `image-plan.js:205–269`. |
| `BLOCK-31` | **Closed.** Both `C. I. F.` and `freight-inclusive` lead-ins give exactly `[20,21]` in the core and all three Loads, with clean native fields. Queue-level `parsePaste` keeps the literal passage scoped to both items and both placeholder flags; the stimulus offers no Start/POST for either, and its Constant Text shows the correct version. The manual fields have no shared passage write or bookmarklet behavior. A real leading unnumbered Q with A–D stays `[null,20,21]` with a missing-number advisory. `core.js:309–318,512–526,1280–1287`, new fixture. The explicit manual caption advisory is tracked under `BLOCK-29`. |
| `BLOCK-32` | **Closed.** Core, adapter and all three Loads return `CR27 What does C. I. F. mean and on this invoice?`, the four original options, and ordered `[20]`, `[21]` metadata. Either single marker removes just itself; a malformed `[[image: 20]` remains literal while the valid `[[diagram: 21]]` still works. Existing malformed-bracket controls pass. `core.js:1034–1048` removes from right to left, retaining parse order. |
| `BLOCK-33` | **Closed.** Bare `20.50` and `20/06/25` give one unresolved block `[]`, no Q20 image flag and clean fields, in core/adapter and three Loads. Both defaults are empty and choosing a valid PNG + Attach at that default remains `No image`. The exact singleton `20.` and date-with-explicit-marker controls resolve `[20]`/`[21]`; V10/V11, directional and year vectors remain green in the carried unit/helper/key checks. `core.js:893–904`. |
| `BLOCK-34` | **Closed.** Both literal suffixes and no-footer control fill `Nine units` and the exact other four values in `parseAll` and real manual Load, with all radios clear, absent `ansKey`, and untouched Constant Text. The real native PRG footer test after choosing A saved `#3021` once, `i=1`, no remaining `ocrSubmitted`, D=`Nine units` and `First paragraph.\n\nSecond paragraph.` unchanged in PHP session prefill and SQLite. The exported helper regression and baseline control exercise `splitQuestions` (`core.js:369–390`; `ocr_helper.js:20–22,104–125`). |
| `BLOCK-35` | **Closed.** Original retained artifact marked Q20 `needsImage` yet POSTed Q19/A and Q20/D; parent SQLite `#3018`/`#3019` show Q20 active and imageless. Candidate dry run flags the image requirement, Start refuses with **0 total POSTs** and pointer `0`. Removing the marker gives two real active in-place saves (`#3016`, `#3017`); both builds left the manual Constant Text sentinel alone in the comparator case. `key/entry.js:194–227,389–401`; built test in `tests/key-bookmarklet.js:428–454`. The frozen rollback object `9afe4f8:src/bookmarklets/key/bookmarklet.js` still hashes to `8660fe2c569748922c5ba0f5fb0d3849a77fc83f34df57f858ff157ff305acfd`. |
| `BLOCK-36` | **Closed on the original layout and its controls.** Core, exported helper and all three Loads return A=`Ninety (see D. note)`, B=`Eighty`, C=`Seventy`, D=`Sixty`, exact stem, flagless Q19, range `[20,21]`. Removing the mention and moving it later into Option D both work with the same range; a true physical out-of-order A/D/B/C set and the settled D-91 controls still pass. `core.js:593–628,1515–1525`; the new composition with an inline real boundary and a later physical repeat is `BLOCK-40`. |
| `BLOCK-37` | **Closed for the original distinct-stem replacement.** A's manual in-place Q1 POST was held while B's deployed helper cleared and loaded the different-stem Q1 over the same unbatched slot. The candidate committed/logged only A's old row `#3022`, kept B at zero with its exact new text, and reopened at the unsaved B item. The parent advanced B to `i=1`. With no replacement the candidate advanced once (`#3023`, terminal pointer `1`). `save-flight.js:89–93,267–295`; the new equal-text/different-number regression is `BLOCK-41`. |
| `FIX-5` | **Closed.** Changed native Year 2079→2080; confirmation cleared and Start sent zero before re-confirmation. After five real Draft POSTs the form was reset and the heading displayed `Batch complete: Accounting / JAMB / UTME / 2080 — 5 questions (#1 to #5) · 5 saved.` on the same page and after reopen. History and SQLite agree on `#3025`–`#3029`, year 2080 and inactive. The parent printed both placeholders/year 2026 despite correct rows/history. `ui.js:59–74,335–366,640–646,724–728`; `save-flight.js:343–355`. |
| `FIX-6` | **Closed.** Parent staging harness **6/7** with the old token check. Candidate disposable CBT HTTP suite **7/7**; `tests/cbt-staging.php:213–220` requires `2.3.4` and absence of `2.3.3`, retaining alias, renderer call, CSS hierarchy and all other assertions. `deployed/cbt.php` and renderer bytes match the parent. |

For `BLOCK-30`, `core.extractStimuli('[image: 20]\n[diagram: 21]', 19)` gives
`[[20],[21]]` with both 2.5.8 and 2.5.9, the direct marker-only control described
in the original evidence. Removing both rubric lines from the **full** tandem
paste (including when collapsing the blank between the markers) instead yields
only `[20]` on both versions via anchored extraction. Real candidate bookmarklet
Loads also showed the collapse. This is an inherited full-paste limitation;
it is not a passing full-paste control or part of the separately anchored fix.

## New findings — first round

### `BLOCK-38` — A stale native Save consumes the next item in a shared batch

**Rule:** `docs/SPEC.md:809–811`, a successful save “only advances the queue if
it still points at the same batch/index/item it started with”; PC01
`pc-01-product-separation.md:36–38` requires products to “refuse or safely reset
stale incompatible state.” This is a new wrong-item settlement and queue-loss
regression, distinct from the original completed-batch Start duplicate.

**Reproduce:** In a fresh same-origin two-tab Chromium context, load Accounting /
JAMB / 2077 Q1 `First question about audit procedure?` and Q2 `Second question
about audit procedure?` with `One unit / Two units / Three units / Four units`,
key A/C. Activate on both tabs while Q1 is pending. While A is saving Q1 Draft,
press Stop and let that real POST finish. The lock and marker are gone and
shared `i=1`. Bring B forward without reloading; its native stem and visible
status still say Q1. Click the normal Save Question button. Candidate SQLite
`#3009` is Q1/A/draft and **`#3010` is Q1/C/active**; nothing saved Q2. The second
log entry reports **Q2**, its fingerprint describes Q1, and shared `i=2`.
Parent control also allowed a manual duplicate of Q1, but labeled it Q1 and
kept `i=1`, so Q2 remained pending. No simultaneous POST or lock race needed.

**Cause and closure:** `src/ui/ui.js:243–258,1123–1136` adopts the new index
without aligning the displayed form; `save-flight.js:110–118,173–208,269–295`
uses the new index with old FormData. In this exact sequence, refuse stale Save
before POST, or refresh and require a fresh action on the correct item before
posting. Q1 keeps one row/log, Q2 stays pending until Q2 is actually submitted,
and only that Q2 payload may advance it. Verify both tabs, actual multipart
and SQLite plus a built-artifact regression. Keep the current, reloaded Q2
control and the completed-batch Start result. **Non-goals:** simultaneous
tab arbitration, server idempotency, or banning hand edits to a current item.

### `BLOCK-39` — Revisiting a saved number locks Save and queue controls

**Rule:** `docs/SPEC.md:809–818`, queue controls refuse “while a save is in
flight” and without an unconfirmed marker manual save “proceeds normally.”
The candidate leaves a permanent busy state with no save in flight.

**Reproduce:** In one real Add tab with the stimulus artifact, a keyed two-item
queue has Q1 saved in place (`#3030`, year 2078) and unsaved Q2. Use **Go to**
book number `1`, then the native Save Question button. No additional POST,
but `ocrQueue.i` changes `0→1`, the visible form still shows Q1, Save is disabled,
`#ans_res` remains `Saving...`, and Skip reports `A save is in progress. Wait for
it to finish.` CDP captured `ReferenceError: Cannot access 'isCurrentGen' before
initialization` as a promise rejection. Reload restored Q2, which then saved
once as `#3031`. No injected or edited `localStorage` was needed.

**Cause and closure:** `save-flight.js:110–152` updates storage and invokes
`isCurrentGen` (and would access `flight`) before the declarations or the
`try/finally` that releases `saveInProgress` (`:367–373`). `ui.js:1219–1244`
catches the rejected promise but the button remains disabled because it sees
the busy flag. Verify that the already-recorded Q1 attempt sends zero POSTs,
leaves an honest visible pointer/status and no persistent busy/uncertainty,
and that Q2 can be selected and saved once **without a reload**. Include the
real generated artifact and the one-row saved-log control. **Non-goals:** Go to
redesign or a server duplicate rule for manually authored questions.

### `BLOCK-40` — Wrapped D-91 repeat displaces the previously selected D boundary

**Rule:** `INTENT.md:94–97`, “A later label-like occurrence of an already
selected option letter remains option text”; `docs/SPEC.md:224,237` requires
options to keep their own text. This is a data-changing regression from the
physical-line preference, separate from the fixed earlier `D. note` mention.

```text
19. Which word order is correct?
A.
Ninety
B. Eighty
C. Seventy D) The notation
D ) stays in Option D
```

2.5.8 core and manual `parseAll` yield C=`Seventy`, D=`The notation D ) stays
in Option D`, no flags. 2.5.9 core, manual `parseAll` and all three real Loads
yield C=`Seventy D) The notation`, D=`stays in Option D`, still no flags.
`core.js:593–628,1515–1525` prefers a later physical line once any label wraps,
even when D was already validly selected after C. **Closure:** prove the five
exact fields and no duplicate flag on the literal paste in canonical core,
helper and both generated Loads. The original `BLOCK-36` exact geometry,
out-of-order physical lines and existing D-91 repeat controls must still pass.
Require a failing-first fixture or equivalent direct regression. **Non-goals:**
changing the broader inline grammar or PC03's two accepted residual layouts.

### `BLOCK-41` — An equal-text unbatched replacement with a different number is consumed

**Rule:** `docs/SPEC.md:809–811`, “same batch/index/item”; PC01
`pc-01-product-separation.md:36–38`, “refuse or safely reset stale incompatible
state.” The request belongs to a distinct printed item in a different list.

**Reproduce:** A manually Loads unbatched Q1, year 2085, stem `Which voucher
belongs in this separate list?` and the four distinct units options. Activate
stimulus and hold A's native-button in-place POST with A selected. B clears
and Loads the same stem/options as **Q2 at year 2084** in the deployed helper,
unbatched and with `i=0`. Release A. Only Q1/2085 commits (`#3024`; A, active);
the replacement item is Q2 but `i=1` and reopening shows no pending item. The
same replay on the parent commits only old Q1 (`#3010` in the parent) and
leaves Q2 at `i=0`. The existing metadata-refresh behavior is not needed to
explain the pointer change.

**Cause and closure:** Candidate `save-flight.js:89–93,278–295` compares the
five text fields for unbatched items but removed the original number check.
On this held-POST replay only the old POST/row/log may settle; the replacement
remains Q2 at `i=0` and is selectable after reopen. Keep `BLOCK-37`'s same-number
different-text refusal and unchanged-list advance. Require real two-tab
multipart/SQLite evidence and a built-artifact regression. **Non-goals:** adding
IDs or storage keys to manual queues, or a general metadata synchronization
redesign.

**`NOTE-8` — Stale fix handoff ref and verdict.** `docs/plan/README.md:659–660`
requires the handoff to record “exact files, commands/results, hashes, open
questions, review status, and deferred commit state.” The candidate's
`pc-07-stimulus-first.md:295–305,388–389,425–429`, `docs/STATUS.md:28–48`, and
`docs/plan/prompts/phase-map.md:31–37` report `FIX` rather than `BLOCK`, say
the changes/fixtures are uncommitted, and point re-review to the wrong ref.
This is non-blocking documentation: `ls-remote`, the exact Git ancestry and
the published immutable original review independently establish the right
ref, tracked fixtures, and verdict; the stale text did not affect runtime
or evidence. Prior cycle `NOTE-4` and Phase 7 `NOTE-1` are untouched.

## Affected state/action matrix

**E** real Chromium/PHP; **H** direct core/module or actual generated-artifact
harness; **I** inspected; **U** unverified/deferred. The important failure mode
is disagreement between shared queue/key/log, a tab's DOM/confirmation, and
the POST's captured item. PHP commits the submitted form, not the queue entry
chosen by client settlement. Image files are tab-local RAM; only the plan's
parsed target numbers tie shared parser metadata to a future request.

| Action | Idle / normal | While pending | After failure / stale context |
|---|---|---|---|
| Stimulus Load, key-only Load, confirm mode, Start/Stop, tab bring-forward/reopen | E: keyed full Load, A→C same-tab, metadata change, Draft/confirm, distinct Q2; H: Active and reactivation | E: Stop with held Draft Q1 and real settlement; H: double reinjection and same-form in-flight guards | E: completed duplicate Start refused; stale A key refused, corrected D bypasses renewed consent; reopened batches do not auto-resume. U: simultaneous acquisitions in different processes and device-specific visibility. |
| Native button in stimulus, Go to, manual helper Clear+Load | E: in-place manual save; E: actual native PRG with both controls kept; H: approved field/queue regressions | E: hold and replace with different stem or same body/different number; E: no-replacement control | E: stale tab posts Q1 as Q2; Go to logged Q1 locks controls; reject+correct, true expiry and committed-but-lost reply; I: native helper's next-load marker path. |
| Parser Loads, advisory, Attach/Start | E/H: caption pair, passage pair with genuine orphan, inline pair/singles/malformed, range controls, divider/key/no-footer, option layout, tandem/single/marker comparisons | E: partial image plan pauses before Q21; attach the second file and Start; H: partial bulk/expiry; I: request capture of chosen file | E: valid PNG does not bypass missing captions; missing-text Start refused; invalid default stays `No image`. E: manual missing-caption diagnostic absent. U: owner device picker lifetime. |
| Comparator, CBT staging | E/H: comparator Load/Dry/Start and no-image control, actual stage CBT HTTP path | H: comparator Stop/adoption existing suite; picker not available there | E: flagged image case zero POSTs; H: malformed, retained key, wrong core controls. U: physical bookmark-manager install and target MySQL/live deployment. |

## Baseline, paths and approvals

| Commands / method | Independent result |
|---|---|
| `node tests/runner.js`, `node tests/unit.js`, `node tests/ocr-helper.js`, `node tests/key-bookmarklet.js`, `node tests/single-source.js` | Node v26.13.0: **84** fixtures, zero failing/pending/orphan; **204 / 43 / 44 / 15** checks. The real fixture runner with its canonical require resolved to parent 2.5.8 gives **77 PASS / 7 FAIL** on the same tree of inputs/specs. Exported helper also reproduced both footer failures on the parent. |
| `node tests/underline-toolbar.js`, `node tests/question-preview.js`, `node tests/math-tool.js`, `node tests/render-markup.js`, `node tools/extract-bank.js --check` | **10 / 7 / 26 / 69** and all **7** bank output hashes. |
| `php tests/php-render.php`, `php tests/admin-question-store.php`, `php tests/cbt-question-order.php`, lint every `deployed/*.php` | **33 / 8 / 14**; **7/7** lint on PHP **8.5.12** and target-series **8.3.32**. |
| `EL01_STAGING_DB=<instance SQLite> EL01_STAGING_URL=http://127.0.0.1:18146 "$HOME/tmp/php83-review/php" tests/cbt-staging.php` | Candidate **7/7**. Same harness from parent checkout with its own DB/`:18147` **6/7**, the obsolete asset assertion only. |
| `node src/build/build.js --check`, `node src/bookmarklets/key/build.js --check`, `wc -l`, stripped-body `node --check`, CR/`%HH` scan | Both current, **1 LF line** each, no CR or percent-escapes; HTTP GET bytes for both artifacts, deployed core and root helper match the examined Git bytes. `tests/single-source.js` checks one core and the exact module wiring. |
| `git diff --check 3adf0fe..HEAD`, `git diff --check 793cb8f..HEAD`, `git diff --numstat --no-renames`, `git show <ref>:<path>`, `git diff --no-index --numstat` | Clean whitespace and exact measurements below. No archived/live snapshot or staging tool changes. |

**D1–D4 trace.** D1 changes only `tests/cbt-staging.php`'s token assertion.
D2 covers `tests/{unit,ui-harness,ocr-helper,key-bookmarklet}.js`: actual UI
with shared storage and network doubles, actual helper export, and the tracked
key artifact. The form doubles do not prove browser/PHP settlement. The four
new async unit tests do not select `built:true`; independent direct browser
replays above cover the bundled production paths. Existing version assertions
move to a canonical version reference or a semver check; exact pins are
independently checked by HTTP, manifest and build. D3 adds precisely these
seven manually specified `input_origin: doc` input/expected pairs, checked
against original review text and failing first on the unchanged parent core:
`leading-caption-missing-text` (29 plain caption), `tandem-image-blocks` (30
separately anchored pair), `leading-passage-spaced-initials` (31 initial run),
`inline-marker-pair` (32 stem), `image-ref-decimal-amount` and
`image-ref-slash-date` (33 bare markers), `wrapped-option-d-body-mention`
(36 direct wrapped item). No prior fixture changed. D4 rotates the two loaded
tokens and both consumer pins as authorized. The `BLOCK-35` comparator delta
is the scoped hard stop and pin; its pinned historical rollback does not move.

| Changed readable production path | Cycle base `793cb8f` LF/B | Parent LF/B | Candidate LF/B | Fix +/−; cumulative +/− | Responsibility, delivery and direct evidence |
|---|---:|---:|---:|---|---|
| `deployed/admin_questions.php` | 1057/62877 | 1057/62878 | 1057/62878 | 2/2; 2/2 | Native PHP Add/Edit; site root; two script tokens only at `:1050–1051`; actual PHP/HTTP/lint. |
| `ocr_helper.js` | 427/17473 | 127/4917 | 127/4917 | 1/1; 17/317 | Thin manual adapter/panel and native PRG; site root; helper suite and real Loads/PRG. |
| `src/parser/core.js` | 1733/60722 | 2337/86964 | 2426/91154 | 105/16; 758/65 | Canonical parsing and diagnostics only; site `src/` asset and first in both builds; runner and all three Loads. |
| `src/bookmarklets/stimulus/autosave.js` | — | 593/25277 | 603/25760 | 11/1; 603/0 | Pure gating, classification and log policy; stimulus build and Node facade; direct unit and real response classification. |
| `src/bookmarklets/stimulus/save-flight.js` | — | 358/15275 | 403/17618 | 48/3; 403/0 | One save request, marker and settlement; stimulus build; real delayed, lost and completed POSTs. |
| `src/ui/ui.js` | 1431/61701 | 1221/51589 | 1306/55061 | 87/2; 368/493 | Stimulus UI/queue and event/loop wiring; stimulus build; actual multi-tab and single-tab controls. |
| `src/bookmarklets/key/entry.js` | — | 596/24700 | 613/25499 | 18/1; 613/0 | Comparator UI/key and save orchestration; comparator build only; built suite and staged Start/Dry/manual sentinel. |

Unchanged in the fix delta: `src/parser/parser.js` (7 LF/363 B Node facade),
`src/build/build.js` (276/8377 assembly), `src/bookmarklets/stimulus/image-plan.js`
(394/14990 tab-local pick/attach), and `src/bookmarklets/key/{boot.js,build.js}`
(12/589 panel handover and 54/1790 assembly). Git equality plus the build/test
paths above verify their inclusion or absence: stimulus build order is core →
autosave → image plan → save flight → UI; key is core → boot → entry. There is
no new module or live-origin limit exception. Independently measured additions
from dated live origins: admin `96/85`, CBT `78/37`, answer details `21/3`, OCR
helper `51/45` (`ocr_helper-2026-11-01.js` `51/47`, `ocr_helper_deployed.js`
`51/45`). `docs/plan/README.md:297–334` caps additions at 100. Only the two
admin tokens change PHP: CSRF/action/PRG/flash/option/upload code is byte-equal.
Storage inspection found only the existing keys/shapes; confirmation and new
`batchMeta` are in-memory. The save-path defects above occur within those shapes.

**Deployment manifest:** all 20 LF count/byte/SHA rows match: seven PHP
(`admin_questions`, `admin_question_store`, `cbt`, `cbt_question_order`,
`subject_display`, `answer_details`, `render`), `ocr_helper.js`,
`src/parser/core.js`, `src/underline-toolbar.js`, `src/question-preview.{js,css}`,
`src/math-tool.{js,css}`, `src/owner-tool/render.js`, and the five ops rows
(`01-constant-text.sql`, `02-constant-text-rollback.sql`,
`03-english-lexis-structure.sql`, `04-english-lexis-structure-rollback.sql`,
`README.md`). Staging requests the 2.5.9 core before the 2.4.12 helper;
served SHA-256 `2626b18104b7700d290e7bc6002955715b67048f2f08e284458374785907d3ce`
and `15024aa22443ea3ab52e2b07f4a1c41d9b6af659a6c57acb60d25df2b87cd838` respectively.

**Excluded from readable line accounting:**

- Generated `src/bookmarklet.js` `+1/−1`, 171327 → 178214 LF bytes, SHA-256
  `daae12d5b727bfa058f37ab80b04d965fdb8261a11da3b030dc1f3fa713517c5`;
  178213-byte URL SHA-256 `c31dd54cecf85c37a1b0da8ff3460893325ab570068a1fa3f0bb31987c4202fa`.
- Generated `src/bookmarklets/key/bookmarklet.js` `+1/−1`, 94131 → 97287 LF
  bytes, SHA-256 `b2a3f95385724ea8ee48c8d9133873311902f0aea8ca2c4050daf6259022b31b`;
  97286-byte URL SHA-256 `daf411ccc5c8a185fce4aaee755d421b5ae184d8e145ac9bebeedfcf9c3ab89f`.
- Historical artifacts `9afe4f8:src/bookmarklets/key/bookmarklet.js` (rollback,
  hash above), `ed96b11:src/bookmarklet.js` (donor), and
  `793cb8f:experiments/key-bookmarklet/bookmarklet.js` (removed during PC02);
  no tracked `src/bookmarklet.min.js`. No fix changes in the archived migration,
  SQL or live snapshots, raw root `admin_questions.php`, `answer_details.php`,
  `cbt.php`, or `cbt_practice.php`, the staging shims, or
  `deployed/sql/base-schema.working.sql`.

## Handoff

**Commit:** deferred; this is an uncommitted review record. **Review status:**
cycle re-review complete and blocked. Publish only this record to the fix
branch on a separate explicit request, then run the next fix round against
that branch and the exact open contracts below. `BLOCK-27` and `BLOCK-29` are
in round 2; new `BLOCK-38`–`BLOCK-41` are in round 1. Desktop installation,
owner Brave/Android acceptance and separate reviewed comparator retirement
remain external gates after settlement.

NEXT COMMAND: @docs/plan/prompts/fix-session.md fix cycle parser-convergence-2026-11 against c5bbbf0 on scratch/cycle-review-fixes from docs/plan/reviews/parser-convergence-2026-11-cycle-re-review.md BLOCK-27 BLOCK-29 BLOCK-38 BLOCK-39 BLOCK-40 BLOCK-41
