#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
HOST="${OCR_PHONE_STAGING_HOST:-127.0.0.1}"
PORT="${OCR_PHONE_STAGING_PORT:-8080}"
USERNAME="${OCR_PHONE_STAGING_USERNAME:-staging}"
PASSWORD="${OCR_PHONE_STAGING_PASSWORD:-phone-test}"
TMP_BASE="${OCR_PHONE_STAGING_TMP:-${HOME:?HOME is required}/tmp}"
STAGING_ROOT="$TMP_BASE/ocr-phone-staging-root"
DATABASE="$TMP_BASE/ocr-phone-staging.sqlite"
PID_FILE="$TMP_BASE/ocr-phone-staging.pid"
LOG_FILE="$TMP_BASE/ocr-phone-staging.log"
URL="http://$HOST:$PORT/admin_questions.php"

fail() {
    printf 'Phone staging error: %s\n' "$*" >&2
    exit 1
}

for command_name in php curl cp mv mkdir ln ps nohup; do
    command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required."
done

[[ "$PORT" =~ ^[0-9]+$ ]] && ((PORT >= 1 && PORT <= 65535)) \
    || fail "OCR_PHONE_STAGING_PORT must be between 1 and 65535."

mkdir -p "$TMP_BASE" "$STAGING_ROOT"

copy_current() {
    local source_file="$1"
    local target_file="$2"
    local temporary_file="$target_file.new.$$"
    cp "$source_file" "$temporary_file"
    mv -f "$temporary_file" "$target_file"
}

for filename in admin_questions.php admin_context.php context_lib.php render.php; do
    [[ -f "$ROOT/deployed/$filename" ]] || fail "Missing deployed/$filename."
    copy_current "$ROOT/deployed/$filename" "$STAGING_ROOT/$filename"
done
copy_current "$SCRIPT_DIR/phone-staging/cbt_db.php" "$STAGING_ROOT/cbt_db.php"

if [[ -e "$STAGING_ROOT/src" && ! -L "$STAGING_ROOT/src" ]]; then
    fail "$STAGING_ROOT/src exists and is not the staging symlink."
fi
ln -sfn "$ROOT/src" "$STAGING_ROOT/src"

if [[ -f "$PID_FILE" ]]; then
    read -r existing_pid < "$PID_FILE" || true
    if [[ "${existing_pid:-}" =~ ^[0-9]+$ ]] && kill -0 "$existing_pid" 2>/dev/null; then
        command_line="$(ps -p "$existing_pid" -o args= 2>/dev/null || true)"
        case "$command_line" in
            *"php -S $HOST:$PORT -t $STAGING_ROOT"*)
                curl --fail --silent --show-error --max-time 3 "$URL" >/dev/null \
                    || fail "The staging process is running but $URL did not respond."
                printf 'Phone staging files refreshed.\nURL: %s\nLogin: %s\nPassword: %s\n' \
                    "$URL" "$USERNAME" "$PASSWORD"
                exit 0
                ;;
            *)
                fail "PID $existing_pid belongs to another process; remove $PID_FILE only after checking it."
                ;;
        esac
    fi
    rm -f "$PID_FILE"
fi

password_hash="$(PHONE_STAGING_PASSWORD="$PASSWORD" php -r \
    'echo password_hash((string) getenv("PHONE_STAGING_PASSWORD"), PASSWORD_DEFAULT);')"

nohup env \
    CBT_ADMIN_USERNAME="$USERNAME" \
    CBT_ADMIN_PASSWORD_HASH="$password_hash" \
    OCR_PHONE_STAGING_DB="$DATABASE" \
    php -S "$HOST:$PORT" -t "$STAGING_ROOT" \
    </dev/null >"$LOG_FILE" 2>&1 &
server_pid=$!
printf '%s\n' "$server_pid" > "$PID_FILE"

for _ in {1..50}; do
    if curl --fail --silent --show-error --max-time 1 "$URL" >/dev/null 2>&1; then
        printf 'Phone staging started.\nURL: %s\nLogin: %s\nPassword: %s\nPID: %s\nLog: %s\n' \
            "$URL" "$USERNAME" "$PASSWORD" "$server_pid" "$LOG_FILE"
        exit 0
    fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
        break
    fi
    sleep 0.1
done

kill "$server_pid" 2>/dev/null || true
rm -f "$PID_FILE"
fail "The server did not start. Check $LOG_FILE."
