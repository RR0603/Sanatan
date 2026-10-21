// Yatra: a cinematic journey through tonight. Time flows from sunset to sunrise in about 45 seconds while the
// view sweeps from east to west; captions mark moonrise, planets rising and setting, darkness and dawn.
window.LS = window.LS || {};

LS.Yatra = (function () {
  const A = window.Astronomy, V = LS.VEDIC, I = LS.I18N;
  const t = (k) => I.t(k);
  const $ = (id) => document.getElementById(id);
  const DURATION = 45000; // real milliseconds for the whole night
  let C = null, run = null;

  const ms = (x) => (x ? x.date.getTime() : null);
  function events(o, start, end) {
    const out = [];
    const T0 = A.MakeTime(new Date(start)), days = (end - start) / 86400000;
    const add = (at, text, glyph, color) => { if (at && at > start && at < end) out.push({ at, text, glyph, color }); };
    const sunset = ms(A.SearchRiseSet(A.Body.Sun, o, -1, A.MakeTime(new Date(start - 3600e3)), 1));
    add(sunset, t('ev_sunset'), '☉', '#ffb067');
    const dark = ms(A.SearchAltitude(A.Body.Sun, o, -1, T0, days, -18));
    add(dark, t('ev_dark'), '✦', '#c9d6ff');
    for (const id of ['chandra', 'shukra', 'guru', 'mangala', 'shani']) {
      const g = V.grahas[id], body = A.Body[g.body];
      try {
        add(ms(A.SearchRiseSet(body, o, +1, T0, days)), t('ev_rise').replace('{x}', C.Nm.graha(id)), g.glyph, g.color);
        add(ms(A.SearchRiseSet(body, o, -1, T0, days)), t('ev_set').replace('{x}', C.Nm.graha(id)), g.glyph, g.color);
      } catch (e) { /* ignore */ }
    }
    const sunrise = ms(A.SearchRiseSet(A.Body.Sun, o, +1, T0, days + 0.1));
    if (sunrise) {
      add(sunrise - 96 * 60000, t('ev_brahma'), 'ॐ', '#ffd27a');
      add(sunrise, t('ev_sunrise'), '☀︎', '#ffd27a');
    }
    return out.sort((a, b) => a.at - b.at);
  }

  function start() {
    if (run) return;
    const o = C.observer(), now = Date.now();
    const sunAlt = (() => { const tm = A.MakeTime(new Date(now)); const eq = A.Equator(A.Body.Sun, tm, o, true, true); return A.Horizon(tm, o, eq.ra, eq.dec, 'normal').altitude; })();
    // Tonight's sunset: the coming one by day, the one that began this night after dark.
    const ss = sunAlt > -0.8
      ? A.SearchRiseSet(A.Body.Sun, o, -1, A.MakeTime(new Date(now)), 1)
      : A.SearchRiseSet(A.Body.Sun, o, -1, A.MakeTime(new Date(now)), -1);
    if (!ss) { C.toast(t('yatraPolar'), 4000); return; }
    const from = ms(ss) - 15 * 60000;
    const sr = A.SearchRiseSet(A.Body.Sun, o, +1, A.MakeTime(new Date(from + 30 * 60000)), 1.2);
    if (!sr) { C.toast(t('yatraPolar'), 4000); return; }
    const to = ms(sr) + 20 * 60000;
    C.setMode('sky');
    C.prepare(); // closes panels, stops the sensor and camera
    const v = C.view;
    run = { from, to, ev: events(o, from, to), next: 0, saved: { az: v.az, alt: v.alt, fov: v.fov, sim: C.clock.sim, rate: C.clock.rate }, t0: performance.now() };
    // Time is driven from wall-clock progress (not frame count), so the journey takes 45 s on any device.
    C.clock.sim = from; C.clock.rate = 0;
    C.afterTimeJump();
    document.body.classList.add('yatra');
    $('yatra').hidden = false;
    $('yEvent').textContent = ''; $('yEvent').classList.remove('show');
    requestAnimationFrame(tick);
  }

  const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  function tick() {
    if (!run) return;
    const r = run;
    const p = Math.max(0, Math.min(1, (performance.now() - r.t0) / DURATION));
    const sim = r.from + p * (r.to - r.from);
    C.clock.sim = sim;
    // Look east at dusk, sweep through the meridian, end facing the eastern dawn glow.
    const south = C.S.loc.lat >= 0 ? 180 : 0;
    const v = C.view;
    v.anim = null; v.vaz = 0; v.valt = 0;
    v.az = (south - 90 + 180 * ease(Math.min(1, p / 0.85)) - (p > 0.85 ? 180 * ease((p - 0.85) / 0.15) : 0) + 360) % 360;
    v.alt = 22 + 16 * Math.sin(Math.PI * p);
    v.fov = 108;
    C.invalidate();
    $('yTime').textContent = C.fmtTime(sim);
    $('yDate').textContent = `${C.fmt(sim, { weekday: 'short', day: 'numeric', month: 'short' })} · ${C.tithiLine()}`;
    $('yBar').style.width = `${(p * 100).toFixed(1)}%`;
    while (r.next < r.ev.length && r.ev[r.next].at <= sim) {
      const e = r.ev[r.next++];
      const el = $('yEvent');
      el.innerHTML = `<i style="color:${e.color}">${e.glyph}</i>${e.text}`;
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      if (LS.Nada.on) LS.Nada.chime('tap');
    }
    if (p >= 1) { finish(); return; }
    requestAnimationFrame(tick);
  }
  function finish() {
    if (!run) return;
    $('yEvent').innerHTML = `<i style="color:#ffd27a">✦</i>${t('yatraDone')}`;
    $('yEvent').classList.remove('show'); void $('yEvent').offsetWidth; $('yEvent').classList.add('show');
    C.clock.rate = 0;
    setTimeout(stop, 2600);
  }
  function stop() {
    if (!run) return;
    const s = run.saved; run = null;
    document.body.classList.remove('yatra');
    $('yatra').hidden = true;
    C.clock.sim = Date.now(); C.clock.rate = 1;
    C.afterTimeJump();
    const v = C.view;
    v.anim = { t0: performance.now(), dur: 1000, az0: v.az, daz: (((s.az - v.az) + 540) % 360) - 180, alt0: v.alt, alt1: s.alt, fov0: v.fov, fov1: s.fov };
  }

  function init(ctx) {
    C = ctx;
    $('yStop').addEventListener('click', stop);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && run) stop(); });
  }
  return { init, start, stop, get running() { return !!run; } };
})();
