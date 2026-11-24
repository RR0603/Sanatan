// Minimal Dodo Payments REST client (fetch only, no SDK).
// Endpoints and field names match the official `dodopayments` SDK v2.

const BASE = {
  test_mode: 'https://test.dodopayments.com',
  live_mode: 'https://live.dodopayments.com',
};

export class DodoError extends Error {
  constructor(status, body) {
    super(`Dodo API ${status}: ${typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
    this.status = status;
  }
}

export function dodo(env) {
  const base = BASE[env.DODO_ENV] || BASE.test_mode;
  if (!env.DODO_API_KEY) throw new Error('DODO_API_KEY is not set');

  async function call(method, path, { body, query } = {}) {
    const url = new URL(base + path);
    for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env.DODO_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) throw new DodoError(res.status, data);
    return data;
  }

  return {
    // POST /checkouts -> { session_id, checkout_url }
    createCheckout: (body) => call('POST', '/checkouts', { body }),
    // GET /checkouts/{id} -> { id, payment_id, payment_status, customer_email }
    getCheckout: (id) => call('GET', `/checkouts/${encodeURIComponent(id)}`),
    // GET /payments/{id} -> { payment_id, subscription_id, status, customer }
    getPayment: (id) => call('GET', `/payments/${encodeURIComponent(id)}`),
    // GET /subscriptions/{id} -> Subscription
    getSubscription: (id) => call('GET', `/subscriptions/${encodeURIComponent(id)}`),
    // GET /subscriptions?customer_id=&status= -> { items: Subscription[] }
    listSubscriptions: (query) => call('GET', '/subscriptions', { query }),
    // GET /customers?email= -> { items: Customer[] }
    listCustomers: (query) => call('GET', '/customers', { query }),
    // POST /customers/{id}/customer-portal/session?return_url= -> { link }
    portalSession: (customerId, returnUrl) =>
      call('POST', `/customers/${encodeURIComponent(customerId)}/customer-portal/session`, {
        query: { return_url: returnUrl },
      }),
  };
}
