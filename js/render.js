// Sky renderer. A WebGL layer paints atmosphere, Milky Way and ground per pixel; a 2D canvas on top
// draws stars, nakshatras, rashis, grahas, grids and labels. Projection is stereographic, like Stellarium.
window.LS = window.LS || {};

LS.Renderer = (function () {
  const Sky = LS.Sky, V = LS.VEDIC, I = LS.I18N, Nm = LS.Names;
  const D2R = Math.PI / 180;

  const EQJ2GAL = [-0.0548755604, -0.8734370902, -0.4838350155,
    0.4941094279, -0.4448296300, 0.7469822445,
    -0.8676661490, -0.1980763734, 0.4559837762];

  const COLORS = {
    nakLine: 'rgba(255,190,120,0.5)', nakLabel: 'rgba(255,198,135,0.92)',
    zodiac: 'rgba(120,210,240,0.28)', rashiLabel: 'rgba(140,215,240,0.8)', nakTick: 'rgba(255,190,120,0.28)',
    western: 'rgba(120,155,205,0.42)', westernLabel: 'rgba(125,160,210,0.72)',
    grid: 'rgba(120,170,230,0.13)', eqGrid: 'rgba(230,140,200,0.12)', horizon: 'rgba(255,170,90,0.55)',
    starLabel: 'rgba(175,195,235,0.85)', vedicStar: 'rgba(255,212,160,0.92)', select: '#7ee8fa',
  };
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  // Least-squares-free exact affine map from three image points to three screen points: [a b c d e f].
  function affine(anchors, P) {
    const [x1, y1] = anchors[0].px, [x2, y2] = anchors[1].px, [x3, y3] = anchors[2].px;
    const det = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
    if (Math.abs(det) < 1e-6) return null;
    const solve = (u1, u2, u3) => [
      (u1 * (y2 - y3) + u2 * (y3 - y1) + u3 * (y1 - y2)) / det,
      (u1 * (x3 - x2) + u2 * (x1 - x3) + u3 * (x2 - x1)) / det,
      (u1 * (x2 * y3 - x3 * y2) + u2 * (x3 * y1 - x1 * y3) + u3 * (x1 * y2 - x2 * y1)) / det,
    ];
    const X = solve(P[0][0], P[1][0], P[2][0]), Y = solve(P[0][1], P[1][1], P[2][1]);
    // canvas setTransform(a, b, c, d, e, f): X = a*x + c*y + e, Y = b*x + d*y + f
    return [X[0], Y[0], X[1], Y[1], X[2], Y[2]];
  }
  const artCache = {};
  function artImage(a) {
    let img = artCache[a.file];
    if (!img) { img = artCache[a.file] = new Image(); img.decoding = 'async'; img.onload = () => LS.Renderer.onArt && LS.Renderer.onArt(); img.src = a.file; }
    return img;
  }

  // ---------- WebGL background ----------
  const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS = `
precision highp float;
uniform vec2 uCenter; uniform float uScale;
uniform mat3 uCam2Enu; uniform mat3 uEnu2Gal;
uniform vec3 uSun; uniform float uSunAlt;
uniform float uAtmo, uSkyAlpha, uGround, uMW;
uniform sampler2D uTex;
const float PI = 3.14159265;
void main(){
  vec2 s = (gl_FragCoord.xy - uCenter) / uScale;
  float r2 = dot(s, s);
  vec3 d = vec3(4.0 * s, 4.0 - r2) / (4.0 + r2);
  vec3 e = normalize(uCam2Enu * d);
  float alt = e.z;
  float day = smoothstep(-16.0, 6.0, uSunAlt);
  float cs = dot(e, uSun);

  vec3 zen = mix(vec3(0.004, 0.008, 0.024), vec3(0.08, 0.26, 0.66), day);
  vec3 hor = mix(vec3(0.020, 0.034, 0.075), vec3(0.52, 0.70, 0.92), day);
  float g = pow(1.0 - clamp(alt, 0.0, 1.0), 2.6);
  vec3 sky = mix(zen, hor, g);
  float tw = exp(-pow((uSunAlt + 4.0) / 6.5, 2.0));
  sky += vec3(1.0, 0.42, 0.16) * tw * pow(cs * 0.5 + 0.5, 3.0) * g * 0.75;
  float cpos = max(cs, 0.0);
  sky += vec3(1.0, 0.92, 0.75) * smoothstep(-6.0, 4.0, uSunAlt) * (pow(cpos, 400.0) * 0.9 + pow(cpos, 24.0) * 0.25);
  sky = mix(vec3(0.003, 0.005, 0.014), sky, uAtmo);

  vec3 gv = uEnu2Gal * e;
  float u = atan(gv.y, gv.x) / (2.0 * PI);
  float v = 0.5 - asin(clamp(gv.z, -1.0, 1.0)) / PI;
  float mw = texture2D(uTex, vec2(fract(u), v)).r;
  float mwVis = uMW * (1.0 - day * uAtmo) * smoothstep(-0.02, 0.18, alt * uAtmo + (1.0 - uAtmo));
  vec3 mwc = vec3(0.70, 0.76, 1.0) * pow(mw, 1.3) * 0.30 * mwVis;

  vec3 col = sky * uSkyAlpha + mwc;
  float a = max(uSkyAlpha, clamp(mw * 0.30 * mwVis * 2.0, 0.0, 1.0));

  if (alt < 0.0) {
    float depth = clamp(-alt * 6.0, 0.0, 1.0);
    vec3 gc = mix(vec3(0.05, 0.045, 0.04) + hor * 0.25, vec3(0.012, 0.014, 0.018), depth);
    gc += vec3(1.0, 0.55, 0.2) * 0.10 * (1.0 - depth) * (0.4 + 0.6 * tw + 0.3 * day);
    float ga = uGround * (0.7 + 0.3 * depth);
    col = gc * ga + col * (1.0 - ga);
    a = ga + a * (1.0 - ga);
  }
  gl_FragColor = vec4(col, a);
}`;

  function makeGL(canvas, mwImage) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const ctx = { gl, prog, u: {} };
    ['uCenter', 'uScale', 'uCam2Enu', 'uEnu2Gal', 'uSun', 'uSunAlt', 'uAtmo', 'uSkyAlpha', 'uGround', 'uMW', 'uTex']
      .forEach((n) => { ctx.u[n] = gl.getUniformLocation(prog, n); });
    if (mwImage) {
      const upload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, mwImage);
        ctx.onTexture && ctx.onTexture();
      };
      if (mwImage.complete && mwImage.naturalWidth) upload(); else mwImage.addEventListener('load', upload);
    }
    return ctx;
  }

  // ---------- star sprites ----------
  const BV_STOPS = [[-0.4, [155, 176, 255]], [-0.1, [175, 195, 255]], [0.15, [210, 222, 255]], [0.4, [248, 247, 255]],
    [0.65, [255, 242, 226]], [0.9, [255, 226, 190]], [1.3, [255, 206, 150]], [1.9, [255, 176, 110]]];
  // Soft halo used only around bright stars; the star itself is drawn as a crisp disc.
  function makeHalos() {
    return BV_STOPS.map(([, c]) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.9)`);
      gr.addColorStop(0.18, `rgba(${c[0]},${c[1]},${c[2]},0.28)`);
      gr.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},0.06)`);
      gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return cv;
    });
  }
  // Star core colours: mostly white with a hint of the B-V tint, like the naked eye sees.
  const CORE = BV_STOPS.map(([, c]) => `rgb(${Math.round(c[0] * 0.55 + 255 * 0.45)},${Math.round(c[1] * 0.55 + 255 * 0.45)},${Math.round(c[2] * 0.55 + 255 * 0.45)})`);
  function bvBucket(bv) {
    for (let i = BV_STOPS.length - 1; i >= 0; i--) if (bv >= BV_STOPS[i][0] - 0.12) return i;
    return 0;
  }

  // ---------- static data prep ----------
  function prepare() {
    const sd = LS_DATA.stars, n = sd.n;
    const vec = new Float32Array(n * 3), mag = new Float32Array(n), bucket = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const v = Sky.radec2vec(sd.d[i * 4], sd.d[i * 4 + 1]);
      vec[i * 3] = v[0]; vec[i * 3 + 1] = v[1]; vec[i * 3 + 2] = v[2];
      mag[i] = sd.d[i * 4 + 2];
      bucket[i] = bvBucket(sd.d[i * 4 + 3]);
    }
    const idx = (k) => sd.keys[k];
    const segs = (fig) => fig.map(([a, b]) => [idx(a), idx(b)]).filter(([a, b]) => a != null && b != null);
    const centroid = (ids) => {
      let x = 0, y = 0, z = 0;
      ids.forEach((i) => { x += vec[i * 3]; y += vec[i * 3 + 1]; z += vec[i * 3 + 2]; });
      const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l];
    };
    const uniq = (pairs) => [...new Set(pairs.flat())];

    const vedicNames = {}; // star index -> {en, hi, kind, ref}
    const nakFigs = V.nakshatras.map((nk, k) => {
      const s = segs(nk.fig), yt = idx(nk.yogatara);
      const ids = s.length ? uniq(s) : [yt];
      vedicNames[yt] = { en: nk.en, hi: nk.hi, kind: 'nakshatra', ref: k };
      return { k, segs: s, yt, label: centroid(ids) };
    });
    const abh = V.abhijit, abhIdx = idx(abh.key);
    const abhFig = { k: 'abhijit', segs: segs(abh.fig), yt: abhIdx, label: centroid(uniq(segs(abh.fig))) };
    vedicNames[abhIdx] = { en: abh.en, hi: abh.hi, kind: 'abhijit' };
    const asterisms = V.asterisms.map((a, k) => ({ k, segs: segs(a.fig), labelStar: idx(a.label) }));
    V.stars.forEach((s, k) => { const i = idx(s.key); if (i != null) vedicNames[i] = { en: s.en, hi: s.hi, kind: 'star', ref: k }; });

    const western = LS_DATA.constellations.map((c) => ({
      id: c.id, en: c.en, hi: c.hi, la: c.la, rank: c.rank, label: Sky.radec2vec(c.pos[0], c.pos[1]),
      lines: c.l.map((pl) => pl.map(([ra, dec]) => Sky.radec2vec(ra, dec))),
    }));
    const art = (LS_DATA.art || []).map((a) => ({
      id: a.id, file: a.file, size: a.size,
      anchors: a.anchors.map(([px, py, ra, dec]) => ({ px: [px, py], v: Sky.radec2vec(ra, dec) })),
    }));
    return { n, vec, mag, bucket, names: sd.names, vedicNames, nakFigs, abhFig, asterisms, western, art };
  }

  // ---------- renderer ----------
  function create(glCanvas, canvas, mwImage) {
    const data = prepare();
    let glc = null;
    try { glc = makeGL(glCanvas, mwImage); } catch (e) { console.warn('WebGL unavailable', e); }
    const ctx = canvas.getContext('2d');
    const halos = makeHalos();
    const widthCache = new Map();
    let W = 0, H = 0, dpr = 1;
    let hits = [];
    let textureReady = null;
    if (glc) glc.onTexture = () => textureReady && textureReady();

    let glDpr = 1, maxDpr = 3, lastRatio = 1;
    // The 2D layer renders at full device resolution (3x on iPhone) for crisp stars and text;
    // the smooth WebGL background is capped at 2x.
    function resize(w, h, ratio) {
      W = w; H = h; lastRatio = ratio; dpr = Math.min(ratio, maxDpr); glDpr = Math.min(ratio, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      glCanvas.width = Math.round(w * glDpr); glCanvas.height = Math.round(h * glDpr);
      for (const c of [glCanvas, canvas]) { c.style.width = w + 'px'; c.style.height = h + 'px'; }
      if (glc) glc.gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }

    function render(sc) {
      // sc: { basis:{r,u,f}, fov, fr, grahas, sunAlt, settings, selected, ar, time }
      const { r, u, f } = sc.basis;
      const cx = W / 2, cy = H / 2;
      const scale = (H / 2) / (2 * Math.tan(sc.fov * D2R / 4));
      const st = sc.settings;
      const sunEnu = sc.grahas.surya.enu;

      // GL pass
      if (glc) {
        const gl = glc.gl, U = glc.u;
        gl.uniform2f(U.uCenter, cx * glDpr, cy * glDpr);
        gl.uniform1f(U.uScale, scale * glDpr);
        gl.uniformMatrix3fv(U.uCam2Enu, false, new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]]));
        const enu2gal = Sky.mul(EQJ2GAL, sc.fr.enu2eqj);
        gl.uniformMatrix3fv(U.uEnu2Gal, false, new Float32Array(Sky.transpose(enu2gal)));
        gl.uniform3f(U.uSun, sunEnu[0], sunEnu[1], sunEnu[2]);
        gl.uniform1f(U.uSunAlt, sc.sunAlt);
        gl.uniform1f(U.uAtmo, st.atmosphere && !sc.ar ? 1 : 0);
        gl.uniform1f(U.uSkyAlpha, sc.ar ? 0 : 1);
        gl.uniform1f(U.uGround, st.ground ? (sc.ar ? Math.min(st.groundOpacity, 0.35) : st.groundOpacity) : 0);
        gl.uniform1f(U.uMW, st.milkyway ? (sc.ar ? 0.6 : 1) : 0);
        gl.uniform1i(U.uTex, 0);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      hits = [];

      // ENU -> screen
      const margin = 60;
      const P = { x: 0, y: 0 };
      function proj(e) {
        const x = e[0] * r[0] + e[1] * r[1] + e[2] * r[2];
        const y = e[0] * u[0] + e[1] * u[1] + e[2] * u[2];
        const z = e[0] * f[0] + e[1] * f[1] + e[2] * f[2];
        if (z < -0.94) return null;
        const k = 2 / (1 + z);
        P.x = cx + scale * k * x; P.y = cy - scale * k * y;
        return P;
      }
      const onScreen = (p, m = margin) => p && p.x > -m && p.x < W + m && p.y > -m && p.y < H + m;
      function refract(e) {
        const alt = Math.asin(Math.max(-1, Math.min(1, e[2]))) / D2R;
        if (alt < -2 || alt > 20) return e;
        const na = (alt + Sky.refraction(alt)) * D2R, c = Math.cos(alt * D2R);
        const k = c > 1e-6 ? Math.cos(na) / c : 1;
        return [e[0] * k, e[1] * k, Math.sin(na)];
      }
      const eqj = (v) => refract(Sky.apply(sc.fr.eqj2enu, v[0], v[1], v[2]));
      const ect = (lon, lat) => { const v = Sky.eclVec(lon, lat); return refract(Sky.apply(sc.fr.ect2enu, v[0], v[1], v[2])); };
      const hiLang = I.lang === 'hi';
      const font = (px, weight = 500) => `${weight} ${px}px ${hiLang ? "'Noto Sans Devanagari', " : ''}'Space Grotesk', system-ui, sans-serif`;

      function polyline(points, close) {
        let pen = false, lx = 0, ly = 0;
        ctx.beginPath();
        for (const e of points) {
          const p = proj(e);
          if (!p) { pen = false; continue; }
          if (pen && Math.hypot(p.x - lx, p.y - ly) > Math.max(W, H)) pen = false;
          if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
          pen = true; lx = p.x; ly = p.y;
        }
        if (close && points.length) { const p = proj(points[0]); if (p && pen) ctx.lineTo(p.x, p.y); }
        ctx.stroke();
      }
      const starEnu = (i) => eqj([data.vec[i * 3], data.vec[i * 3 + 1], data.vec[i * 3 + 2]]);

      // Thin, quiet lines that stop short of the stars, Stellarium-style.
      function segGap(a, b, ga, gb) {
        const pa = proj(a); if (!pa) return;
        const ax = pa.x, ay = pa.y;
        const pb = proj(b); if (!pb) return;
        if (!onScreen({ x: ax, y: ay }, 400) && !onScreen(pb, 400)) return;
        const dx = pb.x - ax, dy = pb.y - ay, L = Math.hypot(dx, dy);
        if (L < ga + gb + 2) return;
        const ux = dx / L, uy = dy / L;
        ctx.moveTo(ax + ux * ga, ay + uy * ga); ctx.lineTo(pb.x - ux * gb, pb.y - uy * gb);
      }
      const hairspace = (s) => (/[ऀ-ॿ]/.test(s) ? s : s.toUpperCase().split('').join(' '));
      // Labels are queued and drawn last, most important first; a label that would overlap
      // one already placed is skipped, so the sky never turns into a pile of text.
      const labelQueue = [];
      function tag(text, x, y, color, size, opts = {}) {
        labelQueue.push({ text, x, y, color, size, weight: opts.weight || 500, align: opts.align || 'center', prio: opts.prio || 0 });
      }
      function flushLabels() {
        labelQueue.sort((a, b) => b.prio - a.prio);
        const placed = [];
        ctx.textBaseline = 'middle';
        let curFont = '';
        for (const l of labelQueue) {
          const fnt = font(l.size, l.weight);
          if (fnt !== curFont) { ctx.font = fnt; curFont = fnt; }
          const key = fnt + '|' + l.text;
          let w = widthCache.get(key);
          if (w === undefined) { w = ctx.measureText(l.text).width; if (widthCache.size > 4000) widthCache.clear(); widthCache.set(key, w); }
          const h = l.size + 2;
          const x0 = l.align === 'left' ? l.x : l.x - w / 2, y0 = l.y - h / 2;
          if (placed.some((b) => x0 < b[0] + b[2] && x0 + w > b[0] && y0 < b[1] + b[3] && y0 + h > b[1])) continue;
          placed.push([x0 - 2, y0, w + 4, h]);
          ctx.fillStyle = l.color; ctx.textAlign = l.align;
          ctx.fillText(l.text, l.x, l.y);
        }
      }

      // Grids
      ctx.lineWidth = 0.8;
      if (st.grid) {
        ctx.strokeStyle = COLORS.grid;
        for (let alt = -80; alt <= 80; alt += 10) {
          const pts = []; const c = Math.cos(alt * D2R), s = Math.sin(alt * D2R);
          for (let az = 0; az <= 360; az += 3) pts.push([Math.sin(az * D2R) * c, Math.cos(az * D2R) * c, s]);
          polyline(pts);
        }
        for (let az = 0; az < 360; az += 15) {
          const pts = [];
          for (let alt = -90; alt <= 90; alt += 3) { const c = Math.cos(alt * D2R); pts.push([Math.sin(az * D2R) * c, Math.cos(az * D2R) * c, Math.sin(alt * D2R)]); }
          polyline(pts);
        }
      }
      if (st.eqGrid) {
        ctx.strokeStyle = COLORS.eqGrid;
        const M = sc.fr.eqd2enu;
        for (let dec = -75; dec <= 75; dec += 15) {
          const pts = [];
          for (let ra = 0; ra <= 360; ra += 3) { const v = Sky.radec2vec(ra, dec); pts.push(Sky.apply(M, v[0], v[1], v[2])); }
          polyline(pts);
        }
        for (let ra = 0; ra < 360; ra += 15) {
          const pts = [];
          for (let dec = -90; dec <= 90; dec += 3) { const v = Sky.radec2vec(ra, dec); pts.push(Sky.apply(M, v[0], v[1], v[2])); }
          polyline(pts);
        }
      }

      // Constellation artwork, pinned by three anchor stars (affine fit of the local projection).
      if (st.art && data.art.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const artAlpha = (sc.ar ? 0.3 : 0.17) * (st.atmosphere && !sc.ar ? Math.max(0, Math.min(1, (-sc.sunAlt - 2) / 10)) : 1);
        if (artAlpha > 0.01) for (const a of data.art) {
          const P3 = [];
          for (const an of a.anchors) {
            const e = eqj(an.v);
            const z = e[0] * f[0] + e[1] * f[1] + e[2] * f[2];
            if (z < 0.05) break;
            const p = proj(e); if (!p) break;
            P3.push([p.x, p.y]);
          }
          if (P3.length !== 3) continue;
          const minX = Math.min(P3[0][0], P3[1][0], P3[2][0]), maxX = Math.max(P3[0][0], P3[1][0], P3[2][0]);
          const minY = Math.min(P3[0][1], P3[1][1], P3[2][1]), maxY = Math.max(P3[0][1], P3[1][1], P3[2][1]);
          const pad = Math.max(maxX - minX, maxY - minY);
          if (maxX < -pad || minX > W + pad || maxY < -pad || minY > H + pad) continue;
          const T = affine(a.anchors, P3);
          if (!T) continue;
          const img = artImage(a);
          if (!img.complete || !img.naturalWidth) continue;
          ctx.globalAlpha = artAlpha;
          ctx.setTransform(dpr * T[0], dpr * T[1], dpr * T[2], dpr * T[3], dpr * T[4], dpr * T[5]);
          ctx.drawImage(img, 0, 0, a.size[0], a.size[1]);
        }
        ctx.restore();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Western / Indian-named constellations
      if (st.constellations) {
        ctx.strokeStyle = COLORS.western; ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (const c of data.western) for (const pl of c.lines) for (let i = 1; i < pl.length; i++) segGap(eqj(pl[i - 1]), eqj(pl[i]), 4, 4);
        ctx.stroke();
      }
      if ((st.constellations || st.art) && st.labels) for (const c of data.western) {
        if (sc.fov > 120 && c.rank > 1) continue;
        const p = proj(eqj(c.label)); if (!onScreen(p, 0)) continue;
        const x = p.x, y = p.y;
        tag(hairspace(Nm.constellation(c)), x, y, COLORS.westernLabel, 10.5, { weight: 500, prio: 3 - c.rank * 0.1 });
        hits.push({ x, y, r: 24, obj: { type: 'constellation', id: c.id }, prio: 0 });
      }

      // Zodiac band: ecliptic and the 12 signs. Vedic: sidereal rashis (Lahiri) with the 27 nakshatra divisions.
      // Western: the tropical zodiac, measured from the March equinox.
      const vedicSky = Nm.isVedic();
      const ayan = vedicSky ? sc.ayanamsa : 0;
      if (st.rashi) {
        ctx.strokeStyle = COLORS.zodiac; ctx.lineWidth = 0.9;
        const ecl = []; for (let l = 0; l <= 360; l += 2) ecl.push(ect(l, 0));
        polyline(ecl);
        ctx.setLineDash([2, 6]); ctx.lineWidth = 0.7;
        for (const b of [-9, 9]) { const pts = []; for (let l = 0; l <= 360; l += 3) pts.push(ect(l, b)); polyline(pts); }
        ctx.setLineDash([]);
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 12; k++) {
          const lon = ayan + k * 30, pts = [];
          for (let b = -12; b <= 12; b += 3) pts.push(ect(lon, b));
          polyline(pts);
          if (st.labels) {
            const p = proj(ect(lon + 15, -10.5));
            if (onScreen(p, 0)) {
              const x = p.x, y = p.y;
              tag(hairspace(Nm.rashi(k)), x, y, COLORS.rashiLabel, 12, { weight: 600, prio: 6 });
              hits.push({ x, y, r: 28, obj: { type: 'rashi', id: k }, prio: 1 });
            }
          }
        }
        ctx.strokeStyle = COLORS.nakTick;
        for (let k = 0; k < (vedicSky ? 27 : 0); k++) {
          const lon = ayan + k * Sky.NAK, pts = [];
          for (let b = -5; b <= 5; b += 2.5) pts.push(ect(lon, b));
          polyline(pts);
          if (st.labels) { const p = proj(ect(lon + Sky.NAK / 2, 6.8)); if (onScreen(p, 0)) tag(I.num(k + 1), p.x, p.y, 'rgba(255,200,130,0.5)', 9.5, { weight: 600, prio: 1 }); }
        }
      }

      // Nakshatra figures
      if (st.nakshatra) {
        ctx.strokeStyle = COLORS.nakLine; ctx.lineWidth = 1;
        ctx.beginPath();
        const figs = [...data.nakFigs, data.abhFig, ...data.asterisms];
        for (const fg of figs) for (const [a, b] of fg.segs) segGap(starEnu(a), starEnu(b), 4.5, 4.5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,130,0.4)'; ctx.lineWidth = 0.8;
        for (const fg of [...data.nakFigs, data.abhFig]) {
          const p = proj(starEnu(fg.yt));
          if (onScreen(p, 0)) { ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2); ctx.stroke(); }
        }
        if (st.labels) {
          for (const fg of data.nakFigs) {
            const p = proj(eqj(fg.label)); if (!onScreen(p, 0)) continue;
            const x = p.x, y = p.y - 16;
            tag(hairspace(Nm.nakshatra(fg.k)), x, y, COLORS.nakLabel, 11.5, { weight: 600, prio: 7 });
            hits.push({ x, y, r: 30, obj: { type: 'nakshatra', id: fg.k }, prio: 2 });
          }
          const pa = proj(eqj(data.abhFig.label));
          if (onScreen(pa, 0)) {
            const x = pa.x, y = pa.y - 16;
            tag(hairspace(hiLang ? V.abhijit.hi : V.abhijit.en), x, y, COLORS.nakLabel, 11, { weight: 600, prio: 6.5 });
            hits.push({ x, y, r: 26, obj: { type: 'nakshatra', id: 'abhijit' }, prio: 2 });
          }
          for (const a of data.asterisms) {
            const p = proj(starEnu(a.labelStar)); if (!onScreen(p, 0)) continue;
            const x = p.x, y = p.y + 18;
            tag(hairspace(hiLang ? V.asterisms[a.k].hi : V.asterisms[a.k].en), x, y, 'rgba(255,214,160,0.7)', 10.5, { weight: 500, prio: 5 });
            hits.push({ x, y, r: 26, obj: { type: 'asterism', id: a.k }, prio: 1 });
          }
        }
      }

      // Stars: crisp points with colour, a soft halo only for the brightest.
      const fovLimit = 6.5 - 1.4 * Math.min(1, Math.max(0, (sc.fov - 30) / 150));
      const skyLimit = st.atmosphere && !sc.ar ? Sky.limitingMag(sc.sunAlt) + 0.3 : 6.5;
      const limit = Math.min(fovLimit, skyLimit) + (st.starBrightness - 1) * 1.2;
      const gain = st.starBrightness * (sc.ar ? 1.2 : 1);
      const zoom = Math.min(1.8, Math.max(0, Math.log10(60 / sc.fov)) * 0.55);
      const labelLimit = sc.fov > 100 ? 1.6 : sc.fov > 50 ? 2.6 : sc.fov > 20 ? 3.8 : 5.2;
      const groundDim = st.ground && !sc.ar ? 1 - st.groundOpacity * 0.85 : 1;
      ctx.globalCompositeOperation = 'lighter';
      const starLabels = [];
      // Hot loop: ~9,000 stars every frame while the phone moves, so no allocations here (no GC stutter).
      const E = sc.fr.eqj2enu, V3 = data.vec, MAG = data.mag;
      const r0 = r[0], r1 = r[1], r2 = r[2], u0 = u[0], u1 = u[1], u2 = u[2], f0 = f[0], f1 = f[1], f2 = f[2];
      const SIN20 = 0.342;
      let lastFill = -1;
      for (let i = 0; i < data.n; i++) {
        const m = MAG[i];
        if (m > limit) break;
        const vx = V3[i * 3], vy = V3[i * 3 + 1], vz = V3[i * 3 + 2];
        let ex = E[0] * vx + E[1] * vy + E[2] * vz, ey = E[3] * vx + E[4] * vy + E[5] * vz, ez = E[6] * vx + E[7] * vy + E[8] * vz;
        if (ez < -0.01 && groundDim < 0.2) continue;
        if (ez > -0.035 && ez < SIN20) { // atmospheric refraction near the horizon
          const alt = Math.asin(ez) / D2R, na = (alt + Sky.refraction(alt)) * D2R, c = Math.cos(alt * D2R);
          const k = c > 1e-6 ? Math.cos(na) / c : 1;
          ex *= k; ey *= k; ez = Math.sin(na);
        }
        const z = ex * f0 + ey * f1 + ez * f2;
        if (z < -0.94) continue;
        const kk = 2 / (1 + z);
        const px = cx + scale * kk * (ex * r0 + ey * r1 + ez * r2), py = cy - scale * kk * (ex * u0 + ey * u1 + ez * u2);
        if (px < -8 || px > W + 8 || py < -8 || py > H + 8) continue;
        const d = limit - m;
        const rp = Math.min(4.6, (0.42 + 0.3 * Math.pow(d, 1.18) + zoom * 0.5) * gain);
        const a = Math.min(1, 0.12 + d / 1.6) * (ez < 0 ? groundDim : 1);
        const b = data.bucket[i];
        if (d > 3.4) {
          const HR = rp * 5.5;
          ctx.globalAlpha = a * Math.min(0.55, (d - 3.4) * 0.22 + 0.15);
          ctx.drawImage(halos[b], px - HR, py - HR, HR * 2, HR * 2);
        }
        ctx.globalAlpha = a;
        if (b !== lastFill) { ctx.fillStyle = CORE[b]; lastFill = b; }
        if (rp < 0.9) ctx.fillRect(px - rp, py - rp, rp * 2, rp * 2);
        else { ctx.beginPath(); ctx.arc(px, py, rp, 0, 6.2832); ctx.fill(); }
        if (m < 4.6 || data.vedicNames[i]) hits.push({ x: px, y: py, r: 16, obj: { type: 'star', id: i }, prio: data.vedicNames[i] ? 3 : 1 });
        if (st.labels && st.starNames && (m < labelLimit || (data.vedicNames[i] && Nm.isVedic() && m < labelLimit + 1.5))) starLabels.push([i, px, py, rp]);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      for (const [i, x, y, rp] of starLabels) {
        const vn = data.vedicNames[i];
        let color = COLORS.starLabel;
        // Yogataras are already named by their nakshatra figure when that layer is on.
        if (vn && vn.kind === 'nakshatra' && st.nakshatra && (Nm.isVedic() || !data.names[i])) continue;
        const text = Nm.star(vn, data.names[i]);
        if (vn && Nm.isVedic()) color = COLORS.vedicStar;
        if (!text) continue;
        tag(text, x + rp + 5, y - rp - 4, color, 11.5, { weight: 400, align: 'left', prio: (vn ? 5 : 4) - data.mag[i] * 0.1 });
      }

      // Grahas
      if (st.graha) {
        const moon = sc.grahas.chandra;
        for (const id of Sky.GRAHA_ORDER) {
          const g = sc.grahas[id], gv = V.grahas[id];
          const e = refract(g.enu);
          const p = proj(e);
          if (!onScreen(p, 30)) continue;
          const x = p.x, y = p.y;
          let rad;
          if (id === 'surya' || id === 'chandra') {
            rad = Math.max(id === 'surya' ? 9 : 8, 0.2665 * D2R * scale);
            if (id === 'surya') {
              const gr = ctx.createRadialGradient(x, y, rad * 0.5, x, y, rad * 6);
              gr.addColorStop(0, 'rgba(255,236,190,0.7)'); gr.addColorStop(0.3, 'rgba(255,200,110,0.18)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
              ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad * 6, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
            } else {
              // Screen direction toward the Sun along the great circle from the Moon.
              const m = e, dd = m[0] * sunEnu[0] + m[1] * sunEnu[1] + m[2] * sunEnu[2];
              const tg = [sunEnu[0] - dd * m[0], sunEnu[1] - dd * m[1], sunEnu[2] - dd * m[2]];
              const tl = Math.hypot(tg[0], tg[1], tg[2]) || 1, h = 0.002;
              const sp = proj([m[0] + tg[0] / tl * h, m[1] + tg[1] / tl * h, m[2] + tg[2] / tl * h]);
              const ang = sp ? Math.atan2(sp.y - y, sp.x - x) : 0;
              drawMoon(ctx, x, y, rad, moon.phase, ang);
            }
          } else if (id === 'rahu' || id === 'ketu') {
            rad = 6;
            ctx.strokeStyle = gv.color; ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fillStyle = gv.color; ctx.fill();
          } else {
            rad = Math.max(1.8, Math.min(4.2, 3 - g.mag * 0.55));
            const gr = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
            gr.addColorStop(0, hexA(gv.color, 0.55)); gr.addColorStop(1, hexA(gv.color, 0));
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
          }
          hits.push({ x, y, r: Math.max(22, rad + 10), obj: { type: 'graha', id }, prio: 5 });
          if (st.labels) {
            const txt = `${Nm.graha(id)}${g.retro && id !== 'rahu' && id !== 'ketu' ? (hiLang ? ' (व)' : ' ℞') : ''}`;
            tag(txt, x + rad + 6, y + rad + 3, gv.color, 12.5, { weight: 600, align: 'left', prio: 8 });
          }
        }
      }

      // Horizon + eight directions
      ctx.strokeStyle = COLORS.horizon; ctx.lineWidth = 1;
      const hz = []; for (let az = 0; az <= 360; az += 2) hz.push([Math.sin(az * D2R), Math.cos(az * D2R), 0]);
      polyline(hz);
      for (let k = 0; k < 8; k++) {
        const az = k * 45 * D2R, main = k % 2 === 0;
        const p = proj([Math.sin(az), Math.cos(az), 0.012]); if (!onScreen(p, 0)) continue;
        const px = p.x, py = p.y;
        tag(hiLang ? V.directions[k].hi : V.directionsShort[k], px, py - (main ? 15 : 11), k === 0 ? '#ff7a6a' : 'rgba(255,214,160,0.9)', main ? 17 : 11.5, { weight: 600, prio: 9 });
        if (!hiLang && Nm.isVedic() && main) tag(hairspace(V.directions[k].en), px, py + 3, 'rgba(255,214,160,0.55)', 8.5, { weight: 600, prio: 9 });
      }

      flushLabels();

      // Selection reticle
      if (sc.selectedEnu) {
        const p = proj(refract(sc.selectedEnu));
        if (onScreen(p, 0)) drawReticle(ctx, p.x, p.y, sc.time);
      }
      return { scale };
    }

    function drawMoon(c, x, y, R, elong, sunAngle) {
      const glow = c.createRadialGradient(x, y, R * 0.8, x, y, R * 3.5);
      glow.addColorStop(0, 'rgba(220,230,255,0.25)'); glow.addColorStop(1, 'rgba(220,230,255,0)');
      c.fillStyle = glow; c.beginPath(); c.arc(x, y, R * 3.5, 0, Math.PI * 2); c.fill();
      c.save();
      c.translate(x, y); c.rotate(sunAngle);
      c.fillStyle = 'rgba(60,66,84,0.95)';
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
      // +x now points at the Sun, so the lit limb is always on the +x side.
      const rx = Math.abs(Math.cos(elong * D2R)) * R;
      c.fillStyle = '#f4f1e6';
      c.beginPath();
      c.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, false);
      const elo = Math.min(elong, 360 - elong);
      if (elo < 90) c.ellipse(0, 0, rx, R, 0, Math.PI / 2, -Math.PI / 2, true);
      else c.ellipse(0, 0, rx, R, 0, Math.PI / 2, Math.PI * 1.5, false);
      c.closePath(); c.fill();
      c.restore();
    }

    function drawReticle(c, x, y, time) {
      const t = (time % 4000) / 4000 * Math.PI * 2, R = 20;
      c.save(); c.translate(x, y); c.rotate(t * 0.25);
      c.strokeStyle = COLORS.select; c.lineWidth = 2;
      c.shadowColor = COLORS.select; c.shadowBlur = 10;
      for (let k = 0; k < 4; k++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.arc(0, 0, R, -0.35, 0.35); c.stroke();
      }
      c.restore();
    }

    function hitTest(x, y) {
      let best = null, bestScore = Infinity;
      for (const h of hits) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d > h.r) continue;
        const score = d - h.prio * 6;
        if (score < bestScore) { bestScore = score; best = h.obj; }
      }
      return best;
    }

    // Drop the 2D layer to 2x if a phone can't keep up at 3x (checked by the app from frame times).
    function lowerQuality() {
      if (maxDpr <= 2 || lastRatio <= 2) return false;
      maxDpr = 2; resize(W, H, lastRatio); return true;
    }

    return { data, resize, render, hitTest, lowerQuality, set onTextureReady(f) { textureReady = f; }, hasGL: !!glc };
  }

  return { create };
})();
