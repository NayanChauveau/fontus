#!/usr/bin/env bash
# Local test bench for scripts/postgres-18-upgrade.sh. Needs Docker only.
# Every case runs its own throwaway Compose project (Postgres 16 + a stand-in web
# container), seeds data, runs the upgrade script against it, checks the outcome and
# removes everything it created. Production is never involved.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/scripts/postgres-18-upgrade.sh"
PG16_IMAGE="postgres:16.16-alpine@sha256:81e77a4833487b8132fe4b00bedd39dc3f74b8641e387f19312a48f7de218c2e"
PG18_IMAGE="postgres:18.7-alpine@sha256:b6972e1115a4ff8eba5d7f7d19184926d1e16d7d1136ae1e1a7ebf286da0f015"
WEB_IMAGE="busybox:1.37.0"
failures=0

# Writes the Postgres 16 and Postgres 18 compose files of one case into $1.
write_compose() {
  local dir="$1" project="$2" volume18="$3"
  cat > "$dir/compose16.yml" <<EOF
name: $project
services:
  postgres:
    image: $PG16_IMAGE
    environment:
      POSTGRES_DB: fontus
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: bench-secret
    volumes: [pgdata:/var/lib/postgresql/data]
  web:
    image: $WEB_IMAGE
    command: [sleep, "3600"]
volumes:
  pgdata: {}
EOF
  cat > "$dir/compose18.yml" <<EOF
name: $project
services:
  postgres:
    image: $PG18_IMAGE
    environment: {POSTGRES_DB: fontus, POSTGRES_USER: postgres, POSTGRES_PASSWORD: bench-secret}
    volumes: [pgdata:/var/lib/postgresql]
  web:
    image: $WEB_IMAGE
    command: [sleep, "3600"]
volumes:
  pgdata: {external: true, name: $volume18}
EOF
  echo "DATABASE_URL=postgresql://postgres:bench-secret@postgres:5432/fontus" > "$dir/.env"
  # Like production: the rollback file lives outside the project dir and relies on its .env.
  mkdir -p "$dir/elsewhere"
  # shellcheck disable=SC2016 # the ${...} is for Compose, not for this shell
  sed 's/POSTGRES_PASSWORD: bench-secret/POSTGRES_PASSWORD: "${BENCH_PASSWORD:?.env not loaded}"/' "$dir/compose16.yml" > "$dir/elsewhere/compose16.yml"
  echo "BENCH_PASSWORD=bench-secret" >> "$dir/.env"
  mkdir -p "$dir/migrations"
  echo "create table if not exists migrated_marker (id int);" > "$dir/migrations/001.sql"
}

psql16() { docker exec -i "$1" psql -U postgres -d fontus -v ON_ERROR_STOP=1 -qAt "${@:2}"; }

# Starts the Postgres 16 project of one case and seeds three tables.
start_case() {
  local dir="$1" project="$2"
  docker compose -p "$project" -f "$dir/compose16.yml" up -d --quiet-pull >/dev/null 2>&1 || return 1
  local c="$project-postgres-1"
  for _ in $(seq 1 60); do
    docker logs "$c" 2>&1 | grep -q "PostgreSQL init process complete" \
      && docker exec "$c" pg_isready -h 127.0.0.1 -U postgres -d fontus >/dev/null 2>&1 && break
    sleep 1
  done
  psql16 "$c" <<'SQL'
create table udis (id int primary key, name text);
create table samples (id int primary key, udi int references udis(id), taken_at timestamptz);
create table measurements (id bigint primary key, sample int references samples(id), value numeric);
insert into udis select g, 'udi ' || g from generate_series(1, 50) g;
insert into samples select g, 1 + g % 50, now() - g * interval '1 hour' from generate_series(1, 500) g;
insert into measurements select g, 1 + g % 500, random() * 100 from generate_series(1, 10000) g;
SQL
}

cleanup_case() {
  local dir="$1" project="$2" volume18="$3"
  docker compose -p "$project" -f "$dir/compose18.yml" down >/dev/null 2>&1
  docker compose -p "$project" -f "$dir/compose16.yml" down -v >/dev/null 2>&1
  docker ps -aq --filter "label=fontus.pg18-upgrade.temp=$project" | xargs -r docker rm -f >/dev/null 2>&1
  docker volume rm "$volume18" "$project-pg18-rehearsal" >/dev/null 2>&1
  rm -rf "$dir"
}

# Runs the upgrade script with the bench's overrides; extra env assignments come first.
run_script() {
  local dir="$1" project="$2" volume18="$3" mode="$4"; shift 4
  env PG16_CONTAINER="$project-postgres-1" PG18_VOLUME="$volume18" PROJECT_DIR="$dir" \
    COMPOSE_FILE=compose18.yml ROLLBACK_COMPOSE_FILE="$dir/elsewhere/compose16.yml" BACKUP_DIR="$dir/backups" SITE_URL="" \
    MIGRATIONS_DIR="$dir/migrations" MIGRATIONS_CMD="true" \
    REQUIRED_TABLES="udis samples measurements" "$@" \
    bash "$SCRIPT" "$mode" > "$dir/script.log" 2>&1
}

running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
volume_exists() { docker volume inspect "$1" >/dev/null 2>&1; }
major() { docker exec "$1" psql -U postgres -d fontus -qAt -c "show server_version_num" 2>/dev/null | cut -c1-2; }

check() { # check <case> <description> <condition...>
  local name="$1" what="$2"; shift 2
  if "$@"; then return 0; fi
  echo "    expected: $what" >&2
  return 1
}

run_case() {
  local name="$1" fn="$2"
  local project="pg18test-$fn" dir volume18
  dir="$(mktemp -d)"; volume18="$project-pgdata18"
  write_compose "$dir" "$project" "$volume18"
  if ! start_case "$dir" "$project"; then
    echo "FAIL $name (could not start the bench)"; failures=$((failures + 1)); cleanup_case "$dir" "$project" "$volume18"; return
  fi
  if "$fn" "$dir" "$project" "$volume18"; then
    echo "ok   $name"
  else
    echo "FAIL $name"; sed 's/^/    | /' "$dir/script.log" 2>/dev/null | tail -n 15
    failures=$((failures + 1))
  fi
  cleanup_case "$dir" "$project" "$volume18"
}

case_rehearsal() {
  local dir="$1" p="$2" v="$3"
  run_script "$dir" "$p" "$v" rehearsal \
    && check "" "postgres 16 still running" running "$p-postgres-1" \
    && check "" "web still running" running "$p-web-1" \
    && check "" "no pg18 volume left" bash -c "! docker volume inspect '$v' >/dev/null 2>&1" \
    && check "" "temporary resources removed" bash -c "[ -z \"\$(docker ps -aq --filter label=fontus.pg18-upgrade.temp)\" ]" \
    && check "" "counts printed" grep -q "measurements 10000 10000" "$dir/script.log"
}

case_needs_snapshot() {
  local dir="$1" p="$2" v="$3"
  ! run_script "$dir" "$p" "$v" cutover \
    && check "" "web still running" running "$p-web-1" \
    && check "" "no pg18 volume" bash -c "! docker volume inspect '$v' >/dev/null 2>&1"
}

case_cutover() {
  local dir="$1" p="$2" v="$3"
  run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true \
    && check "" "postgres now 18" [ "$(major "$p-postgres-1")" = "18" ] \
    && check "" "web running" running "$p-web-1" \
    && check "" "data copied" [ "$(docker exec "$p-postgres-1" psql -U postgres -d fontus -qAt -c 'select count(*) from measurements')" = "10000" ] \
    && check "" "old volume kept" volume_exists "${p}_pgdata" \
    && check "" "dump kept" bash -c "ls '$dir/backups/'*.dump >/dev/null 2>&1" \
    && check "" "counts printed" grep -q "measurements 10000 10000" "$dir/script.log"
}

case_existing_target() {
  local dir="$1" p="$2" v="$3"
  docker volume create "$v" >/dev/null
  ! run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true \
    && check "" "web still running" running "$p-web-1" \
    && check "" "postgres still 16" [ "$(major "$p-postgres-1")" = "16" ] \
    && check "" "existing volume kept" volume_exists "$v"
}

case_mismatch() {
  local dir="$1" p="$2" v="$3"
  ! run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true FAULT_INJECT=drop_row \
    && check "" "web running again" running "$p-web-1" \
    && check "" "postgres still 16" [ "$(major "$p-postgres-1")" = "16" ] \
    && check "" "half-built pg18 volume removed" bash -c "! docker volume inspect '$v' >/dev/null 2>&1" \
    && check "" "mismatch reported" grep -qi "mismatch" "$dir/script.log"
}

case_password_mismatch() {
  local dir="$1" p="$2" v="$3"
  echo "DATABASE_URL=postgresql://postgres:other-secret@postgres:5432/fontus" > "$dir/.env"
  ! run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true \
    && check "" "web still running" running "$p-web-1" \
    && check "" "postgres still 16" [ "$(major "$p-postgres-1")" = "16" ] \
    && check "" "password mismatch reported" grep -qi "password" "$dir/script.log"
}

case_post_switch_failure() {
  local dir="$1" p="$2" v="$3"
  ! run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true MIGRATIONS_CMD=false \
    && check "" "web running again" running "$p-web-1" \
    && check "" "postgres back on 16" [ "$(major "$p-postgres-1")" = "16" ] \
    && check "" "data intact on 16" [ "$(docker exec "$p-postgres-1" psql -U postgres -d fontus -qAt -c 'select count(*) from measurements')" = "10000" ] \
    && check "" "rollback reported" grep -qi "rolled back to Postgres 16" "$dir/script.log"
}

case_hangup() {
  local dir="$1" p="$2" v="$3" pid _
  run_script "$dir" "$p" "$v" cutover SNAPSHOT_DONE=true SLOW_RESTORE=5 &
  for _ in $(seq 1 120); do grep -q "restoring into Postgres 18" "$dir/script.log" 2>/dev/null && break; sleep 0.5; done
  pid="$(pgrep -f "bash $SCRIPT cutover" | head -n 1)"
  [ -n "$pid" ] && kill -HUP "$pid"
  wait
  check "" "web running again" running "$p-web-1" \
    && check "" "postgres still 16" [ "$(major "$p-postgres-1")" = "16" ] \
    && check "" "half-built pg18 volume removed" bash -c "! docker volume inspect '$v' >/dev/null 2>&1"
}

run_case "rehearsal leaves production untouched" case_rehearsal
run_case "cutover requires SNAPSHOT_DONE" case_needs_snapshot
run_case "cutover switches with identical counts" case_cutover
run_case "cutover refuses existing target" case_existing_target
run_case "cutover rolls back on mismatch" case_mismatch
run_case "cutover refuses a DATABASE_URL password mismatch" case_password_mismatch
run_case "cutover rolls back after a post-switch failure" case_post_switch_failure
run_case "cutover rolls back when the session hangs up" case_hangup

if [ "$failures" -eq 0 ]; then echo "all cases passed"; else echo "$failures case(s) failed"; exit 1; fi
