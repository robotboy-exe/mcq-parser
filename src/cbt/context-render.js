// Candidate shared-context cards. Stored text is always rendered with DOM nodes.
(function (root, factory) {
  var textApi = typeof module !== 'undefined' && module.exports
    ? require('../owner-tool/render.js')
    : root.CBTText;
  var api = factory(textApi);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CBTContext = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (textApi) {
  'use strict';

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
    var segments = textApi && typeof textApi.segments === 'function'
      ? textApi.segments(context.text)
      : [{ text: String(context.text || ''), underline: false }];
    segments.forEach(function (part) {
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

  return {
    createCard: createCard,
    renderForQuestion: renderForQuestion,
  };
});
