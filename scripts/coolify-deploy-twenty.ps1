# Deploy Twenty CRM to Coolify via API (requires write token)
# Usage:
#   $env:COOLIFY_WRITE_TOKEN="..." ; .\scripts\coolify-deploy-twenty.ps1
#   $env:COOLIFY_WRITE_TOKEN="..." ; .\scripts\coolify-deploy-twenty.ps1 -InstantDeploy

param(
    [string]$ApiToken = $env:COOLIFY_WRITE_TOKEN,
    [string]$CoolifyBase = 'http://187.127.129.209:8000/api/v1',
    [string]$ProjectUuid = 'umn8vjfqrqn7jglfr8wqee0i',
    [string]$EnvironmentUuid = 'fzhhu9uv8kltz49e51qxp58h',
    [string]$ServerUuid = 'gsk4hshqgd09oemlj9z9d6n5',
    [string]$DestinationUuid = 'kt0mkddiavm0eo3afpjzlseu',
    [switch]$InstantDeploy
)

$ErrorActionPreference = 'Stop'

if (-not $ApiToken) {
    Write-Error "Set COOLIFY_WRITE_TOKEN. Create at http://187.127.129.209:8000/security/api-tokens (write scope)."
    exit 1
}

$headers = @{
    Authorization  = "Bearer $ApiToken"
    Accept         = 'application/json'
    'Content-Type' = 'application/json'
}

$repoRoot = Split-Path $PSScriptRoot -Parent
$composePath = Join-Path $repoRoot 'deploy\twenty\docker-compose.coolify.yml'
if (-not (Test-Path $composePath)) {
    Write-Error "Missing $composePath"
    exit 1
}

# ASCII-only for Coolify API validation
$composeRaw = [System.IO.File]::ReadAllText($composePath)
$composeB64 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($composeRaw))

Write-Host '=== Coolify Twenty CRM deploy ===' -ForegroundColor Cyan
Write-Host "Compose: $composePath"

$body = @{
    type             = 'compose'
    name             = 'adrine-twenty-crm'
    description      = 'Full Twenty CRM for Navayu / Hospital OS embed'
    project_uuid     = $ProjectUuid
    environment_uuid = $EnvironmentUuid
    environment_name = 'production'
    server_uuid      = $ServerUuid
    destination_uuid = $DestinationUuid
    docker_compose_raw = $composeB64
    instant_deploy   = [bool]$InstantDeploy
    urls             = @(
        @{ name = 'twenty'; url = 'https://crm.adrine.in' }
    )
}

try {
    $resp = Invoke-RestMethod -Uri "$CoolifyBase/services" -Headers $headers -Method Post -Body ($body | ConvertTo-Json -Depth 6)
    $resp | ConvertTo-Json -Depth 5
    Write-Host ''
    Write-Host 'Service created. Next in Coolify UI:' -ForegroundColor Green
    Write-Host '  1. Set env: SERVER_URL, APP_SECRET, PG_DATABASE_PASSWORD'
    Write-Host '  2. Attach domain https://crm.adrine.in to twenty-server:3000'
    Write-Host '  3. Add frame-ancestors CSP for Vercel embed (see deploy/coolify/twenty-crm.md)'
    Write-Host '  4. Deploy / Start service'
    Write-Host '  5. Add TWENTY_CRM_URL + TWENTY_API_KEY on adrine-domain'
    Write-Host ''
    Write-Host 'Guide: deploy/coolify/twenty-crm.md'
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $detail = $reader.ReadToEnd()
    Write-Error "Coolify API failed ($status): $detail"
    exit 1
}
