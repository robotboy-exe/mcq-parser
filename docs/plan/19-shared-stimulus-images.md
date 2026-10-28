# P13 — Shared stimulus detection, marker fallback, and image gate

Status: done (2026-10-28); light verification pending. Depends on: AS-12 (done). Blocks: AS-13.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

User request 2026-10-27. A shared table between questions is currently attached
to the previous question's Option D. The table belongs to later questions and
must become a stimulus block that can be saved as one image, not as option
text.

This package is parser, gate, and test-harness only:

- detect a standard intro line plus table block, or an explicit marker block;
- remove the block from the preceding question's stem/options;
- attach ordered stimulus metadata to the preceding parsed item;
- mark the questions named by the range as `needsImage`;
- add the auto-save gate reasons that force the uploader to assign an image and
  a range;
- add fixtures and unit tests.

The image-plan UI, file input, `FormData` injection, 60-second timeout, and live
acceptance are AS-13/AS-14. Until AS-13, auto-save is intentionally blocked for
a queue with a detected stimulus because no plan can be assigned; manual use is
unchanged. No PHP, database, server contract, `ocr_helper.js`, or localStorage
key change.

## Decisions

- **D-59 — shared stimulus blocks are ordered metadata.** A block is detected
  from a standard intro line plus table evidence, or from an explicit marker.
  The block is removed from the question chunk and stored as
  `{sourceNum, nums, marker, text, source}`. `applyStimulusFlags` assigns
  `id`, `order`, normalizes `nums`, marks target questions `needsImage`, and
  records out-of-paste targets in `missing`.
- **D-60 — the uploader assigns one image to one or more questions.** The image
  plan is in-memory: `{stimulusId, nums, name, file}` or a generic
  `{nums, name, file}`. The gate blocks unassigned detected blocks, ranges outside
  the paste, and a `needsImage` question with no covering image. No new storage
  key.

## Preconditions

- AS-12 is done and committed; baseline is runner 41 PASS and unit 115 PASS.
- The raw Q12–Q17 block was recorded in `docs/NEW_EDGE_CASES.txt` and is
  promoted to `fixtures/inputs/new-edge-shared-stimulus.txt`; the inbox copy
  is removed.
- The live form already accepts `question_image` with
  `enctype="multipart/form-data"`; no server change is needed.
- The user confirmed: `[missing text]` is not an image marker; marker placement
  is unreliable; both `[image]` and `[[image]]` are accepted.

## Work

1. Add stimulus detection to `src/parser/parser.js`.
   - Structural lines: numbered question lines, option labels, dividers, key
     headings, key lines, and missing-text placeholders.
   - A block is valid when it has an intro plus table evidence, one strong
     table row, or at least two weak table rows.
   - A standard intro is removed only when the same run has table evidence.
2. Add the marker fallback.
   - Standalone `[image]`, `[[image]]`, `[image: 14-15]`, `[[image: 14-15]]`;
     inline double-bracket markers only.
   - Adjacent block first; otherwise nearest block in the same question chunk,
     forward then backward; otherwise remove the marker only.
   - Never remove a question or option line; skip blank lines; stop at
     structural boundaries.
   - `parseStimulusRange` accepts `14-15`, `14–15`, `14 to 15`,
     `14 and 15`, `14,16`, and `Q14-Q15`; a range over 50 keeps only endpoints.
3. Add `extractStimuli`, `parseStimulusRange`, and `applyStimulusFlags` to the
   exports. `parseQuestion` attaches `q.stimuli` only when non-empty.
4. Add gate reasons to `autosaveBlockers` and text to `blockerText`:
   - `stimulus-unassigned` — a detected block has no plan, no file, no name, or
     no range.
   - `stimulus-range` — a plan names a question outside this paste.
   - `image-required` — the current question is `needsImage` and no image plan
     covers its number.
5. Extend `tests/runner.js` with `needs_image`, `stimulus_count`, and `stimuli`
   assertions; call `applyStimulusFlags` in `parseFixture`.
6. Add fixtures:
   - `new-edge-shared-stimulus`: Q13.D is clean; Q14/Q15 are `needs_image`;
     one intro stimulus with `nums: [14,15]`; key unchanged.
   - `stimulus-marker-placements`: eight questions covering marker before,
     after, inside, alone, inline, and far from the block.
7. Add unit tests for range parsing, marker removal, intro removal, ordered
   flags, missing targets, and the three new gate reasons.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 43 PASS, 0 FAIL; new-edge-shared-stimulus 27 checks; stimulus-marker-placements 75 checks |
| `node tests/unit.js` | 126 PASS, 0 FAIL |
| Raw Q12–Q17 | Q13.D `leads to a reduction in price`; Q14/Q15 `needsImage`; one stimulus with `nums: [14,15]`; key `12:C 13:D 14:A 15:B 16:D 17:A` |
| Marker placements | 8 stimuli; `needsImage` `[2,3,4,6,7,8]`; Q4/Q5 unassigned; Q8 keeps `Some explanatory paragraph that stays.` |
| `[missing text]` | Stays a placeholder; never becomes an image marker |
| Gate | Detected block without plan → `stimulus-unassigned`; plan range outside paste → `stimulus-range`; current flagged question without covering plan → `image-required` |
| Build | `src/bookmarklet.js` rebuilt; one line, body parses, no `%`, no inline `//` |

## Guardrails

- Do not change `OPTION`, `LOOSE`, `splitSections`, or `splitQuestions`.
- Do not remove a question or option line as part of a stimulus block.
- Do not treat `[missing text]`, `[diagram]`, or a bare table word as an image
  marker; only `image` is accepted.
- Do not add a localStorage key or change `ocrQueue`/`ocrMeta`/`ansKey` shapes.
- Do not change PHP, the database, `ocr_helper.js`, or the server contract.
- Do not make stimulus detection a global heuristic for every table-like line;
  the block must be bounded by structural lines.
- Do not weaken the gate to make a batch run; add a documented decision and a
  test first.

## Handoff note (append when done)

```text
Date: 2026-10-28
Result: done. The parser detects a standard intro plus table and removes it
from the preceding question; explicit [image]/[[image]] markers, including
optional ranges and inline double brackets, attach a nearest block in the same
question chunk. The raw Q13 block is no longer Option D, Q14/Q15 are
needs_image, and Q8 keeps its explanatory paragraph. applyStimulusFlags assigns
ordered ids, normalizes ranges, marks target questions, and records missing
targets. The gate adds stimulus-unassigned, stimulus-range, and image-required.
Runner 43 PASS; unit 126 PASS. `src/bookmarklet.js` was rebuilt; no UI change.
Auto-save on a detected stimulus is intentionally blocked until AS-13 supplies
the image plan.
Files: src/parser/parser.js; src/bookmarklet.js (rebuilt); tests/runner.js;
tests/unit.js;
fixtures/inputs/new-edge-shared-stimulus.txt;
fixtures/expected/new-edge-shared-stimulus.json;
fixtures/inputs/stimulus-marker-placements.txt;
fixtures/expected/stimulus-marker-placements.json; docs/DECISIONS.md;
docs/SPEC.md; docs/Auto-Save-Spec.md; docs/INVARIANTS.md;
docs/EDGE_CASES.md; docs/AGENTS.md; docs/STATUS.md; docs/NEW_EDGE_CASES.txt; docs/plan/README.md;
docs/plan/history.md; docs/plan/prompts/phase-map.md; AGENTS.md; INTENT.md; this file.
Hashes (SHA-256): src/parser/parser.js
  427977dda71e86f932b6807154356e111e0b780fa04744094ac76517482aaa0f;
  src/bookmarklet.js
  516155b759ea5ea4a1a0a94af35be2157bfdf0e0d403522ab829d49ff11b6fc7;
  tests/runner.js
  66e3b6de76880111ab0999e639c15ff068aa00bdd00600d605a1262c4701644a;
  tests/unit.js
  3942e1d4f0b033659de130d53f813ffdcc10533827ba16e03229a0a7a2f95453;
  fixtures/inputs/new-edge-shared-stimulus.txt
  f5d1d8c6c7abdbd4c13321de93c687d5169c524f1b384dadaee075290b0e668a;
  fixtures/expected/new-edge-shared-stimulus.json
  9723a7d9d3c0a164c0b45f0ff44cf66f1105e5a1a1786651a0da19c1b1e09046;
  fixtures/inputs/stimulus-marker-placements.txt
  2c47e4738ab04663aa52341f6cff9b7d817c03dcce30ad00e19fa2881142ef09;
  fixtures/expected/stimulus-marker-placements.json
  78382ef6dfd3c0baa660e441e5d9850cd8b4c374014c9d96a0c5f872e58e5b04.
Review: light-verified at phase 2 Gate 1 (2026-10-28); probes, hashes, build,
  fixtures, docs, and guardrails checked.
Commit: deferred to phase 2 start; recorded in git.
```
