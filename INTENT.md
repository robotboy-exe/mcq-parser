# Owner Tool Build Intent

Approved: 2026-10-31.

Scope amended: 2026-11-05. Shared-context candidate delivery targets `cbt.php`
only. `cbt_practice.php` and `practice_title` are outside the remaining
owner-tool cycle scope and retain their existing behavior unchanged.

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
- Show an open, collapsible context card above every linked candidate question
  in `cbt.php`.
- Do not add shared-context behavior to `cbt_practice.php` or change
  `practice_title` in this cycle.
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
- This cycle is externalize-first. From the recorded package base, each existing
  production file may receive at most 100 added lines by `git diff --numstat`,
  and each new production module may contain at most 250 readable lines. Any
  excess requires explicit owner approval at Gate 1 naming the exact file,
  measured excess, and justification.
- Put cohesive new behavior in focused modules/includes with one clear
  responsibility and an explicit deployment path. Existing entry points retain
  only imports/includes, dispatch, narrow wiring, and unavoidable local
  transaction hooks.
- Acceptance evidence must execute the real production modules and paths.
  Copied SQL, copied control flow, or reimplemented behavior is not executable
  production-path evidence.
- The coordinator's externalize-first contract owns Gate 1, handoff, review,
  anti-gaming, and excluded-artifact reporting for this intent.
- Every review finding has a finite closure contract: the exact defect,
  supported operating preconditions, closure criteria, required evidence, and
  explicit non-goals or deferred checks. Once the owner authorizes a fix, that
  contract is frozen unless the owner explicitly changes the requirement.
- Original reviews may explore broadly. Re-reviews verify the named frozen
  closure contracts and regressions; they do not broaden an existing finding
  ID. A newly discovered defect receives a new ID and proportional severity.
- An unresolved blocker requires an explicit owner disposition: fix, reject
  with rationale, accept the risk, defer it to a named package, or change the
  requirement. A re-review that discovers a new blocker does not automatically
  start another fix loop.
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
