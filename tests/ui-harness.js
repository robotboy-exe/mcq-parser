'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UI_FILE = path.resolve(__dirname, '../src/ui/ui.js');
const UI_SOURCE = fs.readFileSync(UI_FILE, 'utf8');
const parser = require('../src/parser/parser.js');
const SET_TIMEOUT = setTimeout;
const CLEAR_TIMEOUT = clearTimeout;

function fakeElement(doc, tag, props) {
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
    files: [],
    href: '',
    children: [],
    parentNode: null,
    style: {},
    listeners: {},
    _textContent: '',
    _innerHTML: '',
    get textContent() { return this._textContent; },
    set textContent(text) {
      this._textContent = String(text == null ? '' : text);
      if (this._textContent === '') this.children = [];
    },
    get innerHTML() { return this._innerHTML; },
    set innerHTML(html) {
      this._innerHTML = String(html == null ? '' : html);
      doc.registerFromHTML(this, this._innerHTML);
    },
    appendChild(child) {
      if (child && child.parentNode) child.remove();
      if (child) child.parentNode = this;
      this.children.push(child);
      if (child && child.id) doc.byId.set(child.id, child);
      return child;
    },
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); },
    insertAdjacentElement(_where, node) {
      const parent = this.parentNode || (this === doc.form ? doc.form : null);
      if (parent && typeof parent.appendChild === 'function') parent.appendChild(node);
      else if (node && node.id) doc.byId.set(node.id, node);
      return node;
    },
    before(node) {
      if (this.parentNode) this.parentNode.appendChild(node);
      else doc.body.appendChild(node);
    },
    remove() {
      if (!this.parentNode) return;
      const list = this.parentNode.children;
      const i = list.indexOf(this);
      if (i > -1) list.splice(i, 1);
      this.parentNode = null;
    },
    closest(selector) {
      if (selector === '.admin-field' && this.className && String(this.className).split(/\s+/).includes('admin-field')) return this;
      return this.parentNode && typeof this.parentNode.closest === 'function' ? this.parentNode.closest(selector) : null;
    },
    focus() {},
    select() {},
    addEventListener(type, fn) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    },
    removeEventListener() {},
    dispatch(type, event) {
      const e = event || { preventDefault() {}, stopImmediatePropagation() {} };
      (this.listeners[type] || []).slice().forEach(fn => fn(e));
    },
    querySelector(selector) { return doc.query(this, selector); },
    querySelectorAll(selector) { return doc.queryAll(this, selector); }
  };
  Object.assign(el, props || {});
  return el;
}

function selectElement(doc, id, options, selected) {
  const el = fakeElement(doc, 'select', { id, name: id });
  el.options = options.map(opt => {
    const text = typeof opt === 'string' ? opt : opt.text;
    const value = typeof opt === 'string' ? String(options.indexOf(opt) + 1) : String(opt.value);
    return { text, value, selected: false };
  });
  let value = selected == null ? (el.options[0] ? el.options[0].value : '') : String(selected);
  Object.defineProperty(el, 'value', {
    get() { return value; },
    set(next) {
      value = String(next == null ? '' : next);
      const i = el.options.findIndex(opt => String(opt.value) === value);
      if (i > -1) el.selectedIndex = i;
    }
  });
  el.selectedIndex = Math.max(0, el.options.findIndex(opt => String(opt.value) === value));
  return el;
}

function createDocument() {
  const doc = {
    byId: new Map(),
    body: null,
    form: null,
    table: null,
    radios: [],
    actionInput: null,
    submitButton: null,
    errorElement: null,
    visibilityListeners: [],
    hidden: false,
    registerFromHTML(_owner, html) {
      const re = /id="([^"]+)"/g;
      let match;
      while ((match = re.exec(html))) {
        const id = match[1];
        if (!this.byId.has(id)) this.byId.set(id, fakeElement(this, guessTag(html, id), { id }));
      }
    },
    getElementById(id) {
      return this.byId.get(id) || null;
    },
    createElement(tag) {
      return fakeElement(this, tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
    query(scope, selector) {
      if (selector === 'input[name=action][value=save_question]') return this.actionInput;
      if (selector === 'input[name=correct_option]') return this.radios[0] || null;
      if (selector === 'input[name=correct_option]:checked') {
        return this.radios.find(r => r.checked) || null;
      }
      let m = selector.match(/^input\[name="correct_option"\]\[value="(\d+)"\]$/);
      if (m) return this.radios[Number(m[1])] || null;
      if (selector === '.admin-error') return this.errorElement;
      if (selector === '.admin-table') return this.table;
      if (selector === 'button[type=submit]') return this.submitButton;
      if (selector === 'input[name=is_active], #is_active') return this.byId.get('is_active') || null;
      if (scope && scope.id && selector.startsWith('#')) return this.byId.get(selector.slice(1)) || null;
      return null;
    },
    queryAll(scope, selector) {
      if (selector === 'script[src*="ocr_helper.js"]') return [];
      if (selector === '[name=correct_option]') return this.radios.slice();
      if (selector === 'thead th') return this.table ? this.table.headCells.slice() : [];
      if (selector === 'tbody tr') return this.table ? this.table.rows.slice() : [];
      if (selector === 'td') return scope && scope.cells ? scope.cells.slice() : [];
      return [];
    },
    querySelector(selector) {
      return this.query(this.body, selector);
    },
    querySelectorAll(selector) {
      return this.queryAll(this.body, selector);
    },
    addEventListener(type, fn) {
      if (type === 'visibilitychange') this.visibilityListeners.push(fn);
    }
  };
  doc.body = fakeElement(doc, 'body');
  return doc;
}

function guessTag(html, id) {
  const before = html.slice(0, html.indexOf('id="' + id + '"'));
  const tags = [...before.matchAll(/<([a-zA-Z][\w-]*)\b[^<>]*$/g)];
  return tags.length ? tags[tags.length - 1][1].toLowerCase() : 'div';
}

function createForm(doc) {
  const subjects = [
    { text: 'CRS', value: '1' },
    { text: 'CRK', value: '9' },
    { text: 'Government', value: '2' }
  ];
  const categories = [
    { text: 'JAMB / UTME', value: '2' },
    { text: 'WASCE / NECO / GCE', value: '3' },
    { text: 'JAMB', value: '8' }
  ];
  const form = fakeElement(doc, 'form', { id: 'question_form' });
  const subject = selectElement(doc, 'subject_id', subjects, '1');
  subject.name = 'subject_id';
  const category = selectElement(doc, 'exam_category_id', categories, '2');
  category.name = 'exam_category_id';
  const fields = {
    subject_id: subject,
    exam_category_id: category,
    exam_year: fakeElement(doc, 'input', { id: 'exam_year', name: 'exam_year', value: '2021' }),
    question_text: fakeElement(doc, 'textarea', { id: 'question_text', name: 'question_text', value: '' }),
    option_a: fakeElement(doc, 'input', { id: 'option_a', name: 'option_a', value: '' }),
    option_b: fakeElement(doc, 'input', { id: 'option_b', name: 'option_b', value: '' }),
    option_c: fakeElement(doc, 'input', { id: 'option_c', name: 'option_c', value: '' }),
    option_d: fakeElement(doc, 'input', { id: 'option_d', name: 'option_d', value: '' }),
    is_active: fakeElement(doc, 'input', { id: 'is_active', name: 'is_active', type: 'checkbox', checked: false }),
    question_image: fakeElement(doc, 'input', { id: 'question_image', name: 'question_image', value: '' }),
    answer_video: fakeElement(doc, 'input', { id: 'answer_video', name: 'answer_video', value: '' }),
    answer_explanation: fakeElement(doc, 'textarea', { id: 'answer_explanation', name: 'answer_explanation', value: '' })
  };
  form.elements = fields;
  Object.keys(fields).forEach(name => doc.byId.set(name, fields[name]));
  doc.radios = [0, 1, 2, 3].map(i => {
    const radio = fakeElement(doc, 'input', {
      id: 'correct_option_' + i,
      name: 'correct_option',
      type: 'radio',
      value: String(i)
    });
    radio.form = form;
    return radio;
  });
  const submit = fakeElement(doc, 'button', { id: 'save_question', type: 'submit' });
  form.querySelector = selector => doc.query(form, selector);
  form.querySelectorAll = selector => doc.queryAll(form, selector);
  form.reset = () => {
    fields.question_text.value = '';
    ['option_a', 'option_b', 'option_c', 'option_d'].forEach(name => { fields[name].value = ''; });
  };
  doc.submitButton = submit;
  doc.actionInput = fakeElement(doc, 'input', { name: 'action', value: 'save_question', form });
  doc.form = form;
  doc.byId.set('question_form', form);
  return form;
}

function parseErrorText(text) {
  const m = String(text || '').match(/<[^>]*class="[^"]*admin-error[^"]*"[^>]*>([\s\S]*?)<\//i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim();
}

function createUI(options) {
  const opts = options || {};
  const doc = createDocument();
  const form = createForm(doc);
  const storage = new Map();
  Object.keys(opts.storage || {}).forEach(key => {
    storage.set(key, JSON.stringify(opts.storage[key]));
  });
  const posts = [];
  const gets = [];
  const replies = (opts.replies || []).slice();
  const replyFor = request => {
    if (typeof opts.reply === 'function') return opts.reply(request, posts.length);
    return replies.length ? replies.shift() : { redirected: true, text: 'Question saved successfully (Question ID: 500)' };
  };
  let nextError = null;

  const failStorageKeys = new Set(opts.failStorageKeys || []);
  const localStorage = {
    getItem: key => {
      if (failStorageKeys.has(key)) throw new Error('storage read failed for ' + key);
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem: (key, value) => {
      if (failStorageKeys.has(key)) throw new Error('storage write failed for ' + key);
      storage.set(key, String(value));
    },
    removeItem: key => {
      if (failStorageKeys.has(key)) throw new Error('storage delete failed for ' + key);
      storage.delete(key);
    }
  };

  class FormDataMock {
    constructor(formEl) {
      this.map = new Map();
      if (!formEl || !formEl.elements) return;
      Object.keys(formEl.elements).forEach(name => {
        const el = formEl.elements[name];
        if (!el) return;
        if (el.type === 'checkbox') {
          if (el.checked) this.map.set(name, el.value === '' ? 'on' : el.value);
        } else if (el.type === 'radio') {
          if (el.checked) this.map.set(name, el.value);
        } else {
          this.map.set(name, el.value == null ? '' : String(el.value));
        }
      });
      formEl.elements && Array.isArray(doc.radios) && doc.radios.forEach(radio => {
        if (radio.checked) this.map.set('correct_option', radio.value);
      });
    }
    get(name) { return this.map.has(name) ? this.map.get(name) : null; }
    set(name, value) {
      const fileLike = value && typeof value === 'object' && typeof value.name === 'string';
      this.map.set(name, fileLike ? value : String(value));
    }
    delete(name) { this.map.delete(name); }
    has(name) { return this.map.has(name); }
    entries() { return this.map.entries(); }
  }

  function FakeDOMParser() {
    this.parseFromString = text => ({
      querySelector(selector) {
        if (selector === '.admin-error') {
          const errorText = nextError == null ? parseErrorText(text) : nextError;
          nextError = null;
          return errorText ? { textContent: errorText } : null;
        }
        if (selector === 'input[name=is_active], #is_active') {
          return { checked: Boolean(opts.inactiveChecked) };
        }
        return null;
      }
    });
  }

  let batchSeq = 0;
  const fetchMock = async (url, init) => {
    if (init && init.method === 'POST') {
      posts.push({ url, body: init.body });
      const reply = replyFor(init);
      nextError = Object.prototype.hasOwnProperty.call(reply, 'errorText') ? reply.errorText : null;
      return {
        redirected: Boolean(reply.redirected),
        ok: reply.ok !== false,
        text: async () => String(reply.text == null ? '' : reply.text)
      };
    }
    gets.push(url);
    return {
      ok: true,
      text: async () => String(opts.inactiveHtml == null ? '<html></html>' : opts.inactiveHtml)
    };
  };

  const sandbox = {
    document: doc,
    localStorage,
    location: { href: 'https://example.test/admin_questions.php', pathname: '/admin_questions.php', search: '' },
    navigator: {},
    FormData: FormDataMock,
    DOMParser: FakeDOMParser,
    fetch: fetchMock,
    alert: () => {},
    prompt: () => null,
    AbortController: typeof AbortController !== 'undefined' ? AbortController : undefined,
    crypto: { randomUUID: () => 'test-batch-' + (++batchSeq) },
    setTimeout: (fn, ms) => {
      if (ms >= 1000 && typeof opts.onLongTimeout === 'function') opts.onLongTimeout(ms);
      return SET_TIMEOUT(fn, ms >= 1000 ? 0 : ms);
    },
    clearTimeout: id => { if (id) CLEAR_TIMEOUT(id); },
    setInterval: () => 0,
    clearInterval: () => {},
    Date,
    Math,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    console
  };
  Object.keys(parser).forEach(key => { sandbox[key] = parser[key]; });
  vm.createContext(sandbox);
  vm.runInContext(UI_SOURCE + '\nrunOCRBookmarklet();', sandbox, { filename: UI_FILE });

  const flush = async () => {
    for (let i = 0; i < 20; i++) await new Promise(resolve => SET_TIMEOUT(resolve, 0));
  };

  return {
    doc,
    form,
    storage: {
      get: key => {
        const raw = storage.get(key);
        return raw == null ? null : JSON.parse(raw);
      },
      set: (key, value) => storage.set(key, JSON.stringify(value)),
      has: key => storage.has(key),
      delete: key => storage.delete(key),
      keys: () => Array.from(storage.keys()).sort()
    },
    posts,
    gets,
    flush,
    setField(name, value) {
      form.elements[name].value = value;
    },
    setPaste(text) {
      const box = doc.getElementById('ocr_text');
      box.value = text;
    },
    click(id) {
      const el = doc.getElementById(id);
      if (!el || typeof el.onclick !== 'function') throw new Error('no click handler for ' + id);
      return el.onclick();
    },
    submit() {
      form.dispatch('submit');
      return flush();
    }
  };
}

module.exports = { createUI };

const SAMPLE_QUESTION = 'Who was the father of faith in the Bible?';
const SAMPLE_OPTIONS = ['Isaac', 'Jacob', 'Moses', 'Abraham'];
const SAMPLE_TEXT = '1. ' + SAMPLE_QUESTION + '\nA. ' + SAMPLE_OPTIONS[0] + '\nB. ' + SAMPLE_OPTIONS[1]
  + '\nC. ' + SAMPLE_OPTIONS[2] + '\nD. ' + SAMPLE_OPTIONS[3]
  + '\n\n=== ANSWER KEY ===\n1.A';

function sampleStorage(batchId) {
  return {
    ocrQueue: {
      items: [{
        num: 1,
        question: SAMPLE_QUESTION,
        a: SAMPLE_OPTIONS[0],
        b: SAMPLE_OPTIONS[1],
        c: SAMPLE_OPTIONS[2],
        d: SAMPLE_OPTIONS[3],
        flags: []
      }],
      i: 0,
      batchId
    },
    ansKey: { 1: 'A' },
    ansKeyBatch: batchId,
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  };
}

module.exports.SAMPLE_QUESTION = SAMPLE_QUESTION;
module.exports.SAMPLE_OPTIONS = SAMPLE_OPTIONS;
module.exports.SAMPLE_TEXT = SAMPLE_TEXT;
module.exports.sampleStorage = sampleStorage;
