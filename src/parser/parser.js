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


if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
  const core = require('./core.js');
  module.exports = {
    ...core,
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
