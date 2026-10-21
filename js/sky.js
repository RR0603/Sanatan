// Astronomy layer: coordinate frames, graha positions, sidereal (Lahiri) zodiac and Panchang.
// Built on astronomy-engine (global `Astronomy`). World frame is ENU: x = East, y = North, z = Up.
window.LS = window.LS || {};

LS.Sky = (function () {
  const A = window.Astronomy;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const NAK = 360 / 27;

  const norm360 = (x) => ((x % 360) + 360) % 360;

  // astronomy-engine stores rotations transposed: out_j = sum_i rot[i][j] * v_i.
  function toMat(r) {
    const m = r.rot;
    return [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]];
  }
  // HOR (x north, y west, z up) -> ENU
  const HOR2ENU = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  function mul(a, b) {
    const o = new Array(9);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    return o;
  }
  function apply(m, x, y, z) {
    return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
  }
  function transpose(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }

  function radec2vec(raDeg, decDeg) {
    const ra = raDeg * D2R, dec = decDeg * D2R, c = Math.cos(dec);
    return [c * Math.cos(ra), c * Math.sin(ra), Math.sin(dec)];
  }

  // Lahiri (Chitrapaksha) ayanamsa: 23.245524743° at 1956-03-21 (JD 2435553.5), advanced by general precession.
  function ayanamsa(time) {
    const T = time.tt / 36525;
    const T0 = (2435553.5 - 2451545.0) / 36525;
    const p = (t) => 5028.796195 * t + 1.1054348 * t * t;
    return 23.245524743 + (p(T) - p(T0)) / 3600;
  }

  // Mean ascending node of the Moon (Meeus 47.7), tropical degrees.
  function meanRahu(time) {
    const T = time.tt / 36525;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
  }

  function frames(time, observer) {
    const eqj2enu = mul(HOR2ENU, toMat(A.Rotation_EQJ_HOR(time, observer)));
    const ect2enu = mul(HOR2ENU, mul(toMat(A.Rotation_EQD_HOR(time, observer)), toMat(A.Rotation_ECT_EQD(time))));
    const eqd2enu = mul(HOR2ENU, toMat(A.Rotation_EQD_HOR(time, observer)));
    return { eqj2enu, ect2enu, eqd2enu, enu2eqj: transpose(eqj2enu), enu2eqd: transpose(eqd2enu) };
  }

  // Unit vector in the true-ecliptic-of-date frame.
  function eclVec(lonDeg, latDeg) { return radec2vec(lonDeg, latDeg); }

  const GRAHA_ORDER = ['surya', 'chandra', 'mangala', 'budha', 'guru', 'shukra', 'shani', 'rahu', 'ketu', 'arun', 'varun'];

  function grahas(time, observer, fr) {
    const ayan = ayanamsa(time);
    const out = {};
    for (const id of GRAHA_ORDER) {
      const g = LS.VEDIC.grahas[id];
      const o = { id };
      if (g.body) {
        const body = A.Body[g.body];
        const eq = A.Equator(body, time, observer, false, true);
        const v = eq.vec, len = Math.hypot(v.x, v.y, v.z);
        o.eqj = [v.x / len, v.y / len, v.z / len];
        o.dist = len; // AU
        o.tropLon = A.Ecliptic(A.GeoVector(body, time, true)).elon;
        o.mag = g.body === 'Sun' ? -26.7 : A.Illumination(body, time).mag;
        if (g.body === 'Moon') {
          o.phase = A.MoonPhase(time); // 0 new, 180 full
          o.illum = A.Illumination(body, time).phase_fraction;
        }
        // Retrograde check: tropical longitude a few hours later.
        if (g.body !== 'Sun' && g.body !== 'Moon') {
          const later = A.Ecliptic(A.GeoVector(body, time.AddDays(0.25), true)).elon;
          o.retro = ((later - o.tropLon + 540) % 360) - 180 < 0;
        }
      } else {
        const lon = meanRahu(time) + (id === 'ketu' ? 180 : 0);
        o.tropLon = norm360(lon);
        const e = eclVec(o.tropLon, 0);
        o.enu = apply(fr.ect2enu, e[0], e[1], e[2]);
        o.mag = 99;
        o.retro = true;
      }
      o.sidLon = norm360(o.tropLon - ayan);
      out[id] = o;
    }
    return out;
  }

  function zodiacInfo(sidLon) {
    const nak = Math.floor(sidLon / NAK);
    return { rashi: Math.floor(sidLon / 30), degInRashi: sidLon % 30, nakshatra: nak,
      pada: Math.floor((sidLon - nak * NAK) / (NAK / 4)) + 1 };
  }

  function moonSunElongation(time) { return A.MoonPhase(time); }
  function sidLonOf(body, time) { return norm360(A.Ecliptic(A.GeoVector(body, time, true)).elon - ayanamsa(time)); }

  // Sidereal ascendant (Lagna).
  function lagna(time, observer) {
    const lst = norm360((A.SiderealTime(time) + observer.longitude / 15) * 15) * D2R;
    const eps = A.e_tilt(time).tobl * D2R, phi = observer.latitude * D2R;
    const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D;
    return norm360(asc - ayanamsa(time));
  }

  function riseSet(body, observer, time) {
    const start = time.AddDays(-0.5);
    const rise = A.SearchRiseSet(body, observer, +1, start, 1.5);
    const set = A.SearchRiseSet(body, observer, -1, start, 1.5);
    return { rise, set };
  }

  function sunEvents(observer, dayStartDate) {
    const t = A.MakeTime(dayStartDate);
    return {
      rise: A.SearchRiseSet(A.Body.Sun, observer, +1, t, 1),
      set: A.SearchRiseSet(A.Body.Sun, observer, -1, t, 1),
    };
  }

  // Time when f(t) crosses `target` going forward, where f increases ~monotonically modulo 360.
  function nextCrossing(f, time, target, maxDays) {
    const g = (t) => ((f(t) - target + 540) % 360) - 180;
    let t1 = time, step = 0.25;
    for (let d = 0; d < maxDays; d += step) {
      const t2 = t1.AddDays(step);
      if (g(t1) < 0 && g(t2) >= 0) return A.Search(g, t1, t2, { dt_tolerance_seconds: 30 });
      t1 = t2;
    }
    return null;
  }

  function panchang(time, observer) {
    const ayan = ayanamsa(time);
    const elong = moonSunElongation(time);
    const sunSid = sidLonOf(A.Body.Sun, time);
    const moonSid = sidLonOf(A.Body.Moon, time);

    const tithiIdx = Math.floor(elong / 12); // 0..29
    const tithiEnd = A.SearchMoonPhase((tithiIdx + 1) * 12 % 360, time, 3);
    const nak = Math.floor(moonSid / NAK);
    const nakEnd = nextCrossing((t) => sidLonOf(A.Body.Moon, t), time, ((nak + 1) * NAK) % 360, 2);
    const yogaIdx = Math.floor(norm360(sunSid + moonSid) / NAK);
    const kIdx = Math.floor(elong / 6); // 0..59
    let karana;
    const K = LS.VEDIC.karanas;
    if (kIdx === 0) karana = K.kimstughna;
    else if (kIdx >= 57) karana = [K.shakuni, K.chatushpada, K.naga][kIdx - 57];
    else karana = K.movable[(kIdx - 1) % 7];

    // Amanta lunar month: named by the sidereal sign of the Sun at the new moon that began it.
    // The new moon that began this lunation (search backwards so a new moon a few hours ago is not skipped).
    const prevNew = A.SearchMoonPhase(0, time, -30);
    const nextNew = A.SearchMoonPhase(0, time, 30.5);
    const rashiAtPrev = Math.floor(sidLonOf(A.Body.Sun, prevNew) / 30);
    const rashiAtNext = nextNew ? Math.floor(sidLonOf(A.Body.Sun, nextNew) / 30) : -1;
    const monthIdx = (rashiAtPrev + 1) % 12; // Sun in Meena -> Chaitra
    const adhika = rashiAtPrev === rashiAtNext;

    // Vikram / Shaka samvat roll over at Chaitra Shukla Pratipada.
    const startOfYear = prevNew.AddDays(-29.53 * monthIdx);
    const gy = startOfYear.date.getUTCFullYear() + (startOfYear.date.getUTCMonth() >= 10 ? 1 : 0);
    const vikram = gy + 57, shaka = gy - 78;

    const ritu = Math.floor(monthIdx / 2);
    const ayana = (sunSid >= 270 || sunSid < 90) ? 0 : 1;

    // Vara runs sunrise to sunrise: take the weekday of the latest sunrise.
    const lastSunrise = A.SearchRiseSet(A.Body.Sun, observer, +1, time, -1.1);
    const weekday = observerWeekday(lastSunrise || time, observer);

    return {
      ayanamsa: ayan, elongation: elong,
      tithi: tithiIdx, paksha: tithiIdx < 15 ? 0 : 1, tithiEnd,
      nakshatra: nak, pada: Math.floor((moonSid - nak * NAK) / (NAK / 4)) + 1, nakshatraEnd: nakEnd,
      yoga: yogaIdx, karana, vara: weekday,
      month: monthIdx, adhika, vikram, shaka, ritu, ayana,
      sunSid, moonSid, sunRashi: Math.floor(sunSid / 30), moonRashi: Math.floor(moonSid / 30),
      lagna: lagna(time, observer),
    };
  }

  // Weekday at the observer's local mean solar time (unambiguous at sunrise).
  function observerWeekday(time, observer) {
    const local = new Date(time.date.getTime() + observer.longitude / 15 * 3600e3);
    return local.getUTCDay();
  }

  // Simple sky brightness / limiting magnitude model from the Sun's altitude.
  function limitingMag(sunAlt) {
    if (sunAlt > 0) return -1.5;
    if (sunAlt > -6) return -1.5 + (-sunAlt) / 6 * 2.5;   // civil twilight -> mag 1
    if (sunAlt > -12) return 1 + (-sunAlt - 6) / 6 * 3; // nautical -> mag 4
    if (sunAlt > -18) return 4 + (-sunAlt - 12) / 6 * 2.2;
    return 6.2;
  }

  // Bennett / Saemundsson refraction in degrees for apparent altitude.
  function refraction(altDeg) {
    if (altDeg < -2) return 0;
    const h = Math.max(altDeg, -1.9);
    return 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * D2R) / 60;
  }

  return { D2R, R2D, NAK, norm360, mul, apply, transpose, radec2vec, ayanamsa, meanRahu, frames, eclVec,
    grahas, GRAHA_ORDER, zodiacInfo, lagna, riseSet, sunEvents, panchang, limitingMag, refraction, sidLonOf };
})();
