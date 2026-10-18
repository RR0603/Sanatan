// UI strings. Object names live in vedic.js; this file holds interface text only.
window.LS = window.LS || {};

LS.I18N = (function () {
  const S = {
    en: {
      appName: 'Antariksha', tagline: 'Living Sanatan · Vedic Sky',
      search: 'Search nakshatra, graha, star…', noResults: 'No matches',
      now: 'Now', live: 'LIVE', paused: 'PAUSED', time: 'Time', date: 'Date', speed: 'Speed',
      location: 'Location', useMyLocation: 'Use my location', locating: 'Locating…', locFailed: 'Location unavailable — using last place',
      latitude: 'Latitude', longitude: 'Longitude', apply: 'Apply', custom: 'Custom',
      language: 'Language', settings: 'Settings', about: 'About', close: 'Close',
      // dock
      nakshatra: 'Nakshatra', rashi: 'Rashi', graha: 'Graha', constellations: 'Western', grid: 'Grid',
      atmosphere: 'Sky', ground: 'Ground', milkyway: 'Milky Way', sensor: 'Sensor', camera: 'Camera', night: 'Night', hideUi: 'Hide UI',
      // settings
      eqGrid: 'Equatorial grid', labels: 'Labels', starNames: 'Star names', groundOpacity: 'Ground opacity',
      starBrightness: 'Star brightness', arFov: 'Camera field of view', compassOffset: 'Compass correction',
      resetView: 'Reset view',
      // panchang
      panchang: 'Panchang', tithi: 'Tithi', yoga: 'Yoga', karana: 'Karana', vara: 'Vara', masa: 'Masa',
      samvat: 'Samvat', ritu: 'Ritu', ayana: 'Ayana', lagna: 'Lagna', sunrise: 'Sunrise', sunset: 'Sunset',
      ayanamsa: 'Ayanamsa (Lahiri)', until: 'until', paksha: 'Paksha', adhika: 'Adhika', vikram: 'Vikram', shaka: 'Shaka',
      moonRashi: 'Chandra Rashi', sunRashi: 'Surya Rashi',
      // info card
      center: 'Center', track: 'Track', tracking: 'Tracking', altAz: 'Alt / Az', raDec: 'RA / Dec', magnitude: 'Magnitude',
      siderealLon: 'Sidereal longitude', inRashi: 'Rashi', inNakshatra: 'Nakshatra', pada: 'Pada', rises: 'Rises', sets: 'Sets',
      transitAlways: 'Always above horizon', transitNever: 'Never rises', distance: 'Distance', illumination: 'Illumination',
      deity: 'Devata', symbol: 'Symbol', lord: 'Graha lord', gana: 'Gana', element: 'Tattva', rules: 'Rules',
      exalted: 'Exalted in', debilitated: 'Debilitated in', retrograde: 'Vakri (retrograde)', yogatara: 'Yogatara',
      span: 'Span', below: 'Below horizon', starType: 'Star', grahaType: 'Graha', nakType: 'Nakshatra',
      rashiType: 'Rashi', consType: 'Constellation', asterismType: 'Asterism', modern: 'Modern planet', au: 'AU', km: 'km',
      // sensors
      sensorDenied: 'Motion sensor permission denied', sensorNone: 'No motion sensor on this device',
      cameraDenied: 'Camera unavailable or permission denied', sensorHint: 'Point your phone at the sky',
      calibHint: 'Drag sideways to fine-tune north', https: 'Sensors and camera need HTTPS',
      fov: 'FOV',
      aboutText: 'Antariksha is a real-time Vedic planetarium by Living Sanatan. It shows the 27 nakshatras, the 12 sidereal rashis (Lahiri ayanamsa), the navagraha and the Panchang for your place and time. Point your phone at the sky and the map follows.',
      credits: 'Star data: HYG Database (CC BY-SA 4.0). Constellations & Milky Way: d3-celestial (BSD). Ephemeris: Astronomy Engine (MIT).',
      visit: 'Visit livingsanatan.com',
    },
    hi: {
      appName: 'अन्तरिक्ष', tagline: 'लिविंग सनातन · वैदिक आकाश',
      search: 'नक्षत्र, ग्रह, तारा खोजें…', noResults: 'कोई परिणाम नहीं',
      now: 'अभी', live: 'सजीव', paused: 'रुका', time: 'समय', date: 'तिथि-दिनांक', speed: 'गति',
      location: 'स्थान', useMyLocation: 'मेरा स्थान लें', locating: 'स्थान खोज रहे हैं…', locFailed: 'स्थान उपलब्ध नहीं — पिछला स्थान प्रयुक्त',
      latitude: 'अक्षांश', longitude: 'देशान्तर', apply: 'लागू करें', custom: 'अन्य',
      language: 'भाषा', settings: 'सेटिंग्स', about: 'परिचय', close: 'बन्द करें',
      nakshatra: 'नक्षत्र', rashi: 'राशि', graha: 'ग्रह', constellations: 'पाश्चात्य', grid: 'ग्रिड',
      atmosphere: 'आकाश', ground: 'भूमि', milkyway: 'आकाशगंगा', sensor: 'सेंसर', camera: 'कैमरा', night: 'रात्रि', hideUi: 'UI छिपाएँ',
      eqGrid: 'विषुवत ग्रिड', labels: 'नाम', starNames: 'तारों के नाम', groundOpacity: 'भूमि की अपारदर्शिता',
      starBrightness: 'तारों की चमक', arFov: 'कैमरा दृष्टि-क्षेत्र', compassOffset: 'दिशा सुधार',
      resetView: 'दृश्य रीसेट',
      panchang: 'पंचांग', tithi: 'तिथि', yoga: 'योग', karana: 'करण', vara: 'वार', masa: 'मास',
      samvat: 'संवत्', ritu: 'ऋतु', ayana: 'अयन', lagna: 'लग्न', sunrise: 'सूर्योदय', sunset: 'सूर्यास्त',
      ayanamsa: 'अयनांश (लाहिड़ी)', until: 'तक', paksha: 'पक्ष', adhika: 'अधिक', vikram: 'विक्रम', shaka: 'शक',
      moonRashi: 'चन्द्र राशि', sunRashi: 'सूर्य राशि',
      center: 'केन्द्र', track: 'अनुसरण', tracking: 'अनुसरण जारी', altAz: 'उन्नतांश / दिगंश', raDec: 'विषुवांश / क्रान्ति', magnitude: 'कान्तिमान',
      siderealLon: 'निरयण भोगांश', inRashi: 'राशि', inNakshatra: 'नक्षत्र', pada: 'पद', rises: 'उदय', sets: 'अस्त',
      transitAlways: 'सदा क्षितिज के ऊपर', transitNever: 'उदित नहीं होता', distance: 'दूरी', illumination: 'प्रकाशित भाग',
      deity: 'देवता', symbol: 'प्रतीक', lord: 'स्वामी ग्रह', gana: 'गण', element: 'तत्त्व', rules: 'स्वराशि',
      exalted: 'उच्च', debilitated: 'नीच', retrograde: 'वक्री', yogatara: 'योगतारा',
      span: 'विस्तार', below: 'क्षितिज के नीचे', starType: 'तारा', grahaType: 'ग्रह', nakType: 'नक्षत्र',
      rashiType: 'राशि', consType: 'तारामण्डल', asterismType: 'तारापुंज', modern: 'आधुनिक ग्रह', au: 'खगोलीय इकाई', km: 'कि.मी.',
      sensorDenied: 'मोशन सेंसर की अनुमति नहीं मिली', sensorNone: 'इस उपकरण में मोशन सेंसर नहीं है',
      cameraDenied: 'कैमरा उपलब्ध नहीं या अनुमति नहीं मिली', sensorHint: 'फ़ोन को आकाश की ओर करें',
      calibHint: 'उत्तर दिशा ठीक करने हेतु दाएँ-बाएँ खींचें', https: 'सेंसर और कैमरा हेतु HTTPS आवश्यक है',
      fov: 'दृष्टि',
      aboutText: 'अन्तरिक्ष — लिविंग सनातन का सजीव वैदिक तारामण्डल। यह आपके स्थान और समय के अनुसार २७ नक्षत्र, १२ निरयण राशियाँ (लाहिड़ी अयनांश), नवग्रह और पंचांग दिखाता है। फ़ोन को आकाश की ओर करें और मानचित्र साथ चलेगा।',
      credits: 'तारा डेटा: HYG Database (CC BY-SA 4.0)। तारामण्डल व आकाशगंगा: d3-celestial (BSD)। पंचांग गणना: Astronomy Engine (MIT)।',
      visit: 'livingsanatan.com पर जाएँ',
    },
  };

  let lang = 'en';
  const listeners = [];

  return {
    get lang() { return lang; },
    set(l) { lang = S[l] ? l : 'en'; document.documentElement.lang = lang; listeners.forEach((f) => f(lang)); },
    onChange(f) { listeners.push(f); },
    t(key) { return (S[lang] && S[lang][key]) || S.en[key] || key; },
    // Pick the right form of a vedic.js bilingual value or named object.
    name(o) { if (!o) return ''; return lang === 'hi' ? (o.hi || o.en) : (o.en || o.hi); },
    num(n, digits) {
      const s = digits == null ? String(n) : Number(n).toFixed(digits);
      return lang === 'hi' ? s.replace(/[0-9]/g, (d) => '०१२३४५६७८९'[d]) : s;
    },
  };
})();
