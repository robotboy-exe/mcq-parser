(function () {
  const core = typeof window !== 'undefined' ? window.OCRParser : null;
  if (!core || typeof core.parsePaste !== 'function') {
    alert('Answer-key bookmarklet: src/parser/core.js is not loaded on this page.');
    return;
  }

  const questionField = document.getElementById('question_text');
  const form = questionField ? questionField.form : null;
  if (!form) {
    alert('Answer-key bookmarklet: the question form is not on this page.');
    return;
  }

  const LETTERS = 'ABCD';
  const state = { items: [], key: {}, how: 'none', warnings: [], i: 0 };

  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000;width:430px;max-width:92vw;background:#fff;border:1px solid #b9c2cc;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);font:13px/1.45 system-ui,sans-serif;color:#1f2933';
  panel.innerHTML = [
    '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #e3e8ee">',
    '<strong style="flex:1">Answer-key bookmarklet</strong>',
    '<button type="button" data-kb="close" aria-label="Close" style="border:0;background:transparent;font-size:18px;line-height:1;cursor:pointer">&#215;</button>',
    '</div>',
    '<div style="padding:12px">',
    '<textarea data-kb="text" placeholder="Paste the OCR text here, questions and answer key." style="width:100%;height:120px;box-sizing:border-box;font:12px/1.4 ui-monospace,monospace;border:1px solid #c9d2dc;border-radius:6px;padding:8px"></textarea>',
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">',
    '<button type="button" data-kb="load" style="padding:6px 12px;border:0;border-radius:6px;background:#1769aa;color:#fff;cursor:pointer">Load with key</button>',
    '<button type="button" data-kb="prev" style="padding:6px 12px;border:1px solid #c9d2dc;border-radius:6px;background:#fff;cursor:pointer">Previous</button>',
    '<button type="button" data-kb="next" style="padding:6px 12px;border:1px solid #c9d2dc;border-radius:6px;background:#fff;cursor:pointer">Next</button>',
    '</div>',
    '<div data-kb="status" style="margin-top:10px;color:#52616f;min-height:18px"></div>',
    '</div>'
  ].join('');
  document.body.appendChild(panel);

  const el = (name) => panel.querySelector('[data-kb="' + name + '"]');

  function setStatus(text) {
    el('status').textContent = text;
  }

  function keyFor(num) {
    if (num == null) return '';
    const letter = state.key[num];
    return typeof letter === 'string' ? letter : '';
  }

  function tick(letter) {
    const index = LETTERS.indexOf(letter);
    const radios = form.querySelectorAll('input[name=correct_option]');
    for (const radio of radios) radio.checked = Number(radio.value) === index;
  }

  function show() {
    const q = state.items[state.i];
    if (!q) {
      setStatus('No more questions in this paste.');
      return;
    }
    questionField.value = q.question || '';
    for (const letter of 'abcd') {
      const field = document.getElementById('option_' + letter);
      if (field) field.value = q[letter] || '';
    }
    const letter = keyFor(q.num);
    tick(letter);
    let line = 'Question ' + (state.i + 1) + ' of ' + state.items.length
      + ' (book number ' + (q.num == null ? '?' : q.num) + ')';
    line += letter ? ' - key ' + letter + ', ticked.' : ' - no key entry.';
    if (state.warnings.length) line += ' ' + state.warnings.slice(0, 2).join(' ');
    setStatus(line);
  }

  function load() {
    const raw = el('text').value;
    if (!raw.trim()) return alert('Paste the OCR text first.');
    const parsed = core.parsePaste(raw);
    state.items = parsed.items || [];
    state.key = parsed.key || {};
    state.how = (parsed.sectionEvidence && parsed.sectionEvidence.how) || 'none';
    state.warnings = parsed.warnings || [];
    state.i = 0;
    const answers = Object.keys(state.key).length;
    if (!state.items.length) {
      if (answers) {
        setStatus('Answer key only: ' + answers + ' answers (' + state.how + '). The form was not changed.');
        return;
      }
      return alert('No questions or answer key found in that text.');
    }
    show();
    setStatus('Loaded ' + state.items.length + ' questions and ' + answers + ' answers ('
      + state.how + '). ' + el('status').textContent);
  }

  el('load').onclick = load;
  el('prev').onclick = () => {
    if (state.i > 0) {
      state.i--;
      show();
    }
  };
  el('next').onclick = () => {
    if (state.i < state.items.length - 1) {
      state.i++;
      show();
    }
  };
  el('close').onclick = () => panel.remove();
})();
