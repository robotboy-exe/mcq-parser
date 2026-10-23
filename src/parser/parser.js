const FIXES = [
  [/govemment/gi, 'government'],
  [/persidential/gi, 'presidential'],
  [/resposible/gi, 'responsible']
];
const OPTION = /(?:^|\n|\s)([A-F])[^\S\n]*[.)][^\S\n]*|\n\s*([A-F])\s+(?=\d)/g;
const KEY_LINE = /^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*\(?([A-F])\)?\s*(?:[.)]\s*)?(?:$|[-–—/|:,;=]\s|\(|\[)/i;
const PLACEHOLDER = /^\s*\(?\d{1,3}\)?\s*[.)\-:]?\s*[\[(]?\s*(?:missing|not\s+given|not\s+available|n\s*[/\\]\s*a|unavailable|no\s+answer)/i;
const STEM_LINE = /^\s*\d{1,3}[.)]\s+\S.{11,}/;
const KEY_WORD = /\b(ANSWERS?|KEY|SCHEME|SOLUTIONS?)\b/i;
const INLINE_PAIR = /(\d{1,3})\s*[.\-:)]\s*\(?([A-F])\)?(?![A-Za-z])/gi;
const LOOSE = { E: /\n[^\S\n]*E[^\S\n]+(?=\S)/, F: /\n[^\S\n]*F[^\S\n]+(?=\S)/ };

function parseHeader(text) {
  const header = text.split('\n').slice(0, 3).join(' ').toUpperCase();
  let year = null;
  const ym = header.match(/\b(20\d{2})\b/);
  if (ym) year = ym[1];
  return { year, header };
}

function pickSubjectIndex(header, optionTexts) {
  const aliases = [{
    match: /\bC\s*\.?\s*R\s*\.?\s*K\b|\bCRK\b|\bCHRISTIAN RELIGIOUS\b/,
    keywords: ['CRS', 'CHRISTIAN RELIGIOUS']
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

function parseQuestion({ num, text }) {
  const raw = text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const pos = {};
  const count = {};
  for (const m of raw.matchAll(OPTION)) {
    const letter = m[1] || m[2];
    if (!letter) continue;
    pos[letter] = { start: m.index, end: m.index + m[0].length };
    count[letter] = (count[letter] || 0) + 1;
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
  if (Object.values(count).some(c => c > 1)) q.flags.push('a letter appears twice (merged questions?)');
  return q;
}

function splitSections(raw) {
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
  const isKey = t => KEY_LINE.test(t) || PLACEHOLDER.test(t);
  const isStem = t => !isKey(t) && STEM_LINE.test(t);
  const pairs = t => (t.match(INLINE_PAIR) || []).length;
  function boundary(k, how) {
    const line = lines[k] || '';
    const include = isKey(line) || pairs(line) >= 2;
    return { questions: raw.slice(0, starts[k]), answers: raw.slice(include ? starts[k] : (starts[k + 1] ?? raw.length)), how };
  }
  for (const { t, i } of ne) {
    if (/[=\-*_~#>+@|]{3,}/.test(t) && KEY_WORD.test(t) && t.trim().length <= 120 && !/\?/.test(t) && !/^\s*\d{1,3}[.)]/.test(t)) return boundary(i, 'divider');
  }
  if (ne.length && ne.every(x => isKey(x.t))) return { questions: '', answers: raw, how: 'key-only' };
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
  return { questions: raw, answers: '', how: 'none' };
}

function parseKey(t) {
  const k = {};
  const r = /(\d{1,3})\s*[.\-:)]*\s*\(?([A-Fa-f])\)?(?![A-Za-z])/g;
  let m;
  while ((m = r.exec(t))) k[+m[1]] = m[2].toUpperCase();
  return k;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
    splitQuestions,
    parseQuestion,
    splitSections,
    parseKey
  };
}
