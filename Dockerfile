# syntax=docker/dockerfile:1
# Two runtime targets from one build:
# - `production`: the web server only. Next.js standalone output, static assets and public files.
#   It does not run migrations: they run once per release in the `migrate` ops job, which fails
#   the release before the new web container starts.
# - `ops`: the SQL migrations (scripts/run-migrations.mjs against DATABASE_URL) and nothing else;
#   no Next.js build, never serves traffic.
FROM node:24.22.3-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/pnpm/corepack
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=fontus-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store --ignore-scripts \
    && pnpm rebuild esbuild unrs-resolver

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN --mount=type=cache,id=fontus-next,target=/app/.next/cache \
    pnpm build

# The migration script needs only the `postgres` driver (no dependencies of its own).
FROM deps AS migrate-dependencies
RUN mkdir -p /migrate/node_modules && cp -aL node_modules/postgres /migrate/node_modules/postgres

# Shared by both runtime targets: Node.js without its bundled package managers, user 1001.
# The code belongs to root and is only readable by user 1001: a compromised process cannot
# change it. User 1001 owns only the Next.js caches (production stage below).
FROM node:24.22.3-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
        /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* \
    && groupadd --gid 1001 app && useradd --uid 1001 --gid app --no-create-home app
WORKDIR /app

FROM runtime AS ops
COPY --from=migrate-dependencies /migrate/node_modules ./node_modules
COPY scripts/run-migrations.mjs ./run-migrations.mjs
COPY supabase/migrations ./migrations
USER app
CMD ["node", "run-migrations.mjs"]

# Last stage: the default target is the web image.
FROM runtime AS production
# The port comes from compose (PORT, site.config.json).
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Next.js writes its page cache at run time (the compose web service mounts both in memory).
RUN mkdir -p .next/cache .next/server/route-cache \
    && chown app:app .next/cache .next/server/route-cache
USER app
CMD ["node", "server.js"]
