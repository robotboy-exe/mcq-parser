// Stimulus bookmarklet autosave, saved-log, and save-classification helpers.
// Product policy only: no parser logic, DOM, storage, or network.

function newBatchId(cryptoObj) {
  const c = cryptoObj || (typeof crypto !== 'undefined' ? crypto : null);
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID();
    } catch (e) {}
  }
  let r = '';
  while (r.length < 12) r += Math.random().toString(36).slice(2);
  return 'b' + Date.now().toString(36) + '-' + r.slice(0, 12);
}

function byteLength(s) {
  const text = String(s == null ? '' : s);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  return unescape(encodeURIComponent(text)).length;
}

function normalizeAnswer(s) {
  return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();
}

function makeSavedFingerprint(posted, labels) {
  const p = posted || {};
  const l = labels || {};
  const subjectId = String(p.subject_id == null ? '' : p.subject_id).trim();
  const categoryId = String(p.exam_category_id == null ? '' : p.exam_category_id).trim();
  const year = String(p.exam_year == null ? '' : p.exam_year).trim();
  const question = normalizeAnswer(p.question_text);
  if (!subjectId || !categoryId || !year || !question) return null;
  if (question.length > 4000) return null;
  return {
    v: 1,
    subjectId: subjectId,
    categoryId: categoryId,
    year: year,
    subject: String(l.subject == null ? '' : l.subject),
    category: String(l.category == null ? '' : l.category),
    question: question
  };
}

function completeFingerprint(fp) {
  if (!fp || fp.v !== 1) return null;
  const subjectId = String(fp.subjectId == null ? '' : fp.subjectId).trim();
  const categoryId = String(fp.categoryId == null ? '' : fp.categoryId).trim();
  const year = String(fp.year == null ? '' : fp.year).trim();
  const question = normalizeAnswer(fp.question);
  if (!subjectId || !categoryId || !year || !question) return null;
  return { subjectId: subjectId, categoryId: categoryId, year: year, question: question };
}

function optionLetters(q) {
  return ['a', 'b', 'c', 'd', 'e', 'f'].filter(l => (q[l] || '').trim()).map(l => l.toUpperCase());
}

function isConsecutiveQueue(items) {
  if (!Array.isArray(items) || !items.length) return false;
  let prev = null;
  for (const item of items) {
    const num = item && item.num;
    if (!Number.isInteger(num)) return false;
    if (prev !== null && num !== prev + 1) return false;
    prev = num;
  }
  return true;
}

function keyCoversQueue(key, items) {
  if (!key || !Array.isArray(items) || !items.length) return false;
  const nums = Object.keys(key);
  if (nums.length !== items.length) return false;
  const wanted = {};
  for (const item of items) {
    if (!item || !Number.isInteger(item.num)) return false;
    wanted[item.num] = true;
  }
  for (const n of nums) {
    if (!wanted[+n]) return false;
    if (!/^[A-F]$/.test(key[n])) return false;
  }
  return true;
}

function appendSavedLog(log, entry, cap) {
  const max = Number.isInteger(cap) && cap > 0 ? cap : 200;
  const list = Array.isArray(log) ? log : [];
  return list.concat([entry]).slice(-max);
}

function mergeSavedLog(stored, current, entry, cap) {
  const max = Number.isInteger(cap) && cap > 0 ? cap : 200;
  const list = [];
  const at = new Map();
  const merge = item => {
    if (!item) return;
    if (item.id == null) {
      list.push(item);
      return;
    }
    const key = String(item.id);
    const index = at.get(key);
    if (index == null) {
      at.set(key, list.length);
      list.push(item);
      return;
    }
    const prior = list[index];
    const next = Object.assign({}, item);
    if (next.mode == null && prior && prior.mode != null) next.mode = prior.mode;
    list[index] = next;
  };
  (Array.isArray(stored) ? stored : []).forEach(merge);
  (Array.isArray(current) ? current : []).forEach(merge);
  if (entry) merge(entry);
  return list.slice(-max);
}

function commitSave(opts) {
  const o = opts || {};
  const cap = Number.isInteger(o.cap) && o.cap > 0 ? o.cap : 200;
  let stored = [];
  try {
    stored = typeof o.read === 'function' ? o.read() : (Array.isArray(o.stored) ? o.stored : []);
  } catch (e) {
    return { ok: false, stage: 'log', log: Array.isArray(o.current) ? o.current : [] };
  }
  if (!Array.isArray(stored)) stored = [];
  const log = mergeSavedLog(stored, o.current, o.entry, cap);
  try {
    if (typeof o.write === 'function') o.write(log);
  } catch (e) {
    return { ok: false, stage: 'log', log: log };
  }
  if (typeof o.advance === 'function') {
    try {
      o.advance();
    } catch (e) {
      return { ok: false, stage: 'queue', log: log };
    }
  }
  return { ok: true, stage: null, log: log };
}

function heartbeatTick(opts) {
  const o = opts || {};
  const lock = o.lock;
  const now = Number(o.now == null ? Date.now() : o.now);
  const at = Number((lock && lock.at) || 0);
  if (lock && lock.tabId !== o.tabId && !(now - at >= 15000)) {
    return { action: 'stop', stop: true, release: false };
  }
  try {
    if (typeof o.write === 'function') o.write({ tabId: o.tabId, at: now });
  } catch (e) {
    if (typeof o.release === 'function') o.release();
    return { action: 'stop-release', stop: true, release: true };
  }
  return { action: 'continue', stop: false, release: false };
}

function maxSavedId(log) {
  let max = 0;
  for (const entry of Array.isArray(log) ? log : []) {
    const id = Number(entry && entry.id);
    if (Number.isFinite(id) && id > max) max = id;
  }
  return max;
}

function savedForBatch(log, batchId) {
  if (!batchId) return [];
  return (Array.isArray(log) ? log : []).filter(entry => entry && entry.batchId === batchId);
}

function deriveLiveState(queue, savedLog) {
  if (!queue || !Array.isArray(queue.items) || !queue.items.length) return 'idle';
  if (!savedForBatch(savedLog, queue.batchId).length) return 'idle';
  return Number(queue.i) >= queue.items.length ? 'complete' : 'incomplete';
}

function unverifiedSaves(entries) {
  return (Array.isArray(entries) ? entries : []).filter(entry => entry && (entry.inactive === null || entry.inactive === undefined));
}

function trackUnverified(streak, inactive) {
  const n = Number.isInteger(streak) && streak > 0 ? streak : 0;
  if (inactive === null) {
    const next = n + 1;
    return { streak: next, stop: next >= 2 };
  }
  if (inactive === true || inactive === false) return { streak: 0, stop: false };
  return { streak: n, stop: false };
}

function savedEntryMode(entry) {
  const mode = entry && entry.mode;
  if (mode === 'active' || mode === 'draft' || mode === 'manual') return mode;
  return entry && entry.inactive === false ? 'manual' : 'draft';
}

function savedModeSuffix(entries) {
  const list = (Array.isArray(entries) ? entries : []).filter(entry => entry);
  if (!list.length) return '';
  let mismatches = 0;
  for (const entry of list) {
    if (entry.inactive === null || entry.inactive === undefined) continue;
    const mode = savedEntryMode(entry);
    if (mode === 'manual') continue;
    if (mode === 'draft' && entry.inactive !== true) mismatches++;
    if (mode === 'active' && entry.inactive !== false) mismatches++;
  }
  if (mismatches) return ', MISMATCH: ' + mismatches + ' saved in the wrong state';
  if (list.some(entry => entry.inactive === null || entry.inactive === undefined)) return ', status not verified';
  let active = 0;
  let draft = 0;
  for (const entry of list) {
    if (savedEntryMode(entry) === 'draft') draft++;
    else active++;
  }
  if (!draft) return ', active';
  if (!active) return ', inactive';
  return ', ' + active + ' active, ' + draft + ' inactive';
}

function formatSavedRange(entries) {
  const ids = (Array.isArray(entries) ? entries : [])
    .map(entry => Number(entry && entry.id))
    .filter(id => Number.isFinite(id) && id > 0);
  const unique = Array.from(new Set(ids)).sort((a, b) => a - b);
  if (!unique.length) return 'Saved this batch: none';
  let gap = false;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] !== unique[i - 1] + 1) gap = true;
  }
  const range = unique.length === 1 || gap
    ? unique.map(id => '#' + id).join(', ')
    : '#' + unique[0] + ' to #' + unique[unique.length - 1];
  return 'Saved this batch: ' + range + savedModeSuffix(entries);
}

function makeBatchHistoryEntry(opts) {
  const o = opts || {};
  const batchId = o.batchId == null ? '' : String(o.batchId);
  if (!batchId) return null;
  const entries = (Array.isArray(o.entries) ? o.entries : []).filter(entry => entry);
  const ids = Array.from(new Set(entries
    .map(entry => Number(entry && entry.id))
    .filter(id => Number.isFinite(id) && id > 0))).sort((a, b) => a - b);
  if (!ids.length) return null;
  const at = Number(o.at);
  return {
    batchId: batchId,
    at: Number.isFinite(at) ? at : 0,
    subject: String(o.subject == null ? '' : o.subject),
    category: String(o.category == null ? '' : o.category),
    year: String(o.year == null ? '' : o.year),
    ids: ids,
    count: ids.length,
    mode: savedModeSuffix(entries).replace(/^,\s*/, '')
  };
}

function upsertBatchHistory(history, entry, cap) {
  if (!Array.isArray(history)) return [];
  const limit = Number.isInteger(cap) && cap > 0 ? cap : 15;
  const valid = history.filter(item => item && typeof item === 'object'
    && item.batchId != null && item.batchId !== '');
  const incoming = entry && typeof entry === 'object' && entry.batchId != null
    && entry.batchId !== '' && Array.isArray(entry.ids) && entry.ids.length
    ? entry : null;
  if (!incoming) return valid.slice(0, limit);
  const batchId = String(incoming.batchId);
  const out = valid.filter(item => String(item.batchId) !== batchId);
  out.unshift(incoming);
  return out.slice(0, limit);
}

function recentRowsFromTable(headers, rows) {
  const head = (Array.isArray(headers) ? headers : []).map(text => normalizeAnswer(text));
  const at = name => head.indexOf(normalizeAnswer(name));
  const col = {
    id: at('ID'),
    question: at('Question'),
    subject: at('Subject'),
    category: at('Exam Category'),
    year: at('Exam Year')
  };
  const cell = (cells, i) => (i >= 0 && Array.isArray(cells) && cells[i] != null ? String(cells[i]).trim() : '');
  return (Array.isArray(rows) ? rows : []).map(cells => ({
    id: cell(cells, col.id),
    question: cell(cells, col.question),
    subject: cell(cells, col.subject),
    category: cell(cells, col.category),
    year: cell(cells, col.year)
  })).filter(row => row.id && row.question);
}

function recentDuplicate(rows, subject, questionText, category, year) {
  const wantSubject = normalizeAnswer(subject);
  const wantText = normalizeAnswer(questionText);
  const wantCategory = normalizeAnswer(category);
  const wantYear = String(year == null ? '' : year).trim();
  if (!wantText) return null;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    if (normalizeAnswer(row.subject) !== wantSubject) continue;
    const rowCategory = normalizeAnswer(row.category);
    if (rowCategory && rowCategory !== wantCategory) continue;
    const rowYear = String(row.year == null ? '' : row.year).trim();
    if (rowYear && Number(rowYear) !== Number(wantYear)) continue;
    let rowText = normalizeAnswer(row.question).replace(/^\[[^\]]*\]\s*/, '');
    if (!rowText) continue;
    if (/(?:…|\.\.\.)$/.test(rowText)) {
      rowText = rowText.replace(/(?:…|\.\.\.)$/, '').trim();
      if (rowText.length >= 40 && wantText.indexOf(rowText) === 0) return row;
    } else if (rowText === wantText) {
      return row;
    }
  }
  return null;
}

const SAVE_SUCCESS = /Question saved successfully \(Question ID: (\d+)\)/;

function savedLogHasNum(log, batchId, num) {
  return savedForBatch(log, batchId).some(entry => entry && entry.num === num);
}

function savedLogPriorDuplicate(log, currentBatchId, fingerprint) {
  if (currentBatchId == null || currentBatchId === '') return null;
  const want = completeFingerprint(fingerprint);
  if (!want) return null;
  let best = null;
  let bestAt = -Infinity;
  let bestId = -Infinity;
  for (const entry of Array.isArray(log) ? log : []) {
    if (!entry) continue;
    if (String(entry.batchId == null ? '' : entry.batchId) === String(currentBatchId)) continue;
    const fp = completeFingerprint(entry.fp);
    if (!fp) continue;
    if (fp.subjectId !== want.subjectId) continue;
    if (fp.categoryId !== want.categoryId) continue;
    if (fp.year !== want.year) continue;
    if (normalizeAnswer(fp.question) !== want.question) continue;
    const at = Number(entry.at);
    const id = Number(entry.id);
    const eAt = Number.isFinite(at) ? at : 0;
    const eId = Number.isFinite(id) ? id : -1;
    if (!best || eAt > bestAt || (eAt === bestAt && eId > bestId)) {
      best = entry;
      bestAt = eAt;
      bestId = eId;
    }
  }
  return best;
}

function formMatchesQuestion(form, q) {
  if (!form || !q) return false;
  if (normalizeAnswer(form.question) !== normalizeAnswer(q.question)) return false;
  const options = Array.isArray(form.options) ? form.options : [];
  return ['a', 'b', 'c', 'd'].every((letter, i) => normalizeAnswer(options[i]) === normalizeAnswer(q[letter]));
}

function classifySaveResponse(reply) {
  const r = reply || {};
  const text = String(r.text == null ? '' : r.text);
  if (text.indexOf('Administrator Login') > -1) {
    return { kind: 'rejected', reason: 'expired', message: 'you were logged out. Reload the page and log in.' };
  }
  if (r.errorText && !r.redirected) {
    return { kind: 'rejected', reason: 'validation', message: String(r.errorText).trim() };
  }
  if (r.redirected && !r.errorText) {
    const m = text.match(SAVE_SUCCESS);
    if (m) {
      const id = Number(m[1]);
      if (id > Number(r.lastId || 0)) return { kind: 'saved', id };
    }
  }
  return { kind: 'ambiguous', message: 'Unknown. It may have saved. Check the list.' };
}

function checkListUrl(pathname, marker) {
  const m = marker || {};
  const subject = String(m.subject == null ? '' : m.subject).trim();
  const category = String(m.category == null ? '' : m.category).trim();
  const year = String(m.year == null ? '' : m.year).trim();
  if (!/^\d+$/.test(subject) || !/^\d+$/.test(category) || !/^\d{4}$/.test(year)) return null;
  return String(pathname == null ? '' : pathname) + '?subject_id=' + encodeURIComponent(subject)
    + '&exam_year_filter=' + encodeURIComponent(year)
    + '&category_filter=' + encodeURIComponent(category);
}

function sameMeta(snapshot, meta) {
  const s = snapshot || {};
  const m = meta || {};
  return String(s.subject == null ? '' : s.subject) === String(m.subject == null ? '' : m.subject)
    && String(s.category == null ? '' : s.category) === String(m.category == null ? '' : m.category)
    && String(s.year == null ? '' : s.year) === String(m.year == null ? '' : m.year);
}

function autosaveBlockers(state) {
  const s = state || {};
  const queue = s.queue || {};
  const items = Array.isArray(queue.items) ? queue.items : [];
  const out = [];
  const add = (code, detail) => out.push({ code, detail: detail || '' });
  const q = items[queue.i];

  if (!items.length) {
    add('queue-number', 'The queue is empty.');
    return out;
  }
  if (!q) {
    add('queue-number', 'All questions in this batch are done.');
    return out;
  }
  const imagePlan = Array.isArray(s.imagePlan) ? s.imagePlan : [];
  const queueNums = new Set(items.map(item => item.num).filter(Number.isInteger));
  const planFor = id => imagePlan.find(entry => entry && String(entry.stimulusId) === String(id)) || null;
  let stimIndex = 0;
  for (const item of items) {
    const stimuli = item && Array.isArray(item.stimuli) ? item.stimuli : [];
    for (const stim of stimuli) {
      if (!stim || typeof stim !== 'object') continue;
      stimIndex++;
      const label = 'Image block ' + (Number.isInteger(stim.order) ? stim.order : stimIndex)
        + (Number.isInteger(stim.sourceNum) ? ' (after Q' + stim.sourceNum + ')' : '');
      const plan = planFor(stim.id);
      const rawNums = plan && Array.isArray(plan.nums) ? plan.nums : [];
      const nums = rawNums.map(n => Number(n)).filter(n => Number.isInteger(n) && n > 0);
      if (!plan || !plan.file || !plan.name || !nums.length) {
        add('stimulus-unassigned', label + ' has no image or range yet.');
        continue;
      }
      const bad = nums.filter(n => !queueNums.has(n));
      if (bad.length) add('stimulus-range', label + ' names question ' + bad.join(', ') + ', which is not in this paste.');
    }
  }
  const covers = num => imagePlan.some(entry => {
    if (!entry || !entry.file || !entry.name || !Array.isArray(entry.nums)) return false;
    return entry.nums.map(n => Number(n)).includes(Number(num));
  });
  if (q.needsImage && !covers(q.num)) add('image-required', 'Question ' + q.num + ' needs an image.');
  if (!queue.batchId) add('batch-missing', 'This queue has no batch identity. Paste the questions again.');
  else if (!s.keyBatch || s.keyBatch !== queue.batchId) add('batch-mismatch', 'The saved key belongs to a different batch. Paste the matching key.');
  if (!isConsecutiveQueue(items)) add('queue-number', 'The question numbers are not consecutive.');
  if (!keyCoversQueue(s.key, items)) add('key-coverage', 'The key does not cover exactly these question numbers with A to F answers.');
  if (Array.isArray(s.keyConflicts) && s.keyConflicts.length) {
    const c = s.keyConflicts[0];
    add('key-conflict', 'The key gives more than one answer for question ' + c.num + ' (' + (c.letters || []).join(', ') + ').');
  }
  const keyLetter = s.key && s.key[q.num];
  if (keyLetter === 'E' || keyLetter === 'F') add('key-letter', "Question " + q.num + "'s key is " + keyLetter + '; the form has only four options.');
  if (!s.radioLetter) add('no-answer', 'No answer is ticked.');
  else if (s.radioLetter !== keyLetter) add('answer-mismatch', 'The ticked answer does not match the key.');
  if (q.e || q.f) add('ef-present', 'This question has an E/F option, which the form cannot hold.');
  const otherFlags = (q.flags || []).filter(flag => flag !== 'E/F options present');
  if (otherFlags.length) add('flags', 'Check this one first: ' + otherFlags.join(', ') + '.');
  const letters = optionLetters(q);
  if (letters.some(letter => 'ABCD'.indexOf(letter) < 0)) add('options-not-abcd', 'The options are not exactly A, B, C and D.');
  for (const letter of 'abcd') {
    if (!(q[letter] || '').trim()) add('option-empty', 'Option ' + letter.toUpperCase() + ' is empty.');
  }
  const seen = {};
  for (const letter of 'abcd') {
    const text = normalizeAnswer(q[letter]);
    if (!text) continue;
    if (seen[text]) add('option-duplicate', 'Options ' + seen[text] + ' and ' + letter.toUpperCase() + ' have the same text.');
    else seen[text] = letter.toUpperCase();
  }
  for (const letter of 'abcd') {
    if (byteLength(q[letter]) > 500) add('option-long', 'Option ' + letter.toUpperCase() + ' is over 500 characters.');
  }
  if (String(q.question || '').trim().length < 10) add('question-short', 'The question text is missing or very short.');
  const meta = s.meta || {};
  if (meta.subject == null || meta.subject === '' || meta.category == null || meta.category === '' || meta.year == null || meta.year === '') {
    add('meta-missing', 'Subject, category or year is missing.');
  }
  if (!s.confirmed) add('not-confirmed', 'Tick the batch confirmation before starting.');
  if (s.activeMode && !s.activeConfirmed) add('mode-unconfirmed', 'Tick the live-save confirmation before starting.');
  if (s.runMode && s.mode && s.runMode !== s.mode) add('mode-changed', 'The save mode changed during the run.');
  if (s.confirmedMeta && !sameMeta(s.confirmedMeta, meta)) add('meta-changed', 'Subject, category or year changed since you confirmed.');
  if (s.hasImage || s.hasVideo) add('file-attached', 'A file is already attached to this question.');
  if (s.hasExplanation) add('has-explanation', 'The Answer Explanation box has text. Clear it first.');
  if (s.savingMarker) add('saving-marker', 'An earlier save is unconfirmed. Check the list before starting.');
  if (s.saveInProgress) add('save-in-progress', 'A save is already running.');
  if (s.stopRequested) add('stopped', 'Auto-save is stopping.');
  if (s.lock && s.lock.tabId !== s.tabId) {
    const age = Number(s.now == null ? Date.now() : s.now) - Number(s.lock.at || 0);
    if (!(age >= 15000)) add('lock', 'Another tab is auto-saving.');
  }
  if (s.visible === false) add('hidden', 'This tab is hidden; auto-save is paused.');
  if (savedLogHasNum(s.savedLog, queue.batchId, q.num)) add('saved-log', 'Question ' + q.num + ' was already saved in this batch.');
  const fp = makeSavedFingerprint({
    subject_id: meta.subject,
    exam_category_id: meta.category,
    exam_year: meta.year,
    question_text: q.question
  }, { subject: meta.subjectText, category: meta.categoryText });
  const prior = savedLogPriorDuplicate(s.savedLog, queue.batchId, fp);
  if (prior) {
    const priorFp = prior.fp || {};
    add('duplicate', 'This looks like question #' + (prior.id == null ? '?' : prior.id) + ' saved in an earlier batch (' + (priorFp.year || meta.year || '?') + ', ' + (priorFp.category || meta.categoryText || meta.category || '?') + ').');
  }
  const dup = recentDuplicate(s.recentRows, meta.subjectText || meta.subject, q.question, meta.categoryText || meta.category, meta.year);
  if (dup) add('duplicate', 'This looks like question #' + (dup.id == null ? '?' : dup.id) + ' (' + (meta.year || '?') + ', ' + (meta.categoryText || meta.category || '?') + ') already in the recent list.');
  if (s.form && !formMatchesQuestion(s.form, q)) add('form-edited', 'The form no longer matches the loaded question. Save it by hand or reload the queue item.');
  return out;
}

function blockerText(blocker) {
  const b = blocker || {};
  const detail = b.detail ? ' ' + b.detail : '';
  switch (b.code) {
    case 'batch-missing': return 'Cannot auto-save:' + detail;
    case 'batch-mismatch': return 'Cannot auto-save:' + detail;
    case 'queue-number': return 'Cannot auto-save:' + detail;
    case 'key-coverage': return 'Cannot auto-save:' + detail;
    case 'key-conflict': return 'Cannot auto-save:' + detail;
    case 'key-letter': return 'Cannot auto-save:' + detail;
    case 'no-answer': return 'Cannot auto-save:' + detail;
    case 'answer-mismatch': return 'Cannot auto-save:' + detail;
    case 'ef-present': return 'Cannot auto-save:' + detail;
    case 'flags': return 'Cannot auto-save:' + detail;
    case 'options-not-abcd': return 'Cannot auto-save:' + detail;
    case 'option-empty': return 'Cannot auto-save:' + detail;
    case 'option-duplicate': return 'Cannot auto-save:' + detail;
    case 'option-long': return 'Cannot auto-save:' + detail;
    case 'question-short': return 'Cannot auto-save:' + detail;
    case 'meta-missing': return 'Cannot auto-save:' + detail;
    case 'not-confirmed': return 'Cannot auto-save:' + detail;
    case 'mode-unconfirmed': return 'Cannot auto-save:' + detail;
    case 'mode-changed': return 'Cannot auto-save:' + detail;
    case 'meta-changed': return 'Cannot auto-save:' + detail;
    case 'stimulus-unassigned': return 'Cannot auto-save:' + detail;
    case 'stimulus-range': return 'Cannot auto-save:' + detail;
    case 'image-required': return 'Cannot auto-save:' + detail;
    case 'file-attached': return 'Cannot auto-save:' + detail;
    case 'has-explanation': return 'Cannot auto-save:' + detail;
    case 'saving-marker': return 'Cannot auto-save:' + detail;
    case 'save-in-progress': return 'Cannot auto-save:' + detail;
    case 'stopped': return 'Cannot auto-save:' + detail;
    case 'lock': return 'Cannot auto-save:' + detail;
    case 'hidden': return 'Cannot auto-save:' + detail;
    case 'saved-log': return 'Cannot auto-save:' + detail;
    case 'duplicate': return 'Cannot auto-save:' + detail;
    case 'form-edited': return 'Cannot auto-save:' + detail;
    default: return 'Cannot auto-save:' + (b.detail || 'unknown reason.');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SAVE_SUCCESS,
    newBatchId,
    byteLength,
    normalizeAnswer,
    optionLetters,
    isConsecutiveQueue,
    keyCoversQueue,
    appendSavedLog,
    mergeSavedLog,
    commitSave,
    heartbeatTick,
    checkListUrl,
    sameMeta,
    maxSavedId,
    savedForBatch,
    deriveLiveState,
    makeSavedFingerprint,
    savedLogPriorDuplicate,
    unverifiedSaves,
    trackUnverified,
    savedModeSuffix,
    formatSavedRange,
    makeBatchHistoryEntry,
    upsertBatchHistory,
    recentRowsFromTable,
    recentDuplicate,
    savedLogHasNum,
    formMatchesQuestion,
    autosaveBlockers,
    blockerText,
    classifySaveResponse
  };
}
