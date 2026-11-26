# Scratch Session — Stimulus-First Parser Convergence

Argument: `$ARGUMENTS` — optional owner-confirmed working stimulus commit.

Use this prompt to bring the working branch into the current cycle as
[PC07 — Stimulus-First Convergence](../parser-convergence/pc-07-stimulus-first.md),
a proposed successor to unfinished PC04–PC06. Start on scratch now from the
last settled cycle tip. The owner's working stimulus bookmarklet is the feature
baseline; the convergence line is the shared parser and deployed helper baseline.
The target is the deployed manual helper and **one** supported bookmarklet with
the working stimulus, image-save, key, and autosave workflows. The key-only
bookmarklet remains a comparison and rollback reference until the replacement
is proven. This is one implementation session on the owner's VM. A separate
review session checks what the implementer actually delivered.

**OCR contract:** The extractor cannot reliably put a range inside an image
marker. A plain `[image]` or `[[image]]` beside a supported ranged intro must
infer the intended questions. An explicit range still wins when present; neither
explicit marker ranges nor manual range entry may be required for the accepted
bare-marker pastes. Preserve the working bookmarklet's handling of an image with
no resolvable range. Never guess one from unrelated numbers.

## Gate 1 — read-only, then wait for `go`

1. Read `AGENTS.md`, `docs/AGENTS.md`, `INTENT.md`, the
   [coordinator](../README.md), [phase map](phase-map.md), and the existing
   [PC04](../parser-convergence/pc-04-marker-range.md),
   [PC05](../parser-convergence/pc-05-stimulus-boundaries.md), and
   [PC06](../parser-convergence/pc-06-bookmarklet-policy-release.md) packages.
   Read [PC04 re-review 3](../reviews/parser-convergence-2026-11-phase-4-re-review-3.md)
   for the exact `BLOCK-10` and `BLOCK-11` contracts. Read `docs/LIVE-SAFETY.md`
   before any browser check. Inspect worktree state before planning changes.
2. Pin three exact refs. The last observed working branch is
   `scratch/constant-text-stimulus` at `ed96b11`, the settled
   `scratch/parser-convergence-cycle` base is `9afe4f8`, and the PC04 candidate
   is `ed14323`. Verify each; use the actual working stimulus commit the owner
   confirms if newer. Check that the working commit reproduces the artifact the
   owner uses. If that build contains uncommitted work, ask for an exact snapshot
   from the owner. Inspect it from a separate checkout/export so the owner can
   keep using and changing their branch. Run any build or test that writes files
   in a disposable export. Pin the key-only reference from the settled
   convergence line as well.
3. Inventory the pinned stimulus delta from its own merge base and inspect the
   actual Load, fill, plan, Save, and autosave paths. Map each owner-facing feature
   and small workflow change to its code, how to retain it, and a test or probe.
   Compare useful key-only workflows by outcome. Flag any real gap or conflict
   with settled save/storage contracts for a specific owner decision. Preserve
   user-visible behavior; a copied parser, obsolete build wiring, or a defect is
   not a feature. Use real OCR samples from the pinned branch for parser
   comparisons; do not copy its docs or fixtures wholesale as proof.
4. Present the exact cycle amendment in the PC07 draft for owner approval before
   coding: target two supported surfaces, replace PC06's mandatory manual save
   on every image question with the working ready-image autosave behavior, and
   make key-only retirement conditional on parity. Map PC07 to phase 7 so the
   first review of the integration has its own record. Keep PC01–PC03 settled
   and the existing PC04–PC06 packages and reviews as history. Give a row-by-row
   mapping of unfinished acceptance into PC07 or an explicitly approved release
   gate. `BLOCK-10` and `BLOCK-11` stay open until their exact frozen checks pass
   independent review; keep `BLOCK-1`–`BLOCK-9` as closed controls. This is an
   owner-approved successor, not permission to skip the unresolved findings or
   run the old dependent packages out of order.
5. Give the exact base, fresh `scratch/pc07-stimulus-first` worktree/branch plan,
   file measurements and module boundaries under the coordinator's
   externalize-first contract, baseline results, and a finite acceptance matrix
   for the two tracks below. Plan failing-first tests and identify which real
   surfaces and staging actions run each case. Give the owner a copy of the
   agreed matrix for the independent reviewer. Distinguish implementation
   handoff complete (eligible for review) from review settled (eligible for an
   authorized merge). Gate 1 must identify any required approval or unresolved
   conflict, not infer a finding disposition or retirement from `go`.

When the gate passes, show the exact scope the owner is approving and end with:

```text
WAITING FOR GO. No files changed.
NEXT COMMAND: go
```

If the exact snapshot, scope, or an approval is unresolved, stop at Gate 1
with the actual next request and the coordinator's `NEXT COMMAND:` format.

## After `go` — build one reviewable scratch candidate

Work on the approved new branch from the exact settled cycle tip. Record the
approved direction, active phase 7 mapping and carried gate IDs in `INTENT.md`,
the coordinator, active phase map and PC07 on that branch. Preserve the old
records and distinguish implementation handoff from independent settlement.
Keep the parser and product changes identifiable in the diff and their evidence
separately reproducible. Use the working branch and PC04 candidate as input
evidence and selective donors, not wholesale merges. Leave all source refs,
real branches and unrelated changes intact.

### Canonical parsing and quality

- `src/parser/core.js` owns shared recognition and metadata. Keep
  `src/parser/parser.js` a facade. Use the canonical parse path for the stimulus
  workflow and verify full output against the key-only parser where applicable;
  inlining the same file alone does not establish parity. Preserve the deployed
  helper's manual Load/form and storage contracts, with no answer-key load or
  Constant Text write. Bookmarklet-only form writes and save/attachment policy
  stay outside the core.
- Preserve the reviewed convergence quality and bring over useful working-branch
  parsing behavior through manually transcribed fixtures. Cover D-91 option
  boundaries, PC03 initials, RM01 structural fields/paragraphs, and the applicable
  comprehension/cloze and key cases. Keep shared text and image metadata out of
  question/option fields. Revalidate PC05 anchored text/diagram and missing-text
  samples, including controls for real wrapped option text, incomplete or
  duplicate sets, loose E/F, and ordinary bank lead-ins before any extraction.
- Replay the raw Q18–Q23 bare-marker fixture, explicit precedence, and the
  named PC04 controls. Reproduce both exact failures on `ed14323`: `V10` must
  exclude the table's cash amount `25`; `V11` must keep the valid Q25 in
  `in the same section`. Preserve their named controls and verify exact target
  flags, clean Q19, literal metadata, and the correct default Attach range on
  the real surfaces. Use the key-only build for the frozen three-surface checks
  before any retirement. Base the supported range grammar on named OCR evidence;
  avoid an open-ended natural-language guessing requirement.

### Working stimulus and save parity

- Preserve the inventoried working features. On the known snapshot these
  include shared text filling Constant Text in the bookmarklet, image blocks
  keeping that field separate, in-memory/mobile file handling and plan lifetime,
  single/bulk image selection, missing-text blocking, and save diagnostics.
  Keep automatic saves for questions covered by a ready attachment and the
  working pause/resume behavior for a missing image or unresolved range. Verify
  actual key load/fill, correction, manual and autosave results wherever they
  replace a key-only workflow; retain settled duplicate/ambiguous-save and
  existing server contracts.
- Use the real generated bookmarklet against disposable staging with working
  uploads. For a keyed OCR batch with a bare marker, prove real POSTs save the
  correct answers and image on the intended rows, and that a neighboring
  non-target row does not get the image. Read the persisted rows and stored
  image or its served bytes. `Ready`, mocked requests, and a success flash do
  not prove the upload. In the same focused run, verify a missing/unresolved
  image pauses before a POST and that a repeated activation or uncertain result
  cannot duplicate a save. Exercise the relevant file lifetime and stale-file
  boundaries on the real path. Use the working feature inventory to account for
  the other observable changes without adding speculative scenarios.

Rebuild generated artifacts with their actual builders; check the full Node/PHP
baseline, output bytes/hashes, syntax and freshness, and relevant asset pins.
Record exact refs, feature-to-evidence mapping, failing-first results, the finite
closure checklist, and any owner browser gate in the PC07 handoff
(`Commit: deferred`). End this implementation session at that handoff.

## Independent gate in the existing cycle

After a separate owner-authorized commit/push, hand the exact ref to a reviewer
who did not implement it. Use `@docs/plan/prompts/review-session.md review phase 7`
in the review environment. The reviewer checks the **whole candidate diff**,
including intent/plan changes, source, fixtures, tests and generated artifacts.
They use the owner-approved Gate 1 matrix and the settled review protocol as
authority, and check candidate docs and the handoff against them. They verify
source refs, reproduce baseline and real-path evidence, and independently
replay both carried frozen contracts. The implementer's handoff is a claim,
not acceptance. Record the verdict in
`docs/plan/reviews/parser-convergence-2026-11-phase-7.md`; follow the existing
fix/re-review lifecycle for every open finding and each changed candidate.
Reuse settled evidence for unchanged paths; add focused independent probes for
the new parser/save boundaries. PC07 cannot merge while a blocker is open.

Keep the key-only artifact available through this review and the desktop and
owner Brave/Android checks of the installed replacement. Put the exact rollback
artifact/ref and proposed retirement wiring in the reviewed release plan. Any
subsequent docs/build/test/source change to retire the key-only release path is
also subject to independent exact-ref review. The standard cycle-wide review
and separate owner release decision still apply.

Every gate and handoff uses the coordinator's `NEXT COMMAND:` contract. At the
implementation handoff name the exact publish request as the next action; after
publication the command is the independent review above. This prompt does not
itself authorize a commit, push, merge, deployment, or live write.
