# AS-13 — Image plan UI, file selection, and auto-save injection

Status: done (2026-10-28). Depends on: P13 (done, light-verified, committed).
Blocks: AS-14.

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
Date: 2026-10-28
Result: done. The image plan is in-memory only and shows one ordered row per
detected stimulus, with range, file, Attach/Replace, Remove, and status. A
generic row appears only for uncovered needsImage questions. Start stays
disabled for an unassigned block, an out-of-paste range, or an uncovered
question; Reset/Full Load clear the plan, and a key-only Load keeps it. Save
injection sets question_image from the first ready row covering the current
question, never overwrites a native file, and uses a 60-second timeout with an
image (30 otherwise). The save log and batch history keep their existing shape.
Runner 43 PASS; unit 140 PASS; bookmarklet rebuilt (one line, body parses, no
%, no inline //).
Live smoke (admin page, draft approval): pasted Q12-Q17; block after Q13 showed
range 14-15, No image, Start disabled. Attached a 68-byte PNG (SHA-256
e25ee002218606bc42b55e38c01ece666dec1518c891550398483cb8aecc199e), status
Ready, Start enabled. Dry run reported 2 with image attached and made 0 POSTs.
Reload showed No image with Start disabled; Reset hid the panel; key-only Load
kept the ready plan.
Live draft batch (marker OCR-AS13-TEST-2026-10-28, CRS / JAMB / UTME / 2024,
batch 322acb87-ee89-4ed5-a055-5f79f2a6683c; 3 POSTs): #4142 Q13 no image,
#4143 Q14 image, #4144 Q15 image. Edit pages confirm all three are inactive,
year 2024, CRS / JAMB / UTME; #4143 and #4144 show the uploaded image; the
ticked keys are 13:D, 14:A, 15:B. Rows were
left for the owner; cleanup is owner-only. Exact manifest:
$HOME/tmp/as13-live-manifest-2026-10-28.json.
Observation: after the batch, the form reset, so the completion banner's meta
label displayed placeholders/2026 even though the saved rows are 2024; direct
edit pages and saved-log fingerprints are authoritative. Not changed here.
Files: src/ui/ui.js; src/bookmarklet.js (rebuilt); tests/ui-harness.js;
tests/unit.js; docs/plan/as-13-image-plan-ui.md; docs/plan/README.md;
docs/plan/history.md.
Hashes (SHA-256): src/ui/ui.js
  1e1f80077c744b753decd2baad8d34e9dde2cee6886e1eef04e96c0645caabba;
  src/bookmarklet.js
  8b5393e45f079aaec55f4b9aab9b98570db69c54e11244f0cc436f2cc827e2fa;
  tests/ui-harness.js
  af74b69163de0a865adfaea5cfa0524bb7f03c5bcbcbb19a72ad740806596886;
  tests/unit.js
  53d2327129570d78bc01de8eaf736d8de12e11ee8f65187ce896343eb8dfee78.
Review: light-verified (2026-10-28) at phase 3 Gate 1; probes, hashes, build,
  tests, live manifest, and guardrails checked. No independent review record.
Commit: deferred to phase 3 start.
```
