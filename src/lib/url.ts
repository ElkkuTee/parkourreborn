export function cleanUrl(value: unknown) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : '';
  } catch {
    return '';
  }
}

export function cleanPathPart(value: unknown) {
  const part = String(value ?? '').trim();
  return /^[a-zA-Z0-9_-]+$/.test(part) ? part : '';
}
