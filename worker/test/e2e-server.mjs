// Local end-to-end harness: serves the static site on :8080 and runs the
// Worker on :8787 with in-memory KV and a fake Dodo Payments API.
//   node test/e2e-server.mjs
// Then open http://localhost:8080/ . "Checkout" goes to a fake payment page
// that succeeds immediately and returns to the site.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'http://localhost:8080';
const API = 'http://localhost:8787';

class KV {
  constructor() { this.m = new Map(); }
  async get(k, t) { const v = this.m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, String(v)); }
  async delete(k) { this.m.delete(k); }
}

const env = {
  STATE: new KV(), CONTENT: new KV(),
  DODO_ENV: 'test_mode', DODO_API_KEY: 'fake', DODO_WEBHOOK_SECRET: 'whsec_ZmFrZQ==',
  SESSION_SECRET: 'e2e-'.repeat(10), RESEND_API_KEY: 're_fake', EMAIL_FROM: 'e2e@example.com',
  SITE_URL: SITE + '/', ALLOWED_ORIGINS: SITE,
  PLANS: JSON.stringify([
    { id: 'monthly', product_id: 'pdt_m', label: 'Monthly', price: '₹199 / month' },
    { id: 'yearly', product_id: 'pdt_y', label: 'Yearly', price: '₹1,999 / year', note: '2 months free' },
  ]),
};
const kvFile = join(ROOT, 'worker', '.private', 'premium-kv.json');
if (existsSync(kvFile)) for (const { key, value } of JSON.parse(readFileSync(kvFile, 'utf8'))) env.CONTENT.put(key, value);
else console.warn('No premium-kv.json: member content will 404');

// Fake Dodo
const fake = { paid: false, email: 'reader@example.com', status: 'active' };
export const emails = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const ok = (d) => new Response(JSON.stringify(d), { status: 200 });
  if (url.host === 'api.resend.com') { emails.push(JSON.parse(init.body)); console.log('EMAIL', JSON.parse(init.body).text); return ok({ id: 'e' }); }
  if (url.host !== 'test.dodopayments.com') return realFetch(input, init);
  const p = url.pathname;
  const sub = { subscription_id: 'sub_1', status: fake.status, product_id: 'pdt_m', next_billing_date: '2026-12-24T00:00:00Z', cancel_at_next_billing_date: false, customer: { customer_id: 'cus_1', email: fake.email, name: 'R' } };
  if (p === '/checkouts' && init.method === 'POST') {
    const body = JSON.parse(init.body);
    if (body.customer?.email) fake.email = body.customer.email;
    return ok({ session_id: 'cks_1', checkout_url: `${API}/__fake_checkout?return=${encodeURIComponent(body.return_url)}` });
  }
  if (p === '/checkouts/cks_1') return ok(fake.paid ? { id: 'cks_1', payment_id: 'pay_1', payment_status: 'succeeded' } : { id: 'cks_1', payment_id: null });
  if (p === '/payments/pay_1') return ok({ payment_id: 'pay_1', subscription_id: 'sub_1' });
  if (p === '/subscriptions/sub_1') return ok(sub);
  if (p === '/customers') return ok({ items: url.searchParams.get('email') === fake.email ? [{ customer_id: 'cus_1', email: fake.email }] : [] });
  if (p === '/subscriptions') return ok({ items: fake.status === 'active' ? [sub] : [] });
  if (p.endsWith('/customer-portal/session')) return ok({ link: SITE + '/?portal=1' });
  return new Response('{}', { status: 404 });
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

http.createServer((req, res) => {
  const u = new URL(req.url, SITE);
  let path = u.pathname === '/' ? '/index.html' : u.pathname;
  const file = join(ROOT, decodeURIComponent(path));
  if (!file.startsWith(ROOT) || !existsSync(file) || file.includes('/worker/')) { res.writeHead(404); return res.end('not found'); }
  let body = readFileSync(file);
  if (path === '/index.html') body = Buffer.from(body.toString('utf8').replace('<meta name="premium-api" content="">', `<meta name="premium-api" content="${API}">`).replace('https://*.workers.dev', 'https://*.workers.dev ' + API));
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(8080);

http.createServer(async (req, res) => {
  const u = new URL(req.url, API);
  if (u.pathname === '/__fake_checkout') {
    fake.paid = true;
    res.writeHead(302, { Location: u.searchParams.get('return') });
    return res.end();
  }
  if (u.pathname === '/__cancel') { fake.status = 'cancelled'; env.STATE.m.delete('sub:sub_1'); res.end('ok'); return; }
  if (u.pathname === '/__emails') { res.end(JSON.stringify(emails)); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const r = new Request(API + req.url, {
    method: req.method,
    headers: { ...req.headers, 'cf-connecting-ip': '127.0.0.1' },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const out = await worker.fetch(r, env);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(8787);

console.log(`site ${SITE}  api ${API}`);
