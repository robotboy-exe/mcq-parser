# trusted-variant-B.js — Inspection Notes (Phase 2)

Source: `archive/trusted-variants/trusted-variant-B.js` (11066 bytes, SHA-256
a75f5fef…f9bf367). Inspection only; not executed.

## Snapshot / context

Same two-textarea UI as variant A. Per `trusted-variant-B-KNOWN_ISSUES.md` this
is the final iteration before the question and answer-key textareas were
merged; likely handled more edge cases than A and felt stable enough to justify
the merge.

## Differences from variant A (code inspection)

Everything outside the items below is effectively identical to A (same guards,
FIXES, FIELDS, store, UI, header/subject heuristics, splitQuestions, fillForm,
queue, key handling, submit interception).

1. `OPTION` changed to
   `/(?:^|\n|\s)([A-F])\s*[.)]\s*|\n\s*([A-F])\s+(?=\d)/g`.
   - First alternative: a label at start/after newline/after whitespace,
     followed by `.` or `)`.
   - Second alternative: a label followed by whitespace and a digit — aimed at
     OCR where the closing punctuation is dropped before a following question
     number.
   - Allows labels placed after arbitrary whitespace, not just line start.
2. `parseQuestion` no longer collapses all whitespace up front. It normalizes
   line endings, collapses runs of spaces/tabs (preserving newlines) and
   collapses 3+ newlines to 2. A local `clean()` collapses whitespace when
   slicing.
3. Option markers may come from capture group 1 or 2 (`m[1] || m[2]`).
4. New post-processing pass over options a–f: for each option, if a later
   letter label (with punctuation, or at line start followed by space) appears
   inside its text, split the option at that point and move the remainder into
   the later option. This repairs merged options that the regex absorbed.
5. Because text slicing preserves newlines, options can contain line breaks
   until `clean()` is applied.

## Parsing behavior (code inspection only)

- Accepts option labels with `.`/`)`, and a fallback for bare `A` labels when
  immediately followed by a digit (merged-question repair).
- Repairs cascaded/merged option text by re-splitting on later labels.
- Still two separate textareas for questions vs. answer key.

## Known issues (from `trusted-variant-B-KNOWN_ISSUES.md`)

- None specifically documented by the user.
- Described as more edge-case tolerant than A and stable.

## Notes / limitations observed in code

- The bare-label fallback only fires when the next token is a digit
  (`A 2.`), so a bare-label option followed by ordinary text (e.g. `A Lagos`)
  is still not recognized.
- No answer-key section detection (still separate textareas).
- No loose E/F recovery beyond the option-label regex.
- `splitQuestions` still requires dotted question numbers.
