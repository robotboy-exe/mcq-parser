# Workspace Setup

Status: Phase 1 complete (Workspace Structure + Archive). Phase 2 complete
(Code Extraction + Baseline Selection). Phase 3 complete (Edge Cases +
Invariants). Phase 4 complete (Fixtures). Phase 5 complete (Documentation).
Phase 6 not started.

## Directory Structure

```
project/
├── README.md                    # project overview and quick start (Phase 5)
├── archive/
│   ├── migration-docs/
│   │   └── analysis/            # per-source notes (Phase 2)
│   ├── trusted-variants/
│   │   └── analysis/            # per-source notes (Phase 2)
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

### Sources Not Archived

- `claude-gaps.md` — not supplied. Per Phase 1 instructions, gaps found during
  later reconciliation will be written to a new `claude-gaps.md`.
- Chat exports — none supplied; `archive/chat-exports/` is empty.

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
- B1, B3 and the original `ocr_helper.js` are named in `claude-migration.md`
  but their code was never supplied. `ocr_helper.js` remains unavailable.

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
| `src/bookmarklet.js` | Generated single-line combined output (16496 bytes). |

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

### Conflicts and ambiguities (flagged, not resolved)

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
7. **B1/B3/OH** — named but not supplied; cannot compare or extract.

## Phase 3: Edge Cases + Invariants

Raw per-doc extraction notes:

- `archive/migration-docs/analysis/claude-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-1-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-2-reconciled-phase3.md`
- `archive/migration-docs/analysis/gap-reports-phase3.md`

Consolidated outputs:

- `docs/EDGE_CASES.md` — 61 edge cases
- `docs/INVARIANTS.md` — 55 invariants

### Edge cases (count by status)

| Status | Count |
|---|---|
| CONFIRMED | 50 |
| UNVERIFIED | 8 |
| CONFLICTED | 3 |

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

### Version differences and open decisions

4. **Version-specific behaviors** — the older two-textarea variants (A/B/V1)
   differ from baseline C on E/F ticking and absorbed-option repair. These are
   documented as version differences, not silently merged.
5. **Open product decisions** retained: Reset Queue vs key (C keeps the key),
   key persistence across reloads, `is_active` default, `ocrSubmitted` writer.

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
  documented header/year/subject assertions and the first option are captured.
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
   assert the documented CRS/CHRISTIAN RELIGIOUS match, with an explicit note
   that `claude-migration.md` §8 issue 7 infers the deployed subject list may
   have no such option (EC-41).
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
- `docs/AGENTS.md` states that `tests/` is empty at Phase 5 and that Phase 6 is
  scheduled to add `tests/runner.js`. The intended command is marked as
  forward-looking, not as a currently working harness.
- `docs/BUILD.md` documents the actual `build.js` behavior, including its
  per-line trim and blank-line removal, and warns against multi-line literals
  whose meaning depends on surrounding whitespace.

### Missing information carried forward

1. No live browser run was ever documented: `fillForm`, `tick`, `splitSections`,
   and the save flow were not exercised against the real admin page
   (claude §8 issue 1). `docs/AGENTS.md` treats the save response as the
   highest-priority live check.
2. `admin_questions.php`, `cbt_db.php`, `cbt_admin_config.php`, and the original
   `ocr_helper.js` are not archived. Server limits and the PRG success text come
   from migration-doc descriptions only.
3. B1, B3, and the original `ocr_helper.js` were named in the docs but never
   supplied. They cannot be compared or extracted.
4. `claude-gaps.md` was never supplied; no gap report for the claude source
   exists.
5. Eight edge cases remain UNVERIFIED and three are CONFLICTED
   (`docs/EDGE_CASES.md`); twelve invariants are AT_RISK and three are
   CONFLICTED (`docs/INVARIANTS.md`). These statuses are preserved.
6. The six open product questions listed in `README.md` and
   `docs/DECISIONS.md` still need human input.
7. No test harness exists yet; fixture comparison is Phase 6 work.

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

## Next Step

Awaiting Phase 5 verification. Do not proceed to Phase 6 until the docs are
confirmed accurate and evidence-based.
