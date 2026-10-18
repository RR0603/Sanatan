# Antariksha — Vedic Sky Map · Living Sanatan

A real-time, Stellarium-style planetarium for the Vedic sky, built for [livingsanatan.com](https://livingsanatan.com).
Point your phone at the sky and the map follows; switch on the camera to see the nakshatras over the real world.

## Two modes, one live sky

Switch between them with the toggle in the top bar:

- **Akasha (Sky)**: a Stellarium-style planetarium. Drag, zoom, use the sensor or camera, and travel in time.
- **Jyotish**: the same moment and place as a Vedic chart.
  - **Bhachakra wheel**: the 27 nakshatras with their 108 padas, the 12 rashis as whole-sign bhavas, and the grahas at their true sidereal longitudes. Lagna sits on the eastern horizon (left), so the upper half of the wheel is the sky above you right now. Drag the wheel to travel in time (one turn is one sidereal day); tap a graha to see its drishti.
  - **Kundali**: North Indian or South Indian, Rashi (D1) or Navamsa (D9), with the twelve bhavas, their lords and occupants.
  - **Grahas**: rashi and degree, nakshatra and pada, nakshatra lord, bhava, dignity (uchcha, svakshetra, mitra, sama, shatru, neecha), vakri and asta.
  - **Dasha**: Vimshottari mahadashas and antardashas, with the period running today highlighted.
  - **Birth**: enter a birth date, time and place to cast a Janma Kundali. "See this sky" then shows the actual sky at that moment.

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

## Accuracy

Planetary positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (VSOP87/ELP based, accurate to under an arcminute). Results were cross-checked against an independent Jyotish engine:

- **Panchang** (Ujjain, 18 Oct 2026): tithi and nakshatra end times agreed to within a minute; yoga, karana, vara, masa and samvat all matched.
- **Birth chart** (New Delhi, 15 Jun 1990, 06:30): lagna, all nine grahas' rashi, nakshatra, pada, bhava and dignity, and every D9 placement matched exactly. Vimshottari antardasha boundaries matched, and mahadasha boundaries agreed to within about 3 hours.

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
js/app.js            gestures, time, search, panels, settings
js/vedic.js          nakshatra / rashi / graha / Panchang vocabulary (EN + HI)
js/i18n.js           interface strings (EN + HI)
js/data/*.js         generated star and constellation data
tools/build_data.py  regenerates js/data, img/milkyway.png and img/art
```

## Credits

- Star catalogue: [HYG Database](https://github.com/astronexus/HYG-Database) v4.1, CC BY-SA 4.0
- Constellation lines and Milky Way outlines: [d3-celestial](https://github.com/ofrohn/d3-celestial), BSD-3-Clause
- Constellation illustrations: Johan Meuris for [Stellarium](https://github.com/Stellarium/stellarium-skycultures), [Free Art License](https://artlibre.org/licence/lal/en/)
- Magnetic declination: World Magnetic Model 2025 (NOAA / BGS, public domain), coefficients via [geomagnetism](https://github.com/naturalatlas/geomagnetism) (Apache-2.0)
- Ephemeris: [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT
