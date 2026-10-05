// api-client.ts — Fetch wrapper with automatic Bearer token injection and refresh-on-401
// Access token stored in module memory; refresh token persisted to localStorage

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

// ---------- global auth-failure event ----------
// Dispatched when a request fails with 401 and token refresh also fails.
// Auth context listens to this and clears user state → triggers redirect to login.
export const AUTH_FAILURE_EVENT = 'api:auth-failure';

function dispatchAuthFailure(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
  }
}

// ---------- in-memory token store ----------
let accessToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', refresh);
  }
}

export function clearTokens(): void {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

// ---------- token refresh ----------
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json() as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ---------- core request ----------
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // On 401, attempt token refresh then retry once
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    // Refresh also failed — notify auth context to clear user state
    dispatchAuthFailure();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(errorBody.message ?? `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------- public helpers ----------
export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export async function apiUpload(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiUpload(file);
    dispatchAuthFailure();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(errorBody.message ?? `Upload failed: ${res.status}`);
  }

  return res.json() as Promise<{ url: string }>;
}
