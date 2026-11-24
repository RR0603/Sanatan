// Small Web Crypto helpers: access tokens, Standard Webhooks verification,
// random ids and hashing. No dependencies; runs in Workers and Node >= 20.

const enc = new TextEncoder();

export function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromB64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function fromB64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(text) {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));
}

async function hmacKey(raw) {
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function hmac(raw, data) {
  return new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(raw), enc.encode(data)));
}

// Constant-time comparison of two byte arrays.
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Access tokens ─────────────────────────────────────────────────────
// Format: v1.<base64url(JSON payload)>.<base64url(HMAC-SHA256)>
// The token proves which subscription the reader holds. Whether that
// subscription is still active is checked on every request, so cancelling
// revokes access without needing to revoke tokens.

export async function signToken(payload, secret) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(enc.encode(secret), 'v1.' + body));
  return `v1.${body}.${sig}`;
}

export async function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  let expected, given, payload;
  try {
    expected = await hmac(enc.encode(secret), 'v1.' + parts[1]);
    given = fromB64url(parts[2]);
    payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
  } catch {
    return null;
  }
  if (!safeEqual(expected, given)) return null;
  if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 < now) return null;
  return payload;
}

// ── Standard Webhooks (https://www.standardwebhooks.com) ──────────────
// Dodo Payments signs webhooks with this scheme: headers webhook-id,
// webhook-timestamp and webhook-signature ("v1,<base64>" entries separated
// by spaces), HMAC-SHA256 over "<id>.<timestamp>.<raw body>" keyed with the
// base64-decoded secret (after the "whsec_" prefix).

export async function verifyStandardWebhook(rawBody, headers, secret, now = Date.now(), toleranceSec = 300) {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigHeader = headers.get('webhook-signature');
  if (!id || !ts || !sigHeader || !secret) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now / 1000 - tsNum) > toleranceSec) return false;

  let key;
  try {
    key = fromB64(secret.startsWith('whsec_') ? secret.slice(6) : secret);
  } catch {
    return false;
  }
  const expected = await hmac(key, `${id}.${ts}.${rawBody}`);

  for (const part of sigHeader.split(' ')) {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) continue;
    let given;
    try {
      given = fromB64(sig);
    } catch {
      continue;
    }
    if (safeEqual(expected, given)) return true;
  }
  return false;
}

// Exposed for tests: produce a valid signature header.
export async function signStandardWebhook(id, ts, rawBody, secret) {
  const key = fromB64(secret.startsWith('whsec_') ? secret.slice(6) : secret);
  const sig = await hmac(key, `${id}.${ts}.${rawBody}`);
  let s = '';
  for (const b of sig) s += String.fromCharCode(b);
  return 'v1,' + btoa(s);
}
