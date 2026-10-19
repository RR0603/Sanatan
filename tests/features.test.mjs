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
    gurupurnima: ['gurupurnima', '2026-07-29'], rakhi: ['rakhi', '2026-08-28'], janmashtami: ['janmashtami', '2026-09-03'],
    ganesh: ['ganesh', '2026-09-14'], navratri: ['navratri', '2026-10-11'], dussehra: ['dussehra', '2026-10-20'],
    karvachauth: ['karvachauth', '2026-10-29'], dhanteras: ['dhanteras', '2026-11-06'], diwali: ['diwali', '2026-11-08'],
    mahashivaratri: ['mahashivaratri', '2026-02-15'], holi: ['holi', '2026-03-04'], vasant: ['vasantpanchami', '2026-01-23'],
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
done();
