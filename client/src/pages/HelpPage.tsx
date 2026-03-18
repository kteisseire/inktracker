import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: string;
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
        answer: 'Depuis la page "Tournois", cliquez sur "+ Nouveau tournoi". Renseignez le nom, la date, le format (Bo1, Bo3, Bo5), le nombre de rondes suisses et le type de top cut. Vous pouvez aussi s\u00e9lectionner un de vos decks enregistr\u00e9s.',
      },
      {
        question: 'Comment ajouter mes rondes ?',
        answer: 'Depuis la fiche d\'un tournoi, cliquez sur "+ Ronde" dans l\'onglet "Mes rondes". Renseignez le nom de l\'adversaire, le r\u00e9sultat (victoire, d\u00e9faite, nul) et les scores de chaque game. Vous pouvez aussi noter si vous avez jou\u00e9 en premier.',
      },
      {
        question: 'Qu\'est-ce que la synchronisation Play Hub ?',
        answer: 'Si votre tournoi est enregistr\u00e9 sur Ravensburger Play Hub (tcg.ravensburgerplay.com), collez le lien de l\'\u00e9v\u00e9nement dans les param\u00e8tres du tournoi. InkTracker pourra alors r\u00e9cup\u00e9rer automatiquement les classements, les rondes et vos r\u00e9sultats. Vos rondes sont pr\u00e9-remplies \u2014 il suffit de cliquer "Synchroniser" pour les importer dans vos donn\u00e9es.',
      },
      {
        question: 'Comment connecter le Play Hub ?',
        answer: 'Allez dans l\'onglet "Arbre du tournoi" de votre tournoi. Si aucun lien n\'est configur\u00e9, un formulaire vous permet de coller directement l\'URL de l\'\u00e9v\u00e9nement Play Hub (ex : https://tcg.ravensburgerplay.com/events/427780). Vous pouvez aussi l\'ajouter en modifiant le tournoi.',
      },
      {
        question: 'Les rondes suisses et le top cut sont-ils g\u00e9r\u00e9s ?',
        answer: 'Oui. Lors de la synchronisation Play Hub, les rondes suisses et les rondes de top cut sont d\u00e9tect\u00e9es automatiquement et affich\u00e9es s\u00e9par\u00e9ment. Les scores (2-1, 2-0, etc.) sont fid\u00e8lement import\u00e9s.',
      },
    ],
  },
  {
    title: 'Arbre du tournoi et scouting',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    items: [
      {
        question: 'Qu\'est-ce que l\'arbre du tournoi ?',
        answer: 'L\'arbre du tournoi affiche les donn\u00e9es en direct depuis Ravensburger Play Hub : classement, rondes et matchs. Depuis cet onglet, vous pouvez consulter les r\u00e9sultats de chaque ronde, voir le classement en cours et scouter les decks adverses.',
      },
      {
        question: 'Comment qualifier le deck d\'un joueur ?',
        answer: 'Cliquez sur un match dans l\'arbre du tournoi. Une fen\u00eatre de qualification s\'ouvre. S\u00e9lectionnez les 2 couleurs du deck du joueur \u2014 l\'enregistrement est automatique d\u00e8s que les 2 couleurs sont choisies. Vous verrez ensuite les pastilles de couleur appara\u00eetre \u00e0 c\u00f4t\u00e9 du nom du joueur.',
      },
      {
        question: 'Que faire si je ne sais pas qui joue quel deck ?',
        answer: 'Cochez la case "Je ne sais pas qui joue quel deck". Vous pourrez alors d\u00e9finir 2 decks (Deck A et Deck B) sans les attribuer \u00e0 un joueur pr\u00e9cis. Ces decks sont marqu\u00e9s comme "potentiels" (affich\u00e9s avec un point d\'interrogation). D\u00e8s qu\'une info future confirme le deck d\'un des joueurs, l\'autre sera automatiquement d\u00e9duit.',
      },
      {
        question: 'Comment fonctionne la d\u00e9duction automatique ?',
        answer: 'Quand vous qualifiez le deck d\'un joueur de mani\u00e8re certaine, InkTracker v\u00e9rifie toutes les tables o\u00f9 ce joueur avait des decks potentiels. Si une table avait 2 decks possibles et qu\'un correspond au deck confirm\u00e9, l\'adversaire de cette table re\u00e7oit automatiquement l\'autre deck. Cette d\u00e9duction se propage en cascade : si le deck d\u00e9duit de l\'adversaire permet \u00e0 son tour de r\u00e9soudre d\'autres tables, elles sont \u00e9galement r\u00e9solues.',
      },
      {
        question: 'Le scouting fonctionne-t-il en \u00e9quipe ?',
        answer: 'Oui. Si vous \u00eates membre d\'une \u00e9quipe, vos observations de deck sont automatiquement partag\u00e9es avec tous les membres. Chaque membre peut qualifier des decks et toute l\'\u00e9quipe b\u00e9n\u00e9ficie de l\'ensemble des donn\u00e9es collect\u00e9es. Plus votre \u00e9quipe scoute, plus la couverture est compl\u00e8te.',
      },
      {
        question: 'Puis-je scouter sans \u00eatre dans une \u00e9quipe ?',
        answer: 'Oui. Le scouting fonctionne aussi en mode personnel. Vos observations sont priv\u00e9es et visibles uniquement par vous. Pour partager avec d\'autres joueurs, cr\u00e9ez ou rejoignez une \u00e9quipe.',
      },
    ],
  },
  {
    title: 'Decks',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    items: [
      {
        question: 'Comment ajouter un deck ?',
        answer: 'Depuis la page "Mes decks", cliquez sur "+ Nouveau deck". Donnez-lui un nom, s\u00e9lectionnez ses couleurs (1 \u00e0 3), et optionnellement collez un lien vers votre liste (Dreamborn, Lorcanito, Duels.ink, Inkdecks).',
      },
      {
        question: 'L\'import automatique des couleurs fonctionne comment ?',
        answer: 'Quand vous collez un lien de deck depuis Dreamborn, Lorcanito, Duels.ink ou Inkdecks, InkTracker analyse la page et d\u00e9tecte automatiquement les couleurs du deck. Vous n\'avez pas besoin de les s\u00e9lectionner manuellement.',
      },
      {
        question: 'Qu\'est-ce que le deck par d\u00e9faut ?',
        answer: 'Le deck par d\u00e9faut est pr\u00e9s\u00e9lectionn\u00e9 quand vous cr\u00e9ez un nouveau tournoi. Pratique si vous jouez souvent le m\u00eame deck.',
      },
    ],
  },
  {
    title: 'Statistiques',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    items: [
      {
        question: 'Quelles statistiques sont disponibles ?',
        answer: 'InkTracker calcule votre win rate global, votre win rate par deck, l\'analyse des matchups couleur par couleur (quels decks vous battez le plus, lesquels vous posent probl\u00e8me), et l\'impact du premier joueur sur vos r\u00e9sultats. Vous pouvez filtrer par p\u00e9riode.',
      },
      {
        question: 'Comment sont calcul\u00e9es les stats par deck ?',
        answer: 'Depuis la page "Mes decks", cliquez sur un deck pour voir ses statistiques d\u00e9di\u00e9es : win rate avec ce deck, performance par matchup (couleurs adverses), et \u00e9volution dans le temps.',
      },
    ],
  },
  {
    title: '\u00c9quipes',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    items: [
      {
        question: 'Comment cr\u00e9er une \u00e9quipe ?',
        answer: 'Depuis la page "Mes \u00e9quipes", cliquez sur "Cr\u00e9er une \u00e9quipe". Donnez-lui un nom et une description optionnelle. Vous devenez automatiquement propri\u00e9taire de l\'\u00e9quipe.',
      },
      {
        question: 'Comment inviter des membres ?',
        answer: 'Depuis la fiche de votre \u00e9quipe, utilisez la section "Invitations" pour inviter un joueur par son nom d\'utilisateur InkTracker. L\'invit\u00e9 recevra une notification et pourra accepter ou refuser.',
      },
      {
        question: 'Quels sont les r\u00f4les dans une \u00e9quipe ?',
        answer: 'Trois r\u00f4les existent : Propri\u00e9taire (cr\u00e9ateur, tous les droits), Admin (peut inviter et g\u00e9rer les membres) et Membre (peut scouter et voir les donn\u00e9es partag\u00e9es). Le scouting de deck est accessible \u00e0 tous les r\u00f4les.',
      },
    ],
  },
  {
    title: 'Outils gratuits',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    items: [
      {
        question: 'Comment fonctionne le compteur de Lore ?',
        answer: 'Le compteur de Lore est un outil plein \u00e9cran optimis\u00e9 pour mobile. Il affiche deux compteurs face \u00e0 face (un joueur en haut, l\'autre en bas, invers\u00e9 pour que chacun lise son score). Utilisez les boutons +1, +2, -1 pour modifier le score. Un historique des actions est consultable, et la victoire est d\u00e9tect\u00e9e automatiquement \u00e0 20 lore. Aucun compte requis.',
      },
      {
        question: 'Comment fonctionne le calculateur de Top Cut ?',
        answer: 'Entrez le nombre de joueurs, le nombre de rondes suisses et la taille du top cut (top 4, 8, 16 ou 32). L\'outil calcule le record minimum pour \u00eatre "safe" (qualifi\u00e9 \u00e0 coup s\u00fbr) et le record "bubble" (qualification incertaine, d\u00e9pend des d\u00e9partages). Aucun compte requis.',
      },
    ],
  },
  {
    title: 'Compte et s\u00e9curit\u00e9',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    items: [
      {
        question: 'Quels modes de connexion sont disponibles ?',
        answer: 'Vous pouvez vous connecter avec un email et mot de passe, via Google ou via Discord. Si vous utilisez le m\u00eame email pour plusieurs m\u00e9thodes, les comptes sont automatiquement li\u00e9s.',
      },
      {
        question: 'J\'ai oubli\u00e9 mon mot de passe, que faire ?',
        answer: 'Sur la page de connexion, cliquez sur "Mot de passe oubli\u00e9 ?". Entrez votre email et vous recevrez un lien de r\u00e9initialisation valable 1 heure. Si vous ne le trouvez pas, v\u00e9rifiez vos spams.',
      },
      {
        question: 'Mes donn\u00e9es sont-elles priv\u00e9es ?',
        answer: 'Oui. Vos tournois, rondes et statistiques sont accessibles uniquement par vous. Les donn\u00e9es de scouting sont partag\u00e9es uniquement avec les membres de votre \u00e9quipe si vous en avez une.',
      },
    ],
  },
];

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
        <div className="pb-4 pr-6">
          <p className="text-sm text-ink-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

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
