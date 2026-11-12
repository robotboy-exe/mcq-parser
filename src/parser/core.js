// Pure canonical OCR parsing engine for both browser and Node.js.
// Version: 2.3.3
// Contract: Pure parsing and diagnostics only; zero DOM, storage, or network dependencies.

const PARSER_VERSION = "2.3.3";
// Pure parsing and auto-save helpers. Browser DOM code lives in ui.js.
const FIXES = [
  [/govemment/gi, 'government'],
  [/persidential/gi, 'presidential'],
  [/resposible/gi, 'responsible']
];
const OPTION = /(?:^|\n|\s)([A-F])[^\S\n]*[.)][^\S\n]*|\n\s*([A-F])\s+(?=\d)/g;
const SECTION_DIVIDER = /^[^\S\r\n]*={3,}[^\S\r\n]*(?=\r?\n|$)/gm;
const KEY_LINE = /^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*\(?([A-F])\)?\s*(?:[.)]\s*)?(?:$|[-–—/|:,;=]\s|\(|\[)/i;
const PLACEHOLDER = /^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*[\[(]?\s*(?:missing|not\s+given|not\s+available|n\s*[/\\]\s*a|unavailable|no\s+answer)/i;
const STEM_LINE = /^\s*\d{1,3}[.)]\s+\S.{11,}/;
const KEY_WORD = /\b(ANSWERS?|KEY|SCHEME|SOLUTIONS?)\b/i;
const INLINE_PAIR = /(\d{1,3})\s*[.\-:)]\s*\(?([A-F])\)?(?![A-Za-z])/gi;
const LOOSE = { E: /\n[^\S\n]*E[^\S\n]+(?=\S)/, F: /\n[^\S\n]*F[^\S\n]+(?=\S)/ };
const STIMULUS_MARKER_LINE = /^[^\S\n]*\[\[?\s*image(?:\s*:\s*([^\]]*?))?\s*\]\]?[^\S\n]*$/i;
const STIMULUS_MARKER_INLINE = /\[\[\s*image(?:\s*:\s*([^\]]*?))?\s*\]\]/gi;
const STIMULUS_INTRO = /\b(?:use|study|consider|refer\s+to|the\s+following|below|above)\b[^\n]{0,100}\b(?:information|data|table|schedule|list|diagram|figure|chart|passage|graph|extract)\b[^\n]{0,100}\bquestions?\b/i;
const STIMULUS_INTRO_RANGE = /\bquestions?\s+\d{1,3}\s*(?:and|to|[-–—])\s*\d{1,3}\b/i;

function parseHeader(text) {
  const header = text.split('\n').slice(0, 3).join(' ').toUpperCase();
  let year = null;
  const ym = header.match(/\b((?:19|20)\d{2})\b/);
  if (ym) year = ym[1];
  return { year, header };
}

function pickSubjectIndex(header, optionTexts) {
  const aliases = [{
    match: /\bC\s*\.?\s*R\s*\.?\s*[SK]\b|\bCHRISTIAN RELIGIOUS(?:\s+STUDIES)?\b/,
    keywords: ['CRS', 'CHRISTIAN RELIGIOUS STUDIES', 'CHRISTIAN RELIGIOUS']
  }];
  let subjectSet = false;
  let selected = -1;
  for (const alias of aliases) {
    if (alias.match.test(header)) {
      for (let i = 0; i < optionTexts.length; i++) {
        const optText = (optionTexts[i] || '').toUpperCase();
        if (alias.keywords.some(kw => optText.includes(kw))) {
          selected = i;
          subjectSet = true;
          break;
        }
      }
    }
    if (subjectSet) break;
  }
  if (!subjectSet) {
    const subjectStr = header
      .replace(/\b((?:19|20)\d{2})\b/g, '')
      .replace(/\b(THE|AND|FOR|ANSWERS|QUESTIONS|STRUCTURED|IMPROVISED|PAPER|OBJECTIVE|SECTION|OF|IN|A)\b/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (subjectStr) {
      let bestMatchIndex = -1;
      let bestMatchScore = -1;
      for (let i = 0; i < optionTexts.length; i++) {
        const optText = (optionTexts[i] || '').toUpperCase();
        if (!optText || optText.includes('-- SELECT')) continue;
        if (subjectStr.includes(optText)) {
          if (optText.length > bestMatchScore) {
            bestMatchScore = optText.length;
            bestMatchIndex = i;
          }
        } else if (optText.includes(subjectStr)) {
          if (subjectStr.length > bestMatchScore) {
            bestMatchScore = subjectStr.length;
            bestMatchIndex = i;
          }
        } else {
          const optWords = optText.split(' ');
          const subWords = subjectStr.split(' ');
          let overlap = 0;
          for (const w of subWords) {
            if (w.length > 2 && optWords.includes(w)) overlap++;
          }
          if (overlap > 0 && overlap > bestMatchScore) {
            bestMatchScore = overlap;
            bestMatchIndex = i;
          }
        }
      }
      if (bestMatchIndex !== -1) {
        selected = bestMatchIndex;
        subjectSet = true;
      }
    }
  }
  return selected;
}

function compactExamAcronyms(text) {
  return text
    .replace(/(?:[A-Z]\.){2,}[A-Z]?(?![A-Za-z])/g, run => run.replace(/[^A-Z]/g, ''))
    .replace(/\bPOSTUTME\b/g, 'POST UTME');
}

function pickCategoryIndex(header, optionTexts) {
  const normalized = compactExamAcronyms(header);
  const rules = [
    { match: /\bPOST[\s-]*UTME\b/, keywords: ['POST UTME'] },
    { match: /\bJAMB\b|\bUTME\b/, keywords: ['JAMB', 'UTME'] },
    { match: /\bWASSCE\b|\bWASCE\b|\bWAEC\b|\bSSCE\b|\bNECO\b|\bGCE\b/, keywords: ['WASCE', 'WASSCE', 'WAEC', 'SSCE', 'NECO', 'GCE'] },
    { match: /\bGENERAL[\s-]+PRACTICE\b/, keywords: ['GENERAL PRACTICE'] }
  ];
  for (const rule of rules) {
    if (!rule.match.test(normalized)) continue;
    for (let i = 0; i < optionTexts.length; i++) {
      const optText = (optionTexts[i] || '').toUpperCase();
      if (!optText || optText.includes('-- SELECT')) continue;
      if (rule.keywords.some(kw => optText.includes(kw))) return i;
    }
    return -1;
  }
  return -1;
}

function splitQuestions(text) {
  const marks = [];
  let last = 0;
  for (const m of text.matchAll(/(?:^|\n)\s*(\d{1,3})\.\s+/g)) {
    const n = +m[1];
    if (last && (n <= last || n > last + 5)) continue;
    marks.push({ n, start: m.index, end: m.index + m[0].length });
    last = n;
  }
  const chunks = marks.map((m, i) => ({ num: m.n, text: text.slice(m.end, marks[i + 1]?.start) }));
  const head = text.slice(0, marks[0]?.start ?? text.length).trim();
  if (head) {
    const headOpts = head.match(OPTION);
    if (headOpts && headOpts.length >= 2) {
      chunks.unshift({ num: null, text: head });
    }
  }
  return chunks;
}

function splitBulletQuestions(text) {
  const marks = [...text.matchAll(/(?:^|\n)[^\S\n]*\*[^\S\n]+/g)];
  if (marks.length < 2) return null;
  return marks.map((m, i) => ({
    num: null,
    text: text.slice(m.index + m[0].length, marks[i + 1]?.index)
  }));
}

function splitQuestionItems(text) {
  if (/(?:^|\n)[^\S\n]*\d{1,3}\.\s+/.test(text)) return splitQuestions(text);
  const bullets = splitBulletQuestions(text);
  return bullets || splitQuestions(text);
}

function isOptionAbbreviation(raw, match) {
  if (/\s$/.test(match[0])) return false;
  return /^[A-Z](?:\.|\s|$)/.test(raw.slice(match.index + match[0].length));
}

const OPTION_LETTERS = 'ABCDEF';
const REQUIRED_OPTION_LETTERS = 'ABCD';
const QUESTION_BOUNDARY = /(?:^|\s)\d{1,3}\.\s/;

function optionLabelMatches(raw, scanRaw) {
  const matches = [];
  for (const m of scanRaw.matchAll(OPTION)) {
    const letter = m[1] || m[2];
    if (!letter) continue;
    if (isOptionAbbreviation(raw, m)) continue;
    matches.push({ letter, start: m.index, end: m.index + m[0].length });
  }
  return matches;
}

function optionCandidateFrom(matches, startIndex) {
  const picked = [matches[startIndex]];
  const used = new Set([startIndex]);
  const startLetter = matches[startIndex].letter;
  let cursor = startIndex;
  for (const letter of OPTION_LETTERS.slice(OPTION_LETTERS.indexOf(startLetter) + 1)) {
    let next = -1;
    for (let i = cursor + 1; i < matches.length; i++) {
      if (matches[i].letter === letter && !used.has(i)) {
        next = i;
        break;
      }
    }
    if (next === -1) {
      for (let i = startIndex + 1; i < cursor; i++) {
        if (matches[i].letter === letter && !used.has(i)) {
          next = i;
          break;
        }
      }
    }
    if (next === -1) continue;
    picked.push(matches[next]);
    used.add(next);
    cursor = next;
  }
  return picked;
}

function bestOptionCandidate(matches) {
  const picked = [];
  for (const letter of REQUIRED_OPTION_LETTERS) {
    const match = matches.find(p => p.letter === letter);
    if (match) picked.push(match);
  }
  if (!picked.length) return null;
  const d = picked.find(p => p.letter === 'D');
  if (d) {
    const e = matches.find(p => p.letter === 'E' && p.start > d.end);
    const f = e
      ? matches.find(p => p.letter === 'F' && p.start > e.end)
      : matches.find(p => p.letter === 'F' && p.start > d.end);
    if (e) picked.push(e);
    if (f) picked.push(f);
  }
  return { picked };
}

function hasUnnumberedDuplicateSet(raw, matches) {
  const complete = [];
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].letter !== 'A') continue;
    const picked = optionCandidateFrom(matches, i);
    const letters = new Set(picked.map(p => p.letter));
    if ([...REQUIRED_OPTION_LETTERS].every(letter => letters.has(letter))) complete.push(picked);
  }
  complete.sort((a, b) => a[0].start - b[0].start);
  for (let i = 0; i < complete.length; i++) {
    const firstD = complete[i].find(p => p.letter === 'D');
    if (!firstD) continue;
    for (let j = i + 1; j < complete.length; j++) {
      const secondA = complete[j].find(p => p.letter === 'A');
      if (!secondA || secondA.start <= firstD.end) continue;
      return !QUESTION_BOUNDARY.test(raw.slice(firstD.end, secondA.start));
    }
  }
  return false;
}

function stimulusNumberTokens(line) {
  return (line.match(/[₦$£€]?\d[\d,]*(?:\.\d+)?/g) || []).length;
}

function stimulusQuestionLine(line) {
  return /^[^\S\n]*\d{1,3}\.\s+/.test(line);
}

function stimulusOptionLine(line) {
  return /^[^\S\n]*[A-F][^\S\n]*[.)][^\S\n]*/.test(line) || /^[^\S\n]*[A-F][^\S\n]+(?=\d)/.test(line);
}

function stimulusDividerLine(line) {
  return /^[^\S\n]*={3,}[^\S\n]*$/.test(line);
}

function stimulusKeyHeading(line) {
  return /^\s*(?:answer\s*key|answers?|key|scheme|solutions?)\s*:?\s*$/i.test(line);
}

function stimulusStructuralLine(line) {
  return stimulusQuestionLine(line)
    || stimulusOptionLine(line)
    || stimulusDividerLine(line)
    || stimulusKeyHeading(line)
    || KEY_LINE.test(line)
    || PLACEHOLDER.test(line);
}

function stimulusIntroLine(line) {
  if (stimulusStructuralLine(line)) return false;
  const t = line.trim();
  if (!t || t.length > 220) return false;
  return STIMULUS_INTRO.test(t)
    || (STIMULUS_INTRO_RANGE.test(t) && /\b(?:below|above|following)\b/i.test(t));
}

function stimulusStrongTableLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^\|.*\|$/.test(t)) return true;
  if (/^[-+|: ]{3,}$/.test(t)) return true;
  if (/^[A-Za-z][A-Za-z0-9 /&().'\-]{0,60}\s*[:=]\s*[₦$£€]?\s*[\d(]/i.test(t)) return true;
  if (/^(?:total|subtotal|balance|net|gross)\b/i.test(t) && stimulusNumberTokens(t) > 0) return true;
  return false;
}

function stimulusWeakTableLine(line) {
  const t = line.trim();
  if (!t) return false;
  const n = stimulusNumberTokens(t);
  return n >= 3 || (n >= 2 && /[:=]/.test(t));
}

function stimulusTableLine(line) {
  return stimulusStrongTableLine(line) || stimulusWeakTableLine(line);
}

function stimulusBlockLine(line) {
  return !stimulusStructuralLine(line) && (stimulusIntroLine(line) || stimulusTableLine(line));
}

function stimulusMarkerLine(line) {
  return STIMULUS_MARKER_LINE.test(line);
}

function stimulusTransparentLine(lines, index) {
  const line = lines[index];
  return !line.trim() || stimulusMarkerLine(line) || stimulusBlockLine(line);
}

function stimulusRun(lines, index) {
  let start = index;
  let end = index;
  while (start > 0 && stimulusTransparentLine(lines, start - 1)) start--;
  while (end + 1 < lines.length && stimulusTransparentLine(lines, end + 1)) end++;
  return { start, end };
}

function trimStimulusRun(lines, run) {
  let start = run.start;
  let end = run.end;
  while (start <= end && !lines[start].trim()) start++;
  while (end >= start && !lines[end].trim()) end--;
  return { start, end };
}

function stimulusEvidence(lines, start, end) {
  let intro = 0;
  let strong = 0;
  let weak = 0;
  let table = 0;
  for (let i = start; i <= end; i++) {
    const line = lines[i];
    if (!line.trim() || stimulusMarkerLine(line) || stimulusStructuralLine(line)) continue;
    if (stimulusIntroLine(line)) intro++;
    if (stimulusStrongTableLine(line)) {
      strong++;
      table++;
    } else if (stimulusWeakTableLine(line)) {
      weak++;
      table++;
    }
  }
  return { intro, strong, weak, table };
}

function validStimulusBlock(lines, start, end) {
  const e = stimulusEvidence(lines, start, end);
  return (e.intro > 0 && e.table > 0) || e.strong > 0 || e.weak >= 2;
}

function nearestStimulusBlock(lines, markerLine) {
  let i = markerLine + 1;
  while (i < lines.length && !stimulusStructuralLine(lines[i])) {
    if (stimulusBlockLine(lines[i])) {
      const run = stimulusRun(lines, i);
      if (validStimulusBlock(lines, run.start, run.end)) return trimStimulusRun(lines, run);
      i = run.end + 1;
    } else {
      i++;
    }
  }
  i = markerLine - 1;
  while (i >= 0 && !stimulusStructuralLine(lines[i])) {
    if (stimulusBlockLine(lines[i])) {
      const run = stimulusRun(lines, i);
      if (validStimulusBlock(lines, run.start, run.end)) return trimStimulusRun(lines, run);
      i = run.start - 1;
    } else {
      i--;
    }
  }
  return null;
}

function parseStimulusRange(text) {
  const s = String(text == null ? '' : text);
  const nums = new Set();
  const rangeRe = /(\d{1,3})\s*(?:[-–—]|to|and|&)\s*(\d{1,3})/gi;
  let m;
  while ((m = rangeRe.exec(s))) {
    let a = +m[1];
    let b = +m[2];
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    if (b - a > 50) {
      nums.add(a);
      nums.add(b);
      continue;
    }
    for (let n = a; n <= b; n++) nums.add(n);
  }
  for (const d of s.match(/\d{1,3}/g) || []) {
    const n = +d;
    if (n > 0) nums.add(n);
  }
  return [...nums].filter(n => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
}

function extractStimulusMarkers(raw, num) {
  const lines = raw.split('\n');
  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const standalone = line.match(STIMULUS_MARKER_LINE);
    if (standalone) {
      markers.push({ at: i, line: i, inline: false, range: standalone[1] || '', marker: line.trim() });
      continue;
    }
    STIMULUS_MARKER_INLINE.lastIndex = 0;
    let m;
    while ((m = STIMULUS_MARKER_INLINE.exec(line))) {
      markers.push({
        at: i + m.index / Math.max(1, line.length),
        line: i,
        inline: true,
        index: m.index,
        length: m[0].length,
        range: m[1] || '',
        marker: m[0]
      });
    }
  }
  if (!markers.length) return { text: raw, stimuli: [] };
  for (const mk of markers) {
    if (mk.inline) continue;
    const run = stimulusRun(lines, mk.line);
    mk.block = validStimulusBlock(lines, run.start, run.end)
      ? trimStimulusRun(lines, run)
      : nearestStimulusBlock(lines, mk.line);
  }
  const removed = new Set();
  for (const mk of markers) {
    if (mk.block) {
      for (let i = mk.block.start; i <= mk.block.end; i++) removed.add(i);
    }
    if (!mk.inline) removed.add(mk.line);
  }
  const stimuli = markers.map(mk => {
    let text = '';
    if (mk.block) {
      text = lines.slice(mk.block.start, mk.block.end + 1)
        .filter(line => !stimulusMarkerLine(line))
        .join('\n')
        .trim();
    }
    return {
      at: mk.at,
      sourceNum: num,
      nums: parseStimulusRange(mk.range),
      marker: mk.marker,
      text,
      source: 'marker'
    };
  });
  const cleaned = [];
  for (let i = 0; i < lines.length; i++) {
    if (removed.has(i)) continue;
    let line = lines[i];
    for (const mk of markers) {
      if (mk.inline && mk.line === i) {
        line = line.slice(0, mk.index) + ' ' + line.slice(mk.index + mk.length);
      }
    }
    cleaned.push(line);
  }
  return { text: cleaned.join('\n'), stimuli };
}

function extractStimulusIntros(raw, num) {
  const lines = raw.split('\n');
  const removed = new Set();
  const stimuli = [];
  for (let i = 0; i < lines.length; i++) {
    if (removed.has(i) || !stimulusIntroLine(lines[i])) continue;
    const run = stimulusRun(lines, i);
    const evidence = stimulusEvidence(lines, run.start, run.end);
    if (!validStimulusBlock(lines, run.start, run.end) || !evidence.table) continue;
    const content = trimStimulusRun(lines, run);
    for (let j = content.start; j <= content.end; j++) removed.add(j);
    stimuli.push({
      at: i,
      sourceNum: num,
      nums: parseStimulusRange(lines[i]),
      marker: lines[i].trim(),
      text: lines.slice(content.start, content.end + 1).join('\n').trim(),
      source: 'intro'
    });
  }
  if (!removed.size) return { text: raw, stimuli: [] };
  return {
    text: lines.filter((line, i) => !removed.has(i)).join('\n'),
    stimuli
  };
}

function extractStimuli(raw, num) {
  const marked = extractStimulusMarkers(raw, num);
  const intro = extractStimulusIntros(marked.text, num);
  const ordered = marked.stimuli.concat(intro.stimuli).sort((a, b) => a.at - b.at);
  return {
    text: intro.text,
    stimuli: ordered.map(stim => ({
      sourceNum: stim.sourceNum,
      nums: stim.nums,
      marker: stim.marker,
      text: stim.text,
      source: stim.source
    }))
  };
}

function applyStimulusFlags(items) {
  const list = Array.isArray(items) ? items : [];
  const byNum = new Map();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(item, 'needsImage')) delete item.needsImage;
    if (Number.isInteger(item.num)) byNum.set(item.num, item);
  }
  let order = 0;
  for (const item of list) {
    if (!item || !Array.isArray(item.stimuli)) continue;
    for (const stim of item.stimuli) {
      if (!stim || typeof stim !== 'object') continue;
      order++;
      stim.id = 'stim-' + order;
      stim.order = order;
      if (!Number.isInteger(stim.sourceNum)) stim.sourceNum = item.num;
      const nums = [];
      for (const n of Array.isArray(stim.nums) ? stim.nums : []) {
        if (!Number.isInteger(n) || n <= 0 || nums.includes(n)) continue;
        nums.push(n);
      }
      nums.sort((a, b) => a - b);
      stim.nums = nums;
      stim.missing = [];
      for (const n of nums) {
        const target = byNum.get(n);
        if (target) target.needsImage = true;
        else stim.missing.push(n);
      }
    }
  }
  return list;
}

function parseQuestion({ num, text }) {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  const extracted = extractStimuli(normalized, num);
  const raw = extracted.text.replace(/\n{3,}/g, '\n\n');
  // Options stay one line; stems keep blank-line paragraphs and fold single wraps.
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const cleanBlock = s => s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/[^\S\n]+/g, ' ').trim())
    .reduce((paragraphs, line) => {
      if (!line) {
        if (paragraphs.open.length) {
          paragraphs.done.push(paragraphs.open.join(' '));
          paragraphs.open = [];
        }
        return paragraphs;
      }
      paragraphs.open.push(line);
      return paragraphs;
    }, { done: [], open: [] });
  const scanRaw = raw.replace(/(^|\n|\s)([A-F])\/[^\S\n]+/g, (m, lead, letter) => lead + letter + '.' + m.slice(lead.length + 2));
  const matches = optionLabelMatches(raw, scanRaw);
  const best = bestOptionCandidate(matches);
  const pos = {};
  if (best) {
    for (const p of best.picked) pos[p.letter] = { start: p.start, end: p.end };
  }
  for (const X of 'EF') {
    const P = X === 'E' ? 'D' : 'E';
    if (pos[X] || !pos[P]) continue;
    const lm = LOOSE[X].exec(raw.slice(pos[P].end));
    if (lm) {
      const s = pos[P].end + lm.index;
      pos[X] = { start: s, end: s + lm[0].length };
    }
  }
  const requiredLater = { A: ['B', 'C', 'D'], B: ['C', 'D'], C: ['D'] };
  for (const X of 'ABC') {
    if (pos[X] || !requiredLater[X].every(letter => pos[letter])) continue;
    const prevLetter = 'ABC'.slice(0, 'ABC'.indexOf(X)).split('').reverse().find(letter => pos[letter]);
    const nextLetter = 'ABCD'.slice('ABCD'.indexOf(X) + 1).split('').find(letter => pos[letter]);
    const prev = prevLetter ? pos[prevLetter] : null;
    const next = pos[nextLetter];
    const lm = new RegExp('\\n[^\\S\\n]*' + X + '[^\\S\\n]+(?=[a-z])', 'g');
    let match;
    while ((match = lm.exec(raw))) {
      if (match.index >= next.start) break;
      if (prev && match.index <= prev.end) continue;
      if (!raw.slice(0, match.index).trim()) continue;
      pos[X] = { start: match.index, end: match.index + match[0].length };
      break;
    }
  }
  const marks = Object.entries(pos).sort((a, b) => a[1].start - b[1].start);
  const stem = cleanBlock(raw.slice(0, marks[0]?.[1].start ?? raw.length));
  const q = {
    num,
    question: stem.done.concat(stem.open.length ? [stem.open.join(' ')] : []).join('\n\n'),
    a: '', b: '', c: '', d: '', e: '', f: '',
    flags: []
  };
  marks.forEach(([letter, p], i) => (q[letter.toLowerCase()] = clean(raw.slice(p.end, marks[i + 1]?.[1].start))));
  if (num === null) q.flags.push('question number missing');
  if (q.question.length < 10) q.flags.push('question text missing or very short');
  for (const l of 'abcdef') {
    if (!q[l] && l <= 'd') q.flags.push(`option ${l.toUpperCase()} missing`);
    if (q[l] && q[l].length > 500) q.flags.push(`option ${l.toUpperCase()} over 500 characters`);
  }
  if (hasUnnumberedDuplicateSet(raw, matches)) q.flags.push('a letter appears twice (merged questions?)');
  if (q.e || q.f) q.flags.push('E/F options present');
  if (extracted.stimuli.length) q.stimuli = extracted.stimuli;
  return q;
}

function flagNumberingGaps(items) {
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1].num;
    const cur = items[i].num;
    if (prev == null || cur == null || cur <= prev + 1) continue;
    const first = prev + 1;
    const last = cur - 1;
    items[i].flags.push(first === last ? `question ${first} missing (numbering gap)` : `questions ${first}-${last} missing (numbering gap)`);
  }
  return items;
}

function sectionTitleLine(t) {
  const h = (t || '').trim();
  if (!h || h.length > 120) return false;
  if (/^\s*\d{1,3}\s*[.)]\s/.test(h)) return false;
  if (/^\s*[A-F]\s*[.)]\s/i.test(h)) return false;
  if (/\?/.test(h)) return false;
  if (!/\b(?:19|20)\d{2}\b/.test(h)) return false;
  return /\b(?:WASSCE|WASCE|WAEC|SSCE|NECO|GCE|JAMB|UTME|POST\s*UTME|STRUCTURED|IMPROVISED|OBJECTIVE|QUESTIONS?|ANSWERS?|PAPER|SECTION|C\s*\.?\s*R\s*\.?\s*[SK]|CHRISTIAN\s+RELIGIOUS)\b/i.test(h);
}

function splitSections(raw) {
  raw = raw.replace(SECTION_DIVIDER, m => ' '.repeat(m.length));
  const lines = [], starts = [];
  let prev = 0;
  const nl = /\r\n|\n|\r/g;
  let nm;
  while ((nm = nl.exec(raw))) {
    lines.push(raw.slice(prev, nm.index));
    starts.push(prev);
    prev = nm.index + nm[0].length;
  }
  lines.push(raw.slice(prev));
  starts.push(prev);
  const ne = lines.map((t, i) => ({ t, i })).filter(x => x.t.trim());
  const pairs = t => (t.match(INLINE_PAIR) || []).length;
  const isKey = t => KEY_LINE.test(t) || PLACEHOLDER.test(t) || pairs(t) >= 2;
  const isStem = t => !isKey(t) && STEM_LINE.test(t);
  function boundary(k, how) {
    const line = lines[k] || '';
    let qEnd = k;
    const dropped = [];
    while (qEnd > 0) {
      const t = lines[qEnd - 1];
      if (!t.trim() || !sectionTitleLine(t)) break;
      dropped.unshift(t.trim());
      qEnd--;
    }
    if (dropped.length && qEnd > 0 && lines[qEnd - 1].trim()) {
      dropped.length = 0;
      qEnd = k;
    }
    const include = isKey(line) || pairs(line) >= 2;
    const boundaryText = dropped.length ? dropped.join('\n') + '\n' + line : line;
    return { questions: raw.slice(0, starts[qEnd]), answers: raw.slice(include ? starts[k] : (starts[k + 1] ?? raw.length)), how, boundary: boundaryText };
  }
  for (const { t, i } of ne) {
    if (/[=\-*_~#>+@|]{3,}/.test(t) && KEY_WORD.test(t) && t.trim().length <= 120 && !/\?/.test(t) && !/^\s*\d{1,3}[.)]/.test(t)) return boundary(i, 'divider');
  }
  if (ne.length && ne.every(x => isKey(x.t))) return { questions: '', answers: raw, how: 'key-only', boundary: '' };
  for (const { t, i } of ne) {
    const h = t.trim();
    if (!h || h.length > 120 || !KEY_WORD.test(h) || /\?/.test(h) || /^\s*\d{1,3}\s*[.)]/.test(h) || /^\s*[A-F]\s*[.)]/i.test(h)) continue;
    const pos = ne.findIndex(x => x.i === i);
    const after = ne.slice(pos + 1, pos + 7);
    if (after.length && after.every(x => isKey(x.t))) return boundary(i, 'header');
    if (after[0] && isKey(after[0].t) && after.filter(x => isKey(x.t)).length >= 2) return boundary(i, 'header');
    if (pairs(t) >= 2) return boundary(i, 'header');
  }
  let lastStem = -1;
  ne.forEach(x => { if (isStem(x.t)) lastStem = x.i; });
  if (lastStem >= 0) {
    for (const { t, i } of ne) {
      if (i <= lastStem || !isKey(t) && pairs(t) < 3) continue;
      const pos = ne.findIndex(x => x.i === i);
      const win = ne.slice(pos, pos + 5);
      if (win.filter(x => isKey(x.t) || pairs(x.t) >= 3).length >= 3) return boundary(i, 'structure');
    }
  }
  return { questions: raw, answers: '', how: 'none', boundary: '' };
}

function salvageNormalize(raw) {
  let inserts = 0;
  let text = raw.replace(/([^\s\d])(\d{1,3})\.(\s*)(?=[A-Z"'(]|$)/gm, (m, pre, n, sp) => {
    inserts++;
    return pre + '\n' + n + '.' + (sp || ' ');
  });
  text = text.replace(/([^\r\n])([ \t]+)(\d{1,3})\.(\s*)(?=[A-Z][a-z])/g, (m, pre, ws, n, sp) => {
    inserts++;
    return pre + '\n' + n + '.' + (sp || ' ');
  });
  text = text.replace(/([a-z])([A-F])\./g, (m, pre, letter) => {
    inserts++;
    return pre + ' ' + letter + '.';
  });
  text = text.replace(/([^A-Za-z\s])([A-F])\.(?![ \t\r\n]|$)/g, (m, pre, letter) => {
    inserts++;
    return pre + ' ' + letter + '.';
  });
  return { text, inserts };
}

function splitSectionsWithSalvage(raw) {
  const strict = splitSections(raw);
  const repair = salvageNormalize(raw);
  if (repair.inserts < 2) return { parts: strict, salvaged: false, inserts: 0 };
  const repaired = splitSections(repair.text);
  const before = splitQuestions(strict.questions).length;
  const after = splitQuestions(repaired.questions).length;
  if (after <= before) return { parts: strict, salvaged: false, inserts: 0 };
  return { parts: repaired, salvaged: true, inserts: repair.inserts };
}

function keyPairs(t) {
  const pairs = [];
  const r = /(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g;
  let m;
  while ((m = r.exec(t))) pairs.push({ num: +m[1], letter: m[2].toUpperCase() });
  return pairs;
}

function parseKeyDetailed(t) {
  const key = {};
  const seen = {};
  const conflicts = [];
  for (const { num, letter } of keyPairs(t)) {
    if (!seen[num]) seen[num] = [];
    if (!seen[num].includes(letter)) seen[num].push(letter);
    key[num] = letter;
  }
  Object.keys(seen).sort((a, b) => a - b).forEach(num => {
    if (seen[num].length > 1) conflicts.push({ num: +num, letters: seen[num] });
  });
  return { key, conflicts };
}

function parseKey(t) {
  return parseKeyDetailed(t).key;
}


const OCRComprehension = (function () {
// Pure comprehension-context detection and scoped (a)-(d) option parsing.
// Canonical engine for the browser and Node.js; no DOM, storage, or network use.

const HEADING = /^[^\S\n]*(?:PASSAGE|COMPREHENSION(?:\s+PASSAGE)?|EXTRACT)[^\S\n]+([IVXLC]+|\d{1,3})\b[^\S\n]*[:.\-–—]?[^\S\n]*(.*)$/i;
const INSTRUCTION = /^\s*(?:read|study|use|refer\s+to|the\s+following)\b/i;
const INSTRUCTION_RANGE = /\bquestions?\b[^.\n]{0,40}?\b(\d{1,3})\s*(?:to|and|[-–—])\s*(\d{1,3})\b/i;
const QUESTION_START = /^\s*(\d{1,3})\s*[.)]\s+\S/;
const KEY_HEADING = /^\s*(?:ANSWERS?|KEY|SCHEME|SOLUTIONS?)\b[^\n]{0,80}$/i;
const KEY_ENTRY = /^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*\(?[A-F]\)?\s*(?:$|[-–—/|:,;=]\s)/i;
const DIVIDER = /^\s*={3,}\s*$/;
const OPTION_MARK = /\(([a-d])\)/gi;

function headingOf(line) {
  const match = String(line == null ? '' : line).match(HEADING);
  if (!match) return null;
  const rest = String(match[2] || '').trim();
  if (/[?]$/.test(rest)) return null;
  return { label: match[1].toUpperCase(), rest };
}

function isKeyLine(line) {
  const text = String(line == null ? '' : line).trim();
  if (!text || text.length > 80) return false;
  return KEY_HEADING.test(text) || KEY_ENTRY.test(text);
}

function isBoundary(lines, index) {
  const line = lines[index];
  if (headingOf(line)) return true;
  if (DIVIDER.test(line)) return true;
  return isKeyLine(line);
}

function paragraphs(lines) {
  const out = [];
  let blank = false;
  for (const line of lines) {
    const text = String(line == null ? '' : line).trim();
    if (!text) {
      blank = out.length > 0;
      continue;
    }
    if (blank) out.push('');
    blank = false;
    out.push(text);
  }
  return out.join('\n').trim();
}

function splitOptions(stem) {
  const text = String(stem == null ? '' : stem);
  const marks = [];
  OPTION_MARK.lastIndex = 0;
  let match;
  while ((match = OPTION_MARK.exec(text))) {
    marks.push({ letter: match[1].toLowerCase(), start: match.index, end: match.index + match[0].length });
  }
  if (marks.length !== 4) return null;
  for (let i = 0; i < 4; i++) {
    if (marks[i].letter !== 'abcd'[i]) return null;
  }
  const question = text.slice(0, marks[0].start).trim();
  if (question.length < 3) return null;
  const options = [];
  for (let i = 0; i < 4; i++) {
    const stop = i === 3 ? text.length : marks[i + 1].start;
    const value = text.slice(marks[i].end, stop).trim();
    if (!value) return null;
    options.push(value);
  }
  return { question, options };
}

function instructionRange(lines, headingIndex) {
  let above = headingIndex - 1;
  while (above >= 0 && !String(lines[above] || '').trim()) above--;
  if (above < 0 || !INSTRUCTION.test(lines[above])) return null;
  const match = String(lines[above]).match(INSTRUCTION_RANGE);
  if (!match) return null;
  const from = +match[1];
  const to = +match[2];
  if (!(from > 0) || to < from || to - from > 50) return null;
  return { line: above, from, to };
}

function scanContexts(lines, warnings, removed) {
  const contexts = [];
  for (let i = 0; i < lines.length; i++) {
    if (!headingOf(lines[i])) continue;
    const title = String(lines[i]).trim();
    const range = instructionRange(lines, i);
    const removeFrom = range ? range.line : i;
    let start = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (isBoundary(lines, j)) break;
      if (QUESTION_START.test(lines[j])) {
        start = j;
        break;
      }
    }
    if (start < 0) {
      warnings.push(title + ' has fewer than two linked questions; read as ordinary text.');
      continue;
    }
    let end = lines.length;
    for (let k = start + 1; k < lines.length; k++) {
      if (headingOf(lines[k]) || DIVIDER.test(lines[k])) {
        end = k;
        break;
      }
      if (isKeyLine(lines[k]) && (k + 1 >= lines.length || isKeyLine(lines[k + 1]))) {
        end = k;
        break;
      }
    }
    const targets = [];
    for (let k = start; k < end; k++) {
      const match = String(lines[k]).match(QUESTION_START);
      if (!match) continue;
      const num = +match[1];
      if (num > 0 && targets.indexOf(num) === -1) targets.push(num);
    }
    const text = paragraphs(lines.slice(i + 1, start));
    if (targets.length < 2) {
      warnings.push(title + ' links fewer than two questions; read as ordinary text.');
      continue;
    }
    if (!text) {
      warnings.push(title + ' has no passage text; left unlinked.');
      continue;
    }
    const expectedCount = range ? range.to - range.from + 1 : targets.length;
    if (range && (targets[0] !== range.from || targets[targets.length - 1] !== range.to)) {
      warnings.push(title + ' names questions ' + range.from + '-' + range.to
        + ' but ' + targets.length + ' were found; check the paste.');
    }
    for (let g = 1; g < targets.length; g++) {
      if (targets[g] !== targets[g - 1] + 1) {
        warnings.push(title + ' questions are not contiguous near ' + targets[g] + '; check the paste.');
        break;
      }
    }
    contexts.push({
      id: 'ctx-' + (contexts.length + 1),
      order: contexts.length + 1,
      type: 'comprehension',
      title,
      text,
      targets,
      expectedCount,
      evidence: {
        heading: title,
        startLine: i + 1,
        questionStartLine: start + 1,
        questionEndLine: end,
        source: range ? 'instruction' : 'heading'
      }
    });
    for (let r = removeFrom; r < start; r++) removed.push(r);
    i = start - 1;
  }
  return contexts;
}

function detect(raw) {
  const source = String(raw == null ? '' : raw).replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const warnings = [];
  const removed = [];
  const contexts = scanContexts(lines, warnings, removed);
  if (!removed.length) return { text: source, contexts, warnings };
  const drop = new Set(removed);
  return {
    text: lines.map((line, index) => (drop.has(index) ? '' : line)).join('\n'),
    contexts,
    warnings
  };
}

const OCRComprehension = {
  detect,
  splitOptions
};
return OCRComprehension;
})();

const OCRCloze = (function () {
// Pure cloze-context detection and A-D option-table parsing.
// Canonical engine for the browser and Node.js; no DOM, storage, or network use.

const INSTRUCTION = /\bnumbered\s+gaps?\b/i;
const INSTRUCTION_COLUMNS = /(?:lettered\s+A\s+to\s+D|four\s+options|columns?\s+[A-D]\s*(?:to|and|[-–—,])\s*[A-D])/i;
const HEADER = /^\s*A\s{2,}B\s{2,}C\s{2,}D\s*$/;
const ROW = /^\s*(\d{1,3})\s*[.)]\s+(\S.*)$/;
const SECTION = /^\s*(?:SECTION|PART)\s+[A-Z0-9IVXLC]+\b/i;
const GAP = /\.{3,}\s*(\d{1,3})\.?\s*\.{2,}/g;
const MAX_OPTION = 500;
const MAX_SLOTS = 999;

function expandTabs(line) {
  const text = String(line == null ? '' : line);
  if (text.indexOf('\t') === -1) return text;
  let out = '';
  for (const char of text) {
    if (char !== '\t') out += char;
    else do out += ' '; while (out.length % 8 !== 0);
  }
  return out;
}

function gapNumbers(text) {
  const numbers = [];
  GAP.lastIndex = 0;
  let match;
  while ((match = GAP.exec(text))) {
    const num = Number(match[1]);
    if (num > 0 && num <= MAX_SLOTS && numbers.indexOf(num) === -1) numbers.push(num);
  }
  return numbers;
}

function paragraphs(lines) {
  const out = [];
  let blank = false;
  for (const line of lines) {
    const text = expandTabs(line).trim();
    if (!text) {
      blank = out.length > 0;
      continue;
    }
    if (blank) out.push('');
    blank = false;
    out.push(text);
  }
  const raw = out.join('\n').trim();
  GAP.lastIndex = 0;
  return { raw, text: raw.replace(GAP, (match, digits) => '[[gap:' + Number(digits) + ']]') };
}

// Segment starts per row, split on runs of two or more spaces.
function segments(body, offset) {
  const starts = [];
  let last = offset;
  for (const match of body.matchAll(/\s{2,}/g)) {
    if (match.index > last) starts.push(last);
    last = match.index + match[0].length;
  }
  if (last < body.length) starts.push(last);
  return starts;
}

// Column starts come from repeated row alignment, never from the header line,
// whose indent does not match the numbered rows.
function columnStarts(rows) {
  const votes = [[], [], [], []];
  rows.forEach(row => {
    for (let i = 0; i < 4 && i < row.starts.length; i++) votes[i].push(row.starts[i]);
  });
  const starts = [];
  for (const column of votes) {
    if (column.length < 2) return null;
    const counts = {};
    let best = column[0];
    let bestCount = 0;
    for (const value of column) {
      const count = counts[value] = (counts[value] || 0) + 1;
      if (count > bestCount || (count === bestCount && value < best)) { best = value; bestCount = count; }
    }
    if (bestCount * 2 < rows.length) return null;
    starts.push(best);
  }
  for (let k = 1; k < 4; k++) if (starts[k] <= starts[k - 1]) return null;
  return starts;
}

// Keep a boundary outside the middle of a word so an overflowing cell is never
// cut in half; the extra words belong to the previous cell.
function snap(body, index) {
  let i = index;
  if (i <= 0) return 0;
  if (i >= body.length) return body.length;
  if (/\s/.test(body[i - 1]) || /\s/.test(body[i])) return i;
  while (i < body.length && !/\s/.test(body[i])) i++;
  return i;
}

function cellsOf(row, starts) {
  // Require two row-derived anchors before correcting a local one-column drift.
  const leftAnchors = starts.slice(1).filter(start =>
    row.starts.indexOf(start) === -1 && row.starts.indexOf(start - 1) !== -1).length;
  const edges = [row.offset];
  for (let k = 1; k < 4; k++) {
    const local = leftAnchors >= 2 && row.starts.indexOf(starts[k]) === -1 ? starts[k] - 1 : starts[k];
    edges.push(Math.max(snap(row.body, local), edges[k - 1]));
  }
  edges.push(row.body.length);
  const cells = [];
  for (let c = 0; c < 4; c++) cells.push(row.body.slice(edges[c], edges[c + 1]));
  return cells.map(cell => cell.replace(/\s+/g, ' ').trim());
}

function readRows(lines, headerIndex) {
  const rows = [];
  let end = -1;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = expandTabs(lines[i]).replace(/\s+$/, '');
    if (!line.trim()) {
      if (rows.length) break;
      continue;
    }
    const match = ROW.exec(line);
    if (!match) break;
    const offset = line.length - match[2].length;
    rows.push({ num: Number(match[1]), body: line, offset, starts: segments(line, offset) });
    end = i;
  }
  return { rows, end };
}

function titleAbove(lines, instructionIndex) {
  let seen = 0;
  for (let i = instructionIndex - 1; i >= 0 && seen < 2; i--) {
    const text = expandTabs(lines[i]).trim();
    if (!text) continue;
    seen++;
    if (SECTION.test(text) && text.length <= 80) return { title: text, line: i };
  }
  return null;
}

function findHeader(lines, instructionIndex) {
  const limit = Math.min(lines.length, instructionIndex + 80);
  for (let i = instructionIndex + 1; i < limit; i++) {
    if (HEADER.test(expandTabs(lines[i]))) return i;
    if (ROW.test(expandTabs(lines[i]))) return -1;
  }
  return -1;
}

// Refuse the whole group on any doubt: no partial cloze contexts or guessed
// options. The rows then stay in the paste as ordinary numbered questions.
function readTable(lines, instructionIndex, warnings) {
  const header = findHeader(lines, instructionIndex);
  if (header < 0) return null;
  const table = readRows(lines, header);
  const rows = table.rows;
  if (rows.length < 2) {
    warnings.push('a cloze table near line ' + (header + 1) + ' has fewer than two rows; read as ordinary questions.');
    return null;
  }
  const found = titleAbove(lines, instructionIndex);
  const title = found ? found.title : 'Cloze passage';
  const passage = paragraphs(lines.slice(instructionIndex + 1, header));
  const gaps = gapNumbers(passage.raw);
  const say = reason => {
    warnings.push(title + ' cloze table for ' + rows[0].num + '-' + rows[rows.length - 1].num
      + ' ' + reason + '; read as ordinary questions.');
    return null;
  };
  if (gaps.length < 2) return say('has no numbered gaps in the passage');
  const numbers = rows.map(row => row.num);
  const ordered = numbers.every((num, index) => index === 0 || num > numbers[index - 1]);
  if (!ordered || gaps.length !== numbers.length || gaps.some((num, index) => num !== numbers[index])) {
    return say('does not match the passage gaps ' + gaps[0] + '-' + gaps[gaps.length - 1]);
  }
  const starts = columnStarts(rows);
  if (!starts) return say('has no stable four-column alignment');
  for (const row of rows) {
    const cells = cellsOf(row, starts);
    for (let c = 0; c < 4; c++) {
      if (!cells[c]) return say('is missing the ' + 'ABCD'[c] + ' option for gap ' + row.num);
      if (cells[c].length > MAX_OPTION) return say('has an option longer than ' + MAX_OPTION + ' characters at gap ' + row.num);
    }
    row.cells = cells;
  }
  return { title, text: passage.text, rows, header, end: table.end, from: found ? found.line : instructionIndex };
}

// A blocked set keeps a refused group in the source text so the caller can
// parse its rows as ordinary questions instead of dropping them.
function detect(raw, blocked) {
  const source = String(raw == null ? '' : raw).replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const warnings = [];
  const contexts = [];
  const items = [];
  const removed = [];

  for (let i = 0; i < lines.length; i++) {
    const instruction = expandTabs(lines[i]);
    if (!INSTRUCTION.test(instruction) || !INSTRUCTION_COLUMNS.test(instruction)) continue;
    const table = readTable(lines, i, warnings);
    if (!table) continue;
    if (blocked && table.rows.some(row => blocked.has(row.num))) continue;
    const context = {
      id: 'cloze-' + (contexts.length + 1),
      order: contexts.length + 1,
      type: 'cloze',
      title: table.title,
      text: table.text,
      targets: table.rows.map(row => row.num),
      expectedCount: table.rows.length,
      linkedCount: table.rows.length,
      evidence: {
        heading: table.title,
        startLine: i + 1,
        questionStartLine: table.header + 2,
        questionEndLine: table.end + 1,
        source: 'table'
      }
    };
    contexts.push(context);
    table.rows.forEach((row, index) => {
      items.push({ num: row.num, question: 'Choose the option that best fills gap ' + row.num + '.',
        a: row.cells[0], b: row.cells[1], c: row.cells[2], d: row.cells[3], e: '', f: '', flags: [],
        contextRef: context.id, contextPosition: String(index + 1), contextSlot: '' });
    });
    for (let r = table.from; r <= table.end; r++) removed.push(r);
    i = table.end;
  }

  if (!removed.length) return { text: source, contexts: [], items: [], warnings };

  const drop = new Set(removed);
  return { text: lines.map((line, index) => (drop.has(index) ? '' : line)).join('\n'), contexts, items, warnings };
}

const OCRCloze = { detect, columnStarts, cellsOf };
return OCRCloze;
})();

function comprehensionEngine() {
  return OCRComprehension;
}

function clozeEngine() {
  return OCRCloze;
}

function mergeClozeItems(items, extra) {
  if (!extra.length) return items;
  const seen = new Set(items.map(item => item.num));
  const merged = items.slice();
  for (const item of extra) {
    if (seen.has(item.num)) continue;
    seen.add(item.num);
    merged.push(item);
  }
  const rank = item => (item.num == null ? Infinity : item.num);
  return merged.sort((a, b) => rank(a) - rank(b));
}

function renumberContexts(contexts, items) {
  const ids = new Map();
  contexts.forEach((context, index) => ids.set(context.id, "ctx-" + (index + 1)));
  contexts.forEach((context, index) => {
    context.id = ids.get(context.id);
    context.order = index + 1;
  });
  for (const item of items) {
    if (item && item.contextRef && ids.has(item.contextRef)) item.contextRef = ids.get(item.contextRef);
  }
}

function linkComprehension(contexts, items, warnings, engine) {
  const byNum = new Map();
  for (const item of items) {
    if (item && Number.isInteger(item.num) && !byNum.has(item.num)) byNum.set(item.num, item);
  }
  for (const context of contexts) {
    if (context.type === "cloze") continue;
    let linked = 0;
    context.targets.forEach((num, index) => {
      const item = byNum.get(num);
      if (!item) {
        warnings.push(`question ${num} for ${context.title} was not parsed`);
        return;
      }
      if (item.contextRef) {
        warnings.push(`question ${num} is claimed by more than one passage`);
        return;
      }
      const split = engine.splitOptions(item.question);
      if (split) {
        item.question = split.question;
        item.a = split.options[0];
        item.b = split.options[1];
        item.c = split.options[2];
        item.d = split.options[3];
        item.flags = item.flags.filter(flag => !/^option [ABCD] missing$/.test(flag));
      } else if (/\(a\)/i.test(item.question)) {
        warnings.push(`question ${num} has no complete (a)-(d) option set`);
      }
      item.contextRef = context.id;
      item.contextPosition = String(index + 1);
      item.contextSlot = "";
      linked++;
    });
    context.linkedCount = linked;
  }
}

function keyWarnings(key, conflicts, contexts, warnings) {
  for (const conflict of conflicts) {
    warnings.push(`answer key gives question ${conflict.num} more than one letter`);
  }
  if (!key) return;
  for (const context of contexts) {
    for (const num of context.targets) {
      if (!key[num]) warnings.push(`no answer-key entry for question ${num}`);
    }
  }
}

function parseBody(text) {
  const salvage = splitSectionsWithSalvage(text);
  const sections = salvage.parts;
  const fixed = FIXES.reduce((body, [pattern, replacement]) => body.replace(pattern, replacement), sections.questions);
  const header = parseHeader(fixed);
  let items = splitQuestionItems(fixed).map(item => parseQuestion(item));
  items = flagNumberingGaps(items);
  items = applyStimulusFlags(items);
  return { salvage, sections, header, items };
}

function detectContexts(source, engine, cloze, blocked) {
  const table = cloze ? cloze.detect(source, blocked) : { text: source, contexts: [], items: [], warnings: [] };
  const passage = engine ? engine.detect(table.text) : { text: table.text, contexts: [], warnings: [] };
  return {
    text: passage.text,
    contexts: passage.contexts.concat(table.contexts),
    clozeItems: table.items || [],
    warnings: table.warnings.concat(passage.warnings || [])
  };
}

function collidingNumbers(clozeItems, items) {
  const seen = new Set(items.map(item => item.num));
  return Array.from(new Set(clozeItems.filter(item => seen.has(item.num)).map(item => item.num)));
}

function dedupeCloze(contexts, clozeItems, warnings) {
  const claimed = new Set(), dropped = new Set(), kept = [];
  for (const context of contexts) {
    if (context.type !== "cloze") { kept.push(context); continue; }
    if (context.targets.some(num => claimed.has(num))) {
      dropped.add(context.id);
      const first = context.targets[0], last = context.targets[context.targets.length - 1];
      const contiguous = context.targets.every((num, i) => i === 0 || num === context.targets[i - 1] + 1);
      warnings.push("duplicate cloze group for gaps "
        + (contiguous ? first + "-" + last : context.targets.join(", "))
        + " ignored; kept the first occurrence.");
      continue;
    }
    context.targets.forEach(num => claimed.add(num));
    kept.push(context);
  }
  return { contexts: kept, items: clozeItems.filter(item => !dropped.has(item.contextRef)) };
}

function parsePaste(raw) {
  const source = raw || "";
  const engine = comprehensionEngine();
  const cloze = clozeEngine();
  let detected = detectContexts(source, engine, cloze, null);
  let parsed = parseBody(detected.text);
  if (cloze) {
    let clash = collidingNumbers(detected.clozeItems, parsed.items);
    if (clash.length) {
      detected = detectContexts(source, engine, cloze, new Set(clash));
      parsed = parseBody(detected.text);
      const again = collidingNumbers(detected.clozeItems, parsed.items);
      if (again.length) {
        const all = detected.clozeItems.map(item => item.num).concat(again);
        detected = detectContexts(source, engine, cloze, new Set(all));
        parsed = parseBody(detected.text);
        clash = Array.from(new Set(clash.concat(again)));
      }
      detected.warnings.push("numbered gap rows " + clash.join(", ")
        + " collide with an ordinary question; read as ordinary questions.");
    }
  }
  const deduped = dedupeCloze(detected.contexts, detected.clozeItems, detected.warnings);
  detected.contexts = deduped.contexts;
  detected.clozeItems = deduped.items;
  const { salvage, sections, header } = parsed;
  let items = mergeClozeItems(parsed.items, detected.clozeItems);
  if (salvage.salvaged) {
    items.forEach(item => {
      item.flags.push("OCR boundaries repaired; verify question and option split");
    });
  }
  const keyInfo = sections.answers ? parseKeyDetailed(sections.answers) : { key: null, conflicts: [] };
  const warnings = detected.warnings.slice();
  if (engine) linkComprehension(detected.contexts, items, warnings, engine);
  renumberContexts(detected.contexts, items);
  keyWarnings(keyInfo.key, keyInfo.conflicts, detected.contexts, warnings);
  return {
    version: PARSER_VERSION,
    sections,
    header,
    contexts: detected.contexts,
    items,
    key: keyInfo.key,
    keyConflicts: keyInfo.conflicts,
    sectionEvidence: {
      how: sections.how,
      boundary: sections.boundary,
      contexts: detected.contexts.map(context => context.evidence)
    },
    warnings
  };
}

const OCRParserCore = {
  version: PARSER_VERSION,
  FIXES,
  OPTION,
  KEY_LINE,
  PLACEHOLDER,
  STEM_LINE,
  KEY_WORD,
  INLINE_PAIR,
  LOOSE,
  parseHeader,
  pickSubjectIndex,
  pickCategoryIndex,
  splitQuestions,
  splitBulletQuestions,
  splitQuestionItems,
  parseQuestion,
  parseStimulusRange,
  extractStimuli,
  applyStimulusFlags,
  flagNumberingGaps,
  splitSections,
  salvageNormalize,
  splitSectionsWithSalvage,
  keyPairs,
  parseKeyDetailed,
  parseKey,
  parsePaste,
  comprehensionEngine,
  clozeEngine,
  linkComprehension
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = OCRParserCore;
}
if (typeof window !== "undefined") {
  window.OCRParser = OCRParserCore;
  window.OCRComprehension = OCRComprehension;
  window.OCRCloze = OCRCloze;
}
