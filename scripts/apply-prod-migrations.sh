#!/usr/bin/env bash
set -euo pipefail

compose_file="${1:-docker-compose.prod.yml}"
migrations_dir="${2:-supabase/migrations}"

for _ in $(seq 1 30); do
  if docker compose -f "${compose_file}" exec -T postgres \
    pg_isready -U postgres -d fontus >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker compose -f "${compose_file}" exec -T postgres \
  pg_isready -U postgres -d fontus >/dev/null

shopt -s nullglob
files=("${migrations_dir}"/*.sql)
if [ "${#files[@]}" -eq 0 ]; then
  echo "migrations_failed no sql files in ${migrations_dir}" >&2
  exit 1
fi

for file in "${files[@]}"; do
  echo "applying ${file}"
  docker compose -f "${compose_file}" exec -T postgres \
    psql -U postgres -d fontus -v ON_ERROR_STOP=1 < "${file}"
done

missing="$(docker compose -f "${compose_file}" exec -T postgres \
  psql -U postgres -d fontus -v ON_ERROR_STOP=1 -tAc \
  "select string_agg(name, ',') from (values
    ('udis'),
    ('sync_jobs'),
    ('samples'),
    ('parameters')
  ) as required(name)
  where to_regclass('public.' || name) is null;")"

if [ -n "${missing}" ]; then
  echo "migrations_failed missing tables: ${missing}" >&2
  exit 1
fi

echo "migrations_ok"
