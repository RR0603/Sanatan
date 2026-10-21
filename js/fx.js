// Visual effects layer above the sky: Ratri star-dust, shooting stars and touch ripples, plus Ulka meteors
// streaking from the radiant of an active meteor shower. Runs its own light animation loop only while needed.
window.LS = window.LS || {};

LS.FX = (function () {
  const D2R = Math.PI / 180;
  let cv = null, g = null, W = 0, H = 0, dpr = 1, running = false, last = 0;
  let getState = null; // () => { ratri, meteors, mode, basis, fov, fr, sunAlt, simMs, reduced }
  const dust = [], streaks = [], ripples = [];
  let nextShoot = 0, nextMeteor = 0, labels = [];

  function init(canvas, stateFn) {
    cv = canvas; g = cv.getContext('2d'); getState = stateFn;
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', (e) => {
      const st = getState();
      if (!st.ratri || st.reduced) return;
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      wake();
    }, { passive: true, capture: true });
    document.addEventListener('visibilitychange', wake);
    for (let i = 0; i < 46; i++) dust.push(newDust(true));
  }
  function resize() {
    if (!cv) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function newDust(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: 0.6 + Math.random() * 1.6,
      vy: -(3 + Math.random() * 9), vx: (Math.random() - 0.5) * 4, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.4,
      hue: Math.random() < 0.7 ? 'gold' : 'moon' };
  }
  const want = (st) => !document.hidden && !st.reduced && (st.ratri || (st.meteors && st.mode === 'sky') || ripples.length);
  function wake() {
    if (!cv || running) return;
    const st = getState();
    if (!want(st)) { g.clearRect(0, 0, W, H); return; }
    running = true; last = performance.now();
    requestAnimationFrame(loop);
  }

  // ENU vector -> screen point with the app's stereographic projection (null when behind the viewer).
  function project(e, st) {
    const { r, u, f } = st.basis;
    const x = e[0] * r[0] + e[1] * r[1] + e[2] * r[2], y = e[0] * u[0] + e[1] * u[1] + e[2] * u[2], z = e[0] * f[0] + e[1] * f[1] + e[2] * f[2];
    if (z < -0.6) return null;
    const scale = (H / 2) / (2 * Math.tan(st.fov * D2R / 4)), k = 2 / (1 + z);
    return { x: W / 2 + scale * k * x, y: H / 2 - scale * k * y, scale };
  }
  const rotEnu = (v, ax, ang) => { // Rodrigues rotation of v about unit axis ax
    const c = Math.cos(ang), s = Math.sin(ang), d = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2];
    const cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
    return [0, 1, 2].map((i) => v[i] * c + cr[i] * s + ax[i] * d * (1 - c));
  };

  function loop(now) {
    const st = getState();
    if (!want(st)) { running = false; g.clearRect(0, 0, W, H); return; }
    requestAnimationFrame(loop);
    if (now - last < 30) return; // ~30 fps is plenty for ambient effects
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    if (st.ratri) drawRatri(now, dt, st);
    if (st.meteors && st.mode === 'sky' && st.basis && st.fr) drawMeteors(now, st);
    drawStreaks(now);
    drawRipples(now);
    g.globalCompositeOperation = 'source-over';
    drawLabels(st);
  }

  function drawRatri(now, dt, st) {
    // Star-dust drifting slowly upward, twinkling.
    for (const p of dust) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < -10 || p.x < -10 || p.x > W + 10) Object.assign(p, newDust(false));
      const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(now / 1000 * p.sp + p.ph));
      const col = p.hue === 'gold' ? `rgba(255,214,150,${a * 0.55})` : `rgba(200,215,255,${a * 0.5})`;
      const grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, 6.283); g.fill();
    }
    // An occasional shooting star across the upper sky (only in the sky view).
    if (st.mode === 'sky' && now > nextShoot) {
      nextShoot = now + 7000 + Math.random() * 9000;
      const x = W * (0.15 + Math.random() * 0.7), y = H * (0.08 + Math.random() * 0.3), ang = (20 + Math.random() * 40) * D2R * (Math.random() < 0.5 ? 1 : -1) + Math.PI / 2;
      streaks.push({ x, y, dx: Math.cos(ang), dy: Math.sin(ang) * 0.6 + 0.4, len: 120 + Math.random() * 120, t: now, dur: 900, gold: true });
    }
  }

  function drawMeteors(now, st) {
    labels = [];
    const showers = LS.Ulka.active(st.simMs);
    if (!showers.length) return;
    const dark = st.sunAlt < -10 ? 1 : st.sunAlt < -4 ? 0.35 : 0.12;
    for (const s of showers.slice(0, 2)) {
      const v = LS.Ulka.radiantVec(s);
      const e = LS.Sky.apply(st.fr.eqj2enu, v[0], v[1], v[2]);
      const p = project(e, st);
      if (p && p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40) labels.push({ x: p.x, y: p.y, s, up: e[2] > 0 });
      if (e[2] < -0.05) continue; // radiant below the horizon: no meteors
      // Visual rate follows the shower's strength (not a literal count), so strong showers feel alive.
      const perMin = Math.max(0.6, s.zhr * s.factor * dark * 0.25);
      if (now > nextMeteor) {
        nextMeteor = now + (60000 / perMin) * (0.4 + Math.random() * 1.2);
        // Start 8–35° from the radiant in a random direction, travel away from it.
        const ax0 = Math.abs(e[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        let perp = [e[1] * ax0[2] - e[2] * ax0[1], e[2] * ax0[0] - e[0] * ax0[2], e[0] * ax0[1] - e[1] * ax0[0]];
        const pl = Math.hypot(...perp); perp = perp.map((c) => c / pl);
        perp = rotEnu(perp, e, Math.random() * 6.283);
        const d0 = (8 + Math.random() * 27) * D2R, d1 = d0 + (6 + Math.random() * 14) * D2R;
        const a = rotEnu(e, perp, d0), b = rotEnu(e, perp, d1);
        const pa = project(a, st), pb = project(b, st);
        if (pa && pb && a[2] > 0.02) {
          const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1;
          streaks.push({ x: pa.x, y: pa.y, dx: dx / L, dy: dy / L, len: L, t: now, dur: 450 + Math.random() * 500, gold: false, bright: s.zhr > 60 });
        }
      }
    }
  }

  function drawStreaks(now) {
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i], k = (now - s.t) / s.dur;
      if (k >= 1) { streaks.splice(i, 1); continue; }
      const head = s.len * Math.min(1, k * 1.25), tail = Math.max(0, head - s.len * 0.55);
      const hx = s.x + s.dx * head, hy = s.y + s.dy * head, tx = s.x + s.dx * tail, ty = s.y + s.dy * tail;
      const fade = k < 0.75 ? 1 : (1 - k) / 0.25;
      const grd = g.createLinearGradient(tx, ty, hx, hy);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(1, s.gold ? `rgba(255,226,170,${0.9 * fade})` : `rgba(220,240,255,${(s.bright ? 0.95 : 0.75) * fade})`);
      g.strokeStyle = grd; g.lineWidth = s.gold ? 1.8 : 1.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = `rgba(255,255,255,${0.9 * fade})`; g.beginPath(); g.arc(hx, hy, s.gold ? 1.6 : 1.3, 0, 6.283); g.fill();
    }
  }

  function drawRipples(now) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i], k = (now - r.t) / 700;
      if (k >= 1) { ripples.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - k, 3);
      g.strokeStyle = `rgba(255,214,150,${0.55 * (1 - k)})`; g.lineWidth = 1.5;
      g.beginPath(); g.arc(r.x, r.y, 8 + e * 46, 0, 6.283); g.stroke();
      g.strokeStyle = `rgba(200,215,255,${0.3 * (1 - k)})`;
      g.beginPath(); g.arc(r.x, r.y, 4 + e * 26, 0, 6.283); g.stroke();
    }
  }

  // Radiant markers: a dashed ring and the shower's name.
  function drawLabels(st) {
    if (!st.meteors || st.mode !== 'sky') return;
    const hi = LS.I18N.lang === 'hi';
    for (const l of labels) {
      g.save();
      g.globalAlpha = l.up ? 0.95 : 0.4;
      g.strokeStyle = 'rgba(255,214,150,.85)'; g.lineWidth = 1.2; g.setLineDash([3, 4]);
      g.beginPath(); g.arc(l.x, l.y, 16, 0, 6.283); g.stroke(); g.setLineDash([]);
      g.font = `600 12px ${hi ? "'Noto Sans Devanagari'," : ''}'Space Grotesk', sans-serif`;
      g.fillStyle = '#ffe2b0'; g.textAlign = 'center';
      g.shadowColor = '#000'; g.shadowBlur = 4;
      g.fillText(`☄ ${hi ? l.s.name.hi : l.s.name.en}`, l.x, l.y - 24);
      g.restore();
    }
  }

  return { init, wake, resize };
})();
