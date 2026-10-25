#!/usr/bin/env node
'use strict';

const assert = require('assert');
const parser = require('../src/parser/parser.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('[PASS] ' + name);
  } catch (error) {
    failed++;
    console.log('[FAIL] ' + name);
    const message = String(error && error.message ? error.message : error).split('\n').join('\n  ');
    console.log('  ' + message);
  }
}

function eq(actual, expected, label) {
  assert.deepStrictEqual(actual, expected, label || 'values differ');
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

test('maxSavedId and savedForBatch filter the log', () => {
  const log = [{ id: '10', batchId: 'b1' }, { id: 12, batchId: 'b2' }, { id: null, batchId: 'b1' }];
  eq(parser.maxSavedId(log), 12);
  eq(parser.maxSavedId([]), 0);
  eq(parser.savedForBatch(log, 'b1'), [{ id: '10', batchId: 'b1' }, { id: null, batchId: 'b1' }]);
  eq(parser.savedForBatch(log, null), []);
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

test('formatSavedRange reports active and unverified saves honestly', () => {
  eq(parser.savedInactiveSuffix([{ inactive: true }]), ', inactive');
  eq(parser.savedInactiveSuffix([{ inactive: true }, { inactive: false }]), ', includes a question saved active');
  eq(parser.savedInactiveSuffix([{ inactive: true }, { inactive: null }]), ', inactive status not verified');
  eq(parser.savedInactiveSuffix([{ inactive: false }, { inactive: null }]), ', includes a question saved active');
  eq(parser.savedInactiveSuffix([{ id: 1 }]), ', inactive status not verified');
  eq(
    parser.formatSavedRange([{ id: 7, inactive: false }]),
    'Saved this batch: #7, includes a question saved active'
  );
  eq(
    parser.formatSavedRange([{ id: 7, inactive: null }]),
    'Saved this batch: #7, inactive status not verified'
  );
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
    radioLetter: 'A',
    hasImage: false,
    hasVideo: false,
    savingMarker: null,
    saveInProgress: false,
    stopRequested: false,
    runCount: 0,
    runCap: 3,
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
    'meta-missing', 'not-confirmed', 'file-attached', 'saving-marker', 'save-in-progress',
    'stopped', 'run-cap', 'lock', 'hidden', 'saved-log', 'duplicate', 'form-edited'];
  for (const code of codes) {
    const text = parser.blockerText({ code, detail: 'detail' });
    assert(text.indexOf('Cannot auto-save:') === 0, code + ': ' + text);
    assert(text.indexOf('detail') > -1, code + ': ' + text);
  }
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
  eq(parser.classifySaveResponse({ redirected: false, text: '<h1>Administrator Login</h1>', errorText: '', lastId: 0 }), {
    kind: 'rejected', reason: 'expired', message: 'you were logged out. Reload the page and log in.'
  });
});

test('classifySaveResponse treats an empty reply as ambiguous', () => {
  eq(parser.classifySaveResponse({ redirected: false, text: '', errorText: '', lastId: 0 }).kind, 'ambiguous');
});


test('autosaveBlockers reports lock, hidden, marker, save, stop, and cap', () => {
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
  const cap = cleanState();
  cap.runCount = 3;
  eq(parser.autosaveBlockers(cap)[0].code, 'run-cap');
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

console.log('');
console.log('Summary');
console.log('  PASS: ' + passed);
console.log('  FAIL: ' + failed);
process.exitCode = failed ? 1 : 0;
