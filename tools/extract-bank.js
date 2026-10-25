#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_FILE = path.join(__dirname, 'bank-slices.json');

function fail(message) {
  console.error('extract-bank: ' + message);
  process.exit(1);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function splitRecords(text) {
  const records = [];
  const separator = /\r\n|\n|\r/g;
  let start = 0;
  let match;
  while ((match = separator.exec(text))) {
    records.push({ text: text.slice(start, match.index), separator: match[0] });
    start = match.index + match[0].length;
  }
  records.push({ text: text.slice(start), separator: '' });
  return records;
}

function sliceText(records, start, end) {
  let out = '';
  for (let i = start - 1; i < end; i++) {
    out += records[i].text + records[i].separator;
  }
  return out;
}

function countQuestionMarkers(records, start, answerHeader) {
  let count = 0;
  const marker = /^\s*\d{1,3}\.\s/;
  for (let i = start - 1; i < answerHeader - 1; i++) {
    if (marker.test(records[i].text)) count++;
  }
  return count;
}

function countKeyEntries(records, answerHeader, end) {
  let text = '';
  for (let i = answerHeader - 1; i < end; i++) text += records[i].text + '\n';
  return (text.match(/\b\d{1,3}\s*\.\s*\(?([A-F])\)?(?![A-Za-z])/g) || []).length;
}

function main() {
  const check = process.argv.includes('--check');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  const sourcePath = path.resolve(ROOT, manifest.source);
  const source = fs.readFileSync(sourcePath);
  const sourceHash = sha256(source);
  if (sourceHash !== manifest.source_sha256) {
    fail('source hash mismatch: ' + sourceHash);
  }

  const records = splitRecords(source.toString('utf8'));
  if (records.length !== manifest.line_count) {
    fail('line count mismatch: ' + records.length + ' != ' + manifest.line_count);
  }

  let writes = 0;
  for (const slice of manifest.slices) {
    const year = slice.year;
    const start = slice.start;
    const end = slice.end;
    const answerHeader = slice.answer_header;
    if (!(start >= 1 && end <= records.length && start <= end &&
          answerHeader >= start && answerHeader <= end)) {
      fail(year + ': invalid line range');
    }

    const first = records[start - 1].text.replace(/^\uFEFF/, '').trim();
    const last = records[end - 1].text.trim();
    if (first !== slice.first) {
      fail(year + ': first-line anchor mismatch: ' + JSON.stringify(first));
    }
    if (last !== slice.last) {
      fail(year + ': last-line anchor mismatch: ' + JSON.stringify(last));
    }

    const questions = countQuestionMarkers(records, start, answerHeader);
    if (questions !== slice.questions) {
      fail(year + ': question count ' + questions + ' != ' + slice.questions);
    }

    const keyEntries = countKeyEntries(records, answerHeader, end);
    if (keyEntries !== slice.key_entries) {
      fail(year + ': key entry count ' + keyEntries + ' != ' + slice.key_entries);
    }

    const output = sliceText(records, start, end);
    const outputHash = sha256(output);
    const outputFile = path.join(ROOT, 'fixtures/inputs/bank-' + year + '.txt');

    if (check) {
      if (!slice.sha256) fail(year + ': output hash missing from manifest');
      if (!fs.existsSync(outputFile)) {
        fail(year + ': output missing: ' + path.relative(ROOT, outputFile));
      }
      const existingHash = sha256(fs.readFileSync(outputFile));
      if (existingHash !== slice.sha256) {
        fail(year + ': output hash mismatch: ' + existingHash);
      }
      if (outputHash !== slice.sha256) {
        fail(year + ': extracted hash mismatch: ' + outputHash);
      }
    } else {
      fs.writeFileSync(outputFile, output);
      slice.sha256 = outputHash;
      writes++;
      console.log(year + ': wrote ' + path.relative(ROOT, outputFile) + ' sha256=' + outputHash);
    }
  }

  if (check) {
    console.log('OK: source, anchors, counts, and ' + manifest.slices.length + ' output hashes match');
  } else {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
    console.log('Updated ' + path.relative(ROOT, MANIFEST_FILE) + ' (' + writes + ' slices)');
  }
}

main();
