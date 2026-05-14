'use client';

// auth-context.tsx — React context providing auth state and actions (login, register, logout)
// On mount: attempts session restore via refresh token stored in localStorage

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AUTH_FAILURE_EVENT,
  apiGet,
  apiPost,
  clearTokens,
  getAccessToken,
  setTokens,
} from './api-client';
import type { LoginInput, RegisterInput } from '@spa/shared';

// ---------- types ----------
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  locale: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------- context ----------
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------- provider ----------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for global auth-failure events (access + refresh both expired mid-session).
  // Clears user state so the admin layout's useEffect can redirect to login.
  useEffect(() => {
    const handleAuthFailure = () => {
      clearTokens();
      setUser(null);
    };
    window.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    return () => window.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
  }, []);

  // Restore session on mount using stored refresh token
  useEffect(() => {
    const storedRefresh =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (!storedRefresh) {
      window.setTimeout(() => setIsLoading(false), 0);
      return;
    }

    // Attempt silent token refresh then fetch current user
    apiPost<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken: storedRefresh },
    )
      .then(({ accessToken, refreshToken }) => {
        setTokens(accessToken, refreshToken);
        return apiGet<{ user: User }>('/auth/me');
      })
      .then(({ user }) => setUser(user))
      .catch((err: unknown) => {
        // Only clear tokens on auth errors (401); keep session on transient server errors
        const isAuthError = err instanceof Error && (err.message === 'Unauthorized' || err.message.includes('401'));
        if (isAuthError || !(err instanceof Error)) clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await apiPost<AuthResponse>('/auth/login', input);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiPost<AuthResponse>('/auth/register', input);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (refresh && getAccessToken()) {
      // Best-effort — ignore errors
      await apiPost('/auth/logout', { refreshToken: refresh }).catch(() => {});
    }

    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- hook ----------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
