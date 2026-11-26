// Thin Node compatibility facade. The canonical parser lives in core.js and the
// stimulus bookmarklet's autosave policy lives in its own module; this file
// defines no parsing or product logic of its own.
const core = require('./core.js');
const stimulus = require('../bookmarklets/stimulus/autosave.js');

module.exports = Object.assign({}, core, stimulus);
