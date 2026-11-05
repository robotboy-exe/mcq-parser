'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const STATE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/state.js'), 'utf8');
const CONTROLLER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/controller.js'), 'utf8');
const RENDER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/render.js'), 'utf8');
const STYLE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/style.css'), 'utf8');
const CONTEXTS_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/contexts.js'), 'utf8');
const CONTEXT_FORM_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/context-form.js'), 'utf8');
const CONTEXT_CARD_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/context-card.js'), 'utf8');
const CONTEXT_PANEL_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/context-panel.js'), 'utf8');
const ADMIN_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/admin_questions.php'), 'utf8');
const CBT_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/cbt.php'), 'utf8');
const PRACTICE_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/cbt_practice.php'), 'utf8');
const DETAIL_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/answer_details.php'), 'utf8');
const parser = require('../src/parser/core.js');
const stateApi = require('../src/owner-tool/state.js');
const textApi = require('../src/owner-tool/render.js');

const FULL_PASTE = [
  'CRS 2021 JAMB',
  '1. Who was the father of faith in the Bible?',
  'A. Isaac',
  'B. Jacob',
  'C. Moses',
  'D. Abraham',
  '',
  '2. How many books are in the New Testament?',
  'A. 27',
  'B. 39',
  'C. 66',
  'D. 12',
  '',
  '=== ANSWER KEY ===',
  '1.D 2.A',
].join('\n');

const EF_PASTE = [
  '1. Which of these is a fruit of the spirit?',
  'A. Anger',
  'B. Joy',
  'C. Envy',
  'D. Strife',
  'E. Hatred',
  '',
  '=== ANSWER KEY ===',
  '1.E',
].join('\n');

const NO_KEY_PASTE = [
  '1. Which of these is a fruit of the spirit?',
  'A. Anger',
  'B. Joy',
  'C. Envy',
  'D. Strife',
  'E. Hatred',
].join('\n');

function configureContext(env, index, values) {
  const prefix = 'owner_context_' + index + '_';
  if (values.type) env.edit(prefix + 'type', values.type, 'change');
  if (values.title !== undefined) env.edit(prefix + 'title', values.title);
  if (values.text !== undefined) env.edit(prefix + 'text', values.text);
  if (values.targets !== undefined) env.edit(prefix + 'targets', values.targets);
  if (values.expected !== undefined) env.edit(prefix + 'expected', values.expected);
  if (values.subject !== undefined) env.edit(prefix + 'subject', values.subject);
  if (values.category !== undefined) env.edit(prefix + 'category', values.category);
  if (values.year !== undefined) env.edit(prefix + 'year', values.year);
}

function submitContextForm(env) {
  env.submitContext();
  return env.state();
}

function createElement(doc, tag, props) {
  const el = {
    ownerDocument: doc,
    tagName: String(tag || 'div').toUpperCase(),
    id: '',
    name: '',
    type: '',
    className: '',
    value: '',
    checked: false,
    disabled: false,
    hidden: false,
    selectedIndex: -1,
    options: [],
    children: [],
    parentNode: null,
    style: {},
    listeners: {},
    textContent: '',
    html: '',
    get innerHTML() { return this.html; },
    set innerHTML(html) {
      this.html = String(html == null ? '' : html);
      doc.registerFromHTML(this.html);
    },
    appendChild(child) {
      if (child && child.parentNode) child.remove();
      if (child) child.parentNode = this;
      this.children.push(child);
      if (child && child.id) doc.byId.set(child.id, child);
      if (child && child.tagName === 'OPTION' && this.tagName === 'SELECT') {
        if (!this.options) this.options = [];
        this.options.push({ text: child.textContent, value: String(child.value), selected: false });
      }
      return child;
    },
    before(node) {
      doc.body.appendChild(node);
    },
    remove() {
      if (!this.parentNode) return;
      const list = this.parentNode.children;
      const at = list.indexOf(this);
      if (at > -1) list.splice(at, 1);
      this.parentNode = null;
    },
    focus() {},
    addEventListener(type, fn) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    },
    dispatchEvent(event) {
      this.dispatch(event && event.type, event);
      return true;
    },
    dispatch(type, event) {
      (this.listeners[type] || []).slice().forEach(fn => fn(event || { type }));
    },
    querySelector(selector) { return doc.query(this, selector); },
    querySelectorAll(selector) { return doc.queryAll(this, selector); }
  };
  Object.assign(el, props || {});
  const initialText = typeof el.textContent === 'string' ? el.textContent : '';
  let ownText = initialText;
  Object.defineProperty(el, 'textContent', {
    configurable: true,
    get() {
      let out = ownText;
      (this.children || []).forEach(child => { out += String(child.textContent == null ? '' : child.textContent); });
      return out;
    },
    set(value) {
      ownText = String(value == null ? '' : value);
      (this.children || []).forEach(child => { child.parentNode = null; });
      this.children = [];
    },
  });
  return el;
}

function selectElement(doc, id, options, selected) {
  const el = createElement(doc, 'select', { id, name: id });
  el.options = options.map((opt, index) => ({
    text: typeof opt === 'string' ? opt : opt.text,
    value: typeof opt === 'string' ? String(index + 1) : String(opt.value),
    selected: false,
  }));
  let value = selected == null ? (el.options[0] ? el.options[0].value : '') : String(selected);
  Object.defineProperty(el, 'value', {
    get() { return value; },
    set(next) {
      value = String(next == null ? '' : next);
      const at = el.options.findIndex(opt => String(opt.value) === value);
      if (at > -1) el.selectedIndex = at;
    },
  });
  el.selectedIndex = Math.max(0, el.options.findIndex(opt => String(opt.value) === value));
  return el;
}

function createDocument(options) {
  const opts = options || {};
  const doc = {
    byId: new Map(),
    body: null,
    actionInput: null,
    submitButton: null,
    successElement: opts.success ? { textContent: String(opts.success) } : null,
    errorElement: opts.error ? { textContent: String(opts.error) } : null,
    registerFromHTML(html) {
      const re = /<([a-z][\w-]*)([^>]*)>/gi;
      let match;
      while ((match = re.exec(html))) {
        const id = match[2].match(/\bid="([^"]+)"/i);
        if (!id) continue;
        const classes = match[2].match(/\bclass="([^"]*)"/i);
        if (!this.byId.has(id[1])) {
          this.byId.set(id[1], createElement(this, match[1], {
            id: id[1],
            className: classes ? classes[1] : '',
          }));
        }
      }
    },
    getElementById(id) {
      return this.byId.get(id) || null;
    },
    createElement(tag) {
      return createElement(this, tag);
    },
    createTextNode(text) {
      const node = createElement(this, '#text', { textContent: String(text) });
      node.nodeType = 3;
      return node;
    },
    query(scope, selector) {
      if (selector === 'input[name=action][value=save_question]') {
        return this.actionInput && this.actionInput.value === 'save_question' ? this.actionInput : null;
      }
      if (selector === 'input[name=action][value=update_question]') {
        return this.actionInput && this.actionInput.value === 'update_question' ? this.actionInput : null;
      }
      if (selector === 'input[name=correct_option]') return doc.radios[0] || null;
      if (selector === '[name=correct_option]') return doc.radios[0] || null;
      const radio = selector.match(/^input\[name="correct_option"\]\[value="(\d+)"\]$/);
      if (radio) return doc.radios[Number(radio[1])] || null;
      if (selector === 'input[name=correct_option]:checked') return doc.radios.find(r => r.checked) || null;
      if (selector === '.admin-success') return this.successElement;
      if (selector === '.admin-error') {
        if (this.errorElement) return this.errorElement;
        return [...this.byId.values()].find(el => String(el.className || '').split(/\s+/).includes('admin-error')) || null;
      }
      if (selector === '.admin-table') return null;
      if (selector === 'button[type=submit]') return this.submitButton;
      return null;
    },
    queryAll(_scope, selector) {
      if (selector === '[name=correct_option]') return doc.radios.slice();
      return [];
    },
    querySelector(selector) {
      return this.query(this.body, selector);
    },
    querySelectorAll(selector) {
      return this.queryAll(this.body, selector);
    },
    addEventListener() {},
  };
  doc.body = createElement(doc, 'body');
  return doc;
}

function createForm(doc, options) {
  const opts = options || {};
  const form = createElement(doc, 'form', { id: 'question_form' });
  const fields = {
    subject_id: selectElement(doc, 'subject_id', ['CRS', 'CRK', 'Government'], '1'),
    exam_category_id: selectElement(doc, 'exam_category_id', [
      { text: 'JAMB / UTME', value: '2' },
      { text: 'WASCE / NECO / GCE', value: '3' },
      { text: 'JAMB', value: '8' },
    ], '2'),
    exam_year: createElement(doc, 'input', { id: 'exam_year', name: 'exam_year', value: '2021' }),
    question_text: createElement(doc, 'textarea', {
      id: 'question_text',
      name: 'question_text',
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      },
    }),
    option_a: createElement(doc, 'input', { id: 'option_a', name: 'option_a', value: '' }),
    option_b: createElement(doc, 'input', { id: 'option_b', name: 'option_b', value: '' }),
    option_c: createElement(doc, 'input', { id: 'option_c', name: 'option_c', value: '' }),
    option_d: createElement(doc, 'input', { id: 'option_d', name: 'option_d', value: '' }),
    is_active: createElement(doc, 'input', { id: 'is_active', name: 'is_active', type: 'checkbox', checked: false }),
    question_image: createElement(doc, 'input', { id: 'question_image', name: 'question_image', value: '' }),
    answer_video: createElement(doc, 'input', { id: 'answer_video', name: 'answer_video', value: '' }),
    answer_explanation: createElement(doc, 'textarea', { id: 'answer_explanation', name: 'answer_explanation', value: '' }),
    context_id: selectElement(doc, 'context_id', [{ text: 'Not linked', value: '' }], ''),
    context_position: createElement(doc, 'input', { id: 'context_position', name: 'context_position', value: '' }),
    context_slot: createElement(doc, 'input', { id: 'context_slot', name: 'context_slot', value: '' }),
  };
  form.elements = fields;
  Object.keys(fields).forEach(name => doc.byId.set(name, fields[name]));
  doc.radios = [0, 1, 2, 3].map(index => {
    const radio = createElement(doc, 'input', {
      id: 'correct_option_' + index,
      name: 'correct_option',
      type: 'radio',
      value: String(index),
    });
    radio.form = form;
    return radio;
  });
  doc.submitButton = createElement(doc, 'button', { id: 'save_question', type: 'submit' });
  doc.byId.set('save_question', doc.submitButton);
  doc.actionInput = createElement(doc, 'input', {
    name: 'action',
    value: opts.action || (String(opts.search || '').indexOf('edit=') !== -1 ? 'update_question' : 'save_question'),
    form,
  });
  Object.keys(opts.formValues || {}).forEach(name => {
    if (name === 'correct_option') {
      const selected = Number(opts.formValues[name]);
      doc.radios.forEach((radio, index) => { radio.checked = index === selected; });
    } else if (fields[name]) {
      fields[name].value = String(opts.formValues[name]);
    }
  });
  form.before = node => doc.body.appendChild(node);
  doc.form = form;
  doc.byId.set('question_form', form);
  return form;
}

function createContextForm(doc) {
  const form = createElement(doc, 'form', { id: 'context_form' });
  const fields = {
    action: createElement(doc, 'input', { id: 'context_action', name: 'action', type: 'hidden', value: 'save_context', form }),
    context_type: selectElement(doc, 'context_type', [
      { text: 'Comprehension', value: 'comprehension' },
      { text: 'Cloze', value: 'cloze' },
    ], 'comprehension'),
    title: createElement(doc, 'input', { id: 'context_title', name: 'title', value: '', form }),
    context_text: createElement(doc, 'textarea', { id: 'context_text', name: 'context_text', value: '', form }),
    subject_id: selectElement(doc, 'context_subject_id', [{ text: 'Select', value: '' }, { text: 'CRS', value: '1' }], ''),
    exam_category_id: selectElement(doc, 'context_exam_category_id', [{ text: 'Select', value: '' }, { text: 'JAMB', value: '2' }], ''),
    exam_year: createElement(doc, 'input', { id: 'context_exam_year', name: 'exam_year', value: '', form }),
    expected_member_count: createElement(doc, 'input', { id: 'expected_member_count', name: 'expected_member_count', value: '1', form }),
  };
  fields.subject_id.form = form;
  fields.exam_category_id.form = form;
  form.elements = fields;
  Object.keys(fields).forEach(name => doc.byId.set(fields[name].id, fields[name]));
  form.before = node => doc.body.appendChild(node);
  doc.contextForm = form;
  doc.byId.set('context_form', form);
  return form;
}

function createEnv(options) {
  const opts = options || {};
  const doc = createDocument({ success: opts.success, error: opts.error });
  const form = createForm(doc, opts);
  if (opts.contextForm !== false) createContextForm(doc);
  const raw = new Map();
  Object.keys(opts.storage || {}).forEach(key => raw.set(key, String(opts.storage[key])));
  const localStorage = {
    getItem: key => (raw.has(key) ? raw.get(key) : null),
    setItem: (key, value) => { raw.set(key, String(value)); },
    removeItem: key => { raw.delete(key); },
  };
  const sandbox = {
    document: doc,
    location: {
      search: opts.search || '',
      pathname: '/admin_questions.php',
      href: 'https://example.test/admin_questions.php',
    },
    localStorage,
    navigator: {},
    console,
    JSON,
    Date,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    setTimeout,
    clearTimeout,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(STATE_SOURCE, sandbox, { filename: 'src/owner-tool/state.js' });
  vm.runInContext(RENDER_SOURCE, sandbox, { filename: 'src/owner-tool/render.js' });
  vm.runInContext(CONTEXTS_SOURCE, sandbox, { filename: 'src/owner-tool/contexts.js' });
  vm.runInContext(CONTEXT_FORM_SOURCE, sandbox, { filename: 'src/owner-tool/context-form.js' });
  vm.runInContext(CONTEXT_CARD_SOURCE, sandbox, { filename: 'src/owner-tool/context-card.js' });
  vm.runInContext(CONTEXT_PANEL_SOURCE, sandbox, { filename: 'src/owner-tool/context-panel.js' });
  sandbox.OCRParser = parser;
  vm.runInContext(CONTROLLER_SOURCE, sandbox, { filename: 'src/owner-tool/controller.js' });

  const env = {
    doc,
    form,
    raw,
    field(name) {
      const el = form.elements[name];
      if (!el) throw new Error('no field ' + name);
      return el.value;
    },
    setField(name, value) {
      form.elements[name].value = value;
    },
    byId(id) {
      const el = doc.getElementById(id);
      if (!el) throw new Error('no element ' + id);
      return el;
    },
    edit(id, value, type) {
      const el = this.byId(id);
      el.value = String(value);
      el.dispatch(type || 'input');
      return el;
    },
    contextField(name) {
      return doc.contextForm.elements[name].value;
    },
    submitContext() {
      doc.contextForm.dispatch('submit');
    },
    text(id) {
      const el = doc.getElementById(id);
      return el ? String(el.textContent || '') : '';
    },
    visible(id) {
      const el = doc.getElementById(id);
      return Boolean(el) && el.hidden !== true;
    },
    click(id) {
      const el = doc.getElementById(id);
      if (!el || typeof el.onclick !== 'function') throw new Error('no click handler for ' + id);
      return el.onclick();
    },
    paste(text) {
      doc.getElementById('owner_tool_text').value = text;
    },
    select(start, end) {
      const box = form.elements.question_text;
      box.selectionStart = start;
      box.selectionEnd = end == null ? start : end;
    },
    type(text) {
      form.elements.question_text.value = text;
      form.elements.question_text.dispatch('input');
    },
    keydown(init) {
      form.elements.question_text.dispatch('keydown', init);
    },
    reset() {
      Object.keys(form.elements).forEach(name => {
        const el = form.elements[name];
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else if (el.tagName !== 'SELECT') el.value = '';
      });
      form.dispatch('reset');
    },
    underlined(id) {
      const el = doc.getElementById(id);
      if (!el) return [];
      return (el.children || [])
        .filter(child => String(child.tagName) === 'U')
        .map(child => String(child.textContent));
    },
    radioIndex() {
      return doc.radios.findIndex(radio => radio.checked);
    },
    submit() {
      form.dispatch('submit');
    },
    state() {
      const rawState = raw.get(stateApi.KEY);
      return rawState == null ? null : JSON.parse(rawState);
    },
    reload(reloadOptions) {
      const next = Object.assign({}, reloadOptions || {});
      if (opts.contextForm === false) next.contextForm = false;
      const storage = {};
      raw.forEach((value, key) => { storage[key] = value; });
      next.storage = storage;
      next.search = opts.search || '';
      return createEnv(next);
    },
  };
  return env;
}

let passed = 0;
let failed = 0;
const queue = [];

function test(name, fn) {
  queue.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (String(actual) !== String(expected)) {
    throw new Error(message + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  }
}

test('full paste fills the native fields and stores a versioned state', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.field('question_text'), 'Who was the father of faith in the Bible?', 'stem');
  assertEqual(env.field('option_a'), 'Isaac', 'option a');
  assertEqual(env.field('option_d'), 'Abraham', 'option d');
  assertEqual(env.radioIndex(), 3, 'key D ticks the fourth radio');
  assertEqual(env.field('exam_year'), '2021', 'inferred year');
  assertEqual(env.field('subject_id'), '1', 'inferred subject');
  assertEqual(env.field('exam_category_id'), '2', 'inferred category');
  const state = env.state();
  assertEqual(state.version, 1, 'state version');
  assertEqual(state.parserVersion, '2.1.0', 'parser version');
  assertEqual(state.items.length, 2, 'queue length');
  assertEqual(state.answerKey['1'], 'D', 'answer key');
  assert(state.queueId.indexOf('q-') === 0, 'queue id is generated');
  assert(env.text('owner_tool_status').indexOf('Question 1 of 2') === 0, 'status shows position');
});

test('E/F collapses into option D and ticks index 3 when the key says E', () => {
  const env = createEnv();
  env.paste(EF_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.field('option_d'), 'Hatred', 'E text replaces option D');
  assertEqual(env.radioIndex(), 3, 'E ticks the D radio');
  assert(env.text('owner_tool_flags').indexOf('E/F options present') > -1, 'E/F flag is advisory');
});

test('without a key E/F text is appended to option D and nothing is ticked', () => {
  const env = createEnv();
  env.paste(NO_KEY_PASTE);
  env.click('owner_tool_load');
  assert(env.field('option_d').indexOf('E. Hatred') > -1, 'E text appended to option D');
  assertEqual(env.radioIndex(), -1, 'no radio is ticked without a key');
});

test('key-only paste keeps the queue and only refreshes the radio', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  const before = env.state();
  env.setField('option_d', 'Administrator edit');
  env.paste('1.A 2.B');
  env.click('owner_tool_load');
  const after = env.state();
  assertEqual(after.items.length, 2, 'queue retained');
  assertEqual(after.queueId, before.queueId, 'queue identity retained');
  assertEqual(after.currentIndex, 0, 'position retained');
  assertEqual(after.answerKey['1'], 'A', 'key replaced');
  assertEqual(env.radioIndex(), 0, 'radio refreshed to the new key');
  assertEqual(env.field('option_d'), 'Administrator edit', 'administrator edit is not overwritten');
});

test('administrator edits survive submit and the marker records the loaded item', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.setField('question_text', 'Edited by the administrator');
  env.setField('option_b', 'Edited B');
  env.submit();
  assertEqual(env.field('question_text'), 'Edited by the administrator', 'edited stem kept');
  assertEqual(env.field('option_b'), 'Edited B', 'edited option kept');
  const state = env.state();
  assert(state.pendingSubmission !== null, 'pending marker stored');
  assertEqual(state.pendingSubmission.index, 0, 'marker index');
  assertEqual(state.pendingSubmission.queueId, state.queueId, 'marker queue id');
  assertEqual(state.pendingSubmission.fingerprint, stateApi.fingerprint(state.items[0]), 'marker fingerprint is the loaded item');
  assertEqual(env.form.elements.is_active.checked, false, 'active checkbox is never forced');
});

test('the exact success flash advances once and only once', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  const next = env.reload({ success: 'Question saved successfully (Question ID: 5040).' });
  assertEqual(next.state().currentIndex, 1, 'advanced one item');
  assertEqual(next.state().pendingSubmission, null, 'marker cleared');
  assertEqual(next.field('question_text'), 'How many books are in the New Testament?', 'next item filled');
  assertEqual(next.radioIndex(), 0, 'next item key applied');
  const again = next.reload({ success: 'Question saved successfully (Question ID: 5040).' });
  assertEqual(again.state().currentIndex, 1, 'a second reload does not advance again');
});

test('a near-miss flash does not advance', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  const next = env.reload({ success: 'Question updated successfully (Question ID: 5040).' });
  assertEqual(next.state().currentIndex, 0, 'no advance');
  assert(next.text('owner_tool_warning').indexOf('Could not confirm') > -1, 'review warning shown');
});

test('a server error keeps the current item and the server-rendered edits', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.setField('question_text', 'Edited <u>stem</u>\n\nSecond paragraph.');
  env.setField('option_b', 'Edited B');
  env.submit();
  const next = env.reload({
    error: 'Question text is required.',
    formValues: {
      question_text: 'Edited <u>stem</u>\n\nSecond paragraph.',
      option_b: 'Edited B',
      correct_option: 1,
    },
  });
  assertEqual(next.state().currentIndex, 0, 'item kept');
  assertEqual(next.state().pendingSubmission, null, 'in-flight state cleared');
  assert(next.text('owner_tool_warning').indexOf('rejected') > -1, 'error warning shown');
  assertEqual(next.field('question_text'), 'Edited <u>stem</u>\n\nSecond paragraph.', 'posted stem preserved');
  assertEqual(next.field('option_b'), 'Edited B', 'posted option preserved');
  assertEqual(next.radioIndex(), 1, 'posted answer preserved');
});

test('a rejected save never advances on a stale success flash', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  const next = env.reload({
    success: 'Question saved successfully (Question ID: 5040).',
    error: 'Question text is required.',
  });
  assertEqual(next.state().currentIndex, 0, 'no advance when the server rejected the save');
  assertEqual(next.state().pendingSubmission, null, 'in-flight state cleared');
  assert(next.text('owner_tool_warning').indexOf('rejected') > -1, 'rejection warning shown');
  assertEqual(next.state().items[0].question, 'Who was the father of faith in the Bible?', 'same queue item remains');
});

test('an ambiguous reload keeps the item and never retries', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  const next = env.reload({});
  assertEqual(next.state().currentIndex, 0, 'no advance');
  assertEqual(next.state().pendingSubmission, null, 'no stale marker');
  assert(next.text('owner_tool_warning').indexOf('Check Recently Added Questions') > -1, 'review warning shown');
});

test('Show Paste never overwrites administrator edits', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.setField('question_text', 'Edited <u>stem</u>\n\nSecond paragraph.');
  env.setField('option_b', 'Edited B');
  env.click('owner_tool_show');
  env.click('owner_tool_show');
  assertEqual(env.field('question_text'), 'Edited <u>stem</u>\n\nSecond paragraph.', 'stem preserved');
  assertEqual(env.field('option_b'), 'Edited B', 'option preserved');
});

test('skip advances deterministically and clears the marker', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  env.click('owner_tool_skip');
  assertEqual(env.state().currentIndex, 1, 'skipped one');
  assertEqual(env.state().pendingSubmission, null, 'marker cleared');
  env.click('owner_tool_skip');
  assertEqual(env.state().currentIndex, 2, 'skipped past the end');
  assert(env.text('owner_tool_status').indexOf('All 2 questions done') > -1, 'end state reported');
});

test('reset clears all owner state and metadata but leaves legacy keys untouched', () => {
  const env = createEnv({
    storage: {
      ocrQueue: '{"items":[{"num":1}],"i":0}',
      ocrMeta: '{"subject_id":"1"}',
      ansKey: '{"1":"A"}',
    },
  });
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  env.click('owner_context_add');
  env.edit('owner_context_0_title', 'Reset proof');
  env.click('owner_tool_reset');
  const state = env.state();
  assertEqual(state.items.length, 0, 'queue cleared');
  assertEqual(state.contexts.length, 0, 'contexts cleared');
  assertEqual(state.currentIndex, 0, 'position reset');
  assertEqual(state.pendingSubmission, null, 'marker cleared');
  assertEqual(Object.keys(state.answerKey).length, 0, 'answer key cleared');
  assertEqual(state.metadata.subject_id, '', 'subject metadata cleared');
  assertEqual(state.metadata.exam_category_id, '', 'category metadata cleared');
  assertEqual(state.metadata.exam_year, '', 'year metadata cleared');
  assertEqual(env.field('subject_id'), '', 'native subject cleared');
  assertEqual(env.field('exam_year'), '', 'native year cleared');
  assertEqual(env.field('question_text'), '', 'native question cleared');
  assertEqual(env.field('context_id'), '', 'native context link cleared');
  assertEqual(env.radioIndex(), -1, 'no radio remains ticked');
  assert(env.raw.has('ocrQueue') && env.raw.has('ocrMeta') && env.raw.has('ansKey'), 'legacy keys untouched');
  assert(env.text('owner_tool_status').indexOf('No queue yet') > -1, 'empty status shown');
});

test('one context card creates, binds, links, and survives a question save', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Shared passage', text: 'Read this passage.', targets: '1,2', expected: '2' });
  const localId = env.state().contexts[0].localId;
  assertEqual(env.state().items[0].contextRef, localId, 'question one is linked');
  assertEqual(env.state().items[0].contextPosition, '1', 'question one position');
  assertEqual(env.state().items[1].contextPosition, '2', 'question two position');
  env.click('owner_context_0_fill');
  assertEqual(env.contextField('title'), 'Shared passage', 'native title prefilled');
  assertEqual(env.contextField('expected_member_count'), '2', 'native expected count prefilled');
  submitContextForm(env);
  assertEqual(env.state().pendingSubmission.kind, 'context-create', 'context create marker stored');
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  const state = next.state();
  assertEqual(state.contexts[0].serverId, 77, 'returned context id bound');
  assertEqual(state.contexts[0].stale, false, 'new context is not stale');
  assertEqual(state.pendingSubmission, null, 'context marker cleared');
  assertEqual(next.field('context_id'), '77', 'native context link filled');
  assertEqual(next.field('context_position'), '1', 'native position filled');
  assertEqual(next.byId('save_question').disabled, false, 'linked save is available');
  next.submit();
  assertEqual(next.state().pendingSubmission.kind, 'question', 'question marker stored');
  const after = next.reload({ success: 'Question saved successfully (Question ID: 5040).' });
  assertEqual(after.state().currentIndex, 1, 'question advanced once');
  assertEqual(after.state().contexts[0].serverId, 77, 'context card remains');
  assertEqual(after.field('context_id'), '77', 'next member keeps the context');
  assertEqual(after.field('context_position'), '2', 'next member position');
  const repeated = after.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(repeated.state().contexts[0].serverId, 77, 'an unbounded flash does not bind again');
  assertEqual(repeated.state().currentIndex, 1, 'an unbounded flash does not advance the queue');
});

test('multiple context cards bind their own IDs and members', () => {
  const first = createEnv();
  first.paste(FULL_PASTE);
  first.click('owner_tool_load');
  first.click('owner_context_add');
  configureContext(first, 0, { title: 'First passage', text: 'First.', targets: '1', expected: '1' });
  first.click('owner_context_add');
  configureContext(first, 1, { title: 'Second passage', text: 'Second.', targets: '2', expected: '1' });
  first.click('owner_context_0_fill');
  submitContextForm(first);
  const second = first.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  second.click('owner_context_1_fill');
  submitContextForm(second);
  const third = second.reload({ success: 'Context #78 created. Link its members, then activate it.' });
  const state = third.state();
  assertEqual(state.contexts[0].serverId, 77, 'first context id');
  assertEqual(state.contexts[1].serverId, 78, 'second context id');
  assertEqual(state.items[0].contextRef, state.contexts[0].localId, 'question one links first');
  assertEqual(state.items[1].contextRef, state.contexts[1].localId, 'question two links second');
  assertEqual(third.field('context_id'), '77', 'question one uses first id');
  third.click('owner_tool_skip');
  assertEqual(third.field('context_id'), '78', 'question two uses second id');
  assertEqual(third.field('context_position'), '1', 'second context position is one');
});

test('a standalone question clears the native context fields', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Only question one', text: 'Passage.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(next.field('context_id'), '77', 'linked question has a context');
  next.click('owner_tool_skip');
  assertEqual(next.field('context_id'), '', 'standalone context id cleared');
  assertEqual(next.field('context_position'), '', 'standalone position cleared');
  assertEqual(next.field('context_slot'), '', 'standalone slot cleared');
});

test('a saved context edit becomes stale and refuses a linked question save', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Original', text: 'Original text.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  next.edit('owner_context_0_title', 'Edited after save');
  assertEqual(next.state().contexts[0].stale, true, 'saved edit is stale');
  assertEqual(next.byId('save_question').disabled, true, 'linked save button disabled');
  assert(next.text('owner_context_link_warning').indexOf('Update it') > -1, 'update warning shown');
  next.submit();
  assertEqual(next.state().pendingSubmission, null, 'no question marker while stale');
  next.click('owner_context_0_fill');
  submitContextForm(next);
  assertEqual(next.state().pendingSubmission.kind, 'context-update', 'context update marker stored');
  const after = next.reload({ success: 'Context #77 updated. It is inactive until revalidated.' });
  assertEqual(after.state().contexts[0].stale, false, 'successful update clears stale');
  assertEqual(after.state().pendingSubmission, null, 'update marker cleared');
  assertEqual(after.byId('save_question').disabled, false, 'linked save is available again');
});

test('a near-miss context flash never binds an ID or retries', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Pending', text: 'Pending.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created.' });
  assertEqual(next.state().contexts[0].serverId, null, 'near-miss flash does not bind');
  assertEqual(next.state().pendingSubmission, null, 'marker cleared');
  assert(next.text('owner_context_warning').indexOf('Could not confirm') > -1, 'review warning shown');
  const again = next.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(again.state().contexts[0].serverId, null, 'a later flash cannot bind the cleared marker');
});

test('a rejected context save clears its marker without binding or advancing', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Rejected', text: 'Rejected.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({
    error: 'The context could not be saved.',
    success: 'Context #77 created. Link its members, then activate it.',
  });
  assertEqual(next.state().contexts[0].serverId, null, 'rejected save does not bind');
  assertEqual(next.state().pendingSubmission, null, 'context marker cleared');
  assertEqual(next.state().currentIndex, 0, 'queue did not advance');
  assert(next.text('owner_context_warning').indexOf('rejected') > -1, 'rejection warning shown');
});

test('key-only paste keeps the queue and context cards', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Kept', text: 'Kept.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  next.paste('1.C 2.D');
  next.click('owner_tool_load');
  const state = next.state();
  assertEqual(state.items.length, 2, 'queue retained');
  assertEqual(state.contexts.length, 1, 'context card retained');
  assertEqual(state.contexts[0].serverId, 77, 'server id retained');
  assertEqual(state.answerKey['1'], 'C', 'answer key replaced');
});

test('cloze contexts assign sorted gap slots by target order', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, {
    type: 'cloze',
    title: 'Cloze',
    text: 'One [[gap:3]] and two [[gap:1]].',
    targets: '1,2',
    expected: '2',
  });
  env.click('owner_context_0_fill');
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(next.field('context_slot'), '1', 'first target gets the first sorted slot');
  next.click('owner_tool_skip');
  assertEqual(next.field('context_slot'), '3', 'second target gets the next slot');
});

test('a missing native context form warns without arming a submission', () => {
  const env = createEnv({ contextForm: false });
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'No form', text: 'No form.', targets: '1', expected: '1' });
  env.click('owner_context_0_fill');
  assert(env.text('owner_context_warning').indexOf('unavailable') > -1, 'unavailable form warning');
  assertEqual(env.state().pendingSubmission, null, 'no context marker');
  assertEqual(env.byId('save_question').disabled, true, 'uncreated context blocks a linked save');
  env.submit();
  assertEqual(env.state().pendingSubmission, null, 'no question marker for an uncreated context');
});

test('legacy bookmarklet state is reported, never imported or deleted', () => {
  const env = createEnv({
    storage: {
      ocrQueue: '{"items":[{"num":1}],"i":0}',
      ocrMeta: '{"subject_id":"1"}',
      ansKey: '{"1":"A"}',
    },
  });
  const warning = env.text('owner_tool_warning');
  assert(warning.indexOf('ocrQueue') > -1, 'legacy keys named');
  assert(warning.indexOf('not imported') > -1, 'import refused');
  assertEqual(env.state(), null, 'no owner-tool state created');
  assert(env.raw.has('ocrQueue'), 'legacy queue left in place');
  assert(env.raw.has('ansKey'), 'legacy key left in place');
  assertEqual(env.field('question_text'), '', 'nothing imported into the form');
});

test('edit pages get formatting only and no storage writes', () => {
  const env = createEnv({ search: '?edit=42' });
  assertEqual(env.doc.getElementById('owner_tool'), null, 'no panel');
  assert(env.doc.getElementById('owner_format_tool'), 'formatting panel is present');
  env.type('Edit this existing question.');
  env.select(5, 9);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), 'Edit <u>this</u> existing question.', 'edit selection underlined');
  assertEqual(env.raw.size, 0, 'no storage writes');
});

test('an invalid edit URL with an Add form keeps the importer', () => {
  const env = createEnv({ search: '?edit=bad', action: 'save_question' });
  assert(env.doc.getElementById('owner_tool'), 'Add importer is present');
  assertEqual(env.doc.getElementById('owner_format_tool'), null, 'format-only panel is absent');
});

test('stale-parser state is refused and preserved', () => {
  const stale = stateApi.emptyState('1.9.9', 'q-old');
  stale.items = [{ num: 1, question: 'Old stem from the previous parser', a: 'A', b: 'B', c: 'C', d: 'D', e: '', f: '', flags: [] }];
  stale.answerKey = { 1: 'A' };
  const env = createEnv({ storage: { [stateApi.KEY]: JSON.stringify(stale) } });
  assert(env.text('owner_tool_warning').indexOf('was not loaded') > -1, 'refusal warning shown');
  assertEqual(env.field('question_text'), '', 'stale queue is not filled');
  assertEqual(env.state().parserVersion, '1.9.9', 'stored state is not rewritten');
  assertEqual(env.state().items.length, 1, 'stored items preserved');
});

test('stale-parser state cannot be re-versioned by a key paste or native submit', () => {
  const stale = stateApi.emptyState('2.0.0', 'q-old');
  stale.items = [{ num: 1, question: 'Old flattened stem', a: 'A', b: 'B', c: 'C', d: 'D', e: '', f: '', flags: [] }];
  stale.answerKey = { 1: 'A' };
  const stored = JSON.stringify(stale);
  const env = createEnv({ storage: { [stateApi.KEY]: stored } });
  env.paste('1.B');
  env.click('owner_tool_load');
  env.submit();
  assertEqual(env.raw.get(stateApi.KEY), stored, 'stale state remains byte-for-byte unchanged');
  assert(env.visible('owner_tool_reset'), 'Reset remains available for explicit replacement');
  env.click('owner_tool_reset');
  assertEqual(env.state().parserVersion, parser.version, 'Reset creates current state');
  assertEqual(env.state().items.length, 0, 'Reset discards stale items');
});

test('a full re-paste replaces stale state instead of re-versioning it', () => {
  const stale = stateApi.emptyState('2.0.0', 'q-old');
  stale.items = [{ num: 1, question: 'Old flattened stem', a: 'A', b: 'B', c: 'C', d: 'D', e: '', f: '', flags: [] }];
  stale.answerKey = { 1: 'A' };
  stale.contexts = [{ id: 'old-context' }];
  stale.unknownExtension = { keep: false };
  const env = createEnv({ storage: { [stateApi.KEY]: JSON.stringify(stale) } });
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.parserVersion, parser.version, 're-paste stamps the current parser');
  assertEqual(state.queueId === 'q-old', false, 'new queue identity');
  assertEqual(state.contexts.length, 0, 'old contexts are discarded');
  assertEqual(state.unknownExtension, undefined, 'unknown fields are discarded');
  assertEqual(state.items.length, 2, 'items are replaced');
  assertEqual(state.answerKey['1'], 'D', 'key is replaced');
});

test('corrupt state warns without crashing or deleting', () => {
  const env = createEnv({ storage: { [stateApi.KEY]: '{not json' } });
  assert(env.text('owner_tool_warning').indexOf('could not be used') > -1, 'corrupt warning shown');
  assertEqual(env.raw.get(stateApi.KEY), '{not json', 'corrupt value preserved');
});

test('underline wraps the selected words with the exact markers', () => {
  const env = createEnv();
  env.type('The signs are ominous rather than encouraging.');
  env.select(14, 21);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), 'The signs are <u>ominous</u> rather than encouraging.', 'markers wrapped');
  const box = env.form.elements.question_text;
  assertEqual(box.selectionStart, 17, 'selection starts inside the tags');
  assertEqual(box.selectionEnd, 24, 'the same words stay selected');
  assertEqual(env.underlined('owner_tool_preview').join('|'), 'ominous', 'only the marked words are underlined');
  assert(env.text('owner_tool_preview').indexOf('<u>') === -1, 'the preview shows no literal markers');
});

test('Ctrl+U underlines, and the same shortcut removes it', () => {
  const env = createEnv();
  env.type('The signs are ominous rather than encouraging.');
  env.select(14, 21);
  let prevented = false;
  env.keydown({ ctrlKey: true, key: 'u', preventDefault() { prevented = true; } });
  assert(prevented, 'the browser default for Ctrl+U is suppressed');
  assertEqual(env.field('question_text'), 'The signs are <u>ominous</u> rather than encouraging.', 'wrapped by shortcut');
  env.keydown({ ctrlKey: true, key: 'u', preventDefault() {} });
  assertEqual(env.field('question_text'), 'The signs are ominous rather than encouraging.', 'second press unwraps');
});

test('an empty selection inserts no markup and keeps the caret', () => {
  const env = createEnv();
  env.type('The signs are ominous rather than encouraging.');
  env.select(4, 4);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), 'The signs are ominous rather than encouraging.', 'text unchanged');
  const box = env.form.elements.question_text;
  assertEqual(box.selectionStart, 4, 'caret stays put');
  assertEqual(box.selectionEnd, 4, 'no selection is invented');
  assert(env.text('owner_tool_hint').indexOf('Select the words') > -1, 'the owner is told what to select');
});

test('the preview keeps paragraphs and renders markers, not markup', () => {
  const env = createEnv();
  env.type('Ominous rather than <u>encouraging</u>.\n\nA second paragraph.');
  assertEqual(env.text('owner_tool_preview'), 'Ominous rather than encouraging.\n\nA second paragraph.', 'paragraph break kept');
  assertEqual(env.underlined('owner_tool_preview').join('|'), 'encouraging', 'one underlined run');
});

test('scripts, attributes, other tags, and encoded markers stay text', () => {
  const env = createEnv();
  env.type('<script>alert(1)</script> <u onclick="x">click</u> <b>bold</b> &lt;u&gt; <U>upper</U> </u>');
  const preview = env.text('owner_tool_preview');
  assert(preview.indexOf('<script>') > -1, 'the script tag is literal text');
  assert(preview.indexOf('<u onclick') > -1, 'the attribute form is literal text');
  assertEqual(env.underlined('owner_tool_preview').length, 0, 'no underline element is created');
});

test('format() restores only the exact markers', () => {
  assertEqual(textApi.format('<u>a</u>'), '<u>a</u>', 'exact markers restored');
  assertEqual(textApi.format('&lt;u&gt;'), '&amp;lt;u&amp;gt;', 'encoded markers stay text');
  assertEqual(textApi.format('<u class="x">a</u>'), '&lt;u class=&quot;x&quot;&gt;a&lt;/u&gt;', 'attributes stay text');
  assertEqual(textApi.format('a < b'), 'a &lt; b', 'a lone angle bracket is escaped');
  assertEqual(textApi.format('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'scripts are escaped');
  assertEqual(textApi.format('<u>one <u>two</u>'), '<u>one &lt;u&gt;two</u>', 'a nested opener stays text');
  assertEqual(textApi.format('<u>open only'), '&lt;u&gt;open only', 'an unmatched opener stays text');
  assertEqual(textApi.format('<u>'.repeat(1000)), '&lt;u&gt;'.repeat(1000), 'many unmatched openers stay literal');
  assertEqual(textApi.strip('a <u>b</u> c'), 'a b c', 'strip removes only exact markers');
  assertEqual(textApi.strip('a <u>open only'), 'a <u>open only', 'strip keeps an unmatched opener');
  assertEqual(textApi.strip('a &lt;u&gt; b'), 'a &lt;u&gt; b', 'strip leaves encoded markers alone');
});

test('every deployed question-text sink uses the shared renderer', () => {
  [CBT_SOURCE, PRACTICE_SOURCE].forEach(source => {
    assert(source.indexOf("renderQuestionText(questionArea.querySelector('.question-text'), q.question)") > -1,
      'candidate question uses DOM renderer');
    assert(source.indexOf('renderQuestionText(questionLabel, q.question)') > -1,
      'result question uses DOM renderer');
    assert(source.indexOf('${formatQuestionText(q.question)}') === -1,
      'stored question text is not interpolated into innerHTML');
  });
  assert(ADMIN_SOURCE.indexOf('cbt_strip_formatting((string) $item[\'question_text\'])') > -1,
    'admin summary strips only shared formatting markers');
  assert(DETAIL_SOURCE.indexOf("require_once __DIR__ . '/render.php';") > -1,
    'detail page loads the PHP renderer');
  assert(DETAIL_SOURCE.indexOf("cbt_format_text((string) $question['question_text'])") > -1,
    'detail page formats question text');
  assert(DETAIL_SOURCE.indexOf("answer_h($question['answer_explanation'])") > -1,
    'detail explanation stays plain text');
});

test('critical owner-tool warnings have distinct non-server styling', () => {
  assert(/\.owner-tool-error\s*\{[^}]*background:[^}]*color:[^}]*border:[^}]*\}/.test(STYLE_SOURCE),
    'owner-tool-error defines background, color, and border');
  assert(STYLE_SOURCE.indexOf('#fff4e5') > -1, 'warning styling is distinct from the server error red');
});

test('PHP preserves leading newlines and posted values before CSRF rejection', () => {
  assert(ADMIN_SOURCE.indexOf('required><?php echo "\\n" . h($formValues[\'question_text\']); ?></textarea>') > -1,
    'question textarea emits one sacrificial newline');
  const hydrateAt = ADMIN_SOURCE.indexOf('foreach ($formValues as $key => $defaultValue)');
  const csrfAt = ADMIN_SOURCE.indexOf('if (!valid_csrf())');
  assert(hydrateAt > -1 && csrfAt > hydrateAt, 'posted values hydrate before CSRF rejection');
  assertEqual((ADMIN_SOURCE.match(/foreach \(\$formValues as \$key => \$defaultValue\)/g) || []).length, 1,
    'post hydration is not duplicated');
});

test('underline refuses to create nested or overlapping marker pairs', () => {
  const env = createEnv();
  env.type('<u>abcdef</u>');
  env.select(5, 7);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), '<u>abcdef</u>', 'partial inner selection is unchanged');
  assert(env.text('owner_tool_hint').indexOf('entire underlined text') > -1, 'owner receives a useful instruction');
});

test('underline refuses to remove markers from a nested boundary', () => {
  const env = createEnv();
  const value = '<u>outer <u>inner</u>';
  env.type(value);
  const start = value.indexOf('inner');
  env.select(start, start + 'inner'.length);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), value, 'malformed nested text is unchanged');
  assert(env.text('owner_tool_hint').indexOf('overlapping') > -1, 'overlap guidance shown');
});

test('underline retains the last non-empty selection when toolbar focus collapses it', () => {
  const env = createEnv();
  env.type('Edit this existing question.');
  env.select(5, 9);
  env.form.elements.question_text.dispatch('select');
  env.select(0, 0);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), 'Edit <u>this</u> existing question.', 'remembered words are underlined');
});

test('programmatic fill clears a selection remembered from the prior question', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.select(4, 10);
  env.form.elements.question_text.dispatch('select');
  env.click('owner_tool_skip');
  const before = env.field('question_text');
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), before, 'next question is unchanged');
  assert(env.text('owner_tool_hint').indexOf('Select the words') > -1, 'empty-selection guidance shown');
});

test('underline refuses a selection that touches only part of a marker', () => {
  const env = createEnv();
  env.type('<u>word</u>');
  env.select(8, 10);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), '<u>word</u>', 'partial closing marker is unchanged');
  assert(env.text('owner_tool_hint').indexOf('entire underlined text') > -1, 'overlap guidance shown');
});

test('the preview refreshes after a programmatic fill and a native reset', async () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  assert(env.text('owner_tool_preview').indexOf('father of faith') > -1, 'fill updates the preview');
  env.reset();
  await new Promise(resolve => setTimeout(resolve, 10));
  assertEqual(env.text('owner_tool_preview'), '', 'reset clears the preview');
});

test('stems keep paragraphs while option values fold to one line', () => {
  const item = parser.parseQuestion({
    num: 1,
    text: 'Stem line\ncontinues here\n\nsecond paragraph.\nA. first option\ncontinued line\nB. two\nC. three\nD. four',
  });
  assertEqual(item.question, 'Stem line continues here\n\nsecond paragraph.', 'single wrap folds, blank line remains');
  assertEqual(item.a, 'first option continued line', 'option value is one line');
});

test('underlining never changes the native submit path', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.setField('question_text', '<u>Underlined</u> stem\n\nSecond paragraph.');
  env.submit();
  const state = env.state();
  assertEqual(state.pendingSubmission.index, 0, 'marker recorded');
  assertEqual(env.form.elements.is_active.checked, false, 'active checkbox still untouched');
  const next = env.reload({ success: 'Question saved successfully (Question ID: 5041).' });
  assertEqual(next.state().currentIndex, 1, 'the exact flash still advances the queue');
});

test('excluded behavior is absent from the production controller', () => {
  ['fetch(', 'autosave', 'ocrQueue', 'ocrMeta', 'ansKey', 'ocrSubmitted', 'dry run', 'image plan', 'batch history']
    .forEach(term => assert(CONTROLLER_SOURCE.toLowerCase().indexOf(term.toLowerCase()) === -1,
      'controller must not contain ' + term));
  const submitAt = CONTROLLER_SOURCE.indexOf("addEventListener('submit'");
  assert(submitAt > -1, 'the native submit listener exists');
  const submitBody = CONTROLLER_SOURCE.slice(submitAt, submitAt + 400);
  assert(submitBody.indexOf('preventDefault') === -1, 'native submit is never intercepted');
  assertEqual((CONTROLLER_SOURCE.match(/\.preventDefault\(/g) || []).length, 2, 'only underline keyboard and focus retention suppress defaults');
  assert(CONTROLLER_SOURCE.indexOf('is_active') === -1, 'active checkbox is never forced');
});

(async () => {
  for (const entry of queue) {
    try {
      await entry.fn();
      console.log('[PASS] ' + entry.name);
      passed++;
    } catch (error) {
      console.log('[FAIL] ' + entry.name + ' - ' + error.message);
      failed++;
    }
  }
  console.log('\nSummary');
  console.log('  PASS: ' + passed);
  console.log('  FAIL: ' + failed);
  console.log('  state fixture: ' + stateApi.KEY + ' v' + stateApi.STATE_VERSION);
  process.exit(failed === 0 ? 0 : 1);
})();
