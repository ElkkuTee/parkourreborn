'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
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
  if (code === 'auth/operation-not-allowed') return 'Firebase login is not enabled yet.';
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
      headers: { authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Could not load Discord profile');
    const data = await response.json() as { discord: DiscordProfile | null };
    setDiscord(data.discord);
  };

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      setError('Firebase env is missing.');
      return;
    }

    const auth = getClientAuth();
    let active = true;
    let stop = () => {};

    const watchAuth = () => {
      stop = onAuthStateChanged(auth, async (nextUser) => {
        try {
          if (nextUser?.isAnonymous) {
            await signOut(auth);
            setUser(null);
            setDiscord(null);
            return;
          }

          setUser(nextUser);

          if (nextUser) await loadDiscord(nextUser);
          else setDiscord(null);
        } catch (nextError) {
          setError(authMessage(nextError));
        } finally {
          setLoading(false);
        }
      }, (nextError) => {
        setError(authMessage(nextError));
        setLoading(false);
      });
    };

    const boot = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        const response = await fetch('/api/auth/discord/session', { method: 'POST' });
        if (response.ok) {
          const data = await response.json() as { token: string | null };
          if (data.token) await signInWithCustomToken(auth, data.token);
        }
      } catch (nextError) {
        setError(authMessage(nextError));
      } finally {
        if (active) watchAuth();
      }
    };

    boot();

    return () => {
      active = false;
      stop();
    };
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
      const response = await fetch('/api/auth/discord/start', { method: 'POST' });

      if (!response.ok) throw new Error('Could not start Discord login');

      const data = await response.json() as { url: string };
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
      await signOut(getClientAuth());
      setUser(null);
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
