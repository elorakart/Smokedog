# Rollback Vercel to Railway game server (run from project root on your PC)

$ErrorActionPreference = "Stop"
$RailwayUrl = "https://game-production-22ef.up.railway.app"

Write-Host "Checking Railway health..."
$health = Invoke-RestMethod -Uri "$RailwayUrl/health" -TimeoutSec 15
if (-not $health.ok) { throw "Railway health check failed" }
Write-Host "Railway OK: $RailwayUrl"

Write-Host "Updating Vercel NEXT_PUBLIC_SOCKET_URL -> Railway..."
echo $RailwayUrl | npx vercel env add NEXT_PUBLIC_SOCKET_URL production --force 2>$null
if ($LASTEXITCODE -ne 0) {
  npx vercel env rm NEXT_PUBLIC_SOCKET_URL production --yes
  echo $RailwayUrl | npx vercel env add NEXT_PUBLIC_SOCKET_URL production
}

Write-Host "Redeploying Vercel production..."
npx vercel --prod --yes

Write-Host ""
Write-Host "Rollback complete. UI: https://smokedog.vercel.app"
Write-Host "Game server: $RailwayUrl"
