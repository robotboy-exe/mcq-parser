(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerContextCard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function create(model, doc) {
    function node(tag, props, text) {
      var element = doc.createElement(tag);
      Object.keys(props || {}).forEach(function (key) { element[key] = props[key]; });
      if (text !== undefined) element.textContent = String(text);
      return element;
    }

    function add(parent, tag, props, text) {
      var element = node(tag, props, text);
      parent.appendChild(element);
      return element;
    }

    function field(parent, label, control) {
      var wrap = add(parent, 'div', { className: 'owner-context-field' });
      add(wrap, 'span', { className: 'owner-context-label' }, label);
      wrap.appendChild(control);
    }

    function bind(handler, card, index, name, element, type) {
      element.addEventListener(type || 'input', function () {
        handler.onEdit(card, index, name, element);
      });
    }

    function status(card) {
      if (card.serverId === null || card.serverId === undefined) return 'Draft: not created';
      if (card.stale) return 'Context #' + card.serverId + ': update required';
      return 'Context #' + card.serverId + ': saved';
    }

    function render(card, index, parent, handler) {
      var box = add(parent, 'div', { className: 'owner-context-card' });
      var head = add(box, 'div', { className: 'owner-context-card-head' });
      add(head, 'strong', {}, 'Context card ' + (index + 1));
      add(head, 'span', { id: 'owner_context_' + index + '_status', className: 'owner-context-hint' }, status(card));

      var type = add(box, 'select', { id: 'owner_context_' + index + '_type' });
      model.TYPES.forEach(function (typeName) {
        add(type, 'option', { value: typeName }, typeName === 'cloze' ? 'Cloze' : 'Comprehension');
      });
      type.value = card.contextType;
      field(box, 'Type', type);
      bind(handler, card, index, 'contextType', type, 'change');

      var title = add(box, 'input', { id: 'owner_context_' + index + '_title', type: 'text', value: card.title });
      field(box, 'Title', title);
      bind(handler, card, index, 'title', title);

      var text = add(box, 'textarea', { id: 'owner_context_' + index + '_text', value: card.text });
      field(box, 'Shared text', text);
      bind(handler, card, index, 'text', text);

      var targets = add(box, 'input', {
        id: 'owner_context_' + index + '_targets',
        type: 'text',
        value: card.targets.join(', ')
      });
      field(box, 'Question numbers (in order)', targets);
      bind(handler, card, index, 'targets', targets);

      var expected = add(box, 'input', {
        id: 'owner_context_' + index + '_expected',
        type: 'number',
        value: String(card.expectedCount)
      });
      field(box, 'Expected members', expected);
      bind(handler, card, index, 'expectedCount', expected);

      var subject = add(box, 'input', { id: 'owner_context_' + index + '_subject', type: 'text', value: card.subjectId });
      field(box, 'Subject pool', subject);
      bind(handler, card, index, 'subjectId', subject);

      var category = add(box, 'input', { id: 'owner_context_' + index + '_category', type: 'text', value: card.examCategoryId });
      field(box, 'Category pool', category);
      bind(handler, card, index, 'examCategoryId', category);

      var year = add(box, 'input', { id: 'owner_context_' + index + '_year', type: 'number', value: card.examYear });
      field(box, 'Year pool', year);
      bind(handler, card, index, 'examYear', year);

      var actions = add(box, 'div', { className: 'owner-context-actions' });
      var fill = add(actions, 'button', {
        type: 'button',
        className: 'admin-btn',
        id: 'owner_context_' + index + '_fill'
      }, 'Fill Context Form');
      fill.onclick = function () { handler.onFill(card); };
      var remove = add(actions, 'button', {
        type: 'button',
        className: 'admin-btn admin-btn-muted',
        id: 'owner_context_' + index + '_remove'
      }, 'Remove Card');
      remove.onclick = function () { handler.onRemove(card, index); };
      return box;
    }

    return { render: render, status: status };
  }

  return { create: create };
});
