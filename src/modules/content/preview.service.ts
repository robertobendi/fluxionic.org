import crypto from 'crypto';

/**
 * Short-lived, HMAC-signed preview tokens. Scoped to a single entry ID.
 * Format: base64url(payload).base64url(signature)
 * Payload: { e: entryId, x: expiresAt (seconds since epoch) }
 */

const DEFAULT_TTL_SECONDS = 3600; // 1h

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error('BETTER_AUTH_SECRET is required for preview tokens');
  return s;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64urlEncode(
    crypto.createHmac('sha256', secret()).update(payload).digest()
  );
}

export function issuePreviewToken(
  entryId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): { token: string; expiresAt: string } {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = b64urlEncode(Buffer.from(JSON.stringify({ e: entryId, x: expiresAt }), 'utf8'));
  const signature = sign(payload);
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

export function verifyPreviewToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(b64urlDecode(payload).toString('utf8')) as { e?: string; x?: number };
    if (typeof data.e !== 'string' || typeof data.x !== 'number') return null;
    if (data.x * 1000 < Date.now()) return null;
    return data.e;
  } catch {
    return null;
  }
}
