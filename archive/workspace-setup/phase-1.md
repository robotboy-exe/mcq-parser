## Phase 1: Workspace Structure + Archive

```
You are setting up a project workspace for a bookmarklet that processes OCR text containing questions and answer keys.

## Deliverable

The final output of this project is a **bookmarklet** — a single self-contained JavaScript file that runs in a browser context and can be saved as a browser bookmark.

During development, you may use modular JavaScript (separate parser, UI, and build files) to make the workflow cleaner and testable. However:
- The parser logic must be extractable and testable outside the browser
- There must be a clear build step that combines modules into the final bookmarklet
- The final `src/bookmarklet.js` must be a single self-contained file ready to paste as a `javascript:` URL
- Tests run against the extracted parser logic, not the DOM parts

## File and Context Discipline

1. **ARCHIVE FIRST**
   Copy the original trusted-variant-A.js, -B.js, -C.js and all migration docs into archive/ BEFORE any analysis. Never modify originals.

2. **SCRATCH IS NOT SOURCE**
   You may use a scratch directory for reading aids or intermediate notes. Nothing in scratch may be treated as canonical code or as the archive. Never build, repair, or reconstruct executable JS from a folded, wrapped, truncated, or reflowed copy. Only read the original .js files.

3. **BOUNDED READING**
   Do not attempt to hold all variants and all migration docs in memory at once. Process ONE source at a time. After each source, write its findings to a per-source note file in archive/analysis/, then move to the next source.

4. **NO FULL RE-REREADS**
   Once a source has been analyzed and its notes written, do not re-read the whole file. Read only the specific line ranges needed for a comparison.

5. **PHASE BOUNDARY**
   Phase 1 ends when the archive exists and the inventory is written. Do not begin code comparison, baseline selection, or parser extraction.

## Context

I have migration documents extracted from previous development sessions:
- `qwen-1-migration.md` - Extraction from Qwen Chat 1
- `qwen-1-gaps.md` - Gap analysis from Qwen Chat 1
- `qwen-1-gaps2.md` - Second Gap analysis from Qwen Chat 1
- `qwen-2-reconciled.md` - Reconciled extraction from Qwen Chat 2
- `qwen-2-gaps.md` - Gap analysis from Qwen Chat 2
- `claude-migration.md` - Extraction from Claude chat

Note: Claude gap check is not available. Work with `claude-migration.md` only. If gaps are identified during reconciliation, add them to a new `claude-gaps.md` file.

I also have bookmarklet variants I personally trust:
- `trusted-variant-A.js` - An earlier legacy version way before the merge of question and answer key text areas, that just felt very stable but only had 1 noticeable parsing bug during my tests (could have had more) where options whose label didn't have a period after the alphabet, didn't parse properly. my memory of exact behaviour eludes me other than that when option A didn't have the period, the whole option (label included) got appended to the question field
- `trusted-variant-B.js` - the final iteration before the merge of question and answer key. it probably punched higher than variant A in the adge cases it handled, it felt stable enough that I felt confident enough to merge questions and answer key into 1 input block.
- `trusted-variant-C.js` - The most recent of all the merged textarea iterations that I have personally tested (other merged iterations are currently in my browser bookmarks). I have had the least time with this but I feel very good about it that it will probably be quite sufficient.

## Task: Phase 1 Only

### Workspace Structure

Create this directory structure:

~~~
project/
├── README.md                    # Project overview and quick start
├── archive/
│   ├── migration-docs/          # Raw migration documents (preserved unchanged)
│   ├── trusted-variants/        # User's trusted bookmarklet versions
│   │   └── analysis/            # Per-source analysis notes
│   └── chat-exports/            # Original chat exports if available
├── src/
│   ├── parser/
│   │   └── parser.js            # Pure parsing logic (no DOM, no localStorage)
│   ├── ui/
│   │   └── ui.js                # DOM/form interaction
│   ├── build/
│   │   └── build.js             # Script that combines modules into bookmarklet
│   └── bookmarklet.js           # Final combined bookmarklet output
├── fixtures/
│   ├── inputs/                  # Raw text samples
│   └── expected/                # Expected parse outputs (JSON)
├── tests/
│   ├── runner.js                # Test harness
│   └── regression.js            # Regression test suite
├── docs/
│   ├── SPEC.md                  # Parser specification
│   ├── EDGE_CASES.md            # Edge case registry
│   ├── INVARIANTS.md            # Rules that must never break
│   ├── DECISIONS.md             # Why weird code exists
│   ├── AGENTS.md                # Instructions for future AI sessions
│   └── BUILD.md                 # How to build the bookmarklet from modules
└── WORKSPACE_SETUP.md           # This setup log
~~~

### Archive Raw Materials

Copy these files into `archive/` **unchanged**:

**Migration docs → `archive/migration-docs/`:**
- `qwen-1-migration.md`
- `qwen-1-gaps.md`
- `qwen-1-gaps2.md`
- `qwen-2-reconciled.md`
- `qwen-2-gaps.md`
- `claude-migration.md`

**Trusted variants → `archive/trusted-variants/`:**
- `trusted-variant-A.js`
- `trusted-variant-B.js`
- `trusted-variant-C.js`

### Create Known Issues Docs

For each trusted variant, create a `KNOWN_ISSUES.md` in `archive/trusted-variants/`:

**`trusted-variant-A-KNOWN_ISSUES.md`:**
Document the known bug: options without a period after the alphabet letter didn't parse properly. When option A didn't have the period, the whole option (label included) got appended to the question field. Note that there could have been more bugs not remembered.

**`trusted-variant-B-KNOWN_ISSUES.md`:**
Note that this was the final iteration before merging question and answer key text areas. It handled more edge cases than variant A. No specific bugs documented.

**`trusted-variant-C-KNOWN_ISSUES.md`:**
Note that this is the most recent merged-textarea iteration. Limited testing time, but user feels confident it's quite sufficient. No specific bugs documented.

### Output

Create a `WORKSPACE_SETUP.md` with:
- List of all files archived
- Confirmation that no files were modified
- Any issues encountered

**Do not proceed to Phase 2. Stop here and wait for verification.**
```