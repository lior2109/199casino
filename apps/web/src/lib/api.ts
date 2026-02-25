const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('betpro_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': 'default',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'API Error');
  }

  return data as T;
}

export function setToken(token: string) {
  localStorage.setItem('betpro_token', token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem('betpro_refresh_token', token);
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('betpro_token') : null;
}

export function clearTokens() {
  localStorage.removeItem('betpro_token');
  localStorage.removeItem('betpro_refresh_token');
}
