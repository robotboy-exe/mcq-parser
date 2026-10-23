# trusted-variant-A.js — Known Issues

Source: user report (Phase 1 setup, 2026-10-23)

## Known Bug

Options whose label does not have a period after the alphabet letter do not parse properly.

Observed behavior:

- When option A did not have the period after its label, the whole option
  (including the label) was appended to the question field instead of being
  recognized as a separate option.

## Caveats

- The user's memory of the exact behavior is incomplete beyond the above.
- There may have been additional bugs that were not remembered or reported.
- This variant predates the merge of the question and answer-key text areas.
