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

function missingOptionFlags(question) {
  return question.flags.filter((flag) => /^option [A-D] missing$/.test(flag));
}

test('civic paper parses as 50 four-option questions with no flags', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
  const questions = helper.parseAll(text);
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
  const questions = helper.parseAll(text);
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
  const questions = helper.parseAll(text);
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

  const questions = helper.parseAll('1. Which option is correct? A . One B . Two C . Three D . Four');
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
  const questions = helper.parseAll('1. (a) One (b) Two (c) Three (d) Four');
  assert.strictEqual(questions.length, 1);
  assert.strictEqual(questions[0].num, null);
  assert(questions[0].flags.includes('question number missing'));
  assert(questions[0].flags.includes('question text missing or very short'));
});

test('adapter splits lowercase oral stems and keeps each rubric out of the options', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/region-lowercase-stems.txt'), 'utf8');
  const questions = helper.parseAll(text);
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
  const questions = helper.parseAll(text);
  assert.strictEqual(questions[1].d, 'patients');
  const regions = helper.splitRegions(text).regions;
  assert.strictEqual(regions[regions.length - 1].text, 'END OF SECTION 1');
  assert.strictEqual(regions[regions.length - 1].from, null);
});

test('adapter keeps an unnumbered option block as its own question', () => {
  const text = fs.readFileSync(path.join(__dirname, '../fixtures/inputs/region-orphan-number.txt'), 'utf8');
  const questions = helper.parseAll(text);
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
  const radios = [0, 1, 2, 3].map((index) => ({ value: String(index), checked: true }));
  const submitHandlers = [];
  const timers = [];
  const form = {
    before(node) { inserted.push(node); },
    addEventListener(type, handler, capture) {
      if (type === 'submit') submitHandlers.push({ handler, capture: Boolean(capture) });
    },
    querySelectorAll(selector) {
      return selector === '[name=correct_option]' ? radios : [];
    },
    submit(event) {
      const e = event || {
        defaultPrevented: false,
        immediateStopped: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() { this.immediateStopped = true; }
      };
      // At the target, capture and bubble listeners run in registration order.
      for (const item of submitHandlers) {
        if (e.immediateStopped) break;
        item.handler(e);
      }
      return e;
    }
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
    window: { OCRParser: options.parser || null, __ocrBookmarklet: options.bookmarklet === true },
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
  if (options.pageHelperSubmit) {
    // The live page's own helper listens first and writes the reload marker.
    submitHandlers.push({ handler: () => storage.set('ocrSubmitted', 'true'), capture: false });
  }
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(__dirname, '../ocr_helper.js'), 'utf8');
  let thrown = null;
  try {
    vm.runInContext(source, sandbox, { filename: 'ocr_helper.js' });
  } catch (error) {
    thrown = error;
  }
  return {
    thrown, inserted, errors, fields, radios, form, storage, session, document,
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
  assert(/2\.5\.4/.test(result.thrown.message));
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

test('bookmarklet saves in place and keeps the key for the next question', async () => {
  let calls = 0;
  const result = ready(browserHelperWithCore({
    bookmarklet: true,
    pageHelperSubmit: true,
    fetch: () => { calls++; return Promise.resolve(savedResponse()); }
  }));
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  loadPaste(result, text);
  assert.deepStrictEqual(checkedRadios(result), ['2'], 'question 1 key C');

  const event = result.form.submit();
  assert(event.defaultPrevented, 'the bookmarklet must not submit the native form');
  assert(event.immediateStopped, 'the page helper submit handler must be suppressed');
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'the page helper reload marker was cleared');
  await flush();

  assert.strictEqual(calls, 1, 'one POST for the saved question');
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'the queue advanced in place');
  assert(/National consciousness/.test(result.field('question_text').value), 'question 2 is filled');
  assert.deepStrictEqual(checkedRadios(result), ['1'], 'question 2 key B ticked without a reload');
  assert(/Saved question 1 of 50/.test(result.field('ocr_status').innerHTML));
  assert(/dry run OK/.test(result.field('ocr_progress_label').innerHTML), 'the dry run state survives the save');
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'no reload marker is written');
});

test('bookmarklet keeps the question queued when the in-place save is rejected', async () => {
  const result = ready(browserHelperWithCore({
    bookmarklet: true,
    fetch: () => Promise.resolve(failedResponse('Duplicate question.'))
  }));
  loadPaste(result, AUTO_PASTE);
  result.form.submit();
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'the queue does not advance');
  assert(/Question 1 was not saved: Duplicate question/.test(result.field('ocr_status').innerHTML));
  assert(/First autosave question/.test(result.field('question_text').value), 'the same question stays in the form');
});

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

test('keeps the answer key only in ansKey and drops a leftover queue copy', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);
  const queue = JSON.parse(first.storage.get('ocrQueue'));
  assert.strictEqual('key' in queue, false, 'no key copy in the queue');

  queue.key = { 1: 'D', 2: 'A' };
  first.storage.set('ocrQueue', JSON.stringify(queue));
  first.storage.set('ansKey', JSON.stringify({ 1: 'C', 2: 'B', 50: 'C' }));

  const second = browserHelperWithCore(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), ['2'], 'question 1 key C from ansKey');
  assert(/key C/.test(second.field('ocr_status').innerHTML));
  assert(/3 answers/.test(second.field('ocr_status').innerHTML), 'ansKey count used');
  assert.strictEqual('key' in JSON.parse(second.storage.get('ocrQueue')), false, 'leftover queue copy dropped');
});

test('clearing ansKey in another tool leaves no key for the helper', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  const first = browserHelperWithCore();
  loadPaste(first, text);
  first.storage.delete('ansKey');

  const second = browserHelperWithCore(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), [], 'nothing ticked');
  assert(/no key/.test(second.field('ocr_status').innerHTML));
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
  assert(/Checking whether that save went through/.test(result.field('ocr_status').innerHTML));
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'nothing marked saved before the answer arrives');

  resolveFetch(savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'a committed save counts even after the stop');
  assert(/it had already saved/.test(result.field('ocr_status').innerHTML));
  assert(/will not be sent again/.test(result.field('ocr_status').innerHTML));
  assert(!/Question 2 of 2|All 2 questions done/.test(result.field('ocr_status').innerHTML), 'the stop message replaces the generic line');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
});

test('stop autosave leaves the question queued when the stopped save fails', async () => {
  let resolveFetch = null;
  const result = ready(browserHelperWithCore({
    fetch: () => new Promise((resolve) => { resolveFetch = resolve; })
  }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  result.field('ocr_auto').onclick();

  resolveFetch(failedResponse('Duplicate question.'));
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'question stays queued');
  assert(/Autosave stopped at question 1: Duplicate question/.test(result.field('ocr_status').innerHTML));
  assert(/stays queued/.test(result.field('ocr_status').innerHTML));
  assert(!/Question 1 of 2/.test(result.field('ocr_status').innerHTML), 'the stop message replaces the generic line');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
});

test('restarting after a stop reuses the unanswered save instead of posting it twice', async () => {
  let calls = 0;
  let resolveFetch = null;
  const result = ready(browserHelperWithCore({
    fetch: () => { calls++; return new Promise((resolve) => { resolveFetch = resolve; }); }
  }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  result.field('ocr_auto').onclick();
  result.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'no second POST for the same question');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Stop autosave');

  resolveFetch(savedResponse());
  await flush();
  assert.strictEqual(calls, 1);
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'the reused save advances the queue once');

  result.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'the next question posts normally');
  resolveFetch(savedResponse());
  await flush();
  assert(/2 of 2 saved/.test(result.field('ocr_progress_label').innerHTML));
  assert(/Autosave complete: 2 of 2 saved/.test(result.field('ocr_status').innerHTML));
});

test('keeps a complete mixed-case parenthesized A-D set inside the option boundaries', () => {
  const question = helper.parseQuestion({
    num: 4,
    text: 'Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta'
  });
  assert.strictEqual(question.question, 'Which is correct?');
  assert.deepStrictEqual([question.a, question.b, question.c, question.d],
    ['Alpha (a) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  assert.deepStrictEqual(question.flags, []);
});

test('exported parseAll keeps a complete mixed-case parenthesized A-D set', () => {
  const questions = helper.parseAll(
    '1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta');
  assert.strictEqual(questions.length, 1);
  assert.strictEqual(questions[0].question, 'Which is correct?');
  assert.deepStrictEqual([questions[0].a, questions[0].b, questions[0].c, questions[0].d],
    ['Alpha (a) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  assert.deepStrictEqual(questions[0].flags, []);
});

test('keeps an opposite-case selected A repeat inside option A', () => {
  const question = helper.parseQuestion({
    num: 5,
    text: 'Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta'
  });
  assert.strictEqual(question.question, 'Which is correct?');
  assert.deepStrictEqual([question.a, question.b, question.c, question.d],
    ['Alpha (A) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  assert.deepStrictEqual(question.flags, []);
});

test('exported parseAll keeps an opposite-case selected A repeat inside option A', () => {
  const questions = helper.parseAll(
    '1. Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta');
  assert.strictEqual(questions.length, 1);
  assert.strictEqual(questions[0].question, 'Which is correct?');
  assert.deepStrictEqual([questions[0].a, questions[0].b, questions[0].c, questions[0].d],
    ['Alpha (A) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  assert.deepStrictEqual(questions[0].flags, []);
});

test('exported parseAll keeps an opposite-case selected B/C/D repeat inside its option', () => {
  const vectors = [
    ['(A) Alpha (b) Bravo (B) notation stays in option B (C) Charlie (D) Delta',
      'Alpha', 'Bravo (B) notation stays in option B', 'Charlie', 'Delta'],
    ['(A) Alpha (B) Bravo (c) Charlie (C) notation stays in option C (D) Delta',
      'Alpha', 'Bravo', 'Charlie (C) notation stays in option C', 'Delta'],
    ['(A) Alpha (B) Bravo (C) Charlie (d) Delta (D) notation stays in option D',
      'Alpha', 'Bravo', 'Charlie', 'Delta (D) notation stays in option D']
  ];
  for (const vector of vectors) {
    const questions = helper.parseAll('1. Which is correct? ' + vector[0]);
    assert.strictEqual(questions.length, 1);
    assert.strictEqual(questions[0].question, 'Which is correct?');
    assert.deepStrictEqual([questions[0].a, questions[0].b, questions[0].c, questions[0].d],
      vector.slice(1), vector[0]);
    assert.deepStrictEqual(questions[0].flags, [], vector[0] + ' flags');
  }
});

// Real Load path: the browser helper source is executed, the Load button is
// clicked, and the native form/storage/status are read back.
function loadThroughForm(text) {
  const result = loadHelperInBrowser({ parser: require('../src/parser/core.js') });
  assert.strictEqual(result.thrown, null);
  result.document.getElementById('ocr_text').value = text;
  result.document.getElementById('ocr_load').onclick();
  return result;
}

function formState(result) {
  const value = (id) => result.document.getElementById(id).value;
  return {
    question: value('question_text'),
    a: value('option_a'),
    b: value('option_b'),
    c: value('option_c'),
    d: value('option_d'),
    status: result.document.getElementById('ocr_status').innerHTML,
    queue: JSON.parse(result.storage.get('ocrQueue'))
  };
}

function readFixtureInput(name) {
  return fs.readFileSync(path.join(__dirname, '../fixtures/inputs', name + '.txt'), 'utf8');
}

test('Load fills the native form for every supplied region fixture', () => {
  const vectors = [
    { name: 'region-lowercase-stems', count: 5, question: 'lout', d: 'crowd' },
    { name: 'region-orphan-number', count: 3, question: 'lump', d: 'limber' },
    { name: 'region-preamble-paragraphs', count: 2, question: 'Why did nobody notice the teacher?', d: 'She left early.' },
    { name: 'region-footer-instruction', count: 2, question: 'The teacher spoke ______.', d: 'louder' }
  ];
  for (const vector of vectors) {
    const state = formState(loadThroughForm(readFixtureInput(vector.name)));
    assert.strictEqual(state.queue.items.length, vector.count, vector.name + ' queue');
    assert.strictEqual(state.queue.i, 0, vector.name + ' index');
    assert.strictEqual(state.question, vector.question, vector.name + ' question');
    assert.strictEqual(state.d, vector.d, vector.name + ' option D');
    assert(/Question 1 of \d+/.test(state.status), vector.name + ' status');
  }
});

test('Load walks the queue with Skip and fills every item', () => {
  const result = loadThroughForm(readFixtureInput('region-preamble-paragraphs'));
  assert.strictEqual(formState(result).question, 'Why did nobody notice the teacher?');
  result.document.getElementById('ocr_skip').onclick();
  const second = formState(result);
  assert.strictEqual(second.queue.i, 1);
  assert.strictEqual(second.question, 'Where did she place the books?');
  assert.strictEqual(second.d, 'In the bag');
  assert(/Question 2 of 2/.test(second.status));
});

test('Load keeps a mid-stream unnumbered block out of the previous option D', () => {
  const state = formState(loadThroughForm(readFixtureInput('region-midstream-orphan')));
  assert.strictEqual(state.queue.items.length, 3);
  assert.deepStrictEqual(state.queue.items.map((item) => item.num), [24, null, 25]);
  assert.strictEqual(state.question, 'first question here');
  assert.strictEqual(state.d, 'old-d');
  assert(!state.d.includes('lump'), 'option D must not take the orphan block');
});

test('Load removes a mid-stream section heading from the previous option D', () => {
  const text = readFixtureInput('region-midstream-heading');
  const state = formState(loadThroughForm(text));
  assert.strictEqual(state.queue.items.length, 2);
  assert.strictEqual(state.question, 'Which is correct?');
  assert.strictEqual(state.d, 'Four');
  assert(!/SECTION 2|According to Matthew/.test(state.d), 'option D must stay clean');
  assert(!/SECTION 2|According to Matthew/.test(state.question), 'stem must stay clean');
});

test('Load keeps an inline option block clean when a heading and instruction follow', () => {
  const text = [
    '1. Which is correct? A) One B) Two C) Three D) Four',
    'SECTION 2:',
    'According to Matthew, choose the correct answer.',
    '2. Next question here',
    'A. aaa', 'B. bbb', 'C. ccc', 'D. ddd'
  ].join('\n');
  const state = formState(loadThroughForm(text));
  assert.strictEqual(state.queue.items.length, 2);
  assert.strictEqual(state.question, 'Which is correct?');
  assert.strictEqual(state.a, 'One');
  assert.strictEqual(state.d, 'Four');
  assert(!/SECTION 2|According to Matthew/.test(state.question + '\n' + state.d),
    'structural text must stay out of the native fields');
  assert(/SECTION 2:/.test(state.queue.items[1].sectionInstruction), 'heading owns the next stem');
  assert(/According to Matthew/.test(state.queue.items[1].sectionInstruction), 'instruction owns the next stem');
  assert.deepStrictEqual(state.queue.items[0].flags, [], 'clean inline layout needs no advisory flag');
});

test('Load keeps a complete mixed-case parenthesized A-D set in the native form', () => {
  const state = formState(loadThroughForm(
    '1. Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta'));
  assert.strictEqual(state.queue.items.length, 1);
  assert.strictEqual(state.question, 'Which is correct?');
  assert.strictEqual(state.a, 'Alpha (a) notation stays in option A');
  assert.strictEqual(state.b, 'Bravo');
  assert.strictEqual(state.c, 'Charlie');
  assert.strictEqual(state.d, 'Delta');
  assert(!/missing/.test(state.status), 'status must not report a missing option');
  assert.deepStrictEqual(state.queue.items[0].flags, []);
});

test('Load keeps an opposite-case selected A repeat inside option A', () => {
  const state = formState(loadThroughForm(
    '1. Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta'));
  assert.strictEqual(state.queue.items.length, 1);
  assert.strictEqual(state.question, 'Which is correct?');
  assert.strictEqual(state.a, 'Alpha (A) notation stays in option A');
  assert.strictEqual(state.b, 'Bravo');
  assert.strictEqual(state.c, 'Charlie');
  assert.strictEqual(state.d, 'Delta');
  assert(!/missing/.test(state.status), 'status must not report a missing option');
  assert.deepStrictEqual(state.queue.items[0].flags, []);
});

test('Load keeps an opposite-case selected B/C/D repeat inside its option', () => {
  const vectors = [
    ['(A) Alpha (b) Bravo (B) notation stays in option B (C) Charlie (D) Delta',
      'Alpha', 'Bravo (B) notation stays in option B', 'Charlie', 'Delta'],
    ['(A) Alpha (B) Bravo (c) Charlie (C) notation stays in option C (D) Delta',
      'Alpha', 'Bravo', 'Charlie (C) notation stays in option C', 'Delta'],
    ['(A) Alpha (B) Bravo (C) Charlie (d) Delta (D) notation stays in option D',
      'Alpha', 'Bravo', 'Charlie', 'Delta (D) notation stays in option D']
  ];
  for (const vector of vectors) {
    const state = formState(loadThroughForm('1. Which is correct? ' + vector[0]));
    assert.strictEqual(state.queue.items.length, 1);
    assert.strictEqual(state.question, 'Which is correct?');
    assert.deepStrictEqual([state.a, state.b, state.c, state.d], vector.slice(1), vector[0]);
    assert(!/missing/.test(state.status), 'status must not report a missing option');
    assert.deepStrictEqual(state.queue.items[0].flags, [], vector[0] + ' flags');
  }
});

test('Load keeps shared stimulus text out of every saveable field', () => {
  const text = [
    '1. Which option is right?',
    'A. One', 'B. Two', 'C. Three', 'D. Four',
    'Use the information below to answer questions 2 and 3',
    'Total: 5',
    'Balance: 3',
    '2. Which option comes next?',
    'A. Five', 'B. Six', 'C. Seven', 'D. Eight'
  ].join('\n');
  const result = loadThroughForm(text);
  const state = formState(result);
  assert.strictEqual(state.question, 'Which option is right?');
  assert.strictEqual(state.d, 'Four');
  const fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d']
    .map((id) => result.document.getElementById(id).value).join('\n');
  assert(!/Total: 5|Balance: 3|Use the information/.test(fields), 'stimulus lines must not reach the form');
});

test('Load leaves E/F text out of the native four-option form', () => {
  const result = loadThroughForm('1. Which option is right? A. One B. Two C. Three D. Four E. Five F. Six');
  const state = formState(result);
  assert.strictEqual(state.question, 'Which option is right?');
  assert.strictEqual(state.d, 'Four');
  const fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d']
    .map((id) => result.document.getElementById(id).value).join('\n');
  assert(!/Five|Six/.test(fields), 'E/F text must not reach the form');
  assert(state.queue.items[0].flags.includes('E/F options present'), 'E/F stays advisory');
});

test('Load does not preselect a correct-answer radio without a key', () => {
  const result = loadThroughForm(readFixtureInput('region-lowercase-stems'));
  assert.strictEqual(result.document.getElementById('question_text').value, 'lout');
  assert.strictEqual(result.document.getElementById('option_a').value, 'cow');
  assert.deepStrictEqual(result.radios.map((radio) => radio.checked), [false, false, false, false]);
});

test('helper suite executes the real exported parseAll', () => {
  assert.strictEqual(typeof helper.parseAll, 'function');
  const source = fs.readFileSync(path.join(__dirname, 'ocr-helper.js'), 'utf8');
  assert(!/function parseAll\s*\(/.test(source), 'no copied parseAll orchestration');
  const text = readFixtureInput('region-midstream-orphan');
  assert.deepStrictEqual(helper.parseAll(text).map((item) => item.num), [24, null, 25]);
  assert.deepStrictEqual(helper.parseAll(text), require('../src/parser/core.js').parsePaste(text).items);
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
