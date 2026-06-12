# Auto-hébergement GlimmerLog sur un PC Windows (accès public)

Migration de **Vercel + Railway + Neon** vers **ton PC Windows** : tout tourne
en local (front + API + base), accessible publiquement sur `glimmerlog.com`.

> ⚠️ Contraintes à accepter : PC allumé 24/7, électricité (~20-50 €/an),
> IP Orange dynamique (gérée par DDNS), sécurité d'une machine perso exposée.
> Si la fiabilité devient un souci, un VPS à ~4 €/mois reste l'alternative.

## Architecture

```
Internet ──HTTPS──> Livebox (80/443) ──> PC Windows (192.168.1.67)
                                            ├─ Caddy   : front statique + reverse-proxy + HTTPS auto
                                            │     /        → client\dist (SPA React)
                                            │     /api/v1  → 127.0.0.1:3001
                                            ├─ Node     : API Express (port 3001)  [service Windows]
                                            └─ PostgreSQL 17 (127.0.0.1:5432)        [déjà installé]
```

Front + API même origine via Caddy → **pas de CORS**, HTTPS automatique.

Déjà présent sur cette machine (vérifié) :
- Node v24, npm, git
- PostgreSQL 17.9 (service `postgresql-x64-17`, binaires dans `C:\Program Files\PostgreSQL\17\bin`)
- winget (pour installer Caddy + NSSM)
- IP publique 91.160.29.66 (pas de CGNAT), IP locale 192.168.1.67, box 192.168.1.254

Fichiers fournis dans le repo :
- `deploy\Caddyfile` — config Caddy (ADAPTE le chemin `root`)
- `.env.windows.example` — modèle des variables serveur

> Toutes les commandes sont à lancer dans **PowerShell**. Celles marquées (Admin)
> nécessitent un PowerShell « Exécuter en tant qu'administrateur ».

---

## 1. Sauvegarder la base Neon (À FAIRE EN PREMIER)

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
  "postgresql://...neon.tech/...?sslmode=require" -Fc -f "$HOME\glimmerlog_backup.dump"
```

Garde ce `.dump` : c'est toute ta base.

---

## 2. Passer le DNS de glimmerlog.com chez Cloudflare

1. Crée un compte gratuit sur cloudflare.com, ajoute le site `glimmerlog.com`.
2. Cloudflare te donne 2 serveurs de noms (`xxx.ns.cloudflare.com`).
3. Chez ton **registrar actuel**, remplace les serveurs de noms par ceux de Cloudflare.
4. Attends la propagation (quelques minutes à quelques heures).

Avantages pour ton cas : DDNS automatique (IP dynamique) + validation HTTPS
DNS-01 si Orange bloque le port 80.

Crée un **API Token** Cloudflare (My Profile → API Tokens → Create) avec la
permission `Zone:DNS:Edit` sur `glimmerlog.com`. Garde-le : il sert au DDNS et,
au besoin, à Caddy DNS-01.

---

## 3. Fixer l'IP locale du PC (bail statique)

Pour que la redirection de ports vise toujours la bonne machine après reboot :
- Soit dans la **Livebox** (`http://192.168.1.254` → DHCP → réservation par MAC → 192.168.1.67).
- Soit en IP statique Windows (Paramètres réseau → IPv4 manuel : 192.168.1.67 / 255.255.255.0 / passerelle 192.168.1.254 / DNS 192.168.1.254).

---

## 4. DDNS : maintenir glimmerlog.com → ton IP

L'IP Orange peut changer. Option simple avec Cloudflare : un script PowerShell
planifié qui met à jour l'enregistrement A.

Crée `C:\glimmerlog\ddns.ps1` :

```powershell
$token  = "TON_TOKEN_CLOUDFLARE"
$zoneId = "ID_DE_LA_ZONE"      # Cloudflare → Overview → Zone ID
$recId  = "ID_DE_L_ENREGISTREMENT_A"  # via l'API Cloudflare (voir doc) 
$name   = "glimmerlog.com"
$ip = (Invoke-RestMethod "https://api.ipify.org?format=json").ip
$body = @{ type="A"; name=$name; content=$ip; ttl=120; proxied=$false } | ConvertTo-Json
Invoke-RestMethod -Method PUT `
  -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$recId" `
  -Headers @{ Authorization="Bearer $token"; "Content-Type"="application/json" } `
  -Body $body | Out-Null
```

Planifie-le toutes les 5 min (Planificateur de tâches, ou) :
```powershell
# (Admin)
schtasks /create /tn "GlimmerLog DDNS" /tr "powershell -NoProfile -File C:\glimmerlog\ddns.ps1" /sc minute /mo 5 /ru SYSTEM
```

> Alternative clé en main : l'outil `cloudflared` ou `cloudflare-ddns`.
> Le proxy Cloudflare (`proxied=true`) peut aussi masquer ton IP — mais
> complique le HTTPS local ; on reste en `proxied=false` ici.

---

## 5. Ouvrir les ports sur la Livebox + tester le port 80

Dans `http://192.168.1.254` → **Réseau → NAT/PAT** : deux règles vers 192.168.1.67
- TCP **443** → 443
- TCP **80** → 80

⚠️ Orange bloque parfois le **80 entrant**. Pour tester une fois Caddy lancé
(étape 8), depuis l'extérieur (4G du téléphone, PAS le Wi-Fi maison) :
`http://glimmerlog.com` doit répondre. Si le 80 est bloqué :
→ on utilisera la validation **DNS-01** (voir étape 7, bloc `tls`) qui n'a pas
besoin du port 80. Le 443 suffit alors pour servir le site.

---

## 6. Créer la base PostgreSQL locale + importer Neon

```powershell
$pg = "C:\Program Files\PostgreSQL\17\bin"
# Crée l'utilisateur et la base (te demandera le mot de passe du superuser 'postgres')
& "$pg\psql.exe" -U postgres -c "CREATE USER glimmer WITH PASSWORD 'CHANGE_MOI';"
& "$pg\psql.exe" -U postgres -c "CREATE DATABASE glimmerlog OWNER glimmer;"

# Importe le dump Neon
& "$pg\pg_restore.exe" --clean --if-exists --no-owner `
  -U glimmer -d glimmerlog "$HOME\glimmerlog_backup.dump"

# Vérifie
& "$pg\psql.exe" -U glimmer -d glimmerlog -c "\dt"
```

---

## 7. Configurer + builder l'app

```powershell
# Dans le dossier du repo
cd "C:\glimmerlog\lorcana-app"   # adapte au vrai chemin du repo

# Variables serveur
Copy-Item .env.windows.example server\.env
notepad server\.env   # DATABASE_URL (mot de passe), JWT_SECRET, secrets OAuth...

# Build serveur (Prisma generate + db push + build)
npm run build:server

# Applique les migrations sur la base locale
cd server; npx prisma migrate deploy; cd ..

# Build du front en MÊME ORIGINE (/api/v1 via Caddy)
$env:VITE_API_URL = "/api/v1"
$env:VITE_GOOGLE_CLIENT_ID = "579520504030-1hltphn01kd65ft4keugfp102sgjns16.apps.googleusercontent.com"
$env:VITE_DISCORD_CLIENT_ID = "1483223327827824833"
npm run build --workspace=client
# => produit client\dist
```

Vérifie le chemin `root` dans `deploy\Caddyfile` : il doit pointer vers le
`client\dist` réel (ex. `C:/glimmerlog/lorcana-app/client/dist`).

---

## 8. Installer + lancer Caddy

```powershell
# (Admin)
winget install CaddyServer.Caddy

# Test manuel (depuis le dossier contenant le Caddyfile)
caddy run --config deploy\Caddyfile
```

Caddy obtient automatiquement le certificat HTTPS. Laisse tourner et teste
depuis l'extérieur (4G) : `https://glimmerlog.com`.

**Si le port 80 est bloqué par Orange** (le certificat HTTP-01 échoue) :
1. Installe une version de Caddy avec le module Cloudflare :
   `caddy add-package github.com/caddy-dns/cloudflare` (ou télécharge le build custom).
2. Décommente le bloc `tls { dns cloudflare {env.CLOUDFLARE_API_TOKEN} }` du Caddyfile.
3. Définis la variable d'env `CLOUDFLARE_API_TOKEN` (le token de l'étape 2).
4. Relance Caddy : le certificat est validé par DNS, sans port 80.

---

## 9. Démarrage automatique 24/7 (services Windows via NSSM)

PostgreSQL est déjà un service. On transforme **l'API Node** et **Caddy** en services.

```powershell
# (Admin)
winget install NSSM.NSSM   # ou: choco install nssm

# --- Service API Node ---
nssm install GlimmerLogAPI "C:\Program Files\nodejs\node.exe" "C:\glimmerlog\lorcana-app\server\dist\index.js"
nssm set GlimmerLogAPI AppDirectory "C:\glimmerlog\lorcana-app\server"
nssm set GlimmerLogAPI Start SERVICE_AUTO_START
nssm start GlimmerLogAPI

# --- Service Caddy ---
nssm install GlimmerLogCaddy "C:\Users\<toi>\AppData\Local\Microsoft\WinGet\...\caddy.exe" "run --config C:\glimmerlog\lorcana-app\deploy\Caddyfile"
nssm set GlimmerLogCaddy AppDirectory "C:\glimmerlog\lorcana-app"
nssm set GlimmerLogCaddy Start SERVICE_AUTO_START
nssm start GlimmerLogCaddy
```

> Le chemin exact de `caddy.exe` dépend de l'install winget — récupère-le avec
> `(Get-Command caddy).Source`. Le service charge `server\.env` car l'API lit
> `dotenv` au démarrage avec `AppDirectory` = dossier server.

Vérifie : `Get-Service GlimmerLogAPI, GlimmerLogCaddy`. Redémarre le PC pour
confirmer que tout remonte seul.

---

## 10. Mettre à jour les OAuth

- **Google Cloud Console** → identifiants OAuth → *Origines JavaScript autorisées* :
  ajoute `https://glimmerlog.com`.
- **Discord Developer Portal** → OAuth2 → Redirects :
  `https://glimmerlog.com/auth/discord/callback`.

---

## 11. Vérifier en prod (depuis l'extérieur)

Depuis ton **téléphone en 4G** (pas le Wi-Fi maison, qui court-circuiterait le test) :
`https://glimmerlog.com` → connexion email, Google, Discord, création de tournoi,
upload photo, mode hors-ligne PWA. Vérifie le cadenas HTTPS valide.

---

## 12. Couper Vercel / Railway / Neon

Une fois la prod locale validée et stable quelques jours :
- Supprime/pause le projet **Vercel** (front).
- Arrête le service **Railway** (API).
- Ferme le projet **Neon** (base) — tu as déjà tout importé en local.

---

## Opérations courantes

**Mettre à jour après un changement de code :**
```powershell
cd C:\glimmerlog\lorcana-app
git pull
npm run build:server
cd server; npx prisma migrate deploy; cd ..
$env:VITE_API_URL="/api/v1"; npm run build --workspace=client
# (Admin)
nssm restart GlimmerLogAPI
# Caddy n'a pas besoin de redémarrer (fichiers statiques rechargés à chaud)
```

**Logs :** Caddy et l'API écrivent dans la sortie capturée par NSSM
(configurable via `nssm set <service> AppStdout C:\glimmerlog\logs\api.log`).

**Sauvegarde quotidienne (tâche planifiée) :**
```powershell
# (Admin) — dump quotidien à 3h
$cmd = "& 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe' -U glimmer -Fc glimmerlog -f C:\glimmerlog\backups\glimmerlog_$(Get-Date -Format yyyy-MM-dd).dump"
schtasks /create /tn "GlimmerLog Backup" /tr "powershell -NoProfile -Command \"$cmd\"" /sc daily /st 03:00
```

---

## Sécurité (important — machine perso exposée)

- Active le **pare-feu Windows** ; n'ouvre QUE 80/443 vers l'extérieur (via la Livebox).
- Postgres écoute sur `localhost` uniquement (par défaut) — ne l'expose JAMAIS.
- Mots de passe forts pour `postgres`, `glimmer`, `JWT_SECRET`.
- Tiens Windows + Node + Postgres + Caddy à jour.
- Pense à un backup **hors-site** (copie le `.dump` sur un cloud) en plus du local.
- Idéalement, isole le PC sur un VLAN/réseau invité pour ne pas exposer tes
  autres appareils si le service est compromis.
