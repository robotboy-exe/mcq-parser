# Edge Cases

Extracted from the archived migration docs and cross-referenced against the
baseline code (`src/parser/parser.js`, `src/ui/ui.js`, derived from
`archive/trusted-variants/trusted-variant-C.js`). No edge case here was
invented; every row cites its source document.

Status definitions:

- **CONFIRMED** — stated in a migration doc and present in the baseline code.
- **UNVERIFIED** — stated in a migration doc but not exercised/confirmed by the
  baseline code or by any recorded live run.
- **CONFLICTED** — docs disagree, or the behavior differs between archived
  versions.

## A. Question splitting and option parsing

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-01 | Lowercase/punctuation question start | `34. ...... was born` / stem starts lowercase | Split correctly; not merged into previous question | CONFIRMED | qwen-1-migration §3 |
| EC-02 | Header false positive | Header contains option-like letters (`C. R. K.`, `A 5 year old`) | Header is not parsed as a question or Option A/C | CONFIRMED | qwen-1-migration §3; qwen-2-reconciled E02, E08, E14 |
| EC-03 | Dotless option after newline | `\nA 75 years` (no dot after A) | Recognized as Option A | CONFIRMED | qwen-1-migration §3; qwen-2-reconciled E03; trusted-variant-A known issues |
| EC-04 | Prose leading article + digit | Chunk starts `A 5 year old boy...` | `A` stays in the stem, not Option A | CONFIRMED | qwen-2-reconciled E02 |
| EC-05 | Prose article + dotless option together | `A 5 year old...` followed by `\nA 75 years` | Exactly one Option A; no duplicate flag | CONFIRMED | qwen-2-reconciled E04 |
| EC-06 | Dotted option at absolute start | `A. 5 years` | Option A | CONFIRMED | qwen-2-reconciled E06 |
| EC-07 | Dotted option on new line | `\nB. 75` | Option B | CONFIRMED | qwen-2-reconciled E07 |
| EC-08 | Prose `A good example` | No dot/paren after A | Not an option | CONFIRMED | qwen-2-reconciled E08 |
| EC-09 | Inline options on one line | `A. love B. mercy C. redemption D. reconciliation` | All four options split; no flags | CONFIRMED | qwen-2-reconciled E01 |
| EC-10 | Option text on line after label | `A.` then text on next line | Text attaches to A; A is not missing | CONFIRMED | claude-migration §3 (case 8) |
| EC-11 | Empty option label then next option | `C.` empty, then `D. seek revenge` | `c=''`, `d='seek revenge'`, flag `option C missing` only | CONFIRMED | qwen-2-reconciled E05; claude-migration §3 (case 7) |
| EC-12 | Duplicate option letter | Same letter matched twice | Flag `a letter appears twice (merged questions?)` | CONFIRMED | qwen-2-reconciled E12; claude-migration §3 (case 18) |
| EC-13 | Letter-like text in stem/option | `Vitamin C.` or `Vitamin B-12` in prose/option | Ideally nothing treated as an option; no guard exists | UNVERIFIED | claude-migration §3 (case 17), §5; qwen-2-reconciled R05 |
| EC-14 | Option-splitting post-processor removed | Any option containing a later letter label | Not split; post-processor stays removed | CONFIRMED | claude-migration §3 (case 16), §5 |
| EC-15 | Overlong option | Any option over 500 characters | Flag only; server would reject | CONFIRMED | qwen-2-reconciled E11; claude-migration §3 (case 21) |
| EC-16 | Very short/missing stem | `question.length < 10` | Flag `question text missing or very short` | CONFIRMED | qwen-2-reconciled E10; claude-migration §3 (case 21) |
| EC-17 | CRLF / excess blank lines | `\r\n`, 3+ consecutive newlines | Normalized before parsing | CONFIRMED | qwen-2-reconciled E27 |
| EC-18 | Quoted/curly-quote stems | Q36/Q38-style quoted text | Treated as ordinary stem text; quotes not stripped | CONFIRMED | qwen-2-reconciled E28 |
| EC-19 | Underscore blanks in stem | `-----`, `--- and ---`, `__` | Left as-is in the question text | CONFIRMED | qwen-2-reconciled E29 |
| EC-20 | Leading chunk without number | Head block with ≥2 option markers | Queued with `num=null`; flag `question number missing` | CONFIRMED | qwen-2-reconciled E09; claude-migration §3 (case 20) |
| EC-21 | Non-sequential/gapped numbering | `n <= last` or `n > last + 5` | Candidate marker skipped; text absorbed into previous chunk | CONFIRMED | qwen-2-reconciled E13; claude-migration §3 (case 19) |
| EC-22 | Header-only preamble | Fewer than 2 option matches in head | No pseudo-question chunk | CONFIRMED | qwen-2-reconciled E14 |
| EC-23 | Continuation instruction before number | `According to Matthew...` before `12.` | Stays at the end of the previous chunk | CONFIRMED | qwen-2-reconciled E30 |

## B. Answer-key section

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-24 | Key-only paste | Every non-empty line looks like a key line | Replace key, keep queue, refill current question | CONFIRMED | claude-migration §3 (case 1) |
| EC-25 | Divider line | `=== ANSWER KEY ===` style line | Split at that line | CONFIRMED | claude-migration §3 (case 2) |
| EC-26 | Header-style key | `ANSWERS` header then key lines | Split at header (fragile heuristic) | CONFIRMED | claude-migration §3 (case 3) |
| EC-27 | Structure-only key | Key-like run after last question | Split there (fragile heuristic) | CONFIRMED | claude-migration §3 (case 4) |
| EC-28 | Several answers per line | `1.A 2.B 3.C` | All pairs read | CONFIRMED | claude-migration §3 (case 5) |
| EC-29 | Placeholder key line | `5. [missing]` | Counted for splitting; produces no key entry | CONFIRMED | claude-migration §3 (case 6) |
| EC-30 | New paste key lifecycle | Questions with key / questions without key | Replace old key / clear old key | CONFIRMED | claude-migration §3 (case 22) |
| EC-31 | Late key load | Key applied after questions are loaded | Current question re-evaluated | CONFIRMED | qwen-1-migration §3 |
| EC-32 | Key text with explanations | Extra digit+letter pairs in key explanations | Could create bogus key entries | UNVERIFIED | claude-migration §8 (issue 8) |

Note for EC-31: the baseline merged UI has no separate "Save key" button; the
equivalent path is a key-only paste, which reloads the key and refills the
current question.

## C. E/F options and answers

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-33 | E/F with key, E correct, dotted | Key says E; option is `E. Abraham` | Option D becomes `Abraham`; D radio ticked | CONFIRMED | claude-migration §3 (case 9); qwen-2-reconciled E18 |
| EC-34 | E/F with key, E correct, dotless | Key says E; option is `E Abraham` | Same as EC-33 | CONFIRMED | claude-migration §3 (case 10) |
| EC-35 | E/F with key, E wrong, dotless | Key A–D; option is `E Abraham` | E removed, not merged into D | CONFIRMED | claude-migration §3 (case 11) |
| EC-36 | E/F with key, E wrong, dotted | Key A–D; option is `E. Abraham` | E removed | CONFIRMED | claude-migration §3 (case 12) |
| EC-37 | E/F without key | No valid key entry | E/F appended to D as `E. ...` / `F. ...`; no radio ticked | CONFIRMED | claude-migration §3 (case 13); qwen-2-reconciled E19 |
| EC-38 | Key says E but no E text | Key E, no E option text loaded | D left alone; nothing ticked; manual-pick message | CONFIRMED | claude-migration §3 (case 14) |
| EC-39 | Loose E/F detection | Line starting with lone `E`/`F` + whitespace + text after D/E | Recognized as E/F; fragile | CONFIRMED | claude-migration §3 (case 15) |
| EC-40 | Legacy E/F tick radio mapping | Key E/F with the older variants (A/B) | B computes radio values 4/5 (nonexistent); C maps E/F to D (value 3) | CONFIRMED | qwen-2-reconciled R10/U01; claude-migration §2, §9; PHP enforces radios 0–3 |

## D. Header metadata

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-41 | CRK / CRS alias | Header contains CRK or CRS variants, including `CHRISTIAN RELIGIOUS STUDIES` | Select CRS / CHRISTIAN RELIGIOUS subject; the current live list contains `CRS` (id 14), so the alias selects it | CONFIRMED | qwen-2-reconciled E15; user request 2026-10-24; `archive/live-sources/subjects-select-2026-10-23.html`; harness uses that list |
| EC-42 | Year in header | First `20\d\d` in first 3 lines | Written to `exam_year` | CONFIRMED | qwen-2-reconciled E16 |
| EC-43 | Fuzzy subject name | No alias match | Containment / word-overlap scoring | UNVERIFIED | qwen-2-reconciled E17 |
| EC-44 | Year typo/missing year | `2O21` (letter O) or no `20\d\d` match | No year written; server rejects if `exam_year` is empty/out of 1900–2100; flag/UI does not validate range | CONFIRMED | qwen-2-gaps; `admin_questions.php` range check |
| EC-61 | Header year false positive | Header contains an earlier `20\d\d` such as a copyright/reference year | First `20\d\d` wins and is written to `exam_year`; no check that it is the exam year | CONFIRMED | qwen-2-reconciled R14 |

Note: EC-61 was present in the raw phase-3 notes (qwen-2 R14) and was added to
this table during review.

## E. UI, queue, and state

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-45 | Reset Queue | Click after loading a queue | No error; queue `{items:[],i:0}`; key, `ansKeyBatch`, `ansKeyConflicts`, and `batchId` are also cleared (D-30 supersedes D-26) | CONFIRMED | claude-migration §3 (case 23); user decision 2026-10-25; `src/ui/ui.js` |
| EC-46 | Edit page | URL contains `edit=` | Alert; bookmarklet does not install | CONFIRMED | qwen-2-reconciled E20; claude-migration §3 (case 24) |
| EC-47 | Page reload mid-queue | `ocrQueue` present in localStorage | Queue indexed restored; current item refilled | CONFIRMED | qwen-2-reconciled E24 |
| EC-48 | Prior server error present | `.admin-error` on boot | Text fields are not refilled and the status is rendered; `tick()` still runs and may tick the correct-option radio from the saved key | CONFIRMED | qwen-2-reconciled E25; src/ui/ui.js |
| EC-49 | Duplicate UI cleanup | Bookmarklet clicked again | Remove old `ocr_helper.js`, `#ocr_input` `.admin-field`, `#ans_panel` before injecting | CONFIRMED | qwen-1-migration §3; qwen-2-reconciled invariant 1 |
| EC-50 | Repeated injection interval | Click repeatedly | New interval/DOM each time (inferred risk) | UNVERIFIED | qwen-2-reconciled R12 |
| EC-51 | Legacy `ocrSubmitted` flag | Flag present in localStorage at boot | Ignored; the bookmarklet does not read, delete, or advance on it (D-27) | CONFIRMED | qwen-2-reconciled E26/U03; user decision; `src/ui/ui.js` |
| EC-52 | Page scroll on save | Save via AJAX | Page stays in place; no auto-scroll | CONFIRMED | qwen-1-migration §3 |
| EC-53 | Media-required question | Diagram/video needed | Cannot be created via bookmarklet; attach later in native Edit UI | CONFIRMED | qwen-2-gaps §4 |
| EC-54 | Newlines in Option D | E/F appended to D | `option_d` is `<input type=text>`; the browser strips `\n\n` | CONFIRMED | claude-migration §8 (issue 3); `admin_questions.html`, `admin_questions.php` |
| EC-62 | Old-format queue after update | `ocrQueue` written by an older variant | Shape is shared, but old items may lack `e`/`f` or contain old misparses; no version marker exists. Reset and re-paste after updating until a migration/version check exists | UNVERIFIED | `archive/migration-docs/claude-gaps.md` item 6 |

## F. Saving and server

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-55 | Logged out at submit | Response contains `Administrator Login` | Targeted re-login message | CONFIRMED | qwen-2-reconciled E21; claude-migration §3 (case 25) |
| EC-56 | Server validation error | Response contains `.admin-error` | Error text surfaced in `#ans_res` | CONFIRMED | qwen-2-reconciled E22 |
| EC-57 | Empty option hard rejection | An option is empty and user saves | PHP rejects: "Please fill in all four answer options." The manual form's native `required` blocks submission first, and the auto-save gate blocks an empty option too; the PHP error is reachable only when native validation is bypassed (live 2026-10-25) | CONFIRMED | qwen-2-gaps §3; `admin_questions.php`; live finding 2026-10-25 |
| EC-58 | Network failure | `fetch` rejects | `NOT saved: network problem. Try again.` | CONFIRMED | qwen-2-reconciled E23; claude-migration §3 (case 25) |
| EC-59 | PRG success detection | POST returns redirected GET with session flash | Success regex matches the flash text | CONFIRMED | `admin_questions.php` stores the flash, redirects, and renders it; qwen-2-gaps §1 |
| EC-60 | Category limit | More than 10 active categories | Dropdown only exposes `id <= 10`; matcher cannot select beyond | CONFIRMED | qwen-2-gaps §5; `admin_questions.php` query |
| EC-63 | Live `questions` schema mismatch | PHP inserts into `questions`; only schema evidence is a `questions1` dump with required `practice_title` | Whether live `questions` has that required column is unknown; if it does, every save would fail | UNVERIFIED | `archive/migration-docs/claude-gaps.md` item 7; `admin_questions.php` insert |

## G. Auto-Save

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-64 | Gap in the queue | Loaded numbers include a gap (`1,2,4`) | Auto stops at the first question with `The question numbers are not consecutive`; nothing is saved | CONFIRMED | D-33; mock check 2026-10-25 |
| EC-65 | E/F key letter in the middle | Key letter for a middle question is E or F | Earlier questions save; the loop stops on that question with `the form has only four options`; a manual save can resume the run | CONFIRMED | D-33; mock check 2026-10-25 |
| EC-66 | Legacy queue without `batchId` | Queue loaded by an older variant or key without `ansKeyBatch` | Manual use works; auto stops with `no batch identity` or `key belongs to a different batch` | CONFIRMED | D-32; mock check 2026-10-25 |
| EC-67 | Ambiguous save | Timeout, network error, empty reply, or redirected page without a fresh success | Marker stays, Start stays disabled, no retry, warning asks the user to check the list | CONFIRMED | D-33; `tests/unit.js`; mock check 2026-10-25; live network loss 2026-10-25 (#1519 saved once, question 2 ambiguous, no retry) |
| EC-68 | Stale success flash | Reply has a success ID not greater than the saved log | Classified Ambiguous, not Saved; nothing is logged or advanced | CONFIRMED | `tests/unit.js`; D-33 |
| EC-69 | Saved in the wrong state | Auto save's `?edit=` state does not match the run mode | Red `SAVED AS ACTIVE` warning in draft mode or `SAVED AS INACTIVE` in active mode; the run stops, but the save is logged and the queue advances so it is not repeated | CONFIRMED | D-31, D-39; mock check 2026-10-25 |
| EC-70 | Duplicate question | Number already in this batch's log, or the same subject, year, category and text matches a loaded recent row (139-char prefix for a truncated row) | The run stops and shows the duplicate reason; it is not silently skipped | CONFIRMED | D-34; `tests/unit.js` |
| EC-71 | Second tab lock | Another tab holds `autoLock` less than 15 seconds old | Start is refused with `Another tab is auto-saving`; a lock older than 15 seconds is ignored | CONFIRMED | D-33; `tests/unit.js`; mock check 2026-10-25. Live two-tab start paused tab 1 on hide before the lock could be observed (2026-10-25) |
| EC-72 | Hidden tab during a run | Tab becomes hidden while a save is in flight | The current save finishes, the run pauses with the hidden-tab message, and nothing else starts; no auto-resume | CONFIRMED | D-33; mock check 2026-10-25; live two-tab test 2026-10-25 |

## Conflicts and open statuses

No edge case remains CONFLICTED. The former conflicts and server-side gaps were
closed by the archived PHP/HTML sources:

- **EC-40** — the older two-textarea variants are still a documented version
  difference (B computes radios 4/5; baseline C maps E/F to D/3). The PHP
  confirms only radios 0–3 exist, so baseline C is correct.
- **EC-41** — the current live subject list contains `CRS` (id 14), so the CRK
  alias selects it. The harness uses the archived list. English (Oral) and
  English Language are separate options and resolve correctly.
- **EC-59** — the archived PHP stores the flash in the session, redirects, and
  renders it in the redirected page, so the fetched response contains the
  success text.
- EC-44, EC-54, EC-57, and EC-60 are now confirmed directly from
  `archive/live-sources/admin_questions.php` and `admin_questions.html`.
- EC-62 and EC-63 remain UNVERIFIED: both need live state, not another code
  reading. EC-62 needs an old queue sample; EC-63 needs the live `questions`
  schema.
- EC-64…EC-72 are CONFIRMED by `tests/unit.js`, the 2026-10-25 mock-browser
  checks, and the 2026-10-25 live 3-question test (inactive saves, real network
  loss, server rejection with a stale success, and the hidden-tab pause). The
  two-tab lock message could not be shown live on one phone browser; see EC-71.

## Counts

- Total: 72
- CONFIRMED: 66
- UNVERIFIED: 6
- CONFLICTED: 0
