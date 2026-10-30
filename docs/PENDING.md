# Pending — English Shared-Passage and Cloze Support

- **Status:** deferred pending representative OCR samples
- **Target:** site-owner tool on `main`
- **Reason:** parsing rules cannot be defined safely without real source layouts

## Need

The site owner wants a contained subject such as **English (Essay)** for English
question formats that need a shared passage. The formats identified so far are:

- a comprehension passage shared by several multiple-choice questions; and
- a cloze or gap-fill passage whose numbered blanks each map to a separate
  multiple-choice question with A-D options.

The proposed subject name is a product label. The known formats still use
multiple-choice answers rather than candidate-entered free text.

## Intended Direction

Shared passages should become first-class site content rather than being copied
from the experimental image workflow unchanged. Conceptually, one passage will
be linked to multiple question records, with a slot number where the passage is
a cloze exercise. Each linked question keeps its own options and correct answer.

The specialized admin and candidate behavior should be enabled by a stable
subject ID or capability, not by matching the display text `English (Essay)`.
Passage rendering should use the same safe underline and Unicode rules selected
for ordinary question text in P24.

The stimulus work on `experiments` is useful prior art for extracting a shared
block and associating it with a question range. Its `needsImage` behavior,
image-plan UI, and auto-save gates are not automatically the correct behavior
for readable English text and must not be ported wholesale.

## Evidence Required

Implementation remains blocked until representative OCR is available for each
passage type. The samples must establish:

- passage introductions and boundaries;
- question-range and blank-number notation;
- where option sets appear relative to the passage;
- whether OCR preserves paragraphs, underlining, punctuation, and blank slots;
- whether passages can contain images, tables, or mathematical symbols; and
- variations that must not be mistaken for questions or options.

Source OCR must be archived unchanged. Expected parser fixtures must be
transcribed from the source rather than generated from parser output.

## Product Decisions Still Needed

- The complete set of passage types supported by the contained subject.
- The persisted passage-to-question relationship and server form contract.
- Whether linked questions must remain consecutive and unshuffled.
- Whether the candidate view repeats, pins, or otherwise retains the passage
  while moving between linked questions.
- How the active cloze slot is identified or highlighted on mobile and desktop.
- How passage editing, deletion, activation, and image handling work in admin.

## Resume Order

1. Collect and classify real OCR samples.
2. Define expected parsed passage and linked-question structures.
3. Specify and implement manual passage creation and candidate rendering.
4. Add parser fixtures for every evidenced layout.
5. Port only the reusable stimulus extraction concepts from `experiments`.
6. Add owner-tool automation after the manual server workflow is verified.

No parser, database, server-contract, or candidate-rendering change is approved
by this pending note.
