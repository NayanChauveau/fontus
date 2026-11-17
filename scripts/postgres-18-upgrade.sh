#!/usr/bin/env bash
# Move the Fontus database from Postgres 16 to Postgres 18. Run on the VPS by
# .github/workflows/postgres-18-upgrade.yml; tested locally by scripts/test-postgres-18-upgrade.sh.
#
#   rehearsal  copy production into a throwaway Postgres 18, verify, delete the copy.
#              Production is never stopped or changed.
#   cutover    stop web, dump, restore into the new volume, verify, switch Compose to 18.
#              Requires SNAPSHOT_DONE=true (Hostinger snapshot taken just before).
#              Any failure, kill or hang-up rolls production back to Postgres 16.
#   rollback   later way back: Postgres 16 on its untouched volume, using the compose file
#              saved by the cutover. Data written on 18 since the cutover is not carried back.
#
# Postgres 16 is always reached by container name, never through the current compose file
# (which already describes Postgres 18). The old volume is never touched.
set -euo pipefail

MODE="${1:-}"
PG16_CONTAINER="${PG16_CONTAINER:-eau-robinet-postgres-1}"
PG18_IMAGE="${PG18_IMAGE:-postgres:18.7-alpine@sha256:b6972e1115a4ff8eba5d7f7d19184926d1e16d7d1136ae1e1a7ebf286da0f015}"
PG18_VOLUME="${PG18_VOLUME:-eau-robinet_pgdata18}"
PROJECT_DIR="${PROJECT_DIR:-/srv/eau-robinet}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups/eau-robinet}"
# Compose file of the Postgres 16 setup, used to roll back. By default the cutover saves it
# from git (the version just before the commit that moved Compose to Postgres 18).
ROLLBACK_COMPOSE_FILE="${ROLLBACK_COMPOSE_FILE:-$BACKUP_DIR/compose-postgres16.yml}"
# Health endpoint: 503 unless the app can query the database.
SITE_URL="${SITE_URL-https://fontus.fr/api/health}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$PROJECT_DIR/supabase/migrations}"
MIGRATIONS_CMD="${MIGRATIONS_CMD:-bash scripts/apply-prod-migrations.sh $COMPOSE_FILE supabase/migrations}"
REQUIRED_TABLES="${REQUIRED_TABLES:-udis sync_jobs samples parameters}"
SNAPSHOT_DONE="${SNAPSHOT_DONE:-false}"
# Test bench hooks only: FAULT_INJECT=drop_row deletes one row in the copy;
# SLOW_RESTORE=N waits N seconds before restoring (to interrupt the run on purpose).
FAULT_INJECT="${FAULT_INJECT:-}"
SLOW_RESTORE="${SLOW_RESTORE:-0}"
DB=fontus
PROJECT="${PROJECT:-eau-robinet}" # replaced by the label of $PG16_CONTAINER in rehearsal/cutover

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }
# A hang-up or kill must end in the EXIT trap with a failure status, never as a success.
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
trap '' PIPE

# Always the production project and directory (.env lives there), whatever the file's location:
# the saved Postgres 16 compose file sits in $BACKUP_DIR.
compose() { (cd "$PROJECT_DIR" && docker compose --project-directory "$PROJECT_DIR" -p "$PROJECT" -f "$1" "${@:2}"); }

# Checks shared by rehearsal and cutover; sets PROJECT and PGPASSWORD_PROD.
preflight() {
  PROJECT="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$PG16_CONTAINER" 2>/dev/null)" \
    || die "container $PG16_CONTAINER not found"
  [ "$(docker exec "$PG16_CONTAINER" psql -U postgres -d "$DB" -qAt -c 'show server_version_num' | cut -c1-2)" = "16" ] \
    || die "$PG16_CONTAINER is not running Postgres 16: already migrated?"
  # The new data directory gets this superuser password at init. The app connects with
  # DATABASE_URL, so both must match or the app could not log in on Postgres 18.
  PGPASSWORD_PROD="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$PG16_CONTAINER" | sed -n 's/^POSTGRES_PASSWORD=//p')"
  [ -n "$PGPASSWORD_PROD" ] || die "POSTGRES_PASSWORD not found on $PG16_CONTAINER"
  local url
  url="$(sed -n 's/^DATABASE_URL=//p' "$PROJECT_DIR/.env" 2>/dev/null | tail -n 1)"
  [ -n "$url" ] || die "DATABASE_URL not found in $PROJECT_DIR/.env"
  python3 - "$url" "$PGPASSWORD_PROD" <<'EOF' || die "DATABASE_URL password or user differs from the Postgres superuser: the app would not connect to Postgres 18"
import sys, urllib.parse
u = urllib.parse.urlsplit(sys.argv[1])
sys.exit(0 if u.username == "postgres" and urllib.parse.unquote(u.password or "") == sys.argv[2] else 1)
EOF
}

# The one running web container of the project (not a `compose run` one-off).
web_container() {
  local ids
  ids="$(docker ps -q --filter "label=com.docker.compose.project=$PROJECT" \
    --filter "label=com.docker.compose.service=web" --filter "label=com.docker.compose.oneoff=False")"
  [ "$(printf '%s' "$ids" | grep -c .)" = "1" ] || die "expected exactly one running web container, found: ${ids:-none}"
  printf '%s' "$ids"
}

# Exact row count of every table in public, one "table count" line each, sorted.
table_counts() {
  local container="$1" tables t n
  tables="$(docker exec "$container" psql -U postgres -d "$DB" -qAt -c \
    "select tablename from pg_tables where schemaname = 'public' order by 1")" || return 1
  [ -n "$tables" ] || return 1
  for t in $tables; do
    n="$(docker exec "$container" psql -U postgres -d "$DB" -qAt -c "select count(*) from public.\"$t\"")" || return 1
    printf '%s %s\n' "$t" "$n"
  done
}

# Starts a Postgres 18 container on volume $2 and waits until it accepts TCP connections
# (the image's init server listens on the socket only, so TCP means init is finished).
start_pg18() {
  local name="$1" volume="$2"
  docker run -d --name "$name" --label "fontus.pg18-upgrade.temp=$PROJECT" --network none \
    -e POSTGRES_DB="$DB" -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$PGPASSWORD_PROD" \
    -v "$volume:/var/lib/postgresql" "$PG18_IMAGE" >/dev/null
  for _ in $(seq 1 90); do
    docker exec "$name" pg_isready -h 127.0.0.1 -U postgres -d "$DB" >/dev/null 2>&1 && return 0
    sleep 1
  done
  die "Postgres 18 did not start"
}

# Restores dump $2 into container $1, then verifies the copy against Postgres 16.
restore_and_verify() {
  local target="$1" dump="$2" source_counts copy_counts t
  [ "$SLOW_RESTORE" -gt 0 ] && sleep "$SLOW_RESTORE"
  log "restoring into Postgres 18"
  docker exec -i "$target" pg_restore -U postgres -d "$DB" --no-owner --exit-on-error < "$dump"
  docker exec "$target" psql -U postgres -d "$DB" -qAt -c 'analyze' >/dev/null
  if [ "$FAULT_INJECT" = "drop_row" ]; then
    t="$(docker exec "$target" psql -U postgres -d "$DB" -qAt -c "select tablename from pg_tables where schemaname = 'public' order by 1 limit 1")"
    docker exec "$target" psql -U postgres -d "$DB" -qAt -c "delete from public.\"$t\" where ctid in (select ctid from public.\"$t\" limit 1)" >/dev/null
  fi
  source_counts="$(table_counts "$PG16_CONTAINER")" || die "could not count rows on Postgres 16"
  copy_counts="$(table_counts "$target")" || die "could not count rows on the copy"
  log "row counts (table source copy):"
  awk 'NR == FNR { src[$1] = $2; next } { copy[$1] = $2 } END {
    for (t in src) printf "  %s %s %s\n", t, src[t], (t in copy ? copy[t] : "MISSING")
    for (t in copy) if (!(t in src)) printf "  %s MISSING %s\n", t, copy[t]
  }' <(echo "$source_counts") <(echo "$copy_counts") | sort
  [ "$source_counts" = "$copy_counts" ] || die "row count mismatch between Postgres 16 and the copy"
  for t in $REQUIRED_TABLES; do
    [ "$(docker exec "$target" psql -U postgres -d "$DB" -qAt -c "select to_regclass('public.$t') is not null")" = "t" ] \
      || die "required table missing in the copy: $t"
  done
  log "copy verified: $(echo "$copy_counts" | wc -l | tr -d ' ') tables, identical row counts"
}

dump_pg16() { docker exec "$PG16_CONTAINER" pg_dump -U postgres -d "$DB" -Fc > "$1"; }

wait_healthy() {
  local file="$1" major
  for _ in $(seq 1 60); do
    compose "$file" exec -T postgres pg_isready -h 127.0.0.1 -U postgres -d "$DB" >/dev/null 2>&1 && break
    sleep 1
  done
  major="$(compose "$file" exec -T postgres psql -U postgres -d "$DB" -qAt -c 'show server_version_num' | cut -c1-2)"
  printf '%s' "$major"
}

check_site() {
  [ -n "$SITE_URL" ] || return 0
  for _ in $(seq 1 30); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL")" = "200" ] && return 0
    sleep 2
  done
  die "$SITE_URL does not answer 200"
}

# Postgres 16 back on its untouched volume, then web. Used by the cutover and by `rollback`.
switch_back_to_16() {
  log "rolling back: Postgres 16 on its original volume"
  compose "$ROLLBACK_COMPOSE_FILE" up -d postgres
  [ "$(wait_healthy "$ROLLBACK_COMPOSE_FILE")" = "16" ] || die "Postgres 16 did not come back"
  compose "$ROLLBACK_COMPOSE_FILE" up -d --no-deps web
  log "rolled back to Postgres 16"
}

rehearsal() {
  preflight
  # Globals, not locals: the EXIT trap runs after this function has returned.
  REHEARSAL_TMP="$(mktemp -d)"
  REHEARSAL_NAME="$PROJECT-pg18-rehearsal"
  trap 'docker rm -f "$REHEARSAL_NAME" >/dev/null 2>&1; docker volume rm "$REHEARSAL_NAME" >/dev/null 2>&1; rm -rf "$REHEARSAL_TMP"' EXIT
  log "rehearsal: production keeps running, nothing is changed"
  dump_pg16 "$REHEARSAL_TMP/fontus.dump"
  log "dump: $(du -h "$REHEARSAL_TMP/fontus.dump" | cut -f1)"
  docker volume create "$REHEARSAL_NAME" >/dev/null
  start_pg18 "$REHEARSAL_NAME" "$REHEARSAL_NAME"
  restore_and_verify "$REHEARSAL_NAME" "$REHEARSAL_TMP/fontus.dump"
  # The app's migrations are idempotent: they must apply cleanly on Postgres 18.
  local f
  for f in "$MIGRATIONS_DIR"/*.sql; do
    docker exec -i "$REHEARSAL_NAME" psql -U postgres -d "$DB" -q -v ON_ERROR_STOP=1 < "$f" >/dev/null
  done
  log "migrations applied on the copy"
  log "RESULT: rehearsal OK"
}

# Saves the Postgres 16 compose file from git unless one is given (test bench).
save_rollback_compose() {
  if [ "$ROLLBACK_COMPOSE_FILE" = "$BACKUP_DIR/compose-postgres16.yml" ] && [ ! -s "$ROLLBACK_COMPOSE_FILE" ]; then
    local commit
    commit="$(git -C "$PROJECT_DIR" log -1 --format=%H -S 'eau-robinet_pgdata18' -- "$COMPOSE_FILE")"
    [ -n "$commit" ] || die "cannot find the commit that moved $COMPOSE_FILE to Postgres 18"
    git -C "$PROJECT_DIR" show "$commit^:$COMPOSE_FILE" > "$ROLLBACK_COMPOSE_FILE"
  fi
  grep -q 'postgres:16' "$PROJECT_DIR/$ROLLBACK_COMPOSE_FILE" 2>/dev/null || grep -q 'postgres:16' "$ROLLBACK_COMPOSE_FILE" \
    || die "rollback compose file does not describe Postgres 16: $ROLLBACK_COMPOSE_FILE"
}

cutover() {
  [ "$SNAPSHOT_DONE" = "true" ] || die "take the Hostinger snapshot first, then run with SNAPSHOT_DONE=true"
  preflight
  ! docker volume inspect "$PG18_VOLUME" >/dev/null 2>&1 \
    || die "volume $PG18_VOLUME already exists: refusing to restore into it (see deploy/README.md)"
  install -d -m 700 "$BACKUP_DIR"
  save_rollback_compose
  # Globals, not locals: the EXIT trap below runs after this function has returned.
  WEB="$(web_container)"
  TEMP_CONTAINER="$PROJECT-pg18-cutover"
  STAGE=before_switch # before_switch | switched | done
  DUMP="$BACKUP_DIR/$(date -u +%Y%m%dT%H%M%SZ)-postgres16.dump"

  on_exit() {
    local status=$?
    [ "$STAGE" = "done" ] && return 0
    set +e
    trap '' HUP INT TERM
    docker rm -f "$TEMP_CONTAINER" >/dev/null 2>&1
    if [ "$STAGE" = before_switch ]; then
      docker volume rm "$PG18_VOLUME" >/dev/null 2>&1
      [ -f "$DUMP" ] && mv "$DUMP" "$DUMP.unused"
      docker start "$WEB" >/dev/null 2>&1
      log "cutover aborted (status $status): web restarted on Postgres 16, new volume removed" >&2
    else
      # Keep the Postgres 18 volume for investigation; production goes back to 16.
      if (set -e; switch_back_to_16); then
        log "cutover failed after the switch (status $status): rolled back to Postgres 16; $PG18_VOLUME kept for investigation" >&2
      else
        log "cutover failed after the switch AND the rollback failed: see deploy/README.md (rollback)" >&2
      fi
    fi
    log "RESULT: cutover FAILED" >&2
    [ "$status" -eq 0 ] && exit 1
  }
  trap on_exit EXIT

  log "stopping web (site down until the switch)"
  docker stop "$WEB" >/dev/null
  dump_pg16 "$DUMP"
  log "dump kept at $DUMP ($(du -h "$DUMP" | cut -f1))"
  docker volume create "$PG18_VOLUME" >/dev/null
  start_pg18 "$TEMP_CONTAINER" "$PG18_VOLUME"
  restore_and_verify "$TEMP_CONTAINER" "$DUMP"
  docker rm -f "$TEMP_CONTAINER" >/dev/null

  log "switching Compose to Postgres 18"
  STAGE=switched
  compose "$COMPOSE_FILE" up -d postgres
  [ "$(wait_healthy "$COMPOSE_FILE")" = "18" ] || die "Postgres 18 did not come up through Compose"
  (cd "$PROJECT_DIR" && eval "$MIGRATIONS_CMD")
  compose "$COMPOSE_FILE" up -d --no-deps web
  check_site
  STAGE="done"
  log "RESULT: cutover OK. Postgres 18 in production; old volume, $DUMP and $ROLLBACK_COMPOSE_FILE kept"
}

rollback() {
  [ -s "$ROLLBACK_COMPOSE_FILE" ] || die "no saved Postgres 16 compose file at $ROLLBACK_COMPOSE_FILE"
  log "rollback: data written on Postgres 18 since the cutover is NOT carried back"
  switch_back_to_16
  check_site
  log "RESULT: rollback OK. Revert the Postgres 18 compose commit so the next deploy stays on 16"
}

case "$MODE" in
  rehearsal) rehearsal ;;
  cutover) cutover ;;
  rollback) rollback ;;
  *) die "usage: $0 rehearsal|cutover|rollback" ;;
esac
