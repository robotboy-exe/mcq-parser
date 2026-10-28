# AS-13 — Image plan UI, file selection, and auto-save injection

Status: pending. Depends on: P13 (done; review/commit pending). Blocks: AS-14.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

P13 detects shared stimulus blocks and marks the affected questions, but there
is no way to choose an image or inject it into the save. AS-13 adds the
in-memory image plan UI and the save path.

One image can cover one or more questions. The image plan is per tab and is
never stored. Reload or Reset loses the files; the user re-selects them. The
queue still carries only parser metadata (`needsImage`, `stimuli`), so a stale
queue cannot pretend an image is still attached.

No PHP, database, server contract, `ocr_helper.js`, or localStorage key change.
The native `question_image` input keeps its existing manual behavior.

## Preconditions

- P13 is done, light verification passed, and committed.
- `applyStimulusFlags` runs on load after the parser result is queued, so
  `stimuli`/`needsImage` are present in the UI queue.
- The live form has `enctype="multipart/form-data"` and `question_image`
  (`archive/live-sources/admin_questions.html:614-624`).
- `saveCurrentQuestion` builds `FormData(form)` and posts with a 30-second
  abort signal (`src/ui/ui.js:633`, `:647`).
- `tests/ui-harness.js` has a deterministic DOM/storage/fetch shim; its
  `FormDataMock.set` currently stringifies every value and must preserve File
  objects.

## Work

1. **Queue integration.**
   - After parsing and before writing `ocrQueue`, call
     `parser.applyStimulusFlags(items)`.
   - Keep the additive fields on the queue: `stimuli` and `needsImage`.
   - Do not change the `ocrQueue` key name or the shape of existing fields.
   - On load, read `imagePlan` as an empty array; never restore files from
     storage.
2. **Image plan panel.**
   - Show it only when the current queue has at least one detected stimulus or
     at least one `needsImage` question.
   - For each detected stimulus in order, show:
     - `Image block N (after Q13)` using `order` and `sourceNum`;
     - a range input prefilled with `nums` as comma-separated numbers or a
       compact range;
     - a `Choose image` file input accepting `image/*`;
     - the selected file name and size;
     - `Attach` / `Replace` and `Remove`;
     - a status line: `No image`, `Ready`, `Range not in this paste`, or
       `Question Q14 needs this image`.
   - Provide a bulk `Use ranges in order` action that assigns the next chosen
     files to the detected stimuli in order.
   - Provide a generic `Add image` row only when the queue has `needsImage`
     questions that no detected stimulus covers. It takes a range and one file.
   - A plan row is `{stimulusId, nums, file, name}`. The generic row uses
     `stimulusId: null`. Do not serialize the File.
3. **Validation.**
   - A plan row is ready only when it has a File, a non-empty name, and at least
     one positive integer range.
   - Reject a range outside the queue before Start; show the same detail as
     `stimulus-range`.
   - A detected stimulus must have a plan row; a generic row does not satisfy a
     detected stimulus.
   - A `needsImage` question is covered when any ready plan row contains its
     number. If not, show `Question Qn needs an image.`
   - Start stays disabled while any detected block is unassigned, any range is
     outside the paste, or the current question is not covered.
   - `Reset Queue`, `Full Load`, and a new questions paste clear the image plan
     and stop a dry/live run. A key-only Load keeps the queue and therefore the
     image plan.
   - A reload shows the detected blocks with `No image`; it must not claim a
     file survived.
4. **Save injection.**
   - In `saveCurrentQuestion({auto, active})`, before `fetch`, find the first
     ready plan row whose `nums` contains `queue.items[queue.i].num`.
   - If found, `fd.set('question_image', file, file.name)`.
   - Do not overwrite a native file already present in the form; the existing
     `file-attached` blocker still stops auto-save in that case.
   - Use a 60-second `AbortController` timeout when an image is attached;
     keep 30 seconds otherwise.
   - The manual path is unchanged. A native manual image selection still posts
     as it does today.
   - After a verified save, clear the plan row that was used only when no later
     `needsImage` question still needs it. The next question's gate decides.
   - Never store the file, its name, or a plan marker in `ocrQueue`,
     `ocrSavedLog`, or `ocrBatchHistory`.
5. **Status and saved log.**
   - Live/dry status may say `image attached` for a planned row, but must not
     include the file name in copy text.
   - The saved log stays `{num, id, at, batchId, inactive, mode, fp?}`; no file
     field.
   - The saved list may say `image` only when the save used a plan row; do not
     add a new storage shape.
6. **Tests.**
   - Extend `tests/ui-harness.js` so `FormDataMock.set` preserves a File-like
     value and records `name`/`size`/`type`.
   - Unit-test: plan row validation; range coverage; detected-vs-generic
     coverage; Start disabled states; plan cleared on Reset/Full Load; key-only
     Load keeps it; reload shows no file; `FormData` contains the File only on
     the covered question; 60-second timeout selection.
   - Add no browser test suite; the existing shim is the only automated UI
     harness.
7. **Build.**
   - Rebuild `src/bookmarklet.js` with `node src/build/build.js`.
   - Assert one line, body parses with `node --check`, no `%`, no inline `//`.
   - Do not rebuild or rely on `src/bookmarklet.min.js`.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 43 PASS, 0 FAIL |
| `node tests/unit.js` | new image-plan tests PASS; all prior tests PASS |
| Detected block UI | Ordered rows with range and file input; Start disabled until every block is ready |
| Generic row | Appears only for uncovered `needsImage` questions; does not satisfy a detected block |
| Range outside paste | Visible error; Start disabled |
| Reload | Blocks reappear as `No image`; no file name survives |
| Reset/Full Load | Plan cleared and run stopped |
| Key-only Load | Queue and plan remain |
| Covered save | POST `FormData` includes `question_image` as a File with the selected name |
| Uncovered question | Gate blocks with `Question Qn needs an image.` |
| Timeout | 60 seconds with an image; 30 seconds without |
| Build | `src/bookmarklet.js` one line, no `%`, body parses |

Browser smoke on the admin page (no browser test suite exists):

1. Paste the Q12–Q17 block; the image plan shows one block after Q13 with range
   14,15.
2. Attach a small image; Start becomes available after the other gate checks.
3. Dry run reports the image is attached and posts nothing.
4. Live save Q13 without the image, then Q14 with it; inspect the edit page for
   Q14.
5. Reload: the block returns as `No image`; Start is blocked.
6. Reset: the plan disappears.
7. Key-only Load: the plan remains.

## Guardrails

- Do not add a localStorage key; the plan is in-memory.
- Do not change the PHP, upload field name, form encoding, CSRF, PRG flow, or
  success flash.
- Do not overwrite a native `question_image` file.
- Do not inject an image into a question whose range does not include it.
- Do not use `innerHTML` for file names or server text; use `textContent`.
- Do not add a new saved-log or batch-history field for the file.
- Do not make Start available while a detected block is unassigned.
- Live-created rows need a unique marker and an exact ID manifest; cleanup is
  owner-only under `docs/LIVE-SAFETY.md`.
- A required live delete or cleanup is a stop-and-ask condition.

## Handoff note (append when done)

```text
Date:
Result:
Files:
Hashes (SHA-256):
```
