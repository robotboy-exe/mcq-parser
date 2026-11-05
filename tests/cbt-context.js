#!/usr/bin/env node
'use strict';

const assert = require('assert');
const contextApi = require('../src/cbt/context-render.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('[PASS] ' + name);
  } catch (error) {
    failed += 1;
    console.log('[FAIL] ' + name + ' - ' + error.message);
  }
}

function documentFixture() {
  const document = {
    createTextNode(value) {
      return {
        nodeType: 3,
        ownerDocument: document,
        parentNode: null,
        textContent: String(value),
      };
    },
    createElement(tag) {
      const node = {
        nodeType: 1,
        ownerDocument: document,
        parentNode: null,
        tagName: String(tag).toUpperCase(),
        className: '',
        children: [],
        attributes: {},
        open: false,
        appendChild(child) {
          child.parentNode = this;
          this.children.push(child);
          return child;
        },
        insertBefore(child, before) {
          child.parentNode = this;
          const index = this.children.indexOf(before);
          if (index < 0) this.children.push(child);
          else this.children.splice(index, 0, child);
          return child;
        },
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
      };
      Object.defineProperty(node, 'firstChild', {
        get() { return this.children[0] || null; },
      });
      Object.defineProperty(node, 'textContent', {
        get() { return this.children.map(child => child.textContent).join(''); },
        set(value) {
          this.children = [];
          if (String(value) !== '') this.appendChild(document.createTextNode(value));
        },
      });
      return node;
    },
  };
  return document;
}

function descendants(node) {
  return (node.children || []).reduce((all, child) => {
    all.push(child);
    return all.concat(descendants(child));
  }, []);
}

function elements(node, tag) {
  return descendants(node).filter(child => child.tagName === String(tag).toUpperCase());
}

test('linked question gets an open card with safe exact underline rendering', () => {
  const document = documentFixture();
  const host = document.createElement('div');
  const contexts = {
    7: {
      id: 7,
      type: 'comprehension',
      title: 'Read <script>alert(1)</script>',
      text: 'Plain <u>underlined</u> <img src=x onerror=alert(1)>',
    },
  };
  const card = contextApi.renderForQuestion(host, contexts, { contextId: 7, contextSlot: null });

  assert.strictEqual(card.tagName, 'DETAILS');
  assert.strictEqual(card.open, true);
  assert.strictEqual(host.firstChild, card);
  assert.strictEqual(elements(card, 'summary')[0].textContent, 'Read <script>alert(1)</script>');
  assert.strictEqual(elements(card, 'u').length, 1);
  assert.strictEqual(elements(card, 'script').length, 0);
  assert.ok(card.textContent.includes('<img src=x onerror=alert(1)>'));
});

test('cloze card keeps every slot readable and highlights only the active slot', () => {
  const document = documentFixture();
  const host = document.createElement('div');
  const contexts = {
    9: {
      id: 9,
      type: 'cloze',
      title: 'Gap passage',
      text: 'Choose [[gap:71]] before [[gap:72]].',
    },
  };
  const card = contextApi.renderForQuestion(host, contexts, { contextId: 9, contextSlot: 71 });
  const marks = elements(card, 'mark');
  const gaps = descendants(card).filter(node => /(?:^|\s)cbt-context-gap(?:\s|$)/.test(node.className || ''));

  assert.strictEqual(gaps.length, 2);
  assert.strictEqual(marks.length, 1);
  assert.strictEqual(marks[0].textContent, '[[gap:71]]');
  assert.strictEqual(marks[0].attributes['aria-current'], 'true');
  assert.strictEqual(card.textContent.includes('[[gap:72]]'), true);
});

test('invalid gap markers remain literal', () => {
  const document = documentFixture();
  const host = document.createElement('div');
  const contexts = {
    2: {
      id: 2,
      type: 'cloze',
      title: 'Malformed gaps',
      text: 'Keep [[gap:0]], [[gap:1000]], and [[GAP:71]].',
    },
  };
  const card = contextApi.renderForQuestion(host, contexts, { contextId: 2, contextSlot: 71 });
  assert.strictEqual(elements(card, 'mark').length, 0);
  assert.ok(card.textContent.includes('[[gap:0]]'));
  assert.ok(card.textContent.includes('[[gap:1000]]'));
  assert.ok(card.textContent.includes('[[GAP:71]]'));
});

test('standalone and missing-context questions add no card', () => {
  const document = documentFixture();
  const host = document.createElement('div');
  assert.strictEqual(contextApi.renderForQuestion(host, {}, { contextId: null }), null);
  assert.strictEqual(contextApi.renderForQuestion(host, {}, { contextId: 404 }), null);
  assert.strictEqual(host.children.length, 0);
});

console.log('\nSummary');
console.log('  PASS: ' + passed);
console.log('  FAIL: ' + failed);
process.exitCode = failed ? 1 : 0;
