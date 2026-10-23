# qwen-1-gaps.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/qwen-1-gaps.md` (3402 bytes). No code snapshots.

Gap report against the qwen-1 migration bundle. Unique technical details:

1. **CSRF / payload** — `fetch` uses `new FormData(form)`, which carries the
   hidden `csrf_token`. Manual JSON/URL-encoded payloads would drop it and be
   rejected ("session token is invalid").
2. **Session timeout** — server returns the login page HTML; bookmarklet
   checks `t.indexOf('Administrator Login') > -1` and shows a targeted logout
   warning.
3. **Form field clearing** — on success clears `question_image`,
   `answer_video`, `answer_explanation`; intentionally does **not** clear the
   `is_active` checkbox.
4. **Radio mapping** — `correct_option` values are integers `0..3` for A–D;
   `tick`/`fillForm` depend on `'ABCDEF'.indexOf(letter)`.
5. **Numbering guard** — `if (last && (n <= last || n > last + 5)) continue;`
   skips years/page/verse numbers and allows gaps up to 5.
6. **DOM cleanup** — must remove the already-painted `#ocr_input`
   `.admin-field` (and legacy `#ans_panel`), not only the script tag, to avoid
   duplicate UI and conflicting listeners.

Relevance: all six behaviors are present in the trusted variants and must be
preserved.
