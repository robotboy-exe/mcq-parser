# Automated Browser/Click-Path Harness — Draft Spec

Status: **unapproved draft for external review**, not an approved work package.
Do not implement until this document is reviewed and accepted.

This spec is self-contained so it can be refined outside the workspace. It
describes a browser harness for the bookmarklet's DOM, storage, fill, tick,
reset, and save paths. It does not propose parser/UI behavior changes and does
not replace the existing fixture runner or unit tests.

## 1. Problem

The current automated coverage is parser-only:

- `node tests/runner.js` replays fixtures through the parser.
- `node tests/unit.js` tests pure parser and Auto-Save helpers.

Neither executes the real browser path: injecting the bookmarklet, filling the
form, ticking the key, reading/writing `localStorage`, clicking Reset, or
posting a save. The 2026-10-25 live V1-V3 checks covered those paths with
one-off Playwright/CDP scripts. They worked, but they were slow, manual,
non-repeatable, and not checked in.

A checked-in browser harness should make those checks repeatable and much faster
on repeat runs, while keeping live verification explicitly opt-in.

## 2. Goals

1. Run the bookmarklet in a real Chromium page and assert user-visible
   behavior, DOM state, `localStorage`, and network requests.
2. Cover the V1-V3 scenarios:
   - V1: load a bank year and an anomaly block, assert queue/key/flags/form.
   - V2: optional live/staging controlled save and cleanup.
   - V3: stale queue loads, auto-save blocks, Reset and re-paste works.
3. Cover the core click path for saving: success, validation error, ambiguous
   reply, logged-out reply, marker refusal, duplicate block, and queue advance.
4. Default to an offline/local mock so the suite is fast, deterministic, and
   safe. Live writes must be impossible by accident.
5. Produce a clear pass/fail report and retain enough artifacts to debug a
   failure.
6. Leave no test rows, browser state, credentials, or files behind.

## 3. Non-goals

- Replacing `tests/runner.js` or `tests/unit.js`.
- Testing PHP security, CSRF weaknesses, uploads, or the server implementation
  beyond the form contract the bookmarklet depends on.
- Load, performance, or accessibility testing.
- Multi-year pastes; the current one-year-per-paste rule stays in force.
- Changing `src/parser/parser.js`, `src/ui/ui.js`, or generated
  `src/bookmarklet.js`.
- Running live writes in CI or without explicit operator confirmation.
- Proving the live site's list/filter behavior; that is site behavior, not a
  bookmarklet defect.

## 4. Definitions

- **Mock profile:** a local Node HTTP server serving an admin page derived from
  the archived HTML and implementing the PHP form contract in memory.
- **Live profile:** the real admin site, or an approved staging clone.
- **Click path:** browser interactions and DOM/storage/network effects, not
  parser-only assertions.
- **Scenario:** one named test with setup, steps, assertions, and cleanup.
- **Run artifact:** report, screenshot, DOM snapshot, console log, or network
  log from a scenario.

## 5. Current contract the harness must respect

### 5.1 Bookmarklet entry points and selectors

Injected UI:

- `#ocr_text`, `#ocr_load`, `#ocr_clear_text`, `#ocr_show`
- `#ocr_reset`, `#ocr_goto`, `#ocr_skip`
- `#ocr_auto_start`, `#ocr_auto_stop`, `#ocr_auto_dry`
- `#ocr_active_mode`, `#ocr_confirm_tick`, `#ocr_active_tick`
- `#ocr_status`, `#ocr_auto_status`, `#ocr_auto_blocked`
- `#ocr_batch_confirm`, `#ocr_saved_box`, `#ocr_saved_list`
- `#ocr_paused`, `#ocr_paused_text`
- `#ans_res`, `#ocr_save_flag`, `#ans_clear`

Admin form:

- `input[name=action][value=save_question]` identifies the add form.
- `#question_text`, `#option_a`, `#option_b`, `#option_c`, `#option_d`
- `input[name=correct_option]` radios, values `0`–`3`
- `#subject_id`, `#exam_category_id`, `#exam_year`
- `input[name=is_active]`
- `#question_image`, `#answer_video`, `#answer_explanation`
- `input[name=csrf_token]`

Injection guard: the bookmarklet must refuse to run when the add form or radios
are missing, and when `location.search` contains `edit=`.

### 5.2 Storage keys

Harness may create and inspect:

- `ocrQueue` — `{items:[], i:0, batchId?}`
- `ocrMeta` — `{subject_id, exam_category_id, exam_year}`
- `ansKey`, `ansKeyBatch`, `ansKeyConflicts`
- `ocrSaving`, `ocrSavedLog`, `autoLock`

Hard rules:

- `ocrSubmitted` is legacy and must not be read, written, or deleted.
- The harness must clear all OCR keys it creates before it finishes.
- A scenario that needs a stale queue must set an explicit fixture, not rely on
  leftovers from another scenario.

### 5.3 Save contract

- POST is `FormData(form)` to the current page with same-origin credentials.
- The form's `action=save_question`, `csrf_token`, and field names are
  preserved.
- Manual save forces `is_active` on.
- Draft auto-save removes `is_active`; active auto-save sets it to `1`; both set
  `autosave=1`.
- Success is the redirected flash
  `Question saved successfully (Question ID: N)`.
- A validation error is `.admin-error` on a non-redirected response.
- The logged-out page contains `Administrator Login`.
- A marker in `ocrSaving` blocks a second save until cleared.
- A successful save advances the queue and logs `{num, id, batchId, inactive,
  mode}` in `ocrSavedLog`.

## 6. Environments

### 6.1 Mock profile (default)

A local Node server on `127.0.0.1` with an ephemeral port by default. It serves:

- `GET /admin_questions.php` and `/` — the add form, derived from
  `archive/live-sources/admin_questions.html`.
- `GET /admin_questions.php?edit=<id>` — an edit page showing `is_active` so
  the bookmarklet's inactive verification can run.
- `POST /admin_questions.php` — `save_question`, `update_question`,
  `delete_question`, `login`, `logout`.
- `GET /bookmarklet.js` — current `src/bookmarklet.js` for injection.
- Control endpoints for tests only: `POST /__reset`, `GET /__state`,
  `GET /__posts`, `POST /__control`.

The mock must:

- keep state in memory, not in workspace files;
- issue deterministic IDs starting at `900`;
- return `303` with a `Location` header and a success flash for a good save;
- simulate the four-option, year, CSRF, and `correct_option` validation rules;
- render the 20-row recent list and honor subject/year/category filters;
- render long question text as the first 139 characters plus `…`, so duplicate
  prefix matching is exercised;
- support failure modes: `ok`, `validation`, `ambiguous`, `logged_out`,
  `network_abort`, `slow`, `stale_success`, `unverified`;
- never serve a live credential or contact the network.

The mock should start as a child process of the harness, write its port to the
report, and be stopped in `finally`. It must not reuse an existing random port
or leave a server running after a failed run.

### 6.2 Live profile (opt-in, explicit)

Live runs are allowed only for:

- V1 acceptance (parse a bank/anomaly input on the real page); no writes.
- V2 schema check (one disposable question); one save and one delete.
- V3 stale-queue behavior; no writes.

Rules:

- Require `--profile live` and `--confirm-live-writes` for V2, plus environment
  variables for URL, username, and password. Never accept credentials as CLI
  flags or write them to disk or logs.
- Refuse to run if the URL is not explicitly marked as live/staging.
- Use a unique marker (`OCRHARNESS-<timestamp>-<random>`) in every disposable
  question.
- Register cleanup before the first write; run it in `finally` even on failure.
- If cleanup cannot confirm deletion, exit nonzero with the row ID and edit URL.
- Do not run active auto-save, batch auto-save, or multi-row live tests against
  production.
- Apply short timeouts and at most one retry for transient navigation failures;
  never retry a save automatically.
- Record the final URL and deletion flash as evidence.

## 7. Suggested layout

Exact paths remain an open question, but the default proposal is:

```text
tests/browser/
  run.js                 # CLI, scenario selection, report
  lib/browser.js         # launch/connect, context, page, waits
  lib/mock-server.js     # local admin/server contract
  lib/assert.js          # readable assertions and DOM/storage helpers
  lib/report.js          # summary, JSON, artifacts
  scenarios/
    smoke.js             # build + inject + guard
    replay.js            # V1 fixture replay
    state.js             # reset, stale queue, key-only, goto/skip
    save.js              # manual save click path
    autosave.js          # optional Auto-Save DOM wiring
    live-schema.js       # V2 guarded live save/delete
  README.md
```

Dependency policy is an open question. Preferred: keep browser-test
dependencies isolated from the bookmarklet runtime and from the root project.
A `tests/browser/package.json` is acceptable only if the project owner approves
the first package/dependency addition. Do not add a root `package.json`, lint,
typecheck, or CI config under this package unless separately approved.

## 8. Browser driver

The harness must run on the current Termux environment.

Preferred order:

1. Reuse the existing Chromium CDP setup (`chromium-cdp start opencode1`) and
   connect with Playwright/CDP or a small raw-CDP client.
2. If launching a browser directly, use the installed Chromium and an isolated
   throwaway profile.
3. Do not use `pkill -f` or `pgrep -f`. Stop only the browser/server the harness
   started, by PID or owned port.
4. If the harness starts Chromium, it must stop it on success and failure. If
   it connects to an existing browser, it must not stop that browser.
5. Use a fresh browser context per scenario; never reuse the operator's live
   profile for mock runs.

If a platform shim or nonstandard Playwright import is required on Termux, the
spec must record it in `tests/browser/README.md` and keep it out of production
code.

## 9. Scenario model

Every scenario must declare:

```js
{
  name: 'save/manual-success',
  profile: 'mock',            // mock | live
  suite: 'save',              // smoke | replay | v1 | v3 | save | autosave | schema
  timeoutMs: 15000,
  setup: async (ctx) => {},
  steps: async (ctx) => {},
  assertions: async (ctx) => {},
  cleanup: async (ctx) => {}
}
```

Assertions must fail with:

- scenario name;
- expected value;
- actual value;
- current URL;
- a pointer to the artifact directory.

No silent retries inside a scenario. A scenario may retry only a transient page
navigation, and the retry count must appear in the report.

## 10. Required scenarios

### 10.1 Smoke

- Build check: one line, no `%`, body parses.
- Inject once: all expected panels exist; no console/page errors from the
  bookmarklet.
- Inject twice: old `ocr_input`/`ans_panel`/script are removed; only one set of
  controls and one submit interception remain.
- Wrong page: no add form or an `edit=` URL shows the refusal alert and does not
  inject the panel.
- Mock server reset leaves an empty queue.

### 10.2 Replay and V1

For each selected fixture (`questions` kind):

- clear storage and mock state;
- inject the current bookmarklet;
- paste the input into `#ocr_text` and click `#ocr_load`;
- assert `ocrQueue`, `ansKey`, `ocrMeta`, `#ocr_status`, `#ocr_auto_blocked`;
- assert the form's question/options/radio for the first item;
- assert flags per item against `expected.questions`, `required_flags`, and
  `forbidden_flags`;
- assert the key map and queue number sequence;
- assert no unexpected storage keys.

Target fixtures for V1:

- `bank-2021`: 40 items, year 2021, subject `CRS`, E questions
  `[1,21,31,32,33,34,35]`, 40 key answers, Q40 exact text/options, no
  merged-question flag.
- `anomaly-block2`: 12 items, nums
  `[null,2,3,4,7,8,9,12,13,14,15,16]`, salvage flag present, short-stem flag
  absent, Q0 header and Q16 option A exact.

The same replay should be able to run against the mock admin page. Live V1 is a
separate opt-in acceptance profile, not part of the default suite.

### 10.3 State and V3

- Reset Queue: queue becomes `{items:[],i:0}`, `ansKey`/`ansKeyBatch` removed,
  paste box visible, status text updated.
- Stale queue: set an old-shape queue without `batchId`; boot; assert the stale
  text is filled, the batch warning is shown, Start is enabled after the
  confirmation tick, and Start is blocked with
  `This queue has no batch identity. Paste the questions again.` with zero POSTs.
- Reset and re-paste: after Reset, load `anomaly-block2`; assert 12 items, a new
  `batchId`, no legacy warning.
- Key-only paste: load questions, then paste only a key; assert the queue is
  unchanged and the key/`ansKeyBatch` are updated.
- Go to question and Skip: assert the selected index and form fill.
- Reload: queue/key/meta survive a page reload when intended; `ocrSaving` and
  `autoLock` behavior is reported accurately.

### 10.4 Save click path

- Manual success: exactly one POST; form fields preserved; `is_active` forced;
  success text; saved log entry; queue advances; marker cleared; image/video/
  explanation cleared.
- Validation error: no advance; error text surfaced; marker restored; queue
  unchanged.
- Ambiguous reply: no advance; marker retained; "may have saved" warning.
- Logged-out reply: targeted re-login message; no retry.
- Existing marker: manual click is refused with zero POSTs; clearing the marker
  allows one later POST.
- Duplicate block: a same-batch saved number or recent matching row blocks the
  run with zero POSTs.
- Network failure: no false success; marker behavior matches the unit-tested
  contract.
- Recent-list matching: a 139-character + `…` row matches the full question;
  an untruncated short row does not match by prefix.

### 10.5 Auto-Save DOM wiring (optional suite)

These are already unit/mock-tested; include browser coverage only where the DOM
wiring matters:

- dry run produces zero POSTs;
- draft saves omit `is_active` and set `autosave=1`;
- active saves set `is_active=1` and require the active-mode tick;
- a run has no save-count cap and continues to queue end;
- two consecutive unverified saves stop the run;
- hide-pause stops after the tab becomes hidden;
- a live lock owned by another tab blocks Start;
- reset clears the queue, key, and batch identity.

### 10.6 Live V2 schema

- Guarded by `--profile live --suite schema --confirm-live-writes` and env
  credentials.
- Create one disposable question with unique marker, four non-empty options,
  keyed radio, subject/category/year, and manual save.
- Assert the success flash and a fresh ID.
- Load `?edit=<id>` and assert the question text, year, category, and
  `is_active`.
- Load a filtered admin list and assert the ID/marker appears.
- Delete the row through the admin delete action.
- Assert the delete flash and that `edit=<id>` no longer finds it.
- On any failure after creation, still attempt deletion; exit nonzero after
  cleanup.
- Never leave the browser logged in or credentials on disk.

## 11. Assertions and evidence

Each run produces:

- a human summary with PASS/FAIL per scenario and total duration;
- a JSON report at a configurable path;
- on failure: a screenshot, sanitized DOM snapshot, console log, page-error log,
  network request log, and relevant `localStorage` snapshot;
- artifact directory default: `$HOME/tmp/ocr-harness/<timestamp>/` (Termux has
  no `/tmp`);
- no credentials, auth cookies, or full form bodies containing secrets in any
  artifact.

Global assertions:

- no uncaught page errors;
- no bookmarklet console errors;
- no unexpected `localStorage` OCR keys;
- no save POST when a scenario expects zero;
- exactly one save POST for a single manual save;
- cleanup completed.

Live profiles may allow known third-party console noise; the allowlist belongs
in the scenario, not in a global silence switch.

## 12. CLI

Proposed interface:

```sh
node tests/browser/run.js --profile mock --suite all
node tests/browser/run.js --profile mock --suite replay --fixture bank-2021
node tests/browser/run.js --profile mock --suite save
node tests/browser/run.js --profile live --suite schema --confirm-live-writes
```

Options:

| Option | Meaning |
|---|---|
| `--profile mock\|live` | Default `mock`. |
| `--suite smoke\|replay\|v1\|v3\|save\|autosave\|schema\|all` | Default `smoke`. |
| `--fixture <id>` | Repeatable fixture filter for replay. |
| `--base-url <url>` | Override mock/live URL. |
| `--browser cdp\|launch` | Default `cdp` when available. |
| `--cdp-url <url>` | Default `http://127.0.0.1:9222`. |
| `--artifacts <dir>` | Default `$HOME/tmp/ocr-harness/<timestamp>`. |
| `--report <file>` | JSON report path. |
| `--headed` | Show the browser. |
| `--keep-open` | Keep the page open for debugging; never in automation. |
| `--timeout <ms>` | Per-scenario timeout. |
| `--confirm-live-writes` | Required for V2 live saves. |
| `--no-cleanup` | Debug only; refuses with live profile. |

Environment variables:

- `OCR_HARNESS_URL`
- `OCR_HARNESS_USER`
- `OCR_HARNESS_PASS`
- `OCR_HARNESS_CDP`
- `OCR_HARNESS_ARTIFACTS`

Exit codes:

- `0` — all selected scenarios pass and cleanup is confirmed;
- `1` — assertion or scenario failure;
- `2` — setup/config/dependency failure;
- `3` — cleanup failure (row, server, browser, or storage left behind);
- `4` — live guard refused or unsafe option combination.

## 13. Determinism and speed

- Reuse one browser process across mock scenarios; use a fresh context/page per
  scenario.
- Prefer `waitForFunction`/`waitForSelector` over fixed sleeps.
- Freeze test time or IDs only in the mock; do not add test hooks to production
  code.
- Run mock scenarios serially by default; optional parallel jobs only when each
  scenario has isolated state.
- Target: full mock suite under 60 seconds on the current device; live V2 under
  2 minutes excluding site latency.
- Report per-scenario timing so slow paths are visible.

## 14. Security and cleanup

- Credentials come only from environment variables and are never logged.
- Live writes require an explicit confirmation flag.
- Every created row has a unique marker and a cleanup handler.
- Browser context is disposable; cookies are not persisted to a shared profile
  for mock runs.
- No test rows, odd `localStorage`, temporary credentials, or servers remain
  after the run.
- If the harness starts Chromium, it stops only its own process. If it uses an
  existing CDP browser, it logs out and clears OCR keys but does not stop the
  browser.
- Artifacts live outside the repository; `.gitignore` additions are fine but
  the default is `$HOME/tmp`.

## 15. Acceptance criteria

The harness is accepted when:

1. `node tests/browser/run.js --profile mock --suite all` exits 0 from a clean
   checkout and leaves no server, browser, files, or storage state behind.
2. V1 `bank-2021` and `anomaly-block2` assertions pass in mock mode and can be
   replayed in an opt-in live mode.
3. V3 stale-queue, Reset, and re-paste pass.
4. The manual save click path covers success, validation error, ambiguous reply,
   logged-out reply, marker refusal, and duplicate block.
5. The live V2 schema scenario is guarded, creates one row, verifies it, deletes
   it, and exits `3` if cleanup fails.
6. Seeded regressions are caught, not just the happy path. At minimum, the suite
   fails if:
   - `fillForm` stops filling the question text;
   - `tick` fails to set the key radio;
   - Reset leaves `ansKey` or `batchId`;
   - the manual save marker is not set;
   - a duplicate row is not blocked;
   - the bookmarklet injects twice without cleanup.
7. Reports identify the failing scenario and retain sanitized artifacts.
8. No changes to `src/`, the PHP contract, storage key names, or generated
   bookmarklet.
9. `node tests/runner.js`, `node tests/unit.js`, and
   `node tools/extract-bank.js --check` remain green.
10. `tests/browser/README.md` documents setup, commands, profiles, live safety,
    and Termux/Chromium requirements.

## 16. Implementation phases

1. **Foundations:** CLI skeleton, browser adapter, mock server, report/artifact
   writer, smoke scenario.
2. **Replay/V1:** fixture replay, `bank-2021`, `anomaly-block2`, form/tick/flags.
3. **State/V3:** Reset, stale queue, key-only paste, go-to/skip, reload.
4. **Save click path:** success, validation, ambiguous, logged-out, marker,
   duplicate, zero-POST assertions.
5. **Live V2:** guards, credentials, disposable row, edit/list verification,
   cleanup, failure handling.
6. **Optional Auto-Save DOM suite and docs:** hide-pause, uncapped run,
   unverified stop, lock, README, tracker update.

Each phase must leave the default suite runnable and the repository tests green.
No phase may change production parser/UI behavior.

## 17. Open questions for review

1. **Dependency policy:** is an isolated `tests/browser/package.json` allowed, or
   must the harness use only the existing Termux Chromium/CDP setup with no new
   package?
2. **Driver:** Playwright over CDP (with any required Termux shim) versus a
   smaller raw-CDP client. Which is preferred for maintenance?
3. **Mock fidelity:** serve the archived admin HTML as-is with a mock POST
   handler, or build a smaller purpose-made form? The archived page is more
   realistic but heavier.
4. **Live target:** production admin only, or is there a staging clone? This
   determines whether V2 can be automated safely at all.
5. **Live V1:** should V1 run live by default in acceptance, or only on demand?
6. **Auto-Save scope:** should the browser suite cover the full Auto-Save loop
   (uncapped run, unverified stop, hide-pause, lock), or only the manual click
   path, leaving loop behavior to unit + mock scripts?
7. **Fixture coverage:** replay every `questions` fixture by default, or only
   the V1 pair plus a smoke subset?
8. **Parallelism:** is serial execution acceptable, or is per-scenario parallel
   execution required for speed?
9. **Artifacts:** retention policy and whether screenshots/DOM snapshots should
   be attached to failures by default.
10. **Future CI:** no CI exists today. Should the spec leave CI out entirely, or
    define a future headless job that runs only the mock suite?

## 18. Notes from the 2026-10-25 live run

- A one-off CDP run was slow because of interactive selector discovery, retries,
  live-site latency, and model/tool round-trips. The harness removes the
  interactive overhead; it cannot remove live-site latency.
- The unfiltered admin list did not show newly saved rows while a filtered list
  did; the site owner confirmed this is intended list behavior. The mock should
  not model that quirk as a defect.
- Disposable rows used during the live check were deleted and verified absent.
  The harness must provide the same cleanup guarantee automatically.
- The live save confirmed the `questions` INSERT columns, including no
  `practice_title` requirement.
- No credentials remain in the workspace; the harness must keep it that way.

## 19. Relationship to existing docs

- `docs/plan/11-remaining-verification.md` — V1-V3 are the behavior this harness
  should automate; V4 remains optional.
- `AGENTS.md`, `docs/AGENTS.md` — parser/UI constraints and Termux hygiene.
- `docs/BUILD.md` — build checks; the harness runs them in smoke.
- `docs/Auto-Save-Spec.md`, `docs/Active.md` — save-mode and safety contracts.
- `tests/runner.js`, `tests/unit.js` — remain the primary fast suite; browser
  tests complement them.
