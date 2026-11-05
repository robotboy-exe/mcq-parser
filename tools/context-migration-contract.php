<?php
declare(strict_types=1);

function cbt_pf_column(
    string $type, string $nullable = 'NO', mixed $default = null, string $extra = '',
    ?string $charset = null, ?string $collation = null,
    string $comment = ''
): array {
    return compact('type', 'nullable', 'default', 'extra', 'charset', 'collation', 'comment');
}

function cbt_pf_expected_columns(bool $applied): array
{
    $utf8 = ['utf8mb4', 'utf8mb4_unicode_ci'];
    $tables = [
        'subjects' => [
            'id' => cbt_pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'subject_name' => cbt_pf_column('varchar(150)', 'NO', null, '', ...$utf8),
            'description' => cbt_pf_column('varchar(500)', 'YES', null, '', ...$utf8),
            'is_active' => cbt_pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => cbt_pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
        ],
        'exam_category' => [
            'id' => cbt_pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'category_name' => cbt_pf_column('varchar(150)', 'NO', null, '', ...$utf8),
            'description' => cbt_pf_column('varchar(500)', 'YES', null, '', ...$utf8),
            'is_active' => cbt_pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => cbt_pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
        ],
        'questions' => [
            'id' => cbt_pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'subject_id' => cbt_pf_column('int unsigned'),
            'exam_category_id' => cbt_pf_column('int unsigned'),
            'exam_year' => cbt_pf_column('smallint unsigned', 'NO', '2026'),
            'question_text' => cbt_pf_column('text', 'NO', null, '', ...$utf8),
            'question_image_path' => cbt_pf_column('varchar(255)', 'YES', null, '', ...$utf8),
            'option_a' => cbt_pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_b' => cbt_pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_c' => cbt_pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'option_d' => cbt_pf_column('varchar(500)', 'NO', null, '', ...$utf8),
            'correct_option' => cbt_pf_column('tinyint unsigned', 'NO', null, '', null, null, '0=A, 1=B, 2=C, 3=D'),
            'answer_explanation' => cbt_pf_column('text', 'YES', null, '', ...$utf8),
            'answer_video_path' => cbt_pf_column('varchar(255)', 'YES', null, '', ...$utf8),
            'is_active' => cbt_pf_column('tinyint(1)', 'NO', '1'),
            'created_at' => cbt_pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
            'practice_title' => cbt_pf_column('varchar(200)', 'NO', null, '', ...$utf8),
        ],
    ];
    if ($applied) {
        $tables['questions'] += [
            'context_id' => cbt_pf_column('int unsigned', 'YES'),
            'context_position' => cbt_pf_column('smallint unsigned', 'YES'),
            'context_slot' => cbt_pf_column('smallint unsigned', 'YES'),
        ];
        $tables['question_contexts'] = [
            'id' => cbt_pf_column('int unsigned', 'NO', null, 'auto_increment'),
            'context_type' => cbt_pf_column("enum('comprehension','cloze')", 'NO', null, '', ...$utf8),
            'title' => cbt_pf_column('varchar(200)', 'NO', null, '', ...$utf8),
            'context_text' => cbt_pf_column('mediumtext', 'NO', null, '', ...$utf8),
            'subject_id' => cbt_pf_column('int unsigned'),
            'exam_category_id' => cbt_pf_column('int unsigned'),
            'exam_year' => cbt_pf_column('smallint unsigned'),
            'expected_member_count' => cbt_pf_column('smallint unsigned'),
            'is_active' => cbt_pf_column('tinyint(1)', 'NO', '0'),
            'created_at' => cbt_pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'),
            'updated_at' => cbt_pf_column('timestamp', 'NO', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED on update CURRENT_TIMESTAMP'),
            'activated_at' => cbt_pf_column('timestamp', 'YES'),
            'idempotency_token' => cbt_pf_column('varchar(64)', 'YES', null, '', ...$utf8),
        ];
    }
    return $tables;
}
function cbt_pf_index(bool $unique, array $columns): array
{
    return ['NON_UNIQUE' => $unique ? 0 : 1, 'INDEX_TYPE' => 'BTREE', 'IS_VISIBLE' => 'YES', 'columns' => $columns];
}

function cbt_pf_expected_indexes(bool $applied): array
{
    $indexes = [
        'subjects' => [
            'PRIMARY' => cbt_pf_index(true, ['id']),
            'uq_subjects_subject_name' => cbt_pf_index(true, ['subject_name']),
        ],
        'exam_category' => [
            'PRIMARY' => cbt_pf_index(true, ['id']),
            'uq_exam_category_category_name' => cbt_pf_index(true, ['category_name']),
        ],
        'questions' => [
            'PRIMARY' => cbt_pf_index(true, ['id']),
            'idx_questions_subject_id' => cbt_pf_index(false, ['subject_id']),
            'idx_questions_exam_category_id' => cbt_pf_index(false, ['exam_category_id']),
            'idx_questions_active' => cbt_pf_index(false, ['is_active']),
        ],
    ];
    if ($applied) {
        $indexes['questions'] += [
            'uq_questions_context_position' => cbt_pf_index(true, ['context_id', 'context_position']),
            'uq_questions_context_slot' => cbt_pf_index(true, ['context_id', 'context_slot']),
            'idx_questions_context' => cbt_pf_index(false, ['context_id']),
        ];
        $indexes['question_contexts'] = [
            'PRIMARY' => cbt_pf_index(true, ['id']),
            'uq_context_idempotency_token' => cbt_pf_index(true, ['idempotency_token']),
            'idx_contexts_pool' => cbt_pf_index(false, ['subject_id', 'exam_category_id', 'exam_year']),
            'idx_contexts_active' => cbt_pf_index(false, ['is_active']),
            'idx_contexts_exam_category_id' => cbt_pf_index(false, ['exam_category_id']),
        ];
    }
    return $indexes;
}
// REFERENTIAL_CONSTRAINTS supplies the exact ON UPDATE and ON DELETE rules.
function cbt_pf_expected_foreign_keys(string $database): array
{
    $key = static fn(array $columns, string $table): array => [
        'columns' => $columns,
        'referenced_schema' => $database,
        'referenced_table' => $table,
        'referenced_columns' => ['id'],
        'UPDATE_RULE' => 'RESTRICT',
        'DELETE_RULE' => 'RESTRICT',
    ];
    return [
        'questions.fk_questions_context' => $key(['context_id'], 'question_contexts'),
        'question_contexts.fk_contexts_subject' => $key(['subject_id'], 'subjects'),
        'question_contexts.fk_contexts_exam_category' => $key(['exam_category_id'], 'exam_category'),
    ];
}

function cbt_pf_normalize_default(mixed $value): mixed
{
    if (!is_string($value)) {
        return $value;
    }
    $normalized = strtoupper(trim($value));
    return in_array($normalized, ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()'], true)
        ? 'CURRENT_TIMESTAMP'
        : $value;
}
function cbt_pf_validate_snapshot(array $snapshot): array
{
    $errors = [];
    $session = $snapshot['session'] ?? [];
    $tables = $snapshot['tables'] ?? [];
    $columns = $snapshot['columns'] ?? [];
    $indexes = $snapshot['indexes'] ?? [];
    $foreignKeys = $snapshot['foreign_keys'] ?? [];
    if (preg_match('/^8\.0\.41(?:\D|$)/', (string) ($session['version'] ?? '')) !== 1) {
        $errors[] = 'Server version must be MySQL 8.0.41.';
    }
    foreach ([
        'connection_charset' => 'utf8mb4',
        'connection_collation' => 'utf8mb4_unicode_ci',
        'database_charset' => 'utf8mb4',
        'database_collation' => 'utf8mb4_unicode_ci',
    ] as $key => $expected) {
        if (($session[$key] ?? '') !== $expected) {
            $errors[] = $key . ' must be ' . $expected . '.';
        }
    }
    if (isset($tables['exam_category2'])) {
        $errors[] = 'exam_category2 must not exist.';
    }

    $contextNames = ['context_id', 'context_position', 'context_slot'];
    $presentContextColumns = array_intersect($contextNames, array_keys($columns['questions'] ?? []));
    $hasContextTable = isset($tables['question_contexts']);
    $applied = $hasContextTable && count($presentContextColumns) === 3;
    $state = !$hasContextTable && count($presentContextColumns) === 0
        ? 'not applied (ready)'
        : ($applied ? 'already applied (rerun safe)' : 'PARTIAL/INCOMPATIBLE');
    if ($state === 'PARTIAL/INCOMPATIBLE') {
        $errors[] = 'The context schema is partial or incompatible.';
    }

    $expectedColumns = cbt_pf_expected_columns($applied);
    foreach ($expectedColumns as $table => $tableColumns) {
        if (!isset($tables[$table])) {
            $errors[] = 'Required table ' . $table . ' is missing.';
            continue;
        }
        if (strcasecmp((string) ($tables[$table]['ENGINE'] ?? ''), 'InnoDB') !== 0
            || ($tables[$table]['TABLE_COLLATION'] ?? '') !== 'utf8mb4_unicode_ci') {
            $errors[] = 'Table ' . $table . ' has the wrong engine or collation.';
        }
        $actualNames = array_keys($columns[$table] ?? []);
        if ($actualNames !== array_keys($tableColumns)) {
            $errors[] = $table . ' has an unexpected column set or order.';
        }
        foreach ($tableColumns as $name => $expected) {
            $actual = $columns[$table][$name] ?? null;
            if ($actual === null) {
                $errors[] = $table . '.' . $name . ' is missing.';
                continue;
            }
            $actualValues = [
                strtolower((string) ($actual['COLUMN_TYPE'] ?? '')),
                (string) ($actual['IS_NULLABLE'] ?? ''),
                cbt_pf_normalize_default($actual['COLUMN_DEFAULT'] ?? null),
                strtolower(preg_replace('/\s+/', ' ', trim((string) ($actual['EXTRA'] ?? ''))) ?? ''),
                $actual['CHARACTER_SET_NAME'] ?? null,
                $actual['COLLATION_NAME'] ?? null,
                (string) ($actual['COLUMN_COMMENT'] ?? ''),
            ];
            $expectedValues = [
                strtolower($expected['type']), $expected['nullable'], cbt_pf_normalize_default($expected['default']),
                strtolower($expected['extra']), $expected['charset'], $expected['collation'], $expected['comment'],
            ];
            if ($actualValues !== $expectedValues) {
                $errors[] = $table . '.' . $name . ' has an incompatible COLUMN_TYPE, nullability, default, extra, charset, collation, or comment.';
            }
        }
    }
    foreach (cbt_pf_expected_indexes($applied) as $table => $tableIndexes) {
        $actualIndexes = $indexes[$table] ?? [];
        if (array_diff_key($actualIndexes, $tableIndexes) || array_diff_key($tableIndexes, $actualIndexes)) {
            $errors[] = $table . ' has an unexpected index set.';
        }
        foreach ($tableIndexes as $name => $expected) {
            $actual = $actualIndexes[$name] ?? null;
            $actualColumns = array_map(static fn(array $column): mixed =>
                ($column['SUB_PART'] ?? null) === null && ($column['EXPRESSION'] ?? null) === null
                    && strtoupper((string) ($column['COLLATION'] ?? '')) === 'A'
                    ? ($column['COLUMN_NAME'] ?? null) : null, $actual['columns'] ?? []);
            if ($actual === null || (int) ($actual['NON_UNIQUE'] ?? -1) !== $expected['NON_UNIQUE']
                || strtoupper((string) ($actual['INDEX_TYPE'] ?? '')) !== 'BTREE'
                || strtoupper((string) ($actual['IS_VISIBLE'] ?? '')) !== 'YES'
                || $actualColumns !== $expected['columns']) {
                $errors[] = $table . '.' . $name . ' has an incompatible NON_UNIQUE value, direction, or ordered column definition.';
            }
        }
    }
    foreach (($snapshot['checks'] ?? []) as $table => $tableChecks) {
        if ($tableChecks !== []) {
            $errors[] = $table . ' has an unexpected CHECK constraint set.';
        }
    }
    $expectedForeignKeys = $applied
        ? cbt_pf_expected_foreign_keys((string) ($session['database_name'] ?? '')) : [];
    if (array_diff_key($foreignKeys, $expectedForeignKeys) || array_diff_key($expectedForeignKeys, $foreignKeys)) {
        $errors[] = 'The schema has an unexpected foreign key set.';
    }
    foreach ($expectedForeignKeys as $name => $expected) {
        $actual = $foreignKeys[$name] ?? null;
        if ($actual === null || $actual !== $expected) {
            $errors[] = $name . ' has incompatible columns, reference, ON UPDATE, or ON DELETE rules.';
        }
    }
    return ['state' => $errors ? 'PARTIAL/INCOMPATIBLE' : $state, 'errors' => array_values(array_unique($errors))];
}
