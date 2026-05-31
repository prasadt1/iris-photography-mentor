import type { PortfolioListItem } from '../types/memory';
import { apiFetch } from '../lib/apiFetch';

export interface SimilarPhotosResponse {
  sourceId: string;
  matches: Array<PortfolioListItem & { similarityScore?: number }>;
  message?: string;
  mode?: string;
}

export interface PortfolioSearchResponse {
  query: string;
  mode?: string;
  matches: Array<PortfolioListItem & { matchedObservations?: string[] }>;
  message?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchSimilarPhotos(
  entryId: string,
  limit = 4,
): Promise<SimilarPhotosResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  return getJson(`/api/v1/portfolio/${encodeURIComponent(entryId)}/similar?${params}`);
}

export function searchPortfolioLibrary(
  query: string,
  limit = 8,
): Promise<PortfolioSearchResponse> {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
  return getJson(`/api/v1/portfolio/search?${params}`);
}
