#!/usr/bin/env sh
# Smoke health for local stack — DOMAIN_API_URL, KERNEL_API_URL optional.
set -e
DOMAIN="${DOMAIN_API_URL:-http://localhost:3002}"
KERNEL="${KERNEL_API_URL:-http://localhost:3001}"

echo "Checking domain-api..."
curl -sf "$DOMAIN/health/deep" | head -c 500
echo ""
echo "Checking kernel-api..."
curl -sf "$KERNEL/health" | head -c 500
echo ""
echo "OK"
