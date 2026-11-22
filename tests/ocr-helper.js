#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const helper = require('../ocr_helper.js');

let passed = 0;
const tests = [];

function test(name, fn) {
  tests.push([name, fn]);
}

function parseAll(text) {
  const fixed = helper.FIXES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  return helper.splitQuestions(fixed).map(helper.parseQuestion);
}

function missingOptionFlags(question) {
  return question.flags.filter((flag) => /^option [A-D] missing$/.test(flag));
}

test('civic paper parses as 50 four-option questions with no flags', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
  const questions = parseAll(text);
  assert.strictEqual(questions.length, 50);
  for (const question of questions) {
    assert.deepStrictEqual(question.flags, [], 'question ' + question.num + ' flags');
    for (const letter of 'abcd') {
      assert.notStrictEqual(question[letter], '', 'question ' + question.num + ' option ' + letter);
    }
  }
});

test('accepts all six lowercase and uppercase label forms', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-option-labels.txt'), 'utf8');
  const questions = parseAll(text);
  assert.strictEqual(questions.length, 6);
  for (const question of questions) {
    assert.deepStrictEqual(question.flags, [], 'question ' + question.num + ' flags');
    assert.strictEqual(question.a, 'One');
    assert.strictEqual(question.b, 'Two');
    assert.strictEqual(question.c, 'Three');
    assert.strictEqual(question.d, 'Four');
  }
});

test('bank-2021 still yields 40 questions with no missing options', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/bank-2021.txt'), 'utf8');
  const questions = parseAll(text);
  assert.strictEqual(questions.length, 40);
  for (const question of questions) {
    assert.deepStrictEqual(missingOptionFlags(question), [], 'question ' + question.num);
  }
});

test('accepts whitespace between an option letter and its period', () => {
  const spaced = helper.parseQuestion({ num: 1, text: 'Which option is correct? A . One B . Two C . Three D . Four' });
  assert.deepStrictEqual(missingOptionFlags(spaced), []);
  assert.strictEqual(spaced.a, 'One');
  assert.strictEqual(spaced.b, 'Two');
  assert.strictEqual(spaced.c, 'Three');
  assert.strictEqual(spaced.d, 'Four');

  const lowercase = helper.parseQuestion({ num: 2, text: 'Which option is correct? a . One\nb\n. Two c . Three d . Four' });
  assert.deepStrictEqual(missingOptionFlags(lowercase), []);
  assert.strictEqual(lowercase.a, 'One');
  assert.strictEqual(lowercase.b, 'Two');
  assert.strictEqual(lowercase.c, 'Three');
  assert.strictEqual(lowercase.d, 'Four');

  const questions = parseAll('1. Which option is correct? A . One B . Two C . Three D . Four');
  assert.strictEqual(questions.length, 1);
  assert.deepStrictEqual(questions[0].flags, []);
});

test('accepts the complete D-91 spacing grammar case-insensitively', () => {
  const formats = [
    'L.', 'L .', 'L)', 'L )',
    '(L)', '( L)', '(L )', '( L )',
    '(L).', '( L).', '(L ).', '( L ).',
    '(L) .', '( L) .', '(L ) .', '( L ) .',
    '(\nL\n)\n.'
  ];
  const values = ['One', 'Two', 'Three', 'Four'];

  for (const format of formats) {
    for (const lowercase of [false, true]) {
      const labels = [...'ABCD'].map((letter, index) => {
        const rendered = lowercase ? letter.toLowerCase() : letter;
        return format.replace('L', rendered) + ' ' + values[index];
      }).join(' ');
      const question = helper.parseQuestion({ num: 1, text: 'Which option is correct? ' + labels });
      assert.strictEqual(question.question, 'Which option is correct?', format);
      assert.deepStrictEqual(missingOptionFlags(question), [], format);
      assert.deepStrictEqual([question.a, question.b, question.c, question.d], values, format);
      assert.deepStrictEqual(question.flags, [], format);
    }
  }
});

test('keeps later selected-letter labels inside their option text', () => {
  const exact = helper.parseQuestion({
    num: 1,
    text: 'Which is correct? A) The notation A ) stays in option A B) Two C) Three D) Four'
  });
  assert.strictEqual(exact.question, 'Which is correct?');
  assert.strictEqual(exact.a, 'The notation A ) stays in option A');
  assert.strictEqual(exact.b, 'Two');
  assert.strictEqual(exact.c, 'Three');
  assert.strictEqual(exact.d, 'Four');
  assert.deepStrictEqual(exact.flags, []);

  const repeated = helper.parseQuestion({
    num: 2,
    text: 'Which option is correct? A) Alpha A ) stays B) Bravo B . stays C) Charlie ( C ) stays D) Delta ( D ) . stays'
  });
  assert.strictEqual(repeated.a, 'Alpha A ) stays');
  assert.strictEqual(repeated.b, 'Bravo B . stays');
  assert.strictEqual(repeated.c, 'Charlie ( C ) stays');
  assert.strictEqual(repeated.d, 'Delta ( D ) . stays');
  assert.deepStrictEqual(repeated.flags, []);
});

test('still flags a second complete A-D option set', () => {
  const question = helper.parseQuestion({
    num: 1,
    text: 'Which option is correct? A) One B) Two C) Three D) Four A) Five B) Six C) Seven D) Eight'
  });
  assert(question.flags.includes('a letter appears twice (merged questions?)'));

  const numbered = helper.parseQuestion({
    num: 1,
    text: 'Which option is correct? A) One B) Two C) Three D) Four 2. Second question A) Five B) Six C) Seven D) Eight'
  });
  assert(!numbered.flags.includes('a letter appears twice (merged questions?)'));

  const interleaved = helper.parseQuestion({
    num: 1,
    text: 'Which option is correct? A) One B) Two C) Three D) Four A) Five B) Six A) notation C) Seven D) Eight'
  });
  assert(interleaved.flags.includes('a letter appears twice (merged questions?)'));

  const outOfOrder = helper.parseQuestion({
    num: 1,
    text: 'Which option is correct? D) Four A) One B) Two C) Three D) notation'
  });
  assert(!outOfOrder.flags.includes('a letter appears twice (merged questions?)'));
});

test('normalizes parsed letters to uppercase', () => {
  const question = helper.parseQuestion({ num: 1, text: 'Which option is correct? (a) One (b) Two (c) Three (d) Four' });
  assert.strictEqual(question.a, 'One');
  assert.strictEqual(question.b, 'Two');
  assert.strictEqual(question.c, 'Three');
  assert.strictEqual(question.d, 'Four');
});

test('keeps blank-line paragraphs and folds single wraps', () => {
  const question = helper.parseQuestion({
    num: 1,
    text: 'First line wraps\nonto a second line.\n\nSecond paragraph stays.\n(a) One\n(b) Two\n(c) Three\n(d) Four'
  });
  assert.strictEqual(question.question, 'First line wraps onto a second line.\n\nSecond paragraph stays.');
  assert.strictEqual(question.a, 'One');
  assert.strictEqual(question.b, 'Two');
  assert.strictEqual(question.c, 'Three');
  assert.strictEqual(question.d, 'Four');
});

test('does not recognize a no-stem cloze row as a numbered question', () => {
  const questions = parseAll('1. (a) One (b) Two (c) Three (d) Four');
  assert.strictEqual(questions.length, 1);
  assert.strictEqual(questions[0].num, null);
  assert(questions[0].flags.includes('question number missing'));
  assert(questions[0].flags.includes('question text missing or very short'));
});

test('adapter splits lowercase oral stems and keeps each rubric out of the options', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/region-lowercase-stems.txt'), 'utf8');
  const questions = parseAll(text);
  assert.deepStrictEqual(questions.map(q => q.num), [1, 2, 3, 4, 5]);
  assert.strictEqual(questions[2].d, 'baked');
  assert.strictEqual(questions[3].a, 'plump');
  assert(questions[3].sectionInstruction.includes('consonant sound'));
  for (const question of questions) {
    assert(!/SECTION \d/.test(question.d), 'question ' + question.num + ' option D');
  }
});

test('adapter reports a trailing structural run instead of folding it into option D', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/region-footer-instruction.txt'), 'utf8');
  const questions = parseAll(text);
  assert.strictEqual(questions[1].d, 'patients');
  const regions = helper.splitRegions(text).regions;
  assert.strictEqual(regions[regions.length - 1].text, 'END OF SECTION 1');
  assert.strictEqual(regions[regions.length - 1].from, null);
});

test('adapter keeps an unnumbered option block as its own question', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/region-orphan-number.txt'), 'utf8');
  const questions = parseAll(text);
  assert.deepStrictEqual(questions.map(q => q.num), [null, 25, 26]);
  assert.strictEqual(questions[0].question, 'lump');
  assert.strictEqual(questions[1].d, 'signal');
});

test('adapter delegates every parser entry point to the canonical core', () => {
  const core = require('../src/parser/core.js');
  assert.strictEqual(helper.splitQuestions, core.splitQuestions);
  assert.strictEqual(helper.splitRegions, core.splitRegions);
  assert.strictEqual(helper.parseQuestion, core.parseQuestion);
  assert.strictEqual(helper.FIXES, core.FIXES);
});

test('has no Constant Text field integration', () => {
  const source = fs.readFileSync(path.join(__dirname, '../ocr_helper.js'), 'utf8');
  assert.strictEqual(source.includes('constant_text'), false);
});

function loadHelperInBrowser(options) {
  const inserted = [];
  const radios = [0, 1, 2, 3].map((index) => ({ value: String(index), checked: false }));
  const submitHandlers = [];
  const timers = [];
  const form = {
    before(node) { inserted.push(node); },
    addEventListener(type, handler) { if (type === 'submit') submitHandlers.push(handler); },
    querySelectorAll(selector) {
      return selector === '[name=correct_option]' ? radios : [];
    },
    submit() { submitHandlers.forEach((handler) => handler()); }
  };
  const anchor = options.withForm === false ? null : { form };
  const fields = new Map();
  const storage = new Map(Object.entries(options.storage || {}));
  const session = new Map(Object.entries(options.session || {}));
  const errors = [];
  const document = {
    querySelector(selector) {
      if (selector === 'input[name=action][value=save_question]') return anchor;
      if (selector === '.admin-error' && options.withError) return { textContent: 'Duplicate question.' };
      return null;
    },
    getElementById(id) {
      if (!fields.has(id)) fields.set(id, { value: '', hidden: false, innerHTML: '', className: '' });
      return fields.get(id);
    },
    createElement() {
      return { className: '', id: '', textContent: '', innerHTML: '' };
    }
  };
  const sandbox = {
    window: { OCRParser: options.parser || null },
    document,
    location: { search: options.search || '' },
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    },
    sessionStorage: {
      getItem: (key) => (session.has(key) ? session.get(key) : null),
      setItem: (key, value) => session.set(key, String(value)),
      removeItem: (key) => session.delete(key)
    },
    setTimeout(fn) { timers.push(fn); return timers.length; },
    clearTimeout(id) { if (id) timers[id - 1] = null; },
    fetch: options.fetch || (() => Promise.reject(new Error('unexpected fetch'))),
    FormData: function FormData(element) { this.form = element; },
    alert() {},
    console: { error(message) { errors.push(String(message)); } }
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(__dirname, '../ocr_helper.js'), 'utf8');
  let thrown = null;
  try {
    vm.runInContext(source, sandbox, { filename: 'ocr_helper.js' });
  } catch (error) {
    thrown = error;
  }
  return {
    thrown, inserted, errors, fields, radios, form, storage, session,
    field: (id) => document.getElementById(id),
    runTimers() { timers.splice(0).forEach((fn) => { if (fn) fn(); }); }
  };
}

test('fails loudly when the browser parser global is missing', () => {
  const result = loadHelperInBrowser({ parser: null });
  assert(result.thrown, 'helper should throw when window.OCRParser is absent');
  assert(/OCR helper disabled/.test(result.thrown.message));
  assert(/window\.OCRParser/.test(result.thrown.message));
  assert.strictEqual(result.errors.length, 1);
  assert(/window\.OCRParser/.test(result.errors[0]));
  assert.strictEqual(result.inserted.length, 1);
  assert.strictEqual(result.inserted[0].id, 'ocr_error');
  assert(/OCR helper disabled/.test(result.inserted[0].textContent));
  assert(/not deployed/.test(result.inserted[0].textContent));
});

test('refuses a parser core whose version does not match the adapter', () => {
  const parser = Object.assign({}, require('../src/parser/core.js'), { version: '2.3.0' });
  const result = loadHelperInBrowser({ parser });
  assert(result.thrown, 'helper should throw on a version mismatch');
  assert(/2\.3\.0/.test(result.thrown.message));
  assert(/2\.4\.0/.test(result.thrown.message));
  assert.strictEqual(result.errors.length, 1);
  assert.strictEqual(result.inserted.length, 1);
  assert.strictEqual(result.inserted[0].id, 'ocr_error');
});

test('logs without throwing when the admin form is absent', () => {
  const result = loadHelperInBrowser({ parser: null, withForm: false });
  assert.strictEqual(result.thrown, null);
  assert.strictEqual(result.errors.length, 1);
  assert(/window\.OCRParser/.test(result.errors[0]));
  assert.strictEqual(result.inserted.length, 0);
});

test('renders the paste panel when the core is present in the browser', () => {
  const result = loadHelperInBrowser({ parser: require('../src/parser/core.js') });
  assert.strictEqual(result.thrown, null);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.inserted.length, 1);
  assert(result.inserted[0].innerHTML.includes('ocr_input'));
  assert(result.inserted[0].innerHTML.includes('ocr_text'));
  assert(result.inserted[0].innerHTML.includes('ocr_load'));
});

function browserHelperWithCore(options) {
  const result = loadHelperInBrowser(Object.assign({ parser: require('../src/parser/core.js') }, options || {}));
  assert.strictEqual(result.thrown, null);
  return result;
}

function persisted(result) {
  return {
    storage: Object.fromEntries(result.storage),
    session: Object.fromEntries(result.session)
  };
}

function loadPaste(result, text) {
  result.field('ocr_text').value = text;
  result.field('ocr_load').onclick();
}

function checkedRadios(result) {
  return result.radios.filter((radio) => radio.checked).map((radio) => radio.value);
}

test('loads the whole civic paper with its answer key and ticks the option', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const result = browserHelperWithCore();
  loadPaste(result, text);
  assert(result.field('question_text').value.startsWith('By upholding values like honesty'), 'first stem');
  assert.strictEqual(result.field('option_d').value, 'secure and stable environment.');
  assert.deepStrictEqual(checkedRadios(result), ['2'], 'question 1 key C');
  assert(/Question 1 of 50/.test(result.field('ocr_status').innerHTML));
  assert(/Answer key: 50 entries \(header\)/.test(result.field('ocr_status').innerHTML));
  assert(/key C/.test(result.field('ocr_status').innerHTML), 'key shown beside the question');

  result.field('ocr_skip').onclick();
  assert(result.field('question_text').value.startsWith('National consciousness'), 'second stem');
  assert.deepStrictEqual(checkedRadios(result), ['1'], 'question 2 key B');

  for (let index = 2; index < 50; index++) result.field('ocr_skip').onclick();
  assert(/Question 50 of 50/.test(result.field('ocr_status').innerHTML));
  assert.deepStrictEqual(checkedRadios(result), ['2'], 'question 50 key C');
  assert.strictEqual(result.field('option_d').value, 'will only be enjoyed when the citizens are patient.');
});

test('leaves every radio unticked when the paste has no answer key', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
  const result = browserHelperWithCore();
  loadPaste(result, text);
  assert.deepStrictEqual(checkedRadios(result), []);
  assert(/No answer-key section found/.test(result.field('ocr_status').innerHTML));
  assert(/no key/.test(result.field('ocr_status').innerHTML));

  result.field('ocr_clear').onclick();
  assert.strictEqual(result.field('ocr_status').innerHTML, '');
});

test('attaches a key-only paste to the queue that is already loaded', () => {
  const questions = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
  const result = browserHelperWithCore();
  loadPaste(result, questions);
  assert.deepStrictEqual(checkedRadios(result), []);

  loadPaste(result, 'ANSWER KEY\n1. D\n2. A\n');
  assert.deepStrictEqual(checkedRadios(result), ['3'], 'question 1 key D from the key-only paste');
  assert(/Answer key updated \(2 entries\)/.test(result.field('ocr_status').innerHTML));
  assert(result.field('question_text').value.startsWith('By upholding values'), 'form keeps its question');

  result.field('ocr_skip').onclick();
  assert.deepStrictEqual(checkedRadios(result), ['0'], 'question 2 key A');
});

test('restores the paste and the current question after a reload', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);
  first.field('ocr_skip').onclick();
  assert(/Question 2 of 50/.test(first.field('ocr_status').innerHTML));

  const second = browserHelperWithCore(persisted(first));
  assert.strictEqual(second.field('ocr_text').value, text, 'paste restored');
  assert(second.field('question_text').value.startsWith('National consciousness'), 'question 2 restored');
  assert.deepStrictEqual(checkedRadios(second), ['1'], 'question 2 key B ticked without pasting again');
  assert(/key B/.test(second.field('ocr_status').innerHTML), 'stored key shown');
  assert(/50 answers/.test(second.field('ocr_status').innerHTML), 'stored key count shown');
});

test('advances past a saved question after the submit reload and keeps ticking', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);
  first.form.submit();

  const second = browserHelperWithCore(persisted(first));
  assert(second.field('question_text').value.startsWith('National consciousness'), 'advanced to question 2');
  assert.deepStrictEqual(checkedRadios(second), ['1'], 'question 2 key B');
  assert.strictEqual(second.storage.has('ocrSubmitted'), false, 'submit flag consumed');
  assert.strictEqual(second.field('ocr_text').value, text, 'paste still there');
});

test('clears the stored paste and key with the list', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const result = browserHelperWithCore();
  loadPaste(result, text);
  assert(result.session.has('ocrPaste'), 'paste stored on load');
  assert(result.storage.has('ansKey'), 'key stored on load');
  result.field('ocr_clear').onclick();
  assert.strictEqual(result.session.has('ocrPaste'), false, 'paste cleared');
  assert.strictEqual(result.storage.has('ansKey'), false, 'key cleared');
  assert.strictEqual(result.field('ocr_text').value, '');
});

test('keeps the answer key in ansKey when the queue is replaced without one', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);
  const stored = JSON.parse(first.storage.get('ansKey'));
  assert.strictEqual(stored['1'], 'C');
  assert.strictEqual(stored['50'], 'C');

  const queue = JSON.parse(first.storage.get('ocrQueue'));
  first.storage.set('ocrQueue', JSON.stringify({ items: queue.items, i: 1 }));
  const second = browserHelperWithCore(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), ['1'], 'question 2 key B from ansKey');
  assert(/key B/.test(second.field('ocr_status').innerHTML));
  assert(/50 answers/.test(second.field('ocr_status').innerHTML));
});

const AUTO_PASTE = '1. First autosave question? A) One B) Two C) Three D) Four\n' +
  '2. Second autosave question? A) One B) Two C) Three D) Four\n' +
  'ANSWER KEY\n1. A\n2. B\n';

function ready(result) {
  result.field('subject_id').value = '1';
  result.field('exam_category_id').value = '2';
  result.field('exam_year').value = '2026';
  return result;
}

test('load questions runs a dry run and saves nothing', () => {
  const result = ready(browserHelperWithCore());
  loadPaste(result, AUTO_PASTE);
  assert(/Dry run OK/.test(result.field('ocr_status').innerHTML));
  assert(/0 of 2 saved/.test(result.field('ocr_progress_label').innerHTML));
  assert(/dry run OK/.test(result.field('ocr_progress_label').innerHTML));
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'no save on load');
});

test('dry run blocks a paste with no answer key', () => {
  const result = ready(browserHelperWithCore());
  loadPaste(result, '1. First question here? A) One B) Two C) Three D) Four\n2. Second question here? A) One B) Two C) Three D) Four');
  assert(/2 question\(s\) without an answer key/.test(result.field('ocr_status').innerHTML));
  assert(/Autosave is blocked/.test(result.field('ocr_status').innerHTML));
  assert(/dry run incomplete/.test(result.field('ocr_progress_label').innerHTML));
  result.field('ocr_auto').onclick();
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'blocked start saves nothing');
});

function savedResponse() {
  return { text: () => Promise.resolve('<div class="admin-alert">Question saved successfully (Question ID: 7).</div>') };
}

function failedResponse(message) {
  return { text: () => Promise.resolve('<div class="admin-alert admin-error">' + message + '</div>') };
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test('autosave posts each question and completes without a reload', async () => {
  let calls = 0;
  const result = ready(browserHelperWithCore({ fetch: () => { calls++; return Promise.resolve(savedResponse()); } }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  assert(/saving question 1/.test(result.field('ocr_progress_label').innerHTML));
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'autosave does not use the reload marker');

  await flush();
  assert.strictEqual(calls, 1, 'one POST for the first question');
  assert(/1 of 2 saved/.test(result.field('ocr_progress_label').innerHTML));
  assert(/First autosave question/.test(result.field('question_text').value), 'next question is not filled until the delay');

  result.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'one POST for the second question');
  assert(/2 of 2 saved/.test(result.field('ocr_progress_label').innerHTML));
  assert(/autosave complete/.test(result.field('ocr_progress_label').innerHTML));
  assert(/Autosave complete: 2 of 2 saved/.test(result.field('ocr_status').innerHTML));
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
  assert.strictEqual(result.storage.has('ocrAuto'), false, 'no new localStorage key');
});

test('autosave stops on a save error and leaves the question queued', async () => {
  let calls = 0;
  const result = ready(browserHelperWithCore({ fetch: () => { calls++; return Promise.resolve(failedResponse('Duplicate question.')); } }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  await flush();
  assert.strictEqual(calls, 1);
  assert(/Autosave stopped at question 1: Duplicate question/.test(result.field('ocr_status').innerHTML));
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'question stays queued');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
});

test('prefers the key in the current queue over a stale ansKey', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);

  const queue = JSON.parse(first.storage.get('ocrQueue'));
  queue.key = { 1: 'D', 2: 'A' };
  queue.i = 0;
  first.storage.set('ocrQueue', JSON.stringify(queue));
  first.storage.set('ansKey', JSON.stringify({ 1: 'C', 2: 'B', 50: 'C' }));

  const second = browserHelperWithCore(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), ['3'], 'question 1 key D from the queue');
  assert(/key D/.test(second.field('ocr_status').innerHTML));
  assert(/2 answers/.test(second.field('ocr_status').innerHTML), 'queue key count wins');
  assert.strictEqual(JSON.parse(second.storage.get('ansKey'))['1'], 'D', 'ansKey refreshed from the queue');
});

test('stop autosave works while the save request is still hanging', async () => {
  let resolveFetch = null;
  const result = ready(browserHelperWithCore({
    fetch: () => new Promise((resolve) => { resolveFetch = resolve; })
  }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  assert.strictEqual(result.field('ocr_auto').textContent, 'Stop autosave');
  assert(/saving question 1/.test(result.field('ocr_progress_label').innerHTML));

  result.field('ocr_auto').onclick();
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave', 'stop is immediate');
  assert(/Autosave stopped at question 1/.test(result.field('ocr_status').innerHTML));
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'question stays queued');

  resolveFetch(savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'late response does not advance the queue');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
  assert(/Autosave stopped at question 1/.test(result.field('ocr_status').innerHTML), 'status unchanged');
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('[PASS] ' + name);
  }
  console.log('PASS: ' + passed + ' ocr-helper vectors');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
