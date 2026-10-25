# P10 — Post-P09 audit follow-up

Status: done (2026-10-25). Depends on P09 (done). Blocks: none.

Baseline: commit `fdc0af1` on `experiments`. This package records the findings
from a fresh-context audit of `e1f5bd2^..fdc0af1`; it is not a rewrite of P09.

## Why this exists

The P09 suite is green, but green tests only prove that the fixtures agree with
the parser. The audit checked commit scope, parser/UI behavior, fixture support,
harness strictness, and current-status docs. It found no blocker, but it did
find one real parser edge bug and several documentation/test gaps. Fix these in
a new session; do not rely on the P09 “all done” summary alone.

## Baseline checks (independently rerun)

```sh
node tests/runner.js                 # 30 PASS / 0 FAIL / 0 PENDING
node tests/unit.js                   # 59 PASS / 0 FAIL
node tools/extract-bank.js --check   # source, anchors, counts, 5 hashes OK
node src/build/build.js              # prints 58777 bytes
wc -l src/bookmarklet.js             # 1
```

The build body parses and contains no `%`. Commit scope is clean: no PHP,
archive, storage-key, or hand-edited bookmarklet changes. All executed
assertions from the retired `qwen2-s1` fixture are present in `bank-2021`.

## Findings

### 1. Medium — salvage rewrites dotted abbreviations

`src/parser/parser.js`, `salvageNormalize`, third replacement:

```js
text = text.replace(/([^A-Za-z\s]|[a-z])([A-F])\./g, ...)
```

When a repair is accepted, this also rewrites abbreviations in option text:

```text
Ph.D.  ->  Ph. D.
U.S.A. ->  U.S. A.
```

This contradicts `docs/SPEC.md` ("It does not rewrite option text"). Salvage
should insert a space before a *fused option label*, not split abbreviations.

**Fix.** Replace that one replacement with two ordered replacements:

```js
text = text.replace(/([a-z])([A-F])\./g, (m, pre, letter) => {
  inserts++;
  return pre + ' ' + letter + '.';
});
text = text.replace(/([^A-Za-z\s])([A-F])\.(?![ \t\r\n]|$)/g, (m, pre, letter) => {
  inserts++;
  return pre + ' ' + letter + '.';
});
```

Rationale:

- The first rule still repairs fused labels after lowercase text:
  `inA.Italy` -> `in A.Italy`, `naturalizationA. pays` -> `naturalization A. pays`.
- The second rule still repairs fused labels after punctuation/digits:
  `disenfranchised.D.the` -> `disenfranchised. D.the`.
- The lookahead on the second rule prevents `U.S.A.` / `Ph.D.` (letter followed
  by whitespace or end) from being split.
- Leave the two numbered-boundary replacements unchanged.

**Must preserve:** block 2 still yields `12` chunks, nums
`[null,2,3,4,7,8,9,12,13,14,15,16]`, and `50` inserts. The two-rule version was
simulated and preserved those values.

Current repro:

```sh
node - <<'JS'
const p = require('./src/parser/parser.js');
const r = p.salvageNormalize('He earned a Ph.D. from the U.S.A.');
console.log(r.text, r.inserts);
JS
```

Desired: text unchanged, `inserts === 0`.

### 2. Low — the SPEC overclaims bullet/numbered mode isolation

`docs/SPEC.md` says bullet and numbered chunks are “never mixed”. The actual
rule is “numbered mode wins whenever any line-start `N.` marker exists”. A
malformed paste of bullet questions followed by a bare key line without a
divider can therefore be split by numbered rules:

```text
* First question?
A. one
...
* Second question?
A. one
...
1. A 2. B
```

Result: two chunks, `[null, 1]`; the key is not separated. A normal key with a
divider works correctly (`[null, null]`).

**Fix.** Do not add new mode-detection heuristics. Reword the contract: mixing
bullet and numbered questions is unsupported; numbered markers take precedence
and may absorb bullet text. Keep the existing design rule.

### 3. Low — stale work-tracker line

`docs/plan/README.md` still says “P01/P02 are still pending; the 2021 input was
sliced manually”, while both are marked done in the status table and P09 says
the docs match P01–P08.

**Fix.** Correct that sentence, preserving the historical note that the 2021
input was sliced manually before the extractor existed.

### 4. Low — stale build size

`docs/BUILD.md` says the file is `45607` bytes and the build prints `45598`
characters. Current values:

- `node src/build/build.js` prints `58777 bytes`.
- `wc -c src/bookmarklet.js` prints `58788` bytes (trailing newline included).

**Fix.** Update both numbers; keep the character-vs-byte explanation.

### 5. Low — salvage/bullet behavior is under-tested

`docs/INVARIANTS.md` says every repaired item carries
`OCR boundaries repaired; verify question and option split` and claims 50
inserts for block 2. `docs/EDGE_CASES.md` repeats that. The fixtures do not
assert either:

- `anomaly-block2.json` asserts no flags and no insert count.
- `anomaly-block1.json` asserts flags on only two of 19 items.

A regression that drops the salvage flag would still pass. Add direct tests.

**Unit tests to add to `tests/unit.js`** (read fixtures with `fs`):

1. `salvageNormalize` leaves `Ph.D.` and `U.S.A.` unchanged with zero inserts.
2. `salvageNormalize` still repairs fused labels (`inA.Italy`,
   `disenfranchised.D.the`) and counts those inserts.
3. `splitSectionsWithSalvage` on `anomaly-block2` returns `salvaged === true`,
   `inserts === 50`, and the 12-number sequence.
4. `splitQuestionItems` on `anomaly-block1` returns 19 items, all `num: null`.
5. All five `bank-*.txt` inputs are no-ops: `inserts === 0` and
   `text === input`.

That takes the unit suite from 59 to 64 tests unless the implementation adds
more. Update current-status counts after running it; historical P09 “59” notes
may remain historical.

**Harness strengthening (recommended).** Add a `required_flags` expected key for
`kind: "questions"`:

- Add it to `ASSERTED_KEYS.questions` and validate it as an array of strings.
- For each flag, assert every item includes it; report the missing item numbers.
- Add `required_flags: ["question number missing"]` to `anomaly-block1.json`.
- Add `required_flags` with the exact salvage flag to `anomaly-block2.json`.

This covers every item without hard-coding each item’s full flag list.

### 6. Low — “no live browser run” is unscoped

`README.md` and `AGENTS.md` say there was no live browser run, but Auto-Save
live tests are recorded in `docs/plan/README.md` and
`docs/plan/as-08-active-mode.md` (rows `#1766`/`#1767`). The claim is true only
for parser/OCR/bank changes.

**Fix.** Scope the wording: “No live browser run for the parser/OCR/bank
changes; Auto-Save live checks are recorded separately. No live `questions`
schema check.” Leave the historical `WORKSPACE_SETUP.md` phase notes alone; they
are already labelled historical.

## Suggested implementation order

1. Fix `salvageNormalize` and rerun the abbreviation repro plus the block-2
   probe (12 chunks, 50 inserts).
2. Add the five unit tests and the `required_flags` harness support/fixture
   keys.
3. Correct the docs: `docs/SPEC.md`, `docs/BUILD.md`,
   `docs/plan/README.md`, `README.md`, `AGENTS.md`, and any current-status unit
   counts (`AGENTS.md`, `README.md`, `WORKSPACE_SETUP.md`,
   `docs/plan/README.md`).
4. Update the sources in `docs/INVARIANTS.md` and `docs/EDGE_CASES.md` to cite
   `tests/unit.js` once those tests exist.
5. Rebuild and run the full audit.
6. Commit separately from P09. Suggested split:
   - `fix: preserve abbreviations during OCR salvage` (code + regression tests)
   - `test: require salvage and bullet flags in fixtures` (harness + fixtures)
   - `docs: correct post-P09 audit findings` (docs and counts)

Do not amend `fdc0af1`; keep the audit trail.

## Acceptance

| Check | Expected |
|---|---|
| abbreviation repro | text unchanged; `inserts === 0` |
| block-2 probe | `salvaged === true`, `inserts === 50`, 12 nums as listed |
| block-1 probe | 19 items, all `num: null` |
| bank probe | five inputs, `inserts === 0`, byte-identical text |
| `node tests/runner.js` | 30 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | 64 PASS (or the new actual count), 0 FAIL |
| `node tools/extract-bank.js --check` | exits 0 |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds, prints `1` |
| bookmarklet body `new Function(...)` | exits 0 |
| `rg -n '%' src/bookmarklet.js` | no matches |
| `git diff --check -- . ':(exclude)archive/live-sources/IMPROVISED C.docx.txt'` | no whitespace errors |
| `rg -n "qwen2-s1" AGENTS.md README.md WORKSPACE_SETUP.md docs --glob '!docs/plan/**'` | no matches; historical refs stay in `docs/plan/` |

## Guardrails

- Do not regenerate expected fixtures from parser output.
- Do not weaken the two salvage gates: `inserts >= 2` and `after > before`.
- Keep the bank no-op guarantee and the block-2 12-chunk/50-insert result.
- Keep bullet chunks at `num: null`; never invent numbers.
- Do not edit `src/bookmarklet.js`; edit modules and rebuild.
- No inline `//` comments in source modules; the generated file must be one line
  with no `%`.
- Do not stage the untracked `.playwright-mcp/`, `review-packet/`,
  `review-packet.zip`, or `docs/plan/as-07-final-review-and-as-08-prompt.md`.
- The untracked `review-packet/` still contains the old `qwen2-s1` fixture. It is
  stale review material, not the live tree; do not treat its content as current.
- Do not touch PHP, `ocr_helper.js`, or existing storage key names/shapes.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: done; all acceptance checks pass
Parser changes: split the fused-option replacement into lowercase-text and
  punctuation/digit rules; the second has a whitespace/end lookahead so Ph.D.
  and U.S.A. are preserved. Block-2 still yields 12 chunks, nums
  [null,2,3,4,7,8,9,12,13,14,15,16], 50 inserts.
Test changes: tests/unit.js 59 -> 64 (abbreviation no-op, fused-label repair,
  block-2 12/50, block-1 19 null nums, five-bank no-op). Runner adds
  required_flags (array of strings) and asserts it on every item; added to
  anomaly-block1 (question number missing) and anomaly-block2 (salvage flag).
Docs changed: SPEC bullet/numbered wording; BUILD size 58908/58897 and
  non-ASCII count; plan README stale P01/P02 line and counts; README/AGENTS
  live-run scope; WORKSPACE_SETUP current counts; INVARIANTS/EDGE_CASES cite
  tests/unit.js.
Audit results: runner 30/30; unit 64/64; extractor --check OK; build 58897,
  one line, body parses, no %; git diff --check clean; no qwen2-s1 outside
  docs/plan.
Remaining risks: no live browser run for parser/OCR/bank; live questions
  schema unverified; stale ocrQueue still needs reset/re-paste.
```
