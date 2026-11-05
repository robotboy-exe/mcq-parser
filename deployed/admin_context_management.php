<section class="admin-card">
    <div class="admin-topline">
        <h2><?php echo $editingContextId > 0 ? 'Edit Shared Context #' . (int) $editingContextId : 'Create a Shared Context'; ?></h2>
        <?php if ($editingContextId > 0): ?>
            <a class="admin-btn admin-btn-muted" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>" style="display:inline-block;text-decoration:none">Cancel Context Edit</a>
        <?php endif; ?>
    </div>
    <?php if (!$contextSchemaAvailable): ?>
        <div class="admin-alert admin-error">Context tables are not available. Apply <code>deployed/sql/01-context-migration.sql</code> and run the preflight before creating contexts.</div>
    <?php else: ?>
        <form method="post" autocomplete="off">
            <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
            <input type="hidden" name="action" value="<?php echo $editingContextId > 0 ? 'update_context' : 'save_context'; ?>">
            <?php if ($editingContextId > 0): ?>
                <input type="hidden" name="context_id" value="<?php echo (int) $editingContextId; ?>">
            <?php endif; ?>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_type">Context Type</label>
                    <select id="context_type" name="context_type" required>
                        <?php foreach (cbt_context_types() as $contextType): ?>
                            <option value="<?php echo h($contextType); ?>" <?php echo $contextValues['context_type'] === $contextType ? 'selected' : ''; ?>><?php echo h(ucfirst($contextType)); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="admin-field">
                    <label for="context_title">Context Title</label>
                    <input id="context_title" name="title" type="text" maxlength="200" value="<?php echo h($contextValues['title']); ?>" required>
                </div>
            </div>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_subject_id">Subject Pool</label>
                    <select id="context_subject_id" name="subject_id" required>
                        <option value="">-- Select Subject --</option>
                        <?php foreach ($subjects as $subject): ?>
                            <option value="<?php echo (int) $subject['id']; ?>" <?php echo ((string) $subject['id'] === (string) $contextValues['subject_id']) ? 'selected' : ''; ?>><?php echo h($subject['subject_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="admin-field">
                    <label for="context_exam_category_id">Exam Category Pool</label>
                    <select id="context_exam_category_id" name="exam_category_id" required>
                        <option value="">-- Select Exam Category --</option>
                        <?php foreach ($contextCategories as $category): ?>
                            <option value="<?php echo (int) $category['id']; ?>" <?php echo ((string) $category['id'] === (string) $contextValues['exam_category_id']) ? 'selected' : ''; ?>><?php echo h($category['category_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="admin-grid">
                <div class="admin-field">
                    <label for="context_exam_year">Exam Year Pool</label>
                    <input id="context_exam_year" name="exam_year" type="number" min="1900" max="2100" step="1" value="<?php echo h($contextValues['exam_year']); ?>" required>
                </div>
                <div class="admin-field">
                    <label for="expected_member_count">Expected Member Count</label>
                    <input id="expected_member_count" name="expected_member_count" type="number" min="1" max="500" step="1" value="<?php echo h($contextValues['expected_member_count']); ?>" required>
                    <p class="admin-note">Activation requires exactly this many linked questions with positions 1 through this count.</p>
                </div>
            </div>

            <div class="admin-field">
                <label for="context_text">Shared Context Text</label>
                <textarea id="context_text" name="context_text" maxlength="60000" required><?php echo "\n" . h($contextValues['context_text']); ?></textarea>
                <p class="admin-note">Use exact <code>&lt;u&gt;</code> / <code>&lt;/u&gt;</code> markers for underline. A cloze context uses <code>[[gap:N]]</code> tokens; the expected member count must equal the number of distinct tokens.</p>
            </div>

            <button class="admin-btn" type="submit"><?php echo $editingContextId > 0 ? 'Update Context' : 'Create Context'; ?></button>
            <p class="admin-note" style="margin-top:10px">A context stays inactive until it is validated and activated. Editing it, or editing/deleting a linked question, deactivates it again.</p>
        </form>
    <?php endif; ?>
</section>

<section class="admin-card">
    <h2>Shared Contexts</h2>
    <?php if (!$contextSchemaAvailable): ?>
        <p class="admin-note">No context listing is available until the migration is applied.</p>
    <?php elseif (!$contexts): ?>
        <p class="admin-note">No shared contexts have been created yet.</p>
    <?php else: ?>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Pool</th><th>Members</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                <?php foreach ($contexts as $contextItem): ?>
                    <?php
                        $contextMemberCount = (int) ($contextItem['member_count'] ?? 0);
                        $contextStatus = (string) ($contextItem['status_label'] ?? 'Status unavailable');
                        $contextIsActive = (int) $contextItem['is_active'] === 1;
                    ?>
                    <tr>
                        <td><?php echo (int) $contextItem['id']; ?></td>
                        <td><?php echo h(ucfirst((string) $contextItem['context_type'])); ?></td>
                        <td><?php echo h((string) $contextItem['title']); ?></td>
                        <td><?php echo h((string) ($contextItem['subject_name'] ?? '—')); ?> / <?php echo h((string) ($contextItem['category_name'] ?? '—')); ?> / <?php echo (int) $contextItem['exam_year']; ?></td>
                        <td><?php echo $contextMemberCount; ?> of <?php echo (int) $contextItem['expected_member_count']; ?></td>
                        <td><span class="admin-status <?php echo $contextIsActive ? 'active' : 'inactive'; ?>"><?php echo h($contextStatus); ?></span></td>
                        <td>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                                <a class="admin-btn admin-btn-edit" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?edit_context=<?php echo (int) $contextItem['id']; ?>" style="display:inline-block;text-decoration:none;padding:8px 11px">Edit</a>
                                <?php if ($contextIsActive): ?>
                                    <form method="post" style="margin:0">
                                        <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                        <input type="hidden" name="action" value="deactivate_context">
                                        <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                        <button class="admin-btn admin-btn-muted" type="submit" style="padding:8px 11px">Deactivate</button>
                                    </form>
                                <?php else: ?>
                                    <form method="post" style="margin:0">
                                        <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                        <input type="hidden" name="action" value="activate_context">
                                        <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                        <button class="admin-btn" type="submit" style="padding:8px 11px">Activate</button>
                                    </form>
                                <?php endif; ?>
                                <form method="post" onsubmit="return confirm('Delete context #<?php echo (int) $contextItem['id']; ?>? Linked questions block deletion.');" style="margin:0">
                                    <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                    <input type="hidden" name="action" value="delete_context">
                                    <input type="hidden" name="context_id" value="<?php echo (int) $contextItem['id']; ?>">
                                    <button class="admin-btn admin-btn-delete" type="submit" style="padding:8px 11px">Delete</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>
</section>
