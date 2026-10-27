## Phase 3: Edge Cases + Invariants

```
You are continuing workspace setup. Phases 1-2 are complete.

## File and Context Discipline

1. **BOUNDED READING**
   Process migration docs one at a time. After each doc, write edge cases and invariants found to a per-doc note file, then move to the next.

2. **NO INVENTION**
   Only extract what is explicitly mentioned in the docs. Do not infer or guess.

3. **PHASE BOUNDARY**
   Phase 3 ends when edge cases and invariants are documented. Do not begin fixture collection or documentation generation.

## Task: Phase 3 Only

### Read These Files

- `archive/migration-docs/*.md`
- `src/parser/parser.js` (the extracted parser)
- `archive/trusted-variants/*.js` (for cross-reference)

### Extract Edge Cases

For each edge case mentioned in migration docs:
1. Short name (e.g., "key-only paste", "loose E detection")
2. Trigger condition
3. Expected behavior
4. Current status: CONFIRMED (in docs + code), UNVERIFIED (docs only), or CONFLICTED
5. Source (which doc mentioned it)

Do NOT invent edge cases not mentioned in the docs.

Create `docs/EDGE_CASES.md` with the full list.

### Extract Invariants

For each "must never break" rule mentioned:
1. State the rule clearly
2. Verification status: VERIFIED (trusted variant preserves it), AT_RISK, or CONFLICTED
3. Source

Create `docs/INVARIANTS.md` with the full list.

### Output

Update `WORKSPACE_SETUP.md` with:
- Edge cases extracted (count by status)
- Invariants extracted (count by status)
- Any conflicts found

**Do not proceed to Phase 4. Stop here and wait for verification.**
```