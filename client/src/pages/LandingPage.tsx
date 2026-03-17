import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/ui/Logo.js';

export function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-20 py-6 sm:py-12">
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
        <p className="mt-5 text-ink-300 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
          L'outil complet pour suivre et analyser vos performances en tournois Disney Lorcana
        </p>
        <p className="mt-3 text-ink-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Enregistrez vos tournois ronde par ronde, analysez vos matchups, identifiez vos forces et progressez.
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

      {/* Features grid */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-center text-xs font-semibold text-gold-500/60 uppercase tracking-[0.2em] mb-8">Fonctionnalit&eacute;s</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard
            icon={<FeatureIcon d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" />}
            title="Suivi de tournois"
            description="Enregistrez chaque tournoi avec vos rondes, r&eacute;sultats, scores de lore et notes. Compatible Bo1, Bo3 et Bo5."
          />
          <FeatureCard
            icon={<FeatureIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            title="Gestion de decks"
            description="Cr&eacute;ez et organisez vos decks. Import automatique des couleurs depuis Dreamborn, Lorcanito, Inkdecks et plus."
          />
          <FeatureCard
            icon={<FeatureIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
            title="Statistiques avanc&eacute;es"
            description="Win rate global et par deck, analyse des matchups, impact du premier joueur. Filtrage par set ou dates."
          />
          <FeatureCard
            icon={<FeatureIcon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
            title="Compteur de Lore"
            description="Compteur plein &eacute;cran optimis&eacute; mobile pour 2 joueurs avec historique des actions et d&eacute;tection du gagnant."
          />
          <FeatureCard
            icon={<FeatureIcon d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />}
            title="Top Cut Calculator"
            description="Calculez les records n&eacute;cessaires pour passer le cut en format Suisse selon le nombre de joueurs et rondes."
          />
          <FeatureCard
            icon={<FeatureIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            title="Scouting en &eacute;quipe"
            description="Qualifiez les decks adverses en &eacute;quipe. Les couleurs identifi&eacute;es sont partag&eacute;es entre tous les membres."
          />
        </div>
      </section>

      {/* Free tools */}
      <section className="max-w-2xl mx-auto">
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
        <p className="text-ink-400 text-base">
          Pr&ecirc;t &agrave; suivre vos performances ?
        </p>
        <Link to="/register" className="ink-btn-primary px-8 py-3.5 text-base font-semibold inline-block">
          Cr&eacute;er mon compte
        </Link>
        <p className="text-xs text-ink-600">
          Gratuit et open source. Vos donn&eacute;es sont priv&eacute;es et accessibles uniquement par vous.
        </p>
      </section>
    </div>
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
