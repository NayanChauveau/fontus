#!/usr/bin/env bash
# Local bench for deploy/remote-deploy.sh: fake /srv/eau-robinet, fake /root/.ssh, Docker and
# Compose stubs. Nothing touches Docker or the VPS. Run: bash deploy/test-remote-deploy.sh
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/remote-deploy.sh"
PW="pw-$(printf 'secret%s' 42)-a9f"
URL="postgresql://postgres:${PW}@postgres:5432/fontus"
TOKEN="ghs_test_token_value_123"
failures=0

setup() {
  T="$(mktemp -d)"; D="$T/srv/eau-robinet"
  mkdir -p "$D/.git" "$D/src/app" "$D/.pnpm-store" "$D/scripts" "$D/supabase/migrations" "$T/backups" "$T/ssh" \
    "$T/payload/scripts" "$T/payload/supabase/migrations"
  echo old > "$D/docker-compose.prod.yml"; echo old > "$D/scripts/run-migrations.mjs"; echo old > "$D/scripts/apply-prod-migrations.sh"
  echo old > "$D/supabase/config.toml"; echo "-- old" > "$D/supabase/migrations/001.sql"; echo x > "$D/package.json"
  printf 'POSTGRES_PASSWORD=%s\nDATABASE_URL=%s\nWEB_IMAGE=old\n' "$PW" "$URL" > "$D/.env"
  printf 'Host github.com\n  IdentityFile ~/.ssh/infra_traefik_deploy\n  IdentityFile ~/.ssh/jojo_portfolio_deploy\n  IdentitiesOnly yes\n' > "$T/ssh/config"
  for k in eau_robinet_deploy jojo_portfolio_deploy; do echo k > "$T/ssh/$k"; echo p > "$T/ssh/$k.pub"; done
  # Compose stub: "ps" answers from $T/running and $T/all; "--scale" adds container "new1" and
  # fails when $T/unhealthy exists.
  cat > "$T/compose" <<STUB
#!/bin/sh
echo "compose \$* config=\${DOCKER_CONFIG:-none}" >> "$T/calls.log"
case "\$*" in
  *"ps -q --status running"*) cat "$T/running" 2>/dev/null; true ;;
  *"ps -aq"*) cat "$T/all" 2>/dev/null; true ;;
  *--scale*) echo new1 >> "$T/all"; [ ! -e "$T/unhealthy" ] ;;
esac
STUB
  # Docker stub: logs every call; "images"/"ps" answer from $T/images and $T/inuse; "rmi" fails for
  # the references listed in $T/rmi_fail.
  cat > "$T/docker" <<STUB
#!/bin/sh
cat > /dev/null
echo "docker \$* config=\$DOCKER_CONFIG" >> "$T/calls.log"
case "\$1" in
  images) cat "$T/images" 2>/dev/null; true ;;
  ps) cat "$T/inuse" 2>/dev/null; true ;;
  rmi) ! grep -qx -- "\$2" "$T/rmi_fail" 2>/dev/null ;;
esac
STUB
  printf '#!/bin/sh\necho "migrations $PWD" >> "%s/calls.log"\n' "$T" > "$T/migrate"
  chmod +x "$T/compose" "$T/docker" "$T/migrate"
  echo new > "$T/payload/docker-compose.prod.yml"
  echo new > "$T/payload/scripts/apply-prod-migrations.sh"; echo new > "$T/payload/scripts/postgres-18-upgrade.sh"
  echo "-- new" > "$T/payload/supabase/migrations/001.sql"
  incoming "$PW" "$URL"
}

incoming() {
  printf 'POSTGRES_PASSWORD=%s\nDATABASE_URL=%s\nSENTRY_DSN=\nTRAEFIK_HOST=fontus.fr\nWEB_IMAGE=ghcr.io/x/fontus:abc\nDATABASE_POOL_MAX=5\nDATABASE_SSL=0\nNODE_ENV=production\nGHCR_USER=bot\nGHCR_TOKEN=%s\n' \
    "$1" "$2" "$TOKEN" > "$T/payload/incoming.env"
}

full() { tar -czf "$T/payload.tgz" -C "$T/payload" docker-compose.prod.yml scripts supabase incoming.env "$@"; }

run() {
  env ROLLOUT_SETTLE_SECONDS=0 ROLLOUT_DRAIN_SECONDS=0 TARGET_DIR="$D" BACKUP_DIR="$T/backups" SSH_DIR="$T/ssh" COMPOSE="$T/compose" DOCKER="$T/docker" \
    MIGRATIONS_CMD="$T/migrate" HOME="$T" bash -c "$(cat "$SCRIPT")" < "$T/payload.tgz" > "$T/out.log" 2>&1
}

check() {
  local name="$1"; shift
  if "$@"; then echo "ok   $name"; else echo "FAIL $name"; sed 's/^/    | /' "$T/out.log" | tail -n 8; failures=$((failures + 1)); fi
  rm -rf "$T"
}

listing() { (cd "$D/$1" && find . -type f | sort | tr '\n' ' '); }
perms() { stat -f '%Lp' "$1" 2>/dev/null || stat -c '%a' "$1"; }

case_first() {
  run && [ "$(cd "$D" && ls -A | sort | tr '\n' ' ')" = ".env docker-compose.prod.yml scripts supabase " ] \
    && [ "$(listing scripts)" = "./apply-prod-migrations.sh ./postgres-18-upgrade.sh " ] \
    && [ "$(listing supabase)" = "./migrations/001.sql " ] && grep -q new "$D/docker-compose.prod.yml" \
    && ls "$T/backups/"eau-robinet-git-checkout-*.tar.gz >/dev/null 2>&1
}
setup; full; check "first deploy archives and cleans" case_first

case_env() {
  run && [ "$(perms "$D/.env")" = "600" ] && grep -qx "WEB_IMAGE=ghcr.io/x/fontus:abc" "$D/.env" \
    && grep -qx "POSTGRES_PASSWORD=$PW" "$D/.env" && ! grep -q GHCR "$D/.env"
}
setup; full; check "env rewritten 600 from payload, without GHCR credentials" case_env

case_order() {
  run && [ "$(cut -d' ' -f1-3 "$T/calls.log" | tr '\n' '|')" = "docker login ghcr.io|compose -f docker-compose.prod.yml|docker logout ghcr.io|compose -f docker-compose.prod.yml|migrations $D|compose -f docker-compose.prod.yml|compose -f docker-compose.prod.yml|compose -f docker-compose.prod.yml|docker images --format|docker ps -a|docker image prune|" ] \
    && grep -q "pull web" "$T/calls.log" && grep -q "up -d --remove-orphans postgres" "$T/calls.log" \
    && grep -q "up -d --no-deps --wait --wait-timeout 180 web" "$T/calls.log"
}
setup; full; check "deploys in the same order as before" case_order

case_docker_config() {
  run && grep "docker login" "$T/calls.log" | grep -qv "config=$T/.docker" && ! grep -q "config= " "$T/calls.log" && [ ! -e "$T/.docker" ]
}
setup; full; check "registry login uses a throwaway Docker config" case_docker_config

case_guard_pw() {
  incoming "other-password" "$URL"; full
  ! run && [ ! -e "$T/calls.log" ] && grep -q "POSTGRES_PASSWORD differs" "$T/out.log" && grep -q old "$D/docker-compose.prod.yml" \
    && [ -d "$D/.git" ] && grep -qx "WEB_IMAGE=old" "$D/.env"
}
setup; check "guard refuses a different password" case_guard_pw

case_guard_url() {
  incoming "$PW" "postgresql://postgres:x@elsewhere:5432/fontus"; full
  ! run && [ ! -e "$T/calls.log" ] && grep -q "DATABASE_URL differs" "$T/out.log"
}
setup; check "guard refuses a different DATABASE_URL" case_guard_url

case_quiet() {
  incoming "other-password" "$URL"; full; run
  ! grep -q "other-password" "$T/out.log" && ! grep -q "$PW" "$T/out.log" && ! grep -q "$TOKEN" "$T/out.log"
}
setup; check "guard does not print values" case_quiet

case_no_env() { rm "$D/.env"; run && grep -qx "POSTGRES_PASSWORD=$PW" "$D/.env"; }
setup; full; check "first .env is accepted" case_no_env

case_keys() {
  run && [ ! -e "$T/ssh/eau_robinet_deploy" ] && [ ! -e "$T/ssh/eau_robinet_deploy.pub" ] && [ -e "$T/ssh/jojo_portfolio_deploy" ] \
    && grep -q "Host github.com" "$T/ssh/config" && grep -q jojo_portfolio_deploy "$T/ssh/config"
}
setup; full; check "only own key removed" case_keys

case_paths() {
  echo x > "$T/payload/scripts/evil.sh"; full
  ! run && [ ! -e "$T/calls.log" ] && [ -d "$D/.git" ]
}
setup; check "rejects unexpected paths" case_paths

case_bad_key() {
  printf 'LD_PRELOAD=/tmp/x.so\n' >> "$T/payload/incoming.env"; full
  ! run && [ ! -e "$T/calls.log" ]
}
setup; check "rejects unexpected env keys" case_bad_key

case_compose_fails() {
  printf '#!/bin/sh\nexit 1\n' > "$T/compose"; full
  ! run && [ -d "$D/.git" ] && [ -e "$T/ssh/eau_robinet_deploy" ]
}
setup; check "failed compose keeps checkout and key" case_compose_fails

case_again() { full; run && run && [ "$(ls "$T/backups" | grep -c git-checkout)" = "1" ] && [ "$(ls "$T/backups" | grep -c -- -env-)" = "1" ]; }
setup; check "second run is idempotent" case_again

case_archive_clean() {
  mkdir -p "$D/node_modules/x"; echo y > "$D/node_modules/x/i.js"
  run && ! tar -tzf "$T/backups/"eau-robinet-git-checkout-*.tar.gz | grep -qE '(^|/)(\.git|\.env|\.pnpm-store|node_modules)(/|$)'
}
setup; full; check "checkout archive excludes .git, .env and dependencies" case_archive_clean

case_env_backup() {
  run && [ "$(perms "$(ls "$T/backups/"eau-robinet-env-*)")" = "600" ] && grep -qx "WEB_IMAGE=old" "$T/backups/"eau-robinet-env-*
}
setup; full; check "previous .env backed up 600" case_env_backup

case_guard_host() {
  printf 'TRAEFIK_HOST=other.example\n' >> "$D/.env"; full
  ! run && [ ! -e "$T/calls.log" ] && grep -q "TRAEFIK_HOST differs" "$T/out.log"
}
setup; check "guard refuses a different TRAEFIK_HOST" case_guard_host

case_guard_unknown() {
  printf 'MY_SERVER_ONLY_SETTING=1\n' >> "$D/.env"; full
  ! run && [ ! -e "$T/calls.log" ] && grep -q "MY_SERVER_ONLY_SETTING" "$T/out.log" && grep -q "MY_SERVER_ONLY_SETTING=1" "$D/.env"
}
setup; check "guard refuses to drop unknown keys of the current .env" case_guard_unknown

case_bad_line_quiet() {
  printf 'leaked-part-of-a-secret=zzz\n' >> "$T/payload/incoming.env"; full
  ! run && ! grep -q "leaked-part" "$T/out.log" && grep -q "line 11" "$T/out.log"
}
setup; check "bad env line reported by number only" case_bad_line_quiet

case_docker_scope() {
  run && grep "up -d --remove-orphans postgres" "$T/calls.log" | grep -q "config=none" \
    && grep "up -d --no-deps" "$T/calls.log" | grep -q "config=none" \
    && grep "pull web" "$T/calls.log" | grep -qv "config=none"
}
setup; full; check "throwaway Docker config only for registry calls" case_docker_scope

case_rollout() {
  printf 'old1\n' > "$T/running"; printf 'old1\nstale1\n' > "$T/all"
  run && grep -q "docker rm -f stale1" "$T/calls.log" \
    && grep -q "up -d --no-deps --no-recreate --wait --wait-timeout 180 --scale web=2 web" "$T/calls.log" \
    && [ "$(grep -n "docker exec old1 touch /tmp/draining" "$T/calls.log" | cut -d: -f1)" -gt "$(grep -n -- "--scale" "$T/calls.log" | cut -d: -f1)" ] \
    && [ "$(grep -n "docker stop -t 30 old1" "$T/calls.log" | cut -d: -f1)" -gt "$(grep -n "docker exec old1" "$T/calls.log" | cut -d: -f1)" ] \
    && grep -q "docker rm old1" "$T/calls.log" && ! grep -q "docker rm -f new1" "$T/calls.log" \
    && grep -q "without downtime" "$T/out.log"
}
setup; full; check "swaps web: new container first, old one drained then stopped, stale one dropped" case_rollout

case_rollout_unhealthy() {
  printf 'old1\n' > "$T/running"; printf 'old1\n' > "$T/all"; touch "$T/unhealthy"
  ! run && grep -q "docker rm -f new1" "$T/calls.log" && ! grep -q "docker stop" "$T/calls.log" \
    && grep -q "previous one keeps serving" "$T/out.log"
}
setup; full; check "unhealthy new container is removed, old one untouched" case_rollout_unhealthy

# Retention fixtures: WEB_IMAGE is ghcr.io/x/fontus:abc. Dates deliberately not in listing order.
retention_listing() {
  cat > "$T/images" <<LIST
2026-11-10 10:00:00 +0000 UTC|ghcr.io/x/fontus|t3
2026-11-18 10:00:00 +0000 UTC|ghcr.io/x/fontus|abc
2026-11-08 10:00:00 +0000 UTC|ghcr.io/x/fontus|t2
2026-11-01 10:00:00 +0000 UTC|ghcr.io/x/fontus|t0
2026-11-12 10:00:00 +0000 UTC|ghcr.io/x/fontus|t4
2026-10-20 10:00:00 +0000 UTC|ghcr.io/x/fontus|t1
2026-11-17 10:00:00 +0000 UTC|ghcr.io/x/other|new
2026-09-01 10:00:00 +0000 UTC|ghcr.io/x/other|old
2026-11-19 10:00:00 +0000 UTC|ghcr.io/x/fontus|<none>
LIST
}
removed_tags() { grep "^docker rmi " "$T/calls.log" | sed 's/^docker rmi \([^ ]*\) .*/\1/' | sort | tr '\n' ' '; }

case_retention() {
  retention_listing
  run && [ "$(removed_tags)" = "ghcr.io/x/fontus:t0 ghcr.io/x/fontus:t1 ghcr.io/x/fontus:t2 " ] \
    && ! grep -q "rmi -f" "$T/calls.log" && grep -q "docker image prune -f" "$T/calls.log" \
    && [ "$(grep -n "docker rmi" "$T/calls.log" | head -1 | cut -d: -f1)" -gt "$(grep -n -- "up -d --no-deps" "$T/calls.log" | tail -1 | cut -d: -f1)" ]
}
setup; full; check "retention keeps current + 2 newest other tags, removes older, ignores other repos" case_retention

case_retention_inuse() {
  retention_listing; printf 'ghcr.io/x/fontus:t1\nghcr.io/x/other:old\npostgres:18\n' > "$T/inuse"
  run && [ "$(removed_tags)" = "ghcr.io/x/fontus:t0 ghcr.io/x/fontus:t2 " ]
}
setup; full; check "retention keeps an image used by a (stopped) container" case_retention_inuse

case_retention_fail() {
  retention_listing; printf 'ghcr.io/x/fontus:t1\n' > "$T/rmi_fail"
  run && grep -q "docker rmi ghcr.io/x/fontus:t0" "$T/calls.log" && grep -q "docker rmi ghcr.io/x/fontus:t2" "$T/calls.log" \
    && grep -q "could not remove old image tag t1" "$T/out.log" && grep -q "deploy: done" "$T/out.log" \
    && ! grep -q "ghcr.io/x/fontus" "$T/out.log" && ! grep -q "$TOKEN" "$T/out.log"
}
setup; full; check "failed rmi is logged (tag only) and does not fail the deploy" case_retention_fail

case_retention_nodocker_list() {
  # shellcheck disable=SC2016
  printf '#!/bin/sh\ncat > /dev/null; case "$1" in images|ps|image) exit 1 ;; esac\n' > "$T/docker"
  run && grep -q "deploy: done" "$T/out.log"
}
setup; full; check "failing image listing does not fail the deploy" case_retention_nodocker_list

case_retention_after_failure() {
  retention_listing; printf 'old1\n' > "$T/running"; printf 'old1\n' > "$T/all"; touch "$T/unhealthy"
  ! run && ! grep -q "docker rmi" "$T/calls.log"
}
setup; full; check "no pruning when the rollout fails" case_retention_after_failure

if [ "$failures" -eq 0 ]; then echo "all cases passed"; else echo "$failures case(s) failed"; exit 1; fi
