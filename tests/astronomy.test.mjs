// Panchang and birth chart against an independent Jyotish engine (KundaliMCP), see README "Accuracy".
import { load, check, done } from './helpers.mjs';
const w = load('js/vendor/astronomy.browser.min.js', 'js/vedic.js', 'js/sky.js', 'js/jyotish.js');
const A = w.Astronomy, V = w.LS.VEDIC, Sky = w.LS.Sky, J = w.LS.Jyotish;

// Panchang: Ujjain, 18 Oct 2026 12:00 IST
{
  const t = A.MakeTime(new Date('2026-10-18T06:30:00Z'));
  const p = Sky.panchang(t, new A.Observer(23.1765, 75.7885, 0));
  const ist = (x) => new Date(x.date.getTime() + 330 * 60e3).toISOString().slice(0, 16);
  check('tithi is Shukla Ashtami', p.tithi === 7);
  check('tithi ends 19 Oct ~10:52 IST', Math.abs(p.tithiEnd.date - Date.parse('2026-10-19T05:22:15Z')) < 3 * 60e3, ist(p.tithiEnd));
  check('nakshatra Purva Ashadha pada 4', V.nakshatras[p.nakshatra].en === 'Purva Ashadha' && p.pada === 4);
  check('nakshatra ends 18 Oct ~12:48 IST', Math.abs(p.nakshatraEnd.date - Date.parse('2026-10-18T07:18:50Z')) < 3 * 60e3, ist(p.nakshatraEnd));
  check('yoga Sukarma, karana Vishti, Ravivara', V.yogas[p.yoga].en === 'Sukarma' && p.karana.en.startsWith('Vishti') && p.vara === 0);
  check('Ashvin masa, Vikram 2083, Shaka 1948', V.months[p.month].en === 'Ashvin' && p.vikram === 2083 && p.shaka === 1948);
}

// Birth chart: New Delhi, 15 Jun 1990 06:30 IST
{
  const c = J.chart(A.MakeTime(new Date('1990-06-15T01:00:00Z')), new A.Observer(28.6139, 77.209, 0));
  const R = (k) => V.rashis[k].en;
  check('lagna Mithuna, Ardra pada 3', R(c.lagnaRashi) === 'Mithuna' && V.nakshatras[c.lagnaNak].en === 'Ardra' && c.lagnaPada === 3);
  check('navamsa lagna Kumbha', R(c.navamsaLagna) === 'Kumbha');
  const expect = {
    surya: ['Vrishabha', 'Mrigashira', 2, 12, 'enemy', 'Kanya'], chandra: ['Kumbha', 'Shatabhisha', 3, 9, 'neutral', 'Kumbha'],
    mangala: ['Meena', 'Revati', 1, 10, 'friend', 'Dhanu'], budha: ['Vrishabha', 'Rohini', 1, 12, 'friend', 'Mesha'],
    guru: ['Mithuna', 'Punarvasu', 1, 1, 'enemy', 'Mesha'], shukra: ['Mesha', 'Bharani', 4, 11, 'neutral', 'Vrishchika'],
    shani: ['Makara', 'Uttara Ashadha', 2, 8, 'own', 'Makara'], rahu: ['Makara', 'Shravana', 2, 8, 'friend', 'Vrishabha'],
    ketu: ['Karka', 'Pushya', 4, 2, 'enemy', 'Vrishchika'],
  };
  for (const [id, [rashi, nak, pada, house, dig, d9]] of Object.entries(expect)) {
    const g = c.byId[id];
    check(`${id}: ${rashi}, ${nak} ${pada}, bhava ${house}, ${dig}, D9 ${d9}`,
      R(g.rashi) === rashi && V.nakshatras[g.nak].en === nak && g.pada === pada && g.house === house && g.dignity === dig && R(g.navamsa) === d9);
  }
  check('Shani vakri', c.byId.shani.retro === true);
  const d = J.vimshottari(c.byId.chandra.lon, c.ms);
  const shani = d.mds.find((m) => m.lord === 'shani');
  check('Shani mahadasha 2012-06-18 → 2031-06-19', Math.abs(shani.start - Date.parse('2012-06-18T18:08:39Z')) < 12 * 3600e3 && Math.abs(shani.end - Date.parse('2031-06-19T12:08:39Z')) < 12 * 3600e3);
  const ad = J.antardashas(shani).find((a) => a.lord === 'rahu');
  check('Shani/Rahu antardasha ends 2028-12-06', new Date(ad.end).toISOString().startsWith('2028-12-06'));
}
done();
