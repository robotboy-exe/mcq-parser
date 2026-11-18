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
      (listeners[event.type] || []).forEach((listener) => listener(Object.assign({
        type: event.type,
        currentTarget: this,
        preventDefault() {}
      }, event)));
      return true;
    },
    dispatch(event) {
      this.dispatchEvent(typeof event === 'string' ? { type: event } : event);
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

  const root = { document };
  if (options.textApi) {
    root.CBTText = options.textApi;
  }

  return { document, form, field, textarea, save, load, skip, root };
}

function findAll(element, predicate, found = []) {
  for (const child of element.children) {
    if (predicate(child)) found.push(child);
    findAll(child, predicate, found);
  }
  return found;
}

function byClass(element, className) {
  return findAll(element, (child) => String(child.className).split(' ').indexOf(className) !== -1);
}

function byLabel(element, label) {
  return findAll(element, (child) => child.getAttribute('aria-label') === label);
}

function panelFor(mounted, id) {
  return mounted.panels.children.find((panel) => panel.id === 'math_tool_panel_' + id);
}

test('inserts text at the caret and preserves surrounding text', () => {
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
  assert.strictEqual(tool.insertAtCaret('abc', 99, 99, '√').value, 'abc√');
  assert.strictEqual(tool.insertAtCaret('abc', -5, -1, '√').value, '√abc');
  assert.strictEqual(tool.insertAtCaret('abc', 3, 1, '√').value, 'abc√');
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

test('ships only the basic operators and the five shape editors', () => {
  assert.deepStrictEqual(tool.OPERATORS.map((operator) => operator.character), [
    '±',
    '×',
    '÷',
    '≠',
    '≈',
    '°',
    'π'
  ]);
  assert.deepStrictEqual(tool.SHAPES.map((shape) => shape.id), [
    'fraction',
    'exponent',
    'subscript',
    'root',
    'matrix'
  ]);
  assert.deepStrictEqual(tool.SHAPES.map((shape) => shape.fields.length), [2, 2, 2, 1, 4]);
  for (const operator of tool.OPERATORS) {
    assert.strictEqual(tool.symbolName(operator.character), operator.name);
  }
  assert.strictEqual(tool.symbolName('θ'), 'symbol θ');
  assert.strictEqual(tool.CATEGORIES, undefined, 'symbol grids must be gone');
  assert.strictEqual(tool.QUICK_ROW, undefined, 'quick row must be gone');
  assert.strictEqual(tool.customFraction, undefined, 'vulgar fraction builder must be gone');
});

test('builds exact shape markers from freeform values', () => {
  assert.strictEqual(tool.fractionMarkup('3', '7'), '<frac>3/7</frac>');
  assert.strictEqual(tool.fractionMarkup('  12 ', ' 25 '), '<frac>12/25</frac>');
  assert.strictEqual(tool.exponentMarkup('x', '2n+1'), 'x<sup>2n+1</sup>');
  assert.strictEqual(tool.subscriptMarkup('a', 'n-1'), 'a<sub>n-1</sub>');
  assert.strictEqual(tool.rootMarkup('2x+1'), '<sqrt>2x+1</sqrt>');
  assert.strictEqual(tool.matrixMarkup('2', 'x', '1', 'y'), '<matrix>2|x|1|y</matrix>');
  assert.strictEqual(tool.fractionMarkup('1', '2'), '<frac>1/2</frac>');
});

test('refuses empty or markup-bearing values', () => {
  assert.strictEqual(tool.fractionMarkup('', '7'), '');
  assert.strictEqual(tool.fractionMarkup('3', '   '), '');
  assert.strictEqual(tool.fractionMarkup('3/4', '7'), '', 'no slash inside a fraction term');
  assert.strictEqual(tool.fractionMarkup('<b>', '7'), '');
  assert.strictEqual(tool.exponentMarkup('x', ''), '');
  assert.strictEqual(tool.exponentMarkup('', '2'), '');
  assert.strictEqual(tool.subscriptMarkup('x', '<1>'), '');
  assert.strictEqual(tool.rootMarkup(''), '');
  assert.strictEqual(tool.matrixMarkup('1', '2', '3', ''), '');
  assert.strictEqual(tool.matrixMarkup('1', '2', '3', 'a|b'), '');
  assert.strictEqual(tool.fractionMarkup(null, undefined), '');
});

test('mounts the toolbar, shape panels, and counter around the native textarea', () => {
  const environment = makeEnvironment({ value: 'hello', preview: true });
  const mounted = tool.init(environment.root);
  assert.ok(mounted);

  const field = environment.field;
  const textareaIndex = field.children.indexOf(environment.textarea);
  assert.strictEqual(field.children[textareaIndex - 2].id, 'math_tool_toolbar');
  assert.strictEqual(field.children[textareaIndex - 1].id, 'math_tool_panels');
  assert.strictEqual(field.children[textareaIndex + 1].id, 'math_tool_counter');
  assert.strictEqual(field.children[textareaIndex + 2].id, 'owner_tool_preview_panel');

  assert.strictEqual(mounted.toolbar.getAttribute('data-math-tool-mounted'), 'question_text');
  assert.strictEqual(mounted.panels.children.length, 5);
  for (const panel of mounted.panels.children) {
    assert.strictEqual(panel.hidden, true);
  }
  assert.strictEqual(findAll(field, (child) => child.id === 'math_tool_drawer').length, 0);
  assert.strictEqual(findAll(field, (child) => child.id === 'owner_tool_underline').length, 0);
  assert.strictEqual(byClass(mounted.toolbar, 'math-tool-operators').length, 1);
  assert.strictEqual(byClass(mounted.toolbar, 'math-tool-shapes').length, 1);
  assert.strictEqual(byLabel(mounted.toolbar, 'square root').length, 0, 'legacy root operator must be gone');
  assert.strictEqual(byLabel(mounted.toolbar, 'Insert Root').length, 1, 'visual root editor must remain');
  assert.strictEqual(environment.save.disabled, false);
});

test('is idempotent and never adds a second toolbar', () => {
  const environment = makeEnvironment();
  assert.ok(tool.init(environment.root));
  assert.strictEqual(tool.init(environment.root), null);
  const toolbars = environment.document.elements.filter((element) => element.className === 'math-tool-toolbar');
  assert.strictEqual(toolbars.length, 1);
});

test('inserts a basic operator at the remembered caret and fires input', () => {
  const environment = makeEnvironment({ value: 'a\n\nb', start: 1 });
  const mounted = tool.init(environment.root);
  let inputEvents = 0;
  environment.textarea.addEventListener('input', () => { inputEvents += 1; });

  byLabel(mounted.toolbar, 'multiplication')[0].dispatch('click');

  assert.strictEqual(environment.textarea.value, 'a×\n\nb');
  assert.strictEqual(environment.textarea.selectionStart, 2);
  assert.strictEqual(inputEvents, 1);
});

test('inserts a fraction marker from its panel at the remembered caret', () => {
  const environment = makeEnvironment({ value: 'a\n\nb', start: 1 });
  const mounted = tool.init(environment.root);

  byLabel(mounted.toolbar, 'Insert Fraction')[0].dispatch('click');
  const panel = panelFor(mounted, 'fraction');
  assert.strictEqual(panel.hidden, false);
  assert.strictEqual(byLabel(mounted.toolbar, 'Insert Fraction')[0].getAttribute('aria-expanded'), 'true');

  byLabel(panel, 'Fraction numerator')[0].value = '3';
  byLabel(panel, 'Fraction denominator')[0].value = '7';
  byLabel(panel, 'Insert Fraction')[0].dispatch('click');

  assert.strictEqual(environment.textarea.value, 'a<frac>3/7</frac>\n\nb');
  assert.strictEqual(environment.textarea.selectionStart, 17);
});

test('inserts exponent, subscript, root, and matrix markers', () => {
  const environment = makeEnvironment({ value: '', start: 0 });
  const mounted = tool.init(environment.root);
  const results = [];

  function insert(shapeLabel, panelId, values) {
    byLabel(mounted.toolbar, 'Insert ' + shapeLabel)[0].dispatch('click');
    const panel = panelFor(mounted, panelId);
    for (const [label, value] of Object.entries(values)) {
      byLabel(panel, label)[0].value = value;
    }
    byLabel(panel, 'Insert ' + shapeLabel)[0].dispatch('click');
    results.push(environment.textarea.value);
  }

  insert('Exponent', 'exponent', { 'Exponent base': 'x', 'Exponent value': '2n+1' });
  insert('Subscript', 'subscript', { 'Subscript base': 'a', 'Subscript value': '1' });
  insert('Root', 'root', { 'Root radicand': '2x+1' });
  insert('2x2 matrix', 'matrix', {
    'Matrix cell 1': '2',
    'Matrix cell 2': 'x',
    'Matrix cell 3': '1',
    'Matrix cell 4': 'y'
  });

  assert.strictEqual(results[0], 'x<sup>2n+1</sup>');
  assert.strictEqual(results[1], 'x<sup>2n+1</sup>a<sub>1</sub>');
  assert.strictEqual(results[2], 'x<sup>2n+1</sup>a<sub>1</sub><sqrt>2x+1</sqrt>');
  assert.strictEqual(
    results[3],
    'x<sup>2n+1</sup>a<sub>1</sub><sqrt>2x+1</sqrt><matrix>2|x|1|y</matrix>'
  );
});

test('refuses an incomplete shape with a hint and leaves the field unchanged', () => {
  const environment = makeEnvironment({ value: 'abc', start: 1 });
  const mounted = tool.init(environment.root);
  byLabel(mounted.toolbar, 'Insert Fraction')[0].dispatch('click');
  const panel = panelFor(mounted, 'fraction');
  byLabel(panel, 'Fraction numerator')[0].value = '3';

  byLabel(panel, 'Insert Fraction')[0].dispatch('click');

  assert.strictEqual(environment.textarea.value, 'abc');
  const hint = byClass(panel, 'math-tool-hint')[0];
  assert.strictEqual(hint.hidden, false);
  assert.ok(hint.textContent.length > 0);
});

test('Enter inside a shape field inserts and never submits the form', () => {
  const environment = makeEnvironment({ value: 'q', start: 1 });
  const mounted = tool.init(environment.root);
  let submits = 0;
  environment.textarea.form.addEventListener('submit', () => { submits += 1; });
  byLabel(mounted.toolbar, 'Insert Root')[0].dispatch('click');
  const panel = panelFor(mounted, 'root');
  const input = byLabel(panel, 'Root radicand')[0];
  input.value = '9';

  input.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() { submits += 100; } });

  assert.strictEqual(submits, 100, 'the handler must prevent the default action');
  assert.strictEqual(environment.textarea.value, 'q<sqrt>9</sqrt>');
});

test('only one shape panel is open at a time and the button toggles it', () => {
  const environment = makeEnvironment();
  const mounted = tool.init(environment.root);
  const fractionButton = byLabel(mounted.toolbar, 'Insert Fraction')[0];
  const rootButton = byLabel(mounted.toolbar, 'Insert Root')[0];

  fractionButton.dispatch('click');
  assert.strictEqual(panelFor(mounted, 'fraction').hidden, false);

  rootButton.dispatch('click');
  assert.strictEqual(panelFor(mounted, 'fraction').hidden, true);
  assert.strictEqual(panelFor(mounted, 'root').hidden, false);
  assert.strictEqual(fractionButton.getAttribute('aria-expanded'), 'false');

  rootButton.dispatch('click');
  assert.strictEqual(panelFor(mounted, 'root').hidden, true);
  assert.strictEqual(rootButton.getAttribute('aria-expanded'), 'false');
});

test('uses execCommand when it is available without duplicating the marker', () => {
  const environment = makeEnvironment({
    value: 'abc',
    start: 2,
    execCommand(command, ui, text) {
      assert.strictEqual(command, 'insertText');
      environment.textarea.setRangeText(text, environment.textarea.selectionStart, environment.textarea.selectionEnd);
      return true;
    }
  });
  const mounted = tool.init(environment.root);
  byLabel(mounted.toolbar, 'Insert Root')[0].dispatch('click');
  const panel = panelFor(mounted, 'root');
  byLabel(panel, 'Root radicand')[0].value = '9';
  byLabel(panel, 'Insert Root')[0].dispatch('click');

  assert.strictEqual(environment.textarea.value, 'ab<sqrt>9</sqrt>c');
  assert.strictEqual(environment.textarea.selectionStart, 16);
});

test('renders the panel preview through CBTText without writing the field', () => {
  const rendered = [];
  const environment = makeEnvironment({
    value: 'abc',
    start: 1,
    textApi: {
      render(element, value) {
        element.textContent = value;
        rendered.push(value);
      }
    }
  });
  const mounted = tool.init(environment.root);
  byLabel(mounted.toolbar, 'Insert Fraction')[0].dispatch('click');
  const panel = panelFor(mounted, 'fraction');
  byLabel(panel, 'Fraction numerator')[0].value = '1';
  byLabel(panel, 'Fraction denominator')[0].dispatch('input');
  byLabel(panel, 'Fraction denominator')[0].value = '2';
  byLabel(panel, 'Fraction denominator')[0].dispatch('input');

  const preview = byClass(panel, 'math-tool-preview')[0];
  assert.strictEqual(preview.textContent, '<frac>1/2</frac>');
  assert.strictEqual(rendered.includes('<frac>1/2</frac>'), true);
  assert.strictEqual(environment.textarea.value, 'abc');
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
  const controls = findAll(mounted.toolbar, (child) => child.tagName === 'BUTTON')
    .concat(findAll(mounted.panels, (child) => child.tagName === 'BUTTON'));
  assert.strictEqual(controls.length, tool.OPERATORS.length + (tool.SHAPES.length * 2));
  for (const control of controls) {
    assert.strictEqual(control.type, 'button');
    assert.ok(control.getAttribute('aria-label'), 'missing aria-label');
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
  for (const marker of ['<frac>', '<sup>', '<sub>', '<sqrt>', '<matrix>']) {
    assert.strictEqual(source.includes(marker), true, 'missing builder for ' + marker);
  }
});

test('admin page loads the palette after the preview and the stylesheet beside it', () => {
  const admin = fs.readFileSync(path.join(__dirname, '..', 'deployed', 'admin_questions.php'), 'utf8');
  const css = admin.indexOf('<link rel="stylesheet" href="src/math-tool.css?v=1.1.0">');
  const script = admin.indexOf('<script src="src/math-tool.js?v=1.1.1"></script>');
  const previewScript = admin.indexOf('<script src="src/question-preview.js"></script>');
  const previewCss = admin.indexOf('<link rel="stylesheet" href="src/question-preview.css?v=1.1.2">');
  const renderScript = admin.indexOf('<script src="src/owner-tool/render.js?v=2.3.3"></script>');
  assert.ok(css > 0, 'missing math-tool stylesheet link');
  assert.ok(previewCss > 0, 'the preview stylesheet must carry the MS01 cache key');
  assert.ok(script > previewScript, 'math-tool script must load after the preview script');
  assert.ok(renderScript > 0 && renderScript < script, 'the renderer must load before the palette');
  assert.strictEqual((admin.match(/src\/math-tool\.css/g) || []).length, 1);
  assert.strictEqual((admin.match(/src\/math-tool\.js/g) || []).length, 1);
  assert.strictEqual((admin.match(/src\/question-preview\.css/g) || []).length, 1);
  assert.strictEqual((admin.match(/src\/owner-tool\/render\.js/g) || []).length, 1);
  assert.strictEqual(admin.includes('src/question-preview.css"'), false, 'the preview stylesheet needs a token');
  assert.strictEqual(admin.includes('src/owner-tool/render.js"></script>'), false, 'the renderer needs a token');
  assert.strictEqual(admin.includes('src/math-tool.js?v=1.1.0'), false, 'the changed palette script needs a fresh token');
  assert.strictEqual(admin.includes('src/question-preview.css?v=1.1.0'), false, 'the changed preview stylesheet needs its MS01 token');
  assert.strictEqual(admin.includes('src/question-preview.css?v=1.1.1'), false, 'the changed preview stylesheet needs a fresh token');
  assert.strictEqual(admin.includes('math_tool_toolbar'), false, 'no PHP markup change allowed');

  const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'src', 'math-tool.css'), 'utf8');
  assert.ok(stylesheet.includes('focus-visible'));
  assert.ok(stylesheet.includes('min-width: 38px'));
  assert.ok(stylesheet.includes('@media (max-width: 650px)'));
  assert.ok(stylesheet.includes('grid-template-columns: repeat(2, 56px)'), 'matrix cells need a 2x2 grid');

  const preview = fs.readFileSync(path.join(__dirname, '..', 'src', 'question-preview.css'), 'utf8');
  for (const rule of ['.cbt-frac-den', '.cbt-sqrt-body', '.cbt-matrix-grid', '.cbt-matrix-bracket']) {
    assert.ok(preview.includes(rule), 'preview stylesheet missing ' + rule);
  }
  assert.ok(preview.includes('border-top: 1px solid currentColor'), 'horizontal bar rule missing');
  assert.match(
    preview,
    /\.cbt-sqrt-body\s*\{(?=[^}]*margin:\s*\.075em\s+0\s+0\s+-\.05em)(?=[^}]*border-top:\s*\.06em\s+solid\s+currentColor)[^}]*\}/,
    'the radical bar must overlap and align with the root glyph'
  );
});

test('exam and detail pages ship the same horizontal-bar rules', () => {
  const cbt = fs.readFileSync(path.join(__dirname, '..', 'deployed', 'cbt.php'), 'utf8');
  const details = fs.readFileSync(path.join(__dirname, '..', 'deployed', 'answer_details.php'), 'utf8');
  const connectedRoot = /\.cbt-sqrt-body\s*\{(?=[^}]*margin:\s*\.075em\s+0\s+0\s+-\.05em)(?=[^}]*border-top:\s*\.06em\s+solid\s+currentColor)[^}]*\}/;
  for (const page of [cbt, details]) {
    assert.ok(page.includes('.cbt-frac-den { border-top: 1px solid currentColor; }') || page.includes('.cbt-frac-den{border-top:1px solid currentColor}'));
    assert.ok(page.includes('.cbt-sqrt-body') && page.includes('.cbt-matrix-grid'));
    assert.match(page, connectedRoot, 'the radical must be connected on every rendered surface');
  }
  assert.ok(cbt.includes('src/owner-tool/render.js?v=2.3.3'));

  const practice = fs.readFileSync(path.join(__dirname, '..', 'deployed', 'cbt_practice.php'), 'utf8');
  assert.ok(practice.includes('src/owner-tool/render.js?v=2.3.3'), 'cbt_practice must load the current renderer key');
  assert.strictEqual((practice.match(/src\/owner-tool\/render\.js/g) || []).length, 1);
  assert.strictEqual(practice.includes('2.3.2c'), false, 'the stale renderer key must be gone');
});

console.log('PASS: ' + passed + ' math-tool vectors');
