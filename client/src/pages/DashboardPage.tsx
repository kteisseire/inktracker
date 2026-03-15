import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/stats.api.js';
import { listTournaments } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
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
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Tableau de bord</h1>
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

      {/* Recent tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="ink-section-title">Tournois récents</h2>
          <Link to="/tournaments" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">Voir tout</Link>
        </div>

        {recentTournaments.length === 0 ? (
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
