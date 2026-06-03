# Trigger Coolify server Docker cleanup via UI workflow (save settings + manual cleanup hint)
# Usage: $env:COOLIFY_WRITE_TOKEN="..." ; .\scripts\coolify-docker-cleanup.ps1

param(
    [string]$ApiToken = $env:COOLIFY_WRITE_TOKEN,
    [string]$CoolifyBase = "http://187.127.129.209:8000",
    [string]$ServerUuid = "gsk4hshqgd09oemlj9z9d6n5"
)

if (-not $ApiToken) {
    Write-Error "Set COOLIFY_WRITE_TOKEN or pass -ApiToken. Create at $CoolifyBase/security/api-tokens"
    exit 1
}

$headers = @{
    Authorization  = "Bearer $ApiToken"
    Accept         = "application/json"
    "Content-Type" = "application/json"
}

Write-Host "Coolify server: $ServerUuid" -ForegroundColor Cyan
try {
    $server = Invoke-RestMethod -Uri "$CoolifyBase/api/v1/servers/$ServerUuid" -Headers $headers -Method Get
    Write-Host "Server: $($server.name) ($($server.ip))" -ForegroundColor Green
} catch {
    Write-Error "API failed (need write token?): $_"
    exit 1
}

Write-Host @"

No public API for manual docker cleanup on all Coolify versions.
Run cleanup in UI (fastest):

  $CoolifyBase/server/$ServerUuid/docker-cleanup
  -> Trigger Manual Cleanup -> Trigger Docker Cleanup
  -> DO NOT enable Delete Unused Volumes (Postgres safe)

Or on VPS terminal (safe commands in ops/VPS_DISK_CLEANUP.md):

  docker builder prune -af && docker image prune -af && docker container prune -f

"@ -ForegroundColor Yellow
