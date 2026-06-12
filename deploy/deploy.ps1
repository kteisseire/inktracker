# GlimmerLog - Deploiement local (self-host Windows)
# Lancer dans un PowerShell ADMIN : powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

# La base de PROD est celle du service NSSM (glimmerlog), PAS celle de server/.env
# (reste sur l'ancienne base de dev lorcana_tracker). On injecte la DATABASE_URL
# du service pour que prisma db push / migrate deploy ciblent la bonne base :
# la variable d'environnement a priorite sur server/.env pour le CLI Prisma.
$nssmEnv = nssm get GlimmerLogAPI AppEnvironmentExtra
$env:DATABASE_URL = (($nssmEnv | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=','').Trim()
if (-not $env:DATABASE_URL) { throw "Impossible de lire DATABASE_URL depuis le service NSSM GlimmerLogAPI" }

# IMPORTANT : le service doit etre ARRETE avant prisma generate.
# Sur Windows, le service verrouille query_engine-windows.dll.node dans node_modules
# ce qui provoque une erreur EPERM rename si on tente de le remplacer pendant qu'il tourne.
# Le bloc finally garantit le redemarrage meme en cas d'echec du build.
$failed = $false
try {
    Write-Host "[1/6] Arret du service API (requis pour prisma generate)..." -ForegroundColor Cyan
    nssm stop GlimmerLogAPI
    Start-Sleep -Seconds 3

    Write-Host "[2/6] npm install (restaure les binaires natifs Windows)..." -ForegroundColor Cyan
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install a echoue" }

    Write-Host "[3/6] Build serveur (prisma generate + db push + shared + server)..." -ForegroundColor Cyan
    npm run build:server
    if ($LASTEXITCODE -ne 0) { throw "build:server a echoue" }

    Write-Host "[4/6] Migrations base locale..." -ForegroundColor Cyan
    Push-Location server
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "migrate deploy a echoue" }
    Pop-Location

    Write-Host "[5/6] Build client (meme origine /api/v1)..." -ForegroundColor Cyan
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
    if ($failed) {
        Write-Host "DEPLOY FAILED — service relance sur l'ancien build. Verifier les logs." -ForegroundColor Red
    } else {
        Write-Host "Deploiement termine. Verifie https://glimmerlog.com (robots.txt, page /metagame)." -ForegroundColor Green
    }
}
if ($failed) { exit 1 } else { exit 0 }
