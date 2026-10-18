// UI strings. Object names live in vedic.js; this file holds interface text only.
window.LS = window.LS || {};

LS.I18N = (function () {
  const S = {
    en: {
      // modes, names, jyotish
      sensorLive: 'SENSOR LIVE', sensorWaiting: 'waiting for motion…', sensorRelative: '(no compass)',
      introTitle: 'Point your phone at the sky', introText: 'Antariksha follows your phone. Tap below and choose “Allow” when your phone asks for motion access.',
      introSensor: 'Follow my phone', introCamera: 'Camera view (AR)', introLater: 'Not now', helpTitle: 'Motion access needed', ok: 'OK',
      helpBlocked: 'Your phone blocked motion access for this page, so the sky cannot follow it. On iPhone: fully close Safari (swipe it away from the app switcher), open the link again, tap “Follow my phone” and choose “Allow”. If it still fails, go to Settings → Apps → Safari → Advanced → Website Data, delete this site, and try again.',
      helpNone: 'No motion data from this device.',
      modeSky: 'Sky', modeJyotish: 'Jyotish', names: 'Names', namesVedic: 'Jyotish names', namesWestern: 'Western names',
      vedicShort: 'Vedic', westernShort: 'Western',
      kundali: 'Kundali', grahas: 'Grahas', dasha: 'Dasha', janma: 'Birth', north: 'North Indian', south: 'South Indian',
      rashiChart: 'Rashi D1', navamsa: 'Navamsa D9', house: 'Bhava', dignity: 'Dignity', combust: 'Asta (combust)',
      vimshottari: 'Vimshottari Dasha', balance: 'Balance at chart time', mahadasha: 'Mahadasha', antardasha: 'Antardasha',
      current: 'Now running', years: 'y', months: 'm', birthTitle: 'Janma Kundali — birth details', birthName: 'Name (optional)',
      birthDate: 'Date & time of birth', birthPlace: 'Place of birth', cast: 'Cast chart', transitNow: 'Gochara · now',
      viewSky: 'See this sky', inKundali: 'In Kundali', dragHint: 'Upper half = sky above your horizon · drag the wheel to travel in time · tap a graha for its drishti',
      bhachakra: 'Bhachakra', aboveHorizon: 'ABOVE HORIZON', chartFor: 'Chart for', aspects: 'Drishti', nakLord: 'Nakshatra lord',
      birthChart: 'Birth chart', backToBirth: 'Back to birth chart', bhavaName: 'Bhava', occupants: 'Occupants', lordIn: 'Lord in',
      dig_exalted: 'Uchcha · exalted', dig_own: 'Svakshetra · own', dig_friend: 'Mitra · friend', dig_neutral: 'Sama · neutral',
      dig_enemy: 'Shatru · enemy', dig_debilitated: 'Neecha · debilitated', mandala: 'Mandala',
      aboutJyotish: 'Jyotish mode turns the same live sky into a chart: the Bhachakra wheel is drawn with Lagna on the eastern horizon, so its upper half is the sky above you right now.',
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
      sensorLive: 'सेंसर सक्रिय', sensorWaiting: 'गति की प्रतीक्षा…', sensorRelative: '(कम्पास नहीं)',
      introTitle: 'फ़ोन को आकाश की ओर करें', introText: 'अन्तरिक्ष आपके फ़ोन के साथ घूमता है। नीचे छुएँ और फ़ोन द्वारा मोशन अनुमति माँगने पर “Allow” चुनें।',
      introSensor: 'फ़ोन के साथ घुमाएँ', introCamera: 'कैमरा दृश्य (AR)', introLater: 'अभी नहीं', helpTitle: 'मोशन अनुमति आवश्यक', ok: 'ठीक है',
      helpBlocked: 'फ़ोन ने इस पेज के लिए मोशन अनुमति रोक दी है, इसलिए आकाश फ़ोन के साथ नहीं घूम सकता। iPhone पर: Safari को पूरी तरह बन्द करें (ऐप स्विचर से हटाएँ), लिंक फिर खोलें, “फ़ोन के साथ घुमाएँ” छुएँ और “Allow” चुनें। फिर भी न हो तो Settings → Apps → Safari → Advanced → Website Data में इस साइट को हटाकर पुनः प्रयास करें।',
      helpNone: 'इस उपकरण से मोशन डेटा नहीं मिला।',
      modeSky: 'आकाश', modeJyotish: 'ज्योतिष', names: 'नाम', namesVedic: 'ज्योतिष नाम', namesWestern: 'पाश्चात्य नाम',
      vedicShort: 'वैदिक', westernShort: 'पाश्चात्य',
      kundali: 'कुण्डली', grahas: 'ग्रह', dasha: 'दशा', janma: 'जन्म', north: 'उत्तर भारतीय', south: 'दक्षिण भारतीय',
      rashiChart: 'राशि D1', navamsa: 'नवांश D9', house: 'भाव', dignity: 'स्थिति', combust: 'अस्त',
      vimshottari: 'विंशोत्तरी दशा', balance: 'कुण्डली समय पर शेष', mahadasha: 'महादशा', antardasha: 'अन्तर्दशा',
      current: 'वर्तमान', years: 'व', months: 'मा', birthTitle: 'जन्म कुण्डली — जन्म विवरण', birthName: 'नाम (वैकल्पिक)',
      birthDate: 'जन्म तिथि व समय', birthPlace: 'जन्म स्थान', cast: 'कुण्डली बनाएँ', transitNow: 'गोचर · अभी',
      viewSky: 'यह आकाश देखें', inKundali: 'कुण्डली में', dragHint: 'ऊपरी आधा = क्षितिज के ऊपर का आकाश · समय-यात्रा हेतु चक्र घुमाएँ · दृष्टि हेतु ग्रह छुएँ',
      bhachakra: 'भचक्र', aboveHorizon: 'क्षितिज के ऊपर', chartFor: 'कुण्डली', aspects: 'दृष्टि', nakLord: 'नक्षत्र स्वामी',
      birthChart: 'जन्म कुण्डली', backToBirth: 'जन्म कुण्डली पर लौटें', bhavaName: 'भाव', occupants: 'स्थित ग्रह', lordIn: 'स्वामी स्थित',
      dig_exalted: 'उच्च', dig_own: 'स्वक्षेत्री', dig_friend: 'मित्र राशि', dig_neutral: 'सम राशि',
      dig_enemy: 'शत्रु राशि', dig_debilitated: 'नीच', mandala: 'मण्डल',
      aboutJyotish: 'ज्योतिष मोड उसी सजीव आकाश को कुण्डली में बदलता है: भचक्र में लग्न पूर्वी क्षितिज पर है, अतः इसका ऊपरी आधा भाग अभी आपके ऊपर का आकाश है।',
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
