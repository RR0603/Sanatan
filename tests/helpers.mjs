// Loads the browser scripts into Node (they attach to `window`), for the test suite.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { console, Math, Date, Intl, Float32Array, Float64Array, Uint8Array, JSON };
ctx.window = ctx; ctx.screen = { orientation: { angle: 0 } }; ctx.navigator = { languages: ['en'] };
vm.createContext(ctx);
export function load(...files) {
  for (const f of files) vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
let failures = 0;
export function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}
export function done() { if (failures) { console.error(`${failures} check(s) failed`); process.exit(1); } }
