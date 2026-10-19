// Feature pages: Today (daily timings), Calendar (festivals & vrats), Tonight (sky guide + AR finder),
// Kundali Milan, reminders and sharing. app.js calls LS.Pages.init(ctx) with its shared helpers.
window.LS = window.LS || {};

LS.Pages = (function () {
  const A = window.Astronomy, Sky = LS.Sky, TZ = LS.TZ, V = LS.VEDIC, I = LS.I18N;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, DAY = 86400000;
  let C = null; // context from app.js
  const t = (k) => I.t(k);
  const nm = (o) => I.name(o);
  const $ = (id) => document.getElementById(id);
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- shared bits ----------
  const tz = () => C.S.loc.tz;
  const obs = () => C.observer();
  const dayStart = (ms) => TZ.midnight(ms, tz());
  // Civil day length (23/25 h when clocks change) and weekday for the timings.
  const dayOpts = (day0) => ({ dayEnd: TZ.addDays(day0, 1, tz()), weekday: TZ.parts(day0 + 12 * 3600e3, tz()).wd });
  const tm = (ms) => (ms == null ? '—' : C.fmtTime(ms));
  const span = (a, b) => `${tm(a)} – ${tm(b)}`;
  const isLive = () => C.clock.rate === 1 && Math.abs(C.clock.sim - Date.now()) < 5000;
  const nowMs = () => (isLive() ? Date.now() : C.clock.sim);

  // Moon phase drawn as SVG: elong 0 = new, 180 = full; waxing lit on the right (northern-hemisphere view).
  function moonSVG(elong, size = 44) {
    const r = size / 2 - 1, c = size / 2;
    const k = Math.cos(elong * D2R); // 1 new .. -1 full
    const waxing = elong < 180;
    const rx = Math.abs(k) * r;
    const lit = waxing ? 1 : 0;
    // Lit half + terminator ellipse.
    const half = `M ${c} ${c - r} A ${r} ${r} 0 0 ${lit} ${c} ${c + r}`;
    const term = `A ${rx} ${r} 0 0 ${k > 0 ? 1 - lit : lit} ${c} ${c - r}`;
    return `<svg class="moon-ic" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <defs><radialGradient id="mg${size}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9d3c2"/></radialGradient></defs>
      <circle cx="${c}" cy="${c}" r="${r}" fill="rgba(120,130,160,.22)" stroke="rgba(255,255,255,.18)"/>
      <path d="${half} ${term} Z" fill="url(#mg${size})"/></svg>`;
  }

  // ---------- Today ----------
  let today = null; // cached computation for the current day/location
  function computeToday() {
    const day0 = dayStart(C.clock.sim);
    const key = `${day0}|${C.S.loc.lat},${C.S.loc.lon}`;
    if (today && today.key === key) return today;
    const o = obs();
    const mu = LS.Muhurta.day(o, day0, dayOpts(day0));
    // Just after sunrise, so the Panchang's sunrise-to-sunrise vara is today's.
    const ref = mu.sunrise ? mu.sunrise + 60e3 : day0 + 6 * 3600e3;
    const p = Sky.panchang(A.MakeTime(new Date(ref)), o);
    p.vara = mu.vara;
    today = { key, day0, mu, p, upcoming: [], todays: [] };
    // The 45-day festival scan is the slow part: paint the page first, then fill it in.
    const fill = () => {
      if (!today || today.key !== key) return;
      try {
        const r = LS.Calendar.range(o, tz(), day0, 45);
        today.upcoming = r.events.filter((e) => e.kind !== 'pradosh' && e.kind !== 'vinayaka' && e.kind !== 'shivaratri' && e.kind !== 'sankashti');
        today.todays = r.days[0].events;
      } catch (e) { console.warn(e); }
      if (C.S.mode === 'today') renderToday();
    };
    setTimeout(fill, 30);
    return today;
  }

  // The state of the day right now: which kaal or muhurta is running, and what comes next.
  function nowStatus(mu, now) {
    if (mu.polar) return null;
    const items = [['rahu', mu.rahu], ['yama', mu.yama], ['gulika', mu.gulika], ['abhijit', mu.abhijit], ['brahma', mu.brahma]].filter((x) => x[1]);
    const cur = items.find(([, w]) => now >= w[0] && now < w[1]);
    if (cur) return { k: cur[0], live: true, mins: Math.round((cur[1][1] - now) / 60000) };
    const next = items.filter(([, w]) => w[0] > now).sort((a, b) => a[1][0] - b[1][0])[0];
    return next ? { k: next[0], live: false, mins: Math.round((next[1][0] - now) / 60000) } : null;
  }
  const dur = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? `${I.num(h)}${t('hShort')} ${I.num(m)}${t('mShort')}` : `${I.num(m)}${t('mShort')}`;
  };

  function renderToday() {
    const el = $('todayBody'); if (!el) return;
    const T0 = computeToday(), mu = T0.mu, p = T0.p;
    const now = nowMs();
    const isToday = dayStart(Date.now()) === T0.day0;
    $('todayDate').textContent = C.fmt(T0.day0 + 12 * 3600e3, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('todayPlace').textContent = nm(C.S.loc);
    $('btnTodayNow').hidden = isToday && isLive();
    const elong = A.MoonPhase(A.MakeTime(new Date(now)));
    const illum = Math.round((1 - Math.cos(elong * D2R)) / 2 * 100);
    const nk = V.nakshatras[p.nakshatra];
    const live = isToday ? Sky.panchang(A.MakeTime(new Date(now)), obs()) : p;
    const hero = `
      <div class="t-hero card">
        <div class="t-moon">${moonSVG(elong, 64)}<span>${I.num(illum)}%</span></div>
        <div class="t-hero-main">
          <div class="eyebrow">${nm(V.varas[mu.vara])} · ${nm(V.months[p.month])}${p.adhika ? ' (' + t('adhika') + ')' : ''} · ${t('vikram')} ${I.num(p.vikram)}</div>
          <div class="t-tithi">${C.tithiName(live.tithi)}</div>
          <div class="t-sub">${nm(V.nakshatras[live.nakshatra])} ${t('nakshatra').toLowerCase()} · ${nm(V.yogas[live.yoga])} ${t('yoga').toLowerCase()}</div>
          ${live.tithiEnd ? `<div class="t-until">${t('until')} ${C.fmtShort(live.tithiEnd.date.getTime())}</div>` : ''}
        </div>
      </div>
      ${T0.todays.length ? `<div class="t-events">${T0.todays.map((e) => `<button class="t-ev k-${e.kind}" data-cal="${e.key}"><i></i>${esc(nm(e.name))}</button>`).join('')}</div>` : ''}
      <div class="t-sun card">
        ${sunCell('sunrise', mu.sunrise)}${sunCell('sunset', mu.sunset)}${sunCell('moonrise', mu.moonrise)}${sunCell('moonset', mu.moonset)}
      </div>`;
    let timeline = '';
    if (mu.polar) timeline = `<div class="card"><p class="note">${t('polarDay')}</p></div>`;
    else {
      const st = isToday ? nowStatus(mu, now) : null;
      const pct = (x) => Math.max(0, Math.min(100, (x - mu.sunrise) / (mu.sunset - mu.sunrise) * 100));
      const seg = (k, w) => `<i class="seg-${k}" style="left:${pct(w[0])}%;width:${pct(w[1]) - pct(w[0])}%"></i>`;
      const marker = isToday && now > mu.sunrise && now < mu.sunset ? `<b class="now" style="left:${pct(now)}%"></b>` : '';
      const row = (k, w, bad) => (w ? `<div class="mrow${bad ? ' bad' : ' good'}${isToday && now >= w[0] && now < w[1] ? ' cur' : ''}"><i class="dot-${k}"></i><span>${t('mu_' + k)}</span><b>${span(w[0], w[1])}</b></div>` : '');
      timeline = `
      <div class="card">
        <div class="card-head"><div class="eyebrow">${t('dayTimings')}</div>${st ? `<div class="t-status ${st.k === 'abhijit' || st.k === 'brahma' ? 'good' : 'bad'}">${st.live ? `${t('mu_' + st.k)} · ${t('endsIn')} ${dur(st.mins)}` : `${t('mu_' + st.k)} ${t('startsIn')} ${dur(st.mins)}`}</div>` : ''}</div>
        <div class="daybar">${seg('rahu', mu.rahu)}${seg('yama', mu.yama)}${seg('gulika', mu.gulika)}${seg('abhijit', mu.abhijit)}${marker}</div>
        <div class="daybar-l"><span>${tm(mu.sunrise)}</span><span>${t('madhyahna')}</span><span>${tm(mu.sunset)}</span></div>
        ${row('brahma', mu.brahma, false)}${row('abhijit', mu.abhijit, false)}${row('rahu', mu.rahu, true)}${row('yama', mu.yama, true)}${row('gulika', mu.gulika, true)}
        ${mu.vara === 3 ? `<p class="note">${t('abhijitWed')}</p>` : ''}
      </div>`;
    }
    const chogh = mu.choghadiya ? choghadiyaCard(mu, isToday ? now : null) : '';
    const panchang = `<div class="card"><div class="card-head"><div class="eyebrow">${t('panchang')}</div></div><div class="pgrid">${C.panchangCells(p, mu)}</div></div>`;
    el.innerHTML = hero + timeline + chogh + tonightCard() + upcomingCard(T0) + panchang;
  }
  function sunCell(k, ms) {
    const ic = { sunrise: '☀︎↑', sunset: '☀︎↓', moonrise: '☾↑', moonset: '☾↓' }[k];
    return `<div class="sun-cell"><span class="ic">${ic}</span><span class="k">${t(k)}</span><b>${tm(ms)}</b></div>`;
  }
  let choghNight = null;
  function choghadiyaCard(mu, now) {
    const hasNight = mu.choghadiya.some((c) => c.night);
    const night = hasNight && (choghNight == null ? (now != null && now >= mu.sunset) : choghNight);
    const list = mu.choghadiya.filter((c) => c.night === night);
    return `<div class="card">
      <div class="card-head"><div class="eyebrow">${t('choghadiya')}</div>
        ${hasNight ? `<div class="seg mini"><button data-chogh="day" class="${night ? '' : 'on'}">${t('chDay')}</button><button data-chogh="night" class="${night ? 'on' : ''}">${t('chNight')}</button></div>` : ''}</div>
      <div class="chogh">${list.map((c) => `<div class="ch q-${c.q}${now != null && now >= c.s && now < c.e ? ' cur' : ''}"><b>${t('ch_' + c.id)}</b><span>${span(c.s, c.e)}</span><em>${t('q_' + c.q)}</em></div>`).join('')}</div>
    </div>`;
  }
  function upcomingCard(T0) {
    const nowDay = dayStart(Date.now());
    const items = T0.upcoming.filter((e) => e.day >= T0.day0).slice(0, 5);
    if (!items.length) return '';
    return `<div class="card"><div class="card-head"><div class="eyebrow">${t('comingUp')}</div><button class="link" data-goto="calendar">${t('calendar')} →</button></div>
      ${items.map((e) => { const n = Math.round((e.day - nowDay) / DAY); return `<button class="up-row k-${e.kind}" data-cal="${e.key}"><i></i><span><b>${esc(nm(e.name))}</b><small>${C.fmt(e.day + 12 * 3600e3, { weekday: 'short', day: 'numeric', month: 'short' })}</small></span><em>${n === 0 ? t('today') : n === 1 ? t('tomorrow') : n > 1 ? `${t('inDays').replace('{n}', I.num(n))}` : ''}</em></button>`; }).join('')}</div>`;
  }

  // ---------- Tonight: what is up in the sky ----------
  const TONIGHT = ['chandra', 'shukra', 'guru', 'mangala', 'shani', 'budha'];
  function equAlt(body, o, ms) {
    const time = A.MakeTime(new Date(ms));
    const eq = A.Equator(body, time, o, true, true);
    const h = A.Horizon(time, o, eq.ra, eq.dec, 'normal');
    return { alt: h.altitude, az: h.azimuth };
  }
  let tonightCache = null;
  function tonight() {
    const o = obs(), now = nowMs();
    const key = `${Math.floor(now / 600000)}|${C.S.loc.lat},${C.S.loc.lon}`;
    if (tonightCache && tonightCache.key === key) return tonightCache;
    const sunNow = equAlt(A.Body.Sun, o, now).alt;
    let start = now, noDark = false;
    if (sunNow > -6) {
      const ss = A.SearchAltitude(A.Body.Sun, o, -1, A.MakeTime(new Date(now)), 1, -6);
      // White nights: the Sun never gets 6° below the horizon, so there is no dark sky tonight.
      if (ss) start = ss.date.getTime(); else noDark = true;
    }
    const endT = noDark ? null : A.SearchAltitude(A.Body.Sun, o, +1, A.MakeTime(new Date(start)), 1, -6);
    const end = endT ? endT.date.getTime() : start + 10 * 3600e3;
    const rows = [];
    const sunTime = A.MakeTime(new Date(now));
    for (const id of TONIGHT) {
      const g = V.grahas[id], body = A.Body[g.body];
      let best = null, first = null, last = null;
      for (let s = start; !noDark && s <= end; s += 15 * 60000) {
        const h = equAlt(body, o, s);
        if (h.alt > 8) { if (!first) first = s; last = s; if (!best || h.alt > best.alt) best = { ...h, at: s }; }
      }
      const elong = A.AngleFromSun(body, sunTime);
      const nowH = equAlt(body, o, now);
      const mag = id === 'chandra' ? -12 : A.Illumination(body, sunTime).mag;
      rows.push({ id, best, first, last, nowAlt: nowH.alt, nowAz: nowH.az, elong, mag, glare: id !== 'chandra' && elong < 12 });
    }
    rows.sort((a, b) => (!!b.best - !!a.best) || (a.mag - b.mag));
    tonightCache = { key, start, end, rows, dark: sunNow < -6, noDark };
    return tonightCache;
  }
  const dirName = (az) => V.directionsShort[Math.round(az / 45) % 8];
  function tonightRowHtml(r) {
    const g = V.grahas[r.id];
    let status;
    if (r.glare) status = t('inGlare');
    else if (!r.best) status = t('notTonight');
    else if (tonightCache.dark && r.nowAlt > 8) status = `<span class="live">● ${t('visibleNow')}</span> · ${dirName(r.nowAz)} ${I.num(Math.round(r.nowAlt))}°`;
    else status = `${span(r.first, r.last)} · ${t('best')} ${tm(r.best.at)} ${dirName(r.best.az)}`;
    const extra = r.id === 'chandra' ? `${I.num(Math.round((1 - Math.cos(A.MoonPhase(A.MakeTime(new Date(nowMs()))) * D2R)) / 2 * 100))}%` : `${t('mag')} ${I.num(r.mag.toFixed(1))}`;
    return `<button class="tn-row${r.best && !r.glare ? '' : ' dim'}" data-find="${r.id}">
      <span class="g" style="color:${g.color}">${g.glyph}</span>
      <span class="tn-main"><b>${C.Nm.graha(r.id)}</b><small>${status}</small></span>
      <span class="tn-x">${extra}<i>${t('find')} ›</i></span></button>`;
  }
  // Meteor showers (Ulka): the active one, or the next peak.
  function meteorRow() {
    const now = nowMs(), act = LS.Ulka.active(now)[0];
    const con = (s) => { const c = V.constellations[s.con]; return c ? (I.lang === 'hi' ? c[1] : c[0]) : s.con; };
    if (act) {
      const peak = Math.abs(act.days) < 1.5 ? t('atPeak') : `${t('peak')} ${C.fmt(now - act.days * DAY, { day: 'numeric', month: 'short' })}`;
      return `<button class="tn-row meteor" data-meteors="1"><span class="g">☄</span><span class="tn-main"><b>${nm(act.name)}</b><small>${peak} · ${t('upTo')} ${I.num(act.zhr)}/${t('hShort')} · ${t('radiantIn')} ${con(act)}</small></span><span class="tn-x"><i>${t('show')} ›</i></span></button>`;
    }
    const nx = LS.Ulka.next(now);
    return nx ? `<div class="tn-row meteor dim"><span class="g">☄</span><span class="tn-main"><b>${t('nextShower')}: ${nm(nx.name)}</b><small>${t('peak')} ${C.fmt(nx.peakMs, { day: 'numeric', month: 'short' })} · ${t('upTo')} ${I.num(nx.zhr)}/${t('hShort')}</small></span></div>` : '';
  }
  function tonightCard() {
    let tn; try { tn = tonight(); } catch (e) { console.warn(e); return ''; }
    const moonNak = V.nakshatras[Math.floor(Sky.sidLonOf(A.Body.Moon, A.MakeTime(new Date(nowMs()))) / (360 / 27))];
    return `<div class="card"><div class="card-head"><div class="eyebrow">${t('tonightSky')}</div><span class="muted">${tn.noDark ? t('brightNight') : span(tn.start, tn.end)}</span></div>
      ${tn.rows.map(tonightRowHtml).join('')}${meteorRow()}
      <p class="note">${t('moonIn')} <b>${nm(moonNak)}</b> — ${t('findHint')}</p></div>`;
  }
  function renderTonightPanel() {
    const el = $('tonightBody'); if (!el || $('tonight').hidden) return;
    let tn; try { tn = tonight(); } catch (e) { return; }
    $('tnTitle').textContent = `${tn.noDark ? t('brightNight') : span(tn.start, tn.end)} · ${nm(C.S.loc)}`;
    el.innerHTML = tn.rows.map(tonightRowHtml).join('') + meteorRow() + `<p class="note">${t('findHint')}</p>`;
  }
  // Show the object in the sky: select it and either fly there or (with the sensor on) guide the phone.
  function find(id) {
    const obj = { type: 'graha', id };
    C.setMode('sky');
    $('tonight').hidden = true;
    requestAnimationFrame(() => {
      C.select(obj);
      if (!C.view.sensor) C.goTo(obj, true);
      C.toast(C.view.sensor ? t('finderOn') : t('finderTip'), 4000);
    });
  }

  // AR finder: an arrow at the screen edge pointing to the selected object while it is off-screen.
  let foundBuzz = null;
  function updateFinder(sel, enu, basis, fov) {
    const el = $('finder'); if (!el) return;
    if (!sel || !enu || C.S.mode !== 'sky') { el.hidden = true; return; }
    const x = enu[0] * basis.r[0] + enu[1] * basis.r[1] + enu[2] * basis.r[2];
    const y = enu[0] * basis.u[0] + enu[1] * basis.u[1] + enu[2] * basis.u[2];
    const z = enu[0] * basis.f[0] + enu[1] * basis.f[1] + enu[2] * basis.f[2];
    const W = window.innerWidth, H = window.innerHeight;
    const scale = (H / 2) / (2 * Math.tan(fov * D2R / 4));
    const k = 2 / (1 + Math.max(z, -0.9));
    const sx = W / 2 + scale * k * x, sy = H / 2 - scale * k * y;
    const off = 40;
    const onScreen = z > -0.5 && sx > off && sx < W - off && sy > off + 40 && sy < H - off - 80;
    const ang = Math.acos(Math.max(-1, Math.min(1, z))) * R2D;
    if (onScreen) {
      el.hidden = true;
      if (C.view.sensor && ang < 4 && foundBuzz !== sel.id) { foundBuzz = sel.id; haptic(); LS.Nada.chime('found'); C.toast(`${t('found')} ✦`, 1800); }
      return;
    }
    if (foundBuzz === sel.id && ang > 10) foundBuzz = null;
    const a = Math.atan2(-y, x); // screen angle (y down)
    const cx = W / 2, cy = H / 2, rx = W / 2 - 46, ry = H / 2 - 110;
    const tx = Math.cos(a), ty = Math.sin(a);
    const s = Math.min(rx / Math.abs(tx || 1e-6), ry / Math.abs(ty || 1e-6));
    el.style.transform = `translate(${cx + tx * s - 28}px, ${cy + ty * s - 28}px)`;
    el.querySelector('.fa').style.transform = `rotate(${a * R2D}deg)`;
    el.querySelector('.fl').textContent = `${I.num(Math.round(ang))}°`;
    el.hidden = false;
  }
  function haptic() {
    try {
      const H = C.isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H) H.impact({ style: 'MEDIUM' }); else if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) { /* ignore */ }
  }

  // ---------- Calendar ----------
  const cal = { y: null, m: null, sel: null, filter: 'all' };
  const KIND_GROUP = { festival: 'festival', sankranti: 'festival', ekadashi: 'vrat', purnima: 'vrat', amavasya: 'vrat', pradosh: 'vrat', sankashti: 'vrat', vinayaka: 'vrat', shivaratri: 'vrat', eclipse: 'eclipse' };
  function renderCalendar() {
    const el = $('calBody'); if (!el) return;
    if (cal.y == null) { const p = TZ.parts(C.clock.sim, tz()); cal.y = p.y; cal.m = p.m; cal.sel = TZ.key(C.clock.sim, tz()); }
    let res;
    try { res = LS.Calendar.month(obs(), tz(), cal.y, cal.m); } catch (e) { console.warn(e); el.innerHTML = ''; return; }
    $('calTitle').textContent = C.fmt(Date.UTC(cal.y, cal.m, 15, 12), { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const lun = res.days[Math.floor(res.days.length / 2)];
    $('calSub').textContent = `${nm(V.months[res.days[0].month])}${res.days[0].month !== res.days[res.days.length - 1].month ? ' – ' + nm(V.months[res.days[res.days.length - 1].month]) : ''} · ${nm(C.S.loc)}`;
    void lun;
    const todayKey = TZ.key(Date.now(), tz());
    const first = res.days[0].wd;
    const SHORT_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    const wk = [0, 1, 2, 3, 4, 5, 6].map((w) => `<span>${I.lang === 'hi' ? SHORT_HI[w] : nm(V.varas[w]).slice(0, 3)}</span>`).join('');
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="cd empty"></span>';
    for (const d of res.days) {
      const evs = d.events.filter((e) => cal.filter === 'all' || KIND_GROUP[e.kind] === cal.filter);
      const tithiNo = (d.tithi % 15) + 1;
      const lbl = d.tithi === 14 ? '◯' : d.tithi === 29 ? '●' : `${d.tithi < 15 ? (I.lang === 'hi' ? 'शु' : 'S') : (I.lang === 'hi' ? 'कृ' : 'K')}${I.num(tithiNo)}`;
      const big = evs.find((e) => e.kind === 'festival' || e.kind === 'eclipse' || e.kind === 'ekadashi' || e.kind === 'sankranti');
      cells += `<button class="cd${d.key === todayKey ? ' today' : ''}${d.key === cal.sel ? ' sel' : ''}${big ? ' has k-' + big.kind : ''}" data-day="${d.key}">
        <b>${I.num(d.d)}</b><small>${lbl}</small><span class="dots">${evs.slice(0, 3).map((e) => `<i class="k-${e.kind}"></i>`).join('')}</span></button>`;
    }
    const sel = res.days.find((d) => d.key === cal.sel) || res.days[0];
    const chips = ['all', 'festival', 'vrat', 'eclipse'].map((f) => `<button data-filter="${f}" class="${cal.filter === f ? 'on' : ''}">${t('f_' + f)}</button>`).join('');
    const list = res.events.filter((e) => cal.filter === 'all' || KIND_GROUP[e.kind] === cal.filter);
    el.innerHTML = `
      <div class="card cal-card">
        <div class="seg mini cal-chips">${chips}</div>
        <div class="cal-wk">${wk}</div>
        <div class="cal-grid">${cells}</div>
        <div class="cal-legend"><span><i class="k-festival"></i>${t('f_festival')}</span><span><i class="k-ekadashi"></i>${t('ekadashi')}</span><span><i class="k-purnima"></i>${t('purnimaAmavasya')}</span><span><i class="k-eclipse"></i>${t('f_eclipse')}</span></div>
      </div>
      ${dayDetail(sel)}
      <div class="card"><div class="card-head"><div class="eyebrow">${t('thisMonth')}</div><span class="muted">${I.num(list.length)}</span></div>
        ${list.length ? list.map((e) => `<button class="up-row k-${e.kind}" data-day="${e.key}"><i></i><span><b>${esc(nm(e.name))}</b><small>${C.fmt(e.day + 12 * 3600e3, { weekday: 'short', day: 'numeric', month: 'short' })}${e.kind === 'eclipse' ? ` · ${span(e.start, e.end)}${e.visible ? '' : ' · ' + t('notVisibleHere')}` : ''}</small></span></button>`).join('') : `<p class="note">${t('noEvents')}</p>`}
      </div>`;
  }
  function dayDetail(d) {
    const date = C.fmt(d.ms + 12 * 3600e3, { weekday: 'long', day: 'numeric', month: 'long' });
    const nk = V.nakshatras[d.nak];
    const evs = d.events.map((e) => {
      let when = '';
      if (e.kind === 'eclipse') when = `${span(e.start, e.end)} · ${t('peak')} ${tm(e.at)}${e.visible ? '' : ' · ' + t('notVisibleHere')}`;
      else if (e.kind === 'sankranti') when = `${t('sunEnters')} ${tm(e.at)}`;
      else {
        const sp = LS.Calendar.tithiSpan(e.tithi, e.at);
        when = sp ? `${C.tithiName(e.tithi)} · ${C.fmtShort(sp.start)} → ${C.fmtShort(sp.end)}` : '';
      }
      return `<div class="ev k-${e.kind}"><i></i><span><b>${esc(nm(e.name))}</b><small>${when}</small></span></div>`;
    }).join('');
    return `<div class="card day-card">
      <div class="card-head"><div><div class="eyebrow">${nm(V.months[d.month])}${d.adhika ? ' · ' + t('adhika') : ''}</div><div class="day-title">${date}</div></div>
        <button class="pill accent" data-open-day="${d.key}">${t('openDay')}</button></div>
      <div class="day-facts"><span>${C.tithiName(d.tithi)}</span><span>${nm(nk)}</span><span>☀︎ ${tm(d.polar ? null : d.sunrise)} – ${tm(d.polar ? null : d.sunset)}</span></div>
      ${evs || `<p class="note">${t('noEventsDay')}</p>`}
    </div>`;
  }
  function openDay(key) {
    const [y, m, d] = key.split('-').map(Number);
    const ms = TZ.fromCivil(y, m - 1, d, tz()) + 12 * 3600e3;
    C.clock.sim = ms; C.clock.rate = dayStart(Date.now()) === dayStart(ms) ? 1 : 0;
    if (C.clock.rate === 1) C.clock.sim = Date.now();
    C.afterTimeJump();
    C.setMode('today');
  }
  function calSelect(key) {
    const [y, m] = key.split('-').map(Number);
    cal.sel = key; cal.y = y; cal.m = m - 1;
    renderCalendar();
  }

  // ---------- Kundali Milan ----------
  const milan = { g: null, b: null, res: null };
  function personForm(role, p) {
    const pro = LS.Pro.isPro();
    const profiles = pro ? (C.S.profiles || []) : [];
    const dr = milan.draft && milan.draft[role];
    const ms = p ? p.ms : null;
    const val = dr ? dr.date : ms ? new Date(ms + TZ.offsetMin(p.tz, ms) * 60000).toISOString().slice(0, 16) : '';
    const place = dr ? dr.place : p ? p.id : '';
    const opts = C.CITIES.map((c) => `<option value="${c.id}"${place === c.id ? ' selected' : ''}>${nm(c)}</option>`).join('');
    return `<div class="mi-person" data-role="${role}">
      <div class="eyebrow">${t(role === 'g' ? 'groom' : 'bride')}</div>
      ${profiles.length ? `<select class="field" data-mi="profile"><option value="">${t('pickProfile')}</option>${profiles.map((x) => `<option value="${x.pid}">${esc(x.name || t('birthChart'))}</option>`).join('')}</select>` : ''}
      <input class="field" data-mi="name" placeholder="${t('birthName')}" value="${esc(dr ? dr.name : p ? p.name : '')}" maxlength="40">
      <input class="field" data-mi="date" type="datetime-local" value="${val}">
      <select class="field" data-mi="place"><option value="">${t('birthPlace')}</option>${opts}</select>
    </div>`;
  }
  function milanHtml() {
    const r = milan.res;
    let out = `<div class="form milan">
      <p class="note" style="margin-top:0">${t('milanIntro')}</p>
      <div class="mi-pair">${personForm('g', milan.g)}${personForm('b', milan.b)}</div>
      <button class="pill wide accent" data-act="milan:match">${t('matchNow')}</button>`;
    if (r) {
      const pct = r.total / 36;
      const R = 52, Cc = 2 * Math.PI * R;
      out += `<div class="mi-result card">
        <div class="mi-score"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="trk"/><circle cx="60" cy="60" r="${R}" class="val b-${r.band}" stroke-dasharray="${Cc * pct} ${Cc}" transform="rotate(-90 60 60)"/></svg>
          <div><b>${I.num(r.total)}</b><span>/ ${I.num(36)}</span></div></div>
        <div class="mi-verdict b-${r.band}">${t('band_' + r.band)}</div>
        <div class="mi-names">${esc(milan.g.name || t('groom'))} · ${esc(milan.b.name || t('bride'))}</div>
        <div class="kootas">${r.kootas.map((k) => `<div class="koota"><span>${t('k_' + k.key)}<small>${t('kd_' + k.key)}</small></span><div class="kbar"><i style="width:${k.score / k.max * 100}%"></i></div><b>${I.num(k.score)}/${I.num(k.max)}</b></div>`).join('')}</div>
        <div class="mi-dosha">${mangalLine(t('groom'), r.groom.mangal)}${mangalLine(t('bride'), r.bride.mangal)}</div>
        ${r.notes.map((n) => `<p class="note ok">✓ ${t('mn_' + n)}</p>`).join('')}
        <p class="note">${t('milanNote')}</p>
      </div>`;
    }
    return out + '</div>';
  }
  function mangalLine(who, m) {
    const where = [m.lagna ? t('fromLagna') : '', m.moon ? t('fromMoon') : ''].filter(Boolean).join(', ');
    return `<div class="md ${m.present && !m.strong ? 'bad' : 'good'}"><b>${who}</b><span>${m.present ? `${t('mangalYes')} (${where})${m.strong ? ' · ' + t('mangalStrong') : ''}` : t('mangalNo')}</span></div>`;
  }
  // Keep what was typed when the form is redrawn (e.g. after a language switch).
  function captureMilan() {
    const boxes = document.querySelectorAll('.mi-person'); if (!boxes.length) return;
    milan.draft = {};
    boxes.forEach((box) => { const q = (k) => box.querySelector(`[data-mi="${k}"]`).value; milan.draft[box.dataset.role] = { name: q('name'), date: q('date'), place: q('place') }; });
  }
  function readPerson(role) {
    const box = document.querySelector(`.mi-person[data-role="${role}"]`); if (!box) return null;
    const q = (k) => box.querySelector(`[data-mi="${k}"]`);
    const v = q('date').value, city = C.CITIES.find((c) => c.id === q('place').value);
    if (!v || !city) return null;
    const [d, tmv] = v.split('T'); const [yy, mm, dd] = d.split('-').map(Number); const [hh, mi] = tmv.split(':').map(Number);
    const ms = TZ.fromCivil(yy, mm - 1, dd, city.tz, hh, mi);
    return { name: q('name').value.trim(), ms, lat: city.lat, lon: city.lon, tz: city.tz, id: city.id };
  }
  function milanAction(act, target) {
    if (act === 'match') {
      const g = readPerson('g'), b = readPerson('b');
      if (!g || !b) { C.toast(t('milanMissing')); return true; }
      const chart = (p) => LS.Jyotish.chart(A.MakeTime(new Date(p.ms)), new A.Observer(p.lat, p.lon, 0));
      milan.g = g; milan.b = b; milan.draft = null; milan.res = LS.Milan.match(chart(g), chart(b));
      C.S.milan = { g, b }; C.persist();
      $('jyBody').innerHTML = milanHtml();
      const res = $('jyBody').querySelector('.mi-result'); if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    void target;
    return false;
  }
  function milanChange(e) {
    if (e.target.dataset.mi !== 'profile') return;
    const p = (C.S.profiles || []).find((x) => x.pid === e.target.value); if (!p) return;
    const box = e.target.closest('.mi-person');
    box.querySelector('[data-mi="name"]').value = p.name || '';
    box.querySelector('[data-mi="date"]').value = new Date(p.ms + TZ.offsetMin(p.tz, p.ms) * 60000).toISOString().slice(0, 16);
    const sel = box.querySelector('[data-mi="place"]');
    sel.value = C.CITIES.some((c) => c.id === p.id) ? p.id : '';
    if (!sel.value) C.toast(t('milanPlace'));
  }

  // ---------- Share ----------
  function panchangText() {
    const T0 = computeToday(), mu = T0.mu, p = T0.p;
    const lines = [
      `🕉 ${t('panchang')} · ${C.fmt(T0.day0 + 12 * 3600e3, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${nm(C.S.loc)}`,
      `${t('tithi')}: ${C.tithiName(p.tithi)}${p.tithiEnd ? ` (${t('until')} ${C.fmtShort(p.tithiEnd.date.getTime())})` : ''}`,
      `${t('nakshatra')}: ${nm(V.nakshatras[p.nakshatra])}${p.nakshatraEnd ? ` (${t('until')} ${C.fmtShort(p.nakshatraEnd.date.getTime())})` : ''}`,
      `${t('yoga')}: ${nm(V.yogas[p.yoga])} · ${t('karana')}: ${nm(p.karana)}`,
      `${nm(V.varas[mu.vara])} · ${nm(V.months[p.month])} · ${t('vikram')} ${p.vikram}`,
    ];
    if (!mu.polar) {
      lines.push(`☀️ ${tm(mu.sunrise)} – ${tm(mu.sunset)}`);
      lines.push(`${t('mu_rahu')}: ${span(mu.rahu[0], mu.rahu[1])}`);
      lines.push(`${t('mu_abhijit')}: ${span(mu.abhijit[0], mu.abhijit[1])}`);
    }
    for (const e of T0.todays) lines.push(`✦ ${nm(e.name)}`);
    lines.push('', `${t('appName')} · livingsanatan.com`);
    return lines.join('\n');
  }
  async function share(text) {
    try {
      const P = C.isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
      if (P) { await P.share({ text, dialogTitle: t('share') }); return; }
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch (e) { if (e && /cancel|abort/i.test(e.message || e.name || '')) return; }
    try { await navigator.clipboard.writeText(text); C.toast(t('copied')); } catch (e) { C.toast(t('shareFailed')); }
  }

  // ---------- Reminders (local notifications, scheduled on the device) ----------
  const REMINDER_KINDS = ['daily', 'ekadashi', 'purnima', 'festival', 'sankranti', 'pradosh', 'chaturthi', 'eclipse'];
  const KIND_TO_PREF = { ekadashi: 'ekadashi', purnima: 'purnima', amavasya: 'purnima', festival: 'festival', sankranti: 'sankranti', pradosh: 'pradosh', shivaratri: 'pradosh', sankashti: 'chaturthi', vinayaka: 'chaturthi', eclipse: 'eclipse' };
  const prefs = () => (C.S.reminders = { on: false, time: '06:00', daily: true, ekadashi: true, purnima: true, festival: true, sankranti: false, pradosh: false, chaturthi: false, eclipse: true, ...(C.S.reminders || {}) });
  const LN = () => C.isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  function renderReminders() {
    const el = $('remBody'); if (!el) return;
    const p = prefs();
    const native = !!LN();
    el.innerHTML = `
      ${native ? '' : `<p class="note warn">${t('remAppOnly')}</p>`}
      <button class="toggle big${p.on ? ' on' : ''}" data-rem="on"><span><b>${t('remindersOn')}</b><small>${t('remindersSub')}</small></span><i></i></button>
      <div class="rem-time"><span>${t('remTime')}</span><input class="field" type="time" id="remTime" value="${p.time}"></div>
      <div class="toggles one">${REMINDER_KINDS.map((k) => `<button class="toggle${p[k] ? ' on' : ''}" data-rem="${k}"><span>${t('rem_' + k)}</span><i></i></button>`).join('')}</div>
      <p class="note">${t('remNote')}</p>`;
  }
  async function setReminder(k, v) {
    const p = prefs();
    p[k] = v; C.persist();
    if (k === 'on' && v && LN()) {
      try {
        const st = await LN().requestPermissions();
        if (st.display !== 'granted') { p.on = false; C.persist(); C.toast(t('remDenied'), 5000); }
      } catch (e) { p.on = false; C.persist(); }
    }
    renderReminders();
    schedule();
  }
  let scheduleTimer = null;
  function schedule() { clearTimeout(scheduleTimer); scheduleTimer = setTimeout(doSchedule, 400); }
  async function doSchedule() {
    const P = LN(); if (!P) return;
    const p = prefs();
    try {
      const pend = await P.getPending();
      if (pend.notifications && pend.notifications.length) await P.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
      if (!p.on) return;
      const o = obs(), z = tz();
      const start = dayStart(Date.now());
      const days = 40;
      const res = LS.Calendar.range(o, z, start, days);
      const [hh, mm] = (p.time || '06:00').split(':').map(Number);
      const list = [];
      res.days.forEach((d, i) => {
        const at = TZ.fromCivil(d.y, d.m, d.d, z, hh, mm);
        if (at < Date.now() + 60000) return;
        const evs = d.events.filter((e) => p[KIND_TO_PREF[e.kind]] && e.kind !== 'eclipse');
        if (!p.daily && !evs.length) return;
        let body = `${C.tithiName(d.tithi)} · ${nm(V.nakshatras[d.nak])}`;
        if (p.daily) {
          try { const mu = LS.Muhurta.day(o, d.ms, { dayEnd: TZ.addDays(d.ms, 1, z), weekday: d.wd }); if (!mu.polar) body += ` · ☀️ ${tm(mu.sunrise)} · ${t('mu_rahu')} ${span(mu.rahu[0], mu.rahu[1])}`; } catch (e) { /* ignore */ }
        }
        const title = evs.length ? evs.map((e) => nm(e.name)).join(' · ') : `${nm(V.varas[d.wd])} · ${t('panchang')}`;
        list.push({ id: 1000 + i, title, body, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { day: d.key } });
      });
      if (p.eclipse) res.events.filter((e) => e.kind === 'eclipse' && e.visible && e.start - 3600e3 > Date.now()).forEach((e, k) => {
        list.push({ id: 2000 + k, title: nm(e.name), body: `${span(e.start, e.end)} · ${t('peak')} ${tm(e.at)}`, schedule: { at: new Date(e.start - 3600e3), allowWhileIdle: true }, extra: { day: e.key } });
      });
      // iOS keeps at most 64 pending notifications.
      if (list.length) await P.schedule({ notifications: list.slice(0, 60) });
    } catch (e) { console.warn('reminders', e); }
  }

  // ---------- wiring ----------
  function init(ctx) {
    C = ctx;
    const m = C.S.milan;
    if (m && m.g && m.b) { milan.g = m.g; milan.b = m.b; }
    document.addEventListener('click', (e) => {
      const tgt = e.target;
      const cd = tgt.closest('[data-day]');
      if (cd && $('calBody') && $('calBody').contains(cd)) { calSelect(cd.dataset.day); return; }
      const od = tgt.closest('[data-open-day]'); if (od) { openDay(od.dataset.openDay); return; }
      const cl = tgt.closest('[data-cal]'); if (cl) { C.setMode('calendar'); calSelect(cl.dataset.cal); return; }
      const fl = tgt.closest('[data-filter]'); if (fl) { cal.filter = fl.dataset.filter; renderCalendar(); return; }
      const gt = tgt.closest('[data-goto]'); if (gt) { C.setMode(gt.dataset.goto); return; }
      const fd = tgt.closest('[data-find]'); if (fd) { find(fd.dataset.find); return; }
      const mt = tgt.closest('[data-meteors]'); if (mt) { $('tonight').hidden = true; C.setMode('sky'); C.setMeteors(true); return; }
      const ch = tgt.closest('[data-chogh]'); if (ch) { choghNight = ch.dataset.chogh === 'night'; renderToday(); return; }
      const rm = tgt.closest('[data-rem]'); if (rm) { setReminder(rm.dataset.rem, !prefs()[rm.dataset.rem]); }
    });
    document.addEventListener('change', (e) => {
      if (e.target.id === 'remTime') { prefs().time = e.target.value || '06:00'; C.persist(); schedule(); }
      if (e.target.dataset && e.target.dataset.mi) milanChange(e);
    });
    $('btnTodayPrev').addEventListener('click', () => shiftDay(-1));
    $('btnTodayNext').addEventListener('click', () => shiftDay(1));
    $('btnTodayNow').addEventListener('click', () => { C.clock.sim = Date.now(); C.clock.rate = 1; C.afterTimeJump(); renderToday(); });
    $('btnShare').addEventListener('click', () => share(panchangText()));
    $('btnCalPrev').addEventListener('click', () => { cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } cal.sel = `${cal.y}-${String(cal.m + 1).padStart(2, '0')}-01`; renderCalendar(); });
    $('btnCalNext').addEventListener('click', () => { cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } cal.sel = `${cal.y}-${String(cal.m + 1).padStart(2, '0')}-01`; renderCalendar(); });
    $('btnCalToday').addEventListener('click', () => { cal.y = null; C.clock.sim = Date.now(); C.clock.rate = 1; C.afterTimeJump(); renderCalendar(); });
    $('btnReminders').addEventListener('click', () => { renderReminders(); $('reminders').hidden = false; });
    $('remClose').addEventListener('click', () => { $('reminders').hidden = true; });
    $('reminders').addEventListener('click', (e) => { if (e.target.id === 'reminders') $('reminders').hidden = true; });
    // Keep the "now" status fresh.
    setInterval(() => { if (C.S.mode === 'today' && !document.hidden) renderToday(); renderTonightPanel(); }, 30000);
    if (prefs().on) schedule();
    // Tapping a notification opens that day.
    const P = LN();
    if (P && P.addListener) P.addListener('localNotificationActionPerformed', (a) => { const d = a && a.notification && a.notification.extra && a.notification.extra.day; if (d) openDay(d); });
  }
  function shiftDay(n) {
    C.clock.sim = TZ.addDays(C.clock.sim, n, tz()); C.clock.rate = 0;
    if (dayStart(C.clock.sim) === dayStart(Date.now())) { C.clock.sim = Date.now(); C.clock.rate = 1; }
    C.afterTimeJump(); renderToday();
  }
  // Called by app.js when the place or language changes.
  function onLocation() { today = null; tonightCache = null; if (prefs().on) schedule(); }
  // Language change: reschedule reminders in the new language and keep the Milan form's input.
  function onLanguage() { captureMilan(); if (prefs().on) schedule(); }

  return {
    init, renderToday, renderCalendar, renderTonightPanel, updateFinder, milanHtml, milanAction, onLocation, onLanguage,
    resetCalendar() { cal.y = null; },
    get milanReady() { return !!milan.res; },
  };
})();
