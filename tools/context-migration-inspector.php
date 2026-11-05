<?php
declare(strict_types=1);

function cbt_pf_snapshot_from_rows(
    array $session,
    array $tableRows,
    array $columnRows,
    array $indexRows,
    array $foreignKeyRows,
    array $creates,
    array $checkRows = []
): array {
    $tables = [];
    foreach ($tableRows as $row) {
        $tables[(string) $row['TABLE_NAME']] = [
            'ENGINE' => $row['ENGINE'] ?? null,
            'TABLE_COLLATION' => $row['TABLE_COLLATION'] ?? null,
        ];
    }
    $columns = [];
    foreach ($columnRows as $row) {
        $table = (string) $row['TABLE_NAME'];
        $name = (string) $row['COLUMN_NAME'];
        unset($row['TABLE_NAME'], $row['COLUMN_NAME'], $row['ORDINAL_POSITION']);
        $columns[$table][$name] = $row;
    }
    $groupedIndexes = [];
    foreach ($indexRows as $row) {
        $table = (string) $row['TABLE_NAME'];
        $name = (string) $row['INDEX_NAME'];
        $sequence = (int) $row['SEQ_IN_INDEX'];
        $groupedIndexes[$table][$name]['meta'] = [
            'NON_UNIQUE' => (int) $row['NON_UNIQUE'],
            'INDEX_TYPE' => (string) $row['INDEX_TYPE'],
            'IS_VISIBLE' => (string) $row['IS_VISIBLE'],
        ];
        $groupedIndexes[$table][$name]['columns'][$sequence] = [
            'COLUMN_NAME' => $row['COLUMN_NAME'],
            'SUB_PART' => $row['SUB_PART'],
            'COLLATION' => $row['COLLATION'],
            'EXPRESSION' => $row['EXPRESSION'],
        ];
    }
    $indexes = [];
    foreach ($groupedIndexes as $table => $tableIndexes) {
        foreach ($tableIndexes as $name => $index) {
            ksort($index['columns'], SORT_NUMERIC);
            $indexes[$table][$name] = $index['meta'] + ['columns' => array_values($index['columns'])];
        }
    }
    $groupedKeys = [];
    foreach ($foreignKeyRows as $row) {
        $name = (string) $row['TABLE_NAME'] . '.' . (string) $row['CONSTRAINT_NAME'];
        $sequence = (int) $row['ORDINAL_POSITION'];
        $groupedKeys[$name]['columns'][$sequence] = (string) $row['COLUMN_NAME'];
        $groupedKeys[$name]['referenced_columns'][$sequence] = (string) $row['REFERENCED_COLUMN_NAME'];
        $groupedKeys[$name]['referenced_schema'] = (string) $row['REFERENCED_TABLE_SCHEMA'];
        $groupedKeys[$name]['referenced_table'] = (string) $row['REFERENCED_TABLE_NAME'];
        $groupedKeys[$name]['UPDATE_RULE'] = (string) $row['UPDATE_RULE'];
        $groupedKeys[$name]['DELETE_RULE'] = (string) $row['DELETE_RULE'];
    }
    $foreignKeys = [];
    foreach ($groupedKeys as $name => $key) {
        ksort($key['columns'], SORT_NUMERIC);
        ksort($key['referenced_columns'], SORT_NUMERIC);
        $foreignKeys[$name] = [
            'columns' => array_values($key['columns']),
            'referenced_schema' => $key['referenced_schema'],
            'referenced_table' => $key['referenced_table'],
            'referenced_columns' => array_values($key['referenced_columns']),
            'UPDATE_RULE' => $key['UPDATE_RULE'],
            'DELETE_RULE' => $key['DELETE_RULE'],
        ];
    }
    $checks = [];
    foreach ($checkRows as $row) {
        $table = (string) $row['TABLE_NAME'];
        $name = (string) $row['CONSTRAINT_NAME'];
        $checks[$table][$name] = [
            'CHECK_CLAUSE' => (string) $row['CHECK_CLAUSE'],
            'ENFORCED' => (string) $row['ENFORCED'],
        ];
    }
    return compact('session', 'tables', 'columns', 'indexes', 'foreignKeys', 'checks', 'creates') + [
        'foreign_keys' => $foreignKeys,
    ];
}

function cbt_pf_collect_snapshot(PDO $pdo): array
{
    $session = $pdo->query(
        'SELECT VERSION() AS version, DATABASE() AS database_name,
                @@session.sql_mode AS sql_mode,
                @@character_set_connection AS connection_charset,
                @@collation_connection AS connection_collation,
                @@character_set_database AS database_charset,
                @@collation_database AS database_collation'
    )->fetch(PDO::FETCH_ASSOC) ?: [];
    $names = ['subjects', 'exam_category', 'exam_category2', 'questions', 'question_contexts'];
    $placeholders = implode(',', array_fill(0, count($names), '?'));
    $tableStmt = $pdo->prepare(
        'SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM information_schema.tables
         WHERE table_schema = DATABASE() AND TABLE_NAME IN (' . $placeholders . ')'
    );
    $tableStmt->execute($names);
    $tableRows = $tableStmt->fetchAll(PDO::FETCH_ASSOC);
    $columnStmt = $pdo->prepare(
        'SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE, IS_NULLABLE,
                COLUMN_DEFAULT, EXTRA, CHARACTER_SET_NAME, COLLATION_NAME, COLUMN_COMMENT
         FROM information_schema.columns
         WHERE table_schema = DATABASE() AND TABLE_NAME IN (' . $placeholders . ')
         ORDER BY TABLE_NAME, ORDINAL_POSITION'
    );
    $columnStmt->execute($names);
    $indexStmt = $pdo->prepare(
        'SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME,
                SUB_PART, COLLATION, INDEX_TYPE, IS_VISIBLE, EXPRESSION
         FROM information_schema.statistics
         WHERE table_schema = DATABASE() AND TABLE_NAME IN (' . $placeholders . ')
         ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX'
    );
    $indexStmt->execute($names);
    $foreignKeyStmt = $pdo->prepare(
        'SELECT k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME, k.ORDINAL_POSITION,
                k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
                r.UPDATE_RULE, r.DELETE_RULE
         FROM information_schema.KEY_COLUMN_USAGE k
         INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS r
            ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
           AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
         WHERE k.CONSTRAINT_SCHEMA = DATABASE() AND k.TABLE_NAME IN (' . $placeholders . ')
           AND k.REFERENCED_TABLE_NAME IS NOT NULL
         ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION'
    );
    $foreignKeyStmt->execute($names);
    $checkStmt = $pdo->prepare(
        'SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE, tc.ENFORCED
         FROM information_schema.TABLE_CONSTRAINTS tc
         INNER JOIN information_schema.CHECK_CONSTRAINTS cc
            ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
           AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
         WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.TABLE_NAME IN (' . $placeholders . ')
           AND tc.CONSTRAINT_TYPE = \'CHECK\'
         ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME'
    );
    $checkStmt->execute($names);
    $creates = [];
    foreach ($tableRows as $row) {
        $name = (string) $row['TABLE_NAME'];
        $create = $pdo->query('SHOW CREATE TABLE `' . $name . '`')->fetch(PDO::FETCH_NUM);
        $creates[$name] = (string) ($create[1] ?? '');
    }
    return cbt_pf_snapshot_from_rows(
        $session,
        $tableRows,
        $columnStmt->fetchAll(PDO::FETCH_ASSOC),
        $indexStmt->fetchAll(PDO::FETCH_ASSOC),
        $foreignKeyStmt->fetchAll(PDO::FETCH_ASSOC),
        $creates,
        $checkStmt->fetchAll(PDO::FETCH_ASSOC)
    );
}

function cbt_pf_print_report(array $snapshot, array $validation): void
{
    $session = $snapshot['session'];
    echo 'OT05 context migration preflight' . PHP_EOL;
    foreach ([
        'Server version' => 'version',
        'Database' => 'database_name',
        'Session SQL mode' => 'sql_mode',
        'Connection charset' => 'connection_charset',
        'Connection collation' => 'connection_collation',
        'Database charset' => 'database_charset',
        'Database collation' => 'database_collation',
    ] as $label => $key) {
        echo str_pad($label . ':', 28) . (string) ($session[$key] ?? '') . PHP_EOL;
    }
    foreach ($snapshot['tables'] as $name => $table) {
        echo PHP_EOL . 'Table ' . $name . ': engine=' . (string) $table['ENGINE']
            . ' collation=' . (string) $table['TABLE_COLLATION'] . PHP_EOL;
        echo 'SHOW CREATE TABLE ' . $name . ':' . PHP_EOL . ($snapshot['creates'][$name] ?? '') . PHP_EOL;
    }
    $practice = $snapshot['columns']['questions']['practice_title'] ?? null;
    if ($practice !== null) {
        echo PHP_EOL . 'Known mismatch (record only): questions.practice_title is '
            . (($practice['IS_NULLABLE'] ?? '') === 'NO' ? 'NOT NULL' : 'nullable')
            . ', default=' . (($practice['COLUMN_DEFAULT'] ?? null) === null ? 'NULL' : (string) $practice['COLUMN_DEFAULT'])
            . '. The supplied admin INSERT omits it; do not change it until the practice writer contract is known.' . PHP_EOL;
    }
    echo PHP_EOL . 'Context migration state: ' . $validation['state'] . PHP_EOL;
    foreach ($validation['errors'] as $error) {
        echo '[FAIL] ' . $error . PHP_EOL;
    }
    echo $validation['errors']
        ? 'PREFLIGHT FAILED (' . count($validation['errors']) . ' issue(s)). Fix them before migrating.' . PHP_EOL
        : 'PREFLIGHT OK' . PHP_EOL;
}
