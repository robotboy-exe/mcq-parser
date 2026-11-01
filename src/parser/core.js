// Pure canonical OCR parsing engine for both browser and Node.js.
// Version: 2.0.0
// Contract: Pure parsing and diagnostics only; zero DOM, storage, or network dependencies.

const PARSER_VERSION = "2.0.0";
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
  const ym = header.match(/\b(20\d{2})\b/);
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
      .replace(/\b(20\d{2})\b/g, '')
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
      if (validStimulusBlock(lines, run.start, run.end)) return run;
      i = run.end + 1;
    } else {
      i++;
    }
  }
  i = markerLine - 1;
  while (i >= 0 && !stimulusStructuralLine(lines[i])) {
    if (stimulusBlockLine(lines[i])) {
      const run = stimulusRun(lines, i);
      if (validStimulusBlock(lines, run.start, run.end)) return run;
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
    mk.block = validStimulusBlock(lines, run.start, run.end) ? run : nearestStimulusBlock(lines, mk.line);
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
    if (removed.has(i)) {
      cleaned.push('');
      continue;
    }
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
    for (let j = run.start; j <= run.end; j++) removed.add(j);
    stimuli.push({
      at: i,
      sourceNum: num,
      nums: parseStimulusRange(lines[i]),
      marker: lines[i].trim(),
      text: lines.slice(run.start, run.end + 1).join('\n').trim(),
      source: 'intro'
    });
  }
  if (!removed.size) return { text: raw, stimuli: [] };
  return {
    text: lines.map((line, i) => removed.has(i) ? '' : line).join('\n'),
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
  const clean = s => s.replace(/\s+/g, ' ').trim();
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
  const q = {
    num,
    question: clean(raw.slice(0, marks[0]?.[1].start ?? raw.length)),
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
  if (!/\b20\d{2}\b/.test(h)) return false;
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


function parsePaste(raw) {
  const salvage = splitSectionsWithSalvage(raw || "");
  const sections = salvage.parts;
  const fixed = FIXES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), sections.questions);
  const header = parseHeader(fixed);
  const rawItems = splitQuestionItems(fixed);
  let items = rawItems.map(item => parseQuestion(item));
  items = flagNumberingGaps(items);
  items = applyStimulusFlags(items);
  if (salvage.salvaged) {
    items.forEach(item => {
      item.flags.push("OCR boundaries repaired; verify question and option split");
    });
  }
  const key = sections.answers ? parseKey(sections.answers) : null;
  return {
    version: PARSER_VERSION,
    sections,
    header,
    items,
    key
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
  parsePaste
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = OCRParserCore;
}
if (typeof window !== "undefined") {
  window.OCRParser = OCRParserCore;
}
