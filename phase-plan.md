# Workspace Setup Phase Plan

## Overview

This document guides the complete workspace setup process. Execute each phase sequentially using the corresponding phase prompt. Verify each phase before proceeding.

## Execution Flow

### Phase 1: Workspace Structure + Archive
**Prompt:** Use "Phase 1: Workspace Structure + Archive" prompt

**What it does:**
- Creates directory structure
- Archives all migration docs and trusted variants unchanged
- Creates known issues docs for each trusted variant

**Verification checklist:**
- [ ] All directories created
- [ ] All 6 migration docs copied to `archive/migration-docs/`
- [ ] All 3 trusted variants copied to `archive/trusted-variants/`
- [ ] No files modified (byte-identical to originals)
- [ ] `WORKSPACE_SETUP.md` created with inventory
- [ ] No code extraction or analysis performed

**If verification fails:**
- Restore from backup
- Re-run Phase 1 prompt
- Do not proceed until archive is complete and correct

**Proceed to Phase 2 when:** Archive is complete and verified.

---

### Phase 2: Code Extraction + Baseline Selection
**Prompt:** Use "Phase 2: Code Extraction + Baseline Selection" prompt

**What it does:**
- Reads all archived materials
- Identifies code versions from migration docs and trusted variants
- Selects baseline code version
- Extracts parser logic into `src/parser/parser.js`
- Extracts UI logic into `src/ui/ui.js`
- Creates build script in `src/build/build.js`

**Verification checklist:**
- [ ] All code versions identified and documented
- [ ] Baseline selected with clear reasoning
- [ ] `src/parser/parser.js` contains pure parsing logic (no DOM, no localStorage)
- [ ] `src/ui/ui.js` contains DOM/form interaction
- [ ] `src/bookmarklet.js` exists (combined or placeholder)
- [ ] No parser behavior modified (extraction only)
- [ ] `WORKSPACE_SETUP.md` updated with baseline decision

**If verification fails:**
- Check that extraction didn't modify behavior
- Verify baseline selection reasoning
- Re-run Phase 2 if needed
- Do not proceed until code is correctly extracted

**Proceed to Phase 3 when:** Code is extracted and baseline is selected.

---

### Phase 3: Edge Cases + Invariants
**Prompt:** Use "Phase 3: Edge Cases + Invariants" prompt

**What it does:**
- Extracts all edge cases from migration docs
- Extracts all invariants from migration docs
- Cross-references against trusted variants
- Creates `docs/EDGE_CASES.md`
- Creates `docs/INVARIANTS.md`

**Verification checklist:**
- [ ] `docs/EDGE_CASES.md` created with all edge cases
- [ ] Each edge case has: name, trigger, expected behavior, status, source
- [ ] `docs/INVARIANTS.md` created with all invariants
- [ ] Each invariant has: rule, verification status, source
- [ ] No edge cases invented (only from docs)
- [ ] Conflicts flagged, not silently resolved
- [ ] `WORKSPACE_SETUP.md` updated with counts

**If verification fails:**
- Check that edge cases came from docs, not invention
- Verify invariants are testable rules
- Re-run Phase 3 if needed
- Do not proceed until edge cases and invariants are documented

**Proceed to Phase 4 when:** Edge cases and invariants are documented.

---

### Phase 4: Fixtures
**Prompt:** Use "Phase 4: Fixtures" prompt

**What it does:**
- Extracts all raw sample inputs from migration docs
- Creates fixture files in `fixtures/inputs/`
- Creates expected output files in `fixtures/expected/`
- Marks missing expected outputs as PENDING

**Verification checklist:**
- [ ] All fixtures extracted from docs
- [ ] Each fixture has input file in `fixtures/inputs/`
- [ ] Each fixture has expected file in `fixtures/expected/`
- [ ] Expected files marked as CONFIRMED or PENDING
- [ ] No expected outputs generated (only from docs)
- [ ] Discrepancies noted if trusted variants differ
- [ ] `WORKSPACE_SETUP.md` updated with fixture counts

**If verification fails:**
- Check that fixtures came from docs
- Verify no expected outputs were invented
- Re-run Phase 4 if needed
- Do not proceed until all fixtures are extracted

**Proceed to Phase 5 when:** All fixtures are extracted.

---

### Phase 5: Documentation
**Prompt:** Use "Phase 5: Documentation" prompt

**What it does:**
- Generates `docs/SPEC.md` from code + migration docs
- Generates `docs/DECISIONS.md` explaining weird heuristics
- Generates `docs/AGENTS.md` with instructions for future AI
- Generates `docs/BUILD.md` with build instructions
- Generates `README.md` with project overview

**Verification checklist:**
- [ ] All 5 docs created
- [ ] `docs/SPEC.md` describes parser behavior accurately
- [ ] `docs/DECISIONS.md` explains unusual implementation choices
- [ ] `docs/AGENTS.md` has clear constraints and rules
- [ ] `docs/BUILD.md` explains how to produce bookmarklet
- [ ] `README.md` provides project overview
- [ ] All docs based on evidence, not invention
- [ ] `WORKSPACE_SETUP.md` updated with doc list

**If verification fails:**
- Check that docs match extracted evidence
- Verify no new information was added
- Re-run Phase 5 if needed
- Do not proceed until all docs are complete

**Proceed to Phase 6 when:** All documentation is generated.

---

### Phase 6: Test Harness + Final Report
**Prompt:** Use "Phase 6: Test Harness + Final Report" prompt

**What it does:**
- Creates `tests/runner.js` test harness
- Resolves gaps from gap reports
- Produces final `WORKSPACE_SETUP.md` with complete status
- Lists human decisions required

**Verification checklist:**
- [ ] `tests/runner.js` created and runs without errors
- [ ] Test harness loads fixtures and compares against expected
- [ ] All gaps from gap reports addressed
- [ ] Each gap marked as RESOLVED, NEEDS_INPUT, or STILL_OPEN
- [ ] `WORKSPACE_SETUP.md` contains complete setup report
- [ ] Verification checklist in report shows all items
- [ ] Human decisions listed clearly
- [ ] No parser code modified during setup

**If verification fails:**
- Check that test harness runs
- Verify gap resolution is complete
- Re-run Phase 6 if needed
- Do not proceed until setup is complete

**Setup complete when:** Final report is produced and verified.

---

## 2nd Pass Instructions

After each phase completes, perform a 2nd pass verification:

### 2nd Pass Process

1. **Stop and wait** after the agent reports phase completion
2. **Review the output** against the verification checklist
3. **Check for these common failures:**
   - Files created in wrong locations
   - Original files modified instead of copied
   - Code behavior changed during extraction
   - Edge cases or invariants invented
   - Expected outputs generated instead of marked PENDING
   - Conflicts silently resolved
   - Documentation contains information not in source materials

4. **If issues found:**
   - Document what went wrong
   - Restore from backup if necessary
   - Re-run the phase with clearer instructions
   - Do not proceed until the phase is correct

5. **If phase is correct:**
   - Note completion in your own tracking
   - Proceed to next phase

### Critical 2nd Pass Checks

**After Phase 1:**
- Verify archive contains byte-identical copies
- Verify no analysis or extraction occurred

**After Phase 2:**
- Verify parser.js has no DOM or localStorage code
- Verify baseline selection is justified with evidence
- Verify no behavior changes during extraction

**After Phase 3:**
- Verify all edge cases came from migration docs
- Verify all invariants are testable rules
- Verify conflicts are flagged, not resolved

**After Phase 4:**
- Verify all fixtures came from migration docs
- Verify no expected outputs were invented
- Verify PENDING status used correctly

**After Phase 5:**
- Verify all docs match extracted evidence
- Verify no new information was added
- Verify docs are internally consistent

**After Phase 6:**
- Verify test harness runs
- Verify all gaps addressed
- Verify final report is complete
- Verify human decisions are listed

---

## Recovery Procedures

### If a phase fails verification:

1. **Identify the failure:**
   - What went wrong?
   - Which files are affected?
   - Is the archive still intact?

2. **Assess damage:**
   - Can the phase be re-run safely?
   - Do we need to restore from backup?
   - Are subsequent phases affected?

3. **Recover:**
   - If archive is intact: re-run the failed phase
   - If archive is corrupted: restore from backup, re-run from Phase 1
   - If subsequent phases are affected: restore and re-run from the first affected phase

4. **Document:**
   - Note what went wrong
   - Note what was done to fix it
   - Update instructions to prevent recurrence

### If the agent gets stuck:

1. **Check for blockers:**
   - Missing files?
   - Ambiguous instructions?
   - Conflicting information?

2. **Provide clarification:**
   - Answer the agent's questions
   - Provide missing information
   - Resolve conflicts

3. **Resume:**
   - Continue from where it stopped
   - Do not re-run completed phases unless necessary

---

## Success Criteria

The workspace setup is successful when:

1. All 6 phases complete without errors
2. All verification checklists pass
3. Archive contains all raw materials unchanged
4. Code is correctly extracted without behavior changes
5. All edge cases and invariants are documented
6. All fixtures are extracted
7. All documentation is generated
8. Test harness runs
9. All gaps are addressed
10. Final report is complete and accurate

---

## Next Steps After Setup

Once workspace setup is complete:

1. **Review the setup report**
   - Check baseline selection
   - Review conflicts
   - Address human decisions required

2. **Run the test harness**
   - See which tests pass
   - See which tests are PENDING
   - Identify what needs expected outputs

3. **Begin parser improvements**
   - Use the fixture-first workflow
   - Add fixtures for new edge cases
   - Run tests after each change
   - Preserve all invariants

4. **Build the bookmarklet**
   - Use the build script
   - Test in browser
   - Verify all functionality works

---

## Quick Reference

**Phase 1:** Archive everything → Verify archive intact
**Phase 2:** Extract code, select baseline → Verify extraction correct
**Phase 3:** Extract edge cases + invariants → Verify from docs only
**Phase 4:** Extract fixtures → Verify no invention
**Phase 5:** Generate docs → Verify evidence-based
**Phase 6:** Test harness + final report → Verify complete

**2nd Pass:** After each phase, verify against checklist before proceeding.