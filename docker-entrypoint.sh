#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# OpenQR container entrypoint
#
# 1. Optionally sync the database schema with `prisma db push` (idempotent —
#    it only applies what is missing, making first startup effortless).
#    Disable with OPENQR_AUTOMIGRATE=false if you manage migrations yourself.
# 2. Start the Next.js standalone server.
# ---------------------------------------------------------------------------

if [ "${OPENQR_AUTOMIGRATE:-true}" = "true" ]; then
  echo "==> Syncing database schema (prisma db push)…"
  bunx prisma db push --skip-generate
fi

echo "==> Starting OpenQR on port ${PORT:-3000}"
exec bun .next/standalone/server.js
