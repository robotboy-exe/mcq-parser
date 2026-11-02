# OT03 — Owner Tool Replacement

- **Status:** done
- **Depends on:** OT02
- **Blocks:** OT04, OT07-OT09
- **External gate:** current production `ocr_helper.js`
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Replace the deployed helper with a readable, automatically loaded owner tool
that parses one box, fills the native question form, and advances only through
human-reviewed native PRG saves.

## Required behavior

- Run automatically on the Add Question page; importer controls stay off edit
  pages unless a later package explicitly enables a formatting-only control.
- Parse questions and answer key from one textarea.
- Infer and retain subject/category/year metadata where clean parser evidence
  supports it.
- Fill editable `question_text`, A-D options, and correct-answer radio.
- Support Show Paste, Skip, Reset, key-only replacement, and queue status.
- Leave question image, explanation, video, active checkbox, and manual fields
  under administrator control.

## State contract

Use one new versioned key, provisionally `cbtOwnerTool:v1`, containing:

```text
version, parserVersion, queueId, metadata, contexts, items,
answerKey, currentIndex, pendingSubmission
```

Legacy keys are detected and explained, but never trusted, migrated, or deleted
without an explicit owner action.

## Native PRG lifecycle

1. Before native submit, require an active queue item and verify the form still
   represents that item after administrator edits are accepted.
2. Store a pending marker with queue ID, item index, and a stable submission
   fingerprint.
3. Let the browser perform the native form submit and redirect.
4. On reload, advance exactly once only when the exact success flash is present
   and the pending marker matches.
5. On `.admin-error`, keep the same item and clear only the in-flight state.
6. On ambiguous reload, keep the item and show a review warning; never retry or
   advance automatically.

## Work

1. Archive and compare the current production helper with the historical copy.
2. Define readable controller/parser/style asset boundaries and stable DOM IDs.
3. Implement the versioned state store and stale-parser refusal.
4. Implement paste, queue, form-fill, key ticking, Skip, Reset, and metadata
   persistence.
5. Implement the native PRG pending state machine.
6. Replace the admin page helper include with the readable production assets;
   no bookmarklet injection/removal logic remains.
7. Adapt the deterministic DOM/storage harness to test the real production
   controller.
8. Update current docs from bookmarklet terminology to owner-tool terminology.

## Acceptance

| Check | Expected |
|---|---|
| Full paste | Questions and key load; first item fills native fields |
| Human edit | Administrator changes remain in the submitted native form |
| Native success | Exact success flash advances once after reload |
| Validation failure | Current item remains and server error is visible |
| Ambiguous reload | No advance, retry, or false success |
| Key-only paste | Queue retained; key replaced and current radio refreshed |
| Skip/Reset | Explicit and deterministic; no stale pending marker |
| Legacy state | Warning shown; no automatic import/deletion |
| Edit page | No duplicate importer UI or queue mutation |
| Excluded behavior | No Auto-Save, dry run, duplicate scan, history, image plan, or fetch save |
| Production assets | Readable, unminified, and directly testable |

## Guardrails

- Do not intercept Save with `fetch`.
- Do not use or mutate legacy OCR storage keys.
- Do not auto-select or force the active checkbox.
- Do not advance on generic success/error DOM absence.
- Do not include experiments Auto-Save code under disabled flags.
- Do not start OT04.

## Handoff template

```text
Date:
Result:
Production helper comparison:
Asset/module paths:
State schema/parser version:
PRG tests:
Legacy-state behavior:
Files changed:
Hashes:
Open questions:
Review: pending light verification at OT04 Gate 1
Commit: deferred
Next: OT04 blocked/not started
```

## Handoff

```text
Date: 2026-11-01
Result: PASS (Node/DOM evidence); PHP runtime check unavailable
Production helper comparison:
  - Archived current production helper -> archive/live-sources/ocr_helper-2026-11-01.js
    (123 lines, 5085 bytes, SHA-256 f51a643685b6ccbb8ccd674ba182d299992fc6fb25a0cd0e4fc6339eff4e0e49)
  - Compared with archive/live-sources/ocr_helper_deployed.js (121 lines, 325c387c...)
    and archive/live-sources/ocr_helper.js (121 lines, 3d8ce55e...).
  - Two parser hunks differ: the splitQuestions lookahead accepts quoted or
    parenthesised initials and '..' leaders; the head-chunk guard excludes
    IMPROVISED/STRUCTURED C.R.K headers. FIXES, OPTION, fillForm, storage keys,
    and the save detector are unchanged.
  - Replaced weakness: the old helper advanced on the ocrSubmitted flag plus the
    absence of .admin-error, so a plain reload could skip an item. The owner tool
    requires the exact success flash and a matching pending marker.
Asset/module paths:
  - src/owner-tool/controller.js (readable production controller)
  - src/owner-tool/state.js (versioned state store)
  - src/owner-tool/style.css
  - deployed/admin_questions.php loads src/parser/core.js, src/owner-tool/state.js,
    src/owner-tool/controller.js, and src/owner-tool/style.css. Only the include
    region changed; no PHP logic was touched and ocr_helper.js is retained as
    historical evidence.
State schema/parser version:
  - Key cbtOwnerTool:v1, state version 1, parserVersion 2.0.0.
  - Shape: version, parserVersion, queueId, metadata, contexts, items, answerKey,
    currentIndex, pendingSubmission.
  - A stale parserVersion refuses to load stored items and preserves the stored value.
  - Legacy keys (ocrQueue, ocrMeta, ansKey) are detected and named only; never read,
    imported, or deleted.
PRG tests:
  - Exact flash "Question saved successfully (Question ID: N)." advances once; a
    second reload does not advance.
  - A near-miss flash (update wording) does not advance.
  - .admin-error keeps the same item and clears only the in-flight marker.
  - An ambiguous reload keeps the item, warns, and never retries.
Legacy-state behavior:
  - The warning names the keys present, states they were not imported, and leaves
    every legacy value in place.
Files changed:
  - src/owner-tool/controller.js (new)
  - src/owner-tool/state.js (new)
  - src/owner-tool/style.css (new)
  - tests/owner-tool.js (new)
  - archive/live-sources/ocr_helper-2026-11-01.js (new snapshot)
  - deployed/admin_questions.php (include region only)
  - docs/STATUS.md, docs/plan/README.md, docs/plan/prompts/phase-map.md, this file
  - README.md, AGENTS.md, docs/AGENTS.md (owner-tool terminology and commands)
Hashes:
  - src/owner-tool/state.js       add775356b5f2dc581586848c82a0f892753e62942e4586755eed247cdd65ebd
  - src/owner-tool/controller.js  9cf830e4efa216e1ce28c5abd0bca1c71eb8ba8fdd412b5d0502886ca8772f72
  - src/owner-tool/style.css      a3c8cfe792b21cd7976095dfd774764ad76f4e3202ff531cfe7acd34e8c8166f
  - tests/owner-tool.js           dee3c9abd3695131657cba40ef66c17b49e1b8077d59a45ee86ceeab07edf2c6
  - deployed/admin_questions.php  59ac0f299ff05446fb0bab43f2ce4d77bb1ae1349a919a02b725490d9d85e282
Verification:
  - node tests/runner.js -> 47 fixtures, 45 PASS, 0 FAIL, 2 PENDING
  - node tests/unit.js -> 140 PASS, 0 FAIL
  - node tests/owner-tool.js -> 16 PASS, 0 FAIL
  - node tools/extract-bank.js --check -> 7 slices OK
  - node --check on state.js and controller.js -> OK
Open questions:
  - The include uses paths that mirror this repository (src/...). If the server
    document root does not mirror the repo, those four asset paths need adjusting
    at deploy time. No PHP runtime is available here, so the page was not loaded.
Review: light verification completed at OT04 Gate 1 (2026-11-01, no BLOCK findings);
  rigorous Release A review still pending
Commit: authorized by user on 2026-11-01 (phase 4 committed on request)
Next: OT04 blocked: answer_details.php
```

## Post-handoff rescope

On 2026-11-01 the owner deferred unavailable `answer_details.php` integration
to OT10. The historical handoff above is unchanged; OT04 is now ready and has
no external start gate.
