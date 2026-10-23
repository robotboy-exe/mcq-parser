# Phase 3 raw extraction — qwen-1-migration.md

Source: `archive/migration-docs/qwen-1-migration.md`.

## Edge cases (as stated)

| # | Short name | Trigger | Expected / status in doc |
|---|---|---|---|
| Q1-EC01 | Lowercase/punctuation start | Question starts with punctuation/lowercase, e.g. `34. ...... was born` | Splits correctly, no merge into previous question |
| Q1-EC02 | Header false positive | Header contains option-like letters (`C. R. K.`, `A 5 year old`) | Header not parsed as question or Option A/C |
| Q1-EC03 | Missing dot OCR | `A 75 years` instead of `A. 75 years` | Parsed as Option A |
| Q1-EC04 | 5/6 options with key | E/F options, key loaded | Correct E/F promoted to D; original D dropped |
| Q1-EC05 | 5/6 options no key | E/F options, no key | E/F appended to D preserving letters (`E. text`) |
| Q1-EC06 | Late key load | Key saved after questions loaded | Current question re-evaluated and cleaned |
| Q1-EC07 | Page scroll | Save via AJAX | Page does not scroll to top |
| Q1-EC08 | Duplicate UI ID | Bookmarklet clicked multiple times | Old DOM removed before new injection |

## Invariants (as stated)

1. PHP backend form accepts exactly 4 options (`option_a`–`option_d`).
2. PHP validates all 4 options filled and each ≤500 characters.
3. Bookmarklet activates only on "Add a New Question" (save_question form, no `edit=`).
4. Bookmarklet removes the server `<script src="ocr_helper.js">` and its injected DOM.
5. Success/error container `ans_res` is injected after the submit button, never hardcoded in the panel.

## Regression risks (as stated)

1. OPTION dual-condition regex: changing `^\s*` vs `\n\s*` breaks either dotless parsing or triggers prose false positives.
2. Subject overlap scoring can pick wrong subject.
3. AJAX success string coupling.
4. Appending E/F to D can exceed 500 chars; flags but does not truncate.

## Other stated decisions / notes

- No auto-scroll (user request).
- Bookmarklet must be minified to one line and prefixed with `javascript:`.
- Override mechanism must stay.
- Do not add E/F fields to the PHP form without DB schema update.
- State is in `localStorage` keys `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`.
