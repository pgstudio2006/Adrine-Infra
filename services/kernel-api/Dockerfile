# Build from repository root:
#   docker build -f services/kernel-api/Dockerfile .
FROM node:22-alpine
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
RUN pnpm install
RUN pnpm --filter @adrine/otel-bootstrap --filter @adrine/tenant-context run build
RUN pnpm --filter @adrine/kernel-api exec prisma generate
RUN pnpm --filter @adrine/kernel-api run build
WORKDIR /repo/services/kernel-api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
