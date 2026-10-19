// Kundali Milan: Ashtakoota (36 guna) matching from the Moon of two charts, plus a Mangal dosha check.
window.LS = window.LS || {};

LS.Milan = (function () {
  const J = LS.Jyotish, V = LS.VEDIC;
  const NAK = 360 / 27;
  // Varna by rashi: 3 Brahmin (water), 2 Kshatriya (fire), 1 Vaishya (earth), 0 Shudra (air).
  const VARNA = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3];
  // Vashya groups: 0 chatushpada, 1 manava, 2 jalachara, 3 vanachara, 4 keeta.
  function vashya(lon) {
    const r = Math.floor(lon / 30), half = lon % 30 < 15 ? 0 : 1;
    if (r === 8) return half ? 0 : 1;       // Dhanu: first half human, second quadruped
    if (r === 9) return half ? 2 : 0;       // Makara: first half quadruped, second aquatic
    return [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2][r];
  }
  const VASHYA = [ // groom row, bride column
    [2, 1, 1, 0.5, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [0.5, 0, 1, 2, 0],
    [1, 1, 1, 0, 2],
  ];
  // Yoni animal of each nakshatra and the yoni compatibility matrix.
  const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
  const YONI = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
  ];
  const GANA = { deva: 0, manushya: 1, rakshasa: 2 };
  const GANA_PTS = [ // symmetric: same 6, Deva-Manushya 5, Deva-Rakshasa 1, Manushya-Rakshasa 0
    [6, 5, 1],
    [5, 6, 0],
    [1, 0, 6],
  ];
  // Nadi: 0 Adi, 1 Madhya, 2 Antya.
  const NADI = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
  const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12];

  function maitri(a, b) {
    if (a === b) return 5;
    const r1 = J.relation(a, b), r2 = J.relation(b, a);
    const k = [r1, r2].sort().join('-');
    return { 'friend-friend': 5, 'friend-neutral': 4, 'neutral-neutral': 3, 'enemy-friend': 1, 'enemy-neutral': 0.5, 'enemy-enemy': 0 }[k];
  }
  function taraOk(from, to) { const n = ((to - from + 27) % 27) + 1; return ![3, 5, 7].includes(n % 9); }

  function mangal(chart) {
    const ma = chart.byId.mangala, moonR = chart.byId.chandra.rashi;
    const fromMoon = ((ma.rashi - moonR + 12) % 12) + 1;
    const lagna = MANGAL_HOUSES.includes(ma.house), moon = MANGAL_HOUSES.includes(fromMoon);
    // Mangala in its own sign or exaltation is held not to cause the dosha.
    const strong = ma.dignity === 'own' || ma.dignity === 'exalted';
    return { lagna, moon, present: lagna || moon, strong, house: ma.house, fromMoon };
  }

  // groom, bride: LS.Jyotish.chart() results.
  function match(groom, bride) {
    const gm = groom.byId.chandra, bm = bride.byId.chandra;
    const gN = Math.floor(gm.lon / NAK), bN = Math.floor(bm.lon / NAK);
    const gR = gm.rashi, bR = bm.rashi;
    const lordG = J.lordOf(gR), lordB = J.lordOf(bR);
    const gGana = GANA[V.nakshatras[gN].gana], bGana = GANA[V.nakshatras[bN].gana];
    const dist = ((gR - bR + 12) % 12) + 1;
    const kootas = [
      { key: 'varna', max: 1, score: VARNA[gR] >= VARNA[bR] ? 1 : 0, g: VARNA[gR], b: VARNA[bR] },
      { key: 'vashya', max: 2, score: VASHYA[vashya(gm.lon)][vashya(bm.lon)], g: vashya(gm.lon), b: vashya(bm.lon) },
      { key: 'tara', max: 3, score: (taraOk(bN, gN) ? 1.5 : 0) + (taraOk(gN, bN) ? 1.5 : 0) },
      { key: 'yoni', max: 4, score: YONI[YONI_OF[gN]][YONI_OF[bN]], g: YONI_OF[gN], b: YONI_OF[bN] },
      { key: 'maitri', max: 5, score: maitri(lordG, lordB), g: lordG, b: lordB },
      { key: 'gana', max: 6, score: GANA_PTS[gGana][bGana], g: gGana, b: bGana },
      { key: 'bhakoot', max: 7, score: [2, 12, 6, 8, 5, 9].includes(dist) ? 0 : 7, g: gR, b: bR },
      { key: 'nadi', max: 8, score: NADI[gN] === NADI[bN] ? 0 : 8, g: NADI[gN], b: NADI[bN] },
    ];
    const total = kootas.reduce((s, k) => s + k.score, 0);
    const mg = mangal(groom), mb = mangal(bride);
    const friends = lordG === lordB || (J.relation(lordG, lordB) === 'friend' && J.relation(lordB, lordG) === 'friend');
    const notes = [];
    if (kootas[6].score === 0 && (friends || kootas[7].score === 8)) notes.push('bhakootCancelled');
    if (kootas[7].score === 0 && ((gR === bR && gN !== bN) || (gN === bN && gR !== bR))) notes.push('nadiCancelled');
    if (mg.present && mb.present) notes.push('mangalMutual');
    return {
      kootas, total, max: 36, notes,
      band: total >= 32 ? 'excellent' : total >= 25 ? 'good' : total >= 18 ? 'average' : 'low',
      groom: { nak: gN, rashi: gR, mangal: mg }, bride: { nak: bN, rashi: bR, mangal: mb },
    };
  }
  const VASHYA_NAMES = ['chatushpada', 'manava', 'jalachara', 'vanachara', 'keeta'];
  const YONI_NAMES = ['horse', 'elephant', 'sheep', 'serpent', 'dog', 'cat', 'rat', 'cow', 'buffalo', 'tiger', 'deer', 'monkey', 'mongoose', 'lion'];
  return { match, mangal, VASHYA_NAMES, YONI_NAMES };
})();
