<?php
/**
 * MySQL connection for the Skymenu CBT.
 * Set these values to match your hosting control panel/database credentials.
 */
$dbHost = getenv('CBT_DB_HOST') ?: '';
$dbName = getenv('CBT_DB_NAME') ?: '';
$dbUser = getenv('CBT_DB_USER') ?: '';
$dbPass = getenv('CBT_DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log('CBT database connection failed: ' . $e->getMessage());
    http_response_code(500);
    exit('The examination is temporarily unavailable. Please contact the site administrator.');
}