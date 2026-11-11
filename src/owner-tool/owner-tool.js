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
    var info = { card: null, blocked: false, message: '' };
    if (!item) return info;
    var manualId = positiveInt(item.manualContextId);
    if (manualId !== null) {
      info.card = item.contextRef ? findById(state.contexts, item.contextRef) : null;
      if (info.card && info.card.contextType === 'cloze' && !item.contextSlot) {
        info.blocked = true;
        info.message = 'This cloze question has no matching [[gap:N]] slot.';
      }
      return info;
    }
    if (!item.contextRef) return info;
    var card = findById(state.contexts, item.contextRef);
    if (!card) {
      info.blocked = true;
      info.message = 'The linked context card is missing. Link the question again.';
      return info;
    }
    info.card = card;
    var claimed = item.num !== null && item.num !== undefined && state.contexts.some(function (other) {
      return other !== card && Array.isArray(other.targets) && other.targets.indexOf(Number(item.num)) !== -1;
    });
    if (claimed) {
      info.blocked = true;
      info.message = 'More than one context card claims this question. Remove the duplicate target.';
      return info;
    }
    if (card.serverId !== null && card.serverId !== undefined && duplicateServerIds(state.contexts).length) {
      info.blocked = true;
      info.message = 'Two context cards use the same server ID. Fix the cards before saving.';
      return info;
    }
    if (card.serverId === null || card.serverId === undefined) {
      info.blocked = true;
      info.message = 'Create this context in the native form, or pick an existing context from the Shared Context dropdown.';
      return info;
    }
    if (card.stale) {
      info.blocked = true;
      info.message = 'The context changed after it was saved. Update it before saving linked questions.';
      return info;
    }
    if (card.contextType === 'cloze' && !item.contextSlot) {
      info.blocked = true;
      info.message = 'This cloze question has no matching [[gap:N]] slot.';
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
      var form = contextForm();
      var action = field(form, 'action', '');
      return Boolean(action && String(action.value) === 'update_context');
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
        if (button) button.textContent = saved ? 'Update Context' : 'Create Context';
        setStatus(saved
          ? (card.adopted ? 'Matched saved context #' : 'Editing context #') + card.serverId
          : 'New context draft');
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

    function prepare(state, item) {
      var info = { blocked: false, message: '', card: null };
      if (item) info = model.linkInfo(state, item);
      var manualId = item && item.manualContextId ? String(item.manualContextId) : '';
      var cardId = info.card && info.card.serverId !== null && info.card.serverId !== undefined
        ? String(info.card.serverId)
        : '';
      setValue('context_id', manualId || cardId);
      if (!(manualId && !info.card)) {
        setValue('context_position', item && item.contextPosition ? item.contextPosition : '');
        setValue('context_slot', info.card && info.card.contextType === 'cloze' && item ? item.contextSlot : '');
      }
      var button = questionButton();
      if (button) button.disabled = Boolean(info.blocked);
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
          if (action) action.value = 'save_context';
          contextId.value = '';
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
          if (contextSubmit) contextSubmit.textContent = 'Create Context';
          setStatus('Paste a context or choose Add Context.');
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
      if (syncing || !armedId) return;
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
        return 'Context #' + card.serverId + ': update required';
      }
      if (card.adopted) return 'Context #' + card.serverId + ': saved (matched)';
      if (card.serverId === null || card.serverId === undefined) return 'Draft: not created';
      return 'Context #' + card.serverId + ': saved';
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
    function state() {
      return options.getState();
    }
    function current() {
      var data = state();
      if (!data || !Array.isArray(data.items) || !data.items.length) return null;
      return data.items[data.currentIndex] || null;
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
      onChange: function (card) { nativeChanged(card); }
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
    function refreshStatus() {
      var data = state();
      var conflicts = model.syncLinks(data);
      var element = doc.getElementById('owner_context_status');
      if (element) {
        var text = data.contexts.length + (data.contexts.length === 1 ? ' context' : ' contexts');
        var selected = model.findById(data.contexts, selectedLocalId);
        if (selected) text += '. ' + cards.status(selected) + '.';
        if (conflicts.length) text += '. Target ' + conflicts.join(', ') + ' is assigned more than once.';
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
        ? 'Submit Update Context before saving linked questions.'
        : 'Draft changes are kept in this browser until Create Context is submitted.';
      model.syncLinks(state());
      options.persist();
      render();
      prepare(current());
    }
    function fillContext(card) {
      selectedLocalId = card.localId;
      if (!form.fill(card)) {
        showWarning('The native context form is unavailable. Apply the context migration before creating contexts.');
        return false;
      }
      form.setVisible(true);
      panelNotice = card.serverId !== null && card.serverId !== undefined
        ? 'This saved context is ready for linked questions; submit Update Context only after editing it.'
        : 'Submit Create Context when the fields are correct.';
      refreshStatus();
      return true;
    }
    function autoFillDraft() {
      var data = state();
      var card = model.findById(data.contexts, selectedLocalId) || data.contexts[0];
      return card ? fillContext(card) : false;
    }
    function removeSelected() {
      var data = state();
      var card = model.findById(data.contexts, selectedLocalId);
      var index = data.contexts.indexOf(card);
      if (!card || index < 0) return;
      if (card.serverId !== null && card.serverId !== undefined) {
        showWarning('Removed this browser draft only. Server context #' + card.serverId + ' was not deleted.');
      } else {
        showWarning('');
      }
      data.contexts.splice(index, 1);
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
        selectedLocalId = data.contexts[0] ? data.contexts[0].localId : '';
      }
      root.textContent = '';
      var head = add(root, 'div', { className: 'owner-context-head' });
      var addButton = add(head, 'button', {
        type: 'button',
        className: 'admin-btn admin-btn-muted',
        id: 'owner_context_add'
      }, 'Add Context');
      addButton.onclick = function () {
        var card = model.emptyContext(data.metadata);
        data.contexts.push(card);
        selectedLocalId = card.localId;
        panelNotice = 'New context draft added.';
        showWarning('');
        model.syncLinks(data);
        options.persist();
        render();
        fillContext(card);
        prepare(current());
      };
      if (selectedLocalId) {
        var removeButton = add(head, 'button', {
          type: 'button',
          className: 'admin-btn admin-btn-muted',
          id: 'owner_context_remove'
        }, 'Remove Current Draft');
        removeButton.onclick = removeSelected;
      }
      add(head, 'span', { className: 'owner-context-hint' }, 'Paste fills this form. Add Context starts one manually. Subject and category use the named lists below.');
      if (data.contexts.length > 1) {
        var select = add(root, 'select', { id: 'owner_context_select', className: 'owner-context-select' });
        data.contexts.forEach(function (card, index) {
          add(select, 'option', { value: card.localId }, (index + 1) + '. ' + (card.title || 'Untitled') + ' — ' + cards.status(card));
        });
        select.value = selectedLocalId;
        select.onchange = function () {
          var card = model.findById(data.contexts, select.value);
          if (card) fillContext(card);
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
      form.setVisible(Boolean(data.contexts.length) || form.isEditing());
      var selected = model.findById(data.contexts, selectedLocalId);
      if (selected && form.armedId() !== selected.localId) form.fill(selected);
      refreshStatus();
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
        showWarning('The server rejected that context save. The card and native form were left in place.');
        render();
        return 'error';
      }
      var pattern = pending.kind === 'context-create' ? CREATE_FLASH : UPDATE_FLASH;
      var match = matches ? String(flash || '').match(pattern) : null;
      if (!match) {
        data.pendingSubmission = null;
        options.persist();
        showWarning('Could not confirm whether the context saved. Check Shared Contexts before submitting it again. Nothing was retried.');
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
        showWarning('The returned context ID could not be bound safely. Check Shared Contexts before continuing.');
        render();
        return 'ambiguous';
      }
      card.serverId = serverId;
      card.stale = false;
      data.pendingSubmission = null;
      model.syncLinks(data);
      options.persist();
      panelWarning = '';
      panelNotice = 'Context #' + serverId + ' confirmed.';
      selectedLocalId = card.localId;
      showWarning('');
      render();
      form.fill(card);
      form.setVisible(true);
      prepare(current());
      if (options.onContextResolved) options.onContextResolved(card);
      return 'success';
    }
    function clear() {
      panelWarning = '';
      panelNotice = '';
      selectedLocalId = '';
      form.clear();
      render();
      linkWarning('');
    }

    return {
      render: render,
      fillQuestion: function (item) {
        model.syncLinks(state());
        var card = item && item.contextRef ? model.findById(state().contexts, item.contextRef) : null;
        if (card && form.armedId() !== card.localId) fillContext(card);
        return prepare(item);
      },
      canSaveQuestion: function () {
        model.syncLinks(state());
        return prepare(current());
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
  var TOOL_VERSION = '1.3.0';
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

  function $(id) {
    return document.getElementById(id);
  }

  function persist() {
    if (blocked) return false;
    loaded.parserVersion = parserVersion;
    loaded.version = stateApi.STATE_VERSION;
    var written = stateApi.writeState(storage, loaded);
    if (!written.ok) warn('Browser storage is unavailable, so the queue cannot be saved: ' + written.detail);
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
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function contextHardKey(subject, category, year, type, title) {
    return [String(subject || ''), String(category || ''), String(year || ''),
      String(type || ''), normalizeContextText(title)].join('\u0001');
  }

  function cardHardKey(card) {
    return contextHardKey(card.subjectId, card.examCategoryId, card.examYear, card.contextType, card.title);
  }

  function serverHardKey(server) {
    return contextHardKey(server.subject_id, server.exam_category_id, server.exam_year, server.context_type, server.title);
  }

  function matchServerContexts(card) {
    if (!card.subjectId || !card.examCategoryId || !card.examYear) return [];
    var key = cardHardKey(card);
    var matches = [];
    serverContexts.forEach(function (server) {
      if (serverHardKey(server) === key) matches.push(server);
    });
    return matches;
  }

  function serverContextById(id) {
    var wanted = String(id || '');
    for (var i = 0; i < serverContexts.length; i++) {
      if (String(serverContexts[i].context_id) === wanted) return serverContexts[i];
    }
    return null;
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
          warnings.push('More than one saved context matches "' + card.title + '". Pick the right one from the Shared Context dropdown.');
        }
        return;
      }
      var match = matches[0];
      card.serverId = Number(match.context_id);
      card.adopted = true;
      card.stale = false;
      if (Number(match.member_count) !== Number(card.expectedCount)) {
        warnings.push('Context #' + match.context_id + ' has ' + match.member_count + ' saved member(s); the parsed card expects ' + card.expectedCount + '.');
      }
    });
    return warnings;
  }

  function normalizeQuestionText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
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

  function applyMetadata() {
    META_FIELDS.forEach(function (id) {
      var el = $(id);
      var value = loaded.metadata[id];
      if (!el || value === undefined || value === null || value === '') return;
      el.value = String(value);
    });
  }

  function saveMetadata() {
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
      hint('Select the words to underline first, then press Ctrl+U.');
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
      hint('Select the entire underlined text to remove it; overlapping underline markers are not allowed.');
      if (typeof box.focus === 'function') box.focus();
      return false;
    }
    if (already) {
      replaceRange(box, start - 3, end + 4, selected, start - 3, start - 3 + selected.length);
      hint('Underline removed.');
    } else {
      replaceRange(box, start, end, '<u>' + selected + '</u>', start + 3, end + 3);
      hint('Underlined. Press Ctrl+U on it again to remove the underline.');
    }
    if (typeof box.focus === 'function') box.focus();
    return true;
  }

  function fillForm(item) {
    applyMetadata();
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
      warn('Could not confirm the context save. Check Shared Contexts before continuing.');
      return 'ambiguous';
    }
    if (errorEl) {
      loaded.pendingSubmission = null;
      persist();
      warn('The server rejected that save. The same question is still loaded; fix it and save again.');
      return 'error';
    }
    if (matches && SUCCESS_FLASH.test(flash)) {
      var savedNum = item.num === null || item.num === undefined ? '?' : item.num;
      loaded.currentIndex += 1;
      loaded.pendingSubmission = null;
      refreshAlreadySaved(loaded);
      var skipped = skipAlreadySaved(loaded);
      persist();
      note('Question ' + savedNum + ' saved. The next question is loaded.');
      if (skipped.length) warn('Skipped already-saved question(s): ' + skipped.join(', ') + '.');
      return 'success';
    }
    var pendingNum = item && item.num !== null && item.num !== undefined ? item.num : '?';
    loaded.pendingSubmission = null;
    persist();
    warn('Could not confirm whether question ' + pendingNum
      + ' saved. Check Recently Added Questions before saving again. Nothing was retried or advanced.');
    return 'ambiguous';
  }

  var panel = document.createElement('div');
  panel.className = 'admin-field owner-tool' + (editMode ? ' owner-tool-format-only' : '');
  panel.id = editMode ? 'owner_format_tool' : 'owner_tool';
  panel.innerHTML = ''
    + '<div class="owner-tool-head"><strong>' + (editMode ? 'Question formatting' : 'Owner tool') + '</strong>'
    + '<span>' + (editMode ? 'Underline selected question text and review the candidate preview.' : 'Paste one block: questions, contexts, and the answer key.') + '</span></div>'
    + (editMode ? '' : '<div id="owner_tool_input">'
      + '<label for="owner_tool_text">OCR paste</label>'
      + '<textarea id="owner_tool_text" rows="8"></textarea>'
      + '<button type="button" class="admin-btn" id="owner_tool_load">Load</button>'
      + '</div>'
      + '<div id="owner_tool_status" class="admin-note"></div>'
      + '<div id="owner_tool_flags" class="owner-tool-flags"></div>'
      + '<div id="owner_tool_warning" class="admin-alert owner-tool-error" hidden></div>')
    + '<div class="owner-tool-format">'
    + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_underline" title="Underline the selected text (Ctrl+U)">Underline</button>'
    + '<span id="owner_tool_hint" class="owner-tool-hint"></span>'
    + '</div>'
    + '<div class="owner-tool-preview-wrap">'
    + '<span class="owner-tool-hint">Preview (options stay plain):</span>'
    + '<div id="owner_tool_preview" class="owner-tool-preview"></div>'
    + '</div>'
    + (editMode ? '' : '<div id="owner_context_panel" class="owner-context-panel"></div>')
    + (editMode ? '' : '<div class="owner-tool-actions">'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_show">Show Paste</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_skip">Skip</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_reset">Reset</button>'
      + '</div>');
  form.before(panel);

  var formatToolbar = panel.querySelector('.owner-tool-format');
  var questionBoxForFormat = $('question_text');
  if (formatToolbar && questionBoxForFormat && questionBoxForFormat.parentNode) {
    if (typeof questionBoxForFormat.parentNode.insertBefore === 'function') {
      questionBoxForFormat.parentNode.insertBefore(formatToolbar, questionBoxForFormat);
    } else {
      questionBoxForFormat.parentNode.appendChild(formatToolbar);
    }
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
  if (nativeContextSection && nativeContextSection.parentNode && panel.parentNode) {
    panel.parentNode.insertBefore(nativeContextSection, panel.nextSibling);
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
      warn('Skipped already-saved question(s): ' + skipped.join(', ') + '.');
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
      onContextResolved: onContextResolved
    });
  }

  var contextSelect = $('context_id');
  if (contextSelect && !editMode) {
    contextSelect.addEventListener('change', function () {
      var item = currentItem();
      if (!item) return;
      var value = String(contextSelect.value || '');
      var manualId = /^[1-9][0-9]*$/.test(value) ? value : '';
      if (item.contextRef) {
        loaded.items.forEach(function (other) {
          if (other && other.contextRef === item.contextRef) other.manualContextId = manualId;
        });
      } else {
        item.manualContextId = manualId;
      }
      loaded.pendingSubmission = null;
      refreshAlreadySaved(loaded);
      var skipped = skipAlreadySaved(loaded);
      persist();
      if (skipped.length) {
        warn('Skipped already-saved question(s): ' + skipped.join(', ') + '.');
      } else {
        warn('');
      }
      if (contextPanel) contextPanel.prepare(currentItem());
      render(true);
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
        warn('Skipped already-saved question(s): ' + skipped.join(', ') + '.');
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

    var flags = $('owner_tool_flags');
    if (flags) {
      if (item && Array.isArray(item.flags) && item.flags.length) {
        flags.textContent = 'Check this one: ' + item.flags.join(', ');
        flags.hidden = false;
      } else {
        flags.textContent = '';
        flags.hidden = true;
      }
    }

    if (blocked) {
      note('Saved state was not loaded. Paste the block again, or press Reset.');
      return;
    }
    if (!total) {
      note('No queue yet. Paste one block to begin.');
      return;
    }
    if (!item) {
      note('All ' + total + ' questions done.');
      return;
    }
    var keyCount = Object.keys(loaded.answerKey || {}).length;
    var bookNumber = item.num === null || item.num === undefined ? '?' : item.num;
    note('Question ' + (loaded.currentIndex + 1) + ' of ' + total
      + ' · book number ' + bookNumber
      + (keyCount ? ' · key: ' + keyCount + ' answers' : ' · no key'));
    if (!keepForm) fillForm(item);
  }

  function loadPaste() {
    var text = String($('owner_tool_text').value || '');
    if (!text.trim()) {
      warn('Paste the OCR text first.');
      return;
    }
    var parsed;
    try {
      parsed = parser.parsePaste(text);
    } catch (error) {
      warn('Could not parse that text: ' + ((error && error.message) || error));
      return;
    }
    var keyOnly = Boolean(parsed.sections && parsed.sections.how === 'key-only');
    var key = parsed.key || {};
    var items = parsed.items || [];
    if (keyOnly) {
      if (blocked) {
        warn('Saved state cannot accept a replacement key. Paste the full block again, or press Reset first.');
        return;
      }
      if (!Object.keys(key).length) {
        warn('No answer key found in that paste. The queue was not changed.');
        return;
      }
      loaded.answerKey = key;
      loaded.pendingSubmission = null;
      persist();
      if (!blocked) refreshTick();
      warn('');
      showPaste(false);
      render(true);
      note('Answer key replaced (' + Object.keys(key).length + ' answers). The queue was kept.');
      return;
    }
    if (!items.length) {
      warn('No questions found in that paste. Nothing was changed.');
      return;
    }
    blocked = false;
    loaded = stateApi.emptyState(parserVersion, stateApi.makeQueueId());
    loaded.items = items;
    loaded.answerKey = key;
    loaded.metadata = inferMetadata(parsed);
    loaded.contexts = mapContexts(parsed.contexts, loaded.items);
    var warnings = Array.isArray(parsed.warnings) ? parsed.warnings.slice() : [];
    if (contextModel && loaded.contexts.length) {
      contextModel.syncLinks(loaded).forEach(function (number) {
        warnings.push('question ' + number + ' is linked to more than one context');
      });
    }
    adoptMatchingContexts(loaded).forEach(function (text) { warnings.push(text); });
    refreshAlreadySaved(loaded);
    var skipped = skipAlreadySaved(loaded);
    if (skipped.length) warnings.push('Skipped already-saved question(s): ' + skipped.join(', ') + '.');
    if (!persist()) return;
    warn(warnings.join(' '));
    showPaste(false);
    if (!skipped.length && contextPanel) contextPanel.autoFillDraft();
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
    savedSelection = null;
    clearQuestionForm();
    if (contextPanel) contextPanel.clear();
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

  form.addEventListener('submit', function () {
    if (blocked) return;
    saveMetadata();
    if (contextPanel && !contextPanel.canSaveQuestion()) return;
    var item = blocked ? null : currentItem();
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
    warn('Saved state was parsed by ' + decision.detail.replace('state was parsed by ', '')
      + '. It was not loaded and was not deleted. Paste the block again, or press Reset.');
    render();
    return;
  }
  if (decision.status === 'corrupt' || decision.status === 'future-version' || decision.status === 'storage-error') {
    warn('Saved state could not be used (' + decision.detail + '). It was not deleted. Paste the block again, or press Reset.');
    render();
    return;
  }
  if (legacy.length) {
    warn('Old bookmarklet state found (' + legacy.join(', ') + '). It was not imported or deleted; reset it in your browser if you want a clean start.');
  }
  var pendingResult = resolvePending();
  render(pendingResult === 'error' || Boolean(document.querySelector('.admin-error')));
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
