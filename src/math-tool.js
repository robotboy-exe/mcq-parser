(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (!root || !root.document) {
    return;
  }
  if (root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', function () {
      api.init(root);
    });
  } else {
    api.init(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var BYTE_LIMIT = 60000;
  var AMBER_THRESHOLD = 57000;
  var MOUNT_ATTRIBUTE = 'data-math-tool-mounted';

  var OPERATORS = [
    { character: '±', name: 'plus minus' },
    { character: '×', name: 'multiplication' },
    { character: '÷', name: 'division' },
    { character: '≠', name: 'not equal' },
    { character: '≈', name: 'approximately equal' },
    { character: '°', name: 'degree' },
    { character: 'π', name: 'pi' }
  ];

  function symbolName(character) {
    for (var index = 0; index < OPERATORS.length; index += 1) {
      if (OPERATORS[index].character === character) {
        return OPERATORS[index].name;
      }
    }
    return 'symbol ' + character;
  }

  function formatByteCount(bytes) {
    return String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function utf8ByteLength(text) {
    var value = String(text == null ? '' : text);
    if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(value).length;
    }
    var bytes = 0;
    for (var index = 0; index < value.length; index += 1) {
      var code = value.charCodeAt(index);
      if (code < 0x80) {
        bytes += 1;
      } else if (code < 0x800) {
        bytes += 2;
      } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
        var next = value.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          bytes += 4;
          index += 1;
        } else {
          bytes += 3;
        }
      } else {
        bytes += 3;
      }
    }
    return bytes;
  }

  function byteStatus(bytes, limit) {
    var cap = isFinite(limit) && Number(limit) > 0 ? Number(limit) : BYTE_LIMIT;
    var count = isFinite(bytes) ? Number(bytes) : 0;
    if (count >= cap) {
      return 'red';
    }
    if (count >= AMBER_THRESHOLD) {
      return 'amber';
    }
    return 'neutral';
  }

  function insertAtCaret(value, start, end, insertion) {
    var source = String(value == null ? '' : value);
    var text = String(insertion == null ? '' : insertion);
    var startNumber = Number(start);
    var endNumber = Number(end);
    var from = isFinite(startNumber) ? Math.floor(startNumber) : 0;
    from = Math.max(0, Math.min(from, source.length));
    var to = isFinite(endNumber) ? Math.floor(endNumber) : from;
    to = Math.max(from, Math.min(to, source.length));

    return {
      value: source.slice(0, from) + text + source.slice(to),
      start: from,
      end: to,
      caret: from + text.length,
      changed: text.length > 0
    };
  }

  // Shape values are freeform, but never a way to forge or split markers.
  function cleanValue(value, forbidden) {
    var text = String(value == null ? '' : value).trim();
    if (!text || /[<>]/.test(text)) {
      return '';
    }
    if (forbidden && text.indexOf(forbidden) !== -1) {
      return '';
    }
    return text;
  }

  function fractionMarkup(numerator, denominator) {
    var top = cleanValue(numerator, '/');
    var bottom = cleanValue(denominator, '/');
    if (!top || !bottom) {
      return '';
    }
    return '<frac>' + top + '/' + bottom + '</frac>';
  }

  function exponentMarkup(base, exponent) {
    var stem = cleanValue(base);
    var power = cleanValue(exponent);
    if (!stem || !power) {
      return '';
    }
    return stem + '<sup>' + power + '</sup>';
  }

  function subscriptMarkup(base, subscript) {
    var stem = cleanValue(base);
    var index = cleanValue(subscript);
    if (!stem || !index) {
      return '';
    }
    return stem + '<sub>' + index + '</sub>';
  }

  function rootMarkup(radicand) {
    var value = cleanValue(radicand);
    if (!value) {
      return '';
    }
    return '<sqrt>' + value + '</sqrt>';
  }

  function matrixMarkup(first, second, third, fourth) {
    var cells = [first, second, third, fourth];
    var cleaned = [];
    for (var index = 0; index < cells.length; index += 1) {
      var cell = cleanValue(cells[index], '|');
      if (!cell) {
        return '';
      }
      cleaned.push(cell);
    }
    return '<matrix>' + cleaned.join('|') + '</matrix>';
  }

  var SHAPES = [
    {
      id: 'fraction',
      label: 'Fraction',
      button: 'a/b',
      hint: 'Enter a numerator and a denominator without / or < >.',
      fields: [
        { key: 'numerator', label: 'Fraction numerator', placeholder: 'num' },
        { key: 'denominator', label: 'Fraction denominator', placeholder: 'den' }
      ],
      build: function (values) {
        return fractionMarkup(values.numerator, values.denominator);
      }
    },
    {
      id: 'exponent',
      label: 'Exponent',
      button: 'x\u00b2',
      hint: 'Enter a base and an exponent without < >.',
      fields: [
        { key: 'base', label: 'Exponent base', placeholder: 'base' },
        { key: 'exponent', label: 'Exponent value', placeholder: 'power' }
      ],
      build: function (values) {
        return exponentMarkup(values.base, values.exponent);
      }
    },
    {
      id: 'subscript',
      label: 'Subscript',
      button: 'x\u2081',
      hint: 'Enter a base and a subscript without < >.',
      fields: [
        { key: 'base', label: 'Subscript base', placeholder: 'base' },
        { key: 'subscript', label: 'Subscript value', placeholder: 'index' }
      ],
      build: function (values) {
        return subscriptMarkup(values.base, values.subscript);
      }
    },
    {
      id: 'root',
      label: 'Root',
      button: '\u221a',
      hint: 'Enter the value under the root without < >.',
      fields: [
        { key: 'radicand', label: 'Root radicand', placeholder: 'radicand' }
      ],
      build: function (values) {
        return rootMarkup(values.radicand);
      }
    },
    {
      id: 'matrix',
      label: '2x2 matrix',
      button: '2\u00d72',
      hint: 'Enter all four cells without | or < >.',
      fields: [
        { key: 'first', label: 'Matrix cell 1', placeholder: 'a' },
        { key: 'second', label: 'Matrix cell 2', placeholder: 'b' },
        { key: 'third', label: 'Matrix cell 3', placeholder: 'c' },
        { key: 'fourth', label: 'Matrix cell 4', placeholder: 'd' }
      ],
      build: function (values) {
        return matrixMarkup(values.first, values.second, values.third, values.fourth);
      }
    }
  ];

  function init(root) {
    var document = root && root.document;
    if (!document) {
      return null;
    }
    if (typeof document.querySelector === 'function' && document.querySelector('[' + MOUNT_ATTRIBUTE + ']')) {
      return null;
    }
    var textarea = document.getElementById('question_text');
    if (!textarea || !textarea.parentNode) {
      return null;
    }

    var textApi = root.CBTText && typeof root.CBTText.render === 'function' ? root.CBTText : null;
    var selection = {
      start: typeof textarea.selectionStart === 'number' ? textarea.selectionStart : 0,
      end: typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : 0
    };

    function element(tagName, className, text) {
      var node = document.createElement(tagName);
      if (className) {
        node.className = className;
      }
      if (typeof text === 'string') {
        node.textContent = text;
      }
      return node;
    }

    function preventBlur(event) {
      event.preventDefault();
    }

    function rememberSelection() {
      selection.start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : 0;
      selection.end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : 0;
    }

    function dispatchInput() {
      var event;
      if (typeof Event === 'function') {
        event = new Event('input', { bubbles: true });
      } else {
        event = { type: 'input', bubbles: true };
      }
      textarea.dispatchEvent(event);
    }

    var counter = element('div', 'math-tool-counter math-tool-counter-neutral');
    counter.id = 'math_tool_counter';
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('data-byte-status', 'neutral');
    var counterText = element('span', 'math-tool-counter-text', '');
    var counterWarning = element(
      'span',
      'math-tool-counter-warning',
      'The server may reject this save. It is over the 60 000-byte limit.'
    );
    counterWarning.hidden = true;
    counter.appendChild(counterText);
    counter.appendChild(counterWarning);

    function updateCounter() {
      var bytes = utf8ByteLength(textarea.value || '');
      var status = byteStatus(bytes, BYTE_LIMIT);
      counterText.textContent = formatByteCount(bytes) + ' / 60 000 bytes';
      counterWarning.hidden = status !== 'red';
      counter.className = 'math-tool-counter math-tool-counter-' + status;
      counter.setAttribute('data-byte-status', status);
      return bytes;
    }

    function insertCharacter(character) {
      var result = insertAtCaret(textarea.value || '', selection.start, selection.end, character);
      var inserted = false;

      if (typeof textarea.focus === 'function') {
        textarea.focus();
      }
      if (typeof textarea.setSelectionRange === 'function') {
        textarea.setSelectionRange(result.start, result.end);
      }
      if (typeof document.execCommand === 'function') {
        try {
          inserted = document.execCommand('insertText', false, character);
        } catch (error) {
          inserted = false;
        }
      }
      if (!inserted) {
        if (typeof textarea.setRangeText === 'function') {
          try {
            textarea.setRangeText(character, result.start, result.end, 'end');
          } catch (error) {
            textarea.value = result.value;
          }
        } else {
          textarea.value = result.value;
        }
        dispatchInput();
      }
      if (typeof textarea.setSelectionRange === 'function') {
        textarea.setSelectionRange(result.caret, result.caret);
      }
      selection.start = result.caret;
      selection.end = result.caret;
      updateCounter();
      return result.changed;
    }

    function symbolButton(character, label) {
      var button = element('button', 'math-tool-symbol', label);
      button.type = 'button';
      button.setAttribute('aria-label', symbolName(character));
      button.title = symbolName(character);
      button.addEventListener('mousedown', preventBlur);
      button.addEventListener('click', function () {
        insertCharacter(character);
      });
      return button;
    }

    var toolbar = element('div', 'math-tool-toolbar');
    toolbar.id = 'math_tool_toolbar';
    toolbar.setAttribute(MOUNT_ATTRIBUTE, 'question_text');
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Math symbols');

    var operatorRow = element('div', 'math-tool-operators');
    for (var operatorIndex = 0; operatorIndex < OPERATORS.length; operatorIndex += 1) {
      operatorRow.appendChild(symbolButton(OPERATORS[operatorIndex].character, OPERATORS[operatorIndex].character));
    }
    toolbar.appendChild(operatorRow);

    var shapeRow = element('div', 'math-tool-shapes');
    toolbar.appendChild(shapeRow);

    var panels = element('div', 'math-tool-panels');
    panels.id = 'math_tool_panels';

    var shapeButtons = [];
    var panelElements = [];

    for (var shapeIndex = 0; shapeIndex < SHAPES.length; shapeIndex += 1) {
      (function (shape) {
        var panelId = 'math_tool_panel_' + shape.id;
        var button = element('button', 'math-tool-shape', shape.button);
        button.type = 'button';
        button.setAttribute('aria-label', 'Insert ' + shape.label);
        button.setAttribute('aria-controls', panelId);
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('mousedown', preventBlur);
        shapeRow.appendChild(button);
        shapeButtons.push(button);

        var panel = element('section', 'math-tool-panel');
        panel.id = panelId;
        panel.hidden = true;
        panel.appendChild(element('span', 'math-tool-panel-title', shape.label));

        var fields = element(
          'div',
          shape.id === 'matrix' ? 'math-tool-fields math-tool-matrix-fields' : 'math-tool-fields'
        );
        var inputs = {};

        function values() {
          var collected = {};
          for (var index = 0; index < shape.fields.length; index += 1) {
            var key = shape.fields[index].key;
            collected[key] = inputs[key].value;
          }
          return collected;
        }

        function currentMarkup() {
          return shape.build(values());
        }

        var preview = element('div', 'math-tool-preview');
        preview.setAttribute('aria-live', 'polite');

        function refreshPreview() {
          var markup = currentMarkup();
          if (textApi) {
            textApi.render(preview, markup);
          } else {
            preview.textContent = markup;
          }
          return markup;
        }

        var hint = element('p', 'math-tool-hint', '');
        hint.hidden = true;

        function focusFirstEmpty() {
          for (var index = 0; index < shape.fields.length; index += 1) {
            var candidate = inputs[shape.fields[index].key];
            if (!candidate.value.trim() && typeof candidate.focus === 'function') {
              candidate.focus();
              return;
            }
          }
        }

        function attemptInsert() {
          var markup = currentMarkup();
          if (!markup) {
            hint.textContent = shape.hint;
            hint.hidden = false;
            focusFirstEmpty();
            return;
          }
          hint.hidden = true;
          insertCharacter(markup);
          refreshPreview();
        }

        for (var fieldIndex = 0; fieldIndex < shape.fields.length; fieldIndex += 1) {
          (function (field) {
            var input = element('input', 'math-tool-field-input');
            input.type = 'text';
            input.setAttribute('aria-label', field.label);
            input.setAttribute('placeholder', field.placeholder);
            input.addEventListener('input', function () {
              hint.hidden = true;
              refreshPreview();
            });
            input.addEventListener('keydown', function (event) {
              if (event.key === 'Enter') {
                event.preventDefault();
                attemptInsert();
              }
            });
            inputs[field.key] = input;
            fields.appendChild(input);
          })(shape.fields[fieldIndex]);
        }

        var insertButton = element('button', 'math-tool-insert', 'Insert');
        insertButton.type = 'button';
        insertButton.setAttribute('aria-label', 'Insert ' + shape.label);
        insertButton.addEventListener('mousedown', preventBlur);
        insertButton.addEventListener('click', attemptInsert);

        panel.appendChild(fields);
        panel.appendChild(preview);
        panel.appendChild(hint);
        panel.appendChild(insertButton);
        panels.appendChild(panel);
        panelElements.push(panel);

        button.addEventListener('click', function () {
          var expanded = button.getAttribute('aria-expanded') === 'true';
          for (var index = 0; index < shapeButtons.length; index += 1) {
            shapeButtons[index].setAttribute('aria-expanded', 'false');
          }
          for (var panelIndex = 0; panelIndex < panelElements.length; panelIndex += 1) {
            panelElements[panelIndex].hidden = true;
          }
          if (expanded) {
            return;
          }
          button.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
          focusFirstEmpty();
          refreshPreview();
        });

        panel.refreshPreview = refreshPreview;
      })(SHAPES[shapeIndex]);
    }

    textarea.parentNode.insertBefore(toolbar, textarea);
    textarea.parentNode.insertBefore(panels, textarea);
    if (textarea.nextSibling) {
      textarea.parentNode.insertBefore(counter, textarea.nextSibling);
    } else {
      textarea.parentNode.appendChild(counter);
    }

    ['select', 'keyup', 'mouseup', 'touchend', 'input'].forEach(function (eventName) {
      textarea.addEventListener(eventName, rememberSelection);
    });
    textarea.addEventListener('input', updateCounter);
    textarea.addEventListener('change', updateCounter);

    function refreshAfterPageChange() {
      if (root && typeof root.setTimeout === 'function') {
        root.setTimeout(updateCounter, 0);
      } else {
        updateCounter();
      }
    }

    var ownerForm = textarea.form || null;
    if (ownerForm && typeof ownerForm.addEventListener === 'function') {
      ownerForm.addEventListener('reset', refreshAfterPageChange);
    }
    ['ocr_load', 'ocr_skip'].forEach(function (id) {
      var button = document.getElementById(id);
      if (button && typeof button.addEventListener === 'function') {
        button.addEventListener('click', refreshAfterPageChange);
      }
    });

    updateCounter();

    return {
      toolbar: toolbar,
      panels: panels,
      counter: counter,
      insert: insertCharacter,
      update: updateCounter,
      selection: selection
    };
  }

  return {
    BYTE_LIMIT: BYTE_LIMIT,
    AMBER_THRESHOLD: AMBER_THRESHOLD,
    OPERATORS: OPERATORS,
    SHAPES: SHAPES,
    symbolName: symbolName,
    formatByteCount: formatByteCount,
    fractionMarkup: fractionMarkup,
    exponentMarkup: exponentMarkup,
    subscriptMarkup: subscriptMarkup,
    rootMarkup: rootMarkup,
    matrixMarkup: matrixMarkup,
    insertAtCaret: insertAtCaret,
    utf8ByteLength: utf8ByteLength,
    byteStatus: byteStatus,
    init: init
  };
});
