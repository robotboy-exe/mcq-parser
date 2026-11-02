# OT03 — Owner Tool Replacement

- **Status:** blocked
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
