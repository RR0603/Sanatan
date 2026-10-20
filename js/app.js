// Antariksha app shell: view state, gestures, sensors, time, search, panels.
(function () {
  const A = window.Astronomy, Sky = LS.Sky, V = LS.VEDIC, I = LS.I18N;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const $ = (id) => document.getElementById(id);
  const t = (k) => I.t(k);
  const nm = (o) => I.name(o);
  const Nm = LS.Names;

  // ---------- icons ----------
  const svg = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
  const ICON = {
    menu: svg('<path d="M4 7h16M4 12h10M4 17h16"/>'),
    sky: svg('<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7zM5 16.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/>'),
    chakra: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5"/>'),
    pro: svg('<path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>'),
    layers: svg('<path d="M12 3 2.5 8.2 12 13.4l9.5-5.2z"/><path d="m2.5 12.2 9.5 5.2 9.5-5.2"/><path d="m2.5 16.2 9.5 5.2 9.5-5.2"/>'),
    aperture: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="16" r="14"/><g fill="currentColor" stroke="none"><path d="M16 2.5a13.5 13.5 0 0 1 11.7 6.75L18 14.8z"/><path d="M27.7 9.25a13.5 13.5 0 0 1 0 13.5L18.6 16.4z" opacity=".85"/><path d="M27.7 22.75A13.5 13.5 0 0 1 16 29.5l.9-11.2z"/><path d="M16 29.5a13.5 13.5 0 0 1-11.7-6.75L14 17.2z" opacity=".85"/><path d="M4.3 22.75a13.5 13.5 0 0 1 0-13.5l9.1 6.35z"/><path d="M4.3 9.25A13.5 13.5 0 0 1 16 2.5l-.9 11.2z" opacity=".85"/></g></svg>',
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'stroke-width="2"'),
    panchang: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M14.5 12.5a2.6 2.6 0 1 0 0 5 3 3 0 0 1 0-5z" fill="currentColor"/>'),
    art: svg('<path d="M4 18c2.5-1 3.5-4 6-5s5 1 6-1 1-4 4-5"/><circle cx="6" cy="7" r="1.2"/><circle cx="12" cy="5" r="1"/><circle cx="18" cy="9" r="1.2"/><path d="M5 20c3 0 4-2 7-2s4 2 7 2"/>'),
    names: svg('<text x="12" y="17.5" font-size="16" text-anchor="middle" fill="currentColor" stroke="none" font-family="Noto Sans Devanagari, serif">ॐ</text>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    compass: svg('<path d="M12 3 15 12H9z" fill="#ff7a5c" stroke="#ff7a5c"/><path d="M12 21 9 12h6z" fill="currentColor" opacity=".55" stroke="none"/>'),
    nakshatra: svg('<circle cx="5" cy="17" r="1.6"/><circle cx="11" cy="9" r="1.6"/><circle cx="18" cy="13" r="1.6"/><circle cx="16" cy="4.5" r="1.2"/><path d="m6.2 15.8 3.7-5.6M12.5 9.7l4 2.5M11.9 7.8l3.3-2.4"/>'),
    rashi: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5M6 6l3.2 3.2M14.8 14.8 18 18M18 6l-3.2 3.2M9.2 14.8 6 18"/>'),
    graha: svg('<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-20 12 12)"/>'),
    western: svg('<circle cx="4" cy="8" r="1.2"/><circle cx="10" cy="5" r="1.2"/><circle cx="14" cy="12" r="1.2"/><circle cx="20" cy="10" r="1.2"/><circle cx="12" cy="19" r="1.2"/><path d="m5 7.5 4-2M10.6 6l2.8 5M15.2 11.6l3.6-1.3M13.6 13l-1.2 4.8" stroke-dasharray="2 2"/>'),
    grid: svg('<path d="M3 12h18M12 3v18"/><ellipse cx="12" cy="12" rx="9" ry="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M4.5 7.5h15M4.5 16.5h15"/>'),
    atmosphere: svg('<circle cx="12" cy="13" r="3.5"/><path d="M12 5v2M5.6 7.6l1.4 1.4M18.4 7.6 17 9M3 18h18M6 21h12"/>'),
    ground: svg('<path d="M2 19 8.5 10l4 5 3-3.5L22 19z"/><path d="M2 21h20"/>'),
    milkyway: svg('<path d="M12 12c0-2 2.5-3 4-1.5s.5 5-3 5.5-6.5-2.5-6-6.5 5-6.5 9-5"/><path d="M12 12c0 2-2.5 3-4 1.5s-.5-5 3-5.5 6.5 2.5 6 6.5-5 6.5-9 5"/>'),
    sensor: svg('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2M3.5 9a8 8 0 0 0 0 6M20.5 9a8 8 0 0 1 0 6"/>'),
    camera: svg('<path d="M4 8h3l1.8-2.5h6.4L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/>'),
    night: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>'),
    eyeOpen: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    time: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>'),
    play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
    pause: svg('<path d="M8 5v14M16 5v14" stroke-width="2.6"/>'),
    rev: svg('<path d="M11 6 4 12l7 6zM20 6l-7 6 7 6z" fill="currentColor" stroke="none"/>'),
    fwd: svg('<path d="M13 6l7 6-7 6zM4 6l7 6-7 6z" fill="currentColor" stroke="none"/>'),
    today: svg('<path d="M3 17h18M6.3 17a5.7 5.7 0 0 1 11.4 0"/><path d="M12 5.5v2.2M4.6 9.1l1.6 1.4M19.4 9.1l-1.6 1.4M2.5 13.2h2M19.5 13.2h2M8 20.5h8"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.8h17M8.2 3v4M15.8 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/>'),
    share: svg('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 11.5v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
    bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    prev: svg('<path d="M15 5l-7 7 7 7"/>', 'stroke-width="2"'),
    next: svg('<path d="M9 5l7 7-7 7"/>', 'stroke-width="2"'),
    tonight: svg('<path d="M14.5 3.5a7.5 7.5 0 1 0 6 11.3A6 6 0 0 1 14.5 3.5z"/><path d="M5 4.5l.5 1.4 1.4.5-1.4.5L5 8.3l-.5-1.4-1.4-.5 1.4-.5z"/>'),
    ratri: svg('<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.2 6.2 0 0 0 10 10z"/><path d="M17 3.5l.6 1.6 1.6.6-1.6.6L17 7.9l-.6-1.6-1.6-.6 1.6-.6zM21 8.5l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" fill="currentColor"/><path d="M4 20.5c2.5-1.2 5-1.2 8 0s5.5 1.2 8 0"/>'),
    nada: svg('<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>'),
    meteor: svg('<path d="M4 20 15 9"/><path d="M8 20 17 11M4 16l9-9"/><circle cx="18.5" cy="5.5" r="2.5" fill="currentColor"/>'),
    yatra: svg('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>'),
    finder: '<svg viewBox="0 0 56 56"><defs><linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="#7ee8fa"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs><circle cx="28" cy="28" r="26" fill="rgba(10,14,32,.55)" stroke="rgba(255,255,255,.25)"/><path d="M44 28 22 16v24z" fill="url(#fg)"/></svg>',
  };

  // ---------- persisted state ----------
  const CITIES = [
    { id: 'ujjain', en: 'Ujjain', hi: 'उज्जैन', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    { id: 'varanasi', en: 'Varanasi (Kashi)', hi: 'वाराणसी (काशी)', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata' },
    { id: 'ayodhya', en: 'Ayodhya', hi: 'अयोध्या', lat: 26.7922, lon: 82.1998, tz: 'Asia/Kolkata' },
    { id: 'mathura', en: 'Mathura', hi: 'मथुरा', lat: 27.4924, lon: 77.6737, tz: 'Asia/Kolkata' },
    { id: 'prayagraj', en: 'Prayagraj', hi: 'प्रयागराज', lat: 25.4358, lon: 81.8463, tz: 'Asia/Kolkata' },
    { id: 'haridwar', en: 'Haridwar', hi: 'हरिद्वार', lat: 29.9457, lon: 78.1642, tz: 'Asia/Kolkata' },
    { id: 'kedarnath', en: 'Kedarnath', hi: 'केदारनाथ', lat: 30.7346, lon: 79.0669, tz: 'Asia/Kolkata' },
    { id: 'kurukshetra', en: 'Kurukshetra', hi: 'कुरुक्षेत्र', lat: 29.9695, lon: 76.8783, tz: 'Asia/Kolkata' },
    { id: 'dwarka', en: 'Dwarka', hi: 'द्वारका', lat: 22.2394, lon: 68.9678, tz: 'Asia/Kolkata' },
    { id: 'puri', en: 'Puri', hi: 'पुरी', lat: 19.8135, lon: 85.8312, tz: 'Asia/Kolkata' },
    { id: 'rameswaram', en: 'Rameswaram', hi: 'रामेश्वरम्', lat: 9.2876, lon: 79.3129, tz: 'Asia/Kolkata' },
    { id: 'delhi', en: 'New Delhi', hi: 'नई दिल्ली', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
    { id: 'mumbai', en: 'Mumbai', hi: 'मुम्बई', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
    { id: 'kolkata', en: 'Kolkata', hi: 'कोलकाता', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    { id: 'chennai', en: 'Chennai', hi: 'चेन्नई', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
    { id: 'bengaluru', en: 'Bengaluru', hi: 'बेंगलुरु', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    { id: 'kathmandu', en: 'Kathmandu', hi: 'काठमाण्डू', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu' },
    { id: 'london', en: 'London', hi: 'लंदन', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    { id: 'newyork', en: 'New York', hi: 'न्यूयॉर्क', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    { id: 'toronto', en: 'Toronto', hi: 'टोरंटो', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
    { id: 'sanfrancisco', en: 'San Francisco', hi: 'सैन फ़्रांसिस्को', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
    { id: 'dubai', en: 'Dubai', hi: 'दुबई', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
    { id: 'singapore', en: 'Singapore', hi: 'सिंगापुर', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
    { id: 'sydney', en: 'Sydney', hi: 'सिडनी', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  ];
  const DEVICE_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; } })();

  const DEFAULTS = {
    lang: (navigator.language || '').toLowerCase().startsWith('hi') ? 'hi' : 'en',
    loc: { ...CITIES[0] },
    nakshatra: true, rashi: true, graha: true, constellations: false, art: true, grid: false, eqGrid: false,
    atmosphere: true, ground: true, milkyway: true, labels: true, starNames: true, night: false,
    groundOpacity: 0.82, starBrightness: 1, arFov: 62, compassOffset: 0,
    mode: 'sky', names: 'vedic', jyTab: 'kundali', kStyle: 'north', kVarga: 'D1', birth: null, profiles: [],
    theme: 'nova', tabbar: false, reminders: null, milan: null, ratri: false, nada: false, meteors: false,
    view: null,
  };
  const KEY = 'antariksha.v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  const S = { ...DEFAULTS, ...saved, loc: { ...DEFAULTS.loc, ...(saved.loc || {}) } };
  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify({ ...S, view: { az: view.az, alt: view.alt, fov: view.fov } })); } catch (e) { /* private mode */ }
    }, 300);
  }

  // ---------- view & time ----------
  const view = {
    az: S.view ? S.view.az : (S.loc.lat >= 0 ? 160 : 20), alt: S.view ? S.view.alt : 32, fov: S.view ? S.view.fov : 90,
    sensor: false, ar: false, basis: null, vaz: 0, valt: 0, anim: null, track: false,
  };
  const clock = { sim: Date.now(), rate: 1, lastReal: performance.now() };
  let selected = null;
  let dirty = true;
  const invalidate = () => { dirty = true; };

  function basisFromAzAlt(azDeg, altDeg) {
    const az = azDeg * D2R, alt = altDeg * D2R;
    const f = [Math.sin(az) * Math.cos(alt), Math.cos(az) * Math.cos(alt), Math.sin(alt)];
    const r = [Math.cos(az), -Math.sin(az), 0];
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    return { r, u, f };
  }
  const azAltOf = (e) => ({ az: (Math.atan2(e[0], e[1]) * R2D + 360) % 360, alt: Math.asin(Math.max(-1, Math.min(1, e[2]))) * R2D });

  // ---------- renderer ----------
  const mw = new Image();
  mw.src = 'img/milkyway.png';
  const R = LS.Renderer.create($('gl'), $('sky'), mw);
  R.onTextureReady = invalidate;
  LS.Renderer.onArt = invalidate;
  function resize() { R.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1); invalidate(); }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();

  // ---------- astronomy cache ----------
  let astro = null, panch = null, panchAt = 0, panchSim = 0, sunDay = null;
  function observer() { return new A.Observer(S.loc.lat, S.loc.lon, 0); }
  function computeAstro() {
    const time = A.MakeTime(new Date(clock.sim));
    const obs = observer();
    const fr = Sky.frames(time, obs);
    // Graha positions change slowly; reuse them for a few seconds of simulated time.
    const reuse = astro && Math.abs(astro.sim - clock.sim) < 5000 && astro.locKey === locKey();
    const grahas = reuse ? astro.grahas : Sky.grahas(time, obs, fr);
    const sim = reuse ? astro.sim : clock.sim;
    for (const id of Sky.GRAHA_ORDER) {
      const g = grahas[id];
      if (g.eqj) g.enu = Sky.apply(fr.eqj2enu, g.eqj[0], g.eqj[1], g.eqj[2]);
    }
    // Lunar nodes are ecliptic points: refresh them against the current frame.
    for (const id of ['rahu', 'ketu']) {
      const v = Sky.eclVec(grahas[id].tropLon, 0);
      grahas[id].enu = Sky.apply(fr.ect2enu, v[0], v[1], v[2]);
    }
    const sunAlt = Math.asin(grahas.surya.enu[2]) * R2D;
    astro = { sim, time, obs, fr, grahas, sunAlt, ayanamsa: Sky.ayanamsa(time), locKey: locKey() };
    return astro;
  }
  const locKey = () => `${S.loc.lat.toFixed(4)},${S.loc.lon.toFixed(4)}`;

  function refreshPanchang(force) {
    const nowReal = performance.now();
    if (!force && nowReal - panchAt < 1000 && Math.abs(clock.sim - panchSim) < 60e3) return;
    if (!force && Math.abs(clock.sim - panchSim) < 20e3 && nowReal - panchAt < 15000) return;
    panchAt = nowReal; panchSim = clock.sim;
    try {
      const time = A.MakeTime(new Date(clock.sim));
      panch = Sky.panchang(time, observer());
      const mid = localMidnight(clock.sim, S.loc.tz);
      sunDay = Sky.sunEvents(observer(), new Date(mid));
    } catch (e) { console.warn('panchang failed', e); }
    renderHud(); if (!$('panchang').hidden) renderPanchang();
  }

  // ---------- time zone helpers ----------
  const tzOffsetMin = (tz, ms) => LS.TZ.offsetMin(tz, ms);
  const localMidnight = (ms, tz) => LS.TZ.midnight(ms, tz);
  const locale = () => (I.lang === 'hi' ? 'hi-IN' : 'en-IN');
  function fmt(ms, opts) {
    try { return new Intl.DateTimeFormat(locale(), { timeZone: S.loc.tz, ...opts }).format(new Date(ms)); } catch (e) { return new Date(ms).toLocaleString(); }
  }
  const fmtTime = (ms, sec) => fmt(ms, { hour: '2-digit', minute: '2-digit', ...(sec ? { second: '2-digit' } : {}), hour12: false });
  const fmtDate = (ms) => fmt(ms, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = (ms) => fmt(ms, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const dms = (deg) => { const d = Math.floor(deg), m = Math.floor((deg - d) * 60); return `${I.num(d)}°${I.num(String(m).padStart(2, '0'))}′`; };
  const hms = (h) => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), M = Math.floor((h - H) * 60), Sx = Math.round(((h - H) * 60 - M) * 60); return `${H}h${String(M).padStart(2, '0')}m${String(Math.min(Sx, 59)).padStart(2, '0')}s`; };
  const sgnDms = (d) => (d < 0 ? '−' : '+') + dms(Math.abs(d));

  // ---------- names ----------
  function tithiName(idx) {
    const n = idx % 15;
    const tn = n < 14 ? V.tithis[n] : (idx < 15 ? V.tithis[14] : V.tithis[15]);
    return `${nm(V.pakshas[idx < 15 ? 0 : 1])} ${nm(tn)}`;
  }
  const GREEK = { Alp: 'α', Bet: 'β', Gam: 'γ', Del: 'δ', Eps: 'ε', Zet: 'ζ', Eta: 'η', The: 'θ', Iot: 'ι', Kap: 'κ', Lam: 'λ', Mu: 'μ', Nu: 'ν', Xi: 'ξ', Omi: 'ο', Pi: 'π', Rho: 'ρ', Sig: 'σ', Tau: 'τ', Ups: 'υ', Phi: 'φ', Chi: 'χ', Psi: 'ψ', Ome: 'ω' };
  const starDesig = {};
  for (const [k, i] of Object.entries(LS_DATA.stars.keys)) {
    if (k.startsWith('HIP')) { if (!starDesig[i]) starDesig[i] = k; continue; }
    const [b, con] = k.split(' ');
    const base = b.split('-');
    const pretty = GREEK[base[0]] ? `${GREEK[base[0]]}${base[1] ? superscript(base[1]) : ''} ${con}` : `${b} ${con}`;
    if (!starDesig[i] || starDesig[i].startsWith('HIP') || (GREEK[base[0]] && !/[α-ω]/.test(starDesig[i]))) starDesig[i] = pretty;
  }
  function superscript(s) { return s.replace(/[0-9]/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); }
  function starTitle(i) {
    const vn = R.data.vedicNames[i];
    if (vn && (Nm.isVedic() || !LS_DATA.stars.names[i])) return { title: I.lang === 'hi' ? vn.hi : vn.en, sub: [I.lang === 'hi' ? vn.en : vn.hi, LS_DATA.stars.names[i], starDesig[i]].filter(Boolean).join(' · ') };
    if (vn) return { title: LS_DATA.stars.names[i], sub: [I.lang === 'hi' ? vn.hi : vn.en, starDesig[i]].filter(Boolean).join(' · ') };
    return { title: LS_DATA.stars.names[i] || starDesig[i] || `#${i}`, sub: LS_DATA.stars.names[i] ? starDesig[i] || '' : '' };
  }

  // ---------- objects ----------
  function starVec(i) { const v = R.data.vec; return [v[i * 3], v[i * 3 + 1], v[i * 3 + 2]]; }
  function objEnu(obj, as) {
    const fr = as.fr;
    switch (obj.type) {
      case 'graha': return as.grahas[obj.id].enu;
      case 'star': { const v = starVec(obj.id); return Sky.apply(fr.eqj2enu, v[0], v[1], v[2]); }
      case 'nakshatra': {
        const i = obj.id === 'abhijit' ? R.data.abhFig.yt : R.data.nakFigs[obj.id].yt;
        const v = starVec(i); return Sky.apply(fr.eqj2enu, v[0], v[1], v[2]);
      }
      case 'rashi': { const v = Sky.eclVec(as.ayanamsa + obj.id * 30 + 15, 0); return Sky.apply(fr.ect2enu, v[0], v[1], v[2]); }
      case 'constellation': { const c = R.data.western.find((x) => x.id === obj.id); return Sky.apply(fr.eqj2enu, c.label[0], c.label[1], c.label[2]); }
      case 'asterism': { const v = starVec(R.data.asterisms[obj.id].labelStar); return Sky.apply(fr.eqj2enu, v[0], v[1], v[2]); }
    }
    return null;
  }

  // ---------- main loop ----------
  let lastFrame = 0, lastHud = 0;
  const perf = { ms: 0, n: 0 };
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - clock.lastReal) / 1000);
    clock.lastReal = now;
    if (clock.rate !== 0) clock.sim += dt * 1000 * clock.rate;
    // In live mode stay locked to the real clock even if frames were dropped.
    if (clock.rate === 1 && Math.abs(clock.sim - Date.now()) < 5000) clock.sim = Date.now();

    // inertia
    if (!view.sensor && !drag.active && (Math.abs(view.vaz) > 0.01 || Math.abs(view.valt) > 0.01)) {
      view.az = (view.az + view.vaz * dt * 60 + 360) % 360;
      view.alt = clamp(view.alt + view.valt * dt * 60, -90, 90);
      const decay = Math.pow(0.9, dt * 60);
      view.vaz *= decay; view.valt *= decay;
      invalidate();
    }
    if (view.anim) {
      const a = view.anim, k = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - k, 3);
      view.az = (a.az0 + a.daz * e + 360) % 360;
      view.alt = a.alt0 + (a.alt1 - a.alt0) * e;
      view.fov = a.fov0 + (a.fov1 - a.fov0) * e;
      if (k >= 1) view.anim = null;
      invalidate();
    }

    if (S.mode === 'jyotish') jyFrame(now);
    if (PAGE_MODES.includes(S.mode) && !dirty && now - lastFrame < 1000) return;
    const realtime = clock.rate === 1;
    const interval = view.fov < 5 ? 100 : view.fov < 30 ? 400 : 1000;
    const timeDue = clock.rate !== 0 && (!realtime || now - lastFrame > interval);
    if (!(dirty || timeDue || view.sensor || selected)) return;
    if (selected && !dirty && !timeDue && !view.sensor && now - lastFrame < 33) return;

    const as = computeAstro();
    if (selected && view.track && !view.sensor && !view.anim && !drag.active) {
      const e = objEnu(selected, as);
      if (e) { const aa = azAltOf(e); view.az = aa.az; view.alt = clamp(aa.alt - sheetOffset(view.fov), -90, 90); }
    }
    if (!view.sensor || !view.basis) view.basis = basisFromAzAlt(view.az, view.alt);
    const t0 = performance.now();
    R.render({
      basis: view.basis, fov: view.fov, fr: as.fr, grahas: as.grahas, sunAlt: as.sunAlt, ayanamsa: as.ayanamsa,
      settings: S, ar: view.ar, time: now, selectedEnu: selected ? objEnu(selected, as) : null,
    });
    // Keep motion fluid: if frames take too long at 3x, render the overlay at 2x instead.
    if (view.sensor || drag.active) {
      perf.ms = perf.ms * 0.9 + (performance.now() - t0) * 0.1;
      if (++perf.n > 60 && perf.ms > 14 && R.lowerQuality()) invalidate();
    }
    if (S.mode === 'sky') LS.Pages.updateFinder(selected, selected ? objEnu(selected, as) : null, view.basis, view.fov);
    dirty = false; lastFrame = now;
    if (now - lastHud > 250) { lastHud = now; renderClock(); renderReadout(); renderPlaceChip(); refreshPanchang(false); if (selected && !$('sheet').hidden) updateSheetLive(); }
  }

  // ---------- gestures ----------
  const sky = $('sky');
  const drag = { active: false, pts: new Map(), sx: 0, sy: 0, moved: false, pinch0: 0, fov0: 0, lastT: 0 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function pxToRad() { return (2 * Math.tan(view.fov * D2R / 4)) / (window.innerHeight / 2); }

  sky.addEventListener('pointerdown', (e) => {
    sky.setPointerCapture(e.pointerId);
    drag.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    view.anim = null; view.vaz = 0; view.valt = 0;
    if (drag.pts.size === 1) { drag.active = true; drag.sx = e.clientX; drag.sy = e.clientY; drag.moved = false; drag.lastT = performance.now(); }
    if (drag.pts.size === 2) { const [a, b] = [...drag.pts.values()]; drag.pinch0 = Math.hypot(a.x - b.x, a.y - b.y); drag.fov0 = view.fov; drag.moved = true; }
  });
  sky.addEventListener('pointermove', (e) => {
    const p = drag.pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    if (drag.pts.size >= 2) {
      const [a, b] = [...drag.pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag.pinch0 > 0) setFov(drag.fov0 * drag.pinch0 / d);
      return;
    }
    if (!drag.moved) return;
    const k = pxToRad() * R2D;
    if (view.sensor) {
      S.compassOffset = clamp(S.compassOffset - dx * k * 0.5, -45, 45);
      $('rngCompass').value = S.compassOffset; persist();
      return;
    }
    view.track = false;
    const cosAlt = Math.max(0.25, Math.cos(view.alt * D2R));
    const daz = -dx * k / cosAlt, dalt = dy * k;
    view.az = (view.az + daz + 360) % 360;
    view.alt = clamp(view.alt + dalt, -90, 90);
    const now = performance.now(), dtf = Math.max(1, (now - drag.lastT) / 16.7);
    view.vaz = daz / dtf; view.valt = dalt / dtf; drag.lastT = now;
    invalidate();
  });
  function endPointer(e) {
    drag.pts.delete(e.pointerId);
    if (drag.pts.size === 0) {
      drag.active = false;
      if (performance.now() - drag.lastT > 80) { view.vaz = 0; view.valt = 0; }
      if (!drag.moved && e.type === 'pointerup') tap(e.clientX, e.clientY);
      persist();
    }
    if (drag.pts.size === 1) { const [p] = [...drag.pts.values()]; drag.sx = p.x; drag.sy = p.y; drag.pinch0 = 0; }
  }
  sky.addEventListener('pointerup', endPointer);
  sky.addEventListener('pointercancel', endPointer);
  sky.addEventListener('wheel', (e) => { e.preventDefault(); setFov(view.fov * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  sky.addEventListener('dblclick', (e) => { const o = R.hitTest(e.clientX, e.clientY); if (o) { select(o); goTo(o, true); } });

  function setFov(f) {
    view.fov = clamp(f, 1, 180);
    if (view.ar) { S.arFov = clamp(view.fov, 30, 100); $('rngArFov').value = S.arFov; }
    invalidate(); persist();
  }
  function tap(x, y) {
    if (!$('dock').hidden) { $('dock').hidden = true; syncDock(); return; }
    const o = R.hitTest(x, y);
    if (o) select(o); else { selected = null; view.track = false; hideSheet(); invalidate(); }
  }
  // On phones the info sheet covers the lower half, so aim a little lower to keep the target above it.
  function sheetOffset(fov) {
    if (window.innerWidth > 720 || $('sheet').hidden) return 0;
    return fov * 0.24;
  }
  function goTo(obj, zoom) {
    if (view.sensor) return;
    const as = astro || computeAstro();
    const e = objEnu(obj, as); if (!e) return;
    const aa = azAltOf(e);
    let daz = aa.az - view.az; daz = ((daz + 540) % 360) - 180;
    const fov1 = zoom ? Math.min(view.fov, obj.type === 'rashi' ? 50 : obj.type === 'nakshatra' ? 40 : 30) : view.fov;
    const alt1 = clamp(aa.alt - sheetOffset(fov1), -90, 90);
    view.anim = { t0: performance.now(), dur: 900, az0: view.az, daz, alt0: view.alt, alt1, fov0: view.fov, fov1 };
    view.vaz = view.valt = 0;
  }

  // ---------- sensors / AR ----------
  // Magnetic declination for the current place (WMM2025), cached per location.
  let declCache = { key: '', value: 0 };
  function magneticDeclination() {
    const key = locKey();
    if (declCache.key !== key) {
      try { declCache = { key, value: LS.Magnetic.declination(S.loc.lat, S.loc.lon, LS.Magnetic.decimalYear(new Date())) }; }
      catch (e) { declCache = { key, value: 0 }; }
    }
    return declCache.value;
  }
  // Returns true once motion data is flowing (or at least permitted and listening).
  async function setSensor(on) {
    if (on === view.sensor) return view.sensor;
    if (on) {
      if (!window.isSecureContext) { toast(t('https'), 6000); return false; }
      const ok = await LS.Sensors.start((b) => { view.basis = b; invalidate(); }, (err) => {
        if (err === 'denied') showHelp('sensorBlocked'); else toast(t('sensorNone'), 6000);
        setSensor(false); if (view.ar) setAR(false);
      }, () => S.compassOffset, () => magneticDeclination());
      if (!ok) { syncDock(); return false; }
      view.sensor = true; view.track = false; view.anim = null;
      flag('usedSensor', 1); if (coach.step === 'sensor') hideCoach();
      toast(`${t('sensorHint')} · ${t('calibHint')}`);
    } else {
      LS.Sensors.stop();
      if (view.basis) { const aa = azAltOf(view.basis.f); view.az = aa.az; view.alt = aa.alt; }
      view.sensor = false; view.basis = null;
    }
    syncDock(); invalidate();
    return view.sensor;
  }
  async function setAR(on) {
    if (on === view.ar) return;
    const video = $('cam');
    if (on) {
      // Motion permission first, alone: iOS refuses a second prompt that appears while one is open.
      const sensing = await setSensor(true);
      if (!sensing) { syncDock(); return; }
      try { await LS.Sensors.startCamera(video); } catch (e) { toast(t('cameraDenied'), 6000); syncDock(); return; }
      view.ar = true; view.fovBeforeAr = view.fov; view.fov = S.arFov;
      flag('usedCamera', 1); if (coach.step) hideCoach();
      document.body.classList.add('ar');
    } else {
      LS.Sensors.stopCamera(video);
      view.ar = false; document.body.classList.remove('ar');
      if (view.fovBeforeAr) view.fov = view.fovBeforeAr;
      setSensor(false);
    }
    syncDock(); invalidate();
  }

  // ---------- dock ----------
  const DOCK = [
    { key: 'ratri', icon: 'ratri', action: () => setRatri(!S.ratri), state: () => !!S.ratri },
    { key: 'yatra', icon: 'yatra', cyan: true, action: () => { $('dock').hidden = true; LS.Yatra.start(); }, state: () => LS.Yatra.running },
    { key: 'meteors', icon: 'meteor', cyan: true, action: () => setMeteors(!S.meteors), state: () => !!S.meteors },
    { key: 'nada', icon: 'nada', action: () => setNada(!LS.Nada.on), state: () => LS.Nada.on }, { sep: true },
    { key: 'nakshatra', icon: 'nakshatra' }, { key: 'rashi', icon: 'rashi' }, { key: 'graha', icon: 'graha' },
    { key: 'constellations', icon: 'western', label: 'mandala' }, { key: 'grid', icon: 'grid' },
    { key: 'names', icon: 'names', action: () => setNames(Nm.isVedic() ? 'western' : 'vedic'), state: () => Nm.isVedic(), dyn: () => (Nm.isVedic() ? 'vedicShort' : 'westernShort') }, { sep: true },
    { key: 'atmosphere', icon: 'atmosphere' }, { key: 'ground', icon: 'ground' }, { key: 'milkyway', icon: 'milkyway' }, { sep: true },
    { key: 'sensor', icon: 'sensor', cyan: true, action: () => setSensor(!view.sensor), state: () => view.sensor },
    { key: 'camera', icon: 'camera', cyan: true, action: () => setAR(!view.ar), state: () => view.ar },
    { key: 'art', icon: 'art' },
    { key: 'pro', icon: 'pro', action: () => { $('dock').hidden = true; showPaywall(); }, state: () => LS.Pro.isPro(), label: 'proLocked' },
    { key: 'tonightBtn', icon: 'tonight', cyan: true, action: () => { $('dock').hidden = true; toggle('tonight'); }, state: () => !$('tonight').hidden, label: 'tonight' },
    { key: 'panchangBtn', icon: 'panchang', action: () => { $('dock').hidden = true; toggle('panchang'); }, state: () => !$('panchang').hidden, label: 'panchang' },
    { key: 'time', icon: 'time', cyan: true, action: () => { $('dock').hidden = true; toggle('timebar'); }, state: () => !$('timebar').hidden, label: 'time' },
    { key: 'night', icon: 'night', action: () => { S.night = !S.night; applyNight(); }, state: () => S.night },
    { key: 'hideUi', icon: 'eye', action: () => setZen(true), state: () => false },
  ];
  function buildDock() {
    const dock = $('dock');
    dock.innerHTML = '';
    for (const d of DOCK) {
      if (d.sep) { const s = document.createElement('i'); s.className = 'dock-sep'; dock.appendChild(s); continue; }
      const b = document.createElement('button');
      b.className = 'dock-btn' + (d.cyan ? ' cyan' : '');
      b.dataset.key = d.key;
      b.innerHTML = `${ICON[d.icon]}<span></span>`;
      b.addEventListener('click', () => {
        if (d.action) d.action(); else { S[d.key] = !S[d.key]; invalidate(); persist(); }
        syncDock();
      });
      dock.appendChild(b);
    }
  }
  function syncDock() {
    for (const b of $('dock').querySelectorAll('.dock-btn')) {
      const d = DOCK.find((x) => x.key === b.dataset.key);
      b.classList.toggle('on', d.state ? d.state() : !!S[d.key]);
      const lbl = d.dyn ? d.dyn() : (d.label || d.key);
      b.querySelector('span').textContent = t(lbl);
      b.title = d.key === 'names' ? t(Nm.isVedic() ? 'namesVedic' : 'namesWestern') : t(lbl);
    }
    for (const b of $('settingToggles').querySelectorAll('.toggle')) b.classList.toggle('on', !!S[b.dataset.key]);
    $('btnSensor').classList.toggle('on', view.sensor);
    $('btnCam').hidden = !view.sensor && !view.ar;
    $('btnCam').classList.toggle('on', view.ar);
    $('btnLayers').classList.toggle('on', !$('dock').hidden);
    $('langSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.lang === I.lang));
    $('namesSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.names === Nm.culture));
    $('themeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.theme === S.theme));
    $('tabbarToggle').classList.toggle('on', !!S.tabbar);
    $('ratriToggle').classList.toggle('on', !!S.ratri);
  }
  // Ratri: the immersive night mode. The switch dissolves through a golden veil from where you tapped.
  let lastTap = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });
  function setRatri(on) {
    const veil = $('veil');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const swap = () => { S.ratri = on; applyTheme(); LS.FX.wake(); placeGlider(); };
    if (reduce) { swap(); } else {
      veil.style.setProperty('--vx', `${lastTap.x}px`); veil.style.setProperty('--vy', `${lastTap.y}px`);
      veil.classList.remove('go', 'out'); void veil.offsetWidth; veil.classList.add('go');
      setTimeout(() => { swap(); veil.classList.add('out'); }, 560);
      setTimeout(() => veil.classList.remove('go', 'out'), 1500);
    }
    if (on) toast(t('ratriOn'), 3200);
  }
  function setNada(on) {
    if (on) {
      if (!LS.Nada.supported || !LS.Nada.start()) { toast(t('nadaUnsupported')); return; }
      toast(t('nadaOn'), 3200);
    } else LS.Nada.stop();
    S.nada = on; persist(); syncDock();
  }
  function setMeteors(on) {
    S.meteors = on; persist(); syncDock(); LS.FX.wake();
    if (!on) return;
    const act = LS.Ulka.active(clock.sim)[0];
    if (act) toast(t('meteorsOn').replace('{name}', nm(act.name)).replace('{c}', LS.VEDIC.constellations[act.con] ? (I.lang === 'hi' ? LS.VEDIC.constellations[act.con][1] : LS.VEDIC.constellations[act.con][0]) : act.con), 5000);
    else { const nx = LS.Ulka.next(clock.sim); toast(t('meteorsNone').replace('{name}', nm(nx.name)).replace('{date}', fmt(nx.peakMs, { day: 'numeric', month: 'short' })), 5000); }
  }
  // Close panels and stop the sensor/camera before Yatra takes over the view.
  function prepare() {
    for (const id of ['panchang', 'tonight', 'timebar', 'dock', 'intro', 'help']) $(id).hidden = true;
    close('sheet'); if (!$('drawer').hidden) close('drawer');
    if (view.ar) setAR(false); else if (view.sensor) setSensor(false);
    setZen(false);
  }
  function applyTheme() {
    S.theme = S.theme === 'classic' ? 'classic' : 'nova';
    document.body.classList.toggle('theme-nova', S.theme === 'nova');
    document.body.classList.toggle('theme-classic', S.theme === 'classic');
    // The bottom tab bar is optional (off unless turned on in Settings → Design).
    document.body.classList.toggle('has-tabbar', !!S.tabbar);
    document.body.classList.toggle('ratri', !!S.ratri);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = S.theme === 'nova' ? '#050714' : '#04060f';
    requestAnimationFrame(placeGlider);
    syncDock(); persist();
  }
  function applyNight() { document.body.classList.toggle('night', !!S.night); persist(); }
  function setZen(on) { document.body.classList.toggle('zen', on); $('btnShowUi').hidden = !on; }

  // ---------- settings drawer ----------
  const SETTING_TOGGLES = ['nakshatra', 'rashi', 'graha', 'constellations', 'art', 'grid', 'eqGrid', 'atmosphere', 'ground', 'milkyway', 'labels', 'starNames'];
  function buildSettings() {
    const box = $('settingToggles'); box.innerHTML = '';
    for (const k of SETTING_TOGGLES) {
      const b = document.createElement('button');
      b.className = 'toggle'; b.dataset.key = k;
      b.innerHTML = `<span></span><i></i>`;
      b.addEventListener('click', () => { S[k] = !S[k]; syncDock(); invalidate(); persist(); });
      box.appendChild(b);
    }
    const sel = $('citySelect');
    sel.addEventListener('change', () => {
      const c = CITIES.find((x) => x.id === sel.value); if (!c) return;
      setLocation({ ...c });
    });
    $('btnApplyLoc').addEventListener('click', () => {
      const lat = parseFloat($('latInput').value), lon = parseFloat($('lonInput').value);
      if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
      setLocation({ id: 'custom', en: `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`, hi: `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`, lat, lon, tz: DEVICE_TZ });
    });
    $('btnGeo').addEventListener('click', () => geolocate(true));
    const rng = (id, key, after) => {
      const el = $(id); el.value = S[key];
      el.addEventListener('input', () => { S[key] = parseFloat(el.value); after && after(); invalidate(); persist(); });
    };
    rng('rngGround', 'groundOpacity');
    rng('rngStars', 'starBrightness');
    rng('rngArFov', 'arFov', () => { if (view.ar) view.fov = S.arFov; });
    rng('rngCompass', 'compassOffset');
    $('btnResetView').addEventListener('click', () => {
      S.compassOffset = 0; $('rngCompass').value = 0;
      view.anim = { t0: performance.now(), dur: 900, az0: view.az, daz: (((S.loc.lat >= 0 ? 160 : 20) - view.az + 540) % 360) - 180, alt0: view.alt, alt1: 32, fov0: view.fov, fov1: 90 };
      close('drawer');
    });
  }
  function renderSettingsText() {
    for (const b of $('settingToggles').querySelectorAll('.toggle')) b.querySelector('span').textContent = t(b.dataset.key === 'constellations' ? 'mandala' : b.dataset.key);
    const sel = $('citySelect');
    sel.innerHTML = `<option value="" disabled>${t('location')}</option>` + CITIES.map((c) => `<option value="${c.id}">${nm(c)}</option>`).join('');
    sel.value = CITIES.some((c) => c.id === S.loc.id) ? S.loc.id : '';
    $('latInput').value = S.loc.lat.toFixed(4); $('lonInput').value = S.loc.lon.toFixed(4);
  }

  function setLocation(loc) {
    S.loc = loc; persist();
    showLocToast();
    renderSettingsText();
    astro = null; refreshPanchang(true); invalidate();
    if (selected) showSheet(selected);
    LS.Pages.onLocation(); LS.Pages.resetCalendar(); renderPage();
  }
  function geolocate(userAsked) {
    const done = (lat, lon) => {
      setLocation({ id: 'gps', en: `My location · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, hi: `मेरा स्थान · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, lat, lon, tz: DEVICE_TZ });
      if (userAsked) close('drawer');
    };
    const fail = () => { if (userAsked) toast(t('locFailed')); };
    if (userAsked) toast(t('locating'));
    // In the iOS / Android apps use the native location service (one clear system prompt).
    const G = LS.Pro.isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
    if (G) {
      G.getCurrentPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60e3 })
        .then((pos) => done(pos.coords.latitude, pos.coords.longitude)).catch(fail);
      return;
    }
    if (!navigator.geolocation) { fail(); return; }
    navigator.geolocation.getCurrentPosition((pos) => done(pos.coords.latitude, pos.coords.longitude), fail,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60e3 });
  }

  // ---------- panels ----------
  const PANELS = ['panchang', 'tonight', 'drawer', 'timebar'];
  function toggle(id) { if ($(id).hidden) open(id); else close(id); }
  function open(id) {
    if (id === 'drawer') { $('scrim').hidden = false; }
    if ((id === 'panchang' || id === 'tonight') && window.innerWidth <= 720) hideSheet();
    if (id === 'panchang') $('tonight').hidden = true;
    if (id === 'tonight') $('panchang').hidden = true;
    $(id).hidden = false;
    if (id === 'panchang') renderPanchang();
    if (id === 'tonight') LS.Pages.renderTonightPanel();
    if (id === 'timebar') syncTimebar();
    syncDock();
  }
  function close(id) {
    $(id).hidden = true;
    if (id === 'drawer') $('scrim').hidden = true;
    if (id === 'sheet') { selected = null; view.track = false; invalidate(); }
    syncDock();
  }
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(b.dataset.close)));
  $('scrim').addEventListener('click', () => close('drawer'));

  function renderHud() { renderClock(); }
  // Bottom-right clock, Stellarium-style: a small line (tithi when live) above a large HH:MM.
  function renderClock() {
    $('hudTime').textContent = fmtTime(clock.sim);
    $('hudDate').textContent = `${fmtDate(clock.sim)} · ${nm(S.loc)}`;
    const live = clock.rate === 1 && Math.abs(clock.sim - Date.now()) < 5000;
    const sub = $('hudTithi');
    if (live && panch) { sub.innerHTML = `<i class="dot"></i>${tithiName(panch.tithi)}`; sub.classList.add('tithi'); }
    else if (live) { sub.textContent = t('realTime'); sub.classList.remove('tithi'); }
    else { sub.textContent = `${fmt(clock.sim, { day: 'numeric', month: 'short', year: 'numeric' })} · ${clock.rate === 0 ? t('paused') : '×' + rateText()}`; sub.classList.remove('tithi'); }
    if (!$('timebar').hidden) syncTimebar(true);
  }
  // Nova: a small glass chip at the top with the place and whether the sky is live.
  function renderPlaceChip() {
    const live = clock.rate === 1 && Math.abs(clock.sim - Date.now()) < 5000;
    const name = nm(S.loc).replace(/^(My location|मेरा स्थान) · .*/, I.lang === 'hi' ? 'मेरा स्थान' : 'My location');
    $('pcText').textContent = live ? name : `${name} · ${fmtShort(clock.sim)}`;
    $('placeChip').classList.toggle('live', live);
  }
  function renderReadout() {
    const aa = view.basis ? azAltOf(view.basis.f) : { az: view.az, alt: view.alt };
    const dir = V.directionsShort[Math.round(aa.az / 45) % 8];
    const az = Math.round(aa.az) % 360, alt = Math.round(aa.alt) || 0;
    let sensorTxt = '';
    if (view.sensor) {
      const st = LS.Sensors.status();
      sensorTxt = st.receiving ? ` · <span class="live">● ${t('sensorLive')}${st.absolute ? '' : ' ' + t('sensorRelative')}</span>` : ` · <span class="wait">○ ${t('sensorWaiting')}</span>`;
    }
    const fovTxt = `${t('fov')} ${I.num(view.fov.toFixed(1))}°`;
    $('readout').innerHTML = view.sensor || view.fov < 179 ? `${fovTxt}${view.sensor ? ` · ${dir} ${I.num(az)}° · ${I.num(alt)}°` : ''}${sensorTxt}` : fovTxt;
    $('compassNeedle').style.transform = `rotate(${-aa.az}deg)`;
    $('dial').style.transform = `rotate(${-aa.az}deg)`;
    $('dial').style.setProperty('--upright', `${aa.az}deg`);
  }

  function renderPanchang() {
    if (!panch) return;
    $('pTitle').textContent = `${fmtDate(clock.sim)} · ${nm(S.loc)}`;
    $('pGrid').innerHTML = panchangCells(panch, sunDay && { sunrise: sunDay.rise && sunDay.rise.date.getTime(), sunset: sunDay.set && sunDay.set.date.getTime() });
  }
  // Panchang grid cells; sun = { sunrise, sunset } in ms.
  function panchangCells(p, sun) {
    const nk = V.nakshatras[p.nakshatra];
    const cells = [
      [t('vara'), nm(V.varas[p.vara]), '', false],
      [t('tithi'), tithiName(p.tithi), p.tithiEnd ? `${t('until')} ${fmtShort(p.tithiEnd.date.getTime())}` : '', false],
      [t('nakshatra'), `${nm(nk)} · ${t('pada')} ${I.num(p.pada)}`, p.nakshatraEnd ? `${t('until')} ${fmtShort(p.nakshatraEnd.date.getTime())}` : '', true],
      [t('yoga'), nm(V.yogas[p.yoga]), '', false],
      [t('karana'), nm(p.karana), '', false],
      [t('masa'), `${p.adhika ? t('adhika') + ' ' : ''}${nm(V.months[p.month])}`, I.lang === 'hi' ? 'अमान्त' : 'Amanta', false],
      [t('samvat'), `${t('vikram')} ${I.num(p.vikram)}`, `${t('shaka')} ${I.num(p.shaka)}`, false],
      [t('ritu'), nm(V.ritus[p.ritu]), nm(V.ayanas[p.ayana]), false],
      [t('lagna'), nm(V.rashis[Math.floor(p.lagna / 30)]), dms(p.lagna % 30), false],
      [t('sunRashi'), nm(V.rashis[p.sunRashi]), dms(p.sunSid % 30), false],
      [t('moonRashi'), nm(V.rashis[p.moonRashi]), dms(p.moonSid % 30), false],
      [t('sunrise'), sun && sun.sunrise ? fmtTime(sun.sunrise) : '—', `${t('sunset')} ${sun && sun.sunset ? fmtTime(sun.sunset) : '—'}`, false],
      [t('ayanamsa'), dms(p.ayanamsa), '', true],
    ];
    return cells.map(([k, v, s, wide]) => `<div class="pcell${wide ? ' wide' : ''}"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`).join('');
  }

  // ---------- time bar ----------
  const RATES = [1, 10, 60, 600, 3600, 86400];
  function rateText() {
    const r = Math.abs(clock.rate);
    const s = r >= 86400 ? `${r / 86400}d/s` : r >= 3600 ? `${r / 3600}h/s` : r >= 60 ? `${r / 60}m/s` : `${r}`;
    return (clock.rate < 0 ? '−' : '') + s;
  }
  function syncTimebar(onlyValue) {
    const input = $('dtInput');
    if (document.activeElement !== input) {
      const off = tzOffsetMin(S.loc.tz, clock.sim) * 60000;
      input.value = new Date(clock.sim + off).toISOString().slice(0, 16);
    }
    $('rateLabel').textContent = clock.rate === 0 ? '⏸' : `×${rateText()}`;
    if (onlyValue) return;
    const play = $('timebar').querySelector('[data-rate="toggle"]');
    play.innerHTML = clock.rate === 0 ? ICON.play : ICON.pause;
  }
  function buildTimebar() {
    const tb = $('timebar');
    tb.querySelector('[data-rate="rev"]').innerHTML = ICON.rev;
    tb.querySelector('[data-rate="fwd"]').innerHTML = ICON.fwd;
    tb.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { clock.sim += +b.dataset.step * 1000; afterTimeJump(); }));
    tb.querySelector('[data-rate="toggle"]').addEventListener('click', () => { clock.rate = clock.rate === 0 ? 1 : 0; afterTimeJump(); });
    const shift = (dir) => {
      const cur = clock.rate === 0 ? 0 : clock.rate;
      if (cur === 0 || Math.sign(cur) !== dir) clock.rate = dir * RATES[1];
      else { const i = RATES.indexOf(Math.abs(cur)); clock.rate = dir * RATES[Math.min(RATES.length - 1, i + 1)]; }
      afterTimeJump();
    };
    tb.querySelector('[data-rate="rev"]').addEventListener('click', () => shift(-1));
    tb.querySelector('[data-rate="fwd"]').addEventListener('click', () => shift(1));
    $('btnNow').addEventListener('click', () => { clock.sim = Date.now(); clock.rate = 1; afterTimeJump(); });
    $('dtInput').addEventListener('change', () => {
      const v = $('dtInput').value; if (!v) return;
      const [d, tm] = v.split('T'); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = tm.split(':').map(Number);
      const guess = Date.UTC(y, mo - 1, da, h, mi);
      clock.sim = guess - tzOffsetMin(S.loc.tz, guess) * 60000;
      afterTimeJump();
    });
  }
  function afterTimeJump() { astro = null; syncTimebar(); refreshPanchang(true); renderClock(); invalidate(); if (S.mode === 'today') LS.Pages.renderToday(); }

  // ---------- info sheet ----------
  function select(obj) {
    if (!selected || selected.type !== obj.type || selected.id !== obj.id) LS.Nada.chime('tap');
    selected = obj; view.track = false;
    showSheet(obj); invalidate();
  }
  function hideSheet() { $('sheet').hidden = true; }
  function rowsHtml(rows) { return rows.filter(Boolean).map(([k, v]) => `<div class="k">${k}</div><div class="v">${v}</div>`).join(''); }

  function zodiacRows(sidLon) {
    const z = Sky.zodiacInfo(sidLon);
    return [
      [t('siderealLon'), dms(sidLon)],
      [t('inRashi'), `${Nm.rashi(z.rashi)} ${dms(z.degInRashi)}`],
      [t('inNakshatra'), `${nm(V.nakshatras[z.nakshatra])} · ${t('pada')} ${I.num(z.pada)}`],
    ];
  }
  function posRows(enu, as) {
    const aa = azAltOf(enu);
    const eqd = Sky.apply(as.fr.enu2eqd, enu[0], enu[1], enu[2]);
    const ra = ((Math.atan2(eqd[1], eqd[0]) * R2D + 360) % 360) / 15, dec = Math.asin(eqd[2]) * R2D;
    return [
      [t('altAz'), `${sgnDms(aa.alt)} / ${dms(aa.az)}`],
      [t('raDec'), `${hms(ra)} / ${sgnDms(dec)}`],
    ];
  }
  function riseSetRows(body, as) {
    try {
      const rs = Sky.riseSet(body, as.obs, as.time);
      if (!rs.rise && !rs.set) {
        const alt = Math.asin(Math.max(-1, Math.min(1, objEnu(selected, as)[2]))) * R2D;
        return [[t('rises'), t(alt > 0 ? 'transitAlways' : 'transitNever')]];
      }
      return [[t('rises'), rs.rise ? fmtShort(rs.rise.date.getTime()) : '—'], [t('sets'), rs.set ? fmtShort(rs.set.date.getTime()) : '—']];
    } catch (e) { return []; }
  }

  let sheetStatic = null;
  function showSheet(obj) {
    const as = astro || computeAstro();
    const hi = I.lang === 'hi';
    let type = '', title = '', sub = '', glyph = '✦', desc = '', rows = [];
    if (obj.type === 'graha') {
      const g = V.grahas[obj.id], gp = as.grahas[obj.id];
      type = `${t('grahaType')}${g.modern ? ' · ' + t('modern') : ''}`; title = Nm.graha(obj.id); glyph = g.glyph;
      sub = Nm.grahaAlt(obj.id);
      desc = nm(g.desc);
      rows = [...zodiacRows(gp.sidLon)];
      if (gp.retro && obj.id !== 'rahu' && obj.id !== 'ketu') rows.push([t('retrograde'), '℞']);
      if (g.rules) rows.push([t('rules'), g.rules.map((k) => Nm.rashi(k)).join(', ')]);
      if (g.exalt != null) rows.push([t('exalted'), Nm.rashi(g.exalt)], [t('debilitated'), Nm.rashi(g.debil)]);
      if (g.day != null) rows.push([t('vara'), nm(V.varas[g.day])]);
      if (g.body && gp.mag < 50 && obj.id !== 'surya') rows.push([t('magnitude'), I.num(gp.mag.toFixed(1))]);
      if (obj.id === 'chandra') rows.push([t('illumination'), `${I.num((gp.illum * 100).toFixed(0))}%`]);
      if (g.body) rows.push([t('distance'), obj.id === 'chandra' ? `${I.num(Math.round(gp.dist * 149597870.7).toLocaleString('en-IN'))} ${t('km')}` : `${I.num(gp.dist.toFixed(3))} ${t('au')}`]);
      sheetStatic = { body: g.body ? A.Body[g.body] : null };
    } else if (obj.type === 'star') {
      const i = obj.id, st = starTitle(i), vn = R.data.vedicNames[i];
      type = t('starType'); title = st.title; sub = st.sub;
      if (vn && vn.kind === 'star') desc = nm(V.stars[vn.ref].desc);
      if (vn && vn.kind === 'nakshatra') { const nk = V.nakshatras[vn.ref]; desc = `${t('yogatara')} — ${nm(nk)} · ${nm(nk.deity)}`; }
      const v = starVec(i);
      const sid = Sky.norm360(A.Ecliptic(new A.Vector(v[0], v[1], v[2], as.time)).elon - as.ayanamsa);
      rows = [[t('magnitude'), I.num(R.data.mag[i].toFixed(2))], ...zodiacRows(sid)];
      const ra = Math.atan2(v[1], v[0]) * R2D / 15, dec = Math.asin(v[2]) * R2D;
      sheetStatic = { star: [((ra % 24) + 24) % 24, dec] };
    } else if (obj.type === 'nakshatra') {
      if (obj.id === 'abhijit') {
        const ab = V.abhijit;
        type = t('nakType'); title = nm(ab); sub = `${hi ? ab.en : ab.hi} · ${ab.iast}`; glyph = '★';
        rows = [[t('deity'), nm(ab.deity)], [t('symbol'), nm(ab.symbol)], [t('yogatara'), starTitle(R.data.abhFig.yt).title]];
        desc = I.lang === 'hi' ? 'अट्ठाईसवाँ नक्षत्र, उत्तराषाढा और श्रवण के मध्य; मुहूर्त-गणना में प्रयुक्त।' : 'The 28th nakshatra, between Uttara Ashadha and Shravana, used in muhurta reckoning.';
        sheetStatic = { star: null };
      } else {
        const nk = V.nakshatras[obj.id];
        type = `${t('nakType')} ${I.num(obj.id + 1)} / ${I.num(27)}`; title = nm(nk); sub = `${hi ? nk.en : nk.hi} · ${nk.iast}`; glyph = I.num(obj.id + 1);
        const start = obj.id * Sky.NAK, end = start + Sky.NAK;
        const span = (x) => `${Nm.rashi(Math.floor(x / 30) % 12)} ${dms(x % 30)}`;
        desc = `${nm(nk.deity)}.`;
        const moonHere = Math.floor(as.grahas.chandra.sidLon / Sky.NAK) === obj.id;
        const inHere = Sky.GRAHA_ORDER.filter((id) => Math.floor(as.grahas[id].sidLon / Sky.NAK) === obj.id).map((id) => Nm.graha(id));
        rows = [
          [t('span'), `${span(start)} – ${span(end - 1e-9).replace(/29°59′/, '30°00′')}`],
          [t('deity'), nm(nk.deity)], [t('symbol'), nm(nk.symbol)],
          [t('lord'), Nm.graha(nk.lord)], [t('gana'), nm(V.ganas[nk.gana])],
          [t('yogatara'), starTitle(R.data.nakFigs[obj.id].yt).sub.split(' · ').slice(-1)[0] || '—'],
          inHere.length ? [t('graha'), inHere.join(', ')] : null,
        ];
        if (moonHere) desc += I.lang === 'hi' ? ' आज चन्द्रमा इसी नक्षत्र में है।' : ' The Moon is in this nakshatra now.';
        sheetStatic = { star: null };
      }
    } else if (obj.type === 'rashi') {
      const rs = V.rashis[obj.id];
      type = `${t('rashiType')} ${I.num(obj.id + 1)} / ${I.num(12)}`; title = Nm.rashi(obj.id); sub = Nm.rashiAlt(obj.id); glyph = '♈♉♊♋♌♍♎♏♐♑♒♓'[obj.id];
      const inHere = Sky.GRAHA_ORDER.filter((id) => Math.floor(as.grahas[id].sidLon / 30) === obj.id).map((id) => Nm.graha(id));
      const firstNak = Math.floor(obj.id * 30 / Sky.NAK), lastNak = Math.floor((obj.id * 30 + 29.999) / Sky.NAK);
      const naks = []; for (let k = firstNak; k <= lastNak; k++) naks.push(nm(V.nakshatras[k]));
      rows = [[t('symbol'), nm(rs.symbol)], [t('lord'), Nm.graha(rs.lord)], [t('element'), nm(V.elements[rs.el])],
        [t('nakshatra'), naks.join(', ')], inHere.length ? [t('graha'), inHere.join(', ')] : null];
      sheetStatic = { star: null };
    } else if (obj.type === 'constellation') {
      const c = R.data.western.find((x) => x.id === obj.id);
      const meta = LS_DATA.constellations.find((x) => x.id === obj.id);
      type = t('consType'); title = Nm.constellation(c); sub = Nm.constellationAlt({ ...c, la: meta && meta.la }); glyph = '✧';
      sheetStatic = { star: null };
    } else if (obj.type === 'asterism') {
      const a = V.asterisms[obj.id];
      type = t('asterismType'); title = nm(a); sub = hi ? a.en : a.hi; desc = nm(a.desc); glyph = '✶';
      sheetStatic = { star: null };
    }
    $('sType').textContent = type; $('sTitle').textContent = title; $('sSub').textContent = sub;
    $('sGlyph').textContent = glyph; $('sDesc').textContent = desc;
    sheetStatic.rows = rows; sheetStatic.obj = obj;
    if (window.innerWidth <= 720) $('panchang').hidden = true;
    $('sheet').hidden = false;
    $('btnTrack').classList.toggle('on', view.track);
    const jyMode = S.mode === 'jyotish';
    $('btnTrack').hidden = jyMode;
    $('btnCenter').textContent = t(jyMode ? 'viewSky' : 'center');
    $('btnKundali').hidden = jyMode || !((obj.type === 'graha' && LS.Jyotish.NAVA.includes(obj.id)) || obj.type === 'rashi' || (obj.type === 'nakshatra' && obj.id !== 'abhijit'));
    updateSheetLive(true);
  }
  let lastRiseSet = 0, riseSetCache = [];
  function updateSheetLive(force) {
    if (!sheetStatic || !selected) return;
    const as = astro || computeAstro();
    const enu = objEnu(selected, as);
    const now = performance.now();
    if (force || now - lastRiseSet > 5000) {
      lastRiseSet = now;
      if (sheetStatic.body) riseSetCache = riseSetRows(sheetStatic.body, as);
      else if (sheetStatic.star) { A.DefineStar(A.Body.Star1, sheetStatic.star[0], sheetStatic.star[1], 1000); riseSetCache = riseSetRows(A.Body.Star1, as); }
      else riseSetCache = [];
    }
    const live = enu ? posRows(enu, as) : [];
    if (enu && enu[2] < 0) live[0][1] += ` · ${t('below')}`;
    $('sRows').innerHTML = rowsHtml([...live, ...riseSetCache, ...sheetStatic.rows]);
  }
  $('btnCenter').addEventListener('click', () => {
    if (!selected) return;
    if (S.mode === 'jyotish') { setMode('sky'); requestAnimationFrame(() => goTo(selected, true)); } else goTo(selected, true);
  });
  $('btnKundali').addEventListener('click', () => {
    if (!selected) return;
    if (selected.type === 'graha' && LS.Jyotish.NAVA.includes(selected.id)) jy.selected = selected.id;
    setMode('jyotish');
  });
  $('btnTrack').addEventListener('click', () => {
    if (!selected) return;
    view.track = !view.track; if (view.track) goTo(selected, false);
    $('btnTrack').classList.toggle('on', view.track);
    $('btnTrack').textContent = t(view.track ? 'tracking' : 'track');
  });

  // ---------- search ----------
  const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let searchIndex = [];
  function buildSearchIndex() {
    const idx = [];
    for (const id of Sky.GRAHA_ORDER) { const g = V.grahas[id]; idx.push({ obj: { type: 'graha', id }, glyph: g.glyph, names: [g.en, g.hi, g.iast, g.west], label: () => Nm.graha(id), sub: () => `${t('grahaType')} · ${Nm.grahaAlt(id)}` }); }
    V.nakshatras.forEach((nk, k) => idx.push({ obj: { type: 'nakshatra', id: k }, glyph: I.num(k + 1), names: [nk.en, nk.hi, nk.iast], label: () => nm(nk), sub: () => `${t('nakType')} · ${nm(nk.deity)}` }));
    idx.push({ obj: { type: 'nakshatra', id: 'abhijit' }, glyph: '★', names: [V.abhijit.en, V.abhijit.hi], label: () => nm(V.abhijit), sub: () => t('nakType') });
    V.rashis.forEach((rs, k) => idx.push({ obj: { type: 'rashi', id: k }, glyph: '♈♉♊♋♌♍♎♏♐♑♒♓'[k], names: [rs.en, rs.hi, rs.iast, rs.west], label: () => Nm.rashi(k), sub: () => `${t('rashiType')} · ${Nm.rashiAlt(k)}` }));
    V.asterisms.forEach((a, k) => idx.push({ obj: { type: 'asterism', id: k }, glyph: '✶', names: [a.en, a.hi], label: () => nm(a), sub: () => t('asterismType') }));
    for (const [i, vn] of Object.entries(R.data.vedicNames)) {
      if (vn.kind !== 'star') continue;
      idx.push({ obj: { type: 'star', id: +i }, glyph: '✦', names: [vn.en, vn.hi, LS_DATA.stars.names[i]], label: () => (I.lang === 'hi' ? vn.hi : vn.en), sub: () => `${t('starType')} · ${LS_DATA.stars.names[i] || starDesig[i] || ''}` });
    }
    for (const [i, name] of Object.entries(LS_DATA.stars.names)) {
      if (R.data.vedicNames[i] && R.data.vedicNames[i].kind === 'star') continue;
      idx.push({ obj: { type: 'star', id: +i }, glyph: '·', names: [name, starDesig[i]], label: () => name, sub: () => `${t('starType')} · ${starDesig[i] || ''}`, minor: true });
    }
    for (const c of R.data.western) idx.push({ obj: { type: 'constellation', id: c.id }, glyph: '✧', names: [c.en, c.hi, c.id, ...(V.constellations[c.id] || [])], label: () => Nm.constellation(c), sub: () => `${t('consType')} · ${Nm.constellationAlt(c)}`, minor: true });
    searchIndex = idx.map((e) => ({ ...e, keys: e.names.filter(Boolean).map(fold) }));
  }
  let activeResult = -1, currentResults = [];
  function runSearch(q) {
    const box = $('searchResults');
    const f = fold(q.trim());
    if (!f) { box.hidden = true; currentResults = []; return; }
    const scored = [];
    for (const e of searchIndex) {
      let best = -1;
      for (const k of e.keys) { const p = k.indexOf(f); if (p === 0) best = Math.max(best, 3); else if (p > 0) best = Math.max(best, 1); }
      if (best >= 0) scored.push([best - (e.minor ? 1 : 0), e]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    currentResults = scored.slice(0, 12).map((x) => x[1]);
    activeResult = currentResults.length ? 0 : -1;
    box.innerHTML = currentResults.length ? currentResults.map((e, k) =>
      `<button class="result${k === 0 ? ' active' : ''}" data-k="${k}"><span class="g">${e.glyph}</span><span><div class="n">${e.label()}</div><div class="s">${e.sub()}</div></span></button>`).join('')
      : `<div class="empty">${t('noResults')}</div>`;
    box.hidden = false;
    box.querySelectorAll('.result').forEach((b) => b.addEventListener('click', () => chooseResult(+b.dataset.k)));
  }
  function chooseResult(k) {
    const e = currentResults[k]; if (!e) return;
    $('searchInput').value = ''; $('searchResults').hidden = true; $('searchInput').blur(); $('searchBox').hidden = true;
    select(e.obj); goTo(e.obj, true);
  }
  $('searchInput').addEventListener('input', (e) => runSearch(e.target.value));
  $('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { chooseResult(Math.max(0, activeResult)); e.preventDefault(); }
    if (e.key === 'Escape') { $('searchInput').value = ''; runSearch(''); $('searchInput').blur(); $('searchBox').hidden = true; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeResult = clamp(activeResult + (e.key === 'ArrowDown' ? 1 : -1), 0, currentResults.length - 1);
      $('searchResults').querySelectorAll('.result').forEach((b, k) => b.classList.toggle('active', k === activeResult));
    }
  });
  document.addEventListener('pointerdown', (e) => { if (!$('searchBox').contains(e.target)) $('searchResults').hidden = true; });


  // ---------- names & modes ----------
  function setNames(c) {
    S.names = c; Nm.set(c); persist();
    syncDock();
    if (selected && !$('sheet').hidden) showSheet(selected);
    if ($('searchInput').value) runSearch($('searchInput').value);
    if (!$('panchang').hidden) renderPanchang();
    jyRefresh(true); invalidate();
  }
  function placeGlider() {
    const on = $('modeSwitch').querySelector(`.mode[data-mode="${S.mode}"]`);
    const g = $('modeSwitch').querySelector('.mode-glider');
    if (!on || !g) return;
    g.style.width = on.offsetWidth + 'px';
    g.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  }
  const MODES = ['sky', 'today', 'calendar', 'jyotish'];
  const PAGE_MODES = ['today', 'calendar'];
  function setMode(m, initial) {
    S.mode = MODES.includes(m) ? m : 'sky';
    for (const k of MODES) document.body.classList.toggle('mode-' + k, S.mode === k);
    document.body.classList.toggle('page-mode', S.mode !== 'sky');
    for (const box of [$('modeSwitch'), $('tabbar')]) box.querySelectorAll('[data-mode]').forEach((b) => { b.classList.toggle('on', b.dataset.mode === S.mode); b.setAttribute('aria-selected', b.dataset.mode === S.mode); });
    $('jyotish').hidden = S.mode !== 'jyotish';
    $('today').hidden = S.mode !== 'today';
    $('calendar').hidden = S.mode !== 'calendar';
    if (S.mode !== 'sky') {
      $('panchang').hidden = true; $('tonight').hidden = true; $('timebar').hidden = true; $('dock').hidden = true;
      if (view.sensor && !view.ar) setSensor(false);
      if (view.ar) setAR(false);
      $('finder').hidden = true;
    }
    if (PAGE_MODES.includes(S.mode)) { $('sheet').hidden = true; selected = null; view.track = false; }
    if (S.mode === 'jyotish') requestAnimationFrame(() => { jy.wheel.resize(); jyRefresh(true); });
    renderPage(); LS.FX.wake(); bloom(); if (coach.step) hideCoach();
    if (!initial && selected && !$('sheet').hidden) showSheet(selected);
    requestAnimationFrame(placeGlider);
    persist(); invalidate();
  }
  // Ratri: let the new section's panels bloom in once (not on every refresh).
  let bloomTimer = null;
  function bloom() {
    const el = S.mode === 'today' ? $('today') : S.mode === 'calendar' ? $('calendar') : null;
    document.querySelectorAll('.page.bloom').forEach((p) => p.classList.remove('bloom'));
    document.body.classList.toggle('bloom', S.mode === 'jyotish');
    if (el) el.classList.add('bloom');
    clearTimeout(bloomTimer);
    bloomTimer = setTimeout(() => { document.querySelectorAll('.page.bloom').forEach((p) => p.classList.remove('bloom')); document.body.classList.remove('bloom'); }, 1600);
  }
  function renderPage() {
    try {
      if (S.mode === 'today') { LS.Pages.renderToday(); $('todayBody').parentElement.parentElement.scrollTop = 0; }
      if (S.mode === 'calendar') LS.Pages.renderCalendar();
    } catch (e) { console.warn('page failed', e); }
  }

  // ---------- Jyotish view ----------
  const jy = { wheel: null, chart: null, lastSim: NaN, lastLoc: '', lastDraw: 0, lastPanel: 0, selected: null, dashaOpen: null, panelSim: NaN };
  const DIG_KEY = { exalted: 'dig_exalted', own: 'dig_own', friend: 'dig_friend', neutral: 'dig_neutral', enemy: 'dig_enemy', debilitated: 'dig_debilitated' };
  const DIG_WEST = { exalted: 'Exalted', own: 'Own sign', friend: 'Friendly sign', neutral: 'Neutral sign', enemy: 'Enemy sign', debilitated: 'Debilitated' };
  const DIG_SHORT = { exalted: ['Uchcha', 'Exalted', 'उच्च'], own: ['Svakshetra', 'Own', 'स्वक्षेत्री'], friend: ['Mitra', 'Friend', 'मित्र'],
    neutral: ['Sama', 'Neutral', 'सम'], enemy: ['Shatru', 'Enemy', 'शत्रु'], debilitated: ['Neecha', 'Debilitated', 'नीच'] };
  const digName = (d) => (Nm.isVedic() || I.lang === 'hi' ? t(DIG_KEY[d]) : DIG_WEST[d]);
  const digShort = (d) => DIG_SHORT[d][I.lang === 'hi' ? 2 : Nm.isVedic() ? 0 : 1];
  const fmtDay = (ms) => fmt(ms, { day: 'numeric', month: 'short', year: 'numeric' });

  function initJyotish() {
    jy.wheel = LS.ChartView.createWheel($('wheel'), {
      t,
      onTimeDelta: (ms) => { clock.sim += ms; clock.rate = 0; astro = null; invalidate(); jy.lastSim = NaN; },
      onSelect: (obj) => {
        if (!obj) { jy.selected = null; jy.wheel.setSelected(null); close('sheet'); renderJyPanel(); return; }
        if (obj.type === 'graha') { jy.selected = obj.id; jy.wheel.setSelected(obj.id); }
        select(obj); renderJyPanel();
      },
    });
    const MODE_ICON = { sky: ICON.sky, today: ICON.today, calendar: ICON.calendar, jyotish: ICON.chakra };
    $('modeSwitch').querySelectorAll('.mode').forEach((b) => { b.querySelector('.mi').innerHTML = MODE_ICON[b.dataset.mode]; b.addEventListener('click', () => setMode(b.dataset.mode)); });
    $('tabbar').querySelectorAll('[data-mode]').forEach((b) => { b.querySelector('.ti').innerHTML = MODE_ICON[b.dataset.mode]; b.addEventListener('click', () => setMode(b.dataset.mode)); });
    $('namesSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setNames(b.dataset.names)));
    $('jyTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (PRO_TABS.includes(b.dataset.tab) && !LS.Pro.isPro()) { showPaywall(); return; }
      S.jyTab = b.dataset.tab; jy.tabChanged = true; persist(); renderJyPanel();
    }));
    $('btnJyNow').addEventListener('click', () => { clock.sim = Date.now(); clock.rate = 1; afterTimeJump(); jyRefresh(true); });
    $('btnJySky').addEventListener('click', () => setMode('sky'));
    // Delegated clicks inside the panel.
    $('jyBody').addEventListener('click', (e) => {
      const g = e.target.closest('[data-g]');
      if (g && g.dataset.g !== 'lagna') { jy.selected = g.dataset.g; jy.wheel.setSelected(jy.selected); select({ type: 'graha', id: jy.selected }); renderJyPanel(); return; }
      const opt = e.target.closest('[data-opt]');
      if (opt) {
        if (opt.dataset.opt === 'kVarga' && opt.dataset.val === 'D9' && !LS.Pro.isPro()) { showPaywall(); return; }
        S[opt.dataset.opt] = opt.dataset.val; persist(); renderJyPanel(); return;
      }
      const md = e.target.closest('[data-md]');
      if (md) { jy.dashaOpen = jy.dashaOpen === +md.dataset.md ? -1 : +md.dataset.md; renderJyPanel(); return; }
      const act = e.target.closest('[data-act]');
      if (act) jyAction(act.dataset.act);
    });
    $('jyBody').addEventListener('change', (e) => {
      if (e.target.id === 'bPlace') {
        const c = CITIES.find((x) => x.id === e.target.value);
        if (c) { $('bLat').value = c.lat.toFixed(4); $('bLon').value = c.lon.toFixed(4); }
      }
    });
    window.addEventListener('resize', () => { if (S.mode === 'jyotish') { jy.wheel.resize(); placeGlider(); } });
  }

  function jyFrame(now) {
    const lk = locKey();
    const changed = clock.sim !== jy.lastSim || lk !== jy.lastLoc;
    if (changed && (now - jy.lastDraw > 50 || Math.abs(clock.sim - jy.lastSim) > 3600e3 * 6)) {
      jyCompute();
      jy.lastDraw = now;
    } else if (now - jy.lastDraw > 66) { jy.wheel.draw(now); jy.lastDraw = now; }
    if (jy.chart && now - jy.lastPanel > 600 && Math.abs(jy.chart.ms - jy.panelSim) > 30e3) renderJyPanel();
  }
  function jyCompute() {
    try {
      jy.chart = LS.Jyotish.chart(A.MakeTime(new Date(clock.sim)), observer());
      jy.lastSim = clock.sim; jy.lastLoc = locKey();
      jy.wheel.setChart(jy.chart);
      renderJyTitle();
    } catch (e) { console.warn('chart failed', e); }
  }
  function jyRefresh(force) {
    if (!jy.wheel || S.mode !== 'jyotish') return;
    if (force) jyCompute();
    renderJyPanel();
  }
  function isBirthChart() { return S.birth && Math.abs(S.birth.ms - clock.sim) < 60e3 && Math.abs(S.birth.lat - S.loc.lat) < 1e-4 && Math.abs(S.birth.lon - S.loc.lon) < 1e-4; }
  function renderJyTitle() {
    const who = isBirthChart() ? `${S.birth.name || t('birthChart')} · ` : '';
    $('jyTitle').textContent = `${who}${fmtDate(clock.sim)} · ${fmtTime(clock.sim)} · ${nm(S.loc)}`;
  }

  function renderJyPanel() {
    if (!jy.chart || S.mode !== 'jyotish') return;
    jy.lastPanel = performance.now(); jy.panelSim = jy.chart.ms;
    const pro = LS.Pro.isPro();
    if (!pro && PRO_TABS.includes(S.jyTab)) S.jyTab = 'kundali';
    $('jyTabs').querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.tab === S.jyTab);
      b.classList.toggle('locked', !pro && PRO_TABS.includes(b.dataset.tab));
    });
    const c = jy.chart;
    const html = { kundali: jyKundali, grahas: jyGrahas, dasha: jyDasha, janma: jyJanma, milan: () => LS.Pages.milanHtml() }[S.jyTab] || jyKundali;
    // Keep form fields intact while the clock ticks.
    if (S.jyTab === 'janma' && $('jyBody').querySelector('#bDate')) return;
    if (S.jyTab === 'milan' && $('jyBody').querySelector('.mi-person') && !jy.tabChanged) return;
    jy.tabChanged = false;
    $('jyBody').innerHTML = html(c);
  }
  const optSeg = (key, opts) => `<div class="seg mini">${opts.map(([v, label]) => `<button data-opt="${key}" data-val="${v}" class="${S[key] === v ? 'on' : ''}">${label}</button>`).join('')}</div>`;

  function jyKundali(c) {
    const d9 = S.kVarga === 'D9' && LS.Pro.isPro();
    const items = c.grahas.map((g) => ({ id: g.id, rashi: d9 ? g.navamsa : g.rashi, retro: g.retro, deg: d9 ? null : g.deg }));
    const L = d9 ? c.navamsaLagna : c.lagnaRashi;
    const title = t(d9 ? 'navamsa' : 'rashiChart');
    const svg = LS.ChartView.kundaliSVG(L, items, S.kStyle, { selected: jy.selected, showDeg: !d9, title, subtitle: fmtDay(c.ms) });
    const moon = c.byId.chandra;
    return `<div class="jy-sub">${optSeg('kStyle', [['north', t('north')], ['south', t('south')]])}${optSeg('kVarga', [['D1', 'D1'], ['D9', LS.Pro.isPro() ? 'D9' : 'D9 ✦']])}</div>
      ${svg}
      <div class="k-caption">${t('lagna')} <b>${Nm.rashi(L)}</b> · ${t('moonRashi')} <b>${Nm.rashi(d9 ? moon.navamsa : moon.rashi)}</b> · ${t('nakshatra')} <b>${Nm.nakshatra(moon.nak)}</b></div>
      ${jyHouses(c, d9)}`;
  }
  function jyHouses(c, d9) {
    if (d9) return '';
    const sel = jy.selected && c.byId[jy.selected];
    const asp = sel ? LS.Jyotish.aspects(sel.id, sel.house) : [];
    const rows = c.houses.map((h) => {
      const b = V.bhavas[h.n - 1];
      const lordH = c.byId[h.lord] ? c.byId[h.lord].house : '';
      const occ = h.occupants.map((id) => `<a data-g="${id}" style="color:${V.grahas[id].color}">${Nm.abbr(id)}</a>`).join(' ');
      const mark = asp.includes(h.n) ? ` style="background:rgba(126,232,250,0.08)"` : '';
      return `<tr${mark}><td class="gn">${I.num(h.n)} · ${I.lang === 'hi' ? b[1] : b[0]}<span class="s">${I.lang === 'hi' ? b[3] : b[2]}</span></td>
        <td>${Nm.rashi(h.rashi)}<span class="s">${Nm.graha(h.lord)} → ${I.num(lordH)}</span></td><td>${occ || '<span class="s">—</span>'}</td></tr>`;
    }).join('');
    const head = sel ? `<div class="k-caption">${t('aspects')}: <b style="color:${V.grahas[sel.id].color}">${Nm.graha(sel.id)}</b> → ${asp.map((h) => I.num(h)).join(', ')}</div>` : '';
    return `${head}<table class="gtable" style="margin-top:10px"><thead><tr><th>${t('bhavaName')}</th><th>${t('rashi')} · ${t('lordIn')}</th><th>${t('occupants')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function jyGrahas(c) {
    const lagnaRow = `<tr><td class="gn"><i style="color:#ffb347">↑</i>${t('lagna')}</td><td class="mono">${Nm.rashi(c.lagnaRashi)} ${dms(c.lagna % 30)}</td>
      <td>${Nm.nakshatra(c.lagnaNak)} · ${I.num(c.lagnaPada)}</td><td class="mono">${I.num(1)}</td><td>—</td></tr>`;
    const rows = c.grahas.map((g) => {
      const flags = [g.retro && g.id !== 'rahu' && g.id !== 'ketu' ? (I.lang === 'hi' ? 'वक्री' : '℞') : '', g.combust ? t('combust') : ''].filter(Boolean).map((f) => `<span class="flag">${f}</span>`).join('');
      return `<tr data-g="${g.id}" class="${jy.selected === g.id ? 'on' : ''}">
        <td class="gn"><i style="color:${V.grahas[g.id].color}">${V.grahas[g.id].glyph}</i>${Nm.graha(g.id)}${flags}</td>
        <td class="mono">${Nm.rashi(g.rashi)} ${dms(g.deg)}</td>
        <td>${Nm.nakshatra(g.nak)} · ${I.num(g.pada)}<span class="s" title="${t('nakLord')}">⟡ ${Nm.graha(g.nakLord)}</span></td>
        <td class="mono">${I.num(g.house)}</td>
        <td><span class="dg ${g.dignity}" title="${digName(g.dignity)}">${digShort(g.dignity)}</span></td></tr>`;
    }).join('');
    return `<table class="gtable"><thead><tr><th>${t('graha')}</th><th>${t('rashi')}</th><th>${t('nakshatra')}</th><th>${t('house')}</th><th>${t('dignity')}</th></tr></thead><tbody>${lagnaRow}${rows}</tbody></table>`;
  }

  function jyDasha(c) {
    const moon = c.byId.chandra;
    const v = LS.Jyotish.vimshottari(moon.lon, c.ms);
    const now = Date.now();
    const y = Math.floor(v.balanceYears), mo = Math.floor((v.balanceYears - y) * 12);
    const curIdx = v.mds.findIndex((m) => now >= m.start && now < m.end);
    if (jy.dashaOpen == null) jy.dashaOpen = curIdx;
    const row = (p, cls, attr) => {
      const g = V.grahas[p.lord];
      const cur = now >= p.start && now < p.end;
      const pct = cur ? ((now - p.start) / (p.end - p.start) * 100).toFixed(1) : 0;
      return `<button class="drow ${cls || ''}${cur ? ' cur' : ''}" ${attr || ''}><span class="g" style="color:${g.color}">${g.glyph}</span>
        <span><div class="n">${Nm.graha(p.lord)}${cur ? ` · <span style="color:#ffd8a0">${t('current')}</span>` : ''}</div></span>
        <span class="d">${fmtDay(Math.max(p.start, cls === 'md' ? v.birthMs : p.start))} → ${fmtDay(p.end)}</span>
        ${cur ? `<span class="bar"><i style="width:${pct}%"></i></span>` : ''}</button>`;
    };
    let list = '';
    v.mds.forEach((m, k) => {
      list += row(m, 'md', `data-md="${k}"`);
      if (jy.dashaOpen === k) list += `<div class="antar">${LS.Jyotish.antardashas(m).map((a) => row(a, 'ad')).join('')}</div>`;
    });
    return `<div class="dasha-head"><div class="eyebrow">${t('vimshottari')}</div>
      <div class="v">${t('moonRashi')}: ${Nm.rashi(moon.rashi)} · ${Nm.nakshatra(moon.nak)} (${Nm.graha(v.lord)})</div>
      <div class="s">${t('balance')}: ${Nm.graha(v.lord)} ${I.num(y)}${t('years')} ${I.num(mo)}${t('months')}</div></div>${list}`;
  }

  function jyJanma() {
    const b = S.birth;
    const ms = b ? b.ms : clock.sim;
    const tz = b ? b.tz : S.loc.tz;
    const off = tzOffsetMin(tz, ms) * 60000;
    const val = new Date(ms + off).toISOString().slice(0, 16);
    const placeId = b ? b.id : S.loc.id;
    const lat = b ? b.lat : S.loc.lat, lon = b ? b.lon : S.loc.lon;
    const opts = CITIES.map((c) => `<option value="${c.id}"${c.id === placeId ? ' selected' : ''}>${nm(c)}</option>`).join('');
    const profiles = (S.profiles || []).map((p) => `<div class="profile${b && b.pid === p.pid ? ' on' : ''}">
        <button class="pf-main" data-act="load:${p.pid}"><b>${esc(p.name || t('birthChart'))}</b><span>${fmtDay(p.ms)} · ${esc(nm(p))}</span></button>
        <button class="pf-del" data-act="del:${p.pid}" aria-label="${t('remove')}">×</button></div>`).join('');
    return `<div class="form">
      <div class="eyebrow">${t('profiles')}</div>
      <div class="profiles">${profiles || `<p class="note">${t('noProfiles')}</p>`}</div>
      <div class="eyebrow" style="margin-top:16px">${t('birthTitle')}</div>
      ${b ? `<div class="birth-chip">✦ ${b.name || t('birthChart')} · ${fmtDay(b.ms)}</div>` : ''}
      <label>${t('birthName')}<input class="field" id="bName" value="${(b && b.name ? b.name : '').replace(/"/g, '&quot;')}" maxlength="40"></label>
      <label>${t('birthDate')}<input class="field" id="bDate" type="datetime-local" value="${val}"></label>
      <label>${t('birthPlace')}<select class="field" id="bPlace"><option value="custom">${t('custom')}</option>${opts}</select></label>
      <div class="row2">
        <label>${t('latitude')}<input class="field" id="bLat" type="number" step="0.0001" value="${lat.toFixed(4)}"></label>
        <label>${t('longitude')}<input class="field" id="bLon" type="number" step="0.0001" value="${lon.toFixed(4)}"></label>
      </div>
      <button class="pill wide accent" data-act="cast">${t('cast')}</button>
      ${b ? `<button class="pill wide" data-act="back">${t('backToBirth')}</button>` : ''}
      <button class="pill wide" data-act="now">${t('transitNow')}</button>
      <p class="note">${t('aboutJyotish')}</p>
    </div>`;
  }
  function jyAction(act) {
    if (act.startsWith('milan:')) { LS.Pages.milanAction(act.slice(6)); return; }
    if (act === 'now') { clock.sim = Date.now(); clock.rate = 1; afterTimeJump(); jyRefresh(true); return; }
    if (act.startsWith('load:')) { const p = (S.profiles || []).find((x) => x.pid === act.slice(5)); if (p) { S.birth = p; applyBirth(p); } return; }
    if (act.startsWith('del:')) { S.profiles = (S.profiles || []).filter((x) => x.pid !== act.slice(4)); persist(); $('jyBody').innerHTML = jyJanma(); return; }
    if (act === 'back' && S.birth) { applyBirth(S.birth); return; }
    if (act === 'cast') {
      const v = $('bDate').value; if (!v) return;
      const lat = parseFloat($('bLat').value), lon = parseFloat($('bLon').value);
      if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
      const city = CITIES.find((c) => c.id === $('bPlace').value && Math.abs(c.lat - lat) < 1e-3 && Math.abs(c.lon - lon) < 1e-3);
      const tz = city ? city.tz : DEVICE_TZ;
      const [d, tm] = v.split('T'); const [yy, mm, dd] = d.split('-').map(Number); const [hh, mi] = tm.split(':').map(Number);
      const guess = Date.UTC(yy, mm - 1, dd, hh, mi);
      const ms = guess - tzOffsetMin(tz, guess) * 60000;
      const name = $('bName').value.trim();
      const prev = (S.profiles || []).find((p) => p.name === name && name);
      S.birth = { pid: prev ? prev.pid : String(Date.now()), name, ms, lat, lon, tz, id: city ? city.id : 'custom', en: city ? city.en : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, hi: city ? city.hi : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` };
      S.profiles = [S.birth, ...(S.profiles || []).filter((p) => p.pid !== S.birth.pid)].slice(0, 50);
      applyBirth(S.birth);
    }
  }
  function applyBirth(b) {
    S.loc = { id: b.id, en: b.en, hi: b.hi, lat: b.lat, lon: b.lon, tz: b.tz };
    clock.sim = b.ms; clock.rate = 0;
    S.jyTab = 'kundali'; persist();
    renderSettingsText(); afterTimeJump(); jy.dashaOpen = null; jyRefresh(true);
  }

  // ---------- Antariksha Pro ----------
  const PRO_TABS = ['dasha', 'janma'];
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PRO_FEATURES = [['proF1', 'proF1s', '◎'], ['proF2', 'proF2s', '✦'], ['proF3', 'proF3s', '◔'], ['proF4', 'proF4s', '❖'], ['proF5', 'proF5s', '⚇'], ['proF6', 'proF6s', '🙏']];
  function renderPaywall() {
    $('pwList').innerHTML = PRO_FEATURES.map(([k, ks, g]) => `<li><i>${g}</i><span><b>${t(k)}</b><small>${t(ks)}</small></span></li>`).join('');
    const pro = LS.Pro.isPro();
    $('pwBuy').textContent = pro ? t('proActive') : `${t('unlockFor')} ${LS.Pro.price()}`;
    $('pwBuy').disabled = pro;
    $('pwRestore').hidden = !LS.Pro.isNative;
    const stores = $('pwStores');
    stores.hidden = true;
  }
  function showPaywall() { renderPaywall(); $('paywall').hidden = false; }
  function hidePaywall() { $('paywall').hidden = true; }
  async function buyPro() {
    const btn = $('pwBuy');
    btn.classList.add('busy');
    const res = await LS.Pro.purchase();
    btn.classList.remove('busy');
    if (res === 'purchased') { toast(t('proActive')); hidePaywall(); return; }
    if (res === 'stores') {
      const links = LS.Pro.storeLinks();
      const items = [links.ios && `<a class="store-badge" href="${links.ios}" target="_blank" rel="noopener"> App Store</a>`,
        links.android && `<a class="store-badge" href="${links.android}" target="_blank" rel="noopener">▶ Google Play</a>`].filter(Boolean);
      $('pwStores').innerHTML = `<p>${items.length ? t('proGetApp') : t('proSoon')}</p>${items.join('')}`;
      $('pwStores').hidden = false;
      return;
    }
    if (res === 'unavailable') toast(t('proUnavailable'), 5000);
  }
  function renderProRow() {
    const pro = LS.Pro.isPro();
    $('proRow').innerHTML = pro
      ? `<div class="pro-on">✦ ${t('proActive')}</div>`
      : `<button class="pill wide accent" id="proRowBuy">✦ ${t('unlockPro')} · ${LS.Pro.price()}</button>`;
    if (!pro) $('proRowBuy').addEventListener('click', () => { close('drawer'); showPaywall(); });
    if (LS.Pro.isNative) {
      const r = document.createElement('button'); r.className = 'pill wide'; r.textContent = t('restore');
      r.addEventListener('click', async () => { const ok = await LS.Pro.restore(); toast(t(ok ? 'proRestored' : 'proNothing')); });
      $('proRow').appendChild(r);
    }
  }
  $('pwClose').addEventListener('click', hidePaywall);
  $('paywall').addEventListener('click', (e) => { if (e.target.id === 'paywall') hidePaywall(); });
  $('pwBuy').addEventListener('click', buyPro);
  $('pwRestore').addEventListener('click', async () => { const ok = await LS.Pro.restore(); toast(t(ok ? 'proRestored' : 'proNothing')); renderPaywall(); });
  LS.Pro.onChange(() => { renderProRow(); syncDock(); if (!$('paywall').hidden) renderPaywall(); jyRefresh(false); if (LS.Pro.isPro()) hidePaywall(); });
  {
    const L = LS.CONFIG.links;
    for (const [id, href] of [['pwTerms', L.terms], ['pwPrivacy', L.privacy], ['lnkPrivacy', L.privacy], ['lnkTerms', L.terms], ['lnkSupport', L.support]]) $(id).href = href;
  }

  // ---------- language ----------
  function applyLang() {
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('searchInput').placeholder = t('search');
    $('btnTrack').textContent = t(view.track ? 'tracking' : 'track');
    renderSettingsText(); syncDock(); renderHud(); renderClock(); renderReadout();
    if (!$('panchang').hidden) renderPanchang();
    if (selected && !$('sheet').hidden) showSheet(selected);
    if ($('searchInput').value) runSearch($('searchInput').value);
    LS.Pages.onLanguage(); jy.tabChanged = true;
    placeGlider(); jyRefresh(true); renderProRow(); renderPage(); renderPlaceChip();
    if (!$('tonight').hidden) LS.Pages.renderTonightPanel();
    $('appVersion').textContent = `${t('versionLabel')} ${LS.CONFIG.version}`;
    if (!$('paywall').hidden) renderPaywall();
    invalidate();
  }
  $('langSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.lang = b.dataset.lang; I.set(S.lang); persist(); }));
  $('themeSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.theme = b.dataset.theme; applyTheme(); }));
  $('tabbarToggle').addEventListener('click', () => { S.tabbar = !S.tabbar; applyTheme(); invalidate(); });
  $('ratriToggle').addEventListener('click', () => setRatri(!S.ratri));
  $('tbClose').addEventListener('click', () => close('timebar'));
  $('btnRemDrawer').addEventListener('click', () => { close('drawer'); $('btnReminders').click(); });
  I.onChange(applyLang);

  // ---------- misc controls ----------
  let toastTimer = null;
  function toast(msg, ms = 3800) {
    const el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ---------- phone intro & sensor help ----------
  const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // ---------- coach marks: a cute star shows new users the compass, then the camera ----------
  const STAR = '<svg viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="cst" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".55" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9a4a"/></radialGradient></defs>'
    + '<path d="M20 3.5l4.6 9.8 10.7 1.3-7.9 7.3 2.1 10.6L20 27.3l-9.5 5.2 2.1-10.6-7.9-7.3 10.7-1.3z" fill="url(#cst)" stroke="url(#cst)" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<g class="eyes" fill="#3a1c00"><ellipse cx="16.6" cy="18.2" rx="1.45" ry="1.9"/><ellipse cx="23.4" cy="18.2" rx="1.45" ry="1.9"/></g>'
    + '<circle cx="14" cy="21.6" r="1.5" fill="#ff7a8a" opacity=".55"/><circle cx="26" cy="21.6" r="1.5" fill="#ff7a8a" opacity=".55"/>'
    + '<path d="M17.8 21.8q2.2 2.2 4.4 0" fill="none" stroke="#3a1c00" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const flag = (k, v) => { try { if (v === undefined) return localStorage.getItem('antariksha.' + k) === '1'; localStorage.setItem('antariksha.' + k, '1'); } catch (e) { /* storage blocked */ } return false; };
  const coach = { step: null, timers: [] };
  function hideCoach() {
    coach.step = null;
    for (const id of ['coach', 'coachRing', 'coachCam']) $(id).hidden = true;
    $('btnSensor').classList.remove('coach-target');
  }
  const coachBlocked = () => S.mode !== 'sky' || !$('paywall').hidden || !$('drawer').hidden || !$('reminders').hidden
    || document.body.classList.contains('yatra') || document.body.classList.contains('zen') || !$('dock').hidden || !$('timebar').hidden;
  // Place the bubble above a target point (x, y = centre of the thing we point at), with its tail aimed at it.
  function placeCoach(x, y, r) {
    const el = $('coach'), ring = $('coachRing');
    ring.style.left = `${x}px`; ring.style.top = `${y}px`; ring.style.setProperty('--r', `${r}px`);
    el.style.visibility = 'hidden'; el.hidden = false;
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = Math.max(10, Math.min(window.innerWidth - w - 10, x - w / 2));
    el.style.left = `${left}px`; el.style.top = `${y - r - h - 16}px`;
    el.style.setProperty('--tail', `${Math.max(18, Math.min(w - 18, x - left))}px`);
    el.style.visibility = '';
    ring.hidden = false;
  }
  function showCoach(step) {
    if (coachBlocked()) return;
    const sb = $('btnSensor').getBoundingClientRect();
    if (!sb.width) return;
    coach.step = step;
    $('coach').querySelector('.coach-star').innerHTML = STAR;
    $('coach').classList.toggle('cam', step === 'camera');
    $('coachText').textContent = t(step === 'sensor' ? 'coachSensor' : 'coachCamera');
    if (step === 'sensor') {
      $('btnSensor').classList.add('coach-target');
      placeCoach(sb.left + sb.width / 2, sb.top + sb.height / 2, sb.width / 2 + 4);
    } else {
      // The camera button sits just left of the compass; show a glowing stand-in there.
      const cam = $('coachCam'), size = 46;
      const x = sb.left - 34, y = sb.top + sb.height / 2;
      cam.style.left = `${x - size / 2}px`; cam.style.top = `${y - size / 2}px`;
      cam.hidden = false;
      placeCoach(x, y, size / 2 + 4);
    }
    coach.timers.push(setTimeout(() => { if (coach.step === step) hideCoach(); }, 6000));
  }
  function startCoach() {
    if (!(isTouch || LS.Pro.isNative)) return;
    try { if (sessionStorage.getItem('antariksha.coach')) return; sessionStorage.setItem('antariksha.coach', '1'); } catch (e) { /* ignore */ }
    if (!flag('usedSensor')) coach.timers.push(setTimeout(() => { if (!view.sensor) showCoach('sensor'); }, 1200));
    if (!flag('usedCamera')) coach.timers.push(setTimeout(() => { if (!view.ar && coach.step == null) showCoach('camera'); }, 13000));
  }
  $('coach').addEventListener('click', () => { const s = coach.step; hideCoach(); if (s === 'sensor') setSensor(true); else if (s === 'camera') setAR(true); });
  $('coachCam').addEventListener('click', () => { hideCoach(); setAR(true); });
  $('coachCam').innerHTML = ICON.camera;
  let locToastTimer = null;
  function showLocToast() {
    const el = $('locToast');
    $('ltPlace').textContent = nm(S.loc);
    $('ltMode').textContent = clock.rate === 1 ? t('realTime') : fmtShort(clock.sim);
    el.classList.remove('out'); el.hidden = false;
    clearTimeout(locToastTimer);
    locToastTimer = setTimeout(() => { el.classList.add('out'); locToastTimer = setTimeout(() => { el.hidden = true; }, 650); }, 2600);
  }
  function showHelp(kind) {
    $('helpText').textContent = t(kind === 'sensorBlocked' ? 'helpBlocked' : 'helpNone');
    $('help').hidden = false;
  }
  $('introSensor').addEventListener('click', () => { $('intro').hidden = true; setSensor(true); });
  $('introCamera').addEventListener('click', () => { $('intro').hidden = true; setAR(true); });
  $('introLater').addEventListener('click', () => { $('intro').hidden = true; });
  $('helpClose').addEventListener('click', () => { $('help').hidden = true; });
  $('btnMenu').innerHTML = ICON.menu;
  $('searchIco').innerHTML = ICON.search;
  $('btnSearch').innerHTML = ICON.search;
  $('searchClose').innerHTML = ICON.close;
  $('btnLayers').innerHTML = ICON.layers;
  $('btnCam').innerHTML = ICON.camera;
  $('aperture').innerHTML = ICON.aperture;
  $('ltIco').innerHTML = ICON.clock;
  $('btnSearch').addEventListener('click', () => { $('searchBox').hidden = false; $('searchInput').focus(); });
  $('searchClose').addEventListener('click', () => { $('searchInput').value = ''; runSearch(''); $('searchBox').hidden = true; });
  $('btnLayers').addEventListener('click', () => { $('dock').hidden = !$('dock').hidden; if (!$('dock').hidden) { $('timebar').hidden = true; } syncDock(); });
  $('btnSensor').addEventListener('click', () => { setSensor(!view.sensor); });
  $('btnCam').addEventListener('click', () => { setAR(!view.ar); });
  $('btnPanchang').addEventListener('click', () => { close('timebar'); open('panchang'); });
  $('btnTodayPrev').innerHTML = ICON.prev; $('btnCalPrev').innerHTML = ICON.prev;
  $('btnTodayNext').innerHTML = ICON.next; $('btnCalNext').innerHTML = ICON.next;
  $('btnShare').innerHTML = ICON.share; $('btnReminders').innerHTML = ICON.bell;
  $('remClose').innerHTML = ICON.close; $('tbClose').innerHTML = ICON.close; $('yStop').innerHTML = ICON.close;
  $('finder').querySelector('.fa').innerHTML = ICON.finder;
  $('btnZoomIn').innerHTML = ICON.plus;
  $('btnZoomOut').innerHTML = ICON.minus;
  $('compassNeedle').innerHTML = ICON.compass;
  $('btnShowUi').innerHTML = ICON.eyeOpen;
  document.querySelectorAll('[data-close]').forEach((b) => { b.innerHTML = ICON.close; });
  $('btnMenu').addEventListener('click', () => toggle('drawer'));
  $('placeChip').addEventListener('click', () => { if (S.mode === 'sky') { $('dock').hidden = true; toggle('timebar'); } else open('drawer'); });
  $('hudClock').addEventListener('click', () => { $('dock').hidden = true; toggle('timebar'); });
  const zoomBy = (k) => { view.anim = { t0: performance.now(), dur: 300, az0: view.az, daz: 0, alt0: view.alt, alt1: view.alt, fov0: view.fov, fov1: clamp(view.fov * k, 1, 180) }; };
  $('btnZoomIn').addEventListener('click', () => zoomBy(1 / 1.6));
  $('btnZoomOut').addEventListener('click', () => zoomBy(1.6));
  $('btnCompass').addEventListener('click', () => {
    if (view.sensor) return;
    view.anim = { t0: performance.now(), dur: 700, az0: view.az, daz: ((0 - view.az + 540) % 360) - 180, alt0: view.alt, alt1: view.alt, fov0: view.fov, fov1: view.fov };
  });
  $('btnShowUi').addEventListener('click', () => setZen(false));
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === '/') { e.preventDefault(); $('searchBox').hidden = false; $('searchInput').focus(); }
    if (e.key === 'Escape' && !$('paywall').hidden) { hidePaywall(); return; }
    if (e.key === 'Escape' && !$('reminders').hidden) { $('reminders').hidden = true; return; }
    if (e.key === 'Escape') { PANELS.forEach((p) => { if (!$(p).hidden) close(p); }); if (!$('sheet').hidden) close('sheet'); setZen(false); }
    const step = 4 * view.fov / 60;
    if (e.key === 'ArrowLeft') { view.az = (view.az - step + 360) % 360; invalidate(); }
    if (e.key === 'ArrowRight') { view.az = (view.az + step) % 360; invalidate(); }
    if (e.key === 'ArrowUp') { view.alt = clamp(view.alt + step, -90, 90); invalidate(); }
    if (e.key === 'ArrowDown') { view.alt = clamp(view.alt - step, -90, 90); invalidate(); }
    if (e.key === '+' || e.key === '=') zoomBy(1 / 1.25);
    if (e.key === '-') zoomBy(1.25);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && clock.rate === 1 && Math.abs(clock.sim - Date.now()) < 120e3) clock.sim = Date.now();
    invalidate();
  });

  // ---------- boot ----------
  Nm.set(S.names);
  LS.Pro.init().then(() => { renderProRow(); syncDock(); jyRefresh(false); });
  buildDock(); buildSettings(); buildTimebar(); buildSearchIndex(); initJyotish();
  LS.Pages.init({
    S, view, clock, Nm, CITIES, observer, setMode, select, goTo, toast, persist, invalidate, afterTimeJump,
    fmt, fmtTime, fmtShort, tithiName, panchangCells, isNative: LS.Pro.isNative, setMeteors,
  });
  const reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  LS.FX.init($('fx'), () => ({
    ratri: !!S.ratri, meteors: !!S.meteors && LS.Ulka.active(clock.sim).length > 0, mode: S.mode,
    basis: view.basis, fov: view.fov, fr: astro && astro.fr, sunAlt: astro ? astro.sunAlt : 0, simMs: clock.sim, reduced: reducedMotion,
  }));
  LS.Yatra.init({
    S, view, clock, Nm, observer, setMode, invalidate, afterTimeJump, toast, fmt, fmtTime, prepare,
    tithiLine: () => (panch ? tithiName(panch.tithi) : ''),
  });
  // Browsers only allow sound after a tap: resume Nada on the first touch if it was left on.
  if (S.nada) window.addEventListener('pointerdown', () => { if (S.nada && !LS.Nada.on) { LS.Nada.start(); syncDock(); } }, { once: true, capture: true });
  applyTheme();
  I.set(S.lang);
  setMode(S.mode, true);
  applyNight();
  refreshPanchang(true);
  requestAnimationFrame(frame);
  if (!saved.loc) {
    // First run: try the device's location (falls back to Ujjain, the prime meridian of Jyotisha).
    if (LS.Pro.isNative) geolocate(false);
    else if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((p) => { if (p.state !== 'denied') geolocate(false); }).catch(() => geolocate(false));
    } else geolocate(false);
  }
  // Offline cache for the website only; the apps already ship every file.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !LS.Pro.isNative) {
    // When an updated worker takes over, reload once so the new code runs.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  showLocToast();
  startCoach();
  window.__antariksha = { view, clock, S, select, goTo, setMode, setNames, jy, invalidate, showPaywall, applyTheme, setRatri, setMeteors };
})();
