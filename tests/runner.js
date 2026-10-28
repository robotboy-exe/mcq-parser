#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('../src/parser/parser.js');

const ROOT = path.resolve(__dirname, '..');
const EXPECTED_DIR = path.join(ROOT, 'fixtures/expected');
const DEFAULT_INPUT_DIR = path.join(ROOT, 'fixtures/inputs');
const SUBJECT_SELECT_FILE = path.join(ROOT, 'archive/live-sources/subjects-select-2026-10-23.html');
const ADMIN_HTML_FILE = path.join(ROOT, 'archive/live-sources/admin_questions.html');

const SUBJECT_NAMES = [...fs.readFileSync(SUBJECT_SELECT_FILE, 'utf8')
  .matchAll(/<option[^>]*>([^<]+)<\/option>/gi)]
  .map(m => m[1].trim())
  .filter(name => name && !name.startsWith('--'));

const CATEGORY_SELECT = fs.readFileSync(ADMIN_HTML_FILE, 'utf8')
  .match(/<select[^>]*id="exam_category_id"[\s\S]*?<\/select>/i);
const CATEGORY_NAMES = CATEGORY_SELECT ? [...CATEGORY_SELECT[0]
  .matchAll(/<option[^>]*>([^<]+)<\/option>/gi)]
  .map(m => m[1].trim())
  .filter(name => name && !name.startsWith('--')) : [];

const INPUT_ORIGINS = new Set(['bank', 'anomaly', 'doc', 'synthetic']);
const SALVAGE_FLAG = 'OCR boundaries repaired; verify question and option split';

const OPTION_FIELDS = ['a', 'b', 'c', 'd', 'e', 'f'];

const ASSERTED_KEYS = {
  questions: ['queue_count', 'header', 'questions', 'questions_with_e', 'nums', 'key', 'required_flags', 'forbidden_flags', 'needs_image', 'stimulus_count', 'stimuli'],
  question: ['a', 'b', 'c', 'd', 'e', 'f', 'question', 'question_contains', 'flags', 'forbidden_flags', 'needs_image'],
  key: ['key']
};
const UNASSERTED_KEYS = {
  questions: ['form_behavior_no_key'],
  question: [],
  key: ['ui_notes']
};
const HEADER_KEYS = ['year', 'subject_contains_any', 'category_contains_any'];
const QUESTION_KEYS = ['num', 'index', 'a', 'b', 'c', 'd', 'e', 'f', 'question', 'question_contains', 'flags', 'needs_image'];
const STIMULUS_KEYS = ['order', 'source_num', 'nums', 'text_contains', 'missing'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = canonical(value[key]);
      return out;
    }, {});
  }
  return value;
}

function deepEqual(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function show(value) {
  return JSON.stringify(value);
}

function has(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isInteger(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function makeCheck(name, ok, expected, actual) {
  return { name, ok, expected, actual };
}

function validateExpected(spec) {
  const expected = spec.expected;
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) {
    return 'expected must be an object';
  }

  const allowed = new Set([
    ...(ASSERTED_KEYS[spec.kind] || []),
    ...(UNASSERTED_KEYS[spec.kind] || [])
  ]);
  for (const key of Object.keys(expected)) {
    if (!allowed.has(key)) return `unknown expected key: ${show(key)}`;
  }

  if (has(expected, 'queue_count') &&
      (!isInteger(expected.queue_count) || expected.queue_count < 0)) {
    return 'expected.queue_count must be a non-negative integer';
  }
  if (has(expected, 'question') && typeof expected.question !== 'string') {
    return 'expected.question must be a string';
  }
  for (const field of OPTION_FIELDS) {
    if (has(expected, field) && typeof expected[field] !== 'string') {
      return `expected.${field} must be a string`;
    }
  }
  if (has(expected, 'question_contains') && !isStringArray(expected.question_contains)) {
    return 'expected.question_contains must be an array of strings';
  }
  if (has(expected, 'flags') && expected.flags !== null && !isStringArray(expected.flags)) {
    return 'expected.flags must be an array of strings or null';
  }
  if (has(expected, 'forbidden_flags') && !isStringArray(expected.forbidden_flags)) {
    return 'expected.forbidden_flags must be an array of strings';
  }
  if (has(expected, 'required_flags') && !isStringArray(expected.required_flags)) {
    return 'expected.required_flags must be an array of strings';
  }
  if (has(expected, 'questions_with_e') &&
      (!Array.isArray(expected.questions_with_e) ||
       !expected.questions_with_e.every(isInteger))) {
    return 'expected.questions_with_e must be an array of integers';
  }
  if (has(expected, 'nums') &&
      (!Array.isArray(expected.nums) ||
       !expected.nums.every(n => n === null || isInteger(n)))) {
    return 'expected.nums must be an array of integers or null';
  }
  if (has(expected, 'needs_image') &&
      (!Array.isArray(expected.needs_image) || !expected.needs_image.every(isInteger))) {
    return 'expected.needs_image must be an array of integers';
  }
  if (has(expected, 'stimulus_count') &&
      (!isInteger(expected.stimulus_count) || expected.stimulus_count < 0)) {
    return 'expected.stimulus_count must be a non-negative integer';
  }
  if (has(expected, 'stimuli')) {
    if (!Array.isArray(expected.stimuli)) return 'expected.stimuli must be an array';
    for (let index = 0; index < expected.stimuli.length; index++) {
      const stim = expected.stimuli[index];
      if (!stim || typeof stim !== 'object' || Array.isArray(stim)) {
        return `expected.stimuli[${index}] must be an object`;
      }
      for (const key of Object.keys(stim)) {
        if (!STIMULUS_KEYS.includes(key)) {
          return `unknown expected.stimuli[${index}] key: ${show(key)}`;
        }
      }
      if (has(stim, 'order') && (!isInteger(stim.order) || stim.order < 1)) {
        return `expected.stimuli[${index}].order must be a positive integer`;
      }
      if (has(stim, 'source_num') &&
          stim.source_num !== null && !isInteger(stim.source_num)) {
        return `expected.stimuli[${index}].source_num must be an integer or null`;
      }
      if (has(stim, 'nums') &&
          (!Array.isArray(stim.nums) || !stim.nums.every(isInteger))) {
        return `expected.stimuli[${index}].nums must be an array of integers`;
      }
      if (has(stim, 'missing') &&
          (!Array.isArray(stim.missing) || !stim.missing.every(isInteger))) {
        return `expected.stimuli[${index}].missing must be an array of integers`;
      }
      if (has(stim, 'text_contains') && !isStringArray(stim.text_contains)) {
        return `expected.stimuli[${index}].text_contains must be an array of strings`;
      }
    }
  }
  if (has(expected, 'key')) {
    const key = expected.key;
    if (!key || typeof key !== 'object' || Array.isArray(key)) {
      return 'expected.key must be an object';
    }
    for (const [number, answer] of Object.entries(key)) {
      if (!/^\d+$/.test(number) || typeof answer !== 'string') {
        return 'expected.key must map numeric strings to answer letters';
      }
    }
  }
  if (has(expected, 'form_behavior_no_key') &&
      (!expected.form_behavior_no_key ||
       typeof expected.form_behavior_no_key !== 'object' ||
       Array.isArray(expected.form_behavior_no_key))) {
    return 'expected.form_behavior_no_key must be an object';
  }
  if (has(expected, 'ui_notes') && !isStringArray(expected.ui_notes)) {
    return 'expected.ui_notes must be an array of strings';
  }

  if (has(expected, 'header')) {
    const header = expected.header;
    if (!header || typeof header !== 'object' || Array.isArray(header)) {
      return 'expected.header must be an object';
    }
    if (has(header, 'year') &&
        typeof header.year !== 'number' && typeof header.year !== 'string') {
      return 'expected.header.year must be a number or string';
    }
    if (has(header, 'subject_contains_any') && !isStringArray(header.subject_contains_any)) {
      return 'expected.header.subject_contains_any must be an array of strings';
    }
    if (has(header, 'category_contains_any') && !isStringArray(header.category_contains_any)) {
      return 'expected.header.category_contains_any must be an array of strings';
    }
    for (const key of Object.keys(header)) {
      if (!HEADER_KEYS.includes(key)) return `unknown expected.header key: ${show(key)}`;
    }
  }

  if (has(expected, 'questions')) {
    const questions = expected.questions;
    if (!Array.isArray(questions)) return 'expected.questions must be an array';
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      if (!question || typeof question !== 'object' || Array.isArray(question)) {
        return `expected.questions[${index}] must be an object`;
      }
      for (const key of Object.keys(question)) {
        if (!QUESTION_KEYS.includes(key)) {
          return `unknown expected.questions[${index}] key: ${show(key)}`;
        }
      }
      if (has(question, 'num') && !isInteger(question.num)) {
        return `expected.questions[${index}].num must be an integer`;
      }
      if (has(question, 'index') && (!isInteger(question.index) || question.index < 0)) {
        return `expected.questions[${index}].index must be a non-negative integer`;
      }
      for (const field of OPTION_FIELDS) {
        if (has(question, field) && typeof question[field] !== 'string') {
          return `expected.questions[${index}].${field} must be a string`;
        }
      }
      if (has(question, 'question') && typeof question.question !== 'string') {
        return `expected.questions[${index}].question must be a string`;
      }
      if (has(question, 'question_contains') && !isStringArray(question.question_contains)) {
        return `expected.questions[${index}].question_contains must be an array of strings`;
      }
      if (has(question, 'flags') && question.flags !== null && !isStringArray(question.flags)) {
        return `expected.questions[${index}].flags must be an array of strings or null`;
      }
      if (has(question, 'needs_image') && typeof question.needs_image !== 'boolean') {
        return `expected.questions[${index}].needs_image must be a boolean`;
      }
    }
  }

  return null;
}

function parseFixture(spec, inputText) {
  if (spec.kind === 'questions') {
    const salvage = parser.splitSectionsWithSalvage(inputText);
    const sections = salvage.parts;
    const fixed = parser.FIXES.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      sections.questions
    );
    const items = parser.applyStimulusFlags(
      parser.flagNumberingGaps(parser.splitQuestionItems(fixed).map(parser.parseQuestion))
    );
    if (salvage.salvaged) items.forEach(item => item.flags.push(SALVAGE_FLAG));
    return { items, sections, header: parser.parseHeader(fixed) };
  }

  if (spec.kind === 'question') {
    const num = spec.parse_num === undefined ? null : spec.parse_num;
    return { items: parser.applyStimulusFlags([parser.parseQuestion({ num, text: inputText })]) };
  }

  if (spec.kind === 'key') {
    return { key: parser.parseKey(inputText) };
  }

  throw new Error(`unknown fixture kind: ${show(spec.kind)}`);
}

function findQuestion(items, expected, position) {
  if (Object.prototype.hasOwnProperty.call(expected, 'num')) {
    return items.find(item => item.num === expected.num) ||
      items.find(item => String(item.num) === String(expected.num));
  }
  if (Object.prototype.hasOwnProperty.call(expected, 'index')) {
    return items[expected.index];
  }
  return items[position];
}

function questionLabel(expected, position) {
  if (Object.prototype.hasOwnProperty.call(expected, 'num')) return `Q${expected.num}`;
  if (Object.prototype.hasOwnProperty.call(expected, 'index')) return `Q[${expected.index}]`;
  return `Q[${position}]`;
}

function checkQuestion(question, expected, label, checks) {
  if (!question) {
    checks.push(makeCheck(label, false, 'question present', 'not found'));
    return;
  }

  for (const field of OPTION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(expected, field)) {
      checks.push(makeCheck(
        `${label}.${field}`,
        question[field] === expected[field],
        expected[field],
        question[field]
      ));
    }
  }

  if (Object.prototype.hasOwnProperty.call(expected, 'question')) {
    checks.push(makeCheck(
      `${label}.question`,
      question.question === expected.question,
      expected.question,
      question.question
    ));
  }

  if (Array.isArray(expected.question_contains)) {
    for (const needle of expected.question_contains) {
      checks.push(makeCheck(
        `${label}.question contains ${show(needle)}`,
        typeof question.question === 'string' && question.question.includes(needle),
        true,
        question.question
      ));
    }
  }

  if (Object.prototype.hasOwnProperty.call(expected, 'flags') && expected.flags !== null) {
    checks.push(makeCheck(
      `${label}.flags`,
      deepEqual(question.flags, expected.flags),
      expected.flags,
      question.flags
    ));
  }

  if (Object.prototype.hasOwnProperty.call(expected, 'needs_image')) {
    checks.push(makeCheck(
      `${label}.needs_image`,
      Boolean(question.needsImage) === expected.needs_image,
      expected.needs_image,
      Boolean(question.needsImage)
    ));
  }
}

function flattenStimuli(items) {
  const out = [];
  for (const item of items) {
    if (!item || !Array.isArray(item.stimuli)) continue;
    for (const stim of item.stimuli) out.push(stim);
  }
  return out;
}

function checkStimuli(expected, actual, checks) {
  for (let index = 0; index < expected.length; index++) {
    const want = expected[index];
    const stim = actual[index];
    const label = `stimuli[${index}]`;
    if (!stim) {
      checks.push(makeCheck(label, false, 'stimulus present', 'not found'));
      continue;
    }
    if (has(want, 'order')) {
      checks.push(makeCheck(`${label}.order`, stim.order === want.order, want.order, stim.order));
    }
    if (has(want, 'source_num')) {
      checks.push(makeCheck(`${label}.source_num`, stim.sourceNum === want.source_num, want.source_num, stim.sourceNum));
    }
    if (has(want, 'nums')) {
      checks.push(makeCheck(`${label}.nums`, deepEqual(stim.nums, want.nums), want.nums, stim.nums));
    }
    if (has(want, 'missing')) {
      checks.push(makeCheck(`${label}.missing`, deepEqual(stim.missing, want.missing), want.missing, stim.missing));
    }
    if (Array.isArray(want.text_contains)) {
      for (const needle of want.text_contains) {
        checks.push(makeCheck(
          `${label}.text contains ${show(needle)}`,
          typeof stim.text === 'string' && stim.text.includes(needle),
          true,
          stim.text
        ));
      }
    }
  }
}

function checkHeader(expectedHeader, header, checks) {
  if (Object.prototype.hasOwnProperty.call(expectedHeader, 'year')) {
    const actualYear = header.year === null ? null : String(header.year);
    checks.push(makeCheck(
      'header.year',
      actualYear === String(expectedHeader.year),
      String(expectedHeader.year),
      actualYear
    ));
  }

  if (Array.isArray(expectedHeader.subject_contains_any)) {
    // Use the archived live subject <select> supplied after Phase 7, so the
    // alias is checked against the real option names (including CRS and
    // English (Oral)).
    const index = parser.pickSubjectIndex(header.header, SUBJECT_NAMES);
    const selected = index >= 0 ? SUBJECT_NAMES[index] : null;
    const ok = selected !== null && expectedHeader.subject_contains_any.some(
      name => selected.toUpperCase().includes(name.toUpperCase())
    );
    checks.push(makeCheck(
      'header.subject (live subject list, 2026-10-23)',
      ok,
      expectedHeader.subject_contains_any,
      selected
    ));
  }

  if (Array.isArray(expectedHeader.category_contains_any)) {
    const index = parser.pickCategoryIndex(header.header, CATEGORY_NAMES);
    const selected = index >= 0 ? CATEGORY_NAMES[index] : null;
    const ok = selected !== null && expectedHeader.category_contains_any.some(
      name => selected.toUpperCase().includes(name.toUpperCase())
    );
    checks.push(makeCheck(
      'header.category (live category list, admin_questions.html)',
      ok,
      expectedHeader.category_contains_any,
      selected
    ));
  }
}

function checkForbiddenFlags(items, flags, checks) {
  if (!Array.isArray(flags)) return;
  for (const flag of flags) {
    const offenders = items
      .filter(item => item.flags.includes(flag))
      .map(item => item.num);
    checks.push(makeCheck(
      `forbidden flag absent: ${flag}`,
      offenders.length === 0,
      'absent',
      offenders.length ? offenders : 'absent'
    ));
  }
}

function checkRequiredFlags(items, flags, checks) {
  if (!Array.isArray(flags)) return;
  for (const flag of flags) {
    const missing = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.flags.includes(flag))
      .map(({ item, index }) => item.num === null || item.num === undefined ? `[${index}]` : item.num);
    checks.push(makeCheck(
      `required flag on every item: ${flag}`,
      missing.length === 0,
      'all items',
      missing.length ? missing : 'all items'
    ));
  }
}

function runFixture(spec, inputText) {
  const checks = [];
  const expected = spec.expected || {};

  if (spec.kind === 'questions') {
    const actual = parseFixture(spec, inputText);

    if (Object.prototype.hasOwnProperty.call(expected, 'queue_count')) {
      checks.push(makeCheck(
        'queue_count',
        actual.items.length === expected.queue_count,
        expected.queue_count,
        actual.items.length
      ));
    }

    if (expected.header) checkHeader(expected.header, actual.header, checks);

    if (has(expected, 'nums')) {
      const actualNums = actual.items.map(item => item.num === undefined ? null : item.num);
      checks.push(makeCheck('nums', deepEqual(actualNums, expected.nums), expected.nums, actualNums));
    }

    if (has(expected, 'stimulus_count')) {
      const actualStimuli = flattenStimuli(actual.items);
      checks.push(makeCheck(
        'stimulus_count',
        actualStimuli.length === expected.stimulus_count,
        expected.stimulus_count,
        actualStimuli.length
      ));
    }

    if (has(expected, 'needs_image')) {
      const actualNeeds = actual.items.filter(item => item && item.needsImage).map(item => item.num);
      checks.push(makeCheck(
        'needs_image',
        deepEqual(actualNeeds, expected.needs_image),
        expected.needs_image,
        actualNeeds
      ));
    }

    if (Array.isArray(expected.stimuli)) {
      checkStimuli(expected.stimuli, flattenStimuli(actual.items), checks);
    }

    (expected.questions || []).forEach((expectedQuestion, position) => {
      const label = questionLabel(expectedQuestion, position);
      const question = findQuestion(actual.items, expectedQuestion, position);
      checkQuestion(question, expectedQuestion, label, checks);
    });

    if (Array.isArray(expected.questions_with_e)) {
      for (const num of expected.questions_with_e) {
        const question = actual.items.find(item => item.num === num);
        checks.push(makeCheck(
          `Q${num}.e present`,
          Boolean(question && question.e),
          true,
          question ? question.e : 'question not found'
        ));
      }
    }

    if (Object.prototype.hasOwnProperty.call(expected, 'key')) {
      const actualKey = parser.parseKey(actual.sections.answers);
      checks.push(makeCheck('key', deepEqual(actualKey, expected.key), expected.key, actualKey));
    }

    checkForbiddenFlags(actual.items, expected.forbidden_flags, checks);
    checkRequiredFlags(actual.items, expected.required_flags, checks);
  } else if (spec.kind === 'question') {
    const actual = parseFixture(spec, inputText);
    checkQuestion(actual.items[0], expected, 'Q', checks);
    checkForbiddenFlags(actual.items, expected.forbidden_flags, checks);
  } else if (spec.kind === 'key') {
    const actual = parseFixture(spec, inputText);
    if (Object.prototype.hasOwnProperty.call(expected, 'key')) {
      checks.push(makeCheck('key', deepEqual(actual.key, expected.key), expected.key, actual.key));
    }
  } else {
    throw new Error(`unknown fixture kind: ${show(spec.kind)}`);
  }

  return checks;
}

function run() {
  const files = fs.readdirSync(EXPECTED_DIR)
    .filter(name => name.endsWith('.json'))
    .sort();

  const results = [];
  const referencedInputs = new Set();

  for (const file of files) {
    const specPath = path.join(EXPECTED_DIR, file);
    const id = path.basename(file, '.json');
    let spec;
    try {
      spec = readJson(specPath);
    } catch (error) {
      results.push({ id, status: 'FAIL', detail: `invalid JSON: ${error.message}` });
      continue;
    }

    if (spec.schema_version !== 1) {
      results.push({ id, status: 'FAIL', detail: `unsupported schema_version: ${show(spec.schema_version)}` });
      continue;
    }

    if (!['questions', 'question', 'key'].includes(spec.kind)) {
      results.push({ id, status: 'FAIL', detail: `unknown fixture kind: ${show(spec.kind)}` });
      continue;
    }

    if (has(spec, 'input_file') && typeof spec.input_file !== 'string') {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: 'input_file must be a string' });
      continue;
    }

    const inputPath = spec.input_file
      ? path.resolve(ROOT, spec.input_file)
      : path.join(DEFAULT_INPUT_DIR, `${id}.txt`);

    if (!inputPath.startsWith(ROOT + path.sep)) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: `input_file escapes workspace: ${spec.input_file}` });
      continue;
    }

    // Count the input as referenced even if the spec fails validation; the spec
    // failure is reported separately and the input is not also an orphan.
    referencedInputs.add(inputPath);

    if (spec.status !== 'CONFIRMED' && spec.status !== 'PENDING') {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: `unknown status: ${show(spec.status)}` });
      continue;
    }

    if (!has(spec, 'input_origin')) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: 'missing input_origin' });
      continue;
    }

    if (!INPUT_ORIGINS.has(spec.input_origin)) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: `unknown input_origin: ${show(spec.input_origin)}` });
      continue;
    }

    if (!fs.existsSync(inputPath)) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: `missing input: ${path.relative(ROOT, inputPath)}` });
      continue;
    }

    if (spec.status === 'PENDING') {
      results.push({ id, kind: spec.kind, status: 'PENDING', detail: 'expected output not documented' });
      continue;
    }

    const expectedError = validateExpected(spec);
    if (expectedError) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: expectedError });
      continue;
    }

    let checks;
    try {
      checks = runFixture(spec, fs.readFileSync(inputPath, 'utf8'));
    } catch (error) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: `parser error: ${error.message}` });
      continue;
    }

    if (!checks.length) {
      results.push({ id, kind: spec.kind, status: 'FAIL', detail: 'no asserted fields executed' });
      continue;
    }

    const failures = checks.filter(check => !check.ok);
    results.push({
      id,
      kind: spec.kind,
      status: failures.length ? 'FAIL' : 'PASS',
      checks,
      failures
    });
  }

  const orphanInputs = fs.readdirSync(DEFAULT_INPUT_DIR)
    .filter(name => name.endsWith('.txt'))
    .map(name => path.join(DEFAULT_INPUT_DIR, name))
    .filter(file => !referencedInputs.has(file))
    .sort();

  for (const result of results) {
    if (result.status === 'PASS') {
      console.log(`[PASS] ${result.id} (${result.kind}, ${result.checks.length} checks)`);
    } else if (result.status === 'PENDING') {
      console.log(`[PENDING] ${result.id} (${result.kind || '?'}) - ${result.detail}`);
    } else {
      console.log(`[FAIL] ${result.id} (${result.kind || '?'})`);
      if (result.detail) console.log(`  - ${result.detail}`);
      for (const failure of result.failures || []) {
        console.log(`  - ${failure.name}: expected ${show(failure.expected)}, got ${show(failure.actual)}`);
      }
    }
  }

  for (const file of orphanInputs) {
    console.log(`[ORPHAN] ${path.relative(ROOT, file)} - input has no expected fixture`);
  }

  const count = status => results.filter(result => result.status === status).length;
  console.log('');
  console.log('Summary');
  console.log(`  fixtures: ${results.length}`);
  console.log(`  PASS:     ${count('PASS')}`);
  console.log(`  FAIL:     ${count('FAIL')}`);
  console.log(`  PENDING:  ${count('PENDING')}`);
  if (orphanInputs.length) {
    console.log(`  orphan inputs: ${orphanInputs.length}`);
  }

  process.exitCode = (count('FAIL') || orphanInputs.length) ? 1 : 0;
}

run();
