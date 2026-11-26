const fs = require('fs');
const path = require('path');

const here = __dirname;
const root = path.join(here, '..', '..', '..');
const sources = [
  path.join(root, 'src', 'parser', 'core.js'),
  path.join(here, 'boot.js'),
  path.join(here, 'entry.js')
];
const outPath = path.join(here, 'bookmarklet.js');
const checkOnly = process.argv.includes('--check');

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

// The key bookmarklet is the canonical parser core, a boot step that removes the
// page's deployed panel, and the key entry. It is never deployed as a page
// asset; only this generated file is installed as a bookmark.
const body = sources
  .map(file => flatten(stripLineComments(fs.readFileSync(file, 'utf8'))))
  .join(' ');

const bookmarklet = 'javascript:(function(){try{' + body
  + "}catch(e){alert('Bookmarklet Error: '+e.message);}})();";

if (/%[0-9A-Fa-f]{2}/.test(bookmarklet)) {
  throw new Error('bookmarklet contains a percent-escape, which a bookmark manager may decode; remove it');
}

new Function(body);

if (checkOnly) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (current !== bookmarklet + '\n') {
    throw new Error('stale build: ' + outPath + ' does not match its sources; rebuild it');
  }
  console.log('Current: ' + outPath + ' matches its sources ('
    + Buffer.byteLength(bookmarklet, 'utf8') + ' bytes)');
} else {
  fs.writeFileSync(outPath, bookmarklet + '\n');
  console.log('Wrote ' + outPath + ' (' + bookmarklet.length + ' chars, '
    + Buffer.byteLength(bookmarklet, 'utf8') + ' bytes)');
}
