# Workspace Setup

Status: Phases 1–8 complete. Workspace setup is finished; the final report is
below. The test harness runs (19 PASS, 0 FAIL, 0 PENDING). Phase 7 closed the
human-decision gaps and archived the live PHP/HTML/helper sources supplied after
Phase 6; parser behavior was unchanged, and the UI changes were the two decided
ones (force `is_active` on, stop handling `ocrSubmitted`).

## Directory Structure

```
project/
├── README.md                    # project overview and quick start (Phase 5)
├── archive/
│   ├── migration-docs/
│   │   └── analysis/            # per-source notes (Phase 2)
│   ├── trusted-variants/
│   │   └── analysis/            # per-source notes (Phase 2)
│   ├── live-sources/            # PHP/HTML/helper + OCR bank (Phase 7)
│   └── chat-exports/            # empty; no chat exports were supplied
├── src/
│   ├── parser/parser.js         # pure parsing logic
│   ├── ui/ui.js                 # DOM / form / storage / queue
│   ├── build/build.js           # bookmarklet assembler
│   └── bookmarklet.js           # generated combined output
├── fixtures/
│   ├── inputs/
│   └── expected/
├── tests/
│   └── runner.js                # fixture harness (Phase 6)
├── docs/
│   ├── BASELINE_COMPARISON.md   # Phase 2 version comparison
│   ├── EDGE_CASES.md            # Phase 3
│   ├── INVARIANTS.md            # Phase 3
│   ├── SPEC.md                  # Phase 5
│   ├── DECISIONS.md             # Phase 5
│   ├── AGENTS.md                # Phase 5
│   └── BUILD.md                 # Phase 5
└── WORKSPACE_SETUP.md
```

## Phase 1: Archive

No file was modified during Phase 1. Copies are byte-identical to the
originals (verified with `cmp`), and SHA-256 hashes are recorded below.

### Migration docs → `archive/migration-docs/`

| File | Size (bytes) | SHA-256 |
|---|---|---|
| claude-migration.md | 42397 | bfc54a094650d9ac91e7dd5f0319f614886aa628c0cad40e7654c318af85fbc8 |
| qwen-1-gaps.md | 3402 | 31c9e7273a82774eb848f2ac84d36aee284dedce0d499bad0925299afd591126 |
| qwen-1-gaps2.md | 3759 | 5e26421ce731d6c61eecbc729064ab433bc85382bedd120aeca6c40015ccdd21 |
| qwen-1-migration.md | 19530 | c769719619b33bde01e363c1bf0c19f284218ac6d2e4b824a83b4773ef866a7f |
| qwen-2-gaps.md | 4598 | ecbd1b5edc2555620d48112e0b7c80516e19d39fa90889748b4185df652d7690 |
| qwen-2-reconciled.md | 57209 | a4bcc9a95d6883a033a0e081e3010835c0cdedc5635e058096c749bdb1c6a2c5 |

### Trusted variants → `archive/trusted-variants/`

| File | Size (bytes) | SHA-256 |
|---|---|---|
| trusted-variant-A.js | 10318 | 59b2a7b9a7aa48c79b779f855bdc83252ec3138da8bb881b05d6141075d402fe |
| trusted-variant-B.js | 11066 | a75f5fefb585b399b64cdce9bb703f802695279f9555522c9359039b1f9bf367 |
| trusted-variant-C.js | 14325 | cda0fe17f294e76c46fde77fafa23e63289eeb2fa9c022ce0cd6d792183a1a64 |

### Known-issues docs

- `archive/trusted-variants/trusted-variant-A-KNOWN_ISSUES.md`
- `archive/trusted-variants/trusted-variant-B-KNOWN_ISSUES.md`
- `archive/trusted-variants/trusted-variant-C-KNOWN_ISSUES.md`

### Sources supplied after Phase 8

- `claude-gaps.md` — supplied in Phase 9; archived byte-identically at
  `archive/migration-docs/claude-gaps.md` (7287 bytes, sha256
  `6786358665cc851ae11f6c933fa1a41cda945af024f2f82e6d7f7e68817e7cad`).

### Sources Not Archived

- Chat exports — none supplied; `archive/chat-exports/` is empty.

### Live sources supplied in Phase 7 → `archive/live-sources/`

These were placed in the repo root after Phase 6 and archived byte-identically
during Phase 7:

| File | Size (bytes) | SHA-256 |
|---|---|---|
| admin_questions.php | 55694 | 3d25463196e7c038cf5fe852376d94d9b6adc12495db704eace6fa64e0fcd0d9 |
| admin_questions.html | 84225 | 72c49a9868b944cd0a07e1fbaa7afac521ed38e8644899790557452552295b83 |
| admin_questions-stale-2026-10-23.html | 76039 | 9874ec5d6c77f4e78340c4730627ba6492b020b7699e0d1ce068d4caa88d9580 |
| ocr_helper.js | 4991 | b9dfff72397ff8e87adae6dacb56187296d35d3e81fc3e0e64efad067f9b86ae |
| ocr_helper_deployed.js | 4979 | 9caff07490011a5850667b849b7e2ed41c3ac71ed4a0bfe94861b085d395cfa3 |
| IMPROVISED C.docx.txt | 35182 | e5a1f7ab6c688ff43c59bd66413963651fb945ea6625727ae46b2242ab1c9535 |
| subjects-select-2026-10-23.html | 2050 | 02d0ddd8e004c0027c5d22ffb7168739d734066a442df1465205eb1c5192db30 |

Evidence gained:

- `admin_questions.php` confirms the four-option/0–3 radio constraint, the
  1900–2100 year check, the category `id <= 10` query, the exact success text,
  and the session-flash + redirect (PRG) flow.
- `admin_questions.html` is the updated live page source supplied in Phase 7.
  It has 16 subjects including **CRS (id 14)** and **English (Oral) (id 12)**,
  alongside English Language (id 6), plus new subject/year filter forms. The
  question-entry form's ids, names, radio values, `is_active` checkbox, and
  success/error classes are unchanged, so the bookmarklet's selectors still
  match.
- `admin_questions-stale-2026-10-23.html` is the earlier snapshot; it lacks
  CRS/English (Oral) and is retained only as history. Do not use it as evidence
  for the current subject list.
- `subjects-select-2026-10-23.html` is the extracted current subject
  `<select>`. The parser matches option **text**, not IDs. The archived list is
  the fixture harness's subject dropdown (`tests/runner.js`), so the CRK
  fixtures prove selection of the real `CRS` option.
- `ocr_helper.js` differs from `ocr_helper_deployed.js` by one regex: the
  non-deployed copy allows an opening quote/parenthesis before the capital
  (`(?=["“‘'(]?[A-Z])`), so questions beginning with quotation marks still
  split. The bookmarklet's `splitQuestions` already accepts a quoted start
  (`qwen1-sample1-quotes-before-capitals` passes).
- `IMPROVISED C.docx.txt` is the OCR text bank; its header is
  `IMPROVISED C. R. K. QUESTIONS FOR 2021`, which is why CRK appears in practice
  while the target subject list is CRS-oriented.

## Phase 2: Code Extraction + Baseline Selection

### Code versions found

| Label | Where | Identity / differences |
|---|---|---|
| A (V0 in qwen-2) | `trusted-variant-A.js` | Lookbehind OPTION regex; dotted options only; two textareas; known dotless bug |
| V1 | `qwen-1-migration.md` code block (10395 bytes, sha256 `e081d842…2d361a6b`) | A plus dual-branch OPTION and per-slice cleaning; fails inline Q20 |
| B (V4 in qwen-2) | `trusted-variant-B.js`; `qwen-2-reconciled.md` §1.1 | Inline whitespace branch + dotless-newline branch + absorbed-option post-processor; two textareas |
| C (merged) | `trusted-variant-C.js`; `claude-migration.md` §1 (byte-identical) | B refined (`[^\S\n]*`), post-processor removed, loose E/F, one-box `splitSections`, key-only paste, E/F tick fixed |

Partial/non-versions:

- `qwen-2-reconciled.md` §1.2 is a readable `parseQuestion` companion, not a
  standalone artifact.
- B1, B2 and B3 are the three bookmarklets supplied in the first Claude
  message. They arrived as `first.js`, `second.js`, and `third.js`, in the
  wrong order; Phase 8 identified and archived them as
  `archive/legacy-bookmarklets/b1.js`, `b2.js`, and `b3.js`. See that
  directory's `README.md` for the matching evidence.
- The original `ocr_helper.js` is now archived in `archive/live-sources/`.

Per-source notes are in `archive/migration-docs/analysis/` and
`archive/trusted-variants/analysis/`.

### Baseline chosen

**`trusted-variant-C.js` (the merged one-box artifact).**

Rationale:

- Newest version in the documented lineage (B → C in `claude-migration.md`;
  C's known-issues doc calls it the most recent merged iteration).
- Superset workflow: one paste for questions + key, automatic key split,
  key-only correction, same queue/save/state behavior.
- Fixes known defects in earlier versions: A/V1 dotless options, B's E/F radio
  values 4/5, B's blank-`C.` absorption (via `[^\S\n]*`).
- Satisfies the documented regression set in local parser comparison:
  S1 → 40 items, Q20 four clean inline options; S2 → leading `A 5` stays in the
  stem, options `75/105/85/99 years`, no flags; S3 → empty `c`,
  `d = "seek revenge"`, only `option C missing`.

Full comparison: `docs/BASELINE_COMPARISON.md`.

### Extraction status

| File | Contents |
|---|---|
| `src/parser/parser.js` | Pure parsing: `FIXES`, `OPTION`, key/section regexes, `parseHeader`, `pickSubjectIndex`, `splitQuestions`, `parseQuestion`, `splitSections`, `parseKey`. No DOM, no `localStorage`. |
| `src/ui/ui.js` | DOM injection, form filling, storage wrapper, queue, key ticking, submit interception, bootstrap (`runOCRBookmarklet`). |
| `src/build/build.js` | Concatenates parser + UI, wraps in `javascript:(function(){try{…}catch(e){alert(…);}})();`, writes `src/bookmarklet.js`. |
| `src/bookmarklet.js` | Generated single-line combined output (16535-character script after Phase 7; 16540-byte UTF-8 file including the trailing newline). |

Extraction was verified without executing the page:

- Parser outputs were compared against the original C functions extracted from
  the archived variant on S1 (40 items), S2, S3, S5, key-section variants
  (divider/header/structure), `parseHeader`, and `pickSubjectIndex`.
- All comparisons matched exactly.
- `fillForm`, `renderOCR`, `showOCR`, `cur`, `tick` are whitespace-normalized
  identical to C. `applyHeaderInfo` differs only by delegating subject choice
  to the pure `pickSubjectIndex` (verified equivalent).
- The built bookmarklet passes a syntax/compile check and executes to the
  guard alert under a stub DOM.

No parser behavior was modified. `src/bookmarklet.js` is generated; edit
`src/parser/parser.js` / `src/ui/ui.js` and re-run `node src/build/build.js`.

### Conflicts and ambiguities (flagged in Phase 2; closed in Phase 7)

Phase 2 deliberately left these open. Phase 7 closed items 1, 3, 4, 5, and 6
with the live sources and the recorded decisions; items 2 and 7 remain as noted.


1. **E/F merge framing** — `qwen-2-reconciled.md` calls it a lossy limitation;
   `qwen-2-gaps.md` reclassifies it as a hard server constraint. Both agree the
   current behavior (collapse to Option D) is what the server requires. Not
   changed.
2. **B vs C "final"** — `qwen-2-reconciled.md` calls B "final accepted", but
   `claude-migration.md` provides a later merged version identical to C.
   Chronology and the known-issues docs indicate C is newer.
3. **PRG success detection** — `qwen-2-reconciled.md` marks it uncertain;
   `qwen-2-gaps.md` says the PHP PRG flow guarantees the success string.
   Current code is unchanged.
4. **Reset Queue vs key** — `claude-migration.md` records this as undecided.
   C's code keeps the key on Reset. Preserved as-is.
5. **`ocrSubmitted` writer** — read/deleted but never written by the
   bookmarklet; likely legacy from `ocr_helper.js`. Purpose unresolved.
6. **CRK/CRS alias** — `claude-migration.md` infers the subject list may not
   contain CRS, so the alias may match nothing; the parser spec describes it as
   handled. No code change.
7. **B1/B2/B3/OH** — B1/B2/B3 supplied later and matched in Phase 8;
   `ocr_helper.js` archived in Phase 7.

## Phase 3: Edge Cases + Invariants

Raw per-doc extraction notes:

- `archive/migration-docs/analysis/claude-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-1-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-2-reconciled-phase3.md`
- `archive/migration-docs/analysis/gap-reports-phase3.md`

Consolidated outputs:

- `docs/EDGE_CASES.md` — 63 edge cases
- `docs/INVARIANTS.md` — 57 invariants

### Edge cases (count by status)

| Status | Count |
|---|---|
| CONFIRMED | 50 |
| UNVERIFIED | 8 |
| CONFLICTED | 3 |

This is the Phase 3 snapshot. Phase 7 closed the conflicts and confirmed the
server-side items from the archived PHP/HTML; current counts are in "Final
status".

UNVERIFIED: letter-like text in prose/options (no guard), key text with
explanations, fuzzy subject accuracy, year typo/unmatched year, repeated
injection interval, Option D newline stripping, empty-option server rejection,
category `id <= 10` limit.

### Invariants (count by status)

| Status | Count |
|---|---|
| VERIFIED | 40 |
| AT_RISK | 12 |
| CONFLICTED | 3 |

This is the Phase 3 snapshot; Phase 7 reclassified these (current counts in
"Final status").

Additional items carried from the raw notes: EC-61 (header year first-match may
pick a copyright/reference year, qwen-2 R14) and INV-55 (`localStorage` is
origin-wide and shared with the live helper, qwen-2 R15).

### Conflicts found

1. **E/F framing** (EDGE_CASES EC-40 / INVARIANTS INV-31) —
   `qwen-2-reconciled.md` treats E/F collapse and the E/F tick as lossy/buggy
   (B computes radio 4/5); `qwen-2-gaps.md` reclassifies collapse as a hard
   server constraint; `claude-migration.md` shows C maps E/F to D. Behavior in
   baseline C is the later documented mapping, but the sources are flagged.
2. **CRK/CRS alias** (EC-41 / INV-43) — specified as handled, but
   `claude-migration.md` infers the deployed subject list may contain no CRS /
   Christian Religious option. Needs live data.
3. **PRG success detection** (EC-59 / INV-49) — qwen-2-gaps says the PHP PRG
   flow guarantees the flash text; qwen-2-reconciled marks the live response as
   never observed and uncertain.

All three were closed in Phase 7: E/F was decided as a hard constraint, the PHP
confirmed the PRG flash, and the current live subject list (supplied later)
contains CRS, so the alias is confirmed.

### Version differences and open decisions

4. **Version-specific behaviors** — the older two-textarea variants (A/B/V1)
   differ from baseline C on E/F ticking and absorbed-option repair. These are
   documented as version differences, not silently merged.
5. **Open product decisions** at Phase 3 were: Reset Queue vs key, key
   persistence across reloads, `is_active` default, and the `ocrSubmitted`
   writer. All four were decided in Phase 7 (see "Phase 7: Decision
   Close-out").

No edge cases or invariants were invented; every entry cites a source doc.

## Phase 4: Fixtures

### Method

- Inputs were copied verbatim from the `text` code blocks in
  `archive/migration-docs/*.md`. Line endings present in a source block
  (including CRLF) were preserved.
- The S4 block is a list of fragments rather than one paste. Each fragment is
  its own fixture; where a fragment needs a preceding line for a documented
  newline rule, the prepended S4 line is recorded in that fixture's
  `provenance` and `notes`.
- Expected values were transcribed from the expected-behavior sections of the
  migration docs. The parser was **not** run to generate any expected output.
- A fixture has one input file and one expected JSON file. `status` is
  `CONFIRMED` when the docs state the expected output and `PENDING` when they do
  not.
- `flags: null` means the source does not document the flags for that sample;
  it is not an assertion that no flags occur.
- `must_not` records the explicit negative expectations in the docs.
- `discrepancies` records source or trusted-variant differences without
  resolving them.

### Fixture schema (`schema_version: 1`)

| Field | Meaning |
|---|---|
| `kind: "questions"` | Run the full paste path: `splitSections` → `splitQuestions` → `parseQuestion`. |
| `kind: "question"` | Run `parseQuestion` on the whole input as one chunk. Used for the assistant-written micro-samples. |
| `kind: "key"` | Run `parseKey` on the input. |
| `parse_num` | Harness-only number to pass to `parseQuestion` when the raw sample has no printed number. Used only where the source's "no flags" result assumes a numbered parse; it is not a documented book number. |
| `expected.queue_count` | Number of queued question chunks. |
| `expected.header` | Documented `exam_year` and/or `subject_contains_any`. |
| `expected.questions` | Per-question assertions; a question may be selected by `num` and/or `index`. Only documented fields are present. |
| `expected.questions_with_e` | Question numbers documented to have an Option E. |
| `expected.forbidden_flags` | Flags that must not appear anywhere in the result. |
| `expected.form_behavior_no_key` | Documented `fillForm` behavior for future UI tests; not asserted by a parser-only runner. |
| `expected.key` | Expected `parseKey` map. |
| `expected.ui_notes` | Documented `tick()` behavior for future UI tests. |
| `notes` | Source caveats and interpretation limits. |
| `must_not` | Documented behaviors that must not happen. |

### Inventory

| Fixture | Source | Kind | Status | Documented assertion |
|---|---|---|---|---|
| `claude-s1-joseph-blank-c` | claude §6/§7 S1; qwen2 §6/§7 S3 (identical input) | questions | CONFIRMED | Q3: A/B/D text, C empty, flag `option C missing` only; D has no `D.` prefix |
| `claude-s2-father-of-faith-e-dotted` | claude §6/§7 S2 | question | CONFIRMED | E = `Abraham`; no flags |
| `claude-s3-father-of-faith-e-dotless` | claude §6/§7 S3 | question | CONFIRMED | dotless `E Abraham` parses as E = `Abraham`; no flags |
| `claude-s4-father-of-faith-four-options` | claude §6/§7 S4 | question | CONFIRMED | E/F empty; no flags |
| `claude-s5-option-text-next-line` | claude §6/§7 S5 | question | CONFIRMED | text on the line after `A.` attaches to A; no flags |
| `qwen1-sample1-quotes-before-capitals` | qwen1 §6/§7 Sample 1 | questions | CONFIRMED | Q36 splits cleanly with a leading quoted stem |
| `qwen1-sample2-crk-header` | qwen1 §6/§7 Sample 2 | questions | CONFIRMED | year 2021; CRK→CRS subject; header is not a num:null question |
| `qwen1-sample3-five-options` | qwen1 §6/§7 Sample 3 | questions | CONFIRMED | all five options parse; E exposed |
| `qwen1-sample4-dotless-option-a` | qwen1 §6/§7 Sample 4 | questions | CONFIRMED | `A 75 years` becomes Option A, not stem text |
| `qwen1-sample5-question-starting-a` | qwen1 §6/§7 Sample 5 | questions | CONFIRMED | stem-leading `A good` is not Option A |
| `qwen2-s1-crk-2021-full` | qwen2 §6/§7 S1 | questions | CONFIRMED | 40 items; 2021; Q20 inline options exact and flag-free; E on Q1/21/31-35; no duplicate-letter flags; quoted/underscore stems preserved |
| `qwen2-s2-article-vs-option` | qwen2 §6/§7 S2 | questions | CONFIRMED | leading `A 5` stays in stem; `A 75/105/85/99 years`; no flags |
| `qwen2-s4-article-start` | qwen2 §6/§7 S4 (assistant micro-example) | question | CONFIRMED | chunk-leading `A 5` is not an option |
| `qwen2-s4-dotted-start` | qwen2 §6/§7 S4 (assistant micro-example) | question | CONFIRMED | `A. 5 years` is Option A |
| `qwen2-s4-dotless-newline-a` | qwen2 §6/§7 S4 (S4 stem line + `A 75`) | question | CONFIRMED | `A 75` after a newline is Option A; no duplicate-letter flag |
| `qwen2-s4-dotted-newline-b` | qwen2 §6/§7 S4 (`A 75` / `B. 75`) | question | CONFIRMED | `B. 75` after a newline is Option B |
| `qwen2-s4-vertical-block` | qwen2 §6/§7 S4 (assistant micro-example) | question | CONFIRMED | vertical A-D block yields four options |
| `qwen2-s4-inline-block` | qwen2 §6/§7 S4 (assistant micro-example) | question | CONFIRMED | fully inline A-D run yields four options |
| `qwen2-s5-answer-key` | qwen2 §6/§7 S5 | key | CONFIRMED | `1.B 2.C 3.A` → `{1:B, 2:C, 3:A}` |

### Counts by status

| Status | Count |
|---|---|
| CONFIRMED | 19 |
| PENDING | 0 |

Every extracted raw sample has at least the options/flags expected by a source
doc, so no fixture needed PENDING status. Samples with no raw text were not
turned into fixtures.

### Duplicates, omissions, and incomplete inputs

- `claude-migration.md` S1 and `qwen-2-reconciled.md` S3 are byte-identical.
  They share `claude-s1-joseph-blank-c`; only one input/expected pair exists.
- `claude-migration.md` S6 (four E scenarios) has no full raw paste; only
  paraphrase fragments. No fixture was created.
- `claude-migration.md` S7 lists fragments (`=== ANSWER KEY ===`,
  `1.A 2.B 3.C`, `5. [missing]`, `Vitamin C.`, `Vitamin B-12`, `Group B)`), not
  raw pastes. The key fragment is covered by `qwen2-s5-answer-key`; the rest are
  edge-case triggers, not sample inputs.
- `qwen-1-migration.md` Sample 2 is truncated with a literal `...`; only its
  documented header/year/subject assertions and the question stem are captured.
  Option A's exact text is not asserted because no source doc states it.
- `qwen-2-reconciled.md` S4 is explicitly labelled **not user OCR**. Its six
  micro-examples are split into six `question` fixtures. The block supplies no
  stem for the two newline fragments, so `qwen2-s4-dotless-newline-a` pairs the
  `A 75` fragment with the S4 stem line to provide the preceding newline that
  E03 requires; the intervening `A. 5 years` line is a separate S4 example and
  is covered by `qwen2-s4-dotted-start`. `qwen2-s4-dotted-newline-b` uses the
  verbatim `A 75` / `B. 75` pair; there `A 75` is at chunk start, so the
  documented dotless rule (E02) leaves it in the stem and only `B. 75` is
  asserted.

### Discrepancies recorded in fixtures

1. **CRK/CRS alias** — `qwen1-sample2-crk-header` and `qwen2-s1-crk-2021-full`
   assert the documented CRS/CHRISTIAN RELIGIOUS match. The harness now uses
   the current live subject list, which contains `CRS` (id 14), so the alias
   selects it (EC-41). No fixture expectation was changed.
2. **E/F tick across variants** — E samples note that parse output should match
   A/B/C, but trusted-variant-B computes radio values 4/5 while baseline C maps
   E/F to D (EC-40).
3. **Dotless options in trusted-variant-A** — `claude-s3`, `qwen1-sample4`, and
   `qwen2-s2` note that A's known dotless-option bug would produce different
   output.
4. **Blank-C repair mechanism** — `claude-s1` notes that B recovers the blank C
   with its post-processor while C uses the `[^\S\n]*` regex; both are documented
   to produce the same output.
5. **Q11/Q12 continuation** — `qwen2-s1` records the documented quirk but makes
   no assertion, because qwen2 calls it unresolved/unconfirmed as desirable.
6. **Numbering caveat for claude S2-S5** — those samples have no printed question
   number; the docs' "no flags" result assumes a numbered parse. The num used in
   the source test is not documented, so the fixture records the caveat rather
   than inventing one.

### Integrity checks

- 19 input files and 19 expected files; every input has exactly one expected
  file and every `input_file` path exists.
- Input files preserve the source line endings, including CRLF in the
  `qwen-2-reconciled.md` blocks and the S4 micro-examples.
- All expected files parse as JSON with schema version 1 and a status of
  `CONFIRMED` or `PENDING`.
- Correction recorded during Phase 6: the undocumented Option A assertion in
  `qwen1-sample2-crk-header` was removed. Phase 6 normally must not modify
  fixtures; see "Harness result" for the provenance evidence and the accepted
  correction.

## Phase 5: Documentation

### Docs created

| File | Contents | Evidence used |
|---|---|---|
| `docs/SPEC.md` | Scope, input format, output objects, 6 parsing stages, flags, server contract | `src/parser/parser.js`, `src/ui/ui.js`, claude §2/§4, qwen-2 §2.1–§2.10 |
| `docs/DECISIONS.md` | 23 implementation choices plus 6 open decisions; each has choice, why, risk | claude §5/§8/§9/§10, qwen-2 §5/§9/§10, qwen-1 gaps, baseline code |
| `docs/AGENTS.md` | Ground rules, dangerous areas, what to preserve/avoid, test and build commands, evidence policy | claude §4/§5/§10, qwen-2 H01–H09, `docs/EDGE_CASES.md`, `docs/INVARIANTS.md` |
| `docs/BUILD.md` | Requirements, build steps, line-flattening behavior, verification, source-of-truth rules | `src/build/build.js`, `src/bookmarklet.js`, claude §10, INV-05 |
| `README.md` | Project overview, quick start, layout, behavior summary, phase status, open questions | All of the above; no live-run claims |

No source code was modified in Phase 5. No expected fixture output was
regenerated. Documentation records existing behavior and cited risks; it does
not resolve any flagged conflict.

### Documentation scope decisions

- `docs/SPEC.md` describes the baseline code, not the older A/B variants. Where
  the baseline differs from the docs (for example C's absent post-processor),
  the doc says so and points to `docs/DECISIONS.md`.
- `docs/DECISIONS.md` reflects baseline C. The post-processor entry documents
  its removal; it does not claim the post-processor exists.
- At Phase 5, `docs/AGENTS.md` stated that `tests/` was empty and that Phase 6
  was scheduled to add `tests/runner.js`. That section was updated in Phase 6
  and now documents the working harness.
- `docs/BUILD.md` documents the actual `build.js` behavior, including its
  per-line trim and blank-line removal, and warns against multi-line literals
  whose meaning depends on surrounding whitespace.

### Missing information carried forward

1. No live browser run was ever documented: `fillForm`, `tick`, `splitSections`,
   and the save flow were not exercised against the real admin page
   (claude §8 issue 1). The PHP source now confirms the save/PRG response, but
   no live browser run has been performed.
2. At Phase 5, `admin_questions.php`, `admin_questions.html`, and the original
   `ocr_helper.js` were not archived. Phase 7 supplied and archived them.
   `cbt_db.php` and `cbt_admin_config.php` were not supplied.
3. B1 and B3 were supplied later and matched in Phase 8 to
   `archive/legacy-bookmarklets/b1.js` and `b3.js`; B2 is `b2.js`. The original
   `ocr_helper.js` is archived in `archive/live-sources/`.
4. `claude-gaps.md` was supplied in Phase 9 and archived at
   `archive/migration-docs/claude-gaps.md`; its triage is in Phase 9. It added
   two tracked verification gaps: stale `ocrQueue` data (EC-62/INV-56) and the
   live `questions` schema (EC-63/INV-57).
5. At Phase 5, eight edge cases were UNVERIFIED and three CONFLICTED; twelve
   invariants were AT_RISK and three CONFLICTED. Phase 7 closed the conflicts;
   Phase 9 added the two gaps above (current counts: 57/6/0 edges, 48/9/0
   invariants).
6. The Phase 5 open product questions were decided in Phase 7; the CRK/CRS
   target was confirmed in Phase 7 and B1/B2/B3 were matched in Phase 8.
7. No test harness existed at Phase 5; Phase 6 added `tests/runner.js` and
   fixture comparison now runs.

### Phase 5 verification checklist

- [x] All 5 docs created: `docs/SPEC.md`, `docs/DECISIONS.md`,
      `docs/AGENTS.md`, `docs/BUILD.md`, `README.md`.
- [x] `docs/SPEC.md` describes parser behavior from code + migration docs.
- [x] `docs/DECISIONS.md` explains unusual choices with why and risk.
- [x] `docs/AGENTS.md` has constraints, dangerous areas, preserve/avoid rules,
      test guidance, and build guidance.
- [x] `docs/BUILD.md` explains how to produce the bookmarklet.
- [x] `README.md` provides project overview and quick start.
- [x] All docs are based on archived evidence; conflicts are cited, not
      resolved; no new behavior was added.
- [x] `WORKSPACE_SETUP.md` updated with the doc list and missing information.
- [x] No parser or UI code modified.
- [x] Second pass: docs re-checked against code and Phase 3 docs; corrected the
      divider/stem/OPTION whitespace wording and the generated-file size note.
      No behavior, fixture, or expected output changed.

## Phase 6: Test Harness + Final Report

### Test harness

`tests/runner.js` is a pure-Node harness (no browser, no dependencies). It:

- discovers `fixtures/expected/*.json` and resolves each `input_file` (or
  `fixtures/inputs/<id>.txt` by default);
- verifies that every `fixtures/inputs/*.txt` is referenced by a fixture spec;
  an unreferenced input is reported as `[ORPHAN]` and makes the run exit
  non-zero (so an input can never be silently skipped);
- runs the fixture according to its `kind`:
  - `questions` → `splitSections` → `FIXES` → `splitQuestions` →
    `parseQuestion`;
  - `question` → `parseQuestion` on the whole input, with `parse_num` or
    `null`;
  - `key` → `parseKey`;
- compares only the fields present in `expected`: `queue_count`, `header.year`,
  option strings, `question`, `question_contains`, `flags` (unless `null`),
  `questions_with_e`, `forbidden_flags` (for both `questions` and `question`
  fixtures), and `key`;
- rejects an `expected` object containing an unknown key or a wrong-typed
  assertion value, fails an unknown fixture `kind`, and fails a `CONFIRMED`
  fixture that executes zero assertions, so a typo cannot silently reduce
  coverage;
- reports `PASS`, `FAIL`, or `PENDING` per fixture and exits non-zero on any
  failure.

Run it with:

```sh
node tests/runner.js
```

Implementation notes and limits:

- `header.subject_contains_any` is checked against the archived current live
  subject `<select>` (`archive/live-sources/subjects-select-2026-10-23.html`),
  so CRK selects the real `CRS` option (EC-41/INV-43 now verified).
- `expected.form_behavior_no_key` and `expected.ui_notes` are documented future
  UI assertions; this parser-only runner does not execute them.
- `must_not` entries are natural-language documentation. The harness checks the
  equivalent positive assertions encoded in each fixture, not the prose.
- PENDING fixtures are reported without running assertions, but their input file
  must still exist. There are none.
- Failure modes were spot-checked with temporary fixtures: a wrong-typed
  `question_contains` and an unknown `kind` (even with `PENDING` status) both
  produced FAIL and a non-zero exit; the temporary files were removed.

### Harness result

| Result | Count |
|---|---|
| PASS | 19 |
| FAIL | 0 |
| PENDING | 0 |
| Total | 19 |

**Phase 4 correction (accepted in Phase 6).** An earlier revision of
`qwen1-sample2-crk-header` asserted Option A as
`"because i have asked him of the Lord"`. The input is the qwen-1 Sample 2
block, which is explicitly truncated: its option list ends with a literal `...`
line and has no B–D labels, so the parser correctly treats the `...` line as
part of Option A (`"because i have asked him of the Lord ..."`). No source doc
states A's exact parsed text, so that assertion had been inferred from the raw
input, not transcribed from documented behavior. The undocumented `a` assertion
was removed so the fixture no longer makes an undocumented claim; the fixture
still asserts the documented year, CRK/CRS subject mapping, question stem, and
queue count. No parser code was changed, and the remaining expected values are
still the doc-backed ones. This was a Phase 4 provenance defect: the correct
Phase 4 behavior would have been to omit the undocumented field or mark that
part of the fixture PENDING. It is recorded here as an accepted Phase 4
correction rather than folded into the PASS count without explanation. Phase 6
normally treats fixtures as read-only; changing one here was allowed only
because the removed value was not doc-backed and the change is disclosed.

### Gap resolution

Gap reports: `archive/migration-docs/qwen-1-gaps.md`,
`qwen-1-gaps2.md`, and `qwen-2-gaps.md`.

Status vocabulary (the Phase 6 prompt's three exact values are used):
**RESOLVED** means the gap is closed by baseline code, a trusted variant,
another migration doc, or a recorded decision. When the resolution is
documentation-only, the status stays RESOLVED and the evidence column says
"Documentation only"; the corresponding deployment or server-side claim has not
been observed and remains UNVERIFIED/AT_RISK in `docs/EDGE_CASES.md` /
`docs/INVARIANTS.md`. **NEEDS_INPUT** means the gap cannot be closed without a
human decision or a live artifact. **STILL_OPEN** means the supplied sources
conflict or lack the evidence needed to close it and no specific input request
has been identified. No fourth status is used.

| # | Gap | Source | Status | Evidence / reason |
|---|---|---|---|---|
| G1 | CSRF token is preserved by posting `new FormData(form)` | qwen-1-gaps §1; qwen-1-gaps2 Gap 1 | RESOLVED | INV-46; `docs/SPEC.md` §6; `src/ui/ui.js` submit handler |
| G2 | Session timeout is detected via `Administrator Login` | qwen-1-gaps §2 | RESOLVED | INV-48; EC-55; `src/ui/ui.js` failure branch |
| G3 | Clear image/video/explanation but not `is_active` | qwen-1-gaps §3; qwen-1-gaps2 Gap 3 | RESOLVED | INV-50; `docs/SPEC.md` Stage 6 |
| G4 | `correct_option` radios use integers 0–3 | qwen-1-gaps §4; qwen-1-gaps2 Gap 2 | RESOLVED | INV-30; `docs/SPEC.md` §6; EC-40 |
| G5 | Numbering guard `n <= last || n > last + 5` | qwen-1-gaps §5; qwen-1-gaps2 Gap 4 | RESOLVED | INV-21; `docs/SPEC.md` Stage 2; DECISIONS D-11 |
| G6 | Remove legacy helper UI/panel before injecting | qwen-1-gaps §6 | RESOLVED | INV-01; EC-49; `src/ui/ui.js` bootstrap |
| G7 | Complete `localStorage` key inventory | qwen-1-gaps2 Item 1 | RESOLVED | INV-36; `docs/SPEC.md` §3.4 |
| G8 | Backend CSS class dependencies | qwen-1-gaps2 Item 2 | RESOLVED | Documentation only; INV-04 is still AT_RISK (classes inferred, not observed) |
| G9 | `ocr_helper.js` load location / cleanup order | qwen-1-gaps2 Item 3 | RESOLVED | Documentation only; cleanup requirement is corroborated by qwen-1-migration §3/§10 (INV-01, EC-49), but the exact "bottom of the PHP" location is only in the gap report and remains uncorroborated |
| G10 | PRG flash detection guaranteed | qwen-2-gaps §1 | RESOLVED | `admin_questions.php` stores `cbt_admin_flash`, redirects with `Location`, and renders the flash in the redirected page; the bookmarklet's fetch follows the redirect. INV-49/EC-59 now VERIFIED/CONFIRMED |
| G11 | E/F merge is a hard server constraint | qwen-2-gaps §2 | RESOLVED | Human framing decision: hard constraint. `admin_questions.php` requires exactly four non-empty options and `correct_option` 0–3; INV-31/EC-40 now VERIFIED/CONFIRMED. D side effect documented in `docs/DECISIONS.md` D-09 |
| G12 | Ignoring missing-option flags causes server rejection | qwen-2-gaps §3 | RESOLVED | INV-20 (flags advisory) + INV-51 (four non-empty options); EC-57 confirmed by `admin_questions.php` |
| G13 | Media uploads are out of scope | qwen-2-gaps §4 | RESOLVED | INV-52; EC-53 |
| G14 | Category dropdown is limited to `id <= 10` | qwen-2-gaps §5 | RESOLVED | Documentation only; INV-51; EC-60 is UNVERIFIED without the PHP |
| G15 | `exam_year` must be 1900–2100 | qwen-2-gaps §6 | RESOLVED | Documentation only; INV-51; EC-44 is UNVERIFIED without the PHP |

Coverage: in Phase 7 the archived `admin_questions.php` confirmed the
server-side claims behind G10 and G12–G15, and the PHP/HTML confirmed the E/F
constraint behind G11. The trusted variants still cover only the bookmarklet,
not the server. G1–G7 are covered by the baseline code and/or the migration
docs cited; G8 and G9 remain documentation-only (the PHP confirms the CSS
classes, but the exact `ocr_helper.js` load location is still uncorroborated).

`NEEDS_INPUT`: none of the original G1–G15. The CRK/CRS target is now confirmed
by the current subject list (CRS, id 14). B1/B2/B3 were matched in Phase 8 and
are not gap-report items. No gap item is STILL_OPEN.

### Conflicts remaining

None of the three source conflicts remains CONFLICTED.

1. **E/F framing** — resolved as a hard server constraint by human decision and
   by the PHP's four-option/0–3 validation. The lossy overwrite of D is recorded
   as a side effect. See INV-31, EC-40, D-09.
2. **CRK/CRS alias** — resolved: the current live subject list contains `CRS`
   (id 14), and the harness now tests against that list, so CRK selects it. See
   INV-43, EC-41.
3. **PRG success detection** — resolved by `admin_questions.php`: the flash is
   stored in the session, the POST redirects, and the redirected page renders
   it, so the fetched response contains the success text. See INV-49, EC-59.

Version differences (A/B/V1 vs baseline C) remain documented in
`docs/BASELINE_COMPARISON.md` and `fixtures/expected/`; they are not merged.

### Final status (after Phase 9)

1. **Baseline chosen:** `trusted-variant-C.js`, the newest merged one-box
   artifact. Rationale: documented lineage B → C, superset workflow, fixes for
   A/V1 dotless options and B's E/F radio values, and it passes the documented
   S1/S2/S3 regression set. Full evidence in `docs/BASELINE_COMPARISON.md`.
2. **Fixtures collected:** 19 total, 19 CONFIRMED, 0 PENDING; 19 currently pass.
   One undocumented assertion was removed from `qwen1-sample2-crk-header` in
   Phase 6 (Phase 4 correction; see "Harness result").
3. **Edge cases confirmed:** 63 documented — 57 CONFIRMED, 6 UNVERIFIED, 0
   CONFLICTED (`docs/EDGE_CASES.md`). The removed conflicts were closed by the
   archived PHP/HTML, not by changing fixture expectations. Phase 9 added
   EC-62 (stale queue) and EC-63 (live schema).
4. **Invariants verified:** 57 documented — 48 VERIFIED, 9 AT_RISK, 0 CONFLICTED
   (`docs/INVARIANTS.md`). Phase 9 added INV-56 (stale queue) and INV-57 (live
   schema).
5. **Conflicts remaining:** none CONFLICTED. The CRK/CRS alias is confirmed
   against the current archived subject `<select>`: CRK selects CRS (id 14).
   English (Oral) and English Language also resolve correctly on that list.
6. **Gaps status:** G1–G15 RESOLVED. G10 and G11 are now backed by the archived
   PHP and the recorded framing decision. No gap item is STILL_OPEN or
   NEEDS_INPUT.
7. **Test harness status:** `node tests/runner.js` runs without harness errors;
   19 PASS, 0 FAIL, 0 PENDING, 0 orphan inputs. The runner exits non-zero on a
   failing fixture, an unknown `expected` key or wrong-typed assertion value, an
   unknown fixture kind, a confirmed fixture with no executed assertions, a
   missing input, or an orphan input.
8. **Next steps:** diff B2 → C, then start parser work using the fixture-first
   workflow. Live browser, stale-queue, and live-schema checks remain open; see
   Phase 9.
9. **Verification gaps:** no live browser run; live `questions` schema unknown;
   no real OCR paste beyond S1; stale `ocrQueue` has no version marker or test.

### Verification checklist

- [x] All migration docs preserved in `archive/` (byte-identical copies; hashes
      recorded above).
- [x] All trusted variants preserved in `archive/` (byte-identical copies;
      hashes and known-issues docs above).
- [x] Live PHP/HTML/helper/OCR-bank sources preserved in `archive/live-sources/`
      (byte-identical copies; hashes above).
- [x] All fixtures extracted (19 input/expected pairs, all CONFIRMED; no orphan
      inputs — the runner enforces the pairing).
- [x] All edge cases documented (63; sources cited).
- [x] All invariants documented (57; sources cited).
- [x] All source conflicts closed or reclassified with evidence; none remains
      CONFLICTED.
- [x] Test harness runs without errors (`node tests/runner.js`) and exits
      non-zero on a failing fixture or an orphan input.
- [x] Parser code was not modified in Phases 1–7. The UI was modified only for
      the two decided behaviors: force `is_active` on and stop handling
      `ocrSubmitted`. `src/bookmarklet.js` was rebuilt and syntax-checked.
      One expected fixture was corrected as a Phase 4 provenance fix (see
      "Harness result"); no fixture expectation changed in Phase 7.

## Phase 7: Decision Close-out

### Decisions recorded

| # | Question | Decision | Effect |
|---|---|---|---|
| 1 | Reset Queue vs key | Keep key | Queue-only reset; "Clear saved key" stays separate (D-26) |
| 2 | Key persistence | Persist across reloads | `ansKey` read at boot, not cleared (D-25) |
| 3 | Default save state | Force active | `is_active` checked in `fillForm` and before submit (D-24) |
| 4 | PRG save detection | Confirmed from PHP | Flash stored in session, redirect, rendered in fetched response (D-18/INV-49) |
| 5 | Deployed subject list | Alias confirmed on current list | CRK selects CRS (id 14); English (Oral) and English Language disambiguate on the archived list (D-16/INV-43) |
| 6 | Legacy `ocrSubmitted` | Stop handling it | No read/write/delete; no boot-time queue advance (D-22/D-27) |
| 7 | Missing sources | `ocr_helper.js` and B1/B2/B3 supplied | Helper archived; B1/B2/B3 matched and archived in Phase 8 |
| 8 | E/F framing | Hard server constraint | PHP confirms four options/0–3; lossy D side effect documented (D-09) |

### Code changes

- `src/ui/ui.js`: force `is_active` on in `fillForm` and immediately before
  submit; remove the `ocrSubmitted` boot block.
- `src/bookmarklet.js`: regenerated from the modules (16535 script characters; 16540 bytes including the trailing newline).
- No parser changes, no fixture expectation changes, no PHP changes.

### Remaining human input

1. **Live browser run.** Exercise the bookmarklet on the real Add-a-New-Question
   page in Brave on Android: install the bookmarklet, load, fill, tick, save,
   and check the bookmark-length/URL-decoding behavior.
2. **Live database schema.** `cbt_db.php`, `cbt_admin_config.php`, and the
   `questions` schema were not supplied. Confirm whether `questions` has the
   `practice_title` requirement seen in the `questions1` dump (EC-63/INV-57).
3. **Real OCR pastes.** More verbatim samples are optional but would close the
   remaining fixture-coverage gap (claude-gaps item 4).

B1/B2/B3 and `claude-gaps.md` were supplied in Phases 8–9; no further input is
needed for the baseline, which remains `trusted-variant-C.js`.

## Phase 8: B1/B2/B3 Identification

The three supplied root files were matched to the B1/B2/B3 labels by their
distinguishing code, not by filename order.

| Label | Original | Archived | Key evidence |
|---|---|---|---|
| B1 | `first.js` | `archive/legacy-bookmarklets/b1.js` | No "Show paste box"; weaker `splitCombined`; option-splitting uses `\\n` / `\\s` |
| B2 | `third.js` | `archive/legacy-bookmarklets/b2.js` | `splitSections`, key-only path, "Show paste box"; Reset bug `{items,i:0}` |
| B3 | `second.js` | `archive/legacy-bookmarklets/b3.js` | Only file with `splitCombinedText`; no key-only path |

`b2.js` is the base of the merged `trusted-variant-C.js` baseline. All three
archived files pass `node --check`; the fixture suite remains 19/19.

## Phase 9: claude-gaps.md Review

`claude-gaps.md` was supplied after Phase 8 and archived byte-identically at
`archive/migration-docs/claude-gaps.md` (7287 bytes, sha256
`6786358665cc851ae11f6c933fa1a41cda945af024f2f82e6d7f7e68817e7cad`).
It reports gaps from the pre-workspace conversation, not new parser behavior.

| Item | Status | Resolution |
|---|---|---|
| 1. Chat copy not verified against file | CLOSED | The repo baseline is authoritative; `src/bookmarklet.js` passes `node --check`. |
| 2. B1/B2/B3 and `ocr_helper.js` missing | CLOSED | Archived under `archive/legacy-bookmarklets/` and `archive/live-sources/`. |
| 3. B1/B2/B3 claims not run | CLOSED (static/isolated) | B2 Reset bug and broken option-split regex confirmed; B1/B3 false-split risk confirmed by isolated parser runs. |
| 4. Almost no fixtures | PARTIAL | 19 fixtures now; still no direct `splitSections` fixture and no real OCR paste beyond S1. |
| 5. Test harness not saved | CLOSED | `tests/runner.js`. |
| 6. Stale stored data after update | OPEN | Tracked as EC-62/INV-56; reset and re-paste after updating. |
| 7. PHP save rules/schema | PARTIAL | Four-option rule and PRG confirmed; `questions` vs `questions1` / `practice_title` tracked as EC-63/INV-57. |
| 8. Handoff document stale | SUPERSEDED | Workspace docs are authoritative; the Bulk Import link remains deliberately undecided. |
| 9. “Correct” / “ideally” interpretations | PARTIAL | D-07 records removal of the post-processor; EC-13 remains UNVERIFIED. |
| 10. Working preferences missing | CLOSED | Added to `docs/AGENTS.md` “Working context”. |
| 11. Threshold origins unknown | OPEN (evidence) | Behavior and risk are documented; tuning provenance is still unknown. |
| 12. Turn-by-turn chronology | NON-BLOCKING | Phases in this report provide the working chronology. |
| 13. Real question examples | NON-BLOCKING | Archived HTML has only truncated rows; full text was not supplied. |
| 14. B3 quirks | NON-BLOCKING | B3 is archived; only relevant if its ideas are reused. |
| 15. Brave bookmark limits | OPEN | Same as the missing live browser run. |

Direct B1/B2/B3 checks (no baseline change):

- **B2 Reset Queue** — the handler assigns `queue={items,i:0}` where `items` is
  not in scope; it throws before rendering.
- **B2 option splitter** — its `new RegExp` template contains single backslashes,
  so `\n` and `\s` become a newline and `s`; the splitter barely matches and can
  merge options.
- **B1/B3 option splitter** — correctly escaped, so it can mis-split
  `Vitamin C.` / `Vitamin B-12`; the exact output depends on whether the letter
  is also a real option label. The removal decision (D-07) still stands.

Phase 9 added EC-62, EC-63, INV-56, and INV-57; no code or fixture changed.
`node tests/runner.js` remains 19/19.

## Next Step

Workspace setup is closed. Diff B2 → C, then begin parser work with the
fixture-first workflow. The live browser run, live `questions` schema, and
stale-queue behavior remain verification gaps. Do not change parser behavior
without a failing fixture and a documented decision.
