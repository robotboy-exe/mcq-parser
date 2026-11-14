'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OWNER_TOOL_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/owner-tool.js'), 'utf8');
const CONTROLLER_SOURCE = (() => {
  const start = OWNER_TOOL_SOURCE.indexOf('  function startOwnerTool() {');
  const end = OWNER_TOOL_SOURCE.indexOf('\n  }\n\n  if (root) {', start);
  if (start < 0 || end < 0) throw new Error('owner tool controller section not found');
  return OWNER_TOOL_SOURCE.slice(start, end + 4);
})();
const RENDER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/render.js'), 'utf8');
const SHARED_TEXTS_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/shared-texts.js'), 'utf8');
const STYLE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/owner-tool/owner-tool.css'), 'utf8');
const ADMIN_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/admin_questions.php'), 'utf8');
const ADMIN_CONTEXT_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/admin_context.php'), 'utf8');
const ADMIN_SHARED_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/admin_shared.php'), 'utf8');
const CBT_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/cbt.php'), 'utf8');
const PRACTICE_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/cbt_practice.php'), 'utf8');
const DETAIL_SOURCE = fs.readFileSync(path.join(ROOT, 'deployed/answer_details.php'), 'utf8');
const parser = require('../src/parser/core.js');
const stateApi = require('../src/owner-tool/owner-tool.js').state;
const textApi = require('../src/owner-tool/render.js');

const COMPREHENSION_PASTE = fs.readFileSync(
  path.join(ROOT, 'fixtures/inputs/sample-comprehension-passage3.txt'), 'utf8');
const COMPREHENSION_KEY_PASTE = fs.readFileSync(
  path.join(ROOT, 'fixtures/inputs/sample-comprehension-key.txt'), 'utf8');
const COMPREHENSION_AMBIGUOUS_PASTE = fs.readFileSync(
  path.join(ROOT, 'fixtures/inputs/sample-comprehension-ambiguous.txt'), 'utf8');
const COMPREHENSION_MULTI_PASTE = fs.readFileSync(
  path.join(ROOT, 'fixtures/inputs/sample-comprehension-multi.txt'), 'utf8');
const CLOZE_PASTE = fs.readFileSync(
  path.join(ROOT, 'fixtures/inputs/sample-cloze-section6.txt'), 'utf8');
const SAMPLE_PASSAGES = fs.readFileSync(path.join(ROOT, 'sample-passages.txt'), 'utf8');

const HEADERED_COMPREHENSION_PASTE = [
  'CRS 2021 JAMB',
  '',
  'PASSAGE I',
  'The elephant is the largest land animal. It lives in herds led by an older female.',
  '',
  '1. An elephant herd is usually led by',
  'A. the oldest male',
  'B. an older female',
  'C. the youngest calf',
  'D. a lone bull',
  '',
  '2. An elephant uses its trunk for',
  'A. fighting only',
  'B. drinking and lifting',
  'C. sleeping',
  'D. hearing',
].join('\n');

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
  const contexts = env.state().contexts;
  if (contexts.length > 1) {
    const select = env.byId('owner_context_select');
    select.value = contexts[index].localId;
    select.onchange();
  }
  if (values.type) env.edit('context_type', values.type, 'change');
  if (values.title !== undefined) env.edit('context_title', values.title);
  if (values.text !== undefined) env.edit('context_text', values.text);
  if (values.targets !== undefined) env.edit('owner_context_targets', values.targets);
  if (values.expected !== undefined) env.edit('expected_member_count', values.expected);
  if (values.subject !== undefined) env.edit('context_subject_id', values.subject, 'change');
  if (values.category !== undefined) env.edit('context_exam_category_id', values.category, 'change');
  if (values.year !== undefined) env.edit('context_exam_year', values.year);
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
      ownText = '';
      (this.children || []).forEach(child => { child.parentNode = null; });
      this.children = [];
      doc.registerFromHTML(this.html, this);
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
    insertBefore(child, reference) {
      if (!reference) return this.appendChild(child);
      const at = this.children.indexOf(reference);
      if (at < 0) return this.appendChild(child);
      if (child && child.parentNode) child.remove();
      if (child) child.parentNode = this;
      this.children.splice(at, 0, child);
      if (child && child.id) doc.byId.set(child.id, child);
      return child;
    },
    before(node) {
      if (!this.parentNode) return doc.body.appendChild(node);
      return this.parentNode.insertBefore(node, this);
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
      const next = this.dispatch(event && event.type, event);
      return !next.defaultPrevented;
    },
    dispatch(type, event) {
      const next = event || { type };
      if (!next.type) next.type = type;
      if (next.defaultPrevented === undefined) next.defaultPrevented = false;
      if (typeof next.preventDefault !== 'function') {
        next.preventDefault = function () { this.defaultPrevented = true; };
      }
      (this.listeners[type] || []).slice().forEach(fn => fn(next));
      return next;
    },
    querySelector(selector) { return doc.query(this, selector); },
    querySelectorAll(selector) { return doc.queryAll(this, selector); },
    getElementsByTagName(tag) { return doc.queryAll(this, String(tag || '*')); },
    closest(selector) {
      let node = this;
      while (node) {
        if (doc.matches(node, selector)) return node;
        node = node.parentNode;
      }
      return null;
    },
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
  Object.defineProperty(el, 'nextSibling', {
    configurable: true,
    get() {
      if (!this.parentNode) return null;
      const at = this.parentNode.children.indexOf(this);
      return at < 0 ? null : this.parentNode.children[at + 1] || null;
    },
  });
  Object.defineProperty(el, 'firstChild', {
    configurable: true,
    get() { return this.children[0] || null; },
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
    contextSubmitButton: null,
    successElement: opts.success ? { textContent: String(opts.success) } : null,
    errorElement: opts.error ? { textContent: String(opts.error) } : null,
    registerFromHTML(html, parent) {
      const stack = [parent || this.body];
      const tokens = String(html || '').match(/<[^>]+>|[^<]+/g) || [];
      const voidTags = ['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'];
      tokens.forEach(token => {
        if (token.indexOf('</') === 0) {
          if (stack.length > 1) stack.pop();
          return;
        }
        if (token.charAt(0) !== '<') {
          if (token) stack[stack.length - 1].appendChild(this.createTextNode(token));
          return;
        }
        const opening = token.match(/^<([a-z][\w-]*)([^>]*)>/i);
        if (!opening) return;
        const attrs = opening[2] || '';
        const prop = {};
        ['id', 'class', 'name', 'type', 'title', 'for', 'value'].forEach(name => {
          const match = attrs.match(new RegExp('\\b' + name + '="([^"]*)"', 'i'));
          if (!match) return;
          prop[name === 'class' ? 'className' : name === 'for' ? 'htmlFor' : name] = match[1];
        });
        if (/\bhidden\b/i.test(attrs)) prop.hidden = true;
        const element = createElement(this, opening[1], prop);
        stack[stack.length - 1].appendChild(element);
        if (element.id) this.byId.set(element.id, element);
        if (voidTags.indexOf(element.tagName) === -1 && !/\/\s*>$/.test(token)) stack.push(element);
      });
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
    descendants(scope) {
      const out = [];
      function visit(node) {
        (node && node.children ? node.children : []).forEach(child => {
          out.push(child);
          visit(child);
        });
      }
      visit(scope);
      return out;
    },
    matches(element, selector) {
      if (!element || !selector) return false;
      if (selector.charAt(0) === '#') return element.id === selector.slice(1);
      if (selector.charAt(0) === '.') {
        return String(element.className || '').split(/\s+/).includes(selector.slice(1));
      }
      const attr = selector.match(/^([a-z][\w-]*)?\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]$/i);
      if (attr) {
        if (attr[1] && element.tagName !== attr[1].toUpperCase()) return false;
        const key = attr[2] === 'class' ? 'className' : attr[2] === 'for' ? 'htmlFor' : attr[2];
        if (attr[3] === undefined) return element[key] !== undefined && element[key] !== '';
        return String(element[key] == null ? '' : element[key]) === attr[3];
      }
      const tagClass = selector.match(/^([a-z][\w-]*)\.([\w-]+)$/i);
      if (tagClass) {
        return element.tagName === tagClass[1].toUpperCase()
          && String(element.className || '').split(/\s+/).includes(tagClass[2]);
      }
      return selector === '*' || element.tagName === selector.toUpperCase();
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
      if (selector === 'button[type=submit]') {
        return scope === this.contextForm ? this.contextSubmitButton : this.submitButton;
      }
      return this.descendants(scope).find(element => this.matches(element, selector)) || null;
    },
    queryAll(scope, selector) {
      if (selector === '[name=correct_option]') return doc.radios.slice();
      return this.descendants(scope).filter(element => this.matches(element, selector));
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
  if (opts.success) {
    doc.successElement = createElement(doc, 'div', {
      className: 'admin-alert admin-success',
      textContent: String(opts.success),
    });
    doc.body.appendChild(doc.successElement);
  }
  if (opts.error) {
    doc.errorElement = createElement(doc, 'div', {
      className: 'admin-alert admin-error',
      textContent: String(opts.error),
    });
    doc.body.appendChild(doc.errorElement);
  }
  return doc;
}

function createForm(doc, options) {
  const opts = options || {};
  const form = createElement(doc, 'form', { id: 'question_form' });
  function label(forId, text) {
    const element = createElement(doc, 'label', { htmlFor: forId || '' });
    element.appendChild(doc.createTextNode(text));
    return element;
  }
  function fieldWrap(field, labelText, note) {
    const wrap = createElement(doc, 'div', { className: 'admin-field' });
    if (labelText) wrap.appendChild(label(field.id, labelText));
    wrap.appendChild(field);
    if (note) {
      const help = createElement(doc, 'p', { className: 'admin-note' });
      help.appendChild(doc.createTextNode(note));
      wrap.appendChild(help);
    }
    return wrap;
  }
  function grid(children, className) {
    const wrap = createElement(doc, 'div', { className: className || 'admin-grid' });
    children.forEach(child => wrap.appendChild(child));
    return wrap;
  }
  const fields = {
    subject_id: selectElement(doc, 'subject_id', [
      { text: '-- Select Subject --', value: '' },
      { text: 'CRS', value: '1' },
      { text: 'CRK', value: '2' },
      { text: 'Government', value: '3' },
    ], '1'),
    exam_category_id: selectElement(doc, 'exam_category_id', [
      { text: '-- Select Exam Category --', value: '' },
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
  Object.keys(fields).forEach(name => {
    fields[name].form = form;
    doc.byId.set(name, fields[name]);
  });
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
  doc.submitButton.form = form;
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
  doc.form = form;
  doc.byId.set('question_form', form);
  doc.body.appendChild(form);
  form.appendChild(doc.actionInput);
  form.appendChild(grid([
    fieldWrap(fields.subject_id, 'Subject'),
    fieldWrap(fields.exam_category_id, 'Exam Category'),
  ]));
  form.appendChild(fieldWrap(fields.exam_year, 'Exam Year', 'Enter the year the exam question belongs to.'));

  const linkGroup = createElement(doc, 'fieldset', {
    id: 'owner_context_link_fields',
    className: 'owner-form-group owner-link-fields',
  });
  const linkLegend = createElement(doc, 'legend');
  linkLegend.appendChild(doc.createTextNode('Shared Context Link'));
  linkGroup.appendChild(linkLegend);
  const contextIdWrap = fieldWrap(fields.context_id, 'Shared Context (optional)', 'The question and context must match.');
  const contextPositionWrap = fieldWrap(fields.context_position, 'Context Position', 'Use each number once.');
  const contextSlotWrap = fieldWrap(fields.context_slot, 'Cloze Slot (optional)', 'Use the matching gap number.');
  contextPositionWrap.id = 'owner_context_position_field';
  contextSlotWrap.id = 'owner_context_slot_field';
  doc.byId.set(contextPositionWrap.id, contextPositionWrap);
  doc.byId.set(contextSlotWrap.id, contextSlotWrap);
  linkGroup.appendChild(grid([
    contextIdWrap,
    contextPositionWrap,
    contextSlotWrap,
  ]));
  doc.byId.set(linkGroup.id, linkGroup);
  form.appendChild(linkGroup);

  form.appendChild(grid([
    fieldWrap(fields.question_text, 'Question'),
    fieldWrap(fields.question_image, 'Question Picture / Diagram (optional)', 'Upload a picture for this question.'),
  ], 'admin-grid question-entry-grid'));
  form.appendChild(grid([
    fieldWrap(fields.option_a, 'Option A'),
    fieldWrap(fields.option_b, 'Option B'),
    fieldWrap(fields.option_c, 'Option C'),
    fieldWrap(fields.option_d, 'Option D'),
  ]));
  const correctWrap = createElement(doc, 'div', { className: 'admin-field' });
  correctWrap.appendChild(label('', 'Correct Answer'));
  const correct = createElement(doc, 'div', { className: 'admin-correct' });
  doc.radios.forEach((radio, index) => {
    const radioLabel = label('', ' Option ' + 'ABCD'.charAt(index));
    radioLabel.insertBefore(radio, radioLabel.firstChild || null);
    correct.appendChild(radioLabel);
  });
  correctWrap.appendChild(correct);
  const correctNote = createElement(doc, 'p', { className: 'admin-note' });
  correctNote.appendChild(doc.createTextNode('Choose the option that contains the correct answer.'));
  correctWrap.appendChild(correctNote);
  form.appendChild(correctWrap);
  form.appendChild(fieldWrap(fields.answer_explanation, 'Answer Explanation', 'Optional. Students may see this after the test.'));
  form.appendChild(fieldWrap(fields.answer_video, 'Answer Illustration (Video or Picture - optional)', 'Upload a video or picture.'));
  const activeWrap = createElement(doc, 'div', { className: 'admin-field' });
  const activeLabel = label('', ' Make question active immediately');
  activeLabel.insertBefore(fields.is_active, activeLabel.firstChild || null);
  activeWrap.appendChild(activeLabel);
  const activeNote = createElement(doc, 'p', { className: 'admin-note' });
  activeNote.appendChild(doc.createTextNode('Linked questions stay inactive.'));
  activeWrap.appendChild(activeNote);
  form.appendChild(activeWrap);
  form.appendChild(doc.submitButton);
  return form;
}

function createContextForm(doc, options) {
  const opts = options || {};
  const editMode = opts.contextAction === 'update_context';
  const form = createElement(doc, 'form', { id: 'context_form' });
  const fields = {
    action: createElement(doc, 'input', {
      id: 'context_action',
      name: 'action',
      type: 'hidden',
      value: opts.contextAction || 'save_context',
      form,
    }),
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
    owner_context_targets: createElement(doc, 'input', { id: 'owner_context_targets', value: '', form }),
  };
  if (opts.contextId !== undefined) {
    fields.context_id = createElement(doc, 'input', {
      id: 'context_record_id',
      name: 'context_id',
      type: 'hidden',
      value: String(opts.contextId),
      form,
    });
  }
  Object.keys(opts.contextFormValues || {}).forEach(name => {
    if (fields[name]) fields[name].value = String(opts.contextFormValues[name]);
  });
  Object.keys(fields).forEach(name => { fields[name].form = form; });
  form.elements = fields;
  Object.keys(fields).forEach(name => doc.byId.set(fields[name].id, fields[name]));
  const targetsWrap = createElement(doc, 'div', { id: 'owner_context_targets_field', hidden: true });
  const status = createElement(doc, 'span', {
    id: 'owner_context_native_status',
    textContent: editMode ? 'Editing shared text #' + opts.contextId : 'Paste shared text or tap Add.',
  });
  doc.byId.set(targetsWrap.id, targetsWrap);
  doc.byId.set(status.id, status);
  doc.contextSubmitButton = createElement(doc, 'button', {
    id: 'save_context',
    type: 'submit',
    textContent: editMode ? 'Save Changes' : 'Save Shared Text',
  });
  doc.contextSubmitButton.form = form;
  doc.contextForm = form;
  doc.byId.set('context_form', form);
  const section = createElement(doc, 'section', {
    id: 'shared_context_editor',
    className: 'admin-card owner-context-editor owner-context-editor-' + (editMode ? 'edit' : 'draft'),
  });
  const heading = createElement(doc, 'h2', {
    id: 'owner_context_editor_heading',
    textContent: editMode ? 'Edit Saved Shared Text' : 'New Shared Text',
  });
  const mode = createElement(doc, 'strong', {
    id: 'owner_context_mode',
    className: 'owner-context-mode owner-context-mode-' + (editMode ? 'edit' : 'draft'),
    textContent: editMode ? 'Saved text #' + opts.contextId + ' - edit mode' : 'New text - draft mode',
  });
  section.appendChild(heading);
  section.appendChild(mode);
  section.appendChild(status);
  section.appendChild(form);
  form.appendChild(fields.action);
  if (fields.context_id) form.appendChild(fields.context_id);
  ['context_type', 'title', 'subject_id', 'exam_category_id', 'exam_year', 'expected_member_count']
    .forEach(name => form.appendChild(fields[name]));
  form.appendChild(targetsWrap);
  targetsWrap.appendChild(fields.owner_context_targets);
  form.appendChild(fields.context_text);
  form.appendChild(doc.contextSubmitButton);
  doc.body.appendChild(section);
  return form;
}

function createEnv(options) {
  const opts = options || {};
  const doc = createDocument({ success: opts.success, error: opts.error });
  const form = createForm(doc, opts);
  if (opts.contextForm !== false) createContextForm(doc, opts);
  if (opts.contextData) {
    const data = createElement(doc, 'script', {
      id: 'owner_tool_context_data',
      textContent: JSON.stringify(opts.contextData),
    });
    doc.byId.set('owner_tool_context_data', data);
  }
  if (opts.recentQuestions) {
    const data = createElement(doc, 'script', {
      id: 'owner_tool_recent_questions',
      textContent: JSON.stringify(opts.recentQuestions),
    });
    doc.byId.set('owner_tool_recent_questions', data);
  }
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
  sandbox.OCRParser = parser;
  vm.createContext(sandbox);
  vm.runInContext(RENDER_SOURCE, sandbox, { filename: 'src/owner-tool/render.js' });
  vm.runInContext(SHARED_TEXTS_SOURCE, sandbox, { filename: 'src/owner-tool/shared-texts.js' });
  vm.runInContext(OWNER_TOOL_SOURCE, sandbox, { filename: 'src/owner-tool/owner-tool.js' });

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
      if (!el) throw new Error('no element for click ' + id);
      if (typeof el.onclick === 'function') return el.onclick();
      if (el.listeners.click && el.listeners.click.length) {
        const event = el.dispatch('click');
        if (!event.defaultPrevented && el.type === 'submit' && el.form) el.form.dispatch('submit');
        return event;
      }
      throw new Error('no click handler for ' + id);
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
      return form.dispatch('submit');
    },
    state() {
      const rawState = raw.get(stateApi.KEY);
      return rawState == null ? null : JSON.parse(rawState);
    },
    reload(reloadOptions) {
      const next = Object.assign({}, reloadOptions || {});
      if (opts.contextForm === false) next.contextForm = false;
      if (opts.contextData) next.contextData = opts.contextData;
      if (opts.recentQuestions) next.recentQuestions = opts.recentQuestions;
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
  assertEqual(state.parserVersion, '2.3.3', 'parser version');
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
  assert(env.text('owner_tool_flags').indexOf('option E or F was found') > -1, 'E/F flag is clear');
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
  assert(next.text('owner_tool_warning').indexOf('I am not sure') > -1, 'review warning shown');
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
  assert(next.text('owner_tool_warning').indexOf('did not save') > -1, 'error warning shown');
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
  assert(next.text('owner_tool_warning').indexOf('did not save') > -1, 'rejection warning shown');
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
  assert(next.text('owner_tool_warning').indexOf('Check Saved Questions') > -1, 'review warning shown');
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
  assert(env.text('owner_tool_status').indexOf('All 2 questions are done') > -1, 'end state reported');
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
  env.edit('context_title', 'Reset proof');
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
  assert(env.text('owner_tool_status').indexOf('Paste questions to begin') > -1, 'empty status shown');
});

test('a new full paste clears old native metadata, links, and shared-text fields', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, {
    title: 'Old shared text',
    text: 'Old passage text.',
    targets: '1',
    expected: '1',
    subject: '1',
    category: '2',
    year: '2021',
  });
  env.paste(NO_KEY_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.field('subject_id'), '', 'empty inferred subject clears the native subject');
  assertEqual(env.field('exam_category_id'), '', 'empty inferred exam clears the native exam');
  assertEqual(env.field('exam_year'), '', 'empty inferred year clears the native year');
  assertEqual(env.field('context_id'), '', 'old shared-text link is cleared');
  assertEqual(env.field('context_position'), '', 'old passage number is cleared');
  assertEqual(env.field('context_slot'), '', 'old gap number is cleared');
  assertEqual(env.contextField('title'), '', 'old shared-text title is cleared');
  assertEqual(env.contextField('context_text'), '', 'old shared text is cleared');
  assertEqual(env.contextField('subject_id'), '', 'old shared-text subject is cleared');
  assertEqual(env.contextField('exam_year'), '', 'old shared-text year is cleared');
  assertEqual(env.contextField('action'), 'save_context', 'shared-text form returns to create mode');
  assertEqual(env.state().contexts.length, 0, 'old browser contexts are discarded');
  assertEqual(env.visible('context_form'), false, 'empty shared-text editor stays closed');
  assertEqual(env.visible('owner_context_link_fields'), false, 'standalone question hides link fields');
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
  assertEqual(next.visible('context_form'), false, 'confirmed context editor is collapsed');
  assertEqual(next.text('owner_context_show'), 'Show', 'Show control is visible');
  next.click('owner_context_show');
  assertEqual(next.visible('context_form'), true, 'Show reopens the saved context');
  assertEqual(next.state().pendingSubmission, null, 'Show does not arm a write');
  assertEqual(next.text('owner_context_hide'), 'Hide', 'Hide replaces Show while the editor is open');
  next.click('owner_context_hide');
  assertEqual(next.visible('context_form'), false, 'Hide closes the saved context editor');
  assertEqual(next.state().pendingSubmission, null, 'Hide does not arm a write');
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

test('Add Context reveals and restores the single native editor', () => {
  const env = createEnv();
  assertEqual(env.visible('context_form'), false, 'context fields start hidden');
  env.click('owner_context_add');
  assertEqual(env.visible('context_form'), true, 'Add Context reveals the fields');
  configureContext(env, 0, {
    title: 'Manual passage',
    text: 'Manually entered shared text.',
    targets: '4, 5',
    expected: '2',
  });
  const next = env.reload();
  assertEqual(next.visible('context_form'), true, 'manual draft stays visible after reload');
  assertEqual(next.contextField('title'), 'Manual passage', 'manual title is restored');
  assertEqual(next.byId('owner_context_targets').value, '4, 5', 'manual linked numbers are restored');
});

test('multiple contexts bind their own IDs and members through one editor', () => {
  const first = createEnv();
  first.paste(FULL_PASTE);
  first.click('owner_tool_load');
  first.click('owner_context_add');
  configureContext(first, 0, { title: 'First passage', text: 'First.', targets: '1', expected: '1' });
  first.click('owner_context_add');
  configureContext(first, 1, { title: 'Second passage', text: 'Second.', targets: '2', expected: '1' });
  const firstSelect = first.byId('owner_context_select');
  firstSelect.value = first.state().contexts[0].localId;
  firstSelect.onchange();
  submitContextForm(first);
  const second = first.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  const secondSelect = second.byId('owner_context_select');
  secondSelect.value = second.state().contexts[1].localId;
  secondSelect.onchange();
  submitContextForm(second);
  const third = second.reload({ success: 'Context #78 created. Link its members, then activate it.' });
  const state = third.state();
  assertEqual(state.contexts[0].serverId, 77, 'first context id');
  assertEqual(state.contexts[1].serverId, 78, 'second context id');
  assertEqual(state.items[0].contextRef, state.contexts[0].localId, 'question one links first');
  assertEqual(state.items[1].contextRef, state.contexts[1].localId, 'question two links second');
  assertEqual(third.field('context_id'), '77', 'question one uses first id');
  const savedSelect = third.byId('owner_context_select');
  savedSelect.value = state.contexts[0].localId;
  savedSelect.onchange();
  assertEqual(third.visible('context_form'), false, 'selected saved context stays collapsed');
  third.click('owner_context_show');
  assertEqual(third.visible('context_form'), true, 'Show opens the newly selected saved context');
  assertEqual(third.contextField('title'), 'First passage', 'Show is bound to the selected context');
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
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  next.edit('context_title', 'Edited after save');
  assertEqual(next.state().contexts[0].stale, true, 'saved edit is stale');
  assertEqual(next.byId('save_question').disabled, true, 'linked save button disabled');
  assert(next.text('owner_context_link_warning').indexOf('Save the shared text again') > -1, 'update warning shown');
  next.submit();
  assertEqual(next.state().pendingSubmission, null, 'no question marker while stale');
  submitContextForm(next);
  assertEqual(next.state().pendingSubmission.kind, 'context-update', 'context update marker stored');
  const after = next.reload({ success: 'Context #77 updated. It is inactive until revalidated.' });
  assertEqual(after.state().contexts[0].stale, false, 'successful update clears stale');
  assertEqual(after.state().pendingSubmission, null, 'update marker cleared');
  assertEqual(after.byId('save_question').disabled, false, 'linked save is available again');
  assertEqual(after.visible('context_form'), false, 'confirmed update collapses the editor');
  assertEqual(after.text('owner_context_show'), 'Show', 'saved update can be reopened');
});

test('an unconfirmed saved-context update stays open for correction', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Original', text: 'Original text.', targets: '1', expected: '1' });
  submitContextForm(env);
  const saved = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  saved.click('owner_context_show');
  saved.edit('context_title', 'Needs another check');
  submitContextForm(saved);
  const next = saved.reload({ success: 'Context #77 updated.' });
  assertEqual(next.state().contexts[0].stale, true, 'unconfirmed update stays stale');
  assertEqual(next.visible('context_form'), true, 'unconfirmed update remains open');
  assertEqual(next.contextField('title'), 'Needs another check', 'edited value remains visible');
  assert(next.text('owner_context_warning').indexOf('not sure') > -1, 'plain retry warning is shown');
});

test('an unconfirmed update reopens the pending card when several contexts exist', () => {
  const first = createEnv();
  first.paste(FULL_PASTE);
  first.click('owner_tool_load');
  first.click('owner_context_add');
  configureContext(first, 0, { title: 'First passage', text: 'First.', targets: '1', expected: '1' });
  first.click('owner_context_add');
  configureContext(first, 1, { title: 'Second passage', text: 'Second.', targets: '2', expected: '1' });
  const firstSelect = first.byId('owner_context_select');
  firstSelect.value = first.state().contexts[0].localId;
  firstSelect.onchange();
  submitContextForm(first);
  const second = first.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  const secondSelect = second.byId('owner_context_select');
  secondSelect.value = second.state().contexts[1].localId;
  secondSelect.onchange();
  submitContextForm(second);
  const saved = second.reload({ success: 'Context #78 created. Link its members, then activate it.' });
  const updateSelect = saved.byId('owner_context_select');
  updateSelect.value = saved.state().contexts[1].localId;
  updateSelect.onchange();
  saved.click('owner_context_show');
  assertEqual(saved.contextField('title'), 'Second passage', 'the second saved context is opened');
  saved.edit('context_title', 'Second needs another check');
  submitContextForm(saved);
  assertEqual(saved.state().pendingSubmission.localId, saved.state().contexts[1].localId,
    'the update marker targets the second context');
  const next = saved.reload({ success: 'Context #78 updated.' });
  assertEqual(next.visible('context_form'), true, 'pending context editor stays open');
  assertEqual(next.contextField('title'), 'Second needs another check', 'the pending context is selected');
  assertEqual(next.state().contexts[1].serverId, 78, 'the second saved context remains bound');
});

test('a near-miss context flash never binds an ID or retries', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Pending', text: 'Pending.', targets: '1', expected: '1' });
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created.' });
  assertEqual(next.state().contexts[0].serverId, null, 'near-miss flash does not bind');
  assertEqual(next.state().pendingSubmission, null, 'marker cleared');
  assert(next.text('owner_context_warning').indexOf('not sure') > -1, 'review warning shown');
  const again = next.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(again.state().contexts[0].serverId, null, 'a later flash cannot bind the cleared marker');
});

test('a rejected context save clears its marker without binding or advancing', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Rejected', text: 'Rejected.', targets: '1', expected: '1' });
  submitContextForm(env);
  const next = env.reload({
    error: 'The context could not be saved.',
    success: 'Context #77 created. Link its members, then activate it.',
  });
  assertEqual(next.state().contexts[0].serverId, null, 'rejected save does not bind');
  assertEqual(next.state().pendingSubmission, null, 'context marker cleared');
  assertEqual(next.state().currentIndex, 0, 'queue did not advance');
  assert(next.text('owner_context_warning').indexOf('did not save') > -1, 'rejection warning shown');
});

test('a comprehension paste fills the context card and the native options', () => {
  const env = createEnv();
  env.paste(COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts.length, 1, 'one context card');
  assertEqual(state.contexts[0].title, 'PASSAGE III', 'context title');
  assertEqual(state.contexts[0].contextType, 'comprehension', 'context type');
  assertEqual(state.contexts[0].targets.join(','), '11,12,13,14,15', 'context targets');
  assertEqual(state.contexts[0].expectedCount, 5, 'expected member count');
  assertEqual(state.contexts[0].serverId, null, 'parsed context is not saved');
  assertEqual(state.items.length, 5, 'queue length');
  assertEqual(state.items[0].contextRef, state.contexts[0].localId, 'first question linked');
  assertEqual(state.items[0].contextPosition, '1', 'first position');
  assertEqual(state.items[4].contextPosition, '5', 'last position');
  assertEqual(env.field('question_text'),
    'According to the author, electioneering campaign is the approach', 'stem');
  assertEqual(env.field('option_a'), 'best used in politics', 'option a');
  assertEqual(env.field('option_d'), 'currently in use.', 'option d');
  assertEqual(env.contextField('title'), 'PASSAGE III', 'single native title is editable');
  assertEqual(env.contextField('context_text'), state.contexts[0].text, 'single native text is editable');
  assert(env.byId('shared_context_editor').className.indexOf('owner-context-editor-draft') > -1,
    'new shared text keeps the visible draft mode');
  assertEqual(env.text('owner_context_editor_heading'), 'New Shared Text', 'draft heading is explicit');
  assertEqual(env.text('owner_context_mode'), 'New text - draft mode', 'draft badge is explicit');
  assert(env.text('owner_context_mode_hint').indexOf('fills this new draft') > -1,
    'draft hint matches draft mode');
  assertEqual(env.byId('owner_context_targets').value, '11, 12, 13, 14, 15', 'linked numbers share the native card');
  assertEqual(env.text('owner_tool_warning'), '', 'no warning');
  assertEqual(state.pendingSubmission, null, 'nothing is submitted');
});

test('a cloze paste fills a cloze card, slots, and the native options', () => {
  const env = createEnv();
  env.paste(CLOZE_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts.length, 1, 'one context card');
  assertEqual(state.contexts[0].title, 'SECTION 6', 'context title');
  assertEqual(state.contexts[0].contextType, 'cloze', 'cloze type');
  assertEqual(state.contexts[0].targets.join(','), '71,72,73,74,75,76,77,78,79,80', 'targets');
  assertEqual(state.contexts[0].expectedCount, 10, 'expected members');
  assertEqual(state.contexts[0].serverId, null, 'parsed context is not saved');
  assert(state.contexts[0].text.indexOf('[[gap:71]]') > -1, 'card text carries gap tokens');
  assertEqual(state.items.length, 10, 'queue length');
  assertEqual(state.items[0].contextRef, state.contexts[0].localId, 'first question linked');
  assertEqual(state.items[0].contextPosition, '1', 'first position');
  assertEqual(state.items[0].contextSlot, '71', 'first slot');
  assertEqual(state.items[9].contextPosition, '10', 'last position');
  assertEqual(state.items[9].contextSlot, '80', 'last slot');
  assertEqual(env.field('question_text'), 'Choose the option that best fills gap 71.', 'stem');
  assertEqual(env.field('option_a'), 'captured', 'option a');
  assertEqual(env.field('option_d'), 'caught', 'option d');
  assertEqual(env.text('owner_tool_warning'), '', 'no warning');
  assertEqual(state.pendingSubmission, null, 'nothing is submitted');
});

test('the full sample advances to its unsaved cloze text and then allows gap 71 to save', () => {
  const env = createEnv();
  env.paste(SAMPLE_PASSAGES);
  env.click('owner_tool_load');
  assertEqual(env.state().contexts.length, 2, 'reading and gap texts are loaded');
  assertEqual(env.contextField('title'), 'PASSAGE III', 'first shared text is selected');
  submitContextForm(env);

  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  const nextState = next.state();
  assertEqual(nextState.contexts[0].serverId, 77, 'first shared text is bound');
  assertEqual(next.contextField('title'), 'SECTION 6', 'next unsaved gap text stays selected');
  assertEqual(next.contextField('context_type'), 'cloze', 'next editor uses the gap type');
  assertEqual(next.byId('owner_context_select').value, nextState.contexts[1].localId,
    'selector points to the unsaved gap text');
  assertEqual(next.visible('context_form'), true, 'next unsaved editor stays open');
  assertEqual(next.text('owner_context_select_label'), 'Shared text to edit', 'selector has a clear label');
  submitContextForm(next);

  const after = next.reload({ success: 'Context #78 created. Link its members, then activate it.' });
  assertEqual(after.state().contexts[1].serverId, 78, 'gap text is bound');
  for (let i = 0; i < 5; i++) after.click('owner_tool_skip');
  assertEqual(after.state().items[after.state().currentIndex].num, 71, 'gap 71 is current');
  assertEqual(after.field('context_id'), '78', 'gap question uses the saved text');
  assertEqual(after.field('context_position'), '1', 'gap question keeps its position');
  assertEqual(after.field('context_slot'), '71', 'gap question keeps slot 71');
  const saveEvent = after.click('save_question');
  assertEqual(saveEvent.defaultPrevented, false, 'saved-context gap question may post');
  assertEqual(after.state().pendingSubmission.kind, 'question', 'gap question save is armed');
});

test('the full sample opens its unsaved cloze text when the reading passage is already saved', () => {
  const paste = SAMPLE_PASSAGES.replace('U. M. E. JAMB USE OF ENGLISH', 'CRS JAMB');
  const parsed = parser.parsePaste(paste);
  const reading = parsed.contexts[0];
  const env = createEnv({
    contextData: [{
      context_id: 77,
      context_type: 'comprehension',
      title: reading.title,
      context_text: reading.text,
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '1994',
      expected_member_count: 5,
      member_count: 1,
      members: [{
        question_text: 'According to the author, electioneering campaign is the approach',
        context_position: '1',
        context_slot: '',
      }],
    }],
  });
  env.paste(paste);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts[0].serverId, 77, 'reading passage is adopted');
  assertEqual(state.contexts[1].serverId, null, 'gap text remains unsaved');
  assertEqual(state.currentIndex, 1, 'saved first reading question is skipped');
  assertEqual(env.contextField('title'), 'SECTION 6', 'unsaved gap text opens first');
  assertEqual(env.byId('owner_context_select').value, state.contexts[1].localId,
    'selector points to the remaining unsaved text');
  assertEqual(env.visible('context_form'), true, 'unsaved gap editor is open');
  const restored = env.reload();
  assertEqual(restored.contextField('title'), 'SECTION 6', 'unsaved gap text stays selected after reload');
  assertEqual(restored.visible('context_form'), true, 'unsaved gap editor stays open after reload');
});

test('shared-text link fields only show for passage questions', () => {
  const normal = createEnv();
  normal.paste(FULL_PASTE);
  normal.click('owner_tool_load');
  assertEqual(normal.visible('owner_context_link_fields'), false, 'normal question hides the shared-text group');

  const reading = createEnv();
  reading.paste(COMPREHENSION_PASTE);
  reading.click('owner_tool_load');
  assertEqual(reading.visible('owner_context_link_fields'), true, 'reading question shows the shared-text group');
  assertEqual(reading.visible('owner_context_slot_field'), false, 'reading question hides the gap number');

  const cloze = createEnv();
  cloze.paste(CLOZE_PASTE);
  cloze.click('owner_tool_load');
  assertEqual(cloze.visible('owner_context_link_fields'), true, 'gap question shows the shared-text group');
  assertEqual(cloze.visible('owner_context_slot_field'), true, 'gap question shows the gap number');
});

test('a same-paste cloze key ticks rows by printed number and never posts', () => {
  const env = createEnv();
  let submits = 0;
  const dispatch = env.form.dispatch;
  env.form.dispatch = function (type, event) {
    if (type === 'submit') submits += 1;
    return dispatch.call(this, type, event);
  };
  env.paste(CLOZE_PASTE + '\n\nANSWERS\n71. B\n72. C\n');
  env.click('owner_tool_load');
  assertEqual(env.state().answerKey['71'], 'B', 'same-paste key parsed');
  assertEqual(env.field('question_text'), 'Choose the option that best fills gap 71.', 'first stem');
  assertEqual(env.radioIndex(), 1, 'key B ticks the second radio');
  env.click('owner_tool_skip');
  assertEqual(env.field('question_text'), 'Choose the option that best fills gap 72.', 'second stem');
  assertEqual(env.radioIndex(), 2, 'key C ticks the third radio');
  assertEqual(submits, 0, 'loading and skipping never submit the form');
  assertEqual(env.state().pendingSubmission, null, 'no submission is armed');
});

test('a same-paste comprehension key ticks the linked member and never posts', () => {
  const env = createEnv();
  let submits = 0;
  const dispatch = env.form.dispatch;
  env.form.dispatch = function (type, event) {
    if (type === 'submit') submits += 1;
    return dispatch.call(this, type, event);
  };
  env.paste(COMPREHENSION_KEY_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.state().answerKey['21'], 'B', 'same-paste key parsed');
  assertEqual(env.field('question_text'), 'Rice is grown in', 'first stem');
  assertEqual(env.field('option_b'), 'paddy fields', 'option b');
  assertEqual(env.radioIndex(), 1, 'key B ticks the second radio');
  env.click('owner_tool_skip');
  assertEqual(env.field('question_text'), 'Rice needs plenty of', 'second stem');
  assertEqual(env.radioIndex(), 2, 'key C ticks the third radio');
  assertEqual(submits, 0, 'loading and skipping never submit the form');
  assertEqual(env.state().pendingSubmission, null, 'no submission is armed');
});

test('an ambiguous passage warns and keeps the legacy parse', () => {
  const env = createEnv();
  env.paste(COMPREHENSION_AMBIGUOUS_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts.length, 0, 'no invented context');
  assertEqual(state.items.length, 1, 'question still loaded');
  assertEqual(state.items[0].contextRef || '', '', 'standalone question has no context');
  assert(env.text('owner_tool_warning').indexOf('too few questions') > -1, 'fallback warning shown');
  assertEqual(env.visible('owner_tool_warning'), true, 'warning is visible');
});

test('key-only paste keeps the queue and contexts', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, { title: 'Kept', text: 'Kept.', targets: '1', expected: '1' });
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
  submitContextForm(env);
  const next = env.reload({ success: 'Context #77 created. Link its members, then activate it.' });
  assertEqual(next.field('context_slot'), '1', 'first target gets the first sorted slot');
  next.click('owner_tool_skip');
  assertEqual(next.field('context_slot'), '3', 'second target gets the next slot');
});

test('a missing native context form warns without arming a submission', () => {
  const env = createEnv({ contextForm: false });
  env.paste(COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assert(env.text('owner_context_warning').indexOf('not set up') > -1, 'unavailable form warning');
  assertEqual(env.state().pendingSubmission, null, 'no context marker');
  assertEqual(env.byId('save_question').disabled, false, 'the button stays tappable so it can explain the stop');
  const event = env.submit();
  assert(event.defaultPrevented, 'the unsafe native post is cancelled');
  assertEqual(env.text('owner_tool_warning'), 'Save the shared context first.', 'the exact reason is shown');
  assertEqual(env.state().pendingSubmission, null, 'no question marker for an uncreated context');
});

test('a new pasted context stops Save Question with the exact reason', () => {
  const env = createEnv();
  env.paste(COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.byId('save_question').disabled, false, 'Save Question can be tapped');
  const clickEvent = env.click('save_question');
  assert(clickEvent.defaultPrevented, 'the button stops before native validation or post');
  const event = env.submit();
  assert(event.defaultPrevented, 'keyboard or programmatic submit is also stopped');
  assertEqual(env.text('owner_tool_warning'), 'Save the shared context first.', 'exact phone message');
  assertEqual(env.state().pendingSubmission, null, 'no question submission is armed');

  const standalone = createEnv();
  standalone.paste(FULL_PASTE);
  standalone.click('owner_tool_load');
  const safeEvent = standalone.click('save_question');
  assertEqual(safeEvent.defaultPrevented, false, 'a safe native submit is untouched');
  assertEqual(standalone.state().pendingSubmission.kind, 'question', 'safe save is armed');
});

test('manual context selection is authoritative and does not require a matching card', () => {
  const env = createEnv({
    contextData: [{
      context_id: 7,
      context_type: 'comprehension',
      title: 'Saved text',
      subject_id: '3',
      exam_category_id: '8',
      exam_year: '2030',
      expected_member_count: 1,
      member_count: 0,
      members: [],
    }],
  });
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.field('context_id'), '', 'standalone question starts unlinked');
  env.setField('context_position', '3');
  env.byId('context_id').value = '7';
  env.byId('context_id').dispatch('change');
  const state = env.state();
  assertEqual(state.items[0].manualContextId, '7', 'manual id is persisted');
  assertEqual(env.field('context_id'), '7', 'native field keeps the manual id');
  assertEqual(env.field('context_position'), '3', 'manual selection keeps the entered position');
  assertEqual(env.field('subject_id'), '3', 'saved context fills the subject');
  assertEqual(env.field('exam_category_id'), '8', 'saved context fills the exam');
  assertEqual(env.field('exam_year'), '2030', 'saved context fills the year');
  assertEqual(env.byId('save_question').disabled, false, 'manual selection allows the linked save');
  env.submit();
  const pending = env.state().pendingSubmission;
  assert(pending && pending.kind === 'question', 'the question save is armed');
});

test('manual context selection fills the next free passage number and cloze gap', () => {
  const reading = createEnv({
    contextData: [{
      context_id: 7,
      context_type: 'comprehension',
      title: 'Saved reading',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 4,
      member_count: 2,
      members: [
        { question_text: 'One', context_position: '1', context_slot: '' },
        { question_text: 'Three', context_position: '3', context_slot: '' },
      ],
    }],
  });
  reading.paste(FULL_PASTE);
  reading.click('owner_tool_load');
  reading.byId('context_id').value = '7';
  reading.byId('context_id').dispatch('change');
  assertEqual(reading.state().items[0].contextPosition, '2', 'first unused reading position is selected');
  assertEqual(reading.field('context_position'), '2', 'native passage number is filled');
  assertEqual(reading.field('context_slot'), '', 'reading passage has no gap number');

  const cloze = createEnv({
    contextData: [{
      context_id: 8,
      context_type: 'cloze',
      title: 'Saved gap passage',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 3,
      member_count: 1,
      slots: [71, 72, 73],
      members: [{ question_text: 'One', context_position: '1', context_slot: '71' }],
    }],
  });
  cloze.paste(FULL_PASTE);
  cloze.click('owner_tool_load');
  cloze.byId('context_id').value = '8';
  cloze.byId('context_id').dispatch('change');
  assertEqual(cloze.state().items[0].contextPosition, '2', 'first unused cloze position is selected');
  assertEqual(cloze.state().items[0].contextSlot, '72', 'first unused parsed gap is selected');
  assertEqual(cloze.field('context_slot'), '72', 'native gap number is filled');

  const override = createEnv({
    contextData: [{
      context_id: 9,
      context_type: 'comprehension',
      title: 'Manual reading override',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 10,
      member_count: 0,
      members: [],
    }],
  });
  override.paste(CLOZE_PASTE);
  override.click('owner_tool_load');
  override.byId('context_id').value = '9';
  override.byId('context_id').dispatch('change');
  assertEqual(override.state().items[0].manualContextType, 'comprehension', 'saved context type is authoritative');
  assertEqual(override.field('context_slot'), '', 'reading override clears the parsed cloze gap');
  assertEqual(override.visible('owner_context_slot_field'), false, 'reading override hides the gap field');
  assertEqual(override.byId('save_question').disabled, false, 'local cloze type does not block the reading override');
});

test('manual adoption loads the next question after skipping a saved member', () => {
  const env = createEnv({
    contextData: [{
      context_id: 7,
      context_type: 'comprehension',
      title: 'Saved text',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 1,
      member_count: 1,
      members: [{
        question_text: 'Who was the father of faith in the Bible?',
        context_position: '1',
        context_slot: '',
      }],
    }],
  });
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.setField('context_position', '1');
  env.byId('context_id').value = '7';
  env.byId('context_id').dispatch('change');
  assertEqual(env.state().currentIndex, 1, 'saved first member is skipped');
  assertEqual(env.field('question_text'), 'How many books are in the New Testament?', 'next question fills the form');
  assert(env.text('owner_tool_preview').indexOf('New Testament') > -1, 'preview also moves to the next question');
});

test('a linked local context owns the question subject, exam, and year', () => {
  const env = createEnv();
  env.paste(FULL_PASTE);
  env.click('owner_tool_load');
  env.click('owner_context_add');
  configureContext(env, 0, {
    title: 'Local shared text',
    text: 'Read this.',
    targets: '1',
    expected: '1',
    subject: '3',
    category: '8',
    year: '2031',
  });
  assertEqual(env.field('subject_id'), '3', 'local context fills the subject');
  assertEqual(env.field('exam_category_id'), '8', 'local context fills the exam');
  assertEqual(env.field('exam_year'), '2031', 'local context fills the year');
  env.click('owner_tool_skip');
  assertEqual(env.field('subject_id'), '1', 'standalone question returns to paste subject');
  assertEqual(env.field('exam_category_id'), '2', 'standalone question returns to paste exam');
  assertEqual(env.field('exam_year'), '2021', 'standalone question returns to paste year');
});

test('a saved context auto-matches and an already-saved member is skipped', () => {
  const server = [{
    context_id: 5,
    context_type: 'comprehension',
    title: 'PASSAGE I',
    context_text: 'The elephant is the largest land animal. It lives in herds led by an older female.',
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    expected_member_count: 2,
    member_count: 1,
    is_active: 1,
    members: [{
      question_text: 'An elephant herd is usually led by',
      context_position: '1',
      context_slot: '',
    }],
  }];
  const env = createEnv({ contextData: server });
  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts[0].serverId, 5, 'matching context id is bound');
  assertEqual(state.contexts[0].adopted, true, 'matching context is marked adopted');
  assertEqual(state.items[0].alreadySaved, true, 'first member is detected');
  assertEqual(state.currentIndex, 1, 'the already-saved member is skipped');
  assertEqual(env.field('question_text'), 'An elephant uses its trunk for', 'the next member loads');
  assert(env.text('owner_tool_warning').indexOf('Already saved') > -1, 'skip notice is visible');
  assertEqual(env.byId('save_question').disabled, false, 'the next member can be saved');
  assertEqual(env.contextField('title'), 'PASSAGE I', 'matched context uses the native editor');
  assertEqual(env.contextField('action'), 'update_context', 'matched context is ready for explicit update');
  assertEqual(env.state().pendingSubmission, null, 'matching never submits the context');
});

test('Use Paste fills drafts but preserves a currently saved shared-text edit', () => {
  const server = [{
    context_id: 5,
    context_type: 'comprehension',
    title: 'PASSAGE I',
    context_text: 'The elephant is the largest land animal. It lives in herds led by an older female.',
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    expected_member_count: 2,
    member_count: 0,
    is_active: 0,
    members: [],
  }];
  const env = createEnv({ contextData: server });
  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  env.edit('context_title', 'Owner saved edit');
  env.edit('context_text', 'Keep this saved edit.');

  env.paste(COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.contextField('action'), 'update_context', 'saved form stays in edit mode');
  assertEqual(env.contextField('context_id'), '5', 'saved form keeps its context ID');
  assertEqual(env.contextField('title'), 'Owner saved edit', 'saved title is not replaced');
  assertEqual(env.contextField('context_text'), 'Keep this saved edit.', 'saved passage is not replaced');
  assertEqual(env.state().contexts[0].serverId, null, 'new parsed text remains a separate draft');
  assertEqual(env.visible('context_form'), true, 'preserved saved edit remains visible');
  assert(env.byId('owner_context_add'), 'Add Shared Text remains available to leave saved edit mode');
  env.click('owner_context_add');
  assertEqual(env.contextField('action'), 'save_context', 'Add Shared Text intentionally starts draft mode');
  assert(env.byId('shared_context_editor').className.indexOf('owner-context-editor-draft') > -1,
    'intentional Add transition uses draft styling');
  assert(env.text('owner_context_mode_hint').indexOf('fills this new draft') > -1,
    'intentional Add transition updates the draft hint');
});

test('Use Paste keeps full-identity adoption while preserving saved form edits', () => {
  const server = [{
    context_id: 5,
    context_type: 'comprehension',
    title: 'PASSAGE I',
    context_text: 'The elephant is the largest land animal. It lives in herds led by an older female.',
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    expected_member_count: 2,
    member_count: 0,
    is_active: 0,
    members: [],
  }];
  const env = createEnv({ contextData: server });
  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  env.edit('context_title', 'Owner saved edit');

  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.state().contexts[0].serverId, 5, 'new parsed state still adopts its exact saved match');
  assertEqual(env.contextField('title'), 'Owner saved edit', 'adoption does not replace the saved form edit');
  assertEqual(env.visible('context_form'), true, 'saved form remains reachable after repeated paste');
  assertEqual(env.byId('save_question').disabled, false, 'adopted parsed context does not block question save');
  assert(env.text('owner_context_mode_hint').indexOf('will not change this saved text') > -1,
    'repeated paste keeps the saved-edit hint');
});

test('saved shared text matches by normalized title and full passage text', () => {
  const wrongText = createEnv({
    contextData: [{
      context_id: 5,
      context_type: 'comprehension',
      title: 'PASSAGE I',
      context_text: 'A different passage with the same name.',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 2,
      member_count: 0,
      members: [],
    }],
  });
  wrongText.paste(HEADERED_COMPREHENSION_PASTE);
  wrongText.click('owner_tool_load');
  assertEqual(wrongText.state().contexts[0].serverId, null, 'same title with different text does not bind');

  const normalized = createEnv({
    contextData: [{
      context_id: 6,
      context_type: 'comprehension',
      title: '  PASSAGE   I ',
      context_text: 'The <u>elephant</u> is the largest land animal.\nIt lives in herds led by an older female.',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 2,
      member_count: 0,
      members: [],
    }],
  });
  normalized.paste(HEADERED_COMPREHENSION_PASTE);
  normalized.click('owner_tool_load');
  assertEqual(normalized.state().contexts[0].serverId, 6, 'whitespace and exact underline markers do not prevent binding');
  assertEqual(normalized.visible('owner_context_duplicate'), false, 'the adopted saved copy is not reported as its own duplicate');
});

test('normal and shared-text duplicate notices are advisory', () => {
  const normal = createEnv({
    recentQuestions: [{
      id: 501,
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      question_text: 'Who was the father of faith in the Bible?',
      option_a: 'Isaac',
      option_b: 'Jacob',
      option_c: 'Moses',
      option_d: 'Abraham',
    }],
  });
  normal.paste(FULL_PASTE);
  normal.click('owner_tool_load');
  assert(normal.text('owner_tool_duplicate').indexOf('Question #501') > -1, 'matching recent question is named');
  assertEqual(normal.byId('save_question').disabled, false, 'question duplicate does not disable Save');
  normal.edit('option_b', 'A different option');
  assertEqual(normal.visible('owner_tool_duplicate'), false, 'changing an identity field clears the notice');

  const shared = createEnv({
    contextData: [{
      context_id: 77,
      context_type: 'comprehension',
      title: 'Shared passage',
      context_text: 'Read this shared text.',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: 1,
      member_count: 0,
      members: [],
    }],
  });
  shared.paste(FULL_PASTE);
  shared.click('owner_tool_load');
  shared.click('owner_context_add');
  configureContext(shared, 0, {
    title: '  Shared   passage ',
    text: '<u>Read</u> this shared text.',
    targets: '1',
    expected: '1',
  });
  assert(shared.text('owner_context_duplicate').indexOf('shared text #77') > -1,
    'matching saved shared text is named');
  assertEqual(shared.byId('save_context').disabled, false, 'shared-text duplicate does not disable Save');
  assertEqual(shared.state().pendingSubmission, null, 'duplicate notice never arms a write');
});

test('shared-text edit survives the latest stored paste and excludes its own duplicate identity', () => {
  const stale = stateApi.emptyState(parser.version, 'q-edit-context');
  stale.contexts = [{
    localId: 'c-stale',
    contextType: 'comprehension',
    title: 'Stale browser card',
    text: 'Do not fill this.',
    targets: [1],
    expectedCount: 1,
    subjectId: '1',
    examCategoryId: '2',
    examYear: '2021',
    serverId: null,
    stale: false,
    adopted: false,
  }];
  stale.items = [{
    num: 1,
    question: 'Question from the latest paste.',
    a: 'A',
    b: 'B',
    c: 'C',
    d: 'D',
    e: '',
    f: '',
    flags: [],
    contextRef: 'c-stale',
    contextPosition: '1',
    contextSlot: '',
  }];
  const saved = [7, 8].map(id => ({
    context_id: id,
    context_type: 'comprehension',
    title: 'Shared passage',
    context_text: 'Read this shared text.',
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    expected_member_count: 1,
    member_count: 0,
    members: [],
  }));
  const env = createEnv({
    storage: { [stateApi.KEY]: JSON.stringify(stale) },
    contextAction: 'update_context',
    contextId: 7,
    contextFormValues: {
      context_type: 'comprehension',
      title: 'Shared passage',
      context_text: 'Read this shared text.',
      subject_id: '1',
      exam_category_id: '2',
      exam_year: '2021',
      expected_member_count: '1',
    },
    contextData: saved,
  });
  const storedBefore = env.raw.get(stateApi.KEY);
  assertEqual(env.contextField('title'), 'Shared passage', 'stored browser card does not overwrite the server edit form');
  assertEqual(env.doc.getElementById('owner_context_add'), null, 'editing shared text has no Add control');
  assert(env.text('owner_context_duplicate').indexOf('shared text #8') > -1,
    'duplicate notice excludes current shared text #7');
  env.edit('context_text', 'A unique replacement.');
  assertEqual(env.visible('owner_context_duplicate'), false, 'editing identity refreshes the notice');
  assertEqual(env.raw.get(stateApi.KEY), storedBefore, 'duplicate checking does not write owner state');

  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.state().contexts[0].serverId, null, 'paste does not bind a parsed draft to the saved edit');
  assertEqual(env.contextField('action'), 'update_context', 'paste keeps saved edit mode');
  assertEqual(env.contextField('context_id'), '7', 'paste keeps the edited context ID');
  assertEqual(env.contextField('title'), 'Shared passage', 'Use Paste does not replace the saved title');
  assertEqual(env.contextField('context_text'), 'A unique replacement.', 'Use Paste does not replace the saved passage');
  assert(env.byId('shared_context_editor').className.indexOf('owner-context-editor-edit') > -1,
    'saved context keeps the visible edit mode');
  assertEqual(env.text('owner_context_editor_heading'), 'Edit Saved Shared Text', 'edit heading is explicit');
  assertEqual(env.text('owner_context_mode'), 'Saved text #7 - edit mode', 'edit badge is explicit');
  assert(env.text('owner_context_mode_hint').indexOf('will not change this saved text') > -1,
    'saved edit hint matches edit mode');
});

test('a member-count mismatch only warns and still allows linked saves', () => {
  const server = [{
    context_id: 9,
    context_type: 'comprehension',
    title: 'PASSAGE I',
    context_text: 'The elephant is the largest land animal. It lives in herds led by an older female.',
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    expected_member_count: 2,
    member_count: 3,
    is_active: 1,
    members: [],
  }];
  const env = createEnv({ contextData: server });
  env.paste(HEADERED_COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  const state = env.state();
  assertEqual(state.contexts[0].serverId, 9, 'context is still adopted');
  assert(env.text('owner_tool_warning').indexOf('has 3 questions') > -1, 'count mismatch warns');
  assertEqual(env.byId('save_question').disabled, false, 'linked save stays available');
});

test('empty inferred pool metadata never auto-binds a saved context', () => {
  const server = [{
    context_id: 3,
    context_type: 'comprehension',
    title: 'PASSAGE III',
    subject_id: '',
    exam_category_id: '',
    exam_year: '',
    expected_member_count: 5,
    member_count: 5,
    is_active: 1,
    members: [],
  }];
  const env = createEnv({ contextData: server });
  env.paste(COMPREHENSION_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.state().contexts[0].serverId, null, 'empty gates do not auto-bind');
  assertEqual(env.state().contexts[0].adopted, false, 'the card stays a draft');
  env.byId('context_id').value = '3';
  env.byId('context_id').dispatch('change');
  assertEqual(env.state().items[0].manualContextId, '3', 'manual selection still works');
});

test('a multi-context paste uses one selector and one native editor', () => {
  const env = createEnv();
  env.paste(COMPREHENSION_MULTI_PASTE);
  env.click('owner_tool_load');
  assertEqual(env.contextField('title'), 'PASSAGE I', 'the first parsed context fills the native form');
  assertEqual(env.byId('owner_context_select').children.length, 2, 'both parsed contexts are listed');
  assertEqual(env.doc.getElementById('owner_context_toggle'), null, 'there is no duplicate card list');
  const select = env.byId('owner_context_select');
  select.value = env.state().contexts[1].localId;
  select.onchange();
  assertEqual(env.contextField('title'), 'PASSAGE II', 'the selector fills the chosen context');
});

test('the toolbar and one candidate preview sit beside Question Text for every item type', () => {
  [FULL_PASTE, COMPREHENSION_PASTE].forEach(paste => {
    const env = createEnv();
    env.paste(paste);
    env.click('owner_tool_load');
    const questionField = env.form.elements.question_text.closest('.admin-field');
    const toolbar = env.doc.querySelector('.owner-tool-format');
    const preview = env.doc.querySelector('.owner-tool-preview-wrap');
    assert(toolbar.parentNode === questionField, 'toolbar shares the question field');
    assert(preview.parentNode === questionField, 'preview shares the question field');
    assert(env.text('owner_tool_preview').length > 0, 'loaded question has a preview');
  });
  const edit = createEnv({
    search: '?edit=42',
    formValues: { question_text: 'Edit this linked question.', context_id: '5' },
  });
  assert(edit.doc.querySelector('.owner-tool-preview-wrap').parentNode
    === edit.form.elements.question_text.closest('.admin-field'), 'edit preview shares the question field');
  assertEqual(edit.text('owner_tool_preview'), 'Edit this linked question.', 'loaded linked edit has a preview');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('id="owner_tool_context_data"') > -1, 'saved contexts are embedded');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('cbt_context_members($pdo') > -1, 'member payload is built by the context module');
});

test('the native form has separate shared-text and question-detail groups', () => {
  const env = createEnv();
  const linkGroup = env.byId('owner_context_link_fields');
  const questionGroup = env.byId('owner_question_fields');
  assert(linkGroup.parentNode === env.form, 'shared-text group is in the question form');
  assert(questionGroup.parentNode === env.form, 'question-detail group is in the question form');
  ['context_id', 'context_position', 'context_slot'].forEach(id => {
    assert(env.byId(id).closest('fieldset') === linkGroup, id + ' stays in the shared-text group');
  });
  ['subject_id', 'exam_category_id', 'exam_year', 'question_text', 'option_a', 'answer_explanation']
    .forEach(id => assert(env.byId(id).closest('fieldset') === questionGroup, id + ' stays in question details'));
  assert(STYLE_SOURCE.indexOf('.owner-link-fields') > -1, 'shared-text group has boundary styles');
  assert(STYLE_SOURCE.indexOf('.owner-question-fields') > -1, 'question details have boundary styles');
});

test('owner copy uses short plain words while fixed flashes stay exact', () => {
  const env = createEnv();
  assert(env.text('owner_tool').indexOf('Question Helper') > -1, 'plain tool name');
  const questionLabel = env.form.elements.question_text.closest('.admin-field').querySelector('label[for="question_text"]');
  assertEqual(questionLabel.textContent, 'Question Text', 'native question label');
  assertEqual(env.form.elements.subject_id.options[0].text, 'Choose a subject', 'plain subject prompt');
  assertEqual(env.form.elements.exam_category_id.options[0].text, 'Choose an exam', 'plain exam prompt');
  env.paste(EF_PASTE);
  env.click('owner_tool_load');
  assert(env.text('owner_tool_flags').indexOf('option E or F was found') > -1, 'parser flag is translated for display');
  assert(env.text('owner_tool_status').indexOf('queue') === -1, 'status does not say queue');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('Edit Saved Shared Text') > -1, 'saved context heading names edit mode');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('New Shared Text') > -1, 'draft heading names draft mode');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('Context Position') === -1, 'native link jargon is removed');
  assert(OWNER_TOOL_SOURCE.indexOf('Question saved successfully \\(Question ID: \\d+\\)') > -1,
    'exact question flash detector remains');
  assert(SHARED_TEXTS_SOURCE.indexOf('Context #(\\d+) created\\. Link its members, then activate it\\.') > -1,
    'exact context flash detector remains in the shared-texts module');
});

test('plain server copy keeps every context validation reason', () => {
  const env = createEnv({
    error: 'Please enter a context title. Please enter the shared context text. Choose a valid subject for the context pool.',
  });
  assertEqual(env.doc.errorElement.textContent,
    'Give the shared text a name. Add the shared text. Choose a subject.',
    'all validation reasons remain visible');
  const failed = createEnv({
    error: 'The context could not be saved. Check that the context migration has been imported and try again.',
  });
  assertEqual(failed.doc.errorElement.textContent, 'The shared text did not save. Ask for help.',
    'context failure is not called a question failure');
});

test('the owner tool uses one native shared-context editor', () => {
  assert(CONTROLLER_SOURCE.indexOf('insertBefore(contextPanelRoot, nativeContextForm)') > -1,
    'context controls move into the native card');
  assert(OWNER_TOOL_SOURCE.indexOf('Fill Context Form') === -1, 'redundant fill action is absent');
  ['Subject pool', 'Category pool', 'Year pool', 'owner_context_toggle']
    .forEach(term => assert(OWNER_TOOL_SOURCE.indexOf(term) === -1, term + ' is absent'));
  assert(ADMIN_CONTEXT_SOURCE.indexOf('id="shared_context_editor"') > -1, 'native editor has one stable card');
  assert(STYLE_SOURCE.indexOf('.owner-context-editor-draft') > -1, 'draft mode has distinct styling');
  assert(STYLE_SOURCE.indexOf('.owner-context-editor-edit') > -1, 'saved edit mode has distinct styling');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('id="owner_context_targets"') > -1, 'browser queue targets share the native card');
  assert(!/id="owner_context_targets"[^>]*\bname=/.test(ADMIN_CONTEXT_SOURCE),
    'browser-only targets do not change the server contract');
});

test('OT12 keeps the standalone page to Add and All Questions', () => {
  const addAt = ADMIN_SOURCE.indexOf('id="owner-add-question"');
  const allAt = ADMIN_SOURCE.indexOf('id="owner-all-questions"');
  assert(addAt > -1 && allAt > addAt, 'Add and All Questions stay in order');
  assert(ADMIN_SOURCE.indexOf('cbt_admin_render_context_management') === -1,
    'the standalone page no longer renders the shared-text section');
  assert(ADMIN_SOURCE.indexOf('cbt_admin_render_question_context_fields') === -1,
    'the standalone page no longer renders context link fields');
  assert(ADMIN_SOURCE.indexOf('owner_tool_tab') === -1, 'admin page has no tab shell');
  assert(ADMIN_SHARED_SOURCE.indexOf('cbt_admin_render_context_management') > -1,
    'the shared-text page owns the shared-text section');
  assert(ADMIN_SHARED_SOURCE.indexOf('admin_questions.php') > -1,
    'the shared-text page links back to standalone questions');
  assert(STYLE_SOURCE.indexOf('.owner-workflow-section') > -1, 'full-width sections have shared boundary styles');
});
test('refinement copy uses Reset, Edit, and the short target instruction', () => {
  const env = createEnv();
  assertEqual(env.text('owner_tool_reset'), 'Reset', 'reset button copy');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('Add this many questions, numbered from 1.') === -1,
    'expected-count helper is removed');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('List question numbers in order.') > -1, 'target instruction is exact');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('>Edit</a>') > -1, 'saved shared-text action says Edit');
  assert(ADMIN_CONTEXT_SOURCE.indexOf('Editing shared text #') > -1, 'shared-text edit status says Editing');
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
  assert(warning.indexOf('Old saved work') > -1, 'old work is explained');
  assert(warning.indexOf('left alone') > -1, 'old work is preserved');
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
  assert(ADMIN_CONTEXT_SOURCE.indexOf("($editingQuestionId ?? 0) > 0 ? ' hidden' : ''") > -1,
    'shared-text section is server-hidden while editing a question');
  assert(ADMIN_SOURCE.indexOf("$editingQuestionId > 0 ? ' hidden' : ''") > -1,
    'all-questions section is server-hidden while editing a question');
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
  assert(env.text('owner_tool_warning').indexOf('older tool') > -1, 'refusal warning shown');
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
  assert(env.text('owner_tool_warning').indexOf('could not open') > -1, 'corrupt warning shown');
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
  assert(env.text('owner_tool_hint').indexOf('Select words') > -1, 'the owner is told what to select');
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

test('the admin page loads the consolidated parser, renderer, and owner tool in order', () => {
  const coreAt = ADMIN_SOURCE.indexOf('src/parser/core.js');
  const renderAt = ADMIN_SOURCE.indexOf('src/owner-tool/render.js');
  const toolAt = ADMIN_SOURCE.indexOf('src/owner-tool/owner-tool.js');
  assert(coreAt > -1, 'parser engine is loaded');
  assert(renderAt > -1, 'shared renderer is loaded');
  assert(toolAt > -1, 'owner tool bundle is loaded');
  assert(coreAt < renderAt && renderAt < toolAt, 'core, renderer, and owner tool load in order');
  ['src/parser/core.js?v=2.3.3', 'src/owner-tool/owner-tool.css?v=2.3.3a',
    'src/owner-tool/owner-tool.js?v=2.3.3e']
    .forEach(asset => assert(ADMIN_SOURCE.indexOf(asset) > -1, asset + ' uses the current admin token'));
  ['src/owner-tool/owner-tool.css?v=2.3.3a', 'src/owner-tool/render.js?v=2.3.2g']
    .forEach(asset => assert(CBT_SOURCE.indexOf(asset) > -1, asset + ' uses the current CBT token'));
  ['src/parser/comprehension.js', 'src/parser/cloze.js', 'src/owner-tool/state.js', 'src/owner-tool/controller.js']
    .forEach(relative => assert(ADMIN_SOURCE.indexOf(relative) === -1, relative + ' is consolidated away'));
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
  assert(env.text('owner_tool_hint').indexOf('all underlined words') > -1, 'owner receives a useful instruction');
});

test('underline refuses to remove markers from a nested boundary', () => {
  const env = createEnv();
  const value = '<u>outer <u>inner</u>';
  env.type(value);
  const start = value.indexOf('inner');
  env.select(start, start + 'inner'.length);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), value, 'malformed nested text is unchanged');
  assert(env.text('owner_tool_hint').indexOf('all underlined words') > -1, 'overlap guidance shown');
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
  assert(env.text('owner_tool_hint').indexOf('Select words') > -1, 'empty-selection guidance shown');
});

test('underline refuses a selection that touches only part of a marker', () => {
  const env = createEnv();
  env.type('<u>word</u>');
  env.select(8, 10);
  env.click('owner_tool_underline');
  assertEqual(env.field('question_text'), '<u>word</u>', 'partial closing marker is unchanged');
  assert(env.text('owner_tool_hint').indexOf('all underlined words') > -1, 'overlap guidance shown');
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
  const submitBody = CONTROLLER_SOURCE.slice(submitAt, submitAt + 700);
  assert(submitBody.indexOf('blockQuestionSave') > -1, 'submit cancellation uses the focused link blocker');
  const blockerAt = CONTROLLER_SOURCE.indexOf('function blockQuestionSave');
  const blockerBody = CONTROLLER_SOURCE.slice(blockerAt, blockerAt + 500);
  assert(blockerAt > -1 && blockerBody.indexOf('preventDefault') > -1, 'a blocked linked submit is cancelled');
  assertEqual((CONTROLLER_SOURCE.match(/\.preventDefault\(/g) || []).length, 3,
    'only the linked-save stop and underline controls suppress defaults');
  assert(CONTROLLER_SOURCE.indexOf("$('is_active').checked") === -1,
    'active checkbox state is never forced');
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
