(function () {
  'use strict';

  var TOOL_VERSION = '1.1.0';
  var SUCCESS_FLASH = /^Question saved successfully \(Question ID: \d+\)\.$/;
  var META_FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  var OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d'];

  var stateApi = window.CBTOwnerState;
  var parser = window.OCRParser;
  var textApi = window.CBTText;
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
    var already = value.slice(Math.max(0, start - 3), start) === '<u>'
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
    if (matches && SUCCESS_FLASH.test(flash)) {
      var savedNum = item.num === null || item.num === undefined ? '?' : item.num;
      loaded.currentIndex += 1;
      loaded.pendingSubmission = null;
      persist();
      note('Question ' + savedNum + ' saved. The next question is loaded.');
      return 'success';
    }
    if (errorEl) {
      loaded.pendingSubmission = null;
      persist();
      warn('The server rejected that save. The same question is still loaded; fix it and save again.');
      return 'error';
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
    + (editMode ? '' : '<div class="owner-tool-actions">'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_show">Show Paste</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_skip">Skip</button>'
      + '<button type="button" class="admin-btn admin-btn-muted" id="owner_tool_reset">Reset</button>'
      + '</div>');
  form.before(panel);

  function showPaste(show) {
    pasteVisible = Boolean(show);
    var button = $('owner_tool_show');
    if (button) button.textContent = pasteVisible ? 'Hide Paste' : 'Show Paste';
  }

  function render(keepForm) {
    var item = blocked ? null : currentItem();
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
    loaded.items = items;
    loaded.currentIndex = 0;
    loaded.answerKey = key;
    loaded.metadata = inferMetadata(parsed);
    loaded.queueId = stateApi.makeQueueId();
    loaded.pendingSubmission = null;
    if (!persist()) return;
    warn('');
    showPaste(false);
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
    if (blocked) {
      loaded = stateApi.emptyState(parserVersion, stateApi.makeQueueId());
    } else {
      loaded.items = [];
      loaded.currentIndex = 0;
      loaded.pendingSubmission = null;
      loaded.queueId = stateApi.makeQueueId();
    }
    blocked = false;
    savedSelection = null;
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
    var item = blocked ? null : currentItem();
    loaded.pendingSubmission = item ? {
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
})();
