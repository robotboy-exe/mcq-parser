# trusted-variant-C.js — Inspection Notes (Phase 2)

Source: `archive/trusted-variants/trusted-variant-C.js` (14325 bytes, SHA-256
cda0fe17…183a1a64). Inspection only; not executed.

## Snapshot / context

Most recent merged-textarea iteration personally tested by the user
(`trusted-variant-C-KNOWN_ISSUES.md`). One box for the whole block (questions +
answer key), with a "Show paste box" control. Other merged iterations exist in
the user's bookmarks but were not supplied.

## Differences from variant B (code inspection)

All shared infrastructure is unchanged (guards, FIXES, FIELDS, store, header
heuristics, splitQuestions, fillForm, queue, submit interception, reload
recovery).

1. UI: single `#ocr_text` labeled "Paste the WHOLE block: questions + answer
   key (one box)". Adds a `#ocr_show` button ("Show paste box") and replaces
   the answer-key textarea/save controls with a single "Clear saved key"
   button. Notes a recommended divider `=== ANSWER KEY ===`.
2. `OPTION` refined to
   `/(?:^|\n|\s)([A-F])[^\S\n]*[.)][^\S\n]*|\n\s*([A-F])\s+(?=\d)/g`
   (whitespace via `[^\S\n]*`).
3. Adds `LOOSE` map for E/F: if `E`/`F` is not found as a normal option, look
   for a newline, optional spaces, the letter, whitespace, and a following
   non-space (`/\n[^\S\n]*E[^\S\n]+(?=\S)/`). Only applies when the preceding
   option (`D` for E, `E` for F) exists.
4. Section splitting (`splitSections(raw)`) new in C:
   - `KEY_LINE`: `^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*\(?([A-F])\)?\s*(?:[.)]\s*)?(?:$|[-–—/|:,;=]\s|\(|\[)`.
   - `PLACEHOLDER`: numbered entries whose value is missing/not given/n a/etc.
   - `STEM_LINE`: `^\s*\d{1,3}[.)]\s+\S.{11,}` (a plausible question stem).
   - `KEY_WORD`: `\b(ANSWERS?|KEY|SCHEME|SOLUTIONS?)\b`.
   - `INLINE_PAIR`: `(\d{1,3})\s*[.\-:)]\s*\(?([A-F])\)?(?![A-Za-z])`.
   - Boundary strategies in order: (a) divider line (3+ punctuation chars +
     KEY_WORD, short, no `?`, not numbered); (b) all non-empty lines are key
     lines → key-only; (c) header line containing KEY_WORD with following key
     lines / inline pairs; (d) structural: after the last stem line, a key-like
     line followed by a window of ≥3 key/inline-pair lines; else
     `{questions: raw, answers: '', how: 'none'}`.
   - `boundary()` includes the boundary line in answers when it is itself a key
     line or has ≥2 inline pairs.
5. Load handler rewritten:
   - Splits sections first, applies FIXES only to question text.
   - Parses questions from the question section and a key from the answer
     section.
   - If no questions but a key was found: saves/replaces the key, re-fills the
     current question, ticks, and leaves the queue unchanged ("Answer key
     only").
   - If questions found: applies header info, saves meta, replaces key (or
     clears it if no key detected), resets queue, shows first question, ticks,
     and reports key count or "no answer-key section detected".
6. `fillForm` E/F mapping: maps to Option D only if the E/F option text exists
   (A/B did so unconditionally, which could blank Option D); otherwise no
   correct radio is set.
7. `tick` handles key answers E/F for questions whose E/F were not merged into
   D: it checks `c.q[a.toLowerCase()]`, and if present sets index 3 with the
   note "(Option E/F was placed in Option D)"; if absent, tells the user to
   pick manually. `cur()` now returns the full question object as `q`.

## Parsing behavior (code inspection only)

- One-box input; auto-detects key section via divider, header words, or
  structural fallback.
- Supports key-only paste (updates key without discarding the queue).
- Option labels tolerate whitespace/punctuation variants; E/F have a loose
  newline-based fallback.
- Key line parsing still uses `parseKey` regex (same as A/B).

## Known issues (from `trusted-variant-C-KNOWN_ISSUES.md`)

- None specifically documented; limited testing time but likely sufficient.
- Other merged iterations exist but were not supplied.

## Notes / limitations observed in code

- `splitQuestions` unchanged: question numbers must be dotted (`N.`).
- Key detection is heuristic; a misdetected boundary is flagged only via the
  status message, not a hard error.
- `parseKey` unchanged: matches `number` then optional separators then `A–F`,
  so unusual key layouts may still be missed.
