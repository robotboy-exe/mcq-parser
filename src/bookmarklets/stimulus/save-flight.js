// Stimulus bookmarklet save-flight, response classification, marker lifetime,
// and cross-activation settlement boundary.
// Inlined by src/build/build.js after core.js, autosave.js, and image-plan.js.

function createStimulusSaveFlight(opts) {
  const o = opts || {};
  const form = o.form;
  const owner = o.owner;
  const store = o.store;
  const $ = o.$;
  const isPlainObject = o.isPlainObject;
  const currentMeta = o.currentMeta;
  const selectedText = o.selectedText;
  const getQueue = o.getQueue;
  const setQueue = o.setQueue;
  const getSavedLog = o.getSavedLog;
  const setSavedLog = o.setSavedLog;
  const getLast = o.getLast;
  const setLast = o.setLast;
  const cur = o.cur;
  const planRowFor = o.planRowFor;
  const invalidateDry = o.invalidateDry;
  const recordBatchHistory = o.recordBatchHistory;
  const showOCR = o.showOCR;
  const tick = o.tick;
  const renderAuto = o.renderAuto;
  const saveMeta = o.saveMeta;
  const setResult = o.setResult;
  const setLiveBlocked = o.setLiveBlocked;
  const setLiveState = o.setLiveState;
  const setLiveStop = o.setLiveStop;
  const getUnverifiedStreak = o.getUnverifiedStreak;
  const setUnverifiedStreak = o.setUnverifiedStreak;
  const busyNotice = o.busyNotice || 'A save is in progress. Wait for it to finish.';
  let saveInProgress = false;

  function isBusy() {
    return saveInProgress || Boolean(owner.inFlight && !owner.inFlight.settled);
  }

  function restorePriorMarker(prior) {
    if (prior) store.set('ocrSaving', prior);
    else store.del('ocrSaving');
  }

  function clearSavedMarker(prior, num) {
    if (prior && prior.num !== num) store.set('ocrSaving', prior);
    else store.del('ocrSaving');
  }

  async function verifyInactive(id) {
    let ctl = null, timer = null;
    try {
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctl) timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(location.pathname + '?edit=' + encodeURIComponent(id), {
        credentials: 'same-origin',
        signal: ctl ? ctl.signal : undefined
      });
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

  function readQueueFromStorage() {
    try {
      const raw = store.get('ocrQueue');
      if (!isPlainObject(raw) || !Array.isArray(raw.items)) return null;
      return Object.assign({
        items: raw.items,
        i: Number.isInteger(raw.i) && raw.i >= 0 ? raw.i : 0,
        batchId: raw.batchId
      }, typeof raw.how === 'string' && raw.how ? { how: raw.how } : {});
    } catch (e) {
      return null;
    }
  }

  function clearFormTransientFields() {
    ['question_image', 'answer_video'].forEach(n => {
      const el = form.elements[n];
      if (el) el.value = '';
    });
    const ae = form.elements.answer_explanation;
    if (ae) ae.value = '';
  }

  async function saveCurrentQuestion(saveOpts) {
    const auto = Boolean(saveOpts && saveOpts.auto);
    const active = Boolean(saveOpts && saveOpts.active);
    if (isBusy()) {
      return { kind: 'busy', message: 'A save is already running.' };
    }
    saveInProgress = true;
    try { store.del('ocrSubmitted'); } catch (e) {}
    const startQueue = getQueue();
    const q = startQueue.items[startQueue.i];
    const num = q ? q.num : null;
    const savedBatchId = startQueue.batchId || null;
    const savedIndex = startQueue.i;
    let resolveInFlight;
    const inFlightDone = new Promise(resolve => { resolveInFlight = resolve; });
    const flight = { gen: owner.gen, settled: false, promise: inFlightDone, outcome: null };
    owner.inFlight = flight;
    const isCurrentGen = () => owner.gen === flight.gen;
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
        const msg = 'NOT saved: browser storage is unavailable, so the save was not attempted.';
        flight.outcome = { kind: 'rejected', auto, resultText: msg, danger: true, diag: '', clearFields: false };
        if (isCurrentGen()) setResult(msg, true);
        return { kind: 'rejected', reason: 'storage', message: 'browser storage is unavailable.' };
      }
      if (isCurrentGen()) renderAuto();
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
        if (usedPlanRow) {
          const validBlob = usedPlanRow.file && !usedPlanRow.cacheError
            && (typeof Blob === 'undefined' || usedPlanRow.file instanceof Blob || typeof usedPlanRow.file.size === 'number');
          if (!validBlob) {
            restorePriorMarker(priorSaving);
            const msg = 'NOT saved: attached image is invalid. Re-select the image file.';
            flight.outcome = { kind: 'rejected', auto, resultText: msg, danger: true, diag: '', clearFields: false };
            if (isCurrentGen()) setResult(msg, true);
            return { kind: 'rejected', reason: 'image', message: 'attached image is invalid.' };
          }
          fd.set('question_image', usedPlanRow.file, usedPlanRow.name);
        }
      }
      const fingerprint = makeSavedFingerprint({
        subject_id: fd.get('subject_id'),
        exam_category_id: fd.get('exam_category_id'),
        exam_year: fd.get('exam_year'),
        question_text: fd.get('question_text')
      }, { subject: selectedText('subject_id'), category: selectedText('exam_category_id') });
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctl) timer = setTimeout(() => ctl.abort(), usedPlanRow ? 60000 : 30000);
      let res;
      try {
        res = await fetch(location.href, { method: 'POST', body: fd, credentials: 'same-origin', signal: ctl ? ctl.signal : undefined });
      } catch (err) {
        // BLOCK-12: timeout/transport failure may have committed server-side; keep
        // ocrSaving, log nothing, classify ambiguous, and block retries until cleared.
        const errMsg = err && err.name === 'AbortError' ? 'save request timed out.' : (err && err.message ? err.message : 'network error.');
        const imgDiag = usedPlanRow
          ? 'img=' + usedPlanRow.name + ' (' + (usedPlanRow.file ? usedPlanRow.file.size : '?') + 'B), cached=' + Boolean(usedPlanRow.cached) + (usedPlanRow.cacheError ? ', cacheErr=' + usedPlanRow.cacheError : '')
          : '';
        const diag = [errMsg, imgDiag].filter(Boolean).join('; ');
        const msg = 'Unknown. It may have saved. Check the list.';
        flight.outcome = { kind: 'ambiguous', auto, resultText: msg, danger: true, diag, clearFields: false };
        if (isCurrentGen()) setResult(msg, true, diag);
        return { kind: 'ambiguous', message: msg };
      }
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, 'text/html');
      const er = doc.querySelector('.admin-error');
      let storedLog = [];
      try {
        const rawLog = store.get('ocrSavedLog');
        if (Array.isArray(rawLog)) storedLog = rawLog;
      } catch (e) {}
      const knownMaxId = Math.max(maxSavedId(getSavedLog()), maxSavedId(storedLog));
      const result = classifySaveResponse({
        redirected: res.redirected,
        text: txt,
        errorText: er ? er.textContent.trim() : '',
        lastId: knownMaxId
      });
      if (result.kind === 'rejected') {
        restorePriorMarker(priorSaving);
        const diag = usedPlanRow
          ? 'img=' + usedPlanRow.name + ' (' + (usedPlanRow.file ? usedPlanRow.file.size : '?') + 'B), cached=' + Boolean(usedPlanRow.cached)
          : '';
        const msg = 'NOT saved: ' + result.message;
        flight.outcome = { kind: 'rejected', auto, resultText: msg, danger: true, diag, clearFields: false };
        if (isCurrentGen()) setResult(msg, true, diag);
        return result;
      }
      if (result.kind === 'ambiguous') {
        const sm = txt.match(SAVE_SUCCESS);
        const flashEl = doc.querySelector('.admin-success, .admin-alert, .admin-error');
        const titleEl = doc.querySelector('title');
        const imgInfo = usedPlanRow ? usedPlanRow.name + ' (' + (usedPlanRow.file ? usedPlanRow.file.size : '?') + 'B)' : (nativeImage ? 'native' : 'none');
        const snippet = (flashEl ? flashEl.textContent : (doc.body ? doc.body.textContent : txt)).replace(/\s+/g, ' ').trim().slice(0, 140);
        const diag = 'Diag: HTTP ' + (res.status || '?')
          + ', redirected=' + Boolean(res.redirected)
          + ', img=' + imgInfo
          + ', matchedId=' + (sm ? sm[1] : 'none') + '/lastId=' + knownMaxId
          + (titleEl ? ', title="' + titleEl.textContent.trim().slice(0, 60) + '"' : '')
          + (snippet ? ', body="' + snippet + '"' : '');
        const msg = 'Unknown. It may have saved. Check the list.';
        flight.outcome = { kind: 'ambiguous', auto, resultText: msg, danger: true, diag, clearFields: false };
        if (isCurrentGen()) setResult(msg, true, diag);
        return result;
      }
      let inactive = null;
      if (auto) inactive = await verifyInactive(result.id);
      const entry = {
        num: num,
        id: result.id,
        at: Date.now(),
        batchId: savedBatchId,
        inactive: auto ? inactive : false,
        mode: auto ? (active ? 'active' : 'draft') : 'manual'
      };
      if (fingerprint) entry.fp = fingerprint;
      const liveQ = readQueueFromStorage() || getQueue();
      const sameQueue = Boolean(q && liveQ && liveQ.i === savedIndex
        && liveQ.items[savedIndex] && liveQ.items[savedIndex].num === q.num
        && (liveQ.batchId || null) === savedBatchId);
      const committed = commitSave({
        read: () => store.get('ocrSavedLog') || [],
        current: getSavedLog(),
        entry: entry,
        cap: 200,
        write: log => store.set('ocrSavedLog', log),
        advance: sameQueue && q ? () => {
          const nextQueue = Object.assign({}, liveQ, { i: liveQ.i + 1 });
          store.set('ocrQueue', nextQueue);
          if (isCurrentGen()) setQueue(nextQueue);
        } : null
      });
      if (isCurrentGen()) setSavedLog(committed.log);
      if (!committed.ok) {
        const failText = 'Saved as #' + result.id + ' but could not be logged. Do not retry.';
        flight.outcome = { kind: 'saved', auto, failed: committed.stage, resultText: failText, danger: true, diag: '', clearFields: false };
        if (isCurrentGen()) {
          setLiveBlocked(failText);
          setResult(failText, true);
          if (auto) { setLiveStop(true); setLiveState('needs-check'); }
        }
        return { kind: 'saved', id: result.id, inactive: inactive, entry: entry, failed: committed.stage };
      }
      recordBatchHistory(committed.log, savedBatchId);
      if (sameQueue && q && isCurrentGen()) invalidateDry('a save advanced the queue');
      clearSavedMarker(priorSaving, num);
      try { store.del('ocrSubmitted'); } catch (e) {}
      let unverifiedStop = false;
      if (auto) {
        const tracked = trackUnverified(getUnverifiedStreak(), inactive);
        setUnverifiedStreak(tracked.streak);
        if (tracked.stop) {
          unverifiedStop = true;
          if (isCurrentGen()) setLiveStop(true);
        }
      }
      let resultText = 'Saved as question #' + result.id + '.';
      let danger = false;
      let needsCheck = false;
      if (auto && inactive === null) {
        if (unverifiedStop) {
          resultText = 'Stopped after 2 unverified checks. Check the saved list before continuing.';
          danger = true;
          needsCheck = true;
        } else {
          resultText = 'Saved as #' + result.id + '. Could not verify; check the list.';
        }
      } else if (auto && inactive === !active) {
        resultText = 'Saved as question #' + result.id + ' (' + (active ? 'active' : 'inactive') + ').';
      } else if (auto && active) {
        resultText = 'SAVED AS INACTIVE: question #' + result.id + ' is not live. Check the list.';
        danger = true;
        needsCheck = true;
      } else if (auto) {
        resultText = 'SAVED AS ACTIVE: question #' + result.id + '. Check the list and turn it off.';
        danger = true;
        needsCheck = true;
      }
      flight.outcome = { kind: 'saved', auto, resultText, danger, diag: '', clearFields: true, needsCheck, unverifiedStop };
      if (isCurrentGen()) {
        clearFormTransientFields();
        saveMeta();
        showOCR(auto);
        setLast(cur().i);
        if (getLast() > -1) tick();
        else {
          form.reset();
          if ($('constant_text')) $('constant_text').value = '';
        }
        if (needsCheck) {
          if (unverifiedStop) setLiveBlocked(resultText);
          setLiveStop(true);
          setLiveState('needs-check');
        }
        setResult(resultText, danger);
      }
      return { kind: 'saved', id: result.id, inactive: inactive, entry: entry };
    } catch (e) {
      const msg = 'Unknown. It may have saved. Check the list.';
      flight.outcome = { kind: 'ambiguous', auto, resultText: msg, danger: true, diag: '', clearFields: false };
      if (isCurrentGen()) setResult(msg, true);
      return { kind: 'ambiguous', message: msg };
    } finally {
      if (timer) clearTimeout(timer);
      flight.settled = true;
      if (owner.inFlight === flight) owner.inFlight = null;
      saveInProgress = false;
      if (isCurrentGen()) o.clearBusyNotice();
      if (resolveInFlight) resolveInFlight(flight.outcome);
    }
  }

  function attachObserver(sb, myGen, onAdopted) {
    if (!(owner.inFlight && !owner.inFlight.settled)) return false;
    if (sb) sb.disabled = true;
    setLiveBlocked(busyNotice);
    setResult('An earlier save is still running. Wait for it to finish.', false);
    renderAuto();
    const pendingFlight = owner.inFlight;
    pendingFlight.promise.then(outcome => {
      if (myGen !== owner.gen) return;
      if (sb && (!owner.inFlight || owner.inFlight.settled)) sb.disabled = false;
      o.clearBusyNotice();
      onAdopted(outcome);
    });
    return true;
  }

  return {
    isBusy,
    clearFormTransientFields,
    saveCurrentQuestion,
    attachObserver
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createStimulusSaveFlight };
}
