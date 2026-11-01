'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const STATE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/state.js'), 'utf8');
const CONTROLLER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/controller.js'), 'utf8');
const parser = require('../src/parser/core.js');
const stateApi = require('../src/owner-tool/state.js');

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
    dispatch(type, event) {
      (this.listeners[type] || []).slice().forEach(fn => fn(event || { type }));
    },
    querySelector(selector) { return doc.query(this, selector); },
    querySelectorAll(selector) { return doc.queryAll(this, selector); }
  };
  Object.assign(el, props || {});
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
      const re = /id="([^"]+)"/g;
      let match;
      while ((match = re.exec(html))) {
        if (!this.byId.has(match[1])) this.byId.set(match[1], createElement(this, 'div', { id: match[1] }));
      }
    },
    getElementById(id) {
      return this.byId.get(id) || null;
    },
    createElement(tag) {
      return createElement(this, tag);
    },
    query(scope, selector) {
      if (selector === 'input[name=action][value=save_question]') return this.actionInput;
      if (selector === 'input[name=correct_option]') return doc.radios[0] || null;
      if (selector === '[name=correct_option]') return doc.radios[0] || null;
      const radio = selector.match(/^input\[name="correct_option"\]\[value="(\d+)"\]$/);
      if (radio) return doc.radios[Number(radio[1])] || null;
      if (selector === 'input[name=correct_option]:checked') return doc.radios.find(r => r.checked) || null;
      if (selector === '.admin-success') return this.successElement;
      if (selector === '.admin-error') return this.errorElement;
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

function createForm(doc) {
  const form = createElement(doc, 'form', { id: 'question_form' });
  const fields = {
    subject_id: selectElement(doc, 'subject_id', ['CRS', 'CRK', 'Government'], '1'),
    exam_category_id: selectElement(doc, 'exam_category_id', [
      { text: 'JAMB / UTME', value: '2' },
      { text: 'WASCE / NECO / GCE', value: '3' },
      { text: 'JAMB', value: '8' },
    ], '2'),
    exam_year: createElement(doc, 'input', { id: 'exam_year', name: 'exam_year', value: '2021' }),
    question_text: createElement(doc, 'textarea', { id: 'question_text', name: 'question_text', value: '' }),
    option_a: createElement(doc, 'input', { id: 'option_a', name: 'option_a', value: '' }),
    option_b: createElement(doc, 'input', { id: 'option_b', name: 'option_b', value: '' }),
    option_c: createElement(doc, 'input', { id: 'option_c', name: 'option_c', value: '' }),
    option_d: createElement(doc, 'input', { id: 'option_d', name: 'option_d', value: '' }),
    is_active: createElement(doc, 'input', { id: 'is_active', name: 'is_active', type: 'checkbox', checked: false }),
    question_image: createElement(doc, 'input', { id: 'question_image', name: 'question_image', value: '' }),
    answer_video: createElement(doc, 'input', { id: 'answer_video', name: 'answer_video', value: '' }),
    answer_explanation: createElement(doc, 'textarea', { id: 'answer_explanation', name: 'answer_explanation', value: '' }),
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
  doc.actionInput = createElement(doc, 'input', { name: 'action', value: 'save_question', form });
  form.before = node => doc.body.appendChild(node);
  doc.form = form;
  doc.byId.set('question_form', form);
  return form;
}

function createEnv(options) {
  const opts = options || {};
  const doc = createDocument({ success: opts.success, error: opts.error });
  const form = createForm(doc);
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

function test(name, fn) {
  try {
    fn();
    console.log('[PASS] ' + name);
    passed++;
  } catch (error) {
    console.log('[FAIL] ' + name + ' - ' + error.message);
    failed++;
  }
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
  assertEqual(state.parserVersion, '2.0.0', 'parser version');
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

test('a server error keeps the current item', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  const next = env.reload({ error: 'Question text is required.' });
  assertEqual(next.state().currentIndex, 0, 'item kept');
  assertEqual(next.state().pendingSubmission, null, 'in-flight state cleared');
  assert(next.text('owner_tool_warning').indexOf('rejected') > -1, 'error warning shown');
  assertEqual(next.field('question_text'), 'Who was the father of faith in the Bible?', 'same item refilled');
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

test('reset clears the queue and keeps the answer key', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.submit();
  env.click('owner_tool_reset');
  const state = env.state();
  assertEqual(state.items.length, 0, 'queue cleared');
  assertEqual(state.currentIndex, 0, 'position reset');
  assertEqual(state.pendingSubmission, null, 'marker cleared');
  assertEqual(state.answerKey['1'], 'D', 'key retained');
  assert(env.text('owner_tool_status').indexOf('No queue yet') > -1, 'empty status shown');
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

test('edit pages get no importer UI and no storage writes', () => {
  const env = createEnv({ search: '?edit=42' });
  assertEqual(env.doc.getElementById('owner_tool'), null, 'no panel');
  assertEqual(env.raw.size, 0, 'no storage writes');
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

test('corrupt state warns without crashing or deleting', () => {
  const env = createEnv({ storage: { [stateApi.KEY]: '{not json' } });
  assert(env.text('owner_tool_warning').indexOf('could not be used') > -1, 'corrupt warning shown');
  assertEqual(env.raw.get(stateApi.KEY), '{not json', 'corrupt value preserved');
});

test('excluded behavior is absent from the production controller', () => {
  ['fetch(', 'autosave', 'ocrQueue', 'ocrMeta', 'ansKey', 'ocrSubmitted', 'dry run', 'image plan', 'batch history']
    .forEach(term => assert(CONTROLLER_SOURCE.toLowerCase().indexOf(term.toLowerCase()) === -1,
      'controller must not contain ' + term));
  assert(CONTROLLER_SOURCE.indexOf('preventDefault') === -1, 'native submit is never intercepted');
  assert(CONTROLLER_SOURCE.indexOf('is_active') === -1, 'active checkbox is never forced');
});

console.log('\nSummary');
console.log('  PASS: ' + passed);
console.log('  FAIL: ' + failed);
console.log('  state fixture: ' + stateApi.KEY + ' v' + stateApi.STATE_VERSION);
process.exit(failed === 0 ? 0 : 1);
