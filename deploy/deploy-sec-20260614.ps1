# Deploiement securite du 2026-06-14 (correctifs serveur + headers Caddy).
# Execute en eleve (UAC). Pas de changement client.
$ErrorActionPreference = "Stop"
Set-Location "C:\Users\kevin\Documents\lorcana app"
Start-Transcript -Path "C:\Users\kevin\Documents\lorcana app\deploy\deploy-sec-20260614.log" -Force

$nssmEnv = nssm get GlimmerLogAPI AppEnvironmentExtra
$env:DATABASE_URL = (($nssmEnv | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=','').Trim()
if (-not $env:DATABASE_URL) { throw "DATABASE_URL introuvable dans le service NSSM" }

$failed = $false
try {
    Write-Host "[1/4] Arret du service API (requis pour prisma generate)..." -ForegroundColor Cyan
    nssm stop GlimmerLogAPI
    Start-Sleep -Seconds 3

    Write-Host "[2/4] Build serveur (prisma generate + db push no-op + shared + server)..." -ForegroundColor Cyan
    npm run build:server
    if ($LASTEXITCODE -ne 0) { throw "build:server a echoue" }
}
catch {
    $failed = $true
    Write-Host "ECHEC : $_" -ForegroundColor Red
}
finally {
    Write-Host "[3/4] Redemarrage du service API..." -ForegroundColor Cyan
    nssm start GlimmerLogAPI
    Write-Host "[4/4] Rechargement de Caddy (nouveaux en-tetes de securite)..." -ForegroundColor Cyan
    nssm restart GlimmerLogCaddy
    if ($failed) { Write-Host "DEPLOY SECURITE FAILED" -ForegroundColor Red }
    else { Write-Host "DEPLOY SECURITE OK" -ForegroundColor Green }
    Stop-Transcript
}
if ($failed) { exit 1 } else { exit 0 }
