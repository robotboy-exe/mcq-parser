#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tool = require('../src/math-tool.js');

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
    hidden: false,
    disabled: false,
    value: '',
    textContent: '',
    title: '',
    type: '',
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
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach((listener) => listener({
        type: event.type,
        currentTarget: this,
        preventDefault() {}
      }));
      return true;
    },
    dispatch(type) {
      this.dispatchEvent({ type });
    },
    focus() {
      this.ownerDocument.activeElement = this;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    setRangeText(text, start, end) {
      this.value = this.value.slice(0, start) + text + this.value.slice(end);
      const caret = start + text.length;
      this.selectionStart = caret;
      this.selectionEnd = caret;
    }
  };
  Object.defineProperty(element, 'nextSibling', {
    get() {
      if (!this.parentNode) return null;
      const index = this.parentNode.children.indexOf(this);
      return this.parentNode.children[index + 1] || null;
    }
  });
  document.elements.push(element);
  return element;
}

function makeEnvironment(options = {}) {
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
      if (selector === '[data-math-tool-mounted]') {
        return this.elements.find((element) => (
          Object.prototype.hasOwnProperty.call(element.attributes, 'data-math-tool-mounted')
        )) || null;
      }
      return null;
    }
  };

  const form = makeElement('form', document);
  const field = makeElement('div', document);
  form.appendChild(field);
  const textarea = makeElement('textarea', document);
  textarea.id = 'question_text';
  textarea.form = form;
  textarea.value = options.value || '';
  textarea.selectionStart = options.start || 0;
  textarea.selectionEnd = typeof options.end === 'number' ? options.end : (options.start || 0);
  field.appendChild(textarea);

  if (options.preview) {
    const preview = makeElement('section', document);
    preview.id = 'owner_tool_preview_panel';
    field.appendChild(preview);
  }

  const save = makeElement('button', document);
  save.type = 'submit';
  save.textContent = 'Save Question';
  field.appendChild(save);

  const load = makeElement('button', document);
  load.id = 'ocr_load';
  load.type = 'button';
  load.textContent = 'Load questions';
  field.appendChild(load);

  const skip = makeElement('button', document);
  skip.id = 'ocr_skip';
  skip.type = 'button';
  skip.textContent = 'Skip this question';
  field.appendChild(skip);

  if (options.execCommand) {
    document.execCommand = options.execCommand;
  }

  return { document, form, field, textarea, save, load, skip, root: { document } };
}

function findAll(element, predicate, found = []) {
  for (const child of element.children) {
    if (predicate(child)) found.push(child);
    findAll(child, predicate, found);
  }
  return found;
}

function findButton(element, text) {
  const buttons = findAll(element, (child) => child.tagName === 'BUTTON' && child.textContent === text);
  return buttons[0] || null;
}

test('inserts a symbol at the caret and preserves surrounding text', () => {
  const result = tool.insertAtCaret('abc', 1, 1, '±');
  assert.strictEqual(result.value, 'a±bc');
  assert.strictEqual(result.caret, 2);
  assert.strictEqual(result.changed, true);
});

test('replaces a selected range', () => {
  const result = tool.insertAtCaret('abcd', 1, 3, 'x');
  assert.strictEqual(result.value, 'axd');
  assert.strictEqual(result.caret, 2);
});

test('clamps out-of-range and reversed selections', () => {
  assert.strictEqual(tool.insertAtCaret('abc', 99, 99, '²').value, 'abc²');
  assert.strictEqual(tool.insertAtCaret('abc', -5, -1, '²').value, '²abc');
  assert.strictEqual(tool.insertAtCaret('abc', 3, 1, '²').value, 'abc²');
});

test('counts UTF-8 bytes rather than characters', () => {
  assert.strictEqual(tool.utf8ByteLength('abc'), 3);
  assert.strictEqual(tool.utf8ByteLength('é'), 2);
  assert.strictEqual(tool.utf8ByteLength('x²'), 3);
  assert.strictEqual(tool.utf8ByteLength('±'), 2);
  assert.strictEqual(tool.utf8ByteLength('😀'), 4);
  assert.strictEqual(tool.utf8ByteLength('😀😀'), 8);
});

test('marks the exact neutral, amber, and red byte thresholds', () => {
  assert.strictEqual(tool.byteStatus(0), 'neutral');
  assert.strictEqual(tool.byteStatus(56999), 'neutral');
  assert.strictEqual(tool.byteStatus(57000), 'amber');
  assert.strictEqual(tool.byteStatus(59999), 'amber');
  assert.strictEqual(tool.byteStatus(60000), 'red');
  assert.strictEqual(tool.byteStatus(60001), 'red');
});

test('formats byte counts with spaced thousands', () => {
  assert.strictEqual(tool.formatByteCount(0), '0');
  assert.strictEqual(tool.formatByteCount(999), '999');
  assert.strictEqual(tool.formatByteCount(60000), '60 000');
});

test('ships the curated quick row and six drawer categories', () => {
  assert.deepStrictEqual(tool.QUICK_ROW, ['²', '³', 'ⁿ', '₁', '₂', '±', '√', '×', '÷', '≠', '≈', '°', '½', 'π', 'θ']);
  assert.deepStrictEqual(tool.CATEGORIES.map((category) => category.title), [
    'Exponents',
    'Subscripts',
    'Fractions',
    'Greek',
    'Set theory and logic',
    'Geometry and vectors'
  ]);
  assert.deepStrictEqual(tool.CATEGORIES.map((category) => category.characters.length), [15, 18, 15, 17, 12, 9]);
  const drawerCharacters = tool.CATEGORIES.reduce((all, category) => all.concat(category.characters), []);
  for (const character of tool.QUICK_ROW) {
    assert.notStrictEqual(tool.symbolName(character), 'symbol ' + character, 'missing name for ' + character);
  }
  for (const character of drawerCharacters) {
    assert.notStrictEqual(tool.symbolName(character), 'symbol ' + character, 'missing name for ' + character);
  }
  assert.strictEqual(tool.CATEGORIES[2].characters.filter((character) => character === '½').length, 1);
});

test('mounts the toolbar, drawer, and counter around the native textarea', () => {
  const environment = makeEnvironment({ value: 'hello', preview: true });
  const mounted = tool.init(environment.root);
  assert.ok(mounted);

  const field = environment.field;
  const textareaIndex = field.children.indexOf(environment.textarea);
  assert.strictEqual(field.children[textareaIndex - 2].id, 'math_tool_toolbar');
  assert.strictEqual(field.children[textareaIndex - 1].id, 'math_tool_drawer');
  assert.strictEqual(field.children[textareaIndex + 1].id, 'math_tool_counter');
  assert.strictEqual(field.children[textareaIndex + 2].id, 'owner_tool_preview_panel');

  assert.strictEqual(mounted.toolbar.getAttribute('data-math-tool-mounted'), 'question_text');
  assert.strictEqual(mounted.drawer.hidden, true);
  assert.strictEqual(environment.save.disabled, false);
  assert.strictEqual(findAll(field, (child) => child.id === 'owner_tool_underline').length, 0);
  assert.strictEqual(findButton(mounted.toolbar, 'x²') !== null, true);
});

test('is idempotent and never adds a second toolbar', () => {
  const environment = makeEnvironment();
  assert.ok(tool.init(environment.root));
  assert.strictEqual(tool.init(environment.root), null);
  const toolbars = environment.document.elements.filter((element) => element.className === 'math-tool-toolbar');
  assert.strictEqual(toolbars.length, 1);
});

test('inserts a quick symbol at the remembered caret and fires input', () => {
  const environment = makeEnvironment({ value: 'a\n\nb', start: 1 });
  const mounted = tool.init(environment.root);
  let inputEvents = 0;
  environment.textarea.addEventListener('input', () => { inputEvents += 1; });

  findButton(mounted.toolbar, 'x²').dispatch('click');

  assert.strictEqual(environment.textarea.value, 'a²\n\nb');
  assert.strictEqual(environment.textarea.selectionStart, 2);
  assert.strictEqual(inputEvents, 1);
});

test('uses execCommand when it is available without duplicating the symbol', () => {
  let commands = 0;
  const environment = makeEnvironment({
    value: 'abc',
    start: 2,
    execCommand(command, ui, text) {
      commands += 1;
      assert.strictEqual(command, 'insertText');
      environment.textarea.setRangeText(text, environment.textarea.selectionStart, environment.textarea.selectionEnd);
      return true;
    }
  });
  const mounted = tool.init(environment.root);
  findButton(mounted.toolbar, '±').dispatch('click');

  assert.strictEqual(commands, 1);
  assert.strictEqual(environment.textarea.value, 'ab±c');
  assert.strictEqual(environment.textarea.selectionStart, 3);
});

test('toggles the drawer and its aria-expanded state', () => {
  const environment = makeEnvironment();
  const mounted = tool.init(environment.root);
  const toggle = findAll(mounted.toolbar, (child) => child.className === 'math-tool-toggle')[0];

  toggle.dispatch('click');
  assert.strictEqual(mounted.drawer.hidden, false);
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'true');
  assert.strictEqual(toggle.textContent, 'Fewer symbols');

  toggle.dispatch('click');
  assert.strictEqual(mounted.drawer.hidden, true);
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
  assert.strictEqual(toggle.textContent, 'More symbols');
});

test('counter tracks UTF-8 bytes and switches to red without touching maxlength', () => {
  const environment = makeEnvironment();
  const mounted = tool.init(environment.root);

  environment.textarea.value = 'x'.repeat(56999);
  environment.textarea.dispatch('input');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'neutral');

  environment.textarea.value = 'x'.repeat(57000);
  environment.textarea.dispatch('input');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'amber');

  environment.textarea.value = '±'.repeat(30000);
  environment.textarea.dispatch('input');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'red');
  assert.strictEqual(mounted.counter.children[0].textContent, '60 000 / 60 000 bytes');
  assert.strictEqual(mounted.counter.children[1].hidden, false);
  assert.strictEqual(environment.textarea.getAttribute('maxlength'), null);
  assert.strictEqual(environment.save.disabled, false);
});

test('counter refreshes after OCR load, OCR skip, and native form reset', () => {
  const environment = makeEnvironment({ value: 'a' });
  const mounted = tool.init(environment.root);

  environment.textarea.value = '±'.repeat(30000);
  environment.load.dispatch('click');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'red');
  assert.strictEqual(mounted.counter.children[0].textContent, '60 000 / 60 000 bytes');

  environment.textarea.value = 'x';
  environment.skip.dispatch('click');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'neutral');

  environment.textarea.value = '±'.repeat(30000);
  environment.form.dispatch('reset');
  assert.strictEqual(mounted.counter.getAttribute('data-byte-status'), 'red');
});

test('every generated control is a labelled button and never a submit control', () => {
  const environment = makeEnvironment();
  const mounted = tool.init(environment.root);
  const buttons = findAll(mounted.toolbar, (child) => child.tagName === 'BUTTON')
    .concat(findAll(mounted.drawer, (child) => child.tagName === 'BUTTON'));
  const drawerCharacters = tool.CATEGORIES.reduce((total, category) => total + category.characters.length, 0);
  assert.strictEqual(buttons.length, tool.QUICK_ROW.length + 1 + drawerCharacters);
  for (const button of buttons) {
    assert.strictEqual(button.type, 'button');
    assert.ok(button.getAttribute('aria-label'), 'missing aria-label');
  }
});

test('module source keeps its stated boundaries', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'math-tool.js'), 'utf8');
  assert.strictEqual(/localStorage|sessionStorage/.test(source), false);
  assert.strictEqual(/\bfetch\s*\(|XMLHttpRequest/.test(source), false);
  assert.strictEqual(/innerHTML|outerHTML|insertAdjacentHTML/.test(source), false);
  assert.strictEqual(/\.submit\s*\(|requestSubmit/.test(source), false);
  assert.strictEqual(/owner_tool_underline|constant_text|<u>/.test(source), false);
  assert.strictEqual(source.includes("button.type = 'button'"), true);
});

test('admin page loads the palette after the preview and the stylesheet beside it', () => {
  const admin = fs.readFileSync(path.join(__dirname, '..', 'deployed', 'admin_questions.php'), 'utf8');
  const css = admin.indexOf('<link rel="stylesheet" href="src/math-tool.css">');
  const script = admin.indexOf('<script src="src/math-tool.js"></script>');
  const previewScript = admin.indexOf('<script src="src/question-preview.js"></script>');
  assert.ok(css > 0, 'missing math-tool stylesheet link');
  assert.ok(script > previewScript, 'math-tool script must load after the preview script');
  assert.strictEqual((admin.match(/src\/math-tool\.css/g) || []).length, 1);
  assert.strictEqual((admin.match(/src\/math-tool\.js/g) || []).length, 1);
  assert.strictEqual(admin.includes('math_tool_toolbar'), false, 'no PHP markup change allowed');

  const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'src', 'math-tool.css'), 'utf8');
  assert.ok(stylesheet.includes('focus-visible'));
  assert.ok(stylesheet.includes('min-width: 38px'));
  assert.ok(stylesheet.includes('@media (max-width: 650px)'));
});

console.log('PASS: ' + passed + ' math-tool vectors');
