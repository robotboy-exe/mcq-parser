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
  const edges = [row.offset];
  for (let k = 1; k < 4; k++) edges.push(Math.max(snap(row.body, starts[k]), edges[k - 1]));
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCRCloze;
}
if (typeof window !== 'undefined') {
  window.OCRCloze = OCRCloze;
}
