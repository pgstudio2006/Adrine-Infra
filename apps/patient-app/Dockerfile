# Build from repository root:
#   docker build -f apps/patient-app/Dockerfile .
FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
RUN NODE_ENV=development pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_PLATFORM_RUNTIME=true
ARG NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
ARG NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
ARG NEXT_PUBLIC_DEV_TENANT_ID=tenant_navayu
ENV NEXT_PUBLIC_PLATFORM_RUNTIME=$NEXT_PUBLIC_PLATFORM_RUNTIME \
    NEXT_PUBLIC_KERNEL_API_URL=$NEXT_PUBLIC_KERNEL_API_URL \
    NEXT_PUBLIC_DOMAIN_API_URL=$NEXT_PUBLIC_DOMAIN_API_URL \
    NEXT_PUBLIC_DEV_TENANT_ID=$NEXT_PUBLIC_DEV_TENANT_ID
RUN NODE_ENV=production pnpm --filter @adrine/patient-app run build

FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo/apps/patient-app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/patient-app/.next/standalone /repo
COPY --from=build /repo/apps/patient-app/.next/static /repo/apps/patient-app/.next/static
WORKDIR /repo
EXPOSE 3000
CMD ["node", "apps/patient-app/server.js"]
