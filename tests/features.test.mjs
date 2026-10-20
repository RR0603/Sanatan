// Today timings, the festival calendar and Kundali Milan, checked against an independent Jyotish engine
// (KundaliMCP) and published 2026 festival dates.
import { load, check, done } from './helpers.mjs';

const ctx = load('js/vendor/astronomy.browser.min.js', 'js/vedic.js', 'js/sky.js', 'js/tz.js', 'js/jyotish.js',
  'js/muhurta.js', 'js/calendar.js', 'js/milan.js');
const A = ctx.Astronomy, LS = ctx.LS, TZ = LS.TZ;
const IST = 'Asia/Kolkata';
const hm = (ms) => new Date(ms + 330 * 60000).toISOString().slice(11, 19);
const near = (ms, ref, sec = 90) => Math.abs(Date.parse(`${new Date(ms + 330 * 60000).toISOString().slice(0, 11)}${ref}Z`) - (ms + 330 * 60000)) <= sec * 1000;

// Ujjain, Monday 19 Oct 2026 (reference: KundaliMCP panchang with windows)
{
  const d = LS.Muhurta.day(new A.Observer(23.1765, 75.7885, 0), TZ.fromCivil(2026, 9, 19, IST));
  check('vara is Somavara', d.vara === 1);
  check('sunrise 06:25:24', near(d.sunrise, '06:25:24', 30), hm(d.sunrise));
  check('sunset 17:58:02', near(d.sunset, '17:58:02', 30), hm(d.sunset));
  check('moonrise 13:39:11', near(d.moonrise, '13:39:11', 60), hm(d.moonrise));
  check('Rahu Kaal 07:51:59–09:18:34', near(d.rahu[0], '07:51:59', 30) && near(d.rahu[1], '09:18:34', 30), `${hm(d.rahu[0])}–${hm(d.rahu[1])}`);
  check('Yamaganda 10:45:08–12:11:43', near(d.yama[0], '10:45:08', 30) && near(d.yama[1], '12:11:43', 30));
  check('Gulika 13:38:18–15:04:53', near(d.gulika[0], '13:38:18', 30) && near(d.gulika[1], '15:04:53', 30));
  check('Abhijit 11:48:38–12:34:48', near(d.abhijit[0], '11:48:38', 30) && near(d.abhijit[1], '12:34:48', 30));
  check('Brahma muhurta 04:45:52–05:35:38', near(d.brahma[0], '04:45:52', 30) && near(d.brahma[1], '05:35:38', 30), `${hm(d.brahma[0])}–${hm(d.brahma[1])}`);
  const day = d.choghadiya.filter((c) => !c.night).map((c) => c.id).join(',');
  check('day Choghadiya sequence', day === 'amrit,kaal,shubh,rog,udveg,char,labh,amrit', day);
}

// Festival calendar, New Delhi 2026
{
  const obs = new A.Observer(28.6139, 77.209, 0);
  const ev = [];
  for (let m = 0; m < 12; m++) ev.push(...LS.Calendar.month(obs, IST, 2026, m).events);
  const on = (id) => ev.filter((e) => e.id === id).map((e) => e.key).join(',');
  const expect = {
    ugadi: ['navvarsha', '2026-03-19'], ramnavami: ['ramnavami', '2026-03-26'], hanuman: ['hanuman', '2026-04-02'],
    gurupurnima: ['gurupurnima', '2026-07-29'], rakhi: ['rakhi', '2026-08-28'], janmashtami: ['janmashtami', '2026-09-04'],
    ganesh: ['ganesh', '2026-09-14'], navratri: ['navratri', '2026-10-11'], dussehra: ['dussehra', '2026-10-20'],
    karvachauth: ['karvachauth', '2026-10-29'], dhanteras: ['dhanteras', '2026-11-06'], diwali: ['diwali', '2026-11-08'],
    mahashivaratri: ['mahashivaratri', '2026-02-15'], holika: ['holika', '2026-03-02'], govardhan: ['govardhan', '2026-11-10'], holi: ['holi', '2026-03-04'], vasant: ['vasantpanchami', '2026-01-23'],
  };
  for (const [name, [id, date]] of Object.entries(expect)) check(`${name} on ${date}`, on(id) === date, on(id));
  const ek = ev.filter((e) => e.kind === 'ekadashi');
  check('24 Ekadashis in calendar 2026, about 15 days apart', ek.length === 24 && ek.every((e, i) => i === 0 || Math.abs((e.day - ek[i - 1].day) / 86400e3 - 14.8) < 2), String(ek.length));
  check('Padmini/Parama Ekadashi in the adhika month', ek.some((e) => e.name.en.startsWith('Padmini')) && ek.some((e) => e.name.en.startsWith('Parama')));
  check('no duplicate Ekadashi names within 3 days', ek.every((e, i) => i === 0 || e.day - ek[i - 1].day > 3 * 86400e3));
  check('Makar Sankranti on 14 Jan', ev.some((e) => e.id === 'sankranti-9' && e.key === '2026-01-14'));
  check('total lunar eclipse 3 Mar 2026 visible from Delhi', ev.some((e) => e.kind === 'eclipse' && e.key === '2026-03-03' && e.type === 'total' && e.visible));
}

// Kundali Milan (reference: KundaliMCP kundali_milan, Parashari)
{
  const chart = (y, mo, d, h, mi, lat, lon) => LS.Jyotish.chart(A.MakeTime(new Date(TZ.fromCivil(y, mo - 1, d, IST) + (h * 60 + mi) * 60000)), new A.Observer(lat, lon, 0));
  const pairs = [
    [[1990, 6, 15, 6, 30, 28.6139, 77.209], [1992, 3, 10, 14, 0, 19.076, 72.8777], 30.5, '0,1,1.5,2,5,6,7,8'],
    [[1996, 7, 7, 23, 30, 23.0225, 72.5714], [1995, 1, 20, 10, 0, 26.8467, 80.9462], 23.5, '1,1,1.5,2,5,5,0,8'],
    [[1988, 11, 2, 21, 15, 22.5726, 88.3639], [1991, 8, 24, 5, 40, 12.9716, 77.5946], 6.5, '1,1,1.5,2,0,1,0,0'],
  ];
  for (const [g, b, total, parts] of pairs) {
    const r = LS.Milan.match(chart(...g), chart(...b));
    const got = r.kootas.map((k) => k.score).join(',');
    check(`Milan ${total}/36`, r.total === total && got === parts, `${r.total} · ${got}`);
  }
}
// Western (tropical) vs Vedic (sidereal) zodiac: on 25 Mar 2026 the Sun is in tropical Aries but sidereal Meena.
{
  const time = A.MakeTime(new Date(Date.UTC(2026, 2, 25, 6, 0))), obs = new A.Observer(28.6, 77.2, 0);
  const g = LS.Sky.grahas(time, obs, LS.Sky.frames(time, obs)).surya;
  const ay = LS.Sky.ayanamsa(time);
  check('Lahiri ayanamsa ≈ 24.2° in 2026', Math.abs(ay - 24.21) < 0.05, ay.toFixed(3));
  check('Sun 25 Mar 2026: tropical Aries, sidereal Meena', Math.floor(g.tropLon / 30) === 0 && Math.floor(g.sidLon / 30) === 11, `${g.tropLon.toFixed(2)} / ${g.sidLon.toFixed(2)}`);
}

// Edge cases found in review: Sankranti just before a range, polar days, DST days, midnight clock changes
{
  const delhi = new A.Observer(28.6139, 77.209, 0);
  const r = LS.Calendar.range(delhi, IST, TZ.fromCivil(2027, 0, 15, IST), 5);
  check('Makar Sankranti 2027 (Sun enters after sunset on the 14th) is on 15 Jan', r.events.some((e) => e.id === 'sankranti-9' && e.key === '2027-01-15'));
  const tromso = new A.Observer(69.65, 18.96, 0);
  const m = LS.Calendar.month(tromso, 'Europe/Oslo', 2026, 10);
  const lo = TZ.fromCivil(2026, 9, 25, 'Europe/Oslo'), hi = TZ.fromCivil(2026, 11, 5, 'Europe/Oslo');
  check('Tromsø before the polar night: every observance time is inside the month', m.events.every((e) => e.at > lo && e.at < hi), m.events.filter((e) => !(e.at > lo && e.at < hi)).map((e) => e.id).join(','));
  const NY = 'America/New_York', ny = new A.Observer(40.7128, -74.006, 0);
  const d0 = TZ.fromCivil(2026, 2, 8, NY), d1 = TZ.fromCivil(2026, 2, 9, NY);
  const mu = LS.Muhurta.day(ny, d0, { dayEnd: d1, weekday: 0 });
  check('New York, 8 Mar 2026 (23-hour day): moonrise belongs to that day', mu.moonrise == null || (mu.moonrise >= d0 && mu.moonrise < d1));
  check('6:00 on the DST day is 6:00 local', new Date(TZ.fromCivil(2026, 2, 8, NY, 6, 0)).toISOString() === '2026-03-08T10:00:00.000Z' && new Date(TZ.fromCivil(2026, 10, 1, NY, 6, 0)).toISOString() === '2026-11-01T11:00:00.000Z');
  check('Santiago: the day the clocks skip midnight starts at 01:00', new Date(TZ.fromCivil(2026, 8, 6, 'America/Santiago')).toISOString() === '2026-09-06T04:00:00.000Z');
}
done();
