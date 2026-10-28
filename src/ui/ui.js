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
  p.innerHTML = `<style>#ocr_auto_start:disabled{opacity:.45;cursor:not-allowed;filter:grayscale(1)}#ocr_auto_start:disabled:hover{background:#1769aa}</style><div id="ocr_input"><label for="ocr_text">Paste the WHOLE block: questions + answer key (one box)</label><textarea id="ocr_text" style="min-height:220px"></textarea><button type="button" class="admin-btn admin-btn-muted" id="ocr_paste_clipboard">Paste clipboard</button> <button type="button" class="admin-btn" id="ocr_load">Load questions + key</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button><div class="admin-note">Recommended divider on its own line: <code>=== ANSWER KEY ===</code>. Varying headers are auto-detected otherwise. To fix the key mid-queue: Show paste box, paste ONLY the key, Load (queue is kept).</div></div><div id="ocr_status" class="admin-note"></div><div id="ocr_image_plan" class="admin-note" hidden></div><div id="ocr_auto"><div id="ocr_dry_panel" style="border-left:3px solid #0f766e;padding-left:8px;margin-bottom:10px"><div id="ocr_dry_status" class="admin-note" style="font-weight:bold"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_auto_dry">Dry run</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_auto_dry_stop" disabled>Stop dry run</button><div id="ocr_dry_progress" class="admin-note" hidden><div style="display:flex;align-items:center;gap:8px"><progress id="ocr_dry_progress_bar" max="1" value="0" style="flex:1;height:10px;accent-color:#0f766e"></progress><span id="ocr_dry_progress_text" style="min-width:64px;text-align:right"></span></div></div><div id="ocr_dry_blocked" class="admin-note"></div></div><div id="ocr_live_panel" style="border-left:3px solid #6b7280;padding-left:8px"><div id="ocr_live_status" class="admin-note" style="font-weight:bold"></div><button type="button" class="admin-btn" id="ocr_auto_start" disabled>Start auto-save</button> <label class="admin-note" style="display:inline-block;margin:0 8px"><input type="checkbox" id="ocr_active_mode"> Save as active (live immediately)</label> <button type="button" class="admin-btn admin-btn-muted" id="ocr_auto_stop" disabled>Stop</button><div id="ocr_batch_confirm" class="admin-note" hidden></div><div id="ocr_live_progress" class="admin-note" hidden><div style="display:flex;align-items:center;gap:8px"><progress id="ocr_live_progress_bar" max="1" value="0" style="flex:1;height:10px;accent-color:#1769aa"></progress><span id="ocr_live_progress_text" style="min-width:64px;text-align:right"></span></div></div><div id="ocr_live_blocked" class="admin-note"></div></div><div id="ocr_saved_box" class="admin-note" hidden><div id="ocr_saved_list"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_saved_copy">Copy saved list</button></div><div id="ocr_batch_history" class="admin-note" hidden><div id="ocr_batch_history_list"></div></div><div id="ocr_paused" class="admin-alert admin-error" hidden><div id="ocr_paused_text"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_paused_clear">I checked. Clear warning.</button> <a class="admin-btn admin-btn-muted" id="ocr_paused_check" href="#" hidden>Open filtered list</a></div></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_goto" hidden>Go to question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_show" style="margin-left:8px">Show paste box</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear saved key</button><div id="ans_msg" class="admin-note"></div>`;
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
  let imagePlan = [];
  const imagePending = new Map();
  const saveQ = () => store.set('ocrQueue', queue);
  let last = queue.i;
  let savedLog = [];
  try { savedLog = store.get('ocrSavedLog') || []; } catch (e) {}
  if (!Array.isArray(savedLog)) savedLog = [];
  let batchHistory = [];
  try {
    const storedHistory = store.get('ocrBatchHistory');
    if (Array.isArray(storedHistory)) batchHistory = storedHistory;
  } catch (e) {}
  let saveInProgress = false;
  let dryRunning = false;
  let dryStop = false;
  let dryState = 'idle';
  let dryStatus = '';
  let dryBlocked = '';
  let dryStamp = null;
  let dryChecked = 0;
  let dryTotal = 0;
  let dryImageCount = 0;
  let liveRunning = false;
  let liveStop = false;
  let liveState = 'idle';
  let liveStatus = '';
  let liveBlocked = '';
  let liveMode = null;
  let liveRunCount = 0;
  let loadToken = 0;
  let liveToken = 0;
  let unverifiedStreak = 0;
  let autoTabId = newBatchId();
  let autoHeartbeat = null;
  let confirmTicked = true;
  let confirmedMeta = null;
  let activeMode = true;
  let activeConfirmed = true;
  const anyRunning = () => dryRunning || liveRunning;
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
    if (!liveRunning) return;
    const step = heartbeatTick({
      lock: readLock(),
      tabId: autoTabId,
      now: Date.now(),
      write: lock => store.set('autoLock', lock),
      release: releaseLock
    });
    if (step.stop) { liveStop = true; return; }
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
      runMode: liveMode,
      radioLetter: radio ? 'ABCD'[Number(radio.value)] : null,
      hasImage: Boolean(e.question_image && (e.question_image.value || (e.question_image.files && e.question_image.files.length))),
      hasVideo: Boolean(e.answer_video && (e.answer_video.value || (e.answer_video.files && e.answer_video.files.length))),
      hasExplanation: Boolean(e.answer_explanation && e.answer_explanation.value && e.answer_explanation.value.trim()),
      savingMarker: (() => { try { return store.get('ocrSaving'); } catch (err) { return null; } })(),
      saveInProgress: saveInProgress,
      stopRequested: liveStop,
      lock: readLock(),
      tabId: autoTabId,
      now: Date.now(),
      visible: !document.hidden,
      savedLog: savedLog,
      imagePlan: imagePlan,
      recentRows: recentRows(),
      form: {
        question: e.question_text ? e.question_text.value : '',
        options: ['option_a', 'option_b', 'option_c', 'option_d'].map(id => e[id] ? e[id].value : '')
      }
    };
  }
  function planNums(row) {
    const list = row && Array.isArray(row.nums) ? row.nums : [];
    return list.map(n => Number(n)).filter(n => Number.isInteger(n) && n > 0);
  }
  function planReady(row) {
    return Boolean(row && row.file && typeof row.name === 'string' && row.name.trim() && planNums(row).length);
  }
  function planRowFor(num) {
    return imagePlan.find(row => planReady(row) && planNums(row).includes(Number(num))) || null;
  }
  function stimulusPlan(stim) {
    return imagePlan.find(row => row && String(row.stimulusId) === String(stim.id)) || null;
  }
  function detectedStimuli() {
    const list = [];
    queue.items.forEach(item => {
      (item && Array.isArray(item.stimuli) ? item.stimuli : []).forEach(stim => { if (stim) list.push(stim); });
    });
    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }
  function needsImageQuestions() {
    return queue.items.filter(item => item && item.needsImage && Number.isInteger(item.num));
  }
  function queueNumberSet() {
    return new Set(queue.items.map(item => item.num).filter(Number.isInteger));
  }
  function formatPlanRange(nums) {
    const list = (Array.isArray(nums) ? nums : []).map(Number).filter(n => Number.isInteger(n) && n > 0);
    if (!list.length) return '';
    if (list.length === 1) return String(list[0]);
    let contiguous = true;
    for (let i = 1; i < list.length; i++) if (list[i] !== list[i - 1] + 1) { contiguous = false; break; }
    return contiguous ? list[0] + '-' + list[list.length - 1] : list.join(', ');
  }
  function parsePlanRange(text) {
    return parseStimulusRange(text);
  }
  function planStatus(row) {
    if (!planReady(row)) return 'No image';
    const known = queueNumberSet();
    const bad = planNums(row).filter(n => !known.has(n));
    if (bad.length) return 'Range not in this paste: ' + bad.join(', ');
    return 'Ready';
  }
  function setImagePlanRow(stimulusId, nums, file) {
    const entry = {
      stimulusId: stimulusId == null ? null : stimulusId,
      nums: (Array.isArray(nums) ? nums : []).slice(),
      file: file,
      name: file && file.name ? String(file.name) : ''
    };
    const at = imagePlan.findIndex(row => stimulusId == null ? row && row.stimulusId == null : row && String(row.stimulusId) === String(stimulusId));
    if (at > -1) imagePlan[at] = entry;
    else imagePlan.push(entry);
    return entry;
  }
  function clearImagePlan() {
    imagePlan = [];
    imagePending.clear();
  }
  function imageGateBlockers() {
    try {
      return autosaveBlockers(gateState()).filter(blocker => blocker && (
        blocker.code === 'stimulus-unassigned' || blocker.code === 'stimulus-range' || blocker.code === 'image-required'
      ));
    } catch (e) {
      return [];
    }
  }
  function pickFile(input) {
    const files = input && input.files;
    if (files && files[0]) return files[0];
    return input && input.value ? { name: String(input.value).split(/[\\/]/).pop() } : null;
  }
  function fileLine(file) {
    if (!file) return '';
    const size = Number(file.size);
    return String(file.name || '') + (Number.isFinite(size) ? ' (' + size + ' bytes)' : '');
  }
  function renderImagePlan() {
    const box = $('ocr_image_plan');
    if (!box) return;
    box.textContent = '';
    const stimuli = detectedStimuli();
    const needs = needsImageQuestions();
    box.hidden = !stimuli.length && !needs.length;
    if (box.hidden) return;
    const known = queueNumberSet();
    const heading = document.createElement('div');
    heading.style.fontWeight = 'bold';
    heading.textContent = 'Image plan (this tab only; reload clears files)';
    box.appendChild(heading);
    stimuli.forEach((stim, idx) => {
      const row = document.createElement('div');
      row.style.margin = '6px 0';
      row.style.paddingLeft = '6px';
      row.style.borderLeft = '3px solid #1769aa';
      const plan = stimulusPlan(stim);
      const title = document.createElement('div');
      title.textContent = 'Image block ' + (Number.isInteger(stim.order) ? stim.order : idx + 1)
        + (Number.isInteger(stim.sourceNum) ? ' (after Q' + stim.sourceNum + ')' : '');
      row.appendChild(title);
      const range = document.createElement('input');
      range.type = 'text';
      range.id = 'ocr_img_range_' + idx;
      range.value = formatPlanRange(plan ? planNums(plan) : stim.nums);
      range.placeholder = 'e.g. 14-15';
      row.appendChild(range);
      row.appendChild(document.createTextNode(' '));
      const file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.id = 'ocr_img_file_' + idx;
      const selected = document.createElement('span');
      selected.id = 'ocr_img_file_name_' + idx;
      selected.textContent = fileLine(imagePending.get(stim.id) || (plan && plan.file));
      file.onchange = () => {
        const chosen = pickFile(file);
        if (chosen) imagePending.set(stim.id, chosen);
        else imagePending.delete(stim.id);
        selected.textContent = fileLine(chosen || (plan && plan.file));
      };
      row.appendChild(file);
      row.appendChild(selected);
      const attach = document.createElement('button');
      attach.type = 'button';
      attach.className = 'admin-btn admin-btn-muted';
      attach.id = 'ocr_img_attach_' + idx;
      attach.textContent = plan && plan.file ? 'Replace' : 'Attach';
      attach.onclick = () => {
        const chosen = imagePending.get(stim.id) || pickFile(file);
        const nums = parsePlanRange(range.value);
        if (!chosen || !nums.length) return;
        setImagePlanRow(stim.id, nums, chosen);
        imagePending.delete(stim.id);
        renderImagePlan();
        renderAuto();
      };
      row.appendChild(attach);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'admin-btn admin-btn-muted';
      remove.id = 'ocr_img_remove_' + idx;
      remove.textContent = 'Remove';
      remove.onclick = () => {
        imagePlan = imagePlan.filter(entry => !entry || String(entry.stimulusId) !== String(stim.id));
        imagePending.delete(stim.id);
        renderImagePlan();
        renderAuto();
      };
      row.appendChild(remove);
      const status = document.createElement('div');
      status.id = 'ocr_img_status_' + idx;
      status.textContent = planStatus(plan);
      status.style.fontWeight = 'bold';
      status.style.color = planStatus(plan) === 'Ready' ? '#0d6b3f' : (planStatus(plan) === 'No image' ? '' : '#b45309');
      row.appendChild(status);
      box.appendChild(row);
    });
    if (stimuli.length) {
      const bulkFiles = document.createElement('input');
      bulkFiles.type = 'file';
      bulkFiles.accept = 'image/*';
      bulkFiles.multiple = true;
      bulkFiles.id = 'ocr_img_bulk_files';
      box.appendChild(bulkFiles);
      const bulk = document.createElement('button');
      bulk.type = 'button';
      bulk.className = 'admin-btn admin-btn-muted';
      bulk.id = 'ocr_img_bulk';
      bulk.textContent = 'Use ranges in order';
      bulk.onclick = () => {
        const picked = bulkFiles.files ? Array.from(bulkFiles.files) : [];
        stimuli.forEach((stim, idx) => {
          const chosen = picked[idx] || imagePending.get(stim.id);
          if (!chosen) return;
          const input = $('ocr_img_range_' + idx);
          const nums = parsePlanRange(input ? input.value : '');
          if (!nums.length) return;
          setImagePlanRow(stim.id, nums, chosen);
          if (!picked[idx]) imagePending.delete(stim.id);
        });
        renderImagePlan();
        renderAuto();
      };
      box.appendChild(bulk);
    }
    const stimNums = new Set();
    stimuli.forEach(stim => (Array.isArray(stim.nums) ? stim.nums : []).forEach(n => stimNums.add(Number(n))));
    const uncovered = needs.filter(item => !stimNums.has(Number(item.num))).map(item => item.num);
    const generic = imagePlan.find(entry => entry && entry.stimulusId == null) || null;
    if (uncovered.length || generic) {
      const row = document.createElement('div');
      row.style.margin = '6px 0';
      row.style.paddingLeft = '6px';
      row.style.borderLeft = '3px solid #6b7280';
      const title = document.createElement('div');
      title.textContent = 'Add image for other questions';
      row.appendChild(title);
      const range = document.createElement('input');
      range.type = 'text';
      range.id = 'ocr_img_generic_range';
      range.value = formatPlanRange(generic ? planNums(generic) : uncovered);
      range.placeholder = 'e.g. 18';
      row.appendChild(range);
      row.appendChild(document.createTextNode(' '));
      const file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.id = 'ocr_img_generic_file';
      row.appendChild(file);
      const attach = document.createElement('button');
      attach.type = 'button';
      attach.className = 'admin-btn admin-btn-muted';
      attach.id = 'ocr_img_generic_attach';
      attach.textContent = generic && generic.file ? 'Replace' : 'Attach';
      attach.onclick = () => {
        const chosen = pickFile(file);
        const nums = parsePlanRange(range.value);
        if (!chosen || !nums.length) return;
        setImagePlanRow(null, nums, chosen);
        renderImagePlan();
        renderAuto();
      };
      row.appendChild(attach);
      if (generic) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'admin-btn admin-btn-muted';
        remove.id = 'ocr_img_generic_remove';
        remove.textContent = 'Remove';
        remove.onclick = () => {
          imagePlan = imagePlan.filter(entry => !entry || entry.stimulusId != null);
          renderImagePlan();
          renderAuto();
        };
        row.appendChild(remove);
      }
      const status = document.createElement('div');
      status.id = 'ocr_img_generic_status';
      status.textContent = generic ? planStatus(generic) : 'No image';
      status.style.fontWeight = 'bold';
      row.appendChild(status);
      box.appendChild(row);
    }
    const missing = needs.map(item => item.num).filter(num => !planRowFor(num));
    missing.forEach(num => {
      const line = document.createElement('div');
      line.id = 'ocr_img_missing_' + num;
      line.textContent = 'Question Q' + num + ' needs an image.';
      line.style.color = '#b45309';
      line.style.fontWeight = 'bold';
      box.appendChild(line);
    });
  }
  function batchLabel() {
    const meta = currentMeta();
    const name = (meta.subjectText || '?') + ' / ' + (meta.categoryText || '?') + ' / ' + (meta.year || '?');
    const count = queue.items.length;
    if (!count) return name;
    const first = queue.items[0].num;
    const last = queue.items[count - 1].num;
    const range = first != null && last != null ? ' (#' + first + ' to #' + last + ')' : '';
    return name + ' — ' + count + ' question' + (count === 1 ? '' : 's') + range;
  }
  function renderBatchConfirm() {
    const box = $('ocr_batch_confirm');
    if (!box) return;
    box.textContent = '';
    if (!queue.items.length) { box.hidden = true; return; }
    box.hidden = false;
    const meta = currentMeta();
    if (confirmTicked && !confirmedMeta) confirmedMeta = { subject: meta.subject, category: meta.category, year: meta.year };
    const summary = document.createElement('div');
    summary.textContent = 'Batch: ' + batchLabel() + ', ' + Object.keys(key).length + ' key answers.';
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
      activeConfirmed = cb.checked;
      if (cb.checked) {
        const m = currentMeta();
        confirmedMeta = { subject: m.subject, category: m.category, year: m.year };
      } else {
        confirmedMeta = null;
      }
      renderAuto();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(activeMode
      ? ' I checked the batch and understand these save live.'
      : ' I checked the batch details.'));
    box.appendChild(label);
  }
  function savedCopyText() {
    const entries = savedForBatch(savedLog, queue.batchId);
    if (!entries.length) return 'No saves in this batch.';
    return 'Batch: ' + batchLabel() + '\n' + entries.map(entry => unverifiedSaves([entry]).length
      ? 'Question ' + entry.num + ' (#' + entry.id + '): active status not verified'
      : 'Question ' + entry.num + ' saved as #' + entry.id + '.'
    ).join('\n');
  }
  function renderSaved() {
    const box = $('ocr_saved_box');
    const list = $('ocr_saved_list');
    if (!box || !list) return;
    const entries = savedForBatch(savedLog, queue.batchId);
    const warned = entries.length > 0 && unverifiedSaves(entries).length > 0;
    box.hidden = !entries.length;
    list.textContent = '';
    if (!entries.length) return;
    box.style.color = warned ? '#8a4b00' : '#0d6b3f';
    box.style.background = warned ? '#fff4e5' : '#eef8f1';
    box.style.border = '1px solid ' + (warned ? '#d97706' : '#2e9e63');
    box.style.borderLeft = '4px solid ' + (warned ? '#d97706' : '#2e9e63');
    box.style.borderRadius = '6px';
    box.style.padding = '8px 10px';
    box.style.marginTop = '10px';
    list.style.fontWeight = 'bold';
    const batchLine = document.createElement('div');
    batchLine.textContent = 'Batch: ' + batchLabel();
    const savedLine = document.createElement('div');
    savedLine.textContent = formatSavedRange(entries);
    list.appendChild(batchLine);
    list.appendChild(savedLine);
  }
  function formatBatchHistoryDate(ms) {
    const d = new Date(Number(ms));
    if (!Number.isFinite(d.getTime())) return '?';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = n => String(n).padStart(2, '0');
    return pad(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function formatBatchHistoryIds(ids) {
    const unique = Array.from(new Set((Array.isArray(ids) ? ids : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))).sort((a, b) => a - b);
    if (!unique.length) return '';
    if (unique.length === 1) return '1 saved (#' + unique[0] + ')';
    let contiguous = true;
    for (let i = 1; i < unique.length; i++) {
      if (unique[i] !== unique[i - 1] + 1) { contiguous = false; break; }
    }
    const range = contiguous
      ? '#' + unique[0] + '–#' + unique[unique.length - 1]
      : unique.map(id => '#' + id).join(', ');
    return unique.length + ' saved (' + range + ')';
  }
  function renderBatchHistory() {
    const box = $('ocr_batch_history');
    const list = $('ocr_batch_history_list');
    if (!box || !list) return;
    list.textContent = '';
    const lines = [];
    (Array.isArray(batchHistory) ? batchHistory : []).slice(0, 15).forEach(entry => {
      if (!entry || !entry.batchId || !Array.isArray(entry.ids) || !entry.ids.length) return;
      const saved = formatBatchHistoryIds(entry.ids);
      if (!saved) return;
      const meta = [entry.subject || '?', entry.category || '?', entry.year || '?'].join(' / ');
      lines.push(formatBatchHistoryDate(entry.at) + ' · ' + meta + ' · ' + saved
        + (entry.mode ? ' · ' + entry.mode : ''));
    });
    box.hidden = lines.length === 0;
    if (!lines.length) return;
    lines.forEach(line => {
      const row = document.createElement('div');
      row.textContent = line;
      list.appendChild(row);
    });
  }
  function recordBatchHistory() {
    try {
      const meta = currentMeta();
      const entry = makeBatchHistoryEntry({
        batchId: queue.batchId,
        subject: meta.subjectText || meta.subject,
        category: meta.categoryText || meta.category,
        year: meta.year,
        entries: savedForBatch(savedLog, queue.batchId),
        at: Date.now()
      });
      if (!entry) return;
      let stored = batchHistory;
      try {
        const current = store.get('ocrBatchHistory');
        if (Array.isArray(current)) stored = current;
      } catch (e) {}
      batchHistory = upsertBatchHistory(stored, entry, 15);
      store.set('ocrBatchHistory', batchHistory);
    } catch (e) {}
    try { renderBatchHistory(); } catch (e) {}
  }
  function renderPaused() {
    const box = $('ocr_paused');
    const text = $('ocr_paused_text');
    const link = $('ocr_paused_check');
    if (!box || !text) return;
    let marker = null;
    try { marker = store.get('ocrSaving'); } catch (e) {}
    if (!marker || saveInProgress) { box.hidden = true; if (link) link.hidden = true; return; }
    box.hidden = false;
    const when = marker.at ? new Date(marker.at).toLocaleTimeString() : 'an earlier time';
    text.textContent = 'Question ' + (marker.num == null ? '?' : marker.num) + ' may have saved at ' + when + '. It was not retried. Check Recently Added Questions first.';
    if (link) {
      let url = checkListUrl(location.pathname, marker);
      if (!url) {
        try {
          const meta = store.get('ocrMeta');
          if (meta) url = checkListUrl(location.pathname, { subject: meta.subject_id, category: meta.exam_category_id, year: meta.exam_year });
        } catch (e) {}
      }
      link.hidden = !url;
      if (url) link.href = url;
    }
  }
  const DRY_COLORS = { idle: '#0f766e', running: '#0f766e', stopping: '#0f766e', complete: '#0f766e', stale: '#0f766e', stopped: '#b45309', blocked: '#b45309' };
  const LIVE_COLORS = { idle: '#6b7280', running: '#1769aa', stopping: '#b45309', stopped: '#b45309', paused: '#b45309', incomplete: '#b45309', complete: '#0d6b3f', blocked: '#b00020', 'needs-check': '#b00020' };
  function dryLabel() { return dryState.toUpperCase(); }
  function liveLabel() { return liveState === 'needs-check' ? 'NEEDS-CHECK' : liveState.toUpperCase(); }
  function renderDryProgress() {
    const box = $('ocr_dry_progress');
    const bar = $('ocr_dry_progress_bar');
    const label = $('ocr_dry_progress_text');
    if (!box || !bar || !label) return;
    box.hidden = !dryTotal;
    if (!dryTotal) return;
    bar.max = dryTotal;
    bar.value = Math.min(dryChecked, dryTotal);
    label.textContent = dryChecked + '/' + dryTotal;
  }
  function renderLiveProgress() {
    const box = $('ocr_live_progress');
    const bar = $('ocr_live_progress_bar');
    const label = $('ocr_live_progress_text');
    if (!box || !bar || !label) return;
    const total = queue.items.length;
    box.hidden = !total;
    if (!total) return;
    bar.max = total;
    bar.value = Math.min(queue.i, total);
    label.textContent = queue.i + '/' + total + (liveMode ? ' · ' + (liveMode === 'active' ? 'ACTIVE' : 'draft') : '');
  }
  function renderDry() {
    const status = $('ocr_dry_status');
    if (!status) return;
    let detail = dryStatus;
    if (dryState === 'running') detail = dryChecked + '/' + dryTotal + ' checked.';
    else if (dryState === 'idle' && !detail) detail = 'Dry run is idle.';
    status.textContent = dryLabel() + (detail ? ' — ' + detail : '');
    status.style.color = DRY_COLORS[dryState] || '#0f766e';
    const panel = $('ocr_dry_panel');
    if (panel) panel.style.borderLeftColor = status.style.color;
    const blocked = $('ocr_dry_blocked');
    blocked.textContent = dryBlocked;
    blocked.style.color = dryBlocked ? '#b45309' : '';
    blocked.style.fontWeight = dryBlocked ? 'bold' : '';
    renderDryProgress();
  }
  function renderLive() {
    const status = $('ocr_live_status');
    if (!status) return;
    let detail = liveStatus;
    if (liveState === 'running') {
      detail = (liveMode === 'active' ? 'ACTIVE' : 'draft') + ': ' + queue.i + '/' + queue.items.length + ' done · ' + liveRunCount + ' saved this run.';
    } else if (liveState === 'idle' && !detail) {
      detail = savedForBatch(savedLog, queue.batchId).length ? 'Idle.' : 'Auto-save is idle.';
    }
    status.textContent = liveLabel() + (detail ? ' — ' + detail : '');
    status.style.color = LIVE_COLORS[liveState] || '#6b7280';
    const panel = $('ocr_live_panel');
    if (panel) panel.style.borderLeftColor = status.style.color;
    const blocked = $('ocr_live_blocked');
    blocked.textContent = liveBlocked;
    blocked.style.color = liveBlocked ? '#b00020' : '';
    blocked.style.fontWeight = liveBlocked ? 'bold' : '';
    renderLiveProgress();
  }
  function renderAuto() {
    if (!$('ocr_live_status')) return;
    const modeBox = $('ocr_active_mode');
    if (modeBox) {
      modeBox.disabled = anyRunning();
      modeBox.checked = activeMode;
    }
    renderBatchConfirm();
    const marker = (() => { try { return store.get('ocrSaving'); } catch (e) { return null; } })();
    const disabled = anyRunning() || !confirmTicked || (activeMode && !activeConfirmed) || Boolean(marker) || !queue.items[queue.i] || imageGateBlockers().length > 0;
    $('ocr_auto_start').disabled = disabled;
    $('ocr_auto_stop').disabled = !liveRunning;
    $('ocr_auto_dry').disabled = anyRunning();
    $('ocr_auto_dry_stop').disabled = !dryRunning;
    renderDry();
    renderLive();
    renderSaved();
    renderBatchHistory();
    renderPaused();
  }
  function syncLiveStateFromStorage() {
    const derived = deriveLiveState(queue, savedLog);
    liveBlocked = '';
    liveRunCount = 0;
    if (derived === 'complete') {
      liveState = 'complete';
      liveStatus = 'Batch complete: ' + batchLabel() + ' · ' + savedForBatch(savedLog, queue.batchId).length + ' saved.';
    } else if (derived === 'incomplete') {
      liveState = 'incomplete';
      liveStatus = 'queue resumed at ' + (queue.i + 1) + ' of ' + queue.items.length;
    } else {
      liveState = 'idle';
      liveStatus = '';
    }
  }
  function invalidateDry(reason) {
    if (dryRunning) {
      dryStop = true;
      dryState = 'stale';
      dryStatus = reason || '';
      dryBlocked = '';
      return;
    }
    if (dryState !== 'idle') {
      dryState = 'stale';
      dryStatus = reason || '';
      dryBlocked = '';
    }
  }
  function scheduleAutoDry() {
    const token = ++loadToken;
    const attempt = () => {
      if (token !== loadToken) return;
      if (!queue.items.length) return;
      if (anyRunning()) { setTimeout(attempt, 100); return; }
      runDry();
    };
    setTimeout(attempt, 0);
  }
  function resetConfirm() {
    confirmTicked = true;
    confirmedMeta = null;
    activeMode = true;
    activeConfirmed = true;
    const modeBox = $('ocr_active_mode');
    if (modeBox) modeBox.checked = true;
  }
  function clearConfirm() {
    confirmTicked = false;
    confirmedMeta = null;
    activeConfirmed = false;
  }
  function showLiveBlocked(blocker) {
    liveBlocked = blockerText(blocker);
    liveState = 'blocked';
  }
  function setResult(text, danger) {
    const r = $('ans_res');
    if (!r) return;
    r.textContent = text;
    r.style.color = danger ? '#b00020' : '#1769aa';
  }
  function busySaving() {
    if (!saveInProgress) return false;
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
    liveBlocked = busyNotice;
    renderAuto();
    return true;
  }
  function markLiveComplete() {
    const savedCount = savedForBatch(savedLog, queue.batchId).length;
    liveState = 'complete';
    liveStatus = 'Batch complete: ' + batchLabel() + ' · ' + savedCount + ' saved.';
    liveBlocked = '';
  }
  function markLiveStopped() {
    if (liveState !== 'paused' && liveState !== 'needs-check' && liveState !== 'blocked') {
      liveState = 'stopped';
      liveStatus = 'Stopped.';
    }
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
        const markerMeta = currentMeta();
        store.set('ocrSaving', {
          num: num,
          at: Date.now(),
          subject: markerMeta.subject,
          category: markerMeta.category,
          year: markerMeta.year
        });
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
      const nativeImage = form.elements.question_image
        && (form.elements.question_image.value || (form.elements.question_image.files && form.elements.question_image.files.length));
      let usedPlanRow = null;
      if (!nativeImage) {
        usedPlanRow = planRowFor(num);
        if (usedPlanRow) fd.set('question_image', usedPlanRow.file, usedPlanRow.name);
      }
      const fingerprint = makeSavedFingerprint({
        subject_id: fd.get('subject_id'),
        exam_category_id: fd.get('exam_category_id'),
        exam_year: fd.get('exam_year'),
        question_text: fd.get('question_text')
      }, { subject: selectedText('subject_id'), category: selectedText('exam_category_id') });
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctl) timer = setTimeout(() => ctl.abort(), usedPlanRow ? 60000 : 30000);
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
      if (fingerprint) entry.fp = fingerprint;
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
        liveBlocked = failText;
        setResult(failText, true);
        if (auto) { liveStop = true; liveState = 'needs-check'; }
        return { kind: 'saved', id: result.id, inactive: inactive, entry: entry, failed: committed.stage };
      }
      recordBatchHistory();
      if (usedPlanRow) {
        const laterNeeds = queue.items.slice(savedIndex + 1)
          .some(item => item && item.needsImage && planNums(usedPlanRow).includes(item.num));
        if (!laterNeeds) imagePlan = imagePlan.filter(row => row !== usedPlanRow);
      }
      if (sameQueue && q) invalidateDry('a save advanced the queue');
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
          liveStop = true;
        }
      }
      if (auto && inactive === null) {
        if (unverifiedStop) {
          liveBlocked = 'Stopped after 2 unverified checks. Check the saved list before continuing.';
          liveState = 'needs-check';
          setResult(liveBlocked, true);
        } else {
          setResult('Saved as #' + result.id + '. Could not verify; check the list.', false);
        }
      } else if (auto && inactive === !active) {
        setResult('Saved as question #' + result.id + ' (' + (active ? 'active' : 'inactive') + ').', false);
      } else if (auto && active) {
        setResult('SAVED AS INACTIVE: question #' + result.id + ' is not live. Check the list.', true);
        liveStop = true;
        liveState = 'needs-check';
      } else if (auto) {
        setResult('SAVED AS ACTIVE: question #' + result.id + '. Check the list and turn it off.', true);
        liveStop = true;
        liveState = 'needs-check';
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
      if (liveBlocked === busyNotice) liveBlocked = '';
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
    renderImagePlan();
    renderAuto();
  }
  function showOCR(auto) {
    if (queue.items[queue.i]) fillForm(queue.items[queue.i], auto);
    renderOCR();
  }
  function copyText(text) {
    const done = () => { if (liveState === 'idle') liveStatus = 'Saved list copied.'; renderAuto(); };
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
    if (anyRunning()) return;
    dryRunning = true;
    dryStop = false;
    dryState = 'running';
    dryStatus = '';
    dryBlocked = '';
    dryChecked = 0;
    dryImageCount = 0;
    const dq = { items: queue.items.slice(), i: queue.i, batchId: queue.batchId };
    dryTotal = Math.max(0, dq.items.length - dq.i);
    renderAuto();
    while (true) {
      const q = dq.items[dq.i];
      if (!q) break;
      if (dryStop) {
        if (dryState !== 'stale') {
          dryState = 'stopped';
          dryStatus = 'stopped at ' + dryChecked + '/' + dryTotal + '.';
        }
        break;
      }
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
        dryState = 'blocked';
        dryBlocked = blockerText(blockers[0]);
        dryStatus = dryChecked + ' of ' + dryTotal + ' checked; stops at #' + (q.num == null ? '?' : q.num) + '.';
        break;
      }
      if (planRowFor(q.num)) dryImageCount++;
      dq.i++;
      dryChecked++;
      renderAuto();
      await sleep(0);
    }
    if (dryState === 'running' || dryState === 'stopping') {
      if (dryState === 'stopping' || dryStop) {
        dryState = 'stopped';
        dryStatus = 'stopped at ' + dryChecked + '/' + dryTotal + '.';
      } else if (!dryTotal) {
        dryState = 'complete';
        dryStatus = 'Nothing to dry-run.';
      } else {
        dryState = 'complete';
        dryStatus = 'all ' + dryTotal + ' would save as ' + (activeMode ? 'ACTIVE' : 'draft')
          + (dryImageCount ? '; ' + dryImageCount + ' with image attached' : '') + '.';
      }
    }
    dryRunning = false;
    dryStop = false;
    dryStamp = dryState === 'stale' ? null : JSON.stringify({
      batchId: queue.batchId || '',
      i: queue.i,
      subject: currentMeta().subject,
      category: currentMeta().category,
      year: currentMeta().year,
      key: JSON.stringify(key),
      activeMode: activeMode
    });
    renderAuto();
  }
  async function runAuto() {
    if (anyRunning()) return;
    const runToken = ++liveToken;
    liveStop = false;
    liveRunCount = 0;
    unverifiedStreak = 0;
    liveBlocked = '';
    liveStatus = '';
    liveMode = activeMode ? 'active' : 'draft';
    const initial = autosaveBlockers(gateState());
    if (initial.length) { showLiveBlocked(initial[0]); renderAuto(); return; }
    if (!acquireLock()) { showLiveBlocked({ code: 'lock', detail: 'Another tab is auto-saving.' }); renderAuto(); return; }
    liveRunning = true;
    liveState = 'running';
    renderAuto();
    try {
      while (true) {
        if (runToken !== liveToken) return;
        if (!queue.items[queue.i]) { markLiveComplete(); break; }
        if (liveStop) { markLiveStopped(); break; }
        const blockers = autosaveBlockers(gateState());
        if (blockers.length) { showLiveBlocked(blockers[0]); break; }
        const result = await saveCurrentQuestion({ auto: true, active: liveMode === 'active' });
        if (runToken !== liveToken) return;
        if (result.kind !== 'saved') {
          if (result.message) liveBlocked = result.message;
          if (result.kind === 'ambiguous') liveState = 'needs-check';
          else liveState = 'blocked';
          break;
        }
        liveRunCount++;
        renderAuto();
        if (result.failed || liveState === 'needs-check') break;
        if (!queue.items[queue.i]) { markLiveComplete(); break; }
        if (liveStop) { markLiveStopped(); break; }
        await sleep(1500);
      }
    } finally {
      liveRunning = false;
      releaseLock();
      if (runToken === liveToken && (liveState === 'running' || liveState === 'stopping')) {
        liveState = 'blocked';
        liveBlocked = 'The run stopped after an unexpected error. Check the list before starting again.';
      }
      renderAuto();
    }
  }
  $('ocr_load').onclick = () => {
    if (busySaving()) return;
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; liveStatus = 'Stopping for a new Load.'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
    resetConfirm();
    const raw = $('ocr_text').value;
    const salvage = splitSectionsWithSalvage(raw);
    const parts = salvage.parts;
    const text = FIXES.reduce((t, [re, fix]) => t.replace(re, fix), parts.questions);
    const items = applyStimulusFlags(flagNumberingGaps(splitQuestionItems(text).map(parseQuestion)));
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
        invalidateDry('the answer key changed');
        renderOCR();
        $('ocr_status').innerHTML += ' Answer key only (' + Object.keys(key).length + ' entries, ' + parts.how + '). Question queue left unchanged.';
        scheduleAutoDry();
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
    clearImagePlan();
    saveQ();
    liveToken++;
    liveState = 'idle';
    liveStatus = '';
    liveBlocked = '';
    liveRunCount = 0;
    liveMode = null;
    invalidateDry('a new batch was loaded');
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
    scheduleAutoDry();
  };
  $('ocr_paste_clipboard').onclick = async () => {
    const ta = $('ocr_text');
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('unsupported');
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        ta.focus();
        return alert('Clipboard is empty.');
      }
      ta.value = text;
      ta.focus();
    } catch (e) {
      ta.focus();
      alert('Could not read the clipboard. Long-press the box and paste.');
    }
  };
  $('ocr_clear_text').onclick = () => { $('ocr_text').value = ''; };
  $('ocr_goto').onclick = () => {
    if (busySaving()) return;
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
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
    invalidateDry('the queue position changed');
    showOCR();
  };
  $('ocr_skip').onclick = () => {
    if (busySaving()) return;
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
    queue.i++;
    saveQ();
    invalidateDry('the queue position changed');
    showOCR();
  };
  $('ocr_reset').onclick = () => {
    if (busySaving()) return;
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
    resetConfirm();
    queue = { items: [], i: 0 };
    clearImagePlan();
    saveQ();
    key = {};
    keyConflicts = [];
    store.del('ansKey');
    store.del('ansKeyBatch');
    store.del('ansKeyConflicts');
    invalidateDry('the queue was reset');
    liveToken++;
    liveState = 'idle';
    liveStatus = '';
    liveBlocked = '';
    liveRunCount = 0;
    liveMode = null;
    $('ans_msg').textContent = 'Queue and key cleared.';
    $('ocr_input').hidden = false;
    renderOCR();
  };
  $('ocr_show').onclick = () => { $('ocr_input').hidden = false; $('ocr_text').focus(); };
  $('ocr_auto_start').onclick = () => runAuto();
  $('ocr_active_mode').onchange = () => {
    if (anyRunning()) { $('ocr_active_mode').checked = activeMode; return; }
    activeMode = $('ocr_active_mode').checked;
    clearConfirm();
    invalidateDry('the save mode changed');
    renderAuto();
  };
  $('ocr_auto_stop').onclick = () => {
    if (!liveRunning) return;
    liveStop = true;
    liveState = 'stopping';
    liveStatus = 'Stopping after the current save.';
    renderAuto();
  };
  $('ocr_auto_dry').onclick = () => runDry();
  $('ocr_auto_dry_stop').onclick = () => {
    if (!dryRunning) return;
    dryStop = true;
    dryState = 'stopping';
    dryStatus = 'Stopping.';
    renderAuto();
  };
  $('ocr_saved_copy').onclick = () => copyText(savedCopyText());
  $('ocr_paused_clear').onclick = () => { store.del('ocrSaving'); liveBlocked = ''; renderAuto(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && liveRunning) {
      liveStop = true;
      liveState = 'paused';
      liveStatus = 'Paused because the tab was hidden. Start again when ready.';
      renderAuto();
    }
  });
  FIELDS.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', () => {
      if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
      if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
      clearConfirm();
      invalidateDry('the metadata changed');
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
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
    if (dryRunning) { dryStop = true; if (dryState === 'running') dryState = 'stopping'; }
    clearConfirm();
    key = {};
    keyConflicts = [];
    store.del('ansKey');
    store.del('ansKeyBatch');
    store.del('ansKeyConflicts');
    invalidateDry('the answer key changed');
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
    if (liveRunning) { liveStop = true; if (liveState === 'running') liveState = 'stopping'; }
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
  syncLiveStateFromStorage();
  hadServerError ? renderOCR() : showOCR();
  tick();
}
