// Jyotish visuals: the Bhachakra wheel (canvas) and North / South Indian kundalis (SVG).
window.LS = window.LS || {};

LS.ChartView = (function () {
  const V = LS.VEDIC, Names = LS.Names, I = LS.I18N, J = LS.Jyotish;
  const D2R = Math.PI / 180;
  const NAK = 360 / 27;
  const TAU = Math.PI * 2;
  const SIDEREAL_DAY_MS = 86164.0905e3;
  const font = (px, w = 600) => `${w} ${px}px ${I.lang === 'hi' ? "'Noto Sans Devanagari', " : ''}'Space Grotesk', system-ui, sans-serif`;
  const color = (id) => (V.grahas[id] ? V.grahas[id].color : '#ffd27a');
  const dms = (deg) => { const d = Math.floor(deg), m = Math.floor((deg - d) * 60); return `${I.num(d)}°${I.num(String(m).padStart(2, '0'))}′`; };

  // ---------- Bhachakra wheel ----------
  function createWheel(canvas, hooks) {
    const ctx = canvas.getContext('2d');
    let S = 0, dpr = 1, chart = null, selected = null, hits = [];
    const geo = {};

    function resize() {
      const rect = canvas.getBoundingClientRect();
      S = Math.max(200, Math.min(rect.width, rect.height || rect.width));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(S * dpr); canvas.height = Math.round(S * dpr);
      draw();
    }

    function setChart(c) { chart = c; draw(); }
    function setSelected(id) { selected = id; draw(); }

    function draw(now = performance.now()) {
      if (!chart || !S) return;
      const c = chart, cx = S / 2, cy = S / 2, R = S / 2 - 4;
      const rOut = R, rNak = R * 0.855, rRashi = R * 0.69, rCore = R * 0.25;
      Object.assign(geo, { cx, cy, rOut, rNak, rRashi, rCore });
      const ang = (lon) => Math.PI + (lon - c.lagna) * D2R;
      const pt = (r, lon) => { const a = ang(lon); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      hits = [];

      // Hemispheres: the upper half of the wheel is the sky above the horizon.
      const day = c.sunAlt > -6;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, rOut, Math.PI, TAU); ctx.closePath();
      const up = ctx.createLinearGradient(0, cy - rOut, 0, cy);
      up.addColorStop(0, day ? 'rgba(90,160,255,0.16)' : 'rgba(80,90,200,0.10)');
      up.addColorStop(1, day ? 'rgba(255,190,110,0.10)' : 'rgba(150,110,255,0.05)');
      ctx.fillStyle = up; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, rOut, 0, Math.PI); ctx.closePath();
      const dn = ctx.createLinearGradient(0, cy, 0, cy + rOut);
      dn.addColorStop(0, 'rgba(255,150,70,0.07)'); dn.addColorStop(1, 'rgba(10,8,20,0.25)');
      ctx.fillStyle = dn; ctx.fill();
      ctx.restore();

      // Slowly turning halo
      const spin = (now / 60000) * TAU;
      ctx.lineWidth = 2;
      for (let k = 0; k < 36; k++) {
        const a0 = spin + k * TAU / 36;
        ctx.strokeStyle = `rgba(255,${170 + (k % 3) * 20},80,${0.10 + 0.25 * Math.abs(Math.sin(k * 0.7 + spin * 2))})`;
        ctx.beginPath(); ctx.arc(cx, cy, rOut - 1, a0, a0 + TAU / 36 * 0.6); ctx.stroke();
      }

      // Nakshatra ring
      const moonNak = c.byId.chandra.nak;
      for (let k = 0; k < 27; k++) {
        const l0 = k * NAK, a0 = ang(l0), a1 = ang(l0 + NAK);
        ctx.beginPath(); ctx.arc(cx, cy, rOut, -a0, -a1, true); ctx.arc(cx, cy, rNak, -a1, -a0, false); ctx.closePath();
        ctx.fillStyle = k === moonNak ? 'rgba(255,179,71,0.24)' : (k % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.065)');
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,130,0.22)'; ctx.lineWidth = 1;
        const [x0, y0] = pt(rNak, l0), [x1, y1] = pt(rOut, l0);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        arcText(Names.nakshatra(k), (rNak + rOut) / 2, ang(l0 + NAK / 2), Math.max(8, Math.min(12, R * 0.034)), k === moonNak ? '#ffd8a0' : 'rgba(255,214,160,0.78)', 500, (rNak + rOut) / 2 * NAK * D2R * 0.92);
      }
      // 108 pada ticks
      ctx.strokeStyle = 'rgba(255,214,160,0.35)';
      for (let k = 0; k < 108; k++) {
        const [x0, y0] = pt(rOut - (k % 4 ? 3 : 6), k * NAK / 4), [x1, y1] = pt(rOut, k * NAK / 4);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }

      // Rashi ring (whole-sign bhavas)
      for (let k = 0; k < 12; k++) {
        const l0 = k * 30, a0 = ang(l0), a1 = ang(l0 + 30);
        const house = ((k - c.lagnaRashi + 12) % 12) + 1;
        ctx.beginPath(); ctx.arc(cx, cy, rNak, -a0, -a1, true); ctx.arc(cx, cy, rRashi, -a1, -a0, false); ctx.closePath();
        ctx.fillStyle = house === 1 ? 'rgba(126,232,250,0.20)' : 'rgba(10,16,34,0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(126,232,250,0.45)'; ctx.lineWidth = 1.2;
        const [x0, y0] = pt(rCore, l0), [x1, y1] = pt(rNak, l0);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const w = rNak - rRashi;
        arcText(Names.rashi(k), rRashi + w * 0.64, ang(l0 + 15), Math.max(10, Math.min(15, R * 0.045)), house === 1 ? '#e6fbff' : 'rgba(170,236,255,0.92)', 700, (rRashi + w * 0.64) * 30 * D2R * 0.9);
        arcText(`${I.num(house)} · ${Names.abbr(V.rashis[k].lord)}`, rRashi + w * 0.27, ang(l0 + 15), Math.max(8, Math.min(11, R * 0.03)), 'rgba(170,236,255,0.6)', 500);
      }
      ctx.strokeStyle = 'rgba(126,232,250,0.5)'; ctx.lineWidth = 1;
      for (const r of [rRashi, rNak]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); }

      // Inner guide circles
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (const f of [0.38, 0.5, 0.6]) { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, TAU); ctx.stroke(); }

      // Horizon axis (Lagna — Saptama) and Madhya (MC)
      const hz = ctx.createLinearGradient(cx - rRashi, 0, cx + rRashi, 0);
      hz.addColorStop(0, 'rgba(255,179,71,0.95)'); hz.addColorStop(0.5, 'rgba(255,179,71,0.15)'); hz.addColorStop(1, 'rgba(255,179,71,0.6)');
      ctx.strokeStyle = hz; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(cx - rRashi, cy); ctx.lineTo(cx + rRashi, cy); ctx.stroke();
      const [mx, my] = pt(rRashi, c.mc), [mx0, my0] = pt(rCore, c.mc);
      ctx.strokeStyle = 'rgba(126,232,250,0.55)'; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(mx0, my0); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
      const [lx, ly] = pt(rRashi - 14, c.mc);
      label(I.lang === 'hi' ? 'मध्य' : 'MC', lx, ly, 10, 'rgba(170,236,255,0.85)');

      // Lagna marker
      ctx.save();
      ctx.shadowColor = 'rgba(255,170,60,0.9)'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.moveTo(cx - rOut + 1, cy); ctx.lineTo(cx - rOut + 13, cy - 7); ctx.lineTo(cx - rOut + 13, cy + 7); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Drishti of the selected graha
      const sel = selected && c.byId[selected];
      if (sel) {
        const targets = J.aspects(sel.id, sel.house);
        const [gx, gy] = pt(R * 0.5, sel.lon);
        for (const h of targets) {
          const rashi = (c.lagnaRashi + h - 1) % 12;
          const a0 = ang(rashi * 30), a1 = ang(rashi * 30 + 30);
          ctx.beginPath(); ctx.arc(cx, cy, rNak, -a0, -a1, true); ctx.arc(cx, cy, rRashi, -a1, -a0, false); ctx.closePath();
          ctx.fillStyle = hexA(color(sel.id), 0.22); ctx.fill();
          const [tx, ty] = pt(rRashi - 4, rashi * 30 + 15);
          ctx.strokeStyle = hexA(color(sel.id), 0.75); ctx.lineWidth = 1.6;
          ctx.shadowColor = color(sel.id); ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(cx + (gx + tx - 2 * cx) * 0.15, cy + (gy + ty - 2 * cy) * 0.15, tx, ty); ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(tx, ty, 3, 0, TAU); ctx.fillStyle = color(sel.id); ctx.fill();
        }
      }

      // Grahas, stacked inward when they crowd together
      const order = [...c.grahas].sort((a, b) => a.lon - b.lon);
      const placed = [], boxes = [];
      const gr = Math.max(9, R * 0.05);
      const discs = [];
      const small = R < 240;
      const step = gr * 2.5; // labels sit beside the disc, so lanes only need room for the disc
      const sep = Math.max(gr * 2.6, R * 0.2) / (R * 0.585) / D2R; // degrees two grahas need side by side
      // First pass: positions, so every disc is known before any label is placed.
      for (const g of order) {
        let lane = 0;
        while (lane < 3 && placed.some((p) => p.lane === lane && Math.abs(((p.lon - g.lon + 540) % 360) - 180) < sep)) lane++;
        placed.push({ lon: g.lon, lane });
        const [x, y] = pt(Math.max(rCore + gr * 1.6, R * 0.585 - lane * step), g.lon);
        discs.push({ g, x, y });
        boxes.push([x - gr, y - gr, gr * 2, gr * 2]);
      }
      for (const { g, x, y } of discs) {
        const [tx0, ty0] = pt(rRashi, g.lon), [tx1, ty1] = pt(rRashi - 6, g.lon);
        ctx.strokeStyle = color(g.id); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
        ctx.strokeStyle = hexA(color(g.id), 0.25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(x, y); ctx.stroke();
        const isSel = selected === g.id;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, gr * (isSel ? 2.6 : 1.9));
        glow.addColorStop(0, hexA(color(g.id), 0.55)); glow.addColorStop(1, hexA(color(g.id), 0));
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, gr * (isSel ? 2.6 : 1.9), 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(8,12,26,0.85)'; ctx.beginPath(); ctx.arc(x, y, gr, 0, TAU); ctx.fill();
        ctx.strokeStyle = color(g.id); ctx.lineWidth = isSel ? 2.2 : 1.4; ctx.stroke();
        if (g.combust) { ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(255,200,90,0.8)'; ctx.beginPath(); ctx.arc(x, y, gr + 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = color(g.id); ctx.font = font(gr * 1.05, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(V.grahas[g.id].glyph, x, y + 1);
        const deg = small ? `${I.num(Math.floor(g.deg))}°` : dms(g.deg);
        const tag = `${Names.abbr(g.id)} ${deg}${g.retro && g.id !== 'rahu' && g.id !== 'ketu' ? (I.lang === 'hi' ? ' व' : ' ℞') : ''}`;
        const mark = g.dignity === 'exalted' ? ' ▲' : g.dignity === 'debilitated' ? ' ▼' : '';
        const fs = Math.max(9, R * 0.028);
        ctx.font = font(fs, 600);
        const tw = ctx.measureText(tag + mark).width, th = fs + 2;
        // Try beside (outer side first), the other side, then below / above; keep the first spot that is free.
        const pref = x >= cx ? 1 : -1;
        const spots = [[pref, 0], [-pref, 0], [0, 1], [0, -1]].map(([sx, sy]) => {
          const lx = sx ? x + sx * (gr + 4) : x - tw / 2;
          const bx = sx > 0 ? lx : sx < 0 ? lx - tw : lx;
          const ly = sy ? y + sy * (gr + th / 2 + 2) : y;
          return { sx, lx, ly, box: [bx, ly - th / 2, tw, th] };
        });
        const free = (b) => !boxes.some((o) => b[0] < o[0] + o[2] && b[0] + b[2] > o[0] && b[1] < o[1] + o[3] && b[1] + b[3] > o[1]);
        const spot = spots.find((sp) => free(sp.box)) || spots[0];
        boxes.push(spot.box);
        const fill = g.dignity === 'exalted' ? '#8dffb6' : g.dignity === 'debilitated' ? '#ff9a8a' : 'rgba(235,240,255,0.92)';
        if (spot.sx) sideLabel(tag + mark, spot.lx, spot.ly, fs, fill, spot.sx);
        else label(tag + mark, x, spot.ly, fs, fill, 600);
        hits.push({ x, y, r: gr + 8, obj: { type: 'graha', id: g.id } });
      }

      // Core: Lagna
      const core = ctx.createRadialGradient(cx, cy - rCore * 0.3, 0, cx, cy, rCore);
      core.addColorStop(0, 'rgba(40,52,100,0.85)'); core.addColorStop(1, 'rgba(8,12,28,0.92)');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, rCore, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,179,71,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,179,71,0.08)'; ctx.font = `${rCore * 1.25}px 'Noto Sans Devanagari', serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ॐ', cx, cy + rCore * 0.08);
      label(hooks.t('lagna').toUpperCase(), cx, cy - rCore * 0.42, Math.max(8, R * 0.026), '#ffb347', 700);
      label(Names.rashi(c.lagnaRashi), cx, cy - rCore * 0.08, Math.max(12, R * 0.055), '#ffffff', 700);
      label(dms(c.lagna % 30), cx, cy + rCore * 0.24, Math.max(10, R * 0.034), 'rgba(235,240,255,0.85)', 500);
      label(`${Names.nakshatra(c.lagnaNak)} ${I.num(c.lagnaPada)}`, cx, cy + rCore * 0.5, Math.max(8, R * 0.026), 'rgba(255,214,160,0.85)', 500);
    }

    function arcText(text, r, a, size, fill, weight, maxW) {
      const { cx, cy } = geo;
      if (maxW) {
        ctx.font = font(size, weight);
        const w = ctx.measureText(text).width;
        if (w > maxW) size = Math.max(6.5, size * maxW / w);
      }
      const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
      let rot = -a + Math.PI / 2;
      const an = ((a % TAU) + TAU) % TAU;
      if (an > Math.PI && an < TAU) rot += Math.PI;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.font = font(size, weight); ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0); ctx.restore();
    }
    function sideLabel(text, x, y, size, fill, side) {
      ctx.font = font(size, 600); ctx.fillStyle = fill; ctx.textAlign = side > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4; ctx.fillText(text, x, y); ctx.shadowBlur = 0;
    }
    function label(text, x, y, size, fill, weight = 600) {
      ctx.font = font(size, weight); ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 4; ctx.fillText(text, x, y); ctx.shadowBlur = 0;
    }

    // Hit test: grahas first, then the nakshatra and rashi rings.
    function hitTest(x, y) {
      for (const h of hits) if (Math.hypot(h.x - x, h.y - y) < h.r) return h.obj;
      if (!chart) return null;
      const { cx, cy, rOut, rNak, rRashi } = geo;
      const d = Math.hypot(x - cx, y - cy);
      const lon = Sky360(chart.lagna + (Math.atan2(-(y - cy), x - cx) - Math.PI) / D2R);
      if (d > rNak && d <= rOut) return { type: 'nakshatra', id: Math.floor(lon / NAK) };
      if (d > rRashi && d <= rNak) return { type: 'rashi', id: Math.floor(lon / 30) };
      return null;
    }
    const Sky360 = (x) => ((x % 360) + 360) % 360;

    // Drag the wheel to move through time: one full turn = one sidereal day.
    const drag = { id: null, a: 0, moved: 0, sx: 0, sy: 0 };
    const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', (e) => {
      const [x, y] = local(e);
      canvas.setPointerCapture(e.pointerId);
      drag.id = e.pointerId; drag.a = Math.atan2(-(y - geo.cy), x - geo.cx); drag.moved = 0; drag.sx = x; drag.sy = y;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (drag.id !== e.pointerId) return;
      const [x, y] = local(e);
      if (Math.hypot(x - drag.sx, y - drag.sy) > 6) drag.moved = 1;
      if (!drag.moved || Math.hypot(x - geo.cx, y - geo.cy) < geo.rCore * 0.5) return;
      const a = Math.atan2(-(y - geo.cy), x - geo.cx);
      let da = a - drag.a; da = ((da + Math.PI * 3) % TAU) - Math.PI;
      drag.a = a;
      hooks.onTimeDelta(-da / TAU * SIDEREAL_DAY_MS);
    });
    const end = (e) => {
      if (drag.id !== e.pointerId) return;
      drag.id = null;
      if (!drag.moved && e.type === 'pointerup') { const [x, y] = local(e); hooks.onSelect(hitTest(x, y)); }
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); hooks.onTimeDelta(Math.sign(e.deltaY) * (e.shiftKey ? 86400e3 : 3600e3)); }, { passive: false });

    return { resize, setChart, setSelected, draw, hitTest };
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---------- Kundali (SVG) ----------
  // items: [{id, rashi, retro, deg}], lagnaRashi; style 'north' | 'south'
  function kundaliSVG(lagnaRashi, items, style, opts = {}) {
    const sel = opts.selected;
    const tag = (it) => {
      const r = it.retro && it.id !== 'rahu' && it.id !== 'ketu' ? `<tspan font-size="0.7em" dy="-0.35em">${I.lang === 'hi' ? 'व' : 'R'}</tspan>` : '';
      const deg = opts.showDeg && it.deg != null ? `<tspan font-size="0.72em" fill-opacity=".7"> ${I.num(Math.floor(it.deg))}°</tspan>` : '';
      return `<tspan fill="${color(it.id)}" font-weight="${sel === it.id ? 800 : 600}">${Names.abbr(it.id)}${r}${deg}</tspan>`;
    };
    const groupText = (list, x, y, lineH, maxPerLine) => {
      const lines = [];
      for (let i = 0; i < list.length; i += maxPerLine) lines.push(list.slice(i, i + maxPerLine));
      const y0 = y - (lines.length - 1) * lineH / 2;
      return lines.map((ln, k) => `<text x="${x}" y="${y0 + k * lineH}" text-anchor="middle" dominant-baseline="middle" class="kg">${ln.map((it) => `<a data-g="${it.id}">${tag(it)}</a>`).join(' ')}</text>`).join('');
    };
    const byRashi = {};
    items.forEach((it) => { (byRashi[it.rashi] = byRashi[it.rashi] || []).push(it); });
    const lagnaItem = { id: 'lagna', rashi: lagnaRashi };
    let body = '';

    if (style === 'north') {
      const centers = [null, [150, 80], [75, 32], [32, 75], [80, 150], [32, 225], [75, 268], [150, 220], [225, 268], [268, 225], [220, 150], [268, 75], [225, 32]];
      const nums = [null, [150, 128], [75, 62], [62, 75], [128, 150], [62, 225], [75, 238], [150, 172], [225, 238], [238, 225], [172, 150], [238, 75], [225, 62]];
      body += `<rect x="1" y="1" width="298" height="298" rx="6" class="kb"/>
        <path d="M1 1 L299 299 M299 1 L1 299 M150 1 L299 150 L150 299 L1 150 Z" class="kl"/>`;
      for (let h = 1; h <= 12; h++) {
        const rashi = (lagnaRashi + h - 1) % 12;
        const [nx, ny] = nums[h];
        body += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="middle" class="kn">${I.num(rashi + 1)}</text>`;
        const list = (byRashi[rashi] || []).slice();
        if (h === 1) list.unshift(lagnaItem);
        const diamond = h === 1 || h === 4 || h === 7 || h === 10;
        const narrow = h === 3 || h === 5 || h === 9 || h === 11;
        if (list.length) body += groupText(list, centers[h][0], centers[h][1], 15, diamond ? 3 : narrow ? 1 : 2);
      }
    } else {
      const cell = { 11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0], 3: [3, 1], 4: [3, 2], 5: [3, 3], 6: [2, 3], 7: [1, 3], 8: [0, 3], 9: [0, 2], 10: [0, 1] };
      body += `<rect x="1" y="1" width="298" height="298" rx="6" class="kb"/>`;
      for (let r = 0; r < 12; r++) {
        const [cxl, cyl] = cell[r], x = 1 + cxl * 74.5, y = 1 + cyl * 74.5;
        const isL = r === lagnaRashi;
        body += `<rect x="${x}" y="${y}" width="74.5" height="74.5" class="kc${isL ? ' kc-l' : ''}"/>`;
        if (isL) body += `<path d="M${x} ${y + 18} L${x + 18} ${y}" class="kla"/>`;
        body += `<text x="${x + 70}" y="${y + 11}" text-anchor="end" class="kn">${I.num(r + 1)}</text>`;
        const list = (byRashi[r] || []).slice();
        if (list.length) body += groupText(list, x + 37, y + 42, 15, 2);
      }
      body += `<text x="150" y="140" text-anchor="middle" class="kt">${opts.title || ''}</text><text x="150" y="162" text-anchor="middle" class="ks">${opts.subtitle || ''}</text>`;
    }
    return `<svg viewBox="0 0 300 300" class="kundali" role="img" aria-label="${opts.title || 'Kundali'}">${body}</svg>`;
  }

  return { createWheel, kundaliSVG, SIDEREAL_DAY_MS };
})();
