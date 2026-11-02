# Owner Tool 2026-11 Phase 5 Review

- **Date:** 2026-11-02
- **Reviewer:** OpenCode, independent review session
- **Package:** OT04 - Underline and Multiline
- **Scope:** `ot04-fix` at `430ab5e65e975a5051e89eb7f1ad34036ba14cc9`, compared with the pre-OT04 `83de4bc` state
- **Record:** first rigorous phase-5 review; no prior owner-tool phase-5 record exists

## Worktree And Evidence Scope

The target worktree was clean and tracked `origin/ot04-fix`. The separate `main`
worktree had unrelated untracked browser, PHP, and SQL artifacts; none was read
as branch implementation evidence, changed, or attributed to OT04.

The review read the intent, coordinator, active map, OT03 dependency/handoff,
OT04 package/handoff, implementation, fixtures, tests, current behavior docs,
archived detail source, and deployed rendering paths. The handoff was treated as
an untrusted claim.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch` | Clean `ot04-fix...origin/ot04-fix` |
| `git log`, `git diff --name-status`, and implementation diffs from `83de4bc` | OT04 implementation and remediation commits inspected; 30 files in final package diff |
| `git diff --check 83de4bc..430ab5e` | PASS |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING |
| `node tests/unit.js` | 143 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 33 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | 7 slices OK |
| `node --check` on changed JS and test files | PASS |
| Handoff/source `sha256sum` checks | Recorded implementation hashes matched; supplied and archived user samples matched; archived `answer_details.php` hash matched the handoff |
| Fixture provenance inspection | `header-year-1994` accurately labels its source-backed header and synthetic question; `format-paragraph-stem` accurately labels its synthetic source; uppercase `A)` remains source-backed |
| Year boundary probes for headers and answer titles | 1900 and 2099 accepted; 1899 and 2100 rejected; 20xx behavior retained |
| In-memory owner-tool adversarial harness | Existing 33 tests passed; 3 added boundary probes failed as described in BLOCK-1, BLOCK-2, and FIX-1 |
| Local headless Chromium 152 harness using the real parser/state/render/controller sources | Exact underline insertion and one-step undo passed; HTML textarea parsing dropped one of two leading LF characters |
| `command -v php` / `php tests/php-render.php` | PHP unavailable; runtime vectors and lint not executed |

No live site, production write, delete, or cleanup action was performed.

## Acceptance Coverage

| Acceptance check | Review result |
|---|---|
| Underline button/shortcut | PASS in Node and local Chromium for ordinary selection |
| Empty selection | PASS; no markers inserted and caret retained |
| Add/Edit | PASS for importer-plus-formatting on Add and storage-free formatting on Edit |
| Undo/selection | PASS in local desktop Chromium for ordinary text; malformed nested boundary fails under FIX-1 |
| Preview | PASS for typing, fill, reset, ordinary edits, exact tags, and XSS text handling |
| Manual newlines | **BLOCKED** by leading-LF loss in BLOCK-3 |
| OCR paragraphs | PASS; single wraps fold, blank-line paragraphs remain, options stay single-line |
| 1994 header | PASS; 1900/2099 adversarial boundaries also passed |
| Candidate pages | Static path inspection PASS for both CBT pages; staging asset-path execution remains deferred |
| Result/detail/print | Static sink inspection PASS; PHP runtime execution remains deferred |
| XSS probes | Browser renderer PASS; PHP implementation is statically paired but its vectors were not executable here |
| Malformed markers | Rendering remains safe, but toolbar mutation fails under FIX-1 |
| Options/explanations | PASS; they remain plain text |
| State transition | **BLOCKED** by stale parsed data surviving a full re-paste in BLOCK-2 |
| PRG preservation | **BLOCKED** by false advance in BLOCK-1 and edit loss in BLOCK-3 |
| PHP baseline | Source appears PHP 8.3-compatible; lint/vectors explicitly remain OT10 staging evidence |
| Math palette | PASS; absent from the production controller |
| Browser | Local desktop Chromium smoke completed; owner-deferred Brave/Android staging smoke remains OT10 evidence |

## Findings

### BLOCK-1 - A rejected save can advance on a stale success flash

`resolvePending()` tests the success flash before checking `.admin-error`, so a
page containing both advances and fills the next item
(`src/owner-tool/controller.js:276-298`). The deployed PHP can render both: it
consumes any existing session flash before handling the current POST and emits
the error and success containers independently
(`deployed/admin_questions.php:335-336`,
`deployed/admin_questions.php:733-738`).

The adversarial harness submitted question 1 and reloaded with the exact success
flash plus a validation error. `currentIndex` became `1` instead of remaining
`0`. This violates the native PRG lifecycle and OT04 preservation acceptance
(`docs/plan/owner-tool/ot-03-owner-tool-replacement.md:46-50`,
`docs/plan/owner-tool/ot-04-underline-and-multiline.md:69-70`) and can skip or
misassociate an unsaved question.

### BLOCK-2 - Full re-paste re-versions stale parsed state instead of replacing it

`readState()` deliberately returns the stale object
(`src/owner-tool/state.js:73-78`), and the controller keeps that object
(`src/owner-tool/controller.js:28-30`). A full paste replaces selected fields
but never constructs fresh state or clears `contexts`/unknown extensions
(`src/owner-tool/controller.js:425-432`); `persist()` then stamps it with parser
2.1.0 (`src/owner-tool/controller.js:38-42`).

The adversarial probe seeded parser-2.0 state with an old context and an unknown
field. After full re-paste, the state reported parser 2.1.0 while retaining the
old context and field. This breaches the fresh-version intent and the documented
replacement rule (`INTENT.md:21-22`, `docs/DECISIONS.md:905-908`,
`docs/INVARIANTS.md:149`).

### BLOCK-3 - Server re-rendering does not preserve every posted edit/newline

Two server paths contradict the exact newline and validation-preservation
acceptance.

First, PHP retains leading LF characters in `question_text`
(`deployed/admin_questions.php:418-419`) but emits the value immediately after
the textarea start tag (`deployed/admin_questions.php:811`). HTML textarea
parsing removes the first LF in that position. The Chromium probe supplied
`"\n\nFirst paragraph"` and read back `"\nFirst paragraph"`, so Edit and
validation-error re-renders can silently lose one manually entered newline.

Second, an invalid/expired CSRF token is rejected before the question form is
hydrated from POST (`deployed/admin_questions.php:351-355` versus
`deployed/admin_questions.php:411-423`). That response therefore renders
defaults rather than the administrator's posted edits. Both behaviors violate
the fixed manual-newline rule and unconditional validation-error preservation
claim (`docs/plan/owner-tool/ot-04-underline-and-multiline.md:21`,
`docs/plan/owner-tool/ot-04-underline-and-multiline.md:61`,
`docs/plan/owner-tool/ot-04-underline-and-multiline.md:70`).

### FIX-1 - Underline can corrupt a malformed nested-marker boundary

The immediate surrounding markers set `already = true`, bypassing the overlap
guard (`src/owner-tool/controller.js:223-235`). For
`<u>outer <u>inner</u>`, selecting `inner` and invoking Underline changed the
stored text to `<u>outer inner`, rather than refusing the nested boundary. The
result remains XSS-safe, but the toolbar destructively changes malformed source
despite the documented refusal behavior (`docs/EDGE_CASES.md:109`).

### FIX-2 - Critical owner-tool warnings have no error styling

The warning element uses `owner-tool-error`
(`src/owner-tool/controller.js:321`), but `src/owner-tool/style.css:1-84` defines
no such class and the deployed red treatment applies only to `.admin-error`
(`deployed/admin_questions.php:717-718`). Stale-state and ambiguous-save safety
warnings therefore render as an uncolored generic alert. A separate class is
appropriate so the tool warning does not get mistaken for a server rejection,
but it still needs an explicit visual treatment.

### NOTE-1 - Year endpoint evidence is not durable in the committed suite

The implementation passed independent 1899/1900/2099/2100 probes, but the
committed fixture and unit assertion cover only 1994
(`fixtures/expected/header-year-1994.json:13-17`, `tests/unit.js:231-247`).
`INV-100` overstates the durable evidence when it marks both endpoints and both
rejections VERIFIED by those tests (`docs/INVARIANTS.md:154`).

### NOTE-2 - README mixes the retired bookmarklet workflow into production behavior

The architecture section correctly names the owner tool as production
(`README.md:6-10`), but the current behavior summary still describes
`ocrQueue`/`ocrMeta`/`ansKey`, Auto-Save, forced active saves, and no PHP changes
(`README.md:103-109`). Those are legacy behaviors and conflict with `INTENT.md`
and the shipped owner-tool state/PRG path.

## Deferred Evidence And Residual Risk

PHP 8.3 lint/vector execution, deployed asset-path verification, full
candidate/detail runtime checks, and Brave/Android staging selection behavior
were not replaced with assumptions. The package consistently assigns them to
OT10 because PHP and a staging copy are unavailable. `INV-97` through `INV-99`
appropriately remain `AT_RISK`; the duplicated JS/PHP vector lists are not yet a
cross-runtime parity run.

The two runner `PENDING` fixtures predate OT04 and did not become failures. No
unsafe question-text sink was found: both CBT paths use DOM nodes, detail uses
the escaped PHP renderer, and options/explanations remain plain.

## Verdict

- **Verdict:** `BLOCK`
- **Commit readiness:** not merge-ready; the branch contains reproducible unmet acceptance and state/PRG safety defects
- **Review status:** complete with BLOCK-1 through BLOCK-3 open
- **Findings closed by re-review:** not applicable; this is the first phase-5 record
- **Pending user decision:** start an OT04 fix session; OT05 remains blocked

## Exact Recommended Next Action

Run a dedicated OT04 fix session on `ot04-fix` that makes server error dominate
stale success, creates a genuinely fresh state on full re-paste, preserves every
leading newline and posted value across Edit/validation responses including
CSRF rejection, refuses destructive nested-marker toggles, restores distinct
warning styling, and adds regressions for each case plus the year endpoints.
Rerun every OT04 baseline and acceptance probe, keep the PHP/mobile deferrals
explicit if still unavailable, then request a re-review that writes
`docs/plan/reviews/owner-tool-2026-11-phase-5-re-review.md`. Do not start OT05.
