export type CloudSave = {
  json: string;
  rev: number;
};

export type PutResult = {
  status: number;
  rev: number;
  json: string;
};

const text = (value: unknown) => (value === undefined || value === null ? '' : JSON.stringify(value));

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
