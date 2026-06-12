# Déploiement GlimmerLog — API + DB sur un VPS, front sur Vercel

Scénario : on **garde le front sur Vercel** et on bascule **l'API Express + la base
PostgreSQL** sur un VPS auto-hébergé. (Pour tout migrer sur le VPS, voir
`DEPLOY-VPS.md` à la place.)

Architecture cible (deux domaines) :

```
                          Vercel (front, inchangé)
   Navigateur ──HTTPS──>  glimmerlog.com   (SPA React)
        │
        └──HTTPS──> api.glimmerlog.com ──> nginx (VPS) ──> conteneur server (127.0.0.1:3001)
                                                              conteneur db    (Postgres, interne)
```

Front et API sur **deux domaines** → CORS nécessaire. Bonne nouvelle : le serveur
autorise déjà `CLIENT_URL` comme origine (`cors({ origin: CLIENT_URL })`), il n'y a
**rien à changer dans le code**, juste à bien régler `CLIENT_URL`.

Fichiers utilisés (différents de DEPLOY-VPS.md) :
- `docker-compose.api.yml` — orchestration : **server + db uniquement** (pas de client)
- `server/Dockerfile` — build + runtime du serveur (migrations Prisma au démarrage)
- `deploy/nginx.api.conf` — reverse-proxy + TLS pour `api.glimmerlog.com`
- `.env.api.example` — modèle de variables

---

## 0. Prérequis

- VPS Ubuntu 24.04 (1–2 vCPU / 2–4 Go : Hetzner CX22 ~4€/mois, OVH, DigitalOcean)
- Accès au DNS de `glimmerlog.com` (pour créer l'enregistrement `api`)
- Ta **connection string Neon** (pour exporter les données vers le VPS)

---

## 1. Sauvegarder la base Neon (À FAIRE EN PREMIER)

Depuis ton PC (PowerShell, `pg_dump` installé) :

```powershell
pg_dump "postgresql://...neon.tech/...?sslmode=require" -Fc -f glimmerlog_backup.dump
```

Conserve ce `.dump` précieusement — c'est toute ta base.

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

## 3. Pointer le DNS de l'API

Chez ton registrar, un enregistrement A pour le sous-domaine API
(le front `glimmerlog.com` / `www` reste pointé sur Vercel — n'y touche pas) :

| Type | Nom | Valeur |
|------|-----|--------|
| A    | api | TON_IP |

Vérifie : `dig api.glimmerlog.com +short` doit renvoyer l'IP du VPS.

---

## 4. Récupérer le code et configurer

```bash
git clone <url-de-ton-repo> glimmerlog
cd glimmerlog

cp .env.api.example .env
nano .env   # remplis les secrets
```

Génère des secrets solides :
```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
```

`CLIENT_URL=https://glimmerlog.com` est crucial : c'est l'origine autorisée par
le CORS du serveur. S'il ne correspond pas exactement au domaine Vercel, le front
sera bloqué par le navigateur.

---

## 5. Lancer la stack (API + DB)

```bash
docker compose -f docker-compose.api.yml up -d --build
```

Au premier démarrage, le conteneur `server` applique les migrations Prisma
(`prisma migrate deploy`) sur la base vide.

Vérifie :
```bash
docker compose -f docker-compose.api.yml ps
curl http://127.0.0.1:3001/health   # -> {"status":"ok"}
```

---

## 6. Importer les données Neon

```bash
# Depuis ton PC : copie le dump sur le VPS
scp glimmerlog_backup.dump glimmer@TON_IP:~/

# Sur le VPS : copie dans le conteneur db et restaure
docker compose -f docker-compose.api.yml cp ~/glimmerlog_backup.dump db:/tmp/backup.dump
docker compose -f docker-compose.api.yml exec db pg_restore --clean --if-exists --no-owner \
  -U glimmer -d glimmerlog /tmp/backup.dump

# Vérifie
docker compose -f docker-compose.api.yml exec db psql -U glimmer -d glimmerlog -c '\dt'
```

> Les tables sont créées par les migrations à l'étape 5 ; `--clean --if-exists`
> les remplace par les données Neon. `--no-owner` évite les erreurs de propriétaire.

---

## 7. Configurer nginx (hôte) + HTTPS

```bash
sudo cp deploy/nginx.api.conf /etc/nginx/sites-available/glimmerlog-api
sudo ln -s /etc/nginx/sites-available/glimmerlog-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d api.glimmerlog.com
```

Certbot injecte le bloc HTTPS (443) et installe le renouvellement auto.
Teste : `sudo certbot renew --dry-run`.

---

## 8. Pointer le front Vercel vers la nouvelle API

Sur Vercel (Project → Settings → Environment Variables) :

```
VITE_API_URL = https://api.glimmerlog.com/api/v1
```

Puis **redéploie** le front (Vercel inline les `VITE_*` au build) :
- soit un nouveau commit / push,
- soit Vercel → Deployments → Redeploy.

---

## 9. Mettre à jour les OAuth

- **Google Cloud Console** → identifiants OAuth → *Origines JavaScript autorisées* :
  garde `https://glimmerlog.com` (origine du front — inchangée).
- **Discord Developer Portal** → OAuth2 → Redirects :
  `https://glimmerlog.com/auth/discord/callback` (route **front**, inchangée).

> Comme le front reste sur le même domaine qu'avant, les réglages OAuth ne
> changent généralement pas. Seul l'appel API part désormais vers `api.glimmerlog.com`.

---

## 10. Vérifier en prod

`https://glimmerlog.com` : connexion email, login Google, login Discord,
création de tournoi, upload photo, mode hors-ligne (PWA).
Dans l'onglet réseau du navigateur, les appels doivent partir vers
`https://api.glimmerlog.com/api/v1/...` sans erreur CORS.

---

## Opérations courantes

Toutes les commandes prennent `-f docker-compose.api.yml`.

**Redéployer l'API après un `git pull` :**
```bash
git pull && docker compose -f docker-compose.api.yml up -d --build
```

**Logs :**
```bash
docker compose -f docker-compose.api.yml logs -f server
```

**Sauvegarde régulière (cron quotidien, 3h) :**
```bash
mkdir -p ~/backups
crontab -e
# Ajouter :
0 3 * * * cd /home/glimmer/glimmerlog && docker compose -f docker-compose.api.yml exec -T db pg_dump -U glimmer -Fc glimmerlog > ~/backups/glimmerlog_$(date +\%F).dump
```

**Redémarrer le serveur :**
```bash
docker compose -f docker-compose.api.yml restart server
```

---

## Notes & sécurité

- `server` (3001) écoute sur `127.0.0.1` uniquement : non exposé à Internet,
  seul nginx hôte l'est (ufw ferme le reste).
- Postgres n'est accessible que depuis le réseau Docker interne (jamais publié).
- Le CORS est géré par Express (`origin: CLIENT_URL`), pas par nginx —
  n'ajoute pas d'en-têtes `Access-Control-*` dans nginx (ils se dédoubleraient).
- `.env` n'est **pas** commité.
- Migrations Prisma appliquées au démarrage : `git pull` + rebuild applique
  automatiquement toute nouvelle migration.
- Pense à un backup hors-site (rsync / objet S3) en plus du cron local.
- Tu peux ensuite fermer le projet Neon et la base Railway une fois la prod validée.
