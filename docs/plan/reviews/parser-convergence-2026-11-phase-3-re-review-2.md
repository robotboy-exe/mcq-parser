# Parser Convergence 2026-11 Phase 3 Re-Review 2

- **Date:** 2026-11-26
- **Cycle / phase:** `parser-convergence-2026-11`, phase 3
- **Package:** PC03, Spaced Initialism Option Boundaries ([`pc-03-spaced-initialisms.md`](../parser-convergence/pc-03-spaced-initialisms.md))
- **Mode:** closure-focused rigorous re-review (review round 3 for `BLOCK-1`, review round 2 for `BLOCK-3`)
- **Candidate:** pushed `origin/scratch/pc03-spaced-initialisms` at exact commit `69934bf18ff894ba83cff979433a2e06d5aa156b` (handoff-only child of pushed fix commit `78a8f17`; `git diff 78a8f17..69934bf --stat` modifies only `docs/plan/parser-convergence/pc-03-spaced-initialisms.md`, `+4/-1`)
- **Package base:** `331e81f1bb77dfad74c6a0822c0bafd781c17e67` (`origin/scratch/parser-convergence-cycle`)
- **Prior reviews:**
  - [`parser-convergence-2026-11-phase-3.md`](parser-convergence-2026-11-phase-3.md) (candidate `37ea241`, verdict `BLOCK`: `BLOCK-1`, `BLOCK-2`, `FIX-1`, `NOTE-1`)
  - [`parser-convergence-2026-11-phase-3-re-review.md`](parser-convergence-2026-11-phase-3-re-review.md) (candidate `74505ae`, verdict `BLOCK`: `BLOCK-2`/`FIX-1` closed, `BLOCK-1` open round 2, `BLOCK-3` recorded round 1, `NOTE-2`)
- **Review environment:** clean detached worktree `$HOME/tmp/pc03-re-review-2-69934bf` at `69934bf18ff894ba83cff979433a2e06d5aa156b`; Node.js `v26.13.0`, PHP `8.5.12` CLI. Temporary worktree removed after verification; no repository branch or product file was modified, and this review record remains uncommitted.

## Verdict

**PASS WITH ACCEPTED FINDINGS.** Every prior `BLOCK` and `FIX` finding (`BLOCK-1`, `BLOCK-2`, `BLOCK-3`, `FIX-1`) is closed on pushed candidate `69934bf`, all baseline suites and 4-surface parity checks pass, and only one non-blocking residual edge-case note (`NOTE-3`) is recorded.

- **Closed in this re-review:** `BLOCK-1`, `BLOCK-3`.
- **Previously closed (verified unchanged):** `BLOCK-2`, `FIX-1`.
- **New findings:** `NOTE-3` (non-blocking residual edge cases outside the frozen closure contracts).
- **Commit / merge readiness:** Ready to publish this review record, reconcile PC03 to `done` in coordinator/map, and merge `scratch/pc03-spaced-initialisms` (`69934bf`) into `scratch/parser-convergence-cycle` upon explicit owner authorization (`main`, `owner-tool-integration`, `experiments`, and `experiments-alt` remain untouched).

## Prior Finding Disposition

| Finding | Round | Frozen Criteria Check | Disposition |
|---|---|---|---|
| `BLOCK-1` | Round 3 | Criteria 1–3 pass: `isOptionLineStart` (`src/parser/core.js:388-401`) accepts wrapped single-line option labels (`\nA.\nKennedy`) and `orderedOptionCompletion` (`373-386`) counts only line-leading labels so out-of-order in-text mentions (`(see D. note)`) no longer hide real boundaries. All 4 named Criterion 2 vectors (`John F.`, `U. S.`, wrapped `John F.\nA.\nKennedy`, mention `John F.\nA. Kennedy (see D. note)`), plus `Pick one ... (see D. note)` and `Vitamin C. ... (see D.)`, match `331e81f` cleanly; `B1-blank-seq` (`A.\n\nB.`), existing PC03 vectors, and all baselines pass with 4-surface parity. | **CLOSED** |
| `BLOCK-3` | Round 2 | Criteria 1–2 pass: `restoredOptionMatch` (`src/parser/core.js:411-425`) selects the trailing covered line-leading boundary (or trailing covered spaced label for inline sets), rejecting unspaced `A.D.`/`A.B.` tokens. All 4 named vectors (`A. D. A. 70`, `A. D.\nA.\n70`, `A. D.\nA. 70 (see C.)`, `Compare A. B. with C. I. F. A. first ...`) keep the stem initialisms in `question` and select the real `A.` option (`a: "70"` / `"70 (see"` / `"first"`), and controls (`Q46`, `inner-option`, incomplete sets, unspaced `A.D.`) remain unchanged. | **CLOSED** |
| `BLOCK-2` | Prior (closed) | Re-verified green on `69934bf`: trailing `C. I. F.`, `A. D.`, `B. C.`, and wrapped `C. I.\nF.` before `\nA.`, `\n\nA.`, and inline `A.` remain in `question` with `A.`–`D.` intact and `flags: []`. | **CLOSED** |
| `FIX-1` | Prior (closed) | Re-verified green on `69934bf`: `deployed/admin_questions.php:1050-1051` loads `src/parser/core.js?v=2.5.5` before `ocr_helper.js?v=2.4.8`; all 15 manifest file line counts, byte sizes, and SHA-256 hashes in `docs/DEPLOYMENT.md:61-75` match disk bytes; `php -l deployed/*.php` passes `7/7`. | **CLOSED** |

### Criterion Reconciliation Confirmed (`BLOCK-3`, `(see C.)` vector)

`pc-03-spaced-initialisms.md:245-254` asks the reviewer to confirm the reading for `1. This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100`. Confirmed: `bestOptionCandidate` selects the earliest `C.` (`(see C.)`) identically to `331e81f` and to `BLOCK-1` Criterion 2's frozen `1. Who is John F.\nA. Kennedy (see D. note)\n...` (`a: "Kennedy (see"`). With `BLOCK-3` fixed, `question` recovers `"This happened in A. D."` and Option A begins at `"70 (see"` (removing the `"D. A. "` stem corruption present on `331e81f` and `74505ae`) without adding a single-vector special case that would regress `BLOCK-1` or `bestOptionCandidate` controls.

## Baseline Commands and Build Verification

Executed in clean detached worktree `$HOME/tmp/pc03-re-review-2-69934bf` at `69934bf`:

| Command | Result |
|---|---|
| `node tests/runner.js` | `73` fixtures: `73 PASS`, `0 FAIL`, `0 PENDING` |
| `node tests/unit.js` | `184 PASS`, `0 FAIL` |
| `node tests/ocr-helper.js` | `41 PASS` |
| `node tests/key-bookmarklet.js` | `42 PASS` |
| `node tests/single-source.js` | `15 PASS` |
| `node tests/underline-toolbar.js` | `10 PASS` |
| `node tests/question-preview.js` | `7 PASS` |
| `node tests/math-tool.js` | `26 PASS` |
| `node tests/render-markup.js` | `69 PASS` |
| `node tools/extract-bank.js --check` | `OK: source, anchors, counts, and 7 output hashes match` |
| `node src/build/build.js --check` | exit `0` (`134947 bytes`) |
| `node src/bookmarklets/key/build.js --check` | exit `0` (`75101 bytes`) |
| `php tests/php-render.php` | `PASS: 33 PHP renderer vectors` (PHP `8.5.12`) |
| `php tests/admin-question-store.php` | `PASS: 8 admin-question-store checks` (PHP `8.5.12`) |
| `php tests/cbt-question-order.php` | `PASS: 14`, `FAIL: 0` (PHP `8.5.12`) |
| `php -l deployed/*.php` | `7/7` (`No syntax errors detected`) |
| `git diff --check 331e81f..69934bf` | exit `0` (clean) |

## Closure-Focused Adversarial Investigation

### 1. Implementation path traced (`src/parser/core.js`)

1. `isOptionLineStart(raw, token)` (`388-401`) advances `start` to `token.letter`, checks leading horizontal-only whitespace on the line (`/^[^\S\n]*$/`), and accepts either non-whitespace on the same line or non-whitespace on the immediately following line when the label is wrapped alone (`\nA.\nKennedy`, `396-400`).
2. `orderedOptionCompletion(raw, matches, index)` (`373-386`) ignores matches inside option bodies by requiring `isOptionLineStart(raw, matches[i])` (`382`), so an in-text mention (`(see D. note)`) cannot mask a real `A.`–`D.` line sequence.
3. `restoredOptionMatch(raw, tokens, letter, covered)` (`411-425`) collects covered `initialismTokens` matching `letter` that are whitespace-preceded (`/\s/.test(raw.charAt(token.start - 1))`) and not followed by `[A-Z]`/`[A-Z].` (`!/^[A-Z](?:\.|\s|$)/.test(raw.slice(token.end))`), preferring the trailing `isOptionLineStart` candidate and otherwise the trailing spaced candidate.
4. `parseQuestion` (`959-983`) replaces `narrowed` with `kept = narrowed.concat(restored).sort(...)` whenever `hasCompleteOptionSet(kept)` holds.

### 2. Executed closure & adversarial scenario matrix (`331e81f`, `74505ae`, `69934bf`)

All 41 vectors (27 main + 14 deeper edge probes) were executed in Node against `src/parser/core.js` (`331e81f`, `74505ae`, `69934bf`), and all 27 main vectors were verified identical (`JSON.stringify({ q, a, b, c, d, flags })`) across `core.js`, `ocr_helper.js` (`parseAll`), `src/bookmarklet.js` (`OCRParser.parsePaste`), and `src/bookmarklets/key/bookmarklet.js` (`OCRParser.parsePaste`):

| Scenario / Interaction | Base `331e81f` | Prior `74505ae` | Candidate `69934bf` | Status |
|---|---|---|---|---|
| `John F.` / `U. S.` before `\nA.` + `(option A. wrong)` | Clean (`a: "Kennedy"` / `"dollar"`) | Clean | Clean (matches `331e81f`) | Executed (PASS — `BLOCK-1`) |
| `John F.\nA.\nKennedy` (wrapped `\nA.`) | Clean (`a: "Kennedy"`) | Regressed (`a: "wrong)"`) | Clean (`q: "Who is John F."`, `a: "Kennedy"`) | Executed (PASS — `BLOCK-1`) |
| `John F.\nA. Kennedy (see D. note)` | `a: "Kennedy (see"`, `d: "note)"` | Regressed (`a: "wrong)"`) | Matches `331e81f` cleanly | Executed (PASS — `BLOCK-1`) |
| `Pick one\nA. value A. B.\nB. two (see D. note) B. inside...` | `a: "value A. B."`, `b: "two (see"` | Regressed (`b: "inside"`) | Matches `331e81f` cleanly | Executed (PASS — `BLOCK-1`) |
| `Pick one\nA. Vitamin C.\nB. Rich in B. vitamins (see D.)...` | `a: "Vitamin"`, `b: "Rich in B. vitamins (see"` | Regressed (`a: "Vitamin C. B. Rich in"`) | Matches `331e81f` cleanly | Executed (PASS — `BLOCK-1`) |
| `The sequence is A.\n\nB. followed by\nA. one...` | Split `A.`/`B.` | Clean | Clean (`q: "The sequence is A.\n\nB. followed by"`) | Executed (PASS — `BLOCK-1`) |
| `This happened in A. D. A. 70 B. 80 C. 90 D. 100` (inline) | Split `A. D.` | Split `A. D.` | Clean (`q: "This happened in A. D."`, `a: "70"`, `flags: []`) | Executed (PASS — `BLOCK-3`) |
| `This happened in A. D.\nA.\n70\nB. 80\nC. 90\nD. 100` (wrapped) | Split `A. D.` | Split `A. D.` | Clean (`q: "This happened in A. D."`, `a: "70"`, `flags: []`) | Executed (PASS — `BLOCK-3`) |
| `This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100` | `q: "This happened in"`, `a: "D. A. 70 (see"` | `q: "This happened in"`, `a: "D. A. 70 (see"` | `q: "This happened in A. D."`, `a: "70 (see"` | Executed (PASS — `BLOCK-3`) |
| `Compare A. B. with C. I. F. A. first B. second C. third D. fourth` | Split `A. B.` / `C.` | Split `A. B.` | Clean (`q: "Compare A. B. with C. I. F."`, `a: "first"`, `flags: []`) | Executed (PASS — `BLOCK-3`) |
| Derived wrapped variants: `\nA.  \nKennedy`, `\n\tA.\n\tKennedy`, `\r\nA.\r\nKennedy`, blank `\nA.\nB.`, `\nB.\nRich...`, `\nC.\nthree (see D. note)` | Clean / matched | Regressed or failed | Matches `331e81f` / clean | Executed (PASS) |
| Derived `A. D.` + later `(not A. B.)` with `\nA. 70`, `\nA.\n70`, `\nA. 70...\nA. B. note`, `From U. S. A. to C. I. F. A. 70`, `From A. B. to A. D. A. 70`, `B. from B. C.` | Split `A. D.` / `U. S.` / `A. B.` | — | Clean (`q` keeps stem initialisms, `a: "70"`, `d` keeps `(not A. B.)`, `flags: []`) | Executed (PASS) |
| Derived unspaced controls: `A.D. A.D. 70`, `A.D. A. 70`, `A.D. B. C. A. 70`, `A. D.\nB. 80` (incomplete) | Unspaced ignored | — | Identical on unspaced/incomplete; `A.D. B. C. A. 70` also keeps `B. C.` in stem | Executed (PASS) |
| Derived `C. I. F.\nA.`, `C. I. F. A.`, `(a)-(d)`, `A)-D)`, `C. E. F. Small` (`Q46`) | `C. I. F.` split / controls clean | Clean | All clean (`flags: []` on `C. I. F.`, controls unchanged) | Executed (PASS) |
| Derived compound edge: `1. This happened in A. D. A. 70 B. 80 C. 90 D. 100 (not A. B.)` | Split `A. D.` (`a: "D. A. 70"`) | — | Restores `A.` from `(not A. B.)` in D (`a: "B.)"`) | Executed (Residual — `NOTE-3`) |
| Derived double-blank wrap: `1. Who is John F.\nA.\n\nKennedy\nB. Adams (option A. wrong)...` | Clean (`a: "Kennedy"`) | Absorbed `\nA.` | Absorbed `\nA.` (`isOptionLineStart` checks 1 line ahead) | Executed (Residual — `NOTE-3`) |
| 4-surface `vm` parity across 27 vectors | — | — | Identical across `core.js`, `ocr_helper.js`, `src/bookmarklet.js`, `src/bookmarklets/key/bookmarklet.js` | Executed (PASS) |

### 3. Highest-risk interactions and unverified items

- **Highest-risk interactions examined:** single-line wrapped option detection (`isOptionLineStart` checking 1 line past `\nA.`), exclusion of mid-option letter mentions from `orderedOptionCompletion`, `restoredOptionMatch` trailing-boundary selection without fabricating unspaced `A.D.`/`A.B.` boundaries, and 4-surface parity between `core.js`, `ocr_helper.js`, `src/bookmarklet.js`, and `src/bookmarklets/key/bookmarklet.js`.
- **Unverified material scenarios:** `php tests/cbt-staging.php` (requires disposable MySQL URL; no PHP logic changed in PC03) and live production site execution (prohibited by `docs/LIVE-SAFETY.md` and PC03 scope).

## Findings

### `NOTE-3` (non-blocking) — Residual compound edge cases outside frozen `BLOCK-1`/`BLOCK-3` criteria

- **Evidence:** `src/parser/core.js:396-400, 411-425`.
- **Quoted rule (`docs/plan/parser-convergence/pc-03-spaced-initialisms.md:39-40` & `docs/plan/prompts/review-session.md:106`):**
  > `Correctness | Initials remain text; the real A-D set supplies boundaries and no false flag`
  > `NOTE-N: documentation issue or residual risk that does not invalidate the package.`
- **Severity justification:** Neither residual case violates the frozen closure contracts for `BLOCK-1` (which explicitly specifies the single-wrap `\nA.\nKennedy` pattern) or `BLOCK-3` (which specifies preferring a trailing boundary over an earlier stem initialism without introducing a regression over `331e81f`), and all 4 named vectors and standard wrapped/newline layouts pass cleanly. They are recorded as non-blocking residual risk:
  1. `restoredOptionMatch` (`src/parser/core.js:417-425`) collects covered candidates across the entire chunk, so in a compound **inline** question where a stem `A. D.` precedes an inline `A. 70` **and** Option D also contains a second spaced `A.` initialism (`1. This happened in A. D. A. 70 B. 80 C. 90 D. 100 (not A. B.)`), the trailing candidate inside Option D is restored instead of the inline `A.` before `70` (whereas newline/wrapped `A. 70` handles `(not A. B.)` cleanly, and `331e81f` also failed this input by splitting at `A. D.`).
  2. `isOptionLineStart` (`src/parser/core.js:396-400`) checks one line after a lone label (`\nA.\nKennedy`); if an extra blank line separates the lone label from its option text (`\nA.\n\nKennedy`) while a stem ends in `John F.` and Option B repeats `A.`, `isOptionLineStart` returns `false`.

## Externalize-First Verification

### Production files (`331e81f` -> `69934bf`)

| Production path | Package base (`331e81f`) | Diff vs `331e81f` | Final (`69934bf`) | Responsibility / deployment | Production-path test |
|---|---|---|---|---|---|
| `src/parser/core.js` | 1,733 L / 60,722 B / `c9ac52b3a715` | `+124/-2` | 1,855 L / 65,965 B / `28172dfafcb3` | Canonical pure parser `2.5.5` (D-111 initialism span helpers + filter/restore in `parseQuestion`); site root `src/`, loaded by `admin_questions.php` and inlined by both bookmarklet builds | `tests/runner.js` (73), `tests/unit.js` (184), `tests/ocr-helper.js` (41), `tests/single-source.js` (15) |
| `ocr_helper.js` | 127 L / 4,917 B / `b83835b798c3` | `+1/-1` | 127 L / 4,917 B / `86497f4d0686` | Thin deployed adapter (`EXPECTED_CORE_VERSION = '2.5.5'`); site root; `+51/-45` vs `archive/live-sources/ocr_helper.js` (cap <= 100) | `tests/ocr-helper.js` (41 checks, real module & Load path) |
| `src/bookmarklets/key/entry.js` | 596 L / 24,700 B / `14c33a5dc88a` | `+1/-1` | 596 L / 24,700 B / `34e78c3e1e89` | Key bookmarklet entry (`EXPECTED_CORE_VERSION = '2.5.5'`); inlined only into key artifact | `tests/key-bookmarklet.js` (42 checks, real artifact) |
| `deployed/admin_questions.php` | 1,057 L / 62,877 B / `e4e013f78e80` | `+2/-2` | 1,057 L / 62,877 B / `388d38532c83` | Loads `src/parser/core.js?v=2.5.5` before `ocr_helper.js?v=2.4.8`; site root; `+96/-85` vs `archive/live-sources/admin_questions-2026-10-31.php` (cap <= 100) | `php -l deployed/admin_questions.php` (PASS); `docs/DEPLOYMENT.md` manifest (`15/15` verified) |

### Test and fixture files (`331e81f` -> `69934bf`)

- Fixtures (`input_origin: "synthetic"`, manually transcribed, carried from round 1):
  - `fixtures/inputs/spaced-initialism-{cif-stem,ad-stem,bc-stem,wrapped,inner-option}.txt` + matching `fixtures/expected/*.json`
- Test updates (`76ddc49` -> `69934bf`, cumulative vs `331e81f`):
  - `tests/fixtures/ocr-helper-spaced-initialism-wrapped-boundaries.txt` (`+11/-0`, new 2-question real Load fixture: `John F.\nA.\nKennedy` and `A. D.\nA. 70`)
  - `tests/ocr-helper.js` (`+19/-0` vs `76ddc49`, `+50/-1` vs `331e81f`): adds `Load keeps a wrapped option label and a stem initialism out of the fields` (`587-604`)
  - `tests/single-source.js` (`+2/-0` vs `76ddc49`, `+18/-6` vs `331e81f`): adds wrapped `John F.\nA.\nKennedy` and inline `A. D. A. 70` parity vectors (`180-181`)
  - `tests/unit.js` (`+48/-0` vs `76ddc49`, `+137/-1` vs `331e81f`): adds 3 unit tests (`218-264`) covering wrapped `\nA.\nKennedy`, out-of-order mentions (`(see D. note)`, `A. value A. B.`, `Vitamin C.`), and trailing `A.` restore (`A. D. A. 70`, `Compare A. B. with C. I. F.`, wrapped `A. D.\nA.\n70`, `A. D.\nA. 70 (see C.)`)

### Excluded generated and archived artifacts

- `src/bookmarklet.js`: generated stimulus artifact (`1` L / `134,948` B with `\n`, `134,947` B stripped / sha256 `b38a9f048783`; base `131,268` B; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/single-source.js`, and 27-vector `vm` parity.
- `src/bookmarklets/key/bookmarklet.js`: generated key artifact (`1` L / `75,102` B with `\n`, `75,101` B stripped / sha256 `8660fe2c5697`; base `71,422` B; `+1/-1` vs `331e81f`), verified via `build.js --check`, `tests/key-bookmarklet.js`, `tests/single-source.js`, and 27-vector `vm` parity.
- `src/bookmarklet.min.js`: absent/untracked, untouched.
- `archive/live-sources/*`: unchanged reference snapshots used only for cap verification.
- Docs (`331e81f..69934bf`): `AGENTS.md` (`+2/-2`), `docs/AGENTS.md` (`+1/-1`), `docs/DECISIONS.md` (`+48/-0`), `docs/DEPLOYMENT.md` (`+7/-7`), `docs/DEVELOPER-GUIDE.md` (`+2/-2`), `docs/EDGE_CASES.md` (`+4/-0`), `docs/INVARIANTS.md` (`+1/-0`), `docs/SPEC.md` (`+15/-1`), `docs/STATUS.md` (`+33/-3`), `docs/plan/README.md` (`+39/-9`), `docs/plan/parser-convergence/pc-03-spaced-initialisms.md` (`+248/-6`), `docs/plan/prompts/phase-map.md` (`+10/-3`), `docs/plan/reviews/parser-convergence-2026-11-phase-3.md` (`+199/-0`), `docs/plan/reviews/parser-convergence-2026-11-phase-3-re-review.md` (`+170/-0`).

## Approvals, Commit Readiness, and Next Action

- **Approvals:** Gate 1 amendment keeping `spaced-initialism-inner-option` as a must-stay-passing control (`pc-03-spaced-initialisms.md:43`); `D-111` recorded in `docs/DECISIONS.md:1847-1893`. No live-origin line-cap exception is required (`+96/-85` and `+51/-45` stay below `+100`).
- **Commit readiness:** candidate `69934bf18ff894ba83cff979433a2e06d5aa156b` is already committed on `origin/scratch/pc03-spaced-initialisms`; this review record remains uncommitted per review protocol. Ready for owner authorization to publish this review record, reconcile PC03 to `done` in coordinator/map, and merge `scratch/pc03-spaced-initialisms` into `scratch/parser-convergence-cycle`.
- **Review status:** Phase 3 re-review 2 complete with verdict **`PASS WITH ACCEPTED FINDINGS`** (`BLOCK-1` and `BLOCK-3` **closed**; `BLOCK-2` and `FIX-1` remain **closed**; non-blocking `NOTE-3`). PC03 is review-settled; PC04 may proceed once PC03 is reconciled and merged into `scratch/parser-convergence-cycle`.

NEXT COMMAND: @[docs/plan/prompts/phase-session.md] phase 4
