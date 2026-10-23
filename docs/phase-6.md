## Phase 6: Test Harness + Final Report

```
You are continuing workspace setup. Phases 1-5 are complete.

## File and Context Discipline

1. **NO PARSER MODIFICATION**
   Set up the harness structure only. Do not implement or modify the parser logic.

2. **PHASE BOUNDARY**
   This is the final phase. Produce the complete setup report.

3. **FIXTURE INTEGRITY**
   Treat `fixtures/inputs/` and `fixtures/expected/` as read-only. Do not change
   an expected value to make a test pass. If an expected value is not backed by
   a source doc, mark the fixture PENDING or flag it for human review, and record
   the issue in the final report.

## Task: Phase 6 Only

### Read These Files

- `src/parser/parser.js`
- `fixtures/inputs/*.txt`
- `fixtures/expected/*.json`

### Set Up Test Harness

Create `tests/runner.js`:
1. Load all fixtures from `fixtures/inputs/`
2. Import parser from `src/parser/parser.js`
3. Run parser on each input
4. Compare output against `fixtures/expected/`
5. Report: PASS, FAIL, or PENDING
6. Output summary

The harness must work without a browser (pure Node.js). It tests parser logic only.

**Do NOT implement or modify the parser logic. Just set up the harness structure.**

### Gap Resolution

Read all gap reports:
- `archive/migration-docs/qwen-1-gaps.md`
- `archive/migration-docs/qwen-1-gaps2.md`
- `archive/migration-docs/qwen-2-gaps.md`

For each gap:
1. Is it covered by trusted variants?
2. Is it covered by other migration docs?
3. Does it need human input?

Mark each as exactly one of: RESOLVED, NEEDS_INPUT, or STILL_OPEN.

- RESOLVED — closed by baseline code, a trusted variant, another migration doc,
  or a recorded decision. If the resolution is documentation-only, say so in the
  evidence column and keep the status RESOLVED.
- NEEDS_INPUT — cannot be closed without a human decision or a live artifact
  (for example a save trace or the deployed subject list).
- STILL_OPEN — the supplied sources conflict or lack the evidence needed to
  close it, and no specific input request has been identified.

Do not invent a fourth status.

### Final Setup Report

Update `WORKSPACE_SETUP.md` with:

1. **Baseline chosen**: Which code version, why
2. **Fixtures collected**: Count and status
3. **Edge cases confirmed**: Count and status
4. **Invariants verified**: Count and status
5. **Conflicts remaining**: List for review
6. **Gaps status**: What's resolved, what needs input
7. **Test harness status**: Whether it runs
8. **Next steps**: What I should do before you continue

### Verification Checklist

Include in the report:
- [ ] All migration docs preserved in archive/
- [ ] All trusted variants preserved in archive/
- [ ] All fixtures extracted
- [ ] All edge cases documented
- [ ] All invariants documented
- [ ] All conflicts flagged
- [ ] Test harness runs without errors
- [ ] No fixtures or expected outputs modified (or any correction is flagged
      and recorded in the report)
- [ ] No code was modified during setup

### Human Decisions Required

List any decisions that need my input. Do not guess.

**This is the final phase. Produce the complete setup report.**
```