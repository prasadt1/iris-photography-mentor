import type { PortfolioListItem } from '../types/memory';

const TIE_EPSILON = 0.4;

/**
 * Pick a home hero frame from the user's library.
 * Score is primary; composition heuristics break ties only (within TIE_EPSILON).
 */
export function pickHomeHeroPhoto(
  strongest: PortfolioListItem | null,
  candidates: PortfolioListItem[],
): PortfolioListItem | null {
  const pool = candidates.filter((e) => e.imageUrl && e.overallAverage > 0);
  if (pool.length === 0) return strongest;

  const heuristicBonus = (p: PortfolioListItem): number => {
    let bonus = 0;
    const tags = p.aestheticTags.map((t) => t.toLowerCase());
    const desc = (p.sceneDescription ?? '').toLowerCase();

    if (tags.some((t) => ['golden_hour', 'sunset', 'tropical_sunset', 'backlit'].includes(t))) {
      bonus += 2;
    }
    if (tags.includes('landscape') && !desc.includes('vertical')) bonus += 1;
    if (desc.includes('wide-angle') || desc.includes('wide angle')) bonus += 1;
    if (desc.includes('glacier')) bonus -= 4;
    if (/\bvertical\b/.test(desc) && /\b(photograph|landscape|portrait)\b/.test(desc)) bonus -= 2;

    return bonus;
  };

  const best = [...pool].sort((a, b) => {
    const scoreDiff = b.overallAverage - a.overallAverage;
    if (Math.abs(scoreDiff) > TIE_EPSILON) return scoreDiff;
    return heuristicBonus(b) - heuristicBonus(a);
  })[0];

  return best ?? strongest;
}
