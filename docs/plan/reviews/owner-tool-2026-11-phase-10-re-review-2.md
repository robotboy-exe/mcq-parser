# Owner Tool 2026-11 Phase 10 Re-Review 2 — FIX-2 Closure

- **Date:** 2026-11-08
- **Reviewer:** independent re-review session (opencode)
- **Package:** OT09 — Cloze OCR (Release C)
- **Scope:** read-only `owner-tool-integration` worktree at HEAD `adaeb7c`
  (`feat: add comprehension and cloze context parsing`) plus the uncommitted
  2026-11-07 `FIX-2` changes. The OT09 package base remains `224957e` plus the
  OT08 tree; `FIX-2` is measured from that base.
- **Record:** second re-review of phase 10 (`-re-review-2.md`). It disposes
  `FIX-2` from
  [`owner-tool-2026-11-phase-10-re-review.md`](owner-tool-2026-11-phase-10-re-review.md).
  The original review and the first re-review remain unchanged and are not
  overwritten.

## Re-Review Scope And Frozen Contract

This is a closure-focused re-review. It read the original review, the first
re-review, the package and its Disposition, Fix note, Lifecycle Routing
Correction, Owner Requirement Change, and `FIX-2` Fix Note, the coordinator, the
active map, the intent, the implementation, the fixtures, and the touched tests.
It re-ran every available baseline, reproduced the production measurements and
LF hashes, and probed the replacement rule directly at its boundaries.

The owner replaced the review's "refuse the later group" criterion on 2026-11-07
with keep-first deduplication
(`docs/plan/owner-tool/ot-09-cloze-ocr.md:240-274`). The frozen closure contract
used here is that replacement requirement, not the superseded review criterion:

| ID | Frozen closure criterion (owner replacement, 2026-11-07) |
|---|---|
| `FIX-2` | When two or more fully evidenced cloze groups share any gap number, keep the first group in paste order with its context and every member; drop every later colliding group as a whole (no context, no synthesized items) and remove its source rows so they do not become ordinary questions; emit a warning naming the dropped group's gap numbers; never emit a zero-member context; keep zero automatic posts/activation. Groups with distinct numbering are unaffected, and the `FIX-1` ordinary-question refusal is unchanged. |

## Scope Observations

- The worktree changes since `adaeb7c` are entirely attributable to `FIX-2`:
  `src/parser/core.js` (+24/−2), `tests/unit.js`, `tests/owner-tool.js`,
  `deployed/admin_questions.php` (`2.3.2` cache-bust), and the OT09 status/doc
  propagation. No unrelated or user-owned change was found, and no production
  file outside that set changed.
- HEAD `adaeb7c` (2026-11-07 12:38 +0100) already contains the OT08/OT09
  implementation and both earlier phase-10 review records, while the `FIX-2`
  changes are uncommitted. This does not change the package base or any closure
  measurement, but it contradicts the current coordinator text that phase 10 is
  uncommitted and "commit deferred". A non-review session must reconcile that
  status after this record; this review makes no commit.
- The handoff sizes and hashes use an LF basis. This Windows checkout has
  `core.autocrlf=true`, so working-tree byte counts are larger by exactly the
  line count (the files are `w/crlf`, `i/lf`). The LF-normalized bytes and
  SHA-256 values reproduce the handoff exactly; both are reported below.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git rev-parse HEAD`, `git show -s --format='%ci %s' adaeb7c`, `git status --porcelain` | `adaeb7c` on `owner-tool-integration`; only the `FIX-2` doc/core/test changes are modified |
| `git diff --numstat 224957e` vs `git diff --numstat HEAD` | Package-base and `FIX-2`-only deltas reconcile; see per-file table |
| `node tests/runner.js` | 59 fixtures: 59 PASS, 0 FAIL, 0 PENDING |
| `node tests/unit.js` | 162 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 53 PASS, 0 FAIL |
| `node tests/context-migration.js` | 13 PASS, 0 FAIL |
| `node tests/cbt-context.js` | 4 PASS, 0 FAIL |
| `node tools/cloze-probe.js tools/cloze-two-groups.txt` | Exit 0: one card with members `[71,72]`, the naming warning, no empty card |
| `node tools/extract-bank.js --check` | Fails at the known Windows/CRLF on-disk fixture hash (`bank-pre-2026` first; `bank-2026` also differs on disk); independently recomputed, all 7 source/slice/extracted hashes match the manifest |
| Zero-member sweep over all 59 fixture inputs | 3 cloze contexts, 0 zero-member; every cloze `linkedCount`/`expectedCount` equals its member count |
| `grep` `.submit()` / `requestSubmit` / `fetch(` in `src/owner-tool/*.js` | 0 matches in all seven modules |
| `PARSER_VERSION`, asset includes | `2.3.2` at `src/parser/core.js:5`; `cloze.js` loaded before `core.js` at `deployed/admin_questions.php:1084` |

PHP remains absent on this host, so `php -l`, the PHP suites, and dynamic
candidate execution were not run. No browser, staging, live site, or production
write was used.

## `FIX-2` Disposition — CLOSED

| Frozen criterion | Evidence |
|---|---|
| First group kept in paste order with context and every member | `dedupeCloze` walks `detected.contexts` in order, adds a cloze group's targets only when none is claimed, and keeps its context (`src/parser/core.js:889-906`). Probe: identical 71-72 groups yield one `ctx-1`, targets `[71,72]`, members `[71,72]`; distinct 71-72 then 81-82 groups keep both |
| Later colliding group dropped whole; no context, no synthesized items | A later group sharing any target is added to `dropped` and omitted from `contexts`; `clozeItems` are filtered by the dropped context id (`core.js:905`). Probe: the second 71-72 group yields no context and no items |
| Dropped group's source rows do not become ordinary questions | Every accepted group's rows are already blanked by `cloze.detect` before `dedupeCloze` (`src/parser/cloze.js:225-232`). Probe: total items remain only `[71,72]`; `ordinary` is empty; no `72.`/`73.` question appears |
| Warning names the dropped group's gap numbers | `duplicate cloze group for gaps 71-72 ignored; kept the first occurrence.` emitted at `core.js:897-899`; non-contiguous targets print as `71, 73` |
| No zero-member context | Probe and all-fixture sweep: every cloze context has `members.length === linkedCount === expectedCount` |
| Zero automatic posts/activation | No submit/fetch/requestSubmit in the owner-tool modules; dedupe is parser-only |
| Distinct numbering unaffected | Probe: 71-72 + 81-82 yields two contexts, four members, zero warnings; `tests/unit.js:477` |
| `FIX-1` ordinary-question refusal unchanged | `collidingNumbers`/re-detect path at `core.js:884-929` untouched; 160→162 unit PASS includes the collision tests |
| Production-path evidence | `tests/unit.js:444` and `:477` call the real `parser.parsePaste`; the probe requires the real `parser.js` and `cloze.js`; runner/unit/owner-tool suites execute the shipped modules |

### Adversarial probes derived from the replacement rule

1. **Three groups, first and third identical** (`71-72`, `81-82`, `71-72`):
   contexts `[71,72]` and `[81,82]` survive, the third is dropped with
   `duplicate cloze group for gaps 71-72 ignored...`, no ordinary items. Pass.
2. **Partial overlap** (`71-72` then `72-73`): the later group is dropped whole,
   including its non-shared 73 row; warning names `72-73`; only `71,72` items
   remain. Pass.
3. **Non-contiguous duplicate** (`71,73` twice): first kept, warning prints
   `gaps 71, 73`, no ordinary rows. Pass.
4. **All-fixture zero-member sweep:** no cloze card lacks members and every
   declared count agrees. Pass.
5. **Distinct-numbering control:** both groups and all four members survive with
   zero warnings, so the dedupe is scoped to actual collisions. Pass.

No criterion required violating a documented precondition. The dropped group's
rows staying removed rather than legacy is the owner's explicit replacement rule,
not a defect.

## Acceptance Coverage (re-checked)

| Acceptance check | Result |
|---|---|
| Supplied Q71-Q80 table | PASS: ten linked items with four transcribed options (`sample-cloze-section6`) |
| Multiword Q78 cells | PASS: `a vow`, `an oath`, `an allegiance`, `a pledge` distinct |
| Context | PASS: `[[gap:71]]`-`[[gap:80]]`, two paragraphs retained |
| Generated stems | PASS: editable slots mapped to matching order |
| Same-paste key | PASS for the evidenced synthetic shape only; the real sample is the open external gate |
| Candidate | PASS by inspection plus `cbt-context.js` 4 PASS; PHP page not executable here |
| Multiple contexts | PASS: comprehension+cloze and distinct-numbered cloze+cloze; identical-numbered cloze+cloze now dedupes per `FIX-2` |
| Singular paste | PASS |
| Ambiguous table | PASS: refusals warn and guess nothing |
| Limits | PASS: 501 refused, 500 accepted, empty/partial rows refused |
| Regression | PASS: 59 runner, 162 unit, 53 owner-tool, 13 context-migration, 4 cbt-context, 7 extract-bank extracted hashes |

## Per-File Measurements, Responsibility, And Deployment

Base = `224957e` plus the OT08 tree (OT08 recorded finals: `core.js`
906 / 30777, `controller.js` 620 / 23171, `admin_questions.php` 1089 / 63873).
Bytes below are LF; the Windows CRLF checkout bytes are noted separately.

| File | OT09 additions/deletions | Final lines | LF bytes (CRLF bytes) | SHA-256 (LF) | Responsibility | Deployment / direct test |
|---|---|---:|---:|---|---|---|
| `src/parser/core.js` | +98 / −4 | 1000 | 34520 (35520) | `12ee80337f3551e83ff0f3018f26ef360654ae54c618097a6edf0c4f307dbba9` | `parsePaste` composition, `FIX-1` collision refusal, keep-first dedupe, version | `admin_questions.php:1084`; runner; unit; owner-tool |
| `src/parser/cloze.js` | +242 / −0 (new) | 242 | 8639 (8881) | `b9304a7d6ea1b2978c093354c15a7a2af1eff0c76e6fe62340d82271e75d2069` | Recognition, columns, synthesis, row removal, blocked skip | loaded before `core.js`; runner; unit |
| `src/owner-tool/controller.js` | +1 / −1 | 620 | 23208 (23828) | `ac59e004c85bcb349bb8e814ee9b449bf4b9d790dfc6bebebc2da1fcaaf02c7b` | Cloze context-type map | `admin_questions.php:1086`; owner-tool |
| `deployed/admin_questions.php` | +5 / −5 | 1089 | 63924 (65013) | `c41ca9d306d1e1ca943c18ae20a559d5e12b87b0eb9aba2e2af2dbe79f32ff49` | Include order; `2.3.2` cache-bust | load-order probe; `php -l` unavailable |

Reconciliation: `git diff --numstat 224957e -- src/parser/core.js` is +174/−10,
which is OT08 +76/−6 plus OT09 +98/−4. `controller.js` +36/−1 and
`admin_questions.php` +5/−5 include the OT08 additions with net-zero OT09 line
swaps. Every existing-file addition is within the 100-addition limit (`core.js`
+98) and the new module is 242 of 250 lines, so no Gate 1 exception is required
and none is claimed.

**Approvals:** none needed. **Deployment inclusion:** `comprehension.js` →
`cloze.js` → `core.js` at `?v=2.3.2` (`deployed/admin_questions.php:1084`), then
the owner-tool modules at the same version; no module is orphaned.
**Production-path tests:** the new unit cases call `parser.parsePaste`; the
owner-tool suite runs the real `controller.js`/`contexts.js`/context modules in
its VM harness; the probe requires the real parser and cloze modules. No copied
SQL, control flow, or reimplemented behavior is claimed as evidence.

**Test-file sizes (non-production):** `tests/unit.js` and `tests/owner-tool.js`
changed by `FIX-2`; `tests/runner.js` remains 826 / 30078. New non-production
support files: `tools/cloze-probe.js` (86 lines) and `tools/cloze-two-groups.txt`
(19 lines); they are read-only probes, not production and not subject to the
production limits.

## Documentation

The replacement rule is documented consistently: `docs/SPEC.md:339-345`,
`INV-109` (`docs/INVARIANTS.md:163`), `EC-106`
(`docs/EDGE_CASES.md:167,220-223`), `D-70` (`docs/DECISIONS.md:1029-1044`),
`docs/AGENTS.md:104`, and the package/coordinator/map/status text. Counts remain
109 invariants / 106 edge cases. The only stale status is the expected
"`FIX-2` re-review pending" line set, which this read-only session may not update.

## Findings

### `FIX-2` — CLOSED

Every criterion of the owner's 2026-11-07 replacement requirement passes:
the first evidenced group keeps its context and all members, every later
colliding group is dropped whole with its rows removed rather than legacy, the
warning names the dropped group's gap numbers, no zero-member context is emitted,
distinct-numbered groups are untouched, the `FIX-1` refusal path is unchanged,
and no automatic post/activation path exists. Evidence is production-path and
reproduced independently.

### New findings

None. No unmet package acceptance requirement, regression introduced by the fix,
or security/data-loss defect on a supported path was found.

### Prior non-blocking notes

`NOTE-1` (adjacent unheaded key refuses the group), `NOTE-2` (the old 2026-11-06
handoff wrongly attributed `tests/runner.js` to OT09), and `NOTE-3` (parser
counts code units while the server enforces bytes) remain as recorded. They were
outside the `FIX-2` authorization and are not commit gates.

## Verdict

- **Verdict:** `PASS`
- **Findings closed by this re-review:** `FIX-2`.
- **Findings still open:** none blocking; `NOTE-1`-`NOTE-3` remain non-blocking.
- **Review status:** closure-focused second re-review complete; the original
  review and first re-review are immutable and unchanged.
- **Commit readiness:** the phase-10 product findings are settled, but phase 10
  is still **not commit-ready for final acceptance**. The coordinator records one
  open external gate: `sample-passages.txt` has no answer key, so a
  representative owner-supplied same-paste answer-key sample for OT08/OT09 is
  required before final package acceptance. OT10 remains blocked until that
  evidence exists or the owner records a different disposition. This review does
  not commit and does not advance `main`.
- **Status propagation still pending:** the package, coordinator, map, and
  `docs/STATUS.md` still say "`FIX-2` re-review pending"; the next non-review
  session must record the closure and reconcile the committed-to-HEAD observation
  above.

## Exact Recommended Next Action

Record `FIX-2` closed in the OT09 package, coordinator, active map, and status
files, reconcile the phase-10 commit/HEAD state, and obtain the owner-supplied
representative same-paste answer-key samples for OT08/OT09. Only after that
external evidence is present should phase 10 be treated as finally accepted and
OT10 Gate 1 be offered. Do not reopen a closed finding, rewrite the immutable
records, or commit from a review session.

`NEXT COMMAND: NONE - owner-supplied external same-paste answer-key evidence for OT08/OT09 is required before phase 10 final acceptance and OT10`
