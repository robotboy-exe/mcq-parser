# PC01 — Product Surface Separation

- **Status:** not started
- **Product baseline:** `793cb8f`
- **Package base:** record the docs-only cycle-setup commit on
  `scratch/parser-convergence-cycle` at Gate 1; verify its product tree equals
  `793cb8f`
- **Implementation branch:** short-lived `scratch/pc01-product-separation`
- **Depends on:** parser-convergence cycle setup
- **Blocks:** PC02
- **Review level:** rigorous
- **External gate:** disposable local browser only; no deploy or live write
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Undo the accidental product coupling in the scratch merge without changing any
parser behavior. Root `ocr_helper.js` remains the small manually saved deployed
tool. The key/autosave bookmarklet becomes a first-class, self-contained source
tree. The existing stimulus bookmarklet remains byte-for-byte unchanged.

## Scope

1. Restore the reviewed manual root-helper behavior from the current published
   baseline: one paste box, native form fill, manual PRG save, and only its
   existing queue/meta/submitted state.
2. Move the scratch merge's key, answer-fill, dry-run, and autosave behavior into
   a focused key-bookmarklet entry under `src/bookmarklets/key/` with a dedicated
   build and generated output.
3. Split tests so deployed-helper assertions execute root `ocr_helper.js`, while
   key-bookmarklet assertions execute the real key entry/build.
4. Record exact product/storage ownership. Shared storage names keep their
   existing shapes; each product must refuse or safely reset stale incompatible
   state.

## Non-goals

- No parser regex, split, option, region, stimulus, key grammar, or flag change.
- No P20-P23 work and no stimulus-bookmarklet UI change.
- No PHP, schema, deployment token, generated stimulus bookmarklet, or live-site
  change.
- Do not merge the two bookmarklets.

## Gate 1 measurements

Gate 1 must name every source, test, build, and generated file; record baseline
lines/bytes and expected additions; prove `src/parser/core.js`,
`src/parser/parser.js`, `src/ui/ui.js`, and `src/bookmarklet.js` are outside the
behavioral diff; and identify generated outputs separately. No implementation
starts before those measurements and the exact extraction boundary are approved.

## Acceptance

| Check | Expected |
|---|---|
| Deployed helper | Real root helper has no key load, dry run, autosave, fetch loop, image plan, batch history, or bookmarklet title path |
| Manual workflow | Queue/fill/skip/clear/native-submit behavior and `ocrQueue`/`ocrMeta`/`ocrSubmitted` contracts match the reviewed published baseline |
| Key bookmarklet | Real key entry preserves answer-key fill, Stop behavior, in-flight-save settlement, and the existing key/autosave tests from `793cb8f` |
| Product isolation | Loading either bookmarklet over the deployed page removes/replaces only the intended panel and does not register duplicate listeners |
| Stimulus artifact | `src/bookmarklet.js` and its source modules are byte-identical to package base |
| Parser | `src/parser/core.js` and all parser outputs are byte-identical to package base |
| Build | Key output is one line, syntax-valid, deterministic, and contains no forbidden percent escape |
| Baseline | Full Node/PHP baseline and bank extractor pass; disposable browser smoke covers deployed and key surfaces |
| Safety | No deploy, live save, deletion, schema operation, or real-branch change |

## Handoff

Not started. Record exact files, per-file measurements, hashes, commands,
acceptance mapping, browser evidence, exclusions, review target, and
`Commit: deferred`.
