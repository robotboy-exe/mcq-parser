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
| EC-19 | Underscore blanks in stem | `-----`, `--- and ---`, `__` | Left as-is in the question text; only `========` lines are section dividers (D-46) | CONFIRMED | qwen-2-reconciled E29 |
| EC-20 | Leading chunk without number | Head block with ≥2 option markers | Queued with `num=null`; flag `question number missing` | CONFIRMED | qwen-2-reconciled E09; claude-migration §3 (case 20) |
| EC-21 | Non-sequential/gapped numbering | `n <= last` or `n > last + 5` | Candidate marker skipped; text absorbed into previous chunk | CONFIRMED | qwen-2-reconciled E13; claude-migration §3 (case 19) |
| EC-22 | Header-only preamble | Fewer than 2 option matches in head | No pseudo-question chunk | CONFIRMED | qwen-2-reconciled E14 |
| EC-23 | Continuation instruction before number | `According to Matthew...` before `12.` | Carried to the next chunk as `sectionInstruction` once an option block has started; never inside an option | CONFIRMED | qwen-2-reconciled E30; RM01 `region-footer-instruction` |
| EC-95 | Comprehension prose before the first stem | `PASSAGE III` plus paragraphs, then `11.` | Prose becomes the context text and never an option or pseudo-question | CONFIRMED | OT08; `sample-comprehension-passage3` |
| EC-96 | Dotted initials and A.D. in passage prose | `J. A. Adeyemi`, `1960 A.D.` | Remain context text; no letter option, no extra item | CONFIRMED | OT08; `sample-comprehension-incomplete` |
| EC-97 | Incomplete parenthesized option set | `(a) one (b) two (c) three` | Stays in the stem with a warning; `(a)`-`(d)` parsed only as a complete ordered set | CONFIRMED | OT08; `sample-comprehension-incomplete`; `tests/unit.js`; restored after RM01 on 2026-11-22 |
| EC-98 | Heading with one linked candidate | `PASSAGE IV` + one question | Warning, no context, legacy parse unchanged | CONFIRMED | OT08; `sample-comprehension-ambiguous`; restored after RM01 on 2026-11-22 |
| EC-99 | Several passages plus standalone items | Two headings with items before and between | One context per heading with its own targets; standalone items keep no reference | CONFIRMED | OT08; `sample-comprehension-multi` |

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
| EC-42 | Year in header | First `19\d\d` or `20\d\d` in first 3 lines | Written to `exam_year` for 1900–2099 | CONFIRMED | D-66; fixture `header-year-1994`; qwen-2-reconciled E16 |
| EC-43 | Fuzzy subject name | No alias match | Containment / word-overlap scoring | UNVERIFIED | qwen-2-reconciled E17 |
| EC-44 | Year typo/missing year | `2O21` (letter O) or no `19\d\d`/`20\d\d` match | No year written; server rejects if `exam_year` is empty/out of 1900–2100; flag/UI does not validate range | CONFIRMED | qwen-2-gaps; `admin_questions.php` range check |
| EC-61 | Header year false positive | Header contains an earlier 1900–2099 copyright/reference year | First matching year wins and is written to `exam_year`; no check that it is the exam year | CONFIRMED | D-66; qwen-2-reconciled R14 |
| EC-84 | Period-separated exam acronym | Header uses `S.S.C.E.`, `W.A.S.S.C.E.`, `W.A.E.C.`, `N.E.C.O.`, `G.C.E.`, `J.A.M.B.`, `U.T.M.E.`, or `P.O.S.T. U.T.M.E.` | A local header copy is compacted before category matching; the period forms select the same live option as the bare form (`WASCE / NECO / GCE`, `JAMB / UTME`, or `POST UTME`). The header text and subject inference are unchanged | CONFIRMED | D-54; user request 2026-10-27; `fixtures/inputs/header-crs-ssce-periods.txt`; `tests/unit.js`; `tests/runner.js` 2026-10-27 |

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
| EC-53 | Media-required question | Diagram/video needed | A shared stimulus image can be attached through the D-60 image plan; arbitrary video and other media still require the native Edit UI | CONFIRMED | qwen-2-gaps §4; D-60 |
| EC-54 | Newlines in Option D | E/F appended to D | `option_d` is `<input type=text>`; the browser strips `\n\n` | CONFIRMED | claude-migration §8 (issue 3); `admin_questions.html`, `admin_questions.php` |
| EC-62 | Old-format queue after update | `ocrQueue` written by an older variant | Shape is shared, but old items may lack `e`/`f` or contain old misparses; no version marker exists. A queue without `batchId` still loads and fills the form, but auto-save blocks with `This queue has no batch identity`; manual use remains possible. Reset and re-paste after updating until a migration/version check exists | CONFIRMED | `archive/migration-docs/claude-gaps.md` item 6; live V3 2026-10-25 |
| EC-82 | Active is the default | A new paste loads a batch | `Save as active` and the single batch confirmation start ticked; Start is enabled when the rest of the gate is clean. A metadata, key, or mode change clears only the confirmation and keeps the active choice. New paste or Reset restores both defaults | CONFIRMED | D-51; INV-71; browser check 2026-10-26 |
| EC-83 | Compact status and progress | Auto-save, dry run, or a saved batch | Status is one line, dry run prints one summary instead of one line per question, a progress bar shows the position, and the green saved box shows only the saved-range summary; details remain behind Copy saved list. Start is visibly dimmed when disabled | CONFIRMED | D-52; INV-84; browser check 2026-10-26 |
| EC-90 | Stale owner parser state | `cbtOwnerTool:v1` was parsed by another parser version | State is warned and remains byte-identical; key-only paste/native submit cannot re-version it; full paste or explicit Reset is required | CONFIRMED | D-66; `tests/owner-tool.js` |
| EC-91 | Native validation failure | Administrator edited stem formatting, paragraphs, options, or answer before a rejected save | Server-rendered posted values and preview remain; original queue text does not overwrite them | CONFIRMED | D-66; `tests/owner-tool.js`; desktop Chromium harness |
| EC-92 | Edit-page formatting | URL/action is Edit Question | Importer remains absent, formatting/preview works, and owner state is not written | CONFIRMED | D-66; `tests/owner-tool.js`; desktop Chromium harness |
| EC-93 | Overlapping/malformed underline | Selection overlaps an existing pair, or text contains uppercase/attributed/encoded/unmatched markers | Toolbar refuses overlap; unsupported markers remain literal and cannot create stored XSS | CONFIRMED | D-66; `tests/owner-tool.js` |

## F. Saving and server

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-55 | Logged out at submit | Response contains `Administrator Login` | Targeted re-login message | CONFIRMED | qwen-2-reconciled E21; claude-migration §3 (case 25) |
| EC-56 | Server validation error | Response contains `.admin-error` | Error text surfaced in `#ans_res` | CONFIRMED | qwen-2-reconciled E22 |
| EC-57 | Empty option hard rejection | An option is empty and user saves | PHP rejects: "Please fill in all four answer options." The manual form's native `required` blocks submission first, and the auto-save gate blocks an empty option too; the PHP error is reachable only when native validation is bypassed (live 2026-10-25) | CONFIRMED | qwen-2-gaps §3; `admin_questions.php`; live finding 2026-10-25 |
| EC-58 | Network failure | `fetch` rejects | `NOT saved: network problem. Try again.` | CONFIRMED | qwen-2-reconciled E23; claude-migration §3 (case 25) |
| EC-59 | PRG success detection | POST returns redirected GET with session flash | Success regex matches the flash text | CONFIRMED | `admin_questions.php` stores the flash, redirects, and renders it; qwen-2-gaps §1 |
| EC-60 | Category limit | More than 10 active categories | Dropdown only exposes `id <= 10`; matcher cannot select beyond | CONFIRMED | qwen-2-gaps §5; `admin_questions.php` query |
| EC-63 | Live `questions` schema mismatch | PHP inserts into `questions`; only schema evidence is a `questions1` dump with required `practice_title` | The live `questions` table accepts the archived INSERT columns: a controlled manual save succeeded and loaded from the edit page and filtered admin list. No `practice_title` requirement was observed | CONFIRMED | `archive/migration-docs/claude-gaps.md` item 7; `admin_questions.php` insert; live V2 2026-10-25 |

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

## H. Multi-year bank and hostile OCR

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-73 | Unnumbered bullet OCR | Questions use `*` bullets and no line-start `N.` marker exists | Bullet mode splits 19 items; each keeps `num: null`, gets `question number missing`, and the UI shows the flag; no number is invented | CONFIRMED | P08; `fixtures/inputs/anomaly-block1.txt`; `tests/runner.js` 2026-10-25; `tests/unit.js` |
| EC-74 | Fused question boundaries | A question number or option label is fused into surrounding OCR text | Guarded salvage repairs only boundary shapes when it adds at least 2 inserts and more question chunks; the repaired block yields 12 items with numbers `[null,2,3,4,7,8,9,12,13,14,15,16]` and 50 inserts, all flagged `OCR boundaries repaired; verify question and option split`; the strict result is kept otherwise | CONFIRMED | P07; `fixtures/inputs/anomaly-block2.txt`; `tests/runner.js` 2026-10-25; `tests/unit.js` |
| EC-75 | Multi-year bank paste | Two or more exam years are pasted as one block | Unsupported: one year per paste is the contract, because keys are matched to the current paste and cross-year text can merge or attach a key to the wrong year. Split with `node tools/extract-bank.js` into `bank-YYYY.txt`; the extractor verifies the source hash, anchors, counts, and output hashes | CONFIRMED | P02; SPEC §2; `tools/extract-bank.js --check` 2026-10-25 |
| EC-76 | Two-line answer heading | A 1900–2099 title such as `WASSCE C. R. K. 1994` or `2026` sits directly above the pure heading `OBJECTIVE ANSWERS` | The title block is dropped from the question part and kept in `boundary` metadata; it never extends the final option | CONFIRMED | D-44, D-66; `fixtures/inputs/bank-2026.txt`; `tests/runner.js`; `tests/unit.js` |
| EC-77 | Dotless `A` before dotted B–D | The unheaded single-question section has `A stay with them` with no dot, followed by `B.`, `C.`, and `D.` | The line is parsed as option A; the stem ends at `... begged Jesus to`. Leading articles such as `A 5 ...` and `A good ...` are not affected because the repair is not used at the start of the chunk | CONFIRMED | D-45; new bank source 2026-10-26; `fixtures/inputs/bank-pre-2026.txt`; `tests/runner.js` 2026-10-26 |
| EC-78 | Divider-only section line | A paste includes its surrounding `========` separators, including a trailing one | The dividers are blanked before slicing; Q29's D is `heal their sick.` with no `========`. The unheaded section stays separate from 2025 and 2026; multi-section paste is still unsupported | CONFIRMED | D-46; `fixtures/inputs/bank-pre-2026.txt`; `tests/runner.js` 2026-10-26 |
| EC-79 | Dotless B or C between dotted options | Q2 has `C spoke to him.` without a dot, between dotted B and D | The line is parsed as option C; B is not extended and no `option C missing` or duplicate-letter flag is raised, so Auto-Save is not blocked by this question | CONFIRMED | D-47; new edge cases 2020 Q2; `fixtures/inputs/new-edge-dotless-c.txt`; `tests/runner.js` 2026-10-26 |
| EC-80 | Year abbreviation looks like an option | The stem contains `597 B.C.` or `A.D. 70` | The `B.` or `A.` inside the abbreviation is ignored; the real options remain A–D and no duplicate-letter flag is raised, so Auto-Save is not blocked by this question | CONFIRMED | D-48; new edge cases Q18; `fixtures/inputs/new-edge-year-abbreviation.txt`; `fixtures/inputs/new-edge-year-abbreviation-ad.txt`; `tests/runner.js` 2026-10-26 |
| EC-81 | Slash option separator on any letter | Q17 has `A/ books of the prophets`; an all-slash block uses `A/ ... B/ ... C/ ... D/ ...` | A spaced slash after an A–F label is normalized to a dot before scanning, so A–D parse correctly inline or at line start; `A/B`, `and/or`, fractions, and dates are not matched | CONFIRMED | D-49; new edge cases Q17; `fixtures/inputs/new-edge-slash-option-a.txt`; `fixtures/inputs/new-edge-slash-all-options.txt`; `tests/runner.js` 2026-10-26 |
| EC-85 | Initials inside option text | Q46 has `B. K. A. Gbedemah` and `C. E. F. Small`; another question has `B. Dr. A. Adebayo` and `C. Prof. E. Smith` | The outer A–D labels win; the inner initials stay in options B and C, no Option E/F is created, and no duplicate-letter flag is raised | CONFIRMED | D-55; `fixtures/inputs/new-edge-initials-q46.txt`; `fixtures/inputs/new-edge-single-initials.txt`; `tests/unit.js`; `tests/runner.js` 2026-10-27 |
| EC-86 | Second A–D set and inline number | A block contains a second full A–D set, with or without a visible `2.` between the sets | Without a visible number the item stays one question and gets `a letter appears twice (merged questions?)`. A visible `2.` suppresses the warning and is not split inline; no second queue item is created | CONFIRMED | D-55; `fixtures/inputs/new-edge-duplicate-labels.txt`; `tests/unit.js`; `tests/runner.js` 2026-10-27 |
| EC-87 | Shared table between questions | A table follows Q13 with `Use the information below to answer questions 14 and 15` | The intro and table are removed from Q13; Q13.D is `leads to a reduction in price`; Q14/Q15 get `needsImage`; one stimulus has `nums: [14,15]`; the key is unchanged | CONFIRMED | D-59; `fixtures/inputs/new-edge-shared-stimulus.txt`; `tests/runner.js` 2026-10-28 |
| EC-88 | Marker placement fallback | `[image]`/`[[image]]` appears before, after, inside, alone, inline, or far from a table | A standalone marker uses an adjacent block first, then the nearest block in the same question chunk forward/backward; an inline marker removes only itself. The eight-question fixture yields 8 stimuli, `needsImage` `[2,3,4,6,7,8]`, and Q8 keeps `Some explanatory paragraph that stays.` | CONFIRMED | D-59; `fixtures/inputs/stimulus-marker-placements.txt`; `tests/unit.js`; `tests/runner.js` 2026-10-28 |
| EC-89 | Image plan gate | A detected block has no file/range, a range names a number outside the paste, or a `needsImage` question is not covered | Auto-save blocks with `stimulus-unassigned`, `stimulus-range`, or `image-required`; a generic row cannot satisfy a detected block; a ready covering row clears the gate | CONFIRMED | D-60; `tests/unit.js` 2026-10-28 |
| EC-94 | Paragraph next to removed stimulus | A real blank-line paragraph surrounds a marker/table, or an inline table has no blank boundary | Real boundary remains; removing an inline block does not invent a paragraph | CONFIRMED | D-66; `tests/unit.js` |
| EC-100 | Supplied cloze table | SECTION 6 instruction, ten gap runs, A–D header, ten option rows | One cloze context with ten `[[gap:N]]` tokens and ten linked items carrying the transcribed options | CONFIRMED | D-68; `sample-cloze-section6`; `tests/unit.js` |
| EC-101 | Columns disagree with the header | Row labels shift the data starts, or an overlong cell runs into the next column | Column starts come from row evidence; the overflowing cell keeps both words instead of being cut | CONFIRMED | D-68; `sample-cloze-section6` row 78; `tests/unit.js` |
| EC-102 | Incomplete or mismatched cloze table | A row lacks an option, or the row numbers differ from the passage gaps | Warning names the problem and the whole table stays on the legacy path; no partial context or guessed option | CONFIRMED | D-68; `sample-cloze-missing-column`; `sample-cloze-mismatch`; `tests/unit.js` |
| EC-103 | Cloze option limits | A cell is empty or longer than the 500-character server column | The group is refused with a warning before any native save | CONFIRMED | D-68; `sample-cloze-long-cell`; `tests/unit.js` |
| EC-104 | Tabs or mixed context families | Rows use tabs, or a cloze table is pasted with a comprehension passage | Tabs expand to column stops; both contexts coexist as `ctx-1…` in paste order with no numbering-gap flag between them | CONFIRMED | D-68; `sample-cloze-tabs`; `sample-cloze-mixed`; `tests/unit.js` |
| EC-105 | Cloze row number repeats an ordinary question | The paste carries an ordinary question numbered the same as a table row | Warning names the colliding numbers; the whole group stays legacy with its rows parsed as ordinary questions; no partial context, no optionless member, and any other cloze group keeps its links | CONFIRMED | D-69; `tests/unit.js` collision tests |
| EC-106 | Two cloze groups share gap numbers | Two fully evidenced cloze groups in one paste repeat the same row numbers (for example both 71-72) | The first group keeps its context and every member; every later colliding group is dropped whole with a warning naming its gap numbers; no zero-member context, and the dropped rows do not become ordinary questions | CONFIRMED | D-70; `tests/unit.js` duplicate-group tests |
| EC-107 | Multiple saved contexts match one paste | More than one saved context matches all hard gates | No auto-bind; the owner picks one from `#context_id` or the parsed-context selector; the selected server context is authoritative | CONFIRMED | D-73; `tests/owner-tool.js` adoption tests |
| EC-108 | Paste header has no pool metadata | Subject/category/year cannot be inferred | The card stays editable and the native Create/Update path is used; no auto-bind on empty gates | CONFIRMED | D-73; `tests/owner-tool.js` manual-selection test |
| EC-109 | Saved context member count differs | `expected_member_count` differs from the saved `member_count` | A visible warning names both counts; the context is still adopted and linked saves stay available | CONFIRMED | D-73; `tests/owner-tool.js` mismatch test |
| EC-110 | Context payload is unavailable | The context schema or member query is missing | The payload is omitted; auto-adoption and member dedupe are skipped; manual selection and native creation still work | CONFIRMED | D-73; `admin_questions.php` guarded payload; PHP tests |
| EC-111 | Duplicate context editors appear equivalent | A parsed context is shown in both JavaScript draft fields and the native PHP form | Only the native Shared Context card is rendered as an editor; paste or Add Context reveals it, and the multi-context selector switches that same form | CONFIRMED | D-74; owner Brave/Android finding 2026-11-09; `tests/owner-tool.js`; Chromium 155 DOM check |
| EC-112 | New context blocks question save without an explanation | A pasted linked question points to a context that has no saved ID | Save Question remains tappable; click and submit are cancelled before a post and say exactly `Save the shared context first.` | CONFIRMED | D-75; `tests/owner-tool.js` native-click/default-submit regression |
| EC-113 | Context pool differs from paste metadata | The owner links or manually selects a context with another subject, exam, or year | The selected/linked context fills all three native question fields; a later standalone question returns to paste metadata | CONFIRMED | D-75; `tests/owner-tool.js` metadata regressions |
| EC-114 | Saved or failed context editor takes phone space | A context create/update succeeds, fails, or returns an unconfirmed flash | Exact success collapses the card behind Show; failure or ambiguity reopens the exact pending card, including the second of several contexts | CONFIRMED | D-75; `tests/owner-tool.js` context visibility regressions |
| EC-115 | Link fields blend into question fields | The owner reviews the long native form on a phone | Shared-text ID/order/gap fields have one semantic visual boundary; all remaining question fields have another | CONFIRMED | D-75; `tests/owner-tool.js`; `tests/context-admin.php`; owner phone visual re-check accepted 2026-11-13 |
| EC-116 | Technical owner copy hides the next action | A parser flag, warning, storage problem, or server validation error appears | The UI translates it to short plain text while preserving all validation reasons and leaving parser/fixed-flash contracts unchanged | CONFIRMED | D-75; `tests/owner-tool.js`; PHP context tests |
| EC-117 | Preview is far from the loaded stem | A normal, linked, Add, or Edit question is loaded | The one safe preview sits beside Question Text and follows every programmatic fill/reset | CONFIRMED | D-75; `tests/owner-tool.js` placement/refresh tests |
| EC-118 | Second full paste inherits the first paste | A headered/context paste is followed by a full paste with no inferable pool or passage | Native subject/category/year, link fields, and the shared-text editor are cleared before the second parse; no stale value survives. A key-only paste still keeps the queue and contexts | CONFIRMED | D-77; `tests/owner-tool.js` full-repaste regression |
| EC-119 | Two passages share a title | Saved and pasted passages have the same pool/type/title but different text | No auto-bind. Whitespace and exact lowercase underline markers are ignored, but the full normalized passage must match | CONFIRMED | D-77; `tests/owner-tool.js` full-identity regressions |
| EC-120 | Duplicate warning becomes a save gate | A question matches a latest-20 question, or a new/edited shared text matches a saved full identity | The notice names the other saved ID and Save stays enabled; Shared Text edit excludes its own ID; no pending write, overwrite, skip, or server rejection is added | CONFIRMED | D-77; `tests/owner-tool.js`; `tests/context-admin.php` |
| EC-121 | Shared-text page two hides link choices | More than 10 shared texts exist and the management table shows `context_page=2` | The table shows 10/page, while the question selector uses a separate all-context option list and still includes contexts from every page | CONFIRMED | D-78; `tests/context-lib.php`; `tests/context-admin.php` |
| EC-122 | Manual saved context needs an order/gap | A question selects a saved reading or cloze context without an existing position/slot | The first unused passage number is filled; cloze also receives the first unused token. Existing values stay. The saved context type overrides a parsed local type | CONFIRMED | D-78; `tests/owner-tool.js` next-free/type tests |
| EC-123 | Consolidated workflow appears as tabs or puts the passage editor below its question | The owner opens Add or Edit Question after consolidation | Add stays one vertical page: paste controls, Edit Shared Text, the light-blue link group/question form, Saved Shared Texts, then All Questions. Edit Question shows formatting/preview only and server-hides shared-text management and All Questions | CONFIRMED | D-76, D-79; `tests/owner-tool.js` layout/edit tests; focused mobile-width Chromium 2026-11-12 |
| EC-124 | Saved shared-text edit is replaced by restored state or Use Paste | The form is in `update_context` mode and the owner restores state or taps Use Paste | The saved editor keeps its title, text, pool, count, action, and context ID. Use Paste fills only `save_context` drafts. Amber draft and blue edit styling make the modes explicit. | CONFIRMED | D-79; `tests/owner-tool.js` draft/saved-mode regressions; `tests/context-admin.php` render assertions |
| EC-125 | One cloze row is one character left | The table has stable modal starts, but one row has at least two later starts at modal-minus-one and an earlier single-space separator | Only that row's non-exact boundaries move left one character; `new-sample.txt` gap 75 becomes `confession / suggestion / permission / complaint`, while strict missing-column refusal remains | CONFIRMED | D-80; `sample-cloze-left-drift`; runner/unit regressions |
| EC-126 | A second parsed shared text appears impossible to save | The first context in full `sample-passages.txt` is adopted or just saved, then the editor returns to its current reading question while the cloze context remains unsaved | The labelled editor selects and opens `SECTION 6`; after its explicit save, Q71 posts with context position 1 and slot 71 | CONFIRMED | D-81; `tests/owner-tool.js` full-sample save-flow regressions; local staging PRG probe |

Known limits of the archived blocks: block 2 still omits Q5, Q6, Q10, and Q11; Q1 is unnumbered; Q16 has only A/B and keeps `202.` in A. Block 1 is 19 bullets with no numbers. These limits are recorded, not repaired by guessing.

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
- EC-62 and EC-63 are now CONFIRMED from the 2026-10-25 live checks: a
  synthetic old queue loaded but auto-save blocked without a batch identity,
  and a controlled save on the live `questions` table succeeded and loaded.
- EC-64…EC-72 are CONFIRMED by `tests/unit.js`, the 2026-10-25 mock-browser
  checks, and the 2026-10-25 live 3-question test (inactive saves, real network
  loss, server rejection with a stale success, and the hidden-tab pause). The
  two-tab lock message could not be shown live on one phone browser; see EC-71.
- EC-73 and EC-74 are CONFIRMED by the archived hostile blocks and the fixture
  runner. EC-75 is a contract limit, not a parser defect: the bank extractor is
  the supported way to split sections. EC-77 and EC-78 are CONFIRMED by the
  unheaded single-question section between 2025 and 2026. It is its own
  divider-delimited section, not a stray part of either year, and has no key.
- EC-79, EC-80, and EC-81 are CONFIRMED by the new-edge fixtures for a dotless
  C, `B.C.`/`A.D.` year abbreviations, and slash labels; these previously
  produced flags that blocked Auto-Save.
- EC-82 and EC-83 are CONFIRMED by the 2026-10-26 browser check of the injected
  panel: default ticks, metadata clearing only the confirmation, the dimmed
  Start button, and the dry-run summary/progress.
- EC-84 is CONFIRMED by the unit and fixture checks for period-separated
  category acronyms; the header text and subject inference are unchanged.
- EC-85 and EC-86 are CONFIRMED by the Q46, single-initial, duplicate-label,
  and inline-number fixture/unit checks; the duplicate warning is now scoped to
  a boundary-less second A–D set.
- EC-87, EC-88, and EC-89 are CONFIRMED by the P13 fixtures and unit checks for
  the shared table, marker fallback, and image-plan gate.
- EC-90 through EC-94 are CONFIRMED by the OT04 parser/owner-tool regressions,
  the PHP 8.3.16 suites, the desktop Chromium harness, the 2026-11-09
  Brave/Android check, and the owner-accepted OT11 re-check on 2026-11-13.
- EC-95 through EC-99 are CONFIRMED by the OT08 comprehension fixtures and
  owner-tool tests. The owner supplied same-paste comprehension keys for Q13-Q15
  in `sample-passages.txt` on 2026-11-08 and confirmed the revised Q11-Q15 key
  (Q11 B, Q12 C, Q13 A→D) on 2026-11-13; OT10 confirms final coverage.
- EC-100 through EC-104 are CONFIRMED by the OT09 cloze fixtures, unit checks,
  and owner-tool tests. The owner supplied the complete same-paste cloze key for
  Q71-Q80 in `sample-passages.txt` on 2026-11-08.
- EC-105 is CONFIRMED by the 2026-11-07 `FIX-1` unit tests.
- EC-106 is CONFIRMED by the 2026-11-07 `FIX-2` unit tests: the owner replaced
  the review's refuse-later criterion with keep-first deduplication, so the
  first evidenced group survives and every later colliding group is dropped
  whole with a warning naming its gap numbers.
- EC-107 through EC-126 are CONFIRMED by the OT11 owner-tool/PHP tests, the
  guarded read-only payload on `admin_questions.php`, and the owner-accepted
  Brave/Android re-check on 2026-11-13.

## G. Constant Text reset (ST01)

EC-95 through EC-126 above belong to the archived context/owner-tool subsystem
(D-83); they remain as history, not production requirements.

| ID | Short name | Trigger | Expected behavior | Status | Source |
|---|---|---|---|---|---|
| EC-127 | Empty Constant Text | Whitespace-only or empty textarea | Stored as `NULL`; the question still saves | CONFIRMED | D-84; `php tests/admin-question-store.php` |
| EC-128 | Constant Text size boundary | Exactly 60,000 vs 60,001 UTF-8 bytes | 60,000 accepted; 60,001 rejected with the native error and no partial save | CONFIRMED | `deployed/admin_questions.php`; `deployed/admin_question_store.php` |
| EC-129 | Session prefill scope | New-question GET after save vs edit GET vs another session | Prefills only after a successful save in the same session; edit shows the row value; another session starts empty | CONFIRMED | D-84; static source checks; phone-staging source |
| EC-130 | Login/logout reset | Log out, then log in and open Add Question | Constant Text starts empty; a prior successful passage does not leak | CONFIRMED | D-84; `deployed/admin_questions.php` |
| EC-131 | Underline edge | Selection crosses a partial marker or contains a nested pair | Refused; text is unchanged and no malformed marker is created | CONFIRMED | D-85; `node tests/underline-toolbar.js` |
| EC-132 | Underline target | Focus changes between Constant Text, question, and an option | The last-focused field is wrapped; other fields are untouched | CONFIRMED | D-85; `src/underline-toolbar.js`; `node tests/underline-toolbar.js` |
| EC-133 | Civic option labels | `a)`, `(a)`, `(A).`, `A)`, `(A)`, `A.` | All parse as options, letters normalized to uppercase, no missing-option flag | CONFIRMED | D-87; `tests/ocr-helper.js`; `tests/fixtures/ocr-helper-option-labels.txt` |
| EC-134 | Multiline stem | Single wrapped line plus a blank-line paragraph | Single wrap folds to one space; blank line survives as `\n\n`; option stays one line | CONFIRMED | D-66; `ocr_helper.js` `cleanBlock`; `tests/ocr-helper.js` |
| EC-135 | Passage/cloze paste with Constant Text present | Load passage/cloze-shaped OCR while Constant Text already has a value | The helper may queue ordinary Question/options with review flags, but Constant Text remains byte-for-byte unchanged | CONFIRMED | D-89; `tests/ocr-helper.js`; disposable Chromium OCR-fill check |
| EC-136 | Preview formatting, overflow, and editability | Constant Text/Question contain blank lines, exact `<u>` markers, unsafe-looking text, or a long passage | Preview preserves paragraphs, creates underlines only through `CBTText`, exposes no editable control or form write, and keeps Constant Text in a 150px vertically scrollable box while Question remains content-sized | CONFIRMED | D-90, D-104; `tests/question-preview.js`; focused-review Chromium at 900px/320px; owner desktop/Brave recheck |
| EC-137 | Spaced repeated label inside an option | `Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four` | Under D-91, spaced and unspaced A-D labels parse case-insensitively with optional whitespace after `(`, before `)`, and before `.`, while the later `A )` remains in already selected Option A and alone raises no duplicate warning | CONFIRMED | D-91; `tests/ocr-helper.js`; phase-1 third re-review |
| EC-138 | Counter after a non-input fill | OCR Load/Skip writes `#question_text`, or the administrator triggers a native form reset | The counter shows the field's current UTF-8 byte count on the next turn, red at 60,000 or more, without a second save/validation path | CONFIRMED | D-93; `tests/math-tool.js` OCR/reset vector |
| EC-139 | Byte limit versus `maxlength` | Text with multi-byte symbols approaches the 60,000-byte limit | The counter can show red before `maxlength` stops typing, or `maxlength` can stop first; the mismatch is documented, nothing is truncated, and no submit is blocked | CONFIRMED | D-93; `src/math-tool.js` vector; native `maxlength="60000"` unchanged |
| EC-140 | Stale changed-asset cache after deploy | A browser holds an older `math-tool.js`/`.css`, `question-preview.css`, or `render.js` | Changed assets use `math-tool.js?v=1.1.2`, `math-tool.css?v=1.1.1`, `question-preview.css?v=1.1.3`, `render.js?v=2.3.4`, `core.js?v=2.5.4`, and `ocr_helper.js?v=2.4.5`, and the renderer token is consistent on every consumer; no page keeps `2.3.2c`, `2.3.3`, `2.4.0`, `2.5.0`, `2.5.1`, `2.5.2`, or `2.5.3` | CONFIRMED | D-94, D-102, D-103, D-104, D-105; `tests/math-tool.js` asset vector; `docs/DEPLOYMENT.md` |
| EC-141 | Near English Lexis subject name | The selected subject differs by case, spacing, wording, or a trailing byte | Grouping stays off; only the exact trusted database name activates it | CONFIRMED | D-96; `tests/cbt-question-order.php` exact/near-name vector |
| EC-142 | Blank English Lexis passages | Two selected rows have `NULL` or empty Constant Text | Each row remains its own singleton display group; blanks are never merged | CONFIRMED | D-96; `tests/cbt-question-order.php` blank-group vector |
| EC-143 | Large selected passage group | A 50-, 60-, or 100-row selected array contains a group larger than 50 | The complete selected array is preserved, the large group is contiguous, and no row or field is changed | CONFIRMED | D-96; `tests/cbt-question-order.php` scale vectors; disposable HTTP staging |
| EC-144 | Collation-only subject collision | A byte-different name compares equal to the target under `utf8mb4_unicode_ci` | Forward and rollback refuse before writing; an operator must resolve the row explicitly | CONFIRMED | D-95; real SQL refusal probes on isolated MySQL 8.0.41 ARM64 |
| EC-145 | Malformed shape marker | Stored text contains `<FRAC>`, `<frac onclick=...>`, an unclosed `<sqrt>`, a stray `</frac>`, or a repeated open such as `<sup>a<sup>b</sup></sup>` | Every malformed form stays literal escaped text; no element is created and no marker pair is invented | CONFIRMED | D-97; `tests/fixtures/render-markup.json`; JS and PHP runners |
| EC-146 | Fraction without a separator | Hand-edited `3`  | The content renders once inside `cbt-frac-single` with no bar and no error | CONFIRMED | D-97; shared vector `fraction without separator keeps text` |
| EC-147 | Matrix cell-count mismatch | `<matrix>2|x|1</matrix>` or five cells | The content renders as text inside `cbt-matrix-single`; no partial grid, no dropped cell | CONFIRMED | D-101; shared matrix vectors |
| EC-148 | Forbidden editor value | A shape field contains `<`, `>`, `/` in a fraction term, or `|` in a matrix cell | Nothing inserts, the textarea is unchanged, and the inline hint names the requirement | CONFIRMED | D-100; `tests/math-tool.js` refusal vector |
| EC-149 | Nested shapes | A fraction numerator holds an exponent, or a root holds a fraction | Both render recursively; a marker whose own tag is already open stays text | CONFIRMED | D-97; shared nesting vectors |
| EC-150 | Legacy precomposed math text | An older question stores `½`, `³⁄₇`, or `x²` | The text renders unchanged; the palette never converts or rewrites it | CONFIRMED | D-99; `tests/math-tool.js` builder vectors; no migration |
| EC-151 | Duplicate or split square root | The palette mounts, or a root renders under differing font metrics and sizes | No legacy `√` operator is present; the visual Root editor is the only square-root control, and its scalable vinculum overlaps the glyph with no visible gap | CONFIRMED | D-103; `tests/math-tool.js`; local/focused-review Chromium font-size probes; owner desktop/Brave recheck |
| EC-152 | Symbol present in two palette places | `π` is inserted from the operator row and again from the restored Greek grid | Both insert the same Unicode character at the remembered caret; nothing converts it to a marker and no shape editor is affected | CONFIRMED | D-105; `tests/math-tool.js` drawer vector |
| EC-153 | Database migration completed but question save still fails | The INSERT raises a different `PDOException`, such as another required column lacking a default | The logged-in admin alert keeps the generic failure lead-in and appends the exact HTML-escaped database message instead of mislabelling every failure as the Constant Text migration | CONFIRMED | D-106; `deployed/admin_questions.php` |
| EC-154 | Display alias versus a near subject name | A subject differs from `English (Lexis & Structure)` by case, wording, spacing, or a trailing byte | The near name displays unchanged; only the byte-exact intended row receives the frontend alias, and grouping behavior remains exact-name-only | CONFIRMED | D-108; `deployed/subject_display.php`; `php tests/cbt-question-order.php` |
| EC-155 | Lowercase stem after a numbered marker | `1. lout` then A–D, as in the supplied oral-English paste | Every stem splits into its own item; each option set stays with its own stem | CONFIRMED | RM01; `region-lowercase-stems`; `tests/ocr-helper.js` |
| EC-156 | Instruction block between option sets | A `SECTION 2` heading and rubric after question 3's option D and before question 4 | The rubric leaves option D and becomes question 4's `sectionInstruction` plus a `regions` envelope; the `SECTION 2:` and `SECTION 2.` forms are recognized after the terminal-punctuation check | CONFIRMED | RM01; `region-lowercase-stems`; `region-footer-instruction`; `region-midstream-heading`; `tests/ocr-helper.js` |
| EC-157 | Lost question number in a continuation paste, mid-stream as well as leading | `lump` plus A–D, then `25. assign` | The unnumbered block stays a separate `num: null` item and is never merged into question 25; the same rule applies mid-stream after question 24 | CONFIRMED | RM01; `region-orphan-number`; `region-midstream-orphan`; `tests/ocr-helper.js` |
| EC-158 | Trailing structural run after the last option | `END OF SECTION 1` after the final option block | Reported as an unowned `regions` entry with `from: null` and `to: null`; option D is unchanged | CONFIRMED | RM01; `region-footer-instruction` |
| EC-159 | Title and prose preamble before the first question | A title plus paragraphs before `1.` | Leading `heading` and `passage` regions are reported; the stem and options stay clean and the head is not dropped | CONFIRMED | RM01; `region-preamble-paragraphs` |
| EC-160 | Spaced dotted initialism in a question stem | `C. I. F. Lagos`, `A. D. 70`, or `597 B. C.` appears before the real A–D set | The run stays stem text; the real A–D labels own the boundaries, no option text moves, and no duplicate-letter flag is raised | CONFIRMED | D-111; `spaced-initialism-cif-stem`, `-ad-stem`, `-bc-stem`; `tests/unit.js`; `tests/ocr-helper.js` Load vector |
| EC-161 | Initialism split by one OCR wrap | `C. I.` ends a line and `F. Lagos` starts the next inside the stem | The wrap is whitespace inside one initialism run, so the stem folds it and no boundary is created | CONFIRMED | D-111; `spaced-initialism-wrapped`; real-artifact parity |
| EC-162 | Spaced initialism inside option text | The initialism sits after a real option label instead of in the stem | The outer A–D labels still win and the initialism stays in its option; recorded as a must-stay-passing control because it already passed on package base `331e81f` | CONFIRMED | D-111; `spaced-initialism-inner-option`; EC-85 |
| EC-163 | Trailing initial or initialism immediately before a real option line | A stem or option ends with `[A-Z].` (`John F.`, `U. S.`, `Vitamin C.`, or `C. I. F.`) and the next line or paragraph starts with the real `A.`/`B.` label, while a later option mentions that letter; or the label is wrapped alone onto its line (`\nA.\nKennedy`) or its option body mentions another letter out of order (`(see D. note)`) | The real line-leading label keeps its boundary: the initialism run ends before it even when the label is wrapped or the ordered test sees an in-text mention, and a covered label is restored only when its letter has no other candidate. The restore prefers the trailing real boundary, so a stem `A. D.`/`A. B.` initialism is never turned into the option label | CONFIRMED | BLOCK-1/BLOCK-2/BLOCK-3 fixes; `tests/unit.js` boundary vectors; `tests/fixtures/ocr-helper-spaced-initialism-boundaries.txt` and `-wrapped-boundaries.txt`; 4-surface parity |
| EC-164 | Locator phrases with verb predicates or `same section` (`V10` / `V11`) | `Use the diagram below to answer questions 20 to 22, 25 in the table is the cash deposit.` (`V10`) or `...25 in the same section.` (`V11`) | `V10` stops before `is ...` and extracts `[20, 21, 22]`; `V11` recognizes `in the same section` and extracts `[20, 21, 22, 25]`; `V9`/`V6`/`adv-bank`/`N1`–`N5` stay `[20, 21, 22]` (both carried open for Phase 7 independent verification) | CONFIRMED | D-112; `tests/unit.js` `PC04 BLOCK-1 to BLOCK-11`; `ocr-helper.js` & staging 3-surface Load |
| EC-165 | Malformed markers, `[missing text]`, or quoted intro inside options | Option D holds `Use the diagram...` + `[image]]`/`[[[image: 21]]`/`[diagram]]`/`[missing text]`, or `S1`–`S5` option distractors | No anchored extraction occurs (`stimuli` absent), Option D text stays preserved, and `[missing text]` never fabricates a stimulus block without a marker or non-placeholder body | CONFIRMED | D-112; `tests/unit.js` `PC04` & `PC05` controls |
| EC-166 | Anchored inter-question passage/table (`constantText`) vs `[diagram]` (`needsImage`) | Complete A–D set followed by `Use the information below...` + stock table (`new-edge-inter-question-text`) or `[diagram]` + bank lines (`new-edge-inter-question-diagram`) | Preceding Option D stays exact; table lines populate `constantText` on Q20–Q21 and clear on standalone items, while `[diagram]` sets `needsImage` without touching `constant_text` | CONFIRMED | D-112; `new-edge-inter-question-{text,diagram}`; staging end-to-end autosave `#117`–`#119` |
| EC-167 | Leading stimulus before Q1 and gap dialogue with `[Option missing]` | Paste starts with stimulus before `1.` or continues after Q33 with multi-line dialogue (`Mr. Ganaba:`/`Mr. Katoun:`) and unnumbered Q34–Q35 (`D. [Option missing]`) | `extractLeadingStimuli` covers `1`–`2`; `inStimulusBlock` keeps multi-line dialogue inside the stimulus block instead of splitting `Mr. Ganaba:`; `inferMissingGapNums` recovers Q34–Q35 with `constantText` and `[missing text] placeholder` flag | CONFIRMED | D-112; `tests/unit.js` PC05/PC07 suite |
| EC-168 | Wrapped Option D without stimulus anchor | `46. ... D. Undergoing mentorship under prominent political\nleaders` before `47.` | Unanchored wrap folds cleanly into Q46 Option D (`... political leaders`) with zero extraction | CONFIRMED | D-112; `tests/unit.js`; `anomaly-block1` |
| EC-169 | Ready-image autosave vs pause and RAM File caching | Image-bearing paste (`new-edge-image-intro-marker`) with PNG attached to Q20–Q22 (`Ready`), or expired File reference after attach, vs uncovered Q2 `needsImage` or `[missing text]` | Covered Q20–Q22 upload RAM-cached PNG during autosave (`#113`–`#115`, SHA-256 verified via HTTP) while Q18/Q19/Q23 stay image-free; uncovered Q2 pauses as `PAUSED (IMAGE)` with 0 POSTs; `[missing text]` disables Start with 0 POSTs | CONFIRMED | D-113; `tests/unit.js` UI Track 2; Chromium + PHP staging |
| EC-170 | Reinjection during in-flight POST or unbatched `ocrQueue` | Second bookmarklet activation while a save POST is outstanding, or loading over an unbatched manual `ocrQueue` alongside an old `ansKey` | Shared `owner.inFlight` disables Start/Save, prevents duplicate POSTs (`slowPosts=1`), and settles once (`#121`); `keyAppliesForQueue()` leaves radios unticked on unbatched queues | CONFIRMED | D-113; `tests/unit.js` UI Track 2; Chromium + PHP staging |

## Counts

- Total: 160
- CONFIRMED: 156
- UNVERIFIED: 4
- CONFLICTED: 0
