// Living Sanatan — premium subscriptions API (Cloudflare Worker)
//
// The public site (GitHub Pages) holds no premium text. Premium era content
// lives in the CONTENT KV namespace and is only returned to readers whose
// Dodo Payments subscription is active.
//
// Routes
//   GET  /api/health                  liveness
//   GET  /api/config                  public plan list for the paywall
//   POST /api/checkout  {plan,email?} -> {checkout_url}
//   POST /api/claim     {claim}       -> {token, account} | 202 pending
//   POST /api/login     {email}       -> {ok}  (emails a sign-in link)
//   POST /api/login/verify {token}    -> {token, account}
//   GET  /api/me                      -> {account, token?}   (Bearer)
//   GET  /api/era/:id                 -> {layers, secs}      (Bearer)
//   POST /api/portal                  -> {link}              (Bearer)
//   POST /api/webhook                 Dodo Payments webhooks

import { dodo } from './dodo.js';
import { randomToken, sha256, signToken, verifyToken, verifyStandardWebhook } from './crypto.js';

const ACTIVE = new Set(['active']);
const TOKEN_TTL_SEC = 30 * 24 * 3600; // rolling; refreshed by /api/me
const TOKEN_REFRESH_AFTER_SEC = 7 * 24 * 3600;
const SUB_RECHECK_MS = 6 * 3600 * 1000; // re-verify with Dodo if no webhook for 6h
const CLAIM_TTL_SEC = 2 * 24 * 3600;
const CLAIM_MAX_USES = 3;
const MAGIC_TTL_SEC = 20 * 60;

// ── HTTP helpers ──────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

function json(req, env, data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...corsHeaders(req, env),
      ...extra,
    },
  });
}

async function readJson(req) {
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > 10_000) throw new HttpError(413, 'Request too large');
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

function clientIp(req) {
  return req.headers.get('CF-Connecting-IP') || 'unknown';
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
function normEmail(e) {
  const s = String(e || '').trim().toLowerCase();
  return EMAIL_RE.test(s) && s.length <= 254 ? s : null;
}

// Best-effort fixed-window rate limit on KV. KV is eventually consistent,
// so this bounds abuse rather than enforcing exact counts.
async function rateLimit(env, bucket, key, limit, windowSec) {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const k = `rl:${bucket}:${await sha256(key)}:${win}`;
  const n = Number((await env.STATE.get(k)) || 0);
  if (n >= limit) throw new HttpError(429, 'Too many requests. Please wait a few minutes and try again.');
  await env.STATE.put(k, String(n + 1), { expirationTtl: Math.max(60, windowSec * 2) });
}

// ── Config ────────────────────────────────────────────────────────────

function plans(env) {
  let list;
  try {
    list = JSON.parse(env.PLANS || '[]');
  } catch {
    throw new Error('PLANS is not valid JSON');
  }
  return list.filter((p) => p && p.id && p.product_id);
}

function allowedProducts(env) {
  return new Set(plans(env).map((p) => p.product_id));
}

function siteUrl(env, params = {}) {
  const u = new URL(env.SITE_URL);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

// ── Subscription records ──────────────────────────────────────────────

function toRecord(sub) {
  return {
    sid: sub.subscription_id,
    cid: sub.customer?.customer_id,
    email: normEmail(sub.customer?.email),
    status: sub.status,
    product_id: sub.product_id,
    next_billing_date: sub.next_billing_date || null,
    cancel_at_next_billing_date: !!sub.cancel_at_next_billing_date,
    checked_at: Date.now(),
  };
}

async function saveSub(env, rec) {
  await env.STATE.put(`sub:${rec.sid}`, JSON.stringify(rec));
  if (rec.email && ACTIVE.has(rec.status)) await env.STATE.put(`email:${rec.email}`, rec.sid);
  return rec;
}

async function refreshSub(env, sid) {
  return saveSub(env, toRecord(await dodo(env).getSubscription(sid)));
}

async function getSub(env, sid, { fresh = false } = {}) {
  const cached = await env.STATE.get(`sub:${sid}`, 'json');
  if (cached && !fresh && Date.now() - cached.checked_at < SUB_RECHECK_MS) return cached;
  try {
    return await refreshSub(env, sid);
  } catch (err) {
    if (cached) return cached; // Dodo unreachable: fall back to the last known state
    throw err;
  }
}

function isEntitled(env, rec) {
  return !!rec && ACTIVE.has(rec.status) && allowedProducts(env).has(rec.product_id);
}

function account(rec) {
  return {
    email: rec.email,
    status: rec.status,
    active: ACTIVE.has(rec.status),
    next_billing_date: rec.next_billing_date,
    cancel_at_next_billing_date: rec.cancel_at_next_billing_date,
  };
}

async function issueToken(env, rec) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ sid: rec.sid, cid: rec.cid, iat: now, exp: now + TOKEN_TTL_SEC }, env.SESSION_SECRET);
}

async function requireReader(req, env) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token && (await verifyToken(token, env.SESSION_SECRET));
  if (!payload) throw new HttpError(401, 'Please sign in again.');
  const rec = await getSub(env, payload.sid);
  return { payload, rec };
}

// Find an active, allowed subscription for an email address.
async function findSubByEmail(env, email) {
  const sid = await env.STATE.get(`email:${email}`);
  if (sid) {
    const rec = await getSub(env, sid).catch(() => null);
    if (isEntitled(env, rec)) return rec;
  }
  const api = dodo(env);
  const customers = (await api.listCustomers({ email, page_size: 10 }))?.items || [];
  for (const c of customers) {
    if (normEmail(c.email) !== email) continue;
    const subs = (await api.listSubscriptions({ customer_id: c.customer_id, status: 'active', page_size: 20 }))?.items || [];
    for (const s of subs) {
      const rec = toRecord(s);
      if (isEntitled(env, rec)) return saveSub(env, rec);
    }
  }
  return null;
}

// ── Email (Resend) ────────────────────────────────────────────────────

async function sendSignInEmail(env, to, link) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set; sign-in link not emailed');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: 'Your sign-in link for The Living Sanatan Timeline',
      text: `Open this link to unlock your subscription on this device:\n\n${link}\n\nThe link works once and expires in 20 minutes. If you did not ask for it, ignore this email.`,
      html: `<p>Open this link to unlock your subscription on this device:</p><p><a href="${link}">Sign in to The Living Sanatan Timeline</a></p><p style="color:#777">The link works once and expires in 20 minutes. If you did not ask for it, ignore this email.</p>`,
    }),
  });
  if (!res.ok) console.error('Resend error', res.status, (await res.text()).slice(0, 300));
}

// ── Route handlers ────────────────────────────────────────────────────

async function handleConfig(req, env) {
  return json(req, env, {
    plans: plans(env).map(({ id, label, price, note }) => ({ id, label, price, note })),
  }, 200, { 'Cache-Control': 'public, max-age=300' });
}

async function handleCheckout(req, env) {
  await rateLimit(env, 'checkout', clientIp(req), 10, 60);
  const body = await readJson(req);
  const plan = plans(env).find((p) => p.id === body.plan) || plans(env)[0];
  if (!plan) throw new HttpError(503, 'Subscriptions are not configured yet.');
  const email = body.email ? normEmail(body.email) : null;
  if (body.email && !email) throw new HttpError(400, 'Please enter a valid email address.');

  const claim = randomToken(24);
  const session = await dodo(env).createCheckout({
    product_cart: [{ product_id: plan.product_id, quantity: 1 }],
    ...(email ? { customer: { email } } : {}),
    return_url: siteUrl(env, { claim }),
    metadata: { claim_hash: (await sha256(claim)).slice(0, 32), plan: plan.id },
  });
  if (!session?.checkout_url) throw new HttpError(502, 'Payment provider did not return a checkout link.');

  await env.STATE.put(`claim:${await sha256(claim)}`, JSON.stringify({ session_id: session.session_id, uses: 0 }), {
    expirationTtl: CLAIM_TTL_SEC,
  });
  return json(req, env, { checkout_url: session.checkout_url });
}

async function handleClaim(req, env) {
  await rateLimit(env, 'claim', clientIp(req), 30, 60);
  const { claim } = await readJson(req);
  if (typeof claim !== 'string' || claim.length < 20 || claim.length > 100) throw new HttpError(400, 'Invalid claim');
  const key = `claim:${await sha256(claim)}`;
  const record = await env.STATE.get(key, 'json');
  if (!record) throw new HttpError(404, 'This checkout link has expired. Use "Restore access" with your email.');
  if (record.uses >= CLAIM_MAX_USES) throw new HttpError(410, 'This checkout link was already used. Use "Restore access" with your email.');

  const api = dodo(env);
  const checkout = await api.getCheckout(record.session_id);
  if (!checkout?.payment_id || checkout.payment_status !== 'succeeded') {
    return json(req, env, { pending: true, payment_status: checkout?.payment_status || null }, 202);
  }
  const payment = await api.getPayment(checkout.payment_id);
  const sid = payment.subscription_id || (payment.subscription_ids || [])[0];
  if (!sid) return json(req, env, { pending: true }, 202);

  const rec = await refreshSub(env, sid);
  if (!isEntitled(env, rec)) return json(req, env, { pending: true, status: rec.status }, 202);

  await env.STATE.put(key, JSON.stringify({ ...record, uses: record.uses + 1 }), { expirationTtl: CLAIM_TTL_SEC });
  return json(req, env, { token: await issueToken(env, rec), account: account(rec) });
}

async function handleLogin(req, env) {
  const body = await readJson(req);
  const email = normEmail(body.email);
  if (!email) throw new HttpError(400, 'Please enter a valid email address.');
  await rateLimit(env, 'login-ip', clientIp(req), 10, 600);
  await rateLimit(env, 'login-email', email, 3, 600);

  // Always answer the same way so the endpoint does not reveal who subscribes.
  const rec = await findSubByEmail(env, email).catch((e) => (console.error(e), null));
  if (rec) {
    const token = randomToken(32);
    await env.STATE.put(`magic:${await sha256(token)}`, JSON.stringify({ sid: rec.sid }), { expirationTtl: MAGIC_TTL_SEC });
    await sendSignInEmail(env, email, siteUrl(env, { login: token }));
  }
  return json(req, env, { ok: true });
}

async function handleLoginVerify(req, env) {
  await rateLimit(env, 'verify', clientIp(req), 30, 600);
  const { token } = await readJson(req);
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) throw new HttpError(400, 'Invalid link');
  const key = `magic:${await sha256(token)}`;
  const data = await env.STATE.get(key, 'json');
  if (!data) throw new HttpError(410, 'This sign-in link has expired or was already used. Request a new one.');
  await env.STATE.delete(key);
  const rec = await getSub(env, data.sid, { fresh: true });
  if (!isEntitled(env, rec)) throw new HttpError(402, 'Your subscription is not active.');
  return json(req, env, { token: await issueToken(env, rec), account: account(rec) });
}

async function handleMe(req, env) {
  const { payload, rec } = await requireReader(req, env);
  const out = { account: account(rec), entitled: isEntitled(env, rec) };
  if (out.entitled && Date.now() / 1000 - payload.iat > TOKEN_REFRESH_AFTER_SEC) out.token = await issueToken(env, rec);
  return json(req, env, out);
}

async function handleEra(req, env, id) {
  if (!/^[a-z0-9_-]{1,40}$/.test(id)) throw new HttpError(400, 'Invalid era');
  const { rec } = await requireReader(req, env);
  if (!isEntitled(env, rec)) throw new HttpError(402, 'Your subscription is not active.');
  const content = await env.CONTENT.get(`era:${id}`);
  if (!content) throw new HttpError(404, 'No premium content for this era.');
  return new Response(content, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, noai',
      ...corsHeaders(req, env),
    },
  });
}

async function handlePortal(req, env) {
  const { rec } = await requireReader(req, env);
  if (!rec.cid) throw new HttpError(404, 'No billing account found.');
  const session = await dodo(env).portalSession(rec.cid, env.SITE_URL);
  return json(req, env, { link: session.link });
}

async function handleWebhook(req, env) {
  const raw = await req.text();
  if (raw.length > 1_000_000) throw new HttpError(413, 'Payload too large');
  if (!(await verifyStandardWebhook(raw, req.headers, env.DODO_WEBHOOK_SECRET))) {
    throw new HttpError(401, 'Invalid signature');
  }
  const id = req.headers.get('webhook-id');
  if (await env.STATE.get(`wh:${id}`)) return json(req, env, { ok: true, duplicate: true });

  const event = JSON.parse(raw);
  const data = event.data || {};
  const sid = data.subscription_id;
  if (sid && (event.type?.startsWith('subscription.') || event.type === 'payment.succeeded')) {
    try {
      await refreshSub(env, sid); // always store the latest state, whatever order events arrive in
    } catch (err) {
      if (!event.type.startsWith('subscription.') || !data.customer) throw err; // let Dodo retry
      await saveSub(env, toRecord(data));
    }
  }
  await env.STATE.put(`wh:${id}`, '1', { expirationTtl: 3 * 24 * 3600 });
  return json(req, env, { ok: true });
}

// ── Router ────────────────────────────────────────────────────────────

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { pathname } = url;
    const m = req.method;

    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });

    try {
      if (m === 'GET' && pathname === '/api/health') return json(req, env, { ok: true });
      if (m === 'GET' && pathname === '/api/config') return await handleConfig(req, env);
      if (m === 'POST' && pathname === '/api/checkout') return await handleCheckout(req, env);
      if (m === 'POST' && pathname === '/api/claim') return await handleClaim(req, env);
      if (m === 'POST' && pathname === '/api/login') return await handleLogin(req, env);
      if (m === 'POST' && pathname === '/api/login/verify') return await handleLoginVerify(req, env);
      if (m === 'GET' && pathname === '/api/me') return await handleMe(req, env);
      if (m === 'POST' && pathname === '/api/portal') return await handlePortal(req, env);
      if (m === 'POST' && pathname === '/api/webhook') return await handleWebhook(req, env);
      const era = pathname.match(/^\/api\/era\/([^/]+)$/);
      if (m === 'GET' && era) return await handleEra(req, env, decodeURIComponent(era[1]));
      return json(req, env, { error: 'Not found' }, 404);
    } catch (err) {
      if (err instanceof HttpError) return json(req, env, { error: err.message }, err.status);
      console.error(err && err.stack ? err.stack : err);
      return json(req, env, { error: 'Something went wrong. Please try again.' }, 500);
    }
  },
};
