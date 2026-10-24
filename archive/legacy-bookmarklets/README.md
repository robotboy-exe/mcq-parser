# Legacy bookmarklets B1, B2, B3

These are the three bookmarklets supplied in the first message of the original
Claude conversation. They arrived in the root as `first.js`, `second.js`, and
`third.js`; the filenames did not match the B1/B2/B3 order. The files were
identified from the distinguishing features recorded in
`archive/migration-docs/claude-migration.md` §8–§9 and renamed here.

| File | Original name | Bytes | SHA-256 | Identity |
|---|---|---|---|---|
| `b1.js` | `first.js` | 12431 | `0bf1e6a4…60c970d5` | **B1** |
| `b2.js` | `third.js` | 14347 | `2d9f209e…5019ba01` | **B2** (base of merged C) |
| `b3.js` | `second.js` | 13350 | `4989cbb9…d1c76e3b` | **B3** |

## Evidence

- **B3 = `second.js`.** It is the only file containing
  `splitCombinedText`, and its `ocr_load` handler returns
  `alert('No questions found in that text.')` when a key-only paste produces
  no questions. That is exactly the B3 description: different key splitter and
  no key-only paste.
- **B2 = `third.js`.** It has `splitSections` with divider / key-only / header /
  structure detection, a "Show paste box" control, and the Reset bug
  (`queue={items,i:0}` instead of `{items:[],i:0}`). It is the base the merged
  `trusted-variant-C.js` was built from.
- **B1 = `first.js`.** It has no "Show paste box" control and uses the weaker
  `splitCombined` key splitter. Its option-splitting block uses the correct
  double backslashes (`\\n`, `\\s`); B2's equivalent block uses single
  backslashes and therefore almost never matches.

All three pass `node --check`.
