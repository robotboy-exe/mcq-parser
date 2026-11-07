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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCRComprehension;
}
if (typeof window !== 'undefined') {
  window.OCRComprehension = OCRComprehension;
}
