// Festival & vrat calendar: Ekadashi, Purnima, Amavasya, Pradosh, Chaturthi, Shivaratri, major festivals,
// Sankranti and eclipses for any place, computed on the device.
// Festivals follow the amanta lunar month and the tithi that prevails at the time each observance is
// kept (sunrise, midday, afternoon, evening (pradosh), midnight (nishita) or moonrise).
window.LS = window.LS || {};

LS.Calendar = (function () {
  const A = window.Astronomy, Sky = LS.Sky, TZ = LS.TZ;
  const T = (en, hi) => ({ en, hi });
  const DAY = 86400000;

  // [id, amanta month (0 = Chaitra), tithi (0-29), time rule, name]
  const FESTIVALS = [
    ['navvarsha', 0, 0, 'sunrise', T('Chaitra Navratri · Gudi Padwa · Ugadi', 'चैत्र नवरात्रि · गुड़ी पड़वा · उगादि')],
    ['ramnavami', 0, 8, 'madhyahna', T('Rama Navami', 'राम नवमी')],
    ['hanuman', 0, 14, 'sunrise', T('Hanuman Jayanti', 'हनुमान जयन्ती')],
    ['akshaya', 1, 2, 'sunrise', T('Akshaya Tritiya', 'अक्षय तृतीया')],
    ['buddha', 1, 14, 'sunrise', T('Buddha Purnima', 'बुद्ध पूर्णिमा')],
    ['rathyatra', 3, 1, 'sunrise', T('Jagannath Rath Yatra', 'जगन्नाथ रथयात्रा')],
    ['gurupurnima', 3, 14, 'sunrise', T('Guru Purnima', 'गुरु पूर्णिमा')],
    ['nagpanchami', 4, 4, 'sunrise', T('Nag Panchami', 'नाग पंचमी')],
    ['rakhi', 4, 14, 'aparahna', T('Raksha Bandhan', 'रक्षा बन्धन')],
    ['janmashtami', 4, 22, 'nishita', T('Krishna Janmashtami', 'कृष्ण जन्माष्टमी')],
    ['teej', 5, 2, 'sunrise', T('Hartalika Teej', 'हरतालिका तीज')],
    ['ganesh', 5, 3, 'madhyahna', T('Ganesh Chaturthi', 'गणेश चतुर्थी')],
    ['anant', 5, 13, 'sunrise', T('Anant Chaturdashi', 'अनन्त चतुर्दशी')],
    ['pitrupaksha', 5, 15, 'sunrise', T('Pitru Paksha begins', 'पितृ पक्ष आरम्भ')],
    ['mahalaya', 5, 29, 'sunrise', T('Sarva Pitru Amavasya · Mahalaya', 'सर्वपितृ अमावस्या · महालया')],
    ['navratri', 6, 0, 'sunrise', T('Sharad Navratri · Ghatasthapana', 'शारदीय नवरात्रि · घटस्थापना')],
    ['durgaashtami', 6, 7, 'sunrise', T('Durga Ashtami', 'दुर्गा अष्टमी')],
    ['mahanavami', 6, 8, 'sunrise', T('Maha Navami', 'महानवमी')],
    ['dussehra', 6, 9, 'aparahna', T('Vijayadashami · Dussehra', 'विजयादशमी · दशहरा')],
    ['sharadpurnima', 6, 14, 'moonrise', T('Sharad Purnima', 'शरद पूर्णिमा')],
    ['karvachauth', 6, 18, 'moonrise', T('Karva Chauth', 'करवा चौथ')],
    ['dhanteras', 6, 27, 'pradosh', T('Dhanteras', 'धनतेरस')],
    ['narakachaturdashi', 6, 28, 'sunrise', T('Naraka Chaturdashi · Choti Diwali', 'नरक चतुर्दशी · छोटी दीपावली')],
    ['diwali', 6, 29, 'pradosh', T('Diwali · Lakshmi Puja', 'दीपावली · लक्ष्मी पूजा')],
    ['govardhan', 7, 0, 'sunrise', T('Govardhan Puja', 'गोवर्धन पूजा')],
    ['bhaidooj', 7, 1, 'aparahna', T('Bhai Dooj', 'भाई दूज')],
    ['chhath', 7, 5, 'sunrise', T('Chhath Puja', 'छठ पूजा')],
    ['devdeepawali', 7, 14, 'sunrise', T('Kartika Purnima · Dev Deepawali', 'कार्तिक पूर्णिमा · देव दीपावली')],
    ['vasantpanchami', 10, 4, 'sunrise', T('Vasant Panchami · Saraswati Puja', 'वसन्त पंचमी · सरस्वती पूजा')],
    ['mahashivaratri', 10, 28, 'nishita', T('Maha Shivaratri', 'महाशिवरात्रि')],
    ['holika', 11, 14, 'pradosh', T('Holika Dahan', 'होलिका दहन')],
    ['holi', 11, 15, 'sunrise', T('Holi', 'होली')],
  ];
  // Monthly observances: [kind, tithis, time rule]
  const MONTHLY = [
    ['ekadashi', [10, 25], 'sunrise'],
    ['purnima', [14], 'sunrise'],
    ['amavasya', [29], 'sunrise'],
    ['pradosh', [12, 27], 'pradosh'],
    ['sankashti', [18], 'moonrise'],
    ['vinayaka', [3], 'madhyahna'],
    ['shivaratri', [28], 'nishita'],
  ];
  // Ekadashi names by amanta month: [Shukla, Krishna]. The Krishna one carries the purnimanta name.
  const EKADASHI = [
    [T('Kamada', 'कामदा'), T('Varuthini', 'वरूथिनी')], [T('Mohini', 'मोहिनी'), T('Apara', 'अपरा')],
    [T('Nirjala', 'निर्जला'), T('Yogini', 'योगिनी')], [T('Devshayani', 'देवशयनी'), T('Kamika', 'कामिका')],
    [T('Shravana Putrada', 'श्रावण पुत्रदा'), T('Aja', 'अजा')], [T('Parivartini', 'परिवर्तिनी'), T('Indira', 'इन्दिरा')],
    [T('Papankusha', 'पापांकुशा'), T('Rama', 'रमा')], [T('Devutthana', 'देवउठनी'), T('Utpanna', 'उत्पन्ना')],
    [T('Mokshada', 'मोक्षदा'), T('Saphala', 'सफला')], [T('Pausha Putrada', 'पौष पुत्रदा'), T('Shattila', 'षट्तिला')],
    [T('Jaya', 'जया'), T('Vijaya', 'विजया')], [T('Amalaki', 'आमलकी'), T('Papmochani', 'पापमोचनी')],
  ];
  const ADHIKA_EKADASHI = [T('Padmini', 'पद्मिनी'), T('Parama', 'परमा')];
  const PRADOSH = { 1: T('Soma Pradosh', 'सोम प्रदोष'), 2: T('Bhauma Pradosh', 'भौम प्रदोष'), 6: T('Shani Pradosh', 'शनि प्रदोष') };
  const SANKRANTI_SPECIAL = {
    0: T('Mesha Sankranti · Baisakhi · Vishu', 'मेष संक्रान्ति · बैसाखी · विषु'),
    9: T('Makar Sankranti · Pongal · Uttarayan', 'मकर संक्रान्ति · पोंगल · उत्तरायण'),
  };

  const elongAt = (ms) => A.MoonPhase(A.MakeTime(new Date(ms)));
  const tithiAt = (ms) => Math.floor(elongAt(ms) / 12) % 30;
  const ms = (t) => (t ? t.date.getTime() : null);
  function search(body, obs, dir, from, limit) {
    try { return ms(A.SearchRiseSet(body, obs, dir, A.MakeTime(new Date(from)), limit)); } catch (e) { return null; }
  }

  // Lunations overlapping [startMs, endMs]: [{start, end, month, adhika}]
  function lunations(startMs, endMs) {
    const out = [];
    let nm = A.SearchMoonPhase(0, A.MakeTime(new Date(startMs)), -31);
    while (nm && ms(nm) < endMs) {
      const next = A.SearchMoonPhase(0, nm.AddDays(1), 31);
      const r0 = Math.floor(Sky.sidLonOf(A.Body.Sun, nm) / 30);
      const r1 = Math.floor(Sky.sidLonOf(A.Body.Sun, next) / 30);
      out.push({ start: ms(nm), end: ms(next), month: (r0 + 1) % 12, adhika: r0 === r1 });
      nm = next;
    }
    return out;
  }

  // Start and end of the tithi `idx` nearest to `nearMs` (in progress, or starting within ~1.5 days either side).
  function tithiSpan(idx, nearMs) {
    const t = A.MakeTime(new Date(nearMs - 1.6 * DAY));
    const s = A.SearchMoonPhase(idx * 12, t, 4);
    if (!s) return null;
    const e = A.SearchMoonPhase(((idx + 1) * 12) % 360, s, 3);
    return { start: ms(s), end: ms(e) };
  }

  const cache = new Map();
  // Civil days [startMs, startMs + n days) at the observer's place.
  function range(observer, tz, startMs, n) {
    const key = `${observer.latitude.toFixed(3)},${observer.longitude.toFixed(3)},${tz},${startMs},${n}`;
    if (cache.has(key)) return cache.get(key);
    // Two extra days on each side so every observance can see its neighbours.
    const days = [];
    for (let k = -2; k < n + 2; k++) {
      const m0 = k === 0 ? startMs : TZ.addDays(startMs, k, tz);
      const p = TZ.parts(m0 + 3600e3, tz);
      const sunrise = search(A.Body.Sun, observer, +1, m0, 1);
      const sunset = sunrise ? search(A.Body.Sun, observer, -1, sunrise, 1) : null;
      days.push({ ms: m0, key: TZ.key(m0 + 3600e3, tz), y: p.y, m: p.m, d: p.d, wd: p.wd, sunrise, sunset, events: [] });
    }
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      d.next = days[i + 1] ? days[i + 1].sunrise : (d.sunrise ? d.sunrise + DAY : null);
      // Polar day/night: fall back to fixed clock times so the calendar still works.
      if (!d.sunrise || !d.sunset || d.sunset < d.sunrise) { d.sunrise = d.ms + 6 * 3600e3; d.sunset = d.ms + 18 * 3600e3; d.next = d.ms + 30 * 3600e3; d.polar = true; }
      d.tithi = tithiAt(d.sunrise);
      d.nak = Math.floor(Sky.sidLonOf(A.Body.Moon, A.MakeTime(new Date(d.sunrise))) / (360 / 27));
    }
    const luns = lunations(days[0].ms, days[days.length - 1].ms + 2 * DAY);
    const lunAt = (t) => luns.find((l) => t >= l.start && t < l.end) || luns[luns.length - 1];
    for (const d of days) { const l = lunAt(d.sunrise); d.month = l.month; d.adhika = l.adhika; }

    const ruleTime = (d, rule) => {
      switch (rule) {
        case 'sunrise': return d.sunrise;
        case 'madhyahna': return d.sunrise + (d.sunset - d.sunrise) * 0.5;
        case 'aparahna': return d.sunrise + (d.sunset - d.sunrise) * 0.7;
        case 'pradosh': return d.sunset + (d.next - d.sunset) / 15;
        case 'nishita': return (d.sunset + d.next) / 2;
        case 'moonrise': {
          if (d.moonrise === undefined) {
            const mr = search(A.Body.Moon, observer, +1, d.sunset - 3 * 3600e3, 1);
            d.moonrise = mr && mr < d.next + 3 * 3600e3 ? mr : null;
          }
          return d.moonrise || d.sunset + (d.next - d.sunset) / 6;
        }
      }
      return d.sunrise;
    };
    // For a time rule: which tithis each day "owns" — the one prevailing at the rule time, plus any tithi
    // that begins and ends between two rule times (kshaya). When a tithi prevails on two days, the first keeps it.
    const owned = {};
    function ownedFor(rule) {
      if (owned[rule]) return owned[rule];
      const v = days.map((d) => tithiAt(ruleTime(d, rule)));
      const res = days.map(() => []);
      for (let i = 1; i < days.length - 1; i++) {
        if (v[i] !== v[i - 1]) res[i].push({ tithi: v[i] });
        // A skipped tithi goes to whichever day's observance time is nearer to it (before or after).
        const skipped = (v[i + 1] - v[i] + 30) % 30 - 1;
        for (let k = 1; k <= skipped && k < 3; k++) {
          const tithi = (v[i] + k) % 30, r0 = ruleTime(days[i], rule), r1 = ruleTime(days[i + 1], rule);
          const sp = tithiSpan(tithi, (r0 + r1) / 2);
          const later = sp && i + 1 < days.length - 1 && r1 - sp.end < sp.start - r0;
          res[later ? i + 1 : i].push({ tithi, kshaya: true });
        }
      }
      owned[rule] = res;
      return res;
    }
    const events = [];
    const add = (i, ev) => { if (i >= 2 && i < n + 2) { ev.day = days[i].ms; ev.key = days[i].key; days[i].events.push(ev); events.push(ev); } };
    const festivalAt = new Set(FESTIVALS.map((f) => `${f[1]}:${f[2]}`));

    // The lunar month a tithi belongs to (a kshaya tithi starts after the rule time, possibly in the next month).
    const lunFor = (i, rule, o) => {
      const at = ruleTime(days[i], rule);
      if (!o.kshaya) return lunAt(at);
      const sp = tithiSpan(o.tithi, at + DAY / 2);
      return lunAt(sp ? (sp.start + sp.end) / 2 : at);
    };
    const ownOf = (own, i, tithi) => own[i].find((o) => o.tithi === tithi);
    for (const [id, month, tithi, rule, name] of FESTIVALS) {
      const own = ownedFor(rule);
      for (let i = 1; i < days.length - 1; i++) {
        const o = ownOf(own, i, tithi);
        if (!o) continue;
        const l = lunFor(i, rule, o);
        if (l.month !== month || l.adhika) continue;
        // Raksha Bandhan and Holika Dahan avoid Bhadra (Vishti karana, the first half of Purnima):
        // when it covers the time on the first day, the observance moves to the next day if Purnima still prevails.
        let j = i;
        if ((id === 'rakhi' || id === 'holika') && elongAt(ruleTime(days[i], rule)) < 174 && days[i + 1]) {
          const nx = days[i + 1];
          // Raksha Bandhan may also be kept in the morning when Purnima lasts 2 muhurtas past sunrise.
          const morning = nx.sunrise + 2 * (nx.sunset - nx.sunrise) / 15;
          if (tithiAt(ruleTime(nx, rule)) === 14 || (id === 'rakhi' && tithiAt(morning) === 14)) j = i + 1;
        }
        add(j, { id, kind: 'festival', name, tithi, rule, at: ruleTime(days[j], rule) });
      }
    }
    const MONTH_NAMES = LS.VEDIC.months;
    for (const [kind, tithis, rule] of MONTHLY) {
      const own = ownedFor(rule);
      for (let i = 1; i < days.length - 1; i++) {
        for (const tithi of tithis) {
          const o = ownOf(own, i, tithi);
          if (!o) continue;
          const at = ruleTime(days[i], rule);
          const l = lunFor(i, rule, o);
          if ((kind === 'vinayaka' || kind === 'sankashti' || kind === 'shivaratri') && !l.adhika && festivalAt.has(`${l.month}:${tithi}`)) continue;
          const mn = MONTH_NAMES[l.month], adh = l.adhika ? T('Adhika ', 'अधिक ') : T('', '');
          let name;
          if (kind === 'ekadashi') {
            const e = (l.adhika ? ADHIKA_EKADASHI : EKADASHI[l.month])[tithi < 15 ? 0 : 1];
            name = T(`${e.en} Ekadashi`, `${e.hi} एकादशी`);
          } else if (kind === 'purnima') name = T(`${adh.en}${mn.en} Purnima`, `${adh.hi}${mn.hi} पूर्णिमा`);
          else if (kind === 'amavasya') name = T(`${adh.en}${mn.en} Amavasya`, `${adh.hi}${mn.hi} अमावस्या`);
          else if (kind === 'pradosh') name = PRADOSH[days[i].wd] || T('Pradosh Vrat', 'प्रदोष व्रत');
          else if (kind === 'sankashti') name = days[i].wd === 2 ? T('Angaraki Sankashti Chaturthi', 'अंगारकी संकष्टी चतुर्थी') : T('Sankashti Chaturthi', 'संकष्टी चतुर्थी');
          else if (kind === 'vinayaka') name = T('Vinayaka Chaturthi', 'विनायक चतुर्थी');
          else name = T('Masik Shivaratri', 'मासिक शिवरात्रि');
          add(i, { id: `${kind}-${days[i].key}`, kind, name, tithi, rule, at });
        }
      }
    }

    // Sankranti: the Sun entering each sidereal rashi. Observed the next day when it happens after sunset.
    {
      const t0 = A.MakeTime(new Date(days[2].ms));
      let lon = Sky.sidLonOf(A.Body.Sun, t0);
      let r = (Math.floor(lon / 30) + 1) % 12;
      let from = t0;
      for (let guard = 0; guard < 3; guard++) {
        let tt = A.SearchSunLongitude(Sky.norm360(r * 30 + Sky.ayanamsa(from)), from, 40);
        if (!tt) break;
        tt = A.SearchSunLongitude(Sky.norm360(r * 30 + Sky.ayanamsa(tt)), tt.AddDays(-1), 2) || tt;
        const at = ms(tt);
        if (at >= days[n + 1].ms + DAY) break;
        let i = days.findIndex((d) => at >= d.ms && at < d.ms + DAY + 3600e3 && TZ.key(at, tz) === d.key);
        if (i >= 0 && !days[i].polar && at > days[i].sunset) i++;
        const rs = LS.VEDIC.rashis[r];
        if (i >= 0) add(i, { id: `sankranti-${r}`, kind: 'sankranti', rashi: r, name: SANKRANTI_SPECIAL[r] || T(`${rs.en} Sankranti`, `${rs.hi} संक्रान्ति`), at });
        from = tt.AddDays(20); r = (r + 1) % 12;
      }
    }

    // Eclipses (grahana) seen from this place.
    try {
      const endMs = days[n + 1].ms + DAY;
      for (let e = A.SearchLunarEclipse(A.MakeTime(new Date(days[2].ms - 3 * DAY))); e && ms(e.peak) < endMs; e = A.NextLunarEclipse(e.peak)) {
        const peak = ms(e.peak);
        if (peak < days[2].ms) continue;
        const half = (e.kind === 'penumbral' ? e.sd_penum : e.sd_partial) * 60000;
        const visible = [peak - half, peak, peak + half].some((tm) => moonAlt(observer, tm) > 0);
        const i = days.findIndex((d) => d.key === TZ.key(peak, tz));
        add(i, { id: `lunar-${peak}`, kind: 'eclipse', eclipse: 'lunar', type: e.kind, at: peak, start: peak - half, end: peak + half, visible,
          name: T(`${cap(e.kind)} lunar eclipse`, `${KIND_HI[e.kind]} चन्द्र ग्रहण`) });
      }
      for (let e = A.SearchLocalSolarEclipse(A.MakeTime(new Date(days[2].ms - 3 * DAY)), observer); e && ms(e.peak.time) < endMs; e = A.NextLocalSolarEclipse(e.peak.time, observer)) {
        const peak = ms(e.peak.time);
        if (peak < days[2].ms) continue;
        const visible = [e.partial_begin, e.peak, e.partial_end].some((x) => x && x.altitude > 0);
        const i = days.findIndex((d) => d.key === TZ.key(peak, tz));
        add(i, { id: `solar-${peak}`, kind: 'eclipse', eclipse: 'solar', type: e.kind, at: peak, start: ms(e.partial_begin.time), end: ms(e.partial_end.time), visible, obscuration: e.obscuration,
          name: T(`${cap(e.kind)} solar eclipse`, `${KIND_HI[e.kind]} सूर्य ग्रहण`) });
      }
    } catch (err) { /* eclipse search is best-effort */ }

    const ORDER = { eclipse: 0, festival: 1, sankranti: 2, ekadashi: 3, purnima: 4, amavasya: 4, sankashti: 5, vinayaka: 5, pradosh: 6, shivaratri: 6 };
    for (const d of days) d.events.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
    events.sort((a, b) => a.day - b.day || ORDER[a.kind] - ORDER[b.kind]);
    const res = { days: days.slice(2, n + 2), events };
    if (cache.size > 24) cache.delete(cache.keys().next().value);
    cache.set(key, res);
    return res;
  }
  const KIND_HI = { penumbral: 'उपच्छाया', partial: 'खण्ड', total: 'पूर्ण', annular: 'वलयाकार' };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function moonAlt(observer, tm) {
    const t = A.MakeTime(new Date(tm));
    const eq = A.Equator(A.Body.Moon, t, observer, true, true);
    return A.Horizon(t, observer, eq.ra, eq.dec, 'normal').altitude;
  }

  // Month view: every civil day of a Gregorian month.
  function month(observer, tz, y, m) {
    const start = TZ.fromCivil(y, m, 1, tz);
    const n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return range(observer, tz, start, n);
  }

  return { range, month, tithiSpan, tithiAt, lunations, FESTIVALS };
})();
