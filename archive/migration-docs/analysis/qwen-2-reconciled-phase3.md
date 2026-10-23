# Phase 3 raw extraction — qwen-2-reconciled.md

Source: `archive/migration-docs/qwen-2-reconciled.md`.

## Edge cases (E01–E30, as stated)

| ID | Short name | Trigger | Expected / status in doc |
|---|---|---|---|
| E01 | Inline options on one line | `A. love B. mercy C. redemption D. reconciliation` | Four clean options, no flags |
| E02 | Prose leading article + digit | Chunk starts `A 5 year old boy...` | `A` is stem, not an option |
| E03 | Dotless option after newline | `\nA 75 years` | Recognized as option A |
| E04 | E02 + E03 together | Both in one chunk | Exactly one option A, no duplicate flag |
| E05 | Empty option then next option | `C.` then `D. seek revenge` | `c=''`, `d='seek revenge'`, flag C missing only |
| E06 | Dotted option at absolute start | `A. 5 years` | Option A |
| E07 | Dotted option on new line | `\nB. 75` | Option B |
| E08 | Prose `A good example` | No dot/paren after A | Not an option |
| E09 | Missing question number | Head chunk with ≥2 option matches | `num=null`, flag missing number |
| E10 | Very short/missing stem | `question.length < 10` | Flag only |
| E11 | Overlong option | Any option >500 chars | Flag only (server would reject) |
| E12 | Repeated option letter | Same letter matched twice | Flag duplicate; post-processor does not clear it |
| E13 | Non-sequential/gapped numbering | `n<=last` or `n>last+5` | Marker skipped; can merge questions |
| E14 | Header-only preamble | <2 option matches in head | No pseudo-question chunk |
| E15 | CRK/C.R.K. header alias | Header contains CRK variants | Select CRS / CHRISTIAN RELIGIOUS subject |
| E16 | Year in header | First `20\d\d` in first 3 lines | Written to `exam_year` |
| E17 | Fuzzy subject name | No alias match | Containment/word-overlap scoring; unverified accuracy |
| E18 | E/F with saved key | Key E/F | Collapsed into D; radio D checked; deliberate limitation |
| E19 | E/F without key | No valid key entry | E/F appended to D; no radio selected |
| E20 | Edit mode | URL contains `edit=` | Refuses to install |
| E21 | Logged out at submit | Reply contains `Administrator Login` | Specific re-login message |
| E22 | Server validation error | Reply contains `.admin-error` | Message surfaced in `#ans_res` |
| E23 | Network failure | `fetch` rejects | `NOT saved: network problem. Try again.` |
| E24 | Page reload mid-queue | `ocrQueue` in localStorage | Queue restored; current item refilled |
| E25 | Prior server error present | `.admin-error` on boot | Render status only; do not overwrite form |
| E26 | Legacy `ocrSubmitted` flag | Present in localStorage | Deleted; advance queue if no error; writer uncertain |
| E27 | CRLF/excess blank lines | `\r\n`, 3+ newlines | Normalized before parsing |
| E28 | Quoted/curly-quote stems | Q36/Q38 | Treated as ordinary stem text; no special handling |
| E29 | Underscore blanks in stem | `-----`, `__` | Left as-is |
| E30 | Continuation instruction before number | `According to Matthew...` before `12.` | Stays on previous chunk; inferred/unaddressed |

## Invariants (as stated, 1–28)

1. Remove/override `ocr_helper.js` and legacy `#ocr_input`/`#ans_panel`.
2. Refuse edit page; require Add-a-New-Question form.
3. Form must contain `input[name=action][value=save_question]`.
4. Form must contain `input[name=correct_option]` radios.
5. URL must not contain `edit=`.
6. Main option regex recognizes uppercase A–F only; page accepts four options / radios 0–3.
7. Correct-option radio values are 0–3.
8. Leading article must never be an option unless it has `.` or `)`.
9. Dotless-letter exception only after newline and followed by digit; never at `^`.
10. Inline options must remain supported.
11. Newlines must survive normalization; blanket whitespace collapse before matching forbidden.
12. Dual capture handling `const letter = m[1] || m[2]` must remain.
13. E/F answers merge into Option D; correct index 3.
14. Empty option reported as that option missing; later label not left in previous field.
15. Option text written to form must not carry its own label.
16. Flags are advisory; must not silently block the queue.
17. localStorage keys: `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`.
18. `subject_id`, `exam_category_id`, `exam_year` carried via `ocrMeta`.
19. Queue structure `{items: [], i: 0}`.
20. Meta fields `['subject_id','exam_category_id','exam_year']`.
21. Answer-key lookup by printed book number, not queue position.
22. FIXES applied before parsing.
23. Submit intercepted in capture phase so the live handler does not double-submit.
24. CSRF token submitted unchanged.
25. After save, clear `question_image`, `answer_video`, `answer_explanation`.
26. Success detected by `/Question saved successfully \(Question ID: (\d+)\)/`.
27. Failure detected by `.admin-error` or "Administrator Login".
28. Server limits: 4 non-empty options, ≤500 chars, correct_option 0–3, year 1900–2100.

## Regression risks / uncertainties

- R01 whitespace consumption at match boundaries; post-processor rescue.
- R02 `^` in dotless branch re-breaks Q35.
- R03 blanket whitespace collapse breaks newline matching.
- R04 strict start/newline-only regex breaks inline Q20.
- R05 post-processor heuristic can split prose; no digit lookahead.
- R06 post-processor does not recompute count/pos.
- R07 `pos` last-write-wins.
- R08 numbering gap heuristic skips genuine gaps.
- R09 E/F handling lossy.
- R10 `tick()` for E/F computes radio 4/5 (does not exist).
- R11 fetch success-string vs PRG uncertain.
- R12 repeated injection creates new interval/DOM.
- R13 subject fuzzy matching wrong subject.
- R14 year first-match may pick wrong year.
- R15 localStorage is origin-wide and shared.
