# MS01 — Visual Math Shapes and Palette Cleanup

- **Status:** in progress; phase-5 review recorded 2026-11-17 as `PASS WITH
  ACCEPTED FINDINGS`; `FIX-1` fixed 2026-11-17, closure re-review pending
- **Depends on:** EL01 done and phase-4 review-settled 2026-11-17; the owner
  reopened `math-editor-2026-11` for this package on 2026-11-17
- **Blocks:** nothing yet; a phase-6 package may follow
- **External gate:** live-origin addition caps re-measured (base `0410ecb`):
  `admin_questions.php` **+89/−80**, `cbt.php` **+74/−35**,
  `answer_details.php` **+21/−3**, `cbt_practice.php` **+20/−2** after the
  `FIX-1` renderer token. An owner-visible desktop/Brave check of the new
  editors is an external acceptance gate, like ME02.
- **Package base:** `0410ecb` (clean worktree)
- **Intent:** owner request 2026-11-17, superseding the palette shape input in
  ME01 while leaving ME01's counter and mounting contract intact.

## Owner requirement (2026-11-17)

> Clean out the math editor pallette and keep only fractions, exponents,
> subscripts and fractions. But the manner of input for exponents, subscripts
> and fractions need to change. We need to have a visual editor for each shape
> (values with exponents, values with subscripts and fractions) instead that the
> user can use in freeform and put whatever values they want into it, similar to
> the custom fractions input right now. But the fraction divider needs to be
> completely horizontal instead of a slanted one. Lastly, the square root symbol
> needs to have the horizontal line as well. To clarify, when I said clean out
> the pallette, I meant the extra symbols, not the basic / standard operators /
> symbols.

> I was asking that the square root symbol contain it's horizontal line as well.
> Making it have 3 connecting lines instead of the 2 that it currently has that
> looks like a V. Also add 2 by 2 matrix to the visual editors, using the same
> visual format.

Read as five points:

1. The palette keeps the basic/standard operators and drops the extra symbol
   grids (Greek, set theory/logic, geometry/vectors, and the precomposed
   superscript, subscript, and vulgar-fraction character grids).
2. Fraction, exponent, and subscript input becomes a freeform visual editor per
   shape, in the style of today's custom-fraction row.
3. The fraction bar is a full horizontal rule, not the slanted `⁄` the module
   inserts today (`3/7` → `³⁄₇`).
4. The square root carries a horizontal vinculum over its radicand: three
   connected strokes (the tick, the diagonal, and the horizontal line) instead
   of the two-stroke `√` that reads as a V.
5. A 2×2 matrix joins the visual editors in the same freeform format.

## Goal

Replace the precomposed Unicode shape output with five exact shape markers that
the shared renderers restore as styled inline shapes, and replace the palette's
symbol grids with five freeform shape editors. No schema, parser, storage,
session, or PRG change.

## Design

### Shape markup — five exact marker pairs

| Shape | Stored text | Rendering |
|---|---|---|
| Fraction | `<frac>3/7</frac>` | numerator above a full-width horizontal rule, denominator below |
| Exponent | `x<sup>2n+1</sup>` | base stays plain, wrapper raised |
| Subscript | `x<sub>1</sub>` | base stays plain, wrapper lowered |
| Root | `<sqrt>2x+1</sqrt>` | `√` plus a horizontal vinculum over the radicand (three connected strokes) |
| 2×2 matrix | `<matrix>a|b|c|d</matrix>` | two rows and two columns in brackets, cells row-major |

Contract:

- Only the exact lowercase pairs `<u>`/`</u>`, `<frac>`/`</frac>`,
  `<sup>`/`</sup>`, `<sub>`/`</sub>`, `<sqrt>`/`</sqrt>`, and
  `<matrix>`/`</matrix>` are formatting. Uppercase forms, attributes, encoded
  forms (`&lt;frac&gt;`), unclosed opens, and stray closes stay literal text.
- Escape-first is preserved: every character inside a shape is escaped exactly as
  it is today, and only the recognized marker pairs become elements.
- Shapes nest through different markers, so `<frac>x<sup>2</sup>/2</frac>`
  renders a fraction whose numerator carries an exponent. A marker whose own tag
  is already open stays text, which caps real nesting at the six distinct
  markers; a depth-eight guard remains as a safety bound in both scanners.
- A `<frac>` whose top-level content has no `/` renders its content with no bar;
  the first top-level `/` is the separator when present.
- `<matrix>` content is row-major: the four top-level `|`-separated cells are
  `a|b` then `c|d`. A matrix with fewer or more than four top-level cells renders
  as its text content with no grid, so hand-edited storage never errors.
- `<u>` still applies and may wrap a shape; a shape may contain `<u>`.
- `strip`/`cbt_strip_formatting` removes all markers and keeps their text, so the
  admin list summary shows `3/7` and never a raw tag.

### Visual editors

One toolbar row, no "More symbols" drawer. The operator row plus five shape
buttons; choosing a shape opens a compact panel filled with freeform inputs and
a live shape preview:

| Editor | Inputs | Inserted text |
|---|---|---|
| Fraction | numerator, denominator | `<frac>num/den</frac>` |
| Exponent | base, exponent | `base<sup>exp</sup>` |
| Subscript | base, subscript | `base<sub>sub</sub>` |
| Root | radicand | `<sqrt>radicand</sqrt>` |
| 2×2 matrix | four cells in a 2×2 input grid | `<matrix>a|b|c|d</matrix>` |

Input rules: values are trimmed; both terms are required for fraction, base and
wrapper for exponent/subscript, radicand for root, and all four cells for the
matrix. `<` and `>` are always rejected, `/` is rejected in fraction terms, and
`|` is rejected in matrix cells, each with an inline hint so the editor cannot
forge or split markup; letters, digits, spaces, `+ - = ( ) . , × ÷ ± °` and
other ordinary Unicode are accepted. Enter inserts and never submits. Insertion reuses ME01's
`execCommand` → `setRangeText` → `.value` path, the remembered caret, the
`input` dispatch, and the deferred counter refresh. The preview shown inside the
editor panel is UI only and writes nothing.

### Palette cleanup

- Keep the basic operators `± × ÷ ≠ ≈ ° π √` in the always-visible row.
- Remove the Exponents, Subscripts, Fractions, Greek, Set theory and logic, and
  Geometry and vectors grids; remove the drawer and its toggle.
- Remove `customFraction`, the vulgar-fraction table, and the digit maps: a
  fraction always inserts `<frac>`, so `1/2` also gets a horizontal bar.
- Keep the byte counter, its thresholds, and all of its refresh wiring exactly as
  ME01 left them.

### Rendering surfaces

| Surface | Renderer | Shape styles |
|---|---|---|
| `cbt.php` (exam) | `src/owner-tool/render.js` via `window.CBTText.render` | inline `<style>` in `cbt.php` |
| `answer_details.php` | `deployed/render.php` `cbt_format_text` | inline `<style>` in `answer_details.php` |
| Admin read-only preview | `src/owner-tool/render.js` via `window.CBTText` | `src/question-preview.css` |
| Admin question list | `deployed/render.php` `cbt_strip_formatting` | none; markers flatten to text |

`<sup>`/`<sub>` render as real `sup`/`sub` elements, so they need no CSS.
Fractions, roots, and matrices need their rule/grid styles in each of the three
surfaces that paint them.

## Non-goals

- Schema, `constant_text`, parser, PRG, flash text, field names, or `maxlength`.
- Options palette, `cbt_practice.php`, attempt storage, or parser inference.
- LaTeX, MathML, images, SVG files, new dependencies, or a build step.
- Converting already-stored `³⁄₇`/`½`/`x²` text; existing content stays as typed.
- Changing the 60,000-byte server limit, the advisory counter, or its thresholds.
- Storage keys, network calls, form submission, or any write from the preview.
- Live reads, live writes, or deployment.

## Externalize-first plan (base `0410ecb`)

| File | Baseline lines / bytes | Expected additions | Responsibility | Deployment | Direct production-path test |
|---|---:|---:|---|---|---|
| `src/math-tool.js` | 554 / 17436 | rework, net shrink expected; new-cycle module, no cap | operator row + five shape editors + byte counter | site root `src/` | `node tests/math-tool.js` (real module, DOM shim mount) |
| `src/math-tool.css` | 200 / 3317 | no cap | editor panels, shape previews, focus, mobile targets | site root `src/` | `node tests/math-tool.js` structural asserts |
| `src/owner-tool/render.js` | 209 / 6339 | no cap | exact-marker scanner and renderer | site root `src/owner-tool/` | `node tests/render-markup.js` (real module) |
| `deployed/render.php` | 78 / 2447 | no cap | PHP parity scanner and renderer | site root | `php tests/php-render.php` (real include) |
| `deployed/cbt.php` | 1068 / 45755; live +59/−35 | inline shape rules plus a renderer token edit; keep **≤ +74** | exam page styles | site root | source check in `node tests/render-markup.js`; live-origin numstat |
| `deployed/answer_details.php` | 255 / 12617; live +8/−3 | inline shape rules; keep **≤ +23** | detail page styles | site root | `php tests/php-render.php` vectors; live-origin numstat |
| `deployed/admin_questions.php` | 1055 / 62646; live +89/−80 | one in-place asset token edit, **+0** | palette version token only | site root | `node tests/math-tool.js` asset check; stays at +89 |
| `src/question-preview.css` | 37 / 711 | no cap | shape styles for the read-only preview | site root `src/` | `node tests/question-preview.js` |
| `tests/math-tool.js` | 428 / 16924 | rework | palette/editor vectors | not deployed | self |
| `tests/render-markup.js` (new) | — | new | JS renderer parity runner over the shared vectors | not deployed | requires the real `src/owner-tool/render.js` |
| `tests/fixtures/render-markup.json` (new) | — | new | one vector table consumed by both JS and PHP | not deployed | both runners |
| `tests/php-render.php` | 27 / 1130 | rework to consume the shared vectors | PHP renderer parity | not deployed | requires the real `deployed/render.php` |
| `tests/question-preview.js` | 179 / 6023 | one shape-preview vector | preview integration | not deployed | real preview module |
| Docs | — | — | `INTENT.md`, `AGENTS.md`, `docs/AGENTS.md`, `docs/SPEC.md`, `docs/DECISIONS.md`, `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md` | not deployed | docs-only |

Excluded artifacts, separately: `archive/live-sources/*` snapshots,
`archive/owner-tool-2026-11/*`, `deployed/sql/base-schema.working.sql`, the
generated `src/bookmarklet.js`, the untracked `src/bookmarklet.min.js`, and
`src/parser/core.js`.

No live-origin cap exception is needed: the largest planned live-origin additions
are the two inline shape-rule blocks, and `admin_questions.php` keeps its exact
current additions.

## Decisions to record

- **D-97 — Shape markers.** Fractions, exponents, subscripts, roots, and 2×2
  matrices store as five exact lowercase marker pairs; renderers restore only
  those plus `<u>`, and everything else stays escaped text. Matrix cells are the
  four row-major top-level `|`-separated terms. A marker cannot reopen while its
  tag is open, and a depth-eight guard bounds the scan.
- **D-98 — Bars are CSS rules.** The fraction divider and the radical vinculum
  are borders painted by each rendering surface; there is no LaTeX, MathML, image,
  or new dependency.
- **D-99 — No precomposed shape characters.** The palette drops the symbol grids
  and always inserts markers, so `1/2` renders with a horizontal bar instead of
  `½`; existing stored precomposed text is left untouched.
- **D-100 — Editor validation.** Shape inputs are freeform but reject `<` and
  `>`, reject `/` in fraction terms and `|` in matrix cells where they would
  forge or split markup, require their documented terms, and insert through
  ME01's existing insertion path with an inline hint on invalid input.
- **D-101 — 2×2 matrix only.** The matrix shape is exactly two rows by two
  columns with bracketed delimiters; other sizes, and bracket-style choices, are
  out of scope for this package.

## Acceptance

| Check | Expected |
|---|---|
| Node suites | runner 60 PASS / 0 PENDING, unit 163, ocr-helper 11, underline 10, question-preview 4 + the new shape vector, math-tool reworked PASS, render-markup PASS |
| PHP suites | php-render PASS with the shared vectors, admin-store 8, cbt-question-order 11, `php -l` on every changed file (PHP 8.3) |
| Palette cleanup | Only the operator row and five shape buttons; no drawer, no Greek/set/geometry grids, no precomposed shape characters |
| Fraction editor | `3` over `7` inserts `<frac>3/7</frac>` at the remembered caret and renders stacked with a full horizontal rule in the admin preview, exam page, and details page |
| Exponent editor | base `x`, exponent `2n+1` inserts `x<sup>2n+1</sup>` and renders raised |
| Subscript editor | base `x`, subscript `1` inserts `x<sub>1</sub>` and renders lowered |
| Root editor | radicand `2x+1` inserts `<sqrt>2x+1</sqrt>` and renders three connected strokes: `√` plus a horizontal vinculum over the radicand |
| Matrix editor | cells `2`, `x`, `1`, `y` insert `<matrix>2|x|1|y</matrix>` and render a bracketed 2×2 grid with that row-major order |
| Freeform values | Letters, digits, spaces, and ordinary operators are accepted; empty or marker-bearing values are refused with a hint and no insertion |
| Nested shapes | `<frac>x<sup>2</sup>/2</frac>` renders a stacked fraction with a raised numerator; different shapes nest through four levels, and a reopened same tag stays text |
| Marker safety | Uppercase, attribute, encoded, unclosed, and stray markers stay literal text in both renderers and in the admin list summary |
| Underline | `<u>` wrapping and inside shapes still renders exactly once, with no malformed pairs |
| Multiline | No line break is added, removed, or rewritten by any editor or renderer |
| Byte counter | Thresholds, byte counting, refresh, and no-truncation behavior unchanged from ME01 |
| Native save | Add and Edit still PRG-save the marker text; server byte limit authoritative |
| Live-origin caps | `admin_questions.php` +89, `cbt.php` ≤ +74, `answer_details.php` ≤ +23 by numstat against the archived snapshots |
| Live safety | No live read or write; no deploy |
| Owner browser check | Desktop and Brave/Android: editors usable, bars horizontal, the root shows its horizontal stroke, the matrix renders a 2×2 grid, targets ≥38px, no second Underline button |

## Gate 1 — 2026-11-17 (read-only)

- Worktree clean on the chat branch at `0410ecb`; `owner-tool-integration` is the
  authoritative work branch and is unchanged by this Gate 1.
- Coordinator and package status agree: `math-editor-2026-11` is active and was
  never archived; ST01, ME01, ME02, and EL01 are `done` and review-settled; no
  unresolved `BLOCK` or required `FIX` exists.
- Live-origin measurement against `archive/live-sources/`: `admin_questions.php`
  **+89/−80**, `cbt.php` **+59/−35**, `answer_details.php` **+8/−3**. Planned
  ceilings stay inside the 100-addition cap, so no exception is requested.
- Baseline commands and results at `0410ecb` (2026-11-17, this VM):

  ```sh
  node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
  node tests/unit.js                  # 163 PASS, 0 FAIL
  node tests/ocr-helper.js            # 11 PASS
  node tests/underline-toolbar.js     # 10 PASS
  node tests/question-preview.js      # 4 PASS
  node tests/math-tool.js             # 20 PASS
  node tools/extract-bank.js --check  # 7 hashes OK
  ```

  The PHP suites (`php tests/php-render.php`, `admin-question-store.php`,
  `cbt-question-order.php`) and `php -l` were not run: this VM has no PHP
  binary. They are required implementation checks, not optional.
- Branch observation: this cloud worktree is checked out on the chat branch
  `freebuff/20b4a2fe6d18709da3bb0da2` at `0410ecb`. The local
  `owner-tool-integration` ref still points at `e64513f` and
  `origin/owner-tool-integration` at `a3b93b7`, so the phase-1..4 commits are
  not yet on those refs. Gate 1 does not move branches; the owner-authorized
  commit/push boundary must reconcile them when the phase lands.
- PHP is not installed in this VM (no `php` binary). Implementation must run the
  PHP suites and lint on PHP 8.3, using the static PHP 8.3 CLI outside the
  workspace as in prior packages, or record the gap explicitly.
- No product file was changed by this Gate 1; only this package file, the
  coordinator, the phase map, and `docs/STATUS.md` were added or updated.

## Handoff — 2026-11-17

**Result:** MS01 implemented on the reopened cycle at package base `0410ecb`
(clean worktree). No commit was made and no live read or write occurred.

### Files and measurements

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility | Deployment and production-path evidence |
|---|---:|---:|---|---|---|
| `src/math-tool.js` | +308 / −290 | 572 / 18198 | `8e460c8ab29b01e2c7c3a7b457023962e7959dea59c1e3cd9ed1a2809b99e04f` | operator row, five freeform shape editors, advisory byte counter | site root `src/`; `node tests/math-tool.js` requires and mounts the real module |
| `src/math-tool.css` | +92 / −86 | 206 / 3334 | `da630779060a617582da5c2f909e03d9f5883bf3d72348aaf1522cded6828850` | operator row, panels, 2×2 input grid, preview, hint, counter targets | site root `src/`; structural asserts in `tests/math-tool.js` |
| `src/owner-tool/render.js` | +264 / −65 | 408 / 13764 | `216ebb513ef48ee82c71e6d0af4e8657e6a0579ac674b2e0e5a6c6d55ad87933` | six-marker scanner, format/render/strip, fraction/root/matrix nodes | site root `src/owner-tool/`; `node tests/render-markup.js` and the preview vector |
| `deployed/render.php` | +213 / −43 | 248 / 8161 | `f1152c545bd8f1983995b800cb0b3635439fe5ab3d162ba9d2b588173ecea41f` | server parity scanner and markers | site root; `php tests/php-render.php` over the shared vectors; `php -l` |
| `deployed/cbt.php` | +17 / −2 | 1083 / 46924 | `05e1e2a3ab95889ea3eb20328a81f5ddf6c48d3616e24564159e113760ca75ed` | inline fraction/root/matrix rules; renderer token `?v=2.3.3` | site root; live-origin numstat; `php -l` |
| `deployed/answer_details.php` | +13 / −0 | 268 / 13644 | `b2ec1866b5afcef9aba3e7ba4a30d7a791210f4f48bd943fe3e572e1c53dbd29` | inline fraction/root/matrix rules | site root; live-origin numstat; `php -l` |
| `deployed/admin_questions.php` | +2 / −2 | 1055 / 62646 | `f05d430529f345a4b5a357fe31b28e93c95b91d36e6805bb111f07500c18035c` | in-place palette token `?v=1.1.0` only | site root; asset vector in `tests/math-tool.js`; stays at live **+89/−80** |
| `src/question-preview.css` | +76 / −0 | 113 / 1975 | `7d93e1078e77caf88100308e9ace1e2fd461d865ae2ee557465c2e28ac25bfaa` | shape styles for the read-only preview | site root `src/`; `tests/math-tool.js` three-surface vector |
| `tests/math-tool.js` | +238 / −100 | 566 / 22756 | `45074d89f4718caa637c5bce692b99bf9bd2e7f277fb9e916a09647e851130b2` | palette, editor, and mount harness | not deployed |
| `tests/render-markup.js` (new) | +103 / −0 | 103 / 3614 | `09b7ca344e238301a8dab78db86bb953c02ca70d872f40d09efbd61ef8d4b388` | JS parity runner over the shared vectors | not deployed |
| `tests/fixtures/render-markup.json` (new) | +197 / −0 | 197 / 7362 | `9b850cc0dccb5f25edc36f02400abc6a682d221cec9330ba3732c2004c91d899` | authored JS/PHP vector table | not deployed |
| `tests/php-render.php` | +25 / −17 | 35 / 1500 | `bcbb105323e5106256b00311b1b874f7652010961e1fa594a1e2e8bea38231ae` | PHP parity runner over the same vectors | not deployed |
| `tests/question-preview.js` | +20 / −0 | 199 / 6922 | `bdcf1e74fd695899ccc5da08c3aedf0a445d13908fb41b1af5015feebc3ca9c0` | real-renderer shape-preview vector | not deployed |
| Docs | — | — | — | `INTENT.md`, `AGENTS.md`, `docs/AGENTS.md`, `docs/SPEC.md`, `docs/DECISIONS.md`, `docs/INVARIANTS.md`, `docs/EDGE_CASES.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPER-GUIDE.md` | not deployed |

Live-origin caps against the designated snapshots: `admin_questions.php`
**+89/−80** (unchanged), `cbt.php` **+74/−35** (at its Gate 1 ceiling of +74),
`answer_details.php` **+21/−3** (ceiling +23). All are inside the 100-addition
cap; no exception exists or is needed.

Excluded artifacts, separately: `archive/live-sources/*`,
`archive/owner-tool-2026-11/*`, `deployed/sql/base-schema.working.sql`, the
generated `src/bookmarklet.js`, untracked `src/bookmarklet.min.js`,
`src/parser/core.js`, and the static PHP 8.3.32 CLI installed under `$HOME`
outside the workspace.

### Commands and results

```sh
node tests/runner.js                # 60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                  # 163 PASS, 0 FAIL
node tests/ocr-helper.js            # 11 PASS
node tests/underline-toolbar.js     # 10 PASS
node tests/question-preview.js      # 5 PASS
node tests/math-tool.js             # 25 PASS
node tests/render-markup.js         # 67 PASS
node tools/extract-bank.js --check  # 7 hashes OK
php tests/php-render.php            # 32 PASS (PHP 8.3.32)
php tests/admin-question-store.php  # 8 PASS (PHP 8.3.32)
php tests/cbt-question-order.php    # 11 PASS, 0 FAIL (PHP 8.3.32)
php -l deployed/render.php deployed/cbt.php deployed/answer_details.php deployed/admin_questions.php  # PASS
```

PHP was absent from this VM; the declared PHP 8.3 target was exercised with the
static PHP 8.3.32 CLI kept outside the workspace. MySQL, browser, staging, and
live checks were not run.

### Acceptance mapping

| Check | Result |
|---|---|
| Node/PHP baselines | **PASS**: 60/163/11/10/5 and the reworked 25 math-tool vectors; PHP renderer 32, store 8, ordering 11; bank extractor 7 hashes |
| Palette cleanup | **PASS**: operator row is exactly `± × ÷ ≠ ≈ ° π √`; five shape ids only; `CATEGORIES`, `QUICK_ROW`, and `customFraction` are gone; no drawer markup is emitted |
| Fraction editor | **PASS** at module level: `3` over `7` inserts `<frac>3/7</frac>` at the remembered caret, caret 17 in the mount vector, and the marker renders `.cbt-frac-num` over `.cbt-frac-den` |
| Exponent editor | **PASS**: `x` + `2n+1` inserts `x<sup>2n+1</sup>` |
| Subscript editor | **PASS**: `a` + `1` inserts `a<sub>1</sub>` |
| Root editor | **PASS**: radicand `2x+1` inserts `<sqrt>2x+1</sqrt>`; render emits `√` plus `.cbt-sqrt-body` with the horizontal rule |
| Matrix editor | **PASS**: `2`,`x`,`1`,`y` inserts `<matrix>2|x|1|y</matrix>`; render emits brackets around a four-cell row-major grid |
| Freeform values | **PASS**: letters, digits, spaces, and ordinary operators accepted; empty terms, `<`, `>`, `/` in fraction terms, and `|` in matrix cells refused with a hint and no insertion |
| Nested shapes | **PASS**: four different shapes nest through their children; a reopened same tag stays text |
| Marker safety | **PASS**: uppercase, attribute, encoded, unclosed, stray, and split markers stay literal; the shared vectors assert escape-first output in both renderers |
| Underline | **PASS**: `<u>` wrapping and inside shapes renders exactly once; legacy underline vectors unchanged |
| Multiline | **PASS**: insertion helpers and vectors never add, remove, or rewrite a line break |
| Byte counter | **PASS**: thresholds and refresh vectors unchanged from ME01 |
| Native save | Not re-run: no PHP server, browser, or database is available here; no server-side save or PRG code changed |
| Live-origin caps | **PASS**: +89, +74, +21 by numstat against the archived snapshots |
| Live safety | **PASS**: no live read or write, no deploy |
| Owner browser check | **Not run**: desktop and Brave/Android acceptance remains the external gate |

### Open questions and review status

- The depth-eight guard is a safety bound: because a tag cannot reopen while
  open, real nesting is capped at the six distinct markers.
- Shape geometry is verified structurally (classes and rules) and by the shared
  renderer vectors, not by a rendered screenshot; the owner browser check covers
  the visual result.
- `cbt.php` sits exactly at its Gate 1 ceiling of +74 additions; any further
  work there needs a new Gate 1 measurement.
- Review status: implementation handoff recorded; the phase-5 review has not
  been run.

**Commit:** deferred. No file was staged or committed.

### Phase-5 review fix — `FIX-1` (2026-11-17)

Review record: [`reviews/math-editor-2026-11-phase-5.md`](../reviews/math-editor-2026-11-phase-5.md).
Accepted finding: the changed shared assets kept stale cache keys on three
consumers.

| Frozen criterion | Implementation | Evidence |
|---|---|---|
| 1. Admin tokens for both changed assets, once each | `deployed/admin_questions.php:694` `src/question-preview.css?v=1.1.0`; `:1048` `src/owner-tool/render.js?v=2.3.3` | source lines; asset assertions |
| 2. `cbt_practice.php` renderer at a fresh key, page otherwise unchanged | `:616` `?v=2.3.2c` → `?v=2.3.3`, one line | one-line diff; live numstat still **+20/−2** |
| 3. `cbt.php` keeps `2.3.3`; the admin palette pair keeps `1.1.0` | untouched | existing assertions |
| 4. Asset vector asserts all four keys | `tests/math-tool.js` asserts the tokened admin renderer and preview stylesheet, exactly-once counts, absence of the untokened URL and `2.3.2c`, and `cbt_practice.php` at `2.3.3` | `node tests/math-tool.js` PASS 25 |
| 5. Docs and decision record | `DEPLOYMENT.md` manifest/upload/cache/verification rows, `INV-141`, `EC-140`, `DEVELOPER-GUIDE`, new `D-102` superseding D-94's untokened clause | refreshed rows; `grep` sweep shows no stale key outside D-94's history |
| 6. Baseline and caps | full suites, `php -l`, `git diff --check`; `admin_questions.php` stays **+89/−80**, `cbt_practice.php` **+20/−2**, `answer_details.php` **+21/−3** | command output |

Files: `deployed/admin_questions.php` 1055 / 62662 (two in-place tokens, 0 line
delta); `deployed/cbt_practice.php` 886 / 37246 (one line, +1/−1 in the file);
`tests/math-tool.js` 577 / 23758; docs-only elsewhere. No renderer, editor,
style, or `cbt_practice.php` feature byte changed. `NOTE-1`–`NOTE-6` were not
addressed here (residual/accepted, or `NOTE-5` bookkeeping for the commit).

**Commit:** deferred. No file was staged or committed.
