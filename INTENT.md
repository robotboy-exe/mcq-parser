# Build Intent — Post-AS Follow-up (D-54–D-60)

This is the user's intent for P11, P12, AS-10, AS-11, AS-12, P13, AS-13, and
AS-14. It is the tie-breaker for the prose in `docs/plan/`. The package
documents own the implementation details; if a package choice conflicts with
this file, ask before changing the behavior.

Implementation choices such as DOM IDs, exact array shapes, wait timing, and
specific CSS values are not part of the intent. They may change if the behavior
below is preserved.

## Process intent

- Use the existing `docs/plan/` method: one self-contained package per build,
  starting with preconditions and ending with tests, acceptance, and a handoff.
- P0 was a one-off inbox cleanup, not a track. It was done first.
- Rebuild only `src/bookmarklet.js`. Do not rebuild `src/bookmarklet.min.js`
  unless the user explicitly asks for the minified release artifact.
- Do not commit unless the user explicitly asks.
- Preserve existing parser and Auto-Save behavior and storage contracts, except
  for the additive changes named below.

## Build intent

### 1. Exam-category period acronyms — D-54 / P11

Headers such as `S.S.C.E.`, `W.A.S.S.C.E.`, `W.A.E.C.`, `N.E.C.O.`, `G.C.E.`,
`J.A.M.B.`, and `U.T.M.E.` must infer the same category as their bare forms.
Do not invent a new SSCE/WASSCE category: the live list has one
`WASCE / NECO / GCE` option. This is category inference only; leave the header
text and subject inference alone.

### 2. Option boundaries and duplicate labels — D-55 / P12

A question has one real ordered A–D option set. Initials inside names or option
text (`C. E. F. Small`, `A. Adebayo`) are text, not option boundaries. Keep
those initials in the option text.

A second full A–D set is a merged-paste warning only when there is no visible
question-number boundary before it. If a question number is visibly there, do
not warn and do not split inline. There must be no inline question splitting.
Preserve Q46 and the existing missing-dot, slash-label, dotted-abbreviation,
and E/F behavior.

### 3. Prior-batch duplicates — D-56 / AS-10

After Reset and re-paste, the same subject, category, year, and normalized
question text must stop instead of being saved again. Use the retained saved
log. Do not add a new storage key, a server lookup, a hash, or an intra-batch
check.

Dry run and Start must agree. Stop and show the saved question ID, year, and
category; do not skip silently. Legacy entries must not cause false stops; do
not backfill them. Do not add an override. Write the fingerprint only on a
verified save, for both manual and auto saves, and describe what was actually
posted. Keep the current-batch number check and the 20-row table check.

### 4. Batch history — D-57 / AS-11

Keep the last 15 batches, one line each, for example:

```text
27 Oct 14:05 · CRS / JAMB / UTME / 2021 · 8 saved (#1785–#1792) · active
```

Add the `ocrBatchHistory` key. It survives Reset Queue, has no per-question
detail, and a history write failure must never block or change a save result.

### 5. Auto dry run and separate status — D-58 / AS-12

After a question Load, and after a key-only Load when a queue exists, run the
dry run automatically. Dry run is teal; live auto-save uses gray for idle, blue
for running, amber for stopping/stopped/paused/incomplete, green for complete,
and red for blocked/needs-check.

Dry and live have separate panels, state, progress, and blockers. Missing
metadata or a missing key still runs the dry run and stops amber; dry run writes
nothing. Dry and live are mutually exclusive, and dry must not clear live
status. A dry result becomes `STALE` when metadata, key, mode, or queue changes.

For live runs, completion beats Stop. Stopped, paused, and incomplete states
stay visible. Reloading mid-batch shows `INCOMPLETE — queue resumed at X of N`;
a finished batch shows complete; do not auto-resume.

### 6. Shared stimulus images — D-59/D-60 / P13–AS-14

A table between questions belongs to the later questions, not the previous
question's Option D. Detect the standard intro plus table, remove it from the
preceding question, and attach ordered stimulus metadata. A manual `[image]` or
`[[image]]` marker with an optional range is the fallback because OCR placement
is unreliable. `[missing text]` is not an image marker.

The uploader assigns one image to one or more questions. The image plan is
in-memory, never stored; reload requires re-selecting files. A detected block
must have a file and a range, a range must be in the paste, and the current
question must be covered. Save the first covering file as `question_image` with
a 60-second timeout. No PHP, database, server-contract, or localStorage-key
change.

## Guardrails

- No inline question splitting.
- No duplicate override.
- No changes to existing storage key shapes; only the additive keys named here
  and the additive `ocrQueue` fields `stimuli`/`needsImage` (D-59/D-60).
- No minified rebuild unless asked.
- No commit unless asked.
- If package prose conflicts with this file, stop and ask before changing
  behavior.
