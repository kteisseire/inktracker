import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Layers, BarChart3, Sparkles, Scissors, Gem, CalendarDays, ChevronRight, Plus, type LucideIcon } from 'lucide-react';
import { getOverview } from '../api/stats.api.js';
import { listTournaments } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { LogoIcon } from '../components/ui/Logo.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonStatPanel, SkeletonRows } from '../components/ui/Skeleton.js';
import { Reveal, FolioHero, CountUpPercent, DropCap } from '../components/ui/folio.js';
import { StatCell } from '../components/ui/StatCell.js';
import type { OverviewStats } from '@lorcana/shared';

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
      {/* Title (the win-rate numeral is this screen's giant, so the title stays measured) */}
      <Reveal i={0} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl sm:text-3xl text-ink-50 tracking-[0.03em]">Tableau de bord</h1>
          <HelpButton sections={['Tournois', 'Statistiques']} />
        </div>
        <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2 shrink-0 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" strokeWidth={2.2} /> Nouveau
        </Link>
      </Reveal>

      {/* Stats instrument panel */}
      {loading && !stats ? (
        <SkeletonStatPanel />
      ) : stats && !isEmpty ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <Reveal i={1} className="sm:col-span-1">
            <FolioHero rubric="Win rate" tick className="h-full">
              <CountUpPercent value={stats.overallWinRate} />
            </FolioHero>
          </Reveal>
          <Reveal i={2} as="div" className="ink-card sm:col-span-2 grid grid-cols-3 divide-x divide-rule">
            <StatCell label="Tournois" value={stats.totalTournaments} />
            <StatCell label="Rondes" value={stats.totalRounds} />
            <StatCell label="V / D / N" value={`${stats.wins}/${stats.losses}/${stats.draws}`} />
          </Reveal>
        </div>
      ) : null}

      {/* Welcome / empty onboarding (only when no tournaments yet) */}
      {isEmpty && (
        <div className="section-wash space-y-5">
          <div className="text-center">
            <div className="flex justify-center mb-3"><LogoIcon className="w-11 h-11" /></div>
            <h2 className="font-display text-xl sm:text-2xl text-ink-50 tracking-[0.03em]">Bienvenue sur GlimmerLog</h2>
          </div>
          <DropCap className="max-w-md mx-auto">
            L'outil complet pour suivre et analyser vos performances en tournois Disney Lorcana : tournois, decks, statistiques, matchups et plus.
          </DropCap>
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
            <h2 className="rubric-label flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" strokeWidth={2} /> Tournois récents</h2>
            <Link to="/tournaments" className="text-gold-400 text-xs hover:text-gold-300 transition-colors inline-flex items-center gap-0.5">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <SkeletonRows count={3} />
          ) : recentTournaments.length === 0 ? (
            <div className="section-wash flex flex-col items-center text-center py-10 gap-3">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gold-400/10 text-gold-400 shadow-edge-lit">
                <Trophy className="w-7 h-7" strokeWidth={1.6} />
              </span>
              <p className="text-ink-400 text-sm max-w-xs">Aucun tournoi enregistré pour l'instant. Lancez-vous et suivez vos performances.</p>
              <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" strokeWidth={2.2} /> Créer un tournoi
              </Link>
            </div>
          ) : (
            <div className="ink-card divide-y divide-rule overflow-hidden">
              {recentTournaments.map((t, i) => (
                <Reveal
                  key={t.id}
                  as={Link}
                  i={i}
                  to={`/tournaments/${t.id}`}
                  data-active={i === 0 ? 'true' : undefined}
                  className="status-rail row-tappable flex items-center gap-3 pl-4 pr-3 py-3.5 transition-colors hover:bg-ink-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-ink-100 truncate text-[0.95rem] tracking-[0.02em]">{t.name}</h3>
                    <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-ink-500 shrink-0" strokeWidth={1.8} />
                      <span className="ink-num">{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                      {t.location && <span className="text-ink-500 truncate"> · {t.location}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <DeckBadges colors={t.myDeckColors as any} />
                    {t.placement != null && (
                      <span className="ink-num text-sm text-gold-400">#{t.placement}</span>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const FEATURE_ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  cards: Layers,
  chart: BarChart3,
  lore: Sparkles,
  cut: Scissors,
  diamond: Gem,
};

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  const Icon = FEATURE_ICONS[icon] ?? Sparkles;
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-ink-800/30 border border-rule/60 hover:border-rule-gold transition-colors">
      <span className="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-gold-400/10 text-gold-400">
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
