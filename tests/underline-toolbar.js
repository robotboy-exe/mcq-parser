#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { wrapSelection, init } = require('../src/underline-toolbar.js');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
}

function makeElement(tagName, document) {
  const listeners = {};
  const element = {
    tagName: String(tagName).toUpperCase(),
    ownerDocument: document,
    parentNode: null,
    children: [],
    id: '',
    className: '',
    textContent: '',
    title: '',
    type: '',
    value: '',
    style: {},
    attributes: {},
    selectionStart: 0,
    selectionEnd: 0,
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, reference) {
      child.parentNode = this;
      const index = this.children.indexOf(reference);
      if (index === -1) this.children.push(child);
      else this.children.splice(index, 0, child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    addEventListener(type, listener) {
      (listeners[type] || (listeners[type] = [])).push(listener);
    },
    dispatchEvent() {
      return true;
    },
    focus() {
      this.ownerDocument.activeElement = this;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    }
  };
  document.elements.push(element);
  return element;
}

function makeEnvironment() {
  const document = {
    readyState: 'complete',
    elements: [],
    activeElement: null,
    createElement(tagName) {
      return makeElement(tagName, this);
    },
    getElementById(id) {
      return this.elements.find((element) => element.id === id) || null;
    },
    querySelector(selector) {
      if (selector === 'label[for="question_text"]') {
        return this.elements.find((element) => (
          element.tagName === 'LABEL' && element.attributes.for === 'question_text'
        )) || null;
      }
      return null;
    }
  };

  const field = makeElement('div', document);
  const label = makeElement('label', document);
  label.setAttribute('for', 'question_text');
  field.appendChild(label);
  const textarea = makeElement('textarea', document);
  textarea.id = 'question_text';
  field.appendChild(textarea);

  return { document, field, label, textarea };
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

test('places the underline button in a flex question-label row at the far right', () => {
  const environment = makeEnvironment();
  global.document = environment.document;
  try {
    init();

    const button = environment.document.getElementById('owner_tool_underline');
    assert.ok(button, 'underline button was not created');
    const row = environment.label.parentNode;
    assert.strictEqual(row.className, 'owner-tool-label-row');
    assert.strictEqual(row.children[0], environment.label);
    assert.strictEqual(row.children[1], button);
    assert.strictEqual(row.style.cssText, 'display:flex;align-items:center;gap:12px;margin:0 0 7px');
    assert.strictEqual(environment.label.style.marginBottom, '0');
    assert.strictEqual(button.style.marginLeft, 'auto');

    init();
    const buttons = environment.document.elements.filter((element) => element.id === 'owner_tool_underline');
    assert.strictEqual(buttons.length, 1);
  } finally {
    delete global.document;
  }
});

console.log('PASS: ' + passed + ' underline-toolbar vectors');
