# Trigger Coolify redeploy for one or more apps.
# Usage:
#   $env:COOLIFY_WRITE_TOKEN="..." ; .\scripts\coolify-redeploy.ps1 -App hospital-os
#   $env:COOLIFY_WRITE_TOKEN="..." ; .\scripts\coolify-redeploy.ps1 -Uuid lm0z1tqxf5xm6mzme3veytnd -Force

param(
    [ValidateSet('hospital-os', 'kernel', 'domain', 'patient-app')]
    [string]$App = 'hospital-os',
    [string]$Uuid,
    [switch]$Force,
    [string]$ApiToken = $env:COOLIFY_WRITE_TOKEN,
    [string]$CoolifyBase = 'http://187.127.129.209:8000/api/v1'
)

$uuids = @{
    'hospital-os' = 'lm0z1tqxf5xm6mzme3veytnd'
    'kernel'      = 't36wqfoh1hj88qrizvbr0q9h'
    'domain'      = 'fxq9vh2765921yv0y6gvqs2z'
}

if (-not $Uuid) {
    $Uuid = $uuids[$App]
    if (-not $Uuid) {
        Write-Error "Unknown app '$App'. Pass -Uuid explicitly."
        exit 1
    }
}

if (-not $ApiToken) {
    Write-Error "Set COOLIFY_WRITE_TOKEN or pass -ApiToken. Create at http://187.127.129.209:8000/security/api-tokens (needs deploy+write)."
    exit 1
}

$headers = @{
    Authorization  = "Bearer $ApiToken"
    Accept         = 'application/json'
    'Content-Type' = 'application/json'
}

$body = @{ uuid = $Uuid }
if ($Force) { $body.force = $true }

Write-Host "Deploying $App ($Uuid)..." -ForegroundColor Cyan
try {
    $resp = Invoke-RestMethod -Uri "$CoolifyBase/deploy" -Headers $headers -Method Post -Body ($body | ConvertTo-Json)
    $resp | ConvertTo-Json -Depth 5
    Write-Host 'Deployment queued.' -ForegroundColor Green
} catch {
    Write-Error "Deploy failed: $_"
    exit 1
}
