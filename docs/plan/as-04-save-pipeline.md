# AS-04 — One save pipeline

Status: done (code 2026-10-25; live smoke passed in AS-06). Depends on: AS-03. Blocks: AS-05.

## Self-contained context

The current manual submit handler posts the form, matches the success text, and
advances the queue. Auto-save needs the same save to be callable from a loop,
with a crash marker, an ID guard, and a definite/ambiguous classification. The
manual path must keep working.

There is no server change. The archived PHP confirms the PRG flow and the exact
success text.

## Goal

Refactor manual save and auto-save onto one `saveCurrentQuestion({auto})`.
Classify responses before changing any state. Write `ocrSaving` before the
request and clear it only on a definite result. Append only verified saves to
`ocrSavedLog`.

## Steps

1. **Pure classifier.** Add
   `classifySaveResponse({redirected, text, errorText, lastId})` to
   `src/parser/parser.js` and export it. Return:
   - `{kind:'rejected', reason:'expired'|'validation', message}` when the page
     contains `Administrator Login`, or when it has `.admin-error` and
     `redirected` is false;
   - `{kind:'saved', id}` when redirected, no error text, the success regex
     matches, and `id > lastId`;
   - `{kind:'ambiguous', message}` for everything else, including a stale ID, a
     redirected page with no success text, a timeout, and a network error.
   `lastId` comes from `maxSavedId(ocrSavedLog)`.
2. **Save function.** Add `saveCurrentQuestion({auto})` inside
   `runOCRBookmarklet`:
   - if a save is already in progress, refuse;
   - set the in-memory guard and write `ocrSaving = {num, at}`;
   - ensure manual `is_active` is ticked; auto deletes `is_active` from the
     `FormData` and sets `autosave=1`;
   - POST `FormData(form)` to `location.pathname` with
     `credentials:'same-origin'` and a 30-second `AbortController`;
   - parse `.admin-error` with `DOMParser`;
   - call `classifySaveResponse`.
3. **Rejected or expired.** Clear `ocrSaving`, show the server text or the
   logged-out message, return `rejected`.
4. **Ambiguous.** Keep `ocrSaving`, show
   `Unknown. It may have saved. Check the list.`, never retry, return
   `ambiguous`.
5. **Saved, in this order:**
   1. auto only: GET `?edit=<id>`, read the `is_active` checkbox (`input[name=is_active]`; the live page has no id). `true` means
      saved active; `false` means verified inactive; `null` means unverified.
   2. append `{num, id, at, batchId}` to `ocrSavedLog`, capped at 200.
   3. advance `queue.i` directly (no `button.click()`), save the queue.
   4. clear `ocrSaving`.
   5. clear `question_image`, `answer_video`, `answer_explanation`.
   6. store `ocrMeta`, call `showOCR(auto)`, then `tick()` or `form.reset()` at
      the end of the queue.
   7. message: `Saved as question #N` plus `(inactive)` only when verified, or
      a red `SAVED AS ACTIVE` warning when the checkbox is checked.
   If the saved question came back active, still log and advance it so it is not
   re-saved; signal the loop to stop.
6. **Manual handler.** Replace the submit body with a call to
   `saveCurrentQuestion({auto:false})`. Keep the capture-phase preventDefault,
   `#ans_res`, button disabling, and today's messages. If auto is running and no
   save is in progress, stop the run first.
7. **Form fill.** `fillForm(q, auto)` ticks `is_active` only when manual;
   `showOCR(auto)` passes the mode through. Remove the unconditional forced-on
   lines.
8. **Tests.** Add classifier cases: saved, newer ID, stale ID, redirected
   without success, non-redirected error, error plus stale success, logged-out,
   empty body. Add log cap/monotonic tests. Add a manual-save checklist.

## Acceptance

| Command | Expected |
|---|---|
| `node tests/runner.js` | 25 PASS, 0 FAIL, 0 PENDING; exit 0 |
| `node tests/unit.js` | exit 0; classifier and log cases pass |
| `node src/build/build.js && wc -l src/bookmarklet.js` | build succeeds; `1` |
| `node -e "const fs=require('fs');new Function(fs.readFileSync('src/bookmarklet.js','utf8').replace(/^javascript:/,''))"` | exits 0 |
| `rg -n '%' src/bookmarklet.js` | no matches |

Manual checklist (browser, add page, no auto started):

- Saving an ordinary question still shows `Saved as question #N` and advances.
- A blank option shows the server error, not a success.
- The success/error container stays after the submit button.

## Guardrails

- Do not add a server endpoint, change field names, or change the success text.
- Do not use `button.click()` or `requestSubmit()` to advance.
- Do not clear `ocrSaving` on an ambiguous result.
- Do not write `ocrSavedLog` before the save is verified.
- Do not verify inactivity on the manual path.

## Handoff note (append when done)

```text
Date: 2026-10-25
Result: runner 25 PASS / 0 FAIL / 0 PENDING; unit 31 PASS / 0 FAIL
Files: src/parser/parser.js (SAVE_SUCCESS, classifySaveResponse),
  src/ui/ui.js (saveCurrentQuestion, verifyInactive, marker/log,
  manual handler), tests/unit.js.
Checks: build OK; one line; no `%`; syntax OK; 8 classifier cases pass.
Manual save smoke: passed in AS-06 (manual save #1520; auto saves #1516-#1519
were inactive in the live list). Open question: the live edit page's exact
is_active selector was not separately reported; the code accepts input[name=
is_active] or #is_active and falls back to "Could not verify inactive".
```
