# P12 — Option boundary selection and duplicate-set warning

Status: done (2026-10-27). Review: independent-pass-with-accepted-findings;
FIX-1/FIX-2 fixed (wording only). Commit: deferred to phase 3 start. Depends
on: P11. Blocks: AS-10.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

User request 2026-10-27. Raw OCR sometimes contains initials that look like
option labels, for example Q46's `C. E. F. Small` and `B. K. A. Gbedemah`, or a
single `A.` inside option text. The current parser overwrites each label with
its last occurrence, so an inner initial can replace the real option boundary.

The fix is selection of one ordered option sequence per question, not a new
question splitter. Questions with a visible number legitimately followed by a
second A–D set must not be split inline and must not receive the duplicate
warning. A second full A–D set with no visible question-number boundary is a
merged-paste warning only.

## Preconditions

- P11 is done and green.
- `fixtures/inputs/` contains `new-edge-initials-q46` raw text copied from the
  Q46 block still in `docs/NEW_EDGE_CASES.txt`.
- Existing D-45/D-47 missing-dot repair, D-48 abbreviation skip, D-49 slash
  normalization, `FIXES`, blank-option handling, and `LOOSE` E/F behavior are
  understood and must remain.

## Work

1. Replace the single `pos`/`count` write in `parseQuestion` with one
   selection pass. Keep the existing `OPTION`, slash normalization, abbreviation
   skip, and `LOOSE` E/F logic.
2. From all accepted label matches, select the earliest occurrence of each
   required letter A–D; accept E and F only after the selected D. This preserves
   out-of-order hostile labels (for example `anomaly-block2`) that an
   ordered-chain-only scan would regress.
3. Sort the selected marks by text position before slicing. Apply the existing
   D-45/D-47 repairs and the E/F loose fallback after the selected labels are
   chosen. Keep the ordered chain scan only inside the duplicate-set detector.
4. Compute the duplicate-set warning from the full label list, not from the
   old `count` object. The warning is required only when a second complete
   `A–D` set exists and there is no visible question-number boundary between
   the end of the first set's `D` and the start of the second set's `A`.
   A boundary is a `1–3` digit number followed by `.` and whitespace, at line
   start or inline. A visible number suppresses the warning. Do not split the
   text at that number.
5. Keep the current behavior for a single inner initial. `A. Adebayo` and
   `E. Smith` inside option text must not replace the outer labels and must not
   trigger the duplicate warning.
6. Add fixtures:
   - `fixtures/inputs/new-edge-initials-q46.txt`,
     `fixtures/expected/new-edge-initials-q46.json`: Q46 only, expected
     `a` `Siaka Stevens`, `b` `K. A. Gbedemah`, `c` `E. F. Small`,
     `d` `Oladipo Solanke`, `flags: []`.
   - `fixtures/inputs/new-edge-single-initials.txt`,
     `fixtures/expected/new-edge-single-initials.json`: one question whose
     option text contains `A. Adebayo` and `E. Smith`; expected correct outer
     A–D text and `flags: []`.
   - `fixtures/inputs/new-edge-duplicate-labels.txt`,
     `fixtures/expected/new-edge-duplicate-labels.json`: one item with a second
     full A–D set and no question number; expected
     `required_flags: ["a letter appears twice (merged questions?)"]` and
     `must_not: ["The text was split into two questions"]`.
7. Add unit tests for the inline-number case: parse one question with
   `1. ... A. ... D. ... 2. ... A. ... D. ...`; assert one item and no duplicate
   warning. Also unit-test Q46 and the single-initial case directly.
8. Update `docs/DECISIONS.md` D-55, `docs/SPEC.md` option parsing,
   `docs/INVARIANTS.md` (new option-boundary and duplicate-warning invariants),
   `docs/EDGE_CASES.md` (Q46 and inline-number rows), and the README.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 41 PASS, 0 FAIL, 0 PENDING; no orphan inputs |
| `node tests/unit.js` | all prior tests plus Q46, single-initial, and inline-number tests PASS |
| Q46 | all four options correct; no flags |
| Single initials | outer A–D correct; no flags |
| Duplicate labels | one item; duplicate warning present |
| Inline number | one item; duplicate warning absent; no inline split |
| `node tools/extract-bank.js --check` | unchanged, green |
| Build | `src/bookmarklet.js` one line, no `%`, body parses |

## Guardrails

- Do not change `splitQuestions`, `splitSections`, the numbering guard, or
  `FIXES` order.
- Do not split inline questions. The visible number is a warning boundary only.
- Preserve D-45/D-47 missing-dot repair, D-48 dotted-abbreviation skip, D-49
  slash normalization, blank options, E/F collapse, and `LOOSE` E/F.
- `C. E. F. Small` and `B. K. A. Gbedemah` must keep their inner initials in
  option text.
- Do not add a warning for a lone `A.` or for standard dotted abbreviations.
- No new storage keys and no Auto-Save gate changes.
- Do not rebuild `src/bookmarklet.min.js`.

## Handoff note (append when done)

```text
Date: 2026-10-27
Result: done. parseQuestion now builds the accepted label matches once and
selects the earliest occurrence of each required letter A-D; E and F are
accepted only after the selected D, and the marks are sorted by text position
before slicing. Inner initials stay in option text (Q46, single-initial), and
out-of-order hostile labels still map by letter. The duplicate warning is
computed from the full match list and fires only for a second complete A-D set
that starts after the first set's D with no visible `N.` question-number
boundary; the text is never split inline.
Deviation from the package wording: an ordered-chain-only scan was tried first
and regressed anomaly-block2 (Q2 is `A,D,B,C`; Q16 has `B` before `A`), so the
implemented selection is earliest-per-letter for the parsed set. The ordered
chain scan remains only inside the duplicate-set detector.
Tests: runner 41 PASS, 0 FAIL, 0 PENDING, no orphans; unit 70 PASS; extractor
--check green for seven slices.
Files: src/parser/parser.js; tests/unit.js;
fixtures/inputs/new-edge-initials-q46.txt;
fixtures/expected/new-edge-initials-q46.json;
fixtures/inputs/new-edge-single-initials.txt;
fixtures/expected/new-edge-single-initials.json;
fixtures/inputs/new-edge-duplicate-labels.txt;
fixtures/expected/new-edge-duplicate-labels.json; src/bookmarklet.js (rebuilt);
docs/DECISIONS.md; docs/SPEC.md; docs/INVARIANTS.md; docs/EDGE_CASES.md;
docs/AGENTS.md; docs/plan/README.md.
Build: node src/build/build.js wrote src/bookmarklet.js at 67308 bytes; one
line, no %, body passes new Function parse. src/bookmarklet.min.js was not
rebuilt.
Docs: D-55 added; SPEC Stage 3 and the flag table updated; INV-86 and INV-87
added (counts 87/78/9/0); EC-85 and EC-86 added (counts 86/82/4/0); README
status, snapshot, fixture-count table, and changelog updated.
Acceptance coverage: PASS WITH ACCEPTED FINDINGS; FIX-1/FIX-2 fixed
(wording only). See docs/plan/reviews/post-as-2026-10-phase-2.md.
Review: independent-pass-with-accepted-findings; record at
docs/plan/reviews/post-as-2026-10-phase-2.md. No re-review; behavior unchanged.
Commit: deferred to phase 3 start.
Review fixes (2026-10-27): user decision accept and fix. FIX-1 updated
INV-17/INV-18 and docs/AGENTS.md to describe the D-55 boundary-less second-set
flag; FIX-2 updated this Work section to the implemented earliest-per-letter
selection. Wording-only; no code change.
Tests after fix: runner 41 PASS, 0 FAIL, 0 PENDING, no orphans; unit 70 PASS;
extractor --check green for seven slices.
Open questions: none. AS-10 remains not started.
```
