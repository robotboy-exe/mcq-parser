<?php
declare(strict_types=1);

session_start();

if (empty($_SESSION['cbt_admin_csrf'])) {
    $_SESSION['cbt_admin_csrf'] = bin2hex(random_bytes(32));
}

function h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function valid_csrf(): bool
{
    return isset($_POST['csrf_token'], $_SESSION['cbt_admin_csrf'])
        && is_string($_POST['csrf_token'])
        && hash_equals($_SESSION['cbt_admin_csrf'], $_POST['csrf_token']);
}

function short_text(string $text, int $width = 140): string
{
    if (function_exists('mb_strimwidth')) {
        return mb_strimwidth($text, 0, $width, '…', 'UTF-8');
    }
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? $text);
    return strlen($text) > $width ? substr($text, 0, $width - 3) . '...' : $text;
}

/** Save either an answer illustration video or picture. */
function save_answer_illustration_upload(array $file): string
{
    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($error === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('No answer illustration was selected.');
    }

    if ($error !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'The illustration exceeds the server upload limit.',
            UPLOAD_ERR_FORM_SIZE => 'The illustration exceeds the permitted upload size.',
            UPLOAD_ERR_PARTIAL => 'The upload was incomplete. Please try again.',
            UPLOAD_ERR_NO_TMP_DIR => 'The server is missing its temporary upload folder.',
            UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded file.',
            UPLOAD_ERR_EXTENSION => 'A server extension stopped the upload.',
        ];
        throw new RuntimeException($messages[$error] ?? 'The illustration upload failed.');
    }

    if (
        !isset($file['tmp_name'], $file['size'], $file['name'])
        || !is_uploaded_file((string) $file['tmp_name'])
    ) {
        throw new RuntimeException('The uploaded illustration could not be verified.');
    }

    $extension = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));

    $videoMimes = [
        'mp4'  => ['video/mp4'],
        'webm' => ['video/webm'],
        'ogv'  => ['video/ogg', 'application/ogg', 'video/x-theora+ogg'],
        'ogg'  => ['video/ogg', 'application/ogg', 'video/x-theora+ogg'],
    ];

    $imageMimes = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'webp' => ['image/webp'],
        'gif'  => ['image/gif'],
    ];

    if (isset($videoMimes[$extension])) {
        $allowedMimes = $videoMimes[$extension];
        $maxBytes = 50 * 1024 * 1024;
        $mediaType = 'video';
    } elseif (isset($imageMimes[$extension])) {
        $allowedMimes = $imageMimes[$extension];
        $maxBytes = 8 * 1024 * 1024;
        $mediaType = 'image';
    } else {
        throw new RuntimeException(
            'Use MP4, WebM, OGV/OGG, JPG, JPEG, PNG, WebP, or GIF.'
        );
    }

    $size = (int) $file['size'];
    if ($size < 1 || $size > $maxBytes) {
        throw new RuntimeException(
            $mediaType === 'video'
                ? 'The answer video must not exceed 50 MB.'
                : 'The answer picture must not exceed 8 MB.'
        );
    }

    if (!class_exists('finfo')) {
        throw new RuntimeException('The server fileinfo extension is required to verify uploads.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file((string) $file['tmp_name']);

    if (!is_string($mime) || !in_array($mime, $allowedMimes, true)) {
        throw new RuntimeException('The uploaded file does not match its file type.');
    }

    if ($mediaType === 'image') {
        $imageInfo = @getimagesize((string) $file['tmp_name']);
        if ($imageInfo === false || ($imageInfo['mime'] ?? '') !== $mime) {
            throw new RuntimeException('The uploaded file could not be verified as an image.');
        }
    }

    $relativeDirectory = 'uploads/question-videos';
    $uploadDirectory = __DIR__ . '/' . $relativeDirectory;

    if (
        !is_dir($uploadDirectory)
        && !mkdir($uploadDirectory, 0755, true)
        && !is_dir($uploadDirectory)
    ) {
        throw new RuntimeException(
            'The answer illustration folder could not be created. Check folder permissions.'
        );
    }

    // Restrict directory browsing and script execution on Apache.
    $htaccess = $uploadDirectory . '/.htaccess';
    if (!is_file($htaccess)) {
        $rules = "Options -Indexes\n"
            . "<IfModule mod_headers.c>\n"
            . "  Header always set X-Content-Type-Options nosniff\n"
            . "</IfModule>\n"
            . "<FilesMatch \"\\.(php[0-9]*|phtml|phar|cgi|pl|py|sh|html?)$\">\n"
            . "  <IfModule mod_authz_core.c>\n"
            . "    Require all denied\n"
            . "  </IfModule>\n"
            . "  <IfModule !mod_authz_core.c>\n"
            . "    Order allow,deny\n"
            . "    Deny from all\n"
            . "  </IfModule>\n"
            . "</FilesMatch>\n";
        @file_put_contents($htaccess, $rules, LOCK_EX);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $uploadDirectory . '/' . $filename;

    if (!move_uploaded_file((string) $file['tmp_name'], $destination)) {
        throw new RuntimeException('The illustration could not be saved. Check folder permissions.');
    }

    return $relativeDirectory . '/' . $filename;
}

/** Save a validated question image/diagram and return its relative path. */
function save_question_image_upload(array $file): string
{
    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('No question picture or diagram was selected.');
    }
    if ($error !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'The image exceeds the server upload limit.',
            UPLOAD_ERR_FORM_SIZE => 'The image exceeds the permitted upload size.',
            UPLOAD_ERR_PARTIAL => 'The image upload was incomplete. Please try again.',
            UPLOAD_ERR_NO_TMP_DIR => 'The server is missing its temporary upload folder.',
            UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded image.',
            UPLOAD_ERR_EXTENSION => 'A server extension stopped the image upload.',
        ];
        throw new RuntimeException($messages[$error] ?? 'The image upload failed.');
    }

    $maxBytes = 8 * 1024 * 1024;
    if (!isset($file['tmp_name'], $file['size']) || !is_uploaded_file((string) $file['tmp_name'])) {
        throw new RuntimeException('The uploaded image could not be verified.');
    }
    if ((int) $file['size'] < 1 || (int) $file['size'] > $maxBytes) {
        throw new RuntimeException('The question image must be smaller than or equal to 8 MB.');
    }

    $extension = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
    $allowedMimes = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'webp' => ['image/webp'],
        'gif'  => ['image/gif'],
    ];
    if (!isset($allowedMimes[$extension])) {
        throw new RuntimeException('Use a JPG, JPEG, PNG, WebP, or GIF image. SVG files are not accepted.');
    }
    if (!class_exists('finfo')) {
        throw new RuntimeException('The server fileinfo extension is required to verify uploaded images.');
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file((string) $file['tmp_name']);
    if (!is_string($mime) || !in_array($mime, $allowedMimes[$extension], true)) {
        throw new RuntimeException('The uploaded file does not appear to be a valid image of that type.');
    }
    $imageInfo = @getimagesize((string) $file['tmp_name']);
    if ($imageInfo === false || !isset($imageInfo['mime']) || $imageInfo['mime'] !== $mime) {
        throw new RuntimeException('The uploaded file could not be verified as an image.');
    }

    $relativeDirectory = 'uploads/question-images';
    $uploadDirectory = __DIR__ . '/' . $relativeDirectory;
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('The question image folder could not be created. Check folder permissions.');
    }

    $htaccess = $uploadDirectory . '/.htaccess';
    if (!is_file($htaccess)) {
        $rules = "Options -Indexes\n<IfModule mod_headers.c>\n  Header always set X-Content-Type-Options nosniff\n</IfModule>\n<FilesMatch \"\\.(php[0-9]*|phtml|phar|cgi|pl|py|sh|html?)$\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n  </IfModule>\n</FilesMatch>\n";
        @file_put_contents($htaccess, $rules, LOCK_EX);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $uploadDirectory . '/' . $filename;
    if (!move_uploaded_file((string) $file['tmp_name'], $destination)) {
        throw new RuntimeException('The question image could not be saved. Check folder permissions.');
    }
    return $relativeDirectory . '/' . $filename;
}

/** Delete only known answer illustration files, including legacy videos. */
function delete_answer_video_file(?string $relativePath): void
{
    if (!$relativePath) {
        return;
    }

    $allowedDirectories = [
        'uploads/question-videos/',
        'uploads/question-videos/',
    ];

    $directory = null;
    foreach ($allowedDirectories as $allowedDirectory) {
        if (str_starts_with($relativePath, $allowedDirectory)) {
            $directory = $allowedDirectory;
            break;
        }
    }

    if ($directory === null) {
        return;
    }

    $filename = basename($relativePath);
    if (!preg_match('/^[a-f0-9]{32}\.(?:mp4|webm|ogv|ogg|jpg|jpeg|png|webp|gif)$/D', $filename)) {
        return;
    }

    $fullPath = __DIR__ . '/' . $directory . $filename;
    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}

/** Only delete files stored in this page's dedicated question-image directory. */
function delete_question_image_file(?string $relativePath): void
{
    if (!$relativePath || !str_starts_with($relativePath, 'uploads/question-images/')) {
        return;
    }
    $filename = basename($relativePath);
    if ($filename === '' || $filename === '.' || $filename === '..') {
        return;
    }
    $fullPath = __DIR__ . '/uploads/question-images/' . $filename;
    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}

/** Validate stored question-image paths before rendering them. */
function is_question_image_path(?string $relativePath): bool
{
    return is_string($relativePath)
        && preg_match('~^uploads/question-images/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp|gif)$~D', $relativePath) === 1;
}

/** Validate stored answer-illustration paths before rendering them. */
function is_answer_illustration_path(?string $relativePath): bool
{
    return is_string($relativePath)
        && preg_match(
            '~^uploads/(?:question-videos|question-videos)/[a-f0-9]{32}\.(?:mp4|webm|ogv|ogg|jpg|jpeg|png|webp|gif)$~D',
            $relativePath
        ) === 1;
}

function is_answer_illustration_video(string $relativePath): bool
{
    return preg_match('/\.(?:mp4|webm|ogv|ogg)$/iD', $relativePath) === 1;
}

$config = [];
$configFile = __DIR__ . '/cbt_admin_config.php';
if (is_file($configFile)) {
    $loadedConfig = require $configFile;
    if (is_array($loadedConfig)) {
        $config = $loadedConfig;
    }
}

$adminUsername = getenv('CBT_ADMIN_USERNAME') ?: (string) ($config['username'] ?? '');
$adminPasswordHash = getenv('CBT_ADMIN_PASSWORD_HASH') ?: (string) ($config['password_hash'] ?? '');
$adminConfigured = $adminUsername !== ''
    && $adminPasswordHash !== ''
    && $adminPasswordHash !== 'PASTE_PASSWORD_HASH_HERE';

$pageError = '';
$editingQuestionId = 0;
$questionsPerPage = 20;
$pageValue = filter_var($_GET['page'] ?? ($_POST['return_page'] ?? 1), FILTER_VALIDATE_INT);
$currentPage = ($pageValue !== false && $pageValue !== null && $pageValue > 0) ? (int) $pageValue : 1;
$pageSuccess = $_SESSION['cbt_admin_flash'] ?? '';
unset($_SESSION['cbt_admin_flash']);
$formValues = [
    'subject_id' => '',
    'exam_category_id' => '',
    'exam_year' => (string) date('Y'),
    'question_text' => '',
    'answer_explanation' => '',
    'option_a' => '',
    'option_b' => '',
    'option_c' => '',
    'option_d' => '',
    'correct_option' => '0',
    'is_active' => '1',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');

    if (!valid_csrf()) {
        $pageError = 'Your session token is invalid or expired. Please refresh the page and try again.';
    } elseif ($action === 'login') {
        $submittedUsername = trim((string) ($_POST['username'] ?? ''));
        $submittedPassword = (string) ($_POST['password'] ?? '');

        if (!$adminConfigured) {
            $pageError = 'Admin login is not configured. Follow the setup instructions in README_admin_questions.txt.';
        } elseif (hash_equals($adminUsername, $submittedUsername) && password_verify($submittedPassword, $adminPasswordHash)) {
            session_regenerate_id(true);
            $_SESSION['cbt_admin_logged_in'] = true;
            $_SESSION['cbt_admin_csrf'] = bin2hex(random_bytes(32));
            header('Location: ' . $_SERVER['SCRIPT_NAME']);
            exit;
        } else {
            $pageError = 'The username or password is incorrect.';
        }
    } elseif ($action === 'logout') {
        unset($_SESSION['cbt_admin_logged_in']);
        session_regenerate_id(true);
        $_SESSION['cbt_admin_csrf'] = bin2hex(random_bytes(32));
        header('Location: ' . $_SERVER['SCRIPT_NAME']);
        exit;
    } elseif ($action === 'delete_question' && !empty($_SESSION['cbt_admin_logged_in'])) {
        $questionId = filter_var($_POST['question_id'] ?? '', FILTER_VALIDATE_INT);
        if ($questionId === false || $questionId < 1) {
            $pageError = 'Please select a valid question to delete.';
        } else {
            $returnPageValue = filter_var($_POST['return_page'] ?? 1, FILTER_VALIDATE_INT);
            $returnPage = ($returnPageValue !== false && $returnPageValue !== null && $returnPageValue > 0) ? (int) $returnPageValue : 1;
            try {
                require_once __DIR__ . '/cbt_db.php';
                $mediaLookup = $pdo->prepare('SELECT answer_video_path, question_image_path FROM questions WHERE id = :id');
                $mediaLookup->execute([':id' => $questionId]);
                $mediaToDelete = $mediaLookup->fetch(PDO::FETCH_ASSOC) ?: [];
                $videoPathToDelete = $mediaToDelete['answer_video_path'] ?? null;
                $imagePathToDelete = $mediaToDelete['question_image_path'] ?? null;
                $delete = $pdo->prepare('DELETE FROM questions WHERE id = :id');
                $delete->execute([':id' => $questionId]);
                if ($delete->rowCount() > 0) {
                    if (is_string($videoPathToDelete) && $videoPathToDelete !== '') {
                        delete_answer_video_file($videoPathToDelete);
                    }
                    if (is_string($imagePathToDelete) && $imagePathToDelete !== '') {
                        delete_question_image_file($imagePathToDelete);
                    }
                    $_SESSION['cbt_admin_flash'] = 'Question #' . (int) $questionId . ' was deleted successfully.';
                } else {
                    $_SESSION['cbt_admin_flash'] = 'No question was deleted; it may already have been removed.';
                }
                header('Location: ' . $_SERVER['SCRIPT_NAME'] . '?page=' . $returnPage);
                exit;
            } catch (PDOException $e) {
                error_log('Admin question delete failed: ' . $e->getMessage());
                $pageError = 'The question could not be deleted. It may be referenced by other records.';
            }
        }
    } elseif (in_array($action, ['save_question', 'update_question'], true) && !empty($_SESSION['cbt_admin_logged_in'])) {
        $editingQuestionId = $action === 'update_question'
            ? (int) filter_var($_POST['question_id'] ?? 0, FILTER_VALIDATE_INT)
            : 0;
        foreach ($formValues as $key => $defaultValue) {
            if ($key === 'is_active') {
                $formValues[$key] = isset($_POST['is_active']) ? '1' : '0';
            } elseif (isset($_POST[$key]) && is_scalar($_POST[$key])) {
                $formValues[$key] = trim((string) $_POST[$key]);
            }
        }

        $subjectId = filter_var($formValues['subject_id'], FILTER_VALIDATE_INT);
        $categoryId = filter_var($formValues['exam_category_id'], FILTER_VALIDATE_INT);
        $examYear = filter_var($formValues['exam_year'], FILTER_VALIDATE_INT);
        $correctOption = filter_var($formValues['correct_option'], FILTER_VALIDATE_INT);
        $questionText = $formValues['question_text'];
        $answerExplanation = $formValues['answer_explanation'];
        $options = [
            $formValues['option_a'],
            $formValues['option_b'],
            $formValues['option_c'],
            $formValues['option_d'],
        ];
        $newVideoPath = null;
        $oldVideoPath = null;
        $newImagePath = null;
        $oldImagePath = null;

        if ($action === 'update_question' && $editingQuestionId < 1) {
            $pageError = 'Please select a valid question to update.';
        } elseif ($subjectId === false || $subjectId < 1 || $categoryId === false || $categoryId < 1) {
            $pageError = 'Please choose a valid subject and exam category.';
        } elseif ($examYear === false || $examYear < 1900 || $examYear > 2100) {
            $pageError = 'Please enter a valid exam year between 1900 and 2100.';
        } elseif ($questionText === '') {
            $pageError = 'Please enter the question text.';
        } elseif (strlen($questionText) > 60000) {
            $pageError = 'The question text is too long.';
        } elseif (strlen($answerExplanation) > 60000) {
            $pageError = 'The answer explanation is too long.';
        } elseif (count(array_filter($options, static fn($value) => $value !== '')) !== 4) {
            $pageError = 'Please fill in all four answer options.';
        } elseif (max(array_map('strlen', $options)) > 500) {
            $pageError = 'Each answer option must be 500 characters or fewer.';
        } elseif ($correctOption === false || $correctOption < 0 || $correctOption > 3) {
            $pageError = 'Please select the correct answer.';
        } else {
            try {
                require_once __DIR__ . '/cbt_db.php';

                $subjectCheck = $pdo->prepare('SELECT id FROM subjects WHERE id = :id AND is_active = 1');
                $subjectCheck->execute([':id' => $subjectId]);
                $categoryCheck = $pdo->prepare('SELECT id FROM exam_category WHERE id = :id AND is_active = 1');
                $categoryCheck->execute([':id' => $categoryId]);

                if (!$subjectCheck->fetchColumn() || !$categoryCheck->fetchColumn()) {
                    $pageError = 'The selected subject or exam category is inactive or does not exist. Refresh the page and try again.';
                } else {
                    if ($action === 'update_question') {
                        $existingStmt = $pdo->prepare('SELECT id, answer_video_path, question_image_path FROM questions WHERE id = :id');
                        $existingStmt->execute([':id' => $editingQuestionId]);
                        $existingQuestion = $existingStmt->fetch();
                        if (!$existingQuestion) {
                            $pageError = 'That question no longer exists. Refresh the page and try again.';
                        } else {
                            $oldVideoPath = $existingQuestion['answer_video_path'] !== null
                                ? (string) $existingQuestion['answer_video_path']
                                : null;
                            $oldImagePath = $existingQuestion['question_image_path'] !== null
                                ? (string) $existingQuestion['question_image_path']
                                : null;
                        }
                    }

                    if ($pageError === '') {
                        $removeVideo = $action === 'update_question' && isset($_POST['remove_answer_video']);
                        $answerVideoPath = $removeVideo ? null : $oldVideoPath;

                        $hasNewUpload = isset($_FILES['answer_video'])
                            && (int) ($_FILES['answer_video']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

                        if ($hasNewUpload) {
                            $newVideoPath = save_answer_illustration_upload($_FILES['answer_video']);
                            $answerVideoPath = $newVideoPath;
                        }

                        $removeImage = $action === 'update_question' && isset($_POST['remove_question_image']);
                        $questionImagePath = $removeImage ? null : $oldImagePath;
                        $hasNewImageUpload = isset($_FILES['question_image'])
                            && (int) ($_FILES['question_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
                        if ($hasNewImageUpload) {
                            $newImagePath = save_question_image_upload($_FILES['question_image']);
                            $questionImagePath = $newImagePath;
                        }

                        $params = [
                            ':subject_id' => $subjectId,
                            ':exam_category_id' => $categoryId,
                            ':exam_year' => $examYear,
                            ':question_text' => $questionText,
                            ':option_a' => $options[0],
                            ':option_b' => $options[1],
                            ':option_c' => $options[2],
                            ':option_d' => $options[3],
                            ':correct_option' => $correctOption,
                            ':answer_explanation' => $answerExplanation !== '' ? $answerExplanation : null,
                            ':answer_video_path' => $answerVideoPath,
                            ':question_image_path' => $questionImagePath,
                            ':is_active' => $formValues['is_active'] === '1' ? 1 : 0,
                        ];

                        if ($action === 'update_question') {
                            $update = $pdo->prepare(
                                'UPDATE questions SET
                                    subject_id = :subject_id,
                                    exam_category_id = :exam_category_id,
                                    exam_year = :exam_year,
                                    question_text = :question_text,
                                    option_a = :option_a,
                                    option_b = :option_b,
                                    option_c = :option_c,
                                    option_d = :option_d,
                                    correct_option = :correct_option,
                                    answer_explanation = :answer_explanation,
                                    answer_video_path = :answer_video_path,
                                    question_image_path = :question_image_path,
                                    is_active = :is_active
                                 WHERE id = :id'
                            );
                            $params[':id'] = $editingQuestionId;
                            $update->execute($params);
                        } else {
                            $insert = $pdo->prepare(
                                'INSERT INTO questions
                                    (subject_id, exam_category_id, exam_year, question_text, question_image_path, option_a, option_b, option_c, option_d, correct_option, answer_explanation, answer_video_path, is_active)
                                 VALUES
                                    (:subject_id, :exam_category_id, :exam_year, :question_text, :question_image_path, :option_a, :option_b, :option_c, :option_d, :correct_option, :answer_explanation, :answer_video_path, :is_active)'
                            );
                            $insert->execute($params);
                            $editingQuestionId = (int) $pdo->lastInsertId();
                        }

                        // Remove replaced/deleted files only after the database write succeeds.
                        if (($removeVideo || ($newVideoPath !== null && $oldVideoPath !== null)) && $oldVideoPath !== null) {
                            delete_answer_video_file($oldVideoPath);
                        }
                        if (($removeImage || ($newImagePath !== null && $oldImagePath !== null)) && $oldImagePath !== null) {
                            delete_question_image_file($oldImagePath);
                        }

                        $_SESSION['cbt_admin_flash'] = $action === 'update_question'
                            ? 'Question #' . $editingQuestionId . ' updated successfully.'
                            : 'Question saved successfully (Question ID: ' . $editingQuestionId . ').';
                        $redirectPage = 1;
                        if ($action === 'update_question') {
                            $returnPageValue = filter_var($_POST['return_page'] ?? 1, FILTER_VALIDATE_INT);
                            $redirectPage = ($returnPageValue !== false && $returnPageValue !== null && $returnPageValue > 0) ? (int) $returnPageValue : 1;
                        }
                        header('Location: ' . $_SERVER['SCRIPT_NAME'] . '?page=' . $redirectPage);
                        exit;
                    }
                }
            } catch (RuntimeException $e) {
                if ($newVideoPath !== null) {
                    delete_answer_video_file($newVideoPath);
                }
                if ($newImagePath !== null) {
                    delete_question_image_file($newImagePath);
                }
                $pageError = $e->getMessage();
            } catch (PDOException $e) {
                if ($newVideoPath !== null) {
                    delete_answer_video_file($newVideoPath);
                }
                if ($newImagePath !== null) {
                    delete_question_image_file($newImagePath);
                }
                error_log('Admin question insert/update failed: ' . $e->getMessage());
                $pageError = 'The question could not be saved. Check that the database migration has been imported and try again.';
            }
        }
    }
}

$isLoggedIn = !empty($_SESSION['cbt_admin_logged_in']);
$subjects = [];
$categories = [];
$recentQuestions = [];
$totalQuestions = 0;
$totalPages = 1;
$questionOffset = 0;

if ($isLoggedIn) {
    try {
        require_once __DIR__ . '/cbt_db.php';
        $subjects = $pdo->query('SELECT id, subject_name FROM subjects WHERE is_active = 1 ORDER BY subject_name')->fetchAll();
        $categories = $pdo->query('SELECT id, category_name FROM exam_category WHERE is_active = 1 and id <= 10 ORDER BY category_name')->fetchAll();

        $countStmt = $pdo->query(
            'SELECT COUNT(*)
             FROM questions q
             INNER JOIN subjects s ON s.id = q.subject_id
             INNER JOIN exam_category ec ON ec.id = q.exam_category_id'
        );
        $totalQuestions = (int) $countStmt->fetchColumn();
        $totalPages = max(1, (int) ceil($totalQuestions / $questionsPerPage));
        if ($currentPage > $totalPages) {
            $currentPage = $totalPages;
        }
        $questionOffset = ($currentPage - 1) * $questionsPerPage;

        $recentStmt = $pdo->prepare(
            'SELECT q.id, q.question_text, q.question_image_path, q.answer_explanation, q.answer_video_path, q.exam_year, q.is_active, q.created_at,
                    s.subject_name, ec.category_name
             FROM questions q
             INNER JOIN subjects s ON s.id = q.subject_id
             INNER JOIN exam_category ec ON ec.id = q.exam_category_id
             ORDER BY q.id DESC
             LIMIT :row_limit OFFSET :row_offset'
        );
        $recentStmt->bindValue(':row_limit', $questionsPerPage, PDO::PARAM_INT);
        $recentStmt->bindValue(':row_offset', $questionOffset, PDO::PARAM_INT);
        $recentStmt->execute();
        $recentQuestions = $recentStmt->fetchAll();

        if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['edit'])) {
            $editId = filter_var($_GET['edit'], FILTER_VALIDATE_INT);
            if ($editId === false || $editId < 1) {
                $pageError = 'Invalid question selected for editing.';
            } else {
                $editStmt = $pdo->prepare(
                    'SELECT id, subject_id, exam_category_id, exam_year, question_text, option_a, option_b, option_c, option_d, correct_option, answer_explanation, answer_video_path, is_active
                     FROM questions WHERE id = :id'
                );
                $editStmt->execute([':id' => $editId]);
                $questionToEdit = $editStmt->fetch();
                if (!$questionToEdit) {
                    $pageError = 'The selected question was not found.';
                } else {
                    $editingQuestionId = (int) $questionToEdit['id'];
                    $formValues = [
                        'subject_id' => (string) $questionToEdit['subject_id'],
                        'exam_category_id' => (string) $questionToEdit['exam_category_id'],
                        'exam_year' => (string) $questionToEdit['exam_year'],
                        'question_text' => (string) $questionToEdit['question_text'],
                        'answer_explanation' => (string) ($questionToEdit['answer_explanation'] ?? ''),
                        'option_a' => (string) $questionToEdit['option_a'],
                        'option_b' => (string) $questionToEdit['option_b'],
                        'option_c' => (string) $questionToEdit['option_c'],
                        'option_d' => (string) $questionToEdit['option_d'],
                        'correct_option' => (string) $questionToEdit['correct_option'],
                        'is_active' => (string) $questionToEdit['is_active'],
                    ];
                }
            }
        }
    } catch (PDOException $e) {
        error_log('Admin question page loading failed: ' . $e->getMessage());
        $pageError = 'The question form could not load its database lists. Please check the database configuration.';
    }
}

$page_title = 'Question Administration | Skymenu CBT';

?>
<style>
.admin-page{background:#f4f7fb;min-height:70vh;padding:32px 16px 50px;color:#263445}
.admin-wrap{max-width:1100px;margin:0 auto}
.admin-hero{background:linear-gradient(135deg,#0d3b66,#1769aa);color:#fff;border-radius:15px;padding:26px;margin-bottom:20px}
.admin-hero h1{margin:0 0 8px;font-size:clamp(24px,4vw,34px)}
.admin-hero p{margin:0;line-height:1.6;opacity:.95}
.admin-card{background:#fff;border-radius:13px;padding:24px;box-shadow:0 3px 14px rgba(0,0,0,.07);margin-bottom:20px}
.admin-card h2{margin:0 0 16px;color:#0d3b66}
.admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.admin-field{margin-bottom:16px}
.admin-field label{display:block;font-weight:700;margin-bottom:7px}
.admin-field input,.admin-field textarea,.admin-field select{width:100%;box-sizing:border-box;border:1px solid #d5dfe9;border-radius:8px;padding:11px 12px;font:inherit;background:#fff;color:#263445}
.admin-field textarea{min-height:120px;resize:vertical}
.admin-field input:focus,.admin-field textarea:focus,.admin-field select:focus{outline:2px solid #1769aa;outline-offset:1px}
.admin-btn{border:0;border-radius:8px;padding:12px 18px;font-weight:700;cursor:pointer;background:#1769aa;color:#fff}
.admin-btn:hover{background:#0d3b66}.admin-btn-muted{background:#e9edf2;color:#263445}.admin-btn-edit{background:#1769aa}.admin-btn-delete{background:#b42318}.admin-btn-delete:hover{background:#8e1717}
.admin-alert{padding:12px 15px;border-radius:8px;margin-bottom:16px;line-height:1.5}
.admin-error{background:#ffe8e8;color:#8e1717;border:1px solid #f2bcbc}.admin-success{background:#e3f7eb;color:#12633a;border:1px solid #bce6cc}.admin-note{color:#536273;line-height:1.55;font-size:14px}
.admin-correct{display:flex;gap:12px;flex-wrap:wrap}.admin-correct label{border:1px solid #d5dfe9;border-radius:8px;padding:11px 14px;display:flex;gap:8px;align-items:center;cursor:pointer}
.admin-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.admin-table-wrap{overflow-x:auto}.admin-table{border-collapse:collapse;width:100%;font-size:14px}.admin-table th,.admin-table td{text-align:left;vertical-align:top;padding:11px;border-bottom:1px solid #e6ebf1}.admin-table th{background:#f7f9fc;color:#34465a}.admin-status{font-weight:700}.admin-status.active{color:#147344}.admin-status.inactive{color:#a33b18}
.question-entry-grid{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start}.question-image-preview{margin-top:12px}.question-image-preview img{display:block;max-width:100%;max-height:240px;width:auto;height:auto;border:1px solid #d5dfe9;border-radius:8px;padding:4px;background:#f7f9fc}.question-image-remove{display:flex!important;gap:8px;align-items:center;margin-top:12px}.admin-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:18px}.admin-pagination-summary{font-size:14px;color:#536273}.admin-pagination-links{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.admin-page-link{display:inline-block;min-width:36px;text-align:center;box-sizing:border-box;padding:8px 10px;border:1px solid #d5dfe9;border-radius:7px;background:#fff;color:#1769aa;text-decoration:none;font-weight:700}.admin-page-link:hover{background:#edf4fb}.admin-page-link.active{background:#1769aa;border-color:#1769aa;color:#fff}.admin-page-ellipsis{padding:0 3px;color:#536273}
@media(max-width:650px){.admin-grid,.question-entry-grid{grid-template-columns:1fr}.admin-card{padding:18px}.admin-page{padding:20px 10px}}
</style>

<main class="admin-page">
<div class="admin-wrap">
    <section class="admin-hero">
        <h1><font color="white">CBT Question Administration</font></h1>
        <p>Register multiple-choice questions and assign each question to a subject and exam category.</p>
    </section>

    <?php if ($pageError !== ''): ?>
        <div class="admin-alert admin-error" role="alert"><?php echo h($pageError); ?></div>
    <?php endif; ?>
    <?php if ($pageSuccess !== ''): ?>
        <div class="admin-alert admin-success" role="status"><?php echo h($pageSuccess); ?></div>
    <?php endif; ?>

    <?php if (!$isLoggedIn): ?>
        <section class="admin-card" style="max-width:520px;margin:0 auto">
            <h2>Administrator Login</h2>
            <?php if (!$adminConfigured): ?>
                <div class="admin-alert admin-error">Admin access has not been configured. Before using this page, create <code>cbt_admin_config.php</code> using the example file and instructions included with this download.</div>
            <?php endif; ?>
            <form method="post" autocomplete="on">
                <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                <input type="hidden" name="action" value="login">
                <div class="admin-field">
                    <label for="username">Username</label>
                    <input id="username" name="username" type="text" autocomplete="username" required>
                </div>
                <div class="admin-field">
                    <label for="password">Password</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required>
                </div>
                <button class="admin-btn" type="submit" <?php echo !$adminConfigured ? 'disabled' : ''; ?>>Sign in</button>
            </form>
        </section>
    <?php else: ?>
        <section class="admin-card">
            <div class="admin-topline">
                <h2><?php echo $editingQuestionId > 0 ? 'Edit Question #' . (int) $editingQuestionId : 'Add a New Question'; ?></h2>
                <form method="post">
                    <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                    <input type="hidden" name="action" value="logout">
                    <button class="admin-btn admin-btn-muted" type="submit">Log out</button>
                </form>
            </div>
            <?php if (!$subjects || !$categories): ?>
                <div class="admin-alert admin-error">No active subjects or exam categories were found. Add and activate them before registering questions.</div>
            <?php else: ?>
                <form method="post" autocomplete="off" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                    <input type="hidden" name="action" value="<?php echo $editingQuestionId > 0 ? 'update_question' : 'save_question'; ?>">
                    <?php if ($editingQuestionId > 0): ?>
                        <input type="hidden" name="question_id" value="<?php echo (int) $editingQuestionId; ?>">
                        <input type="hidden" name="return_page" value="<?php echo $currentPage; ?>">
                    <?php endif; ?>

                    <div class="admin-grid">
                        <div class="admin-field">
                            <label for="subject_id">Subject</label>
                            <select id="subject_id" name="subject_id" required>
                                <option value="">-- Select Subject --</option>
                                <?php foreach ($subjects as $subject): ?>
                                    <option value="<?php echo (int) $subject['id']; ?>" <?php echo ((string) $subject['id'] === $formValues['subject_id']) ? 'selected' : ''; ?>><?php echo h($subject['subject_name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="admin-field">
                            <label for="exam_category_id">Exam Category</label>
                            <select id="exam_category_id" name="exam_category_id" required>
                                <option value="">-- Select Exam Category --</option>
                                <?php foreach ($categories as $category): ?>
                                    <option value="<?php echo (int) $category['id']; ?>" <?php echo ((string) $category['id'] === $formValues['exam_category_id']) ? 'selected' : ''; ?>><?php echo h($category['category_name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="admin-field">
                        <label for="exam_year">Exam Year</label>
                        <input id="exam_year" name="exam_year" type="number" min="1900" max="2100" step="1" value="<?php echo h($formValues['exam_year']); ?>" required>
                        <p class="admin-note">Enter the year the exam question belongs to, for example 2024, 2025, or 2026.</p>
                    </div>

                    <div class="admin-grid question-entry-grid">
                        <div class="admin-field">
                            <label for="question_text">Question</label>
                            <textarea id="question_text" name="question_text" maxlength="60000" required><?php echo h($formValues['question_text']); ?></textarea>
                        </div>
                        <div class="admin-field">
                            <label for="question_image">Question Picture / Diagram (optional)</label>
                            <input id="question_image" name="question_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif">
                            <p class="admin-note">Upload a diagram or picture related to this question. Accepted formats: JPG, PNG, WebP, or GIF. Maximum size: 8 MB.</p>
                            <?php if ($editingQuestionId > 0): ?>
                                <?php
                                    $imageStmt = $pdo->prepare('SELECT question_image_path FROM questions WHERE id = :id');
                                    $imageStmt->execute([':id' => $editingQuestionId]);
                                    $currentQuestionImagePath = $imageStmt->fetchColumn();
                                ?>
                                <?php if (is_string($currentQuestionImagePath) && is_question_image_path($currentQuestionImagePath)): ?>
                                    <div class="question-image-preview">
                                        <p class="admin-note"><strong>Current picture/diagram</strong></p>
                                        <a href="<?php echo h($currentQuestionImagePath); ?>" target="_blank" rel="noopener">
                                            <img src="<?php echo h($currentQuestionImagePath); ?>" alt="Current question diagram">
                                        </a>
                                        <label class="question-image-remove"><input type="checkbox" name="remove_question_image" value="1" style="width:auto"> Remove current picture/diagram</label>
                                        <p class="admin-note">Uploading a new image replaces the current image.</p>
                                    </div>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="admin-grid">
                        <div class="admin-field">
                            <label for="option_a">Option A</label>
                            <input id="option_a" name="option_a" type="text" maxlength="500" value="<?php echo h($formValues['option_a']); ?>" required>
                        </div>
                        <div class="admin-field">
                            <label for="option_b">Option B</label>
                            <input id="option_b" name="option_b" type="text" maxlength="500" value="<?php echo h($formValues['option_b']); ?>" required>
                        </div>
                        <div class="admin-field">
                            <label for="option_c">Option C</label>
                            <input id="option_c" name="option_c" type="text" maxlength="500" value="<?php echo h($formValues['option_c']); ?>" required>
                        </div>
                        <div class="admin-field">
                            <label for="option_d">Option D</label>
                            <input id="option_d" name="option_d" type="text" maxlength="500" value="<?php echo h($formValues['option_d']); ?>" required>
                        </div>
                    </div>

                    <div class="admin-field">
                        <label>Correct Answer</label>
                        <div class="admin-correct">
                            <?php foreach (['A', 'B', 'C', 'D'] as $index => $letter): ?>
                                <label><input type="radio" name="correct_option" value="<?php echo $index; ?>" <?php echo ($formValues['correct_option'] === (string) $index) ? 'checked' : ''; ?> required> Option <?php echo $letter; ?></label>
                            <?php endforeach; ?>
                        </div>
                        <p class="admin-note">Choose the option that contains the correct answer.</p>
                    </div>

                    <div class="admin-field">
                        <label for="answer_explanation">Answer Explanation</label>
                        <textarea id="answer_explanation" name="answer_explanation" maxlength="60000" placeholder="Explain why the correct option is right..."><?php echo h($formValues['answer_explanation']); ?></textarea>
                        <p class="admin-note">Optional. This explanation can be shown to candidates in the result review page.</p>
                    </div>

                    <div class="admin-field">
                        <label for="answer_video">Answer Illustration (Video or Picture — optional)</label>
                        <input id="answer_video" name="answer_video" type="file" accept="video/mp4,video/webm,video/ogg,image/jpeg,image/png,image/webp,image/gif,.mp4,.webm,.ogv,.ogg,.jpg,.jpeg,.png,.webp,.gif">
                        <p class="admin-note">Optional. Upload either a video or picture. Videos: MP4, WebM, OGV/OGG (maximum 50 MB). Pictures: JPG, JPEG, PNG, WebP, GIF (maximum 8 MB). Uploading a new file replaces the existing answer illustration.</p>
                        <?php if ($editingQuestionId > 0): ?>
                            <?php
                                $videoStmt = $pdo->prepare('SELECT answer_video_path FROM questions WHERE id = :id');
                                $videoStmt->execute([':id' => $editingQuestionId]);
                                $currentAnswerVideoPath = $videoStmt->fetchColumn();
                            ?>
                            <?php if (is_string($currentAnswerVideoPath) && is_answer_illustration_path($currentAnswerVideoPath)): ?>
                                <div class="question-image-preview">
                                    <p class="admin-note"><strong>Current answer illustration</strong></p>
                                    <?php if (is_answer_illustration_video($currentAnswerVideoPath)): ?>
                                        <video controls preload="metadata" style="display:block;width:100%;max-width:480px;max-height:300px;border-radius:8px;background:#111">
                                            <source src="<?php echo h($currentAnswerVideoPath); ?>">
                                            Your browser does not support video playback.
                                        </video>
                                    <?php else: ?>
                                        <a href="<?php echo h($currentAnswerVideoPath); ?>" target="_blank" rel="noopener">
                                            <img src="<?php echo h($currentAnswerVideoPath); ?>" alt="Current answer illustration" style="display:block;max-width:100%;max-height:300px;width:auto;height:auto;border:1px solid #d5dfe9;border-radius:8px;padding:4px;background:#f7f9fc">
                                        </a>
                                    <?php endif; ?>
                                    <label class="question-image-remove"><input type="checkbox" name="remove_answer_video" value="1" style="width:auto"> Remove current answer illustration</label>
                                    <p class="admin-note">Leave the upload empty to keep the current illustration, unless you select the removal checkbox.</p>
                                </div>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>

                    <div class="admin-field">
                        <label><input type="checkbox" name="is_active" value="1" <?php echo $formValues['is_active'] === '1' ? 'checked' : ''; ?> style="width:auto"> Make question active immediately</label>
                    </div>

                    <button class="admin-btn" type="submit"><?php echo $editingQuestionId > 0 ? 'Update Question' : 'Save Question'; ?></button>
                    <?php if ($editingQuestionId > 0): ?>
                        <a class="admin-btn admin-btn-muted" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=<?php echo $currentPage; ?>" style="display:inline-block;text-decoration:none;margin-left:8px">Cancel Edit</a>
                    <?php endif; ?>
                </form>
            <?php endif; ?>
        </section>

        <section class="admin-card">
            <h2>Recently Added Questions</h2>
            <?php if (!$recentQuestions): ?>
                <p class="admin-note">No questions found yet.</p>
            <?php else: ?>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead><tr><th>ID</th><th>Question</th><th>Subject</th><th>Exam Category</th><th>Exam Year</th><th>Diagram</th><th>Explanation</th><th>Answer Illustration</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                        <?php foreach ($recentQuestions as $item): ?>
                            <tr>
                                <td><?php echo (int) $item['id']; ?></td>
                                <td><?php echo h(short_text((string) $item['question_text'], 140)); ?></td>
                                <td><?php echo h($item['subject_name']); ?></td>
                                <td><?php echo h($item['category_name']); ?></td>
                                <td><?php echo (int) $item['exam_year']; ?></td>
                                <td><?php echo is_question_image_path((string) ($item['question_image_path'] ?? '')) ? 'Uploaded' : '—'; ?></td>
                                <td><?php echo trim((string) ($item['answer_explanation'] ?? '')) !== '' ? 'Added' : '—'; ?></td>
                                <td>
                                    <?php
                                        $answerMediaPath = (string) ($item['answer_video_path'] ?? '');
                                        echo is_answer_illustration_path($answerMediaPath)
                                            ? (is_answer_illustration_video($answerMediaPath) ? 'Video uploaded' : 'Picture uploaded')
                                            : '—';
                                    ?>
                                </td>
                                <td><span class="admin-status <?php echo (int) $item['is_active'] === 1 ? 'active' : 'inactive'; ?>"><?php echo (int) $item['is_active'] === 1 ? 'Active' : 'Inactive'; ?></span></td>
                                <td>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                                        <a class="admin-btn admin-btn-edit" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?edit=<?php echo (int) $item['id']; ?>&amp;page=<?php echo $currentPage; ?>" style="display:inline-block;text-decoration:none;padding:8px 11px">Edit</a>
                                        <form method="post" onsubmit="return confirm('Delete question #<?php echo (int) $item['id']; ?>? This cannot be undone.');" style="margin:0">
                                            <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                            <input type="hidden" name="action" value="delete_question">
                                            <input type="hidden" name="return_page" value="<?php echo $currentPage; ?>">
                                            <input type="hidden" name="question_id" value="<?php echo (int) $item['id']; ?>">
                                            <button class="admin-btn admin-btn-delete" type="submit" style="padding:8px 11px">Delete</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php
                    $firstQuestionNumber = $totalQuestions > 0 ? $questionOffset + 1 : 0;
                    $lastQuestionNumber = min($questionOffset + count($recentQuestions), $totalQuestions);
                    $pageWindowStart = max(1, $currentPage - 2);
                    $pageWindowEnd = min($totalPages, $currentPage + 2);
                ?>
                <div class="admin-pagination">
                    <div class="admin-pagination-summary">
                        Showing <?php echo $firstQuestionNumber; ?>–<?php echo $lastQuestionNumber; ?> of <?php echo $totalQuestions; ?> questions
                        (<?php echo $questionsPerPage; ?> per page)
                    </div>
                    <?php if ($totalPages > 1): ?>
                        <nav class="admin-pagination-links" aria-label="Question list pages">
                            <?php if ($currentPage > 1): ?>
                                <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=<?php echo $currentPage - 1; ?>" aria-label="Previous page">&laquo; Prev</a>
                            <?php else: ?>
                                <span class="admin-page-link" aria-disabled="true" style="opacity:.45">&laquo; Prev</span>
                            <?php endif; ?>

                            <?php if ($pageWindowStart > 1): ?>
                                <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=1">1</a>
                                <?php if ($pageWindowStart > 2): ?><span class="admin-page-ellipsis">…</span><?php endif; ?>
                            <?php endif; ?>

                            <?php for ($pageNumber = $pageWindowStart; $pageNumber <= $pageWindowEnd; $pageNumber++): ?>
                                <?php if ($pageNumber === $currentPage): ?>
                                    <span class="admin-page-link active" aria-current="page"><?php echo $pageNumber; ?></span>
                                <?php else: ?>
                                    <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=<?php echo $pageNumber; ?>"><?php echo $pageNumber; ?></a>
                                <?php endif; ?>
                            <?php endfor; ?>

                            <?php if ($pageWindowEnd < $totalPages): ?>
                                <?php if ($pageWindowEnd < $totalPages - 1): ?><span class="admin-page-ellipsis">…</span><?php endif; ?>
                                <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=<?php echo $totalPages; ?>"><?php echo $totalPages; ?></a>
                            <?php endif; ?>

                            <?php if ($currentPage < $totalPages): ?>
                                <a class="admin-page-link" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?page=<?php echo $currentPage + 1; ?>" aria-label="Next page">Next &raquo;</a>
                            <?php else: ?>
                                <span class="admin-page-link" aria-disabled="true" style="opacity:.45">Next &raquo;</span>
                            <?php endif; ?>
                        </nav>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </section>
    <?php endif; ?>
</div>
</main>
<script src="ocr_helper.js"></script>
