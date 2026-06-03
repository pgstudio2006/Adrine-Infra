#!/bin/sh
set -eu

# Ensure adrine_domain exists (Coolify internal Postgres hostname).
KERNEL_URL="${DATABASE_URL%/*}/adrine_kernel"
if psql "$KERNEL_URL" -tc "SELECT 1 FROM pg_database WHERE datname='adrine_domain'" | grep -q 1; then
  :
else
  psql "$KERNEL_URL" -c "CREATE DATABASE adrine_domain;"
fi

cd /repo/services/domain-api

# init migration already includes nursing_vitals_notes; clear a failed duplicate migration if present.
npx prisma migrate resolve --applied "20260520120000_nursing_vitals_notes" 2>/dev/null \
  || npx prisma migrate resolve --rolled-back "20260520120000_nursing_vitals_notes" 2>/dev/null \
  || true

npx prisma migrate deploy
exec node dist/main.js
