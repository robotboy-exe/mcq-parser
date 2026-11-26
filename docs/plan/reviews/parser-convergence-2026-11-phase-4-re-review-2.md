# Parser Convergence 2026-11 Phase 4 Re-Review 2

- **Date / reviewer:** 2026-11-26 / OpenCode, independent review.
- **Package:** PC04, [Marker-Adjacent Range Extraction](../parser-convergence/pc-04-marker-range.md). Closure-focused, round 2 for `BLOCK-6`, `BLOCK-7`, and `BLOCK-8`. Frozen contracts: [re-review 1](parser-convergence-2026-11-phase-4-re-review.md), lines 98–124; fix handoff: `pc-04-marker-range.md:207–248`. `In progress` is the review-pending status of the handed-off implementation; there is no other external gate.
- **Candidate:** `19392ac244af529db83f3d89533d5330878a2f96`, clean dedicated review worktree at the exact tip verified by `git ls-remote --exit-code origin refs/heads/scratch/pc04-marker-range refs/heads/scratch/parser-convergence-cycle`. The prior product `7b66bf18498d7fd80bfbfd74e8f48c5a34cf515e` and candidate parent `e874a76` differ only by the first re-review record. The three substantive code changes in this fix are in `src/parser/core.js`.
- **Package base:** `9afe4f806e1254ecf74c93f13f5ee73d1c4fd497` is independently established by the remote cycle tip, `git merge-base HEAD origin/scratch/parser-convergence-cycle`, and `git rev-list --parents -1 b2cb897` (the original PC04 implementation's sole parent). `git diff --exit-code 69934bf 9afe4f8 -- src ocr_helper.js deployed fixtures tests` confirms the base carries the settled PC03 behavior and tests.

## Verdict and frozen dispositions

**BLOCK — not ready to mark done or merge.** The three requested findings close on their frozen checklists. A separate `BLOCK-9` is open in its first review round: a different monetary tail is still accepted as a question reference, violating PC04's explicit false-positive acceptance row. `BLOCK-1`–`BLOCK-5` remain closed; prior `NOTE-1` remains non-blocking.

| Finding | Independent disposition |
|---|---|
| `BLOCK-6` | **Closed.** Exact `V6` on `7b66bf1` gives `[20,21,22,25]` and flags Q25. On `19392ac` all five Q19 fields and `flags=[]` are unchanged; one marker retains the entire literal intro, `nums=[20,21,22]`, `missing=[]` on the queue-level paths, and only Q20–Q22 are flagged. The literal `20, 22 in the section below.` control still gives `[20,22]`. `N1`–`N5`, `B6`, `P1`, and `P2` pass. `tests/unit.js:800–825` permanently asserts the whole paste and positive control, and the manual suite guards the Load path. All three real Loads give the expected source range; the stimulus default `20-22` accepts a PNG as `Ready`. |
| `BLOCK-7` | **Closed.** Both `V7` and `V7-r` put the instruction into D and lose the governing region on `7b66bf1`. On the candidate, Q19 stem/A–C are intact, D is empty with only `option D missing`, there is no stimulus, and the exact instruction is a single region from Q20 to Q26 with Q20's literal `sectionInstruction`. The two rubric lines are absent from every native question/option field in the real loaded queues. On each form the required D input registers `valueMissing`. `R1/R2` and the raw control pass. Both `S4` and its unquoted counterpart keep the wrapped D answer verbatim with the existing advisory flag and an empty-range, empty-text marker. The whole-paste assertions for `V7`, `V7-r`, and the unquoted wrapped control are at `tests/unit.js:827–856`; both blank-D and both wrapped cases were replayed on all three real Load paths. |
| `BLOCK-8` | **Closed.** Both malformed forms previously stripped `[[image: 21]]` from D and invented `[21]`. Now both remain literal in D and create neither stimulus, `needsImage`, nor a plan row. The paired standalone control keeps the exact intro in metadata and targets `[21]`; the paired inline control removes only its marker and targets `[21]`, both with clean native fields. `G1`–`G4`, `P1/P2`, the paired and non-marker controls, and the raw fixture still pass. `tests/unit.js:858–885` permanently runs both bad and both good vectors; all four also passed the actual Loads. The mixed same-line probe `H + ' [[[image: 25]] and [[image: 21]]'` preserves the malformed first token and allocates only Q21. |

## Package acceptance (`pc-04-marker-range.md:37–47`)

| Row | Independently observed result |
|---|---|
| Failing first | **Pass.** Candidate runner with the `9afe4f8` core reports 73 pass / 1 fail, only the P20 fixture, with Q19.D holding the intro, a structural-option flag, and no range or targets. The candidate fixture passes its 38 assertions. Candidate unit tests with the `7b66bf1` core give 194 pass / 3 fail at `V6 nums`, `V7 Q19 options`, and `V8-close no marker stimulus`; the manual Load suite exits 1 on `V6`'s extra 25. Independent literal replays also reproduce `V7-r` and `V8-open` on the old product. |
| Range | **Pass on the supplied paste and the explicit precedence controls.** Raw Q20–Q22 only; `P1=[image: 21]` gives `[21]`, `P2=[[image: 20, 22]]` gives `[20,22]`. The intro-only references `20, 22.` and `Q20-Q22.` still yield `[20,22]` and `[20,21,22]`. |
| False positives | **Fail: `BLOCK-9`.** Named dates, grouped/decimal amounts, prefix noise, option/stem ownership, and bad-marker controls pass on the checked vectors. A new admitted `in the …` monetary tail flags unrelated, existing Q25 and defaults the stimulus Attach range to include it. |
| Field contract | **Pass on the named checks.** Exact Q19 stem/A–D on raw and the paired positives; `V7/V7-r` stay internal, `R1/R2` do not change a populated D, and `S1`–`S5` retain owned text. Both independently replayed paragraph probes (one real blank line vs one ordinary wrap on either side of the removed intro/marker) preserve the expected `\n\n` vs single space. |
| Controls | **Pass.** The 73 prior inputs below match both base parsing paths. The direct controls also replayed both directions `A1/A2`, explicit `A3`, ordinary `[missing text]` and `[diagram]`, a single-question intro, a four-digit endpoint, an intro separated by prose without a table, and a markerless `Balance: 500` table. They preserve the respective empty/explicit ranges, ordinary text, or legacy `intro` stimulus. The case-insensitive spaced bare `d )` before the `V7` rubric and curly-quoted wrapped `S4` also pass. |
| Surfaces | **Production paths exercised.** Manual reports the source metadata without setting queue-level `needsImage`; both bookmarklets flag the queue targets. Exact native fields, ranges and plan states pass for the named closures. All three reproduce the new wrong source range; only the stimulus product offers Attach. |
| Safety and build | **Pass.** Both builds, the full Node/PHP baseline, deployment manifest and PHP lint pass. Browser evidence is from loopback disposable SQLite; the only POSTs were staging logins. No deploy or branch movement. |

## BLOCK-9 — A monetary tail beginning `in the` still becomes an image target

**Rule violated:** `docs/plan/parser-convergence/pc-04-marker-range.md:43`: “Dates, years, amounts, account numbers, figure labels, option lines, and following questions never become targets.” `docs/SPEC.md:441–445` also explicitly requires stopping before comma-followed prose tails and excluding amounts outside the range. This is a directly unmet acceptance row on an approved standalone-marker paste, not an expansion of `BLOCK-6`'s frozen contract.

**Exact vector and preconditions.** Using `H` and the ordinary Q20–Q26 suffix defined in the [original review](parser-convergence-2026-11-phase-4.md#reproduction-vectors-and-findings), load `H`, a blank line, `Use the diagram below to answer questions 20 to 22, 25 in the local currency was deposited.`, and a standalone `[image]` immediately below that intro, then a blank line and the suffix. No explicit marker range or table. Q25 exists and is an unrelated ordinary question. The comparator `V9-ctrl` changes only the end of that sentence to `25 in the section below.`; there, Q25 genuinely is the final list member.

**Reproduction and cause.** This is `V9-adversarial` in the browser replay. `stimulusIntroRangeText` consumes the comma token and `25` at `src/parser/core.js:632–649`; the narrowed `validEnd` still accepts ` in the ` without checking whether the next words end the question reference or describe an amount (`:650–655`). `stimulusMarkerRange` uses the resulting span (`:807–831`). The candidate gives `nums=[20,21,22,25]` in the core and exported helper and in all three real Loads; Q19 fields stay `Which statement is correct? / one / two / three / four` with no flags, and the whole intro is in the marker. Both bookmarklets flag Q25, `missing=[]`, because the real Q25 is in the queue. The stimulus range defaults to `20, 21, 22, 25` and a real PNG Attach reports `Ready` at that wrong range. `V9-ctrl` gives the same range correctly. Historical `b2cb897` and `7b66bf1` also reproduce the wrong V9 range; package base `9afe4f8` gives no targets on this paste, so it does not allocate Q25.

```js
const core = require('./src/parser/core.js');
const helper = require('./ocr_helper.js');
const options = 'A. one\nB. two\nC. three\nD. four';
const tail = Array.from({length: 7}, (_, i) =>
  `${20 + i}. Which of the following is correct here?\n${options}`).join('\n\n');
for (const end of ['in the local currency was deposited.', 'in the section below.']) {
  const text = `19. Which statement is correct?\n${options}\n\n` +
    `Use the diagram below to answer questions 20 to 22, 25 ${end}\n[image]\n\n${tail}`;
  const result = core.parsePaste(text);
  console.log(end, result.items[0].stimuli[0].nums,
    result.items.filter(q => q.needsImage).map(q => q.num),
    helper.parseAll(text)[0].stimuli[0].nums);
}
```

**Finite closure contract.** On exact `V9`, keep one marker stimulus with the complete literal intro, `nums=[20,21,22]`, `missing=[]` on queue-level paths, clean Q19 stem/A–D and `flags=[]`, only Q20–Q22 flagged, and a `20-22` stimulus default that accepts Attach as `Ready`. On exact `V9-ctrl` retain `[20,21,22,25]` and the corresponding four target flags; keep the frozen `V6` and `V6-ctrl` outcomes. **Required evidence:** failing-first whole-paste assertion on `19392ac`, permanent direct parser regressions for `V9`/`V9-ctrl`, real manual/key/stimulus Loads for `V9` with stimulus Attach at its default, and the PC04 baseline/build checks. **Non-goals:** new grammar for arbitrary prose, removal of the full intro from metadata, user-edited plan ranges, network image upload, or any product/save/storage policy change.

### Existing `NOTE-1` (non-blocking)

The original note remains deferred: `docs/INVARIANTS.md:156` still says a block “is valid only when it stays inside one question chunk and has an intro plus table evidence, one strong table row, or two weak table rows.” The controlling no-table exception remains explicit at `docs/DECISIONS.md:1897–1905`, `docs/SPEC.md:426–434`, and `INV-157` (`docs/INVARIANTS.md:226`). The discrepancy is documentation drift; the no-table extraction itself works on the raw vector and named positives. `BLOCK-9` separately records a range error. No new `FIX` or `NOTE`.

## Evidence and production paths

- Provenance: compared `git show f3f5957:scratch-file.txt` lines 107–144 and 326–331 to the exact input splice. The fixture adds the joining blank line and `Answer Key` heading; the six keyed rows are `18:D, 19:A, 20:C, 21:B, 22:A, 23:A`. `git show f3f5957:docs/NEW_EDGE_CASES.txt` lines 29–70 establishes the literal Q19.D, intro and targets independently. The input is 46 L / 831 B / `a7fac4014c4c…`; expected JSON is 99 L / 2,939 B / `f861eddabe52…`, `doc` / `CONFIRMED`. The Q19 choices and key in the assertions match the source. No existing expectation changed. Git does not establish authoring order; the independent base run establishes that the transcribed expectation catches the old failure.
- Replay method: loaded historical `git show <ref>:src/parser/core.js` bytes into a CommonJS `Module` at its canonical pathname and injected it into `require.cache` for the unchanged candidate runner/unit/manual tests; direct history probes compiled each revision's matching `ocr_helper.js` against that core. Independent expected values are the frozen literals, ground truth from the raw paste, or base values where preservation is required. These checks call the real modules; they do not reimplement split, range, or Load behavior.
- Fix inspection (`git diff e874a76 HEAD -- src/parser/core.js`): ordinary instructions following an option now go to `pending` unless the line is a quoted wrapped choice after a bare label or satisfies `stimulusIntroLine` (`:268–273`). This leaves the quoted `S4` in the option; `stimulusTransparentLine` separately protects an unquoted ranged intro directly after a bare label (`:700–707`). The narrowed terminator at `:650–655` rolls `V6` back to its saved prefix while still admitting the false `V9` tail. The inline loop at `:855–867` skips an extra adjacent opening or closing bracket and continues scanning, so it still finds the valid second token in `V8-mixed`.
- Flow traced: `splitRegions` routes instructions to the next question before the chunk is built (`core.js:213–287,330–335`); `parseQuestion` calls extraction before option matching and carries `sectionInstruction` as metadata (`:1012–1018,1159`). Paired-marker recognition decides whether extraction starts (`:845–879`); range data then flows to `applyStimulusFlags` (`:963–995`), which checks existing question numbers but cannot determine whether a number came from a real reference. Manual Load uses the exact core through `parseAll` and writes `{items,i}` and form values (`ocr_helper.js:16–25,55–113`). Key Load uses `core.parsePaste` and stores the queue, key and per-tab paste (`src/bookmarklets/key/entry.js:491–535`); stimulus Load composes the same canonical split/parse/flag functions and replaces its batch (`src/ui/ui.js:1157–1228`). `renderImagePlan` uses `stim.nums` before an image is assigned; Attach validates queue membership and stores the image in memory (`ui.js:243–288,309–385`). Thus an unrelated in-paste number can become an actionable destination without any field or missing-range warning.
- Browser: `OCR_PHONE_STAGING_TMP=/data/data/com.termux/files/usr/tmp/opencode/pc04-rereview2-19392ac OCR_PHONE_STAGING_HOST=127.0.0.1 OCR_PHONE_STAGING_PORT=3024 bash tools/start-phone-staging.sh`; `chromium-cdp start opencode1` (Headless Chrome `157.0.8103.38`). `cmp` matched the copied PHP to the candidate and `curl --fail --silent <loopback asset> | sha256sum` matched core, helper and both artifacts. Authenticated through the real local admin form, checked the versioned script tag order, and clicked anchors containing the hash-checked `javascript:` builds. After login, browser request routing permitted loopback GET only. Ran the real buttons against the native Add form, reading queue state and plan/field DOM; no mocked parser, Load handler, or attachment plan. Read-only SQLite SELECT after probing still showed only original seed ID `101`. Staging PID `31230` and Chromium were stopped.
- **Enumerated browser coverage:** each of manual, key, and stimulus ran `V6`, `V6-ctrl`, `V7`, `V7-r`, `S4`, `S4-unquoted`, `V8-close`, `V8-open`, `V8-standalone`, `V8-inline`, `V8-mixed`, `N1`, `N2`, `V9-ctrl`, and `raw` successfully (45 case/surface checks). Each also reproduced `V9-adversarial` (3 more Loads), and each recovered from a rejected empty paste. Each of the 48 enumerated Loads checked all five Q19 fields, flags, question numbers, source marker/range, target flags as applicable, answer radio behavior, and untouched Constant Text; stimulus also checked detected plan row/default or its absence. The raw fixture SHA-256 was checked in Chromium. The manual product used its question portion, with no radio selected; both bookmarklets used the whole keyed paste and selected A at Q19 after Skip. This does not retest the separate pre-existing manual answer-key boundary documented in re-review 1, line 96. No uncaught page exceptions or question/media POSTs in these checks.

| Relevant action | Idle / normal | Mid-operation | After failure | Existing/persisted context |
|---|---|---|---|---|
| Activate / return to the Add form | **Executed:** manual boot and both exact anchor activations; one panel per product. | **Inspected:** Load and mounting are synchronous; re-entry cannot occur partway through a single parse. Pending Save/reinjection is exercised by the unchanged key artifact suite, not in the PC04 browser check. | **Executed:** further Loads after the empty-paste alert keep the panel usable; no activation failure on the matched assets. | **Executed:** reload with an attached `V6` stimulus batch reopened the manual panel on the same stored item and fields. Reactivating stimulus restored `20-22` with one panel and `No image`; re-attach succeeded. |
| Load / Skip / replace paste | **Executed:** 48 enumerated Loads, raw Skip to Q19, repeated Clear where required to re-open manual/key input, repeated Show/Load in stimulus. | **Inspected:** no second parse can interleave; stimulus Load returns early during saves via `busySaving`. The actual UI harness covers invalidating dry-run/live state on a replacement Load. No real in-flight question save in this closure. | **Executed:** all three got `No questions found in that text.`; the queue/fields (and existing stimulus plan where present) stayed intact, then a valid inline paste loaded `[21]`. | **Executed:** stimulus `V6` with `20-22` and a ready PNG → fresh `V8-close` with no plan/flags → paired-inline Load with `21` and `No image`. Question numbers overlap across batches. |
| Review fields / Attach at default | **Executed:** pre-submit field and required-D assertions on the named vectors. Real stimulus Attach reports `Ready` for `V6` and `N2` at `20-22` and for `V9` at the wrong `20, 21, 22, 25`; each Attach leaves the stored queue unchanged. | **Inspected:** Attach and its queue-membership check are synchronous. Manual/key have no image-plan controls. Actual upload/save is outside this closure. | **Inspected:** Attach without a file returns early (`ui.js:359–363`). **Executed in the UI harness:** Attach with an empty range stays `No image` (`tests/unit.js:2632–2639`). **Executed in Chromium:** a failed full Load leaves the active stimulus plan in place before valid retry. | **Executed:** reload drops the previous file without losing parsed range; new Load clears the prior attachment and derives the plan from the new queue. |

Highest-risk interactions were an unvalidated numeric suffix becoming the default ready attachment range despite clean fields, a blank option becoming non-empty through region ownership, and a bad standalone marker falling through to inline matching. This round verified the frozen paths to the real form and image-plan DOM. Native PRG writes (pre-submit evidence is sufficient for `BLOCK-7`), bookmarklet network saves/image uploads, MySQL `tests/cbt-staging.php`, bookmark-manager installation in Brave/Android, and production were not exercised. The prior re-review separately verified the now-fixed blank-D defect's original persistence on staging; there is no change to the server or save wiring in this fix.

### Baseline commands and prior-input parity

| Command | Candidate result |
|---|---|
| `node tests/runner.js`; `node tests/unit.js` | 74 pass, 0 fail/pending; 197 pass, 0 fail |
| `node tests/ocr-helper.js`; `node tests/key-bookmarklet.js`; `node tests/single-source.js` | 43 / 42 / 15 pass. The key determinism test rebuilds its artifact, so it ran in a disposable `git archive HEAD` export; `cmp` confirmed rebuilt bytes match the tracked artifact. |
| `node tests/underline-toolbar.js`; `node tests/question-preview.js`; `node tests/math-tool.js`; `node tests/render-markup.js` | 10 / 7 / 26 / 69 pass |
| `node tools/extract-bank.js --check` | Source, anchors, counts and 7 slice hashes match |
| `php tests/php-render.php`; `php tests/admin-question-store.php`; `php tests/cbt-question-order.php`; `php -l` on each `deployed/*.php` | 33 / 8 / 14 pass, 7/7 lint on both Termux PHP CLI `8.5.12` and `$HOME/tmp/php83-review/php` (`8.3.32`) |
| `node src/build/build.js --check`; `node src/bookmarklets/key/build.js --check`; `wc -l -c` on both; strip `javascript:` and pipe each to `node --check` | Both current and syntax-valid, one LF-terminated line each (138,957 / 79,111 B before final LF), no `%HH`; Node `v26.13.0`. |
| `git diff --check 9afe4f8 HEAD` | Clean (`git` 2.56.0). |

Enumerated `git ls-tree -r --name-only 9afe4f8 -- fixtures/inputs`. Each path below matched the base input bytes, the complete `parsePaste` result apart from `version`, and the complete exported manual `parseAll` result at `19392ac`:

<details>
<summary>73 prior input IDs (without .txt)</summary>

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

Independent LF/byte and SHA-256 measurements from exact `git show <ref>:<path>` blobs and `git diff --numstat 9afe4f8 HEAD` reproduce the four production-source rows. `git diff --name-only 9afe4f8 HEAD -- src deployed ocr_helper.js` lists only these four and the two generated artifacts below. The second fix adds no new module, server hook, or persistence behavior. The three non-core production diffs are only version alignment from the package base; the fix-2 delta changes only core source plus generated files, tests and docs. `git diff --no-index --numstat` gives `deployed/admin_questions.php` `+96/-85` against `archive/live-sources/admin_questions-2026-10-31.php` and `ocr_helper.js` `+51/-45` against `archive/live-sources/ocr_helper.js`. Both are within the 100-addition cap (`docs/plan/README.md:308–317`); no Gate 1 exception applies or is required.

| Production file | Base L / B / SHA-256 prefix | Cumulative `+/-` | Candidate L / B / SHA-256 prefix | Responsibility, inclusion, and direct evidence |
|---|---|---|---|---|
| `src/parser/core.js` | 1,855 / 65,965 / `28172dfafcb3` | `+130/-19` | 1,966 / 70,360 / `520463006172` | Canonical pure parser `2.5.6`; deployed `src/`, inlined by both builders. Runner/unit, exported manual adapter, both artifact cores, and all three real Loads use it. |
| `ocr_helper.js` | 127 / 4,917 / `86497f4d0686` | `+1/-1` | 127 / 4,917 / `5cdba5c3b7e9` | Manual adapter and version pin, site root; `tests/ocr-helper.js` executes exported `parseAll` and the actual script's Load, and Chromium drives the served Load. |
| `src/bookmarklets/key/entry.js` | 596 / 24,700 / `34e78c3e1e89` | `+1/-1` | 596 / 24,700 / `ddbd8aebd10e` | Key-only entry and core pin, included only in the key artifact; that real artifact runs in `tests/key-bookmarklet.js` and Chromium. |
| `deployed/admin_questions.php` | 1,057 / 62,877 / `388d38532c83` | `+2/-2` | 1,057 / 62,877 / `1e193d34f9d3` | Native Add/Edit entry, site root; `core.js?v=2.5.6` before `ocr_helper.js?v=2.4.9` (`:1050–1051`), no PHP logic diff. PHP lint on both runtimes, real staging PHP login and authenticated form, HTTP 200 for the specified asset URLs. |

- Manifest (`docs/DEPLOYMENT.md:59–80`): LF lines, bytes and full SHA-256 matched for `deployed/{admin_questions,admin_question_store,cbt,cbt_question_order,subject_display,answer_details,render}.php`, `ocr_helper.js`, `src/parser/core.js`, `src/underline-toolbar.js`, `src/question-preview.{js,css}`, `src/math-tool.{js,css}`, `src/owner-tool/render.js`; and the five ops rows `deployed/sql/{01-constant-text.sql,02-constant-text-rollback.sql,03-english-lexis-structure.sql,04-english-lexis-structure-rollback.sql,README.md}`. The page and runbook give the same tokens. UI, builders, facade, key boot, stimulus autosave source, SQL and PHP transaction code have no package diff.
- Tests and data from the original base: only `fixtures/inputs/new-edge-image-intro-marker.txt` (`+46/-0`) and `fixtures/expected/new-edge-image-intro-marker.json` (`+99/-0`) change fixture data; `tests/unit.js` `+355/-1`, `tests/ocr-helper.js` `+86/-1`, `tests/single-source.js` `+12/-2`, `tests/key-bookmarklet.js` `+3/-3` (version assertions). The manual harness's fix-2 checks at `tests/ocr-helper.js:728–752` drive the real Load script for `V6`, both `V7`s, unquoted `S4`, both bad `V8`s, and inline `V8`. This is form-harness evidence, supplemented by real Chromium above. `tests/single-source.js:173–224` executes the inlined code from each artifact in a no-form VM and compares full parser output: `bank-2021`, `spaced-initialism-cif-stem`, `spaced-initialism-wrapped`, raw, same-line and wrapped `John F.`, inline `A. D.`, `C. I. F.` before A, the noisy `Figure 2` prefix, and `S1`, `S5`, `N2`, `A1`, `R1`, `G1`, `V6`, `V7`, `V8-close`-shaped literals. Its 15-check total is not a count of browser interactions or parity inputs.
- Excluded generated: `src/bookmarklet.js` `+1/-1`, 1 L, 134,948 → 138,958 B, `58e30bd058fe…`; `src/bookmarklets/key/bookmarklet.js` `+1/-1`, 1 L, 75,102 → 79,112 B, `925a17060016…`. Both match checked builds and served bytes. `src/bookmarklet.min.js` is absent/untracked.
- Excluded supplied/archived: root `admin_questions.php`, `answer_details.php`, `cbt.php`, and `cbt_practice.php` byte-match their corresponding dated snapshots. `git diff --numstat 9afe4f8 HEAD -- archive` is empty, including `archive/live-sources/{ANOMALIES.txt,IMPROVISED C.docx.txt,admin_questions-2026-10-31.php,admin_questions-stale-2026-10-23.html,admin_questions.html,admin_questions.php,answer_details-2026-11-02.php,cbt-2026-10-31.php,cbt_practice-2026-10-31.php,ocr_helper-2026-11-01.js,ocr_helper.js,ocr_helper_deployed.js,subjects-select-2026-10-23.html}`. The `f3f5957` source evidence and two earlier PC04 review records were reference-only. No unrelated workspace edits were present before the review.

**Review status and next action:** Re-review 2 complete. `BLOCK-6`–`BLOCK-8` are closed and `BLOCK-9` is open in round 1; PC04 is not merge-ready and PC05 remains gated. This immutable record is uncommitted. A separate explicit owner request can publish only this record to the PC04 branch; the VM fix session then uses the exact `BLOCK-9` contract above.

NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 4 BLOCK-9
