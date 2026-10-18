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
    const active = !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[C.entitlement]);
    set(active, 'store');
  }
  function pickPackage(offerings) {
    const pkgs = (offerings && offerings.current && offerings.current.availablePackages) || [];
    return pkgs.find((p) => p.product && p.product.identifier === C.productId)
      || pkgs.find((p) => p.packageType === 'LIFETIME') || pkgs[0] || null;
  }

  async function init() {
    if (isNative) {
      const P = plugin(), key = C.revenueCat[platform];
      if (!P || !key) { status = 'unconfigured'; return; }
      try {
        await P.configure({ apiKey: key });
        const { customerInfo } = await P.getCustomerInfo();
        applyCustomerInfo(customerInfo);
        if (P.addCustomerInfoUpdateListener) P.addCustomerInfoUpdateListener((info) => applyCustomerInfo(info));
        pkg = pickPackage(await P.getOfferings());
        status = 'ready';
      } catch (e) {
        // Offline or store unavailable: keep the last known state so a paid user is never locked out.
        console.warn('Purchases unavailable', e);
        status = 'error';
      }
      return;
    }
    // Website
    let preview = false;
    try {
      const q = new URLSearchParams(location.search);
      if (q.has(C.webPreviewParam)) sessionStorage.setItem(KEY + '.preview', '1');
      preview = sessionStorage.getItem(KEY + '.preview') === '1';
    } catch (e) { /* storage blocked */ }
    if (C.webMode === 'free') set(true, 'web-free');
    else if (preview) set(true, 'preview');
    else if (state.source !== 'store') set(false, null);
    status = 'ready';
  }

  // Rough region for the website price: India by time zone or locale.
  function inIndia() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    return /Asia\/(Kolkata|Calcutta)/.test(tz) || (navigator.languages || [navigator.language]).some((l) => /-IN$/i.test(l || ''));
  }
  function price() {
    if (pkg && pkg.product && pkg.product.priceString) return pkg.product.priceString;
    return inIndia() ? C.webPrice.india : C.webPrice.world;
  }

  // Returns 'purchased' | 'cancelled' | 'stores' (website: show store links) | 'unavailable'
  async function purchase() {
    if (!isNative) return 'stores';
    const P = plugin();
    if (!P || !pkg) return 'unavailable';
    try {
      const res = await P.purchasePackage({ aPackage: pkg });
      applyCustomerInfo(res.customerInfo);
      return state.active ? 'purchased' : 'unavailable';
    } catch (e) {
      if (e && (e.userCancelled || e.code === '1' || /cancel/i.test(e.message || ''))) return 'cancelled';
      console.warn('Purchase failed', e);
      return 'unavailable';
    }
  }
  async function restore() {
    if (!isNative) return state.active;
    const P = plugin(); if (!P) return false;
    try { const { customerInfo } = await P.restorePurchases(); applyCustomerInfo(customerInfo); } catch (e) { console.warn('Restore failed', e); }
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
    init, purchase, restore, price, storeLinks,
    isPro: () => !!state.active,
    get source() { return state.source; },
    get status() { return status; },
    isNative, platform,
    onChange(f) { listeners.push(f); },
  };
})();
