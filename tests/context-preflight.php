<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/tools/context-migration-contract.php';
require_once dirname(__DIR__) . '/tools/context-migration-inspector.php';

$passed = 0;
$failed = 0;

function pf_test(string $name, callable $fn): void
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

function pf_check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function pf_column(
    string $type,
    string $nullable = 'NO',
    mixed $default = null,
    string $extra = '',
    ?string $charset = null,
    ?string $collation = null,
    string $comment = ''
): array {
    return [
        'COLUMN_TYPE' => $type,
        'IS_NULLABLE' => $nullable,
        'COLUMN_DEFAULT' => $default,
        'EXTRA' => $extra,
        'CHARACTER_SET_NAME' => $charset,
        'COLLATION_NAME' => $collation,
        'COLUMN_COMMENT' => $comment,
    ];
}

function pf_valid_applied_snapshot(): array
{
    $utf8 = ['utf8mb4', 'utf8mb4_unicode_ci'];
    $columns = [
        'subjects' => [
            'id' => pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'subject_name' => pf_column('varchar(150)', 'NO', null, '', ...$utf8),
            'description' => pf_column('varchar(500)', 'YES', null, '', ...$utf8),
            'is_active' => pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
        ],
        'exam_category' => [
            'id' => pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'category_name' => pf_column('varchar(150)', 'NO', null, '', ...$utf8),
            'description' => pf_column('varchar(500)', 'YES', null, '', ...$utf8),
            'is_active' => pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
        ],
        'questions' => [
            'id' => pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'subject_id' => pf_column('int unsigned'),
            'exam_category_id' => pf_column('int unsigned'),
            'exam_year' => pf_column('smallint unsigned', 'NO', '2026'),
            'question_text' => pf_column('text', 'NO', null, '', ...$utf8),
            'question_image_path' => pf_column('varchar(255)', 'YES', null, '', ...$utf8),
            'option_a' => pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_b' => pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_c' => pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_d' => pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'correct_option' => pf_column('tinyint unsigned', 'NO', null, '', null, null, '0=A, 1=B, 2=C, 3=D'),
            'answer_explanation' => pf_column('text', 'YES', null, '', ...$utf8),
            'answer_video_path' => pf_column('varchar(255)', 'YES', null, '', ...$utf8),
            'is_active' => pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
            'practice_title' => pf_column('varchar(200)', 'NO', null, '', ...$utf8),
            'context_id' => pf_column('int unsigned', 'YES'),
            'context_position' => pf_column('smallint unsigned', 'YES'),
            'context_slot' => pf_column('smallint unsigned', 'YES'),
        ],
        'question_contexts' => [
            'id' => pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'context_type' => pf_column("enum('comprehension','cloze')", 'NO', null, '', ...$utf8),
            'title' => pf_column('varchar(200)', 'NO', null, '', ...$utf8),
            'context_text' => pf_column('mediumtext', 'NO', null, '', ...$utf8),
            'subject_id' => pf_column('int unsigned'),
            'exam_category_id' => pf_column('int unsigned'),
            'exam_year' => pf_column('smallint unsigned'),
            'expected_member_count' => pf_column('smallint unsigned'),
            'is_active' => pf_column('tinyint(1)', 'NO', '0'),
            'created_at' => pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
            'updated_at' => pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED on update CURRENT_TIMESTAMP'),
            'activated_at' => pf_column('timestamp', 'YES'),
            'idempotency_token' => pf_column('varchar(64)', 'YES', null, '', ...$utf8),
        ],
    ];
    $index = static fn(bool $unique, array $names): array => [
        'NON_UNIQUE' => $unique ? 0 : 1,
        'INDEX_TYPE' => 'BTREE',
        'IS_VISIBLE' => 'YES',
        'columns' => array_map(static fn(string $name): array => [
            'COLUMN_NAME' => $name,
            'SUB_PART' => null,
            'COLLATION' => 'A',
            'EXPRESSION' => null,
        ], $names),
    ];
    return [
        'session' => [
            'version' => '8.0.41',
            'database_name' => 'cbt_test',
            'connection_charset' => 'utf8mb4',
            'connection_collation' => 'utf8mb4_unicode_ci',
            'database_charset' => 'utf8mb4',
            'database_collation' => 'utf8mb4_unicode_ci',
        ],
        'tables' => [
            'subjects' => ['ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci'],
            'exam_category' => ['ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci'],
            'questions' => ['ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci'],
            'question_contexts' => ['ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci'],
        ],
        'columns' => $columns,
        'indexes' => [
            'subjects' => ['PRIMARY' => $index(true, ['id']), 'uq_subjects_subject_name' => $index(true, ['subject_name'])],
            'exam_category' => ['PRIMARY' => $index(true, ['id']), 'uq_exam_category_category_name' => $index(true, ['category_name'])],
            'questions' => [
                'PRIMARY' => $index(true, ['id']),
                'idx_questions_subject_id' => $index(false, ['subject_id']),
                'idx_questions_exam_category_id' => $index(false, ['exam_category_id']),
                'idx_questions_active' => $index(false, ['is_active']),
                'uq_questions_context_position' => $index(true, ['context_id', 'context_position']),
                'uq_questions_context_slot' => $index(true, ['context_id', 'context_slot']),
                'idx_questions_context' => $index(false, ['context_id']),
            ],
            'question_contexts' => [
                'PRIMARY' => $index(true, ['id']),
                'uq_context_idempotency_token' => $index(true, ['idempotency_token']),
                'idx_contexts_pool' => $index(false, ['subject_id', 'exam_category_id', 'exam_year']),
                'idx_contexts_active' => $index(false, ['is_active']),
                'idx_contexts_exam_category_id' => $index(false, ['exam_category_id']),
            ],
        ],
        'foreign_keys' => [
            'questions.fk_questions_context' => [
                'columns' => ['context_id'], 'referenced_schema' => 'cbt_test',
                'referenced_table' => 'question_contexts', 'referenced_columns' => ['id'],
                'UPDATE_RULE' => 'RESTRICT', 'DELETE_RULE' => 'RESTRICT',
            ],
            'question_contexts.fk_contexts_subject' => [
                'columns' => ['subject_id'], 'referenced_schema' => 'cbt_test',
                'referenced_table' => 'subjects', 'referenced_columns' => ['id'],
                'UPDATE_RULE' => 'RESTRICT', 'DELETE_RULE' => 'RESTRICT',
            ],
            'question_contexts.fk_contexts_exam_category' => [
                'columns' => ['exam_category_id'], 'referenced_schema' => 'cbt_test',
                'referenced_table' => 'exam_category', 'referenced_columns' => ['id'],
                'UPDATE_RULE' => 'RESTRICT', 'DELETE_RULE' => 'RESTRICT',
            ],
        ],
        'checks' => [],
        'creates' => [],
    ];
}

pf_test('exact applied metadata passes the production contract', function (): void {
    $result = cbt_pf_validate_snapshot(pf_valid_applied_snapshot());
    pf_check($result['errors'] === [], implode(' ', $result['errors']));
    pf_check($result['state'] === 'already applied (rerun safe)', 'applied state');
});

pf_test('wrong column types, indexes, and foreign key actions fail', function (): void {
    $vectors = [];
    $wrongType = pf_valid_applied_snapshot();
    $wrongType['columns']['subjects']['id']['COLUMN_TYPE'] = 'bigint unsigned';
    $vectors[] = [$wrongType, 'subjects.id'];
    $wrongIndex = pf_valid_applied_snapshot();
    $wrongIndex['indexes']['questions']['uq_questions_context_position']['NON_UNIQUE'] = 1;
    $vectors[] = [$wrongIndex, 'uq_questions_context_position'];
    $wrongOrder = pf_valid_applied_snapshot();
    $wrongOrder['indexes']['questions']['uq_questions_context_position']['columns'] = array_reverse(
        $wrongOrder['indexes']['questions']['uq_questions_context_position']['columns']
    );
    $vectors[] = [$wrongOrder, 'uq_questions_context_position'];
    $descending = pf_valid_applied_snapshot();
    $descending['indexes']['questions']['uq_questions_context_position']['columns'][1]['COLLATION'] = 'D';
    $vectors[] = [$descending, 'uq_questions_context_position'];
    $check = pf_valid_applied_snapshot();
    $check['checks']['questions']['chk_context_null'] = [
        'CHECK_CLAUSE' => '(`context_id` is null)',
        'ENFORCED' => 'YES',
    ];
    $vectors[] = [$check, 'unexpected CHECK constraint'];
    $cascade = pf_valid_applied_snapshot();
    $cascade['foreign_keys']['questions.fk_questions_context']['DELETE_RULE'] = 'CASCADE';
    $vectors[] = [$cascade, 'fk_questions_context'];

    foreach ($vectors as [$snapshot, $needle]) {
        $result = cbt_pf_validate_snapshot($snapshot);
        pf_check($result['errors'] !== [], $needle . ' should fail');
        pf_check(str_contains(implode(' ', $result['errors']), $needle), $needle . ' failure should be named');
    }
});

pf_test('connection collation and exact index and foreign key sets are enforced', function (): void {
    $vectors = [];
    $wrongCollation = pf_valid_applied_snapshot();
    $wrongCollation['session']['connection_collation'] = 'utf8mb4_0900_ai_ci';
    $vectors[] = [$wrongCollation, 'connection_collation'];
    $extraIndex = pf_valid_applied_snapshot();
    $extraIndex['indexes']['questions']['idx_unexpected'] = $extraIndex['indexes']['questions']['idx_questions_active'];
    $vectors[] = [$extraIndex, 'questions has an unexpected index set'];
    $extraForeignKey = pf_valid_applied_snapshot();
    $extraForeignKey['foreign_keys']['questions.fk_unexpected_context'] = [
        'columns' => ['context_id'], 'referenced_schema' => 'cbt_test',
        'referenced_table' => 'question_contexts', 'referenced_columns' => ['id'],
        'UPDATE_RULE' => 'RESTRICT', 'DELETE_RULE' => 'CASCADE',
    ];
    $vectors[] = [$extraForeignKey, 'unexpected foreign key set'];

    foreach ($vectors as [$snapshot, $needle]) {
        $result = cbt_pf_validate_snapshot($snapshot);
        pf_check($result['errors'] !== [], $needle . ' should fail');
        pf_check(str_contains(implode(' ', $result['errors']), $needle), $needle . ' failure should be named');
    }
});

pf_test('partial context schema is never reported ready', function (): void {
    $snapshot = pf_valid_applied_snapshot();
    unset($snapshot['columns']['questions']['context_slot']);
    $result = cbt_pf_validate_snapshot($snapshot);
    pf_check($result['state'] === 'PARTIAL/INCOMPATIBLE', 'partial state');
    pf_check($result['errors'] !== [], 'partial state errors');
});

pf_test('inspector groups ordered index and foreign key rows for the validator', function (): void {
    $snapshot = cbt_pf_snapshot_from_rows(
        ['version' => '8.0.41', 'database_name' => 'cbt_test'],
        [['TABLE_NAME' => 'questions', 'ENGINE' => 'InnoDB', 'TABLE_COLLATION' => 'utf8mb4_unicode_ci']],
        [],
        [
            ['TABLE_NAME' => 'questions', 'INDEX_NAME' => 'sample', 'NON_UNIQUE' => 0, 'SEQ_IN_INDEX' => 2, 'COLUMN_NAME' => 'b', 'SUB_PART' => null, 'COLLATION' => 'D', 'INDEX_TYPE' => 'BTREE', 'IS_VISIBLE' => 'YES', 'EXPRESSION' => null],
            ['TABLE_NAME' => 'questions', 'INDEX_NAME' => 'sample', 'NON_UNIQUE' => 0, 'SEQ_IN_INDEX' => 1, 'COLUMN_NAME' => 'a', 'SUB_PART' => null, 'COLLATION' => 'A', 'INDEX_TYPE' => 'BTREE', 'IS_VISIBLE' => 'YES', 'EXPRESSION' => null],
        ],
        [[
            'TABLE_NAME' => 'questions', 'CONSTRAINT_NAME' => 'fk_sample', 'COLUMN_NAME' => 'context_id',
            'ORDINAL_POSITION' => 1, 'REFERENCED_TABLE_SCHEMA' => 'cbt_test',
            'REFERENCED_TABLE_NAME' => 'question_contexts', 'REFERENCED_COLUMN_NAME' => 'id',
            'UPDATE_RULE' => 'RESTRICT', 'DELETE_RULE' => 'RESTRICT',
        ]],
        [],
        [[
            'TABLE_NAME' => 'questions', 'CONSTRAINT_NAME' => 'chk_context_null',
            'CHECK_CLAUSE' => '(`context_id` is null)', 'ENFORCED' => 'YES',
        ]]
    );
    pf_check($snapshot['indexes']['questions']['sample']['columns'][0]['COLUMN_NAME'] === 'a', 'index order');
    pf_check($snapshot['indexes']['questions']['sample']['columns'][1]['COLLATION'] === 'D', 'index direction');
    pf_check($snapshot['foreign_keys']['questions.fk_sample']['columns'] === ['context_id'], 'foreign key columns');
    pf_check(isset($snapshot['checks']['questions']['chk_context_null']), 'check constraints');
});

pf_test('real preflight connector failure exits nonzero without PREFLIGHT OK', function (): void {
    $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(dirname(__DIR__) . '/tools/context-migration-preflight.php');
    $environment = array_merge($_ENV, [
        'CBT_DB_HOST' => '127.0.0.1;port=1',
        'CBT_DB_NAME' => 'preflight_failure_probe',
        'CBT_DB_USER' => 'invalid',
        'CBT_DB_PASS' => 'invalid',
    ]);
    $pipes = [];
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, dirname(__DIR__), $environment);
    pf_check(is_resource($process), 'preflight process starts');
    $output = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);
    pf_check($status !== 0, 'connector failure must be nonzero');
    pf_check(!str_contains($output, 'PREFLIGHT OK'), 'connector failure must not report ready');
});

echo PHP_EOL . 'Summary' . PHP_EOL;
echo '  PASS: ' . $passed . PHP_EOL;
echo '  FAIL: ' . $failed . PHP_EOL;
exit($failed === 0 ? 0 : 1);
