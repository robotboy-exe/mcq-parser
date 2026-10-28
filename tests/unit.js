#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('../src/parser/parser.js');
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

test('autosaveBlockers requires an assigned image for each detected block', () => {
  const s = cleanState();
  s.queue.items[0].stimuli = [{ id: 'stim-1', order: 1, sourceNum: 1, nums: [2], missing: [] }];
  s.queue.items[1].needsImage = true;
  eq(parser.autosaveBlockers(s)[0].code, 'stimulus-unassigned');
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [2] }];
  eq(parser.autosaveBlockers(s)[0].code, 'stimulus-unassigned');
  s.imagePlan = [{ stimulusId: 'stim-1', nums: [2], name: 'table.png' }];
  eq(parser.autosaveBlockers(s)[0].code, 'stimulus-unassigned');
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

test('autosaveBlockers requires an image on a flagged question', () => {
  const s = cleanState();
  s.queue.items[0].needsImage = true;
  eq(parser.autosaveBlockers(s)[0].code, 'image-required');
  s.imagePlan = [{ nums: [1] }];
  eq(parser.autosaveBlockers(s)[0].code, 'image-required');
  s.imagePlan = [{ nums: [1], name: 'single.png' }];
  eq(parser.autosaveBlockers(s)[0].code, 'image-required');
  s.imagePlan = [{ nums: [1], name: 'single.png', file: {} }];
  eq(parser.autosaveBlockers(s), []);
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
    'meta-changed', 'stimulus-unassigned', 'stimulus-range', 'image-required',
    'file-attached', 'has-explanation', 'saving-marker', 'save-in-progress',
    'stopped', 'lock', 'hidden', 'saved-log', 'duplicate', 'form-edited'];
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
  eq(parser.classifySaveResponse({ redirected: false, text: '<h1>Administrator Login</h1>', errorText: '', lastId: 0 }), {
    kind: 'rejected', reason: 'expired', message: 'you were logged out. Reload the page and log in.'
  });
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
