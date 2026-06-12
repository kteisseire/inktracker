# SEO — Pré-rendu (prerendering) pour les pages publiques

## Contexte

GlimmerLog est une SPA React (Vite). Le contenu de chaque page est injecté côté
client après l'exécution du JavaScript. Les balises `<title>`, meta description,
Open Graph/Twitter et JSON-LD sont désormais gérées dynamiquement via
`react-helmet-async` (voir `client/src/components/Seo.tsx`), ce qui fonctionne
bien pour les utilisateurs et pour les crawlers qui exécutent du JS (Googlebot le
fait dans la plupart des cas).

Cependant, certains crawlers/robots (réseaux sociaux pour les previews de liens —
Facebook, Discord, Slack, Twitter/X —, ou certains outils SEO) ne rendent pas le
JavaScript. Pour ces cas, le HTML initial servi par Vercel ne contient que les
balises par défaut de `index.html`, pas les balises spécifiques à la page
(ex. titre du tournoi sur `/t/:shareId`, nom de l'équipe sur `/join/:inviteCode`).

Ce document liste les pages concernées et deux options pour ajouter du
pré-rendu HTML, **à mettre en œuvre plus tard** si le besoin SEO/partage social
devient prioritaire. Aucune des deux options n'a été implémentée dans le cadre
de cette tâche.

## Pages concernées par un pré-rendu prioritaire

Ce sont des pages publiques, sans authentification, où le contenu dynamique
(titre/description par page) a le plus de valeur pour le SEO et les previews
de partage social :

- `/` — page d'accueil (déjà couverte par les balises par défaut + JSON-LD WebApplication)
- `/t/:shareId` — tournoi partagé (titre = nom du tournoi, description = bilan V/D)
- `/join/:inviteCode` — invitation d'équipe (titre = nom de l'équipe)
- `/help`, `/lore-counter`, `/top-cut` — pages d'outils statiques (contenu fixe,
  moins critique mais bénéficient aussi d'un meilleur indexage)

## Option 1 — `vercel.json` + service de pré-rendu tiers (ex. Prerender.io)

### Principe
Configurer une règle dans `vercel.json` qui détecte les *user-agents* de bots
(Googlebot, facebookexternalhit, Twitterbot, Discordbot, etc.) et, pour ces
requêtes uniquement, fait un rewrite/proxy vers un service de pré-rendu tiers
(Prerender.io ou équivalent). Le service exécute la SPA dans un navigateur
headless, attend que le JS (et donc `react-helmet-async`) ait mis à jour le
`<head>`, puis renvoie le HTML final au bot.

### Avantages
- Aucune modification de l'architecture de build existante (Vite + Vercel static).
- Mise en place rapide — essentiellement de la configuration, pas de code.
- Le service tiers gère le rendu headless, le cache, les retries.

### Inconvénients
- Dépendance à un service externe (coût au-delà d'un plan gratuit limité,
  disponibilité, latence pour les bots).
- Nécessite de maintenir à jour la liste des user-agents de bots à intercepter.
- Moins de contrôle sur le HTML généré (dépend du rendu headless du service).

### Étapes de mise en œuvre (pour référence future)
1. Créer un compte Prerender.io (ou équivalent self-hosted via leur image Docker).
2. Ajouter le token Prerender dans les variables d'environnement Vercel.
3. Dans `vercel.json`, ajouter une règle de `rewrites` conditionnée sur
   `has: [{ type: "header", key: "user-agent", value: "(?i)(googlebot|bingbot|facebookexternalhit|twitterbot|discordbot|slackbot|linkedinbot)" }]`
   qui pointe vers un middleware/edge function proxifiant vers Prerender.io
   avec l'URL d'origine.
4. Tester avec des outils de simulation (Facebook Sharing Debugger, Twitter Card
   Validator, Discord embed preview) sur `/t/:shareId` et `/join/:inviteCode`.

## Option 2 — Petit serveur Express de SSR léger pour les routes publiques

### Principe
Ajouter, côté `server/` (ou un petit service Express séparé déployé sur
Railway/Vercel Edge), une route qui :
1. Reçoit la requête pour une URL publique (`/t/:shareId`, `/join/:inviteCode`, etc.).
2. Récupère les données nécessaires (tournoi partagé, équipe) directement via
   Prisma/la base de données — ces endpoints existent déjà
   (`GET /shared/:shareId`, `GET /by-invite/:code`).
3. Injecte les balises `<title>`, `<meta name="description">`, Open Graph et
   Twitter Card directement dans le `index.html` statique (remplacement de
   chaînes ou template), avant de le renvoyer.
4. Le contenu interactif complet continue d'être chargé normalement par le
   bundle React au montage côté client (le SSR ne sert que les balises `<head>`
   et un éventuel contenu de fallback minimal pour les bots).

### Avantages
- Pas de dépendance à un service tiers — tout reste dans l'infrastructure
  existante (Railway pour le serveur, qui a déjà accès à Prisma).
- Contrôle total sur les balises générées, réutilisation des mêmes données que
  l'API (`shared/:shareId`, `by-invite/:code`).
- Coût marginal nul (pas d'abonnement supplémentaire).

### Inconvénients
- Développement et maintenance d'un mini-moteur de template HTML côté serveur.
- Nécessite de servir le HTML pré-rendu pour ces routes spécifiques depuis le
  serveur Express plutôt que depuis le hosting statique Vercel — implique soit
  un rewrite Vercel vers le serveur Railway pour ces chemins, soit de déplacer
  le service de ces pages publiques vers le serveur.
- Risque de désynchronisation entre les balises générées côté serveur et celles
  générées par `react-helmet-async` côté client si les deux évoluent séparément.

### Étapes de mise en œuvre (pour référence future)
1. Ajouter une route Express (ex. `GET /t/:shareId` et `GET /join/:inviteCode`)
   qui lit `client/dist/index.html`, récupère les données via Prisma, et
   remplace les balises `<title>`/`<meta>` par défaut par les valeurs
   spécifiques à la page (même logique que `Seo.tsx` côté client).
2. Configurer un rewrite Vercel pour ces deux chemins vers le serveur Railway
   (ou servir ces pages directement depuis Railway).
3. S'assurer que le bundle client (chargé ensuite par le navigateur) hydrate
   normalement et que `react-helmet-async` ne produit pas de balises dupliquées
   au montage (vérifier que les valeurs SSR et client correspondent).
4. Tester avec les mêmes outils de validation que pour l'option 1.

## Recommandation

Aucune des deux options n'est urgente : `react-helmet-async` couvre déjà les
crawlers qui exécutent du JavaScript (dont Googlebot). À évaluer en priorité si :
- le partage de tournois (`/t/:shareId`) sur les réseaux sociaux/Discord devient
  un canal d'acquisition important et que les previews de liens doivent afficher
  le bon titre/description (Option 1, rapide à mettre en place) ;
- ou si le volume de trafic SEO organique justifie un contrôle plus fin et sans
  coût récurrent (Option 2, plus de travail mais pas de dépendance externe).
