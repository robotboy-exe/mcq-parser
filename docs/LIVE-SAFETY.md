# Live Site Safety

Read this before any browser session that can write to the live admin site.
The unit tests, mock browser harness, and parser fixtures do not exercise the
real admin page and are not a substitute for these rules.

## Hard rule

**By default, the agent does not delete or clean up live records.**

Test cleanup on the live site is owned by the site owner. If a package needs a
destructive live check, stop and ask for a staging environment or owner-run
cleanup. A package acceptance row, a request to "run the live check", or a
successful test does not authorize a live delete.

A live **read-only** check is allowed when the user authorizes it. A live
**write** needs per-action user approval naming the exact records and fields,
for example `Approved: delete #3841, #3842 only; no other records.` A
destructive live write is never implied by a broader approval; if the approval
is ambiguous, stop and ask.

## Why this rule exists

On 2026-10-27, an AS-12 cleanup used:

```js
document.querySelector('input[value=delete_question]').form.submit()
```

On an edit page, that selector found the first delete form in the page's
**Recent Questions** list, not the edited question. Calling `.submit()`
bypassed the per-row `onsubmit` confirmation:

```text
Delete question #N? This cannot be undone.
```

Six live Active Accounting questions were deleted: **#3795–#3800**. The server
uses a hard SQL `DELETE` and also removes the question's image/video files
(`archive/live-sources/admin_questions.php`), so the records could not be
restored from the app. Only truncated question stems and metadata survived in a
Playwright snapshot; options and correct answers did not.

## Required controls for any authorized live write

1. **Preflight the exact set.** Write down every target ID, its expected
   question text, and the expected count. Do not start if the set is uncertain.
2. **Scope to the row.** Find exactly one form whose
   `action=delete_question` and `question_id` equal the target ID. Abort if
   there are zero or multiple matches. Never use a first-match selector.
3. **Never submit a destructive form directly.** Do not call `.submit()` or
   `.requestSubmit()` on a delete form. Click that row's Delete button so the
   browser runs the site's confirmation.
4. **Assert the confirmation text.** The dialog must contain the exact
   `Delete question #<id>? This cannot be undone.` text. Dismiss and stop on any
   mismatch.
5. **Verify the result.** The redirected page must show
   `Question #<id> was deleted successfully.`, and `?edit=<id>` must no longer
   contain the question. Stop immediately on any other flash.
6. **One record at a time.** Do not continue after an anomaly, a missing form,
   a wrong ID, or an unexpected flash. Stop and report.
7. **Record the run.** Report the exact IDs attempted, the confirmation text,
   the flash text, and the postcondition for each ID.
8. **No agent cleanup.** Leave created test rows for the owner. Do not delete
   them "to be tidy". Cleanup is a separate, explicit operation, not the last
   step of a smoke test.

## Safe deletion procedure

Use this only when the owner explicitly authorizes the exact IDs and confirms a
recent backup or a staging environment. This procedure is for the owner or a
human operator; an agent needs its own explicit approval for the exact IDs and
must otherwise stop and ask.

1. Confirm the target list and count against the live list filter.
2. For each target ID:
   - Locate the row's delete form and assert exactly one match.
   - Click its Delete button.
   - Assert the dialog names that exact ID, then accept.
   - Assert the success flash names that exact ID.
   - Open `?edit=<id>` and assert the question is gone.
3. Stop on the first mismatch and report; do not continue with the remaining
   IDs.
4. Record the final list of deleted IDs and the current test-row IDs.

Do not use the edit page's Recently Added/Recent Questions list as a proxy for
the edited record. The edit page can show other rows with their own delete
forms.

## Test data

- Create test rows only with a unique, searchable marker and an
  owner-approved test label.
- Keep a local manifest of the exact created IDs and payloads: ID, marker,
  subject/category/year, and the question text used to identify the row.
- Prefer drafts/inactive test rows.
- Never infer "these are my test rows" from position, timestamps, or a filter
  alone. Match exact IDs.
- Cleanup is owner-only unless the procedure above is explicitly authorized for
  that exact set.

## Owner prerequisites

Before authorizing any destructive live test, the owner should have:

- A recent database backup and a tested restore path.
- A staging copy of the admin page/database, preferred for all destructive
  checks.
- An audit trail for deletes: ID, timestamp, operator, and the full row before
  deletion.
- A soft-delete/trash option or a deleted-questions backup table, because the
  current delete is permanent and removes media.
- A two-person rule for production deletes: one person lists and approves the
  exact IDs, another performs the delete.

Until a staging copy or verified backup exists, destructive live tests must not
run.

## Incident record

| ID | Recovered stem (server-truncated) |
|---|---|
| 3800 | When the buyer is undercharged, the seller forwards |
| 3799 | The trade debtors of a business are |
| 3798 | The concept which states that there are two sides to accounting entries is |
| 3797 | A person who lends his name to be used as a partner without any contribution of capital is a |
| 3796 | A feature of the income and expenditure account is that |
| 3795 | Gross profit is computed as |

All six were Accounting / WASCE / NECO / GCE / 2025 / Active. Test rows
**#3841–#3846** (CRS / JAMB / 2031) remain; they are not to be deleted by an
agent.
