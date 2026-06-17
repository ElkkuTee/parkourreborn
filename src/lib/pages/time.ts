export function parseTime(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (!value) return null;

  const clean = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{0,3})?$/.test(clean)) return null;

  const seconds = Number(clean);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function formatTime(value: string | number | null | undefined): string {
  const seconds = parseTime(value);
  if (seconds === null) return 'N/A';
  return seconds.toFixed(3);
}

export function cleanTimeInput(value: string): string {
  const seconds = parseTime(value);
  return seconds === null ? value.trim() : seconds.toFixed(3);
}
