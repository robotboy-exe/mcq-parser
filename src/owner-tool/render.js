// Shared question/context text renderer for the owner tool and the CBT pages.
// Only the exact markers <u> and </u> are formatting; everything else is text.
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api.text;
  if (root) {
    root.CBTText = api.text;
    root.CBTContext = api.context;
  }
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
    var remainingCloses = 0;
    var scan = 0;
    while ((scan = source.indexOf(CLOSE, scan)) !== -1) {
      remainingCloses++;
      scan += CLOSE.length;
    }

    function flush() {
      if (!buffer) return;
      parts.push({ text: buffer, underline: open });
      buffer = '';
    }

    while (i < source.length) {
      if (source.slice(i, i + OPEN.length) === OPEN) {
        if (!open && remainingCloses > 0) {
          flush();
          open = true;
        } else {
          buffer += OPEN;
        }
        i += OPEN.length;
        continue;
      }
      if (source.slice(i, i + CLOSE.length) === CLOSE) {
        if (open) {
          flush();
          open = false;
        } else {
          buffer += CLOSE;
        }
        remainingCloses--;
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

  var textApi = {
    escapeText: escapeText,
    segments: segments,
    format: format,
    render: render,
    strip: strip
  };

  var GAP = /\[\[gap:([1-9]\d{0,2})\]\]/g;

  function appendText(parent, text, underline, contextType, activeSlot) {
    var doc = parent.ownerDocument;
    var target = parent;
    if (underline) {
      target = doc.createElement('u');
      parent.appendChild(target);
    }
    if (contextType !== 'cloze') {
      target.appendChild(doc.createTextNode(text));
      return;
    }

    var last = 0;
    var match;
    GAP.lastIndex = 0;
    while ((match = GAP.exec(text)) !== null) {
      if (match.index > last) {
        target.appendChild(doc.createTextNode(text.slice(last, match.index)));
      }
      var slot = Number(match[1]);
      var gap = doc.createElement(slot === Number(activeSlot) ? 'mark' : 'span');
      gap.className = slot === Number(activeSlot)
        ? 'cbt-context-gap cbt-context-gap-active'
        : 'cbt-context-gap';
      gap.textContent = match[0];
      if (slot === Number(activeSlot)) {
        gap.setAttribute('aria-current', 'true');
        gap.setAttribute('aria-label', 'Current gap ' + slot);
      }
      target.appendChild(gap);
      last = GAP.lastIndex;
    }
    if (last < text.length) {
      target.appendChild(doc.createTextNode(text.slice(last)));
    }
  }

  function renderText(element, context) {
    var parts = textApi && typeof textApi.segments === 'function'
      ? textApi.segments(context.text)
      : [{ text: String(context.text || ''), underline: false }];
    parts.forEach(function (part) {
      appendText(element, part.text, part.underline, context.type, context.activeSlot);
    });
  }

  function createCard(doc, context, activeSlot) {
    var details = doc.createElement('details');
    details.className = 'cbt-context-card';
    details.open = true;

    var summary = doc.createElement('summary');
    summary.className = 'cbt-context-title';
    summary.textContent = String(context.title || 'Shared context');
    details.appendChild(summary);

    var body = doc.createElement('div');
    body.className = 'cbt-context-text';
    renderText(body, {
      type: context.type,
      text: context.text,
      activeSlot: activeSlot,
    });
    details.appendChild(body);
    return details;
  }

  function renderForQuestion(container, contexts, question) {
    if (!container || !question || question.contextId === null || question.contextId === undefined) {
      return null;
    }
    var context = contexts && contexts[String(question.contextId)];
    if (!context) return null;
    var card = createCard(container.ownerDocument, context, question.contextSlot);
    if (container.firstChild) container.insertBefore(card, container.firstChild);
    else container.appendChild(card);
    return card;
  }

  var contextApi = {
    createCard: createCard,
    renderForQuestion: renderForQuestion,
  };

  textApi.createCard = contextApi.createCard;
  textApi.renderForQuestion = contextApi.renderForQuestion;

  return { text: textApi, context: contextApi };
});
