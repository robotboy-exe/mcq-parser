// Paste-to-draft helper for the shared-text page.
// Paste fills a new draft editor and never overwrites a saved shared text (D-79).
(function (root, factory) {
  var api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTOwnerSharedPaste = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var doc = root.document;
  var KEY = 'cbtSharedPaste:v1';

  function $(id) {
    return doc ? doc.getElementById(id) : null;
  }

  function store() {
    try {
      return root.localStorage;
    } catch (error) {
      return null;
    }
  }

  function status(text) {
    var element = $('owner_shared_status');
    if (element) element.textContent = text || '';
  }

  function readQueue() {
    var empty = { drafts: [], index: 0 };
    var storage = store();
    if (!storage) return empty;
    var raw = null;
    try {
      raw = storage.getItem(KEY);
    } catch (error) {
      return empty;
    }
    if (!raw) return empty;
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return empty;
    }
    if (!parsed || !Array.isArray(parsed.drafts)) return empty;
    var index = Number(parsed.index);
    if (!isFinite(index) || index < 0 || index >= parsed.drafts.length) index = 0;
    return { drafts: parsed.drafts, index: index };
  }

  function writeQueue(queue) {
    var storage = store();
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(queue));
    } catch (error) {
      return;
    }
  }

  function optionTexts(select) {
    var texts = [];
    for (var i = 0; i < select.options.length; i++) texts.push(String(select.options[i].textContent || ''));
    return texts;
  }

  function metadataFromPage(parsed) {
    var metadata = { subject_id: '', exam_category_id: '', exam_year: '' };
    var header = (parsed.header && parsed.header.header) || '';
    if (parsed.header && parsed.header.year) metadata.exam_year = String(parsed.header.year);
    var subject = $('context_subject_id');
    var category = $('context_exam_category_id');
    if (subject && subject.options && subject.options.length && root.OCRParser) {
      var subjectIndex = root.OCRParser.pickSubjectIndex(header, optionTexts(subject));
      if (subjectIndex >= 0 && subject.options[subjectIndex]) {
        metadata.subject_id = String(subject.options[subjectIndex].value);
      }
    }
    if (category && category.options && category.options.length && root.OCRParser) {
      var categoryIndex = root.OCRParser.pickCategoryIndex(header, optionTexts(category));
      if (categoryIndex >= 0 && category.options[categoryIndex]) {
        metadata.exam_category_id = String(category.options[categoryIndex].value);
      }
    }
    return metadata;
  }

  function buildDrafts(parsed) {
    var metadata = metadataFromPage(parsed);
    var contexts = Array.isArray(parsed.contexts) ? parsed.contexts : [];
    return contexts.map(function (context) {
      var targets = Array.isArray(context.targets) ? context.targets.slice() : [];
      return {
        contextType: context.type === 'cloze' ? 'cloze' : 'comprehension',
        title: String(context.title || ''),
        text: String(context.text || ''),
        targets: targets,
        expectedCount: context.expectedCount || targets.length || 1,
        subjectId: metadata.subject_id,
        examCategoryId: metadata.exam_category_id,
        examYear: metadata.exam_year
      };
    });
  }

  function formAdapter() {
    if (!root.CBTOwnerContextForm || !root.CBTOwnerContexts) return null;
    return root.CBTOwnerContextForm.create({ model: root.CBTOwnerContexts, document: doc });
  }

  function setField(id, value) {
    var element = $(id);
    if (element) element.value = value === null || value === undefined ? '' : String(value);
  }

  function fillFallback(draft) {
    setField('context_type', draft.contextType);
    setField('context_title', draft.title);
    setField('context_text', draft.text);
    setField('context_subject_id', draft.subjectId);
    setField('context_exam_category_id', draft.examCategoryId);
    setField('context_exam_year', draft.examYear);
    setField('expected_member_count', draft.expectedCount);
    setField('owner_context_targets', (draft.targets || []).join(', '));
  }

  function fill(draft) {
    var adapter = formAdapter();
    if (adapter && adapter.hasForm) {
      var card = root.CBTOwnerContexts.emptyContext({
        subject_id: draft.subjectId,
        exam_category_id: draft.examCategoryId,
        exam_year: draft.examYear
      });
      card.contextType = draft.contextType;
      card.title = draft.title;
      card.text = draft.text;
      card.targets = (draft.targets || []).slice();
      card.expectedCount = draft.expectedCount;
      adapter.fill(card);
      return true;
    }
    fillFallback(draft);
    return true;
  }

  function savedEditorOpen() {
    var adapter = formAdapter();
    if (adapter) return Boolean(adapter.isSavedMode && adapter.isSavedMode());
    var action = doc.querySelector('input[name=action][value=update_context]');
    return Boolean(action);
  }

  function describe(queue) {
    if (!queue.drafts.length) return 'Paste a shared text, then tap Use Paste.';
    return 'Draft ' + (queue.index + 1) + ' of ' + queue.drafts.length
      + (queue.drafts.length > queue.index + 1 ? '. Save it, then tap Fill Next Draft.' : '. Last draft.');
  }

  function usePaste() {
    if (savedEditorOpen()) {
      status('This editor is showing a saved shared text, so paste is off. Open New Shared Text first.');
      return;
    }
    var textarea = $('owner_shared_text');
    var text = textarea ? String(textarea.value || '') : '';
    if (!text.trim()) {
      status('Paste the shared text first.');
      return;
    }
    if (!root.OCRParser || typeof root.OCRParser.parsePaste !== 'function') {
      status('The parser did not load, so the paste could not be read.');
      return;
    }
    var parsed = null;
    try {
      parsed = root.OCRParser.parsePaste(text);
    } catch (error) {
      status('I could not read that paste. Please check it.');
      return;
    }
    var queue = { drafts: buildDrafts(parsed), index: 0 };
    if (!queue.drafts.length) {
      status('I found no shared text in that paste. Nothing changed.');
      return;
    }
    writeQueue(queue);
    fill(queue.drafts[0]);
    status(describe(queue));
  }

  function nextDraft() {
    if (savedEditorOpen()) {
      status('This editor is showing a saved shared text, so paste is off. Open New Shared Text first.');
      return;
    }
    var queue = readQueue();
    if (!queue.drafts.length) {
      status('No pasted drafts are waiting. Paste a shared text first.');
      return;
    }
    queue.index = Math.min(queue.index + 1, queue.drafts.length - 1);
    writeQueue(queue);
    fill(queue.drafts[queue.index]);
    status(describe(queue));
  }

  function start() {
    if (!doc) return false;
    var rootElement = $('owner_shared_paste');
    if (!rootElement) return false;
    var useButton = $('owner_shared_use');
    var nextButton = $('owner_shared_next');
    if (useButton) useButton.addEventListener('click', usePaste);
    if (nextButton) nextButton.addEventListener('click', nextDraft);
    status(describe(readQueue()));
    return true;
  }

  if (doc) start();

  return {
    start: start,
    usePaste: usePaste,
    nextDraft: nextDraft,
    KEY: KEY
  };
});
