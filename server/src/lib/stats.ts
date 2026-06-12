/** Win rate as a percentage rounded to one decimal place (0 when no games played). */
export function calculateWinRate(wins: number, total: number): number {
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
}
