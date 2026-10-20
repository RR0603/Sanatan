# Antariksha — Vedic Sky Map · Living Sanatan

A real-time, Stellarium-style planetarium for the Vedic sky, built for [livingsanatan.com](https://livingsanatan.com).
Point your phone at the sky and the map follows; switch on the camera to see the nakshatras over the real world.

## Four sections, one live sky

Switch between them with the switch at the top. Settings → Design → **Bottom tab bar** (off by default) moves them to a floating bar at the bottom of the screen instead:

- **Sky (Akasha)**: a Stellarium-style planetarium. Drag, zoom, use the sensor or camera, and travel in time. **Tonight** (in the layers sheet) lists the grahas that are up tonight and when to look; tap one and an arrow at the screen edge guides your phone to it.
- **Today**: the day's Panchang for your place. It shows sunrise and sunset, moonrise and moonset, and the Moon's phase. It shows Rahu Kaal, Yamaganda, Gulika Kaal, Abhijit and Brahma Muhurta on a day timeline, with a live "ends in" status. It also has day and night Choghadiya, tonight's planets and upcoming festivals. One tap shares the day as text.
- **Calendar**: a month grid with the tithi at sunrise for every day. It marks every Ekadashi (by name), Purnima, Amavasya, Pradosh, Chaturthi, Masik Shivaratri and Sankranti, 32 major festivals, and solar and lunar eclipses visible from your place. Optional morning reminders run in the apps as local notifications.
- **Jyotish**: the same moment and place as a Vedic chart.
  - **Bhachakra wheel**: the 27 nakshatras with their 108 padas, the 12 rashis as whole-sign bhavas, and the grahas at their true sidereal longitudes. Lagna sits on the eastern horizon (left), so the upper half of the wheel is the sky above you right now. Drag the wheel to travel in time (one turn is one sidereal day); tap a graha to see its drishti.
  - **Kundali**: North Indian or South Indian, Rashi (D1) or Navamsa (D9), with the twelve bhavas, their lords and occupants.
  - **Grahas**: rashi and degree, nakshatra and pada, nakshatra lord, bhava, dignity (uchcha, svakshetra, mitra, sama, shatru, neecha), vakri and asta.
  - **Dasha**: Vimshottari mahadashas and antardashas, with the period running today highlighted.
  - **Birth**: enter a birth date, time and place to cast a Janma Kundali. "See this sky" then shows the actual sky at that moment.
  - **Milan**: Ashtakoota (36 guna) matching of two birth charts, with each koota explained and a Mangal dosha check.

**Options menu** (the layers button, bottom left) also holds four experiences:

- **Ratri** (रात्रि): a night mode that re-dresses the whole app in midnight and gold. It brings serif titles, gilded hairlines, panels that bloom into view, drifting star-dust, shooting stars and glowing ripples where you touch. It is switched on through a golden veil from where you tapped. It works over either design (also in Settings → Design).
- **Nada** (नाद): a generative tanpura drone (Pa · Sa · Sa · low Sa) tuned to Sa = 136.1 Hz, with temple bells when you select or find a graha. It is pure Web Audio and pauses with the app.
- **Ulka** (उल्का): the ten major annual meteor showers. While one is active, its radiant is marked in the sky and meteors streak away from it, faster at the peak. The Tonight list shows the active or next shower.
- **Yatra** (यात्रा): a 45-second cinematic time-lapse of tonight, from sunset to sunrise. It shows letterbox captions for darkness, each graha rising and setting, Brahma Muhurta and dawn.

The Time panel has a close button.

**First-run hints**: on phones, a little star mascot points at the compass button for six seconds ("Tap me, then point your phone at the sky"). About 13 seconds in, a glowing camera button invites you to try the AR view. Each hint stops appearing once that feature has been used, and shows at most once per session.

**Design**: Settings → Design switches between **Nova** (the default) and **Classic**:

- **Nova**: liquid glass and aurora accents.
- **Classic**: the original look.

### How festivals are worked out

Observances follow the amanta lunar month and the tithi that prevails at the time each one is kept:

| Time rule | Observances |
| --- | --- |
| Sunrise (udaya tithi) | Most festivals, Ekadashi |
| Midday | Rama Navami, Ganesh Chaturthi |
| Afternoon | Dussehra, Bhai Dooj |
| Evening (pradosh) | Diwali, Dhanteras, Pradosh |
| Midnight (nishita) | Janmashtami, Shivaratri |
| Moonrise | Karva Chauth, Sankashti |

- **Kshaya tithis** (a tithi that never prevails at its time rule) are handled: the observance goes to the day on which that tithi falls.
- **Vriddhi tithis** (prevailing at two consecutive rule times) are handled: the first day keeps the observance.
- **Adhika months** are handled: no festivals are placed in them, and their Ekadashis are Padmini and Parama.
- **Raksha Bandhan and Holika Dahan** follow the Bhadra rule.
- **Sankranti** falls on the day the Sun enters the rashi, or on the next day if that happens after sunset.
- **Regional traditions** differ (Smarta and Vaishnava Ekadashi, for example), so the day detail shows each tithi's exact start and end.

## Free and Pro

Almost everything is free: the sky map, sensor and AR camera, Today, the festival calendar and reminders, Tonight and the finder, Kundali Milan, Panchang, Bhachakra, the transit Kundali, graha details, time travel, both designs and both languages.
**Antariksha Pro** is a one-time purchase (₹11 in India, about $3.33 elsewhere) that unlocks the personal features:

- Janma Kundali and the birth-sky view
- Vimshottari Dasha
- Navamsa D9
- Saved family profiles

The iOS and Android apps sell Pro through the App Store and Google Play via [RevenueCat](https://www.revenuecat.com).
The website shows the same paywall with links to the stores. Opening the site with `?preview` unlocks Pro for that tab, for demos.
All launch settings live in `js/config.js`.

## Publishing to the App Store and Google Play

See **[LAUNCH.md](LAUNCH.md)** for the step-by-step map, and [STORE_LISTING.md](STORE_LISTING.md) for the listing text.

- The apps are [Capacitor 8](https://capacitorjs.com) wrappers in `ios/` and `android/`.
- The `Android release` and `iOS release` GitHub Actions build signed releases without a Mac. Run them manually, or push a `v*` tag.
- Store screenshots are in `store/`.

## Naming culture vs. language

Names are a separate setting from the interface language (the ॐ button in the dock, or Settings → Names):

| | Jyotish names | Western names |
| --- | --- | --- |
| Grahas | Surya, Chandra, Mangala… | Sun, Moon, Mars… |
| Rashis | Mesha, Vrishabha… | Aries, Taurus… (still sidereal) |
| Stars | Dhruva, Lubdhaka, Agastya, the Saptarishi… | Polaris, Sirius, Canopus… |
| 88 constellations | Garuda, Hamsa, Vasuki, Yamuna, Saptarishi… | Aquila, Cygnus, Hydra, Eridanus, Ursa Major… |
| Directions | Uttara, Ishanya, Purva… | N, NE, E… |

The interface language (English / हिन्दी) can be combined with either.

## What it shows

- **27 nakshatras + Abhijit**: traditional asterism figures, yogatara rings, devata, symbol, lord and gana.
- **12 sidereal rashis**: the zodiac band, using Lahiri (Chitrapaksha) ayanamsa, plus the 27 nakshatra divisions of 13°20′.
- **Navagraha**: Surya, Chandra (with the correct phase), Mangala, Budha, Guru, Shukra, Shani, Rahu, Ketu, plus Arun and Varun (Uranus and Neptune). Includes vakri (retrograde) flags and sidereal rashi, nakshatra and pada.
- **Panchang** for the chosen place and time: tithi (with end time), nakshatra (with end time), yoga, karana, vara (sunrise to sunrise), amanta masa (with adhika), Vikram and Shaka samvat, ritu, ayana, lagna, sunrise and sunset.
- **Puranic star lore**: Dhruva, the Saptarishi with Arundhati, Agastya, Lubdhaka, Brahmahridaya, Trishanku and Ishu Trikanda.
- About 5,000 stars down to magnitude 6, the Milky Way (Akash Ganga), optional Western constellations, alt-az and equatorial grids, and the eight directions (Uttara, Ishanya, Purva…).

## Using it

| Gesture / control | Action |
| --- | --- |
| Drag, pinch, scroll | Look around, zoom |
| Tap an object | Opens the info card (Center / Track) |
| **Sensor** | The sky follows your phone's motion sensors. In this mode, dragging sideways fine-tunes north. |
| **Camera** | AR mode: the rear camera shows behind a transparent sky. Pinch to match the camera's field of view. |
| Clock in the HUD | Time machine: ±1h/±1d, fast-forward and rewind, a date picker, and Now |
| Tithi in the HUD | Full Panchang card |
| EN / हि | Switches between English and Hindi |
| Night | Red mode that keeps your eyes dark-adapted |
| Hide UI | Hides all controls, leaving the full sky |

Motion sensors and the camera need **HTTPS** (or `localhost`). On iPhone, Safari asks for permission when you first tap Sensor or Camera.

## Running locally

It is a static site with no build step:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Deploy by copying the folder to any static host (GitHub Pages, Netlify, or a folder on livingsanatan.com). The app works offline once it has loaded, through `sw.js`, and can be installed to the home screen.

Native apps and tests:

```sh
npm ci
npm test            # Panchang/chart accuracy, sensor fusion, magnetic model, syntax
npm run sync        # build www/ and copy it into ios/ and android/
npm run android     # open in Android Studio
npm run ios         # open in Xcode (Mac)
```

## Accuracy

Planetary positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (VSOP87/ELP based, accurate to under an arcminute). Results were cross-checked against an independent Jyotish engine:

- **Panchang** (Ujjain, 18 Oct 2026): tithi and nakshatra end times agreed to within a minute; yoga, karana, vara, masa and samvat all matched.
- **Birth chart** (New Delhi, 15 Jun 1990, 06:30): lagna, all nine grahas' rashi, nakshatra, pada, bhava and dignity, and every D9 placement matched exactly. Vimshottari antardasha boundaries matched, and mahadasha boundaries agreed to within about 3 hours.
- **Today timings** (Ujjain, 19 Oct 2026):
  - Sunrise, sunset and moonrise matched to within a second.
  - Rahu Kaal, Yamaganda, Gulika, Abhijit and Brahma Muhurta all matched to within a second.
  - The day Choghadiya matched.
  - Night Choghadiya follows the common Drik order (Sunday night begins with Shubh). Some engines use a different order.
- **Kundali Milan**: three test couples matched KundaliMCP on all eight kootas: 30.5, 23.5 and 6.5 of 36.
- **Festivals**: 2026 dates for New Delhi were checked against KundaliMCP's tithi timings. Examples: Ugadi 19 Mar, Holika Dahan 2 Mar, Raksha Bandhan 28 Aug, Janmashtami 4 Sep, Dussehra 20 Oct and Diwali 8 Nov.

`npm test` runs all of these checks.

## Security and store readiness

- **Ships nothing remote:** the app bundles every file, makes no network calls of its own and runs offline. The only outside service is RevenueCat, inside the native store SDKs. There are no accounts, no tracking and no analytics.
- **Web hardening:** the website has a strict Content-Security-Policy, with no remote scripts and no inline scripts.
- **No HTML injection:** user-entered text (names, profiles) is escaped wherever it is written into the page, and the app starts cleanly even if its saved data is corrupted.
- **Purchases:**
  - Purchases and restores go only through Apple and Google. Pro is never granted from local storage on the website, and the app shows only the store's own price.
  - A failed store load is retried when you tap Buy. A pending purchase and a store outage each get their own clear message.
- **Release workflows:**
  - Workflows run with read-only permissions, pass secrets only to the steps that need them and pin third-party actions to commits.
  - They skip install scripts and run `npm run preflight` before building.
- **Store policies:**
  - iOS has a privacy manifest.
  - Android has no exact alarms, no background location and no cloud backup of birth data.
  - The Android back button closes panels in order before leaving the app.

## Project layout

```
index.html           app shell
css/app.css          glassmorphism UI
js/sky.js            frames, grahas, Lahiri ayanamsa, Panchang
js/jyotish.js        bhavas, dignity, drishti, navamsa, Vimshottari dasha
js/chart.js          Bhachakra wheel + North/South Indian kundali
js/names.js          Jyotish / Western naming culture
js/render.js         WebGL sky (atmosphere, Milky Way, ground) + 2D overlay
js/sensors.js        device orientation -> view, rear camera
js/app.js            gestures, time, search, panels, settings, paywall
js/config.js         launch settings: RevenueCat keys, prices, store links
js/pro.js            Pro entitlement (RevenueCat in the apps, store links on the web)
js/magnetic.js       World Magnetic Model 2025 (true north for the compass)
js/tz.js             civil dates and time zones
js/muhurta.js        Today: sunrise/moonrise, Rahu Kaal, Abhijit, Brahma Muhurta, Choghadiya
js/calendar.js       festivals, Ekadashis, vrats, Sankranti and eclipses
js/milan.js          Ashtakoota (36 guna) matching and Mangal dosha
js/pages.js          Today, Calendar, Tonight + finder, Milan, reminders, share
css/nova.css         Nova design (default); css/app.css is the base and the Classic look
css/ratri.css        Ratri night mode
js/fx.js             star-dust, shooting stars, ripples and meteors (effects layer)
js/nada.js           Nada: generative tanpura drone and bells (Web Audio)
js/ulka.js           meteor showers: dates, radiants, ZHR
js/yatra.js          Yatra: the sunset-to-sunrise night journey
js/vedic.js          nakshatra / rashi / graha / Panchang vocabulary (EN + HI)
js/i18n.js           interface strings (EN + HI)
js/data/*.js         generated star and constellation data
tools/build_data.py  regenerates js/data, img/milkyway.png and img/art
tools/store-screenshots.mjs  regenerates store/ screenshots and the Play feature graphic
privacy.html, terms.html, support.html   legal pages (needed by both stores)
ios/, android/       Capacitor native projects
resources/           source icon and splash (npm run assets)
tests/               accuracy tests (npm test)
.github/workflows/   CI, Android release (AAB → Play), iOS release (→ TestFlight)
```

## Credits

- Star catalogue: [HYG Database](https://github.com/astronexus/HYG-Database) v4.1, CC BY-SA 4.0
- Constellation lines and Milky Way outlines: [d3-celestial](https://github.com/ofrohn/d3-celestial), BSD-3-Clause
- Constellation illustrations: Johan Meuris for [Stellarium](https://github.com/Stellarium/stellarium-skycultures), [Free Art License](https://artlibre.org/licence/lal/en/)
- Magnetic declination: World Magnetic Model 2025 (NOAA / BGS, public domain), coefficients via [geomagnetism](https://github.com/naturalatlas/geomagnetism) (Apache-2.0)
- Ephemeris: [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT
- Fonts: Space Grotesk, Noto Sans Devanagari, JetBrains Mono and Cormorant Garamond, SIL Open Font License 1.1
- Meteor shower data: International Meteor Organization working list
- Native shell: [Capacitor](https://capacitorjs.com), MIT. Purchases: [RevenueCat](https://github.com/RevenueCat/purchases-capacitor), MIT
