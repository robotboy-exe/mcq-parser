## Phase 4: Fixtures

```
You are continuing workspace setup. Phases 1-3 are complete.

## File and Context Discipline

1. **BOUNDED READING**
   Process migration docs one at a time. After each doc, extract fixtures found, then move to the next.

2. **NO GENERATION**
   Do not generate expected outputs. If they're not in the docs, mark as PENDING.

3. **PHASE BOUNDARY**
   Phase 4 ends when all fixtures are extracted. Do not begin documentation generation or test harness setup.

## Task: Phase 4 Only

### Read These Files

- `archive/migration-docs/*.md`

### Extract Fixtures

For each raw sample input mentioned in migration docs:
1. Save the raw text as `fixtures/inputs/{id}.txt`
2. Create `fixtures/expected/{id}.json` with:
   - What the parser should detect
   - What flags/warnings should appear
   - What must NOT happen
   - Status: "CONFIRMED" (if expected output in docs) or "PENDING" (if not)

Do NOT generate expected outputs yourself. If they're not in the docs, mark as PENDING.

If a trusted variant would produce different output, note the discrepancy in the expected file.

### Output

Update `WORKSPACE_SETUP.md` with:
- Total fixtures extracted
- Count by status (CONFIRMED vs PENDING)
- Any discrepancies noted

**Do not proceed to Phase 5. Stop here and wait for verification.**
```