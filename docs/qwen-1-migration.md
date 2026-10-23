### 1. CURRENT_CODE

**Primary Artifact:** Single-line JavaScript Bookmarklet
*This is the most stable and complete version from the conversation. It must be pasted into the URL field of a browser bookmark.*

```javascript
javascript:(function(){try{document.querySelectorAll('script[src*="ocr_helper.js"]').forEach(s=>s.remove());const op1=document.getElementById('ocr_input')?.closest('.admin-field');if(op1)op1.remove();const op2=document.getElementById('ans_panel');if(op2)op2.remove();const form=document.querySelector('input[name=action][value=save_question]')?.form;const f=document.querySelector('input[name=correct_option]');if(!form||!f||location.search.includes('edit=')){alert('Please open the "Add a New Question" page first.');return;}const FIXES=[[/govemment/gi,'government'],[/persidential/gi,'presidential'],[/resposible/gi,'responsible']];const FIELDS=['subject_id','exam_category_id','exam_year'];const OPTION=/(?:^\s*([A-F])\s*[.)]\s*|\n\s*([A-F])(?:\s*[.)]\s*|\s+(?=\d))\s*/g;const $=id=>document.getElementById(id);const L=localStorage;const store={get:k=>JSON.parse(L.getItem(k)||'null'),set:(k,v)=>L.setItem(k,JSON.stringify(v)),del:k=>L.removeItem(k)};const p=document.createElement('div');p.className='admin-field';p.innerHTML=`<div id="ocr_input"><label for="ocr_text">Paste OCR text (Bookmarklet Override)</label><textarea id="ocr_text"></textarea><button type="button" class="admin-btn" id="ocr_load">Load questions</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_clear_text" style="margin-left:8px">Clear text</button></div><div id="ocr_status" class="admin-note"></div><button type="button" class="admin-btn admin-btn-muted" id="ocr_skip">Skip this question</button> <button type="button" class="admin-btn admin-btn-muted" id="ocr_reset" style="margin-left:8px">Reset Queue</button><hr style="margin:20px 0;border:0;border-top:1px solid #d5dfe9"><div><label for="ans_text">Answer key (e.g. 1.B 2.C 3.A)</label><textarea id="ans_text"></textarea><button type="button" class="admin-btn" id="ans_save">Save key</button> <button type="button" class="admin-btn admin-btn-muted" id="ans_clear">Clear key</button></div><div id="ans_msg" class="admin-note"></div>`;form.before(p);const sb=form.querySelector('button[type=submit]');if(sb){const r=document.createElement('div');r.id='ans_res';r.className='admin-note';r.style.fontWeight='bold';r.style.color='#1769aa';r.style.marginTop='12px';sb.insertAdjacentElement('afterend',r);}const saveMeta=()=>store.set('ocrMeta',Object.fromEntries(FIELDS.map(id=>[id,$(id).value])));function parseHeader(text){const header=text.split('\n').slice(0,3).join(' ').toUpperCase();let year=null;const ym=header.match(/\b(20\d{2})\b/);if(ym)year=ym[1];return{year,header};}function applyHeaderInfo(text){const{year,header}=parseHeader(text);if(year)$('exam_year').value=year;const select=$('subject_id');const aliases=[{match:/\bC\s*\.?\s*R\s*\.?\s*K\b|\bCRK\b|\bCHRISTIAN RELIGIOUS\b/,keywords:['CRS','CHRISTIAN RELIGIOUS']}];let subjectSet=false;for(const alias of aliases){if(alias.match.test(header)){for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(alias.keywords.some(kw=>optText.includes(kw))){select.options[i].selected=true;subjectSet=true;break;}}}if(subjectSet)break;}if(!subjectSet){let subjectStr=header.replace(/\b(20\d{2})\b/g,'').replace(/\b(THE|AND|FOR|ANSWERS|QUESTIONS|STRUCTURED|IMPROVISED|PAPER|OBJECTIVE|SECTION|OF|IN|A)\b/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();if(subjectStr){let bestMatchIndex=-1;let bestMatchScore=-1;for(let i=0;i<select.options.length;i++){const optText=select.options[i].text.toUpperCase();if(!optText||optText.includes('-- SELECT'))continue;if(subjectStr.includes(optText)){if(optText.length>bestMatchScore){bestMatchScore=optText.length;bestMatchIndex=i;}}else if(optText.includes(subjectStr)){if(subjectStr.length>bestMatchScore){bestMatchScore=subjectStr.length;bestMatchIndex=i;}}else{const optWords=optText.split(' ');const subWords=subjectStr.split(' ');let overlap=0;for(const w of subWords){if(w.length>2&&optWords.includes(w))overlap++;}if(overlap>0&&overlap>bestMatchScore){bestMatchScore=overlap;bestMatchIndex=i;}}}if(bestMatchIndex!==-1){select.options[bestMatchIndex].selected=true;subjectSet=true;}}}}function splitQuestions(text){const marks=[];let last=0;for(const m of text.matchAll(/(?:^|\n)\s*(\d{1,3})\.\s+/g)){const n=+m[1];if(last&&(n<=last||n>last+5))continue;marks.push({n,start:m.index,end:m.index+m[0].length});last=n;}const chunks=marks.map((m,i)=>({num:m.n,text:text.slice(m.end,marks[i+1]?.start)}));const head=text.slice(0,marks[0]?.start??text.length).trim();if(head){const headOpts=head.match(OPTION);if(headOpts&&headOpts.length>=2){chunks.unshift({num:null,text:head});}}return chunks;}function parseQuestion({num,text}){const pos={},count={};for(const m of text.matchAll(OPTION)){const letter=m[1]||m[2];pos[letter]={start:m.index,end:m.index+m[0].length};count[letter]=(count[letter]||0)+1;}const marks=Object.entries(pos).sort((a,b)=>a[1].start-b[1].start);const q={num,question:text.slice(0,marks[0]?.[1].start??text.length).replace(/\s+/g,' ').trim(),a:'',b:'',c:'',d:'',e:'',f:'',flags:[]};marks.forEach(([letter,p],i)=>(q[letter.toLowerCase()]=text.slice(p.end,marks[i+1]?.[1].start).replace(/\s+/g,' ').trim()));if(num===null)q.flags.push('question number missing');if(q.question.length<10)q.flags.push('question text missing or very short');for(const l of 'abcdef'){if(!q[l]&&l<='d')q.flags.push(`option ${l.toUpperCase()} missing`);if(q[l]&&q[l].length>500)q.flags.push(`option ${l.toUpperCase()} over 500 characters`);}if(Object.values(count).some(c=>c>1))q.flags.push('a letter appears twice (merged questions?)');return q;}function fillForm(q){Object.entries(store.get('ocrMeta')||{}).forEach(([id,v])=>($(id).value=v));$('question_text').value=q.question;const keyAnswer=key[q.num];let finalA=q.a||'';let finalB=q.b||'';let finalC=q.c||'';let finalD=q.d||'';let correctIndex=-1;if(keyAnswer&&['A','B','C','D','E','F'].includes(keyAnswer)){if(keyAnswer==='E'||keyAnswer==='F'){finalD=(keyAnswer==='E'?q.e:q.f)||'';correctIndex=3;}else{correctIndex='ABCD'.indexOf(keyAnswer);}}else{if(q.e)finalD+=(finalD?'\n\n':'')+'E. '+q.e;if(q.f)finalD+=(finalD?'\n\n':'')+'F. '+q.f;}$('option_a').value=finalA;$('option_b').value=finalB;$('option_c').value=finalC;$('option_d').value=finalD;form.querySelectorAll('[name=correct_option]').forEach(r=>(r.checked=false));if(correctIndex>=0){const radio=form.querySelector(`input[name="correct_option"][value="${correctIndex}"]`);if(radio)radio.checked=true;}}let queue=store.get('ocrQueue')||{items:[],i:0};const saveQ=()=>store.set('ocrQueue',queue);function renderOCR(){const q=queue.items[queue.i];const active=queue.items.length>0;$('ocr_input').hidden=q!==undefined;$('ocr_skip').hidden=!q;$('ocr_reset').hidden=!active;$('ocr_status').innerHTML=!active?'':!q?`All ${queue.items.length} questions done.`:`Question ${queue.i+1} of ${queue.items.length} (book number ${q.num??'?'})`+(q.flags.length?`<div class="admin-alert admin-error">Check this one: ${q.flags.join(', ')}</div>`:'');}function showOCR(){if(queue.items[queue.i])fillForm(queue.items[queue.i]);renderOCR();}$('ocr_load').onclick=()=>{const text=FIXES.reduce((t,[re,fix])=>t.replace(re,fix),$('ocr_text').value);const items=splitQuestions(text).map(parseQuestion);if(!items.length)return alert('No questions found in that text.');applyHeaderInfo(text);saveMeta();queue={items,i:0};saveQ();showOCR();};$('ocr_clear_text').onclick=()=>{$('ocr_text').value='';};$('ocr_skip').onclick=()=>{queue.i++;saveQ();showOCR();};$('ocr_reset').onclick=()=>{queue={items:[],i:0};saveQ();$('ocr_input').hidden=false;renderOCR();};let key={};try{key=store.get('ansKey')||{};}catch(e){}function cur(){try{const q=store.get('ocrQueue');return q&&q.items&&q.items[q.i]?{i:q.i,n:q.items[q.i].num}:{i:-1,n:null};}catch(e){return{i:-1,n:null};}}function parseKey(t){const k={},r=/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g;let m;while((m=r.exec(t)))k[+m[1]]=m[2].toUpperCase();return k;}function tick(ask){const m=$('ans_msg');if(!Object.keys(key).length){m.textContent='No key saved yet.';return;}const c=cur();let n=c.n;if(n==null&&ask&&c.i<0){n=parseInt(prompt('Book question number?'),10);}if(!n){m.textContent='No question number. Pick the answer yourself.';return;}const a=key[n];if(!a){m.textContent='No answer for number '+n+' in the key. Pick it yourself.';return;}const radio=document.querySelector(`input[name="correct_option"][value="${'ABCDEF'.indexOf(a)}"]`);if(radio)radio.checked=true;m.textContent='Question '+n+': ticked Option '+a+' from the answer key. Check it before saving.';}$('ans_save').onclick=()=>{key=parseKey($('ans_text').value);store.set('ansKey',key);if(queue.items[queue.i])fillForm(queue.items[queue.i]);tick(true);$('ans_msg').textContent+=' ('+Object.keys(key).length+' answers in key.)';};$('ans_clear').onclick=()=>{key={};store.del('ansKey');$('ans_msg').textContent='Key cleared.';};let last=cur().i;form.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();if(!queue.items.length)saveMeta();const b=form.querySelector('button[type=submit]'),r=$('ans_res');let s;b.disabled=true;r.textContent='Saving...';fetch(location.href,{method:'POST',body:new FormData(form),credentials:'same-origin'}).then(x=>{s=x.status;return x.text()}).then(t=>{const m=t.match(/Question saved successfully \(Question ID: (\d+)\)/);if(m){r.textContent='Saved as question #'+m[1]+'.';const q=cur();if(q.i>-1){const meta={};FIELDS.forEach(n=>meta[n]=form.elements[n].value);store.set('ocrMeta',meta);}['question_image','answer_video'].forEach(n=>{const el=form.elements[n];if(el)el.value='';});const ae=form.elements.answer_explanation;if(ae)ae.value='';if(q.i>-1){$('ocr_skip').click();}last=cur().i;if(last>-1){tick();}else{form.reset();}}else{const d=new DOMParser().parseFromString(t,'text/html'),er=d.querySelector('.admin-error');r.textContent='NOT saved: '+(t.indexOf('Administrator Login')>-1?'you were logged out. Reload the page and log in.':er?er.textContent.trim():'unexpected reply from the server (code '+s+').');}}).catch(()=>{r.textContent='NOT saved: network problem. Try again.';}).then(()=>{b.disabled=false;});},true);setInterval(()=>{const c=cur().i;if(c!==last){last=c;tick();}},600);const failed=document.querySelector('.admin-error');if(store.get('ocrSubmitted')){store.del('ocrSubmitted');if(!failed){queue.i++;saveQ();}}failed?renderOCR():showOCR();tick();}catch(e){alert('Bookmarklet Error: '+e.message);}})();
```

---

### 2. PARSER_BEHAVIOR_SPEC

*   **Section Splitting:** Uses regex `/(?:^|\n)\s*(\d{1,3})\.\s+/g`. Identifies question boundaries by finding 1-3 digits followed by a literal dot and whitespace at the start of a line or string.
*   **Question Detection:** Text between matches becomes the question body. The text preceding the first match (the header) is only treated as an unnumbered question if it contains at least 2 valid option markers.
*   **Option Parsing:** Uses regex `/(?:^\s*([A-F])\s*[.)]\s*|\n\s*([A-F])(?:\s*[.)]\s*|\s+(?=\d))\s*/g`. 
    *   Captures letters A through F.
    *   If at the start of the chunk (`^`), strictly requires a dot or parenthesis.
    *   If on a new line (`\n`), allows a dot/parenthesis OR a space followed by a digit.
*   **Answer-Key Parsing:** Uses regex `/(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g`. Extracts question numbers and letters A-F.
*   **Header Inference:** 
    *   *Year:* Extracts 4-digit years starting with `20` via `\b(20\d{2})\b`.
    *   *Subject:* Checks an alias map (e.g., `CRK` -> `CRS`). If no alias matches, strips filler words and uses a word-overlap scoring system against the dropdown options to find the best match.
*   **Warning/Flag Behavior:** Flags missing question numbers, question text < 10 chars, missing options A-D, options > 500 chars, and duplicate option letters.

---

### 3. EDGE_CASES

| Short Name | Trigger Condition | Expected Behavior | Current Status |
| :--- | :--- | :--- | :--- |
| **Lowercase Start** | Question starts with punctuation/lowercase (e.g., `34. ...... was born`) | Splits correctly without merging into the previous question. | Handled |
| **Header False Positive** | Header contains option-like letters (e.g., `C. R. K.` or `A 5 year old`) | Ignores header as a question; does not parse as Option A/C. | Handled |
| **Missing Dot OCR** | Option lacks a dot (e.g., `A 75 years` instead of `A. 75 years`) | Parses correctly as Option A. | Handled |
| **5/6 Options (With Key)** | Question has E/F options and answer key is loaded | Promotes correct E/F to Option D, silently drops original D. | Handled |
| **5/6 Options (No Key)** | Question has E/F options, no answer key | Appends E/F to Option D, preserving the letters (e.g., `\n\nE. text`). | Handled |
| **Late Key Load** | Answer key is saved *after* questions are loaded | Immediately re-evaluates and cleans up the current question's options. | Handled |
| **Page Scroll** | Form is saved via AJAX | Page does not scroll to the top; stays in place. | Handled |
| **Duplicate UI ID** | Bookmarklet is clicked multiple times | Removes old DOM elements before injecting new ones to prevent duplicate IDs. | Handled |

---

### 4. INVARIANTS

1.  The PHP backend form strictly only accepts 4 options (`option_a`, `option_b`, `option_c`, `option_d`).
2.  The PHP backend validates that all 4 options are filled and each is ≤ 500 characters.
3.  The bookmarklet must only activate on the "Add a New Question" page (checks for `input[name=action][value=save_question]` and absence of `edit=` in URL).
4.  The bookmarklet must actively remove the server-side `<script src="ocr_helper.js">` tag and its injected DOM elements to prevent duplicate UI or conflicting logic.
5.  The success/error message container (`ans_res`) must be injected dynamically directly after the form's submit button, never hardcoded into the bookmarklet's main panel HTML.

---

### 5. KNOWN_REGRESSION_RISKS

1.  **Option Regex Dual-Condition:** Changing the `^\s*` vs `\n\s*` logic in the `OPTION` regex will immediately break either "A 75 years" parsing or cause false positives on "A 5 year old".
2.  **Subject Overlap Scoring:** If the database dropdown contains subjects with overlapping words (e.g., "Biology" and "Marine Biology"), the word-overlap heuristic might select the wrong one.
3.  **AJAX Success String:** The form interception relies on the exact PHP success string: `Question saved successfully \(Question ID: (\d+)\)`. If the PHP changes, auto-advance breaks.
4.  **500 Character Limit:** When appending options E and F to Option D, the combined string might exceed 500 characters, causing the PHP backend to reject the save with a validation error. The JS flags this but does not truncate.

---

### 6. SAMPLE_INPUTS

**Sample 1: Quotes before capitals**
```text
36. "...Truly, I say to you, not even in Israel have I found such faith..."
The statement above by Jesus was made when He healed the
A. leper
B. blind man
C. demoniac
D. centurion's servant.
```

**Sample 2: Header with C.R.K.**
```text
IMPROVISED C. R. K. QUESTIONS FOR 2021 (P.M. Onoriode, Unilag)

1. What is the meaning of the name Samuel?
A. because i have asked him of the Lord
...
```

**Sample 3: 5 Options**
```text
33. Abraham and his nephew Lot decided to separate into two different camps
A. for fear of complete annihilation by the enemies
B. to enable them to capture more votes from the two camps
C. to keep Chedor-laomer from capturing Sodom and Gomorrah
D. to avoid further trouble between their rival herdsmen over pasture and water
E. because Lot demanded his independence as he was now of age
```

**Sample 4: Missing dot on Option A**
```text
35. How old was Abram when God appeared to him the second time ?
A 75 years
B. 105 years
C. 85 years
D. 99 years
```

**Sample 5: Question starting with "A"**
```text
30. A good example of nature miracles as performed by Jesus was that of
A. Healing of the leper
B. Casting out demons
C. Raising the dead
D. Calming the storm
```

---

### 7. EXPECTED_BEHAVIOR_NOTES

*   **Sample 1:** Must parse Q36 cleanly. The quotes before "Truly" must not prevent the question split.
*   **Sample 2:** Must extract year `2021`. Must map `C. R. K.` to `CRS` in the subject dropdown. Must NOT parse the header as a question.
*   **Sample 3:** Must parse all 5 options. If answer key says `E`, Option D field must contain "because Lot demanded...", and original D must be dropped.
*   **Sample 4:** Must parse `A 75 years` as Option A. Must not merge it into the question text.
*   **Sample 5:** Must NOT parse "A good" as Option A. Must correctly parse A, B, C, D from the new lines.

---

### 8. UNRESOLVED_ISSUES

1.  **Character Limit Overflow:** If a 5-option question has very long text for D, E, and F, appending E and F to D will exceed the 500-character PHP limit, resulting in a save failure.
2.  **Image/Video Parsing:** The script cannot read or parse diagrams/images. These must be uploaded manually by the user.
3.  **Ambiguous Subjects:** Subjects not in the explicit alias map rely on word-overlap scoring, which is uncertain for highly abbreviated or similarly named subjects.

---

### 9. DECISION_LOG

*   **Dual-Condition Option Regex:** Implemented to safely catch OCR errors like `A 75 years` (space + digit) without triggering false positives on normal text like `A 5 year old` at the start of a question chunk.
*   **Promote E/F to D:** Chosen over dropping E/F entirely to ensure the correct answer is preserved when the backend strictly only accepts A-D.
*   **Dynamic `ans_res` Injection:** Chosen to avoid duplicate DOM IDs and ensure the success message sits exactly under the submit button, not inside the bookmarklet panel.
*   **Removed "Tick answer" button:** The "Save key" button already performs the tick action. Removing it reduced UI clutter.
*   **Renamed "Clear list" to "Reset Queue":** More accurately describes the action of wiping the queue and revealing the textarea. A separate "Clear text" button was added specifically for wiping the textarea content.
*   **No Auto-Scroll:** Explicitly requested by the user to prevent the page from jumping to the top after every AJAX save.

---

### 10. OPENCODE_HANDOFF_NOTES

1.  **Bookmarklet Execution:** The code must be minified to a single line and prefixed with `javascript:`. Testing must be done via an actual browser bookmark, not the address bar (browsers silently strip `javascript:` from the address bar).
2.  **Override Mechanism:** The script actively hunts for and removes `<script src="ocr_helper.js">` and its injected DOM nodes. Do not remove this logic, or the server-side script will conflict.
3.  **Form Structure:** The PHP form (`admin_questions.php`) strictly expects `option_a` through `option_d`. Do not attempt to add E/F fields to the PHP form without updating the database schema.
4.  **AJAX Interception:** The script intercepts the form submit event. If the PHP success message format changes, the regex `/Question saved successfully \(Question ID: (\d+)\)/` must be updated.
5.  **State Management:** The script relies heavily on `localStorage` (`ocrQueue`, `ocrMeta`, `ansKey`, `ocrSubmitted`). Clearing browser storage will reset the tool's state.