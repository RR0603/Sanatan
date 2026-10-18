// Device orientation -> camera basis in the ENU frame, plus the rear camera feed for AR mode.
window.LS = window.LS || {};

LS.Sensors = (function () {
  const D2R = Math.PI / 180;
  let handlers = [], smoothed = null, gotEvent = false, sawAbsolute = false;
  const stat = { events: 0, alpha: null, beta: null, gamma: null, absolute: false, permission: 'unknown' };

  function rotationMatrix(alpha, beta, gamma) {
    // W3C DeviceOrientation: R = Rz(alpha) * Rx(beta) * Ry(gamma), device frame -> Earth frame (E, N, Up).
    const a = alpha * D2R, b = beta * D2R, g = gamma * D2R;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
    return [
      ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
      sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
      -cb * sg, sb, cb * cg,
    ];
  }

  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }

  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  // Device frame -> camera basis (right, up, forward) in ENU for given W3C Euler angles.
  function basisFromAngles(alpha, beta, gamma) {
    const R = rotationMatrix(alpha, beta, gamma);
    // Account for the screen being rotated relative to the device's natural orientation.
    const s = -screenAngle() * D2R, cs = Math.cos(s), ss = Math.sin(s);
    const col = (j) => [R[j], R[3 + j], R[6 + j]];
    const x = col(0), y = col(1), z = col(2);
    const right = [x[0] * cs + y[0] * ss, x[1] * cs + y[1] * ss, x[2] * cs + y[2] * ss];
    const up = [-x[0] * ss + y[0] * cs, -x[1] * ss + y[1] * cs, -x[2] * ss + y[2] * cs];
    const fwd = [-z[0], -z[1], -z[2]]; // the rear camera looks out of the back of the phone
    return { r: right, u: up, f: fwd };
  }

  // Sensor fusion. The gyroscope-driven alpha/beta/gamma always move the view, so it is smooth and
  // continuous in every direction (including straight up). On iOS alpha is relative to an arbitrary
  // start heading, so the magnetic compass (webkitCompassHeading) only feeds a slowly filtered
  // offset to true north. Which edge of the phone that heading describes is ambiguous once the phone
  // tilts past vertical (top edge vs. camera direction differ by 180°), so every reading yields two
  // candidate offsets and we follow the one consistent with what we already know. Readings taken
  // while the top edge and the camera face the same way settle the question outright.
  // getDeclination(): magnetic declination in degrees (east positive) for the observer, so the
  // compass (which measures magnetic north) is turned into true north.
  function createFusion(getDeclination) {
    let offset = null, locked = false, n = 0;
    const wrap = (d) => ((d % 360) + 540) % 360 - 180;
    const az = (v) => Math.atan2(v[0], v[1]) / D2R;
    return function fuse(e) {
      let alpha = e.alpha;
      const decl = getDeclination ? getDeclination() || 0 : 0;
      const raw = e.webkitCompassHeading; // -1 while the compass is uncalibrated
      const hasCompass = typeof raw === 'number' && !isNaN(raw) && raw >= 0 && !(e.webkitCompassAccuracy > 50);
      const H = raw + decl;
      if (hasCompass && e.absolute !== true) {
        const R = rotationMatrix(e.alpha, e.beta, e.gamma);
        const top = [R[1], R[4], R[7]], cam = [-R[2], -R[5], -R[8]];
        const mTop = Math.hypot(top[0], top[1]), mCam = Math.hypot(cam[0], cam[1]);
        // offset such that absolute azimuth = relative azimuth - offset
        const cands = [];
        if (mTop > 0.45) cands.push({ o: (az(top) - H + 720) % 360, m: mTop });
        if (mCam > 0.45) cands.push({ o: (az(cam) - H + 720) % 360, m: mCam });
        const agree = cands.length === 2 && Math.abs(wrap(cands[0].o - cands[1].o)) < 25;
        if (cands.length) {
          if (agree && !locked) { offset = cands[0].o; locked = true; n = 1; }
          // First guess: the heading describes whichever edge is nearer horizontal (as the iOS Compass does).
          else if (offset === null) offset = cands.reduce((p, c) => (c.m > p.m ? c : p)).o;
          else {
            const best = cands.map((c) => c.o).reduce((p, c) => (Math.abs(wrap(c - offset)) < Math.abs(wrap(p - offset)) ? c : p));
            const d = wrap(best - offset);
            if (n < 20 || Math.abs(d) < 30) { offset = (offset + d * (n < 20 ? 0.2 : 0.03) + 360) % 360; n++; }
          }
        }
        // relative azimuth = true azimuth + offset, and azimuth = -alpha, so alpha_true = alpha_rel + offset.
        alpha = e.alpha + (offset || 0);
      }
      // Android's absolute alpha is also referenced to magnetic north.
      else if (e.absolute === true) alpha = e.alpha - decl;
      const b = basisFromAngles(alpha, e.beta, e.gamma);
      b.absolute = e.absolute === true || hasCompass;
      b.calibrated = e.absolute === true || locked || n > 20;
      return b;
    };
  }
  // Stateless single-event version (kept for tests).
  function basisFromEvent(e) { return createFusion()(e); }

  function rotateAz(v, deg) {
    const d = deg * D2R, c = Math.cos(d), s = Math.sin(d);
    return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
  }

  // iOS 13+ only grants motion data from inside a tap, and shows one permission prompt at a time,
  // so this must be the first thing a tap handler calls.
  function needsPermission() {
    return !!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function');
  }
  async function requestPermission() {
    if (!window.DeviceOrientationEvent) { stat.permission = 'unsupported'; return 'unsupported'; }
    if (!needsPermission()) { stat.permission = 'granted'; return 'granted'; }
    try { stat.permission = await DeviceOrientationEvent.requestPermission(); } catch (err) { stat.permission = 'denied'; }
    return stat.permission;
  }

  async function start(onBasis, onError, getOffset, getDeclination) {
    stop();
    const perm = await requestPermission();
    if (perm === 'unsupported') { onError('none'); return false; }
    if (perm !== 'granted') { onError('denied'); return false; }
    gotEvent = false; sawAbsolute = false; smoothed = null; stat.events = 0;
    const fuse = createFusion(getDeclination);
    const handler = (e) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      // Android fires both events: once absolute ones arrive, ignore the relative stream.
      if (e.type === 'deviceorientationabsolute') sawAbsolute = true;
      else if (sawAbsolute) return;
      gotEvent = true;
      stat.events++; stat.alpha = e.alpha; stat.beta = e.beta; stat.gamma = e.gamma;
      const b = fuse(e);
      const off = getOffset ? getOffset() : 0;
      let f = rotateAz(b.f, off), u = rotateAz(b.u, off);
      if (smoothed) {
        // Light smoothing only: the gyro signal is already clean, so keep latency low.
        const k = 0.45;
        f = norm(smoothed.f.map((v, i) => v + (f[i] - v) * k));
        u = smoothed.u.map((v, i) => v + (u[i] - v) * k);
      }
      f = norm(f);
      // Re-orthonormalise: right = f x u (so that u = r x f), up = r x f.
      const d = dot(u, f);
      u = norm([u[0] - d * f[0], u[1] - d * f[1], u[2] - d * f[2]]);
      const r = cross(f, u);
      smoothed = { r, u, f };
      stat.absolute = b.absolute; stat.calibrated = b.calibrated;
      onBasis({ r, u, f }, b.absolute);
    };
    const names = ['deviceorientation'];
    if ('ondeviceorientationabsolute' in window) names.push('deviceorientationabsolute');
    for (const n of names) { window.addEventListener(n, handler, true); handlers.push([n, handler]); }
    setTimeout(() => { if (handlers.length && !gotEvent) onError('none'); }, 4000);
    return true;
  }

  function stop() {
    for (const [n, h] of handlers) window.removeEventListener(n, h, true);
    handlers = []; smoothed = null;
  }
  const status = () => ({ ...stat, active: handlers.length > 0, receiving: gotEvent });

  let stream = null;
  async function startCamera(video) {
    stopCamera(video);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported');
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    });
    video.srcObject = stream;
    await video.play().catch(() => {});
    return true;
  }
  function stopCamera(video) {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  return { start, stop, startCamera, stopCamera, rotationMatrix, basisFromEvent, createFusion, requestPermission, needsPermission, status };
})();
