# Baseline Comparison

## Versions compared

The supplied legacy bookmarklets are archived as B1 (`archive/legacy-bookmarklets/b1.js`),
B2 (`b2.js`), and B3 (`b3.js`); B2 is the source the merged C baseline was built
from. See `archive/legacy-bookmarklets/README.md` for the matching evidence.

| Label | Source | OPTION handling | UI shape | Status |
|---|---|---|---|---|
| A | `archive/trusted-variants/trusted-variant-A.js` | Lookbehind; requires `.`/`)` after label | Two textareas | Superseded; known dotless-option bug |
| V1 | `archive/migration-docs/qwen-1-migration.md` (code block) | Dual branch, dotted at start/newline; dotless only after newline + digit | Two textareas | Superseded; fails inline options (Q20) |
| B | `archive/trusted-variants/trusted-variant-B.js` (also qwen-2 §1.1) | V1 plus whitespace-prefixed inline branch | Two textareas | Superseded by merged successor |
| C | `archive/trusted-variants/trusted-variant-C.js` (also claude §1) | B regex refined with `[^\S\n]*`; loose E/F; no post-processor | One textarea + key section detection | **Selected baseline** |

## Evidence

### A → V1

- A's regex is `/(?<![A-Z])([A-F])\s*[.)]\s*/g`; A's known-issues doc records
  that options without a period are absorbed into the question.
- V1 replaces it with a dual capture branch and uses `m[1] || m[2]`. It adds
  the newline-only dotless fallback (`A 75 years` after a newline) while
  avoiding the start-of-chunk article case (`A 5 year old`).
- V1 still requires a dot/parenthesis at chunk start or after a newline, so it
  cannot parse inline option runs; `qwen-2-reconciled.md` records V1 failing
  Q20.

### V1 → B

- B widens the first branch to allow whitespace before the label:
  `/(?:^|\n|\s)([A-F])\s*[.)]\s*|\n\s*([A-F])\s+(?=\d)/g`.
- B preserves newlines until after option matching and adds the absorbed-option
  post-processor (`const optionLetters = [...]` block) to recover cases where
  one option absorbs a later label.
- `trusted-variant-B-KNOWN_ISSUES.md` says B is the final pre-merge iteration,
  likely handled more edge cases than A, and was stable enough to justify
  merging the question and key boxes.
- B still has the separate answer-key textarea and computes `tick()` radio
  values for E/F as 4/5, which do not exist on the page.

### B → C

A token-level diff of `archive/legacy-bookmarklets/b2.js` against
`archive/trusted-variants/trusted-variant-C.js` confirms exactly eight
behavioral changes and no other differences (2026-10-24). `claude-migration.md`
lists the same changes, and C is byte-identical to that document's code block:

1. `Reset Queue` uses `{items:[],i:0}`.
2. The absorbed-option post-processor is removed.
3. A questions paste replaces the key; a no-key paste clears it.
4. `OPTION` uses `[^\S\n]*[.)][^\S\n]*` instead of `\s*[.)]\s*`, so a blank `C.`
   no longer consumes the following `D.`.
5. Loose E/F detection (`LOOSE`) is added for `E Abraham` without a dot.
6. `fillForm` replaces Option D with E/F only when that option's text exists.
7. `cur()` returns the question object.
8. `tick()` maps E/F to Option D and gives accurate messages.

The merged one-box UI, `splitSections` (divider / key-only / header /
structure), key-only paste, and the "Show paste box" control are already
present in B2, so they are B → B2 changes, not part of B2 → C.
`trusted-variant-C-KNOWN_ISSUES.md` calls C the most recent merged-textarea
iteration personally tested by the user, with limited testing time.

## Selection

**Baseline: `trusted-variant-C.js`.**

Reasons:

- It is the newest artifact in the supplied lineage (B → C is documented in
  `claude-migration.md`; C's known-issues doc agrees).
- It is a functional superset of B's UI workflow: one paste for questions and
  key, automatic key split, key-only correction, and the same form/queue/save
  behaviour.
- It fixes two concrete defects seen in earlier versions: A/V1 dotless
  handling and B's E/F radio tick (values 4/5).
- Its `[^\S\n]*` change handles the blank-`C.` regression without the removed
  post-processor.
- Code inspection plus a local parser comparison confirmed it satisfies the
  documented regression set: S1 yields 40 items, Q20 has four clean inline
  options, S2 keeps the leading `A 5` stem and parses `75/105/85/99 years`,
  and S3 yields empty `c` + `d = "seek revenge"` with only `option C missing`.

## Trade-offs

- C's `splitSections` is heuristic and was never exercised in a live browser.
  Mis-detection is reported in the UI but is not a hard error.
- Removing B's post-processor gives up automated repair of arbitrary absorbed
  labels; C relies on the tightened regex plus loose E/F. "Vitamin C." and
  "Vitamin B-12" are intentionally not split.
- E/F still collapse into Option D (server accepts only four options), so 5/6
  option questions remain lossy.
- `parseKey` and `fillForm`/`tick` E/F paths are documented but were not run in
  a live page in the source conversations.

## Not selected

- **A** — known dotless-option bug; least edge-case coverage.
- **V1** — fails inline options (Q20).
- **B** — older two-textarea UI and broken E/F radio tick; its post-processor
  is the main capability C drops, but C's regex change covers the documented
  blank-option case.
