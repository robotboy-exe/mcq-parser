# Build

There are two tracked builds, one per bookmarklet product.

- `src/build/build.js` generates `src/bookmarklet.js`, the stimulus/image
  bookmarklet, from `src/parser/parser.js` and `src/ui/ui.js`.
- `src/bookmarklets/key/build.js` generates
  `src/bookmarklets/key/bookmarklet.js`, the key/autosave bookmarklet, from
  `src/parser/core.js`, `src/bookmarklets/key/boot.js`, and
  `src/bookmarklets/key/entry.js`.

Both outputs are single self-contained `javascript:` URLs and are committed.
The deployed manual helper (`ocr_helper.js`) is not a build product and is never
inlined into either bookmarklet. `src/bookmarklet.min.js` is not tracked; it may
exist locally from an older build and is outside the workspace contract. There is
no package.json, bundler, transpiler, or external dependency in this workspace.

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

## Key/autosave bookmarklet build

Run from the project root:

```sh
node src/bookmarklets/key/build.js
```

It applies the same line-comment stripping, line flattening, `new Function`
syntax check, and one-line wrapper as `src/build/build.js`, but concatenates
`src/parser/core.js`, then `src/bookmarklets/key/boot.js`, then
`src/bookmarklets/key/entry.js`, and writes
`src/bookmarklets/key/bookmarklet.js`. It refuses output containing a
percent-escape (`%` followed by two hex digits), which a bookmark manager may
decode. It is deterministic: rebuilding an unchanged source tree reproduces the
same bytes.

`src/bookmarklets/key/boot.js` runs first and removes the deployed page
helper's panel and error banner so the injected panel owns every element id.
`src/bookmarklets/key/entry.js` owns the key load, answer fill, dry run,
autosave, Stop settlement, and in-place save. The entry replaces its submit
listener on a second click, so clicking the bookmarklet twice does not stack
handlers.

The generated artifact is never deployed as a page asset; only its contents are
installed as a bookmark. Do not edit it by hand.

Verify:

```sh
wc -l src/bookmarklets/key/bookmarklet.js
node tests/key-bookmarklet.js
```

The first must print `1`; the second runs the real generated artifact.

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
- `src/bookmarklet.js` — generated stimulus build; do not edit by hand.
- `src/parser/core.js` — canonical parser inlined into the key bookmarklet.
- `src/bookmarklets/key/boot.js` — panel handover for the key bookmarklet.
- `src/bookmarklets/key/entry.js` — key/autosave panel source.
- `src/bookmarklets/key/build.js` — key bookmarklet assembler.
- `src/bookmarklets/key/bookmarklet.js` — generated key build; do not edit by
  hand.
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
