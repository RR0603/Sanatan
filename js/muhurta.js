// Daily timings ("Today"): sunrise/sunset, moonrise/moonset, Rahu Kaal, Yamaganda, Gulika Kaal,
// Abhijit and Brahma muhurta and the 16 Choghadiya of the Vedic day (sunrise to next sunrise).
window.LS = window.LS || {};

LS.Muhurta = (function () {
  const A = window.Astronomy;
  // Eighth parts of daytime (1-based) by weekday, Sunday first.
  const RAHU = [8, 2, 7, 5, 6, 4, 3];
  const YAMA = [5, 4, 3, 2, 1, 7, 6];
  const GULIKA = [7, 6, 5, 4, 3, 2, 1];
  // Choghadiya: the day ones follow DAY_ORDER, the night ones NIGHT_ORDER, each starting by weekday.
  const DAY_ORDER = ['udveg', 'char', 'labh', 'amrit', 'kaal', 'shubh', 'rog'];
  const NIGHT_ORDER = ['shubh', 'amrit', 'char', 'rog', 'kaal', 'labh', 'udveg'];
  const QUALITY = { amrit: 'good', shubh: 'good', labh: 'good', char: 'neutral', udveg: 'bad', rog: 'bad', kaal: 'bad' };

  const ms = (t) => (t ? t.date.getTime() : null);
  function rise(body, obs, fromMs, dir, limit) {
    try { return ms(A.SearchRiseSet(body, obs, dir, A.MakeTime(new Date(fromMs)), limit)); } catch (e) { return null; }
  }
  // Weekday at the observer's local mean solar time (unambiguous at sunrise).
  const weekdayAt = (t, lon) => new Date(t + lon / 15 * 3600e3).getUTCDay();
  const part = (start, len, k) => [start + (k - 1) * len, start + k * len];

  // dayStartMs: local midnight of the civil date. opts.dayEnd: the next local midnight (days are 23 or 25 h
  // long when clocks change); opts.weekday: the civil weekday (0 = Sunday) of that date.
  function day(observer, dayStartMs, opts = {}) {
    const D = 86400000;
    const dayEnd = opts.dayEnd || dayStartMs + D;
    const sunrise = rise(A.Body.Sun, observer, dayStartMs, +1, 1);
    const sunset = sunrise ? rise(A.Body.Sun, observer, sunrise, -1, 1) : rise(A.Body.Sun, observer, dayStartMs, -1, 1);
    const out = {
      dayStart: dayStartMs, sunrise, sunset,
      moonrise: rise(A.Body.Moon, observer, dayStartMs, +1, 1),
      moonset: rise(A.Body.Moon, observer, dayStartMs, -1, 1),
      vara: opts.weekday != null ? opts.weekday : weekdayAt((sunrise || dayStartMs + D / 2), observer.longitude),
    };
    // Rise/set found by searching one day ahead may belong to the next civil day.
    for (const k of ['moonrise', 'moonset']) if (out[k] && out[k] >= dayEnd) out[k] = null;
    if (!sunrise || !sunset || sunset < sunrise) { out.polar = true; return out; }
    const nextSunrise = rise(A.Body.Sun, observer, sunset, +1, 1.2); // null before a polar night: no night Choghadiya
    const prevSunset = rise(A.Body.Sun, observer, sunrise, -1, -1.2);
    out.nextSunrise = nextSunrise;
    const dayLen = sunset - sunrise, e8 = dayLen / 8, m15 = dayLen / 15;
    const w = out.vara;
    out.rahu = part(sunrise, e8, RAHU[w]);
    out.yama = part(sunrise, e8, YAMA[w]);
    out.gulika = part(sunrise, e8, GULIKA[w]);
    out.abhijit = part(sunrise, m15, 8);
    if (prevSunset) { const nm = (sunrise - prevSunset) / 15; out.brahma = [sunrise - 2 * nm, sunrise - nm]; }
    const chogh = [];
    const d0 = (3 * w) % 7;
    for (let k = 0; k < 8; k++) {
      const id = DAY_ORDER[(d0 + k) % 7];
      chogh.push({ id, q: QUALITY[id], night: false, s: sunrise + k * e8, e: sunrise + (k + 1) * e8 });
    }
    if (nextSunrise) {
      const n8 = (nextSunrise - sunset) / 8, n0 = (2 * w) % 7;
      for (let k = 0; k < 8; k++) {
        const id = NIGHT_ORDER[(n0 + k) % 7];
        chogh.push({ id, q: QUALITY[id], night: true, s: sunset + k * n8, e: sunset + (k + 1) * n8 });
      }
    }
    out.choghadiya = chogh;
    return out;
  }

  return { day, QUALITY };
})();
