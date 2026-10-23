Based on a diligent cross-reference between the provided `admin_questions.php` source code and the reconciled document, there are several areas where the document incorrectly marks hardcoded server behaviors as "uncertain," "risky," or "unresolved." 

Here are the necessary additions/corrections to fold into the gap report, backed by the PHP source code.

### Blockers

**1. Reclassify PRG Flash Message Detection (U02 / R11) from "Uncertain" to "Verified"**
*   **The Discrepancy:** The document marks the bookmarklet's success detection (`/Question saved successfully \(Question ID: (\d+)\)/`) as "uncertain" because the PHP uses a Post/Redirect/Get (PRG) flow, assuming the `fetch` response might not contain the string.
*   **The Fix/Artifact:** The PHP source explicitly sets `$_SESSION['cbt_admin_flash']` and redirects. Because the `fetch()` API follows redirects by default, the final response text *will* be the HTML of the redirected GET page, which contains `<div class="admin-alert admin-success" role="status">Question saved successfully (Question ID: X).</div>`. The regex is guaranteed to match. This is **not** an untested integration point; it is mathematically sound based on the provided PHP.

**2. Reclassify E/F Option Merging (U01 / R09) from "Lossy Risk/Bug" to "Hard Target Constraint"**
*   **The Discrepancy:** The document treats the merging of E/F options into Option D, and the `tick()` behavior for E/F, as a "lossy risk," an "unresolved issue," or a potential bug.
*   **The Fix/Artifact:** The PHP source hardcodes exactly four options (`option_a` through `option_d`) and validates `count(array_filter($options...)) !== 4`. The database schema and the form radios (`0` to `3`) strictly enforce a 4-option limit. Merging E/F into D is not a "bug" or a "compromise"; it is the **only valid behavior** to prevent the server from rejecting the submission. The doc must stop framing this as an unresolved defect.

### High-risk

**3. Clarify "Advisory Flags" vs. "Server-Side Hard Rejection"**
*   **The Discrepancy:** The document states that parser flags (like `option C missing`) are "advisory only" and "do not block saving." While true for the *bookmarklet's UI*, it omits the server-side consequence.
*   **The Fix/Artifact:** The PHP source contains a hard validation: `count(array_filter($options, static fn($value) => $value !== '')) !== 4`. If the parser leaves an option empty (triggering the `missing` flag) and the user ignores the warning and clicks Save, the PHP **will reject** the submission with the error: *"Please fill in all four answer options."* The bookmarklet's error handler will catch this, but the document must clarify that ignoring flags *will* result in a hard server-side save failure.

**4. Explicitly Document that Media Uploads are Out-of-Scope**
*   **The Discrepancy:** The document notes that the bookmarklet clears the `question_image` and `answer_video` file inputs after a save, but doesn't explicitly state the operational boundary this creates.
*   **The Fix/Artifact:** The bookmarklet provides no UI to select files and actively clears them (`['question_image','answer_video'].forEach(n=>{const el=form.elements[n];if(el)el.value='';});`). Therefore, any question requiring a diagram or answer video **cannot** be fully created via the bookmarklet. The operator must use the bookmarklet for the text/options, and then use the native PHP "Edit" UI to attach media. This is a strict workflow boundary, not a missing feature.

### Nice-to-have

**5. Note the `exam_category_id <= 10` Hard Limit**
*   **The Discrepancy:** The document mentions that categories must exist and be active, but misses a specific hardcoded limit in the PHP.
*   **The Fix/Artifact:** The PHP query explicitly restricts the dropdown: `SELECT id, category_name FROM exam_category WHERE is_active = 1 and id <= 10`. If the database contains more than 10 active categories, the native UI will only show the first 10. The bookmarklet's fuzzy header matcher will only ever be able to select from these first 10 categories. 

**6. Note the `exam_year` Hard Limits**
*   **The Discrepancy:** The document notes the year is inferred from the header, but doesn't mention the server's strict bounds.
*   **The Fix/Artifact:** The PHP validates `exam_year` between 1900 and 2100. If the OCR header contains a typo like `2O21` (letter O instead of zero) and the parser fails to extract a valid integer, or extracts a year outside this range, the server will reject it with *"Please enter a valid exam year between 1900 and 2100."*