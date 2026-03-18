import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/ui/Logo.js';

export function LandingPage() {
  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-12">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-2">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <LogoIcon className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_24px_rgba(212,163,36,0.3)]" />
            <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 bg-gold-400/10 rounded-full blur-2xl -z-10" />
          </div>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide leading-tight">
          <span className="text-gold-400">Ink</span>
          <span className="text-ink-100">Tracker</span>
        </h1>
        <p className="mt-5 text-ink-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Votre compagnon de tournoi Lorcana.<br className="hidden sm:block" />
          Suivez vos rondes, scoutez les decks adverses, analysez vos performances.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="ink-btn-primary px-8 py-3.5 text-base font-semibold w-full sm:w-auto text-center">
            Commencer gratuitement
          </Link>
          <Link to="/login" className="text-sm text-ink-400 hover:text-gold-400 transition-colors px-6 py-3.5 w-full sm:w-auto text-center">
            J'ai d&eacute;j&agrave; un compte
          </Link>
        </div>
      </section>

      {/* Core feature: tournament workflow */}
      <section className="max-w-4xl mx-auto px-2">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-display text-ink-100 tracking-wide">Tout votre tournoi au m&ecirc;me endroit</h2>
          <p className="mt-3 text-ink-400 text-sm sm:text-base max-w-xl mx-auto">
            Avant, pendant et apr&egrave;s le tournoi, InkTracker vous accompagne &agrave; chaque &eacute;tape.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Step 1 */}
          <div className="relative ink-card p-5 sm:p-6 space-y-3 border-gold-500/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/15 text-gold-400 text-sm font-bold shrink-0">1</span>
              <h3 className="text-base font-semibold text-ink-100">Pr&eacute;parez</h3>
            </div>
            <p className="text-xs text-ink-400 leading-relaxed">
              Cr&eacute;ez votre tournoi, s&eacute;lectionnez votre deck et reliez l'&eacute;v&eacute;nement Play Hub pour synchroniser automatiquement les rondes, classements et r&eacute;sultats.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Tag>Synchro Play Hub</Tag>
              <Tag>Gestion de decks</Tag>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative ink-card p-5 sm:p-6 space-y-3 border-gold-500/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/15 text-gold-400 text-sm font-bold shrink-0">2</span>
              <h3 className="text-base font-semibold text-ink-100">Scoutez</h3>
            </div>
            <p className="text-xs text-ink-400 leading-relaxed">
              Identifiez les decks adverses depuis l'arbre de tournoi. Qualifiez les couleurs en un tap, marquez les incertains. L'info est partag&eacute;e en temps r&eacute;el avec votre &eacute;quipe.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Tag>Scouting en &eacute;quipe</Tag>
              <Tag>D&eacute;duction automatique</Tag>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative ink-card p-5 sm:p-6 space-y-3 border-gold-500/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/15 text-gold-400 text-sm font-bold shrink-0">3</span>
              <h3 className="text-base font-semibold text-ink-100">Analysez</h3>
            </div>
            <p className="text-xs text-ink-400 leading-relaxed">
              Apr&egrave;s le tournoi, retrouvez votre win rate global, par deck, par matchup. Identifiez vos points forts et les decks qui vous posent probl&egrave;me.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Tag>Stats par deck</Tag>
              <Tag>Analyse matchups</Tag>
            </div>
          </div>
        </div>
      </section>

      {/* Scouting highlight */}
      <section className="max-w-4xl mx-auto px-2">
        <div className="ink-card p-6 sm:p-8 border-gold-500/10 bg-gradient-to-br from-ink-900 to-ink-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-semibold uppercase tracking-wide">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Scouting collaboratif
              </div>
              <h3 className="text-xl sm:text-2xl font-display text-ink-100">Sachez ce que joue votre prochain adversaire</h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Parcourez l'arbre de tournoi et qualifiez les decks que vous observez. Quand un deck est incertain, marquez les deux possibilit&eacute;s — InkTracker d&eacute;duit automatiquement le bon deck d&egrave;s qu'une info le confirme, en cascade sur toutes les tables li&eacute;es.
              </p>
              <p className="text-sm text-ink-400 leading-relaxed">
                En &eacute;quipe, toutes les observations sont mutualis&eacute;es. Plus votre &eacute;quipe scoute, plus la couverture est compl&egrave;te.
              </p>
            </div>
            <div className="space-y-3">
              <ScoutPreview player="TheMagicPlayer" colors={['RUBY', 'SAPPHIRE']} certain />
              <ScoutPreview player="LorcanaFan42" colors={['AMBER', 'AMETHYST']} certain />
              <ScoutPreview player="DragonMaster" colors={['EMERALD', 'STEEL']} certain={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Other features */}
      <section className="max-w-4xl mx-auto px-2">
        <h2 className="text-center text-xs font-semibold text-gold-500/60 uppercase tracking-[0.2em] mb-8">Aussi dans InkTracker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard
            icon={<FeatureIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            title="Gestion de decks"
            description="Cr&eacute;ez et organisez vos decks. Import automatique des couleurs depuis Dreamborn, Lorcanito, Duels.ink et Inkdecks."
          />
          <FeatureCard
            icon={<FeatureIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
            title="Statistiques d&eacute;taill&eacute;es"
            description="Win rate global et par deck, analyse des matchups couleur par couleur, impact du premier joueur, filtrage par p&eacute;riode."
          />
          <FeatureCard
            icon={<FeatureIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            title="Syst&egrave;me d'&eacute;quipes"
            description="Cr&eacute;ez votre &eacute;quipe, invitez vos co&eacute;quipiers et partagez le scouting en temps r&eacute;el sur chaque tournoi."
          />
        </div>
      </section>

      {/* Free tools */}
      <section className="max-w-2xl mx-auto px-2">
        <h2 className="text-center text-xs font-semibold text-gold-500/60 uppercase tracking-[0.2em] mb-8">Outils gratuits — sans inscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/lore-counter" className="ink-card-hover p-5 sm:p-6 flex gap-4 items-start group">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
              <FeatureIcon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink-100 group-hover:text-gold-400 transition-colors">Compteur de Lore</h3>
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                Plein &eacute;cran, 2 joueurs face &agrave; face, historique des actions, victoire auto &agrave; 20 lore.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gold-400 mt-2.5 font-medium">
                Ouvrir &rarr;
              </span>
            </div>
          </Link>
          <Link to="/top-cut" className="ink-card-hover p-5 sm:p-6 flex gap-4 items-start group">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
              <FeatureIcon d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink-100 group-hover:text-gold-400 transition-colors">Top Cut Calculator</h3>
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                Estimez les records pour passer le cut selon le nombre de joueurs, rondes et taille du top.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gold-400 mt-2.5 font-medium">
                Ouvrir &rarr;
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center max-w-md mx-auto space-y-5 px-4">
        <p className="text-ink-300 text-base">
          Rejoingnez les joueurs qui utilisent InkTracker pour progresser.
        </p>
        <Link to="/register" className="ink-btn-primary px-8 py-3.5 text-base font-semibold inline-block">
          Cr&eacute;er mon compte gratuitement
        </Link>
        <p className="text-xs text-ink-600">
          100% gratuit. Vos donn&eacute;es restent priv&eacute;es.
        </p>
      </section>
    </div>
  );
}

/* ── Scout preview (visual mockup for landing page) ── */
const INK_HEX: Record<string, string> = {
  AMBER: '#f59e0b', AMETHYST: '#8b5cf6', EMERALD: '#10b981',
  RUBY: '#ef4444', SAPPHIRE: '#3b82f6', STEEL: '#6b7280',
};

function ScoutPreview({ player, colors, certain }: { player: string; colors: string[]; certain: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-800/60 border border-ink-700/30">
      <span className="text-sm text-ink-200 font-medium truncate">{player}</span>
      <div className="flex items-center gap-1.5">
        {!certain && <span className="text-amber-400 text-xs mr-0.5">?</span>}
        {colors.map(c => (
          <span
            key={c}
            className="inline-block w-5 h-5 rounded-full ring-1 ring-white/10"
            style={{ backgroundColor: INK_HEX[c] }}
          />
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md bg-ink-800/60 text-[10px] text-ink-400 font-medium">
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-ink-900/50 border border-ink-700/20 hover:border-gold-500/15 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureIcon({ d, className = 'w-4.5 h-4.5 text-gold-400' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
