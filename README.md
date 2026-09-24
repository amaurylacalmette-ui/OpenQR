# OpenQR

**Dynamic QR codes without the subscription.**

OpenQR is a self-hostable alternative to paid dynamic QR-code platforms. Create a QR code once, point it at any URL, and change the destination whenever you like — the printed code never needs to be regenerated. Scan analytics are built in and privacy-friendly by design.

```
QR code  →  https://your-openqr.com/r/a8F92k  →  https://example.com
                        (permanent)                  (changeable)
```

## Table of contents

1. [What is OpenQR?](#what-is-openqr)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Local development setup](#local-development-setup)
5. [Docker setup](#docker-setup)
6. [Database setup](#database-setup)
7. [Environment variables](#environment-variables)
8. [Production deployment](#production-deployment)
9. [How dynamic redirects work](#how-dynamic-redirects-work)
10. [How analytics work](#how-analytics-work)
11. [Project structure](#project-structure)
12. [Troubleshooting](#troubleshooting)

## What is OpenQR?

A *static* QR code encodes one URL forever — change the URL and you have to reprint everything. A *dynamic* QR code encodes a short link owned by the platform: the link is permanent, but where it points can change at any time.

OpenQR gives you the dynamic part without the monthly fee and without trusting a third party with your traffic. It is a complete, runnable web application:

- **Next.js 16 + TypeScript** App Router frontend and API
- **Tailwind CSS 4 + shadcn/ui** design system, dark/light mode, fully responsive
- **PostgreSQL + Prisma ORM** for data (SQLite for zero-config local dev)
- **Docker Compose** for one-command self-hosting

## Features

| Area | What you get |
| --- | --- |
| Dynamic redirects | Every QR code gets a permanent short code (`/r/a8F92k`); its destination is editable at any time |
| QR customization | Foreground/background colors, export size (256–2048 px), error correction level (L/M/Q/H) with a built-in scannability guard |
| Downloads | Print-ready PNG and vector SVG exports |
| Analytics | Scans over time, unique visitors, top countries, device types, browsers, operating systems, referrers — with Today / 7 days / 30 days / All-time filters |
| Privacy | No cookies, no fingerprints, no raw IPs (salted SHA-256 hashes only, used solely for unique-scan counting) |
| Auth | Email + password registration/login, bcrypt hashing, DB-backed sessions, protected dashboard |
| Security | Zod validation, URL allow-listing, per-user authorization, rate limiting, secure cookies, CSRF-resistant server actions |
| Self-hosting | Single `docker compose up -d`, PostgreSQL included, automatic schema sync on boot |

## Screenshots

> Placeholders — replace with real captures of your instance.

| Landing page | Dashboard |
| --- | --- |
| _docs/screenshots/landing.png_ | _docs/screenshots/dashboard.png_ |

| QR detail page | Analytics |
| --- | --- |
| _docs/screenshots/qr-detail.png_ | _docs/screenshots/analytics.png_ |

## Local development setup

Prerequisites: **Bun** (or Node 20+ with npm), no database needed.

```bash
# 1. Clone from your own Git remote
git clone git@github.com:your-username/openqr.git
cd openqr

# 2. Install dependencies
bun install

# 3. Configure environment (SQLite works out of the box)
cp .env.example .env
# For local dev the defaults are fine — DATABASE_URL points at a local SQLite file.

# 4. Create the database schema
bun run db:push

# 5. Start the dev server
bun run dev
```

Open http://localhost:3000, register an account, and create your first QR code.

Useful scripts:

```bash
bun run lint            # ESLint
bunx tsc --noEmit       # Type check
bun run db:studio       # Prisma Studio (browse the database)
```

## Docker setup

The easiest way to run OpenQR in production:

```bash
git clone git@github.com:your-username/openqr.git
cd openqr

cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, NEXT_PUBLIC_APP_URL and IP_HASH_SALT.

docker compose up -d
```

This starts two services:

- **app** — the OpenQR Next.js application (built from the included `Dockerfile`)
- **db** — PostgreSQL 16 with a persistent volume

On startup the app container syncs the database schema automatically (`prisma db push`, idempotent — it only applies what is missing). Disable with `OPENQR_AUTOMIGRATE=false` if you manage migrations yourself.

Then visit `http://your-server:3000` (or whatever `APP_PORT` you set).

```bash
docker compose logs -f app   # follow logs
docker compose down          # stop (data survives in the postgres-data volume)
docker compose down -v       # stop and DELETE all data
```

## Database setup

OpenQR ships two Prisma schemas with identical models:

| File | Provider | Used for |
| --- | --- | --- |
| `prisma/schema.prisma` | SQLite | Zero-config local development |
| `prisma/schema.postgres.prisma` | PostgreSQL | Docker / production self-hosting |

The `Dockerfile` swaps the Postgres schema in at build time, so containers always run on PostgreSQL.

```bash
# SQLite (local dev)
bun run db:push

# PostgreSQL (when DATABASE_URL points at Postgres)
bun run db:push:postgres
bun run db:generate:postgres
```

Schema highlights — all hot paths are indexed:

```prisma
model QRCode {
  shortCode String @unique        // redirect lookups
  userId    String
  @@index([userId])               // dashboard listing
  @@index([createdAt])
}

model ScanEvent {
  qrCodeId String
  createdAt DateTime
  ipHash   String?
  @@index([qrCodeId])             // per-code analytics
  @@index([createdAt])            // date-range filters
  @@index([qrCodeId, createdAt])  // combined queries
  @@index([ipHash])               // unique-scan counts
}
```

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | Postgres connection string in Docker (`postgresql://user:pass@db:5432/openqr?schema=public`) or a SQLite file for local dev (`file:./db/custom.db`) |
| `NEXT_PUBLIC_APP_URL` | recommended | derived from request headers | Public base URL used to build short links encoded in QR codes. Set it to the URL visitors actually reach |
| `IP_HASH_SALT` | yes (prod) | insecure default | Secret salt for hashing IPs. Generate with `openssl rand -hex 32`. Changing it invalidates future unique counts only |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | yes (Docker) | `openqr` / — / `openqr` | Credentials for the compose `db` service |
| `APP_PORT` | no | `3000` | Host port for the app container |
| `OPENQR_AUTOMIGRATE` | no | `true` | Run `prisma db push` on container start |

Never expose database credentials to the client: all database access happens in server-only modules (`src/lib/db.ts` and friends), and `NEXT_PUBLIC_*` variables are limited to non-sensitive values.

## Production deployment

1. **Server requirements** — any host running Docker (a 1 vCPU / 1 GB VPS is enough to start), or Node 20+/Bun with your own PostgreSQL.
2. **Configure** — copy `.env.example` to `.env`. Set:
   - `NEXT_PUBLIC_APP_URL=https://qr.yourdomain.com` (must match what users' phones resolve — QR codes encode this host)
   - `POSTGRES_PASSWORD` and `IP_HASH_SALT` to long random strings
3. **HTTPS** — put OpenQR behind a reverse proxy with TLS (Caddy, Nginx, Traefik, or a cloud load balancer). The app reads `x-forwarded-proto`/`x-forwarded-host`, so standard proxy headers work. Secure cookies turn on automatically when `NODE_ENV=production` and the request is HTTPS.
4. **Run** — `docker compose up -d --build`.
5. **Backups** — back up the `postgres-data` volume (`docker run --rm -v openqr_postgres-data:/data -v $PWD:/backup alpine tar czf /backup/data.tgz /data`).

Scaling notes:

- Session state lives in PostgreSQL (not memory), so the app container is stateless and can be scaled horizontally.
- Rate limiting is in-memory per instance. For multiple replicas, swap `src/lib/rate-limit.ts` to a Redis-backed implementation.
- Analytics aggregation loads scan rows for the selected window; for very large histories add materialized counters or a time-series store.

## How dynamic redirects work

1. When you create a QR code, OpenQR generates a random 8-character base62 **short code** and stores it — it never changes, even when you edit everything else about the code.
2. The QR image encodes `{NEXT_PUBLIC_APP_URL}/r/{shortCode}`. Because that URL is permanent, the printed code is permanent.
3. When someone scans, `GET /r/{shortCode}` looks up the code by its **unique index**, records a scan event, and responds with a **`302` redirect** to the current `destinationUrl`.
4. A `302` (temporary) redirect is deliberate: `301`s are cached aggressively by browsers and proxies, which would break the "change destination anytime" guarantee. Responses are sent with `cache-control: no-store`.
5. If a code is disabled, scanners see a friendly "paused" page; if it is deleted, a "not found" page. Nothing ever redirects to unvalidated URLs: destinations must be absolute `http(s)` URLs and cannot target localhost/private IP ranges.

## How analytics work

Every redirect records a `ScanEvent` with:

| Field | Source | Privacy note |
| --- | --- | --- |
| `createdAt` | server clock | — |
| `country` | CDN/edge headers (`cf-ipcountry`, `x-vercel-ip-country`, …) when present | 2-letter country code only, `null` otherwise |
| `deviceType` / `browser` / `os` | User-Agent parsing (ua-parser-js) | Coarse categories only |
| `referrer` | `Referer` header, origin + path only, internal referrers dropped | Query strings (often containing PII) are stripped |
| `ipHash` | HMAC-SHA256(IP, IP_HASH_SALT), truncated | **The raw IP is never stored** and cannot be recovered; used exclusively to count *unique* visitors |

What we deliberately do **not** store: raw IPs, full user-agent strings, cookies, fingerprints, or anything that identifies an individual. Because analytics are aggregates, they are GDPR-friendly by construction — no consent banner needed for counting.

Date filters (Today / 7 days / 30 days / All time) apply to every widget; hourly buckets are used for "Today", daily for the 7/30-day views and monthly for long all-time histories.

## Project structure

```
src/
├── app/
│   ├── (auth)/login, register     # Authentication pages
│   ├── dashboard/                 # Protected app (overview, QR codes, analytics, settings)
│   ├── r/[shortCode]/route.ts     # Dynamic redirect endpoint
│   ├── api/qr/[id]/download/      # PNG/SVG export API
│   └── page.tsx                   # Landing page
├── actions/                       # Server actions (auth, QR CRUD)
├── components/                    # UI (shadcn/ui + feature components)
└── lib/                           # auth, db, queries, rate-limit, scan-tracking, qr, validation
prisma/
├── schema.prisma                  # SQLite (local dev)
└── schema.postgres.prisma         # PostgreSQL (production)
```

## Troubleshooting

| Symptom | Likely cause & fix |
| --- | --- |
| "Invalid Server Actions request" on form submit | Your proxy rewrites the `Host` header. Pass the original host through (`proxy_set_header Host $host;` / Caddy `header_up Host {host}`), or add your public domain to `experimental.serverActions.allowedOrigins` in `next.config.ts` |
| App container restarts in a loop | The database isn't reachable yet — check `docker compose logs db` and that `POSTGRES_PASSWORD` in `.env` matches what the `db` service uses |
| QR codes point at `localhost:3000` in production | `NEXT_PUBLIC_APP_URL` is unset — set it to the public URL visitors actually reach and recreate the affected codes |
| Unique-scan counts reset to zero | `IP_HASH_SALT` changed — keep it stable; it is the key that makes repeat visitors recognizable |
| Countries show as "Unknown" | No CDN geo header was present. Behind Cloudflare/Vercel the `cf-ipcountry` / `x-vercel-ip-country` headers are read automatically |
| `docker compose down -v` deleted everything | That flag removes the `postgres-data` volume by design — restore from your backup (see Production deployment) |

## License

All rights reserved. You are free to run, modify, and self-host OpenQR for your own use.
