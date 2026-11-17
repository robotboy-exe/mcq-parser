#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const text = require('../src/owner-tool/render.js');

const vectors = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'render-markup.json'), 'utf8')
);
if (vectors.schema_version !== 1 || !Array.isArray(vectors.cases)) {
  throw new Error('render-markup fixture must be schema_version 1 with cases');
}

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
}

for (const vector of vectors.cases) {
  test('format: ' + vector.name, () => {
    assert.strictEqual(text.format(vector.input), vector.format);
  });
  test('strip: ' + vector.name, () => {
    assert.strictEqual(text.strip(vector.input), vector.strip);
  });
}

test('segments keeps the underline-only view for callers', () => {
  assert.deepStrictEqual(text.segments('<u>one <u>two</u>'), [{ text: 'one <u>two', underline: true }]);
  assert.deepStrictEqual(text.segments('<frac>3/7</frac>'), [{ text: '3/7', underline: false }]);
});

test('render builds real elements without parsing stored text as HTML', () => {
  function node(tagName) {
    return {
      tagName: String(tagName).toUpperCase(),
      ownerDocument: document,
      className: '',
      textContent: '',
      children: [],
      attributes: {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      }
    };
  }

  const document = {
    createElement: (tagName) => node(tagName),
    createTextNode: (value) => ({ text: String(value), children: [] })
  };

  const host = node('div');
  text.render(host, 'x<sup>2</sup> <frac>3/7</frac> <sqrt>y</sqrt> <matrix>a|b|c|d</matrix> <script>');

  assert.strictEqual(host.children[0].text, 'x');
  assert.strictEqual(host.children[1].tagName, 'SUP');
  assert.strictEqual(host.children[1].children[0].text, '2');

  const fraction = host.children[3];
  assert.strictEqual(fraction.className, 'cbt-frac');
  assert.deepStrictEqual(fraction.children.map((child) => child.className), ['cbt-frac-num', 'cbt-frac-den']);
  assert.strictEqual(fraction.children[1].children[0].text, '7');

  const root = host.children[5];
  assert.strictEqual(root.className, 'cbt-sqrt');
  assert.strictEqual(root.children[0].textContent, '√');
  assert.strictEqual(root.children[0].attributes['aria-hidden'], 'true');

  const matrix = host.children[7];
  assert.strictEqual(matrix.className, 'cbt-matrix');
  assert.strictEqual(matrix.children[1].className, 'cbt-matrix-grid');
  assert.strictEqual(matrix.children[1].children.length, 4);
  assert.deepStrictEqual(matrix.children[1].children.map((cell) => cell.children[0].text), ['a', 'b', 'c', 'd']);

  const trailing = host.children[host.children.length - 1];
  assert.strictEqual(trailing.text, ' <script>');
  assert.strictEqual(
    host.children.some((child) => child.tagName === 'SCRIPT'),
    false,
    'stored tags must stay text'
  );
});

test('renderer source keeps its escape-first boundary', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'owner-tool', 'render.js'), 'utf8');
  assert.strictEqual(/innerHTML|outerHTML|insertAdjacentHTML/.test(source), false);
  assert.strictEqual(source.includes('cbt-frac-num'), true);
  assert.strictEqual(source.includes('cbt-sqrt-body'), true);
  assert.strictEqual(source.includes('cbt-matrix-grid'), true);
});

console.log('PASS: ' + passed + ' render-markup checks');
