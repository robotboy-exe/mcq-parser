# MERGED MIGRATION BUNDLE: CBT Question Admin OCR Bookmarklet

## 0. CONTRADICTIONS & DISCREPANCIES
- **Logical Contradictions**: None found. The two variants are highly consistent in their technical specifications, regex patterns, and behavioral rules.
- **Discrepancies in Detail**: Variant 2 is effectively a superset of Variant 1. It contains more detailed formatting, explicit "Inferred"/"Uncertain" tags, version lineage tables, and file name suggestions for samples. 
- **Resolution Strategy**: Per instructions, the more detailed wording (primarily from Variant 2) has been retained for duplicates, while all unique items from Variant 1 have been integrated. 

---

## 1. CURRENT_CODE `[Both]`

### 1.1 Active Artifact (Most Complete / Final Accepted Version)
**Identity**: `bookmarklet_ocr_override_FINAL.txt`  
**Status**: Last version supplied. Includes the inline-capable option regex AND the absorbed-option post-processor. User's response after this version: *"damn I think we did it"*. No formal test run / test suite exists in the conversation.

```javascript
javascript:(function(){try{document.querySelectorAll('script[src*="ocr_helper.js"]').forEach(s=>s.remove());const op1=document.getElementById('ocr_input')?.closest('.admin-field');if(op1)op1.remove();const op2=document.getElementById('ans_panel');if(op2)op2.remove();const form=document.querySelector('input[name=action][value=save_question]')?.form;const f=document.querySelector('input[name=correct_option]');if(!form||!f||location.search.includes('edit=')){alert('Please open the "Add a New Question" page first.');return;}const FIXES=[[/govemment/gi,'government'],[/persidential/gi,'presidential'],[/resposible/gi,'responsible']];const FIELDS=['subject_id','exam_category_id','exam_year'];const OPTION=/(?:^|\n|\s)([A-F])\s*[.)]\s*|\n\s*([A-F])\s+(?=\d)/g;const $=id=>document.getElementById(id);const L=localStorage;const store={get:k=>JSON.parse(L.getItem(k)||'null'),set:(k,v)=>L.setItem(k,JSON.stringify(v)),del:k=>L.removeItem(k)};const p=document.createElement('div');p.className='admin-field';p.innerHTML=`<div id="ocr_input"><label for="ocr_text">Paste OCR text (Bookmarklet Override)</label><textarea id="ocr_text"></textarea><button type="button" class="admin-btn" id="ocr_load">Load questions</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button></div><div id="ocr_status" class="admin-note"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><div><label for="ans_text">Answer key (e.g. 1.B 2.C 3.A)</label><textarea id="ans_text"></textarea><button type="button" class="admin-btn" id="ans_save">Save key</button> <button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear key</button></div><div id="ans_msg" class="admin-note"></div>`;form.before(p);const sb=form.querySelector('button[type=submit]');if(sb){const r=document.createElement('div');r.id='ans_res';r.className='admin-note';r.style.fontWeight='bold';r.style.color='#1769aa';r.style.marginTop='12px';sb.insertAdjacentElement('afterend',r);}const saveMeta=()=>store.set('ocrMeta',Object.fromEntries(FIELDS.map(id=>[id,$(id).value])));function parseHeader(text){const header=text.split('\n').slice(0,3).join(' ').toUpperCase();let year=null;const ym=header.match(/\b(20\d{2})\b/);if(ym)year=ym[1];return{year,header};}function applyHeaderInfo(text){const{year,header}=parseHeader(text);if(year)$('exam_year').value=year;const select=$('subject_id');const aliases=[{match:/\bC\s*\.?\s*R\s*\.?\s*K\b|\bCRK\b|\bCHRISTIAN RELIGIOUS\b/,keywords:['CRS','CHRISTIAN RELIGIOUS']}];let subjectSet=false;for(const alias of aliases){if(alias.match.test(header)){for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(alias.keywords.some(kw=>optText.includes(kw))){select.options[i].selected=true;subjectSet=true;break;}}}if(subjectSet)break;}if(!subjectSet){let subjectStr=header.replace(/\b(20\d{2})\b/g,'').replace(/\b(THE|AND|FOR|ANSWERS|QUESTIONS|STRUCTURED|IMPROVISED|PAPER|OBJECTIVE|SECTION|OF|IN|A)\b/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();if(subjectStr){let bestMatchIndex=-1;let bestMatchScore=-1;for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(!optText||optText.includes('-- SELECT'))continue;if(subjectStr.includes(optText)){if(optText.length>bestMatchScore){bestMatchScore=optText.length;bestMatchIndex=i;}}else if(optText.includes(subjectStr)){if(subjectStr.length>bestMatchScore){bestMatchScore=subjectStr.length;bestMatchIndex=i;}}else{const optWords=optText.split(' ');const subWords=subjectStr.split(' ');let overlap=0;for(const w of subWords){if(w.length>2&&optWords.includes(w))overlap++;}if(overlap>0&&overlap>bestMatchScore){bestMatchScore=overlap;bestMatchIndex=i;}}}if(bestMatchIndex!==-1){select.options[bestMatchIndex].selected=true;subjectSet=true;}}}}function splitQuestions(text){const marks=[];let last=0;for(const m of text.matchAll(/(?:^|\n)\s*(\d{1,3})\.\s+/g)){const n=+m[1];if(last&&(n<=last||n>last+5))continue;marks.push({n,start:m.index,end:m.index+m[0].length});last=n;}const chunks=marks.map((m,i)=>({num:m.n,text:text.slice(m.end,marks[i+1]?.start)}));const head=text.slice(0,marks[0]?.start??text.length).trim();if(head){const headOpts=head.match(OPTION);if(headOpts&&headOpts.length>=2){chunks.unshift({num:null,text:head});}}return chunks;}function parseQuestion({num,text}){const raw=text.replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ').replace(/\n{3,}/g,'\n\n');const clean=s=>s.replace(/\s+/g,' ').trim();const pos={},count={};for(const m of raw.matchAll(OPTION)){const letter=m[1]||m[2];if(!letter)continue;pos[letter]={start:m.index,end:m.index+m[0].length};count[letter]=(count[letter]||0)+1;}const marks=Object.entries(pos).sort((a,b)=>a[1].start-b[1].start);const q={num,question:clean(raw.slice(0,marks[0]?.[1].start??raw.length)),a:'',b:'',c:'',d:'',e:'',f:'',flags:[]};marks.forEach(([letter,p],i)=>(q[letter.toLowerCase()]=clean(raw.slice(p.end,marks[i+1]?.[1].start))));const optionLetters=['a','b','c','d','e','f'];for(let i=0;i<optionLetters.length;i++){let text=q[optionLetters[i]];if(!text)continue;for(let j=i+1;j<optionLetters.length;j++){const nextLetter=optionLetters[j].toUpperCase();const regex=new RegExp(`(^|\\n|\\s)${nextLetter}\\s*[.)\\-]\\s*|(^|\\n)\\s*${nextLetter}\\s+`,'i');const match=text.match(regex);if(match){const splitIndex=match.index+match[0].length;const absorbedText=text.slice(splitIndex);q[optionLetters[i]]=clean(text.slice(0,match.index));q[optionLetters[j]]=clean(absorbedText);text=q[optionLetters[i]];break;}}}if(num===null)q.flags.push('question number missing');if(q.question.length<10)q.flags.push('question text missing or very short');for(const l of 'abcdef'){if(!q[l]&&l<='d')q.flags.push(`option ${l.toUpperCase()} missing`);if(q[l]&&q[l].length>500)q.flags.push(`option ${l.toUpperCase()} over 500 characters`);}if(Object.values(count).some(c=>c>1))q.flags.push('a letter appears twice (merged questions?)');return q;}function fillForm(q){Object.entries(store.get('ocrMeta')||{}).forEach(([id,v])=>($(id).value=v));$('question_text').value=q.question;const keyAnswer=key[q.num];let finalA=q.a||'';let finalB=q.b||'';let finalC=q.c||'';let finalD=q.d||'';let correctIndex=-1;if(keyAnswer&&['A','B','C','D','E','F'].includes(keyAnswer)){if(keyAnswer==='E'||keyAnswer==='F'){finalD=(keyAnswer==='E'?q.e:q.f)||'';correctIndex=3;}else{correctIndex='ABCD'.indexOf(keyAnswer);}}else{if(q.e)finalD+=(finalD?'\n\n':'')+'E. '+q.e;if(q.f)finalD+=(finalD?'\n\n':'')+'F. '+q.f;}$('option_a').value=finalA;$('option_b').value=finalB;$('option_c').value=finalC;$('option_d').value=finalD;form.querySelectorAll('[name=correct_option]').forEach(r=>(r.checked=false));if(correctIndex>=0){const radio=form.querySelector(`input[name="correct_option"][value="${correctIndex}"]`);if(radio)radio.checked=true;}}let queue=store.get('ocrQueue')||{items:[],i:0};const saveQ=()=>store.set('ocrQueue',queue);function renderOCR(){const q=queue.items[queue.i];const active=queue.items.length>0;$('ocr_input').hidden=q!==undefined;$('ocr_skip').hidden=!q;$('ocr_reset').hidden=!active;$('ocr_status').innerHTML=!active?'':!q?`All ${queue.items.length} questions done.`:`Question ${queue.i+1} of ${queue.items.length} (book number ${q.num??'?'})`+(q.flags.length?`<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>`:'');}function showOCR(){if(queue.items[queue.i])fillForm(queue.items[queue.i]);renderOCR();}$('ocr_load').onclick=()=>{const text=FIXES.reduce((t,[re,fix])=>t.replace(re,fix),$('ocr_text').value);const items=splitQuestions(text).map(parseQuestion);if(!items.length)return alert('No questions found in that text.');applyHeaderInfo(text);saveMeta();queue={items,i:0};saveQ();showOCR();};$('ocr_clear_text').onclick=()=>{$('ocr_text').value='';};$('ocr_skip').onclick=()=>{queue.i++;saveQ();showOCR();};$('ocr_reset').onclick=()=>{queue={items:[],i:0};saveQ();$('ocr_input').hidden=false;renderOCR();};let key={};try{key=store.get('ansKey')||{};}catch(e){}function cur(){try{const q=store.get('ocrQueue');return q&&q.items&&q.items[q.i]?{i:q.i,n:q.items[q.i].num}:{i:-1,n:null};}catch(e){return{i:-1,n:null};}}function parseKey(t){const k={},r=/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g;let m;while((m=r.exec(t)))k[+m[1]]=m[2].toUpperCase();return k;}function tick(ask){const m=$('ans_msg');if(!Object.keys(key).length){m.textContent='No key saved yet.';return;}const c=cur();let n=c.n;if(n==null&&ask&&c.i<0){n=parseInt(prompt('Book question number?'),10);}if(!n){m.textContent='No question number. Pick the answer yourself.';return;}const a=key[n];if(!a){m.textContent='No answer for number '+n+' in the key. Pick it yourself.';return;}const radio=document.querySelector(`input[name="correct_option"][value="${'ABCDEF'.indexOf(a)}"]`);if(radio)radio.checked=true;m.textContent='Question '+n+': ticked Option '+a+' from the answer key. Check it before saving.';}$('ans_save').onclick=()=>{key=parseKey($('ans_text').value);store.set('ansKey',key);if(queue.items[queue.i])fillForm(queue.items[queue.i]);tick(true);$('ans_msg').textContent+=' ('+Object.keys(key).length+' answers in key.)';};$('ans_clear').onclick=()=>{key={};store.del('ansKey');$('ans_msg').textContent='Key cleared.';};let last=cur().i;form.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();if(!queue.items.length)saveMeta();const b=form.querySelector('button[type=submit]'),r=$('ans_res');let s;b.disabled=true;r.textContent='Saving...';fetch(location.href,{method:'POST',body:new FormData(form),credentials:'same-origin'}).then(x=>{s=x.status;return x.text()}).then(t=>{const m=t.match(/Question saved successfully \(Question ID: (\d+)\)/);if(m){r.textContent='Saved as question #'+m[1]+'.';const q=cur();if(q.i>-1){const meta={};FIELDS.forEach(n=>meta[n]=form.elements[n].value);store.set('ocrMeta',meta);}['question_image','answer_video'].forEach(n=>{const el=form.elements[n];if(el)el.value='';});const ae=form.elements.answer_explanation;if(ae)ae.value='';if(q.i>-1){$('ocr_skip').click();}last=cur().i;if(last>-1){tick();}else{form.reset();}}else{const d=new DOMParser().parseFromString(t,'text/html'),er=d.querySelector('.admin-error');r.textContent='NOT saved: '+(t.indexOf('Administrator Login')>-1?'you were logged out. Reload the page and log in.':er?er.textContent.trim():'unexpected reply from the server (code '+s+').');}}).catch(()=>{r.textContent='NOT saved: network problem. Try again.'}).then(()=>{b.disabled=false;});},true);setInterval(()=>{const c=cur().i;if(c!==last){last=c;tick();}},600);const failed=document.querySelector('.admin-error');if(store.get('ocrSubmitted')){store.del('ocrSubmitted');if(!failed){queue.i++;saveQ();}}failed?renderOCR():showOCR();tick();}catch(e){alert('Bookmarklet Error: '+e.message);}})();
```

### 1.2 Readable Companion Artifact `[Variant 2]`
**Identity**: `parseQuestion_readable_FINAL.js`  
*Note: This is only the changed function, not a standalone program. `OPTION` must be the final regex from 1.1.*
```javascript
function parseQuestion({ num, text }) {
  const raw = text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const pos = {};
  const count = {};
  // 1. Main Regex Match
  for (const m of raw.matchAll(OPTION)) {
    const letter = m[1] || m[2];
    if (!letter) continue;
    pos[letter] = { start: m.index, end: m.index + m[0].length };
    count[letter] = (count[letter] || 0) + 1;
  }
  const marks = Object.entries(pos).sort((a, b) => a[1].start - b[1].start);
  const q = {
    num,
    question: clean(raw.slice(0, marks[0]?.[1].start ?? raw.length)),
    a: '', b: '', c: '', d: '', e: '', f: '',
    flags: []
  };
  marks.forEach(([letter, p], i) => {
    q[letter.toLowerCase()] = clean(raw.slice(p.end, marks[i + 1]?.[1].start));
  });
  // 2. Post-Processor to fix absorbed/missing options
  const optionLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
  for (let i = 0; i < optionLetters.length; i++) {
    let text = q[optionLetters[i]];
    if (!text) continue;
    for (let j = i + 1; j < optionLetters.length; j++) {
      const nextLetter = optionLetters[j].toUpperCase();
      // Look for the next option's label inside the current option's text
      const regex = new RegExp(`(^|\\n|\\s)${nextLetter}\\s*[.)\\-]\\s*|(^|\\n)\\s*${nextLetter}\\s+`, 'i');
      const match = text.match(regex);
      if (match) {
        const splitIndex = match.index + match[0].length;
        const absorbedText = text.slice(splitIndex);
        // Clear the current option (it was actually empty)
        q[optionLetters[i]] = clean(text.slice(0, match.index));
        // Move the absorbed text to the correct subsequent option
        q[optionLetters[j]] = clean(absorbedText);
        text = q[optionLetters[i]];
        break;
      }
    }
  }
  // 3. Standard flag checks
  if (num === null) q.flags.push('question number missing');
  if (q.question.length < 10) q.flags.push('question text missing or very short');
  for (const l of 'abcdef') {
    if (!q[l] && l <= 'd') q.flags.push(`option ${l.toUpperCase()} missing`);
    if (q[l] && q[l].length > 500) q.flags.push(`option ${l.toUpperCase()} over 500 characters`);
  }
  if (Object.values(count).some(c => c > 1)) q.flags.push('a letter appears twice (merged questions?)');
  return q;
}
```

### 1.3 Version Lineage (Alternatives — DO NOT deploy) `[Variant 2]`
| ID | `OPTION` regex | Why superseded |
|---|---|---|
| V0 (original) | `/(?<![A-Z])([A-F])\s*[.)]\s*/g` | Lookbehind-based; false positives on prose letters; single capture group. |
| V1 ("bulletproof") | `/(?:^\s*([A-F])\s*[.)]\s*\|\n\s*([A-F])(?:\s*[.)]\s*\|\s+(?=\d))\s*)/g` | Strict start/newline only. **Failed Q20** inline options (`A. love B. mercy C. redemption D. reconciliation`). |
| V2 (inline added) | `/(?:^|\n|\s)([A-F])\s*[.)]\s*\|(?:^|\n)\s*([A-F])\s+(?=\d)/g` | `^` in dotless branch caused **false duplicate-A on Q35** (`A 5 year old...`). |
| V3 (dotless caret removed) | `/(?:^|\n|\s)([A-F])\s*[.)]\s*\|\n\s*([A-F])\s+(?=\d)/g` | Fixed Q35, but **empty `C.` absorbed `D.`** (Q3 missing-option case). |
| **V4 FINAL (1.1)** | `/(?:^|\n|\s)([A-F])\s*[.)]\s*\|\n\s*([A-F])\s+(?=\d)/g` **+ post-processor** | Current. Handles inline + dotless-newline + absorbed/empty option. |

---

## 2. PARSER_BEHAVIOR_SPEC `[Both]`

### 2.1 Host / Installation `[Variant 2]`
- Runs only where `input[name=action][value=save_question]` has a form AND an `input[name=correct_option]` exists AND `location.search` does **not** contain `edit=`. Otherwise alerts and returns.
- Injects `.admin-field` div **before** the form, containing `#ocr_text`, `#ocr_load`, `#ocr_clear_text`, `#ocr_status`, `#ocr_skip`, `#ocr_reset`, `#ans_text`, `#ans_save`, `#ans_clear`, `#ans_msg`.
- Inserts `#ans_res` after the submit button.
- Pre-clean substitutions (case-insensitive, global), applied to pasted text only:
  - `govemment` → `government`
  - `persidential` → `presidential`
  - `resposible` → `responsible`

### 2.2 Section / Question Splitting (`splitQuestions`) `[Both]`
- Detects question numbers via regex `/(?:^|\n)\s*(\d{1,3})\.\s+/g`.
- Enforces sequential numbering: skips if `n <= last` or `n > last + 5`.
- Splits text into chunks between question number markers.
- Text before the first marker (`head`) is trimmed. It becomes an extra chunk `{num: null, text: head}` **only if** `head.match(OPTION)` returns ≥ 2 matches.
- Header-only text with fewer than 2 option matches is discarded as a chunk (but is still used for header inference on the whole text).
- *Consequence (inferred)*: A continuation instruction line sitting immediately before a numbered item (e.g., `According to Matthew in the beatitudes,` before `12.`) remains attached to the **previous** question's chunk.

### 2.3 Option Parsing (`parseQuestion`) `[Both]`
- **Normalization**: `raw = text.replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ').replace(/\n{3,}/g,'\n\n');` Newlines are preserved in `raw`; only extracted slices are collapsed by `clean = s => s.replace(/\s+/g, ' ').trim();`.
- **Active Regex**: `const OPTION=/(?:^|\n|\s)([A-F])\s*[.)]\s*|\n\s*([A-F])\s+(?=\d)/g;`
  - Branch 1 (`m[1]`): letter A–F preceded by start-of-string, newline, or **any whitespace**, then optional whitespace, then `.` or `)`, then optional whitespace. Supports inline options.
  - Branch 2 (`m[2]`): letter A–F at a **newline only**, optional whitespace, then one-or-more whitespace followed by a digit lookahead. No dot required. **Does not apply at start-of-string** (this is deliberate).
- **Dual capture handling**: `const letter = m[1] || m[2];`
- `pos[letter]` stores `{start,end}`; **last occurrence overwrites earlier** for the same letter.
- `count[letter]` increments for every match, including overwritten ones.
- Marks sorted ascending by `start`.
- `question` = `clean(raw.slice(0, firstMark.start))` (whole chunk if no marks).
- Each option = `clean(slice(mark.end, nextMark.start))`; last option runs to end of chunk.
- Uppercase A–F only; lowercase option labels are not recognized by the main regex.

### 2.4 Absorbed-Option Post-Processor `[Both]`
- After initial extraction, for each populated option `i` (a→f), scan for a **later** letter `j > i`:
  `new RegExp(\`(^|\\n|\\s)${nextLetter}\\s*[.)\\-]\\s*|(^|\\n)\\s*${nextLetter}\\s+\`,'i')`
- On first match:
  - `q[i] = clean(text.slice(0, match.index))`
  - `q[j] = clean(text.slice(match.index + match[0].length))`
  - break the inner loop, continue with next `i`.
- **Effects / limits**: Recovers a missing empty option (e.g., `C.` followed by `D. seek revenge`); strips the recovered option's own label from the transferred text; case-insensitive here (unlike the main regex); accepts `-` as a label delimiter here (main regex does not); does **not** update `pos`, `count`, or `marks`; duplicate-letter flag is computed from the **pre-post-processor** counts; only one split per option per pass.

### 2.5 Answer-Key Parsing (`parseKey`) `[Both]`
- Regex: `/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g`
- Extracts question number → letter mappings. Letters uppercased.
- Builds object `{ questionNumber: 'A'..'F' }`, separators optional; optional surrounding parentheses; negative letter lookahead.
- Persisted to `localStorage.ansKey` as JSON.
- `tick()` looks up the **book question number** (`q.num`) of the current queue item and checks radio `value = 'ABCDEF'.indexOf(answer)`.
- If no key: `No key saved yet.`
- If no current number: `No question number. Pick the answer yourself.`
- If number absent from key: `No answer for number N in the key. Pick it yourself.`
- Manual prompt for book number only when `ask === true`, current index `< 0`, and number is null.
- A 600 ms `setInterval` re-runs `tick()` whenever the persisted queue index changes.

### 2.6 Form Filling (`fillForm`) `[Both]`
- Restores `ocrMeta` for `subject_id`, `exam_category_id`, `exam_year`.
- Sets `question_text`.
- If key has a valid A–F for `q.num`:
  - A–D → `correctIndex = 'ABCD'.indexOf(letter)`.
  - **E or F → `option_d` is REPLACED by `q.e` / `q.f`, and `correctIndex = 3` (D).**
- If no valid key entry: `q.e` / `q.f` are appended to `option_d` as `E. ...\n\nF. ...`; **no correct radio is selected**.
- Unconditionally clears all `correct_option` radios before applying `correctIndex`.
- The page has only radios `0..3`.

### 2.7 Header / Year / Subject Inference (`applyHeaderInfo`, `parseHeader`) `[Both]`
- Header = first **3 lines** joined by a space, uppercased.
- Year = first `\b(20\d{2})\b` match in header → written to `exam_year` verbatim.
- Subject alias rule (checked first):
  - match `/\bC\s*\.?\s*R\s*\.?\s*K\b|\bCRK\b|\bCHRISTIAN RELIGIOUS\b/`
  - select first option whose uppercased text contains `CRS` or `CHRISTIAN RELIGIOUS`.
- Otherwise: strip year tokens and the stopword list `THE AND FOR ANSWERS QUESTIONS STRUCTURED IMPROVISED PAPER OBJECTIVE SECTION OF IN A`, strip non-word/space punctuation, collapse spaces.
- Score each non-placeholder select option:
  1. `subjectStr.includes(optText)` → score = `optText.length`
  2. else `optText.includes(subjectStr)` → score = `subjectStr.length`
  3. else count overlapping words of length > 2 → score = overlap count
  - highest score wins; first index wins ties.
- `exam_category_id` is **never inferred**.

### 2.8 Warning / Flag Behavior `[Both]`
Flags produced (in this order):
1. `question number missing` — when `num === null`.
2. `question text missing or very short` — `question.length < 10`.
3. `option X missing` — for each of A, B, C, D only, when empty.
4. `option X over 500 characters` — for any of A–F with `length > 500`.
5. `a letter appears twice (merged questions?)` — if any pre-post-processor `count > 1`.
- Rendered as `Check this one: <joined flags>` inside `.admin-alert.admin-error` in `#ocr_status`. Flags are advisory; they do **not** block loading or saving.

### 2.9 Queue / Persistence / Submission `[Both]`
- `localStorage` keys: `ocrQueue` (`{items,i}`), `ocrMeta`, `ansKey`, `ocrSubmitted` (read + deleted; **never written by this bookmarklet**).
- `Skip this question` increments `i`. `Reset Queue` clears items and index.
- Submit listener is **capture phase**, calls `preventDefault()` and `stopImmediatePropagation()`.
- POSTs `FormData(form)` to `location.href`, `credentials:'same-origin'` (carries the page's `csrf_token` hidden input).
- Success detection: response text matches `/Question saved successfully \(Question ID: (\d+)\)/`.
- On success: refreshes `ocrMeta`, clears `question_image` / `answer_video` file inputs and `answer_explanation`, clicks `#ocr_skip`, ticks next answer, or `form.reset()` when queue exhausted.
- On failure: reports `.admin-error` from a `DOMParser`-parsed reply, or logged-out message if reply contains `Administrator Login`, else `unexpected reply from the server (code STATUS)`.
- Network failure: `NOT saved: network problem. Try again.`
- On boot, if `.admin-error` exists → only `renderOCR()` (no auto-fill); otherwise `showOCR()` + `tick()`.

### 2.10 Server-Side Constraints (from `admin_questions.php`) `[Variant 2]`
- Actions: `save_question`, `update_question`, `login`, `logout`, `delete_question`; CSRF via `csrf_token` / `$_SESSION['cbt_admin_csrf']`.
- Exactly **4 non-empty options**, each **≤ 500 characters**.
- `correct_option` must be integer **0–3**.
- `exam_year` integer **1900–2100**.
- `subject_id` / `exam_category_id` must exist and be active; categories limited to `id <= 10`.
- `question_text` / `answer_explanation` ≤ 60000 chars.
- Successful write uses **Post/Redirect/Get**; success text is stored in `$_SESSION['cbt_admin_flash']` and rendered on the redirected GET page as `Question saved successfully (Question ID: N).`

---

## 3. EDGE_CASES `[Both]`
*(Merged table format from Variant 2, incorporating all Variant 1 cases)*

| # | Short name | Trigger condition | Expected behavior | Current status |
|---|---|---|---|---|
| E01 | Inline options on one line | `A. love B. mercy C. redemption D. reconciliation` (Q20) | All four options split; no flags | Handled in FINAL (was a failure in V1) |
| E02 | Prose leading article + digit | Chunk starts `A 5 year old boy...` | `A` is question text, not an option | Handled in FINAL (V2 false-positived) |
| E03 | Dotless option after newline | `\nA 75 years` | Recognized as option A | Handled in FINAL |
| E04 | Both E02 + E03 in same question | `A 5 year old...` then `\nA 75 years` | Exactly one option A; no duplicate flag | Handled in FINAL |
| E05 | Empty option label then next option | `C.\nD. seek revenge` | `q.c = ''`, `q.d = 'seek revenge'` (no `D.` prefix); flag says **C** missing, not D | Handled in FINAL via post-processor; previously D's text landed in C **with** its label |
| E06 | Dotted option at absolute start | `A. 5 years` | Option A | Handled |
| E07 | Dotted option on new line | `\nB. 75` | Option B | Handled |
| E08 | Prose `A good example` | No dot/paren after A | Not an option | Handled by design (dot required for non-newline-digit branch) |
| E09 | Missing question number | Head chunk with ≥2 option matches | `num=null`; flag `question number missing` | Handled / flagged |
| E10 | Very short / missing stem | `question.length < 10` | Flag only | Handled / flagged |
| E11 | Overlong option | Any option > 500 chars | Flag only (server would also reject) | Handled / flagged |
| E12 | Repeated option letter | Same letter matched twice | Flag `a letter appears twice (merged questions?)` | Handled / flagged; post-processor does not clear it |
| E13 | Non-sequential / gapped numbering | `n <= last` or `n > last + 5` | Candidate marker skipped | Handled by heuristic; can merge questions (risk) |
| E14 | Header-only preamble | Fewer than 2 option matches in head | No pseudo-question chunk | Handled |
| E15 | CRK / C. R. K. header alias | Header contains CRK variants | Select CRS / CHRISTIAN RELIGIOUS subject | Handled |
| E16 | Year in header | First `20\d\d` in first 3 lines | Written to `exam_year` | Handled; first-match heuristic |
| E17 | Fuzzy subject name | No alias match | Containment / word-overlap scoring | Handled heuristically; accuracy unverified |
| E18 | E/F options with saved key | Key answer E or F | Collapsed into D; radio D checked | **Existing deliberate limitation**, lossy |
| E19 | E/F options without key | No valid key entry | Appended as text into D; no radio selected | **Existing deliberate limitation** |
| E20 | Edit mode | URL contains `edit=` | Bookmarklet refuses to install | Handled |
| E21 | Logged out at submit | Reply contains `Administrator Login` | Specific re-login message | Handled |
| E22 | Server validation error | Reply contains `.admin-error` | Message surfaced in `#ans_res` | Handled |
| E23 | Network failure | `fetch` rejects | `NOT saved: network problem. Try again.` | Handled |
| E24 | Page reload mid-queue | `ocrQueue` in localStorage | Queue index restored; current item re-filled | Handled |
| E25 | Prior server error present | `.admin-error` on boot | Render status only; do not overwrite form | Handled |
| E26 | Legacy `ocrSubmitted` flag | Present in localStorage | Deleted; advance queue if no error | Present; writer not in this conversation (**uncertain**) |
| E27 | CRLF / excess blank lines | `\r\n`, 3+ newlines | Normalized before parsing | Handled |
| E28 | Quoted / curly-quote stems | Q36, Q38 style text | Treated as ordinary stem text | Present in sample; no special handling, no reported failure |
| E29 | Underscore blanks in stem | `-----`, `--- and ---`, `__` | Left as-is in question text | Present in sample; no normalization |
| E30 | Continuation instruction before number | `According to Matthew...` before `12.` | Stays on previous chunk | **Inferred behavior; unaddressed** |

---

## 4. INVARIANTS `[Both]`
1. The bookmarklet must keep overriding / removing `ocr_helper.js` and the legacy `#ocr_input` / `#ans_panel` UI. `[Variant 2]`
2. It must refuse to run on the **Edit** page (`edit=` in query) and require the Add-a-New-Question form. `[Variant 2]`
3. Form must contain `input[name=action][value=save_question]`. `[Variant 1]`
4. Form must contain `input[name=correct_option]` radio buttons. `[Variant 1]`
5. Page must NOT be in edit mode (`location.search` must not contain `edit=`). `[Variant 1]`
6. Option labels recognized are **uppercase A–F only** in the main regex; the page itself only accepts four options and radios 0–3. `[Variant 2]`
7. Correct option radio values are 0-3 (A-D). `[Variant 1]`
8. A leading article at the start of a question chunk (`A 5 ...`, `A good ...`) must **never** be treated as an option unless it has `.` or `)`. `[Variant 2]`
9. The dotless-letter exception is allowed **only after a newline AND only when followed by a digit**. It must not be re-extended to `^`. `[Variant 2]`
10. Inline options (`... A. x B. y ...`) must continue to be supported. `[Variant 2]`
11. Newlines must survive normalization up to option matching. A blanket `text.replace(/\s+/g,' ')` before matching is forbidden. `[Variant 2]`
12. Dual capture handling must remain: `const letter = m[1] || m[2];`. `[Variant 2]`
13. E/F answers are merged into option D field, correct index set to 3. `[Variant 1]`
14. An empty option must be reported as **that** option missing; a subsequent option's label must not be left inside the previous option's field. `[Variant 2]`
15. Option text written to the form must not carry its own `A.` / `B.` / etc. label. `[Variant 2]`
16. Flags are advisory only; they must not silently block the queue. `[Variant 2]`
17. `localStorage` keys used: `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`. `[Variant 1]`
18. `subject_id`, `exam_category_id`, `exam_year` are carried forward via `ocrMeta` between questions. `[Variant 2]`
19. Queue structure: `{items: [], i: 0}`. `[Variant 1]`
20. Meta fields: `['subject_id', 'exam_category_id', 'exam_year']`. `[Variant 1]`
21. Answer-key lookup is by **printed book question number**, not by queue position. `[Variant 2]`
22. FIXES array applied before parsing: `govemment→government`, `persidential→presidential`, `resposible→responsible`. `[Variant 1]`
23. Submit must remain intercepted in capture phase so the live page's own handler does not double-submit. `[Variant 2]`
24. The CSRF token already in the form must be submitted unchanged. `[Variant 2]`
25. After successful save, `question_image`, `answer_video`, `answer_explanation` fields cleared. `[Variant 1]`
26. Success detected by matching `/Question saved successfully \(Question ID: (\d+)\)/` in response. `[Variant 1]`
27. Failure detected by presence of `.admin-error` in response or "Administrator Login" text. `[Variant 1]`
28. Server limits remain: 4 non-empty options, ≤500 chars each, correct_option 0–3, year 1900–2100. `[Variant 2]`

---

## 5. KNOWN_REGRESSION_RISKS `[Both]`
1. **Whitespace consumption at match boundaries (R01)**. `\s*` after a label can consume the newline before the next label, so the next label may no longer have a preceding `\n`/`\s` for branch 1. This is the mechanism behind the Q3 `C.` / `D.` absorption. Currently rescued by the post-processor, not by the main regex. `[Variant 2]`
2. **`^` in the dotless branch (R02)**. Previously caused the Q35 duplicate-A regression. Adding it back for "consistency" will re-break it. `[Variant 2]`
3. **Blanket whitespace collapse before matching (R03)**. Previously broke newline-dependent matching. `[Variant 2]`
4. **Strict start/newline-only regex (R04)**. Previously broke Q20 inline options. `[Variant 2]`
5. **Post-processor is a heuristic (R05)**. Its second alternative `(^|\n)\s*LETTER\s+` has no digit lookahead and is case-insensitive; prose beginning a line with a lone letter word (e.g., a Bible reference or `A ...`) could be split incorrectly. Not exercised by the supplied samples. `[Variant 2]`
6. **Post-processor does not recompute `count`/`pos` (R06)**. A recovered option will not clear an already-set duplicate-letter flag, and a falsely split option will not raise one. `[Variant 2]`
7. **`pos` last-write-wins (R07)**. Duplicate letters overwrite the earlier position while `count` still records both; extraction order can therefore be surprising. `[Variant 2]`
8. **Numbering gap heuristic (`n > last + 5`) (R08)**. Genuine gaps larger than 5, or OCR renumbering, cause skipped markers and merged questions. `[Variant 2]`
9. **E/F handling is lossy (R09)**. E/F collapse into D; key E/F marks radio D. Page has no E/F radios. Any "fix" here changes server-visible semantics. `[Variant 2]`
10. **`tick()` for E/F (R10)**. Computes radio value 4/5 which does not exist; message still claims an option was ticked. (Inferred from code; not reported as a user bug). `[Variant 2]`
11. **Fetch success-string coupling (R11)**. The bookmarklet matches the success text in the POST response, but the PHP uses PRG + session flash. Whether the fetched body contains that string is **uncertain** and was never confirmed in the conversation. This is the highest-risk untested integration point. `[Variant 2]`
12. **Repeated bookmarklet injection (R12)** creates a new `setInterval` and new DOM each time; only `#ocr_input` / `#ans_panel` are cleaned up. (Inferred risk). `[Variant 2]`
13. **Subject fuzzy matching (R13)** can select a wrong subject on noisy headers; alias list currently contains only the CRK entry. `[Variant 2]`
14. **Year = first 20xx in first 3 lines (R14)** may pick a copyright/reference year rather than the exam year. (Inferred risk). `[Variant 2]`
15. **`localStorage` is origin-wide (R15)** and shared with the live `ocr_helper.js`; key names `ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted` are a de-facto contract. `[Variant 2]`

---

## 6. SAMPLE_INPUTS `[Both]`
*(Preserved verbatim as requested)*

### S1 — Full CRK 2021 block (user-supplied, complete as pasted) `[Both]`
File name suggestion: `sample_01_crk_2021_full.txt` `[Variant 2]`
```text
IMPROVISED C. R. K. QUESTIONS FOR 2021 (P.M. Onoriode, Unilag)
 1. What is the meaning of the name Samuel?
 A. because i have asked him of the Lord
 B. God is powerful
 C. God has made me laugh
 D. the child of my old age
 E. the end of Peninnah's pride
 2. Jesus was baptised in the river Jordan by
 A. the angel Gabriel
 B. John
 C. Mary Magdalene
 D. Paul
 3. The Acts of the Apostles was written by
 A. st. Luke
 B. the apostle Paul
 C. all the Apostles
 D. the pope
 4. The three wise men who visited Jesus at his birth came from the
 A. the North
 B. the East
 C. the south
 D. egypt
 5. The bible made it clear that many Christians suffer for lack of
 A. wisdom
 B. faith
 C. knowledge
 D. understanding
 6. Christians are advised to endeavour to know the truth, for this truth shall...
 A. increase their wisdom
 B. set them free
 C. make them holy
 D. increase their faith
 7. "Blessed are the merciful", according to Jesus, for they shall.
 A. see God
 B. be satisfied
 C. obtain mercy
 D. be called sons of God
 8. Which of these attributes of God is emphasised most by Isaiah
 A. his love
 B. his faithfulness
 C. his holiness
 D. his mercy
 9. Peter and John healed a man who was----- at the Beautiful gate
 A. blind
 B. dumb
 C. lame
 D. deaf
 10. Who was forced to carry the cross behind Jesus?
 A. peter
 B. Joseph of Arimathea
 C. Andrew
 D. Simon of Cyrene
 11. Jesus was born in bethlehem of
 A. Samaria
 B. Judea
 C. Nasareth
 D. Capernanm
 According to Matthew in the beatitudes,
 12. "Blessed are the poor in spirit for.....
 A. theirs is the kingdom of heaven
 B. they shall see God
 C. they shall inherit the earth
 D. obtain mercy
 13. Blessed are the pure in heart for....
 A. theirs is the kingdom of heaven
 B. they shall see God
 C. they shall be comforted
 D. shall be filled
 14. What is sweeter than honey' "what is stronger than lion" who gave this riddle?
 A. samson
 B. Joseph
 C. Solomon
 D. Jesus
 15. The transfiguration of Jesus, according to Luke, took place on the mountain while he was....
 A. fasting
 B. praying
 C. talking with an angel
 D. preaching
 16. Changing water into wine was the .... miracle that Jesus performed
 A. first
 B. second
 C. third
 D. forth
 17. Which angel appeared to mary, when Elizabeth was pregnant for six month
 A. Michael
 B. Raphel
 C. Gabriel
 D. Dominic
 18. The centirion who was converted and babtised by peter was
 A. Nicodemas
 B. Cornelius
 C. Lazarus
 D. Jairus
 19. The only commandment which has a promise attached to it concerns
 A. keeping the Sabbath
 B. respecting parents
 C. not taking the name of the Lord in vain
 D. Not stealing
 20. The rainbow as the sign of God's convenant with Noah implies
 A. love B. mercy C. redemption D. reconciliation
 21. God called the firmament he created...
 A. earth
 B. light
 C. heaven
 D. darkness
 E. water
 22. In the storm of the creation God made the greater light to rule the day and the lesser light to rule the....
 A. morning
 B. afternoon
 C. darkness
 D. night
 23. In the book of genesis light was created on the --- day
 A. second
 B. third
 C. seventh
 D. first
 24. The names of the two wives of Elkanah were --- and --- respectively
 A. Hannah, Peninnah
 B. Hannah, ruth
 C. Deborah, Peninnah
 D. Hannah, Magdalene
 25. Samuel was __ son born for him by ___
 A. Elkanah, Peninnah
 B. Elkanah, Hannah
 C. David, Hannah
 D. Abraham, Sarah
 26. Which of the options below is the odd one out
 A. peter
 B. James
 C. John the batist
 D. John
 27. According to James, pure religion combines
 A. faith and worship
 B. faith and work
 C. worship and work
 D. work and fasting
 28. The genuineness of faith according to peter is tested through
 A. fasting
 B. work
 C. prayer
 D. trials
 29. The phrase " died to sin" as used by paul in his letter to the romans meant
 A. complete renewal of life without sin
 B. a sinner dying unrepented
 C. living in sin after death
 D. that sin was the cause of death
 30. Two Christian virtues to be learnt in the story of the good samaritan are
 A. justice and humility
 B. compassion and humility
 C. compassion and mercy
 D. kindness and trust
 31. 'God opposes the proud, but gives grace to the humble'
 This teaching of peter emphasizes
 A. faithfulness
 B. uprightness
 C. humility
 D. obedience
 E. steadfastness
 32. The theme of paul's letter to philemon is
 A. truthfulness
 B. forgiveness
 C. simplicity
 D. humility
 E. perseverance
 33. Which of the following examples from the I Corinthians illustrates Christian unity?
 A. the different positions in the church membership
 B. uncoordinated functioning of the parts of the human body
 C. manifestation of spiritual gifts for the common good
 D. different parts of the human body working together
 E. the breaking down of racial barriers in Christianity
 34. According to 1 Peter, those who resist authorities will merit
 A. expulsion from the christian community
 B. judgement and imprisonment
 C. the judgement of constituted authority and God
 D. the judgement of individual conscience
 E. loss of eternal life
 35. In 1 Corinthians, Paul says he is least of the Apostles because he
 A. was not one of the twelve
 B. persecuted the church
 C. was the last to be called by Jesus
 D. was an apostle to the gentiles
 E. recieved the least persecution
 36. "Go and search diligently for the child, and when you have, "found him bring me word..."
 The intention of the speaker in this context was
 A. pay homage to the Lord Jesus
 B. kill all the children in the area
 C. present gifts to the child
 D. kill the child
 37. Jesus Christ, the good shepherd was loved by the father because He
 A. understood the needs of the sheep
 B. loved the sheep
 C. tended the sheep
 D. laid down His life for the sheep
 38. “Lord, do not trouble yourself, for I am not worthy to have you come under my roof,...” The continuation of this message by the centurion indicated that
 A. he was afraid of Jesus
 B. he had faith in the power of Jesus’ word
 C. as a gentile, he did not like the jews
 D. as an army officer, he wanted to avoid contact with Jesus
 39. Solomon asked God for wisdom to enable him
 A. live a long life
 B. deal decisively with his enemies
 C. acquire wealth and power
 D. discern what was right
 40. Who appeared and talked with Jesus during the transfiguration?
 A. Moses and Elijah
 B. Moses and Samuel
 C. Samuel and Elisha
 D. Elisha and Elijah
```

### S2 — Prose article + dotless option (user-supplied, incomplete question) `[Both]`
File name suggestion: `sample_02_article_vs_option.txt` `[Variant 2]`
**Incomplete:** stem is truncated to `... time ?`; no answer key supplied. `[Variant 2]`
```text
35. A 5 year old boy is brought to the clinic... time ?
A 75 years
B. 105 years
C. 85 years
D. 99 years
```
Reported failure before fix: `Check this one: a letter appears twice (merged questions?)` `[Variant 2]`

### S3 — Empty option C (user-supplied, incomplete question) `[Both]`
File name suggestion: `sample_03_empty_option_c.txt` `[Variant 2]`
**Incomplete:** numbered item only; no surrounding block or answer key. `[Variant 2]`
```text
3. As Joseph revealed himself to his brothers, he told them that God allowed him to be sold into slavery so as to
A. stop the famine
B. preserve life
C.
D. seek revenge
```

### S4 — Assistant-constructed micro-examples (NOT user OCR) `[Variant 2]`
Labelled as illustrations used in explanation only:
```text
A 5 year old boy is brought to the clinic...
A. 5 years
A 75
B. 75
What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
What is the capital of Nigeria? A. Lagos B. Abuja C. Kano D. Ibadan
```

### S5 — Answer-key format example (from UI label) `[Variant 2]`
```text
1.B 2.C 3.A
```

---

## 7. EXPECTED_BEHAVIOR_NOTES `[Both]`

### S1 — CRK 2021 block `[Both]`
- **Should happen**:
  - Produce 40 queued items numbered 1–40. `[Variant 2]`
  - Infer `exam_year = 2021`. `[Variant 2]`
  - Infer subject via CRK alias → option containing `CRS` or `CHRISTIAN RELIGIOUS`, if present in the select. `[Variant 2]`
  - **Q20** must yield `a="love"`, `b="mercy"`, `c="redemption"`, `d="reconciliation"` with **no** flags. `[Variant 2]`
  - Questions with E options (1, 21, 31, 32, 33, 34, 35) have E merged into D field / subject to the E/F limitation. `[Both]`
  - Q31's two-line stem should be joined into one cleaned stem. `[Variant 2]`
  - Q36 / Q38 quoted stems remain intact; curly quotes are not stripped. `[Variant 2]`
  - Q9 / Q23 / Q24 / Q25 underscore blanks remain in the stem. `[Variant 2]`
  - Header-only preamble must not become a `num:null` question. `[Variant 2]`
- **Should NOT happen**:
  - Question text "A" in "A. because i have asked..." should not be confused with article "A". `[Variant 1]`
  - No false "letter appears twice" flags. `[Variant 1]`
  - Must not flag Q20 as missing options or duplicate letters. `[Variant 2]`
  - Must not invent an answer when no key is loaded. `[Variant 2]`
  - Must not silently repair spelling errors not in `FIXES` (e.g., `convenant`, `Raphel`, `centirion`, `Nasareth`, `Capernanm`, `batist`, `recieved`) — no such fixes exist in the code. `[Variant 2]`
- **Known/inferred quirk**:
  - The line `According to Matthew in the beatitudes,` stays at the end of **Q11**'s chunk; Q12's stem starts at the quote. Not raised as a bug in the conversation — **unresolved / unconfirmed as desirable**. `[Variant 2]`

### S2 — Article vs option `[Both]`
- **Should happen**:
  - `question` contains `A 5 year old boy is brought to the clinic... time ?` `[Variant 2]`
  - `a="75 years"`, `b="105 years"`, `c="85 years"`, `d="99 years"`. `[Variant 2]`
  - No duplicate-letter flag; no missing-option flags. `[Variant 2]`
- **Should NOT happen**:
  - "A 5 year old boy" NOT treated as option A. `[Variant 1]`
  - Must not treat the leading `A 5` as option A. `[Variant 2]`
  - Must not drop the real `\nA 75` option. `[Variant 2]`
  - "a letter appears twice" error. `[Variant 1]`
  - Question text truncated at "A". `[Variant 1]`

### S3 — Empty option C `[Both]`
- **Should happen**:
  - Option A = "stop the famine", Option B = "preserve life", Option C = "" (empty), Option D = "seek revenge". `[Variant 1]`
  - `a="stop the famine"`, `b="preserve life"`, `c=""`, `d="seek revenge"`. `[Variant 2]`
  - Flag exactly `option C missing`. `[Variant 2]`
  - `d` must **not** contain the literal `D.` prefix. `[Variant 2]`
- **Should NOT happen**:
  - Option C containing "D. seek revenge". `[Variant 1]`
  - Flag: "option D missing". `[Variant 1]`
  - Option D being empty. `[Variant 1]`
  - Must not put `D. seek revenge` into C. `[Variant 2]`
  - Must not report D as missing. `[Variant 2]`
- **Mechanism note (inferred from regex behavior)**: C's trailing `\s*` can consume the newline before D, so D may not match the main regex at all; the **post-processor** is what performs the recovery. `[Variant 2]`

### S4 — Micro-examples `[Variant 2]`
- `A 5 year old ...` at chunk start → not an option.
- `A. 5 years` → option A.
- Newline `A 75` → option A.
- Newline `B. 75` → option B.
- Vertical A–D block → four options.
- Fully inline `A. Lagos B. Abuja ...` → intended to yield four options (this was the motivating case for re-adding inline support).

### S5 — Answer key `[Variant 2]`
- `1.B 2.C 3.A` → `{1:'B', 2:'C', 3:'A'}`.
- When queue is on book question 1, radio value `1` (Option B) is checked.
- Missing numbers leave the radio untouched and produce a "pick it yourself" message.

---

## 8. UNRESOLVED_ISSUES `[Both]`
1. **Question 11-12 transition in Sample 1 (U04)** — There is unnumbered text "According to Matthew in the beatitudes," between questions 11 and 12. Uncertain whether this is correctly handled or absorbed into question 11/12. Not discussed as a fix. `[Both]`
2. **Post-processor false positive potential (U05)** — If an option's legitimate text starts with an isolated capital letter A-F followed by a space at the beginning of a line, the post-processor might incorrectly split it. No reported case yet / no test case supplied. `[Both]`
3. **Answer key E/F tick behavior (U01, R10)** — The `tick()` function uses `'ABCDEF'.indexOf(a)` which returns 4 or 5 for E/F, but the form only has radio values 0-3. E/F answer key matching may not correctly tick the radio. Collapsed into D; key E/F marks radio D. Uncertain if this is intentional (since E/F merge into D) or a bug. No decision was made to change this. Server accepts only 4 options. `[Both]`
4. **OCR text with no options detected** — If `splitQuestions` finds question numbers but no option markers in a chunk, behavior is uncertain. Likely produces empty options with flags. `[Variant 1]`
5. **Header subject fuzzy matching reliability (U08)** — The word-overlap scoring approach for subject matching has no explicit test cases beyond CRK. May fail for unusual subject names. Accuracy unverified. `[Both]`
6. **POST success detection vs PRG (U02, R11)** — The bookmarklet greps the POST response for `Question saved successfully (Question ID: N)`, while `admin_questions.php` redirects and flashes that message on the next GET. Whether this currently works in the live deployment is **UNCERTAIN / UNVERIFIED** in the conversation. `[Variant 2]`
7. **`ocrSubmitted` has no writer (U03, E26)** — Likely belongs to the removed live `ocr_helper.js`. Its purpose is **UNCERTAIN**. Present in localStorage logic; writer not in this conversation. `[Variant 2]`
8. **`exam_category_id` never auto-filled (U07)** — Always manual. `[Variant 2]`
9. **No automated tests exist (U09)** — All validation has been manual via the sample inputs in this bundle. Verification so far is manual, user-reported ("it worked", "damn I think we did it"). `[Both]`
10. **Numbering gaps > 5 (U10, E13)** — Non-monotonic OCR numbering and genuine gaps larger than 5 remain handled only by a skip heuristic, which risks merging questions. `[Variant 2]`
11. **Repeated injection / duplicate interval (U11, R12)** — Behavior not tested. (**Inferred**, low confidence as an actual observed problem). `[Variant 2]`
12. **Live `ocr_helper.js` source (U12)** — Was **never provided**; only its removal and the PHP script tag are known. `[Variant 2]`

---

## 9. DECISION_LOG `[Both]`
*(Merged table format from Variant 2, incorporating all Variant 1 decisions)*

| Decision | Reason |
|---|---|
| **Override the live helper instead of editing it (D01)** | The bookmarklet strips `ocr_helper.js` and the legacy panels so a single bookmarklet can be updated without redeploying server files. `[Variant 2]` |
| **Refuse edit mode (D02)** | Automation targets only `save_question`; editing existing records is deliberately out of scope. `[Variant 2]` |
| **Dual capture groups in OPTION regex (D04)** | Two regex alternatives needed (dot/paren vs missing-dot-newline), each requiring its own capture group. `m[1] \|\| m[2]` extracts whichever matched. `[Variant 1]` |
| **Move from lookbehind regex → strict newline regex (D03)** | Goal: stop prose articles (`A 5 year old`, `A good example`) being read as options. `[Variant 2]` |
| **Preserve newlines in `raw` before option matching (D05)** | The second regex alternative depends on `\n`. Collapsing all whitespace first would destroy this signal. Normalization now preserves newlines and cleans only extracted slices. `[Variant 1]` |
| **Re-add inline support via a whitespace-prefixed dotted branch (D06)** | Triggered by S1 Q20 failing under the strict version. A dot/parenthesis is still mandatory for inline matches. Enables mid-sentence/inline option detection while still requiring dot/paren to prevent false positives. `[Both]` |
| **Remove `^` from second regex alternative (D07)** | Prevents start-of-chunk text like "A 5 year old" from being treated as an option. Only newlines trigger the missing-dot exception. Rule固化: *dotless recognition is newline-only*. `[Both]` |
| **Add a post-processor rather than loosening the main regex (D08)** | Triggered by S3: an empty `C.` absorbed `D. seek revenge`, producing a misleading "option D missing". The post-processor relocates absorbed text to the correct later slot and strips its label, leaving the genuinely empty slot empty. OCR frequently omits or malforms option markers. Rather than making the main regex infinitely complex, a second pass detects and splits absorbed subsequent options. `[Both]` |
| **Post-processor requires punctuation for mid-text matches, but allows bare letter+space at line starts** | Balances safety (avoid splitting on "The letter B is...") with OCR quirk recovery (catching `\nD seek revenge`). `[Variant 1]` |
| **Keep flags advisory (D09)** | Human review is expected; the operator can skip or manually correct. Flags displayed in UI but do not block saving. `[Both]` |
| **E/F options merged into D field (D10)** | The PHP form only has 4 option fields (A-D). The database schema and form enforce exactly 4 options. E/F content is appended to D with labels preserved. Explicitly a compromise, not a claim of correctness for 5–6 option questions. `[Both]` |
| **Persist queue, meta and key in localStorage (D11)** | Enables reload-safe bulk entry and a separately pasted answer key keyed by printed book number. Allows bookmarklet to survive page reloads during multi-question entry sessions. `[Both]` |
| **Capture-phase submit interception + fetch (D12)** | Keeps the operator on the page, advances the queue automatically, and avoids a full reload per question. Prevents native form submission, enables AJAX-style save and queue advancement. `[Both]` |
| **Header inference limited to first 3 lines (D13)** | Chosen for OCR header layouts such as `IMPROVISED C. R. K. QUESTIONS FOR 2021 (...)`; CRK→CRS alias exists because the source paper label and the DB subject name differ. `[Variant 2]` |
| **FIXES array for common OCR typos** | Known recurring OCR errors (`govemment`, `persidential`, `resposible`) corrected before parsing. `[Variant 1]` |
| **Sequential numbering enforcement with +5 tolerance** | Prevents false matches on non-question numbers while allowing minor OCR numbering errors. `[Variant 1]` |

---

## 10. OPENCODE_HANDOFF_NOTES `[Both]`

### H01. What you are maintaining `[Variant 2]`
A single self-contained `javascript:` bookmarklet that injects an OCR bulk-entry UI into `admin_questions.php` and overrides the deployed `ocr_helper.js`. There is **no build step, no package.json, no test runner** in this conversation.

### H02. Files known to exist `[Variant 2]`
- `admin_questions.php` (uploaded; full content available in the knowledge base).
- `ocr_helper.js` (referenced by the PHP page; **source not available**).
- `cbt_db.php`, `cbt_admin_config.php` (referenced by PHP; not provided).
- The bookmarklet itself (Section 1.1) — the only artifact you may edit safely.

### H03. Do not touch `[Variant 2]`
- The PHP file's validation rules, CSRF handling, upload handling, or PRG flow.
- The live `ocr_helper.js` deployment model.
- The four-option / radio 0–3 contract of the form.

### H04. Mandatory regression set `[Variant 2]`
Run the FINAL bookmarklet's `splitQuestions` + `parseQuestion` against, **in one paste**:
1. S1 in full — assert 40 items, year 2021, Q20 has four clean inline options and zero flags.
2. S2 alone — assert stem retains leading `A 5`, options `75/105/85/99 years`, zero flags.
3. S3 alone — assert `c === ''`, `d === 'seek revenge'`, flags contain `option C missing` and **not** `option D missing`.
These three cases correspond to three separate real regressions. A change that fixes one and breaks another has already happened twice in this project.

### H05. If you must change the option regex `[Variant 2]`
Preserve invariants I04–I08. Specifically:
- Never add `^` to the dotless-digit alternative.
- Never remove the whitespace-prefixed dotted alternative.
- Never pre-collapse newlines.
- Re-check the trailing `\s*` boundary-consumption interaction (R01) before assuming the post-processor is redundant.

### H06. If you must change the post-processor `[Variant 2]`
Remember it does not update `pos` / `count` / `marks` (R06), and that its newline-single-letter alternative has **no digit lookahead** (R05). Any tightening should be justified with a failing sample, not speculation.

### H07. Highest-priority verification for a fresh agent `[Variant 2]`
Confirm U02 empirically: inspect what the live POST actually returns under the PRG flow. Do **not** "fix" the success detector without observing the response, because the current user reports the save flow as working.

### H08. Scope discipline `[Variant 2]`
No new features were requested. The last user message before the archive request was satisfaction (`damn I think we did it`). Treat the FINAL code as a working baseline, not as a refactor target.

### H09. Uncertainty policy `[Variant 2]`
Items marked UNCERTAIN / Inferred above (U02, U03, U11, R11–R15, E30) were derived from reading the code, **not** observed in a live session. Do not promote them to confirmed defects without reproduction.

### Additional Handoff Notes from Variant 1 `[Variant 1]`
- **Do not modify the regex without testing all three sample inputs.** The OPTION regex and post-processor regex are tightly coupled to specific OCR quirks. Any change must be validated against: Inline options (Sample 1, Q20), Missing-dot newline options (Sample 2), Start-of-string article "A" (Sample 2), Absorbed/missing options (Sample 3).
- **The bookmarklet runs on a live PHP admin page.** The target page is `admin_questions.php`. It has CSRF protection, session-based auth, and specific form field names. The bookmarklet intercepts form submission via `fetch` and parses the HTML response.
- **The PHP file is provided as reference only.** The bookmarklet does not modify the PHP. It only interacts with the rendered DOM and form submission.
- **Uncertain items are labeled as such.** Do not assume behavior for unlisted edge cases without testing.

---
*End of Merged Migration Bundle. Gaps marked "not found" where applicable (none found in source material).*