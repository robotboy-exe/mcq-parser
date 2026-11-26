(function () {
  // Key/autosave bookmarklet entry. The dedicated build in this directory
  // inlines the canonical parser core, then boot.js, then this file. This entry
  // owns only the key panel, answer fill, dry run, autosave, and in-place save;
  // it is never loaded by a deployed page.
  const EXPECTED_CORE_VERSION = '2.5.5';
  const core = typeof window !== 'undefined' ? window.OCRParser : null;

  function coreProblem() {
    if (!core) return 'src/parser/core.js did not load, so window.OCRParser is missing';
    if (core.version !== EXPECTED_CORE_VERSION) {
      return 'src/parser/core.js reports version ' + core.version + ' but this entry needs ' + EXPECTED_CORE_VERSION;
    }
    if (typeof core.parsePaste !== 'function') {
      return 'src/parser/core.js has no parsePaste export, so the answer key cannot be split';
    }
    return null;
  }

  const form = document.querySelector('input[name=action][value=save_question]')?.form;
  const problem = coreProblem();
  if (problem) {
    const message = 'Key bookmarklet disabled: ' + problem;
    if (typeof console !== 'undefined' && console.error) console.error(message);
    if (form && !location.search.includes('edit=')) {
      const banner = document.createElement('div');
      banner.className = 'admin-field admin-alert admin-error';
      banner.id = 'ocr_error';
      banner.textContent = message + '. Reload the page; if this persists, the bookmarklet is stale and needs rebuilding.';
      form.before(banner);
      throw new Error(message);
    }
    return;
  }

  if (!form || location.search.includes('edit=')) return;

  // boot.js sets this flag before this entry runs, so the panel keeps its
  // bookmarklet title.
  const bundled = typeof window !== 'undefined' && window.__ocrBookmarklet === true;

  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  const LETTERS = 'ABCD';

  const $ = (id) => document.getElementById(id);
  const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  // Shared storage may be stale, foreign, or corrupt. A malformed value reads as
  // undefined (so startup never throws) while an absent value stays null.
  const store = {
    get: (k) => {
      let raw = null;
      try {
        raw = localStorage.getItem(k);
      } catch (e) {
        return undefined;
      }
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return undefined;
      }
    },
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

  // ocrQueue keeps its documented shape {items, i}. The key product adds the
  // optional how marker on Load, so a queue carrying how belongs to this product
  // while a queue the deployed helper wrote has no provenance. Anything else is
  // normalized rather than trusted.
  function normalizeQueue(raw) {
    if (!isPlainObject(raw)) return { queue: { items: [], i: 0 }, repaired: true };
    let repaired = false;
    const items = [];
    if (Array.isArray(raw.items)) {
      for (const item of raw.items) {
        if (!isPlainObject(item)) {
          repaired = true;
          continue;
        }
        if (Array.isArray(item.flags)) {
          items.push(item);
        } else {
          items.push(Object.assign({}, item, { flags: [] }));
          repaired = true;
        }
      }
    } else {
      repaired = true;
    }
    let i = 0;
    if (Number.isInteger(raw.i) && raw.i >= 0) i = raw.i;
    else repaired = true;
    const queue = Object.assign({}, raw, { items, i });
    // ansKey is the only place the answer key lives, so any leftover queue copy
    // is dropped rather than allowed to outlive it.
    if (Object.prototype.hasOwnProperty.call(queue, 'key')) {
      delete queue.key;
      repaired = true;
    }
    return { queue, repaired };
  }

  function normalizeKey(raw) {
    if (!isPlainObject(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter((entry) => typeof entry[1] === 'string'));
  }

  const storedQueue = store.get('ocrQueue');
  const normalizedQueue = normalizeQueue(storedQueue === undefined ? null : storedQueue);
  let queue = normalizedQueue.queue;
  const storedKey = store.get('ansKey');
  let key = normalizeKey(storedKey);
  const save = () => store.set('ocrQueue', queue);
  if (storedQueue === undefined || (normalizedQueue.repaired && storedQueue !== null)) save();
  if (storedKey !== null && storedKey !== undefined && !isPlainObject(storedKey)) store.del('ansKey');

  // Run ownership lives on the form, not in this closure, so a second activation
  // adopts the request that is still in flight instead of starting a competing
  // run over shared storage. The outstanding record itself stays on the form:
  // activation retires the previous continuation but never hides the request, so
  // a third activation still adopts it.
  const owner = form.__ocrKeyOwner || (form.__ocrKeyOwner = { gen: 0, inFlight: null, batch: 0 });
  owner.gen += 1;
  const myGen = owner.gen;
  const retired = () => owner.gen !== myGen;
  // The record is shared rather than copied, so its settled flag is shared too.
  let pendingSave = owner.inFlight;
  let auto = null;
  let autoTimer = null;
  // The in-place save this panel owns, or null. Identity rather than a boolean,
  // so an abandoned request cannot release a newer save.
  let savingInPlace = null;
  // A request inherited from the replaced panel must settle into this one even
  // when Start is never pressed.
  if (pendingSave && !pendingSave.settled) watchSave(pendingSave);

  const savedPaste = paste.get();
  if (typeof savedPaste === 'string') $('ocr_text').value = savedPaste;

  function abandonInFlight() {
    pendingSave = null;
    owner.inFlight = null;
    // A cleared, replaced, or skipped list gets a new batch identity, so a late
    // result from the old list cannot settle this one.
    owner.batch += 1;
  }

  function keyApplies() {
    return typeof queue.how === 'string';
  }

  function keyCount() {
    return Object.keys(key).length;
  }

  function keyOf(q) {
    if (!keyApplies()) return '';
    if (!q || q.num == null) return '';
    const letter = key[q.num];
    return typeof letter === 'string' ? letter.toUpperCase() : '';
  }

  function dryRunProblems() {
    const problems = [];
    if (!queue.items.length) return ['no questions loaded'];
    const missingMeta = FIELDS.filter((id) => !String($(id).value || '').trim());
    if (missingMeta.length) problems.push('choose ' + missingMeta.join(', '));
    if (!keyApplies() && keyCount()) {
      problems.push('the stored answer key was not loaded with this list; paste it again and press Load questions');
    }
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
      // Keep the same record so its settled flag and batch identity stay shared.
      // A settled or abandoned request must never become a new unsettled save, or
      // Start would reuse a finished answer for the next question.
      const record = owner.inFlight && owner.inFlight.request === auto.request ? owner.inFlight : null;
      pendingSave = record && !record.settled ? record : null;
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

  // A save is claimed exactly once, by whichever instance is live when it
  // settles. The batch check then drops results whose list is gone.
  function claimSave(entry) {
    if (!entry || entry.settled) return false;
    entry.settled = true;
    if (owner.inFlight === entry) owner.inFlight = null;
    return true;
  }

  function watchSave(entry) {
    entry.request.then((result) => settleSave(entry, result));
  }

  function settleSave(entry, result) {
    // A retired instance must never settle: it would act on a replaced panel.
    if (retired()) return;
    if (!claimSave(entry)) return;
    if (entry.batch !== owner.batch) return;
    const number = entry.index + 1;
    if (entry.kind === 'inplace') {
      // An in-place save that Start autosave adopted belongs to the run now, so it
      // settles as autosave and the run continues. Only an in-place save this
      // panel still owns by itself uses the manual result path.
      const adopted = auto && auto.request === entry.request;
      if (!adopted) return settleInPlace(entry, result, number);
      if (savingInPlace === entry) savingInPlace = null;
      store.del('ocrSubmitted');
    }
    return settleAuto(entry, result, number);
  }

  function settleAuto(entry, result, number) {
    if (auto) {
      auto.inFlight = false;
      auto.request = null;
    }
    if (result.saved && queue.i === entry.index) {
      queue.i++;
      save();
    }
    if (!auto) {
      // The panel was replaced and this run was never restarted here: record the
      // outstanding result once and show it instead of leaving the question on
      // screen after the server already saved it.
      show();
      $('ocr_status').innerHTML = result.saved
        ? 'The save that was already in progress finished: question ' + number + ' is saved.'
        : 'The save that was already in progress did not confirm: question ' + number + ' stays queued.';
      return;
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
  }

  function settleInPlace(entry, result, number) {
    // Release the lock only when this request is the one this panel is holding;
    // an abandoned request must not unlock a newer in-place save.
    const owned = savingInPlace === entry;
    if (owned) savingInPlace = null;
    store.del('ocrSubmitted');
    const total = queue.items.length;
    if (result.saved && queue.i === entry.index) {
      queue.i++;
      save();
      show();
      $('ocr_status').innerHTML = owned
        ? 'Saved question ' + number + ' of ' + total + ' using its answer key.'
        : 'The save that was already in progress finished: question ' + number + ' is saved.';
      return;
    }
    render();
    $('ocr_status').innerHTML = owned
      ? 'Question ' + number + ' was not saved: '
        + (result.failed ? 'network problem' : (saveError(result.html) || 'the server did not confirm the save'))
        + '. It stays queued.'
      : 'The save that was already in progress did not confirm: question ' + number + ' stays queued.';
  }

  function autoStep() {
    // A retired instance must never continue its timer chain after a reinjection.
    if (retired()) return;
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
    // Reuse an unanswered save for this same question and list from a stopped,
    // replaced, or in-place run instead of posting it again.
    const reusable = [pendingSave, owner.inFlight].find((record) => record && !record.settled
      && record.index === queue.i && record.batch === owner.batch) || null;
    if (reusable && reusable.kind === 'inplace' && savingInPlace === reusable) savingInPlace = null;
    const entry = reusable || {
      index: queue.i,
      request: postSave(),
      batch: owner.batch,
      kind: 'auto',
      settled: false
    };
    pendingSave = null;
    auto.inFlight = true;
    auto.request = entry.request;
    owner.inFlight = entry;
    watchSave(entry);
    renderProgress();
  }

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
    // A save for this exact question is already outstanding, from this panel or
    // from the panel a second click replaced; posting now would save it twice.
    const outstanding = owner.inFlight;
    if (outstanding && !outstanding.settled
      && outstanding.batch === owner.batch && outstanding.index === queue.i) {
      $('ocr_status').innerHTML = 'A save for this question is already in progress; it will settle on its own.';
      return;
    }
    if (typeof fetch !== 'function' || typeof FormData !== 'function') {
      $('ocr_status').innerHTML = 'This browser cannot save without a page reload; save the question by hand.';
      return;
    }
    saveMeta();
    // The page helper may have already handled this submit before us, so drop
    // its reload marker; the queue advances here and must not advance again on
    // the next page load.
    store.del('ocrSubmitted');
    const number = queue.i + 1;
    $('ocr_status').innerHTML = 'Saving question ' + number + ' of ' + queue.items.length + '...';
    const entry = {
      index: queue.i,
      request: postSave(),
      batch: owner.batch,
      kind: 'inplace',
      settled: false
    };
    savingInPlace = entry;
    owner.inFlight = entry;
    watchSave(entry);
  }

  function fillForm(q) {
    const meta = store.get('ocrMeta');
    if (isPlainObject(meta)) {
      for (const id of FIELDS) {
        const el = $(id);
        if (el && typeof meta[id] !== 'undefined') el.value = meta[id];
      }
    }
    $('question_text').value = q.question;
    for (const l of 'abcd') $('option_' + l).value = q[l];
    const letter = keyOf(q);
    const index = letter ? LETTERS.indexOf(letter) : -1;
    form.querySelectorAll('[name=correct_option]').forEach((r) => (r.checked = Number(r.value) === index));
  }

  function render() {
    const q = queue.items[queue.i];
    const active = queue.items.length > 0;
    const answers = keyCount();
    let keyText = ' &middot; no key';
    if (answers && keyApplies()) keyText = ` &middot; key ${keyOf(q) || 'missing'} &middot; ${answers} answers`;
    else if (answers) keyText = ` &middot; stored key (${answers} answers) not used: paste the key for this list and press Load questions`;
    $('ocr_input').hidden = q !== undefined;
    $('ocr_skip').hidden = !q;
    $('ocr_clear').hidden = !active;
    $('ocr_status').innerHTML = !active ? '' : !q ? `All ${queue.items.length} questions done.`
      : `Question ${queue.i + 1} of ${queue.items.length} (book number ${q.num ?? '?'})` + keyText
        + (Array.isArray(q.flags) && q.flags.length ? `<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>` : '');
    renderProgress();
  }

  function show() {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
    render();
  }

  $('ocr_load').onclick = () => {
    const raw = String($('ocr_text').value == null ? '' : $('ocr_text').value);
    paste.set(raw);
    const parsed = core.parsePaste(raw);
    const items = parsed.items || [];
    const parsedKey = parsed.key || {};
    const parsedKeyCount = Object.keys(parsedKey).length;
    if (!items.length) {
      if (parsedKeyCount && queue.items.length) {
        key = parsedKey;
        store.set('ansKey', key);
        // A deliberate key-only paste confirms this list, so record that the key
        // belongs to the loaded queue in its existing how field.
        if (!keyApplies()) queue.how = 'key-paste';
        save();
        show();
        $('ocr_status').innerHTML += ` Answer key updated (${parsedKeyCount} entries).`;
        return;
      }
      if (parsedKeyCount) {
        return alert('That paste has an answer key (' + parsedKeyCount + ' entries) but no questions. Paste the questions too, then load again.');
      }
      return alert('No questions found in that text.');
    }
    saveMeta();
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    abandonInFlight();
    savingInPlace = null;
    key = parsedKey;
    queue = { items, i: 0, how: parsed.sectionEvidence ? parsed.sectionEvidence.how : 'none' };
    if (parsedKeyCount) store.set('ansKey', key);
    else store.del('ansKey');
    auto = { ready: false, running: false, total: items.length };
    save();
    show();
    const problems = dryRunProblems();
    auto.ready = !problems.length;
    renderProgress();
    $('ocr_status').innerHTML += parsedKeyCount
      ? ` Answer key: ${parsedKeyCount} entries (${queue.how}).`
      : ' No answer-key section found.';
    $('ocr_status').innerHTML += problems.length
      ? ` Dry run: ${problems.join('; ')}. Autosave is blocked.`
      : ` Dry run OK: ready to autosave ${items.length} questions.`;
  };
  $('ocr_skip').onclick = () => {
    // Skipping invalidates this run: a hanging save must not advance the queue a
    // second time, so its continuation is dropped before the index moves.
    abandonInFlight();
    savingInPlace = null;
    if (auto) {
      auto.running = false;
      auto.inFlight = false;
      auto.request = null;
    }
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    queue.i++;
    save();
    show();
  };
  $('ocr_auto').onclick = () => {
    if (!queue.items.length) return alert('Load questions first.');
    if (auto && auto.running) return stopAuto('Autosave stopped at question ' + Math.min(queue.i + 1, queue.items.length) + '.');
    const problems = dryRunProblems();
    auto = { ready: !problems.length, running: false, total: queue.items.length };
    render();
    if (problems.length) return alert('Dry run found problems:\n- ' + problems.join('\n- '));
    if (queue.i >= queue.items.length) return alert('Every question in this list is already saved.');
    auto.running = true;
    show();
    autoStep();
  };
  $('ocr_clear').onclick = () => {
    queue = { items: [], i: 0 };
    key = {};
    auto = null;
    abandonInFlight();
    savingInPlace = null;
    if (autoTimer && typeof clearTimeout === 'function') clearTimeout(autoTimer);
    autoTimer = null;
    paste.del();
    $('ocr_text').value = '';
    save();
    store.del('ansKey');
    render();
  };

  // Clicking the bookmarklet twice must not stack submit handlers. The panel is
  // rebuilt by boot.js; the listener is replaced here.
  if (form.__ocrKeySubmit && typeof form.removeEventListener === 'function') {
    form.removeEventListener('submit', form.__ocrKeySubmit, true);
  }
  form.__ocrKeySubmit = saveInPlace;
  form.addEventListener('submit', form.__ocrKeySubmit, true);

  // The deployed helper's legacy ocrSubmitted marker is never read here: only its
  // own submit may advance its queue. The before/after deletes in saveInPlace stay
  // so an intercepted native submit cannot advance that queue twice.
  const failed = document.querySelector('.admin-error');
  failed ? render() : show();
  if (pendingSave && !pendingSave.settled) {
    $('ocr_status').innerHTML += ' A save was already in progress; Start autosave attaches to it instead of posting again.';
  }
})();
