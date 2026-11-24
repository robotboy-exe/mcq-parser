(function () {
  // Production adapter over the canonical parser core in src/parser/core.js.
  // The admin page loads the core first; Node tests resolve it through require.
  const EXPECTED_CORE_VERSION = '2.5.4';
  const isNode = typeof module !== 'undefined' && module.exports && typeof require === 'function';
  const core = isNode
    ? require('./src/parser/core.js')
    : (typeof window !== 'undefined' ? window.OCRParser : null);

  const FIXES = core ? core.FIXES : null;
  const OPTION = core ? core.OPTION : null;
  const splitQuestions = core ? core.splitQuestions : null;
  const splitRegions = core ? core.splitRegions : null;
  const parseQuestion = core ? core.parseQuestion : null;
  const parsePaste = core ? core.parsePaste : null;

  function applyFixes(text) {
    return FIXES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  }

  function parseAll(text) {
    return splitQuestions(applyFixes(String(text == null ? '' : text))).map(parseQuestion);
  }

  if (isNode) {
    module.exports = {
      FIXES, OPTION, splitQuestions, splitRegions, parseQuestion, parsePaste, parseAll
    };
    return;
  }

  function coreProblem() {
    if (!core) return 'src/parser/core.js did not load, so window.OCRParser is missing';
    if (core.version !== EXPECTED_CORE_VERSION) {
      return 'src/parser/core.js reports version ' + core.version + ' but this helper needs ' + EXPECTED_CORE_VERSION;
    }
    if (typeof core.parsePaste !== 'function') {
      return 'src/parser/core.js has no parsePaste export, so the answer key cannot be split';
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

  // boot.js sets this flag only inside the bundled bookmarklet, so the panel
  // shows a different title there than on the page's own helper.
  const bundled = typeof window !== 'undefined' && window.__ocrBookmarklet === true;

  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  const LETTERS = 'ABCD';

  const $ = (id) => document.getElementById(id);
  const store = {
    get: (k) => JSON.parse(localStorage.getItem(k) || 'null'),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    del: (k) => localStorage.removeItem(k),
  };
  const saveMeta = () => store.set('ocrMeta', Object.fromEntries(FIELDS.map((id) => [id, $(id).value])));

  // The admin form reloads after every save. The paste is per-tab working
  // state, so it lives in sessionStorage instead of the shared queue.
  const paste = {
    get: () => { try { return sessionStorage.getItem('ocrPaste'); } catch (e) { return null; } },
    set: (value) => { try { sessionStorage.setItem('ocrPaste', value); } catch (e) { /* private mode */ } },
    del: () => { try { sessionStorage.removeItem('ocrPaste'); } catch (e) { /* private mode */ } },
  };

  const panel = document.createElement('div');
  panel.className = 'admin-field';
  panel.innerHTML = `
    <h3 id="ocr_title" style="margin:0 0 8px">OCR paste</h3>
    <div id="ocr_input">
      <label for="ocr_text">Paste OCR text (optional)</label>
      <textarea id="ocr_text"></textarea>
      <button type="button" class="admin-btn" id="ocr_load">Load questions</button>
    </div>
    <button type="button" class="admin-btn admin-btn-muted" id="ocr_auto">Start autosave</button>
    <div id="ocr_progress_wrap" hidden>
      <progress id="ocr_progress" max="1" value="0" style="width:100%;height:10px"></progress>
      <div id="ocr_progress_label" class="admin-note"></div>
    </div>
    <div id="ocr_status" class="admin-note"></div>
    <button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button>
    <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear">Clear list</button>`;
  form.before(panel);
  if (bundled) $('ocr_title').textContent = 'Bookmarklet paste';

  let queue = store.get('ocrQueue') || { items: [], i: 0 };
  // ansKey is the only place the answer key lives, so any tool that clears it
  // clears the key. An older build kept a second copy inside the queue; drop
  // that leftover so a stale copy cannot outlive ansKey.
  if (Object.prototype.hasOwnProperty.call(queue, 'key')) {
    delete queue.key;
    store.set('ocrQueue', queue);
  }
  let key = store.get('ansKey');
  if (!key || typeof key !== 'object') key = {};
  const save = () => store.set('ocrQueue', queue);
  let auto = null;
  let autoTimer = null;
  // A stopped run may leave a save unanswered; keep it so a restart attaches to
  // that request instead of posting the same question again.
  let pendingSave = null;
  // Incremented whenever a run is replaced, so a late POST result from an older
  // run is ignored instead of advancing this queue.
  let autoRun = 0;

  const savedPaste = paste.get();
  if (typeof savedPaste === 'string') $('ocr_text').value = savedPaste;

  function keyOf(q) {
    if (!q || q.num == null) return '';
    const letter = key[q.num];
    return typeof letter === 'string' ? letter.toUpperCase() : '';
  }

  function dryRunProblems() {
    const problems = [];
    if (!queue.items.length) return ['no questions loaded'];
    const missingMeta = FIELDS.filter((id) => !String($(id).value || '').trim());
    if (missingMeta.length) problems.push('choose ' + missingMeta.join(', '));
    let blank = 0;
    let noKey = 0;
    let badKey = 0;
    for (const q of queue.items) {
      if (!String(q.question || '').trim() || ['a', 'b', 'c', 'd'].some((l) => !String(q[l] || '').trim())) blank++;
      const letter = keyOf(q);
      if (!letter) noKey++;
      else if (LETTERS.indexOf(letter) === -1) badKey++;
    }
    if (blank) problems.push(blank + ' question(s) with a blank stem or option');
    if (noKey) problems.push(noKey + ' question(s) without an answer key');
    if (badKey) problems.push(badKey + ' question(s) with an unusable key letter');
    return problems;
  }

  function renderProgress() {
    const wrap = $('ocr_progress_wrap');
    const bar = $('ocr_progress');
    const label = $('ocr_progress_label');
    const total = queue.items.length;
    wrap.hidden = !auto || !total;
    $('ocr_auto').textContent = auto && auto.running ? 'Stop autosave' : 'Start autosave';
    if (!auto || !total) return;
    bar.max = total;
    bar.value = Math.min(queue.i, total);
    let text = queue.i + ' of ' + total + ' saved';
    if (auto.running) text += ' &middot; saving question ' + Math.min(queue.i + 1, total) + '...';
    else if (queue.i >= total) text += ' &middot; autosave complete';
    else if (auto.ready) text += ' &middot; dry run OK';
    else text += ' &middot; dry run incomplete';
    label.innerHTML = text;
  }

  function stopAuto(message) {
    if (!auto) {
      if (message) $('ocr_status').innerHTML = message;
      return;
    }
    auto.running = false;
    // The POST may already have been committed on the server, so stopping does
    // not abort it: its answer is the only evidence of whether the question
    // saved. Stop is still immediate; the answer only settles the queue entry.
    const waiting = auto.inFlight;
    if (waiting) {
      pendingSave = { index: queue.i, request: auto.request };
      auto.inFlight = false;
      auto.request = null;
    }
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    render();
    if (message) $('ocr_status').innerHTML = message + (waiting ? ' Checking whether that save went through.' : '');
  }

  function saveError(html) {
    const match = String(html || '').match(/<([a-z]+)[^>]*class="[^"]*admin-error[^"]*"[^>]*>([\s\S]*?)<\/\1>/i);
    return match ? match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  }

  function postSave() {
    return fetch(location.href, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })
      .then((response) => response.text())
      .then((html) => ({ html, saved: /Question saved successfully \(Question ID: \d+\)/.test(html) }))
      .catch(() => ({ failed: true }));
  }

  function autoStep() {
    if (!auto || !auto.running) return;
    if (queue.i >= queue.items.length) {
      stopAuto('Autosave complete: ' + queue.items.length + ' of ' + queue.items.length + ' saved.');
      return;
    }
    show();
    saveMeta();
    if (typeof fetch !== 'function' || typeof FormData !== 'function') {
      return stopAuto('Autosave needs a browser with fetch; save this question by hand.');
    }
    const run = autoRun;
    // Reuse an unanswered save for this same question from a stopped run.
    const request = pendingSave && pendingSave.index === queue.i ? pendingSave.request : postSave();
    pendingSave = null;
    auto.inFlight = true;
    auto.request = request;
    renderProgress();
    request.then((result) => {
      if (!auto || run !== autoRun) return;
      auto.inFlight = false;
      auto.request = null;
      const number = queue.i + 1;
      if (result.saved) {
        queue.i++;
        save();
      }
      if (!auto.running) {
        render();
        // The stopped message replaces the generic line, not follows it, so the
        // late answer reads as the stop result rather than a stray sentence.
        $('ocr_status').innerHTML = result.failed
          ? 'Autosave stopped at question ' + number + ': the save did not confirm. It stays queued.'
          : result.saved
            ? 'Autosave stopped at question ' + number + ': it had already saved, so it is marked done and will not be sent again.'
            : 'Autosave stopped at question ' + number + ': '
              + (saveError(result.html) || 'the server did not confirm the save') + '. It stays queued.';
        return;
      }
      if (result.failed) {
        return stopAuto('Autosave stopped at question ' + number + ': network problem. Check the question and start again.');
      }
      if (!result.saved) {
        return stopAuto('Autosave stopped at question ' + number + ': '
          + (saveError(result.html) || 'the server did not confirm the save (logged out?)')
          + '. Fix it, then start again.');
      }
      if (queue.i >= queue.items.length) {
        auto.running = false;
        show();
        $('ocr_status').innerHTML = 'Autosave complete: ' + queue.items.length + ' of ' + queue.items.length + ' saved.';
        return;
      }
      renderProgress();
      autoTimer = setTimeout(autoStep, 600);
    });
  }

  let savingInPlace = false;

  function saveInPlace(event) {
    if (event) {
      if (event.preventDefault) event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
    if (savingInPlace) return;
    if (auto && auto.running) {
      $('ocr_status').innerHTML = 'Autosave is running. Stop it before saving by hand.';
      return;
    }
    if (!queue.items.length) return;
    if (queue.i >= queue.items.length) {
      $('ocr_status').innerHTML = 'Every question in this list is already saved.';
      return;
    }
    if (typeof fetch !== 'function' || typeof FormData !== 'function') {
      $('ocr_status').innerHTML = 'This browser cannot save without a page reload; save the question by hand.';
      return;
    }
    saveMeta();
    savingInPlace = true;
    // The page helper may have already handled this submit before us, so drop
    // its reload marker; the queue advances here and must not advance again on
    // the next page load.
    store.del('ocrSubmitted');
    const total = queue.items.length;
    const number = queue.i + 1;
    $('ocr_status').innerHTML = 'Saving question ' + number + ' of ' + total + '...';
    postSave().then((result) => {
      savingInPlace = false;
      store.del('ocrSubmitted');
      if (result.saved) {
        queue.i++;
        save();
        show();
        $('ocr_status').innerHTML = 'Saved question ' + number + ' of ' + total + ' using its answer key.';
        return;
      }
      render();
      $('ocr_status').innerHTML = 'Question ' + number + ' was not saved: '
        + (result.failed ? 'network problem' : (saveError(result.html) || 'the server did not confirm the save'))
        + '. It stays queued.';
    });
  }

  function fillForm(q) {
    Object.entries(store.get('ocrMeta') || {}).forEach(([id, v]) => ($(id).value = v));
    $('question_text').value = q.question;
    for (const l of 'abcd') $('option_' + l).value = q[l];
    const letter = keyOf(q);
    const index = letter ? LETTERS.indexOf(letter) : -1;
    form.querySelectorAll('[name=correct_option]').forEach((r) => (r.checked = Number(r.value) === index));
  }

  function render() {
    const q = queue.items[queue.i];
    const active = queue.items.length > 0;
    const keyCount = Object.keys(key).length;
    $('ocr_input').hidden = q !== undefined;
    $('ocr_skip').hidden = !q;
    $('ocr_clear').hidden = !active;
    $('ocr_status').innerHTML = !active ? '' : !q ? `All ${queue.items.length} questions done.`
      : `Question ${queue.i + 1} of ${queue.items.length} (book number ${q.num ?? '?'})` +
        (keyCount ? ` &middot; key ${keyOf(q) || 'missing'} &middot; ${keyCount} answers` : ' &middot; no key') +
        (q.flags.length ? `<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>` : '');
    renderProgress();
  }

  function show() {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
    render();
  }

  $('ocr_load').onclick = () => {
    const raw = String($('ocr_text').value == null ? '' : $('ocr_text').value);
    paste.set(raw);
    const parsed = parsePaste(raw);
    const items = parsed.items || [];
    const parsedKey = parsed.key || {};
    const keyCount = Object.keys(parsedKey).length;
    if (!items.length) {
      if (keyCount && queue.items.length) {
        key = parsedKey;
        store.set('ansKey', key);
        save();
        show();
        $('ocr_status').innerHTML += ` Answer key updated (${keyCount} entries).`;
        return;
      }
      if (keyCount) {
        return alert('That paste has an answer key (' + keyCount + ' entries) but no questions. Paste the questions too, then load again.');
      }
      return alert('No questions found in that text.');
    }
    saveMeta();
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    autoRun++;
    key = parsedKey;
    queue = { items, i: 0, how: parsed.sectionEvidence ? parsed.sectionEvidence.how : 'none' };
    if (keyCount) store.set('ansKey', key);
    else store.del('ansKey');
    auto = { ready: false, running: false, total: items.length };
    save();
    show();
    const problems = dryRunProblems();
    auto.ready = !problems.length;
    renderProgress();
    $('ocr_status').innerHTML += keyCount
      ? ` Answer key: ${keyCount} entries (${queue.how}).`
      : ' No answer-key section found.';
    $('ocr_status').innerHTML += problems.length
      ? ` Dry run: ${problems.join('; ')}. Autosave is blocked.`
      : ` Dry run OK: ready to autosave ${items.length} questions.`;
  };
  $('ocr_skip').onclick = () => { queue.i++; save(); show(); };
  $('ocr_auto').onclick = () => {
    if (!queue.items.length) return alert('Load questions first.');
    if (auto && auto.running) return stopAuto('Autosave stopped at question ' + Math.min(queue.i + 1, queue.items.length) + '.');
    const problems = dryRunProblems();
    auto = { ready: !problems.length, running: false, total: queue.items.length };
    render();
    if (problems.length) return alert('Dry run found problems:\n- ' + problems.join('\n- '));
    if (queue.i >= queue.items.length) return alert('Every question in this list is already saved.');
    auto.running = true;
    autoRun++;
    show();
    autoStep();
  };
  $('ocr_clear').onclick = () => {
    queue = { items: [], i: 0 };
    key = {};
    auto = null;
    autoRun++;
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    paste.del();
    $('ocr_text').value = '';
    save();
    store.del('ansKey');
    render();
  };

  if (bundled) {
    // A bookmarklet does not survive a page reload, so saving through the
    // native form would hand the next question to the page's own (older)
    // helper, which drops the key and the dry-run state. Save in place instead
    // and keep the injected helper, its answer key and its queue alive.
    form.addEventListener('submit', saveInPlace, true);
  } else {
    form.addEventListener('submit', () => {
      if (!queue.items.length) return;
      saveMeta();
      store.set('ocrSubmitted', true);
    });
  }

  const failed = document.querySelector('.admin-error');
  if (store.get('ocrSubmitted')) {
    store.del('ocrSubmitted');
    if (!failed) { queue.i++; save(); }
  }
  failed ? render() : show();
})();
