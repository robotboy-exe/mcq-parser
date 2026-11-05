<?php
declare(strict_types=1);

// OT05 CLI preflight. Exit 0 requires exact supplied base metadata or the exact
// applied context schema, including questions.practice_title reporting.

$root = dirname(__DIR__);
require_once __DIR__ . '/context-migration-contract.php';
require_once __DIR__ . '/context-migration-inspector.php';

$connectionReady = false;
register_shutdown_function(static function () use (&$connectionReady): void {
    if (!$connectionReady) {
        fwrite(STDERR, PHP_EOL . '[FAIL] Database connection failed before preflight.' . PHP_EOL);
        exit(1);
    }
});

try {
    require $root . '/db_conn.php';
    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new RuntimeException('The database connector did not provide PDO.');
    }
    $connectionReady = true;
    $snapshot = cbt_pf_collect_snapshot($pdo);
    $validation = cbt_pf_validate_snapshot($snapshot);
    cbt_pf_print_report($snapshot, $validation);
    exit($validation['errors'] ? 1 : 0);
} catch (Throwable $error) {
    $connectionReady = true;
    fwrite(STDERR, '[FAIL] Preflight failed: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
