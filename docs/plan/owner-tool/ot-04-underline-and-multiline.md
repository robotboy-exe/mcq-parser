# OT04 — Underline and Multiline

- **Status:** not started
- **Depends on:** OT03
- **Blocks:** OT06, OT08, OT09
- **External gate:** none; current `answer_details.php` integration is deferred
  to OT10 if the source is unavailable at handoff
- **Release:** A implementation
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
5. Add shared client and PHP renderers using text nodes/escaping plus exact
   underline markers; do not use permissive `strip_tags`.
6. Apply rendering and `white-space: pre-wrap` to both supplied CBT pages,
   result review, and print output.
7. If `answer_details.php` is available before handoff, apply the same shared
   renderer there. Otherwise record its exact integration contract and leave
   the source-owned change and runtime verification to OT10.
8. Strip only exact underline markers from admin list summaries.
9. Audit XSS, malformed-tag, encoded-tag, Unicode, mobile selection, and undo
   behavior across the available paths.

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
| Result/print | Same safe rendering rules; no literal supported tags |
| Shared renderer | Exact underline tags only; reusable by server detail/context paths |
| Deferred detail source | Integration contract recorded for OT10 when `answer_details.php` is unavailable; no replacement page guessed |
| XSS probes | Scripts, attributes, other tags, and encoded tags render as text |
| Options/explanations | Remain plain text |
| Math palette | Absent and explicitly deferred |
| Browser | Desktop Chromium and Brave/Android formatting smoke recorded |

## Guardrails

- Never render stored question/context text as unrestricted `innerHTML`.
- Do not support arbitrary HTML, attributes, Markdown, or WYSIWYG content.
- Do not apply paragraph-preserving cleanup to option values.
- Do not create or infer `answer_details.php`; OT10 must integrate the supplied
  source before final release acceptance.
- Do not bundle the P24 math palette.
- Do not start OT05.

## Handoff template

```text
Date:
Result:
Formatting syntax/security rule:
Parser fixtures and tests:
Candidate/result/print outputs audited:
Answer-details integration status/contract:
Desktop/mobile evidence:
Files changed:
Hashes:
Open questions:
Review: pending rigorous Release A implementation review
Commit: deferred
Next: OT05 blocked/not started
```

## Rescope

On 2026-11-01 the owner moved unavailable `answer_details.php` integration from
the OT04 start/completion gate to OT10. OT04 can therefore implement and review
all source-backed formatting work now. The security rule is unchanged, and OT10
cannot complete final Release A acceptance until the supplied detail page uses
the same renderer and passes the detail-page probes.
