# qwen-1-gaps2.md — Inspection Notes (Phase 2)

Source: `archive/migration-docs/qwen-1-gaps2.md` (3759 bytes). No code snapshots.

Second gap report on the qwen-1 bundle. Contents:

- Blockers: none.
- High-risk gaps restated from `qwen-1-gaps.md`:
  1. FormData/CSRF dependency.
  2. Radio integer value mapping 0–3.
  3. `is_active` persistence (must not be cleared).
  4. Question-number sequence heuristic (`n <= last || n > last + 5`).
- Nice-to-have:
  - Complete localStorage key inventory: `ocrQueue`, `ocrMeta`, `ocrSubmitted`,
    `ansKey`.
  - Backend CSS class dependencies: `admin-field`, `admin-btn`,
    `admin-btn-muted`, `admin-note`, `admin-alert`, `admin-error`.
  - `ocr_helper.js` is loaded at the bottom of the PHP file; explains the DOM
    cleanup ordering.

Relevance: inventory and invariants only; no behavior claims beyond
`qwen-1-gaps.md`.
