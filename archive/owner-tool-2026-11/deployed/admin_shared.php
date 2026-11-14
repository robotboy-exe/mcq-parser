<?php
declare(strict_types=1);

/**
 * OT12 shared-text administration.
 *
 * This page owns every question row with a context link. The standalone page
 * (admin_questions.php) does not include this file or admin_context.php, and it
 * hides grouped rows, so the combined "Recent shared questions" table here is
 * the only newest-first view of them.
 */
session_start();

require_once __DIR__ . '/render.php';
require_once __DIR__ . '/admin_context.php';

if (empty($_SESSION['cbt_admin_csrf'])) {
    $_SESSION['cbt_admin_csrf'] = bin2hex(random_bytes(32));
}

function h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function admin_shared_valid_csrf(): bool
{
    return isset($_POST['csrf_token'], $_SESSION['cbt_admin_csrf'])
        && is_string($_POST['csrf_token'])
        && hash_equals($_SESSION['cbt_admin_csrf'], $_POST['csrf_token']);
}

function admin_shared_member_errors(array $values): array
{
    $errors = [];
    if (trim((string) $values['question_text']) === '') {
        $errors[] = 'Please enter the question text.';
    } elseif (strlen((string) $values['question_text']) > 60000) {
        $errors[] = 'The question text is too long.';
    }
    foreach (['option_a', 'option_b', 'option_c', 'option_d'] as $field) {
        if (trim((string) $values[$field]) === '') {
            $errors[] = 'Please fill in all four answer options.';
            break;
        }
    }
    if (max(array_map(static fn($v): int => strlen((string) $v), [
        $values['option_a'], $values['option_b'], $values['option_c'], $values['option_d'],
    ])) > 500) {
        $errors[] = 'Each answer option must be 500 characters or fewer.';
    }
    $correct = filter_var($values['correct_option'] ?? null, FILTER_VALIDATE_INT);
    if ($correct === false || $correct === null || $correct < 0 || $correct > 3) {
        $errors[] = 'Please select the correct answer.';
    }
    return $errors;
}

function admin_shared_member_values(array $row): array
{
    return [
        'subject_id' => (int) $row['subject_id'],
        'exam_category_id' => (int) $row['exam_category_id'],
        'exam_year' => (int) $row['exam_year'],
        'question_text' => (string) $row['question_text'],
        'option_a' => (string) $row['option_a'],
        'option_b' => (string) $row['option_b'],
        'option_c' => (string) $row['option_c'],
        'option_d' => (string) $row['option_d'],
        'correct_option' => (int) $row['correct_option'],
        'answer_explanation' => $row['answer_explanation'],
        'answer_video_path' => $row['answer_video_path'],
        'question_image_path' => $row['question_image_path'],
        'is_active' => 0,
    ];
}

/** Save either an answer illustration video or picture. */
function admin_shared_save_answer_upload(array $file): string
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
function admin_shared_save_image_upload(array $file): string
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
function admin_shared_delete_answer_file(?string $relativePath): void
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
function admin_shared_delete_image_file(?string $relativePath): void
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
function admin_shared_is_image_path(?string $relativePath): bool
{
    return is_string($relativePath)
        && preg_match('~^uploads/question-images/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp|gif)$~D', $relativePath) === 1;
}

/** Validate stored answer-illustration paths before rendering them. */
function admin_shared_is_answer_path(?string $relativePath): bool
{
    return is_string($relativePath)
        && preg_match(
            '~^uploads/(?:question-videos|question-videos)/[a-f0-9]{32}\.(?:mp4|webm|ogv|ogg|jpg|jpeg|png|webp|gif)$~D',
            $relativePath
        ) === 1;
}

function admin_shared_is_answer_video(string $relativePath): bool
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
$pageSuccess = $_SESSION['cbt_admin_flash'] ?? '';
unset($_SESSION['cbt_admin_flash']);
$editingContextId = 0;
$contextValues = cbt_admin_context_default_values();
$contextError = '';
$contexts = [];
$contextOptions = [];
$contextSchemaAvailable = false;
$contextCategories = [];
$contextPage = 1;
$contextTotal = 0;
$contextTotalPages = 1;
$contextPageSize = 10;
$editingQuestionId = 0;
$subjects = [];
$categories = [];
$members = [];
$recentShared = [];
$recentSharedTotal = 0;
$recentSharedPage = max(1, (int) filter_var($_GET['shared_page'] ?? 1, FILTER_VALIDATE_INT));
$recentSharedTotalPages = 1;
$recentSharedPageSize = 20;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    if (!admin_shared_valid_csrf()) {
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
    } elseif (!empty($_SESSION['cbt_admin_logged_in']) && cbt_admin_is_context_action($action)) {
        cbt_admin_handle_context_request(
            $action, $_POST, $editingContextId, $contextValues, $pageError, $_SERVER['SCRIPT_NAME']
        );
    } elseif (!empty($_SESSION['cbt_admin_logged_in']) && $action === 'remove_member') {
        $memberId = filter_var($_POST['question_id'] ?? 0, FILTER_VALIDATE_INT);
        $contextId = filter_var($_POST['context_id'] ?? 0, FILTER_VALIDATE_INT);
        if ($memberId === false || $memberId < 1 || $contextId === false || $contextId < 1) {
            $pageError = 'Please select a valid member question to remove.';
        } else {
            try {
                require_once __DIR__ . '/cbt_db.php';
                $result = cbt_admin_delete_question($pdo, (int) $memberId);
                if ($result['deleted_rows'] > 0) {
                    admin_shared_delete_answer_file($result['answer_video_path']);
                    admin_shared_delete_image_file($result['question_image_path']);
                }
                $_SESSION['cbt_admin_flash'] = $result['deleted_rows'] > 0
                    ? 'Member question #' . (int) $memberId . ' was removed.'
                    : 'No member question was removed; it may already be gone.';
                header('Location: ' . $_SERVER['SCRIPT_NAME'] . '?edit_context=' . (int) $contextId);
                exit;
            } catch (Throwable $error) {
                error_log('Shared member delete failed: ' . $error->getMessage());
                $pageError = 'The member question could not be removed. Please try again.';
            }
        }
    } elseif (!empty($_SESSION['cbt_admin_logged_in']) && in_array($action, ['add_member', 'save_member'], true)) {
        $contextId = filter_var($_POST['context_id'] ?? 0, FILTER_VALIDATE_INT);
        $memberId = filter_var($_POST['question_id'] ?? 0, FILTER_VALIDATE_INT);
        if ($contextId === false || $contextId < 1) {
            $pageError = 'Please choose a shared text first.';
        } else {
            $values = [
                'question_text' => str_replace(["\r\n", "\r"], "\n", (string) ($_POST['question_text'] ?? '')),
                'option_a' => trim((string) ($_POST['option_a'] ?? '')),
                'option_b' => trim((string) ($_POST['option_b'] ?? '')),
                'option_c' => trim((string) ($_POST['option_c'] ?? '')),
                'option_d' => trim((string) ($_POST['option_d'] ?? '')),
                'correct_option' => $_POST['correct_option'] ?? null,
            ];
            $errors = admin_shared_member_errors($values);
            if ($errors) {
                $pageError = implode(' ', $errors);
            } else {
                try {
                    require_once __DIR__ . '/cbt_db.php';
                    $contextRow = cbt_context_fetch($pdo, (int) $contextId);
                    if ($contextRow === null) {
                        throw new RuntimeException('That shared text no longer exists. Refresh the page and try again.');
                    }
                    $values['subject_id'] = (int) $contextRow['subject_id'];
                    $values['exam_category_id'] = (int) $contextRow['exam_category_id'];
                    $values['exam_year'] = (int) $contextRow['exam_year'];
                    $values['answer_explanation'] = null;
                    $values['is_active'] = 0;
                    $oldVideoPath = null;
                    $oldImagePath = null;
                    if ($action === 'save_member') {
                        if ($memberId === false || $memberId < 1) {
                            throw new RuntimeException('Please select a valid member question.');
                        }
                        $existing = $pdo->prepare('SELECT * FROM questions WHERE id = :id AND context_id = :context_id');
                        $existing->execute([':id' => $memberId, ':context_id' => $contextId]);
                        $row = $existing->fetch(PDO::FETCH_ASSOC);
                        if ($row === false) {
                            throw new RuntimeException('That member question no longer belongs to this shared text.');
                        }
                        $values = array_merge(admin_shared_member_values($row), $values);
                        $oldVideoPath = $row['answer_video_path'] !== null ? (string) $row['answer_video_path'] : null;
                        $oldImagePath = $row['question_image_path'] !== null ? (string) $row['question_image_path'] : null;
                    }

                    $removeVideo = $action === 'save_member' && isset($_POST['remove_answer_video']);
                    $removeImage = $action === 'save_member' && isset($_POST['remove_question_image']);
                    $answerVideoPath = $removeVideo ? null : $oldVideoPath;
                    $questionImagePath = $removeImage ? null : $oldImagePath;
                    $newVideoPath = null;
                    $newImagePath = null;
                    if (
                        isset($_FILES['answer_video'])
                        && (int) ($_FILES['answer_video']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
                    ) {
                        $answerVideoPath = admin_shared_save_answer_upload($_FILES['answer_video']);
                        $newVideoPath = $answerVideoPath;
                    }
                    if (
                        isset($_FILES['question_image'])
                        && (int) ($_FILES['question_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
                    ) {
                        $questionImagePath = admin_shared_save_image_upload($_FILES['question_image']);
                        $newImagePath = $questionImagePath;
                    }
                    $values['answer_video_path'] = $answerVideoPath;
                    $values['question_image_path'] = $questionImagePath;
                    $mutation = cbt_admin_mutate_question(
                        $pdo,
                        $action === 'save_member' ? 'update_question' : 'save_question',
                        $action === 'save_member' ? (int) $memberId : 0,
                        $values,
                        [
                            'context_id' => (string) $contextId,
                            'context_position' => (string) ($_POST['context_position'] ?? ''),
                            'context_slot' => (string) ($_POST['context_slot'] ?? ''),
                        ],
                        null
                    );
                    if (($removeVideo || ($newVideoPath !== null && $oldVideoPath !== null)) && $oldVideoPath !== null) {
                        admin_shared_delete_answer_file($oldVideoPath);
                    }
                    if (($removeImage || ($newImagePath !== null && $oldImagePath !== null)) && $oldImagePath !== null) {
                        admin_shared_delete_image_file($oldImagePath);
                    }
                    $_SESSION['cbt_admin_flash'] = $action === 'save_member'
                        ? 'Member question #' . $mutation['question_id'] . ' updated.'
                        : 'Member question #' . $mutation['question_id'] . ' added.';
                    header('Location: ' . $_SERVER['SCRIPT_NAME'] . '?edit_context=' . (int) $contextId);
                    exit;
                } catch (Throwable $error) {
                    error_log('Shared member save failed: ' . $error->getMessage());
                    $pageError = $error->getMessage();
                }
            }
        }
    }
}

$isLoggedIn = !empty($_SESSION['cbt_admin_logged_in']);

if ($isLoggedIn) {
    try {
        require_once __DIR__ . '/cbt_db.php';
        $subjects = $pdo->query('SELECT id, subject_name FROM subjects WHERE is_active = 1 ORDER BY subject_name')->fetchAll();
        $categories = $pdo->query('SELECT id, category_name FROM exam_category WHERE is_active = 1 and id <= 10 ORDER BY category_name')->fetchAll();
        $contextPageData = cbt_admin_context_page_data(
            $pdo,
            $categories,
            $_SERVER['REQUEST_METHOD'],
            $_GET,
            $editingContextId,
            $contextValues
        );
        $contexts = $contextPageData['contexts'];
        $contextOptions = $contextPageData['context_options'];
        $contextCategories = $contextPageData['context_categories'];
        $contextSchemaAvailable = $contextPageData['schema_available'];
        $editingContextId = $contextPageData['editing_context_id'];
        $contextValues = $contextPageData['context_values'];
        $contextPage = $contextPageData['context_page'];
        $contextTotal = $contextPageData['context_total'];
        $contextTotalPages = $contextPageData['context_total_pages'];
        $contextPageSize = $contextPageData['context_page_size'];
        if ($contextPageData['error'] !== '') {
            $pageError = $contextPageData['error'];
        }
        if ($editingContextId > 0) {
            $memberStmt = $pdo->prepare(
                'SELECT id, context_position, context_slot, question_text, option_a, option_b, option_c,
                        option_d, correct_option, is_active, answer_video_path, question_image_path
                 FROM questions WHERE context_id = :context_id
                 ORDER BY context_position, id'
            );
            $memberStmt->execute([':context_id' => $editingContextId]);
            $members = $memberStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        if ($contextSchemaAvailable) {
            $recentSharedTotal = (int) $pdo->query(
                'SELECT COUNT(*) FROM questions WHERE context_id IS NOT NULL'
            )->fetchColumn();
            $recentSharedTotalPages = max(1, (int) ceil($recentSharedTotal / $recentSharedPageSize));
            $recentSharedPage = min($recentSharedPage, $recentSharedTotalPages);
            $recentSharedOffset = ($recentSharedPage - 1) * $recentSharedPageSize;
            $recentSharedStmt = $pdo->query(sprintf(
                'SELECT q.id, q.question_text, q.context_id, q.context_position, q.context_slot,
                        q.is_active, q.exam_year, q.subject_id, c.title AS context_title
                 FROM questions q LEFT JOIN question_contexts c ON c.id = q.context_id
                 WHERE q.context_id IS NOT NULL
                 ORDER BY q.id DESC LIMIT %d OFFSET %d',
                $recentSharedPageSize,
                $recentSharedOffset
            ));
            $recentShared = $recentSharedStmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (PDOException $error) {
        error_log('Shared text page loading failed: ' . $error->getMessage());
        $pageError = 'Shared text did not load. Ask for help.';
    }
}

$page_title = 'Shared Text Administration | Skymenu CBT';
if (is_file(__DIR__ . '/header.php')) {
    include __DIR__ . '/header.php';
}
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
.admin-btn:hover{background:#0d3b66}.admin-btn-muted{background:#e9edf2;color:#263445}.admin-btn-edit{background:#1769aa}.admin-btn-delete{background:#b42318}
.admin-alert{padding:12px 15px;border-radius:8px;margin-bottom:16px;line-height:1.5}
.admin-error{background:#ffe8e8;color:#8e1717;border:1px solid #f2bcbc}.admin-success{background:#e3f7eb;color:#12633a;border:1px solid #bce6cc}.admin-note{color:#536273;line-height:1.55;font-size:14px}
.admin-correct{display:flex;gap:12px;flex-wrap:wrap}.admin-correct label{border:1px solid #d5dfe9;border-radius:8px;padding:11px 14px;display:flex;gap:8px;align-items:center;cursor:pointer}
.admin-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.admin-table-wrap{overflow-x:auto}.admin-table{border-collapse:collapse;width:100%;font-size:14px}.admin-table th,.admin-table td{text-align:left;vertical-align:top;padding:11px;border-bottom:1px solid #e6ebf1}.admin-table th{background:#f7f9fc;color:#34465a}.admin-status{font-weight:700}.admin-status.active{color:#147344}.admin-status.inactive{color:#a33b18}
.admin-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:18px}.admin-pagination-summary{font-size:14px;color:#536273}.admin-pagination-links{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.admin-page-link{display:inline-block;min-width:36px;text-align:center;box-sizing:border-box;padding:8px 10px;border:1px solid #d5dfe9;border-radius:7px;background:#fff;color:#1769aa;text-decoration:none;font-weight:700}.admin-page-link:hover{background:#edf4fb}.admin-page-link.active{background:#1769aa;border-color:#1769aa;color:#fff}
.member-row{border:1px solid #e1e7ef;border-radius:10px;padding:14px;margin-bottom:14px;background:#fbfcfe}
.member-media img,.member-media video{display:block;max-width:100%;max-height:220px;width:auto;height:auto;border:1px solid #d5dfe9;border-radius:8px;padding:4px;background:#f7f9fc;margin:8px 0}
.member-media label{display:flex;gap:8px;align-items:center;font-weight:700}
@media(max-width:650px){.admin-grid{grid-template-columns:1fr}.admin-card{padding:18px}.admin-page{padding:20px 10px}}
</style>

<main class="admin-page">
<div class="admin-wrap">
    <section class="admin-hero">
        <h1><font color="white">Shared Text Administration</font></h1>
        <p>Manage reading and gap passages and the questions linked to them.</p>
        <p><a href="admin_questions.php" style="color:#fff;font-weight:700">&larr; Back to standalone questions</a></p>
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
            <form method="post">
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
        <div class="admin-topline" style="margin-bottom:14px">
            <form method="post">
                <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                <input type="hidden" name="action" value="logout">
                <button class="admin-btn admin-btn-muted" type="submit">Log out</button>
            </form>
        </div>

        <?php if ($contextSchemaAvailable): ?>
            <section class="admin-card">
                <h2>Recent shared questions</h2>
                <p class="admin-note">Every question that belongs to a shared text, newest first.</p>
                <?php if (!$recentShared): ?>
                    <p class="admin-note">No shared-text questions have been saved yet.</p>
                <?php else: ?>
                    <div class="admin-table-wrap">
                        <table class="admin-table">
                            <thead>
                                <tr><th>#</th><th>Question</th><th>Shared text</th><th>Pos</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentShared as $sharedRow): ?>
                                    <tr>
                                        <td><?php echo (int) $sharedRow['id']; ?></td>
                                        <td style="max-width:420px;overflow-wrap:anywhere"><?php echo h((string) $sharedRow['question_text']); ?></td>
                                        <td>
                                            <a href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?edit_context=<?php echo (int) $sharedRow['context_id']; ?>">
                                                #<?php echo (int) $sharedRow['context_id']; ?><?php echo $sharedRow['context_title'] !== null ? ': ' . h((string) $sharedRow['context_title']) : ''; ?> - <?php echo (int) $sharedRow['exam_year']; ?>
                                            </a>
                                        </td>
                                        <td><?php echo (int) $sharedRow['context_position']; ?><?php if ($sharedRow['context_slot'] !== null): ?> / gap <?php echo (int) $sharedRow['context_slot']; ?><?php endif; ?></td>
                                        <td><span class="admin-status <?php echo (int) $sharedRow['is_active'] === 1 ? 'active' : 'inactive'; ?>"><?php echo (int) $sharedRow['is_active'] === 1 ? 'Active' : 'Inactive'; ?></span></td>
                                        <td>
                                            <a class="admin-btn admin-btn-edit" style="display:inline-block;text-decoration:none;padding:8px 12px" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?edit_context=<?php echo (int) $sharedRow['context_id']; ?>">Edit</a>
                                            <form method="post" style="display:inline" onsubmit="return confirm('Remove question #<?php echo (int) $sharedRow['id']; ?> from this shared text?');">
                                                <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                                                <input type="hidden" name="action" value="remove_member">
                                                <input type="hidden" name="context_id" value="<?php echo (int) $sharedRow['context_id']; ?>">
                                                <input type="hidden" name="question_id" value="<?php echo (int) $sharedRow['id']; ?>">
                                                <button class="admin-btn admin-btn-delete" type="submit" style="padding:8px 12px">Remove</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    <?php if ($recentSharedTotalPages > 1): ?>
                        <div class="admin-pagination">
                            <span class="admin-pagination-summary">Showing <?php echo $recentSharedOffset + 1; ?>&ndash;<?php echo min($recentSharedOffset + count($recentShared), $recentSharedTotal); ?> of <?php echo $recentSharedTotal; ?> questions</span>
                            <div class="admin-pagination-links">
                                <?php for ($sharedPageNumber = 1; $sharedPageNumber <= $recentSharedTotalPages; $sharedPageNumber++): ?>
                                    <a class="admin-page-link<?php echo $sharedPageNumber === $recentSharedPage ? ' active' : ''; ?>" href="<?php echo h($_SERVER['SCRIPT_NAME']); ?>?shared_page=<?php echo $sharedPageNumber; ?>"><?php echo $sharedPageNumber; ?></a>
                                <?php endfor; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </section>
        <?php endif; ?>

        <?php if ($contextSchemaAvailable && $editingContextId === 0): ?>
            <section class="admin-card" id="owner_shared_paste">
                <h2>Paste Shared Text</h2>
                <p class="admin-note">Paste the shared text together with its questions and answer list. <strong>Use Paste</strong> fills the draft editor below; save it, then tap <strong>Fill Next Draft</strong> for the next shared text in the same paste. A saved shared text is never overwritten.</p>
                <div class="admin-field">
                    <label for="owner_shared_text">Paste here</label>
                    <textarea id="owner_shared_text" rows="8" autocomplete="off"></textarea>
                </div>
                <button type="button" class="admin-btn" id="owner_shared_use">Use Paste</button>
                <button type="button" class="admin-btn admin-btn-muted" id="owner_shared_next">Fill Next Draft</button>
                <div class="admin-note" id="owner_shared_status" style="margin-top:10px"></div>
            </section>
        <?php endif; ?>

        <?php echo cbt_admin_render_context_management(get_defined_vars()); ?>

        <?php if ($editingContextId > 0): ?>
            <section class="admin-card">
                <h2>Questions in shared text #<?php echo (int) $editingContextId; ?></h2>
                <?php if (!$members): ?>
                    <p class="admin-note">No questions are linked yet.</p>
                <?php else: ?>
                    <?php foreach ($members as $member): ?>
                        <form method="post" class="member-row" enctype="multipart/form-data">
                            <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                            <input type="hidden" name="action" value="save_member">
                            <input type="hidden" name="context_id" value="<?php echo (int) $editingContextId; ?>">
                            <input type="hidden" name="question_id" value="<?php echo (int) $member['id']; ?>">
                            <p class="admin-note"><strong>Question #<?php echo (int) $member['id']; ?></strong></p>
                            <div class="admin-grid">
                                <div class="admin-field">
                                    <label>Question</label>
                                    <textarea name="question_text" required><?php echo h((string) $member['question_text']); ?></textarea>
                                </div>
                                <div class="admin-field">
                                    <label>Position</label>
                                    <input name="context_position" type="number" min="1" max="500" value="<?php echo h((string) $member['context_position']); ?>" required>
                                    <label style="margin-top:10px">Gap number (gap passages only)</label>
                                    <input name="context_slot" type="number" min="1" max="999" value="<?php echo h((string) $member['context_slot']); ?>">
                                </div>
                            </div>
                            <div class="admin-grid">
                                <div class="admin-field"><label>A</label><input name="option_a" value="<?php echo h((string) $member['option_a']); ?>" required></div>
                                <div class="admin-field"><label>B</label><input name="option_b" value="<?php echo h((string) $member['option_b']); ?>" required></div>
                                <div class="admin-field"><label>C</label><input name="option_c" value="<?php echo h((string) $member['option_c']); ?>" required></div>
                                <div class="admin-field"><label>D</label><input name="option_d" value="<?php echo h((string) $member['option_d']); ?>" required></div>
                            </div>
                            <div class="admin-field">
                                <label>Correct answer</label>
                                <div class="admin-correct">
                                    <?php foreach (['A', 'B', 'C', 'D'] as $index => $letter): ?>
                                        <label><input type="radio" name="correct_option" value="<?php echo $index; ?>" <?php echo (int) $member['correct_option'] === $index ? 'checked' : ''; ?> required> <?php echo $letter; ?></label>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <div class="admin-grid">
                                <div class="admin-field member-media">
                                    <label for="member_video_<?php echo (int) $member['id']; ?>">Answer illustration (optional)</label>
                                    <input id="member_video_<?php echo (int) $member['id']; ?>" name="answer_video" type="file" accept="video/mp4,video/webm,video/ogg,image/jpeg,image/png,image/webp,image/gif">
                                    <p class="admin-note">Video: MP4, WebM, OGV/OGG up to 50 MB. Picture: JPG, PNG, WebP, GIF up to 8 MB. Uploading replaces the current file.</p>
                                    <?php if (is_string($member['answer_video_path']) && admin_shared_is_answer_path($member['answer_video_path'])): ?>
                                        <?php if (admin_shared_is_answer_video($member['answer_video_path'])): ?>
                                            <video controls preload="metadata"><source src="<?php echo h($member['answer_video_path']); ?>">Your browser does not support video playback.</video>
                                        <?php else: ?>
                                            <img src="<?php echo h($member['answer_video_path']); ?>" alt="Current answer illustration">
                                        <?php endif; ?>
                                        <label><input type="checkbox" name="remove_answer_video" value="1" style="width:auto"> Remove current answer illustration</label>
                                    <?php endif; ?>
                                </div>
                                <div class="admin-field member-media">
                                    <label for="member_image_<?php echo (int) $member['id']; ?>">Question picture (optional)</label>
                                    <input id="member_image_<?php echo (int) $member['id']; ?>" name="question_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
                                    <p class="admin-note">JPG, PNG, WebP, or GIF up to 8 MB. Uploading replaces the current picture.</p>
                                    <?php if (is_string($member['question_image_path']) && admin_shared_is_image_path($member['question_image_path'])): ?>
                                        <img src="<?php echo h($member['question_image_path']); ?>" alt="Current question picture">
                                        <label><input type="checkbox" name="remove_question_image" value="1" style="width:auto"> Remove current question picture</label>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <button class="admin-btn" type="submit">Save Question</button>
                        </form>
                        <form method="post" onsubmit="return confirm('Remove question #<?php echo (int) $member['id']; ?> from this shared text?');" style="margin:-8px 0 14px">
                            <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                            <input type="hidden" name="action" value="remove_member">
                            <input type="hidden" name="context_id" value="<?php echo (int) $editingContextId; ?>">
                            <input type="hidden" name="question_id" value="<?php echo (int) $member['id']; ?>">
                            <button class="admin-btn admin-btn-delete" type="submit">Remove Question</button>
                        </form>
                    <?php endforeach; ?>
                <?php endif; ?>

                <h2 style="margin-top:22px">Add a question to this shared text</h2>
                <form method="post" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?php echo h($_SESSION['cbt_admin_csrf']); ?>">
                    <input type="hidden" name="action" value="add_member">
                    <input type="hidden" name="context_id" value="<?php echo (int) $editingContextId; ?>">
                    <div class="admin-grid">
                        <div class="admin-field">
                            <label for="new_question_text">Question</label>
                            <textarea id="new_question_text" name="question_text" required></textarea>
                        </div>
                        <div class="admin-field">
                            <label for="new_position">Position</label>
                            <input id="new_position" name="context_position" type="number" min="1" max="500" value="<?php echo count($members) + 1; ?>" required>
                            <label for="new_slot" style="margin-top:10px">Gap number (gap passages only)</label>
                            <input id="new_slot" name="context_slot" type="number" min="1" max="999">
                        </div>
                    </div>
                    <div class="admin-grid">
                        <div class="admin-field"><label for="new_a">A</label><input id="new_a" name="option_a" required></div>
                        <div class="admin-field"><label for="new_b">B</label><input id="new_b" name="option_b" required></div>
                        <div class="admin-field"><label for="new_c">C</label><input id="new_c" name="option_c" required></div>
                        <div class="admin-field"><label for="new_d">D</label><input id="new_d" name="option_d" required></div>
                    </div>
                    <div class="admin-field">
                        <label>Correct answer</label>
                        <div class="admin-correct">
                            <?php foreach (['A', 'B', 'C', 'D'] as $index => $letter): ?>
                                <label><input type="radio" name="correct_option" value="<?php echo $index; ?>" required> <?php echo $letter; ?></label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="admin-grid">
                        <div class="admin-field member-media">
                            <label for="new_member_video">Answer illustration (optional)</label>
                            <input id="new_member_video" name="answer_video" type="file" accept="video/mp4,video/webm,video/ogg,image/jpeg,image/png,image/webp,image/gif">
                            <p class="admin-note">Video: MP4, WebM, OGV/OGG up to 50 MB. Picture: JPG, PNG, WebP, GIF up to 8 MB.</p>
                        </div>
                        <div class="admin-field member-media">
                            <label for="new_member_image">Question picture (optional)</label>
                            <input id="new_member_image" name="question_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
                            <p class="admin-note">JPG, PNG, WebP, or GIF up to 8 MB.</p>
                        </div>
                    </div>
                    <button class="admin-btn" type="submit">Add Question</button>
                </form>
            </section>
        <?php else: ?>
            <p class="admin-note">Choose Edit on a saved shared text to manage its questions.</p>
        <?php endif; ?>
    <?php endif; ?>
</div>
</main>

<script src="src/parser/core.js?v=2.3.3"></script><script src="src/owner-tool/render.js?v=2.3.2g"></script><script src="src/owner-tool/shared-texts.js?v=2.3.3e"></script><script src="src/owner-tool/shared-paste.js?v=2.3.3e"></script>
<?php if (is_file(__DIR__ . '/footer.php')) { include __DIR__ . '/footer.php'; } ?>
