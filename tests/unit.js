#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('../src/parser/parser.js');
const core = require('../src/parser/core.js');
const comprehension = core.comprehensionEngine();
const cloze = core.clozeEngine();
const uiHarness = require('./ui-harness.js');

const INPUT_DIR = path.resolve(__dirname, '../fixtures/inputs');
const ADMIN_HTML_FILE = path.resolve(__dirname, '../archive/live-sources/admin_questions.html');
const CATEGORY_SELECT = fs.readFileSync(ADMIN_HTML_FILE, 'utf8')
  .match(/<select[^>]*id="exam_category_id"[\s\S]*?<\/select>/i);
const CATEGORY_NAMES = CATEGORY_SELECT ? [...CATEGORY_SELECT[0]
  .matchAll(/<option[^>]*>([^<]+)<\/option>/gi)]
  .map(m => m[1].trim())
  .filter(name => name && !name.startsWith('--')) : [];

let passed = 0;
let failed = 0;
const asyncTests = [];

function report(name, error) {
  if (!error) {
    passed++;
    console.log('[PASS] ' + name);
    return;
  }
  failed++;
  console.log('[FAIL] ' + name);
  const message = String(error && error.message ? error.message : error).split('\n').join('\n  ');
  console.log('  ' + message);
}

function test(name, fn) {
  try {
    fn();
    report(name, null);
  } catch (error) {
    report(name, error);
  }
}

function testAsync(name, fn) {
  asyncTests.push({ name, fn });
}

function eq(actual, expected, label) {
  assert.deepStrictEqual(actual, expected, label || 'values differ');
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label) {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await wait(10);
  }
  throw new Error('timed out waiting for ' + (label || 'condition'));
}

test('parseKey keeps the plain last-wins map', () => {
  eq(parser.parseKey('1.A 2.B 3.C'), { 1: 'A', 2: 'B', 3: 'C' });
});

test('parseKey ignores placeholders', () => {
  eq(parser.parseKey('1. [missing] 2.B'), { 2: 'B' });
});

test('parseKeyDetailed reports differing repeats only', () => {
  eq(parser.parseKeyDetailed('1.A 1.C 2.B'), {
    key: { 1: 'C', 2: 'B' },
    conflicts: [{ num: 1, letters: ['A', 'C'] }]
  });
  eq(parser.parseKeyDetailed('1.A 1.A 2.B'), {
    key: { 1: 'A', 2: 'B' },
    conflicts: []
  });
});

test('pickCategoryIndex maps period-separated exam acronyms', () => {
  const selected = header => {
    const index = parser.pickCategoryIndex(header, CATEGORY_NAMES);
    return index >= 0 ? CATEGORY_NAMES[index] : null;
  };
  eq(selected('CRS SSCE 2023'), 'WASCE / NECO / GCE');
  eq(selected('CRS WASSCE 2023'), 'WASCE / NECO / GCE');
  for (const acronym of ['S.S.C.E.', 'W.A.S.S.C.E.', 'W.A.S.C.E.', 'W.A.E.C.', 'N.E.C.O.', 'G.C.E.']) {
    eq(selected('CRS ' + acronym + ' 2023'), 'WASCE / NECO / GCE', acronym);
  }
  eq(selected('CRS J.A.M.B. 2023'), 'JAMB / UTME');
  eq(selected('CRS U.T.M.E. 2023'), 'JAMB / UTME');
  eq(selected('CRS P.O.S.T. U.T.M.E. 2023'), 'POST UTME');
  eq(selected('GENERAL PRACTICE'), 'General Practice');
  eq(selected('CRS 2023'), null);
});

test('parseQuestion adds the E/F advisory flag', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'Who was the father of faith?\nA. Isaac\nB. Jacob\nC. Moses\nD. David\nE. Abraham'
  });
  eq(q.e, 'Abraham');
  assert(q.flags.includes('E/F options present'), 'missing E/F flag: ' + q.flags.join(', '));
});

test('parseQuestion leaves a four-option question unflagged', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'Who was the father of faith?\nA. Isaac\nB. Jacob\nC. Moses\nD. Abraham'
  });
  eq(q.flags, []);
});

test('parseQuestion keeps Q46 initials inside options B and C', () => {
  const text = fs.readFileSync(path.join(INPUT_DIR, 'new-edge-initials-q46.txt'), 'utf8');
  const q = parser.parseQuestion({ num: 46, text });
  eq(q.a, 'Siaka Stevens');
  eq(q.b, 'K. A. Gbedemah');
  eq(q.c, 'E. F. Small');
  eq(q.d, 'Oladipo Solanke');
  eq(q.flags, []);
});

test('parseQuestion keeps single initials inside option text', () => {
  const text = fs.readFileSync(path.join(INPUT_DIR, 'new-edge-single-initials.txt'), 'utf8');
  const q = parser.parseQuestion({ num: 1, text });
  eq(q.a, 'Bello');
  eq(q.b, 'Dr. A. Adebayo');
  eq(q.c, 'Prof. E. Smith');
  eq(q.d, 'Danjuma');
  eq(q.flags, []);
});

test('parseQuestion keeps spaced dotted initialisms in the stem', () => {
  const cif = parser.parseQuestion({ num: 1, text: fs.readFileSync(path.join(INPUT_DIR, 'spaced-initialism-cif-stem.txt'), 'utf8') });
  eq(cif.question, '1. The quotation was based on C. I. F. Lagos terms');
  eq([cif.a, cif.b, cif.c, cif.d], ['free on board', 'cost insurance freight', 'carriage paid', 'cash on delivery']);
  eq(cif.flags, []);
  const ad = parser.parseQuestion({ num: 1, text: fs.readFileSync(path.join(INPUT_DIR, 'spaced-initialism-ad-stem.txt'), 'utf8') });
  eq(ad.question, '1. The second temple was destroyed in A. D. 70 by');
  eq(ad.a, 'the Persians');
  eq(ad.flags, []);
  const bc = parser.parseQuestion({ num: 1, text: fs.readFileSync(path.join(INPUT_DIR, 'spaced-initialism-bc-stem.txt'), 'utf8') });
  eq(bc.question, '1. Johoiachin surrendered to Babylon in 597 B. C. in order to');
  eq(bc.flags, []);
});

test('parseQuestion keeps a wrapped spaced initialism in the stem', () => {
  const q = parser.parseQuestion({ num: 1, text: fs.readFileSync(path.join(INPUT_DIR, 'spaced-initialism-wrapped.txt'), 'utf8') });
  eq(q.question, '1. The goods were shipped C. I. F. Lagos by the firm');
  eq([q.a, q.b, q.c, q.d], ['one', 'two', 'three', 'four']);
  eq(q.flags, []);
});

test('parseQuestion keeps a spaced initialism inside its option', () => {
  const q = parser.parseQuestion({ num: 1, text: fs.readFileSync(path.join(INPUT_DIR, 'spaced-initialism-inner-option.txt'), 'utf8') });
  eq(q.b, 'C. I. F. Lagos terms');
  eq(q.c, 'gamma terms');
  eq(q.flags, []);
});

test('parseQuestion keeps a real option line after a trailing stem initial', () => {
  const john = parser.parseQuestion({ num: 1, text: '1. Who is John F.\nA. Kennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe' });
  eq(john.question, '1. Who is John F.');
  eq([john.a, john.b, john.c, john.d], ['Kennedy', 'Adams (option A. wrong)', 'Smith', 'Doe']);
  eq(john.flags, []);
  const currency = parser.parseQuestion({ num: 1, text: '1. Currency of U. S.\nA. dollar\nB. pound (not A. dollar)\nC. euro\nD. yen' });
  eq(currency.question, '1. Currency of U. S.');
  eq([currency.a, currency.b, currency.c, currency.d], ['dollar', 'pound (not A. dollar)', 'euro', 'yen']);
  eq(currency.flags, []);
});

test('parseQuestion keeps the next real option line after an option ending in an initialism', () => {
  const q = parser.parseQuestion({ num: 1, text: '1. Pick one\nA. terms C. I. F.\nB. Rich in B. vitamins\nC. other\nD. none' });
  eq([q.a, q.b, q.c, q.d], ['terms C. I. F.', 'Rich in B. vitamins', 'other', 'none']);
  eq(q.flags, []);
});

test('parseQuestion keeps the real option label after a single trailing initial', () => {
  // A single trailing initial such as `Vitamin C.` is not a spaced initialism
  // run (D-111 needs two tokens), so its own label boundary is unchanged; the
  // frozen BLOCK-1 criterion is only that the following real `B.` line is not
  // absorbed and the `B.` inside option B stays in that option.
  const vitamin = parser.parseQuestion({ num: 1, text: '1. Pick one\nA. Vitamin C.\nB. Rich in B. vitamins\nC. other\nD. none' });
  eq([vitamin.b, vitamin.d], ['Rich in B. vitamins C. other', 'none']);
  const john = parser.parseQuestion({ num: 1, text: '1. Pick one\nA. John D.\nB. keep B. inside\nC. other\nD. none' });
  eq(vitamin.a, 'Vitamin');
  eq(john.b, 'keep B. inside');
  eq(john.flags, ['option D missing']);
});

test('parseQuestion keeps a trailing spaced initialism before a real option line', () => {
  const vectors = [
    ['1. Which refers to C. I. F.\nA. cost insurance freight\nB. free on board\nC. carriage paid\nD. cash on delivery',
      '1. Which refers to C. I. F.', ['cost insurance freight', 'free on board', 'carriage paid', 'cash on delivery']],
    ['1. This happened in A. D.\nA. 70\nB. 80\nC. 90\nD. 100',
      '1. This happened in A. D.', ['70', '80', '90', '100']],
    ['1. Babylon fell in 539 B. C.\nA. true\nB. false\nC. maybe\nD. unknown',
      '1. Babylon fell in 539 B. C.', ['true', 'false', 'maybe', 'unknown']],
    ['1. The goods were shipped C. I.\nF.\nA. one\nB. two\nC. three\nD. four',
      '1. The goods were shipped C. I. F.', ['one', 'two', 'three', 'four']],
    ['1. Which refers to C. I. F.\n\nA. cost insurance freight\nB. free on board\nC. carriage paid\nD. cash on delivery',
      '1. Which refers to C. I. F.', ['cost insurance freight', 'free on board', 'carriage paid', 'cash on delivery']],
    ['1. Which refers to C. I. F. A. cost insurance freight B. free on board C. carriage paid D. cash on delivery',
      '1. Which refers to C. I. F.', ['cost insurance freight', 'free on board', 'carriage paid', 'cash on delivery']]
  ];
  for (const [text, question, options] of vectors) {
    const q = parser.parseQuestion({ num: 1, text });
    eq(q.question, question);
    eq([q.a, q.b, q.c, q.d], options);
    eq(q.flags, []);
  }
});

test('parseQuestion keeps a wrapped real option label after a trailing initial', () => {
  const q = parser.parseQuestion({ num: 1, text: '1. Who is John F.\nA.\nKennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe' });
  eq(q.question, '1. Who is John F.');
  eq([q.a, q.b, q.c, q.d], ['Kennedy', 'Adams (option A. wrong)', 'Smith', 'Doe']);
  eq(q.flags, []);
});

test('parseQuestion keeps a real option label ahead of an out-of-order letter mention', () => {
  const john = parser.parseQuestion({ num: 1, text: '1. Who is John F.\nA. Kennedy (see D. note)\nB. Adams (option A. wrong)\nC. Smith\nD. Doe' });
  eq(john.question, '1. Who is John F.');
  eq(john.a, 'Kennedy (see');
  eq(john.flags, []);
  // 331e81f controls: the later out-of-order mention stays text, it does not
  // reorder or rescale the real A-D set.
  eq([john.b, john.c, john.d], ['Adams (option A. wrong)', 'Smith D. Doe', 'note)']);

  const pick = parser.parseQuestion({ num: 1, text: '1. Pick one\nA. value A. B.\nB. two (see D. note) B. inside\nC. three\nD. four' });
  eq([pick.a, pick.b], ['value A. B.', 'two (see']);
  eq(pick.flags, []);

  const vitamin = parser.parseQuestion({ num: 1, text: '1. Pick one\nA. Vitamin C.\nB. Rich in B. vitamins (see D.)\nC. other\nD. none' });
  eq([vitamin.a, vitamin.b], ['Vitamin', 'Rich in B. vitamins (see']);
});

test('parseQuestion restores the trailing real A boundary after a stem initialism', () => {
  const inline = parser.parseQuestion({ num: 1, text: '1. This happened in A. D. A. 70 B. 80 C. 90 D. 100' });
  eq(inline.question, '1. This happened in A. D.');
  eq([inline.a, inline.b, inline.c, inline.d], ['70', '80', '90', '100']);
  eq(inline.flags, []);

  const compare = parser.parseQuestion({ num: 1, text: '1. Compare A. B. with C. I. F. A. first B. second C. third D. fourth' });
  eq(compare.question, '1. Compare A. B. with C. I. F.');
  eq([compare.a, compare.b, compare.c, compare.d], ['first', 'second', 'third', 'fourth']);
  eq(compare.flags, []);

  const wrapped = parser.parseQuestion({ num: 1, text: '1. This happened in A. D.\nA.\n70\nB. 80\nC. 90\nD. 100' });
  eq(wrapped.question, '1. This happened in A. D.');
  eq([wrapped.a, wrapped.b, wrapped.c, wrapped.d], ['70', '80', '90', '100']);
  eq(wrapped.flags, []);

  const mention = parser.parseQuestion({ num: 1, text: '1. This happened in A. D.\nA. 70 (see C.)\nB. 80\nC. 90\nD. 100' });
  eq(mention.question, '1. This happened in A. D.');
  // The out-of-order `(see C.)` mention keeps the same D-91 behavior as the
  // frozen `Kennedy (see` vector: the real A boundary supplies the option and
  // the mention stays option-A text.
  eq(mention.a, '70 (see');
});

test('parseQuestion still reads a blank-line stem initial run as text', () => {
  const q = parser.parseQuestion({ num: 1, text: '1. The sequence is A.\n\nB. followed by\nA. one\nB. two\nC. three\nD. four' });
  eq(q.question, '1. The sequence is A.\n\nB. followed by');
  eq([q.a, q.b, q.c, q.d], ['one', 'two', 'three', 'four']);
  eq(q.flags, []);
});

test('parseQuestion flags a structural line that reaches an option', () => {
  const heading = core.parseQuestion({
    num: 1,
    text: 'Which is correct?\nA. One\nB. Two\nC. Three\nD. Four SECTION 2:'
  });
  eq(heading.flags.includes('option D contains section heading or instruction'), true, 'SECTION line flag');
  const instruction = core.parseQuestion({
    num: 1,
    text: 'Which is correct? A. One B. Two C. Three D. Four According to Matthew, choose the correct answer.'
  });
  eq(instruction.flags.includes('option D contains section heading or instruction'), true, 'instruction line flag');
  const clean = core.parseQuestion({
    num: 1,
    text: 'Which is correct? A. One B. Two C. Three D. Four'
  });
  eq(clean.flags, [], 'no flag for a clean option set');
});

test('parsePaste binds a structural line after a complete inline or vertical A-D set', () => {
  const structural = [
    { line: 'SECTION 2:', kind: 'heading' },
    { line: 'SECTION 2.', kind: 'heading' },
    { line: 'According to Matthew, choose the correct answer.', kind: 'instruction' }
  ];
  for (const layout of ['inline', 'vertical']) {
    for (const item of structural) {
      const labels = layout === 'inline'
        ? ['1. Which is correct? A) One B) Two C) Three D) Four']
        : ['1. Which is correct?', 'A. One', 'B. Two', 'C. Three', 'D. Four'];
      const parsed = core.parsePaste([
        ...labels,
        item.line,
        '2. Next question here',
        'A. aaa',
        'B. bbb',
        'C. ccc',
        'D. ddd'
      ].join('\n'));
      const label = layout + ' / ' + item.line;
      eq(parsed.items.length, 2, label + ' item count');
      eq(parsed.items[0].d, 'Four', label + ' option D');
      eq(parsed.items[0].flags, [], label + ' flags');
      eq(parsed.items[0].sectionInstruction, undefined, label + ' first item stays ungoverned');
      eq(parsed.items[1].sectionInstruction, item.line, label + ' line governs the next stem');
      eq(parsed.regions.map(region => region.kind), [item.kind], label + ' region kind');
      eq(parsed.regions[0].from, 2, label + ' region from');
      eq(parsed.regions[0].to, 2, label + ' region to');
    }
  }
});

test('parsePaste keeps a repeated lowercase (a) inside option A', () => {
  const parsed = core.parsePaste([
    '1. Which is correct? (a) Alpha (a) notation stays in option A',
    '   (b) Bravo (c) Charlie (d) Delta'
  ].join('\n'));
  eq(parsed.items.length, 1);
  eq(parsed.items[0].question, 'Which is correct?');
  eq([parsed.items[0].a, parsed.items[0].b, parsed.items[0].c, parsed.items[0].d],
    ['Alpha (a) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  eq(parsed.items[0].flags, []);
});

test('parseQuestion keeps a complete mixed-case parenthesized A-D set', () => {
  const q = core.parseQuestion({
    num: 1,
    text: 'Which is correct? (a) Alpha (a) notation stays in option A (B) Bravo (c) Charlie (D) Delta'
  });
  eq(q.question, 'Which is correct?');
  eq([q.a, q.b, q.c, q.d],
    ['Alpha (a) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  eq(q.flags, []);
});

test('parseQuestion keeps an opposite-case selected A repeat inside option A', () => {
  const q = core.parseQuestion({
    num: 1,
    text: 'Which is correct? (a) Alpha (A) notation stays in option A (B) Bravo (C) Charlie (D) Delta'
  });
  eq(q.question, 'Which is correct?');
  eq([q.a, q.b, q.c, q.d],
    ['Alpha (A) notation stays in option A', 'Bravo', 'Charlie', 'Delta']);
  eq(q.flags, []);
});

test('parseQuestion accepts an opposite-case selected-A repeat for all 16 case combinations', () => {
  for (let mask = 0; mask < 16; mask++) {
    const labels = [...'abcd'].map((letter, index) =>
      ((mask & (1 << index)) ? letter.toUpperCase() : letter));
    const repeat = labels[0] === labels[0].toLowerCase()
      ? labels[0].toUpperCase()
      : labels[0].toLowerCase();
    const text = 'Which is correct? (' + labels[0] + ') Alpha (' + repeat
      + ') notation stays in option A (' + labels[1] + ') Bravo ('
      + labels[2] + ') Charlie (' + labels[3] + ') Delta';
    const q = core.parseQuestion({ num: 1, text });
    eq([q.question, q.a, q.b, q.c, q.d],
      ['Which is correct?', 'Alpha (' + repeat + ') notation stays in option A', 'Bravo', 'Charlie', 'Delta'],
      'mask ' + mask);
    eq(q.flags, [], 'mask ' + mask + ' flags');
  }
});

test('parseQuestion keeps an opposite-case selected-letter repeat for every selected letter', () => {
  const values = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
  for (let selected = 0; selected < 4; selected++) {
    for (let mask = 0; mask < 16; mask++) {
      const labels = [...'abcd'].map((letter, index) =>
        ((mask & (1 << index)) ? letter.toUpperCase() : letter));
      const repeat = labels[selected] === labels[selected].toLowerCase()
        ? labels[selected].toUpperCase()
        : labels[selected].toLowerCase();
      const parts = values.map((value, index) => {
        const body = index === selected
          ? value + ' (' + repeat + ') notation stays in option ' + 'ABCD'[index]
          : value;
        return '(' + labels[index] + ') ' + body;
      });
      const q = core.parseQuestion({ num: 1, text: 'Which is correct? ' + parts.join(' ') });
      const expected = values.slice();
      expected[selected] += ' (' + repeat + ') notation stays in option ' + 'ABCD'[selected];
      eq([q.question, q.a, q.b, q.c, q.d], ['Which is correct?'].concat(expected),
        'selected ' + selected + ' mask ' + mask);
      eq(q.flags, [], 'selected ' + selected + ' mask ' + mask + ' flags');
    }
  }
});

test('parseQuestion keeps an opposite-case selected B/C/D repeat inside its option', () => {
  const vectors = [
    ['(A) Alpha (b) Bravo (B) notation stays in option B (C) Charlie (D) Delta',
      'Alpha', 'Bravo (B) notation stays in option B', 'Charlie', 'Delta'],
    ['(A) Alpha (B) Bravo (c) Charlie (C) notation stays in option C (D) Delta',
      'Alpha', 'Bravo', 'Charlie (C) notation stays in option C', 'Delta'],
    ['(A) Alpha (B) Bravo (C) Charlie (d) Delta (D) notation stays in option D',
      'Alpha', 'Bravo', 'Charlie', 'Delta (D) notation stays in option D']
  ];
  for (const vector of vectors) {
    const q = core.parseQuestion({ num: 1, text: 'Which is correct? ' + vector[0] });
    eq([q.question, q.a, q.b, q.c, q.d], ['Which is correct?'].concat(vector.slice(1)), vector[0]);
    eq(q.flags, [], vector[0] + ' flags');
  }
});

test('parseQuestion accepts all 16 case combinations of one unspaced parenthesized A-D set', () => {
  for (let mask = 0; mask < 16; mask++) {
    const labels = [...'abcd'].map((letter, index) =>
      ((mask & (1 << index)) ? letter.toUpperCase() : letter));
    const text = 'Which is correct? (' + labels[0] + ') Alpha (' + labels[1] + ') Bravo ('
      + labels[2] + ') Charlie (' + labels[3] + ') Delta';
    const q = core.parseQuestion({ num: 1, text });
    eq([q.question, q.a, q.b, q.c, q.d],
      ['Which is correct?', 'Alpha', 'Bravo', 'Charlie', 'Delta'], 'mask ' + mask);
    eq(q.flags, [], 'mask ' + mask + ' flags');
  }
});

test('parseQuestion still refuses an incomplete lowercase parenthesized set', () => {
  const q = core.parseQuestion({ num: 1, text: 'Which is correct? (a) Alpha (b) Bravo (c) Charlie' });
  eq([q.a, q.b, q.c, q.d], ['', '', '', '']);
  eq(q.flags.includes('option A missing'), true, 'lowercase (a)-(c) is not one option set');
});

test('parseQuestion suppresses the duplicate warning after an inline number', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: '1. First question\nA. one B. two C. three D. four 2. Second question\nA. five B. six C. seven D. eight'
  });
  eq(q.a, 'one');
  eq(q.b, 'two');
  eq(q.c, 'three');
  assert(!q.flags.includes('a letter appears twice (merged questions?)'), 'duplicate warning should be suppressed: ' + q.flags.join(', '));
});

test('parseStimulusRange accepts ranges and lists', () => {
  eq(parser.parseStimulusRange('questions 14 and 15'), [14, 15]);
  eq(parser.parseStimulusRange('14-16'), [14, 15, 16]);
  eq(parser.parseStimulusRange('14, 16'), [14, 16]);
  eq(parser.parseStimulusRange('Q14-Q15'), [14, 15]);
  eq(parser.parseStimulusRange('14 & 15'), [14, 15]);
  eq(parser.parseStimulusRange('14 to 16'), [14, 15, 16]);
  eq(parser.parseStimulusRange(''), []);
  eq(parser.parseStimulusRange('0'), []);
});

test('parseQuestion removes a marker block and keeps the options', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'First question\n[image]\nOpening stock: 10\nPurchases: 20\nA. one\nB. two\nC. three\nD. four'
  });
  eq(q.question, 'First question');
  eq(q.a, 'one');
  eq(q.d, 'four');
  eq(q.stimuli.length, 1);
  eq(q.stimuli[0].source, 'marker');
  eq(q.stimuli[0].nums, []);
  eq(q.stimuli[0].text, 'Opening stock: 10\nPurchases: 20');
});

test('parseQuestion keeps the paragraph around a far marker', () => {
  const q = parser.parseQuestion({
    num: 8,
    text: 'Eighth question\n[image: 8]\nSome explanatory paragraph that stays.\nOpening stock: 50\nPurchases: 60\nA. one\nB. two\nC. three\nD. four'
  });
  eq(q.question, 'Eighth question Some explanatory paragraph that stays.');
  eq(q.stimuli[0].nums, [8]);
  eq(q.stimuli[0].text, 'Opening stock: 50\nPurchases: 60');
});

test('parseQuestion does not treat [missing text] as an image marker', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'First question [missing text]\nA. one\nB. two\nC. three\nD. four'
  });
  eq(q.question.includes('[missing text]'), true);
  eq(q.stimuli, undefined);
});

test('parseQuestion removes an inline double-bracket marker only', () => {
  const q = parser.parseQuestion({
    num: 5,
    text: 'Fifth question [[image]] about something\nA. one\nB. two\nC. three\nD. four'
  });
  eq(q.question, 'Fifth question about something');
  eq(q.stimuli.length, 1);
  eq(q.stimuli[0].nums, []);
  eq(q.stimuli[0].text, '');
});

test('parseQuestion removes the standard intro table without a marker', () => {
  const q = parser.parseQuestion({
    num: 13,
    text: 'Stem\nA. one\nB. two\nC. three\nD. four\nUse the information below to answer questions 14 and 15\nOpening stock: 22,000.00\nPurchases: 20,000.00'
  });
  eq(q.question, 'Stem');
  eq(q.d, 'four');
  eq(q.stimuli.length, 1);
  eq(q.stimuli[0].source, 'intro');
  eq(q.stimuli[0].nums, [14, 15]);
  eq(q.stimuli[0].text.includes('Opening stock: 22,000.00'), true);
});

test('parseQuestion preserves real paragraphs around a removed marker block', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'First paragraph has enough words.\n\n[[image: 2]]\nUse the table below to answer questions 2 and 3\nSales: 10 20 30\n\nSecond paragraph also has enough words.\nA. One\nB. Two\nC. Three\nD. Four'
  });
  eq(q.question, 'First paragraph has enough words.\n\nSecond paragraph also has enough words.');
  eq(q.stimuli[0].nums, [2]);
});

test('parseQuestion does not invent a paragraph when removing an inline intro block', () => {
  const q = parser.parseQuestion({
    num: 1,
    text: 'First line has enough words.\nUse the table below to answer questions 2 and 3\nSales: 10 20 30\nContinuation line has enough words.\nA. One\nB. Two\nC. Three\nD. Four'
  });
  eq(q.question, 'First line has enough words. Continuation line has enough words.');
  eq(q.stimuli[0].nums, [2, 3]);
});

test('splitSections removes a 19xx answer title without extending option D', () => {
  const parsed = parser.parsePaste([
    'CRS 1994 JAMB',
    '1. Which statement is correct today?',
    'A. One',
    'B. Two',
    'C. Three',
    'D. Four',
    '',
    'WASSCE C.R.K. 1994',
    'OBJECTIVE ANSWERS',
    '1.A'
  ].join('\n'));
  eq(parsed.header.year, '1994');
  eq(parsed.sections.boundary, 'WASSCE C.R.K. 1994\nOBJECTIVE ANSWERS');
  eq(parsed.items[0].d, 'Four');
  eq(parsed.key, { 1: 'A' });
});

test('parsePaste returns the comprehension contract for a recognized passage', () => {
  const parsed = parser.parsePaste(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-comprehension-passage3.txt'), 'utf8'));
  eq(parsed.version, core.version, 'parser version');
  eq(parsed.contexts.length, 1, 'one context');
  eq(parsed.contexts[0].title, 'PASSAGE III', 'context title');
  eq(parsed.contexts[0].targets.join(','), '11,12,13,14,15', 'context targets');
  eq(parsed.contexts[0].expectedCount, 5, 'expected member count');
  eq(parsed.contexts[0].linkedCount, 5, 'linked member count');
  eq(parsed.items[0].a, 'best used in politics', 'transcribed option A');
  eq(parsed.items[0].contextRef, 'ctx-1', 'linked reference');
  eq(parsed.items[0].contextPosition, '1', 'ordered position');
  eq(parsed.key, null, 'no key');
  eq(parsed.keyConflicts.length, 0, 'no key conflicts');
  eq(parsed.sectionEvidence.how, 'none', 'section evidence keeps the split mode');
  eq(parsed.sectionEvidence.contexts.length, 1, 'section evidence records the context');
  eq(parsed.warnings.length, 0, 'no warnings');
});

test('parsePaste keeps the legacy shape when no passage is recognized', () => {
  const parsed = parser.parsePaste([
    'CRS 1994 JAMB',
    '1. Which statement is correct today?',
    'A. One',
    'B. Two',
    'C. Three',
    'D. Four'
  ].join('\n'));
  eq(parsed.contexts.length, 0, 'no contexts');
  eq(parsed.warnings.length, 0, 'no warnings');
  eq(parsed.sectionEvidence.contexts.length, 0, 'no context evidence');
  eq(parsed.items[0].a, 'One', 'options unchanged');
  eq(parsed.items[0].contextRef, undefined, 'no context reference');
});

test('parsePaste reads an instruction range as the expected member count', () => {
  const parsed = parser.parsePaste([
    'Read the following passage and answer questions 41 to 42.',
    'PASSAGE VII',
    'Mango trees lose their leaves in the dry season.',
    '',
    '41. Mango trees lose their leaves in',
    '(a) the rainy season',
    '(b) the dry season',
    '(c) winter',
    '(d) autumn',
    '',
    '42. The passage is about',
    '(a) mango trees',
    '(b) rivers',
    '(c) rocks',
    '(d) roads'
  ].join('\n'));
  eq(parsed.contexts.length, 1, 'one context');
  eq(parsed.contexts[0].expectedCount, 2, 'instruction count');
  eq(parsed.contexts[0].evidence.source, 'instruction', 'instruction evidence');
  eq(parsed.warnings.length, 0, 'no warnings');
});

test('parsePaste warns about a key conflict and a missing key entry', () => {
  const parsed = parser.parsePaste([
    'PASSAGE IX',
    'Clean water matters for health.',
    '',
    '31. Clean water matters for',
    '(a) health',
    '(b) wealth',
    '(c) speed',
    '(d) height',
    '',
    '32. Water should be',
    '(a) wasted',
    '(b) stored',
    '(c) boiled',
    '(d) sold',
    '',
    'ANSWERS',
    '31. A',
    '31. C'
  ].join('\n'));
  eq(parsed.contexts.length, 1, 'context survives the key section');
  eq(parsed.keyConflicts.length, 1, 'one key conflict');
  eq(parsed.keyConflicts[0].num, 31, 'conflict number');
  assert(parsed.warnings.some(w => w.includes('more than one letter')), 'conflict warning');
  assert(parsed.warnings.some(w => w.includes('no answer-key entry for question 32')), 'missing key warning');
});

test('detect builds one cloze context and ten linked rows from the supplied table', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-section6.txt'), 'utf8'));
  eq(detected.contexts.length, 1, 'one cloze context');
  eq(detected.contexts[0].type, 'cloze', 'cloze type');
  eq(detected.contexts[0].title, 'SECTION 6', 'section title');
  eq(detected.contexts[0].targets.join(','), '71,72,73,74,75,76,77,78,79,80', 'targets');
  eq(detected.contexts[0].text.indexOf('.........'), -1, 'no dotted run survives');
  eq((detected.contexts[0].text.match(/\[\[gap:\d+\]\]/g) || []).length, 10, 'ten gap tokens');
  eq(detected.contexts[0].text.split('\n\n').length, 2, 'two paragraphs');
  eq(detected.items.length, 10, 'ten synthesized items');
  eq(detected.items[0].question, 'Choose the option that best fills gap 71.', 'generated stem');
  eq([detected.items[7].a, detected.items[7].b, detected.items[7].c, detected.items[7].d],
    ['a vow', 'an oath', 'an allegiance', 'a pledge'], 'wrapped multiword row');
  eq(detected.warnings.length, 0, 'no warnings');
});

test('detect accepts a row with corroborated one-character column drift', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-left-drift.txt'), 'utf8'));
  eq(detected.contexts.length, 1, 'one cloze context');
  eq(detected.items.length, 10, 'ten synthesized items');
  const gap75 = detected.items.find(item => item.num === 75);
  eq([gap75.a, gap75.b, gap75.c, gap75.d],
    ['confession', 'suggestion', 'permission', 'complaint'], 'left-drift row cells');
  eq(detected.warnings.length, 0, 'no warnings');
});

test('detect refuses a table with a missing option column', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-missing-column.txt'), 'utf8'));
  eq(detected.contexts.length, 0, 'no context');
  eq(detected.items.length, 0, 'no synthesized items');
  assert(detected.warnings.some(w => w.includes('missing the D option for gap 32')), 'names the missing column');
});

test('detect refuses rows whose numbers do not match the passage gaps', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-mismatch.txt'), 'utf8'));
  eq(detected.contexts.length, 0, 'no context');
  assert(detected.warnings.some(w => w.includes('does not match the passage gaps 41-42')), 'mismatch warning');
});

test('detect leaves a table-like block alone without numbered gaps', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-not-cloze.txt'), 'utf8'));
  eq(detected.contexts.length, 0, 'no context');
  assert(detected.warnings.some(w => w.includes('has no numbered gaps in the passage')), 'gap-free warning');
});

test('detect refuses an overlong option before any native save', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-long-cell.txt'), 'utf8'));
  eq(detected.contexts.length, 0, 'no context');
  assert(detected.warnings.some(w => w.includes('longer than 500 characters at gap 51')), 'limit warning');
});

test('detect reads tab-separated rows by expanded column starts', () => {
  const detected = cloze.detect(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-tabs.txt'), 'utf8'));
  eq(detected.contexts.length, 1, 'one context');
  eq(detected.items.map(item => item.d).join(','), 'flood,lose,pay', 'column D per row');
  eq(detected.warnings.length, 0, 'no warnings');
});

test('a cloze row number colliding with an ordinary question refuses that group', () => {
  const instruction = 'In the following passage the numbered gaps indicate missing words. '
    + 'Four options are given in columns lettered A to D.';
  const parsed = parser.parsePaste([
    '71. Standalone question about something?',
    '',
    instruction,
    '',
    'Workers were ......... 71. .......... last month and were ....... 72. ......... in court.',
    '',
    'A    B    C    D',
    '71. aa    bb    cc    dd',
    '72. ee    ff    gg    hh'
  ].join('\n'));
  eq(parsed.contexts.length, 0, 'no cloze context');
  eq(parsed.items.some(item => item.contextRef), false, 'no item linked to a cloze context');
  assert(parsed.warnings.some(w => w.includes('numbered gap rows 71') && w.includes('collide')), 'names the collision');
  assert(parsed.items.some(item => item.num === 71), 'the ordinary question survives');
  assert(parsed.items.some(item => item.num === 72), 'the refused rows stay in the paste');
});

test('a colliding cloze group leaves a second cloze group intact', () => {
  const first = 'In the following passage the numbered gaps indicate missing words. '
    + 'Four options are given in columns lettered A to D.';
  const parsed = parser.parsePaste([
    '71. Standalone question about something?',
    '',
    first,
    '',
    'Workers were ......... 71. .......... last month and were ....... 72. ......... in court.',
    '',
    'A    B    C    D',
    '71. aa    bb    cc    dd',
    '72. ee    ff    gg    hh',
    '',
    'In the following passage the numbered gaps indicate missing words. '
      + 'Four options are given in columns lettered A to D.',
    '',
    'Prices rose ......... 81. .......... and fell ....... 82. ......... again.',
    '',
    'A    B    C    D',
    '81. ii    jj    kk    ll',
    '82. mm    nn    oo    pp'
  ].join('\n'));
  eq(parsed.contexts.length, 1, 'only the colliding group is refused');
  eq(parsed.contexts[0].targets.join(','), '81,82', 'second group targets');
  eq(parsed.contexts[0].linkedCount, 2, 'second group fully linked');
  eq(parsed.items.filter(item => item.contextRef).map(item => item.num).join(','), '81,82', 'linked items');
  assert(parsed.warnings.some(w => w.includes('numbered gap rows 71')), 'collision warning kept');
});

test('two cloze groups that share numbering keep the first and drop the later', () => {
  const instruction = 'In the following passage the numbered gaps indicate missing words. '
    + 'Four options are given in columns lettered A to D.';
  const parsed = parser.parsePaste([
    'SECTION A: CLOZE PASSAGE',
    '',
    instruction,
    '',
    'The head teacher ......... 71. .......... and the students ....... 72. ......... the hall.',
    '',
    'A    B    C    D',
    '71. went    goes    gone    going',
    '72. enter    enters    entered    entering',
    '',
    'SECTION B: CLOZE PASSAGE',
    '',
    instruction,
    '',
    'The nurse ......... 71. .......... and the doctor ....... 72. ......... the ward.',
    '',
    'A    B    C    D',
    '71. wrote    writes    written    writing',
    '72. visit    visits    visited    visiting'
  ].join('\n'));
  eq(parsed.contexts.length, 1, 'only the first group survives');
  eq(parsed.contexts[0].targets.join(','), '71,72', 'kept group targets');
  eq(parsed.items.filter(item => item.contextRef).map(item => item.num).join(','), '71,72', 'kept members');
  eq(parsed.items.length, 2, 'dropped rows are not ordinary questions');
  eq(parsed.items[0].a, 'went', 'first group options kept');
  assert(parsed.warnings.some(w => w.includes('duplicate cloze group for gaps 71-72')
    && w.includes('kept the first occurrence')), 'names the dropped group');
});

test('two cloze groups with distinct numbering both survive', () => {
  const instruction = 'In the following passage the numbered gaps indicate missing words. '
    + 'Four options are given in columns lettered A to D.';
  const parsed = parser.parsePaste([
    'SECTION A: CLOZE PASSAGE',
    '',
    instruction,
    '',
    'The head teacher ......... 71. .......... and the students ....... 72. ......... the hall.',
    '',
    'A    B    C    D',
    '71. went    goes    gone    going',
    '72. enter    enters    entered    entering',
    '',
    'SECTION B: CLOZE PASSAGE',
    '',
    instruction,
    '',
    'Prices rose ......... 81. .......... and fell ....... 82. ......... again.',
    '',
    'A    B    C    D',
    '81. up    down    high    low',
    '82. fast    slow    quick    late'
  ].join('\n'));
  eq(parsed.contexts.length, 2, 'both groups survive');
  eq(parsed.contexts.map(context => context.targets.join(',')).join('|'), '71,72|81,82', 'targets');
  eq(parsed.items.filter(item => item.contextRef).map(item => item.num).join(','), '71,72,81,82', 'all members');
  eq(parsed.warnings.length, 0, 'no warnings');
});

test('parsePaste keeps a comprehension and a cloze context apart in one paste', () => {
  const parsed = parser.parsePaste(fs.readFileSync(
    path.join(INPUT_DIR, 'sample-cloze-mixed.txt'), 'utf8'));
  eq(parsed.contexts.map(context => context.type).join(','), 'comprehension,cloze', 'context order');
  eq(parsed.contexts[1].targets.join(','), '81,82', 'cloze targets');
  eq(parsed.items.map(item => item.num).join(','), '11,12,81,82', 'paste order');
  eq(parsed.items[2].contextRef, 'ctx-2', 'second context reference');
  eq(parsed.warnings.length, 0, 'no warnings');
});

test('splitOptions accepts only one complete ordered parenthesized set', () => {
  eq(comprehension.splitOptions('Stem (a) one (b) two (c) three (d) four').question, 'Stem', 'stem');
  eq(comprehension.splitOptions('Stem (a) one (b) two (c) three (d) four').options[3], 'four', 'last option');
  eq(comprehension.splitOptions('Stem (a) one (b) two (c) three'), null, 'incomplete set');
  eq(comprehension.splitOptions('Stem (b) two (a) one (c) three (d) four'), null, 'out of order');
  eq(comprehension.splitOptions('Stem a) one b) two c) three d) four'), null, 'bare labels');
  eq(comprehension.splitOptions('Stem (a) one (a) two (c) three (d) four'), null, 'duplicate label');
});

test('detect warns instead of inventing a context for one candidate', () => {
  const detected = comprehension.detect([
    'PASSAGE IV',
    'This note has one question.',
    '',
    '6. Which statement is true?',
    '(a) one',
    '(b) two',
    '(c) three',
    '(d) four'
  ].join('\n'));
  eq(detected.contexts.length, 0, 'no context');
  eq(detected.warnings.length, 1, 'one warning');
  assert(detected.warnings[0].includes('fewer than two'), 'warning text');
  assert(detected.text.includes('PASSAGE IV'), 'fallback text is unchanged');
});

test('year inference accepts 1900 and 2099 and rejects 1899 and 2100', () => {
  const parseYear = year => parser.parsePaste([
    'CRS ' + year + ' JAMB',
    '1. Which statement is correct today?',
    'A. One',
    'B. Two',
    'C. Three',
    'D. Four'
  ].join('\n')).header.year;
  eq(parseYear('1900'), '1900');
  eq(parseYear('2099'), '2099');
  eq(parseYear('1899'), null);
  eq(parseYear('2100'), null);
});

test('answer-title removal uses the same 1900-2099 boundaries', () => {
  const boundary = year => parser.splitSections([
    'CRS ' + year + ' JAMB',
    '1. Which statement is correct today?',
    'A. One',
    'B. Two',
    'C. Three',
    'D. Four',
    '',
    'WASSCE C.R.K. ' + year,
    'OBJECTIVE ANSWERS',
    '1.A'
  ].join('\n')).boundary;
  eq(boundary('1900'), 'WASSCE C.R.K. 1900\nOBJECTIVE ANSWERS');
  eq(boundary('2099'), 'WASSCE C.R.K. 2099\nOBJECTIVE ANSWERS');
  eq(boundary('1899'), 'OBJECTIVE ANSWERS');
  eq(boundary('2100'), 'OBJECTIVE ANSWERS');
});

test('applyStimulusFlags orders stimuli and records missing targets', () => {
  const items = [
    { num: 13, stimuli: [{ sourceNum: 13, nums: [14, 16], marker: '[image]', text: '', source: 'marker' }] },
    { num: 14 },
    { num: 15, stimuli: [{ sourceNum: 15, nums: [15], marker: '[image]', text: '', source: 'marker' }] }
  ];
  parser.applyStimulusFlags(items);
  eq(items[0].stimuli[0].id, 'stim-1');
  eq(items[0].stimuli[0].order, 1);
  eq(items[1].needsImage, true);
  eq(items[0].stimuli[0].missing, [16]);
  eq(items[2].stimuli[0].id, 'stim-2');
  eq(items[2].needsImage, true);
  delete items[0].stimuli;
  delete items[2].stimuli;
  parser.applyStimulusFlags(items);
  eq(items[1].needsImage, undefined);
});

test('byteLength counts UTF-8 bytes', () => {
  eq(parser.byteLength('abc'), 3);
  eq(parser.byteLength('é'), 2);
  eq(parser.byteLength('😀'), 4);
  eq(parser.byteLength('a'.repeat(500)), 500);
  eq(parser.byteLength('é'.repeat(250)), 500);
  eq(parser.byteLength('😀'.repeat(125)), 500);
  eq(parser.byteLength(null), 0);
});

test('optionLetters lists non-empty letters in order', () => {
  eq(parser.optionLetters({ a: 'x', b: '', c: 'y', d: 'z', e: '', f: '' }), ['A', 'C', 'D']);
  eq(parser.optionLetters({}), []);
});

test('isConsecutiveQueue accepts only consecutive integer numbers', () => {
  eq(parser.isConsecutiveQueue([{ num: 1 }, { num: 2 }, { num: 3 }]), true);
  eq(parser.isConsecutiveQueue([{ num: 1 }, { num: 3 }]), false);
  eq(parser.isConsecutiveQueue([{ num: 1 }, { num: 1 }]), false);
  eq(parser.isConsecutiveQueue([{ num: 2 }, { num: 1 }]), false);
  eq(parser.isConsecutiveQueue([{ num: 1 }, null]), false);
  eq(parser.isConsecutiveQueue([{ num: 1 }, { num: null }]), false);
  eq(parser.isConsecutiveQueue([{ num: 1 }, { num: 2.5 }]), false);
  eq(parser.isConsecutiveQueue([]), false);
});

test('keyCoversQueue requires exactly the queue numbers and A-F letters', () => {
  const items = [{ num: 1 }, { num: 2 }];
  eq(parser.keyCoversQueue({ 1: 'A', 2: 'B' }, items), true);
  eq(parser.keyCoversQueue({ 1: 'E' }, [{ num: 1 }]), true);
  eq(parser.keyCoversQueue({ 1: 'A' }, items), false);
  eq(parser.keyCoversQueue({ 1: 'A', 2: 'B', 3: 'C' }, items), false);
  eq(parser.keyCoversQueue({ 1: 'a', 2: 'B' }, items), false);
  eq(parser.keyCoversQueue({}, []), false);
});

test('appendSavedLog keeps the newest entries up to the cap', () => {
  const log = [{ id: 1 }, { id: 2 }];
  eq(parser.appendSavedLog(log, { id: 3 }, 3), [{ id: 1 }, { id: 2 }, { id: 3 }]);
  eq(parser.appendSavedLog(log, { id: 3 }, 2), [{ id: 2 }, { id: 3 }]);
  eq(parser.appendSavedLog(log, { id: 3 }, 1), [{ id: 3 }]);
});

test('mergeSavedLog combines interleaved tabs by id and keeps every mode', () => {
  const stored = [{ id: 1, inactive: true, mode: 'draft' }, { id: 2, inactive: false, mode: 'active' }];
  const current = [{ id: 2, inactive: false, mode: 'active' }, { id: 3, inactive: true, mode: 'draft' }];
  const merged = parser.mergeSavedLog(stored, current, { id: 4, inactive: false, mode: 'active' }, 200);
  eq(merged.map(entry => entry.id), [1, 2, 3, 4]);
  eq(merged.map(entry => entry.mode), ['draft', 'active', 'draft', 'active']);
  const kept = parser.mergeSavedLog([{ id: 5, inactive: false, mode: 'active' }], [{ id: 5, inactive: false }], null, 200);
  eq(kept[0].mode, 'active');
});

test('mergeSavedLog keeps the newest 200 entries after a cross-tab append', () => {
  const stored = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, mode: 'draft' }));
  const merged = parser.mergeSavedLog(stored, [], { id: 201, mode: 'active' }, 200);
  eq(merged.length, 200);
  eq(merged[0].id, 2);
  eq(merged[199].id, 201);
});

test('commitSave reports a log read, log write, or queue advance fault', () => {
  const readFail = parser.commitSave({
    read: () => { throw new Error('read'); },
    current: [{ id: 1 }],
    entry: { id: 2 },
    write: () => {}
  });
  eq(readFail.ok, false);
  eq(readFail.stage, 'log');
  eq(readFail.log, [{ id: 1 }]);

  const writeFail = parser.commitSave({
    read: () => [],
    current: [],
    entry: { id: 9, mode: 'draft' },
    write: () => { throw new Error('write'); }
  });
  eq(writeFail.ok, false);
  eq(writeFail.stage, 'log');
  eq(writeFail.log.map(entry => entry.id), [9]);

  const advanceFail = parser.commitSave({
    read: () => [],
    current: [],
    entry: { id: 10, mode: 'draft' },
    write: () => {},
    advance: () => { throw new Error('queue'); }
  });
  eq(advanceFail.ok, false);
  eq(advanceFail.stage, 'queue');
  eq(advanceFail.log.map(entry => entry.id), [10]);
});

test('commitSave merges storage before appending the new entry', () => {
  let written = null;
  const result = parser.commitSave({
    read: () => [{ id: 1, mode: 'draft' }],
    current: [{ id: 1, mode: 'draft' }],
    entry: { id: 2, mode: 'active' },
    cap: 200,
    write: log => { written = log; }
  });
  eq(result.ok, true);
  eq(written.map(entry => entry.id), [1, 2]);
  eq(written.map(entry => entry.mode), ['draft', 'active']);
});

test('heartbeatTick stops and releases the lock when the write throws', () => {
  let released = 0;
  const failed = parser.heartbeatTick({
    lock: null,
    tabId: 't1',
    now: 1000,
    write: () => { throw new Error('storage'); },
    release: () => { released++; }
  });
  eq(failed, { action: 'stop-release', stop: true, release: true });
  eq(released, 1);
  let written = null;
  const ok = parser.heartbeatTick({
    lock: null,
    tabId: 't1',
    now: 1000,
    write: lock => { written = lock; }
  });
  eq(ok, { action: 'continue', stop: false, release: false });
  eq(written, { tabId: 't1', at: 1000 });
  const other = parser.heartbeatTick({
    lock: { tabId: 't2', at: 900 },
    tabId: 't1',
    now: 1000,
    write: () => { throw new Error('should not write'); }
  });
  eq(other, { action: 'stop', stop: true, release: false });
  const stale = parser.heartbeatTick({
    lock: { tabId: 't2', at: 1000 },
    tabId: 't1',
    now: 16000,
    write: () => {}
  });
  eq(stale.action, 'continue');
});

test('maxSavedId and savedForBatch filter the log', () => {
  const log = [{ id: '10', batchId: 'b1' }, { id: 12, batchId: 'b2' }, { id: null, batchId: 'b1' }];
  eq(parser.maxSavedId(log), 12);
  eq(parser.maxSavedId([]), 0);
  eq(parser.savedForBatch(log, 'b1'), [{ id: '10', batchId: 'b1' }, { id: null, batchId: 'b1' }]);
  eq(parser.savedForBatch(log, null), []);
});

test('deriveLiveState reports idle, incomplete and complete batches', () => {
  const queue = { items: [{ num: 1 }, { num: 2 }, { num: 3 }], i: 1, batchId: 'b1' };
  const log = [{ id: 10, batchId: 'b1' }];
  eq(parser.deriveLiveState(null, log), 'idle');
  eq(parser.deriveLiveState({ items: [], i: 0, batchId: 'b1' }, log), 'idle');
  eq(parser.deriveLiveState(queue, []), 'idle');
  eq(parser.deriveLiveState(queue, [{ id: 10, batchId: 'b2' }]), 'idle');
  eq(parser.deriveLiveState({ ...queue, i: 0 }, log), 'incomplete');
  eq(parser.deriveLiveState({ ...queue, i: 2 }, log), 'incomplete');
  eq(parser.deriveLiveState({ ...queue, i: 3 }, log), 'complete');
  eq(parser.deriveLiveState({ ...queue, i: 9 }, log), 'complete');
  eq(parser.deriveLiveState({ items: queue.items, i: 2 }, log), 'idle');
});

test('unverifiedSaves selects only null or missing inactive results', () => {
  eq(parser.unverifiedSaves([]), []);
  eq(parser.unverifiedSaves(undefined), []);
  const one = { num: 1, id: 10, inactive: null };
  eq(parser.unverifiedSaves([one]), [one]);
  const missing = { num: 2, id: 11 };
  eq(parser.unverifiedSaves([missing]), [missing]);
  const verified = [{ num: 3, id: 12, inactive: true }, { num: 4, id: 13, inactive: false }];
  eq(parser.unverifiedSaves(verified), []);
  eq(parser.unverifiedSaves([verified[0], one, verified[1], missing]), [one, missing]);
});

test('trackUnverified stops after two consecutive unverified saves', () => {
  const first = parser.trackUnverified(0, null);
  eq(first, { streak: 1, stop: false });
  eq(parser.trackUnverified(first.streak, null), { streak: 2, stop: true });
  eq(parser.trackUnverified(1, true), { streak: 0, stop: false });
  eq(parser.trackUnverified(1, false), { streak: 0, stop: false });
  eq(parser.trackUnverified(0, null), { streak: 1, stop: false });
  eq(parser.trackUnverified(undefined, null), { streak: 1, stop: false });
});

test('formatSavedRange handles contiguous, sparse, single, and empty', () => {
  const range = n => [{ id: n, inactive: true }];
  eq(
    parser.formatSavedRange([901, 902, 903, 904, 905, 906, 907, 908, 909, 910].map(n => ({ id: n, inactive: true }))),
    'Saved this batch: #901 to #910, inactive'
  );
  eq(parser.formatSavedRange([905, 901, 903].map(n => ({ id: n, inactive: true }))), 'Saved this batch: #901, #903, #905, inactive');
  eq(parser.formatSavedRange(range(901)), 'Saved this batch: #901, inactive');
  eq(parser.formatSavedRange([]), 'Saved this batch: none');
  eq(parser.formatSavedRange(undefined), 'Saved this batch: none');
});

test('savedModeSuffix classifies draft, active, mixed, manual and legacy entries', () => {
  eq(parser.savedModeSuffix([]), '');
  eq(parser.savedModeSuffix([{ inactive: true, mode: 'draft' }]), ', inactive');
  eq(parser.savedModeSuffix([{ inactive: false, mode: 'active' }]), ', active');
  eq(parser.savedModeSuffix([{ inactive: true, mode: 'draft' }, { inactive: false, mode: 'active' }]), ', 1 active, 1 inactive');
  eq(parser.savedModeSuffix([{ inactive: false, mode: 'manual' }]), ', active');
  eq(parser.savedModeSuffix([{ inactive: true }]), ', inactive');
  eq(parser.savedModeSuffix([{ inactive: false }]), ', active');
  eq(parser.savedModeSuffix([{ inactive: null }]), ', status not verified');
});

test('savedModeSuffix reports mismatches before unverified entries', () => {
  eq(parser.savedModeSuffix([{ inactive: false, mode: 'draft' }]), ', MISMATCH: 1 saved in the wrong state');
  eq(parser.savedModeSuffix([{ inactive: true, mode: 'active' }]), ', MISMATCH: 1 saved in the wrong state');
  eq(parser.savedModeSuffix([{ inactive: false, mode: 'draft' }, { inactive: true, mode: 'active' }]), ', MISMATCH: 2 saved in the wrong state');
  eq(parser.savedModeSuffix([{ inactive: false, mode: 'draft' }, { inactive: null, mode: 'draft' }]), ', MISMATCH: 1 saved in the wrong state');
  eq(parser.savedModeSuffix([{ inactive: true, mode: 'manual' }]), ', active');
});

test('formatSavedRange reports active, mismatched and unverified saves honestly', () => {
  eq(parser.formatSavedRange([{ id: 7, inactive: false, mode: 'active' }]), 'Saved this batch: #7, active');
  eq(parser.formatSavedRange([{ id: 7, inactive: false, mode: 'draft' }]), 'Saved this batch: #7, MISMATCH: 1 saved in the wrong state');
  eq(parser.formatSavedRange([{ id: 7, inactive: null, mode: 'draft' }]), 'Saved this batch: #7, status not verified');
});

test('recentDuplicate flags a matching subject, category, year and 139-character prefix', () => {
  const long = 'a'.repeat(139);
  const row = { id: 7, subject: 'CRS', category: 'JAMB / UTME', year: '2021', question: long + '…' };
  eq(parser.recentDuplicate([row], 'CRS', long + ' more text', 'JAMB / UTME', '2021'), row);
});

test('recentDuplicate ignores a truncated row for a different question', () => {
  const row = { id: 8, subject: 'CRS', category: 'JAMB / UTME', year: '2021', question: 'b'.repeat(139) + '…' };
  eq(parser.recentDuplicate([row], 'CRS', 'a'.repeat(139) + ' more text', 'JAMB / UTME', '2021'), null);
});

test('recentDuplicate matches an untruncated row only on the full question', () => {
  const row = { id: 9, subject: 'CRS', category: 'JAMB / UTME', year: '2021', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), row);
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith', 'JAMB / UTME', '2021'), null);
});

test('recentDuplicate normalizes double spaces and line breaks in the row', () => {
  const row = { id: 10, subject: 'CRS', category: 'JAMB / UTME', year: '2021', question: 'Who  was the\nfather of faith?' };
  eq(parser.recentDuplicate([row], 'crs', 'Who was the father of faith?', 'jamb / utme', 2021), row);
});

test('recentDuplicate strips a leading [Subject] prefix from the row', () => {
  const row = { id: 11, subject: 'CRS', category: 'JAMB / UTME', year: '2021', question: '[CRS] Who was the father of faith?' };
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), row);
});

test('recentDuplicate ignores the same text under a different subject', () => {
  const row = { id: 12, subject: 'Government', category: 'JAMB / UTME', year: '2021', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), null);
});

test('recentDuplicate ignores the same text under a different year', () => {
  const row = { id: 13, subject: 'CRS', category: 'JAMB / UTME', year: '2020', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), null);
});

test('recentDuplicate ignores the same text under a different category', () => {
  const row = { id: 14, subject: 'CRS', category: 'POST UTME', year: '2021', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([row], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), null);
});

test('recentDuplicate treats an empty row year or category as unknown', () => {
  const noCategory = { id: 15, subject: 'CRS', category: '', year: '2021', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([noCategory], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), noCategory);
  const noYear = { id: 16, subject: 'CRS', category: 'JAMB / UTME', year: '', question: 'Who was the father of faith?' };
  eq(parser.recentDuplicate([noYear], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), noYear);
});

test('recentRowsFromTable maps an extra column before Question by header', () => {
  const headers = ['ID', 'Extra', 'Question', 'Subject', 'Exam Category', 'Exam Year'];
  const rows = [['5', 'x', 'Who was the father of faith?', 'CRS', 'JAMB / UTME', '2021']];
  eq(parser.recentRowsFromTable(headers, rows), [{
    id: '5', question: 'Who was the father of faith?', subject: 'CRS', category: 'JAMB / UTME', year: '2021'
  }]);
});

test('recentRowsFromTable leaves a missing Exam Year empty and falls back', () => {
  const headers = ['ID', 'Question', 'Subject', 'Exam Category'];
  const rows = [['5', 'Who was the father of faith?', 'CRS', 'JAMB / UTME']];
  const parsed = parser.recentRowsFromTable(headers, rows);
  eq(parsed[0].year, '');
  eq(parser.recentDuplicate(parsed, 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), parsed[0]);
});

test('recentDuplicate returns null without rows or question text', () => {
  eq(parser.recentDuplicate([], 'CRS', 'Who was the father of faith?', 'JAMB / UTME', '2021'), null);
  eq(parser.recentDuplicate([{ id: 1, subject: 'CRS', question: 'x' }], 'CRS', '', 'JAMB / UTME', '2021'), null);
});


function cleanQuestion(num, question) {
  return {
    num,
    question: question || 'Who was the father of faith?',
    a: 'Isaac',
    b: 'Jacob',
    c: 'Moses',
    d: 'David',
    e: '',
    f: '',
    flags: []
  };
}

function cleanState() {
  const items = [cleanQuestion(1), cleanQuestion(2, 'Who was the father of hope?')];
  return {
    queue: { items, i: 0, batchId: 'b1' },
    key: { 1: 'A', 2: 'B' },
    keyBatch: 'b1',
    keyConflicts: [],
    meta: { subject: 'CRS', category: 'UTME', year: '2021', subjectText: 'CRS' },
    confirmed: true,
    confirmedMeta: null,
    radioLetter: 'A',
    hasImage: false,
    hasVideo: false,
    hasExplanation: false,
    savingMarker: null,
    saveInProgress: false,
    stopRequested: false,
    lock: null,
    tabId: 't1',
    now: 1000,
    visible: true,
    savedLog: [],
    recentRows: [],
    form: { question: items[0].question, options: [items[0].a, items[0].b, items[0].c, items[0].d] }
  };
}

test('autosaveBlockers clears a clean batch', () => {
  eq(parser.autosaveBlockers(cleanState()), []);
});

test('autosaveBlockers checks detected block ranges without hard-blocking uncovered images', () => {
  const s = cleanState();
  s.queue.items[0].stimuli = [{ id: 'stim-1', order: 1, sourceNum: 1, nums: [2], missing: [] }];
  s.queue.items[1].needsImage = true;
  eq(parser.autosaveBlockers(s), []);
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [2] }];
  eq(parser.autosaveBlockers(s), []);
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [2], name: 'table.png' }];
  eq(parser.autosaveBlockers(s), []);
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [2], name: 'table.png', file: {} }];
  eq(parser.autosaveBlockers(s), []);
});

test('autosaveBlockers rejects a stimulus range outside the queue', () => {
  const s = cleanState();
  s.queue.items[0].stimuli = [{ id: 'stim-1', order: 1, sourceNum: 1, nums: [9], missing: [] }];
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [9], name: 'table.png', file: {} }];
  const first = parser.autosaveBlockers(s)[0];
  eq(first.code, 'stimulus-range');
  assert(first.detail.indexOf('9') > -1, first.detail);
});

test('autosaveBlockers defers uncovered needsImage to per-question pause and blocks missing-text and constant-long', () => {
  const s = cleanState();
  s.queue.items[0].needsImage = true;
  eq(parser.autosaveBlockers(s), []);
  s.imagePlan = [{ nums: [1], name: 'single.png', file: {} }];
  eq(parser.autosaveBlockers(s), []);

  const missing = cleanState();
  missing.queue.items[1].flags = ['[missing text] placeholder'];
  eq(parser.autosaveBlockers(missing)[0].code, 'missing-text');

  const longConstant = cleanState();
  longConstant.queue.items[0].constantText = 'x'.repeat(60001);
  longConstant.form.constantText = longConstant.queue.items[0].constantText;
  eq(parser.autosaveBlockers(longConstant)[0].code, 'constant-long');
});

test('autosaveBlockers accepts a mapped stimulus covering the flagged question', () => {
  const s = cleanState();
  s.queue.items[0].needsImage = true;
  s.queue.items[0].stimuli = [{ id: 'stim-1', order: 1, sourceNum: 1, nums: [1], missing: [] }];
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [1], name: 'shared.png', file: {} }];
  eq(parser.autosaveBlockers(s), []);
});

test('autosaveBlockers gates active mode confirmation and mode changes', () => {
  const clean = cleanState();
  clean.activeMode = false;
  clean.activeConfirmed = false;
  clean.mode = 'draft';
  clean.runMode = null;
  eq(parser.autosaveBlockers(clean), []);
  const unconfirmed = cleanState();
  unconfirmed.activeMode = true;
  unconfirmed.activeConfirmed = false;
  unconfirmed.mode = 'active';
  unconfirmed.runMode = null;
  eq(parser.autosaveBlockers(unconfirmed)[0].code, 'mode-unconfirmed');
  const confirmed = cleanState();
  confirmed.activeMode = true;
  confirmed.activeConfirmed = true;
  confirmed.mode = 'active';
  confirmed.runMode = 'active';
  eq(parser.autosaveBlockers(confirmed), []);
  const changed = cleanState();
  changed.activeMode = false;
  changed.activeConfirmed = true;
  changed.mode = 'draft';
  changed.runMode = 'active';
  eq(parser.autosaveBlockers(changed)[0].code, 'mode-changed');
});

test('autosaveBlockers blocks explanation text and a changed pinned metadata', () => {
  const explanation = cleanState();
  explanation.hasExplanation = true;
  eq(parser.autosaveBlockers(explanation)[0], {
    code: 'has-explanation',
    detail: 'The Answer Explanation box has text. Clear it first.'
  });
  const pinned = cleanState();
  pinned.confirmedMeta = { subject: 'CRS', category: 'UTME', year: '2021' };
  eq(parser.autosaveBlockers(pinned), []);
  pinned.meta = { subject: 'CRS', category: 'UTME', year: '2022', subjectText: 'CRS' };
  eq(parser.autosaveBlockers(pinned)[0], {
    code: 'meta-changed',
    detail: 'Subject, category or year changed since you confirmed.'
  });
  const category = cleanState();
  category.confirmedMeta = { subject: 'CRS', category: 'UTME', year: '2021' };
  category.meta = { subject: 'CRS', category: 'POST UTME', year: '2021', subjectText: 'CRS' };
  eq(parser.autosaveBlockers(category)[0].code, 'meta-changed');
});

test('autosaveBlockers keeps the first blocker order after the new codes', () => {
  const s = cleanState();
  s.hasExplanation = true;
  s.confirmedMeta = { subject: 'CRS', category: 'UTME', year: '2021' };
  s.meta = { subject: 'CRS', category: 'UTME', year: '', subjectText: 'CRS' };
  const codes = parser.autosaveBlockers(s).map(blocker => blocker.code);
  assert(codes.indexOf('meta-missing') < codes.indexOf('meta-changed'), codes.join(', '));
  assert(codes.indexOf('meta-changed') < codes.indexOf('has-explanation'), codes.join(', '));
});

test('autosaveBlockers reports a queue gap', () => {
  const s = cleanState();
  s.queue.items = [cleanQuestion(1), cleanQuestion(3)];
  s.key = { 1: 'A', 3: 'C' };
  const first = parser.autosaveBlockers(s)[0];
  eq(first.code, 'queue-number');
});

test('autosaveBlockers ignores diagram and table words', () => {
  const s = cleanState();
  s.queue.items = [cleanQuestion(1, 'Study the diagram in the table below and answer.')];
  s.key = { 1: 'A' };
  s.form = { question: s.queue.items[0].question, options: ['Isaac', 'Jacob', 'Moses', 'David'] };
  eq(parser.autosaveBlockers(s), []);
});

test('autosaveBlockers still reports an attached file', () => {
  const s = cleanState();
  s.hasImage = true;
  eq(parser.autosaveBlockers(s)[0].code, 'file-attached');
});

test('autosaveBlockers reports an E key on the current question', () => {
  const s = cleanState();
  s.queue.items = [cleanQuestion(1), cleanQuestion(2), cleanQuestion(3, 'Who was the father of peace?')];
  s.queue.i = 1;
  s.key = { 1: 'A', 2: 'E', 3: 'C' };
  s.radioLetter = null;
  s.form = { question: s.queue.items[1].question, options: ['Isaac', 'Jacob', 'Moses', 'David'] };
  const first = parser.autosaveBlockers(s)[0];
  eq(first.code, 'key-letter');
});

test('autosaveBlockers reports a legacy queue without a batch id', () => {
  const s = cleanState();
  delete s.queue.batchId;
  s.keyBatch = null;
  const first = parser.autosaveBlockers(s)[0];
  eq(first.code, 'batch-missing');
});

test('autosaveBlockers keeps key coverage ahead of a hidden tab', () => {
  const s = cleanState();
  s.key = {};
  s.visible = false;
  const first = parser.autosaveBlockers(s)[0];
  eq(first.code, 'key-coverage');
});

test('autosaveBlockers stops on saved-log and scoped recent duplicates', () => {
  const s = cleanState();
  s.savedLog = [{ num: 1, id: 9, batchId: 'b1' }];
  eq(parser.autosaveBlockers(s)[0].code, 'saved-log');
  const longQ = 'Who was the father of faith? ' + 'x'.repeat(120);
  const t = cleanState();
  t.queue.items[0].question = longQ;
  t.form = { question: longQ, options: ['Isaac', 'Jacob', 'Moses', 'David'] };
  t.recentRows = [{ id: 77, subject: 'CRS', category: 'UTME', year: '2021', question: longQ.slice(0, 139) + '…' }];
  const blocker = parser.autosaveBlockers(t)[0];
  eq(blocker.code, 'duplicate');
  const text = parser.blockerText(blocker);
  assert(text.indexOf('2021') > -1, 'missing year: ' + text);
  assert(text.indexOf('UTME') > -1, 'missing category: ' + text);
});

function priorFp(overrides) {
  const fp = parser.makeSavedFingerprint({
    subject_id: 'CRS',
    exam_category_id: 'UTME',
    exam_year: '2021',
    question_text: 'Who was the father of faith?'
  }, { subject: 'CRS', category: 'JAMB / UTME' });
  return Object.assign({}, fp, overrides || {});
}

function priorEntry(id, at, batchId, fp) {
  return { num: 1, id: id, at: at, batchId: batchId, inactive: false, mode: 'manual', fp: fp };
}

test('makeSavedFingerprint builds a complete v1 fingerprint', () => {
  eq(parser.makeSavedFingerprint({
    subject_id: '1',
    exam_category_id: '2',
    exam_year: '2021',
    question_text: '  Who  WAS the father of faith? '
  }, { subject: 'CRS', category: 'JAMB / UTME' }), {
    v: 1,
    subjectId: '1',
    categoryId: '2',
    year: '2021',
    subject: 'CRS',
    category: 'JAMB / UTME',
    question: 'who was the father of faith?'
  });
  eq(parser.makeSavedFingerprint({ subject_id: '', exam_category_id: '2', exam_year: '2021', question_text: 'x' }), null);
  eq(parser.makeSavedFingerprint({ subject_id: '1', exam_category_id: '2', exam_year: '', question_text: 'x' }), null);
  eq(parser.makeSavedFingerprint({ subject_id: '1', exam_category_id: '2', exam_year: '2021', question_text: '   ' }), null);
  eq(parser.makeSavedFingerprint({ subject_id: '1', exam_category_id: '2', exam_year: '2021', question_text: 'x'.repeat(4001) }), null);
  eq(parser.makeSavedFingerprint({ subject_id: '1', exam_category_id: '2', exam_year: '2021', question_text: 'x'.repeat(4000) }).question.length, 4000);
});

test('makeSavedFingerprint uses the posted text, not a queue item', () => {
  const fp = parser.makeSavedFingerprint({
    subject_id: '1', exam_category_id: '2', exam_year: '2021',
    question_text: 'Edited in the form before submit'
  }, { subject: 'CRS', category: 'JAMB / UTME' });
  eq(fp.question, 'edited in the form before submit');
});

testAsync('UI manual save writes a complete request-time fingerprint', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('batch-manual') });
  ui.setField('question_text', 'Edited in the form before submit');
  await ui.submit();
  eq(ui.posts.length, 1);
  const body = ui.posts[0].body;
  eq(body.get('question_text'), 'Edited in the form before submit');
  const log = ui.storage.get('ocrSavedLog');
  eq(log.length, 1);
  eq(log[0].fp, {
    v: 1,
    subjectId: '1',
    categoryId: '2',
    year: '2021',
    subject: 'CRS',
    category: 'JAMB / UTME',
    question: 'edited in the form before submit'
  });
  eq(log[0].fp.question, parser.normalizeAnswer(body.get('question_text')));
});

testAsync('UI rejected save writes no fingerprint', async () => {
  const storage = uiHarness.sampleStorage('batch-rejected');
  storage.ocrSavedLog = [{ id: 41, num: 1, at: 1, batchId: 'older' }];
  const ui = uiHarness.createUI({
    storage,
    replies: [{
      redirected: false,
      text: '<div class="admin-error">Exam year 1800 is invalid.</div>',
      errorText: 'Exam year 1800 is invalid.'
    }]
  });
  await ui.submit();
  eq(ui.posts.length, 1);
  eq(ui.storage.get('ocrSavedLog'), storage.ocrSavedLog);
  eq(ui.storage.get('ocrSaving'), null);
  eq(ui.storage.get('ocrBatchHistory'), null);
  assert(ui.doc.getElementById('ans_res').textContent.indexOf('NOT saved') === 0);
});

testAsync('UI ambiguous save writes no fingerprint', async () => {
  const storage = uiHarness.sampleStorage('batch-ambiguous');
  const ui = uiHarness.createUI({
    storage,
    replies: [{ redirected: false, text: '<html><body>No confirmation.</body></html>' }]
  });
  await ui.submit();
  eq(ui.posts.length, 1);
  eq(ui.storage.get('ocrSavedLog'), []);
  eq(ui.storage.get('ocrBatchHistory'), null);
  assert(ui.storage.get('ocrSaving'), 'ambiguous saves keep the uncertain-save marker');
  eq(ui.doc.getElementById('ans_res').textContent, 'Unknown. It may have saved. Check the list.');
});

testAsync('UI reset and re-paste stop dry run and Start before POST', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('first-batch') });
  await ui.submit();
  eq(ui.posts.length, 1);
  const saved = ui.storage.get('ocrSavedLog');
  eq(saved.length, 1);
  eq(saved[0].fp.v, 1);
  eq(saved[0].id, 500);

  ui.click('ocr_reset');
  eq(ui.storage.get('ocrQueue'), { items: [], i: 0 });
  eq(ui.storage.get('ocrSavedLog').length, 1);

  ui.setPaste(uiHarness.SAMPLE_TEXT);
  ui.click('ocr_load');
  const repasted = ui.storage.get('ocrQueue');
  eq(repasted.batchId === saved[0].batchId, false);
  eq(ui.posts.length, 1);

  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('BLOCKED') === 0, 'automatic dry run');
  eq(ui.posts.length, 1);
  const dryStatus = ui.doc.getElementById('ocr_dry_status').textContent;
  assert(dryStatus.indexOf('BLOCKED') === 0, 'dry run did not block: ' + dryStatus);
  const dryBlocked = ui.doc.getElementById('ocr_dry_blocked').textContent;
  assert(dryBlocked.indexOf('earlier batch') > -1, 'dry run did not report the earlier batch: ' + dryBlocked);
  assert(dryBlocked.indexOf('#500') > -1, 'dry run did not report the saved id: ' + dryBlocked);

  ui.setField('exam_year', '2022');
  ui.form.elements.exam_year.dispatch('change');
  assert(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('STALE') === 0, 'metadata change did not stale the dry result');
  await ui.click('ocr_auto_dry');
  eq(ui.posts.length, 1);
  const changedStatus = ui.doc.getElementById('ocr_dry_status').textContent;
  assert(changedStatus.indexOf('earlier batch') < 0, 'changed year still hit the fingerprint: ' + changedStatus);
  eq(changedStatus, 'COMPLETE — all 1 would save as ACTIVE.');
  eq(ui.doc.getElementById('ocr_dry_blocked').textContent, '');

  ui.click('ocr_reset');
  ui.setField('exam_year', '2021');
  ui.setPaste(uiHarness.SAMPLE_TEXT);
  ui.click('ocr_load');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('BLOCKED') === 0, 're-paste dry run');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 1);
  const blocked = ui.doc.getElementById('ocr_live_blocked').textContent;
  assert(blocked.indexOf('earlier batch') > -1, 'Start did not block: ' + blocked);
  assert(blocked.indexOf('#500') > -1, 'Start did not report the saved id: ' + blocked);

  eq(ui.storage.keys(), ['ansKey', 'ansKeyBatch', 'ansKeyConflicts', 'ocrBatchHistory', 'ocrMeta', 'ocrQueue', 'ocrSavedLog']);
});

testAsync('UI manual save adds one batch history entry and renders it', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('batch-history') });
  await ui.submit();
  const history = ui.storage.get('ocrBatchHistory');
  eq(history.length, 1);
  eq(history[0].batchId, 'batch-history');
  eq(history[0].subject, 'CRS');
  eq(history[0].category, 'JAMB / UTME');
  eq(history[0].year, '2021');
  eq(history[0].ids, [500]);
  eq(history[0].count, 1);
  eq(history[0].mode, 'active');
  const list = ui.doc.getElementById('ocr_batch_history_list');
  eq(list.children.length, 1);
  assert(list.children[0].textContent.indexOf('1 saved (#500)') > -1, list.children[0].textContent);
  eq(ui.doc.getElementById('ocr_batch_history').hidden, false);
});

testAsync('UI renders stored batch history with contiguous, single and gap ranges', async () => {
  const at = new Date(2026, 9, 27, 14, 5).getTime();
  const storage = uiHarness.sampleStorage('render-history');
  storage.ocrBatchHistory = [
    { batchId: 'h3', at, subject: 'CRS', category: 'JAMB / UTME', year: '2021', ids: [1785, 1787, 1788], count: 3, mode: 'active' },
    { batchId: 'h2', at: at - 60000, subject: 'CRS', category: 'WASCE / NECO / GCE', year: '2022', ids: [1780, 1781, 1782], count: 3, mode: 'inactive' },
    { batchId: 'h1', at: at - 120000, subject: 'Government', category: 'JAMB', year: '2023', ids: [1790], count: 1, mode: '' }
  ];
  const ui = uiHarness.createUI({ storage });
  const list = ui.doc.getElementById('ocr_batch_history_list');
  eq(list.children.length, 3);
  eq(list.children[0].textContent, '27 Oct 14:05 · CRS / JAMB / UTME / 2021 · 3 saved (#1785, #1787, #1788) · active');
  eq(list.children[1].textContent, '27 Oct 14:04 · CRS / WASCE / NECO / GCE / 2022 · 3 saved (#1780–#1782) · inactive');
  eq(list.children[2].textContent, '27 Oct 14:03 · Government / JAMB / 2023 · 1 saved (#1790)');
  eq(ui.doc.getElementById('ocr_batch_history').hidden, false);
});

testAsync('UI shows nothing for absent or malformed batch history', async () => {
  const absent = uiHarness.createUI({ storage: uiHarness.sampleStorage('no-history') });
  eq(absent.doc.getElementById('ocr_batch_history').hidden, true);
  const malformed = uiHarness.sampleStorage('bad-history');
  malformed.ocrBatchHistory = { nope: true };
  const ui = uiHarness.createUI({ storage: malformed });
  eq(ui.doc.getElementById('ocr_batch_history').hidden, true);
  const entries = uiHarness.sampleStorage('bad-entries');
  entries.ocrBatchHistory = [null, { batchId: '' }, 'bad'];
  const second = uiHarness.createUI({ storage: entries });
  eq(second.doc.getElementById('ocr_batch_history').hidden, true);
});

testAsync('UI Reset Queue keeps batch history', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('history-reset') });
  await ui.submit();
  const before = ui.storage.get('ocrBatchHistory');
  eq(before.length, 1);
  ui.click('ocr_reset');
  eq(ui.storage.get('ocrQueue'), { items: [], i: 0 });
  eq(ui.storage.get('ocrBatchHistory'), before);
  eq(ui.doc.getElementById('ocr_batch_history').hidden, false);
});

testAsync('UI history storage failure does not change a successful save', async () => {
  const ui = uiHarness.createUI({
    storage: uiHarness.sampleStorage('history-failure'),
    failStorageKeys: ['ocrBatchHistory']
  });
  await ui.submit();
  eq(ui.posts.length, 1);
  eq(ui.storage.get('ocrSavedLog').length, 1);
  eq(ui.storage.has('ocrBatchHistory'), false);
  eq(ui.storage.get('ocrSaving'), null);
  eq(ui.storage.get('ocrQueue').i, 1);
  eq(ui.doc.getElementById('ocr_live_blocked').textContent, '');
});

testAsync('UI full Load starts an automatic dry run that writes and posts nothing', async () => {
  const ui = uiHarness.createUI();
  ui.setPaste(uiHarness.SAMPLE_TEXT);
  ui.click('ocr_load');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE') === 0, 'automatic dry run');
  eq(ui.posts.length, 0);
  eq(ui.storage.get('ocrSavedLog'), null);
  eq(ui.storage.get('ocrSaving'), null);
  eq(ui.storage.get('ocrBatchHistory'), null);
  eq(ui.storage.get('autoLock'), null);
});

testAsync('UI key-only Load starts an automatic dry run with the new key', async () => {
  const storage = uiHarness.sampleStorage('key-only-auto');
  const ui = uiHarness.createUI({ storage });
  ui.setPaste('=== ANSWER KEY ===\n1.B');
  ui.click('ocr_load');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE') === 0, 'key-only dry run');
  eq(ui.storage.get('ansKey'), { 1: 'B' });
  eq(ui.posts.length, 0);
});

testAsync('UI automatic dry run still starts with missing metadata and stops blocked', async () => {
  const storage = uiHarness.sampleStorage('dry-meta');
  delete storage.ocrMeta;
  const ui = uiHarness.createUI({ storage });
  ui.setField('exam_year', '');
  ui.setPaste('=== ANSWER KEY ===\n1.B');
  ui.click('ocr_load');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('BLOCKED') === 0, 'blocked dry run');
  assert(ui.doc.getElementById('ocr_dry_blocked').textContent.indexOf('Subject, category or year is missing') > -1);
  eq(ui.posts.length, 0);
});

testAsync('UI dry run does not clear a blocked live panel', async () => {
  const storage = uiHarness.sampleStorage('live-blocked');
  storage.ocrSaving = { num: 1, at: Date.now(), subject: '1', category: '2', year: '2021' };
  const ui = uiHarness.createUI({ storage });
  await ui.click('ocr_auto_start');
  assert(ui.doc.getElementById('ocr_live_status').textContent.indexOf('BLOCKED') === 0);
  const liveBlocked = ui.doc.getElementById('ocr_live_blocked').textContent;
  await ui.click('ocr_auto_dry');
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE'), 0);
  eq(ui.doc.getElementById('ocr_live_status').textContent.indexOf('BLOCKED'), 0);
  eq(ui.doc.getElementById('ocr_live_blocked').textContent, liveBlocked);
});

testAsync('UI reload shows incomplete or complete live state from the queue and log', async () => {
  const mid = uiHarness.sampleStorage('reload-mid');
  mid.ocrQueue.items.push({ ...mid.ocrQueue.items[0], num: 2 });
  mid.ocrQueue.i = 1;
  mid.ocrSavedLog = [{ num: 1, id: 500, at: 1, batchId: 'reload-mid', inactive: false, mode: 'active' }];
  const partial = uiHarness.createUI({ storage: mid });
  eq(partial.doc.getElementById('ocr_live_status').textContent, 'INCOMPLETE — queue resumed at 2 of 2');

  const done = uiHarness.sampleStorage('reload-done');
  done.ocrQueue.items.push({ ...done.ocrQueue.items[0], num: 2 });
  done.ocrQueue.i = 2;
  done.ocrSavedLog = [{ num: 1, id: 500, at: 1, batchId: 'reload-done', inactive: false, mode: 'active' }];
  const complete = uiHarness.createUI({ storage: done });
  eq(complete.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE'), 0);
});

testAsync('UI live completion beats Stop after the final save', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('stop-last'), inactiveChecked: true });
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE') === 0, 'live complete');
  ui.click('ocr_auto_stop');
  eq(ui.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE'), 0);
  eq(ui.posts.length, 1);
});

function twoQuestionStorage(batchId) {
  const storage = uiHarness.sampleStorage(batchId);
  storage.ocrQueue.items.push({
    num: 2,
    question: 'Who was the father of many nations?',
    a: 'Isaac',
    b: 'Jacob',
    c: 'Moses',
    d: 'Abraham',
    flags: []
  });
  storage.ansKey = { 1: 'A', 2: 'A' };
  return storage;
}

function savedReply(_request, count) {
  return { redirected: true, text: 'Question saved successfully (Question ID: ' + (499 + count) + ')' };
}

testAsync('UI live completion beats Stop requested during the final save', async () => {
  let ui;
  ui = uiHarness.createUI({
    storage: twoQuestionStorage('stop-during-final'),
    inactiveChecked: true,
    reply: (request, count) => {
      if (count === 2) ui.click('ocr_auto_stop');
      return savedReply(request, count);
    }
  });
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE') === 0, 'live complete after stop');
  eq(ui.posts.length, 2);
});

testAsync('UI full Load during the post-save wait is not overwritten by the old run', async () => {
  const fresh = '1. Which city is the capital of France?\nA. Paris\nB. Rome\nC. Madrid\nD. Berlin\n\n=== ANSWER KEY ===\n1.A';
  let ui, loaded = false;
  ui = uiHarness.createUI({
    storage: twoQuestionStorage('load-during-wait'),
    inactiveChecked: true,
    reply: savedReply,
    onLongTimeout: ms => {
      if (ms !== 1500 || loaded) return;
      loaded = true;
      ui.setPaste(fresh);
      ui.click('ocr_load');
    }
  });
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE') === 0, 'fresh dry after load');
  eq(ui.doc.getElementById('ocr_live_status').textContent.indexOf('IDLE'), 0);
  eq(ui.posts.length, 1);
  eq(ui.storage.get('ocrQueue').i, 0);
});

testAsync('UI an unexpected error in the live loop ends BLOCKED, not RUNNING', async () => {
  let threw = false;
  const ui = uiHarness.createUI({
    storage: twoQuestionStorage('live-throw'),
    inactiveChecked: true,
    onLongTimeout: ms => {
      if (ms !== 1500 || threw) return;
      threw = true;
      throw new Error('simulated run failure');
    }
  });
  await ui.click('ocr_auto_start').catch(() => {});
  await waitFor(() => ui.doc.getElementById('ocr_live_status').textContent.indexOf('BLOCKED') === 0, 'blocked after error');
  eq(ui.posts.length, 1);
  assert(ui.doc.getElementById('ocr_live_blocked').textContent.indexOf('unexpected error') > -1);
});

async function completedDry(storage) {
  const ui = uiHarness.createUI({ storage });
  await ui.click('ocr_auto_dry');
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE'), 0);
  return ui;
}

testAsync('UI dry result becomes STALE when the key is cleared', async () => {
  const ui = await completedDry(uiHarness.sampleStorage('stale-key'));
  ui.click('ans_clear');
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('STALE'), 0);
});

testAsync('UI dry result becomes STALE when the save mode changes', async () => {
  const ui = await completedDry(uiHarness.sampleStorage('stale-mode'));
  ui.doc.getElementById('ocr_active_mode').onchange();
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('STALE'), 0);
});

testAsync('UI dry result becomes STALE when the queue is skipped', async () => {
  const ui = await completedDry(uiHarness.sampleStorage('stale-skip'));
  ui.click('ocr_skip');
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('STALE'), 0);
});

testAsync('UI dry result becomes STALE when the queue is reset', async () => {
  const ui = await completedDry(uiHarness.sampleStorage('stale-reset'));
  ui.click('ocr_reset');
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('STALE'), 0);
});

testAsync('UI manual dry run writes no storage key and posts nothing', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('dry-writes') });
  const keys = ['ansKey', 'ansKeyBatch', 'ansKeyConflicts', 'ocrBatchHistory', 'ocrMeta', 'ocrQueue', 'ocrSavedLog', 'ocrSaving', 'autoLock'];
  const snapshot = () => JSON.stringify(keys.map(key => [key, ui.storage.get(key)]));
  const before = snapshot();
  await ui.click('ocr_auto_dry');
  eq(ui.posts.length, 0);
  eq(snapshot(), before);
  eq(ui.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE'), 0);
});

test('savedLogPriorDuplicate returns a matching prior-batch entry', () => {
  const fp = priorFp();
  const entry = priorEntry(1785, 100, 'b1', fp);
  eq(parser.savedLogPriorDuplicate([entry], 'b2', fp), entry);
});

test('savedLogPriorDuplicate ignores a different year, category or subject', () => {
  const fp = priorFp();
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ year: '2022' }))], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ categoryId: '3' }))], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ subjectId: '9' }))], 'b2', fp), null);
});

test('savedLogPriorDuplicate ignores different text under the same triple', () => {
  const fp = priorFp();
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ question: 'another question' }))], 'b2', fp), null);
});

test('savedLogPriorDuplicate ignores legacy, partial and unknown fingerprints', () => {
  const fp = priorFp();
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', undefined)], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ year: '' }))], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', priorFp({ v: 2 }))], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b1', fp)], '', fp), null);
});

test('savedLogPriorDuplicate excludes the current batch', () => {
  const fp = priorFp();
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b2', fp)], 'b2', fp), null);
  eq(parser.savedLogPriorDuplicate([priorEntry(1, 100, 'b2', fp), priorEntry(2, 200, 'b2', fp)], 'b2', fp), null);
});

test('savedLogPriorDuplicate reports the newest match by at, then id', () => {
  const fp = priorFp();
  const older = priorEntry(1, 100, 'b1', fp);
  const sameAtLow = priorEntry(2, 200, 'b1', fp);
  const sameAtHigh = priorEntry(3, 200, 'b1', fp);
  eq(parser.savedLogPriorDuplicate([older, sameAtLow, sameAtHigh], 'b2', fp), sameAtHigh);
});

test('savedLogPriorDuplicate matches on IDs and normalized text, not labels', () => {
  const fp = priorFp();
  const entry = priorEntry(1785, 100, 'b1', priorFp({ subject: 'Other label', category: 'Other label', question: '  WHO   was the father of faith? ' }));
  eq(parser.savedLogPriorDuplicate([entry], 'b2', fp), entry);
});

test('commitSave keeps a complete fingerprint on the saved entry', () => {
  let written = null;
  const fp = priorFp();
  const result = parser.commitSave({
    read: () => [],
    current: [],
    entry: priorEntry(1785, 100, 'b1', fp),
    write: log => { written = log; }
  });
  eq(result.ok, true);
  eq(written[0].fp, fp);
});

test('saved-log merge and cap keep fingerprints', () => {
  const fp = priorFp();
  const stored = [];
  for (let i = 1; i <= 200; i++) stored.push({ id: i, batchId: 'b1' });
  const merged = parser.mergeSavedLog(stored, [], priorEntry(201, 300, 'b2', fp), 200);
  eq(merged.length, 200);
  eq(merged[199].id, 201);
  eq(merged[199].fp, fp);
});

test('makeBatchHistoryEntry builds sorted unique ids, count and mode', () => {
  eq(parser.makeBatchHistoryEntry({
    batchId: 'b1',
    subject: 'CRS',
    category: 'JAMB / UTME',
    year: '2021',
    at: 123,
    entries: [
      { id: 1787, inactive: false, mode: 'active' },
      { id: 1785, inactive: false, mode: 'active' },
      { id: 1787, inactive: false, mode: 'active' }
    ]
  }), {
    batchId: 'b1',
    at: 123,
    subject: 'CRS',
    category: 'JAMB / UTME',
    year: '2021',
    ids: [1785, 1787],
    count: 2,
    mode: 'active'
  });
});

test('makeBatchHistoryEntry returns null without a batch or saved ids', () => {
  const entries = [{ id: 1785, inactive: false, mode: 'active' }];
  eq(parser.makeBatchHistoryEntry({ subject: 'CRS', entries }), null);
  eq(parser.makeBatchHistoryEntry({ batchId: 'b1', entries: [] }), null);
  eq(parser.makeBatchHistoryEntry({ batchId: 'b1', entries: [{ id: null }] }), null);
  eq(parser.makeBatchHistoryEntry({ batchId: 'b1', entries: 'nope' }), null);
});

test('makeBatchHistoryEntry reports mixed, unverified and mismatch modes', () => {
  const make = entries => parser.makeBatchHistoryEntry({
    batchId: 'b1', subject: 'CRS', category: 'JAMB / UTME', year: '2021', at: 1, entries
  });
  eq(make([
    { id: 1, inactive: false, mode: 'active' },
    { id: 2, inactive: true, mode: 'draft' }
  ]).mode, '1 active, 1 inactive');
  eq(make([{ id: 1, inactive: null, mode: 'draft' }]).mode, 'status not verified');
  assert(make([{ id: 1, inactive: true, mode: 'active' }]).mode.indexOf('MISMATCH') === 0);
});

test('upsertBatchHistory replaces the same batch and keeps the newest first', () => {
  const history = [
    { batchId: 'b2', ids: [2], count: 1 },
    { batchId: 'b1', ids: [1], count: 1 }
  ];
  const updated = parser.upsertBatchHistory(history, { batchId: 'b2', ids: [2, 3], count: 2, mode: 'active' }, 15);
  eq(updated.length, 2);
  eq(updated[0], { batchId: 'b2', ids: [2, 3], count: 2, mode: 'active' });
  eq(updated[1].batchId, 'b1');
});

test('upsertBatchHistory drops the oldest entry at the cap', () => {
  const history = [];
  for (let i = 14; i >= 0; i--) history.push({ batchId: 'b' + i, ids: [i], count: 1 });
  const updated = parser.upsertBatchHistory(history, { batchId: 'b15', ids: [15], count: 1, mode: 'active' }, 15);
  eq(updated.length, 15);
  eq(updated[0].batchId, 'b15');
  eq(updated.some(entry => entry.batchId === 'b0'), false);
  eq(updated.some(entry => entry.batchId === 'b14'), true);
});

test('upsertBatchHistory accepts only an array and ignores malformed entries', () => {
  eq(parser.upsertBatchHistory(null, { batchId: 'b1' }, 15), []);
  eq(parser.upsertBatchHistory('nope', { batchId: 'b1' }, 15), []);
  const updated = parser.upsertBatchHistory([
    null,
    'bad',
    { batchId: '' },
    { batchId: 'b1', ids: [1], count: 1 }
  ], { batchId: 'b2', ids: [2], count: 1 }, 15);
  eq(updated, [
    { batchId: 'b2', ids: [2], count: 1 },
    { batchId: 'b1', ids: [1], count: 1 }
  ]);
  eq(parser.upsertBatchHistory([{ batchId: 'b1', ids: [1], count: 1 }], { batchId: 'b2' }, 15),
    [{ batchId: 'b1', ids: [1], count: 1 }]);
  eq(parser.upsertBatchHistory([{ batchId: 'b1', ids: [1], count: 1 }], { batchId: 'b2', ids: [] }, 15),
    [{ batchId: 'b1', ids: [1], count: 1 }]);
});

test('autosaveBlockers keeps the current-batch number check first', () => {
  const fp = priorFp();
  const s = cleanState();
  s.queue.batchId = 'b2';
  s.keyBatch = 'b2';
  s.savedLog = [
    { num: 1, id: 9, at: 300, batchId: 'b2' },
    priorEntry(1785, 100, 'b1', fp)
  ];
  eq(parser.autosaveBlockers(s)[0].code, 'saved-log');
});

test('autosaveBlockers stops on a prior-batch fingerprint after Reset and re-paste', () => {
  const fp = priorFp();
  let written = null;
  const committed = parser.commitSave({
    read: () => [],
    current: [],
    entry: priorEntry(1785, 100, 'old', fp),
    write: log => { written = log; }
  });
  eq(committed.ok, true);
  const s = cleanState();
  s.queue = { items: [cleanQuestion(1)], i: 0, batchId: 'new' };
  s.key = { 1: 'A' };
  s.keyBatch = 'new';
  s.savedLog = written;
  s.meta = { subject: 'CRS', category: 'UTME', year: '2021', subjectText: 'CRS', categoryText: 'JAMB / UTME' };
  const blockers = parser.autosaveBlockers(s);
  eq(blockers[0].code, 'duplicate');
  const text = parser.blockerText(blockers[0]);
  assert(text.indexOf('#1785') > -1, 'missing saved id: ' + text);
  assert(text.indexOf('earlier batch') > -1, 'missing earlier-batch wording: ' + text);
  const changedYear = Object.assign({}, s, { meta: Object.assign({}, s.meta, { year: '2022' }) });
  eq(parser.autosaveBlockers(changedYear), []);
  const changedCategory = Object.assign({}, s, { meta: Object.assign({}, s.meta, { category: 'JAMB', categoryText: 'JAMB' }) });
  eq(parser.autosaveBlockers(changedCategory), []);
  const changedSubject = Object.assign({}, s, { meta: Object.assign({}, s.meta, { subject: 'CRK', subjectText: 'CRK' }) });
  eq(parser.autosaveBlockers(changedSubject), []);
});

test('autosaveBlockers reports the matched entry labels for a prior duplicate', () => {
  const s = cleanState();
  s.queue = { items: [cleanQuestion(1)], i: 0, batchId: 'new' };
  s.key = { 1: 'A' };
  s.keyBatch = 'new';
  s.savedLog = [priorEntry(1785, 100, 'old', priorFp({ category: 'JAMB/UTME' }))];
  s.meta = { subject: 'CRS', category: 'UTME', year: '2021', subjectText: 'CRS', categoryText: 'JAMB / UTME' };
  const blocker = parser.autosaveBlockers(s)[0];
  eq(blocker.code, 'duplicate');
  const text = parser.blockerText(blocker);
  assert(text.indexOf('(2021, JAMB/UTME)') > -1, 'did not use the saved label: ' + text);
  assert(text.indexOf('JAMB / UTME') < 0, 'used the current label: ' + text);
  s.savedLog = [priorEntry(1785, 100, 'old', priorFp({ category: '' }))];
  const fallback = parser.blockerText(parser.autosaveBlockers(s)[0]);
  assert(fallback.indexOf('(2021, JAMB / UTME)') > -1, 'missing current-label fallback: ' + fallback);
});

test('autosaveBlockers still runs the recent-table check without a prior match', () => {
  const s = cleanState();
  s.queue.batchId = 'b2';
  s.keyBatch = 'b2';
  s.savedLog = [priorEntry(1785, 100, 'b1', priorFp({ question: 'another question' }))];
  s.recentRows = [{ id: 77, subject: 'CRS', category: 'UTME', year: '2021', question: s.queue.items[0].question }];
  const blocker = parser.autosaveBlockers(s)[0];
  eq(blocker.code, 'duplicate');
  assert(parser.blockerText(blocker).indexOf('#77') > -1, 'recent row did not report: ' + parser.blockerText(blocker));
});

test('autosaveBlockers stops when the form was edited', () => {
  const s = cleanState();
  s.form.question = 'A completely different question.';
  eq(parser.autosaveBlockers(s)[0].code, 'form-edited');
});

test('formMatchesQuestion and savedLogHasNum are exact', () => {
  const q = cleanQuestion(1);
  eq(parser.formMatchesQuestion({ question: q.question, options: [q.a, q.b, q.c, q.d] }, q), true);
  eq(parser.formMatchesQuestion({ question: q.question, options: [q.a, q.b, q.c, 'Wrong'] }, q), false);
  eq(parser.savedLogHasNum([{ num: 1, batchId: 'b1' }], 'b1', 1), true);
  eq(parser.savedLogHasNum([{ num: 1, batchId: 'b1' }], 'b2', 1), false);
});

test('blockerText maps every known code to a plain sentence', () => {
  const codes = ['batch-missing', 'batch-mismatch', 'queue-number', 'key-coverage', 'key-conflict',
    'key-letter', 'no-answer', 'answer-mismatch', 'ef-present', 'flags', 'options-not-abcd',
    'option-empty', 'option-duplicate', 'option-long', 'question-short',
    'meta-missing', 'not-confirmed', 'mode-unconfirmed', 'mode-changed',
    'meta-changed', 'stimulus-unassigned', 'stimulus-range', 'image-required', 'missing-text',
    'file-attached', 'has-explanation', 'saving-marker', 'save-in-progress',
    'stopped', 'lock', 'hidden', 'saved-log', 'duplicate', 'form-edited', 'constant-long'];
  for (const code of codes) {
    const text = parser.blockerText({ code, detail: 'detail' });
    assert(text.indexOf('Cannot auto-save:') === 0, code + ': ' + text);
    assert(text.indexOf('detail') > -1, code + ': ' + text);
  }
});


test('checkListUrl builds the filtered Recently Added URL from save metadata', () => {
  eq(parser.checkListUrl('/admin_questions.php', { subject: '14', category: '3', year: '2024' }),
    '/admin_questions.php?subject_id=14&exam_year_filter=2024&category_filter=3');
  eq(parser.checkListUrl('/admin_questions.php', { subject: '', category: '3', year: '2024' }), null);
  eq(parser.checkListUrl('/admin_questions.php', { subject: '14', category: '3', year: '24' }), null);
  eq(parser.checkListUrl('/admin_questions.php', null), null);
});

test('classifySaveResponse accepts a fresh success redirect', () => {
  eq(parser.classifySaveResponse({
    redirected: true,
    text: 'Question saved successfully (Question ID: 100)',
    errorText: '',
    lastId: 99
  }), { kind: 'saved', id: 100 });
});

test('classifySaveResponse rejects a stale success id', () => {
  eq(parser.classifySaveResponse({
    redirected: true,
    text: 'Question saved successfully (Question ID: 90)',
    errorText: '',
    lastId: 99
  }), { kind: 'ambiguous', message: 'Unknown. It may have saved. Check the list.' });
});

test('classifySaveResponse rejects a redirect without success text', () => {
  eq(parser.classifySaveResponse({ redirected: true, text: '<html>form</html>', errorText: '', lastId: 0 }).kind, 'ambiguous');
});

test('classifySaveResponse classifies a non-redirected validation error', () => {
  eq(parser.classifySaveResponse({ redirected: false, text: '<div class="admin-error">Option C is required</div>', errorText: 'Option C is required', lastId: 0 }), {
    kind: 'rejected', reason: 'validation', message: 'Option C is required'
  });
});

test('classifySaveResponse treats error plus success text as ambiguous', () => {
  eq(parser.classifySaveResponse({
    redirected: true,
    text: 'Question saved successfully (Question ID: 100)',
    errorText: 'Something went wrong',
    lastId: 99
  }).kind, 'ambiguous');
});

test('classifySaveResponse rejects the logged-out page', () => {
  const loginPage = '<h1>Administrator Login</h1><form action="admin_questions.php?action=login">'
    + '<input name="username"><input type="password" name="password"></form>';
  eq(parser.classifySaveResponse({ redirected: false, text: loginPage, errorText: '', lastId: 0 }), {
    kind: 'rejected', reason: 'expired', message: 'you were logged out. Reload the page and log in.'
  });
});

test('classifySaveResponse accepts a save whose question mentions the login page', () => {
  // BLOCK-28: ordinary stem text must not be read as a logout.
  const page = '<div class="admin-success">Question saved successfully (Question ID: 128).</div>'
    + '<table class="admin-table"><tbody><tr><td>What does the Administrator Login page let a school officer do?</td>'
    + '<td>Sign in to manage questions</td></tr></tbody></table>';
  eq(parser.classifySaveResponse({ redirected: true, text: page, errorText: '', lastId: 100, loginForm: false }), {
    kind: 'saved', id: 128
  });
  eq(parser.classifySaveResponse({ redirected: true, text: page, errorText: '', lastId: 100, loginForm: true }).kind, 'rejected');
  eq(parser.classifySaveResponse({ redirected: true, text: page, errorText: '', lastId: 200, loginForm: false }).kind, 'ambiguous');
});

test('classifySaveResponse treats an empty reply as ambiguous', () => {
  eq(parser.classifySaveResponse({ redirected: false, text: '', errorText: '', lastId: 0 }).kind, 'ambiguous');
});


test('autosaveBlockers reports lock, hidden, marker, save, and stop', () => {
  const lock = cleanState();
  lock.lock = { tabId: 'other', at: 900 };
  lock.now = 1000;
  eq(parser.autosaveBlockers(lock)[0].code, 'lock');
  const hidden = cleanState();
  hidden.visible = false;
  eq(parser.autosaveBlockers(hidden)[0].code, 'hidden');
  const marker = cleanState();
  marker.savingMarker = { num: 1, at: 900 };
  eq(parser.autosaveBlockers(marker)[0].code, 'saving-marker');
  const saving = cleanState();
  saving.saveInProgress = true;
  eq(parser.autosaveBlockers(saving)[0].code, 'save-in-progress');
  const stopped = cleanState();
  stopped.stopRequested = true;
  eq(parser.autosaveBlockers(stopped)[0].code, 'stopped');
});

test('autosaveBlockers does not impose a save-count cap', () => {
  const s = cleanState();
  s.runCount = 999;
  s.runCap = 10;
  eq(parser.autosaveBlockers(s), []);
});

test('autosaveBlockers ignores another tab lock older than 15 seconds', () => {
  const s = cleanState();
  s.lock = { tabId: 'other', at: 1000 };
  s.now = 16000;
  eq(parser.autosaveBlockers(s), []);
});

test('autosaveBlockers ignores its own lock', () => {
  const s = cleanState();
  s.lock = { tabId: s.tabId, at: 999 };
  s.now = 1000;
  eq(parser.autosaveBlockers(s), []);
});

test('newBatchId prefers randomUUID and falls back without one', () => {
  eq(parser.newBatchId({ randomUUID: () => 'uuid-1' }), 'uuid-1');
  const fallback = parser.newBatchId({ randomUUID: () => { throw new Error('nope'); } });
  assert(/^b[0-9a-z]+-[0-9a-z]+$/.test(fallback), 'unexpected fallback: ' + fallback);
});

test('salvageNormalize preserves dotted abbreviations', () => {
  const phrase = parser.salvageNormalize('He earned a Ph.D. from the U.S.A.');
  eq(phrase, { text: 'He earned a Ph.D. from the U.S.A.', inserts: 0 });
  eq(parser.salvageNormalize('Ph.D.'), { text: 'Ph.D.', inserts: 0 });
  eq(parser.salvageNormalize('U.S.A.'), { text: 'U.S.A.', inserts: 0 });
});

test('salvageNormalize repairs fused option labels', () => {
  eq(parser.salvageNormalize('inA.Italy'), { text: 'in A.Italy', inserts: 1 });
  eq(parser.salvageNormalize('naturalizationA. pays'), { text: 'naturalization A. pays', inserts: 1 });
  eq(parser.salvageNormalize('disenfranchised.D.the'), { text: 'disenfranchised. D.the', inserts: 1 });
});

test('splitSectionsWithSalvage accepts anomaly-block2 with 50 inserts', () => {
  const raw = fs.readFileSync(path.join(INPUT_DIR, 'anomaly-block2.txt'), 'utf8');
  const repair = parser.splitSectionsWithSalvage(raw);
  eq(repair.salvaged, true);
  eq(repair.inserts, 50);
  const items = parser.splitQuestionItems(repair.parts.questions);
  eq(items.map(item => item.num), [null, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16]);
});

test('splitQuestionItems keeps anomaly-block1 bullets unnumbered', () => {
  const raw = fs.readFileSync(path.join(INPUT_DIR, 'anomaly-block1.txt'), 'utf8');
  const items = parser.splitQuestionItems(raw);
  eq(items.length, 19);
  assert(items.every(item => item.num === null), 'every bullet item must keep num: null');
});

test('salvageNormalize is a no-op on every bank input', () => {
  for (const year of [2021, 2022, 2023, 2024, 2025]) {
    const raw = fs.readFileSync(path.join(INPUT_DIR, `bank-${year}.txt`), 'utf8');
    const result = parser.salvageNormalize(raw);
    eq(result.inserts, 0, `bank-${year} inserts`);
    eq(result.text, raw, `bank-${year} text changed`);
  }
});

function imageStorage(batchId, extraNeeds) {
  const mk = (num, question) => ({ num, question, a: 'one', b: 'two', c: 'three', d: 'four', flags: [] });
  const items = [
    Object.assign(mk(13, 'Shared table question thirteen'), {
      stimuli: [{
        sourceNum: 13, nums: [14, 15],
        marker: 'Use the information below to answer questions 14 and 15',
        text: 'Opening stock: 22,000', source: 'intro',
        id: 'stim-1', order: 1, missing: []
      }]
    }),
    Object.assign(mk(14, 'First table question fourteen'), { needsImage: true }),
    Object.assign(mk(15, 'Second table question fifteen'), { needsImage: true })
  ];
  if (extraNeeds !== undefined) items.push(Object.assign(mk(extraNeeds, 'Separate image question ' + extraNeeds), { needsImage: true }));
  return {
    ocrQueue: { items, i: 0, batchId },
    ansKey: { 13: 'D', 14: 'A', 15: 'B' },
    ansKeyBatch: batchId,
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  };
}

function fakeImage(name, size) {
  return { name, size: size == null ? 1234 : size, type: 'image/png' };
}

function chooseImage(ui, id, file) {
  const input = ui.doc.getElementById(id);
  input.files = [file];
  if (typeof input.onchange === 'function') input.onchange();
}

testAsync('UI image plan is hidden for a queue without stimuli', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('plain') });
  eq(ui.doc.getElementById('ocr_image_plan').hidden, true);
  eq(ui.doc.getElementById('ocr_img_generic_range'), null);
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
});

testAsync('UI image plan shows an ordered detected block without blocking Start', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-shown') });
  const panel = ui.doc.getElementById('ocr_image_plan');
  eq(panel.hidden, false);
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'No image');
  eq(ui.doc.getElementById('ocr_img_range_0').value, '14-15');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
  eq(ui.doc.getElementById('ocr_img_generic_range'), null);
});

testAsync('UI image plan attaches a file and enables Start', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-attach') });
  const file = fakeImage('table.png');
  chooseImage(ui, 'ocr_img_file_0', file);
  ui.doc.getElementById('ocr_img_range_0').value = '14, 15';
  ui.click('ocr_img_attach_0');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  eq(ui.doc.getElementById('ocr_img_file_name_0').textContent, 'table.png (1234 bytes)');
  eq(ui.doc.getElementById('ocr_img_range_0').value, '14-15');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
  eq(ui.storage.get('ocrImagePlan'), null);
});

testAsync('UI image plan rejects an empty range', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-empty') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.doc.getElementById('ocr_img_range_0').value = '';
  ui.click('ocr_img_attach_0');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'No image');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
});

testAsync('UI image plan blocks an out-of-paste range', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-outside') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.doc.getElementById('ocr_img_range_0').value = '14-19';
  ui.click('ocr_img_attach_0');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Range not in this paste: 16, 17, 18, 19');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true);
});

testAsync('UI generic image row appears only for uncovered flagged questions', async () => {
  const covered = uiHarness.createUI({ storage: imageStorage('generic-none') });
  eq(covered.doc.getElementById('ocr_img_generic_range'), null);

  const ui = uiHarness.createUI({ storage: imageStorage('generic-needed', 18) });
  eq(ui.doc.getElementById('ocr_img_generic_range').value, '18');
  eq(ui.doc.getElementById('ocr_img_missing_18').textContent, 'Question Q18 needs an image; auto-save will pause here.');
  chooseImage(ui, 'ocr_img_generic_file', fakeImage('single.png'));
  ui.click('ocr_img_generic_attach');
  eq(ui.doc.getElementById('ocr_img_generic_status').textContent, 'Ready');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false, 'image assignments no longer block Start');
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
});

testAsync('UI image plan is empty after reload and never stored', async () => {
  const storage = imageStorage('stim-reload');
  const first = uiHarness.createUI({ storage });
  chooseImage(first, 'ocr_img_file_0', fakeImage('table.png'));
  first.click('ocr_img_attach_0');
  eq(first.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  assert(!first.storage.keys().some(key => /image|stim/i.test(key)), 'image plan leaked into storage');

  const reloaded = uiHarness.createUI({ storage });
  eq(reloaded.doc.getElementById('ocr_img_status_0').textContent, 'No image');
  eq(reloaded.doc.getElementById('ocr_img_file_name_0').textContent, '');
  eq(reloaded.doc.getElementById('ocr_auto_start').disabled, false);
});

testAsync('UI Reset clears the image plan', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-reset') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  ui.click('ocr_reset');
  eq(ui.doc.getElementById('ocr_image_plan').hidden, true);
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true);
  eq(ui.storage.get('ocrQueue'), { items: [], i: 0 });
});

testAsync('UI full Load clears the plan and re-detects the blocks', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-load') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  ui.setPaste(fs.readFileSync(path.join(INPUT_DIR, 'new-edge-shared-stimulus.txt'), 'utf8'));
  ui.click('ocr_load');
  const queue = ui.storage.get('ocrQueue');
  eq(queue.items.filter(item => item.needsImage).map(item => item.num), [14, 15]);
  const holder = queue.items.find(item => Array.isArray(item.stimuli) && item.stimuli.length);
  eq(holder.stimuli[0].nums, [14, 15]);
  eq(ui.doc.getElementById('ocr_image_plan').hidden, false);
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'No image');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false);
});

testAsync('UI key-only Load keeps the queue and image plan', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-keyonly') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  ui.setPaste('=== ANSWER KEY ===\n13:D 14:A 15:B');
  ui.click('ocr_load');
  eq(ui.storage.get('ocrQueue').items.length, 3);
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  eq(ui.doc.getElementById('ocr_confirm_tick').checked, false, 'key-only Load clears the confirmation');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true, 'key-only Load disables Start until a new tick');
  const keyOnlyTick = ui.doc.getElementById('ocr_confirm_tick');
  keyOnlyTick.checked = true;
  keyOnlyTick.onchange();
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false, 'Start enabled once the retained batch is confirmed');
});

testAsync('UI save injects the image only on a covered question', async () => {
  const timeouts = [];
  const ui = uiHarness.createUI({
    storage: imageStorage('stim-save'),
    onLongTimeout: ms => timeouts.push(ms),
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 500)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 501)' }
    ]
  });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  await ui.submit();
  const first = ui.posts[0].body;
  eq(first.get('question_text'), 'Shared table question thirteen');
  assert(first.get('question_image') !== ui.doc.getElementById('ocr_img_file_0').files[0], 'uncovered question got the image');

  await ui.submit();
  const second = ui.posts[1].body;
  eq(second.get('question_text'), 'First table question fourteen');
  eq(second.get('question_image').name, 'table.png');
  eq(second.get('question_image').size, 1234);
  assert(timeouts.indexOf(30000) > -1, 'missing 30-second timeout: ' + timeouts.join(','));
  assert(timeouts.indexOf(60000) > -1, 'missing 60-second timeout: ' + timeouts.join(','));
});

testAsync('UI dry run reports an attached image and posts nothing', async () => {
  const ui = uiHarness.createUI({ storage: imageStorage('stim-dry') });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  await ui.click('ocr_auto_dry');
  eq(ui.posts.length, 0);
  const status = ui.doc.getElementById('ocr_dry_status').textContent;
  assert(status.indexOf('image attached') > -1, 'dry run did not report the image: ' + status);
});

testAsync('UI saved log keeps its shape when the save used an image', async () => {
  const storage = imageStorage('stim-log');
  storage.ocrQueue.i = 1;
  const ui = uiHarness.createUI({ storage });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  await ui.submit();
  const entry = ui.storage.get('ocrSavedLog')[0];
  eq(Object.keys(entry).sort(), ['at', 'batchId', 'fp', 'id', 'inactive', 'mode', 'num']);
});

testAsync('UI plan row stays Ready across covered saves in the batch', async () => {
  const storage = imageStorage('stim-clear');
  storage.ocrQueue.i = 1;
  const ui = uiHarness.createUI({
    storage,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 500)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 501)' }
    ]
  });
  chooseImage(ui, 'ocr_img_file_0', fakeImage('table.png'));
  ui.click('ocr_img_attach_0');
  await ui.submit();
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready', 'Q15 still needs the shared image');
  await ui.submit();
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true);
});

test('PC04 BLOCK-1 to BLOCK-11: exact frozen vectors and controls', () => {
  const O = 'A. one\nB. two\nC. three\nD. four';
  const H = '19. Which statement is correct?\n' + O;
  const I = 'Use the diagram below to answer questions 20 to 22.';
  const suffix = [20, 21, 22, 23, 24, 25, 26]
    .map(n => n + '. Which of the following is correct here?\n' + O)
    .join('\n\n');
  const full = prefix => prefix + '\n\n' + suffix;

  const s1 = parser.parsePaste(full('19. What does the diagram below, used for questions 20 to 22, show?\n[image]\n' + O));
  eq(s1.items[0].d, 'four', 'S1 Q19.D');
  eq(s1.items[0].stimuli[0].nums, [], 'S1 empty nums');
  eq(s1.items.filter(item => item.needsImage), [], 'S1 no needsImage');

  for (const [label, q19Text] of [
    ['S2', '19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nd) "' + I + '"\n[image]'],
    ['S3', '19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nD/ "' + I + '"\n[image]'],
    ['S4', '19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nD.\n"' + I + '"\n[image]'],
    ['unquoted S4', '19. Which of these instructions mentions the diagram?\nA. one\nB. two\nC. three\nD.\n' + I + '\n[image]'],
    ['S5', '19. Which of these instructions mentions the diagram? A. one B. two C. three D. "' + I + '"\n[image]']
  ]) {
    const res = parser.parsePaste(full(q19Text));
    eq(res.items[0].stimuli[0].nums, [], label + ' nums');
    eq(res.items.filter(item => item.needsImage), [], label + ' needsImage');
    assert(res.items[0].d.includes(I), label + ' keeps intro in Q19.D');
  }

  for (const [label, ending, wantNums] of [
    ['N1', '25 October 2023 is the issue date.', [20, 21, 22]],
    ['N2', '25-10-2023 is the issue date.', [20, 21, 22]],
    ['N3', '1,200 copies were issued.', [20, 21, 22]],
    ['N4', '25 dollars is the deposit.', [20, 21, 22]],
    ['N5', '25.50 is the balance.', [20, 21, 22]],
    ['V6', '25 in cash was deposited.', [20, 21, 22]],
    ['V9', '25 in the local currency was deposited.', [20, 21, 22]],
    ['V9-ctrl', '25 in the section below.', [20, 21, 22, 25]],
    ['adv-bank', '25 in the bank was deposited.', [20, 21, 22]],
    ['V10', '25 in the table is the cash deposit.', [20, 21, 22]],
    ['V11', '25 in the same section.', [20, 21, 22, 25]],
    ['V11-ctrl', '25 in this section.', [20, 21, 22, 25]]
  ]) {
    const intro = 'Use the diagram below to answer questions 20 to 22, ' + ending;
    const res = parser.parsePaste(full(H + '\n\n' + intro + '\n[image]'));
    const q19 = res.items[0];
    eq(q19.d, 'four', label + ' Q19.D');
    eq(q19.flags, [], label + ' Q19 flags');
    eq(q19.stimuli.length, 1, label + ' one stimulus');
    eq(q19.stimuli[0].text, intro, label + ' literal intro');
    eq(q19.stimuli[0].nums, wantNums, label + ' nums');
    eq(q19.stimuli[0].missing, [], label + ' missing');
    eq(res.items.filter(item => item.needsImage).map(item => item.num), wantNums, label + ' flagged items');
  }

  for (const [label, marker] of [['G1', '[image]]'], ['G2', '[[image]'], ['G3', '[image: 21]]'], ['G4', '[[image: 21]'], ['V8-close', '[[image: 21]]]'], ['V8-open', '[[[image: 21]]'], ['diag-bad', '[diagram]]'], ['missing', '[missing text]']]) {
    const bad = parser.parsePaste(full(H + '\n' + I + '\n' + marker));
    eq(bad.items[0].stimuli, undefined, label + ' no stimulus');
    eq(bad.items[0].d, 'four ' + I + ' ' + marker, label + ' Q19.D preserved');
  }

  const a1 = parser.parsePaste(full(H + '\n' + I + '\nBalance: 500\nOrdinary explanatory prose stays in this option.\n[image]'));
  eq(a1.items[0].d, 'four Ordinary explanatory prose stays in this option.', 'A1 Q19.D preserved');
  eq(a1.items[0].stimuli[0].nums, [], 'A1 empty nums');
  const a3 = parser.parsePaste(full(H + '\n' + I + '\nBalance: 500\nOrdinary explanatory prose stays in this option.\n[image: 21]'));
  eq(a3.items[0].d, 'four Ordinary explanatory prose stays in this option.', 'A3 Q19.D preserved');
  eq(a3.items[0].stimuli[0].nums, [21], 'A3 explicit range');

  const r1 = parser.parsePaste(full(H + '\nAnswer questions 20, 22 and 24.'));
  eq(r1.items[0].d, 'four', 'R1 Q19.D');
  eq(r1.items[1].sectionInstruction, 'Answer questions 20, 22 and 24.', 'R1 Q20 sectionInstruction');
});

test('PC05 and PC07 parser additions: constantText, [diagram], leading stimuli, gap recovery, [missing text], and wrap safety', () => {
  const interText = fs.readFileSync(path.join(INPUT_DIR, 'new-edge-inter-question-text.txt'), 'utf8');
  const parsedText = parser.parsePaste(interText);
  eq(parsedText.items[0].d, 'a delivery note');
  eq(parsedText.items[0].stimuli[0].needsImage, false);
  eq(parsedText.items.filter(item => item.needsImage), []);
  eq(parsedText.items[1].constantText, 'Opening stock 4,000\nClosing stock 12,000\nPurchases 17,000');
  eq(parsedText.items[2].constantText, 'Opening stock 4,000\nClosing stock 12,000\nPurchases 17,000');

  const interDiag = fs.readFileSync(path.join(INPUT_DIR, 'new-edge-inter-question-diagram.txt'), 'utf8');
  const parsedDiag = parser.parsePaste(interDiag);
  eq(parsedDiag.items[0].d, 'credit transfer.');
  eq(parsedDiag.items[0].stimuli[0].needsImage, true);
  eq(parsedDiag.items.filter(item => item.needsImage).map(item => item.num), [21, 22, 23]);
  eq(parsedDiag.items[1].constantText, undefined);

  const leading = parser.parsePaste([
    'WASSCE 2021 COMMERCE',
    'Use the following information to answer questions 1 and 2.',
    'Bamidele Co.Ltd has authorized capital of 40,000,000 shares.',
    '',
    '1. First question stem here?',
    'A. one B. two C. three D. four',
    '',
    '2. Second question stem here?',
    'A. one B. two C. three D. four'
  ].join('\n'));
  eq(leading.items[0].constantText, 'Bamidele Co.Ltd has authorized capital of 40,000,000 shares.');
  eq(leading.items[1].constantText, 'Bamidele Co.Ltd has authorized capital of 40,000,000 shares.');
  eq(leading.items[0].needsImage, undefined);

  const diagCartoon = parser.parsePaste([
    '14. Previous question stem here?',
    'A. one B. two C. three D. legal rights',
    '',
    '[diagram]',
    '',
    'Use the cartoon in Fig 1 to answer questions 15 and 16.',
    '',
    '15. Question fifteen stem here?',
    'A. one B. two C. three D. four',
    '',
    '16. Question sixteen stem here?',
    'A. one B. two C. three D. four'
  ].join('\n'));
  eq(diagCartoon.items[0].d, 'legal rights');
  eq(diagCartoon.items.filter(item => item.needsImage).map(item => item.num), [15, 16]);

  const unanchoredWrap = parser.parsePaste([
    '46. Which of the following is the best way?',
    'A. Acquisition',
    'B. Standing',
    'C. Learning',
    'D. Undergoing mentorship under prominent political',
    'leaders',
    '',
    '47. Next question stem here?',
    'A. one B. two C. three D. four'
  ].join('\n'));
  eq(unanchoredWrap.items[0].d, 'Undergoing mentorship under prominent political leaders');
  eq(unanchoredWrap.items[0].flags, []);

  const gapDialogue = parser.parsePaste([
    '33. Political parties intend to implement manifestoes?',
    'A. campaigns B. manifestoes C. agenda D. propaganda',
    '',
    'Use the dialogue below to answer questions 34 and 35.',
    'Mr. Ganaba: Where are you going today?',
    'Mr. Katoun: Going to the farm for market day.',
    '',
    'From the dialogue above, Mr. Katoun demonstrated',
    'A. survival mode',
    'B. intolerance',
    'C. apathy',
    'D. hard work',
    '',
    'As seen in the dialogue above, Mr. Ganaba acted as',
    'A. mobilizer',
    'B. analyst',
    'C. observer',
    'D. [Option missing]',
    '',
    '36. The constitution specifies rights?',
    'A. one B. two C. three D. four'
  ].join('\n'));
  eq(gapDialogue.items.map(item => item.num), [33, 34, 35, 36]);
  eq(gapDialogue.items[0].d, 'propaganda');
  eq(gapDialogue.items[1].constantText, 'Mr. Ganaba: Where are you going today?\nMr. Katoun: Going to the farm for market day.');
  eq(gapDialogue.items[2].constantText, 'Mr. Ganaba: Where are you going today?\nMr. Katoun: Going to the farm for market day.');
  assert(gapDialogue.items[2].flags.includes('[missing text] placeholder'));
});

testAsync('UI Track 2: constant_text fill/clear, ready-image pause/resume, missing-text, RAM cache, and concurrency hardening', async () => {
  const storage = {
    ocrQueue: {
      items: [
        {
          num: 19, question: 'Standalone before stimulus', a: 'a', b: 'b', c: 'c', d: 'd', flags: [],
          stimuli: [{ id: 'stim-1', order: 1, sourceNum: 19, nums: [20, 21], marker: 'Use...', text: 'Passage', needsImage: true, missing: [] }]
        },
        { num: 20, question: 'Image covered twenty', a: 'a', b: 'b', c: 'c', d: 'd', flags: [], needsImage: true },
        { num: 21, question: 'Text stimulus twenty one', a: 'a', b: 'b', c: 'c', d: 'd', flags: [], constantText: 'Shared passage line' },
        { num: 22, question: 'Uncovered image pause target', a: 'a', b: 'b', c: 'c', d: 'd', flags: [], needsImage: true }
      ],
      i: 0,
      batchId: 't2-batch'
    },
    ansKey: { 19: 'A', 20: 'B', 21: 'C', 22: 'D' },
    ansKeyBatch: 't2-batch',
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  };
  const ui = uiHarness.createUI({
    storage,
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 601)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 602)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 603)' }
    ]
  });
  ui.setField('constant_text', 'stale prefill text');
  ui.reinject();
  eq(ui.form.elements.constant_text.value, '', 'standalone item clears stale constant_text');
  eq(ui.submitListenersCount(), 1, 'reinjection does not stack submit listeners');
  eq(ui.visibilityListenersCount(), 1, 'reinjection does not stack visibility listeners');
  eq(ui.activeIntervals(), 1, 'reinjection does not stack intervals');
  eq(ui.doc.getElementById('ocr_confirm_tick').checked, false, 're-activation clears the confirmation');
  const trackTick = ui.doc.getElementById('ocr_confirm_tick');
  trackTick.checked = true;
  trackTick.onchange();

  const png = new ui.sandbox.File(['\x89PNG\r\n\x1a\n'], 'diag.png', { type: 'image/png' });
  chooseImage(ui, 'ocr_img_file_0', png);
  ui.doc.getElementById('ocr_img_range_0').value = '20';
  ui.click('ocr_img_attach_0');
  await ui.flush();
  // Simulate mobile URI expiry after RAM caching: cached File stays valid!
  png.arrayBuffer = async () => { throw new Error('expired content uri'); };

  await ui.click('ocr_auto_start');
  await waitFor(() => ui.doc.getElementById('ocr_live_status').textContent.indexOf('PAUSED (IMAGE)') === 0, 'paused at uncovered Q22');
  eq(ui.posts.length, 3, 'Q19-Q21 saved before Q22 pause with 0 POSTs for Q22');
  eq(ui.posts[0].body.get('question_image').name, undefined, 'Q19 gets no image');
  eq(ui.posts[0].body.get('constant_text'), '');
  eq(ui.posts[1].body.get('question_image').name, 'diag.png', 'Q20 uploads RAM-cached image');
  eq(ui.posts[2].body.get('constant_text'), 'Shared passage line', 'Q21 sends constant_text');
  eq(ui.storage.get('ocrQueue').i, 3, 'stopped cleanly at Q22');

  // Corrupt localStorage handling & missing-text block
  const missingUi = uiHarness.createUI({
    storage: {
      ocrQueue: { items: [{ num: 1, question: 'Q [missing text]', a: 'a', b: 'b', c: 'c', d: 'd', flags: ['[missing text] placeholder'] }], i: 0, batchId: 'm1' },
      ansKey: { 1: 'A' }, ansKeyBatch: 'm1', ansKeyConflicts: [], ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' }, ocrSavedLog: []
    }
  });
  eq(missingUi.doc.getElementById('ocr_auto_start').disabled, true, 'missing-text disables Start');
  await missingUi.click('ocr_auto_start');
  eq(missingUi.posts.length, 0);

  // Unbatched manual queue must NOT pre-tick stale retained ansKey in fillForm/tick
  const manualQueueUi = uiHarness.createUI({
    storage: {
      ocrQueue: { items: [{ num: 1, question: 'Manual queue item', a: 'a', b: 'b', c: 'c', d: 'd', flags: [] }], i: 0 },
      ansKey: { 1: 'A' },
      ansKeyBatch: 'other-batch',
      ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
      ocrSavedLog: []
    }
  });
  assert(manualQueueUi.doc.radios.every(r => !r.checked), 'unbatched manual queue does not pre-tick retained ansKey');
  await manualQueueUi.click('ocr_auto_start');
  eq(manualQueueUi.posts.length, 0, 'unbatched queue blocks Start with 0 POSTs');
  assert(manualQueueUi.doc.getElementById('ocr_live_blocked').textContent.includes('no batch identity'), 'unbatched queue reports batch-missing');

  // Concurrent manual save during in-flight POST after reinjection cannot double-POST
  let resolveSlow;
  let postCount = 0;
  const slowUi = uiHarness.createUI({
    storage: uiHarness.sampleStorage('slow-b'),
    reply: () => {
      postCount++;
      if (postCount === 1) return new Promise(resolve => { resolveSlow = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 501)' };
    }
  });
  slowUi.storage.set('ocrSubmitted', true);
  slowUi.form.dispatch('submit');
  slowUi.reinject();
  eq(slowUi.storage.get('ocrSubmitted'), null, 'clears stale ocrSubmitted marker defensively');
  slowUi.form.dispatch('submit');
  eq(slowUi.posts.length, 1, 'reinjection during in-flight save prevents second POST');
  resolveSlow({ redirected: true, text: 'Question saved successfully (Question ID: 500)' });
  await slowUi.flush();
  eq(slowUi.posts.length, 1, 'still only 1 POST after settlement');
  eq(slowUi.storage.get('ocrQueue').i, 1, 'advanced once');
});

testAsync('BLOCK-12: lost save response and AbortError timeout keep ocrSaving and block duplicate POSTs', async () => {
  for (const [label, makeErr] of [
    ['transport', () => new Error('Failed to fetch')],
    ['timeout', () => Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })]
  ]) {
    const storage = uiHarness.sampleStorage('b12-' + label);
    const ui = uiHarness.createUI({
      storage,
      reply: () => Promise.reject(makeErr())
    });
    await ui.submit();
    eq(ui.posts.length, 1, label + ': 1 POST issued');
    eq(ui.storage.get('ocrQueue').i, 0, label + ': queue index remains 0');
    eq(ui.storage.get('ocrSavedLog'), [], label + ': no verified save logged');
    assert(ui.storage.get('ocrSaving'), label + ': pending ocrSaving marker kept');
    eq(ui.doc.getElementById('ans_res').textContent, 'Unknown. It may have saved. Check the list.', label + ': uncertain warning shown');
    eq(ui.doc.getElementById('ocr_paused').hidden, false, label + ': paused warning visible');
    eq(ui.doc.getElementById('ocr_auto_start').disabled, true, label + ': Start disabled');
    await ui.submit();
    await ui.click('ocr_auto_start');
    eq(ui.posts.length, 1, label + ': subsequent manual Save and Start issue 0 extra POSTs');
  }
});

testAsync('BLOCK-13: reinjection during delayed save adopts settled queue and logs Q2 as book 2', async () => {
  const twoItemQueue = {
    ocrQueue: {
      items: [
        { num: 1, question: 'PC07 R7 repeat activation first question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] },
        { num: 2, question: 'PC07 R7 repeat activation second question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] }
      ],
      i: 0,
      batchId: 'b13-batch'
    },
    ansKey: { 1: 'A', 2: 'C' },
    ansKeyBatch: 'b13-batch',
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  };
  let resolveQ1;
  let calls = 0;
  const ui = uiHarness.createUI({
    storage: JSON.parse(JSON.stringify(twoItemQueue)),
    reply: () => {
      calls++;
      if (calls === 1) return new Promise(resolve => { resolveQ1 = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 501)' };
    }
  });
  ui.form.dispatch('submit');
  eq(ui.posts.length, 1, 'Q1 posted once');
  ui.reinject();
  eq(ui.doc.submitButton.disabled, true, 'Save disabled after reinjection while pending');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true, 'Start disabled after reinjection while pending');
  ui.form.dispatch('submit');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 1, 'pending Save/Start blocked');

  resolveQ1({ redirected: true, text: 'Question saved successfully (Question ID: 500)' });
  await ui.flush();
  eq(ui.storage.get('ocrQueue').i, 1, 'queue advanced to index 1');
  eq(ui.storage.get('ocrSavedLog').map(e => e.num), [1], 'Q1 logged once');
  eq(ui.form.elements.question_text.value, 'PC07 R7 repeat activation second question?', 'Q2 filled after settlement');
  eq(ui.doc.radios[2].checked, true, 'Q2 radio C ticked');
  assert(ui.doc.getElementById('ocr_status').innerHTML.includes('book number 2'), 'status shows Q2 book number 2');

  await ui.submit();
  eq(ui.posts.length, 2, 'Q2 posted once');
  eq(ui.storage.get('ocrQueue').i, 2, 'final queue index is 2');
  eq(ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, id: e.id })), [
    { num: 1, id: 500 },
    { num: 2, id: 501 }
  ], 'Q1 #500 and Q2 #501 logged with right book numbers');

  let resolveReject;
  const rejUi = uiHarness.createUI({
    storage: JSON.parse(JSON.stringify(twoItemQueue)),
    reply: () => {
      if (!resolveReject) return new Promise(resolve => { resolveReject = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 600)' };
    }
  });
  rejUi.form.dispatch('submit');
  rejUi.reinject();
  resolveReject({ redirected: false, text: '<div class="admin-error">Validation failed.</div>', errorText: 'Validation failed.' });
  await rejUi.flush();
  eq(rejUi.storage.get('ocrQueue').i, 0, 'rejected delayed save stays at index 0');
  eq(rejUi.storage.get('ocrSavedLog'), [], 'rejected save writes no log');
  eq(rejUi.form.elements.question_text.value, 'PC07 R7 repeat activation first question?', 'Q1 stays on form');
  eq(rejUi.doc.radios[0].checked, true, 'Q1 radio A stays checked');
  await rejUi.submit();
  eq(rejUi.posts.length, 2, 'Q1 retry succeeds once');
  eq(rejUi.storage.get('ocrQueue').i, 1, 'retry advances only to index 1');
});

testAsync('BLOCK-14: leading unassociated [image] pauses at Q1 with 0 POSTs', async () => {
  const paste = [
    '[image]',
    '',
    '1. PC07 R7 leading image first question?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '2. PC07 R7 leading image second question?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '=== ANSWER KEY ===',
    '1. A',
    '2. B'
  ].join('\n');
  const parsed = parser.parsePaste(paste);
  eq(parsed.items[0].stimuli.length, 1, 'one unresolved block');
  eq(parsed.items[0].stimuli[0].sourceNum, null, 'leading block preserves sourceNum null');
  eq(parsed.items[0].stimuli[0].nums, [], 'no guessed target');

  const ui = uiHarness.createUI({
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 500)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 501)' }
    ]
  });
  ui.setPaste(paste);
  ui.click('ocr_load');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('PAUSED') === 0, 'dry pauses');
  assert(ui.doc.getElementById('ocr_dry_status').textContent.includes('#1'), 'dry pauses at #1: ' + ui.doc.getElementById('ocr_dry_status').textContent);
  await ui.click('ocr_auto_start');
  assert(ui.doc.getElementById('ocr_live_status').textContent.indexOf('PAUSED (IMAGE)') === 0, 'live pauses for image');
  assert(ui.doc.getElementById('ocr_live_status').textContent.includes('question 1'), 'live pauses at Q1: ' + ui.doc.getElementById('ocr_live_status').textContent);
  eq(ui.posts.length, 0, '0 POSTs before pause');
  eq(ui.storage.get('ocrQueue').i, 0, 'still at index 0');

  ui.doc.getElementById('ocr_img_range_0').value = '1';
  chooseImage(ui, 'ocr_img_file_0', fakeImage('lead.png'));
  ui.click('ocr_img_attach_0');
  await ui.flush();
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.storage.get('ocrQueue').i === 2, 'Q1 saves with attached image and Q2 completes');
  eq(ui.posts.length, 2, 'Q1 and ordinary Q2 posted');
  eq(ui.posts[0].body.get('question_image').name, 'lead.png', 'Q1 uploads attached PNG');
  eq(ui.posts[1].body.get('question_image').name, undefined, 'Q2 stays image-free');

  // Control: trailing block after Q1 with range Q2-Q3 permits Q1 and pauses at uncovered Q2.
  const trailingPaste = [
    '1. First standalone question?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    'Use the diagram below to answer questions 2 to 3.',
    '[image]',
    '',
    '2. Second question?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '3. Third question?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '=== ANSWER KEY ===',
    '1. A',
    '2. B',
    '3. C'
  ].join('\n');
  const ctrlUi = uiHarness.createUI({
    inactiveChecked: true,
    replies: [{ redirected: true, text: 'Question saved successfully (Question ID: 510)' }]
  });
  ctrlUi.setPaste(trailingPaste);
  ctrlUi.click('ocr_load');
  await waitFor(() => ctrlUi.doc.getElementById('ocr_dry_status').textContent.indexOf('PAUSED') === 0, 'trailing dry pauses at #2');
  assert(ctrlUi.doc.getElementById('ocr_dry_status').textContent.includes('#2'));
  await ctrlUi.click('ocr_auto_start');
  await waitFor(() => ctrlUi.doc.getElementById('ocr_live_status').textContent.indexOf('PAUSED (IMAGE)') === 0, 'trailing pauses at Q2');
  eq(ctrlUi.posts.length, 1, 'trailing control saves Q1 before pausing at Q2');
  eq(ctrlUi.storage.get('ocrQueue').i, 1, 'trailing control stops at index 1');
});

testAsync('BLOCK-15: partial bulk Attach never adopts pending single-file selection', async () => {
  const paste = [
    '1. First question standalone stem?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '[image: 2]',
    '',
    '2. Second question image target?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '[image: 3]',
    '',
    '3. Third question image target?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '=== ANSWER KEY ===',
    '1. A',
    '2. B',
    '3. C'
  ].join('\n');
  const ui = uiHarness.createUI({
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 500)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 501)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 502)' }
    ]
  });
  ui.setPaste(paste);
  ui.click('ocr_load');
  chooseImage(ui, 'ocr_img_file_1', fakeImage('pc07-stale-not-attached.png', 111));
  const bulkInput = ui.doc.getElementById('ocr_img_bulk_files');
  bulkInput.files = [fakeImage('pc07-bulk-picked.png', 222)];
  ui.click('ocr_img_bulk');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'Ready', 'first block attached from bulk pick');
  eq(ui.doc.getElementById('ocr_img_status_1').textContent, 'No image', 'omitted second block stays No image');
  await waitFor(() => ui.doc.getElementById('ocr_dry_status').textContent.indexOf('PAUSED') === 0, 'dry finishes before Start');
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.doc.getElementById('ocr_live_status').textContent.indexOf('PAUSED (IMAGE)') === 0, 'pauses at Q3');
  eq(ui.posts.length, 2, 'only Q1 and Q2 posted; Q3 got 0 POSTs');
  eq(ui.posts[1].body.get('question_image').name, 'pc07-bulk-picked.png', 'Q2 uses bulk-picked PNG');

  // Control: ordered two-file bulk Attach marks both blocks Ready and saves all 3.
  const fullBulkUi = uiHarness.createUI({
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 520)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 521)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 522)' }
    ]
  });
  fullBulkUi.setPaste(paste);
  fullBulkUi.click('ocr_load');
  fullBulkUi.doc.getElementById('ocr_img_bulk_files').files = [
    fakeImage('bulk-1.png', 101),
    fakeImage('bulk-2.png', 202)
  ];
  fullBulkUi.click('ocr_img_bulk');
  eq(fullBulkUi.doc.getElementById('ocr_img_status_0').textContent, 'Ready');
  eq(fullBulkUi.doc.getElementById('ocr_img_status_1').textContent, 'Ready');
  await waitFor(() => fullBulkUi.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE') === 0, 'two-file dry complete');
  await fullBulkUi.click('ocr_auto_start');
  await waitFor(() => fullBulkUi.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE') === 0, 'two-file bulk completes');
  eq(fullBulkUi.posts.length, 3);
  eq(fullBulkUi.posts[1].body.get('question_image').name, 'bulk-1.png');
  eq(fullBulkUi.posts[2].body.get('question_image').name, 'bulk-2.png');
});

testAsync('BLOCK-16: leading shared Constant Text with [missing text] blocks Start with 0 POSTs', async () => {
  const paste = [
    'Use the information below to answer questions 1 and 2.',
    'Opening balance [missing text]',
    'Closing stock unknown',
    '',
    '1. First clean question stem here?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '2. Second clean question stem here?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '=== ANSWER KEY ===',
    '1. A',
    '2. B'
  ].join('\n');
  const parsed = parser.parsePaste(paste);
  eq(parsed.items[0].constantText, 'Opening balance [missing text]\nClosing stock unknown');
  eq(parsed.items[1].constantText, 'Opening balance [missing text]\nClosing stock unknown');
  assert(parsed.items[0].flags.includes(parser.MISSING_TEXT_FLAG), 'Q1 carries missing-text flag');
  assert(parsed.items[1].flags.includes(parser.MISSING_TEXT_FLAG), 'Q2 carries missing-text flag');

  const ui = uiHarness.createUI();
  ui.setPaste(paste);
  ui.click('ocr_load');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true, 'Start disabled');
  assert(ui.doc.getElementById('ocr_live_blocked').textContent.includes('[missing]'), 'blocked explains missing marker');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 0, '0 POSTs');

  const clean = parser.parsePaste(paste.replace(' [missing text]', ''));
  eq(clean.items[0].flags, [], 'clean body without marker has no flags');
  eq(clean.items[1].flags, [], 'clean Q2 without marker has no flags');
});

test('BLOCK-17: anchored extraction preserves wrapped Option D continuation after [image]', () => {
  const O = 'A. one\nB. two\nC. three\nD. four';
  const paste = [
    '19. Which of the following is the best way?',
    'A. one',
    'B. two',
    'C. three',
    'D. Undergoing mentorship under prominent political',
    'Use the diagram below to answer questions 20 to 22.',
    '[image]',
    'leaders',
    '',
    '20. Question twenty?',
    O,
    '',
    '21. Question twenty one?',
    O,
    '',
    '22. Question twenty two?',
    O
  ].join('\n');
  const res = parser.parsePaste(paste);
  eq(res.items[0].d, 'Undergoing mentorship under prominent political leaders', 'Q19.D preserves leaders');
  eq(res.items[0].flags, [], 'Q19 unflagged');
  eq(res.items[0].stimuli.length, 1, 'one stimulus');
  eq(res.items[0].stimuli[0].text, 'Use the diagram below to answer questions 20 to 22.', 'intro-only metadata');
  eq(res.items[0].stimuli[0].nums, [20, 21, 22], 'targets Q20-Q22');
  eq(res.items.filter(item => item.needsImage).map(item => item.num), [20, 21, 22], 'Q20-Q22 flagged');
});

testAsync('BLOCK-18: deliberately pasted key applies to unbatched manual-helper queue without enabling autosave', async () => {
  const manualStorage = {
    ocrQueue: {
      items: [
        { num: 1, question: 'Manual queue one?', a: 'a1', b: 'b1', c: 'c1', d: 'd1', flags: [] },
        { num: 2, question: 'Manual queue two?', a: 'a2', b: 'b2', c: 'c2', d: 'd2', flags: [] }
      ],
      i: 0
    },
    ansKey: { 1: 'A', 2: 'B' },
    ansKeyBatch: 'prior-batch',
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  };
  const ui = uiHarness.createUI({ storage: manualStorage });
  assert(ui.doc.radios.every(r => !r.checked), 'prior key inert initially');
  ui.reinject();
  assert(ui.doc.radios.every(r => !r.checked), 'prior key inert on re-entry');

  ui.setPaste('Answer Key\n1. D\n2. C');
  ui.click('ocr_load');
  eq(ui.doc.radios[3].checked, true, 'deliberate key Load ticks Q1 Option D');
  ui.click('ocr_skip');
  eq(ui.doc.radios[2].checked, true, 'Q2 ticks Option C after Skip');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 0, 'unbatched Start safety gate remains enforced');

  // When manual helper replaces the queue again (without batchId or how), key becomes inert again.
  const replaced = uiHarness.createUI({
    storage: {
      ocrQueue: {
        items: [
          { num: 1, question: 'Replaced manual one?', a: 'a', b: 'b', c: 'c', d: 'd', flags: [] }
        ],
        i: 0
      },
      ansKey: ui.storage.get('ansKey'),
      ansKeyBatch: ui.storage.get('ansKeyBatch'),
      ocrMeta: manualStorage.ocrMeta,
      ocrSavedLog: []
    }
  });
  assert(replaced.doc.radios.every(r => !r.checked), 'key becomes inert after manual helper replaces queue');
});

testAsync('BLOCK-19 and BLOCK-20: directional-word cash predicate and malformed year endpoint controls', async () => {
  const O = 'A. one\nB. two\nC. three\nD. four';
  const H = '19. Which statement is correct?\n' + O;
  const suffix = [20, 21, 22, 23, 24, 25, 26]
    .map(n => n + '. Which of the following is correct here?\n' + O)
    .join('\n\n');
  const full = prefix => prefix + '\n\n' + suffix;

  const b19Neg = parser.parsePaste(full(H + '\n\nUse the diagram below to answer questions 20 to 22, 25 in the table above is the cash deposit.\n[image]'));
  eq(b19Neg.items[0].d, 'four', 'BLOCK-19 neg Q19.D');
  eq(b19Neg.items[0].stimuli[0].nums, [20, 21, 22], 'BLOCK-19 neg excludes cash 25');
  eq(b19Neg.items.filter(i => i.needsImage).map(i => i.num), [20, 21, 22]);

  const b19Pos = parser.parsePaste(full(H + '\n\nUse the diagram below to answer questions 20 to 22, 25 in the table above.\n[image]'));
  eq(b19Pos.items[0].stimuli[0].nums, [20, 21, 22, 25], 'BLOCK-19 pos includes Q25');

  const b20Malformed = parser.parsePaste(full(H + '\n\nUse the diagram below to answer questions 20 to 2023.\n[image]'));
  eq(b20Malformed.items[0].stimuli[0].nums, [], 'BLOCK-20 malformed year range yields empty nums');
  eq(b20Malformed.items.filter(i => i.needsImage), [], 'BLOCK-20 malformed yields no needsImage');

  const b20Single = parser.parsePaste(full(H + '\n\nUse the diagram below to answer questions 20.\n[image]'));
  eq(b20Single.items[0].stimuli[0].nums, [20], 'BLOCK-20 genuine single reference yields [20]');

  const b20Explicit = parser.parsePaste(full(H + '\n\nUse the diagram below to answer questions 20 to 2023.\n[image: 21]'));
  eq(b20Explicit.items[0].stimuli[0].nums, [21], 'BLOCK-20 explicit [image: 21] wins');

  const ui = uiHarness.createUI();
  ui.setPaste(full(H + '\n\nUse the diagram below to answer questions 20 to 2023.\n[image]'));
  ui.click('ocr_load');
  eq(ui.doc.getElementById('ocr_img_range_0').value, '', 'BLOCK-20 default Attach range is empty');
  eq(ui.doc.getElementById('ocr_img_status_0').textContent, 'No image', 'BLOCK-20 default status is No image');
});

testAsync('Real generated stimulus bookmarklet artifact passes BLOCK-12 to BLOCK-16, BLOCK-18, and BLOCK-22 flows', async () => {
  // BLOCK-12 transport error & AbortError on built artifact
  const b12Ui = uiHarness.createUI({
    built: true,
    storage: uiHarness.sampleStorage('built-b12'),
    reply: () => Promise.reject(new Error('Failed to fetch'))
  });
  await b12Ui.submit();
  assert(b12Ui.storage.get('ocrSaving'), 'built artifact keeps ocrSaving on transport error');
  eq(b12Ui.doc.getElementById('ans_res').textContent, 'Unknown. It may have saved. Check the list.');
  await b12Ui.submit();
  eq(b12Ui.posts.length, 1, 'built artifact prevents retry while marker exists');

  // BLOCK-13 delayed save + reinjection on built artifact
  let resolveBuiltQ1;
  let builtCalls = 0;
  const b13Ui = uiHarness.createUI({
    built: true,
    storage: {
      ocrQueue: {
        items: [
          { num: 1, question: 'Built Q1?', a: 'a1', b: 'b1', c: 'c1', d: 'd1', flags: [] },
          { num: 2, question: 'Built Q2?', a: 'a2', b: 'b2', c: 'c2', d: 'd2', flags: [] }
        ],
        i: 0,
        batchId: 'built-b13'
      },
      ansKey: { 1: 'A', 2: 'C' },
      ansKeyBatch: 'built-b13',
      ansKeyConflicts: [],
      ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
      ocrSavedLog: []
    },
    reply: () => {
      builtCalls++;
      if (builtCalls === 1) return new Promise(resolve => { resolveBuiltQ1 = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 701)' };
    }
  });
  b13Ui.form.dispatch('submit');
  b13Ui.reinject();
  resolveBuiltQ1({ redirected: true, text: 'Question saved successfully (Question ID: 700)' });
  await b13Ui.flush();
  eq(b13Ui.storage.get('ocrQueue').i, 1);
  eq(b13Ui.form.elements.question_text.value, 'Built Q2?');
  eq(b13Ui.doc.radios[2].checked, true);
  await b13Ui.submit();
  eq(b13Ui.posts.length, 2);
  eq(b13Ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, id: e.id })), [
    { num: 1, id: 700 },
    { num: 2, id: 701 }
  ]);

  // BLOCK-14 + BLOCK-16 + BLOCK-18 on built artifact
  const builtUi = uiHarness.createUI({ built: true });
  builtUi.setPaste('[image]\n\n1. Leading Q1?\nA. a\nB. b\nC. c\nD. d\n\n2. Leading Q2?\nA. a\nB. b\nC. c\nD. d\n\n=== ANSWER KEY ===\n1. A\n2. B');
  builtUi.click('ocr_load');
  await builtUi.click('ocr_auto_start');
  assert(builtUi.doc.getElementById('ocr_live_status').textContent.includes('question 1'));
  eq(builtUi.posts.length, 0);

  builtUi.setPaste('Use the information below to answer questions 1 and 2.\nOpening [missing text]\nClosing 10\n\n1. Q1?\nA. a\nB. b\nC. c\nD. d\n\n2. Q2?\nA. a\nB. b\nC. c\nD. d\n\n=== ANSWER KEY ===\n1. A\n2. B');
  builtUi.click('ocr_load');
  eq(builtUi.doc.getElementById('ocr_auto_start').disabled, true);
  await builtUi.click('ocr_auto_start');
  eq(builtUi.posts.length, 0);

  const b18Built = uiHarness.createUI({
    built: true,
    storage: {
      ocrQueue: {
        items: [{ num: 1, question: 'Manual built?', a: 'a', b: 'b', c: 'c', d: 'd', flags: [] }],
        i: 0
      },
      ansKey: { 1: 'A' },
      ansKeyBatch: 'stale-b',
      ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
      ocrSavedLog: []
    }
  });
  assert(b18Built.doc.radios.every(r => !r.checked));
  b18Built.setPaste('Answer Key\n1. D');
  b18Built.click('ocr_load');
  eq(b18Built.doc.radios[3].checked, true);

  // BLOCK-15: real generated stimulus artifact partial bulk + ordered 2-file control
  const b15Paste = [
    '1. First built bulk stem?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '[image: 2]',
    '',
    '2. Second built bulk target?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '[image: 3]',
    '',
    '3. Third built bulk target?',
    'A. one',
    'B. two',
    'C. three',
    'D. four',
    '',
    '=== ANSWER KEY ===',
    '1. A',
    '2. B',
    '3. C'
  ].join('\n');
  const b15Built = uiHarness.createUI({
    built: true,
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 720)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 721)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 722)' }
    ]
  });
  b15Built.setPaste(b15Paste);
  b15Built.click('ocr_load');
  chooseImage(b15Built, 'ocr_img_file_1', fakeImage('pc07-stale-not-attached.png', 111));
  b15Built.doc.getElementById('ocr_img_bulk_files').files = [fakeImage('pc07-bulk-picked.png', 222)];
  b15Built.click('ocr_img_bulk');
  eq(b15Built.doc.getElementById('ocr_img_status_0').textContent, 'Ready', 'built artifact: first block ready from bulk pick');
  eq(b15Built.doc.getElementById('ocr_img_status_1').textContent, 'No image', 'built artifact: omitted second block stays No image');
  await waitFor(() => b15Built.doc.getElementById('ocr_dry_status').textContent.indexOf('PAUSED') === 0, 'built artifact: dry pauses at Q3');
  await b15Built.click('ocr_auto_start');
  await waitFor(() => b15Built.doc.getElementById('ocr_live_status').textContent.indexOf('PAUSED (IMAGE)') === 0, 'built artifact: live pauses at Q3');
  eq(b15Built.posts.length, 2, 'built artifact: 0 Q3 POSTs before explicit Attach');
  eq(b15Built.posts[1].body.get('question_image').name, 'pc07-bulk-picked.png', 'built artifact: Q2 uses bulk-picked PNG');

  b15Built.click('ocr_img_attach_1');
  await b15Built.flush();
  eq(b15Built.doc.getElementById('ocr_img_status_1').textContent, 'Ready', 'built artifact: explicit Attach makes block 2 Ready');
  await b15Built.click('ocr_auto_start');
  await waitFor(() => b15Built.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE') === 0, 'built artifact: resumes and saves Q3');
  eq(b15Built.posts.length, 3, 'built artifact: Q3 posted after explicit Attach');
  eq(b15Built.posts[2].body.get('question_image').name, 'pc07-stale-not-attached.png', 'built artifact: Q3 uses explicitly attached PNG');

  const b15OrderedBuilt = uiHarness.createUI({
    built: true,
    inactiveChecked: true,
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 730)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 731)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 732)' }
    ]
  });
  b15OrderedBuilt.setPaste(b15Paste);
  b15OrderedBuilt.click('ocr_load');
  b15OrderedBuilt.doc.getElementById('ocr_img_bulk_files').files = [
    fakeImage('bulk-1.png', 101),
    fakeImage('bulk-2.png', 202)
  ];
  b15OrderedBuilt.click('ocr_img_bulk');
  eq(b15OrderedBuilt.doc.getElementById('ocr_img_status_0').textContent, 'Ready', 'built artifact: ordered bulk block 0 Ready');
  eq(b15OrderedBuilt.doc.getElementById('ocr_img_status_1').textContent, 'Ready', 'built artifact: ordered bulk block 1 Ready');
  await waitFor(() => b15OrderedBuilt.doc.getElementById('ocr_dry_status').textContent.indexOf('COMPLETE') === 0, 'built artifact: ordered bulk dry complete');
  await b15OrderedBuilt.click('ocr_auto_start');
  await waitFor(() => b15OrderedBuilt.doc.getElementById('ocr_live_status').textContent.indexOf('COMPLETE') === 0, 'built artifact: ordered bulk completes');
  eq(b15OrderedBuilt.posts.length, 3, 'built artifact: ordered bulk saves 3 rows');
  eq(b15OrderedBuilt.posts[1].body.get('question_image').name, 'bulk-1.png', 'built artifact: ordered Q2 gets bulk-1.png');
  eq(b15OrderedBuilt.posts[2].body.get('question_image').name, 'bulk-2.png', 'built artifact: ordered Q3 gets bulk-2.png');
});

testAsync('BLOCK-23: real generated stimulus artifact keeps settlement state consistent after held draft reinjection', async () => {
  const mkStorage = id => ({
    ocrQueue: {
      items: [
        { num: 1, question: 'PC07 RR7 draft generation first question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] },
        { num: 2, question: 'PC07 RR7 draft generation second question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] }
      ],
      i: 0,
      batchId: id
    },
    ansKey: { 1: 'A', 2: 'C' },
    ansKeyBatch: id,
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2021' },
    ocrSavedLog: []
  });

  let resolveQ1;
  let calls = 0;
  const ui = uiHarness.createUI({
    built: true,
    inactiveChecked: false,
    storage: mkStorage('b23-draft-reinject'),
    reply: () => {
      calls++;
      if (calls === 1) return new Promise(resolve => { resolveQ1 = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 741)' };
    }
  });
  const modeBox = ui.doc.getElementById('ocr_active_mode');
  modeBox.checked = false;
  modeBox.onchange();
  const draftConfirm = ui.doc.getElementById('ocr_confirm_tick');
  draftConfirm.checked = true;
  draftConfirm.onchange();
  ui.click('ocr_auto_start');
  await waitFor(() => ui.posts.length === 1, 'Q1 draft POST sent');
  eq(ui.posts[0].body.get('is_active'), null, 'Q1 POST omits is_active');
  eq(ui.posts[0].body.get('autosave'), '1', 'Q1 POST sends autosave=1');

  ui.reinject();
  eq(ui.doc.submitButton.disabled, true, 'Save disabled while Q1 pending');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true, 'Start disabled while Q1 pending');

  resolveQ1({ redirected: true, text: 'Question saved successfully (Question ID: 740)' });
  await ui.flush();

  eq(ui.posts.length, 1, 'no automatic Q2 POST on settlement');
  eq(ui.storage.get('ocrQueue').i, 1, 'queue advances to index 1');
  eq(ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, id: e.id, mode: e.mode, inactive: e.inactive })), [
    { num: 1, id: 740, mode: 'draft', inactive: true }
  ], 'Q1 logged once as draft inactive');
  eq(ui.form.elements.question_text.value, 'PC07 RR7 draft generation second question?', 'Q2 filled on form');
  eq(ui.doc.radios[2].checked, true, 'Q2 radio C ticked');
  assert(ui.doc.getElementById('ocr_live_progress_text').textContent.startsWith('1/2'), 'progress shows 1/2: ' + ui.doc.getElementById('ocr_live_progress_text').textContent);
  eq(ui.doc.getElementById('ocr_saved_box').hidden, false, 'Q1 saved box visible');
  assert(!ui.doc.getElementById('ocr_live_status').textContent.startsWith('RUNNING'), 'no stale RUNNING banner: ' + ui.doc.getElementById('ocr_live_status').textContent);

  // Reinjection initializes Active and requires explicit confirmation before an active POST.
  eq(ui.doc.getElementById('ocr_active_mode').checked, true, 'reinjection initializes Active checkbox');
  const confirmText = el => (el.children || []).map(c => c.textContent || '').join('\n');
  assert(confirmText(ui.doc.getElementById('ocr_batch_confirm')).includes('Mode: ACTIVE'), 'UI visibly says Mode: ACTIVE');
  assert(confirmText(ui.doc.getElementById('ocr_saved_list')).includes('#740'), 'Q1 saved entry #740 visible');
  eq(ui.doc.getElementById('ocr_confirm_tick').checked, false, 'adoption clears confirmation until explicit tick');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, true, 'Start disabled until confirmation ticked');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 1, 'unconfirmed Start sends 0 POSTs');

  // Switching back to explicit Draft and confirming saves Q2 inactive under book 2.
  const mode2 = ui.doc.getElementById('ocr_active_mode');
  mode2.checked = false;
  mode2.onchange();
  const conf2 = ui.doc.getElementById('ocr_confirm_tick');
  conf2.checked = true;
  conf2.onchange();
  assert(confirmText(ui.doc.getElementById('ocr_batch_confirm')).includes('Mode: draft (inactive).'), 'explicit Draft reflected');
  eq(ui.doc.getElementById('ocr_auto_start').disabled, false, 'Start enabled once Draft confirmed');
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.storage.get('ocrQueue').i === 2, 'Q2 completes');
  eq(ui.posts.length, 2, 'Q2 posted once');
  eq(ui.posts[1].body.get('is_active'), null, 'Q2 Draft POST omits is_active');
  eq(ui.posts[1].body.get('autosave'), '1', 'Q2 POST sends autosave=1');
  eq(ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, id: e.id, mode: e.mode })), [
    { num: 1, id: 740, mode: 'draft' },
    { num: 2, id: 741, mode: 'draft' }
  ], 'Q2 logged under book 2 as draft');

  // Explicit Active confirmation after settlement sends is_active=1.
  let resolveActiveQ1;
  let activeCalls = 0;
  const activeUi = uiHarness.createUI({
    built: true,
    inactiveChecked: true,
    storage: mkStorage('b23-active-confirm'),
    reply: () => {
      activeCalls++;
      if (activeCalls === 1) return new Promise(resolve => { resolveActiveQ1 = resolve; });
      return { redirected: true, text: 'Question saved successfully (Question ID: 751)' };
    }
  });
  activeUi.doc.getElementById('ocr_active_mode').checked = false;
  activeUi.doc.getElementById('ocr_active_mode').onchange();
  activeUi.doc.getElementById('ocr_confirm_tick').checked = true;
  activeUi.doc.getElementById('ocr_confirm_tick').onchange();
  activeUi.click('ocr_auto_start');
  await waitFor(() => activeUi.posts.length === 1, 'active path Q1 posted');
  activeUi.reinject();
  resolveActiveQ1({ redirected: true, text: 'Question saved successfully (Question ID: 750)' });
  await activeUi.flush();
  eq(activeUi.doc.getElementById('ocr_confirm_tick').checked, false, 'active path also requires confirmation');
  activeUi.doc.getElementById('ocr_confirm_tick').checked = true;
  activeUi.doc.getElementById('ocr_confirm_tick').onchange();
  await activeUi.click('ocr_auto_start');
  await waitFor(() => activeUi.storage.get('ocrQueue').i === 2, 'active path Q2 completes');
  eq(activeUi.posts[1].body.get('is_active'), '1', 'explicit Active confirmation sends is_active=1');

  // Control: no-reinjection draft run saves both rows as draft without is_active.
  const ctrlUi = uiHarness.createUI({
    built: true,
    inactiveChecked: false,
    storage: mkStorage('b23-draft-ctrl'),
    replies: [
      { redirected: true, text: 'Question saved successfully (Question ID: 760)' },
      { redirected: true, text: 'Question saved successfully (Question ID: 761)' }
    ]
  });
  ctrlUi.doc.getElementById('ocr_active_mode').checked = false;
  ctrlUi.doc.getElementById('ocr_active_mode').onchange();
  ctrlUi.doc.getElementById('ocr_confirm_tick').checked = true;
  ctrlUi.doc.getElementById('ocr_confirm_tick').onchange();
  await ctrlUi.click('ocr_auto_start');
  await waitFor(() => ctrlUi.storage.get('ocrQueue').i === 2, 'no-reinjection draft completes');
  eq(ctrlUi.posts.length, 2);
  eq(ctrlUi.posts[0].body.get('is_active'), null, 'ctrl Q1 omits is_active');
  eq(ctrlUi.posts[1].body.get('is_active'), null, 'ctrl Q2 omits is_active');
});

testAsync('BLOCK-24: real generated stimulus artifact keeps confirmation cleared through a key-only Load', async () => {
  const mkStorage = id => ({
    ocrQueue: {
      items: [
        { num: 1, question: 'PC07 RR8 key only first question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] },
        { num: 2, question: 'PC07 RR8 key only second question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] }
      ],
      i: 1,
      batchId: id
    },
    ansKey: { 1: 'A', 2: 'C' },
    ansKeyBatch: id,
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2083' },
    ocrSavedLog: [{ num: 1, id: 119, mode: 'draft', inactive: true, batchId: id }]
  });

  // Adopted batch state: Active selected, confirmation unchecked, Start disabled.
  const ui = uiHarness.createUI({ built: true, storage: mkStorage('b24-key-only') });
  const mode = ui.doc.getElementById('ocr_active_mode');
  const tickEl = () => ui.doc.getElementById('ocr_confirm_tick');
  const start = ui.doc.getElementById('ocr_auto_start');
  eq(mode.checked, true, 'adopted panel starts on Active');
  tickEl().checked = false;
  tickEl().onchange();
  eq(start.disabled, true, 'adopted panel disables Start until confirmation');

  ui.setPaste('Answer Key\n1. A\n2. D');
  await ui.click('ocr_load');
  await ui.flush();

  eq(ui.storage.get('ocrQueue').batchId, 'b24-key-only', 'key-only Load keeps the batch identity');
  eq(ui.storage.get('ocrQueue').i, 1, 'key-only Load keeps the queue position');
  eq(ui.doc.radios[3].checked, true, 'key-only Load ticks Q2 Option D');
  eq(mode.checked, true, 'key-only Load keeps Active selected');
  eq(tickEl().checked, false, 'key-only Load clears the confirmation');
  eq(start.disabled, true, 'key-only Load disables Start until confirmation');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 0, 'unconfirmed Start after key-only Load sends 0 POSTs');

  // Explicit Draft confirmation saves Q2/D once without is_active.
  mode.checked = false;
  mode.onchange();
  tickEl().checked = true;
  tickEl().onchange();
  eq(start.disabled, false, 'Start enabled once Draft is confirmed');
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.storage.get('ocrQueue').i === 2, 'Q2 completes after confirmed Draft');
  eq(ui.posts.length, 1, 'confirmed Draft posts Q2 once');
  eq(ui.posts[0].body.get('is_active'), null, 'confirmed Draft Q2 POST omits is_active');
  eq(ui.posts[0].body.get('autosave'), '1', 'confirmed Draft Q2 POST sends autosave=1');
  eq(ui.posts[0].body.get('correct_option'), '3', 'confirmed Draft Q2 POST sends answer D');
  eq(ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, mode: e.mode })), [
    { num: 1, mode: 'draft' },
    { num: 2, mode: 'draft' }
  ], 'Q2 logged under book 2 as draft');

  // Control: an already-confirmed Draft keeps Draft, clears confirmation, disables Start.
  const draftUi = uiHarness.createUI({ built: true, storage: mkStorage('b24-draft-ctrl') });
  const draftMode = draftUi.doc.getElementById('ocr_active_mode');
  const draftTickEl = () => draftUi.doc.getElementById('ocr_confirm_tick');
  const draftStart = draftUi.doc.getElementById('ocr_auto_start');
  draftMode.checked = false;
  draftMode.onchange();
  draftTickEl().checked = true;
  draftTickEl().onchange();
  eq(draftStart.disabled, false, 'confirmed Draft control starts enabled');
  draftUi.setPaste('Answer Key\n1. D\n2. C');
  await draftUi.click('ocr_load');
  await draftUi.flush();
  eq(draftMode.checked, false, 'confirmed Draft control keeps Draft after key-only Load');
  eq(draftTickEl().checked, false, 'confirmed Draft control clears confirmation after key-only Load');
  eq(draftStart.disabled, true, 'confirmed Draft control disables Start until a new tick');

  // Control: a new questions paste still makes a new batch with the checked defaults.
  draftUi.setPaste('1. PC07 RR8 replacement one?\nA. a\nB. b\nC. c\nD. d\n\n2. PC07 RR8 replacement two?\nA. a\nB. b\nC. c\nD. d\n\n=== ANSWER KEY ===\n1. A\n2. B');
  await draftUi.click('ocr_load');
  await draftUi.flush();
  assert(draftUi.storage.get('ocrQueue').batchId !== 'b24-draft-ctrl', 'new questions paste creates a new batch');
  eq(draftUi.storage.get('ocrQueue').i, 0, 'new questions paste restarts at index 0');
  eq(draftMode.checked, true, 'new questions paste restores the Active default');
  eq(draftTickEl().checked, true, 'new questions paste restores the checked confirmation');
  eq(draftStart.disabled, false, 'new questions paste leaves Start enabled');
});

testAsync('BLOCK-25: real generated stimulus artifact keeps confirmation cleared on a same-page re-activation', async () => {
  const mkStorage = id => ({
    ocrQueue: {
      items: [
        { num: 1, question: 'PC07 RR8 reactivation first question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] },
        { num: 2, question: 'PC07 RR8 reactivation second question?', a: 'one', b: 'two', c: 'three', d: 'four', flags: [] }
      ],
      i: 1,
      batchId: id
    },
    ansKey: { 1: 'A', 2: 'C' },
    ansKeyBatch: id,
    ansKeyConflicts: [],
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '2094' },
    ocrSavedLog: [{ num: 1, id: 144, mode: 'draft', inactive: true, batchId: id }]
  });

  const ui = uiHarness.createUI({ built: true, storage: mkStorage('b25-idle-reactivation') });
  const mode = ui.doc.getElementById('ocr_active_mode');
  const tickEl = () => ui.doc.getElementById('ocr_confirm_tick');
  const start = ui.doc.getElementById('ocr_auto_start');
  eq(tickEl().checked, true, 'first activation keeps the checked defaults');

  // Same-page activation after settlement: no in-flight save, same batch and index.
  ui.reinject();
  await ui.flush();
  eq(ui.storage.get('ocrQueue').i, 1, 're-activation keeps the queue position');
  eq(ui.doc.radios[2].checked, true, 're-activation keeps Q2 Option C');
  eq(ui.storage.get('ocrSavedLog').map(e => e.num), [1], 're-activation keeps the single verified Q1 log');
  eq(ui.posts.length, 0, 're-activation sends no POST');
  eq(mode.checked, true, 're-activation displays Active');
  eq(tickEl().checked, false, 're-activation clears the confirmation');
  eq(start.disabled, true, 're-activation disables Start until confirmation');
  await ui.click('ocr_auto_start');
  eq(ui.posts.length, 0, 'unconfirmed Start after re-activation sends 0 POSTs');

  mode.checked = false;
  mode.onchange();
  tickEl().checked = true;
  tickEl().onchange();
  eq(start.disabled, false, 'Start enabled once Draft is confirmed');
  await ui.click('ocr_auto_start');
  await waitFor(() => ui.storage.get('ocrQueue').i === 2, 'Q2 completes after confirmed Draft');
  eq(ui.posts.length, 1, 'confirmed Draft posts Q2 once');
  eq(ui.posts[0].body.get('is_active'), null, 'confirmed Draft Q2 POST omits is_active');
  eq(ui.posts[0].body.get('correct_option'), '2', 'confirmed Draft Q2 POST sends answer C');
  eq(ui.storage.get('ocrSavedLog').map(e => ({ num: e.num, mode: e.mode })), [
    { num: 1, mode: 'draft' },
    { num: 2, mode: 'draft' }
  ], 'Q2 logged under book 2 as draft');
});

testAsync('UI tab B does not save a question tab A already saved (BLOCK-26)', async () => {
  const shared = uiHarness.sharedStorageMap(uiHarness.sampleStorage('batch-two-tab'));
  const tabA = uiHarness.createUI({
    storageMap: shared,
    reply: () => ({ redirected: true, text: 'Question saved successfully (Question ID: 107)' })
  });
  const tabB = uiHarness.createUI({
    storageMap: shared,
    reply: () => ({ redirected: true, text: 'Question saved successfully (Question ID: 108)' })
  });
  eq(tabB.posts.length, 0, 'tab B starts with no request');
  await tabA.submit();
  eq(tabA.posts.length, 1, 'tab A saves the question once');
  eq(JSON.parse(shared.get('ocrQueue')).i, 1, 'the shared queue advanced');
  await tabB.click('ocr_auto_start');
  await tabB.flush();
  eq(tabB.posts.length, 0, 'tab B must not post the finished question again');
  eq(JSON.parse(shared.get('ocrSavedLog')).length, 1, 'the shared log keeps one row');
  eq(tabB.doc.getElementById('ocr_auto_start').disabled, true, 'tab B cannot start over a finished batch');
});

testAsync('UI refuses to post a stale answer after another tab corrects the key (BLOCK-27)', async () => {
  const shared = uiHarness.sharedStorageMap(uiHarness.sampleStorage('batch-key-change'));
  const tabA = uiHarness.createUI({ storageMap: shared });
  uiHarness.createUI({ storageMap: shared });
  eq(tabA.doc.getElementById('ocr_auto_start').disabled, false, 'tab A can start with its confirmed A answer');
  shared.set('ansKey', JSON.stringify({ 1: 'D' }));
  await tabA.click('ocr_auto_start');
  await tabA.flush();
  eq(tabA.posts.length, 0, 'no POST may use the stale answer');
  assert(/does not match the key/i.test(tabA.doc.getElementById('ocr_live_blocked').textContent),
    tabA.doc.getElementById('ocr_live_blocked').textContent);
});

testAsync('UI keeps an unbatched replacement list at its own pointer (BLOCK-37)', async () => {
  const oldItem = {
    num: 1,
    question: 'CR27ForeignOld Which voucher belongs in this separate list?',
    a: 'One', b: 'Two', c: 'Three', d: 'Four', flags: []
  };
  const newItem = Object.assign({}, oldItem, { question: 'CR27ForeignNew Which voucher belongs in this separate list?' });
  const shared = uiHarness.sharedStorageMap({
    ocrQueue: { items: [oldItem], i: 0 },
    ocrMeta: { subject_id: '1', exam_category_id: '2', exam_year: '1985' },
    ocrSavedLog: []
  });
  const tabA = uiHarness.createUI({
    storageMap: shared,
    reply: () => {
      shared.set('ocrQueue', JSON.stringify({ items: [newItem], i: 0 }));
      return { redirected: true, text: 'Question saved successfully (Question ID: 127)' };
    }
  });
  await tabA.submit();
  eq(tabA.posts.length, 1, 'only the old question posts');
  const stored = JSON.parse(shared.get('ocrQueue'));
  eq(stored.i, 0, 'the replacement list keeps i=0');
  eq(stored.items[0].question, newItem.question, 'the replacement text is untouched');
  eq(JSON.parse(shared.get('ocrSavedLog')).map(entry => entry.id), [127], 'only the posted row is logged');
});

testAsync('UI completion heading keeps the finished batch metadata (FIX-5)', async () => {
  const ui = uiHarness.createUI({ storage: uiHarness.sampleStorage('batch-complete'), inactiveChecked: true });
  await ui.click('ocr_auto_start');
  await ui.flush();
  eq(ui.posts.length, 1, 'one save for the batch');
  const heading = ui.doc.getElementById('ocr_live_status').textContent;
  assert(/Batch complete: CRS \/ JAMB \/ UTME \/ 2021 — 1 question \(#1 to #1\)/.test(heading), heading);
  assert(/1 saved\.$/.test(heading), heading);
  assert(!/-- Select Subject --/.test(heading), 'the reset form fields are not read back into the heading');
  const history = ui.storage.get('ocrBatchHistory');
  eq(history.length, 1, 'one history entry');
  eq(history[0].year, '2021', 'the history keeps the real year');
});

(async () => {
  for (const item of asyncTests) {
    try {
      await item.fn();
      report(item.name, null);
    } catch (error) {
      report(item.name, error);
    }
  }
  console.log('');
  console.log('Summary');
  console.log('  PASS: ' + passed);
  console.log('  FAIL: ' + failed);
  process.exitCode = failed ? 1 : 0;
})();
