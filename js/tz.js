// Time-zone helpers shared by the app and the calendar: civil dates at the observer's place.
window.LS = window.LS || {};

LS.TZ = (function () {
  const DAY = 86400000;
  const cache = new Map();
  function fmtFor(tz) {
    if (!cache.has(tz)) {
      cache.set(tz, new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    return cache.get(tz);
  }
  // Minutes to add to UTC to get local clock time in `tz` at instant `ms`.
  function offsetMin(tz, ms) {
    try {
      const p = {};
      fmtFor(tz).formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
      return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms) / 60000);
    } catch (e) { return -new Date(ms).getTimezoneOffset(); }
  }
  // Instant of local midnight (start of the civil day containing ms).
  function midnight(ms, tz) { const p = parts(ms, tz); return fromCivil(p.y, p.m, p.d, tz); }
  // Local civil date parts {y, m (0-11), d, wd} for instant ms.
  function parts(ms, tz) {
    const d = new Date(ms + offsetMin(tz, ms) * 60000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() };
  }
  // Instant of local wall-clock time y-m-d hh:mm (default midnight). Where clocks change at that time, the first
  // instant of the civil day is returned (e.g. 01:00 when midnight is skipped, the first 00:00 when it repeats).
  function fromCivil(y, m, d, tz, hh = 0, mm = 0) {
    const guess = Date.UTC(y, m, d, hh, mm);
    let ms = guess - offsetMin(tz, guess) * 60000;
    ms = guess - offsetMin(tz, ms) * 60000;
    if (hh || mm) return ms;
    const want = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
    if (key(ms, tz) !== want) ms += 3600e3;
    else if (key(ms - 3600e3, tz) === want && parts(ms - 3600e3, tz).d === parts(ms, tz).d && wall(ms - 3600e3, tz) === 0) ms -= 3600e3;
    return ms;
  }
  const wall = (ms, tz) => { const off = offsetMin(tz, ms) * 60000; return ((ms + off) % DAY + DAY) % DAY; };
  // Same local clock time `days` later (DST safe).
  function addDays(ms, days, tz) {
    const p = parts(ms, tz), off = offsetMin(tz, ms) * 60000;
    const tod = ms + off - Date.UTC(p.y, p.m, p.d);
    return fromCivil(p.y, p.m, p.d + days, tz) + tod;
  }
  const key = (ms, tz) => { const p = parts(ms, tz); return `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };
  return { DAY, offsetMin, midnight, parts, fromCivil, addDays, key };
})();
