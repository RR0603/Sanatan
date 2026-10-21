// Ulka: the major annual meteor showers (IMO working list): activity window, peak, radiant (J2000) and ZHR.
window.LS = window.LS || {};

LS.Ulka = (function () {
  const T = (en, hi) => ({ en, hi });
  // [id, name, start [month, day], peak, end, RA°, Dec°, ZHR, IAU constellation, parent body]
  const SHOWERS = [
    ['qua', T('Quadrantids', 'क्वाड्रन्टिड्स'), [12, 28], [1, 3], [1, 12], 230, 49, 110, 'Boo', '2003 EH1'],
    ['lyr', T('Lyrids', 'लाइरिड्स'), [4, 14], [4, 22], [4, 30], 271, 34, 18, 'Lyr', 'C/1861 G1 Thatcher'],
    ['eta', T('Eta Aquariids', 'ईटा एक्वेरिड्स'), [4, 19], [5, 6], [5, 28], 338, -1, 50, 'Aqr', '1P/Halley'],
    ['sda', T('Delta Aquariids', 'डेल्टा एक्वेरिड्स'), [7, 12], [7, 30], [8, 23], 340, -16, 25, 'Aqr', '96P/Machholz'],
    ['per', T('Perseids', 'पर्सिड्स'), [7, 17], [8, 12], [8, 24], 48, 58, 100, 'Per', '109P/Swift–Tuttle'],
    ['dra', T('Draconids', 'ड्रैकोनिड्स'), [10, 6], [10, 8], [10, 10], 262, 54, 10, 'Dra', '21P/Giacobini–Zinner'],
    ['ori', T('Orionids', 'ओरियोनिड्स'), [10, 2], [10, 21], [11, 7], 95, 16, 20, 'Ori', '1P/Halley'],
    ['leo', T('Leonids', 'लियोनिड्स'), [11, 6], [11, 17], [11, 30], 152, 22, 15, 'Leo', '55P/Tempel–Tuttle'],
    ['gem', T('Geminids', 'जेमिनिड्स'), [12, 4], [12, 14], [12, 20], 112, 33, 150, 'Gem', '3200 Phaethon'],
    ['urs', T('Ursids', 'उर्सिड्स'), [12, 17], [12, 22], [12, 26], 217, 76, 10, 'UMi', '8P/Tuttle'],
  ].map(([id, name, start, peak, end, ra, dec, zhr, con, parent]) => ({ id, name, start, peak, end, ra, dec, zhr, con, parent }));

  const DAY = 86400000;
  // Day of the year-cycle (month/day) as a number that wraps across New Year.
  function inWindow(s, d) {
    const md = (x) => x[0] * 100 + x[1];
    const a = md(s.start), b = md(s.end), c = d.getUTCMonth() * 100 + 100 + d.getUTCDate();
    return a <= b ? c >= a && c <= b : c >= a || c <= b;
  }
  function peakDate(s, ref) {
    const y = ref.getUTCFullYear();
    let best = null;
    for (const yy of [y - 1, y, y + 1]) {
      const t = Date.UTC(yy, s.peak[0] - 1, s.peak[1], 12);
      if (!best || Math.abs(t - ref.getTime()) < Math.abs(best - ref.getTime())) best = t;
    }
    return best;
  }
  // Showers active at time ms, strongest first; each with days from peak and an activity factor (1 at peak).
  function active(ms) {
    const d = new Date(ms);
    return SHOWERS.filter((s) => inWindow(s, d)).map((s) => {
      const days = (ms - peakDate(s, d)) / DAY;
      const width = s.zhr > 60 ? 2.2 : 4;
      return { ...s, days, factor: Math.max(0.08, Math.exp(-(days * days) / (2 * width * width))) };
    }).sort((a, b) => b.zhr * b.factor - a.zhr * a.factor);
  }
  // The next peak after ms (for "coming up").
  function next(ms) {
    const d = new Date(ms);
    return SHOWERS.map((s) => {
      let t = peakDate(s, d);
      if (t < ms - DAY) t = Date.UTC(d.getUTCFullYear() + 1, s.peak[0] - 1, s.peak[1], 12);
      return { ...s, peakMs: t };
    }).filter((s) => s.peakMs >= ms - DAY).sort((a, b) => a.peakMs - b.peakMs)[0];
  }
  const radiantVec = (s) => LS.Sky.radec2vec(s.ra, s.dec);
  return { SHOWERS, active, next, radiantVec };
})();
