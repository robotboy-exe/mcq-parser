<?php
declare(strict_types=1);

// OT05 admin integration tests. These execute the extracted context request
// handlers against SQLite and render the production PHP fragments.

require_once dirname(__DIR__) . '/deployed/admin_context.php';

$passed = 0;
$failed = 0;

function admin_test(string $name, callable $fn): void
{
    global $passed, $failed;
    try {
        $fn();
        $passed++;
        echo '[PASS] ' . $name . PHP_EOL;
    } catch (Throwable $error) {
        $failed++;
        echo '[FAIL] ' . $name . ' - ' . $error->getMessage() . PHP_EOL;
    }
}

function admin_check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function admin_same(mixed $actual, mixed $expected, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException(
            $message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
}

function admin_contains(string $haystack, string $needle, string $message): void
{
    if (strpos($haystack, $needle) === false) {
        throw new RuntimeException($message . ': missing ' . var_export($needle, true));
    }
}

final class AdminTestPdo extends PDO
{
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $query = preg_replace('/\s+FOR UPDATE\s*$/i', '', $query) ?? $query;
        return parent::prepare($query, $options);
    }
}

function admin_new_db(): AdminTestPdo
{
    $pdo = new AdminTestPdo('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec(
        'CREATE TABLE subjects (id INTEGER PRIMARY KEY, subject_name TEXT, is_active INTEGER)
         ;CREATE TABLE exam_category (id INTEGER PRIMARY KEY, category_name TEXT, is_active INTEGER)
         ;CREATE TABLE question_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, context_type TEXT, title TEXT, context_text TEXT,
            subject_id INTEGER, exam_category_id INTEGER, exam_year INTEGER,
            expected_member_count INTEGER, is_active INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            activated_at TEXT, idempotency_token TEXT
         )
          ;CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER, exam_category_id INTEGER,
            exam_year INTEGER, question_text TEXT, option_a TEXT, option_b TEXT, option_c TEXT,
            option_d TEXT, correct_option INTEGER, answer_explanation TEXT,
            answer_video_path TEXT, question_image_path TEXT, context_id INTEGER,
            context_position INTEGER, context_slot INTEGER, is_active INTEGER
          )'
    );
    $pdo->exec("INSERT INTO subjects (id, subject_name, is_active) VALUES (1, 'English', 1), (2, 'Maths', 1)");
    $pdo->exec("INSERT INTO exam_category (id, category_name, is_active) VALUES (1, 'UTME', 1), (2, 'Practice', 1)");
    return $pdo;
}

function admin_context_input(array $overrides = []): array
{
    return array_merge([
        'context_type' => CBT_CONTEXT_TYPE_COMPREHENSION,
        'title' => 'Reading passage',
        'context_text' => "First paragraph.\n\nSecond paragraph.",
        'subject_id' => '1',
        'exam_category_id' => '1',
        'exam_year' => '2024',
        'expected_member_count' => '1',
    ], $overrides);
}

function admin_insert_context(AdminTestPdo $pdo, array $overrides = []): int
{
    $values = admin_context_input($overrides);
    $stmt = $pdo->prepare(
        'INSERT INTO question_contexts
            (context_type, title, context_text, subject_id, exam_category_id, exam_year,
             expected_member_count, is_active, activated_at)
         VALUES
            (:context_type, :title, :context_text, :subject_id, :exam_category_id, :exam_year,
             :expected_member_count, :is_active, :activated_at)'
    );
    $stmt->execute([
        ':context_type' => $values['context_type'],
        ':title' => $values['title'],
        ':context_text' => $values['context_text'],
        ':subject_id' => $values['subject_id'],
        ':exam_category_id' => $values['exam_category_id'],
        ':exam_year' => $values['exam_year'],
        ':expected_member_count' => $values['expected_member_count'],
        ':is_active' => $overrides['is_active'] ?? 0,
        ':activated_at' => $overrides['activated_at'] ?? null,
    ]);
    return (int) $pdo->lastInsertId();
}

function admin_insert_question(AdminTestPdo $pdo, ?int $contextId = null, int $position = 1): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO questions
            (subject_id, exam_category_id, exam_year, question_text, option_a, option_b,
             option_c, option_d, correct_option, context_id, context_position, context_slot, is_active)
         VALUES (1, 1, 2024, :question_text, :option_a, :option_b, :option_c, :option_d,
                 0, :context_id, :context_position, NULL, 0)'
    );
    $stmt->execute([
        ':question_text' => 'What is the answer?',
        ':option_a' => 'A',
        ':option_b' => 'B',
        ':option_c' => 'C',
        ':option_d' => 'D',
        ':context_id' => $contextId,
        ':context_position' => $contextId === null ? null : $position,
    ]);
    return (int) $pdo->lastInsertId();
}

function admin_dispatch(AdminTestPdo $pdo, string $action, array $input): array
{
    return cbt_admin_dispatch_context_action($action, $input, static fn(): PDO => $pdo);
}

function admin_context_active(AdminTestPdo $pdo, int $contextId): int
{
    $stmt = $pdo->prepare('SELECT is_active FROM question_contexts WHERE id = :id');
    $stmt->execute([':id' => $contextId]);
    return (int) $stmt->fetchColumn();
}

function admin_question_values(array $overrides = []): array
{
    return array_merge([
        'subject_id' => 1,
        'exam_category_id' => 1,
        'exam_year' => 2024,
        'question_text' => 'Updated question?',
        'option_a' => 'A',
        'option_b' => 'B',
        'option_c' => 'C',
        'option_d' => 'D',
        'correct_option' => 0,
        'answer_explanation' => null,
        'answer_video_path' => null,
        'question_image_path' => null,
        'is_active' => 1,
    ], $overrides);
}

function admin_link_input(?int $contextId, string $position = '', string $slot = ''): array
{
    return [
        'context_id' => $contextId === null ? '' : (string) $contextId,
        'context_position' => $position,
        'context_slot' => $slot,
        'is_active' => '1',
    ];
}

admin_test('context action names are explicitly recognized', function (): void {
    foreach (['save_context', 'update_context', 'activate_context', 'deactivate_context', 'delete_context'] as $action) {
        admin_check(cbt_admin_is_context_action($action), $action . ' should be recognized');
    }
    admin_check(!cbt_admin_is_context_action('save_question'), 'question actions stay outside the context dispatcher');
});

admin_test('create and update dispatch preserve inactive PRG behavior', function (): void {
    $pdo = admin_new_db();
    $created = admin_dispatch($pdo, 'save_context', admin_context_input());
    admin_same($created['error'], '', 'create error');
    admin_check($created['redirect'], 'create redirects');
    admin_same($created['editing_context_id'], 1, 'created id');
    admin_same($created['flash'], 'Context #1 created. Link its members, then activate it.', 'create flash');
    admin_same((int) $pdo->query('SELECT is_active FROM question_contexts WHERE id = 1')->fetchColumn(), 0, 'created inactive');

    $pdo->exec("UPDATE question_contexts SET is_active = 1, activated_at = '2024-01-01 00:00:00' WHERE id = 1");
    $updated = admin_dispatch($pdo, 'update_context', admin_context_input([
        'context_id' => '1',
        'title' => 'Updated passage',
    ]));
    admin_same($updated['error'], '', 'update error');
    admin_check($updated['redirect'], 'update redirects');
    admin_same($updated['flash'], 'Context #1 updated. It is inactive until revalidated.', 'update flash');
    $row = $pdo->query('SELECT title, is_active, activated_at FROM question_contexts WHERE id = 1')->fetch();
    admin_same($row['title'], 'Updated passage', 'updated title');
    admin_same((int) $row['is_active'], 0, 'update deactivates');
    admin_same($row['activated_at'], null, 'update clears activation time');
});

admin_test('create and update validation failures preserve submitted values', function (): void {
    $pdo = admin_new_db();
    $invalid = admin_dispatch($pdo, 'save_context', admin_context_input(['title' => '  ']));
    admin_check(!$invalid['redirect'], 'invalid create does not redirect');
    admin_contains($invalid['error'], 'Please enter a context title.', 'create validation error');
    admin_same($invalid['context_values']['title'], '', 'normalized title round-trips');
    admin_same((int) $pdo->query('SELECT COUNT(*) FROM question_contexts')->fetchColumn(), 0, 'invalid create writes nothing');

    $missing = admin_dispatch($pdo, 'update_context', admin_context_input(['context_id' => '99']));
    admin_check(!$missing['redirect'], 'missing update does not redirect');
    admin_same($missing['editing_context_id'], 99, 'missing update keeps edit id');
    admin_same($missing['error'], 'That context no longer exists. Refresh the page and try again.', 'missing update error');
});

admin_test('context actions reject non-scalar input without warnings or writes', function (): void {
    $pdo = admin_new_db();
    set_error_handler(static function (int $severity, string $message): never {
        throw new ErrorException($message, 0, $severity);
    });
    try {
        $result = admin_dispatch($pdo, 'save_context', admin_context_input([
            'title' => ['Passage'],
            'context_text' => ['Text'],
        ]));
    } finally {
        restore_error_handler();
    }
    admin_check(!$result['redirect'], 'malformed context input does not redirect');
    admin_contains($result['error'], 'invalid submitted value', 'malformed context error');
    admin_same((int) $pdo->query('SELECT COUNT(*) FROM question_contexts')->fetchColumn(), 0, 'malformed input writes nothing');
});

admin_test('request integration preserves failed form state for page rendering', function (): void {
    $pdo = admin_new_db();
    $editingContextId = 0;
    $contextValues = cbt_admin_context_default_values();
    $pageError = '';
    cbt_admin_handle_context_request(
        'save_context',
        admin_context_input(['title' => '']),
        $editingContextId,
        $contextValues,
        $pageError,
        '/admin_questions.php',
        static fn(): PDO => $pdo
    );
    admin_same($editingContextId, 0, 'failed create edit id');
    admin_same($contextValues['title'], '', 'failed create values remain available');
    admin_contains($pageError, 'Please enter a context title.', 'failed create page error');
});

admin_test('create and update database failures return the existing messages', function (): void {
    $pdo = admin_new_db();
    $pdo->exec('DROP TABLE question_contexts');
    $create = admin_dispatch($pdo, 'save_context', admin_context_input());
    admin_same($create['error'], 'The context could not be saved. Check that the context migration has been imported and try again.', 'create database error');
    admin_check(!$create['redirect'], 'failed create does not redirect');

    $pdo2 = admin_new_db();
    $contextId = admin_insert_context($pdo2);
    $pdo2->exec('DROP TABLE subjects');
    $update = admin_dispatch($pdo2, 'update_context', admin_context_input(['context_id' => (string) $contextId]));
    admin_same($update['error'], 'The context could not be saved. Check that the context migration has been imported and try again.', 'update database error');
    admin_check(!$update['redirect'], 'failed update does not redirect');
});

admin_test('activation commits only a complete valid context', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo);
    admin_insert_question($pdo, $contextId);
    $activated = admin_dispatch($pdo, 'activate_context', ['context_id' => (string) $contextId]);
    admin_same($activated['error'], '', 'activation error');
    admin_check($activated['redirect'], 'activation redirects');
    admin_same(admin_context_active($pdo, $contextId), 1, 'context activated');
    admin_check(!$pdo->inTransaction(), 'activation commits its transaction');
    admin_same(
        $activated['flash'],
        'Context #' . $contextId . ' activated successfully. Linked questions remain hidden from the legacy candidate list.',
        'activation flash'
    );

    $invalidId = admin_dispatch($pdo, 'activate_context', ['context_id' => 'x']);
    admin_same($invalidId['error'], 'Please select a valid context to activate.', 'invalid activation id');
});

admin_test('activation validation and database failures roll back', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo);
    $invalid = admin_dispatch($pdo, 'activate_context', ['context_id' => (string) $contextId]);
    admin_check(!$invalid['redirect'], 'incomplete context does not redirect');
    admin_contains($invalid['error'], 'cannot be activated', 'activation validation prefix');
    admin_same(admin_context_active($pdo, $contextId), 0, 'incomplete context stays inactive');
    admin_check(!$pdo->inTransaction(), 'validation failure rolls back');

    $pdo2 = admin_new_db();
    $contextId2 = admin_insert_context($pdo2);
    $pdo2->exec('DROP TABLE questions');
    $failed = admin_dispatch($pdo2, 'activate_context', ['context_id' => (string) $contextId2]);
    admin_same($failed['error'], 'The context could not be activated. Please try again.', 'activation database error');
    admin_check(!$pdo2->inTransaction(), 'database failure rolls back');
    admin_same(admin_context_active($pdo2, $contextId2), 0, 'failed activation stays inactive');
});

admin_test('deactivation dispatch handles success, missing rows, invalid ids, and database failure', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo, ['is_active' => 1, 'activated_at' => '2024-01-01 00:00:00']);
    $deactivated = admin_dispatch($pdo, 'deactivate_context', ['context_id' => (string) $contextId]);
    admin_check($deactivated['redirect'], 'deactivation redirects');
    admin_same($deactivated['flash'], 'Context #' . $contextId . ' deactivated.', 'deactivation flash');
    admin_same(admin_context_active($pdo, $contextId), 0, 'context deactivated');

    $missing = admin_dispatch($pdo, 'deactivate_context', ['context_id' => '99']);
    admin_same($missing['flash'], 'No context was deactivated; it may already be missing.', 'missing deactivation flash');
    admin_check($missing['redirect'], 'missing deactivation still redirects');

    $invalid = admin_dispatch($pdo, 'deactivate_context', ['context_id' => '0']);
    admin_same($invalid['error'], 'Please select a valid context to deactivate.', 'invalid deactivation id');

    $pdo->exec('DROP TABLE question_contexts');
    $failed = admin_dispatch($pdo, 'deactivate_context', ['context_id' => '1']);
    admin_same($failed['error'], 'The context could not be deactivated. Please try again.', 'deactivation database error');
    admin_check(!$failed['redirect'], 'failed deactivation does not redirect');
});

admin_test('delete dispatch is restricted, reports missing rows, and handles database failure', function (): void {
    $pdo = admin_new_db();
    $blockedId = admin_insert_context($pdo);
    admin_insert_question($pdo, $blockedId);
    $blocked = admin_dispatch($pdo, 'delete_context', ['context_id' => (string) $blockedId]);
    admin_contains($blocked['error'], 'cannot be deleted while 1 linked question(s) exist', 'linked delete restriction');
    admin_check(!$blocked['redirect'], 'blocked delete does not redirect');

    $freeId = admin_insert_context($pdo);
    $deleted = admin_dispatch($pdo, 'delete_context', ['context_id' => (string) $freeId]);
    admin_check($deleted['redirect'], 'delete redirects');
    admin_same($deleted['flash'], 'Context #' . $freeId . ' was deleted successfully.', 'delete flash');

    $missing = admin_dispatch($pdo, 'delete_context', ['context_id' => '99']);
    admin_same($missing['flash'], 'No context was deleted; it may already have been removed.', 'missing delete flash');
    admin_check($missing['redirect'], 'missing delete still redirects');

    $pdo->exec('DROP TABLE questions');
    $failed = admin_dispatch($pdo, 'delete_context', ['context_id' => (string) $blockedId]);
    admin_same($failed['error'], 'The context could not be deleted. It may still be referenced by linked questions.', 'delete database error');
    admin_check(!$failed['redirect'], 'failed delete does not redirect');
});

admin_test('question context preparation preserves link validation', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo);
    $valid = cbt_admin_prepare_question_context($pdo, [
        'context_id' => (string) $contextId,
        'context_position' => '1',
        'context_slot' => '',
        'is_active' => '1',
    ], 0, 1, 1, 2024);
    admin_same($valid['error'], '', 'valid link error');
    admin_same($valid['context_id'], $contextId, 'valid link id');
    admin_same($valid['context_position'], 1, 'valid position');
    admin_same($valid['is_active'], 0, 'linked question is forced inactive');

    $standalone = cbt_admin_prepare_question_context($pdo, [
        'context_id' => '',
        'context_position' => '',
        'context_slot' => '',
        'is_active' => '1',
    ], 0, 1, 1, 2024);
    admin_same($standalone['is_active'], 1, 'standalone question keeps requested activation');

    $wrongPool = cbt_admin_prepare_question_context($pdo, [
        'context_id' => (string) $contextId,
        'context_position' => '1',
        'context_slot' => '',
    ], 0, 2, 1, 2024);
    admin_contains($wrongPool['error'], 'does not match the context', 'wrong pool error');

    $orphanPosition = cbt_admin_prepare_question_context($pdo, [
        'context_id' => '',
        'context_position' => '1',
        'context_slot' => '',
    ], 0, 1, 1, 2024);
    admin_contains($orphanPosition['error'], 'requires a selected context', 'orphan position error');
});

admin_test('question context preparation rejects malformed supplied link fields', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo);
    $cases = [
        ['context_id' => 'bogus', 'context_position' => '', 'context_slot' => ''],
        ['context_id' => '0', 'context_position' => '', 'context_slot' => ''],
        ['context_id' => '-1', 'context_position' => '', 'context_slot' => ''],
        ['context_id' => '1.0', 'context_position' => '', 'context_slot' => ''],
        ['context_id' => ['1'], 'context_position' => '', 'context_slot' => ''],
        ['context_id' => '', 'context_position' => 'bogus', 'context_slot' => ''],
        ['context_id' => '', 'context_position' => ['1'], 'context_slot' => ''],
        ['context_id' => (string) $contextId, 'context_position' => '1', 'context_slot' => '1.5'],
        ['context_id' => (string) $contextId, 'context_position' => '1', 'context_slot' => ['1']],
    ];
    foreach ($cases as $index => $input) {
        $input['is_active'] = '1';
        $result = cbt_admin_prepare_question_context($pdo, $input, 0, 1, 1, 2024);
        admin_check($result['error'] !== '', 'case ' . $index . ' should be rejected');
        admin_same($result['is_active'], 0, 'case ' . $index . ' must not preserve active publication');
    }
});

admin_test('context page data loads lists and preserves failed POST values', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo, ['title' => 'Stored passage']);
    $postedValues = cbt_context_normalize_input(admin_context_input(['title' => 'Failed update']));
    $postData = cbt_admin_context_page_data($pdo, [['id' => 1]], 'POST', [], 77, $postedValues);
    admin_same($postData['editing_context_id'], 77, 'POST edit id preserved');
    admin_same($postData['context_values']['title'], 'Failed update', 'POST values preserved');
    admin_check($postData['schema_available'], 'schema available');
    admin_same(count($postData['contexts']), 1, 'context list loaded');

    $getData = cbt_admin_context_page_data(
        $pdo,
        [['id' => 1]],
        'GET',
        ['edit_context' => (string) $contextId],
        0,
        cbt_admin_context_default_values()
    );
    admin_same($getData['editing_context_id'], $contextId, 'GET edit id');
    admin_same($getData['context_values']['title'], 'Stored passage', 'stored values loaded');

    $invalid = cbt_admin_context_page_data($pdo, [], 'GET', ['edit_context' => 'bad'], 0, cbt_admin_context_default_values());
    admin_same($invalid['error'], 'Invalid context selected for editing.', 'invalid edit query');
});

admin_test('context page data paginates ten per page and clamps context_page', function (): void {
    $pdo = admin_new_db();
    for ($number = 1; $number <= 12; $number++) {
        admin_insert_context($pdo, ['title' => 'Passage ' . $number]);
    }
    $pageTwo = cbt_admin_context_page_data(
        $pdo,
        [['id' => 1]],
        'GET',
        ['context_page' => '2'],
        0,
        cbt_admin_context_default_values()
    );
    admin_same($pageTwo['context_page'], 2, 'context page');
    admin_same($pageTwo['context_page_size'], 10, 'page size');
    admin_same($pageTwo['context_total'], 12, 'total contexts');
    admin_same($pageTwo['context_total_pages'], 2, 'total pages');
    admin_same(count($pageTwo['contexts']), 2, 'second-page rows');
    admin_same(count($pageTwo['context_options']), 12, 'question selector keeps every saved context');
    admin_same((int) $pageTwo['contexts'][0]['id'], 2, 'newest row on page two');
    $fieldHtml = cbt_admin_render_question_context_fields([
        'contextSchemaAvailable' => true,
        'contexts' => $pageTwo['contexts'],
        'contextOptions' => $pageTwo['context_options'],
        'formValues' => ['context_id' => '', 'context_position' => '', 'context_slot' => ''],
    ]);
    admin_contains($fieldHtml, 'Passage 12', 'selector includes a context outside the visible management page');

    $clamped = cbt_admin_context_page_data(
        $pdo,
        [],
        'GET',
        ['context_page' => '99'],
        0,
        cbt_admin_context_default_values()
    );
    admin_same($clamped['context_page'], 2, 'page clamps to the last page');
});

admin_test('context page preparation contains status query failures before rendering', function (): void {
    $pdo = admin_new_db();
    admin_insert_context($pdo);
    $pdo->exec('DROP TABLE questions');
    $data = cbt_admin_context_page_data(
        $pdo,
        [['id' => 1]],
        'POST',
        [],
        7,
        cbt_context_normalize_input(admin_context_input(['title' => 'Preserved']))
    );
    admin_check(!$data['schema_available'], 'failed status preparation marks the schema unavailable');
    admin_contains($data['error'], 'did not load', 'status preparation error');
    admin_same($data['editing_context_id'], 7, 'failed status preparation keeps edit id');
    admin_same($data['context_values']['title'], 'Preserved', 'failed status preparation keeps values');
});

admin_test('owner context payload executes the production list and member queries', function (): void {
    $pdo = admin_new_db();
    admin_same(cbt_admin_owner_context_payload(null), [], 'missing connection returns an empty payload');
    $contextId = admin_insert_context($pdo);
    admin_insert_question($pdo, $contextId, 1);
    $payload = cbt_admin_owner_context_payload($pdo);
    admin_same(count($payload), 1, 'one context is embedded');
    admin_same($payload[0]['context_id'], $contextId, 'context id is preserved');
    admin_same($payload[0]['title'], 'Reading passage', 'context title is preserved');
    admin_same($payload[0]['title_key'], 'reading passage', 'normalized title identity is embedded');
    admin_same($payload[0]['text_key'], 'first paragraph. second paragraph.', 'normalized text identity is embedded');
    admin_same($payload[0]['subject_id'], '1', 'context subject is preserved');
    admin_same($payload[0]['exam_category_id'], '1', 'context exam is preserved');
    admin_same($payload[0]['exam_year'], '2024', 'context year is preserved');
    admin_same($payload[0]['member_count'], 1, 'member count is preserved');
    admin_same($payload[0]['slots'], [], 'reading passage has no gap slots');
    admin_same(count($payload[0]['members']), 1, 'one member is embedded');
    admin_same($payload[0]['members'][0]['question_text'], 'What is the answer?', 'member text is preserved');
    admin_same($payload[0]['members'][0]['context_position'], '1', 'member position is preserved');
    $scripts = cbt_admin_owner_payload_scripts($pdo, true);
    admin_contains($scripts, 'id="owner_tool_context_data"', 'context payload script is rendered');
    admin_contains($scripts, 'id="owner_tool_recent_questions"', 'recent-question payload script is rendered');
    admin_contains(cbt_admin_owner_payload_scripts(null, false), '>[]</script>', 'edit mode embeds empty payloads');

    $empty = new AdminTestPdo('sqlite::memory:');
    $empty->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    admin_same(cbt_admin_owner_context_payload($empty), [], 'missing schema is contained');
});

admin_test('owner context payload carries cloze slots and recent questions are capped at twenty', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo, [
        'context_type' => CBT_CONTEXT_TYPE_CLOZE,
        'context_text' => 'One [[gap:72]] and [[gap:71]].',
        'expected_member_count' => '2',
    ]);
    $payload = cbt_admin_owner_context_payload($pdo);
    admin_same($payload[0]['context_id'], $contextId, 'cloze context id');
    admin_same($payload[0]['slots'], [71, 72], 'sorted cloze slots are embedded');
    admin_same(cbt_admin_owner_text_key(" A <u>Word</u>\n B "), 'a word b', 'identity ignores exact underline markers');

    for ($number = 1; $number <= 22; $number++) {
        admin_insert_question($pdo);
    }
    $recent = cbt_admin_owner_recent_questions($pdo);
    admin_same(count($recent), 20, 'recent payload is capped');
    admin_same((int) $recent[0]['id'], 22, 'recent payload starts with newest question');
    admin_same((int) $recent[19]['id'], 3, 'recent payload ends at the twentieth newest question');
    admin_check(!array_key_exists('correct_option', $recent[0]), 'correct answer is excluded');
    admin_check(!array_key_exists('answer_explanation', $recent[0]), 'explanation is excluded');
    admin_check(!array_key_exists('question_image_path', $recent[0]), 'media is excluded');
});

admin_test('real link, move, unlink, and delete paths deactivate actual affected contexts', function (): void {
    $pdo = admin_new_db();
    $contextA = admin_insert_context($pdo, ['title' => 'A', 'is_active' => 1]);
    $contextB = admin_insert_context($pdo, ['title' => 'B', 'is_active' => 1]);
    $questionId = admin_insert_question($pdo);

    cbt_admin_mutate_question(
        $pdo,
        'update_question',
        $questionId,
        admin_question_values(),
        admin_link_input($contextA, '1'),
        null
    );
    admin_same(admin_context_active($pdo, $contextA), 0, 'link deactivates new context');

    $pdo->exec('UPDATE question_contexts SET is_active = 1 WHERE id IN (' . $contextA . ', ' . $contextB . ')');
    cbt_admin_mutate_question(
        $pdo,
        'update_question',
        $questionId,
        admin_question_values(),
        admin_link_input($contextB, '1'),
        $contextA
    );
    admin_same(admin_context_active($pdo, $contextA), 0, 'move deactivates old context');
    admin_same(admin_context_active($pdo, $contextB), 0, 'move deactivates new context');

    $pdo->exec('UPDATE question_contexts SET is_active = 1 WHERE id = ' . $contextB);
    cbt_admin_mutate_question(
        $pdo,
        'update_question',
        $questionId,
        admin_question_values(),
        admin_link_input(null),
        $contextA
    );
    admin_same(admin_context_active($pdo, $contextB), 0, 'stale-hint unlink deactivates the actual old context');

    $pdo->exec('UPDATE questions SET context_id = ' . $contextB . ', context_position = 1 WHERE id = ' . $questionId);
    $pdo->exec('UPDATE question_contexts SET is_active = 1 WHERE id = ' . $contextB);
    $deleted = cbt_admin_delete_question($pdo, $questionId, $contextA);
    admin_same($deleted['deleted_rows'], 1, 'real delete removes the question');
    admin_same(admin_context_active($pdo, $contextB), 0, 'delete deactivates linked context');
});

admin_test('real question mutation and context deactivation roll back together', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo, ['is_active' => 1]);
    $questionId = admin_insert_question($pdo);

    $pdo->exec(
        'CREATE TRIGGER fail_context_deactivation
         BEFORE UPDATE OF is_active ON question_contexts
         WHEN OLD.id = ' . $contextId . ' AND NEW.is_active = 0
         BEGIN SELECT RAISE(ABORT, \'forced deactivation failure\'); END'
    );
    try {
        cbt_admin_mutate_question(
            $pdo,
            'update_question',
            $questionId,
            admin_question_values(),
            admin_link_input($contextId, '1'),
            null
        );
        throw new RuntimeException('forced mutation failure was not raised');
    } catch (PDOException $error) {
        admin_contains($error->getMessage(), 'forced deactivation failure', 'forced rollback error');
    }

    admin_same(admin_context_active($pdo, $contextId), 1, 'rollback restores context activation');
    admin_same($pdo->query('SELECT context_id FROM questions WHERE id = ' . $questionId)->fetchColumn(), null, 'rollback restores question link');
});

admin_test('real question delete and context deactivation roll back together', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo, ['is_active' => 1]);
    $questionId = admin_insert_question($pdo, $contextId);
    $pdo->exec(
        'CREATE TRIGGER fail_delete_deactivation
         BEFORE UPDATE OF is_active ON question_contexts
         WHEN OLD.id = ' . $contextId . ' AND NEW.is_active = 0
         BEGIN SELECT RAISE(ABORT, \'forced delete deactivation failure\'); END'
    );
    try {
        cbt_admin_delete_question($pdo, $questionId, $contextId);
        throw new RuntimeException('forced delete failure was not raised');
    } catch (PDOException $error) {
        admin_contains($error->getMessage(), 'forced delete deactivation failure', 'forced delete rollback error');
    }
    admin_same(admin_context_active($pdo, $contextId), 1, 'delete rollback restores activation');
    admin_same((int) $pdo->query('SELECT COUNT(*) FROM questions WHERE id = ' . $questionId)->fetchColumn(), 1, 'delete rollback restores question');
});

function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function admin_assert_no_nested_forms(string $html): void
{
    preg_match_all('/<\/?form\b[^>]*>/i', $html, $matches);
    $depth = 0;
    foreach ($matches[0] as $tag) {
        if (str_starts_with(strtolower($tag), '</form')) {
            $depth--;
            admin_check($depth >= 0, 'form closed without an opener');
        } else {
            $depth++;
            admin_check($depth <= 1, 'rendered forms must not be nested');
        }
    }
    admin_same($depth, 0, 'all rendered forms close');
}

admin_test('rendered context forms keep selectors and never nest forms', function (): void {
    $pdo = admin_new_db();
    $contextId = admin_insert_context($pdo);
    $contexts = cbt_context_list($pdo);
    $formValues = array_merge([
        'context_id' => '',
        'context_position' => '',
        'context_slot' => '',
    ], cbt_admin_context_default_values());
    $fieldHtml = cbt_admin_render_question_context_fields([
        'contextSchemaAvailable' => true,
        'contexts' => $contexts,
        'formValues' => $formValues,
    ]);
    $_SESSION['cbt_admin_csrf'] = 'test-token';
    $_SERVER['SCRIPT_NAME'] = '/admin_questions.php';
    $managementHtml = cbt_admin_render_context_management([
        'pdo' => $pdo,
        'editingContextId' => 0,
        'contextSchemaAvailable' => true,
        'contextValues' => cbt_admin_context_default_values(),
        'contexts' => $contexts,
        'subjects' => [['id' => 1, 'subject_name' => 'English']],
        'contextCategories' => [['id' => 1, 'category_name' => 'UTME']],
    ]);
    $html = '<form id="question-form">' . $fieldHtml . '</form>' . $managementHtml;
    admin_assert_no_nested_forms($html);

    $pairs = [
        'context_id' => 'context_id',
        'context_position' => 'context_position',
        'context_slot' => 'context_slot',
        'context_type' => 'context_type',
        'context_title' => 'title',
        'context_subject_id' => 'subject_id',
        'context_exam_category_id' => 'exam_category_id',
        'context_exam_year' => 'exam_year',
        'expected_member_count' => 'expected_member_count',
        'context_text' => 'context_text',
    ];
    foreach ($pairs as $id => $name) {
        admin_check(
            preg_match('/\bid="' . preg_quote($id, '/') . '"[^>]*\bname="' . preg_quote($name, '/') . '"/', $html) === 1,
            'missing selector id=' . $id . ' name=' . $name
        );
    }
    foreach (['save_context', 'activate_context', 'delete_context'] as $action) {
        admin_contains($html, 'value="' . $action . '"', 'rendered action ' . $action);
    }
    admin_contains($html, 'id="shared_context_editor"', 'single shared-context editor card');
    admin_contains($html, 'owner-context-editor-draft', 'new shared-text form has draft mode styling');
    admin_contains($html, '>New Shared Text</h2>', 'new shared-text form has draft heading');
    admin_contains($html, 'New text - draft mode', 'new shared-text form has draft badge');
    admin_contains($html, 'id="owner_context_link_fields"', 'semantic shared-text link group');
    admin_contains($html, '<legend>Shared text for this question</legend>', 'plain link group heading');
    admin_contains($html, '<label for="context_id">Shared text</label>', 'plain shared-text label');
    admin_contains($html, '<label for="context_position">Passage question number</label>', 'plain passage number label');
    admin_contains($html, '<label for="context_slot">Gap number</label>', 'plain gap label');
    admin_contains($html, 'id="owner_context_targets"', 'browser queue target field');
    admin_contains($html, 'List question numbers in order.', 'short target instruction');
    admin_contains($html, '>Edit</a>', 'saved shared-text action says Edit');
    admin_check(!str_contains($html, 'Add this many questions, numbered from 1.'), 'expected-count helper is removed');
    admin_check(
        preg_match('/\bid="owner_context_targets"[^>]*\bname=/', $html) === 0,
        'browser queue target field is not posted'
    );
    foreach (['Subject Pool', 'Exam Category Pool', 'Exam Year Pool'] as $oldLabel) {
        admin_check(!str_contains($html, $oldLabel), 'old numeric pool label removed: ' . $oldLabel);
    }
    foreach (['Context Position', 'Cloze Slot', 'Expected Member Count', 'Shared Context Text'] as $oldLabel) {
        admin_check(!str_contains($html, $oldLabel), 'owner-facing jargon removed: ' . $oldLabel);
    }

    $pdo->exec('UPDATE question_contexts SET is_active = 1 WHERE id = ' . $contextId);
    $activeHtml = cbt_admin_render_context_management([
        'pdo' => $pdo,
        'editingContextId' => 0,
        'contextSchemaAvailable' => true,
        'contextValues' => cbt_admin_context_default_values(),
        'contexts' => cbt_context_list($pdo),
        'subjects' => [['id' => 1, 'subject_name' => 'English']],
        'contextCategories' => [['id' => 1, 'category_name' => 'UTME']],
    ]);
    admin_contains($activeHtml, 'value="deactivate_context"', 'rendered deactivate action');
});

admin_test('rendered shared-text list preserves independent pagination and edit page', function (): void {
    $pdo = admin_new_db();
    for ($number = 1; $number <= 12; $number++) {
        admin_insert_context($pdo, ['title' => 'Passage ' . $number]);
    }
    $data = cbt_admin_context_page_data(
        $pdo,
        [['id' => 1]],
        'GET',
        ['context_page' => '2'],
        0,
        cbt_admin_context_default_values()
    );
    $_SESSION['cbt_admin_csrf'] = 'test-token';
    $_SERVER['SCRIPT_NAME'] = '/admin_questions.php';
    $html = cbt_admin_render_context_management([
        'editingContextId' => 0,
        'contextSchemaAvailable' => true,
        'contextValues' => $data['context_values'],
        'contexts' => $data['contexts'],
        'contextPage' => $data['context_page'],
        'contextTotal' => $data['context_total'],
        'contextTotalPages' => $data['context_total_pages'],
        'contextPageSize' => $data['context_page_size'],
        'subjects' => [['id' => 1, 'subject_name' => 'English']],
        'contextCategories' => [['id' => 1, 'category_name' => 'UTME']],
    ]);
    admin_contains($html, 'Showing 11–12 of 12 shared texts', 'page summary');
    admin_contains($html, '?context_page=1', 'previous page link');
    admin_contains($html, 'edit_context=2&amp;context_page=2', 'edit link keeps context page');

    $editingHtml = cbt_admin_render_context_management([
        'editingContextId' => 2,
        'contextSchemaAvailable' => true,
        'contextValues' => cbt_admin_context_default_values(),
        'contexts' => $data['contexts'],
        'contextPage' => 2,
        'contextTotal' => 12,
        'contextTotalPages' => 2,
        'contextPageSize' => 10,
        'subjects' => [['id' => 1, 'subject_name' => 'English']],
        'contextCategories' => [['id' => 1, 'category_name' => 'UTME']],
    ]);
    admin_contains($editingHtml, 'Editing shared text #2', 'editing status copy');
    admin_contains($editingHtml, 'owner-context-editor-edit', 'saved shared-text form has edit mode styling');
    admin_contains($editingHtml, '>Edit Saved Shared Text</h2>', 'saved shared-text form has edit heading');
    admin_contains($editingHtml, 'Saved text #2 - edit mode', 'saved shared-text form has edit badge');
    admin_contains($editingHtml, '?context_page=2', 'cancel link keeps context page');
});

admin_test('failed context rendering preserves selected pools and a leading newline', function (): void {
    $pdo = admin_new_db();
    $contextValues = cbt_context_normalize_input(admin_context_input([
        'context_text' => "\nLeading line",
    ]));
    $_SESSION['cbt_admin_csrf'] = 'test-token';
    $_SERVER['SCRIPT_NAME'] = '/admin_questions.php';
    $html = cbt_admin_render_context_management([
        'editingContextId' => 0,
        'contextSchemaAvailable' => true,
        'contextValues' => $contextValues,
        'contexts' => [],
        'subjects' => [['id' => 1, 'subject_name' => 'English']],
        'contextCategories' => [['id' => 1, 'category_name' => 'UTME']],
    ]);
    admin_check(preg_match('/<option value="1" selected>English<\/option>/', $html) === 1, 'subject remains selected');
    admin_check(preg_match('/<option value="1" selected>UTME<\/option>/', $html) === 1, 'category remains selected');
    admin_contains($html, 'required>' . "\n\n" . 'Leading line</textarea>', 'sacrificial and genuine leading LF');
});

echo PHP_EOL . 'Summary' . PHP_EOL;
echo '  PASS: ' . $passed . PHP_EOL;
echo '  FAIL: ' . $failed . PHP_EOL;
exit($failed === 0 ? 0 : 1);
