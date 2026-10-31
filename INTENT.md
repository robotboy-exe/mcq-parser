# Owner Tool Build Intent

Approved: 2026-10-31.

This file is the behavior tie-breaker for the `owner-tool-2026-11` cycle. The
package files own implementation detail. If a package conflicts with this file,
stop and ask instead of silently changing the product direction.

## Product intent

- Replace the deployed `ocr_helper.js` with a readable owner tool loaded by
  `admin_questions.php`; the shipping tool is not a bookmarklet.
- Keep one paste box for questions, shared contexts, and an answer key.
- Fill the native PHP form one question at a time so the administrator can edit
  every parsed value before saving.
- Use the existing native form submit and Post/Redirect/Get flow. Advance the
  queue only after the exact success flash appears after reload.
- Keep saving manual. Do not ship Auto-Save, dry run, duplicate scanning, batch
  history, automatic image injection, or the experiments image-plan UI.
- Use readable shared source files without a minified production artifact.
- Use fresh, versioned browser state. Detect legacy OCR state, but do not trust,
  migrate, or delete it automatically.

## Formatting intent

- Underlining applies to question stems and shared contexts in the first
  release. Options and answer explanations remain plain text.
- Store exact `<u>` and `</u>` markers. Escape all content and restore only
  those exact tags when rendering; arbitrary HTML and attributes remain text.
- Preserve manually entered line breaks exactly.
- For OCR, fold single wrapped lines into spaces and retain blank-line paragraph
  breaks. The administrator can edit the resulting textarea before saving.
- Infer exam years from 1900 through 2099.
- Defer the proposed large math-symbol palette.

## Shared-context intent

- Persist shared contexts as first-class records linked to ordinary four-option
  question records.
- Support comprehension passages and cloze/gap-fill passages.
- Support one context, several contexts, standalone questions, or any mixture
  in one paste for one exam year.
- Keep context creation, question linking, and context activation explicit
  human actions.
- Keep an incomplete context unavailable to candidates.
- Randomize standalone questions and complete context groups as units. Never
  split or scatter a selected group; retain member order inside the group.
- Show the same open, collapsible context card above every linked candidate
  question in both `cbt.php` and `cbt_practice.php`.
- Highlight the active cloze slot using a safe token such as `[[gap:71]]`.
- Text contexts are the initial scope; shared-context media is deferred.

## Parser intent

- The clean experiments commit `d5a62f0` is the parser/test evidence base.
- The uncommitted P20-P22 experiments cycle is reviewed as blocked and must not
  be imported. Leave that worktree untouched.
- Uppercase `A)` is already supported and must receive a regression fixture.
- Add wrapped lowercase `(a)`-`(d)` only through a guarded complete-sequence
  rule for evidenced context questions; do not broaden lowercase labels
  globally.
- Add comprehension and cloze parsing through a pure outer `parsePaste()`
  orchestration layer. Preserve strict legacy parsing when no context family is
  confidently recognized.
- Ambiguous context or table layouts warn and fall back rather than guessing.
- Expected fixture values come from the supplied source, never parser output.

## Process intent

- Import the experiments work-package methodology: one package per session,
  read-only Gate 1, explicit `go`, acceptance evidence, status update, handoff,
  independent reviews at release boundaries, and cycle close.
- Do not commit unless the user explicitly asks.
- Do not edit archived source snapshots.
- New decisions begin at D-66; D-61 through D-65 remain reserved for the
  shelved experiments work and must not be reused.
- Product PHP verification begins on the user's local PHP machine before
  staging. Production cleanup and destructive live tests are owner-only.

## Integration intent

- Preserve both existing worktrees exactly as found during OT00 Gate 1.
- Create the integration line from clean `d5a62f0` and join it with `main`.
- Prefer the clean experiments parser, tests, and planning method on overlap;
  preserve main's approved underline/context plans and newly supplied live
  sources.
- The legacy bookmarklet may remain as historical evidence, but it is not a
  production deliverable and must not drive new owner-tool architecture.
