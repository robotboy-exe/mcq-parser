<?php
declare(strict_types=1);

require_once __DIR__ . '/../deployed/render.php';

$cases = [
    ['<u>a</u>', '<u>a</u>', 'a'],
    ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;', '<script>alert(1)</script>'],
    ['<u onclick="x">click</u>', '&lt;u onclick=&quot;x&quot;&gt;click&lt;/u&gt;', '<u onclick="x">click</u>'],
    ['&lt;u&gt;x&lt;/u&gt;', '&amp;lt;u&amp;gt;x&amp;lt;/u&amp;gt;', '&lt;u&gt;x&lt;/u&gt;'],
    ['<U>x</U>', '&lt;U&gt;x&lt;/U&gt;', '<U>x</U>'],
    ['x</u>', 'x&lt;/u&gt;', 'x</u>'],
    ['<u>x', '&lt;u&gt;x', '<u>x'],
    ['<u>one <u>two</u>', '<u>one &lt;u&gt;two</u>', 'one <u>two'],
    ['<u>😀 & " \' < ></u>', '<u>😀 &amp; &quot; &#039; &lt; &gt;</u>', '😀 & " \' < >'],
];

foreach ($cases as $index => [$input, $formatted, $plain]) {
    if (cbt_format_text($input) !== $formatted) {
        throw new RuntimeException('format case ' . ($index + 1) . ' failed');
    }
    if (cbt_strip_formatting($input) !== $plain) {
        throw new RuntimeException('strip case ' . ($index + 1) . ' failed');
    }
}

echo 'PASS: ' . count($cases) . " PHP renderer vectors\n";
