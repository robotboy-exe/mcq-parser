#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'tools/bank-slices.json');
const QUESTION_MARKER = /^\s*\d{1,3}\.\s/;
const KEY_ENTRY = /\d{1,3}\.\s*[A-F]\b/g;

function sha256(text) {
  return crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

function splitRecords(text) {
  const records = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '\r' && ch !== '\n') continue;
    let separator = ch;
    if (ch === '\r' && text[i + 1] === '\n') {
      separator = '\r\n';
      i++;
    }
    records.push({ text: text.slice(start, i - separator.length + 1), separator });
    start = i + 1;
  }
  records.push({ text: text.slice(start), separator: '' });
  return records;
}

function anchor(record) {
  return record.text.replace(/^\uFEFF/, '').trim();
}

function resolveWithinRoot(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new Error(`path escapes workspace: ${relativePath}`);
  }
  return resolved;
}

function inspectSlice(records, slice) {
  if (!Number.isInteger(slice.start) || !Number.isInteger(slice.end) ||
      !Number.isInteger(slice.answer_header)) {
    throw new Error(`bank-${slice.year}: start/end/answer_header must be integers`);
  }
  if (slice.start < 1 || slice.end < slice.start || slice.end > records.length) {
    throw new Error(`bank-${slice.year}: slice ${slice.start}-${slice.end} is outside 1-${records.length}`);
  }
  if (slice.answer_header < slice.start || slice.answer_header > slice.end) {
    throw new Error(`bank-${slice.year}: answer_header ${slice.answer_header} is outside the slice`);
  }

  const first = anchor(records[slice.start - 1]);
  const last = anchor(records[slice.end - 1]);
  if (first !== slice.first) {
    throw new Error(`bank-${slice.year}: first-line anchor mismatch: ${JSON.stringify(first)}`);
  }
  if (last !== slice.last) {
    throw new Error(`bank-${slice.year}: last-line anchor mismatch: ${JSON.stringify(last)}`);
  }

  let questions = 0;
  for (let i = slice.start - 1; i < slice.answer_header - 1; i++) {
    if (QUESTION_MARKER.test(records[i].text)) questions++;
  }
  if (questions !== slice.questions) {
    throw new Error(`bank-${slice.year}: question count ${questions}, manifest says ${slice.questions}`);
  }

  let keyEntries = 0;
  for (let i = slice.answer_header; i < slice.end; i++) {
    keyEntries += (records[i].text.match(KEY_ENTRY) || []).length;
  }
  if (keyEntries !== slice.key_entries) {
    throw new Error(`bank-${slice.year}: key entry count ${keyEntries}, manifest says ${slice.key_entries}`);
  }

  const output = records.slice(slice.start - 1, slice.end)
    .map(record => record.text + record.separator)
    .join('');

  return { first, last, questions, keyEntries, output, sha256: sha256(output) };
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function loadRecords(manifest) {
  const sourcePath = resolveWithinRoot(manifest.source);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const actual = sha256(source);
  if (actual !== manifest.source_sha256) {
    throw new Error(`source hash mismatch: ${actual}`);
  }
  return { records: splitRecords(source), sourceBytes: Buffer.byteLength(source, 'utf8') };
}

function check(manifest, records) {
  for (const slice of manifest.slices) {
    const result = inspectSlice(records, slice);
    const outputPath = resolveWithinRoot(slice.output);
    if (!fs.existsSync(outputPath)) {
      throw new Error(`bank-${slice.year}: missing output ${slice.output}`);
    }
    const actual = sha256(fs.readFileSync(outputPath, 'utf8'));
    if (!slice.sha256) {
      throw new Error(`bank-${slice.year}: manifest has no output hash`);
    }
    if (actual !== slice.sha256 || result.sha256 !== slice.sha256) {
      throw new Error(`bank-${slice.year}: output hash mismatch: ${actual}`);
    }
    console.log(`[OK] bank-${slice.year} (${result.questions} questions, ${result.keyEntries} key entries) ${actual}`);
  }
}

function write(manifest, records) {
  for (const slice of manifest.slices) {
    const result = inspectSlice(records, slice);
    const outputPath = resolveWithinRoot(slice.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(result.output, 'utf8'));
    slice.sha256 = result.sha256;
    console.log(`[WROTE] ${slice.output} (${result.questions} questions, ${result.keyEntries} key entries, ${Buffer.byteLength(result.output, 'utf8')} bytes) ${result.sha256}`);
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('usage: node tools/extract-bank.js [--check]');
  }

  const manifest = loadManifest();
  const { records, sourceBytes } = loadRecords(manifest);
  console.log(`source: ${manifest.source} (${sourceBytes} bytes, ${records.length} logical lines)`);
  if (args[0] === '--check') check(manifest, records);
  else write(manifest, records);
}

try {
  main();
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
}
