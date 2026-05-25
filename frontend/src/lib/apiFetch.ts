/**
 * Central API fetch — attaches X-User-Id when Firebase (or explicit) scope is set.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

let scopeUserId: string | null = null;

export function setApiUserScope(userId: string | null): void {
  scopeUserId = userId;
}

export function getApiUserScope(): string | null {
  return scopeUserId;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (scopeUserId) {
    headers.set('X-User-Id', scopeUserId);
  }
  return fetch(apiUrl(path), { ...init, headers });
}
