// Sensor fusion: the camera direction must track the true pose in every direction, whatever edge
// of the phone iOS's compass heading refers to.
import { load, check, done } from './helpers.mjs';
const w = load('js/sensors.js', 'js/magnetic.js');
const S = w.LS.Sensors, D = Math.PI / 180;
const az = (v) => ((Math.atan2(v[0], v[1]) / D) + 360) % 360, el = (v) => Math.asin(Math.max(-1, Math.min(1, v[2]))) / D;

function pose(A, E, roll) {
  const f = [Math.sin(A * D) * Math.cos(E * D), Math.cos(A * D) * Math.cos(E * D), Math.sin(E * D)];
  let r = [Math.cos(A * D), -Math.sin(A * D), 0];
  let u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const c = Math.cos(roll * D), s = Math.sin(roll * D);
  [r, u] = [r.map((x, i) => x * c + u[i] * s), u.map((x, i) => -r[i] * s + x * c)];
  return { x: r, y: u, z: f.map((v) => -v) };
}
function euler(P) { // W3C Z-X'-Y''
  const R = [P.x[0], P.y[0], P.z[0], P.x[1], P.y[1], P.z[1], P.x[2], P.y[2], P.z[2]];
  for (const flip of [false, true]) {
    let beta = Math.asin(Math.max(-1, Math.min(1, R[7]))) / D;
    if (flip) beta = (beta > 0 ? 180 : -180) - beta;
    const cb = Math.cos(beta * D); if (Math.abs(cb) < 1e-9) continue;
    const alpha = Math.atan2(-R[1] / cb, R[4] / cb) / D, gamma = Math.atan2(-R[6] / cb, R[8] / cb) / D;
    if (gamma >= -90 && gamma < 90) return { alpha, beta, gamma };
  }
}
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
const path = [];
for (let t = 0; t <= 360; t += 2) path.push([t, 10, rnd() * 6]);
for (let t = 0; t <= 80; t += 1) path.push([200, 10 + t, rnd() * 4]);
for (let t = 0; t <= 360; t += 3) path.push([t, 60, rnd() * 4]);

for (const model of ['nearest-horizontal', 'top-when-possible', 'camera']) {
  const fuse = S.createFusion(() => 0);
  let worst = 0, sum = 0, n = 0;
  path.forEach(([A, E, roll], i) => {
    const P = pose(A, E, roll), ev = euler(P);
    const mTop = Math.hypot(P.y[0], P.y[1]), mCam = Math.hypot(P.z[0], P.z[1]);
    const H = model === 'camera' ? (mCam > 0.1 ? A : az(P.y)) : model === 'top-when-possible' ? (mTop > 0.5 ? az(P.y) : A) : (mTop > mCam ? az(P.y) : A);
    const b = fuse({ alpha: ((ev.alpha - 123) % 360 + 360) % 360, beta: ev.beta, gamma: ev.gamma, webkitCompassHeading: (H + rnd() * 8 + 360) % 360 });
    if (i < 40) return;
    const da = Math.abs(((az(b.f) - A + 540) % 360) - 180), de = Math.abs(el(b.f) - E);
    const err = Math.hypot(da * Math.cos(E * D), de);
    worst = Math.max(worst, err); sum += err; n++;
  });
  check(`fusion (${model}): mean < 1°, never flips`, sum / n < 1 && worst < 15, `mean ${(sum / n).toFixed(2)}°, worst ${worst.toFixed(1)}°`);
}
{
  const f = S.createFusion(() => 13);
  let b; for (let i = 0; i < 30; i++) b = f({ alpha: 320, beta: 90, gamma: 0, webkitCompassHeading: 77 });
  check('magnetic 77° + 13° declination → true 90°', Math.abs(az(b.f) - 90) < 0.5, az(b.f).toFixed(2));
}
done();
