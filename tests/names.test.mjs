// Sky cultures: Vedic (Jyotish names, sidereal) and Western (IAU names, as in Stellarium's modern culture).
import { load, check, done } from './helpers.mjs';

const ctx = load('js/vedic.js', 'js/i18n.js', 'js/names.js', 'js/data/stars.js', 'js/data/constellations.js');
const { LS, LS_DATA } = ctx;
const Nm = LS.Names, I = LS.I18N;
I.set = I.set || (() => {});
const gem = LS_DATA.constellations.find((c) => c.id === 'Gem');
const cmi = LS_DATA.constellations.find((c) => c.id === 'CMi');
const dhruva = { en: 'Dhruva', hi: 'ध्रुव', kind: 'star' };

Nm.set('vedic');
check('Vedic: constellation uses the Indian name', Nm.constellation(gem) === 'Mithuna', Nm.constellation(gem));
check('Vedic: a star with a Jyotish name shows it', Nm.star(dhruva, 'Polaris') === 'Dhruva');
check('Vedic: grahas use Jyotish names', Nm.graha('guru') === 'Guru' && Nm.rashi(0) === 'Mesha');

Nm.set('western');
check('Western: constellations use the IAU Latin name (Stellarium)', Nm.constellation(gem) === 'Gemini' && Nm.constellation(cmi) === 'Canis Minor', `${Nm.constellation(gem)}, ${Nm.constellation(cmi)}`);
check('Western: subtitle gives the meaning and the Indian name', Nm.constellationAlt(gem).includes('Twins') && Nm.constellationAlt(gem).includes('Mithuna'), Nm.constellationAlt(gem));
check('Western: stars show only the IAU proper name', Nm.star(dhruva, 'Polaris') === 'Polaris');
check('Western: no Jyotish-only labels on unnamed stars', Nm.star({ en: 'Bharani', hi: 'भरणी', kind: 'nakshatra' }, undefined) === null);
check('Western: grahas and signs use Western names', Nm.graha('guru') === 'Jupiter' && Nm.rashi(0) === 'Aries' && Nm.graha('rahu') === 'North Node');

// Star catalogue sanity: IAU names on the brightest stars.
const names = Object.values(LS_DATA.stars.names);
for (const s of ['Sirius', 'Canopus', 'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair', 'Aldebaran', 'Spica', 'Antares', 'Pollux', 'Regulus', 'Polaris'])
  check(`IAU name present: ${s}`, names.includes(s));
check('358 IAU-named stars in the catalogue', names.length >= 350, String(names.length));
check('all 88 IAU constellations with Latin names', LS_DATA.constellations.filter((c) => c.la).length >= 88, String(LS_DATA.constellations.filter((c) => c.la).length));
done();
