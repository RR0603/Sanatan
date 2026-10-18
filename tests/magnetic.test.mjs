// World Magnetic Model implementation against NOAA's published WMM2015v2 test values.
import { readFileSync } from 'node:fs';
import { load, check, done, ROOT } from './helpers.mjs';
const w = load('js/magnetic.js');
const m = JSON.parse(readFileSync(ROOT + '/tests/wmm-2015v2.json', 'utf8'));
const model = { epoch: m.epoch, g: m.main_field_coeff_g, h: m.main_field_coeff_h, gd: m.secular_var_coeff_g, hd: m.secular_var_coeff_h };
const rows = readFileSync(ROOT + '/tests/wmm-2015v2-testvalues.csv', 'utf8').trim().split('\n').slice(1).map((l) => l.split(',').map(Number));
let worst = 0;
for (const [date, alt, lat, lon, decl] of rows) {
  const d = w.LS.Magnetic.declination(lat, lon, date, alt, model);
  worst = Math.max(worst, Math.abs(((d - decl + 540) % 360) - 180));
}
check(`WMM declination matches ${rows.length} official test values`, worst < 0.2, `worst ${worst.toFixed(3)}°`);
const delhi = w.LS.Magnetic.declination(28.61, 77.21, 2026.8);
check('Delhi declination ~ +1°', delhi > 0 && delhi < 2.5, delhi.toFixed(2) + '°');
done();
