# AS-14 — Stimulus image docs, live acceptance, and close

Status: pending. Depends on: AS-13 (pending). Blocks: none.

Intent: [INTENT.md](../../INTENT.md) is the behavior tie-breaker.

## Source and scope

AS-13 adds the image plan UI and save injection. AS-14 makes the behavior
documented and verified on the real admin page, without weakening the live
safety rules.

This package is docs, build verification, and a controlled live check. It does
not add parser/UI features unless a review finding requires a fix. It does not
delete live records.

## Preconditions

- P13 and AS-13 are done, reviewed, and committed.
- Runner is 43 PASS and unit is 126+ PASS; `src/bookmarklet.js` is rebuilt.
- The owner has approved a live test with exact question numbers and image
  files. A package acceptance row does not authorize a destructive live write.
- The live test uses a staging copy or a verified backup before any destructive
  step. There is no staging copy, so the test is additive only.

## Work

1. **Docs.**
   - `docs/Auto-Save-Spec.md`: verify the non-goal now allows one shared image
     per range while video and other media remain out of scope; verify the
     in-memory image plan, detected-block rows, generic row, coverage,
     reload/reset/key-only behavior, 60-second timeout, and `FormData`
     injection.
   - `docs/DECISIONS.md`: keep D-59/D-60 current; add a live-verification note.
   - `docs/SPEC.md`: keep the Stage 3b stimulus rules; add the image-plan and
     save-injection behavior to §7.
   - `docs/INVARIANTS.md`: verify the no-file-persistence, detected-block
     coverage, generic-row scope, and save-injection invariants; verify
     INV-52.
   - `docs/EDGE_CASES.md`: keep EC-87/88/89 current and add the live result.
   - `docs/AGENTS.md`: update the gate and dangerous-area rows.
   - `docs/plan/README.md`, `docs/plan/history.md`, and the cycle map: final
     statuses, checkpoints, and handoff.
   - `docs/STATUS.md`: current test counts and feature state.
2. **Build and static checks.**
   - `node src/build/build.js`.
   - `wc -l src/bookmarklet.js` prints `1`.
   - Strip `javascript:` and run `node --check`.
   - Assert no `%` and no inline `//`.
   - Confirm `src/bookmarklet.min.js` was not rebuilt or relied on.
3. **Live acceptance (additive, owner-watched).**
   - Use a unique marker in the test questions.
   - Load a small batch from the Q12–Q17 block with the image plan.
   - Dry run: no POST, no row, image attached.
   - Live save Q13 without an image and Q14/Q15 with the shared image.
   - Inspect each edit page: Q13 has no image; Q14/Q15 show the same image.
   - Reload: the plan is `No image` and Start is blocked.
   - Record the exact saved IDs and the image file names in a local manifest.
   - Leave the rows for the owner. Do not delete them.
4. **Close.**
   - Update the P13/AS-13/AS-14 status rows and handoff notes.
   - Record the live result and any accepted finding.
   - Commit only at the phase boundary per the plan rules.
   - Archive the cycle only after the user confirms.

## Acceptance

| Check | Expected |
|---|---|
| `node tests/runner.js` | 43 PASS, 0 FAIL |
| `node tests/unit.js` | all PASS; image-plan tests included |
| Build | one line, body parses, no `%`, no inline `//` |
| Dry run | no POST, no row, image attached |
| Q13 save | no image on the edit page |
| Q14/Q15 saves | shared image present on both edit pages |
| Reload | `No image`; Start blocked |
| Saved log | no file field or file name |
| Live rows | exact IDs recorded; left for the owner |
| Docs | Auto-Save-Spec, SPEC, INVARIANTS, EDGE_CASES, AGENTS, STATUS agree |

## Guardrails

- Do not delete live questions, media, or users. Cleanup is owner-only.
- Do not use a first-match delete selector or `.submit()`/`.requestSubmit()`.
- Do not run a live test without a staging copy or verified backup if the test
  would be destructive.
- Do not add a file field to `ocrSavedLog` or `ocrBatchHistory`.
- Do not claim a browser test suite; the shim is not a browser test.
- Do not rebuild `src/bookmarklet.min.js`.
- Do not mark the cycle complete or archive it without user confirmation.

## Handoff note (append when done)

```text
Date:
Result:
Live IDs:
Files:
Hashes (SHA-256):
```
