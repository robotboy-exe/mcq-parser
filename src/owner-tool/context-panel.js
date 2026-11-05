(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerContextPanel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CREATE_FLASH = /^Context #(\d+) created\. Link its members, then activate it\.$/;
  var UPDATE_FLASH = /^Context #(\d+) updated\. It is inactive until revalidated\.$/;

  function create(options) {
    var model = options.model;
    var root = options.root;
    var doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
    var panelWarning = '';
    var panelNotice = '';
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
      onSubmit: function (card) { submitCard(card); }
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
    function refreshStatus(index) {
      var data = state();
      var conflicts = model.syncLinks(data);
      var element = doc.getElementById('owner_context_status');
      if (element) {
        var text = data.contexts.length + (data.contexts.length === 1 ? ' context card' : ' context cards');
        if (conflicts.length) text += '. Target ' + conflicts.join(', ') + ' is assigned more than once.';
        if (panelNotice) text += ' ' + panelNotice;
        element.textContent = text;
      }
      if (index !== undefined && data.contexts[index]) {
        var status = doc.getElementById('owner_context_' + index + '_status');
        if (status) status.textContent = cards.status(data.contexts[index]);
      }
    }
    function prepare(item) {
      var info = form.prepare(state(), item || current());
      linkWarning(info.message);
      return !info.blocked;
    }
    function editField(card, index, name, element) {
      if (name === 'targets') {
        card.targets = model.parseTargets(element.value);
      } else if (name === 'expectedCount') {
        var expected = Number(element.value);
        if (isFinite(expected) && Math.floor(expected) === expected && expected >= 1 && expected <= 500) {
          card.expectedCount = expected;
        }
      } else if (name === 'contextType') {
        card.contextType = model.TYPES.indexOf(element.value) === -1 ? model.TYPES[0] : element.value;
      } else {
        card[name] = String(element.value === null || element.value === undefined ? '' : element.value);
      }
      if (card.serverId !== null && card.serverId !== undefined) card.stale = true;
      panelNotice = '';
      model.syncLinks(state());
      options.persist();
      refreshStatus(index);
      prepare(current());
    }
    function fillContext(card) {
      if (!form.fill(card)) {
        showWarning('The native context form is unavailable. Apply the context migration before creating contexts.');
        return;
      }
      showWarning('');
      panelNotice = 'Native form prepared. Submit it to create or update the draft.';
      refreshStatus();
    }
    function removeCard(card, index) {
      var data = state();
      if (card.serverId !== null && card.serverId !== undefined) {
        showWarning('Removed the local card only. Server context #' + card.serverId + ' was not deleted.');
      } else {
        showWarning('');
      }
      data.contexts.splice(index, 1);
      model.syncLinks(data);
      options.persist();
      render();
      prepare(current());
    }
    function render() {
      var data = state();
      root.textContent = '';
      var head = add(root, 'div', { className: 'owner-context-head' });
      add(head, 'strong', {}, 'Shared contexts');
      var addButton = add(head, 'button', {
        type: 'button',
        className: 'admin-btn admin-btn-muted',
        id: 'owner_context_add'
      }, 'Add Context');
      addButton.onclick = function () {
        data.contexts.push(model.emptyContext(data.metadata));
        panelNotice = 'Context card added.';
        showWarning('');
        model.syncLinks(data);
        options.persist();
        render();
        prepare(current());
      };
      add(head, 'span', { className: 'owner-context-hint' }, 'Manual cards only. Create and update them with the native context form.');
      var list = add(root, 'div', { className: 'owner-context-list' });
      data.contexts.forEach(function (card, index) {
        cards.render(card, index, list, {
          onEdit: editField,
          onFill: fillContext,
          onRemove: removeCard
        });
      });
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
      showWarning('');
      render();
      prepare(current());
      return 'success';
    }
    function clear() {
      panelWarning = '';
      panelNotice = '';
      form.clear();
      linkWarning('');
      render();
    }

    return {
      render: render,
      fillQuestion: function (item) {
        model.syncLinks(state());
        return prepare(item);
      },
      canSaveQuestion: function () {
        model.syncLinks(state());
        return prepare(current());
      },
      resolvePending: resolvePending,
      clear: clear
    };
  }

  return { create: create };
});
