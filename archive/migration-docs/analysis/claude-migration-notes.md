# claude-migration.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/claude-migration.md` (42397 bytes).

## Code snapshots

| # | Location | Bytes | SHA-256 | Identity |
|---|---|---|---|---|
| 1 | Section 1, javascript fenced block | 14321 | cda0fe17…183a1a64 | Byte-identical to `trusted-variant-C.js` |

No other full code snapshots. Section 1 names alternatives B1, B2, B3 (the
three bookmarklets the user supplied in the first Claude message) and OH
(`ocr_helper.js`), but does not reproduce B1/B3/OH. B2 is described as the base
of the merged artifact; B1/B3 source was not supplied to this workspace.

## Context

- Migration bundle from the Claude conversation.
- Current code is described as the merged bookmarklet built on B2, with the
  listed changes from B2 (Reset fix, removal of the option-splitting block,
  key replacement/clearing on paste, `[^\S\n]*` in OPTION, loose E/F, E/F-safe
  `fillForm`, `cur()` returning `q`, E/F-aware `tick`).
- Only syntax (`node --check`) and 5 parser samples were run. Never run in a
  live browser page.
- Explicitly labels uncertain items: live browser behaviour, E/F cases 3/4,
  newlines in Option D, Reset-vs-key, key persistence, numbering-gap flags,
  CRK alias possibly matching nothing, key-with-explanations, OH leftovers.

## What it adds beyond the code

- Full `splitSections` rule order: divider → key-only → header → structure →
  none, plus precise cut semantics.
- Key lifecycle: questions+key replaces key; questions without key clears key;
  key-only keeps queue; Reset Queue keeps key; Clear saved key empties key.
- E/F rules for with-key (E/F → D, D ticked; wrong E/F removed), without-key
  (append to D), and key-says-E-but-no-E-text (leave D alone, tick nothing).
- Unresolved issues: `option_d` is an `<input type=text>` so appended `\n\n`
  may be stripped by the browser; Reset key behaviour undecided; HO Bulk Import
  plan is not connected to this bookmarklet.
- Samples: S1 is the real Joseph/empty-C bug; S2–S5 are assistant-written;
  S6/S7 are fragments.

## Notable constraints / warnings

- Keep as one line, no `//` comments (javascript: URL).
- Do not reintroduce the option-splitting post-processor; it is deliberately
  removed in this version (a fixed version would mis-split "Vitamin C." and
  "Vitamin B-12").
- `OPTION` uses `[^\S\n]*` after labels so a blank `C.` line does not consume
  the following `D.`.
- Loose E/F risk: a D continuation line starting with `E ` or `F ` (e.g.
  `F = ma`) can be mistaken for an option.
- `splitSections` order and `splitQuestions` number filter are fragile.
- `parseKey` scans the whole key section; explanation text could create bogus
  entries.

## Relationship to other sources

This is the latest version in the supplied lineage: it is the merged-textarea
successor to the two-textarea V4 FINAL (trusted-variant-B) documented in
`qwen-2-reconciled.md`.
