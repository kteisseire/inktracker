import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { TournamentsPage } from './pages/TournamentsPage.js';
import { NewTournamentPage } from './pages/NewTournamentPage.js';
import { TournamentDetailPage } from './pages/TournamentDetailPage.js';
import { NewMatchPage } from './pages/NewMatchPage.js';
import { StatsPage } from './pages/StatsPage.js';
import { DecksPage } from './pages/DecksPage.js';
import { DeckStatsPage } from './pages/DeckStatsPage.js';
import { LoreCounterPage } from './pages/LoreCounterPage.js';
import { TopCutCalculatorPage } from './pages/TopCutCalculatorPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { TeamsPage } from './pages/TeamsPage.js';
import { TeamDetailPage } from './pages/TeamDetailPage.js';
import { DiscordCallbackPage } from './pages/DiscordCallbackPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Home: landing or dashboard */}
      <Route path="/" element={user ? <Layout><DashboardPage /></Layout> : <Layout><LandingPage /></Layout>} />

      {/* Auth pages (with header) */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Layout><LoginPage /></Layout>} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Layout><RegisterPage /></Layout>} />
      <Route path="/auth/discord/callback" element={<Layout><DiscordCallbackPage /></Layout>} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <Layout><ForgotPasswordPage /></Layout>} />
      <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />

      {/* Protected pages */}
      <Route path="/tournaments" element={<ProtectedRoute><Layout><TournamentsPage /></Layout></ProtectedRoute>} />
      <Route path="/tournaments/new" element={<ProtectedRoute><Layout><NewTournamentPage /></Layout></ProtectedRoute>} />
      <Route path="/tournaments/:id" element={<ProtectedRoute><Layout><TournamentDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/tournaments/:id/edit" element={<ProtectedRoute><Layout><NewTournamentPage /></Layout></ProtectedRoute>} />
      <Route path="/tournaments/:tournamentId/rounds/new" element={<ProtectedRoute><Layout><NewMatchPage /></Layout></ProtectedRoute>} />
      <Route path="/tournaments/:tournamentId/rounds/:roundId/edit" element={<ProtectedRoute><Layout><NewMatchPage /></Layout></ProtectedRoute>} />
      <Route path="/decks" element={<ProtectedRoute><Layout><DecksPage /></Layout></ProtectedRoute>} />
      <Route path="/decks/:deckId/stats" element={<ProtectedRoute><Layout><DeckStatsPage /></Layout></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Layout><StatsPage /></Layout></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><Layout><TeamsPage /></Layout></ProtectedRoute>} />
      <Route path="/teams/:id" element={<ProtectedRoute><Layout><TeamDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      {/* Public tools */}
      <Route path="/top-cut" element={<Layout><TopCutCalculatorPage /></Layout>} />
      <Route path="/lore-counter" element={<LoreCounterPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
