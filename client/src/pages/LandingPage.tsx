import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-5 text-gold-400">&#9670;</div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide">
          <span className="text-gold-400">Ink</span>
          <span className="text-ink-200">Tracker</span>
        </h1>
        <p className="mt-4 text-ink-300 text-lg sm:text-xl max-w-xl mx-auto">
          L'outil complet pour suivre et analyser vos performances en tournois Disney Lorcana
        </p>
        <p className="mt-3 text-ink-500 text-sm sm:text-base max-w-lg mx-auto">
          Enregistrez vos tournois ronde par ronde, analysez vos matchups, identifiez vos forces et progressez.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="ink-btn-primary px-8 py-3 text-base font-semibold">
            Commencer gratuitement
          </Link>
          <Link to="/login" className="text-sm text-ink-400 hover:text-gold-400 transition-colors px-4 py-3">
            J'ai déjà un compte
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-center text-sm font-semibold text-ink-500 uppercase tracking-widest mb-6">Fonctionnalités</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon="&#9876;"
            title="Suivi de tournois"
            description="Enregistrez chaque tournoi avec vos rondes, résultats, scores de lore et notes. Compatible Bo1, Bo3 et Bo5."
          />
          <FeatureCard
            icon="&#9824;"
            title="Gestion de decks"
            description="Créez et organisez vos decks. Import automatique des couleurs depuis Dreamborn, Lorcanito, Inkdecks et plus."
          />
          <FeatureCard
            icon="&#9636;"
            title="Statistiques avancées"
            description="Win rate global et par deck, analyse des matchups, impact du premier joueur. Filtrage par set Lorcana ou dates personnalisées."
          />
          <FeatureCard
            icon="&#10022;"
            title="Compteur de Lore"
            description="Compteur plein écran optimisé mobile pour 2 joueurs avec historique des actions et détection automatique du gagnant à 20 lore."
          />
          <FeatureCard
            icon="&#9986;"
            title="Top Cut Calculator"
            description="Calculez les records nécessaires pour passer le cut en format Suisse selon le nombre de joueurs et de rondes."
          />
          <FeatureCard
            icon="&#9670;"
            title="Progression Top Cut"
            description="Suivez en direct vos points par rapport au seuil de qualification pendant vos tournois."
          />
        </div>
      </section>

      {/* Free tools */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-center text-sm font-semibold text-ink-500 uppercase tracking-widest mb-6">Outils gratuits — sans inscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/lore-counter" className="ink-card-hover p-5 flex gap-4 items-start group">
            <span className="text-3xl text-gold-400 shrink-0">&#10022;</span>
            <div>
              <h3 className="text-base font-semibold text-ink-100 group-hover:text-gold-400 transition-colors">Compteur de Lore</h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Plein écran, 2 joueurs face à face, historique des actions, victoire auto à 20 lore.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gold-400 mt-2 font-medium">
                Ouvrir &rarr;
              </span>
            </div>
          </Link>
          <Link to="/top-cut" className="ink-card-hover p-5 flex gap-4 items-start group">
            <span className="text-3xl text-gold-400 shrink-0">&#9986;</span>
            <div>
              <h3 className="text-base font-semibold text-ink-100 group-hover:text-gold-400 transition-colors">Top Cut Calculator</h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Estimez les records pour passer le cut selon le nombre de joueurs, rondes et taille du top.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gold-400 mt-2 font-medium">
                Ouvrir &rarr;
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center max-w-md mx-auto space-y-4">
        <p className="text-ink-400">
          Prêt à suivre vos performances ?
        </p>
        <Link to="/register" className="ink-btn-primary px-8 py-3 text-base font-semibold inline-block">
          Créer mon compte
        </Link>
        <p className="text-xs text-ink-600">
          Gratuit et open source. Vos données sont privées et accessibles uniquement par vous.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3.5 p-4 rounded-xl bg-ink-800/30 border border-ink-700/20">
      <span className="text-xl text-gold-400 shrink-0 mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs text-ink-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
