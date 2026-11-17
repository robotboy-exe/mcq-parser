# Phase 5 Review — MS01 Visual Math Shapes and Palette Cleanup

- **Date:** 2026-11-17
- **Reviewer:** independent review session
- **Scope:** original rigorous review of phase 5 / `MS01`, complete package
  acceptance and production boundary
- **Package:** [`math-editor/ms-01-visual-math-shapes.md`](../math-editor/ms-01-visual-math-shapes.md)
- **Coordinator:** [`plan/README.md`](../README.md); map:
  [`prompts/phase-map.md`](../prompts/phase-map.md)
- **Prior records:** none for phase 5. The phase-1/2/3/4 records were read for
  conventions and settled context; none was modified.
- **Reviewed state:** `HEAD` `0410ecbc65eaf1434de50a5ccf9adadaf217967b`
  (cycle-close docs) plus the uncommitted MS01 worktree (22 modified files,
  3 untracked files). Worktree branch is
  `freebuff/20b4a2fe6d18709da3bb0da2`; see `NOTE-5`.
- **Mode:** original review, exploratory across package acceptance and the
  production boundary. No frozen fix contract existed, so nothing was closed or
  reopened.
- **Files written:** this record only. No branch was created, switched, or
  moved; nothing was staged, committed, pushed, deployed, or run against a live
  site.

## 1. Authority and package claims

The map resolves phase 5 to `MS01` and the coordinator, status file, phase map,
and package agree: `math-editor-2026-11` was reopened (never archived) on
2026-11-17; phases 1–4 are `done` and review-settled; `MS01` is `in progress`
with an implementation handoff and a review pending.

The package asks for: the operator-row palette with five freeform shape editors;
exact `<frac>`, `<sup>`, `<sub>`, `<sqrt>`, `<matrix>` markers; horizontal
fraction and radical bars; escape-first rendering parity; validation that cannot
forge markers; constants/docs/manifest updates; and package acceptance. The
handoff claims all of this with green suites and live-origin caps of +89, +74,
and +21.

Those central claims reproduce. The suite counts, the 67-vector JS/PHP parity
table, the per-file measurements, the manifest (18/18), and the live-origin caps
all match the handoff. One release-wiring defect and five documentation/residual
notes are recorded below; none is an unmet acceptance row, an unapproved limit
breach, or a monolithic production addition.

## 2. Repository and change scope

```text
git rev-parse HEAD                     0410ecbc65eaf1434de50a5ccf9adadaf217967b
git branch --show-current              freebuff/20b4a2fe6d18709da3bb0da2
git status --porcelain=v1              22 modified files, 3 untracked files
git diff --check                       clean
```

Package base is `0410ecb` with a clean tree at Gate 1, so the current worktree
diff is the package diff. The 22 modified files are the five product surfaces,
four test files, and the docs; the three untracked files are the package record,
`tests/render-markup.js`, and `tests/fixtures/render-markup.json`. No unrelated
or pre-existing owner change is present in this tree.

**Live origin.**

```text
archive/live-sources/admin_questions-2026-10-31.php => deployed/admin_questions.php   89  80
archive/live-sources/cbt-2026-10-31.php             => deployed/cbt.php               74  35
archive/live-sources/answer_details-2026-11-02.php  => deployed/answer_details.php    21   3
```

All three are inside the 100-addition externalize-first cap. No exception exists
or is needed. `cbt.php` sits at its Gate 1 planning ceiling (+74); the package
records that any further work there needs a new measurement.

**Per-file measurements, responsibility, and deployment path.** Reproduced
independently from the worktree (`wc -l -c`, `sha256sum`, `git diff --numstat`):

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and production-path evidence |
|---|---:|---:|---|---|---|
| `src/math-tool.js` | +308 / −290 | 572 / 18198 | `8e460c8a…` | operator row, five freeform editors, advisory counter | site root `src/`; `node tests/math-tool.js` requires and mounts the real module |
| `src/math-tool.css` | +92 / −86 | 206 / 3334 | `da630779…` | operator row, panels, 2×2 input grid, preview, hint, counter | site root `src/`; structural asserts in `tests/math-tool.js` |
| `src/owner-tool/render.js` | +264 / −65 | 408 / 13764 | `216ebb51…` | six-marker scanner and DOM renderer | site root `src/owner-tool/`; `node tests/render-markup.js` requires the real module |
| `deployed/render.php` | +213 / −43 | 248 / 8161 | `f1152c54…` | server parity scanner and markers | site root; `php tests/php-render.php` requires the real include |
| `deployed/cbt.php` | +17 / −2 | 1083 / 46924 | `05e1e2a3…` | inline shape rules; renderer token `2.3.3` | site root; numstat; `php -l` |
| `deployed/answer_details.php` | +13 / −0 | 268 / 13644 | `b2ec1866…` | inline shape rules | site root; numstat; `php -l` |
| `deployed/admin_questions.php` | +2 / −2 | 1055 / 62646 | `f05d4305…` | in-place palette token `1.1.0` only | site root; asset vector; live +89 unchanged |
| `src/question-preview.css` | +76 / −0 | 113 / 1975 | `7d93e107…` | shape styles for the read-only preview | site root `src/`; `tests/math-tool.js` three-surface vector |
| `tests/math-tool.js` | +238 / −100 | 566 / 22756 | `45074d89…` | palette, editor, and mount harness | not deployed |
| `tests/render-markup.js` | new | 103 / 3614 | `09b7ca34…` | JS parity runner over the shared vectors | not deployed |
| `tests/fixtures/render-markup.json` | new | 197 / 7362 | `9b850cc0…` | authored JS/PHP vector table | not deployed |
| `tests/php-render.php` | +25 / −17 | 35 / 1500 | `bcbb1053…` | PHP parity runner over the same vectors | not deployed |
| `tests/question-preview.js` | +20 / −0 | 199 / 6922 | `bdcf1e74…` | real-renderer shape-preview vector | not deployed |

`src/math-tool.js` and `src/owner-tool/render.js` are new-cycle modules with no
line cap; each has one responsibility, and both are included by the pages that
use them (`admin_questions.php` loads the palette and the renderer; `cbt.php`
loads the renderer). Entry-point changes are narrow: two in-place token edits in
`admin_questions.php`, two inline style blocks plus one token in `cbt.php`, one
inline style block in `answer_details.php`. No monolithic addition and no copied
production path in the tests: every claimed harness requires the real module or
include, and the parity table is executed by both runtimes.

Excluded artifacts, separately: `archive/live-sources/*`,
`archive/owner-tool-2026-11/*`, `deployed/sql/base-schema.working.sql`,
`src/bookmarklet.js`, untracked `src/bookmarklet.min.js`, `src/parser/core.js`,
and the static PHP 8.3.32 CLI installed under `$HOME` outside the workspace.

## 3. Acceptance coverage

```text
node tests/runner.js                 PASS 60 / FAIL 0 / PENDING 0
node tests/unit.js                   PASS 163 / FAIL 0
node tests/ocr-helper.js             PASS 11
node tests/underline-toolbar.js      PASS 10
node tests/question-preview.js       PASS 5
node tests/math-tool.js              PASS 25
node tests/render-markup.js          PASS 67
node tools/extract-bank.js --check   OK (source, anchors, counts, 7 hashes)
php tests/php-render.php             PASS 32
php tests/admin-question-store.php   PASS 8
php tests/cbt-question-order.php     PASS 11 / FAIL 0
php -l render.php cbt.php answer_details.php admin_questions.php   PASS
```

PHP was exercised with a static PHP 8.3.32 CLI (the target is PHP 8.3); the
workspace has no system PHP. Every count matches the handoff.

| Acceptance row | Result |
|---|---|
| Node/PHP baselines | PASS, counts reproduce |
| Palette cleanup | PASS: `OPERATORS` is exactly `± × ÷ ≠ ≈ ° π √`; `SHAPES` is the five ids; `CATEGORIES`, `QUICK_ROW`, and `customFraction` are absent; no drawer element is built |
| Fraction / exponent / subscript / root / matrix editors | PASS: module-level insertion at the remembered caret, exact markers, caret positions, refusal path, Enter-without-submit |
| Freeform values | PASS: `<`, `>` refused everywhere, `/` refused in fraction terms, `|` refused in matrix cells, empty terms refused with a hint |
| Nested shapes | PASS: four different shapes nest; a reopened same tag stays text |
| Marker safety | PASS: 32 authored vectors plus an independent fuzz (below) |
| Underline interop | PASS: `<u>` wrapping/inside shapes renders once; legacy vectors unchanged |
| Multiline | PASS: no editor or renderer path adds/removes a line break |
| Byte counter | PASS: thresholds, byte counting, refresh, no truncation |
| Native save | Not re-run: no PHP server, database, or browser in this environment; no save/PRG code changed |
| Live-origin caps | PASS: +89/−80, +74/−35, +21/−3 |
| Live safety | PASS: no live read or write; no deploy |
| Owner desktop/Brave check | Not run: remains the external acceptance gate and the only visual evidence for the bars and grid |

Manifest: all **18** hash-bearing rows in `docs/DEPLOYMENT.md` reproduce exactly
(13 production files and 5 ops files), independently re-hashed with line/byte
counts.

## 4. Independent adversarial probes

**Probe A — cross-runtime parity fuzz (409 inputs).** Generated 400 deterministic
pseudo-random strings from a marker-heavy alphabet (`<u>`, `<frac>`, `<matrix>`,
stray/uppercase/encoded/attribute forms, `/`, `|`, `<`, `>`, emoji, quotes) plus
nine hand-built edge inputs, then compared `format()` and `strip()` in
`src/owner-tool/render.js` against `cbt_format_text()`/`cbt_strip_formatting()`.

```text
PARITY inputs=409 mismatches=0
```

**Probe B — injection after the real renderer.** Six payloads placing
`<script>`, `<img onerror>`, `<svg onload>`, `javascript:` anchors, `<iframe>`,
and `<span onmouseover>` inside shapes, fractions, and matrices. After removing
only the tags the renderer is allowed to create, no `<tag` remained in either
runtime.

```text
INJECTION payloads=6 leaked=0
```

**Probe C — admin summary path.** `strip()` on one instance of each shape emits
only text (`3/7`, `x2`, `x1`, `2x+1`, `a|b|c|d`, `1/2`), and
`admin_questions.php:965` feeds the list cell through the same
`cbt_strip_formatting`. No marker can leak into the summary.

**Probe D — scan cost at the field ceiling.** Repeated `<sup>` markers:

```text
opens=3000  bytes=15000  ms=41
opens=6000  bytes=30000  ms=131
opens=12000 bytes=60000  ms=515
```

Growth is super-linear (see `NOTE-1`); no crash and no unbounded memory at any
size tried (20 000 opens, 100 KB: ~1.4 s; 2 MB of ordinary text: 86 ms).

**Probe E — three-surface CSS parity.** Compared the twelve `.cbt-*` shape rules
across `src/question-preview.css`, `deployed/cbt.php`, and
`deployed/answer_details.php` after parsing declarations into normalized
`property: value` sets. All twelve are semantically identical; the only textual
difference is `repeat(2, auto)` versus `repeat(2,auto)` in
`.cbt-matrix-grid`, which is the same CSS.

**Probe F — deployment wiring.** Every consumer of a changed shared asset was
enumerated; see `FIX-1`.

## 5. Contract and documentation consistency

The renderer keeps the escape-first contract: parsing recognizes only exact
lowercase pairs, a marker whose tag is already open is text, unmatched markers
are text, and every text run is escaped by `escapeText`/`htmlspecialchars`. The
fraction split and matrix cell split read only direct text children, so nested
shapes never drive the separator. The PHP scanner mirrors the JS scanner line for
line, and both consume the same authored fixture.

The editor writes only through the remembered-caret insertion path, emits only
the five markers, and contains no storage, network, submit, underline-marker, or
`constant_text` reference; the byte counter and `maxlength` behavior are
unchanged. The preview remains read-only and now also renders shapes.

Docs are consistent with the code for the operator list, panel set, marker
contract, tokens inside `cbt.php`/`admin_questions.php`, manifest hashes, D-97 to
D-101, INV-145 to INV-148, and EC-145 to EC-150. Two documentation inaccuracies
and one bookkeeping gap are recorded as notes.

## 6. Findings

### FIX-1 — Changed shared assets keep stale cache keys on three consumers

**Defect.** MS01 changes `src/owner-tool/render.js` and
`src/question-preview.css`, but three consumers keep the pre-MS01 cache key, so a
returning browser can keep the old bytes at those URLs:

- `deployed/admin_questions.php:1048` loads
  `<script src="src/owner-tool/render.js"></script>` with no token (file changed
  +264/−65).
- `deployed/admin_questions.php:694` loads
  `<link rel="stylesheet" href="src/question-preview.css">` with no token (file
  changed +76/−0).
- `deployed/cbt_practice.php:616` still loads
  `<script src="src/owner-tool/render.js?v=2.3.2c"></script>` while `cbt.php`
  moved to `?v=2.3.3`.

**Reproduction / supported preconditions.** A client fetches either page before
the deploy and keeps those exact URLs cached; the deploy then replaces the bytes
at the same URL. On the admin add/edit page the stale renderer prints
`<frac>3/7</frac>` literally instead of the stacked shape, and the stale preview
stylesheet leaves the fraction and root unbarred and the matrix ungridded. On
`cbt_practice.php` a stale renderer prints new markers literally for students
until the entry expires. This is exactly the failure D-94's token policy exists
to prevent, and it survives because D-94 left these two admin assets untokened
and the package kept `cbt_practice.php` at its old token.

**Closure criteria (finite).**

1. `deployed/admin_questions.php` requests `src/owner-tool/render.js` and
   `src/question-preview.css` with a key different from the pre-MS01 URL (for
   example `?v=2.3.3` and `?v=1.1.0`), each exactly once.
2. `deployed/cbt_practice.php` requests `src/owner-tool/render.js` with a key
   different from `2.3.2c`, and the page is otherwise unchanged.
3. `deployed/cbt.php` keeps `?v=2.3.3`, and `admin_questions.php` keeps
   `math-tool.css?v=1.1.0` / `math-tool.js?v=1.1.0`.
4. The asset vector in `tests/math-tool.js` (or a new equivalent assertion)
   asserts all four keys and page counts; no existing assertion is weakened.
5. `docs/DEPLOYMENT.md` (manifest, upload/cache step, verification table) and
   `INV-141` / `EC-140` record the keys, with refreshed line/byte counts and
   hashes for the touched files.
6. Full Node/PHP baseline plus `php -l` passes, `git diff --check` is clean, and
   live-origin numstat is re-measured and reported; `admin_questions.php` must
   remain at +89 additions and `answer_details.php` at +21.

**Required evidence.** Exact before/after source lines for the three tags, the
test output that asserts them, refreshed manifest rows, and the numstat output.

**Non-goals / deferred.** No renderer, editor, CSS, or marker behavior change;
no feature change to `cbt_practice.php`; no new production file; no rotation of
the `cbt.php` token; no live read, write, deploy, or migration.

### NOTE-1 — The marker scan is super-linear and runs on every preview keystroke

Measured 41 ms at 3 000 opens, 131 ms at 6 000, and 515 ms at 12 000 (a 60 000-byte
field), because each open marker scans forward for its close
(`src/owner-tool/render.js:37-100`, `deployed/render.php:29-96`). The admin
preview re-renders Constant Text and Question on every `input`, so a pathological
60 KB paste of markers can stall the page for roughly a second. Real OCR output
and normal typing never produce thousands of markers, and the server path is
bounded by the same 60 000-byte limit, so this is residual hardening rather than
a defect: a single-pass tokenizer would make the scan linear. Not a commit gate.

### NOTE-2 — Duplicate accessible names in each shape panel

`src/math-tool.js:385` labels the shape toggle `Insert Fraction` (and the other
shapes) and `src/math-tool.js:478` gives the panel's Insert button the same name.
Both are `type="button"` with distinct `aria-controls`, but a screen reader
announces two identically named controls. Consider `Show fraction editor` versus
`Insert fraction` in a later polish pass.

### NOTE-3 — `INV-141` cites the wrong decision

`docs/INVARIANTS.md` INV-141 justifies the release-token rule with `D-94, D-101`;
D-101 is the matrix decision. The token policy is D-94, with the release-token
rotation recorded in the package/ME02 history.

### NOTE-4 — One authored vector was corrected after a first run

The shared vector `escaping inside a fraction keeps the separator split` was
first written with a fallback expectation (`cbt-frac-single`) and corrected to
the contract-consistent output (numerator `<b>`, empty denominator) once the
split rule was applied. This is disclosed because the repository forbids shaping
expectations to parser output. Independent re-derivation from the stated contract
agrees with the corrected vector, and the 409-input fuzz plus injection probes
found no divergence; no assertion was weakened, and the rest of the table was
authored from the contract.

### NOTE-5 — Reviewed tree is a chat branch, not the authoritative ref

The worktree is `freebuff/20b4a2fe6d18709da3bb0da2` at `0410ecb`. Locally,
`owner-tool-integration` is still `e64513f` and `origin/owner-tool-integration`
is `a3b93b7`, so the reviewed phase-1..5 history is not yet on those refs. This
review moved no branch by design; the owner-authorized phase-boundary commit must
reconcile the authoritative branch before commit readiness, and no other chat's
worktree may be touched to do it.

### NOTE-6 — Accessible name uses ASCII `2x2 matrix`

`src/math-tool.js` labels the matrix editor `2x2 matrix` while the package, docs,
and UI copy use `2×2`. Cosmetic; the id, marker, and grid are correct.

## 7. Verdict

**PASS WITH ACCEPTED FINDINGS.** No `BLOCK`. The package's central claims,
measurements, guardrails, and production paths reproduce; the marker contract is
consistent across both runtimes and all three rendering surfaces; injection and
parity probes pass.

- **Commit readiness:** not yet. `FIX-1` is unresolved and routes to a fix
  session in its first review round; `NOTE-5` must also be reconciled by the
  phase-boundary commit. No file was committed by this review.
- **Accepted risk:** `NOTE-1` (scan cost), `NOTE-2`, `NOTE-6` are residual and do
  not require a fix for this package.
- **Deferred checks:** owner desktop/Brave visual acceptance, native save,
  staging, MySQL, and any deployment remain outside this review.

**Recommended next action:** fix session for `FIX-1` under the frozen closure
criteria above, then a closure-focused re-review.
