# Cut over Vercel to Oracle game server (run after Oracle /health works publicly)
param(
  [Parameter(Mandatory = $true)]
  [string]$OracleUrl
)

$ErrorActionPreference = "Stop"
$OracleUrl = $OracleUrl.TrimEnd("/")

Write-Host "Checking Oracle health at $OracleUrl/health ..."
$health = Invoke-RestMethod -Uri "$OracleUrl/health" -TimeoutSec 15
if (-not $health.ok) { throw "Oracle health check failed" }
Write-Host "Oracle OK"

Write-Host "Updating Vercel NEXT_PUBLIC_SOCKET_URL -> Oracle..."
echo $OracleUrl | npx vercel env add NEXT_PUBLIC_SOCKET_URL production --force 2>$null
if ($LASTEXITCODE -ne 0) {
  npx vercel env rm NEXT_PUBLIC_SOCKET_URL production --yes
  echo $OracleUrl | npx vercel env add NEXT_PUBLIC_SOCKET_URL production
}

Write-Host "Redeploying Vercel production..."
npx vercel --prod --yes

Write-Host ""
Write-Host "Cutover complete."
Write-Host "  UI:   https://smokedog.vercel.app"
Write-Host "  Game: $OracleUrl"
Write-Host ""
Write-Host "Railway backup (keep running): https://game-production-22ef.up.railway.app"
Write-Host "Rollback: .\scripts\rollback-to-railway.ps1"
