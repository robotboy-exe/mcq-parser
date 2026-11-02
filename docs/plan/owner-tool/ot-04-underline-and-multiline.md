# OT04 — Underline and Multiline

- **Status:** blocked
- **Depends on:** OT03
- **Blocks:** OT06, OT08, OT09
- **External gate:** current `answer_details.php`
- **Release:** A
- **Intent:** [`../../../INTENT.md`](../../../INTENT.md)

## Goal

Ship safe underlining and deliberate multiline question/context presentation
without introducing a rich-text editor or the deferred math palette.

## Fixed behavior

- Keep `question_text` as a native textarea.
- Add one underline control and live candidate preview.
- Store exact `<u>` and `</u>` markers.
- Render only exact underline tags; arbitrary tags/attributes remain text.
- Preserve every manually entered newline.
- OCR collapses single wrap lines and preserves blank-line paragraphs.
- Question stems and contexts support formatting; options/explanations stay
  plain in this release.
- Expand year inference to 1900-2099.

## Work

1. Add source-backed failing fixtures for underline preservation, paragraph
   cleanup, 1994 inference, and uppercase `A)` regression.
2. Add a block-text cleaner that preserves paragraph boundaries after option
   positions are found; leave option cleaning single-line.
3. Add the minimal underline button, selection retention, keyboard shortcut,
   and preview to the readable owner-tool assets.
4. Dispatch preview updates after programmatic owner-tool fills and native form
   resets.
5. Add one shared client renderer for candidate question/context text using DOM
   text nodes and exact underline markers.
6. Add a matching safe PHP renderer for server-rendered detail output where
   needed; do not use permissive `strip_tags`.
7. Apply rendering and `white-space: pre-wrap` to both CBT pages, result review,
   print output, and `answer_details.php`.
8. Strip only exact underline markers from admin list summaries.
9. Audit XSS, malformed-tag, encoded-tag, Unicode, mobile selection, and undo
   behavior.

## Acceptance

| Check | Expected |
|---|---|
| Underline button/shortcut | Selected text is wrapped with exact `<u>` tags |
| Empty selection | Predictable caret placement; no malformed hidden markup |
| Preview | Typing, owner-tool fill, form reset, and edits update safely |
| Manual newlines | Stored and rendered exactly |
| OCR paragraphs | Single wraps fold; blank-line paragraphs remain |
| 1994 header | Year inferred as 1994; 20xx behavior unchanged |
| Candidate pages | Both CBT paths render underline and paragraphs |
| Result/detail/print | Same safe rendering rules; no literal supported tags |
| XSS probes | Scripts, attributes, other tags, and encoded tags render as text |
| Options/explanations | Remain plain text |
| Math palette | Absent and explicitly deferred |
| Browser | Desktop Chromium and Brave/Android formatting smoke recorded |

## Guardrails

- Never render stored question/context text as unrestricted `innerHTML`.
- Do not support arbitrary HTML, attributes, Markdown, or WYSIWYG content.
- Do not apply paragraph-preserving cleanup to option values.
- Do not bundle the P24 math palette.
- Do not start OT05.

## Handoff template

```text
Date:
Result:
Formatting syntax/security rule:
Parser fixtures and tests:
Candidate/detail outputs audited:
Desktop/mobile evidence:
Files changed:
Hashes:
Open questions:
Review: pending rigorous Release A review
Commit: deferred
Next: OT05 blocked/not started
```
