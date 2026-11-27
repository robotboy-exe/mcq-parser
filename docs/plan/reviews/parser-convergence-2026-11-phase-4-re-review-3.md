# Parser Convergence 2026-11 Phase 4 Re-Review 3

- **Date / reviewer:** 2026-11-26 / OpenCode, independent review.
- **Package:** PC04, [Marker-Adjacent Range Extraction](../parser-convergence/pc-04-marker-range.md). Closure-focused, review round 2 for `BLOCK-9`: [frozen contract](parser-convergence-2026-11-phase-4-re-review-2.md#block-9--a-monetary-tail-beginning-in-the-still-becomes-an-image-target), line 54; fix handoff `pc-04-marker-range.md:250–287`. The `in progress` status is the handed-off, review-pending implementation; PC03 is settled and there is no further external gate.
- **Candidate:** `ed143236a08bf780be1c6c20af1dec3e23625693`, reviewed from the clean dedicated worktree already on that exact commit. `git worktree list --porcelain`, `git rev-parse HEAD refs/remotes/origin/scratch/pc04-marker-range`, and `git ls-remote --exit-code origin refs/heads/scratch/pc04-marker-range refs/heads/scratch/parser-convergence-cycle` confirm the checkout and pushed tips. The candidate's parent `d9cb69f` differs from unfixed `19392ac` only by the immutable re-review 2 record.
- **Package base:** `9afe4f806e1254ecf74c93f13f5ee73d1c4fd497` is the pushed scratch-cycle tip, the merge-base with the package branch, and the sole parent of original candidate `b2cb897`. `git diff --exit-code 69934bf 9afe4f8 -- src ocr_helper.js deployed fixtures tests` confirms that it carries the settled PC03 product and tests.

## Verdict and frozen disposition

**BLOCK — not ready to mark done or merge.** `BLOCK-9` closes on its frozen checklist; `BLOCK-1`–`BLOCK-8` remain closed. The focused adversarial checks found two separately reproducible errors in the changed range terminator: **`BLOCK-10`** adds an unrelated cash amount as an image target, and **`BLOCK-11`** drops an actual target that the previous candidate recognized. Each new finding is in its first review round.

| Frozen `BLOCK-9` criterion | Independent result |
|---|---|
| Failing first on `19392ac` | **Pass.** Ran the candidate's unchanged unit and manual Load assertions with the old core loaded from its Git blob. Unit: 197 pass / 1 fail at `V9 nums`; the manual suite exits 1 at `tests/ocr-helper.js:761`. Both report the extra 25. The independent literal replay on that revision also flags Q25 through the core. |
| Exact `V9` on `ed14323` | **Pass.** One `[image]` marker from Q19 with the whole literal intro, `nums=[20,21,22]`, `missing=[]` in the core and bookmarklet queues, and only Q20–Q22 flagged there. Q19 is `Which statement is correct? / one / two / three / four`, with `flags=[]`. The exported helper and three real Loads agree on source metadata. Stimulus defaults to `20-22` and real PNG Attach reports `Ready`. |
| Exact positive and prior controls | **Pass.** `V9-ctrl` keeps `[20,21,22,25]` and all four flags, `V6` keeps `[20,21,22]`, and `V6-ctrl` keeps `[20,22]`. Direct whole-paste replay and real Loads on all three products confirm the ranges. Manual intentionally retains source metadata without adding queue-level flags or `missing`. |
| Permanent evidence and baseline | **Pass.** `tests/unit.js:887–913` asserts both complete pastes; `tests/ocr-helper.js:754–765` drives real helper Load code in its form harness. `tests/single-source.js:193–225` adds two shorter artifact parity inputs, with only Q20 in the tail; the whole queues and plan defaults are covered in Chromium. Full Node/PHP baseline and both build checks pass. |

## Acceptance coverage (`pc-04-marker-range.md:37–47`)

| Row | Independently observed result |
|---|---|
| Failing first | **Pass.** Candidate runner with the package-base core produces 73 pass / 1 fail (only the supplied P20 fixture). Q19.D contains the intro, a structural-option flag is present, and the range/text and target list are empty. The candidate passes that fixture's 38 assertions. |
| Range | **Fails on `BLOCK-11`.** The supplied paste targets Q20–Q22 only; `P1=[image: 21]` and `P2=[[image: 20, 22]]` win over the intro in all three Loads. A qualifying comma list with `in the same section` loses its actual Q25. |
| False positives | **Fails on `BLOCK-10`.** The exact V9 and V6 amounts now stop the list; the added `25 in the bank was deposited.` control also stops it. `N1–N5`, `B6`, year, option-line and marker controls pass. A cash amount followed by `in the table` enters the list even though the remaining words identify it as the deposit. |
| Field contract | **Pass on the tested vectors.** Raw Q19 has `trade discount` as D, and every checked form retains clean Q19 fields and untouched Constant Text. Both paragraph tests in `tests/unit.js:631–644` preserve real blank-line breaks without inventing breaks at normal wraps. The earlier ownership vectors `S1–S5`, `R1/R2`, `V7/V7-r`, and unquoted `S4` pass the current direct whole-paste tests. |
| Controls | **Pass.** The 73 enumerated prior inputs match package-base results on both canonical and manual parsing paths. Direct unit tests for `A1–A3`, `G1–G4`, the paired and broken `V8` forms, `[missing text]`, `[diagram]`, markerless table, un-ranged and prose-separated intros all pass. |
| Surfaces | **Production paths verified.** Source marker, range and native Q19 fields agree for the 11 cases below. The manual helper reports the source range; both bookmarklets also flag the queued targets. Both new errors reach the real stimulus Attach default and report `Ready`. No product UI change in the package diff. |
| Safety/build | **Pass.** Both artifact guards, syntax checks, full baseline, deployment manifest, and PHP lint pass. Only loopback staging was used; the only POST was its login. No deploy or real-branch change. |

## New findings and frozen closure contracts

**Shared supported setup.** Paste `H`, a blank line, the stated literal intro, standalone `[image]`, and a blank line and the ordinary Q20–Q26 suffix. `H` is `19. Which statement is correct?\nA. one\nB. two\nC. three\nD. four`; the suffix is seven `N. Which of the following is correct here?` questions with the same four options and blank lines between questions. None has another marker. Q25 really exists in this one numbered paste. There is no explicit marker range, textual table row, or answer key. The diagram is referenced by the standard `Use the diagram below to answer questions …` intro. Exact direct reproduction on `ed14323`:

```js
const core = require('./src/parser/core.js');
const helper = require('./ocr_helper.js');
const choices = 'A. one\nB. two\nC. three\nD. four';
const head = '19. Which statement is correct?\n' + choices;
const suffix = Array.from({ length: 7 }, (_, i) =>
  `${20 + i}. Which of the following is correct here?\n${choices}`).join('\n\n');
for (const ending of ['in the table is the cash deposit.', 'in the same section.', 'in this section.']) {
  const intro = `Use the diagram below to answer questions 20 to 22, 25 ${ending}`;
  const text = `${head}\n\n${intro}\n[image]\n\n${suffix}`;
  const { items } = core.parsePaste(text);
  const s = items[0].stimuli[0];
  console.log(ending, s.nums, s.missing, items.filter(q => q.needsImage).map(q => q.num),
    helper.parseAll(text)[0].stimuli[0].nums);
}
```

### BLOCK-10 — A table value that is the cash deposit becomes an image target

**Rule violated:** `pc-04-marker-range.md:43`: “Dates, years, amounts, account numbers, figure labels, option lines, and following questions never become targets.” `docs/SPEC.md:441–445`: “Intro range extraction isolates only the `questions ...` range/list clause and stops before comma-followed prose tails”. This is a directly unmet acceptance row with the approved adjacent marker. It does not reopen exact `V9`.

**Exact defect (V10):** `Use the diagram below to answer questions 20 to 22, 25 in the table is the cash deposit.` The comma joins on the OCR line a clause identifying a table value, `25 … is the cash deposit`; Q25 is an unrelated ordinary question. At `src/parser/core.js:639–657`, `validEnd` recognizes the prefix `in the table` and commits `25` to `safeEnd` without considering the rest of the clause. The package base allocates no targets. Both `19392ac` and `ed14323` allocate `[20,21,22,25]`; `ed14323` does so in the core, exported helper, and all three real Loads. `missing=[]` because Q25 exists; both bookmarklets flag Q25. Q19 still has all five correct fields with no warnings, and the stimulus UI defaults to `20, 21, 22, 25` and reports `Ready` after a real PNG Attach.

**Closure:** On exact `V10`, keep the one marker and complete literal intro, clean Q19 stem/A–D with `flags=[]`, `nums=[20,21,22]`, `missing=[]` on queue-level paths, and only Q20–Q22 flagged. Stimulus must default to `20-22` and the PNG Attach at that default must report `Ready`. Preserve `V9`, `V9-ctrl`, `V6`, and `V6-ctrl`. **Required evidence:** failing-first whole-paste regression on `ed14323`, a permanent whole-paste assertion, real manual/key/stimulus Loads including the unchanged-default Attach on `V10`, and the PC04 baseline/build checks. **Non-goals:** arbitrary monetary or prose grammar, extraction from a textual table, edits to the parsed intro text, user-edited plan ranges, uploads, or changes to save/storage policy.

### BLOCK-11 — `in the same section` silently drops a real list member

**Rule violated:** `docs/DECISIONS.md:1897–1900` says a standalone paired marker with a qualifying ranged intro “uses the intro's question range even when there is no table evidence.” The package's frozen grammar at `pc-04-marker-range.md:78–80` includes comma lists, and `docs/SPEC.md:435–436` locates targets in the adjacent `questions ...` range clause. This is a material regression introduced by the fix: the same comma reference and locator meaning as the accepted control lose a valid image destination.

**Exact defect (V11):** `Use the diagram below to answer questions 20 to 22, 25 in the same section.` The sentence is one instruction; `25` is the last question reference, and `in the same section` locates it within the same paste. The comparator `V11-ctrl` ends `25 in this section.` and means the same thing. Both yield `[20,21,22,25]` on `19392ac`; on `ed14323` only the comparator does. In `src/parser/core.js:650–657` the changed branch no longer recognizes `in the same section` as a locator: `same` matches neither a permitted modifier nor a location noun, so `safeEnd` remains at 22. The core, exported helper, and all three real Loads give `[20,21,22]` for `V11`, with the full intro retained and no Q19 field or flag change. Both bookmarklets omit Q25's image flag; the real stimulus plan incorrectly looks complete (`20-22`, `Ready` after PNG Attach).

**Closure:** On exact `V11` and `V11-ctrl`, return one marker with the whole literal intro, `nums=[20,21,22,25]`, `missing=[]` on queue-level paths, and exactly those four flags. Keep Q19's five clean fields and `flags=[]`; stimulus must default to `20, 21, 22, 25` and accept Attach at that default. Preserve `V9`, `V9-ctrl`, `V6`, and `V6-ctrl`. **Required evidence:** failing-first whole-paste regression on `ed14323`, permanent direct regressions for both exact locators, real manual/key/stimulus Loads including the default Attach on `V11`, and the baseline/build checks. **Non-goals:** additional section wording, new marker/range syntax, any parser inference across sections or pastes, user-edited ranges, uploads, or changes to product policy.

### Non-blocking notes

- **`NOTE-1` (prior, deferred):** `docs/INVARIANTS.md:156` still says a block “is valid only when it stays inside one question chunk and has an intro plus table evidence, one strong table row, or two weak table rows.” The controlling no-table exception is explicit in `docs/DECISIONS.md:1897–1905`, `docs/SPEC.md:426–434`, and `INV-157` (`docs/INVARIANTS.md:226`), and the no-table raw and frozen V9 paths work. The invariant wording discrepancy does not invalidate that implementation.
- **`NOTE-2` (new):** `pc-04-marker-range.md:270–276` reports `139,035` / `79,208 B stripped` without defining the stripping. Independently measured without the `javascript:` prefix and final LF: 139,105 / 79,259 B; without the entire wrapper and LF: 139,034 / 79,188 B. Label and reconcile the handoff measurements. This is documentation-only: the actual bookmark URL bytes (139,116 / 79,270 before LF), full artifact hashes, and builder output all match.

## Production data flow and staging evidence

`splitRegions` routes instructions or passes the qualifying line into the source question chunk (`src/parser/core.js:213–287,330–335`). `parseQuestion` calls `extractStimuli` before option matching (`:1012–1018`); the marker scanner records adjacency and `stimulusMarkerRange` derives `nums` from the accepted slice (`:807–831,845–904`). `applyStimulusFlags` clears old flags and resolves those numbers against this queue (`:963–995`); it cannot tell an unrelated in-paste number from a valid reference or recover an omitted reference. The manual helper executes `parseAll`/`fillForm` and saves the source metadata (`ocr_helper.js:16–25,55–113`). The key Load calls `core.parsePaste` and replaces the persisted queue (`src/bookmarklets/key/entry.js:491–535`); the stimulus Load uses the shared split/parse/flag functions and clears any old in-memory attachment plan on replacement (`src/ui/ui.js:1157–1228`). The stimulus plan uses `stim.nums` for its default, then checks membership in the queue, not correctness of the underlying reference (`ui.js:243–288,309–385`). No PHP save or storage contract changed. The highest-risk combination exercised was clean native fields plus a wrong range that the Attach UI nevertheless shows as ready.

Chromium `157.0.8103.38` used the actual authenticated Add form at `127.0.0.1:3024`, started with `OCR_PHONE_STAGING_TMP=/data/data/com.termux/files/usr/tmp/opencode/pc04-rereview3-ed14323 OCR_PHONE_STAGING_HOST=127.0.0.1 OCR_PHONE_STAGING_PORT=3024 bash tools/start-phone-staging.sh` and `chromium-cdp start opencode1`. `cmp` matched the copied PHP/helper, and `curl --fail --silent --show-error <loopback asset> | sha256sum` matched the served core, helper and both artifacts to the checked bytes. Playwright checked the token order (`core.js?v=2.5.6`, then `ocr_helper.js?v=2.4.9`), their `200` responses and core version, and clicked actual `javascript:` anchors made from the hash-checked artifacts. It drove the real Load, Skip, Clear/Show and Attach controls, with no copied parser or plan logic. Request routing allowed only local GETs and one local login POST. No uncaught page errors or question/media POST attempts; the PHP log independently shows just the login POST. A read-only SQLite query still showed only seed `#101`, with no image path. Staging PID `16317` and Chromium were stopped.

**Enumerated browser cases (each on manual, key and stimulus: 33 Loads):**

| Case | Core/helper and all three Loads: observed source range | Stimulus plan (PNG Attach where exercised) |
|---|---|---|
| `V9` | `[20,21,22]` | `20-22` → `Ready` |
| `V9-ctrl` | `[20,21,22,25]` | `20, 21, 22, 25` → `Ready`, re-Attach after reload also `Ready` |
| `V6` | `[20,21,22]` | `20-22` |
| `V6-ctrl` | `[20,22]` | `20, 22` |
| `V10` | `[20,21,22,25]` (expected `[20,21,22]`) | `20, 21, 22, 25` → `Ready` at the wrong range |
| `V11` | `[20,21,22]` (expected `[20,21,22,25]`) | `20-22` → `Ready` at the wrong range |
| `V11-ctrl` | `[20,21,22,25]` | `20, 21, 22, 25` |
| `adv-bank` (`25 in the bank was deposited.`) | `[20,21,22]` | `20-22` |
| `P1` | `[21]` | `21` |
| `P2` | `[20,22]` | `20, 22` |
| Supplied raw sample | `[20,21,22]` | `20-22` |

Each browser Load checked Q19's five native and queued values, native required-field state, flags, current item and queue numbers, source and literal marker/intro, target flags and `missing` as applicable, one panel, answer-radio state, and untouched Constant Text. The raw fixture hash was checked in Chromium. Manual used the question portion, with no selected radio; the bookmarklets used the whole keyed paste and selected A at Q19 after Skip. This does not re-test the pre-existing manual key boundary from [re-review 1, line 96](parser-convergence-2026-11-phase-4-re-review.md#production-paths-and-disposable-browser-evidence).

| Action | Idle / normal | Mid-operation | After failure | Persisted / prior context |
|---|---|---|---|---|
| Activate / reload | **Executed:** normal manual mount and real anchor activations. | **Inspected:** mounting and parse are synchronous. Reinjection during a pending save was executed only by the unchanged key artifact suite. | **Executed:** after empty-paste rejection the same panel handled a valid Load; no matched-asset activation failure. | **Executed:** repeated key activation retains the manual `V9-ctrl` queue and one panel. Reloading the key queue into manual then activating stimulus restores its sparse range, with no image. |
| Load / replace / Skip | **Executed:** 33 enumerated Loads, including raw Skip to Q19, repeated Clear for manual/key and Show→Load for stimulus. | **Inspected:** no second parse can interleave a synchronous Load; the stimulus busy-save guard remains. The unchanged UI harness covers replacing a queue during a dry run. | **Executed:** all three reject empty paste and accept the next valid paste. Stimulus failure over previously attached `V9` retains queue, fields and ready range. | **Executed:** new `V9` replaces the well-formed old sparse `V9-ctrl` range despite overlapping question numbers; a subsequent valid `V6` replaces attached `V9`, with `No image`. |
| Review defaults / Attach | **Executed:** `V9`, `V10`, `V11`, `V9-ctrl` real PNG Attach; each preserves the persisted queue. Manual/key have no Attach. | **Inspected:** Attach and membership validation are synchronous; actual network upload is outside this closure. | **Executed:** Attach with no file leaves the plan at `No image`; retry with PNG gives `Ready`. | **Executed:** reactivation after reload keeps the `V9-ctrl` range but drops the file; re-Attach succeeds. |

Deferred/unverified in this round: native question saves through PRG and actual bookmarklet saves/media upload in Chromium, the MySQL `tests/cbt-staging.php` harness, bookmark-manager installation in Brave/Android, and live execution. They are outside the V9 evidence contract and PC04 has no separate external gate. The real rendered Add form and disposable SQLite evidence establish the Load/Attach behavior, not a claim about target database writes.

## Baseline commands and provenance

| Command | Candidate result |
|---|---|
| `node tests/runner.js`; `node tests/unit.js` | 74 pass, 0 fail/pending; 198 pass, 0 fail |
| `node tests/ocr-helper.js`; `node tests/key-bookmarklet.js`; `node tests/single-source.js` | 43 / 42 / 15 pass. The key suite's rebuild ran in a disposable `git archive HEAD` export; `cmp` matched the rebuilt artifact to the tracked file. |
| `node tests/underline-toolbar.js`; `node tests/question-preview.js`; `node tests/math-tool.js`; `node tests/render-markup.js`; `node tools/extract-bank.js --check` | 10 / 7 / 26 / 69 pass; source, anchors, counts and 7 bank hashes match. |
| `php tests/php-render.php`; `php tests/admin-question-store.php`; `php tests/cbt-question-order.php`; `php -l` for each `deployed/*.php` | 33 / 8 / 14 pass and 7/7 lint on both PHP CLI `8.5.12` and `$HOME/tmp/php83-review/php` (`8.3.32`). |
| `node src/build/build.js --check`; `node src/bookmarklets/key/build.js --check`; `wc -l -c` on both artifacts; `node --check` on each after removing `javascript:` | Current, syntax-valid, one LF-terminated line each, no `%HH` (Node `v26.13.0`). |
| `git diff --check 9afe4f8 HEAD` | Clean (Git `2.56.0`). |

- **Fixture provenance:** the `f3f5957:scratch-file.txt` lines 107–144 and 326–331 exactly match the Q18–Q23 input and six key rows (`18:D, 19:A, 20:C, 21:B, 22:A, 23:A`), with only the joining blank and `Answer Key` heading supplied. `f3f5957:docs/NEW_EDGE_CASES.txt:29–70` gives the literal Q19.D/intro and the three target expectations independently. Input 46 L / 831 B / `a7fac4014c4c…`; JSON 99 L / 2,939 B / `f861eddabe52…`, `doc`/`CONFIRMED`. The asserted stems/choices and key are transcribed from the source. Git does not establish edit order; the independent base execution demonstrates the expectations catch the original defect.
- **History replay:** read `git show <ref>:src/parser/core.js` and compiled it as a CommonJS `Module` at its canonical pathname. Placed it in `require.cache` for unchanged candidate `tests/runner.js` (`9afe4f8` core) and candidate unit/manual tests (`19392ac` core). Independent direct comparisons compiled matching exported `ocr_helper.js` against its revision's core. The probes assert literal outputs or preservation against a real base module, with no recreated parser behavior.
- **Prior-input parity:** `git ls-tree -r --name-only 9afe4f8 -- fixtures/inputs` enumerated the IDs below (`.txt` suffix). For each ID the input bytes, full `parsePaste` result except the intentional `version` change, and full exported `ocr_helper.parseAll` output matched `9afe4f8` and `ed14323`.

<details>
<summary>73 matching prior inputs</summary>

```text
anomaly-block1, anomaly-block2
bank-2021, bank-2022, bank-2023, bank-2024, bank-2025, bank-2026, bank-pre-2026
claude-s1-joseph-blank-c, claude-s2-father-of-faith-e-dotted, claude-s3-father-of-faith-e-dotless,
claude-s4-father-of-faith-four-options, claude-s5-option-text-next-line
format-paragraph-stem, gap-q10-missing
header-crs-jamb-utme, header-crs-post-utme, header-crs-ssce-periods, header-crs-ssce,
header-crs-utme, header-year-1994
new-edge-dotless-c, new-edge-duplicate-labels, new-edge-initials-q46, new-edge-shared-stimulus,
new-edge-single-initials, new-edge-slash-all-options, new-edge-slash-option-a,
new-edge-year-abbreviation-ad, new-edge-year-abbreviation
qwen1-sample1-quotes-before-capitals, qwen1-sample2-crk-header, qwen1-sample3-five-options,
qwen1-sample4-dotless-option-a, qwen1-sample5-question-starting-a
qwen2-s2-article-vs-option, qwen2-s4-article-start, qwen2-s4-dotless-newline-a,
qwen2-s4-dotted-newline-b, qwen2-s4-dotted-start, qwen2-s4-inline-block,
qwen2-s4-vertical-block, qwen2-s5-answer-key
real-ec20, real-ec20b
region-footer-instruction, region-lowercase-stems, region-midstream-heading,
region-midstream-orphan, region-orphan-number, region-preamble-paragraphs
sample-cloze-left-drift, sample-cloze-long-cell, sample-cloze-mismatch, sample-cloze-missing-column,
sample-cloze-mixed, sample-cloze-not-cloze, sample-cloze-section6, sample-cloze-tabs,
sample-comprehension-ambiguous, sample-comprehension-incomplete, sample-comprehension-key,
sample-comprehension-multi, sample-comprehension-passage3, sample-underline-stems, sample-uppercase-paren-q51
spaced-initialism-ad-stem, spaced-initialism-bc-stem, spaced-initialism-cif-stem,
spaced-initialism-inner-option, spaced-initialism-wrapped
stimulus-marker-placements
```

</details>

## Externalize-first verification

`git diff --numstat 9afe4f8 HEAD` and LF counts, UTF-8 bytes and SHA-256 calculated from `git show <ref>:<path>` reproduced the four readable source rows below. `git diff --no-index --numstat` measured `+96/-85` for `deployed/admin_questions.php` against `archive/live-sources/admin_questions-2026-10-31.php`, and `+51/-45` for `ocr_helper.js` against `archive/live-sources/ocr_helper.js`. These are the changed live-origin files; neither exceeds the 100-addition cap (`docs/plan/README.md:308–317`). No Gate 1 exception applies, and no production module is added. The fix-3 source diff is only the `validEnd` line in the canonical parser; the other three package source diffs are narrow version wiring.

| Production source | Base LF / B / SHA-256 prefix | Cumulative `+/-` | Candidate LF / B / SHA-256 prefix | Responsibility, inclusion and direct evidence |
|---|---|---|---|---|
| `src/parser/core.js` | 1,855 / 65,965 / `28172dfafcb3` | `+130/-19` | 1,966 / 70,519 / `d17dd8ae5851` | Pure parser `2.5.6`, site-root `src/` and directly inlined by both builders. Runner, unit, actual helper and artifact parser tests, and all three served Loads execute it. |
| `ocr_helper.js` | 127 / 4,917 / `86497f4d0686` | `+1/-1` | 127 / 4,917 / `5cdba5c3b7e9` | Thin manual adapter, site root; exact core version pin. Real exported `parseAll`, actual script's Load in `tests/ocr-helper.js`, and the served form were executed. |
| `src/bookmarklets/key/entry.js` | 596 / 24,700 / `34e78c3e1e89` | `+1/-1` | 596 / 24,700 / `ddbd8aebd10e` | Key-only flow and version pin, inlined only in the key artifact. `tests/key-bookmarklet.js` and real browser Load execute that artifact. |
| `deployed/admin_questions.php` | 1,057 / 62,877 / `388d38532c83` | `+2/-2` | 1,057 / 62,877 / `1e193d34f9d3` | Native Add/Edit page, site root. Lines 1050–1051 load `core.js?v=2.5.6` before `ocr_helper.js?v=2.4.9`. Real authenticated PHP page and served URLs verified; lint on both runtimes. Diff is only the script tokens. |

- **Deployment manifest:** checked LF, bytes and full SHA-256 against `docs/DEPLOYMENT.md:59–80` per row: `deployed/{admin_questions,admin_question_store,cbt,cbt_question_order,subject_display,answer_details,render}.php`, `ocr_helper.js`, `src/parser/core.js`, `src/underline-toolbar.js`, `src/question-preview.{js,css}`, `src/math-tool.{js,css}`, `src/owner-tool/render.js`, and `deployed/sql/{01-constant-text.sql,02-constant-text-rollback.sql,03-english-lexis-structure.sql,04-english-lexis-structure-rollback.sql,README.md}`. Manifest and served tokens agree. No diff to server transaction/SQL, either builder, the Node facade, key boot, or stimulus UI/autosave source.
- **Tests and data:** the only fixture additions are `fixtures/inputs/new-edge-image-intro-marker.txt` (`+46/-0`) and `fixtures/expected/new-edge-image-intro-marker.json` (`+99/-0`). Cumulative test changes: `tests/unit.js +383/-1`, `tests/ocr-helper.js +99/-1`, `tests/single-source.js +14/-2`, `tests/key-bookmarklet.js +3/-3` (pins). Fix 3 adds the two V9 cases without removing earlier vector assertions. `tests/single-source.js:173–225` executes the inlined parser code from each artifact in a no-form VM. Its parity inputs are `bank-2021`, the CIF and wrapped spaced-initialism fixtures, raw, same-line and wrapped `John F.`, inline `A. D.`, `C. I. F.` before A, the prefix-noise `Figure 2` intro, and `S1`, `S5`, `N2`, `A1`, `R1`, `G1`, `V6`, `V7`, `V8-close`, `V9`, `V9-ctrl`-shaped inputs in that order. The suite's 15 total checks are not a count of browser loads; the browser evidence above drives the actual controls.
- **Excluded generated:** `src/bookmarklet.js`, `+1/-1`, 1 L, 134,948 → 139,117 B, `3a815ab6168d…`; `src/bookmarklets/key/bookmarklet.js`, `+1/-1`, 1 L, 75,102 → 79,271 B, `ae9a96ed1d9c…`. Both match the checked builds and served bytes. `src/bookmarklet.min.js` is absent/untracked.
- **Excluded supplied/archived:** root `admin_questions.php`, `answer_details.php`, `cbt.php`, and `cbt_practice.php` byte-match the respective dated snapshots. No archive diff, including `archive/live-sources/{ANOMALIES.txt,IMPROVISED C.docx.txt,admin_questions-2026-10-31.php,admin_questions-stale-2026-10-23.html,admin_questions.html,admin_questions.php,answer_details-2026-11-02.php,cbt-2026-10-31.php,cbt_practice-2026-10-31.php,ocr_helper-2026-11-01.js,ocr_helper.js,ocr_helper_deployed.js,subjects-select-2026-10-23.html}`. The two `f3f5957` source files and three previous PC04 review records were reference evidence. No unrelated working-tree edits were present before review.

**Review status and next action:** Re-review 3 complete. `BLOCK-9` is closed; `BLOCK-10` and `BLOCK-11` are open in round 1. PC04 is not commit/merge-ready and PC05 remains gated. This record is uncommitted. A separate explicit owner request can publish just this record onto the PC04 branch before the VM fix session uses the contracts above.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 4 BLOCK-10 BLOCK-11
