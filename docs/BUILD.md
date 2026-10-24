# Build

The deliverable is a single self-contained `javascript:` URL (bookmarklet).
There is no package.json, bundler, transpiler, or external dependency in this
workspace.

## Requirements

- Node.js (any version that supports `const`, `fs`, and `path`; the build script
  uses only these).
- The two source modules present:
  - `src/parser/parser.js`
  - `src/ui/ui.js`

## Build process

Run from the project root:

```sh
node src/build/build.js
```

`src/build/build.js`:

1. Resolves the project root as the parent of `src/build/`.
2. Reads `src/parser/parser.js` and `src/ui/ui.js` as UTF-8 strings.
3. Concatenates, in this order:
   - parser module,
   - UI module,
   - the call `runOCRBookmarklet();`.
4. Splits the result on line endings, trims each line, drops empty lines, and
   joins the remainder with single spaces. This produces one physical line.
5. Wraps it as:

   ```js
   javascript:(function(){try{<body>}catch(e){alert('Bookmarklet Error: '+e.message);}})();
   ```

6. Writes `src/bookmarklet.js` (with a trailing newline) and prints the
   script-body length. The message says `bytes`, but the number is JavaScript
   characters, not UTF-8 bytes: two dashes are multibyte, so the written file is
   4 bytes larger than that count plus the trailing newline (currently 16540
   bytes total).

The generated file is the only artifact to paste into a bookmark.

## Why the line rewriting exists

A bookmarklet runs from a `javascript:` URL and must be one line. The parser and
UI are maintained as readable multi-line files, so the build squashes them.
The docs require no `//` comments in the result, because the first `//` would
truncate the URL (INV-05). The current sources contain no `//` comments.

Do not add multi-line string/template literals whose meaning depends on leading
or trailing whitespace: the build trims every line. The current template
literals are single-line HTML strings.

## Verify the build

1. Check the output is a single line:

   ```sh
   wc -l src/bookmarklet.js
   ```

   It should report `1` (the file ends with one newline).

2. Syntax-check the script body. The development workflow documented in the
   migration notes was to strip the leading `javascript:` and run `node
   --check`:

   ```sh
   node -e "const s=require('fs').readFileSync('src/bookmarklet.js','utf8');require('fs').writeFileSync(process.env.HOME+'/tmp/bm-check.js',s.replace(/^javascript:/,''))" \
     && node --check "$HOME/tmp/bm-check.js"
   ```

   Termux note: `$HOME/tmp` is used because Termux has no `/tmp`.

3. Install it by creating a bookmark whose URL is the entire contents of
   `src/bookmarklet.js`, or paste the contents into the browser console on the
   admin page for a one-off run.

## Source of truth

- `src/parser/parser.js` — pure parsing functions and regexes.
- `src/ui/ui.js` — DOM, form fill, queue, storage, submit.
- `src/build/build.js` — assembler.
- `src/bookmarklet.js` — generated; do not edit by hand. Rebuild after any
  module change.

## What the build does not do

- It does not minify beyond whitespace flattening.
- It does not URL-encode. If a browser or bookmark manager requires encoding,
  encode the full generated string at install time; do not change the build
  output format.
- It does not run tests. See `docs/AGENTS.md` for the regression set and the
  fixture status.
- It does not touch the PHP or the deployed `ocr_helper.js`.
