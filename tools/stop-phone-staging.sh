#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

TMP_BASE="${OCR_PHONE_STAGING_TMP:-${HOME:?HOME is required}/tmp}"
STAGING_ROOT="$TMP_BASE/ocr-phone-staging-root"
PID_FILE="$TMP_BASE/ocr-phone-staging.pid"

if [[ ! -f "$PID_FILE" ]]; then
    printf 'Phone staging is not running.\n'
    exit 0
fi

read -r server_pid < "$PID_FILE" || true
if [[ ! "${server_pid:-}" =~ ^[0-9]+$ ]]; then
    printf 'Phone staging error: invalid PID file %s.\n' "$PID_FILE" >&2
    exit 1
fi

if ! kill -0 "$server_pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    printf 'Removed stale phone staging PID file.\n'
    exit 0
fi

command_line="$(ps -p "$server_pid" -o args= 2>/dev/null || true)"
case "$command_line" in
    *"php -S "*" -t $STAGING_ROOT"*) ;;
    *)
        printf 'Phone staging error: PID %s is not the staging server; it was not stopped.\n' \
            "$server_pid" >&2
        exit 1
        ;;
esac

kill "$server_pid"
for _ in {1..50}; do
    if ! kill -0 "$server_pid" 2>/dev/null; then
        rm -f "$PID_FILE"
        printf 'Phone staging stopped.\n'
        exit 0
    fi
    sleep 0.1
done

printf 'Phone staging error: PID %s did not stop; no stronger signal was sent.\n' \
    "$server_pid" >&2
exit 1
