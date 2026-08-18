export const GUEST_KEY = 'parkour:save:guest';
export const MERGED_KEY = 'parkour:save:merged';

export type CloudSave = {
  json: string;
  rev: number;
};

export type PutResult = {
  status: number;
  rev: number;
  json: string;
};

const store = () => (typeof window === 'undefined' ? null : window.localStorage);
const text = (value: unknown) => (value === undefined || value === null ? '' : JSON.stringify(value));

export function readGuest() {
  try {
    return store()?.getItem(GUEST_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeGuest(json: string) {
  try {
    store()?.setItem(GUEST_KEY, json);
  } catch {
    return;
  }
}

export function clearGuest() {
  try {
    store()?.removeItem(GUEST_KEY);
  } catch {
    return;
  }
}

export function readMerged() {
  try {
    return store()?.getItem(MERGED_KEY) ?? '';
  } catch {
    return '';
  }
}

export function markMerged(discordId: string) {
  try {
    store()?.setItem(MERGED_KEY, discordId);
  } catch {
    return;
  }
}

export function hasProgress(json: string) {
  if (!json) return false;

  try {
    const save = JSON.parse(json) as { credits?: { lifetimeEarned?: unknown } };
    return Number(save?.credits?.lifetimeEarned) > 0;
  } catch {
    return false;
  }
}

export async function fetchGameSave(token: string): Promise<CloudSave | null> {
  const response = await fetch('/api/game/save', {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) return null;

  const data = await response.json() as { save?: unknown; rev?: number };
  return { json: text(data.save), rev: Number(data.rev ?? 0) };
}

export async function putGameSave(token: string, json: string, baseRev: number): Promise<PutResult> {
  const response = await fetch('/api/game/save', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: `{"save":${json},"baseRev":${baseRev}}`,
  });

  const data = await response.json().catch(() => null) as { rev?: number; save?: unknown } | null;
  return { status: response.status, rev: Number(data?.rev ?? 0), json: text(data?.save) };
}

export function beaconGameSave(json: string, rev: number) {
  try {
    return navigator.sendBeacon(`/api/game/save/beacon?rev=${rev}`, json);
  } catch {
    return false;
  }
}
