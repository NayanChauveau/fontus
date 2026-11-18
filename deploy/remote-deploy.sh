#!/usr/bin/env bash
# Runs ON the VPS, sent by .github/workflows/deploy.yml as the SSH command:
#   ssh root@vps "$(cat deploy/remote-deploy.sh)" < payload.tgz
# stdin is a tar.gz holding exactly: docker-compose.prod.yml, scripts/apply-prod-migrations.sh,
# scripts/postgres-18-upgrade.sh, supabase/migrations/*.sql, incoming.env (secrets from GitHub).
# No git and no GitHub key on the server. Tested by deploy/test-remote-deploy.sh.
set -euo pipefail
umask 022
# A dropped SSH session must not kill the script halfway (output may be lost, work is not).
trap '' PIPE HUP

TARGET_DIR="${TARGET_DIR:-/srv/eau-robinet}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups}"
SSH_DIR="${SSH_DIR:-/root/.ssh}"
DEPLOY_KEY_NAME="${DEPLOY_KEY_NAME:-eau_robinet_deploy}"
read -r -a COMPOSE <<< "${COMPOSE:-docker compose}"
read -r -a DOCKER <<< "${DOCKER:-docker}"
MIGRATIONS_CMD="${MIGRATIONS_CMD:-bash scripts/apply-prod-migrations.sh docker-compose.prod.yml supabase/migrations}"
COMPOSE_FILE=docker-compose.prod.yml

# Keys accepted in incoming.env. GHCR_* are used for the registry login only, never written to .env.
ENV_KEYS=(POSTGRES_PASSWORD DATABASE_URL SENTRY_DSN TRAEFIK_HOST WEB_IMAGE DATABASE_POOL_MAX DATABASE_SSL NODE_ENV GHCR_USER GHCR_TOKEN)
# A change of these would make the app unable to reach its existing database: refuse it here.
GUARDED_KEYS=(POSTGRES_PASSWORD DATABASE_URL TRAEFIK_HOST)
SYNCED_DIRS=(scripts supabase)
KEEP=("$COMPOSE_FILE" scripts supabase .env)

die() { echo "deploy: $*" >&2; exit 1; }
# Swap the web container without downtime: start a new one next to the running one, wait until
# it is healthy (Traefik only routes to healthy containers), take the old one out of Traefik
# (drain flag read by /api/ready), then stop it (Next.js finishes its requests on SIGTERM; the
# router's retry middleware covers any straggler). If the new container never gets healthy, it is removed and the old one
# keeps serving. Changing the Traefik labels makes the two containers disagree for a few seconds
# (404s during the swap): expect a short blip on such a deploy.
rollout_web() {
  local old id
  old="$("${COMPOSE[@]}" -f "$COMPOSE_FILE" ps -q --status running web)"
  # A stopped web container left by an interrupted deploy would be restarted with the old image.
  for id in $("${COMPOSE[@]}" -f "$COMPOSE_FILE" ps -aq web); do
    grep -qx "$id" <<< "$old" || "${DOCKER[@]}" rm -f "$id" >/dev/null
  done
  if [ -z "$old" ]; then
    "${COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --no-deps --wait --wait-timeout 180 web
    return
  fi
  if ! "${COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --no-deps --no-recreate --wait --wait-timeout 180 \
      --scale web="$(($(wc -l <<< "$old") + 1))" web; then
    for id in $("${COMPOSE[@]}" -f "$COMPOSE_FILE" ps -aq web); do
      grep -qx "$id" <<< "$old" || "${DOCKER[@]}" rm -f "$id" >/dev/null
    done
    die "the new web container never became healthy; the previous one keeps serving"
  fi
  sleep "${ROLLOUT_SETTLE_SECONDS:-5}"  # Traefik picks up the new container
  # Drain: /api/ready answers 503 in the old container, Traefik's health check (every second)
  # takes it out of rotation, then it stops with nothing in flight.
  for id in $old; do "${DOCKER[@]}" exec "$id" touch /tmp/draining || true; done
  sleep "${ROLLOUT_DRAIN_SECONDS:-4}"
  # shellcheck disable=SC2086
  "${DOCKER[@]}" stop -t 30 $old >/dev/null
  # shellcheck disable=SC2086
  "${DOCKER[@]}" rm $old >/dev/null
  echo "deploy: web swapped without downtime"
}
# Image retention, after a healthy swap: of the web image's repository keep the current tag, every
# tag a container (running or not) uses, and the 2 newest other tags by creation date; remove the
# rest by tag (never -f, so Docker itself refuses anything still in use), then drop dangling layers.
# Other repositories are never touched. Nothing here may fail a healthy deploy; logs tags only.
prune_images() {
  local current="$1" repo r t rows inuse keep kept=0 removed=0
  local -a tags=()
  case "${current##*/}" in *:*) ;; *) return 0 ;; esac
  repo="${current%:*}"
  # Not mapfile: the bench also runs on bash 3.2 (macOS).
  rows="$("${DOCKER[@]}" images --format '{{.CreatedAt}}|{{.Repository}}|{{.Tag}}' </dev/null 2>/dev/null | sort -r)" || rows=
  inuse="$("${DOCKER[@]}" ps -a --format '{{.Image}}' </dev/null 2>/dev/null)" || inuse=
  while IFS='|' read -r _ r t; do
    if [ "$r" = "$repo" ] && [ -n "$t" ] && [ "$t" != "<none>" ]; then tags+=("$t"); fi
  done <<< "$rows"
  for t in ${tags[@]+"${tags[@]}"}; do
    keep=
    [ "$repo:$t" = "$current" ] && keep=1
    grep -qxF -- "$repo:$t" <<< "$inuse" && keep=1
    if [ -z "$keep" ] && [ "$kept" -lt 2 ]; then keep=1; kept=$((kept + 1)); fi
    [ -n "$keep" ] && continue
    if "${DOCKER[@]}" rmi "$repo:$t" </dev/null >/dev/null 2>&1; then
      removed=$((removed + 1)); echo "deploy: removed old image tag $t"
    else
      echo "deploy: could not remove old image tag $t (kept)"
    fi
  done
  "${DOCKER[@]}" image prune -f </dev/null >/dev/null 2>&1 || echo "deploy: dangling image prune failed (ignored)"
  echo "deploy: image retention done ($removed removed)"
}
in_list() { local x="$1"; shift; local e; for e in "$@"; do [ "$e" = "$x" ] && return 0; done; return 1; }
# Value of $1 in env file $2 (everything after the first "="), empty if absent.
env_value() { sed -n "s/^$1=//p" "$2" | tail -n 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# 1. Validate the archive before touching anything: only the expected regular files and dirs.
cat > "$STAGE/payload.tgz"
listing="$(tar -tvzf "$STAGE/payload.tgz")" || die "unreadable archive"
while IFS= read -r line; do
  case "$line" in -*|d*) ;; *) die "archive entry is not a regular file or directory" ;; esac
done <<< "$listing"
while IFS= read -r name; do
  name="${name%/}"
  case "$name" in
    "$COMPOSE_FILE"|incoming.env|scripts|scripts/apply-prod-migrations.sh|scripts/postgres-18-upgrade.sh|supabase|supabase/migrations) ;;
    supabase/migrations/*.sql) case "${name#supabase/migrations/}" in */*|..*) die "unsafe path in archive: $name" ;; esac ;;
    *) die "unexpected path in archive: $name" ;;
  esac
done < <(tar -tzf "$STAGE/payload.tgz")
mkdir "$STAGE/x"
tar -xzf "$STAGE/payload.tgz" -C "$STAGE/x" --no-same-owner --no-same-permissions
for f in "$COMPOSE_FILE" incoming.env scripts/apply-prod-migrations.sh scripts/postgres-18-upgrade.sh; do
  [ -f "$STAGE/x/$f" ] || die "missing in archive: $f"
done
# Report bad lines by number only: a malformed secret must never reach the (public) logs.
n=0
while IFS= read -r line; do
  n=$((n + 1))
  [ -z "$line" ] && continue
  in_list "${line%%=*}" "${ENV_KEYS[@]}" || die "unexpected key in incoming.env, line $n"
done < "$STAGE/x/incoming.env"

# 2. Guard: the database credentials must not change silently (values are never printed).
# A key set only on the server would be lost when .env is rewritten: refuse, by name only.
if [ -f "$TARGET_DIR/.env" ]; then
  for key in "${GUARDED_KEYS[@]}"; do
    current="$(env_value "$key" "$TARGET_DIR/.env")"
    [ "$key" = TRAEFIK_HOST ] && [ -z "$current" ] && continue
    [ "$current" = "$(env_value "$key" "$STAGE/x/incoming.env")" ] \
      || die "refusing: $key differs from the current .env (rotate it deliberately, not through a deploy)"
  done
  while IFS= read -r line; do
    case "$line" in ''|'#'*) continue ;; esac
    in_list "${line%%=*}" "${ENV_KEYS[@]}" \
      || die "refusing: the current .env has ${line%%=*}, which the deploy would drop (add it to the secrets first)"
  done < "$TARGET_DIR/.env"
fi

put() {
  if [ -f "$2" ]; then cmp -s "$1" "$2" || cat "$1" > "$2"; else install -m 644 "$1" "$2"; fi
}

# 3. Install: compose file, synced dirs (files dropped from the payload removed), .env (600).
mkdir -p "$TARGET_DIR"
put "$STAGE/x/$COMPOSE_FILE" "$TARGET_DIR/$COMPOSE_FILE"
for d in "${SYNCED_DIRS[@]}"; do
  mkdir -p "$TARGET_DIR/$d"
  (cd "$STAGE/x/$d" && find . -type d) | while IFS= read -r sub; do mkdir -p "$TARGET_DIR/$d/$sub"; done
  (cd "$STAGE/x/$d" && find . -type f) | while IFS= read -r file; do put "$STAGE/x/$d/$file" "$TARGET_DIR/$d/$file"; done
  (cd "$TARGET_DIR/$d" && find . -type f) | while IFS= read -r file; do
    [ -f "$STAGE/x/$d/$file" ] || rm -f -- "${TARGET_DIR:?}/$d/$file"
  done
done
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
grep -v '^GHCR_' "$STAGE/x/incoming.env" > "$STAGE/env" || true
# Keep the previous .env (mode 600) when it changes, then replace it atomically.
if [ -s "$TARGET_DIR/.env" ] && ! cmp -s "$TARGET_DIR/.env" "$STAGE/env"; then
  install -d -m 700 "$BACKUP_DIR"
  install -m 600 "$TARGET_DIR/.env" "$BACKUP_DIR/$(basename "$TARGET_DIR")-env-$STAMP"
fi
install -m 600 "$STAGE/env" "$TARGET_DIR/.env.new"
mv -f "$TARGET_DIR/.env.new" "$TARGET_DIR/.env"

# 4. Deploy, as before. The registry login lives in a throwaway Docker config used only by the
#    registry calls (login, pull, logout), never written to /root/.docker.
REGISTRY_CONFIG="$STAGE/docker-config"
mkdir -m 700 "$REGISTRY_CONFIG"
env_value GHCR_TOKEN "$STAGE/x/incoming.env" | DOCKER_CONFIG="$REGISTRY_CONFIG" \
  "${DOCKER[@]}" login ghcr.io -u "$(env_value GHCR_USER "$STAGE/x/incoming.env")" --password-stdin >/dev/null
cd "$TARGET_DIR"
DOCKER_CONFIG="$REGISTRY_CONFIG" "${COMPOSE[@]}" -f "$COMPOSE_FILE" pull web
DOCKER_CONFIG="$REGISTRY_CONFIG" "${DOCKER[@]}" logout ghcr.io >/dev/null || true
"${COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --remove-orphans postgres
eval "$MIGRATIONS_CMD"
rollout_web
# A pruning problem never fails a deploy that is already healthy.
prune_images "$(env_value WEB_IMAGE "$STAGE/x/incoming.env")" || echo "deploy: image retention skipped"

# 5. First push deploy only: archive the old git checkout, keep only the runtime files.
if [ -d "$TARGET_DIR/.git" ]; then
  install -d -m 700 "$BACKUP_DIR"
  archive="$BACKUP_DIR/$(basename "$TARGET_DIR")-git-checkout-$STAMP.tar.gz"
  # Only what git does not already hold elsewhere: no history, no secrets, no dependencies.
  (umask 077; tar -czf "$archive" --exclude=.git --exclude=.env --exclude=.env.new \
    --exclude=.pnpm-store --exclude=node_modules -C "$TARGET_DIR" .)
  chmod 600 "$archive"
  for path in "$TARGET_DIR"/* "$TARGET_DIR"/.[!.]* "$TARGET_DIR"/..?*; do
    [ -e "$path" ] || [ -L "$path" ] || continue
    in_list "$(basename "$path")" "${KEEP[@]}" || rm -rf -- "$path"
  done
  echo "deploy: old checkout archived to $archive and removed"
fi

# 6. This repo no longer needs its GitHub deploy key on the server.
if [ -e "$SSH_DIR/$DEPLOY_KEY_NAME" ] || grep -q "/$DEPLOY_KEY_NAME\$" "$SSH_DIR/config" 2>/dev/null; then
  rm -f -- "$SSH_DIR/$DEPLOY_KEY_NAME" "$SSH_DIR/$DEPLOY_KEY_NAME.pub"
  if [ -f "$SSH_DIR/config" ]; then
    grep -v "IdentityFile ~/.ssh/$DEPLOY_KEY_NAME\$" "$SSH_DIR/config" > "$STAGE/config" || true
    cat "$STAGE/config" > "$SSH_DIR/config"
  fi
  echo "deploy: deploy key $DEPLOY_KEY_NAME removed"
fi
echo "deploy: done"
