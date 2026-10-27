## Phase 5: Documentation

```
You are continuing workspace setup. Phases 1-4 are complete.

## File and Context Discipline

1. **EVIDENCE-BASED**
   Generate docs only from extracted evidence (code, edge cases, invariants, migration docs). Do not add new information.

2. **PHASE BOUNDARY**
   Phase 5 ends when all docs are created. Do not begin test harness setup or final report.

## Task: Phase 5 Only

### Read These Files

- `archive/migration-docs/*.md`
- `src/parser/parser.js`
- `docs/EDGE_CASES.md`
- `docs/INVARIANTS.md`

### Generate Docs

Create these files:

**`docs/SPEC.md`:**
What the parser does, based on code + migration docs. Include:
- Input format
- Output format
- Parsing stages
- Flags/warnings produced

**`docs/DECISIONS.md`:**
Why weird heuristics exist. For each unusual implementation choice:
- What the choice is
- Why it exists (from migration docs)
- What the risk is

**`docs/AGENTS.md`:**
Instructions for future AI sessions:
- Critical constraints
- Dangerous areas
- What to preserve
- What to avoid changing
- How to run tests
- How to build the bookmarklet

**`docs/BUILD.md`:**
How to build the bookmarklet from modules:
- Build process
- How to combine parser + UI into single bookmarklet
- How to produce a self-contained `javascript:` URL

**`README.md`:**
Project overview and quick start.

### Output

Update `WORKSPACE_SETUP.md` with:
- List of docs created
- Any missing information

**Do not proceed to Phase 6. Stop here and wait for verification.**
```