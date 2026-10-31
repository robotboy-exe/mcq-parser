# OT07 — Owner Context Workflow

- **Status:** not started
- **Depends on:** OT06
- **Blocks:** OT08, OT09
- **External gate:** none beyond OT05/OT06 contracts
- **Release:** B
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Extend the manual owner tool so an administrator can review, create, link, and
activate one or several shared contexts without any automatic save.

## State extension

The versioned owner state gains `contexts[]`; each parsed question may carry a
local context reference, position, and slot. Each context records editable type,
title, text, target source numbers, expected count, server ID, and whether the
saved draft is stale after an edit.

## Work

1. Add a context review panel with one editable card per context; a one-context
   paste uses the same array shape as a multi-context paste.
2. Allow standalone questions before, between, and after context groups.
3. Prefill the native context form from the selected card and dispatch preview
   events.
4. Use explicit administrator clicks and the native PRG action to create or
   update each inactive context draft.
5. Extend the pending-submission state machine to distinguish context and
   question actions and bind the exact returned context ID once.
6. Mark a saved context draft stale whenever its local editable fields change;
   block linked question saves until the administrator updates it.
7. Fill context ID, position, and slot into the native question form for linked
   items and clear them for standalone items.
8. Advance question items only after exact native question success.
9. Keep final context activation a separate explicit native action after all
   members are saved and reviewed.
10. Add DOM/storage/PRG tests for reload, Reset, key-only paste, context edits,
    multiple groups, and standalone clearing.

## Acceptance

| Check | Expected |
|---|---|
| Singular context | Create/link/review path works through `contexts[0]` |
| Multiple contexts | Each receives its own server ID and correct members |
| Standalone item | Native context fields cleared before save |
| Context edit | Saved draft becomes stale and linked save is refused |
| Native context success | Exact pending card binds returned ID once |
| Native question success | Advances one item; context card remains |
| Error/ambiguous reload | No false ID binding or queue advance |
| Key-only paste | Queue and contexts retained; answer key replaced |
| Reset | New state cleared explicitly; legacy keys untouched |
| Activation | Separate administrator action; incomplete context rejected |
| Excluded behavior | No automatic context creation, activation, or question save |

## Guardrails

- Do not post a context or question automatically after parsing.
- Do not reuse one server context ID for a different local context.
- Do not leave context fields populated for standalone questions.
- Do not activate a context from JavaScript without the native human action.
- Do not start OT08.

## Handoff template

```text
Date:
Result:
State schema revision:
Context PRG lifecycle:
Question-link lifecycle:
Single/multiple/standalone tests:
Local PHP/browser evidence:
Files changed:
Hashes:
Open questions:
Review: pending rigorous Release B review
Commit: deferred
Next: OT08 not started
```
