#!/usr/bin/env bash
set -euo pipefail

[[ "${EL01_DISPOSABLE_MYSQL:-}" == "1" ]] || {
    printf 'FAIL: set EL01_DISPOSABLE_MYSQL=1 only for a disposable server.\n' >&2
    exit 1
}

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
MYSQL_BIN="${MYSQL_BIN:-mysql}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_ARGS=(--batch --skip-column-names --default-character-set=utf8mb4)
[[ -z "${MYSQL_SOCKET:-}" ]] || MYSQL_ARGS+=(--socket="$MYSQL_SOCKET")
[[ -z "${MYSQL_HOST:-}" ]] || MYSQL_ARGS+=(--host="$MYSQL_HOST")
[[ -z "${MYSQL_PORT:-}" ]] || MYSQL_ARGS+=(--port="$MYSQL_PORT")
[[ -z "${MYSQL_USER:-}" ]] || MYSQL_ARGS+=(--user="$MYSQL_USER")

run_mysql() {
    MYSQL_PWD="$MYSQL_PASSWORD" "$MYSQL_BIN" "${MYSQL_ARGS[@]}" "$@"
}

version="$(run_mysql -e 'SELECT VERSION();')"
if [[ "$version" != 8.0.41* && "${EL01_ALLOW_NON_TARGET:-}" != "1" ]]; then
    printf 'FAIL: MySQL 8.0.41 required; found %s.\n' "$version" >&2
    exit 1
fi
if [[ "$version" != 8.0.41* ]]; then
    printf 'NON-TARGET PRELIMINARY RUN: %s\n' "$version"
fi

prefix="el01_$$_${RANDOM}"
databases=("${prefix}_absent" "${prefix}_existing" "${prefix}_collision" "${prefix}_schema")
cleanup() {
    set +e
    for database in "${databases[@]}"; do
        run_mysql -e "DROP DATABASE IF EXISTS \`$database\`;" >/dev/null 2>&1
    done
}
trap cleanup EXIT

for database in "${databases[@]}"; do
    run_mysql -e "CREATE DATABASE \`$database\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    run_mysql "$database" < "$ROOT/deployed/sql/base-schema.working.sql"
done

passes=0
check_equal() {
    local actual="$1"
    local expected="$2"
    local label="$3"
    if [[ "$actual" != "$expected" ]]; then
        printf 'FAIL: %s\nexpected: %s\nactual:   %s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
    passes=$((passes + 1))
    printf 'PASS: %s\n' "$label"
}

absent_db="${databases[0]}"
run_mysql "$absent_db" -e "
    INSERT INTO subjects (id, subject_name, is_active)
    VALUES (6, 'English Language', 1), (12, 'English (Oral)', 1);
    ALTER TABLE subjects AUTO_INCREMENT = 42;"
run_mysql "$absent_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"
check_equal "$(run_mysql "$absent_db" -e "
    SELECT CONCAT(id, '|', is_active)
    FROM subjects
    WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');")" \
    '42|1' 'absent target receives a generated active ID and default-limit ID'

run_mysql "$absent_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"
check_equal "$(run_mysql "$absent_db" -e "
    SELECT CONCAT(COUNT(*), '|', MIN(id), '|', MIN(is_active))
    FROM subjects
    WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');")" \
    '1|42|1' 'forward rerun preserves one exact active row and its ID'

run_mysql "$absent_db" -e "
    INSERT INTO exam_category (id, category_name, is_active) VALUES (1, 'JAMB', 1);
    INSERT INTO questions
        (subject_id, exam_category_id, exam_year, question_text, constant_text,
         option_a, option_b, option_c, option_d, correct_option, is_active, practice_title)
    VALUES
        (42, 1, 2026, 'Sentinel question', 'Sentinel passage',
         'A', 'B', 'C', 'D', 0, 1, '');
    CREATE TABLE cbt_exam_attempts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        subject_id INT UNSIGNED NOT NULL
    );
    INSERT INTO cbt_exam_attempts (subject_id) VALUES (42);"
run_mysql "$absent_db" < "$ROOT/deployed/sql/04-english-lexis-structure-rollback.sql"
run_mysql "$absent_db" < "$ROOT/deployed/sql/04-english-lexis-structure-rollback.sql"
check_equal "$(run_mysql "$absent_db" -e "
    SELECT CONCAT(s.id, '|', s.is_active, '|',
        (SELECT COUNT(*) FROM questions), '|',
        (SELECT COUNT(*) FROM cbt_exam_attempts))
    FROM subjects s
    WHERE HEX(s.subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');")" \
    '42|0|1|1' 'rollback and rerun deactivate without deleting related rows'

existing_db="${databases[1]}"
run_mysql "$existing_db" -e "
    INSERT INTO subjects (id, subject_name, description, is_active, created_at)
    VALUES (77, 'English (Lexis & Structure)', 'Keep me', 0, '2020-01-02 03:04:05');"
run_mysql "$existing_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"
check_equal "$(run_mysql "$existing_db" -e "
    SELECT CONCAT(id, '|', description, '|', is_active, '|', created_at)
    FROM subjects
    WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');")" \
    '77|Keep me|1|2020-01-02 03:04:05' 'inactive exact row is reactivated without changing existing fields'

run_mysql "$existing_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"
check_equal "$(run_mysql "$existing_db" -e "
    SELECT CONCAT(id, '|', description, '|', is_active, '|', created_at)
    FROM subjects
    WHERE HEX(subject_name) = HEX(_utf8mb4'English (Lexis & Structure)');")" \
    '77|Keep me|1|2020-01-02 03:04:05' 'active exact row remains unchanged on rerun'

collision_db="${databases[2]}"
run_mysql "$collision_db" -e "
    INSERT INTO subjects (subject_name, description, is_active)
    VALUES ('english (Lexis & Structure)', 'Near name', 1);"
if run_mysql "$collision_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"; then
    printf 'FAIL: forward operation accepted a collation-only collision.\n' >&2
    exit 1
fi
check_equal "$(run_mysql "$collision_db" -e 'SELECT CONCAT(COUNT(*), "|", MIN(description), "|", MIN(is_active)) FROM subjects;')" \
    '1|Near name|1' 'forward refuses a collation-equivalent byte-different row before writing'

if run_mysql "$collision_db" < "$ROOT/deployed/sql/04-english-lexis-structure-rollback.sql"; then
    printf 'FAIL: rollback operation accepted a collation-only collision.\n' >&2
    exit 1
fi
check_equal "$(run_mysql "$collision_db" -e 'SELECT CONCAT(COUNT(*), "|", MIN(description), "|", MIN(is_active)) FROM subjects;')" \
    '1|Near name|1' 'rollback refuses a collation-only collision before writing'

schema_db="${databases[3]}"
run_mysql "$schema_db" -e 'ALTER TABLE subjects DROP INDEX uq_subjects_subject_name;'
if run_mysql "$schema_db" < "$ROOT/deployed/sql/03-english-lexis-structure.sql"; then
    printf 'FAIL: forward operation accepted a missing unique-name contract.\n' >&2
    exit 1
fi
check_equal "$(run_mysql "$schema_db" -e 'SELECT COUNT(*) FROM subjects;')" \
    '0' 'forward refuses a missing unique subject-name contract before writing'

printf 'PASS: %d SQL operation checks on %s\n' "$passes" "$version"
