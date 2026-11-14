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

  function appendTextElement(document, parent, tagName, className, text) {
    var element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function init(root) {
    var document = root.document;
    if (document.getElementById('owner_tool_preview_panel')) {
      return null;
    }

    var action = document.querySelector('input[name=action][value=save_question]')
      || document.querySelector('input[name=action][value=update_question]');
    var form = action && action.form;
    var constantText = document.getElementById('constant_text');
    var questionText = document.getElementById('question_text');
    var textApi = root.CBTText;
    if (!form || !questionText || !questionText.parentNode || !textApi || typeof textApi.render !== 'function') {
      return null;
    }

    var panel = document.createElement('section');
    panel.id = 'owner_tool_preview_panel';
    panel.className = 'owner-tool-preview-wrap';
    panel.setAttribute('aria-labelledby', 'owner_tool_preview_heading');

    var heading = appendTextElement(document, panel, 'span', 'owner-tool-preview-heading', 'What students will see');
    heading.id = 'owner_tool_preview_heading';

    var constantBlock = document.createElement('div');
    constantBlock.className = 'owner-tool-preview-block owner-tool-preview-constant';
    appendTextElement(document, constantBlock, 'span', 'owner-tool-preview-label', 'Constant Text');
    var constantPreview = appendTextElement(document, constantBlock, 'div', 'owner-tool-preview', '');
    constantPreview.id = 'owner_tool_constant_preview';
    panel.appendChild(constantBlock);

    var questionBlock = document.createElement('div');
    questionBlock.className = 'owner-tool-preview-block';
    appendTextElement(document, questionBlock, 'span', 'owner-tool-preview-label', 'Question');
    var questionPreview = appendTextElement(document, questionBlock, 'div', 'owner-tool-preview', '');
    questionPreview.id = 'owner_tool_preview';
    panel.appendChild(questionBlock);

    if (questionText.nextSibling) {
      questionText.parentNode.insertBefore(panel, questionText.nextSibling);
    } else {
      questionText.parentNode.appendChild(panel);
    }

    function update() {
      var constantValue = constantText ? String(constantText.value || '') : '';
      constantBlock.hidden = constantValue.trim() === '';
      textApi.render(constantPreview, constantValue);
      textApi.render(questionPreview, String(questionText.value || ''));
    }

    if (constantText) {
      constantText.addEventListener('input', update);
      constantText.addEventListener('change', update);
    }
    questionText.addEventListener('input', update);
    questionText.addEventListener('change', update);
    form.addEventListener('reset', function () {
      root.setTimeout(update, 0);
    });

    ['ocr_load', 'ocr_skip', 'ocr_clear'].forEach(function (id) {
      var button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', function () {
          root.setTimeout(update, 0);
        });
      }
    });

    update();
    return { panel: panel, update: update };
  }

  return { init: init };
});
