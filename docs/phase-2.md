## Phase 2: Code Extraction + Baseline Selection

```
You are continuing workspace setup. Phase 1 is complete.

## File and Context Discipline

1. **ARCHIVE FIRST**
   All raw materials are already in archive/. Do not modify them.

2. **SCRATCH IS NOT SOURCE**
   Do not use tmp directories or create wrapped/folded copies. Work directly with the archived originals.

3. **BOUNDED READING**
   Process ONE source at a time. After analyzing each source, write findings to `archive/trusted-variants/analysis/{variant}-notes.md` or `archive/migration-docs/analysis/{doc}-notes.md`, then move to the next.

4. **NO FULL RE-REREADS**
   Once a source has been analyzed and notes written, do not re-read the whole file. Read only specific sections needed for comparison.

5. **PHASE BOUNDARY**
   Phase 2 ends when baseline is selected and code is extracted. Do not begin edge case extraction, invariant extraction, or fixture collection.

## Task: Phase 2 Only

### Read These Files

- `archive/migration-docs/*.md` (all migration docs)
- `archive/trusted-variants/*.js` (all trusted variants)
- `archive/trusted-variants/*-KNOWN_ISSUES.md` (known issues)

### Extract Code Versions

For each source (migration docs + trusted variants):
1. Identify all code snapshots
2. Note: source, context, key differences
3. For trusted variants, document what parsing logic they contain based on code inspection only (do NOT run or test)
4. Write findings to per-source notes in `archive/analysis/`

### Select Baseline

Compare all versions and recommend:
1. Which version should be the starting point?
2. Why? (cite evidence: edge case coverage, stability notes, completeness)
3. What are the trade-offs?

If versions differ significantly, create `BASELINE_COMPARISON.md` showing key differences.

### Extract Code into src/

Based on the baseline selection:
1. Extract pure parsing logic (no DOM, no localStorage) into `src/parser/parser.js`
2. Extract DOM/form interaction into `src/ui/ui.js`
3. Create `src/build/build.js` that will combine modules into bookmarklet
4. Create `src/bookmarklet.js` as the combined output

If separation is unclear, keep everything in `src/bookmarklet.js` and note "SEPARATION PENDING".

### Output

Update `WORKSPACE_SETUP.md` with:
- Code versions found (list with sources)
- Baseline chosen and why
- Code extraction status
- Any conflicts or ambiguities

**Do not proceed to Phase 3. Stop here and wait for verification.**
```