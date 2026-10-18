// Vedic sky content: nakshatras, rashis, grahas, named stars and Panchang vocabulary.
// Star references use HYG designations ("Bet Ari" = β Arietis, "41 Ari" = 41 Arietis).
window.LS = window.LS || {};

LS.VEDIC = (function () {
  const T = (en, hi) => ({ en, hi });

  const nakshatras = [
    { en: 'Ashwini', iast: 'Aśvinī', hi: 'अश्विनी', lord: 'ketu', gana: 'deva',
      deity: T('Ashvini Kumaras, the divine physicians', 'अश्विनी कुमार — देव-वैद्य'),
      symbol: T("Horse's head", 'अश्व का मुख'), yogatara: 'Bet Ari',
      fig: [['Alp Ari', 'Bet Ari'], ['Bet Ari', 'Gam Ari']] },
    { en: 'Bharani', iast: 'Bharaṇī', hi: 'भरणी', lord: 'shukra', gana: 'manushya',
      deity: T('Yama, lord of dharma and death', 'यम — धर्म एवं मृत्यु के देवता'),
      symbol: T('Yoni, the womb', 'योनि'), yogatara: '41 Ari',
      fig: [['35 Ari', '39 Ari'], ['39 Ari', '41 Ari'], ['41 Ari', '35 Ari']] },
    { en: 'Krittika', iast: 'Kṛttikā', hi: 'कृत्तिका', lord: 'surya', gana: 'rakshasa',
      deity: T('Agni, the sacred fire', 'अग्नि देव'),
      symbol: T('Razor / flame', 'छुरा / अग्निशिखा'), yogatara: 'Eta Tau',
      fig: [['27 Tau', '25 Tau'], ['25 Tau', '23 Tau'], ['23 Tau', '17 Tau'], ['17 Tau', '20 Tau'], ['20 Tau', '19 Tau'], ['20 Tau', '25 Tau']] },
    { en: 'Rohini', iast: 'Rohiṇī', hi: 'रोहिणी', lord: 'chandra', gana: 'manushya',
      deity: T('Prajapati Brahma, the creator', 'प्रजापति ब्रह्मा'),
      symbol: T('Chariot / ox-cart', 'रथ / शकट'), yogatara: 'Alp Tau',
      fig: [['Alp Tau', 'The Tau'], ['The Tau', 'Gam Tau'], ['Gam Tau', 'Del Tau'], ['Del Tau', 'Eps Tau']] },
    { en: 'Mrigashira', iast: 'Mṛgaśirā', hi: 'मृगशिरा', lord: 'mangala', gana: 'deva',
      deity: T('Soma, the Moon god', 'सोम देव'),
      symbol: T("Deer's head", 'मृग का सिर'), yogatara: 'Lam Ori',
      fig: [['Lam Ori', 'Phi-1 Ori'], ['Lam Ori', 'Phi-2 Ori'], ['Phi-1 Ori', 'Phi-2 Ori']] },
    { en: 'Ardra', iast: 'Ārdrā', hi: 'आर्द्रा', lord: 'rahu', gana: 'manushya',
      deity: T('Rudra, the storm form of Shiva', 'रुद्र — शिव का प्रचण्ड रूप'),
      symbol: T('Teardrop / diamond', 'अश्रुबिन्दु / हीरा'), yogatara: 'Alp Ori', fig: [] },
    { en: 'Punarvasu', iast: 'Punarvasu', hi: 'पुनर्वसु', lord: 'guru', gana: 'deva',
      deity: T('Aditi, mother of the gods', 'अदिति — देवमाता'),
      symbol: T('Quiver of arrows', 'तरकश'), yogatara: 'Bet Gem',
      fig: [['Alp Gem', 'Bet Gem']] },
    { en: 'Pushya', iast: 'Puṣya', hi: 'पुष्य', lord: 'shani', gana: 'deva',
      deity: T('Brihaspati, guru of the gods', 'बृहस्पति — देवगुरु'),
      symbol: T("Cow's udder / lotus", 'गौ-स्तन / कमल'), yogatara: 'Del Cnc',
      fig: [['Gam Cnc', 'Del Cnc'], ['Del Cnc', 'The Cnc'], ['The Cnc', 'Gam Cnc']] },
    { en: 'Ashlesha', iast: 'Āśleṣā', hi: 'आश्लेषा', lord: 'budha', gana: 'rakshasa',
      deity: T('The Nagas, serpent deities', 'नाग देवता'),
      symbol: T('Coiled serpent', 'कुण्डलित सर्प'), yogatara: 'Eps Hya',
      fig: [['Del Hya', 'Sig Hya'], ['Sig Hya', 'Eta Hya'], ['Eta Hya', 'Rho Hya'], ['Rho Hya', 'Zet Hya'], ['Zet Hya', 'Eps Hya'], ['Eps Hya', 'Del Hya']] },
    { en: 'Magha', iast: 'Maghā', hi: 'मघा', lord: 'ketu', gana: 'rakshasa',
      deity: T('The Pitris, ancestral fathers', 'पितृगण'),
      symbol: T('Royal throne', 'राजसिंहासन'), yogatara: 'Alp Leo',
      fig: [['Alp Leo', 'Eta Leo'], ['Eta Leo', 'Gam Leo'], ['Gam Leo', 'Zet Leo'], ['Zet Leo', 'Mu Leo'], ['Mu Leo', 'Eps Leo']] },
    { en: 'Purva Phalguni', iast: 'Pūrva Phalgunī', hi: 'पूर्व फाल्गुनी', lord: 'shukra', gana: 'manushya',
      deity: T('Bhaga, giver of fortune and delight', 'भग — सौभाग्य के देवता'),
      symbol: T('Front legs of a bed', 'पलंग के अगले पाए'), yogatara: 'Del Leo',
      fig: [['Del Leo', 'The Leo']] },
    { en: 'Uttara Phalguni', iast: 'Uttara Phalgunī', hi: 'उत्तर फाल्गुनी', lord: 'surya', gana: 'manushya',
      deity: T('Aryaman, god of contracts and union', 'अर्यमा — मैत्री एवं विवाह के देवता'),
      symbol: T('Back legs of a bed', 'पलंग के पिछले पाए'), yogatara: 'Bet Leo',
      fig: [['Bet Leo', '93 Leo']] },
    { en: 'Hasta', iast: 'Hasta', hi: 'हस्त', lord: 'chandra', gana: 'deva',
      deity: T('Savitr, the vivifying Sun', 'सविता — प्रेरक सूर्य'),
      symbol: T('Hand / palm', 'हाथ / हथेली'), yogatara: 'Del Crv',
      fig: [['Gam Crv', 'Del Crv'], ['Del Crv', 'Bet Crv'], ['Bet Crv', 'Eps Crv'], ['Eps Crv', 'Gam Crv'], ['Eps Crv', 'Alp Crv']] },
    { en: 'Chitra', iast: 'Citrā', hi: 'चित्रा', lord: 'mangala', gana: 'rakshasa',
      deity: T('Tvashtr / Vishvakarma, celestial architect', 'त्वष्टा / विश्वकर्मा'),
      symbol: T('Bright jewel / pearl', 'उज्ज्वल रत्न / मोती'), yogatara: 'Alp Vir', fig: [] },
    { en: 'Swati', iast: 'Svātī', hi: 'स्वाती', lord: 'rahu', gana: 'deva',
      deity: T('Vayu, the wind god', 'वायु देव'),
      symbol: T('Young shoot swaying in the wind', 'वायु में झूलता अंकुर'), yogatara: 'Alp Boo', fig: [] },
    { en: 'Vishakha', iast: 'Viśākhā', hi: 'विशाखा', lord: 'guru', gana: 'rakshasa',
      deity: T('Indra and Agni (Indragni)', 'इन्द्राग्नि'),
      symbol: T('Triumphal arch', 'विजय तोरण'), yogatara: 'Alp Lib',
      fig: [['Alp Lib', 'Bet Lib'], ['Bet Lib', 'Gam Lib']] },
    { en: 'Anuradha', iast: 'Anurādhā', hi: 'अनुराधा', lord: 'shani', gana: 'deva',
      deity: T('Mitra, god of friendship', 'मित्र — मैत्री के देवता'),
      symbol: T('Lotus', 'कमल'), yogatara: 'Del Sco',
      fig: [['Bet Sco', 'Del Sco'], ['Del Sco', 'Pi Sco']] },
    { en: 'Jyeshtha', iast: 'Jyeṣṭhā', hi: 'ज्येष्ठा', lord: 'budha', gana: 'rakshasa',
      deity: T('Indra, king of the gods', 'इन्द्र — देवराज'),
      symbol: T('Circular amulet / umbrella', 'कुण्डल / छत्र'), yogatara: 'Alp Sco',
      fig: [['Sig Sco', 'Alp Sco'], ['Alp Sco', 'Tau Sco']] },
    { en: 'Mula', iast: 'Mūla', hi: 'मूल', lord: 'ketu', gana: 'rakshasa',
      deity: T('Nirriti, goddess of dissolution', 'निऋति — विलय की देवी'),
      symbol: T('Bunch of roots', 'जड़ों का गुच्छ'), yogatara: 'Lam Sco',
      fig: [['Eps Sco', 'Mu Sco'], ['Mu Sco', 'Zet Sco'], ['Zet Sco', 'Eta Sco'], ['Eta Sco', 'The Sco'], ['The Sco', 'Iot Sco'], ['Iot Sco', 'Kap Sco'], ['Kap Sco', 'Lam Sco'], ['Lam Sco', 'Ups Sco']] },
    { en: 'Purva Ashadha', iast: 'Pūrvāṣāḍhā', hi: 'पूर्वाषाढा', lord: 'shukra', gana: 'manushya',
      deity: T('Apas, the cosmic waters', 'आपः — जल देवता'),
      symbol: T("Elephant's tusk / winnowing fan", 'गजदन्त / सूप'), yogatara: 'Del Sgr',
      fig: [['Del Sgr', 'Eps Sgr']] },
    { en: 'Uttara Ashadha', iast: 'Uttarāṣāḍhā', hi: 'उत्तराषाढा', lord: 'surya', gana: 'manushya',
      deity: T('The Vishvedevas, universal gods', 'विश्वेदेव'),
      symbol: T('Planks of a bed', 'पलंग के तख्ते'), yogatara: 'Sig Sgr',
      fig: [['Sig Sgr', 'Zet Sgr'], ['Zet Sgr', 'Tau Sgr'], ['Tau Sgr', 'Phi Sgr'], ['Phi Sgr', 'Sig Sgr']] },
    { en: 'Shravana', iast: 'Śravaṇa', hi: 'श्रवण', lord: 'chandra', gana: 'deva',
      deity: T('Vishnu, the preserver', 'विष्णु — पालनहार'),
      symbol: T('Ear / three footprints', 'कर्ण / तीन पदचिह्न'), yogatara: 'Alp Aql',
      fig: [['Gam Aql', 'Alp Aql'], ['Alp Aql', 'Bet Aql']] },
    { en: 'Dhanishtha', iast: 'Dhaniṣṭhā', hi: 'धनिष्ठा', lord: 'mangala', gana: 'rakshasa',
      deity: T('The eight Vasus', 'अष्ट वसु'),
      symbol: T('Drum (mridanga)', 'मृदंग'), yogatara: 'Bet Del',
      fig: [['Alp Del', 'Bet Del'], ['Bet Del', 'Del Del'], ['Del Del', 'Gam Del'], ['Gam Del', 'Alp Del'], ['Bet Del', 'Eps Del']] },
    { en: 'Shatabhisha', iast: 'Śatabhiṣā', hi: 'शतभिषा', lord: 'rahu', gana: 'rakshasa',
      deity: T('Varuna, lord of cosmic waters', 'वरुण देव'),
      symbol: T('Empty circle / hundred healers', 'रिक्त वृत्त / शत वैद्य'), yogatara: 'Lam Aqr', fig: [] },
    { en: 'Purva Bhadrapada', iast: 'Pūrva Bhādrapadā', hi: 'पूर्व भाद्रपदा', lord: 'guru', gana: 'manushya',
      deity: T('Aja Ekapada, the one-footed goat', 'अज एकपाद'),
      symbol: T('Front legs of a funeral cot', 'शय्या के अगले पाए'), yogatara: 'Alp Peg',
      fig: [['Alp Peg', 'Bet Peg']] },
    { en: 'Uttara Bhadrapada', iast: 'Uttara Bhādrapadā', hi: 'उत्तर भाद्रपदा', lord: 'shani', gana: 'manushya',
      deity: T('Ahir Budhnya, serpent of the deep', 'अहिर्बुध्न्य'),
      symbol: T('Back legs of a funeral cot', 'शय्या के पिछले पाए'), yogatara: 'Gam Peg',
      fig: [['Gam Peg', 'Alp And']] },
    { en: 'Revati', iast: 'Revatī', hi: 'रेवती', lord: 'budha', gana: 'deva',
      deity: T('Pushan, nourisher and guide of travellers', 'पूषा — पथ-रक्षक'),
      symbol: T('Fish / drum', 'मत्स्य / ढोल'), yogatara: 'Zet Psc', fig: [] },
  ];

  const abhijit = {
    en: 'Abhijit', iast: 'Abhijit', hi: 'अभिजित्', key: 'Alp Lyr',
    deity: T('Brahma', 'ब्रह्मा'), symbol: T('Triangle', 'त्रिकोण'),
    fig: [['Alp Lyr', 'Eps Lyr'], ['Eps Lyr', 'Zet Lyr'], ['Zet Lyr', 'Alp Lyr']],
  };

  // Asterisms named in the Puranas, drawn alongside the nakshatras.
  const asterisms = [
    { en: 'Saptarishi', hi: 'सप्तर्षि', label: 'Del UMa',
      desc: T('The Seven Sages circling Dhruva — Marichi, Vasishtha (with Arundhati), Angiras, Atri, Pulastya, Pulaha and Kratu.',
        'ध्रुव की परिक्रमा करते सात ऋषि — मरीचि, वसिष्ठ (अरुन्धती सहित), अंगिरा, अत्रि, पुलस्त्य, पुलह और क्रतु।'),
      fig: [['Eta UMa', 'Zet UMa'], ['Zet UMa', 'Eps UMa'], ['Eps UMa', 'Del UMa'], ['Del UMa', 'Alp UMa'], ['Alp UMa', 'Bet UMa'], ['Bet UMa', 'Gam UMa'], ['Gam UMa', 'Del UMa']] },
    { en: 'Trishanku', hi: 'त्रिशंकु', label: 'Gam Cru',
      desc: T('King Trishanku, held between heaven and earth in the sky created for him by Vishvamitra.',
        'राजा त्रिशंकु, जिन्हें विश्वामित्र ने अपने रचे स्वर्ग में पृथ्वी और आकाश के बीच स्थापित किया।'),
      fig: [['Alp Cru', 'Gam Cru'], ['Bet Cru', 'Del Cru']] },
    { en: 'Ishu Trikanda', hi: 'इषु त्रिकाण्ड', label: 'Eps Ori',
      desc: T("The three-jointed arrow of Rudra that pierced Prajapati in the form of a deer (Aitareya Brahmana).",
        'रुद्र का त्रिकाण्ड बाण जिसने मृगरूपी प्रजापति को बेधा (ऐतरेय ब्राह्मण)।'),
      fig: [['Del Ori', 'Eps Ori'], ['Eps Ori', 'Zet Ori']] },
  ];

  // Named stars beyond the nakshatra yogataras.
  const stars = [
    { key: 'Alp UMi', en: 'Dhruva', hi: 'ध्रुव', desc: T('The Pole Star — the immovable seat granted to the devoted child Dhruva by Vishnu.', 'ध्रुव तारा — विष्णु द्वारा भक्त बालक ध्रुव को प्रदान किया गया अटल पद।') },
    { key: 'Eta UMa', en: 'Marichi', hi: 'मरीचि', desc: T('One of the Saptarishi, son of Brahma.', 'सप्तर्षियों में से एक, ब्रह्मा के मानसपुत्र।') },
    { key: 'Zet UMa', en: 'Vasishtha', hi: 'वसिष्ठ', desc: T('Sage Vasishtha of the Saptarishi; his faithful wife Arundhati shines beside him.', 'सप्तर्षि वसिष्ठ; उनके पास उनकी पतिव्रता पत्नी अरुन्धती चमकती हैं।') },
    { key: '80 UMa', en: 'Arundhati', hi: 'अरुन्धती', desc: T('Shown to brides at Vedic weddings as the ideal of devotion.', 'विवाह संस्कार में वधू को दिखाया जाने वाला निष्ठा का प्रतीक तारा।') },
    { key: 'Eps UMa', en: 'Angiras', hi: 'अंगिरा', desc: T('One of the Saptarishi, seer of many Rigvedic hymns.', 'सप्तर्षियों में से एक, अनेक ऋग्वैदिक सूक्तों के द्रष्टा।') },
    { key: 'Del UMa', en: 'Atri', hi: 'अत्रि', desc: T('One of the Saptarishi, husband of Anasuya.', 'सप्तर्षियों में से एक, अनसूया के पति।') },
    { key: 'Gam UMa', en: 'Pulastya', hi: 'पुलस्त्य', desc: T('One of the Saptarishi.', 'सप्तर्षियों में से एक।') },
    { key: 'Bet UMa', en: 'Pulaha', hi: 'पुलह', desc: T('One of the Saptarishi.', 'सप्तर्षियों में से एक।') },
    { key: 'Alp UMa', en: 'Kratu', hi: 'क्रतु', desc: T('One of the Saptarishi.', 'सप्तर्षियों में से एक।') },
    { key: 'Alp CMa', en: 'Lubdhaka', hi: 'लुब्धक', desc: T('The Hunter (Mrigavyadha) — Rudra pursuing Prajapati, who fled as the deer Mriga.', 'व्याध (मृगव्याध) — मृगरूपी प्रजापति का पीछा करते रुद्र।') },
    { key: 'Alp Car', en: 'Agastya', hi: 'अगस्त्य', desc: T('The sage Agastya, who carried Vedic wisdom to the south; his star rises over South India.', 'महर्षि अगस्त्य, जो वैदिक ज्ञान दक्षिण में ले गए; उनका तारा दक्षिण भारत के आकाश में उदित होता है।') },
    { key: 'Alp Aur', en: 'Brahmahridaya', hi: 'ब्रह्महृदय', desc: T('"Heart of Brahma" — the bright star of the north-eastern winter sky.', '"ब्रह्मा का हृदय" — शीतकाल के उत्तर-पूर्वी आकाश का उज्ज्वल तारा।') },
  ];

  const rashis = [
    { en: 'Mesha', iast: 'Meṣa', hi: 'मेष', west: 'Aries', lord: 'mangala', el: 'agni', symbol: T('Ram', 'मेढ़ा') },
    { en: 'Vrishabha', iast: 'Vṛṣabha', hi: 'वृषभ', west: 'Taurus', lord: 'shukra', el: 'prithvi', symbol: T('Bull', 'बैल') },
    { en: 'Mithuna', iast: 'Mithuna', hi: 'मिथुन', west: 'Gemini', lord: 'budha', el: 'vayu', symbol: T('Couple', 'युगल') },
    { en: 'Karka', iast: 'Karka', hi: 'कर्क', west: 'Cancer', lord: 'chandra', el: 'jala', symbol: T('Crab', 'केकड़ा') },
    { en: 'Simha', iast: 'Siṃha', hi: 'सिंह', west: 'Leo', lord: 'surya', el: 'agni', symbol: T('Lion', 'सिंह') },
    { en: 'Kanya', iast: 'Kanyā', hi: 'कन्या', west: 'Virgo', lord: 'budha', el: 'prithvi', symbol: T('Maiden', 'कन्या') },
    { en: 'Tula', iast: 'Tulā', hi: 'तुला', west: 'Libra', lord: 'shukra', el: 'vayu', symbol: T('Balance', 'तराज़ू') },
    { en: 'Vrishchika', iast: 'Vṛścika', hi: 'वृश्चिक', west: 'Scorpio', lord: 'mangala', el: 'jala', symbol: T('Scorpion', 'बिच्छू') },
    { en: 'Dhanu', iast: 'Dhanu', hi: 'धनु', west: 'Sagittarius', lord: 'guru', el: 'agni', symbol: T('Bow', 'धनुष') },
    { en: 'Makara', iast: 'Makara', hi: 'मकर', west: 'Capricorn', lord: 'shani', el: 'prithvi', symbol: T('Sea-creature', 'मगर') },
    { en: 'Kumbha', iast: 'Kumbha', hi: 'कुम्भ', west: 'Aquarius', lord: 'shani', el: 'vayu', symbol: T('Water pot', 'घड़ा') },
    { en: 'Meena', iast: 'Mīna', hi: 'मीन', west: 'Pisces', lord: 'guru', el: 'jala', symbol: T('Fish', 'मछली') },
  ];

  const elements = { agni: T('Fire (Agni)', 'अग्नि'), prithvi: T('Earth (Prithvi)', 'पृथ्वी'), vayu: T('Air (Vayu)', 'वायु'), jala: T('Water (Jala)', 'जल') };
  const ganas = { deva: T('Deva', 'देव'), manushya: T('Manushya', 'मनुष्य'), rakshasa: T('Rakshasa', 'राक्षस') };

  // body: astronomy-engine body name; null for computed points (lunar nodes).
  const grahas = {
    surya: { body: 'Sun', en: 'Surya', iast: 'Sūrya', hi: 'सूर्य', west: 'Sun', glyph: '☉', color: '#ffd27a', day: 0,
      rules: [4], exalt: 0, debil: 6, desc: T('The Atman of the cosmos, giver of light and life.', 'जगत की आत्मा, प्रकाश और जीवन के दाता।') },
    chandra: { body: 'Moon', en: 'Chandra', iast: 'Candra', hi: 'चन्द्र', west: 'Moon', glyph: '☾', color: '#e9eefc', day: 1,
      rules: [3], exalt: 1, debil: 7, desc: T('Soma, lord of the mind; he visits one nakshatra — one of his 27 wives — each night.', 'सोम, मन के स्वामी; प्रतिदिन अपनी २७ पत्नियों — नक्षत्रों — में से एक के घर जाते हैं।') },
    mangala: { body: 'Mars', en: 'Mangala', iast: 'Maṅgala', hi: 'मंगल', west: 'Mars', glyph: '♂', color: '#ff7a5c', day: 2,
      rules: [0, 7], exalt: 9, debil: 3, desc: T('Son of Bhumi, the warrior graha of courage and energy.', 'भूमिपुत्र, साहस और ऊर्जा के योद्धा ग्रह।') },
    budha: { body: 'Mercury', en: 'Budha', iast: 'Budha', hi: 'बुध', west: 'Mercury', glyph: '☿', color: '#c9d3e6', day: 3,
      rules: [2, 5], exalt: 5, debil: 11, desc: T('Son of Chandra, graha of intellect, speech and commerce.', 'चन्द्रपुत्र, बुद्धि, वाणी और वाणिज्य के ग्रह।') },
    guru: { body: 'Jupiter', en: 'Guru', iast: 'Guru (Bṛhaspati)', hi: 'गुरु', west: 'Jupiter', glyph: '♃', color: '#ffe3b0', day: 4,
      rules: [8, 11], exalt: 3, debil: 9, desc: T('Brihaspati, preceptor of the devas — wisdom, dharma and grace.', 'बृहस्पति, देवताओं के गुरु — ज्ञान, धर्म और कृपा।') },
    shukra: { body: 'Venus', en: 'Shukra', iast: 'Śukra', hi: 'शुक्र', west: 'Venus', glyph: '♀', color: '#fff6dc', day: 5,
      rules: [1, 6], exalt: 11, debil: 5, desc: T('Shukracharya, preceptor of the asuras — beauty, art and devotion.', 'शुक्राचार्य, असुरों के गुरु — सौन्दर्य, कला और प्रेम।') },
    shani: { body: 'Saturn', en: 'Shani', iast: 'Śani', hi: 'शनि', west: 'Saturn', glyph: '♄', color: '#e8cf8a', day: 6,
      rules: [9, 10], exalt: 6, debil: 0, desc: T('Son of Surya and Chhaya, the slow-moving lord of karma and discipline.', 'सूर्य और छाया के पुत्र, कर्म और अनुशासन के मन्दगामी स्वामी।') },
    rahu: { body: null, en: 'Rahu', iast: 'Rāhu', hi: 'राहु', west: 'North lunar node', glyph: '☊', color: '#9fb4ff',
      desc: T('The ascending lunar node — the head of Svarbhanu, who swallows Surya and Chandra at eclipses.', 'चन्द्रमा का आरोही पात — स्वर्भानु का सिर, जो ग्रहण में सूर्य-चन्द्र को ग्रसता है।') },
    ketu: { body: null, en: 'Ketu', iast: 'Ketu', hi: 'केतु', west: 'South lunar node', glyph: '☋', color: '#c7a6ff',
      desc: T('The descending lunar node — the body of Svarbhanu, karaka of moksha and detachment.', 'चन्द्रमा का अवरोही पात — स्वर्भानु का धड़, मोक्ष और वैराग्य का कारक।') },
    arun: { body: 'Uranus', en: 'Arun', iast: 'Aruṇa', hi: 'अरुण', west: 'Uranus', glyph: '♅', color: '#9ff0ec', modern: true,
      desc: T('Uranus — not among the classical Navagraha.', 'यूरेनस — शास्त्रीय नवग्रहों में सम्मिलित नहीं।') },
    varun: { body: 'Neptune', en: 'Varun', iast: 'Varuṇa', hi: 'वरुण', west: 'Neptune', glyph: '♆', color: '#7fa8ff', modern: true,
      desc: T('Neptune — not among the classical Navagraha.', 'नेप्च्यून — शास्त्रीय नवग्रहों में सम्मिलित नहीं।') },
  };

  const tithis = [
    T('Pratipada', 'प्रतिपदा'), T('Dwitiya', 'द्वितीया'), T('Tritiya', 'तृतीया'), T('Chaturthi', 'चतुर्थी'),
    T('Panchami', 'पंचमी'), T('Shashthi', 'षष्ठी'), T('Saptami', 'सप्तमी'), T('Ashtami', 'अष्टमी'),
    T('Navami', 'नवमी'), T('Dashami', 'दशमी'), T('Ekadashi', 'एकादशी'), T('Dwadashi', 'द्वादशी'),
    T('Trayodashi', 'त्रयोदशी'), T('Chaturdashi', 'चतुर्दशी'), T('Purnima', 'पूर्णिमा'), T('Amavasya', 'अमावस्या'),
  ];
  const pakshas = [T('Shukla', 'शुक्ल'), T('Krishna', 'कृष्ण')];
  const yogas = [
    T('Vishkambha', 'विष्कम्भ'), T('Priti', 'प्रीति'), T('Ayushman', 'आयुष्मान्'), T('Saubhagya', 'सौभाग्य'),
    T('Shobhana', 'शोभन'), T('Atiganda', 'अतिगण्ड'), T('Sukarma', 'सुकर्मा'), T('Dhriti', 'धृति'),
    T('Shula', 'शूल'), T('Ganda', 'गण्ड'), T('Vriddhi', 'वृद्धि'), T('Dhruva', 'ध्रुव'),
    T('Vyaghata', 'व्याघात'), T('Harshana', 'हर्षण'), T('Vajra', 'वज्र'), T('Siddhi', 'सिद्धि'),
    T('Vyatipata', 'व्यतीपात'), T('Variyan', 'वरीयान्'), T('Parigha', 'परिघ'), T('Shiva', 'शिव'),
    T('Siddha', 'सिद्ध'), T('Sadhya', 'साध्य'), T('Shubha', 'शुभ'), T('Shukla', 'शुक्ल'),
    T('Brahma', 'ब्रह्म'), T('Indra', 'इन्द्र'), T('Vaidhriti', 'वैधृति'),
  ];
  const karanas = {
    movable: [T('Bava', 'बव'), T('Balava', 'बालव'), T('Kaulava', 'कौलव'), T('Taitila', 'तैतिल'), T('Gara', 'गर'), T('Vanija', 'वणिज'), T('Vishti (Bhadra)', 'विष्टि (भद्रा)')],
    kimstughna: T('Kimstughna', 'किंस्तुघ्न'), shakuni: T('Shakuni', 'शकुनि'), chatushpada: T('Chatushpada', 'चतुष्पद'), naga: T('Naga', 'नाग'),
  };
  const varas = [T('Ravivara', 'रविवार'), T('Somavara', 'सोमवार'), T('Mangalavara', 'मंगलवार'), T('Budhavara', 'बुधवार'),
    T('Guruvara', 'गुरुवार'), T('Shukravara', 'शुक्रवार'), T('Shanivara', 'शनिवार')];
  const months = [T('Chaitra', 'चैत्र'), T('Vaishakha', 'वैशाख'), T('Jyeshtha', 'ज्येष्ठ'), T('Ashadha', 'आषाढ़'),
    T('Shravana', 'श्रावण'), T('Bhadrapada', 'भाद्रपद'), T('Ashvin', 'आश्विन'), T('Kartika', 'कार्तिक'),
    T('Margashirsha', 'मार्गशीर्ष'), T('Pausha', 'पौष'), T('Magha', 'माघ'), T('Phalguna', 'फाल्गुन')];
  const ritus = [T('Vasanta', 'वसन्त'), T('Grishma', 'ग्रीष्म'), T('Varsha', 'वर्षा'), T('Sharad', 'शरद्'), T('Hemanta', 'हेमन्त'), T('Shishira', 'शिशिर')];
  const ayanas = [T('Uttarayana', 'उत्तरायण'), T('Dakshinayana', 'दक्षिणायन')];

  // Eight directions (dik), starting at north and going clockwise.
  const directions = [T('Uttara', 'उत्तर'), T('Ishanya', 'ईशान'), T('Purva', 'पूर्व'), T('Agneya', 'आग्नेय'),
    T('Dakshina', 'दक्षिण'), T('Nairritya', 'नैऋत्य'), T('Paschima', 'पश्चिम'), T('Vayavya', 'वायव्य')];
  const directionsShort = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return { nakshatras, abhijit, asterisms, stars, rashis, elements, ganas, grahas, tithis, pakshas, yogas, karanas,
    varas, months, ritus, ayanas, directions, directionsShort };
})();
