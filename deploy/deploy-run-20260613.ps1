# Deploiement GlimmerLog du 2026-06-13 (commit 1a87f8f) — execute en eleve (UAC).
# Le service API doit etre ARRETE pendant prisma generate (DLL query engine verrouillee sinon).
$ErrorActionPreference = "Stop"
Set-Location "C:\Users\kevin\Documents\lorcana app"
Start-Transcript -Path "C:\Users\kevin\Documents\lorcana app\deploy\deploy-run-20260613.log" -Force

# DATABASE_URL de PROD depuis la config du service NSSM (server/.env pointe sur l'ancienne base de dev)
$nssmEnv = nssm get GlimmerLogAPI AppEnvironmentExtra
$env:DATABASE_URL = (($nssmEnv | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=','').Trim()
if (-not $env:DATABASE_URL) { throw "DATABASE_URL introuvable dans le service NSSM GlimmerLogAPI" }

$failed = $false
try {
    Write-Host "[1/6] Arret du service API..." -ForegroundColor Cyan
    nssm stop GlimmerLogAPI
    Start-Sleep -Seconds 3

    Write-Host "[2/6] npm install..." -ForegroundColor Cyan
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install a echoue" }

    Write-Host "[3/6] Build serveur (prisma generate + db push + shared + server)..." -ForegroundColor Cyan
    npm run build:server
    if ($LASTEXITCODE -ne 0) { throw "build:server a echoue" }

    Write-Host "[4/6] prisma migrate deploy..." -ForegroundColor Cyan
    Push-Location server
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "migrate deploy a echoue" }
    Pop-Location

    Write-Host "[5/6] Build client..." -ForegroundColor Cyan
    $env:VITE_API_URL = "/api/v1"
    $env:VITE_GOOGLE_CLIENT_ID = "579520504030-1hltphn01kd65ft4keugfp102sgjns16.apps.googleusercontent.com"
    $env:VITE_DISCORD_CLIENT_ID = "1483223327827824833"
    npm run build --workspace=client
    if ($LASTEXITCODE -ne 0) { throw "build client a echoue" }
}
catch {
    $failed = $true
    Write-Host "ECHEC : $_" -ForegroundColor Red
}
finally {
    Write-Host "[6/6] Redemarrage du service API..." -ForegroundColor Cyan
    nssm start GlimmerLogAPI
    if ($failed) { Write-Host "DEPLOY FAILED (service relance sur l'ancien build)" -ForegroundColor Red }
    else { Write-Host "DEPLOY OK" -ForegroundColor Green }
    Stop-Transcript
}
if ($failed) { exit 1 } else { exit 0 }
