// The sky against Stellarium: apparent azimuth and altitude (refraction on) from Stellarium 23.4 for Ujjain,
// 2026-10-21 15:00 UTC, read with its scripting API (core.getObjectInfo). Every object must land within 2 arcminutes.
import { load, check, done } from './helpers.mjs';

const ctx = load('js/vendor/astronomy.browser.min.js', 'js/vedic.js', 'js/sky.js', 'js/data/stars.js');
const { Astronomy: A, LS, LS_DATA } = ctx;
const Sky = LS.Sky;
const STELLARIUM = {
  Moon: [175.8957, 55.4742],
  Mars: [20.4485, -46.2105],
  Jupiter: [8.428, -51.9733],
  Venus: [263.455, -37.1543],
  Saturn: [113.8554, 46.1019],
  Uranus: [69.7762, 6.2858],
  Neptune: [122.84, 51.128],
  Vega: [302.2941, 43.9313],
  Altair: [251.0624, 55.5208],
  Deneb: [328.3667, 62.3649],
  Capella: [41.2409, 4.6076],
  Fomalhaut: [165.0509, 35.6891],
  Polaris: [0.6606, 23.3609],
  Alpheratz: [71.0933, 61.1158],
  Markab: [115.0985, 73.2885],
  Hamal: [76.3777, 34.2055],
  Sirius: [91.5035, -43.4541],
  Rigel: [90.5815, -19.7966],
  Betelgeuse: [70.8228, -22.4229],
  Aldebaran: [71.4591, -0.4007],
};
// J2000 catalogue positions (degrees) used to find each star in the app's catalogue.
const STARS = {
  Vega: [279.235, 38.784],
  Altair: [297.696, 8.868],
  Deneb: [310.358, 45.28],
  Capella: [79.172, 45.998],
  Fomalhaut: [344.413, -29.622],
  Polaris: [37.95, 89.264],
  Alpheratz: [2.097, 29.09],
  Markab: [346.19, 15.205],
  Hamal: [31.793, 23.462],
  Sirius: [101.287, -16.716],
  Rigel: [78.634, -8.202],
  Betelgeuse: [88.793, 7.407],
  Aldebaran: [68.98, 16.509],
};
const PLANETS = { Moon: 'chandra', Mars: 'mangala', Jupiter: 'guru', Venus: 'shukra', Saturn: 'shani', Uranus: 'arun', Neptune: 'varun' };
const time = A.MakeTime(new Date('2026-10-21T15:00:00Z'));
const obs = new A.Observer(23.1765, 75.7849, 0);
const fr = Sky.frames(time, obs);
const G = Sky.grahas(time, obs, fr);
const d = LS_DATA.stars.d;
function starVec([ra, dec]) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < d.length; i += 4) { const dd = Math.hypot((d[i] - ra) * Math.cos(dec * Math.PI / 180), d[i + 1] - dec); if (dd < bd) { bd = dd; best = i; } }
  return Sky.radec2vec(d[best], d[best + 1]);
}
for (const [name, [refAz, refAlt]] of Object.entries(STELLARIUM)) {
  const v = PLANETS[name] ? G[PLANETS[name]].eqj : starVec(STARS[name]);
  const e = Sky.apply(fr.eqj2enu, v[0], v[1], v[2]);
  const geo = Math.asin(e[2]) * 180 / Math.PI;
  const alt = geo + Sky.refraction(geo);
  const az = (Math.atan2(e[0], e[1]) * 180 / Math.PI + 360) % 360;
  const dAz = (((az - refAz + 540) % 360) - 180) * Math.cos(alt * Math.PI / 180);
  const err = Math.hypot(dAz, alt - refAlt) * 60;
  check(`${name} matches Stellarium`, err < 2, `${err.toFixed(2)}′`);
}
done();
