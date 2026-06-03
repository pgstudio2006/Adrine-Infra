# Navayu Wave 0 — Coolify deploy helper (run AFTER Postgres/Redis are up)
# Requires: Coolify API token from http://187.127.129.209:8000/security/api-tokens
# Usage: .\scripts\coolify-deploy-navayu.ps1 -ApiToken "your-token"

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiToken,
    [string]$CoolifyBase = "http://187.127.129.209:8000/api/v1",
    [string]$ProjectUuid = "umn8vjfqrqn7jglfr8wqee0i",
    [string]$EnvironmentUuid = "fzhhu9uv8kltz49e51qxp58h",
    [string]$ServerUuid = "gsk4hshqgd09oemlj9z9d6n5",
    [string]$GitHubSourceUuid = "e10vr7ere12wqtvz14rkydsw"
)

$headers = @{
    Authorization = "Bearer $ApiToken"
    Accept        = "application/json"
    "Content-Type" = "application/json"
}

$pgPassword = "AdrineNavayu2026!Pg"
$jwtSecret  = "adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3"
# Replace with value from Coolify adrine-redis → Postgres/Redis URL field
$redisUrl   = "redis://default:CHANGE_ME@adrine-redis:6379/0"

$kernelDb = "postgresql://adrine:${pgPassword}@adrine-postgres:5432/adrine_kernel?schema=public"
$domainDb = "postgresql://adrine:${pgPassword}@adrine-postgres:5432/adrine_domain?schema=public"

Write-Host "=== Coolify Navayu deploy helper ===" -ForegroundColor Cyan
Write-Host "1. Verify API: GET $CoolifyBase/projects"
try {
    $projects = Invoke-RestMethod -Uri "$CoolifyBase/projects" -Headers $headers -Method Get
    Write-Host "   OK — $($projects.Count) project(s)" -ForegroundColor Green
} catch {
    Write-Error "API failed: $_"
    exit 1
}

Write-Host @"

2. Create apps manually in UI (API app creation varies by Coolify version):
   Project → production → + New → Private Repository (GitHub App)

   kernel-api:
     - Repo: Adrine (main)
     - Dockerfile: services/kernel-api/Dockerfile
     - Port: 3001
     - DATABASE_URL=$kernelDb
     - REDIS_URL=$redisUrl
     - JWT_SECRET=$jwtSecret
     - ALLOW_DEV_LOGIN=false

   domain-api:
     - Dockerfile: services/domain-api/Dockerfile
     - Port: 3002
     - DATABASE_URL=$domainDb
     - KERNEL_API_URL=http://adrine-kernel:3001

   patient-app:
     - Dockerfile: apps/patient-app/Dockerfile (repo root context)
     - Port: 3000
     - Domain: https://book.adrine.in
     - Build args: see deploy/coolify/patient-app.env.example

3. After deploy, run migrations in each app terminal:
   cd services/kernel-api && npx prisma migrate deploy
   cd services/domain-api && npx prisma migrate deploy

4. Provision Navayu from this machine:
   `$env:DATABASE_URL="$kernelDb"
   `$env:DOMAIN_DATABASE_URL="$domainDb"
   pnpm provision:navayu

See scripts/COOLIFY_NAVAYU_DEPLOY_STATUS.md for full UUIDs and URLs.
"@
