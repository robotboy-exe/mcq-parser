// Shared question/constant text renderer for the admin preview and the CBT
// pages. Only the exact lowercase markers <u>, <frac>, <sup>, <sub>, <sqrt>,
// and <matrix> are formatting; everything else is escaped text.
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api.text;
  if (root) {
    root.CBTText = api.text;
    root.CBTContext = api.context;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_DEPTH = 8;
  var TAGS = ['u', 'frac', 'sup', 'sub', 'sqrt', 'matrix'];
  var MATRIX_CELLS = 4;

  function escapeText(text) {
    return String(text === null || text === undefined ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function openToken(tag) {
    return '<' + tag + '>';
  }

  function closeToken(tag) {
    return '</' + tag + '>';
  }

  function openTagAt(source, pos) {
    for (var index = 0; index < TAGS.length; index += 1) {
      var candidate = TAGS[index];
      if (source.slice(pos, pos + openToken(candidate).length) === openToken(candidate)) return candidate;
    }
    return null;
  }

  function closeTagAt(source, pos) {
    for (var index = 0; index < TAGS.length; index += 1) {
      var candidate = TAGS[index];
      if (source.slice(pos, pos + closeToken(candidate).length) === closeToken(candidate)) return candidate;
    }
    return null;
  }

  // Rejects a marker pair that would cross another marker: an inner marker may
  // not span past this marker's close, and a close whose tag was not opened
  // inside this span may not appear in it (INV-97). Markers of an already open
  // tag stay literal, so they are skipped instead of being counted.
  function markerInteriorIsClean(source, start, end, openTags, tag) {
    var inside = [];
    var pos = start;
    while (pos < end) {
      var opened = openTagAt(source, pos);
      if (opened) {
        var closeAt = source.indexOf(closeToken(opened), pos + openToken(opened).length);
        if (closeAt !== -1 && closeAt > end) return false;
        if (closeAt !== -1 && opened !== tag && openTags.indexOf(opened) === -1) inside.push(opened);
        pos += openToken(opened).length;
        continue;
      }
      var closed = closeTagAt(source, pos);
      if (closed) {
        if (!inside.length || inside[inside.length - 1] !== closed) return false;
        inside.pop();
        pos += closeToken(closed).length;
        continue;
      }
      pos += 1;
    }
    return inside.length === 0;
  }

  // A marker opens only when its closing marker appears later, its own tag is
  // not already open, the interior markers stay properly nested, and the depth
  // budget allows it. Anything else stays text.
  function parse(text) {
    var source = String(text === null || text === undefined ? '' : text);
    var pos = 0;

    function parseLevel(stopTag, openTags, depth) {
      var nodes = [];
      var buffer = '';

      function flush() {
        if (buffer) {
          nodes.push({ text: buffer });
          buffer = '';
        }
      }

      while (pos < source.length) {
        if (stopTag && source.slice(pos, pos + closeToken(stopTag).length) === closeToken(stopTag)) {
          pos += closeToken(stopTag).length;
          flush();
          return nodes;
        }
        var tag = openTagAt(source, pos);
        if (tag) {
          var closeAt = source.indexOf(closeToken(tag), pos + openToken(tag).length);
          if (
            depth < MAX_DEPTH
            && openTags.indexOf(tag) === -1
            && closeAt !== -1
            && markerInteriorIsClean(source, pos + openToken(tag).length, closeAt, openTags, tag)
          ) {
            flush();
            pos += openToken(tag).length;
            nodes.push({ tag: tag, children: parseLevel(tag, openTags.concat(tag), depth + 1) });
            continue;
          }
        }
        buffer += source.charAt(pos);
        pos += 1;
      }
      flush();
      return nodes;
    }

    return parseLevel(null, [], 0);
  }

  // Splits a node list at the first separator that appears in its own text.
  function takeAt(nodes, separator) {
    var head = [];
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (typeof node.text === 'string') {
        var at = node.text.indexOf(separator);
        if (at !== -1) {
          if (at > 0) head.push({ text: node.text.slice(0, at) });
          var tail = [];
          var rest = node.text.slice(at + separator.length);
          if (rest) tail.push({ text: rest });
          for (var next = index + 1; next < nodes.length; next += 1) tail.push(nodes[next]);
          return { head: head, tail: tail, found: true };
        }
      }
      head.push(node);
    }
    return { head: head, tail: [], found: false };
  }

  function matrixCells(nodes) {
    var groups = [];
    var rest = nodes;
    for (var index = 0; index < MATRIX_CELLS - 1; index += 1) {
      var part = takeAt(rest, '|');
      if (!part.found) return null;
      groups.push(part.head);
      rest = part.tail;
    }
    if (takeAt(rest, '|').found) return null;
    groups.push(rest);
    return groups;
  }

  function formatNodes(nodes) {
    var html = '';
    for (var index = 0; index < nodes.length; index += 1) {
      html += formatNode(nodes[index]);
    }
    return html;
  }

  function formatNode(node) {
    if (typeof node.text === 'string') return escapeText(node.text);
    var tag = node.tag;
    var children = node.children || [];
    if (tag === 'u') return '<u>' + formatNodes(children) + '</u>';
    if (tag === 'sup') return '<sup>' + formatNodes(children) + '</sup>';
    if (tag === 'sub') return '<sub>' + formatNodes(children) + '</sub>';
    if (tag === 'frac') {
      var split = takeAt(children, '/');
      if (!split.found) {
        return '<span class="cbt-frac cbt-frac-single">' + formatNodes(children) + '</span>';
      }
      return '<span class="cbt-frac">'
        + '<span class="cbt-frac-num">' + formatNodes(split.head) + '</span>'
        + '<span class="cbt-frac-den">' + formatNodes(split.tail) + '</span>'
        + '</span>';
    }
    if (tag === 'sqrt') {
      return '<span class="cbt-sqrt">'
        + '<span class="cbt-sqrt-sign" aria-hidden="true">\u221a</span>'
        + '<span class="cbt-sqrt-body">' + formatNodes(children) + '</span>'
        + '</span>';
    }
    if (tag === 'matrix') {
      var cells = matrixCells(children);
      if (!cells) {
        return '<span class="cbt-matrix cbt-matrix-single">' + formatNodes(children) + '</span>';
      }
      var grid = '';
      for (var cell = 0; cell < cells.length; cell += 1) {
        grid += '<span class="cbt-matrix-cell">' + formatNodes(cells[cell]) + '</span>';
      }
      return '<span class="cbt-matrix">'
        + '<span class="cbt-matrix-bracket" aria-hidden="true">[</span>'
        + '<span class="cbt-matrix-grid">' + grid + '</span>'
        + '<span class="cbt-matrix-bracket" aria-hidden="true">]</span>'
        + '</span>';
    }
    return formatNodes(children);
  }

  // Safe HTML string: every text run is escaped here, and only recognized
  // markers are re-emitted as tags.
  function format(text) {
    return formatNodes(parse(text));
  }

  function pushPart(parts, text, underline) {
    if (!text) return;
    var last = parts[parts.length - 1];
    if (last && last.underline === underline) {
      last.text += text;
      return;
    }
    parts.push({ text: text, underline: underline });
  }

  function flatten(nodes, underline, parts) {
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (typeof node.text === 'string') {
        pushPart(parts, node.text, underline);
        continue;
      }
      flatten(node.children || [], node.tag === 'u' ? true : underline, parts);
    }
    return parts;
  }

  // Underline-only view kept for the shared context card API.
  function segments(text) {
    return flatten(parse(text), false, []);
  }

  // Sets an element's contents with real elements, so no stored text is ever
  // parsed as HTML.
  function renderNode(doc, parent, node) {
    if (typeof node.text === 'string') {
      parent.appendChild(doc.createTextNode(node.text));
      return;
    }
    var tag = node.tag;
    var children = node.children || [];
    var index;
    if (tag === 'u' || tag === 'sup' || tag === 'sub') {
      var simple = doc.createElement(tag);
      for (index = 0; index < children.length; index += 1) renderNode(doc, simple, children[index]);
      parent.appendChild(simple);
      return;
    }
    if (tag === 'frac') {
      var split = takeAt(children, '/');
      var fraction = doc.createElement('span');
      if (!split.found) {
        fraction.className = 'cbt-frac cbt-frac-single';
        for (index = 0; index < children.length; index += 1) renderNode(doc, fraction, children[index]);
        parent.appendChild(fraction);
        return;
      }
      fraction.className = 'cbt-frac';
      var numerator = doc.createElement('span');
      numerator.className = 'cbt-frac-num';
      var denominator = doc.createElement('span');
      denominator.className = 'cbt-frac-den';
      for (index = 0; index < split.head.length; index += 1) renderNode(doc, numerator, split.head[index]);
      for (index = 0; index < split.tail.length; index += 1) renderNode(doc, denominator, split.tail[index]);
      fraction.appendChild(numerator);
      fraction.appendChild(denominator);
      parent.appendChild(fraction);
      return;
    }
    if (tag === 'sqrt') {
      var root = doc.createElement('span');
      root.className = 'cbt-sqrt';
      var sign = doc.createElement('span');
      sign.className = 'cbt-sqrt-sign';
      sign.setAttribute('aria-hidden', 'true');
      sign.textContent = '\u221a';
      var body = doc.createElement('span');
      body.className = 'cbt-sqrt-body';
      for (index = 0; index < children.length; index += 1) renderNode(doc, body, children[index]);
      root.appendChild(sign);
      root.appendChild(body);
      parent.appendChild(root);
      return;
    }
    if (tag === 'matrix') {
      var cells = matrixCells(children);
      var matrix = doc.createElement('span');
      if (!cells) {
        matrix.className = 'cbt-matrix cbt-matrix-single';
        for (index = 0; index < children.length; index += 1) renderNode(doc, matrix, children[index]);
        parent.appendChild(matrix);
        return;
      }
      matrix.className = 'cbt-matrix';
      var left = doc.createElement('span');
      left.className = 'cbt-matrix-bracket';
      left.setAttribute('aria-hidden', 'true');
      left.textContent = '[';
      var grid = doc.createElement('span');
      grid.className = 'cbt-matrix-grid';
      for (var cell = 0; cell < cells.length; cell += 1) {
        var cellElement = doc.createElement('span');
        cellElement.className = 'cbt-matrix-cell';
        for (index = 0; index < cells[cell].length; index += 1) renderNode(doc, cellElement, cells[cell][index]);
        grid.appendChild(cellElement);
      }
      var right = doc.createElement('span');
      right.className = 'cbt-matrix-bracket';
      right.setAttribute('aria-hidden', 'true');
      right.textContent = ']';
      matrix.appendChild(left);
      matrix.appendChild(grid);
      matrix.appendChild(right);
      parent.appendChild(matrix);
      return;
    }
    for (index = 0; index < children.length; index += 1) renderNode(doc, parent, children[index]);
  }

  function render(element, text) {
    if (!element) return element;
    var doc = element.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc) return element;
    element.textContent = '';
    var nodes = parse(text);
    for (var index = 0; index < nodes.length; index += 1) {
      renderNode(doc, element, nodes[index]);
    }
    return element;
  }

  // Plain text with every recognized marker removed, for list summaries.
  function strip(text) {
    return flatten(parse(text), false, []).map(function (part) {
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
