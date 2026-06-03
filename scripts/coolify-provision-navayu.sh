#!/bin/sh
# Run Navayu provision against internal Postgres from the VPS host (Coolify server terminal).
# Does NOT use the public Postgres port. Requires docker access on the host.
#
# Usage (paste into Coolify → Servers → localhost → Terminal → Connect):
#   curl -fsSL https://raw.githubusercontent.com/pgstudio2006/Adrine-Infra/master/scripts/coolify-provision-navayu.sh | sh
# Or after git pull on a checkout:
#   sh scripts/coolify-provision-navayu.sh

set -e

KERNEL_CONTAINER="$(docker ps --format '{{.Names}}' | grep -E 't36wqfoh1hj88qrizvbr0q9h|adrine-kernel' | head -n1)"
if [ -z "$KERNEL_CONTAINER" ]; then
  echo "ERROR: adrine-kernel container not found." >&2
  docker ps --format '{{.Names}}' >&2
  exit 1
fi

echo "Using kernel container: $KERNEL_CONTAINER"

docker exec "$KERNEL_CONTAINER" sh -c '
  set -e
  cd /repo/services/kernel-api && npx prisma generate
  cd /repo/services/domain-api && npx prisma generate
  cd /repo && pnpm provision:navayu
'

echo "Navayu provision complete."
