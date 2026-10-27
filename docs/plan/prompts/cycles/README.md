# Build Cycles

The active map is [`../phase-map.md`](../phase-map.md). `phase-session.md`
reads it. Use `cycle <id> phase N` only for an archived map.

## When to archive

- Do not archive automatically when the last phase stops.
- Archive only when the user confirms the cycle is complete or satisfied, or
  explicitly asks to shelve it.
- Before archiving, the final phase's rigorous review record must exist and be
  settled, and the final phase plus that record must be committed.
- If the final phase is not committed yet, run the separate cycle-close session
  described in `docs/plan/README.md`; do not use a phase session, because the
  final package is already `done`.
- If the user starts new work before confirming, ask whether to archive the old
  cycle first or keep it active.
- Keep statuses in `docs/plan/README.md`. A phase map only maps phase numbers to
  packages.

## Shelve the old cycle

1. Confirm the final review is settled and the final phase is committed; if
   not, run the cycle-close session first.
2. Confirm the user is satisfied or explicitly asked to archive.
3. Copy the active map to `cycles/<old-cycle-id>.md`; never overwrite it first.
4. Do not edit an archived map later.

## Create the new map

1. Choose a cycle ID, for example `post-as-2026-11`.
2. List packages in dependency order, one package per phase. Phase 1 is the
   first package of the new cycle, not a chat session.
3. Create missing package docs in `docs/plan/`, each with a README status row,
   `Depends on`, acceptance, and a handoff placeholder.
4. If the new work is not planned yet, stop and ask instead of inventing
   packages.
5. Replace the README "Current review checkpoints" and "Current catch-up plan"
   with the new cycle's rows; remove the old cycle's stale rows.
6. Replace `../phase-map.md` using the template below.
7. Verify every package file exists and phase 1 is not already done.
8. Leave `phase-session.md` unchanged.
9. Tell the user to attach `phase-session.md` and send `phase 1`.

## Map template

```markdown
# Current Phase Map

Current cycle: `<cycle-id>`
Updated: `<YYYY-MM-DD>`

`phase N` means phase N of this cycle. Status lives in
`docs/plan/README.md`; this file only maps phase numbers to packages.

| Phase | Package |
|---|---|
| 1 | `<ID>` — `<filename>` |
| 2 | `<ID>` — `<filename>` |

## Starting a new cycle

See `cycles/README.md`.
```
