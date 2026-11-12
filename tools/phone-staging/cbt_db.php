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

$schemaExists = $pdo->query(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'subjects'"
)->fetchColumn();

if (!$schemaExists) {
    $pdo->exec(
        'CREATE TABLE subjects (
            id INTEGER PRIMARY KEY,
            subject_name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE exam_category (
            id INTEGER PRIMARY KEY,
            category_name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE question_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            context_type TEXT NOT NULL,
            title TEXT NOT NULL,
            context_text TEXT NOT NULL,
            subject_id INTEGER NOT NULL,
            exam_category_id INTEGER NOT NULL,
            exam_year INTEGER NOT NULL,
            expected_member_count INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            activated_at TEXT,
            idempotency_token TEXT UNIQUE,
            FOREIGN KEY (subject_id) REFERENCES subjects (id),
            FOREIGN KEY (exam_category_id) REFERENCES exam_category (id)
        );
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            exam_category_id INTEGER NOT NULL,
            exam_year INTEGER NOT NULL,
            question_text TEXT NOT NULL,
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
            practice_title TEXT NOT NULL DEFAULT \'\',
            context_id INTEGER,
            context_position INTEGER,
            context_slot INTEGER,
            FOREIGN KEY (subject_id) REFERENCES subjects (id),
            FOREIGN KEY (exam_category_id) REFERENCES exam_category (id),
            FOREIGN KEY (context_id) REFERENCES question_contexts (id),
            UNIQUE (context_id, context_position),
            UNIQUE (context_id, context_slot)
        )'
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
        'INSERT INTO subjects (id, subject_name) VALUES (:id, :name)'
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
        'INSERT INTO exam_category (id, category_name) VALUES (:id, :name)'
    );
    foreach ($categories as $id => $name) {
        $insertCategory->execute([':id' => $id, ':name' => $name]);
    }

    $pdo->exec(
        "INSERT INTO question_contexts
            (id, context_type, title, context_text, subject_id, exam_category_id,
             exam_year, expected_member_count, is_active)
         VALUES
            (6, 'comprehension', 'PASSAGE I',
             'The elephant is the largest land animal. It lives in herds led by an older female.',
             14, 3, 2021, 2, 0);
         INSERT INTO questions
            (id, subject_id, exam_category_id, exam_year, question_text,
             option_a, option_b, option_c, option_d, correct_option, is_active,
             context_id, context_position)
         VALUES
            (101, 14, 3, 2021, 'An elephant herd is usually led by',
             'the oldest male', 'an older female', 'the youngest calf', 'a lone bull',
             1, 0, 6, 1)"
    );
}
