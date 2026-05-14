const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function resolveMediaUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}
