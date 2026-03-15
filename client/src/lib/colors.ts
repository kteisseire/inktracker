import type { InkColor } from '@lorcana/shared';

export const INK_COLORS_CONFIG: Record<InkColor, { hex: string; label: string; bg: string; text: string }> = {
  AMBER:    { hex: '#F5A623', label: 'Ambre',      bg: 'bg-amber-400',    text: 'text-amber-900' },
  AMETHYST: { hex: '#9B59B6', label: 'Améthyste',  bg: 'bg-purple-500',   text: 'text-white' },
  EMERALD:  { hex: '#27AE60', label: 'Émeraude',   bg: 'bg-emerald-500',  text: 'text-white' },
  RUBY:     { hex: '#E74C3C', label: 'Rubis',       bg: 'bg-red-500',      text: 'text-white' },
  SAPPHIRE: { hex: '#3498DB', label: 'Saphir',      bg: 'bg-blue-500',     text: 'text-white' },
  STEEL:    { hex: '#7F8C8D', label: 'Acier',       bg: 'bg-gray-500',     text: 'text-white' },
};

export function getDeckLabel(colors: InkColor[]): string {
  return colors.map(c => INK_COLORS_CONFIG[c].label).join(' / ');
}
