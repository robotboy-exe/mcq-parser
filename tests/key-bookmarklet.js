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
  const storage = new Map(Object.entries(settings.storage || {}));
  const session = new Map(Object.entries(settings.session || {}));
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

  assert.strictEqual(body.includes('PARSER_VERSION = "2.5.4"'), true, 'inlines the canonical core version');
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
  assert.strictEqual(CORE.version, '2.5.4');
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

test('keeps the answer key in ansKey when the queue is replaced without one', () => {
  const first = keyBookmarklet();
  loadPaste(first, civicKeyText());
  const stored = JSON.parse(first.storage.get('ansKey'));
  assert.strictEqual(stored['1'], 'C');
  assert.strictEqual(stored['50'], 'C');

  const queue = JSON.parse(first.storage.get('ocrQueue'));
  first.storage.set('ocrQueue', JSON.stringify({ items: queue.items, i: 1 }));
  const second = keyBookmarklet(persisted(first));
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

test('refuses to run without the canonical core and never touches Constant Text', () => {
  const entry = fs.readFileSync(path.join(__dirname, '../src/bookmarklets/key/entry.js'), 'utf8');
  assert.strictEqual(entry.includes('constant_text'), false);
  assert.strictEqual(entry.includes('node'), false, 'no Node branch in the bookmarklet entry');
  assert.strictEqual(entry.includes('parsePaste'), true, 'key splitting comes from the core');
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
