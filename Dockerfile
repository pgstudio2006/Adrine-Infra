# Default image for the main Coolify app (kernel-api / Navayu Wave 0).
# Build context must be the repository root (.).
# Other Coolify apps should set their own Dockerfile path:
#   domain-api  -> services/domain-api/Dockerfile
#   hospital-os -> apps/hospital-os/Dockerfile
# Canonical copy: services/kernel-api/Dockerfile (keep in sync).
FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
# Coolify may inject NODE_ENV=production at build time; force dev deps for install/build.
RUN NODE_ENV=development pnpm install --frozen-lockfile
RUN NODE_ENV=development pnpm --filter @adrine/otel-bootstrap --filter @adrine/tenant-context run build
RUN NODE_ENV=development pnpm --filter @adrine/kernel-api exec prisma generate
RUN NODE_ENV=development pnpm --filter @adrine/kernel-api run build
WORKDIR /repo/services/kernel-api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
