'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useAuth } from '@/components/auth-provider';
import { beaconGameSave, clearGuest, fetchGameSave, hasProgress, markMerged, putGameSave, readGuest, readMerged, writeGuest } from '@/lib/pages/gamesave';

export type SaveStatus = 'idle' | 'loading' | 'merge' | 'ready' | 'error';
export type MergeChoice = 'account' | 'browser';

const debounceMs = 5000;
const idOf = (uid: string | undefined) => (uid ? uid.replace(/^discord-/, '') : '');

export function useParkourSave(frameRef: RefObject<HTMLIFrameElement | null>) {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<SaveStatus>('idle');

  const userRef = useRef(user);
  const live = useRef(false);
  const id = useRef('');
  const profile = useRef('');
  const pending = useRef({ guest: '', cloud: '' });
  const latest = useRef('');
  const saved = useRef('');
  const rev = useRef(0);
  const sending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const discordId = idOf(user?.uid);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!live.current || id.current === discordId) return;
    latest.current = '';
    window.location.reload();
  }, [discordId]);

  const token = useCallback(async () => {
    try {
      return (await userRef.current?.getIdToken()) ?? '';
    } catch {
      return '';
    }
  }, []);

  const post = useCallback((message: unknown) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [frameRef]);

  const upload = useCallback(async (json: string) => {
    const key = await token();
    if (!key) return false;

    try {
      const result = await putGameSave(key, json, rev.current);
      if (result.status !== 200) return false;

      rev.current = result.rev;
      latest.current = json;
      saved.current = json;
      return true;
    } catch {
      return false;
    }
  }, [token]);

  const commit = useCallback(async () => {
    const json = latest.current;
    if (!json || json === saved.current || sending.current) return;

    if (!userRef.current) {
      writeGuest(json);
      saved.current = json;
      return;
    }

    const key = await token();
    if (!key) return;

    sending.current = true;

    try {
      const result = await putGameSave(key, json, rev.current);

      if (result.status === 200) {
        rev.current = result.rev;
        saved.current = json;
        return;
      }

      if (result.status === 409) {
        latest.current = '';
        post({ type: 'parkour-save:rejected', reason: 'conflict' });
        setTimeout(() => window.location.reload(), 600);
        return;
      }

      if (result.status === 413 || result.status === 422) post({ type: 'parkour-save:rejected', reason: 'invalid' });
    } catch {
      return;
    } finally {
      sending.current = false;
    }
  }, [post, token]);

  const onPush = useCallback((json: string) => {
    latest.current = json;
    if (timer.current) return;

    timer.current = setTimeout(() => {
      timer.current = undefined;
      void commit();
    }, debounceMs);
  }, [commit]);

  const flush = useCallback(() => {
    const json = latest.current;
    if (!json || json === saved.current) return;

    if (userRef.current) beaconGameSave(json, rev.current);
    else writeGuest(json);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;

      const data = event.data as { type?: string; json?: string } | null;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'parkour-save:request') post({ type: 'parkour-save:profile', json: profile.current });
      if (data.type === 'parkour-save:push' && typeof data.json === 'string') onPush(data.json);
    };

    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('message', onMessage);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush, frameRef, onPush, post]);

  const start = useCallback(async () => {
    setStatus('loading');
    live.current = true;
    id.current = idOf(userRef.current?.uid);

    const guest = readGuest();
    const local = hasProgress(guest);

    if (!userRef.current) {
      profile.current = guest;
      setStatus('ready');
      return;
    }

    const key = await token();
    const cloud = key ? await fetchGameSave(key).catch(() => null) : null;

    if (!cloud) {
      setStatus('error');
      return;
    }

    rev.current = cloud.rev;

    if (!local) {
      profile.current = cloud.json;
      setStatus('ready');
      return;
    }

    if (!cloud.json) {
      if (!await upload(guest)) {
        setStatus('error');
        return;
      }

      clearGuest();
      profile.current = guest;
      setStatus('ready');
      return;
    }

    if (id.current && readMerged() === id.current) {
      clearGuest();
      profile.current = cloud.json;
      setStatus('ready');
      return;
    }

    pending.current = { guest, cloud: cloud.json };
    setStatus('merge');
  }, [token, upload]);

  const choose = useCallback(async (choice: MergeChoice) => {
    const { guest, cloud } = pending.current;
    setStatus('loading');

    if (choice === 'browser') {
      if (!await upload(guest)) {
        setStatus('error');
        return;
      }

      profile.current = guest;
    } else {
      profile.current = cloud;
    }

    clearGuest();
    markMerged(id.current);
    setStatus('ready');
  }, [upload]);

  return { status, busy: loading, start, choose };
}
