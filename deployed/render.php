<?php
declare(strict_types=1);

// Shared question/constant text rendering for server-rendered admin and detail
// pages. Only the exact lowercase markers <u>, <frac>, <sup>, <sub>, <sqrt>, and
// <matrix> are formatting; every other tag, attribute, or encoded marker stays
// plain text. Do not replace this with strip_tags(): that would keep arbitrary
// tags instead of escaping them.
// This scanner must stay in parity with src/owner-tool/render.js; both consume
// tests/fixtures/render-markup.json.

const CBT_MATH_TAGS = ['u', 'frac', 'sup', 'sub', 'sqrt', 'matrix'];
const CBT_MATH_MAX_DEPTH = 8;
const CBT_MATRIX_CELLS = 4;

/**
 * @return list<array{text?: string, tag?: string, children?: array}>
 */
function cbt_parse_math(string $text): array
{
    $pos = 0;
    return cbt_parse_level($text, $pos, null, [], 0);
}

/**
 * @param list<string> $openTags
 * @return list<array{text?: string, tag?: string, children?: array}>
 */
function cbt_parse_level(string $text, int &$pos, ?string $stopTag, array $openTags, int $depth): array
{
    $nodes = [];
    $buffer = '';
    $length = strlen($text);

    while ($pos < $length) {
        if ($stopTag !== null) {
            $close = '</' . $stopTag . '>';
            if (substr($text, $pos, strlen($close)) === $close) {
                $pos += strlen($close);
                if ($buffer !== '') {
                    $nodes[] = ['text' => $buffer];
                }
                return $nodes;
            }
        }
        $tag = null;
        foreach (CBT_MATH_TAGS as $candidate) {
            $open = '<' . $candidate . '>';
            if (substr($text, $pos, strlen($open)) === $open) {
                $tag = $candidate;
                break;
            }
        }
        if ($tag !== null && $depth < CBT_MATH_MAX_DEPTH && !in_array($tag, $openTags, true)) {
            $close = '</' . $tag . '>';
            if (strpos($text, $close, $pos + strlen($tag) + 2) !== false) {
                if ($buffer !== '') {
                    $nodes[] = ['text' => $buffer];
                    $buffer = '';
                }
                $pos += strlen($tag) + 2;
                $nodes[] = [
                    'tag' => $tag,
                    'children' => cbt_parse_level($text, $pos, $tag, array_merge($openTags, [$tag]), $depth + 1),
                ];
                continue;
            }
        }
        $buffer .= $text[$pos];
        $pos++;
    }
    if ($buffer !== '') {
        $nodes[] = ['text' => $buffer];
    }
    return $nodes;
}

/**
 * Splits a node list at the first separator that appears in its own text.
 *
 * @param list<array{text?: string, tag?: string, children?: array}> $nodes
 * @return array{head: array, tail: array, found: bool}
 */
function cbt_take_nodes(array $nodes, string $separator): array
{
    $head = [];
    foreach ($nodes as $index => $node) {
        if (isset($node['text'])) {
            $at = strpos($node['text'], $separator);
            if ($at !== false) {
                if ($at > 0) {
                    $head[] = ['text' => substr($node['text'], 0, $at)];
                }
                $tail = [];
                $rest = substr($node['text'], $at + strlen($separator));
                if ($rest !== '') {
                    $tail[] = ['text' => $rest];
                }
                foreach (array_slice($nodes, $index + 1) as $remaining) {
                    $tail[] = $remaining;
                }
                return ['head' => $head, 'tail' => $tail, 'found' => true];
            }
        }
        $head[] = $node;
    }
    return ['head' => $head, 'tail' => [], 'found' => false];
}

/**
 * @param list<array{text?: string, tag?: string, children?: array}> $nodes
 * @return list<array>|null four row-major cells, or null when the count differs
 */
function cbt_matrix_cells(array $nodes): ?array
{
    $groups = [];
    $rest = $nodes;
    for ($index = 0; $index < CBT_MATRIX_CELLS - 1; $index++) {
        $part = cbt_take_nodes($rest, '|');
        if (!$part['found']) {
            return null;
        }
        $groups[] = $part['head'];
        $rest = $part['tail'];
    }
    if (cbt_take_nodes($rest, '|')['found']) {
        return null;
    }
    $groups[] = $rest;
    return $groups;
}

/**
 * @param list<array{text?: string, tag?: string, children?: array}> $nodes
 */
function cbt_format_nodes(array $nodes): string
{
    $html = '';
    foreach ($nodes as $node) {
        $html .= cbt_format_node($node);
    }
    return $html;
}

/**
 * @param array{text?: string, tag?: string, children?: array} $node
 */
function cbt_format_node(array $node): string
{
    if (isset($node['text'])) {
        return htmlspecialchars($node['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
    $tag = (string) ($node['tag'] ?? '');
    $children = $node['children'] ?? [];
    if ($tag === 'u') {
        return '<u>' . cbt_format_nodes($children) . '</u>';
    }
    if ($tag === 'sup' || $tag === 'sub') {
        return '<' . $tag . '>' . cbt_format_nodes($children) . '</' . $tag . '>';
    }
    if ($tag === 'frac') {
        $split = cbt_take_nodes($children, '/');
        if (!$split['found']) {
            return '<span class="cbt-frac cbt-frac-single">' . cbt_format_nodes($children) . '</span>';
        }
        return '<span class="cbt-frac">'
            . '<span class="cbt-frac-num">' . cbt_format_nodes($split['head']) . '</span>'
            . '<span class="cbt-frac-den">' . cbt_format_nodes($split['tail']) . '</span>'
            . '</span>';
    }
    if ($tag === 'sqrt') {
        return '<span class="cbt-sqrt">'
            . '<span class="cbt-sqrt-sign" aria-hidden="true">√</span>'
            . '<span class="cbt-sqrt-body">' . cbt_format_nodes($children) . '</span>'
            . '</span>';
    }
    if ($tag === 'matrix') {
        $cells = cbt_matrix_cells($children);
        if ($cells === null) {
            return '<span class="cbt-matrix cbt-matrix-single">' . cbt_format_nodes($children) . '</span>';
        }
        $grid = '';
        foreach ($cells as $cell) {
            $grid .= '<span class="cbt-matrix-cell">' . cbt_format_nodes($cell) . '</span>';
        }
        return '<span class="cbt-matrix">'
            . '<span class="cbt-matrix-bracket" aria-hidden="true">[</span>'
            . '<span class="cbt-matrix-grid">' . $grid . '</span>'
            . '<span class="cbt-matrix-bracket" aria-hidden="true">]</span>'
            . '</span>';
    }
    return cbt_format_nodes($children);
}

// Escaped HTML with only the recognized markers restored.
function cbt_format_text(string $text): string
{
    return cbt_format_nodes(cbt_parse_math($text));
}

/**
 * @param list<array{text?: string, tag?: string, children?: array}> $nodes
 * @param list<array{text: string, underline: bool}> $parts
 * @return list<array{text: string, underline: bool}>
 */
function cbt_flatten_nodes(array $nodes, bool $underline, array $parts): array
{
    foreach ($nodes as $node) {
        if (isset($node['text'])) {
            if ($node['text'] === '') {
                continue;
            }
            $last = count($parts) - 1;
            if ($last >= 0 && $parts[$last]['underline'] === $underline) {
                $parts[$last]['text'] .= $node['text'];
            } else {
                $parts[] = ['text' => $node['text'], 'underline' => $underline];
            }
            continue;
        }
        $parts = cbt_flatten_nodes(
            $node['children'] ?? [],
            ($node['tag'] ?? '') === 'u' ? true : $underline,
            $parts
        );
    }
    return $parts;
}

/**
 * Underline-only segmentation kept for existing callers.
 *
 * @return list<array{text: string, underline: bool}>
 */
function cbt_text_segments(string $text): array
{
    return cbt_flatten_nodes(cbt_parse_math($text), false, []);
}

// Plain text with every recognized marker removed, for list summaries.
function cbt_strip_formatting(string $text): string
{
    $plain = '';
    foreach (cbt_flatten_nodes(cbt_parse_math($text), false, []) as $part) {
        $plain .= $part['text'];
    }
    return $plain;
}
