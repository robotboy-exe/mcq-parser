# Build

The mobile deliverable is `src/bookmarklet.min.js`, a single self-contained
`javascript:` URL (bookmarklet). `src/bookmarklet.js` is the same build without
minification, kept as the readable reference copy. There is no package.json,
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

By default this writes only `src/bookmarklet.js`. Add `--min` only when the user
explicitly requests the standalone minified mobile build:

```sh
node src/build/build.js --min
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
6. With `--min`, minifies that line without renaming anything: it tokenizes
   strings, template literals, regex literals, identifiers, numbers, and
   punctuators, drops comments, and removes whitespace unless two adjacent
   tokens would otherwise merge. Literal contents are preserved byte-for-byte.
7. Syntax-checks the body (and the minified body when requested) with
   `new Function(body)` before wrapping.
8. Wraps it as:

   ```js
   javascript:(function(){try{<body>}catch(e){alert('Bookmarklet Error: '+e.message);}})();
   ```

9. Refuses to write if the result contains `%`.
10. With `--min`, refuses to write if the minified result is larger than 65536
    UTF-8 bytes, the practical mobile bookmarklet limit (Firefox stops at 65536;
    Safari accepts the bookmark but does nothing above it).
11. Writes `src/bookmarklet.js`, and with `--min` also
    `src/bookmarklet.min.js`, each with a trailing newline, and prints their
    lengths in characters and UTF-8 bytes:
    - `src/bookmarklet.js` — unminified, 63608 characters and 63621 bytes.
    - `src/bookmarklet.min.js` — minified standalone, 56823 characters and
      56836 bytes (only with `--min`).

For mobile, paste `src/bookmarklet.min.js`. The seven non-ASCII characters in
each file (two `—`, two `…`, one `–`, two `·`) add 12 bytes over the character
count.

## Why the line rewriting exists

A bookmarklet runs from a `javascript:` URL and must be one line. The parser and
UI are maintained as readable multi-line files, so the build squashes them.
Full-line `//` comments are allowed in the sources and stripped before
flattening; an inline `//` would still truncate the URL (INV-05). The build also
fails if the finished bookmarklet contains `%`, which a bookmark manager may
decode.

Minification exists because mobile browsers cap bookmarklet URLs. The
whitespace-only pass cuts the standalone minified build from about 63 KB to
about 56 KB, leaving headroom under the 65536-byte limit without renaming
functions or rewriting literals. It does not touch the source modules, so the
test harness still exercises the readable parser. The unminified
`src/bookmarklet.js` is written from the same body for reference.

The paste box no longer sets `width:100%` inline; the admin page CSS already
sets it for `.admin-field textarea`.

Do not add multi-line string/template literals whose meaning depends on leading
or trailing whitespace: the build trims every line. The current template
literals are single-line HTML strings.

## Verify the build

1. Check the default output is a single line:

   ```sh
   wc -l src/bookmarklet.js
   ```

   It should report `1` (the file ends with one newline).

2. Syntax-check the script body. The development workflow documented in the
   migration notes was to strip the leading `javascript:` and run `node
   --check`:

   ```sh
   node -e "const fs=require('fs');const f='src/bookmarklet.js';fs.writeFileSync(process.env.HOME+'/tmp/bookmarklet.js.check.js',fs.readFileSync(f,'utf8').replace(/^javascript:/,''))" \
     && node --check "$HOME/tmp/bookmarklet.js.check.js"
   ```

   Termux note: `$HOME/tmp` is used because Termux has no `/tmp`.

3. Only when `--min` was requested, repeat steps 1-2 for
   `src/bookmarklet.min.js` and check its UTF-8 size against the mobile limit:

   ```sh
   node -e "const s=require('fs').readFileSync('src/bookmarklet.min.js','utf8').trim(); console.log(Buffer.byteLength(s,'utf8'))"
   ```

   It should print a number at or below 65536. The build refuses to write the
   minified file if it is larger.

4. Install the mobile bookmarklet by creating a bookmark whose URL is the
   entire contents of `src/bookmarklet.min.js`, or paste the contents into the
   browser console on the admin page for a one-off run. Use
   `src/bookmarklet.js` only when you need the unminified reference.

## Source of truth

- `src/parser/parser.js` — pure parsing functions and regexes.
- `src/ui/ui.js` — DOM, form fill, queue, storage, submit.
- `src/build/build.js` — assembler and minifier.
- `src/bookmarklet.js` — generated unminified build; do not edit by hand.
- `src/bookmarklet.min.js` — generated standalone minified build; do not edit
  by hand. Rebuild only on explicit request (`node src/build/build.js --min`).

## What the build does not do

- It does not rename identifiers or rewrite expressions. Minification is
  comments and whitespace only, and it applies to `src/bookmarklet.min.js`.
  `src/bookmarklet.js` gets the line flattening but not the token pass.
- Its regex/division detection assumes a regex literal never appears directly
  after `)` or `}`. Those are the ambiguous cases; the current sources do not
  use them. If that changes, extend the minifier or keep the regex on the next
  line with an operator before it.
- It does not URL-encode. If a browser or bookmark manager requires encoding,
  encode the full generated string at install time; do not change the build
  output format.
- It does not run tests. See `docs/AGENTS.md` for the regression set and the
  fixture status.
- It does not touch the PHP or the deployed `ocr_helper.js`.
