# GlimmerLog — Codebase Guide

## Overview
GlimmerLog (formerly InkTracker) is a Disney Lorcana TCG tournament tracking app.
Full-stack TypeScript monorepo: React + Vite frontend, Express + Prisma backend, PostgreSQL (local).

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5, react-helmet-async (SEO)
- **Backend**: Express 4, TypeScript, Prisma 5, PostgreSQL
- **Shared**: TypeScript types + constants package (`packages/shared`)
- **Auth**: JWT + Google OAuth + Discord OAuth
- **Hosting**: Self-hosted on local Windows PC — Caddy (static client + reverse proxy), Node API as NSSM Windows service (GlimmerLogAPI), local PostgreSQL 17, Cloudflare Tunnel (HTTPS). See DEPLOY-WINDOWS-SELFHOST.md and docs/deploy-runbook.md. Deploy: `deploy\deploy.ps1` (admin PowerShell). NOT on Vercel/Railway/Neon anymore.
- **PWA**: vite-plugin-pwa, Workbox (NetworkFirst for API, CacheFirst for fonts), React Query persistence to localStorage

## Monorepo Structure
```
├── client/                  # React frontend (Vite)
├── server/                  # Express backend
├── packages/shared/         # Shared types & constants
├── package.json             # Root workspace config
└── CLAUDE.md                # This file
```

## Key Commands
```bash
# Dev
npm run dev --workspace=client     # Frontend dev server (port 5173)
npm run dev --workspace=server     # Backend dev server (port 3001, tsx watch)

# Build
npm run build:server               # Prisma generate + db push + build shared + build server
npm run build --workspace=client   # tsc + vite build

# Database
cd server && npx prisma generate   # Regenerate Prisma client (stop dev server first on Windows)
cd server && npx prisma db push    # Push schema changes to DB
cd server && npx prisma studio     # DB GUI
```

## Architecture

### Server (`server/src/`)
```
index.ts                           # Express app setup (Helmet, CORS, JSON 5MB limit)
controllers/
  auth.controller.ts               # Register, login, Google/Discord OAuth, password reset, profile
  tournament.controller.ts         # Tournament CRUD, sharing, team presence
  match.controller.ts              # Round CRUD (whitelisted fields: roundNumber, isTopCut, opponentName, opponentDeckColors, result, notes, photoUrl)
  deck.controller.ts               # Color extraction from external deck builder sites
  deck.crud.controller.ts          # Deck CRUD + set default
  stats.controller.ts              # Stats: overview, matchups, deck performance (date filtered)
  team.controller.ts               # Team CRUD, invites, roles, join by code
  scouting.controller.ts           # Scout reports with cascade deduction logic
  admin.controller.ts              # Admin: list users, usage stats
  suggestion.controller.ts         # User suggestions CRUD
  ravensburger.controller.ts       # Ravensburger Play Hub API proxy (events, rounds, standings)
  matchup-note.controller.ts       # MatchupNote CRUD (list, upsert by color combo, update by id, delete)
  metagame.controller.ts           # Community metagame overview (all-users aggregation, anonymized)
routes/
  index.ts                         # Main router: all routes under /api/v1
middleware/
  auth.ts                          # JWT Bearer token verification → req.userId
  admin.ts                         # Admin role check
  validate.ts                      # Zod schema validation
  errorHandler.ts                  # Global error handler + asyncHandler wrapper
validators/                        # Zod schemas for each resource
lib/
  prisma.ts                        # PrismaClient singleton
  jwt.ts                           # JWT sign/verify (min 32 char secret)
  email.ts                         # Password reset emails via Resend
```

### Client (`client/src/`)
```
App.tsx                            # React Router + QueryClient + persistence + OfflineBanner + InstallBanner
api/
  client.ts                        # Axios instance (fetch adapter, Bearer token, 401 redirect, offline-safe)
  auth.api.ts                      # Auth API calls
  tournaments.api.ts               # Tournament API calls
  matches.api.ts                   # Round API calls
  deck.api.ts                      # Deck API calls
  stats.api.ts                     # Stats API calls (with date filters)
  team.api.ts                      # Team API calls
  scouting.api.ts                  # Scout report API calls
  ravensburger.api.ts              # Ravensburger event data API calls
  matchupNotes.api.ts              # Matchup notes CRUD API calls
  metagame.api.ts                  # Metagame overview API call
pages/
  DashboardPage.tsx                # Home: stats overview + recent tournaments
  TournamentsPage.tsx              # Tournament list (useQuery, offline-capable)
  TournamentDetailPage.tsx         # Tournament detail: rounds, bracket (Ravensburger), stats, sharing
  NewTournamentPage.tsx            # Create/edit tournament (auto-fill from Play Hub link)
  NewMatchPage.tsx                 # Create/edit round (games, lore counter, photo capture)
  DecksPage.tsx                    # Deck list (useQuery, offline-capable)
  DeckStatsPage.tsx                # Per-deck stats (useQuery, offline-capable)
  StatsPage.tsx                    # Global stats with date filtering
  TeamsPage.tsx                    # Team list (useQuery, offline-capable)
  TeamDetailPage.tsx               # Team detail: members, invites, QR code
  ProfilePage.tsx                  # User profile management
  AdminPage.tsx                    # Admin panel
  LoginPage.tsx / RegisterPage.tsx # Auth pages
  SharedTournamentPage.tsx         # Public tournament share (/t/:shareId)
  JoinTeamPage.tsx                 # Public team join (/join/:inviteCode)
  HelpPage.tsx                     # Help documentation
  LoreCounterPage.tsx              # Lore counter tool
  TopCutCalculatorPage.tsx         # Top cut calculator tool
  MetagamePage.tsx                 # Community metagame snapshot (aggregated, anonymized)
components/
  layout/Header.tsx                # Navigation + auth status (GlimmerLog branding)
  layout/ProtectedRoute.tsx        # Auth-required route wrapper
  ui/InkBadge.tsx                  # Ink color badges with tooltips
  ui/InkColorPicker.tsx            # Multi-select ink color picker
  ui/DateFilterBar.tsx             # Date range filter with presets
  ui/PhotoCapture.tsx              # Camera/gallery photo with compression (native file input + capture="environment")
  ui/Logo.tsx                      # GlimmerLog logo (PNG)
  ui/InstallBanner.tsx             # PWA install prompt
  ui/OfflineBanner.tsx             # Offline status indicator
  ui/HelpButton.tsx                # Contextual help popover
  GoogleSignInButton.tsx           # Google OAuth (renderButton, not prompt)
  DiscordSignInButton.tsx          # Discord OAuth
  LoreCounter.tsx                  # Lore damage counter overlay
  RoundTimer.tsx                   # Countdown timer for tournament rounds (50 min default, configurable presets)
  Seo.tsx                          # Centralized SEO tags via react-helmet-async (title, og, twitter, JSON-LD)
context/AuthContext.tsx             # Auth state: user, token, login/logout/register
hooks/
  useInstallPrompt.ts              # PWA beforeinstallprompt handler
  useOnlineStatus.ts               # navigator.onLine + event listeners
lib/
  colors.ts                        # Ink color mappings
  qrcode.ts                        # QR code URL generation
  exportTournamentImage.ts         # Canvas-based tournament stats image export
  safeRedirect.ts                  # Open redirect protection
```

### Shared (`packages/shared/src/`)
```
constants/lorcana.ts               # INK_COLORS, DECK_COMBINATIONS, getRecommendedSwissRounds(), getRecommendedTopCut()
types/
  user.ts                          # User interface
  tournament.ts                    # Tournament, CreateTournamentRequest, UpdateTournamentRequest
  match.ts                         # Round, Game, CreateRoundRequest, UpdateRoundRequest
  deck.ts                          # Deck, CreateDeckRequest
  team.ts                          # Team, TeamMember, TeamInvite
  stats.ts                         # StatsOverview, MatchupStats, DeckPerformance
  scouting.ts                      # ScoutReport, PotentialDeck
```

## API Routes (`/api/v1`)
```
/auth           POST register, login, google, discord, forgot-password, reset-password
                GET /me, PUT /profile, PUT /password
/tournaments    GET list, GET /:id, POST create, PUT /:id, DELETE /:id
                POST /:id/share, GET /shared/:shareId (public), GET /team-presence
  /:tournamentId/rounds  GET list, POST create, PUT /:id, DELETE /:id
/decks          GET list, GET /:id, POST create, PUT /:id, DELETE /:id
                POST /default, POST /extract-colors
/stats          GET /overview, GET /matchups, GET /deck-performance (all support ?from=&to= date filters)
/teams          GET list, GET /:id, POST create, PUT /:id, DELETE /:id
                POST /invite, POST /:id/invite/:inviteId/accept|reject
                PUT /:id/member/:memberId/role, DELETE /:id/member/:memberId
                GET /by-invite/:code (public), POST /join/:code
/scouting       GET /event/:eventId, POST create, POST /bulk
/ravensburger   GET /events/:eventId, GET /events/:eventId/rounds
/admin          GET /users, GET /stats
/suggestions    GET list, POST create, DELETE /:id
/matchup-notes  GET list (auth), POST create/upsert (auth), PUT /:id (auth), DELETE /:id (auth)
                All routes require authentication. POST upserts by (userId, colorKey) — idempotent.
/metagame       GET /overview?from=&to= (auth) — anonymized community aggregate; no user data exposed
```

## Database Models (Prisma)
```
User             → tournaments, decks, teamMembers, scoutReports, suggestions, matchupNotes
Tournament       → rounds[], deck?, user (fields: archetypeName String? for deck archetype label)
Round            → games[], tournament (fields: photoUrl for camera photos)
Game             → round
Deck             → user, tournaments[] (fields: archetypeName String?)
Team             → members[], invites[], scoutReports[], potentialDecks[]
TeamMember       → team, user (roles: OWNER, ADMIN, MEMBER)
TeamInvite       → team, user (status: PENDING, ACCEPTED, DECLINED)
ScoutReport      → team?, reportedBy (unique per reporter+event+player; fields: archetypeName String?)
PotentialDeck    → team?, reportedBy
EventCache       → cached Ravensburger API responses
Suggestion       → user?
MatchupNote      → user (fields: opponentColors InkColor[], colorKey String, content String)
                   Unique constraint: (userId, colorKey) — colorKey is sorted comma-joined colors
                   e.g. "AMBER,STEEL". Upsert is the canonical write path (POST /matchup-notes).
```

## Enums
InkColor: AMBER, AMETHYST, EMERALD, RUBY, SAPPHIRE, STEEL
Format: BO1, BO3, BO5
TopCut: NONE, TOP4, TOP8, TOP16, TOP32
MatchResult: WIN, LOSS, DRAW
TeamRole: OWNER, ADMIN, MEMBER

## Important Patterns

### Authentication
- JWT stored in localStorage, sent as Bearer token
- Google Sign-In uses `renderButton` (not `prompt()`) to avoid FedCM errors
- Helmet COOP must be `false` or `same-origin-allow-popups` for Google popup
- 401 responses redirect to /login only when online (offline-safe)

### Offline / PWA
- React Query cache persisted to localStorage (24h gcTime)
- Axios uses `fetch` adapter so service worker can intercept API calls
- Workbox: NetworkFirst with 3s timeout for all /api/v1/* routes
- Pages migrated to `useQuery` for automatic cache persistence
- `navigator.onLine` check before 401 redirect

### Ravensburger Integration
- Events fetched from `https://api.ravensburgerplay.com/api/v2/events/{id}/`
- `tournament_phases` can have multiple SWISS and RANKED_SINGLE_ELIMINATION phases — sum all
- Swiss rounds = total rounds across all SWISS phases
- Top cut = 2^(total elimination rounds)
- Results cached in EventCache table

### Security
- Mass assignment protection: Zod `.parse()` strips unknown keys + whitelisted fields in controllers
- Ownership checks (IDOR) on every user resource incl. `deckId` on tournament create/update
- Public share (`/tournaments/shared/:shareId`) uses an explicit `select` excluding private `notes`/`photoUrl`
- Open redirect protection via `safeRedirect()` helper
- Rate limiting via `middleware/rateLimit.ts` (real client IP via `CF-Connecting-IP`): auth 15/15min, `/decks/colors` 20/min, `/metagame/overview` 30/min
- `app.set('trust proxy', 1)` — required so rate-limit keys by real IP behind Cloudflare→Caddy (else 127.0.0.1 for everyone)
- Admin emails from env var `ADMIN_EMAILS`
- JWT secret minimum 32 chars
- Helmet: COOP `same-origin-allow-popups` (Google popup). CSP + X-Frame-Options/nosniff/Referrer-Policy are set by **Caddy** (`deploy/Caddyfile.localtest`), since Caddy serves the HTML (not the API). NOT Vercel anymore.
- `photoUrl` validated as `data:image/(jpeg|png|webp);base64,` and bounded (~4MB); `notes`/`opponentName` length-bounded
- Permissions-Policy: camera=(self) for mobile photo capture
- SSRF: `/decks/colors` extraction uses a strict hostname allowlist (exact match)

### Notifications (Web Push) — live tournaments
- Env (dans NSSM `GlimmerLogAPI`) : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto). Sans elles, le push est désactivé et le cron ne démarre pas. La clé publique est aussi embarquée en dur dans `client/src/lib/notify.ts` (publique par nature).
- `lib/push.ts` (web-push), routes `/push/{public-key,subscribe,unsubscribe}`, modèle `PushSubscription`, `User.notifyTournaments` (toggle, via `PUT /profile`).
- Cron `lib/tournamentWatcher.ts` (setInterval 30 s dans `index.ts`) : surveille les tournois du jour (fenêtre ±18 h) liés au Play Hub et pousse au propriétaire à chaque nouvelle ronde / résultats (idempotent via `Tournament.notifyLastPublished/Completed`). Réutilise `getEventRoundsData()` (cache TTL 20 s).
- SW : handler push ajouté via Workbox `importScripts: ['/push-handler.js']` (ne pas supprimer `client/public/push-handler.js` — un 404 casserait l'install du SW).
- Côté client : auto-poll 30 s + auto-création des rondes (jamais d'écrasement des scores saisis) + notif/toast in-app, dans `RoundSyncBanner` (TournamentDetailPage). Toggle dans le Profil (`NotificationsSection`).

### Photo Capture (Rounds)
- Photos stored as base64 in `photoUrl` field (PostgreSQL text)
- Client compresses to 1200px max, JPEG quality 70% before sending
- Uses `<input type="file" capture="environment">` for native mobile camera (not getUserMedia)
- Express body limit: 5MB

## Environment Variables

### Server — production (self-hosted Windows)
Production env vars live in the NSSM service config (`AppEnvironmentExtra`), NOT in `server/.env`.
To read them: `nssm get GlimmerLogAPI AppEnvironmentExtra` (admin PowerShell).

```
DATABASE_URL          # postgresql://glimmer:***@localhost:5432/glimmerlog  (prod DB — glimmerlog, user glimmer)
JWT_SECRET            # Min 32 chars (stored in NSSM)
CLIENT_URL            # https://glimmerlog.com
GOOGLE_CLIENT_ID      # Google OAuth
DISCORD_CLIENT_ID     # Discord OAuth
DISCORD_CLIENT_SECRET # Discord OAuth (stored in NSSM — never commit)
DISCORD_REDIRECT_URI  # Discord callback URL
RESEND_API_KEY        # Email sending (stored in NSSM — never commit)
ADMIN_EMAILS          # Comma-separated admin email list
PORT                  # 3001
NODE_ENV              # production
```

> WARNING: `server/.env` is STALE (dates from March 2026, points to the old dev DB
> `lorcana_tracker` with user `postgres`). Never use it for Prisma CLI ops in prod —
> always set `DATABASE_URL` from NSSM first (deploy.ps1 does this automatically).

### Client — production build
Set as env vars before running `npm run build --workspace=client`:
```
VITE_API_URL           # /api/v1  (same-origin via Caddy — no full URL needed)
VITE_GOOGLE_CLIENT_ID  # 579520504030-1hltphn01kd65ft4keugfp102sgjns16.apps.googleusercontent.com
VITE_DISCORD_CLIENT_ID # 1483223327827824833
```
These values are hardcoded in `deploy/deploy.ps1` and `deploy/deploy-run-20260613.ps1`.

## Deployment

Production is **self-hosted on a local Windows PC** (not Vercel/Railway/Neon).
See `docs/deploy-runbook.md` for the full step-by-step runbook.

Architecture summary:
- **GlimmerLogAPI** — NSSM Windows service running `node server\dist\index.js`, AppDirectory = repo `\server`
- **GlimmerLogCaddy** — NSSM Windows service running `caddy run --config deploy\Caddyfile.localtest`
  (Caddy listens on HTTP :8080; a Cloudflare Tunnel handles public HTTPS for glimmerlog.com)
- **PostgreSQL 17** — local Windows service, database `glimmerlog`, user `glimmer`
- Deploy script: `deploy\deploy.ps1` (run in admin PowerShell)

> Note: `deploy/Caddyfile` is an OBSOLETE TEMPLATE with a hardcoded path `C:/glimmerlog/...`
> that does not exist on this machine. The actual production config is `deploy/Caddyfile.localtest`.

## Operational Gotchas

See `docs/deploy-runbook.md` for full details. Key traps:

1. **Stale `server/.env`**: The file points to the old dev DB (`lorcana_tracker`, user `postgres`).
   Prisma CLI reads `server/.env` unless `DATABASE_URL` is defined in the shell environment.
   `deploy.ps1` injects `DATABASE_URL` from NSSM before any Prisma step — do not skip this.

2. **EPERM on `prisma generate` (Windows DLL lock)**: If `GlimmerLogAPI` is running when
   `prisma generate` executes, it holds a file lock on `query_engine-windows.dll.node` in
   `node_modules`. The build fails with an EPERM rename error. Always stop the service before
   building, restart it in a `finally` block. `deploy.ps1` implements this pattern.

3. **`prisma db push --accept-data-loss` in `build:server`**: The root `package.json`
   `build:server` script runs `prisma db push --accept-data-loss` on every build. This is
   dangerous — any destructive schema change would be applied silently in production without
   confirmation. Additionally, migration history is incoherent (single init migration from
   March 2026, DB evolved via db push since). `migrate deploy` is effectively a no-op.
   Long-term: create a baseline migration and stop using db push in production.

## Coding Conventions
- Language: French for UI strings, English for code/comments
- Styling: Tailwind CSS with custom `ink-*` theme (dark theme: `ink-900` background, `gold-400` accents)
- Components: functional with hooks, no class components
- State: TanStack Query for server state, useState for local state, Context for auth
- Validation: Zod on server, form-level on client
- File naming: kebab-case for routes/validators, PascalCase for components/pages
