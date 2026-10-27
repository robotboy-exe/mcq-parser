const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const parserPath = path.join(root, 'parser', 'parser.js');
const uiPath = path.join(root, 'ui', 'ui.js');
const outPath = path.join(root, 'bookmarklet.js');
const minOutPath = path.join(root, 'bookmarklet.min.js');
const buildMin = process.argv.includes('--min');

const MAX_BOOKMARKLET_BYTES = 65536;

// Full-line comments are source-only. The build drops them before flattening.
function stripLineComments(text) {
  return text.split(/\r?\n/)
    .filter(line => !/^\s*\/\//.test(line))
    .join('\n');
}

const NUMBER = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)n?/;
const OPS = [
  '>>>=', '...', '===', '!==', '**=', '>>>', '<<=', '>>=', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'
];
const EXPR_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await'
]);

function isIdStart(c) {
  return /[A-Za-z_$]/.test(c);
}

function isIdPart(c) {
  return /[A-Za-z0-9_$]/.test(c);
}

function isDigit(c) {
  return c >= '0' && c <= '9';
}

function readString(s, i, quote) {
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === '\\') {
      j += 2;
      continue;
    }
    if (s[j] === quote) return j + 1;
    j++;
  }
  return j;
}

function readTemplate(s, i) {
  let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '`') return j + 1;
    if (c === '$' && s[j + 1] === '{') {
      let depth = 1;
      j += 2;
      while (j < s.length && depth > 0) {
        const d = s[j];
        if (d === '\\') {
          j += 2;
          continue;
        }
        if (d === '"' || d === "'") {
          j = readString(s, j, d);
          continue;
        }
        if (d === '`') {
          j = readTemplate(s, j);
          continue;
        }
        if (d === '{') depth++;
        else if (d === '}') depth--;
        j++;
      }
      continue;
    }
    j++;
  }
  return j;
}

function readRegex(s, i) {
  let j = i + 1;
  let inClass = false;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '[') {
      inClass = true;
      j++;
      continue;
    }
    if (c === ']') {
      inClass = false;
      j++;
      continue;
    }
    if (c === '/' && !inClass) {
      j++;
      while (/[a-z]/i.test(s[j] || '')) j++;
      return j;
    }
    if (c === '\n') return -1;
    j++;
  }
  return -1;
}

function readNumber(s, i) {
  const m = NUMBER.exec(s.slice(i));
  return i + (m ? m[0].length : 1);
}

// A regex can start where an expression is expected. The source has no
// regex literal after `)` or `}`, which are the two ambiguous cases.
function regexAllowed(type, text) {
  if (type === null) return true;
  if (type === 'id') return EXPR_KEYWORDS.has(text);
  if (type === 'number' || type === 'string' || type === 'template' || type === 'regex') return false;
  return text !== ')' && text !== ']' && text !== '}' && text !== '++' && text !== '--';
}

function isWord(type) {
  return type === 'id' || type === 'number';
}

function needsSpace(prevType, prevText, type, text) {
  if (isWord(prevType) && isWord(type)) return true;
  if ((prevType === 'string' || prevType === 'template' || prevType === 'regex') && isWord(type)) return true;
  if (prevType === 'number' && text[0] === '.') return true;
  if (prevText === '+' && text === '+') return true;
  if (prevText === '-' && text === '-') return true;
  if (prevText === '/' && (text[0] === '/' || text[0] === '*')) return true;
  if (prevText === '?' && text[0] === '.') return true;
  if (prevText === '<' && text.slice(0, 3) === '!--') return true;
  return false;
}

// Whitespace-only minification. It keeps every literal and identifier intact;
// it does not rename or otherwise rewrite tokens.
function minify(source) {
  const out = [];
  let i = 0;
  let prevType = null;
  let prevText = null;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    let type;
    let text;
    let end;
    if (c === '"' || c === "'") {
      type = 'string';
      end = readString(source, i, c);
      text = source.slice(i, end);
    } else if (c === '`') {
      type = 'template';
      end = readTemplate(source, i);
      text = source.slice(i, end);
    } else if (c === '/' && regexAllowed(prevType, prevText)) {
      end = readRegex(source, i);
      if (end < 0) {
        type = 'punct';
        text = '/';
        end = i + 1;
      } else {
        type = 'regex';
        text = source.slice(i, end);
      }
    } else if (isIdStart(c)) {
      type = 'id';
      end = i + 1;
      while (end < source.length && isIdPart(source[end])) end++;
      text = source.slice(i, end);
    } else if (isDigit(c) || (c === '.' && isDigit(source[i + 1]))) {
      type = 'number';
      end = readNumber(source, i);
      text = source.slice(i, end);
    } else {
      type = 'punct';
      text = OPS.find(op => source.startsWith(op, i)) || c;
      end = i + text.length;
    }
    if (needsSpace(prevType, prevText, type, text)) out.push(' ');
    out.push(text);
    prevType = type;
    prevText = text;
    i = end;
  }
  return out.join('');
}

const parser = stripLineComments(fs.readFileSync(parserPath, 'utf8'));
const ui = stripLineComments(fs.readFileSync(uiPath, 'utf8'));

const body = [parser, ui, 'runOCRBookmarklet();']
  .join('\n')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .join(' ');
const minBody = buildMin ? minify(body) : null;

try {
  new Function(body);
  if (minBody) new Function(minBody);
} catch (e) {
  throw new Error('generated body failed to parse: ' + e.message);
}

function wrap(script) {
  return 'javascript:(function(){try{' + script + "}catch(e){alert('Bookmarklet Error: '+e.message);}})();";
}

const bookmarklet = wrap(body);

if (bookmarklet.indexOf('%') !== -1) {
  throw new Error('bookmarklet contains %, which can be decoded by a bookmark manager; remove the literal');
}

fs.writeFileSync(outPath, bookmarklet + '\n');
console.log('Wrote ' + outPath + ' (' + bookmarklet.length + ' chars, ' + Buffer.byteLength(bookmarklet, 'utf8') + ' bytes)');

if (buildMin) {
  const minBookmarklet = wrap(minBody);
  const minBytes = Buffer.byteLength(minBookmarklet, 'utf8');
  if (minBytes > MAX_BOOKMARKLET_BYTES) {
    throw new Error('bookmarklet.min.js is ' + minBytes + ' bytes; mobile bookmarklets are limited to ' + MAX_BOOKMARKLET_BYTES + ' bytes');
  }
  fs.writeFileSync(minOutPath, minBookmarklet + '\n');
  console.log('Wrote ' + minOutPath + ' (' + minBookmarklet.length + ' chars, ' + minBytes + ' bytes)');
}
