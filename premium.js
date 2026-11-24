/* Living Sanatan — premium membership client
 *
 * Premium era content (Metaphysics, Biology, Neuroscience, Quantum and
 * Inner layers, plus "Discover Deeper", for every era after the first
 * three) is not in this repository. It is served by the subscriptions API
 * (worker/) only to readers with an active Dodo Payments subscription.
 *
 * The API address comes from <meta name="premium-api" content="...">.
 */
(function () {
  'use strict';

  var PREMIUM_LAYERS = ['meta', 'bio', 'neuro', 'quantum', 'inner'];
  var LAYER_NAMES = { meta: 'Metaphysics', bio: 'Biology', neuro: 'Neuroscience', quantum: 'Quantum', inner: 'Inner' };
  var TOKEN_KEY = 'sp_token';
  var apiMeta = document.querySelector('meta[name="premium-api"]');
  var API = ((apiMeta && apiMeta.content) || '').replace(/\/+$/, '');

  var state = {
    token: storeGet(TOKEN_KEY),
    account: null,
    entitled: false,
    plans: null,
    loaded: {},   // era id -> true
    loading: {},  // era id -> Promise
    lastPanelIdx: null,
  };

  // ── storage (may be unavailable in private mode) ─────────────────
  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  var store = { get: storeGet, set: storeSet };

  // ── API ──────────────────────────────────────────────────────────
  function api(method, path, body) {
    if (!API) return Promise.reject(new Error('Memberships are opening soon.'));
    var headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    return fetch(API + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      cache: 'no-store',
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401) setToken(null);
        if (!res.ok && res.status !== 202) {
          var err = new Error(data.error || 'Something went wrong. Please try again.');
          err.status = res.status;
          throw err;
        }
        data._status = res.status;
        return data;
      });
    });
  }

  function setToken(t) {
    state.token = t;
    store.set(TOKEN_KEY, t);
    if (!t) { state.account = null; setEntitled(false); }
  }

  // ── era data ─────────────────────────────────────────────────────
  function eras() { return (typeof ERAS !== 'undefined' && ERAS) || []; }

  function lockedHTML(kind) {
    var what = kind === 'panel' ? 'Discover Deeper' : (LAYER_NAMES[kind] || 'This layer');
    return '<div class="sp-locked">' +
      '<div class="sp-locked-glyph" aria-hidden="true">ॐ</div>' +
      '<div class="sp-locked-eyebrow">For members</div>' +
      '<div class="sp-locked-title">' + what + ' is part of the full timeline</div>' +
      '<p class="sp-locked-copy">Members read every layer of all 24 eras: Metaphysics, Biology, Neuroscience, Quantum, Inner and Discover Deeper. History, FAQ and the first three eras stay free for everyone.</p>' +
      '<div class="sp-locked-actions">' +
      '<button type="button" class="sp-btn sp-btn-primary" onclick="SanatanPremium.open(\'join\')">Become a member</button>' +
      '<button type="button" class="sp-btn" onclick="SanatanPremium.open(\'restore\')">I\'m already a member</button>' +
      '</div></div>';
  }

  function loadingHTML() {
    return '<div class="sp-locked sp-loading"><div class="sp-locked-glyph" aria-hidden="true">ॐ</div><div class="sp-locked-eyebrow">Opening this layer…</div></div>';
  }

  // Fill locked slots with a placeholder so the existing renderer shows it.
  function applyPlaceholders() {
    eras().forEach(function (era) {
      if (!era.premium || state.loaded[era.id]) return;
      era.layers = era.layers || {};
      PREMIUM_LAYERS.forEach(function (k) {
        era.layers[k] = state.entitled ? loadingHTML() : lockedHTML(k);
      });
      if (era.panel) era.panel.secs = [{ l: 'Members', c: state.entitled ? loadingHTML() : lockedHTML('panel') }];
    });
  }

  function loadEra(idx) {
    var era = eras()[idx];
    if (!era || !era.premium || !state.entitled || state.loaded[era.id]) return Promise.resolve();
    if (state.loading[era.id]) return state.loading[era.id];
    var p = api('GET', '/api/era/' + encodeURIComponent(era.id)).then(function (data) {
      PREMIUM_LAYERS.forEach(function (k) { if (data.layers && data.layers[k] != null) era.layers[k] = data.layers[k]; });
      if (era.panel && Array.isArray(data.secs) && data.secs.length) era.panel.secs = data.secs;
      state.loaded[era.id] = true;
      refreshVisible(idx);
    }).catch(function (err) {
      if (err.status === 402) { setEntitled(false); refreshVisible(idx); }
      else toast(err.message);
    }).then(function () { delete state.loading[era.id]; });
    state.loading[era.id] = p;
    return p;
  }

  function currentIdx() { return typeof current === 'number' ? current : 0; }

  function refreshVisible(idx) {
    if (idx === currentIdx() && typeof setLayer === 'function' && typeof currentLayer === 'string' && currentLayer !== 'faq') {
      try { setLayer(currentLayer, idx); } catch (e) {}
    }
    var ov = document.getElementById('ov');
    if (ov && ov.classList.contains('on') && state.lastPanelIdx === idx && origOpenPanel) {
      try { origOpenPanel(idx); } catch (e) {}
    }
  }

  function setEntitled(on) {
    state.entitled = !!on;
    if (!on) state.loaded = {};
    applyPlaceholders();
    updateMemberButton();
    if (on) loadEra(currentIdx());
    refreshVisible(currentIdx());
  }

  // ── hooks into the timeline ──────────────────────────────────────
  var origRender = window.renderContent;
  var origOpenPanel = window.openPanel;
  if (typeof origRender === 'function') {
    window.renderContent = function (idx) { loadEra(idx); return origRender.apply(this, arguments); };
  }
  if (typeof origOpenPanel === 'function') {
    window.openPanel = function (idx) { state.lastPanelIdx = idx; loadEra(idx); return origOpenPanel.apply(this, arguments); };
  }

  // ── UI ───────────────────────────────────────────────────────────
  var modal, lastFocus;

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function toast(msg) {
    var t = document.getElementById('sp-toast');
    if (!t) { t = el('<div id="sp-toast" role="status" aria-live="polite"></div>'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 5000);
  }

  function updateMemberButton() {
    var b = document.getElementById('sp-member-btn');
    if (!b) return;
    var label = b.querySelector('.tb-label');
    if (label) label.textContent = state.entitled ? ' Account' : ' Members';
    b.title = state.entitled ? 'Your membership' : 'Unlock every layer of every era';
  }

  function ensureModal() {
    if (modal) return modal;
    modal = el(
      '<div id="sp-modal" role="dialog" aria-modal="true" aria-labelledby="sp-title" hidden>' +
      '<div class="sp-card">' +
      '<button type="button" class="sp-close" aria-label="Close">×</button>' +
      '<div class="sp-body"></div>' +
      '</div></div>'
    );
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.querySelector('.sp-close').addEventListener('click', close);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') trapFocus(e);
    });
    document.body.appendChild(modal);
    return modal;
  }

  function trapFocus(e) {
    var f = modal.querySelectorAll('button:not([disabled]), input, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function render(html) {
    ensureModal().querySelector('.sp-body').innerHTML = html;
    var first = modal.querySelector('.sp-body input, .sp-body button');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function busy(btn, on, text) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = text || 'Please wait…'; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    btn.disabled = on;
  }

  function showError(msg) {
    var e = modal.querySelector('.sp-error');
    if (e) { e.textContent = msg; e.hidden = !msg; }
  }

  function viewJoin() {
    var plans = state.plans || [];
    var planHTML = plans.length
      ? plans.map(function (p, i) {
          return '<label class="sp-plan"><input type="radio" name="sp-plan" value="' + esc(p.id) + '"' + (i === 0 ? ' checked' : '') + '>' +
            '<span class="sp-plan-label">' + esc(p.label) + '</span>' +
            '<span class="sp-plan-price">' + esc(p.price) + '</span>' +
            (p.note ? '<span class="sp-plan-note">' + esc(p.note) + '</span>' : '') + '</label>';
        }).join('')
      : '<p class="sp-muted">Memberships are opening soon.</p>';
    render(
      '<div class="sp-eyebrow">Membership</div>' +
      '<h2 id="sp-title" class="sp-title">Read the whole timeline</h2>' +
      '<ul class="sp-list">' +
      '<li>All six layers for all 24 eras</li>' +
      '<li>Every "Discover Deeper" panel</li>' +
      '<li>New eras and essays as they are written</li>' +
      '<li>Cancel any time from your billing page</li></ul>' +
      '<form class="sp-form" novalidate>' +
      '<div class="sp-plans">' + planHTML + '</div>' +
      '<label class="sp-field"><span>Email (for your receipt and sign-in)</span>' +
      '<input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></label>' +
      '<p class="sp-error" role="alert" hidden></p>' +
      '<button type="submit" class="sp-btn sp-btn-primary sp-wide"' + (plans.length ? '' : ' disabled') + '>Continue to secure payment</button>' +
      '</form>' +
      '<p class="sp-fine">Payments are processed securely by Dodo Payments, our merchant of record. Any taxes are shown at checkout.</p>' +
      '<button type="button" class="sp-link" data-go="restore">Already a member? Restore access</button>'
    );
    var form = modal.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var plan = (form.querySelector('input[name=sp-plan]:checked') || {}).value;
      var email = form.email.value.trim();
      showError('');
      busy(btn, true, 'Opening checkout…');
      api('POST', '/api/checkout', { plan: plan, email: email || undefined }).then(function (data) {
        window.location.href = data.checkout_url;
      }).catch(function (err) { busy(btn, false); showError(err.message); });
    });
    bindNav();
  }

  function viewRestore() {
    render(
      '<div class="sp-eyebrow">Members</div>' +
      '<h2 id="sp-title" class="sp-title">Restore access</h2>' +
      '<p class="sp-muted">Enter the email you subscribed with. We\'ll send a one-time sign-in link for this device.</p>' +
      '<form class="sp-form" novalidate>' +
      '<label class="sp-field"><span>Email</span><input type="email" name="email" autocomplete="email" inputmode="email" required placeholder="you@example.com"></label>' +
      '<p class="sp-error" role="alert" hidden></p>' +
      '<button type="submit" class="sp-btn sp-btn-primary sp-wide">Email me a sign-in link</button>' +
      '</form>' +
      '<button type="button" class="sp-link" data-go="join">Not a member yet? See plans</button>'
    );
    var form = modal.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var email = form.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { showError('Please enter a valid email address.'); return; }
      showError('');
      busy(btn, true, 'Sending…');
      api('POST', '/api/login', { email: email }).then(function () {
        render(
          '<div class="sp-eyebrow">Check your inbox</div>' +
          '<h2 id="sp-title" class="sp-title">Sign-in link sent</h2>' +
          '<p class="sp-muted">If <strong>' + esc(email) + '</strong> has an active membership, a link is on its way. It works once and expires in 20 minutes. Check spam if it doesn\'t arrive.</p>' +
          '<button type="button" class="sp-btn sp-wide" data-close>Close</button>'
        );
        bindNav();
      }).catch(function (err) { busy(btn, false); showError(err.message); });
    });
    bindNav();
  }

  function viewAccount() {
    var a = state.account || {};
    var renew = a.next_billing_date ? new Date(a.next_billing_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    var line = a.cancel_at_next_billing_date
      ? (renew ? 'Your membership ends on ' + renew + '.' : 'Your membership will not renew.')
      : (renew ? 'Renews on ' + renew + '.' : '');
    render(
      '<div class="sp-eyebrow">Membership</div>' +
      '<h2 id="sp-title" class="sp-title">' + (state.entitled ? 'You are a member' : 'Membership inactive') + '</h2>' +
      (a.email ? '<p class="sp-muted">Signed in as <strong>' + esc(a.email) + '</strong></p>' : '') +
      (line ? '<p class="sp-muted">' + esc(line) + '</p>' : '') +
      '<p class="sp-error" role="alert" hidden></p>' +
      '<div class="sp-stack">' +
      '<button type="button" class="sp-btn sp-btn-primary sp-wide" data-portal>Manage billing, receipts or cancel</button>' +
      (state.entitled ? '' : '<button type="button" class="sp-btn sp-wide" data-go="join">See plans</button>') +
      '<button type="button" class="sp-btn sp-wide" data-signout>Sign out on this device</button>' +
      '</div>'
    );
    modal.querySelector('[data-portal]').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      busy(btn, true, 'Opening billing…');
      api('POST', '/api/portal').then(function (d) { window.location.href = d.link; })
        .catch(function (err) { busy(btn, false); showError(err.message); });
    });
    modal.querySelector('[data-signout]').addEventListener('click', function () {
      setToken(null);
      close();
      toast('Signed out on this device.');
    });
    bindNav();
  }

  function viewMessage(title, body) {
    render('<div class="sp-eyebrow">Membership</div><h2 id="sp-title" class="sp-title">' + esc(title) + '</h2><p class="sp-muted">' + body + '</p>' +
      '<button type="button" class="sp-btn sp-wide" data-close>Close</button>');
    bindNav();
  }

  function bindNav() {
    modal.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-go')); });
    });
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
  }

  function loadPlans() {
    if (state.plans) return Promise.resolve(state.plans);
    return api('GET', '/api/config').then(function (d) { state.plans = d.plans || []; return state.plans; })
      .catch(function () { state.plans = []; return state.plans; });
  }

  function open(view) {
    ensureModal();
    if (modal.hidden) lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('sp-open');
    if (!view) view = state.token ? 'account' : 'join';
    if (view === 'account') viewAccount();
    else if (view === 'restore') viewRestore();
    else { render('<div class="sp-eyebrow">Membership</div><p class="sp-muted">Loading plans…</p>'); loadPlans().then(viewJoin); }
  }

  function close() {
    if (!modal) return;
    modal.hidden = true;
    document.documentElement.classList.remove('sp-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  // ── returning from checkout / sign-in email ──────────────────────
  function stripParam(name) {
    try {
      var u = new URL(window.location.href);
      u.searchParams.delete(name);
      history.replaceState(history.state, '', u.pathname + (u.search ? u.search : '') + u.hash);
    } catch (e) {}
  }

  function grant(data, message) {
    setToken(data.token);
    state.account = data.account;
    setEntitled(true);
    viewMessage('Welcome', message);
  }

  function handleClaim(claim) {
    stripParam('claim');
    open('account');
    viewMessage('Confirming your payment…', 'This usually takes a few seconds. Please keep this page open.');
    var tries = 0;
    (function poll() {
      tries++;
      api('POST', '/api/claim', { claim: claim }).then(function (d) {
        if (d._status === 202) {
          if (tries < 40) return setTimeout(poll, 3000);
          viewMessage('Payment still processing', 'Your payment hasn\'t been confirmed yet. Once it is, use <strong>Members → Restore access</strong> with your email to unlock this device.');
          return;
        }
        grant(d, 'Thank you for supporting this work. Every layer of every era is now open on this device. To use another device, choose <strong>Members → Restore access</strong> there.');
      }).catch(function (err) { viewMessage('We couldn\'t confirm that payment', esc(err.message)); });
    })();
  }

  function handleLogin(token) {
    stripParam('login');
    open('account');
    viewMessage('Signing you in…', '');
    api('POST', '/api/login/verify', { token: token })
      .then(function (d) { grant(d, 'You\'re signed in. Every layer of every era is open on this device.'); })
      .catch(function (err) { viewMessage('Sign-in link not valid', esc(err.message) + ' <br><br><button type="button" class="sp-link" data-go="restore">Send a new link</button>'); bindNav(); });
  }

  function checkSession() {
    if (!state.token) return;
    api('GET', '/api/me').then(function (d) {
      if (d.token) setToken(d.token);
      state.account = d.account;
      setEntitled(d.entitled);
    }).catch(function () { /* offline or signed out: keep content locked */ });
  }

  // ── boot ─────────────────────────────────────────────────────────
  function boot() {
    applyPlaceholders();
    var b = document.getElementById('sp-member-btn');
    if (b) b.addEventListener('click', function () { open(); });
    updateMemberButton();

    var params = new URLSearchParams(window.location.search);
    if (params.get('claim')) handleClaim(params.get('claim'));
    else if (params.get('login')) handleLogin(params.get('login'));
    else checkSession();
  }

  window.SanatanPremium = { open: open, close: close };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
