# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# OpenQR — production image
#
# Multi-stage build based on Bun. The production deployment targets
# PostgreSQL (schema.postgres.prisma is swapped in before generating the
# Prisma Client). See docker-compose.yml for the full stack.
# ---------------------------------------------------------------------------

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production runs on PostgreSQL — activate the Postgres schema and generate.
RUN cp prisma/schema.postgres.prisma prisma/schema.prisma \
  && bunx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# OpenSSL is required by the Prisma query engine on Debian.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
