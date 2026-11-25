export function getAllowedOrigins(raw = Deno.env.get('ALLOWED_ORIGINS') ?? ''): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '';
  const allowed = getAllowedOrigins();
  const isAllowed =
    allowed.length === 0
      ? false
      : allowed.includes('*') || (origin !== '' && allowed.includes(origin));

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, idempotency-key, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = allowed.includes('*') ? '*' : origin;
  }

  return headers;
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(req),
    });
  }
  return null;
}
