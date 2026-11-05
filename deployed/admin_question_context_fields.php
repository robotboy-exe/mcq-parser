<?php if (!$contextSchemaAvailable): ?>
    <div class="admin-alert admin-error">Context tables are not available. Apply <code>deployed/sql/01-context-migration.sql</code> before saving or linking questions.</div>
<?php endif; ?>
<div class="admin-grid">
    <div class="admin-field">
        <label for="context_id">Shared Context (optional)</label>
        <select id="context_id" name="context_id">
            <option value="">Not linked</option>
            <?php foreach ($contexts as $contextOption): ?>
                <option value="<?php echo (int) $contextOption['id']; ?>" <?php echo ((string) $contextOption['id'] === $formValues['context_id']) ? 'selected' : ''; ?>>
                    #<?php echo (int) $contextOption['id']; ?> — <?php echo h(ucfirst((string) $contextOption['context_type'])); ?> — <?php echo h($contextOption['title']); ?>
                    (<?php echo h((string) ($contextOption['subject_name'] ?? 'subject?')); ?> / <?php echo h((string) ($contextOption['category_name'] ?? 'category?')); ?> / <?php echo (int) $contextOption['exam_year']; ?>)
                </option>
            <?php endforeach; ?>
        </select>
        <p class="admin-note">A linked question stays inactive. The context must use the same subject, exam category, and exam year.</p>
    </div>
    <div class="admin-field">
        <label for="context_position">Context Position</label>
        <input id="context_position" name="context_position" type="number" min="1" max="500" step="1" value="<?php echo h($formValues['context_position']); ?>" placeholder="Required when linked">
        <p class="admin-note">Unique within the context; activation requires positions 1 through the expected member count.</p>
    </div>
    <div class="admin-field">
        <label for="context_slot">Cloze Slot (optional)</label>
        <input id="context_slot" name="context_slot" type="number" min="1" max="999" step="1" value="<?php echo h($formValues['context_slot']); ?>" placeholder="Cloze contexts only">
        <p class="admin-note">Must match one <code>[[gap:N]]</code> token in the linked cloze context.</p>
    </div>
</div>
