# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=fontus-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store --ignore-scripts \
    && pnpm rebuild esbuild unrs-resolver

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN --mount=type=cache,id=fontus-next,target=/app/.next/cache \
    pnpm build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME=0.0.0.0
ENV MIGRATIONS_DIR=/app/migrations

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/supabase/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-migrations.mjs ./run-migrations.mjs

USER nextjs
EXPOSE 3100
CMD ["sh", "-c", "node run-migrations.mjs; exec node server.js"]
