// Thèmes visuels — partagés entre le compteur de lore et l'app entière.
// Chaque thème pilote le compteur (bg, accents, pilule) ET, via des variables
// CSS appliquées sur :root, la palette globale de l'app (fond, accents "gold",
// hairlines). Le thème "default" reproduit exactement le look Codex Illuminé.

export interface Theme {
  id: string;
  name: string;
  bg: string;           // background CSS du container
  bgOverlay?: string;   // overlay en plus (radial gradient)
  separator: string;    // couleur de la ligne séparateur
  separatorGlow: string;// gradient complet de la ligne
  pill: string;         // background de la pilule centrale
  pillBorder: string;   // border de la pilule
  meAccent: string;     // couleur accent joueur "moi"
  oppAccent: string;    // couleur accent joueur "adversaire"
  stars?: boolean;      // étoiles décoratives
  particles?: 'bubbles' | 'sparks' | 'none';
  labelFont?: string;   // classe tailwind pour les labels
  appAccent: string;    // couleur signature du set — remplace le doré dans l'app
}

export const THEME_STORAGE_KEY = 'glimmerlog_lore_theme';

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Défaut',
    bg: 'radial-gradient(ellipse at 50% 50%, #1a1035 0%, #0c0a14 70%)',
    separator: 'rgba(212,175,55,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 100%)',
    pill: '#0f0c1e',
    pillBorder: 'rgba(212,175,55,0.2)',
    meAccent: '#5ba8d8',
    oppAccent: '#d85b5b',
    stars: true,
    appAccent: '#f5c542',
  },
  // S1 — The First Chapter : Great Illuminary, six encres fondatrices, éclats d'encre colorée
  {
    id: 'set1',
    name: 'The First Chapter',
    bg: 'radial-gradient(ellipse at 50% 30%, #1c1030 0%, #100820 55%, #180810 100%)',
    bgOverlay: 'radial-gradient(ellipse at 70% 80%, rgba(180,20,30,0.12) 0%, transparent 50%)',
    separator: 'rgba(245,178,2,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(1,137,196,0.3) 20%, rgba(245,178,2,0.7) 50%, rgba(211,8,47,0.3) 80%, transparent 100%)',
    pill: '#110d20',
    pillBorder: 'rgba(245,178,2,0.35)',
    meAccent: '#0189C4',
    oppAccent: '#D3082F',
    stars: true,
    appAccent: '#f5b202',
  },
  // S2 — Rise of the Floodborn : inondation d'encre chaotique, tourbillons violets/sombres
  {
    id: 'set2',
    name: 'Rise of the Floodborn',
    bg: 'radial-gradient(ellipse at 40% 60%, #1e0a30 0%, #08041a 55%, #040210 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 30%, rgba(120,40,200,0.2) 0%, transparent 55%)',
    separator: 'rgba(160,80,220,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,20,160,0.4) 20%, rgba(180,100,240,0.7) 50%, rgba(80,20,160,0.4) 80%, transparent 100%)',
    pill: '#0d0820',
    pillBorder: 'rgba(150,70,210,0.35)',
    meAccent: '#9060e8',
    oppAccent: '#e040b0',
    stars: false,
    particles: 'bubbles',
    appAccent: '#b464f0',
  },
  // S3 — Into the Inklands : exploration, montagnes, forêts, pierres anciennes
  {
    id: 'set3',
    name: 'Into the Inklands',
    bg: 'linear-gradient(155deg, #0a1a0c 0%, #081520 45%, #0e1808 100%)',
    bgOverlay: 'radial-gradient(ellipse at 30% 70%, rgba(30,90,20,0.25) 0%, transparent 55%)',
    separator: 'rgba(60,180,90,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(30,120,50,0.3) 20%, rgba(80,200,100,0.65) 50%, rgba(30,120,50,0.3) 80%, transparent 100%)',
    pill: '#071410',
    pillBorder: 'rgba(40,140,60,0.35)',
    meAccent: '#38b060',
    oppAccent: '#d4a820',
    stars: false,
    appAccent: '#3cb45a',
  },
  // S4 — Ursula's Return : ténèbres, tentacules, palais opulent, fumée violette/cyan
  {
    id: 'set4',
    name: "Ursula's Return",
    bg: 'radial-gradient(ellipse at 50% 90%, #080318 0%, #030208 65%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 30% 50%, rgba(100,0,160,0.18) 0%, transparent 50%)',
    separator: 'rgba(180,0,220,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,0,160,0.3) 20%, rgba(200,0,240,0.6) 50%, rgba(0,160,200,0.3) 80%, transparent 100%)',
    pill: '#040212',
    pillBorder: 'rgba(160,0,200,0.3)',
    meAccent: '#c000e8',
    oppAccent: '#00c8e8',
    stars: true,
    particles: 'bubbles',
    appAccent: '#c000e8',
  },
  // S5 — Shimmering Skies : festival, feux d'artifice, ciel nocturne festif
  {
    id: 'set5',
    name: 'Shimmering Skies',
    bg: 'linear-gradient(170deg, #080520 0%, #0a0830 40%, #120530 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 20%, rgba(120,60,220,0.2) 0%, transparent 55%)',
    separator: 'rgba(255,210,60,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(255,80,160,0.35) 15%, rgba(255,210,60,0.75) 50%, rgba(80,160,255,0.35) 85%, transparent 100%)',
    pill: '#08051e',
    pillBorder: 'rgba(255,190,50,0.35)',
    meAccent: '#70c0ff',
    oppAccent: '#ff5090',
    stars: true,
    particles: 'sparks',
    appAccent: '#ffd23c',
  },
  // S6 — Azurite Sea : haute mer, pirates, bleus profonds, or nautique
  {
    id: 'set6',
    name: 'Azurite Sea',
    bg: 'linear-gradient(185deg, #020c1e 0%, #040f28 45%, #030a18 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 100%, rgba(0,50,120,0.45) 0%, transparent 55%)',
    separator: 'rgba(40,160,220,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(10,80,160,0.35) 20%, rgba(50,180,230,0.7) 50%, rgba(180,140,30,0.25) 80%, transparent 100%)',
    pill: '#030c1e',
    pillBorder: 'rgba(30,130,210,0.4)',
    meAccent: '#28a8e0',
    oppAccent: '#d4a830',
    stars: false,
    particles: 'bubbles',
    appAccent: '#28a8e0',
  },
  // S7 — Archazia's Island : mystère ancien, hibou, symboles dual-encre, jungle tropicale
  {
    id: 'set7',
    name: "Archazia's Island",
    bg: 'linear-gradient(145deg, #0e100a 0%, #121808 45%, #0a0e10 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 40%, rgba(180,130,20,0.12) 0%, transparent 50%)',
    separator: 'rgba(200,160,40,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(140,100,20,0.3) 20%, rgba(220,170,50,0.65) 50%, rgba(60,120,40,0.3) 80%, transparent 100%)',
    pill: '#0c0e08',
    pillBorder: 'rgba(170,130,30,0.35)',
    meAccent: '#d4a828',
    oppAccent: '#60a838',
    stars: false,
    appAccent: '#d4a828',
  },
  // S8 — Reign of Jafar : désert, sablier surréaliste, palais de marbre/or, torches
  {
    id: 'set8',
    name: 'Reign of Jafar',
    bg: 'radial-gradient(ellipse at 50% 20%, #1e0800 0%, #0c0400 55%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 5%, rgba(220,80,0,0.22) 0%, transparent 45%)',
    separator: 'rgba(220,100,10,0.6)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(160,50,0,0.35) 20%, rgba(240,120,10,0.7) 50%, rgba(200,170,30,0.3) 80%, transparent 100%)',
    pill: '#0f0400',
    pillBorder: 'rgba(200,80,0,0.35)',
    meAccent: '#e87010',
    oppAccent: '#d4c030',
    stars: false,
    appAccent: '#e87010',
  },
  // S9 — Fabled : Grand Illuminary, storybook classique, Mickey, dorure, nostalgie
  {
    id: 'set9',
    name: 'Fabled',
    bg: 'radial-gradient(ellipse at 50% 40%, #1e1608 0%, #120e04 60%, #0e0a02 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(220,180,60,0.1) 0%, transparent 55%)',
    separator: 'rgba(220,185,80,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(180,140,40,0.35) 20%, rgba(230,195,80,0.75) 50%, rgba(180,140,40,0.35) 80%, transparent 100%)',
    pill: '#120e04',
    pillBorder: 'rgba(210,170,60,0.4)',
    meAccent: '#e8c050',
    oppAccent: '#e07840',
    stars: true,
    appAccent: '#e8c050',
  },
  // S10 — Whispers in the Well : film noir, grotte, lumière unique, fantômes, puits mystique
  {
    id: 'set10',
    name: 'Whispers in the Well',
    bg: 'radial-gradient(ellipse at 40% 55%, #0a0614 0%, #040208 65%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 40%, rgba(60,10,100,0.2) 0%, transparent 45%)',
    separator: 'rgba(150,90,210,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(70,20,130,0.3) 15%, rgba(170,110,230,0.55) 38%, rgba(210,240,255,0.75) 50%, rgba(170,110,230,0.55) 62%, rgba(70,20,130,0.3) 85%, transparent 100%)',
    pill: '#060310',
    pillBorder: 'rgba(130,70,190,0.35)',
    meAccent: '#b070e0',
    oppAccent: '#50c8d8',
    stars: false,
    particles: 'sparks',
    appAccent: '#b070e0',
  },
  // S11 — Winterspell : hiver, flocons, cristaux de glace, Elsa, magie glacée
  {
    id: 'set11',
    name: 'Winterspell',
    bg: 'linear-gradient(165deg, #04081a 0%, #060c20 50%, #030810 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(140,200,255,0.1) 0%, transparent 55%)',
    separator: 'rgba(160,215,255,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(100,170,230,0.35) 20%, rgba(190,230,255,0.75) 50%, rgba(100,170,230,0.35) 80%, transparent 100%)',
    pill: '#040810',
    pillBorder: 'rgba(140,205,255,0.3)',
    meAccent: '#90d0f8',
    oppAccent: '#a8e8d8',
    stars: true,
    particles: 'sparks',
    appAccent: '#90d0f8',
  },
  // S12 — Wilds Unknown (set en cours) : jungle nuit, lucioles, vignes, Pixar/Disney en territoire sauvage
  {
    id: 'set12',
    name: 'Wilds Unknown',
    bg: 'linear-gradient(170deg, #020a04 0%, #04120a 30%, #061508 60%, #030e05 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 60%, rgba(20,80,10,0.35) 0%, transparent 65%)',
    separator: 'rgba(180,230,80,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,160,20,0.3) 20%, rgba(180,230,80,0.65) 50%, rgba(80,160,20,0.3) 80%, transparent 100%)',
    pill: '#030b04',
    pillBorder: 'rgba(120,200,40,0.3)',
    meAccent: '#8de84a',
    oppAccent: '#e8b84a',
    stars: false,
    appAccent: '#a4d838',
  },
  // S13 — Attack of the Vine! (set suivant, 24/07/2026) : blockbuster estival,
  // Monstres & Cie (Bouh, Mike, Sulli) contre une vigne monstrueuse — nuit urbaine envahie
  {
    id: 'set13',
    name: 'Attack of the Vine!',
    bg: 'linear-gradient(160deg, #060414 0%, #0a1224 42%, #08180c 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 110%, rgba(40,160,60,0.28) 0%, transparent 60%)',
    separator: 'rgba(90,212,74,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(40,140,60,0.35) 20%, rgba(110,230,90,0.7) 50%, rgba(80,140,230,0.3) 80%, transparent 100%)',
    pill: '#06100a',
    pillBorder: 'rgba(80,200,70,0.32)',
    meAccent: '#5ad44a',
    oppAccent: '#58a8e8',
    stars: false,
    appAccent: '#5ad44a',
  },
];

// ─── Application des variables CSS app-wide ────────────────────────────────

// Palette dorée d'origine (Codex Illuminé) — appliquée pour le thème "default"
// et déclarée en fallback dans index.css. Triplets RGB pour permettre les
// modificateurs d'opacité Tailwind (rgb(var(--x) / <alpha-value>)).
const DEFAULT_APP_VARS: Record<string, string> = {
  '--accent-300': '252 216 121',
  '--accent-400': '245 197 66',
  '--accent-500': '212 163 36',
  '--accent-600': '184 137 26',
  '--accent-700': '138 102 19',
  '--accent-ink': '42 32 8',
  '--rule-gold': 'rgba(245,197,66,0.40)',
  '--app-bg': 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(46,30,86,0.32) 0%, transparent 60%)',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(hue(h + 1 / 3) * 255), Math.round(hue(h) * 255), Math.round(hue(h - 1 / 3) * 255)];
}

// Variables CSS app-wide dérivées d'un thème. La luminosité du 400 est clampée
// pour rester lisible en texte sur fond sombre et en fond sous texte sombre.
export function appVarsForTheme(theme: Theme): Record<string, string> {
  if (theme.id === 'default') return { ...DEFAULT_APP_VARS };
  const [h, s, l] = rgbToHsl(hexToRgb(theme.appAccent));
  const base = Math.min(Math.max(l, 0.5), 0.66); // équivalent de la zone gold-400
  const rgb = (lum: number) => hslToRgb([h, s, lum]).join(' ');
  const [r4, g4, b4] = hslToRgb([h, s, base]);
  // Texte sur boutons accent : très sombre ET désaturé (comme le doré d'origine
  // #2a2008, quasi neutre) — sinon un accent saturé donne un texte criard.
  const ink = hslToRgb([h, Math.min(s, 0.3), 0.1]).join(' ');
  return {
    '--accent-300': rgb(Math.min(base + 0.12, 0.85)),
    '--accent-400': rgb(base),
    '--accent-500': rgb(base - 0.12),
    '--accent-600': rgb(base - 0.2),
    '--accent-700': rgb(base - 0.3),
    '--accent-ink': ink,
    '--rule-gold': `rgba(${r4},${g4},${b4},0.40)`,
    '--app-bg': theme.bgOverlay ? `${theme.bgOverlay}, ${theme.bg}` : theme.bg,
  };
}

export function applyThemeToRoot(theme: Theme): void {
  const vars = appVarsForTheme(theme);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
}
