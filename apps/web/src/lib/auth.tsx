'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setState({ user: data.user, loading: false, error: null });
      } else if (res.status === 401) {
        setState({ user: null, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: 'Failed to load user' });
      }
    } catch {
      setState({ user: null, loading: false, error: 'Network error' });
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false, error: data.error ?? 'Login failed' }));
        throw new Error(data.error ?? 'Login failed');
      }

      setState({ user: data.user, loading: false, error: null });
    } catch (err) {
      if (!state.error) {
        setState((prev) => ({ ...prev, loading: false, error: 'Network error' }));
      }
      throw err;
    }
  };

  const register = async (email: string, name: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false, error: data.error ?? 'Registration failed' }));
        throw new Error(data.error ?? 'Registration failed');
      }

      setState({ user: data.user, loading: false, error: null });
    } catch (err) {
      if (!state.error) {
        setState((prev) => ({ ...prev, loading: false, error: 'Network error' }));
      }
      throw err;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setState({ user: null, loading: false, error: null });
    }
  };

  const refresh = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}