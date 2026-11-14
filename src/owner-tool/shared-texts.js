(function (root, factory) {
  var api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var window = root;

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

    function setMode(editing, contextId) {
      var section = doc.getElementById('shared_context_editor');
      var heading = doc.getElementById('owner_context_editor_heading');
      var badge = doc.getElementById('owner_context_mode');
      var hint = doc.getElementById('owner_context_mode_hint');
      var mode = editing ? 'edit' : 'draft';
      if (section) {
        var className = String(section.className || '')
          .replace(/\s*owner-context-editor-(?:draft|edit)\b/g, '')
          .trim();
        if (className.indexOf('owner-context-editor') === -1) className += ' owner-context-editor';
        section.className = (className + ' owner-context-editor-' + mode).trim();
      }
      if (heading) heading.textContent = editing ? 'Edit Saved Shared Text' : 'New Shared Text';
      if (badge) {
        badge.className = 'owner-context-mode owner-context-mode-' + mode;
        badge.textContent = editing
          ? 'Saved text' + (contextId ? ' #' + contextId : '') + ' - edit mode'
          : 'New text - draft mode';
      }
      if (hint) {
        hint.textContent = editing
          ? 'Use Paste will not change this saved text.'
          : 'Use Paste fills this new draft. Tap Add to make one.';
      }
    }

    function isEditing() {
      return pageEditing;
    }

    function isSavedMode() {
      var form = contextForm();
      var action = form ? field(form, 'action', '') : null;
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
        setMode(saved, saved ? card.serverId : '');
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
          setMode(pageEditing, pageEditing ? pageContextId : '');
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
      setMode(pageEditing, pageEditing ? pageContextId : '');
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
      isSavedMode: isSavedMode,
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
      if (form.isSavedMode() && !card) return true;
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
        if (form.isSavedMode() && !selectedLocalId) {
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
      if (form.isSavedMode()) return false;
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
        selectedLocalId = form.isSavedMode() ? ''
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
      add(head, 'span', { id: 'owner_context_mode_hint', className: 'owner-context-hint' }, form.isSavedMode()
        ? 'Use Paste will not change this saved text.'
        : 'Use Paste fills this new draft. Tap Add to make one.');
      if (data.contexts.length > 1 && (!form.isSavedMode() || selectedLocalId)) {
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
      if (selected && form.armedId() !== selected.localId && !form.isSavedMode()) form.fill(selected);
      refreshStatus();
      duplicateNotice(selected || (form.isSavedMode() ? form.snapshot() : null));
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
    function resolvePending(flash, hasError, plainError) {
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
        showWarning(plainError || 'Not saved. Check the form and try again.');
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
        if (form.isSavedMode()) return prepare(item);
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

  if (root) {
    root.CBTOwnerContexts = contextsApi;
    root.CBTOwnerContextForm = contextFormApi;
    root.CBTOwnerContextCard = contextCardApi;
    root.CBTOwnerContextPanel = contextPanelApi;
  }

  return {
    contexts: contextsApi,
    contextForm: contextFormApi,
    contextCard: contextCardApi,
    contextPanel: contextPanelApi
  };
});
