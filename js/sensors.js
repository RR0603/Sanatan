// Device orientation -> camera basis in the ENU frame, plus the rear camera feed for AR mode.
window.LS = window.LS || {};

LS.Sensors = (function () {
  const D2R = Math.PI / 180;
  let handler = null, eventName = null, smoothed = null, gotEvent = false;

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

  function basisFromEvent(e) {
    let alpha = e.alpha;
    if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) alpha = 360 - e.webkitCompassHeading;
    const R = rotationMatrix(alpha, e.beta, e.gamma);
    // Account for the screen being rotated relative to the device's natural orientation.
    const s = -screenAngle() * D2R, cs = Math.cos(s), ss = Math.sin(s);
    const col = (j) => [R[j], R[3 + j], R[6 + j]];
    const x = col(0), y = col(1), z = col(2);
    const right = [x[0] * cs + y[0] * ss, x[1] * cs + y[1] * ss, x[2] * cs + y[2] * ss];
    const up = [-x[0] * ss + y[0] * cs, -x[1] * ss + y[1] * cs, -x[2] * ss + y[2] * cs];
    const fwd = [-z[0], -z[1], -z[2]]; // the rear camera looks out of the back of the phone
    return { r: right, u: up, f: fwd, absolute: e.absolute === true || typeof e.webkitCompassHeading === 'number' };
  }

  function rotateAz(v, deg) {
    const d = deg * D2R, c = Math.cos(d), s = Math.sin(d);
    return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
  }

  async function start(onBasis, onError, getOffset) {
    stop();
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) { onError('none'); return false; }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') { onError('denied'); return false; }
      } catch (err) { onError('denied'); return false; }
    }
    gotEvent = false; smoothed = null;
    handler = (e) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      gotEvent = true;
      const b = basisFromEvent(e);
      const off = getOffset ? getOffset() : 0;
      let f = rotateAz(b.f, off), u = rotateAz(b.u, off);
      if (smoothed) {
        const k = 0.22;
        f = norm(smoothed.f.map((v, i) => v + (f[i] - v) * k));
        u = smoothed.u.map((v, i) => v + (u[i] - v) * k);
      }
      f = norm(f);
      // Re-orthonormalise: right = f x u (so that u = r x f), up = r x f.
      const d = dot(u, f);
      u = norm([u[0] - d * f[0], u[1] - d * f[1], u[2] - d * f[2]]);
      const r = cross(f, u);
      smoothed = { r, u, f };
      onBasis({ r, u, f }, b.absolute);
    };
    eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(eventName, handler, true);
    setTimeout(() => { if (handler && !gotEvent) onError('none'); }, 2500);
    return true;
  }

  function stop() {
    if (handler && eventName) window.removeEventListener(eventName, handler, true);
    handler = null; eventName = null; smoothed = null;
  }

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

  return { start, stop, startCamera, stopCamera, rotationMatrix, basisFromEvent };
})();
