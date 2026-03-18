# Guide de deploiement InkTracker

## Architecture

| Service | Plateforme | URL |
|---------|-----------|-----|
| Frontend (client) | Vercel | https://inktracker-client.vercel.app |
| Backend (server) | Railway | https://lorcana-server-production.up.railway.app |
| Base de donnees | Neon (PostgreSQL) | REDACTED_NEON_HOST |

---

## 1. Deploiement standard (push to prod)

### Etape unique : push sur main

```bash
git push origin main
```

- **Vercel** se redeploy automatiquement sur tout push sur `main`
- **Railway** se redeploy uniquement si des fichiers dans `/server/**` ont change (watch path configure)

### Si seul le client a change

Vercel se redeploy tout seul, rien a faire.

### Si le serveur a change

Railway detecte les changements dans `/server/**`. Si tu modifies aussi des fichiers hors de `server/` (ex: `package.json`, `packages/shared/`), Railway ne les detectera pas. Dans ce cas, touche un fichier dans `server/` pour forcer le redeploy :

```bash
# Modifier un commentaire dans un fichier server, puis :
git add server/...
git commit -m "chore: trigger Railway redeploy"
git push origin main
```

---

## 2. Migration de base de donnees (Prisma)

### En local

```bash
cd server
npx prisma db push
```

### En production (Neon)

La migration est executee automatiquement lors du build Railway (via `npm run build:server`).

Si tu dois la lancer manuellement :

```bash
cd server
DATABASE_URL="REDACTED_DATABASE_URL" npx prisma db push --accept-data-loss
```

> **Note** : cette commande fonctionne dans Git Bash. En PowerShell, utilise :
> ```powershell
> $env:DATABASE_URL="REDACTED_DATABASE_URL"; npx prisma db push --accept-data-loss
> ```

---

## 3. Variables d'environnement

### Railway (serveur)

| Variable | Valeur prod |
|----------|-------------|
| `DATABASE_URL` | `REDACTED_DATABASE_URL` |
| `JWT_SECRET` | (garder la valeur existante) |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | (Railway le fournit automatiquement) |
| `CLIENT_URL` | `https://inktracker-client.vercel.app` |
| `GOOGLE_CLIENT_ID` | `579520504030-1hltphn01kd65ft4keugfp102sgjns16.apps.googleusercontent.com` |
| `DISCORD_CLIENT_ID` | `1483223327827824833` |
| `DISCORD_CLIENT_SECRET` | `REDACTED_DISCORD_SECRET` |
| `DISCORD_REDIRECT_URI` | `https://inktracker-client.vercel.app/auth/discord/callback` |

### Vercel (client)

| Variable | Valeur prod |
|----------|-------------|
| `VITE_API_URL` | `https://lorcana-server-production.up.railway.app/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | `579520504030-1hltphn01kd65ft4keugfp102sgjns16.apps.googleusercontent.com` |
| `VITE_DISCORD_CLIENT_ID` | `1483223327827824833` |

---

## 4. Configuration Railway

| Parametre | Valeur |
|-----------|--------|
| Repo | `kteisseire/inktracker` |
| Branche | `main` |
| Watch Paths | `/server/**` |
| Build Command | `npx prisma generate && npx prisma db push && npm run build:server` |
| Start Command | `npm run start --workspace=server` |

> **Important** : le `package.json` racine contient `"prisma": { "schema": "server/prisma/schema.prisma" }` pour que `npx prisma generate` fonctionne depuis la racine du monorepo.

---

## 5. Configuration externe

### Discord Developer Portal

URL : https://discord.com/developers/applications

Redirects OAuth2 a configurer :
- Local : `http://localhost:5173/auth/discord/callback`
- Prod : `https://inktracker-client.vercel.app/auth/discord/callback`

### Google Cloud Console

Origines JavaScript autorisees :
- Local : `http://localhost:5173`
- Prod : `https://inktracker-client.vercel.app`

---

## 6. Commandes utiles

```bash
# Dev local
npm run dev

# Build complet local
npm run build

# Build serveur seul (comme Railway)
npm run build:server

# Verifier les erreurs TypeScript
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# Voir les logs Railway
# -> Dashboard Railway > ton service > Logs

# Voir les logs Vercel
# -> Dashboard Vercel > ton projet > Deployments > clic sur un deploy
```

---

## 7. Checklist deploiement

- [ ] Code pousse sur `main`
- [ ] Si changement schema Prisma : la migration sera auto via le build Railway
- [ ] Si nouvelle variable d'env : l'ajouter sur Railway et/ou Vercel
- [ ] Si changement OAuth : mettre a jour les redirects sur Discord/Google
- [ ] Verifier le deploy Vercel (https://vercel.com/dashboard)
- [ ] Verifier le deploy Railway (https://railway.app/dashboard)
- [ ] Tester l'app en prod (https://inktracker-client.vercel.app)
