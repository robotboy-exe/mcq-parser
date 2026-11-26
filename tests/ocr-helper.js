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
  assert(/2\.5\.6/.test(result.thrown.message));
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

test('deployed helper has no key, dry-run, autosave, or bookmarklet path', () => {
  const source = fs.readFileSync(path.join(__dirname, '../ocr_helper.js'), 'utf8');
  for (const forbidden of ['ansKey', 'ocrAuto', 'autosave', 'dryRunProblems', 'saveInPlace',
    'parsePaste', 'needsImage', 'ocrBatchHistory', '__ocrBookmarklet', 'fetch(']) {
    assert.strictEqual(source.includes(forbidden), false, 'deployed helper must not contain ' + forbidden);
  }

  const result = browserHelperWithCore();
  const panel = result.inserted[0].innerHTML;
  assert.strictEqual(panel.includes('ocr_auto'), false, 'no Start autosave button');
  assert.strictEqual(panel.includes('ocr_progress'), false, 'no autosave progress bar');
  assert.strictEqual(panel.includes('ocr_title'), false, 'no bookmarklet title');

  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
  result.field('ocr_text').value = text;
  result.field('ocr_load').onclick();
  assert(result.field('ocr_status').innerHTML.includes('Question 1 of 50'), 'the queue loads');
  assert.strictEqual(result.field('ocr_status').innerHTML.includes('key'), false, 'no answer key is loaded');
  assert.deepStrictEqual(result.radios.map((radio) => radio.checked), [false, false, false, false]);
  assert.strictEqual(result.storage.has('ansKey'), false, 'no answer-key storage is written');
  assert.strictEqual(result.session.size, 0, 'no paste session state is written');
});

test('deployed helper keeps the reviewed manual submit marker only', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
  const first = browserHelperWithCore();
  first.field('ocr_text').value = text;
  first.field('ocr_load').onclick();
  assert(/Question 1 of 50/.test(first.field('ocr_status').innerHTML));
  first.form.submit();
  assert.deepStrictEqual(Object.keys(Object.fromEntries(first.storage.keys ? first.storage : [])).sort(),
    ['ocrMeta', 'ocrQueue', 'ocrSubmitted']);

  const second = browserHelperWithCore(persisted(first));
  assert(/Question 2 of 50/.test(second.field('ocr_status').innerHTML), 'reload advances the queue');
  assert.strictEqual(second.storage.has('ocrSubmitted'), false, 'submit marker consumed');
  assert(second.field('question_text').value.startsWith('National consciousness'), 'question 2 filled');
  assert.deepStrictEqual(second.radios.map((radio) => radio.checked), [false, false, false, false]);
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

test('Load keeps a spaced dotted initialism in the stem', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-spaced-initialism.txt'), 'utf8');
  const state = formState(loadThroughForm(text));
  assert.strictEqual(state.queue.items.length, 1);
  assert.strictEqual(state.question, 'The quotation was based on C. I. F. Lagos terms');
  assert.strictEqual(state.a, 'free on board');
  assert.strictEqual(state.c, 'carriage paid');
  assert.strictEqual(state.d, 'cash on delivery');
  assert.deepStrictEqual(state.queue.items[0].flags, []);
});

test('Load keeps trailing stem initials out of every option field', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-spaced-initialism-boundaries.txt'), 'utf8');
  const result = loadThroughForm(text);
  const first = formState(result);
  assert.strictEqual(first.queue.items.length, 2);
  assert.strictEqual(first.question, 'Who is John F.');
  assert.strictEqual(first.a, 'Kennedy');
  assert.strictEqual(first.b, 'Adams (option A. wrong)');
  assert.strictEqual(first.d, 'Doe');
  assert.deepStrictEqual(first.queue.items[0].flags, []);
  result.document.getElementById('ocr_skip').onclick();
  const second = formState(result);
  assert.strictEqual(second.question, 'Which refers to C. I. F.');
  assert.strictEqual(second.a, 'cost insurance freight');
  assert.strictEqual(second.b, 'free on board');
  assert.strictEqual(second.d, 'cash on delivery');
  assert.deepStrictEqual(second.queue.items[1].flags, []);
});

test('Load keeps a wrapped option label and a stem initialism out of the fields', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-spaced-initialism-wrapped-boundaries.txt'), 'utf8');
  const result = loadThroughForm(text);
  const first = formState(result);
  assert.strictEqual(first.queue.items.length, 2);
  assert.strictEqual(first.question, 'Who is John F.');
  assert.strictEqual(first.a, 'Kennedy');
  assert.strictEqual(first.b, 'Adams (option A. wrong)');
  assert.strictEqual(first.d, 'Doe');
  assert.deepStrictEqual(first.queue.items[0].flags, []);
  result.document.getElementById('ocr_skip').onclick();
  const second = formState(result);
  assert.strictEqual(second.question, 'This happened in A. D.');
  assert.strictEqual(second.a, '70');
  assert.strictEqual(second.b, '80');
  assert.strictEqual(second.d, '100');
  assert.deepStrictEqual(second.queue.items[1].flags, []);
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

test('Load keeps a marker-adjacent ranged intro out of Q19 option D and marks Q20-Q22', () => {
  const text = readFixtureInput('new-edge-image-intro-marker');
  const result = loadThroughForm(text);
  const items = helper.parseAll(text);
  assert.deepStrictEqual(items.map((item) => item.num), [18, 19, 20, 21, 22, 23]);
  assert.strictEqual(items[1].d, 'trade discount');
  assert.deepStrictEqual(items[1].flags, []);
  assert.deepStrictEqual(items[1].stimuli[0].nums, [20, 21, 22]);
  result.document.getElementById('ocr_skip').onclick();
  const q19 = formState(result);
  assert.strictEqual(q19.question, 'The term 2% / 15 net 30 represents a');
  assert.strictEqual(q19.d, 'trade discount');
  const fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d']
    .map((id) => result.document.getElementById(id).value).join('\n');
  assert(!/Use the diagram|\[image\]/.test(fields), 'marker and intro must not reach the form');
});

test('Load reproduces/guards PC04 BLOCK-1, BLOCK-2, BLOCK-3, BLOCK-4, and BLOCK-5 on Q19', () => {
  const O = 'A. one\nB. two\nC. three\nD. four';
  const H = '19. Which statement is correct?\n' + O;
  const I = 'Use the diagram below to answer questions 20 to 22.';
  const suffix = [20, 21, 22, 23, 24, 25, 26]
    .map(n => n + '. Which of the following is correct here?\n' + O)
    .join('\n\n');
  const full = prefix => prefix + '\n\n' + suffix;

  const s1 = formState(loadThroughForm(full('19. What does the diagram below, used for questions 20 to 22, show?\n[image]\n' + O)));
  assert.strictEqual(s1.question, 'What does the diagram below, used for questions 20 to 22, show?');
  assert.deepStrictEqual([s1.a, s1.b, s1.c, s1.d], ['one', 'two', 'three', 'four']);
  assert.deepStrictEqual(s1.queue.items[0].stimuli[0].nums, []);

  const s2 = formState(loadThroughForm(full('19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nd) "' + I + '"\n[image]')));
  assert.strictEqual(s2.d, '"' + I + '"');
  assert.deepStrictEqual(s2.queue.items[0].stimuli[0].nums, []);

  const s5 = formState(loadThroughForm(full('19. Which of these instructions mentions the diagram? A. one B. two C. three D. "' + I + '"\n[image]')));
  assert.strictEqual(s5.question, 'Which of these instructions mentions the diagram?');
  assert.strictEqual(s5.d, '"' + I + '"');
  assert.deepStrictEqual(s5.queue.items[0].stimuli[0].nums, []);

  for (const tail of ['25 October 2023 is the issue date.', '25-10-2023 is the issue date.']) {
    const nState = formState(loadThroughForm(full(H + '\n\nUse the diagram below to answer questions 20 to 22, ' + tail + '\n[image]')));
    assert.strictEqual(nState.d, 'four');
    assert.deepStrictEqual(nState.queue.items[0].stimuli[0].nums, [20, 21, 22]);
  }

  const a1 = formState(loadThroughForm(full(H + '\n' + I + '\nBalance: 500\nOrdinary explanatory prose stays in this option.\n[image]')));
  assert.strictEqual(a1.d, 'four Ordinary explanatory prose stays in this option.');
  assert.deepStrictEqual(a1.queue.items[0].stimuli[0].nums, []);

  const r1 = formState(loadThroughForm(full(H + '\nAnswer questions 20, 22 and 24.')));
  assert.strictEqual(r1.d, 'four');
  assert.deepStrictEqual(r1.queue.items[0].flags, []);

  const g1 = formState(loadThroughForm(full(H + '\n' + I + '\n[image]]')));
  assert.strictEqual(g1.d, 'four ' + I + ' [image]]');
  assert.strictEqual(g1.queue.items[0].stimuli, undefined);

  const v6 = formState(loadThroughForm(full(H + '\n\nUse the diagram below to answer questions 20 to 22, 25 in cash was deposited.\n[image]')));
  assert.strictEqual(v6.d, 'four');
  assert.deepStrictEqual(v6.queue.items[0].flags, []);
  assert.deepStrictEqual(v6.queue.items[0].stimuli[0].nums, [20, 21, 22]);

  for (const instr of ['Answer all questions in this section.', 'Answer questions 20, 22 and 24.']) {
    const v7 = formState(loadThroughForm(full('19. Which statement is correct?\nA. one\nB. two\nC. three\nD.\n' + instr)));
    assert.strictEqual(v7.d, '');
    assert.deepStrictEqual(v7.queue.items[0].flags, ['option D missing']);
    assert.strictEqual(v7.queue.items[0].stimuli, undefined);
  }

  const s4Unquoted = formState(loadThroughForm(full('19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nD.\n' + I + '\n[image]')));
  assert.strictEqual(s4Unquoted.d, I);
  assert.deepStrictEqual(s4Unquoted.queue.items[0].stimuli[0].nums, []);

  for (const marker of ['[[image: 21]]]', '[[[image: 21]]']) {
    const v8 = formState(loadThroughForm(full(H + '\n' + I + '\n' + marker)));
    assert.strictEqual(v8.d, 'four ' + I + ' ' + marker);
    assert.strictEqual(v8.queue.items[0].stimuli, undefined);
  }

  const v8Inline = formState(loadThroughForm(full(H + ' [[image: 21]]')));
  assert.strictEqual(v8Inline.d, 'four');
  assert.deepStrictEqual(v8Inline.queue.items[0].stimuli[0].nums, [21]);
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
