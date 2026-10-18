# Antariksha — Vedic Sky Map · Living Sanatan

A real-time, Stellarium-style planetarium for the Vedic sky, built for [livingsanatan.com](https://livingsanatan.com).
Point your phone at the sky and the map follows; switch on the camera to see the nakshatras over the real world.

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

Planetary positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (VSOP87/ELP based, accurate to under an arcminute). Panchang results were cross-checked against an independent Jyotish engine for Ujjain on 18 Oct 2026. Tithi and nakshatra end times agreed to within a minute, and yoga, karana, vara, masa and samvat all matched.

## Project layout

```
index.html           app shell
css/app.css          glassmorphism UI
js/sky.js            frames, grahas, Lahiri ayanamsa, Panchang
js/render.js         WebGL sky (atmosphere, Milky Way, ground) + 2D overlay
js/sensors.js        device orientation -> view, rear camera
js/app.js            gestures, time, search, panels, settings
js/vedic.js          nakshatra / rashi / graha / Panchang vocabulary (EN + HI)
js/i18n.js           interface strings (EN + HI)
js/data/*.js         generated star and constellation data
tools/build_data.py  regenerates js/data and img/milkyway.png
```

## Credits

- Star catalogue: [HYG Database](https://github.com/astronexus/HYG-Database) v4.1, CC BY-SA 4.0
- Constellation lines and Milky Way outlines: [d3-celestial](https://github.com/ofrohn/d3-celestial), BSD-3-Clause
- Ephemeris: [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT
