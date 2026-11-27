(function () {
  // Production adapter over the canonical parser core in src/parser/core.js.
  // The admin page loads the core first; Node tests resolve it through require.
  const EXPECTED_CORE_VERSION = '2.5.9';
  const isNode = typeof module !== 'undefined' && module.exports && typeof require === 'function';
  const core = isNode
    ? require('./src/parser/core.js')
    : (typeof window !== 'undefined' ? window.OCRParser : null);

  const FIXES = core ? core.FIXES : null;
  const OPTION = core ? core.OPTION : null;
  const splitQuestions = core ? core.splitQuestions : null;
  const splitRegions = core ? core.splitRegions : null;
  const parseQuestion = core ? core.parseQuestion : null;

  function applyFixes(text) {
    return FIXES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  }

  function parseAll(text) {
    return splitQuestions(applyFixes(String(text == null ? '' : text))).map(parseQuestion);
  }

  if (isNode) {
    module.exports = { FIXES, OPTION, splitQuestions, splitRegions, parseQuestion, parseAll };
    return;
  }

  function coreProblem() {
    if (!core) return 'src/parser/core.js did not load, so window.OCRParser is missing';
    if (core.version !== EXPECTED_CORE_VERSION) {
      return 'src/parser/core.js reports version ' + core.version + ' but this helper needs ' + EXPECTED_CORE_VERSION;
    }
    return null;
  }

  const form = document.querySelector('input[name=action][value=save_question]')?.form;
  const problem = coreProblem();
  if (problem) {
    const message = 'OCR helper disabled: ' + problem;
    if (typeof console !== 'undefined' && console.error) console.error(message);
    if (form && !location.search.includes('edit=')) {
      const banner = document.createElement('div');
      banner.className = 'admin-field admin-alert admin-error';
      banner.id = 'ocr_error';
      banner.textContent = message + '. Reload the page; if this persists, src/parser/core.js was not deployed.';
      form.before(banner);
      throw new Error(message);
    }
    return;
  }

  if (!form || location.search.includes('edit=')) return;

  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];

  const $ = (id) => document.getElementById(id);
  const store = {
    get: (k) => JSON.parse(localStorage.getItem(k) || 'null'),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    del: (k) => localStorage.removeItem(k),
  };
  const saveMeta = () => store.set('ocrMeta', Object.fromEntries(FIELDS.map((id) => [id, $(id).value])));

  function fillForm(q) {
    Object.entries(store.get('ocrMeta') || {}).forEach(([id, v]) => ($(id).value = v));
    $('question_text').value = q.question;
    for (const l of 'abcd') $('option_' + l).value = q[l];
    form.querySelectorAll('[name=correct_option]').forEach((r) => (r.checked = false));
  }

  const panel = document.createElement('div');
  panel.className = 'admin-field';
  panel.innerHTML = `
    <div id="ocr_input">
      <label for="ocr_text">Paste OCR text (optional)</label>
      <textarea id="ocr_text"></textarea>
      <button type="button" class="admin-btn" id="ocr_load">Load questions</button>
    </div>
    <div id="ocr_status" class="admin-note"></div>
    <button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button>
    <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear">Clear list</button>`;
  form.before(panel);

  let queue = store.get('ocrQueue') || { items: [], i: 0 };
  const save = () => store.set('ocrQueue', queue);

  function render() {
    const q = queue.items[queue.i];
    const active = queue.items.length > 0;
    $('ocr_input').hidden = q !== undefined;
    $('ocr_skip').hidden = !q;
    $('ocr_clear').hidden = !active;
    $('ocr_status').innerHTML = !active ? '' : !q ? `All ${queue.items.length} questions done.`
      : `Question ${queue.i + 1} of ${queue.items.length} (book number ${q.num ?? '?'})` +
        (q.flags.length ? `<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>` : '');
  }

  function show() {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
    render();
  }

  $('ocr_load').onclick = () => {
    const items = parseAll($('ocr_text').value);
    if (!items.length) return alert('No questions found in that text.');
    saveMeta();
    queue = { items, i: 0 };
    save();
    show();
  };
  $('ocr_skip').onclick = () => { queue.i++; save(); show(); };
  $('ocr_clear').onclick = () => { queue = { items: [], i: 0 }; save(); render(); };

  form.addEventListener('submit', () => {
    if (!queue.items.length) return;
    saveMeta();
    store.set('ocrSubmitted', true);
  });

  const failed = document.querySelector('.admin-error');
  if (store.get('ocrSubmitted')) {
    store.del('ocrSubmitted');
    if (!failed) { queue.i++; save(); }
  }
  failed ? render() : show();
})();
