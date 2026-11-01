(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEY = 'cbtOwnerTool:v1';
  var STATE_VERSION = 1;
  var LEGACY_KEYS = ['ocrQueue', 'ocrMeta', 'ansKey'];

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function isIndex(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0;
  }

  function emptyState(parserVersion, queueId) {
    return {
      version: STATE_VERSION,
      parserVersion: String(parserVersion || ''),
      queueId: String(queueId || ''),
      metadata: { subject_id: '', exam_category_id: '', exam_year: '' },
      contexts: [],
      items: [],
      answerKey: {},
      currentIndex: 0,
      pendingSubmission: null
    };
  }

  function validate(state) {
    if (!isObject(state)) return 'stored value is not an object';
    if (state.version !== STATE_VERSION) return 'unsupported state version ' + state.version;
    if (typeof state.parserVersion !== 'string' || !state.parserVersion) return 'parser version is missing';
    if (typeof state.queueId !== 'string' || !state.queueId) return 'queue id is missing';
    if (!isObject(state.metadata)) return 'metadata is not an object';
    if (!Array.isArray(state.contexts)) return 'contexts is not a list';
    if (!Array.isArray(state.items)) return 'items is not a list';
    if (!isObject(state.answerKey)) return 'answer key is not an object';
    if (!isIndex(state.currentIndex)) return 'current index is not a valid position';
    if (state.pendingSubmission !== null) {
      var pending = state.pendingSubmission;
      if (!isObject(pending)) return 'pending submission is not an object';
      if (typeof pending.queueId !== 'string') return 'pending queue id is missing';
      if (!isIndex(pending.index)) return 'pending index is invalid';
      if (typeof pending.fingerprint !== 'string') return 'pending fingerprint is missing';
    }
    return '';
  }

  function readState(storage, parserVersion) {
    var raw;
    try {
      raw = storage.getItem(KEY);
    } catch (error) {
      return { state: null, status: 'storage-error', detail: String((error && error.message) || error) };
    }
    if (raw === null || raw === undefined || raw === '') return { state: null, status: 'empty', detail: '' };
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return { state: null, status: 'corrupt', detail: 'stored state is not valid JSON' };
    }
    if (isObject(parsed) && parsed.version !== STATE_VERSION) {
      return { state: null, status: 'future-version', detail: 'stored state version ' + parsed.version + ' is not supported' };
    }
    var problem = validate(parsed);
    if (problem) return { state: null, status: 'corrupt', detail: problem };
    if (parsed.parserVersion !== String(parserVersion)) {
      return {
        state: parsed,
        status: 'stale-parser',
        detail: 'state was parsed by ' + parsed.parserVersion + ', this tool is ' + String(parserVersion)
      };
    }
    return { state: parsed, status: 'ok', detail: '' };
  }

  function writeState(storage, state) {
    try {
      storage.setItem(KEY, JSON.stringify(state));
      return { ok: true, detail: '' };
    } catch (error) {
      return { ok: false, detail: String((error && error.message) || error) };
    }
  }

  function clearState(storage) {
    try {
      storage.removeItem(KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function legacyKeys(storage) {
    var found = [];
    LEGACY_KEYS.forEach(function (key) {
      var value = null;
      try {
        value = storage.getItem(key);
      } catch (error) {
        return;
      }
      if (value !== null && value !== undefined) found.push(key);
    });
    return found;
  }

  function fingerprint(item) {
    if (!isObject(item)) return '';
    return JSON.stringify([
      item.num === undefined || item.num === null ? '' : String(item.num),
      item.question || '',
      item.a || '',
      item.b || '',
      item.c || '',
      item.d || '',
      item.e || '',
      item.f || ''
    ]);
  }

  function makeQueueId(now) {
    var stamp = Number(now);
    if (!isFinite(stamp)) stamp = Date.now();
    return 'q-' + stamp.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  return {
    KEY: KEY,
    STATE_VERSION: STATE_VERSION,
    LEGACY_KEYS: LEGACY_KEYS,
    emptyState: emptyState,
    validate: validate,
    readState: readState,
    writeState: writeState,
    clearState: clearState,
    legacyKeys: legacyKeys,
    fingerprint: fingerprint,
    makeQueueId: makeQueueId,
    isObject: isObject
  };
});
