#!/usr/bin/env node
'use strict';

// Read-only local probe for cloze numbering collisions (OT09 FIX-2).
// Prints detected groups, merged items, context members, and warnings.
// Usage: node tools/cloze-probe.js [paste.txt]
// Exits 1 when a context card has zero members, 2 on a probe error.

const fs = require('fs');
const path = require('path');

const parser = require('../src/parser/parser.js');
const core = require('../src/parser/core.js');
const cloze = core.clozeEngine();

const DEFAULT_FILE = path.join(__dirname, 'cloze-two-groups.txt');
const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_FILE;
if (!fs.existsSync(file)) {
  console.error('cloze-probe: file not found: ' + file);
  process.exit(2);
}

const raw = fs.readFileSync(file, 'utf8');
const table = cloze.detect(raw, null);
const parsed = parser.parsePaste(raw);

function flat(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function clip(value, size) {
  const text = flat(value);
  return text.length > size ? text.slice(0, size - 1) + '…' : text;
}

function membersOf(id) {
  return parsed.items.filter(item => item.contextRef === id);
}

console.log('paste:  ' + file);
console.log('parser: ' + parsed.version + '   raw cloze items: ' + table.items.length);
console.log('');

console.log('Detected cloze groups (before merge)');
if (!table.contexts.length) console.log('  none');
table.contexts.forEach(context => {
  const rows = table.items.filter(item => item.contextRef === context.id).map(item => item.num);
  console.log('  ' + context.id + '  ' + clip(context.title, 36)
    + '  targets [' + context.targets.join(', ') + ']  rows [' + rows.join(', ') + ']');
});

console.log('');
console.log('Merged draft items (' + parsed.items.length + ')');
if (!parsed.items.length) console.log('  none');
parsed.items.forEach(item => {
  console.log('  #' + item.num + '  ' + (item.contextRef || '-') + '  ' + clip(item.question, 48));
  console.log('      A=' + clip(item.a, 14) + '  B=' + clip(item.b, 14)
    + '  C=' + clip(item.c, 14) + '  D=' + clip(item.d, 14));
});

console.log('');
console.log('Context cards');
if (!parsed.contexts.length) console.log('  none');
parsed.contexts.forEach(context => {
  const members = membersOf(context.id);
  console.log('  ' + context.id + '  ' + context.type + '  ' + clip(context.title, 34));
  console.log('    targets [' + context.targets.join(', ') + ']  declared links ' + context.linkedCount
    + '  members ' + members.length + (members.length ? '' : '   <-- EMPTY CARD'));
  if (members.length) {
    console.log('    member numbers [' + members.map(item => item.num).join(', ') + ']');
  }
});

console.log('');
console.log('Warnings (' + parsed.warnings.length + ')');
if (!parsed.warnings.length) console.log('  none');
parsed.warnings.forEach(warning => console.log('  - ' + warning));

const empty = parsed.contexts.filter(context => !membersOf(context.id).length);
console.log('');
if (empty.length) {
  console.log('RESULT: ' + empty.length + ' context card(s) with zero members: '
    + empty.map(context => context.id).join(', ') + '.');
  process.exitCode = 1;
} else {
  console.log('RESULT: every context card has at least one member.');
}
