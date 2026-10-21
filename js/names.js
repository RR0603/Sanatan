// Naming culture, independent of interface language: 'vedic' (Jyotish names) or 'western'.
window.LS = window.LS || {};

LS.Names = (function () {
  const V = LS.VEDIC, I = LS.I18N;
  let culture = 'vedic';
  const hi = () => I.lang === 'hi';
  const vedic = () => culture === 'vedic';

  return {
    get culture() { return culture; },
    set(c) { culture = c === 'western' ? 'western' : 'vedic'; },
    isVedic: vedic,
    graha(id) {
      const g = V.grahas[id];
      if (vedic()) return hi() ? g.hi : g.en;
      return hi() ? V.westHi[id] : (id === 'rahu' ? 'North Node' : id === 'ketu' ? 'South Node' : g.west);
    },
    // The other culture's name, for subtitles.
    grahaAlt(id) {
      const g = V.grahas[id];
      return vedic() ? (hi() ? g.en : g.west) : (hi() ? g.en : `${g.en} · ${g.hi}`);
    },
    abbr(id) { const a = V.abbr[id]; return hi() ? a[2] : vedic() ? a[0] : a[1]; },
    rashi(k) { const r = V.rashis[k]; return hi() ? r.hi : vedic() ? r.en : r.west; },
    rashiAlt(k) { const r = V.rashis[k]; return vedic() ? (hi() ? r.en : r.west) : `${r.en} · ${r.hi}`; },
    nakshatra(k) { const n = V.nakshatras[k]; return hi() ? n.hi : n.en; },
    // Western: the official IAU (Latin) name, as Stellarium shows it; the English meaning goes in the subtitle.
    constellation(c) {
      const v = V.constellations[c.id];
      if (vedic() && v) return hi() ? v[1] : v[0];
      return c.la || c.en;
    },
    constellationAlt(c) {
      const v = V.constellations[c.id];
      if (vedic()) return `${c.en} · ${c.la || c.id}`;
      const meaning = c.en && c.en !== c.la ? c.en : '';
      return [meaning, v ? (hi() ? v[1] : v[0]) : ''].filter(Boolean).join(' · ');
    },
    // Star label. Vedic: the Jyotish name when there is one, else the IAU proper name.
    // Western: only the IAU (WGSN) proper name, as in Stellarium's modern sky culture.
    star(vn, proper) {
      if (vn && vedic()) return hi() ? vn.hi : vn.en;
      return proper || null;
    },
    direction(k, short) {
      if (vedic()) return hi() ? V.directions[k].hi : V.directions[k].en;
      return short ? V.directionsShort[k] : (hi() ? V.directions[k].hi : V.westDirections[k]);
    },
  };
})();
