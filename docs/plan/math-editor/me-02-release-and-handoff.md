# ME02 — Release, Evidence, and Handoff

- **Status:** not started
- **Depends on:** ME01 review settled (light review at this Gate 1)
- **Blocks:** cycle close
- **External gate:** owner-accepted Brave/Android check on the final tree; the
  2026-11-14 deployment-time artifact deferral still governs live deployment
- **Intent:** [`docs/24-question-underline-and-math.md`](../../24-question-underline-and-math.md)
  as amended for this cycle

## Goal

Turn the ME01 delta into a reviewable release: version and cache-busting
tokens, decisions, invariants and edge cases, the deployment manifest and
developer guide with fresh measurements, browser evidence, and a rigorous
review.

## Work

1. Set the asset token for `src/math-tool.js` and `src/math-tool.css`
   (`?v=1.0.0` unless a later consistent token is chosen) and update every page
   that references a changed asset.
2. Record the planned ME01 decisions as D-92/D-93 and any additional release
   decision from D-94 onward: the curated symbol set and insertion approach,
   the editor-side byte counter as advisory, and the dropped case-insensitive
   `<U>` requirement. D-91 belongs to ST01 `FIX-1`. No externalize-first
   approval is expected: `admin_questions.php` should stay at +89.
3. Update `docs/INVARIANTS.md` and `docs/EDGE_CASES.md` for the palette, the
   byte counter, and the unchanged exact-tag boundary.
4. Refresh `docs/DEPLOYMENT.md` and `docs/DEVELOPER-GUIDE.md`: new file row,
   hashes, cache-busting tokens, upload order, smoke checks, and the byte-limit
   limitation. Keep the 2026-11-14 live-artifact stop conditions intact.
5. Re-run every suite, `php -l`, and the bank extractor; record exact counts.
6. Run the desktop Chromium and owner Brave/Android checks on the final tree
   without a live write.
7. Run the rigorous release review and record it under `docs/plan/reviews/`.

## Acceptance

| Check | Expected |
|---|---|
| Node/PHP suites | All PASS; exact counts recorded, including the new `tests/math-tool.js` |
| Externalize-first | Every production file measured; `admin_questions.php` stays within the 100-addition cap (expected +89) |
| Tokens | Every page loads the current token for each changed asset |
| Manifest | File rows, lines/bytes, SHA-256, upload order, and smoke checks match the tree |
| Guide | Architecture map, state rules, and testing commands match the code |
| Docs | Status, map, package rows, invariants, edge cases, and decisions agree |
| Browser | Desktop Chromium and owner Brave/Android checks recorded with versions and outcomes |
| Live safety | No production deploy, no live write, cleanup owner-only |
| Review | Rigorous record settled before cycle close |

## Handoff template

```text
Date:
Result:
Node/fixture/PHP results:
Externalize-first measurements:
Approval record: none expected
Browser evidence:
Manifest/guide path/hash:
Files changed:
Open questions/known limits:
Review: pending rigorous release review
Commit: deferred
Next: cycle close only after a settled review and explicit authorization
```
