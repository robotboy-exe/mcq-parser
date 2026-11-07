# Owner Tool 2026-11 Phase 10 Re-Review

- **Date:** 2026-11-07
- **Reviewer:** Buffy (Codebuff), independent re-review session
- **Package:** OT09 — Cloze OCR (Release C)
- **Scope:** read-only `owner-tool-integration` at `224957e` plus the uncommitted
  OT08+OT09 tree and the 2026-11-07 `fix`. Package base remains `224957e` plus
  the uncommitted OT08 tree.
- **Record:** first re-review of phase 10. It disposes `BLOCK-1` and `FIX-1` from
  [`owner-tool-2026-11-phase-10.md`](owner-tool-2026-11-phase-10.md) and adds one
  new finding. The original record is unchanged.

## Re-Review Scope And Frozen Contracts

This session read the original review record, the package and its Disposition
and Fix note, the fix-session Gate 1 plan, the intent, coordinator, active map,
implementation, tests, fixtures, and docs. It re-ran every baseline, reproduced
the per-file measurements and hashes, and probed the frozen criteria directly.
It added adversarial probes derived from the closure criteria (collision
placement, group scoping, second-order collision, and a compaction-equivalence
fuzz), not new review dimensions. It wrote only this record.

Frozen criteria taken from the accepted record (lines 144–224) and the fix
Gate 1, unchanged:

| ID | Frozen closure criterion |
|---|---|
| `BLOCK-1` | `src/parser/cloze.js` ≤ 250 lines by `wc -l`, detection behavior unchanged, all suites green, handoff measurement corrected; no exception route |
| `FIX-1` | A cloze row number colliding with an already-parsed ordinary item refuses that whole group with a distinct warning naming the colliding number(s); rows stay on the legacy path; no synthesized item, no context, no silent drop; zero automatic posts; non-colliding rows still correct |

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --porcelain`, `git rev-parse HEAD` | On `owner-tool-integration` at `224957e`; expected OT08+OT09 tree; only `.cloud-attachments/` unrelated |
| `node tests/runner.js` | 59 fixtures: 59 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 160 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 53 PASS, 0 FAIL |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 4 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | OK: source, anchors, counts, 7 output hashes |
| `wc -l src/parser/cloze.js` | **242** (cap 250; was 274) |
| `git diff --numstat 224957e` | `core.js` +152/−10, `admin_questions.php` +5/−5, `controller.js` +36/−1, reconciled below |
| Compaction equivalence fuzz (pre-fix `cellsOf` vs `cloze.cellsOf`) | 4000 random rows/starts: **0 mismatches** |
| Compaction equivalence fuzz (pre-fix `columnStarts` vs live) | 4000 random vote sets: **0 mismatches** |
| Collision before table: ordinary `71.` + valid 71-72 block | 0 contexts; warning `numbered gap rows 71 collide with an ordinary question; read as ordinary questions.`; rows parsed as ordinary questions; no `contextRef` |
| Collision after table: valid 71-72 block + ordinary `72.` | 0 contexts; warning names 72; both rows legacy |
| Healthy group beside a refused group: collision 71-72 + table 73-74 | contexts `[ctx-1 [73,74], linkedCount 2]`; warning names only 71; links correct |
| Second-order collision: ordinary 71 + group 71-73 + group 73-74 | 0 contexts; one warning names `71, 73`; all rows legacy; no links |
| Non-collision control: supplied Section 6 | 1 context, 10 targets, 10 items, 0 warnings, version `2.3.1` |
| Two cloze groups with identical numbering (no ordinary question) | 2 contexts, one item set, no parser warning; later card has no members — **FIX-2** |
| `grep` `.submit()` / `requestSubmit` / `fetch(` in `src/owner-tool/*.js` | 0 matches in all seven modules |
| Documentation checks (`SPEC`, `INVARIANTS`, `EDGE_CASES`, `DECISIONS`, `AGENTS`, `STATUS`, coordinator, map) | Collision rule documented; INV-108, EC-105, D-69 present; counts 108/96 and 105/101; version `2.3.1` everywhere except historical decision text and the superseded 2026-11-06 handoff snapshot (see note below) |

PHP remains absent on this host, so no `php -l`, PHP suite, or dynamic candidate
execution was possible.

## Disposition Of Prior Findings

### `BLOCK-1` — CLOSED

- Measured `src/parser/cloze.js` at **242 lines** (`wc -l`), 8639 bytes,
  SHA-256 `b9304a7d6ea1b2978c093354c15a7a2af1eff0c76e6fe62340d82271e75d2069`,
  against the 250-line cap and the 274-line pre-fix baseline.
- Behavior unchanged is independently supported: the full pre-existing 59
  fixtures, 160 unit, and 53 owner-tool checks pass with no fixture edit; the
  only moved assertion is the parser-version string; 8000 randomized
  equivalence cases for `cellsOf` and `columnStarts` match the pre-fix
  algorithms exactly; the refusal warning strings were inspected in
  `readTable` and are unchanged.
- Handoff measurement corrected: the Fix note records 242 / 8639 with the new
  hash, and the review's per-file table is superseded by it, as the contract
  requires.

### `FIX-1` — CLOSED

- The collision is detected in `parsePaste` (`core.js:884-910`) by comparing
  synthesized numbers with ordinary item numbers; `cloze.detect(raw, blocked)`
  (`cloze.js:188-242`) skips a blocked table without removing its lines, so the
  rows return to the legacy text at their original position.
- Probes confirm every criterion: collision before and after the table both
  refuse the whole group; the warning names the exact numbers; zero contexts and
  no `contextRef` remain; a healthy neighbouring group keeps its context and
  both links; the second-order fallback blocks all remaining groups rather than
  emitting a partial one; all rows stay parsed; zero automatic posts.
- Evidence is production-path: the new unit tests call `parsePaste` and
  `cloze.detect` directly, and the owner-tool suites run the real modules.

## New Finding

### `FIX-2` — Two cloze groups that share numbering silently lose the later group's options

**Exact defect.** With two fully evidenced cloze groups numbered identically
and no ordinary question (probe: two 71-72 groups), `parsePaste` returns two
contexts but one item set: the first group's items survive the number merge, the
second group's synthesized items are dropped, and its context keeps
`targets [71,72]`, `linkedCount 2`, and zero members. No parser warning names
the lost table. The owner tool partially mitigates: `controller.js:509-511`
pushes `question 71 is linked to more than one context` and
`context-panel.js:60-64` appends `Target 71, 72 is assigned more than once.`,
but neither says a table's options were dropped, and the second card renders
without members.

**Supported preconditions.** Both groups meet the four cloze evidences and their
row numbers coincide across groups. Realistic when two sections or two exams are
pasted together with repeated numbering; not reachable from a single family.

**Finite closure criteria.** When a synthesized cloze number duplicates another
cloze group's synthesized number, no context may be emitted with unmatched
members: refuse the later group as a whole with a warning naming the colliding
numbers and leave its rows on the legacy path, or refuse every colliding group.
Either mechanism is acceptable if the observable result is: no zero-member
context, a warning that names the numbers, the rows still parsed, and zero
automatic posts.

**Required evidence.** A parser probe or unit test asserting the two-group
duplicate yields no context without members, the naming warning, the surviving
group's links, and full runner/unit/owner-tool results; the handoff must record
the new evidence.

**Non-goals.** No renumbering or auto-splitting of duplicate families, no change
to the `FIX-1` path or its warning, no global duplicate-number policy for
ordinary questions, no PHP/browser work.

## Acceptance Coverage (re-checked)

| Acceptance check | Result |
|---|---|
| Supplied Q71-Q80 table | PASS: ten linked items, four transcribed options, 43-check fixture |
| Multiword Q78 cells | PASS: `a vow`, `an oath`, `an allegiance`, `a pledge` distinct |
| Context | PASS: `[[gap:71]]`–`[[gap:80]]`, two paragraphs retained |
| Generated stems | PASS: `Choose the option that best fills gap N.`, editable slots |
| Same-paste key | PASS for the evidenced `ANSWERS` shape only; synthetic, external gate open |
| Candidate | PASS by inspection and `cbt-context.js` 4 PASS; PHP page not executable here |
| Multiple contexts | PASS for comprehension+cloze and cloze+cloze with distinct numbering; identical numbering is `FIX-2` |
| Singular paste | PASS |
| Ambiguous table | PASS: every refusal warns, no guessed options |
| Limits | PASS: 501 refused, 500 accepted; empty/partial rows refused |
| Regression | PASS: 59/160/53/13/4 and 7 bank hashes |

## Per-File Measurements (independently reproduced)

Base = `224957e` + uncommitted OT08 tree; OT08's recorded finals are the
per-package baselines. Production lines are `wc -l`.

| File | Package additions/deletions | Final lines/bytes | SHA-256 (working tree) | Responsibility | Deployment / direct test |
|---|---:|---:|---|---|---|
| `src/parser/cloze.js` | +242 / −0 | 242 / 8639 | `b9304a7d6ea1b2978c093354c15a7a2af1eff0c76e6fe62340d82271e75d2069` | Recognition, columns, synthesis, optional blocked skip | Loaded before `core.js` at `admin_questions.php:1084`; runner; unit |
| `src/parser/core.js` | +76 / −4 | 978 / 33465 | `d0417835e9ce79748fd022c0ef1da621296ece65f54f4cabf6d3b71abd728d38` | Composition, collision refusal, version | Same page at `?v=2.3.1`; runner; unit; owner-tool |
| `deployed/admin_questions.php` | +5 / −5 | 1089 / 63924 | `b3e7f9218e7b30a67a4b89395771991b8157b1ad7a519288605a9409b27c8c15` | Load order; asset query `2.3.1` | Load-order probe; `php -l` unavailable |
| `src/owner-tool/controller.js` | +1 / −1 | 620 / 23208 | — (unchanged by the fix) | Context-type map | owner-tool 53 PASS |

Reconciliation: `core.js` total diff 152/10 = OT08 76/6 + OT09 76/4; the fix
replaced four OT08-added lines, so the cumulative additions remain below the
100-addition limit. `admin_questions.php` 5/5 = the five asset lines at
`?v=2.3.1`. `controller.js` 36/1 total is OT08 36/1 plus the OT09 one-line swap.
`cloze.js` is a new module at 242 lines, within the 250 cap, so no owner
approval is required and none exists.

Test files (not production; final sizes): `tests/runner.js` 826 / 30078 (still
unchanged by OT09), `tests/unit.js` 2069 / 89190, `tests/owner-tool.js` 1311 /
60363.

## Documentation

The collision rule is in `docs/SPEC.md` Stage 3d, `INV-108`
(`docs/INVARIANTS.md:162`), `EC-105` (`docs/EDGE_CASES.md:166`), and `D-69`
(`docs/DECISIONS.md:1007`); counts are consistent (108/96, 105/101). Parser
version `2.3.1` appears in `docs/AGENTS.md`, `docs/STATUS.md`, both root files,
the coordinator, the active map, and the package. The 2026-11-06 handoff table
still shows `2.3.0` for the asset query, but the appended Fix note supersedes it
and the file is a historical snapshot; that is expected, not a discrepancy.

## Excluded Artifacts

Supplied root SQL and archive copies; `db_conn.php`; `archive/`; the supplied
sample text files except as fixture provenance; `deployed/cbt_practice.php` and
`practice_title` (out of scope); legacy parser/UI/bookmarklet sources and the
generated `src/bookmarklet.js`; OT06/OT07 delivery files; the OT08 tree files
listed above; `.cloud-attachments/`.

## Verdict

**PASS WITH ACCEPTED FINDINGS.**

Both requested prior findings are closed against their frozen closure contracts:
the new module is 242 lines with behavior-preserving evidence, and the
duplicate-number collision is refused with a named warning, legacy rows, and no
partial group. The Release C behavior otherwise holds: the supplied table parses
faithfully, every ambiguity probe refuses safely, all suites and the bank
extractor are green, and every recorded measurement and hash reproduces.

One new narrow finding remains: `FIX-2` (two cloze groups sharing numbering
silently lose the later group's options; the tool's duplicate-target warning does
not name the loss). It is a `FIX`, not a `BLOCK`: it needs conflicting
input across two families, no documented acceptance row fails, and the fix
introduced no regression.

**Review status:** first phase-10 re-review complete; original record unchanged.

**Commit readiness:** not commit-ready. `FIX-2` needs an owner lifecycle
disposition before phase 10 can be treated as settled or committed. `NOTE-1`
through `NOTE-3` from the original review remain non-blocking and were not part
of this fix; the external same-paste key gate remains open and OT10 remains
blocked.

**Recommended next action:** record the owner's disposition for `FIX-2`
(`fix`, `reject`, `accept risk`, `defer`, or `change requirement`) before any
commit-readiness change.

`NEXT COMMAND: @docs/plan/prompts/finding-disposition.md phase 10 OT09 FIX-2`
