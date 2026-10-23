# qwen-2-gaps.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/qwen-2-gaps.md` (4598 bytes). No code snapshots.

Corrections to `qwen-2-reconciled.md`, backed by the `admin_questions.php`
source (PHP not archived).

## Blockers / reclassifications

1. **PRG flash success is verified, not uncertain** (U02 / R11).
   PHP sets `$_SESSION['cbt_admin_flash']` then redirects. `fetch` follows
   redirects, so the final GET body contains
   `Question saved successfully (Question ID: X).` The regex is guaranteed to
   match under the supplied PHP.
2. **E/F → Option D is a hard target constraint** (U01 / R09), not a lossy bug.
   PHP hardcodes four options and validates exactly four; radios are 0–3.
   Collapsing E/F into D is the only server-valid behaviour.

## High-risk clarifications

3. **Advisory flags vs hard rejection** — flags are UI-advisory, but an empty
   option causes the PHP to reject with "Please fill in all four answer
   options." Ignoring flags = save failure.
4. **Media is out of scope** — no upload UI; `question_image`/`answer_video`
   are cleared. Media must be attached later via the native Edit UI.

## Nice-to-have

5. **Category hard limit** — dropdown query restricts to
   `is_active = 1 and id <= 10`; header fuzziness can only select from those.
6. **Exam year bounds** — PHP validates 1900–2100; a typo like `2O21` or an
   out-of-range extraction is rejected.

Relevance: confirms the server contract used by the parser/UI; does not add
parser code.
