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
    constellation(c) {
      const v = V.constellations[c.id];
      if (vedic() && v) return hi() ? v[1] : v[0];
      return c.en;
    },
    constellationAlt(c) {
      const v = V.constellations[c.id];
      if (!v) return c.la || '';
      return vedic() ? `${c.en} · ${c.la || c.id}` : (hi() ? v[1] : v[0]);
    },
    // Star label: Jyotish name when the culture is vedic and one exists, else the proper name.
    star(vn, proper) {
      if (vn && (vedic() || !proper)) return hi() ? vn.hi : vn.en;
      return proper || null;
    },
    direction(k, short) {
      if (vedic()) return hi() ? V.directions[k].hi : V.directions[k].en;
      return short ? V.directionsShort[k] : (hi() ? V.directions[k].hi : V.westDirections[k]);
    },
  };
})();
