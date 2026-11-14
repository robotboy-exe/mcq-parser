#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { wrapSelection } = require('../src/underline-toolbar.js');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
}

test('wraps the selected text', () => {
  const result = wrapSelection('hello world', 6, 11);
  assert.strictEqual(result.value, 'hello <u>world</u>');
  assert.strictEqual(result.start, 9);
  assert.strictEqual(result.end, 14);
  assert.strictEqual(result.action, 'wrap');
  assert.strictEqual(result.changed, true);
});

test('unwraps exact content between lowercase markers', () => {
  const result = wrapSelection('hello <u>world</u>', 9, 14);
  assert.strictEqual(result.value, 'hello world');
  assert.strictEqual(result.start, 6);
  assert.strictEqual(result.end, 11);
  assert.strictEqual(result.action, 'unwrap');
  assert.strictEqual(result.changed, true);
});

test('refuses a selection inside an existing pair', () => {
  const result = wrapSelection('<u>abc</u>', 4, 5);
  assert.strictEqual(result.value, '<u>abc</u>');
  assert.strictEqual(result.action, 'refuse');
  assert.strictEqual(result.changed, false);
});

test('refuses a selection that contains markers', () => {
  const result = wrapSelection('<u>abc</u>', 0, 9);
  assert.strictEqual(result.value, '<u>abc</u>');
  assert.strictEqual(result.action, 'refuse');
});

test('refuses a selection that splits a marker', () => {
  const result = wrapSelection('<u>abc</u>', 1, 4);
  assert.strictEqual(result.value, '<u>abc</u>');
  assert.strictEqual(result.action, 'refuse');
});

test('refuses a caret inside an existing pair', () => {
  const result = wrapSelection('<u>abc</u>', 5, 5);
  assert.strictEqual(result.value, '<u>abc</u>');
  assert.strictEqual(result.action, 'refuse');
});

test('inserts empty lowercase markers at a plain caret', () => {
  const result = wrapSelection('abc', 1, 1);
  assert.strictEqual(result.value, 'a<u></u>bc');
  assert.strictEqual(result.start, 4);
  assert.strictEqual(result.end, 4);
  assert.strictEqual(result.action, 'wrap');
});

test('treats uppercase tags as literal text', () => {
  const result = wrapSelection('<U>abc</U>', 3, 6);
  assert.strictEqual(result.value, '<U><u>abc</u></U>');
});

test('preserves text outside the selection', () => {
  const result = wrapSelection('one two three', 4, 7);
  assert.strictEqual(result.value, 'one <u>two</u> three');
});

console.log('PASS: ' + passed + ' underline-toolbar vectors');
