#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const preview = require('../src/question-preview.js');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
}

function makeEnvironment(actionValue = 'save_question') {
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
      value: '',
      textContent: '',
      form: null,
      attributes: {},
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
      addEventListener(type, listener) {
        (listeners[type] || (listeners[type] = [])).push(listener);
      },
      dispatch(type) {
        (listeners[type] || []).forEach((listener) => listener({ currentTarget: this }));
      }
    };
    Object.defineProperty(element, 'nextSibling', {
      get() {
        if (!this.parentNode) return null;
        const index = this.parentNode.children.indexOf(this);
        return this.parentNode.children[index + 1] || null;
      }
    });
    return element;
  }

  const document = {
    body: null,
    action: null,
    createElement(tagName) {
      return makeElement(tagName, this);
    },
    createTextNode(value) {
      return { text: String(value), children: [] };
    },
    querySelector(selector) {
      if (selector === 'input[name=action][value=' + actionValue + ']') return this.action;
      return null;
    },
    getElementById(id) {
      function visit(element) {
        if (element.id === id) return element;
        for (const child of element.children) {
          const found = visit(child);
          if (found) return found;
        }
        return null;
      }
      return visit(this.body);
    }
  };

  document.body = document.createElement('body');
  const form = document.createElement('form');
  document.body.appendChild(form);
  const action = document.createElement('input');
  action.form = form;
  document.action = action;
  form.appendChild(action);

  const constant = document.createElement('textarea');
  constant.id = 'constant_text';
  constant.value = 'First line\n\n<u>Second paragraph</u>';
  form.appendChild(constant);

  const questionField = document.createElement('div');
  form.appendChild(questionField);
  const question = document.createElement('textarea');
  question.id = 'question_text';
  question.value = 'Question line one\nline two';
  questionField.appendChild(question);

  const load = document.createElement('button');
  load.id = 'ocr_load';
  form.appendChild(load);

  const renders = [];
  const root = {
    document,
    CBTText: {
      render(element, value) {
        element.textContent = value;
        renders.push({ element, value });
      }
    },
    setTimeout(callback) {
      callback();
    }
  };
  return { root, form, constant, question, questionField, load, renders };
}

function descendants(element) {
  return element.children.reduce((all, child) => all.concat(child, descendants(child)), []);
}

test('mounts one read-only preview after the question field', () => {
  const env = makeEnvironment();
  const constantBefore = env.constant.value;
  const questionBefore = env.question.value;
  const mounted = preview.init(env.root);
  assert(mounted);
  assert.strictEqual(mounted.panel.parentNode, env.questionField);
  assert.strictEqual(env.question.nextSibling, mounted.panel);
  assert.strictEqual(env.root.document.getElementById('owner_tool_constant_preview').textContent, constantBefore);
  assert.strictEqual(env.root.document.getElementById('owner_tool_preview').textContent, questionBefore);
  assert.strictEqual(env.constant.value, constantBefore);
  assert.strictEqual(env.question.value, questionBefore);
  assert.deepStrictEqual(descendants(mounted.panel).map((element) => element.tagName)
    .filter((tagName) => /^(INPUT|TEXTAREA|BUTTON)$/.test(tagName)), []);
  assert.strictEqual(preview.init(env.root), null);
});

test('refreshes for typing and programmatic OCR fills without writing fields', () => {
  const env = makeEnvironment();
  preview.init(env.root);
  env.question.value = 'Changed\n\nquestion';
  env.question.dispatch('input');
  assert.strictEqual(env.root.document.getElementById('owner_tool_preview').textContent, 'Changed\n\nquestion');
  env.constant.value = '';
  env.constant.dispatch('change');
  assert.strictEqual(env.root.document.getElementById('owner_tool_constant_preview').parentNode.hidden, true);
  env.question.value = 'OCR-filled question';
  env.load.dispatch('click');
  assert.strictEqual(env.root.document.getElementById('owner_tool_preview').textContent, 'OCR-filled question');
  assert.strictEqual(env.constant.value, '');
});

test('mounts on the native edit form', () => {
  const env = makeEnvironment('update_question');
  const mounted = preview.init(env.root);
  assert(mounted);
  assert.strictEqual(env.root.document.getElementById('owner_tool_preview').textContent, env.question.value);
});

test('renders math shape markers with the real shared renderer', () => {
  const env = makeEnvironment();
  env.root.CBTText = require('../src/owner-tool/render.js');
  env.question.value = 'Solve <frac>3/7</frac> of it';
  env.constant.value = '';
  preview.init(env.root);

  const rendered = env.root.document.getElementById('owner_tool_preview');
  const fractions = descendants({ children: rendered.children })
    .filter((element) => element.className === 'cbt-frac');
  assert.strictEqual(fractions.length, 1);
  assert.strictEqual(fractions[0].children[0].className, 'cbt-frac-num');
  assert.strictEqual(fractions[0].children[0].children[0].text, '3');
  assert.strictEqual(fractions[0].children[1].children[0].text, '7');
  assert.strictEqual(env.question.value, 'Solve <frac>3/7</frac> of it');
});

test('keeps the Constant Text preview at input height with vertical scrolling', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/question-preview.css'), 'utf8');
  function hasViewportContract(source) {
    function declarations(pattern) {
      const match = source.match(pattern);
      if (!match) return null;
      return Object.fromEntries(match[1].split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
        const colon = item.indexOf(':');
        return [item.slice(0, colon).trim(), item.slice(colon + 1).trim()];
      }));
    }

    const base = declarations(/(?:^|\n)\.owner-tool-preview\s*\{([^}]*)\}/);
    const constant = declarations(/\.owner-tool-preview-constant \.owner-tool-preview\s*\{([^}]*)\}/);
    return Boolean(base && constant
      && constant.height === '150px'
      && constant['box-sizing'] === 'border-box'
      && constant['overflow-y'] === 'auto'
      && !Object.hasOwn(base, 'height')
      && !Object.hasOwn(base, 'max-height')
      && !Object.hasOwn(base, 'overflow-y'));
  }

  assert.strictEqual(hasViewportContract(css), true);
  assert.strictEqual(hasViewportContract(css.replace('height: 150px', 'xheight: 150px')), false);
  assert.strictEqual(hasViewportContract(css.replace(
    '.owner-tool-preview {',
    '.owner-tool-preview {\n  height: 150px;\n  overflow-y: auto;'
  )), false);
});

function cssRules(source) {
  const rules = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let match;
  while ((match = pattern.exec(stripped))) {
    rules.push({ selector: match[1].replace(/\s+/g, '').toLowerCase(), body: match[2] });
  }
  return rules;
}

function cssDeclarations(body) {
  return Object.fromEntries(body.split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
    const colon = item.indexOf(':');
    return [item.slice(0, colon).trim().toLowerCase(), item.slice(colon + 1).trim().toLowerCase()];
  }));
}

function fractionRules(source) {
  const rules = cssRules(source);
  const rulesFor = (selector) => rules.filter((rule) => rule.selector === selector).map((rule) => cssDeclarations(rule.body));
  return {
    frac: rulesFor('.cbt-frac').pop(),
    terms: rulesFor('.cbt-frac-num,.cbt-frac-den').pop(),
    denominator: rulesFor('.cbt-frac-den').pop()
  };
}

// A full-width bar needs the terms to stretch to the wider term's width, so the
// denominator border spans both; centering is done by text-align inside.
function hasFullWidthFractionBar({ frac, terms, denominator }) {
  return Boolean(frac && terms && denominator
    && frac.display === 'inline-flex'
    && frac['flex-direction'] === 'column'
    && frac['align-items'] === 'stretch'
    && terms['text-align'] === 'center'
    && denominator['border-top'] === '1px solid currentcolor');
}

test('paints a full-width fraction bar on all three surfaces', () => {
  const surfaces = {
    'src/question-preview.css': fs.readFileSync(path.join(__dirname, '../src/question-preview.css'), 'utf8'),
    'deployed/cbt.php': fs.readFileSync(path.join(__dirname, '../deployed/cbt.php'), 'utf8'),
    'deployed/answer_details.php': fs.readFileSync(path.join(__dirname, '../deployed/answer_details.php'), 'utf8')
  };
  const parsed = {};
  for (const [name, source] of Object.entries(surfaces)) {
    const rules = fractionRules(source);
    parsed[name] = rules;
    assert.strictEqual(hasFullWidthFractionBar(rules), true, name + ' full-width bar');
    assert.strictEqual(
      hasFullWidthFractionBar({ ...rules, frac: { ...rules.frac, 'align-items': 'center' } }),
      false,
      name + ' must reject the denominator-only rule'
    );
    assert.strictEqual(
      hasFullWidthFractionBar({ ...rules, frac: { ...rules.frac, 'align-items': 'flex-start' } }),
      false,
      name + ' must not pass a left-aligned rule'
    );
    assert.strictEqual(
      hasFullWidthFractionBar({ ...rules, denominator: { 'border-top': '0' } }),
      false,
      name + ' needs the bar itself'
    );
  }
  assert.deepStrictEqual(parsed['deployed/cbt.php'], parsed['src/question-preview.css']);
  assert.deepStrictEqual(parsed['deployed/answer_details.php'], parsed['src/question-preview.css']);
});

test('module has no storage, network, or form-value writes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/question-preview.js'), 'utf8');
  assert.strictEqual(source.includes('localStorage'), false);
  assert.strictEqual(source.includes('fetch('), false);
  assert.strictEqual(source.includes('innerHTML'), false);
  assert.strictEqual(source.includes('.submit('), false);
  assert.strictEqual(/\.value\s*=/.test(source), false);
});

console.log('PASS: ' + passed + ' question-preview vectors');
