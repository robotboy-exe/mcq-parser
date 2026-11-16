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

  var SYMBOL_NAMES = {
    '⁰': 'superscript zero',
    '¹': 'superscript one',
    '²': 'superscript two',
    '³': 'superscript three',
    '⁴': 'superscript four',
    '⁵': 'superscript five',
    '⁶': 'superscript six',
    '⁷': 'superscript seven',
    '⁸': 'superscript eight',
    '⁹': 'superscript nine',
    '⁺': 'superscript plus',
    '⁻': 'superscript minus',
    'ⁿ': 'superscript n',
    'ˣ': 'superscript x',
    'ʸ': 'superscript y',
    '₀': 'subscript zero',
    '₁': 'subscript one',
    '₂': 'subscript two',
    '₃': 'subscript three',
    '₄': 'subscript four',
    '₅': 'subscript five',
    '₆': 'subscript six',
    '₇': 'subscript seven',
    '₈': 'subscript eight',
    '₉': 'subscript nine',
    '₊': 'subscript plus',
    '₋': 'subscript minus',
    'ₐ': 'subscript a',
    'ₑ': 'subscript e',
    'ᵢ': 'subscript i',
    'ₒ': 'subscript o',
    'ᵤ': 'subscript u',
    'ₓ': 'subscript x',
    '½': 'one half',
    '⅓': 'one third',
    '⅔': 'two thirds',
    '¼': 'one quarter',
    '¾': 'three quarters',
    '⅕': 'one fifth',
    '⅖': 'two fifths',
    '⅗': 'three fifths',
    '⅘': 'four fifths',
    '⅙': 'one sixth',
    '⅚': 'five sixths',
    '⅛': 'one eighth',
    '⅜': 'three eighths',
    '⅝': 'five eighths',
    '⅞': 'seven eighths',
    'α': 'alpha',
    'β': 'beta',
    'γ': 'gamma',
    'δ': 'delta',
    'ε': 'epsilon',
    'θ': 'theta',
    'λ': 'lambda',
    'μ': 'mu',
    'π': 'pi',
    'ρ': 'rho',
    'σ': 'sigma',
    'τ': 'tau',
    'φ': 'phi',
    'ω': 'omega',
    'Δ': 'capital delta',
    'Ω': 'capital omega',
    'Σ': 'capital sigma',
    '∈': 'element of',
    '∉': 'not an element of',
    '⊂': 'subset of',
    '⊆': 'subset of or equal to',
    '∪': 'union',
    '∩': 'intersection',
    '∅': 'empty set',
    '∧': 'and',
    '∨': 'or',
    '¬': 'not',
    '⇒': 'implies',
    '⇔': 'if and only if',
    '∠': 'angle',
    '⊥': 'perpendicular',
    '∥': 'parallel',
    '△': 'triangle',
    '→': 'right arrow',
    '←': 'left arrow',
    '↔': 'left right arrow',
    '↑': 'up arrow',
    '↓': 'down arrow',
    '±': 'plus minus',
    '√': 'square root',
    '×': 'multiplication',
    '÷': 'division',
    '≠': 'not equal',
    '≈': 'approximately equal',
    '°': 'degree'
  };

  var QUICK_ROW = ['²', '³', 'ⁿ', '₁', '₂', '±', '√', '×', '÷', '≠', '≈', '°', '½', 'π', 'θ'];

  var QUICK_LABELS = {
    '²': 'x²',
    '³': 'x³',
    'ⁿ': 'xⁿ',
    '₁': 'x₁',
    '₂': 'x₂'
  };

  var CATEGORIES = [
    { title: 'Exponents', characters: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', 'ⁿ', 'ˣ', 'ʸ'] },
    { title: 'Subscripts', characters: ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₊', '₋', 'ₐ', 'ₑ', 'ᵢ', 'ₒ', 'ᵤ', 'ₓ'] },
    { title: 'Fractions', characters: ['½', '⅓', '⅔', '¼', '¾', '⅕', '⅖', '⅗', '⅘', '⅙', '⅚', '⅛', '⅜', '⅝', '⅞'] },
    { title: 'Greek', characters: ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Δ', 'Ω', 'Σ'] },
    { title: 'Set theory and logic', characters: ['∈', '∉', '⊂', '⊆', '∪', '∩', '∅', '∧', '∨', '¬', '⇒', '⇔'] },
    { title: 'Geometry and vectors', characters: ['∠', '⊥', '∥', '△', '→', '←', '↔', '↑', '↓'] }
  ];

  function symbolName(character) {
    return SYMBOL_NAMES[character] || ('symbol ' + character);
  }

  function formatByteCount(bytes) {
    return String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  var VULGAR_FRACTIONS = {
    '1/2': '½',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/4': '¼',
    '3/4': '¾',
    '1/5': '⅕',
    '2/5': '⅖',
    '3/5': '⅗',
    '4/5': '⅘',
    '1/6': '⅙',
    '5/6': '⅚',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞'
  };

  var SUPERSCRIPT_DIGITS = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹'
  };

  var SUBSCRIPT_DIGITS = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉'
  };

  function digitRun(digits, map) {
    var result = '';
    for (var index = 0; index < digits.length; index += 1) {
      result += map[digits.charAt(index)];
    }
    return result;
  }

  function customFraction(numerator, denominator) {
    var top = String(numerator == null ? '' : numerator).trim();
    var bottom = String(denominator == null ? '' : denominator).trim();
    if (!/^\d+$/.test(top) || !/^\d+$/.test(bottom)) {
      return '';
    }
    top = top.replace(/^0+(?=\d)/, '');
    bottom = bottom.replace(/^0+(?=\d)/, '');
    if (bottom === '0') {
      return '';
    }
    var key = top + '/' + bottom;
    if (VULGAR_FRACTIONS[key]) {
      return VULGAR_FRACTIONS[key];
    }
    return digitRun(top, SUPERSCRIPT_DIGITS) + '⁄' + digitRun(bottom, SUBSCRIPT_DIGITS);
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

    var quick = element('div', 'math-tool-quick');
    for (var quickIndex = 0; quickIndex < QUICK_ROW.length; quickIndex += 1) {
      var quickCharacter = QUICK_ROW[quickIndex];
      quick.appendChild(symbolButton(quickCharacter, QUICK_LABELS[quickCharacter] || quickCharacter));
    }

    var toggle = element('button', 'math-tool-toggle', 'More symbols');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Show all math symbols');
    toggle.setAttribute('aria-controls', 'math_tool_drawer');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('mousedown', preventBlur);

    toolbar.appendChild(quick);
    toolbar.appendChild(toggle);

    var drawer = element('div', 'math-tool-drawer');
    drawer.id = 'math_tool_drawer';
    drawer.hidden = true;

    function customFractionRow() {
      var row = element('div', 'math-tool-custom-fraction');
      row.appendChild(element('span', 'math-tool-custom-fraction-title', 'Custom'));

      function fractionInput(label, placeholder) {
        var input = element('input', 'math-tool-custom-fraction-input');
        input.type = 'text';
        input.setAttribute('aria-label', label);
        input.setAttribute('placeholder', placeholder);
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            insertCustomFraction();
          }
        });
        return input;
      }

      function insertCustomFraction() {
        var fraction = customFraction(numerator.value, denominator.value);
        if (!fraction) {
          if (typeof numerator.focus === 'function') {
            numerator.focus();
          }
          return;
        }
        insertCharacter(fraction);
      }

      var numerator = fractionInput('Custom fraction numerator', 'num');
      var denominator = fractionInput('Custom fraction denominator', 'den');
      var slash = element('span', 'math-tool-custom-fraction-slash', '/');
      slash.setAttribute('aria-hidden', 'true');
      var insertButton = element('button', 'math-tool-custom-fraction-insert', 'Insert');
      insertButton.type = 'button';
      insertButton.setAttribute('aria-label', 'Insert custom fraction');
      insertButton.addEventListener('mousedown', preventBlur);
      insertButton.addEventListener('click', insertCustomFraction);

      row.appendChild(numerator);
      row.appendChild(slash);
      row.appendChild(denominator);
      row.appendChild(insertButton);
      return row;
    }

    for (var categoryIndex = 0; categoryIndex < CATEGORIES.length; categoryIndex += 1) {
      var category = CATEGORIES[categoryIndex];
      var section = element('div', 'math-tool-category');
      section.appendChild(element('span', 'math-tool-category-title', category.title));
      var characters = element('div', 'math-tool-chars');
      for (var characterIndex = 0; characterIndex < category.characters.length; characterIndex += 1) {
        var categoryCharacter = category.characters[characterIndex];
        characters.appendChild(symbolButton(categoryCharacter, categoryCharacter));
      }
      section.appendChild(characters);
      if (category.title === 'Fractions') {
        section.appendChild(customFractionRow());
      }
      drawer.appendChild(section);
    }

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      drawer.hidden = expanded;
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      toggle.textContent = expanded ? 'More symbols' : 'Fewer symbols';
      toggle.setAttribute('aria-label', expanded ? 'Show all math symbols' : 'Hide extra math symbols');
    });

    textarea.parentNode.insertBefore(toolbar, textarea);
    textarea.parentNode.insertBefore(drawer, textarea);
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
      drawer: drawer,
      counter: counter,
      insert: insertCharacter,
      update: updateCounter,
      selection: selection
    };
  }

  return {
    BYTE_LIMIT: BYTE_LIMIT,
    AMBER_THRESHOLD: AMBER_THRESHOLD,
    QUICK_ROW: QUICK_ROW,
    CATEGORIES: CATEGORIES,
    symbolName: symbolName,
    formatByteCount: formatByteCount,
    customFraction: customFraction,
    insertAtCaret: insertAtCaret,
    utf8ByteLength: utf8ByteLength,
    byteStatus: byteStatus,
    init: init
  };
});
