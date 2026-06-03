# Build from repository root:
#   docker build -f services/kernel-api/Dockerfile .
FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
# Coolify may inject NODE_ENV=production at build time; force dev deps for install/build.
RUN NODE_ENV=development pnpm install --frozen-lockfile
# Build kernel-api and all workspace dependencies (hospital-operations, otel-bootstrap, tenant-context).
RUN NODE_ENV=development pnpm --filter @adrine/kernel-api... --workspace-concurrency=1 run build \
  && test -f /repo/services/kernel-api/dist/generated/prisma/index.js
WORKDIR /repo/services/kernel-api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
