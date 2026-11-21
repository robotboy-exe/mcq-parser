const fs = require('fs');
const path = require('path');

const here = __dirname;
const root = path.join(here, '..', '..');
const sources = [
  path.join(root, 'src', 'parser', 'core.js'),
  path.join(here, 'boot.js'),
  path.join(root, 'ocr_helper.js')
];
const outPath = path.join(here, 'bookmarklet.js');

function stripLineComments(text) {
  return text.split(/\r?\n/)
    .filter(line => !/^\s*\/\//.test(line))
    .join('\n');
}

function flatten(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ');
}

// The bookmarklet is the live OCR panel plus canonical key parsing: it drops
// the page's older panel, then installs the current ocr_helper.js, so Load,
// Skip this question and Clear list behave exactly as on a deployed page.
const body = sources
  .map(file => flatten(stripLineComments(fs.readFileSync(file, 'utf8'))))
  .join(' ');

const bookmarklet = 'javascript:(function(){try{' + body
  + "}catch(e){alert('Bookmarklet Error: '+e.message);}})();";

if (/%[0-9A-Fa-f]{2}/.test(bookmarklet)) {
  throw new Error('bookmarklet contains a percent-escape, which a bookmark manager may decode; remove it');
}

new Function(body);

fs.writeFileSync(outPath, bookmarklet + '\n');
console.log('Wrote ' + outPath + ' (' + bookmarklet.length + ' chars, '
  + Buffer.byteLength(bookmarklet, 'utf8') + ' bytes)');
