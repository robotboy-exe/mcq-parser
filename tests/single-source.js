#!/usr/bin/env node
'use strict';

// PC02 guards: one parser source, a thin Node facade, and current generated
// bookmarklets. Static and executable evidence only; no DOM or network.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CORE_FILE = path.join(ROOT, 'src', 'parser', 'core.js');
const FACADE_FILE = path.join(ROOT, 'src', 'parser', 'parser.js');
const AUTOSAVE_FILE = path.join(ROOT, 'src', 'bookmarklets', 'stimulus', 'autosave.js');
const STIMULUS_BUILD = path.join(ROOT, 'src', 'build', 'build.js');
const KEY_BUILD = path.join(ROOT, 'src', 'bookmarklets', 'key', 'build.js');
const STIMULUS_OUT = path.join(ROOT, 'src', 'bookmarklet.js');
const KEY_OUT = path.join(ROOT, 'src', 'bookmarklets', 'key', 'bookmarklet.js');

const core = require(CORE_FILE);
const facade = require(FACADE_FILE);
const autosave = require(AUTOSAVE_FILE);

const HELPER_NAMES = [
  'SAVE_SUCCESS', 'newBatchId', 'byteLength', 'normalizeAnswer', 'optionLetters',
  'isConsecutiveQueue', 'keyCoversQueue', 'appendSavedLog', 'mergeSavedLog',
  'commitSave', 'heartbeatTick', 'checkListUrl', 'sameMeta', 'maxSavedId',
  'savedForBatch', 'deriveLiveState', 'makeSavedFingerprint',
  'savedLogPriorDuplicate', 'unverifiedSaves', 'trackUnverified',
  'savedModeSuffix', 'formatSavedRange', 'makeBatchHistoryEntry',
  'upsertBatchHistory', 'recentRowsFromTable', 'recentDuplicate',
  'savedLogHasNum', 'formMatchesQuestion', 'autosaveBlockers', 'blockerText',
  'classifySaveResponse'
];

const CORE_API_PATTERNS = [
  [/\b(?:const|let|var)\s+OPTION\s*=\s*\//, 'OPTION'],
  [/\bfunction\s+splitRegions\s*\(/, 'splitRegions'],
  [/\bfunction\s+splitQuestions\s*\(/, 'splitQuestions'],
  [/\bfunction\s+parseQuestion\s*\(/, 'parseQuestion'],
  [/\bfunction\s+extractStimuli\s*\(/, 'extractStimuli'],
  [/\bfunction\s+extractStimulusMarkers\s*\(/, 'extractStimulusMarkers'],
  [/\bfunction\s+extractStimulusIntros\s*\(/, 'extractStimulusIntros']
];

const GENERATED = new Set([STIMULUS_OUT, KEY_OUT, path.join(ROOT, 'src', 'bookmarklet.min.js')]);

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('[PASS] ' + name);
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.js$/.test(entry.name)) files.push(full);
  }
  return files;
}

function stripLineComments(text) {
  return text.split(/\r?\n/)
    .filter(line => !/^\s*\/\//.test(line))
    .join('\n');
}

function flatten(text) {
  return stripLineComments(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ');
}

function artifactBody(file) {
  const content = fs.readFileSync(file, 'utf8');
  return content.replace(/^javascript:/, '').trim();
}

test('only core.js defines the canonical parser API', () => {
  const files = walk(path.join(ROOT, 'src'), []).filter(file => !GENERATED.has(file));
  files.push(path.join(ROOT, 'ocr_helper.js'));
  const offenders = [];
  for (const file of files) {
    if (file === CORE_FILE) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const [pattern, label] of CORE_API_PATTERNS) {
      if (pattern.test(source)) offenders.push(path.relative(ROOT, file) + ' defines ' + label);
    }
  }
  assert.deepStrictEqual(offenders, []);
  for (const [pattern, label] of CORE_API_PATTERNS) {
    assert.ok(pattern.test(fs.readFileSync(CORE_FILE, 'utf8')), 'core.js must define ' + label);
  }
});

test('facade returns the exact core exports', () => {
  for (const name of Object.keys(core)) {
    assert.strictEqual(facade[name], core[name], name + ' must be the core identity');
  }
});

test('facade adds only the named stimulus autosave helpers', () => {
  assert.deepStrictEqual(Object.keys(autosave).sort(), HELPER_NAMES.slice().sort());
  for (const name of HELPER_NAMES) {
    assert.strictEqual(facade[name], autosave[name], name + ' must be the autosave identity');
    assert.ok(!(name in core), name + ' must not be a core export');
  }
  const extra = Object.keys(facade).filter(name => !(name in core) && HELPER_NAMES.indexOf(name) === -1);
  assert.deepStrictEqual(extra, []);
});

test('facade source carries no parser implementation', () => {
  const source = fs.readFileSync(FACADE_FILE, 'utf8');
  for (const [pattern, label] of CORE_API_PATTERNS) {
    assert.ok(!pattern.test(source), 'parser.js must not define ' + label);
  }
  assert.ok(source.split(/\r?\n/).length <= 20, 'parser.js must stay a thin facade');
});

test('autosave module owns policy only', () => {
  const source = fs.readFileSync(AUTOSAVE_FILE, 'utf8');
  for (const [pattern, label] of CORE_API_PATTERNS) {
    assert.ok(!pattern.test(source), 'autosave.js must not define ' + label);
  }
  for (const forbidden of ['localStorage', 'sessionStorage', 'document.', 'fetch(']) {
    assert.ok(source.indexOf(forbidden) === -1, 'autosave.js must not use ' + forbidden);
  }
  assert.ok(source.indexOf("require('./core.js')") === -1, 'autosave.js must not depend on the core');
});

test('stimulus build inlines the current core and the autosave module', () => {
  const body = artifactBody(STIMULUS_OUT);
  assert.ok(body.indexOf(flatten(fs.readFileSync(CORE_FILE, 'utf8'))) !== -1, 'stimulus artifact must inline core.js');
  assert.ok(body.indexOf(flatten(fs.readFileSync(AUTOSAVE_FILE, 'utf8'))) !== -1, 'stimulus artifact must inline autosave.js');
  assert.ok(body.indexOf(flatten(fs.readFileSync(FACADE_FILE, 'utf8'))) === -1, 'stimulus artifact must not inline the facade');
});

test('key build inlines the current core', () => {
  const body = artifactBody(KEY_OUT);
  assert.ok(body.indexOf(flatten(fs.readFileSync(CORE_FILE, 'utf8'))) !== -1, 'key artifact must inline core.js');
});

for (const [label, file] of [['stimulus', STIMULUS_OUT], ['key', KEY_OUT]]) {
  test(label + ' artifact is one line, syntax-valid, and carries one current core', () => {
    const raw = fs.readFileSync(file, 'utf8');
    assert.ok(raw.endsWith('\n'), label + ' artifact must end with one newline');
    const content = raw.slice(0, -1);
    assert.ok(content.indexOf('\n') === -1, label + ' artifact must be one line');
    assert.ok(content.startsWith('javascript:(function(){try{'), label + ' artifact must keep the wrapper');
    const body = content.replace(/^javascript:/, '');
    assert.doesNotThrow(() => new Function(body), label + ' artifact body must parse');
    const versions = body.match(/PARSER_VERSION\s*=\s*"([^"]+)"/g) || [];
    assert.strictEqual(versions.length, 1, label + ' artifact must carry exactly one parser version');
    assert.strictEqual(versions[0], 'PARSER_VERSION = "' + core.version + '"', label + ' artifact must carry the current version');
    assert.strictEqual((body.match(/\bconst OPTION\s*=/g) || []).length, 1, label + ' artifact must carry exactly one OPTION regex');
  });
}

for (const [label, file] of [['stimulus', STIMULUS_OUT], ['key', KEY_OUT]]) {
  test(label + ' artifact has no percent-escape', () => {
    const body = artifactBody(file);
    assert.ok(!/%[0-9A-Fa-f]{2}/.test(body), label + ' artifact must not contain a %HH escape');
  });
}

const PARITY_FIXTURES = ['bank-2021.txt', 'spaced-initialism-cif-stem.txt', 'spaced-initialism-wrapped.txt']
  .map(name => fs.readFileSync(path.join(ROOT, 'fixtures', 'inputs', name), 'utf8'))
  .concat([
    // A real option line after a trailing stem initial, and a trailing spaced
    // initialism before a real option line, must parse identically in both
    // generated artifacts and the canonical core.
    '1. Who is John F.\nA. Kennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe',
    '1. Who is John F.\nA.\nKennedy\nB. Adams (option A. wrong)\nC. Smith\nD. Doe',
    '1. This happened in A. D. A. 70 B. 80 C. 90 D. 100',
    '1. Which refers to C. I. F.\nA. cost insurance freight\nB. free on board\nC. carriage paid\nD. cash on delivery'
  ]);

for (const [label, file] of [['stimulus', STIMULUS_OUT], ['key', KEY_OUT]]) {
  test(label + ' artifact parses exactly like core.js', () => {
    const sandbox = {
      document: {
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => null,
        createElement: () => {
          const node = { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, before() {}, remove() {} };
          return node;
        }
      },
      location: { search: '', href: 'https://example.invalid/admin_questions.php' },
      alert: () => {},
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      console
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(artifactBody(file).replace(/^javascript:/, ''), sandbox);
    assert.ok(sandbox.OCRParser, label + ' artifact must expose the inlined core');
    assert.strictEqual(sandbox.OCRParser.version, core.version);
    for (const fixture of PARITY_FIXTURES) {
      assert.strictEqual(
        JSON.stringify(sandbox.OCRParser.parsePaste(fixture)),
        JSON.stringify(core.parsePaste(fixture)),
        label + ' artifact must parse every parity fixture exactly like core.js'
      );
    }
  });
}

for (const [label, script] of [['stimulus', STIMULUS_BUILD], ['key', KEY_BUILD]]) {
  test(label + ' generated output matches its sources', () => {
    const out = execFileSync(process.execPath, [script, '--check'], { cwd: ROOT, encoding: 'utf8' });
    assert.ok(/matches its sources/.test(out), label + ' build --check must confirm current output');
  });
}

console.log('\nPASS: ' + passed + ' single-source checks');
