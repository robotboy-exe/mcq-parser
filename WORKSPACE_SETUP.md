# Workspace Setup

Status: Phase 1 complete (Workspace Structure + Archive). Phase 2 complete
(Code Extraction + Baseline Selection). Phase 3 complete (Edge Cases +
Invariants). Phase 4 not started.

## Directory Structure

```
project/
├── README.md                    # placeholder (full version in Phase 5)
├── archive/
│   ├── migration-docs/
│   │   └── analysis/            # per-source notes (Phase 2)
│   ├── trusted-variants/
│   │   └── analysis/            # per-source notes (Phase 2)
│   └── chat-exports/            # empty; no chat exports were supplied
├── src/
│   ├── parser/parser.js         # pure parsing logic
│   ├── ui/ui.js                 # DOM / form / storage / queue
│   ├── build/build.js           # bookmarklet assembler
│   └── bookmarklet.js           # generated combined output
├── fixtures/
│   ├── inputs/
│   └── expected/
├── tests/
├── docs/
│   └── BASELINE_COMPARISON.md   # Phase 2 version comparison
└── WORKSPACE_SETUP.md
```

## Phase 1: Archive

No file was modified during Phase 1. Copies are byte-identical to the
originals (verified with `cmp`), and SHA-256 hashes are recorded below.

### Migration docs → `archive/migration-docs/`

| File | Size (bytes) | SHA-256 |
|---|---|---|
| claude-migration.md | 42397 | bfc54a094650d9ac91e7dd5f0319f614886aa628c0cad40e7654c318af85fbc8 |
| qwen-1-gaps.md | 3402 | 31c9e7273a82774eb848f2ac84d36aee284dedce0d499bad0925299afd591126 |
| qwen-1-gaps2.md | 3759 | 5e26421ce731d6c61eecbc729064ab433bc85382bedd120aeca6c40015ccdd21 |
| qwen-1-migration.md | 19530 | c769719619b33bde01e363c1bf0c19f284218ac6d2e4b824a83b4773ef866a7f |
| qwen-2-gaps.md | 4598 | ecbd1b5edc2555620d48112e0b7c80516e19d39fa90889748b4185df652d7690 |
| qwen-2-reconciled.md | 57209 | a4bcc9a95d6883a033a0e081e3010835c0cdedc5635e058096c749bdb1c6a2c5 |

### Trusted variants → `archive/trusted-variants/`

| File | Size (bytes) | SHA-256 |
|---|---|---|
| trusted-variant-A.js | 10318 | 59b2a7b9a7aa48c79b779f855bdc83252ec3138da8bb881b05d6141075d402fe |
| trusted-variant-B.js | 11066 | a75f5fefb585b399b64cdce9bb703f802695279f9555522c9359039b1f9bf367 |
| trusted-variant-C.js | 14325 | cda0fe17f294e76c46fde77fafa23e63289eeb2fa9c022ce0cd6d792183a1a64 |

### Known-issues docs

- `archive/trusted-variants/trusted-variant-A-KNOWN_ISSUES.md`
- `archive/trusted-variants/trusted-variant-B-KNOWN_ISSUES.md`
- `archive/trusted-variants/trusted-variant-C-KNOWN_ISSUES.md`

### Sources Not Archived

- `claude-gaps.md` — not supplied. Per Phase 1 instructions, gaps found during
  later reconciliation will be written to a new `claude-gaps.md`.
- Chat exports — none supplied; `archive/chat-exports/` is empty.

## Phase 2: Code Extraction + Baseline Selection

### Code versions found

| Label | Where | Identity / differences |
|---|---|---|
| A (V0 in qwen-2) | `trusted-variant-A.js` | Lookbehind OPTION regex; dotted options only; two textareas; known dotless bug |
| V1 | `qwen-1-migration.md` code block (10395 bytes, sha256 `e081d842…2d361a6b`) | A plus dual-branch OPTION and per-slice cleaning; fails inline Q20 |
| B (V4 in qwen-2) | `trusted-variant-B.js`; `qwen-2-reconciled.md` §1.1 | Inline whitespace branch + dotless-newline branch + absorbed-option post-processor; two textareas |
| C (merged) | `trusted-variant-C.js`; `claude-migration.md` §1 (byte-identical) | B refined (`[^\S\n]*`), post-processor removed, loose E/F, one-box `splitSections`, key-only paste, E/F tick fixed |

Partial/non-versions:

- `qwen-2-reconciled.md` §1.2 is a readable `parseQuestion` companion, not a
  standalone artifact.
- B1, B3 and the original `ocr_helper.js` are named in `claude-migration.md`
  but their code was never supplied. `ocr_helper.js` remains unavailable.

Per-source notes are in `archive/migration-docs/analysis/` and
`archive/trusted-variants/analysis/`.

### Baseline chosen

**`trusted-variant-C.js` (the merged one-box artifact).**

Rationale:

- Newest version in the documented lineage (B → C in `claude-migration.md`;
  C's known-issues doc calls it the most recent merged iteration).
- Superset workflow: one paste for questions + key, automatic key split,
  key-only correction, same queue/save/state behavior.
- Fixes known defects in earlier versions: A/V1 dotless options, B's E/F radio
  values 4/5, B's blank-`C.` absorption (via `[^\S\n]*`).
- Satisfies the documented regression set in local parser comparison:
  S1 → 40 items, Q20 four clean inline options; S2 → leading `A 5` stays in the
  stem, options `75/105/85/99 years`, no flags; S3 → empty `c`,
  `d = "seek revenge"`, only `option C missing`.

Full comparison: `docs/BASELINE_COMPARISON.md`.

### Extraction status

| File | Contents |
|---|---|
| `src/parser/parser.js` | Pure parsing: `FIXES`, `OPTION`, key/section regexes, `parseHeader`, `pickSubjectIndex`, `splitQuestions`, `parseQuestion`, `splitSections`, `parseKey`. No DOM, no `localStorage`. |
| `src/ui/ui.js` | DOM injection, form filling, storage wrapper, queue, key ticking, submit interception, bootstrap (`runOCRBookmarklet`). |
| `src/build/build.js` | Concatenates parser + UI, wraps in `javascript:(function(){try{…}catch(e){alert(…);}})();`, writes `src/bookmarklet.js`. |
| `src/bookmarklet.js` | Generated single-line combined output (16496 bytes). |

Extraction was verified without executing the page:

- Parser outputs were compared against the original C functions extracted from
  the archived variant on S1 (40 items), S2, S3, S5, key-section variants
  (divider/header/structure), `parseHeader`, and `pickSubjectIndex`.
- All comparisons matched exactly.
- `fillForm`, `renderOCR`, `showOCR`, `cur`, `tick` are whitespace-normalized
  identical to C. `applyHeaderInfo` differs only by delegating subject choice
  to the pure `pickSubjectIndex` (verified equivalent).
- The built bookmarklet passes a syntax/compile check and executes to the
  guard alert under a stub DOM.

No parser behavior was modified. `src/bookmarklet.js` is generated; edit
`src/parser/parser.js` / `src/ui/ui.js` and re-run `node src/build/build.js`.

### Conflicts and ambiguities (flagged, not resolved)

1. **E/F merge framing** — `qwen-2-reconciled.md` calls it a lossy limitation;
   `qwen-2-gaps.md` reclassifies it as a hard server constraint. Both agree the
   current behavior (collapse to Option D) is what the server requires. Not
   changed.
2. **B vs C "final"** — `qwen-2-reconciled.md` calls B "final accepted", but
   `claude-migration.md` provides a later merged version identical to C.
   Chronology and the known-issues docs indicate C is newer.
3. **PRG success detection** — `qwen-2-reconciled.md` marks it uncertain;
   `qwen-2-gaps.md` says the PHP PRG flow guarantees the success string.
   Current code is unchanged.
4. **Reset Queue vs key** — `claude-migration.md` records this as undecided.
   C's code keeps the key on Reset. Preserved as-is.
5. **`ocrSubmitted` writer** — read/deleted but never written by the
   bookmarklet; likely legacy from `ocr_helper.js`. Purpose unresolved.
6. **CRK/CRS alias** — `claude-migration.md` infers the subject list may not
   contain CRS, so the alias may match nothing; the parser spec describes it as
   handled. No code change.
7. **B1/B3/OH** — named but not supplied; cannot compare or extract.

## Phase 3: Edge Cases + Invariants

Raw per-doc extraction notes:

- `archive/migration-docs/analysis/claude-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-1-migration-phase3.md`
- `archive/migration-docs/analysis/qwen-2-reconciled-phase3.md`
- `archive/migration-docs/analysis/gap-reports-phase3.md`

Consolidated outputs:

- `docs/EDGE_CASES.md` — 61 edge cases
- `docs/INVARIANTS.md` — 55 invariants

### Edge cases (count by status)

| Status | Count |
|---|---|
| CONFIRMED | 50 |
| UNVERIFIED | 8 |
| CONFLICTED | 3 |

UNVERIFIED: letter-like text in prose/options (no guard), key text with
explanations, fuzzy subject accuracy, year typo/unmatched year, repeated
injection interval, Option D newline stripping, empty-option server rejection,
category `id <= 10` limit.

### Invariants (count by status)

| Status | Count |
|---|---|
| VERIFIED | 40 |
| AT_RISK | 12 |
| CONFLICTED | 3 |

Additional items carried from the raw notes: EC-61 (header year first-match may
pick a copyright/reference year, qwen-2 R14) and INV-55 (`localStorage` is
origin-wide and shared with the live helper, qwen-2 R15).

### Conflicts found

1. **E/F framing** (EDGE_CASES EC-40 / INVARIANTS INV-31) —
   `qwen-2-reconciled.md` treats E/F collapse and the E/F tick as lossy/buggy
   (B computes radio 4/5); `qwen-2-gaps.md` reclassifies collapse as a hard
   server constraint; `claude-migration.md` shows C maps E/F to D. Behavior in
   baseline C is the later documented mapping, but the sources are flagged.
2. **CRK/CRS alias** (EC-41 / INV-43) — specified as handled, but
   `claude-migration.md` infers the deployed subject list may contain no CRS /
   Christian Religious option. Needs live data.
3. **PRG success detection** (EC-59 / INV-49) — qwen-2-gaps says the PHP PRG
   flow guarantees the flash text; qwen-2-reconciled marks the live response as
   never observed and uncertain.

### Version differences and open decisions

4. **Version-specific behaviors** — the older two-textarea variants (A/B/V1)
   differ from baseline C on E/F ticking and absorbed-option repair. These are
   documented as version differences, not silently merged.
5. **Open product decisions** retained: Reset Queue vs key (C keeps the key),
   key persistence across reloads, `is_active` default, `ocrSubmitted` writer.

No edge cases or invariants were invented; every entry cites a source doc.

## Next Step

Awaiting Phase 3 verification. Do not proceed to Phase 4 until the edge cases
and invariants are confirmed correct.
