#!/usr/bin/env node
'use strict';

// Static OT05 acceptance probes. These checks do not run MySQL or PHP; they
// verify the archived DDL, the working schema, the migration/rollback guards,
// the side-effect-free helper, and the admin contract. Runtime execution is
// OT10 evidence.

const crypto = require('crypto');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const passes = [];

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function sha256(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function git(args) {
  return childProcess.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function test(name, fn) {
  try {
    fn();
    passes.push(name);
    console.log('[PASS] ' + name);
  } catch (error) {
    failures.push(name);
    console.log('[FAIL] ' + name + ' - ' + error.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertContains(haystack, needle, message) {
  assert(haystack.indexOf(needle) > -1, message + ' (missing ' + JSON.stringify(needle) + ')');
}

function assertNotContains(haystack, needle, message) {
  assert(haystack.indexOf(needle) === -1, message + ' (found ' + JSON.stringify(needle) + ')');
}

const manifest = JSON.parse(read('archive/sql/2026-11-03-supplied/manifest.json'));
const archiveDir = 'archive/sql/2026-11-03-supplied/';
const baseSchema = read('deployed/sql/base-schema.working.sql');
const migration = read('deployed/sql/01-context-migration.sql');
const rollback = read('deployed/sql/02-context-rollback.sql');
const runbook = read('deployed/sql/README.md');
const contextLib = read('deployed/context_lib.php');
const admin = read('deployed/admin_questions.php');
const adminContext = read('deployed/admin_context.php');
const preflight = read('tools/context-migration-preflight.php');
const preflightContract = read('tools/context-migration-contract.php');
const preflightInspector = read('tools/context-migration-inspector.php');
const cbt = read('deployed/cbt.php');
const practice = read('deployed/cbt_practice.php');
const candidate = read('deployed/cbt_candidate.php');

test('supplied DDL is archived byte-for-byte with recorded hashes', () => {
  const names = ['questions.sql', 'subjects.sql', 'exam_category.sql'];
  names.forEach((name) => {
    const entry = manifest.files[name];
    assert(entry, name + ' is missing from the manifest');
    const archivePath = archiveDir + name;
    assertEqual(sha256(archivePath), entry.sha256, name + ' archive hash');
    assertEqual(sha256(name), entry.sha256, name + ' root hash');
    assertEqual(fs.statSync(path.join(ROOT, archivePath)).size, entry.bytes, name + ' archive size');
    assertEqual(
      fs.readFileSync(path.join(ROOT, archivePath)).toString('hex'),
      fs.readFileSync(path.join(ROOT, name)).toString('hex'),
      name + ' archive equals root bytes'
    );
  });
  assertEqual(manifest.database_version, 'MySQL 8.0.41', 'database version');
  assertEqual(manifest.application_target, 'PHP 8.3', 'PHP target');
  assertEqual(manifest.storage_engine, 'InnoDB', 'engine');
  assertEqual(manifest.charset, 'utf8mb4', 'charset');
  assertEqual(manifest.collation, 'utf8mb4_unicode_ci', 'collation');
});

test('Git preserves every supplied DDL repository blob byte-for-byte', () => {
  const names = ['questions.sql', 'subjects.sql', 'exam_category.sql'];
  const paths = names.concat(names.map((name) => archiveDir + name));
  const attributes = git(['check-attr', 'text', 'diff', 'merge', '--'].concat(paths));
  paths.forEach((relative) => {
    assertContains(attributes, relative + ': text: unset', relative + ' text normalization');
    assertContains(attributes, relative + ': diff: unset', relative + ' textual diff');
    assertContains(attributes, relative + ': merge: unset', relative + ' textual merge');
    const rawBlob = git(['hash-object', '--no-filters', '--', relative]);
    const repositoryBlob = git(['hash-object', '--path=' + relative, '--', relative]);
    assertEqual(repositoryBlob, rawBlob, relative + ' repository blob');
  });
  names.forEach((name) => {
    assertEqual(
      git(['hash-object', '--path=' + name, '--', name]),
      git(['hash-object', '--path=' + archiveDir + name, '--', archiveDir + name]),
      name + ' root and archive repository blobs'
    );
  });
});

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function liveAdditions(archive, live) {
  const result = childProcess.spawnSync(
    'git',
    ['diff', '--no-index', '--numstat', archive, live],
    { cwd: ROOT, encoding: 'utf8' }
  );
  assert(result.status === 0 || result.status === 1, 'git diff failed for ' + live);
  const output = (result.stdout || '').trim();
  return output === '' ? 0 : Number(output.split(/\s+/)[0]);
}

test('working base schema renames exam_category2 and keeps the supplied types', () => {
  assertNotContains(baseSchema, 'exam_category2', 'working schema must not use exam_category2');
  assertContains(baseSchema, 'CREATE TABLE `subjects`', 'subjects table');
  assertContains(baseSchema, 'CREATE TABLE `exam_category`', 'exam_category table');
  assertContains(baseSchema, 'CREATE TABLE `questions`', 'questions table');
  assertContains(baseSchema, '`practice_title` varchar(200)', 'practice_title type');
  assertContains(baseSchema, '`correct_option` tinyint UNSIGNED NOT NULL', 'correct_option type');
  assertContains(baseSchema, 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci', 'engine/collation');
  assertContains(baseSchema, 'SET NAMES utf8mb4;', 'connection charset');
});

test('forward migration is rerunnable and adds the restricted context schema', () => {
  assertNotContains(migration, 'exam_category2', 'migration must use the corrected name');
  assertContains(migration, 'CREATE TABLE IF NOT EXISTS `question_contexts`', 'context table');
  assertContains(migration, '`context_id` int UNSIGNED NULL', 'context_id column');
  assertContains(migration, '`context_position` smallint UNSIGNED NULL', 'context_position column');
  assertContains(migration, '`context_slot` smallint UNSIGNED NULL', 'context_slot column');
  assertContains(migration, 'uq_questions_context_position', 'position uniqueness');
  assertContains(migration, 'uq_questions_context_slot', 'slot uniqueness');
  assertContains(migration, 'fk_questions_context', 'member foreign key');
  assertContains(migration, 'ON DELETE RESTRICT', 'restrictive deletion');
  assertContains(migration, 'information_schema.columns', 'column rerun guard');
  assertContains(migration, 'information_schema.statistics', 'index rerun guard');
  assertContains(migration, 'information_schema.table_constraints', 'foreign-key rerun guard');
  assertContains(migration, 'CALL `cbt_apply_context_migration`()', 'migration call');
  assertContains(migration, 'DROP PROCEDURE IF EXISTS `cbt_apply_context_migration`', 'migration cleanup');
  assertContains(migration, '`is_active` tinyint(1) NOT NULL DEFAULT \'0\'', 'contexts start inactive');
});

test('rollback refuses to destroy populated context data', () => {
  assertContains(rollback, 'SIGNAL SQLSTATE \'45000\'', 'rollback guard signal');
  assertContains(rollback, 'context data exists', 'rollback refusal message');
  assertContains(rollback, 'DROP TABLE IF EXISTS `question_contexts`', 'context table removal');
  assertNotContains(rollback, 'DROP TABLE `questions`', 'questions must not be dropped');
  assertNotContains(rollback, 'DROP DATABASE', 'database must not be dropped');
  assertNotContains(rollback, 'TRUNCATE', 'rollback must not truncate');
  assertNotContains(rollback, 'DELETE FROM', 'rollback must not delete rows');
  assertContains(rollback, '`context_id` IS NOT NULL', 'context id data guard');
  assertContains(rollback, '`context_position` IS NOT NULL', 'context position data guard');
  assertContains(rollback, '`context_slot` IS NOT NULL', 'context slot data guard');
  assertContains(rollback, 'LOCK TABLES `questions` WRITE, `question_contexts` WRITE', 'exclusive rollback locks');
  assertContains(rollback, 'LOCK TABLES `question_contexts` WRITE', 'post-ALTER context lock');
  assertContains(runbook, 'maintenance/write freeze', 'mandatory rollback write freeze');
  assertContains(runbook, 'releases the first explicit table locks', 'documented ALTER lock boundary');
  assertOrdered(rollback, [
    'LOCK TABLES `questions` WRITE, `question_contexts` WRITE',
    'CALL `cbt_remove_question_context_columns`()',
    'LOCK TABLES `question_contexts` WRITE',
    'CALL `cbt_drop_empty_context_table`()',
    'UNLOCK TABLES',
  ], 'rollback lock phases');
  assertLockCoversCall(
    rollback,
    'LOCK TABLES `questions` WRITE, `question_contexts` WRITE',
    'CALL `cbt_remove_question_context_columns`()',
    'question teardown lock'
  );
  assertLockCoversCall(
    rollback,
    'LOCK TABLES `question_contexts` WRITE',
    'CALL `cbt_drop_empty_context_table`()',
    'context drop lock'
  );
});

test('shared context helper is side-effect-free and exposes validation/query functions', () => {
  ['new PDO', 'session_start', 'header(', 'echo ', 'print ', '$_POST', '$_GET']
    .forEach((term) => assertNotContains(contextLib, term, 'helper must not contain ' + term));
  assertNotContains(contextLib, "require_once __DIR__ . '/context_input_validation.php';", 'input validation is consolidated');
  assertNotContains(contextLib, "require_once __DIR__ . '/context_activation_validation.php';", 'activation validation is consolidated');
  [
    'cbt_context_validate_activation',
    'cbt_context_question_link_errors',
    'cbt_context_input_errors',
    'cbt_context_fetch',
    'cbt_context_members',
    'cbt_context_list',
    'cbt_context_member_count',
    'cbt_context_slot_tokens',
    'cbt_context_status_label',
  ].forEach((fn) => assertContains(contextLib, 'function ' + fn + '(', 'helper function ' + fn));
});

test('admin adds CSRF/PRG context actions without changing the question contract', () => {
  const shared = read('deployed/admin_shared.php');
  assertContains(admin, 'function cbt_standalone_save_question(', 'standalone page inlines its save path');
  assert(!admin.includes("admin_context.php"), 'standalone page does not include the context library');
  assertContains(shared, "require_once __DIR__ . '/admin_context.php';", 'shared page includes the context library');
  assertContains(shared, 'SELECT COUNT(*) FROM questions WHERE context_id IS NOT NULL',
    'shared page counts every grouped question');
  assertContains(shared, 'ORDER BY q.id DESC LIMIT %d OFFSET %d',
    'recent shared questions are newest first');
  assertContains(shared, 'shared_page=', 'recent shared questions paginate');
  assertContains(shared, 'id="owner_shared_paste"', 'shared page renders the paste panel');
  assert(shared.indexOf('src/owner-tool/shared-texts.js') > -1
    && shared.indexOf('src/owner-tool/shared-texts.js') < shared.indexOf('src/owner-tool/shared-paste.js'),
    'shared page loads the context module before its paste client');
  ['save_context', 'update_context', 'activate_context', 'deactivate_context', 'delete_context']
    .forEach((action) => assertContains(adminContext, '\'' + action + '\'', 'action ' + action));
  assertContains(shared, 'cbt_admin_handle_context_request(', 'context dispatch hook');
  assertContains(adminContext, "header('Location: ' . $scriptName);", 'context PRG redirect');
  assertContains(admin, 'valid_csrf()', 'CSRF check');
  assertContains(adminContext, 'name="context_id"', 'question link field');
  assertContains(adminContext, 'name="context_position"', 'position field');
  assertContains(adminContext, 'name="context_slot"', 'slot field');
  assertContains(adminContext, 'name="context_type"', 'context type field');
  assertContains(adminContext, 'name="expected_member_count"', 'expected count field');
  assertContains(adminContext, "'is_active' => !$parsed['errors'] && $context === null", 'linked questions are forced inactive');
  assertContains(shared, 'cbt_admin_mutate_question(', 'question mutation hook');
  assertContains(shared, 'cbt_admin_delete_question(', 'question delete hook');
  assertContains(adminContext, 'cbt_admin_deactivate_contexts(', 'member mutation deactivates contexts');
  assertContains(admin, "cbt_strip_formatting((string) $item['question_text'])", 'question list renderer preserved');
  assertContains(admin, 'required><?php echo "\\n" . h($formValues[\'question_text\']); ?></textarea>', 'question textarea preserved');
  assertContains(admin, "'Question saved successfully (Question ID: '", 'save flash preserved');
  assertContains(admin, "'Question #' . $editingQuestionId . ' updated successfully.'", 'update flash preserved');
  assertContains(admin, "'Question #' . (int) $questionId . ' was deleted successfully.'", 'delete flash preserved');
});

test('admin entry point keeps only narrow context hooks', () => {
  [
    'Admin context insert/update failed:',
    'Admin context activation failed:',
    'Admin context deactivation failed:',
    'Admin context delete failed:',
    '<h2>Shared Contexts</h2>',
    '<label for="context_type">Context Type</label>',
    '<label for="context_id">Shared Context (optional)</label>',
  ].forEach((term) => assertNotContains(admin, term, 'entry point must externalize ' + term));
  assertContains(adminContext, 'Admin context activation failed:', 'action failure handling externalized');
  assertContains(adminContext, 'cbt_admin_context_page_data', 'context page data externalized');
  assertContains(adminContext, 'cbt_admin_load_context_page', 'context page loading externalized');

  const additions = liveAdditions('archive/live-sources/admin_questions-2026-10-31.php', 'deployed/admin_questions.php');
  assert(Number.isFinite(additions), 'admin diff additions must be numeric');
  // D-82: the owner approved 129 additions over the cap for inlining the
  // context-free save path into this one live-origin file.
  const approvedAdminAdditions = 229;
  assertContains(read('docs/DECISIONS.md'), 'D-82', 'the approval is recorded');
  assert(additions <= approvedAdminAdditions,
    'admin entry point has ' + additions + ' additions; approved limit is ' + approvedAdminAdditions);
});

test('production handoff uses the consolidated file manifest', () => {
  const production = [
    'deployed/admin_questions.php',
    'deployed/cbt.php',
    'deployed/answer_details.php',
    'deployed/render.php',
    'deployed/context_lib.php',
    'deployed/admin_context.php',
    'deployed/cbt_candidate.php',
    'deployed/sql/01-context-migration.sql',
    'src/parser/core.js',
    'src/owner-tool/render.js',
    'src/owner-tool/owner-tool.js',
    'src/owner-tool/owner-tool.css',
  ];
  const ops = [
    'deployed/sql/README.md',
    'deployed/sql/02-context-rollback.sql',
  ];
  production.concat(ops).forEach((relative) => {
    assert(fs.existsSync(path.join(ROOT, relative)), relative + ' is part of the handoff');
  });
  [
    'deployed/context_input_validation.php',
    'deployed/context_activation_validation.php',
    'deployed/admin_context_actions.php',
    'deployed/admin_context_data.php',
    'deployed/admin_context_management.php',
    'deployed/admin_question_context_fields.php',
    'deployed/admin_question_mutations.php',
    'deployed/cbt_candidate_selection.php',
    'deployed/cbt_candidate_repository.php',
    'src/parser/comprehension.js',
    'src/parser/cloze.js',
    'src/cbt/context-render.js',
    'src/owner-tool/state.js',
    'src/owner-tool/contexts.js',
    'src/owner-tool/context-form.js',
    'src/owner-tool/context-card.js',
    'src/owner-tool/context-panel.js',
    'src/owner-tool/controller.js',
    'src/owner-tool/style.css',
    'src/owner-tool/context-workflow.css',
    'src/cbt/context.css',
  ].forEach((relative) => {
    assert(!fs.existsSync(path.join(ROOT, relative)), relative + ' is consolidated away');
  });
  [
    'deployed/sql/base-schema.working.sql',
    'tools/context-migration-preflight.php',
    'tools/context-migration-contract.php',
    'tools/context-migration-inspector.php',
  ].forEach((relative) => {
    assert(fs.existsSync(path.join(ROOT, relative)), relative + ' stays repo-only');
  });
});

test('live-origin files stay within 100 cumulative additions', () => {
  [
    ['archive/live-sources/admin_questions-2026-10-31.php', 'deployed/admin_questions.php'],
    ['archive/live-sources/cbt-2026-10-31.php', 'deployed/cbt.php'],
    ['archive/live-sources/cbt_practice-2026-10-31.php', 'deployed/cbt_practice.php'],
    ['archive/live-sources/answer_details-2026-11-02.php', 'deployed/answer_details.php'],
  ].forEach(([archive, live]) => {
    const additions = liveAdditions(archive, live);
    // D-82 approves one exception: deploying/admin_questions.php may reach 229.
    const limit = live === 'deployed/admin_questions.php' ? 229 : 100;
    assert(additions <= limit, live + ' has ' + additions + ' additions; limit is ' + limit);
  });
});

function assertOrdered(source, terms, label) {
  let offset = -1;
  terms.forEach((term) => {
    const next = source.indexOf(term, offset + 1);
    assert(next > offset, label + ' order is missing ' + JSON.stringify(term));
    offset = next;
  });
}

function assertLockCoversCall(source, lock, call, label) {
  const lockOffset = source.indexOf(lock);
  const callOffset = source.indexOf(call, lockOffset + lock.length);
  assert(lockOffset > -1 && callOffset > lockOffset, label + ' order');
  assertNotContains(source.slice(lockOffset + lock.length, callOffset), 'UNLOCK TABLES', label);
}

test('question mutation module locks and deactivates inside its transactions', () => {
  assertOrdered(adminContext, [
    '$pdo->beginTransaction();',
    'cbt_admin_lock_contexts(',
    'FOR UPDATE',
    "'DELETE FROM questions WHERE id = :id'",
    'cbt_admin_deactivate_contexts(',
    '$pdo->commit();',
  ], 'question mutation transaction');
  assertContains(adminContext, '$pdo->rollBack();', 'question mutation rollback');
  assertContains(adminContext, 'cbt_context_fetch($pdo, $editingContextId, true)', 'context update row lock');
  assertContains(adminContext, 'cbt_context_members($pdo, $editingContextId, true)', 'context update member locks');
});

test('candidate delivery remains active-only after OT06 delegation', () => {
  assertContains(cbt, 'cbt_candidate_delivery(', 'CBT delegates context-aware delivery');
  assertNotContains(cbt, 'ORDER BY RAND()', 'CBT no longer randomizes raw question rows');
  assertContains(candidate, 'WHERE is_active = 1', 'candidate filter');
  assertContains(practice, 'WHERE is_active = 1', 'practice candidate filter');
  assertNotContains(practice, 'context_id', 'practice delivery is not changed in OT05');
});

test('preflight reports real session and table facts without prompting', () => {
  assertContains(preflightInspector, '@@session.sql_mode', 'SQL mode report');
  assertContains(preflightInspector, '@@character_set_connection', 'connection charset report');
  assertContains(preflightInspector, '@@collation_connection', 'connection collation report');
  assertContains(preflightInspector, 'SHOW CREATE TABLE', 'table definitions');
  assertContains(preflight, 'practice_title', 'practice_title mismatch report');
  assertContains(preflightInspector, 'information_schema', 'schema inspection queries');
  assertContains(preflightInspector, 'CHECK_CONSTRAINTS', 'check constraint inspection');
  assertContains(preflightInspector, 'SUB_PART, COLLATION, INDEX_TYPE', 'index direction inspection');
  assertContains(preflightContract, 'REFERENTIAL_CONSTRAINTS', 'foreign key contract');
  assertContains(preflightContract, "'COLLATION'", 'index direction contract');
  assertContains(preflightContract, 'ON DELETE', 'delete rule validation');
  assertContains(preflightContract, 'NON_UNIQUE', 'index uniqueness validation');
  assertContains(preflightContract, 'COLUMN_TYPE', 'column type validation');
  assertNotContains(preflight, 'fgets(STDIN)', 'no interactive credential prompt');
  assertNotContains(preflight, 'readline(', 'no interactive credential prompt');
  assertContains(preflight, 'register_shutdown_function', 'connector failure exit guard');
  assertContains(runbook, 'PREFLIGHT OK', 'runbook preflight gate');
});

test('migration rejects incompatible existing objects before guarded skips', () => {
  assertContains(migration, 'cbt_assert_context_migration_compatible', 'compatibility assertion procedure');
  assertContains(migration, 'COLUMN_TYPE', 'existing column definition checks');
  assertContains(migration, 'NON_UNIQUE', 'existing index definition checks');
  assertContains(migration, 'IS_VISIBLE', 'existing index visibility checks');
  assertEqual((migration.match(/COLLATION = 'A'/g) || []).length, 4, 'ascending index predicates');
  assertContains(migration, "CONSTRAINT_TYPE = 'CHECK'", 'unexpected check constraint guard');
  assertContains(migration, 'DELETE_RULE', 'existing foreign key action checks');
  assertContains(migration, 'unexpected column set or definition', 'exact context column set checks');
  assertContains(migration, 'unexpected index set or definition', 'exact context index set checks');
  assertContains(migration, 'unexpected foreign key set or definition', 'exact context foreign key set checks');
  assertOrdered(migration, [
    'CALL `cbt_assert_context_migration_compatible`()',
    'CREATE TABLE IF NOT EXISTS `question_contexts`',
    'CALL `cbt_apply_context_migration`()',
  ], 'compatibility checks precede mutation');
});

console.log('\nSummary');
console.log('  PASS: ' + passes.length);
console.log('  FAIL: ' + failures.length);
process.exit(failures.length === 0 ? 0 : 1);
