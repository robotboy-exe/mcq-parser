(function () {
  'use strict';

  var MARKER = /<\/?u>/g;

  function markerRanges(value) {
    var ranges = [];
    var match;
    MARKER.lastIndex = 0;
    while ((match = MARKER.exec(value)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length, tag: match[0] });
    }
    return ranges;
  }

  function depthBefore(ranges, position) {
    var depth = 0;
    for (var i = 0; i < ranges.length; i += 1) {
      if (ranges[i].start >= position) {
        break;
      }
      depth += ranges[i].tag === '<u>' ? 1 : -1;
    }
    return depth;
  }

  function wrapSelection(value, start, end) {
    start = Math.max(0, Math.min(start, value.length));
    end = Math.max(start, Math.min(end, value.length));

    var selected = value.slice(start, end);
    var before = value.slice(0, start);
    var after = value.slice(end);
    var ranges = markerRanges(value);

    if (before.slice(-3) === '<u>' && after.slice(0, 4) === '</u>') {
      return {
        value: before.slice(0, -3) + selected + after.slice(4),
        start: start - 3,
        end: end - 3,
        changed: true,
        action: 'unwrap'
      };
    }

    for (var i = 0; i < ranges.length; i += 1) {
      var marker = ranges[i];
      var splitsBoundary = (marker.start < start && start < marker.end)
        || (marker.start < end && end < marker.end);
      var insideSelection = marker.start >= start && marker.end <= end;
      if (splitsBoundary || insideSelection) {
        return { value: value, start: start, end: end, changed: false, action: 'refuse' };
      }
    }

    if (depthBefore(ranges, start) > 0 && depthBefore(ranges, end) > 0) {
      return { value: value, start: start, end: end, changed: false, action: 'refuse' };
    }

    return {
      value: before + '<u>' + selected + '</u>' + after,
      start: start + 3,
      end: end + 3,
      changed: true,
      action: 'wrap'
    };
  }

  function toggle(textarea) {
    if (!textarea) {
      return false;
    }
    var result = wrapSelection(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    if (!result.changed) {
      return false;
    }
    textarea.value = result.value;
    textarea.setSelectionRange(result.start, result.end);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    return true;
  }

  function init() {
    var question = document.getElementById('question_text');
    var label = document.querySelector('label[for="question_text"]');
    if (!question || !label) {
      return;
    }

    var ids = ['constant_text', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d'];
    var fields = [];
    var lastFocused = question;
    for (var i = 0; i < ids.length; i += 1) {
      var field = document.getElementById(ids[i]);
      if (!field) {
        continue;
      }
      fields.push(field);
      field.addEventListener('focus', function (event) {
        lastFocused = event.currentTarget;
      });
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'owner_tool_underline';
    button.textContent = 'Underline';
    button.title = 'Wrap the selected text in <u>...</u>';
    button.style.cssText = 'margin-left:8px;border:1px solid #d5dfe9;border-radius:7px;'
      + 'background:#fff;color:#1769aa;font:inherit;font-weight:700;padding:5px 10px;cursor:pointer';
    button.addEventListener('mousedown', function (event) {
      event.preventDefault();
    });
    button.addEventListener('click', function () {
      toggle(lastFocused);
    });
    label.insertAdjacentElement('afterend', button);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { wrapSelection: wrapSelection };
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
