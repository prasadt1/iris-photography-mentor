import { listingFromApproval } from './printListingPayload';
import type { PortfolioListItem } from '../types/memory';
import type { PendingApproval } from '../types/triage';

/** One pending card per shoot — library may contain duplicate critiques of the same upload. */
export function dedupePrintProposals(
  items: PendingApproval[],
  previews: Map<string, PortfolioListItem>,
): PendingApproval[] {
  const best = new Map<string, PendingApproval>();

  for (const item of items) {
    const entryId = listingFromApproval(item).portfolioEntryId;
    const entry = previews.get(entryId);
    const key = entry?.shootId || entryId;
    const prev = best.get(key);
    if (!prev) {
      best.set(key, item);
      continue;
    }
    const prevEntry = previews.get(listingFromApproval(prev).portfolioEntryId);
    const score = entry?.overallAverage ?? 0;
    const prevScore = prevEntry?.overallAverage ?? 0;
    if (score >= prevScore) {
      best.set(key, item);
    }
  }

  return Array.from(best.values());
}
