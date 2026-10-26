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
  const hadServerError = Boolean(document.querySelector('.admin-error'));
  const FIELDS = ['subject_id', 'exam_category_id', 'exam_year'];
  const SALVAGE_FLAG = 'OCR boundaries repaired; verify question and option split';
  const $ = id => document.getElementById(id);
  const L = localStorage;
  const store = {
    get: k => JSON.parse(L.getItem(k) || 'null'),
    set: (k, v) => L.setItem(k, JSON.stringify(v)),
    del: k => L.removeItem(k)
  };
  const p = document.createElement('div');
  p.className = 'admin-field';
  p.innerHTML = `<div id="ocr_input"><label for="ocr_text">Paste the WHOLE block: questions + answer key (one box)</label><textarea id="ocr_text" style="min-height:220px"></textarea><button type="button" class="admin-btn" id="ocr_load">Load questions + key</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button><div class="admin-note">Recommended divider on its own line: <code>=== ANSWER KEY ===</code>. Varying headers are auto-detected otherwise. To fix the key mid-queue: Show paste box, paste ONLY the key, Load (queue is kept).</div></div><div id="ocr_status" class="admin-note"></div><div id="ocr_auto"><button type="button" class="admin-btn" id="ocr_auto_start" disabled>Start auto-save</button> <label class="admin-note" style="display:inline-block;margin:0 8px"><input type="checkbox" id="ocr_active_mode"> Save as active (live immediately)</label> <button type="button" class="admin-btn admin-btn-muted" id="ocr_auto_stop" disabled>Stop</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_auto_dry">Dry run</button><div id="ocr_batch_confirm" class="admin-note" hidden></div><div id="ocr_auto_status" class="admin-note"></div><div id="ocr_auto_blocked" class="admin-note"></div><div id="ocr_saved_box" class="admin-note" hidden><div id="ocr_saved_list"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_saved_copy">Copy saved list</button></div><div id="ocr_paused" class="admin-alert admin-error" hidden><div id="ocr_paused_text"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_paused_clear">I checked. Clear warning.</button></div></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_goto" hidden>Go to question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_show" style="margin-left:8px">Show paste box</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear saved key</button><div id="ans_msg" class="admin-note"></div>`;
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
    const rf = document.createElement('div');
    rf.id = 'ocr_save_flag';
    rf.className = 'admin-alert admin-error';
    rf.style.marginTop = '12px';
    rf.hidden = true;
    r.insertAdjacentElement('afterend', rf);
  }
  const saveMeta = () => store.set('ocrMeta', Object.fromEntries(FIELDS.map(id => [id, $(id).value])));
  function readHeader(text) {
    const { year, header } = parseHeader(text);
    return {
      year,
      subject: pickSubjectIndex(header, Array.from($('subject_id').options).map(o => o.text)),
      category: pickCategoryIndex(header, Array.from($('exam_category_id').options).map(o => o.text))
    };
  }
  function applyHeaderInfo(...texts) {
    const infos = texts.map(readHeader);
    const year = infos.map(x => x.year).find(v => v);
    const subject = infos.map(x => x.subject).find(v => v >= 0);
    const category = infos.map(x => x.category).find(v => v >= 0);
    if (year) $('exam_year').value = year;
    if (subject !== undefined) $('subject_id').options[subject].selected = true;
    if (category !== undefined) $('exam_category_id').options[category].selected = true;
    return Boolean(year) || subject !== undefined || category !== undefined;
  }
  function fillForm(q, auto) {
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
    if (!auto && form.elements.is_active) form.elements.is_active.checked = true;
  }
  let queue = store.get('ocrQueue') || { items: [], i: 0 };
  const saveQ = () => store.set('ocrQueue', queue);
  let last = queue.i;
  let savedLog = [];
  try { savedLog = store.get('ocrSavedLog') || []; } catch (e) {}
  if (!Array.isArray(savedLog)) savedLog = [];
  let saveInProgress = false;
  let stopAuto = false;
  let autoRunning = false;
  let autoDry = false;
  let autoRunCount = 0;
  let unverifiedStreak = 0;
  let autoTabId = newBatchId();
  let autoHeartbeat = null;
  let confirmTicked = false;
  let confirmedMeta = null;
  let activeMode = false;
  let activeConfirmed = false;
  let runMode = null;
  let lastBlocked = '';
  let autoStatus = '';
  const busyNotice = 'A save is in progress. Wait for it to finish.';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function readLock() {
    try { return store.get('autoLock'); } catch (e) { return null; }
  }
  function lockAlive(lock) {
    return Boolean(lock && Date.now() - Number(lock.at || 0) < 15000);
  }
  function releaseLock() {
    if (autoHeartbeat) clearTimeout(autoHeartbeat);
    autoHeartbeat = null;
    const lock = readLock();
    if (lock && lock.tabId === autoTabId) {
      try { store.del('autoLock'); } catch (e) {}
    }
  }
  function heartbeat() {
    if (!autoRunning) return;
    const step = heartbeatTick({
      lock: readLock(),
      tabId: autoTabId,
      now: Date.now(),
      write: lock => store.set('autoLock', lock),
      release: releaseLock
    });
    if (step.stop) { stopAuto = true; return; }
    autoHeartbeat = setTimeout(heartbeat, 5000);
  }
  function acquireLock() {
    const lock = readLock();
    if (lock && lock.tabId !== autoTabId && lockAlive(lock)) return false;
    store.set('autoLock', { tabId: autoTabId, at: Date.now() });
    if (autoHeartbeat) clearTimeout(autoHeartbeat);
    autoHeartbeat = setTimeout(heartbeat, 5000);
    return true;
  }
  function selectedText(id) {
    const el = $(id);
    return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
  }
  function currentMeta() {
    const e = form.elements;
    return {
      subject: e.subject_id ? e.subject_id.value : '',
      category: e.exam_category_id ? e.exam_category_id.value : '',
      year: e.exam_year ? e.exam_year.value : '',
      subjectText: selectedText('subject_id'),
      categoryText: selectedText('exam_category_id')
    };
  }
  function recentRows() {
    const table = document.querySelector('.admin-table');
    if (!table) return [];
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent));
    return recentRowsFromTable(headers, rows);
  }
  function gateState(useQueue) {
    const q = useQueue || queue;
    const e = form.elements;
    const radio = form.querySelector('input[name=correct_option]:checked');
    const meta = currentMeta();
    return {
      queue: q,
      key: key,
      keyBatch: (() => { try { return store.get('ansKeyBatch'); } catch (err) { return null; } })(),
      keyConflicts: keyConflicts,
      meta: meta,
      confirmed: confirmTicked,
      confirmedMeta: confirmedMeta,
      activeMode: activeMode,
      activeConfirmed: activeConfirmed,
      mode: activeMode ? 'active' : 'draft',
      runMode: runMode,
      radioLetter: radio ? 'ABCD'[Number(radio.value)] : null,
      hasImage: Boolean(e.question_image && (e.question_image.value || (e.question_image.files && e.question_image.files.length))),
      hasVideo: Boolean(e.answer_video && (e.answer_video.value || (e.answer_video.files && e.answer_video.files.length))),
      hasExplanation: Boolean(e.answer_explanation && e.answer_explanation.value && e.answer_explanation.value.trim()),
      savingMarker: (() => { try { return store.get('ocrSaving'); } catch (err) { return null; } })(),
      saveInProgress: saveInProgress,
      stopRequested: stopAuto,
      lock: readLock(),
      tabId: autoTabId,
      now: Date.now(),
      visible: !document.hidden,
      savedLog: savedLog,
      recentRows: recentRows(),
      form: {
        question: e.question_text ? e.question_text.value : '',
        options: ['option_a', 'option_b', 'option_c', 'option_d'].map(id => e[id] ? e[id].value : '')
      }
    };
  }
  function renderBatchConfirm() {
    const box = $('ocr_batch_confirm');
    if (!box) return;
    box.textContent = '';
    if (!queue.items.length) { box.hidden = true; return; }
    box.hidden = false;
    const meta = currentMeta();
    const first = queue.items[0].num;
    const last = queue.items[queue.items.length - 1].num;
    const summary = document.createElement('div');
    summary.textContent = 'Batch: ' + (meta.subjectText || '?') + ' / ' + (meta.categoryText || '?') + ' / ' + (meta.year || '?') + ' — ' + queue.items.length + ' questions, ' + Object.keys(key).length + ' key answers, #' + first + ' to #' + last + '.';
    box.appendChild(summary);
    const yearLine = document.createElement('div');
    const yearStrong = document.createElement('strong');
    yearStrong.textContent = 'Year: ' + (meta.year || '?');
    yearLine.appendChild(yearStrong);
    box.appendChild(yearLine);
    const scopeNote = document.createElement('div');
    scopeNote.textContent = 'Check the year. Duplicate checks only compare questions from the same year and category. They also only see this batch and the 20 newest rows on the page.';
    box.appendChild(scopeNote);
    const modeLine = document.createElement('div');
    modeLine.textContent = activeMode ? 'Mode: ACTIVE. Saved questions go live immediately.' : 'Mode: draft (inactive).';
    if (activeMode) {
      modeLine.style.color = '#b00020';
      modeLine.style.fontWeight = 'bold';
    }
    box.appendChild(modeLine);
    if (activeMode) {
      const activeLabel = document.createElement('label');
      const activeCb = document.createElement('input');
      activeCb.type = 'checkbox';
      activeCb.id = 'ocr_active_tick';
      activeCb.checked = activeConfirmed;
      activeCb.onchange = () => { activeConfirmed = activeCb.checked; renderAuto(); };
      activeLabel.appendChild(activeCb);
      activeLabel.appendChild(document.createTextNode(' I understand these go live to students now.'));
      box.appendChild(activeLabel);
    }
    if (!queue.batchId) {
      const legacy = document.createElement('div');
      legacy.textContent = 'This queue has no batch identity. Paste the questions again.';
      box.appendChild(legacy);
    }
    if (keyConflicts.length) {
      const conflict = document.createElement('div');
      conflict.textContent = 'Key conflict: question ' + keyConflicts[0].num + ' has ' + keyConflicts[0].letters.join(', ') + '.';
      box.appendChild(conflict);
    }
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'ocr_confirm_tick';
    cb.checked = confirmTicked;
    cb.onchange = () => {
      confirmTicked = cb.checked;
      if (cb.checked) {
        const m = currentMeta();
        confirmedMeta = { subject: m.subject, category: m.category, year: m.year };
      } else {
        confirmedMeta = null;
      }
      renderAuto();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' These are correct.'));
    box.appendChild(label);
  }
  function savedCopyText() {
    const entries = savedForBatch(savedLog, queue.batchId);
    if (!entries.length) return 'No saves in this batch.';
    return entries.map(entry => unverifiedSaves([entry]).length
      ? 'Question ' + entry.num + ' (#' + entry.id + '): active status not verified'
      : 'Question ' + entry.num + ' saved as #' + entry.id + '.'
    ).join('\n');
  }
  function renderSaved() {
    const box = $('ocr_saved_box');
    const list = $('ocr_saved_list');
    if (!box || !list) return;
    const entries = savedForBatch(savedLog, queue.batchId);
    box.hidden = !entries.length;
    list.textContent = entries.length ? formatSavedRange(entries) + ' ' + savedCopyText().split('\n').join('; ') : '';
  }
  function renderPaused() {
    const box = $('ocr_paused');
    const text = $('ocr_paused_text');
    if (!box || !text) return;
    let marker = null;
    try { marker = store.get('ocrSaving'); } catch (e) {}
    if (!marker || saveInProgress) { box.hidden = true; return; }
    box.hidden = false;
    const when = marker.at ? new Date(marker.at).toLocaleTimeString() : 'an earlier time';
    text.textContent = 'Question ' + (marker.num == null ? '?' : marker.num) + ' may have saved at ' + when + '. It was not retried. Check Recently Added Questions first.';
  }
  function renderAuto() {
    if (!$('ocr_auto_start')) return;
    const modeBox = $('ocr_active_mode');
    if (modeBox) {
      modeBox.disabled = autoRunning;
      modeBox.checked = activeMode;
    }
    renderBatchConfirm();
    const marker = (() => { try { return store.get('ocrSaving'); } catch (e) { return null; } })();
    const disabled = autoRunning || !confirmTicked || (activeMode && !activeConfirmed) || Boolean(marker) || !queue.items[queue.i];
    $('ocr_auto_start').disabled = disabled;
    $('ocr_auto_stop').disabled = !autoRunning;
    $('ocr_auto_dry').disabled = autoRunning;
    const status = $('ocr_auto_status');
    if (autoRunning) {
      status.textContent = autoDry ? 'Dry run: ' + autoRunCount + ' would-save so far.' : 'Auto-save (' + (runMode === 'active' ? 'ACTIVE' : 'draft') + ') running: ' + autoRunCount + ' saved this run.';
    } else if (autoStatus) {
      status.textContent = autoStatus;
    } else {
      const batchSaved = savedForBatch(savedLog, queue.batchId);
      status.textContent = batchSaved.length ? formatSavedRange(batchSaved) : 'Auto-save is idle.';
    }
    const blockedEl = $('ocr_auto_blocked');
    blockedEl.textContent = lastBlocked;
    blockedEl.style.color = lastBlocked ? '#b00020' : '';
    blockedEl.style.fontWeight = lastBlocked ? 'bold' : '';
    renderSaved();
    renderPaused();
  }
  function resetConfirm() {
    confirmTicked = false;
    confirmedMeta = null;
    activeMode = false;
    activeConfirmed = false;
    runMode = null;
    const modeBox = $('ocr_active_mode');
    if (modeBox) modeBox.checked = false;
    lastBlocked = '';
    autoStatus = '';
  }
  function showBlocked(blocker) {
    lastBlocked = blockerText(blocker);
  }
  function setResult(text, danger) {
    const r = $('ans_res');
    if (!r) return;
    r.textContent = text;
    r.style.color = danger ? '#b00020' : '#1769aa';
  }
  function busySaving() {
    if (!saveInProgress) return false;
    if (autoRunning) stopAuto = true;
    lastBlocked = busyNotice;
    renderAuto();
    return true;
  }
  function markStopped() {
    if (!autoStatus || autoStatus.indexOf('Paused') !== 0) autoStatus = 'Stopped.';
  }
  async function verifyInactive(id) {
    let ctl = null, timer = null;
    try {
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctl) timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(location.pathname + '?edit=' + encodeURIComponent(id), { credentials: 'same-origin', signal: ctl ? ctl.signal : undefined });
      if (!res.ok) return null;
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, 'text/html');
      const cb = doc.querySelector('input[name=is_active], #is_active');
      if (!cb) return null;
      return cb.checked ? false : true;
    } catch (e) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  function restorePriorMarker(prior) {
    if (prior) store.set('ocrSaving', prior);
    else store.del('ocrSaving');
  }
  function clearSavedMarker(prior, num) {
    if (prior && prior.num !== num) store.set('ocrSaving', prior);
    else store.del('ocrSaving');
  }
  async function saveCurrentQuestion(opts) {
    const auto = Boolean(opts && opts.auto);
    const active = Boolean(opts && opts.active);
    if (saveInProgress) return { kind: 'busy', message: 'A save is already running.' };
    saveInProgress = true;
    const q = queue.items[queue.i];
    const num = q ? q.num : null;
    const savedBatchId = queue.batchId || null;
    const savedIndex = queue.i;
    let priorSaving = null;
    let ctl = null, timer = null;
    try {
      try { priorSaving = store.get('ocrSaving'); } catch (e) {}
      try {
        store.set('ocrSaving', { num: num, at: Date.now() });
      } catch (e) {
        setResult('NOT saved: browser storage is unavailable, so the save was not attempted.', true);
        return { kind: 'rejected', reason: 'storage', message: 'browser storage is unavailable.' };
      }
      renderAuto();
      if (!auto && form.elements.is_active) form.elements.is_active.checked = true;
      const fd = new FormData(form);
      if (auto) {
        if (active) fd.set('is_active', '1');
        else fd.delete('is_active');
        fd.set('autosave', '1');
      }
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctl) timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(location.href, { method: 'POST', body: fd, credentials: 'same-origin', signal: ctl ? ctl.signal : undefined });
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, 'text/html');
      const er = doc.querySelector('.admin-error');
      const result = classifySaveResponse({ redirected: res.redirected, text: txt, errorText: er ? er.textContent.trim() : '', lastId: maxSavedId(savedLog) });
      if (result.kind === 'rejected') {
        restorePriorMarker(priorSaving);
        setResult('NOT saved: ' + result.message, true);
        return result;
      }
      if (result.kind === 'ambiguous') {
        setResult('Unknown. It may have saved. Check the list.', true);
        return result;
      }
      let inactive = null;
      if (auto) inactive = await verifyInactive(result.id);
      const entry = { num: num, id: result.id, at: Date.now(), batchId: savedBatchId, inactive: auto ? inactive : false, mode: auto ? (active ? 'active' : 'draft') : 'manual' };
      const sameQueue = queue.i === savedIndex && queue.items[savedIndex] === q && (queue.batchId || null) === savedBatchId;
      const committed = commitSave({
        read: () => store.get('ocrSavedLog') || [],
        current: savedLog,
        entry: entry,
        cap: 200,
        write: log => store.set('ocrSavedLog', log),
        advance: sameQueue && q ? () => { queue.i++; saveQ(); } : null
      });
      savedLog = committed.log;
      if (!committed.ok) {
        const failText = 'Saved as #' + result.id + ' but could not be logged. Do not retry.';
        lastBlocked = failText;
        setResult(failText, true);
        stopAuto = true;
        return { kind: 'saved', id: result.id, inactive: inactive, entry: entry, failed: committed.stage };
      }
      clearSavedMarker(priorSaving, num);
      ['question_image', 'answer_video'].forEach(n => { const el = form.elements[n]; if (el) el.value = ''; });
      const ae = form.elements.answer_explanation;
      if (ae) ae.value = '';
      saveMeta();
      showOCR(auto);
      last = cur().i;
      if (last > -1) tick(); else form.reset();
      let unverifiedStop = false;
      if (auto) {
        const tracked = trackUnverified(unverifiedStreak, inactive);
        unverifiedStreak = tracked.streak;
        if (tracked.stop) {
          unverifiedStop = true;
          stopAuto = true;
        }
      }
      if (auto && inactive === null) {
        if (unverifiedStop) {
          lastBlocked = 'Stopped after 2 unverified checks. Check the saved list before continuing.';
          setResult(lastBlocked, true);
        } else {
          setResult('Saved as #' + result.id + '. Could not verify; check the list.', false);
        }
      } else if (auto && inactive === !active) {
        setResult('Saved as question #' + result.id + ' (' + (active ? 'active' : 'inactive') + ').', false);
      } else if (auto && active) {
        setResult('SAVED AS INACTIVE: question #' + result.id + ' is not live. Check the list.', true);
        stopAuto = true;
      } else if (auto) {
        setResult('SAVED AS ACTIVE: question #' + result.id + '. Check the list and turn it off.', true);
        stopAuto = true;
      } else {
        setResult('Saved as question #' + result.id + '.', false);
      }
      return { kind: 'saved', id: result.id, inactive: inactive, entry: entry };
    } catch (e) {
      setResult('Unknown. It may have saved. Check the list.', true);
      return { kind: 'ambiguous', message: 'Unknown. It may have saved. Check the list.' };
    } finally {
      if (timer) clearTimeout(timer);
      saveInProgress = false;
      if (lastBlocked === busyNotice) lastBlocked = '';
    }
  }
  function renderOCR() {
    const q = queue.items[queue.i];
    const active = queue.items.length > 0;
    $('ocr_input').hidden = q !== undefined;
    $('ocr_goto').hidden = !active;
    $('ocr_skip').hidden = !q;
    $('ocr_reset').hidden = !active;
    $('ocr_save_flag').hidden = !(q && q.flags.length);
    $('ocr_save_flag').textContent = q && q.flags.length ? `Check this one: ${q.flags.join(', ')}` : '';
    $('ocr_status').innerHTML = !active ? '' : !q ? `All ${queue.items.length} questions done.` : `Question ${queue.i + 1} of ${queue.items.length} (book number ${q.num ?? '?'})` + (q.flags.length ? `<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>` : '');
    renderAuto();
  }
  function showOCR(auto) {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i], auto);
    renderOCR();
  }
  function copyText(text) {
    const done = () => { autoStatus = 'Saved list copied.'; renderAuto(); };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }
  async function runDry() {
    if (autoRunning) return;
    autoRunning = true;
    autoDry = true;
    autoRunCount = 0;
    stopAuto = false;
    autoStatus = '';
    lastBlocked = '';
    const dq = { items: queue.items.slice(), i: queue.i, batchId: queue.batchId };
    const lines = [];
    renderAuto();
    while (autoRunning) {
      if (stopAuto) { lines.push('Stopped.'); break; }
      const q = dq.items[dq.i];
      if (!q) break;
      const st = gateState(dq);
      st.confirmed = true;
      st.activeConfirmed = true;
      st.runMode = st.mode;
      st.form = null;
      st.savingMarker = null;
      st.lock = null;
      st.visible = true;
      st.saveInProgress = false;
      st.stopRequested = false;
      const k = st.key && st.key[q.num];
      st.radioLetter = ['A', 'B', 'C', 'D'].includes(k) ? k : null;
      const blockers = autosaveBlockers(st);
      if (blockers.length) {
        lines.push('Would stop at #' + q.num + ': ' + blockerText(blockers[0]));
        break;
      }
      lines.push('Would save #' + q.num + ' as ' + (st.mode === 'active' ? 'ACTIVE' : 'draft') + ': ' + (st.meta.subjectText || '?') + ' / ' + (st.meta.categoryText || '?') + ' / ' + (st.meta.year || '?') + ', A to D, answer ' + k + '.');
      dq.i++;
      autoRunCount++;
    }
    if (!lines.length) lines.push('Nothing to dry-run.');
    autoStatus = lines.join(' ');
    autoRunning = false;
    autoDry = false;
    renderAuto();
  }
  async function runAuto() {
    if (autoRunning) return;
    stopAuto = false;
    autoRunCount = 0;
    unverifiedStreak = 0;
    autoDry = false;
    autoStatus = '';
    lastBlocked = '';
    runMode = activeMode ? 'active' : 'draft';
    const initial = autosaveBlockers(gateState());
    if (initial.length) { showBlocked(initial[0]); renderAuto(); return; }
    if (!acquireLock()) { showBlocked({ code: 'lock', detail: 'Another tab is auto-saving.' }); renderAuto(); return; }
    autoRunning = true;
    renderAuto();
    try {
      while (autoRunning) {
        if (stopAuto) { markStopped(); break; }
        if (!queue.items[queue.i]) { autoStatus = 'All questions in this batch are done.'; break; }
        const blockers = autosaveBlockers(gateState());
        if (blockers.length) { showBlocked(blockers[0]); break; }
        const result = await saveCurrentQuestion({ auto: true, active: runMode === 'active' });
        if (result.kind !== 'saved') {
          if (result.message) lastBlocked = result.message;
          break;
        }
        autoRunCount++;
        renderAuto();
        if (stopAuto) { markStopped(); break; }
        await sleep(1500);
      }
    } finally {
      autoRunning = false;
      releaseLock();
      renderAuto();
    }
  }
  $('ocr_load').onclick = () => {
    if (busySaving()) return;
    if (autoRunning) stopAuto = true;
    resetConfirm();
    const raw = $('ocr_text').value;
    const salvage = splitSectionsWithSalvage(raw);
    const parts = salvage.parts;
    const text = FIXES.reduce((t, [re, fix]) => t.replace(re, fix), parts.questions);
    const items = flagNumberingGaps(splitQuestionItems(text).map(parseQuestion));
    if (salvage.salvaged) items.forEach(item => item.flags.push(SALVAGE_FLAG));
    const detailed = parts.answers.trim() ? parseKeyDetailed(parts.answers) : { key: {}, conflicts: [] };
    const newKey = detailed.key;
    const hasKey = Object.keys(newKey).length > 0;
    if (!items.length) {
      if (hasKey) {
        key = newKey;
        keyConflicts = detailed.conflicts;
        store.set('ansKey', key);
        store.set('ansKeyConflicts', keyConflicts);
        if (queue.batchId) store.set('ansKeyBatch', queue.batchId);
        else store.del('ansKeyBatch');
        if (queue.items[queue.i]) fillForm(queue.items[queue.i]);
        if (applyHeaderInfo(parts.boundary, parts.answers)) saveMeta();
        tick(true);
        $('ans_msg').textContent += ' (' + Object.keys(key).length + ' answers in key.)';
        renderOCR();
        $('ocr_status').innerHTML += ' Answer key only (' + Object.keys(key).length + ' entries, ' + parts.how + '). Question queue left unchanged.';
        return;
      }
      renderAuto();
      return alert('No questions found in that text.');
    }
    applyHeaderInfo(text, parts.boundary, parts.answers);
    saveMeta();
    key = hasKey ? newKey : {};
    keyConflicts = hasKey ? detailed.conflicts : [];
    const batchId = newBatchId();
    if (hasKey) {
      store.set('ansKey', key);
      store.set('ansKeyConflicts', keyConflicts);
      store.set('ansKeyBatch', batchId);
    } else {
      store.del('ansKey');
      store.del('ansKeyConflicts');
      store.del('ansKeyBatch');
    }
    queue = { items, i: 0, batchId };
    saveQ();
    showOCR();
    if (salvage.salvaged) {
      $('ocr_status').innerHTML += '<div class="admin-note">OCR boundaries repaired (' + salvage.inserts + ' inserts); verify the split.</div>';
    }
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
  $('ocr_goto').onclick = () => {
    if (busySaving()) return;
    if (autoRunning) stopAuto = true;
    const curQ = queue.items[queue.i];
    const ans = prompt('Go to book question number:', curQ && curQ.num != null ? String(curQ.num) : '');
    if (ans === null) return;
    const n = parseInt(ans, 10);
    if (!(n > 0)) return;
    let idx = queue.items.findIndex(x => x.num === n);
    if (idx < 0 && n <= queue.items.length) idx = n - 1;
    if (idx < 0) {
      alert('No loaded question with book number ' + n + ' (or list position ' + n + ').');
      return;
    }
    queue.i = idx;
    saveQ();
    showOCR();
  };
  $('ocr_skip').onclick = () => { if (busySaving()) return; if (autoRunning) stopAuto = true; queue.i++; saveQ(); showOCR(); };
  $('ocr_reset').onclick = () => {
    if (busySaving()) return;
    if (autoRunning) stopAuto = true;
    resetConfirm();
    queue = { items: [], i: 0 };
    saveQ();
    key = {};
    keyConflicts = [];
    store.del('ansKey');
    store.del('ansKeyBatch');
    store.del('ansKeyConflicts');
    $('ans_msg').textContent = 'Queue and key cleared.';
    $('ocr_input').hidden = false;
    renderOCR();
  };
  $('ocr_show').onclick = () => { $('ocr_input').hidden = false; $('ocr_text').focus(); };
  $('ocr_auto_start').onclick = () => runAuto();
  $('ocr_active_mode').onchange = () => {
    if (autoRunning) { $('ocr_active_mode').checked = activeMode; return; }
    activeMode = $('ocr_active_mode').checked;
    if (!activeMode) activeConfirmed = false;
    renderAuto();
  };
  $('ocr_auto_stop').onclick = () => { stopAuto = true; autoStatus = 'Stopping after the current save.'; renderAuto(); };
  $('ocr_auto_dry').onclick = () => runDry();
  $('ocr_saved_copy').onclick = () => copyText(savedCopyText());
  $('ocr_paused_clear').onclick = () => { store.del('ocrSaving'); lastBlocked = ''; renderAuto(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && autoRunning) {
      stopAuto = true;
      autoStatus = 'Paused because the tab was hidden. Start again when ready.';
      renderAuto();
    }
  });
  FIELDS.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', () => {
      if (autoRunning) stopAuto = true;
      resetConfirm();
      renderAuto();
    });
  });
  let key = {};
  let keyConflicts = [];
  try { key = store.get('ansKey') || {}; } catch (e) {}
  try { keyConflicts = store.get('ansKeyConflicts') || []; } catch (e) {}
  if (!Array.isArray(keyConflicts)) keyConflicts = [];
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
    if (busySaving()) return;
    if (autoRunning) stopAuto = true;
    resetConfirm();
    key = {};
    keyConflicts = [];
    store.del('ansKey');
    store.del('ansKeyBatch');
    store.del('ansKeyConflicts');
    $('ans_msg').textContent = 'Key cleared.';
    renderAuto();
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!queue.items.length) saveMeta();
    const b = form.querySelector('button[type=submit]'), r = $('ans_res');
    if (saveInProgress) return;
    let marker = null;
    try { marker = store.get('ocrSaving'); } catch (err) {}
    if (marker) {
      setResult("An earlier save is unconfirmed. Check the list, then tap 'I checked. Clear warning.'", true);
      return;
    }
    if (autoRunning) stopAuto = true;
    b.disabled = true;
    setResult('Saving...', false);
    saveCurrentQuestion({ auto: false }).then(() => { b.disabled = false; renderAuto(); }).catch(() => { b.disabled = false; renderAuto(); });
  }, true);
  setInterval(() => {
    const c = cur().i;
    if (c !== last) {
      last = c;
      tick();
    }
  }, 600);
  hadServerError ? renderOCR() : showOCR();
  tick();
}
