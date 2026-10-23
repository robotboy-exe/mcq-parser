# Phase 3 raw extraction — claude-migration.md

Source: `archive/migration-docs/claude-migration.md`.

## Edge cases (as stated)

| # | Short name | Trigger | Expected |
|---|---|---|---|
| C-EC01 | Key-only paste | Every non-empty line looks like a key line | Key replaced, queue kept, current question refilled |
| C-EC02 | Divider line | Line with 3+ punctuation and a key word, e.g. `=== ANSWER KEY ===` | Split at that line |
| C-EC03 | Header-style key | `ANSWERS`-style header followed by key lines | Split at header (fragile heuristic) |
| C-EC04 | Structure-only key | Run of key-like lines after the last question | Split there (fragile) |
| C-EC05 | Several answers per line | `1.A 2.B 3.C` | All pairs read |
| C-EC06 | Placeholder key line | `5. [missing]` | Counted as key line for splitting; no key entry |
| C-EC07 | Blank option in middle | `C.` empty, then `D. seek revenge` | C blank, flag C missing, D keeps text without `D.` label |
| C-EC08 | Option text after label | `A.` then text on next line | Text attached to A; A not treated as missing |
| C-EC09 | E/F with key, E correct, dotted | `E. Abraham` | E placed in D, D ticked |
| C-EC10 | E/F with key, E correct, dotless | `E Abraham` | Same as C-EC09 |
| C-EC11 | E/F with key, E wrong, dotless | Key A–D, `E Abraham` | E removed, not merged into D |
| C-EC12 | E/F with key, E wrong, dotted | Key A–D, `E. Abraham` | E removed |
| C-EC13 | E/F without key | No key entry | E/F appended to D as `E. ` / `F. ` |
| C-EC14 | Key says E but no E text | Key E, no E option text | D left alone, nothing ticked, manual-pick message |
| C-EC15 | Loose E/F detection | Line starting with lone `E`/`F` + whitespace + text after D/E | Recognized as E/F (fragile) |
| C-EC16 | Option-splitting removed | `Vitamin C.`, `Vitamin B-12` inside an option | Not split; post-processor stays removed |
| C-EC17 | Letter-like text in stem/option | `Vitamin C.` etc. in prose | Ideally no option; no guard exists |
| C-EC18 | Duplicate option letter | Same letter matched twice | Flag `a letter appears twice (merged questions?)` |
| C-EC19 | Out-of-order/gap >5 numbering | Number goes backwards or jumps >5 | Marker ignored; text absorbed into previous chunk |
| C-EC20 | Leading chunk without number | Head with ≥2 option markers | Queued with `num=null`, flagged; tick says no number |
| C-EC21 | Overlong option / short stem | Option >500 chars / question <10 chars | Flagged |
| C-EC22 | New paste key lifecycle | Questions with key / without key | Replace key / clear old key |
| C-EC23 | Reset Queue | Click after loading | No error; `{items:[],i:0}` |
| C-EC24 | Edit page | URL contains `edit=` | Alert and do not install |
| C-EC25 | Session expired / network failure | Login page reply / fetch rejects | Targeted "NOT saved" messages |

## Invariants (as stated)

1. Key-only paste must not clear the queue.
2. Questions paste replaces the key; no-key paste clears it.
3. Blank options stay blank; empty option must not pull next option into its place.
4. Missing-option flag names the actually missing letter.
5. Duplicate option letters flagged.
6. Over-500 options, under-10 stems, missing question numbers flagged.
7. With key: E/F goes to D and D ticked; wrong E/F removed. Without key: E/F appended to D.
8. No radio pre-ticked unless key supplies answer.
9. Correct-option value sent is 0–3; radio 4 does not exist.
10. Reset Queue must not throw.
11. Option-splitting block must stay removed unless rewritten and tested against "Vitamin C." and "Vitamin B-12".
12. Save only through existing form post with CSRF token and action; success detected by exact flash text.
13. Infer single-line javascript: URL with no `//` comments.
14. Numbering gaps should be flagged per HO, but code does not do it (stated rule not implemented).

## Additional risks / open items

- `option_d` is `<input type=text>`; browser may strip appended `\n\n` before E/F text.
- Reset Queue vs key is undecided.
- Key persistence across page reloads undecided.
- CRK/CRS alias may match nothing in the deployed subject list.
- `parseKey` scans explanations and may create bogus entries.
- Removing `ocr_helper.js` does not remove listeners it already attached.
- HO Bulk Import plan is not connected to this bookmarklet.
- `is_active` defaults to ticked; HO planned inactive drafts.
- Live browser run never done; `fillForm`, `tick`, `splitSections`, save flow unexercised.
