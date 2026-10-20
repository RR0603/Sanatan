// Antariksha Pro: a one-time unlock of the personal Jyotish features.
// In the iOS / Android apps purchases go through the stores via RevenueCat (Capacitor plugin);
// on the website the paywall points to the stores (see LS.CONFIG.pro.webMode).
window.LS = window.LS || {};

LS.Pro = (function () {
  const C = LS.CONFIG.pro;
  const KEY = 'antariksha.pro';
  const cap = window.Capacitor;
  const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const platform = isNative ? cap.getPlatform() : 'web';
  const listeners = [];
  let state = { active: false, source: null };
  let pkg = null;           // RevenueCat package for the lifetime product
  let status = 'idle';      // idle | ready | unconfigured | error

  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); state.active = !!state.active; } catch (e) { state = { active: false }; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
  function set(active, source) {
    const changed = active !== state.active;
    state = { active, source, at: Date.now() };
    if (source !== 'preview') save();
    if (changed) listeners.forEach((f) => f(active));
  }
  const plugin = () => cap && cap.Plugins && cap.Plugins.Purchases;
  function applyCustomerInfo(info) {
    if (!info) return; // an error callback: keep what we know rather than locking a paying user out
    const active = !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[C.entitlement]);
    set(active, 'store');
  }
  // Only ever sell the Pro product (never "whatever comes first" if the store setup is wrong).
  function pickPackage(offerings) {
    const pkgs = (offerings && offerings.current && offerings.current.availablePackages) || [];
    return pkgs.find((p) => p.product && p.product.identifier === C.productId)
      || pkgs.find((p) => p.packageType === 'LIFETIME' && p.product && String(p.product.identifier).startsWith(C.productId)) || null;
  }
  async function loadOfferings() {
    const P = plugin();
    if (!P || status === 'unconfigured') return null;
    try { pkg = pickPackage(await P.getOfferings()) || pkg; } catch (e) { console.warn('Offerings unavailable', e); }
    return pkg;
  }

  async function init() {
    if (isNative) {
      const P = plugin(), key = C.revenueCat[platform];
      if (!P || !key) { status = 'unconfigured'; return; }
      // Each step on its own, so one failure (e.g. offline at first launch) doesn't disable the rest.
      try { await P.configure({ apiKey: key }); } catch (e) { console.warn('Purchases configure failed', e); status = 'error'; return; }
      try { if (P.addCustomerInfoUpdateListener) P.addCustomerInfoUpdateListener((info) => applyCustomerInfo(info)); } catch (e) { /* optional */ }
      // Offline or store unavailable: keep the last known state so a paid user is never locked out.
      try { const { customerInfo } = await P.getCustomerInfo(); applyCustomerInfo(customerInfo); } catch (e) { console.warn('Customer info unavailable', e); }
      await loadOfferings();
      status = pkg ? 'ready' : 'error';
      return;
    }
    // Website
    let preview = false;
    try {
      const q = new URLSearchParams(location.search);
      if (q.has(C.webPreviewParam)) sessionStorage.setItem(KEY + '.preview', '1');
      preview = sessionStorage.getItem(KEY + '.preview') === '1';
    } catch (e) { /* storage blocked */ }
    // The website never sells, so Pro on the web is only the free mode or a preview (never a stored flag).
    if (C.webMode === 'free') set(true, 'web-free');
    else if (preview) set(true, 'preview');
    else set(false, null);
    status = 'ready';
  }

  // Rough region for the website price: India by time zone or locale.
  function inIndia() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    return /Asia\/(Kolkata|Calcutta)/.test(tz) || (navigator.languages || [navigator.language]).some((l) => /-IN$/i.test(l || ''));
  }
  // In the apps only the store's own localised price is ever shown ('' until the store has answered).
  function price() {
    if (pkg && pkg.product && pkg.product.priceString) return pkg.product.priceString;
    if (isNative) return '';
    return inIndia() ? C.webPrice.india : C.webPrice.world;
  }

  // Returns 'purchased' | 'cancelled' | 'pending' | 'stores' (website: show store links) | 'unavailable'
  async function purchase() {
    if (!isNative) return 'stores';
    const P = plugin();
    if (!P) return 'unavailable';
    if (!pkg) await loadOfferings(); // the store may have been unreachable at launch
    if (!pkg) return 'unavailable';
    try {
      const res = await P.purchasePackage({ aPackage: pkg });
      applyCustomerInfo(res.customerInfo);
      return state.active ? 'purchased' : 'pending';
    } catch (e) {
      const data = (e && e.data) || {};
      if (e && (e.userCancelled || data.userCancelled || e.code === '1' || /cancel/i.test(e.message || ''))) return 'cancelled';
      // RevenueCat PAYMENT_PENDING_ERROR: e.g. Ask to Buy or a slow payment method; Pro unlocks when it clears.
      if (e && (e.code === '20' || /pending/i.test(e.message || ''))) return 'pending';
      console.warn('Purchase failed', e);
      return 'unavailable';
    }
  }
  // Returns true (Pro restored) | false (nothing to restore) | 'error' (store unreachable)
  async function restore() {
    if (!isNative) return state.active;
    const P = plugin(); if (!P || status === 'unconfigured') return 'error';
    try { const { customerInfo } = await P.restorePurchases(); applyCustomerInfo(customerInfo); } catch (e) { console.warn('Restore failed', e); return 'error'; }
    return state.active;
  }

  function storeLinks() {
    const ua = navigator.userAgent || '';
    const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    return {
      ios: !android ? C.storeLinks.ios : '',
      android: !ios ? C.storeLinks.android : '',
    };
  }

  return {
    init, purchase, restore, price, storeLinks, loadOfferings,
    isPro: () => !!state.active,
    get source() { return state.source; },
    get status() { return status; },
    isNative, platform,
    onChange(f) { listeners.push(f); },
  };
})();
