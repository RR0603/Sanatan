// Parses every app script so a typo can't ship.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js');
let n = 0;
for (const f of readdirSync(js).filter((x) => x.endsWith('.js'))) { new vm.Script(readFileSync(join(js, f), 'utf8'), { filename: f }); n++; }
console.log(`✓ ${n} scripts parse`);
