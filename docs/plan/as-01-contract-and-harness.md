# AS-01 — Contract, build hygiene, unit harness

Status: done (2026-10-25). Depends on: —. Blocks: AS-02.

## Self-contained context

`docs/Auto-Save-Spec.md` adds an opt-in auto-save mode to the existing
bookmarklet. Three of its rules reverse earlier decisions, so the contract must
change before code does:

- Reset Queue clears the key and batch identity.
- Auto-save saves questions inactive; manual saves stay active.
- The build may keep readable full-line comments but must still emit one line
  with no `%`.

The current generated bookmarklet contains one `%` in
`style="width:100%;min-height:220px"`. The admin page CSS already sets
`.admin-field textarea { width:100% }`, so the inline width is redundant.

## Goal

Record the new decisions, make the build enforce the new output rules, and add
the Node unit harness that later AS packages use. No auto-save behavior yet.

## Decisions to record

Add these to `docs/DECISIONS.md` and update the superseded rows:

| ID | Decision |
|---|---|
| D-30 | Reset Queue clears `ocrQueue`, `ansKey`, `ansKeyBatch`, and `queue.batchId`. Supersedes D-14, D-26, INV-34, EC-45. |
| D-31 | Auto-save deletes `is_active` from the POST; manual saves remain active. Supersedes D-24 and the forced-on half of INV-50. |
| D-32 | A batch id is created when questions are loaded; a queue without one, or a key without a matching `ansKeyBatch`, is legacy and manual-only. |
| D-33 | Auto-save is opt-in, starts only from a click after confirmation, stops on any blocker, and never retries an ambiguous save. |
| D-34 | Duplicate safeguards stop the run and show a reason; they do not silently skip. |
| D-35 | Full-line `//` comments are allowed in modules and stripped by the build; inline `//` stays forbidden; the output must contain no `%`. |
| D-36 | `parseKeyDetailed` returns `{key, conflicts}`; `parseKey` keeps returning the plain map; both share one matcher. |
| D-37 | `parseQuestion` adds `E/F options present` when `q.e` or `q.f` is non-empty. |

## Steps

1. Update `docs/plan/README.md` with the AS table, dependency graph, commands,
   definition-of-done additions, and change log.
2. Add D-30…D-37 to `docs/DECISIONS.md`; annotate D-14, D-24, and D-26 as
   superseded.
3. Update the affected rows in `docs/INVARIANTS.md` and `docs/EDGE_CASES.md` so
   they no longer state the old Reset/is_active rules as current. Full Auto-Save
   documentation is AS-06.
4. In `src/build/build.js`:
   - drop lines whose trimmed content starts with `//` before flattening;
   - throw a clear error if the final bookmarklet string contains `%`;
   - keep the existing one-line wrapper and output path.
5. Remove `width:100%;` from the `#ocr_text` inline style in `src/ui/ui.js`.
6. Add `tests/unit.js`: a dependency-free assert harness with `test(name, fn)`,
   PASS/FAIL lines, a summary, and `process.exitCode = 1` on failure. AS-01 only
   needs a smoke test; AS-02 fills it.
7. Add one full-line comment to a module and confirm it is absent from
   `src/bookmarklet.js`. Document the rule in `docs/AGENTS.md` and
   `docs/BUILD.md`.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0; one or more PASS |
| `node src/build/build.js` | writes `src/bookmarklet.js` |
| `wc -l src/bookmarklet.js` | `1` |
| `rg -n '%' src/bookmarklet.js` | no matches |
| `node -e "const fs=require('fs');new Function(fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,''))"` | exits 0 |
| `rg -n 'AS-COMMENT-MARKER' src/bookmarklet.js` | no matches |

## Guardrails

- Do not add auto-save behavior in this package.
- Do not edit `src/bookmarklet.js` by hand.
- Do not strip `//` that appears inside a string or regex; only full-line
  comments are stripped.
- Do not remove existing `localStorage` keys or change `ocrQueue`, `ocrMeta`, or
  `ansKey` shapes.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 2 PASS / 0 FAIL
Files: docs/DECISIONS.md (D-30…D-37; D-14/24/26 annotated),
  docs/INVARIANTS.md (INV-05/34/36/50), docs/EDGE_CASES.md (EC-45),
  docs/AGENTS.md, docs/BUILD.md, src/build/build.js,
  src/parser/parser.js (comment only), src/ui/ui.js (width removed),
  tests/unit.js, docs/plan/README.md, docs/plan/as-01…as-06.
Checks: build OK; wc -l = 1; no `%`; node --check body OK; comment stripped.
Open questions: none.
```
