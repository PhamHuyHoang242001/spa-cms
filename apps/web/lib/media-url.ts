const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

export function resolveMediaUrl(url: string): string {
  const value = url.trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (isLocalUploadUrl(parsed)) {
      return joinApiBase(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    }
    return value;
  } catch {
    // Relative URLs are handled below.
  }

  if (value.startsWith('/uploads/')) {
    return joinApiBase(value);
  }

  return value;
}

export function rewriteMediaUrlsInHtml(html: string): string {
  return html.replace(/\bsrc=(["'])([^"']+)\1/g, (_match, quote: string, src: string) => {
    return `src=${quote}${resolveMediaUrl(src)}${quote}`;
  });
}

function joinApiBase(path: string): string {
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

function isLocalUploadUrl(url: URL): boolean {
  return url.pathname.startsWith('/uploads/') && isLocalTunnelHost(url.hostname);
}

function isLocalTunnelHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.loca.lt') ||
    hostname.endsWith('.ngrok-free.app')
  );
}
