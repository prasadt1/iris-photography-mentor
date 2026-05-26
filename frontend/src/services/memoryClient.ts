/**
 * Memory tab — portfolio + aesthetic profile from Coach API.
 */

import type {
  AestheticProfileSummary,
  PortfolioListResponse,
  PortfolioTrendsResponse,
} from '../types/memory';
import { apiFetch } from '../lib/apiFetch';

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPortfolio(limit = 48): Promise<PortfolioListResponse> {
  return getJson(`/api/v1/portfolio?limit=${limit}`);
}

export function fetchAestheticProfile(): Promise<AestheticProfileSummary> {
  return getJson('/api/v1/aesthetic-profile');
}

export function fetchPortfolioTrends(limit = 12): Promise<PortfolioTrendsResponse> {
  return getJson(`/api/v1/portfolio/trends?limit=${limit}`);
}
