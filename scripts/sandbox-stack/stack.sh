#!/usr/bin/env bash
# Local Supabase-equivalent stack for environments where Docker images cannot be
# pulled (such as Claude's sandbox). It runs the real Supabase Auth server
# (GoTrue) and PostgREST against a local PostgreSQL 16, behind a tiny gateway,
# and applies supabase/migrations exactly as the Supabase CLI would.
#
# Where Docker works, use the official stack instead: `pnpm dlx supabase start`.
#
#   scripts/sandbox-stack/stack.sh up      start everything (idempotent)
#   scripts/sandbox-stack/stack.sh down    stop everything
#   scripts/sandbox-stack/stack.sh reset   wipe the database and start fresh
#   scripts/sandbox-stack/stack.sh env     print variables for .env.local
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$ROOT/scripts/sandbox-stack"
STATE="$ROOT/.sandbox-stack"
BIN="$STATE/bin"
LOGS="$STATE/logs"
PGDATA="$STATE/pgdata"
PGBIN="/usr/lib/postgresql/16/bin"

GOTRUE_VERSION="v2.195.0"
GOTRUE_SHA256="26256174b8f30ddcecadd41e392cb73132b837226ec764f8a7b45f7d78a1c8d5"
POSTGREST_VERSION="v13.0.7"
POSTGREST_SHA256="4153f81ccc40e7b735edc89cd84b49da25ba27eb37d57c7f6a82c9005a0b762b"

PG_PORT=54322
GATEWAY_PORT=54321
GOTRUE_PORT=54329
POSTGREST_PORT=54330
SMTP_PORT=54325
MAIL_API_PORT=54324
SITE_URL="${SITE_URL:-http://localhost:3100}"

JWT_SECRET="$(node -e 'import("'"$HERE"'/keys.mjs").then(m=>process.stdout.write(m.SANDBOX_JWT_SECRET))')"
ANON_KEY="$(node "$HERE/keys.mjs" anon)"

psql_su() { PGPASSWORD=postgres psql -h 127.0.0.1 -p "$PG_PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

wait_for() { # url, name
  for _ in $(seq 1 60); do curl -fsS -o /dev/null "$1" 2>/dev/null && return 0; sleep 0.5; done
  echo "Timed out waiting for $2 ($1). See $LOGS." >&2
  exit 1
}

download() {
  mkdir -p "$BIN"
  if [[ ! -x "$BIN/gotrue/auth" ]]; then
    local f="$BIN/gotrue.tgz"
    curl -sSfL -o "$f" "https://github.com/supabase/auth/releases/download/$GOTRUE_VERSION/auth-$GOTRUE_VERSION-x86.tar.gz"
    echo "$GOTRUE_SHA256  $f" | sha256sum --check --quiet
    mkdir -p "$BIN/gotrue" && tar -xzf "$f" -C "$BIN/gotrue" && rm "$f"
  fi
  if [[ ! -x "$BIN/postgrest" ]]; then
    local f="$BIN/postgrest.tar.xz"
    curl -sSfL -o "$f" "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x86-64.tar.xz"
    echo "$POSTGREST_SHA256  $f" | sha256sum --check --quiet
    tar -xJf "$f" -C "$BIN" && rm "$f"
  fi
}

start_postgres() {
  mkdir -p "$STATE" "$LOGS"
  if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
    mkdir -p "$PGDATA" && chown postgres:postgres "$PGDATA" "$STATE"
    echo postgres > "$STATE/pwfile" && chown postgres "$STATE/pwfile"
    su postgres -s /bin/bash -c "$PGBIN/initdb -D '$PGDATA' -U postgres --pwfile='$STATE/pwfile' -A scram-sha-256 -E UTF8 --locale=C.UTF-8" > "$LOGS/initdb.log"
    rm -f "$STATE/pwfile"
  fi
  chown postgres:postgres "$LOGS"
  if ! su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D '$PGDATA' status" >/dev/null 2>&1; then
    su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D '$PGDATA' -l '$LOGS/postgres.log' -o '-p $PG_PORT -k /tmp -c listen_addresses=127.0.0.1' -w start" >/dev/null
  fi
  if ! psql_su -tAc "select 1 from pg_roles where rolname = 'authenticator'" | grep -q 1; then
    psql_su -f "$HERE/bootstrap.sql"
  fi
}

start_mail() {
  if ! pgrep -f "$HERE/mail-sink.mjs" >/dev/null; then
    SMTP_PORT=$SMTP_PORT MAIL_API_PORT=$MAIL_API_PORT nohup node "$HERE/mail-sink.mjs" > "$LOGS/mail.log" 2>&1 < /dev/null &
  fi
  wait_for "http://127.0.0.1:$MAIL_API_PORT/messages" "mail sink"
}

gotrue_env() {
  cat <<EOF
GOTRUE_API_HOST=127.0.0.1
PORT=$GOTRUE_PORT
API_EXTERNAL_URL=http://127.0.0.1:$GATEWAY_PORT/auth/v1
GOTRUE_DB_DRIVER=postgres
DATABASE_URL=postgres://supabase_auth_admin:postgres@127.0.0.1:$PG_PORT/postgres
GOTRUE_DB_MIGRATIONS_PATH=$BIN/gotrue/migrations
GOTRUE_SITE_URL=$SITE_URL
GOTRUE_URI_ALLOW_LIST=$SITE_URL/**
GOTRUE_JWT_SECRET=$JWT_SECRET
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_PASSWORD_MIN_LENGTH=8
GOTRUE_RATE_LIMIT_EMAIL_SENT=1000
GOTRUE_SMTP_HOST=127.0.0.1
GOTRUE_SMTP_PORT=$SMTP_PORT
GOTRUE_SMTP_USER=sandbox
GOTRUE_SMTP_PASS=sandbox
GOTRUE_SMTP_ADMIN_EMAIL=no-reply@lumio.test
GOTRUE_SMTP_SENDER_NAME="Lumio sandbox"
GOTRUE_LOG_LEVEL=warn
EOF
}

start_gotrue() {
  if ! pgrep -f "$BIN/gotrue/auth serve" >/dev/null; then
    gotrue_env > "$STATE/gotrue.env"
    (set -a; source "$STATE/gotrue.env"; set +a; "$BIN/gotrue/auth" migrate > "$LOGS/gotrue-migrate.log" 2>&1)
    (set -a; source "$STATE/gotrue.env"; set +a; nohup "$BIN/gotrue/auth" serve > "$LOGS/gotrue.log" 2>&1 < /dev/null &)
  fi
  wait_for "http://127.0.0.1:$GOTRUE_PORT/health" "GoTrue"
}

apply_migrations() {
  local applied=0
  for file in "$ROOT"/supabase/migrations/*.sql; do
    [[ -e "$file" ]] || continue
    local name; name="$(basename "$file")"
    if ! psql_su -tAc "select 1 from public.sandbox_migrations where name = '$name'" | grep -q 1; then
      psql_su -1 -f "$file" -c "insert into public.sandbox_migrations(name) values ('$name')"
      echo "applied $name"; applied=1
    fi
  done
  if [[ -f "$ROOT/supabase/seed.sql" && ! -f "$STATE/seeded" ]]; then psql_su -f "$ROOT/supabase/seed.sql"; touch "$STATE/seeded"; fi
  [[ $applied -eq 1 ]] && psql_su -c "notify pgrst, 'reload schema'" || true
}

start_postgrest() {
  if ! pgrep -f "$BIN/postgrest" >/dev/null; then
    PGRST_DB_URI="postgres://authenticator:postgres@127.0.0.1:$PG_PORT/postgres" \
    PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon PGRST_JWT_SECRET="$JWT_SECRET" \
    PGRST_SERVER_HOST=127.0.0.1 PGRST_SERVER_PORT=$POSTGREST_PORT PGRST_DB_CHANNEL_ENABLED=true \
    PGRST_ADMIN_SERVER_PORT=$((POSTGREST_PORT + 1)) \
      nohup "$BIN/postgrest" > "$LOGS/postgrest.log" 2>&1 < /dev/null &
  fi
  wait_for "http://127.0.0.1:$((POSTGREST_PORT + 1))/ready" "PostgREST"
}

start_gateway() {
  if ! pgrep -f "$HERE/gateway.mjs" >/dev/null; then
    GATEWAY_PORT=$GATEWAY_PORT GOTRUE_PORT=$GOTRUE_PORT POSTGREST_PORT=$POSTGREST_PORT \
      nohup node "$HERE/gateway.mjs" > "$LOGS/gateway.log" 2>&1 < /dev/null &
  fi
  wait_for "http://127.0.0.1:$GATEWAY_PORT/auth/v1/health" "gateway"
}

print_env() {
  cat <<EOF
SUPABASE_URL=http://127.0.0.1:$GATEWAY_PORT
SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
NEXT_PUBLIC_SITE_URL=$SITE_URL
SANDBOX_MAIL_API_URL=http://127.0.0.1:$MAIL_API_PORT
EOF
}

down() {
  pkill -f "$HERE/gateway.mjs" 2>/dev/null || true
  pkill -f "$HERE/mail-sink.mjs" 2>/dev/null || true
  pkill -f "$BIN/postgrest" 2>/dev/null || true
  pkill -f "$BIN/gotrue/auth serve" 2>/dev/null || true
  if [[ -f "$PGDATA/PG_VERSION" ]]; then
    su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D '$PGDATA' -m fast stop" >/dev/null 2>&1 || true
  fi
}

case "${1:-up}" in
  up)
    download; start_postgres; start_mail; start_gotrue; apply_migrations; start_postgrest; start_gateway
    echo "Sandbox stack is up. Variables:"; print_env ;;
  down) down; echo "Sandbox stack stopped." ;;
  reset) down; rm -rf "$PGDATA" "$STATE/seeded"; "$0" up ;;
  env) print_env ;;
  migrate) apply_migrations ;;
  *) echo "usage: $0 up|down|reset|env|migrate" >&2; exit 1 ;;
esac
