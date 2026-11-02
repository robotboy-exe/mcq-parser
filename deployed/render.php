<?php
declare(strict_types=1);

// Shared question/context text rendering for server-rendered admin and detail
// pages. Only the exact markers <u> and </u> are formatting; every other tag,
// attribute, or encoded marker stays plain text. Do not replace this with
// strip_tags(): that would keep arbitrary tags instead of escaping them.

function cbt_text_segments(string $text): array
{
    $open = '<u>';
    $close = '</u>';
    $parts = [];
    $buffer = '';
    $underlined = false;
    $length = strlen($text);
    $i = 0;

    // Byte-wise scanning is safe here: the marker bytes are ASCII and never
    // appear inside a multi-byte UTF-8 sequence.
    while ($i < $length) {
        if (!$underlined && substr($text, $i, strlen($open)) === $open) {
            if ($buffer !== '') {
                $parts[] = ['text' => $buffer, 'underline' => false];
                $buffer = '';
            }
            $underlined = true;
            $i += strlen($open);
            continue;
        }
        if ($underlined && substr($text, $i, strlen($close)) === $close) {
            if ($buffer !== '') {
                $parts[] = ['text' => $buffer, 'underline' => true];
                $buffer = '';
            }
            $underlined = false;
            $i += strlen($close);
            continue;
        }
        $buffer .= $text[$i];
        $i++;
    }
    if ($buffer !== '') {
        $parts[] = ['text' => $buffer, 'underline' => $underlined];
    }
    return $parts;
}

// Escaped HTML with only the exact underline markers restored.
function cbt_format_text(string $text): string
{
    $html = '';
    foreach (cbt_text_segments($text) as $part) {
        $escaped = htmlspecialchars($part['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $html .= $part['underline'] ? '<u>' . $escaped . '</u>' : $escaped;
    }
    return $html;
}

// Plain text with the exact markers removed, for list summaries and titles.
function cbt_strip_formatting(string $text): string
{
    $plain = '';
    foreach (cbt_text_segments($text) as $part) {
        $plain .= $part['text'];
    }
    return $plain;
}
