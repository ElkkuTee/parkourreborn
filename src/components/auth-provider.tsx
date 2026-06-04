'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInAnonymously } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getClientAuth, hasFirebaseConfig } from '@/lib/firebase';
import type { DiscordProfile } from '@/lib/discord';

type AuthContextValue = {
  user: User | null;
  discord: DiscordProfile | null;
  loading: boolean;
  busy: boolean;
  error: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authMessage = (error: unknown) => {
  if (typeof error !== 'object' || !error || !('code' in error)) return 'Auth failed. Try again.';

  const code = String(error.code);
  if (code === 'auth/unauthorized-domain') return 'This domain is not allowed in Firebase Auth yet.';
  if (code === 'auth/operation-not-allowed') return 'Anonymous login is not enabled in Firebase yet.';
  if (code === 'auth/network-request-failed') return 'Network issue. Try again in a bit.';
  return 'Discord login failed. Check Firebase and Discord setup.';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [discord, setDiscord] = useState<DiscordProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadDiscord = async (nextUser: User) => {
    const token = await nextUser.getIdToken();
    const response = await fetch('/api/auth/me', {
      headers: {authorization: `Bearer ${token}`},
    });

    if (!response.ok) throw new Error('Could not load Discord profile');
    const data = await response.json() as {discord: DiscordProfile | null};
    setDiscord(data.discord);
  };

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      setError('Firebase env is missing.');
      return;
    }

    const auth = getClientAuth();
    setPersistence(auth, browserLocalPersistence).catch(() => setError('Could not save login state.'));

    return onAuthStateChanged(auth, async (nextUser) => {
      try {
        if (!nextUser) {
          const credential = await signInAnonymously(auth);
          setUser(credential.user);
          await loadDiscord(credential.user);
          return;
        }

        await loadDiscord(nextUser);
      } catch (nextError) {
        setError(authMessage(nextError));
      }

      setUser(nextUser);
      setLoading(false);
    }, (nextError) => {
      setError(authMessage(nextError));
      setLoading(false);
    });
  }, []);

  const login = async () => {
    if (!hasFirebaseConfig) {
      setError('Firebase env is missing.');
      return;
    }

    const auth = getClientAuth();
    setBusy(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const current = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const token = await current.getIdToken();
      const response = await fetch('/api/auth/discord/start', {
        method: 'POST',
        headers: {authorization: `Bearer ${token}`},
      });

      if (!response.ok) throw new Error('Could not start Discord login');

      const data = await response.json() as {url: string};
      window.location.href = data.url;
    } catch (nextError) {
      setError(authMessage(nextError));
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!hasFirebaseConfig) return;

    const current = getClientAuth().currentUser;
    if (!current) {
      setDiscord(null);
      return;
    }

    setBusy(true);
    setError('');

    try {
      const token = await current.getIdToken();
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: {authorization: `Bearer ${token}`},
      });

      if (!response.ok) throw new Error('Could not log out');
      setDiscord(null);
    } catch (nextError) {
      setError(authMessage(nextError));
    } finally {
      setBusy(false);
    }
  };

  const value = useMemo(() => ({
    user,
    discord,
    loading,
    busy,
    error,
    login,
    logout,
    clearError: () => setError(''),
  }), [busy, discord, error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
