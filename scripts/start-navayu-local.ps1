# Navayu local stack — run from repo root: .\scripts\start-navayu-local.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$env:DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_domain?schema=public"
$env:JWT_DEV_SECRET = "dev-local-navayu"

Write-Host "Starting Docker (postgres + redis)..."
Set-Location $Root
docker compose up -d postgres redis

Write-Host "Ensure DBs exist (first run only)..."
docker exec adrinecloudinfra-postgres-1 psql -U adrine -d adrine -tc "SELECT 1 FROM pg_database WHERE datname='adrine_kernel'" | Out-Null
if (-not $?) {
  docker exec adrinecloudinfra-postgres-1 psql -U adrine -d adrine -c "CREATE DATABASE adrine_kernel; CREATE DATABASE adrine_domain;"
}

Write-Host "Schema sync + provision..."
Set-Location "$Root\services\kernel-api"
$env:DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_kernel?schema=public"
pnpm prisma db push 2>$null
Set-Location "$Root\services\domain-api"
$env:DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_domain?schema=public"
pnpm prisma db push 2>$null
Set-Location $Root
$env:DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL = "postgresql://adrine:adrine_dev@localhost:5432/adrine_domain?schema=public"
pnpm provision:navayu

Write-Host "Build APIs..."
Set-Location "$Root\services\kernel-api"
pnpm build
Copy-Item -Recurse -Force src\generated dist\generated
Set-Location "$Root\services\domain-api"
pnpm build
Copy-Item -Recurse -Force src\generated dist\generated

Write-Host ""
Write-Host "Open in browser:"
Write-Host "  Hospital OS:  http://localhost:3100"
Write-Host "  Patient app:  http://localhost:3101/intake?visitId=demo-1"
Write-Host ""
Write-Host "Dev-login (pick role on login screen, tenant_navayu is in .env):"
Write-Host "  reception@navayuhealth.in / junior@ / senior@ (use platform dev-login flow)"
Write-Host ""
Write-Host "Start APIs in separate terminals:"
Write-Host "  kernel:  cd services/kernel-api && `$env:DATABASE_URL='postgresql://adrine:adrine_dev@localhost:5432/adrine_kernel?schema=public'; node dist/main.js"
Write-Host "  domain:  cd services/domain-api && `$env:DATABASE_URL='postgresql://adrine:adrine_dev@localhost:5432/adrine_domain?schema=public'; `$env:PORT='3002'; node dist/main.js"
Write-Host "  hos:     cd apps/hospital-os && pnpm dev"
Write-Host "  patient: cd apps/patient-app && pnpm dev"
