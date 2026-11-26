#!/usr/bin/env node
'use strict';

// Executes the real generated key bookmarklet artifact, not a copy of its
// behavior. src/bookmarklets/key/bookmarklet.js is built from the canonical
// parser core, boot.js, and entry.js.
const assert = require('assert');
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { linkComprehension } = require('../src/parser/core.js');

const ARTIFACT = path.join(__dirname, '../src/bookmarklets/key/bookmarklet.js');
const BUILD = path.join(__dirname, '../src/bookmarklets/key/build.js');
const CORE = require('../src/parser/core.js');

let passed = 0;
const tests = [];

function test(name, fn) {
  tests.push([name, fn]);
}

function artifactSource() {
  return fs.readFileSync(ARTIFACT, 'utf8').replace(/^javascript:/, '');
}

function loadKeyBookmarklet(options) {
  const settings = options || {};
  const shared = settings.shared || null;
  const inserted = shared ? (shared.inserted || (shared.inserted = [])) : [];
  const radios = [0, 1, 2, 3].map((index) => ({ value: String(index), checked: false }));
  const submitHandlers = [];
  const timers = [];
  const alerts = [];
  const errors = [];
  const removals = [];
  const fields = new Map();
  // A shared form also shares storage, matching one browser localStorage across
  // a bookmarklet reinjection on the same page.
  const storage = shared && shared.storage ? shared.storage : new Map(Object.entries(settings.storage || {}));
  const session = shared && shared.session ? shared.session : new Map(Object.entries(settings.session || {}));
  if (shared && !shared.storage) shared.storage = storage;
  if (shared && !shared.session) shared.session = session;
  // A shared form lets one test click the bookmarklet twice on the same page.
  const form = shared && shared.form ? shared.form : {
    before(node) { inserted.push(node); },
    addEventListener(type, handler, capture) {
      if (type === 'submit') submitHandlers.push({ handler, capture: Boolean(capture) });
    },
    removeEventListener(type, handler, capture) {
      if (type !== 'submit' || !shared) return;
      for (let i = shared.handlers.length - 1; i >= 0; i--) {
        const item = shared.handlers[i];
        if (item.handler === handler && item.capture === Boolean(capture)) shared.handlers.splice(i, 1);
      }
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
      const list = shared ? shared.handlers : submitHandlers;
      for (const item of list) {
        if (e.immediateStopped) break;
        item.handler(e);
      }
      return e;
    }
  };
  if (shared && !shared.form) {
    shared.form = form;
    shared.handlers = submitHandlers;
  }
  const stalePanel = { remove() { removals.push('panel'); } };
  const document = {
    querySelector(selector) {
      if (selector === 'input[name=action][value=save_question]') {
        return settings.withForm === false ? null : { form };
      }
      if (selector === '.admin-error' && settings.withError) return { textContent: 'Duplicate question.' };
      return null;
    },
    getElementById(id) {
      if (id === 'ocr_input' && settings.stalePanel && !removals.includes('panel')) {
        return { closest: () => stalePanel };
      }
      if (id === 'ocr_error') {
        if (settings.staleError && !removals.includes('error')) return { remove() { removals.push('error'); } };
        return null;
      }
      if (!fields.has(id)) fields.set(id, { value: '', hidden: false, innerHTML: '', className: '', textContent: '' });
      return fields.get(id);
    },
    createElement() {
      return { className: '', id: '', textContent: '', innerHTML: '' };
    }
  };
  const location = { href: 'https://admin.example/questions', search: settings.search || '' };
  const sandbox = {
    window: {},
    document,
    location,
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
    fetch: settings.fetch || (() => Promise.reject(new Error('unexpected fetch'))),
    FormData: function FormData(element) { this.form = element; },
    alert(message) { alerts.push(String(message)); },
    console: { error(message) { errors.push(String(message)); } }
  };
  sandbox.window.window = sandbox.window;
  if (settings.pageHelperSubmit) {
    // The deployed page's own helper listens first and writes the reload marker.
    submitHandlers.push({ handler: () => storage.set('ocrSubmitted', 'true'), capture: false });
  }
  vm.createContext(sandbox);
  let thrown = null;
  try {
    vm.runInContext(artifactSource(), sandbox, { filename: 'key-bookmarklet.js' });
  } catch (error) {
    thrown = error;
  }
  return {
    thrown, inserted, alerts, errors, removals, fields, radios, form, storage, session, document,
    listeners: () => (shared ? shared.handlers : submitHandlers).slice(),
    field: (id) => document.getElementById(id),
    runTimers() { timers.splice(0).forEach((fn) => { if (fn) fn(); }); }
  };
}

function keyBookmarklet(options) {
  const result = loadKeyBookmarklet(options);
  assert.strictEqual(result.thrown, null, result.thrown && result.thrown.stack);
  assert.deepStrictEqual(result.alerts, [], 'the bookmarklet must not alert on load');
  assert.strictEqual(result.errors.length, 0);
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

function civicText() {
  return fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026.txt'), 'utf8');
}

function civicKeyText() {
  return fs.readFileSync(path.join(__dirname, 'fixtures/ocr-helper-civic-2026-key.txt'), 'utf8');
}

test('artifact is one line, syntax-valid, percent-free, and deterministic', () => {
  const source = fs.readFileSync(ARTIFACT, 'utf8');
  assert.strictEqual(source.endsWith('\n'), true, 'trailing newline');
  assert.strictEqual(source.trimEnd().includes('\n'), false, 'one physical line');
  assert.strictEqual(source.startsWith('javascript:'), true);
  assert.strictEqual(/%[0-9A-Fa-f]{2}/.test(source), false, 'no percent escape');

  const body = source.replace(/^javascript:/, '');
  new Function(body);

  const first = crypto.createHash('sha256').update(source).digest('hex');
  execFileSync(process.execPath, [BUILD], { stdio: 'pipe' });
  const second = crypto.createHash('sha256').update(fs.readFileSync(ARTIFACT, 'utf8')).digest('hex');
  assert.strictEqual(first, second, 'build output is deterministic');

  assert.strictEqual(body.includes('PARSER_VERSION = "2.5.6"'), true, 'inlines the canonical core version');
  assert.strictEqual(body.includes('window.OCRParser'), true, 'inlines the canonical core');
  assert.strictEqual(body.includes('__ocrBookmarklet = true'), true, 'runs the boot step');
  assert.strictEqual(body.includes('const EXPECTED_CORE_VERSION'), true, 'runs the key entry');
});

test('runs the real artifact against the canonical core, not a copy', () => {
  const result = keyBookmarklet();
  assert.strictEqual(result.inserted.length, 1, 'installs one panel');
  const panel = result.inserted[0].innerHTML;
  for (const id of ['ocr_input', 'ocr_text', 'ocr_load', 'ocr_auto', 'ocr_progress', 'ocr_status', 'ocr_skip', 'ocr_clear']) {
    assert(panel.includes(id), 'panel id ' + id);
  }
  assert.strictEqual(result.field('ocr_title').textContent, 'Bookmarklet paste');
  assert.strictEqual(CORE.version, '2.5.6');
  assert.strictEqual(typeof linkComprehension, 'function');
});

test('installs over the deployed page and removes only its stale panel', () => {
  const result = keyBookmarklet({ stalePanel: true, staleError: true });
  assert.deepStrictEqual(result.removals.sort(), ['error', 'panel']);
  assert.strictEqual(result.inserted.length, 1);
  assert.strictEqual(result.listeners().length, 1, 'one submit listener');
  assert.strictEqual(result.listeners()[0].capture, true, 'capture listener owns the submit');
});

test('clicking the bookmarklet twice replaces its panel and does not stack listeners', () => {
  const shared = {};
  keyBookmarklet({ shared });
  const second = keyBookmarklet({ shared, stalePanel: true });
  assert.deepStrictEqual(second.removals, ['panel'], 'boot removes the previous panel');
  assert.strictEqual(shared.inserted.length, 2, 'each click installs one panel');
  assert.strictEqual(second.listeners().length, 1, 'one submit listener after a second load');
});

test('fills the keyed civic paper and ticks the option', () => {
  const result = keyBookmarklet();
  loadPaste(result, civicKeyText());
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
  const result = keyBookmarklet();
  loadPaste(result, civicText());
  assert.deepStrictEqual(checkedRadios(result), []);
  assert(/No answer-key section found/.test(result.field('ocr_status').innerHTML));
  assert(/no key/.test(result.field('ocr_status').innerHTML));

  result.field('ocr_clear').onclick();
  assert.strictEqual(result.field('ocr_status').innerHTML, '');
});

test('attaches a key-only paste to the queue that is already loaded', () => {
  const result = keyBookmarklet();
  loadPaste(result, civicText());
  assert.deepStrictEqual(checkedRadios(result), []);

  loadPaste(result, 'ANSWER KEY\n1. D\n2. A\n');
  assert.deepStrictEqual(checkedRadios(result), ['3'], 'question 1 key D from the key-only paste');
  assert(/Answer key updated \(2 entries\)/.test(result.field('ocr_status').innerHTML));
  assert(result.field('question_text').value.startsWith('By upholding values'), 'form keeps its question');

  result.field('ocr_skip').onclick();
  assert.deepStrictEqual(checkedRadios(result), ['0'], 'question 2 key A');
});

test('restores the paste and the current question after a reload', () => {
  const text = civicKeyText();
  const first = keyBookmarklet();
  loadPaste(first, text);
  first.field('ocr_skip').onclick();
  assert(/Question 2 of 50/.test(first.field('ocr_status').innerHTML));

  const second = keyBookmarklet(persisted(first));
  assert.strictEqual(second.field('ocr_text').value, text, 'paste restored');
  assert(second.field('question_text').value.startsWith('National consciousness'), 'question 2 restored');
  assert.deepStrictEqual(checkedRadios(second), ['1'], 'question 2 key B ticked without pasting again');
  assert(/key B/.test(second.field('ocr_status').innerHTML), 'stored key shown');
  assert(/50 answers/.test(second.field('ocr_status').innerHTML), 'stored key count shown');
});

test('clears the stored paste and key with the list', () => {
  const result = keyBookmarklet();
  loadPaste(result, civicKeyText());
  assert(result.session.has('ocrPaste'), 'paste stored on load');
  assert(result.storage.has('ansKey'), 'key stored on load');
  result.field('ocr_clear').onclick();
  assert.strictEqual(result.session.has('ocrPaste'), false, 'paste cleared');
  assert.strictEqual(result.storage.has('ansKey'), false, 'key cleared');
  assert.strictEqual(result.field('ocr_text').value, '');
});

// BLOCK-1 (owner-approved change to the reviewed base vector): a queue written
// by the deployed helper carries no key-product provenance, so a retained ansKey
// must not be applied to it merely because the printed numbers match.
test('keeps ansKey but does not apply it to a queue the page helper replaced', () => {
  let calls = 0;
  const first = keyBookmarklet();
  loadPaste(first, civicKeyText());
  const stored = JSON.parse(first.storage.get('ansKey'));
  assert.strictEqual(stored['1'], 'C');
  assert.strictEqual(stored['50'], 'C');

  const queue = JSON.parse(first.storage.get('ocrQueue'));
  first.storage.set('ocrQueue', JSON.stringify({ items: queue.items, i: 1 }));
  const second = ready(keyBookmarklet(Object.assign(persisted(first), {
    fetch: () => { calls++; return Promise.resolve(savedResponse()); }
  })));
  assert.deepStrictEqual(checkedRadios(second), [], 'no radio is ticked from the retained key');
  assert(!/key B/.test(second.field('ocr_status').innerHTML), 'the retained key is not shown as active');
  assert(/stored key \(50 answers\) not used/.test(second.field('ocr_status').innerHTML),
    'the status says the stored key belongs to another list');
  assert.strictEqual(second.storage.has('ansKey'), true, 'ansKey itself is not destroyed');

  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 0, 'Start must not POST with an unconfirmed key');
  assert(second.alerts.some((message) => /stored answer key/.test(message)),
    'Start explains that the key must be pasted again');
});

// BLOCK-1 criterion 2: the panel's existing key-only paste is the clear path to
// confirm a key for a list the deployed helper loaded.
test('a key-only paste confirms the retained key for the page helper list', () => {
  const first = keyBookmarklet();
  loadPaste(first, civicKeyText());
  const queue = JSON.parse(first.storage.get('ocrQueue'));
  first.storage.set('ocrQueue', JSON.stringify({ items: queue.items, i: 1 }));

  const second = keyBookmarklet(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), [], 'still inert before the confirming paste');
  loadPaste(second, 'ANSWER KEY\n1. D\n2. A\n');
  assert.deepStrictEqual(checkedRadios(second), ['0'], 'question 2 key A after the confirming paste');
  assert(/Answer key updated \(2 entries\)/.test(second.field('ocr_status').innerHTML));
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).how, 'key-paste',
    'the queue records the confirmation in its existing how field');

  const third = keyBookmarklet(persisted(second));
  assert.deepStrictEqual(checkedRadios(third), ['0'], 'the confirmed key survives a reload');
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
  const result = ready(keyBookmarklet());
  loadPaste(result, AUTO_PASTE);
  assert(/Dry run OK/.test(result.field('ocr_status').innerHTML));
  assert(/0 of 2 saved/.test(result.field('ocr_progress_label').innerHTML));
  assert(/dry run OK/.test(result.field('ocr_progress_label').innerHTML));
  assert.strictEqual(result.storage.has('ocrSubmitted'), false, 'no save on load');
});

test('dry run blocks a paste with no answer key', () => {
  const result = ready(keyBookmarklet());
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

test('saves in place and keeps the key for the next question', async () => {
  let calls = 0;
  const result = ready(keyBookmarklet({
    pageHelperSubmit: true,
    fetch: () => { calls++; return Promise.resolve(savedResponse()); }
  }));
  loadPaste(result, civicKeyText());
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

test('keeps the question queued when the in-place save is rejected', async () => {
  const result = ready(keyBookmarklet({
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
  const result = ready(keyBookmarklet({ fetch: () => { calls++; return Promise.resolve(savedResponse()); } }));
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
  const result = ready(keyBookmarklet({ fetch: () => { calls++; return Promise.resolve(failedResponse('Duplicate question.')); } }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  await flush();
  assert.strictEqual(calls, 1);
  assert(/Autosave stopped at question 1: Duplicate question/.test(result.field('ocr_status').innerHTML));
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'question stays queued');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Start autosave');
});

test('keeps the answer key only in ansKey and drops a leftover queue copy', () => {
  const first = keyBookmarklet();
  loadPaste(first, civicKeyText());
  const queue = JSON.parse(first.storage.get('ocrQueue'));
  assert.strictEqual('key' in queue, false, 'no key copy in the queue');

  queue.key = { 1: 'D', 2: 'A' };
  first.storage.set('ocrQueue', JSON.stringify(queue));
  first.storage.set('ansKey', JSON.stringify({ 1: 'C', 2: 'B', 50: 'C' }));

  const second = keyBookmarklet(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), ['2'], 'question 1 key C from ansKey');
  assert(/key C/.test(second.field('ocr_status').innerHTML));
  assert(/3 answers/.test(second.field('ocr_status').innerHTML), 'ansKey count used');
  assert.strictEqual('key' in JSON.parse(second.storage.get('ocrQueue')), false, 'leftover queue copy dropped');
});

test('clearing ansKey in another tool leaves no key for the bookmarklet', () => {
  const first = keyBookmarklet();
  loadPaste(first, civicKeyText());
  first.storage.delete('ansKey');

  const second = keyBookmarklet(persisted(first));
  assert.deepStrictEqual(checkedRadios(second), [], 'nothing ticked');
  assert(/no key/.test(second.field('ocr_status').innerHTML));
});

test('stop autosave works while the save request is still hanging', async () => {
  let resolveFetch = null;
  const result = ready(keyBookmarklet({
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
  const result = ready(keyBookmarklet({
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
  const result = ready(keyBookmarklet({
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

// BLOCK-2: a second injection must adopt, not duplicate, the in-flight save.
test('reinjecting during an in-flight save posts the question exactly once', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'the first instance posts question 1');

  const second = ready(keyBookmarklet({ shared, fetch }));
  assert.strictEqual(shared.inserted.length, 2, 'each injection installs its own panel');
  assert.strictEqual(second.listeners().length, 1, 'still one submit listener');
  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'the replacement panel must not post a second time');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1, 'the shared request settles once');
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'the queue advances exactly once');

  second.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'the next item posts normally, once');
});

test('reinjection settles a failed in-flight save exactly once', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.field('ocr_auto').onclick();

  const second = ready(keyBookmarklet({ shared, fetch }));
  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'no duplicate POST from the replacement panel');

  pending[0](failedResponse('Duplicate question.'));
  await flush();
  assert.strictEqual(calls, 1);
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 0, 'the item stays queued once');
  assert(/Autosave stopped at question 1: Duplicate question/.test(second.field('ocr_status').innerHTML));
});

// BLOCK-2 criteria 1 and 3 (`Probe B2-A`): Save Question on the replacement
// panel must not post while the replaced panel's autosave request is outstanding.
test('reinjection during an in-flight autosave blocks Save Question instead of double-posting', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'the first panel posts question 1');

  const second = ready(keyBookmarklet({ shared, fetch }));
  assert.strictEqual(second.listeners().length, 1, 'still one submit listener');
  const event = second.form.submit();
  assert(event.defaultPrevented, 'the replacement panel still owns the submit');
  assert.strictEqual(calls, 1, 'Save Question must not post a second time');
  assert(/already in progress/.test(second.field('ocr_status').innerHTML),
    'the replacement panel explains the outstanding save');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1, 'the shared request settles once');
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'the queue advances exactly once');
});

// BLOCK-2 criterion 1 (`Probe B2-B`): the same guard covers an in-place save that
// the replaced panel started.
test('reinjection during an in-flight in-place save blocks a second Save Question', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.form.submit();
  assert.strictEqual(calls, 1, 'the first panel saves question 1');

  const second = ready(keyBookmarklet({ shared, fetch }));
  second.form.submit();
  assert.strictEqual(calls, 1, 'the replacement panel must not post a second time');
  assert(/already in progress/.test(second.field('ocr_status').innerHTML));

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1, 'the in-flight save settles once');
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'the queue advances exactly once');
  assert(/already in progress finished/.test(second.field('ocr_status').innerHTML));
});

// BLOCK-2 criterion 1 (`Probe B2-C`): a second reinjection must not lose the
// record, so a third activation still adopts the outstanding request.
test('a third activation does not lose the in-flight record', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.field('ocr_auto').onclick();
  ready(keyBookmarklet({ shared, fetch }));
  const third = ready(keyBookmarklet({ shared, fetch }));
  third.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'the third panel adopts the outstanding request');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1, 'the request settles once');
  assert.strictEqual(JSON.parse(third.storage.get('ocrQueue')).i, 1, 'the queue advances exactly once');
  third.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'the next question posts normally, once');
});

// BLOCK-2 criterion 2/3 (`Probe B2-D`): without a Start click the replacement
// panel still records the settled save instead of leaving it unrecorded.
test('reinjection without a Start click settles the inherited save once', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1);

  const second = ready(keyBookmarklet({ shared, fetch }));
  assert(/already in progress/.test(second.field('ocr_status').innerHTML),
    'the replacement panel shows the outstanding save while it waits');
  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1);
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'the inherited save is recorded once');
  assert(/already in progress finished/.test(second.field('ocr_status').innerHTML));
  assert(/Second autosave question/.test(second.field('question_text').value), 'the panel moves to the next question');
});

// FIX-3 (`Probe B4-A`): an abandoned in-place save must not release the lock of
// a newer in-place save on a replacement batch.
test('an abandoned in-place save does not unlock the replacement batch', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const result = ready(keyBookmarklet({ fetch }));
  loadPaste(result, AUTO_PASTE);
  result.form.submit();
  assert.strictEqual(calls, 1, 'Batch 1 saves once');

  result.field('ocr_clear').onclick();
  loadPaste(result, '1. Batch 2 different question? A) One B) Two C) Three D) Four\nANSWER KEY\n1. C\n');
  result.form.submit();
  assert.strictEqual(calls, 2, 'Batch 2 saves once');

  pending[0](savedResponse());
  await flush();
  result.form.submit();
  assert.strictEqual(calls, 2, 'the abandoned result must not unlock another POST');
});

// BLOCK-3: the startup consumer of the deployed helper's legacy marker is gone.
test('ignores a legacy reload marker written after the page helper started', () => {
  const first = keyBookmarklet();
  loadPaste(first, AUTO_PASTE);
  const stored = persisted(first);
  stored.storage.ocrSubmitted = 'true';

  const second = keyBookmarklet(stored);
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 0, 'the queue index does not advance');
  assert(/First autosave question/.test(second.field('question_text').value), 'the unsaved question stays filled');
  assert(/Question 1 of 2/.test(second.field('ocr_status').innerHTML), 'the panel still points at question 1');
  assert.strictEqual(second.storage.get('ocrSubmitted'), 'true', 'the marker is left to the deployed helper');
});

// BLOCK-4 criterion 5(a): a discarded batch must not satisfy a new batch.
test('does not reuse a discarded batch request after Stop, Clear, and a new Load', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const result = ready(keyBookmarklet({ fetch }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1);
  result.field('ocr_auto').onclick();
  result.field('ocr_clear').onclick();
  loadPaste(result, '1. Batch 2 different question? A) One B) Two C) Three D) Four\nANSWER KEY\n1. C\n');
  result.field('ocr_auto').onclick();
  assert.strictEqual(calls, 2, 'Batch 2 is posted instead of reusing the discarded request');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 0, 'the old result does not settle the new batch');
  pending[1](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'Batch 2 settles once');
});

// BLOCK-4 criterion 5(b): an in-place save must not continue into a cleared list.
test('an in-place save continues nothing after Clear list', async () => {
  let resolveFetch = null;
  let calls = 0;
  const result = ready(keyBookmarklet({
    fetch: () => { calls++; return new Promise((resolve) => { resolveFetch = resolve; }); }
  }));
  loadPaste(result, AUTO_PASTE);
  result.form.submit();
  assert.strictEqual(calls, 1);
  result.field('ocr_clear').onclick();
  resolveFetch(savedResponse());
  await flush();
  const stored = JSON.parse(result.storage.get('ocrQueue'));
  assert.strictEqual(stored.i, 0, 'the cleared queue is not advanced');
  assert.strictEqual(stored.items.length, 0, 'the cleared queue stays empty');
  assert(!/Saved question/.test(result.field('ocr_status').innerHTML), 'the status is not overwritten');
});

test('an in-place save continues nothing into a replaced list', async () => {
  let resolveFetch = null;
  const result = ready(keyBookmarklet({
    fetch: () => new Promise((resolve) => { resolveFetch = resolve; })
  }));
  loadPaste(result, AUTO_PASTE);
  result.form.submit();
  result.field('ocr_clear').onclick();
  loadPaste(result, '1. Batch 2 different question? A) One B) Two C) Three D) Four\nANSWER KEY\n1. C\n');
  resolveFetch(savedResponse());
  await flush();
  const stored = JSON.parse(result.storage.get('ocrQueue'));
  assert.strictEqual(stored.i, 0, 'the replacement queue is not advanced');
  assert.strictEqual(stored.items.length, 1, 'the replacement queue is intact');
  assert(!/Saved question 1 of 1 using its answer key/.test(result.field('ocr_status').innerHTML));
});

// BLOCK-4 criterion 5(c): Skip must invalidate the in-flight autosave.
test('Skip during an in-flight autosave does not advance twice', async () => {
  let resolveFetch = null;
  const result = ready(keyBookmarklet({
    fetch: () => new Promise((resolve) => { resolveFetch = resolve; })
  }));
  loadPaste(result, AUTO_PASTE);
  result.field('ocr_auto').onclick();
  result.field('ocr_skip').onclick();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'Skip advances once');
  resolveFetch(savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'the hanging save cannot advance again');
});

// FIX-1: stale or foreign storage must not break startup.
test('mounts a working panel over malformed storage instead of crashing', () => {
  for (const key of ['ocrQueue', 'ansKey', 'ocrMeta']) {
    const result = keyBookmarklet({ storage: { [key]: '{bad json' } });
    assert.strictEqual(result.inserted.length, 1, key + ': one panel is installed');
    loadPaste(result, civicText());
    assert(result.field('question_text').value.startsWith('By upholding values'), key + ': Load still works');
  }
});

test('normalizes incompatible queue and key shapes', () => {
  const cases = [
    '{}',
    '[]',
    '{"items":null,"i":0}',
    '{"items":[],"i":-1}',
    '{"items":[],"i":"0"}',
    '{"items":[{"question":"x","flags":null}],"i":0}'
  ];
  for (const value of cases) {
    const result = keyBookmarklet({ storage: { ocrQueue: value } });
    const stored = JSON.parse(result.storage.get('ocrQueue'));
    assert(Array.isArray(stored.items), value + ': items is an array');
    assert.strictEqual(Number.isInteger(stored.i) && stored.i >= 0, true, value + ': i is a valid index');
    assert.strictEqual(result.inserted.length, 1);
  }

  const arrayKey = keyBookmarklet({ storage: { ansKey: '["A"]' } });
  assert.strictEqual(arrayKey.storage.has('ansKey'), false, 'an array ansKey is dropped');
  assert.deepStrictEqual(checkedRadios(arrayKey), []);
});

test('ignores unknown ocrMeta fields and fills only the known three', () => {
  const result = keyBookmarklet({
    storage: {
      ocrQueue: JSON.stringify({
        items: [{ num: 1, question: 'Stem?', a: 'One', b: 'Two', c: 'Three', d: 'Four', flags: [] }],
        i: 0,
        how: 'none'
      }),
      ocrMeta: JSON.stringify({ subject_id: '7', bogus: 'x', exam_year: '2026' })
    }
  });
  assert.strictEqual(result.field('subject_id').value, '7');
  assert.strictEqual(result.field('exam_year').value, '2026');
  assert.strictEqual(result.fields.has('bogus'), false, 'an unknown meta field is never written');
});

function runKeyEntry(coreValue) {
  const inserted = [];
  const errors = [];
  const form = { before(node) { inserted.push(node); } };
  const fields = new Map();
  const sandbox = {
    window: coreValue === undefined ? {} : { OCRParser: coreValue },
    document: {
      querySelector(selector) {
        if (selector === 'input[name=action][value=save_question]') return { form };
        return null;
      },
      getElementById(id) {
        if (!fields.has(id)) {
          fields.set(id, { value: '', hidden: false, innerHTML: '', className: '', textContent: '' });
        }
        return fields.get(id);
      },
      createElement() {
        return { className: '', id: '', textContent: '', innerHTML: '' };
      }
    },
    location: { href: 'https://admin.example/questions', search: '' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console: { error(message) { errors.push(String(message)); } }
  };
  vm.createContext(sandbox);
  let thrown = null;
  try {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '../src/bookmarklets/key/entry.js'), 'utf8'),
      sandbox,
      { filename: 'entry.js' }
    );
  } catch (error) {
    thrown = error;
  }
  return { thrown, inserted, errors };
}

// FIX-2: execute the refusal path instead of matching source strings.
test('refuses to run without the canonical core and never touches Constant Text', () => {
  const entry = fs.readFileSync(path.join(__dirname, '../src/bookmarklets/key/entry.js'), 'utf8');
  assert.strictEqual(entry.includes('constant_text'), false);
  assert.strictEqual(entry.includes('node'), false, 'no Node branch in the bookmarklet entry');
  assert.strictEqual(entry.includes('parsePaste'), true, 'key splitting comes from the core');

  const cases = [
    ['missing window.OCRParser', undefined, /window\.OCRParser is missing/],
    ['version mismatch', { version: '2.3.0', parsePaste() {} }, /reports version 2\.3\.0/],
    ['missing parsePaste', { version: '2.5.6' }, /no parsePaste export/]
  ];
  for (const [label, core, pattern] of cases) {
    const run = runKeyEntry(core);
    assert(run.thrown, label + ': the entry must throw');
    assert(/^Key bookmarklet disabled: /.test(run.thrown.message), label + ': refusal message');
    assert(pattern.test(run.thrown.message), label + ': names the problem');
    assert.strictEqual(run.errors.length, 1, label + ': one console.error');
    assert.strictEqual(run.errors[0], run.thrown.message, label + ': console.error matches the throw');
    assert.strictEqual(run.inserted.length, 1, label + ': one banner');
    const banner = run.inserted[0];
    assert.strictEqual(banner.id, 'ocr_error', label + ': banner id');
    assert(/admin-error/.test(banner.className), label + ': banner class');
    assert(/^Key bookmarklet disabled: /.test(banner.textContent), label + ': banner text');
    assert(/Reload the page/.test(banner.textContent), label + ': banner advice');
  }
});

// BLOCK-5 (`ADV_1`): an in-place save adopted by Start autosave must settle into
// the run, keep it moving, and post question 2 exactly once.
test('reinjecting during an in-place save and starting autosave completes the batch', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.form.submit();
  assert.strictEqual(calls, 1, 'the first panel saves question 1');

  const second = ready(keyBookmarklet({ shared, fetch }));
  assert(/already in progress/.test(second.field('ocr_status').innerHTML),
    'the replacement panel shows the inherited save');
  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'Start attaches to the inherited save instead of posting');
  assert.strictEqual(second.field('ocr_auto').textContent, 'Stop autosave');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'question 1 settles once');
  assert.strictEqual(second.field('ocr_auto').textContent, 'Stop autosave',
    'the adopted save keeps the run running');

  second.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'question 2 posts once after the adopted save settles');
  assert(/Second autosave question/.test(second.field('question_text').value), 'question 2 is filled');
  pending[1](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 2, 'both questions are saved');
  assert(/Autosave complete: 2 of 2 saved/.test(second.field('ocr_status').innerHTML));
});

// BLOCK-5 criterion 2: Stop must not hold a settled answer as the next save.
test('Stop after an adopted save does not skip question 2', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.form.submit();
  const second = ready(keyBookmarklet({ shared, fetch }));
  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'Start attaches to the inherited save');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'question 1 is saved');
  second.field('ocr_auto').onclick();
  assert.strictEqual(second.field('ocr_auto').textContent, 'Start autosave', 'Stop is immediate');

  second.runTimers();
  await flush();
  assert.strictEqual(calls, 1, 'a stopped run posts nothing after question 1 settled');

  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 2, 'question 2 posts exactly once after the restart');
  pending[1](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 2,
    'question 2 is marked saved only after its own POST');
});

// BLOCK-5 criterion 3 (failure variant): an adopted save that fails stops the run
// cleanly with question 1 still queued, and a retry posts it once.
test('an in-place save adopted by autosave stops cleanly when it fails', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const shared = {};
  const first = ready(keyBookmarklet({ shared, fetch }));
  loadPaste(first, AUTO_PASTE);
  first.form.submit();
  const second = ready(keyBookmarklet({ shared, fetch }));
  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'Start attaches to the inherited save');

  pending[0](failedResponse('Duplicate question.'));
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 0, 'question 1 stays queued');
  assert(/Autosave stopped at question 1: Duplicate question/.test(second.field('ocr_status').innerHTML));
  assert.strictEqual(second.field('ocr_auto').textContent, 'Start autosave', 'the run stops cleanly');

  second.field('ocr_auto').onclick();
  assert.strictEqual(calls, 2, 'the retry posts question 1 once');
  pending[1](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(second.storage.get('ocrQueue')).i, 1, 'the retry saves question 1');
});

// FIX-4 (`ADV_2`): Start autosave on the same panel must attach to the in-place
// save instead of posting the same question a second time.
test('starting autosave during an in-place save does not post the question twice', async () => {
  let calls = 0;
  const pending = [];
  const fetch = () => { calls++; return new Promise((resolve) => pending.push(resolve)); };
  const result = ready(keyBookmarklet({ fetch }));
  loadPaste(result, AUTO_PASTE);
  result.form.submit();
  assert.strictEqual(calls, 1, 'Save Question posts question 1');

  result.field('ocr_auto').onclick();
  assert.strictEqual(calls, 1, 'Start attaches to the in-place save instead of posting again');
  assert.strictEqual(result.field('ocr_auto').textContent, 'Stop autosave');

  pending[0](savedResponse());
  await flush();
  assert.strictEqual(calls, 1, 'the single request settles once');
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 1, 'question 1 is saved once');

  result.runTimers();
  await flush();
  assert.strictEqual(calls, 2, 'question 2 posts once');
  pending[1](savedResponse());
  await flush();
  assert.strictEqual(JSON.parse(result.storage.get('ocrQueue')).i, 2);
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('[PASS] ' + name);
  }
  console.log('PASS: ' + passed + ' key-bookmarklet vectors');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
