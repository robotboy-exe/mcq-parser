# OCR Owner Tool Work Plan — Coordinator

This is the operational source of truth for the active owner-tool cycle. Read
this file, [`../../INTENT.md`](../../INTENT.md), the active
[`phase-map.md`](prompts/phase-map.md), and the one package being executed.

Last updated: 2026-11-27.

## Current state

- Active cycle: `parser-convergence-2026-11` (created 2026-11-24 after explicit
  owner approval to archive `math-editor-2026-11`, amended 2026-11-26 for
  Phase 7 `PC07` stimulus-first convergence onto one supported bookmarklet plus
  the deployed manual helper; key-only retained only through comparator/rollback
  checks until owner acceptance and a separate reviewed retirement diff).
- Frozen cycle base: `793cb8f`. Settled scratch integration tip through PC03:
  `9afe4f8` on `scratch/parser-convergence-cycle`. Each package is implemented on
  a short-lived `scratch/pcNN-*` branch and pushed for independent review.
- Real branches are read-only cycle-wide: `main`, `owner-tool-integration`,
  `experiments`, and `experiments-alt`. A settled package may merge only into
  the scratch cycle line. Real-branch integration needs a final cycle-wide review
  and a separate owner authorization.
- Preserved evidence: `scratch/stimulus-followups` at `f3f5957`; the old clean
  stimulus baseline `d5a62f0`; donor working snapshot `ed96b11` (`ed14323` PC04
  candidate cross-checked); and the key/main scratch merge at `793cb8f`.
  The pre-package `scratch/single-core-port` diff and its external backup are
  quarantined exploration, not package evidence or a cherry-pick source.
- Current package: `PC01`, `PC02`, `PC03`, and `PC07` are `done` and merged on
  `scratch/parser-convergence-cycle` (`PC07` fast-forward merged from
  `scratch/pc07-stimulus-first` over prior cycle base `9afe4f8`, with `src/`,
  `ocr_helper.js`, `deployed/`, `fixtures/`, and `tests/` byte-identical to
  reviewed candidate `984b2f0`). Unfinished `PC04`–`PC06` are superseded by
  Phase 7 (`PC07`, stimulus-first convergence). Phase 7 review (`5711f96`)
  closed carried `PC04` `BLOCK-10` and `BLOCK-11` and opened `BLOCK-12`–`BLOCK-22`;
  Phase 7 re-review (`cf64cd1`) closed `BLOCK-12`–`BLOCK-14`,
  `BLOCK-16`–`BLOCK-20`, and `BLOCK-22`, left `BLOCK-15` and `BLOCK-21` open in
  round 2, and opened `BLOCK-23` in round 1. Phase 7 fix session 2
  (`go, approve D1 D2`) resolved `BLOCK-15`, `BLOCK-21`, and `BLOCK-23`. Phase 7
  re-review 2 (`9585eb6`) closed those three and opened `BLOCK-24` (key-only
  Load re-armed Active confirmation) and `BLOCK-25` (idle same-page
  re-activation re-armed it); fix session 3 (`go, approve D1 D2`) resolved both
  in `src/ui/ui.js`; Phase 7 re-review 3 of `984b2f0` (published `3647783`)
  returned `PASS WITH ACCEPTED FINDINGS` and closed `BLOCK-24`/`BLOCK-25` with
  no new `BLOCK`/`FIX` (`NOTE-1` open documentation, `NOTE-2` reconciled).
  Cycle-wide rigorous review on `scratch/parser-convergence-cycle` is now the
  unblocked next step; `src/bookmarklets/key/*` stays retained as comparator and
  rollback reference until desktop + owner Brave/Android acceptance and a
  separate reviewed retirement diff.
- Prior settled packages (`PC01`–`PC03`): `PC01` separated the deployed manual
  helper and key bookmarklet products (`done`, merged at `e6f34f8`); `PC02`
  removed the second parser source and moved stimulus helpers to
  `src/bookmarklets/stimulus/autosave.js`, with `tests/single-source.js`
  passing 15 checks and the full Node/PHP baseline green, and a Cloud Chromium
  probe running both generated artifacts on the real staging admin page. The
  2026-11-26 rigorous review of candidate `01e2c02`
  ([record](reviews/parser-convergence-2026-11-phase-2.md)) returned
  `PASS WITH ACCEPTED FINDINGS` with `NOTE-1`–`NOTE-2` and no `BLOCK`/`FIX`; the
  owner confirmed the same day that both generated bookmarklets from `01e2c02`
  load and run in the owner's browser, and `scratch/pc02-single-parser-source`
  was fast-forward merged into the scratch cycle line from `0279e70` to
  `55afe15` with a product tree matching `6592991`. `NOTE-1` is corrected in
  root `AGENTS.md`; `NOTE-2` is accepted residual. PC02 is `done`. PC03 was
  implemented on `scratch/pc03-spaced-initialisms` from package base `331e81f`:
  the spaced-initialism guard (D-111) keeps stem `C. I. F.`/`A. D.`/`B. C.` runs
  as text while `C. E. F. Small` and inner initials are unchanged, and the core
  rotates to `2.5.5` with the helper/key guards and the deployed core token
  following it. Its 2026-11-26 rigorous review
  ([record](reviews/parser-convergence-2026-11-phase-3.md)) returned `BLOCK`
  with `BLOCK-1` (a real line-start option absorbed after a trailing initial),
  `BLOCK-2` (a trailing spaced initialism before `\nA.` still split the
  question), and `FIX-1` (stale helper token). The 2026-11-26 re-review of
  `74505ae` closed `BLOCK-2`/`FIX-1`, kept `BLOCK-1` open in review round 2
  (wrapped and out-of-order line-leading labels were still absorbed), and
  recorded `BLOCK-3` (the covered-label restore picked a stem `A. D.`/`A. B.`
  instead of the trailing real `A.`). The authorized re-review fix counted only
  line-leading labels for the ordered test, treated a label wrapped alone onto
  its line as an option line, and restored the trailing real boundary. The
  2026-11-26 phase-3 re-review 2 of candidate `69934bf`
  ([record](reviews/parser-convergence-2026-11-phase-3-re-review-2.md)) returned
  `PASS WITH ACCEPTED FINDINGS`, closing `BLOCK-1` and `BLOCK-3` (with
  `BLOCK-2`/`FIX-1` previously closed and non-blocking `NOTE-3` accepted as
  residual), and `origin/scratch/pc03-spaced-initialisms` (`a4c6d53`) was
  fast-forward merged into `scratch/parser-convergence-cycle` from `331e81f`
  with a product tree matching `69934bf`. PC03 is `done`, and unfinished
  `PC04`–`PC06` were subsequently superseded by Phase 7 (`PC07`).

### Archived `math-editor-2026-11` evidence

- The cycle's packages were ST01, ME01, ME02, EL01, then MS01. ST01 is done and review-settled: its third re-review closed
  D-91 `FIX-1`, `FIX-2` remains closed, and all 11 helper checks pass. ME01 is
  done and review-settled: the phase-2 re-review passed, closing `FIX-1` and
  both notes, with 17 module vectors. ME02 has a recorded handoff (2026-11-16):
  `?v=1.0.0` tokens (D-94), invariants/edge cases, refreshed manifest and guide,
  full suite counts, and a desktop Chromium check on disposable SQLite staging.
  Its staging-only mobile viewport omission was corrected, and the owner
  accepted the final Brave/Android recheck on 2026-11-17. EL01 implementation,
  real-module tests, disposable HTTP staging, and the real 8-check operation
  harness on isolated Oracle MySQL Community Server 8.0.41 ARM64 pass; the
  phase-4 review settled on 2026-11-17 with `PASS WITH ACCEPTED FINDINGS` and
  `NOTE-1`–`NOTE-4` corrected.
- Reopened 2026-11-17 (phase 5, `MS01`): the owner kept this cycle active — it
  was never archived — and added visual math shapes. The palette keeps the basic
  operators and replaces the symbol grids with five freeform visual editors
  (fraction, exponent, subscript, root, 2×2 matrix); fractions get a full
  horizontal bar and roots a vinculum through five exact shape markers. The
  owner later asked for the palette content back without the editor-covered
  categories, so D-105 restores only the Greek, set theory and logic, and
  geometry and vectors grids behind a `More symbols` drawer. The
  original review and closure re-review passed and boundary `c6a81fb` was
  committed/pushed. The owner's visual gate then found a duplicate bare-root
  control and a gap at the vinculum; D-103 removes the old control and joins the
  radical strokes. The owner then requested D-104 so long Constant Text previews
  stay at the input's default height and scroll. Both corrections are
  implemented; the focused review passed with no `BLOCK`/`FIX`, its two notes
  are corrected, and the owner accepted the desktop/Brave recheck on 2026-11-17.
- Direct owner request D-106 (2026-11-18) appends the exact, HTML-escaped PDO
  message to authenticated save/update failures. The local production edit,
  manifest refresh, full Node/PHP baseline, and PHP lint pass; no deployment or
  live save was performed.
- Direct owner request D-108 (2026-11-19) displays the exact stored
  `English (Lexis & Structure)` subject as
  `English (Comprehension Pages / Lexis & Structure)` on `admin_questions.php`
  and `cbt.php`, without an SQL rename, ID change, grouping change, or
  `cbt_practice.php` edit. CBT Constant Text is weight 800 and the question stem
  remains weight 700. Static, disposable HTTP, and desktop/390px browser checks
  pass; deployment and the owner's live check remain external.
- Direct owner request RM01 (2026-11-19) replaces line-by-line chunking with a
  four-stage region model (classify, own, split only on stems, structural-text
  invariant) in `src/parser/core.js`, and collapses the shipping helper onto
  that core: `admin_questions.php` loads `src/parser/core.js` before the thin
  `ocr_helper.js` adapter. Four hand-transcribed fixtures cover lowercase stems,
  a lost question number, a prose preamble, and a trailing section heading.
  The 2026-11-20 adapter guard holds the core to its module version and renders
  a visible `#ocr_error` banner plus an uncaught error when `window.OCRParser`
  is missing, verified on disposable HTTP staging in a desktop browser.
- RM01 fix session (2026-11-22, review `BLOCK-1`, `BLOCK-4`, `BLOCK-5`,
  `BLOCK-6`, `BLOCK-7`, `BLOCK-8`): the mid-stream unnumbered block and the
  trailing `SECTION`/instruction lines no longer reach option D, the two pre-RM
  comprehension expectations are restored (lowercase `(a)`-`(d)` counts only as
  one complete ordered set, and an unlinked `PASSAGE` wall stays text), the
  helper suite runs the real `helper.parseAll` plus real Load/DOM vectors, the
  fraction bar spans the wider term on all three paint surfaces, and crossed
  markers stay literal in both renderers. 68 runner, 164 unit, 27 helper, 7
  preview, 26 math-tool, 69 JS marker, and 33 PHP marker checks pass on PHP
  8.3.9; deployment and the owner's browser re-paste remain external.
  `BLOCK-1` stays open as an owner release action: `origin/main` is still not an
  ancestor of the release line.
- Main-release re-review (2026-11-22) closed `BLOCK-7`/`BLOCK-8` and kept
  `BLOCK-1`, `BLOCK-4`, `BLOCK-5`, and `BLOCK-6` open after two review rounds.
  The owner chose `fix` for `BLOCK-4`/`BLOCK-5`/`BLOCK-6` only; `BLOCK-1` has no
  disposition and remains open. The closure session binds a mid-stream heading
  or instruction that follows a complete inline A–D set, keeps a repeated
  lowercase `(a)` inside its option text without weakening D-91, adds the
  missing real inline Load vector, and completes the ninth production-file
  handoff row. Core bytes changed, so `src/parser/core.js` is `?v=2.5.1`
  (version `2.5.1`) and `ocr_helper.js` is `?v=2.4.2` (`EXPECTED_CORE_VERSION`
  `2.5.1`); 68 runner, 166 unit, 28 helper, 69 JS + 33 PHP marker, 8 store, and
  14 ordering checks plus 7/7 lint pass on PHP 8.3.9. Re-review is required;
  commit, deploy, and live checks remain unauthorized.
- Main-release re-review 2 (2026-11-22) assigned `BLOCK-10`: one complete
  mixed-case parenthesized A–D set lost Options A and C on the production Load
  path, and only 2 of 16 case combinations parsed. The fix derives the paren
  set from every parenthesized label, so one complete ordered set keeps its
  boundaries while an incomplete lowercase `(a)`-`(c)` set, a complete
  uppercase set, and the spacing/repeat grammar stay unchanged. Failing-first
  core, exported-helper, and real Load regressions now pass; core is `?v=2.5.2`
  (version `2.5.2`) and the helper is `?v=2.4.3` (`EXPECTED_CORE_VERSION`
  `2.5.2`); 68 runner, 169 unit, 31 helper, 69 JS + 33 PHP marker, 8 store, and
  14 ordering checks plus 7/7 lint pass on PHP 8.3.32. Re-review is required;
  commit, deploy, and live checks remain unauthorized.
- Main-release re-review 3 (2026-11-22, target `60f585d`) kept `BLOCK-10`
  **open** on an opposite-case repeated selected A. The owner chose **`fix`**,
  and the fourth-round session guarded the uppercase-only branch so a lowercase
  `A` before the uppercase set kept the first boundary; that made the A vector
  and the A repeat matrix 16/16. Main-release re-review 4 (2026-11-23) then
  showed the guard covered only A: with selected B, C, or D repeated in the
  opposite case, the same branch still moved the intended prefix into the
  previous option (B/C/D 15/16 each on core and exported helper, and real Load
  silently rewrote the native form). The owner asked for the general rule
  instead of another per-letter guard. `parseQuestion` now gives the complete
  ordered first-occurrence paren set precedence, so the first occurrence of
  every letter is the boundary and every later repeat stays text whatever its
  case or letter. Core, exported helper, and real Load return the five exact
  values with no flags, and the opposite-case selected-repeat matrix is 16/16
  for A, B, C, and D; core is `?v=2.5.4` (version `2.5.4`) and the helper is
  `?v=2.4.5` (`EXPECTED_CORE_VERSION` `2.5.4`); 68 runner, 173 unit, 36 helper,
  69 JS + 33 PHP marker, 8 store, and 14 ordering checks plus 7/7 lint pass on
  PHP 8.3.32. The finding stays open until an independent re-review accepts the
  closure. `BLOCK-1` remains open and undisposed, so commit and `main`-release
  readiness stay blocked; deployment and live checks remain unauthorized.
- Main-release finding disposition (2026-11-23): the owner chose **`fix`** for
  `BLOCK-1` (current `origin/main` is not an ancestor of the release line) and
  directed that `owner-tool-integration` is the mature branch and stays the
  authoritative release line, with no work lost or regressed. The authorized fix
  is one frozen-contract session: merge current `origin/main` (`4d68b28`) into
  `owner-tool-integration` with a `--no-ff` merge commit, which keeps every
  commit on both sides and rewrites or deletes nothing, re-run the full Node/PHP
  baseline on the merged tip, and submit that exact target to an independent
  re-review. The `fix` choice closes no finding: `BLOCK-1` stays open until
  criteria 1–4 pass re-review, and commit, `main` advance, deployment, and live
  checks remain unauthorized.
- `BLOCK-1` fix implemented (2026-11-23): merge commit `ea872d0` has parents
  `3608229` (the re-review 5 candidate) and current `origin/main` (`4d68b28`).
  Every commit on both sides is kept; `git merge-base --is-ancestor origin/main
  HEAD` now exits 0, `git diff --stat 3608229 ea872d0` is empty, no unrelated
  artifact is present, and the full Node/PHP baseline passes on the merged tip
  (68 runner, 173 unit, 36 helper, 10 underline, 7 preview, 26 math-tool, 69 JS
  + 33 PHP marker, 8 store, 14 ordering, 7/7 lint) on static PHP 8.3.32.
  `BLOCK-1` remains open pending an independent re-review of that exact merge
  commit; the release boundary commit, a push, the `main` advance, deployment,
  and live checks remain unauthorized.
- `BLOCK-1` closed (2026-11-23): the sixth main-release re-review
  ([`reviews/math-editor-2026-11-main-release-re-review-6.md`](reviews/math-editor-2026-11-main-release-re-review-6.md))
  re-reviewed exact target `ea872d0` and returned `PASS WITH ACCEPTED FINDINGS`.
  All four frozen criteria pass: the authorized two-parent merge keeps both
  histories, current `main` (`4d68b28`) is an ancestor, the target tree equals the
  reviewed candidate with no merge-added artifact, and the full Node/PHP baseline
  passes. Its only finding is non-blocking `NOTE-15` (stale current-facing
  workflow and remote-state text), corrected in this closure session. Every
  main-release blocker is now closed or withdrawn; the reviewed release boundary
  is committed and `main` is fast-forwarded to it. No `main` push, deployment, or
  live action is performed.
- The temporary D-107 pre-migration compatibility work was reverted on
  2026-11-19 after the owner reported production migration `01` successful. The
  application again requires the migrated column directly; operation `03` was
  not confirmed by that report.
- Superseded: the OT12 shared-text isolation and the OT05–OT11 context work are
  archived/historical. Their records remain under `owner-tool/` and `reviews/`
  for evidence; do not continue that architecture.
- Resolved owner decisions (2026-11-14): use `constant_text`; keep
  `src/owner-tool/render.js` at its current path so `cbt_practice.php` is
  untouched; archive removed modules; put helper fixtures under `tests/fixtures/`.
- Owner disposition (2026-11-15): `change requirement` for phase-1 `FIX-1`.
  Rationale: OCR delimiters occur both with and without spacing, including after
  `(`, but a repeated selected-letter marker inside option text must not resplit
  that option. The replacement passed independent re-review and closed
  `FIX-1`; `FIX-2` remains closed.
- Previous cycle: `owner-tool-2026-11` is archived (2026-11-14); its final
  summary is in [`history.md`](history.md) and its map in
  [`prompts/cycles/owner-tool-2026-11.md`](prompts/cycles/owner-tool-2026-11.md).
- The archived math-editor cycle's working branch was
  `owner-tool-integration`; `main` is the published baseline. Current scratch
  workflow is in [Branch strategy](#branch-strategy).
- Current status summary: [`../STATUS.md`](../STATUS.md).
- Completed handoffs: ST01's
  [package record](owner-tool/st-01-constant-text-reset.md) and ME01's
  [package record](math-editor/me-01-math-palette.md) with the phase-2 review,
  `FIX-1` fix note, closure re-review, and ME02's release handoff. EL01 has a
  review-settled handoff; its external MySQL gate closed 2026-11-17. MS01's
  original boundary is committed, and its D-103/D-104 correction handoff is
  review-settled and owner-accepted but remains uncommitted.
  [`owner-tool/next-steps.md`](owner-tool/next-steps.md) is archived-cycle
  history and must not be repurposed.

## Product direction

- Keep three distinct products: the manually saved deployed helper, the
  key/autosave bookmarklet, and the stimulus/image bookmarklet. Do not merge the
  bookmarklets in this cycle.
- All three consume the exact canonical `src/parser/core.js`; only generated
  bookmarklet artifacts may inline it. Product UI, storage policy, and save
  policy remain outside the core and may differ.
- The new cycle does not reopen the review-settled RM01 structural-heading and
  instruction fixes. PC04/PC05 extend coverage only for separately reproduced
  marker-adjacent and anchored shared-stimulus tails.
- Old P20-P23 source is evidence, not accepted implementation. Prior review found
  unsafe text deletion, range false positives, image-pause bypass, stale bulk
  files, and provenance gaps; each package must reproduce and close its own
  finite scope.
- Implementation happens on the owner's VM and review happens here against the
  exact pushed scratch ref. No real branch, deployment, or live record changes
  during this cycle.

### Preserved shipped behavior

- ST01 restores the legacy manual OCR helper and the native PRG question form.
  The owner pastes once, loads a queue, fills each question manually, and saves.
- Add one optional **Constant Text** passage per question. It is stored in
  `questions.constant_text`, prefilled in the same browser session after a
  successful save, and shown above the question on `cbt.php` (exam view) and
  `answer_details.php`. It is not shown in the result sheet or
  `cbt_practice.php`.
- Keep the exact lowercase `<u>`/`</u>` boundary (D-66) and the shared
  renderers; underline now also applies to Constant Text and options A–D.
- The root helper must parse A-D labels case-insensitively with optional
  whitespace after `(`, before `)`, and before `.`, while preserving unspaced
  forms and keeping a later label-like repeat of an already selected letter in
  that option's text (D-91).
- Keep `cbt_practice.php` and `practice_title` outside scope.
- ME01/ME02 add the palette and byte counter to the native form, not to the
  removed owner tool. The 60,000-byte server limit remains authoritative.

`INTENT.md` is authoritative when package prose is ambiguous; P24 as amended on
2026-11-14 and the owner's D-91 amendment on 2026-11-15 are the behavior sources
for this cycle.

## Externalize-first contract

This contract applies cycle-wide to every product package, fix session, review,
and cycle close.

- Record an exact package-base Git ref before implementation. A fix session
  inherits the original package base and does not reset its line counters.
- For each live-origin production file, the cumulative additions from its
  archived live snapshot must not exceed 100 by `git diff --numstat`. Deletions
  do not offset additions. This protects the original live files only.
- New phase-cycle production modules have no fixed line cap. They must remain
  cohesive, avoid unnecessary fragmentation, and have an explicit deployment
  path.
- A proposed live-origin excess requires explicit owner approval at Gate 1
  naming the exact file, measured excess, and justification. `go`, package
  acceptance, or approval of another file does not imply an exception.
- Cohesive new behavior belongs in focused modules/includes. Existing entry
  points retain only imports/includes, dispatch, narrow wiring, and unavoidable
  local transaction hooks.
- Each module has one clear responsibility and an explicit deployment path.
- Tests must execute the real production modules and paths. Copied SQL, copied
  control flow, or reimplemented production behavior does not count as
  executable evidence for that path.
- Do not game the limits with minification, compressed statements, generated
  code, generic dumping-ground helpers, or unnecessary file fragmentation.
- Supplied snapshots, archives, and generated artifacts are excluded from the
  limits, but every excluded file must be identified and reported separately.
- Gate 1 reports every planned production file, its baseline lines and bytes,
  expected additions, extraction boundary, and direct production-path test. It
  also identifies each excluded artifact separately.
- The handoff reports, per production file, additions/deletions from the package
  base, final lines/bytes, responsibility, deployment inclusion, and the test
  evidence that executes its production path. It reports excluded artifacts in
  a separate list.
- A review independently reproduces the measurements, verifies module
  responsibility and deployment inclusion, and confirms that claimed tests run
  the production paths. An unapproved limit breach, monolithic production
  addition, or copied-path test claim is a `BLOCK`.

## Finding lifecycle contract

Reviews are rigorous without creating a moving target:

- Every `BLOCK` and `FIX` records an exact defect, supported operating
  preconditions, a finite closure checklist, required evidence, and explicit
  non-goals or deferred checks. Broad labels such as "exact schema" or "safe
  rollback" are not closure criteria by themselves.
- Once the owner authorizes a fix, its closure contract is frozen. A fix Gate 1
  must restate it before offering `go`. Only the owner may broaden it or change
  the underlying requirement.
- An original review is exploratory. A re-review is closure-focused: it verifies
  the named closure checklist, tests regressions from the fix, and runs an
  adversarial probe derived from that checklist. It does not search unrelated
  dimensions merely to satisfy the adversarial-probe requirement.
- A named finding closes when its frozen checklist passes. A different defect
  discovered during re-review receives the next unused ID in its severity
  namespace across all package review records; it never keeps the old ID open.
- A new re-review finding is a `BLOCK` only when it demonstrates an unmet package
  acceptance requirement, a material regression introduced by the fix, or a
  reproducible security/data-loss risk on a supported path under documented
  preconditions. A scenario that requires violating a mandatory operating
  precondition is normally hardening or residual risk, not a blocker, unless
  the package explicitly promises protection after that violation or the
  precondition cannot realistically be verified or enforced.
- The owner disposition for a finding is one of: `fix`, `reject` with rationale,
  `accept risk`, `defer` to a named package, or `change requirement`. Record the
  exact finding IDs, rationale, and destination in the package and coordinator.
  No agent may infer a disposition from `go`, silence, or package acceptance.
- An unresolved `BLOCK` still prevents commit readiness and dependent work. A
  non-fix owner disposition resolves the workflow decision without rewriting
  immutable review evidence; a `fix` disposition remains unresolved until its
  frozen checklist passes re-review.
- Owner disposition is an escalation, not the first step. A review round is one
  recorded review or re-review. A finding escalates only after **three review
  rounds** without resolution: the review that recorded it left it open
  (round 1), the re-review after fix round 1 still left it open or recommended
  another fix (round 2), and the re-review after fix round 2 still leaves it
  open or prescribes another fix (round 3). In its first or second review round,
  an open `BLOCK` or `FIX` routes directly to
  [`prompts/fix-session.md`](prompts/fix-session.md) against its frozen closure
  contract; the review or re-review record, not an inferred owner disposition,
  authorizes each fix round.
- A defect recorded for the first time in a re-review starts in its own first
  review round and routes through the same three-review-round lifecycle; it
  escalates only if its own third review round leaves it unresolved. This is an
  escalation rule, not an automatic pass; genuine unresolved risk remains
  visible.
- Owner decisions use
  [`prompts/finding-disposition.md`](prompts/finding-disposition.md), which
  records the decision in current-facing package/coordinator documents without
  altering immutable review evidence.
- For review records written before this contract, the frozen checklist is the
  concrete reproduced defect, named vectors, required fix, and evidence stated
  in the accepted review and fix Gate 1. Any ambiguity stops for owner decision.

## Package states

Status values are `not started`, `in progress`, `blocked`, and `done`.

| Phase | ID | Package | Depends on | Status | External gate |
|---|---|---|---|---|---|
| 1 | PC01 | [Product Surface Separation](parser-convergence/pc-01-product-separation.md) | docs-only cycle setup over product base `793cb8f` | done — 2026-11-26 re-review 3 of `cc72e3b` returned `PASS` with no new findings, closing `BLOCK-5`/`FIX-4`; every `BLOCK-1`–`BLOCK-5` and `FIX-1`–`FIX-4` closed; merged into `scratch/parser-convergence-cycle` at `e6f34f8` | disposable browser; no deploy/live |
| 2 | PC02 | [Single Parser Source](parser-convergence/pc-02-single-parser-source.md) | PC01 rigorous review settled | done — 2026-11-26 rigorous review of `01e2c02` returned `PASS WITH ACCEPTED FINDINGS` (`NOTE-1`–`NOTE-2`, no `BLOCK`/`FIX`); owner confirmed both generated bookmarklets load and run in the owner's browser; fast-forward merged into `scratch/parser-convergence-cycle` (`0279e70`→`55afe15`) | owner's browser bookmarklet installability (confirmed 2026-11-26) |
| 3 | PC03 | [Spaced Initialism Option Boundaries](parser-convergence/pc-03-spaced-initialisms.md) | PC02 rigorous review settled | done — 2026-11-26 re-review 2 of `69934bf` returned `PASS WITH ACCEPTED FINDINGS` (closing `BLOCK-1` and `BLOCK-3`; `BLOCK-2`/`FIX-1` previously closed; non-blocking `NOTE-3`); fast-forward merged into `scratch/parser-convergence-cycle` (`331e81f`→`a4c6d53`) | none; parser and real-surface evidence |
| 4 | PC04 | [Marker-Adjacent Range Extraction](parser-convergence/pc-04-marker-range.md) | PC03 rigorous review settled | superseded by PC07 (Gate 1 approved 2026-11-26; `BLOCK-10` & `BLOCK-11` carried **open** into Phase 7) | preserved as history/evidence |
| 5 | PC05 | [Inter-Question Stimulus Boundaries](parser-convergence/pc-05-stimulus-boundaries.md) | PC04 rigorous review settled | superseded by PC07 (anchored blocks, leading stimuli, gap recovery, & `[missing text]` implemented in Phase 7) | preserved as history/evidence |
| 6 | PC06 | [Bookmarklet Policy and Scratch Release](parser-convergence/pc-06-bookmarklet-policy-release.md) | PC05 rigorous review settled | superseded by PC07 (key-only retirement deferred to separate reviewed diff after owner acceptance) | desktop + Brave/Android acceptance for `src/bookmarklet.js` |
| 7 | PC07 | [Stimulus-First Convergence](parser-convergence/pc-07-stimulus-first.md) | PC01–PC03 settled & Gate 1 `go` | done — `BLOCK-10`–`BLOCK-25` closed; independent Phase 7 re-review 3 of `984b2f0` returned `PASS WITH ACCEPTED FINDINGS` (published `3647783`, no new `BLOCK`/`FIX`; `NOTE-1` open documentation, `NOTE-2` reconciled); fast-forward merged from `scratch/pc07-stimulus-first` into `scratch/parser-convergence-cycle` over `9afe4f8` (product/test/fixture tree matching `984b2f0`) | desktop + owner Brave/Android acceptance and separate reviewed key-only retirement diff |

Status lives only in this table; the active map maps phase numbers to these
packages. Update the table and the map in the same package handoff.

The archived cycles are summarized in [`history.md`](history.md). Their maps are
preserved at
[`prompts/cycles/owner-tool-2026-11.md`](prompts/cycles/owner-tool-2026-11.md)
and
[`prompts/cycles/math-editor-2026-11.md`](prompts/cycles/math-editor-2026-11.md).

## External artifacts

The rows below are archived-cycle and deployment artifacts that still govern
the shipped baseline; they are not new gates for this cycle.

| Artifact | One-line justification |
|---|---|
| Current production `ocr_helper.js` | Defines the live helper behavior restored by ST01 |
| Exact DDL bytes for `questions`, `subjects`, `exam_category` | Supplied 2026-11-03 in `main` commit `002483b` and copied to `owner-tool-integration` |
| `answer_details.php` | Supplied and archived 2026-11-02; integrated in OT04 and independently verified again in OT10 |
| PHP and database versions | Satisfied: PHP 8.3 application target; MySQL 8.0.41 from schema exports |
| [Main-question reader/writer inventory](owner-tool/ot-06-reader-writer-audit.md) | Satisfied 2026-11-05; finds every available affected `cbt.php` read path and linked-question mutation path |

The connection contract is settled by root `db_conn.php` (charset `utf8mb4`,
PDO exceptions, associative fetches, native prepares). Do not request a redacted
or full `cbt_db.php`.

The `exam_category2` → `exam_category` correction is settled. Keep the original
export as evidence and apply the correction only to the working DDL copy.

The supplied SQL exports are archived unchanged at
`archive/sql/2026-11-03-supplied/` with recorded hashes. `exam_category.sql`
still uses `exam_category2`; the original stays unchanged, and only
`deployed/sql/base-schema.working.sql` applies the settled rename.

Secrets, credentials, cookies, and production data are not required.

`answer_details.php` arrived before OT04 handoff. The supplied bytes are archived,
its deployed working copy uses OT04's shared renderer, and OT10 independently
verifies the detail path with the rest of Release A.

## Branch strategy

- `scratch/parser-convergence-cycle` is the only integration line for this
  cycle. It starts at exact base `793cb8f`; that base contains the user's
  experiments-alt/main scratch merge and is not a real release branch.
- The owner's VM implements one package on a short-lived `scratch/pcNN-*` branch
  from the exact reviewed scratch-cycle tip and pushes that candidate to GitHub.
- This environment reviews the exact pushed candidate in a clean dedicated
  worktree. Review sessions may write only their record under
  [`reviews/`](reviews/README.md) and never edit product files.
- A review session never commits. Afterward, a separate explicit owner request
  may commit/push only that immutable review record onto the package branch so
  the VM can pull it before a fix or merge.
- After a rigorous review settles, the VM may merge that package into the
  scratch cycle line on a separate explicit owner request. Delete the phase
  branch only after the merge is verified and reachable.
- `main`, `owner-tool-integration`, `experiments`, and `experiments-alt` remain
  read-only until PC07 (plus any separate key-only retirement diff) and the
  cycle-wide review settle. Any real-branch integration is a later
  owner-authorized operation with its own preflight and rollback plan.
- `scratch/stimulus-followups` (`f3f5957`) is preserved evidence. The dirty
  `scratch/single-core-port` worktree and its external patch/archive are
  quarantined pre-package exploration. Neither is merged or cherry-picked.
- The deleted OT12 branch remains retired; its reachable history is already in
  the reviewed baseline and its superseded architecture must not return.

## Review checkpoints

| Checkpoint | Scope | Level | Status |
|---|---|---|---|
| phase 1 | PC01 product separation | rigorous | done — 2026-11-26 re-review 3 of `cc72e3b` returned `PASS` with no new findings (`BLOCK-5`/`FIX-4` closed, all `BLOCK-1`–`BLOCK-5` and `FIX-1`–`FIX-4` closed); merged into the scratch cycle line at `e6f34f8` |
| phase 2 | PC02 one parser source and build parity | rigorous | done — 2026-11-26 review of `01e2c02` returned `PASS WITH ACCEPTED FINDINGS` (`NOTE-1` corrected, `NOTE-2` accepted); owner confirmed both generated bookmarklets in the owner's browser; fast-forward merged into the scratch cycle line |
| phase 3 | PC03 spaced initialisms | rigorous | done — 2026-11-26 re-review 2 of `69934bf` returned `PASS WITH ACCEPTED FINDINGS` (closing `BLOCK-1` and `BLOCK-3`; `BLOCK-2`/`FIX-1` previously closed; `NOTE-3` accepted residual); fast-forward merged into the scratch cycle line at `a4c6d53` |
| phase 4 | PC04 marker-adjacent range | rigorous | superseded by PC07 (Gate 1 approved 2026-11-26); `BLOCK-10` & `BLOCK-11` carried **open** into Phase 7 |
| phase 5 | PC05 anchored stimulus boundaries and missing classification | rigorous | superseded by PC07 |
| phase 6 | PC06 bookmarklet policy and scratch release | rigorous | superseded by PC07; key-only retirement deferred to separate reviewed diff after owner acceptance |
| phase 7 | PC07 stimulus-first convergence | rigorous | done — `BLOCK-10`–`BLOCK-25` closed; Phase 7 re-review 3 of `984b2f0` returned `PASS WITH ACCEPTED FINDINGS` (published `3647783`; `NOTE-1` open documentation, `NOTE-2` reconciled); fast-forward merged into `scratch/parser-convergence-cycle` |
| cycle | settled phases on `scratch/parser-convergence-cycle` | rigorous cycle-wide | ready — PC01–PC03 and PC07 are `done`, settled, and merged on `scratch/parser-convergence-cycle`; cycle-wide rigorous review is now the unblocked next step (desktop + owner Brave/Android acceptance and separate reviewed key-only retirement diff remain external/deferred gates) |

## Current path to cycle close

1. **PC01–PC03** — `done` and review-settled on `scratch/parser-convergence-cycle`
   through `9afe4f8`.
2. **PC07** — `done` and merged into `scratch/parser-convergence-cycle` from
   `9afe4f8` (product/test/fixture tree matching `984b2f0`), superseding
   unfinished `PC04`–`PC06` (history retained in
   `docs/plan/parser-convergence/pc-04..06.md` and `phase-4*.md`): implemented
   on `scratch/pc07-stimulus-first` converging onto two supported surfaces
   (`ocr_helper.js` `?v=2.4.11` manual helper + `src/bookmarklet.js`
   stimulus-first bookmarklet over `src/parser/core.js` `2.5.8` and focused
   `image-plan.js`/`save-flight.js` modules), with `BLOCK-10`–`BLOCK-25`
   closed; `src/bookmarklets/key/` remains retained as comparator/rollback
   reference.
3. **Phase 7 rigorous re-review & scratch merge** — `done`: re-review 3 of
   `984b2f0` (`docs/plan/reviews/parser-convergence-2026-11-phase-7-re-review-3.md`,
   published `3647783`) returned `PASS WITH ACCEPTED FINDINGS`, closing
   `BLOCK-24`/`BLOCK-25` (`NOTE-1` open documentation, `NOTE-2` reconciled), and
   `scratch/pc07-stimulus-first` was fast-forward merged into
   `scratch/parser-convergence-cycle`.
4. **Cycle-wide rigorous review** — unblocked next step on
   `scratch/parser-convergence-cycle` (covering settled phases 1–3 and 7).
5. **Owner device checks & key-only retirement** — remaining external/deferred
   gates: owner verifies the installed replacement bookmarklet on desktop and
   Brave/Android, then a separate reviewed diff retires `src/bookmarklets/key/`.
6. **Owner decision after cycle-wide review & external gates** — only after
   every finding, rigorous cycle-wide review, and deferred gates settle, decide
   whether and how to integrate the reviewed scratch cycle into real branches.

Current workflow stop: `PC07` is reconciled to `done` and fast-forward merged
from `scratch/pc07-stimulus-first` into `scratch/parser-convergence-cycle` over
`9afe4f8`, with `src/`, `ocr_helper.js`, `deployed/`, `fixtures/`, and `tests/`
byte-identical to reviewed candidate `984b2f0` (Phase 7 re-review 3 published
at `3647783`, `PASS WITH ACCEPTED FINDINGS`, closing `BLOCK-24` and `BLOCK-25`;
all `BLOCK-10`–`BLOCK-25` closed, `NOTE-1` open documentation, and `NOTE-2`
reconciled). The cycle-wide rigorous review on
`scratch/parser-convergence-cycle` is now the unblocked next step; desktop +
owner Brave/Android acceptance and a separately reviewed key-only retirement
diff remain external/deferred gates. No real-branch integration, deploy, or live
action is authorized.

## Archived `math-editor-2026-11` close path

1. **ST01** — done and review-settled: reset, Constant Text, underline,
   CBT/detail display, archive, D-91 replacement, docs, and handoff. The third
   closure-focused re-review passed and closed `FIX-1`; `FIX-2` remains closed.
2. **ME01 Gate 1** — done: post-ST01 baseline verified and
   `admin_questions.php` re-measured at +87, expected +89.
3. **ME01** — implemented and review-settled at +89 live-origin additions;
   `FIX-1` (stale counter after OCR fill/reset) and both notes were closed by
   the 2026-11-15 re-review.
4. **ME02** — done: release artifacts, rigorous review, corrected staging
   viewport, and owner-accepted Brave/Android recheck are recorded.
5. **EL01 implementation** — complete: exact-name operations, focused
   post-selection grouping, 11 module/wiring checks, 6 HTTP staging checks, and
   full baseline pass.
6. **EL01 MySQL gate** — satisfied 2026-11-17: the real `03`/`04` operation
   harness passed all 8 checks on isolated Oracle MySQL Community Server 8.0.41
   ARM64. The earlier MariaDB 13.0.2 run was preliminary only.
7. **EL01 holistic rigorous review** — done 2026-11-17 via
   [`prompts/review-session.md`](prompts/review-session.md):
   `PASS WITH ACCEPTED FINDINGS`; `NOTE-1`–`NOTE-4` corrected. No fix or
   re-review round is required.
8. **Cycle close** — complete 2026-11-17 via
   [`prompts/cycle-close.md`](prompts/cycle-close.md). The phase-4 boundary is
   committed at `e08b922` and the cycle-close docs at `0410ecb`; the optional
   `main` fast-forward and archiving remain separate explicit owner decisions.
9. **Phase 5 (MS01)** — reopened by the owner on 2026-11-17: visual math shapes
   and palette cleanup. Implemented at base `0410ecb` with all package
   acceptance green (Node 60/163/11/10/5/25/67, PHP 32/8/11, lint PASS, caps
   +89/+74/+21/+20); the rigorous phase-5 review then recorded `PASS WITH
   ACCEPTED FINDINGS` and its `FIX-1` (cache keys for the changed shared assets)
   was fixed and closed by re-review. Boundary `c6a81fb` was committed/pushed.
10. **MS01 owner-visual correction (D-103)** — the owner reported that the old
    bare `√` operator duplicated the visual Root editor and that the radical
    vinculum did not meet the glyph. The follow-up removes the old operator,
    overlaps/scales the radical bar on all three surfaces, rotates only the two
    changed admin asset keys, and adds regression evidence. The focused review
    passed and the owner accepted the desktop/Brave recheck on 2026-11-17.
11. **MS01 owner-preview correction (D-104)** — the owner requested that the
    Constant Text preview match the input's default 150px height and scroll long
    passages. The follow-up constrains only that preview, rotates its stylesheet
    key to `1.1.2`, and adds a failing-first CSS regression. The focused review's
    regression-strength note is corrected, and the owner accepted the visual
    recheck with D-103.
12. **Main-release boundary (RM01)** — closed 2026-11-23. The 2026-11-21
    review and the 2026-11-22 re-reviews recorded blockers; the owner chose
    `fix` for `BLOCK-4`/`BLOCK-5`/`BLOCK-6`, `BLOCK-10`, and then `BLOCK-1`, and
    each fix is implemented and closed by re-review (re-review 2, re-review 5,
    and re-review 6 respectively). Re-review 6 reviewed exact merge target
    `ea872d0` — the `--no-ff` merge of current `origin/main` (`4d68b28`) into the
    re-review 5 candidate `3608229` — and returned `PASS WITH ACCEPTED FINDINGS`
    with no blocker. The reviewed release boundary is committed on
    `owner-tool-integration` and `main` is fast-forwarded to it; no further
    review round is required.

Current workflow stop: the cycle work is done and review-settled. Its D-103/D-104
corrections are committed at `120a5db`, the owner's palette request is
implemented as the D-105 restoration and committed at `23a406c`, and the docs
reconciliation is `596fb31`. The cycle-wide rigorous review is recorded at
[`reviews/math-editor-2026-11-cycle-review.md`](reviews/math-editor-2026-11-cycle-review.md):
`PASS WITH ACCEPTED FINDINGS`, no `BLOCK`/`FIX`, `NOTE-9`–`NOTE-12`, of which
`NOTE-10` and `NOTE-11` are corrected. The owner accepted the desktop and
Brave/Android check for the D-105 drawer on 2026-11-18, so every cycle
acceptance row and external gate is satisfied. Only accepted residual risk
remains: `NOTE-9` (root `ocr_helper.js` is untokened, so the D-91 grammar depends
on the documented deploy-time cache purge) and `NOTE-12`'s optional labelling of
the drawer region.

The RM01 main release is now review-settled: re-review 5 closed `BLOCK-10`,
re-review 6 closed `BLOCK-1` on exact target `ea872d0`, and all earlier blockers
are closed or withdrawn. `NOTE-15` (stale current-facing workflow and
remote-state text) is non-blocking and corrected in this closure session. The
authenticated remote `owner-tool-integration` ref is `140b021`, the one docs-only
child of `ea872d0`; this session does not infer separate authorization for that
earlier remote update and does not push. The reviewed release boundary is
committed on `owner-tool-integration` and `main` is fast-forwarded to it without
a history rewrite. Deployment, the owner's browser re-paste, and every live save
remain external and unauthorized. D-106 and D-108 are direct owner requests
carried by this line; deploying them remains a separate explicit owner action.

## Session protocol

1. Execute one package per session using
   [`prompts/phase-session.md`](prompts/phase-session.md).
2. Gate 1 is read-only. Resolve status, dependencies, external gates, review
   state, worktree scope, baseline evidence, and the externalize-first plan, then
   wait for explicit `go`.
3. A `blocked` package stops at Gate 1. Do not skip to dependent product work.
4. After `go`, execute only that package and do not preview/start the next one.
5. Add failing evidence before behavior changes where the package requires it.
6. Run every acceptance check. Never mark a package done on partial evidence.
7. Update this table, the active map, current status, package handoff, and
   history where required. Include the externalize-first handoff measurements.
8. Stop after the handoff with `Commit: deferred` and the required exact next
   command.
9. Commit only when the user explicitly asks. Never amend, rebase, force-push,
   or bundle unrelated changes.

## Response contract

Every workflow gate, early stop, handoff, review, fix, and cycle-close response
must end with exactly one final line in this form:

```text
NEXT COMMAND: <exact copy-paste command>
```

Nothing may follow that line. The command must be directly executable or
sendable, not a description or placeholder. Use
`NEXT COMMAND: NONE - <reason>` only when no safe command exists.

## Definition of done

Every package must satisfy all applicable items:

- dependencies and external gates are verified from files/evidence;
- every acceptance row maps to a test, probe, or explicit recorded gap;
- source-backed expectations were not generated from parser output;
- no unrelated or user-owned worktree change was reverted or bundled;
- current-facing docs match implemented behavior;
- package status and active-map status agree;
- the externalize-first Gate 1 plan and handoff measurements are complete, every
  production file is within its limit or has the exact Gate 1 owner approval,
  and each focused module has a verified deployment path;
- tests claimed as executable evidence run the real production modules and
  paths rather than copied SQL, control flow, or behavior;
- handoff records exact files, commands/results, hashes, open questions, review
  status, and deferred commit state;
- required PHP/browser/staging checks are not replaced with assumptions;
- no orphan fixture or failing baseline remains;
- the handoff response ends with the response contract's exact
  `NEXT COMMAND:` line.

## Baseline commands

```sh
node tests/runner.js
node tests/unit.js
node tests/ocr-helper.js
node tests/underline-toolbar.js
node tests/question-preview.js
node tests/math-tool.js
node tests/render-markup.js
node tools/extract-bank.js --check
php tests/php-render.php
php tests/admin-question-store.php
php tests/cbt-question-order.php
```

OT05–OT12 context tests and tools are archived under `archive/owner-tool-2026-11/`.
The production context migration was never executed; ST01 uses a disposable
database and the root `ocr_helper.js`.

## Branch and worktree safety

- VM implementation uses the current package's short-lived `scratch/pcNN-*`
  branch from the exact reviewed scratch-cycle tip. Do not implement directly on
  `scratch/parser-convergence-cycle` or any real branch.
- Review uses a separate clean worktree at the exact pushed package ref. It may
  write only the review record and must not repair findings.
- Preserve `scratch/stimulus-followups` and the quarantined
  `scratch/single-core-port` worktree. Do not merge, cherry-pick, reset, or clean
  either; revalidate raw evidence in the active package instead.
- Never reset, clean, stash, switch, or rewrite a worktree with unexpected user
  changes. Preserve them unless they directly block the package; then stop and
  ask.
- Live writes require explicit per-action approval. Destructive production
  cleanup is owner-only.

## Completed historical track

P01-P09 are done and retained under `docs/plan/01-*.md` through `09-*.md`.
They are evidence/history, not phases in the active owner-tool cycle. Their
summary and final counts live in [`history.md`](history.md).

## Cycle close

After PC07 (and any follow-up key-only retirement delta) plus the rigorous
cycle-wide review settle, use [`prompts/cycle-close.md`](prompts/cycle-close.md).
Cycle close executes no package, commits only with explicit authorization, and
leaves the cycle active until the owner separately confirms archival.
