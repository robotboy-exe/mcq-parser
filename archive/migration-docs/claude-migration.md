Everything below comes from the claude conversation. Anything it could not confirm is labelled "uncertain" or "not found".

**Source labels used throughout**
- **B1 / B2 / B3:** the three bookmarklets you supplied in your first message, in that order.
- **OH:** the original `ocr_helper.js`.
- **HO:** the Project Handoff document.
- **T1:** the turn that produced the merged bookmarklet (Reset fix and option-splitting removal), now archived as `archive/trusted-variants/trusted-variant-C.js`.
- **T2:** the key-clearing turn.
- **T3:** the blank-option and E/F bug-fix turn.

---

### 1. CURRENT_CODE

**Which version:** the most stable version is archived as `archive/trusted-variants/trusted-variant-C.js`, built on B2. The former `/mnt/user-data/outputs/merged_bookmarklet.txt` was byte-identical and has been removed; C is now the canonical copy.

**What was verified:**
- `node --check` passed on the full code after stripping `javascript:`.
- `parseQuestion` was run on 5 samples (see section 6).
- It was never run in a live browser page in this conversation.

**Changes from B2:**
1. Reset Queue: `queue={items,i:0}` became `queue={items:[],i:0}`.
2. The option-splitting block (`const optionLetters=[...]` through to just before `if(num===null)`) was removed.
3. A paste with questions now replaces the key, and a paste with no key deletes it.
4. The `OPTION` regex now uses `[^\S\n]*` instead of `\s*` after the label.
5. Loose E/F detection (`LOOSE`) was added.
6. In `fillForm`, when the key says E or F, Option D is replaced only if that option's text exists.
7. `cur()` now also returns the question object (`q`).
8. `tick()` maps E and F to Option D and gives accurate messages.

**Alternatives (code only in your first message, not repeated here):**
- **B1:** its key detection is the weakest, it has no "Show paste box" button, and it still has the option-splitting step with correct double backslashes.
- **B3:** it has a different key splitter (`splitCombinedText`) and cannot load a key-only paste.
- **B2:** the base, with the Reset bug and an option-splitting step that almost never matched.
- **OH:** the site-loaded script, which the bookmarklet removes.

**Display note:** when I printed the file through the bash tool, every backslash appeared doubled. That is only how the tool displays it. The real file, and the code below, use single backslashes (`\n`, `\s`, `\d`).

```javascript
javascript:(function(){try{document.querySelectorAll('script[src*="ocr_helper.js"]').forEach(s=>s.remove());const op1=document.getElementById('ocr_input')?.closest('.admin-field');if(op1)op1.remove();const op2=document.getElementById('ans_panel');if(op2)op2.remove();const form=document.querySelector('input[name=action][value=save_question]')?.form;const f=document.querySelector('input[name=correct_option]');if(!form||!f||location.search.includes('edit=')){alert('Please open the "Add a New Question" page first.');return;}const FIXES=[[/govemment/gi,'government'],[/persidential/gi,'presidential'],[/resposible/gi,'responsible']];const FIELDS=['subject_id','exam_category_id','exam_year'];const OPTION=/(?:^|\n|\s)([A-F])[^\S\n]*[.)][^\S\n]*|\n\s*([A-F])\s+(?=\d)/g;const $=id=>document.getElementById(id);const L=localStorage;const store={get:k=>JSON.parse(L.getItem(k)||'null'),set:(k,v)=>L.setItem(k,JSON.stringify(v)),del:k=>L.removeItem(k)};const p=document.createElement('div');p.className='admin-field';p.innerHTML=`<div id="ocr_input"><label for="ocr_text">Paste the WHOLE block: questions + answer key (one box)</label><textarea id="ocr_text" style="width:100%;min-height:220px"></textarea><button type="button" class="admin-btn" id="ocr_load">Load questions + key</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button><div class="admin-note">Recommended divider on its own line: <code>=== ANSWER KEY ===</code>. Varying headers are auto-detected otherwise. To fix the key mid-queue: Show paste box, paste ONLY the key, Load (queue is kept).</div></div><div id="ocr_status" class="admin-note"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_show" style="margin-left:8px">Show paste box</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear saved key</button><div id="ans_msg" class="admin-note"></div>`;form.before(p);const sb=form.querySelector('button[type=submit]');if(sb){const r=document.createElement('div');r.id='ans_res';r.className='admin-note';r.style.fontWeight='bold';r.style.color='#1769aa';r.style.marginTop='12px';sb.insertAdjacentElement('afterend',r);}const saveMeta=()=>store.set('ocrMeta',Object.fromEntries(FIELDS.map(id=>[id,$(id).value])));function parseHeader(text){const header=text.split('\n').slice(0,3).join(' ').toUpperCase();let year=null;const ym=header.match(/\b(20\d{2})\b/);if(ym)year=ym[1];return{year,header};}function applyHeaderInfo(text){const{year,header}=parseHeader(text);if(year)$('exam_year').value=year;const select=$('subject_id');const aliases=[{match:/\bC\s*\.?\s*R\s*\.?\s*K\b|\bCRK\b|\bCHRISTIAN RELIGIOUS\b/,keywords:['CRS','CHRISTIAN RELIGIOUS']}];let subjectSet=false;for(const alias of aliases){if(alias.match.test(header)){for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(alias.keywords.some(kw=>optText.includes(kw))){select.options[i].selected=true;subjectSet=true;break;}}}if(subjectSet)break;}if(!subjectSet){let subjectStr=header.replace(/\b(20\d{2})\b/g,'').replace(/\b(THE|AND|FOR|ANSWERS|QUESTIONS|STRUCTURED|IMPROVISED|PAPER|OBJECTIVE|SECTION|OF|IN|A)\b/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();if(subjectStr){let bestMatchIndex=-1;let bestMatchScore=-1;for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(!optText||optText.includes('-- SELECT'))continue;if(subjectStr.includes(optText)){if(optText.length>bestMatchScore){bestMatchScore=optText.length;bestMatchIndex=i;}}else if(optText.includes(subjectStr)){if(subjectStr.length>bestMatchScore){bestMatchScore=subjectStr.length;bestMatchIndex=i;}}else{const optWords=optText.split(' ');const subWords=subjectStr.split(' ');let overlap=0;for(const w of subWords){if(w.length>2&&optWords.includes(w))overlap++;}if(overlap>0&&overlap>bestMatchScore){bestMatchScore=overlap;bestMatchIndex=i;}}}if(bestMatchIndex!==-1){select.options[bestMatchIndex].selected=true;subjectSet=true;}}}}function splitQuestions(text){const marks=[];let last=0;for(const m of text.matchAll(/(?:^|\n)\s*(\d{1,3})\.\s+/g)){const n=+m[1];if(last&&(n<=last||n>last+5))continue;marks.push({n,start:m.index,end:m.index+m[0].length});last=n;}const chunks=marks.map((m,i)=>({num:m.n,text:text.slice(m.end,marks[i+1]?.start)}));const head=text.slice(0,marks[0]?.start??text.length).trim();if(head){const headOpts=head.match(OPTION);if(headOpts&&headOpts.length>=2){chunks.unshift({num:null,text:head});}}return chunks;}function parseQuestion({num,text}){const raw=text.replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ').replace(/\n{3,}/g,'\n\n');const clean=s=>s.replace(/\s+/g,' ').trim();const pos={},count={};for(const m of raw.matchAll(OPTION)){const letter=m[1]||m[2];if(!letter)continue;pos[letter]={start:m.index,end:m.index+m[0].length};count[letter]=(count[letter]||0)+1;}const LOOSE={E:/\n[^\S\n]*E[^\S\n]+(?=\S)/,F:/\n[^\S\n]*F[^\S\n]+(?=\S)/};for(const X of 'EF'){const P=X==='E'?'D':'E';if(pos[X]||!pos[P])continue;const lm=LOOSE[X].exec(raw.slice(pos[P].end));if(lm){const s=pos[P].end+lm.index;pos[X]={start:s,end:s+lm[0].length};}}const marks=Object.entries(pos).sort((a,b)=>a[1].start-b[1].start);const q={num,question:clean(raw.slice(0,marks[0]?.[1].start??raw.length)),a:'',b:'',c:'',d:'',e:'',f:'',flags:[]};marks.forEach(([letter,p],i)=>(q[letter.toLowerCase()]=clean(raw.slice(p.end,marks[i+1]?.[1].start))));if(num===null)q.flags.push('question number missing');if(q.question.length<10)q.flags.push('question text missing or very short');for(const l of 'abcdef'){if(!q[l]&&l<='d')q.flags.push(`option ${l.toUpperCase()} missing`);if(q[l]&&q[l].length>500)q.flags.push(`option ${l.toUpperCase()} over 500 characters`);}if(Object.values(count).some(c=>c>1))q.flags.push('a letter appears twice (merged questions?)');return q;}function fillForm(q){Object.entries(store.get('ocrMeta')||{}).forEach(([id,v])=>($(id).value=v));$('question_text').value=q.question;const keyAnswer=key[q.num];let finalA=q.a||'';let finalB=q.b||'';let finalC=q.c||'';let finalD=q.d||'';let correctIndex=-1;if(keyAnswer&&['A','B','C','D','E','F'].includes(keyAnswer)){if(keyAnswer==='E'||keyAnswer==='F'){const extra=keyAnswer==='E'?q.e:q.f;if(extra){finalD=extra;correctIndex=3;}}else{correctIndex='ABCD'.indexOf(keyAnswer);}}else{if(q.e)finalD+=(finalD?'\n\n':'')+'E. '+q.e;if(q.f)finalD+=(finalD?'\n\n':'')+'F. '+q.f;}$('option_a').value=finalA;$('option_b').value=finalB;$('option_c').value=finalC;$('option_d').value=finalD;form.querySelectorAll('[name=correct_option]').forEach(r=>(r.checked=false));if(correctIndex>=0){const radio=form.querySelector(`input[name="correct_option"][value="${correctIndex}"]`);if(radio)radio.checked=true;}}let queue=store.get('ocrQueue')||{items:[],i:0};const saveQ=()=>store.set('ocrQueue',queue);function renderOCR(){const q=queue.items[queue.i];const active=queue.items.length>0;$('ocr_input').hidden=q!==undefined;$('ocr_skip').hidden=!q;$('ocr_reset').hidden=!active;$('ocr_status').innerHTML=!active?'':!q?`All ${queue.items.length} questions done.`:`Question ${queue.i+1} of ${queue.items.length} (book number ${q.num??'?'})`+(q.flags.length?`<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>`:'');}function showOCR(){if(queue.items[queue.i])fillForm(queue.items[queue.i]);renderOCR();}const KEY_LINE=/^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*\(?([A-F])\)?\s*(?:[.)]\s*)?(?:$|[-–—/|:,;=]\s|\(|\[)/i;const PLACEHOLDER=/^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*[\[(]?\s*(?:missing|not\s+given|not\s+available|n\s*[/\\]\s*a|unavailable|no\s+answer)/i;const STEM_LINE=/^\s*\d{1,3}[.)]\s+\S.{11,}/;const KEY_WORD=/\b(ANSWERS?|KEY|SCHEME|SOLUTIONS?)\b/i;const INLINE_PAIR=/(\d{1,3})\s*[.\-:)]\s*\(?([A-F])\)?(?![A-Za-z])/gi;function splitSections(raw){const lines=[],starts=[];let prev=0;const nl=/\r\n|\n|\r/g;let nm;while((nm=nl.exec(raw))){lines.push(raw.slice(prev,nm.index));starts.push(prev);prev=nm.index+nm[0].length;}lines.push(raw.slice(prev));starts.push(prev);const ne=lines.map((t,i)=>({t,i})).filter(x=>x.t.trim());const isKey=t=>KEY_LINE.test(t)||PLACEHOLDER.test(t);const isStem=t=>!isKey(t)&&STEM_LINE.test(t);const pairs=t=>(t.match(INLINE_PAIR)||[]).length;function boundary(k,how){const line=lines[k]||'';const include=isKey(line)||pairs(line)>=2;return{questions:raw.slice(0,starts[k]),answers:raw.slice(include?starts[k]:(starts[k+1]??raw.length)),how};}for(const {t,i} of ne){if(/[=\-*_~#>+@|]{3,}/.test(t)&&KEY_WORD.test(t)&&t.trim().length<=120&&!/\?/.test(t)&&!/^\s*\d{1,3}[.)]/.test(t))return boundary(i,'divider');}if(ne.length&&ne.every(x=>isKey(x.t)))return{questions:'',answers:raw,how:'key-only'};for(const {t,i} of ne){const h=t.trim();if(!h||h.length>120||!KEY_WORD.test(h)||/\?/.test(h)||/^\s*\d{1,3}\s*[.)]/.test(h)||/^\s*[A-F]\s*[.)]/i.test(h))continue;const pos=ne.findIndex(x=>x.i===i);const after=ne.slice(pos+1,pos+7);if(after.length&&after.every(x=>isKey(x.t)))return boundary(i,'header');if(after[0]&&isKey(after[0].t)&&after.filter(x=>isKey(x.t)).length>=2)return boundary(i,'header');if(pairs(t)>=2)return boundary(i,'header');}let lastStem=-1;ne.forEach(x=>{if(isStem(x.t))lastStem=x.i;});if(lastStem>=0){for(const {t,i} of ne){if(i<=lastStem||!isKey(t)&&pairs(t)<3)continue;const pos=ne.findIndex(x=>x.i===i);const win=ne.slice(pos,pos+5);if(win.filter(x=>isKey(x.t)||pairs(x.t)>=3).length>=3)return boundary(i,'structure');}}return{questions:raw,answers:'',how:'none'};}$('ocr_load').onclick=()=>{const raw=$('ocr_text').value;const parts=splitSections(raw);const text=FIXES.reduce((t,[re,fix])=>t.replace(re,fix),parts.questions);const items=splitQuestions(text).map(parseQuestion);const newKey=parts.answers.trim()?parseKey(parts.answers):{};const hasKey=Object.keys(newKey).length>0;if(!items.length){if(hasKey){key=newKey;store.set('ansKey',key);if(queue.items[queue.i])fillForm(queue.items[queue.i]);tick(true);$('ans_msg').textContent+=' ('+Object.keys(key).length+' answers in key.)';renderOCR();$('ocr_status').innerHTML+=' Answer key only ('+Object.keys(key).length+' entries, '+parts.how+'). Question queue left unchanged.';return;}return alert('No questions found in that text.');}applyHeaderInfo(text);saveMeta();key=hasKey?newKey:{};if(hasKey)store.set('ansKey',key);else store.del('ansKey');queue={items,i:0};saveQ();showOCR();if(hasKey){tick();$('ans_msg').textContent+=' ('+Object.keys(key).length+' answers in key.)';$('ocr_status').innerHTML+=' Answer key: '+Object.keys(key).length+' entries ('+parts.how+').';}else{$('ans_msg').textContent='No answer key section detected. Any earlier key was cleared.';$('ocr_status').innerHTML+='<div class="admin-note">No answer-key section detected. Questions loaded with no key. Add a divider like <code>=== ANSWER KEY ===</code> on its own line if the key was missed.</div>';}};$('ocr_clear_text').onclick=()=>{$('ocr_text').value='';};$('ocr_skip').onclick=()=>{queue.i++;saveQ();showOCR();};$('ocr_reset').onclick=()=>{queue={items:[],i:0};saveQ();$('ocr_input').hidden=false;renderOCR();};$('ocr_show').onclick=()=>{$('ocr_input').hidden=false;$('ocr_text').focus();};let key={};try{key=store.get('ansKey')||{};}catch(e){}function cur(){try{const q=store.get('ocrQueue');return q&&q.items&&q.items[q.i]?{i:q.i,n:q.items[q.i].num,q:q.items[q.i]}:{i:-1,n:null};}catch(e){return{i:-1,n:null};}}function parseKey(t){const k={},r=/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g;let m;while((m=r.exec(t)))k[+m[1]]=m[2].toUpperCase();return k;}function tick(ask){const m=$('ans_msg');if(!Object.keys(key).length){m.textContent='No key saved yet.';return;}const c=cur();let n=c.n;if(n==null&&ask&&c.i<0){n=parseInt(prompt('Book question number?'),10);}if(!n){m.textContent='No question number. Pick the answer yourself.';return;}const a=key[n];if(!a){m.textContent='No answer for number '+n+' in the key. Pick it yourself.';return;}let idx='ABCD'.indexOf(a),note='';if(idx<0){if(!(c.q&&c.q[a.toLowerCase()])){m.textContent='Key says '+a+' for number '+n+', but no Option '+a+' text is loaded. Pick the answer yourself.';return;}idx=3;note=' (Option '+a+' was placed in Option D)';}const radio=document.querySelector(`input[name="correct_option"][value="${idx}"]`);if(radio)radio.checked=true;m.textContent='Question '+n+': ticked Option '+'ABCD'[idx]+' from the answer key'+note+'. Check it before saving.';}$('ans_clear').onclick=()=>{key={};store.del('ansKey');$('ans_msg').textContent='Key cleared.';};let last=cur().i;form.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();if(!queue.items.length)saveMeta();const b=form.querySelector('button[type=submit]'),r=$('ans_res');let s;b.disabled=true;r.textContent='Saving...';fetch(location.href,{method:'POST',body:new FormData(form),credentials:'same-origin'}).then(x=>{s=x.status;return x.text()}).then(t=>{const m=t.match(/Question saved successfully \(Question ID: (\d+)\)/);if(m){r.textContent='Saved as question #'+m[1]+'.';const q=cur();if(q.i>-1){const meta={};FIELDS.forEach(n=>meta[n]=form.elements[n].value);store.set('ocrMeta',meta);}['question_image','answer_video'].forEach(n=>{const el=form.elements[n];if(el)el.value='';});const ae=form.elements.answer_explanation;if(ae)ae.value='';if(q.i>-1){$('ocr_skip').click();}last=cur().i;if(last>-1){tick();}else{form.reset();}}else{const d=new DOMParser().parseFromString(t,'text/html'),er=d.querySelector('.admin-error');r.textContent='NOT saved: '+(t.indexOf('Administrator Login')>-1?'you were logged out. Reload the page and log in.':er?er.textContent.trim():'unexpected reply from the server (code '+s+').');}}).catch(()=>{r.textContent='NOT saved: network problem. Try again.';}).then(()=>{b.disabled=false;});},true);setInterval(()=>{const c=cur().i;if(c!==last){last=c;tick();}},600);const failed=document.querySelector('.admin-error');if(store.get('ocrSubmitted')){store.del('ocrSubmitted');if(!failed){queue.i++;saveQ();}}failed?renderOCR():showOCR();tick();}catch(e){alert('Bookmarklet Error: '+e.message);}})();
```

---

### 2. PARSER_BEHAVIOR_SPEC

**Startup**
- It removes any `script[src*="ocr_helper.js"]`, the old `#ocr_input` panel (its closest `.admin-field`) and `#ans_panel`.
- It finds the form through `input[name=action][value=save_question]`. It aborts with an alert if the form or `input[name=correct_option]` is missing, or if `location.search` contains `edit=`.
- It inserts a panel before the form with these elements:
  - `#ocr_text`
  - `#ocr_load`
  - `#ocr_clear_text`
  - `#ocr_skip`
  - `#ocr_reset`
  - `#ocr_show`
  - `#ans_clear`
  - `#ocr_status`
  - `#ans_msg`
- It adds `#ans_res` after the submit button.

**Splitting questions from the key (`splitSections`)**
It splits the paste into lines, then checks these rules in order and stops at the first match:
1. **Divider:** a line with 3 or more of `= - * _ ~ # > + @ |` in a row, a word from `ANSWER(S)/KEY/SCHEME/SOLUTION(S)`, at most 120 characters, no `?`, and not starting with a number plus `.` or `)`. Result: `divider`.
2. **Key-only:** every non-empty line looks like a key line. Result: `key-only`, with no questions.
3. **Header:** a line of at most 120 characters with a key word, no `?`, not starting with `N.` or `N)`, and not starting with `A.` to `F.`. It counts as a header if any one of these holds:
   - the next 6 non-empty lines are all key lines;
   - the first of those lines is a key line and at least 2 of the 6 are key lines;
   - the header line itself has at least 2 inline pairs (like `1.A 2.B`).

   Result: `header`.
4. **Structure:** after the last "stem line" (`N. ` followed by 12 or more characters that is not a key line), it looks for a line that is a key line or has 3 or more inline pairs. A 5-line window starting there must contain at least 3 key-like lines. Result: `structure`.
5. **None:** the whole paste is questions, with no key.

How the cut works:
- A key line is one that matches `KEY_LINE` or `PLACEHOLDER`, such as `5. [missing]`.
- The answers section starts at the boundary line itself if that line is a key line or has 2 or more inline pairs. Otherwise it starts on the next line, so a pure heading is dropped.

**Question boundaries and numbers (`splitQuestions`)**
- A marker is a line start followed by `N.` and whitespace, with N from 1 to 3 digits. Only the dot form is supported, not `N)`.
- A marker is kept only if it is the first one, or if `n > last` and `n <= last+5`. Repeats, backwards numbers and jumps of more than 5 are silently ignored.
- Text before the first marker is added as a chunk with `num=null`, but only if it contains 2 or more option markers.
- `FIXES` (3 OCR misspelling regexes) are applied to the question part only, not to the key.

**Parsing options A–F (`parseQuestion`)**
- It first normalises line endings, collapses runs of spaces and tabs to one space, and collapses 3 or more newlines to 2.
- `OPTION` matches a letter A–F followed by `.` or `)`, preceded by line start, a newline or whitespace. A second branch matches a letter followed by whitespace and a digit at the start of a line.
- Horizontal whitespace after the label is consumed, but line breaks are not (the T3 fix).
- If a letter appears more than once, the last position wins and the duplicate is flagged.
- The question text is everything before the first marker. Each option is the text from its marker to the next marker, with all whitespace collapsed to single spaces, so newlines inside options are lost.

**E/F loose fallback**
- If E has no proper marker and D has one, it searches after D for a line that starts with a lone `E` followed by whitespace and a non-space character.
- F is searched the same way after E, and only when E (proper or loose) exists.

**Answer key parsing (`parseKey`)**
- It scans for `1-3 digits`, optional punctuation (`. - : )`), an optional `(`, one letter A–F in either case, an optional `)`, and then a character that is not a letter.
- The result is `{number: 'A'..'F'}`, and the last duplicate number wins.
- `5. [missing]` creates no entry.

**Header metadata (year and subject)**
- It takes the first 3 lines of the questions text (after the key split and `FIXES`), joins them with spaces and uppercases them.
- Year: the first `20\d\d` sets `exam_year`.
- Subject, step 1: if the header matches a CRK/CRS pattern, it selects an option containing `CRS` or `CHRISTIAN RELIGIOUS`.
- Subject, step 2: otherwise it strips the year, stop words and punctuation, then picks the best fuzzy match among the `subject_id` options. It tries a substring match in either direction, then a word-overlap count counting only words longer than 2 characters.
- If nothing matches, the subject is left alone.
- Exam category is never inferred.

**Flags shown ("Check this one: …")**
- `question number missing` (num is null)
- `question text missing or very short` (under 10 characters)
- `option A/B/C/D missing` (empty; E and F are never flagged as missing)
- `option X over 500 characters` (A–F)
- `a letter appears twice (merged questions?)`

Not found in the code: a flag for numbering gaps, a flag for an empty or missing correct answer, and a flag for E/F options.

**Filling the form (`fillForm`)**
- It restores `subject_id`, `exam_category_id` and `exam_year` from the stored `ocrMeta`, then sets `question_text` and options A–D.
- It unticks all `correct_option` radios first.
- If the key has a letter for this question's number:
  - A–D: it ticks that radio.
  - E or F: if that option's text exists, Option D is replaced by it and D is ticked. Otherwise D is left alone and nothing is ticked.
  - In both cases, extra E/F text is dropped.
- If there is no key letter for this number, E and F are appended to D as `\n\n` + `E. text` and `\n\n` + `F. text`, and nothing is ticked.

**Ticking from the key (`tick`)**
- It also runs every 600 ms when the queue position changes.
- A–D tick the matching radio.
- E and F tick D, but only if the E/F text exists in the current queue item. It then says "(Option E was placed in Option D)".
- If there is no queue item and no number, it prompts "Book question number?" when called with `ask=true`.

**Key lifecycle**
- A paste with questions and a key replaces the key.
- A paste with questions and no key deletes the key.
- A paste with only a key replaces the key and leaves the queue alone.
- Reset Queue empties the queue but does not touch the key.
- "Clear saved key" empties the key.
- The key is read back from storage on every page load.

**Saving**
- A capture-phase `submit` listener calls `preventDefault` and `stopImmediatePropagation`, then posts the form with `fetch` to `location.href` (`FormData`, same-origin).
- Success means the response text contains `Question saved successfully (Question ID: N)`.
- On success it:
  - shows "Saved as question #N.";
  - stores the current three meta fields;
  - clears `question_image`, `answer_video` and `answer_explanation`;
  - clicks Skip (advances the queue) if a queue item was active, otherwise resets the form.
- Failures show "NOT saved: …". The messages cover a logged-out session (the response contains "Administrator Login"), the server's `.admin-error` text, an unexpected reply, and a network problem.

**localStorage keys**
- `ocrMeta`: subject, category and year.
- `ocrQueue`: `{items, i}`.
- `ansKey`: the answer key.
- `ocrSubmitted`: read and deleted at startup only. This bookmarklet never sets it (legacy from OH).

**Form fields touched**
- Written: `subject_id`, `exam_category_id`, `exam_year`, `question_text`, `option_a` to `option_d`, `correct_option` (radios).
- Cleared: `question_image`, `answer_video`, `answer_explanation`.
- Sent as-is: `csrf_token`, `action`, and `is_active` (whatever the checkbox currently shows).

---

### 3. EDGE_CASES

1. **Key-only paste**
   - Trigger: every non-empty line looks like a key line.
   - Expected: the key is replaced, the queue is kept, and the form is refilled for the current question.
   - Status: solved by code, but not tested in this conversation.
   - Source: B2.
2. **Divider line `=== ANSWER KEY ===`**
   - Trigger: a divider line with a key word.
   - Expected: it splits cleanly at that line.
   - Status: solved by code.
   - Source: B2.
3. **Header-style key ("ANSWERS" then key lines)**
   - Trigger: see the header rule in section 2.
   - Expected: split at the header.
   - Status: fragile (heuristic).
   - Source: B2.
4. **Structure-only key (no header)**
   - Trigger: a run of key-like lines after the last question.
   - Expected: split there.
   - Status: fragile.
   - Source: B2.
5. **Several answers per line (`1.A 2.B 3.C`)**
   - Expected: all pairs are read.
   - Status: solved by code.
   - Source: B2.
6. **Placeholder key line (`5. [missing]`)**
   - Expected: counted as a key line for splitting, but gives no key entry. The user then sees "No answer for number 5 in the key. Pick it yourself."
   - Status: solved by code, untested.
   - Source: B2.
7. **Blank option in the middle ("C." empty)**
   - Trigger: the Joseph sample (S1).
   - Expected: C stays blank and is flagged "option C missing". D keeps its own text without the "D." label.
   - Status: solved and tested on the parser.
   - Source: T3 (your bug 1).
8. **Option text on the line after the label (`A.` then text)**
   - Expected: the text is attached to A.
   - Status: solved and tested on the parser.
   - Source: T3.
9. **E/F with key, E correct, written "E. Abraham"**
   - Expected: E goes into Option D and D is ticked.
   - Status: works as before. Parser tested, `fillForm` and `tick` not run in a page.
   - Source: your report (your case 1).
10. **E/F with key, E correct, written "E Abraham" (no dot)**
    - Expected: same as the previous case. Before the fix, D went blank.
    - Status: parser tested, `fillForm` and `tick` untested in a page.
    - Source: T3 (your case 2).
11. **E/F with key, E wrong, written "E Abraham"**
    - Expected: E is removed and not merged into D.
    - Status: not tested by me.
    - Source: T3 (your case 3).
12. **E/F with key, E wrong, written "E. Abraham"**
    - Expected: E is removed.
    - Status: reported as already working. Not tested by me.
    - Source: your case 4.
13. **E/F with no key**
    - Expected: E (and F) are appended to D with "E. " or "F. " labels.
    - Status: you said "nothing wrong here".
    - Source: your report.
14. **Key says E but no E text found**
    - Expected: D is left alone, nothing is ticked, and the message says no Option E text is loaded.
    - Status: solved by code, untested.
    - Source: T3.
15. **Loose E/F detection**
    - Trigger: a line starting with a lone "E" or "F" plus whitespace and text, after D (or E).
    - Status: fragile.
    - Source: T3.
16. **Option-splitting step removed**
    - Trigger: an option containing a later letter, like "Vitamin C." or "Vitamin B-12".
    - Expected: it is not split.
    - Status: solved by removal.
    - Source: T1.
17. **Letter-like text inside the stem or an option ("Vitamin C. is…")**
    - Expected: ideally nothing is treated as an option. Nothing guards against this.
    - Status: fragile (inherited). It may trigger the "letter appears twice" flag or break the split.
    - Source: discussed in T1.
18. **Duplicate option letter**
    - Expected: flagged "a letter appears twice (merged questions?)".
    - Status: solved by code.
    - Source: B2.
19. **Question numbers out of order or jumping by more than 5**
    - Expected: ignored as markers, so the text is absorbed into the previous chunk.
    - Status: fragile.
    - Source: B2.
20. **Leading chunk with no number**
    - Expected: queued with `num=null` and flagged "question number missing". `tick` says "No question number. Pick the answer yourself." The number prompt only appears when there is no queue item.
    - Status: solved by code.
    - Source: B2.
21. **Option over 500 characters / question under 10 characters**
    - Expected: flagged.
    - Status: solved by code.
    - Source: B2.
22. **New paste must not reuse an old key**
    - Expected: questions with a key replace it, and questions without a key delete it.
    - Status: solved, syntax checked only.
    - Source: T2.
23. **Reset Queue**
    - Expected: no error.
    - Status: solved.
    - Source: T1.
24. **Edit page**
    - Trigger: URL contains `edit=`.
    - Expected: an alert, and nothing is installed.
    - Status: solved by code.
    - Source: B2.
25. **Session expired or network failure on save**
    - Expected: "NOT saved: …" messages.
    - Status: solved by code.
    - Source: B2.

---

### 4. INVARIANTS

- A key-only paste must not clear the question queue.
- A paste with questions must replace the old key, and with no key in the paste the old key must be cleared (T2).
- Blank options stay blank. An empty option must not pull the next option into its place (T3).
- The missing-option flag must name the letter that is actually missing.
- Duplicate option letters must be flagged.
- Options over 500 characters, a question under 10 characters and a missing question number must be flagged.
- With the key: E or F is placed in Option D and D is ticked, and a wrong E/F is removed. Without the key, E/F is appended to D.
- No radio may be pre-ticked unless the key provides the answer. The form's default Option A tick is cleared on fill (also HO decision 7d).
- The correct-option value sent must be 0–3. Radio value 4 does not exist.
- Reset Queue must not throw.
- The option-splitting block must stay removed unless it is rewritten with correct escaping and tested against "Vitamin C." and "Vitamin B-12".
- The bookmarklet must save only through the existing form post, with its CSRF token and action. Success is detected by the exact flash text from `admin_questions.php`.
- Inferred: it must stay a single line, with no `//` comments, because it lives in a `javascript:` URL.
- Numbering gaps flagged: HO decision 9 requires this, but the bookmarklet does not do it. Treat as a stated rule that is not yet implemented.

---

### 5. KNOWN_REGRESSION_RISKS

1. **Backslash escaping**
   - Risk: in B2 the `new RegExp(` block had single backslashes where it needed double, so it almost never matched. Fixing it would have made "Vitamin C." split wrongly.
   - Caution: tool output can display backslashes doubled.
   - Test: S5-style input and "Vitamin C." options.
2. **`OPTION` regex whitespace**
   - Risk: it used `\s*` after the label, which swallowed the line break and so the next label (bug 1).
   - Test: S1.
3. **Loose E/F**
   - Risk: a continuation line in D starting with "E " or "F " (for example "F = ma") would be taken as a new option.
   - Test: a D option followed by a line `F = ma`.
4. **Option-splitting step**
   - Risk: reintroducing it. It was removed in T1.
   - Test: "Vitamin C." and "Vitamin B-12" as options.
5. **Reset Queue scope**
   - Risk: using `items`, which is undefined outside `ocr_load`.
   - Test: click Reset Queue after loading.
6. **Key retention**
   - Risk: a no-key paste leaving an old key behind.
   - Test: load with a key, then load a different paste with no key. `ansKey` should be gone.
7. **`tick` for E/F**
   - Risk: the old `'ABCDEF'.indexOf(a)` gave radio value 4, which does not exist, while claiming "ticked Option E".
   - Test: a key of E for a question that has an E option.
8. **`cur()` return shape**
   - Risk: `tick` now relies on `cur().q`.
   - Test: queue loaded, skip, and the 600 ms interval still ticks.
9. **Section-splitting heuristics**
   - Risk: the order of rules (divider, key-only, header, structure) is fragile. B3 used a different algorithm that was judged weaker.
   - Test: a paste with a divider, a "ANSWERS" header, and no header or divider.
10. **Number-continuity filter**
    - Risk: `n>last+5` or `n<=last` may drop real questions when numbering restarts or OCR misreads a digit.
    - Test: a paste that restarts at 1.
11. **Subject inference**
    - Risk: the fuzzy match may pick a wrong subject.
    - Test: headers like "ENGLISH LANGUAGE 2023" against the site's subject list.
12. **Save-success regex**
    - Risk: it depends on the exact flash text in `admin_questions.php`.
    - Test: save one question.

---

### 6. SAMPLE_INPUTS

The only verbatim user-supplied question text is S1. S2 to S5 were written by me for testing, and S6 and S7 are incomplete or paraphrased.

**S1** (verbatim, from your bug report)
```text
3. As Joseph revealed himself to his brothers, he told them that God allowed him to be sold into slavery so as to
A. stop the famine
B. preserve life
C.
D. seek revenge
```
- Tests: a blank Option C in the middle.
- Expected: A "stop the famine", B "preserve life", C blank, D "seek revenge", and the flag "option C missing".
- Fixed: yes. Note that my test used a shortened stem, "As Joseph revealed himself, he told them God allowed him to be sold so as to", with the same options. The parser result was: A "stop the famine", B "preserve life", C "", D "seek revenge", flags `["option C missing"]`.

**S2** (written by me for testing)
```text
Who was the father of faith
A. Isaac
B. Jacob
C. Moses
D. David
E. Abraham
```
- Tests: E in the proper format.
- Expected: E is parsed as "Abraham", with no flags.
- Fixed: works (parser result confirmed).

**S3** (written by me)
```text
Who was the father of faith
A. Isaac
B. Jacob
C. Moses
D. David
E Abraham
```
- Tests: E without a dot.
- Expected: E is parsed as "Abraham", with no flags.
- Fixed: yes (parser result confirmed).

**S4** (written by me)
```text
Who was the father of faith
A. Isaac
B. Jacob
C. Moses
D. David
```
- Tests: a normal 4-option question.
- Expected: E empty, no flags.
- Fixed: works (parser result confirmed).

**S5** (written by me)
```text
Pick one of these items
A.
stop the famine
B. preserve life
C. x
D. seek revenge
```
- Tests: option text on the line after the label.
- Expected: A "stop the famine", with no flags.
- Fixed: yes (parser result confirmed).

**S6** (paraphrased, raw text not found)
- Your four E scenarios, described only as fragments:
  1. "E is Correct answer and has common option format i.e (E. Abraham)"
  2. "E is Correct answer but doesn't have the common option format i.e (E Abraham)"
  3. "E is the wrong answer and also has the wrong option format"
  4. "E is the wrong answer but has the correct option format"
- Expected behaviour is in section 3, cases 9 to 12. No full raw pastes with answer keys were provided.

**S7** (fragments from my earlier messages, not raw samples)
- `=== ANSWER KEY ===`
- `1.A 2.B 3.C`
- `5. [missing]`
- "Vitamin C." and "Vitamin B-12"
- "Group B)"

---

### 7. EXPECTED_BEHAVIOR_NOTES

- **S1**
  - Should: flag only C, keep D as "seek revenge", and leave C empty.
  - Should not: put "D. seek revenge" inside C, say "option D missing", or leave the "D." label in a field.
- **S2 / S3**
  - Should: parse E as "Abraham".
  - With a key of E: D becomes "Abraham" and D is ticked, in both formats.
  - With a key of A–D: E is dropped.
  - With no key: D gets `\n\n` + "E. Abraham" appended.
  - Should not: leave D blank, merge a wrong E into D, or show "ticked Option E".
- **S4**
  - Should: leave E and F empty and raise no flags.
  - Should not: invent an option E.
- **S5**
  - Should: attach the text on the next line to A.
  - Should not: treat the empty label line as a missing option.
- **Your stated assertions during debugging**
  - "An answer key is only relevant in the moment."
  - A new paste must not say "key retained".
  - E as the right answer replaces D, and a wrong E must be removed.
  - With no key, E appended to D is correct.

---

### 8. UNRESOLVED_ISSUES

1. **Live browser run**
   - Issue: never done. Only a syntax check and 5 parser samples were run. `fillForm`, `tick`, `splitSections` and the save flow were not exercised.
   - Unknown: real behaviour on the admin page.
2. **E/F cases 3 and 4 and the key-says-E path**
   - Issue: logic was changed and reasoned about, but not run through `fillForm`.
3. **Newlines in Option D**
   - Issue: option D is `<input type="text">`. Browsers normally strip line breaks from single-line inputs, so the `\n\n` before "E. …" may disappear when appended.
   - Unknown: you reported the appended E looked right. Not verified.
4. **Reset Queue and the key**
   - Issue: Reset does not clear the key. I offered to change it and you did not reply, so it is not decided.
5. **Key persisting across page reloads**
   - Issue: still read from `ansKey` on load. Your complaint was only about new pastes. Whether reload persistence is wanted is not stated.
6. **Numbering gaps**
   - Issue: HO says gaps and repeats should be flagged. The bookmarklet silently ignores out-of-order numbers and never flags gaps.
7. **CRK/CRS alias**
   - Issue: `admin_questions.html` lists no CRS or Christian Religious subject among its 10 subjects, so the alias probably matches nothing. This is inferred from that file.
8. **Key read from text with explanations**
   - Issue: `parseKey` scans the whole key section, so stray digit-plus-letter pairs in explanation text could create wrong entries. Not tested.
9. **OH leftovers**
   - Issue: removing the `ocr_helper.js` script tag does not remove listeners it already attached. Not discussed in the conversation. Uncertain.
10. **Link to the HO plan**
    - Issue: HO describes a different plan, a PHP Bulk Import page with AI reading photos. The bookmarklet is a paste-and-fill helper on the existing form. I found no decision in the conversation connecting the two.
11. **`is_active`**
    - Issue: the bookmarklet leaves the form's checkbox as is. The form defaults to ticked, so a question saves as active. HO planned inactive drafts for the Bulk Import tool. Not resolved.

---

### 9. DECISION_LOG

- **B2 as the base**
  - Why: best key detection (divider, header, structure, inline pairs, placeholders) and a "Show paste box" button for key-only fixes.
  - Risk: it carried two bugs, the Reset error and the dead option-splitting step.
- **Removing the option-splitting block**
  - Why: it barely matched in B2 and would split "Vitamin C." wrongly if fixed.
  - Risk: none known. The main splitter already handles A–F.
- **`OPTION` regex using `[^\S\n]*`**
  - Why: so a blank "C." line no longer eats "D.".
  - Risk: option text on the next line is only attached because slicing runs to the next marker.
- **Loose E/F detection**
  - Why: "E Abraham" written without a dot was invisible, so D went blank (key says E) or E stuck to D (key says A–D).
  - Risk: false positives on lines starting with a lone E or F. Limited to after D, and F only after E.
- **E/F mapped to Option D**
  - Why: the site has only four options, and `correct_option` is 0–3.
  - Risk: D's original text is overwritten when the key says E or F.
- **Key replaced or cleared on each paste with questions**
  - Why: your request that the key only matters in the moment.
  - Risk: a mid-queue key fix must use a key-only paste.
- **`cur()` returning `q`**
  - Why: `tick` needs to know whether the E/F text exists.
  - Risk: it depends on `ocrQueue` in storage including `e` and `f` fields.
- **Saving through `fetch` with a success-text match**
  - Why: it keeps the queue state without a page reload.
  - Risk: it breaks if the success message wording changes.
- **A 600 ms interval calling `tick`**
  - Why: it re-ticks when the queue index changes.
  - Risk: it can overwrite manual selection when the index changes.
- **Delivered as a `.txt` file and checked with `node --check` after stripping `javascript:`**
  - Why: the code is long and you are on a phone.

---

### 10. OPENCODE_HANDOFF_NOTES

**Critical constraints**
- It must remain one line with no `//` comments, since it runs from a bookmark. Inferred.
- Do not change the existing PHP form or its field names. The bookmarklet depends on `save_question`, `correct_option`, `option_a` to `option_d`, and the flash text "Question saved successfully (Question ID: N)".
- Do not improve or refactor in the first pass. Only make changes you can test.

**Dangerous areas**
- `splitSections` (heuristic order) and `splitQuestions` (the number filter).
- The `OPTION` and `LOOSE` regexes. Print the file and check that backslashes are single, not doubled.
- `fillForm` and `tick`, which have to agree on the E/F-to-D mapping and on when nothing gets ticked.

**What to preserve**
- Key-only paste keeps the queue.
- Key replaced or cleared on each paste with questions.
- Blank options stay blank.
- E/F rules: with a key, E/F goes to D or is removed. Without one, it is appended to D.
- All existing flags.
- Reset Queue as `queue={items:[],i:0}`.
- The option-splitting step stays removed.

**What to avoid**
- Reintroducing `new RegExp(` with template strings.
- Changing the key lifecycle without asking, since the Reset-and-key question is still open.
- Treating the bookmarklet as part of the HO Bulk Import plan without checking, because no link was decided.

**First steps in the new workspace**
1. Run the bookmarklet against the real admin page, or a copy, with S1 to S5 and a pasted key.
2. Confirm the `option_d` newline behaviour.
3. Ask whether Reset Queue should clear the key, and whether saves should default to inactive.