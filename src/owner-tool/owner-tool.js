(function (root, factory) {
  var api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var window = root;

  var stateApi = (function () {
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
    if (context.adopted !== undefined && typeof context.adopted !== 'boolean') return 'context adopted flag is invalid';
    if (context.adopted === true && positiveInt(context.serverId) === null) return 'adopted context needs a server id';
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
      if (item.manualContextId !== undefined && typeof item.manualContextId !== 'string') return 'question manual context id is invalid';
      if (item.manualContextType !== undefined
        && item.manualContextType !== ''
        && item.manualContextType !== 'comprehension'
        && item.manualContextType !== 'cloze') return 'question manual context type is invalid';
      if (item.alreadySaved !== undefined && typeof item.alreadySaved !== 'boolean') return 'question saved flag is invalid';
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
  })();

  var contextsApi = (function () {
    'use strict';
  var TYPES = ['comprehension', 'cloze'];

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function makeLocalId(now) {
    var stamp = Number(now);
    if (!isFinite(stamp)) stamp = Date.now();
    return 'c-' + stamp.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function positiveInt(value) {
    var number = Number(value);
    if (!isFinite(number) || Math.floor(number) !== number || number < 1) return null;
    return number;
  }

  function parseTargets(value) {
    if (Array.isArray(value)) {
      var fromArray = [];
      value.forEach(function (entry) {
        var number = positiveInt(entry);
        if (number !== null && fromArray.indexOf(number) === -1) fromArray.push(number);
      });
      return fromArray;
    }
    var text = String(value === null || value === undefined ? '' : value);
    var targets = [];
    text.split(/[\s,;]+/).forEach(function (part) {
      if (!part) return;
      var range = part.match(/^([1-9][0-9]*)-([1-9][0-9]*)$/);
      if (range) {
        var start = Number(range[1]);
        var end = Number(range[2]);
        if (end < start || end - start > 500) return;
        for (var number = start; number <= end; number++) {
          if (targets.indexOf(number) === -1) targets.push(number);
        }
        return;
      }
      var single = positiveInt(part);
      if (single !== null && targets.indexOf(single) === -1) targets.push(single);
    });
    return targets;
  }

  function clozeSlots(text) {
    var slots = [];
    var re = /\[\[gap:([0-9]{1,3})\]\]/g;
    var match;
    while ((match = re.exec(String(text === null || text === undefined ? '' : text)))) {
      var slot = Number(match[1]);
      if (slot > 0 && slots.indexOf(slot) === -1) slots.push(slot);
    }
    slots.sort(function (a, b) { return a - b; });
    return slots;
  }

  function emptyContext(pool, localId) {
    var source = isObject(pool) ? pool : {};
    return {
      localId: String(localId || makeLocalId()),
      contextType: TYPES[0],
      title: '',
      text: '',
      targets: [],
      expectedCount: 1,
      subjectId: source.subject_id === undefined ? '' : String(source.subject_id || ''),
      examCategoryId: source.exam_category_id === undefined ? '' : String(source.exam_category_id || ''),
      examYear: source.exam_year === undefined ? '' : String(source.exam_year || ''),
      serverId: null,
      stale: false,
      adopted: false
    };
  }

  function fingerprint(context) {
    if (!isObject(context)) return '';
    return JSON.stringify([
      context.localId || '',
      context.contextType || '',
      context.title || '',
      context.text || '',
      Array.isArray(context.targets) ? context.targets : [],
      context.expectedCount === undefined ? '' : String(context.expectedCount),
      context.subjectId || '',
      context.examCategoryId || '',
      context.examYear || '',
      context.serverId === null || context.serverId === undefined ? '' : String(context.serverId),
      context.stale ? '1' : '0'
    ]);
  }

  function findById(contexts, localId) {
    if (!Array.isArray(contexts)) return null;
    for (var i = 0; i < contexts.length; i++) {
      if (contexts[i] && contexts[i].localId === localId) return contexts[i];
    }
    return null;
  }

  function duplicateServerIds(contexts) {
    var seen = {};
    var duplicates = [];
    if (!Array.isArray(contexts)) return duplicates;
    contexts.forEach(function (context) {
      if (!context || context.serverId === null || context.serverId === undefined) return;
      var id = String(context.serverId);
      if (seen[id]) {
        if (duplicates.indexOf(id) === -1) duplicates.push(id);
      } else {
        seen[id] = true;
      }
    });
    return duplicates;
  }

  function syncLinks(state) {
    if (!isObject(state) || !Array.isArray(state.items) || !Array.isArray(state.contexts)) return [];
    var byNumber = {};
    var conflicts = [];
    var itemByNumber = {};
    state.items.forEach(function (item) {
      if (item && item.num !== null && item.num !== undefined) itemByNumber[String(item.num)] = item;
    });
    state.contexts.forEach(function (context) {
      if (!context || !Array.isArray(context.targets)) return;
      context.targets.forEach(function (target) {
        var key = String(target);
        if (!itemByNumber[key]) return;
        if (byNumber[key] && byNumber[key] !== context) {
          if (conflicts.indexOf(Number(target)) === -1) conflicts.push(Number(target));
          return;
        }
        byNumber[key] = context;
      });
    });
    state.items.forEach(function (item) {
      var key = item && item.num !== null && item.num !== undefined ? String(item.num) : '';
      var context = key ? byNumber[key] : null;
      if (!context) {
        item.contextRef = '';
        item.contextPosition = '';
        item.contextSlot = '';
        return;
      }
      var position = 0;
      var count = 0;
      context.targets.forEach(function (target) {
        if (!itemByNumber[String(target)]) return;
        count += 1;
        if (position === 0 && String(target) === key) position = count;
      });
      item.contextRef = context.localId;
      item.contextPosition = position ? String(position) : '';
      var slots = context.contextType === 'cloze' ? clozeSlots(context.text) : [];
      item.contextSlot = position && slots[position - 1] ? String(slots[position - 1]) : '';
    });
    conflicts.sort(function (a, b) { return a - b; });
    return conflicts;
  }

  function linkInfo(state, item) {
    var info = { card: null, blocked: false, reason: '', message: '' };
    if (!item) return info;
    var manualId = positiveInt(item.manualContextId);
    if (manualId !== null) {
      info.card = item.contextRef ? findById(state.contexts, item.contextRef) : null;
      var manualType = item.manualContextType || (info.card && info.card.contextType) || '';
      if (manualType === 'cloze' && !item.contextSlot) {
        info.blocked = true;
        info.reason = 'missing-gap';
        info.message = 'Choose the right gap number.';
      }
      return info;
    }
    if (!item.contextRef) return info;
    var card = findById(state.contexts, item.contextRef);
    if (!card) {
      info.blocked = true;
      info.reason = 'missing-context';
      info.message = 'Choose the shared text again.';
      return info;
    }
    info.card = card;
    var claimed = item.num !== null && item.num !== undefined && state.contexts.some(function (other) {
      return other !== card && Array.isArray(other.targets) && other.targets.indexOf(Number(item.num)) !== -1;
    });
    if (claimed) {
      info.blocked = true;
      info.reason = 'duplicate-target';
      info.message = 'This question is in two shared texts. Remove one.';
      return info;
    }
    if (card.serverId !== null && card.serverId !== undefined && duplicateServerIds(state.contexts).length) {
      info.blocked = true;
      info.reason = 'duplicate-context';
      info.message = 'Two shared texts use the same saved copy. Fix one.';
      return info;
    }
    if (card.serverId === null || card.serverId === undefined) {
      info.blocked = true;
      info.reason = 'unsaved-context';
      info.message = 'Save the shared context first.';
      return info;
    }
    if (card.stale) {
      info.blocked = true;
      info.reason = 'stale-context';
      info.message = 'Save the shared text again first.';
      return info;
    }
    if (card.contextType === 'cloze' && !item.contextSlot) {
      info.blocked = true;
      info.reason = 'missing-gap';
      info.message = 'Choose the right gap number.';
    }
    return info;
  }

  function validateContext(context) {
    if (!isObject(context)) return 'context is not an object';
    if (typeof context.localId !== 'string' || !context.localId) return 'context local id is missing';
    if (TYPES.indexOf(context.contextType) === -1) return 'context type is invalid';
    if (typeof context.title !== 'string' || typeof context.text !== 'string') return 'context text fields are invalid';
    if (!Array.isArray(context.targets)) return 'context targets are not a list';
    for (var i = 0; i < context.targets.length; i++) {
      if (positiveInt(context.targets[i]) === null) return 'context target is invalid';
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
    if (context.adopted !== undefined && typeof context.adopted !== 'boolean') return 'context adopted flag is invalid';
    if (context.adopted === true && positiveInt(context.serverId) === null) return 'adopted context needs a server id';
    return '';
  }

  return {
    TYPES: TYPES,
    makeLocalId: makeLocalId,
    parseTargets: parseTargets,
    clozeSlots: clozeSlots,
    emptyContext: emptyContext,
    fingerprint: fingerprint,
    findById: findById,
    duplicateServerIds: duplicateServerIds,
    syncLinks: syncLinks,
    linkInfo: linkInfo,
    validateContext: validateContext
  };
  })();

  var contextFormApi = (function () {
    'use strict';
  function create(options) {
    var model = options.model;
    var doc = options.document || (typeof document !== 'undefined' ? document : null);
    var armedId = '';
    var syncing = false;
    var pageEditing = false;
    var pageContextId = '';

    function questionForm() {
      var action = doc.querySelector('input[name=action][value=save_question]');
      return action && action.form ? action.form : null;
    }

    function questionButton() {
      var form = questionForm();
      return form ? form.querySelector('button[type=submit]') : null;
    }

    function contextForm() {
      var text = doc.getElementById('context_text');
      return text && text.form ? text.form : null;
    }

    function contextButton(form) {
      return form ? form.querySelector('button[type=submit]') : null;
    }

    function field(form, name, id) {
      if (form && form.elements && form.elements[name]) return form.elements[name];
      return id ? doc.getElementById(id) : null;
    }

    function contextIdField(form) {
      var existing = field(form, 'context_id', '');
      if (existing) return existing;
      var hidden = doc.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'context_id';
      hidden.value = '';
      form.appendChild(hidden);
      if (form.elements && !form.elements.context_id) form.elements.context_id = hidden;
      return hidden;
    }

    function setValue(id, next) {
      var element = doc.getElementById(id);
      if (element) element.value = next === null || next === undefined ? '' : String(next);
    }

    function targetField() {
      return doc.getElementById('owner_context_targets');
    }

    function targetWrap() {
      return doc.getElementById('owner_context_targets_field');
    }

    function setStatus(text) {
      var status = doc.getElementById('owner_context_native_status');
      if (status) status.textContent = text || '';
    }

    function isEditing() {
      return pageEditing;
    }

    function setVisible(visible) {
      var form = contextForm();
      if (form) form.hidden = !visible;
    }

    function fill(card) {
      var form = contextForm();
      if (!form) return false;
      syncing = true;
      try {
        var action = field(form, 'action', '');
        var contextId = contextIdField(form);
        var saved = card.serverId !== null && card.serverId !== undefined;
        if (action) action.value = saved ? 'update_context' : 'save_context';
        contextId.value = saved ? String(card.serverId) : '';
        var values = {
          context_type: card.contextType,
          title: card.title,
          context_text: card.text,
          subject_id: card.subjectId,
          exam_category_id: card.examCategoryId,
          exam_year: card.examYear,
          expected_member_count: String(card.expectedCount)
        };
        var ids = {
          context_type: 'context_type',
          title: 'context_title',
          context_text: 'context_text',
          subject_id: 'context_subject_id',
          exam_category_id: 'context_exam_category_id',
          exam_year: 'context_exam_year',
          expected_member_count: 'expected_member_count'
        };
        Object.keys(values).forEach(function (name) {
          var element = field(form, name, ids[name]);
          if (element) element.value = values[name];
        });
        var targets = targetField();
        if (targets) targets.value = card.targets.join(', ');
        var wrap = targetWrap();
        if (wrap) wrap.hidden = false;
        var button = contextButton(form);
        if (button) button.textContent = saved ? 'Save Changes' : 'Save Shared Text';
        setStatus(saved
          ? 'Using saved text #' + card.serverId
          : 'New text - not saved');
        armedId = card.localId;
      } finally {
        syncing = false;
      }
      return true;
    }

    function read(card) {
      var form = contextForm();
      if (!form) return card;
      var mapping = {
        contextType: ['context_type', 'context_type'],
        title: ['title', 'context_title'],
        text: ['context_text', 'context_text'],
        subjectId: ['subject_id', 'context_subject_id'],
        examCategoryId: ['exam_category_id', 'context_exam_category_id'],
        examYear: ['exam_year', 'context_exam_year']
      };
      Object.keys(mapping).forEach(function (name) {
        var element = field(form, mapping[name][0], mapping[name][1]);
        if (element) card[name] = String(element.value === null || element.value === undefined ? '' : element.value);
      });
      var expected = field(form, 'expected_member_count', 'expected_member_count');
      if (expected) {
        var number = Number(expected.value);
        if (isFinite(number) && Math.floor(number) === number && number >= 1 && number <= 500) {
          card.expectedCount = number;
        }
      }
      var targets = targetField();
      if (targets) card.targets = model.parseTargets(targets.value);
      if (model.TYPES.indexOf(card.contextType) === -1) card.contextType = model.TYPES[0];
      return card;
    }

    function snapshot() {
      var card = model.emptyContext({});
      read(card);
      var form = contextForm();
      var idField = form ? field(form, 'context_id', '') : null;
      var id = idField ? Number(idField.value) : 0;
      card.serverId = isFinite(id) && Math.floor(id) === id && id > 0 ? id : null;
      card.stale = false;
      return card;
    }

    function prepare(state, item) {
      var info = { blocked: false, reason: '', message: '', card: null };
      if (item) info = model.linkInfo(state, item);
      var manualId = item && item.manualContextId ? String(item.manualContextId) : '';
      var cardId = info.card && info.card.serverId !== null && info.card.serverId !== undefined
        ? String(info.card.serverId)
        : '';
      setValue('context_id', manualId || cardId);
      setValue('context_position', item && item.contextPosition ? item.contextPosition : '');
      setValue('context_slot', item && item.contextSlot ? item.contextSlot : '');
      var button = questionButton();
      if (button) button.disabled = Boolean(info.blocked && info.reason !== 'unsaved-context');
      return info;
    }

    function clear() {
      armedId = '';
      var form = contextForm();
      if (form) {
        syncing = true;
        try {
          var action = field(form, 'action', '');
          var contextId = contextIdField(form);
          if (action) action.value = pageEditing ? 'update_context' : 'save_context';
          contextId.value = pageEditing ? pageContextId : '';
          Object.keys({
            context_type: 'comprehension',
            title: '',
            context_text: '',
            subject_id: '',
            exam_category_id: '',
            exam_year: ''
          }).forEach(function (name) {
            var element = field(form, name, name === 'title' ? 'context_title'
              : name === 'subject_id' ? 'context_subject_id'
                : name === 'exam_category_id' ? 'context_exam_category_id'
                  : name === 'exam_year' ? 'context_exam_year' : name);
            if (element) element.value = name === 'context_type' ? 'comprehension' : '';
          });
          var expected = field(form, 'expected_member_count', 'expected_member_count');
          if (expected) expected.value = '1';
          var targets = targetField();
          if (targets) targets.value = '';
          var wrap = targetWrap();
          if (wrap) wrap.hidden = true;
          var contextSubmit = contextButton(form);
          if (contextSubmit) contextSubmit.textContent = pageEditing ? 'Save Changes' : 'Save Shared Text';
          setStatus(pageEditing && pageContextId
            ? 'Editing shared text #' + pageContextId
            : 'Paste shared text or tap Add.');
        } finally {
          syncing = false;
        }
      }
      setValue('context_id', '');
      setValue('context_position', '');
      setValue('context_slot', '');
      var button = questionButton();
      if (button) button.disabled = false;
    }

    function changed() {
      if (syncing) return;
      if (!armedId) {
        if (pageEditing && options.onNativeChange) options.onNativeChange(snapshot());
        return;
      }
      var card = options.getCard(armedId);
      if (!card) return;
      var before = model.fingerprint(card);
      read(card);
      if (model.fingerprint(card) === before) return;
      if (card.serverId !== null && card.serverId !== undefined) card.stale = true;
      if (options.onChange) options.onChange(card);
    }

    var form = contextForm();
    if (form) {
      var initialAction = field(form, 'action', '');
      pageEditing = Boolean(initialAction && String(initialAction.value) === 'update_context');
      var initialId = field(form, 'context_id', '');
      if (pageEditing && initialId && /^[1-9][0-9]*$/.test(String(initialId.value || ''))) {
        pageContextId = String(initialId.value);
      }
      form.addEventListener('submit', function (event) {
        if (!armedId) return event;
        var card = options.getCard(armedId);
        if (card) {
          read(card);
          options.onSubmit(card);
        }
        return event;
      });
      ['context_type', 'context_title', 'context_text', 'context_subject_id',
        'context_exam_category_id', 'context_exam_year', 'expected_member_count',
        'owner_context_targets'].forEach(function (id) {
        var element = doc.getElementById(id);
        if (!element) return;
        element.addEventListener('input', changed);
        element.addEventListener('change', changed);
      });
    }

    return {
      fill: fill,
      read: read,
      prepare: prepare,
      clear: clear,
      hasForm: Boolean(form),
      isEditing: isEditing,
      setVisible: setVisible,
      snapshot: snapshot,
      armedId: function () { return armedId; }
    };
  }

  return { create: create };
  })();

  var contextCardApi = (function () {
    'use strict';
  function create() {
    function status(card) {
      if (card.serverId !== null && card.serverId !== undefined && card.stale) {
        return 'Text #' + card.serverId + ': save changes first';
      }
      if (card.serverId === null || card.serverId === undefined) return 'Not saved yet';
      return 'Text #' + card.serverId + ': saved';
    }
    return { status: status };
  }

  return { create: create };
  })();

  var contextPanelApi = (function () {
    'use strict';
  var CREATE_FLASH = /^Context #(\d+) created\. Link its members, then activate it\.$/;
  var UPDATE_FLASH = /^Context #(\d+) updated\. It is inactive until revalidated\.$/;

  function create(options) {
    var model = options.model;
    var root = options.root;
    var doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
    var panelWarning = '';
    var panelNotice = '';
    var selectedLocalId = '';
    var expandedLocalId = '';
    function state() {
      return options.getState();
    }
    function current() {
      var data = state();
      if (!data || !Array.isArray(data.items) || !data.items.length) return null;
      return data.items[data.currentIndex] || null;
    }
    function editorVisible(card) {
      if (form.isEditing()) return true;
      if (!card) return false;
      if (card.serverId === null || card.serverId === undefined) return true;
      return expandedLocalId === card.localId;
    }
    function make(tag, props, text) {
      var element = doc.createElement(tag);
      Object.keys(props || {}).forEach(function (key) { element[key] = props[key]; });
      if (text !== undefined) element.textContent = String(text);
      return element;
    }
    function add(parent, tag, props, text) {
      var element = make(tag, props, text);
      parent.appendChild(element);
      return element;
    }

    var cards = options.cardApi.create(model, doc);
    var form = options.formApi.create({
      model: model,
      document: doc,
      getCard: function (localId) { return model.findById(state().contexts, localId); },
      onSubmit: function (card) { submitCard(card); },
      onChange: function (card) { nativeChanged(card); },
      onNativeChange: function (card) { duplicateNotice(card); }
    });
    function showWarning(text) {
      panelWarning = text || '';
      var element = doc.getElementById('owner_context_warning');
      if (element) {
        element.textContent = panelWarning;
        element.hidden = !panelWarning;
      }
    }
    function linkWarning(text) {
      var element = doc.getElementById('owner_context_link_warning');
      if (!element) return;
      element.textContent = text || '';
      element.hidden = !text;
    }
    function duplicateNotice(card) {
      var element = doc.getElementById('owner_context_duplicate');
      if (!element) return;
      var duplicate = card && options.findDuplicateContext
        ? options.findDuplicateContext(card)
        : null;
      element.textContent = duplicate
        ? 'This looks like saved shared text #' + duplicate.context_id + '. You can still save.'
        : '';
      element.hidden = !duplicate;
    }
    function refreshStatus() {
      var data = state();
      var conflicts = model.syncLinks(data);
      var element = doc.getElementById('owner_context_status');
      if (element) {
        if (form.isEditing() && !selectedLocalId) {
          element.textContent = 'Editing saved shared text.';
          return;
        }
        var text = data.contexts.length + (data.contexts.length === 1 ? ' shared text' : ' shared texts');
        var selected = model.findById(data.contexts, selectedLocalId);
        if (selected) text += '. ' + cards.status(selected) + '.';
        if (conflicts.length) text += ' Question ' + conflicts.join(', ') + ' is used twice.';
        if (panelNotice) text += ' ' + panelNotice;
        element.textContent = text;
      }
    }
    function prepare(item) {
      var info = form.prepare(state(), item || current());
      linkWarning(info.message);
      return !info.blocked;
    }
    function nativeChanged(card) {
      panelNotice = card.serverId !== null && card.serverId !== undefined
        ? 'Save the shared text first.'
        : 'This browser keeps your unsaved text.';
      model.syncLinks(state());
      options.persist();
      if (options.onContextChange) options.onContextChange(card);
      render();
      prepare(current());
    }
    function fillContext(card) {
      selectedLocalId = card.localId;
      if (!form.fill(card)) {
        showWarning('Shared text is not set up yet.');
        return false;
      }
      if (card.serverId === null || card.serverId === undefined || form.isEditing()) {
        expandedLocalId = card.localId;
      }
      form.setVisible(editorVisible(card));
      panelNotice = card.serverId !== null && card.serverId !== undefined
        ? 'This shared text is saved. Save again after changes.'
        : 'Check the boxes, then save.';
      refreshStatus();
      return true;
    }
    function autoFillDraft() {
      var data = state();
      var card = model.findById(data.contexts, selectedLocalId) || data.contexts.find(function (context) {
        return context.serverId === null || context.serverId === undefined;
      }) || data.contexts[0];
      return card ? fillContext(card) : false;
    }
    function removeSelected() {
      var data = state();
      var card = model.findById(data.contexts, selectedLocalId);
      var index = data.contexts.indexOf(card);
      if (!card || index < 0) return;
      if (card.serverId !== null && card.serverId !== undefined) {
        showWarning('Removed this browser copy. Saved text #' + card.serverId + ' is still there.');
      } else {
        showWarning('');
      }
      data.contexts.splice(index, 1);
      if (expandedLocalId === card.localId) expandedLocalId = '';
      selectedLocalId = data.contexts[index]
        ? data.contexts[index].localId
        : data.contexts[index - 1] ? data.contexts[index - 1].localId : '';
      model.syncLinks(data);
      options.persist();
      var next = model.findById(data.contexts, selectedLocalId);
      if (!next) form.clear();
      render();
      if (next) fillContext(next);
      prepare(current());
    }
    function render() {
      var data = state();
      if (!model.findById(data.contexts, selectedLocalId)) {
        var firstDraft = data.contexts.find(function (context) {
          return context.serverId === null || context.serverId === undefined;
        });
        selectedLocalId = form.isEditing() ? ''
          : firstDraft ? firstDraft.localId : data.contexts[0] ? data.contexts[0].localId : '';
      }
      var selected = model.findById(data.contexts, selectedLocalId);
      root.textContent = '';
      var head = add(root, 'div', { className: 'owner-context-head' });
      if (!form.isEditing()) {
        var addButton = add(head, 'button', {
          type: 'button',
          className: 'admin-btn admin-btn-muted',
          id: 'owner_context_add'
        }, 'Add Shared Text');
        addButton.onclick = function () {
          var card = model.emptyContext(data.metadata);
          data.contexts.push(card);
          selectedLocalId = card.localId;
          expandedLocalId = card.localId;
          panelNotice = 'New shared text added.';
          showWarning('');
          model.syncLinks(data);
          options.persist();
          render();
          fillContext(card);
          prepare(current());
        };
      }
      if (selectedLocalId && !form.isEditing()) {
        var removeButton = add(head, 'button', {
          type: 'button',
          className: 'admin-btn admin-btn-muted',
          id: 'owner_context_remove'
        }, 'Remove This Copy');
        removeButton.onclick = removeSelected;
      }
      if (selected && selected.serverId !== null && selected.serverId !== undefined && !form.isEditing()) {
        if (!editorVisible(selected)) {
          var showButton = add(head, 'button', {
            type: 'button',
            className: 'admin-btn admin-btn-muted',
            id: 'owner_context_show'
          }, 'Show');
          showButton.onclick = function () {
            expandedLocalId = selected.localId;
            form.setVisible(true);
            render();
          };
        } else {
          var hideButton = add(head, 'button', {
            type: 'button',
            className: 'admin-btn admin-btn-muted',
            id: 'owner_context_hide'
          }, 'Hide');
          hideButton.onclick = function () {
            expandedLocalId = '';
            form.setVisible(false);
            render();
            prepare(current());
          };
        }
      }
      add(head, 'span', { className: 'owner-context-hint' }, form.isEditing()
        ? 'Paste can replace these fields.'
        : 'Paste fills this in. Tap Add to make one.');
      if (data.contexts.length > 1 && (!form.isEditing() || selectedLocalId)) {
        add(root, 'label', {
          id: 'owner_context_select_label',
          htmlFor: 'owner_context_select',
          className: 'owner-context-hint'
        }, 'Shared text to edit');
        var select = add(root, 'select', { id: 'owner_context_select', className: 'owner-context-select' });
        data.contexts.forEach(function (card, index) {
          add(select, 'option', { value: card.localId }, (index + 1) + '. ' + (card.title || 'No name') + ' - ' + cards.status(card));
        });
        select.value = selectedLocalId;
        select.onchange = function () {
          var card = model.findById(data.contexts, select.value);
          if (card) {
            fillContext(card);
            render();
          }
          prepare(current());
        };
      }
      add(root, 'div', { id: 'owner_context_status', className: 'owner-context-status' });
      var warning = add(root, 'div', {
        id: 'owner_context_warning',
        className: 'admin-alert owner-tool-error owner-context-warning'
      });
      warning.hidden = !panelWarning;
      warning.textContent = panelWarning;
      var link = add(root, 'div', {
        id: 'owner_context_link_warning',
        className: 'admin-alert owner-tool-error owner-context-warning'
      });
      link.hidden = true;
      var duplicate = add(root, 'div', {
        id: 'owner_context_duplicate',
        className: 'admin-alert owner-tool-duplicate owner-context-warning'
      });
      duplicate.hidden = true;
      form.setVisible(editorVisible(selected));
      if (selected && form.armedId() !== selected.localId) form.fill(selected);
      refreshStatus();
      duplicateNotice(selected || (form.isEditing() ? form.snapshot() : null));
    }
    function submitCard(card) {
      var data = state();
      model.syncLinks(data);
      data.pendingSubmission = {
        kind: card.serverId !== null && card.serverId !== undefined ? 'context-update' : 'context-create',
        localId: card.localId,
        queueId: data.queueId,
        index: data.currentIndex,
        fingerprint: model.fingerprint(card),
        at: Date.now()
      };
      options.persist();
    }
    function resolvePending(flash, hasError) {
      var data = state();
      var pending = data.pendingSubmission;
      if (!pending || (pending.kind !== 'context-create' && pending.kind !== 'context-update')) return null;
      var card = model.findById(data.contexts, pending.localId);
      var matches = pending.queueId === data.queueId
        && Boolean(card)
        && model.fingerprint(card) === pending.fingerprint;
      if (hasError) {
        data.pendingSubmission = null;
        options.persist();
        if (card) {
          selectedLocalId = card.localId;
          expandedLocalId = card.localId;
        }
        showWarning('It did not save. Fix the form and try again.');
        render();
        return 'error';
      }
      var pattern = pending.kind === 'context-create' ? CREATE_FLASH : UPDATE_FLASH;
      var match = matches ? String(flash || '').match(pattern) : null;
      if (!match) {
        data.pendingSubmission = null;
        options.persist();
        if (card) {
          selectedLocalId = card.localId;
          expandedLocalId = card.localId;
        }
        showWarning('I am not sure it saved. Check Saved Shared Texts first.');
        render();
        return 'ambiguous';
      }
      var serverId = Number(match[1]);
      var boundWrong = pending.kind === 'context-create'
        ? card.serverId !== null && card.serverId !== undefined
        : Number(card.serverId) !== serverId;
      var duplicate = data.contexts.some(function (other) {
        return other !== card && Number(other.serverId) === serverId;
      });
      if (boundWrong || duplicate) {
        data.pendingSubmission = null;
        options.persist();
        if (card) {
          selectedLocalId = card.localId;
          expandedLocalId = card.localId;
        }
        showWarning('I could not match the saved text. Check Saved Shared Texts.');
        render();
        return 'ambiguous';
      }
      card.serverId = serverId;
      card.stale = false;
      data.pendingSubmission = null;
      model.syncLinks(data);
      options.persist();
      var nextDraft = data.contexts.find(function (other) {
        return other !== card && (other.serverId === null || other.serverId === undefined);
      });
      panelWarning = '';
      panelNotice = 'Shared text #' + serverId + ' saved.' + (nextDraft ? ' Save the next shared text.' : '');
      selectedLocalId = nextDraft ? nextDraft.localId : card.localId;
      expandedLocalId = nextDraft ? nextDraft.localId : '';
      showWarning('');
      render();
      prepare(current());
      if (options.onContextResolved) options.onContextResolved(card);
      return 'success';
    }
    function clear() {
      panelWarning = '';
      panelNotice = '';
      selectedLocalId = '';
      expandedLocalId = '';
      form.clear();
      render();
      linkWarning('');
    }

    return {
      render: render,
      fillQuestion: function (item) {
        model.syncLinks(state());
        if (form.isEditing() && !selectedLocalId) return prepare(item);
        var card = item && item.contextRef ? model.findById(state().contexts, item.contextRef) : null;
        var selected = model.findById(state().contexts, selectedLocalId);
        var canFollowQuestion = !selected || selected === card
          || (selected.serverId !== null && selected.serverId !== undefined);
        if (card && form.armedId() !== card.localId && canFollowQuestion) fillContext(card);
        return prepare(item);
      },
      canSaveQuestion: function () {
        model.syncLinks(state());
        return prepare(current());
      },
      questionBlocker: function () {
        model.syncLinks(state());
        var info = form.prepare(state(), current());
        linkWarning(info.message);
        return info.blocked ? info : null;
      },
      prepare: prepare,
      autoFillDraft: autoFillDraft,
      resolvePending: resolvePending,
      clear: clear
    };
  }

  return { create: create };
  })();

  function startOwnerTool() {
    'use strict';
  var TOOL_VERSION = '1.5.2';
  var SUCCESS_FLASH = /^Question saved successfully \(Question ID: \d+\)\.$/;
  var META_FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  var OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d'];

  var stateApi = window.CBTOwnerState;
  var parser = window.OCRParser;
  var textApi = window.CBTText;
  var contextModel = window.CBTOwnerContexts;
  var contextFormApi = window.CBTOwnerContextForm;
  var contextCardApi = window.CBTOwnerContextCard;
  var contextPanelApi = window.CBTOwnerContextPanel;
  if (!stateApi || !parser || !textApi) {
    if (window.console && window.console.warn) {
      window.console.warn('Owner tool: the parser, state, or renderer module is not loaded.');
    }
    return;
  }

  var saveAction = document.querySelector('input[name=action][value=save_question]');
  var updateAction = document.querySelector('input[name=action][value=update_question]');
  var actionInput = saveAction || updateAction;
  var form = actionInput && actionInput.form;
  if (!form) return;
  var editMode = Boolean(updateAction);

  var storage = window.localStorage;
  var parserVersion = String(parser.version || '');
  var decision = stateApi.readState(storage, parserVersion);
  var loaded = decision.state || stateApi.emptyState(parserVersion, stateApi.makeQueueId());
  var blocked = decision.status !== 'ok' && decision.status !== 'empty';
  var pasteVisible = false;
  var savedSelection = null;
  var contextPanel = null;
  var serverContexts = (function () {
    var element = document.getElementById('owner_tool_context_data');
    if (!element) return [];
    try {
      var data = JSON.parse(String(element.textContent || '[]'));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  })();
  var recentQuestions = (function () {
    var element = document.getElementById('owner_tool_recent_questions');
    if (!element) return [];
    try {
      var data = JSON.parse(String(element.textContent || '[]'));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  })();

  function $(id) {
    return document.getElementById(id);
  }

  function persist() {
    if (blocked) return false;
    loaded.parserVersion = parserVersion;
    loaded.version = stateApi.STATE_VERSION;
    var written = stateApi.writeState(storage, loaded);
    if (!written.ok) warn('This browser cannot save your work.');
    return written.ok;
  }

  function note(text) {
    var el = $('owner_tool_status');
    if (el) el.textContent = text;
  }

  function warn(text) {
    var el = $('owner_tool_warning');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  }

  function hint(text) {
    var el = $('owner_tool_hint');
    if (el) el.textContent = text || '';
  }

  function plainFlag(value) {
    var text = String(value || '');
    if (text === 'question number missing') return 'no question number';
    if (text === 'question text missing or very short') return 'question is empty or too short';
    if (text === 'a letter appears twice (merged questions?)') return 'two questions may be joined';
    if (text === 'E/F options present') return 'option E or F was found';
    if (text === 'OCR boundaries repaired; verify question and option split') return 'I fixed the text split. Please check it.';
    var optionMissing = text.match(/^option ([A-F]) missing$/);
    if (optionMissing) return 'option ' + optionMissing[1] + ' is empty';
    var optionLong = text.match(/^option ([A-F]) over 500 characters$/);
    if (optionLong) return 'option ' + optionLong[1] + ' is too long';
    var oneMissing = text.match(/^question (\d+) missing \(numbering gap\)$/);
    if (oneMissing) return 'question ' + oneMissing[1] + ' is missing';
    var manyMissing = text.match(/^questions (\d+)-(\d+) missing \(numbering gap\)$/);
    if (manyMissing) return 'questions ' + manyMissing[1] + '-' + manyMissing[2] + ' are missing';
    return 'please check this question';
  }

  function plainParserWarning(value) {
    var text = String(value || '');
    if (/fewer than two|links fewer than two/.test(text)) return 'This shared text has too few questions. Please check it.';
    if (/has no passage text|has no shared text/.test(text)) return 'The shared text is missing.';
    if (/not contiguous|out of order/.test(text)) return 'The questions are out of order. Please check them.';
    if (/duplicate cloze group/.test(text)) return 'I found the same gaps twice. I kept the first set.';
    if (/collide with an ordinary question/.test(text)) return 'Some gap numbers clash with a question. Please check them.';
    if (/no numbered gaps/.test(text)) return 'The shared text has no numbered gaps.';
    if (/does not match the passage gaps/.test(text)) return 'The gap numbers do not match.';
    if (/no stable four-column alignment/.test(text)) return 'The answer columns do not line up.';
    if (/missing the [A-D] option/.test(text)) return 'A gap needs all four answers.';
    if (/option longer than 500 characters/.test(text)) return 'A gap answer is too long.';
    if (/fewer than two rows/.test(text)) return 'The gap table has too few rows.';
    if (/was not parsed/.test(text)) return 'I could not read one question. Please check it.';
    if (/claimed by more than one passage/.test(text)) return 'One question is in two shared texts.';
    if (/no complete \(a\)-\(d\) option set/.test(text)) return 'One question needs answers A to D.';
    if (/more than one letter/.test(text)) return 'One question has two answers.';
    if (/no answer-key entry/.test(text)) return 'One question has no answer.';
    if (/names questions/.test(text)) return 'The question numbers do not match the shared text.';
    return 'Please check the paste.';
  }

  function plainContextMessage(value) {
    var text = String(value || '');
    var rules = [
      [/The context could not be saved\.[^.]*\./gi, 'The shared text did not save. Ask for help.'],
      [/Context tables are not available\.[^.]*\./gi, 'Shared text is not set up yet.'],
      [/Shared contexts could not be loaded\.[^.]*\./gi, 'Shared text did not load. Ask for help.'],
      [/The selected context no longer exists\.[^.]*\./gi, 'That shared text is gone. Reload the page.'],
      [/That context no longer exists\.[^.]*\./gi, 'That shared text is gone. Reload the page.'],
      [/The selected context was not found\./gi, 'That shared text was not found.'],
      [/Invalid context selected for editing\./gi, 'Choose shared text to change.'],
      [/Choose a valid context type \(comprehension or cloze\)\./gi, 'Choose a reading passage or gap passage.'],
      [/Please enter a context title\./gi, 'Give the shared text a name.'],
      [/The context title must be 200 characters or fewer\./gi, 'The name is too long.'],
      [/Please enter the shared context text\./gi, 'Add the shared text.'],
      [/The shared context text is too long\./gi, 'The shared text is too long.'],
      [/Choose a valid subject for the context pool\./gi, 'Choose a subject.'],
      [/The context subject is inactive or does not exist\./gi, 'That subject is not ready.'],
      [/Choose a valid exam category for the context pool\./gi, 'Choose an exam.'],
      [/The context exam category is inactive or does not exist\./gi, 'That exam is not ready.'],
      [/Enter a context exam year between 1900 and 2100\./gi, 'Enter a year from 1900 to 2100.'],
      [/The expected member count must equal the number of distinct \[\[gap:N\]\] tokens\./gi, 'The question count must match the gap count.'],
      [/The expected member count must be between 1 and \d+\./gi, 'Enter 1 to 500 questions.'],
      [/A comprehension context must not contain cloze gap tokens\./gi, 'A reading passage cannot use [[gap:N]].'],
      [/A cloze context needs at least one \[\[gap:N\]\] token\./gi, 'Add at least one [[gap:N]].'],
      [/Cloze tokens must use numbers from 1 to 999\./gi, 'Gap numbers must be from 1 to 999.'],
      [/The context type cannot change while linked questions exist\./gi, 'Remove its questions before changing the text type.'],
      [/The context pool cannot change while linked questions exist\./gi, 'Remove its questions before changing subject, exam, or year.'],
      [/A context position or cloze slot requires a selected context\./gi, 'Choose shared text before adding an order or gap.'],
      [/The question does not match the context subject, exam category, and year pool\./gi, 'The question and shared text need the same subject, exam, and year.'],
      [/Enter a context position between 1 and \d+\./gi, 'Enter a question order from 1 to 500.'],
      [/A comprehension member must not have a cloze slot\./gi, 'A reading passage does not use a gap number.'],
      [/Enter a cloze slot between 1 and 999\./gi, 'Enter a gap number from 1 to 999.'],
      [/The cloze slot \[\[gap:\d+\]\] is not present in the context text\./gi, 'That gap number is not in the shared text.'],
      [/The context type is invalid\./gi, 'Choose a reading passage or gap passage.'],
      [/The context already has its expected number of members\./gi, 'This shared text already has enough questions.'],
      [/Another question already uses that context position\./gi, 'Another question already uses that order number.'],
      [/Another question already uses that cloze slot\./gi, 'Another question already uses that gap number.'],
      [/The [^.]+ has an invalid submitted value\./gi, 'One box has a value I cannot use.'],
      [/[A-Za-z ]+ must be a positive whole number\./g, 'Use a number that is 1 or more.'],
      [/Context #(\d+) cannot be activated: /gi, 'Shared text #$1 cannot be turned on. '],
      [/The context has no title\./gi, 'Give the shared text a name.'],
      [/The context has no shared text\./gi, 'Add the shared text.'],
      [/The context exam year is invalid\./gi, 'Fix the year.'],
      [/The expected member count is invalid\./gi, 'Fix the question count.'],
      [/The context has no linked questions\./gi, 'Add questions to this shared text.'],
      [/The context has (\d+) linked question\(s\) but expects (\d+)\./gi, 'It has $1 questions. It needs $2.'],
      [/Question #(\d+) has no valid context position\./gi, 'Question #$1 needs an order number.'],
      [/Question #(\d+) has no question text\./gi, 'Question #$1 is empty.'],
      [/Question #(\d+) is missing one of its four options\./gi, 'Question #$1 needs four answers.'],
      [/Question #(\d+) has no valid correct answer\./gi, 'Question #$1 needs a right answer.'],
      [/Question #(\d+) does not match the context pool\./gi, 'Question #$1 has the wrong subject, exam, or year.'],
      [/Question #(\d+) must stay inactive while linked to a context\./gi, 'Question #$1 must stay off while it uses shared text.'],
      [/Question #(\d+) has no cloze slot\./gi, 'Question #$1 needs a gap number.'],
      [/Question #(\d+) must not have a cloze slot in a comprehension context\./gi, 'Question #$1 must not have a gap number here.'],
      [/Context positions must be unique and run from 1 to (\d+)\./gi, 'Order numbers must run from 1 to $1.'],
      [/Cloze slots must be unique\./gi, 'Each gap number can be used once.'],
      [/The linked cloze slots must match the \[\[gap:N\]\] tokens in the context text\./gi, 'Gap numbers must match the [[gap:N]] marks.']
    ];
    var next = text;
    rules.forEach(function (rule) { next = next.replace(rule[0], rule[1]); });
    return next === text ? '' : next;
  }

  function plainServerMessage(value) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (/session token is invalid|expired/.test(text)) return 'This page is too old. Reload it and try again.';
    var contextMessage = plainContextMessage(text);
    if (contextMessage) return contextMessage;
    if (/valid subject and exam category|subject or exam category is inactive/.test(text)) return 'Choose a subject and exam.';
    if (/No active subjects or exam categories/.test(text)) return 'No subjects or exams are ready yet.';
    if (/valid exam year/.test(text)) return 'Enter a year from 1900 to 2100.';
    if (/enter the question text|question text is required/.test(text)) return 'Write the question.';
    if (/question text is too long/.test(text)) return 'The question is too long.';
    if (/answer explanation is too long/.test(text)) return 'The explanation is too long.';
    if (/all four answer options/.test(text)) return 'Fill in all four answers.';
    if (/answer option must be 500|answer options? must be 500/.test(text)) return 'Each answer must be 500 letters or less.';
    if (/select the correct answer/.test(text)) return 'Pick the right answer.';
    if (/question no longer exists|question was not found/.test(text)) return 'That question is gone. Reload the page.';
    if (/valid question to update|valid question selected/.test(text)) return 'Choose a question to change.';
    if (/valid question to delete/.test(text)) return 'Choose a question to delete.';
    if (/question could not be saved|question did not save/i.test(text)) return 'The question did not save. Ask for help.';
    if (/context tables|context migration|shared contexts could not be loaded/.test(text)) return 'Shared text is not set up yet.';
    if (/context no longer exists|selected context was not found|context does not exist/i.test(text)) return 'That shared text is gone. Reload the page.';
    if (/valid context to activate|valid context selected|Invalid context selected/i.test(text)) return 'Choose shared text first.';
    if (/cannot be activated/i.test(text)) return 'This shared text cannot be turned on. Please check its questions.';
    if (/context could not be activated/i.test(text)) return 'The shared text could not be turned on.';
    if (/context could not be deactivated/i.test(text)) return 'The shared text could not be turned off.';
    if (/context could not be deleted|referenced by linked questions/i.test(text)) return 'This shared text is still used by questions.';
    if (/context could not be saved/i.test(text)) return 'The shared text did not save. Ask for help.';
    if (/context position or cloze slot requires/i.test(text)) return 'Choose shared text before adding an order or gap.';
    if (/does not match the context subject|does not match the context pool/i.test(text)) return 'The question and shared text need the same subject, exam, and year.';
    if (/positive whole number/i.test(text)) return 'Use a number that is 1 or more.';
    if (/invalid submitted value/i.test(text)) return 'One box has a value I cannot use.';
    if (/valid context type|context type is invalid/i.test(text)) return 'Choose a reading passage or gap passage.';
    if (/enter a context title|context has no title/i.test(text)) return 'Give the shared text a name.';
    if (/context title must be 200/i.test(text)) return 'The name is too long.';
    if (/enter the shared context text|context has no shared text/i.test(text)) return 'Add the shared text.';
    if (/shared context text is too long/i.test(text)) return 'The shared text is too long.';
    if (/valid subject for the context pool|context subject is inactive/i.test(text)) return 'Choose a subject.';
    if (/valid exam category for the context pool|context exam category is inactive/i.test(text)) return 'Choose an exam.';
    if (/context exam year|exam year is invalid/i.test(text)) return 'Enter a year from 1900 to 2100.';
    if (/expected member count must equal/i.test(text)) return 'The question count must match the gap count.';
    if (/expected member count/i.test(text)) return 'Enter 1 to 500 questions.';
    if (/comprehension context must not contain cloze gap tokens/i.test(text)) return 'A reading passage cannot use [[gap:N]].';
    if (/cloze context needs at least one/i.test(text)) return 'Add at least one [[gap:N]].';
    if (/cloze tokens must use numbers/i.test(text)) return 'Gap numbers must be from 1 to 999.';
    if (/context type cannot change while linked questions exist/i.test(text)) return 'Remove its questions before changing the text type.';
    if (/context pool cannot change while linked questions exist/i.test(text)) return 'Remove its questions before changing subject, exam, or year.';
    if (/enter a context position/i.test(text)) return 'Enter a question order from 1 to 500.';
    if (/comprehension member must not have a cloze slot/i.test(text)) return 'A reading passage does not use a gap number.';
    if (/enter a cloze slot/i.test(text)) return 'Enter a gap number from 1 to 999.';
    if (/cloze slot .* is not present/i.test(text)) return 'That gap number is not in the shared text.';
    if (/already has its expected number of members/i.test(text)) return 'This shared text already has enough questions.';
    if (/already uses that context position/i.test(text)) return 'Another question already uses that order number.';
    if (/already uses that cloze slot/i.test(text)) return 'Another question already uses that gap number.';
    if (/question changed/i.test(text)) return 'The question changed. Reload and try again.';
    if (/upload|uploaded file|fileinfo|picture|image|video|illustration/i.test(text)) return 'The file did not upload. Please try again.';
    return text;
  }

  function simplifyServerErrors() {
    var errors = document.querySelectorAll('.admin-error');
    for (var i = 0; i < errors.length; i++) {
      errors[i].textContent = plainServerMessage(errors[i].textContent);
    }
  }

  function fieldContainer(element) {
    if (!element) return null;
    if (typeof element.closest === 'function') return element.closest('.admin-field');
    var node = element.parentNode;
    while (node && node !== form) {
      if (String(node.className || '').split(/\s+/).indexOf('admin-field') !== -1) return node;
      node = node.parentNode;
    }
    return null;
  }

  function setFieldCopy(id, labelText, noteText, placeholder) {
    var element = $(id);
    var wrap = fieldContainer(element);
    if (!element || !wrap) return;
    var label = wrap.querySelector('label[for="' + id + '"]');
    if (label && labelText) label.textContent = labelText;
    var note = wrap.querySelector('.admin-note');
    if (note && noteText !== undefined) note.textContent = noteText;
    if (placeholder !== undefined) element.placeholder = placeholder;
  }

  function replaceLabelTail(label, text) {
    if (!label) return;
    for (var i = label.childNodes ? label.childNodes.length - 1 : label.children.length - 1; i >= 0; i--) {
      var child = label.childNodes ? label.childNodes[i] : label.children[i];
      if (child && (child.nodeType === 3 || child.tagName === '#TEXT')) {
        child.textContent = ' ' + text;
        return;
      }
    }
  }

  function simplifyNativeFormCopy() {
    function setPrompt(id, text) {
      var select = $(id);
      if (!select || !select.options || !select.options.length) return;
      if (select.options[0].text !== undefined) select.options[0].text = text;
      if (select.options[0].textContent !== undefined) select.options[0].textContent = text;
    }
    setPrompt('subject_id', 'Choose a subject');
    setPrompt('exam_category_id', 'Choose an exam');
    setFieldCopy('exam_category_id', 'Exam');
    setFieldCopy('exam_year', 'Year', 'Example: 2024.');
    setFieldCopy('context_id', 'Shared text');
    setFieldCopy('context_position', 'Passage question number');
    setFieldCopy('context_slot', 'Gap number');
    setFieldCopy('question_text', 'Question Text');
    setFieldCopy('question_image', 'Question picture (optional)', 'Add a JPG, PNG, WebP, or GIF picture. Up to 8 MB.');
    setFieldCopy('answer_explanation', 'Why this answer is right', 'Optional. Students may see this after the test.', 'Why is this right?');
    setFieldCopy('answer_video', 'Answer video or picture (optional)', 'Video: up to 50 MB. Picture: up to 8 MB.');
    var correct = form.querySelector('.admin-correct');
    var correctWrap = correct ? correct.parentNode : null;
    if (correctWrap) {
      var correctLabel = correctWrap.querySelector('label');
      var correctNote = correctWrap.querySelector('.admin-note');
      if (correctLabel) correctLabel.textContent = 'Right answer';
      if (correctNote) correctNote.textContent = 'Pick the right answer.';
    }
    var active = $('is_active');
    var activeLabel = active && typeof active.closest === 'function' ? active.closest('label') : null;
    replaceLabelTail(activeLabel, 'Show this question to students now');
    var activeWrap = fieldContainer(active);
    var activeNote = activeWrap ? activeWrap.querySelector('.admin-note') : null;
    if (activeNote) activeNote.textContent = 'Shared-text questions stay off. Turn on the shared text instead.';

    var exact = {
      'Current picture/diagram': 'Current picture',
      'Uploading a new image replaces the current image.': 'A new picture replaces this one.',
      'Current answer illustration': 'Current answer file',
      'Leave the upload empty to keep the current illustration, unless you select the removal checkbox.': 'Leave this empty to keep the file.',
      'Cancel Edit': 'Cancel'
    };
    ['p', 'strong', 'a'].forEach(function (selector) {
      var nodes = form.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        var text = String(nodes[i].textContent || '').trim();
        if (exact[text]) nodes[i].textContent = exact[text];
      }
    });
    var removeImage = form.querySelector('input[name="remove_question_image"]');
    var removeAnswer = form.querySelector('input[name="remove_answer_video"]');
    replaceLabelTail(removeImage && removeImage.closest ? removeImage.closest('label') : null, 'Remove this picture');
    replaceLabelTail(removeAnswer && removeAnswer.closest ? removeAnswer.closest('label') : null, 'Remove this file');
    var images = form.querySelectorAll('img');
    for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
      if (/question diagram/i.test(String(images[imageIndex].alt || ''))) images[imageIndex].alt = 'Current question picture';
      if (/answer illustration/i.test(String(images[imageIndex].alt || ''))) images[imageIndex].alt = 'Current answer picture';
    }
  }

  function groupQuestionForm() {
    var linkGroup = $('owner_context_link_fields');
    if (!linkGroup || linkGroup.parentNode !== form || $('owner_question_fields')) return;
    var details = document.createElement('fieldset');
    details.id = 'owner_question_fields';
    details.className = 'owner-form-group owner-question-fields';
    var legend = document.createElement('legend');
    legend.textContent = 'Question details';
    details.appendChild(legend);
    var children = Array.prototype.slice.call(form.children || []);
    var firstVisible = null;
    children.forEach(function (child) {
      if (!firstVisible && !(child.tagName === 'INPUT' && child.type === 'hidden')) firstVisible = child;
    });
    if (firstVisible && firstVisible !== linkGroup) form.insertBefore(linkGroup, firstVisible);
    form.insertBefore(details, linkGroup.nextSibling);
    children.forEach(function (child) {
      if (child === linkGroup || child === details) return;
      if (child.tagName === 'INPUT' && child.type === 'hidden') return;
      details.appendChild(child);
    });
  }

  function currentItem() {
    if (!loaded.items.length) return null;
    return loaded.items[loaded.currentIndex] || null;
  }

  function letterIndex(letter) {
    return ['A', 'B', 'C', 'D'].indexOf(String(letter || '').toUpperCase());
  }

  function optionTexts(select) {
    var out = [];
    if (!select || !select.options) return out;
    for (var i = 0; i < select.options.length; i++) out.push(String(select.options[i].text || ''));
    return out;
  }

  function inferMetadata(parsed) {
    var meta = { subject_id: '', exam_category_id: '', exam_year: '' };
    var header = (parsed.header && parsed.header.header) || '';
    if (parsed.header && parsed.header.year) meta.exam_year = String(parsed.header.year);
    var subjectEl = $('subject_id');
    var categoryEl = $('exam_category_id');
    if (subjectEl && subjectEl.options && subjectEl.options.length) {
      var subjectIndex = parser.pickSubjectIndex(header, optionTexts(subjectEl));
      if (subjectIndex >= 0 && subjectEl.options[subjectIndex]) {
        meta.subject_id = String(subjectEl.options[subjectIndex].value);
      }
    }
    if (categoryEl && categoryEl.options && categoryEl.options.length) {
      var categoryIndex = parser.pickCategoryIndex(header, optionTexts(categoryEl));
      if (categoryIndex >= 0 && categoryEl.options[categoryIndex]) {
        meta.exam_category_id = String(categoryEl.options[categoryIndex].value);
      }
    }
    return meta;
  }

  function mapContexts(parsedContexts, items) {
    if (!contextModel || !Array.isArray(parsedContexts) || !parsedContexts.length) return [];
    var byParsedId = {};
    var cards = parsedContexts.map(function (context) {
      var card = contextModel.emptyContext(loaded.metadata);
      card.contextType = context.type === 'cloze' ? 'cloze' : 'comprehension';
      card.title = String(context.title || '');
      card.text = String(context.text || '');
      card.targets = Array.isArray(context.targets) ? context.targets.slice() : [];
      card.expectedCount = context.expectedCount || card.targets.length || 1;
      byParsedId[String(context.id || '')] = card.localId;
      return card;
    });
    items.forEach(function (item) {
      if (!item || !item.contextRef) return;
      var localId = byParsedId[String(item.contextRef)];
      if (localId) {
        item.contextRef = localId;
        item.contextSlot = '';
        return;
      }
      item.contextRef = '';
      item.contextPosition = '';
      item.contextSlot = '';
    });
    return cards;
  }

  function normalizeContextText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/<u>/g, '')
      .replace(/<\/u>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function contextHardKey(subject, category, year, type, title, text) {
    return [String(subject || ''), String(category || ''), String(year || ''),
      String(type || ''), normalizeContextText(title), normalizeContextText(text)].join('\u0001');
  }

  function cardHardKey(card) {
    return contextHardKey(card.subjectId, card.examCategoryId, card.examYear,
      card.contextType, card.title, card.text);
  }

  function serverHardKey(server) {
    var title = server.title_key === undefined
      ? normalizeContextText(server.title)
      : String(server.title_key || '');
    var text = server.text_key === undefined
      ? normalizeContextText(server.context_text)
      : String(server.text_key || '');
    return [String(server.subject_id || ''), String(server.exam_category_id || ''),
      String(server.exam_year || ''), String(server.context_type || ''), title, text].join('\u0001');
  }

  function matchServerContexts(card) {
    if (!card.subjectId || !card.examCategoryId || !card.examYear || !card.title || !card.text) return [];
    var key = cardHardKey(card);
    var matches = [];
    serverContexts.forEach(function (server) {
      if (serverHardKey(server) === key) matches.push(server);
    });
    return matches;
  }

  function duplicateServerContext(card) {
    if (!card || !card.subjectId || !card.examCategoryId || !card.examYear || !card.title || !card.text) {
      return null;
    }
    var key = cardHardKey(card);
    for (var i = 0; i < serverContexts.length; i++) {
      var server = serverContexts[i];
      if (card.serverId !== null && card.serverId !== undefined
        && String(server.context_id) === String(card.serverId)) continue;
      if (serverHardKey(server) === key) return server;
    }
    return null;
  }

  function serverContextById(id) {
    var wanted = String(id || '');
    for (var i = 0; i < serverContexts.length; i++) {
      if (String(serverContexts[i].context_id) === wanted) return serverContexts[i];
    }
    return null;
  }

  function usedServerValues(server, key, manualId, exceptItem) {
    var used = {};
    (Array.isArray(server && server.members) ? server.members : []).forEach(function (member) {
      var value = Number(member[key]);
      if (isFinite(value) && Math.floor(value) === value && value > 0) used[value] = true;
    });
    loaded.items.forEach(function (item) {
      if (!item || item === exceptItem || String(item.manualContextId || '') !== String(manualId || '')) return;
      var value = Number(key === 'context_slot' ? item.contextSlot : item.contextPosition);
      if (isFinite(value) && Math.floor(value) === value && value > 0) used[value] = true;
    });
    return used;
  }

  function nextFreePosition(server, manualId, item) {
    var used = usedServerValues(server, 'context_position', manualId, item);
    for (var number = 1; number <= 500; number++) {
      if (!used[number]) return String(number);
    }
    return '';
  }

  function nextFreeSlot(server, manualId, item) {
    var used = usedServerValues(server, 'context_slot', manualId, item);
    var slots = Array.isArray(server && server.slots) ? server.slots : [];
    if (!slots.length && contextModel && server && server.context_text) {
      slots = contextModel.clozeSlots(server.context_text);
    }
    for (var i = 0; i < slots.length; i++) {
      var slot = Number(slots[i]);
      if (slot > 0 && !used[slot]) return String(slot);
    }
    return '';
  }

  function applyManualContext(item, manualId) {
    if (!item) return;
    var targets = item.contextRef
      ? loaded.items.filter(function (other) { return other && other.contextRef === item.contextRef; })
      : [item];
    if (!manualId) {
      targets.forEach(function (target) {
        target.manualContextId = '';
        target.manualContextType = '';
      });
      if (item.contextRef && contextModel) {
        contextModel.syncLinks(loaded);
      } else {
        targets.forEach(function (target) {
          target.contextPosition = '';
          target.contextSlot = '';
        });
      }
      return;
    }
    var server = serverContextById(manualId);
    targets.forEach(function (target) {
      target.manualContextId = manualId;
      target.manualContextType = server ? String(server.context_type || '') : '';
      if (!server) return;
      if (!target.contextPosition) target.contextPosition = nextFreePosition(server, manualId, target);
      if (server.context_type === 'cloze') {
        if (!target.contextSlot) target.contextSlot = nextFreeSlot(server, manualId, target);
      } else {
        target.contextSlot = '';
      }
    });
  }

  function contextForItem(item) {
    if (!item) return null;
    if (item.manualContextId) return serverContextById(item.manualContextId);
    return item.contextRef && contextModel
      ? contextModel.findById(loaded.contexts, item.contextRef)
      : null;
  }

  function syncLinkVisibility(item) {
    var group = $('owner_context_link_fields');
    var context = contextForItem(item);
    if (group) group.hidden = !item || (!item.manualContextId && !item.contextRef);
    var slotField = $('owner_context_slot_field') || fieldContainer($('context_slot'));
    if (slotField) {
      var type = context && (context.contextType || context.context_type);
      slotField.hidden = type !== 'cloze';
    }
  }

  function matchingRecentQuestion() {
    if (!currentItem()) return null;
    var values = {
      subject_id: $('subject_id') ? String($('subject_id').value || '') : '',
      exam_category_id: $('exam_category_id') ? String($('exam_category_id').value || '') : '',
      exam_year: $('exam_year') ? String($('exam_year').value || '') : '',
      question_text: $('question_text') ? normalizeQuestionText($('question_text').value) : '',
      option_a: $('option_a') ? normalizeQuestionText($('option_a').value) : '',
      option_b: $('option_b') ? normalizeQuestionText($('option_b').value) : '',
      option_c: $('option_c') ? normalizeQuestionText($('option_c').value) : '',
      option_d: $('option_d') ? normalizeQuestionText($('option_d').value) : ''
    };
    if (!values.subject_id || !values.exam_category_id || !values.exam_year || !values.question_text) return null;
    for (var i = 0; i < recentQuestions.length; i++) {
      var saved = recentQuestions[i];
      if (String(saved.subject_id || '') !== values.subject_id
        || String(saved.exam_category_id || '') !== values.exam_category_id
        || String(saved.exam_year || '') !== values.exam_year
        || normalizeQuestionText(saved.question_text) !== values.question_text
        || normalizeQuestionText(saved.option_a) !== values.option_a
        || normalizeQuestionText(saved.option_b) !== values.option_b
        || normalizeQuestionText(saved.option_c) !== values.option_c
        || normalizeQuestionText(saved.option_d) !== values.option_d) continue;
      return saved;
    }
    return null;
  }

  function updateQuestionDuplicateNotice() {
    var element = $('owner_tool_duplicate');
    if (!element) return;
    var duplicate = matchingRecentQuestion();
    element.textContent = duplicate
      ? 'This looks like Question #' + duplicate.id + '. You can still save.'
      : '';
    element.hidden = !duplicate;
  }

  function editingContextId() {
    var text = $('context_text');
    var contextForm = text && text.form ? text.form : null;
    if (!contextForm) return 0;
    var action = contextForm.querySelector('input[name=action]');
    if (!action || String(action.value) !== 'update_context') return 0;
    var hidden = contextForm.querySelector('input[name=context_id]');
    var id = hidden ? Number(hidden.value) : 0;
    return isFinite(id) && Math.floor(id) === id && id > 0 ? id : 0;
  }

  function adoptMatchingContexts(state) {
    var warnings = [];
    var editingId = editingContextId();
    var editingApplied = false;
    state.contexts.forEach(function (card) {
      if (card.serverId !== null && card.serverId !== undefined) return;
      if (editingId && !editingApplied) {
        card.serverId = editingId;
        card.adopted = true;
        card.stale = false;
        editingApplied = true;
        return;
      }
      var matches = matchServerContexts(card);
      if (matches.length !== 1) {
        if (matches.length > 1) {
          warnings.push('I found two saved texts named "' + card.title + '". Pick one.');
        }
        return;
      }
      var match = matches[0];
      card.serverId = Number(match.context_id);
      card.adopted = true;
      card.stale = false;
      if (Number(match.member_count) !== Number(card.expectedCount)) {
        warnings.push('Saved text #' + match.context_id + ' has ' + match.member_count
          + ' questions. This paste has ' + card.expectedCount + '.');
      }
    });
    return warnings;
  }

  function normalizeQuestionText(value) {
    return normalizeContextText(value);
  }

  function refreshAlreadySaved(state) {
    if (!contextModel) return;
    state.items.forEach(function (item) {
      if (!item) return;
      item.alreadySaved = false;
      if (!item.manualContextId && !item.contextRef) return;
      var contextId = item.manualContextId;
      var position = item.contextPosition;
      var slot = item.contextSlot;
      if (!contextId && item.contextRef) {
        var card = contextModel.findById(state.contexts, item.contextRef);
        if (card && card.serverId !== null && card.serverId !== undefined) contextId = String(card.serverId);
        if (card && !position) {
          var index = card.targets.indexOf(Number(item.num));
          if (index !== -1) position = String(index + 1);
        }
      }
      var server = contextId ? serverContextById(contextId) : null;
      if (!server) return;
      var text = normalizeQuestionText(item.question);
      var members = Array.isArray(server.members) ? server.members : [];
      item.alreadySaved = members.some(function (member) {
        if (normalizeQuestionText(member.question_text) !== text) return false;
        if (slot && String(member.context_slot) !== String(slot)) return false;
        if (position && String(member.context_position) !== String(position)) return false;
        return true;
      });
    });
  }

  function skipAlreadySaved(state) {
    var skipped = [];
    for (var guard = 0; guard <= state.items.length; guard++) {
      var item = state.items[state.currentIndex];
      if (!item || !item.alreadySaved) break;
      skipped.push(item.num === null || item.num === undefined ? '?' : item.num);
      state.currentIndex += 1;
    }
    if (skipped.length) state.pendingSubmission = null;
    return skipped;
  }

  function metadataForItem(item) {
    if (item && item.manualContextId) {
      var server = serverContextById(item.manualContextId);
      if (server) {
        return {
          strict: true,
          values: {
            subject_id: String(server.subject_id || ''),
            exam_category_id: String(server.exam_category_id || ''),
            exam_year: String(server.exam_year || '')
          }
        };
      }
    }
    if (item && item.contextRef && contextModel) {
      var card = contextModel.findById(loaded.contexts, item.contextRef);
      if (card) {
        return {
          strict: true,
          values: {
            subject_id: String(card.subjectId || ''),
            exam_category_id: String(card.examCategoryId || ''),
            exam_year: String(card.examYear || '')
          }
        };
      }
    }
    return { strict: false, values: loaded.metadata };
  }

  function applyMetadata(item) {
    var source = metadataForItem(item);
    META_FIELDS.forEach(function (id) {
      var el = $(id);
      var value = source.values[id];
      if (!el) return;
      el.value = value === undefined || value === null ? '' : String(value);
    });
  }

  function saveMetadata(item) {
    if (item && (item.manualContextId || item.contextRef)) return;
    META_FIELDS.forEach(function (id) {
      var el = $(id);
      if (el) loaded.metadata[id] = String(el.value === null || el.value === undefined ? '' : el.value);
    });
  }

  function clearQuestionForm() {
    META_FIELDS.concat(['question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'answer_explanation', 'context_id', 'context_position', 'context_slot']).forEach(function (id) {
      var el = $(id);
      if (el) el.value = '';
    });
    clearRadios();
    var preview = $('owner_tool_preview');
    if (preview) textApi.render(preview, '');
  }

  function clearPasteMemory() {
    savedSelection = null;
    clearQuestionForm();
    if (contextPanel) contextPanel.clear();
    syncLinkVisibility(null);
    var duplicate = $('owner_tool_duplicate');
    if (duplicate) {
      duplicate.textContent = '';
      duplicate.hidden = true;
    }
  }

  function clearRadios() {
    form.querySelectorAll('[name=correct_option]').forEach(function (radio) {
      radio.checked = false;
    });
  }

  function tick(index) {
    if (index < 0) return;
    var radio = form.querySelector('input[name="correct_option"][value="' + index + '"]');
    if (radio) radio.checked = true;
  }

  function resolvedOptions(item, keyLetter) {
    var a = item.a || '';
    var b = item.b || '';
    var c = item.c || '';
    var d = item.d || '';
    var letter = String(keyLetter || '').toUpperCase();
    if (letter === 'E' || letter === 'F') {
      var extra = letter === 'E' ? item.e : item.f;
      if (!extra) return { a: a, b: b, c: c, d: d, tick: -1 };
      return { a: a, b: b, c: c, d: extra, tick: 3 };
    }
    var index = letterIndex(letter);
    if (letter && index >= 0) return { a: a, b: b, c: c, d: d, tick: index };
    if (item.e) d += (d ? '\n\n' : '') + 'E. ' + item.e;
    if (item.f) d += (d ? '\n\n' : '') + 'F. ' + item.f;
    return { a: a, b: b, c: c, d: d, tick: -1 };
  }

  function updatePreview() {
    var box = $('question_text');
    var preview = $('owner_tool_preview');
    if (!box || !preview) return;
    textApi.render(preview, String(box.value || ''));
  }

  function rememberSelection() {
    var box = $('question_text');
    if (!box || typeof box.selectionStart !== 'number' || typeof box.selectionEnd !== 'number') return;
    savedSelection = { start: box.selectionStart, end: box.selectionEnd };
  }

  function rememberSelectionForToolbar() {
    var box = $('question_text');
    if (!box || typeof box.selectionStart !== 'number' || typeof box.selectionEnd !== 'number') return;
    if (box.selectionEnd > box.selectionStart || !savedSelection || savedSelection.end <= savedSelection.start) {
      savedSelection = { start: box.selectionStart, end: box.selectionEnd };
    }
  }

  function replaceRange(box, start, end, replacement, selectionStart, selectionEnd) {
    if (typeof box.focus === 'function') box.focus();
    if (typeof box.setSelectionRange === 'function') box.setSelectionRange(start, end);
    var doc = box.ownerDocument || (typeof document !== 'undefined' ? document : null);
    var nativeEdit = false;
    if (doc && typeof doc.execCommand === 'function') {
      try {
        nativeEdit = doc.execCommand('insertText', false, replacement) === true;
      } catch (error) {
        nativeEdit = false;
      }
    }
    if (!nativeEdit) {
      if (typeof box.setRangeText === 'function') {
        box.setRangeText(replacement, start, end, 'end');
      } else {
        box.value = String(box.value || '').slice(0, start) + replacement + String(box.value || '').slice(end);
      }
      if (typeof box.dispatchEvent === 'function' && typeof Event === 'function') {
        box.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    if (typeof box.setSelectionRange === 'function') box.setSelectionRange(selectionStart, selectionEnd);
    savedSelection = { start: selectionStart, end: selectionEnd };
    updatePreview();
    updateQuestionDuplicateNotice();
  }

  function selectionTouchesMarker(value, start, end) {
    var markers = ['<u>', '</u>'];
    for (var m = 0; m < markers.length; m++) {
      var marker = markers[m];
      var at = value.indexOf(marker);
      while (at !== -1) {
        if (start < at + marker.length && end > at) return true;
        at = value.indexOf(marker, at + marker.length);
      }
    }
    return false;
  }

  function underlineDepthBefore(value, position) {
    var before = value.slice(0, position);
    var opens = (before.match(/<u>/g) || []).length;
    var closes = (before.match(/<\/u>/g) || []).length;
    return opens - closes;
  }

  function wrapUnderline() {
    var box = $('question_text');
    if (!box) return false;
    var value = String(box.value || '');
    var start = typeof box.selectionStart === 'number' ? box.selectionStart : 0;
    var end = typeof box.selectionEnd === 'number' ? box.selectionEnd : start;
    if (start === end && savedSelection && savedSelection.end > savedSelection.start) {
      start = savedSelection.start;
      end = savedSelection.end;
    }
    if (start === end) {
      hint('Select words first.');
      if (typeof box.focus === 'function') box.focus();
      return false;
    }
    var selected = value.slice(start, end);
    var already = underlineDepthBefore(value, start) === 1
      && value.slice(Math.max(0, start - 3), start) === '<u>'
      && value.slice(end, end + 4) === '</u>';
    var openBefore = value.lastIndexOf('<u>', start);
    var closeBefore = value.lastIndexOf('</u>', start);
    if (!already && (openBefore > closeBefore || selectionTouchesMarker(value, start, end))) {
      hint('Select all underlined words first.');
      if (typeof box.focus === 'function') box.focus();
      return false;
    }
    if (already) {
      replaceRange(box, start - 3, end + 4, selected, start - 3, start - 3 + selected.length);
      hint('Underline off.');
    } else {
      replaceRange(box, start, end, '<u>' + selected + '</u>', start + 3, end + 3);
      hint('Underline on. Tap again to remove it.');
    }
    if (typeof box.focus === 'function') box.focus();
    return true;
  }

  function fillForm(item) {
    applyMetadata(item);
    var questionBox = $('question_text');
    questionBox.value = item.question || '';
    savedSelection = null;
    if (typeof questionBox.setSelectionRange === 'function') {
      questionBox.setSelectionRange(questionBox.value.length, questionBox.value.length);
    }
    var options = resolvedOptions(item, loaded.answerKey[String(item.num)]);
    $('option_a').value = options.a;
    $('option_b').value = options.b;
    $('option_c').value = options.c;
    $('option_d').value = options.d;
    clearRadios();
    tick(options.tick);
    updatePreview();
    if (contextPanel) contextPanel.fillQuestion(item);
    syncLinkVisibility(item);
    updateQuestionDuplicateNotice();
  }

  function refreshTick() {
    var item = currentItem();
    if (!item) return;
    var options = resolvedOptions(item, loaded.answerKey[String(item.num)]);
    clearRadios();
    tick(options.tick);
  }

  function successFlash() {
    var el = document.querySelector('.admin-success');
    if (!el) return '';
    return String(el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function resolvePending() {
    var pending = loaded.pendingSubmission;
    if (!pending) return;
    var item = currentItem();
    var matches = pending.queueId === loaded.queueId
      && pending.index === loaded.currentIndex
      && Boolean(item)
      && stateApi.fingerprint(item) === pending.fingerprint;
    var flash = successFlash();
    var errorEl = document.querySelector('.admin-error');
    if (contextPanel) {
      var contextResult = contextPanel.resolvePending(flash, Boolean(errorEl));
      if (contextResult) return contextResult;
    }
    if (pending.kind === 'context-create' || pending.kind === 'context-update') {
      loaded.pendingSubmission = null;
      persist();
      warn('I am not sure it saved. Check Saved Shared Texts.');
      return 'ambiguous';
    }
    if (errorEl) {
      loaded.pendingSubmission = null;
      persist();
      warn('The question did not save. Fix it and try again.');
      return 'error';
    }
    if (matches && SUCCESS_FLASH.test(flash)) {
      var savedNum = item.num === null || item.num === undefined ? '?' : item.num;
      loaded.currentIndex += 1;
      loaded.pendingSubmission = null;
      refreshAlreadySaved(loaded);
      var skipped = skipAlreadySaved(loaded);
      persist();
      note('Question ' + savedNum + ' saved. Here is the next one.');
      if (skipped.length) warn('Already saved, so I skipped: ' + skipped.join(', ') + '.');
      return 'success';
    }
    var pendingNum = item && item.num !== null && item.num !== undefined ? item.num : '?';
    loaded.pendingSubmission = null;
    persist();
    warn('I am not sure question ' + pendingNum + ' saved. Check Saved Questions first.');
    return 'ambiguous';
  }

  simplifyServerErrors();
  simplifyNativeFormCopy();
  groupQuestionForm();

  var panel = document.createElement('div');
  panel.className = 'admin-field owner-tool' + (editMode ? ' owner-tool-format-only' : '');
  panel.id = editMode ? 'owner_format_tool' : 'owner_tool';
  panel.innerHTML = ''
    + '<div class="owner-tool-head"><strong>' + (editMode ? 'Question Tools' : 'Question Helper') + '</strong>'
    + '<span>' + (editMode ? 'Select words, then tap Underline.' : 'Paste questions, shared text, and answers.') + '</span></div>'
    + (editMode ? '' : '<div id="owner_tool_input">'
      + '<label for="owner_tool_text">Paste here</label>'
      + '<textarea id="owner_tool_text" rows="8"></textarea>'
      + '<button type="button" class="admin-btn" id="owner_tool_load">Use Paste</button>'
      + '</div>'
      + '<div id="owner_tool_status" class="admin-note"></div>'
      + '<div id="owner_tool_flags" class="owner-tool-flags"></div>'
      + '<div id="owner_tool_warning" class="admin-alert owner-tool-error" hidden></div>')
    + '<div class="owner-tool-format">'
    + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_underline" title="Underline selected words (Ctrl+U)">Underline</button>'
    + '<span id="owner_tool_hint" class="owner-tool-hint"></span>'
    + '</div>'
    + '<div class="owner-tool-preview-wrap">'
    + '<span class="owner-tool-hint">What students will see</span>'
    + '<div id="owner_tool_preview" class="owner-tool-preview"></div>'
    + (editMode ? '' : '<div id="owner_tool_duplicate" class="admin-alert owner-tool-duplicate" hidden></div>')
    + '</div>'
    + (editMode ? '' : '<div id="owner_context_panel" class="owner-context-panel"></div>')
    + (editMode ? '' : '<div class="owner-tool-actions">'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_show">Show Paste</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_skip">Skip This</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_reset">Reset</button>'
      + '</div>');
  form.before(panel);

  var formatToolbar = panel.querySelector('.owner-tool-format');
  var previewWrap = panel.querySelector('.owner-tool-preview-wrap');
  var questionBoxForFormat = $('question_text');
  if (formatToolbar && questionBoxForFormat && questionBoxForFormat.parentNode) {
    if (typeof questionBoxForFormat.parentNode.insertBefore === 'function') {
      questionBoxForFormat.parentNode.insertBefore(formatToolbar, questionBoxForFormat);
    } else {
      questionBoxForFormat.parentNode.appendChild(formatToolbar);
    }
  }
  if (previewWrap && questionBoxForFormat && questionBoxForFormat.parentNode) {
    questionBoxForFormat.parentNode.insertBefore(previewWrap, questionBoxForFormat.nextSibling);
  }

  var nativeContextSection = (function () {
    var node = $('context_text');
    while (node && node !== document.body) {
      if (node.tagName === 'SECTION' && String(node.className || '').indexOf('admin-card') !== -1) return node;
      node = node.parentNode;
    }
    return null;
  })();
  var contextPanelRoot = $('owner_context_panel');
  if (!editMode && nativeContextSection && form.parentNode) {
    form.parentNode.insertBefore(nativeContextSection, form);
  }
  if (nativeContextSection && contextPanelRoot) {
    var nativeContextForm = $('context_text') && $('context_text').form;
    if (contextPanelRoot && nativeContextForm && nativeContextForm.parentNode === nativeContextSection) {
      nativeContextSection.insertBefore(contextPanelRoot, nativeContextForm);
    }
  }

  function onContextResolved() {
    refreshAlreadySaved(loaded);
    var skipped = skipAlreadySaved(loaded);
    if (skipped.length) {
      persist();
      warn('Already saved, so I skipped: ' + skipped.join(', ') + '.');
    }
    render();
  }

  if (!editMode && contextPanelApi && contextModel && contextFormApi && contextCardApi) {
    contextPanel = contextPanelApi.create({
      model: contextModel,
      root: contextPanelRoot,
      getState: function () { return loaded; },
      persist: persist,
      formApi: contextFormApi,
      cardApi: contextCardApi,
      findDuplicateContext: duplicateServerContext,
      onContextResolved: onContextResolved,
      onContextChange: function () {
        applyMetadata(currentItem());
        syncLinkVisibility(currentItem());
        updateQuestionDuplicateNotice();
      }
    });
  }

  var contextSelect = $('context_id');
  if (contextSelect && !editMode) {
    contextSelect.addEventListener('change', function () {
      var item = currentItem();
      if (!item) return;
      var value = String(contextSelect.value || '');
      var manualId = /^[1-9][0-9]*$/.test(value) ? value : '';
      var position = $('context_position');
      var slot = $('context_slot');
      if (position && position.value) item.contextPosition = String(position.value);
      if (slot && slot.value) item.contextSlot = String(slot.value);
      applyManualContext(item, manualId);
      loaded.pendingSubmission = null;
      refreshAlreadySaved(loaded);
      var skipped = skipAlreadySaved(loaded);
      persist();
      if (skipped.length) {
        warn('Already saved, so I skipped: ' + skipped.join(', ') + '.');
      } else {
        warn('');
      }
      applyMetadata(currentItem());
      if (contextPanel) contextPanel.prepare(currentItem());
      syncLinkVisibility(currentItem());
      updateQuestionDuplicateNotice();
      render(skipped.length === 0);
    });
  }

  function showPaste(show) {
    pasteVisible = Boolean(show);
    var button = $('owner_tool_show');
    if (button) button.textContent = pasteVisible ? 'Hide Paste' : 'Show Paste';
  }

  function render(keepForm) {
    if (contextPanel && !blocked) contextPanel.render();
    var item = blocked ? null : currentItem();
    if (item && item.alreadySaved) {
      var skipped = skipAlreadySaved(loaded);
      if (skipped.length) {
        persist();
        warn('Already saved, so I skipped: ' + skipped.join(', ') + '.');
        item = currentItem();
      }
    }
    var total = blocked ? 0 : loaded.items.length;
    var input = $('owner_tool_input');
    if (input) input.hidden = !(pasteVisible || !item);
    var skipButton = $('owner_tool_skip');
    if (skipButton) skipButton.hidden = !item;
    var resetButton = $('owner_tool_reset');
    if (resetButton) resetButton.hidden = !(total || blocked);
    var showButton = $('owner_tool_show');
    if (showButton) showButton.hidden = !item;
    syncLinkVisibility(item);
    if (!item || keepForm) updateQuestionDuplicateNotice();

    var flags = $('owner_tool_flags');
    if (flags) {
      if (item && Array.isArray(item.flags) && item.flags.length) {
        flags.textContent = 'Please check: ' + item.flags.map(plainFlag).join(', ');
        flags.hidden = false;
      } else {
        flags.textContent = '';
        flags.hidden = true;
      }
    }

    if (blocked) {
      note('Saved work did not open. Paste again or tap Reset.');
      return;
    }
    if (!total) {
      note('Paste questions to begin.');
      return;
    }
    if (!item) {
      note('All ' + total + ' questions are done.');
      return;
    }
    var keyCount = Object.keys(loaded.answerKey || {}).length;
    var bookNumber = item.num === null || item.num === undefined ? '?' : item.num;
    note('Question ' + (loaded.currentIndex + 1) + ' of ' + total
      + '. Number ' + bookNumber + '. '
      + (keyCount ? keyCount + ' answers.' : 'No answers yet.'));
    if (!keepForm) fillForm(item);
  }

  function loadPaste() {
    var text = String($('owner_tool_text').value || '');
    if (!text.trim()) {
      warn('Paste the text first.');
      return;
    }
    var parsed;
    try {
      parsed = parser.parsePaste(text);
    } catch (error) {
      warn('I could not read that paste. Please check it.');
      return;
    }
    var keyOnly = Boolean(parsed.sections && parsed.sections.how === 'key-only');
    var key = parsed.key || {};
    var items = parsed.items || [];
    if (keyOnly) {
      if (blocked) {
        warn('This answer list cannot be used. Paste everything again or tap Reset.');
        return;
      }
      if (!Object.keys(key).length) {
        warn('I found no answers. Nothing changed.');
        return;
      }
      loaded.answerKey = key;
      loaded.pendingSubmission = null;
      persist();
      if (!blocked) refreshTick();
      warn('');
      showPaste(false);
      render(true);
      note('Answers changed: ' + Object.keys(key).length + '. Questions stayed.');
      return;
    }
    if (!items.length) {
      warn('I found no questions. Nothing changed.');
      return;
    }
    blocked = false;
    loaded = stateApi.emptyState(parserVersion, stateApi.makeQueueId());
    clearPasteMemory();
    loaded.items = items;
    loaded.answerKey = key;
    loaded.metadata = inferMetadata(parsed);
    loaded.contexts = mapContexts(parsed.contexts, loaded.items);
    var warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map(plainParserWarning) : [];
    if (contextModel && loaded.contexts.length) {
      contextModel.syncLinks(loaded).forEach(function (number) {
        warnings.push('Question ' + number + ' is in two shared texts.');
      });
    }
    adoptMatchingContexts(loaded).forEach(function (text) { warnings.push(text); });
    refreshAlreadySaved(loaded);
    var skipped = skipAlreadySaved(loaded);
    if (skipped.length) warnings.push('Already saved, so I skipped: ' + skipped.join(', ') + '.');
    if (!persist()) return;
    warn(warnings.join(' '));
    showPaste(false);
    if (contextPanel) contextPanel.autoFillDraft();
    render();
  }

  function skip() {
    if (blocked || !currentItem()) return;
    loaded.currentIndex += 1;
    loaded.pendingSubmission = null;
    persist();
    warn('');
    render();
  }

  function reset() {
    loaded = stateApi.emptyState(parserVersion, stateApi.makeQueueId());
    blocked = false;
    clearPasteMemory();
    persist();
    warn('');
    render();
  }

  var questionBox = $('question_text');
  if (questionBox) {
    questionBox.addEventListener('input', function () {
      updatePreview();
      rememberSelection();
      hint('');
      updateQuestionDuplicateNotice();
    });
    questionBox.addEventListener('select', rememberSelectionForToolbar);
    questionBox.addEventListener('click', rememberSelection);
    questionBox.addEventListener('keyup', rememberSelection);
    questionBox.addEventListener('keydown', function (event) {
      if (!event || !(event.ctrlKey || event.metaKey)) return;
      if (String(event.key || '').toLowerCase() !== 'u') return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      wrapUnderline();
    });
  }
  META_FIELDS.concat(OPTION_FIELDS).forEach(function (id) {
    var element = $(id);
    if (!element) return;
    element.addEventListener('input', updateQuestionDuplicateNotice);
    element.addEventListener('change', updateQuestionDuplicateNotice);
  });
  form.addEventListener('reset', function () {
    setTimeout(function () {
      updatePreview();
      rememberSelection();
    }, 0);
  });

  var underlineButton = $('owner_tool_underline');
  underlineButton.addEventListener('mousedown', function (event) {
    rememberSelectionForToolbar();
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
  });
  underlineButton.addEventListener('touchstart', rememberSelectionForToolbar);
  underlineButton.onclick = wrapUnderline;
  updatePreview();
  rememberSelection();

  if (editMode) {
    var sharedSection = $('owner-shared-texts');
    var allQuestionsSection = $('owner-all-questions');
    if (sharedSection) sharedSection.hidden = true;
    if (allQuestionsSection) allQuestionsSection.hidden = true;
    window.CBTOwnerTool = { version: TOOL_VERSION, parserVersion: parserVersion, formattingOnly: true };
    return;
  }

  $('owner_tool_load').onclick = loadPaste;
  $('owner_tool_skip').onclick = skip;
  $('owner_tool_reset').onclick = reset;
  $('owner_tool_show').onclick = function () {
    showPaste(!pasteVisible);
    render(true);
  };

  function blockQuestionSave(event) {
    if (blocked) return false;
    var blocker = contextPanel ? contextPanel.questionBlocker() : null;
    if (!blocker) return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    warn(blocker.message);
    return true;
  }

  var questionSubmitButton = form.querySelector('button[type=submit]');
  if (questionSubmitButton) questionSubmitButton.addEventListener('click', blockQuestionSave);

  form.addEventListener('submit', function (event) {
    if (blocked || blockQuestionSave(event)) return;
    var item = currentItem();
    saveMetadata(item);
    loaded.pendingSubmission = item ? {
      kind: 'question',
      queueId: loaded.queueId,
      index: loaded.currentIndex,
      fingerprint: stateApi.fingerprint(item),
      at: Date.now()
    } : null;
    persist();
  });

  window.CBTOwnerTool = { version: TOOL_VERSION, stateKey: stateApi.KEY, parserVersion: parserVersion };

  var legacy = stateApi.legacyKeys(storage);
  if (decision.status === 'stale-parser') {
    warn('This saved work is from an older tool. Paste again or tap Reset.');
    render();
    return;
  }
  if (decision.status === 'corrupt' || decision.status === 'future-version' || decision.status === 'storage-error') {
    warn('Saved work could not open. Paste again or tap Reset.');
    render();
    return;
  }
  if (legacy.length) {
    warn('Old saved work was found. It was left alone.');
  }
  var pendingResult = resolvePending();
  render(pendingResult === 'error' || pendingResult === 'ambiguous'
    || Boolean(document.querySelector('.admin-error')));
  }

  if (root) {
    root.CBTOwnerState = stateApi;
    root.CBTOwnerContexts = contextsApi;
    root.CBTOwnerContextForm = contextFormApi;
    root.CBTOwnerContextCard = contextCardApi;
    root.CBTOwnerContextPanel = contextPanelApi;
  }
  if (root && root.document) startOwnerTool();

  return {
    state: stateApi,
    contexts: contextsApi,
    contextForm: contextFormApi,
    contextCard: contextCardApi,
    contextPanel: contextPanelApi,
    start: startOwnerTool
  };
});
