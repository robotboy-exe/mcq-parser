// Shared question/context text renderer for the owner tool and the CBT pages.
// Only the exact markers <u> and </u> are formatting; everything else is text.
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTText = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var OPEN = '<u>';
  var CLOSE = '</u>';

  function escapeText(text) {
    return String(text === null || text === undefined ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Splits text into plain and underlined parts. A marker only counts when it
  // is exactly <u> or </u> and matches the current state; anything else,
  // including attributes, other tags and encoded markers, stays text.
  function segments(text) {
    var source = String(text === null || text === undefined ? '' : text);
    var parts = [];
    var buffer = '';
    var open = false;
    var i = 0;

    function flush() {
      if (!buffer) return;
      parts.push({ text: buffer, underline: open });
      buffer = '';
    }

    while (i < source.length) {
      if (!open && source.slice(i, i + OPEN.length) === OPEN) {
        flush();
        open = true;
        i += OPEN.length;
        continue;
      }
      if (open && source.slice(i, i + CLOSE.length) === CLOSE) {
        flush();
        open = false;
        i += CLOSE.length;
        continue;
      }
      buffer += source.charAt(i);
      i += 1;
    }
    flush();
    return parts;
  }

  // Safe HTML string: every part is escaped here, and only the two markers are
  // re-emitted as tags.
  function format(text) {
    return segments(text).map(function (part) {
      return part.underline ? '<u>' + escapeText(part.text) + '</u>' : escapeText(part.text);
    }).join('');
  }

  // Sets an element's contents with text nodes plus real <u> elements, so no
  // stored text is ever parsed as HTML.
  function render(element, text) {
    if (!element) return element;
    var doc = element.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc) return element;
    element.textContent = '';
    segments(text).forEach(function (part) {
      var node = doc.createTextNode(part.text);
      if (!part.underline) {
        element.appendChild(node);
        return;
      }
      var underlined = doc.createElement('u');
      underlined.appendChild(node);
      element.appendChild(underlined);
    });
    return element;
  }

  // Plain text with the exact markers removed, for list summaries and titles.
  function strip(text) {
    return segments(text).map(function (part) {
      return part.text;
    }).join('');
  }

  return {
    escapeText: escapeText,
    segments: segments,
    format: format,
    render: render,
    strip: strip
  };
});
