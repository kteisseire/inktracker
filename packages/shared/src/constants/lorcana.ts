export const INK_COLORS = [
  'AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL'
] as const;

export type InkColor = typeof INK_COLORS[number];

export const DECK_COMBINATIONS: [InkColor, InkColor][] = [
  ['AMBER', 'AMETHYST'], ['AMBER', 'EMERALD'], ['AMBER', 'RUBY'],
  ['AMBER', 'SAPPHIRE'], ['AMBER', 'STEEL'],
  ['AMETHYST', 'EMERALD'], ['AMETHYST', 'RUBY'],
  ['AMETHYST', 'SAPPHIRE'], ['AMETHYST', 'STEEL'],
  ['EMERALD', 'RUBY'], ['EMERALD', 'SAPPHIRE'], ['EMERALD', 'STEEL'],
  ['RUBY', 'SAPPHIRE'], ['RUBY', 'STEEL'],
  ['SAPPHIRE', 'STEEL'],
];

export const INK_COLOR_DISPLAY: Record<InkColor, { hex: string; label: string }> = {
  AMBER:    { hex: '#F5A623', label: 'Ambre' },
  AMETHYST: { hex: '#9B59B6', label: 'Améthyste' },
  EMERALD:  { hex: '#27AE60', label: 'Émeraude' },
  RUBY:     { hex: '#E74C3C', label: 'Rubis' },
  SAPPHIRE: { hex: '#3498DB', label: 'Saphir' },
  STEEL:    { hex: '#7F8C8D', label: 'Acier' },
};

export const TOP_CUT_OPTIONS = ['NONE', 'TOP4', 'TOP8', 'TOP16', 'TOP32'] as const;
export type TopCut = typeof TOP_CUT_OPTIONS[number];

export const FORMAT_OPTIONS = ['BO1', 'BO3', 'BO5'] as const;
export type Format = typeof FORMAT_OPTIONS[number];

export const MATCH_RESULTS = ['WIN', 'LOSS', 'DRAW'] as const;
export type MatchResult = typeof MATCH_RESULTS[number];

/**
 * Nombre de rondes suisses recommandé selon les règles officielles
 * Disney Lorcana TCG Tournament Rules (Section 3.2)
 * Valeurs pour Core Constructed
 */
export function getRecommendedSwissRounds(playerCount: number): number {
  if (playerCount <= 8) return 3;
  if (playerCount <= 16) return 5;
  if (playerCount <= 32) return 5;
  if (playerCount <= 64) return 6;
  if (playerCount <= 128) return 7;
  if (playerCount <= 226) return 8;
  return 9;
}

/**
 * Top cut recommandé selon les règles officielles
 * Disney Lorcana TCG Tournament Rules (Section 3.2)
 * 8 joueurs : pas de playoff
 * 9-16 : Top 4 (Core Constructed)
 * 17+ : Top 8
 */
export function getRecommendedTopCut(playerCount: number): TopCut {
  if (playerCount <= 8) return 'NONE';
  if (playerCount <= 16) return 'TOP4';
  return 'TOP8';
}
