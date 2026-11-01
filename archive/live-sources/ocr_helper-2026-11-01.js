(function () {
  const form = document.querySelector('input[name=action][value=save_question]')?.form;
  if (!form || location.search.includes('edit=')) return;

  // OCR misspellings to correct: [pattern, replacement]. Add one line per repeated mistake.
  const FIXES = [
    [/govemment/gi, 'government'],
    [/persidential/gi, 'presidential'],
    [/resposible/gi, 'responsible'],
  ];
  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  const OPTION = /(?<![A-Z])([A-D])\s*\.\s*/g;

  const $ = (id) => document.getElementById(id);
  const store = {
    get: (k) => JSON.parse(localStorage.getItem(k) || 'null'),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    del: (k) => localStorage.removeItem(k),
  };
  const saveMeta = () => store.set('ocrMeta', Object.fromEntries(FIELDS.map((id) => [id, $(id).value])));

  function splitQuestions(text) {
    const marks = [];
    let last = 0;
    for (const m of text.matchAll(/(?<!\d)(\d{1,3})\s*\.\s*(?=["“‘'(]?[A-Z]|["“‘'(]?\.{2,})/g)) {
      const n = +m[1];
      if (last && (n <= last || n > last + 5)) continue;
      marks.push({ n, start: m.index, end: m.index + m[0].length });
      last = n;
    }
    const chunks = marks.map((m, i) => ({ num: m.n, text: text.slice(m.end, marks[i + 1]?.start) }));
    const head = text.slice(0, marks[0]?.start ?? text.length);
    if (head.search(OPTION) >= 0 && !/(?:IMPROVISED|STRUCTURED).*C\.?\s*R\.?\s*K/i.test(head)) {
      chunks.unshift({ num: null, text: head });
    }
    return chunks;
  }

  function parseQuestion({ num, text }) {
    text = text.replace(/\s+/g, ' ');
    const pos = {}, count = {};
    for (const m of text.matchAll(OPTION)) {
      pos[m[1]] = { start: m.index, end: m.index + m[0].length };
      count[m[1]] = (count[m[1]] || 0) + 1;
    }
    const marks = Object.entries(pos).sort((a, b) => a[1].start - b[1].start);
    const q = { num, question: text.slice(0, marks[0]?.[1].start ?? text.length).trim(), a: '', b: '', c: '', d: '', flags: [] };
    marks.forEach(([letter, p], i) => (q[letter.toLowerCase()] = text.slice(p.end, marks[i + 1]?.[1].start).trim()));

    if (num === null) q.flags.push('question number missing');
    if (q.question.length < 10) q.flags.push('question text missing or very short');
    for (const l of 'abcd') {
      if (!q[l]) q.flags.push(`option ${l.toUpperCase()} missing`);
      if (q[l].length > 500) q.flags.push(`option ${l.toUpperCase()} over 500 characters`);
    }
    if (Object.values(count).some((c) => c > 1)) q.flags.push('a letter appears twice (merged questions?)');
    return q;
  }

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
    const text = FIXES.reduce((t, [re, fix]) => t.replace(re, fix), $('ocr_text').value);
    const items = splitQuestions(text).map(parseQuestion);
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
