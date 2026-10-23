# Phase 3 raw extraction — gap reports

Sources: `qwen-1-gaps.md`, `qwen-1-gaps2.md`, `qwen-2-gaps.md`.

These reports contain almost no new edge-case triggers; they state constraints
and clarifications that become invariants or status conflicts.

## Edge cases / boundary conditions stated

| ID | Short name | Trigger | Expected / claim | Source |
|---|---|---|---|---|
| G-EC01 | Session timeout | Server returns login page HTML | Detect `Administrator Login`; show targeted logout warning | qwen-1-gaps |
| G-EC02 | PRG success detection | POST redirects to GET with session flash | Final response contains `Question saved successfully (Question ID: N)`; regex guaranteed | qwen-2-gaps |
| G-EC03 | Empty option ignored | Parser leaves an option empty and user saves | PHP rejects: "Please fill in all four answer options." | qwen-2-gaps |
| G-EC04 | Media required | Question needs diagram/video | Cannot be created via bookmarklet; attach later in native Edit UI | qwen-2-gaps |
| G-EC05 | Category limit | DB has >10 active categories | Dropdown only shows `id <= 10`; matcher can only select those | qwen-2-gaps |
| G-EC06 | Year typo/out of range | Header `2O21` or extracted year outside bounds | PHP rejects: valid exam year 1900–2100 | qwen-2-gaps |

## Constraints stated (invariant candidates)

1. `fetch` body must remain `new FormData(form)` so the hidden `csrf_token` is
   included; manual JSON/URL-encoded payloads will be rejected.
2. Session expiry must be detected via `Administrator Login` in the response.
3. On success clear `question_image`, `answer_video`, `answer_explanation`;
   intentionally do **not** clear `is_active`.
4. `correct_option` radios use integer values 0–3 (A–D); letter values would
   silently break ticking.
5. Keep the sequence validator `if (last && (n <= last || n > last + 5)) continue;`.
6. Remove the already-painted `#ocr_input` `.admin-field` (and legacy
   `#ans_panel`), not only the script tag.
7. Complete localStorage key inventory: `ocrQueue`, `ocrMeta`, `ocrSubmitted`,
   `ansKey`.
8. CSS classes relied on: `admin-field`, `admin-btn`, `admin-btn-muted`,
   `admin-note`, `admin-alert`, `admin-error`.
9. `ocr_helper.js` is loaded at the bottom of the PHP file, which is why DOM
   cleanup is required.
10. E/F merging into D is a hard target constraint (four-option server) rather
    than a bug.
11. Server limits: 4 non-empty options, ≤500 chars, correct_option 0–3, year
    1900–2100, categories `id <= 10`, question/explanation ≤60000 chars.
12. `exam_category_id` is never auto-filled.

## Conflicts introduced by these reports

- PRG success: qwen-2-reconciled calls it uncertain; qwen-2-gaps calls it
  verified from PHP. Flagged as CONFLICTED.
- E/F handling: qwen-2-reconciled says lossy limitation; qwen-2-gaps says hard
  server constraint. Behavior is the same; framing conflicts.
