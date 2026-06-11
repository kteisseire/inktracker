import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOverview } from '../api/stats.api.js';
import { listTournaments } from '../api/tournaments.api.js';
import { DeckBadges, HollowLozenge } from '../components/ui/InkBadge.js';
import { LogoIcon } from '../components/ui/Logo.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonStatPanel, SkeletonRows } from '../components/ui/Skeleton.js';
import type { OverviewStats, Tournament } from '@lorcana/shared';

export function DashboardPage() {
  const { data: stats = null } = useQuery<OverviewStats | null>({
    queryKey: ['overview-stats'],
    queryFn: () => getOverview(),
  });

  const { data: tournamentsData, isLoading: loading } = useQuery({
    queryKey: ['tournaments', 1, 5],
    queryFn: () => listTournaments(1, 5),
  });

  const recentTournaments = tournamentsData?.tournaments ?? [];
  const isEmpty = stats != null && stats.totalTournaments === 0;

  return (
    <div className="space-y-7 sm:space-y-9">
      {/* Title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl sm:text-3xl text-ink-50 tracking-[0.03em]">Tableau de bord</h1>
          <HelpButton sections={['Tournois', 'Statistiques']} />
        </div>
        <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2 shrink-0">
          + Nouveau
        </Link>
      </div>

      {/* Stats instrument panel */}
      {loading && !stats ? (
        <SkeletonStatPanel />
      ) : stats && !isEmpty ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          {/* Win Rate — the one hero number, in Marcellus */}
          <div className="ink-card-hero p-5 flex flex-col justify-center">
            <span className="rubric-label">Win rate</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-display text-5xl leading-none text-gold-300">{stats.overallWinRate}</span>
              <span className="text-ink-400 text-xl font-display">%</span>
            </div>
          </div>
          {/* Three machined figures in one divided panel */}
          <div className="ink-card sm:col-span-2 grid grid-cols-3 divide-x divide-rule">
            <Figure label="Tournois" value={stats.totalTournaments} />
            <Figure label="Rondes" value={stats.totalRounds} />
            <Figure label="V / D / N" value={`${stats.wins}/${stats.losses}/${stats.draws}`} />
          </div>
        </div>
      ) : null}

      {/* Welcome / empty onboarding (only when no tournaments yet) */}
      {isEmpty && (
        <div className="section-wash space-y-5">
          <div className="text-center">
            <div className="flex justify-center mb-3"><LogoIcon className="w-11 h-11" /></div>
            <h2 className="font-display text-xl sm:text-2xl text-ink-50 tracking-[0.03em]">Bienvenue sur GlimmerLog</h2>
            <p className="text-sm text-ink-400 mt-1.5 max-w-md mx-auto">
              L'outil complet pour suivre vos performances en tournois Disney Lorcana.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Feature icon="trophy" title="Suivi de tournois" description="Enregistrez vos tournois, rondes et parties avec le score de lore." />
            <Feature icon="cards" title="Gestion de decks" description="Organisez vos decks, liez-les depuis Dreamborn, Lorcanito et plus." />
            <Feature icon="chart" title="Statistiques" description="Win rate global, par deck, matchups, impact du premier joueur." />
            <Feature icon="lore" title="Compteur de Lore" description="Compteur plein écran 2 joueurs avec historique et gagnant auto." />
            <Feature icon="cut" title="Top Cut Calculator" description="Estimez les records nécessaires pour passer le cut en Suisse." />
            <Feature icon="diamond" title="Suivi du Top Cut" description="Progression en direct de vos points vers le seuil de qualification." />
          </div>
          <div className="text-center pt-1">
            <Link to="/tournaments/new" className="ink-btn-primary px-6 py-2.5">
              Créer mon premier tournoi
            </Link>
          </div>
        </div>
      )}

      {/* Recent tournaments */}
      {!isEmpty && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="rubric-label">Tournois récents</h2>
            <Link to="/tournaments" className="text-gold-400 text-xs hover:text-gold-300 transition-colors">Voir tout</Link>
          </div>

          {loading ? (
            <SkeletonRows count={3} />
          ) : recentTournaments.length === 0 ? (
            <div className="section-wash flex flex-col items-center text-center py-10 gap-3">
              <HollowLozenge size={26} />
              <p className="text-ink-400 text-sm">Aucun tournoi enregistré pour l'instant.</p>
              <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2">Créer un tournoi</Link>
            </div>
          ) : (
            <div className="ink-card divide-y divide-rule overflow-hidden">
              {recentTournaments.map((t, i) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  data-active={i === 0 ? 'true' : undefined}
                  className="status-rail row-tappable flex items-center gap-3 pl-4 pr-3 py-3.5 transition-colors hover:bg-ink-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-ink-100 truncate text-[0.95rem] tracking-[0.02em]">{t.name}</h3>
                    <p className="text-xs text-ink-400 mt-0.5">
                      <span className="ink-num">{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                      {t.location && <span className="text-ink-500"> · {t.location}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <DeckBadges colors={t.myDeckColors as any} />
                    {t.placement != null && (
                      <span className="ink-num text-sm text-gold-400">#{t.placement}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-4 sm:px-4 text-center">
      <p className="text-[0.7rem] uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className="ink-num text-xl sm:text-2xl text-ink-100 mt-1.5">{value}</p>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const p = { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeWidth: 1.7 };
  switch (name) {
    case 'trophy': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" /></svg>;
    case 'cards': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case 'chart': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'lore': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    case 'cut': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
    case 'diamond': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 9-9 9-9-9 9-9z" /></svg>;
    default: return null;
  }
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-md bg-ink-800/30">
      <span className="text-gold-400 shrink-0 mt-0.5"><FeatureIcon name={icon} /></span>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
