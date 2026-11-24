import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { signStandardWebhook, signToken, verifyToken } from '../src/crypto.js';

// ── Fakes ─────────────────────────────────────────────────────────────

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k, type) {
    const v = this.m.get(k);
    if (v === undefined) return null;
    return type === 'json' ? JSON.parse(v) : v;
  }
  async put(k, v) { this.m.set(k, String(v)); }
  async delete(k) { this.m.delete(k); }
}

const WH_SECRET = 'whsec_' + Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
const ORIGIN = 'https://rr0603.github.io';

let env, dodoState, sentEmails;

beforeEach(() => {
  sentEmails = [];
  dodoState = {
    checkout: { id: 'cks_1', payment_id: null, payment_status: null },
    payment: { payment_id: 'pay_1', subscription_id: 'sub_1', subscription_ids: ['sub_1'] },
    sub: {
      subscription_id: 'sub_1', status: 'active', product_id: 'pdt_month',
      customer: { customer_id: 'cus_1', email: 'Reader@Example.com', name: 'R' },
      next_billing_date: '2026-12-24T00:00:00Z', cancel_at_next_billing_date: false,
    },
    lastCheckoutBody: null,
  };
  env = {
    STATE: new FakeKV(),
    CONTENT: new FakeKV(),
    DODO_ENV: 'test_mode',
    DODO_API_KEY: 'test_key',
    DODO_WEBHOOK_SECRET: WH_SECRET,
    SESSION_SECRET: 'x'.repeat(40),
    RESEND_API_KEY: 're_test',
    EMAIL_FROM: 'Test <a@b.c>',
    SITE_URL: 'https://rr0603.github.io/Sanatan/',
    ALLOWED_ORIGINS: ORIGIN,
    PLANS: JSON.stringify([{ id: 'monthly', product_id: 'pdt_month', label: 'Monthly', price: '₹1' }]),
  };
  env.CONTENT.put('era:kurma', JSON.stringify({ layers: { meta: 'SECRET META' }, secs: [{ l: 'A', c: 'B' }] }));

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const ok = (data) => new Response(JSON.stringify(data), { status: 200 });
    if (url.host === 'api.resend.com') {
      sentEmails.push(JSON.parse(init.body));
      return ok({ id: 'em_1' });
    }
    assert.equal(url.host, 'test.dodopayments.com');
    assert.equal(init.headers.Authorization, 'Bearer test_key');
    const p = url.pathname;
    if (p === '/checkouts' && init.method === 'POST') {
      dodoState.lastCheckoutBody = JSON.parse(init.body);
      return ok({ session_id: 'cks_1', checkout_url: 'https://checkout.dodopayments.com/session/cks_1' });
    }
    if (p === '/checkouts/cks_1') return ok(dodoState.checkout);
    if (p === '/payments/pay_1') return ok(dodoState.payment);
    if (p === '/subscriptions/sub_1') return ok(dodoState.sub);
    if (p === '/customers') return ok({ items: url.searchParams.get('email') === 'reader@example.com' ? [{ customer_id: 'cus_1', email: 'reader@example.com' }] : [] });
    if (p === '/subscriptions') return ok({ items: dodoState.sub.status === 'active' ? [dodoState.sub] : [] });
    if (p === '/customers/cus_1/customer-portal/session') return ok({ link: 'https://portal.example/cus_1?r=' + url.searchParams.get('return_url') });
    return new Response('not found', { status: 404 });
  };
});

function req(method, path, { body, token, headers = {} } = {}) {
  return new Request('https://api.example' + path, {
    method,
    headers: {
      Origin: ORIGIN,
      'CF-Connecting-IP': '1.2.3.4',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...headers,
    },
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

async function call(...args) {
  const res = await worker.fetch(req(...args), env);
  return { status: res.status, headers: res.headers, body: await res.json() };
}

async function subscribe() {
  const co = await call('POST', '/api/checkout', { body: { plan: 'monthly' } });
  const claim = new URL(dodoState.lastCheckoutBody.return_url).searchParams.get('claim');
  dodoState.checkout = { id: 'cks_1', payment_id: 'pay_1', payment_status: 'succeeded' };
  const res = await call('POST', '/api/claim', { body: { claim } });
  return { co, claim, res };
}

async function webhook(type, data, { id = 'msg_' + Math.random(), secret = WH_SECRET } = {}) {
  const raw = JSON.stringify({ business_id: 'bus_1', type, timestamp: new Date().toISOString(), data });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signStandardWebhook(id, ts, raw, secret);
  return call('POST', '/api/webhook', {
    body: raw,
    headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': sig },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────

test('config lists plans without product ids', async () => {
  const r = await call('GET', '/api/config');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.plans, [{ id: 'monthly', label: 'Monthly', price: '₹1' }]);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('CORS is not granted to unknown origins', async () => {
  const res = await worker.fetch(req('GET', '/api/health', { headers: { Origin: 'https://evil.example' } }), env);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
});

test('checkout creates a Dodo session with a claim return URL', async () => {
  const r = await call('POST', '/api/checkout', { body: { plan: 'monthly', email: 'a@b.co' } });
  assert.equal(r.status, 200);
  assert.match(r.body.checkout_url, /^https:\/\/checkout\.dodopayments\.com/);
  const b = dodoState.lastCheckoutBody;
  assert.deepEqual(b.product_cart, [{ product_id: 'pdt_month', quantity: 1 }]);
  assert.deepEqual(b.customer, { email: 'a@b.co' });
  assert.match(b.return_url, /^https:\/\/rr0603\.github\.io\/Sanatan\/\?claim=/);
});

test('premium content requires an active subscription', async () => {
  const anon = await call('GET', '/api/era/kurma');
  assert.equal(anon.status, 401);
  assert.ok(!JSON.stringify(anon.body).includes('SECRET'));

  // Before payment completes the claim is pending.
  await call('POST', '/api/checkout', { body: {} });
  const claim = new URL(dodoState.lastCheckoutBody.return_url).searchParams.get('claim');
  const pending = await call('POST', '/api/claim', { body: { claim } });
  assert.equal(pending.status, 202);

  dodoState.checkout = { id: 'cks_1', payment_id: 'pay_1', payment_status: 'succeeded' };
  const ok = await call('POST', '/api/claim', { body: { claim } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.account.email, 'reader@example.com');
  assert.equal(ok.body.account.active, true);

  const era = await call('GET', '/api/era/kurma', { token: ok.body.token });
  assert.equal(era.status, 200);
  assert.equal(era.body.layers.meta, 'SECRET META');
});

test('claims cannot be reused forever or guessed', async () => {
  const { claim } = await subscribe();
  await call('POST', '/api/claim', { body: { claim } });
  await call('POST', '/api/claim', { body: { claim } });
  const r = await call('POST', '/api/claim', { body: { claim } });
  assert.equal(r.status, 410);
  const guess = await call('POST', '/api/claim', { body: { claim: 'A'.repeat(32) } });
  assert.equal(guess.status, 404);
});

test('cancellation webhook revokes access immediately', async () => {
  const { res } = await subscribe();
  dodoState.sub = { ...dodoState.sub, status: 'cancelled' };
  const wh = await webhook('subscription.cancelled', { subscription_id: 'sub_1' });
  assert.equal(wh.status, 200);
  const era = await call('GET', '/api/era/kurma', { token: res.body.token });
  assert.equal(era.status, 402);
  const me = await call('GET', '/api/me', { token: res.body.token });
  assert.equal(me.body.entitled, false);
});

test('webhooks with bad or stale signatures are rejected', async () => {
  const other = 'whsec_' + Buffer.from('another-secret-another-secret!!').toString('base64');
  assert.equal((await webhook('subscription.active', { subscription_id: 'sub_1' }, { secret: other })).status, 401);

  const raw = '{"type":"subscription.active","data":{"subscription_id":"sub_1"}}';
  const ts = String(Math.floor(Date.now() / 1000) - 3600);
  const sig = await signStandardWebhook('msg_old', ts, raw, WH_SECRET);
  const stale = await call('POST', '/api/webhook', {
    body: raw, headers: { 'webhook-id': 'msg_old', 'webhook-timestamp': ts, 'webhook-signature': sig },
  });
  assert.equal(stale.status, 401);
});

test('duplicate webhook deliveries are ignored', async () => {
  const a = await webhook('subscription.active', { subscription_id: 'sub_1' }, { id: 'msg_dup' });
  const b = await webhook('subscription.active', { subscription_id: 'sub_1' }, { id: 'msg_dup' });
  assert.equal(a.body.duplicate, undefined);
  assert.equal(b.body.duplicate, true);
});

test('subscriptions to other products do not unlock content', async () => {
  dodoState.sub = { ...dodoState.sub, product_id: 'pdt_someone_else' };
  const { res } = await subscribe();
  assert.equal(res.status, 202);
});

test('tampered or expired tokens are rejected', async () => {
  const { res } = await subscribe();
  const [v, body, sig] = res.body.token.split('.');
  const forged = Buffer.from(JSON.stringify({ sid: 'sub_2', exp: 9e9, iat: 0 })).toString('base64url');
  assert.equal((await call('GET', '/api/era/kurma', { token: `${v}.${forged}.${sig}` })).status, 401);
  const expired = await signToken({ sid: 'sub_1', exp: 1, iat: 0 }, env.SESSION_SECRET);
  assert.equal((await call('GET', '/api/era/kurma', { token: expired })).status, 401);
  assert.equal(await verifyToken(`${v}.${body}.${sig}`, 'y'.repeat(40)), null);
});

test('email sign-in link restores access on a new device, once', async () => {
  await subscribe();
  const r = await call('POST', '/api/login', { body: { email: 'READER@example.com ' } });
  assert.equal(r.status, 200);
  assert.equal(sentEmails.length, 1);
  const link = sentEmails[0].text.match(/https:\S+/)[0];
  const token = new URL(link).searchParams.get('login');

  const v = await call('POST', '/api/login/verify', { body: { token } });
  assert.equal(v.status, 200);
  assert.equal((await call('GET', '/api/era/kurma', { token: v.body.token })).status, 200);
  assert.equal((await call('POST', '/api/login/verify', { body: { token } })).status, 410);
});

test('sign-in for an unknown email looks the same but sends nothing', async () => {
  const r = await call('POST', '/api/login', { body: { email: 'stranger@example.com' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.equal(sentEmails.length, 0);
});

test('sign-in is rate limited per email', async () => {
  for (let i = 0; i < 3; i++) await call('POST', '/api/login', { body: { email: 'reader@example.com' } });
  const r = await call('POST', '/api/login', { body: { email: 'reader@example.com' } });
  assert.equal(r.status, 429);
});

test('billing portal link is created for the reader', async () => {
  const { res } = await subscribe();
  const r = await call('POST', '/api/portal', { token: res.body.token });
  assert.equal(r.status, 200);
  assert.match(r.body.link, /cus_1/);
});

test('unknown routes and bad era ids', async () => {
  assert.equal((await call('GET', '/api/nope')).status, 404);
  const { res } = await subscribe();
  assert.equal((await call('GET', '/api/era/..%2Fsecret', { token: res.body.token })).status, 400);
});
