# Build

The tracked build output is `src/bookmarklet.js`, a single self-contained
`javascript:` URL (bookmarklet). It is generated from the two modules and
committed. `src/bookmarklet.min.js` is not tracked; it may exist locally from an
older build and is outside the workspace contract. There is no package.json,
bundler, transpiler, or external dependency in this workspace.

## Requirements

- Node.js (any version that supports `const`, `let`, `Set`, `Buffer`, and
  `new Function`; a current LTS release is fine).
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
3. Drops full-line `//` comments from each module (lines whose first
   non-whitespace characters are `//`).
4. Concatenates, in this order:
   - parser module,
   - UI module,
   - the call `runOCRBookmarklet();`.
5. Splits the result on line endings, trims each line, drops empty lines, and
   joins the remainder with single spaces. This produces one physical line.
6. Syntax-checks the body with `new Function(body)` before wrapping.
7. Wraps it as:

   ```js
   javascript:(function(){try{<body>}catch(e){alert('Bookmarklet Error: '+e.message);}})();
   ```

8. Refuses to write if the result contains `%`.
9. Writes `src/bookmarklet.js` with a trailing newline and prints its character
   and UTF-8 byte counts.

The script still accepts `--min` for local experiments, but the minified output
is untracked and is not part of the workspace contract. Do not use it for
releases, do not commit it, and do not rely on an existing local copy. The
current sources exceed the script's 65536-byte mobile guard when minified.

## Why the line rewriting exists

A bookmarklet runs from a `javascript:` URL and must be one line. The parser and
UI are maintained as readable multi-line files, so the build squashes them.
Full-line `//` comments are allowed in the sources and stripped before
flattening; an inline `//` would still truncate the URL (INV-05). The build also
fails if the finished bookmarklet contains `%`, which a bookmark manager may
decode.

Do not add multi-line string/template literals whose meaning depends on leading
or trailing whitespace: the build trims every line. The current template
literals are single-line HTML strings.

The paste box no longer sets `width:100%` inline; the admin page CSS already
sets it for `.admin-field textarea`.

## Verify the build

1. Check the output is a single line:

   ```sh
   wc -l src/bookmarklet.js
   ```

   It should report `1` (the file ends with one newline).

2. Syntax-check the script body. Strip the leading `javascript:` and run
   `node --check` on the remainder:

   ```sh
   node -e "const fs=require('fs');const f='src/bookmarklet.js';fs.writeFileSync(process.env.HOME+'/tmp/bookmarklet.js.check.js',fs.readFileSync(f,'utf8').replace(/^javascript:/,''))" \
     && node --check "$HOME/tmp/bookmarklet.js.check.js"
   ```

   Termux note: `$HOME/tmp` is used because Termux has no `/tmp`.

3. Install the bookmarklet by creating a bookmark whose URL is the entire
   contents of `src/bookmarklet.js`. The unminified build may exceed mobile
   browser limits; no tracked minified artifact is provided.

## Source of truth

- `src/parser/parser.js` — pure parsing functions and regexes.
- `src/ui/ui.js` — DOM, form fill, queue, storage, submit.
- `src/build/build.js` — assembler and legacy local minifier.
- `src/bookmarklet.js` — generated build; do not edit by hand.
- `src/bookmarklet.min.js` — untracked local artifact; do not edit, rely on, or
  rebuild it.

## What the build does not do

- It does not rename identifiers or rewrite expressions in the tracked build.
  The legacy `--min` path only drops comments and whitespace.
- The legacy minifier's regex/division detection assumes a regex literal never
  appears directly after `)` or `}`. Those are the ambiguous cases; the current
  sources do not use them. If that changes, extend the minifier or keep the
  regex on the next line with an operator before it.
- It does not URL-encode. If a browser or bookmark manager requires encoding,
  encode the full generated string at install time; do not change the build
  output format.
- It does not run tests. See `docs/AGENTS.md` for the regression set and the
  fixture status.
- It does not touch the PHP or the deployed `ocr_helper.js`.
