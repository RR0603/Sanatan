// Jyotish chart engine: whole-sign bhavas, dignity, combustion, drishti, navamsa and Vimshottari dasha.
window.LS = window.LS || {};

LS.Jyotish = (function () {
  const A = window.Astronomy, Sky = LS.Sky, V = LS.VEDIC;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const NAK = 360 / 27;
  const NAVA = ['surya', 'chandra', 'mangala', 'budha', 'guru', 'shukra', 'shani', 'rahu', 'ketu'];

  // Naisargika (natural) relationships, BPHS.
  const FRIENDS = {
    surya: ['chandra', 'mangala', 'guru'], chandra: ['surya', 'budha'], mangala: ['surya', 'chandra', 'guru'],
    budha: ['surya', 'shukra'], guru: ['surya', 'chandra', 'mangala'], shukra: ['budha', 'shani'], shani: ['budha', 'shukra'],
    rahu: ['budha', 'shukra', 'shani'], ketu: ['budha', 'shukra', 'shani'],
  };
  const ENEMIES = {
    surya: ['shukra', 'shani'], chandra: [], mangala: ['budha'], budha: ['chandra'], guru: ['budha', 'shukra'],
    shukra: ['surya', 'chandra'], shani: ['surya', 'chandra', 'mangala'], rahu: ['surya', 'chandra', 'mangala'], ketu: ['surya', 'chandra', 'mangala'],
  };
  const COMBUST = { chandra: [12, 12], mangala: [17, 17], budha: [14, 12], guru: [11, 11], shukra: [10, 8], shani: [15, 15] };
  // Special drishti in houses counted from the graha (the 7th is universal).
  const DRISHTI = { mangala: [4, 7, 8], guru: [5, 7, 9], shani: [3, 7, 10] };

  const DASHA_ORDER = ['ketu', 'shukra', 'surya', 'chandra', 'mangala', 'rahu', 'guru', 'shani', 'budha'];
  const DASHA_YEARS = { ketu: 7, shukra: 20, surya: 6, chandra: 10, mangala: 7, rahu: 18, guru: 16, shani: 19, budha: 17 };
  const YEAR_MS = 365.25 * 86400e3;

  const norm = Sky.norm360;
  const lordOf = (rashi) => ['mangala', 'shukra', 'budha', 'chandra', 'surya', 'budha', 'shukra', 'mangala', 'guru', 'shani', 'shani', 'guru'][rashi];

  function dignity(id, rashi) {
    const g = V.grahas[id];
    if (g.exalt === rashi) return 'exalted';
    if (g.debil === rashi) return 'debilitated';
    if (g.rules && g.rules.includes(rashi)) return 'own';
    const lord = lordOf(rashi);
    if (!FRIENDS[id]) return 'neutral';
    if (FRIENDS[id].includes(lord)) return 'friend';
    if (ENEMIES[id].includes(lord)) return 'enemy';
    return 'neutral';
  }

  const navamsa = (lon) => Math.floor(norm(lon) / (30 / 9)) % 12;

  // Sidereal midheaven (10th cusp).
  function midheaven(time, observer) {
    const ramc = norm((A.SiderealTime(time) + observer.longitude / 15) * 15) * D2R;
    const eps = A.e_tilt(time).tobl * D2R;
    return norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * R2D - Sky.ayanamsa(time));
  }

  function chart(time, observer) {
    const fr = Sky.frames(time, observer);
    const gp = Sky.grahas(time, observer, fr);
    for (const id in gp) if (gp[id].eqj) gp[id].enu = Sky.apply(fr.eqj2enu, gp[id].eqj[0], gp[id].eqj[1], gp[id].eqj[2]);
    const lagna = Sky.lagna(time, observer);
    const lagnaRashi = Math.floor(lagna / 30);
    const sun = gp.surya.sidLon;
    const grahas = NAVA.map((id) => {
      const p = gp[id], lon = p.sidLon, rashi = Math.floor(lon / 30), nak = Math.floor(lon / NAK);
      const dist = Math.abs(((lon - sun + 540) % 360) - 180);
      const cb = COMBUST[id];
      return {
        id, lon, rashi, deg: lon % 30, nak, pada: Math.floor((lon - nak * NAK) / (NAK / 4)) + 1,
        nakLord: DASHA_ORDER[nak % 9], house: ((rashi - lagnaRashi + 12) % 12) + 1,
        retro: id === 'rahu' || id === 'ketu' ? true : !!p.retro,
        combust: !!cb && dist < cb[p.retro ? 1 : 0],
        dignity: dignity(id, rashi), navamsa: navamsa(lon), enu: p.enu,
      };
    });
    const houses = [];
    for (let h = 1; h <= 12; h++) {
      const rashi = (lagnaRashi + h - 1) % 12;
      houses.push({ n: h, rashi, lord: lordOf(rashi), occupants: grahas.filter((g) => g.house === h).map((g) => g.id) });
    }
    const lnak = Math.floor(lagna / NAK);
    return {
      ms: time.date.getTime(), lagna, lagnaRashi, lagnaNak: lnak, lagnaPada: Math.floor((lagna - lnak * NAK) / (NAK / 4)) + 1,
      navamsaLagna: navamsa(lagna), mc: midheaven(time, observer), grahas, houses,
      byId: Object.fromEntries(grahas.map((g) => [g.id, g])), sunAlt: Math.asin(gp.surya.enu[2]) * R2D,
    };
  }

  // Houses a graha aspects (whole-sign), from its own house.
  function aspects(id, house) {
    return (DRISHTI[id] || [7]).map((k) => ((house - 1 + k - 1) % 12) + 1);
  }

  function vimshottari(moonLon, birthMs) {
    const nak = Math.floor(moonLon / NAK);
    const frac = (moonLon - nak * NAK) / NAK;
    const first = nak % 9;
    const lord0 = DASHA_ORDER[first];
    let start = birthMs - frac * DASHA_YEARS[lord0] * YEAR_MS;
    const mds = [];
    for (let k = 0; k < 9; k++) {
      const lord = DASHA_ORDER[(first + k) % 9], len = DASHA_YEARS[lord] * YEAR_MS;
      mds.push({ lord, start, end: start + len, years: DASHA_YEARS[lord] });
      start += len;
    }
    return { nak, lord: lord0, balanceYears: (1 - frac) * DASHA_YEARS[lord0], mds, birthMs };
  }
  function antardashas(md) {
    const i0 = DASHA_ORDER.indexOf(md.lord);
    let s = md.start;
    const out = [];
    for (let k = 0; k < 9; k++) {
      const lord = DASHA_ORDER[(i0 + k) % 9], len = md.years * DASHA_YEARS[lord] / 120 * YEAR_MS;
      out.push({ lord, start: s, end: s + len });
      s += len;
    }
    return out;
  }

  return { chart, dignity, aspects, vimshottari, antardashas, navamsa, midheaven, lordOf, NAVA, DASHA_YEARS };
})();
