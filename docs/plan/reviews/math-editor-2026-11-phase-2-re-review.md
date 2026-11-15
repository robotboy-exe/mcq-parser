# Phase 2 Re-review — ME01 `FIX-1` Closure

- **Date:** 2026-11-15
- **Reviewer:** independent review session
- **Scope:** closure-focused re-review of phase 2 / `ME01` `FIX-1` after the
  recorded fix, plus disposition of `NOTE-1` and `NOTE-2`
- **Package:** [`math-editor/me-01-math-palette.md`](../math-editor/me-01-math-palette.md)
- **Prior record:** [`math-editor-2026-11-phase-2.md`](math-editor-2026-11-phase-2.md)
- **Reviewed state:** package base `cdbff2b` plus the uncommitted fix
  (`src/math-tool.js`, `tests/math-tool.js`, and the package fix note)
- **Mode:** closure-focused. The frozen `FIX-1` contract from the original
  record is the only closure target; this review does not broaden it
- **Worktree:** chat worktree at `cdbff2b`, with `owner-tool-integration`
  `e64513f` as an ancestor. It changed only this record, did not edit product,
  test, package, status, or map files, and did not commit

## 1. Frozen closure contract and authority

The original review recorded `FIX-1` as the stale byte counter after the page's
own OCR fill and after a native form reset, with three finite criteria:

1. after an `#ocr_load` or `#ocr_skip` click that changes `#question_text`, and
   after the form `reset` event settles, the counter text and
   `data-byte-status` equal the field's current UTF-8 byte count, red at
   60 000 or more;
2. the refresh reuses the existing update path with no storage key, network
   request, submit, form-value write, Underline button, `maxlength`, or
   Save-control change;
3. the 16 existing vectors stay green and at least one new real-module vector
   covers load/skip and reset refresh.

Non-goals were `ocr_helper.js`, `question-preview.js`, the underline toolbar,
renderers, PHP, CSS, the 60,000-byte server limit, `maxlength`, and any
browser/MySQL claim. `NOTE-1` and `NOTE-2` were documentation corrections.

## 2. Repository and change scope since the original review

```text
git rev-parse HEAD                     cdbff2b58873244eb9b08c895544f69eceb00863
git diff --numstat HEAD -- deployed/admin_questions.php     2      0
git status --porcelain                 8 docs/entry files modified, 4 untracked files
git diff --check                       clean
```

Only `src/math-tool.js` (+19 lines) and `tests/math-tool.js` (+33 lines)
changed for the fix; documentation gained the fix note and corrected wording.
`deployed/admin_questions.php` remains the same +2 asset lines and the CSS is
byte-identical to the reviewed state. No unrelated or user-owned change exists.

## 3. Implementation inspection

- `src/math-tool.js:391-404` adds one deferred refresh helper and wires it to
  the owner form's `reset` (via `textarea.form`) and to `#ocr_load` /
  `#ocr_skip` when those controls exist. It reuses `updateCounter`; no new
  state, key, request, write, or control.
- The deferred path uses `root.setTimeout(updateCounter, 0)` with an immediate
  fallback, matching `src/question-preview.js:86-98`.
- Symbols, insertion, mount ordering, `maxlength`, Save, CSS, admin markup,
  PHP, and the server limit are untouched.
- `tests/math-tool.js` adds one real-module vector and extends the shim with the
  form and OCR buttons. The module is still required, not copied.

## 4. Commands and results

PHP 8.3.32 (static-php-cli, outside the workspace) was used.

```text
node tests/runner.js                    60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js                      163 PASS
node tests/ocr-helper.js                11 PASS
node tests/underline-toolbar.js         9 PASS
node tests/question-preview.js          4 PASS
node tests/math-tool.js                 17 PASS
node tools/extract-bank.js --check      source, anchors, counts, 7 hashes OK
php tests/php-render.php                9 PASS
php tests/admin-question-store.php      8 PASS
php -l                                 PASS on 5 deployed PHP files
node --check src/math-tool.js tests/math-tool.js  PASS
```

The new vector was independently confirmed to be the only one added: it fails
`'neutral' !== 'red'` with the wiring removed, and the suite is 17/17 with it.

## 5. Closure verification

| Criterion | Result and evidence |
|---|---|
| 1. Refresh after load, skip, and reset; red at ≥60,000 | **PASS.** Real-module vector: 60 000 bytes → `red` / `60 000 / 60 000 bytes` after load and after reset; small skip fill → `neutral`. Independent probe: a load → skip → load → reset sequence returned `red, neutral, amber, red`; the deferred path stayed stale until the timeout callback ran, then showed `red`, matching real-browser ordering (`reset` fires before values change). |
| 2. Same update path, no adjacent behavior | **PASS.** Only `updateCounter` is reused. Source boundaries hold: no `localStorage`, `fetch`, `XMLHttpRequest`, `innerHTML`, `.submit()`, `constant_text`, or `owner_tool_underline`; no form-value write. Admin page and CSS are byte-unchanged from the reviewed state. |
| 3. Existing vectors green; real-module refresh vector | **PASS.** 16 prior vectors unchanged and passing; the added vector requires and mounts the real module. |

## 6. Adversarial probes (closure-derived)

Run from temporary files outside the repository against the real module:

1. **Mount without a form or OCR controls.** `init` still mounts, shows
   `1 / 60 000 bytes`, and throws nothing — the new wiring is guarded.
2. **Load → skip → load → reset sequence.** `red, neutral, amber, red` in order,
   covering repeated refresh and all three thresholds.
3. **Deferred ordering with `setTimeout` present.** The counter remained at the
   previous value until the queued callback ran, then showed `red`; this is the
   real-browser path and shows no double or premature update.
4. **`execCommand` reporting false.** Exactly one insertion (`a±`) and one
   `input` event — no regression from the fix.
5. **Selected insertion across formatting.** `a\n<u>b</u>\n\nc` with `b`
   selected became `a\n<u>±</u>\n\nc`; one exact `<u>` pair and the blank-line
   paragraph preserved.
6. **Idempotent mount.** A second `init` returns `null` and adds no toolbar.

## 7. Note disposition and new findings

- **`NOTE-1` — CLOSED as documentation.** The package acceptance row now says
  the fallback dispatches a synthetic `input` and the `execCommand` path relies
  on the browser's native event.
- **`NOTE-2` — CLOSED as recorded divergence.** The fix note records that
  `QUICK_ROW` is its own 15-entry constant because eight quick characters are
  not in the drawer categories; the curated set matches the package.
- **No new `BLOCK`, `FIX`, or `NOTE`.** No regression was reproduced. Browser,
  mobile, undo, native save, MySQL, staging, and live paths remain unexercised
  and are carried as release evidence, not reopened here.

## 8. Independent measurements

Package base `cdbff2b`; live-origin snapshot
`archive/live-sources/admin_questions-2026-10-31.php` (1046 / 62273, SHA-256
`b47e6f6ee46685394eae577a9191fd04caf2eec6cb97cf45b92dca4233396028`).

| File | Package diff | Final lines / bytes | SHA-256 (LF) | Responsibility and deployment | Production-path evidence |
|---|---:|---|---|---|---|
| `src/math-tool.js` | +432 / -0 | 432 / 13974 | `fee1d8b393e64e39457186a345e6e5d4227d21f79f885d44983554bdb69c6d14` | palette insertion and advisory byte counter; site root `src/` | `node tests/math-tool.js` (real module and mount) |
| `src/math-tool.css` | +133 / -0 | 133 / 2028 | `09f30a164de075dbb3aaff1aed470dd3143f2ed12d5d15bf582132ea69f6a2ce` | presentation; site root `src/` | loaded once; structural asserts |
| `deployed/admin_questions.php` | +2 / -0 | 1055 / 62630 | `0a6276c3f5c0f9418062f6f356e8213af2a2e37fb84e2e2fc3dc19363cf8da9f` | two asset lines; site root | asset-order vector, `php -l` |
| `tests/math-tool.js` | +387 / -0 | 387 / 14947 | `239cda8712c875460fbddb4eb2cb255326d29802dfa87bf09e8c58c999fec13a` | harness; not deployed | self |

Live-origin additions: **+89 / -80**, within the 100-addition cap, no exception.

**Excluded artifacts, separately:** P24 inline blocks
(`docs/24-question-underline-and-math.md` unchanged), `cbt_practice.php`,
`src/ui/ui.js`, `ocr_helper.js`, generated `src/bookmarklet.js`, `archive/`
snapshots, `deployed/sql/base-schema.working.sql`, tracked `session-ses_e35a.md`,
and temporary probe/PHP files outside the workspace.

## 9. Acceptance coverage

| Package row | Re-review result |
|---|---|
| Node suites; `tests/math-tool.js` | **PASS.** 60/163/11/9/4 + 17 |
| PHP suites; `php -l` | **PASS.** 9 renderer, 8 store, 5 lint clean on PHP 8.3.32 |
| Quick symbols / drawer / keyboard | **PASS at module level**, browser activation not run |
| Mobile tap, ≥38px | **Not run**; CSS is unchanged and remains owner/ME02 evidence |
| Undo | **PASS only on the `execCommand` path by design**; fallbacks browser-dependent |
| Multiline unchanged | **PASS.** Probe 5 |
| Preview refresh | **PASS at event level**; `NOTE-1` wording corrected |
| Underline unchanged / no second button | **PASS** |
| Byte counter thresholds, multi-byte, no truncation | **PASS**, now including OCR fill and reset |
| Admin table summary and renderers | **PASS by unchanged path** |
| Native save | **Not run**; no server-side byte changed |
| Live safety | **PASS.** No live read/write or deploy |

## 10. Verdict and next action

**PASS.** `FIX-1` closes on every frozen criterion, both notes are closed, and no
new finding exists. Phase 2 is review-settled. The package remains within
+89/−80 live-origin additions, the module and harness execute through the real
production path, and the deferred refresh does not disturb symbol insertion,
mounting, or the server contract.

- **Commit readiness:** review-settled, but this review made no commit and the
  instructions still require an explicit owner request. `Commit: deferred`.
- **Status reconciliation:** the coordinator, status, and map still say the
  closure re-review is pending; ME02 Gate 1 must update them to
  "phase 2 review-settled".
- **Dependency:** ME02 Gate 1 may now proceed. Brave/Android, desktop, native
  save, MySQL, and deployment evidence remain ME02/release gates and do not
  reopen this closure.

NEXT COMMAND: @docs/plan/prompts/phase-session.md phase 3
