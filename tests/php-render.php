<?php
declare(strict_types=1);

require_once __DIR__ . '/../deployed/render.php';

// The shared vector table is the single source of truth for JS/PHP parity.
$fixture = json_decode((string) file_get_contents(__DIR__ . '/fixtures/render-markup.json'), true);
if (!is_array($fixture) || ($fixture['schema_version'] ?? 0) !== 1 || !is_array($fixture['cases'] ?? null)) {
    throw new RuntimeException('render-markup fixture must be schema_version 1 with cases');
}

$checked = 0;
foreach ($fixture['cases'] as $case) {
    $name = (string) ($case['name'] ?? 'unnamed');
    $input = (string) ($case['input'] ?? '');
    if (cbt_format_text($input) !== (string) $case['format']) {
        throw new RuntimeException('format case failed: ' . $name);
    }
    if (cbt_strip_formatting($input) !== (string) $case['strip']) {
        throw new RuntimeException('strip case failed: ' . $name);
    }
    $checked++;
}

// The underline segmentation helper is kept for existing callers.
$segments = cbt_text_segments('<u>one <u>two</u>');
if (count($segments) !== 1 || $segments[0]['text'] !== 'one <u>two' || $segments[0]['underline'] !== true) {
    throw new RuntimeException('cbt_text_segments underline view failed');
}
$segments = cbt_text_segments('<frac>3/7</frac>');
if (count($segments) !== 1 || $segments[0]['text'] !== '3/7' || $segments[0]['underline'] !== false) {
    throw new RuntimeException('cbt_text_segments shape view failed');
}

echo 'PASS: ' . $checked . " PHP renderer vectors\n";
