(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerContexts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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
      stale: false
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
    if (!item || !item.contextRef) return info;
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
      info.message = 'Create this context in the native form before saving a linked question.';
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
});
