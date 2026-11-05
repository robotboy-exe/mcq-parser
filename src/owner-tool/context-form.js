(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerContextForm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function create(options) {
    var model = options.model;
    var doc = options.document || (typeof document !== 'undefined' ? document : null);
    var armedId = '';

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

    function notify(element) {
      if (typeof Event !== 'function' || !element || typeof element.dispatchEvent !== 'function') return;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function fill(card) {
      var form = contextForm();
      if (!form) return false;
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
        if (element) {
          element.value = values[name];
          notify(element);
        }
      });
      armedId = card.localId;
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
      if (model.TYPES.indexOf(card.contextType) === -1) card.contextType = model.TYPES[0];
      return card;
    }

    function prepare(state, item) {
      var info = { blocked: false, message: '', card: null };
      if (item) info = model.linkInfo(state, item);
      setValue('context_id', info.card && info.card.serverId !== null && info.card.serverId !== undefined
        ? String(info.card.serverId)
        : '');
      setValue('context_position', item && item.contextPosition ? item.contextPosition : '');
      setValue('context_slot', info.card && info.card.contextType === 'cloze' && item ? item.contextSlot : '');
      var button = questionButton();
      if (button) button.disabled = Boolean(info.blocked);
      return info;
    }

    function clear() {
      armedId = '';
      var form = contextForm();
      if (form) {
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
      }
      setValue('context_id', '');
      setValue('context_position', '');
      setValue('context_slot', '');
      var button = questionButton();
      if (button) button.disabled = false;
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
    }

    return {
      fill: fill,
      read: read,
      prepare: prepare,
      clear: clear,
      hasForm: Boolean(form),
      armedId: function () { return armedId; }
    };
  }

  return { create: create };
});
