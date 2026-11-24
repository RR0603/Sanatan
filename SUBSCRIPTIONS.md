# Memberships (paid subscriptions)

The site stays on GitHub Pages. Premium content is served by a small
Cloudflare Worker (`worker/`) that checks each reader's Dodo Payments
subscription before it returns anything.

## What is free and what is for members

| Free for everyone | Members only |
| --- | --- |
| Eras 1–3 (Brahman, Spanda, Nāda) in full | Eras 4–24: Metaphysics, Biology, Neuroscience, Quantum and Inner layers |
| Every era's overview, quote, fractal, History layer, FAQ and tags | Eras 4–24: the "Discover Deeper" panel |
| All tools (Kosha, Rishis, Concept Web, experiences…) | |

Free text stays in `script.js` so search engines still index every era.
Member text is **not in this repository**. It lives in Cloudflare KV.

To change the split, edit `PREMIUM_LAYERS` / `--free` in
`worker/scripts/extract-premium.mjs` and `PREMIUM_LAYERS` in `premium.js`.

## How it works

```
Reader ─▶ GitHub Pages (index.html, script.js, premium.js)
            │  locked layer → "Become a member"
            ▼
         Worker  POST /api/checkout ─▶ Dodo checkout ─▶ pays
            ▲                                            │
            │  returns to site with ?claim=…  ◀──────────┘
            │  POST /api/claim → verifies payment with Dodo → access token
            │  GET  /api/era/:id (token) → member text from KV
            └─ POST /api/webhook ◀─ Dodo (renewals, cancellations, failures)
```

* **Another device:** Members → Restore access → enter email → one-time
  sign-in link (sent with Resend).
* **Cancel / receipts / card change:** Members → Manage billing opens the Dodo
  customer portal.
* **Cancellation or failed payment** reaches the Worker by webhook. Access
  stops immediately (the Worker also re-checks with Dodo every 6 hours in
  case a webhook is missed).

## One-time setup (about 30 minutes)

You need: a Dodo Payments account, a free Cloudflare account, a free Resend
account, and Node.js 20+ on your computer.

### 1. Dodo Payments (start in **Test mode**)

1. Products → create a **Subscription** product, e.g. "Living Sanatan
   Membership – Monthly". Optionally a yearly one. Copy each `pdt_…` id.
2. Developer → API keys → create a key. Keep it for step 3.
3. Developer → Webhooks → add endpoint
   `https://<your-worker>.workers.dev/api/webhook` (you get this URL in step 3;
   come back after deploying). Subscribe to all `subscription.*` events and
   `payment.succeeded`. Copy the signing secret (`whsec_…`).

### 2. Resend (sign-in emails)

Add and verify your domain (e.g. `livingsanatan.com`), create an API key.
Set `EMAIL_FROM` in `worker/wrangler.toml` to an address on that domain.

### 3. Deploy the Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create STATE
npx wrangler kv namespace create CONTENT
```

Paste the two printed ids into `worker/wrangler.toml`, and set the `pdt_…`
ids and prices in `PLANS`. Prices shown on the site come from `PLANS`, so keep
them equal to the prices in Dodo. Then add the secrets:

```bash
npx wrangler secret put DODO_API_KEY
npx wrangler secret put DODO_WEBHOOK_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

For `SESSION_SECRET` use a long random string, e.g. the output of
`openssl rand -base64 48`. Changing it later signs every member out.

### 4. Upload the member content

The member text was removed from `script.js` and written to
`worker/.private/premium-kv.json`. That file is git-ignored on purpose. If
you don't have it on your computer, regenerate it from the last commit that
still had the full text:

```bash
git show 7cf5430:script.js > /tmp/script.full.js
node scripts/extract-premium.mjs --in /tmp/script.full.js --out /tmp/ignore.js --kv .private/premium-kv.json
npm run upload-content
```

**Keep a private backup of `premium-kv.json`** (it is now the master copy of
the member text). To edit member text later, edit that file and run
`npm run upload-content` again. No redeploy is needed.

### 5. Point the site at the Worker

In `index.html`, set:

```html
<meta name="premium-api" content="https://sanatan-premium.<your-subdomain>.workers.dev">
```

The CSP already allows `https://*.workers.dev` and
`https://api.livingsanatan.com`. If you use a different domain, add it to
`connect-src`.

### 6. Test, then go live

1. With Dodo in test mode, subscribe using a Dodo test card, check that the
   layers unlock, open Manage billing, cancel, and check that they lock again.
2. Switch Dodo to live mode: create the live products and API key, then
   update `PLANS` and the secrets, and set `DODO_ENV = "live_mode"` in
   `wrangler.toml`. Add the live webhook, then run `npx wrangler deploy`.

## Running locally

```bash
cd worker
npm test                       # unit tests (fake Dodo + KV)
node test/e2e-server.mjs       # site on :8080, API on :8787, fake checkout
```

## Costs and limits

* Cloudflare Workers free plan: 100k requests/day, KV 100k reads and 1k
  writes per day. Each active reader costs up to two writes every 6 hours
  (status re-check), plus a few per sign-up, sign-in and webhook. That fits
  roughly 100 daily active members. Beyond that, move to the $5/month
  Workers Paid plan (1M KV writes/month included).
* Dodo Payments charges a fee per transaction (see their pricing page).
* Resend free plan: 3,000 emails/month.
