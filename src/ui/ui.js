function runOCRBookmarklet() {
  document.querySelectorAll('script[src*="ocr_helper.js"]').forEach(s => s.remove());
  const op1 = document.getElementById('ocr_input')?.closest('.admin-field');
  if (op1) op1.remove();
  const op2 = document.getElementById('ans_panel');
  if (op2) op2.remove();
  const form = document.querySelector('input[name=action][value=save_question]')?.form;
  const f = document.querySelector('input[name=correct_option]');
  if (!form || !f || location.search.includes('edit=')) {
    alert('Please open the "Add a New Question" page first.');
    return;
  }
  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  const $ = id => document.getElementById(id);
  const L = localStorage;
  const store = {
    get: k => JSON.parse(L.getItem(k) || 'null'),
    set: (k, v) => L.setItem(k, JSON.stringify(v)),
    del: k => L.removeItem(k)
  };
  const p = document.createElement('div');
  p.className = 'admin-field';
  p.innerHTML = `<div id="ocr_input"><label for="ocr_text">Paste the WHOLE block: questions + answer key (one box)</label><textarea id="ocr_text" style="width:100%;min-height:220px"></textarea><button type="button" class="admin-btn" id="ocr_load">Load questions + key</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button><div class="admin-note">Recommended divider on its own line: <code>=== ANSWER KEY ===</code>. Varying headers are auto-detected otherwise. To fix the key mid-queue: Show paste box, paste ONLY the key, Load (queue is kept).</div></div><div id="ocr_status" class="admin-note"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_show" style="margin-left:8px">Show paste box</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear saved key</button><div id="ans_msg" class="admin-note"></div>`;
  form.before(p);
  const sb = form.querySelector('button[type=submit]');
  if (sb) {
    const r = document.createElement('div');
    r.id = 'ans_res';
    r.className = 'admin-note';
    r.style.fontWeight = 'bold';
    r.style.color = '#1769aa';
    r.style.marginTop = '12px';
    sb.insertAdjacentElement('afterend', r);
  }
  const saveMeta = () => store.set('ocrMeta', Object.fromEntries(FIELDS.map(id => [id, $(id).value])));
  function applyHeaderInfo(text) {
    const { year, header } = parseHeader(text);
    if (year) $('exam_year').value = year;
    const select = $('subject_id');
    const idx = pickSubjectIndex(header, Array.from(select.options).map(o => o.text));
    if (idx >= 0) select.options[idx].selected = true;
  }
  function fillForm(q) {
    Object.entries(store.get('ocrMeta') || {}).forEach(([id, v]) => ($(id).value = v));
    $('question_text').value = q.question;
    const keyAnswer = key[q.num];
    let finalA = q.a || '';
    let finalB = q.b || '';
    let finalC = q.c || '';
    let finalD = q.d || '';
    let correctIndex = -1;
    if (keyAnswer && ['A', 'B', 'C', 'D', 'E', 'F'].includes(keyAnswer)) {
      if (keyAnswer === 'E' || keyAnswer === 'F') {
        const extra = keyAnswer === 'E' ? q.e : q.f;
        if (extra) {
          finalD = extra;
          correctIndex = 3;
        }
      } else {
        correctIndex = 'ABCD'.indexOf(keyAnswer);
      }
    } else {
      if (q.e) finalD += (finalD ? '\n\n' : '') + 'E. ' + q.e;
      if (q.f) finalD += (finalD ? '\n\n' : '') + 'F. ' + q.f;
    }
    $('option_a').value = finalA;
    $('option_b').value = finalB;
    $('option_c').value = finalC;
    $('option_d').value = finalD;
    form.querySelectorAll('[name=correct_option]').forEach(r => (r.checked = false));
    if (correctIndex >= 0) {
      const radio = form.querySelector(`input[name="correct_option"][value="${correctIndex}"]`);
      if (radio) radio.checked = true;
    }
  }
  let queue = store.get('ocrQueue') || { items: [], i: 0 };
  const saveQ = () => store.set('ocrQueue', queue);
  function renderOCR() {
    const q = queue.items[queue.i];
    const active = queue.items.length > 0;
    $('ocr_input').hidden = q !== undefined;
    $('ocr_skip').hidden = !q;
    $('ocr_reset').hidden = !active;
    $('ocr_status').innerHTML = !active ? '' : !q ? `All ${queue.items.length} questions done.` : `Question ${queue.i + 1} of ${queue.items.length} (book number ${q.num ?? '?'})` + (q.flags.length ? `<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>` : '');
  }
  function showOCR() {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
    renderOCR();
  }
  $('ocr_load').onclick = () => {
    const raw = $('ocr_text').value;
    const parts = splitSections(raw);
    const text = FIXES.reduce((t, [re, fix]) => t.replace(re, fix), parts.questions);
    const items = splitQuestions(text).map(parseQuestion);
    const newKey = parts.answers.trim() ? parseKey(parts.answers) : {};
    const hasKey = Object.keys(newKey).length > 0;
    if (!items.length) {
      if (hasKey) {
        key = newKey;
        store.set('ansKey', key);
        if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
        tick(true);
        $('ans_msg').textContent += ' (' + Object.keys(key).length + ' answers in key.)';
        renderOCR();
        $('ocr_status').innerHTML += ' Answer key only (' + Object.keys(key).length + ' entries, ' + parts.how + '). Question queue left unchanged.';
        return;
      }
      return alert('No questions found in that text.');
    }
    applyHeaderInfo(text);
    saveMeta();
    key = hasKey ? newKey : {};
    if (hasKey) store.set('ansKey', key);
    else store.del('ansKey');
    queue = { items, i: 0 };
    saveQ();
    showOCR();
    if (hasKey) {
      tick();
      $('ans_msg').textContent += ' (' + Object.keys(key).length + ' answers in key.)';
      $('ocr_status').innerHTML += ' Answer key: ' + Object.keys(key).length + ' entries (' + parts.how + ').';
    } else {
      $('ans_msg').textContent = 'No answer key section detected. Any earlier key was cleared.';
      $('ocr_status').innerHTML += '<div class="admin-note">No answer-key section detected. Questions loaded with no key. Add a divider like <code>=== ANSWER KEY ===</code> on its own line if the key was missed.</div>';
    }
  };
  $('ocr_clear_text').onclick = () => { $('ocr_text').value = ''; };
  $('ocr_skip').onclick = () => { queue.i++; saveQ(); showOCR(); };
  $('ocr_reset').onclick = () => {
    queue = { items: [], i: 0 };
    saveQ();
    $('ocr_input').hidden = false;
    renderOCR();
  };
  $('ocr_show').onclick = () => { $('ocr_input').hidden = false; $('ocr_text').focus(); };
  let key = {};
  try { key = store.get('ansKey') || {}; } catch (e) {}
  function cur() {
    try {
      const q = store.get('ocrQueue');
      return q && q.items && q.items[q.i] ? { i: q.i, n: q.items[q.i].num, q: q.items[q.i] } : { i: -1, n: null };
    } catch (e) {
      return { i: -1, n: null };
    }
  }
  function tick(ask) {
    const m = $('ans_msg');
    if (!Object.keys(key).length) {
      m.textContent = 'No key saved yet.';
      return;
    }
    const c = cur();
    let n = c.n;
    if (n == null && ask && c.i < 0) {
      n = parseInt(prompt('Book question number?'), 10);
    }
    if (!n) {
      m.textContent = 'No question number. Pick the answer yourself.';
      return;
    }
    const a = key[n];
    if (!a) {
      m.textContent = 'No answer for number ' + n + ' in the key. Pick it yourself.';
      return;
    }
    let idx = 'ABCD'.indexOf(a), note = '';
    if (idx < 0) {
      if (!(c.q && c.q[a.toLowerCase()])) {
        m.textContent = 'Key says ' + a + ' for number ' + n + ', but no Option ' + a + ' text is loaded. Pick the answer yourself.';
        return;
      }
      idx = 3;
      note = ' (Option ' + a + ' was placed in Option D)';
    }
    const radio = document.querySelector(`input[name="correct_option"][value="${idx}"]`);
    if (radio) radio.checked = true;
    m.textContent = 'Question ' + n + ': ticked Option ' + 'ABCD'[idx] + ' from the answer key' + note + '. Check it before saving.';
  }
  $('ans_clear').onclick = () => {
    key = {};
    store.del('ansKey');
    $('ans_msg').textContent = 'Key cleared.';
  };
  let last = cur().i;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!queue.items.length) saveMeta();
    const b = form.querySelector('button[type=submit]'), r = $('ans_res');
    let s;
    b.disabled = true;
    r.textContent = 'Saving...';
    fetch(location.href, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })
      .then(x => { s = x.status; return x.text(); })
      .then(t => {
        const m = t.match(/Question saved successfully \(Question ID: (\d+)\)/);
        if (m) {
          r.textContent = 'Saved as question #' + m[1] + '.';
          const q = cur();
          if (q.i > -1) {
            const meta = {};
            FIELDS.forEach(n => meta[n] = form.elements[n].value);
            store.set('ocrMeta', meta);
          }
          ['question_image', 'answer_video'].forEach(n => {
            const el = form.elements[n];
            if (el) el.value = '';
          });
          const ae = form.elements.answer_explanation;
          if (ae) ae.value = '';
          if (q.i > -1) {
            $('ocr_skip').click();
          }
          last = cur().i;
          if (last > -1) {
            tick();
          } else {
            form.reset();
          }
        } else {
          const d = new DOMParser().parseFromString(t, 'text/html'), er = d.querySelector('.admin-error');
          r.textContent = 'NOT saved: ' + (t.indexOf('Administrator Login') > -1 ? 'you were logged out. Reload the page and log in.' : er ? er.textContent.trim() : 'unexpected reply from the server (code ' + s + ').');
        }
      })
      .catch(() => { r.textContent = 'NOT saved: network problem. Try again.'; })
      .then(() => { b.disabled = false; });
  }, true);
  setInterval(() => {
    const c = cur().i;
    if (c !== last) {
      last = c;
      tick();
    }
  }, 600);
  const failed = document.querySelector('.admin-error');
  if (store.get('ocrSubmitted')) {
    store.del('ocrSubmitted');
    if (!failed) {
      queue.i++;
      saveQ();
    }
  }
  failed ? renderOCR() : showOCR();
  tick();
}
