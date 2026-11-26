// Stimulus bookmarklet image-plan state, RAM file cache, and single/bulk picker.
// Pure DOM/File UI helper: no localStorage, sessionStorage, fetch, or parser rules.

function planNums(row) {
  const list = row && Array.isArray(row.nums) ? row.nums : [];
  return list.map(n => Number(n)).filter(n => Number.isInteger(n) && n > 0);
}

function planReady(row) {
  return Boolean(row && row.file && !row.cacheError && typeof row.name === 'string' && row.name.trim() && planNums(row).length);
}

function formatPlanRange(nums) {
  const list = (Array.isArray(nums) ? nums : []).map(Number).filter(n => Number.isInteger(n) && n > 0);
  if (!list.length) return '';
  if (list.length === 1) return String(list[0]);
  let contiguous = true;
  for (let i = 1; i < list.length; i++) if (list[i] !== list[i - 1] + 1) { contiguous = false; break; }
  return contiguous ? list[0] + '-' + list[list.length - 1] : list.join(', ');
}

function cacheFileInMemory(file, onDone) {
  if (!file || file._cached || typeof file.arrayBuffer !== 'function' || typeof File === 'undefined') return;
  file.arrayBuffer().then(buf => {
    const mem = new File([buf], file.name || 'image.png', {
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified || Date.now()
    });
    mem._cached = true;
    if (typeof onDone === 'function') onDone(mem, null);
  }).catch(err => {
    if (typeof onDone === 'function') onDone(null, err);
  });
}

function pickStimulusInputFile(input) {
  const files = input && input.files;
  if (files && files[0]) return files[0];
  return input && input.value ? { name: String(input.value).split(/[\\/]/).pop() } : null;
}

function formatStimulusFileLine(file) {
  if (!file) return '';
  const size = Number(file.size);
  return String(file.name || '') + (Number.isFinite(size) ? ' (' + size + ' bytes)' : '');
}

function createStimulusImagePlan(opts) {
  const o = opts || {};
  const $ = o.$;
  const getQueue = o.getQueue;
  const parseRange = o.parseRange || parseStimulusRange;
  const renderAuto = o.renderAuto || (() => {});
  let imagePlan = [];
  const imagePending = new Map();

  function getPlan() {
    return imagePlan;
  }

  function planRowFor(num) {
    return imagePlan.find(row => planReady(row) && planNums(row).includes(Number(num))) || null;
  }

  function stimulusPlan(stim) {
    return imagePlan.find(row => row && String(row.stimulusId) === String(stim.id)) || null;
  }

  function detectedStimuli() {
    const q = getQueue();
    const items = q && Array.isArray(q.items) ? q.items : [];
    const list = [];
    items.forEach(item => {
      (item && Array.isArray(item.stimuli) ? item.stimuli : []).forEach(stim => { if (stim) list.push(stim); });
    });
    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }

  function unRangedImageBoundary(q) {
    if (!q) return null;
    const queue = getQueue();
    const items = queue && Array.isArray(queue.items) ? queue.items : [];
    for (const stim of detectedStimuli()) {
      if (stim.needsImage === false) continue;
      const plan = stimulusPlan(stim);
      const effectiveNums = plan && planNums(plan).length ? planNums(plan) : (Array.isArray(stim.nums) ? stim.nums : []);
      if (effectiveNums.length) continue;
      let boundary = null;
      if (stim.sourceNum == null) {
        boundary = items[0] || null;
      } else {
        const srcIdx = items.findIndex(item => item && item.num === stim.sourceNum);
        if (srcIdx > -1) boundary = items[srcIdx + 1] || null;
      }
      if (boundary && boundary === q) return stim;
    }
    return null;
  }

  function questionImagePauseReason(q) {
    if (!q) return null;
    if (planRowFor(q.num)) return null;
    if (q.needsImage) return 'image required';
    if (imagePlan.some(row => row && !planReady(row) && planNums(row).includes(Number(q.num)))) return 'image required';
    if (unRangedImageBoundary(q)) return 'image block has no question range';
    return null;
  }

  function needsImageQuestions() {
    const q = getQueue();
    const items = q && Array.isArray(q.items) ? q.items : [];
    return items.filter(item => item && item.needsImage && Number.isInteger(item.num));
  }

  function queueNumberSet() {
    const q = getQueue();
    const items = q && Array.isArray(q.items) ? q.items : [];
    return new Set(items.map(item => item.num).filter(Number.isInteger));
  }

  function planStatus(row) {
    if (row && row.cacheError) return 'File read failed (' + row.cacheError + '); re-select image';
    if (!planReady(row)) return 'No image';
    const known = queueNumberSet();
    const bad = planNums(row).filter(n => !known.has(n));
    if (bad.length) return 'Range not in this paste: ' + bad.join(', ');
    return 'Ready';
  }

  function setRow(stimulusId, nums, file) {
    const entry = {
      stimulusId: stimulusId == null ? null : stimulusId,
      nums: (Array.isArray(nums) ? nums : []).slice(),
      file: file,
      name: file && file.name ? String(file.name) : '',
      cached: Boolean(file && file._cached),
      cacheError: ''
    };
    cacheFileInMemory(file, (mem, err) => {
      if (entry.file !== file) return;
      if (mem) {
        entry.file = mem;
        entry.cached = true;
        entry.cacheError = '';
      } else if (err) {
        entry.cacheError = err && err.message ? String(err.message) : 'read failed';
        render($('ocr_image_plan'));
        renderAuto();
      }
    });
    const at = imagePlan.findIndex(row => stimulusId == null ? row && row.stimulusId == null : row && String(row.stimulusId) === String(stimulusId));
    if (at > -1) imagePlan[at] = entry;
    else imagePlan.push(entry);
    return entry;
  }

  function clear() {
    imagePlan = [];
    imagePending.clear();
  }

  // BLOCK-15: bulk attach only associates explicitly bulk-picked files in order,
  // never falling back to an unattached single-row pending selection.
  function applyBulkPick(imageStimuli, pickedFiles, readRangeValue) {
    const picked = Array.isArray(pickedFiles) ? pickedFiles : [];
    let attached = 0;
    imageStimuli.forEach(({ stim, idx }, pickIdx) => {
      const chosen = picked[pickIdx];
      if (!chosen) return;
      const nums = parseRange(readRangeValue(idx));
      if (!nums.length) return;
      setRow(stim.id, nums, chosen);
      imagePending.delete(stim.id);
      attached++;
    });
    return attached;
  }

  function render(box) {
    if (!box) return;
    box.textContent = '';
    const stimuli = detectedStimuli();
    const needs = needsImageQuestions();
    box.hidden = !stimuli.length && !needs.length;
    if (box.hidden) return;
    const heading = document.createElement('div');
    heading.style.fontWeight = 'bold';
    heading.textContent = 'Image plan (this tab only; reload clears files)';
    box.appendChild(heading);
    const imageStimuli = [];
    stimuli.forEach((stim, idx) => {
      const needsImg = stim.needsImage !== false;
      const row = document.createElement('div');
      row.style.margin = '6px 0';
      row.style.paddingLeft = '6px';
      row.style.borderLeft = '3px solid ' + (needsImg ? '#1769aa' : '#0f766e');
      const plan = stimulusPlan(stim);
      const title = document.createElement('div');
      const rangeText = formatPlanRange(plan ? planNums(plan) : stim.nums);
      title.textContent = (needsImg ? 'Image block ' : 'Text block ')
        + (Number.isInteger(stim.order) ? stim.order : idx + 1)
        + (Number.isInteger(stim.sourceNum) ? ' (after Q' + stim.sourceNum + ')' : '')
        + (!needsImg && rangeText ? ' — constant_text for Q' + rangeText : '');
      row.appendChild(title);
      if (!needsImg) {
        box.appendChild(row);
        return;
      }
      imageStimuli.push({ stim, idx });
      const range = document.createElement('input');
      range.type = 'text';
      range.id = 'ocr_img_range_' + idx;
      range.value = formatPlanRange(plan ? planNums(plan) : stim.nums);
      range.placeholder = 'e.g. 14-15';
      row.appendChild(range);
      row.appendChild(document.createTextNode(' '));
      const file = document.createElement('input');
      file.type = 'file';
      file.accept = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
      file.id = 'ocr_img_file_' + idx;
      const selected = document.createElement('span');
      selected.id = 'ocr_img_file_name_' + idx;
      selected.textContent = formatStimulusFileLine(imagePending.get(stim.id) || (plan && plan.file));
      file.onchange = () => {
        const chosen = pickStimulusInputFile(file);
        if (chosen) {
          imagePending.set(stim.id, chosen);
          cacheFileInMemory(chosen, mem => {
            if (mem && imagePending.get(stim.id) === chosen) imagePending.set(stim.id, mem);
          });
        } else {
          imagePending.delete(stim.id);
        }
        selected.textContent = formatStimulusFileLine(chosen || (plan && plan.file));
      };
      row.appendChild(file);
      row.appendChild(selected);
      const attach = document.createElement('button');
      attach.type = 'button';
      attach.className = 'admin-btn admin-btn-muted';
      attach.id = 'ocr_img_attach_' + idx;
      attach.textContent = plan && plan.file ? 'Replace' : 'Attach';
      attach.onclick = () => {
        const chosen = imagePending.get(stim.id) || pickStimulusInputFile(file);
        const nums = parseRange(range.value);
        if (!chosen || !nums.length) return;
        setRow(stim.id, nums, chosen);
        imagePending.delete(stim.id);
        render(box);
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
        render(box);
        renderAuto();
      };
      row.appendChild(remove);
      const status = document.createElement('div');
      status.id = 'ocr_img_status_' + idx;
      status.textContent = planStatus(plan);
      status.style.fontWeight = 'bold';
      status.style.color = planStatus(plan) === 'Ready' ? '#0d6b3f' : (planStatus(plan) === 'No image' ? '' : (plan && plan.cacheError ? '#b00020' : '#b45309'));
      row.appendChild(status);
      box.appendChild(row);
    });
    if (imageStimuli.length >= 2) {
      const bulkNote = document.createElement('div');
      bulkNote.textContent = 'Bulk attach: choose one file per block, top to bottom.';
      box.appendChild(bulkNote);
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
      bulk.textContent = 'Attach picked files to blocks in order';
      bulk.onclick = () => {
        const picked = bulkFiles.files ? Array.from(bulkFiles.files) : [];
        applyBulkPick(imageStimuli, picked, idx => {
          const input = $('ocr_img_range_' + idx);
          return input ? input.value : '';
        });
        render(box);
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
      file.accept = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
      file.id = 'ocr_img_generic_file';
      row.appendChild(file);
      const attach = document.createElement('button');
      attach.type = 'button';
      attach.className = 'admin-btn admin-btn-muted';
      attach.id = 'ocr_img_generic_attach';
      attach.textContent = generic && generic.file ? 'Replace' : 'Attach';
      attach.onclick = () => {
        const chosen = pickStimulusInputFile(file);
        const nums = parseRange(range.value);
        if (!chosen || !nums.length) return;
        setRow(null, nums, chosen);
        render(box);
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
          render(box);
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
      line.textContent = 'Question Q' + num + ' needs an image; auto-save will pause here.';
      line.style.color = '#b45309';
      line.style.fontWeight = 'bold';
      box.appendChild(line);
    });
  }

  return {
    getPlan,
    planRowFor,
    stimulusPlan,
    detectedStimuli,
    unRangedImageBoundary,
    questionImagePauseReason,
    needsImageQuestions,
    planStatus,
    setRow,
    clear,
    applyBulkPick,
    render
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    planNums,
    planReady,
    formatPlanRange,
    cacheFileInMemory,
    pickStimulusInputFile,
    formatStimulusFileLine,
    createStimulusImagePlan
  };
}
