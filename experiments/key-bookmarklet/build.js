const fs = require('fs');
const path = require('path');

const here = __dirname;
const root = path.join(here, '..', '..');
const corePath = path.join(root, 'src', 'parser', 'core.js');
const uiPath = path.join(here, 'ui.js');
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

const body = flatten(stripLineComments(fs.readFileSync(corePath, 'utf8')))
  + ' '
  + flatten(stripLineComments(fs.readFileSync(uiPath, 'utf8')));

const bookmarklet = 'javascript:(function(){try{' + body
  + "}catch(e){alert('Bookmarklet Error: '+e.message);}})();";

if (/%[0-9A-Fa-f]{2}/.test(bookmarklet)) {
  throw new Error('bookmarklet contains a percent-escape, which a bookmark manager may decode; remove it');
}

new Function(body);

fs.writeFileSync(outPath, bookmarklet + '\n');
console.log('Wrote ' + outPath + ' (' + bookmarklet.length + ' chars, '
  + Buffer.byteLength(bookmarklet, 'utf8') + ' bytes)');
