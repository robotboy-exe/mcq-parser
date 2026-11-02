# Owner Tool 2026-11 Phase 5 Re-Review

- **Date:** 2026-11-02
- **Reviewer:** OpenCode, independent re-review session
- **Package:** OT04 - Underline and Multiline
- **Scope:** `ot04-fix` at `08dc9c8` plus the uncommitted OT04 fix set in this worktree, compared with the original phase-5 review at `430ab5e`
- **Record:** re-review of `owner-tool-2026-11-phase-5.md`; the original record was not overwritten
- **Requested closers:** BLOCK-1, BLOCK-2, BLOCK-3, FIX-1, FIX-2, NOTE-1, NOTE-2

## Independence And Scope

This session did not edit product files, update package status, or commit. The
only file written is this review record. The handoff was treated as an
untrusted claim and every closure was checked against the implementation,
tests, PHP source, and independent probes.

The worktree was on `ot04-fix`, up to date with `origin/ot04-fix`, with eight
modified files: `README.md`, `deployed/admin_questions.php`,
`docs/INVARIANTS.md`, `docs/plan/owner-tool/ot-04-underline-and-multiline.md`,
`src/owner-tool/controller.js`, `src/owner-tool/style.css`,
`tests/owner-tool.js`, and `tests/unit.js`. All eight are accounted for by the
OT04 fix handoff. No unrelated worktree change was present, attributed to
OT04, changed, or reverted. No live site, production write, delete, or cleanup
action was performed.

The prior review record remains at `docs/plan/reviews/owner-tool-2026-11-phase-5.md`.

## Commands And Observed Evidence

| Command or probe | Result |
|---|---|
| `git status --short --branch` | `ot04-fix...origin/ot04-fix`; exactly the eight expected modified files |
| `git diff --stat` | 8 files, 191 insertions, 35 deletions |
| `git diff --check` | PASS |
| `node tests/runner.js` | 49 fixtures: 47 PASS, 0 FAIL, 2 documented PENDING; no orphan input |
| `node tests/unit.js` | 145 PASS, 0 FAIL |
| `node tests/owner-tool.js` | 38 PASS, 0 FAIL |
| `node tools/extract-bank.js --check` | source, anchors, counts, and 7 output hashes OK |
| `node --check src/owner-tool/controller.js tests/owner-tool.js tests/unit.js` | PASS |
| PHP 8.3.16 `-l` on all five `deployed/*.php` files | All five: no syntax errors |
| `php tests/php-render.php` | PASS: 9 PHP renderer vectors |
| Handoff SHA-256 checks | Controller, style, admin PHP, owner-tool test, and unit test hashes matched the fix handoff exactly |
| Fixture provenance inspection | `format-paragraph-stem` and `header-year-1994` are unchanged from the original review, remain `synthetic`/`CONFIRMED`, and were not regenerated |
| In-memory adversarial owner-tool harness (3 probes) | 3 PASS: future-version replacement, adjacent valid underline, rejected save at a skipped index |
| Chrome headless data-URL probe using PHP `htmlspecialchars` output | Old textarea pattern exposed 2 leading LFs and yielded 1; fixed pattern exposed 3 and yielded 2 |

PHP was found at `C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe`,
so the previous "PHP unavailable" evidence gap was executable in this
environment. The 9-vector renderer test is the committed `tests/php-render.php`
corpus, not a new ad-hoc vector set.

## Acceptance Coverage

| Acceptance check | Re-review result |
|---|---|
| Underline button/shortcut | PASS; exact markers, retained selection, and Ctrl+U removal remain covered by `tests/owner-tool.js` |
| Empty selection | PASS; no markup and the caret is retained |
| Add/Edit | PASS; Add keeps the importer, Edit remains formatting-only with no owner-state write |
| Undo/selection | PASS; previous desktop Chromium evidence remains valid, and the new depth guard does not change ordinary add/remove behavior |
| Preview | PASS; typing, fill, reset, and exact-marker rendering remain covered |
| Manual newlines | PASS for `question_text`; the sacrificial-LF pattern was confirmed with PHP 8.3 escaping plus Chrome textarea parsing. NOTE-3 records the same residual case for `answer_explanation` |
| OCR paragraphs | PASS; runner fixture `format-paragraph-stem` remains green |
| 1994 header | PASS; `header-year-1994`, plus 1900/2099/1899/2100 header and answer-title unit cases |
| Candidate pages | PASS by static path inspection; staging asset-path execution remains OT10 |
| Result/detail/print | PASS by static sink inspection plus the local 9-vector PHP renderer run; deployed staging remains OT10 |
| XSS probes | PASS; owner-tool vectors and PHP renderer vectors stay escaped and paired |
| Malformed markers | PASS; FIX-1 is closed and the renderer vectors keep nested/unmatched markers literal |
| Options/explanations | PASS as plain text; NOTE-3 records the leading-LF residual on the explanation field |
| State transition | PASS; full re-paste now constructs fresh state, verified by the committed test and an independent future-version probe |
| PRG preservation | PASS; server errors now dominate a stale success, posted values hydrate before CSRF rejection, and question-text newlines survive re-render |
| PHP baseline | PASS on local PHP 8.3.16 lint and the 9 renderer vectors; staging execution remains OT10 |
| Math palette | PASS; absent from the production controller |
| Browser | The recorded desktop Chromium evidence stands; this session added a targeted Chrome headless newline probe. Brave/Android staging remains owner-deferred to OT10 |

## Prior Findings Closed

### BLOCK-1 - CLOSED

The server-error branch now runs before the success-flash branch
(`src/owner-tool/controller.js:294-299`). The committed regression at
`tests/owner-tool.js:542` rejects a response containing both the exact success
flash and a validation error, keeps `currentIndex` at `0`, clears
`pendingSubmission`, and shows the rejection warning.

An independent probe repeated the case after `Skip`; it also refused to advance
past the skipped index. The error-first ordering matches the deployed PHP,
which can carry a stale session flash while rendering a current validation
error (`deployed/admin_questions.php:335-336`).

### BLOCK-2 - CLOSED

A full non-key paste now builds a fresh state object instead of re-versioning
the stored one (`src/owner-tool/controller.js:433-437`). `emptyState()` resets
`currentIndex`, `pendingSubmission`, `contexts`, unknown extensions, and
`queueId` before the parsed items, key, and metadata are assigned.

The committed regression at `tests/owner-tool.js:668` checks the stale-parser
case. An independent probe seeded a future version with an old context and an
unknown field; after full re-paste the state reported the current version,
`currentIndex` `0`, empty contexts, no unknown field, and the new queue
identity. A key-only paste remains refused while state is blocked.

### BLOCK-3 - CLOSED

Both server paths identified by the original review are corrected.

First, the question textarea emits one sacrificial LF before the escaped value
(`deployed/admin_questions.php:813`), so HTML textarea parsing removes only that
extra character. A Chrome headless probe using PHP 8.3 `htmlspecialchars`
output showed the old pattern turning two leading LFs into one, and the fixed
pattern preserving two. The committed static regression is
`tests/owner-tool.js:784`.

Second, posted save/update values and the edit id are hydrated before the CSRF
check (`deployed/admin_questions.php:354-369`), so an invalid or expired token
re-renders the administrator's edits rather than defaults. The single
hydration loop is guarded to save/update actions for a logged-in administrator,
and the CSRF rejection path still performs no database write.

### FIX-1 - CLOSED

Underline removal now requires marker depth `1` at the selection start before
accepting an existing pair (`src/owner-tool/controller.js:208-213`,
`src/owner-tool/controller.js:231-233`). Selecting `inner` in
`<u>outer <u>inner</u>` is refused and the malformed text is unchanged
(`tests/owner-tool.js:803`).

An independent probe confirmed the guard does not over-refuse: with
`<u>A</u> and B`, selecting `B` still produces `<u>A</u> and <u>B</u>`.

### FIX-2 - CLOSED

`.owner-tool-error` now defines a distinct background, text color, and border
(`src/owner-tool/style.css:41-45`). The warning element keeps its own class, so
it remains distinguishable from the server's `.admin-error` red. The regression
is `tests/owner-tool.js:778`. The stylesheet link appears after the inline admin
styles (`deployed/admin_questions.php:1049`), so the rule is not shadowed.

### NOTE-1 - CLOSED

The durable suite now covers both endpoints and both rejections for header
inference and answer-title removal (`tests/unit.js:250`,
`tests/unit.js:265`), and `INV-100` names that evidence
(`docs/INVARIANTS.md:154`). The fixture remains the 1994 case; the unit boundary
cases close the previous evidence gap without changing fixture provenance.

### NOTE-2 - CLOSED

The current-behavior summary now describes the owner tool's native PRG flow,
versioned `cbtOwnerTool:v1` state, stale-state refusal, native `is_active`
control, and absence of Auto-Save/forced-active/`ocrSubmitted` behavior
(`README.md:103-112`). The retired bookmarklet workflow is no longer presented
as current production behavior.

## New Non-Blocking Findings

### NOTE-3 - Leading newline is still lost when `answer_explanation` is re-rendered

The same HTML textarea rule that BLOCK-3 addressed for `question_text` still
applies to the explanation field, which emits its value directly after the
start tag (`deployed/admin_questions.php:870`). Explanation text is rendered
with `white-space: pre-wrap` (`deployed/answer_details.php:154`), so a leading
newline is visible content there.

This is outside OT04's question/context formatting scope ("options/explanations
stay plain in this release"), and it predates the fix set, so it does not
invalidate OT04. It is recorded as a residual data-preservation risk: a future
package can apply the same one-character sacrificial LF to the explanation
textarea, or the limitation can be explicitly accepted and documented.

### NOTE-4 - The fix handoff's PHP-availability claim is not reproducible here

The handoff says PHP is unavailable and that runtime lint/vector execution
remains OT10 evidence (`docs/plan/owner-tool/ot-04-underline-and-multiline.md:209-210`).
In this worktree PHP 8.3.16 was available. All five deployed PHP files lint
clean and `tests/php-render.php` passes its 9 vectors. This strengthens the
package rather than weakening it, but the handoff evidence statement should be
corrected when the coordinator docs are next updated. Deployed staging and
asset-path execution still remain OT10 evidence.

### NOTE-5 - Coordinator and instruction baseline counts are stale

The fix increased the suites to 145 unit and 38 owner-tool tests, but three
current-facing documents still report the pre-fix counts:

- `AGENTS.md:28` reports 143 unit and 33 owner-tool.
- `docs/STATUS.md:24` reports 143 unit and 33 owner-tool.
- `docs/plan/README.md:17-18` reports 143 unit and 33 owner-tool.

The fix handoff itself reports the new 145/38 counts
(`docs/plan/owner-tool/ot-04-underline-and-multiline.md:204-205`), so this is a
documentation consistency issue only. It does not change behavior or test
results.

## Deferred Evidence And Residual Risk

Deployed staging asset-path execution, full candidate/detail runtime behavior,
and Brave/Android selection behavior remain assigned to OT10 because no staging
copy was used in this session. `INV-97` through `INV-99` stay `AT_RISK` for that
reason. The local PHP 8.3 lint and renderer corpus now pass, but that is not a
substitute for the target-runtime and staging checks in OT10.

The two runner `PENDING` fixtures predate OT04 and remain documented pending
items, not failures. No unsafe question-text sink was found: candidate paths use
DOM nodes, the detail path uses the escaped PHP renderer, and options stay plain.

## Verdict

- **Verdict:** `PASS`
- **Commit readiness:** commit-ready for a user-authorized phase-boundary commit of the uncommitted OT04 fix set; no BLOCK or FIX finding remains open
- **Review status:** complete; BLOCK-1 through BLOCK-3, FIX-1 through FIX-2, and NOTE-1 through NOTE-2 are closed; NOTE-3 through NOTE-5 are non-blocking
- **Findings closed by re-review:** BLOCK-1, BLOCK-2, BLOCK-3, FIX-1, FIX-2, NOTE-1, NOTE-2
- **Pending user decision:** accept this PASS and decide whether to address NOTE-3 through NOTE-5 before or after the phase-boundary commit

## Exact Recommended Next Action

Accept this re-review and authorize the phase-boundary commit of the eight
uncommitted OT04 fix files; do not commit from a review session. At the same
boundary, update `AGENTS.md:28`, `docs/STATUS.md:24`, and
`docs/plan/README.md:17-18` to the observed 145/38 counts, set the phase-5
review checkpoint to pass, and correct the PHP-availability line in the OT04
handoff. Then start OT05 Gate 1, which remains blocked until the redacted DB
config and DDL are supplied; do not start OT05 implementation, and do not start
OT06.
