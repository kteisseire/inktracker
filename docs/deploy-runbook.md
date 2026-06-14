# GlimmerLog — Runbook de déploiement (self-host Windows)

Dernière mise à jour : 2026-06-13 (commit 1a87f8f).
Destiné aux agents IA et aux développeurs humains qui reprennent le projet à froid.

---

## 1. Architecture de production

```
Internet
   │ HTTPS (géré par Cloudflare)
   ▼
Cloudflare Tunnel (cloudflared)
   │ HTTP vers localhost:8080
   ▼
GlimmerLogCaddy  (service NSSM)
   caddy run --config deploy\Caddyfile.localtest
   Écoute sur :8080
   │
   ├── /api/*   → reverse_proxy 127.0.0.1:3001
   ├── /health  → reverse_proxy 127.0.0.1:3001
   └── /*       → fichiers statiques client\dist (SPA React, fallback index.html)
                  Cache-Control: immutable pour /assets/*, no-cache pour index.html/sw.js
   │
   ▼
GlimmerLogAPI   (service NSSM)
   node server\dist\index.js
   AppDirectory = <repo>\server
   PORT=3001, NODE_ENV=production
   │
   ▼
PostgreSQL 17   (service Windows "postgresql-x64-17")
   Base : glimmerlog
   Utilisateur : glimmer
   Hôte : localhost:5432
```

### Fichiers de configuration clés

| Fichier | Rôle |
|---|---|
| `deploy\Caddyfile.localtest` | **Config Caddy de PROD** (malgré le nom "localtest"). Chemin correct vers `client/dist`. |
| `deploy\Caddyfile` | TEMPLATE OBSOLÈTE — chemin `C:/glimmerlog/...` qui n'existe pas sur cette machine. Ne pas utiliser. |
| `deploy\deploy.ps1` | Script de déploiement principal (admin PowerShell). |
| `deploy\deploy-run-20260613.ps1` | Script du déploiement du 2026-06-13 — référence pour le modèle stop/build/finally. |
| `server\prisma\schema.prisma` | Schéma Prisma — source de vérité du schéma DB. |
| `server\.env` | **PÉRIMÉ** (voir piège 2 ci-dessous). Ne pas utiliser pour les opérations Prisma en prod. |

### Variables d'environnement de production

Les variables de l'API sont stockées dans la config NSSM du service, **pas** dans `server/.env`.

Pour les lire (PowerShell admin) :
```powershell
nssm get GlimmerLogAPI AppEnvironmentExtra
```

Variables présentes :
```
DATABASE_URL=postgresql://glimmer:***@localhost:5432/glimmerlog
CLIENT_URL=https://glimmerlog.com
DISCORD_REDIRECT_URI=https://glimmerlog.com/auth/discord/callback
PORT=3001
NODE_ENV=production
JWT_SECRET=***
GOOGLE_CLIENT_ID=***
DISCORD_CLIENT_ID=***
DISCORD_CLIENT_SECRET=***
RESEND_API_KEY=***
ADMIN_EMAILS=***
```

> Les secrets (mots de passe, tokens) ne sont jamais écrits dans ce fichier.
> Pour retrouver une valeur, utiliser `nssm get GlimmerLogAPI AppEnvironmentExtra`.

---

## 2. Pièges critiques à connaître avant tout déploiement

### Piège 1 — `server/.env` pointe sur l'ancienne base de dev

`server/.env` date de mars 2026 et pointe sur la base `lorcana_tracker` avec l'utilisateur `postgres`.
**La base de prod s'appelle `glimmerlog` et utilise l'utilisateur `glimmer`.**

Le CLI Prisma (`db push`, `migrate deploy`, `studio`) lit `server/.env` par défaut **sauf** si la variable
d'environnement `DATABASE_URL` est définie dans le shell — auquel cas la variable shell a la priorité.

`deploy.ps1` injecte `DATABASE_URL` depuis NSSM avant toute étape Prisma. Ne jamais ignorer cette étape.

Pour vérifier manuellement que le CLI Prisma cible la bonne base :
```powershell
$nssmEnv = nssm get GlimmerLogAPI AppEnvironmentExtra
$env:DATABASE_URL = (($nssmEnv | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=','').Trim()
cd server
npx prisma db execute --stdin <<< "SELECT current_database();"
```

### Piège 2 — `prisma generate` échoue si le service API tourne (EPERM Windows)

Quand le service `GlimmerLogAPI` est démarré, Node.js verrouille le fichier
`node_modules\.prisma\client\query_engine-windows.dll.node`.

Tenter `prisma generate` (qui fait partie de `build:server`) alors que le service tourne produit :
```
Error: EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp' → '...query_engine-windows.dll.node'
```

**Solution** : toujours arrêter le service avant le build, le redémarrer dans un bloc `finally`.
`deploy.ps1` implémente ce pattern. Ne jamais relancer le build sans d'abord vérifier que le service est arrêté.

```powershell
nssm stop GlimmerLogAPI
# ... build ...
nssm start GlimmerLogAPI
```

`nssm stop/start` requiert un PowerShell exécuté en tant qu'administrateur.

### Piège 3 — `prisma db push --accept-data-loss` dans `build:server`

Le script `build:server` du `package.json` racine contient :
```
npx prisma db push --accept-data-loss
```

Ce flag supprime toute demande de confirmation pour les changements destructifs (suppression de colonne,
renommage, etc.). En production, cela signifie qu'un changement de schéma mal maîtrisé peut détruire
des données sans avertissement.

De plus, l'historique des migrations est incohérent : une seule migration (`init` de mars 2026) alors que
la base a évolué via `db push` depuis. `migrate deploy` est donc de facto un no-op.

**Plan de remédiation (non appliqué à ce jour)** :
1. Créer une migration baseline : `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations/0_init.sql` puis enregistrer l'état actuel.
2. Remplacer `db push --accept-data-loss` par `migrate deploy` dans `build:server`.
3. Pour chaque nouvelle évolution du schéma : `npx prisma migrate dev --name <nom>` en dev, puis `migrate deploy` en prod.

### Piège 4 — Builder le client dans ce repo = publication IMMÉDIATE en prod

Caddy sert `client/dist` **directement depuis ce repo** (pas de copie de déploiement).
Tout `npm run build --workspace=client` remplace donc instantanément le front servi sur
glimmerlog.com — y compris un build de vérification de code non reviewé, ou un build
lancé **sans** `VITE_GOOGLE_CLIENT_ID`/`VITE_DISCORD_CLIENT_ID` (ce qui casse les logins
OAuth en prod jusqu'au build suivant). Règles :
- Ne jamais builder le client dans ce repo juste « pour vérifier que ça compile » — utiliser `npx tsc -b client` seul.
- Si un build complet est nécessaire, toujours fournir les trois variables `VITE_*` (voir `deploy/deploy.ps1`).

---

## 3. Procédure de déploiement pas-à-pas

### Prérequis

- PowerShell exécuté **en tant qu'administrateur** (UAC)
- `nssm`, `node`, `npm`, `git` dans le PATH
- `pg_dump.exe` accessible (chemin `C:\Program Files\PostgreSQL\17\bin\pg_dump.exe`)

### Étape A — Backup pré-déploiement

```powershell
$date = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupDir = "C:\Users\kevin\Documents\glimmerlog-backups"
New-Item -ItemType Directory -Force $backupDir | Out-Null
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U glimmer -Fc glimmerlog -f "$backupDir\glimmerlog_$date.dump"
Write-Host "Backup : $backupDir\glimmerlog_$date.dump"
```

Conserver ce dump jusqu'à validation complète de la prod.

### Étape B — Pull du code

```powershell
cd "C:\Users\kevin\Documents\lorcana app"
git pull
git log --oneline -5   # Vérifier le bon commit
```

### Étape C — Déploiement

```powershell
# Admin PowerShell requis
powershell -ExecutionPolicy Bypass -File "C:\Users\kevin\Documents\lorcana app\deploy\deploy.ps1"
```

Le script réalise dans l'ordre :
1. Lit `DATABASE_URL` depuis NSSM et l'injecte dans `$env:DATABASE_URL`
2. Arrête le service `GlimmerLogAPI`
3. `npm install`
4. `npm run build:server` (prisma generate + db push + shared + server)
5. `npx prisma migrate deploy`
6. `npm run build --workspace=client`
7. Redémarre `GlimmerLogAPI` (dans un bloc `finally` — redémarre même en cas d'échec)

### Étape D — Vérifications post-déploiement

Depuis un réseau extérieur (4G, pas le Wi-Fi local) ou via `curl` :

```powershell
# Health check API
Invoke-RestMethod "https://glimmerlog.com/health"

# robots.txt (doit exister et lister le sitemap)
Invoke-WebRequest "https://glimmerlog.com/robots.txt" | Select-Object -ExpandProperty Content

# sitemap.xml
Invoke-WebRequest "https://glimmerlog.com/sitemap.xml" | Select-Object StatusCode

# Page /metagame (SPA — doit retourner index.html avec 200)
Invoke-WebRequest "https://glimmerlog.com/metagame" | Select-Object StatusCode

# Endpoint auth doit retourner 401 sans token
(Invoke-WebRequest "https://glimmerlog.com/api/v1/auth/me" -ErrorAction SilentlyContinue).StatusCode
# Attendu : 401

# Vérifier le hash du bundle JS côté client vs site
$distHash = (Get-ChildItem "C:\Users\kevin\Documents\lorcana app\client\dist\assets\index-*.js" | Select-Object -First 1).Name
Write-Host "Bundle local : $distHash"
# Comparer avec le nom du fichier chargé dans le navigateur (DevTools → Network → JS)
```

Vérification du statut des services :
```powershell
Get-Service GlimmerLogAPI, GlimmerLogCaddy
nssm status GlimmerLogAPI
```

---

## 4. Procédure de rollback

### Rollback code (sans perte de données)

```powershell
# Identifier le commit précédent
git log --oneline -10

# Revenir au commit précédent
git checkout <commit-precedent>

# Rebuilder et redéployer
powershell -ExecutionPolicy Bypass -File "C:\Users\kevin\Documents\lorcana app\deploy\deploy.ps1"
```

### Rollback base de données (si le schéma a changé)

Si `db push` a appliqué un changement destructif, restaurer depuis le dump pré-déploiement :

```powershell
# Arrêter l'API (pour éviter des connexions actives pendant la restauration)
nssm stop GlimmerLogAPI

$dump = "C:\Users\kevin\Documents\glimmerlog-backups\glimmerlog_YYYY-MM-DD_HHMM.dump"  # adapter la date

# Restaurer
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" `
  --clean --if-exists --no-owner `
  -U glimmer -d glimmerlog $dump

# Revenir au code compatible avec le schéma restauré, puis redéployer
git checkout <commit-precedent>
powershell -ExecutionPolicy Bypass -File "C:\Users\kevin\Documents\lorcana app\deploy\deploy.ps1"
```

---

## 5. Sauvegardes

### Situation actuelle

Un dump manuel a été réalisé le 2026-06-13 dans `C:\Users\kevin\Documents\glimmerlog-backups\`
via `pg_dump` PostgreSQL 17 avant le déploiement du commit 1a87f8f.

**Aucune tâche planifiée de backup automatique n'est en place.**

### Backup automatique recommandé

Créer une tâche planifiée quotidienne (admin PowerShell) :

```powershell
$backupDir = "C:\Users\kevin\Documents\glimmerlog-backups"
$cmd = "& 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe' -U glimmer -Fc glimmerlog -f '$backupDir\glimmerlog_\$(Get-Date -Format yyyy-MM-dd).dump'"
schtasks /create /tn "GlimmerLog Backup" /tr "powershell -NoProfile -Command `"$cmd`"" /sc daily /st 03:00 /ru SYSTEM /f
```

Penser également à un backup hors-site (copie du `.dump` vers un cloud) pour protéger contre
la perte de la machine locale.

---

## 6. Dette technique connue

### 6.1 `prisma db push --accept-data-loss` en prod

Voir Piège 3 ci-dessus. Risque : perte de données silencieuse sur tout changement de schéma destructif.
Migration baseline + passage à `migrate deploy` est la remédiation recommandée.

### 6.2 Endpoint `/api/v1/metagame/overview` — performances

L'implémentation actuelle (`server/src/controllers/metagame.controller.ts`) charge **toutes les rondes**
de la base en mémoire puis agrège côté Node. Sur un volume important (> 50 000 rondes), cela deviendra
un goulot d'étranglement mémoire et CPU.

Remédiation recommandée :
- Remplacer le `findMany` par un `groupBy` SQL directement via Prisma ou une requête brute.
- Ajouter un cache court (ex. 5 minutes via `node-cache` ou Redis) sur le résultat agrégé, paramétré par les filtres date.

### 6.3 `RoundTimer` continue en négatif après 00:00

`client/src/components/RoundTimer.tsx` : le `setInterval` n'est pas arrêté quand `seconds` atteint 0.
Le commentaire dans le code dit "stop auto-counting down further" mais `clearInterval` n'est jamais appelé
dans la callback — le timer affiche `-00:01`, `-00:02`, etc. indéfiniment.

Correction : ajouter `if (next < 0) { clearInterval(timerRef.current!); return; }` ou
`if (next <= 0) { setRunning(false); }` dans la callback `setInterval`.

### 6.4 Divergence `maxLength` notes : 500 client vs 2000 serveur

Le validateur Zod serveur (`server/src/validators/matchupNote.schema.ts`) accepte jusqu'à 2000 caractères
pour le champ `content`. Si le client impose une limite de 500, l'UI rejettera des saisies que le serveur
accepterait. Aligner les deux limites (préférablement en exportant la constante depuis `packages/shared`).

### 6.5 Pas de `.gitattributes` — pollution CRLF/LF

Le repo n'a pas de fichier `.gitattributes`. Sans cette configuration, Git laisse les fins de ligne
dépendre de l'OS, ce qui a causé un diff pollué de ~3000 lignes lors du déploiement du 2026-06-13
(fichier `LoreCounter.tsx` entièrement marqué comme modifié).

Ajouter un `.gitattributes` à la racine avec au minimum :
```
* text=auto eol=lf
*.ps1 text eol=crlf
```

---

## 7. Logs et diagnostic

```powershell
# Logs du service API (si AppStdout/AppStderr configurés dans NSSM)
nssm get GlimmerLogAPI AppStdout
nssm get GlimmerLogAPI AppStderr

# Configurer les logs NSSM si non fait :
nssm set GlimmerLogAPI AppStdout "C:\Users\kevin\Documents\glimmerlog-logs\api.log"
nssm set GlimmerLogAPI AppStderr "C:\Users\kevin\Documents\glimmerlog-logs\api-err.log"
nssm set GlimmerLogAPI AppRotateFiles 1

# Statut des services
Get-Service GlimmerLogAPI, GlimmerLogCaddy | Format-Table Name, Status, StartType

# Test rapide de l'API en local
Invoke-RestMethod "http://localhost:3001/health"
```
