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

  function positiveInt(value) {
    var number = Number(value);
    if (!isFinite(number) || Math.floor(number) !== number || number < 1) return null;
    return number;
  }

  function contextProblem(context) {
    if (!isObject(context)) return 'context is not an object';
    if (typeof context.localId !== 'string' || !context.localId) return 'context local id is missing';
    if (context.contextType !== 'comprehension' && context.contextType !== 'cloze') return 'context type is invalid';
    if (typeof context.title !== 'string' || typeof context.text !== 'string') return 'context text fields are invalid';
    if (!Array.isArray(context.targets)) return 'context targets are not a list';
    for (var t = 0; t < context.targets.length; t++) {
      if (positiveInt(context.targets[t]) === null) return 'context target is invalid';
    }
    var expected = positiveInt(context.expectedCount);
    if (expected === null || expected > 500) return 'context expected count is invalid';
    if (typeof context.subjectId !== 'string' || typeof context.examCategoryId !== 'string' || typeof context.examYear !== 'string') {
      return 'context pool fields are invalid';
    }
    if (context.serverId !== null && context.serverId !== undefined && positiveInt(context.serverId) === null) {
      return 'context server id is invalid';
    }
    if (typeof context.stale !== 'boolean') return 'context stale flag is invalid';
    return '';
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
    for (var c = 0; c < state.contexts.length; c++) {
      var contextIssue = contextProblem(state.contexts[c]);
      if (contextIssue) return contextIssue;
    }
    if (!Array.isArray(state.items)) return 'items is not a list';
    for (var i = 0; i < state.items.length; i++) {
      var item = state.items[i];
      if (!isObject(item)) return 'question item is not an object';
      if (item.contextRef !== undefined && typeof item.contextRef !== 'string') return 'question context reference is invalid';
      if (item.contextPosition !== undefined && typeof item.contextPosition !== 'string') return 'question context position is invalid';
      if (item.contextSlot !== undefined && typeof item.contextSlot !== 'string') return 'question context slot is invalid';
    }
    if (!isObject(state.answerKey)) return 'answer key is not an object';
    if (!isIndex(state.currentIndex)) return 'current index is not a valid position';
    if (state.pendingSubmission !== null) {
      var pending = state.pendingSubmission;
      if (!isObject(pending)) return 'pending submission is not an object';
      if (typeof pending.queueId !== 'string') return 'pending queue id is missing';
      if (!isIndex(pending.index)) return 'pending index is invalid';
      if (typeof pending.fingerprint !== 'string') return 'pending fingerprint is missing';
      if (pending.kind !== undefined
        && pending.kind !== 'question'
        && pending.kind !== 'context-create'
        && pending.kind !== 'context-update') {
        return 'pending submission kind is invalid';
      }
      if ((pending.kind === 'context-create' || pending.kind === 'context-update')
        && (typeof pending.localId !== 'string' || !pending.localId)) {
        return 'pending context id is missing';
      }
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
