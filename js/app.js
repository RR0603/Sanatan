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
    nakshatra: true, rashi: true, graha: true, constellations: false, grid: false, eqGrid: false,
    atmosphere: true, ground: true, milkyway: true, labels: true, starNames: true, night: false,
    groundOpacity: 0.82, starBrightness: 1, arFov: 62, compassOffset: 0,
    mode: 'sky', names: 'vedic', jyTab: 'kundali', kStyle: 'north', kVarga: 'D1', birth: null,
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
  function resize() { R.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 2)); invalidate(); }
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
  function tzOffsetMin(tz, ms) {
    try {
      const p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
      return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms) / 60000);
    } catch (e) { return -new Date(ms).getTimezoneOffset(); }
  }
  function localMidnight(ms, tz) {
    const off = tzOffsetMin(tz, ms) * 60000;
    return Math.floor((ms + off) / 86400000) * 86400000 - off;
  }
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
    R.render({
      basis: view.basis, fov: view.fov, fr: as.fr, grahas: as.grahas, sunAlt: as.sunAlt, ayanamsa: as.ayanamsa,
      settings: S, ar: view.ar, time: now, selectedEnu: selected ? objEnu(selected, as) : null,
    });
    dirty = false; lastFrame = now;
    if (now - lastHud > 250) { lastHud = now; renderClock(); renderReadout(); refreshPanchang(false); if (selected && !$('sheet').hidden) updateSheetLive(); }
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
  // Returns true once motion data is flowing (or at least permitted and listening).
  async function setSensor(on) {
    if (on === view.sensor) return view.sensor;
    if (on) {
      if (!window.isSecureContext) { toast(t('https'), 6000); return false; }
      const ok = await LS.Sensors.start((b) => { view.basis = b; invalidate(); }, (err) => {
        if (err === 'denied') showHelp('sensorBlocked'); else toast(t('sensorNone'), 6000);
        setSensor(false); if (view.ar) setAR(false);
      }, () => S.compassOffset);
      if (!ok) { syncDock(); return false; }
      view.sensor = true; view.track = false; view.anim = null;
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
    { key: 'nakshatra', icon: 'nakshatra' }, { key: 'rashi', icon: 'rashi' }, { key: 'graha', icon: 'graha' },
    { key: 'constellations', icon: 'western', label: 'mandala' }, { key: 'grid', icon: 'grid' },
    { key: 'names', icon: 'names', action: () => setNames(Nm.isVedic() ? 'western' : 'vedic'), state: () => Nm.isVedic(), dyn: () => (Nm.isVedic() ? 'vedicShort' : 'westernShort') }, { sep: true },
    { key: 'atmosphere', icon: 'atmosphere' }, { key: 'ground', icon: 'ground' }, { key: 'milkyway', icon: 'milkyway' }, { sep: true },
    { key: 'sensor', icon: 'sensor', cyan: true, action: () => setSensor(!view.sensor), state: () => view.sensor },
    { key: 'camera', icon: 'camera', cyan: true, action: () => setAR(!view.ar), state: () => view.ar },
    { key: 'time', icon: 'time', cyan: true, action: () => toggle('timebar'), state: () => !$('timebar').hidden, label: 'time' },
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
    $('namesSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.names === Nm.culture));
  }
  function applyNight() { document.body.classList.toggle('night', !!S.night); persist(); }
  function setZen(on) { document.body.classList.toggle('zen', on); $('btnShowUi').hidden = !on; }

  // ---------- settings drawer ----------
  const SETTING_TOGGLES = ['nakshatra', 'rashi', 'graha', 'constellations', 'grid', 'eqGrid', 'atmosphere', 'ground', 'milkyway', 'labels', 'starNames'];
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
    renderSettingsText();
    astro = null; refreshPanchang(true); invalidate();
    if (selected) showSheet(selected);
  }
  function geolocate(userAsked) {
    if (!navigator.geolocation) { if (userAsked) toast(t('locFailed')); return; }
    if (userAsked) toast(t('locating'));
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      setLocation({ id: 'gps', en: `My location · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, hi: `मेरा स्थान · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, lat, lon, tz: DEVICE_TZ });
      if (userAsked) close('drawer');
    }, () => { if (userAsked) toast(t('locFailed')); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60e3 });
  }

  // ---------- panels ----------
  const PANELS = ['panchang', 'drawer', 'timebar'];
  function toggle(id) { if ($(id).hidden) open(id); else close(id); }
  function open(id) {
    if (id === 'drawer') { $('scrim').hidden = false; }
    if (id === 'panchang' && window.innerWidth <= 720) hideSheet();
    $(id).hidden = false;
    if (id === 'panchang') renderPanchang();
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

  function renderHud() {
    $('hudLoc').textContent = nm(S.loc);
    if (panch) {
      const nk = V.nakshatras[panch.nakshatra];
      $('hudTithi').textContent = `${tithiName(panch.tithi)} · ☾ ${nm(nk)}`;
    }
  }
  function renderClock() {
    $('hudTime').textContent = fmtTime(clock.sim, true);
    $('hudDate').textContent = fmtDate(clock.sim);
    const live = clock.rate === 1 && Math.abs(clock.sim - Date.now()) < 5000;
    const b = $('liveBadge');
    b.textContent = live ? t('live') : (clock.rate === 0 ? t('paused') : `×${rateText()}`);
    b.classList.toggle('off', !live);
    if (!$('timebar').hidden) syncTimebar(true);
  }
  function renderReadout() {
    const aa = view.basis ? azAltOf(view.basis.f) : { az: view.az, alt: view.alt };
    const dir = V.directionsShort[Math.round(aa.az / 45) % 8];
    const az = Math.round(aa.az) % 360, alt = Math.round(aa.alt) || 0;
    let sensorTxt = '';
    if (view.sensor) {
      const st = LS.Sensors.status();
      sensorTxt = st.receiving ? `  ·  ● ${t('sensorLive')}${st.absolute ? '' : ' ' + t('sensorRelative')}` : `  ·  ○ ${t('sensorWaiting')}`;
    }
    $('readout').textContent = `${t('fov')} ${I.num(view.fov.toFixed(view.fov < 10 ? 1 : 0))}°  ·  ${dir} ${I.num(az)}°  ·  ${I.num(alt)}°${sensorTxt}`;
    $('compassNeedle').style.transform = `rotate(${-aa.az}deg)`;
  }

  function renderPanchang() {
    if (!panch) return;
    const p = panch;
    $('pTitle').textContent = `${fmtDate(clock.sim)} · ${nm(S.loc)}`;
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
      [t('sunrise'), sunDay && sunDay.rise ? fmtTime(sunDay.rise.date.getTime()) : '—', `${t('sunset')} ${sunDay && sunDay.set ? fmtTime(sunDay.set.date.getTime()) : '—'}`, false],
      [t('ayanamsa'), dms(p.ayanamsa), '', true],
    ];
    $('pGrid').innerHTML = cells.map(([k, v, s, wide]) => `<div class="pcell${wide ? ' wide' : ''}"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`).join('');
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
  function afterTimeJump() { astro = null; syncTimebar(); refreshPanchang(true); renderClock(); invalidate(); }

  // ---------- info sheet ----------
  function select(obj) {
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
    $('searchInput').value = ''; $('searchResults').hidden = true; $('searchInput').blur();
    select(e.obj); goTo(e.obj, true);
  }
  $('searchInput').addEventListener('input', (e) => runSearch(e.target.value));
  $('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { chooseResult(Math.max(0, activeResult)); e.preventDefault(); }
    if (e.key === 'Escape') { $('searchInput').value = ''; runSearch(''); $('searchInput').blur(); }
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
  function setMode(m, initial) {
    S.mode = m === 'jyotish' ? 'jyotish' : 'sky';
    document.body.classList.toggle('mode-jyotish', S.mode === 'jyotish');
    $('modeSwitch').querySelectorAll('.mode').forEach((b) => { b.classList.toggle('on', b.dataset.mode === S.mode); b.setAttribute('aria-selected', b.dataset.mode === S.mode); });
    $('jyotish').hidden = S.mode !== 'jyotish';
    if (S.mode === 'jyotish') {
      $('panchang').hidden = true;
      if (view.sensor && !view.ar) setSensor(false);
      requestAnimationFrame(() => { jy.wheel.resize(); jyRefresh(true); });
    }
    if (!initial && selected && !$('sheet').hidden) showSheet(selected);
    requestAnimationFrame(placeGlider);
    persist(); invalidate();
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
    $('modeSwitch').querySelector('[data-mode="sky"] .mi').innerHTML = ICON.sky;
    $('modeSwitch').querySelector('[data-mode="jyotish"] .mi').innerHTML = ICON.chakra;
    $('modeSwitch').querySelectorAll('.mode').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('namesSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setNames(b.dataset.names)));
    $('jyTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.jyTab = b.dataset.tab; persist(); renderJyPanel(); }));
    $('btnJyNow').addEventListener('click', () => { clock.sim = Date.now(); clock.rate = 1; afterTimeJump(); jyRefresh(true); });
    $('btnJySky').addEventListener('click', () => setMode('sky'));
    // Delegated clicks inside the panel.
    $('jyBody').addEventListener('click', (e) => {
      const g = e.target.closest('[data-g]');
      if (g && g.dataset.g !== 'lagna') { jy.selected = g.dataset.g; jy.wheel.setSelected(jy.selected); select({ type: 'graha', id: jy.selected }); renderJyPanel(); return; }
      const opt = e.target.closest('[data-opt]');
      if (opt) { S[opt.dataset.opt] = opt.dataset.val; persist(); renderJyPanel(); return; }
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
    $('jyTabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.jyTab));
    const c = jy.chart;
    const html = { kundali: jyKundali, grahas: jyGrahas, dasha: jyDasha, janma: jyJanma }[S.jyTab] || jyKundali;
    // Keep form fields intact while the clock ticks.
    if (S.jyTab === 'janma' && $('jyBody').querySelector('#bDate')) return;
    $('jyBody').innerHTML = html(c);
  }
  const optSeg = (key, opts) => `<div class="seg mini">${opts.map(([v, label]) => `<button data-opt="${key}" data-val="${v}" class="${S[key] === v ? 'on' : ''}">${label}</button>`).join('')}</div>`;

  function jyKundali(c) {
    const d9 = S.kVarga === 'D9';
    const items = c.grahas.map((g) => ({ id: g.id, rashi: d9 ? g.navamsa : g.rashi, retro: g.retro, deg: d9 ? null : g.deg }));
    const L = d9 ? c.navamsaLagna : c.lagnaRashi;
    const title = t(d9 ? 'navamsa' : 'rashiChart');
    const svg = LS.ChartView.kundaliSVG(L, items, S.kStyle, { selected: jy.selected, showDeg: !d9, title, subtitle: fmtDay(c.ms) });
    const moon = c.byId.chandra;
    return `<div class="jy-sub">${optSeg('kStyle', [['north', t('north')], ['south', t('south')]])}${optSeg('kVarga', [['D1', 'D1'], ['D9', 'D9']])}</div>
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
    return `<div class="form">
      <div class="eyebrow">${t('birthTitle')}</div>
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
    if (act === 'now') { clock.sim = Date.now(); clock.rate = 1; afterTimeJump(); jyRefresh(true); return; }
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
      S.birth = { name: $('bName').value.trim(), ms, lat, lon, tz, id: city ? city.id : 'custom', en: city ? city.en : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, hi: city ? city.hi : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` };
      applyBirth(S.birth);
    }
  }
  function applyBirth(b) {
    S.loc = { id: b.id, en: b.en, hi: b.hi, lat: b.lat, lon: b.lon, tz: b.tz };
    clock.sim = b.ms; clock.rate = 0;
    S.jyTab = 'kundali'; persist();
    renderSettingsText(); afterTimeJump(); jy.dashaOpen = null; jyRefresh(true);
  }

  // ---------- language ----------
  function applyLang() {
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('searchInput').placeholder = t('search');
    $('btnLang').querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.l === I.lang));
    $('btnTrack').textContent = t(view.track ? 'tracking' : 'track');
    renderSettingsText(); syncDock(); renderHud(); renderClock(); renderReadout();
    if (!$('panchang').hidden) renderPanchang();
    if (selected && !$('sheet').hidden) showSheet(selected);
    if ($('searchInput').value) runSearch($('searchInput').value);
    placeGlider(); jyRefresh(true);
    invalidate();
  }
  $('btnLang').addEventListener('click', () => { S.lang = I.lang === 'en' ? 'hi' : 'en'; I.set(S.lang); persist(); });
  I.onChange(applyLang);

  // ---------- misc controls ----------
  let toastTimer = null;
  function toast(msg, ms = 3800) {
    const el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ---------- phone intro & sensor help ----------
  const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  function showIntro() {
    if (!isTouch || view.sensor) return;
    $('intro').hidden = false;
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
  $('btnZoomIn').innerHTML = ICON.plus;
  $('btnZoomOut').innerHTML = ICON.minus;
  $('compassNeedle').innerHTML = ICON.compass;
  $('btnShowUi').innerHTML = ICON.eyeOpen;
  document.querySelectorAll('[data-close]').forEach((b) => { b.innerHTML = ICON.close; });
  $('btnMenu').addEventListener('click', () => toggle('drawer'));
  $('hudMain').addEventListener('click', () => toggle('panchang'));
  $('hudClock').addEventListener('click', () => toggle('timebar'));
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
    if (e.key === '/') { e.preventDefault(); $('searchInput').focus(); }
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
  buildDock(); buildSettings(); buildTimebar(); buildSearchIndex(); initJyotish();
  I.set(S.lang);
  setMode(S.mode, true);
  applyNight();
  refreshPanchang(true);
  requestAnimationFrame(frame);
  if (!saved.loc) {
    // First run: try the device's location (falls back to Ujjain, the prime meridian of Jyotisha).
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((p) => { if (p.state !== 'denied') geolocate(false); }).catch(() => geolocate(false));
    } else geolocate(false);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // When an updated worker takes over, reload once so the new code runs.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  setTimeout(showIntro, 600);
  window.__antariksha = { view, clock, S, select, goTo, setMode, setNames, jy };
})();
