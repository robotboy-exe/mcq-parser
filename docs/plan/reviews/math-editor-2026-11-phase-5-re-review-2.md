# Phase 5 Focused Review — D-103/D-104 Visual Corrections

- **Date:** 2026-11-17
- **Reviewer:** independent review session
- **Scope:** focused review of the owner-approved D-103/D-104 corrections added
  after the review-settled MS01 boundary; sole Root control, joined radical
  vinculum, fixed-height scrollable Constant Text preview, cache keys, tests,
  documentation, measurements, and production inclusion
- **Package:**
  [`math-editor/ms-01-visual-math-shapes.md`](../math-editor/ms-01-visual-math-shapes.md)
- **Coordinator:** [`README.md`](../README.md); active map:
  [`prompts/phase-map.md`](../prompts/phase-map.md)
- **Prior records:**
  [`math-editor-2026-11-phase-5.md`](math-editor-2026-11-phase-5.md) and
  [`math-editor-2026-11-phase-5-re-review.md`](math-editor-2026-11-phase-5-re-review.md)
- **Reviewed state:** `owner-tool-integration` at
  `c6a81fb9bbdba6ab911cdd8d6f65c8157371547a`, identical to
  `origin/owner-tool-integration`, plus 21 modified correction files and no
  untracked file before this record
- **Package base:** `c6a81fb`, independently established from the correction
  handoffs, branch tip, and worktree diff
- **Mode:** focused original review of two new owner amendments. This record uses
  the next immutable phase-5 review filename; it is not a broadened re-review of
  the already closed `FIX-1`. The prior finding remains closed.
- **Files written:** this record only. No product, test, fixture, package,
  coordinator, prior review, branch, commit, live site, or database was changed.

## 1. Authority and scope

The active map resolves phase 5 to `MS01`. The coordinator, status, map, package,
and `INTENT.md` agree that the original MS01 boundary is review-settled and
committed at `c6a81fb`, after which the owner approved two corrections:

1. **D-103:** remove the legacy bare `sqrt` operator so the visual Root editor is
   the only square-root control, and overlap/align the radical vinculum so it
   visibly joins the glyph on all three rendering surfaces.
2. **D-104:** keep only the Constant Text preview at a 150px border-box height
   with vertical scrolling; keep the Question preview content-sized.

These are explicit owner amendments in `INTENT.md:3-4,38-44` and decisions in
`docs/DECISIONS.md:1703-1743`. No prior finding was repurposed, no live-origin
limit exception was requested, and no unrelated worktree change was found. The
21 pre-review modifications all map to the two correction handoffs: five
production files, two tests, and current-facing documentation.

## 2. Implementation and production boundary

The production diff is narrow and matches the approved responsibilities:

- `src/math-tool.js:25-33` removes only the bare `sqrt` operator. The existing
  Root shape at `:206-217` still emits exact `<sqrt>...</sqrt>` markers.
- `src/question-preview.css:35-40` constrains only the Constant Text descendant;
  the generic Question preview at `:22-33` has no height or overflow constraint.
- `src/question-preview.css:69-85`, `deployed/cbt.php:523-526`, and
  `deployed/answer_details.php:171-174` carry semantically identical joined-root
  declarations.
- `deployed/admin_questions.php:694-695,1048-1052` rotates only the two changed
  assets: `question-preview.css?v=1.1.2` and `math-tool.js?v=1.1.1`. The unchanged
  math stylesheet stays `1.1.0`, and the renderer stays `2.3.3`.

No schema, parser, storage, session, native form, PRG, renderer, marker, server
save, `maxlength`, Constant Text value, or `cbt_practice.php` feature behavior
changed. No module was added or fragmented. `src/math-tool.js` remains the one
palette/editor/counter module; `src/question-preview.css` remains the one admin
preview stylesheet; the PHP entry points contain only their existing local style
rules or asset wiring.

### Independently reproduced measurements

Measurements use `git diff --numstat c6a81fb`, `git show ... | wc -l -c`,
`wc -l -c`, and `sha256sum`.

| File | Base lines / bytes | Correction diff | Final lines / bytes | Final SHA-256 | Responsibility and direct path |
|---|---:|---:|---:|---|---|
| `src/math-tool.js` | 572 / 18198 | +1 / -2 | 571 / 18151 | `480ea3c157ba38c21cfececd2ec91848fe4c3bed9af9c2601314f9d960a6c2d6` | native-form operators, five editors, counter; required and mounted by `tests/math-tool.js`, loaded by admin |
| `src/question-preview.css` | 113 / 1975 | +5 / -1 | 117 / 2069 | `2baa333125836885616f2845000b62cec8d74f2556cc98f6eddbabeee9c213fc` | preview viewport and shape paint; read by both focused suites and loaded directly in Chromium |
| `deployed/admin_questions.php` | 1055 / 62662 | +2 / -2 | 1055 / 62662 | `f0ab89c4b09ff21a023ed61eff76d6c9fab9c88fa4ca4c3ee2ad6962f2abac69` | native form and asset inclusion; real file read by asset assertions; PHP lint |
| `deployed/cbt.php` | 1083 / 46924 | +1 / -1 | 1083 / 46953 | `075b6f1a6f1745ee2bb67ba60633e4d8f2a5b66d20ba747befe336e1779f0ba4` | exam root style only; real file read by surface assertion; PHP lint |
| `deployed/answer_details.php` | 268 / 13644 | +1 / -1 | 268 / 13671 | `9b50d23da36512cb62e0377bc4072b518ac0856439323573bf88c58cd3d8e915` | detail root style only; real file read by surface assertion; PHP lint |
| `tests/math-tool.js` | 577 / 23758 | +15 / -4 | 588 / 24837 | `eb5ef31a75668463bcc776d66eca4a5445c571803361c9ccba76c843d5cdffbb` | real module mount, sole-root, three-surface, and cache-key evidence; not deployed |
| `tests/question-preview.js` | 199 / 6922 | +8 / -0 | 207 / 7296 | `533787c27040da147f82fd83e53a889839d2d2256ce3e8423c0463bf70dc1aff` | real preview/renderer plus stylesheet contract; not deployed |

Live-origin `git diff --no-index --numstat` measurements reproduce exactly:

```text
admin_questions.php   +89 / -80
cbt.php               +74 / -35
answer_details.php    +21 / -3
cbt_practice.php      +20 / -2
```

Every live-origin file remains below the 100-addition cap. No deletion offsets
an excess, and no owner exception exists or is needed. `cbt_practice.php` is
unchanged by D-103/D-104; it is included because the prior `FIX-1` deployment
boundary still governs its renderer URL.

The deployment manifest independently re-hashed **18 rows with 0 mismatches**.
An asset audit found exactly one current reference for each of the admin math
script, admin math stylesheet, admin preview stylesheet, admin renderer, CBT
renderer, and practice renderer.

Excluded artifacts, separately: reference snapshots under
`archive/live-sources/`, historical files under `archive/owner-tool-2026-11/`,
`deployed/sql/base-schema.working.sql`, generated `src/bookmarklet.js`, absent
local-only `src/bookmarklet.min.js`, `src/parser/core.js`, and browser/PHP
runtime files outside the workspace. None changed or supplied production-path
evidence for these corrections.

## 3. Commands and acceptance coverage

```text
node tests/runner.js                 PASS 60 / FAIL 0 / PENDING 0
node tests/unit.js                   PASS 163 / FAIL 0
node tests/ocr-helper.js             PASS 11
node tests/underline-toolbar.js      PASS 10
node tests/question-preview.js       PASS 6
node tests/math-tool.js              PASS 25
node tests/render-markup.js          PASS 67
node tools/extract-bank.js --check   PASS, source/anchors/counts/7 hashes
php tests/php-render.php             PASS 32
php tests/admin-question-store.php   PASS 8
php tests/cbt-question-order.php     PASS 11 / FAIL 0
php -l (3 changed deployed PHP)      PASS 3 / 3
node --check src/math-tool.js        PASS
git diff --check                     PASS
deployment manifest                 18 rows / 0 mismatches
asset-reference audit               6 expected references / all exactly once
```

All harnesses execute or inspect the real production module, stylesheet, or page
named in their claim. No copied CSS, renderer, SQL, or control flow is treated as
production-path evidence. Parser fixture provenance is unaffected: D-103/D-104
add no parser input/expected fixture and create no orphan.

| Correction acceptance | Result |
|---|---|
| Sole square-root control | **PASS:** exact seven-operator export and mounted toolbar have no bare-root operator; exactly one visual Root editor remains |
| Joined radical rule | **PASS:** exact scalable border, top alignment, and negative overlap are present and semantically identical on all three rendering surfaces |
| Constant Text preview | **PASS:** real-browser computed layout is a 150px border-box with working vertical scroll |
| Question preview | **PASS:** real-browser computed layout remains content-sized with visible overflow behavior, not a fixed scroll viewport |
| Fresh cache keys | **PASS:** `math-tool.js?v=1.1.1` and `question-preview.css?v=1.1.2`, once each; unchanged keys remain unchanged |
| Existing MS01 behavior | **PASS:** all editor, marker, renderer, underline, multiline, counter, store, and CBT-order suites retain their counts |
| Live-origin limits | **PASS:** +89, +74, +21, +20; no exception |
| Live safety | **PASS:** no live read, write, deploy, form submission, migration, or cleanup |
| Owner desktop/Brave recheck | **PENDING external gate:** this review does not substitute for the owner's visual acceptance |

Native save, staging, MySQL, and deployment were not repeated because the
correction changes no save, schema, query, renderer, or transaction byte. PHP
lint and all unchanged direct suites pass. The owner-visible desktop/Brave check
remains an explicit package gate rather than an inferred pass.

## 4. Independent adversarial probes

### A. Real-browser preview boundary

Disposable local Chromium loaded the real `src/question-preview.css` directly.
With 80 lines at a 900px viewport:

```text
Constant: height=150, clientHeight=148, scrollHeight=2004,
          overflow-y=auto, scrollTop 0 -> 80
Question: height=2005.75, clientHeight=2004, scrollHeight=2004,
          overflow-y=visible
```

At a 320px viewport, an unbroken 10,400-character value produced:

```text
Constant: height=150, scrollHeight=9939, scrollTop 0 -> 120
Question: height=9420.016, scrollHeight=9418, overflow-y=visible
```

This exercises actual cascade, layout, overflow, and scrolling rather than only
matching stylesheet text. No page, server, storage, or network write occurred.

### B. Joined-root geometry at hostile sizes

Disposable Chromium loaded the real renderer and preview stylesheet, rendered a
plain root and a fraction nested inside a root, and measured the sign/body boxes
for Arial, system sans, serif, and monospace at 12, 16, 18, 24, 48, and 72px:

```text
48 combinations
horizontal overlap range: 0.594px to 3.594px
computed border range:    1px to 4px
non-positive overlap/border failures: 0
```

An independent declaration parser also found the `.cbt-sqrt-body` property sets
byte-semantically equal across the preview, CBT, and detail surfaces. This is
strong local evidence, but font rasterization on the owner's devices remains the
reason for the external visual gate.

### C. Failing-first and regression-guard challenge

Reconstructed `c6a81fb` bytes independently show the old bare-root operator and
lack both the joined-root declaration and the preview viewport declaration. The
current bytes reverse all three conditions, so both claimed failing-first cases
are reproducible.

The D-104 source assertion was then challenged with two invalid in-memory CSS
variants. Its current regular expression returned `true` for both replacing
`height` with invalid `xheight` and adding a fixed 150px scrolling constraint to
the generic Question preview. This does not change the passing production result
above, but it creates the regression risk in `NOTE-7`.

## 5. Findings

No `BLOCK` and no `FIX` were found. Existing core behavior is correct and has
direct browser evidence in this review.

### NOTE-7 — The D-104 regression assertion can false-pass both boundary violations

`tests/question-preview.js:190-195` reads the real stylesheet, but its lookahead
accepts `xheight: 150px` because `height` has no left property boundary. It also
does not reject a `height`/`overflow-y` constraint on the generic
`.owner-tool-preview`, so it can pass while the Question preview is no longer
content-sized. Both invalid in-memory variants reproduced a passing match.

The current production CSS is correct by inspection and by the two direct
Chromium probes, and the owner browser gate is still pending; therefore this is
a regression-strength residual, not missing current acceptance evidence or a
commit blocker. A later test edit should parse the exact scoped declaration (or
otherwise enforce a real property boundary) and negatively assert that the base
Question preview has no fixed/max-height scrolling viewport.

### NOTE-8 — Current-facing evidence documentation has stale claims

- `docs/DEVELOPER-GUIDE.md:212` still reports 5 preview checks; the current suite
  has 6.
- `docs/EDGE_CASES.md:267` cites the old ST01 disposable 390px Chromium check as
  evidence for D-104 overflow. That check predates D-104
  (`owner-tool/st-01-constant-text-reset.md:281-283`); this review's disposable
  Chromium probe is the first independently reproduced browser evidence for the
  fixed viewport.
- `README.md:86-88` still says only exact `<u>` formats, contrary to the six
  review-settled marker pairs, and `README.md:113-117` still says ME01 is next
  and ME02 is the final phase, omitting completed EL01 and active MS01.

These are documentation/provenance defects only. They do not contradict the
implementation, manifest, package/coordinator status, or direct evidence. They
should be corrected when recording the owner gate and final handoff; no product
change or separate re-review is required.

## 6. Prior findings and approvals

- Original phase-5 `FIX-1` remains **CLOSED**. D-103/D-104 correctly rotate the
  two assets they change and do not reintroduce any pre-fix URL.
- Original `NOTE-1` through `NOTE-6` are not broadened or repurposed. The new
  notes use the next IDs in the package namespace.
- D-103 and D-104 are explicit owner requirement changes recorded in
  `INTENT.md`; they do not infer approval from a prior `go` or review.
- No line-cap exception, deployment approval, live access, or destructive action
  was requested or inferred.

## 7. Verdict and next action

**PASS WITH ACCEPTED FINDINGS** — no `BLOCK`, no `FIX`; `NOTE-7` and `NOTE-8`.

The D-103/D-104 product bytes, deployment paths, cache keys, responsibilities,
measurements, guardrails, and direct production behavior reproduce. The focused
review is complete and does not require a fix session or another review round.

- **Commit readiness:** the correction implementation is review-clean, but the
  final phase boundary is not ready until the explicit owner desktop/Brave visual
  gate passes. No commit was made.
- **Review status:** complete for D-103/D-104. The package/coordinator remain
  correctly `in progress` until the external gate is recorded.
- **Owner recheck:** confirm on desktop and Brave/Android that there is one Root
  control, the vinculum visibly joins the glyph for plain and nested roots, the
  Constant Text preview remains 150px and scrolls a long passage, and the
  Question preview grows normally. Use local/staging only; no live write is
  needed.
- **After a pass:** record the owner acceptance, correct the two notes in the
  normal handoff update, then request the phase-boundary commit separately.

NEXT COMMAND: Run the owner desktop/Brave phase-5 visual recheck for D-103 and D-104, then report pass or fail
