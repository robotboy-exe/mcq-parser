# Review — owner-tool-2026-11 phase 12 (OT11 Owner Workflow Refinements)

- **Date:** 2026-11-13
- **Mode:** original rigorous review (exploratory); no prior phase-12 records
- **Scope:** OT11 acceptance and production boundary on read-only
  `owner-tool-integration` at `056eb22`
- **Verdict:** PASS WITH ACCEPTED FINDINGS (`FIX-1`, `FIX-2`)
- **Commit readiness:** not ready; first-round findings route to a fix session
- **Review status:** open; awaiting fix session and closure-focused re-review

## Package state at review

The package and both status tables say `in progress`, not `done`. The only open
item is this independent review; the coordinator's workflow stop names this
command, and the owner Brave/Android re-check was accepted on 2026-11-13. The
review therefore proceeded (see `NOTE-1`).

## Base established independently

The owner warned that several commits sit between phases 11 and 12.

| Commit | Date | Content |
|---|---|---|
| `79a6a57` | 2026-11-08 | OT09A consolidation, phase 10A boundary |
| `9c7b475` | 2026-11-11 | WIP: OT10 docs + first OT11 work (creates the OT11 package file) |
| `50b95bb` | 2026-11-12 | WIP: OT11 consolidation, parser 2.3.3, staging tools |
| `056eb22` | 2026-11-13 | OT11 saved-edit isolation (HEAD) |

OT10 was never committed separately. Its handoff changes only docs
(`DEPLOYMENT.md`, `DEVELOPER-GUIDE.md`, and status docs). Its test shims
`deployed/cbt_db.php` and `deployed/cbt_admin_config.php` are untracked and
absent from `git ls-files deployed`. No OT10-only production commit exists after
`79a6a57`. So `79a6a57` is the correct production base for OT11, and every
production delta in `79a6a57..056eb22` belongs to OT11. OT10 doc changes ride in
the same commits and are out of OT11 scope (`NOTE-3`).

## Commands

```text
git log / git show --stat 79a6a57..HEAD
git diff --numstat 79a6a57 HEAD
git diff --no-index --numstat archive/live-sources/{admin_questions,cbt}-2026-10-31.php deployed/…
git show HEAD:<file> | tr -d '\r' | wc -l / wc -c / sha256sum
node tests/runner.js            60 PASS, 0 FAIL, 0 PENDING
node tests/unit.js              163 PASS
node tests/owner-tool.js        81 PASS
node tests/context-migration.js 14 PASS
node tests/cbt-context.js       5 PASS
node tools/extract-bank.js --check   OK, 7 hashes (no CRLF mismatch on this Linux checkout)
php tests/context-lib.php       14 PASS   (PHP 8.3.6)
php tests/context-admin.php     23 PASS
php tests/context-preflight.php 6 PASS
php tests/php-render.php        9 PASS
php tests/cbt-candidate.php     7 PASS
php -l deployed/*.php           PASS
node --check core.js, owner-tool.js, render.js   PASS
git diff --check 79a6a57 HEAD   flags only: `=======` dividers in the fixture/new-sample
                                (D-46 separators, false positive) and whitespace in
                                session-ses_e35a.md (excluded artifact)
owner-tool suite from a clean `git archive HEAD` copy   81 PASS
owner-tool suite with the 79a6a57 sample-passages.txt   81 PASS
adversarial cloze probes at HEAD and at 79a6a57 (below)
```

## Per-file measurements (reproduced; LF-normalized)

| Production file | +/− from `79a6a57` | Final lines / bytes | SHA-256 prefix | Matches handoff |
|---|---:|---:|---|---|
| `src/parser/core.js` | +9 / −3 | 1432 / 49296 | `1321d95f046151e2` | yes |
| `src/owner-tool/owner-tool.js` | +1231 / −278 | 2566 / 106477 | `c8f86b8f6ca61cb7` | yes |
| `src/owner-tool/owner-tool.css` | +85 / −51 | 291 / 4606 | `405a769288849033` | yes |
| `deployed/admin_context.php` | +211 / −48 | 996 / 46688 | `0c5e1b83c30bb29b` | yes |
| `deployed/context_lib.php` | +34 / −9 | 505 / 20353 | `0b1051a97708b9e8` | yes |
| `deployed/admin_questions.php` | +7 / −6 | 1065 / 62892 | `7ec150d924cb8346` | yes |
| `deployed/cbt.php` | +2 / −2 | 1008 / 44515 | `697407e6022ce9f5` | yes |

Live-origin cumulative additions against the archived 2026-10-31 snapshots:
`admin_questions.php` +100 / −81 (exactly at the cap, not over) and `cbt.php`
+53 / −89. No exception needed; none claimed. Phase-cycle modules
(`owner-tool.js`, `owner-tool.css`, `admin_context.php`, `context_lib.php`,
`core.js`) have no line cap.

## Responsibility, deployment, and production-path evidence

- `core.js`: pure parser; the 2.3.3 change is local to `cellsOf`. Listed in
  `DEPLOYMENT.md` §2. Executed by `runner.js`, `unit.js`, and probes.
- `owner-tool.js`/`owner-tool.css`: owner state/controller and styles. Listed in
  the manifest. `tests/owner-tool.js` reads the real files and evaluates them in
  `vm` with a DOM/storage shim; it is not a copy.
- `admin_context.php`/`context_lib.php`: context handling, paging, read-only
  identity payloads. Listed in the manifest. Exercised by the real PHP suites.
- `admin_questions.php`/`cbt.php`: narrow wiring and cache tokens only.
  Inspected, linted, and asserted by `tests/owner-tool.js` source checks.
- No auto-write path: `owner-tool.js` contains no `.submit(`, `requestSubmit`,
  `fetch(`, `XMLHttpRequest`, or programmatic `.click()`. Every write remains a
  native button submit.
- The unsaved-context stop text `Save the shared context first.` is at
  `owner-tool.js:416`. Saved-edit isolation keys off
  `action.value === 'update_context'` (`owner-tool.js:569`, `:745`, `:1817`),
  and both have direct tests (`tests/owner-tool.js:1717`, `:1754`, `:1872`).
- Paging: `context_lib.php:96` applies `LIMIT/OFFSET` only to the management
  list, and the selector query is unpaginated. Covered by `context-lib`/`context-admin`.

## Acceptance coverage

All acceptance rows have direct production-path tests or owner phone evidence:
underline placement, one card, selector, fingerprint adoption, soft gate,
native selection, member skip, context edit, unsaved stop, metadata ownership,
collapse, form boundaries, plain copy, preview placement, page shape, editor
placement, draft/edit modes, explicit edit isolation, full re-paste, duplicate
notices, paging, next free, next unsaved, cloze drift, and no auto-write. The
phone re-check rests on owner acceptance (2026-11-13), not on reviewer
reproduction. Desktop/390px Chromium claims were not re-run here; no staging
tree is in this container.

## Adversarial probes (cloze row-drift boundary)

The probe script runs `parsePaste` on variants of
`fixtures/inputs/sample-cloze-left-drift.txt`.

| Variant | `79a6a57` (2.3.2) | `056eb22` (2.3.3) |
|---|---|---|
| exact fixture | refused (gap 75 missing D) | 15 items, Q75 `confession/suggestion/permission/complaint`, 2 contexts, no warning |
| gap 75 with only one modal−1 anchor | refused | refused (gap 75 missing D) |
| gap 75 drifted right | parsed | parsed, unchanged |
| gap 80 single-space collapse, no corroborating anchor | refused | refused |
| gap 75 with misaligned anchors (shift ≠ 1) | refused | refused |

The correction needs two anchors and keeps strict refusal. It does not become
nearest-column guessing.

## Findings

### FIX-1 — Supplied answer-key evidence changed without provenance

- **Defect:** commit `9c7b475` edited the owner-supplied `sample-passages.txt`
  answer key (diff hunk at line 37). It added `11. B` and `12. c`, and changed
  `13. A` to `13. d`. The file's SHA-256 went from `d286f77a…` (at `79a6a57`) to
  `f0640b5f…`. The OT11 handoff "Files changed" omits the file. The current docs
  still say only Q13-Q15 were supplied and Q11-Q12 are pending:
  `docs/plan/README.md:45`, `:382`; `docs/STATUS.md:41`, `:181`;
  `docs/plan/owner-tool/next-steps.md:175`; `ot-08-comprehension-ocr.md:7`. The
  parser now returns `13: "D"`, which contradicts the recorded 2026-11-08 key.
  No test depends on these keys: the owner-tool suite passes with either version.
  This is an evidence and provenance defect, not a product defect.
- **Preconditions:** repository evidence used by the OT10 key-coverage gate.
- **Closure criteria:**
  1. Either restore `sample-passages.txt` to the `79a6a57` bytes, or record in
     the OT11 handoff that the owner confirmed the new key. That record must give
     the date, the added Q11/Q12, the Q13 A→D correction, and the new SHA-256.
  2. The listed coordinator/STATUS/next-steps/OT08 statements match the chosen
     state of the file.
  3. The OT11 handoff "Files changed" names `sample-passages.txt` if it stays
     changed.
- **Required evidence:** `git diff 79a6a57 -- sample-passages.txt`, the SHA-256,
  and the cited doc lines after the fix.
- **Non-goals:** no parser, test, or fixture change. OT10's own Q11-Q12 coverage
  validation stays in OT10.

### FIX-2 — Tracked staging tooling missing from the handoff and excluded list

- **Defect:** commit `50b95bb` added three tracked files: `tools/phone-staging/cbt_db.php`
  (a SQLite PDO shim that strips `FOR UPDATE`), `tools/start-phone-staging.sh`,
  and `tools/stop-phone-staging.sh`. The OT11 handoff "Files changed" does not
  list them. Its excluded-artifact text only says "test-only DB/config shims",
  which OT10 used for the untracked `deployed/cbt_db.php`. The `DEPLOYMENT.md`
  §1 do-not-deploy list names only `deployed/cbt_db.php` and
  `deployed/cbt_admin_config.php`. The externalize-first contract requires every
  excluded artifact to be identified, and a tracked file named `cbt_db.php` is a
  real deployment-confusion risk.
- **Preconditions:** release packaging from the repository using the manifest.
- **Closure criteria:**
  1. The OT11 handoff "Files changed" and excluded-artifact list name all three
     paths and their purpose.
  2. `DEPLOYMENT.md` explicitly says not to deploy `tools/phone-staging/` or the
     staging scripts.
- **Required evidence:** the updated handoff and manifest lines. Update the
  `DEPLOYMENT.md` hash recorded in the OT10 handoff if the manifest changes.
- **Non-goals:** no change to the scripts' behavior, and no requirement to
  delete them.

### NOTE-1 — Status `in progress` at review

The package is formally `in progress`. The review ran because the coordinator
routes here and the review is the last open item. Set the status in the package,
the coordinator, and the map after the findings settle.

### NOTE-2 — Unrelated committed files

`session-ses_e35a.md` (880 lines, an unrelated device-RAM note) and the root
`new-sample.txt` were committed in `50b95bb`. The handoff identifies both as
excluded, and neither is in the manifest. They are not attributed to OT11 scope.
`git diff --check` whitespace warnings come only from the session note and from
D-46 `=======` dividers.

### NOTE-3 — Mixed OT10/OT11 commits

The phase-11 and phase-12 work shares the WIP commits. Production attribution is
unambiguous because OT10 changed no production file, but a future boundary commit
cannot separate the two phases by commit.

### NOTE-4 — Pre-existing cloze refusal wording

When a cloze table is refused, the warning says its rows are "read as ordinary
questions", but no rows 71-80 appear in `items` (5 items). This is identical at
`79a6a57` and is outside OT11 scope. It is recorded as residual risk only.

## Approvals and excluded artifacts

- **Approvals:** no live-origin limit exception requested or needed;
  `admin_questions.php` is exactly +100.
- **Excluded artifacts:**
  - not deployment files: `session-ses_e35a.md`, `new-sample.txt`,
    `sample-passages.txt` (see `FIX-1`), and `fixtures/inputs/sample-cloze-left-drift.txt`
    and its expected spec (test input)
  - tracked staging tooling: `tools/phone-staging/cbt_db.php`,
    `tools/start-phone-staging.sh`, `tools/stop-phone-staging.sh` (see `FIX-2`)
  - untracked/local: `deployed/cbt_db.php`, `deployed/cbt_admin_config.php`, the
    local staging tree and database (context #12), and the Chromium profiles and
    probes
- **Unrelated worktree changes:** none; the worktree was clean at review.

## Recommended next action

Run a fix session for phase 12 OT11 `FIX-1` and `FIX-2` under the closure
contracts above, then run a closure-focused re-review.

`NEXT COMMAND: @docs/plan/prompts/fix-session.md phase 12 OT11 FIX-1 FIX-2`
