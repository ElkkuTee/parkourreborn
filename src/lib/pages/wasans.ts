type WasansInput = {playerTime: number; bronzeTime: number; platinumTime: number; worldRecordTime: number;};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateWasansScore({ playerTime, bronzeTime, platinumTime, worldRecordTime }: WasansInput): number | null {
  if (![playerTime, bronzeTime, platinumTime, worldRecordTime].every(Number.isFinite)) return null;
  if (bronzeTime <= platinumTime || platinumTime <= worldRecordTime) return null;
  if (playerTime >= bronzeTime) return 0;
  if (playerTime <= worldRecordTime) return 1;

  if (playerTime >= platinumTime) {
    const progress = (bronzeTime - playerTime) / (bronzeTime - platinumTime);
    return clamp(progress * 0.3, 0, 0.3);
  }

  const wrPlatRatio = Math.pow(worldRecordTime / platinumTime, 3);
  const wrPlayerRatio = Math.pow(worldRecordTime / playerTime, 3);
  const progress = (wrPlayerRatio - wrPlatRatio) / (1 - wrPlatRatio);
  return clamp(0.3 + progress * 0.7, 0.3, 1);
}

export function formatWasansScore(score: number | null): string {
  return score === null ? 'N/A' : score.toFixed(3);
}
