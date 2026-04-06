# GlimmerLog — Codebase Guide

## Overview
GlimmerLog (formerly InkTracker) is a Disney Lorcana TCG tournament tracking app.
Full-stack TypeScript monorepo: React + Vite frontend, Express + Prisma backend, PostgreSQL (Neon).

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5
- **Backend**: Express 4, TypeScript, Prisma 5, PostgreSQL
- **Shared**: TypeScript types + constants package (`packages/shared`)
- **Auth**: JWT + Google OAuth + Discord OAuth
- **Hosting**: Vercel (client), Railway (server), Neon (database)
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
```

## Database Models (Prisma)
```
User             → tournaments, decks, teamMembers, scoutReports, suggestions
Tournament       → rounds[], deck?, user
Round            → games[], tournament (fields: photoUrl for camera photos)
Game             → round
Deck             → user, tournaments[]
Team             → members[], invites[], scoutReports[], potentialDecks[]
TeamMember       → team, user (roles: OWNER, ADMIN, MEMBER)
TeamInvite       → team, user (status: PENDING, ACCEPTED, DECLINED)
ScoutReport      → team?, reportedBy (unique per reporter+event+player)
PotentialDeck    → team?, reportedBy
EventCache       → cached Ravensburger API responses
Suggestion       → user?
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
- Mass assignment protection: whitelisted fields in controllers
- Open redirect protection via `safeRedirect()` helper
- Rate limiting on auth endpoints (15 req/15min)
- Admin emails from env var `ADMIN_EMAILS`
- JWT secret minimum 32 chars
- Helmet + CORS + CSP (Vercel headers)
- Permissions-Policy: camera=(self) for mobile photo capture

### Photo Capture (Rounds)
- Photos stored as base64 in `photoUrl` field (PostgreSQL text)
- Client compresses to 1200px max, JPEG quality 70% before sending
- Uses `<input type="file" capture="environment">` for native mobile camera (not getUserMedia)
- Express body limit: 5MB

## Environment Variables

### Server (Railway)
```
DATABASE_URL          # Neon PostgreSQL connection string
JWT_SECRET            # Min 32 chars
CLIENT_URL            # https://glimmerlog.com
GOOGLE_CLIENT_ID      # Google OAuth
DISCORD_CLIENT_ID     # Discord OAuth
DISCORD_CLIENT_SECRET # Discord OAuth
DISCORD_REDIRECT_URI  # Discord callback URL
RESEND_API_KEY        # Email sending
ADMIN_EMAILS          # Comma-separated admin email list
```

### Client (Vercel)
```
VITE_API_URL          # https://lorcana-server-production.up.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID # Google OAuth client ID
VITE_DISCORD_CLIENT_ID # Discord OAuth client ID
```

## Deployment
- **Vercel** (client): auto-deploy on push, `vercel.json` for headers/rewrites
- **Railway** (server): Build Command `npm run build:server`, Start Command `npm run start --workspace=server`, Watch Paths `/server/**`
- `prisma db push` runs during build (in `build:server` script)
- `.well-known/assetlinks.json` for Android TWA (Digital Asset Links)

## Coding Conventions
- Language: French for UI strings, English for code/comments
- Styling: Tailwind CSS with custom `ink-*` theme (dark theme: `ink-900` background, `gold-400` accents)
- Components: functional with hooks, no class components
- State: TanStack Query for server state, useState for local state, Context for auth
- Validation: Zod on server, form-level on client
- File naming: kebab-case for routes/validators, PascalCase for components/pages
