# Build from repository root:
#   docker build -f apps/hospital-os/Dockerfile .
FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
COPY . .
RUN NODE_ENV=development pnpm install --frozen-lockfile
ARG VITE_PLATFORM_RUNTIME=true
ARG VITE_API_PROVIDER=nest
ARG VITE_KERNEL_API_URL=https://kernel.adrine.in
ARG VITE_DOMAIN_API_URL=https://domain.adrine.in
ARG VITE_PATIENT_APP_URL=https://book.adrine.in
ARG VITE_TWENTY_CRM_URL=
ENV VITE_PLATFORM_RUNTIME=$VITE_PLATFORM_RUNTIME \
    VITE_API_PROVIDER=$VITE_API_PROVIDER \
    VITE_KERNEL_API_URL=$VITE_KERNEL_API_URL \
    VITE_DOMAIN_API_URL=$VITE_DOMAIN_API_URL \
    VITE_PATIENT_APP_URL=$VITE_PATIENT_APP_URL \
    VITE_TWENTY_CRM_URL=$VITE_TWENTY_CRM_URL
RUN NODE_ENV=production pnpm --filter @adrine/hospital-os... --workspace-concurrency=1 run build \
  && test -f /repo/apps/hospital-os/dist/index.html

FROM nginx:1.27-alpine
COPY deploy/nginx/hospital-os.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/hospital-os/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
