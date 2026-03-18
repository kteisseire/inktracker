import { useState, type ReactNode } from 'react';

/* ── Visual mock helpers ── */

const INK_HEX: Record<string, string> = {
  AMBER: '#f59e0b', AMETHYST: '#8b5cf6', EMERALD: '#10b981',
  RUBY: '#ef4444', SAPPHIRE: '#3b82f6', STEEL: '#6b7280',
};
const INK_LABELS: Record<string, string> = {
  AMBER: 'Ambre', AMETHYST: 'Am\u00e9thyste', EMERALD: '\u00c9meraude',
  RUBY: 'Rubis', SAPPHIRE: 'Saphir', STEEL: 'Acier',
};

function MockBtn({ children, gold, small }: { children: ReactNode; gold?: boolean; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl font-semibold select-none whitespace-nowrap ${
      small ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5'
    } ${gold
      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950'
      : 'border border-ink-700 text-ink-300 bg-ink-800/50'
    }`}>
      {children}
    </span>
  );
}

function MockTab({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex px-3 py-1.5 text-xs font-medium border-b-2 ${
      active ? 'text-gold-400 border-gold-500' : 'text-ink-400 border-transparent'
    }`}>
      {label}
    </span>
  );
}

function InkDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full ring-1 ring-white/10 align-middle"
      style={{ backgroundColor: INK_HEX[color] }}
      title={INK_LABELS[color]}
    />
  );
}

function InkBadge({ color }: { color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
      style={{
        backgroundColor: INK_HEX[color],
        color: color === 'AMBER' ? '#78350f' : '#fff',
        textShadow: color === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {INK_LABELS[color]}
    </span>
  );
}

function MockCheckbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
        checked ? 'border-amber-400 bg-amber-400' : 'border-ink-600'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-xs text-ink-300">{label}</span>
    </span>
  );
}

function MockScoutBtn() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-500/15 text-gold-400">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </span>
  );
}

function MockEditBtn() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink-800/60 text-ink-400">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </span>
  );
}

function MockMatch({ p1, p2, p1Colors, p2Colors, score }: { p1: string; p2: string; p1Colors?: string[]; p2Colors?: string[]; score?: string }) {
  return (
    <div className="rounded-lg bg-ink-800/40 border border-ink-700/30 p-2.5 text-xs space-y-1.5 not-prose">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-200 font-medium">{p1}</span>
          {p1Colors?.map(c => <InkDot key={c} color={c} />)}
          {!p1Colors && <MockScoutBtn />}
        </div>
        {score && <span className="text-green-400 font-semibold">{score.split('-')[0]}</span>}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-200 font-medium">{p2}</span>
          {p2Colors?.map(c => <InkDot key={c} color={c} />)}
          {!p2Colors && <MockScoutBtn />}
        </div>
        {score && <span className="text-red-400 font-semibold">{score.split('-')[1]}</span>}
      </div>
    </div>
  );
}

function MockSyncBanner() {
  return (
    <div className="rounded-lg border border-gold-500/20 bg-ink-900/80 p-3 space-y-2 not-prose">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-ink-200">3 rondes \u00e0 synchroniser</p>
          <p className="text-[10px] text-ink-500">Depuis le Play Hub</p>
        </div>
        <MockBtn gold small>Synchroniser</MockBtn>
      </div>
      <div className="space-y-1">
        {[
          { r: 1, opp: 'Joueur_A', result: 'V', score: '2-0', cls: 'text-green-400' },
          { r: 2, opp: 'Joueur_B', result: 'D', score: '1-2', cls: 'text-red-400' },
          { r: 3, opp: 'Joueur_C', result: 'V', score: '2-1', cls: 'text-green-400' },
        ].map(d => (
          <div key={d.r} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-ink-900/50">
            <span className="text-ink-400">R{d.r} vs <span className="text-ink-200">{d.opp}</span></span>
            <div className="flex items-center gap-2">
              <span className={d.cls}>{d.result} {d.score}</span>
              <span className="text-ink-600">+ nouveau</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockDeduction() {
  return (
    <div className="space-y-2 not-prose">
      <div className="rounded-lg bg-ink-800/40 border border-ink-700/30 p-2.5 text-xs">
        <p className="text-ink-500 mb-1.5">Ronde 3 — Table 12</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-200">Alice</span>
            <span className="text-amber-400 text-[10px]">?</span>
            <InkDot color="RUBY" /><InkDot color="SAPPHIRE" />
            <span className="text-ink-600 text-[10px] mx-0.5">/</span>
            <InkDot color="AMBER" /><InkDot color="AMETHYST" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-ink-200">Bob</span>
          <span className="text-amber-400 text-[10px]">?</span>
          <InkDot color="RUBY" /><InkDot color="SAPPHIRE" />
          <span className="text-ink-600 text-[10px] mx-0.5">/</span>
          <InkDot color="AMBER" /><InkDot color="AMETHYST" />
        </div>
      </div>
      <div className="flex justify-center">
        <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
      <div className="rounded-lg bg-ink-800/40 border border-green-500/20 p-2.5 text-xs">
        <p className="text-green-400/80 text-[10px] mb-1.5">Alice qualifi\u00e9e Rubis/Saphir \u2192 Bob d\u00e9duit Ambre/Am\u00e9thyste</p>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-200">Alice</span>
          <InkDot color="RUBY" /><InkDot color="SAPPHIRE" />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-ink-200">Bob</span>
          <InkDot color="AMBER" /><InkDot color="AMETHYST" />
          <span className="text-[10px] text-green-400/60 ml-1">d\u00e9duit</span>
        </div>
      </div>
    </div>
  );
}

function MockColorGrid() {
  const colors = ['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL'];
  return (
    <div className="grid grid-cols-3 gap-1.5 max-w-[200px] not-prose">
      {colors.map(c => (
        <span
          key={c}
          className={`flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-semibold ${
            c === 'RUBY' || c === 'SAPPHIRE' ? 'ring-2 ring-gold-400 scale-[1.02]' : 'opacity-40'
          }`}
          style={{
            backgroundColor: INK_HEX[c],
            color: c === 'AMBER' ? '#78350f' : '#fff',
            textShadow: c === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {INK_LABELS[c]}
        </span>
      ))}
    </div>
  );
}

function MockLinkPrompt() {
  return (
    <div className="rounded-lg bg-ink-800/40 border border-ink-700/30 p-3 space-y-2 not-prose max-w-[280px]">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.562a4.5 4.5 0 00-6.364-6.364L4.5 8.244" />
        </svg>
        <span className="text-xs font-semibold text-ink-100">Connecter le Play Hub</span>
      </div>
      <div className="rounded-lg bg-ink-900/50 border border-ink-700/30 px-2.5 py-1.5 text-[10px] text-ink-500 truncate">
        https://tcg.ravensburgerplay.com/events/...
      </div>
      <MockBtn gold small>Connecter</MockBtn>
    </div>
  );
}

/* ── FAQ data with rich content ── */

interface FaqItem {
  question: string;
  answer: ReactNode;
}

interface FaqSection {
  title: string;
  icon: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Tournois',
    icon: 'M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6',
    items: [
      {
        question: 'Comment cr\u00e9er un tournoi ?',
        answer: (
          <div className="space-y-3">
            <p>Depuis la page Tournois, cliquez sur le bouton :</p>
            <MockBtn gold>+ Nouveau tournoi</MockBtn>
            <p>Renseignez le nom, la date, le format (<code className="text-ink-300 bg-ink-800/50 px-1 rounded">Bo1</code>, <code className="text-ink-300 bg-ink-800/50 px-1 rounded">Bo3</code>, <code className="text-ink-300 bg-ink-800/50 px-1 rounded">Bo5</code>), le nombre de rondes suisses et le type de top cut. Vous pouvez aussi s\u00e9lectionner un de vos decks enregistr\u00e9s.</p>
          </div>
        ),
      },
      {
        question: 'Comment ajouter mes rondes ?',
        answer: (
          <div className="space-y-3">
            <p>Depuis la fiche d'un tournoi, dans l'onglet <MockTab label="Mes rondes" active />, cliquez sur :</p>
            <MockBtn gold>+ Ronde</MockBtn>
            <p>Renseignez le nom de l'adversaire, le r\u00e9sultat (victoire, d\u00e9faite, nul) et les scores de chaque game. Vous pouvez noter si vous avez jou\u00e9 en premier.</p>
          </div>
        ),
      },
      {
        question: "Qu'est-ce que la synchronisation Play Hub ?",
        answer: (
          <div className="space-y-3">
            <p>Si votre tournoi est sur Ravensburger Play Hub, InkTracker peut r\u00e9cup\u00e9rer automatiquement vos rondes et r\u00e9sultats. Une banni\u00e8re de synchronisation appara\u00eet en haut de l'arbre :</p>
            <MockSyncBanner />
            <p>Cliquez sur <MockBtn gold small>Synchroniser</MockBtn> pour importer les rondes. Les scores (2-1, 2-0, etc.) sont fid\u00e8lement reproduits.</p>
          </div>
        ),
      },
      {
        question: 'Comment connecter le Play Hub ?',
        answer: (
          <div className="space-y-3">
            <p>Allez dans l'onglet <MockTab label="Arbre du tournoi" active />. Si aucun lien n'est configur\u00e9, ce formulaire appara\u00eet :</p>
            <MockLinkPrompt />
            <p>Collez l'URL de votre \u00e9v\u00e9nement Play Hub (ex : <code className="text-ink-300 bg-ink-800/50 px-1 rounded text-[11px]">tcg.ravensburgerplay.com/events/427780</code>) et cliquez <MockBtn gold small>Connecter</MockBtn>. L'arbre, les classements et le scouting se d\u00e9bloquent imm\u00e9diatement.</p>
          </div>
        ),
      },
      {
        question: 'Les rondes suisses et le top cut sont-ils g\u00e9r\u00e9s ?',
        answer: (
          <p>Oui. Lors de la synchronisation, les rondes suisses et les rondes de top cut sont d\u00e9tect\u00e9es automatiquement. Elles sont affich\u00e9es dans des sections s\u00e9par\u00e9es et les scores sont fid\u00e8lement import\u00e9s.</p>
        ),
      },
    ],
  },
  {
    title: 'Arbre du tournoi et scouting',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    items: [
      {
        question: "Qu'est-ce que l'arbre du tournoi ?",
        answer: (
          <div className="space-y-3">
            <p>L'onglet <MockTab label="Arbre du tournoi" active /> affiche les donn\u00e9es en direct depuis Play Hub. Vous y trouvez trois vues :</p>
            <div className="flex gap-1">
              <MockTab label="Classement" active />
              <MockTab label="Matchs" />
              <MockTab label="Rondes" />
            </div>
            <p>Depuis la vue Matchs, chaque rencontre affiche les joueurs avec leurs scores. Cliquez sur un match pour ouvrir la fen\u00eatre de qualification de deck.</p>
          </div>
        ),
      },
      {
        question: "Comment qualifier le deck d'un joueur ?",
        answer: (
          <div className="space-y-3">
            <p>Cliquez sur un match pour ouvrir la fen\u00eatre de qualification. \u00c0 c\u00f4t\u00e9 de chaque joueur, un bouton <MockScoutBtn /> permet de qualifier son deck.</p>
            <p>S\u00e9lectionnez les 2 couleurs :</p>
            <MockColorGrid />
            <p>L'enregistrement est <strong className="text-ink-200">automatique</strong> d\u00e8s que les 2 couleurs sont s\u00e9lectionn\u00e9es. Les pastilles apparaissent ensuite \u00e0 c\u00f4t\u00e9 du nom du joueur :</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-200">Joueur_A</span>
              <InkDot color="RUBY" />
              <InkDot color="SAPPHIRE" />
            </div>
            <p>Pour modifier un deck d\u00e9j\u00e0 qualifi\u00e9, cliquez sur <MockEditBtn /> \u00e0 c\u00f4t\u00e9 du nom.</p>
          </div>
        ),
      },
      {
        question: 'Que faire si je ne sais pas qui joue quel deck ?',
        answer: (
          <div className="space-y-3">
            <p>Cochez la case :</p>
            <MockCheckbox checked label="Je ne sais pas qui joue quel deck" />
            <p>Vous pourrez d\u00e9finir 2 decks (Deck A et Deck B) sans les attribuer. Ils sont marqu\u00e9s comme potentiels :</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-200">Joueur_A</span>
              <span className="text-amber-400 text-[10px]">?</span>
              <InkDot color="RUBY" /><InkDot color="SAPPHIRE" />
              <span className="text-ink-600 text-[10px]">/</span>
              <InkDot color="AMBER" /><InkDot color="AMETHYST" />
            </div>
            <p>Cliquez sur les pastilles pour voir le d\u00e9tail (qui a scout\u00e9, \u00e0 quelle table, quelle ronde).</p>
          </div>
        ),
      },
      {
        question: 'Comment fonctionne la d\u00e9duction automatique ?',
        answer: (
          <div className="space-y-3">
            <p>Quand vous qualifiez le deck d'un joueur de mani\u00e8re certaine, InkTracker v\u00e9rifie toutes les tables o\u00f9 ce joueur avait des decks potentiels :</p>
            <MockDeduction />
            <p>Cette d\u00e9duction se propage <strong className="text-ink-200">en cascade</strong> : si le deck d\u00e9duit de Bob permet de r\u00e9soudre d'autres tables o\u00f9 il apparaissait, elles sont \u00e9galement r\u00e9solues automatiquement.</p>
          </div>
        ),
      },
      {
        question: "Le scouting fonctionne-t-il en \u00e9quipe ?",
        answer: (
          <p>Oui. Si vous \u00eates membre d'une \u00e9quipe, vos observations sont automatiquement partag\u00e9es avec tous les membres. Chaque membre peut qualifier des decks et toute l'\u00e9quipe b\u00e9n\u00e9ficie de l'ensemble des donn\u00e9es. Plus votre \u00e9quipe scoute, plus la couverture est compl\u00e8te.</p>
        ),
      },
      {
        question: 'Puis-je scouter sans \u00eatre dans une \u00e9quipe ?',
        answer: (
          <p>Oui. Le scouting fonctionne aussi en mode personnel. Vos observations sont priv\u00e9es et visibles uniquement par vous. Pour partager, cr\u00e9ez ou rejoignez une \u00e9quipe depuis la page "Mes \u00e9quipes".</p>
        ),
      },
    ],
  },
  {
    title: 'Decks',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    items: [
      {
        question: 'Comment ajouter un deck ?',
        answer: (
          <div className="space-y-3">
            <p>Depuis la page "Mes decks", cliquez sur :</p>
            <MockBtn gold>+ Nouveau deck</MockBtn>
            <p>Donnez-lui un nom, s\u00e9lectionnez ses couleurs (1 \u00e0 3) :</p>
            <div className="flex gap-1.5">
              <InkBadge color="RUBY" />
              <InkBadge color="SAPPHIRE" />
            </div>
            <p>Optionnellement, collez un lien vers votre liste (Dreamborn, Lorcanito, Duels.ink, Inkdecks) \u2014 les couleurs seront d\u00e9tect\u00e9es automatiquement.</p>
          </div>
        ),
      },
      {
        question: "L'import automatique des couleurs fonctionne comment ?",
        answer: (
          <div className="space-y-3">
            <p>Quand vous collez un lien de deck, InkTracker analyse la page et d\u00e9tecte les couleurs. Sites support\u00e9s :</p>
            <div className="flex flex-wrap gap-2">
              {['dreamborn.ink', 'lorcanito.com', 'duels.ink', 'inkdecks.com'].map(s => (
                <span key={s} className="px-2 py-0.5 rounded bg-ink-800/50 text-[11px] text-ink-300 font-mono">{s}</span>
              ))}
            </div>
          </div>
        ),
      },
      {
        question: "Qu'est-ce que le deck par d\u00e9faut ?",
        answer: (
          <p>Le deck par d\u00e9faut est pr\u00e9s\u00e9lectionn\u00e9 quand vous cr\u00e9ez un nouveau tournoi. Pratique si vous jouez souvent le m\u00eame deck. D\u00e9finissez-le depuis la page de d\u00e9tail du deck.</p>
        ),
      },
    ],
  },
  {
    title: 'Statistiques',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    items: [
      {
        question: 'Quelles statistiques sont disponibles ?',
        answer: (
          <div className="space-y-3">
            <p>La page Statistiques vous donne :</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-gold-400 mt-0.5">\u2022</span><span><strong className="text-ink-200">Win rate global</strong> \u2014 toutes rondes confondues</span></li>
              <li className="flex items-start gap-2"><span className="text-gold-400 mt-0.5">\u2022</span><span><strong className="text-ink-200">Win rate par deck</strong> \u2014 performance de chaque deck</span></li>
              <li className="flex items-start gap-2"><span className="text-gold-400 mt-0.5">\u2022</span><span><strong className="text-ink-200">Matchups</strong> \u2014 win rate couleur par couleur adverse</span></li>
              <li className="flex items-start gap-2"><span className="text-gold-400 mt-0.5">\u2022</span><span><strong className="text-ink-200">Impact premier joueur</strong> \u2014 diff\u00e9rence quand vous jouez en premier vs second</span></li>
            </ul>
            <p>Vous pouvez filtrer par p\u00e9riode (dates).</p>
          </div>
        ),
      },
      {
        question: 'Comment voir les stats d\u2019un deck sp\u00e9cifique ?',
        answer: (
          <div className="space-y-3">
            <p>Depuis "Mes decks", cliquez sur un deck pour voir ses statistiques d\u00e9di\u00e9es : win rate, matchups par couleur adverse, et historique des r\u00e9sultats.</p>
            <div className="flex items-center gap-2">
              <InkBadge color="RUBY" />
              <InkBadge color="SAPPHIRE" />
              <span className="text-xs text-ink-400">\u2192</span>
              <span className="text-xs text-green-400 font-semibold">67% WR</span>
              <span className="text-[10px] text-ink-500">(24 matchs)</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: '\u00c9quipes',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    items: [
      {
        question: 'Comment cr\u00e9er une \u00e9quipe ?',
        answer: (
          <div className="space-y-3">
            <p>Depuis "Mes \u00e9quipes", cliquez sur :</p>
            <MockBtn gold>Cr\u00e9er une \u00e9quipe</MockBtn>
            <p>Donnez-lui un nom et une description optionnelle. Vous devenez automatiquement propri\u00e9taire.</p>
          </div>
        ),
      },
      {
        question: 'Comment inviter des membres ?',
        answer: (
          <p>Depuis la fiche de votre \u00e9quipe, entrez le nom d'utilisateur InkTracker du joueur dans le champ d'invitation. L'invit\u00e9 pourra accepter ou refuser depuis sa page "\u00c9quipes".</p>
        ),
      },
      {
        question: 'Quels sont les r\u00f4les dans une \u00e9quipe ?',
        answer: (
          <div className="space-y-2">
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 font-semibold text-center">Propri\u00e9taire</span>
              <span className="text-ink-400 py-0.5">Cr\u00e9ateur de l'\u00e9quipe, tous les droits (supprimer, g\u00e9rer les r\u00f4les)</span>
              <span className="px-2 py-0.5 rounded bg-ink-700/50 text-ink-200 font-semibold text-center">Admin</span>
              <span className="text-ink-400 py-0.5">Peut inviter et retirer des membres</span>
              <span className="px-2 py-0.5 rounded bg-ink-800/50 text-ink-300 font-semibold text-center">Membre</span>
              <span className="text-ink-400 py-0.5">Peut scouter et voir les donn\u00e9es partag\u00e9es</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Outils gratuits',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    items: [
      {
        question: 'Comment fonctionne le compteur de Lore ?',
        answer: (
          <div className="space-y-3">
            <p>Outil plein \u00e9cran optimis\u00e9 mobile. Deux compteurs face \u00e0 face (un joueur en haut invers\u00e9, l'autre en bas).</p>
            <div className="flex items-center gap-2">
              <MockBtn small>-1</MockBtn>
              <span className="text-lg font-bold text-ink-100 w-8 text-center">12</span>
              <MockBtn small>+1</MockBtn>
              <MockBtn small>+2</MockBtn>
            </div>
            <p>Un historique des actions est consultable, et la victoire est d\u00e9tect\u00e9e automatiquement \u00e0 20 lore. Aucun compte requis.</p>
          </div>
        ),
      },
      {
        question: 'Comment fonctionne le calculateur de Top Cut ?',
        answer: (
          <div className="space-y-3">
            <p>Entrez le nombre de joueurs, rondes suisses et taille du top cut. L'outil affiche :</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-green-500/15 text-green-400 font-semibold">Safe</span>
                <span className="text-ink-400">Record garanti pour passer le cut</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">Bubble</span>
                <span className="text-ink-400">Record incertain, d\u00e9pend des d\u00e9partages</span>
              </div>
            </div>
            <p>Aucun compte requis.</p>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Compte et s\u00e9curit\u00e9',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    items: [
      {
        question: 'Quels modes de connexion sont disponibles ?',
        answer: (
          <div className="space-y-3">
            <p>Trois m\u00e9thodes :</p>
            <div className="flex flex-wrap gap-2">
              <MockBtn small>Email + mot de passe</MockBtn>
              <MockBtn small>Google</MockBtn>
              <MockBtn small>Discord</MockBtn>
            </div>
            <p>Si vous utilisez le m\u00eame email avec plusieurs m\u00e9thodes, les comptes sont automatiquement li\u00e9s.</p>
          </div>
        ),
      },
      {
        question: "J'ai oubli\u00e9 mon mot de passe, que faire ?",
        answer: (
          <div className="space-y-3">
            <p>Sur la page de connexion, cliquez sur :</p>
            <span className="text-xs text-gold-400 font-medium">Mot de passe oubli\u00e9 ?</span>
            <p>Entrez votre email. Vous recevrez un lien de r\u00e9initialisation valable 1 heure. V\u00e9rifiez vos spams si vous ne le trouvez pas.</p>
          </div>
        ),
      },
      {
        question: 'Mes donn\u00e9es sont-elles priv\u00e9es ?',
        answer: (
          <p>Oui. Vos tournois, rondes et statistiques sont accessibles uniquement par vous. Les donn\u00e9es de scouting sont partag\u00e9es uniquement avec les membres de votre \u00e9quipe si vous en avez une.</p>
        ),
      },
    ],
  },
];

/* ── Accordion ── */

function Accordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ink-800/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left group"
      >
        <span className="text-sm font-medium text-ink-200 group-hover:text-ink-100 transition-colors">{item.question}</span>
        <svg
          className={`w-4 h-4 text-ink-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 pr-4 text-sm text-ink-400 leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

/* ── Page ── */

export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Aide</h1>
        <p className="text-sm text-ink-400 mt-1">Tout ce que vous devez savoir pour utiliser InkTracker.</p>
      </div>

      {FAQ_SECTIONS.map(section => (
        <section key={section.title} className="ink-card p-5 sm:p-6 space-y-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-ink-100">{section.title}</h2>
          </div>
          {section.items.map(item => (
            <Accordion key={item.question} item={item} />
          ))}
        </section>
      ))}

      <div className="text-center py-4">
        <p className="text-sm text-ink-500">
          Une question non couverte ?{' '}
          <a href="https://github.com/kteisseire/inktracker/issues" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 transition-colors">
            Ouvrir un ticket sur GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
