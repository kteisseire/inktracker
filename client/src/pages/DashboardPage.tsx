import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/stats.api.js';
import { listTournaments } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { LogoIcon } from '../components/ui/Logo.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import type { OverviewStats, Tournament } from '@lorcana/shared';

export function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview(),
      listTournaments(1, 5),
    ]).then(([s, t]) => {
      setStats(s);
      setRecentTournaments(t.tournaments);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Tableau de bord</h1>
          <HelpButton sections={['Tournois', 'Statistiques']} />
        </div>
        <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2">
          + Nouveau
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Tournois" value={stats.totalTournaments} />
          <StatCard label="Rondes jouées" value={stats.totalRounds} />
          <StatCard label="Win Rate" value={`${stats.overallWinRate}%`} highlight />
          <StatCard label="V / D / N" value={`${stats.wins}/${stats.losses}/${stats.draws}`} />
        </div>
      )}

      {/* Features */}
      {stats && stats.totalTournaments === 0 && (
        <div className="ink-card p-5 sm:p-6 space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-2"><LogoIcon className="w-10 h-10" /></div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink-100 mt-2">Bienvenue sur InkTracker</h2>
            <p className="text-sm text-ink-400 mt-1">
              L'outil complet pour suivre vos performances en tournois Disney Lorcana.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard icon="&#9876;" title="Suivi de tournois" description="Enregistrez vos tournois, rondes et parties avec le score de lore." />
            <FeatureCard icon="&#9824;" title="Gestion de decks" description="Organisez vos decks, liez-les depuis Dreamborn, Lorcanito et plus." />
            <FeatureCard icon="&#9636;" title="Statistiques" description="Win rate global, par deck, matchups, impact du premier joueur, filtrage par set." />
            <FeatureCard icon="&#10022;" title="Compteur de Lore" description="Compteur plein écran pour 2 joueurs avec historique et détection auto du gagnant." />
            <FeatureCard icon="&#9986;" title="Top Cut Calculator" description="Estimez les records nécessaires pour passer le cut en format Suisse." />
            <FeatureCard icon="&#9670;" title="Suivi du Top Cut" description="Barre de progression en direct de vos points vers le seuil de qualification." />
          </div>
          <div className="text-center pt-2">
            <Link to="/tournaments/new" className="ink-btn-primary px-6 py-2.5">
              Créer mon premier tournoi
            </Link>
          </div>
        </div>
      )}

      {/* Recent tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="ink-section-title">Tournois récents</h2>
          <Link to="/tournaments" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">Voir tout</Link>
        </div>

        {recentTournaments.length === 0 && stats && stats.totalTournaments === 0 ? (
          <div className="ink-card p-8 text-center text-ink-400">
            <p>Aucun tournoi enregistré</p>
          </div>
        ) : recentTournaments.length === 0 ? (
          <div className="ink-card p-8 text-center text-ink-400">
            <p>Aucun tournoi enregistré</p>
            <Link to="/tournaments/new" className="text-gold-400 hover:text-gold-300 mt-2 inline-block transition-colors">
              Créer votre premier tournoi
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTournaments.map(t => (
              <Link
                key={t.id}
                to={`/tournaments/${t.id}`}
                className="block ink-card-hover p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink-100 truncate">{t.name}</h3>
                    <p className="text-sm text-ink-400 mt-0.5">
                      {new Date(t.date).toLocaleDateString('fr-FR')}
                      {t.location && ` — ${t.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DeckBadges colors={t.myDeckColors as any} />
                    {t.placement && (
                      <span className="text-sm font-medium text-gold-400">#{t.placement}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-ink-800/30">
      <span className="text-xl text-gold-400 shrink-0 mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs text-ink-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="ink-card p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-ink-400">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${highlight ? 'text-gold-400' : 'text-ink-100'}`}>
        {value}
      </p>
    </div>
  );
}
