const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const parserPath = path.join(root, 'parser', 'parser.js');
const uiPath = path.join(root, 'ui', 'ui.js');
const outPath = path.join(root, 'bookmarklet.js');

const parser = fs.readFileSync(parserPath, 'utf8');
const ui = fs.readFileSync(uiPath, 'utf8');

const body = [parser, ui, 'runOCRBookmarklet();']
  .join('\n')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .join(' ');

const bookmarklet = 'javascript:(function(){try{' + body + "}catch(e){alert('Bookmarklet Error: '+e.message);}})();";

fs.writeFileSync(outPath, bookmarklet + '\n');
console.log('Wrote ' + outPath + ' (' + bookmarklet.length + ' bytes)');
