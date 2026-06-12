# Déploiement GlimmerLog sur un VPS (auto-hébergé)

Migration de **Vercel + Railway + Neon** vers **un seul VPS** avec Docker.

> Le `DEPLOY.md` documente l'hébergement cloud actuel — garde-le tant que la
> migration n'est pas validée, puis bascule les DNS quand le VPS est prêt.

Architecture cible (tout sur la même machine, un seul domaine) :

```
Internet ──HTTPS──> nginx (hôte) ──┬── /api/v1 ──> conteneur server  (127.0.0.1:3001)
                                   └── /        ──> conteneur client  (127.0.0.1:8080, SPA)
                                                       conteneur db    (Postgres, interne)
```

Même domaine pour client + API → **pas de CORS**, OAuth Google/Discord simple.

Fichiers fournis dans le repo :
- `docker-compose.yml` — orchestration des 3 conteneurs
- `server/Dockerfile` — build + runtime du serveur Express (migrations Prisma au démarrage)
- `client/Dockerfile` + `client/nginx-spa.conf` — build Vite + service du SPA
- `deploy/nginx.conf` — reverse-proxy + TLS (nginx hôte)
- `.env.production.example` — modèle de variables

---

## 0. Prérequis

- VPS Ubuntu 24.04 (2 vCPU / 4 Go conseillé : Hetzner CX22 ~4€/mois, OVH, DigitalOcean)
- Le domaine `glimmerlog.com` (repointer les DNS vers l'IP du VPS)
- Ta **connection string Neon** (pour exporter les données)

---

## 1. Sauvegarder la base Neon (À FAIRE EN PREMIER)

Depuis ton PC (PowerShell, `pg_dump` installé) ou plus tard depuis le VPS :

```powershell
pg_dump "postgresql://...neon.tech/...?sslmode=require" -Fc -f glimmerlog_backup.dump
```

Conserve ce fichier `.dump` précieusement — c'est toute ta base.

---

## 2. Préparer le VPS

```bash
ssh root@TON_IP

adduser glimmer && usermod -aG sudo glimmer
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

curl -fsSL https://get.docker.com | sh
usermod -aG docker glimmer

apt-get update && apt-get install -y nginx certbot python3-certbot-nginx git postgresql-client
```

Reconnecte-toi en `glimmer` : `ssh glimmer@TON_IP`

---

## 3. Pointer le DNS

Chez ton registrar, deux enregistrements A :

| Type | Nom | Valeur |
|------|-----|--------|
| A    | @   | TON_IP |
| A    | www | TON_IP |

Vérifie : `dig glimmerlog.com +short` doit renvoyer ton IP.

---

## 4. Récupérer le code et configurer

```bash
git clone <url-de-ton-repo> glimmerlog
cd glimmerlog

cp .env.production.example .env
nano .env   # remplis les secrets
```

Génère des secrets solides :
```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
```

> ⚠️ `VITE_API_URL=/api/v1` est inliné **au build** du client. Si tu le changes,
> il faut rebuild le conteneur client (`docker compose up -d --build client`).

---

## 5. Lancer la stack

```bash
docker compose up -d --build
```

Au premier démarrage, le conteneur `server` applique les migrations Prisma
(`prisma migrate deploy`) sur la base vide.

Vérifie :
```bash
docker compose ps
curl http://127.0.0.1:3001/health   # -> {"status":"ok"}
curl -I http://127.0.0.1:8080        # -> 200 (le SPA)
```

---

## 6. Importer les données Neon

```bash
# Depuis ton PC : copie le dump sur le VPS
scp glimmerlog_backup.dump glimmer@TON_IP:~/

# Sur le VPS : copie dans le conteneur db et restaure
docker compose cp ~/glimmerlog_backup.dump db:/tmp/backup.dump
docker compose exec db pg_restore --clean --if-exists --no-owner \
  -U glimmer -d glimmerlog /tmp/backup.dump

# Vérifie
docker compose exec db psql -U glimmer -d glimmerlog -c '\dt'
```

> Les tables ont été créées par les migrations à l'étape 5 ; `--clean --if-exists`
> les remplace par les données Neon. `--no-owner` évite les erreurs de propriétaire.

---

## 7. Configurer nginx (hôte) + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/glimmerlog
sudo ln -s /etc/nginx/sites-available/glimmerlog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d glimmerlog.com -d www.glimmerlog.com
```

Certbot injecte le bloc HTTPS (443) et installe le renouvellement auto.
Teste : `sudo certbot renew --dry-run`.

---

## 8. Mettre à jour les OAuth

- **Google Cloud Console** → identifiants OAuth → *Origines JavaScript autorisées* :
  ajoute `https://glimmerlog.com`.
- **Discord Developer Portal** → OAuth2 → Redirects : ajoute
  `https://glimmerlog.com/auth/discord/callback` (= `DISCORD_REDIRECT_URI`).
  > C'est une route **client** (le code OAuth est échangé par le frontend),
  > cohérente avec le défaut du serveur `${CLIENT_URL}/auth/discord/callback`.

---

## 9. Vérifier en prod

`https://glimmerlog.com` : connexion email, login Google, login Discord,
création de tournoi, upload photo, mode hors-ligne (PWA).

---

## Opérations courantes

**Redéployer après un `git pull` :**
```bash
git pull && docker compose up -d --build
```

**Logs :**
```bash
docker compose logs -f server
docker compose logs -f client
```

**Sauvegarde régulière (cron quotidien, 3h) :**
```bash
mkdir -p ~/backups
crontab -e
# Ajouter :
0 3 * * * cd /home/glimmer/glimmerlog && docker compose exec -T db pg_dump -U glimmer -Fc glimmerlog > ~/backups/glimmerlog_$(date +\%F).dump
```

**Redémarrer un service :**
```bash
docker compose restart server
```

---

## Notes & sécurité

- `server` (3001) et `client` (8080) écoutent sur `127.0.0.1` uniquement :
  **non exposés à Internet**, seul nginx hôte l'est (ufw ferme le reste).
- Postgres n'est accessible que depuis le réseau Docker interne (jamais publié).
- `.env` n'est **pas** commité (voir `.dockerignore` / `.gitignore`).
- Migrations Prisma appliquées au démarrage du conteneur server : un `git pull`
  + rebuild applique automatiquement toute nouvelle migration.
- Pense à un backup hors-site (rsync/objet S3) en plus du cron local.
