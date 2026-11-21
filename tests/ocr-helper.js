#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const helper = require('../ocr_helper.js');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
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
  const form = {
    before(node) { inserted.push(node); },
    addEventListener() {},
    querySelectorAll(selector) {
      return selector === '[name=correct_option]' ? radios : [];
    }
  };
  const anchor = options.withForm === false ? null : { form };
  const fields = new Map();
  const storage = new Map();
  const errors = [];
  const document = {
    querySelector(selector) {
      if (selector === 'input[name=action][value=save_question]') return anchor;
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
  return { thrown, inserted, errors, fields, radios, field: (id) => document.getElementById(id) };
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

function browserHelperWithCore() {
  const result = loadHelperInBrowser({ parser: require('../src/parser/core.js') });
  assert.strictEqual(result.thrown, null);
  return result;
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
  assert(/key C/.test(result.field('ocr_status').innerHTML));

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

console.log('PASS: ' + passed + ' ocr-helper vectors');
