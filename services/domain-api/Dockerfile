# Build from repository root:
#   docker build -f services/domain-api/Dockerfile .
FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
RUN NODE_ENV=development pnpm install --frozen-lockfile
# Build domain-api and all workspace dependencies (hospital-operations, otel-bootstrap, tenant-context).
RUN NODE_ENV=development pnpm --filter @adrine/domain-api... --workspace-concurrency=1 run build
WORKDIR /repo/services/domain-api
ENV NODE_ENV=production
EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
