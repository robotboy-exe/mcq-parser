<?php
declare(strict_types=1);

final class PhoneStagingPdo extends PDO
{
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $query = preg_replace('/\s+FOR UPDATE\b/i', '', $query) ?? $query;
        return parent::prepare($query, $options);
    }
}

$databasePath = getenv('OCR_PHONE_STAGING_DB') ?: getenv('HOME') . '/tmp/ocr-phone-staging.sqlite';
$pdo = new PhoneStagingPdo('sqlite:' . $databasePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('PRAGMA foreign_keys = ON');

$schemaExists = (bool) $pdo->query(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'subjects'"
)->fetchColumn();

$hasConstantText = false;
if ($schemaExists) {
    $hasQuestions = (bool) $pdo->query(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'questions'"
    )->fetchColumn();
    if ($hasQuestions) {
        foreach ($pdo->query('PRAGMA table_info(questions)')->fetchAll() as $column) {
            if (($column['name'] ?? '') === 'constant_text') {
                $hasConstantText = true;
                break;
            }
        }
    }
}

// The staging database is disposable. Replace a pre-ST01 schema instead of
// trying to keep its context tables or columns.
if ($schemaExists && !$hasConstantText) {
    $pdo->exec('DROP TABLE IF EXISTS questions; DROP TABLE IF EXISTS question_contexts;');
    $schemaExists = false;
}

if (!$schemaExists) {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY,
            subject_name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS exam_category (
            id INTEGER PRIMARY KEY,
            category_name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            exam_category_id INTEGER NOT NULL,
            exam_year INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            constant_text TEXT,
            question_image_path TEXT,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option INTEGER NOT NULL,
            answer_explanation TEXT,
            answer_video_path TEXT,
            is_active INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            practice_title TEXT NOT NULL DEFAULT '',
            FOREIGN KEY (subject_id) REFERENCES subjects (id),
            FOREIGN KEY (exam_category_id) REFERENCES exam_category (id)
        )"
    );

    $subjects = [
        1 => 'Mathematics', 3 => 'Chemistry', 4 => 'Biology', 5 => 'Physics',
        6 => 'English Language', 7 => 'Economics', 8 => 'Geography',
        9 => 'Government', 10 => 'Commerce', 11 => 'Agricultural Science',
        12 => 'English (Oral)', 13 => 'Literature in English', 14 => 'CRS',
        15 => 'Further maths', 16 => 'Accounting', 18 => 'Civil education',
        19 => 'Marketing',
    ];
    $insertSubject = $pdo->prepare(
        'INSERT OR IGNORE INTO subjects (id, subject_name) VALUES (:id, :name)'
    );
    foreach ($subjects as $id => $name) {
        $insertSubject->execute([':id' => $id, ':name' => $name]);
    }

    $categories = [
        1 => 'General Practice',
        3 => 'JAMB / UTME',
        4 => 'WASCE / NECO / GCE',
        5 => 'POST UTME',
    ];
    $insertCategory = $pdo->prepare(
        'INSERT OR IGNORE INTO exam_category (id, category_name) VALUES (:id, :name)'
    );
    foreach ($categories as $id => $name) {
        $insertCategory->execute([':id' => $id, ':name' => $name]);
    }

    $pdo->exec(
        "INSERT OR REPLACE INTO questions
            (id, subject_id, exam_category_id, exam_year, question_text, constant_text,
             option_a, option_b, option_c, option_d, correct_option, is_active)
         VALUES
            (101, 14, 3, 2021, 'An elephant herd is usually led by',
             'The elephant is the largest land animal. It lives in herds led by an older female.',
             'the oldest male', 'an older female', 'the youngest calf', 'a lone bull',
             1, 1)"
    );
}
